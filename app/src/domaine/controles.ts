/**
 * Les contrôles du livre (F09.2) : une seule règle, sur le livre entier, que la destination
 * Livre affiche et que le PDF définitif reprendra. Chaque point porte sa gravité — il bloque
 * le PDF définitif, il avertit, ou il est seulement « à savoir » — et l'étape, puis la tâche,
 * où il se traite (F11.6). Rien ne s'y saisit : tout se déduit du plan, de ses liens et de
 * ses numéros.
 *
 * Un chemin est un choix ou une liaison cachée (F05.1). Seules comptent les scènes du livre :
 * ni supprimées, ni exclues, ni dans un chapitre exclu.
 */

import { numerosDuPlan } from "./numeros";
import { chapitresDe, departDe, nomScene, scenesDe, type Lien, type Plan, type Scene } from "./recit";
import { pluriel } from "./texte";

export type Gravite = "bloque" | "avert" | "info";
export type EtapeDuLivre = "relire" | "chemins";
/** Les tâches de « Relire » et de « Vérifier les chemins » où un point se traite (F11.6) */
export type Tache = "ecrire" | "graves" | "depart-fins" | "choix" | "passages" | "a-savoir";

/** Un chemin d'une scène, désigné par son renvoi : un choix, ou une liaison cachée */
type Chemin = { renvoiId: string; libelle: string; cache: boolean };

export type Point =
  /** Une scène du livre que l'adulte n'a pas déclarée prête (F11.1) */
  | { sorte: "a-finir"; sceneId: string }
  /** Une scène du livre sans texte, même déclarée prête */
  | { sorte: "vide"; sceneId: string; prete: boolean }
  /** Pas de départ, ou un départ hors du livre : la scène désignée, s'il y en a une */
  | { sorte: "depart"; sceneId: string | null }
  /** Ni choix, ni liaison cachée, ni repère de fin */
  | { sorte: "impasse"; sceneId: string }
  | ({ sorte: "sans-destination"; sceneId: string } & Chemin)
  | ({ sorte: "supprimee"; sceneId: string } & Chemin)
  | ({ sorte: "exclue"; sceneId: string; cibleId: string; cible: string } & Chemin)
  /**
   * Numéro fixé devenu impossible (F05-AC08) : plus grand que le livre, ou déjà tenu par une
   * autre scène. Le point désigne la scène dont l'énigme y mène, sinon la scène elle-même.
   */
  | { sorte: "numero"; sceneId: string; cibleId: string; cible: string; numero: number; total: number; avec: string | null; parEnigme: boolean }
  | { sorte: "inaccessible"; sceneId: string }
  /**
   * Fin hors d'atteinte : des scènes accessibles qui se renvoient l'une à l'autre sans mener
   * à une fin. Le point désigne la première qu'on y rencontre, et les nomme toutes.
   */
  | { sorte: "sans-fin"; sceneId: string; scenes: string[] }
  /** Sortie non assurée : la seule suite est une liaison cachée (F09-AC15) */
  | { sorte: "sortie"; sceneId: string }
  /** Des actions de jeu, et pas de feuille d'aventure (F04-AC33) : le nombre de passages qui en ont */
  | { sorte: "jeu-sans-feuille"; passages: number };

export type Sorte = Point["sorte"];

export type Probleme = Point & {
  /** Ce qui désigne le point d'une fois à l'autre : l'acceptation d'un avertissement s'y attache */
  cle: string;
  gravite: Gravite;
  etape: EtapeDuLivre;
  tache: Tache;
  /**
   * Défaut d'écriture d'une scène à finir (F09.2, 4 octobre 2026) : il ne se présente pas parmi
   * les points à corriger, la scène étant déjà à finir ; le PDF de travail le montre à sa place.
   */
  reporte: boolean;
};

/** La gravité de chaque point (F09.2, décision du 30 septembre 2026). */
export const GRAVITE: Record<Sorte, Gravite> = {
  "a-finir": "bloque",
  vide: "bloque",
  depart: "bloque",
  impasse: "bloque",
  "sans-destination": "bloque",
  supprimee: "bloque",
  exclue: "bloque",
  numero: "bloque",
  inaccessible: "avert",
  "sans-fin": "avert",
  sortie: "avert",
  "jeu-sans-feuille": "info",
};

/** La tâche où chaque point se traite (F11.6) ; l'étape s'en déduit. */
export const TACHE: Record<Sorte, Tache> = {
  "a-finir": "ecrire",
  vide: "graves",
  depart: "depart-fins",
  impasse: "depart-fins",
  "sans-destination": "choix",
  supprimee: "choix",
  exclue: "choix",
  numero: "choix",
  inaccessible: "passages",
  "sans-fin": "passages",
  sortie: "passages",
  "jeu-sans-feuille": "a-savoir",
};

export const etapeDe = (t: Tache): EtapeDuLivre => (t === "ecrire" || t === "graves" ? "relire" : "chemins");

/** Ce que les contrôles lisent du livre. */
export type LivreAControler = {
  plan: Plan;
  aChoix: boolean;
  /** Les scènes dont le texte porte au moins une action de jeu */
  scenesAvecActions: ReadonlySet<string>;
  /** Le livre a-t-il une feuille d'aventure ? (F04.2) */
  feuille: boolean;
};

/** Les scènes du livre : dans le plan, ni exclues, ni dans un chapitre exclu. */
export const scenesDuLivre = (plan: Plan): Scene[] => chapitresDe(plan).filter((c) => !c.horsLivre).flatMap((c) => c.scenes.filter((s) => !s.horsLivre));

/** Les défauts d'écriture d'une scène, reportés tant qu'elle est à finir. */
const ECRITURE: ReadonlySet<Sorte> = new Set(["vide", "impasse", "sans-destination", "supprimee", "exclue"]);

/**
 * Les contrôles du livre, dans l'ordre des tâches puis du plan. Le récit classique n'a que la
 * scène à finir et la scène vide : il n'a ni départ, ni chemins, ni numéros.
 */
export function controler({ plan, aChoix, scenesAvecActions, feuille }: LivreAControler): Probleme[] {
  const livre = scenesDuLivre(plan);
  const dansLeLivre = new Set(livre.map((s) => s.id));
  const dansLePlan = new Map(scenesDe(plan).map((s) => [s.id, s]));
  const scene = new Map(livre.map((s) => [s.id, s]));
  const points: Point[] = [];

  for (const s of livre) if (s.etat !== "prete") points.push({ sorte: "a-finir", sceneId: s.id });
  for (const s of livre) if (s.texteVide) points.push({ sorte: "vide", sceneId: s.id, prete: s.etat === "prete" });

  if (aChoix) {
    // Les chemins de chaque scène du livre, dans l'ordre du plan
    const cheminsDe = new Map<string, Lien[]>(livre.map((s) => [s.id, []]));
    for (const l of plan.liens) cheminsDe.get(l.sceneId)?.push(l);
    const suites = (id: string): string[] => (cheminsDe.get(id) ?? []).flatMap((l) => (l.cibleId && dansLeLivre.has(l.cibleId) ? [l.cibleId] : []));
    const casse = (l: Lien): boolean => !l.cibleId || !dansLeLivre.has(l.cibleId);

    const depart = departDe(plan);
    const departOk = depart && dansLeLivre.has(depart.id) ? depart : null;
    if (!departOk) points.push({ sorte: "depart", sceneId: depart?.id ?? null });

    for (const s of livre) {
      const chemins = cheminsDe.get(s.id)!;
      // Une scène vide n'est contrôlée que comme vide : rien n'y est encore écrit
      if (!s.texteVide && !s.fin && chemins.length === 0) points.push({ sorte: "impasse", sceneId: s.id });
      for (const l of chemins) {
        const chemin = { renvoiId: l.renvoiId, libelle: l.libelle, cache: l.cache };
        if (!l.cibleId) points.push({ sorte: "sans-destination", sceneId: s.id, ...chemin });
        else if (!dansLePlan.has(l.cibleId)) points.push({ sorte: "supprimee", sceneId: s.id, ...chemin });
        else if (!dansLeLivre.has(l.cibleId)) points.push({ sorte: "exclue", sceneId: s.id, cibleId: l.cibleId, cible: nomScene(dansLePlan.get(l.cibleId)!), ...chemin });
      }
    }

    // Numéros fixés devenus impossibles : le point désigne l'énigme qui y mène
    const numeros = numerosDuPlan(plan);
    for (const p of numeros.problemes) {
      const enigme = plan.liens.find((l) => l.cache && l.cibleId === p.sceneId && dansLeLivre.has(l.sceneId));
      const cible = dansLePlan.get(p.sceneId)!;
      points.push({
        sorte: "numero", sceneId: enigme?.sceneId ?? p.sceneId, cibleId: p.sceneId, cible: nomScene(cible), numero: p.numero, total: numeros.total,
        avec: p.sorte === "double" ? nomScene(dansLePlan.get(p.avec)!) : null, parEnigme: Boolean(enigme),
      });
    }

    // Sans départ, chaque scène serait inaccessible : seul le départ manquant se dit
    if (departOk) {
      const atteintes = parcourir(departOk.id, suites);
      for (const s of livre) if (!atteintes.has(s.id)) points.push({ sorte: "inaccessible", sceneId: s.id });
      for (const groupe of sansFin([...atteintes.keys()], suites)) {
        // Une scène du groupe garde un chemin à relier : sa sortie est sans doute ce chemin
        if (groupe.some((id) => scene.get(id)!.fin || cheminsDe.get(id)!.some(casse))) continue;
        points.push({ sorte: "sans-fin", sceneId: groupe[0], scenes: groupe });
      }
    }

    for (const s of livre) {
      const chemins = cheminsDe.get(s.id)!;
      if (!s.texteVide && !s.fin && chemins.length > 0 && chemins.every((l) => l.cache)) points.push({ sorte: "sortie", sceneId: s.id });
    }

    const passages = livre.filter((s) => !s.texteVide && scenesAvecActions.has(s.id)).length;
    if (passages && !feuille) points.push({ sorte: "jeu-sans-feuille", passages });
  }

  const ordreTache: Tache[] = ["ecrire", "graves", "depart-fins", "choix", "passages", "a-savoir"];
  return points
    .map((p, i) => ({ p, i }))
    .sort((a, b) => ordreTache.indexOf(TACHE[a.p.sorte]) - ordreTache.indexOf(TACHE[b.p.sorte]) || a.i - b.i)
    .map(({ p }): Probleme => {
      const sceneId = "sceneId" in p ? p.sceneId : null;
      const aFinir = sceneId !== null && scene.get(sceneId)?.etat !== "prete";
      return { ...p, cle: cleDe(p), gravite: GRAVITE[p.sorte], tache: TACHE[p.sorte], etape: etapeDe(TACHE[p.sorte]), reporte: ECRITURE.has(p.sorte) && aFinir };
    });
}

function cleDe(p: Point): string {
  switch (p.sorte) {
    case "depart":
      return "depart";
    case "jeu-sans-feuille":
      return "jeu-sans-feuille";
    case "sans-destination":
    case "supprimee":
    case "exclue":
      return `${p.sorte}:${p.renvoiId}`;
    case "numero":
      return `numero:${p.cibleId}`;
    case "sans-fin":
      return `sans-fin:${[...p.scenes].sort().join(",")}`;
    default:
      return `${p.sorte}:${p.sceneId}`;
  }
}

/** Les scènes atteintes depuis le départ, chacune avec son rang de rencontre, pas après pas. */
function parcourir(depart: string, suites: (id: string) => string[]): Map<string, number> {
  const vues = new Map<string, number>([[depart, 0]]);
  const file = [depart];
  while (file.length) {
    const id = file.shift()!;
    for (const s of suites(id)) {
      if (vues.has(s)) continue;
      vues.set(s, vues.size);
      file.push(s);
    }
  }
  return vues;
}

/**
 * Les groupes d'où l'on ne sort plus : parmi les scènes atteintes, des scènes qui se
 * renvoient l'une à l'autre (une boucle, ou une scène qui mène à elle-même) sans chemin vers
 * une scène hors du groupe. Chaque groupe est rendu dans l'ordre où on le rencontre. Une
 * scène seule sans suite n'en est pas un : c'est une impasse, contrôlée à part.
 */
function sansFin(atteintes: string[], suites: (id: string) => string[]): string[][] {
  // Composantes fortement connexes (Tarjan), sans récursion
  const rang = new Map(atteintes.map((id, i) => [id, i]));
  const index = new Map<string, number>();
  const bas = new Map<string, number>();
  const pile: string[] = [];
  const surPile = new Set<string>();
  const composantes: string[][] = [];
  let compteur = 0;
  for (const racine of atteintes) {
    if (index.has(racine)) continue;
    const travail: { id: string; suivantes: string[]; k: number }[] = [];
    const entrer = (id: string) => {
      index.set(id, compteur);
      bas.set(id, compteur);
      compteur += 1;
      pile.push(id);
      surPile.add(id);
      travail.push({ id, suivantes: suites(id), k: 0 });
    };
    entrer(racine);
    while (travail.length) {
      const haut = travail[travail.length - 1];
      if (haut.k < haut.suivantes.length) {
        const s = haut.suivantes[haut.k++];
        if (!index.has(s)) entrer(s);
        else if (surPile.has(s)) bas.set(haut.id, Math.min(bas.get(haut.id)!, index.get(s)!));
        continue;
      }
      travail.pop();
      if (travail.length) {
        const parent = travail[travail.length - 1].id;
        bas.set(parent, Math.min(bas.get(parent)!, bas.get(haut.id)!));
      }
      if (bas.get(haut.id) === index.get(haut.id)) {
        const composante: string[] = [];
        let id: string;
        do {
          id = pile.pop()!;
          surPile.delete(id);
          composante.push(id);
        } while (id !== haut.id);
        composantes.push(composante);
      }
    }
  }
  return composantes
    .filter((c) => {
      const dedans = new Set(c);
      const sortent = c.some((id) => suites(id).some((s) => !dedans.has(s)));
      const boucle = c.length > 1 || suites(c[0]).includes(c[0]);
      return boucle && !sortent;
    })
    .map((c) => c.sort((a, b) => rang.get(a)! - rang.get(b)!))
    .sort((a, b) => rang.get(a[0])! - rang.get(b[0])!);
}

/**
 * Les points à corriger ou à confirmer : ni reportés, ni « à savoir », ni scènes à finir, qui
 * se comptent sans se lister (F11-AC78).
 */
export const aTraiter = (problemes: Probleme[]): Probleme[] => problemes.filter((p) => !p.reporte && p.gravite !== "info" && p.sorte !== "a-finir");

/** Les scènes à finir, dans l'ordre du plan. */
export const scenesAFinir = (problemes: Probleme[]): string[] => problemes.flatMap((p) => (p.sorte === "a-finir" ? [p.sceneId] : []));

/**
 * Le PDF définitif est-il refusé ? Par tout point bloquant, reporté compris : une scène à
 * finir le refuse déjà. Aucune commande ne passe outre (F09-AC10).
 */
export const pdfDefinitifRefuse = (problemes: Probleme[]): boolean => problemes.some((p) => p.gravite === "bloque");

/**
 * Ce qu'un point dit (F11.6, « Messages courts ») : une phrase simple dans la liste, le
 * détail quand l'adulte traite la scène.
 */
export function phraseDe(p: Point): { quoi: string; detail: string } {
  const lequel = (c: Chemin) => (c.cache ? "Le lien caché" : `« ${c.libelle} »`);
  switch (p.sorte) {
    case "a-finir":
      return { quoi: "À finir.", detail: "La scène n’est pas encore déclarée prête pour le livre." };
    case "vide":
      return p.prete
        ? { quoi: "Déclarée prête, mais vide.", detail: "La scène est déclarée prête pour le livre et n’a aucun texte." }
        : { quoi: "Pas encore de texte.", detail: "La scène n’a pas encore de texte." };
    case "depart":
      return p.sceneId
        ? { quoi: "Le livre n’a pas de départ.", detail: "La scène de départ est hors du livre." }
        : { quoi: "Le livre n’a pas de départ.", detail: "Aucune scène n’est choisie comme départ du livre." };
    case "impasse":
      return { quoi: "Cette scène est une impasse.", detail: "Elle n’a ni choix, ni énigme, ni repère de fin : le lecteur ne peut ni continuer ni finir." };
    case "sans-destination":
      return { quoi: p.cache ? "Un lien caché ne mène nulle part." : "Un choix ne mène nulle part.", detail: `${lequel(p)} n’a pas encore de destination.` };
    case "supprimee":
      return { quoi: "Un choix mène à une scène supprimée.", detail: `${lequel(p)} mène à une scène qui est dans la corbeille.` };
    case "exclue":
      return { quoi: "Un choix mène hors du livre.", detail: `${lequel(p)} mène à ${p.cible}, qui est hors du livre.` };
    case "numero":
      if (p.avec) return { quoi: "Deux scènes doivent porter le même numéro.", detail: `${p.cible} et ${p.avec} doivent toutes deux porter le n° ${p.numero}.` };
      return p.parEnigme
        ? { quoi: "Une énigme mène à un numéro qui n’existe pas.", detail: `L’énigme mène au n° ${p.numero}, mais le livre n’en compte que ${p.total}.` }
        : { quoi: "Un numéro fixé n’existe plus.", detail: `${p.cible} doit porter le n° ${p.numero}, mais le livre n’en compte que ${p.total}.` };
    case "inaccessible":
      return { quoi: "Aucun chemin n’y mène.", detail: "Aucun choix n’y mène depuis le départ : passage caché voulu, ou choix oublié ?" };
    case "sans-fin":
      return {
        quoi: "Aucune fin ne s’atteint d’ici.",
        detail: `${p.scenes.length > 1 ? `Ces ${p.scenes.length} scènes se renvoient l’une à l’autre` : "Cette scène ne mène qu’à elle-même"} : le lecteur n’en sort plus.`,
      };
    case "sortie":
      return { quoi: "Sa seule suite est une énigme.", detail: "Le lecteur qui ne résout pas l’énigme reste bloqué." };
    case "jeu-sans-feuille": {
      const n = p.passages;
      const phrase = `${n} passage${pluriel(n)} demande${n > 1 ? "nt" : ""} d’agir sur une feuille d’aventure, et le livre n’en a pas.`;
      return { quoi: phrase, detail: phrase };
    }
  }
}
