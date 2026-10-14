import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { aTraiter, scenesAFinir } from "@/domaine/controles";
import type { Enseignant } from "@/serveur/adulte";
import { controlesDuLivre, scenesAvecActions } from "@/serveur/controles";
import { creerEnseignant, creerPartie, creerProjet, creerScene, nettoyer, type Adulte } from "./outils";

/**
 * Étape 5 du plan, lot 1 : les contrôles du livre lus par l'adulte, contre la vraie base
 * locale (F09.2, F04-AC33). La règle est celle du domaine ; ici, ce que le serveur lui donne.
 */

let laurent: Adulte;
let martin: Adulte;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
});
afterAll(nettoyer);

const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const action = (t: string) => ({ type: "action", id: randomUUID(), children: [{ text: t }] });
const ecrire = async (scene: string, texte: unknown[]) => {
  const { error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: 0, p_texte: texte });
  if (error) throw new Error(error.message);
};
const enseignant = (a: Adulte): Enseignant => ({ id: a.id, courriel: a.courriel, nomAffiche: null, dernierProjetId: null, aidesMasquees: [], supabase: a.base });

describe("Contrôles du livre lus par l'adulte (F09.2)", () => {
  it("F04-AC33 — les scènes qui portent une action de jeu se lisent sans les textes ; sans feuille d'aventure, le rappel « à savoir » est rendu, jamais parmi les points à corriger", async () => {
    const projet = await creerProjet(laurent, "personnel", "choix", "Les passeurs de brume", null);
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const [a, b, c] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
    await ecrire(a.id, [paragraphe("Lou entre dans la forêt."), action("Ajoute le couteau à ton inventaire.")]);
    await ecrire(b.id, [paragraphe("La lanterne s’éteint.")]);
    await ecrire(c.id, [action("Retire un point de volonté à ton héros.")]);

    expect(await scenesAvecActions(laurent.base, projet.id)).toEqual(new Set([a.id, c.id]));
    // Rien d'un autre adulte
    expect(await scenesAvecActions(martin.base, projet.id)).toEqual(new Set());

    const problemes = await controlesDuLivre(enseignant(laurent), projet.id);
    expect(problemes?.find((p) => p.sorte === "jeu-sans-feuille")).toMatchObject({ passages: 2, gravite: "info" });
    // Les trois scènes sont à finir ; sans départ, seul le départ manquant est à corriger
    expect(scenesAFinir(problemes!)).toEqual([a.id, b.id, c.id]);
    expect(aTraiter(problemes!).map((p) => p.sorte)).toEqual(["depart"]);

    // Une feuille d'aventure composée : plus de rappel
    const feuille = { on: true, des: 1, sections: [{ id: "inv", type: "liste", titre: "Inventaire", lignes: 6 }] };
    expect((await laurent.base.from("preparations").update({ feuille }).eq("projet_id", projet.id)).error).toBeNull();
    expect((await controlesDuLivre(enseignant(laurent), projet.id))?.some((p) => p.sorte === "jeu-sans-feuille")).toBe(false);
  });

  it("F09.2 — un projet d'un autre adulte ne se contrôle pas", async () => {
    const projet = await creerProjet(laurent, "personnel", "choix", "Le phare", null);
    expect(await controlesDuLivre(enseignant(martin), projet.id)).toBeNull();
  });
});
