import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, nettoyer, posteDe, type Adulte, type ClasseEssai,
  type EleveEssai,
} from "./outils";

/**
 * Étape 3 du plan, lot 4 : ce qu'un poste d'élève lit des objets de l'histoire et des
 * formules d'action (F04.2), contre la vraie base locale. Les deux listes sont tenues par
 * l'adulte dans la préparation, que les élèves n'ouvrent pas.
 */

let laurent: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;
let chloe: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  classe = await creerClasse(laurent);
  [alice, bilal, chloe] = await inscrire(laurent, classe.id, ["Alice", "Bilal", "Chloé"]);
});
afterAll(nettoyer);

type Jeu = { objets: { nom: string; description: string }[]; formules: { texte: string; signe: string }[] } | null;

async function recit(sorte: "choix" | "classique" = "choix") {
  const projet = await creerProjet(laurent, "classe", sorte, "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const scene = await creerScene(laurent.base, chapitreId);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  await attribuer(laurent, sanctuaire, [{ eleve: chloe.id }]);
  for (const [nom, description] of [["la clé d’argent", "Ouvre la porte"], ["le couteau", ""]]) {
    expect((await laurent.base.from("objets").insert({ projet_id: projet.id, enseignant_id: laurent.id, nom, description })).error).toBeNull();
  }
  expect((await laurent.base.from("formules").insert({ projet_id: projet.id, enseignant_id: laurent.id, texte: "Retire un point de volonté à ton héros." })).error).toBeNull();
  return { projet: projet.id, scene: scene.id };
}
const jeuDe = async (eleve: EleveEssai, scene: string): Promise<Jeu> => {
  const poste = await posteDe(classe.id, eleve.inscriptionId);
  const { data, error } = await (await poste.base()).rpc("jeu_de_la_scene", { p_scene: scene });
  if (error) throw new Error(error.message);
  return data as Jeu;
};

describe("Objets et formules lus par un poste (F04.2)", () => {
  it("F04-AC28 — Alice lit les objets, noms et descriptions, dans l'ordre de la liste ; les formules ne lui sont pas envoyées : elle n'écrit pas d'action de jeu", async () => {
    const r = await recit();
    const jeu = await jeuDe(alice, r.scene);
    expect(jeu?.objets.map((o) => [o.nom, o.description])).toEqual([["la clé d’argent", "Ouvre la porte"], ["le couteau", ""]]);
    expect(jeu?.formules).toEqual([]);
  });

  it("F04-AC25 — Bilal, « écriture et organisation », reçoit aussi les formules d'action", async () => {
    const r = await recit();
    expect((await jeuDe(bilal, r.scene))?.formules.map((f) => f.texte)).toEqual(["Retire un point de volonté à ton héros."]);
  });

  it("F04-AC41 — une formule porte son signe : le crayon quand rien n'est dit, le dé si l'enseignante le choisit ; Bilal le reçoit avec la formule ; un signe inconnu est refusé", async () => {
    const r = await recit();
    expect((await laurent.base.from("formules").insert({ projet_id: r.projet, enseignant_id: laurent.id, texte: "Lance le dé.", signe: "de" })).error).toBeNull();
    expect((await laurent.base.from("formules").insert({ projet_id: r.projet, enseignant_id: laurent.id, texte: "Frappe.", signe: "epee" })).error).not.toBeNull();
    expect((await jeuDe(bilal, r.scene))?.formules).toMatchObject([
      { texte: "Retire un point de volonté à ton héros.", signe: "crayon" },
      { texte: "Lance le dé.", signe: "de" },
    ]);
  });

  it("F04-AC26 — en récit classique, les objets servent toujours, les formules jamais", async () => {
    const r = await recit("classique");
    const jeu = await jeuDe(bilal, r.scene);
    expect(jeu?.objets).toHaveLength(2);
    expect(jeu?.formules).toEqual([]);
  });

  it("hors de son chapitre, un élève ne reçoit rien des listes, même quand la lecture de l'histoire est ouverte ; et un poste ne lit ni n'écrit les tables", async () => {
    const r = await recit();
    expect(await jeuDe(chloe, r.scene)).toBeNull();
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    expect(await jeuDe(chloe, r.scene)).toEqual({ objets: [], formules: [] });
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const base = await poste.base();
    expect((await base.from("objets").select("nom")).data ?? []).toEqual([]);
    expect((await base.from("formules").select("texte")).data ?? []).toEqual([]);
    const tente = await base.from("objets").insert({ projet_id: r.projet, enseignant_id: laurent.id, nom: "un objet d’élève", description: "" });
    expect(tente.error).not.toBeNull();
  });
});
