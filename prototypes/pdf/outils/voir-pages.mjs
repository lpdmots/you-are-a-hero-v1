// Captures d'écran de pages de l'aperçu, pour regarder la composition sans
// ouvrir le PDF.   node outils/voir-pages.mjs 1 2 37   → sorties/captures/
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { demarrer } from '../serveur.mjs';

const SORTIE = join(dirname(fileURLToPath(import.meta.url)), '..', 'sorties', 'captures');
mkdirSync(SORTIE, { recursive: true });
const options = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const numeros = process.argv.slice(2).filter((a) => !a.startsWith('--')).map(Number);
const { adresse, fermer } = await demarrer({ port: 0 });
const navigateur = await chromium.launch();
const page = await navigateur.newPage({ deviceScaleFactor: Number(options.echelle ?? 1.5), viewport: { width: 1200, height: 900 } });
await page.goto(`${adresse}/?rendu=1&livre=${options.livre ?? 'essai'}&marques=${options.marques ?? '1'}`);
await page.waitForFunction(() => window.__etat === 'pret' || window.__etat === 'erreur');
console.log(JSON.stringify(await page.evaluate(() => ({ etat: window.__etat, erreur: window.__erreur, pages: window.__rapport?.pages, aj: window.__rapport?.ajustementsNonAppliques, deb: window.__rapport?.debordements }))));
for (const n of numeros) {
  const el = page.locator('.pagedjs_page').nth(n - 1);
  await el.screenshot({ path: join(SORTIE, `page-${String(n).padStart(3, '0')}.png`) });
}
await navigateur.close();
await fermer();
