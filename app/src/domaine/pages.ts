/**
 * Les pages de présentation du livre (F11.4, gabarits décidés le 15 octobre 2026) : page de
 * titre, page des auteurs, « Comment lire ce livre », feuille d'aventure, page de fin. Chacune est
 * un modèle dont l'adulte modifie les textes avec la mise en forme légère de F04.1, ou une image
 * pleine page, à l'intérieur des marges. L'ordre est fixe ; seule la page des auteurs va au
 * début ou à la fin.
 */

import type { Lettres } from "./copie";

/** Un texte court à mise en forme légère : des paragraphes de lettres (gras, italique, souligné). */
export type TexteLeger = Lettres[][];

export type FormePage = "modele" | "image";

export type PageDeTitre = {
  forme: FormePage;
  /** L'image de la forme « image pleine page » */
  imageId: string | null;
  sousTitre: string;
  /** « La classe de CM1-CM2 de Mme Laurent », ou le nom de l'auteur en mode personnel */
  ligne: string;
  annee: string;
  /** Une image facultative entre le titre et la ligne, sur la moitié de la page au plus */
  illustration: string | null;
};

export type PageDesAuteurs = {
  presente: boolean;
  forme: FormePage;
  imageId: string | null;
  place: "debut" | "fin";
  introduction: string;
  /** Les prénoms, un par ligne, imprimés par ordre alphabétique */
  noms: string[];
  conclusion: string;
};

export type CommentLire = {
  presente: boolean;
  forme: FormePage;
  imageId: string | null;
  texte: TexteLeger;
  /** Le paragraphe des énigmes : rien = selon le livre, présent s'il contient une liaison cachée (F11-AC107) */
  enigmes: boolean | null;
};

export type PageSimple = { presente: boolean; forme: FormePage; imageId: string | null; texte: TexteLeger };

export type PagesDuLivre = {
  titre: PageDeTitre;
  auteurs: PageDesAuteurs;
  /** Récit à choix seulement */
  commentLire: CommentLire;
  /** La forme de la feuille d'aventure imprimée ; ses sections sont dans la préparation (F04.2) */
  feuille: { forme: FormePage; imageId: string | null };
  fin: PageSimple;
};

const paragraphe = (text: string): Lettres[] => [{ text }];

export const TEXTE_COMMENT_LIRE: TexteLeger = [
  paragraphe("Ce livre ne se lit pas d’une page à l’autre. Chaque passage porte un numéro."),
  paragraphe("À la fin d’un passage, tu choisis ce que fait le héros : le numéro indiqué te dit où continuer ta lecture. Si tu arrives à une fin, tu peux recommencer et essayer un autre chemin."),
];
export const TEXTE_ENIGMES = "Parfois, aucun numéro n’est donné : il faut le trouver en résolvant une énigme.";
export const TEXTE_DES = "Pas de dé sous la main ? Ouvre le livre au hasard : la face imprimée en bas de la page de droite remplace le lancer.";

/** L'année scolaire d'une classe : « 2026-2027 ». */
export const anneeScolaire = (anneeDebut: number): string => `${anneeDebut}-${anneeDebut + 1}`;

/**
 * Les pages proposées à la première mise en page : en mode classe, la page des auteurs reprend
 * les prénoms seuls des élèves (F11-AC28) ; en mode personnel, elle n'est pas ajoutée d'office.
 */
export function pagesParDefaut(o: {
  aChoix: boolean;
  deClasse: boolean;
  /** « Mme Laurent » ; l'auteur en mode personnel */
  adulte: string;
  classe: { nom: string; anneeDebut: number } | null;
  prenoms: string[];
  annee: number;
}): PagesDuLivre {
  return {
    titre: {
      forme: "modele", imageId: null, sousTitre: "",
      ligne: o.deClasse && o.classe ? `La classe de ${o.classe.nom} de ${o.adulte}` : o.adulte,
      annee: anneeScolaire(o.classe?.anneeDebut ?? o.annee),
      illustration: null,
    },
    auteurs: {
      presente: o.deClasse, forme: "modele", imageId: null, place: "debut",
      introduction: "Ce livre a été écrit par", noms: [...o.prenoms], conclusion: o.adulte.trim() ? `avec ${o.adulte.trim()}` : "",
    },
    commentLire: { presente: o.aChoix, forme: "modele", imageId: null, texte: TEXTE_COMMENT_LIRE, enigmes: null },
    feuille: { forme: "modele", imageId: null },
    fin: { presente: false, forme: "modele", imageId: null, texte: [paragraphe("Fin")] },
  };
}

/** Les prénoms de la page des auteurs, par ordre alphabétique, sans tenir compte des accents. */
export const nomsTries = (noms: string[]): string[] =>
  noms.map((n) => n.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

/** Deux ou trois colonnes selon le nombre de prénoms (F11-AC105). */
export const colonnesDesNoms = (n: number): 1 | 2 | 3 => (n <= 6 ? 1 : n <= 16 ? 2 : 3);

/** Le texte d'un paragraphe léger, sans sa mise en forme. */
export const texteSimple = (t: TexteLeger): string => t.map((p) => p.map((l) => l.text).join("")).join("\n");

const texte = (v: unknown, max: number, defaut: string): string => (typeof v === "string" ? v.slice(0, max) : defaut);
const forme = (v: unknown): FormePage => (v === "image" ? "image" : "modele");
const image = (v: unknown): string | null => (typeof v === "string" && /^[0-9a-f-]{36}$/.test(v) ? v : null);
const presente = (v: unknown, defaut: boolean): boolean => (typeof v === "boolean" ? v : defaut);

/** Un texte léger lu dans la base : des paragraphes de lettres, sans rien d'autre que le gras, l'italique et le souligné. */
export function texteLegerPropre(v: unknown, defaut: TexteLeger): TexteLeger {
  if (!Array.isArray(v)) return defaut;
  return v.slice(0, 40).map((p) =>
    (Array.isArray(p) ? p : []).slice(0, 200).flatMap((l): Lettres[] =>
      l && typeof l === "object" && typeof (l as Lettres).text === "string"
        ? [{ text: (l as Lettres).text.slice(0, 4000), ...((l as Lettres).bold ? { bold: true as const } : {}), ...((l as Lettres).italic ? { italic: true as const } : {}), ...((l as Lettres).underline ? { underline: true as const } : {}) }]
        : [],
    ),
  );
}

/** Les pages lues dans la base, complétées par celles proposées : ce qui manque prend la valeur par défaut. */
export function pagesPropres(brut: unknown, defaut: PagesDuLivre): PagesDuLivre {
  const r = (brut && typeof brut === "object" ? brut : {}) as Record<string, Record<string, unknown> | undefined>;
  const t = r.titre ?? {};
  const a = r.auteurs ?? {};
  const c = r.commentLire ?? {};
  const f = r.feuille ?? {};
  const fin = r.fin ?? {};
  return {
    titre: {
      forme: forme(t.forme), imageId: image(t.imageId), sousTitre: texte(t.sousTitre, 200, defaut.titre.sousTitre), ligne: texte(t.ligne, 200, defaut.titre.ligne),
      annee: texte(t.annee, 40, defaut.titre.annee), illustration: image(t.illustration),
    },
    auteurs: {
      presente: presente(a.presente, defaut.auteurs.presente), forme: forme(a.forme), imageId: image(a.imageId), place: a.place === "fin" ? "fin" : "debut",
      introduction: texte(a.introduction, 200, defaut.auteurs.introduction),
      noms: Array.isArray(a.noms) ? a.noms.filter((n): n is string => typeof n === "string").map((n) => n.slice(0, 80)).slice(0, 200) : defaut.auteurs.noms,
      conclusion: texte(a.conclusion, 200, defaut.auteurs.conclusion),
    },
    commentLire: {
      presente: presente(c.presente, defaut.commentLire.presente), forme: forme(c.forme), imageId: image(c.imageId),
      texte: texteLegerPropre(c.texte, defaut.commentLire.texte), enigmes: typeof c.enigmes === "boolean" ? c.enigmes : null,
    },
    feuille: { forme: forme(f.forme), imageId: image(f.imageId) },
    fin: { presente: presente(fin.presente, defaut.fin.presente), forme: forme(fin.forme), imageId: image(fin.imageId), texte: texteLegerPropre(fin.texte, defaut.fin.texte) },
  };
}

/** Les images des pages de présentation, que les contrôles vérifient (F11.4, « Contrôles »). */
export function imagesDesPages(p: PagesDuLivre, o: { aChoix: boolean; feuille: boolean }): { page: string; image: string }[] {
  const liste: { page: string; image: string }[] = [];
  const ajouter = (page: string, forme: FormePage, id: string | null, oui = true) => {
    if (oui && forme === "image" && id) liste.push({ page, image: id });
  };
  ajouter("Page de titre", p.titre.forme, p.titre.imageId);
  if (p.titre.forme === "modele" && p.titre.illustration) liste.push({ page: "Page de titre", image: p.titre.illustration });
  ajouter("Page des auteurs", p.auteurs.forme, p.auteurs.imageId, p.auteurs.presente);
  ajouter("Comment lire ce livre", p.commentLire.forme, p.commentLire.imageId, o.aChoix && p.commentLire.presente);
  ajouter("Feuille d’aventure", p.feuille.forme, p.feuille.imageId, o.aChoix && o.feuille);
  ajouter("Page de fin", p.fin.forme, p.fin.imageId, p.fin.presente);
  return liste;
}
