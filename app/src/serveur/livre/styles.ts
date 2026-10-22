import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CORPS, PAGE, type ReglagesDuLivre } from "@/domaine/mise-en-page";

/**
 * Les feuilles de style du livre composé. Deux feuilles, parce que Paged.js retire les
 * déclarations `break-*` des feuilles qu'il lit : celle qu'il lit porte les pages et les sauts
 * forcés ; l'autre, lue par Chromium seul, porte la typographie et les règles de coupure
 * (F11.3), que Chromium tient lui-même en remplissant chaque page.
 */

const RACINE = process.cwd();
export const DOSSIER_PAGEDJS = join(RACINE, "node_modules", "pagedjs", "dist");
const POLICES = {
  vollkorn: { dossier: join(RACINE, "node_modules", "@fontsource", "vollkorn"), graisses: ["400", "400-italic", "600", "600-italic", "700", "700-italic"] },
  atkinson: { dossier: join(RACINE, "node_modules", "@fontsource", "atkinson-hyperlegible-next"), graisses: ["400", "600", "700"] },
  // Andika, la police des premiers lecteurs, au choix pour le livre (F11.3)
  andika: { dossier: join(RACINE, "node_modules", "@fontsource", "andika"), graisses: ["400", "400-italic", "700", "700-italic"] },
} as const;
export type NomPolice = keyof typeof POLICES;

/** Le fichier d'une police, servi à la page du serveur ; rien pour un nom inconnu. */
export async function fichierDePolice(police: string, fichier: string): Promise<Buffer | null> {
  if (!(police in POLICES) || !/^[a-z0-9-]+\.woff2$/.test(fichier)) return null;
  try {
    return await readFile(join(POLICES[police as NomPolice].dossier, "files", fichier));
  } catch {
    return null;
  }
}

let policesCss: Promise<string> | null = null;
/** Les @font-face des polices embarquées : alphabet latin et latin étendu, aucune police du système. */
export function feuilleDesPolices(): Promise<string> {
  policesCss ??= (async () => {
    const morceaux: string[] = [];
    for (const [nom, { dossier, graisses }] of Object.entries(POLICES)) {
      for (const g of graisses) {
        for (const jeu of ["latin", "latin-ext"]) {
          const css = await readFile(join(dossier, `${jeu}-${g}.css`), "utf8");
          // Seul le woff2 est servi ; Chromium le lit
          morceaux.push(css.replace(/url\(\.\/files\/([^)]+)\.woff2\) format\('woff2'\), url\([^)]+\) format\('woff'\)/g, `url(/polices/${nom}/$1.woff2) format('woff2')`).replace(/font-display: swap;/g, "font-display: block;"));
        }
      }
    }
    return morceaux.join("\n");
  })();
  return policesCss;
}

const mm = (n: number) => `${n}mm`;

/** La feuille que lit Paged.js : la page A5 en vis-à-vis, ses marges alternées, et les sauts forcés. */
export function feuilleDesPages(r: ReglagesDuLivre): string {
  const { haut, bas, exterieur, interieur } = r.marges;
  return `
@page { size: ${PAGE.largeur}mm ${PAGE.hauteur}mm; margin: ${mm(haut)} ${mm(exterieur)} ${mm(bas)} ${mm(interieur)}; }
@page :right { margin-left: ${mm(interieur)}; margin-right: ${mm(exterieur)}; }
@page :left { margin-left: ${mm(exterieur)}; margin-right: ${mm(interieur)}; }
@page :blank { margin: ${mm(haut)} ${mm(exterieur)} ${mm(bas)} ${mm(interieur)}; }
/* Le livre commence sur une page de droite, après la page récapitulative du PDF de travail ; le récit aussi, après les pages de présentation (F11.4) */
.presentation, .recit { break-before: right; }
.pres { break-after: page; }
.pres--apres-le-recit { break-before: page; }
.nouvelle-page { break-before: page; }
figure.image.page { break-before: page; break-after: page; }
/* Une image pleine page en tête de passage : sa page porte aussi le numéro (F10-AC36) */
.page-image--coupe { break-before: page; }
.page-image { break-after: page; }
`;
}

/** La hauteur utile d'une page : celle d'une image pleine page (F10). */
export const hauteurUtile = (r: ReglagesDuLivre) => PAGE.hauteur - r.marges.haut - r.marges.bas;

/** La feuille que lit Chromium seul : typographie du livre et règles de coupure (F11.3). */
export function feuilleDuDocument(r: ReglagesDuLivre): string {
  const police = r.police === "andika" ? "'Andika', 'Vollkorn', serif" : "'Vollkorn', serif";
  return `
:root { --corps: ${CORPS[r.taille]}pt; --hauteur-utile: ${hauteurUtile(r) - 1}mm; }
html, body { margin: 0; padding: 0; background: #fff; }
body { font-family: ${police}; font-size: var(--corps); line-height: 1.36; color: #161616; font-variant-numeric: lining-nums; hyphens: manual; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pagedjs_sheet { position: relative; }

/* ——— Le récit ——— */
.recit p { margin: 0; }
.recit p.r { text-align: ${r.alignement === "justifie" ? "justify" : "left"}; widows: 2; orphans: 2; }
.recit p.r + p.r { text-indent: 1.2em; }
.recit h1.partie { font-size: 1.75em; line-height: 1.2; font-weight: 600; text-align: center; margin: 0 0 1em; break-after: avoid; break-inside: avoid; }
.recit h1.partie.nouvelle-page { padding-top: 22mm; }
.recit h2.chapitre { font-size: 1.32em; line-height: 1.25; font-weight: 600; text-align: center; margin: 1.6em 0 1.1em; break-after: avoid; break-inside: avoid; }
.recit h2.chapitre.nouvelle-page { margin-top: 18mm; }
.chapitre__rang { display: block; font-size: 0.62em; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 1.5mm; }
.recit h2.numero { font-size: 1.32em; line-height: 1.2; font-weight: 600; text-align: center; margin: 1.15em 0 0.45em; break-after: avoid; break-inside: avoid; }
.recit h1.partie + h2.numero { margin-top: 0; }
.debut-scene { display: block; height: 0; break-after: avoid; }
.separateur { text-align: center; margin: 0.9em 0; line-height: 0; break-inside: avoid; break-after: avoid; }
svg.filet { width: 24mm; height: 2mm; fill: none; stroke: #2a2a2a; stroke-width: 1; }
svg.filet path:last-child { fill: #2a2a2a; stroke: none; }

/* Choix, action et fin : chaque phrase entière, mais séparables du texte qui les amène et
   répartis sur deux pages, pour remplir la page (F11.2, révisé le 22 octobre 2026) */
.choix-groupe { margin: 0.7em 0 0.2em; }
.recit p.choix { text-align: left; font-style: italic; padding-left: 1.1em; text-indent: -1.1em; margin: 0 0 0.3em; break-inside: avoid; }
.recit p.choix::before { content: "— "; font-style: normal; }
.recit p.choix b.renvoi { font-style: normal; font-weight: 700; }
.recit p.action { display: flex; gap: 2.2mm; align-items: baseline; text-align: left; margin: 0.8em 0; padding: 1.6mm 2.6mm; border: 0.25mm solid #262626; border-radius: 1.6mm; font-size: 0.96em; break-inside: avoid; }
svg.signe { flex: none; width: 1.05em; height: 1.05em; position: relative; top: 0.16em; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.recit p.fin { text-align: center; margin: 1em 0 0.6em; font-variant: small-caps; letter-spacing: 0.08em; break-inside: avoid; }
.recit p.fin::before, .recit p.fin::after { content: ""; display: inline-block; width: 8mm; border-top: 0.2mm solid currentColor; vertical-align: middle; margin: 0 2.6mm; }

/* Images : là où l'auteur les a posées, jamais coupées (F10) */
figure.image { margin: 0.9em auto; break-inside: avoid; }
figure.image img { display: block; width: 100%; height: auto; }
figure.image figcaption { font-style: italic; font-size: 0.84em; line-height: 1.3; text-align: center; margin-top: 1.4mm; }
figure.image.page { margin: 0 auto; height: var(--hauteur-utile); display: flex; flex-direction: column; justify-content: center; align-items: center; }
figure.image.page img { width: auto; max-width: 100%; height: auto; max-height: calc(100% - 9mm); object-fit: contain; }
figure.image.page:not(:has(figcaption)) img { max-height: 100%; }
.page-image { height: var(--hauteur-utile); display: flex; flex-direction: column; break-inside: avoid; }
.page-image h2.numero, .page-image h1.partie, .page-image h2.chapitre { margin-top: 0; flex: none; }
.page-image h1.partie.nouvelle-page { padding-top: 0; }
figure.image.en-tete { flex: 1 1 auto; min-height: 0; margin: 2mm auto 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
figure.image.en-tete img { width: auto; max-width: 100%; height: auto; max-height: calc(100% - 9mm); object-fit: contain; }
figure.image.en-tete:not(:has(figcaption)) img { max-height: 100%; }
img.symbole { height: 1em; width: auto; vertical-align: -0.15em; }
figure.introuvable .manque, .recit p.vide { display: flex; align-items: center; justify-content: center; aspect-ratio: 4 / 3; border: 0.3mm dashed #a5432e; color: #a5432e; font: 600 8.5pt 'Atkinson Hyperlegible Next', sans-serif; }
.recit p.vide { aspect-ratio: auto; padding: 5mm; border-color: #8a8a8a; color: #6b6b6b; }
.introuvable-ligne { font: 600 0.7em 'Atkinson Hyperlegible Next', sans-serif; color: #a5432e; }

/* ——— Pages de présentation (F11.4) ——— */
.pres { min-height: 0; }
.pres p { margin: 0 0 0.7em; text-align: ${r.alignement === "justifie" ? "justify" : "left"}; }
.pres__titre { font-size: 1.5em; line-height: 1.2; font-weight: 600; text-align: center; margin: 0 0 1em; }
.pres__sous-titre-section { font-size: 1.1em; font-weight: 600; margin: 1.2em 0 0.5em; }
.pres--titre { height: var(--hauteur-utile); display: flex; flex-direction: column; align-items: center; justify-content: space-between; text-align: center; }
.pres__haut { padding-top: 18mm; display: grid; justify-items: center; gap: 4mm; }
.pres__livre { font-size: 2.2em; line-height: 1.12; font-weight: 600; margin: 0; }
.pres__sous-titre { font-style: italic; font-size: 1.1em; margin: 0 !important; text-align: center !important; }
/* L'illustration prend la place que laissent le titre et la ligne, la moitié de la page au plus : la page reste une seule page (F11-AC106) */
.pres__illustration { flex: 0 1 auto; min-height: 0; max-height: 50%; margin: 6mm 0; display: flex; justify-content: center; align-items: center; }
.pres__illustration img { display: block; width: auto; height: auto; max-width: 100%; max-height: 100%; min-height: 0; object-fit: contain; }
.pres__bas { display: grid; gap: 1.5mm; padding-bottom: 6mm; }
.pres__ligne, .pres__annee { margin: 0 !important; text-align: center !important; }
.pres__annee { font-size: 0.9em; letter-spacing: 0.06em; }
.pres--auteurs { padding-top: 14mm; }
.pres__noms { list-style: none; margin: 0 auto 1.4em; padding: 0; text-align: center; line-height: 1.55; }
.pres__noms--2 { columns: 2; column-gap: 8mm; }
.pres__noms--3 { columns: 3; column-gap: 6mm; }
.pres__noms li { break-inside: avoid; }
.pres__conclusion { text-align: center !important; font-style: italic; }
.pres--fin { height: var(--hauteur-utile); display: flex; flex-direction: column; justify-content: center; text-align: center; }
.pres--fin p { text-align: center; }
.pres--image .image.page { height: var(--hauteur-utile); }

/* La feuille d'aventure : ses listes et ses notes remplissent la page (F04.2, 15 octobre 2026) */
.pres--feuille { display: grid; gap: 5mm; align-content: start; }
.pres--feuille .pres__titre { margin-bottom: 1mm; }
.pres--une-page { height: var(--hauteur-utile); display: flex; flex-direction: column; gap: 5mm; }
.feuille__section { break-inside: avoid; display: flex; flex-direction: column; }
.feuille__titre { font-size: 1em; font-weight: 600; margin: 0 0 2mm; padding-bottom: 1mm; border-bottom: 0.25mm solid #262626; }
.feuille__section ul { list-style: none; margin: 0; padding: 0; }
.feuille__section li { display: flex; align-items: center; gap: 3mm; height: 8mm; border-bottom: 0.15mm solid #9a9a9a; }
.feuille__nom { flex: 1; }
.feuille__depart { font-size: 0.8em; color: #4a4a4a; }
.feuille__case { width: 22mm; height: 6mm; border: 0.25mm solid #262626; border-radius: 1mm; }
.feuille__lignes { display: flex; flex-direction: column; overflow: hidden; }
.feuille__lignes span { flex: none; height: 8mm; box-sizing: border-box; border-bottom: 0.25mm solid #8f8f8f; }
.feuille__cadre { min-height: 40mm; height: 64mm; border: 0.25mm solid #262626; border-radius: 1.6mm; }
.pres--une-page .feuille__section--remplit { flex: 1 1 0; min-height: 51mm; }
.pres--une-page .feuille__lignes, .pres--une-page .feuille__cadre { flex: 1 1 auto; height: auto; }

/* Les dés imprimés en bas des pages de droite du récit (F11.4) */
.des-imprimes { position: absolute; display: flex; gap: 1.6mm; }
.des-imprimes svg { width: 6.5mm; height: 6.5mm; fill: none; stroke: #222; stroke-width: 1.5; }
.des-imprimes circle { fill: #222; stroke: none; }

/* ——— Page récapitulative du PDF de travail (F11.2) ——— */
.recap { font-family: 'Atkinson Hyperlegible Next', sans-serif; font-size: 8.6pt; line-height: 1.35; color: #222; }
.recap__mention { font-size: 7pt; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #555; margin: 0 0 4mm; }
.recap__titre { font-family: 'Vollkorn', serif; font-size: 17pt; font-weight: 600; margin: 0 0 3mm; }
.recap__finir, .recap__rien { margin: 0 0 3mm; }
.recap__gravite { font-size: 9pt; font-weight: 700; margin: 4mm 0 1.5mm; }
.recap__gravite--bloque { color: #a5432e; }
.recap__gravite--avert { color: #8a5a00; }
.recap__gravite--info { color: #555; }
.recap ul { list-style: none; margin: 0; padding: 0; }
.recap li { display: flex; gap: 2mm; padding: 0.8mm 0; border-bottom: 0.15mm solid #ddd; break-inside: avoid; }
.recap__ou { flex: none; width: 21mm; font-variant-numeric: tabular-nums; }
.recap__page { flex: none; width: 10mm; color: #555; }

/* ——— Ce que la page du serveur pose après la mise en page, hors du fil du texte ——— */
.entete, .folio { position: absolute; font-family: ${police}; color: #2a2a2a; white-space: nowrap; }
/* Un repère, pas du texte : plus petit et gris, pour qu'on ne le lise pas avec le récit */
.entete { font-size: 7.6pt; letter-spacing: 0.06em; color: #7a7a7a; }
.folio { font-size: 9pt; }
.marque { position: absolute; font-family: 'Atkinson Hyperlegible Next', sans-serif; font-size: 6.4pt; line-height: 1.15; color: #5a5a5a; }
.marque.mention { font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; font-size: 5.8pt; }
.marque.signal { width: 12.5mm; font-weight: 600; }
.marque.signal--bloque { color: #a5432e; }
.marque.signal--avert { color: #8a5a00; }
.marque.signal--info { color: #5a5a5a; font-weight: 400; }
`;
}
