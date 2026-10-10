import { describe, expect, it } from "vitest";
import {
  controlerTexte, enMots, estReserve, estVide, imagesDe, lettresDe, nettoyerTexte, phraseEnMots, type Choix, type Droits, type ImageBloc, type ImageLigne,
  type Paragraphe, type Texte,
} from "@/domaine/copie";
import { lireImage } from "@/serveur/images";

/** Étape 3, lot 5 : les images dans le texte d'une scène, en bloc ou sur la ligne (F10). */

const A = "00000000-0000-4000-8000-00000000000a";
const LUNE = "11111111-1111-4111-8111-111111111111";
const SOLEIL = "22222222-2222-4222-8222-222222222222";
let n = 0;
const id = (): string => `30000000-0000-4000-8000-${String((n += 1)).padStart(12, "0")}`;
const p = (...enfants: (string | ImageLigne)[]): Paragraphe => ({ type: "p", id: id(), children: enfants.map((x) => (typeof x === "string" ? { text: x } : x)) });
const symbole = (image: string, alt?: string): ImageLigne => ({ type: "image-ligne", id: id(), image, ...(alt ? { alt } : {}), children: [{ text: "" }] });
const figure = (image: string, plus: Partial<ImageBloc> = {}): ImageBloc => ({ type: "image", id: id(), image, largeur: 65, children: [{ text: "" }], ...plus });

const ALICE: Droits = { role: "eleve", profil: "propositions", scenesDuChapitre: new Set([A]) };
const BILAL: Droits = { role: "eleve", profil: "organisation", scenesDuChapitre: new Set([A]) };

describe("Ce que le serveur laisse passer d'une image (nettoyerTexte)", () => {
  it("l'image en bloc garde son fichier, sa largeur bornée, sa légende et son texte de remplacement ; sans fichier reconnaissable, elle est écartée", () => {
    const recu = [
      { type: "image", id: A, image: LUNE.toUpperCase(), largeur: 250, page: true, legende: "  Le pont,   dessiné par Chloé ", alt: "un pont", src: "https://ailleurs.test/x.png", children: [{ text: "x" }] },
      { type: "image", id: id(), image: "pas-une-image", largeur: 50 },
      { type: "image", id: id(), image: SOLEIL, largeur: 3 },
      { type: "image", id: id(), image: SOLEIL },
    ];
    expect(nettoyerTexte(recu)).toMatchObject([
      { type: "image", id: A, image: LUNE, largeur: 100, page: true, legende: "Le pont, dessiné par Chloé", alt: "un pont", children: [{ text: "" }] },
      { type: "image", image: SOLEIL, largeur: 15 },
      { type: "image", image: SOLEIL, largeur: 65 },
    ]);
    expect(nettoyerTexte(recu)![0]).not.toHaveProperty("src");
  });

  it("l'image sur la ligne se trouve toujours entre deux textes, dans un paragraphe de récit, une action de jeu et une phrase personnalisée ; pas dans une note", () => {
    const signe = { type: "image-ligne", id: id(), image: LUNE, alt: "lune", children: [{ text: "" }] };
    const propre = nettoyerTexte([
      { type: "p", id: id(), children: [signe, { text: "en tête", bold: true }, { ...signe, id: id() }] },
      { type: "action", id: id(), children: [{ text: "Coche ", italic: true }, { ...signe, id: id() }] },
      { type: "choix", id: id(), libelle: "La porte", children: [{ text: "Porte " }, { ...signe, id: id() }, { text: " au " }, { type: "renvoi", id: id(), cible: A, children: [{ text: "" }] }] },
      { type: "note", id: id(), children: [{ text: "Rappel " }, { ...signe, id: id() }] },
    ])!;
    const formes = propre.map((b) => (b.children as { type?: string; text?: string }[]).map((x) => x.type ?? `«${x.text}»`));
    expect(formes).toEqual([
      ["«»", "image-ligne", "«en tête»", "image-ligne", "«»"],
      ["«Coche »", "image-ligne", "«»"],
      ["«Porte »", "image-ligne", "« au »", "renvoi", "«»"],
      ["«Rappel »"],
    ]);
    // L'action de jeu n'a pas de mise en forme, le récit garde la sienne
    expect(JSON.stringify(propre[1])).not.toContain("italic");
    expect(JSON.stringify(propre[0])).toContain("bold");
  });
});

describe("Texte simple, texte vide (F10-AC32)", () => {
  it("l'image sur la ligne sort « [lune] », ou « [image] » sans texte de remplacement ; l'image en bloc ne sort pas, sa légende se cherche", () => {
    expect(lettresDe(p("Si tu choisis la porte ", symbole(LUNE, "lune"), "."))).toBe("Si tu choisis la porte [lune].");
    expect(lettresDe(p("La porte ", symbole(LUNE)))).toBe("La porte [image]");
    expect(lettresDe(figure(LUNE, { legende: "Le pont" }))).toBe("");
    expect(enMots([p("Un."), figure(LUNE, { legende: "Le pont, dessiné par Chloé" })])).toBe("Un.\nLe pont, dessiné par Chloé");
    const phrase: Choix = { type: "choix", id: id(), libelle: "La porte", children: [{ text: "Porte " }, symbole(LUNE, "lune"), { text: " : au " }, { type: "renvoi", id: id(), cible: A, children: [{ text: "" }] }, { text: "." }] };
    expect(phraseEnMots(phrase, "rends", () => "14")).toBe("Porte [lune] : au 14.");
  });

  it("une image seule fait que la scène n'est plus « Texte vide »", () => {
    expect(estVide([figure(LUNE)])).toBe(false);
    expect(estVide([p("", symbole(LUNE), "")])).toBe(false);
    expect(imagesDe([p("a", symbole(LUNE)), figure(SOLEIL), p("b")])).toEqual([LUNE, SOLEIL]);
  });
});

describe("Ce qu'un élève a le droit de changer (F10-AC28, AC33)", () => {
  it("l'image en bloc est préparée pour les deux profils : ni retirée, ni réglée, ni déplacée, ni ajoutée", () => {
    const dessin = figure(LUNE, { legende: "Le pont" });
    const avant: Texte = [p("Un."), dessin, p("Deux.")];
    for (const droits of [ALICE, BILAL]) {
      expect(estReserve(dessin, droits)).toBe(true);
      expect(controlerTexte(avant, [p("Avant."), dessin, p("Après.")], droits)).toBeNull();
      expect(controlerTexte(avant, [p("Un."), p("Deux.")], droits)).toMatch(/supprimé/);
      expect(controlerTexte(avant, [p("Un."), { ...dessin, largeur: 100 }, p("Deux.")], droits)).toMatch(/modifié/);
      expect(controlerTexte(avant, [p("Un."), { ...dessin, legende: "Mon pont" }, p("Deux.")], droits)).toMatch(/modifié/);
      expect(controlerTexte(avant, [p("Un."), dessin, p("Deux."), figure(LUNE)], droits)).toMatch(/ajouté/);
    }
  });

  it("une image sur la ligne se déplace et se retire dans les paragraphes que l'élève modifie ; aucune image qui n'était pas dans la scène n'y entre", () => {
    const avant: Texte = [p("La porte ", symbole(LUNE, "lune"), " s’ouvre."), p("Lou attend.")];
    expect(controlerTexte(avant, [p(""), p("Lou attend. La porte ", symbole(LUNE, "lune"), " s’ouvre.")], ALICE)).toBeNull();
    expect(controlerTexte(avant, [p("La porte s’ouvre."), p("Lou attend.")], ALICE)).toBeNull();
    expect(controlerTexte(avant, [p("La porte ", symbole(LUNE), " et la ", symbole(LUNE), "."), p("Lou attend.")], ALICE)).toBeNull();
    expect(controlerTexte(avant, [p("La porte ", symbole(SOLEIL), " s’ouvre."), p("Lou attend.")], ALICE)).toMatch(/image a été ajoutée/);
    // Entre couper et coller, le texte s'est enregistré sans l'image : la scène l'a retenue
    const coupe: Texte = [p(""), p("Lou attend.")];
    expect(controlerTexte(coupe, [p(""), p("Lou attend. La porte ", symbole(LUNE), ".")], ALICE)).toMatch(/image a été ajoutée/);
    expect(controlerTexte(coupe, [p(""), p("Lou attend. La porte ", symbole(LUNE), ".")], ALICE, [LUNE])).toBeNull();
    expect(controlerTexte(coupe, [p(""), p("Lou attend. La porte ", symbole(SOLEIL), ".")], BILAL, [LUNE])).toMatch(/image a été ajoutée/);
  });
});

describe("Ce que le navigateur dépose (F10-AC30, AC31)", () => {
  const octets = (...o: (number | string)[]): Uint8Array => Uint8Array.from(o.flatMap((x) => (typeof x === "string" ? [...x].map((c) => c.charCodeAt(0)) : [x])));
  it("un PNG et un WebP, qui gardent la transparence, sont reconnus avec leurs dimensions", () => {
    const png = octets(0x89, "PNG", 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, "IHDR", 0, 0, 0x04, 0xb0, 0, 0, 0x03, 0x20, 8, 6, 0, 0, 0);
    expect(lireImage(png)).toEqual({ format: "png", largeur: 1200, hauteur: 800 });
    // VP8X : largeur et hauteur moins un, sur trois octets
    const webp = octets("RIFF", 0, 0, 0, 0, "WEBP", "VP8X", 10, 0, 0, 0, 0x10, 0, 0, 0, 0xaf, 0x04, 0x00, 0x1f, 0x03, 0x00);
    expect(lireImage(webp)).toEqual({ format: "webp", largeur: 1200, hauteur: 800 });
  });

  it("ce qui n'est ni JPEG, ni PNG, ni WebP est refusé : PDF de scanner, SVG, GIF, fichier vide ou tronqué", () => {
    expect(lireImage(new TextEncoder().encode("%PDF-1.7\n%âãÏÓ"))).toBeNull();
    expect(lireImage(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg' onload='alert(1)'/>"))).toBeNull();
    expect(lireImage(new TextEncoder().encode("GIF89a\u0001\u0000\u0001\u0000"))).toBeNull();
    expect(lireImage(new Uint8Array(0))).toBeNull();
    expect(lireImage(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeNull();
  });
});
