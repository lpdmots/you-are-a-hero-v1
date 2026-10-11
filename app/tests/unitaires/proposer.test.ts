import { describe, expect, it } from "vitest";
import { motsUtiles, scenesProposees } from "@/domaine/proposer";

/** Revue de l'étape 3 : les scènes proposées d'après le libellé d'un choix (F05.2). */

const scene = (id: string, titre: string | null, consigne = "") => ({ id, titre, consigne });
const LIVRE = [
  scene("s1", "Le sentier", "Lou entre dans la forêt."),
  scene("s2", "Le pont", "Lou hésite devant les cordes."),
  scene("s3", "La clairière", "Une chouette attend Lou sur une souche."),
  scene("s4", "La grotte", "Lou trouve la clé d’argent près du pont effondré."),
  scene("s5", "Les ponts de brume", "Lou choisit."),
  scene("s6", null, "Lou rebrousse chemin."),
  scene("s7", "Le gardien", "Lou affronte le gardien."),
  scene("s8", "La souche", "Lou se cache."),
];
const ids = (libelle: string) => scenesProposees(libelle, LIVRE).map((s) => s.id);

describe("Scènes proposées d'après le libellé (F05-AC56)", () => {
  it("les mots qui comptent : sans accents, sans petits mots, l'élision défaite", () => {
    expect(motsUtiles("Traverser le pont de brume")).toEqual(["traverser", "pont", "brume"]);
    expect(motsUtiles("L’entrée du bois")).toEqual(["entree", "bois"]);
    expect(motsUtiles("Y aller")).toEqual([]);
  });

  it("F05-AC56 — « Traverser le pont » propose « Le pont », puis les scènes qui en parlent : le titre avant la consigne, le pluriel compris", () => {
    expect(ids("Traverser le pont")).toEqual(["s2", "s5", "s4"]);
    // Deux mots du libellé dans un titre passent devant un seul
    expect(ids("Suivre les ponts de brume")).toEqual(["s5", "s2", "s4"]);
  });

  it("un mot que portent presque toutes les scènes ne distingue rien ; sans mot commun, rien n'est proposé", () => {
    expect(ids("Suivre Lou")).toEqual([]);
    expect(ids("Fuir")).toEqual([]);
    expect(ids("")).toEqual([]);
  });

  it("deux mots longs de même début se ressemblent : « gardienne » propose « Le gardien »", () => {
    expect(ids("Parler à la gardienne")).toEqual(["s7"]);
  });
});
