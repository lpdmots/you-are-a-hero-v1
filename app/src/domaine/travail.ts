/** « Mon travail » : les scènes dont un élève s'occupe, rangées par urgence (F06.5, 13 octobre 2026). */

import { sEcrit, type Etat } from "./etats";
import { majuscule } from "./texte";

export type SceneDeTravail = {
  id: string; reference: number; titre: string | null;
  chapitreId: string; chapitre: string;
  etat: Etat;
  /** La scène n'a pas de texte : « Texte vide » */
  vide: boolean;
  /** Un texte de l'élève y est gardé à part : il la lit, sans y écrire (F08-AC17) */
  arrete: boolean;
  /** Sa place dans le plan du récit : à urgence égale, c'est elle qui range */
  ordre: number;
};

/**
 * À reprendre, en cours, texte vide, puis ce qu'il a remis, puis ce qui est validé ou
 * prêt. Une scène où il est arrêté vient après ce qu'il peut écrire, avant ce qu'il a remis.
 */
export const urgence = (s: Pick<SceneDeTravail, "etat" | "vide" | "arrete">): number =>
  s.arrete && sEcrit(s.etat) ? 2.5 : s.etat === "reprendre" ? 0 : s.etat === "cours" ? (s.vide ? 2 : 1) : s.etat === "valider" ? 3 : 4;

export const rangerMonTravail = <T extends SceneDeTravail>(scenes: T[]): T[] => [...scenes].sort((a, b) => urgence(a) - urgence(b) || a.ordre - b.ordre);

/** La scène attend-elle l'élève ? À reprendre, en cours ou sans texte, et il peut y écrire. */
export const attendLEleve = (s: Pick<SceneDeTravail, "etat" | "vide" | "arrete">): boolean => sEcrit(s.etat) && !s.arrete;

/** La première scène qui attend l'élève : la seule à porter le bouton plein (F06-AC95). */
export const sceneSuivante = <T extends SceneDeTravail>(rangees: T[]): T | null => rangees.find(attendLEleve) ?? null;

/** Ce que la ligne dit à l'élève, et ce que dit son bouton. « Reprendre » ne désigne que la correction après une remarque. */
export function ceQueDitLaScene(s: Pick<SceneDeTravail, "etat" | "vide" | "arrete">, prof: string): { phrase: string; bouton: string } {
  const laProf = majuscule(prof);
  if (s.arrete) return { phrase: `Ton texte est gardé à part. ${laProf} doit le regarder avant que tu écrives ici.`, bouton: "Lire la scène" };
  switch (s.etat) {
    case "reprendre":
      return { phrase: `${laProf} te demande de reprendre ton texte.`, bouton: "Reprendre mon texte" };
    case "valider":
      return { phrase: `${laProf} relit ton texte.`, bouton: "Lire mon texte" };
    case "valide":
    case "prete":
      return { phrase: "Validé. Bravo !", bouton: "Lire mon texte" };
    case "cours":
      return s.vide ? { phrase: "Tu peux préparer ton texte sur papier ou l’écrire ici.", bouton: "Écrire" } : { phrase: "Continue ton texte.", bouton: "Continuer" };
  }
}

/** « 3 scènes ne sont pas encore prises dans ton chapitre », « 1 scène n'est pas encore prise dans La lisière ». */
export function phraseAPrendre(nombre: number, chapitre: string, seulChapitre: boolean): string {
  const ou = seulChapitre ? "dans ton chapitre" : `dans ${chapitre}`;
  return nombre > 1 ? `${nombre} scènes ne sont pas encore prises ${ou}` : `1 scène n’est pas encore prise ${ou}`;
}
