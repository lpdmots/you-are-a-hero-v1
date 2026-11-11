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

/** Les deux réglages du bloc, gardés avec le compte (F13.7, « Deux réglages »). */
export type ReglagesBloc = {
  /** « Me le demander » : l'IA pose une question ; « L'IA complète » : elle invente et le montre */
  manque: "demander" | "completer";
  /** Chaque nouvelle scène reçoit sa consigne et, en classe, sa liste de vérification */
  consignes: boolean;
};
export const REGLAGES_BLOC_HABITUELS: ReglagesBloc = { manque: "demander", consignes: true };

export function lireReglagesBloc(brut: unknown): ReglagesBloc {
  const o = brut && typeof brut === "object" && !Array.isArray(brut) ? (brut as Record<string, unknown>) : {};
  return {
    manque: o.manque === "completer" ? "completer" : "demander",
    consignes: o.consignes === false ? false : true,
  };
}

/** Les bornes d'un bloc : environ huit nouvelles scènes, sur deux niveaux (F13.7, seuil non affiché). */
export const BLOC = { scenes: 8, niveaux: 2, choix: 24, questions: 3, demande: 2000, reponse: 600 } as const;

export type SceneProposee = {
  cle: string;
  titre: string;
  consigne: string;
  liste: string[];
  /** Ce que l'IA a inventé faute de l'avoir lu dans la demande (« L'IA complète ») */
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
  /** Ce qu'il manque à l'IA pour bien répondre (« Me le demander ») : trois au plus */
  questions: string[];
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
  const noeuds: NoeudDeChemin[] = p.scenes.map((s) => ({
    id: idPropose(s.cle), reference: 0, titre: s.titre || null, etat: "cours", vide: true, depart: false, fin: false, lien: "",
    propose: { cle: s.cle, inventee: s.inventee },
  }));
  const liens: LienDeChemin[] = p.choix
    .filter((c) => (estNouvelle(p, c.de) || ici.has(c.de)) && (estNouvelle(p, c.vers) || ici.has(c.vers)))
    .map((c) => ({ id: idPropose(c.cle), de: bout(c.de), vers: bout(c.vers), libelle: c.libelle, cache: false, propose: true }));
  return { ...chemins, noeuds: [...chemins.noeuds, ...noeuds], liens: [...chemins.liens, ...liens] };
}

/** Une question et sa réponse, telles que l'adulte les a laissées. */
export type Reponse = { question: string; reponse: string };
