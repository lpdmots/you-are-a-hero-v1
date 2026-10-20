import { describe, expect, it } from "vitest";
import { AIDES_TEXTE, REGLAGES_IA_HABITUELS, lireReglagesIa, marquesDansLaCopie, niveauEnMots, qualiteDeLImage, enEtoiles, resteDEtoiles } from "@/domaine/aides-ia";
import { AIDES } from "@/serveur/ia/aides";
import { composerConsigne, consigne } from "@/serveur/ia/aides/consigne";
import { correction } from "@/serveur/ia/aides/correction";
import { ideesChoix } from "@/serveur/ia/aides/idees-choix";
import { remarqueDesPistes } from "@/serveur/ia/aides/pistes";
import { simulation } from "@/serveur/ia/demander";
import { JEU_D_ESSAI } from "../../scripts/essai-ia/jeu";
import { MODELES, MODELE_DES_AIDES, coutDe, estUnModele } from "@/serveur/ia/modeles";

/** Étape 8, lot 1 : les règles des aides IA sans fournisseur ni base (F13, cadre commun). */

const histoire = { titre: "Les passeurs de brume", mode: "classe" as const, recit: "choix" as const, niveaux: ["CM1" as const, "CM2" as const] };

describe("Réglages des aides IA (F13)", () => {
  it("F13-AC01 — sans réglage, le degré proposé est 2, « Orthographe et grammaire »", () => {
    expect(lireReglagesIa({}).degre).toBe(2);
    expect(lireReglagesIa(null)).toEqual(REGLAGES_IA_HABITUELS);
    expect(REGLAGES_IA_HABITUELS).toEqual({ degre: 2, proposer: true, niveaux: [], imagesParCreation: 1, qualite: "auto", imageALAjout: true });
  });

  it("F10-AC37 — qualité automatique : haute pour une pleine page, normale ailleurs ; un choix forcé reste forcé", () => {
    expect(qualiteDeLImage("auto", "pleine-page")).toBe("haute");
    for (const u of ["3:2", "16:9", "carre", "reperage", "portrait"] as const) expect(qualiteDeLImage("auto", u)).toBe("normale");
    expect(qualiteDeLImage("normale", "pleine-page")).toBe("normale");
    expect(qualiteDeLImage("haute", "portrait")).toBe("haute");
    expect(lireReglagesIa({ qualite: "normale" }).qualite).toBe("normale");
  });

  it("un réglage abîmé reprend sa valeur habituelle ; les niveaux gardent leur ordre", () => {
    expect(lireReglagesIa({ degre: 7, proposer: "oui", niveaux: ["CM2", "6e", "CE2"], imagesParCreation: 3, qualite: "ultra" })).toEqual({
      ...REGLAGES_IA_HABITUELS, niveaux: ["CE2", "CM2"],
    });
    expect(lireReglagesIa({ degre: 4, proposer: false, imagesParCreation: 2, qualite: "haute" })).toMatchObject({ degre: 4, proposer: false, imagesParCreation: 2, qualite: "haute" });
  });

  it("le niveau se dit en mots dans les consignes au modèle", () => {
    expect(niveauEnMots([])).toBe("élèves d'école élémentaire");
    expect(niveauEnMots(["CM2", "CM1"])).toBe("élèves de CM1 et de CM2");
    expect(niveauEnMots(["CE2", "CM1", "CM2"])).toBe("élèves de CE2, de CM1 et de CM2");
  });

  it("degrés 1 à 3 marqués dans la copie, 4 et 5 côte à côte (F13.1)", () => {
    expect([1, 2, 3, 4, 5].map((d) => marquesDansLaCopie(d as 1))).toEqual([true, true, true, false, false]);
  });
});

describe("Le solde dit à l'écran (F14-AC07)", () => {
  it("F14-AC07 — rien au-dessus de « peu », puis le solde ; rien pour le compte du porteur", () => {
    expect(resteDEtoiles(11, 10)).toBeNull();
    expect(resteDEtoiles(10, 10)).toBe("Il vous reste 10 ✦.");
    expect(resteDEtoiles(1, 10)).toBe("Il vous reste 1 ✦.");
    expect(resteDEtoiles(-2, 10)).toBe("Il ne vous reste plus d'étoiles.");
    expect(resteDEtoiles(null, 10)).toBeNull();
    expect(enEtoiles(34)).toBe("34 ✦");
    expect(enEtoiles(-3)).toBe("0 ✦");
  });
});

describe("Modèles et coût", () => {
  it("chaque aide de texte a un modèle connu, et chaque aide une définition", () => {
    for (const aide of AIDES_TEXTE) {
      expect(estUnModele(MODELE_DES_AIDES[aide])).toBe(true);
      expect(AIDES[aide].aide).toBe(aide);
    }
  });

  it("le coût se calcule d'après les jetons et le prix du modèle", () => {
    expect(coutDe("claude-sonnet-5-5", 1_000_000, 0)).toBe(MODELES["claude-sonnet-5-5"].entree);
    expect(coutDe("claude-haiku-4-5", 2000, 500)).toBeCloseTo(0.0045, 6);
  });

  it("une valeur inconnue d'IA_SIMULEE arrête tout plutôt que d'appeler un vrai fournisseur", () => {
    const avant = process.env.IA_SIMULEE;
    process.env.IA_SIMULEE = "oui";
    expect(() => simulation()).toThrow();
    process.env.IA_SIMULEE = avant;
    expect(simulation()).toBe("reponse");
  });
});

describe("Chaque aide relit sa réponse sans confiance", () => {
  it("la réponse simulée de chaque cas du jeu d'essai passe sa propre lecture", () => {
    for (const cas of JEU_D_ESSAI) {
      const def = AIDES[cas.aide];
      expect(def.lire(def.simuler(cas.entree), cas.entree), cas.id).not.toBeNull();
      expect(def.message(cas.entree).length, cas.id).toBeGreaterThan(20);
      expect(def.systeme(cas.entree).length, cas.id).toBeGreaterThan(20);
    }
  });

  it("le jeu d'essai couvre toutes les aides de texte", () => {
    expect(new Set(JEU_D_ESSAI.map((c) => c.aide))).toEqual(new Set(AIDES_TEXTE));
  });

  it("correction : autant de paragraphes qu'envoyés, sinon rien (F13.1)", () => {
    const e = { histoire, degre: 2 as const, paragraphes: ["Le dragon dormé.", "Il était grand."], consigne: null, nomsPropres: [] };
    expect(correction.lire({ paragraphes: ["Le dragon dormait."] }, e)).toBeNull();
    expect(correction.lire({ paragraphes: ["[1] Le dragon dormait.", "Il était grand."] }, e)).toEqual({ paragraphes: ["Le dragon dormait.", "Il était grand."] });
    expect(correction.lire({ paragraphes: ["Le dragon dormait.", ""] }, e)).toBeNull();
  });

  it("F13-AC18 — la consigne suit le modèle : une ou deux phrases, « Décris : », deux ou trois points", () => {
    const e = { histoire, indication: "le passeur apparaît sur le pont", voisines: [] };
    const lue = consigne.lire({ phrases: "Sur le pont de brume, une silhouette apparaît : c'est le passeur. Raconte ce qu'il dit à Lou.", points: ["– sa lanterne et son visage ;", "sa voix", "ce que ressent Lou."] }, e);
    expect(lue?.texte).toBe("Sur le pont de brume, une silhouette apparaît : c'est le passeur. Raconte ce qu'il dit à Lou.\nDécris :\n– sa lanterne et son visage ;\n– sa voix ;\n– ce que ressent Lou.");
    expect(consigne.lire({ phrases: "Raconte.", points: ["un seul point"] }, e)).toBeNull();
    expect(composerConsigne("Raconte.", ["a", "b", "c", "d"].slice(0, 3)).split("\n")).toHaveLength(5);
  });

  it("en mode personnel, une note d'intention, sans « Décris : » (F13)", () => {
    const e = { histoire: { ...histoire, mode: "personnel" as const }, indication: "la rencontre avec le passeur", voisines: [] };
    expect(consigne.lire({ phrases: "La rencontre avec le passeur ; à faire sentir : sa lanterne, sa voix, la peur de Lou.", points: [] }, e)?.texte).not.toContain("Décris");
  });

  it("idées de choix : une scène existante seulement parmi celles du chapitre ; les idées déjà montrées ne reviennent pas (F13.3)", () => {
    const e = {
      histoire, chapitre: { titre: "La lisière" }, scene: { titre: "Souche", consigne: null, paragraphes: [] },
      scenes: [{ ref: "S017", titre: "La chouette" }], objets: [], choixExistants: ["Rester caché"], dejaMontrees: ["Suivre la chouette"],
    };
    const lue = ideesChoix.lire({
      idees: [
        { libelle: "Suivre la chouette", intention: "x", scene: "S017", titre: "" },
        { libelle: "Rester caché", intention: "x", scene: "", titre: "Dans la souche" },
        { libelle: "Grimper à l'arbre", intention: "On voit loin.", scene: "S099", titre: "Au sommet de l'arbre" },
        { libelle: "Appeler la chouette", intention: "Elle revient.", scene: "s017", titre: "" },
        { libelle: "Allumer la lanterne", intention: "La lumière attire.", scene: "", titre: "La lumière dans la souche" },
        { libelle: "Sans destination", intention: "x", scene: "", titre: "" },
      ],
    }, e);
    expect(lue?.idees).toEqual([
      { libelle: "Grimper à l'arbre", intention: "On voit loin.", destination: { sorte: "nouvelle", titre: "Au sommet de l'arbre" } },
      { libelle: "Appeler la chouette", intention: "Elle revient.", destination: { sorte: "existante", ref: "S017" } },
      { libelle: "Allumer la lanterne", intention: "La lumière attire.", destination: { sorte: "nouvelle", titre: "La lumière dans la souche" } },
    ]);
  });

  it("les pistes se lisent une par ligne dans la remarque de reprise", () => {
    expect(remarqueDesPistes({ pistes: ["Dis ce que tu vois.", "Montre ta peur."] })).toBe("– Dis ce que tu vois.\n– Montre ta peur.");
  });
});

describe("Différence mot à mot d'une correction (F13.1)", () => {
  it("F13-AC17 — au degré 1, « dormé » devient « dormait » et « grote » « grotte » : deux changements, « très très » reste", async () => {
    const { difference, nombreDeChangements } = await import("@/domaine/difference");
    const d = difference("Le dragon dormé dans la grote. Il était très très grand.", "Le dragon dormait dans la grotte. Il était très très grand.");
    expect(d.map(({ sorte, texte }) => ({ sorte, texte }))).toEqual([
      { sorte: "pareil", texte: "Le dragon " },
      { sorte: "retire", texte: "dormé" },
      { sorte: "ajoute", texte: "dormait" },
      { sorte: "pareil", texte: " dans la " },
      { sorte: "retire", texte: "grote" },
      { sorte: "ajoute", texte: "grotte" },
      { sorte: "pareil", texte: ". Il était très très grand." },
    ]);
    expect(nombreDeChangements(d)).toBe(2);
  });

  it("espaces et ponctuation forment un séparateur : « brume et il » devenu « brume. Il » laisse « brume » intact", async () => {
    const { difference } = await import("@/domaine/difference");
    expect(difference("le pont de brume et il y avait", "le pont de brume. Il y avait")).toEqual([
      { sorte: "pareil", texte: "le pont de brume", avant: "le pont de brume" },
      { sorte: "retire", texte: " et il" },
      { sorte: "ajoute", texte: ". Il" },
      { sorte: "pareil", texte: " y avait", avant: " y avait" },
    ]);
  });

  it("une faute d'espacement est un changement : « range ,et » devient « range, et », « quai.Le » « quai. Le »", async () => {
    const { difference } = await import("@/domaine/difference");
    expect(difference("il le range ,et part .", "Il le range, et part.").filter((m) => m.sorte !== "pareil")).toEqual([
      { sorte: "retire", texte: "il" },
      { sorte: "ajoute", texte: "Il" },
      { sorte: "retire", texte: " ," },
      { sorte: "ajoute", texte: ", " },
      { sorte: "retire", texte: " ." },
      { sorte: "ajoute", texte: "." },
    ]);
    expect(difference("sur le quai.Le train", "sur le quai. Le train").filter((m) => m.sorte !== "pareil")).toEqual([
      { sorte: "retire", texte: "." },
      { sorte: "ajoute", texte: ". " },
    ]);
  });

  it("un mot ajouté, un mot retiré, un texte identique", async () => {
    const { difference, nombreDeChangements } = await import("@/domaine/difference");
    expect(difference("il vit une lumière", "il vit une petite lumière").filter((m) => m.sorte !== "pareil")).toEqual([{ sorte: "ajoute", texte: "petite " }]);
    expect(nombreDeChangements(difference("et puis il partit", "il partit"))).toBe(1);
    expect(difference("Rien à changer.", "Rien à changer.")).toEqual([{ sorte: "pareil", texte: "Rien à changer.", avant: "Rien à changer." }]);
  });
});

describe("Retouches des réponses, d'après le premier passage de l'essai", () => {
  it("un point de consigne commence en minuscule, sauf un nom propre", () => {
    expect(composerConsigne("Raconte.", ["La silhouette du passeur", "Lou et sa peur"])).toBe("Raconte.\nDécris :\n– la silhouette du passeur ;\n– Lou et sa peur.");
  });

  it("une partie proposée perd l'étiquette « Partie : » que certains modèles recopient", async () => {
    const { parties } = await import("@/serveur/ia/aides/plan");
    const e = { histoire, carnet: {}, plan: [], dejaMontres: [] };
    const lue = parties.lire({ ensembles: Array.from({ length: 3 }, (_, i) => ({ partie: `Partie : Le marais ${i}`, chapitre: "Chapitre 1 : Les lueurs", resume: "Lou avance." })) }, e);
    expect(lue?.ensembles[0]).toEqual({ partie: "Le marais 0", chapitre: "Les lueurs", resume: "Lou avance." });
  });
});

describe("Une apostrophe n'est pas une correction", () => {
  it("l'apostrophe courbe et l'espace insécable passent pour « pareil », chacun sous sa forme", async () => {
    const { difference } = await import("@/domaine/difference");
    expect(difference("Il n'en est pas sûr : l'eau.", "Il n’en est pas sûr : l’eau.")).toEqual([{ sorte: "pareil", texte: "Il n’en est pas sûr : l’eau.", avant: "Il n'en est pas sûr : l'eau." }]);
  });
});
