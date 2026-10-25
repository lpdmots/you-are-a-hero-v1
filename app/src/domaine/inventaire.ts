/**
 * L'inventaire du lecteur en ligne (F04.2, révisé le 25 octobre 2026 à la demande du porteur).
 *
 * Une action de jeu qui nomme un objet de la liste de l'histoire porte, à la lecture, de quoi
 * le noter d'un geste dans l'inventaire, ou l'en rayer : « Ajoute la corde à ton inventaire. »
 * propose « Corde ». Seuls les objets que le texte vient de nommer sont proposés, jamais la liste
 * entière, qui dévoilerait les objets à venir (F04-AC20). Rien n'est vérifié : l'action ne fait
 * que proposer, le lecteur décide. Une action sans verbe qui donne ou retire (« Si tu as la
 * corde… ») ne propose rien.
 *
 * La reconnaissance se fait à la lecture, sur la liste du moment : la version partagée et le PDF
 * n'en gardent rien, et leurs empreintes ne changent pas.
 */

import type { BlocLu, EtatFeuille, LivreLu, MotLu } from "./lecture";
import type { VersionPartagee } from "./partage";
import type { Feuille } from "./preparation";

export type GesteDInventaire = "noter" | "rayer";
/** Ce qu'une action propose : l'objet tel qu'il s'inscrit dans l'inventaire, et le geste. */
export type ObjetANoter = { nom: string; geste: GesteDInventaire };

/** Minuscules, sans accents, une seule sorte d'apostrophe, des espaces simples. */
const normal = (s: string): string =>
  s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/[’ʼ`]/g, "'").replace(/\s+/g, " ").trim();

const ARTICLE = /^(?:l['’ʼ]\s*|(?:le|la|les|un|une|des|du|de la|de l['’ʼ])\s+)/i;

/** « la clé d’argent » → « Clé d’argent » : le nom sans son article, tel qu'il s'écrit dans l'inventaire. */
export function nomDInventaire(nom: string): string {
  const sans = nom.trim().replace(ARTICLE, "").trim() || nom.trim();
  return sans.charAt(0).toLocaleUpperCase("fr-FR") + sans.slice(1);
}

const cle = (nom: string): string => normal(nomDInventaire(nom));

const NOTER = /^(?:ajoute[rsz]?|note[rsz]?|inscri[sr]e?|ecri[sr]e?|prend[sre]*|ramasse[rsz]?|gagne[rsz]?|recoi[st]|recevoir|recupere[rsz]?|garde[rsz]?|met[st]?|mettre|emporte[rsz]?|obtien[st]|obtenir|trouve[rsz]?)$/;
const RAYER = /^(?:raye[rsz]?|barre[rsz]?|efface[rsz]?|retire[rsz]?|enleve[rsz]?|enlever|perd[sre]*|jette[rsz]?|jeter|abandonne[rsz]?|donne[rsz]?|depense[rsz]?|lache[rsz]?)$/;

/** Les verbes dont le sens s'inverse quand ils s'adressent au lecteur (« te donne », « te prend ») */
const INVERSES = /^(?:donne[rsz]?|prend[sre]*)$/;

const motsDe = (mots: MotLu[]): string => mots.map((m) => ("text" in m ? m.text : " ")).join("");

/**
 * Les objets de la liste qu'une action nomme, chacun avec le geste du verbe le plus proche dans
 * sa phrase (avant lui d'abord). Le nom le plus long l'emporte : « la clé d'argent » plutôt que
 * « la clé ». Un objet sans verbe qui donne ou retire n'est pas proposé.
 */
export function objetsDeLAction(texte: string, objets: readonly string[]): ObjetANoter[] {
  const t = normal(texte);
  const pris: [number, number][] = [];
  const trouves: { debut: number; nom: string }[] = [];
  const candidats = [...new Set(objets.map((o) => o.trim()).filter(Boolean))].sort((a, b) => cle(b).length - cle(a).length);
  for (const objet of candidats) {
    const k = cle(objet);
    if (k.length < 2) continue;
    const motif = new RegExp(`(?:^|[^\\p{L}\\p{N}])(${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?=$|[^\\p{L}\\p{N}])`, "gu");
    for (const m of t.matchAll(motif)) {
      const debut = m.index + m[0].length - m[1].length;
      const fin = debut + m[1].length;
      if (pris.some(([a, b]) => debut < b && fin > a)) continue;
      pris.push([debut, fin]);
      trouves.push({ debut, nom: nomDInventaire(objet) });
    }
  }
  const verbes = [...t.matchAll(/[\p{L}]+/gu)].flatMap((m) => {
    let geste: GesteDInventaire | null = NOTER.test(m[0]) ? "noter" : RAYER.test(m[0]) ? "rayer" : null;
    // « On te donne la corde » la donne au lecteur ; « le garde te prend la corde » la lui ôte
    if (geste && INVERSES.test(m[0]) && /(?:^|[^\p{L}])(?:te|t'|vous)\s*$/u.test(t.slice(0, m.index))) geste = geste === "noter" ? "rayer" : "noter";
    return geste ? [{ position: m.index, geste }] : [];
  });
  const phrase = (i: number): number => t.slice(0, i).split(/[.!?;:]/).length;
  const resultat: ObjetANoter[] = [];
  for (const o of trouves.sort((a, b) => a.debut - b.debut)) {
    const memes = verbes.filter((v) => phrase(v.position) === phrase(o.debut));
    const avant = memes.filter((v) => v.position < o.debut).at(-1);
    const geste = (avant ?? memes.find((v) => v.position > o.debut))?.geste;
    if (geste && !resultat.some((r) => cle(r.nom) === cle(o.nom))) resultat.push({ nom: o.nom, geste });
  }
  return resultat;
}

/** Les blocs, leurs actions munies des objets qu'elles nomment. */
export function blocsAvecObjets(blocs: BlocLu[], objets: readonly string[]): BlocLu[] {
  if (!objets.length) return blocs;
  return blocs.map((b) => {
    if (b.type !== "action") return b;
    const trouves = objetsDeLAction(motsDe(b.mots), objets);
    return trouves.length ? { ...b, objets: trouves } : b;
  });
}

export const livreAvecObjets = (livre: LivreLu, objets: readonly string[]): LivreLu =>
  objets.length ? { ...livre, passages: Object.fromEntries(Object.entries(livre.passages).map(([id, p]) => [id, { ...p, blocs: blocsAvecObjets(p.blocs, objets) }])) } : livre;

export const versionAvecObjets = (v: VersionPartagee, objets: readonly string[]): VersionPartagee =>
  objets.length && v.feuille ? { ...v, passages: v.passages.map((p) => ({ ...p, blocs: blocsAvecObjets(p.blocs, objets) })) } : v;

// ——— La liste de la feuille où se notent les objets ———

/** La liste qui reçoit les objets : celle qui s'appelle inventaire, sac, objets…, sinon la première. */
export function listeDesObjets(feuille: Feuille | null): string | null {
  const listes = (feuille?.sections ?? []).filter((s) => s.type === "liste");
  return (listes.find((s) => /inventaire|sac|objet|equipement|besace|poche/.test(normal(s.titre))) ?? listes[0])?.id ?? null;
}

/** Les lignes écrites d'une liste, sans les vides que laissaient les anciennes lignes à remplir. */
export const lignesEcrites = (lignes: readonly string[] | undefined): string[] => (lignes ?? []).map((l) => l.trim()).filter(Boolean);

export const dansLaListe = (lignes: readonly string[] | undefined, nom: string): boolean => lignesEcrites(lignes).some((l) => cle(l) === cle(nom));

/** Une ligne de plus (40 au plus, 80 signes chacune) ; un nom déjà écrit ne se répète pas. */
export function ajouterALaListe(etat: EtatFeuille, liste: string, nom: string): EtatFeuille {
  const n = nom.replace(/\s+/g, " ").trim().slice(0, 80);
  const lignes = lignesEcrites(etat.listes[liste]);
  if (!n || lignes.length >= 40 || dansLaListe(lignes, n)) return etat;
  return { ...etat, listes: { ...etat.listes, [liste]: [...lignes, n] } };
}

/** Rayer un nom de la liste, quelle que soit la façon dont le lecteur l'a écrit. */
export function rayerDeLaListe(etat: EtatFeuille, liste: string, nom: string): EtatFeuille {
  return { ...etat, listes: { ...etat.listes, [liste]: lignesEcrites(etat.listes[liste]).filter((l) => cle(l) !== cle(nom)) } };
}

/** Le geste d'une action, ou son retour : noté, le nom se raye ; absent, il se note. */
export const basculerDansLaListe = (etat: EtatFeuille, liste: string, nom: string): EtatFeuille =>
  dansLaListe(etat.listes[liste], nom) ? rayerDeLaListe(etat, liste, nom) : ajouterALaListe(etat, liste, nom);
