import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inconnu, inscrire, nettoyer, posteDe, type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * Étape 5 du plan, lot 4 : ce que le poste d'un élève reçoit pour la lecture d'essai
 * (`lecture_du_poste`, F09.1), contre la vraie base locale.
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

const p = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string | null) => ({ type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });
const note = (t: string) => ({ type: "note", id: randomUUID(), children: [{ text: t }] });
async function ecrire(scene: string, texte: unknown[]) {
  const { error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: 0, p_texte: texte });
  if (error) throw new Error(error.message);
}

type Lu = {
  depart: string | null; lecture_ouverte: boolean; chapitres: { id: string; titre: string; mien: boolean }[];
  scenes: { id: string; titre: string; texte: { type: string }[] }[]; ailleurs: string[]; feuille: unknown; formule: string; marque_fin: string;
} | null;

/** « La lisière » (Alice) : L1, départ, mène à L2, au sanctuaire (S1) et à une scène supprimée. « Le sanctuaire » : S1, sans élève. */
async function recit() {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId: lisiere } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const [l1, l2, perdue] = [await creerScene(laurent.base, lisiere), await creerScene(laurent.base, lisiere), await creerScene(laurent.base, lisiere)];
  const s1 = await creerScene(laurent.base, sanctuaire);
  await laurent.base.from("scenes").update({ titre: "L’autel secret" }).eq("id", s1.id);
  await attribuer(laurent, lisiere, [{ eleve: alice.id }]);
  await ecrire(l1.id, [p("La lisière."), note("Penser au héron"), choix("Avancer", l2.id), choix("Entrer au sanctuaire", s1.id), choix("Descendre au port", perdue.id)]);
  await ecrire(s1.id, [p("Un secret du sanctuaire.")]);
  await laurent.base.from("scenes").update({ supprime_le: new Date().toISOString() }).eq("id", perdue.id);
  await laurent.base.from("scenes").update({ hors_livre: true, fin: true }).eq("id", l2.id);
  await laurent.base.from("projets").update({ depart_scene_id: l1.id }).eq("id", projet.id);
  return { projet: projet.id, lisiere, sanctuaire, l1: l1.id, l2: l2.id, s1: s1.id };
}
const lire = async (projet: string): Promise<Lu> => {
  const poste = await posteDe(classe.id, alice.inscriptionId);
  const { data, error } = await (await poste.base()).rpc("lecture_du_poste", { p_projet: projet });
  if (error) throw new Error(error.message);
  return data as Lu;
};

describe("Ce que reçoit le poste d'un élève (F09.1)", () => {
  it("F09-AC23 — rien d'un chapitre fermé : ni titre ni texte du sanctuaire, seulement que sa scène existe ; ni note, ni état, ni « hors du livre »", async () => {
    const r = await recit();
    const lu = (await lire(r.projet))!;
    expect(lu.chapitres.map((c) => [c.titre, c.mien])).toEqual([["La lisière", true]]);
    expect(lu.scenes.map((s) => s.id).sort()).toEqual([r.l1, r.l2].sort());
    expect(JSON.stringify(lu)).not.toContain("secret");
    expect(JSON.stringify(lu)).not.toContain("Penser au héron");
    expect(JSON.stringify(lu)).not.toMatch(/hors|etat|consigne/);
    // La suite au sanctuaire existe ; la scène supprimée, non
    expect(lu.ailleurs).toEqual([r.s1]);
    // Le départ n'est rendu que si la lecture est ouverte
    expect(lu.depart).toBeNull();
  });

  it("F09-AC22, F06-AC48 — la lecture ouverte : tous les chapitres, en lecture, et le départ du livre ; refermée, plus rien du sanctuaire (F06-AC49)", async () => {
    const r = await recit();
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    let lu = (await lire(r.projet))!;
    expect(lu.chapitres.map((c) => [c.titre, c.mien])).toEqual([["La lisière", true], ["Le sanctuaire", false]]);
    expect(lu.depart).toBe(r.l1);
    expect(lu.ailleurs).toEqual([]);
    expect(JSON.stringify(lu)).toContain("secret");
    await laurent.base.from("projets").update({ lecture_ouverte: false }).eq("id", r.projet);
    lu = (await lire(r.projet))!;
    expect(JSON.stringify(lu)).not.toContain("secret");
  });

  it("F09.1 — la feuille d'aventure n'est rendue que si elle est en service ; aucun autre adulte, inconnu ou élève d'une autre classe ne lit rien", async () => {
    const r = await recit();
    expect((await lire(r.projet))!.feuille).toBeNull();
    const feuille = { on: true, des: 1, sections: [{ id: "inv", type: "liste", titre: "Inventaire", lignes: 6 }] };
    await laurent.base.from("preparations").update({ feuille, univers: "Un pays de brume" }).eq("projet_id", r.projet);
    const lu = (await lire(r.projet))!;
    expect(lu.feuille).toEqual(feuille);
    expect(JSON.stringify(lu)).not.toContain("Un pays de brume");
    expect((await martin.base.rpc("lecture_du_poste", { p_projet: r.projet })).error).not.toBeNull();
    expect((await inconnu().rpc("lecture_du_poste", { p_projet: r.projet })).error).not.toBeNull();
    const autre = await creerClasse(martin, "CE2");
    const [bilal] = await inscrire(martin, autre.id, ["Bilal"]);
    const poste = await posteDe(autre.id, bilal.inscriptionId);
    expect((await (await poste.base()).rpc("lecture_du_poste", { p_projet: r.projet })).data).toBeNull();
  });
});
