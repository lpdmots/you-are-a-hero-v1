import { describe, expect, it } from "vitest";
import { nettoyerTexte } from "@/domaine/copie";
import { convertir, type DonneesV0, type SceneV0 } from "../../scripts/v0/convertir";

/**
 * L'import des histoires de la V0 (npm run histoire:v0) : les cartes de la V0 deviennent des
 * phrases de choix, des actions de jeu et des images de la V1, sans rien perdre des renvois.
 */

const ID = { a: "11111111-1111-4111-8111-111111111111", b: "22222222-2222-4222-8222-222222222222", c: "33333333-3333-4333-8333-333333333333" };
const IMAGE = "44444444-4444-4444-8444-444444444444";
const bloc = (_key: string, text: string, o: Record<string, unknown> = {}) => ({ _type: "block", _key, style: "normal", children: [{ _type: "span", text, marks: [] }], ...o });

function donnees(a: Partial<SceneV0>): DonneesV0 {
  const scene = (id: string, titre: string, o: Partial<SceneV0> = {}): SceneV0 => ({ _id: id, title: titre, chapter: { _ref: "ch" }, ...o });
  return {
    histoire: {
      _id: "h", title: "Le labyrinthe", startScene: { _ref: "a" }, chapters: [{ _ref: "ch" }],
      definitions: { items: [{ key: "pioche", label: "La pioche" }], stats: [{ key: "volonte", label: "Volonté" }], skills: [{ key: "agile", label: "Agile" }] },
    },
    chapitres: [{ _id: "ch", title: "Portails", sections: [{ items: [{ scene: { _ref: "a" } }, { scene: { _ref: "b" } }, { scene: { _ref: "c" } }] }] }],
    scenes: [scene("a", "Départ", a), scene("b", "Suite", { body: [bloc("b1", "Plus loin.")], choices: [{ _key: "r", label: "Revenir", outcome: [{ _type: "outcomeDirect", toScene: { _ref: "a" } }] }] }), scene("c", "Fin", { body: [bloc("c1", "Tu as gagné."), bloc("c2", "FIN DE L'HISTOIRE")] })],
    plan: { paragraphs: [{ n: 1, scene: { _ref: "a" } }, { n: 2, scene: { _ref: "c" } }, { n: 3, scene: { _ref: "b" } }], paragraphNumberOverrides: [{ fixedN: 2, scene: { _ref: "c" } }] },
  };
}

const livre = (a: Partial<SceneV0>) =>
  convertir(donnees(a), { scene: (v0) => ID[v0 as keyof typeof ID] ?? null, image: () => IMAGE, titresDesParties: ["Première partie"] });
const premiere = (a: Partial<SceneV0>) => livre(a).parties[0].chapitres[0].scenes[0];

describe("histoire de la V0", () => {
  it("une phrase écrite à la main garde son texte, ses renvois dans l'ordre et perd ses étoiles", () => {
    const s = premiere({
      body: [{ _type: "outcomeCard", _key: "k", choiceKey: "x", mode: "custom", customText: "Si tu es agile, **va au** [§1]. Sinon, retourne au [§2]." }],
      choices: [{ _key: "x", label: "Sauter", outcome: [{ _type: "outcomeBranch", branches: [{ toScene: { _ref: "b" } }], defaultToScene: { _ref: "c" } }] }],
    });
    const choix = s.texte[0] as unknown as { type: string; children: { type?: string; text?: string; cible?: string }[] };
    expect(choix.type).toBe("choix");
    expect(choix.children.filter((e) => e.type === "renvoi").map((e) => e.cible)).toEqual([ID.b, ID.c]);
    expect(choix.children.map((e) => e.text ?? "").join("")).toBe("Si tu es agile, va au . Sinon, retourne au .");
    expect(nettoyerTexte(s.texte)).toHaveLength(1);
  });

  it("un choix direct au libellé parlant devient une phrase automatique ; « Continuer » un simple renvoi", () => {
    const s = premiere({
      body: [{ _type: "outcomeCard", _key: "k1", choiceKey: "x", mode: "auto" }, { _type: "outcomeCard", _key: "k2", choiceKey: "y", mode: "auto" }],
      choices: [
        { _key: "x", label: "Ouvrir la porte", outcome: [{ _type: "outcomeDirect", toScene: { _ref: "b" } }] },
        { _key: "y", label: "Continuer", outcome: [{ _type: "outcomeDirect", toScene: { _ref: "c" } }] },
      ],
    });
    expect(s.texte[0]).toMatchObject({ type: "choix", auto: true, libelle: "Ouvrir la porte", cible: ID.b });
    expect(s.texte[1]).toMatchObject({ type: "choix", libelle: "Continuer", children: [{ text: "Rends-toi au " }, { type: "renvoi", cible: ID.c }, { text: "." }] });
  });

  it("une condition que la V0 vérifiait s'écrit en toutes lettres", () => {
    const s = premiere({
      body: [{ _type: "outcomeCard", _key: "k", choiceKey: "x", mode: "auto" }, { _type: "effectCard", _key: "e", stableId: "effect:f", mode: "auto" }],
      choices: [{ _key: "x", label: "Attraper", outcome: [{ _type: "outcomeBranch", branches: [{ when: { rules: [{ kind: "skillGte", key: "agile", value: "true" }] }, toScene: { _ref: "b" } }], defaultToScene: { _ref: "c" } }] }],
      effects: [{ _key: "f", kind: "decStat", payload: { statKey: "volonte", value: "1" }, condition: { rules: [{ kind: "hasItem", key: "pioche" }] } }],
    });
    const mots = (b: unknown) => (b as { children: { text?: string }[] }).children.map((e) => e.text ?? "").join("");
    expect(mots(s.texte[0])).toBe("Si ton héros est agile, va au . Sinon, va au .");
    expect(s.texte[1]).toMatchObject({ type: "action", signe: "coeur", children: [{ text: "Si tu as la pioche, retire 1 point de volonté." }] });
  });

  it("un jet de dé que la V0 calculait se lit comme les jets écrits à la main", () => {
    const s = premiere({
      choices: [{ _key: "x", label: "Entrer", outcome: [{ _type: "outcomeDiceCheck", dc: 4, bonusComponents: [{ kind: "skill", key: "agile", value: 1 }], successToScene: { _ref: "b" }, failToScene: { _ref: "c" } }] }],
    });
    const choix = s.texte[0] as unknown as { children: { type?: string; text?: string; cible?: string }[] };
    expect(choix.children.map((e) => e.text ?? "").join("")).toBe("Fais un jet de agile : lance le dé et ajoute ton bonus. Si ton total est de 4 ou plus, va au . Sinon, va au .");
    expect(choix.children.filter((e) => e.type === "renvoi").map((e) => e.cible)).toEqual([ID.b, ID.c]);
  });

  it("une énigme à numéro devient une liaison cachée ; un « [§] » resté dans le récit, un renvoi", () => {
    const l = convertir(donnees({ body: [bloc("a1", "Si tu te trompes, retourne au [§].")] }), {
      scene: (v0) => ID[v0 as keyof typeof ID] ?? null, image: () => IMAGE, titresDesParties: [],
      corrections: { liaisons: [{ de: "a", vers: "c", libelle: "Taper le code" }], renvoisDuTexte: [{ scene: "a", vers: ["b"] }] },
    });
    const a = l.parties[0].chapitres[0].scenes[0];
    expect(a.texte.map((b) => b.type)).toEqual(["choix", "liaison"]);
    expect(a.texte[1]).toMatchObject({ cible: ID.c, libelle: "Taper le code" });
    expect(a.fin).toBe(false);
  });

  it("le livre garde les numéros de la V0, et une fin perd son « FIN DE L'HISTOIRE » au profit de la marque de fin", () => {
    const l = livre({ body: [bloc("a1", "Début.", { listItem: "bullet" })], images: [{ _key: "i", image: { asset: { _ref: "image-x-10x10-png" } } }] });
    const [a, b, c] = l.parties[0].chapitres[0].scenes;
    expect(a.texte[0]).toMatchObject({ type: "p", children: [{ text: "• " }, { text: "Début." }] });
    expect([a.numeroV0, b.numeroV0, c.numeroV0]).toEqual([1, 3, 2]);
    expect(c).toMatchObject({ fin: true, numeroFixe: 2 });
    expect(c.texte).toHaveLength(1);
    expect(l.parties[0].ouvertureV0).toBe("a");
  });
});
