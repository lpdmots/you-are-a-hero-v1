import { describe, expect, it } from "vitest";
import { controlerTexte, estReserve, estVide, lettresDe, nettoyerTexte, texteOuvert, type Action, type Droits, type Paragraphe, type Texte } from "@/domaine/copie";

/** Étape 3, lot 4 : l'action de jeu (F04.2) dans le texte d'une scène, et qui a le droit d'en écrire. */

const A = "00000000-0000-4000-8000-00000000000a";
let n = 0;
const id = (): string => `20000000-0000-4000-8000-${String((n += 1)).padStart(12, "0")}`;
const p = (text: string): Paragraphe => ({ type: "p", id: id(), children: [{ text }] });
const action = (text: string, protege = false): Action => ({ type: "action", id: id(), ...(protege ? { protege: true as const } : {}), children: [{ text }] });

const ADULTE: Droits = { role: "adulte" };
const ALICE: Droits = { role: "eleve", profil: "propositions", scenesDuChapitre: new Set([A]) };
const BILAL: Droits = { role: "eleve", profil: "organisation", scenesDuChapitre: new Set([A]) };

describe("Action de jeu (F04.2)", () => {
  it("son texte est libre et sans mise en forme : gras, italique et renvoi glissés par un navigateur n'y entrent pas", () => {
    const recu = [{
      type: "action", id: A, protege: true, effet: "volonte-1",
      children: [{ text: "Retire ", bold: true }, { type: "renvoi", id: A, cible: A, children: [{ text: "" }] }, { text: "un point.", italic: true }],
    }];
    expect(nettoyerTexte(recu)).toEqual([{ type: "action", id: A, protege: true, children: [{ text: "Retire un point." }] }]);
  });

  it("F04-AC40 — le signe devant l'action : le dé, le sac et le cœur sont gardés, le crayon ne s'écrit pas, un signe inconnu est écarté ; Alice ne le change pas", () => {
    const recu = (signe: unknown) => [{ type: "action", id: A, signe, children: [{ text: "Lance le dé." }] }];
    for (const signe of ["de", "sac", "coeur"]) expect(nettoyerTexte(recu(signe))).toEqual([{ type: "action", id: A, signe, children: [{ text: "Lance le dé." }] }]);
    for (const signe of ["crayon", "epee", 3, undefined]) expect(nettoyerTexte(recu(signe))).toEqual([{ type: "action", id: A, children: [{ text: "Lance le dé." }] }]);
    const posee = action("Lance le dé.");
    expect(controlerTexte([posee], [{ ...posee, signe: "de" }], ALICE)).toMatch(/modifié/);
    expect(controlerTexte([posee], [{ ...posee, signe: "de" }], BILAL)).toBeNull();
  });

  it("une action de jeu qui a des mots est du texte de la scène ; vide, elle ne compte pas", () => {
    expect(estVide([action("Ajoute le couteau à ton inventaire.")])).toBe(false);
    expect(estVide([action("  ")])).toBe(true);
    expect(lettresDe(action("Lance le dé."))).toBe("Lance le dé.");
  });

  it("F04-AC25 — préparée d'office pour « écriture et propositions » ; « écriture et organisation » l'écrit, sauf si l'enseignant l'a protégée ; rien n'est réservé pour l'adulte", () => {
    const [libre, protegee] = [action("Lance le dé."), action("Retire un point.", true)];
    expect([libre, protegee].map((b) => estReserve(b, ALICE))).toEqual([true, true]);
    expect([libre, protegee].map((b) => estReserve(b, BILAL))).toEqual([false, true]);
    expect([libre, protegee].map((b) => estReserve(b, ADULTE))).toEqual([false, false]);
  });

  it("F04-AC25, AC30 — Alice n'ajoute, ne modifie ni ne supprime une action de jeu ; Bilal en écrit, en corrige et en supprime, sans toucher à celle que l'enseignante a protégée", () => {
    const [libre, protegee] = [action("Lance le dé."), action("Retire un point.", true)];
    const avant: Texte = [p("Récit."), libre, protegee];
    expect(controlerTexte(avant, [p("Récit, repris."), libre, protegee], ALICE)).toBeNull();
    expect(controlerTexte(avant, [p("Récit."), libre, protegee, action("Gagne dix points.")], ALICE)).toMatch(/ajouté/);
    expect(controlerTexte(avant, [p("Récit."), { ...libre, children: [{ text: "Lance deux dés." }] }, protegee], ALICE)).toMatch(/modifié/);
    expect(controlerTexte(avant, [p("Récit."), protegee], ALICE)).toMatch(/supprimé/);

    expect(controlerTexte(avant, [p("Récit."), { ...libre, children: [{ text: "Lance deux dés." }] }, protegee, action("Note le numéro.")], BILAL)).toBeNull();
    expect(controlerTexte(avant, [p("Récit."), protegee], BILAL)).toBeNull();
    expect(controlerTexte(avant, [p("Récit."), libre, { ...protegee, children: [{ text: "Retire deux points." }] }], BILAL)).toMatch(/modifié/);
    expect(controlerTexte(avant, [p("Récit."), libre], BILAL)).toMatch(/supprimé/);
    // Il ne se protège pas une action lui-même
    expect(controlerTexte(avant, [p("Récit."), libre, protegee, action("À moi.", true)], BILAL)).toMatch(/ajouté/);
  });
});

describe("Scène vide", () => {
  it("le paragraphe où écrire porte une identité déduite de la scène : la même pour le serveur et le navigateur", () => {
    const scene = "5072d893-56dc-46d3-87de-5b2fb615cf3b";
    const [un] = texteOuvert([], scene);
    const [deux] = texteOuvert([], scene);
    expect(un.id).toBe(deux.id);
    expect(un.id).not.toBe(scene);
    expect(un.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    const texte = [p("Déjà écrit.")];
    expect(texteOuvert(texte, scene)).toBe(texte);
  });
});
