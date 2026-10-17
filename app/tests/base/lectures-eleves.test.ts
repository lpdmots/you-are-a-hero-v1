import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ouvrirCanal } from "@/serveur/partage";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, nettoyer, posteDe, sql, type Adulte, type ClasseEssai, type EleveEssai, enseignantDe } from "./outils";

/**
 * Étape 7 du plan, lot 3 : la lecture par les classes contre la vraie base locale (F12.3) —
 * les livres ouverts aux classes en cours de l'enseignant, à toute heure, la version seule, et
 * la lecture gardée pour chaque élève, d'un poste à l'autre (F12-AC26, F04-AC22).
 */

let laurent: Adulte;
let martin: Adulte;
let cm2: ClasseEssai;
let ce2: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;
let chloe: EleveEssai;
let zoe: EleveEssai;

beforeAll(async () => {
  [laurent, martin] = await Promise.all([creerEnseignant("Mme Laurent"), creerEnseignant("M. Martin")]);
  [cm2, ce2] = [await creerClasse(laurent, "CM2"), await creerClasse(laurent, "CE2")];
  [alice, bilal] = await inscrire(laurent, cm2.id, ["Alice", "Bilal"]);
  [chloe] = await inscrire(laurent, ce2.id, ["Chloé"]);
  const autre = await creerClasse(martin, "CM1");
  [zoe] = await inscrire(martin, autre.id, ["Zoé"]);
});
afterAll(nettoyer);

const enseignant = enseignantDe;
const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const note = (t: string) => ({ type: "note", id: randomUUID(), children: [{ text: t }] });

/** Un livre d'une scène, prêt à partager, de la classe donnée ou personnel. */
async function livre(titre: string, classeId: string | null): Promise<string> {
  const projet = await creerProjet(laurent, classeId ? "classe" : "personnel", "choix", titre, classeId);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La côte", "La plage");
  const scene = await creerScene(laurent.base, chapitreId);
  await laurent.base.from("projets").update({ depart_scene_id: scene.id }).eq("id", projet.id);
  const { data } = await laurent.base.from("scenes").select("version").eq("id", scene.id).single();
  await laurent.base.rpc("enregistrer_texte", { p_scene: scene.id, p_version: data!.version, p_texte: [paragraphe(`${titre} commence.`), note("Remarque pour Bilal")] });
  await laurent.base.from("scenes").update({ fin: true }).eq("id", scene.id);
  await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
  await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
  return projet.id;
}

const livresDe = async (e: EleveEssai, classe: ClasseEssai) => {
  const poste = await posteDe(classe.id, e.inscriptionId);
  const { data, error } = await (await poste.base()).rpc("livres_du_poste");
  if (error) throw new Error(error.message);
  return (data ?? []) as { projet_id: string; titre: string; de_ma_classe: boolean; ligne: string | null }[];
};

describe("Livres ouverts aux classes (F12.3)", () => {
  it("F12-AC06, F12-AC12 — un livre non proposé n'apparaît pas ; proposé aux classes seulement, il se lit sans lien, dans toutes les classes en cours", async () => {
    const phare = await livre("Le phare", cm2.id);
    expect((await livresDe(alice, cm2)).map((l) => l.projet_id)).not.toContain(phare);
    // Partagé par le seul lien : pas dans les lectures
    await ouvrirCanal(enseignant(laurent), phare, "lien", true);
    expect((await livresDe(alice, cm2)).map((l) => l.projet_id)).not.toContain(phare);
    await ouvrirCanal(enseignant(laurent), phare, "classes", true);
    expect((await livresDe(alice, cm2)).find((l) => l.projet_id === phare)).toMatchObject({ titre: "Le phare", de_ma_classe: true });
    expect((await livresDe(chloe, ce2)).find((l) => l.projet_id === phare)).toMatchObject({ de_ma_classe: false });
    // La classe d'un autre enseignant ne le voit pas
    expect((await livresDe(zoe, { ...cm2, id: (await sql<{ classe_id: string }>("select classe_id from public.inscriptions where id = $1", [zoe.inscriptionId]))[0].classe_id })).map((l) => l.projet_id)).not.toContain(phare);
  });

  it("F12-AC24 — un récit personnel proposé aux classes, sans « Écrit par ta classe »", async () => {
    const perso = await livre("Mon livre-modèle", null);
    await ouvrirCanal(enseignant(laurent), perso, "classes", true);
    expect((await livresDe(alice, cm2)).find((l) => l.projet_id === perso)).toMatchObject({ de_ma_classe: false });
  });

  it("F06-AC31 — hors des horaires de la classe, les livres se lisent encore", async () => {
    const soir = await livre("Le soir", cm2.id);
    await ouvrirCanal(enseignant(laurent), soir, "classes", true);
    await sql("insert into public.horaires (classe_id, enseignant_id, jours, de, a) values ($1, $2, '{1,2,3,4,5,6,7}', '00:00', '00:01')", [cm2.id, laurent.id]);
    await sql("update public.classes set horaires_limites = true where id = $1", [cm2.id]);
    try {
      const poste = await posteDe(cm2.id, alice.inscriptionId);
      const base = await poste.base();
      expect((await base.rpc("travail_ouvert")).data).toBe(false);
      const { data } = await base.rpc("livre_du_poste", { p_projet: soir });
      expect((data as { version: { titre: string } }).version.titre).toBe("Le soir");
    } finally {
      await sql("update public.classes set horaires_limites = false where id = $1", [cm2.id]);
      await sql("delete from public.horaires where classe_id = $1", [cm2.id]);
    }
  });

  it("F12-AC07 — l'élève reçoit la version, sans note de l'enseignant ni accès au travail d'un projet qui n'est pas le sien", async () => {
    const perso = await livre("Le carnet", null);
    await ouvrirCanal(enseignant(laurent), perso, "classes", true);
    const base = await (await posteDe(cm2.id, alice.inscriptionId)).base();
    const { data } = await base.rpc("livre_du_poste", { p_projet: perso });
    expect(JSON.stringify(data)).toContain("Le carnet commence.");
    expect(JSON.stringify(data)).not.toContain("Remarque pour Bilal");
    expect((await base.from("scenes").select("id").eq("projet_id", perso)).data ?? []).toEqual([]);
    expect((await base.from("partages").select("code")).data ?? []).toEqual([]);
    // Le partage retiré : plus rien
    await sql("update public.partages set aux_classes = false, version = null, etat_du = null, empreinte = null, empreinte_lecture = null where projet_id = $1", [perso]);
    expect((await base.rpc("livre_du_poste", { p_projet: perso })).data).toBeNull();
  });
});

describe("Lecture gardée pour l'élève (F12-AC26, F04-AC22)", () => {
  it("la lecture d'Alice la suit d'un poste à l'autre ; Bilal, sur le même poste, ne voit pas sa feuille ; rien n'est gardé pour un livre fermé", async () => {
    const lanterne = await livre("La lanterne", cm2.id);
    await ouvrirCanal(enseignant(laurent), lanterne, "classes", true);
    const lecture = { parcours: { etapes: ["a", "b"], position: 1 }, deja: [], feuille: { compteurs: { "heros/vol": 2 }, listes: { inv: ["couteau"] }, notes: {} }, des: null };
    const poste4 = await (await posteDe(cm2.id, alice.inscriptionId)).base();
    expect((await poste4.rpc("garder_lecture_du_poste", { p_projet: lanterne, p_lecture: lecture })).data).toBe(true);
    const poste7 = await (await posteDe(cm2.id, alice.inscriptionId)).base();
    expect(((await poste7.rpc("livre_du_poste", { p_projet: lanterne })).data as { lecture: unknown }).lecture).toEqual(lecture);
    const bilalIci = await (await posteDe(cm2.id, bilal.inscriptionId)).base();
    expect(((await bilalIci.rpc("livre_du_poste", { p_projet: lanterne })).data as { lecture: unknown }).lecture).toBeNull();
    // Personne ne lit la table directement
    expect((await poste7.from("lectures_en_cours").select("lecture")).data ?? []).toEqual([]);
    expect((await laurent.base.from("lectures_en_cours").select("lecture")).data ?? []).toEqual([]);
    // Un livre qui n'est plus ouvert aux classes : rien n'est gardé
    const ferme = await livre("Fermé", cm2.id);
    expect((await poste4.rpc("garder_lecture_du_poste", { p_projet: ferme, p_lecture: lecture })).data).toBe(false);
  });
});
