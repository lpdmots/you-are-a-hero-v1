/**
 * Ce qu'une page de lecture reçoit d'un livre (F09.1, F12.1) : chaque passage, son texte tel
 * que le livre l'imprime — sans les notes de l'enseignant —, ses phrases de choix avec leurs
 * numéros, ses énigmes, ses repères de fin. Une seule forme, pour la lecture d'essai de
 * l'adulte, celle de l'élève et, plus tard, le lecteur en ligne : la lecture ne sait rien de
 * la base ni de ce que la personne a le droit de voir, qui est réglé en amont.
 */

import { estImageLigne, morceauxDe, NUMERO_VIDE, type Lettres, type Texte } from "./copie";
import type { Etat } from "./etats";
import { numerosDuPlan } from "./numeros";
import { signeDe, type Feuille, type FormuleRenvoi, type SigneAction } from "./preparation";
import { chapitresDe, departDe, type Plan } from "./recit";

/**
 * Où mène un renvoi : un passage que la personne peut lire, ou rien de lisible — pas encore de
 * destination, une scène supprimée, ou une suite hors des chapitres de l'élève (F09.1).
 */
export type CibleLue = { sorte: "passage"; id: string } | { sorte: "sans" } | { sorte: "supprimee" } | { sorte: "ailleurs" };

export type MotLu = Lettres | { image: string; alt?: string };
export type MorceauDeChoix = { texte: string } | { image: string; alt?: string } | { renvoi: string; numero: string; cible: CibleLue };

export type BlocLu =
  | { type: "p"; id: string; mots: MotLu[] }
  | { type: "image"; id: string; image: string; largeur: number; page?: true; alt?: string; legende?: string }
  | { type: "action"; id: string; signe: SigneAction; mots: MotLu[] }
  | { type: "choix"; id: string; morceaux: MorceauDeChoix[] };

/** Une liaison cachée : le numéro qu'elle attend, et où elle mène (F05.1). */
export type EnigmeLue = { id: string; numero: number | null; cible: CibleLue };

export type PassageLu = {
  id: string;
  /** Le numéro du passage dans le livre ; rien pour une scène hors du livre, ou en récit classique */
  numero: number | null;
  titre: string | null;
  /** « S029 » : pour l'adulte seul */
  reference: number | null;
  chapitre: { id: string; titre: string; couleur: number };
  /** L'état de la scène et « Hors du livre » : pour l'adulte seul (F09.1) */
  etat: Etat | null;
  horsLivre: boolean;
  vide: boolean;
  fin: boolean;
  blocs: BlocLu[];
  enigmes: EnigmeLue[];
};

export type LivreLu = {
  aChoix: boolean;
  /** La marque de fin de la préparation (F05) */
  marqueFin: string;
  /** Le départ du livre, s'il est lisible */
  departId: string | null;
  passages: Record<string, PassageLu>;
  /** Les passages dans l'ordre du plan : l'ordre de lecture d'un récit classique */
  ordre: string[];
  feuille: Feuille | null;
  regles: string;
};

/** Le texte d'un passage tel que le livre l'imprime : ni notes, ni liaisons, qui sont lues à part. */
export function blocsLus(texte: Texte, formule: FormuleRenvoi, cible: (id: string | null) => CibleLue, numero: (id: string | null) => string): BlocLu[] {
  return texte.flatMap((b): BlocLu[] => {
    switch (b.type) {
      case "p":
        return [{ type: "p", id: b.id, mots: b.children.map((m) => (estImageLigne(m) ? { image: m.image, ...(m.alt ? { alt: m.alt } : {}) } : m)) }];
      case "image":
        return [{
          type: "image", id: b.id, image: b.image, largeur: b.largeur, ...(b.page ? { page: true as const } : {}), ...(b.alt ? { alt: b.alt } : {}), ...(b.legende ? { legende: b.legende } : {}),
        }];
      case "action":
        return [{ type: "action", id: b.id, signe: signeDe(b), mots: b.children.map((m) => (estImageLigne(m) ? { image: m.image, ...(m.alt ? { alt: m.alt } : {}) } : m)) }];
      case "choix":
        return [{
          type: "choix", id: b.id,
          morceaux: morceauxDe(b, formule).map((m) => ("renvoi" in m ? { renvoi: m.renvoi, numero: numero(m.cible), cible: cible(m.cible) } : m)),
        }];
      default:
        return [];
    }
  });
}

/** Le premier renvoi d'une phrase, quand elle n'en a qu'un : la phrase entière s'active (F05). */
export const seulRenvoi = (bloc: Extract<BlocLu, { type: "choix" }>): Extract<MorceauDeChoix, { renvoi: string }> | null => {
  const renvois = bloc.morceaux.filter((m): m is Extract<MorceauDeChoix, { renvoi: string }> => "renvoi" in m);
  return renvois.length === 1 ? renvois[0] : null;
};

/** La phrase d'un choix en texte simple, telle que le livre l'imprime. */
export const phraseLue = (bloc: Extract<BlocLu, { type: "choix" }>): string =>
  bloc.morceaux.map((m) => ("texte" in m ? m.texte : "renvoi" in m ? m.numero : (m.alt ?? ""))).join("");

/**
 * Le livre entier, pour l'adulte : toutes les scènes du plan, celles hors du livre comprises,
 * avec leur référence et leur état. Les numéros sont ceux du livre ; une scène hors du livre
 * n'en a pas.
 */
export function livrePourLAdulte(
  plan: Plan, textes: ReadonlyMap<string, Texte>,
  o: { aChoix: boolean; formule: FormuleRenvoi; marqueFin: string; feuille: Feuille | null; regles: string },
): LivreLu {
  const numeros = o.aChoix ? numerosDuPlan(plan).de : new Map<string, number>();
  const chapitres = chapitresDe(plan);
  const dansLePlan = new Set(chapitres.flatMap((c) => c.scenes.map((s) => s.id)));
  const cible = (id: string | null): CibleLue => (!id ? { sorte: "sans" } : dansLePlan.has(id) ? { sorte: "passage", id } : { sorte: "supprimee" });
  const numero = (id: string | null): string => (id && numeros.has(id) ? String(numeros.get(id)) : NUMERO_VIDE);
  const passages: Record<string, PassageLu> = {};
  for (const c of chapitres) {
    for (const s of c.scenes) {
      const texte = textes.get(s.id) ?? [];
      passages[s.id] = {
        id: s.id, numero: numeros.get(s.id) ?? null, titre: s.titre, reference: s.reference,
        chapitre: { id: c.id, titre: c.titre, couleur: c.couleur },
        etat: s.etat, horsLivre: s.horsLivre || c.horsLivre, vide: s.texteVide, fin: s.fin,
        blocs: blocsLus(texte, o.formule, cible, numero),
        enigmes: o.aChoix
          ? texte.flatMap((b) => (b.type === "liaison" ? [{ id: b.id, numero: b.cible && numeros.has(b.cible) ? numeros.get(b.cible)! : null, cible: cible(b.cible) }] : []))
          : [],
      };
    }
  }
  const depart = o.aChoix ? departDe(plan) : null;
  return {
    aChoix: o.aChoix, marqueFin: o.marqueFin.trim() || "Fin", departId: depart?.id ?? null, passages,
    ordre: chapitres.flatMap((c) => c.scenes.map((s) => s.id)),
    feuille: o.aChoix && o.feuille?.on && o.feuille.sections.length ? o.feuille : null,
    regles: o.aChoix ? o.regles : "",
  };
}

// ——— Le parcours d'une lecture ———

/** Une étape du parcours : un passage, ou la sortie de périmètre de l'élève (F09-AC12). */
export const SORTIE = "~ailleurs";

export type Parcours = { etapes: string[]; position: number };

export const commencer = (id: string): Parcours => ({ etapes: [id], position: 0 });

/** Suivre un chemin depuis l'étape montrée : ce qui venait après elle est remplacé (F12-AC18). */
export const suivre = (p: Parcours, id: string): Parcours => ({ etapes: [...p.etapes.slice(0, p.position + 1), id], position: p.position + 1 });

export const revenir = (p: Parcours, position: number): Parcours => ({ ...p, position: Math.max(0, Math.min(position, p.etapes.length - 1)) });

/**
 * Le numéro d'une énigme (F09-AC19) : seuls ceux des liaisons cachées du passage sont acceptés,
 * comme dans le lecteur en ligne ; un autre ne mène nulle part, même s'il existe dans le livre.
 */
export function resoudre(passage: PassageLu, saisie: string): EnigmeLue | null {
  const n = Number.parseInt(saisie.trim(), 10);
  if (!Number.isFinite(n) || String(n) !== saisie.trim()) return null;
  return passage.enigmes.find((e) => e.numero === n) ?? null;
}

/** Ce que la lecture rencontre en fin de passage (F09.1, décisions du 14 octobre 2026). */
export function issueDe(passage: PassageLu, aChoix: boolean): "vide" | "fin" | "rien" | "suite" {
  if (passage.vide) return "vide";
  if (passage.fin) return "fin";
  if (!aChoix) return "suite";
  return passage.blocs.some((b) => b.type === "choix") || passage.enigmes.length ? "suite" : "rien";
}

/** Récit classique : le passage qui suit dans l'ordre du plan, parmi ceux qu'on peut lire. */
export const suivantDansLOrdre = (livre: LivreLu, id: string): string | null => {
  const i = livre.ordre.indexOf(id);
  return i >= 0 && i + 1 < livre.ordre.length ? livre.ordre[i + 1] : null;
};

/** « Volonté 4 · Inventaire 2 » : le résumé de la feuille sur téléphone (design, « Lecteur, 390 px »). */
export type EtatFeuille = { compteurs: Record<string, number>; listes: Record<string, string[]>; notes: Record<string, string> };

/** La feuille à ses valeurs de départ (F04-AC23) : chaque nouveau test repart de là (F04.2). */
export function feuilleDeDepart(feuille: Feuille | null): EtatFeuille {
  const etat: EtatFeuille = { compteurs: {}, listes: {}, notes: {} };
  for (const s of feuille?.sections ?? []) {
    if (s.type === "compteurs") for (const c of s.compteurs) etat.compteurs[`${s.id}/${c.id}`] = c.depart;
    if (s.type === "liste") etat.listes[s.id] = [];
    if (s.type === "notes") etat.notes[s.id] = "";
  }
  return etat;
}

/** Un compteur ne descend pas sous zéro, et n'a pas de maximum (F04-AC32). */
export const changerCompteur = (valeur: number, pas: 1 | -1): number => Math.max(0, valeur + pas);

/** Un lancer : une ou deux faces, et leur total (F04-AC31). */
export const lancer = (des: 1 | 2, tirage: () => number = Math.random): number[] => Array.from({ length: des }, () => 1 + Math.floor(tirage() * 6));

