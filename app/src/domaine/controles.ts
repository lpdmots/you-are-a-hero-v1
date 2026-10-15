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
import type { Texte } from "./copie";
import { LARGEURS_PROPOSEES, SEUIL_PPP, hauteurDeLigne, largeurImprimee, pointsParPouce, zoneDeTexte, type ReglagesDuLivre } from "./mise-en-page";

export type Gravite = "bloque" | "avert" | "info";
export type EtapeDuLivre = "relire" | "chemins";
/** Les tâches de « Relire » et de « Vérifier les chemins » où un point se traite (F11.6) */
export type Tache = "ecrire" | "graves" | "confirmer" | "depart-fins" | "choix" | "passages" | "a-savoir";

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
  /**
   * Passage inaccessible, un point par cause (F09-AC24) : la scène où aucun chemin ne mène, en
   * tête, et les scènes qu'on n'atteint qu'à travers elle.
   */
  | { sorte: "inaccessible"; sceneId: string; scenes: string[] }
  /**
   * Fin hors d'atteinte : des scènes accessibles qui se renvoient l'une à l'autre sans mener
   * à une fin. Le point désigne la première qu'on y rencontre, et les nomme toutes.
   */
  | { sorte: "sans-fin"; sceneId: string; scenes: string[] }
  /** Sortie non assurée : la seule suite est une liaison cachée (F09-AC15) */
  | { sorte: "sortie"; sceneId: string }
  /** Des actions de jeu, et pas de feuille d'aventure (F04-AC33) : le nombre de passages qui en ont */
  | { sorte: "jeu-sans-feuille"; passages: number }
  /**
   * Une image d'une scène incluse, ou d'une page de présentation, que le livre ne peut pas
   * imprimer (F10-AC14) : elle n'est plus dans le projet, ou son fichier est illisible.
   */
  | ({ sorte: "image-manquante" } & OuEstLImage)
  /** Une image qui s'imprime à moins de 200 points par pouce (F10-AC15, AC35) */
  | ({ sorte: "image-floue"; ppp: number; largeur: number } & OuEstLImage)
  /** Une largeur réglée à la main que la page ne permet pas (F10-AC17) : « à savoir » */
  | { sorte: "largeur-reduite"; sceneId: string; bloc: string; demandee: number; obtenue: number }
  /**
   * Un texte qui dépasse de la marge, à la page dite (F11-AC57). L'empreinte est celle du
   * contenu de la scène et des marges : l'acceptation tient tant qu'elles n'ont pas changé.
   */
  | { sorte: "hors-marges"; sceneId: string | null; page: number; empreinte: string };

/** Où se trouve une image : dans une scène, son bloc ; ou sur une page de présentation, son nom. */
type OuEstLImage = { sceneId: string | null; image: string; bloc: string | null; pageDuLivre?: string };

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
  "image-manquante": "bloque",
  "image-floue": "avert",
  "largeur-reduite": "info",
  "hors-marges": "avert",
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
  "image-manquante": "graves",
  "image-floue": "confirmer",
  "largeur-reduite": "a-savoir",
  "hors-marges": "confirmer",
};

/**
 * L'étape où se traite un point (F11.6) : les défauts du texte et des images à « Relire », les
 * chemins à « Vérifier les chemins ». Un rappel « à savoir » va à l'étape de ce qu'il concerne.
 */
export const etapeDe = (sorte: Sorte): EtapeDuLivre =>
  ["ecrire", "graves", "confirmer"].includes(TACHE[sorte]) || sorte === "largeur-reduite" ? "relire" : "chemins";

/** Ce que les contrôles lisent du livre. */
export type LivreAControler = {
  plan: Plan;
  aChoix: boolean;
  /** Les scènes dont le texte porte au moins une action de jeu */
  scenesAvecActions: ReadonlySet<string>;
  /** Le livre a-t-il une feuille d'aventure ? (F04.2) */
  feuille: boolean;
  /** Ce qu'il faut pour contrôler les images et les marges (F10, F11.2) ; sans lui, elles ne le sont pas */
  contenu?: ContenuAControler;
};

export type ContenuAControler = {
  textes: ReadonlyMap<string, Texte>;
  /** Les images du projet, avec leurs dimensions ; une image absente d'ici est introuvable */
  images: Readonly<Record<string, { largeur: number; hauteur: number }>>;
  reglages: ReglagesDuLivre;
  /** Ce que la dernière composition a vu dépasser des marges (F11-AC57) */
  debordements: { sceneId: string | null; page: number }[];
  /** Les images des pages de présentation : leur nom et leur image (F11.4) */
  imagesDesPages: { page: string; image: string }[];
};

/** Les scènes du livre : dans le plan, ni exclues, ni dans un chapitre exclu. */
export const scenesDuLivre = (plan: Plan): Scene[] => chapitresDe(plan).filter((c) => !c.horsLivre).flatMap((c) => c.scenes.filter((s) => !s.horsLivre));

/** Les défauts d'écriture d'une scène, reportés tant qu'elle est à finir. */
const ECRITURE: ReadonlySet<Sorte> = new Set(["vide", "impasse", "sans-destination", "supprimee", "exclue"]);

/**
 * Les contrôles du livre, dans l'ordre des tâches puis du plan. Le récit classique n'a que la
 * scène à finir et la scène vide : il n'a ni départ, ni chemins, ni numéros.
 */
export function controler({ plan, aChoix, scenesAvecActions, feuille, contenu }: LivreAControler): Probleme[] {
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
      const rangDuPlan = new Map(livre.map((s, i) => [s.id, i]));
      for (const groupe of inaccessibles(livre.map((s) => s.id).filter((id) => !atteintes.has(id)), suites, rangDuPlan)) {
        points.push({ sorte: "inaccessible", sceneId: groupe[0], scenes: groupe });
      }
      for (const groupe of composantes([...atteintes.keys()], suites, atteintes).filter((c) => fermee(c, suites))) {
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

  if (contenu) points.push(...controlerLesImages(livre, contenu));

  const ordreTache: Tache[] = ["ecrire", "graves", "confirmer", "depart-fins", "choix", "passages", "a-savoir"];
  return points
    .map((p, i) => ({ p, i }))
    .sort((a, b) => ordreTache.indexOf(TACHE[a.p.sorte]) - ordreTache.indexOf(TACHE[b.p.sorte]) || a.i - b.i)
    .map(({ p }): Probleme => {
      const sceneId = "sceneId" in p ? p.sceneId : null;
      const aFinir = sceneId !== null && scene.get(sceneId)?.etat !== "prete";
      return { ...p, cle: cleDe(p), gravite: GRAVITE[p.sorte], tache: TACHE[p.sorte], etape: etapeDe(p.sorte), reporte: ECRITURE.has(p.sorte) && aFinir };
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
    // Une image jugée l'est à sa largeur : la changer pose de nouveau la question (F11.6, « Durée de l'acceptation »)
    case "image-manquante":
      return `image-manquante:${p.sceneId ?? p.pageDuLivre}:${p.bloc ?? p.image}`;
    case "image-floue":
      return `image-floue:${p.sceneId ?? p.pageDuLivre}:${p.bloc ?? p.image}:${p.image}:${p.largeur}`;
    case "largeur-reduite":
      return `largeur-reduite:${p.bloc}`;
    case "hors-marges":
      return `hors-marges:${p.sceneId ?? "pages"}:${p.empreinte}`;
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
 * Les composantes fortement connexes des scènes données (Tarjan, sans récursion), chacune
 * rangée selon « rang », et rangées entre elles par leur première scène. Seuls comptent les
 * chemins qui restent parmi ces scènes.
 */
function composantes(ids: string[], suites: (id: string) => string[], rang: ReadonlyMap<string, number>): string[][] {
  const dedans = new Set(ids);
  const suivantes = (id: string) => suites(id).filter((s) => dedans.has(s));
  const index = new Map<string, number>();
  const bas = new Map<string, number>();
  const pile: string[] = [];
  const surPile = new Set<string>();
  const trouvees: string[][] = [];
  let compteur = 0;
  for (const racine of ids) {
    if (index.has(racine)) continue;
    const travail: { id: string; suivantes: string[]; k: number }[] = [];
    const entrer = (id: string) => {
      index.set(id, compteur);
      bas.set(id, compteur);
      compteur += 1;
      pile.push(id);
      surPile.add(id);
      travail.push({ id, suivantes: suivantes(id), k: 0 });
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
        trouvees.push(composante);
      }
    }
  }
  return trouvees.map((c) => c.sort((a, b) => rang.get(a)! - rang.get(b)!)).sort((a, b) => rang.get(a[0])! - rang.get(b[0])!);
}

/**
 * Un groupe d'où l'on ne sort plus : une boucle, ou une scène qui mène à elle-même, sans
 * chemin vers une scène hors du groupe. Une scène seule sans suite n'en est pas un : c'est
 * une impasse, contrôlée à part.
 */
function fermee(c: string[], suites: (id: string) => string[]): boolean {
  const dedans = new Set(c);
  const sortent = c.some((id) => suites(id).some((s) => !dedans.has(s)));
  return !sortent && (c.length > 1 || suites(c[0]).includes(c[0]));
}

/**
 * Les passages inaccessibles, groupés par cause (F09-AC24) : chaque groupe part d'une scène
 * où aucun chemin ne mène, ni du départ ni d'une autre scène inaccessible — d'une boucle où
 * rien ne mène, sa première scène du plan —, et compte les scènes qu'on n'atteint qu'à
 * travers elle. Une scène atteinte depuis deux groupes va au premier.
 */
function inaccessibles(ids: string[], suites: (id: string) => string[], rangDuPlan: ReadonlyMap<string, number>): string[][] {
  const dedans = new Set(ids);
  const comps = composantes(ids, suites, rangDuPlan);
  const compDe = new Map(comps.flatMap((c, i) => c.map((id) => [id, i] as const)));
  const atteintes = new Set<number>();
  for (const id of ids) for (const s of suites(id)) if (dedans.has(s) && compDe.get(s) !== compDe.get(id)) atteintes.add(compDe.get(s)!);
  const pris = new Set<string>();
  const groupes: string[][] = [];
  comps.forEach((c, i) => {
    if (atteintes.has(i)) return;
    const groupe: string[] = [];
    const file = [...c];
    for (const id of c) pris.add(id);
    while (file.length) {
      const id = file.shift()!;
      groupe.push(id);
      for (const s of suites(id)) {
        if (!dedans.has(s) || pris.has(s)) continue;
        pris.add(s);
        file.push(s);
      }
    }
    // La scène où rien ne mène en tête, les autres dans l'ordre du plan
    groupes.push([c[0], ...groupe.filter((id) => id !== c[0]).sort((a, b) => rangDuPlan.get(a)! - rangDuPlan.get(b)!)]);
  });
  return groupes;
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
export function phraseDe(p: Point): { quoi: string; detail: string; suite?: string } {
  if (p.sorte === "image-manquante") return { quoi: "Image introuvable.", detail: "Le fichier de cette image n’est plus dans le projet : remplacez-la, ou retirez-la." };
  if (p.sorte === "image-floue") return { quoi: "Image peu définie.", detail: `Elle s’imprime à ${p.ppp} points par pouce : à moins de ${SEUIL_PPP}, elle peut paraître floue sur papier.` };
  if (p.sorte === "largeur-reduite") return { quoi: "Image réduite pour tenir dans la page.", detail: `Demandée à ${p.demandee} %, elle s’imprime à ${p.obtenue} %.` };
  if (p.sorte === "hors-marges") return { quoi: `Le texte dépasse de la marge, page ${p.page}.`, detail: "Un mot trop long pour la ligne déborde dans la marge : coupez-le, ou acceptez-le." };
  // Le choix se nomme par son libellé : trois choix d'une même scène ne font pas trois cartes pareilles
  const lequel = (c: Chemin) => (c.cache ? "Le lien caché" : c.libelle.trim() ? `« ${c.libelle.trim()} »` : "Un choix");
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
      return { quoi: `${lequel(p)} ne mène nulle part.`, detail: `${lequel(p)} n’a pas encore de destination.` };
    case "supprimee":
      return { quoi: `${lequel(p)} mène à une scène supprimée.`, detail: `${lequel(p)} mène à une scène qui est dans la corbeille.` };
    case "exclue":
      return { quoi: `${lequel(p)} mène hors du livre.`, detail: `${lequel(p)} mène à ${p.cible}, qui est hors du livre.` };
    case "numero":
      if (p.avec) return { quoi: "Deux scènes doivent porter le même numéro.", detail: `${p.cible} et ${p.avec} doivent toutes deux porter le n° ${p.numero}.` };
      return p.parEnigme
        ? { quoi: "Une énigme mène à un numéro qui n’existe pas.", detail: `L’énigme mène au n° ${p.numero}, mais le livre n’en compte que ${p.total}.` }
        : { quoi: "Un numéro fixé n’existe plus.", detail: `${p.cible} doit porter le n° ${p.numero}, mais le livre n’en compte que ${p.total}.` };
    case "inaccessible": {
      const n = p.scenes.length - 1;
      return {
        quoi: "Aucun chemin n’y mène.",
        detail: "Aucun choix n’y mène depuis le départ : passage caché voulu, ou choix oublié ?",
        ...(n ? { suite: `Et ${n} scène${pluriel(n)} qui n’${n > 1 ? "ont" : "a"} pas d’autre accès.` } : {}),
      };
    }
    case "sans-fin": {
      const n = p.scenes.length - 1;
      return {
        quoi: "Aucune fin ne s’atteint d’ici.",
        detail: `${n ? `Ces ${n + 1} scènes se renvoient l’une à l’autre` : "Cette scène ne mène qu’à elle-même"} : le lecteur n’en sort plus.`,
        ...(n ? { suite: `Elle et ${n} autre${pluriel(n)} scène${pluriel(n)} se renvoient l’une à l’autre.` } : {}),
      };
    }
    case "sortie":
      return { quoi: "Sa seule suite est une énigme.", detail: "Le lecteur qui ne résout pas l’énigme reste bloqué." };
    case "jeu-sans-feuille": {
      const n = p.passages;
      const phrase = `${n} passage${pluriel(n)} demande${n > 1 ? "nt" : ""} d’agir sur une feuille d’aventure, et le livre n’en a pas.`;
      return { quoi: phrase, detail: phrase };
    }
  }
}

/**
 * Les images et les marges (F10, F11.2), contrôlées sur les seules scènes du livre et les pages
 * de présentation : image introuvable, image peu définie à la taille où elle s'imprime, largeur
 * réglée à la main que la page ne permet pas, texte qui dépassait de la marge à la dernière
 * composition.
 */
function controlerLesImages(livre: Scene[], c: ContenuAControler): Point[] {
  const points: Point[] = [];
  const z = zoneDeTexte(c.reglages);
  for (const s of livre) {
    for (const b of c.textes.get(s.id) ?? []) {
      const enLigne: { image: string; bloc: string }[] = [];
      if (b.type === "image") {
        const image = c.images[b.image];
        if (!image) {
          points.push({ sorte: "image-manquante", sceneId: s.id, image: b.image, bloc: b.id });
          continue;
        }
        const l = largeurImprimee(b, image, c.reglages);
        const ppp = pointsParPouce(image.largeur, l.mm);
        if (ppp < SEUIL_PPP) points.push({ sorte: "image-floue", sceneId: s.id, image: b.image, bloc: b.id, ppp, largeur: b.page ? 100 : b.largeur });
        // Seule une largeur réglée à la main se dit réduite (F10-AC17)
        if (!b.page && !LARGEURS_PROPOSEES.includes(b.largeur) && l.pourcent < b.largeur - 0.5) {
          points.push({ sorte: "largeur-reduite", sceneId: s.id, bloc: b.id, demandee: b.largeur, obtenue: Math.round(l.pourcent) });
        }
      } else if (b.type === "p" || b.type === "action" || b.type === "choix") {
        for (const m of b.children) if ("type" in m && m.type === "image-ligne") enLigne.push({ image: m.image, bloc: b.id });
      }
      // Une image sur la ligne s'imprime à la hauteur du texte
      for (const x of enLigne) {
        const image = c.images[x.image];
        if (!image) {
          points.push({ sorte: "image-manquante", sceneId: s.id, image: x.image, bloc: x.bloc });
          continue;
        }
        const ppp = pointsParPouce(image.hauteur, hauteurDeLigne(c.reglages));
        if (ppp < SEUIL_PPP) points.push({ sorte: "image-floue", sceneId: s.id, image: x.image, bloc: x.bloc, ppp, largeur: 0 });
      }
    }
  }
  for (const { page, image: id } of c.imagesDesPages) {
    const image = c.images[id];
    if (!image) {
      points.push({ sorte: "image-manquante", sceneId: null, image: id, bloc: null, pageDuLivre: page });
      continue;
    }
    const mm = Math.min(z.largeur, z.hauteur * (image.largeur / image.hauteur));
    const ppp = pointsParPouce(image.largeur, mm);
    if (ppp < SEUIL_PPP) points.push({ sorte: "image-floue", sceneId: null, image: id, bloc: null, pageDuLivre: page, ppp, largeur: 100 });
  }
  const dansLeLivre = new Set(livre.map((s) => s.id));
  const marges = JSON.stringify(c.reglages.marges);
  const vus = new Set<string>();
  for (const d of c.debordements) {
    if (d.sceneId && !dansLeLivre.has(d.sceneId)) continue;
    const cle = `${d.sceneId}:${d.page}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    points.push({ sorte: "hors-marges", sceneId: d.sceneId, page: d.page, empreinte: empreinteCourte(JSON.stringify(d.sceneId ? c.textes.get(d.sceneId) ?? [] : []) + marges) });
  }
  return points;
}

/** Une empreinte courte d'un texte (FNV-1a, 32 bits) : de quoi voir qu'il a changé. */
function empreinteCourte(t: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < t.length; i += 1) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
