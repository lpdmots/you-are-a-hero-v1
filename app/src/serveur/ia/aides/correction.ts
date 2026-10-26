import { NOMS_DES_DEGRES, type Degre } from "@/domaine/aides-ia";
import { compterMots } from "@/domaine/correction";
import { assembler, bloc, chaine, champs, liste, objet, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, blocPersonnages, eleve, type CarteDePersonnage, type Histoire } from "./contexte";

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
  /**
   * Les cartes des personnages (F13-AC30, 26 octobre 2026) : qui ils sont, garçon ou fille ;
   * sans elles, la correction a mis un héros au féminin.
   */
  cartes?: CarteDePersonnage[];
  /** Degrés 4 et 5 : le nombre de mots visé pour l'ensemble, ou rien pour la même longueur */
  cible?: number | null;
};

export type Correction = { paragraphes: string[] };

const CONSIGNES_DES_DEGRES: Record<Degre, string> = {
  1: `Degré 1, « Orthographe ». Corrige tout ce qui s'écrit mal, sans toucher à la phrase :
- l'orthographe des mots (« grote » → « grotte ») ;
- les terminaisons de conjugaison quand on voit ce que l'auteur voulait écrire (« il dormé » → « il dormait », « il ouvri » → « il ouvrit ») ;
- les accords en genre et en nombre (« ses pied » → « ses pieds ») ;
- les homophones (a/à, et/est, son/sont, ces/ses, sa/ça, on/ont…) ;
- les espaces autour de la ponctuation, selon la typographie française : pas d'espace avant la virgule ni le point, une espace après (« il le range ,et part . » → « il le range, et part. », « sur le quai.Le » → « sur le quai. Le ») ; une espace avant « : ; ! ? » et à l'intérieur des guillemets « » ; une seule espace entre deux mots ;
- la majuscule au début d'une phrase (après un point) et aux noms propres (« il le range » en tête de phrase → « Il le range »).
N'ajoute ni ne retire AUCUN signe de ponctuation (virgule, point, guillemet, tiret) : seulement les espaces autour de ceux qui sont là. Ne touche PAS à l'ordre des mots, aux répétitions ni aux tournures : la phrase garde ses mots, sa ponctuation et sa construction.`,
  2: `Degré 2, « Orthographe et grammaire ». Corrige comme au degré 1, puis la ponctuation qui manque ou qui est en trop et les tournures mal construites (« il se dit que il » → « il se dit qu'il », un mot qui manque, un pronom mal placé).
Ne change ni le vocabulaire, ni les répétitions, ni la longueur des phrases au-delà de ce qu'exige une phrase correcte. Ajoute seulement la ponctuation qui manque vraiment (point en fin de phrase, virgules d'une énumération, tirets ou guillemets d'un dialogue).`,
  3: `Degré 3, « Phrases plus claires ». Corrige d'abord comme au degré 2, puis rends les phrases plus claires : coupe une phrase trop longue, évite une répétition gênante, remplace un mot imprécis (« truc », « faire », « il y a » répété) par le mot juste, rends clair qui fait quoi.
Ne change RIEN à ce qui se passe, à l'ordre des événements, au point de vue ni à ce que pense un personnage : « il croit que le dragon dort » ne devient pas « le dragon dort ». Garde les mots et les tournures de l'auteur partout où ils sont clairs.`,
  4: `Degré 4, « Style ». Corrige comme au degré 3, puis améliore le style : vocabulaire plus riche et plus précis, phrases plus fluides et plus variées, liaisons plus naturelles, détails sensoriels déjà suggérés mieux rendus.
Garde les mêmes événements, dans le même ordre, les mêmes personnages et le même point de vue. Le texte doit rester lisible et crédible pour un auteur de cet âge.`,
  5: `Degré 5, « D'après la consigne ». Le texte de l'auteur sert de base : corrige-le comme au degré 4 et améliore-le pour qu'il réponde bien à la consigne. Il peut recevoir ce que la consigne demande et qui manque (une description, un sentiment, un dialogue demandé).
N'ajoute AUCUN événement ni AUCUN personnage que ni le texte ni la consigne n'apportent ; garde ce qui se passe, l'ordre, le point de vue et la fin du texte.`,
};

/**
 * La longueur, aux degrés 4 et 5 : la même par défaut, ou celle que l'adulte demande (F13.1).
 * Un modèle tient mal un nombre exact de mots, assez bien un ordre de grandeur.
 */
function consigneDeLongueur(e: EntreeCorrection): string {
  if (e.degre < 4) return "";
  if (!e.cible) {
    return e.degre === 4 ? "Garde à peu près la même longueur (au plus un tiers de plus)." : "Ajoute au plus quelques phrases par paragraphe.";
  }
  const actuels = compterMots(e.paragraphes.join(" "));
  return `Longueur demandée : environ ${e.cible} mots en tout (le texte en compte ${actuels}). Répartis-les entre les paragraphes, dont le nombre ne change pas.
${e.cible >= actuels
    ? "Pour allonger, développe la description, les sensations, les pensées et les dialogues que le texte et la consigne suggèrent ; n'ajoute aucun événement ni aucun personnage."
    : "Pour raccourcir, resserre les phrases sans rien retirer de ce qui se passe."}`;
}

/** Les fautes que la réponse simulée corrige, comme une élève de CE2 les ferait (F13-AC17 en tête). */
const FAUTES_SIMULEES: Record<string, string> = {
  dormé: "dormait", grote: "grotte", révéyer: "réveiller", Soudin: "Soudain", "ses pied": "ses pieds", "brillé comme des étoile": "brillaient comme des étoiles", ouvri: "ouvrit",
};

export const correction: DefinitionAide<EntreeCorrection, Correction> = {
  aide: "correction",
  // Jusqu'à 1 500 mots demandés aux degrés 4 et 5, en JSON : de quoi les rendre sans les couper
  sortieMax: 8000,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu corriges le texte d'une scène, ${e.histoire.mode === "classe" ? `écrit par un ${eleve(e.histoire)}` : "écrit par un adulte"}, au degré demandé.`,
    CONSIGNES_DES_DEGRES[e.degre],
    consigneDeLongueur(e),
    `Règles de tous les degrés :
- Rends exactement autant de paragraphes que tu en reçois, dans le même ordre ; ne fusionne ni ne coupe aucun paragraphe.
- Un paragraphe qui n'a rien à corriger revient identique, au caractère près.
- Garde la personne du récit (« tu », « je », « il ») et le temps choisi, sauf une erreur évidente de temps au degré 2 ou plus.
- Les noms propres de l'histoire s'écrivent exactement comme dans la liste fournie ; ne les modifie jamais.
- Quand les personnages sont décrits, garde leur genre (« il » ou « elle ») et ce qu'en disent leurs cartes.
- Garde les mots inventés exprès (formules magiques, noms de créatures) quand ils sont manifestement voulus.
- Ne commente rien : rends seulement le texte corrigé.`,
  ),
  message: (e) => assembler(
    bloc("noms_propres", e.nomsPropres),
    blocPersonnages(e.cartes),
    e.degre === 5 || e.degre === 4 ? bloc("consigne", e.consigne) : "",
    bloc("paragraphes", e.paragraphes.map((p, i) => `[${i + 1}] ${p}`).join("\n")),
    `Corrige ces ${e.paragraphes.length} paragraphe${e.paragraphes.length > 1 ? "s" : ""} au degré ${e.degre} (${NOMS_DES_DEGRES[e.degre]})${e.degre >= 4 && e.cible ? `, en visant environ ${e.cible} mots en tout` : ""}, sans leur numéro entre crochets.`,
  ),
  schema: { nom: "correction", schema: objet({ paragraphes: liste(chaine) }) },
  lire: (json, e) => {
    const o = champs(json);
    if (!o || !Array.isArray(o.paragraphes) || o.paragraphes.length !== e.paragraphes.length) return null;
    const paragraphes = o.paragraphes.map((p) => (typeof p === "string" ? p.replace(/^\[\d+\]\s*/, "").trim() : null));
    if (paragraphes.some((p) => !p || p.length > 20_000)) return null;
    return { paragraphes: paragraphes as string[] };
  },
  // Une correction visible et prévisible : quelques fautes connues (F13-AC17), les espaces et les
  // majuscules de début de phrase, puis, à partir du degré 2, le point final
  simuler: (e) => ({
    paragraphes: e.paragraphes.map((p) => {
      let t = Object.entries(FAUTES_SIMULEES).reduce((x, [faute, juste]) => x.replace(new RegExp(`(?<!\\p{L})${faute}(?!\\p{L})`, "gu"), juste), p);
      // Dès le degré 1 : pas d'espace avant la virgule ni le point, une après ; la majuscule en tête de phrase
      t = t.replace(/ +([,.])/g, "$1").replace(/([,.])(?=\p{L})/gu, "$1 ").replace(/(^|[.!?] )(\p{Ll})/gu, (_, avant: string, l: string) => avant + l.toLocaleUpperCase("fr"));
      if (e.degre === 1) return t;
      const t2 = t.trim();
      return /[.!?…»]$/.test(t2) ? t2 : `${t2}.`;
    }).map((p, i, tous) => {
      // Une longueur demandée : le dernier paragraphe s'allonge d'une phrase répétée, jusqu'à la cible
      if (!e.cible || e.degre < 4 || i < tous.length - 1) return p;
      let suite = p;
      while (compterMots([...tous.slice(0, -1), suite].join(" ")) < e.cible) suite += " La brume glissait doucement sur l'eau.";
      return suite;
    }),
  }),
};
