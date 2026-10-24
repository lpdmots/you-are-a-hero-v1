#!/usr/bin/env node
// Appels ElevenLabs de la vidéo de l'accueil. La clé est lue dans le .env de hyperframes-shorts,
// jamais affichée ni copiée. Usage :
//   node eleven.mjs voix [fr]                         — voix du compte, puis de la bibliothèque (langue)
//   node eleven.mjs dire <voice_id> <texte|fichier.txt> <sortie.mp3> [modele] [vitesse]
//       écrit aussi <sortie>.alignement.json (temps par caractère)
//   node eleven.mjs musique <prompt|fichier.txt> <duree_s> <sortie.mp3>
//   node eleven.mjs bruit <description> <duree_s> <sortie.mp3>
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ENV = path.join(os.homedir(), "Projets/hyperframes-shorts/.env");
function lireEnv() {
  const valeurs = {};
  for (const ligne of fs.readFileSync(ENV, "utf8").split(/\r?\n/)) {
    const l = ligne.trim();
    if (!l || l.startsWith("#") || l.indexOf("=") < 1) continue;
    const i = l.indexOf("=");
    valeurs[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return valeurs;
}
const env = lireEnv();
const CLE = env.ELEVENLABS_API_KEY;
if (!CLE) throw new Error("ELEVENLABS_API_KEY absente");
const API = "https://api.elevenlabs.io";

async function appel(chemin, options = {}) {
  const r = await fetch(API + chemin, { ...options, headers: { "xi-api-key": CLE, "content-type": "application/json", ...(options.headers || {}) } });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status} ${chemin} : ${(await r.text()).slice(0, 400)}`);
  return r;
}
const texteDe = (x) => (x.endsWith(".txt") && fs.existsSync(x) ? fs.readFileSync(x, "utf8").trim() : x);

const [commande, ...args] = process.argv.slice(2);

if (commande === "voix") {
  const langue = args[0] || "fr";
  try {
    const mien = await (await appel("/v1/voices")).json();
    console.log("— Voix du compte");
    for (const v of mien.voices) console.log(`${v.voice_id}  ${v.name}  [${v.category}]  ${JSON.stringify(v.labels || {})}`);
  } catch (e) {
    console.log("(voix du compte illisibles : " + e.message.slice(0, 120) + ")");
  }
  const lib = await (await appel(`/v1/shared-voices?page_size=60&language=${langue}&sort=usage_character_count_7d`)).json();
  console.log(`— Bibliothèque (${langue})`);
  for (const v of lib.voices) console.log(`${v.voice_id}  ${v.name}  ${v.gender}/${v.age}  ${v.accent}  ${v.use_case}  ${(v.description || "").slice(0, 90).replace(/\s+/g, " ")}`);
} else if (commande === "dire") {
  const [voix, source, sortie, modele = "eleven_multilingual_v2", vitesse] = args;
  const corps = {
    text: texteDe(source),
    model_id: modele,
    language_code: "fr",
    voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true, ...(vitesse ? { speed: Number(vitesse) } : {}) },
  };
  if (modele.includes("v3")) corps.voice_settings = { stability: 0.5, ...(vitesse ? { speed: Number(vitesse) } : {}) };
  const r = await appel(`/v1/text-to-speech/${voix}/with-timestamps?output_format=mp3_44100_128`, { method: "POST", body: JSON.stringify(corps) });
  const json = await r.json();
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  fs.writeFileSync(sortie, Buffer.from(json.audio_base64, "base64"));
  fs.writeFileSync(sortie.replace(/\.mp3$/, ".alignement.json"), JSON.stringify(json.alignment));
  console.log("écrit", sortie);
} else if (commande === "musique") {
  const [source, duree, sortie] = args;
  const r = await appel(`/v1/music?output_format=mp3_44100_128`, {
    method: "POST",
    body: JSON.stringify({ prompt: texteDe(source), music_length_ms: Math.round(Number(duree) * 1000), model_id: "music_v1" }),
  });
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  fs.writeFileSync(sortie, Buffer.from(await r.arrayBuffer()));
  console.log("écrit", sortie);
} else if (commande === "bruit") {
  const [texte, duree, sortie] = args;
  const r = await appel(`/v1/sound-generation?output_format=mp3_44100_128`, {
    method: "POST",
    body: JSON.stringify({ text: texte, duration_seconds: Number(duree), prompt_influence: 0.6 }),
  });
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  fs.writeFileSync(sortie, Buffer.from(await r.arrayBuffer()));
  console.log("écrit", sortie);
} else {
  console.log("commandes : voix | dire | musique | bruit");
}
