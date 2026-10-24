import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const SITE = "https://iletaituneclasse.com";

afterEach(() => vi.unstubAllEnvs());

describe("référencement", () => {
  it("F14-AC45 — robots.txt : l'application fermée à tous, les robots des IA aux seules pages publiques, le plan du site", () => {
    vi.stubEnv("ADRESSE_SITE", SITE);
    const { rules, sitemap: plan } = robots();
    const [tous, ia] = Array.isArray(rules) ? rules : [rules];
    expect(tous.userAgent).toBe("*");
    expect(tous.disallow).toEqual(expect.arrayContaining(["/projet/", "/projets", "/travail", "/admin", "/images/"]));
    // Les entrées et les livres restent lisibles par les moteurs, pour que leur « noindex » soit vu
    expect(tous.disallow).not.toEqual(expect.arrayContaining(["/entree"]));
    expect(tous.disallow).not.toContain("/lire/");
    expect(tous.disallow).not.toContain("/classe");
    expect(ia.userAgent).toEqual(expect.arrayContaining(["GPTBot", "ClaudeBot", "Google-Extended", "PerplexityBot", "OAI-SearchBot"]));
    expect(ia.disallow).toBe("/");
    expect(ia.allow).toEqual(expect.arrayContaining(["/$", "/aide", "/confidentialite", "/conditions", "/mentions-legales", "/llms.txt"]));
    expect((ia.allow as string[]).some((a) => a.startsWith("/lire") || a.startsWith("/classe") || a.startsWith("/entree"))).toBe(false);
    expect(plan).toBe(`${SITE}/sitemap.xml`);
  });

  it("F14-AC45 — le plan du site liste les pages publiques au .com, et elles seules", () => {
    vi.stubEnv("ADRESSE_SITE", SITE);
    const urls = sitemap().map((u) => u.url);
    expect(urls).toEqual(expect.arrayContaining([SITE, `${SITE}/aide`, `${SITE}/confidentialite`, `${SITE}/conditions`, `${SITE}/mentions-legales`]));
    expect(urls.every((u) => u.startsWith(SITE))).toBe(true);
    expect(urls.some((u) => /\/(lire|entree|classe|projets?|travail)(\/|$)/.test(u))).toBe(false);
  });

  it("F14-AC46 — les deux adresses vercel.app renvoient au .com, à la même page, sauf la tâche de la nuit ; rien hors production", async () => {
    const { default: config } = await import("../../next.config");
    vi.stubEnv("ADRESSE_SITE", SITE);
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(await config.redirects!()).toEqual([]);
    vi.stubEnv("VERCEL_ENV", "production");
    const regles = await config.redirects!();
    for (const hote of ["il-etait-une-classe.vercel.app", "you-are-a-hero-v1.vercel.app"]) {
      const siennes = regles.filter((r) => r.has?.some((h) => h.type === "host" && h.value === hote));
      expect(siennes.map((r) => [r.source, r.destination, r.permanent])).toEqual([
        ["/", `${SITE}/`, true],
        ["/:chemin((?!taches(?:/|$)).+)", `${SITE}/:chemin`, true],
      ]);
    }
    // Le motif du chemin : tout, sauf la tâche de la nuit
    const motif = /^(?!taches(?:\/|$)).+$/;
    expect(["aide", "lire/abc", "classe/qui", "tachesx"].every((c) => motif.test(c))).toBe(true);
    expect(["taches/comptes-inactifs", "taches"].some((c) => motif.test(c))).toBe(false);
  });
});

describe("mesure d'audience", () => {
  it("F14-AC49 — la mesure se charge sur les pages publiques et les entrées, jamais chez les élèves, dans les livres ni dans l'outil", async () => {
    const { estPageMesuree } = await import("@/domaine/pages-publiques");
    for (const p of ["/", "/aide", "/confidentialite", "/conditions", "/mentions-legales", "/entree", "/entree/inscription", "/entree/oubli"]) {
      expect(estPageMesuree(p), p).toBe(true);
    }
    for (const p of ["/classe", "/classe/qui", "/travail", "/travail/scene/1", "/lire/abc", "/projets", "/projet/1/suivi", "/compte", "/admin", "/entreeX", null]) {
      expect(estPageMesuree(p), String(p)).toBe(false);
    }
  });
});
