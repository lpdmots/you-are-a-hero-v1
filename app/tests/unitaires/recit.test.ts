import { describe, expect, it } from "vitest";
import {
  feuillePropre, guidage, introCarnet, phraseDeChoix, resumeFeuille, titreSynthese,
} from "@/domaine/preparation";
import {
  aCompleter, chercherScenes, couleurNouvelle, departDe, deplacer, libelleManque, nomScene, referenceScene, type Chapitre, type Plan, type Scene,
} from "@/domaine/recit";
import { adresseRepere, tirerVisuel, VISUELS } from "@/domaine/visuels";
import { dimensionsJpeg } from "@/serveur/images";

const scene = (reference: number, titre: string | null = null, consigne = ""): Scene => ({
  id: `s${reference}`, chapitreId: "c", reference, titre, consigne, fin: false, horsLivre: false, creeParEleve: null,
});
const chapitre = (id: string, titre: string, scenes: Scene[] = [], eleves: string[] = []): Chapitre => ({
  id, partieId: "p", titre, couleur: 0, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: "foret",
  scenes: scenes.map((s) => ({ ...s, chapitreId: id })), attributions: eleves.map((eleveId) => ({ eleveId, profil: "propositions" })),
});
const plan = (chapitres: Chapitre[], departSceneId: string | null = null): Plan => ({
  parties: [{ id: "p", titre: "La forêt", imageId: null, visuelChoisi: null, visuelDefaut: "mer", chapitres }], corbeille: [], departSceneId,
});
const eleve = (id: string) => ({ id, prenom: id, nom: null, couleur: 0 });

describe("Plan du récit (F03)", () => {
  it("F03.1 — une scène se nomme par sa référence, suivie de son titre dans un message", () => {
    expect(referenceScene(17)).toBe("S017");
    expect(referenceScene(1234)).toBe("S1234");
    expect(nomScene({ reference: 17, titre: "Souche — la chouette messagère" })).toBe("S017 « Souche — la chouette messagère »");
    expect(nomScene({ reference: 5, titre: null })).toBe("S005");
  });

  it("F03-AC24 — « À compléter » compte les chapitres sans scène et sans élève, jamais les scènes sans consigne", () => {
    const p = plan([
      chapitre("lisiere", "La lisière", [scene(1), scene(2), scene(3), scene(4), scene(5), scene(6)], ["alice"]),
      chapitre("racines", "Les racines"),
      chapitre("gue", "Le gué", [scene(7)]),
    ], "s1");
    const manques = aCompleter(p, { deClasse: true, aChoix: true, eleves: [eleve("alice"), eleve("bilal"), eleve("chloe")] });
    expect(manques.map(libelleManque)).toEqual(["1 chapitre sans scène", "2 chapitres sans élève", "2 élèves sans chapitre"]);
    // Chaque manque mène à la première carte concernée
    expect(manques[0]).toMatchObject({ chapitreId: "racines" });
    expect(manques[1]).toMatchObject({ chapitreId: "racines" });
    // Rien ne manque : la phrase disparaît
    expect(aCompleter(plan([chapitre("a", "A", [scene(1)], ["alice"])], "s1"), { deClasse: true, aChoix: true, eleves: [eleve("alice")] })).toEqual([]);
  });

  it("F03-AC41 — en projet personnel, ni chapitre sans élève ni élève sans chapitre", () => {
    const manques = aCompleter(plan([chapitre("a", "A")]), { deClasse: false, aChoix: false, eleves: [] });
    expect(manques.map(libelleManque)).toEqual(["1 chapitre sans scène"]);
  });

  it("F03-AC32 — le départ manque dès que le livre à choix a une scène ; sa scène dans la corbeille ne compte pas", () => {
    const sans = plan([chapitre("a", "A", [scene(1)], ["alice"])]);
    expect(aCompleter(sans, { deClasse: true, aChoix: true, eleves: [eleve("alice")] }).map(libelleManque)).toEqual(["pas de départ du livre"]);
    // Le départ désigne une scène qui n'est plus dans le plan : le livre n'a plus de départ (F03-AC33)
    const supprime = plan([chapitre("a", "A", [scene(2)], ["alice"])], "s1");
    expect(departDe(supprime)).toBeNull();
    expect(aCompleter(supprime, { deClasse: true, aChoix: true, eleves: [eleve("alice")] }).map(libelleManque)).toEqual(["pas de départ du livre"]);
    // Un récit classique n'a pas de départ à désigner ; un livre sans scène non plus
    expect(aCompleter(sans, { deClasse: true, aChoix: false, eleves: [eleve("alice")] })).toEqual([]);
    expect(aCompleter(plan([]), { deClasse: false, aChoix: true, eleves: [] })).toEqual([]);
  });

  it("F03-AC26 — la recherche trouve les scènes de tout le livre, sans accents ni majuscules, dans les titres et les consignes", () => {
    const p: Plan = {
      departSceneId: null, corbeille: [],
      parties: [
        { id: "p1", titre: "La forêt", imageId: null, visuelChoisi: null, visuelDefaut: null, chapitres: [
          chapitre("lisiere", "La lisière", [scene(16, "Souche creuse — la lanterne de secours"), scene(17, "Souche — la chouette messagère"), scene(18, "Le sentier")]),
        ] },
        { id: "p2", titre: "La montagne", imageId: null, visuelChoisi: null, visuelDefaut: null, chapitres: [chapitre("col", "Le col", [scene(40, "Le sommet", "Décris la vieille SOUCHE gelée.")])] },
      ],
    };
    const trouvees = chercherScenes(p, "souche");
    expect(trouvees.map((g) => [g.chapitre.titre, g.scenes.map((s) => s.reference)])).toEqual([["La lisière", [16, 17]], ["Le col", [40]]]);
    expect(chercherScenes(p, "Chouette MESSAGERE").flatMap((g) => g.scenes.map((s) => s.reference))).toEqual([17]);
    expect(chercherScenes(p, "s018").flatMap((g) => g.scenes.map((s) => s.reference))).toEqual([18]);
    expect(chercherScenes(p, "dragon")).toEqual([]);
    expect(chercherScenes(p, "   ")).toEqual([]);
  });

  it("F03-AC23 — déplacer C avant B donne A, C, B", () => {
    expect(deplacer(["A", "B", "C"], 2, 1)).toEqual(["A", "C", "B"]);
    expect(deplacer(["A", "B", "C"], 0, 2)).toEqual(["B", "C", "A"]);
  });

  it("design — un nouveau chapitre prend la couleur la moins employée", () => {
    expect(couleurNouvelle([])).toBe(0);
    expect(couleurNouvelle([0, 1, 2])).toBe(3);
    expect(couleurNouvelle([0, 1, 2, 3, 4, 5, 6, 7, 0])).toBe(1);
  });
});

describe("Images de repérage (F10.1)", () => {
  it("F10-AC26 — le visuel par défaut évite ceux déjà donnés autour, tant que la bibliothèque le permet", () => {
    const tous = VISUELS.map((v) => v.cle);
    for (let i = 0; i < 40; i += 1) {
      const pris = [tous[i % tous.length], tous[(i + 1) % tous.length]];
      expect(pris).not.toContain(tirerVisuel(`graine-${i}`, pris));
    }
    // Bibliothèque épuisée : un visuel est tout de même donné
    expect(tous).toContain(tirerVisuel("graine", tous));
  });

  it("F10-AC03 — le même élément garde le même visuel d'une visite à l'autre", () => {
    expect(tirerVisuel("chapitre-1")).toBe(tirerVisuel("chapitre-1"));
    const sans = { imageId: null, visuelChoisi: null, visuelDefaut: null };
    expect(adresseRepere(sans, "projet-ancien")).toBe(adresseRepere(sans, "projet-ancien"));
  });

  it("F10-AC23 — l'image choisie passe avant le visuel proposé, qui passe avant le visuel par défaut", () => {
    expect(adresseRepere({ imageId: null, visuelChoisi: null, visuelDefaut: "mer" }, "x")).toBe("/illustrations/defaut-mer.jpg");
    expect(adresseRepere({ imageId: null, visuelChoisi: "desert", visuelDefaut: "mer" }, "x")).toBe("/illustrations/defaut-desert.jpg");
    expect(adresseRepere({ imageId: "abc", visuelChoisi: "desert", visuelDefaut: "mer" }, "x")).toBe("/images/abc?v=1");
    expect(adresseRepere({ imageId: "abc", visuelChoisi: null, visuelDefaut: "mer" }, "x", false)).toBe("/images/abc");
    // Un visuel retiré de la bibliothèque ne casse rien : un autre le remplace
    expect(adresseRepere({ imageId: null, visuelChoisi: "disparu", visuelDefaut: "disparu" }, "x")).toMatch(/^\/illustrations\/defaut-[a-z]+\.jpg$/);
  });

  it("F10-AC24 — seul un vrai fichier JPEG est gardé, avec ses dimensions", () => {
    // En-tête JPEG minimal : SOI, APP0, puis SOF0 de 800 × 1200
    const jpeg = Uint8Array.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
      0xff, 0xc0, 0x00, 0x11, 0x08, 0x03, 0x20, 0x04, 0xb0, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
    ]);
    expect(dimensionsJpeg(jpeg)).toEqual({ largeur: 1200, hauteur: 800 });
    expect(dimensionsJpeg(new TextEncoder().encode("<svg onload='alert(1)'/>"))).toBeNull();
    expect(dimensionsJpeg(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeNull();
    expect(dimensionsJpeg(new Uint8Array(0))).toBeNull();
  });
});

describe("Préparation (F02)", () => {
  it("F02-AC18 — chaque rubrique a sa question, ses relances et un exemple", () => {
    for (const rubrique of ["univers", "personnages", "enjeu", "etapes"] as const) {
      const g = guidage(rubrique, "classe", "choix");
      expect(g.question).toMatch(/\?$/);
      expect(g.relances.length).toBeGreaterThanOrEqual(2);
      expect(g.relances.length).toBeLessThanOrEqual(3);
      expect(g.exemple.length).toBeGreaterThan(20);
    }
  });

  it("F02-AC19 — en projet personnel, le carnet parle à l'auteur ; F02-AC20 — en récit classique, « Grandes étapes » demande le déroulement", () => {
    expect(guidage("personnages", "classe", "choix").question).toBe("Qui est notre héros, et qu’est-ce qui le rend unique ?");
    expect(guidage("personnages", "personnel", "choix").question).toBe("Qui est votre héros, et qu’est-ce qui le rend unique ?");
    expect(titreSynthese("classe")).toBe("Nous retenons…");
    expect(titreSynthese("personnel")).toBe("Je retiens…");
    expect(introCarnet("personnel")).not.toMatch(/classe/);
    expect(guidage("etapes", "classe", "choix").question).toBe("Par quels lieux passe notre aventure ?");
    expect(guidage("etapes", "classe", "classique").question).toBe("Que se passe-t-il, du début à la fin ?");
  });

  it("F02-AC02 — l'introduction dit à quoi sert le carnet, sans promettre une aide IA qui n'existe pas encore", () => {
    expect(introCarnet("classe")).toMatch(/repère pendant l’écriture/);
    expect(introCarnet("classe")).not.toMatch(/IA/);
  });

  it("F05 — la phrase de choix se compose avec la formule et la construction du livre", () => {
    expect(phraseDeChoix("Prendre la clé", 12, "rends", "neutre")).toBe("Prendre la clé : rends-toi au 12.");
    expect(phraseDeChoix("Prendre la clé", 12, "va", "pour")).toBe("Pour prendre la clé, va au 12.");
    expect(phraseDeChoix("Prendre la clé", 12, "rends", "si")).toBe("Si tu veux prendre la clé, rends-toi au 12.");
    expect(phraseDeChoix("Prendre la clé", 12, "rends", "question")).toBe("Prendre la clé ? Rends-toi au 12.");
    expect(phraseDeChoix("Prendre la clé", 12, "fleche", "neutre")).toBe("Prendre la clé → 12");
  });

  it("F04.2 — la feuille d'aventure ne garde que des sections connues, aux tailles bornées", () => {
    const feuille = feuillePropre({
      on: true, des: 7,
      sections: [
        { id: "s1", type: "compteurs", titre: "  Compteurs  ", compteurs: [{ id: "c1", nom: "Volonté", depart: 500 }, { id: "c2", nom: "Temps", depart: -3 }] },
        { id: "s2", type: "liste", titre: "Inventaire", lignes: 99 },
        { id: "s3", type: "notes", titre: "Notes" },
        { id: "s4", type: "script", titre: "<script>" },
      ],
    });
    expect(feuille.des).toBe(2);
    expect(feuille.sections.map((s) => s.type)).toEqual(["compteurs", "liste", "notes"]);
    expect(feuille.sections[0]).toMatchObject({ titre: "Compteurs", compteurs: [{ nom: "Volonté", depart: 99 }, { nom: "Temps", depart: 0 }] });
    expect(feuille.sections[1]).toMatchObject({ lignes: 14 });
    expect(resumeFeuille(feuille)).toBe("Volonté 99, Temps 0 · Inventaire · Notes");
    expect(feuillePropre(null)).toEqual({ on: false, des: 0, sections: [] });
    expect(feuillePropre("n'importe quoi")).toEqual({ on: false, des: 0, sections: [] });
  });
});
