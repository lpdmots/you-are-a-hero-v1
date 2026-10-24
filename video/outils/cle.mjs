// La clé ElevenLabs, lue dans le .env de hyperframes-shorts ; jamais affichée ni copiée.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function lireCle() {
  const env = fs.readFileSync(path.join(os.homedir(), "Projets/hyperframes-shorts/.env"), "utf8");
  for (const ligne of env.split(/\r?\n/)) {
    const l = ligne.trim();
    if (l.startsWith("ELEVENLABS_API_KEY=")) return l.slice(19).trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("ELEVENLABS_API_KEY absente");
}
