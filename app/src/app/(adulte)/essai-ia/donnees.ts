import "server-only";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { notFound } from "next/navigation";
import { eleveEnMots } from "@/domaine/aides-ia";
import { difference, type Morceau } from "@/domaine/difference";
import { MODELES, type IdModele } from "@/serveur/ia/modeles";
import { FICHIER_JUGEMENTS, FICHIER_RESULTATS, type Jugement, type Jugements, type Note, type Resultats } from "../../../../scripts/essai-ia/commun";
import { JEU_D_ESSAI, type Cas } from "../../../../scripts/essai-ia/jeu";

/**
 * L'essai de qualité V17, lu et noté en local (étape 8, lot 1). Les propositions arrivent au
 * navigateur sous une lettre, jamais sous le nom de leur modèle, jusqu'à ce que le porteur
 * demande à voir les résultats. Rien de tout cela n'existe chez Vercel : ni fichiers, ni page.
 */

export function exigerEnLocal(): void {
  if (process.env.VERCEL || process.env.VERCEL_ENV) notFound();
}

const chemin = (f: string) => resolve(process.cwd(), f);

export function lireResultats(): Resultats | null {
  return existsSync(chemin(FICHIER_RESULTATS)) ? (JSON.parse(readFileSync(chemin(FICHIER_RESULTATS), "utf8")) as Resultats) : null;
}

export function lireJugements(): Jugements {
  return existsSync(chemin(FICHIER_JUGEMENTS)) ? (JSON.parse(readFileSync(chemin(FICHIER_JUGEMENTS), "utf8")) as Jugements) : {};
}

export function ecrireJugements(j: Jugements): void {
  writeFileSync(chemin(FICHIER_JUGEMENTS), JSON.stringify(j, null, 2));
}

export const LETTRES = "ABCDEFGHIJ";

/** Ce que le porteur lit d'une proposition : du texte, une liste, ou une correction marquée. */
export type Affichage =
  | { sorte: "texte"; texte: string }
  | { sorte: "liste"; elements: { titre: string; texte?: string; note?: string }[] }
  | { sorte: "correction"; paragraphes: Morceau[][] }
  | { sorte: "erreur"; texte: string };

export type CasAffiche = {
  id: string;
  aide: Cas["aide"];
  titre: string;
  repere: string | null;
  demande: { etiquette: string; texte: string }[];
  propositions: { lettre: string; affichage: Affichage }[];
  jugement: Omit<Jugement, "meilleur" | "notes"> & { meilleure: string | null; notes: Record<string, Note> };
};

const liste = (v: unknown, cle: string): unknown[] => ((v as Record<string, unknown>)?.[cle] as unknown[]) ?? [];

function affichage(cas: Cas, valeur: unknown, erreur: string | null): Affichage {
  if (erreur) return { sorte: "erreur", texte: `Pas de réponse utilisable (${erreur}).` };
  if (valeur === null || valeur === undefined) return { sorte: "erreur", texte: "Réponse illisible : elle ne tient pas ce que l'aide attend." };
  const v = valeur as Record<string, unknown>;
  switch (cas.aide) {
    case "correction":
      return { sorte: "correction", paragraphes: (v.paragraphes as string[]).map((p, i) => difference(cas.entree.paragraphes[i], p)) };
    case "pistes":
      return { sorte: "liste", elements: (v.pistes as string[]).map((t) => ({ titre: t })) };
    case "titre":
      return { sorte: "liste", elements: (v.titres as string[]).map((t) => ({ titre: t })) };
    case "ecriture":
      return { sorte: "texte", texte: (v.paragraphes as string[]).join("\n\n") };
    case "questions":
      return { sorte: "liste", elements: (v.questions as string[]).map((t) => ({ titre: t })) };
    case "idees":
      return { sorte: "liste", elements: (v.idees as string[]).map((t) => ({ titre: t })) };
    case "idees-choix":
      return {
        sorte: "liste",
        elements: liste(v, "idees").map((i) => {
          const o = i as { libelle: string; intention: string; destination: { sorte: string; titre?: string; ref?: string } };
          const scene = o.destination.sorte === "existante"
            ? `vers ${o.destination.ref} « ${cas.entree.scenes.find((s: { ref: string }) => s.ref === o.destination.ref)?.titre ?? "?"} »`
            : `nouvelle scène « ${o.destination.titre} »`;
          return { titre: o.libelle, texte: o.intention, note: scene };
        }),
      };
    case "parties":
      return { sorte: "liste", elements: liste(v, "ensembles").map((e) => { const o = e as { partie: string; chapitre: string; resume: string }; return { titre: o.partie, note: `1er chapitre : ${o.chapitre}`, texte: o.resume }; }) };
    case "chapitres":
      return { sorte: "liste", elements: liste(v, "chapitres").map((e) => { const o = e as { titre: string; resume: string }; return { titre: o.titre, texte: o.resume }; }) };
    case "personnages":
      return {
        sorte: "liste",
        elements: liste(v, "personnages").map((e) => {
          const o = e as { nom: string; autresNoms: string[]; description: string; heros: boolean };
          return { titre: `${o.nom}${o.heros ? " (héros)" : ""}`, note: o.autresNoms.length ? `aussi : ${o.autresNoms.join(", ")}` : undefined, texte: o.description };
        }),
      };
    case "consigne":
    case "retenons":
      return { sorte: "texte", texte: String(v.texte) };
    case "resume":
      return { sorte: "texte", texte: String(v.resume) };
    case "fiche-visuelle":
      return { sorte: "texte", texte: String(v.fiche) };
    case "description-image":
      return { sorte: "texte", texte: String(v.description) };
    case "mots-cles":
      return { sorte: "texte", texte: `${(v.mots as string[]).join(", ")}\n${(v.motsEn as string[]).join(", ")}` };
    case "presentation":
      return { sorte: "texte", texte: v.presentation as string };
  }
}

/** Ce qui est demandé, en clair, sans le contexte commun à tous les cas. */
function demande(cas: Cas): CasAffiche["demande"] {
  const e = cas.entree;
  const l: CasAffiche["demande"] = [];
  const ajouter = (etiquette: string, texte: unknown) => {
    if (typeof texte === "string" && texte.trim()) l.push({ etiquette, texte });
  };
  switch (cas.aide) {
    case "correction":
    case "pistes":
      ajouter("Écrit par", e.histoire.mode === "personnel" ? "un adulte, pour son livre" : `des ${eleveEnMots(e.histoire.age, true)}`);
      ajouter(e.histoire.mode === "personnel" ? "Texte" : "Texte de l'élève", e.paragraphes.join("\n"));
      ajouter("Consigne", e.consigne ?? "Aucune.");
      break;
    case "consigne":
      ajouter("Indication de l'adulte", e.indication);
      ajouter("Chapitre", e.chapitre ? `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}` : "");
      break;
    case "ecriture":
      ajouter("Consigne", e.consigne);
      ajouter("Ce qui mène ici", e.avant.map((x: { fin: string; choix?: string }) => `${x.fin}${x.choix ? ` (choix : « ${x.choix} »)` : ""}`).join("\n"));
      ajouter("Longueur visée", `environ ${e.cible} mots`);
      break;
    case "titre":
      ajouter("Consigne", e.consigne);
      ajouter("Début du texte", e.debut);
      ajouter("Autres titres du chapitre", e.autresTitres.join("\n"));
      break;
    case "idees-choix":
      ajouter("Scène", e.scene.titre);
      ajouter("Consigne", e.scene.consigne);
      ajouter("Texte", e.scene.paragraphes.join("\n") || "Pas encore écrit.");
      ajouter("Scènes du chapitre", e.scenes.map((s: { ref: string; titre: string }) => `${s.ref} « ${s.titre} »`).join("\n"));
      break;
    case "questions":
    case "idees":
    case "retenons":
      ajouter("Étape", e.question);
      ajouter("Questions déjà posées", e.questions.join("\n"));
      ajouter("Idées notées", e.idees.map((i: { texte: string; etat: string }) => `${i.texte} — ${{ retenue: "retenue", discuter: "à discuter", ecartee: "écartée" }[i.etat]}`).join("\n"));
      ajouter("Ce qui est retenu", e.retenu);
      break;
    case "parties":
    case "chapitres":
    case "resume":
      ajouter("Plan actuel", e.plan.map((p: { partie: string; chapitres: { titre: string }[] }) => `${p.partie} : ${p.chapitres.map((c) => c.titre).join(", ")}`).join("\n"));
      ajouter("Partie", e.partie);
      ajouter("Chapitre", e.chapitre);
      break;
    case "personnages":
      ajouter("Personnages retenus", e.carnet.personnages);
      break;
    case "fiche-visuelle":
      ajouter("Description de l'adulte", `${e.nom} : ${e.description}`);
      break;
    case "description-image":
      ajouter("Idée", e.idee || "Aucune : d'après la scène.");
      ajouter("Texte de la scène", e.paragraphes.join("\n"));
      ajouter("Retenus", e.badges.map((b: { nom: string }) => b.nom).join(", "));
      break;
    case "mots-cles":
      ajouter("Image", "Une vignette jointe.");
      break;
    case "presentation":
      ajouter("Début du livre", e.debut);
      break;
  }
  return l;
}

/** Les cas qui ont des propositions, dans l'ordre du jeu d'essai, chaque proposition sous sa lettre. */
export function casAffiches(): CasAffiche[] {
  const r = lireResultats();
  if (!r) return [];
  const jugements = lireJugements();
  return JEU_D_ESSAI.flatMap((cas) => {
    const ordre = r.ordres[cas.id] ?? [];
    const propositions = ordre.flatMap((modele, i) => {
      const res = r.resultats.find((x) => x.cas === cas.id && x.modele === modele);
      return res ? [{ lettre: LETTRES[i], modele, affichage: affichage(cas, res.valeur, res.erreur) }] : [];
    });
    if (!propositions.length) return [];
    const j = jugements[cas.id];
    const lettreDe = (m: IdModele | "aucune" | null) => (m === "aucune" ? "aucune" : propositions.find((p) => p.modele === m)?.lettre ?? null);
    return [{
      // Les identifiants des critères (« F13-AC05 ») servent au document, pas au jugement
      id: cas.id, aide: cas.aide, titre: cas.titre, repere: cas.repere?.replace(/\s*\(F\d+-AC\d+\)/g, "") ?? null, demande: demande(cas),
      propositions: propositions.map(({ lettre, affichage }) => ({ lettre, affichage })),
      jugement: {
        meilleure: lettreDe(j?.meilleur ?? null),
        notes: Object.fromEntries(Object.entries(j?.notes ?? {}).flatMap(([m, n]) => (lettreDe(m as IdModele) ? [[lettreDe(m as IdModele)!, n]] : []))),
        remarque: j?.remarque ?? "",
      },
    }];
  });
}

/** Le modèle derrière une lettre d'un cas : seul le serveur le sait. */
export function modeleDe(casId: string, lettre: string): IdModele | null {
  const ordre = lireResultats()?.ordres[casId] ?? [];
  return ordre[LETTRES.indexOf(lettre)] ?? null;
}

export type Bilan = {
  modele: IdModele;
  nom: string;
  fournisseur: string;
  cas: number;
  /** Cas où ce modèle a reçu une note */
  notes: number;
  meilleures: number;
  bonnes: number;
  passables: number;
  ecartees: number;
  echecs: number;
  /** Bonne 2, passable 1, à écarter 0, et 1 de plus pour la meilleure : rapporté au nombre de cas notés */
  points: number;
  coutMoyen: number;
  dureeMoyenne: number;
};

/** Les résultats, par aide puis pour tout l'essai, révélés à la demande du porteur. */
export function bilans(): { parAide: { aide: string; lignes: Bilan[] }[]; total: Bilan[]; depense: number } {
  const r = lireResultats();
  const jugements = lireJugements();
  if (!r) return { parAide: [], total: [], depense: 0 };
  const calculer = (cas: Cas[]): Bilan[] => {
    const modeles = [...new Set(cas.flatMap((c) => r.ordres[c.id] ?? []))];
    return modeles.map((m) => {
      const res = r.resultats.filter((x) => x.modele === m && cas.some((c) => c.id === x.cas));
      const notes = cas.map((c) => jugements[c.id]?.notes?.[m]).filter(Boolean) as Note[];
      const meilleures = cas.filter((c) => jugements[c.id]?.meilleur === m).length;
      const compte = (n: Note) => notes.filter((x) => x === n).length;
      const points = notes.length ? (compte("bonne") * 2 + compte("passable") + meilleures) / notes.length : 0;
      return {
        modele: m, nom: MODELES[m].nom, fournisseur: MODELES[m].fournisseur === "anthropic" ? "Anthropic" : "OpenAI",
        cas: res.length, notes: notes.length, meilleures, bonnes: compte("bonne"), passables: compte("passable"), ecartees: compte("mauvaise"),
        echecs: res.filter((x) => x.erreur || x.valeur === null).length, points,
        coutMoyen: res.length ? res.reduce((s, x) => s + x.cout, 0) / res.length : 0,
        dureeMoyenne: res.length ? res.reduce((s, x) => s + x.duree, 0) / res.length : 0,
      };
    }).filter((b) => b.cas > 0).sort((a, b) => b.points - a.points || a.coutMoyen - b.coutMoyen);
  };
  const aides = [...new Set(JEU_D_ESSAI.map((c) => c.aide))];
  return {
    parAide: aides.map((aide) => ({ aide, lignes: calculer(JEU_D_ESSAI.filter((c) => c.aide === aide)) })),
    total: calculer(JEU_D_ESSAI),
    depense: r.resultats.reduce((s, x) => s + x.cout, 0),
  };
}
