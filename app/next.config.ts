import type { NextConfig } from "next";

// Chaque page dépend de la personne connectée et de l'état de ses accès, qui
// doivent se lire à l'instant : pas de composants mis en cache (voir
// docs/architecture.md, « Réalisation de l'étape 1 »).
// Le livre est composé par Chromium sur le serveur (ADR 0003) : Playwright et le Chromium de
// Vercel restent hors du paquet, et les fichiers que la composition lit sur le disque — Paged.js
// et les polices du livre — partent avec les fonctions qui composent.
const FICHIERS_DU_LIVRE = [
  "./node_modules/pagedjs/dist/paged.js",
  "./node_modules/@fontsource/vollkorn/latin*.css",
  "./node_modules/@fontsource/vollkorn/files/vollkorn-latin*.woff2",
  "./node_modules/@fontsource/atkinson-hyperlegible-next/latin*.css",
  "./node_modules/@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin*.woff2",
  "./node_modules/@fontsource/andika/latin*.css",
  "./node_modules/@fontsource/andika/files/andika-latin*.woff2",
  "./node_modules/@sparticuz/chromium/bin/**",
  // Playwright lit ses propres fichiers à l'exécution (browsers.json…), que le traçage ne voit pas
  "./node_modules/playwright-core/**",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 90 pour les captures de l'accueil, pleines de petit texte (Next 16 n'accepte que les qualités listées)
  images: { qualities: [75, 90] },
  serverExternalPackages: ["playwright-core", "@sparticuz/chromium"],
  outputFileTracingIncludes: {
    "/livre/**": FICHIERS_DU_LIVRE,
    "/diagnostic/**": FICHIERS_DU_LIVRE,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // L'application ne s'affiche dans aucune autre page
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // Le lien de lecture se transmet, mais ne se répertorie pas (F12.1, « Non-référencement »)
        source: "/lire/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Des pages propres à chacun : ni le navigateur d'un poste partagé ni un relais ne
        // les gardent. Les fichiers de l'application, les illustrations et les images de l'accueil,
        // eux, se gardent ; les images de repérage disent elles-mêmes qu'elles ne se gardent que
        // chez la personne.
        source: "/((?!_next/static|_next/image|illustrations/|images/|accueil/).*)",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
