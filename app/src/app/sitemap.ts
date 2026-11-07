import type { MetadataRoute } from "next";
import { DATE_DU_GUIDE } from "@/domaine/guide";
import { ADRESSE_DU_GUIDE, PAGES_PUBLIQUES } from "@/domaine/pages-publiques";
import { adresseDuSite } from "@/serveur/env";

/**
 * Le plan du site (F14-AC45) : les pages publiques, à l'adresse du site, et elles seules. Le guide donne
 * sa date de mise à jour, le seul champ du plan que Google lit (audit du 7 novembre 2026).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = adresseDuSite();
  return PAGES_PUBLIQUES.map((page) => ({
    url: `${site}${page === "/" ? "" : page}`,
    changeFrequency: page === "/" || page === "/bibliotheque" ? "weekly" : "monthly",
    priority: page === "/" ? 1 : page === "/aide" || page === "/bibliotheque" || page === ADRESSE_DU_GUIDE ? 0.8 : 0.3,
    ...(page === ADRESSE_DU_GUIDE ? { lastModified: DATE_DU_GUIDE } : {}),
  }));
}
