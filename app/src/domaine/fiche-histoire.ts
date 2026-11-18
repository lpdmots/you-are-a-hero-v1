/**
 * La fiche de l'histoire à imprimer (F02.1, décidée par le porteur le 18 novembre 2026) : ce que la
 * Préparation retient, dans un ordre fixe, pour que chaque élève ait sous les yeux les mêmes noms
 * et les mêmes règles d'un chapitre à l'autre. Rien n'est inventé : une rubrique vide n'apparaît
 * pas, aucun texte n'est résumé ni réécrit, et il n'y a pas d'IA. Ne s'y trouvent pas les grandes
 * étapes, les questions, les idées, les formules d'action, la fiche visuelle des images ni les
 * scènes.
 */
import type { Organisation, Recit } from "./projets";
import { HEROS_SANS_NOM, type Feuille, type Preparation } from "./preparation";

export type PersonnageDeFiche = { id: string; nom: string; autresNoms: string[]; description: string; portraitId: string | null };

export type RubriqueDeFiche =
  | { sorte: "univers" | "enjeu" | "ecriture" | "regles"; titre: string; texte: string }
  | { sorte: "heros" | "autres"; titre: string; personnages: PersonnageDeFiche[] }
  /** Le texte retenu de l'étape « Personnages », quand aucune carte de héros ne le porte */
  | { sorte: "personnages"; titre: string; texte: string }
  | { sorte: "lieux"; titre: string; lieux: { id: string; nom: string; phrase: string }[] }
  | { sorte: "objets"; titre: string; objets: { id: string; nom: string; description: string; imageId: string | null }[] }
  | { sorte: "feuille"; titre: string; lignes: string[] };

export type SorteDeRubrique = RubriqueDeFiche["sorte"];

export type FicheDeLHistoire = {
  titre: string;
  rubriques: RubriqueDeFiche[];
  /** Rien de retenu : la fiche le dit en une phrase */
  vide: string | null;
};

export type ProjetDeLaFiche = { titre: string; organisation: Organisation; recit: Recit; consigneEcriture: string };

const plein = (t: string | null | undefined): string => (t ?? "").replace(/\r\n/g, "\n").trim();

/**
 * Ce que la feuille d'aventure demande au lecteur, en lignes : « Volonté : 5 au départ »,
 * « Inventaire », « Deux dés ». Seulement si elle est imprimée dans le livre (F04.2).
 */
export function lignesDeLaFeuille(feuille: Feuille): string[] {
  if (!feuille.on) return [];
  const lignes = feuille.sections.flatMap((s): string[] => {
    if (s.type === "compteurs") {
      const compteurs = s.compteurs.filter((c) => c.nom.trim()).map((c) => `${c.nom.trim()} : ${c.depart} au départ`);
      return s.titre.trim() && compteurs.length ? [`${s.titre.trim()} — ${compteurs.join(" · ")}`] : compteurs;
    }
    return s.titre.trim() ? [s.titre.trim()] : [];
  });
  if (feuille.des === 1) lignes.push("Un dé");
  if (feuille.des === 2) lignes.push("Deux dés");
  return lignes;
}

/** La fiche, dans l'ordre de F02.1 ; en récit classique, sans feuille d'aventure ni règles du jeu (F02-AC26). */
export function composerLaFiche(projet: ProjetDeLaFiche, p: Preparation): FicheDeLHistoire {
  const deClasse = projet.organisation === "classe";
  const r: RubriqueDeFiche[] = [];
  const texte = (sorte: "univers" | "enjeu" | "ecriture" | "regles", titre: string, valeur: string) => {
    if (plein(valeur)) r.push({ sorte, titre, texte: plein(valeur) });
  };
  const versFiche = (c: Preparation["personnagesDeLHistoire"][number]): PersonnageDeFiche => ({
    id: c.id, nom: c.nom.trim(), autresNoms: c.autresNoms, description: plein(c.description), portraitId: c.portraitId,
  });
  // Une carte de héros encore vide (« Le héros », sans texte ni portrait) n'apprend rien à l'élève
  const parle = (c: PersonnageDeFiche) => c.description !== "" || c.portraitId !== null || c.autresNoms.length > 0 || c.nom !== HEROS_SANS_NOM;

  texte("univers", "L’univers", p.univers);
  texte("enjeu", "L’enjeu", p.enjeu);

  const heros = p.personnagesDeLHistoire.filter((c) => c.heros).map(versFiche).filter(parle);
  if (heros.length) r.push({ sorte: "heros", titre: heros.length > 1 ? "Les héros" : "Le héros", personnages: heros });
  else if (plein(p.personnages)) r.push({ sorte: "personnages", titre: "Les personnages", texte: plein(p.personnages) });

  const autres = p.personnagesDeLHistoire.filter((c) => !c.heros).map(versFiche).filter((c) => c.nom !== "");
  if (autres.length) r.push({ sorte: "autres", titre: "Les autres personnages", personnages: autres });

  const lieux = p.lieux.filter((l) => l.nom.trim()).map((l) => ({ id: l.id, nom: l.nom.trim(), phrase: plein(l.phrase) }));
  if (lieux.length) r.push({ sorte: "lieux", titre: "Les lieux", lieux });

  const objets = p.objets.filter((o) => o.nom.trim()).map((o) => ({ id: o.id, nom: o.nom.trim(), description: plein(o.description), imageId: o.imageId ?? null }));
  if (objets.length) r.push({ sorte: "objets", titre: "Les objets", objets });

  texte("ecriture", deClasse ? "Notre façon d’écrire" : "Ma façon d’écrire", projet.consigneEcriture);
  if (projet.recit === "choix") {
    const feuille = lignesDeLaFeuille(p.feuille);
    if (feuille.length) r.push({ sorte: "feuille", titre: "La feuille d’aventure", lignes: feuille });
    texte("regles", "Les règles du jeu", p.regles);
  }

  return {
    titre: projet.titre.trim(),
    rubriques: r,
    vide: r.length
      ? null
      : deClasse
        ? "Cette fiche se remplit avec ce que la classe retient dans la Préparation."
        : "Cette fiche se remplit avec ce que vous retenez dans la Préparation.",
  };
}

/** Un A4 recto verso au plus (F02.1). */
export const PAGES_DE_LA_FICHE = 2;
/** La hauteur utile d'une page A4, marges de l'impression ôtées (14 mm en haut et en bas) */
export const HAUTEUR_UTILE_MM = 297 - 2 * 14;

/**
 * Un morceau de la fiche mesuré à l'écran, à la largeur de l'impression, en millimètres depuis le
 * haut du contenu : un portrait, un lieu ou un objet ne se coupe pas d'une page à l'autre ; un
 * paragraphe, si ; un titre de rubrique ne reste pas seul au bas d'une page.
 */
/** Une ligne de texte de la fiche, à peu près : ce qu'il faut sous un titre pour qu'il reste en bas de page */
const LIGNE_MM = 6;

export type MorceauMesure = { haut: number; bas: number; sorte: "insecable" | "texte" | "titre" };

/**
 * Les coupures de page de la fiche, comme l'impression les fera : au bas de la hauteur utile, ou
 * plus haut pour ne pas couper un élément insécable ni laisser un titre seul. Un élément plus haut
 * qu'une page se coupe. Rend la position de chaque coupure ; il y a une page de plus que de coupures.
 */
export function paginer(morceaux: readonly MorceauMesure[], hauteurPage = HAUTEUR_UTILE_MM): number[] {
  const fin = morceaux.reduce((m, x) => Math.max(m, x.bas), 0);
  const coupures: number[] = [];
  let debut = 0;
  while (fin > debut + hauteurPage + 0.5 && coupures.length < 40) {
    const limite = debut + hauteurPage;
    let coupure = limite;
    for (let change = true; change; ) {
      change = false;
      for (const m of morceaux) {
        if (m.haut <= debut + 0.5) continue;
        // Plus haut qu'une page, il se coupe de toute façon : il ne repousse rien
        const coupe = m.haut < coupure - 0.1 && m.bas > coupure + 0.1 && m.bas - m.haut < hauteurPage;
        // Un titre sous lequel tient moins d'une ligne de ce qui le suit part avec lui à la page suivante
        const seul = m.sorte === "titre" && m.haut < coupure && !morceaux.some((x) => x.sorte !== "titre" && x.haut >= m.bas - 0.5 && x.haut + LIGNE_MM <= coupure);
        if ((coupe && m.sorte !== "texte") || seul) {
          coupure = m.haut;
          change = true;
        }
      }
    }
    if (coupure <= debut + 1) coupure = limite;
    coupures.push(coupure);
    debut = coupure;
  }
  return coupures;
}

/** Au-delà d'un recto verso, un message le dit, sans rien couper, et nomme la rubrique la plus longue (F02-AC23). */
export const messageDeLongueur = (pages: number, plusLongue?: string | null): string | null =>
  pages > PAGES_DE_LA_FICHE
    ? `La fiche fait ${pages} pages : plus qu’un recto verso. Rien n’est coupé ; pour qu’elle tienne, raccourcissez un texte dans la Préparation${plusLongue ? ` (la rubrique la plus longue : « ${plusLongue} »)` : ""}.`
    : null;
