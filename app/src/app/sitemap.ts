import type { MetadataRoute } from "next";
import { PAGES_PUBLIQUES } from "@/domaine/pages-publiques";
import { adresseDuSite } from "@/serveur/env";

/** Le plan du site (F14-AC45) : les pages publiques, à l'adresse du site, et elles seules. */
export default function sitemap(): MetadataRoute.Sitemap {
  const site = adresseDuSite();
  return PAGES_PUBLIQUES.map((page) => ({
    url: `${site}${page === "/" ? "" : page}`,
    changeFrequency: page === "/" ? "weekly" : "monthly",
    priority: page === "/" ? 1 : page === "/aide" ? 0.8 : 0.3,
  }));
}
