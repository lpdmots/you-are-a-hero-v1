// Compose le PDF d'un document à imprimer, avec le Chromium de Playwright (celui de l'application).
//   node ressources/composer.mjs <nom> [dossier des images de contrôle]
// Écrit app/public/ressources/<nom>.pdf, que le site sert tel quel (page « Ressources », F14), et <nom>.jpg, la
// vignette de la première feuille ; si la page a des réponses à cacher (commun/a-completer.js), aussi
// <nom>-a-completer.pdf ; pour chaque <meta name="tirage" content="x" data-adresse="…"> de la page, aussi
// <nom>-x.pdf, tiré de la même source ouverte avec ces paramètres. Avec un second argument, une image par page et par version, en couleur et en
// gris (ce que donnera la photocopie), pour relire la mise en page.
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const ici = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = createRequire(path.join(ici, "../app/package.json"))("playwright");

const [nom, controle] = process.argv.slice(2);
if (!nom) {
  console.error("Usage : node ressources/composer.mjs <nom du document> [dossier des images de contrôle]");
  process.exit(1);
}
const source = pathToFileURL(path.join(ici, nom, `${nom}.html`)).href;
// Une seule copie des PDF dans Git : celle que le site sert
const sortie = path.join(ici, "../app/public/ressources");
fs.mkdirSync(sortie, { recursive: true });

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });

/** Ouvre une version et attend qu'elle soit prête : polices chargées, réponses remplacées s'il le faut. */
async function ouvrir(adresse) {
  await page.goto(adresse);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => !document.querySelector('script[src$="a-completer.js"]') || document.documentElement.dataset.pret === "1");
}

await ouvrir(source);
const versions = [{ suffixe: "", adresse: source }];
if (await page.locator(".rep, [data-lignes]").count()) versions.push({ suffixe: "-a-completer", adresse: `${source}?a-completer` });
// Les autres tirages que la page annonce (une feuille à part, à imprimer en recto verso…)
for (const { nom: tirage, adresse } of await page.locator('meta[name="tirage"]').evaluateAll((metas) => metas.map((m) => ({ nom: m.content, adresse: m.dataset.adresse })))) {
  versions.push({ suffixe: `-${tirage}`, adresse: `${source}?${adresse}` });
}

for (const { suffixe, adresse } of versions) {
  await ouvrir(adresse);
  // Toujours la feuille de style d'impression : en mode écran, chaque feuille garde ses marges grises
  // d'aperçu et déborde sur une seconde page
  await page.emulateMedia({ media: "print" });
  const pdf = path.join(sortie, `${nom}${suffixe}.pdf`);
  await page.pdf({ path: pdf, format: "A4", printBackground: true, preferCSSPageSize: true });
  const attendues = await page.locator(".page").count();
  const pages = (fs.readFileSync(pdf, "latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`PDF : ${pdf} (${pages} pages)`);
  if (pages !== attendues) console.warn(`  ${pages} pages au lieu de ${attendues} : une feuille déborde`);
  // La vignette de la page « Ressources » : la première feuille de la version complète, assez fine pour une carte
  // de 260 points en double densité, en JPEG (le site la sert sans l'optimisation d'images de Vercel)
  if (suffixe === "") {
    const petite = await navigateur.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 0.7 });
    await petite.goto(adresse);
    await petite.evaluate(() => document.fonts.ready);
    await petite.waitForFunction(() => !document.querySelector('script[src$="a-completer.js"]') || document.documentElement.dataset.pret === "1");
    await petite.emulateMedia({ media: "print" });
    await petite.locator(".page").first().screenshot({ path: path.join(sortie, `${nom}.jpg`), type: "jpeg", quality: 80 });
    await petite.close();
  }
  if (!controle) continue;
  fs.mkdirSync(controle, { recursive: true });
  await page.emulateMedia({ media: "print" });
  const feuilles = await page.locator(".page").all();
  for (const [i, feuille] of feuilles.entries()) {
    // Ce qui dépasse d'une feuille est coupé à l'impression : le dire
    const deborde = await feuille.evaluate((f) => f.scrollHeight - f.clientHeight);
    if (deborde > 1) console.warn(`${nom}${suffixe}, page ${i + 1} : le contenu dépasse de ${deborde} px`);
    await feuille.screenshot({ path: path.join(controle, `${nom}${suffixe}-${i + 1}.png`) });
  }
  await page.addStyleTag({ content: "html { filter: grayscale(1) contrast(1.15); }" });
  for (const [i, feuille] of feuilles.entries()) await feuille.screenshot({ path: path.join(controle, `${nom}${suffixe}-${i + 1}-gris.png`) });
  await page.emulateMedia({ media: "screen" });
}
if (controle) console.log(`Images de contrôle : ${controle}`);
await navigateur.close();
