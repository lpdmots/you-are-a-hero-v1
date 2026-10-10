import { describe, expect, it } from "vitest";
import { enumerer, nomDeTexte } from "@/composants/copie/noms";
import { enMots, estVide, lireCollage, lireTexteSimple, memeTexte, nettoyerTexte, BLOCS_MAX, LETTRES_MAX, type Lettres } from "@/domaine/copie";
import { heureEnMots, jourEnMots } from "@/domaine/dates";
import { travailDans, type Plan, type Scene } from "@/domaine/recit";

/** Étape 3, lot 1 : les règles du texte d'une scène qui ne demandent ni base ni navigateur. */

type Noeud = { nodeType: number; nodeName: string; textContent: string | null; childNodes: Noeud[]; getAttribute: (nom: string) => string | null };
const t = (texte: string): Noeud => ({ nodeType: 3, nodeName: "#text", textContent: texte, childNodes: [], getAttribute: () => null });
const el = (nom: string, attributs: Record<string, string> | null, ...enfants: Noeud[]): Noeud => ({
  nodeType: 1, nodeName: nom.toUpperCase(), textContent: null, childNodes: enfants, getAttribute: (a) => attributs?.[a] ?? null,
});
const corps = (...enfants: Noeud[]): Noeud => el("body", null, ...enfants);
const enClair = (paragraphes: Lettres[][]): string[] =>
  paragraphes.map((p) => p.map((l) => `${l.bold ? "*" : ""}${l.italic ? "/" : ""}${l.underline ? "_" : ""}${l.text}${l.underline ? "_" : ""}${l.italic ? "/" : ""}${l.bold ? "*" : ""}`).join(""));

describe("Collage venu d'ailleurs (F04.1)", () => {
  // Un texte Word : deux paragraphes, des mots en gras, une police rouge de grande taille
  const word = corps(
    el("p", { class: "MsoNormal", style: "margin:0cm;font-size:22.0pt;font-family:'Comic Sans MS';color:red" },
      el("span", { style: "font-size:22.0pt;color:red" }, t("Le héros entre dans la "), el("b", null, t("forêt sombre")), t("."))),
    t("\n\n"),
    el("p", { class: "MsoNormal" }, el("span", { style: "color:red" }, t("Il entend un cri."))),
  );

  it("F04-AC04 — les mots, les deux paragraphes et le gras sont gardés ; police, taille et couleur ne sont pas reprises", () => {
    const lu = lireCollage(word, true);
    expect(enClair(lu.paragraphes)).toEqual(["Le héros entre dans la *forêt sombre*.", "Il entend un cri."]);
    // Rien d'autre que le texte et les trois mises en forme ne peut sortir de la lecture
    for (const lettre of lu.paragraphes.flat()) expect(Object.keys(lettre).filter((k) => !["text", "bold", "italic", "underline"].includes(k))).toEqual([]);
  });

  it("F04-AC05 — mise en forme désactivée : les mots et les paragraphes arrivent sans gras, italique ni souligné", () => {
    const riche = corps(el("p", null, el("b", null, t("gras")), t(" "), el("i", null, t("italique")), t(" "), el("u", null, t("souligné"))), el("p", null, el("strong", null, el("em", null, t("les deux")))));
    expect(enClair(lireCollage(riche, true).paragraphes)).toEqual(["*gras* /italique/ _souligné_", "*/les deux/*"]);
    const sans = lireCollage(riche, false);
    expect(sans.paragraphes).toEqual([[{ text: "gras italique souligné" }], [{ text: "les deux" }]]);
  });

  it("F04-AC35 — un titre, une liste de trois puces et un tableau de deux cellules deviennent six paragraphes ordinaires", () => {
    const complexe = corps(
      el("h1", null, t("Le titre")),
      el("ul", null, el("li", null, t("Une")), el("li", null, t("Deux")), el("li", null, el("p", null, t("Trois")))),
      el("table", null, el("tbody", null, el("tr", null, el("td", null, t("Cellule A")), el("td", null, el("p", null, t("Cellule B")))))),
    );
    const lu = lireCollage(complexe, true);
    expect(enClair(lu.paragraphes)).toEqual(["Le titre", "Une", "Deux", "Trois", "Cellule A", "Cellule B"]);
  });

  it("F04-AC36 — une image collée est écartée et comptée ; un lien se réduit à son texte ; un script n'apporte rien", () => {
    const web = corps(
      el("p", null, t("Voir "), el("a", { href: "https://exemple.test" }, t("cette page")), t(" avant.")),
      el("img", { src: "https://exemple.test/photo.jpg", alt: "Une photographie" }),
      el("script", null, t("alert(1)")),
      el("style", null, t("p{color:red}")),
    );
    const lu = lireCollage(web, true);
    expect(enClair(lu.paragraphes)).toEqual(["Voir cette page avant."]);
    expect(lu.imagesEcartees).toBe(1);
  });

  it("Google Docs écrit le gras en style, dans un <b> qui n'est pas gras ; LibreOffice écrit des <font> : seuls gras, italique et souligné passent", () => {
    const docs = corps(
      el("b", { style: "font-weight:normal", id: "docs-internal-guid-1" },
        el("p", { dir: "ltr" }, el("span", { style: "font-size:11pt;font-weight:700;color:#ff0000" }, t("Gras")), el("span", { style: "font-weight:400;font-style:italic" }, t(" penché")),
          el("span", { style: "text-decoration:underline" }, t(" souligné")), el("span", { style: "font-weight:400;text-decoration:none" }, t(" simple")))),
    );
    expect(enClair(lireCollage(docs, true).paragraphes)).toEqual(["*Gras*/ penché/_ souligné_ simple"]);
    const libre = corps(el("p", { style: "line-height:100%" }, el("font", { color: "#c9211e", face: "Liberation Serif", size: "5" }, el("b", null, t("Fort")), t(" et "), el("u", null, t("marqué")))));
    expect(enClair(lireCollage(libre, true).paragraphes)).toEqual(["*Fort* et _marqué_"]);
  });

  it("un retour à la ligne dans un paragraphe fait un paragraphe ; les espaces du balisage ne font pas de texte", () => {
    const lu = lireCollage(corps(t("\n  "), el("p", null, t("Première ligne"), el("br", null), t("Seconde ligne")), t("\n"), el("div", null, t("  \n  "))), true);
    expect(enClair(lu.paragraphes)).toEqual(["Première ligne", "Seconde ligne"]);
    expect(lireTexteSimple("Un.\r\n\r\nDeux.\n   \nTrois.")).toEqual([[{ text: "Un." }], [{ text: "Deux." }], [{ text: "Trois." }]]);
  });
});

describe("Le texte reçu d'un navigateur (F08, F04.1)", () => {
  const id = "0b2d0f6e-5c0a-4f0e-9b56-3d2f5a7c9e10";

  it("ne laisse passer que des paragraphes, leurs lettres et les trois mises en forme", () => {
    const propre = nettoyerTexte([
      { type: "p", id, style: "color:red", onclick: "x", children: [{ text: "Bonjour ", couleur: "rouge", bold: true }, { text: "à tous", bold: true, fontSize: 40 }, { text: "", italic: true }] },
    ]);
    expect(propre).toEqual([{ type: "p", id, children: [{ text: "Bonjour à tous", bold: true }] }]);
  });

  it("refuse ce qui n'est pas un texte de scène, un bloc inconnu, un texte trop long", () => {
    expect(nettoyerTexte(null)).toBeNull();
    expect(nettoyerTexte("texte")).toBeNull();
    expect(nettoyerTexte([{ type: "script", children: [{ text: "x" }] }])).toBeNull();
    expect(nettoyerTexte([["p"]])).toBeNull();
    expect(nettoyerTexte([{ type: "p", id, children: [{ text: "x".repeat(LETTRES_MAX + 1) }] }])).toBeNull();
    expect(nettoyerTexte(Array.from({ length: BLOCS_MAX + 1 }, () => ({ type: "p", children: [{ text: "" }] })))).toBeNull();
    expect(nettoyerTexte([])).toEqual([]);
  });

  it("donne à chaque bloc une identité, unique dans la scène : celle qu'il avait, sinon une neuve", () => {
    const propre = nettoyerTexte([
      { type: "p", id, children: [{ text: "Un" }] },
      { type: "p", id, children: [{ text: "Deux" }] },
      { type: "p", id: "pas-un-uuid", children: [{ text: "Trois" }] },
      { type: "p", children: [] },
    ])!;
    expect(propre[0].id).toBe(id);
    expect(new Set(propre.map((b) => b.id)).size).toBe(4);
    for (const b of propre) expect(b.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(propre[3].children).toEqual([{ text: "" }]);
  });

  it("retire les caractères de commande, garde les accents et la ponctuation", () => {
    const propre = nettoyerTexte([{ type: "p", id, children: [{ text: "L’été\u0000 à\u0007 Nîmes — « ça va ? »" }] }])!;
    expect(enMots(propre)).toBe("L’été à Nîmes — « ça va ? »");
  });

  it("« Texte vide » : aucun mot ; deux textes de même contenu sont les mêmes, quel que soit l'ordre des propriétés", () => {
    expect(estVide([])).toBe(true);
    expect(estVide(nettoyerTexte([{ type: "p", children: [{ text: "  " }] }])!)).toBe(true);
    expect(estVide(nettoyerTexte([{ type: "p", children: [{ text: "a" }] }])!)).toBe(false);
    expect(memeTexte([{ type: "p", id, children: [{ text: "a", bold: true }] }], [{ children: [{ bold: true, text: "a" }], id, type: "p" }])).toBe(true);
    expect(memeTexte([{ type: "p", id, children: [{ text: "a" }] }], [{ type: "p", id, children: [{ text: "b" }] }])).toBe(false);
  });
});

describe("Nommer un texte gardé à part (F08.1)", () => {
  const eleves = [
    { id: "a", prenom: "Alice", nom: null, couleur: 0 },
    { id: "b", prenom: "Bilal", nom: null, couleur: 1 },
  ];
  // Mardi 6 octobre 2026, 10 h 42 à Paris
  const gardeLe = "2026-10-06T08:42:00Z";

  it("F08-AC06 — « Texte de Bilal, gardé à part mardi 6 octobre », et l'élève qu'il arrête", () => {
    const n = nomDeTexte({ sorte: "refus", eleveId: "b", gardeLe }, eleves, true);
    expect(`${n.titre}, ${n.sous}`).toBe("Texte de Bilal, gardé à part mardi 6 octobre");
    expect(n.mention).toBe("tel que Bilal l’a écrit à 10 h 42");
    expect(n.arrete).toBe("Bilal");
    expect(nomDeTexte({ sorte: "refus", eleveId: "a", gardeLe }, eleves, true).titre).toBe("Texte d’Alice");
  });

  it("F08-AC21, AC29, AC30 — « Vos corrections », « Votre texte » en mode personnel, « Ancien texte de la scène » qui n'arrête personne", () => {
    expect(nomDeTexte({ sorte: "refus", eleveId: null, gardeLe }, eleves, true)).toMatchObject({ titre: "Vos corrections", sous: "gardées à part mardi 6 octobre", arrete: null });
    expect(nomDeTexte({ sorte: "refus", eleveId: null, gardeLe }, [], false)).toMatchObject({ titre: "Votre texte", sous: "gardé à part mardi 6 octobre", arrete: null });
    expect(nomDeTexte({ sorte: "ancien", eleveId: null, gardeLe }, eleves, true)).toMatchObject({ titre: "Ancien texte de la scène", mention: "tel qu’il était à 10 h 42", arrete: null });
    expect(enumerer(["Bilal"])).toBe("Bilal");
    expect(enumerer(["Bilal", "Inès"])).toBe("Bilal et Inès");
    expect(enumerer(["Bilal", "Chloé", "Inès"])).toBe("Bilal, Chloé et Inès");
  });

  it("les dates se disent à l'heure de Paris, été comme hiver", () => {
    expect(jourEnMots("2026-10-01T10:00:00Z")).toBe("jeudi 1er octobre");
    expect(jourEnMots("2026-10-06")).toBe("mardi 6 octobre");
    // 23 h 30 en temps universel, c'est déjà le lendemain à Paris
    expect(jourEnMots("2026-10-06T23:30:00Z")).toBe("mercredi 7 octobre");
    expect(heureEnMots("2026-10-06T07:05:00Z")).toBe("9 h 05");
    expect(heureEnMots("2026-12-01T07:05:00Z")).toBe("8 h 05");
  });
});

describe("Ce qu'une suppression emporterait (F03.1)", () => {
  const scene = (id: string, chapitreId: string, texteVide: boolean, ecritPar: string[] = []): Scene => ({
    id, chapitreId, reference: Number(id.slice(1)), titre: null, consigne: "", fin: false, horsLivre: false, creeParEleve: null,
    priseParEleve: null, priseParEnseignant: false, texteVide, ecritPar, rangLivre: null, numeroFixe: null,
  });
  const repere = { imageId: null, visuelChoisi: null, visuelDefaut: null };
  const plan: Plan = {
    departSceneId: null, corbeille: [], liens: [],
    parties: [{
      id: "p1", titre: "La forêt", groupeAvecPrecedente: false, ouvertureSceneId: null, ...repere,
      chapitres: [
        { id: "c1", partieId: "p1", titre: "Le sanctuaire", couleur: 0, resume: "", horsLivre: false, attributions: [], ...repere,
          scenes: [scene("s1", "c1", false, ["a"]), scene("s2", "c1", false, ["a", "b"]), scene("s3", "c1", true), scene("s4", "c1", false), scene("s5", "c1", true), scene("s6", "c1", false, ["b"])] },
        { id: "c2", partieId: "p1", titre: "La lisière", couleur: 1, resume: "", horsLivre: false, attributions: [], ...repere, scenes: [scene("s7", "c2", true)] },
      ],
    }],
  };

  it("F03-AC13, AC22 — « Le sanctuaire », six scènes dont quatre écrites, et les élèves qui y ont écrit", () => {
    expect(travailDans(plan, "chapitre", "c1")).toMatchObject({ chapitres: 1, scenes: 6, ecrites: 4, auteurs: ["a", "b"] });
    expect(travailDans(plan, "partie", "p1")).toMatchObject({ chapitres: 2, scenes: 7, ecrites: 4, auteurs: ["a", "b"] });
    expect(travailDans(plan, "scene", "s2")).toMatchObject({ chapitres: 0, scenes: 1, ecrites: 1, auteurs: ["a", "b"] });
  });

  it("F03-AC13, AC14 — le choix qui mène à ce qu'on supprime est annoncé : celui de S007 vers « Le sanctuaire », pas ceux du chapitre lui-même", () => {
    const relie: Plan = {
      ...plan,
      liens: [
        { sceneId: "s7", renvoiId: "r1", cibleId: "s2", libelle: "Entrer dans le sanctuaire", cache: false },
        { sceneId: "s1", renvoiId: "r2", cibleId: "s2", libelle: "Avancer", cache: false },
        { sceneId: "s2", renvoiId: "r3", cibleId: "s7", libelle: "Ressortir", cache: false },
      ],
    };
    expect(travailDans(relie, "chapitre", "c1").menentIci.map((s) => s.id)).toEqual(["s7"]);
    expect(travailDans(relie, "scene", "s2").menentIci.map((s) => s.id)).toEqual(["s1", "s7"]);
    // Supprimer toute la partie emporte aussi S007 : plus aucun choix du plan n'y mène
    expect(travailDans(relie, "partie", "p1").menentIci).toEqual([]);
  });

  it("un chapitre ou une scène sans texte n'emporte aucun travail : il se supprime sans confirmation", () => {
    expect(travailDans(plan, "chapitre", "c2").ecrites).toBe(0);
    expect(travailDans(plan, "scene", "s3").ecrites).toBe(0);
  });
});
