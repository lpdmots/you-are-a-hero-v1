// Captures des trois directions, bureau (1440) et téléphone (390) : node sources/capturer.mjs
// Playwright est pris dans l'application (V1/app/node_modules).
import { chromium } from "../../../app/node_modules/playwright/index.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pages = [["a", "guide-a-article.html"], ["b", "guide-b-livre-jeu.html"], ["c", "guide-c-aere.html"], ["a2", "guide-a2.html"]];
const vues = [["haut", null], ["commencer", "#commencer"], ["combien", "#combien"], ["objets", "#objets"], ["chemins", "#chemins"], ["temps", "#temps"], ["erreurs", "#erreurs"], ["fin", "END"]];
const seules = process.argv.slice(2);
const b = await chromium.launch();
for (const [l, h, s] of [[1440, 900, 1], [390, 844, 2]]) {
  for (const [d, f] of pages) {
    if (seules.length && !seules.includes(d)) continue;
    const p = await b.newPage({ viewport: { width: l, height: h }, deviceScaleFactor: s });
    await p.goto("file://" + path.join(racine, f), { waitUntil: "networkidle" });
    await p.evaluate(() => document.fonts.ready);
    await p.addStyleTag({ content: "html{scroll-behavior:auto!important}.maquette-etiquette{display:none}" });
    for (const [nom, cible] of vues) {
      await p.evaluate((c) => {
        if (!c) window.scrollTo(0, 0);
        else if (c === "END") window.scrollTo(0, document.body.scrollHeight);
        else document.querySelector(c).scrollIntoView();
      }, cible);
      await p.waitForTimeout(350);
      await p.screenshot({ path: path.join(racine, "captures", `${d}-${l}-${nom}.png`) });
    }
    const largeur = await p.evaluate(() => document.documentElement.scrollWidth);
    console.log(d, l, "hauteur", await p.evaluate(() => document.body.scrollHeight), largeur > l ? "DÉBORDE " + largeur : "");
    await p.close();
  }
}
await b.close();
