/**
 * Ce qu'une page de lecture reçoit d'un livre (F09.1, F12.1) : chaque passage, son texte tel
 * que le livre l'imprime — sans les notes de l'enseignant —, ses phrases de choix avec leurs
 * numéros, ses énigmes, ses repères de fin. Une seule forme, pour la lecture d'essai de
 * l'adulte, celle de l'élève et, plus tard, le lecteur en ligne : la lecture ne sait rien de
 * la base ni de ce que la personne a le droit de voir, qui est réglé en amont.
 */

import { estImageLigne, morceauxDe, NUMERO_VIDE, type Lettres, type Texte } from "./copie";
import type { Etat } from "./etats";
import type { ObjetANoter } from "./inventaire";
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
  /** `objets` : ceux de la liste que l'action nomme, à noter ou rayer d'un geste (inventaire.ts) */
  | { type: "action"; id: string; signe: SigneAction; mots: MotLu[]; objets?: ObjetANoter[] }
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


// ——— Ce que reçoit le poste d'un élève (lot 4) ———

/** Ce que la base rend au poste d'un élève (`lecture_du_poste`) : seulement ce qu'il peut lire. */
export type DonneesDuPoste = {
  recit: "choix" | "classique";
  lecture_ouverte: boolean;
  depart: string | null;
  chapitres: { id: string; titre: string; couleur: number; mien: boolean }[];
  scenes: { id: string; chapitre: string; titre: string | null; fin: boolean; vide: boolean; texte: Texte | null }[];
  ailleurs: string[];
  formule: FormuleRenvoi;
  marque_fin: string;
  feuille: Feuille | null;
  regles: string;
};

export type LivreDeLEleve = LivreLu & {
  lectureOuverte: boolean;
  /** Ses chapitres, et ceux que la lecture ouverte lui donne à lire, dans l'ordre du plan */
  chapitres: { id: string; titre: string; couleur: number; mien: boolean }[];
};

/**
 * Le livre tel que l'élève le lit (F09.1) : ses chapitres, ou tous quand la lecture est
 * ouverte ; sans référence, ni état, ni « hors du livre ». Un chemin vers une scène qu'il ne
 * lit pas est une suite à découvrir ; vers une scène qui n'existe plus, ou nulle part, il n'a
 * « pas encore de suite » (F09-AC12, AC17).
 */
export function livrePourLEleve(d: DonneesDuPoste, numeros: Readonly<Record<string, number>>, feuille: Feuille | null): LivreDeLEleve {
  const aChoix = d.recit === "choix";
  const lisibles = new Set(d.scenes.map((s) => s.id));
  const ailleurs = new Set(d.ailleurs);
  const chapitres = new Map(d.chapitres.map((c) => [c.id, c]));
  const cible = (id: string | null): CibleLue =>
    !id ? { sorte: "sans" } : lisibles.has(id) ? { sorte: "passage", id } : ailleurs.has(id) ? { sorte: "ailleurs" } : { sorte: "supprimee" };
  const numero = (id: string | null): string => (id && numeros[id] ? String(numeros[id]) : NUMERO_VIDE);
  const passages: Record<string, PassageLu> = {};
  for (const s of d.scenes) {
    const texte = s.texte ?? [];
    const c = chapitres.get(s.chapitre);
    passages[s.id] = {
      id: s.id, numero: aChoix ? (numeros[s.id] ?? null) : null, titre: s.titre, reference: null,
      chapitre: { id: s.chapitre, titre: c?.titre ?? "", couleur: c?.couleur ?? 0 },
      etat: null, horsLivre: false, vide: s.vide, fin: aChoix && s.fin,
      blocs: blocsLus(texte, d.formule, cible, numero),
      enigmes: aChoix
        ? texte.flatMap((b) => (b.type === "liaison" ? [{ id: b.id, numero: b.cible && numeros[b.cible] ? numeros[b.cible] : null, cible: cible(b.cible) }] : []))
        : [],
    };
  }
  return {
    aChoix, marqueFin: d.marque_fin?.trim() || "Fin", departId: d.lecture_ouverte ? (aChoix ? d.depart : (d.scenes[0]?.id ?? null)) : null,
    passages, ordre: d.scenes.map((s) => s.id),
    feuille: aChoix && feuille?.on && feuille.sections.length ? feuille : null,
    regles: aChoix ? (d.regles ?? "") : "",
    lectureOuverte: d.lecture_ouverte, chapitres: d.chapitres,
  };
}

/**
 * Le début d'un chapitre, pour « Commencer au début de La lisière » (F09-AC22) : la première
 * scène, dans l'ordre du plan, où aucun choix du chapitre ne mène ; à défaut, sa première scène.
 */
export function debutDuChapitre(livre: LivreLu, chapitreId: string): string | null {
  const ids = livre.ordre.filter((id) => livre.passages[id].chapitre.id === chapitreId);
  const ici = new Set(ids);
  const atteintes = new Set(
    ids.flatMap((id) => [
      ...livre.passages[id].blocs.flatMap((b) => (b.type === "choix" ? b.morceaux : [])).flatMap((m) => ("renvoi" in m && m.cible.sorte === "passage" && m.cible.id !== id ? [m.cible.id] : [])),
      ...livre.passages[id].enigmes.flatMap((e) => (e.cible.sorte === "passage" ? [e.cible.id] : [])),
    ]).filter((id) => ici.has(id)),
  );
  return ids.find((id) => !atteintes.has(id)) ?? ids[0] ?? null;
}

// ——— Une lecture retenue (F12.1, F04.2) ———

/** Ce qu'une lecture garde d'une fois sur l'autre : son parcours, les choix déjà lus, la feuille et le dernier lancer. */
export type LectureGardee = { parcours: Parcours; deja: string[]; feuille: EtatFeuille; des: number[] | null };

/**
 * La feuille d'un lecteur, reprise sur la feuille du livre (F04-AC43, 16 octobre 2026) : les
 * sections et compteurs qui existent encore gardent ses valeurs, un nouveau part de sa valeur
 * de départ, un retiré disparaît.
 */
export function feuilleReprise(feuille: Feuille | null, ancienne: Partial<EtatFeuille> | null | undefined): EtatFeuille {
  const etat = feuilleDeDepart(feuille);
  const a = ancienne ?? {};
  for (const cle of Object.keys(etat.compteurs)) {
    const v = a.compteurs?.[cle];
    if (typeof v === "number" && Number.isFinite(v)) etat.compteurs[cle] = Math.max(0, Math.round(v));
  }
  for (const cle of Object.keys(etat.listes)) {
    const v = a.listes?.[cle];
    if (Array.isArray(v)) etat.listes[cle] = v.filter((l): l is string => typeof l === "string").slice(0, 200).map((l) => l.slice(0, 80));
  }
  for (const cle of Object.keys(etat.notes)) {
    const v = a.notes?.[cle];
    if (typeof v === "string") etat.notes[cle] = v.slice(0, 2000);
  }
  return etat;
}

/**
 * Reprendre une lecture retenue (F12-AC19, AC25) : elle suit les passages par leur identité.
 * Le parcours garde ceux qui existent encore ; si celui où le lecteur s'était arrêté n'existe
 * plus, la lecture est perdue et reprend au début, ce que l'écran dit. Rien de lisible : rien
 * à reprendre.
 */
export function reprendre(brut: unknown, livre: LivreLu): { lecture: LectureGardee | null; perdue: boolean } {
  const g = (brut && typeof brut === "object" ? brut : null) as Partial<LectureGardee> | null;
  const etapes = Array.isArray(g?.parcours?.etapes) ? g.parcours.etapes.filter((e): e is string => typeof e === "string") : [];
  const position = Number.isInteger(g?.parcours?.position) ? Math.max(0, Math.min(g!.parcours!.position, etapes.length - 1)) : etapes.length - 1;
  if (!etapes.length) return { lecture: null, perdue: false };
  const ici = etapes[position];
  if (!livre.passages[ici]) return { lecture: null, perdue: true };
  const avant = etapes.slice(0, position + 1).filter((e) => livre.passages[e]);
  const apres = etapes.slice(position + 1).filter((e) => livre.passages[e]);
  return {
    lecture: {
      parcours: { etapes: [...avant, ...apres], position: avant.length - 1 },
      deja: Array.isArray(g?.deja) ? g.deja.filter((d): d is string => typeof d === "string") : [],
      feuille: feuilleReprise(livre.feuille, g?.feuille),
      des: Array.isArray(g?.des) && g.des.every((d) => Number.isInteger(d) && d >= 1 && d <= 6) ? g.des : null,
    },
    perdue: false,
  };
}
