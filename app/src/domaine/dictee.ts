/**
 * La dictée de l'adulte (F07.4, « Dictée à l'adulte ») : il lit à voix haute un texte, celui
 * qu'un élève a écrit sur son cahier ou qu'il lui dicte, et le texte s'écrit dans le champ où
 * est son curseur. Gratuite pour tous les comptes, sans étoile (exception de F14) ; un plafond
 * par compte et par mois, garde-fou et non élément de l'offre. Rien ici ne parle au fournisseur
 * (`serveur/dictee.ts`) ni au micro (`composants/dictee/`).
 */

export const DICTEE = {
  /** Un enregistrement s'arrête de lui-même au bout de cinq minutes, et part à la transcription */
  secondesMax: 5 * 60,
  /** Trois heures par compte et par mois, heure de Paris */
  secondesParMois: 3 * 60 * 60,
  /** Le débit demandé au navigateur : cinq minutes tiennent dans un peu plus d'un mégaoctet */
  debit: 32_000,
  /** Au-delà, le serveur refuse sans rien envoyer (cinq minutes en font 1,2) */
  octetsMax: 4_000_000,
  /** Les noms du projet donnés au fournisseur comme indices : 50 caractères et 5 mots au plus chacun */
  termesMax: 100,
} as const;

export type RefusDictee = "absente" | "plafond" | "echec" | "rien" | "trop-long";

export const MESSAGES_DICTEE = {
  absente: "La dictée n'est pas installée sur ce site.",
  plafond: "Vous avez dicté trois heures ce mois-ci : la dictée revient le 1er du mois.",
  echec: "La dictée n'a pas répondu. Le texte n'a pas changé.",
  rien: "Rien n'a été entendu. Parlez plus près du micro.",
  "trop-long": "L'enregistrement est trop long pour être transcrit.",
  micro: "Le micro n'est pas autorisé pour ce site. Autorisez-le dans le navigateur, puis réessayez.",
  sansMicro: "Ce navigateur n'enregistre pas le son. Essayez Chrome, Edge, Firefox ou Safari.",
  placer: "Placez le curseur dans un paragraphe du récit, puis dictez.",
} as const;

export const messageDeLaDictee = (r: RefusDictee): string => MESSAGES_DICTEE[r];

/** « 0:42 », « 4:05 » : le temps qui défile pendant l'enregistrement. */
export const duree = (secondes: number): string => {
  const s = Math.max(0, Math.floor(secondes));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/**
 * Les mots qui commencent une phrase dictée et s'écrivent en minuscule au milieu d'une phrase.
 * Le fournisseur met une majuscule au début de ce qu'il entend ; un nom propre, que la liste ne
 * contient pas, garde la sienne.
 */
const MOTS_COURANTS = new Set(
  (
    "le la les l un une des du de d au aux à a et ou mais puis alors ensuite donc car ni or " +
    "il elle ils elles on je j tu nous vous ce c cet cette ces ça cela son sa ses leur leurs mon ma mes ton ta tes notre nos votre vos " +
    "qui que qu quand comme si dans en pour par avec sans sur sous vers chez entre avant après pendant depuis " +
    "y ne n pas plus très tout toute tous toutes rien personne quelque quelques chaque aussi encore déjà enfin soudain " +
    "est sont était étaient a ont avait avaient va vont fait font voici voilà oui non"
  ).split(" "),
);

/** Ce qui précède ouvre une phrase : rien, une fin de phrase, un retour à la ligne, un guillemet ouvrant */
const finDePhrase = /(^|[.!?…«\n])\s*$/;
const premierMot = /^([A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ'’-]*)/;

/**
 * Le texte entendu, prêt à se poser entre `avant` et `apres` : une espace qui le sépare des mots
 * voisins, une majuscule en début de phrase, une minuscule au milieu d'une phrase quand il
 * commence par un mot courant. Le texte entendu n'est pas autrement changé : sa ponctuation est
 * celle du fournisseur, que l'adulte relit.
 */
export function raccorder(avant: string, entendu: string, apres: string): string {
  let t = entendu.replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (finDePhrase.test(avant)) t = t.charAt(0).toLocaleUpperCase("fr") + t.slice(1);
  else {
    const mot = premierMot.exec(t)?.[1];
    if (mot && MOTS_COURANTS.has(mot.toLocaleLowerCase("fr").split(/['’]/)[0])) t = t.charAt(0).toLocaleLowerCase("fr") + t.slice(1);
  }
  // Au milieu d'une phrase, le point final du fournisseur ne coupe pas ce qui suit
  if (/^[a-zà-öø-ÿ,;:)]/.test(apres.trimStart()) && /\.$/.test(t) && !/\.\.$/.test(t)) t = t.slice(0, -1);
  const espaceAvant = avant && !/[\s('’-]$/.test(avant) ? " " : "";
  const espaceApres = apres && !/^[\s.,;:!?…)»]/.test(apres) ? " " : "";
  return `${espaceAvant}${t}${espaceApres}`;
}

/**
 * Les noms du projet donnés au fournisseur comme indices (personnages, autres noms, objets) :
 * chacun d'une à cinq mots et de 50 caractères au plus, sans doublon, cent au plus.
 */
export function termesDeLaDictee(noms: readonly string[]): string[] {
  const vus = new Set<string>();
  const termes: string[] = [];
  for (const brut of noms) {
    const n = brut.replace(/\s+/g, " ").trim();
    const cle = n.toLocaleLowerCase("fr");
    if (!n || n.length > 50 || n.split(" ").length > 5 || vus.has(cle)) continue;
    vus.add(cle);
    termes.push(n);
    if (termes.length >= DICTEE.termesMax) break;
  }
  return termes;
}
