import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { ADRESSE_DU_GUIDE, ANCRES, DATE_DE_PUBLICATION_DU_GUIDE, DATE_DU_GUIDE, donneesDuGuide, IMAGES_DES_ENCARTS, IMAGES_DU_GUIDE, morceaux } from "@/domaine/guide";
import { lireOffre } from "@/domaine/offre";
import { estPageMesuree } from "@/domaine/pages-publiques";
import { llmsTxt } from "@/domaine/presentation";
import { TEXTE_DU_GUIDE as T } from "@/domaine/texte-du-guide";

const SITE = "https://iletaituneclasse.com";

afterEach(() => vi.unstubAllEnvs());

describe("le guide « Comment écrire un livre dont vous êtes le héros en classe »", () => {
  it("F14-AC52 — le texte du document : « En bref » en cinq chiffres, quatorze questions, chacune son ancre, cinq encarts au plus, aucun renvoi à « Ressources »", () => {
    expect(T.titre).toBe("Comment écrire un livre dont vous êtes le héros en classe");
    expect(T.definition).toMatch(/^Un livre dont vous êtes le héros, ou livre-jeu,/);
    expect(T.auteur).toMatch(/^Par Nicolas Coussot, professeur des écoles,/);
    // « En bref » : un chiffre, sa phrase, la question qui le développe
    expect(T.enBref.map((l) => l.chiffre)).toEqual(["1 à 3 mois", "20 h", "4 temps", "80 scènes", "10 €"]);
    expect(T.enBref.every((l) => l.texte && l.partie >= 1 && l.partie <= 14)).toBe(true);
    expect(T.parties.map((p) => p.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
    expect(T.parties.every((p) => p.titre.endsWith("?") || p.numero === 14)).toBe(true);
    expect(new Set(ANCRES).size).toBe(T.parties.length);
    const encarts = T.parties.flatMap((p) => p.blocs).filter((b) => b.sorte === "encart");
    expect(encarts.length).toBeLessThanOrEqual(5);
    expect(JSON.stringify(T)).not.toContain("Ressources");
    expect(T.plusLoin.map((l) => l.adresse)).toEqual(["/bibliotheque", "/"]);
    // Pour aller plus loin : des lectures sur d'autres sites, chacune avec son lien
    expect(T.lectures.length).toBeGreaterThanOrEqual(3);
    expect(T.lectures.every((l) => /\]\(https:\/\//.test(l))).toBe(true);
    // Le tableau de la partie 11 et la liste de la partie 14
    expect(T.parties[10].blocs.some((b) => b.sorte === "tableau")).toBe(true);
    expect(T.parties[13].blocs[0].sorte).toBe("liste");
    // Chaque image se pose sur un paragraphe qui existe
    for (const [ancre, place] of Object.entries(IMAGES_DU_GUIDE)) {
      const partie = T.parties[ANCRES.indexOf(ancre as (typeof ANCRES)[number])];
      if ("apres" in place) expect(partie.blocs.some((b) => b.sorte === "paragraphe" && b.tete === place.apres), ancre).toBe(true);
      if ("avantDansMaClasse" in place || "apresDansMaClasse" in place) expect(partie.blocs.some((b) => b.sorte === "classe"), ancre).toBe(true);
    }
    // Chaque capture d'encart a son encart
    for (const ancre of Object.keys(IMAGES_DES_ENCARTS))
      expect(T.parties[ANCRES.indexOf(ancre as (typeof ANCRES)[number])].blocs.some((b) => b.sorte === "encart"), ancre).toBe(true);
  });

  it("F14-AC52 — « (voir « … ») » devient un renvoi à la question de ce titre ; liens, gras et italique se reconnaissent", () => {
    const erreurs = T.parties[13].blocs[0];
    if (erreurs.sorte !== "liste") throw new Error("liste attendue");
    const renvois = erreurs.elements.flatMap((e) => morceaux(e, T.parties)).filter((m) => m.sorte === "renvoi");
    expect(renvois.map((m) => m.sorte === "renvoi" && m.numero)).toEqual([11, 9, 6, 7, 10, 10]);
    expect(morceaux("Lisez **ceci**, *cela* et [la bibliothèque](/bibliotheque).", T.parties)).toEqual([
      { sorte: "texte", texte: "Lisez " },
      { sorte: "gras", texte: "ceci" },
      { sorte: "texte", texte: ", " },
      { sorte: "italique", texte: "cela" },
      { sorte: "texte", texte: " et " },
      { sorte: "lien", texte: "la bibliothèque", adresse: "/bibliotheque" },
      { sorte: "texte", texte: "." },
    ]);
    expect(morceaux("[*Tu es le héros*](https://www.editions-larousse.fr/livres-tu-es-le-heros/)", T.parties)).toEqual([
      { sorte: "lien", texte: "Tu es le héros", adresse: "https://www.editions-larousse.fr/livres-tu-es-le-heros/", italique: true },
    ]);
  });

  it("F14-AC53 — au plan du site, ouvert aux robots des IA avec ses images, dans llms.txt, mesuré", () => {
    vi.stubEnv("ADRESSE_SITE", SITE);
    expect(sitemap().find((u) => u.url === `${SITE}${ADRESSE_DU_GUIDE}`)?.priority).toBe(0.8);
    expect(sitemap().find((u) => u.url === `${SITE}${ADRESSE_DU_GUIDE}`)?.lastModified).toBe(DATE_DU_GUIDE);
    const { rules } = robots();
    const [, ia] = Array.isArray(rules) ? rules : [rules];
    expect(ia.allow).toEqual(expect.arrayContaining([ADRESSE_DU_GUIDE, "/guide/"]));
    expect(llmsTxt(lireOffre({ paiement_ouvert: false }), SITE)).toContain(`(${SITE}${ADRESSE_DU_GUIDE})`);
    expect(estPageMesuree(ADRESSE_DU_GUIDE)).toBe(true);
  });

  it("F14-AC53 — ses données d'article : titre, auteur, date, une entrée par question", () => {
    const donnees = donneesDuGuide(T, SITE) as { "@graph": Record<string, unknown>[] };
    const [article, fil] = donnees["@graph"];
    expect(article).toMatchObject({
      "@type": "Article",
      headline: T.titre,
      url: `${SITE}${ADRESSE_DU_GUIDE}`,
      datePublished: DATE_DE_PUBLICATION_DU_GUIDE,
      dateModified: DATE_DU_GUIDE,
      author: { "@type": "Person", "@id": `${SITE}/#nicolas`, name: "Nicolas Coussot" },
      publisher: { "@id": `${SITE}/#organisation` },
    });
    expect((article.hasPart as { url: string }[]).map((p) => p.url)).toContain(`${SITE}${ADRESSE_DU_GUIDE}#chemins`);
    expect(fil["@type"]).toBe("BreadcrumbList");
  });
});
