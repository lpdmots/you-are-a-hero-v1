import { assembler, bloc, chaine, champs, liste, objet, texte, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, blocCarnet, presentation, type Carnet, type Histoire } from "./contexte";

/**
 * Idées de choix (F13.3) : dix idées en une demande, rangées par pertinence, montrées trois
 * par trois. Chacune a un libellé, une ligne d'intention et une destination : une nouvelle
 * scène avec son titre, ou une scène existante du chapitre que l'IA désigne (F13-AC11 : choix
 * et titres dans la même réponse). La génération seule n'ajoute rien (F13-AC08).
 */
export type SceneConnue = { ref: string; titre: string; consigne?: string };

export type EntreeIdeesChoix = {
  histoire: Histoire;
  carnet?: Carnet;
  chapitre: { titre: string; resume?: string };
  scene: { titre: string; consigne: string | null; paragraphes: string[] };
  /** Les autres scènes du chapitre, destinations possibles */
  scenes: SceneConnue[];
  objets: string[];
  /** Libellés des choix déjà dans la scène, et des idées déjà montrées : à ne pas reproposer */
  choixExistants: string[];
  dejaMontrees: string[];
  orientation?: string;
};

export type IdeeDeChoix = {
  libelle: string;
  intention: string;
  destination: { sorte: "nouvelle"; titre: string } | { sorte: "existante"; ref: string };
};
export type IdeesDeChoix = { idees: IdeeDeChoix[] };

export const ideesChoix: DefinitionAide<EntreeIdeesChoix, IdeesDeChoix> = {
  aide: "idees-choix",
  sortieMax: 2500,
  systeme: () => assembler(
    REGLES_COMMUNES,
    `Tu proposes dix idées de choix pour la fin d'une scène d'un livre-jeu : ce que le lecteur (« tu ») peut décider de faire ensuite. Range-les de la plus intéressante à la moins intéressante.
Pour chaque idée :
- « libelle » : l'action, à l'infinitif, en quelques mots (« Suivre la chouette », « Allumer la lanterne de secours ») ;
- « intention » : en une phrase courte, ce qui arrivera ou ce que ce choix fera vivre au lecteur ;
- « scene » : la référence d'une scène existante du chapitre (« S012 ») si ce choix y mène naturellement, sinon une chaîne vide ;
- « titre » : pour une nouvelle scène, son titre de deux à sept mots, dans la forme des titres du chapitre ; une chaîne vide si « scene » est remplie.
Exigences :
- Des choix réellement différents : deux façons de dire la même action ne font pas deux idées ; une convergence plus loin reste possible si l'expérience diffère.
- Chaque choix tient compte de la situation à la fin de la scène et de ce que le héros a ou n'a pas : pas de clé si elle n'a pas été trouvée, pas de lieu qui contredit l'univers.
- Varie les sortes de choix : prudence ou audace, aider ou fuir, utiliser un objet, suivre une piste, revenir sur ses pas.
- Ne reprends ni les choix déjà dans la scène, ni les idées déjà montrées.
- Ne rédige pas la scène suivante : le texte reste celui des élèves.
- Si une orientation est donnée par l'adulte, suis-la.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    blocCarnet(e.carnet),
    bloc("chapitre", `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}`),
    bloc("scenes_du_chapitre", e.scenes.map((s) => `${s.ref} « ${s.titre} »${s.consigne ? ` — ${s.consigne.replace(/\n/g, " ")}` : ""}`)),
    bloc("objets_de_l_histoire", e.objets),
    bloc("scene", [`Titre : ${e.scene.titre}`, e.scene.consigne ? `Consigne : ${e.scene.consigne}` : "", e.scene.paragraphes.length ? `Texte :\n${e.scene.paragraphes.join("\n")}` : "Texte : pas encore écrit."].filter(Boolean).join("\n")),
    bloc("choix_deja_dans_la_scene", e.choixExistants),
    bloc("idees_deja_montrees", e.dejaMontrees),
    bloc("orientation", e.orientation),
    "Propose dix idées de choix.",
  ),
  schema: {
    nom: "idees_de_choix",
    schema: objet({ idees: liste(objet({ libelle: chaine, intention: chaine, scene: chaine, titre: chaine })) }),
  },
  lire: (json, e) => {
    const brutes = champs(json)?.idees;
    if (!Array.isArray(brutes)) return null;
    const refs = new Set(e.scenes.map((s) => s.ref));
    const vus = new Set([...e.choixExistants, ...e.dejaMontrees].map((l) => l.toLocaleLowerCase("fr")));
    const idees: IdeeDeChoix[] = [];
    for (const b of brutes) {
      const o = champs(b);
      const libelle = texte(o?.libelle, 120)?.replace(/[.]+$/, "");
      const intention = texte(o?.intention, 300);
      if (!libelle || !intention || vus.has(libelle.toLocaleLowerCase("fr"))) continue;
      const ref = typeof o?.scene === "string" ? o.scene.trim().toUpperCase() : "";
      const titre = texte(o?.titre, 80)?.replace(/[.]+$/, "");
      const destination = refs.has(ref) ? { sorte: "existante" as const, ref } : titre ? { sorte: "nouvelle" as const, titre } : null;
      if (!destination) continue;
      vus.add(libelle.toLocaleLowerCase("fr"));
      idees.push({ libelle, intention, destination });
    }
    return idees.length >= 3 ? { idees: idees.slice(0, 10) } : null;
  },
  simuler: (e) => ({
    idees: Array.from({ length: 10 }, (_, i) => ({
      libelle: `Idée ${i + 1 + e.dejaMontrees.length}`,
      intention: "Le lecteur découvre un nouveau lieu.",
      scene: i === 1 && e.scenes[0] ? e.scenes[0].ref : "",
      titre: i === 1 && e.scenes[0] ? "" : `Nouvelle scène ${i + 1}`,
    })),
  }),
};
