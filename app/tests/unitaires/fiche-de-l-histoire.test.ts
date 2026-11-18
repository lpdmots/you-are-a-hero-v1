import { describe, expect, it } from "vitest";
import { composerLaFiche, HAUTEUR_UTILE_MM, lignesDeLaFeuille, messageDeLongueur, paginer, type MorceauMesure, type ProjetDeLaFiche } from "@/domaine/fiche-histoire";
import type { Preparation } from "@/domaine/preparation";
import { blocCarnet, carnetDe } from "@/serveur/ia/aides/contexte";

/**
 * La fiche de l'histoire à imprimer (F02.1) : ce que la Préparation retient, dans l'ordre de la
 * spécification, sans rubrique vide, sans résumé ni IA ; en récit classique, sans feuille
 * d'aventure ni règles du jeu. Les lieux de l'Univers entrent aussi dans le contexte des aides.
 */

const carnetVide: Preparation = {
  univers: "", personnages: "", enjeu: "", rubriqueJeu: false, feuille: { on: false, des: 0, sections: [] }, regles: "",
  formuleRenvoi: "rends", constructions: ["neutre"], marqueFin: "", pistes: [], questions: [], orientations: {}, objets: [], lieux: [],
  formules: [], personnagesDeLHistoire: [],
};
const classeAChoix: ProjetDeLaFiche = { titre: "Les passeurs de brume", organisation: "classe", recit: "choix", consigneEcriture: "Au présent, en « tu »." };
const carte = (id: string, nom: string, heros: boolean, description = "", portraitId: string | null = null) => ({
  id, nom, autresNoms: [] as string[], heros, description, fiche: "Cheveux roux, cape verte.", portraitId,
});

const complete: Preparation = {
  ...carnetVide,
  univers: "Un pays de lacs noyé dans la brume.",
  enjeu: "Retrouver le père de Lou avant que la dernière lanterne s’éteigne.",
  personnagesDeLHistoire: [
    { ...carte("lou", "Lou", true, "10 ans, fils du dernier passeur.", "portrait-lou"), autresNoms: ["le petit passeur"] },
    carte("mael", "Maël", false, "Le père, disparu."),
    carte("brindille", "Brindille", false, "Une chouette qui guide la nuit."),
  ],
  lieux: [
    { id: "l1", nom: "Le port", phrase: "D’où partent les barques." },
    { id: "l2", nom: "Le lac", phrase: "Couvert de brume." },
    { id: "l3", nom: "Le pont de brume", phrase: "" },
  ],
  objets: [
    { id: "o1", nom: "la lanterne", description: "Elle chasse la brume.", fiche: "", imageId: "image-lanterne" },
    { id: "o2", nom: "la carte du lac", description: "" },
  ],
  feuille: { on: true, des: 1, sections: [{ id: "s1", type: "compteurs", titre: "", compteurs: [{ id: "c1", nom: "Volonté", depart: 5 }] }, { id: "s2", type: "liste", titre: "Inventaire", lignes: 6 }] },
  regles: "Lance le dé quand le texte te le demande.",
  // Ce que la fiche ne reprend pas
  pistes: [{ id: "p1", rubrique: "univers", texte: "Une île volante", etat: "retenue", origine: "main" }],
  questions: [{ id: "q1", etape: "univers", texte: "Y a-t-il de la magie ?", origine: "main" }],
  formules: [{ id: "f1", texte: "Note le mot de passe sur ta feuille.", signe: "crayon" }],
};

describe("La fiche de l'histoire (F02.1)", () => {
  it("F02-AC21 — la fiche montre les éléments retenus dans l'ordre de F02.1, remplis, sans les grandes étapes, les idées ni les formules", () => {
    const fiche = composerLaFiche(classeAChoix, complete);
    expect(fiche.titre).toBe("Les passeurs de brume");
    expect(fiche.vide).toBeNull();
    expect(fiche.rubriques.map((r) => r.sorte)).toEqual(["univers", "enjeu", "heros", "autres", "lieux", "objets", "ecriture", "feuille", "regles"]);
    expect(fiche.rubriques.map((r) => r.titre)).toEqual([
      "L’univers", "L’enjeu", "Le héros", "Les autres personnages", "Les lieux", "Les objets", "Notre façon d’écrire", "La feuille d’aventure", "Les règles du jeu",
    ]);
    const heros = fiche.rubriques.find((r) => r.sorte === "heros");
    expect(heros && "personnages" in heros ? heros.personnages : []).toEqual([
      { id: "lou", nom: "Lou", autresNoms: ["le petit passeur"], description: "10 ans, fils du dernier passeur.", portraitId: "portrait-lou" },
    ]);
    const autres = fiche.rubriques.find((r) => r.sorte === "autres");
    expect(autres && "personnages" in autres ? autres.personnages.map((p) => p.nom) : []).toEqual(["Maël", "Brindille"]);
    const lieux = fiche.rubriques.find((r) => r.sorte === "lieux");
    expect(lieux && "lieux" in lieux ? lieux.lieux.map((l) => l.nom) : []).toEqual(["Le port", "Le lac", "Le pont de brume"]);
    const objets = fiche.rubriques.find((r) => r.sorte === "objets");
    expect(objets && "objets" in objets ? objets.objets.map((o) => [o.nom, o.imageId]) : []).toEqual([["la lanterne", "image-lanterne"], ["la carte du lac", null]]);
    expect(fiche.rubriques.find((r) => r.sorte === "feuille")).toMatchObject({ lignes: ["Volonté : 5 au départ", "Inventaire", "Un dé"] });
    // Ni idées, ni questions, ni formules, ni fiche visuelle des images
    const tout = JSON.stringify(fiche);
    for (const absent of ["Une île volante", "Y a-t-il de la magie", "Note le mot de passe", "Cheveux roux"]) expect(tout).not.toContain(absent);
  });

  it("F02-AC21 — une fiche d'une page ou de deux, recto verso, ne dit rien de sa longueur", () => {
    const texte = (haut: number, bas: number): MorceauMesure => ({ haut, bas, sorte: "texte" });
    expect(paginer([texte(0, 120)])).toEqual([]);
    expect(paginer([texte(0, HAUTEUR_UTILE_MM)])).toEqual([]);
    expect(paginer([texte(0, HAUTEUR_UTILE_MM + 40)])).toEqual([HAUTEUR_UTILE_MM]);
    expect(messageDeLongueur(1)).toBeNull();
    expect(messageDeLongueur(2)).toBeNull();
  });

  it("F02-AC23 — sans objets ni lieux, ces rubriques n'y figurent pas ; une description longue s'imprime entière ; au-delà de deux pages, un message prévient", () => {
    const longue = Array.from({ length: 60 }, (_, i) => `Phrase ${i + 1} de la description de Lou, qui ne se résume pas.`).join("\n");
    const fiche = composerLaFiche(classeAChoix, { ...complete, objets: [], lieux: [], personnagesDeLHistoire: [carte("lou", "Lou", true, longue)] });
    expect(fiche.rubriques.map((r) => r.sorte)).not.toContain("objets");
    expect(fiche.rubriques.map((r) => r.sorte)).not.toContain("lieux");
    const heros = fiche.rubriques.find((r) => r.sorte === "heros");
    expect(heros && "personnages" in heros ? heros.personnages[0].description : "").toBe(longue);
    expect(paginer([{ haut: 0, bas: 2 * HAUTEUR_UTILE_MM + 30, sorte: "texte" }])).toHaveLength(2);
    expect(messageDeLongueur(3, "Le héros")).toBe(
      "La fiche fait 3 pages : plus qu’un recto verso. Rien n’est coupé ; pour qu’elle tienne, raccourcissez un texte dans la Préparation (la rubrique la plus longue : « Le héros »).",
    );
  });

  it("F02-AC23 — une Préparation vide donne une fiche qui le dit en une phrase ; une carte de héros sans rien n'y paraît pas", () => {
    const vide = composerLaFiche({ ...classeAChoix, consigneEcriture: "" }, { ...carnetVide, personnagesDeLHistoire: [carte("h", "Le héros", true)] });
    expect(vide.rubriques).toEqual([]);
    expect(vide.vide).toBe("Cette fiche se remplit avec ce que la classe retient dans la Préparation.");
    const perso = composerLaFiche({ ...classeAChoix, organisation: "personnel", consigneEcriture: "" }, carnetVide);
    expect(perso.vide).toBe("Cette fiche se remplit avec ce que vous retenez dans la Préparation.");
  });

  it("F02-AC23 — sans carte de héros, le texte retenu de l'étape Personnages tient sa place, entier", () => {
    const fiche = composerLaFiche({ ...classeAChoix, consigneEcriture: " " }, { ...carnetVide, personnages: "Lou, 10 ans.\nSa chouette, Brindille." });
    expect(fiche.rubriques).toEqual([{ sorte: "personnages", titre: "Les personnages", texte: "Lou, 10 ans.\nSa chouette, Brindille." }]);
  });

  it("F02-AC26 — en récit classique, ni feuille d'aventure ni règles du jeu, même si elles restent écrites", () => {
    const fiche = composerLaFiche({ ...classeAChoix, recit: "classique" }, complete);
    expect(fiche.rubriques.map((r) => r.sorte)).toEqual(["univers", "enjeu", "heros", "autres", "lieux", "objets", "ecriture"]);
  });

  it("la feuille d'aventure n'entre que si elle s'imprime dans le livre, et dit ses compteurs, ses listes et ses dés", () => {
    expect(lignesDeLaFeuille({ ...complete.feuille, on: false })).toEqual([]);
    expect(lignesDeLaFeuille({ on: true, des: 2, sections: [{ id: "s", type: "compteurs", titre: "Points", compteurs: [{ id: "a", nom: "Force", depart: 3 }, { id: "b", nom: "Temps", depart: 12 }] }] })).toEqual([
      "Points — Force : 3 au départ · Temps : 12 au départ",
      "Deux dés",
    ]);
  });
});

describe("Les pages de la fiche, comme l'impression les coupe (F02.1)", () => {
  const H = HAUTEUR_UTILE_MM;
  it("un lieu, un objet ou un personnage ne se coupe pas : la page s'arrête au-dessus de lui", () => {
    expect(paginer([{ haut: 0, bas: H - 20, sorte: "texte" }, { haut: H - 10, bas: H + 15, sorte: "insecable" }])).toEqual([H - 10]);
    // Deux colonnes : la plus haute des deux cartes coupées décide
    expect(paginer([{ haut: H - 12, bas: H + 8, sorte: "insecable" }, { haut: H - 18, bas: H + 2, sorte: "insecable" }, { haut: 0, bas: H - 20, sorte: "texte" }])).toEqual([H - 18]);
  });
  it("un titre de rubrique ne reste pas seul au bas d'une page ; un paragraphe se coupe où il faut", () => {
    expect(paginer([{ haut: 0, bas: H - 12, sorte: "texte" }, { haut: H - 10, bas: H - 4, sorte: "titre" }, { haut: H - 3, bas: H + 30, sorte: "texte" }])).toEqual([H - 10]);
    expect(paginer([{ haut: 0, bas: H - 40, sorte: "texte" }, { haut: H - 38, bas: H - 32, sorte: "titre" }, { haut: H - 31, bas: H + 30, sorte: "texte" }])).toEqual([H]);
  });
  it("un élément plus haut qu'une page se coupe, faute de mieux", () => {
    expect(paginer([{ haut: 2, bas: H + 50, sorte: "insecable" }])).toEqual([H]);
  });
});

describe("Les lieux dans le contexte des aides (F02.1)", () => {
  it("F02-AC25 — les lieux de l'Univers partent avec le carnet, dans leur ordre, nom et phrase", () => {
    const parti = blocCarnet(carnetDe(complete));
    expect(parti).toContain("<lieux>");
    expect(parti).toContain("- Le port : D’où partent les barques.\n- Le lac : Couvert de brume.\n- Le pont de brume");
    expect(blocCarnet(carnetDe(carnetVide))).not.toContain("<lieux>");
  });
});
