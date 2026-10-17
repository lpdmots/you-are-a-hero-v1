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
  simuler: (e) => ({
    ensembles: Array.from({ length: 10 }, (_, i) => ({ partie: `Partie ${e.dejaMontres.length + i + 1}`, chapitre: `Chapitre ${i + 1}`, resume: "Le héros arrive dans un lieu nouveau." })),
  }),
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
  simuler: (e) => ({ chapitres: Array.from({ length: 6 }, (_, i) => ({ titre: `Chapitre ${e.dejaMontres.length + i + 1}`, resume: "Le héros avance." })) }),
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
  simuler: (e) => ({ resume: e.resumeActuel || `Le héros traverse ${e.chapitre.toLocaleLowerCase("fr")}.` }),
};
