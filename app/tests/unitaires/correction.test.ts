import { describe, expect, it } from "vitest";
import type { Paragraphe, Texte } from "@/domaine/copie";
import {
  appliquerCorrection, changementsDe, corrigerParagraphe, paragraphesACorriger, recomposer, segmentsDe, selectionACorriger,
} from "@/domaine/correction";

/**
 * Étape 8, lot 2 : la correction d'une scène, sans fournisseur (F13.1). Ce qui part chez
 * l'aide, les changements marqués, et le texte qu'on obtient en gardant ou en refusant chacun.
 */

const p = (id: string, ...children: Paragraphe["children"]): Paragraphe => ({ type: "p", id, children });
const SCENE: Texte = [
  p("a", { text: "Le dragon dormé dans la grote. Il était très très grand." }),
  { type: "choix", id: "c", auto: true, libelle: "Entrer dans la grote", construction: "neutre", cible: "s-b", children: [{ text: "" }] },
  { type: "action", id: "j", children: [{ text: "Note la clé sur ta feuile." }] },
  { type: "note", id: "n", children: [{ text: "Bilal a oublié la grote." }] },
  p("vide", { text: "  " }),
  p("b", { text: "Lou avancé doucement." }),
];

describe("Ce qui part chez l'aide (F13.1)", () => {
  it("F13-AC03 — seuls les paragraphes de récit qui ont des mots : ni choix, ni action de jeu, ni note", () => {
    expect(paragraphesACorriger(SCENE)).toEqual([
      { id: "a", texte: "Le dragon dormé dans la grote. Il était très très grand." },
      { id: "b", texte: "Lou avancé doucement." },
    ]);
  });

  it("une sélection s'étend aux paragraphes entiers qu'elle touche ; sans récit, rien à corriger", () => {
    expect(paragraphesACorriger(SCENE, ["c", "b"]).map((x) => x.id)).toEqual(["b"]);
    expect(selectionACorriger(SCENE, ["c", "j", "n"])).toBeNull();
    expect(selectionACorriger(SCENE, ["a", "c"])).toEqual(["a"]);
  });

  it("une image sur la ligne ne part pas : seules ses lettres", () => {
    const avecImage = p("i", { text: "Tu vois " }, { type: "image-ligne", id: "im", image: "lune", alt: "lune", children: [{ text: "" }] }, { text: " la lune." });
    expect(paragraphesACorriger([avecImage])).toEqual([{ id: "i", texte: "Tu vois  la lune." }]);
  });
});

describe("Changements gardés ou refusés (F13.1, degrés 1 à 3)", () => {
  const avant = "Le dragon dormé dans la grote. Il était très très grand.";
  const apres = "Le dragon dormait dans la grotte. Il était très très grand.";

  it("F13-AC17 — au degré 1, deux changements : « dormé » devient « dormait », « grote » « grotte »", () => {
    const s = segmentsDe(avant, apres);
    expect(s.filter((x) => x.sorte === "change")).toEqual([
      { sorte: "change", n: 0, retire: "dormé ", ajoute: "dormait " },
      { sorte: "change", n: 1, retire: "grote", ajoute: "grotte" },
    ]);
  });

  it("tout gardé donne la proposition ; tout refusé, le texte d'origine ; un refus n'emporte que lui", () => {
    const s = segmentsDe(avant, apres);
    expect(recomposer(s)).toBe(apres);
    expect(recomposer(s, new Set([0, 1]))).toBe(avant);
    expect(recomposer(s, new Set([0]))).toBe("Le dragon dormé dans la grotte. Il était très très grand.");
  });

  it("un changement refusé se recompose avec l'espace du texte d'origine", () => {
    const s = segmentsDe("le pont de brume et il y avait", "le pont de brume. Il y avait");
    expect(recomposer(s)).toBe("le pont de brume. Il y avait");
    expect(recomposer(s, new Set([0]))).toBe("le pont de brume et il y avait");
  });

  it("ce qui ne se voit pas ne s'applique pas : l'apostrophe et l'espace de l'auteur restent", () => {
    const s = segmentsDe("Il n'en est pas sûr : l'eau  monte", "Il n’en est pas sûr : l’eau monte.");
    expect(recomposer(s)).toBe("Il n'en est pas sûr : l'eau  monte.");
  });

  it("un mot retiré, puis refusé ; un mot ajouté, puis refusé", () => {
    const retrait = segmentsDe("il est très très grand", "il est très grand");
    expect(recomposer(retrait)).toBe("il est très grand");
    expect(recomposer(retrait, new Set([0]))).toBe("il est très très grand");
    const ajout = segmentsDe("Il dort et il rêve", "Il dort, et il rêve");
    expect(recomposer(ajout)).toBe("Il dort, et il rêve");
    expect(recomposer(ajout, new Set([0]))).toBe("Il dort et il rêve");
  });

  it("les changements se numérotent d'un bout à l'autre de la scène", () => {
    expect(changementsDe([
      { id: "a", avant, apres },
      { id: "b", avant: "Lou avancé doucement.", apres: "Lou avançait doucement." },
    ])).toBe(3);
  });
});

describe("La mise en forme et les images sur la ligne restent (F13.1)", () => {
  it("un mot qui reste garde son italique ; un mot ajouté prend la forme de celui qui le précède", () => {
    const avant = p("a", { text: "Le " }, { text: "dragon", italic: true }, { text: " dormé dans la grote." });
    const corrige = corrigerParagraphe(avant, segmentsDe("Le dragon dormé dans la grote.", "Le dragon dormait dans la grotte."));
    expect(corrige.children).toEqual([{ text: "Le " }, { text: "dragon", italic: true }, { text: " dormait dans la grotte." }]);
    expect(corrige.id).toBe("a");
  });

  it("une image sur la ligne reste à sa place, entre deux textes", () => {
    const lune = { type: "image-ligne" as const, id: "im", image: "lune", alt: "lune", children: [{ text: "" }] as [{ text: "" }] };
    const avant = p("i", { text: "Tu vois " }, lune, { text: " la lune brillé." });
    const corrige = corrigerParagraphe(avant, segmentsDe("Tu vois  la lune brillé.", "Tu vois  la lune briller."));
    expect(corrige.children).toEqual([{ text: "Tu vois " }, lune, { text: " la lune briller." }]);
  });

  it("F13-AC03 — appliquer une correction ne touche ni au choix, ni à l'action de jeu, ni à la note, ni à l'ordre", () => {
    const apres = appliquerCorrection(SCENE, [{ id: "a", avant: "Le dragon dormé dans la grote. Il était très très grand.", apres: "Le dragon dormait dans la grotte. Il était très très grand." }]);
    expect(apres.map((b) => b.id)).toEqual(SCENE.map((b) => b.id));
    expect(apres.slice(1)).toEqual(SCENE.slice(1));
    expect(apres[0]).toEqual(p("a", { text: "Le dragon dormait dans la grotte. Il était très très grand." }));
  });
});
