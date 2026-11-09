import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * La liste de vérification sous la consigne (F13.2, F07.2), contre la vraie base locale : l'adulte
 * l'écrit, l'élève qui peut écrire la scène la coche, ses coches restent avec la scène ; la lecture
 * ouverte ne la montre pas ; la conversion des consignes « Décris : ».
 */

let laurent: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;
let chloe: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  classe = await creerClasse(laurent);
  [alice, chloe] = await inscrire(laurent, classe.id, ["Alice", "Chloé"]);
});
afterAll(nettoyer);

/** « Le pont », dans « La lisière » d'Alice ; « Le sanctuaire » à Chloé */
async function lePont() {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  const pont = await creerScene(laurent.base, chapitreId);
  const { error } = await laurent.base
    .from("scenes")
    .update({ consigne: "Le passeur apparaît sur le pont.", verification: ["Décrire le passeur.", "Écrire le dialogue."] })
    .eq("id", pont.id);
  expect(error).toBeNull();
  return { projet: projet.id, chapitreId, pont: pont.id, sanctuaire };
}

const cochees = async (id: string) => (await sql<{ c: string[] }>("select verification_cochee as c from scenes where id = $1", [id]))[0].c;

describe("La liste de vérification (F13.2, F07.2)", () => {
  it("F07-AC100 — l'élève du chapitre lit la liste et coche ; ses coches restent avec la scène ; il décoche", async () => {
    const s = await lePont();
    const poste = await (await posteDe(classe.id, alice.inscriptionId)).base();
    expect((await poste.rpc("verification_du_poste", { p_scene: s.pont })).data).toEqual({ elements: ["Décrire le passeur.", "Écrire le dialogue."], cochees: [] });
    expect((await poste.rpc("eleve_cocher", { p_scene: s.pont, p_element: "Décrire le passeur.", p_coche: true })).error).toBeNull();
    // Deux fois la même coche n'en fait qu'une
    expect((await poste.rpc("eleve_cocher", { p_scene: s.pont, p_element: "Décrire le passeur.", p_coche: true })).error).toBeNull();
    expect(await cochees(s.pont)).toEqual(["Décrire le passeur."]);
    expect((await poste.rpc("verification_du_poste", { p_scene: s.pont })).data).toEqual({ elements: ["Décrire le passeur.", "Écrire le dialogue."], cochees: ["Décrire le passeur."] });
    // Un élément qui n'est pas dans la liste ne se coche pas
    await poste.rpc("eleve_cocher", { p_scene: s.pont, p_element: "Inventer un dragon.", p_coche: true });
    expect(await cochees(s.pont)).toEqual(["Décrire le passeur."]);
    await poste.rpc("eleve_cocher", { p_scene: s.pont, p_element: "Décrire le passeur.", p_coche: false });
    expect(await cochees(s.pont)).toEqual([]);
    // Le poste ne lit ni n'écrit les colonnes elles-mêmes
    expect((await poste.from("scenes").select("verification").eq("id", s.pont)).error).not.toBeNull();
  });

  it("F07-AC101 — une camarade d'un autre chapitre ne lit ni ne coche la liste ; une scène à valider ne se coche plus", async () => {
    const s = await lePont();
    await attribuer(laurent, s.sanctuaire, [{ eleve: chloe.id }]);
    await sql("update projets set lecture_ouverte = true where id = $1", [s.projet]);
    const autre = await (await posteDe(classe.id, chloe.inscriptionId)).base();
    // La lecture ouverte ne montre pas la liste, comme la consigne (F06-AC48)
    expect((await autre.rpc("verification_du_poste", { p_scene: s.pont })).data).toBeNull();
    expect((await autre.rpc("eleve_cocher", { p_scene: s.pont, p_element: "Décrire le passeur.", p_coche: true })).error?.message).toBe("Tu ne peux pas écrire dans cette scène.");
    const poste = await (await posteDe(classe.id, alice.inscriptionId)).base();
    await sql("update scenes set etat = 'valider' where id = $1", [s.pont]);
    expect((await poste.rpc("eleve_cocher", { p_scene: s.pont, p_element: "Décrire le passeur.", p_coche: true })).error?.message).toBe("Tu ne peux pas écrire dans cette scène.");
    expect(await cochees(s.pont)).toEqual([]);
  });

  it("F07-AC102 — un élément récrit par l'adulte redevient à vérifier ; huit éléments au plus", async () => {
    const s = await lePont();
    const poste = await (await posteDe(classe.id, alice.inscriptionId)).base();
    await poste.rpc("eleve_cocher", { p_scene: s.pont, p_element: "Décrire le passeur.", p_coche: true });
    await laurent.base.from("scenes").update({ verification: ["Décrire le passeur et sa lanterne.", "Écrire le dialogue."] }).eq("id", s.pont);
    expect((await poste.rpc("verification_du_poste", { p_scene: s.pont })).data).toEqual({ elements: ["Décrire le passeur et sa lanterne.", "Écrire le dialogue."], cochees: [] });
    const { error } = await laurent.base.from("scenes").update({ verification: Array.from({ length: 9 }, (_, i) => `Élément ${i}.`) }).eq("id", s.pont);
    expect(error).not.toBeNull();
    // L'adulte n'écrit pas les coches de l'élève
    expect((await laurent.base.from("scenes").update({ verification_cochee: ["Écrire le dialogue."] }).eq("id", s.pont)).error).not.toBeNull();
  });
});

describe("Les consignes « Décris : » de l'application, converties (F13.2, 9 novembre 2026)", () => {
  const separer = async (consigne: string) =>
    (await sql<{ consigne: string | null; liste: string[] | null }>("select * from prive.separer_decris($1)", [consigne]))[0];

  it("la ligne « Décris : » et ses tirets deviennent une liste ; les phrases restent la consigne", async () => {
    expect(await separer("Sur le pont, le passeur apparaît. Raconte ce qu'il dit à Lou.\nDécris :\n– sa lanterne et son visage ;\n– sa voix ;\n– ce que ressent Lou.")).toEqual({
      consigne: "Sur le pont, le passeur apparaît. Raconte ce qu'il dit à Lou.",
      liste: ["Décrire sa lanterne et son visage.", "Décrire sa voix.", "Décrire ce que ressent Lou."],
    });
  });

  it("tout autre texte reste tel quel : « Décris : » sur la même ligne, une ligne sans tiret, pas de phrase avant", async () => {
    expect((await separer("Le héros traverse.\nDécris : le décor, le sol.")).liste).toBeNull();
    expect((await separer("Le héros traverse.\nDécris :\n– le décor ;\nPuis il repart.")).liste).toBeNull();
    expect((await separer("Décris :\n– le décor.")).liste).toBeNull();
    expect((await separer("Une consigne ordinaire.")).liste).toBeNull();
  });
});
