import type { NextConfig } from "next";

// Chaque page dépend de la personne connectée et de l'état de ses accès, qui
// doivent se lire à l'instant : pas de composants mis en cache (voir
// docs/architecture.md, « Réalisation de l'étape 1 »).
const nextConfig: NextConfig = {
  poweredByHeader: false,
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
        // Des pages propres à chacun : ni le navigateur d'un poste partagé ni un relais ne
        // les gardent. Les fichiers de l'application et les illustrations, eux, se gardent ; les
        // images de repérage disent elles-mêmes qu'elles ne se gardent que chez la personne.
        source: "/((?!_next/static|_next/image|illustrations/|images/).*)",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
