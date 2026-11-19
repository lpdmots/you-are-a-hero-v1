#!/usr/bin/env node
// Une prise fournie par le porteur (faite par lui chez ElevenLabs) prend la place de la voix d'un
// passage : la transcription d'ElevenLabs donne le temps de chaque mot, posé sur les mots du texte
// du passage (texte.json), qui doivent être les mêmes, dans le même ordre.
//
//   VIDEO=<dossier> node outils/transcrire.mjs <passage> <fichier.mp3>
//
// Copie la prise dans voix/fournies/<passage>.mp3, écrit voix/fournies/<passage>.json et met
// "fournie": true au passage dans texte.json. Si le texte du passage change ensuite, preparer.mjs
// s'arrête : refaire la prise, ou retirer "fournie".
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lireCle } from "./cle.mjs";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const VIDEO = path.resolve(ICI, "..", process.env.VIDEO || "visite");
const [id, source] = process.argv.slice(2);
if (!id || !source) throw new Error("VIDEO=<dossier> node outils/transcrire.mjs <passage> <fichier.mp3>");

const fichierTexte = path.join(VIDEO, "texte.json");
const texte = JSON.parse(fs.readFileSync(fichierTexte, "utf8"));
const p = texte.passages.find((x) => x.id === id);
if (!p) throw new Error(`passage inconnu : ${id}`);

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const motsDuTexte = p.texte.replace(/<[^>]*>/g, " ").split(/\s+/).filter((m) => norm(m));

const fd = new FormData();
fd.append("file", new Blob([fs.readFileSync(source)], { type: "audio/mpeg" }), "prise.mp3");
fd.append("model_id", "scribe_v1");
fd.append("language_code", "fr");
fd.append("timestamps_granularity", "word");
const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": lireCle() }, body: fd });
if (!r.ok) throw new Error(`ElevenLabs ${r.status} : ${(await r.text()).slice(0, 300)}`);
const entendus = (await r.json()).words.filter((w) => w.type === "word" && norm(w.text));

// Les mots du texte posés sur les mots entendus, lettre à lettre : « l'affiche » entendu
// « la fiche » se dit pareil et se recale quand même ; un écart trop grand arrête tout
const joindre = (liste) => {
  let s = "";
  const de = [];
  liste.forEach((m, i) => { for (const c of norm(m)) { s += c; de.push(i); } });
  return { s, de };
};
const A = joindre(motsDuTexte), B = joindre(entendus.map((w) => w.text));
// distance d'édition, puis le chemin : à chaque lettre du texte, la lettre entendue en face
const n = A.s.length, k = B.s.length;
const D = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: k + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
for (let i = 1; i <= n; i++)
  for (let j = 1; j <= k; j++) D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + (A.s[i - 1] === B.s[j - 1] ? 0 : 1));
if (D[n][k] > Math.max(4, n * 0.08)) {
  console.error("entendu :", entendus.map((w) => w.text).join(" "));
  console.error("texte   :", motsDuTexte.join(" "));
  throw new Error(`la prise ne dit pas le texte du passage (${D[n][k]} lettres d'écart) : accorder le texte`);
}
const enFace = new Array(n);
for (let i = n, j = k; i > 0; ) {
  if (j > 0 && D[i][j] === D[i - 1][j - 1] + (A.s[i - 1] === B.s[j - 1] ? 0 : 1)) enFace[--i] = --j;
  else if (j > 0 && D[i][j] === D[i][j - 1] + 1) j--;
  else enFace[--i] = Math.max(0, j - 1);
}
const mots = motsDuTexte.map((m, w) => {
  const lettres = enFace.filter((_, i) => A.de[i] === w);
  const premier = entendus[B.de[lettres[0]]], dernier = entendus[B.de[lettres.at(-1)]];
  if (premier !== dernier || norm(premier.text) !== norm(m)) console.warn(`  « ${m} » entendu « ${entendus.slice(B.de[lettres[0]], B.de[lettres.at(-1)] + 1).map((x) => x.text).join(" ")} »`);
  return { m, t: premier.start, f: dernier.end };
});

const dossier = path.join(VIDEO, "voix", "fournies");
fs.mkdirSync(dossier, { recursive: true });
// le nom du fichier porte son contenu : une nouvelle prise a une autre adresse, et le studio ne
// joue pas l'ancienne gardée dans le cache du navigateur
const contenu = crypto.createHash("sha1").update(fs.readFileSync(source)).digest("hex").slice(0, 8);
for (const f of fs.readdirSync(dossier)) if (new RegExp(`^${id}(-[0-9a-f]{8})?\\.mp3$`).test(f)) fs.rmSync(path.join(dossier, f));
const fichier = `${id}-${contenu}.mp3`;
fs.copyFileSync(source, path.join(dossier, fichier));
const empreinte = crypto.createHash("sha1").update(p.texte).digest("hex");
fs.writeFileSync(path.join(dossier, `${id}.json`), JSON.stringify({ empreinte, fichier, mots }, null, 1));
p.fournie = true;
fs.writeFileSync(fichierTexte, JSON.stringify(texte, null, 2) + "\n");
console.log(`${id} : prise fournie posée, ${mots.length} mots`);
