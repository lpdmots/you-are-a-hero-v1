#!/usr/bin/env node
// Prépare la vidéo à partir de texte.json : la voix de chaque passage (ElevenLabs, gardée en
// cache tant que son texte et sa voix ne changent pas), le temps de chaque mot, la durée de chaque
// passage, les sous-titres WebVTT et index.html (depuis gabarit.html).
//
//   node outils/preparer.mjs --estimation            sans voix : temps des mots estimés
//   node outils/preparer.mjs --voix <voice_id> [--modele eleven_multilingual_v2] [--vitesse 1]
//
// Les animations de chaque passage se posent sur les mots (window.mot dans commun.js) : changer
// de voix recale tout sans toucher aux compositions.
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ICI = path.dirname(fileURLToPath(import.meta.url));
// La vidéo travaillée : un dossier de V1/video (VIDEO=autre-video pour une autre que la visite)
const VISITE = path.resolve(ICI, "..", process.env.VIDEO || "visite");
const FFPROBE = path.join(process.env.HOME, "Projets/hyperframes-shorts/.tools/bin/ffprobe");
const args = process.argv.slice(2);
const opt = (nom, defaut) => (args.includes(nom) ? args[args.indexOf(nom) + 1] : defaut);
const estimation = args.includes("--estimation");
const voix = opt("--voix");
const modele = opt("--modele", "eleven_multilingual_v2");
const vitesse = opt("--vitesse");
if (!estimation && !voix) throw new Error("--estimation ou --voix <voice_id>");

const { passages } = JSON.parse(fs.readFileSync(path.join(VISITE, "texte.json"), "utf8"));
fs.mkdirSync(path.join(VISITE, "voix"), { recursive: true });
fs.mkdirSync(path.join(VISITE, "donnees"), { recursive: true });

const duree = (f) => Number(execFileSync(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], { encoding: "utf8" }).trim());

/** Mots et leurs temps, depuis l'alignement par caractère d'ElevenLabs */
function motsDepuisAlignement(al) {
  const mots = [];
  let courant = null;
  let balise = false; // les pauses <break time="…" /> ne sont pas des mots
  al.characters.forEach((c, i) => {
    if (c === "<") balise = true;
    if (balise) {
      if (c === ">") balise = false;
      return;
    }
    if (/\s/.test(c)) {
      if (courant) mots.push(courant), (courant = null);
      return;
    }
    if (!courant) courant = { m: "", t: al.character_start_times_seconds[i], f: 0 };
    courant.m += c;
    courant.f = al.character_end_times_seconds[i];
  });
  if (courant) mots.push(courant);
  return mots;
}

/** Sans voix : 2,45 mots par seconde, des pauses après la ponctuation */
const sansBalises = (t) => t?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
function motsEstimes(texte) {
  let t = 0;
  return sansBalises(texte).split(/\s+/).map((m) => {
    const d = 0.12 + m.length * 0.05;
    const mot = { m, t, f: t + d };
    t += d + (/[.?!…]$/.test(m) ? 0.55 : /[,:;]$/.test(m) ? 0.22 : 0.04);
    return mot;
  });
}

async function dire(p, i, graine) {
  // Une « prise » : une variante du même texte, tirée avec une graine, que le porteur choisit à
  // l'écoute (texte.json : "prise": n) ; sans prise, la génération ordinaire, gardée en cache
  const sortie = graine
    ? path.join(VISITE, "voix", voix, "prises", `${p.id}-${graine}.mp3`)
    : p.prise
      ? path.join(VISITE, "voix", voix, "prises", `${p.id}-${p.prise}.mp3`)
      : path.join(VISITE, "voix", voix, `${p.id}.mp3`);
  fs.mkdirSync(path.dirname(sortie), { recursive: true });
  const cache = sortie.replace(/\.mp3$/, ".json");
  graine ??= p.prise;
  const empreinte = crypto.createHash("sha1").update(JSON.stringify(graine ? [p.texte, voix, modele, vitesse, graine] : [p.texte, voix, modele, vitesse])).digest("hex");
  if (fs.existsSync(cache) && fs.existsSync(sortie)) {
    const c = JSON.parse(fs.readFileSync(cache, "utf8"));
    if (c.empreinte === empreinte) return c.alignement;
  }
  const { lireCle } = await import("./cle.mjs");
  const corps = {
    text: p.texte,
    model_id: modele,
    language_code: "fr",
    previous_text: sansBalises(passages[i - 1]?.texte),
    next_text: sansBalises(passages[i + 1]?.texte),
    voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true, ...(vitesse ? { speed: Number(vitesse) } : {}) },
    ...(graine ? { seed: Number(graine) * 7919 } : {}),
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voix}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": lireCle(), "content-type": "application/json" },
    body: JSON.stringify(corps),
  });
  if (!r.ok) throw new Error(`ElevenLabs ${r.status} : ${(await r.text()).slice(0, 300)}`);
  const json = await r.json();
  fs.writeFileSync(sortie, Buffer.from(json.audio_base64, "base64"));
  fs.writeFileSync(cache, JSON.stringify({ empreinte, alignement: json.alignment }));
  console.log("voix générée :", p.id, graine ? `(prise ${graine})` : "");
  return json.alignment;
}

// --prises 3 --passages p18,p34 : des variantes à écouter, sans rien recomposer
if (opt("--prises")) {
  const ids = opt("--passages").split(",");
  for (const [i, p] of passages.entries()) {
    if (!ids.includes(p.id)) continue;
    for (let k = 1; k <= Number(opt("--prises")); k++) await dire(p, i, k);
  }
  process.exit(0);
}

const plan = {};
let debut = 0;
for (const [i, p] of passages.entries()) {
  let mots, voixDuree, fichier = null;
  if (estimation) {
    mots = motsEstimes(p.texte);
    voixDuree = mots.at(-1).f + 0.15;
  } else {
    mots = motsDepuisAlignement(await dire(p, i));
    fichier = p.prise ? `voix/${voix}/prises/${p.id}-${p.prise}.mp3` : `voix/${voix}/${p.id}.mp3`;
    // la voix s'arrête 0,3 s après son dernier mot : ce qui suit (souffle, bruit de fin) est coupé au mixage
    voixDuree = Math.min(duree(path.join(VISITE, fichier)), mots.at(-1).f + 0.3);
  }
  const total = +(p.avant + Math.max(voixDuree, mots.at(-1).f) + p.apres).toFixed(3);
  plan[p.id] = {
    debut: +debut.toFixed(3),
    duree: total,
    avant: p.avant,
    voix: fichier,
    voixDuree: +voixDuree.toFixed(3),
    mots: mots.map((m) => ({ m: m.m, t: +(m.t + p.avant).toFixed(3), f: +(m.f + p.avant).toFixed(3) })),
  };
  debut += total;
}
const DUREE = +debut.toFixed(3);

fs.writeFileSync(
  path.join(VISITE, "donnees", "voix.js"),
  `// Écrit par outils/preparer.mjs (${estimation ? "temps estimés" : `voix ${voix}, ${modele}`}) — ne pas modifier\nwindow.VOIX = ${JSON.stringify({ duree: DUREE, passages: plan })};\n`,
);

// Sous-titres : une ligne par proposition, coupée à la ponctuation, 84 caractères au plus
const hms = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = (s % 60).toFixed(3).padStart(6, "0");
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${sec}`;
};
const cues = [];
for (const p of Object.values(plan)) {
  let groupe = [];
  const pousser = () => {
    if (!groupe.length) return;
    cues.push({ t: p.debut + groupe[0].t, f: p.debut + groupe.at(-1).f + 0.25, texte: groupe.map((m) => m.m).join(" ") });
    groupe = [];
  };
  for (const m of p.mots) {
    const longueur = groupe.map((x) => x.m).join(" ").length + m.m.length + 1;
    if (longueur > 84) pousser();
    groupe.push(m);
    if (/[.?!…]$/.test(m.m) || (/[,:]$/.test(m.m) && groupe.map((x) => x.m).join(" ").length > 42)) pousser();
  }
  pousser();
}
cues.forEach((c, i) => cues[i + 1] && (c.f = Math.min(c.f, cues[i + 1].t - 0.02)));
fs.writeFileSync(
  path.join(VISITE, "visite-fr.vtt"),
  "WEBVTT\n\n" + cues.map((c, i) => `${i + 1}\n${hms(c.t)} --> ${hms(c.f)}\n${c.texte}\n`).join("\n"),
);

// index.html : les passages bout à bout sur une seule composition, chacun un clip qui reprend
// scenes/<id>.html, et dont scenes/<id>.js pose les animations ; la bande-son, si elle existe
const morceau = (id, ext) => {
  const f = path.join(VISITE, "scenes", `${id}.${ext}`);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
};
const scenes = Object.entries(plan)
  .map(
    ([id, p]) =>
      `      <div id="s-${id}" class="clip scene" data-start="${p.debut}" data-duration="${p.duree}" data-track-index="${1 + (Object.keys(plan).indexOf(id) % 2)}">\n${
        morceau(id, "html") ?? `<div class="fond"></div><p style="position:absolute;left:120px;top:120px;font:600 80px var(--f-recit)">${id} — à venir</p>`
      }\n      </div>`,
  )
  .join("\n");
const scripts = Object.keys(plan)
  .filter((id) => morceau(id, "js"))
  .map((id) => `    <script src="scenes/${id}.js"></script>`)
  .join("\n");
const bandeSon = fs.existsSync(path.join(VISITE, "son", "bande-son.mp3"));
const audio = bandeSon
  ? `      <audio id="bande-son" src="son/bande-son.mp3" data-start="0" data-duration="${DUREE}" data-track-index="3" data-volume="1"></audio>`
  : Object.entries(plan)
      .filter(([, p]) => p.voix)
      .map(([id, p]) => `      <audio id="v-${id}" src="${p.voix}" data-start="${(p.debut + p.avant).toFixed(3)}" data-duration="${p.voixDuree}" data-track-index="3" data-volume="1"></audio>`)
      .join("\n");
const gabarit = fs.readFileSync(path.join(ICI, "gabarit.html"), "utf8");
fs.writeFileSync(
  path.join(VISITE, "index.html"),
  gabarit.replaceAll("{{DUREE}}", String(DUREE)).replace("<!--SCENES-->", scenes).replace("<!--AUDIO-->", audio).replace("<!--SCRIPTS-->", scripts),
);
fs.writeFileSync(path.join(VISITE, "donnees", "plan.json"), JSON.stringify({ duree: DUREE, passages: Object.fromEntries(Object.entries(plan).map(([k, v]) => [k, { debut: v.debut, duree: v.duree, avant: v.avant, voixDuree: v.voixDuree }])) }, null, 2));
console.log(`durée totale : ${DUREE.toFixed(1)} s`);
for (const [id, p] of Object.entries(plan)) console.log(`  ${id}  ${p.debut.toFixed(2)} → ${(p.debut + p.duree).toFixed(2)}  (voix ${p.voixDuree.toFixed(2)} s)`);
