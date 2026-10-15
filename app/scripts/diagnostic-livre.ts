/**
 * Le diagnostic de la composition hors de Next : `npx tsx scripts/diagnostic-livre.ts [sortie.pdf]`.
 * Sert à essayer le Chromium de Vercel sous Linux, dans Docker (V1 du plan) : le script est
 * empaqueté par esbuild, puis exécuté dans l'image Lambda d'Amazon, avec CHROMIUM_SERVEUR=1.
 * Il rend la même mesure que la page /diagnostic/livre.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { composer } from "@/serveur/livre/composer";
import { livreDeDiagnostic } from "@/serveur/livre/diagnostic";

async function principal() {
  const mesures = [];
  for (let i = 0; i < 3; i += 1) {
    const c = await composer(livreDeDiagnostic(), { travail: false, etatDu: "diagnostic", lireImage: async () => null });
    mesures.push({ ...c.durees, pages: c.rapport.pages, empreinte: createHash("sha256").update(c.rapport.signature.join("\n")).digest("hex").slice(0, 16), chromium: c.chromium, octets: c.pdf.length });
    if (i === 0 && process.argv[2]) writeFileSync(process.argv[2], c.pdf);
  }
  console.log(JSON.stringify(mesures, null, 1));
}
principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
