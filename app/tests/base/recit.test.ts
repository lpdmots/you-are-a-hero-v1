import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, lire, nettoyer, ordre,
  identifier, posteDe, service, type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * Étape 2 du plan : le plan du récit et qui peut y faire quoi. Les écrans sont joués
 * dans tests/parcours ; ici, c'est la base qui répond, quelle que soit la demande.
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

const projetDeClasse = () => creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);

/** Les scènes d'un projet que lit cet accès : la classe d'essai a plusieurs projets. */
async function scenesLues(base: SupabaseClient, projetId: string): Promise<{ id: string }[]> {
  const { data, error } = await base.from("scenes").select("id").eq("projet_id", projetId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

describe("Parties, chapitres et scènes (F03.1)", () => {
  it("F03-AC01, F03-AC10 — une partie se crée avec un chapitre vide, sans scène ni élève ; une scène appartient à un seul chapitre", async () => {
    const projet = await projetDeClasse();
    const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const { data: chapitres } = await laurent.base.from("chapitres").select("id, titre, scenes(id), attributions(eleve_id)").eq("partie_id", partieId);
    expect(chapitres).toHaveLength(1);
    expect(chapitres![0]).toMatchObject({ id: chapitreId, titre: "La lisière", scenes: [], attributions: [] });

    const scene = await creerScene(laurent.base, chapitreId);
    const { data } = await laurent.base.from("scenes").select("chapitre_id, projet_id").eq("id", scene.id).single();
    expect(data).toEqual({ chapitre_id: chapitreId, projet_id: projet.id });
    // Aucun niveau de plus : une scène ne change pas de chapitre, et rien ne se rattache à la partie
    const autre = await creerChapitre(laurent, partieId, "Le sanctuaire");
    expect((await laurent.base.from("scenes").update({ chapitre_id: autre }).eq("id", scene.id)).error).not.toBeNull();
  });

  it("F03-AC11 — un second chapitre n'hérite d'aucune attribution", async () => {
    const projet = await projetDeClasse();
    const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
    const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
    const { data } = await laurent.base.from("attributions").select("chapitre_id, eleve_id").eq("projet_id", projet.id);
    expect(data).toEqual([{ chapitre_id: chapitreId, eleve_id: alice.id }]);
    expect((data ?? []).some((a) => a.chapitre_id === sanctuaire)).toBe(false);
  });

  it("F03-AC16 — « Ajouter une scène » donne une scène vide munie de sa référence, sans titre ni consigne ; F03-AC30 — une référence n'est jamais redonnée", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    expect((await laurent.base.from("scenes").select("id").eq("chapitre_id", chapitreId)).data).toEqual([]);

    const s1 = await creerScene(laurent.base, chapitreId);
    const s2 = await creerScene(laurent.base, chapitreId);
    expect([s1.reference, s2.reference]).toEqual([1, 2]);
    expect((await laurent.base.from("scenes").select("titre, consigne, fin").eq("id", s1.id).single()).data).toEqual({ titre: null, consigne: "", fin: false });

    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: s2.id })).error).toBeNull();
    const s3 = await creerScene(laurent.base, chapitreId);
    expect(s3.reference).toBe(3);
    expect((await laurent.base.rpc("restaurer_element", { p_sorte: "scene", p_id: s2.id })).error).toBeNull();
    expect((await laurent.base.from("scenes").select("reference").eq("id", s2.id).single()).data?.reference).toBe(2);
    expect((await laurent.base.from("scenes").update({ reference: 9 }).eq("id", s2.id)).error).not.toBeNull();
  });

  it("F03-AC23 — une scène change de rang dans son chapitre ; F03-AC08, F03-AC12 — l'ordre du plan est celui de la lecture", async () => {
    const projet = await creerProjet(laurent, "classe", "classique", "Carnet de voyage", classe.id);
    const { chapitreId } = await creerPartie(laurent, projet.id, "A", "A1");
    const [a, , c] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
    expect(await ordre(laurent.base, "scenes", "chapitre_id", chapitreId)).toEqual(["1", "2", "3"]);
    // C posée avant B
    expect((await laurent.base.rpc("placer_scene", { p_scene: c.id, p_position: 1 })).error).toBeNull();
    expect(await ordre(laurent.base, "scenes", "chapitre_id", chapitreId)).toEqual(["1", "3", "2"]);
    // A posée à la fin
    expect((await laurent.base.rpc("placer_scene", { p_scene: a.id, p_position: 2 })).error).toBeNull();
    expect(await ordre(laurent.base, "scenes", "chapitre_id", chapitreId)).toEqual(["3", "2", "1"]);
  });

  it("F03-AC34 — un chapitre change de rang dans sa partie ; F03-AC37 — une partie change de rang", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const sanctuaire = await creerChapitre(laurent, foret.partieId, "Le sanctuaire");
    const montagne = await creerPartie(laurent, projet.id, "La montagne", "Le col");

    expect((await laurent.base.rpc("placer_chapitre", { p_chapitre: sanctuaire, p_partie: foret.partieId, p_position: 0 })).error).toBeNull();
    expect(await ordre(laurent.base, "chapitres", "partie_id", foret.partieId)).toEqual(["Le sanctuaire", "La lisière"]);
    // « Annuler » remet l'ordre d'avant : le même geste, dans l'autre sens
    expect((await laurent.base.rpc("placer_chapitre", { p_chapitre: sanctuaire, p_partie: foret.partieId, p_position: 1 })).error).toBeNull();
    expect(await ordre(laurent.base, "chapitres", "partie_id", foret.partieId)).toEqual(["La lisière", "Le sanctuaire"]);

    expect(await ordre(laurent.base, "parties", "projet_id", projet.id)).toEqual(["La forêt", "La montagne"]);
    expect((await laurent.base.rpc("placer_partie", { p_partie: montagne.partieId, p_position: 0 })).error).toBeNull();
    expect(await ordre(laurent.base, "parties", "projet_id", projet.id)).toEqual(["La montagne", "La forêt"]);
  });

  it("F03-AC35 — un chapitre posé dans une autre partie garde ses scènes et ses élèves ; F03-AC36 — le seul chapitre d'une partie n'en sort pas", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const gue = await creerChapitre(laurent, foret.partieId, "Le gué");
    const montagne = await creerPartie(laurent, projet.id, "La montagne", "Le col");
    const scene = await creerScene(laurent.base, gue);
    await attribuer(laurent, gue, [{ eleve: alice.id, profil: "organisation" }]);

    expect((await laurent.base.rpc("placer_chapitre", { p_chapitre: gue, p_partie: montagne.partieId, p_position: 0 })).error).toBeNull();
    expect(await ordre(laurent.base, "chapitres", "partie_id", montagne.partieId)).toEqual(["Le gué", "Le col"]);
    expect(await ordre(laurent.base, "chapitres", "partie_id", foret.partieId)).toEqual(["La lisière"]);
    expect((await laurent.base.from("scenes").select("chapitre_id").eq("id", scene.id).single()).data?.chapitre_id).toBe(gue);
    expect((await laurent.base.from("attributions").select("eleve_id, profil").eq("chapitre_id", gue)).data).toEqual([{ eleve_id: alice.id, profil: "organisation" }]);
    // Alice y lit et y écrit comme avant
    const poste = await posteDe(classe.id, alice.inscriptionId);
    expect((await scenesLues(await poste.base(), projet.id)).map((l) => l.id)).toContain(scene.id);

    const refus = await laurent.base.rpc("placer_chapitre", { p_chapitre: foret.chapitreId, p_partie: montagne.partieId, p_position: 0 });
    expect(refus.error?.message).toMatch(/le seul de la sienne/);
    expect(await ordre(laurent.base, "chapitres", "partie_id", foret.partieId)).toEqual(["La lisière"]);
  });
});

describe("Supprimer et restaurer (F03.1)", () => {
  it("F03-AC14, F03-AC22 — un chapitre supprimé garde ses scènes dans la corbeille ; F03-AC27 — restauré, il reprend son rang et ses élèves", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const sanctuaire = await creerChapitre(laurent, foret.partieId, "Le sanctuaire");
    await creerChapitre(laurent, foret.partieId, "Les racines");
    const scenes = [await creerScene(laurent.base, sanctuaire), await creerScene(laurent.base, sanctuaire)];
    await attribuer(laurent, sanctuaire, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }, { eleve: chloe.id }]);

    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: sanctuaire })).error).toBeNull();
    expect(await ordre(laurent.base, "chapitres", "partie_id", foret.partieId)).toEqual(["La lisière", "Les racines"]);
    // Rien n'est effacé : le chapitre, ses scènes et ses attributions attendent dans la corbeille
    expect((await laurent.base.from("chapitres").select("supprime_le").eq("id", sanctuaire).single()).data?.supprime_le).not.toBeNull();
    expect((await laurent.base.from("scenes").select("id").eq("chapitre_id", sanctuaire)).data).toHaveLength(2);
    expect((await laurent.base.from("attributions").select("eleve_id").eq("chapitre_id", sanctuaire)).data).toHaveLength(3);

    expect((await laurent.base.rpc("restaurer_element", { p_sorte: "chapitre", p_id: sanctuaire })).error).toBeNull();
    expect(await ordre(laurent.base, "chapitres", "partie_id", foret.partieId)).toEqual(["La lisière", "Le sanctuaire", "Les racines"]);
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    expect((await scenesLues(await poste.base(), projet.id)).map((l) => l.id).sort()).toEqual(scenes.map((s) => s.id).sort());
    expect((await (await poste.base()).from("attributions").select("profil").eq("chapitre_id", sanctuaire).eq("eleve_id", bilal.id).single()).data?.profil).toBe("organisation");
  });

  it("F03-AC28 — pendant qu'un chapitre est dans la corbeille, ses élèves n'y accèdent plus", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const sanctuaire = await creerChapitre(laurent, foret.partieId, "Le sanctuaire");
    const scene = await creerScene(laurent.base, sanctuaire);
    await attribuer(laurent, sanctuaire, [{ eleve: alice.id, profil: "organisation" }]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    expect((await scenesLues(await poste.base(), projet.id))).toHaveLength(1);

    await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: sanctuaire });
    const base = await poste.base();
    expect((await scenesLues(base, projet.id))).toHaveLength(0);
    expect((await lire(base, "chapitres", "id")).lignes.map((l) => l.id)).not.toContain(sanctuaire);
    expect((await base.from("scenes").select("id").eq("id", scene.id)).data).toEqual([]);
    expect((await base.rpc("consignes_du_chapitre", { p_chapitre: sanctuaire })).data).toEqual([]);
    expect((await base.rpc("eleve_creer_scene", { p_chapitre: sanctuaire })).error).not.toBeNull();
  });

  it("F03-AC29 — un chapitre vide supprimé se retrouve dans la corbeille ; le seul chapitre d'une partie ne se supprime pas", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const racines = await creerChapitre(laurent, foret.partieId, "Les racines");
    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: racines })).error).toBeNull();
    const { data } = await laurent.base.from("chapitres").select("titre").eq("projet_id", projet.id).not("supprime_le", "is", null);
    expect(data).toEqual([{ titre: "Les racines" }]);

    const refus = await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: foret.chapitreId });
    expect(refus.error?.message).toMatch(/supprimez la partie/);
    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "partie", p_id: foret.partieId })).error).toBeNull();
  });

  it("F03-AC31 — une scène ne se restaure pas avant son chapitre, et restaurer le chapitre ne la restaure pas", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const lisiere = await creerChapitre(laurent, foret.partieId, "La clairière");
    const [s16, s17] = [await creerScene(laurent.base, lisiere), await creerScene(laurent.base, lisiere)];
    await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: s17.id });
    await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: lisiere });

    const refus = await laurent.base.rpc("restaurer_element", { p_sorte: "scene", p_id: s17.id });
    expect(refus.error?.message).toMatch(/Restaurez d'abord le chapitre/);

    expect((await laurent.base.rpc("restaurer_element", { p_sorte: "chapitre", p_id: lisiere })).error).toBeNull();
    expect(await ordre(laurent.base, "scenes", "chapitre_id", lisiere)).toEqual([String(s16.reference)]);
    expect((await laurent.base.rpc("restaurer_element", { p_sorte: "scene", p_id: s17.id })).error).toBeNull();
    expect(await ordre(laurent.base, "scenes", "chapitre_id", lisiere)).toEqual([String(s16.reference), String(s17.reference)]);
  });

  it("F03-AC13 — l'adulte d'un autre compte ne supprime ni ne restaure rien", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    expect((await martin.base.rpc("supprimer_element", { p_sorte: "partie", p_id: foret.partieId })).error).not.toBeNull();
    expect((await lire(martin.base, "parties")).lignes).toHaveLength(0);
    expect((await martin.base.rpc("creer_scene", { p_chapitre: foret.chapitreId })).error).not.toBeNull();
  });
});

describe("Départ et fins (F03.2)", () => {
  it("F03-AC03 — un seul départ ; F03-AC05, F03-AC06 — une fin se déclare, et plusieurs fins coexistent", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "Le départ", "Le port");
    const [a, b] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
    expect((await laurent.base.from("projets").update({ depart_scene_id: a.id }).eq("id", projet.id)).error).toBeNull();
    expect((await laurent.base.from("projets").update({ depart_scene_id: b.id }).eq("id", projet.id)).error).toBeNull();
    expect((await laurent.base.from("projets").select("depart_scene_id").eq("id", projet.id).single()).data?.depart_scene_id).toBe(b.id);

    // Une scène sans choix n'est pas une fin tant qu'elle n'en porte pas le repère
    expect((await laurent.base.from("scenes").select("fin").eq("id", a.id).single()).data?.fin).toBe(false);
    await laurent.base.from("scenes").update({ fin: true }).in("id", [a.id, b.id]);
    expect((await laurent.base.from("scenes").select("id").eq("chapitre_id", chapitreId).eq("fin", true)).data).toHaveLength(2);
  });

  it("F03.2 — le départ est une scène du même projet, dans un récit à choix seulement", async () => {
    const choix = await projetDeClasse();
    const autre = await projetDeClasse();
    const classique = await creerProjet(laurent, "classe", "classique", "Carnet", classe.id);
    const sceneAutre = await creerScene(laurent.base, (await creerPartie(laurent, autre.id, "P")).chapitreId);
    const sceneClassique = await creerScene(laurent.base, (await creerPartie(laurent, classique.id, "P")).chapitreId);
    expect((await laurent.base.from("projets").update({ depart_scene_id: sceneAutre.id }).eq("id", choix.id)).error).not.toBeNull();
    expect((await laurent.base.from("projets").update({ depart_scene_id: sceneClassique.id }).eq("id", classique.id)).error?.message).toMatch(/récit à choix/);
  });

  it("F03-AC32, F03-AC33 — le départ supprimé reste désigné : restauré, il est de nouveau le départ, sauf si un autre l'a remplacé", async () => {
    const projet = await projetDeClasse();
    const port = await creerPartie(laurent, projet.id, "Le départ", "Le port");
    const quai = await creerChapitre(laurent, port.partieId, "Le quai");
    const [s1, s14] = [await creerScene(laurent.base, port.chapitreId), await creerScene(laurent.base, quai)];
    await laurent.base.from("projets").update({ depart_scene_id: s1.id }).eq("id", projet.id);

    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: port.chapitreId })).error).toBeNull();
    const lu = async () => (await laurent.base.from("projets").select("depart_scene_id").eq("id", projet.id).single()).data?.depart_scene_id;
    expect(await lu()).toBe(s1.id);
    expect((await laurent.base.rpc("restaurer_element", { p_sorte: "chapitre", p_id: port.chapitreId })).error).toBeNull();
    expect(await lu()).toBe(s1.id);

    await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: port.chapitreId });
    await laurent.base.from("projets").update({ depart_scene_id: s14.id }).eq("id", projet.id);
    await laurent.base.rpc("restaurer_element", { p_sorte: "chapitre", p_id: port.chapitreId });
    expect(await lu()).toBe(s14.id);
  });
});

describe("Attribution et profils (F06.1)", () => {
  it("F06-AC01 — un chapitre s'attribue à trois élèves ; F06-AC11 — le profil par défaut est « écriture et propositions »", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id }, { eleve: chloe.id }]);
    const { data } = await laurent.base.from("attributions").select("profil").eq("chapitre_id", chapitreId);
    expect(data).toEqual([{ profil: "propositions" }, { profil: "propositions" }, { profil: "propositions" }]);

    // Décocher un élève retire son attribution, sans toucher aux autres
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: chloe.id, profil: "organisation" }]);
    const { data: apres } = await laurent.base.from("attributions").select("eleve_id, profil").eq("chapitre_id", chapitreId).order("profil");
    expect(apres).toEqual([{ eleve_id: chloe.id, profil: "organisation" }, { eleve_id: alice.id, profil: "propositions" }]);
  });

  it("F06.1 — seul un élève inscrit dans la classe du projet reçoit un chapitre ; jamais dans un projet personnel", async () => {
    const autreClasse = await creerClasse(laurent, "CE2");
    const [dina] = await inscrire(laurent, autreClasse.id, ["Dina"]);
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt");
    expect((await laurent.base.rpc("attribuer_chapitre", { p_chapitre: chapitreId, p_eleves: [{ eleve: dina.id }] })).error?.message).toMatch(/pas inscrit/);

    const personnel = await creerProjet(laurent, "personnel", "choix", "Mon histoire");
    const seul = await creerPartie(laurent, personnel.id, "Partie");
    expect((await laurent.base.rpc("attribuer_chapitre", { p_chapitre: seul.chapitreId, p_eleves: [{ eleve: alice.id }] })).error).not.toBeNull();
  });

  it("F01-AC03, F01-AC08 — préparer d'abord, attribuer ensuite ; F01-AC24 — une fois un chapitre attribué, la classe ne se change plus", async () => {
    const projet = await creerProjet(laurent, "classe", "choix", "Préparé cet été");
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await creerScene(laurent.base, chapitreId);
    // Sans classe, personne à qui attribuer
    expect((await laurent.base.rpc("attribuer_chapitre", { p_chapitre: chapitreId, p_eleves: [{ eleve: alice.id }] })).error).not.toBeNull();

    expect((await laurent.base.from("projets").update({ classe_id: classe.id }).eq("id", projet.id)).error).toBeNull();
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
    expect((await laurent.base.from("scenes").select("id").eq("chapitre_id", chapitreId)).data).toHaveLength(1);

    const autre = await creerClasse(laurent, "CE2");
    expect((await laurent.base.from("projets").update({ classe_id: autre.id }).eq("id", projet.id)).error?.message).toMatch(/ne se change plus/);
    expect((await laurent.base.from("projets").update({ classe_id: null }).eq("id", projet.id)).error?.message).toMatch(/ne se change plus/);
  });

  it("F06-AC12 — le profil se donne chapitre par chapitre ; F06-AC03, F06-AC08 — sans lui, l'élève ne crée pas de scène", async () => {
    const projet = await projetDeClasse();
    const a = await creerPartie(laurent, projet.id, "A", "Chapitre A");
    const b = await creerPartie(laurent, projet.id, "B", "Chapitre B");
    const c = await creerPartie(laurent, projet.id, "C", "Chapitre C");
    await attribuer(laurent, a.chapitreId, [{ eleve: alice.id, profil: "organisation" }]);
    await attribuer(laurent, b.chapitreId, [{ eleve: alice.id }]);
    const base = await (await posteDe(classe.id, alice.inscriptionId)).base();

    const creee = await creerScene(base, a.chapitreId, "eleve_creer_scene");
    expect((await laurent.base.from("scenes").select("chapitre_id, cree_par_eleve").eq("id", creee.id).single()).data).toEqual({ chapitre_id: a.chapitreId, cree_par_eleve: alice.id });
    expect((await base.rpc("eleve_creer_scene", { p_chapitre: b.chapitreId })).error?.message).toMatch(/ne peux pas créer/);
    expect((await base.rpc("eleve_creer_scene", { p_chapitre: c.chapitreId })).error?.message).toMatch(/ne peux pas créer/);
    // Le poste n'écrit dans aucune table : tout passe par ces fonctions
    expect((await base.from("scenes").insert({ chapitre_id: a.chapitreId, projet_id: projet.id, enseignant_id: laurent.id, reference: 99 })).error).not.toBeNull();
    expect((await base.from("scenes").update({ titre: "Piraté" }).eq("id", creee.id)).error).not.toBeNull();
    expect((await base.rpc("creer_scene", { p_chapitre: a.chapitreId })).error).not.toBeNull();
  });

  it("F06-AC86, F06-AC87 — l'élève supprime la scène qu'il a créée, pas celle de l'enseignant ; il ne voit pas la corbeille", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const s16 = await creerScene(laurent.base, chapitreId);
    await attribuer(laurent, chapitreId, [{ eleve: bilal.id, profil: "organisation" }, { eleve: alice.id, profil: "organisation" }]);
    const base = await (await posteDe(classe.id, bilal.inscriptionId)).base();
    const s64 = await creerScene(base, chapitreId, "eleve_creer_scene");

    expect((await base.rpc("eleve_supprimer_scene", { p_scene: s16.id })).error?.message).toMatch(/ne peux pas supprimer/);
    // Alice a le même profil, mais n'a pas créé S064
    const baseAlice = await (await posteDe(classe.id, alice.inscriptionId)).base();
    expect((await baseAlice.rpc("eleve_supprimer_scene", { p_scene: s64.id })).error?.message).toMatch(/ne peux pas supprimer/);

    expect((await base.rpc("eleve_supprimer_scene", { p_scene: s64.id })).error).toBeNull();
    expect((await scenesLues(base, projet.id)).map((l) => l.id)).toEqual([s16.id]);
    expect((await base.from("scenes").select("id").not("supprime_le", "is", null)).data).toEqual([]);
    // L'enseignant la retrouve dans la corbeille, et seul il la restaure
    expect((await laurent.base.from("scenes").select("id").eq("chapitre_id", chapitreId).not("supprime_le", "is", null)).data).toEqual([{ id: s64.id }]);
    expect((await base.rpc("restaurer_element", { p_sorte: "scene", p_id: s64.id })).error).not.toBeNull();
  });

  it("F06-AC88 — une scène qui contient du travail ne se supprime pas (la base en répond dès que les textes existent)", async () => {
    // À l'étape 2, aucune scène n'a de texte : la règle est en place, sa réponse est « non ».
    // L'étape 3 fait répondre cette fonction d'après le texte, les images et les remises.
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await attribuer(laurent, chapitreId, [{ eleve: bilal.id, profil: "organisation" }]);
    const base = await (await posteDe(classe.id, bilal.inscriptionId)).base();
    const s64 = await creerScene(base, chapitreId, "eleve_creer_scene");
    expect((await base.rpc("scene_contient_du_travail", { p_scene: s64.id })).error).not.toBeNull(); // fonction interne, non exposée
    expect((await base.rpc("eleve_supprimer_scene", { p_scene: s64.id })).error).toBeNull();
  });

  it("F06-AC89 — titre et ordre dans son chapitre seulement ; F06-AC90 — ni consigne, ni départ, ni fin, ni exclusion", async () => {
    const projet = await projetDeClasse();
    const lisiere = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const sanctuaire = await creerChapitre(laurent, lisiere.partieId, "Le sanctuaire");
    const s16 = await creerScene(laurent.base, lisiere.chapitreId);
    const ailleurs = await creerScene(laurent.base, sanctuaire);
    await attribuer(laurent, lisiere.chapitreId, [{ eleve: bilal.id, profil: "organisation" }]);
    await attribuer(laurent, sanctuaire, [{ eleve: bilal.id }]);
    const base = await (await posteDe(classe.id, bilal.inscriptionId)).base();
    const s64 = await creerScene(base, lisiere.chapitreId, "eleve_creer_scene");

    expect((await base.rpc("eleve_titrer_scene", { p_scene: s64.id, p_titre: "  La souche creuse " })).error).toBeNull();
    expect((await base.rpc("eleve_placer_scene", { p_scene: s64.id, p_position: 0 })).error).toBeNull();
    expect((await laurent.base.from("scenes").select("titre").eq("id", s64.id).single()).data?.titre).toBe("La souche creuse");
    expect(await ordre(laurent.base, "scenes", "chapitre_id", lisiere.chapitreId)).toEqual([String(s64.reference), String(s16.reference)]);

    expect((await base.rpc("eleve_titrer_scene", { p_scene: ailleurs.id, p_titre: "Non" })).error?.message).toMatch(/ne peux pas renommer/);
    expect((await base.rpc("eleve_placer_scene", { p_scene: ailleurs.id, p_position: 0 })).error?.message).toMatch(/ne peux pas déplacer/);
    expect((await laurent.base.from("scenes").select("titre").eq("id", ailleurs.id).single()).data?.titre).toBeNull();

    for (const changement of [{ consigne: "Écris ce que tu veux." }, { fin: true }, { hors_livre: true }]) {
      expect((await base.from("scenes").update(changement).eq("id", s64.id)).error, JSON.stringify(changement)).not.toBeNull();
    }
    expect((await base.from("projets").update({ depart_scene_id: s64.id }).eq("id", projet.id)).error).not.toBeNull();
    expect((await laurent.base.from("scenes").select("consigne, fin, hors_livre").eq("id", s64.id).single()).data).toEqual({ consigne: "", fin: false, hors_livre: false });
    expect((await laurent.base.from("projets").select("depart_scene_id").eq("id", projet.id).single()).data?.depart_scene_id).toBeNull();
  });
});

describe("Qui s'occupe d'une scène (F06.3)", () => {
  const prise = async (sceneId: string) => (await laurent.base.from("scenes").select("prise_par_eleve, prise_par_enseignant").eq("id", sceneId).single()).data;
  const confier = (sceneId: string, valeurs: { prise_par_eleve?: string | null; prise_par_enseignant?: boolean }) =>
    laurent.base.from("scenes").update(valeurs).eq("id", sceneId);

  it("F06-AC07 — l'enseignant désigne un élève du chapitre, le change et le retire, sans toucher à la scène", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const scene = await creerScene(laurent.base, chapitreId);
    await laurent.base.from("scenes").update({ titre: "L’entrée du bois", consigne: "Décris la forêt." }).eq("id", scene.id);
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id }]);

    expect((await confier(scene.id, { prise_par_eleve: alice.id })).error).toBeNull();
    expect(await prise(scene.id)).toEqual({ prise_par_eleve: alice.id, prise_par_enseignant: false });
    expect((await confier(scene.id, { prise_par_eleve: bilal.id })).error).toBeNull();
    expect((await confier(scene.id, { prise_par_eleve: null })).error).toBeNull();
    expect(await prise(scene.id)).toEqual({ prise_par_eleve: null, prise_par_enseignant: false });
    expect((await laurent.base.from("scenes").select("titre, consigne").eq("id", scene.id).single()).data).toEqual({ titre: "L’entrée du bois", consigne: "Décris la forêt." });

    // Seul un élève du chapitre : Chloé est dans la classe, pas dans « La lisière »
    expect((await confier(scene.id, { prise_par_eleve: chloe.id })).error?.message).toMatch(/pas attribué au chapitre/);
    // L'enseignant d'un autre compte ne désigne personne
    expect((await martin.base.from("scenes").update({ prise_par_enseignant: true }).eq("id", scene.id).select("id")).data).toEqual([]);
  });

  it("F06-AC62 — l'enseignant s'attribue une scène : ni élève en même temps, ni dans un projet personnel", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const scene = await creerScene(laurent.base, chapitreId);
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
    expect((await confier(scene.id, { prise_par_enseignant: true, prise_par_eleve: null })).error).toBeNull();
    expect((await confier(scene.id, { prise_par_eleve: alice.id })).error).not.toBeNull(); // une seule prise en charge à la fois
    // Il la rend en désignant un élève du chapitre
    expect((await confier(scene.id, { prise_par_enseignant: false, prise_par_eleve: alice.id })).error).toBeNull();
    expect(await prise(scene.id)).toEqual({ prise_par_eleve: alice.id, prise_par_enseignant: false });

    const personnel = await creerProjet(laurent, "personnel", "choix", "Mon histoire");
    const seule = await creerScene(laurent.base, (await creerPartie(laurent, personnel.id, "Partie")).chapitreId);
    expect((await confier(seule.id, { prise_par_enseignant: true })).error?.message).toMatch(/toutes les scènes sont les vôtres/);
  });

  it("F06-AC04, F06-AC06 — les élèves du chapitre lisent qui s'en occupe, d'une séance à l'autre, sans pouvoir le changer", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const [s1, s2] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
    await confier(s1.id, { prise_par_eleve: alice.id });
    await confier(s2.id, { prise_par_enseignant: true });

    for (const eleve of [alice, bilal]) {
      // Un poste neuf à chaque fois : la prise en charge ne tient pas à une session
      const base = await (await posteDe(classe.id, eleve.inscriptionId)).base();
      const { data } = await base.from("scenes").select("id, prise_par_eleve, prise_par_enseignant").eq("projet_id", projet.id).order("reference");
      expect(data, eleve.prenom).toEqual([
        { id: s1.id, prise_par_eleve: alice.id, prise_par_enseignant: false },
        { id: s2.id, prise_par_eleve: null, prise_par_enseignant: true },
      ]);
      expect((await base.from("scenes").update({ prise_par_eleve: eleve.id }).eq("id", s2.id)).error, eleve.prenom).not.toBeNull();
    }
    // Chloé, hors du chapitre, ne lit ni la scène ni qui s'en occupe
    const dehors = await (await posteDe(classe.id, chloe.inscriptionId)).base();
    expect((await dehors.from("scenes").select("prise_par_eleve").eq("projet_id", projet.id)).data).toEqual([]);
  });

  it("F06.3 — un élève retiré du chapitre ne s'occupe plus de ses scènes ; le chapitre supprimé puis restauré les lui rend", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const sanctuaire = await creerChapitre(laurent, foret.partieId, "Le sanctuaire");
    const scene = await creerScene(laurent.base, sanctuaire);
    await attribuer(laurent, sanctuaire, [{ eleve: alice.id }, { eleve: bilal.id }]);
    await confier(scene.id, { prise_par_eleve: alice.id });

    // Supprimer puis restaurer le chapitre ne touche pas à « qui s'en occupe » (F03-AC27)
    await laurent.base.rpc("supprimer_element", { p_sorte: "chapitre", p_id: sanctuaire });
    await laurent.base.rpc("restaurer_element", { p_sorte: "chapitre", p_id: sanctuaire });
    expect((await prise(scene.id))?.prise_par_eleve).toBe(alice.id);

    await attribuer(laurent, sanctuaire, [{ eleve: bilal.id }]);
    expect(await prise(scene.id)).toEqual({ prise_par_eleve: null, prise_par_enseignant: false });
  });

  it("F06-AC86 — l'élève ne supprime pas la scène qu'il a créée si quelqu'un d'autre s'en occupe", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await attribuer(laurent, chapitreId, [{ eleve: bilal.id, profil: "organisation" }, { eleve: alice.id }]);
    const base = await (await posteDe(classe.id, bilal.inscriptionId)).base();
    const [a, b, c] = [await creerScene(base, chapitreId, "eleve_creer_scene"), await creerScene(base, chapitreId, "eleve_creer_scene"), await creerScene(base, chapitreId, "eleve_creer_scene")];
    await confier(a.id, { prise_par_eleve: alice.id });
    await confier(b.id, { prise_par_enseignant: true });
    await confier(c.id, { prise_par_eleve: bilal.id });
    expect((await base.rpc("eleve_supprimer_scene", { p_scene: a.id })).error?.message).toMatch(/ne peux pas supprimer/);
    expect((await base.rpc("eleve_supprimer_scene", { p_scene: b.id })).error?.message).toMatch(/ne peux pas supprimer/);
    // Celle dont il s'occupe lui-même reste la sienne
    expect((await base.rpc("eleve_supprimer_scene", { p_scene: c.id })).error).toBeNull();
  });
});

describe("Ce que lit un élève (F06.2, F02, F07.1)", () => {
  it("F06-AC18 — l'attribution suffit, sans seconde ouverture ; F06-AC19, F01-AC09 — sans chapitre, aucune scène", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const scene = await creerScene(laurent.base, chapitreId);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    // Le projet est rattaché à sa classe, mais aucun chapitre ne lui est attribué
    expect((await scenesLues(await poste.base(), projet.id))).toEqual([]);
    expect((await (await poste.base()).rpc("consignes_du_chapitre", { p_chapitre: chapitreId })).data).toEqual([]);

    await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
    expect((await scenesLues(await poste.base(), projet.id))).toEqual([{ id: scene.id }]);
    expect((await (await poste.base()).from("attributions").select("profil").eq("chapitre_id", chapitreId).eq("eleve_id", alice.id).single()).data?.profil).toBe("propositions");
  });

  it("F06-AC20 — les deux profils lisent les scènes de leurs camarades de chapitre ; F06-AC21 — pas celles d'un autre chapitre", async () => {
    const projet = await projetDeClasse();
    const a = await creerPartie(laurent, projet.id, "A", "Chapitre A");
    const b = await creerPartie(laurent, projet.id, "B", "Chapitre B");
    const [sa, sb] = [await creerScene(laurent.base, a.chapitreId), await creerScene(laurent.base, b.chapitreId)];
    await attribuer(laurent, a.chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
    await attribuer(laurent, b.chapitreId, [{ eleve: chloe.id }]);

    for (const eleve of [alice, bilal]) {
      const base = await (await posteDe(classe.id, eleve.inscriptionId)).base();
      expect((await scenesLues(base, projet.id)), eleve.prenom).toEqual([{ id: sa.id }]);
      expect((await base.from("scenes").select("id").eq("id", sb.id)).data).toEqual([]);
      expect((await base.rpc("consignes_du_chapitre", { p_chapitre: b.chapitreId })).data).toEqual([]);
      // Les camarades du chapitre se voient entre eux, pas ceux des autres chapitres
      expect(((await base.from("attributions").select("eleve_id").eq("projet_id", projet.id)).data ?? []).map((l) => l.eleve_id).sort()).toEqual([alice.id, bilal.id].sort());
    }
  });

  it("F03-AC15, F06-AC22 — les cartes se voient sans attribution : titre et image, ni scènes, ni consigne, ni résumé", async () => {
    const projet = await projetDeClasse();
    const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const sanctuaire = await creerChapitre(laurent, foret.partieId, "Le sanctuaire");
    await laurent.base.from("chapitres").update({ resume: "Le héros découvre l'autel." }).eq("id", sanctuaire);
    const scene = await creerScene(laurent.base, sanctuaire);
    await laurent.base.from("scenes").update({ consigne: "Décris l'autel." }).eq("id", scene.id);
    await attribuer(laurent, foret.chapitreId, [{ eleve: alice.id }]);
    const base = await (await posteDe(classe.id, alice.inscriptionId)).base();

    const cartes = await base.from("chapitres").select("titre, couleur, visuel_defaut").eq("projet_id", projet.id).order("rang");
    expect(cartes.data?.map((c) => c.titre)).toEqual(["La lisière", "Le sanctuaire"]);
    expect((await base.from("parties").select("titre").eq("projet_id", projet.id)).data).toEqual([{ titre: "La forêt" }]);
    // Ni le résumé ni la consigne ne sont des colonnes que le poste peut demander
    expect((await base.from("chapitres").select("resume").eq("id", sanctuaire)).error).not.toBeNull();
    expect((await base.from("scenes").select("consigne")).error).not.toBeNull();
    expect((await base.rpc("resume_du_chapitre", { p_chapitre: sanctuaire })).data).toBeNull();
    expect((await base.rpc("consignes_du_chapitre", { p_chapitre: sanctuaire })).data).toEqual([]);
    expect((await base.from("scenes").select("id").eq("chapitre_id", sanctuaire)).data).toEqual([]);
  });

  it("F02-AC15 — le résumé se lit dans le chapitre attribué ; F02-AC16, F07-AC19 — ni résumé ni consigne ne sont exigés", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    const [s1, s2] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
    const alicePoste = await (await posteDe(classe.id, alice.inscriptionId)).base();
    const bilalPoste = await (await posteDe(classe.id, bilal.inscriptionId)).base();

    // Sans résumé ni consigne : la scène est là, à écrire
    expect((await alicePoste.rpc("resume_du_chapitre", { p_chapitre: chapitreId })).data).toBe("");
    expect((await alicePoste.rpc("consignes_du_chapitre", { p_chapitre: chapitreId })).data).toHaveLength(2);

    await laurent.base.from("chapitres").update({ resume: "Lou entre dans la forêt." }).eq("id", chapitreId);
    await laurent.base.from("scenes").update({ consigne: "Raconte le premier pas de Lou sous les arbres." }).eq("id", s1.id);
    expect((await alicePoste.rpc("resume_du_chapitre", { p_chapitre: chapitreId })).data).toBe("Lou entre dans la forêt.");
    expect((await bilalPoste.rpc("resume_du_chapitre", { p_chapitre: chapitreId })).data).toBeNull();
    const consignes = ((await alicePoste.rpc("consignes_du_chapitre", { p_chapitre: chapitreId })).data ?? []) as { scene_id: string; consigne: string }[];
    expect(consignes.find((c) => c.scene_id === s1.id)?.consigne).toBe("Raconte le premier pas de Lou sous les arbres.");
    expect(consignes.find((c) => c.scene_id === s2.id)?.consigne).toBe("");
  });

  it("F07-AC20 — l'absence de consigne se lit pour l'enseignant, sans rien bloquer", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await creerScene(laurent.base, chapitreId);
    const avec = await creerScene(laurent.base, chapitreId);
    await laurent.base.from("scenes").update({ consigne: "Décris la clairière." }).eq("id", avec.id);
    const { data } = await laurent.base.from("scenes").select("reference").eq("chapitre_id", chapitreId).eq("consigne", "");
    expect(data).toHaveLength(1);
  });

  it("F02-AC04, F02-AC06 — la préparation ne se lit ni ne se modifie depuis un poste, quel que soit le profil", async () => {
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await laurent.base.from("preparations").update({ personnages: "Lou, 10 ans, fils du dernier passeur." }).eq("projet_id", projet.id);
    await laurent.base.from("pistes").insert({ projet_id: projet.id, enseignant_id: laurent.id, rubrique: "personnages", texte: "Des jumeaux inséparables", etat: "ecartee" });
    await laurent.base.from("objets").insert({ projet_id: projet.id, enseignant_id: laurent.id, nom: "la lanterne sourde" });
    await attribuer(laurent, chapitreId, [{ eleve: bilal.id, profil: "organisation" }]);
    const base = await (await posteDe(classe.id, bilal.inscriptionId)).base();

    for (const table of ["preparations", "pistes", "objets", "formules", "images"]) {
      const { lignes, refus } = await lire(base, table);
      expect(lignes, table).toEqual([]);
      expect(refus, table).not.toBeNull();
    }
    expect((await base.from("preparations").update({ personnages: "Piraté" }).eq("projet_id", projet.id)).error).not.toBeNull();
    // Ses droits dans le chapitre restent ceux de son profil
    expect((await base.rpc("eleve_creer_scene", { p_chapitre: chapitreId })).error).toBeNull();
    expect((await laurent.base.from("preparations").select("personnages").eq("projet_id", projet.id).single()).data?.personnages).toBe("Lou, 10 ans, fils du dernier passeur.");
  });

  it("F06-AC48, F06-AC49 — la lecture ouverte montre les scènes des autres chapitres, sans leurs consignes ; refermée, plus rien", async () => {
    const projet = await projetDeClasse();
    const port = await creerPartie(laurent, projet.id, "Le départ", "Le port");
    const sanctuaire = await creerPartie(laurent, projet.id, "La forêt", "Le sanctuaire");
    const [sp, ss] = [await creerScene(laurent.base, port.chapitreId), await creerScene(laurent.base, sanctuaire.chapitreId)];
    await laurent.base.from("scenes").update({ consigne: "Décris l'autel." }).eq("id", ss.id);
    await attribuer(laurent, port.chapitreId, [{ eleve: alice.id, profil: "organisation" }]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    expect((await scenesLues(await poste.base(), projet.id))).toEqual([{ id: sp.id }]);

    expect((await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", projet.id)).error).toBeNull();
    const base = await poste.base();
    expect((await scenesLues(base, projet.id)).map((l) => l.id).sort()).toEqual([sp.id, ss.id].sort());
    // Lire n'est pas écrire, ni consulter la consigne
    expect((await base.rpc("consignes_du_chapitre", { p_chapitre: sanctuaire.chapitreId })).data).toEqual([]);
    expect((await base.rpc("eleve_creer_scene", { p_chapitre: sanctuaire.chapitreId })).error).not.toBeNull();
    expect((await base.rpc("eleve_titrer_scene", { p_scene: ss.id, p_titre: "Non" })).error).not.toBeNull();

    await laurent.base.from("projets").update({ lecture_ouverte: false }).eq("id", projet.id);
    expect((await scenesLues(await poste.base(), projet.id))).toEqual([{ id: sp.id }]);
    // Sans objet en mode personnel
    const personnel = await creerProjet(laurent, "personnel", "choix", "Mon histoire");
    expect((await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", personnel.id)).error).not.toBeNull();
  });

  it("F06-AC27 — hors des horaires, le poste ne lit plus rien du récit ; F06-AC28 — de retour dans la plage, tout est là", async () => {
    const autre = await creerClasse(laurent, "CM1");
    const [emma] = await inscrire(laurent, autre.id, ["Emma"]);
    const projet = await creerProjet(laurent, "classe", "choix", "Horaires", autre.id);
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await creerScene(laurent.base, chapitreId);
    await attribuer(laurent, chapitreId, [{ eleve: emma.id, profil: "organisation" }]);
    const poste = await posteDe(autre.id, emma.inscriptionId);
    expect((await scenesLues(await poste.base(), projet.id))).toHaveLength(1);

    const hier = ((new Date().getUTCDay() + 5) % 7) + 1;
    await laurent.base.rpc("regler_horaires", { p_classe: autre.id, p_limites: true, p_plages: [{ jours: [hier], de: "00:00", a: "00:01" }] });
    const base = await poste.base();
    for (const table of ["projets", "parties", "chapitres", "scenes", "attributions"]) {
      expect((await lire(base, table, "*")).lignes, table).toEqual([]);
    }
    expect((await base.rpc("eleve_creer_scene", { p_chapitre: chapitreId })).error).not.toBeNull();

    await laurent.base.rpc("regler_horaires", { p_classe: autre.id, p_limites: false, p_plages: [] });
    expect((await scenesLues(await poste.base(), projet.id))).toHaveLength(1);
    expect((await (await poste.base()).from("attributions").select("profil").eq("eleve_id", emma.id).single()).data?.profil).toBe("organisation");
  });

  it("F06-AC16 — après un changement d'élève, les droits sont ceux du nouvel élève", async () => {
    const projet = await projetDeClasse();
    const a = await creerPartie(laurent, projet.id, "A", "Chapitre A");
    const b = await creerPartie(laurent, projet.id, "B", "Chapitre B");
    const [sa, sb] = [await creerScene(laurent.base, a.chapitreId), await creerScene(laurent.base, b.chapitreId)];
    await attribuer(laurent, a.chapitreId, [{ eleve: alice.id }]);
    await attribuer(laurent, b.chapitreId, [{ eleve: bilal.id }]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    expect((await scenesLues(await poste.base(), projet.id))).toEqual([{ id: sa.id }]);
    await service().rpc("changer_eleve", { p_poste: poste.id });
    expect((await scenesLues(await poste.base(), projet.id))).toEqual([]);
    await identifier(poste, bilal.inscriptionId);
    expect((await scenesLues(await poste.base(), projet.id))).toEqual([{ id: sb.id }]);
  });

  it("un élève ne lit rien du récit d'une autre classe, ni d'un projet personnel", async () => {
    const autre = await creerClasse(martin, "CM2");
    const [zoe] = await inscrire(martin, autre.id, ["Zoé"]);
    const projet = await projetDeClasse();
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
    await creerScene(laurent.base, chapitreId);
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", projet.id);
    const personnel = await creerProjet(laurent, "personnel", "choix", "Mon histoire");
    await creerPartie(laurent, personnel.id, "Secret");

    const base = await (await posteDe(autre.id, zoe.inscriptionId)).base();
    for (const table of ["projets", "parties", "chapitres", "scenes", "attributions"]) {
      expect((await lire(base, table, "*")).lignes, table).toEqual([]);
    }
    const local = await (await posteDe(classe.id, alice.inscriptionId)).base();
    expect(((await local.from("parties").select("titre")).data ?? []).map((p) => p.titre)).not.toContain("Secret");
  });
});

describe("Préparation (F02)", () => {
  it("F02-AC01, F02-AC07 — la préparation se garde rubrique par rubrique, sans rien exiger des autres", async () => {
    const projet = await projetDeClasse();
    const { data: vide } = await laurent.base.from("preparations").select("univers, personnages, enjeu, rubrique_jeu, formule_renvoi, constructions, marque_fin").eq("projet_id", projet.id).single();
    expect(vide).toEqual({ univers: "", personnages: "", enjeu: "", rubrique_jeu: false, formule_renvoi: "rends", constructions: ["neutre"], marque_fin: "Fin" });

    expect((await laurent.base.from("preparations").update({ personnages: "Lou, 10 ans.", enjeu: "Retrouver son père." }).eq("projet_id", projet.id)).error).toBeNull();
    // Les rubriques univers et grandes étapes restent vides : l'organisation du récit n'attend pas
    expect((await laurent.base.rpc("creer_partie", { p_projet: projet.id, p_titre: "La forêt", p_visuel: "foret", p_titre_chapitre: "La lisière", p_couleur: 0, p_visuel_chapitre: "mer" })).error).toBeNull();
    expect((await laurent.base.from("preparations").select("personnages, enjeu, univers").eq("projet_id", projet.id).single()).data).toEqual({ personnages: "Lou, 10 ans.", enjeu: "Retrouver son père.", univers: "" });
  });

  it("F02-AC17 — une piste écartée reste dans sa rubrique, avec son statut", async () => {
    const projet = await projetDeClasse();
    const piste = (texte: string, etat: string) => ({ projet_id: projet.id, enseignant_id: laurent.id, rubrique: "personnages", texte, etat });
    expect((await laurent.base.from("pistes").insert([piste("Lou, fils du dernier passeur", "retenue"), piste("Des jumeaux inséparables", "discuter")])).error).toBeNull();
    await laurent.base.from("pistes").update({ etat: "ecartee" }).eq("projet_id", projet.id).eq("texte", "Des jumeaux inséparables");
    const { data } = await laurent.base.from("pistes").select("texte").eq("projet_id", projet.id).eq("rubrique", "personnages").eq("etat", "ecartee");
    expect(data).toEqual([{ texte: "Des jumeaux inséparables" }]);
    expect((await laurent.base.from("pistes").insert(piste("Mauvais statut", "votee"))).error).not.toBeNull();
  });

  it("F04.2, F11.6 — les réglages du jeu et des phrases de choix n'acceptent que leurs valeurs", async () => {
    const projet = await projetDeClasse();
    const maj = (valeurs: Record<string, unknown>) => laurent.base.from("preparations").update(valeurs).eq("projet_id", projet.id);
    expect((await maj({ formule_renvoi: "va", constructions: ["neutre", "pour"], marque_fin: "FIN" })).error).toBeNull();
    expect((await maj({ formule_renvoi: "cours" })).error).not.toBeNull();
    expect((await maj({ constructions: ["pour"] })).error).not.toBeNull(); // la première construction reste toujours disponible
    expect((await maj({ constructions: ["neutre", "inventee"] })).error).not.toBeNull();
    // La préparation d'un autre enseignant ne se lit ni ne se modifie
    expect((await lire(martin.base, "preparations")).lignes).toEqual([]);
    expect((await martin.base.from("preparations").update({ univers: "Piraté" }).eq("projet_id", projet.id).select("projet_id")).data).toEqual([]);
  });
});
