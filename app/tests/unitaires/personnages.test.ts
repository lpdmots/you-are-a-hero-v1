import { describe, expect, it } from "vitest";
import { qualiteDeLImage, TAILLES_DES_IMAGES } from "@/domaine/aides-ia";
import { descriptionDuStyle, nomDeFichier, promptDeLObjet, promptDuPortrait, STYLES, STYLES_DES_IMAGES } from "@/domaine/illustration";
import { dejaUneCarte, herosDe, lireAutresNoms, nomsPropresDeLHistoire } from "@/domaine/personnages";
import { guidage, RELANCE_DES_HEROS } from "@/domaine/preparation";
import { blocPersonnages } from "@/serveur/ia/aides/contexte";
import { personnages as aidePersonnages } from "@/serveur/ia/aides/images";

/** Étape 8, lot 7 : personnages et objets de l'histoire, styles et images de référence (F10.2). */

const lou = { nom: "Lou", autresNoms: ["le garçon"], description: "Fils du passeur ; il connaît le chant des lanternes.", heros: true };
const mina = { nom: "Mina", autresNoms: [], description: "Elle sait nager.", heros: true };
const mael = { nom: "Maël", autresNoms: ["le passeur", "le vieux Maël"], description: "Le père de Lou.", heros: false };

describe("Les cartes des personnages (F10.2)", () => {
  it("les autres noms se lisent d'une ligne : séparés par des virgules, sans doublon ni le nom lui-même, cinq au plus", () => {
    expect(lireAutresNoms(" le passeur ,le vieux Maël, , Le Passeur ; Maël", "Maël")).toEqual(["le passeur", "le vieux Maël"]);
    expect(lireAutresNoms("a, b, c, d, e, f, g")).toHaveLength(5);
  });

  it("F10-AC39 — plusieurs héros sans limite, dans l'ordre des cartes ; les aides lisent leur liste, héros en tête, et le choix du lecteur", () => {
    expect(herosDe([mael, lou, mina]).map((p) => p.nom)).toEqual(["Lou", "Mina"]);
    const bloc = blocPersonnages([mael, lou, mina]);
    expect(bloc.indexOf("Lou (héros")).toBeLessThan(bloc.indexOf("Maël"));
    expect(bloc).toContain("Lou (héros ; aussi : le garçon) : Fils du passeur ; il connaît le chant des lanternes.");
    expect(bloc).toContain("Mina (héros) : Elle sait nager.");
    expect(bloc).toContain("parmi : Lou, Mina.");
    // Un seul héros : pas de choix du lecteur à dire
    expect(blocPersonnages([lou, mael])).not.toContain("choisit son héros");
    expect(blocPersonnages([])).toBe("");
  });

  it("F10-AC38 — l'IA peut marquer plusieurs héros ; une carte déjà là, sous un de ses noms, n'est pas reprise ; « tu » n'est pas un personnage", () => {
    const entree = { histoire: { titre: "x", mode: "classe" as const, recit: "choix" as const, niveaux: [] }, carnet: {}, idees: [], connus: [mael] };
    const lu = aidePersonnages.lire(
      { personnages: [
        { nom: "Lou", autres_noms: ["le garçon"], description: "", heros: true },
        { nom: "Mina", autres_noms: [], description: "", heros: true },
        { nom: "le passeur", autres_noms: [], description: "", heros: false },
        { nom: "Tu", autres_noms: [], description: "", heros: true },
      ] },
      entree,
    );
    expect(lu?.personnages.map((p) => [p.nom, p.heros])).toEqual([["Lou", true], ["Mina", true]]);
    expect(dejaUneCarte("Le Passeur", [mael])).toBe(true);
  });

  it("F10-AC44 — les noms propres de l'histoire : les personnages, leurs autres noms, puis les objets, sans doublon", () => {
    expect(nomsPropresDeLHistoire([lou, mael], [{ nom: "la clé d’argent" }, { nom: "Lou" }])).toEqual(["Lou", "le garçon", "Maël", "le passeur", "le vieux Maël", "la clé d’argent"]);
  });

  it("la relance des héros ne vaut qu'en récit à choix", () => {
    expect(guidage("personnages", "classe", "choix").relances).toContain(RELANCE_DES_HEROS);
    expect(guidage("personnages", "classe", "classique").relances).not.toContain(RELANCE_DES_HEROS);
  });
});

describe("Styles et prompts des images de référence (F10.2)", () => {
  it("six styles décrits par leur technique, et « Autre » ; jamais un nom d'artiste ni de studio", () => {
    expect(STYLES).toEqual(["lumineuse", "aquarelle", "crayons", "gouache", "papier", "encre", "autre"]);
    expect(STYLES_DES_IMAGES.lumineuse.nom).toBe("Illustration 2D lumineuse");
    const tout = Object.values(STYLES_DES_IMAGES).map((s) => s.prompt).join(" ");
    for (const nom of ["Ghibli", "Disney", "Pixar", "Miyazaki", "à la manière"]) expect(tout).not.toContain(nom);
    expect(descriptionDuStyle("autre", "  linogravure   en deux couleurs ")).toBe("linogravure en deux couleurs");
    expect(descriptionDuStyle("autre", "")).toBe(STYLES_DES_IMAGES.lumineuse.prompt);
  });

  it("F10-AC09 — le portrait reprend la fiche visuelle mot pour mot, et le style du projet ; à défaut de fiche, la description", () => {
    const fiche = "Environ dix ans. Ciré jaune moutarde, bottes vertes.";
    const prompt = promptDuPortrait({ nom: "Lou", description: "Fils du passeur.", fiche }, { style: "aquarelle", autre: "" });
    expect(prompt).toContain(fiche);
    expect(prompt).toContain(STYLES_DES_IMAGES.aquarelle.prompt);
    expect(prompt).not.toContain("Fils du passeur.");
    expect(promptDuPortrait({ nom: "Lou", description: "Fils du passeur.", fiche: "" }, { style: "aquarelle", autre: "" })).toContain("Fils du passeur.");
    expect(prompt).toMatch(/Aucun texte/);
    const objet = promptDeLObjet({ nom: "la lanterne", description: "", fiche: "Cuivre patiné, verre bleuté." }, { style: "encre", autre: "" });
    expect(objet).toContain("Cuivre patiné, verre bleuté.");
    expect(objet).toContain("sans aucune couleur");
  });

  it("F10-AC37 — qualité automatique : un portrait et une image d'objet en normale ; les tailles demandées sont des multiples de 16", () => {
    expect(qualiteDeLImage("auto", "portrait")).toBe("normale");
    expect(qualiteDeLImage("auto", "objet")).toBe("normale");
    expect(qualiteDeLImage("haute", "portrait")).toBe("haute");
    for (const taille of Object.values(TAILLES_DES_IMAGES)) {
      const [l, h] = taille.split("x").map(Number);
      expect(l % 16 + (h % 16)).toBe(0);
      expect(Math.max(l, h) / Math.min(l, h)).toBeLessThanOrEqual(3);
    }
  });

  it("le portrait se télécharge sous un nom lisible", () => {
    expect(nomDeFichier("Portrait de", "Lou")).toBe("Portrait de Lou.jpg");
    expect(nomDeFichier("Image de", "la clé / d’argent ?")).toBe("Image de la clé d’argent.jpg");
  });
});
