import { assembler, bloc, chaine, champs, liste, objet, texte, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, blocCarnet, blocPlan, presentation, type Carnet, type Histoire, type Plan } from "./contexte";

/**
 * Parties, chapitres et résumés (F13.5). Dix ensembles « partie, premier chapitre, résumé » en
 * une demande, montrés trois par trois ; six chapitres pour une partie, livrés un à un ; un
 * résumé proposé pour un chapitre. Rien n'est créé avant que l'adulte n'ajoute (F13-AC15).
 */
export type EntreePlan = {
  histoire: Histoire;
  carnet: Carnet;
  plan: Plan;
  orientation?: string;
  /** Titres déjà proposés, à ne pas reproposer */
  dejaMontres: string[];
};

const REGLES_PLAN = `- Le plan sert à organiser l'écriture : une partie regroupe des chapitres ; un chapitre est un lieu ou un moment de l'aventure que quelques élèves écriront ensemble.
- Des titres courts (deux à six mots), évocateurs, sans dévoiler la fin, sans étiquette (« Le marais », pas « Partie : Le marais »).
- Un résumé décrit le lieu du chapitre et son ambiance, en une ou deux phrases courtes (quarante mots au plus) : ce qu'on y voit, la lumière, ce qui le rend reconnaissable. Il sert d'abord à l'image du chapitre.
- Pas d'intrigue dans un résumé : ni événement, ni rencontre, ni indice, ni choix à faire ; les élèves les inventeront scène après scène. Aucun personnage n'y agit.
- Tiens compte de la préparation et du plan existant : pas de doublon, pas de contradiction, une suite logique.
- Ne reprends aucun titre déjà proposé. Si une orientation est donnée, suis-la.`;

export type Ensemble = { partie: string; chapitre: string; resume: string };

/** « Partie 3 : Le marais » → « Le marais » : certains modèles recopient l'étiquette. */
const sansEtiquette = (t: string | null): string | null => t?.replace(/^(partie|chapitre)\s*\d*\s*[:.—–-]\s*/i, "").trim() || null;

const ENSEMBLES_SIMULES: Ensemble[] = [
  { partie: "Le marais des lucioles", chapitre: "La barque sans rames", resume: "Un marais d'eau noire sous la brume, où des milliers de lucioles flottent entre les roseaux." },
  { partie: "La tour du guetteur", chapitre: "L'escalier qui grince", resume: "Une tour de pierre en ruine sur une colline nue, son escalier de bois tordu montant vers le ciel gris." },
  { partie: "Le village englouti", chapitre: "Les cloches sous l'eau", resume: "Un village à demi englouti dans une baie calme ; seuls les toits et un clocher aux cloches muettes dépassent de l'eau verte." },
  { partie: "La forêt qui chuchote", chapitre: "Les arbres messagers", resume: "Une forêt de grands hêtres aux feuilles argentées, où le vent fait bruisser les branches comme des voix." },
  { partie: "Le pont de lianes", chapitre: "La traversée", resume: "Un pont de lianes au-dessus d'un ravin profond, dans une lumière dorée de fin d'après-midi." },
  { partie: "La grotte aux échos", chapitre: "Les voix d'autrefois", resume: "Une grande grotte aux parois humides, éclairée par des cristaux bleus qui brillent dans le noir." },
  { partie: "Le marché flottant", chapitre: "Le marchand de cartes", resume: "Des radeaux colorés reliés par des cordes sur un lac, couverts d'étals, de paniers et de lanternes." },
  { partie: "Les collines du vent", chapitre: "Le cerf-volant perdu", resume: "Des collines d'herbe haute balayées par le vent, sous un ciel immense parcouru de nuages rapides." },
  { partie: "Le phare éteint", chapitre: "La lampe à rallumer", resume: "Un phare blanc et rouge, éteint, au bout d'une jetée de rochers battue par les vagues." },
  { partie: "Le retour au port", chapitre: "Ceux qui attendent", resume: "Le petit port du village au soir, ses quais de bois, ses barques amarrées et ses lanternes allumées." },
  { partie: "L'île aux oiseaux", chapitre: "Le nid géant", resume: "Une île rocheuse couverte d'oiseaux de mer, avec au sommet un nid immense fait de branches." },
  { partie: "La vallée des horloges", chapitre: "Le temps arrêté", resume: "Une vallée paisible semée d'horloges de toutes tailles, posées dans l'herbe et sur les toits." },
];

const CHAPITRES_SIMULES: ChapitrePropose[] = [
  { titre: "Le gué des saules", resume: "Un gué peu profond sur une rivière claire, bordé de saules penchés dont les branches touchent l'eau." },
  { titre: "La cabane du pêcheur", resume: "Une cabane de pêcheur en planches grises au bord de l'eau, entourée de filets qui sèchent." },
  { titre: "Le chemin des lanternes", resume: "Un sentier de forêt bordé de lanternes de papier suspendues aux branches, dans la nuit tombante." },
  { titre: "La clairière ronde", resume: "Une clairière parfaitement ronde au milieu de la forêt, au sol de mousse, baignée de lumière." },
  { titre: "Le ruisseau qui parle", resume: "Un ruisseau qui serpente entre des pierres moussues, sous un couvert de fougères." },
  { titre: "La porte dans la colline", resume: "Une colline verte où s'ouvre une petite porte ronde en bois, à demi cachée par les herbes." },
  { titre: "Le campement de nuit", resume: "Un campement sous les étoiles, un feu qui crépite au pied de grands pins, la nuit tout autour." },
];

export const parties: DefinitionAide<EntreePlan, { ensembles: Ensemble[] }> = {
  aide: "parties",
  sortieMax: 2500,
  systeme: () => assembler(
    REGLES_COMMUNES,
    `Tu proposes dix nouvelles parties pour le plan du livre, rangées de la plus utile à la moins utile pour la suite du plan. Chaque proposition comprend le titre de la partie, le titre de son premier chapitre et le résumé de ce chapitre.`,
    REGLES_PLAN,
  ),
  message: (e) => assembler(presentation(e.histoire), blocCarnet(e.carnet), blocPlan(e.plan), bloc("deja_proposes", e.dejaMontres), bloc("orientation", e.orientation), "Propose dix parties."),
  schema: { nom: "parties", schema: objet({ ensembles: liste(objet({ partie: chaine, chapitre: chaine, resume: chaine })) }) },
  lire: (json) => {
    const l = champs(json)?.ensembles;
    if (!Array.isArray(l)) return null;
    const ensembles = l.flatMap((b) => {
      const o = champs(b);
      const partie = sansEtiquette(texte(o?.partie, 80));
      const chapitre = sansEtiquette(texte(o?.chapitre, 80));
      const resume = texte(o?.resume, 400);
      return partie && chapitre && resume ? [{ partie, chapitre, resume }] : [];
    });
    return ensembles.length >= 3 ? { ensembles: ensembles.slice(0, 10) } : null;
  },
  // Dix ensembles plausibles, toujours les mêmes : une seconde demande, qui les a déjà vus, rend les suivants
  simuler: (e) => {
    const vus = new Set(e.dejaMontres.map((t) => t.toLocaleLowerCase("fr")));
    // Ceux qui n'ont pas été vus d'abord, puis les autres : le serveur écarte ceux déjà montrés
    const neufs = ENSEMBLES_SIMULES.filter((x) => !vus.has(x.partie.toLocaleLowerCase("fr")));
    return { ensembles: [...neufs, ...ENSEMBLES_SIMULES.filter((x) => !neufs.includes(x))].slice(0, 10) };
  },
};

export type EntreeChapitres = EntreePlan & { partie: string };
export type ChapitrePropose = { titre: string; resume: string };

export const chapitres: DefinitionAide<EntreeChapitres, { chapitres: ChapitrePropose[] }> = {
  aide: "chapitres",
  sortieMax: 1500,
  systeme: () => assembler(
    REGLES_COMMUNES,
    `Tu proposes six nouveaux chapitres pour une partie du plan, chacun avec son titre et son résumé, rangés du plus utile au moins utile pour cette partie.`,
    REGLES_PLAN,
  ),
  message: (e) => assembler(presentation(e.histoire), blocCarnet(e.carnet), blocPlan(e.plan), bloc("partie", e.partie), bloc("deja_proposes", e.dejaMontres), bloc("orientation", e.orientation), `Propose six chapitres pour la partie « ${e.partie} ».`),
  schema: { nom: "chapitres", schema: objet({ chapitres: liste(objet({ titre: chaine, resume: chaine })) }) },
  lire: (json) => {
    const l = champs(json)?.chapitres;
    if (!Array.isArray(l)) return null;
    const chapitres = l.flatMap((b) => {
      const o = champs(b);
      const titre = sansEtiquette(texte(o?.titre, 80));
      const resume = texte(o?.resume, 400);
      return titre && resume ? [{ titre, resume }] : [];
    });
    return chapitres.length ? { chapitres: chapitres.slice(0, 6) } : null;
  },
  simuler: (e) => {
    const vus = new Set(e.dejaMontres.map((t) => t.toLocaleLowerCase("fr")));
    const neufs = CHAPITRES_SIMULES.filter((x) => !vus.has(x.titre.toLocaleLowerCase("fr")));
    return { chapitres: [...neufs, ...CHAPITRES_SIMULES.filter((x) => !neufs.includes(x))].slice(0, 6) };
  },
};

export type EntreeResume = {
  histoire: Histoire;
  carnet: Carnet;
  plan: Plan;
  partie: string;
  chapitre: string;
  resumeActuel: string;
  /** Les scènes du chapitre : titre et consigne, pour un résumé fidèle à ce qui est prévu */
  scenes: { titre: string; consigne?: string }[];
};

export const resume: DefinitionAide<EntreeResume, { resume: string }> = {
  aide: "resume",
  sortieMax: 500,
  systeme: () => assembler(
    REGLES_COMMUNES,
    `Tu proposes le résumé d'un chapitre : une ou deux phrases courtes (quarante mots au plus) qui décrivent le lieu du chapitre et son ambiance — ce qu'on y voit, la lumière, ce qui le rend reconnaissable. Il sert d'abord à créer l'image du chapitre.
- Pas d'intrigue : ni événement, ni rencontre, ni indice, ni choix à faire ; les élèves les inventeront scène après scène. Aucun personnage n'y agit.
- Pars du résumé actuel s'il existe : garde le lieu qu'il décrit, retire ce qui raconte.
- Appuie-toi sur le titre, les scènes déjà prévues et la place du chapitre dans le plan pour savoir où l'on est.
- Pas de titre, pas de liste.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire), blocCarnet(e.carnet), blocPlan(e.plan),
    bloc("chapitre", `${e.chapitre} (partie « ${e.partie} »)`), bloc("resume_actuel", e.resumeActuel),
    bloc("scenes_du_chapitre", e.scenes.map((s) => `${s.titre}${s.consigne ? ` — ${s.consigne.replace(/\n/g, " ")}` : ""}`)),
    "Propose le résumé de ce chapitre.",
  ),
  schema: { nom: "resume", schema: objet({ resume: chaine }) },
  lire: (json) => {
    const t = texte(champs(json)?.resume, 1200);
    return t ? { resume: t } : null;
  },
  // Un lieu, et la proposition diffère toujours de ce qui est en place
  simuler: (e) => ({ resume: e.resumeActuel.trim() ? `${e.resumeActuel.trim()} La brume y adoucit toutes les couleurs.` : "Un sous-bois humide où la brume adoucit toutes les couleurs." }),
};
