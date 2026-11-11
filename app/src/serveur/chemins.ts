import "server-only";
import type { Enseignant } from "./adulte";
import { assurerOrdre, retoucherDepuisLePlan } from "./copie";
import { estUuid } from "./recit";
import { estAuto, estChoix, estRenvoi, LIBELLE_MAX, nettoyerTexte, nouvelId, tirerConstruction, type Choix, type ChoixAuto, type Texte } from "@/domaine/copie";
import { constructionsUtiles, estConstruction, estFormuleRenvoi, type Construction } from "@/domaine/preparation";

/**
 * Construire dans « Chemins » (F03.1, F03-AC52 à AC57) : ce que les gestes du schéma demandent
 * à la base. Une scène et le choix qui y mène se créent d'un seul tenant ; un choix se pose à
 * la fin du texte de la scène d'où il part, sans l'ouvrir, et celui qui l'écrit n'est pas
 * arrêté (F08-AC44). La base revérifie à qui est le chapitre.
 */

type ErreurDeBase = { code?: string; message: string } | null;
/** `dit` : ce qu'on répond à la personne ; sinon `base`, l'erreur de la base, que l'action traduit. */
export type EchecDuPlan = { ok: false; dit?: string; base?: ErreurDeBase };
const refus = (dit: string): EchecDuPlan => ({ ok: false, dit });

const propre = (texte: unknown, max: number): string => String(texte ?? "").trim().replace(/\s+/g, " ").slice(0, max);

/** Une nouvelle scène du plan : `cle` la nomme le temps de l'appel, pour y relier des choix. */
export type SceneAAjouter = { cle: string; titre: string; consigne?: string; verification?: string[] };
/** Un choix à poser : d'une scène du chapitre, ou d'une nouvelle, vers une scène du chapitre, ou une nouvelle. */
export type ChoixAAjouter = { de: string; vers: string; libelle: string };
export type AjoutAuPlan = {
  ok: true; projetId: string;
  scenes: { cle: string; id: string; reference: number; titre: string | null }[];
  /** Pour chaque choix demandé, dans l'ordre : la scène d'où il part et l'identité de sa phrase */
  choix: { de: string; id: string }[];
};

/** Les constructions qui servent dans ce projet : un nouveau choix en tire une, et la garde (F05-AC11). */
async function constructionsDuProjet(e: Enseignant, projetId: string): Promise<Construction[]> {
  const { data } = await e.supabase.from("preparations").select("formule_renvoi, constructions").eq("projet_id", projetId).maybeSingle();
  const cochees = (((data?.constructions as string[] | null) ?? []).filter(estConstruction)) as Construction[];
  return constructionsUtiles(estFormuleRenvoi(data?.formule_renvoi) ? data.formule_renvoi : "rends", cochees.length ? cochees : ["neutre"]);
}

/**
 * Ajoute au plan d'un chapitre des scènes et des choix, d'un seul tenant : « + » sous une
 * scène (une scène, un choix), un lien tiré (un choix), et plus tard un bloc de scènes (F13.7).
 */
export async function ajouterAuPlan(e: Enseignant, chapitreId: string, scenes: SceneAAjouter[], choix: ChoixAAjouter[]): Promise<AjoutAuPlan | EchecDuPlan> {
  if (!estUuid(chapitreId)) return refus("Ce chapitre n’existe pas.");
  const { data: chapitre } = await e.supabase.from("chapitres").select("projet_id").eq("id", chapitreId).maybeSingle();
  const projetId = chapitre?.projet_id as string | undefined;
  if (!projetId) return refus("Ce chapitre n’existe pas.");
  const libelles = choix.map((c) => propre(c.libelle, LIBELLE_MAX));
  if (libelles.some((l) => l === "")) return refus("Écrivez ce que fait le lecteur.");
  const utiles = await constructionsDuProjet(e, projetId);
  const blocs: ChoixAuto[] = libelles.map((libelle) => ({
    type: "choix", id: nouvelId(), auto: true, libelle, construction: tirerConstruction(utiles), cible: null, children: [{ text: "" }],
  }));
  const titres = scenes.map((s) => propre(s.titre, 120));
  const { data, error } = await e.supabase.rpc("ajouter_au_plan", {
    p_chapitre: chapitreId,
    p_scenes: scenes.map((s, i) => ({ cle: s.cle, titre: titres[i], consigne: s.consigne ?? "", verification: s.verification ?? [] })),
    p_choix: choix.map((c, i) => ({ de: c.de, vers: c.vers, bloc: blocs[i] })),
  });
  if (error) return { ok: false, base: error };
  const creees = ((data as { scenes?: { cle: string; id: string; reference: number }[] } | null)?.scenes ?? []);
  // Un premier renvoi vient d'être posé : l'ordre du livre s'établit, comme pour un choix écrit dans la scène (F05-AC34)
  if (choix.length) await assurerOrdre(e.supabase, projetId);
  const idDe = (nom: string): string => creees.find((s) => s.cle === nom)?.id ?? nom;
  return {
    ok: true, projetId,
    scenes: creees.map((s) => ({ ...s, titre: titres[scenes.findIndex((x) => x.cle === s.cle)] || null })),
    choix: choix.map((c, i) => ({ de: idDe(c.de), id: blocs[i].id })),
  };
}

/**
 * « + » sous une scène (F03-AC52) : une nouvelle scène à la fin du chapitre, sans texte, consigne
 * ni élève, et le choix qui y mène, à la fin du texte de la scène d'où l'on part. Sans titre
 * donné, la scène prend celui du choix, comme une scène créée depuis la copie (F05-AC12).
 */
export const ajouterSceneApres = (e: Enseignant, chapitreId: string, de: string, libelle: string, titre: string): Promise<AjoutAuPlan | EchecDuPlan> =>
  ajouterAuPlan(e, chapitreId, [{ cle: "nouvelle", titre: propre(titre, 120) || propre(libelle, 120) }], [{ de, vers: "nouvelle", libelle }]);

/** La phrase de choix d'un texte qui porte ce renvoi : la phrase automatique elle-même, ou la phrase écrite qui le contient. */
const phraseDuRenvoi = (texte: Texte, renvoiId: string): Choix | undefined =>
  texte.filter(estChoix).find((b) => (estAuto(b) ? b.id === renvoiId : b.children.some((x) => estRenvoi(x) && x.id === renvoiId)));

/**
 * « Supprimer » un choix depuis le schéma (F03-AC56) : sa phrase quitte le texte de la scène
 * d'où il part ; la scène où il menait reste. Rend la phrase retirée, pour « Annuler ». Une
 * phrase écrite à la main qui mène à plusieurs scènes ne se retire pas d'ici : elle emporterait
 * ses autres chemins.
 */
export async function retirerChoix(e: Enseignant, sceneId: string, renvoiId: string): Promise<{ ok: true; projetId: string; bloc: Choix } | EchecDuPlan> {
  if (!estUuid(sceneId) || !estUuid(renvoiId)) return refus("Ce choix n’est plus dans la scène.");
  const { data } = await e.supabase.from("scenes").select("texte, projet_id").eq("id", sceneId).is("supprime_le", null).maybeSingle();
  const bloc = data ? phraseDuRenvoi((data.texte ?? []) as Texte, renvoiId) : undefined;
  if (!data || !bloc) return refus("Ce choix n’est plus dans la scène.");
  if (!estAuto(bloc) && bloc.children.filter(estRenvoi).length > 1) return refus("Cette phrase mène à plusieurs scènes : ouvrez la scène pour la modifier.");
  const fait = await retoucherDepuisLePlan(e, sceneId, { retire: [bloc.id] });
  if (!fait.ok) return { ok: false, base: fait.erreur };
  return { ok: true, projetId: data.projet_id as string, bloc };
}

/**
 * Relier un choix « Sans destination » en tirant son onglet jusqu'à une scène du chapitre (F03-AC67) :
 * il y mène désormais, sa phrase et sa place dans le texte inchangées, et celui qui écrit la scène
 * n'est pas arrêté (F08-AC44). Sans destination donnée, c'est « Annuler » : il redevient sans destination.
 */
export async function relierChoix(e: Enseignant, sceneId: string, renvoiId: string, cible: string | null): Promise<{ ok: true; projetId: string } | EchecDuPlan> {
  if (!estUuid(sceneId) || !estUuid(renvoiId) || (cible !== null && !estUuid(cible))) return refus("Ce choix n’est plus dans la scène.");
  const { data } = await e.supabase.from("scenes").select("projet_id").eq("id", sceneId).is("supprime_le", null).maybeSingle();
  if (!data) return refus("Cette scène n’existe plus.");
  const { error } = await e.supabase.rpc("relier_depuis_le_plan", { p_scene: sceneId, p_renvoi: renvoiId, p_cible: cible });
  if (error) return { ok: false, base: error };
  // Un premier renvoi vient d'être posé : l'ordre du livre s'établit, comme pour un choix écrit dans la scène (F05-AC34)
  if (cible) await assurerOrdre(e.supabase, data.projet_id as string);
  return { ok: true, projetId: data.projet_id as string };
}

/** « Annuler » la suppression d'un choix : sa phrase revient à la fin du texte de la scène. */
export async function remettreChoix(e: Enseignant, sceneId: string, bloc: unknown): Promise<{ ok: true; projetId: string } | EchecDuPlan> {
  const phrase = (nettoyerTexte([bloc]) ?? []).filter(estChoix);
  if (!estUuid(sceneId) || phrase.length !== 1) return refus("Ce choix n’a pas pu être remis.");
  const { data } = await e.supabase.from("scenes").select("projet_id").eq("id", sceneId).is("supprime_le", null).maybeSingle();
  if (!data) return refus("Cette scène n’existe plus.");
  const fait = await retoucherDepuisLePlan(e, sceneId, { ajoute: phrase });
  return fait.ok ? { ok: true, projetId: data.projet_id as string } : { ok: false, base: fait.erreur };
}

/**
 * « Annuler » un ajout fait depuis le schéma : les choix quittent le texte de leur scène, et les
 * scènes créées avec eux rejoignent la corbeille du projet, comme toute scène annulée.
 */
export async function annulerAjout(e: Enseignant, choix: { de: string; id: string }[], scenes: string[]): Promise<{ ok: true; projetId: string | null } | EchecDuPlan> {
  if (![...choix.flatMap((c) => [c.de, c.id]), ...scenes].every(estUuid)) return refus("Cet ajout n’a pas pu être annulé.");
  let projetId: string | null = null;
  for (const de of new Set(choix.map((c) => c.de))) {
    // Une scène créée par l'ajout part à la corbeille avec ses choix : rien à en retirer
    if (scenes.includes(de)) continue;
    const fait = await retoucherDepuisLePlan(e, de, { retire: choix.filter((c) => c.de === de).map((c) => c.id) });
    if (!fait.ok) return { ok: false, base: fait.erreur };
  }
  for (const id of scenes) {
    const { data } = await e.supabase.from("scenes").select("projet_id").eq("id", id).maybeSingle();
    projetId = (data?.projet_id as string | undefined) ?? projetId;
    const { error } = await e.supabase.rpc("supprimer_element", { p_sorte: "scene", p_id: id });
    if (error) return { ok: false, base: error };
  }
  if (!projetId && choix[0]) {
    const { data } = await e.supabase.from("scenes").select("projet_id").eq("id", choix[0].de).maybeSingle();
    projetId = (data?.projet_id as string | undefined) ?? null;
  }
  return { ok: true, projetId };
}
