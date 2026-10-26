/**
 * La bibliothèque publique des livres (F15), sans base ni serveur : l'adresse d'un livre tirée
 * de son titre, la présentation, l'attestation demandée selon le mode, et l'état d'un livre
 * proposé tel que l'étape « Imprimer et partager » le dit. « Bibliothèque » désigne l'espace
 * public des livres ; la bibliothèque d'images de F10.1 garde toujours son nom entier.
 */

import type { MotLu } from "./lecture";
import type { PassagePartage, VersionPartagee } from "./partage";

/** Deux ou trois phrases : au-delà, ce n'est plus une présentation de carte (F15, « Liste, tri, filtres »). */
export const PRESENTATION_MAX = 400;

/** La présentation telle qu'elle se garde : espaces réduits, sans saut de ligne ; null si vide ou trop longue. */
export function presentationPropre(brut: unknown): string | null {
  if (typeof brut !== "string") return null;
  const t = brut.replace(/\s+/g, " ").trim();
  return t && t.length <= PRESENTATION_MAX ? t : null;
}

/**
 * L'attestation à cocher pour proposer (F15, « Attestation, sans dépôt » ; F15-AC17) : en classe,
 * l'autorisation des représentants légaux ; en mode personnel, être l'auteur et avoir les droits
 * des images. Les formulaires signés ne sont ni déposés ni gardés par le site.
 */
export const ATTESTATIONS = {
  classe: "J’ai l’autorisation écrite des représentants légaux de chaque élève dont un texte ou un dessin figure dans ce livre.",
  auteur: "Je suis l’auteur de ce livre et j’ai les droits de ses images.",
} as const;
export type Attestation = keyof typeof ATTESTATIONS;

/** La clause des conditions d'utilisation, rappelée sous l'attestation (F15, « Conditions d'utilisation »). */
export const CLAUSE_DE_PUBLICATION =
  "En proposant un livre, vous permettez à l’éditeur de l’afficher publiquement et gratuitement tant qu’il est dans la bibliothèque.";

/** Le mot d'une adresse : sans accents, en minuscules, les autres signes en tirets. */
const MAX_ADRESSE = 60;
export function adresseDepuisTitre(titre: string): string {
  const base = titre
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[œŒ]/g, "oe")
    .replace(/[æÆ]/g, "ae")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  // Coupée à un tiret, pour ne pas finir au milieu d'un mot
  const coupee = base.length <= MAX_ADRESSE ? base : base.slice(0, MAX_ADRESSE).replace(/-[^-]*$/, "") || base.slice(0, MAX_ADRESSE);
  return coupee.replace(/-+$/, "") || "livre";
}

/** L'adresse libre : celle du titre, sinon suivie de -2, -3… (F15, « suffixe en cas de doublon »). */
export function adresseLibre(titre: string, prises: ReadonlySet<string>): string {
  const base = adresseDepuisTitre(titre);
  if (!prises.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const essai = `${base}-${n}`;
    if (!prises.has(essai)) return essai;
  }
}

export const ADRESSE_VALIDE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Où en est un livre dans la bibliothèque, pour l'étape « Imprimer et partager » (F15, « Côté
 * enseignant ») : jamais proposé, en attente de sa première relecture, refusé, publié, et, publié,
 * sa mise à jour en attente ou refusée. La version publiée reste lisible pendant la relecture
 * d'une mise à jour, et après son refus (F15-AC07).
 */
export type EtatPublication =
  | { sorte: "aucune" }
  | { sorte: "attente"; depuis: string }
  | { sorte: "refusee"; le: string; motif: string }
  /** Retiré de la bibliothèque, par l'adulte ou par le porteur, avec son motif (F15-AC09, AC10) */
  | { sorte: "retiree"; le: string; par: "adulte" | "porteur"; motif: string | null }
  | {
      sorte: "publiee";
      adresse: string;
      le: string;
      /** La mise à jour en attente ou refusée, s'il y en a une */
      miseAJour: { sorte: "attente"; depuis: string } | { sorte: "refusee"; le: string; motif: string } | null;
    };

export type LignePublication = {
  adresse: string | null;
  version: unknown;
  mise_a_jour_le: string | null;
  proposee: unknown;
  proposee_le: string | null;
  refus_motif: string | null;
  refusee_le: string | null;
  retiree_le?: string | null;
  retrait_par?: string | null;
  retrait_motif?: string | null;
};

export function etatDeLaPublication(l: LignePublication | null): EtatPublication {
  if (!l) return { sorte: "aucune" };
  const attente = l.proposee && l.proposee_le ? { sorte: "attente" as const, depuis: l.proposee_le } : null;
  const refus = !attente && l.refus_motif && l.refusee_le ? { sorte: "refusee" as const, le: l.refusee_le, motif: l.refus_motif } : null;
  if (l.version && l.adresse && l.mise_a_jour_le) return { sorte: "publiee", adresse: l.adresse, le: l.mise_a_jour_le, miseAJour: attente ?? refus };
  // Un retrait efface le refus d'avant : un refus présent est donc plus récent que lui
  const retrait = l.retiree_le && l.retrait_par
    ? { sorte: "retiree" as const, le: l.retiree_le, par: l.retrait_par === "porteur" ? ("porteur" as const) : ("adulte" as const), motif: l.retrait_motif ?? null }
    : null;
  return attente ?? refus ?? retrait ?? { sorte: "aucune" };
}

/** Une proposition peut-elle partir ? Pas tant qu'une autre attend sa relecture (F15-AC18). */
export const peutProposer = (e: EtatPublication): boolean =>
  e.sorte === "aucune" || e.sorte === "refusee" || e.sorte === "retiree" || (e.sorte === "publiee" && e.miseAJour?.sorte !== "attente");

/**
 * Le texte d'un passage de la version, tel qu'un lecteur le lit, en lignes : les paragraphes, les
 * actions de jeu, les phrases de choix avec leur numéro (« Si tu veux traverser, rendez-vous au
 * 12. ») et la légende des images. Pour les aides qui lisent le livre : la présentation et la
 * relecture (F15).
 */
export function texteDuPassage(p: PassagePartage): string {
  const mots = (m: MotLu[]) => m.flatMap((x) => ("text" in x ? [x.text] : [])).join("");
  return p.blocs
    .map((b) => {
      if (b.type === "p") return mots(b.mots);
      if (b.type === "action") return mots(b.mots);
      if (b.type === "image") return b.legende ? `[Image : ${b.legende}]` : "";
      return b.morceaux.map((m) => ("texte" in m ? m.texte : "renvoi" in m ? m.numero : "")).join("");
    })
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

// ——— La relecture (F15, « Ce que vérifie l'IA », lot 2) ———

/** Les raisons qu'un point du rapport de l'IA peut donner ; elle ne signale jamais les prénoms. */
export const MOTIFS_DE_RELECTURE = ["violence", "sexualite", "haine", "moquerie", "droits", "texte-image", "autre"] as const;
export type MotifDeRelecture = (typeof MOTIFS_DE_RELECTURE)[number];
export const NOMS_DES_MOTIFS: Record<MotifDeRelecture, string> = {
  violence: "Violence ou horreur",
  sexualite: "Sexualité",
  haine: "Haine ou insultes",
  moquerie: "Moquerie d’une personne réelle",
  droits: "Droits d’auteur",
  "texte-image": "Texte dans une image",
  autre: "Autre",
};

/**
 * Le repère de chaque passage, tel que l'IA et le porteur le lisent : « P12 », le passage 12 d'un
 * livre à choix ; « S7 », la septième scène d'un récit classique, qui n'a pas de numéros.
 */
export function reperesDuLivre(v: VersionPartagee): Map<string, string> {
  return new Map(v.passages.map((p, i) => [p.id, v.aChoix && p.numero ? `P${p.numero}` : `S${i + 1}`]));
}

export type PassageChange = { id: string; repere: string; sorte: "change" | "ajoute" | "retire" };

/**
 * Les passages qu'une mise à jour change (F15-AC07), dans l'ordre du livre proposé, puis ceux qu'il
 * retire : comparés par leur identité, sur ce que le lecteur lit (texte, choix, images).
 */
export function passagesChanges(avant: VersionPartagee, apres: VersionPartagee): PassageChange[] {
  const nom = (v: VersionPartagee, p: PassagePartage, i: number) => (v.aChoix && p.numero ? `Passage ${p.numero}` : `Scène ${i + 1}`);
  const anciens = new Map(avant.passages.map((p, i) => [p.id, { p, i }]));
  const lu = (p: PassagePartage) => JSON.stringify({ blocs: p.blocs, enigmes: p.enigmes, fin: p.fin, partie: p.partie, chapitre: p.chapitre?.titre ?? null });
  const changes: PassageChange[] = apres.passages.flatMap((p, i): PassageChange[] => {
    const a = anciens.get(p.id);
    if (!a) return [{ id: p.id, repere: nom(apres, p, i), sorte: "ajoute" }];
    return lu(a.p) === lu(p) ? [] : [{ id: p.id, repere: nom(apres, p, i), sorte: "change" }];
  });
  const restent = new Set(apres.passages.map((p) => p.id));
  return [...changes, ...avant.passages.flatMap((p, i): PassageChange[] => (restent.has(p.id) ? [] : [{ id: p.id, repere: nom(avant, p, i), sorte: "retire" }]))];
}
