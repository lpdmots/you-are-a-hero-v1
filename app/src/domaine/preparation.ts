/**
 * Carnet de préparation (F02) : rubriques, guidage, rubriques du jeu et des phrases de choix.
 * Les textes du guidage partent de ceux de la maquette (10 octobre 2026) ; le design en
 * garde la version en vigueur.
 */
import type { Personnage } from "./personnages";
import type { Organisation, Recit } from "./projets";

export const RUBRIQUES = ["univers", "personnages", "enjeu", "etapes"] as const;
export type Rubrique = (typeof RUBRIQUES)[number];
/** Les rubriques à texte libre ; « Grandes étapes » montre le plan commun (F02-AC08). */
export type RubriqueTexte = Exclude<Rubrique, "etapes">;
export const estRubrique = (v: string): v is Rubrique => (RUBRIQUES as readonly string[]).includes(v);

export const NOM_RUBRIQUE: Record<Rubrique, string> = {
  univers: "Univers",
  personnages: "Personnages",
  enjeu: "Enjeu",
  etapes: "Grandes étapes",
};

export type Guidage = { question: string; relances: string[]; exemple: string };

/** Ajoutée le 18 octobre 2026 (F02, F10.2) : plusieurs héros possibles, au choix du lecteur. */
export const RELANCE_DES_HEROS = "Un seul héros, ou plusieurs au choix du lecteur ?";

const CLASSE: Record<Rubrique, Guidage> = {
  univers: {
    question: "Où se passe notre histoire, et qu’a-t-elle d’étrange ?",
    relances: ["À quelle époque ?", "Qu’est-ce qui est dangereux, qu’est-ce qui est beau ?", "Une règle magique ou mystérieuse ?"],
    exemple:
      "Un pays de lacs et de forêts noyé dans la brume. Des passeurs guident les voyageurs d’une rive à l’autre avec des lanternes. Quand les lanternes s’éteignent, les chemins changent de place.",
  },
  personnages: {
    question: "Qui est notre héros, et qu’est-ce qui le rend unique ?",
    relances: ["Quel âge a-t-il ? Que sait-il faire ?", "De quoi a-t-il peur ?", "Qui va l’aider, qui va le gêner ?", RELANCE_DES_HEROS],
    exemple: "Lou, 10 ans, fils du dernier passeur du village. Il connaît le chant des lanternes mais a peur de l’eau.",
  },
  enjeu: {
    question: "Que doit réussir notre héros, et que se passe-t-il s’il échoue ?",
    relances: ["Qu’est-ce qui l’oblige à partir ?", "Qu’est-ce qu’il risque de perdre ?"],
    exemple: "Retrouver son père, disparu dans la brume, avant que la dernière lanterne ne s’éteigne.",
  },
  etapes: {
    question: "Par quels lieux passe notre aventure ?",
    relances: ["Où commence-t-elle ?", "Où le héros peut-il se perdre ?", "Où se termine-t-elle ?"],
    exemple: "Le départ, au port ; la forêt, où les chemins bougent ; la montagne, où brille la dernière lanterne.",
  },
};

const ETAPES_CLASSIQUE: Guidage = {
  question: "Que se passe-t-il, du début à la fin ?",
  relances: ["Comment l’histoire commence-t-elle ?", "Qu’est-ce qui complique tout ?", "Comment se termine-t-elle ?"],
  exemple: "Lou quitte le port ; il se perd dans la forêt ; il rallume la dernière lanterne et retrouve son père.",
};

/** En projet personnel, le carnet s'adresse à l'auteur : « votre histoire », « votre héros ». */
const pourLAuteur = (texte: string): string => texte.replace(/\bnotre\b/g, "votre").replace(/\bNotre\b/g, "Votre");

export function guidage(rubrique: Rubrique, organisation: Organisation, recit: Recit): Guidage {
  let base = rubrique === "etapes" && recit === "classique" ? ETAPES_CLASSIQUE : CLASSE[rubrique];
  // Le lecteur ne choisit son héros que dans un récit à choix (F10.2, relance du 18 octobre 2026)
  if (rubrique === "personnages" && recit === "classique") base = { ...base, relances: base.relances.filter((r) => r !== RELANCE_DES_HEROS) };
  return organisation === "personnel" ? { ...base, question: pourLAuteur(base.question) } : base;
}

/** « Nous retenons… » avec la classe, « Je retiens… » pour l'auteur seul (F02-AC19). */
export const titreSynthese = (organisation: Organisation): string => (organisation === "classe" ? "Nous retenons…" : "Je retiens…");

export const introCarnet = (organisation: Organisation): string =>
  organisation === "classe"
    ? "Le carnet garde les décisions de la classe. Il sert de repère pendant l’écriture. Remplissez seulement ce qui vous sert."
    : "Le carnet garde vos décisions. Il sert de repère pendant l’écriture. Remplissez seulement ce qui vous sert.";

export const ETATS_PISTE = ["retenue", "discuter", "ecartee"] as const;
export type EtatPiste = (typeof ETATS_PISTE)[number];
export const NOM_ETAT_PISTE: Record<EtatPiste, string> = { retenue: "retenue", discuter: "à discuter", ecartee: "écartée" };
/** Une idée notée à la main, ou ajoutée par l'IA (F13-AC19) : « origine », pour la marquer ✦. */
export type Origine = "main" | "ia";
/** Dans l'étape Personnages, une idée ou une question appartient à un héros (F10.2, 18 octobre 2026). */
export type Piste = { id: string; rubrique: Rubrique; texte: string; etat: EtatPiste; origine: Origine; personnageId?: string | null };
/** Une question ajoutée à une étape, après les relances du guidage (F02, 17 octobre 2026). */
export type Question = { id: string; etape: Rubrique; texte: string; origine: Origine; personnageId?: string | null };

// ——— La Préparation en étapes (F02, décision du 17 octobre 2026) ———

/**
 * Les étapes du parcours : les quatre de l'histoire, puis deux facultatives, « Les choix »
 * (récit à choix seulement) et « Le jeu ». Rien n'est bloqué : on va où l'on veut.
 */
export const ETAPES_PREPARATION = [...RUBRIQUES, "choix", "jeu"] as const;
export type EtapePreparation = (typeof ETAPES_PREPARATION)[number];
export const estEtapePreparation = (v: unknown): v is EtapePreparation => typeof v === "string" && (ETAPES_PREPARATION as readonly string[]).includes(v);
export const estEtapeDeLHistoire = (e: EtapePreparation): e is Rubrique => (RUBRIQUES as readonly string[]).includes(e);
export const ETAPES_FACULTATIVES: readonly EtapePreparation[] = ["choix", "jeu"];

/** Les étapes d'un projet : un récit classique n'a pas « Les choix » (F02-AC20). */
export const etapesDe = (recit: Recit): EtapePreparation[] => ETAPES_PREPARATION.filter((e) => recit === "choix" || e !== "choix");

/** « Le jeu » ne réunit que les objets en récit classique : il s'y appelle « Les objets ». */
export const nomEtape = (etape: EtapePreparation, recit: Recit): string =>
  etape === "choix" ? "Les choix" : etape === "jeu" ? (recit === "choix" ? "Le jeu" : "Les objets") : NOM_RUBRIQUE[etape];

/**
 * Une étape de l'histoire est faite quand « Nous retenons » n'est pas vide ; Grandes étapes, dès
 * qu'il y a une partie ; Personnages, dès qu'un héros a un texte retenu (F10.2, 18 octobre 2026).
 */
export function etapeFaite(etape: Rubrique, carnet: Pick<Preparation, RubriqueTexte> & { personnagesDeLHistoire?: Personnage[] }, parties: number): boolean {
  if (etape === "etapes") return parties > 0;
  if (etape === "personnages" && carnet.personnagesDeLHistoire?.some((p) => p.heros && p.description.trim())) return true;
  return carnet[etape].trim() !== "";
}

/** La page s'ouvre sur la première étape de l'histoire sans texte retenu ; toutes faites, sur la première. */
export function etapeDOuverture(carnet: Pick<Preparation, RubriqueTexte> & { personnagesDeLHistoire?: Personnage[] }, parties: number): Rubrique {
  return RUBRIQUES.find((r) => !etapeFaite(r, carnet, parties)) ?? "univers";
}

/** La liste des questions s'adresse à la classe, ou à l'auteur seul (F02-AC19). */
export const titreQuestions = (organisation: Organisation): string => (organisation === "classe" ? "Questions pour la classe" : "Questions pour vous");

/** Les questions des deux étapes facultatives, en grand comme les autres. */
export const QUESTIONS_FACULTATIVES: Record<"choix" | "jeu", (recit: Recit) => string> = {
  choix: () => "Comment s’écrit un choix dans notre livre ?",
  jeu: (recit) =>
    recit === "choix" ? "Quels objets reviennent, et que note le lecteur ?" : "Quels objets reviennent dans l’histoire, et comment les appelle-t-on ?",
};

/** La question en grand d'une étape, quelle qu'elle soit. */
export const questionDeLEtape = (etape: EtapePreparation, organisation: Organisation, recit: Recit): string =>
  estEtapeDeLHistoire(etape)
    ? guidage(etape, organisation, recit).question
    : organisation === "personnel" ? pourLAuteur(QUESTIONS_FACULTATIVES[etape](recit)) : QUESTIONS_FACULTATIVES[etape](recit);

export const ORIENTATION_MAX = 600;
/** Les orientations gardées, relues sans confiance : une par étape de l'histoire, courte. */
export function orientationsPropres(brut: unknown): Partial<Record<Rubrique, string>> {
  const o = brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Record<string, unknown>) : {};
  return Object.fromEntries(
    RUBRIQUES.flatMap((r) => {
      const t = typeof o[r] === "string" ? (o[r] as string).replace(/\s+/g, " ").trim().slice(0, ORIENTATION_MAX) : "";
      return t ? [[r, t]] : [];
    }),
  );
}

/**
 * La réserve de l'IA (F13.4) : six questions ou idées par demande, livrées une à une. La
 * suivante est la première qui ne redit pas ce que la liste a déjà, sans tenir compte de la casse.
 */
export function prendreDansLaReserve(reserve: string[], deja: string[]): { element: string | null; reste: string[] } {
  const vus = new Set(deja.map((t) => t.trim().toLocaleLowerCase("fr")));
  const reste = reserve.filter((t) => t.trim() && !vus.has(t.trim().toLocaleLowerCase("fr")));
  return { element: reste[0] ?? null, reste: reste.slice(1) };
}

// ——— Rubrique « Objets et formules » (F04.2), feuille d'aventure, dé, règles du jeu ———

/** Un objet de l'histoire ; sa fiche visuelle et son image de référence servent aux images (F10.2). */
export type Objet = { id: string; nom: string; description: string; fiche?: string; imageId?: string | null };
/**
 * Le signe placé devant une action de jeu, dans la copie comme dans le livre : le crayon
 * par défaut, pour ce qui se note ; le dé, le sac, le cœur (F04-AC40). Une formule porte le
 * sien, que l'action née d'elle reprend (F04-AC41).
 */
export const SIGNES_ACTION = ["crayon", "de", "sac", "coeur"] as const;
export type SigneAction = (typeof SIGNES_ACTION)[number];
export const NOMS_DES_SIGNES: Record<SigneAction, string> = {
  crayon: "Crayon : à noter sur la feuille",
  de: "Dé : à lancer",
  sac: "Sac : un objet à prendre ou à rayer",
  coeur: "Cœur : des points gagnés ou perdus",
};
export const signeDe = (porteur: { signe?: unknown }): SigneAction =>
  SIGNES_ACTION.includes(porteur.signe as SigneAction) ? (porteur.signe as SigneAction) : "crayon";

export type Formule = { id: string; texte: string; signe: SigneAction };

export type Compteur = { id: string; nom: string; depart: number };
export type Section =
  | { id: string; type: "liste"; titre: string; lignes: number }
  | { id: string; type: "compteurs"; titre: string; compteurs: Compteur[] }
  | { id: string; type: "notes"; titre: string };
export type TypeSection = Section["type"];
export type Feuille = { on: boolean; des: 0 | 1 | 2; sections: Section[] };

export const TYPES_SECTION: Record<TypeSection, { nom: string; aide: string }> = {
  liste: { nom: "Liste", aide: "Des lignes à remplir par le lecteur : inventaire, compétences." },
  compteurs: { nom: "Compteurs", aide: "Un nom et une valeur de départ : volonté, temps." },
  notes: { nom: "Notes libres", aide: "Numéros découverts, mots de passe, indices." },
};

const borner = (n: unknown, min: number, max: number, defaut: number): number => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : defaut;
};
const texteCourt = (v: unknown, max: number): string => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const ID = /^[a-z0-9-]{1,40}$/i;

/** La feuille telle qu'elle peut être gardée : types connus, tailles bornées, rien d'autre. */
export function feuillePropre(brut: unknown): Feuille {
  const f = (brut ?? {}) as { on?: unknown; des?: unknown; sections?: unknown };
  const sections: Section[] = (Array.isArray(f.sections) ? f.sections : []).slice(0, 12).flatMap((s: Record<string, unknown>, i: number): Section[] => {
    const id = ID.test(String(s?.id ?? "")) ? String(s.id) : `s${i}`;
    const titre = texteCourt(s?.titre, 40);
    if (s?.type === "liste") return [{ id, type: "liste", titre, lignes: borner(s.lignes, 3, 14, 6) }];
    if (s?.type === "notes") return [{ id, type: "notes", titre }];
    if (s?.type === "compteurs") {
      const compteurs = (Array.isArray(s.compteurs) ? s.compteurs : []).slice(0, 8).map((c: Record<string, unknown>, k: number) => ({
        id: ID.test(String(c?.id ?? "")) ? String(c.id) : `c${k}`,
        nom: texteCourt(c?.nom, 24),
        depart: borner(c?.depart, 0, 99, 0),
      }));
      return [{ id, type: "compteurs", titre, compteurs: compteurs.length ? compteurs : [{ id: "c0", nom: "", depart: 0 }] }];
    }
    return [];
  });
  const des = borner(f.des, 0, 2, 0) as 0 | 1 | 2;
  return { on: f.on === true, des, sections };
}

export function nouvelleSection(type: TypeSection, id: string): Section {
  if (type === "liste") return { id, type, titre: "Inventaire", lignes: 6 };
  if (type === "compteurs") return { id, type, titre: "Compteurs", compteurs: [{ id: `${id}-c0`, nom: "Volonté", depart: 5 }] };
  return { id, type, titre: "Notes" };
}

/** « Volonté 5, Temps 12 · Inventaire » : ce que la feuille contient, en une ligne. */
export const resumeFeuille = (f: Feuille): string =>
  f.sections
    .map((s) => (s.type === "compteurs" ? s.compteurs.map((c) => `${c.nom || "Compteur"} ${c.depart}`).join(", ") : s.titre))
    .filter(Boolean)
    .join(" · ");

// ——— Rubrique « Phrases de choix » (F05, F11.5) ———

export const FORMULES_RENVOI = {
  rends: { nom: "« rends-toi au 12 »", avant: "rends-toi au " },
  va: { nom: "« va au 12 »", avant: "va au " },
  fleche: { nom: "« → 12 »", avant: "→ " },
} as const;
export type FormuleRenvoi = keyof typeof FORMULES_RENVOI;
export const estFormuleRenvoi = (v: string): v is FormuleRenvoi => v in FORMULES_RENVOI;

export const CONSTRUCTIONS = {
  neutre: { nom: "Le libellé, puis le renvoi", gabarit: "{L} : {r}." },
  pour: { nom: "« Pour… »", gabarit: "Pour {l}, {r}." },
  si: { nom: "« Si tu veux… »", gabarit: "Si tu veux {l}, {r}." },
  question: { nom: "« … ? »", gabarit: "{L} ? {R}." },
} as const;
export type Construction = keyof typeof CONSTRUCTIONS;
export const estConstruction = (v: string): v is Construction => v in CONSTRUCTIONS;

const majuscule = (t: string): string => t.charAt(0).toLocaleUpperCase("fr") + t.slice(1);
const minuscule = (t: string): string => t.charAt(0).toLocaleLowerCase("fr") + t.slice(1);

/**
 * Les constructions qui servent avec cette façon d'annoncer le numéro. Avec la flèche,
 * seule la première : « Pour plonger la main, → 17. » ne se lit pas (F05-AC43). Les
 * autres restent cochées dans les réglages, et servent de nouveau si la formule change.
 */
export const constructionsUtiles = (formule: FormuleRenvoi, cochees: Construction[]): Construction[] =>
  formule === "fleche" ? ["neutre"] : cochees.includes("neutre") ? cochees : ["neutre", ...cochees];

/** Phrase de choix automatique : « Prendre la clé : rends-toi au 12. » (F05). */
export function phraseDeChoix(libelle: string, numero: number | string, formule: FormuleRenvoi, construction: Construction): string {
  const renvoi = `${FORMULES_RENVOI[formule].avant}${numero}`;
  const gabarit = formule === "fleche" ? "{L} {r}" : CONSTRUCTIONS[construction].gabarit;
  return gabarit
    .replace("{L}", majuscule(libelle))
    .replace("{l}", minuscule(libelle))
    .replace("{R}", majuscule(renvoi))
    .replace("{r}", renvoi);
}

export type Preparation = {
  univers: string;
  personnages: string;
  enjeu: string;
  rubriqueJeu: boolean;
  feuille: Feuille;
  regles: string;
  formuleRenvoi: FormuleRenvoi;
  constructions: Construction[];
  marqueFin: string;
  pistes: Piste[];
  questions: Question[];
  orientations: Partial<Record<Rubrique, string>>;
  objets: Objet[];
  formules: Formule[];
  /** Les cartes de l'étape « Personnages » (F10.2) ; « personnages » est le texte retenu de l'étape */
  personnagesDeLHistoire: Personnage[];
};

// ——— Un onglet par héros dans l'étape Personnages (F10.2, décidé le 18 octobre 2026) ———

/** L'onglet des personnages qui ne sont pas des héros : une liste simple, sans questions ni idées. */
export const AUTRES_PERSONNAGES = "autres";

/** Le nom d'une carte de héros qui n'en a pas encore : la question garde alors « notre héros ». */
export const HEROS_SANS_NOM = "Le héros";

/**
 * Ce que montre l'onglet d'un héros : sa question, ses relances, ses questions et ses idées.
 * Le premier héros reçoit aussi ce qui n'appartient à aucun (une idée notée avant toute carte) ;
 * la relance « Un seul héros, ou plusieurs ? » ne se pose qu'à lui.
 */
export function ongletDuHeros(
  preparation: Pick<Preparation, "questions" | "pistes" | "personnagesDeLHistoire">,
  herosId: string | null,
  organisation: Organisation,
  recit: Recit,
): { heros: Personnage | null; premier: boolean; question: string; relances: string[]; questions: Question[]; idees: Piste[] } {
  const tous = preparation.personnagesDeLHistoire.filter((p) => p.heros);
  const heros = tous.find((p) => p.id === herosId) ?? null;
  const premier = !heros || heros.id === tous[0]?.id;
  const guide = guidage("personnages", organisation, recit);
  const aLui = (id: string | null | undefined) => (heros && id === heros.id) || (premier && !id);
  const nomme = heros && heros.nom.trim() !== HEROS_SANS_NOM ? heros.nom.trim() : null;
  // Une ligne, pour ne pas faire défiler (porteur, 18 octobre 2026) ; le prénom dit lequel
  const question = nomme ? `Qui est ${nomme} ?` : "Qui est notre héros ?";
  // Les relances nomment le héros : le prénom ne dit pas si c'est une fille ou un garçon
  const relances = nomme && recit === "choix"
    ? [`Quel âge a ${nomme}, et que sait faire ce héros ?`, `Qu’est-ce qui fait peur à ${nomme} ?`, `Qui va aider ${nomme}, qui va lui barrer la route ?`, RELANCE_DES_HEROS]
    : nomme
      ? [`Quel âge a ${nomme}, et que sait faire ce héros ?`, `Qu’est-ce qui fait peur à ${nomme} ?`, `Qui va aider ${nomme}, qui va lui barrer la route ?`]
      : guide.relances;
  return {
    heros,
    premier,
    question: organisation === "personnel" && !nomme ? "Qui est votre héros ?" : question,
    relances: premier ? relances : relances.filter((r) => r !== RELANCE_DES_HEROS),
    questions: preparation.questions.filter((q) => q.etape === "personnages" && aLui(q.personnageId)),
    idees: preparation.pistes.filter((p) => p.rubrique === "personnages" && aLui(p.personnageId)),
  };
}

/** La question de l'onglet des autres personnages. */
export const questionDesAutres = (organisation: Organisation): string =>
  // Traits d'union insécables : « croise-t-on » ne se coupe pas
  organisation === "classe" ? "Qui d’autre croise\u2011t\u2011on dans notre histoire ?" : "Qui d’autre croise\u2011t\u2011on dans votre histoire ?";
