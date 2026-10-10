import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, nettoyer, posteDe, service, sql, type Adulte,
  type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * Étape 3 du plan, lot 5 : les images posées dans une scène (F10), contre la vraie base
 * locale. Un poste ne lit que les images de ce qu'il peut lire ; la scène retient celles
 * qu'elle a portées, pour qu'un élève puisse y déplacer une phrase qui en porte une.
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

const p = (...enfants: unknown[]) => ({ type: "p", id: randomUUID(), children: enfants.map((x) => (typeof x === "string" ? { text: x } : x)) });
const symbole = (image: string) => ({ type: "image-ligne", id: randomUUID(), image, children: [{ text: "" }] });
const figure = (image: string) => ({ type: "image", id: randomUUID(), image, largeur: 65, children: [{ text: "" }] });

async function recit() {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const scene = await creerScene(laurent.base, chapitreId);
  const autel = await creerScene(laurent.base, sanctuaire);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  await attribuer(laurent, sanctuaire, [{ eleve: chloe.id }]);
  const image = async (format = "jpeg"): Promise<string> => {
    const id = randomUUID();
    const { error } = await laurent.base.from("images").insert({
      id, projet_id: projet.id, enseignant_id: laurent.id, chemin: `${laurent.id}/${projet.id}/${id}`, chemin_vignette: `${laurent.id}/${projet.id}/${id}-v`,
      largeur: 1200, hauteur: 800, format,
    });
    if (error) throw new Error(error.message);
    return id;
  };
  return { projet: projet.id, scene: scene.id, autel: autel.id, image };
}
const ecrire = async (scene: string, texte: unknown): Promise<void> => {
  const [{ version }] = await sql<{ version: number }>("select version from scenes where id = $1", [scene]);
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: version, p_texte: texte });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(error?.message ?? "Texte non enregistré");
};
const lit = async (eleve: EleveEssai, image: string): Promise<{ chemin: string; format: string }[]> => {
  const poste = await posteDe(classe.id, eleve.inscriptionId);
  const { data, error } = await (await poste.base()).rpc("image_du_poste", { p_image: image });
  if (error) throw new Error(error.message);
  return (data ?? []) as { chemin: string; format: string }[];
};

describe("Images lues par un poste (F10)", () => {
  it("un poste lit l'image posée dans une scène qu'il peut lire, en bloc comme sur la ligne, avec son format ; pas l'image importée qui n'est posée nulle part", async () => {
    const r = await recit();
    const [dessin, lune, enReserve] = [await r.image(), await r.image("webp"), await r.image()];
    await ecrire(r.scene, [p("Le pont."), figure(dessin), p("La porte ", symbole(lune), " s’ouvre.")]);
    expect(await lit(alice, dessin)).toMatchObject([{ format: "jpeg" }]);
    expect(await lit(alice, lune)).toMatchObject([{ format: "webp" }]);
    expect(await lit(alice, enReserve)).toEqual([]);
    // Un format que l'application ne connaît pas n'entre pas dans la table
    const refuse = await laurent.base.from("images").insert({
      projet_id: r.projet, enseignant_id: laurent.id, chemin: `x/${randomUUID()}`, chemin_vignette: `x/${randomUUID()}`, largeur: 10, hauteur: 10, format: "svg",
    });
    expect(refuse.error).not.toBeNull();
  });

  it("ni l'image d'une scène d'un chapitre fermé pour lui, ni celle d'une scène supprimée ; la lecture ouverte la lui montre", async () => {
    const r = await recit();
    const dessin = await r.image();
    await ecrire(r.autel, [figure(dessin)]);
    expect(await lit(alice, dessin)).toEqual([]);
    expect(await lit(chloe, dessin)).toHaveLength(1);
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    expect(await lit(alice, dessin)).toHaveLength(1);
    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: r.autel })).error).toBeNull();
    expect(await lit(chloe, dessin)).toEqual([]);
  });

  it("un poste ne lit pas la table des images, et le stockage ne lui donne aucun fichier", async () => {
    const r = await recit();
    const dessin = await r.image();
    await ecrire(r.scene, [figure(dessin)]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const base = await poste.base();
    expect((await base.from("images").select("id, chemin")).data ?? []).toEqual([]);
    expect((await base.storage.from("images").list(`${laurent.id}/${r.projet}`)).data ?? []).toEqual([]);
  });
});

describe("Images qu'une scène a portées (F10-AC33)", () => {
  it("la scène retient les images de son texte, même retirées ensuite ; c'est ce que le serveur lit pour contrôler l'enregistrement d'un élève", async () => {
    const r = await recit();
    const [lune, soleil] = [await r.image(), await r.image()];
    const vues = async () => (await sql<{ v: string[] }>("select images_vues as v from scenes where id = $1", [r.scene]))[0].v.sort();
    expect(await vues()).toEqual([]);
    await ecrire(r.scene, [p("La porte ", symbole(lune), " s’ouvre.")]);
    expect(await vues()).toEqual([lune]);
    // Coupée : le texte s'enregistre sans l'image, la scène s'en souvient
    await ecrire(r.scene, [p("Lou attend.")]);
    expect(await vues()).toEqual([lune]);
    await ecrire(r.scene, [p("Lou attend."), figure(soleil), figure(lune)]);
    expect(await vues()).toEqual([lune, soleil].sort());

    const poste = await posteDe(classe.id, alice.inscriptionId);
    const { data: ecriture } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: r.scene });
    const { data: lue } = await service().rpc("ecriture_lire", { p_ecriture: ecriture, p_jeton_hash: poste.jetonHash });
    expect(((lue as { images_vues: string[] }).images_vues ?? []).sort()).toEqual([lune, soleil].sort());
    // Un poste ne lit pas cette colonne lui-même
    const directe = await (await poste.base()).from("scenes").select("images_vues").eq("id", r.scene);
    expect(directe.error).not.toBeNull();
  });
});
