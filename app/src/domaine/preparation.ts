/**
 * Carnet de préparation (F02) : rubriques, guidage, rubriques du jeu et des phrases de choix.
 * Les textes du guidage partent de ceux de la maquette (10 octobre 2026) ; le design en
 * garde la version en vigueur.
 */
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

const CLASSE: Record<Rubrique, Guidage> = {
  univers: {
    question: "Où se passe notre histoire, et qu’a-t-elle d’étrange ?",
    relances: ["À quelle époque ?", "Qu’est-ce qui est dangereux, qu’est-ce qui est beau ?", "Une règle magique ou mystérieuse ?"],
    exemple:
      "Un pays de lacs et de forêts noyé dans la brume. Des passeurs guident les voyageurs d’une rive à l’autre avec des lanternes. Quand les lanternes s’éteignent, les chemins changent de place.",
  },
  personnages: {
    question: "Qui est notre héros, et qu’est-ce qui le rend unique ?",
    relances: ["Quel âge a-t-il ? Que sait-il faire ?", "De quoi a-t-il peur ?", "Qui va l’aider, qui va le gêner ?"],
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
  const base = rubrique === "etapes" && recit === "classique" ? ETAPES_CLASSIQUE : CLASSE[rubrique];
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
export type Piste = { id: string; rubrique: Rubrique; texte: string; etat: EtatPiste };

// ——— Rubrique « Objets et formules » (F04.2), feuille d'aventure, dé, règles du jeu ———

export type Objet = { id: string; nom: string; description: string };
export type Formule = { id: string; texte: string };

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
  objets: Objet[];
  formules: Formule[];
};
