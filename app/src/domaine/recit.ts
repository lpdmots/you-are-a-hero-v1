/** Plan du récit : parties, chapitres, scènes (F03), attributions (F06.1), repères du livre à choix (F03.2). */

import { cle, pluriel } from "./texte";

/** Les huit couleurs de chapitre du design : le dos, le bandeau, la teinte de fond. */
export const COULEURS = [
  { cle: "coquelicot", nom: "Coquelicot", dos: "#E0533D", bandeau: "#F7CBC1", teinte: "#FCEFEB" },
  { cle: "abricot", nom: "Abricot", dos: "#E98A2F", bandeau: "#F9D6B1", teinte: "#FEF3E8" },
  { cle: "tournesol", nom: "Tournesol", dos: "#D9A514", bandeau: "#F4E1A0", teinte: "#FCF7E4" },
  { cle: "prairie", nom: "Prairie", dos: "#57A043", bandeau: "#CDE6C0", teinte: "#F0F7EC" },
  { cle: "lagon", nom: "Lagon", dos: "#1C9C98", bandeau: "#BDE5E2", teinte: "#ECF7F6" },
  { cle: "bleuet", nom: "Bleuet", dos: "#3E74D2", bandeau: "#C8D8F4", teinte: "#EEF3FC" },
  { cle: "lilas", nom: "Lilas", dos: "#8A60C6", bandeau: "#DCCFEF", teinte: "#F5F1FB" },
  { cle: "pivoine", nom: "Pivoine", dos: "#CF4E8C", bandeau: "#F3C7DB", teinte: "#FCEEF4" },
] as const;

export const couleurDeChapitre = (rang: number) => COULEURS[((rang % COULEURS.length) + COULEURS.length) % COULEURS.length];

/** Couleur d'un nouveau chapitre : la moins employée du projet, la première en cas d'égalité. */
export function couleurNouvelle(dejaPrises: number[]): number {
  const comptes = COULEURS.map((_, i) => dejaPrises.filter((c) => c === i).length);
  return comptes.indexOf(Math.min(...comptes));
}

/** « S017 » : repère stable d'une scène, propre au projet. */
export const referenceScene = (numero: number): string => `S${String(numero).padStart(3, "0")}`;

/** Dans un dialogue ou un message, une scène se nomme par sa référence suivie de son titre (F03.1). */
export const nomScene = (s: { reference: number; titre: string | null }): string =>
  s.titre ? `${referenceScene(s.reference)} « ${s.titre} »` : referenceScene(s.reference);

export const TITRE_PARTIE = "Nouvelle partie";
export const TITRE_CHAPITRE = "Nouveau chapitre";

export type Profil = "propositions" | "organisation";

/** Image de repérage : l'image choisie, sinon le visuel proposé choisi, sinon le visuel par défaut (F10.1). */
export type Repere = { imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null };

export type Scene = {
  id: string;
  chapitreId: string;
  reference: number;
  titre: string | null;
  consigne: string;
  fin: boolean;
  horsLivre: boolean;
  creeParEleve: string | null;
  /** L'élève qui s'occupe de la scène (F06.3) : un seul, attribué à son chapitre */
  priseParEleve: string | null;
  /** L'enseignant s'en occupe lui-même : un élève ne peut ni y écrire ni la reprendre (F06-AC62) */
  priseParEnseignant: boolean;
};

export type ElevePlan = { id: string; prenom: string; nom: string | null; couleur: number };
export type Attribution = { eleveId: string; profil: Profil };

export type Chapitre = Repere & {
  id: string;
  partieId: string;
  titre: string;
  couleur: number;
  resume: string;
  horsLivre: boolean;
  scenes: Scene[];
  attributions: Attribution[];
};

export type Partie = Repere & { id: string; titre: string; chapitres: Chapitre[] };

/** Ce que la corbeille du projet contient (F03.1) : l'élément supprimé le plus haut, et ce qui attend dessous. */
export type Supprime = {
  sorte: "partie" | "chapitre" | "scene";
  id: string;
  nom: string;
  /** Où il était : sa partie pour un chapitre, son chapitre pour une scène */
  dans: string | null;
  /** Le parent est lui aussi dans la corbeille : il se restaure d'abord (F03-AC31) */
  parentSupprime: string | null;
  supprimeLe: string;
};

export type Plan = { parties: Partie[]; corbeille: Supprime[]; departSceneId: string | null };

export const chapitresDe = (plan: Plan): Chapitre[] => plan.parties.flatMap((p) => p.chapitres);

/** Un chapitre que l'enseignant écrit seul : il s'occupe de toutes ses scènes (F03.1). */
export const ecritParLEnseignant = (c: Chapitre): boolean => c.scenes.length > 0 && c.scenes.every((s) => s.priseParEnseignant);

/** Le chapitre attend-il des élèves ? Pas celui que l'enseignant écrit seul. */
export const sansEleve = (c: Chapitre): boolean => c.attributions.length === 0 && !ecritParLEnseignant(c);

/**
 * Ce que dit une scène dont aucun élève ne s'occupe (F06.5) : « Pas encore prise » dans un
 * chapitre attribué, où les élèves prennent leurs scènes ; « Aucun élève » dans un chapitre
 * qui n'en a pas.
 */
export const motSansEleve = (c: Chapitre): string => (c.attributions.length ? "Pas encore prise" : "Aucun élève");
export const scenesDe = (plan: Plan): Scene[] => chapitresDe(plan).flatMap((c) => c.scenes);

/**
 * Le départ du livre, s'il est dans le plan. Une scène de départ partie dans la corbeille
 * reste désignée : le livre n'a plus de départ, et le retrouve si elle est restaurée (F03-AC33).
 */
export const departDe = (plan: Plan): Scene | null => scenesDe(plan).find((s) => s.id === plan.departSceneId) ?? null;

export type Manque =
  | { sorte: "sans-scene"; nombre: number; chapitreId: string }
  | { sorte: "sans-eleve"; nombre: number; chapitreId: string }
  | { sorte: "eleves-sans-chapitre"; nombre: number }
  | { sorte: "sans-depart" };

/**
 * « À compléter » (F03.1) : ce qui manque au plan, chaque manque menant à la première carte
 * concernée. Les scènes sans consigne n'y comptent pas, la consigne étant facultative.
 */
export function aCompleter(plan: Plan, situation: { deClasse: boolean; aChoix: boolean; eleves: ElevePlan[] }): Manque[] {
  const chapitres = chapitresDe(plan);
  const manques: Manque[] = [];
  const sansScene = chapitres.filter((c) => c.scenes.length === 0);
  if (sansScene.length) manques.push({ sorte: "sans-scene", nombre: sansScene.length, chapitreId: sansScene[0].id });
  if (situation.deClasse) {
    const attendent = chapitres.filter(sansEleve);
    if (attendent.length) manques.push({ sorte: "sans-eleve", nombre: attendent.length, chapitreId: attendent[0].id });
    const occupes = new Set(chapitres.flatMap((c) => c.attributions.map((a) => a.eleveId)));
    const libres = situation.eleves.filter((e) => !occupes.has(e.id)).length;
    if (libres && chapitres.length) manques.push({ sorte: "eleves-sans-chapitre", nombre: libres });
  }
  if (situation.aChoix && scenesDe(plan).length > 0 && !departDe(plan)) manques.push({ sorte: "sans-depart" });
  return manques;
}

export function libelleManque(m: Manque): string {
  switch (m.sorte) {
    case "sans-scene":
      return `${m.nombre} chapitre${pluriel(m.nombre)} sans scène`;
    case "sans-eleve":
      return `${m.nombre} chapitre${pluriel(m.nombre)} sans élève`;
    case "eleves-sans-chapitre":
      return `${m.nombre} élève${pluriel(m.nombre)} sans chapitre`;
    case "sans-depart":
      return "pas de départ du livre";
  }
}

/** « 6 scènes », « 1 scène », « Aucune scène ». */
export const compteScenes = (n: number): string => (n === 0 ? "Aucune scène" : `${n} scène${pluriel(n)}`);

/**
 * Nouvelle place d'un élément déplacé dans une liste : la position se compte parmi les
 * autres éléments, comme la base la reçoit.
 */
export function deplacer<T>(liste: T[], de: number, vers: number): T[] {
  const copie = [...liste];
  const [element] = copie.splice(de, 1);
  copie.splice(vers, 0, element);
  return copie;
}

/** Recherche des scènes du livre (F03-AC26) : dans les titres et les consignes, sans accents ni majuscules. */
export function chercherScenes(plan: Plan, demande: string): { chapitre: Chapitre; scenes: Scene[] }[] {
  const mots = cle(demande).split(" ").filter(Boolean);
  if (mots.length === 0) return [];
  return chapitresDe(plan)
    .map((chapitre) => ({
      chapitre,
      scenes: chapitre.scenes.filter((s) => {
        const texte = cle(`${referenceScene(s.reference)} ${s.titre ?? ""} ${s.consigne}`);
        return mots.every((m) => texte.includes(m));
      }),
    }))
    .filter((r) => r.scenes.length > 0);
}
