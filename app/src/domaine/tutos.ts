/**
 * Les tutos vidéo de l'« Aide » (F14, « Tutos vidéo », F14-AC62 à AC67) : un geste chacun, rangés par
 * étape du projet, servis par le site (`public/tutos/`, sans lecteur YouTube). La page « Aide » les
 * montre tous, par temps du projet ; un écran d'aide de l'application montre le tuto de son étape.
 *
 * Un tuto s'ajoute ici quand son rendu est validé par le porteur : `tuto-<cle>.mp4`, `.vtt` et `.webp`
 * copiés de `V1/video/rendus/` dans `public/tutos/` (skill `tutos-de-l-aide`, « Poser sur le site »).
 */

/** Les écrans de l'application qui montrent un tuto (F14-AC65) */
export type EcranDuTuto =
  | "classes"
  | "projets-vide"
  | "preparation"
  | "plan"
  | "suivi"
  | "livre-relire"
  | "livre-chemins"
  | "livre-page"
  | "livre-sortie";

/** Les quatre temps de la page « Aide », dans l'ordre du projet */
export const TEMPS_DES_TUTOS = [
  { cle: "commencer", titre: "Commencer" },
  { cle: "preparer", titre: "Préparer l’histoire" },
  { cle: "ecrire", titre: "Écrire et relire" },
  { cle: "livre", titre: "Faire le livre" },
] as const;

export type Tuto = {
  cle: string;
  titre: string;
  /** Ce que montre le tuto, en une phrase : la description de ses données structurées */
  description: string;
  /** Durée du rendu, en secondes entières */
  secondes: number;
  temps: (typeof TEMPS_DES_TUTOS)[number]["cle"];
  /** Récit à choix seulement : mention sur la page, absent des projets en récit classique */
  aChoix?: boolean;
  /** En classe seulement : absent des écrans d'un projet personnel */
  deClasse?: boolean;
  ecran: EcranDuTuto;
  /** Posé sur le site (rendu validé et fichiers copiés) ; un tuto non posé ne paraît nulle part */
  pose: boolean;
};

/** Date de mise en ligne des tutos (données structurées) */
export const TUTOS_POSES_LE = "2026-11-21";

export const TUTOS: Tuto[] = [
  { cle: "acces-eleves", titre: "Donner l’accès aux élèves", description: "Créer sa classe, inscrire les élèves et imprimer l’affiche de la classe et leurs étiquettes, avec leur code.", secondes: 82, temps: "commencer", ecran: "classes", pose: true },
  { cle: "creer-un-projet", titre: "Créer un projet", description: "Créer son premier projet en trois questions, puis trouver ses repères dans la colonne de navigation.", secondes: 80, temps: "commencer", ecran: "projets-vide", pose: true },
  { cle: "preparer", titre: "Préparer son histoire", description: "Préparer l’histoire avec la classe, une étape projetée au tableau : les questions, les idées, ce que la classe retient.", secondes: 76, temps: "preparer", ecran: "preparation", pose: true },
  { cle: "parties", titre: "Parties et chapitres", description: "Ajouter un chapitre, ranger les cartes en les tirant et attribuer les chapitres aux élèves.", secondes: 86, temps: "preparer", ecran: "plan", pose: true },
  { cle: "chemins", titre: "Construire les chemins", description: "Dans un livre-jeu, ajouter les scènes d’un chapitre et les relier par leurs choix, dans la vue « Chemins ».", secondes: 77, temps: "preparer", aChoix: true, ecran: "plan", pose: true },
  { cle: "ecrire", titre: "Faire écrire la classe", description: "Donner une consigne et sa liste, puis voir l’élève prendre sa scène, l’écrire et la remettre.", secondes: 76, temps: "ecrire", deClasse: true, ecran: "suivi", pose: true },
  { cle: "relire", titre: "Relire et valider", description: "Relire une scène remise, corriger sur place, demander une reprise ou valider le travail de l’élève.", secondes: 73, temps: "ecrire", deClasse: true, ecran: "suivi", pose: true },
  { cle: "relire-livre", titre: "Relire le livre", description: "Relire le livre tel qu’il sera imprimé et corriger une coquille dans la scène ouverte à côté de l’aperçu.", secondes: 72, temps: "livre", ecran: "livre-relire", pose: true },
  { cle: "verifier-chemins", titre: "Vérifier les chemins", description: "Dans un livre-jeu, vérifier le départ et les fins, relier un choix oublié et tester la lecture.", secondes: 73, temps: "livre", aChoix: true, ecran: "livre-chemins", pose: true },
  { cle: "mettre-en-page", titre: "Mettre en page", description: "Choisir la police et la taille, les pages de début et de fin, et feuilleter l’aperçu du livre.", secondes: 74, temps: "livre", ecran: "livre-page", pose: true },
  { cle: "imprimer-partager", titre: "Imprimer et partager", description: "Créer le PDF définitif, partager le livre avec les élèves et les familles, et le proposer à la bibliothèque.", secondes: 70, temps: "livre", ecran: "livre-sortie", pose: true },
];

/** Les tutos posés, dans l'ordre de la série */
export const TUTOS_POSES = TUTOS.filter((t) => t.pose);

/** Le numéro d'un tuto dans la série (1 à 11), le même partout */
export const numeroDe = (t: Tuto): number => TUTOS.findIndex((x) => x.cle === t.cle) + 1;

/** Le tuto posé qui suit, dans l'ordre de la série (les tutos passent du serveur au client : par la clé) */
export const tutoSuivant = (t: Tuto): Tuto | null => TUTOS_POSES[TUTOS_POSES.findIndex((x) => x.cle === t.cle) + 1] ?? null;

export const videoDe = (t: Tuto) => `/tutos/tuto-${t.cle}.mp4`;
export const sousTitresDe = (t: Tuto) => `/tutos/tuto-${t.cle}.vtt`;
export const afficheDe = (t: Tuto) => `/tutos/tuto-${t.cle}.webp`;

/** « 1 min 22 » */
export const dureeLisible = (t: Tuto): string => {
  const m = Math.floor(t.secondes / 60);
  const s = t.secondes % 60;
  return m ? `${m} min${s ? ` ${String(s).padStart(2, "0")}` : ""}` : `${s} s`;
};

/** « PT1M22S », pour les données structurées */
export const dureeIso = (t: Tuto): string => `PT${Math.floor(t.secondes / 60)}M${t.secondes % 60}S`;

/**
 * Les tutos qu'un écran de l'application montre (F14-AC65) : ceux de son étape, posés, sans ceux
 * d'un récit à choix dans un récit classique, ni ceux de la classe dans un projet personnel.
 */
export function tutosDeLEcran(ecran: EcranDuTuto, projet: { aChoix: boolean; deClasse: boolean } = { aChoix: true, deClasse: true }): Tuto[] {
  return TUTOS_POSES.filter((t) => t.ecran === ecran && (!t.aChoix || projet.aChoix) && (!t.deClasse || projet.deClasse));
}
