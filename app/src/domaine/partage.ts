/**
 * La version partagée d'un livre (F12.1, F12.3) : ce que le lecteur en ligne voit, figé au
 * partage et à chaque mise à jour. Elle se tire du livre composé, dont elle garde l'ordre, les
 * numéros, les titres et les pages de présentation, et dont elle retire tout ce qui ne sert
 * qu'à l'impression (police, marges, nouvelles pages, dés imprimés) et au travail (références,
 * marques du PDF de travail, contrôles). Décidé le 16 octobre 2026 : « le livre a changé depuis
 * la version partagée » ne se dit que si ce que le lecteur verrait change (F12-AC21).
 */

import type { LivreACompose, PresentationACompose } from "./composition";
import type { BlocLu, CibleLue, LivreLu, PassageLu } from "./lecture";
import type { Feuille } from "./preparation";
import type { TexteLeger } from "./pages";

// ——— Ce que la version contient ———

export type PassagePartage = {
  /** L'identité stable de la scène : la reprise de lecture la suit d'une mise à jour à l'autre (F12-AC25) */
  id: string;
  /** Le numéro du passage dans la version partagée ; rien en récit classique */
  numero: number | null;
  /** Le titre de partie imprimé au-dessus du passage */
  partie: string | null;
  /**
   * Récit classique : le passage ouvre un chapitre, lu sur un écran à lui (F12.1). Son titre
   * s'affiche comme le livre l'imprime (`imprime`) ; le sommaire le nomme toujours.
   */
  chapitre: { numero: number; titre: string; imprime: boolean } | null;
  /** Récit classique : le filet au losange qui le sépare de la scène précédente */
  separateur: boolean;
  fin: boolean;
  blocs: BlocLu[];
  /** Les liaisons cachées : le numéro qu'elles attendent et le passage où elles mènent (F12-AC13) */
  enigmes: { numero: number; cible: string }[];
};

export type PresentationPartagee = {
  /** La page de titre : son image, ou son modèle ; la ligne et l'année selon les réglages des noms */
  titre: { image: string | null; titre: string; sousTitre: string; ligne: string; annee: string; illustration: string | null };
  auteurs: { image: string | null; place: "debut" | "fin"; introduction: string; noms: string[]; conclusion: string } | null;
  /**
   * « Comment lire ce livre » : à l'écran, le texte est celui de l'application, que l'adulte ne
   * modifie pas ; ses « Règles du jeu » le suivent (F12.1, amendement du 2 octobre 2026)
   */
  commentLire: { enigmes: boolean; regles: string } | null;
  fin: { image: string | null; texte: TexteLeger } | null;
};

export type VersionPartagee = {
  titre: string;
  aChoix: boolean;
  marqueFin: string;
  /** Les passages dans l'ordre du livre : celui des numéros, ou celui du plan en récit classique */
  passages: PassagePartage[];
  presentation: PresentationPartagee | null;
  feuille: Feuille | null;
  des: 0 | 1 | 2;
  /** Les images que la version montre, avec leurs dimensions : le lecteur n'en sert pas d'autres */
  images: Record<string, { largeur: number; hauteur: number }>;
  /**
   * La couverture (F11.4, « Couverture faite sur le site », lot 2) : figée avec la version comme
   * le reste ; ses textes demandés servent à la relecture (F11-AC115). Absente des versions
   * figées avant le 27 octobre 2026.
   */
  couverture?: CouvertureDeLaVersion | null;
};

export type CouvertureDeLaVersion = { id: string; largeur: number; hauteur: number; /** Rien pour une couverture importée */ textes: string[] | null };

// ——— Ce que la version montre des auteurs (F12.1) ———

/**
 * Révisé le 16 octobre 2026 : la ligne de la page de titre se retire ou reçoit un texte propre
 * au partage ; la page des auteurs s'affiche comme dans le livre ou ne s'affiche pas.
 */
export type NomsDuPartage = {
  ligne: boolean;
  /** Le texte qui remplace la ligne du livre dans la version partagée ; rien : celle du livre */
  texte: string | null;
  auteurs: boolean;
};

export const NOMS_COMME_LE_LIVRE: NomsDuPartage = { ligne: true, texte: null, auteurs: true };

export function nomsPropres(brut: unknown): NomsDuPartage {
  const n = (brut ?? {}) as { ligne?: unknown; texte?: unknown; auteurs?: unknown };
  const texte = typeof n.texte === "string" ? n.texte.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  return { ligne: n.ligne !== false, texte: texte || null, auteurs: n.auteurs !== false };
}

/** Les noms sont-ils ceux du livre ? Les réglages repliés le disent : « Comme dans le livre ». */
export const commeLeLivre = (n: NomsDuPartage): boolean => n.ligne && !n.texte && n.auteurs;

function presentationPartagee(p: PresentationACompose, noms: NomsDuPartage): PresentationPartagee {
  const t = p.titre;
  // Une page de titre en image s'affiche telle quelle : titre et sous-titre sont toujours affichés (F12-AC15)
  const titre = t.image
    ? { ...t }
    : { ...t, ligne: noms.ligne ? (noms.texte ?? t.ligne) : "", annee: noms.ligne ? t.annee : "" };
  return {
    titre,
    auteurs: p.auteurs && noms.auteurs ? { ...p.auteurs } : null,
    commentLire: p.commentLire ? { enigmes: p.commentLire.enigmes, regles: p.commentLire.regles } : null,
    fin: p.fin ? { ...p.fin } : null,
  };
}

// ——— La version, tirée du livre composé ———

/** Les images posées dans un bloc : en bloc, ou en ligne dans un paragraphe, une action ou une phrase de choix. */
export function imagesDesBlocs(blocs: BlocLu[]): string[] {
  return blocs.flatMap((b) => {
    if (b.type === "image") return [b.image];
    if (b.type === "p" || b.type === "action") return b.mots.flatMap((m) => ("image" in m ? [m.image] : []));
    return b.morceaux.flatMap((m) => ("image" in m ? [m.image] : []));
  });
}

/**
 * La version partagée du livre composé. Un renvoi vers une scène que le livre n'imprime pas
 * n'a pas de destination (la règle du partage l'aurait refusé : cela ne se voit qu'en essai).
 */
export function versionDuLivre(
  livre: LivreACompose, noms: NomsDuPartage,
  /** Récit classique : le chapitre de chaque scène, pour lire un chapitre par écran */
  chapitres: ReadonlyMap<string, { id: string; titre: string }> = new Map(),
): VersionPartagee {
  const dans = new Set(livre.passages.map((p) => p.sceneId));
  const parNumero = new Map(livre.passages.flatMap((p) => (p.numero === null ? [] : [[p.numero, p.sceneId] as const])));
  const cible = (c: CibleLue): CibleLue => (c.sorte === "passage" && !dans.has(c.id) ? { sorte: "sans" } : c);
  let rang = 0;
  let dernier: string | null = null;
  const chapitreDe = (p: LivreACompose["passages"][number]): PassagePartage["chapitre"] => {
    const c = livre.aChoix ? null : chapitres.get(p.sceneId);
    if (!c || c.id === dernier) return null;
    dernier = c.id;
    rang += 1;
    return { numero: rang, titre: c.titre, imprime: Boolean(p.chapitre) };
  };
  const passages: PassagePartage[] = livre.passages.map((p) => ({
    id: p.sceneId,
    numero: p.numero,
    partie: p.partie?.titre ?? null,
    chapitre: chapitreDe(p),
    separateur: p.separateur,
    fin: p.fin,
    blocs: p.blocs.map((b) => (b.type === "choix" ? { ...b, morceaux: b.morceaux.map((m) => ("renvoi" in m ? { ...m, cible: cible(m.cible) } : m)) } : b)),
    enigmes: p.enigmes.flatMap((n) => (parNumero.has(n) ? [{ numero: n, cible: parNumero.get(n)! }] : [])),
  }));
  const presentation = livre.presentation ? presentationPartagee(livre.presentation, noms) : null;
  const utilisees = new Set([
    ...passages.flatMap((p) => imagesDesBlocs(p.blocs)),
    ...(presentation
      ? [presentation.titre.image, presentation.titre.illustration, presentation.auteurs?.image ?? null, presentation.fin?.image ?? null].filter((x): x is string => Boolean(x))
      : []),
  ]);
  return {
    titre: livre.titre,
    aChoix: livre.aChoix,
    marqueFin: livre.marqueFin,
    passages,
    presentation,
    feuille: livre.aChoix ? livre.feuille : null,
    des: livre.aChoix && livre.feuille ? livre.des : 0,
    images: Object.fromEntries(Object.entries(livre.images).filter(([id]) => utilisees.has(id))),
  };
}

// ——— Le code du lien (F12.1, 16 octobre 2026) ———

/** Sans i, l, o, 0 ni 1 : un code recopié à la main depuis le cahier de liaison ne se lit pas de travers. */
export const ALPHABET_DU_CODE = "abcdefghjkmnpqrstuvwxyz23456789";
export const LONGUEUR_DU_CODE = 10;

/**
 * Un code tiré d'octets au hasard, fournis par l'appelant (31¹⁰ codes possibles, près de 50
 * bits). Un octet de 248 ou plus est écarté : chaque caractère reste également probable.
 */
export function codeDepuis(octets: Uint8Array): string {
  let code = "";
  for (const o of octets) {
    if (o >= 248) continue;
    code += ALPHABET_DU_CODE[o % ALPHABET_DU_CODE.length];
    if (code.length === LONGUEUR_DU_CODE) return code;
  }
  throw new Error("Pas assez d'octets pour un code.");
}

/** « p3wd-8hn-cx2 » : le code en trois groupes, tel qu'il s'affiche et se recopie. */
export const codeAffiche = (code: string): string => `${code.slice(0, 4)}-${code.slice(4, 7)}-${code.slice(7)}`;

/** Un code saisi ou collé : tirets, espaces et majuscules acceptés ; rien s'il ne peut pas en être un. */
export function codeSaisi(saisie: string): string | null {
  const code = saisie.toLowerCase().replace(/[\s-]/g, "");
  return code.length === LONGUEUR_DU_CODE && [...code].every((c) => ALPHABET_DU_CODE.includes(c)) ? code : null;
}

// ——— L'état du partage, dans « Imprimer et partager » ———

export type EtatDuPartage =
  | { sorte: "aucun" }
  | {
      sorte: "partage";
      /** La version partagée est celle que le lecteur verrait aujourd'hui */
      aJour: boolean;
      /** Le même texte que le dernier PDF définitif ; rien sans PDF, « inconnu » pour un PDF d'avant l'étape 7 */
      memeTexteQueLePdf: boolean | "inconnu" | null;
    };

export function etatDuPartage(
  partage: { empreinte: string; empreinteLecture: string } | null,
  actuelle: { empreinte: string },
  dernierPdf: { empreinteLecture: string | null } | null,
): EtatDuPartage {
  if (!partage) return { sorte: "aucun" };
  return {
    sorte: "partage",
    aJour: partage.empreinte === actuelle.empreinte,
    memeTexteQueLePdf: !dernierPdf ? null : dernierPdf.empreinteLecture === null ? "inconnu" : dernierPdf.empreinteLecture === partage.empreinteLecture,
  };
}

/**
 * La coche de « Imprimer et partager » (F11.6, révisé le 16 octobre 2026) : tout ce qui a été
 * produit est à jour — le dernier PDF définitif s'il en existe un, la version partagée si le
 * livre est partagé —, l'un des deux au moins existant (F11-AC108).
 */
export function sortieAJour(pdf: { existe: boolean; aJour: boolean }, partage: { existe: boolean; aJour: boolean }): boolean {
  if (!pdf.existe && !partage.existe) return false;
  return (!pdf.existe || pdf.aJour) && (!partage.existe || partage.aJour);
}

// ——— La version, lue (F12.1) ———

/**
 * Un passage de la version, dans la forme que la lecture connaît (`lecture.ts`) : le même
 * composant l'affiche dans la lecture d'essai et dans le lecteur en ligne. Rien de l'atelier :
 * ni référence, ni état, ni titre de travail.
 */
export function passageLu(p: PassagePartage): PassageLu {
  return {
    id: p.id, numero: p.numero, titre: null, reference: null, chapitre: { id: "", titre: p.chapitre?.titre ?? "", couleur: 0 },
    etat: null, horsLivre: false, vide: false, fin: p.fin, blocs: p.blocs,
    enigmes: p.enigmes.map((e) => ({ id: `enigme-${e.numero}`, numero: e.numero, cible: { sorte: "passage", id: e.cible } })),
  };
}

/** La version entière, lue : le départ est le premier passage, le n° 1 d'un récit à choix. */
export function livreLuDe(v: VersionPartagee): LivreLu {
  return {
    aChoix: v.aChoix, marqueFin: v.marqueFin, departId: v.passages[0]?.id ?? null,
    passages: Object.fromEntries(v.passages.map((p) => [p.id, passageLu(p)])),
    ordre: v.passages.map((p) => p.id),
    feuille: v.feuille,
    regles: v.presentation?.commentLire?.regles ?? "",
  };
}

/** Récit classique : les chapitres, chacun lu sur un écran, avec ses passages dans l'ordre du livre. */
export type ChapitreLu = { numero: number; titre: string; imprime: boolean; partie: string | null; passages: PassagePartage[] };

export function chapitresLus(v: VersionPartagee): ChapitreLu[] {
  const chapitres: ChapitreLu[] = [];
  for (const p of v.passages) {
    if (p.chapitre || !chapitres.length) {
      chapitres.push({ numero: p.chapitre?.numero ?? chapitres.length + 1, titre: p.chapitre?.titre ?? "", imprime: p.chapitre?.imprime ?? false, partie: p.partie, passages: [p] });
    } else {
      chapitres[chapitres.length - 1].passages.push(p);
    }
  }
  return chapitres;
}

/** « Le brouillard tombait sur le… » : le début d'un passage, pour le nommer dans le parcours sans son titre de travail. */
export function premiersMots(p: PassagePartage, n = 7): string {
  const texte = p.blocs
    .flatMap((b) => (b.type === "p" ? b.mots.flatMap((m) => ("text" in m ? [m.text] : [])) : []))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const mots = texte.split(" ").filter(Boolean);
  return mots.length > n ? `${mots.slice(0, n).join(" ")}…` : texte;
}
