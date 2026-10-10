import { jourEnMots, heureEnMots } from "@/domaine/dates";
import { nomPourEleves, type Eleve } from "@/domaine/eleves";
import { de } from "@/domaine/texte";

/** Comment se nomme un texte gardé à part, selon son auteur (F08.1 ; docs/design.md, « Conflit de sauvegarde »). */
export type TexteGarde = { sorte: "refus" | "ancien"; eleveId: string | null; gardeLe: string };

export type NomDeTexte = {
  /** « Texte de Bilal », « Vos corrections », « Ancien texte de la scène » */
  titre: string;
  /** « gardé à part mardi 6 octobre » */
  sous: string;
  /** « tel que Bilal l'a écrit à 10 h 42 » */
  mention: string;
  /** Le prénom de l'élève arrêté tant que ce texte attend, s'il y en a un */
  arrete: string | null;
  /** « le texte de Bilal », « vos corrections », « l'ancien texte » : pour les phrases */
  enPhrase: string;
};

export function nomDeTexte(t: TexteGarde, eleves: readonly Eleve[], deClasse: boolean): NomDeTexte {
  const jour = jourEnMots(t.gardeLe);
  const heure = heureEnMots(t.gardeLe);
  if (t.sorte === "ancien") {
    return { titre: "Ancien texte de la scène", sous: `gardé à part ${jour}`, mention: `tel qu’il était à ${heure}`, arrete: null, enPhrase: "l’ancien texte de la scène" };
  }
  const eleve = eleves.find((e) => e.id === t.eleveId);
  if (eleve) {
    const prenom = nomPourEleves(eleve, eleves);
    return { titre: `Texte ${de(prenom)}`, sous: `gardé à part ${jour}`, mention: `tel que ${prenom} l’a écrit à ${heure}`, arrete: prenom, enPhrase: `le texte ${de(prenom)}` };
  }
  if (t.eleveId) {
    // Un élève qui n'est plus dans la classe : son texte reste, sans prénom à montrer
    return { titre: "Texte d’un élève", sous: `gardé à part ${jour}`, mention: `tel qu’il a été écrit à ${heure}`, arrete: null, enPhrase: "le texte de cet élève" };
  }
  return deClasse
    ? { titre: "Vos corrections", sous: `gardées à part ${jour}`, mention: `telles que vous les avez écrites à ${heure}`, arrete: null, enPhrase: "vos corrections" }
    : { titre: "Votre texte", sous: `gardé à part ${jour}`, mention: `tel que vous l’avez écrit à ${heure}`, arrete: null, enPhrase: "votre texte" };
}

/** « Bilal », « Bilal et Inès », « Bilal, Chloé et Inès ». */
export function enumerer(noms: string[]): string {
  if (noms.length <= 1) return noms[0] ?? "";
  return `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;
}
