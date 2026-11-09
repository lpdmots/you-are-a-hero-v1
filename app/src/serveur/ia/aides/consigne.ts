import { assembler, bloc, chaine, champs, liste, objet, texte, textes, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, blocCarnet, eleve, presentation, type Carnet, type Histoire } from "./contexte";
import { listePropre, VERIFICATION } from "@/domaine/verification";

/**
 * Formuler une consigne (F13.2) d'après l'indication courte de l'adulte. En classe, deux éléments
 * (9 novembre 2026, à la place de « Décris : ») : la consigne, une ou deux phrases qui tutoient
 * l'élève, et la liste de vérification, deux à quatre éléments courts à l'infinitif que l'élève
 * coche en se relisant (« Décrire le garde. »). En mode personnel, une note d'intention pour soi,
 * sans liste.
 */
export type EntreeConsigne = {
  histoire: Histoire;
  /** Vide : la consigne se tire du titre, des choix qui mènent ici et du chapitre (F13, « Jamais de refus faute de texte ») */
  indication: string;
  /** Les éléments que l'adulte a déjà notés dans la liste : l'aide les reprend ou les précise */
  liste?: string[];
  titre?: string;
  /** Les phrases des choix qui mènent à la scène */
  menent?: string[];
  carnet?: Carnet;
  chapitre?: { titre: string; resume?: string };
  /** Les scènes voisines : leur titre et leur consigne, pour ne pas répéter les mêmes points */
  voisines: { titre: string; consigne?: string }[];
};

export type Consigne = { texte: string; liste: string[] };

/** Un élément de la liste : une majuscule, un point final, sans tiret ni numéro. */
export function elementDeListe(brut: string): string {
  const e = brut.replace(/^[\s–\-•*\d.)]+/, "").replace(/[\s;,]+$/, "").trim();
  if (!e) return "";
  const majuscule = e.charAt(0).toLocaleUpperCase("fr") + e.slice(1);
  return /[.!?…]$/.test(majuscule) ? majuscule : `${majuscule}.`;
}

export const consigne: DefinitionAide<EntreeConsigne, Consigne> = {
  aide: "consigne",
  sortieMax: 500,
  systeme: (e) => e.histoire.mode === "classe"
    ? assembler(
      REGLES_COMMUNES,
      `Tu transformes l'indication courte d'un enseignant en consigne d'écriture pour un ${eleve(e.histoire)}, qui écrira seul une scène du livre, et en liste de vérification qu'il cochera en se relisant.
Modèle à suivre exactement :
- « consigne » : une ou deux phrases qui tutoient l'élève, avec le vocabulaire d'un élève de cet âge. Elles situent la scène et disent ce qu'il faut raconter. Pas de liste dans la consigne.
- « liste » : deux à quatre éléments, chacun une courte action d'écriture à l'infinitif qui commence par une majuscule et finit par un point (« Décrire le garde. », « Écrire le dialogue entre Lou et le passeur. », « Montrer ce que ressent Lou. »), 70 caractères au plus, adaptés à cette scène et différents de ceux des scènes voisines quand c'est possible.
Tu n'inventes AUCUN événement ni AUCUN personnage que l'indication, la préparation ou le chapitre ne nomment pas ; tu ne décides pas de la suite à la place de l'élève.
Quand l'enseignant a déjà noté des éléments, garde leur idée : reformule-les au besoin, complète sans dépasser quatre.
Sans indication écrite, pars du titre de la scène, des choix qui y mènent et du chapitre ; reste au plus près de ce qu'ils disent.`,
    )
    : assembler(
      REGLES_COMMUNES,
      `Tu transformes l'indication courte d'un adulte, qui écrit son propre livre, en note d'intention pour lui-même, sur ce modèle : « La rencontre avec le passeur ; à faire sentir : sa lanterne, sa voix, la peur de Lou. »
Une ou deux lignes, sans tutoiement. Tu n'inventes aucun événement ni personnage absent de l'indication, de la préparation ou du chapitre.
Rends la note dans « consigne » et laisse « liste » vide.
Sans indication écrite, pars du titre de la scène, des choix qui y mènent et du chapitre ; reste au plus près de ce qu'ils disent.`,
    ),
  message: (e) => assembler(
    presentation(e.histoire),
    blocCarnet(e.carnet),
    e.chapitre ? bloc("chapitre", `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}`) : "",
    bloc("scenes_voisines", e.voisines.map((v) => `${v.titre}${v.consigne ? ` — consigne : ${v.consigne.replace(/\n/g, " ")}` : ""}`)),
    e.titre ? bloc("titre_de_la_scene", e.titre) : "",
    bloc("choix_qui_menent_ici", e.menent ?? []),
    bloc("indication", e.indication),
    bloc("liste_deja_notee", e.liste ?? []),
    e.histoire.mode === "classe" ? "Écris la consigne de cette scène et sa liste de vérification." : "Écris la note d'intention de cette scène.",
  ),
  schema: { nom: "consigne", schema: objet({ consigne: chaine, liste: liste(chaine) }) },
  lire: (json, e) => {
    const o = champs(json);
    const phrases = texte(o?.consigne, 600);
    if (!phrases) return null;
    if (e.histoire.mode === "personnel") return { texte: phrases, liste: [] };
    const elements = (textes(o?.liste, 120) ?? []).map(elementDeListe).filter((l) => l && l.length <= VERIFICATION.longueurMax);
    if (elements.length < 2) return null;
    // Une consigne encore écrite à l'ancienne garde ses phrases seules : la liste dit le reste
    return { texte: phrases.split(/\n\s*Décris\s*:/i)[0].trim(), liste: listePropre(elements.slice(0, 4)) };
  },
  simuler: (e) => {
    const depart = e.indication.trim() || e.titre?.trim() || "la scène";
    return e.histoire.mode === "classe"
      ? { consigne: `${depart.charAt(0).toLocaleUpperCase("fr")}${depart.slice(1)}. Raconte ce qui se passe.`, liste: ["Décrire le lieu.", "Montrer ce que ressent ton héros."] }
      : { consigne: `${depart} ; à faire sentir : le lieu, l'émotion.`, liste: [] };
  },
};
