import { describe, expect, it } from "vitest";
import {
  cheminsAvecLeBloc, elaguer, EXEMPLES, libelleDAjout, lireReglagesBloc, ordonnerLesChoix, resteAReprendre, retirerScene, totalDuChapitre, type Proposition,
} from "@/domaine/bloc-de-scenes";
import { blocDeScenes, lireLeBloc, simulerUnBloc, type EntreeBloc } from "@/serveur/ia/aides/bloc-de-scenes";

/** Construire dans « Chemins », lot 3 : le bloc de scènes (F13.7), ce qui se vérifie sans base ni navigateur. */

const ORIGINE = "11111111-1111-4111-8111-111111111111";
const PONT = "22222222-2222-4222-8222-222222222222";

const entree = (maj: Partial<EntreeBloc> = {}): EntreeBloc => ({
  histoire: { titre: "Les passeurs de brume", mode: "classe", recit: "choix", age: "8-10" },
  chapitre: { titre: "La lisière" },
  scenes: [
    { id: ORIGINE, ref: "S001", titre: "L’orée de la forêt", choix: [{ libelle: "Se cacher", vers: "S003" }] },
    { id: PONT, ref: "S002", titre: "Le vieux pont", choix: [] },
  ],
  origine: { id: ORIGINE, ref: "S001", titre: "L’orée de la forêt", consigne: null, paragraphes: ["Le héros arrive."] },
  demande: "trois chemins : le sentier des fougères, le ruisseau, la grotte",
  reglages: { consignes: true },
  reponses: [],
  ...maj,
});

const lu = (json: unknown, e = entree()) => lireLeBloc(json, e)!;

describe("Le bouton et la ligne du total (F13-AC34, AC35)", () => {
  it("« Ajouter 3 scènes et 3 choix », « Ajouter 4 scènes et 4 choix », « Ajouter 1 choix », « Le chapitre aura 19 scènes. »", () => {
    expect(libelleDAjout({ scenes: [1, 2, 3], choix: [1, 2, 3] })).toBe("Ajouter 3 scènes et 3 choix");
    expect(libelleDAjout({ scenes: [1, 2, 3, 4], choix: [1, 2, 3, 4] })).toBe("Ajouter 4 scènes et 4 choix");
    expect(libelleDAjout({ scenes: [], choix: [1] })).toBe("Ajouter 1 choix");
    expect(libelleDAjout({ scenes: [1], choix: [] })).toBe("Ajouter 1 scène");
    // La consigne prise pour la scène d'origine se dit aussi
    expect(libelleDAjout({ scenes: [1, 2], choix: [1, 2, 3] }, true)).toBe("Ajouter 2 scènes, 3 choix et 1 consigne");
    expect(totalDuChapitre(15, { scenes: [1, 2, 3, 4] as never })).toBe("Le chapitre aura 19 scènes.");
  });
});

describe("La réponse de l'IA, relue sans confiance (F13.7)", () => {
  it("F13-AC34 — trois chemins depuis « L'orée » : trois scènes et trois choix, rendus aux identités du chapitre", () => {
    const p = lu(simulerUnBloc(entree()));
    expect(p.origine).toBe(ORIGINE);
    expect(p.scenes.map((s) => s.titre)).toEqual(["Le sentier des fougères", "Le ruisseau", "La grotte"]);
    expect(p.choix).toHaveLength(3);
    expect(p.choix.every((c) => c.de === ORIGINE)).toBe(true);
    expect(libelleDAjout(p)).toBe("Ajouter 3 scènes et 3 choix");
  });

  it("F13-AC35 — « une scène dans la forêt avec trois choix » depuis « Le pont » : quatre scènes et quatre choix", () => {
    const e = entree({ origine: { id: PONT, ref: "S002", titre: "Le vieux pont", consigne: null, paragraphes: [] }, demande: "une scène dans la forêt avec trois choix" });
    const p = lu(simulerUnBloc(e), e);
    expect(p.scenes).toHaveLength(4);
    expect(p.choix).toHaveLength(4);
    expect(libelleDAjout(p)).toBe("Ajouter 4 scènes et 4 choix");
    // La forêt au premier niveau, ses trois destinations au second
    const foret = p.choix.find((c) => c.de === PONT)!.vers;
    expect(p.choix.filter((c) => c.de === foret)).toHaveLength(3);
  });

  it("F13-AC39 — un choix ne part que de la scène d'origine ou d'une nouvelle scène ; une scène existante se rejoint par sa référence, sans doublon", () => {
    const p = lu({
      scenes: [{ cle: "n1", titre: "La grotte.", consigne: "Raconte la grotte.", liste: ["décrire la grotte", "Montrer la peur"], inventee: false }],
      choix: [
        { de: "S001", vers: "N1", libelle: "Entrer dans la grotte.", invente: false },
        { de: "N1", vers: "S002", libelle: "Rejoindre le pont", invente: false },
        // Depuis une autre scène existante : refusé, le bloc ne la touche pas
        { de: "S002", vers: "N1", libelle: "Revenir", invente: false },
        // Vers une scène inconnue, vers soi-même, en double : refusés
        { de: "S001", vers: "S099", libelle: "Ailleurs", invente: false },
        { de: "N1", vers: "N1", libelle: "Tourner en rond", invente: false },
        { de: "S001", vers: "N1", libelle: "Entrer dans la grotte", invente: false },
      ],
      consigne_origine: { consigne: "", liste: [] }, questions: [], reste: "",
    });
    expect(p.scenes).toEqual([{ cle: "N1", titre: "La grotte", consigne: "Raconte la grotte.", liste: ["Décrire la grotte.", "Montrer la peur."], inventee: false }]);
    expect(p.choix.map((c) => [c.de, c.vers, c.libelle])).toEqual([[ORIGINE, "N1", "Entrer dans la grotte"], ["N1", PONT, "Rejoindre le pont"]]);
  });

  it("F13-AC39 — une consigne n'est proposée qu'à une scène d'origine qui n'en a pas", () => {
    const reponse = { scenes: [{ cle: "N1", titre: "La grotte", consigne: "", liste: [], inventee: false }], choix: [{ de: "S001", vers: "N1", libelle: "Entrer", invente: false }], consigne_origine: { consigne: "Raconte l’orée.", liste: ["Décrire les arbres."] }, questions: [], reste: "" };
    expect(lu(reponse).consigneOrigine).toEqual({ consigne: "Raconte l’orée.", liste: ["Décrire les arbres."] });
    const avecConsigne = entree({ origine: { ...entree().origine!, consigne: "Le héros arrive à l’orée." } });
    expect(lu(reponse, avecConsigne).consigneOrigine).toBeNull();
  });

  it("F13-AC41 — « Consignes » éteint : des titres seuls, sans consigne ni liste, pas même pour la scène d'origine ; la consigne au modèle le dit", () => {
    const e = entree({ reglages: { consignes: false } });
    const p = lu(simulerUnBloc(e), e);
    expect(p.scenes.every((s) => s.consigne === "" && s.liste.length === 0)).toBe(true);
    expect(p.consigneOrigine).toBeNull();
    // Même si le modèle en écrivait
    const bavard = lu({ scenes: [{ cle: "N1", titre: "La grotte", consigne: "Raconte.", liste: ["Décrire."], inventee: false }], choix: [{ de: "S001", vers: "N1", libelle: "Entrer", invente: false }], consigne_origine: { consigne: "Raconte.", liste: [] }, questions: [], reste: "" }, e);
    expect(bavard.scenes[0]).toMatchObject({ consigne: "", liste: [] });
    expect(blocDeScenes.systeme(e)).toContain("Ne rédige aucune consigne");
  });

  it("en mode personnel, une note d'intention sans liste de vérification", () => {
    const e = entree({ histoire: { ...entree().histoire, mode: "personnel" } });
    const p = lu({ scenes: [{ cle: "N1", titre: "La grotte", consigne: "La grotte ; à faire sentir : le froid.", liste: ["Décrire."], inventee: false }], choix: [{ de: "S001", vers: "N1", libelle: "Entrer", invente: false }], consigne_origine: { consigne: "", liste: [] }, questions: [], reste: "" }, e);
    expect(p.scenes[0]).toMatchObject({ consigne: "La grotte ; à faire sentir : le froid.", liste: [] });
    expect(blocDeScenes.systeme(e)).toContain("note d'intention");
  });

  it("une réponse inutilisable, ou un bloc vide, ne donne rien", () => {
    expect(lireLeBloc(null, entree())).toBeNull();
    expect(lireLeBloc({ scenes: [], choix: [], consigne_origine: { consigne: "", liste: [] }, questions: [], reste: "" }, entree())).toBeNull();
  });

  it("dans un chapitre vide, la première nouvelle scène est son début", () => {
    const e = entree({ origine: null, scenes: [], demande: "une scène au bord de la rivière avec deux choix" });
    const p = lu(simulerUnBloc(e), e);
    expect(p.origine).toBeNull();
    expect(p.scenes.map((s) => s.titre)).toEqual(["Bord de la rivière", "Chemin 1", "Chemin 2"]);
    expect(p.choix).toHaveLength(2);
  });
});

describe("Le bloc, retouché sur place (F13.7, « une scène proposée se retire »)", () => {
  const p: Proposition = {
    origine: ORIGINE,
    scenes: ["N1", "N2", "N3", "N4"].map((cle) => ({ cle, titre: cle, consigne: "", liste: [], inventee: false })),
    choix: [
      { cle: "C1", de: ORIGINE, vers: "N1", libelle: "a", invente: false },
      { cle: "C2", de: ORIGINE, vers: "N2", libelle: "b", invente: false },
      { cle: "C3", de: "N1", vers: "N3", libelle: "c", invente: false },
      { cle: "C4", de: "N2", vers: "N3", libelle: "d", invente: false },
      { cle: "C5", de: "N1", vers: "N4", libelle: "e", invente: false },
    ],
    consigneOrigine: null, questions: [], reste: null,
  };
  it("une scène retirée emporte ses choix, et ce qui ne tenait au bloc que par elle ; une scène encore atteinte par ailleurs reste", () => {
    const sans = retirerScene(p, "N1");
    expect(sans.scenes.map((s) => s.cle)).toEqual(["N2", "N3"]);
    expect(sans.choix.map((c) => c.cle)).toEqual(["C2", "C4"]);
  });
  it("dessiné dans le schéma : des scènes et des choix marqués, sous la scène d'origine, sans toucher aux autres", () => {
    const chemins = { noeuds: [{ id: ORIGINE, reference: 1, titre: "L’orée", etat: "cours" as const, vide: false, depart: false, fin: false, lien: "/s" }], liens: [], entrees: [] };
    const vu = cheminsAvecLeBloc(chemins, p);
    expect(vu.noeuds).toHaveLength(5);
    expect(vu.noeuds.filter((n) => n.propose).map((n) => n.id)).toEqual(["propose:N1", "propose:N2", "propose:N3", "propose:N4"]);
    expect(vu.liens.find((l) => l.id === "propose:C1")).toMatchObject({ de: ORIGINE, vers: "propose:N1", propose: true });
    expect(cheminsAvecLeBloc(chemins, null)).toBe(chemins);
  });
  it("F13-AC43 — les choix d'une rangée tirés dans un autre ordre : le texte et le schéma suivent, les autres rangées ne bougent pas", () => {
    const tire = ordonnerLesChoix(p, ORIGINE, ["C2", "C1"]);
    expect(tire.choix.map((c) => c.cle)).toEqual(["C2", "C1", "C3", "C4", "C5"]);
    const chemins = { noeuds: [{ id: ORIGINE, reference: 1, titre: "L’orée", etat: "cours" as const, vide: false, depart: false, fin: false, lien: "/s" }], liens: [], entrees: [] };
    expect(cheminsAvecLeBloc(chemins, tire).noeuds.filter((n) => n.propose).map((n) => n.id)).toEqual(["propose:N2", "propose:N1", "propose:N3", "propose:N4"]);
    expect(ordonnerLesChoix(p, "N1", ["C5", "C3"]).choix.map((c) => c.cle)).toEqual(["C1", "C2", "C5", "C4", "C3"]);
  });
  it("les bornes : huit nouvelles scènes au plus, sur deux niveaux, dans l'ordre où on les rencontre", () => {
    const scenes = Array.from({ length: 12 }, (_, i) => ({ cle: `N${i + 1}`, titre: "t", consigne: "", liste: [], inventee: false }));
    const choix = [
      ...Array.from({ length: 10 }, (_, i) => ({ cle: `A${i}`, de: ORIGINE, vers: `N${i + 1}`, libelle: "x", invente: false })),
      { cle: "B1", de: "N1", vers: "N11", libelle: "y", invente: false },
      { cle: "B2", de: "N11", vers: "N12", libelle: "z", invente: false },
    ];
    const { bloc, laisse } = elaguer({ origine: ORIGINE, scenes, choix });
    expect(bloc.scenes.map((s) => s.cle)).toEqual(["N1", "N2", "N3", "N4", "N5", "N6", "N7", "N8"]);
    expect(laisse).toBe(4);
    expect(bloc.choix.every((c) => bloc.scenes.some((s) => s.cle === c.vers))).toBe(true);
  });
});

describe("Le réglage du bloc, gardé avec le compte (F13.7)", () => {
  it("les consignes par défaut ; « Ce qui manque », retiré le 11 novembre 2026, est ignoré", () => {
    expect(lireReglagesBloc({})).toEqual({ consignes: true });
    expect(lireReglagesBloc({ manque: "completer", consignes: false })).toEqual({ consignes: false });
    expect(lireReglagesBloc({ consignes: "non" })).toEqual({ consignes: true });
    expect(lireReglagesBloc(null)).toEqual({ consignes: true });
  });
});

describe("Clarifier, affiner et recadrer (F13.7)", () => {
  const TROISIEME = "trois chemins : le sentier des fougères, le ruisseau, et un troisième";
  const reponse = (maj: Record<string, unknown>) => ({ scenes: [{ cle: "N1", titre: "Le sentier", consigne: "", liste: [], inventee: false }], choix: [{ de: "S001", vers: "N1", libelle: "Suivre le sentier", invente: false }], consigne_origine: { consigne: "", liste: [] }, questions: [], reste: "", ...maj });

  it("F13-AC36 — des questions pour affiner, avec leurs réponses toutes prêtes : trois au plus, trois réponses au plus chacune, aucune qui agrandit l'arbre ; une question déjà répondue ne revient pas", () => {
    const e = entree({ demande: TROISIEME });
    const p = lu(simulerUnBloc(e), e);
    expect(p.questions).toHaveLength(1);
    expect(p.questions[0].question).toMatch(/chemin 3/);
    expect(p.questions[0].reponses).toHaveLength(3);
    expect(p.scenes).toHaveLength(3);
    expect(lu(simulerUnBloc(entree())).questions).toEqual([]);
    const quatre = ["Un ?", "Deux ?", "Trois ?", "Quatre ?"].map((question) => ({ question, reponses: ["a", "b", "c", "d"] }));
    expect(lu(reponse({ questions: quatre })).questions).toEqual(quatre.slice(0, 3).map((q) => ({ ...q, reponses: ["a", "b", "c"] })));
    // Une question seule, sans réponses toutes prêtes, se garde : la réponse libre suffit
    expect(lu(reponse({ questions: ["Le ton ?"] })).questions).toEqual([{ question: "Le ton ?", reponses: [] }]);
    const repondu = entree({ reponses: [{ question: "Le ton ?", reponse: "Sombre" }] });
    expect(lu(reponse({ questions: [{ question: "Le ton ?", reponses: ["Sombre", "Gai"] }] }), repondu).questions).toEqual([]);
    // La consigne au modèle : une question ne propose jamais d'agrandir l'arbre, et rien n'est forcé
    const systeme = blocDeScenes.systeme(e);
    expect(systeme).toContain("elle ne propose jamais une scène, un chemin ou une suite de plus");
    expect(systeme).toContain("s'il n'y a rien d'utile à demander, la liste reste vide");
  });

  it("F13-AC37 — l'IA complète toujours : le troisième chemin est imaginé et marqué", () => {
    const e = entree({ demande: TROISIEME });
    const p = lu(simulerUnBloc(e), e);
    expect(p.scenes.find((s) => s.inventee)?.titre).toBe("Le chemin des ronces");
    expect(blocDeScenes.systeme(e)).toContain("imagine-le toi-même");
    expect(lu(reponse({ scenes: [{ cle: "N1", titre: "Le sentier", consigne: "", liste: [], inventee: true }] })).scenes[0].inventee).toBe(true);
  });

  it("F13-AC44 — affiner : la proposition à l'écran, retouchée, part avec la précision et les réponses, et se modifie sans repartir de zéro", () => {
    const e = entree({
      demande: TROISIEME,
      reponses: [{ question: "Où mène le chemin 3 ?", reponse: "Une cabane de bûcheron" }],
      precision: "le ruisseau doit être dangereux",
      actuelle: {
        origine: ORIGINE,
        scenes: [
          { cle: "N1", titre: "Le sentier des fougères", consigne: "Raconte le sentier.", liste: [], inventee: false },
          { cle: "N2", titre: "Le chemin des ronces", consigne: "", liste: [], inventee: true },
        ],
        choix: [{ cle: "C1", de: ORIGINE, vers: "N1", libelle: "Suivre", invente: false }, { cle: "C2", de: ORIGINE, vers: "N2", libelle: "Prendre les ronces", invente: true }],
        consigneOrigine: null, questions: [], reste: null,
      },
    });
    const message = blocDeScenes.message(e);
    expect(message).toContain("Réponse : Une cabane de bûcheron");
    expect(message).toContain("le ruisseau doit être dangereux");
    expect(message).toContain("N1 « Le sentier des fougères »");
    expect(message).toContain("choix « Suivre » : S001 → N1");
    expect(message).toContain("Affine la proposition actuelle");
    expect(blocDeScenes.systeme(e)).toContain("modifie seulement ce que demandent sa précision et ses réponses");
    const affinee = lu(simulerUnBloc(e), e);
    expect(affinee.scenes.map((s) => s.titre)).toEqual(["Le sentier des fougères", "Une cabane de bûcheron"]);
    expect(affinee.scenes[0].consigne).toContain("Le ruisseau doit être dangereux.");
    expect(affinee.choix.map((c) => c.libelle)).toEqual(["Suivre", "Prendre les ronces"]);
    expect(affinee.questions).toEqual([]);
  });

  it("F13-AC40 — une demande trop large : huit nouvelles scènes au plus, la phrase de ce qui reste, et ce reste repris dans le champ après l'ajout", () => {
    const e = entree({ demande: "trois chemins : le sentier, le ruisseau, la grotte puis le campement et la rivière avec leurs choix" });
    const p = lu(simulerUnBloc(e), e);
    expect(p.scenes.length).toBeLessThanOrEqual(8);
    expect(p.reste).toBe("J'ai construit trois chemins : le sentier, le ruisseau, la grotte. Reste : le campement et la rivière avec leurs choix.");
    expect(resteAReprendre(p.reste)).toBe("Le campement et la rivière avec leurs choix");
    expect(resteAReprendre("Il manque la rivière.")).toBe("Il manque la rivière.");
    expect(resteAReprendre("")).toBeNull();
    // Même si le modèle dessinait douze scènes, le bloc s'arrête à huit
    const douze = { scenes: Array.from({ length: 12 }, (_, i) => ({ cle: `N${i + 1}`, titre: `Scène ${i + 1}`, consigne: "", liste: [], inventee: false })), choix: Array.from({ length: 12 }, (_, i) => ({ de: "S001", vers: `N${i + 1}`, libelle: `Aller ${i + 1}`, invente: false })), consigne_origine: { consigne: "", liste: [] }, questions: [], reste: "Reste : la suite." };
    expect(lu(douze).scenes).toHaveLength(8);
    expect(blocDeScenes.systeme(e)).toContain("au plus 8 nouvelles scènes, sur 2 niveaux");
  });

  it("l'exemple du champ vide montre trois chemins, une jonction et une fin (les formes en exemple, retirées après la critique)", () => {
    expect(EXEMPLES).toHaveLength(3);
    expect(EXEMPLES.join(" ")).toMatch(/trois chemins[\s\S]*se rejoignent[\s\S]*une fin/);
  });
});
