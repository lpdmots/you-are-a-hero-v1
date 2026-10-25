/**
 * La bibliothèque publique des livres (F15), sans base ni serveur : l'adresse d'un livre tirée
 * de son titre, la présentation, l'attestation demandée selon le mode, et l'état d'un livre
 * proposé tel que l'étape « Imprimer et partager » le dit. « Bibliothèque » désigne l'espace
 * public des livres ; la bibliothèque d'images de F10.1 garde toujours son nom entier.
 */

import type { MotLu } from "./lecture";
import type { PassagePartage } from "./partage";

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
};

export function etatDeLaPublication(l: LignePublication | null): EtatPublication {
  if (!l) return { sorte: "aucune" };
  const attente = l.proposee && l.proposee_le ? { sorte: "attente" as const, depuis: l.proposee_le } : null;
  const refus = !attente && l.refus_motif && l.refusee_le ? { sorte: "refusee" as const, le: l.refusee_le, motif: l.refus_motif } : null;
  if (l.version && l.adresse && l.mise_a_jour_le) return { sorte: "publiee", adresse: l.adresse, le: l.mise_a_jour_le, miseAJour: attente ?? refus };
  return attente ?? refus ?? { sorte: "aucune" };
}

/** Une proposition peut-elle partir ? Pas tant qu'une autre attend sa relecture (F15-AC18). */
export const peutProposer = (e: EtatPublication): boolean =>
  e.sorte === "aucune" || e.sorte === "refusee" || (e.sorte === "publiee" && e.miseAJour?.sorte !== "attente");

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
