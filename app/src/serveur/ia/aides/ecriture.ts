import { compterMots } from "@/domaine/correction";
import { assembler, bloc, chaine, champs, liste, objet, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, blocCarnet, eleve, lecteurs, presentation, type Carnet, type Histoire } from "./contexte";

/**
 * « ✦ Écrire » (F13.6, décidé par le porteur le 17 octobre 2026) : le texte d'une scène vide,
 * d'après sa consigne, pour l'adulte qui n'a pas le temps de l'écrire ou qui écrit seul. L'IA
 * n'écrit que le récit : ni choix, ni action de jeu, ni note ; les choix se posent ensuite. Ce
 * qui mène à la scène part avec elle, pour que le récit s'enchaîne : la fin des scènes d'avant
 * et la phrase du choix qui conduit ici.
 */
export type EntreeEcriture = {
  histoire: Histoire;
  consigne: string;
  titre?: string;
  carnet?: Carnet;
  chapitre?: { titre: string; resume?: string };
  /** Les scènes voisines du chapitre : leur titre et leur consigne */
  voisines: { titre: string; consigne?: string }[];
  /** Ce qui mène ici : la fin du texte des scènes d'avant, et la phrase du choix */
  avant: { fin: string; choix?: string }[];
  /** Le nombre de mots visé */
  cible: number;
};

export type Ecriture = { paragraphes: string[] };

export const ecriture: DefinitionAide<EntreeEcriture, Ecriture> = {
  aide: "ecriture",
  // Jusqu'à 1 500 mots, en JSON
  sortieMax: 8000,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu écris le texte d'une scène du livre, d'après sa consigne.${e.histoire.mode === "classe"
      ? ` Le livre est écrit par une classe d'${eleve(e.histoire, true)} : écris comme un bon élève de cet âge pourrait le faire, avec un vocabulaire et des phrases à sa portée, vivant et clair.`
      : ` Le livre est écrit par un adulte, pour des ${lecteurs(e.histoire)} : un style vivant, à leur portée.`}
- Suis la consigne : ce qu'elle demande de raconter et de décrire.
- Enchaîne avec ce qui mène à la scène, quand il est fourni : le lecteur arrive d'une de ces scènes.
- Garde la personne et le temps du récit des scènes d'avant (le héros nommé à la troisième personne, ou « tu ») ; à défaut, la troisième personne au passé.
- N'invente aucun personnage important ni aucun événement que la consigne, la préparation ou le chapitre n'annoncent pas ; tu peux ajouter des détails de lieu, de sensation, de pensée et de dialogue.
- Ne décide pas de la suite : n'écris ni les choix proposés au lecteur, ni « rends-toi au », ni une fin de l'histoire que la consigne ne demande pas.
- Longueur : environ ${e.cible} mots en tout, en paragraphes de deux à six phrases.
- Ne commente rien : rends seulement les paragraphes du récit.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    blocCarnet(e.carnet),
    e.chapitre ? bloc("chapitre", `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}`) : "",
    bloc("scenes_voisines", e.voisines.map((v) => `${v.titre}${v.consigne ? ` — consigne : ${v.consigne.replace(/\n/g, " ")}` : ""}`)),
    bloc("ce_qui_mene_ici", e.avant.map((a) => `${a.fin}${a.choix ? `\n(Choix du lecteur pour arriver ici : « ${a.choix} »)` : ""}`).join("\n---\n")),
    e.titre ? bloc("titre_de_la_scene", e.titre) : "",
    bloc("consigne", e.consigne),
    `Écris le texte de cette scène, environ ${e.cible} mots.`,
  ),
  schema: { nom: "ecriture", schema: objet({ paragraphes: liste(chaine) }) },
  lire: (json) => {
    const o = champs(json);
    if (!o || !Array.isArray(o.paragraphes)) return null;
    const paragraphes = o.paragraphes
      .map((p) => (typeof p === "string" ? p.replace(/\s+/g, " ").trim() : ""))
      .filter(Boolean);
    if (!paragraphes.length || paragraphes.length > 40 || paragraphes.some((p) => p.length > 6000)) return null;
    // Une phrase de choix recopiée dans le récit ne se garde pas : les choix se posent à part
    if (paragraphes.some((p) => /rends-toi au|va au (n°|numéro|\d)/i.test(p))) return null;
    return { paragraphes };
  },
  simuler: (e) => {
    const paragraphes = [
      `${e.consigne.split("\n")[0].replace(/^(Raconte|Décris)[^:]*:?\s*/i, "")}`,
      "La brume glissait doucement sur l'eau. Lou retenait son souffle.",
    ];
    while (compterMots(paragraphes.join(" ")) < e.cible) paragraphes[1] += " Le vent faisait frissonner les roseaux.";
    return { paragraphes };
  },
};
