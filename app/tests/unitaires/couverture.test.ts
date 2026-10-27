import { describe, expect, it } from "vitest";
import { TAILLES_DES_IMAGES, qualiteDeLImage } from "@/domaine/aides-ia";
import {
  CASES_DE_DEPART, FORMAT_DE_LA_COUVERTURE, casesPropres, couverturePeuDefinie, faceAvantDe, pppDeLaCouverture, retenusDeLaCouverture, textesDemandes, textesDemandesPropres, textesProposes,
} from "@/domaine/couverture";
import { HEROS_ABSENT_EN_MOTS, REGLES_DE_L_IMAGE, STYLES_DES_IMAGES, promptDeCouverture, type Candidat } from "@/domaine/illustration";

/**
 * La couverture faite sur le site (F11.4, lot 1) : les textes à écrire, les deux usages, la
 * définition sur la face avant, la face avant d'une couverture entière, le prompt.
 */

const LUMINEUSE = { style: "lumineuse" as const, autre: "" };
const PAGE_DE_TITRE = { titre: "La lanterne du passeur", sousTitre: "", ligne: "La classe de CM1 de Mme Laurent", annee: "2026-2027" };

describe("Créer la couverture (F11-AC110, AC111)", () => {
  it("F11-AC110 — pour imprimer : 1824 × 2560 en qualité haute, quel que soit le réglage « Qualité des images »", () => {
    expect(TAILLES_DES_IMAGES.couverture).toBe("1824x2560");
    for (const reglage of ["auto", "normale", "haute"] as const) expect(qualiteDeLImage(reglage, "couverture")).toBe("haute");
    expect(pppDeLaCouverture(1824)).toBe(301);
    expect(couverturePeuDefinie(1824)).toBe(false);
    expect(FORMAT_DE_LA_COUVERTURE).toBe("A5 (148 × 210 mm), avec 3 mm de fonds perdus : 154 × 216 mm");
  });

  it("F11-AC110 — le prompt : les textes mot pour mot et aucun autre, le style, le héros absent, les personnages nommés avec leur fiche", () => {
    const prompt = promptDeCouverture(
      {
        titre: "La lanterne du passeur", description: "Le bac sur le lac au lever du jour, Maël à la proue.", textes: ["La lanterne du passeur"],
        retenus: [{ nom: "Maël", sorte: "personnage", fiche: "Grand, barbe grise.", reference: true }], herosAbsent: true, format: FORMAT_DE_LA_COUVERTURE,
      },
      LUMINEUSE,
    );
    expect(prompt).toContain("- « La lanterne du passeur »");
    expect(prompt).toContain("sans rien changer à leur orthographe, à leurs accents ni à leur ponctuation");
    expect(prompt).toContain("N'écrire aucun autre texte");
    expect(prompt).not.toContain(REGLES_DE_L_IMAGE);
    expect(prompt).toContain("- Maël : Grand, barbe grise. (image de référence 1)");
    expect(prompt).toContain(HEROS_ABSENT_EN_MOTS);
    expect(prompt).toContain(STYLES_DES_IMAGES.lumineuse.prompt);
    expect(prompt).toContain("154 × 216 mm");
  });

  it("F11-AC111 — pour le site : 1024 × 1440 en qualité normale, même réglée sur « haute » ; peu définie pour l'imprimeur", () => {
    expect(TAILLES_DES_IMAGES["couverture-site"]).toBe("1024x1440");
    for (const reglage of ["auto", "normale", "haute"] as const) expect(qualiteDeLImage(reglage, "couverture-site")).toBe("normale");
    expect(couverturePeuDefinie(1024)).toBe(true);
    expect(pppDeLaCouverture(1024)).toBe(169);
  });
});

describe("Les textes de la couverture (F11-AC112)", () => {
  it("F11-AC112 — au départ, le titre seul est coché ; la ligne de la classe, jamais d'office", () => {
    expect(casesPropres(null)).toEqual(CASES_DE_DEPART);
    expect(textesDemandes(CASES_DE_DEPART, textesProposes(PAGE_DE_TITRE))).toEqual(["La lanterne du passeur"]);
    expect(CASES_DE_DEPART.ligne.coche).toBe(false);
  });

  it("F11-AC112 — l'année cochée et le titre remplacé : « La lanterne » et « 2026-2027 », la page de titre inchangée ; reprendre le texte de la page de titre", () => {
    const proposes = textesProposes(PAGE_DE_TITRE);
    const cases = casesPropres({ titre: { coche: true, texte: "La lanterne" }, annee: { coche: true, texte: null } });
    expect(textesDemandes(cases, proposes)).toEqual(["La lanterne", "2026-2027"]);
    expect(proposes.titre).toBe("La lanterne du passeur");
    expect(textesDemandes({ ...cases, titre: { coche: true, texte: null } }, proposes)).toEqual(["La lanterne du passeur", "2026-2027"]);
  });

  it("F11-AC112 — « Autre texte », les cases vides, les cases abîmées", () => {
    const cases = casesPropres({ autre: { coche: true, texte: "  Un livre dont vous êtes le héros  " }, sousTitre: { coche: true, texte: null }, ligne: "oui" });
    expect(textesDemandes(cases, textesProposes(PAGE_DE_TITRE))).toEqual(["La lanterne du passeur", "Un livre dont vous êtes le héros"]);
    expect(cases.ligne).toEqual(CASES_DE_DEPART.ligne);
    expect(textesDemandesPropres(["a", 3, "  "])).toEqual(["a"]);
    expect(textesDemandesPropres(null)).toBeNull();
  });

  it("F11-AC112 — sans texte coché, le prompt garde la place du titre et ne demande aucun texte", () => {
    const prompt = promptDeCouverture({ titre: "La lanterne du passeur", description: "Le bac.", textes: [], herosAbsent: false, format: FORMAT_DE_LA_COUVERTURE }, LUMINEUSE);
    expect(prompt).toContain("Laisser de la place en haut pour le titre");
    expect(prompt).toContain(REGLES_DE_L_IMAGE);
  });
});

describe("Les portraits en référence, d'office", () => {
  const candidat = (id: string, nom: string, o: Partial<Candidat> = {}): Candidat => ({ id, sorte: "personnage", nom, autresNoms: [], heros: false, fiche: "", referenceId: `r-${id}`, ...o });
  it("ceux que nomme la description, le héros absent excepté, quatre portraits au plus", () => {
    const candidats = [
      candidat("1", "Lou", { heros: true }), candidat("2", "Maël", { autresNoms: ["le passeur"] }), candidat("3", "la lanterne de cuivre", { sorte: "objet" }),
      candidat("4", "Brindille"), candidat("5", "Anna"), candidat("6", "Zoé"), candidat("7", "Oscar"),
    ];
    const r = retenusDeLaCouverture("Lou et le passeur, sa lanterne de cuivre ; Anna, Zoé et Oscar au loin.", candidats, true);
    expect(r.retenus.map((c) => c.nom)).toEqual(["Maël", "la lanterne de cuivre", "Anna", "Zoé", "Oscar"]);
    expect(r.joints).toEqual(["2", "3", "5", "6"]);
    expect(retenusDeLaCouverture("Lou au bord du lac.", candidats, false).retenus.map((c) => c.nom)).toEqual(["Lou"]);
  });
});

describe("Importer une couverture entière (F11-AC116)", () => {
  it("F11-AC116 — une image de 3600 × 2480 est coupée à sa face avant ; une image en hauteur reste entière", () => {
    expect(faceAvantDe(3600, 2480)).toEqual({ gauche: 1872, largeur: 1728, hauteur: 2480 });
    expect(faceAvantDe(1748, 2480)).toEqual({ gauche: 0, largeur: 1748, hauteur: 2480 });
  });
});
