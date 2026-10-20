import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { creerChapitre, creerEnseignant, creerPartie, creerProjet, creerScene, nettoyer, service, sql, type Adulte } from "./outils";

/**
 * Étape 9, lot 4 : les limites gratuites et le pass (F14-AC12 à AC17), contre la vraie base
 * locale. L'interrupteur « Paiement ouvert » est global : chaque essai le règle, et il est remis
 * comme il était à la fin.
 */

let bernard: Adulte;
let avant: boolean;
beforeAll(async () => {
  bernard = await creerEnseignant("M. Bernard");
  avant = (await sql<{ p: boolean }>("select paiement_ouvert as p from public.reglages_application"))[0].p;
});
afterEach(() => interrupteur(false));
afterAll(async () => {
  await interrupteur(avant);
  await nettoyer();
});

const interrupteur = (allume: boolean) => sql("update public.reglages_application set paiement_ouvert = $1", [allume]);
const limites = async (projet: string) => {
  const { data } = await bernard.base.rpc("limites_du_projet", { p_projet: projet });
  return (Array.isArray(data) ? data[0] : data) as { limite: boolean; pass: boolean; scenes: number; images: number };
};

/** Un projet de n scènes, en lots, pour aller vite ; la limite est éteinte pendant qu'on le remplit. */
async function projetDe(n: number, titre = "Le marais") {
  const projet = (await creerProjet(bernard, "personnel", "choix", titre)).id;
  const { chapitreId } = await creerPartie(bernard, projet, "La traversée", "Le dernier bac");
  const scenes: string[] = [];
  for (let i = 0; i < n; i++) scenes.push((await creerScene(bernard.base, chapitreId)).id);
  return { projet, chapitre: chapitreId, scenes };
}

const creer = (chapitre: string) => bernard.base.rpc("creer_scene", { p_chapitre: chapitre });

/** Une image du projet, sans fichier : la limite ne compte que ses poses dans le livre. */
async function image(projet: string): Promise<string> {
  const id = randomUUID();
  const { error } = await bernard.base.from("images").insert({
    id, projet_id: projet, enseignant_id: bernard.id, chemin: `${bernard.id}/${projet}/${id}.jpg`, chemin_vignette: `${bernard.id}/${projet}/${id}-v.jpg`, largeur: 240, hauteur: 160, format: "jpeg",
  });
  if (error) throw new Error(error.message);
  return id;
}
const bloc = (imageId: string) => ({ type: "image", id: randomUUID(), image: imageId, largeur: 60, children: [{ text: "" }] });
const p = (texte: string) => ({ type: "p", id: randomUUID(), children: [{ text: texte }] });
async function ecrire(scene: string, texte: unknown[]) {
  const [{ version }] = await sql<{ version: number }>("select version from public.scenes where id = $1", [scene]);
  return bernard.base.rpc("enregistrer_texte", { p_scene: scene, p_version: version, p_texte: texte });
}

describe("Limites gratuites (F14-AC12 à AC15)", () => {
  it("F14-AC12 — interrupteur éteint : une 41e scène et une 11e image passent, et rien ne se dit limité", async () => {
    const m = await projetDe(40);
    expect((await creer(m.chapitre)).error).toBeNull();
    const ids = await Promise.all(Array.from({ length: 11 }, () => image(m.projet)));
    const r = await ecrire(m.scenes[0], [p("Le bac."), ...ids.map(bloc)]);
    expect(r.error).toBeNull();
    expect(await limites(m.projet)).toMatchObject({ limite: false, pass: false, scenes: 41, images: 11 });
  });

  it("F14-AC13 — allumé : à 40 scènes dont 2 à la corbeille, une scène se crée ; à 40 hors corbeille, la suivante est refusée ; les scènes existantes s'écrivent", async () => {
    const m = await projetDe(40);
    await sql("update public.scenes set supprime_le = now() where id = any($1)", [[m.scenes[0], m.scenes[1]]]);
    await interrupteur(true);
    expect(await limites(m.projet)).toMatchObject({ limite: true, scenes: 38 });
    expect((await creer(m.chapitre)).error).toBeNull();
    expect((await creer(m.chapitre)).error).toBeNull();
    const refus = await creer(m.chapitre);
    expect(refus.error?.code).toBe("LIM01");
    expect(await limites(m.projet)).toMatchObject({ scenes: 40 });
    expect((await ecrire(m.scenes[5], [p("Le passeur lève sa lanterne.")])).error).toBeNull();
    // Une scène sortie de la corbeille n'est pas créée : elle revient
    expect((await bernard.base.rpc("restaurer_element", { p_sorte: "scene", p_id: m.scenes[0] })).error).toBeNull();
    // Un chapitre de plus se crée, sans scène
    const { partieId } = await creerPartie(bernard, m.projet, "La rive", "Le saule");
    expect(await creerChapitre(bernard, partieId, "La cabane")).toBeTruthy();
  });

  it("F14-AC14 — allumé, livre à 10 images (scènes et page de titre) : une 11e image dans une scène est refusée ; une image de repérage passe ; retirer une image passe", async () => {
    const m = await projetDe(2);
    const ids = await Promise.all(Array.from({ length: 11 }, () => image(m.projet)));
    expect((await ecrire(m.scenes[0], [p("Le bac."), ...ids.slice(0, 9).map(bloc)])).error).toBeNull();
    await bernard.base.from("projets").update({ pages_du_livre: { titre: { forme: "modele", illustration: ids[9] } } }).eq("id", m.projet);
    await interrupteur(true);
    expect(await limites(m.projet)).toMatchObject({ limite: true, images: 10 });
    const refus = await ecrire(m.scenes[1], [p("La rive."), bloc(ids[10])]);
    expect(refus.error?.code).toBe("LIM02");
    // Une page de présentation en image pleine page ne passe pas non plus
    const page = await bernard.base.from("projets").update({ pages_du_livre: { titre: { forme: "modele", illustration: ids[9] }, fin: { presente: true, forme: "image", imageId: ids[10] } } }).eq("id", m.projet);
    expect(page.error?.code).toBe("LIM02");
    // Image de repérage d'un chapitre : rien ne l'empêche
    expect((await bernard.base.from("chapitres").update({ image_id: ids[10] }).eq("id", m.chapitre)).error).toBeNull();
    // Écrire, ou retirer une image, passe toujours
    expect((await ecrire(m.scenes[0], [p("Le bac, au matin."), ...ids.slice(0, 8).map(bloc)])).error).toBeNull();
    expect(await limites(m.projet)).toMatchObject({ images: 9 });
    expect((await ecrire(m.scenes[1], [p("La rive."), bloc(ids[10])])).error).toBeNull();
  });

  it("F14-AC15 — un projet déjà à 55 scènes quand l'interrupteur s'allume : tout reste et s'écrit, seule la création est refusée", async () => {
    const m = await projetDe(55);
    await interrupteur(true);
    expect(await limites(m.projet)).toMatchObject({ limite: true, scenes: 55 });
    expect((await ecrire(m.scenes[54], [p("Toujours là.")])).error).toBeNull();
    expect((await creer(m.chapitre)).error?.code).toBe("LIM01");
  });
});

describe("Le pass (F14-AC16, AC17)", () => {
  it("F14-AC16 — le pass de « Le marais » lève ses limites pour toujours et donne ses étoiles ; l'autre projet garde les siennes ; un second pass ne donne rien", async () => {
    const marais = await projetDe(40);
    const autre = await projetDe(40, "La forêt");
    await interrupteur(true);
    const solde = async () => (await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [bernard.id]))[0].etoiles;
    const avantPass = await solde();
    const { data } = await service().rpc("donner_le_pass", { p_projet: marais.projet, p_origine: "achat" });
    expect(data).toBe(true);
    expect(await solde()).toBe(avantPass + 400);
    expect(await limites(marais.projet)).toMatchObject({ limite: false, pass: true });
    expect((await creer(marais.chapitre)).error).toBeNull();
    expect((await creer(autre.chapitre)).error?.code).toBe("LIM01");
    expect((await service().rpc("donner_le_pass", { p_projet: marais.projet, p_origine: "cadeau" })).data).toBe(false);
    expect(await solde()).toBe(avantPass + 400);
    // L'adulte ne se donne pas de pass lui-même
    expect((await bernard.base.rpc("donner_le_pass", { p_projet: autre.projet, p_origine: "achat" })).error).not.toBeNull();
    expect((await bernard.base.from("passes").insert({ projet_id: autre.projet, enseignant_id: bernard.id, origine: "achat" })).error).not.toBeNull();
  });

  it("F14-AC17 — les projets du porteur n'ont aucune limite", async () => {
    const m = await projetDe(40);
    await sql("update public.enseignants set createur = true where id = $1", [bernard.id]);
    try {
      await interrupteur(true);
      expect(await limites(m.projet)).toMatchObject({ limite: false });
      expect((await creer(m.chapitre)).error).toBeNull();
    } finally {
      await sql("update public.enseignants set createur = false where id = $1", [bernard.id]);
    }
  });
});
