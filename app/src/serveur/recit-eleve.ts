import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Eleve } from "@/domaine/eleves";
import type { Plage } from "@/domaine/horaires";
import type { Livre, SceneConnue } from "@/composants/copie/contexte";
import { ciblesDe, type Droits, type Motif, type Texte } from "@/domaine/copie";
import { numeroter, type PlanNumerote } from "@/domaine/numeros";
import { estConstruction, estFormuleRenvoi, type Construction } from "@/domaine/preparation";
import type { Profil, Repere } from "@/domaine/recit";
import { nomPourLesEleves } from "./adulte";
import { clientDuPoste, etatDuPoste, type EtatPoste } from "./poste";
import { estUuid } from "./recit";

/**
 * Ce que lit un élève depuis son poste. Toutes ces lectures passent par l'accès du poste :
 * la base ne lui rend que le récit de sa classe, les scènes de ses chapitres, et rien de
 * la préparation (F06.2, F02-AC04).
 */

export type ContexteEleve = {
  poste: EtatPoste;
  classe: { nom: string; horairesLimites: boolean };
  /** Nom que les élèves lisent : « Mme Laurent », ou « ton enseignant(e) » */
  prof: string;
  nomAffiche: string | null;
  eleves: Eleve[];
  moi: Eleve;
  ouvert: boolean;
  plages: Plage[];
};

/** L'élève identifié sur ce poste ; sinon, la page revient à l'écran qui convient. */
export const contexteEleve = cache(async (): Promise<ContexteEleve> => {
  const poste = await etatDuPoste();
  if (!poste) redirect("/classe");
  if (!poste.inscriptionId || !poste.eleveId) redirect("/classe/qui");
  const base = await clientDuPoste(poste);
  const [{ data: classe }, { data: inscriptions, error }, { data: horaires }, { data: ouvert }] = await Promise.all([
    base.from("classes").select("nom, enseignant_id, horaires_limites").eq("id", poste.classeId).maybeSingle(),
    base.from("inscriptions").select("id, eleves(id, prenom, nom, couleur)").eq("classe_id", poste.classeId),
    base.from("horaires").select("jours, de, a, rang").eq("classe_id", poste.classeId).order("rang"),
    base.rpc("travail_ouvert"),
  ]);
  if (!classe) redirect("/classe");
  if (error) throw new Error(`Liste des élèves illisible : ${error.message}`);
  const { data: enseignant } = await base.from("enseignants").select("nom_affiche").eq("id", classe.enseignant_id).maybeSingle();
  const eleves = ((inscriptions ?? []) as unknown as { eleves: Eleve | null }[]).flatMap((i) => (i.eleves ? [i.eleves] : []));
  const moi = eleves.find((e) => e.id === poste.eleveId);
  if (!moi) redirect("/classe/qui");
  return {
    poste,
    classe: { nom: classe.nom, horairesLimites: classe.horaires_limites },
    prof: nomPourLesEleves(enseignant?.nom_affiche),
    nomAffiche: enseignant?.nom_affiche ?? null,
    eleves,
    moi,
    ouvert: ouvert === true,
    plages: (horaires ?? []).map((h) => ({ jours: h.jours, de: h.de.slice(0, 5), a: h.a.slice(0, 5) })),
  };
});

export type CarteChapitre = Repere & {
  id: string; titre: string; couleur: number;
  /** Le profil de l'élève dans ce chapitre, s'il lui est attribué */
  profil: Profil | null;
  /** Ses scènes se lisent : c'est son chapitre, ou la lecture de l'histoire est ouverte */
  lisible: boolean;
};
export type HistoireEleve = Repere & {
  id: string; titre: string;
  parties: (Repere & { id: string; titre: string; chapitres: CarteChapitre[] })[];
};

type LigneCarte = { id: string; titre: string; rang: number; image_id: string | null; visuel_choisi: string | null; visuel_defaut: string | null };
const repere = (l: { image_id: string | null; visuel_choisi: string | null; visuel_defaut: string | null }): Repere => ({
  imageId: l.image_id, visuelChoisi: l.visuel_choisi, visuelDefaut: l.visuel_defaut,
});

/** Les histoires de la classe : toutes les cartes, et pour chacune ce que l'élève peut y faire (F03-AC15). */
export async function histoiresDuPoste(c: ContexteEleve): Promise<HistoireEleve[]> {
  const base = await clientDuPoste(c.poste);
  const [projets, parties, chapitres, attributions] = await Promise.all([
    base.from("projets").select("id, titre, image_id, visuel_choisi, visuel_defaut, lecture_ouverte").order("titre"),
    base.from("parties").select("id, projet_id, titre, rang, image_id, visuel_choisi, visuel_defaut").order("rang"),
    base.from("chapitres").select("id, partie_id, titre, rang, couleur, image_id, visuel_choisi, visuel_defaut").order("rang"),
    base.from("attributions").select("chapitre_id, profil").eq("eleve_id", c.moi.id),
  ]);
  const erreur = projets.error ?? parties.error ?? chapitres.error ?? attributions.error;
  if (erreur) throw new Error(`Histoires illisibles : ${erreur.message}`);
  const profilDe = new Map(((attributions.data ?? []) as { chapitre_id: string; profil: Profil }[]).map((a) => [a.chapitre_id, a.profil]));
  return ((projets.data ?? []) as (LigneCarte & { lecture_ouverte: boolean })[]).map((p) => ({
    id: p.id, titre: p.titre, ...repere(p),
    parties: ((parties.data ?? []) as (LigneCarte & { projet_id: string })[])
      .filter((pa) => pa.projet_id === p.id)
      .map((pa) => ({
        id: pa.id, titre: pa.titre, ...repere(pa),
        chapitres: ((chapitres.data ?? []) as (LigneCarte & { partie_id: string; couleur: number })[])
          .filter((ch) => ch.partie_id === pa.id)
          .map((ch) => ({
            id: ch.id, titre: ch.titre, couleur: ch.couleur, ...repere(ch),
            profil: profilDe.get(ch.id) ?? null,
            lisible: profilDe.has(ch.id) || p.lecture_ouverte,
          })),
      })),
  }));
}

export type SceneEleve = {
  id: string; reference: number; titre: string | null; consigne: string | null; creeParMoi: boolean;
  /** Qui s'occupe de la scène (F06-AC04) : l'élève lui-même, un camarade, l'enseignant, ou personne */
  prise: Prise;
  /** La scène n'a ni mot ni image : « Texte vide » */
  texteVide: boolean;
  /** Un texte de l'élève est gardé à part pour cette scène : il n'y écrit plus (F08-AC17) */
  arrete: boolean;
};
export type Prise = { par: "moi" | "enseignant" } | { par: "eleve"; eleve: Eleve } | null;
/** Un lien du chapitre tel que l'élève le lit : hors du chapitre, le seul titre public du chapitre d'arrivée */
export type LienEleve = { sceneId: string; renvoiId: string; cibleId: string | null; libelle: string; chapitreCible: string | null; manque: "sans" | "supprimee" | null };

export type ChapitreEleve = Repere & {
  id: string; titre: string; couleur: number; partie: string; projetId: string;
  /** Récit à choix : le chapitre a sa vue « Chemins » (F03-AC18) */
  aChoix: boolean;
  liens: LienEleve[];
  profil: Profil | null;
  resume: string;
  camarades: Eleve[];
  scenes: SceneEleve[];
};

/**
 * Un chapitre que l'élève peut ouvrir : le sien, avec son résumé et ses consignes, ou un
 * autre quand la lecture est ouverte, sans consigne (F06-AC48). Sinon, rien : la base ne
 * lui en rend pas les scènes (F06-AC21, F06-AC22).
 */
export async function chapitreDuPoste(c: ContexteEleve, chapitreId: string): Promise<ChapitreEleve | null> {
  if (!estUuid(chapitreId)) return null;
  const base = await clientDuPoste(c.poste);
  const { data: chapitre } = await base
    .from("chapitres")
    .select("id, partie_id, projet_id, titre, couleur, image_id, visuel_choisi, visuel_defaut")
    .eq("id", chapitreId)
    .maybeSingle();
  if (!chapitre) return null;
  const [partie, projet, attributions, scenes, consignes, resume, arrets, liens] = await Promise.all([
    base.from("parties").select("titre").eq("id", chapitre.partie_id).maybeSingle(),
    base.from("projets").select("lecture_ouverte, recit").eq("id", chapitre.projet_id).maybeSingle(),
    base.from("attributions").select("eleve_id, profil").eq("chapitre_id", chapitreId),
    base
      .from("scenes")
      .select("id, reference, titre, rang, cree_par_eleve, prise_par_eleve, prise_par_enseignant, texte_vide")
      .eq("chapitre_id", chapitreId)
      .order("rang"),
    base.rpc("consignes_du_chapitre", { p_chapitre: chapitreId }),
    base.rpc("resume_du_chapitre", { p_chapitre: chapitreId }),
    base.rpc("scenes_ou_je_suis_arrete", { p_chapitre: chapitreId }),
    base.rpc("liens_du_chapitre", { p_chapitre: chapitreId }),
  ]);
  const arrete = new Set(((arrets.data ?? []) as unknown[]).map((x) => (typeof x === "string" ? x : String((x as { scenes_ou_je_suis_arrete?: string })?.scenes_ou_je_suis_arrete ?? ""))));
  if (scenes.error) throw new Error(`Scènes illisibles : ${scenes.error.message}`);
  const lesAttributions = (attributions.data ?? []) as { eleve_id: string; profil: Profil }[];
  const profil = lesAttributions.find((a) => a.eleve_id === c.moi.id)?.profil ?? null;
  if (!profil && projet.data?.lecture_ouverte !== true) return null;
  const consigneDe = new Map(((consignes.data ?? []) as { scene_id: string; consigne: string }[]).map((x) => [x.scene_id, x.consigne]));
  return {
    id: chapitre.id, titre: chapitre.titre, couleur: chapitre.couleur, partie: partie.data?.titre ?? "", projetId: chapitre.projet_id,
    ...repere(chapitre),
    aChoix: projet.data?.recit === "choix",
    liens: ((liens.data ?? []) as { scene_id: string; renvoi_id: string; cible_id: string | null; libelle: string; chapitre_cible: string | null; manque: "sans" | "supprimee" | null }[]).map(
      (l) => ({ sceneId: l.scene_id, renvoiId: l.renvoi_id, cibleId: l.cible_id, libelle: l.libelle, chapitreCible: l.chapitre_cible, manque: l.manque }),
    ),
    profil,
    resume: typeof resume.data === "string" ? resume.data : "",
    camarades: c.eleves.filter((e) => lesAttributions.some((a) => a.eleve_id === e.id)),
    scenes: (
      (scenes.data ?? []) as {
        id: string; reference: number; titre: string | null; cree_par_eleve: string | null; prise_par_eleve: string | null; prise_par_enseignant: boolean;
        texte_vide: boolean;
      }[]
    ).map((s) => {
      return {
        id: s.id, reference: s.reference, titre: s.titre,
        consigne: profil ? (consigneDe.get(s.id) ?? "") : null,
        creeParMoi: s.cree_par_eleve === c.moi.id,
        prise: priseDe(c, s.prise_par_eleve, s.prise_par_enseignant),
        texteVide: s.texte_vide !== false,
        arrete: arrete.has(s.id),
      };
    }),
  };
}

const priseDe = (c: ContexteEleve, parEleve: string | null, parEnseignant: boolean): Prise => {
  if (parEnseignant) return { par: "enseignant" };
  if (parEleve === c.moi.id) return { par: "moi" };
  const camarade = c.eleves.find((e) => e.id === parEleve);
  return camarade ? { par: "eleve", eleve: camarade } : null;
};

export type SceneOuverte = {
  id: string; reference: number; titre: string | null;
  chapitre: { id: string; titre: string; couleur: number };
  /** Rien quand l'élève lit hors de son chapitre : la lecture ouverte n'ouvre pas les consignes (F06-AC48) */
  consigne: string | null;
  profil: Profil | null;
  prise: Prise;
  /** Le texte de la scène, sans les notes de l'enseignant */
  texte: Texte;
  version: number;
  vide: boolean;
  /** Gras, italique et souligné permis aux élèves de ce projet (F04-AC03) */
  marques: boolean;
  /** Pourquoi l'élève ne peut pas écrire ici ; rien s'il le peut */
  refus: Motif | null;
  /** De quoi faire accepter ses enregistrements : rien quand il lit seulement */
  ecriture: string | null;
  projetId: string;
  /** Le livre autour de la scène, réduit à ce que l'élève peut lire (F05-AC03, AC42) */
  livre: Livre;
  /** Ce qu'il a le droit de changer dans le texte (F06.1) */
  droits: Droits;
};

type StructureLue = {
  depart: string | null;
  parties: { id: string; groupe: boolean; ouverture: string | null; chapitres: { hors: boolean; scenes: { id: string; hors: boolean; rang: number | null; fixe: number | null }[] }[] }[];
};

/** Les numéros du livre, calculés d'après la structure que la base rend au poste : ni titre ni texte. */
export async function numerosDuPoste(c: ContexteEleve, projetId: string): Promise<Record<string, number>> {
  if (!estUuid(projetId)) return {};
  const { data, error } = await (await clientDuPoste(c.poste)).rpc("numerotation_du_projet", { p_projet: projetId });
  if (error) throw new Error(`Numéros illisibles : ${error.message}`);
  const lu = data as StructureLue | null;
  if (!lu) return {};
  const plan: PlanNumerote = {
    departSceneId: lu.depart,
    parties: lu.parties.map((p) => ({
      id: p.id, groupeAvecPrecedente: p.groupe, ouvertureSceneId: p.ouverture,
      chapitres: p.chapitres.map((ch) => ({ horsLivre: ch.hors, scenes: ch.scenes.map((s) => ({ id: s.id, horsLivre: s.hors, rangLivre: s.rang, numeroFixe: s.fixe })) })),
    })),
  };
  return Object.fromEntries(numeroter(plan).de);
}

/**
 * Une scène ouverte par un élève (F06-AC20, AC21). La base ne rend que ce qu'il peut lire,
 * et jamais les notes de l'enseignant, ni les textes gardés à part, ni les versions
 * précédentes (F08-AC17, AC43).
 */
export async function sceneDuPoste(c: ContexteEleve, sceneId: string): Promise<SceneOuverte | null> {
  if (!estUuid(sceneId)) return null;
  const base = await clientDuPoste(c.poste);
  const { data, error } = await base.rpc("scene_du_poste", { p_scene: sceneId });
  if (error) throw new Error(`Scène illisible : ${error.message}`);
  const s = data as {
    id: string; chapitre: string; projet: string; reference: number; titre: string | null; consigne: string | null; texte: Texte; version: number; vide: boolean;
    profil: Profil | null; prise_par_eleve: string | null; prise_par_enseignant: boolean; marques: boolean | null; refus: Motif | null;
    recit: string | null; formule: string | null; constructions: string[] | null;
  } | null;
  if (!s) return null;
  const { data: chapitre } = await base.from("chapitres").select("id, partie_id, titre, couleur").eq("id", s.chapitre).maybeSingle();
  if (!chapitre) return null;
  const aChoix = s.recit === "choix";
  // Ce qu'il peut nommer : les scènes de son chapitre ; ailleurs, le seul titre public du chapitre
  const [partie, voisines, destinations, numeros] = await Promise.all([
    base.from("parties").select("titre").eq("id", chapitre.partie_id).maybeSingle(),
    base.from("scenes").select("id, reference, titre, texte_vide").eq("chapitre_id", s.chapitre).order("rang"),
    aChoix ? base.rpc("destinations_de_la_scene", { p_scene: sceneId }) : Promise.resolve({ data: [] }),
    aChoix ? numerosDuPoste(c, s.projet) : Promise.resolve({} as Record<string, number>),
  ]);
  const scenes = new Map<string, SceneConnue>(
    ((voisines.data ?? []) as { id: string; reference: number; titre: string | null; texte_vide: boolean }[]).map((v) => [
      v.id,
      { id: v.id, reference: v.reference, titre: v.titre, chapitreId: chapitre.id, chapitre: chapitre.titre, partie: partie.data?.titre ?? "", vide: v.texte_vide !== false },
    ]),
  );
  const ailleurs: Record<string, string> = {};
  for (const d of (destinations.data ?? []) as { cible_id: string; lisible: boolean; reference: number | null; titre: string | null; chapitre: string }[]) {
    if (scenes.has(d.cible_id)) continue;
    // Lecture ouverte : une scène d'un autre chapitre se nomme, sans devenir une destination à choisir
    if (d.lisible && d.reference !== null) ailleurs[d.cible_id] = `${d.chapitre}${d.titre ? ` — ${d.titre}` : ""}`;
    else ailleurs[d.cible_id] = d.chapitre;
  }
  const cibles = new Set(ciblesDe(s.texte ?? []));
  const livre: Livre = {
    aChoix,
    formule: s.formule && estFormuleRenvoi(s.formule) ? s.formule : "rends",
    constructions: ((s.constructions ?? []).filter(estConstruction) as Construction[]).length ? ((s.constructions ?? []).filter(estConstruction) as Construction[]) : ["neutre"],
    // Les numéros des scènes de son chapitre, et de celles où mènent les choix qu'il lit
    numeros: Object.fromEntries(Object.entries(numeros).filter(([id]) => scenes.has(id) || cibles.has(id))),
    scenes: s.profil ? [...scenes.values()] : [],
    ailleurs,
    chapitres: [{ id: chapitre.id, titre: chapitre.titre, partie: partie.data?.titre ?? "" }],
    // Un élève ne lit que le numéro : ni ce qui le fixe, ni le départ
    fixes: {},
    depart: null,
  };
  const droits: Droits = { role: "eleve", profil: s.profil ?? "propositions", scenesDuChapitre: new Set(scenes.keys()) };
  const prise = priseDe(c, s.prise_par_eleve, s.prise_par_enseignant);
  // La scène dont un camarade s'occupe se lit : la prendre à son nom se fera à l'étape 4 (F06.3)
  const ecrit = s.refus === null && prise?.par !== "eleve";
  let ecriture: string | null = null;
  if (ecrit) {
    const { data: ouverte, error: refusee } = await base.rpc("eleve_ouvrir_ecriture", { p_scene: sceneId });
    if (refusee) throw new Error(`Scène illisible : ${refusee.message}`);
    ecriture = typeof ouverte === "string" ? ouverte : null;
  }
  return {
    id: s.id, reference: s.reference, titre: s.titre,
    chapitre: { id: chapitre.id, titre: chapitre.titre, couleur: chapitre.couleur },
    consigne: s.consigne, profil: s.profil, prise,
    texte: s.texte ?? [], version: s.version, vide: s.vide, marques: s.marques !== false,
    refus: s.refus, ecriture, projetId: s.projet, livre, droits,
  };
}

export type SceneTrouvee = { id: string; reference: number; titre: string | null; extrait: string | null };
export type ChapitreTrouve = { id: string; titre: string; couleur: number; scenes: SceneTrouvee[] };

/**
 * « Rechercher une scène », pour l'élève (F05-AC48) : dans les titres et les textes des
 * chapitres qu'il peut lire, et dans les consignes de ses chapitres seulement. Rien d'un
 * chapitre fermé n'apparaît (F05-AC03).
 */
export async function chercherPourLePoste(c: ContexteEleve, demande: string): Promise<ChapitreTrouve[]> {
  const sansAccent = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const mots = sansAccent(demande).split(/\s+/).filter(Boolean).slice(0, 8);
  if (mots.length === 0) return [];
  const { data, error } = await (await clientDuPoste(c.poste)).rpc("scenes_a_chercher");
  if (error) throw new Error(`Recherche impossible : ${error.message}`);
  const trouves = new Map<string, ChapitreTrouve>();
  for (const s of (data ?? []) as { id: string; reference: number; titre: string | null; chapitre_id: string; chapitre: string; couleur: number; consigne: string | null; mots: string }[]) {
    const texte = s.mots.replace(/\s+/g, " ").trim();
    const partout = sansAccent(`${s.titre ?? ""} ${texte} ${s.consigne ?? ""}`);
    if (!mots.every((m) => partout.includes(m))) continue;
    // L'extrait trouvé : dans le texte, sinon dans la consigne
    const ou = [texte, s.consigne ?? ""].find((t) => sansAccent(t).includes(mots[0])) ?? "";
    const place = Math.max(0, sansAccent(ou).indexOf(mots[0]) - 40);
    const extrait = ou ? `${place > 0 ? "… " : ""}${ou.slice(place, place + 140).trim()}${place + 140 < ou.length ? " …" : ""}` : null;
    const chapitre = trouves.get(s.chapitre_id) ?? { id: s.chapitre_id, titre: s.chapitre, couleur: s.couleur, scenes: [] };
    chapitre.scenes.push({ id: s.id, reference: s.reference, titre: s.titre, extrait });
    trouves.set(s.chapitre_id, chapitre);
  }
  return [...trouves.values()];
}
