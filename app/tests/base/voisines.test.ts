import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, nettoyer, posteDe, sql, type Adulte, type ClasseEssai,
  type EleveEssai,
} from "./outils";

/**
 * Étape 3 du plan, lot 6 : les scènes voisines (F04.3), contre la vraie base locale. Une
 * seule fonction sert l'adulte et le poste d'un élève ; elle ne rend d'une voisine que ce
 * que la personne a le droit d'en lire.
 */

let laurent: Adulte;
let martin: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;
let chloe: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  [alice, bilal, chloe] = await inscrire(laurent, classe.id, ["Alice", "Bilal", "Chloé"]);
});
afterAll(nettoyer);

const p = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const note = (t: string) => ({ type: "note", id: randomUUID(), children: [{ text: t }] });
const action = (t: string) => ({ type: "action", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string) => ({ type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });
const liaison = (cible: string) => ({ type: "liaison", id: randomUUID(), cible, children: [{ text: "" }] });

type Voisine = {
  sens: string; scene_id: string; reference: number | null; titre: string | null; chapitre: string; lisible: boolean; vide: boolean; cache: boolean; libelle: string;
  extrait: { children: { text: string }[] } | null; phrase: { libelle: string } | null; suite: boolean;
};
const mots = (v: Voisine): string | null => (v.extrait ? v.extrait.children.map((x) => x.text).join("") : null);

/** « La lisière » (S1, S2, S3), à Alice et Bilal ; « Le sanctuaire » (S4, S5), à Chloé. */
async function recit(sorte: "choix" | "classique" = "choix") {
  const projet = await creerProjet(laurent, "classe", sorte, "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const s = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  const t = [await creerScene(laurent.base, sanctuaire), await creerScene(laurent.base, sanctuaire)];
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  await attribuer(laurent, sanctuaire, [{ eleve: chloe.id }]);
  return { projet: projet.id, s: s.map((x) => x.id), t: t.map((x) => x.id) };
}
const ecrire = async (scene: string, texte: unknown): Promise<void> => {
  const [{ version }] = await sql<{ version: number }>("select version from scenes where id = $1", [scene]);
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: version, p_texte: texte });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(error?.message ?? "Texte non enregistré");
};
const pourAdulte = async (adulte: Adulte, scene: string): Promise<Voisine[]> => {
  const { data, error } = await adulte.base.rpc("voisines_de_la_scene", { p_scene: scene });
  if (error) throw new Error(error.message);
  return (data ?? []) as Voisine[];
};
const pourEleve = async (eleve: EleveEssai, scene: string): Promise<Voisine[]> => {
  const poste = await posteDe(classe.id, eleve.inscriptionId);
  const { data, error } = await (await poste.base()).rpc("voisines_de_la_scene", { p_scene: scene });
  if (error) throw new Error(error.message);
  return (data ?? []) as Voisine[];
};

describe("Scènes voisines d'un récit à choix (F04.3)", () => {
  it("F04-AC06, AC14 — avant : le dernier paragraphe de récit de la scène qui mène ici, et sa phrase de choix ; après : le premier paragraphe de la destination, avec le libellé du choix ; ni note ni action de jeu dans un extrait", async () => {
    const r = await recit();
    const [s14, s15, s18] = r.s;
    await ecrire(s14, [p("Le sentier monte."), note("À revoir"), p("Un chant s’élève."), action("Coche une case."), choix("Suivre le chant", s15), p("")]);
    await ecrire(s15, [p("Lou s’arrête."), choix("Continuer vers la lumière", s18)]);
    await ecrire(s18, [note("Solution : 38"), p("La clairière s’ouvre."), p("Un cerf attend.")]);
    const voisines = await pourAdulte(laurent, s15);
    expect(voisines.map((v) => [v.sens, v.scene_id])).toEqual([["apres", s18], ["avant", s14]]);
    const [apres, avant] = voisines;
    expect(mots(avant)).toBe("Un chant s’élève.");
    expect(avant).toMatchObject({ lisible: true, vide: false, cache: false, libelle: "Suivre le chant", suite: true, phrase: { libelle: "Suivre le chant" } });
    expect(mots(apres)).toBe("La clairière s’ouvre.");
    expect(apres).toMatchObject({ libelle: "Continuer vers la lumière", suite: true, phrase: null });
    expect(JSON.stringify(voisines)).not.toMatch(/Solution|À revoir|Coche une case/);
  });

  it("F04-AC07 — plusieurs scènes mènent ici : chacune une fois, dans l'ordre du plan ; les destinations, dans l'ordre des choix", async () => {
    const r = await recit();
    const [s15, s16, s18] = r.s;
    const [autel] = r.t;
    await ecrire(autel, [p("Devant l’autel."), choix("Revenir", s18)]);
    await ecrire(s16, [p("Par le gué."), choix("Passer", s18), choix("Passer encore", s18)]);
    await ecrire(s15, [p("Par le pont."), choix("Traverser", s18)]);
    await ecrire(s18, [p("La clairière."), choix("Vers l’autel", autel), choix("Vers le pont", s15)]);
    const voisines = await pourAdulte(laurent, s18);
    expect(voisines.filter((v) => v.sens === "avant").map((v) => v.scene_id)).toEqual([s15, s16, autel]);
    expect(voisines.filter((v) => v.sens === "apres").map((v) => [v.scene_id, v.libelle])).toEqual([[autel, "Vers l’autel"], [s15, "Vers le pont"]]);
  });

  it("F04-AC11 — une voisine sans texte n'a pas d'extrait : sa référence et son titre, « Texte vide » ; une scène supprimée n'est plus voisine", async () => {
    const r = await recit();
    const [s15, s18, s19] = r.s;
    await laurent.base.from("scenes").update({ titre: "Clairière" }).eq("id", s18);
    await ecrire(s15, [p("Lou s’arrête."), choix("Continuer", s18), choix("Reculer", s19)]);
    await ecrire(s19, [p("Le chemin du retour.")]);
    let [vide, ecrite] = await pourAdulte(laurent, s15);
    expect(vide).toMatchObject({ scene_id: s18, titre: "Clairière", vide: true, extrait: null, lisible: true });
    expect(vide.reference).toBeGreaterThan(0);
    expect(mots(ecrite)).toBe("Le chemin du retour.");
    expect(ecrite.suite).toBe(false);
    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: s19 })).error).toBeNull();
    [vide, ecrite] = await pourAdulte(laurent, s15);
    expect(ecrite).toBeUndefined();
  });

  it("F04-AC09, AC38 — Bilal ne reçoit aucun extrait d'une scène d'un chapitre qui n'est pas le sien : « autre chapitre » et son titre public ; la lecture de l'histoire ouverte, il lit son début", async () => {
    const r = await recit();
    const [s17] = r.s;
    const [s21] = r.t;
    await laurent.base.from("scenes").update({ titre: "L’autel secret" }).eq("id", s21);
    await ecrire(s17, [p("Lou hésite."), choix("Entrer au sanctuaire", s21)]);
    await ecrire(s21, [p("Sous la voûte, une lueur."), choix("Ressortir", s17)]);
    let voisines = await pourEleve(bilal, s17);
    expect(voisines).toHaveLength(2);
    for (const v of voisines) {
      expect(v).toMatchObject({ scene_id: s21, lisible: false, reference: null, titre: null, chapitre: "Le sanctuaire", extrait: null, phrase: null, suite: false });
    }
    expect(JSON.stringify(voisines)).not.toMatch(/voûte|autel secret/i);

    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    voisines = await pourEleve(bilal, s17);
    const apres = voisines.find((v) => v.sens === "apres")!;
    expect(apres).toMatchObject({ lisible: true, titre: "L’autel secret" });
    expect(mots(apres)).toBe("Sous la voûte, une lueur.");
    expect(voisines.find((v) => v.sens === "avant")).toMatchObject({ lisible: true, phrase: { libelle: "Ressortir" } });
  });

  it("F04-AC37 — une liaison cachée dont l'autre bout est hors du périmètre de l'élève n'apparaît pas, même la lecture ouverte ; dans son chapitre, elle s'affiche avec « lien caché », sans phrase de choix ; l'enseignante lit les deux", async () => {
    const r = await recit();
    const [s55, s56] = r.s;
    const [s62] = r.t;
    await ecrire(s55, [p("Trois symboles sur la porte."), liaison(s62), liaison(s56)]);
    await ecrire(s62, [p("La salle des brumes.")]);
    await ecrire(s56, [p("Le passage dérobé.")]);
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    // Alice écrit S055 : la liaison vers le sanctuaire ne lui est pas montrée, celle de son chapitre oui
    expect((await pourEleve(alice, s55)).map((v) => [v.scene_id, v.cache])).toEqual([[s56, true]]);
    // Chloé écrit S062 : rien ne lui dit quelle scène y mène
    expect(await pourEleve(chloe, s62)).toEqual([]);
    const avant = (await pourEleve(alice, s56)).find((v) => v.sens === "avant")!;
    expect(avant).toMatchObject({ scene_id: s55, cache: true, phrase: null });
    expect(mots(avant)).toBe("Trois symboles sur la porte.");
    const pourElle = await pourAdulte(laurent, s55);
    expect(pourElle.map((v) => [v.scene_id, v.cache]).sort()).toEqual([[s56, true], [s62, true]].sort());
    expect(mots(pourElle.find((v) => v.scene_id === s62)!)).toBe("La salle des brumes.");
  });

  it("personne d'autre ne lit les voisines : ni un autre enseignant, ni un élève qui ne peut pas lire la scène", async () => {
    const r = await recit();
    const [s15, s18] = r.s;
    await ecrire(s15, [p("Lou s’arrête."), choix("Continuer", s18)]);
    await ecrire(s18, [p("La clairière.")]);
    expect(await pourAdulte(martin, s15)).toEqual([]);
    expect(await pourEleve(chloe, s15)).toEqual([]);
    expect(await pourEleve(alice, s15)).toHaveLength(1);
  });
});

describe("Scènes voisines d'un récit classique (F04-AC12)", () => {
  it("la scène d'avant et celle d'après dans l'ordre du plan, d'un chapitre à l'autre, sans phrase de choix", async () => {
    const r = await recit("classique");
    const [s14, s15, s16] = r.s;
    const [suivant] = r.t;
    await ecrire(s14, [p("Le matin."), p("Le départ.")]);
    await ecrire(s15, [p("La route.")]);
    await ecrire(s16, [p("La halte."), p("La nuit tombe.")]);
    await ecrire(suivant, [p("Le lendemain.")]);
    const milieu = await pourAdulte(laurent, s15);
    expect(milieu.map((v) => [v.sens, v.scene_id, mots(v), v.phrase])).toEqual([["apres", s16, "La halte.", null], ["avant", s14, "Le départ.", null]]);
    // D'un chapitre à l'autre ; la première scène n'a rien avant elle
    expect((await pourAdulte(laurent, s16)).map((v) => [v.sens, v.scene_id])).toEqual([["apres", suivant], ["avant", s15]]);
    expect((await pourAdulte(laurent, s14)).map((v) => v.sens)).toEqual(["apres"]);
    // Alice, à la dernière scène de son chapitre : la suivante est dans un chapitre qui n'est pas le sien
    const pourAlice = await pourEleve(alice, s16);
    expect(pourAlice.find((v) => v.sens === "apres")).toMatchObject({ lisible: false, chapitre: "Le sanctuaire", extrait: null });
    expect(mots(pourAlice.find((v) => v.sens === "avant")!)).toBe("La route.");
  });
});

describe("« Afficher les scènes voisines » (F04-AC08, AC13)", () => {
  it("cochée par défaut ; la préférence d'Alice la suit d'un poste à l'autre, celle de Bilal ne change pas ; celle de l'adulte est à son compte", async () => {
    const pa = await posteDe(classe.id, alice.inscriptionId);
    expect((await (await pa.base()).rpc("voisines_affichees")).data).toBe(true);
    expect((await (await pa.base()).rpc("regler_voisines", { p_affiche: false })).error).toBeNull();
    // Le lendemain, sur un autre poste
    const autre = await posteDe(classe.id, alice.inscriptionId);
    expect((await (await autre.base()).rpc("voisines_affichees")).data).toBe(false);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    expect((await (await pb.base()).rpc("voisines_affichees")).data).toBe(true);
    // Un poste ne règle que la préférence de l'élève qui y travaille
    expect((await sql<{ v: boolean }>("select voisines as v from eleves where id = $1", [bilal.id]))[0].v).toBe(true);

    expect((await laurent.base.from("enseignants").select("voisines").eq("id", laurent.id).single()).data).toEqual({ voisines: true });
    expect((await laurent.base.from("enseignants").update({ voisines: false }).eq("id", laurent.id)).error).toBeNull();
    expect((await laurent.base.from("enseignants").select("voisines").eq("id", laurent.id).single()).data).toEqual({ voisines: false });
    expect((await martin.base.from("enseignants").select("voisines").eq("id", martin.id).single()).data).toEqual({ voisines: true });
  });
});
