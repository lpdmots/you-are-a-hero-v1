import { assembler, bloc, chaine, champs, liste, objet, textes, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, presentation, type Histoire } from "./contexte";

/**
 * ✦ du titre de scène (F05) : trois titres en une demande, montrés un à un. D'après la
 * consigne, ou le début du texte s'il existe. « Laisser » ne change rien (F05-AC04).
 */
export type EntreeTitre = {
  histoire: Histoire;
  consigne: string | null;
  /** Les premières lignes du texte, s'il y en a */
  debut: string | null;
  chapitre?: string;
  /** Les titres des autres scènes du chapitre, pour garder la même forme et ne pas les répéter */
  autresTitres: string[];
  titreActuel?: string;
};
export type Titres = { titres: string[] };

export const titre: DefinitionAide<EntreeTitre, Titres> = {
  aide: "titre",
  sortieMax: 200,
  systeme: () => assembler(
    REGLES_COMMUNES,
    `Tu proposes trois titres différents pour une scène du livre. Le titre sert à l'enseignant et aux élèves à retrouver la scène.
- De deux à sept mots, sans point final.
- Il nomme le lieu, le moment ou ce qui arrive au début de la scène, sans dévoiler comment elle finit ni ce que le lecteur va choisir.
- Si les autres titres du chapitre suivent une forme (« Lieu — ce qui arrive »), suis-la.
- Ne répète pas un titre existant.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    e.chapitre ? bloc("chapitre", e.chapitre) : "",
    bloc("autres_titres_du_chapitre", e.autresTitres),
    e.titreActuel ? bloc("titre_actuel", e.titreActuel) : "",
    bloc("consigne", e.consigne),
    bloc("debut_du_texte", e.debut),
    "Propose trois titres.",
  ),
  schema: { nom: "titres", schema: objet({ titres: liste(chaine) }) },
  lire: (json, e) => {
    const l = textes(champs(json)?.titres, 80)?.map((t) => t.replace(/[.]+$/, "")).filter((t) => t !== e.titreActuel && !e.autresTitres.includes(t));
    return l && l.length ? { titres: l.slice(0, 3) } : null;
  },
  simuler: () => ({ titres: ["Le pont de brume", "La lanterne qui tremble", "Rencontre sur le pont"] }),
};
