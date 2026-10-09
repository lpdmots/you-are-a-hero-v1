// Relecture d'un PDF produit : dimensions, lignes de texte de chaque page,
// images posées et polices incorporées. Sert aux tests ; rien ici ne produit
// le PDF.
import { readFileSync } from 'node:fs';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { PDFDocument, PDFName, PDFDict, PDFRawStream, PDFStream } from 'pdf-lib';
import { GEOMETRIE } from '../src/composer.mjs';

const PT = 72 / 25.4;
export const mm = (pt) => pt / PT;

/** Même normalisation pour l'aperçu et le PDF : ni espaces, ni traits d'union, ligatures défaites. */
export const normaliser = (s) =>
  s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s  ­‐‑-]/g, '')
    .replace(/[’']/g, "'");

const multiplier = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];

/**
 * @param {string} chemin
 * @param {{decalage?: number}} options decalage : nombre de pages hors pagination en tête (PDF de travail)
 */
export async function lirePdf(chemin, { decalage = 0, images = false } = {}) {
  const tache = getDocument({ data: new Uint8Array(readFileSync(chemin)), verbosity: 0 });
  const doc = await tache.promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const [x0, y0, x1, y1] = page.view;
    const contenu = await page.getTextContent();
    const elements = contenu.items.filter((e) => e.str && e.str.trim()).map((e) => ({ texte: e.str, x: e.transform[4], y: e.transform[5] - y0, taille: e.height, largeur: e.width }));
    // Zone de texte : dépend du côté de la page. La première page du livre est une page de droite.
    const folio = i - decalage;
    const droite = folio % 2 === 1;
    const gauche = (droite ? GEOMETRIE.interieur : GEOMETRIE.exterieur) * PT;
    const zone = { gauche, droite: gauche + (GEOMETRIE.largeur - GEOMETRIE.interieur - GEOMETRIE.exterieur) * PT, bas: GEOMETRIE.bas * PT, haut: (GEOMETRIE.hauteur - GEOMETRIE.haut) * PT };
    // Texte du livre : dans la zone de texte, et plus grand que les marques de travail (6,5 pt au plus).
    const corps = elements.filter((e) => e.taille >= 8 && e.x >= zone.gauche - 3 && e.x <= zone.droite + 3 && e.y >= zone.bas - 3 && e.y <= zone.haut + 3);
    const lignes = [];
    for (const e of [...corps].sort((a, b) => b.y - a.y || a.x - b.x)) {
      const l = lignes.find((l) => Math.abs(l.y - e.y) < 2.5);
      if (l) l.elements.push(e);
      else lignes.push({ y: e.y, elements: [e] });
    }
    const pageLue = {
      numero: i,
      folio,
      largeur: x1 - x0,
      hauteur: y1 - y0,
      zone,
      elements,
      lignes: lignes.map((l) => {
        const tries = l.elements.sort((a, b) => a.x - b.x);
        return { y: l.y, x: tries[0].x, fin: Math.max(...tries.map((e) => e.x + e.largeur)), texte: tries.map((e) => e.texte).join('') };
      }),
    };
    if (images) {
      // Images posées : largeur et hauteur imprimées, d'après la matrice courante.
      const ops = await page.getOperatorList();
      let m = [1, 0, 0, 1, 0, 0];
      const pile = [];
      pageLue.images = [];
      ops.fnArray.forEach((fn, k) => {
        if (fn === OPS.save) pile.push(m);
        else if (fn === OPS.restore) m = pile.pop() ?? m;
        else if (fn === OPS.transform) m = multiplier(m, ops.argsArray[k]);
        else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageXObjectRepeat) {
          // Boîte de l'image : le carré unité transformé par la matrice courante.
          const coins = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v]) => [m[0] * u + m[2] * v + m[4], m[1] * u + m[3] * v + m[5] - y0]);
          const xs = coins.map((c) => c[0]);
          const ys = coins.map((c) => c[1]);
          pageLue.images.push({ x: Math.min(...xs), y: Math.min(...ys), largeur: Math.max(...xs) - Math.min(...xs), hauteur: Math.max(...ys) - Math.min(...ys) });
        }
      });
    }
    pages.push(pageLue);
  }
  await tache.destroy();
  return pages;
}

/** Polices du fichier : nom, et présence du programme de police dans le PDF. */
export async function policesDuPdf(chemin) {
  const doc = await PDFDocument.load(readFileSync(chemin));
  const polices = [];
  for (const [, objet] of doc.context.enumerateIndirectObjects()) {
    const dict = objet instanceof PDFDict ? objet : objet instanceof PDFRawStream || objet instanceof PDFStream ? objet.dict : null;
    if (!dict) continue;
    const type = dict.get(PDFName.of('Type'));
    if (type !== PDFName.of('Font')) continue;
    const sousType = String(dict.get(PDFName.of('Subtype')));
    const nom = String(dict.get(PDFName.of('BaseFont')) ?? dict.get(PDFName.of('Name')) ?? '?');
    if (sousType === '/Type0') continue; // police composite : c'est sa police descendante qui porte le fichier
    let incorporee = sousType === '/Type3'; // glyphes dessinés dans le PDF lui-même
    const descripteur = dict.lookup(PDFName.of('FontDescriptor'));
    if (descripteur instanceof PDFDict) incorporee = ['FontFile', 'FontFile2', 'FontFile3'].some((c) => descripteur.has(PDFName.of(c)));
    polices.push({ nom, sousType, incorporee });
  }
  return polices;
}
