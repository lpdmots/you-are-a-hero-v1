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
- Un résumé dit en deux ou trois phrases l'intention du chapitre et ce qui s'y passe, sans écrire les scènes.
- Tiens compte de la préparation et du plan existant : pas de doublon, pas de contradiction, une suite logique.
- Ne reprends aucun titre déjà proposé. Si une orientation est donnée, suis-la.`;

export type Ensemble = { partie: string; chapitre: string; resume: string };

/** « Partie 3 : Le marais » → « Le marais » : certains modèles recopient l'étiquette. */
const sansEtiquette = (t: string | null): string | null => t?.replace(/^(partie|chapitre)\s*\d*\s*[:.—–-]\s*/i, "").trim() || null;

const ENSEMBLES_SIMULES: Ensemble[] = [
  { partie: "Le marais des lucioles", chapitre: "La barque sans rames", resume: "Le héros trouve une barque qui avance seule. Il doit décider s'il la suit dans le brouillard ou s'il longe la rive à pied." },
  { partie: "La tour du guetteur", chapitre: "L'escalier qui grince", resume: "Au sommet d'une tour en ruine vit un guetteur qui a tout vu. Il ne parle qu'à ceux qui répondent à sa devinette." },
  { partie: "Le village englouti", chapitre: "Les cloches sous l'eau", resume: "Quand la marée descend, on entend sonner des cloches. Le héros découvre un chemin de pierres qui mène au clocher." },
  { partie: "La forêt qui chuchote", chapitre: "Les arbres messagers", resume: "Les arbres se transmettent des nouvelles. Le héros apprend qu'on le cherche, et doit choisir à qui faire confiance." },
  { partie: "Le pont de lianes", chapitre: "La traversée", resume: "Un pont fragile enjambe un ravin. Le héros doit traverser avec ce qu'il porte, ou laisser quelque chose derrière lui." },
  { partie: "La grotte aux échos", chapitre: "Les voix d'autrefois", resume: "Dans la grotte, les échos répètent des phrases anciennes. L'une d'elles donne un indice sur la suite du voyage." },
  { partie: "Le marché flottant", chapitre: "Le marchand de cartes", resume: "Sur des radeaux reliés entre eux, on vend de tout. Un marchand propose une carte du brouillard contre un service." },
  { partie: "Les collines du vent", chapitre: "Le cerf-volant perdu", resume: "Un enfant a perdu son cerf-volant dans les collines. L'aider fait perdre du temps, mais il connaît un raccourci." },
  { partie: "Le phare éteint", chapitre: "La lampe à rallumer", resume: "Le phare ne brille plus depuis longtemps. Le héros comprend que le rallumer pourrait guider les passeurs perdus." },
  { partie: "Le retour au port", chapitre: "Ceux qui attendent", resume: "Le héros revient avec ce qu'il a appris. Sur le quai, chacun attend une réponse différente." },
  { partie: "L'île aux oiseaux", chapitre: "Le nid géant", resume: "Une île couverte d'oiseaux cache un nid immense. Ce qui dort dedans pourrait aider le héros, ou le retarder." },
  { partie: "La vallée des horloges", chapitre: "Le temps arrêté", resume: "Toutes les horloges de la vallée se sont arrêtées à la même heure. Le héros cherche pourquoi." },
];

const CHAPITRES_SIMULES: ChapitrePropose[] = [
  { titre: "Le gué des saules", resume: "Le héros doit traverser la rivière là où l'eau est basse. Des saules penchés cachent un passage, et quelqu'un l'observe." },
  { titre: "La cabane du pêcheur", resume: "Une cabane abandonnée garde des traces d'un voyageur passé avant lui. Un carnet y raconte une partie du chemin." },
  { titre: "Le chemin des lanternes", resume: "Des lanternes s'allument une à une sur le passage du héros. Elles mènent quelque part, mais pas forcément où il veut aller." },
  { titre: "La clairière ronde", resume: "Au milieu de la forêt, une clairière parfaitement ronde où rien ne pousse. Le héros y fait une rencontre inattendue." },
  { titre: "Le ruisseau qui parle", resume: "Le ruisseau répond aux questions, mais seulement par oui ou par non. Le héros doit bien choisir ce qu'il demande." },
  { titre: "La porte dans la colline", resume: "Une petite porte ronde s'ouvre dans le flanc d'une colline. Derrière, un couloir descend sous la terre." },
  { titre: "Le campement de nuit", resume: "La nuit tombe, il faut s'arrêter. Autour du feu, le héros partage ses provisions et apprend une nouvelle inquiétante." },
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
      const resume = texte(o?.resume, 600);
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
      const resume = texte(o?.resume, 600);
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
    `Tu proposes le résumé d'un chapitre : deux à quatre phrases qui disent l'intention du chapitre et ce qui doit s'y passer, pour guider les élèves qui l'écriront et les aides de la suite.
- Pars du résumé actuel s'il existe : garde ce qu'il dit et complète-le.
- Appuie-toi sur les scènes déjà prévues et sur la place du chapitre dans le plan ; n'invente pas de rebondissement que rien n'annonce.
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
  // Le résumé actuel, complété d'une phrase : la proposition diffère toujours de ce qui est en place
  simuler: (e) => ({ resume: `${e.resumeActuel ? `${e.resumeActuel.trim()} ` : ""}Le héros y trouve un premier indice sur la suite du chemin.` }),
};
