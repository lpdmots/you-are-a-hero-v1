#!/usr/bin/env node
// Images de contrôle : la composition servie par le studio (port 4850), arrêtée aux instants
// demandés, puis une planche qui les rassemble.
//   node outils/images.mjs <dossier> 1.5 3 4.2 ...        instants en secondes
//   node outils/images.mjs <dossier> p07:0.5 p07:fin-1     instants dans un passage
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.join(process.env.HOME, "Projets/you-are-a-hero/V1/app/package.json"));
const { chromium } = require("playwright");

const [dossier, ...instants] = process.argv.slice(2);
fs.mkdirSync(dossier, { recursive: true });
const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://localhost:4850/api/projects/${process.env.VIDEO || "visite"}/preview/comp/index.html`);
await page.waitForFunction(() => window.__playerReady === true, null, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
const plan = await page.evaluate(() => window.VOIX);

const fichiers = [];
for (const brut of instants) {
  let t = Number(brut);
  if (brut.includes(":")) {
    const [id, rel] = brut.split(":");
    const p = plan.passages[id];
    t = p.debut + (rel.startsWith("fin") ? p.duree + Number(rel.slice(3) || 0) : Number(rel));
  }
  await page.evaluate(async (t) => {
    window.__player.seek(t);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, t);
  await page.waitForTimeout(120);
  const nom = `t${t.toFixed(2).padStart(6, "0")}.png`;
  await page.screenshot({ path: path.join(dossier, nom) });
  fichiers.push({ nom, t, brut });
}

// La planche : quatre images par ligne
const html = `<!doctype html><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${Math.min(4, fichiers.length)},480px);gap:6px;padding:6px;font:14px system-ui;color:#eee">${fichiers
  .map((f) => `<figure style="margin:0"><img src="file://${path.resolve(dossier, f.nom)}" style="width:480px;display:block"><figcaption>${f.brut} · ${f.t.toFixed(2)} s</figcaption></figure>`)
  .join("")}</body>`;
const planche = path.join(dossier, "planche.html");
fs.writeFileSync(planche, html);
const p2 = await navigateur.newPage({ viewport: { width: 6 + Math.min(4, fichiers.length) * 486, height: 300 } });
await p2.goto("file://" + path.resolve(planche));
await p2.screenshot({ path: path.join(dossier, "planche.png"), fullPage: true });
await navigateur.close();
console.log(path.join(dossier, "planche.png"));
