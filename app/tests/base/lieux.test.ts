import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ficheDuProjet } from "@/serveur/fiche-histoire";
import { ajouterLieu, ordonnerLieux, reglerLieu, remettreLieu, supprimerLieu } from "@/serveur/lieux";
import { preparationDe } from "@/serveur/recit";
import { creerClasse, creerEnseignant, creerProjet, enseignantDe, inscrire, lire, nettoyer, posteDe, type Adulte, type ClasseEssai, type EleveEssai } from "./outils";

/**
 * Les lieux de l'étape « Univers » et la fiche de l'histoire (F02.1), contre la base locale : la
 * fiche se relit à chaque ouverture, les lieux se rangent et reviennent à leur place, et ni la
 * fiche ni les lieux ne regardent un élève ou un autre adulte.
 */

let laurent: Adulte;
let martin: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  [alice] = await inscrire(laurent, classe.id, ["Alice"]);
});
afterAll(nettoyer);

const projetDeClasse = async (recit: "choix" | "classique" = "choix") => (await creerProjet(laurent, "classe", recit, "Les passeurs de brume", classe.id)).id;
const nomsDesLieux = async (projet: string) => (await preparationDe(enseignantDe(laurent), projet))?.lieux.map((l) => l.nom);
const lieuxDeLaFiche = async (projet: string) => {
  const lue = await ficheDuProjet(enseignantDe(laurent), projet);
  const r = lue?.fiche.rubriques.find((x) => x.sorte === "lieux");
  return r && "lieux" in r ? r.lieux.map((l) => l.nom) : [];
};
const ajouter = async (projet: string, nom: string, phrase = "") => {
  const fait = await ajouterLieu(enseignantDe(laurent), projet, nom, phrase);
  if (!fait.ok) throw new Error(fait.erreur);
  return fait.lieu;
};

describe("Les lieux de l'Univers et la fiche de l'histoire (F02.1)", () => {
  it("F02-AC25 — « Le village », renommé « Le village des pêcheurs », supprimé puis « Annuler » : retrouvé sous son nouveau nom, à sa place, et dans la fiche", async () => {
    const projet = await projetDeClasse();
    await ajouter(projet, "Le port");
    const village = await ajouter(projet, "Le village", "Là où vit Lou.");
    await ajouter(projet, "Le lac");
    expect(await nomsDesLieux(projet)).toEqual(["Le port", "Le village", "Le lac"]);

    expect((await reglerLieu(enseignantDe(laurent), village.id, { nom: "  Le village   des pêcheurs " })).ok).toBe(true);
    // Un nom vidé n'est pas gardé
    expect(await reglerLieu(enseignantDe(laurent), village.id, { nom: "   " })).toEqual({ ok: false, erreur: "Donnez un nom au lieu." });

    const supprime = await supprimerLieu(enseignantDe(laurent), village.id);
    expect(supprime.ok).toBe(true);
    if (!supprime.ok) return;
    expect(await nomsDesLieux(projet)).toEqual(["Le port", "Le lac"]);

    expect((await remettreLieu(enseignantDe(laurent), projet, supprime.lieu)).ok).toBe(true);
    // Un second « Annuler » (double clic) ne le recrée pas
    expect((await remettreLieu(enseignantDe(laurent), projet, supprime.lieu)).ok).toBe(true);
    expect(await nomsDesLieux(projet)).toEqual(["Le port", "Le village des pêcheurs", "Le lac"]);
    expect((await preparationDe(enseignantDe(laurent), projet))?.lieux[1]).toEqual({ id: village.id, nom: "Le village des pêcheurs", phrase: "Là où vit Lou." });
    expect(await lieuxDeLaFiche(projet)).toEqual(["Le port", "Le village des pêcheurs", "Le lac"]);
  });

  it("F02-AC25 — l'ordre se change en tirant les lignes : la Préparation et la fiche le suivent ; un nouveau lieu vient au bout", async () => {
    const projet = await projetDeClasse();
    const [a, b, c] = [await ajouter(projet, "Le port"), await ajouter(projet, "Le lac"), await ajouter(projet, "La forêt")];
    expect((await ordonnerLieux(enseignantDe(laurent), projet, [c.id, a.id, b.id])).ok).toBe(true);
    expect(await nomsDesLieux(projet)).toEqual(["La forêt", "Le port", "Le lac"]);
    await ajouter(projet, "Le phare");
    expect(await lieuxDeLaFiche(projet)).toEqual(["La forêt", "Le port", "Le lac", "Le phare"]);
  });

  it("F02-AC22 — une fiche déjà ouverte : « Le pont de brume » ajouté dans la Préparation y figure à la réouverture, sans autre geste", async () => {
    const projet = await projetDeClasse();
    await laurent.base.from("preparations").update({ univers: "Un pays de lacs noyé dans la brume." }).eq("projet_id", projet);
    await ajouter(projet, "Le port", "D’où partent les barques.");
    expect(await lieuxDeLaFiche(projet)).toEqual(["Le port"]);
    await ajouter(projet, "Le pont de brume");
    expect(await lieuxDeLaFiche(projet)).toEqual(["Le port", "Le pont de brume"]);
  });

  it("F02-AC24 — un poste d'élève ne lit ni n'écrit les lieux, ni rien de la Préparation ; un autre adulte n'obtient pas la fiche", async () => {
    const projet = await projetDeClasse();
    const lieu = await ajouter(projet, "Le port");
    const base = await (await posteDe(classe.id, alice.inscriptionId)).base();
    for (const table of ["lieux", "preparations", "personnages", "objets"]) {
      const { lignes, refus } = await lire(base, table);
      expect(lignes, table).toEqual([]);
      expect(refus, table).not.toBeNull();
    }
    expect((await base.from("lieux").insert({ projet_id: projet, enseignant_id: laurent.id, nom: "Piraté" })).error).not.toBeNull();
    expect((await base.rpc("ordonner_lieux", { p_projet: projet, p_lieux: [lieu.id] })).error).not.toBeNull();

    // Un autre adulte : ni la fiche, ni les lieux, ni leur ordre
    expect(await ficheDuProjet(enseignantDe(martin), projet)).toBeNull();
    expect((await lire(martin.base, "lieux")).lignes).toEqual([]);
    expect((await reglerLieu(enseignantDe(martin), lieu.id, { nom: "Piraté" })).ok).toBe(false);
    expect((await ajouterLieu(enseignantDe(martin), projet, "Piraté", "")).ok).toBe(false);
    await ordonnerLieux(enseignantDe(martin), projet, [lieu.id]);
    expect(await nomsDesLieux(projet)).toEqual(["Le port"]);
  });

  it("F02-AC26 — la fiche d'un récit classique, lue dans la base, ne montre ni feuille d'aventure ni règles du jeu", async () => {
    const projet = await projetDeClasse("classique");
    await laurent.base.from("preparations").update({
      univers: "Une ville au bord de la mer.", regles: "Lance le dé.", feuille: { on: true, des: 1, sections: [{ id: "s1", type: "liste", titre: "Inventaire", lignes: 6 }] },
    }).eq("projet_id", projet);
    const lue = await ficheDuProjet(enseignantDe(laurent), projet);
    expect(lue?.fiche.rubriques.map((r) => r.sorte)).toEqual(["univers"]);
  });
});
