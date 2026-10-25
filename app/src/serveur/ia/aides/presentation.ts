import { PRESENTATION_MAX, presentationPropre } from "@/domaine/bibliotheque";
import { assembler, bloc, chaine, champs, objet, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, blocCarnet, blocPlan, lecteurs, presentation as presentationDeLHistoire, type Carnet, type Histoire, type Plan } from "./contexte";

/**
 * « ✦ Proposer » la présentation d'un livre proposé à la bibliothèque (F15, « Liste, tri,
 * filtres ») : deux ou trois phrases qui donnent envie d'ouvrir le livre, d'après la Préparation,
 * le plan et le début du livre. Payée en étoiles comme les autres aides ; la présentation passe
 * ensuite par la relecture du porteur.
 */
export type EntreePresentation = {
  histoire: Histoire;
  carnet?: Carnet;
  plan?: Plan;
  /** Les premiers passages du livre, en texte, quelques paragraphes */
  debut: string | null;
  /** La présentation déjà écrite, s'il y en a une : une autre tournure est demandée */
  actuelle?: string;
};
export type Presentation = { presentation: string };

export const presentation: DefinitionAide<EntreePresentation, Presentation> = {
  aide: "presentation",
  sortieMax: 300,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu écris la présentation d'un livre pour la bibliothèque du site, où des ${lecteurs(e.histoire)} et leurs familles choisissent quoi lire.
- Deux ou trois phrases, ${PRESENTATION_MAX - 50} caractères au plus, au présent.
- Elle donne envie d'ouvrir le livre : le lieu, le héros, ce qui l'attend au début.
- Elle ne dévoile ni la fin, ni les choix du lecteur, ni les rebondissements.
- Elle ne nomme ni les élèves, ni l'école, ni l'enseignant, et ne dit pas qui a écrit le livre.
- ${e.histoire.recit === "choix" ? "Elle peut s'adresser au lecteur par « tu », comme le livre." : "Elle parle du héros à la troisième personne."}
- Pas de point d'exclamation en série, pas de question rhétorique en ouverture.`,
  ),
  message: (e) => assembler(
    presentationDeLHistoire(e.histoire),
    blocCarnet(e.carnet),
    blocPlan(e.plan),
    bloc("debut_du_livre", e.debut),
    e.actuelle ? bloc("presentation_actuelle", e.actuelle) : "",
    e.actuelle ? "Propose une autre présentation, différente de l'actuelle." : "Propose la présentation.",
  ),
  schema: { nom: "presentation", schema: objet({ presentation: chaine }) },
  lire: (json, e) => {
    const p = presentationPropre(champs(json)?.presentation);
    return p && p !== e.actuelle ? { presentation: p } : null;
  },
  simuler: () => ({
    presentation: "Au bord du fleuve, la brume ne se lève plus. Tu suis le vieux passeur et sa lanterne vers l'autre rive, là où personne n'ose aller.",
  }),
};
