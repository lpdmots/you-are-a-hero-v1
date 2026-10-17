import { assembler, bloc, chaine, champs, liste, objet, texte, textes, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, blocCarnet, lecteurs, presentation, type Carnet, type Histoire } from "./contexte";

/**
 * Formuler une consigne (F13.2) d'après l'indication courte de l'adulte. En classe, toujours
 * le même modèle : une ou deux phrases qui tutoient l'élève, puis « Décris : » et deux ou trois
 * points de quelques mots (F13-AC18) ; l'application compose ce texte, imprimé tel quel sur les
 * fiches. En mode personnel, une note d'intention pour soi, sans tutoiement ni « Décris : ».
 */
export type EntreeConsigne = {
  histoire: Histoire;
  indication: string;
  carnet?: Carnet;
  chapitre?: { titre: string; resume?: string };
  /** Les scènes voisines : leur titre et leur consigne, pour ne pas répéter les mêmes points */
  voisines: { titre: string; consigne?: string }[];
};

export type Consigne = { texte: string };

/** Un point commence en minuscule, sauf un nom propre : « Sa lanterne » → « sa lanterne », « Lou » reste. */
const minuscule = (l: string): string =>
  /^(l['’]|le |la |les |un |une |des |du |de |d['’]|sa |son |ses |leur |leurs |ce |cet |cette |ces |comment |pourquoi |où |qui |quand |ce que |ce qu['’]|à quoi |tout |toute |chaque )/i.test(l)
    ? l.charAt(0).toLocaleLowerCase("fr") + l.slice(1)
    : l;

/** « Décris : » s'écrit toujours ainsi, routine que les élèves reconnaissent (F13.2). */
export function composerConsigne(phrases: string, points: string[]): string {
  const p = points.map((l) => minuscule(l.replace(/^[–\-•\s]+/, "").replace(/[\s;.,]+$/, "")));
  return [phrases.trim(), "Décris :", ...p.map((l, i) => `– ${l}${i === p.length - 1 ? "." : " ;"}`)].join("\n");
}

export const consigne: DefinitionAide<EntreeConsigne, Consigne> = {
  aide: "consigne",
  sortieMax: 500,
  systeme: (e) => e.histoire.mode === "classe"
    ? assembler(
      REGLES_COMMUNES,
      `Tu transformes l'indication courte d'un enseignant en consigne d'écriture pour un élève (${lecteurs(e.histoire)}), qui écrira seul une scène du livre.
Modèle à suivre exactement :
- « phrases » : une ou deux phrases qui tutoient l'élève, avec le vocabulaire d'un élève de cet âge. Elles situent la scène et disent ce qu'il faut raconter.
- « points » : deux ou trois points de quelques mots chacun, ce qu'il faudra décrire (« sa lanterne et son visage », « ce que ressent Lou »), adaptés à cette scène et différents de ceux des scènes voisines quand c'est possible.
Tu n'inventes AUCUN événement ni AUCUN personnage que l'indication, la préparation ou le chapitre ne nomment pas ; tu ne décides pas de la suite à la place de l'élève.
N'écris pas « Décris : » toi-même ; pas de tiret ni de numéro dans les points, qui commencent par une minuscule.`,
    )
    : assembler(
      REGLES_COMMUNES,
      `Tu transformes l'indication courte d'un adulte, qui écrit son propre livre, en note d'intention pour lui-même, sur ce modèle : « La rencontre avec le passeur ; à faire sentir : sa lanterne, sa voix, la peur de Lou. »
Une ou deux lignes, sans tutoiement ni « Décris : ». Tu n'inventes aucun événement ni personnage absent de l'indication, de la préparation ou du chapitre.
Rends la note dans « phrases » et laisse « points » vide.`,
    ),
  message: (e) => assembler(
    presentation(e.histoire),
    blocCarnet(e.carnet),
    e.chapitre ? bloc("chapitre", `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}`) : "",
    bloc("scenes_voisines", e.voisines.map((v) => `${v.titre}${v.consigne ? ` — consigne : ${v.consigne.replace(/\n/g, " ")}` : ""}`)),
    bloc("indication", e.indication),
    "Écris la consigne de cette scène.",
  ),
  schema: { nom: "consigne", schema: objet({ phrases: chaine, points: liste(chaine) }) },
  lire: (json, e) => {
    const o = champs(json);
    const phrases = texte(o?.phrases, 500);
    if (!phrases) return null;
    if (e.histoire.mode === "personnel") return { texte: phrases };
    const points = textes(o?.points, 80);
    if (!points || points.length < 2) return null;
    return { texte: composerConsigne(phrases.replace(/\s*Décris\s*:?\s*$/i, ""), points.slice(0, 3)) };
  },
  simuler: (e) => e.histoire.mode === "classe"
    ? { phrases: `${e.indication.charAt(0).toLocaleUpperCase("fr")}${e.indication.slice(1)}. Raconte ce qui se passe.`, points: ["le lieu", "ce que ressent ton héros"] }
    : { phrases: `${e.indication} ; à faire sentir : le lieu, l'émotion.`, points: [] },
};
