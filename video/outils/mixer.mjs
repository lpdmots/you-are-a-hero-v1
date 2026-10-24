#!/usr/bin/env node
// La bande-son : la voix de chaque passage à sa place, la musique qui s'abaisse sous la voix,
// les bruitages posés par les passages (window.BRUITAGES), puis un volume final normalisé.
// Lit les temps dans la composition servie par le studio (port 4850), écrit son/bande-son.mp3.
//   node outils/mixer.mjs [--musique 0.3]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PROJET = process.env.VIDEO || "visite";
const VISITE = path.resolve(ICI, "..", PROJET);
const FFMPEG = path.join(process.env.HOME, "Projets/hyperframes-shorts/.tools/bin/ffmpeg");
const args = process.argv.slice(2);
const volMusique = Number(args.includes("--musique") ? args[args.indexOf("--musique") + 1] : 0.22);

const require = createRequire(path.join(process.env.HOME, "Projets/you-are-a-hero/V1/app/package.json"));
const { chromium } = require("playwright");
const navigateur = await chromium.launch();
const page = await navigateur.newPage();
await page.goto(`http://localhost:4850/api/projects/${PROJET}/preview/comp/index.html`);
await page.waitForFunction(() => window.__playerReady === true, null, { timeout: 30000 });
const { voix, bruits } = await page.evaluate(() => ({ voix: window.VOIX, bruits: window.BRUITAGES }));
await navigateur.close();

const entrees = [];
const filtres = [];
const ms = (t) => Math.max(0, Math.round(t * 1000));
// Les voix
const voixFichiers = Object.values(voix.passages).filter((p) => p.voix);
voixFichiers.forEach((p, i) => {
  entrees.push("-i", path.join(VISITE, p.voix));
  // coupée après le dernier mot, avec un court fondu : pas de bruit de fin de prise
  filtres.push(`[${i}:a]aresample=44100,aformat=channel_layouts=stereo,atrim=0:${p.voixDuree.toFixed(3)},afade=t=out:st=${Math.max(0, p.voixDuree - 0.15).toFixed(3)}:d=0.15,adelay=${ms(p.debut + p.avant)}|${ms(p.debut + p.avant)}[v${i}]`);
});
filtres.push(`${voixFichiers.map((_, i) => `[v${i}]`).join("")}amix=inputs=${voixFichiers.length}:normalize=0,apad=whole_dur=${voix.duree}[voix]`);
filtres.push(`[voix]asplit=2[voixmix][voixcle]`);
// La musique, abaissée sous la voix
const iM = voixFichiers.length;
entrees.push("-i", path.join(VISITE, "son/musique.mp3"));
filtres.push(`[${iM}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${volMusique},afade=t=in:d=1.2,apad=whole_dur=${voix.duree}[mus]`);
filtres.push(`[mus][voixcle]sidechaincompress=threshold=0.02:ratio=5:attack=60:release=700:makeup=1[musbas]`);
// Les bruitages
const sons = [...new Set(bruits.map((b) => b.son))];
const iB = {};
sons.forEach((s, k) => {
  iB[s] = iM + 1 + k;
  entrees.push("-i", path.join(VISITE, `son/bruits/${s}.mp3`));
});
const parSon = {};
bruits.forEach((b) => (parSon[b.son] = (parSon[b.son] || 0) + 1));
const decoupe = {};
sons.forEach((s) => {
  filtres.push(`[${iB[s]}:a]aresample=44100,aformat=channel_layouts=stereo,asplit=${parSon[s]}${Array.from({ length: parSon[s] }, (_, k) => `[${s}${k}]`).join("")}`);
  decoupe[s] = 0;
});
const etiquettes = bruits.map((b, k) => {
  const n = decoupe[b.son]++;
  filtres.push(`[${b.son}${n}]volume=${(b.vol * 0.3).toFixed(3)},adelay=${ms(b.t)}|${ms(b.t)}[b${k}]`);
  return `[b${k}]`;
});
filtres.push(`${etiquettes.join("")}amix=inputs=${etiquettes.length}:normalize=0,apad=whole_dur=${voix.duree}[bruits]`);
filtres.push(`[voixmix][musbas][bruits]amix=inputs=3:normalize=0,atrim=0:${voix.duree},afade=t=out:st=${(voix.duree - 1.2).toFixed(2)}:d=1.2,loudnorm=I=-16:TP=-1.5:LRA=11[sortie]`);

const sortie = path.join(VISITE, "son/bande-son.mp3");
execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", ...entrees, "-filter_complex", filtres.join(";"), "-map", "[sortie]", "-ar", "44100", "-b:a", "192k", sortie], { stdio: "inherit" });
console.log(`bande-son : ${voix.duree.toFixed(1)} s, ${voixFichiers.length} voix, ${bruits.length} bruitages → ${path.relative(process.cwd(), sortie)}`);
