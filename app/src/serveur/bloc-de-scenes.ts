import "server-only";
import {
  BLOC, CLE_NOUVELLE, elaguer, lireReglagesBloc, type ChoixPropose, type Proposition, type ReglagesBloc, type Reponse, type SceneProposee,
} from "@/domaine/bloc-de-scenes";
import { cheminsDuPlan } from "@/domaine/chemins";
import { LIBELLE_MAX } from "@/domaine/copie";
import { paragraphesACorriger } from "@/domaine/correction";
import { chapitresDe, referenceScene } from "@/domaine/recit";
import { listePropre } from "@/domaine/verification";
import type { Enseignant } from "./adulte";
import { ajouterAuPlan, annulerAjout, type EchecDuPlan } from "./chemins";
import { texteDeScene } from "./copie";
import { blocDeScenes, type EntreeBloc } from "./ia/aides/bloc-de-scenes";
import { carnetDe, histoireDuProjet } from "./ia/aides/contexte";
import { demanderUneAide } from "./ia/demander";
import { finPourLesIdees, PAS_DE_CHOIX } from "./idees-de-choix";
import { projetDe } from "./lectures";
import { estUuid, planDe, preparationDe } from "./recit";

/**
 * Le bloc de scènes (F13.7), côté serveur. La demande : le serveur relit lui-même ce qui part —
 * la Préparation, le résumé du chapitre, les titres, consignes et choix de ses scènes, le texte
 * de la scène d'origine, la demande et les réponses de l'adulte ; jamais un prénom d'élève (F13,
 * ce qui est transmis) — et rend une proposition, sans rien écrire (F13-AC34). L'ajout : la
 * proposition retouchée, relue de nouveau sans confiance, entre au chapitre d'un seul tenant par
 * `ajouter_au_plan` ; le bloc ne fait qu'ajouter (F13-AC39), et celui qui écrit la scène
 * d'origine n'est pas arrêté (F08-AC44).
 */

/** Les scènes du chapitre qui partent, au plus : un grand chapitre ne noie pas la demande. */
export const SCENES_ENVOYEES = 60;

export type ReponseBloc = { ok: true; proposition: Proposition; solde: string | null } | { ok: false; message: string };

const propre = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const long = (v: unknown, max: number): string => (typeof v === "string" ? v.replace(/[ \t]+/g, " ").trim().slice(0, max) : "");

/** Les réglages du bloc de l'adulte, gardés avec son compte (F13.7). */
export async function reglagesDuBloc(e: Enseignant): Promise<ReglagesBloc> {
  const { data } = await e.supabase.from("enseignants").select("reglages_bloc").eq("id", e.id).maybeSingle();
  return lireReglagesBloc(data?.reglages_bloc);
}

export async function enregistrerReglagesDuBloc(e: Enseignant, brut: unknown): Promise<boolean> {
  const { error } = await e.supabase.from("enseignants").update({ reglages_bloc: lireReglagesBloc(brut) }).eq("id", e.id);
  return !error;
}

/** Les questions et réponses que la page redit, relues sans confiance. */
export function lireReponses(brut: unknown): Reponse[] {
  if (!Array.isArray(brut)) return [];
  return brut.flatMap((r): Reponse[] => {
    const o = r && typeof r === "object" ? (r as Record<string, unknown>) : {};
    const question = propre(o.question, 240);
    const reponse = long(o.reponse, BLOC.reponse);
    return question && reponse ? [{ question, reponse }] : [];
  }).slice(0, BLOC.questions);
}

type Contexte = { projetId: string; chapitreId: string; origine: string | null; scenes: Set<string>; consigneOrigine: string | null };

/** Le chapitre, en récit à choix, et sa scène d'origine si elle y est ; null sinon. */
async function lireLeChapitre(e: Enseignant, chapitreId: string, origine: string | null) {
  if (!estUuid(chapitreId) || (origine !== null && !estUuid(origine))) return null;
  const { data: c } = await e.supabase.from("chapitres").select("projet_id, titre, resume").eq("id", chapitreId).is("supprime_le", null).maybeSingle();
  if (!c) return null;
  const projet = await projetDe(e, c.projet_id as string);
  if (!projet) return null;
  const plan = await planDe(e, projet.id);
  const chapitre = chapitresDe(plan).find((x) => x.id === chapitreId);
  if (!chapitre) return null;
  if (origine !== null && !chapitre.scenes.some((s) => s.id === origine)) return null;
  return { projet, plan, chapitre, resume: (c.resume as string | null)?.trim() || undefined };
}

/**
 * « ✦ Proposer » (F13-AC34) : une proposition pour le bloc qui part de `origine` (null dans un
 * chapitre vide), d'après la demande, les réponses de l'adulte et la proposition à l'écran.
 */
export async function demanderUnBloc(
  e: Enseignant,
  chapitreId: string,
  options: { origine: unknown; demande: unknown; reponses?: unknown; actuelle?: unknown },
): Promise<ReponseBloc> {
  const origine = typeof options.origine === "string" ? options.origine : null;
  const demande = long(options.demande, BLOC.demande);
  if (!demande) return { ok: false, message: "Décrivez ce que vous voulez construire." };
  const lu = await lireLeChapitre(e, chapitreId, origine);
  if (!lu) return { ok: false, message: origine ? "Cette scène n’est plus dans le chapitre." : "Ce chapitre n’existe plus." };
  if (lu.projet.recit !== "choix") return { ok: false, message: PAS_DE_CHOIX };

  const chemins = cheminsDuPlan(lu.plan, chapitreId, lu.projet.id);
  const refDe = new Map(chemins.noeuds.map((n) => [n.id, referenceScene(n.reference)]));
  const scenes = chemins.noeuds.slice(0, SCENES_ENVOYEES).map((n) => ({
    id: n.id, ref: refDe.get(n.id)!, titre: n.titre?.trim() || "Sans titre",
    consigne: n.consigne?.trim().slice(0, 300) || undefined,
    choix: chemins.liens.filter((l) => l.de === n.id && !l.cache).map((l) => ({
      libelle: l.libelle || "sans libellé",
      vers: l.vers ? (refDe.get(l.vers) ?? "?") : l.ailleurs ? `un autre chapitre (${l.ailleurs.chapitre})` : "nulle part encore",
    })),
  }));
  // La scène d'origine part toujours, même au-delà des soixante
  if (origine && !scenes.some((s) => s.id === origine)) {
    const n = chemins.noeuds.find((x) => x.id === origine)!;
    scenes.push({ id: n.id, ref: refDe.get(n.id)!, titre: n.titre?.trim() || "Sans titre", consigne: n.consigne?.trim().slice(0, 300) || undefined, choix: [] });
  }
  const noeud = origine ? chemins.noeuds.find((n) => n.id === origine) : undefined;
  const [preparation, reglages, texte] = await Promise.all([
    preparationDe(e, lu.projet.id),
    reglagesDuBloc(e),
    origine ? texteDeScene(e, origine) : Promise.resolve(null),
  ]);

  const entree: EntreeBloc = {
    histoire: histoireDuProjet(lu.projet),
    carnet: carnetDe(preparation),
    chapitre: { titre: lu.chapitre.titre, resume: lu.resume },
    scenes,
    origine: noeud
      ? {
        id: noeud.id, ref: refDe.get(noeud.id)!, titre: noeud.titre?.trim() || "Sans titre",
        consigne: noeud.consigne?.trim().slice(0, 1500) || null,
        paragraphes: texte ? finPourLesIdees(paragraphesACorriger(texte.texte).map((p) => p.texte)) : [],
      }
      : null,
    demande,
    reglages,
    reponses: lireReponses(options.reponses),
    actuelle: options.actuelle ? (lireLaProposition(options.actuelle, contexteDe(lu.projet.id, chapitreId, origine, chemins.noeuds, noeud?.consigne)) ?? undefined) : undefined,
  };
  const r = await demanderUneAide(e, blocDeScenes, entree);
  if (!r.ok) return { ok: false, message: r.message };
  return { ok: true, proposition: r.valeur, solde: r.reste };
}

const contexteDe = (projetId: string, chapitreId: string, origine: string | null, noeuds: { id: string }[], consigneOrigine: string | undefined): Contexte => ({
  projetId, chapitreId, origine, scenes: new Set(noeuds.map((n) => n.id)), consigneOrigine: consigneOrigine?.trim() || null,
});

/**
 * La proposition que la page renvoie, retouchée par l'adulte, relue sans confiance : des clés de
 * nouvelles scènes, des choix qui partent de la scène d'origine ou d'une nouvelle scène et mènent
 * à une nouvelle scène ou à une scène du chapitre, les bornes du bloc.
 */
export function lireLaProposition(brut: unknown, c: Pick<Contexte, "origine" | "scenes">): Proposition | null {
  const o = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : null;
  if (!o || !Array.isArray(o.scenes) || !Array.isArray(o.choix)) return null;
  const scenes: SceneProposee[] = [];
  for (const b of o.scenes.slice(0, 20)) {
    const s = b && typeof b === "object" ? (b as Record<string, unknown>) : {};
    const cle = propre(s.cle, 4);
    if (!CLE_NOUVELLE.test(cle) || scenes.some((x) => x.cle === cle)) continue;
    scenes.push({
      cle, titre: propre(s.titre, 120), consigne: long(s.consigne, 4000),
      liste: listePropre(Array.isArray(s.liste) ? s.liste.filter((x): x is string => typeof x === "string").map((x) => propre(x, 80)) : []),
      inventee: s.inventee === true,
    });
  }
  const nouvelles = new Set(scenes.map((s) => s.cle));
  const choix: ChoixPropose[] = [];
  for (const b of o.choix.slice(0, 60)) {
    const x = b && typeof b === "object" ? (b as Record<string, unknown>) : {};
    const de = propre(x.de, 40);
    const vers = propre(x.vers, 40);
    const okDe = nouvelles.has(de) || (c.origine !== null && de === c.origine);
    const okVers = nouvelles.has(vers) || c.scenes.has(vers);
    if (!okDe || !okVers || de === vers) continue;
    choix.push({ cle: `C${choix.length + 1}`, de, vers, libelle: propre(x.libelle, LIBELLE_MAX), invente: x.invente === true });
  }
  const { bloc } = elaguer({ origine: c.origine, scenes, choix });
  const co = o.consigneOrigine && typeof o.consigneOrigine === "object" ? (o.consigneOrigine as Record<string, unknown>) : null;
  const consigne = co ? long(co.consigne, 4000) : "";
  return {
    ...bloc,
    consigneOrigine: consigne && c.origine ? { consigne, liste: listePropre(Array.isArray(co?.liste) ? co.liste.filter((x): x is string => typeof x === "string") : []) } : null,
    questions: [], reste: null,
  };
}

export type BlocAjoute = {
  ok: true; projetId: string;
  scenes: { cle: string; id: string; reference: number; titre: string | null }[];
  choix: { de: string; id: string }[];
  /** La consigne proposée, prise pour la scène d'origine, qui n'en avait pas ; « Annuler » la retire */
  consignePrise: string | null;
};

/**
 * « Ajouter 4 scènes et 3 choix » (F13-AC38) : les nouvelles scènes à la fin du chapitre, avec
 * leur titre et, si elle est là, leur consigne et sa liste, sans texte, élève ni image ; les
 * choix à la fin du texte de leur scène. La consigne proposée pour la scène d'origine ne se pose
 * que si l'adulte la prend et que la scène n'en a toujours pas (F13-AC39).
 */
export async function ajouterUnBloc(
  e: Enseignant, chapitreId: string, brut: unknown, options: { prendreConsigne?: boolean } = {},
): Promise<BlocAjoute | EchecDuPlan> {
  const o = brut && typeof brut === "object" ? (brut as Record<string, unknown>) : {};
  const origine = typeof o.origine === "string" ? o.origine : null;
  const lu = await lireLeChapitre(e, chapitreId, origine);
  if (!lu) return { ok: false, dit: origine ? "Cette scène n’est plus dans le chapitre." : "Ce chapitre n’existe plus." };
  const p = lireLaProposition(brut, { origine, scenes: new Set(lu.chapitre.scenes.map((s) => s.id)) });
  if (!p || (!p.scenes.length && !p.choix.length)) return { ok: false, dit: "Ce bloc est vide : il n’y a rien à ajouter." };
  if (p.scenes.some((s) => !s.titre)) return { ok: false, dit: "Donnez un titre à chaque nouvelle scène." };
  if (p.choix.some((c) => !c.libelle)) return { ok: false, dit: "Écrivez ce que fait le lecteur pour chaque choix." };

  const fait = await ajouterAuPlan(
    e, chapitreId,
    p.scenes.map((s) => ({ cle: s.cle, titre: s.titre, consigne: s.consigne, verification: s.liste })),
    p.choix.map((c) => ({ de: c.de, vers: c.vers, libelle: c.libelle })),
  );
  if (!fait.ok) return fait;

  let consignePrise: string | null = null;
  const scene = origine ? lu.chapitre.scenes.find((s) => s.id === origine) : undefined;
  if (options.prendreConsigne && p.consigneOrigine && scene && !scene.consigne?.trim()) {
    // Seulement si elle n'en a toujours pas : une consigne écrite entre-temps reste (F13.7, « Le bloc ajoute seulement »)
    const { data } = await e.supabase
      .from("scenes").update({ consigne: p.consigneOrigine.consigne, verification: p.consigneOrigine.liste }).eq("id", scene.id).eq("consigne", "").select("id");
    consignePrise = data?.length ? p.consigneOrigine.consigne : null;
  }
  return { ...fait, consignePrise };
}

/**
 * « Annuler » un bloc ajouté : ses choix quittent le texte de leur scène, ses scènes rejoignent la
 * corbeille, et la consigne prise pour la scène d'origine s'efface si personne ne l'a changée.
 */
export async function annulerUnBloc(
  e: Enseignant, choix: { de: string; id: string }[], scenes: string[], consigne?: { scene: string; texte: string },
): Promise<{ ok: true; projetId: string | null } | EchecDuPlan> {
  const fait = await annulerAjout(e, choix, scenes);
  if (!fait.ok) return fait;
  if (consigne && estUuid(consigne.scene)) {
    await e.supabase.from("scenes").update({ consigne: "", verification: [] }).eq("id", consigne.scene).eq("consigne", consigne.texte);
  }
  return fait;
}
