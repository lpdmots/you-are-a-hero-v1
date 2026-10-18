import { describe, expect, it } from "vitest";
import { qualiteDeLImage, TAILLES_DES_IMAGES } from "@/domaine/aides-ia";
import { descriptionDuStyle, nomDeFichier, promptDeLObjet, promptDuPortrait, STYLES, STYLES_DES_IMAGES } from "@/domaine/illustration";
import { dejaUneCarte, herosDe, lireAutresNoms, nomsPropresDeLHistoire } from "@/domaine/personnages";
import { etapeFaite, guidage, ongletDuHeros, RELANCE_DES_HEROS, type Piste, type Question } from "@/domaine/preparation";
import { blocPersonnages, histoireDuProjet, presentation } from "@/serveur/ia/aides/contexte";
import { phraseDeChoix } from "@/domaine/preparation";
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

  it("F10-AC39 — plusieurs héros sans limite, dans l'ordre des cartes ; les aides lisent leur liste, héros en tête, sans supposer comment le livre les emploie", () => {
    expect(herosDe([mael, lou, mina]).map((p) => p.nom)).toEqual(["Lou", "Mina"]);
    const bloc = blocPersonnages([mael, lou, mina]);
    expect(bloc.indexOf("Lou (héros")).toBeLessThan(bloc.indexOf("Maël"));
    expect(bloc).toContain("Lou (héros ; aussi : le garçon) : Fils du passeur ; il connaît le chant des lanternes.");
    expect(bloc).toContain("Mina (héros) : Elle sait nager.");
    // Au choix du lecteur, en groupe… : ni l'écran ni l'IA ne le supposent (18 octobre 2026)
    expect(bloc).not.toContain("choisit");
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

  it("« tu », « toi » ne sont jamais des autres noms : ils désigneraient tous les héros", () => {
    expect(lireAutresNoms("tu, le garçon, Toi, vous")).toEqual(["le garçon"]);
  });

  it("F10-AC46 — l'onglet d'un héros : sa question, ses questions et ses idées ; le premier reçoit la relance des héros et ce qui n'a pas de héros", () => {
    const carte = (id: string, nom: string, heros = true) => ({ id, nom, autresNoms: [], heros, description: "", fiche: "", portraitId: null });
    const q = (id: string, personnageId: string | null): Question => ({ id, etape: "personnages", texte: id, origine: "main", personnageId });
    const i = (id: string, personnageId: string | null): Piste => ({ id, rubrique: "personnages", texte: id, etat: "discuter", origine: "main", personnageId });
    const preparation = {
      personnagesDeLHistoire: [carte("lou", "Lou"), carte("mael", "Maël", false), carte("mina", "Mina")],
      questions: [q("q-lou", "lou"), q("q-mina", "mina"), q("q-sans", null)],
      pistes: [i("i-lou", "lou"), i("i-mina", "mina"), i("i-sans", null)],
    };
    const louOnglet = ongletDuHeros(preparation, "lou", "classe", "choix");
    expect(louOnglet.question).toBe("Qui est Lou ?");
    expect(louOnglet.relances).toEqual(["Quel âge a Lou, et que sait faire ce héros ?", "Qu’est-ce qui fait peur à Lou ?", "Qui va aider Lou, qui va lui barrer la route ?", RELANCE_DES_HEROS]);
    expect(louOnglet.relances).toContain(RELANCE_DES_HEROS);
    expect(louOnglet.questions.map((x) => x.id)).toEqual(["q-lou", "q-sans"]);
    expect(louOnglet.idees.map((x) => x.id)).toEqual(["i-lou", "i-sans"]);
    const minaOnglet = ongletDuHeros(preparation, "mina", "classe", "choix");
    expect(minaOnglet.relances).not.toContain(RELANCE_DES_HEROS);
    expect(minaOnglet.questions.map((x) => x.id)).toEqual(["q-mina"]);
    // Sans carte : « notre héros », et tout ce qui n'a pas de héros
    const vide = ongletDuHeros({ ...preparation, personnagesDeLHistoire: [] }, null, "classe", "choix");
    expect(vide.question).toBe("Qui est notre héros ?");
    expect(vide.idees.map((x) => x.id)).toEqual(["i-sans"]);
    // L'étape est faite dès qu'un héros a un texte retenu
    const sansTexte = { univers: "", personnages: "", enjeu: "", personnagesDeLHistoire: [carte("lou", "Lou")] };
    expect(etapeFaite("personnages", sansTexte, 0)).toBe(false);
    expect(etapeFaite("personnages", { ...sansTexte, personnagesDeLHistoire: [{ ...carte("lou", "Lou"), description: "Dix ans." }] }, 0)).toBe(true);
  });

  it("la relance des héros ne vaut qu'en récit à choix", () => {
    expect(guidage("personnages", "classe", "choix").relances).toContain(RELANCE_DES_HEROS);
    expect(guidage("personnages", "classe", "classique").relances).not.toContain(RELANCE_DES_HEROS);
  });
});

describe("La façon d'écrire du livre (F13, F05, 18 octobre 2026)", () => {
  it("F13-AC28 — « Pour l'IA, notre façon d'écrire » part avec chaque aide et prime sur le « tu » ; vide, rien ne s'ajoute", () => {
    const projet = { titre: "Les passeurs", organisation: "classe" as const, recit: "choix" as const, consigneEcriture: " vous, au présent " };
    const h = histoireDuProjet(projet, ["CM1"]);
    expect(presentation(h)).toContain("Façon d'écrire voulue par l'adulte, qui prime sur ce qui précède : vous, au présent");
    expect(presentation(histoireDuProjet({ ...projet, consigneEcriture: "" }, []))).not.toContain("Façon d'écrire");
  });

  it("F05-AC58 — au « vous », le renvoi dit « rendez-vous au 12 » ou « allez au 12 », et « Si tu veux » devient « Si vous voulez »", () => {
    expect(phraseDeChoix("plonger la main", 17, "rendez", "si")).toBe("Si vous voulez plonger la main, rendez-vous au 17.");
    expect(phraseDeChoix("plonger la main", 17, "allez", "neutre")).toBe("Plonger la main : allez au 17.");
    expect(phraseDeChoix("plonger la main", 17, "rends", "si")).toBe("Si tu veux plonger la main, rends-toi au 17.");
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
