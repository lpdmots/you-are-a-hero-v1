import { beforeAll, describe, expect, it } from "vitest";
import type { LivreACompose } from "@/domaine/composition";
import { composer, type Composition } from "@/serveur/livre/composer";
import { action, choix, id, image, imageId, liaison, livreAChoix, livreDe, lirePdf, p, png, recit, type PageLue } from "./fabrique";

/**
 * Étape 6 du plan, lot 1 : le livre mis en pages par Paged.js dans Chromium, puis relu dans
 * le PDF produit — lignes de texte et positions, comme le prototype PDF le faisait (ADR 0003).
 */

const ETAT = "état du 15 octobre, 10 h 00";
const sansImages = async () => null;
const composerLes2 = async (livre: LivreACompose) => {
  const [travail, definitif] = await Promise.all([
    composer(livre, { travail: true, etatDu: ETAT, lireImage: sansImages }),
    composer(livre, { travail: false, etatDu: ETAT, lireImage: sansImages }),
  ]);
  return { travail, definitif, pagesTravail: await lirePdf(travail.pdf), pagesDefinitif: await lirePdf(definitif.pdf) };
};
const texteDe = (pages: PageLue[]) => pages.map((x) => x.lignes.join("\n")).join("\n").replaceAll("­", "");
/** pdf.js sépare les lettres espacées ou crénées (« C H A P I T R E », « A joute ») : on compare sans espaces. */
const serre = (t: string) => t.replace(/\s+/g, "");

describe("Le livre à choix, en PDF de travail et en PDF définitif (F11.2)", () => {
  let c: Awaited<ReturnType<typeof composerLes2>>;
  beforeAll(async () => {
    c = await composerLes2(livreAChoix(40));
  });

  it("F11-AC15 — le PDF de travail porte « Version de travail » et les références des scènes ; le PDF définitif n'en porte aucune", () => {
    const travail = texteDe(c.pagesTravail);
    const definitif = texteDe(c.pagesDefinitif);
    expect(travail).toMatch(/VERSION DE TR\s?A\s?V\s?A\s?IL/);
    expect(travail).toContain("S001");
    expect(definitif).not.toMatch(/VERSION DE TR/);
    expect(definitif).not.toMatch(/S0\d\d/);
  });

  it("F11-AC58 — la page récapitulative occupe un nombre pair de pages : le livre garde ses pages de droite", () => {
    const { horsPagination, pages } = c.travail.rapport;
    expect(horsPagination % 2).toBe(0);
    expect(horsPagination).toBeGreaterThanOrEqual(2);
    expect(c.pagesTravail).toHaveLength(pages + horsPagination);
    expect(c.definitif.rapport.horsPagination).toBe(0);
    expect(c.pagesDefinitif).toHaveLength(pages);
  });

  it("F11-AC30, F11-AC15 — une seule composition : chaque morceau de texte du PDF définitif est à la même place dans le PDF de travail", () => {
    const decalage = c.travail.rapport.horsPagination;
    expect(c.definitif.rapport.pages).toBe(c.travail.rapport.pages);
    for (let i = 0; i < c.pagesDefinitif.length; i += 1) {
      const travail = c.pagesTravail[i + decalage].elements;
      for (const e of c.pagesDefinitif[i].elements) {
        expect(travail.some((t) => t.texte === e.texte && Math.abs(t.x - e.x) < 0.05 && Math.abs(t.y - e.y) < 0.05), `page ${i + 1} : « ${e.texte} »`).toBe(true);
      }
    }
  });

  it("la page fait 420 × 595 points, l'écart d'arrondi accepté (F11.3)", () => {
    expect(Math.round(c.pagesDefinitif[0].largeur)).toBe(420);
    expect(Math.round(c.pagesDefinitif[0].hauteur)).toBe(595);
  });

  it("l'en-tête de chaque page dit les numéros des passages qu'elle porte (F11.5)", () => {
    const enTetes = c.pagesDefinitif.slice(1).map((x) => x.lignes[0]);
    expect(enTetes.filter((l) => /^\d+( – \d+)?$/.test(l)).length).toBeGreaterThan(enTetes.length / 2);
  });

  it("la composition est rapide et rend la carte des blocs (ADR 0003)", () => {
    expect(c.travail.durees.total).toBeLessThan(20000);
    expect(c.travail.rapport.carte.length).toBeGreaterThan(80);
    expect(Object.keys(c.travail.rapport.pageDe)).toHaveLength(40);
  });
});

describe("Ce que le PDF de travail signale (F09.2, F05, F10, F04.2)", () => {
  let pages: PageLue[];
  let composition: Composition;
  beforeAll(async () => {
    const livre = livreDe([
      { ref: 1, texte: [p("La porte aux symboles grince."), liaison(id(2)), choix("Suivre le héron", null), choix("Abandonner", id(3))] },
      { ref: 2, fixe: 40, fin: true, texte: [p("Derrière la porte, un escalier.")] },
      { ref: 3, fin: true, texte: [p("Le couteau brille dans l’herbe."), action("Ajoute le couteau à ton inventaire."), image(1, 65)] },
    ]);
    composition = await composer(livre, { travail: true, etatDu: ETAT, lireImage: sansImages });
    pages = await lirePdf(composition.pdf);
  });

  it("F09-AC09 — la page récapitulative liste les problèmes, et le choix sans destination est marqué à sa place dans le texte", () => {
    const recap = pages[0].lignes.join("\n");
    expect(recap).toContain("ne mène nulle part");
    const pageDuChoix = pages.find((x, i) => i >= composition.rapport.horsPagination && x.lignes.some((l) => l.includes("Suivre le héron")))!;
    expect(pageDuChoix.lignes.join(" ")).toMatch(/ne mène nulle\s+part/);
  });

  it("F05-AC08 — le numéro fixé que le livre n'atteint plus est signalé, et l'énigme est marquée à côté de son passage", () => {
    const tout = texteDe(pages);
    expect(tout).toContain("Une énigme mène à un numéro qui n’existe pas.");
    expect(tout).toContain("énigme → 40");
  });

  it("F10-AC14 — une image introuvable laisse « Image introuvable » à sa place", () => {
    expect(texteDe(pages)).toContain("Image introuvable");
  });

  it("F04-AC17 — l'action de jeu est imprimée à part, sur sa propre ligne", () => {
    expect(pages.some((x) => x.lignes.some((l) => serre(l) === serre("Ajoute le couteau à ton inventaire.")))).toBe(true);
    expect(composition.rapport.carte.some((b) => b.bloc === "a-Ajoute le co")).toBe(true);
  });
});

describe("Le récit classique (F11.5, 15 octobre 2026)", () => {
  let pages: PageLue[];
  let composition: Composition;
  beforeAll(async () => {
    const livre = livreDe([
      { ref: 1, partie: 0, chapitre: "La lisière", texte: recit(1, 6, 6) },
      { ref: 2, partie: 0, chapitre: "La lisière", texte: recit(2, 6, 6) },
      { ref: 3, partie: 0, chapitre: "Le marais", texte: recit(3, 8, 6) },
      { ref: 4, partie: 0, chapitre: "Le marais", texte: recit(4, 8, 6) },
    ], { aChoix: false, parties: ["La forêt"], titre: "La cabane du passeur" });
    composition = await composer(livre, { travail: false, etatDu: ETAT, lireImage: sansImages });
    pages = await lirePdf(composition.pdf);
  });

  it("F11-AC104 — en-tête : le titre du livre à gauche, le chapitre en cours à droite, rien sur la page qui ouvre un chapitre", () => {
    expect(pages[0].lignes[0]).not.toBe("La cabane du passeur");
    const gauche = pages[1].lignes;
    expect(gauche[0]).toBe("La cabane du passeur");
    const droite = pages[2].lignes;
    expect(droite[0]).toBe("La lisière");
    const ouvreLeMarais = pages.findIndex((x) => x.lignes.some((l) => l === "Le marais") && x.lignes.some((l) => serre(l) === "CHAPITRE2"));
    expect(ouvreLeMarais).toBeGreaterThan(0);
    const suivanteADroite = pages.findIndex((x, i) => i > ouvreLeMarais && i % 2 === 0);
    if (suivanteADroite > 0) expect(pages[suivanteADroite].lignes[0]).toBe("Le marais");
  });

  it("F11-AC103 — le deuxième chapitre est titré « Chapitre 2 » ; F11-AC49 — le numéro de page est imprimé par défaut", () => {
    expect(serre(texteDe(pages))).toContain("CHAPITRE2");
    expect(pages[1].lignes.at(-1)).toBe("2");
    expect(pages[2].lignes.at(-1)).toBe("3");
  });
});

it("une image lue dans le stockage est imprimée à la largeur demandée (F10-AC13)", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const livre = livreDe([{ ref: 1, fin: true, texte: [p("Le pont."), image(1, 60)] }], { images: { [imageId(1)]: { largeur: 1200, hauteur: 800 } } });
  const c = await composer(livre, { travail: false, etatDu: ETAT, lireImage: async () => ({ octets: png, type: "image/png" }) });
  const bloc = c.rapport.carte.find((b) => b.bloc === "i-1")!;
  const largeurTexte = 148 - 20 - 15;
  expect(Math.abs(bloc.l - 0.6 * largeurTexte)).toBeLessThan(0.6);
  expect(c.rapport.introuvables).toEqual([]);
});

it("F11-AC30 — l'aperçu, ses images allégées, a les mêmes pages que le PDF : chaque ligne à la même place", async () => {
  const images = Object.fromEntries([1, 2, 3].map((n) => [imageId(n), { largeur: 1800, hauteur: 1200 }]));
  const scenes = Array.from({ length: 12 }, (_, i) => ({
    ref: i + 1, fin: i === 11,
    texte: [...recit(i + 1, 2 + (i % 3), 4), ...(i % 4 === 0 ? [image(1 + (i % 3), 40 + i * 5)] : []), ...(i < 11 ? [choix(`Continuer ${i + 1}`, id(i + 2))] : [])],
  }));
  const livre = livreDe(scenes, { images });
  const [pdf, apercu] = await Promise.all([
    composer(livre, { travail: true, etatDu: ETAT, lireImage: async () => ({ octets: png(1800, 1200), type: "image/png" }) }),
    composer(livre, { travail: true, etatDu: ETAT, lireImage: async () => ({ octets: png(900, 600), type: "image/png" }) }),
  ]);
  const [a, b] = await Promise.all([lirePdf(pdf.pdf), lirePdf(apercu.pdf)]);
  expect(b).toHaveLength(a.length);
  for (let i = 0; i < a.length; i += 1) {
    expect(b[i].elements.map((e) => [e.texte, e.x.toFixed(1), e.y.toFixed(1)])).toEqual(a[i].elements.map((e) => [e.texte, e.x.toFixed(1), e.y.toFixed(1)]));
  }
  expect(apercu.rapport.carte).toEqual(pdf.rapport.carte);
});
