import { describe, expect, it } from "vitest";
import { qualiteDeLImage, REGLAGES_IA_HABITUELS, lireReglagesIa, TAILLES_DES_IMAGES } from "@/domaine/aides-ia";
import {
  CADRAGES, HEROS_ABSENT_EN_MOTS, STYLES_DES_IMAGES, badgesDOffice, candidatsDeLImage, nommeDans, promptDeCouverture, promptDeLaScene, promptDuReperage, raisonDuReperage,
  type Candidat,
} from "@/domaine/illustration";
import { descriptionImage } from "@/serveur/ia/aides/images";

/**
 * Étape 8, lot 8 : les images créées (F10.1, F10.2, F11.4), sans base ni fournisseur. Les badges
 * posés d'office, les prompts que l'application assemble, la qualité selon le cadrage.
 */

const LOU: Candidat = { id: "lou", sorte: "personnage", nom: "Lou", autresNoms: ["le garçon"], heros: true, fiche: "Dix ans, ciré moutarde.", referenceId: "img-lou" };
const MINA: Candidat = { id: "mina", sorte: "personnage", nom: "Mina", autresNoms: [], heros: true, fiche: "Neuf ans, nattes rousses.", referenceId: null };
const MAEL: Candidat = { id: "mael", sorte: "personnage", nom: "Maël", autresNoms: ["le passeur", "le vieux Maël"], heros: false, fiche: "Grand, barbe grise.", referenceId: "img-mael" };
const LANTERNE: Candidat = { id: "lanterne", sorte: "objet", nom: "la lanterne de cuivre", autresNoms: [], heros: false, fiche: "Cuivre patiné, verre bleuté.", referenceId: null };
const AQUARELLE = { style: "aquarelle" as const, autre: "" };

describe("Les badges d'une image de scène (F10.2)", () => {
  it("un nom paraît dans le texte, mot entier, sans tenir compte des majuscules ni de l'apostrophe courbe", () => {
    expect(nommeDans("Le passeur te tend la main.", "le passeur")).toBe(true);
    // L'article du nom ne compte pas : « sa lanterne de cuivre » nomme « la lanterne de cuivre »
    expect(nommeDans("Il lève sa lanterne de cuivre.", "la lanterne de cuivre")).toBe(true);
    expect(nommeDans("Une chouette se pose.", "la chouette")).toBe(true);
    expect(nommeDans("Il tire son sabre.", "sabre")).toBe(true);
    expect(nommeDans("Il tire son sabre.", "sa bre")).toBe(false);
    expect(nommeDans("Un loup hurle.", "Lou")).toBe(false);
    expect(nommeDans("Tu ramasses l’Ogre de pierre.", "l'ogre")).toBe(true);
  });

  it("un seul héros dessiné : son badge d'office, même sans être nommé ; les personnages et objets nommés dans le texte ou l'idée", () => {
    const tous = [LOU, MAEL, LANTERNE];
    expect(badgesDOffice("Le vieux Maël rame sans un mot.", "la lanterne de cuivre qui brille", tous, false)).toEqual(["lou", "mael", "lanterne"]);
    expect(badgesDOffice("Personne sur le quai.", "", tous, false)).toEqual(["lou"]);
  });

  it("plusieurs héros : aucun badge d'office, seul celui que le texte nomme a le sien ; les autres s'ajoutent par « + »", () => {
    const tous = [LOU, MINA, MAEL];
    expect(badgesDOffice("Tu avances sur le ponton.", "", tous, false)).toEqual([]);
    expect(badgesDOffice("Mina te rejoint sur le ponton.", "", tous, false)).toEqual(["mina"]);
    expect(candidatsDeLImage(tous, false).map((c) => c.id)).toEqual(["lou", "mina", "mael"]);
  });

  it("F10-AC08 — héros absent : aucun héros parmi les badges, ni d'office, ni nommé, ni dans la liste du « + »", () => {
    const tous = [LOU, MAEL];
    expect(badgesDOffice("Lou pousse la porte ; le passeur attend.", "", tous, true)).toEqual(["mael"]);
    expect(candidatsDeLImage(tous, true).map((c) => c.id)).toEqual(["mael"]);
  });
});

describe("Les prompts que l'application assemble (F10.2, F10.1, F11.4)", () => {
  it("F10-AC07 — le prompt d'une scène : la description, le cadrage, les fiches reprises mot pour mot, les images jointes numérotées, le style ; aucune insertion", () => {
    const prompt = promptDeLaScene(
      {
        description: "La grotte avec des cristaux bleus.",
        cadrage: "3:2",
        retenus: [
          { nom: "Maël", sorte: "personnage", fiche: MAEL.fiche, reference: true },
          { nom: "la lanterne de cuivre", sorte: "objet", fiche: LANTERNE.fiche, reference: false },
        ],
        herosAbsent: false,
      },
      AQUARELLE,
    );
    expect(prompt).toContain("Ce que montre l'image : La grotte avec des cristaux bleus.");
    expect(prompt).toContain("format 3:2");
    expect(prompt).toContain("- Maël : Grand, barbe grise. (image de référence 1)");
    expect(prompt).toContain("- la lanterne de cuivre : Cuivre patiné, verre bleuté.");
    expect(prompt).toContain("garder leur apparence");
    expect(prompt).toContain(STYLES_DES_IMAGES.aquarelle.prompt);
    expect(prompt).toContain("Aucun texte");
  });

  it("F10-AC08 — héros absent : le prompt dit que le héros n'est pas représenté, au plus ses mains neutres", () => {
    const prompt = promptDeLaScene({ description: "Je pousse la porte du château.", cadrage: "carre", retenus: [], herosAbsent: true }, AQUARELLE);
    expect(prompt).toContain(HEROS_ABSENT_EN_MOTS);
    expect(HEROS_ABSENT_EN_MOTS).toMatch(/ni son visage ni son corps/);
    expect(HEROS_ABSENT_EN_MOTS).toMatch(/mains, neutres/);
  });

  it("F10-AC12 — réglage désactivé : le prompt n'exclut plus le héros ; un nouveau compte crée l'image à l'ajout", () => {
    const prompt = promptDeLaScene({ description: "Lou sur le ponton.", cadrage: "carre", retenus: [{ nom: "Lou", sorte: "personnage", fiche: LOU.fiche, reference: true }], herosAbsent: false }, AQUARELLE);
    expect(prompt).not.toContain(HEROS_ABSENT_EN_MOTS);
    expect(prompt).toContain("- Lou : Dix ans, ciré moutarde. (image de référence 1)");
    expect(REGLAGES_IA_HABITUELS.imageALAjout).toBe(true);
    expect(lireReglagesIa({ imageALAjout: false }).imageALAjout).toBe(false);
    expect(lireReglagesIa({ imageALAjout: "oui" }).imageALAjout).toBe(true);
  });

  it("F10-AC09 — deux chapitres, deux prompts de repérage : la même description du style", () => {
    const a = promptDuReperage({ sorte: "chapitre", titre: "La lisière", resume: "Lou entre dans la forêt.", univers: "Un pays de lacs." }, AQUARELLE);
    const b = promptDuReperage({ sorte: "chapitre", titre: "Le dernier bac", resume: "Le bac traverse le lac." }, AQUARELLE);
    const style = (p: string) => p.split("\n").find((l) => l.startsWith("Style : "));
    expect(style(a)).toBe(style(b));
    expect(style(a)).toContain(STYLES_DES_IMAGES.aquarelle.prompt);
    expect(a).toContain("Chapitre « La lisière » : Lou entre dans la forêt.");
    expect(a).toContain("sans personnage au premier plan");
    expect(a).toContain("Univers de l'histoire : Un pays de lacs.");
  });

  it("F10-AC48 — sans résumé, l'image de repérage ne se crée pas, et le bouton dit pourquoi", () => {
    expect(raisonDuReperage({ resume: "  " })).toBe("Écrivez d’abord le résumé du chapitre.");
    expect(raisonDuReperage({ resume: "Lou entre dans la forêt." })).toBeNull();
    expect(raisonDuReperage({ chapitres: [{ resume: "" }, { resume: "Le bac traverse." }] })).toBeNull();
    expect(raisonDuReperage({ chapitres: [{ resume: "" }] })).toBe("Écrivez d’abord le résumé d’un de ses chapitres.");
  });

  it("F10-AC52 — la couverture : un prompt au format du livre, sans texte, de la place pour le titre, le héros absent selon le réglage", () => {
    const prompt = promptDeCouverture({ titre: "Les passeurs de brume", description: "Un lac noyé de brume au lever du jour.", herosAbsent: true, format: "A5, 148 × 210 mm" }, AQUARELLE);
    expect(prompt).toContain("« Les passeurs de brume »");
    expect(prompt).toContain("au format A5, 148 × 210 mm");
    expect(prompt).toContain("Laisser de la place en haut pour le titre");
    expect(prompt).toContain(HEROS_ABSENT_EN_MOTS);
    expect(prompt).toContain(STYLES_DES_IMAGES.aquarelle.prompt);
  });

  it("la description proposée par l'IA ne reçoit ni le style ni les fiches, que l'application ajoute ; le héros absent est dit au modèle", () => {
    const entree = {
      histoire: { titre: "Les passeurs", mode: "classe" as const, recit: "choix" as const, age: "8-10" as const },
      pour: "scene" as const, idee: "la porte du château", paragraphes: ["Tu pousses la porte."], cadrage: "3:2" as const, herosAbsent: true,
      badges: [{ nom: "Maël" }],
    };
    expect(descriptionImage.systeme(entree)).toContain("Le héros n'est PAS représenté");
    const message = descriptionImage.message(entree);
    expect(message).toContain("Maël");
    expect(message).not.toContain("barbe");
    expect(message).not.toContain(STYLES_DES_IMAGES.aquarelle.prompt);
    expect(descriptionImage.systeme({ ...entree, pour: "couverture", cadrage: "couverture" })).toContain("couverture");
  });
});

describe("La qualité et la taille selon le cadrage (F10-AC37)", () => {
  it("F10-AC37 — sous « Automatique », la pleine page en haute qualité, le 3:2, le 16:9, le carré et le repérage en normale ; « Normale » s'impose à la pleine page", () => {
    expect(qualiteDeLImage("auto", "pleine-page")).toBe("haute");
    for (const c of ["3:2", "16:9", "carre", "reperage"] as const) expect(qualiteDeLImage("auto", c)).toBe("normale");
    expect(qualiteDeLImage("normale", "pleine-page")).toBe("normale");
    expect(qualiteDeLImage("haute", "3:2")).toBe("haute");
  });

  it("chaque cadrage a sa taille, en hauteur pour la pleine page, multiples de 16", () => {
    for (const c of CADRAGES) {
      const [l, h] = TAILLES_DES_IMAGES[c].split("x").map(Number);
      expect(l % 16).toBe(0);
      expect(h % 16).toBe(0);
      if (c === "pleine-page") expect(h).toBeGreaterThan(l);
    }
  });
});
