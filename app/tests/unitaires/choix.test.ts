import { describe, expect, it } from "vitest";
import {
  ciblesDe, controlerTexte, estReserve, estVide, morceauxDe, nettoyerTexte, phraseEnMots, renvoisDe, tirerConstruction, NUMERO_VIDE,
  type Choix, type Droits, type Texte,
} from "@/domaine/copie";
import { groupesDeMelange, hasard, melangeInitial, numeroter, ouvertureDe, type PartieNumerotee, type PlanNumerote } from "@/domaine/numeros";
import { constructionsUtiles, type Construction } from "@/domaine/preparation";

/** Étape 3, lot 2 : phrases de choix, renvois et numéros — les règles sans base ni navigateur. La vue « Chemins » a ses tests dans chemins.test.ts. */

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const [S15, S16, S18, S40, S53, S55] = [15, 16, 18, 40, 53, 55].map(id);
const p = (n: number, texte: string) => ({ type: "p" as const, id: id(1000 + n), children: [{ text: texte }] });
const auto = (n: number, libelle: string, cible: string | null, construction: Construction = "neutre"): Choix => ({
  type: "choix", id: id(2000 + n), auto: true, libelle, construction, cible, children: [{ text: "" }],
});
const renvoi = (n: number, cible: string | null) => ({ type: "renvoi" as const, id: id(3000 + n), cible, children: [{ text: "" }] as [{ text: "" }] });
const perso = (n: number, libelle: string, ...enfants: (string | ReturnType<typeof renvoi>)[]): Choix => ({
  type: "choix", id: id(2000 + n), libelle, children: enfants.map((x) => (typeof x === "string" ? { text: x } : x)),
});
const numero = (table: Record<string, number>) => (cible: string | null) => (cible && table[cible] ? String(table[cible]) : NUMERO_VIDE);

describe("Phrase de choix et renvoi (F05)", () => {
  it("F05-AC10 — la phrase automatique se compose du libellé, de la construction et de la formule du livre ; changer la formule la récrit sans toucher au texte enregistré", () => {
    const choix = auto(1, "Suivre le chant", S18);
    expect(phraseEnMots(choix, "rends", numero({ [S18]: 9 }))).toBe("Suivre le chant : rends-toi au 9.");
    expect(phraseEnMots(choix, "va", numero({ [S18]: 9 }))).toBe("Suivre le chant : va au 9.");
    // Le numéro n'est écrit nulle part dans le bloc : seuls le libellé, la construction et la destination
    expect(JSON.stringify(choix)).not.toMatch(/9|rends|va au/);
    // F05-AC35 — le numéro se décale, la phrase suit, le bloc ne change pas
    expect(phraseEnMots(choix, "rends", numero({ [S18]: 24 }))).toBe("Suivre le chant : rends-toi au 24.");
  });

  it("F05-AC11, AC43 — la construction est tirée à la création puis gardée ; avec la flèche, seule la première sert", () => {
    expect(phraseEnMots(auto(1, "Suivre le chant", S18, "si"), "rends", numero({ [S18]: 9 }))).toBe("Si tu veux suivre le chant, rends-toi au 9.");
    expect(phraseEnMots(auto(1, "Prendre la clé", S18, "pour"), "rends", numero({ [S18]: 12 }))).toBe("Pour prendre la clé, rends-toi au 12.");
    expect(phraseEnMots(auto(1, "Prendre la clé", S18, "question"), "va", numero({ [S18]: 12 }))).toBe("Prendre la clé ? Va au 12.");
    // « Pour… » reste enregistrée, mais ne se lit pas avec une flèche
    expect(phraseEnMots(auto(1, "Prendre la clé", S18, "pour"), "fleche", numero({ [S18]: 12 }))).toBe("Prendre la clé → 12");
    expect(constructionsUtiles("fleche", ["neutre", "pour"])).toEqual(["neutre"]);
    expect(constructionsUtiles("rends", ["neutre", "pour"])).toEqual(["neutre", "pour"]);
    expect(tirerConstruction(["neutre", "pour", "si"], () => 0.99)).toBe("si");
    expect(tirerConstruction(["neutre"], () => 0.5)).toBe("neutre");
  });

  it("F05-AC09 — deux renvois dans une phrase personnalisée : le même texte partout, chaque numéro à sa place", () => {
    const phrase = perso(1, "La porte", "Si tu as la clé d’argent, ouvre la porte au ", renvoi(1, S53), " ; sinon, déchiffre les symboles au ", renvoi(2, S55), ".");
    expect(phraseEnMots(phrase, "rends", numero({ [S53]: 33, [S55]: 36 }))).toBe("Si tu as la clé d’argent, ouvre la porte au 33 ; sinon, déchiffre les symboles au 36.");
    // La formule du livre ne s'applique plus à une phrase personnalisée (F05-AC22)
    expect(phraseEnMots(phrase, "fleche", numero({ [S53]: 33, [S55]: 36 }))).toContain("ouvre la porte au 33");
    expect(renvoisDe(phrase).map((r) => r.cible)).toEqual([S53, S55]);
    expect(morceauxDe(phrase, "rends").filter((m) => "renvoi" in m)).toHaveLength(2);
    expect(ciblesDe([p(1, "Récit."), phrase, auto(2, "Fuir", S15), auto(3, "Attendre", null)])).toEqual([S53, S55, S15]);
  });

  it("F05-AC17 — destination à décider plus tard : la phrase affiche un renvoi vide, visible comme tel", () => {
    const choix = auto(1, "Faire demi-tour", null);
    expect(phraseEnMots(choix, "rends", numero({}))).toBe(`Faire demi-tour : rends-toi au ${NUMERO_VIDE}.`);
    expect(renvoisDe(choix)).toEqual([{ id: choix.id, cible: null, libelle: "Faire demi-tour" }]);
    // Un choix, même sans destination, n'est pas un texte vide
    expect(estVide([choix])).toBe(false);
  });

  it("F05-AC15, AC33 — le texte reçu : un renvoi n'existe que dans une phrase de choix ; une phrase sans renvoi redevient du récit ; un numéro tapé reste du texte", () => {
    const recu = nettoyerTexte([
      { type: "p", id: id(1), children: [{ text: "Lou fit un pas, " }, { type: "renvoi", id: id(2), cible: S18, children: [{ text: "" }] }, { text: "puis un autre." }] },
      { type: "choix", id: id(3), libelle: "Sans renvoi", children: [{ text: "rends-toi au 12" }] },
      { type: "choix", id: id(4), auto: true, libelle: "  Suivre   le chant ", construction: "inconnue", cible: "pas-un-uuid", couleur: "rouge", children: [{ text: "du texte glissé" }] },
      { type: "choix", id: id(5), libelle: "La porte", children: [{ text: "Va au ", bold: true }, { type: "renvoi", id: id(6), cible: S53, libelle: "Ouvrir", href: "x", children: [{ text: "x" }] }] },
    ])!;
    expect(recu[0]).toEqual({ type: "p", id: id(1), children: [{ text: "Lou fit un pas, puis un autre." }] });
    expect(recu[1]).toEqual({ type: "p", id: id(3), children: [{ text: "rends-toi au 12" }] });
    expect(recu[2]).toEqual({ type: "choix", id: id(4), auto: true, libelle: "Suivre le chant", construction: "neutre", cible: null, children: [{ text: "" }] });
    expect(recu[3]).toEqual({
      type: "choix", id: id(5), libelle: "La porte",
      children: [{ text: "Va au " }, { type: "renvoi", id: id(6), cible: S53, libelle: "Ouvrir", children: [{ text: "" }] }, { text: "" }],
    });
  });
});

describe("Qui peut changer un choix (F06.1)", () => {
  const chapitre = new Set([S15, S16, S18, S53, S55]);
  const alice: Droits = { role: "eleve", profil: "propositions", scenesDuChapitre: chapitre };
  const bilal: Droits = { role: "eleve", profil: "organisation", scenesDuChapitre: chapitre };
  const adulte: Droits = { role: "adulte" };
  const interne = auto(1, "Traverser le pont", S18);
  const raccord = auto(2, "Descendre au marais", S40);
  const mixte = perso(3, "La porte", "Va au ", renvoi(1, S53), " ou au ", renvoi(2, S40), ".");
  const avant: Texte = [p(1, "Lou fit un pas."), interne, p(2, "Puis un autre."), raccord, mixte];

  it("F06-AC45 — profil « écriture et propositions » : toute phrase de choix est préparée ; écrire autour est permis", () => {
    expect([interne, raccord, mixte].map((b) => estReserve(b, alice))).toEqual([true, true, true]);
    expect(controlerTexte(avant, [p(9, "Avant."), p(1, "Lou fit deux pas."), interne, raccord, p(8, "Entre."), mixte, p(7, "Après.")], alice)).toBeNull();
    // Remplacer « Traverser le pont » par « Nager jusqu'à l'autre rive », à destination inchangée
    expect(controlerTexte(avant, [avant[0], { ...interne, libelle: "Nager jusqu’à l’autre rive" } as Choix, avant[2], raccord, mixte], alice)).toMatch(/modifié/);
    expect(controlerTexte(avant, [avant[0], avant[2], raccord, mixte], alice)).toMatch(/supprimé/);
    expect(controlerTexte(avant, [...avant, auto(9, "Un choix de plus", S16)], alice)).toMatch(/ajouté/);
    expect(controlerTexte(avant, [avant[0], raccord, interne, mixte], alice)).toMatch(/déplacé/);
  });

  it("F06-AC46, AC13, AC52, F05-AC32 — profil « écriture et organisation » : ses choix internes se changent ; un raccord ne se crée, ne se modifie ni ne se supprime ; la phrase qui en porte un reste entière", () => {
    expect([interne, raccord, mixte].map((b) => estReserve(b, bilal))).toEqual([false, true, true]);
    // Reformuler, changer la destination dans le chapitre, supprimer, ajouter, déplacer un choix interne
    expect(controlerTexte(avant, [avant[0], { ...interne, libelle: "Franchir le pont", cible: S16 } as Choix, avant[2], raccord, mixte], bilal)).toBeNull();
    expect(controlerTexte(avant, [avant[0], avant[2], raccord, mixte, auto(9, "Revenir", S15)], bilal)).toBeNull();
    // Créer un raccord, ou faire d'un choix interne un raccord
    expect(controlerTexte(avant, [...avant, auto(9, "Filer au marais", S40)], bilal)).toMatch(/ajouté/);
    expect(controlerTexte(avant, [avant[0], { ...interne, cible: S40 } as Choix, avant[2], raccord, mixte], bilal)).toMatch(/ajouté/);
    // Reformuler la phrase qui mêle renvoi interne et raccord
    const reformulee = { ...mixte, children: [{ text: "File au " }, ...mixte.children.slice(1)] } as Choix;
    expect(controlerTexte(avant, [avant[0], interne, avant[2], raccord, reformulee], bilal)).toMatch(/modifié/);
    expect(controlerTexte(avant, [avant[0], interne, avant[2], mixte], bilal)).toMatch(/supprimé/);
  });

  it("l'adulte change tout ; en mode personnel, rien n'est réservé (F05-AC41)", () => {
    expect([interne, raccord, mixte].some((b) => estReserve(b, adulte))).toBe(false);
    expect(controlerTexte(avant, [], adulte)).toBeNull();
  });
});

describe("Ordre imprimé et numéros (F11.5)", () => {
  const scene = (n: number, extra: Partial<{ horsLivre: boolean; rangLivre: number | null; numeroFixe: number | null }> = {}) => ({
    id: id(n), horsLivre: false, rangLivre: null, numeroFixe: null, ...extra,
  });
  const partie = (n: number, scenes: ReturnType<typeof scene>[], extra: Partial<PartieNumerotee> = {}): PartieNumerotee => ({
    id: id(9000 + n), groupeAvecPrecedente: false, ouvertureSceneId: null, chapitres: [{ horsLivre: false, scenes }], ...extra,
  });
  const ordreDe = (plan: PlanNumerote) => numeroter(plan).ordre.map((x) => Number(x.slice(-4)));

  it("F11-AC16 — les parties se suivent dans l'ordre du plan ; dans une partie, l'ordre gardé n'est pas celui du plan", () => {
    const plan: PlanNumerote = {
      departSceneId: null,
      parties: [
        partie(1, [scene(1, { rangLivre: 2 }), scene(2, { rangLivre: 0 }), scene(3, { rangLivre: 1 })]),
        partie(2, [scene(4, { rangLivre: 1 }), scene(5, { rangLivre: 0 })]),
        partie(3, [scene(6, { rangLivre: 0 })]),
      ],
    };
    // L'ouverture de chaque partie — sa première scène du plan — est en tête de son groupe (F11-AC22)
    expect(ordreDe(plan)).toEqual([1, 2, 3, 4, 5, 6]);
    plan.parties[0].ouvertureSceneId = id(3);
    expect(ordreDe(plan)).toEqual([3, 2, 1, 4, 5, 6]);
    expect(ouvertureDe(plan.parties[0])).toBe(id(3));
  });

  it("F11-AC17, AC23 — parties regroupées : leurs scènes s'entremêlent, l'ouverture de la première en tête du groupe, la partie 1 avant elles", () => {
    const plan: PlanNumerote = {
      departSceneId: null,
      parties: [
        partie(1, [scene(1, { rangLivre: 0 }), scene(2, { rangLivre: 1 })]),
        partie(2, [scene(3, { rangLivre: 2 }), scene(4, { rangLivre: 0 })]),
        partie(3, [scene(5, { rangLivre: 1 }), scene(6, { rangLivre: 3 })], { groupeAvecPrecedente: true }),
      ],
    };
    expect(groupesDeMelange(plan).map((g) => g.length)).toEqual([1, 2]);
    // Groupe 2 : l'ouverture de la partie 2 (scène 3) en tête, puis 4, 5, 6 selon leurs rangs mêlés
    expect(ordreDe(plan)).toEqual([1, 2, 3, 4, 5, 6]);
    // L'ouverture de la partie 3 reste parmi les scènes mélangées
    expect(ordreDe(plan).indexOf(5)).toBeGreaterThan(ordreDe(plan).indexOf(4));
  });

  it("F11-AC18, AC20 — le départ porte le n° 1 quel que soit son rang ; une scène exclue ne reçoit pas de numéro et ne laisse pas de trou", () => {
    const plan: PlanNumerote = {
      departSceneId: id(5),
      parties: [
        partie(1, [scene(1, { rangLivre: 0 }), scene(2, { rangLivre: 1, horsLivre: true }), scene(3, { rangLivre: 2 })]),
        partie(2, [scene(4, { rangLivre: 0 }), scene(5, { rangLivre: 1 })]),
      ],
    };
    const n = numeroter(plan);
    expect(n.de.get(id(5))).toBe(1);
    expect(n.de.has(id(2))).toBe(false);
    expect(n.total).toBe(4);
    expect([...n.de.values()].sort()).toEqual([1, 2, 3, 4]);
    // Un chapitre exclu emporte ses scènes
    plan.parties[0].chapitres[0].horsLivre = true;
    expect(numeroter(plan).total).toBe(2);
  });

  it("F11-AC19 — ordre stable : rien ne bouge sans changement ; une scène ajoutée prend la suite de sa partie, les autres gardent leur ordre relatif", () => {
    const plan: PlanNumerote = {
      departSceneId: null,
      parties: [partie(1, [scene(1, { rangLivre: 1 }), scene(2, { rangLivre: 0 })]), partie(2, [scene(3, { rangLivre: 0 }), scene(4, { rangLivre: 1 })])],
    };
    const avant = numeroter(plan);
    expect(numeroter(plan).de).toEqual(avant.de);
    plan.parties[0].chapitres[0].scenes.push(scene(9, { rangLivre: 7 }));
    const apres = numeroter(plan);
    expect(apres.de.get(id(9))).toBe(3);
    expect(apres.ordre.filter((x) => x !== id(9))).toEqual(avant.ordre);
  });

  it("F05-AC06, AC07, F11-AC96 — un numéro fixé prime sur le mélange et sur les ajouts ; plus grand que le livre, il est gardé et signalé ; deux fois le même, le second est signalé", () => {
    const plan: PlanNumerote = {
      departSceneId: id(1),
      parties: [partie(1, [scene(1, { rangLivre: 0 }), scene(2, { rangLivre: 1 }), scene(3, { rangLivre: 2, numeroFixe: 2 }), scene(4, { rangLivre: 3 })])],
    };
    expect([1, 2, 3, 4].map((k) => numeroter(plan).de.get(id(k)))).toEqual([1, 3, 2, 4]);
    plan.parties[0].chapitres[0].scenes.unshift(scene(8, { rangLivre: -1 }));
    expect(numeroter(plan).de.get(id(3))).toBe(2);
    // « n° 100 fixé » dans un livre de cinq passages : il garde 100, les autres vont de 1 à 4
    plan.parties[0].chapitres[0].scenes[4].numeroFixe = 100;
    const n = numeroter(plan);
    expect(n.de.get(id(4))).toBe(100);
    expect(n.problemes).toEqual([{ sorte: "trop-grand", sceneId: id(4), numero: 100 }]);
    expect([...n.de.values()].filter((x) => x <= 5).sort()).toEqual([1, 2, 3, 4]);
    plan.parties[0].chapitres[0].scenes[2].numeroFixe = 2;
    expect(numeroter(plan).problemes.some((x) => x.sorte === "double" && x.numero === 2)).toBe(true);
  });

  it("le mélange initial tire un ordre par partie, le même pour une même graine, sans mettre côte à côte les destinations d'un même choix", () => {
    const plan: PlanNumerote = {
      departSceneId: null,
      parties: [partie(1, [1, 2, 3, 4, 5, 6].map((k) => scene(k))), partie(2, [7, 8, 9].map((k) => scene(k)))],
    };
    const a = melangeInitial(plan, [[id(2), id(3)], [id(4), id(5), id(6)]], hasard(42));
    const b = melangeInitial(plan, [[id(2), id(3)], [id(4), id(5), id(6)]], hasard(42));
    expect([...a]).toEqual([...b]);
    // Chaque partie a ses propres rangs, de 0 à n − 1
    expect([1, 2, 3, 4, 5, 6].map((k) => a.get(id(k))).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect([7, 8, 9].map((k) => a.get(id(k))).sort()).toEqual([0, 1, 2]);
    expect(Math.abs(a.get(id(2))! - a.get(id(3))!)).toBeGreaterThan(1);
    // Sur vingt graines, l'ordre du plan n'est pas la règle
    const ordres = new Set(Array.from({ length: 20 }, (_, g) => [1, 2, 3, 4, 5, 6].map((k) => melangeInitial(plan, [], hasard(g)).get(id(k))).join()));
    expect(ordres.size).toBeGreaterThan(10);
  });
});
