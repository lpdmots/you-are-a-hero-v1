import { describe, expect, it } from "vitest";
import {
  ciblesDe, controlerTexte, estReserve, estVide, liaisonsDe, nettoyerTexte, recitDe, type Bloc, type Droits, type Liaison, type Note, type Paragraphe, type Texte,
} from "@/domaine/copie";

/**
 * Étape 3, lot 3 : ce que le texte d'une scène connaît en plus du récit et des choix — le
 * paragraphe protégé (F06.1), la note de l'enseignant (F05.2), la liaison cachée (F05.1) —
 * et ce qu'un élève a le droit d'y changer.
 */

const A = "00000000-0000-4000-8000-00000000000a";
const B = "00000000-0000-4000-8000-00000000000b";
const AILLEURS = "00000000-0000-4000-8000-0000000000ff";
let n = 0;
const id = (): string => `10000000-0000-4000-8000-${String((n += 1)).padStart(12, "0")}`;
const p = (text: string): Paragraphe => ({ type: "p", id: id(), children: [{ text }] });
const protege = (text: string): Paragraphe => ({ type: "p", id: id(), protege: true, children: [{ text }] });
const note = (text: string): Note => ({ type: "note", id: id(), children: [{ text }] });
const liaison = (cible: string | null): Liaison => ({ type: "liaison", id: id(), cible, children: [{ text: "" }] });

const ADULTE: Droits = { role: "adulte" };
const ALICE: Droits = { role: "eleve", profil: "propositions", scenesDuChapitre: new Set([A, B]) };
const BILAL: Droits = { role: "eleve", profil: "organisation", scenesDuChapitre: new Set([A, B]) };

describe("Ce que le serveur laisse passer (nettoyerTexte)", () => {
  it("garde la protection d'un paragraphe, la note et sa mise en forme, la liaison cachée et son libellé", () => {
    const recu = [
      { type: "p", id: A, protege: true, couleur: "rouge", children: [{ text: "Préparé." }] },
      { type: "note", id: B, children: [{ text: "Solution : ", bold: true }, { text: "38" }], secret: true },
      { type: "liaison", id: AILLEURS, cible: A.toUpperCase(), libelle: "  Déchiffrer   les symboles ", children: [{ text: "ignoré" }] },
    ];
    expect(nettoyerTexte(recu)).toEqual([
      { type: "p", id: A, protege: true, children: [{ text: "Préparé." }] },
      { type: "note", id: B, children: [{ text: "Solution : ", bold: true }, { text: "38" }] },
      { type: "liaison", id: AILLEURS, cible: A, libelle: "Déchiffrer les symboles", children: [{ text: "" }] },
    ]);
  });

  it("« protege » ne vaut que vrai : toute autre valeur donne un paragraphe ordinaire", () => {
    const propre = nettoyerTexte([{ type: "p", id: A, protege: "oui", children: [{ text: "x" }] }, { type: "p", id: B, protege: false, children: [{ text: "y" }] }]);
    expect(propre?.map((b) => "protege" in b)).toEqual([false, false]);
  });

  it("F05.1 — les liaisons cachées sont hors du récit : rangées à la fin du texte, dans leur ordre", () => {
    const [l1, l2] = [liaison(A), liaison(B)];
    const recu = [l1, p("Un."), l2, note("Deux."), p("Trois.")];
    const propre = nettoyerTexte(recu)!;
    expect(propre.map((b) => b.type)).toEqual(["p", "note", "p", "liaison", "liaison"]);
    expect(liaisonsDe(propre).map((l) => l.id)).toEqual([l1.id, l2.id]);
    expect(recitDe(propre).map((b) => b.type)).toEqual(["p", "note", "p"]);
  });

  it("une liaison sans scène reconnaissable n'a pas de destination ; un type inconnu fait refuser le texte", () => {
    expect(nettoyerTexte([{ type: "liaison", id: A, cible: "S062" }])).toEqual([{ type: "liaison", id: A, cible: null, children: [{ text: "" }] }]);
    expect(nettoyerTexte([{ type: "secret", id: A, children: [{ text: "x" }] }])).toBeNull();
  });
});

describe("Texte vide et destinations", () => {
  it("F05-AC51 — une scène qui ne porte qu'une note, ou qu'une liaison cachée, est « Texte vide »", () => {
    expect(estVide([note("Solution : 38")])).toBe(true);
    expect(estVide([liaison(A), p("  ")])).toBe(true);
    expect(estVide([note("Solution : 38"), p("Un mot.")])).toBe(false);
    expect(estVide([protege("Préparé.")])).toBe(false);
  });

  it("la destination d'une liaison cachée compte parmi celles du texte : son numéro doit s'afficher", () => {
    expect(ciblesDe([p("Un."), liaison(A), liaison(null)])).toEqual([A]);
  });
});

describe("Ce qu'un élève a le droit de changer (F06.1)", () => {
  it("F06-AC50 — le paragraphe protégé est réservé pour les deux profils ; la note et la liaison, à l'adulte seul ; rien n'est réservé pour l'adulte", () => {
    const blocs: Bloc[] = [protege("Préparé."), note("Solution"), liaison(A), p("Libre.")];
    expect(blocs.map((b) => estReserve(b, ALICE))).toEqual([true, true, true, false]);
    expect(blocs.map((b) => estReserve(b, BILAL))).toEqual([true, true, true, false]);
    expect(blocs.map((b) => estReserve(b, ADULTE))).toEqual([false, false, false, false]);
  });

  it("F06-AC50 — écrire avant, après et entre les blocs préparés est permis ; les modifier, les supprimer, les déplacer ou en ajouter ne l'est pas", () => {
    const [un, deux, lien] = [protege("Un."), protege("Deux."), liaison(AILLEURS)];
    const avant: Texte = [un, p("Récit."), deux, lien];
    for (const droits of [ALICE, BILAL]) {
      expect(controlerTexte(avant, [p("Avant."), un, p("Entre."), deux, p("Après."), lien], droits)).toBeNull();
      expect(controlerTexte(avant, [un, deux, lien], droits)).toBeNull();
      expect(controlerTexte(avant, [{ ...un, children: [{ text: "Un, corrigé." }] }, deux, lien], droits)).toMatch(/modifié/);
      expect(controlerTexte(avant, [{ type: "p", id: un.id, children: un.children }, deux, lien], droits)).toMatch(/supprimé/);
      expect(controlerTexte(avant, [un, lien], droits)).toMatch(/supprimé/);
      expect(controlerTexte(avant, [deux, un, lien], droits)).toMatch(/modifié ou déplacé/);
      expect(controlerTexte(avant, [un, deux, lien, protege("Trois.")], droits)).toMatch(/ajouté/);
    }
  });

  it("F05-AC37, AC52 — un élève ne retire ni ne détourne une liaison cachée, et n'ajoute ni liaison ni note", () => {
    const lien = liaison(AILLEURS);
    const avant: Texte = [p("L'énigme."), lien];
    expect(controlerTexte(avant, [p("L'énigme, réécrite."), lien], BILAL)).toBeNull();
    expect(controlerTexte(avant, [p("L'énigme.")], BILAL)).toMatch(/supprimé/);
    expect(controlerTexte(avant, [p("L'énigme."), { ...lien, cible: A }], BILAL)).toMatch(/modifié/);
    expect(controlerTexte(avant, [p("L'énigme."), lien, liaison(A)], BILAL)).toMatch(/ajouté/);
    expect(controlerTexte(avant, [p("L'énigme."), note("Mot glissé"), lien], ALICE)).toMatch(/ajouté/);
  });

  it("F06-AC51 — l'adulte corrige un paragraphe protégé, retire la protection, pose notes et liaisons : rien ne lui est refusé", () => {
    const un = protege("Un.");
    expect(controlerTexte([un], [{ ...un, children: [{ text: "Un, corrigé." }] }, note("À revoir"), liaison(A)], ADULTE)).toBeNull();
    expect(controlerTexte([un], [], ADULTE)).toBeNull();
  });
});
