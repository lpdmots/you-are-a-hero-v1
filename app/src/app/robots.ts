import type { MetadataRoute } from "next";
import { APPLICATION, PAGES_PUBLIQUES, RESSOURCES_PUBLIQUES, ROBOTS_DES_IA } from "@/domaine/pages-publiques";
import { adresseDuSite } from "@/serveur/env";

/**
 * `robots.txt` (F14-AC45) : les moteurs de recherche lisent tout sauf l'application ; les robots des IA
 * ne lisent que les pages publiques, l'accueil et la bibliothèque sans ce qui les suit (F15-AC12).
 */
export default function robots(): MetadataRoute.Robots {
  const site = adresseDuSite();
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/images/accueil/"], disallow: [...APPLICATION] },
      {
        userAgent: [...ROBOTS_DES_IA],
        // « / » et « /bibliotheque » seuls, sans ce qui les suit : ni l'application, ni les adresses des livres (F15-AC12)
        allow: [...PAGES_PUBLIQUES.map((p) => (p === "/" || p === "/bibliotheque" ? `${p}$` : p)), ...RESSOURCES_PUBLIQUES],
        disallow: "/",
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
