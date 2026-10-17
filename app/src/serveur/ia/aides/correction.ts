import { NOMS_DES_DEGRES, niveauEnMots, type Degre } from "@/domaine/aides-ia";
import { assembler, bloc, chaine, champs, liste, objet, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, type Histoire } from "./contexte";

/**
 * Correction d'une scène (F13.1), du degré 1 (orthographe) au degré 5 (d'après la consigne).
 * Ne partent que les paragraphes de récit, de toute la scène ou de la sélection : phrases de
 * choix, actions de jeu, images et notes restent dans la copie, intactes (F13-AC03). La
 * réponse rend autant de paragraphes, dans le même ordre : l'application compare elle-même
 * l'original et la proposition, mot à mot aux degrés 1 à 3.
 */
export type EntreeCorrection = {
  histoire: Histoire;
  degre: Degre;
  paragraphes: string[];
  consigne: string | null;
  /** Personnages, autres noms et objets de l'histoire : la correction n'y touche pas */
  nomsPropres: string[];
};

export type Correction = { paragraphes: string[] };

const CONSIGNES_DES_DEGRES: Record<Degre, string> = {
  1: `Degré 1, « Orthographe ». Corrige seulement les mots mal écrits : l'orthographe du mot lui-même (« grote » → « grotte », « strange » → « étrange »).
Ne touche PAS aux accords (pluriel, féminin), à la conjugaison (« il dormé » reste tel quel), à la ponctuation, aux majuscules, aux répétitions ni aux tournures. Un mot bien écrit mais mal accordé ou mal conjugué reste tel quel.`,
  2: `Degré 2, « Orthographe et grammaire ». Corrige l'orthographe des mots, les accords, la conjugaison, les homophones (a/à, et/est, son/sont, ces/ses…), la ponctuation et les majuscules.
Ne change ni le vocabulaire, ni l'ordre des mots, ni les répétitions, ni la longueur des phrases. Ajoute seulement la ponctuation qui manque vraiment (point en fin de phrase, virgules d'une énumération, tirets ou guillemets d'un dialogue).`,
  3: `Degré 3, « Phrases plus claires ». Corrige d'abord comme au degré 2, puis rends les phrases plus claires : coupe une phrase trop longue, évite une répétition gênante, remplace un mot imprécis (« truc », « faire », « il y a » répété) par le mot juste, rends clair qui fait quoi.
Ne change RIEN à ce qui se passe, à l'ordre des événements, au point de vue ni à ce que pense un personnage : « il croit que le dragon dort » ne devient pas « le dragon dort ». Garde les mots et les tournures de l'auteur partout où ils sont clairs.`,
  4: `Degré 4, « Style ». Corrige comme au degré 3, puis améliore le style : vocabulaire plus riche et plus précis, phrases plus fluides et plus variées, liaisons plus naturelles, détails sensoriels déjà suggérés mieux rendus.
Garde les mêmes événements, dans le même ordre, les mêmes personnages, le même point de vue et à peu près la même longueur (au plus un tiers de plus). Le texte doit rester lisible et crédible pour des enfants de cet âge.`,
  5: `Degré 5, « D'après la consigne ». Le texte de l'auteur sert de base : corrige-le comme au degré 4 et améliore-le pour qu'il réponde bien à la consigne. Il peut recevoir ce que la consigne demande et qui manque (une description, un sentiment, un dialogue demandé).
N'ajoute AUCUN événement ni AUCUN personnage que ni le texte ni la consigne n'apportent ; garde ce qui se passe, l'ordre, le point de vue et la fin du texte. Ajoute au plus quelques phrases par paragraphe.`,
};

export const correction: DefinitionAide<EntreeCorrection, Correction> = {
  aide: "correction",
  sortieMax: 4000,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu corriges le texte d'une scène, ${e.histoire.mode === "classe" ? `écrit par un élève (${niveauEnMots(e.histoire.niveaux)})` : "écrit par un adulte"}, au degré demandé.`,
    CONSIGNES_DES_DEGRES[e.degre],
    `Règles de tous les degrés :
- Rends exactement autant de paragraphes que tu en reçois, dans le même ordre ; ne fusionne ni ne coupe aucun paragraphe.
- Un paragraphe qui n'a rien à corriger revient identique, au caractère près.
- Garde la personne du récit (« tu », « je », « il ») et le temps choisi, sauf une erreur évidente de temps au degré 2 ou plus.
- Les noms propres de l'histoire s'écrivent exactement comme dans la liste fournie ; ne les modifie jamais.
- Garde les mots inventés exprès (formules magiques, noms de créatures) quand ils sont manifestement voulus.
- Ne commente rien : rends seulement le texte corrigé.`,
  ),
  message: (e) => assembler(
    bloc("noms_propres", e.nomsPropres),
    e.degre === 5 || e.degre === 4 ? bloc("consigne", e.consigne) : "",
    bloc("paragraphes", e.paragraphes.map((p, i) => `[${i + 1}] ${p}`).join("\n")),
    `Corrige ces ${e.paragraphes.length} paragraphe${e.paragraphes.length > 1 ? "s" : ""} au degré ${e.degre} (${NOMS_DES_DEGRES[e.degre]}), sans leur numéro entre crochets.`,
  ),
  schema: { nom: "correction", schema: objet({ paragraphes: liste(chaine) }) },
  lire: (json, e) => {
    const o = champs(json);
    if (!o || !Array.isArray(o.paragraphes) || o.paragraphes.length !== e.paragraphes.length) return null;
    const paragraphes = o.paragraphes.map((p) => (typeof p === "string" ? p.replace(/^\[\d+\]\s*/, "").trim() : null));
    if (paragraphes.some((p) => !p || p.length > 6000)) return null;
    return { paragraphes: paragraphes as string[] };
  },
  // Une correction visible et prévisible : majuscule en tête, point final, « grote » → « grotte »
  simuler: (e) => ({
    paragraphes: e.paragraphes.map((p) => {
      let t = p.replace(/\bgrote\b/g, "grotte").trim();
      t = t.charAt(0).toLocaleUpperCase("fr") + t.slice(1);
      return /[.!?…»]$/.test(t) ? t : `${t}.`;
    }),
  }),
};
