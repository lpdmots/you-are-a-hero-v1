/**
 * La composition du livre (F11.2 à F11.5) : ce que le livre imprime, dans quel ordre, et le
 * document qui le porte. Une seule composition sert l'aperçu, le PDF de travail et le PDF
 * définitif ; le PDF de travail n'y ajoute que des marques, posées après la mise en page par
 * le navigateur du serveur, hors du fil du texte (F11.2, « une seule composition »).
 *
 * Rien ici ne pagine : les pages sont calculées par Paged.js dans Chromium (ADR 0003). Ce
 * module dit seulement ce que contient le livre et le met en HTML, avec la césure française
 * posée d'avance, pour que les coupures ne dépendent pas des dictionnaires d'une machine.
 */

import { hyphenateSync } from "hyphen/fr";
import type { Lettres } from "./copie";
import { phraseDe, type Gravite, type Probleme } from "./controles";
import { livrePourLAdulte, type BlocLu, type MotLu } from "./lecture";
import { groupesDeMelange, numerosDuPlan, ouvertureDe, planNumerote } from "./numeros";
import type { Feuille, FormuleRenvoi, Section, SigneAction } from "./preparation";
import { colonnesDesNoms, nomsTries, TEXTE_DES, TEXTE_ENIGMES, type PagesDuLivre, type TexteLeger } from "./pages";
import { referenceScene, type Plan } from "./recit";
import { largeurImprimee, zoneDeTexte, type ReglagesDuLivre } from "./mise-en-page";
import type { Texte } from "./copie";

// ——— Ce que le livre contient ———

/** Une marque du PDF de travail, posée à côté d'un bloc ou du début du passage (F11.2). */
export type MarqueDeTravail = { gravite: Gravite; texte: string; bloc: string | null };

export type PassageACompose = {
  sceneId: string;
  /** « S042 » : la référence stable, imprimée par le seul PDF de travail */
  reference: string;
  /** Le numéro du passage ; rien en récit classique */
  numero: number | null;
  /** Le titre de partie imprimé au-dessus du passage (F11.5) */
  partie: { titre: string; nouvellePage: boolean } | null;
  /** Récit classique : le titre de chapitre imprimé au-dessus (F11.5, 15 octobre 2026) */
  chapitre: { numero: number; titre: string; nouvellePage: boolean } | null;
  /** Récit classique : le filet au losange qui le sépare de la scène précédente */
  separateur: boolean;
  /** Ajustement de l'adulte : commencer sur une nouvelle page (F11.3) */
  nouvellePage: boolean;
  fin: boolean;
  vide: boolean;
  blocs: BlocLu[];
  /** Pour le PDF de travail : énigmes et numéro fixé, signalés à côté du numéro */
  enigmes: number[];
  numeroFixe: boolean;
  marques: MarqueDeTravail[];
};

export type LigneDuRecapitulatif = { gravite: Gravite; texte: string; sceneId: string | null; reference: string | null; numero: number | null };

export type LivreACompose = {
  titre: string;
  aChoix: boolean;
  marqueFin: string;
  reglages: ReglagesDuLivre;
  passages: PassageACompose[];
  /** Les images que le livre peut imprimer, avec leurs dimensions en pixels ; une image absente d'ici est introuvable */
  images: Record<string, { largeur: number; hauteur: number }>;
  /** La page récapitulative du PDF de travail : les points des contrôles, par gravité */
  recapitulatif: LigneDuRecapitulatif[];
  /** Le nombre de scènes du livre qui ne sont pas encore prêtes */
  aFinir: number;
  feuille: Feuille | null;
  /** Le dé du livre (F04.2) : ce que les dés imprimés en bas de page reprennent (F11.4) */
  des: 0 | 1 | 2;
  /** Les pages de présentation, dans l'ordre fixe de F11.4 ; rien pour un livre composé sans elles */
  presentation: PresentationACompose | null;
};

/** Une page de présentation : son modèle, ou son image pleine page (F11.4). */
export type PresentationACompose = {
  titre: { image: string | null; titre: string; sousTitre: string; ligne: string; annee: string; illustration: string | null };
  auteurs: { image: string | null; place: "debut" | "fin"; introduction: string; noms: string[]; conclusion: string } | null;
  commentLire: { image: string | null; texte: TexteLeger; enigmes: boolean; regles: string; des: boolean } | null;
  feuille: { image: string | null; sections: Section[] } | null;
  fin: { image: string | null; texte: TexteLeger } | null;
};

/** Les pages de présentation à composer, d'après celles du projet et ce que le livre contient. */
export function presentationDe(
  pages: PagesDuLivre,
  o: { titre: string; aChoix: boolean; feuille: Feuille | null; regles: string; aDesEnigmes: boolean; desImprimes: boolean },
): PresentationACompose {
  const image = (p: { forme: string; imageId: string | null }) => (p.forme === "image" ? p.imageId : null);
  const t = pages.titre;
  return {
    titre: { image: image(t), titre: o.titre, sousTitre: t.sousTitre, ligne: t.ligne, annee: t.annee, illustration: t.illustration },
    auteurs: pages.auteurs.presente ? { image: image(pages.auteurs), place: pages.auteurs.place, introduction: pages.auteurs.introduction, noms: nomsTries(pages.auteurs.noms), conclusion: pages.auteurs.conclusion } : null,
    commentLire: o.aChoix && pages.commentLire.presente
      ? { image: image(pages.commentLire), texte: pages.commentLire.texte, enigmes: pages.commentLire.enigmes ?? o.aDesEnigmes, regles: o.regles.trim(), des: o.desImprimes }
      : null,
    feuille: o.aChoix && o.feuille?.on && o.feuille.sections.length ? { image: image(pages.feuille), sections: o.feuille.sections } : null,
    fin: pages.fin.presente ? { image: image(pages.fin), texte: pages.fin.texte } : null,
  };
}

export type EntreeDuLivre = {
  /** Les pages de présentation, déjà résolues ; rien : le livre est composé sans elles */
  presentation?: PresentationACompose | null;
  titre: string;
  aChoix: boolean;
  plan: Plan;
  textes: ReadonlyMap<string, Texte>;
  formule: FormuleRenvoi;
  marqueFin: string;
  feuille: Feuille | null;
  reglages: ReglagesDuLivre;
  problemes: Probleme[];
  images: Record<string, { largeur: number; hauteur: number }>;
  /** Scènes qui commencent sur une nouvelle page (F11.3) */
  nouvellesPages?: ReadonlySet<string>;
};

/**
 * Le livre à composer : les seules scènes incluses, dans l'ordre imprimé — celui des numéros
 * pour le récit à choix (F11.5), celui du plan pour le récit classique —, avec ce que chacune
 * imprime au-dessus d'elle.
 */
export function livreACompose(e: EntreeDuLivre): LivreACompose {
  const lu = livrePourLAdulte(e.plan, e.textes, { aChoix: e.aChoix, formule: e.formule, marqueFin: e.marqueFin, feuille: e.feuille, regles: "" });
  const r = e.reglages;
  const nouvelles = e.nouvellesPages ?? new Set<string>();
  const marques = marquesDeTravail(e.problemes, lu.passages);
  const scenes = new Map(e.plan.parties.flatMap((p) => p.chapitres.flatMap((c) => c.scenes.map((s) => [s.id, s] as const))));

  const passage = (id: string, numero: number | null): PassageACompose => {
    const p = lu.passages[id];
    const s = scenes.get(id)!;
    return {
      sceneId: id, reference: referenceScene(p.reference ?? 0), numero, partie: null, chapitre: null, separateur: false,
      nouvellePage: nouvelles.has(id), fin: p.fin, vide: p.vide, blocs: p.blocs,
      enigmes: p.enigmes.flatMap((x) => (x.numero === null ? [] : [x.numero])), numeroFixe: s.numeroFixe !== null,
      marques: marques.get(id) ?? [],
    };
  };

  const passages: PassageACompose[] = [];
  if (e.aChoix) {
    const numeros = numerosDuPlan(e.plan);
    const ordre = [...numeros.ordre, ...[...numeros.de.keys()].filter((id) => !numeros.ordre.includes(id))];
    for (const id of ordre) passages.push(passage(id, numeros.de.get(id) ?? null));
    // Les titres de partie (F11.5) : au-dessus du premier passage d'un groupe de mélange, et
    // au-dessus de sa scène d'ouverture pour une partie mélangée dans le groupe d'une autre
    if (r.titresDePartie) {
      const rang = new Map(passages.map((p, i) => [p.sceneId, i]));
      const parties = new Map(e.plan.parties.map((p) => [p.id, p]));
      for (const groupe of groupesDeMelange(planNumerote(e.plan))) {
        groupe.forEach((pn, i) => {
          const ids = pn.chapitres.filter((c) => !c.horsLivre).flatMap((c) => c.scenes.filter((s) => !s.horsLivre).map((s) => s.id));
          if (!ids.length) return; // une partie entièrement exclue n'imprime pas son titre (F11.2)
          let ou: number | undefined;
          if (i === 0) {
            const rangs = groupe.flatMap((x) => x.chapitres.flatMap((c) => c.scenes.map((s) => rang.get(s.id)))).filter((n): n is number => n !== undefined);
            ou = rangs.length ? Math.min(...rangs) : undefined;
          } else {
            const ouverture = ouvertureDe(pn);
            ou = ouverture ? rang.get(ouverture) : undefined;
          }
          if (ou === undefined || passages[ou].partie) return;
          passages[ou].partie = { titre: parties.get(pn.id)!.titre, nouvellePage: i === 0 && ou > 0 && r.partieNouvellePage };
        });
      }
    }
  } else {
    let chapitresImprimes = 0;
    for (const partie of e.plan.parties) {
      let premierDeLaPartie = true;
      for (const c of partie.chapitres) {
        if (c.horsLivre) continue;
        let premierDuChapitre = true;
        for (const s of c.scenes) {
          if (s.horsLivre) continue;
          const p = passage(s.id, null);
          const debutDuLivre = passages.length === 0;
          if (premierDeLaPartie && r.titresDePartie) p.partie = { titre: partie.titre, nouvellePage: !debutDuLivre && r.partieNouvellePage };
          if (premierDuChapitre && r.titresDeChapitre) {
            chapitresImprimes += 1;
            p.chapitre = { numero: chapitresImprimes, titre: c.titre, nouvellePage: !debutDuLivre && !p.partie && r.chapitreNouvellePage };
          }
          // Le filet sépare deux scènes ; un titre imprimé au-dessus en tient lieu
          p.separateur = !debutDuLivre && !p.partie && !p.chapitre;
          passages.push(p);
          premierDeLaPartie = false;
          premierDuChapitre = false;
        }
      }
    }
  }

  const numeroDe = new Map(passages.map((p) => [p.sceneId, p.numero]));
  const referenceDe = new Map(passages.map((p) => [p.sceneId, p.reference]));
  const recapitulatif = e.problemes
    .filter((p) => p.sorte !== "a-finir")
    .map((p): LigneDuRecapitulatif => {
      const sceneId = "sceneId" in p ? p.sceneId : null;
      return { gravite: p.gravite, texte: phraseDe(p).quoi, sceneId, reference: sceneId ? (referenceDe.get(sceneId) ?? null) : null, numero: sceneId ? (numeroDe.get(sceneId) ?? null) : null };
    })
    .sort((a, b) => ORDRE_GRAVITE[a.gravite] - ORDRE_GRAVITE[b.gravite] || (a.numero ?? Infinity) - (b.numero ?? Infinity));

  // Ce que le livre imprime et partage, l'apostrophe redressée ; le texte enregistré ne change pas (F11-AC109)
  return typographier({
    titre: e.titre, aChoix: e.aChoix, marqueFin: lu.marqueFin, reglages: r, passages, images: e.images, recapitulatif,
    aFinir: e.problemes.filter((p) => p.sorte === "a-finir").length,
    feuille: lu.feuille,
    des: e.aChoix && e.feuille?.on ? e.feuille.des : 0,
    presentation: e.presentation ?? null,
  });
}

/**
 * L'apostrophe typographique du livre (décidé le 26 octobre 2026, F11-AC109) : l'apostrophe
 * droite tapée au clavier, par un élève, un adulte ou une aide, devient « ’ » entre deux lettres
 * (« l'eau » → « l’eau »). Ni les identités ni les adresses n'en ont : elles ne changent pas.
 */
export const apostrophes = (t: string): string => t.replace(/(?<=\p{L})'(?=\p{L})/gu, "’");

/** Toutes les chaînes d'un livre composé, l'apostrophe redressée ; les objets simples et les tableaux seulement. */
function typographier<T>(v: T): T {
  if (typeof v === "string") return apostrophes(v) as T;
  if (Array.isArray(v)) return v.map(typographier) as T;
  if (v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype) {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typographier(x)])) as T;
  }
  return v;
}

const ORDRE_GRAVITE: Record<Gravite, number> = { bloque: 0, avert: 1, info: 2 };

/** Les points des contrôles, chacun à sa place dans le passage : le choix en cause, sinon le début. */
function marquesDeTravail(problemes: Probleme[], passages: Record<string, { blocs: BlocLu[] }>): Map<string, MarqueDeTravail[]> {
  const parScene = new Map<string, MarqueDeTravail[]>();
  for (const p of problemes) {
    if (!("sceneId" in p) || !p.sceneId || !passages[p.sceneId]) continue;
    let bloc: string | null = null;
    if ("renvoiId" in p) {
      bloc = passages[p.sceneId].blocs.find((b) => b.type === "choix" && b.morceaux.some((m) => "renvoi" in m && m.renvoi === p.renvoiId))?.id ?? null;
    }
    const texte = p.sorte === "a-finir" ? "À finir" : phraseDe(p).quoi;
    parScene.set(p.sceneId, [...(parScene.get(p.sceneId) ?? []), { gravite: p.sorte === "a-finir" ? "info" : p.gravite, texte, bloc }]);
  }
  return parScene;
}

// ——— Césure (F11.3) ———

/** Trait d'union conditionnel : la césure est posée ici, une fois, et non par le navigateur. */
export const CESURE = "­";
const MOT = /\p{L}+/gu;

/**
 * La césure française d'un mot, restreinte (F11.3) : jamais dans un mot qui commence par une
 * majuscule, trois lettres au moins de chaque côté de la coupure.
 */
export function couperMot(mot: string): string {
  if (mot.length < 6 || mot[0] !== mot[0].toLowerCase()) return mot;
  const coupe = hyphenateSync(mot, { hyphenChar: CESURE, minWordLength: 6 }) as string;
  const morceaux = coupe.split(CESURE);
  let sortie = "";
  let avant = 0;
  for (let i = 0; i < morceaux.length; i += 1) {
    sortie += morceaux[i];
    avant += morceaux[i].length;
    if (i < morceaux.length - 1 && avant >= 3 && mot.length - avant >= 3) sortie += CESURE;
  }
  return sortie;
}

/** La césure d'un texte, sauf, si on le demande, sur son dernier mot (fin de paragraphe). */
export function couperTexte(texte: string, epargnerLeDernier: boolean): string {
  const mots = [...texte.matchAll(MOT)];
  const dernier = epargnerLeDernier ? mots.at(-1)?.index : undefined;
  return texte.replace(MOT, (mot, ...args) => (args[0] === dernier ? mot : couperMot(mot)));
}

// ——— Le document ———

/** Échappe un texte pour le HTML. */
export const html = (t: string): string => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Les signes devant une action de jeu, tracés comme les icônes de l'outil (`Icone.tsx`). */
const SIGNES: Record<SigneAction, string> = {
  crayon: '<path d="M5 19l1-4.2L15.6 5.2a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L9.2 18 5 19z"/><path d="M13.8 7l3.2 3.2"/>',
  de: '<rect x="4" y="4" width="16" height="16" rx="3.5"/>' + [[8.6, 8.6], [15.4, 8.6], [12, 12], [8.6, 15.4], [15.4, 15.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" fill="currentColor"/>`).join(""),
  sac: '<path d="M5.5 9.5h13l1 9.2a1.6 1.6 0 0 1-1.6 1.8H6.1a1.6 1.6 0 0 1-1.6-1.8z"/><path d="M9 9.5V7.2a3 3 0 0 1 6 0v2.3"/><path d="M9.5 14h5"/>',
  coeur: '<path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 7.8a3.9 3.9 0 0 1 7 2.3c0 5.1-7 9.4-7 9.4z"/>',
};
const signe = (s: SigneAction) => `<svg class="signe" viewBox="0 0 24 24" aria-hidden="true">${SIGNES[s]}</svg>`;

/** Le filet au losange, celui de la page de titre (F11.5, 15 octobre 2026). */
export const FILET = '<svg class="filet" viewBox="0 0 120 10" aria-hidden="true"><path d="M0 5h52M68 5h52"/><path d="M60 1.5l3.5 3.5L60 8.5 56.5 5z"/></svg>';

export type Options = {
  /** Le PDF de travail et l'aperçu : la page récapitulative, et les attributs des marques */
  travail: boolean;
  /** L'état du contenu, dit par la mention « Version de travail » */
  etatDu: string;
  /** L'adresse d'une image, dans la page du serveur */
  image: (id: string) => string;
};

const attributs = (a: Record<string, string | number | null | undefined | false>): string =>
  Object.entries(a).filter(([, v]) => v !== null && v !== undefined && v !== false).map(([k, v]) => ` ${k}="${html(String(v))}"`).join("");

function mots(liste: MotLu[], o: Options, livre: LivreACompose | null, cesure: boolean): string {
  // Le dernier mot d'un paragraphe n'est pas coupé (F11.3) : on le cherche dans le dernier texte
  const dernierTexte = liste.map((m, i) => ("text" in m && m.text.trim() ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  return liste.map((m, i) => {
    if (!("text" in m)) {
      const connue = livre?.images[m.image];
      return connue
        ? `<img class="symbole" src="${html(o.image(m.image))}" alt="${html(m.alt ?? "")}">`
        : `<span class="introuvable-ligne"${attributs({ "data-image-introuvable": m.image })}>[image]</span>`;
    }
    const l = m as Lettres;
    let t = html(cesure ? couperTexte(l.text, i === dernierTexte) : l.text);
    if (l.underline) t = `<u>${t}</u>`;
    if (l.italic) t = `<em>${t}</em>`;
    if (l.bold) t = `<strong>${t}</strong>`;
    return t;
  }).join("");
}

function phrase(b: Extract<BlocLu, { type: "choix" }>, o: Options, livre: LivreACompose): string {
  const corps = b.morceaux.map((m) => {
    if ("texte" in m) return html(m.texte);
    if ("renvoi" in m) return `<b class="renvoi"${attributs({ "data-renvoi": m.renvoi, "data-cible": m.cible.sorte === "passage" ? m.cible.id : null })}>${html(m.numero)}</b>`;
    const connue = livre.images[m.image];
    return connue ? `<img class="symbole" src="${html(o.image(m.image))}" alt="${html(m.alt ?? "")}">` : `<span class="introuvable-ligne">[image]</span>`;
  }).join("");
  return `<p class="choix"${attributs({ "data-bloc": b.id })}>${corps}</p>`;
}

function image(b: Extract<BlocLu, { type: "image" }>, o: Options, livre: LivreACompose, sceneId: string, enTete = false): string {
  const connue = livre.images[b.image];
  const legende = b.legende ? `<figcaption>${html(b.legende)}</figcaption>` : "";
  const a = attributs({ "data-bloc": b.id, "data-scene": sceneId, "data-image": b.image, "data-pourcent": b.page ? 100 : b.largeur, "data-pleine-page": b.page ? "1" : null });
  if (!connue) {
    // L'indication à la place de l'image (F10-AC14) : le PDF définitif, lui, est refusé
    return `<figure class="image introuvable${enTete ? " en-tete" : b.page ? " page" : ""}"${a} style="width:${b.page ? 100 : b.largeur}%"><div class="manque">Image introuvable</div>${legende}</figure>`;
  }
  const ratio = connue.largeur / connue.hauteur;
  // Une image trop haute pour la page est réduite, proportions gardées (F10) ; les contrôles le disent si sa largeur a été réglée à la main
  const largeur = b.page ? 100 : largeurImprimee(b, connue, livre.reglages).pourcent;
  return `<figure class="image${enTete ? " en-tete" : b.page ? " page" : ""}"${a} style="width:${largeur}%"><img src="${html(o.image(b.image))}" alt="${html(b.alt ?? "")}" style="aspect-ratio:${ratio.toFixed(5)}">${legende}</figure>`;
}

function passageHtml(p: PassageACompose, livre: LivreACompose, o: Options): string {
  const cesure = livre.reglages.alignement === "justifie";
  const morceaux: string[] = [];
  if (p.separateur) morceaux.push(`<div class="separateur">${FILET}</div>`);
  if (p.partie) morceaux.push(`<h1 class="partie${p.partie.nouvellePage ? " nouvelle-page" : ""}">${html(p.partie.titre)}</h1>`);
  if (p.chapitre) {
    morceaux.push(`<h2 class="chapitre${p.chapitre.nouvellePage ? " nouvelle-page" : ""}"${attributs({ "data-chapitre": p.chapitre.titre })}><span class="chapitre__rang">Chapitre ${p.chapitre.numero}</span>${html(p.chapitre.titre)}</h2>`);
  }
  const debut = attributs({
    "data-scene": p.sceneId, "data-reference": p.reference,
    "data-enigmes": o.travail && p.enigmes.length ? p.enigmes.join(",") : null,
    "data-fixe": o.travail && p.numeroFixe ? "1" : null,
  });
  if (p.numero !== null) {
    morceaux.push(`<h2 class="numero${p.nouvellePage && !p.partie ? " nouvelle-page" : ""}"${debut}${attributs({ "data-numero": p.numero })}>${p.numero}</h2>`);
  } else {
    morceaux.push(`<span class="debut-scene${p.nouvellePage && !p.partie && !p.chapitre ? " nouvelle-page" : ""}"${debut}></span>`);
  }

  // Une image pleine page posée avant tout texte partage sa page avec le numéro et les titres
  // qui ouvrent le passage, imprimés au-dessus d'elle ; elle est réduite d'autant (F10-AC36)
  const tete = p.blocs[0]?.type === "image" && p.blocs[0].page ? p.blocs[0] : null;
  if (tete && tete.type === "image") {
    const saut = morceaux.some((m) => m.includes("nouvelle-page"));
    const titres = morceaux.splice(0).filter((m) => !m.startsWith('<div class="separateur"'));
    morceaux.push(`<div class="page-image${saut ? "" : " page-image--coupe"}">${titres.join("")}${image(tete, o, livre, p.sceneId, true)}</div>`);
  }

  // La marque de fin s'imprime après le texte, et avant les choix d'une fin qui en garde (F11.5)
  const premierChoix = p.blocs.findIndex((b) => b.type === "choix");
  const avantLesChoixDeFin = p.fin && premierChoix >= 0 && p.blocs.slice(premierChoix).every((b) => b.type === "choix" || b.type === "image") ? premierChoix : -1;
  const fin = `<p class="fin"${attributs({ "data-scene": p.sceneId })}>${html(livre.marqueFin)}</p>`;

  let groupe: string[] = [];
  const fermerGroupe = () => {
    if (groupe.length) morceaux.push(`<div class="choix-groupe">${groupe.join("")}</div>`);
    groupe = [];
  };
  p.blocs.forEach((b, i) => {
    if (i === 0 && tete) return;
    if (i === avantLesChoixDeFin) morceaux.push(fin);
    if (b.type === "choix") {
      groupe.push(phrase(b, o, livre));
      return;
    }
    fermerGroupe();
    if (b.type === "p") {
      const contenu = mots(b.mots, o, livre, cesure);
      if (contenu.replace(/<[^>]+>/g, "").trim() || contenu.includes("<img")) morceaux.push(`<p class="r"${attributs({ "data-bloc": b.id })}>${contenu}</p>`);
    } else if (b.type === "action") {
      morceaux.push(`<p class="action"${attributs({ "data-bloc": b.id })}>${signe(b.signe)}<span>${mots(b.mots, o, livre, false)}</span></p>`);
    } else if (b.type === "image") {
      morceaux.push(image(b, o, livre, p.sceneId));
    }
  });
  fermerGroupe();
  if (p.fin && avantLesChoixDeFin < 0) morceaux.push(fin);
  if (p.vide) morceaux.push(`<p class="vide">Texte vide</p>`);

  const marques = o.travail && p.marques.length ? attributs({ "data-marques": JSON.stringify(p.marques) }) : "";
  return `<section class="passage"${attributs({ "data-scene": p.sceneId })}${marques}>${morceaux.join("")}</section>`;
}

const MOT_GRAVITE: Record<Gravite, string> = { bloque: "Bloque le PDF définitif", avert: "À vérifier", info: "À savoir" };

/** La page récapitulative du PDF de travail, avant le livre, hors pagination (F11.2). */
function recapitulatifHtml(livre: LivreACompose, o: Options): string {
  const lignes: string[] = [];
  for (const gravite of ["bloque", "avert", "info"] as Gravite[]) {
    const points = livre.recapitulatif.filter((l) => l.gravite === gravite);
    if (!points.length) continue;
    lignes.push(`<h2 class="recap__gravite recap__gravite--${gravite}">${MOT_GRAVITE[gravite]} · ${points.length}</h2><ul>`);
    for (const l of points) {
      const ou = [l.numero !== null ? `n° ${l.numero}` : null, l.reference].filter(Boolean).join(" · ");
      lignes.push(`<li${attributs({ "data-recap-scene": l.sceneId })}><span class="recap__ou">${html(ou)}</span><span class="recap__page"></span><span class="recap__texte">${html(l.texte)}</span></li>`);
    }
    lignes.push("</ul>");
  }
  const finir = livre.aFinir ? `<p class="recap__finir">${livre.aFinir} scène${livre.aFinir > 1 ? "s" : ""} à finir.</p>` : "";
  const rien = !livre.recapitulatif.length ? `<p class="recap__rien">Aucun point des contrôles.</p>` : "";
  return `<section class="recap" data-recap><p class="recap__mention">Version de travail · ${html(o.etatDu)}</p><h1 class="recap__titre">${html(livre.titre)}</h1>${finir}${rien}${lignes.join("")}</section>`;
}

// ——— Les pages de présentation (F11.4) ———

const leger = (t: TexteLeger, cesure = false): string =>
  t.map((p) => `<p>${mots(p as MotLu[], { travail: false, etatDu: "", image: () => "" }, null, cesure) || "&nbsp;"}</p>`).join("");

/** Une page de présentation en image pleine page : à l'intérieur des marges, réduite si elle a été dessinée bord à bord. */
const pageEnImage = (classe: string, nom: string, image: string, livre: LivreACompose, o: Options): string =>
  livre.images[image]
    ? `<section class="pres ${classe} pres--image" data-page="${nom}"><figure class="image page"><img src="${html(o.image(image))}" alt=""></figure></section>`
    : `<section class="pres ${classe} pres--image" data-page="${nom}"><figure class="image page introuvable"><div class="manque">Image introuvable</div></figure></section>`;

/**
 * La feuille d'aventure imprimée tient-elle sur une page ? Alors ses listes et ses notes se
 * partagent la place qui reste, cinq lignes au moins chacune ; sinon elle continue sur la page
 * suivante, chaque liste gardant huit lignes (F04.2, 15 octobre 2026). Une estimation par excès.
 */
export function feuilleSurUnePage(sections: Section[], r: ReglagesDuLivre): boolean {
  const LIGNE = 8;
  const TITRE = 11;
  let hauteur = 18; // titre de la page
  for (const s of sections) hauteur += TITRE + (s.type === "compteurs" ? s.compteurs.length * LIGNE : 5 * LIGNE) + 4;
  return hauteur <= zoneDeTexte(r).hauteur;
}

function feuilleHtml(f: NonNullable<PresentationACompose["feuille"]>, livre: LivreACompose): string {
  const unePage = feuilleSurUnePage(f.sections, livre.reglages);
  const sections = f.sections.map((s) => {
    const titre = `<h3 class="feuille__titre">${html(s.titre)}</h3>`;
    if (s.type === "compteurs") {
      const lignes = s.compteurs.map((c) => `<li><span class="feuille__nom">${html(c.nom)}</span><span class="feuille__depart">départ ${c.depart}</span><span class="feuille__case"></span></li>`).join("");
      return `<section class="feuille__section feuille__section--compteurs">${titre}<ul>${lignes}</ul></section>`;
    }
    // Une liste : des lignes de 8 mm, autant que la page en laisse sur une feuille d'une page, huit sinon
    const corps = s.type === "liste" ? `<div class="feuille__lignes">${"<span></span>".repeat(unePage ? 30 : 8)}</div>` : `<div class="feuille__cadre"></div>`;
    return `<section class="feuille__section feuille__section--${s.type} feuille__section--remplit">${titre}${corps}</section>`;
  }).join("");
  return `<section class="pres pres--feuille${unePage ? " pres--une-page" : ""}" data-page="feuille"><h2 class="pres__titre">Feuille d’aventure</h2>${sections}</section>`;
}

function presentationHtml(livre: LivreACompose, o: Options): { debut: string; fin: string } {
  const p = livre.presentation;
  if (!p) return { debut: "", fin: "" };
  const t = p.titre;
  const titre = t.image
    ? pageEnImage("pres--titre", "titre", t.image, livre, o)
    : `<section class="pres pres--titre" data-page="titre"><div class="pres__haut"><h1 class="pres__livre">${html(t.titre)}</h1>${t.sousTitre ? `<p class="pres__sous-titre">${html(t.sousTitre)}</p>` : ""}${FILET}</div>${
        t.illustration && livre.images[t.illustration] ? `<figure class="pres__illustration"><img src="${html(o.image(t.illustration))}" alt=""></figure>` : ""
      }<div class="pres__bas">${t.ligne ? `<p class="pres__ligne">${html(t.ligne)}</p>` : ""}${t.annee ? `<p class="pres__annee">${html(t.annee)}</p>` : ""}</div></section>`;
  const a = p.auteurs;
  const auteurs = !a
    ? ""
    : a.image
      ? pageEnImage(`pres--auteurs${a.place === "fin" ? " pres--apres-le-recit" : ""}`, "auteurs", a.image, livre, o)
      : `<section class="pres pres--auteurs${a.place === "fin" ? " pres--apres-le-recit" : ""}" data-page="auteurs"><h2 class="pres__titre">${html(a.introduction)}</h2><ul class="pres__noms pres__noms--${colonnesDesNoms(a.noms.length)}">${a.noms.map((n) => `<li>${html(n)}</li>`).join("")}</ul>${a.conclusion ? `<p class="pres__conclusion">${html(a.conclusion)}</p>` : ""}</section>`;
  const c = p.commentLire;
  const regles = c?.regles ? `<h3 class="pres__sous-titre-section">Règles du jeu</h3>${c.regles.split(/\n\s*\n|\n/).filter((l) => l.trim()).map((l) => `<p>${html(l.trim())}</p>`).join("")}` : "";
  const commentLire = !c
    ? ""
    : c.image
      ? pageEnImage("pres--comment", "comment-lire", c.image, livre, o)
      : `<section class="pres pres--comment" data-page="comment-lire"><h2 class="pres__titre">Comment lire ce livre</h2>${leger(c.texte)}${c.enigmes ? `<p>${html(TEXTE_ENIGMES)}</p>` : ""}${c.des ? `<p>${html(TEXTE_DES)}</p>` : ""}${regles}</section>`;
  const feuille = !p.feuille ? "" : p.feuille.image ? pageEnImage("pres--feuille", "feuille", p.feuille.image, livre, o) : feuilleHtml(p.feuille, livre);
  const f = p.fin;
  const fin = !f ? "" : f.image ? pageEnImage("pres--apres-le-recit pres--fin", "fin", f.image, livre, o) : `<section class="pres pres--apres-le-recit pres--fin" data-page="fin">${leger(f.texte)}</section>`;
  return {
    debut: `${titre}${a && a.place === "debut" ? auteurs : ""}${commentLire}${feuille}`,
    fin: `${a && a.place === "fin" ? auteurs : ""}${fin}`,
  };
}

/** Le corps du document : la page récapitulative du PDF de travail, les pages de début, le récit, les pages de fin. */
export function corpsDuLivre(livre: LivreACompose, o: Options): string {
  const recit = livre.passages.map((p) => passageHtml(p, livre, o)).join("");
  const pages = presentationHtml(livre, o);
  return `${o.travail ? recapitulatifHtml(livre, o) : ""}${pages.debut ? `<div class="presentation" data-debut-livre>${pages.debut}</div>` : ""}<div class="recit${livre.aChoix ? " a-choix" : " classique"}"${pages.debut ? "" : " data-debut-livre"}>${recit}</div>${pages.fin}`;
}
