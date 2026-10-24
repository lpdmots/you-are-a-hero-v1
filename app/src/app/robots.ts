import type { MetadataRoute } from "next";
import { APPLICATION, PAGES_PUBLIQUES, RESSOURCES_PUBLIQUES, ROBOTS_DES_IA } from "@/domaine/pages-publiques";
import { adresseDuSite } from "@/serveur/env";

/**
 * `robots.txt` (F14-AC45) : les moteurs de recherche lisent tout sauf l'application ; les robots des IA
 * ne lisent que les pages publiques, l'accueil seul par « / » sans ce qui le suit.
 */
export default function robots(): MetadataRoute.Robots {
  const site = adresseDuSite();
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/images/accueil/"], disallow: [...APPLICATION] },
      {
        userAgent: [...ROBOTS_DES_IA],
        allow: [...PAGES_PUBLIQUES.map((p) => (p === "/" ? "/$" : p)), ...RESSOURCES_PUBLIQUES],
        disallow: "/",
      },
    ],
    sitemap: `${site}/sitemap.xml`,
  };
}
