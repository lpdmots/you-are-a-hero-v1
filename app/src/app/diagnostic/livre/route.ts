import { createHash } from "node:crypto";
import { freemem } from "node:os";
import { composer } from "@/serveur/livre/composer";
import { livreDeDiagnostic } from "@/serveur/livre/diagnostic";

/**
 * Mesurer la composition du livre là où l'application est servie (V1 à V3 du plan) : un livre
 * fabriqué dans le code, sans la base ni aucune donnée d'élève, composé par le Chromium du
 * serveur. Fermée en production ; ouverte en local et dans une préversion de Vercel, que Vercel
 * protège. « ?pdf=1 » rend le PDF lui-même, pour le regarder.
 */

export const maxDuration = 60;

let appels = 0;

export async function GET(requete: Request) {
  if (process.env.VERCEL_ENV === "production") return new Response(null, { status: 404 });
  appels += 1;
  const froid = appels === 1;
  const livre = livreDeDiagnostic();
  const debut = performance.now();
  const c = await composer(livre, { travail: new URL(requete.url).searchParams.get("travail") === "1", etatDu: "diagnostic", lireImage: async () => null });
  if (new URL(requete.url).searchParams.get("pdf") === "1") {
    return new Response(new Uint8Array(c.pdf), { headers: { "Content-Type": "application/pdf", "Cache-Control": "no-store" } });
  }
  return Response.json({
    hebergement: process.env.VERCEL ? `Vercel ${process.env.VERCEL_ENV ?? ""} ${process.env.VERCEL_REGION ?? ""}`.trim() : "local",
    chromium: c.chromium,
    froid,
    durees: { ...c.durees, misEnPageParPagedJs: Math.round(c.rapport.dureeMiseEnPage), mesureDuServeur: Math.round(performance.now() - debut) },
    pages: c.rapport.pages,
    tailleDuPdf: c.pdf.length,
    memoire: { residenteMo: Math.round(process.memoryUsage().rss / 1048576), libreMo: Math.round(freemem() / 1048576) },
    coupuresCorrigees: c.rapport.coupuresCorrigees,
    // Deux Chromium donnent les mêmes pages quand cette empreinte est la même
    empreinteDesPages: createHash("sha256").update(c.rapport.signature.join("\n")).digest("hex").slice(0, 16),
    premieresPages: c.rapport.signature.slice(0, 3),
  }, { headers: { "Cache-Control": "no-store" } });
}
