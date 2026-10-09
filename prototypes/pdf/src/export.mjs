// Production d'un PDF : Chromium charge la page d'aperçu en mode « rendu »,
// Paged.js y calcule les pages, puis Chromium imprime. Durée et mémoire sont
// mesurées, pas supposées. Essai jetable.
import { execFileSync } from 'node:child_process';
import { statSync, readFileSync, writeFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { GEOMETRIE } from './composer.mjs';
import { chromium } from '@playwright/test';

/** Mémoire résidente (Mo) des processus descendants de ce processus Node. */
function memoireDescendants() {
  const lignes = execFileSync('ps', ['-axo', 'pid=,ppid=,rss='], { encoding: 'utf8' }).trim().split('\n');
  const enfants = new Map();
  const rss = new Map();
  for (const l of lignes) {
    const [pid, ppid, r] = l.trim().split(/\s+/).map(Number);
    rss.set(pid, r);
    enfants.set(ppid, [...(enfants.get(ppid) ?? []), pid]);
  }
  let total = 0;
  const file = [...(enfants.get(process.pid) ?? [])];
  while (file.length) {
    const p = file.pop();
    total += rss.get(p) ?? 0;
    file.push(...(enfants.get(p) ?? []));
  }
  return total / 1024;
}

/**
 * Chromium arrondit la page au pixel : 420 × 594,96 points au lieu de
 * 419,53 × 595,28 (148 × 210 mm). On rétablit la boîte exacte, ancrée en haut
 * à gauche : le contenu ne bouge pas.
 */
async function ajusterPages(chemin) {
  const PT = 72 / 25.4;
  const doc = await PDFDocument.load(readFileSync(chemin));
  const l = GEOMETRIE.largeur * PT;
  const h = GEOMETRIE.hauteur * PT;
  for (const page of doc.getPages()) {
    const { height } = page.getSize();
    page.setMediaBox(0, height - h, l, h);
    page.setCropBox(0, height - h, l, h);
  }
  writeFileSync(chemin, await doc.save());
}

export async function produirePdf({ base, livre = 'essai', instantane, marques, sortie, cesure = true }) {
  const t0 = performance.now();
  let picChromium = 0;
  let picNode = 0;
  const sonde = setInterval(() => {
    try {
      picChromium = Math.max(picChromium, memoireDescendants());
      picNode = Math.max(picNode, process.memoryUsage().rss / 1048576);
    } catch {}
  }, 200);
  const navigateur = await chromium.launch();
  try {
    const page = await navigateur.newPage();
    const tLance = performance.now();
    const erreurs = [];
    page.on('pageerror', (e) => erreurs.push(String(e)));
    const params = new URLSearchParams({ rendu: '1', livre, marques: marques ? '1' : '0', cesure: cesure ? '1' : '0' });
    if (instantane) params.set('instantane', instantane);
    await page.goto(`${base}/?${params}`);
    await page.waitForFunction(() => window.__etat === 'pret' || window.__etat === 'erreur', null, { timeout: 600_000 });
    const rapport = await page.evaluate(() => window.__rapport);
    if (!rapport || erreurs.length) throw new Error(`Mise en page échouée : ${erreurs.join(' ; ') || 'rapport absent'}`);
    const tMisEnPage = performance.now();
    await page.pdf({ path: sortie, preferCSSPageSize: true, printBackground: true });
    const tImprime = performance.now();
    writeFileSync(sortie.replace(/\.pdf$/, '.carte.json'), JSON.stringify(rapport.carte));
    await ajusterPages(sortie);
    const tFin = performance.now();
    picChromium = Math.max(picChromium, memoireDescendants());
    return {
      pages: rapport.pages,
      pagesHorsPagination: rapport.pagesHorsPagination,
      ajustementsNonAppliques: rapport.ajustementsNonAppliques,
      debordements: rapport.debordements,
      blocsDansLaCarte: rapport.carte.length,
      durees: {
        lancementChromium: Math.round(tLance - t0),
        miseEnPage: Math.round(tMisEnPage - tLance),
        miseEnPagePagedjs: Math.round(rapport.dureeMiseEnPage),
        impression: Math.round(tImprime - tMisEnPage),
        ajustementDesPages: Math.round(tFin - tImprime),
        total: Math.round(tFin - t0),
      },
      memoire: { picChromiumMo: Math.round(picChromium), picNodeMo: Math.round(picNode) },
      tailleOctets: statSync(sortie).size,
    };
  } finally {
    clearInterval(sonde);
    await navigateur.close();
  }
}
