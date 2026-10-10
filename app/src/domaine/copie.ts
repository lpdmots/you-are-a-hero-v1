/**
 * Le texte d'une scène : une suite de blocs, telle que l'éditeur la tient et que la base
 * la garde (F04, F05.2). Aucune règle ici ne fait confiance à ce que le navigateur envoie :
 * `nettoyerTexte` ne laisse passer que ce qu'il connaît.
 */

import { CONSTRUCTIONS, estConstruction, phraseDeChoix, type Construction, type FormuleRenvoi } from "./preparation";

export type Marques = { bold?: true; italic?: true; underline?: true };
export type Lettres = { text: string } & Marques;

/**
 * Paragraphe de récit. Protégé par l'enseignant, un élève ne peut ni le modifier ni le
 * supprimer : il écrit autour (F06.1).
 */
export type Paragraphe = { type: "p"; id: string; protege?: true; children: Lettres[] };

/**
 * Note de l'enseignant : un paragraphe visible de l'adulte seul, jamais imprimé ni partagé.
 * Ce n'est pas du texte de la scène, et un élève n'en reçoit rien (F05.2).
 */
export type Note = { type: "note"; id: string; children: Lettres[] };

/**
 * Renvoi : relié à une scène de destination, il affiche son numéro, calculé ailleurs et
 * jamais écrit dans le texte (F05). Sans destination, il est « à décider plus tard ».
 */
export type Renvoi = { type: "renvoi"; id: string; cible: string | null; libelle?: string; children: [{ text: "" }] };

/**
 * Phrase de choix : un paragraphe à elle seule (F05.2). Automatique, elle n'enregistre
 * aucun texte — libellé, construction et destination, recomposés à l'affichage ;
 * personnalisée, son texte est libre et porte un ou plusieurs renvois.
 */
export type ChoixAuto = { type: "choix"; id: string; auto: true; libelle: string; construction: Construction; cible: string | null; children: [{ text: "" }] };
export type ChoixPerso = { type: "choix"; id: string; auto?: undefined; libelle: string; children: (Lettres | Renvoi)[] };
export type Choix = ChoixAuto | ChoixPerso;

/**
 * Liaison cachée par énigme (F05.1) : un lien vers une scène, sans phrase dans le récit. Le
 * lecteur trouve lui-même où poursuivre. Hors du récit : rangée à la fin du texte.
 */
export type Liaison = { type: "liaison"; id: string; cible: string | null; libelle?: string; children: [{ text: "" }] };

/**
 * Action de jeu (F04.2) : un paragraphe d'un type propre, qui dit au lecteur quoi faire sur sa
 * feuille d'aventure. Son texte est libre ; l'application n'en connaît pas le sens.
 */
export type Action = { type: "action"; id: string; protege?: true; children: [{ text: string }] };

export type Bloc = Paragraphe | Choix | Note | Liaison | Action;
export type Texte = Bloc[];

export const estChoix = (b: { type?: string }): b is Choix => b.type === "choix";
export const estAuto = (b: Bloc): b is ChoixAuto => b.type === "choix" && b.auto === true;
export const estRenvoi = (n: unknown): n is Renvoi => estObjet(n) && n.type === "renvoi";
export const estLiaison = (b: { type?: string }): b is Liaison => b.type === "liaison";
export const LIBELLE_MAX = 200;

/** Limites d'une scène : de quoi écrire un chapitre entier, pas de quoi encombrer la base */
export const LETTRES_MAX = 200_000;
export const BLOCS_MAX = 2_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Identité d'un bloc : elle distingue déplacer et copier, et suit le bloc d'un enregistrement à l'autre. */
export const nouvelId = (): string => crypto.randomUUID();

export const paragrapheVide = (): Paragraphe => ({ type: "p", id: nouvelId(), children: [{ text: "" }] });

/**
 * Une scène sans texte s'ouvre sur un paragraphe où écrire. Son identité se déduit de celle
 * de la scène : la page dessinée par le serveur et celle que reprend le navigateur doivent
 * porter la même, sans quoi une fiche ne retrouve pas le bloc sous lequel se poser.
 */
export const texteOuvert = <T extends Bloc>(texte: T[], sceneId: string): (T | Paragraphe)[] =>
  texte.length ? texte : [{ type: "p", id: UUID.test(sceneId) ? `00000000${sceneId.slice(8).toLowerCase()}` : nouvelId(), children: [{ text: "" }] }];

// Les caractères de commande n'ont rien à faire dans un récit ; tabulation et retour restent
const sansCommandes = (t: string): string => t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

function lettres(brut: unknown): Lettres | null {
  if (!estObjet(brut) || typeof brut.text !== "string") return null;
  const text = sansCommandes(brut.text);
  const l: Lettres = { text };
  if (brut.bold === true) l.bold = true;
  if (brut.italic === true) l.italic = true;
  if (brut.underline === true) l.underline = true;
  return l;
}

const memesMarques = (a: Lettres, b: Lettres): boolean => !!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.underline === !!b.underline;

/** Les lettres d'un paragraphe : au moins un morceau, les voisins de même forme réunis. */
function ligne(brut: unknown): Lettres[] {
  const morceaux: Lettres[] = [];
  for (const enfant of Array.isArray(brut) ? brut : []) {
    const l = lettres(enfant);
    if (!l) continue;
    const avant = morceaux[morceaux.length - 1];
    if (avant && memesMarques(avant, l)) avant.text += l.text;
    else if (l.text !== "" || morceaux.length === 0) morceaux.push(l);
  }
  const pleins = morceaux.filter((m, i) => m.text !== "" || (i === 0 && morceaux.length === 1));
  return pleins.length ? pleins : [{ text: "" }];
}

/**
 * Le texte reçu d'un navigateur, réduit à ce que l'application connaît. Rend null s'il
 * n'est pas un texte de scène ou s'il dépasse les limites. Chaque bloc garde ou reçoit une
 * identité, unique dans la scène.
 */
export function nettoyerTexte(brut: unknown): Texte | null {
  if (!Array.isArray(brut) || brut.length > BLOCS_MAX) return null;
  const vus = new Set<string>();
  const identite = (v: unknown): string => {
    const id = typeof v === "string" && UUID.test(v) && !vus.has(v.toLowerCase()) ? v.toLowerCase() : nouvelId();
    vus.add(id);
    return id;
  };
  const scene = (v: unknown): string | null => (typeof v === "string" && UUID.test(v) ? v.toLowerCase() : null);
  const libelle = (v: unknown): string => (typeof v === "string" ? sansCommandes(v).replace(/\s+/g, " ").trim().slice(0, LIBELLE_MAX) : "");
  const texte: Texte = [];
  const liaisons: Liaison[] = [];
  let compte = 0;
  for (const bloc of brut) {
    if (!estObjet(bloc)) return null;
    if (bloc.type === "p") {
      const children = ligne(bloc.children);
      compte += children.reduce((n, l) => n + l.text.length, 0);
      texte.push(bloc.protege === true ? { type: "p", id: identite(bloc.id), protege: true, children } : { type: "p", id: identite(bloc.id), children });
    } else if (bloc.type === "action") {
      // Texte libre, sans mise en forme : le livre la met en valeur lui-même
      const text = ligne(bloc.children).map((l) => l.text).join("");
      compte += text.length;
      texte.push(bloc.protege === true ? { type: "action", id: identite(bloc.id), protege: true, children: [{ text }] } : { type: "action", id: identite(bloc.id), children: [{ text }] });
    } else if (bloc.type === "note") {
      const children = ligne(bloc.children);
      compte += children.reduce((n, l) => n + l.text.length, 0);
      texte.push({ type: "note", id: identite(bloc.id), children });
    } else if (bloc.type === "liaison") {
      const liaison: Liaison = { type: "liaison", id: identite(bloc.id), cible: scene(bloc.cible), children: [{ text: "" }] };
      const l = libelle(bloc.libelle);
      if (l) liaison.libelle = l;
      liaisons.push(liaison);
    } else if (bloc.type === "choix" && bloc.auto === true) {
      texte.push({
        type: "choix", id: identite(bloc.id), auto: true, libelle: libelle(bloc.libelle),
        construction: typeof bloc.construction === "string" && estConstruction(bloc.construction) ? bloc.construction : "neutre",
        cible: scene(bloc.cible), children: [{ text: "" }],
      });
    } else if (bloc.type === "choix") {
      // Phrase personnalisée : du texte sans mise en forme, et ses renvois, chacun entre deux textes
      const children: (Lettres | Renvoi)[] = [{ text: "" }];
      let renvois = 0;
      for (const enfant of Array.isArray(bloc.children) ? bloc.children : []) {
        if (estRenvoi(enfant)) {
          const r: Renvoi = { type: "renvoi", id: identite(enfant.id), cible: scene(enfant.cible), children: [{ text: "" }] };
          const l = libelle(enfant.libelle);
          if (l) r.libelle = l;
          children.push(r, { text: "" });
          renvois += 1;
        } else {
          const l = lettres(enfant);
          if (l) (children[children.length - 1] as Lettres).text += l.text;
        }
      }
      compte += children.reduce((n, e) => n + ("text" in e ? e.text.length : 0), 0);
      // Pas de phrase de choix sans renvoi : ce qu'il en reste est du récit (F05.2)
      if (renvois === 0) texte.push({ type: "p", id: identite(bloc.id), children: [{ text: (children[0] as Lettres).text }] });
      else texte.push({ type: "choix", id: identite(bloc.id), libelle: libelle(bloc.libelle), children });
    } else return null;
  }
  // Les liaisons cachées sont hors du récit : toujours à la fin du texte
  return compte > LETTRES_MAX ? null : [...texte, ...liaisons];
}

/** Le récit d'un texte, et ses liaisons cachées, que la copie tient à part (F05.1). */
export const recitDe = (texte: Texte): Exclude<Bloc, Liaison>[] => texte.filter((b): b is Exclude<Bloc, Liaison> => b.type !== "liaison");
export const liaisonsDe = (texte: Texte): Liaison[] => texte.filter(estLiaison);

/** Les mots d'un bloc, sans mise en forme ni numéro : pour une phrase automatique, son libellé. */
export const lettresDe = (bloc: Bloc): string =>
  estAuto(bloc) ? bloc.libelle : bloc.type === "liaison" ? "" : (bloc.children as (Lettres | Renvoi)[]).map((e) => ("text" in e ? e.text : "")).join("");

/** Le texte d'une scène en mots seuls, un paragraphe par ligne. */
export const enMots = (texte: Texte): string => recitDe(texte).map(lettresDe).join("\n");

/**
 * Une scène sans mot, sans choix ni image (F07.1) : « Texte vide ». Une note de l'enseignant
 * n'est pas du texte de la scène (F05-AC51), une liaison cachée non plus. La base tient la
 * même règle.
 */
export const estVide = (texte: Texte): boolean =>
  texte.every((b) => b.type === "note" || b.type === "liaison" || ((b.type === "p" || b.type === "action") && lettresDe(b).trim() === ""));

/** Les renvois d'un bloc : celui d'une phrase automatique, ou ceux d'une phrase personnalisée. */
export function renvoisDe(bloc: Bloc): { id: string; cible: string | null; libelle: string }[] {
  if (bloc.type !== "choix") return [];
  if (estAuto(bloc)) return [{ id: bloc.id, cible: bloc.cible, libelle: bloc.libelle }];
  return bloc.children.filter(estRenvoi).map((r) => ({ id: r.id, cible: r.cible, libelle: r.libelle || bloc.libelle }));
}

/** Toutes les destinations d'un texte, dans l'ordre. */
export const ciblesDe = (texte: Texte): string[] =>
  texte.flatMap((b) => (b.type === "liaison" ? (b.cible ? [b.cible] : []) : renvoisDe(b).flatMap((r) => (r.cible ? [r.cible] : []))));

/** Ce qu'affiche un renvoi : le numéro de sa destination, ou un vide visible comme tel. */
export const NUMERO_VIDE = "…";

/**
 * Une phrase de choix en morceaux : du texte, et pour chaque renvoi sa destination. Une
 * seule fonction la compose pour l'éditeur, la lecture, le presse-papiers et, plus tard, le
 * livre : le même contenu partout (F05-AC09).
 */
export type Morceau = { texte: string } | { renvoi: string; cible: string | null };
export function morceauxDe(bloc: Choix, formule: FormuleRenvoi): Morceau[] {
  if (!estAuto(bloc)) return bloc.children.map((e) => ("text" in e ? { texte: e.text } : { renvoi: e.id, cible: e.cible }));
  const MARQUE = "\u0001";
  const [avant, apres = ""] = phraseDeChoix(bloc.libelle || "…", MARQUE, formule, bloc.construction).split(MARQUE);
  return [{ texte: avant }, { renvoi: bloc.id, cible: bloc.cible }, { texte: apres }];
}

/** La phrase en texte simple, avec les numéros affichés : ce qui sort vers un autre logiciel (F05.2). */
export const phraseEnMots = (bloc: Choix, formule: FormuleRenvoi, numero: (cible: string | null) => string): string =>
  morceauxDe(bloc, formule).map((m) => ("texte" in m ? m.texte : numero(m.cible))).join("");

/** Une construction tirée parmi celles qui servent, à la création d'un choix, puis gardée (F05-AC11). */
export const tirerConstruction = (utiles: Construction[], tirage: () => number = Math.random): Construction =>
  utiles[Math.floor(tirage() * utiles.length)] ?? "neutre";

export { CONSTRUCTIONS };

/**
 * Ce qu'une personne a le droit de changer dans le texte d'une scène (F06.1). Le contrôle
 * se fait sur le serveur, en comparant le texte enregistré à celui que la page envoie : un
 * navigateur contourné n'y change rien (F05-AC32, F06-AC13).
 */
export type Droits =
  | { role: "adulte" }
  | {
      role: "eleve";
      profil: "propositions" | "organisation";
      /** Les scènes du chapitre où l'élève écrit : un choix qui en sort est un raccord, réservé à l'enseignant */
      scenesDuChapitre: ReadonlySet<string>;
    };

/** Ce bloc est-il réservé à l'adulte pour cette personne ? Elle écrit autour, sans y toucher. */
export function estReserve(bloc: Bloc, droits: Droits): boolean {
  if (droits.role === "adulte") return false;
  // Liaison cachée et note sont à l'adulte seul ; un paragraphe protégé vaut pour tous les élèves (F06-AC50)
  if (bloc.type === "liaison" || bloc.type === "note") return true;
  if (bloc.type === "p") return bloc.protege === true;
  // Action de jeu : préparée d'office pour « écriture et propositions » ; protégée par l'enseignant, pour tous (F04-AC25)
  if (bloc.type === "action") return droits.profil === "propositions" || bloc.protege === true;
  // Profil « écriture et propositions » : toute phrase de choix est préparée (F06-AC45)
  if (droits.profil === "propositions") return true;
  // Profil « écriture et organisation » : la phrase qui porte un raccord reste entière (F06-AC52)
  return renvoisDe(bloc).some((r) => r.cible !== null && !droits.scenesDuChapitre.has(r.cible));
}

/**
 * Compare le texte enregistré à celui que la page envoie. Rend la raison du refus, ou rien
 * si tout est permis : les blocs réservés sont tous là, inchangés, dans le même ordre, et
 * aucun n'a été ajouté.
 */
export function controlerTexte(avant: Texte, apres: Texte, droits: Droits): string | null {
  if (droits.role === "adulte") return null;
  const reservesAvant = avant.filter((b) => estReserve(b, droits));
  const reservesApres = apres.filter((b) => estReserve(b, droits));
  if (reservesApres.length > reservesAvant.length) return "Un bloc réservé à l’enseignant a été ajouté.";
  if (reservesApres.length < reservesAvant.length) return "Un bloc préparé a été supprimé.";
  for (let i = 0; i < reservesAvant.length; i += 1) {
    if (!memeTexte(reservesAvant[i], reservesApres[i])) return "Un bloc préparé a été modifié ou déplacé.";
  }
  return null;
}

/** Deux textes de même contenu, quel que soit l'ordre de leurs propriétés. */
export function memeTexte(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => memeTexte(x, b[i]));
  if (estObjet(a) && estObjet(b)) {
    const cles = Object.keys(a);
    return cles.length === Object.keys(b).length && cles.every((k) => k in b && memeTexte(a[k], b[k]));
  }
  return false;
}

/** Ce que rend un enregistrement (F08.1, F08.2). */
export type Motif = "conflit" | "scene" | "supprimee" | "acces" | "arrete" | "controle";
export type Enregistrement =
  /** Le texte est celui de la scène */
  | { etat: "enregistre"; version: number; dernier?: boolean }
  /** Refusé : ce qui n'était pas enregistré est gardé à part sur la scène */
  | { etat: "garde"; motif: Motif; version?: number; dernier?: boolean }
  /** Refusé sans rien à garder : la page n'a plus le droit d'écrire ici */
  | { etat: "refuse"; motif?: Motif; version?: number; dernier?: boolean }
  /** L'accès s'est fermé et le dernier enregistrement a déjà été reçu */
  | { etat: "ferme" };

/**
 * Collage venu d'ailleurs (F04-AC04, AC05, AC35, AC36) : le texte, ses paragraphes et, si
 * elles sont permises, les trois mises en forme. Polices, tailles et couleurs ne sont pas
 * reprises ; tableau, liste, titre et lien deviennent des paragraphes ; une image est écartée.
 */
export type Collage = { paragraphes: Lettres[][]; imagesEcartees: number };

const BLOCS_HTML = new Set([
  "P", "DIV", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "TD", "TH", "TR", "BLOCKQUOTE", "PRE", "SECTION", "ARTICLE", "HEADER",
  "FOOTER", "UL", "OL", "TABLE", "TBODY", "THEAD", "DT", "DD", "FIGURE", "FIGCAPTION", "ADDRESS", "CAPTION",
]);
const IGNORES_HTML = new Set(["SCRIPT", "STYLE", "META", "LINK", "TITLE", "HEAD", "NOSCRIPT", "TEMPLATE", "SVG", "IFRAME", "OBJECT", "VIDEO", "AUDIO", "CANVAS", "BUTTON", "INPUT", "SELECT", "TEXTAREA"]);

type NoeudHtml = {
  nodeType: number; nodeName: string; textContent: string | null; childNodes: ArrayLike<NoeudHtml>;
  getAttribute?: (nom: string) => string | null;
};

function marquesDe(nom: string, styleBrut: string, herite: Marques): Marques {
  const m: Marques = { ...herite };
  const style = styleBrut.toLowerCase();
  const propriete = (cle: string): string | null => new RegExp(`(?:^|;)\\s*${cle}\\s*:\\s*([^;]+)`).exec(style)?.[1].trim() ?? null;
  if (nom === "B" || nom === "STRONG") m.bold = true;
  if (nom === "I" || nom === "EM") m.italic = true;
  if (nom === "U" || nom === "INS") m.underline = true;
  // Google Docs enveloppe tout dans un <b> qui n'est pas gras, et écrit le gras en style
  const graisse = propriete("font-weight");
  if (graisse) {
    if (graisse === "bold" || graisse === "bolder" || Number(graisse) >= 600) m.bold = true;
    else delete m.bold;
  }
  const penche = propriete("font-style");
  if (penche) {
    if (penche.startsWith("italic") || penche.startsWith("oblique")) m.italic = true;
    else delete m.italic;
  }
  const trait = propriete("text-decoration") ?? propriete("text-decoration-line");
  if (trait) {
    if (trait.includes("underline")) m.underline = true;
    else if (trait.includes("none")) delete m.underline;
  }
  return m;
}

/** Lit un collage en HTML. `marques` : les trois mises en forme sont-elles permises ici ? */
export function lireCollage(racine: NoeudHtml, marques: boolean): Collage {
  const paragraphes: Lettres[][] = [];
  let courant: Lettres[] = [];
  let imagesEcartees = 0;
  const clore = () => {
    // Les espaces du balisage, en début et en fin de paragraphe, ne sont pas du texte
    while (courant.length && courant[0].text.trimStart() === "") courant.shift();
    while (courant.length && courant[courant.length - 1].text.trimEnd() === "") courant.pop();
    if (courant.length) {
      courant[0] = { ...courant[0], text: courant[0].text.trimStart() };
      const fin = courant.length - 1;
      courant[fin] = { ...courant[fin], text: courant[fin].text.trimEnd() };
      paragraphes.push(courant);
    }
    courant = [];
  };
  const ajouter = (text: string, m: Marques) => {
    if (!text) return;
    const l: Lettres = marques ? { text, ...m } : { text };
    const avant = courant[courant.length - 1];
    if (avant && memesMarques(avant, l)) avant.text += l.text;
    else courant.push(l);
  };
  const parcourir = (noeud: NoeudHtml, herite: Marques, brut: boolean) => {
    if (noeud.nodeType === 3) {
      const texte = noeud.textContent ?? "";
      if (brut) {
        const lignes = texte.split(/\r?\n/);
        lignes.forEach((ligneBrute, i) => {
          if (i > 0) clore();
          ajouter(ligneBrute, herite);
        });
      } else ajouter(texte.replace(/[\s ]*[\r\n\t]+[\s]*/g, " ").replace(/ {2,}/g, " "), herite);
      return;
    }
    if (noeud.nodeType !== 1) return;
    const nom = noeud.nodeName.toUpperCase();
    if (IGNORES_HTML.has(nom)) return;
    if (nom === "IMG" || nom === "PICTURE") {
      imagesEcartees += 1;
      return;
    }
    if (nom === "BR") return clore();
    const bloc = BLOCS_HTML.has(nom);
    if (bloc) clore();
    const m = marquesDe(nom, noeud.getAttribute?.("style") ?? "", herite);
    for (const enfant of Array.from(noeud.childNodes)) parcourir(enfant, m, brut || nom === "PRE");
    if (bloc) clore();
  };
  parcourir(racine, {}, false);
  clore();
  return { paragraphes, imagesEcartees };
}

/** Un collage en texte simple : une ligne, un paragraphe ; les lignes vides ne comptent pas. */
export const lireTexteSimple = (texte: string): Lettres[][] =>
  texte
    .split(/\r?\n/)
    .map((l) => l.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ""))
    .filter((l) => l.trim() !== "")
    .map((l) => [{ text: l }]);
