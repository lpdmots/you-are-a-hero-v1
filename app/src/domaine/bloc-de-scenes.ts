import type { Chemins, LienDeChemin, NoeudDeChemin } from "./chemins";

/**
 * Le bloc de scènes (F13.7) : ce que l'IA propose d'après la demande de l'adulte, dessiné en
 * pointillé dans « Chemins » sous la scène d'origine, tout retouchable, et ajouté d'un geste.
 * Rien ici ne touche au projet : ce sont les règles du bloc lui-même — ce qu'il peut contenir,
 * comment une scène s'en retire, ce que dit le bouton.
 *
 * Une nouvelle scène porte une clé (« N1 », « N2 »…), le temps de la proposition ; une scène
 * existante, son identité. Un choix part de la scène d'origine ou d'une nouvelle scène, et mène
 * à une nouvelle scène ou à une scène du chapitre : le bloc ne fait qu'ajouter.
 */

/**
 * Le réglage du bloc, gardé avec le compte (F13.7, « Un réglage »). « Ce qui manque » est retiré le
 * 11 novembre 2026 : l'IA complète toujours, et « Affiner » sert à préciser ; une valeur déjà
 * enregistrée est ignorée.
 */
export type ReglagesBloc = {
  /** Chaque nouvelle scène reçoit sa consigne et, en classe, sa liste de vérification */
  consignes: boolean;
};
export const REGLAGES_BLOC_HABITUELS: ReglagesBloc = { consignes: true };

export function lireReglagesBloc(brut: unknown): ReglagesBloc {
  const o = brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Record<string, unknown>) : {};
  return { consignes: o.consignes === false ? false : true };
}

/** Les bornes d'un bloc : environ huit nouvelles scènes, sur deux niveaux (F13.7, seuil non affiché). */
export const BLOC = { scenes: 8, niveaux: 2, choix: 24, questions: 3, reponsesPretes: 3, demande: 2000, reponse: 600, precision: 1000 } as const;

/** Une question pour affiner (F13-AC36) : ce que l'IA a dû choisir, et deux ou trois réponses toutes prêtes. */
export type QuestionDuBloc = { question: string; reponses: string[] };

export type SceneProposee = {
  cle: string;
  titre: string;
  consigne: string;
  liste: string[];
  /** Ce que l'IA a imaginé faute de l'avoir lu dans la demande : « Imaginée, à vérifier » */
  inventee: boolean;
};
export type ChoixPropose = {
  cle: string;
  /** La scène d'origine (son identité) ou une nouvelle scène (sa clé) */
  de: string;
  /** Une nouvelle scène (sa clé) ou une scène du chapitre (son identité) */
  vers: string;
  libelle: string;
  invente: boolean;
};
export type Proposition = {
  /** La scène d'où part le bloc ; null dans un chapitre encore vide */
  origine: string | null;
  scenes: SceneProposee[];
  choix: ChoixPropose[];
  /** Une consigne proposée pour la scène d'origine, qui n'en a pas ; l'adulte la prend ou non */
  consigneOrigine: { consigne: string; liste: string[] } | null;
  /** Pour affiner (F13-AC36) : trois au plus, montrées seulement quand l'adulte choisit « Affiner » */
  questions: QuestionDuBloc[];
  /** Ce qu'une demande trop large laisse, en une phrase */
  reste: string | null;
};

export const CLE_NOUVELLE = /^N\d{1,2}$/;
export const estNouvelle = (p: Proposition, id: string): boolean => p.scenes.some((s) => s.cle === id);

/** « 4 scènes et 3 choix », « 2 choix », « 1 scène ». */
export function ceQuiSAjoute(p: { scenes: readonly unknown[]; choix: readonly unknown[] }): string {
  const s = p.scenes.length;
  const c = p.choix.length;
  const scenes = `${s} scène${s > 1 ? "s" : ""}`;
  const choix = `${c} choix`;
  return s && c ? `${scenes} et ${choix}` : s ? scenes : choix;
}

/** Le bouton dit ce qu'il fait : « Ajouter 4 scènes et 3 choix » (F13-AC34, AC35). */
export const libelleDAjout = (p: { scenes: readonly unknown[]; choix: readonly unknown[] }, consigne = false): string =>
  consigne ? `Ajouter ${ceQuiSAjoute(p).replace(" et ", ", ")} et 1 consigne` : `Ajouter ${ceQuiSAjoute(p)}`;

/** La ligne du total : « Le chapitre aura 19 scènes. » */
export const totalDuChapitre = (avant: number, p: Pick<Proposition, "scenes">): string => {
  const n = avant + p.scenes.length;
  return `Le chapitre aura ${n} scène${n > 1 ? "s" : ""}.`;
};

/**
 * Les scènes du bloc atteintes depuis son point de départ — la scène d'origine, ou la première
 * nouvelle scène d'un chapitre vide —, avec leur niveau. Une scène que rien n'atteint n'en fait
 * pas partie : elle flotterait seule sous le schéma.
 */
export function niveaux(p: Pick<Proposition, "origine" | "scenes" | "choix">): Map<string, number> {
  const nouvelles = new Set(p.scenes.map((s) => s.cle));
  const racine = p.origine ?? p.scenes.find((s) => !p.choix.some((c) => c.vers === s.cle))?.cle ?? p.scenes[0]?.cle;
  const vus = new Map<string, number>();
  if (!racine) return vus;
  vus.set(racine, 0);
  const file = [racine];
  while (file.length) {
    const ici = file.shift()!;
    for (const c of p.choix) {
      if (c.de !== ici || !nouvelles.has(c.vers) || vus.has(c.vers)) continue;
      vus.set(c.vers, vus.get(ici)! + 1);
      file.push(c.vers);
    }
  }
  if (p.origine) vus.delete(p.origine);
  return vus;
}

/**
 * Garde d'un bloc ce qui tient : les scènes atteintes, sur deux niveaux, huit au plus dans
 * l'ordre où on les rencontre ; les choix dont les deux bouts restent. Rend aussi ce qui a dû
 * être laissé.
 */
export function elaguer<P extends Pick<Proposition, "origine" | "scenes" | "choix">>(p: P, bornes: { scenes: number; niveaux: number; choix: number } = BLOC): { bloc: P; laisse: number } {
  const n = niveaux(p);
  const racine = p.origine === null ? [...n].find(([, v]) => v === 0)?.[0] : undefined;
  const ordre = [...n].filter(([, v]) => v <= bornes.niveaux).sort((a, b) => a[1] - b[1]).map(([cle]) => cle);
  const gardees = new Set(ordre.slice(0, bornes.scenes + (racine ? 1 : 0)));
  const scenes = p.scenes.filter((s) => gardees.has(s.cle));
  const nouvelles = new Set(p.scenes.map((s) => s.cle));
  const tient = (bout: string, cote: "de" | "vers") => (nouvelles.has(bout) ? gardees.has(bout) : cote === "de" ? bout === p.origine : true);
  const choix = p.choix.filter((c) => tient(c.de, "de") && tient(c.vers, "vers")).slice(0, bornes.choix);
  return { bloc: { ...p, scenes, choix }, laisse: p.scenes.length - scenes.length };
}

const SANS_BORNE = { scenes: 99, niveaux: 99, choix: 99 };

/**
 * Retirer une scène proposée (F13.7, « une scène proposée se retire ») : avec elle, les choix
 * qui y mènent ou en partent, et les scènes qui ne tenaient au bloc que par elle.
 */
export function retirerScene(p: Proposition, cle: string): Proposition {
  const sans = { ...p, scenes: p.scenes.filter((s) => s.cle !== cle), choix: p.choix.filter((c) => c.de !== cle && c.vers !== cle) };
  return elaguer(sans, SANS_BORNE).bloc;
}

/** Retirer un choix proposé ; une nouvelle scène où plus rien ne mène part avec lui. */
export function retirerChoix(p: Proposition, cle: string): Proposition {
  const sans = { ...p, choix: p.choix.filter((c) => c.cle !== cle) };
  return elaguer(sans, SANS_BORNE).bloc;
}

/** L'identité d'un élément proposé dans le schéma : elle ne se confond avec aucune scène. */
export const idPropose = (cle: string): string => `propose:${cle}`;
export const clePropose = (id: string): string | null => (id.startsWith("propose:") ? id.slice(8) : null);

/**
 * Les chemins du chapitre avec le bloc proposé (F13-AC34) : ses scènes et ses choix entrent
 * dans le schéma, marqués, pour se dessiner en pointillé à leur place calculée.
 */
export function cheminsAvecLeBloc(chemins: Chemins, p: Proposition | null): Chemins {
  if (!p || (!p.scenes.length && !p.choix.length)) return chemins;
  const ici = new Set(chemins.noeuds.map((n) => n.id));
  const bout = (id: string) => (estNouvelle(p, id) ? idPropose(id) : id);
  // Les nouvelles scènes entrent dans l'ordre des choix qui y mènent : le schéma les pose de gauche à droite comme
  // le texte les proposera, ordre que l'adulte change en tirant les fiches (F13-AC43)
  const premier = new Map<string, number>();
  p.choix.forEach((c, i) => premier.has(c.vers) || premier.set(c.vers, i));
  const scenes = [...p.scenes].sort((x, y) => (premier.get(x.cle) ?? -1) - (premier.get(y.cle) ?? -1));
  const noeuds: NoeudDeChemin[] = scenes.map((s) => ({
    id: idPropose(s.cle), reference: 0, titre: s.titre || null, etat: "cours", vide: true, depart: false, fin: false, lien: "",
    propose: { cle: s.cle, inventee: s.inventee },
  }));
  const liens: LienDeChemin[] = p.choix
    .filter((c) => (estNouvelle(p, c.de) || ici.has(c.de)) && (estNouvelle(p, c.vers) || ici.has(c.vers)))
    .map((c) => ({ id: idPropose(c.cle), de: bout(c.de), vers: bout(c.vers), libelle: c.libelle, cache: false, propose: true }));
  return { ...chemins, noeuds: [...chemins.noeuds, ...noeuds], liens: [...chemins.liens, ...liens] };
}

/**
 * Les choix partis d'une même scène, dans un autre ordre (F13-AC43) : c'est l'ordre où ils entreront dans son
 * texte, et où le schéma pose leurs scènes. `cles` les donne dans l'ordre voulu ; les autres choix ne bougent pas.
 */
export function ordonnerLesChoix(p: Proposition, de: string, cles: string[]): Proposition {
  const rang = (cle: string) => {
    const i = cles.indexOf(cle);
    return i === -1 ? cles.length : i;
  };
  const ranges = p.choix.filter((c) => c.de === de).sort((a, b) => rang(a.cle) - rang(b.cle));
  let i = 0;
  return { ...p, choix: p.choix.map((c) => (c.de === de ? ranges[i++] : c)) };
}

/** Une question et sa réponse, telles que l'adulte les a laissées. */
export type Reponse = { question: string; reponse: string };

/**
 * Ce qu'une demande trop large a laissé (F13-AC40), tel qu'il revient dans le champ après l'ajout :
 * la phrase de l'IA sans ce qu'elle a construit (« Reste : le campement et la rivière. » donne
 * « le campement et la rivière »), ou la phrase entière si elle ne suit pas cette forme.
 */
export function resteAReprendre(reste: string | null | undefined): string | null {
  const t = reste?.trim();
  if (!t) return null;
  const apres = t.match(/Reste\s*:\s*([\s\S]+)$/i)?.[1]?.trim().replace(/[.]+$/, "");
  if (!apres) return t;
  return apres.charAt(0).toLocaleUpperCase("fr") + apres.slice(1);
}

/**
 * L'exemple du champ vide (F13.7). Les formes en exemple (pictogrammes qui écrivaient le début de la
 * phrase) ont été retirées après la critique des écrans, le 11 novembre 2026 : elles n'écrivaient
 * que quatre mots et effaçaient l'exemple complet. Un exemple entier, qui change d'une ouverture à
 * l'autre, montre aussi qu'on peut faire se rejoindre deux chemins ou mener à une fin.
 */
export const EXEMPLES = [
  "le héros arrive dans la forêt, où trois chemins s’offrent à lui : le sentier des fougères, le ruisseau, la grotte.",
  "deux chemins : le ruisseau et la grotte, qui se rejoignent au vieux pont.",
  "une scène dans la tour avec deux choix : monter l’escalier, qui mène à une fin, ou redescendre.",
] as const;
