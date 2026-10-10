import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, nettoyer, posteDe, service, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

/**
 * Étape 3 du plan, lot 3 : la note de l'enseignant et la liaison cachée, contre la vraie
 * base locale (F05.1, F05.2). Un élève ne reçoit rien d'une note ; quand il enregistre, la
 * base la remet à sa place, sous le verrou de la scène.
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

type Bloc = { type: string; id: string; cible?: string; children: { text: string }[] };
const p = (t: string): Bloc => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const note = (t: string): Bloc => ({ type: "note", id: randomUUID(), children: [{ text: t }] });
const liaison = (cible: string): Bloc => ({ type: "liaison", id: randomUUID(), cible, children: [{ text: "" }] });
type Rendu = { etat: string; version?: number; motif?: string };

/** « La lisière », où écrit Alice, avec deux scènes ; « Le sanctuaire », à Chloé, avec une. */
async function recit(): Promise<{ projet: string; lisiere: string; s: SceneEssai[]; autel: SceneEssai }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const s = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  const autel = await creerScene(laurent.base, sanctuaire);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  await attribuer(laurent, sanctuaire, [{ eleve: chloe.id }]);
  return { projet: projet.id, lisiere: chapitreId, s, autel };
}
const ecrireAdulte = async (scene: string, version: number, t: unknown): Promise<Rendu> => {
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: version, p_texte: t });
  if (error) throw new Error(error.message);
  return data as Rendu;
};
const ouvrir = async (poste: PosteEssai, scene: string): Promise<string> => {
  const { data, error } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: scene });
  if (error || !data) throw new Error(error?.message ?? "Écriture non ouverte");
  return data as string;
};
const ecrireEleve = async (poste: PosteEssai, ecriture: string, version: number, t: unknown, refus: string | null = null): Promise<Rendu> => {
  const { data, error } = await service().rpc("ecriture_enregistrer", { p_ecriture: ecriture, p_jeton_hash: poste.jetonHash, p_version: version, p_texte: t, p_refus: refus });
  if (error) throw new Error(error.message);
  return data as Rendu;
};
const lireScene = async (poste: PosteEssai, scene: string): Promise<{ texte: Bloc[]; version: number; vide: boolean } | null> =>
  ((await (await poste.base()).rpc("scene_du_poste", { p_scene: scene })).data as { texte: Bloc[]; version: number; vide: boolean } | null) ?? null;
const sceneEnBase = async (scene: string) => (await sql<{ texte: Bloc[]; version: number; texte_vide: boolean }>("select texte, version, texte_vide from scenes where id = $1", [scene]))[0];
const copies = (scene: string) =>
  sql<{ id: string; sorte: string; eleve_id: string | null; texte: Bloc[] }>("select id, sorte, eleve_id, texte from copies_recuperation where scene_id = $1 and retire_le is null order by garde_le, id", [scene]);
const mots = (t: Bloc[]): string => t.map((b) => `${b.type === "note" ? "[note] " : ""}${b.children.map((l) => l.text).join("")}`).join(" / ");

describe("Note de l'enseignant (F05.2)", () => {
  it("F05-AC49 — ce que le poste d'un élève reçoit d'une scène ne contient pas la note, ni son existence", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    await ecrireAdulte(scene, 0, [p("Premier."), note("Solution : 38"), p("Second.")]);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const lue = await lireScene(pa, scene);
    expect(mots(lue!.texte)).toBe("Premier. / Second.");
    expect(JSON.stringify(lue)).not.toMatch(/Solution|note/);
    // Ni par la recherche, ni par les destinations qu'il peut choisir
    const base = await pa.base();
    expect(JSON.stringify((await base.rpc("scenes_a_chercher")).data)).not.toContain("Solution");
    expect(JSON.stringify((await base.rpc("destinations_du_chapitre", { p_chapitre: r.lisiere })).data)).not.toContain("Solution");
  });

  it("F05-AC50 — quand l'élève enregistre, la note reprend sa place : après le paragraphe qui la précédait ; ce paragraphe supprimé, après le précédent ; sinon en tête", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const [un, deux, trois] = [p("Un."), p("Deux."), p("Trois.")];
    const [n1, n2, n3] = [note("Avant tout"), note("Après deux"), note("Encore après deux")];
    await ecrireAdulte(scene, 0, [n1, un, deux, n2, n3, trois]);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(pa, scene);
    const recu = (await lireScene(pa, scene))!;
    expect(recu.texte.map((b) => b.id)).toEqual([un.id, deux.id, trois.id]);

    // Elle complète un paragraphe et en ajoute un : chaque note est où l'enseignante l'a posée
    const plus = p("Un de plus.");
    let fait = await ecrireEleve(pa, ecriture, recu.version, [{ ...un, children: [{ text: "Un, complété." }] }, deux, plus, trois]);
    expect(fait.etat).toBe("enregistre");
    expect(mots((await sceneEnBase(scene)).texte)).toBe("[note] Avant tout / Un, complété. / Deux. / [note] Après deux / [note] Encore après deux / Un de plus. / Trois.");

    // Elle supprime « Deux. » : ses deux notes remontent après « Un. », dans leur ordre
    fait = await ecrireEleve(pa, ecriture, fait.version!, [un, plus, trois]);
    expect(mots((await sceneEnBase(scene)).texte)).toBe("[note] Avant tout / Un. / [note] Après deux / [note] Encore après deux / Un de plus. / Trois.");
    // Elle supprime aussi « Un. » : elles n'ont plus de paragraphe avant elles, et vont en tête
    fait = await ecrireEleve(pa, ecriture, fait.version!, [plus, trois]);
    expect(mots((await sceneEnBase(scene)).texte)).toBe("[note] Avant tout / [note] Après deux / [note] Encore après deux / Un de plus. / Trois.");
    // Elle efface tout : les notes restent, la scène redevient « Texte vide »
    fait = await ecrireEleve(pa, ecriture, fait.version!, [p("")]);
    const fin = await sceneEnBase(scene);
    expect(fin.texte.filter((b) => b.type === "note").map((b) => b.id)).toEqual([n1.id, n2.id, n3.id]);
    expect(fin.texte_vide).toBe(true);
  });

  it("F05-AC50 — un texte renvoyé à l'identique par l'élève ne change rien : la note ne fait pas un conflit ; une note glissée par un poste est écartée", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const [un, rappel] = [p("Un."), note("Rappel")];
    await ecrireAdulte(scene, 0, [un, rappel]);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(pa, scene);
    expect(await ecrireEleve(pa, ecriture, 1, [un])).toMatchObject({ etat: "enregistre", version: 1 });
    expect(await ecrireEleve(pa, ecriture, 1, [un, note("Mot glissé")])).toMatchObject({ etat: "enregistre", version: 1 });
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Un. / [note] Rappel");
    expect(await copies(scene)).toEqual([]);
  });

  it("F05.2 — un texte gardé à part pour un élève ne contient pas de note ; mis dans la scène, il reprend celles de la scène, et l'ancien texte garde les siennes", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const [un, rappel] = [p("Un."), note("Rappel de l’enseignante")];
    await ecrireAdulte(scene, 0, [un, rappel]);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(pa, scene);
    // L'enseignante écrit entre-temps : l'enregistrement d'Alice arrive sur une version ancienne
    await ecrireAdulte(scene, 1, [{ ...un, children: [{ text: "Un, par l’enseignante." }] }, rappel]);
    expect(await ecrireEleve(pa, ecriture, 1, [{ ...un, children: [{ text: "Un, par Alice." }] }])).toMatchObject({ etat: "garde", motif: "conflit" });
    const [garde] = await copies(scene);
    expect(garde).toMatchObject({ sorte: "refus", eleve_id: alice.id });
    expect(mots(garde.texte)).toBe("Un, par Alice.");

    expect((await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: garde.id })).error).toBeNull();
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Un, par Alice. / [note] Rappel de l’enseignante");
    const [ancien] = await copies(scene);
    expect(ancien).toMatchObject({ sorte: "ancien", eleve_id: null });
    expect(mots(ancien.texte)).toBe("Un, par l’enseignante. / [note] Rappel de l’enseignante");
    // Une version précédente, que l'adulte seul lit, garde les notes
    const versions = await sql<{ texte: Bloc[] }>("select texte from versions_precedentes where scene_id = $1 order by cree_le", [scene]);
    expect(versions.some((v) => mots(v.texte).includes("[note] Rappel"))).toBe(true);
  });

  it("F05-AC51 — une scène qui ne porte qu'une note est « Texte vide », pour l'adulte comme pour le poste, et ne « contient pas de travail »", async () => {
    const r = await recit();
    const scene = r.s[1].id;
    await ecrireAdulte(scene, 0, [note("Penser au pont.")]);
    expect((await sceneEnBase(scene)).texte_vide).toBe(true);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const lue = await lireScene(pa, scene);
    expect(lue).toMatchObject({ texte: [], vide: true });
    expect((await sql<{ t: boolean }>("select prive.scene_contient_du_travail($1) as t", [scene]))[0].t).toBe(false);
  });
});

describe("Liaison cachée (F05.1)", () => {
  it("la liaison du texte fait un lien caché, que les chemins de l'adulte montrent et que le poste d'un élève ne lit ni dans ses destinations ni dans ses chemins", async () => {
    const r = await recit();
    const [porte, salle] = [r.s[0].id, r.autel.id];
    const lien = liaison(salle);
    await ecrireAdulte(porte, 0, [p("Devant la porte aux symboles."), lien]);
    const liens = await sql<{ renvoi_id: string; cible_id: string; cache: boolean }>("select renvoi_id, cible_id, cache from liens where scene_id = $1", [porte]);
    expect(liens).toEqual([{ renvoi_id: lien.id, cible_id: salle, cache: true }]);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const base = await pa.base();
    expect((await base.rpc("destinations_de_la_scene", { p_scene: porte })).data).toEqual([]);
    expect((await base.rpc("liens_du_chapitre", { p_chapitre: r.lisiere })).data).toEqual([]);
    // Elle reçoit la liaison dans le texte, sans rien de la scène où elle mène : de quoi lire « numéro 38 », pas plus
    const lue = (await lireScene(pa, porte))!;
    expect(lue.texte.map((b) => b.type)).toEqual(["p", "liaison"]);
    expect(JSON.stringify(lue)).not.toMatch(/autel|sanctuaire/i);
  });

  it("F05-AC06, AC07, AC36 — le numéro fixé pour l'énigme est gardé quand le livre grandit ; un numéro déjà fixé est refusé, et la scène nommée ; la liaison retirée, le numéro reste", async () => {
    const r = await recit();
    const [porte, salle, autre] = [r.s[0].id, r.autel.id, r.s[1].id];
    const fixe = async (scene: string, n: number) => (await laurent.base.rpc("fixer_numero", { p_scene: scene, p_numero: n })).data as { fixe: boolean; prise?: { id: string } };
    expect(await fixe(salle, 31)).toMatchObject({ fixe: true });
    expect(await fixe(autre, 31)).toMatchObject({ fixe: false, prise: { id: salle } });
    await ecrireAdulte(porte, 0, [p("L’énigme."), liaison(salle)]);
    await creerScene(laurent.base, r.lisiere);
    const numeroFixe = async () => (await sql<{ n: number | null }>("select numero_fixe as n from scenes where id = $1", [salle]))[0].n;
    expect(await numeroFixe()).toBe(31);
    // Le poste d'Alice reçoit de quoi afficher ce numéro
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const { data } = await (await pa.base()).rpc("numerotation_du_projet", { p_projet: r.projet });
    expect(JSON.stringify(data)).toContain(`"fixe": 31`.replace(" ", ""));
    // La liaison retirée, la scène garde son numéro (F11-AC98)
    await ecrireAdulte(porte, 1, [p("L’énigme.")]);
    expect(await sql("select 1 from liens where scene_id = $1", [porte])).toEqual([]);
    expect(await numeroFixe()).toBe(31);
  });
});
