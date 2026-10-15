/**
 * La destination Livre (F11.6) : ses étapes, leurs marques, les tâches de « Vérifier les
 * chemins » et la durée d'un avertissement accepté. Tout se calcule d'après les contrôles du
 * livre (`controles.ts`) ; seuls deux jugements se posent à la main, « C'est voulu » et
 * la déclaration de l'étape.
 */

import { aTraiter, scenesAFinir, type Gravite, type Probleme, type Tache } from "./controles";

export type EtapeLivre = "relire" | "chemins" | "page" | "sortie";
export const ETAPES_DU_LIVRE: { id: EtapeLivre; nom: string }[] = [
  { id: "relire", nom: "Relire" },
  { id: "chemins", nom: "Vérifier les chemins" },
  { id: "page", nom: "Mettre en page" },
  { id: "sortie", nom: "Imprimer et partager" },
];

/**
 * La marque d'une étape dans la ligne : il reste à faire (triangle), elle attend l'écriture
 * (sablier), il ne reste rien (coche), elle est fermée (cadenas) ; rien sinon.
 */
export type MarqueEtape = "reste" | "attente" | "coche" | "fermee" | null;

// ——— Avertissement accepté (F09.2, F11.6) ———

/** Un « C'est voulu » gardé : le point qu'il vise, et ce qui a été jugé. */
export type Acceptation = { cle: string; empreinte: string; accepteLe: string };
/** Un changement des chemins d'une scène, tel que la base le note : ceux qui y mènent, ou ceux qui en partent. */
export type Changement = { sceneId: string; sens: "entree" | "sortie"; le: string };

/**
 * Ce qu'un avertissement a jugé (F11.6, « Durée de l'acceptation ») : les chemins qui mènent
 * aux scènes d'un passage inaccessible, ceux qui partent d'une boucle sans fin ou d'une
 * sortie non assurée. Corriger une coquille n'y touche pas.
 */
export function porteeDe(p: Probleme): { sens: Changement["sens"]; scenes: string[] } | null {
  if (p.sorte === "inaccessible") return { sens: "entree", scenes: p.scenes };
  if (p.sorte === "sans-fin") return { sens: "sortie", scenes: p.scenes };
  if (p.sorte === "sortie") return { sens: "sortie", scenes: [p.sceneId] };
  return null;
}

/** L'empreinte d'un avertissement : ses scènes. Un groupe qui change n'est plus celui qu'on a jugé. */
export const empreinteDe = (p: Probleme): string => [...(porteeDe(p)?.scenes ?? [])].sort().join(",");

/**
 * Les avertissements acceptés et toujours valables : l'acceptation vise ce point, sur les
 * mêmes scènes, et leurs chemins n'ont pas changé depuis (F11-AC75). Pour une image ou un texte
 * qui dépasse, la clé du point porte déjà ce qui a été jugé (F11.6, « Durée de l'acceptation »).
 * Un problème bloquant ne s'accepte pas.
 */
export function avertissementsAcceptes(problemes: Probleme[], acceptations: Acceptation[], changements: Changement[]): Set<string> {
  const parCle = new Map(acceptations.map((a) => [a.cle, a]));
  const acceptes = new Set<string>();
  for (const p of problemes) {
    const a = parCle.get(p.cle);
    const portee = porteeDe(p);
    if (!a || p.gravite !== "avert" || a.empreinte !== empreinteDe(p)) continue;
    // Une image ou un texte qui dépasse : ce qui a été jugé est dans la clé même (largeur, contenu, marges)
    if (!portee) {
      acceptes.add(p.cle);
      continue;
    }
    const scenes = new Set(portee.scenes);
    const depuis = Date.parse(a.accepteLe);
    if (changements.some((c) => c.sens === portee.sens && scenes.has(c.sceneId) && Date.parse(c.le) > depuis)) continue;
    acceptes.add(p.cle);
  }
  return acceptes;
}

// ——— « Vérifier les chemins » ———

export type TacheChemins = "depart-fins" | "choix" | "passages" | "essai";
export const NOM_TACHE: Record<TacheChemins, string> = {
  "depart-fins": "Départ et fins",
  choix: "Choix à relier",
  passages: "Passages à confirmer",
  essai: "Tester la lecture",
};

export type EtatTache = {
  id: TacheChemins;
  nom: string;
  /** Les points à traiter : à corriger, ou à confirmer et pas encore acceptés */
  points: Probleme[];
  /** Les avertissements acceptés de la tâche, repliés sous « 2 acceptés » */
  acceptes: Probleme[];
  /** Ses points sont des avertissements : leur décompte est ambre, non brique */
  avert: boolean;
  /** Rien à traiter, mais des scènes à finir : « Rien pour l'instant », sans coche */
  attente: boolean;
  faite: boolean;
};

export type EtatChemins = {
  finir: number;
  corriger: number;
  confirmer: number;
  taches: EtatTache[];
  /** Les rappels « à savoir », repliés au pied de la fiche */
  aSavoir: Probleme[];
  declaree: boolean;
  /** « J'ai vérifié les chemins » se pose quand il ne reste rien : ni scène à finir, ni point à traiter */
  declarable: boolean;
  terminee: boolean;
  marque: MarqueEtape;
};

/**
 * L'étape « Vérifier les chemins » (F11.6) : ses quatre tâches, ce qui y reste, sa marque. Une
 * tâche sans rien à faire reste à sa place, cochée seulement quand il n'y a plus de scène à
 * finir. L'étape ne porte pas le triangle tant qu'il reste des scènes à finir et rien à
 * corriger (F11-AC89) ; elle reçoit sa coche quand il ne reste rien et que l'adulte l'a
 * déclaré (F11-AC73). La déclaration est gardée quand une scène est rouverte.
 */
export function etatChemins(problemes: Probleme[], acceptes: ReadonlySet<string>, declaree: boolean): EtatChemins {
  const finir = scenesAFinir(problemes).length;
  const duChemin = aTraiter(problemes).filter((p) => p.etape === "chemins");
  const restants = duChemin.filter((p) => !acceptes.has(p.cle));
  const corriger = restants.filter((p) => p.gravite === "bloque").length;
  const confirmer = restants.filter((p) => p.gravite === "avert").length;
  const declarable = finir === 0 && corriger === 0 && confirmer === 0;
  const terminee = declarable && declaree;
  const taches: EtatTache[] = (["depart-fins", "choix", "passages"] as const).map((id) => {
    const points = restants.filter((p) => p.tache === (id as Tache));
    return {
      id, nom: NOM_TACHE[id], points,
      acceptes: duChemin.filter((p) => p.tache === (id as Tache) && acceptes.has(p.cle)),
      avert: id === "passages",
      attente: points.length === 0 && finir > 0,
      faite: points.length === 0 && finir === 0,
    };
  });
  taches.push({ id: "essai", nom: NOM_TACHE.essai, points: [], acceptes: [], avert: false, attente: false, faite: terminee });
  const marque: MarqueEtape = corriger ? "reste" : finir ? "attente" : confirmer ? "reste" : terminee ? "coche" : null;
  return {
    finir, corriger, confirmer, taches, declaree, declarable, terminee, marque,
    aSavoir: problemes.filter((p) => p.gravite === "info" && p.etape === "chemins"),
  };
}

// ——— « Relire » ———

export type TacheRelire = "ecrire" | "graves" | "confirmer" | "lire";
export const NOM_TACHE_RELIRE: Record<TacheRelire, string> = {
  ecrire: "Ce qui reste à écrire",
  graves: "Erreurs graves",
  confirmer: "À confirmer",
  lire: "Lire et corriger",
};

export type EtatTacheRelire = Omit<EtatTache, "id"> & { id: TacheRelire };

export type EtatRelire = {
  finir: number;
  graves: number;
  confirmer: number;
  taches: EtatTacheRelire[];
  /** Les rappels « à savoir » de l'étape : une largeur d'image non appliquée (F10) */
  aSavoir: Probleme[];
  declaree: boolean;
  /** « J'ai relu le livre » se pose quand il ne reste ni scène à finir, ni erreur grave, ni point à confirmer */
  declarable: boolean;
  terminee: boolean;
  marque: MarqueEtape;
};

/**
 * L'étape « Relire » (F11.6) : ses quatre tâches, ce qui y reste, sa marque. Mêmes règles que
 * « Vérifier les chemins » : la tâche vide reste à sa place, cochée quand il n'y a plus de
 * scène à finir (F11-AC90) ; le sablier tant qu'il ne reste que des scènes à finir (F11-AC89) ;
 * la coche quand il ne reste rien et que l'adulte a déclaré avoir relu le livre (F11-AC88),
 * déclaration gardée quand une scène est rouverte (F11-AC91).
 */
export function etatRelire(problemes: Probleme[], acceptes: ReadonlySet<string> = new Set(), declaree = false): EtatRelire {
  const finir = scenesAFinir(problemes).length;
  const aRelire = aTraiter(problemes).filter((p) => p.etape === "relire");
  const restants = aRelire.filter((p) => !acceptes.has(p.cle));
  const graves = restants.filter((p) => p.gravite === "bloque").length;
  const confirmer = restants.filter((p) => p.gravite === "avert").length;
  const declarable = finir === 0 && graves === 0 && confirmer === 0;
  const terminee = declarable && declaree;
  const tache = (id: "graves" | "confirmer", gravite: Gravite): EtatTacheRelire => {
    const points = restants.filter((p) => p.gravite === gravite);
    return {
      id, nom: NOM_TACHE_RELIRE[id], points,
      acceptes: aRelire.filter((p) => p.gravite === gravite && acceptes.has(p.cle)),
      avert: gravite === "avert",
      attente: points.length === 0 && finir > 0,
      faite: points.length === 0 && finir === 0,
    };
  };
  const taches: EtatTacheRelire[] = [
    { id: "ecrire", nom: NOM_TACHE_RELIRE.ecrire, points: [], acceptes: [], avert: false, attente: false, faite: finir === 0 },
    tache("graves", "bloque"),
    tache("confirmer", "avert"),
    { id: "lire", nom: NOM_TACHE_RELIRE.lire, points: [], acceptes: [], avert: false, attente: false, faite: terminee },
  ];
  const marque: MarqueEtape = graves ? "reste" : finir ? "attente" : confirmer ? "reste" : terminee ? "coche" : null;
  return {
    finir, graves, confirmer, taches, declaree, declarable, terminee, marque,
    aSavoir: problemes.filter((p) => p.gravite === "info" && p.etape === "relire"),
  };
}

/** Le texte que la marque d'une étape porte pour un lecteur d'écran, et au survol. */
export const MOT_DE_MARQUE: Record<Exclude<MarqueEtape, null>, string> = {
  reste: "il reste à faire",
  attente: "en attente de l’écriture",
  coche: "terminée",
  fermee: "pas encore ouverte",
};

export const estEtapeLivre = (v: unknown): v is EtapeLivre => ETAPES_DU_LIVRE.some((x) => x.id === v);

// ——— Une seule règle pour le PDF définitif et le partage (F11.2, 15 octobre 2026) ———

/** Ce qui manque encore, étape par étape : chaque raison mène au temps où elle se traite. */
export type RaisonDeRefus = { etape: EtapeLivre; texte: string };

export type Conditions = {
  pdf: { possible: boolean; raisons: RaisonDeRefus[] };
  partage: { possible: boolean; raisons: RaisonDeRefus[] };
  /** Avertissements et points « à savoir », acceptés ou non : rappelés à la demande, sans rien bloquer */
  rappels: Probleme[];
};

/**
 * Les conditions du PDF définitif et du partage. Communes : toutes les scènes incluses sont
 * prêtes, et aucun point bloquant ne reste. En plus, pour le PDF définitif : « La mise en page
 * me convient » est déclarée et aucun doute sur l'ordre des passages n'attend ; pour le
 * partage : « Imprimer et partager » a été ouverte une fois. Les déclarations des deux
 * premières étapes ne sont pas revérifiées (F11-AC99, AC100).
 */
export function conditionsDuLivre(problemes: Probleme[], o: { aChoix: boolean; convient: boolean; doute: boolean; imprimerOuvert: boolean }): Conditions {
  const finir = problemes.filter((p) => p.sorte === "a-finir").length;
  // Les défauts d'écriture d'une scène à finir comptent avec elle (F09.2)
  const bloquants = problemes.filter((p) => p.gravite === "bloque" && p.sorte !== "a-finir" && !p.reporte);
  const dans = (etape: "relire" | "chemins") => bloquants.filter((p) => (o.aChoix ? p.etape : "relire") === etape).length;
  const contenu: RaisonDeRefus[] = [];
  const relire = [finir ? `${finir} scène${finir > 1 ? "s" : ""} à finir` : "", dans("relire") ? `${dans("relire")} à corriger` : ""].filter(Boolean).join(", ");
  if (relire) contenu.push({ etape: "relire", texte: relire });
  if (o.aChoix && dans("chemins")) contenu.push({ etape: "chemins", texte: `${dans("chemins")} à corriger` });
  const pourLePdf = [...contenu];
  if (!o.convient) pourLePdf.push({ etape: "page", texte: "« La mise en page me convient » reste à déclarer" });
  else if (o.doute) pourLePdf.push({ etape: "page", texte: "L’ordre des passages est à confirmer" });
  const pourLePartage = [...contenu];
  if (!o.imprimerOuvert) pourLePartage.push({ etape: "sortie", texte: "« Imprimer et partager » n’est pas encore ouverte" });
  return {
    pdf: { possible: pourLePdf.length === 0, raisons: pourLePdf },
    partage: { possible: pourLePartage.length === 0, raisons: pourLePartage },
    rappels: problemes.filter((p) => (p.gravite === "avert" || p.gravite === "info") && !p.reporte),
  };
}
