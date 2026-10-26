import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ouvrirCanal } from "@/serveur/partage";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, ouvrirPoste, identifier, posteDe, sql, type Adulte, type ClasseEssai, type EleveEssai } from "./outils";

/**
 * Bibliothèque publique des livres (F15), lot 6 : « Lire », côté élève — la classe terminée qui
 * garde « Lire » seul, la bibliothèque de l'âge de la classe, son réglage, les cœurs et la lecture
 * par profil (F15-AC16, AC20).
 */

let laurent: Adulte;
let martin: Adulte;
let cm1: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;

beforeAll(async () => {
  [laurent, martin] = await Promise.all([creerEnseignant("Mme Laurent"), creerEnseignant("M. Martin")]);
  cm1 = await creerClasse(laurent, `CM1 ${randomUUID().slice(0, 4)}`);
  [alice, bilal] = await inscrire(laurent, cm1.id, ["Alice", "Bilal"]);
  // Le projet le plus récent de la classe dit son âge : « 8 à 10 ans »
  await sql("insert into public.projets (enseignant_id, organisation, recit, titre, classe_id, age_des_lecteurs) values ($1, 'classe', 'choix', 'Notre livre', $2, '8-10')", [laurent.id, cm1.id]);
});
afterAll(nettoyer);

/** Un livre de M. Martin publié dans la bibliothèque, pour un âge. */
async function publie(titre: string, age: string): Promise<{ projet: string; adresse: string }> {
  const projet = await creerProjet(martin, "personnel", "choix", titre);
  const adresse = `${titre.toLowerCase().replace(/[^a-z]+/g, "-")}-${randomUUID().slice(0, 6)}`;
  await sql(
    `insert into public.publications (projet_id, enseignant_id, adresse, version, presentation, age, empreinte, publiee_le, mise_a_jour_le)
     values ($1, $2, $3, jsonb_build_object('titre', $4::text, 'aChoix', true, 'passages', '[]'::jsonb, 'images', '{}'::jsonb), 'Une histoire.', $5, repeat('a', 32), now(), now())`,
    [projet.id, martin.id, adresse, titre, age],
  );
  return { projet: projet.id, adresse };
}

const bibliotheque = async (e: EleveEssai) => {
  const poste = await posteDe(cm1.id, e.inscriptionId);
  const { data, error } = await (await poste.base()).rpc("bibliotheque_du_poste");
  if (error) throw new Error(error.message);
  return (data ?? []) as { adresse: string; coeurs: number; donne: boolean }[];
};

describe("La bibliothèque dans « Lire » (F15)", () => {
  it("F15-AC20 — après les livres de l'enseignante, ceux de l'âge de la classe ; jamais « Adultes » ; éteinte dans les réglages, elle disparaît", async () => {
    const pour = await publie("La lanterne", "8-10");
    const grands = await publie("Le grand", "10-12");
    const adultes = await publie("Pour adultes", "adultes");
    const vus = (await bibliotheque(alice)).map((l) => l.adresse);
    expect(vus).toContain(pour.adresse);
    expect(vus).not.toContain(grands.adresse);
    expect(vus).not.toContain(adultes.adresse);

    expect((await laurent.base.from("classes").update({ bibliotheque_dans_lire: false }).eq("id", cm1.id).select("id")).data).toHaveLength(1);
    expect(await bibliotheque(alice)).toEqual([]);
    await laurent.base.from("classes").update({ bibliotheque_dans_lire: true }).eq("id", cm1.id);
  });

  it("F15-AC20 — un cœur par profil, non par poste ; la lecture gardée pour l'élève", async () => {
    const l = await publie("Le phare", "8-10");
    for (const e of [alice, bilal]) {
      const base = await (await posteDe(cm1.id, e.inscriptionId)).base();
      expect((await base.rpc("coeur_du_poste", { p_adresse: l.adresse, p_oui: true })).data).toMatchObject({ etat: "fait", donne: true });
    }
    const vu = (await bibliotheque(alice)).find((x) => x.adresse === l.adresse)!;
    expect(vu).toMatchObject({ coeurs: 2, donne: true });
    // Un livre « Adultes » ne se donne pas, ne se lit pas
    const adultes = await publie("Pour adultes", "adultes");
    const base = await (await posteDe(cm1.id, alice.inscriptionId)).base();
    expect((await base.rpc("coeur_du_poste", { p_adresse: adultes.adresse, p_oui: true })).data).toEqual({ etat: "absent" });
    expect((await base.rpc("livre_de_la_bibliotheque_du_poste", { p_adresse: adultes.adresse })).data).toBeNull();

    const lecture = { parcours: { etapes: ["x"], position: 0 }, deja: [], feuille: null, des: null };
    expect((await base.rpc("garder_lecture_bibliotheque_du_poste", { p_adresse: l.adresse, p_lecture: lecture })).data).toBe(true);
    const lu = (await base.rpc("livre_de_la_bibliotheque_du_poste", { p_adresse: l.adresse })).data as { lecture: unknown; donne: boolean };
    expect(lu).toMatchObject({ lecture, donne: true });
  });
});

describe("Fin d'année : « Lire » reste ouvert (F15)", () => {
  it("F15-AC16 — la classe terminée : Alice s'identifie et lit le livre partagé « À mes classes », sans rien écrire ; supprimée, ses identifiants n'ouvrent plus rien", async () => {
    const classe = await creerClasse(laurent, `CM2 ${randomUUID().slice(0, 4)}`);
    const [zoe] = await inscrire(laurent, classe.id, ["Zoé"]);
    const projet = await creerProjet(laurent, "classe", "choix", "La lanterne du passeur", classe.id);
    const { chapitreId } = await creerPartie(laurent, projet.id, "Le fleuve", "Le quai");
    const scene = await creerScene(laurent.base, chapitreId);
    await laurent.base.from("projets").update({ depart_scene_id: scene.id }).eq("id", projet.id);
    const { data } = await laurent.base.from("scenes").select("version").eq("id", scene.id).single();
    await laurent.base.rpc("enregistrer_texte", { p_scene: scene.id, p_version: data!.version, p_texte: [{ type: "p", id: randomUUID(), children: [{ text: "La lanterne s’allume." }] }] });
    await laurent.base.from("scenes").update({ fin: true }).eq("id", scene.id);
    await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
    await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
    expect(await ouvrirCanal(enseignantDe(laurent), projet.id, "classes", true)).toEqual({ ok: true });

    await laurent.base.from("classes").update({ terminee_le: new Date().toISOString() }).eq("id", classe.id);
    const poste = (await ouvrirPoste(classe.id))!;
    expect(await identifier(poste, zoe.inscriptionId)).toBe(true);
    const base = await poste.base();
    const livres = (await base.rpc("livres_du_poste")).data as { projet_id: string }[];
    expect(livres.map((l) => l.projet_id)).toContain(projet.id);
    expect((await base.rpc("livre_du_poste", { p_projet: projet.id })).data).toMatchObject({ version: { titre: "La lanterne du passeur" } });
    // Rien ne s'écrit : la scène ne se lit même pas comme travail
    expect((await base.from("scenes").select("id").eq("projet_id", projet.id)).data ?? []).toEqual([]);

    // Supprimée : ce poste se ferme, et la classe ne s'ouvre plus
    expect((await laurent.base.rpc("supprimer_la_classe", { p_classe: classe.id })).error).toBeNull();
    expect(await ouvrirPoste(classe.id)).toBeNull();
  });
});
