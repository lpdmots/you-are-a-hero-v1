import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { REGLAGES_IA_HABITUELS, type ReglagesIa } from "@/domaine/aides-ia";
import { derniereCreationSimulee } from "@/serveur/ia/demander";
import { SCENE_1 } from "@/serveur/ia/images-simulees";
import { SEAU } from "@/serveur/images";
import {
  couvertureDuProjet, demandeDe, demanderLaCouverture, imagesEnRoute, noterLesCasesDeLaCouverture, poserLaCouverture, promptDeLaCouverture, proposerLaCouverture, type Lancee,
} from "@/serveur/images-creees";
import { limitesDuProjet } from "@/serveur/offre";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, enseignantDe, nettoyer, service, sql, type Adulte, type ClasseEssai } from "./outils";

/**
 * La couverture faite sur le site, lot 1 (F11.4, F11-AC110 à AC112), contre la vraie base locale
 * et le fournisseur simulé (IA_SIMULEE) : aucune image n'est vraiment créée, aucune dépense.
 */

let laurent: Adulte;
let classe: ClasseEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  classe = await creerClasse(laurent);
});
afterAll(nettoyer);
afterEach(async () => {
  await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
});

const moi = (reglages: Partial<ReglagesIa> = {}) => ({ ...enseignantDe(laurent), nomAffiche: "Mme Laurent", reglagesIa: { ...REGLAGES_IA_HABITUELS, ...reglages } });
const appels = () => sql<{ aide: string; sorte: string; nombre: number }>("select aide, sorte, nombre from public.appels_ia where enseignant_id = $1 order by commence_le", [laurent.id]);
const lancee = async (l: Lancee): Promise<string> => {
  if (!l.ok) throw new Error(l.message);
  await l.travail();
  return l.demande;
};
const demandeEnBase = (id: string) =>
  sql<{ etat: string; image_posee: string | null; message: string | null }>("select etat, image_posee, message from demandes_d_images where id = $1", [id]).then((l) => l[0]);

async function lanterne() {
  const projet = await creerProjet(laurent, "classe", "choix", "La lanterne du passeur", classe.id);
  await creerPartie(laurent, projet.id, "La traversée", "Le dernier bac");
  await laurent.base.from("projets").update({ style_images: "aquarelle", idee_couverture: "le bac sur le lac au lever du jour" }).eq("id", projet.id);
  await laurent.base.from("preparations").update({ univers: "Un pays de lacs noyé dans la brume.", enjeu: "Retrouver le passeur disparu." }).eq("projet_id", projet.id);
  return projet.id;
}

/** Une image du projet, déposée pour de bon : un portrait de référence, ou une couverture importée. */
async function imageDuProjet(projet: string, largeur = 240, hauteur = 160): Promise<string> {
  const id = randomUUID();
  const octets = Buffer.from(SCENE_1, "base64");
  for (const chemin of [`${laurent.id}/${projet}/${id}.jpg`, `${laurent.id}/${projet}/${id}-v.jpg`]) {
    await service().storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg" });
  }
  const { error } = await laurent.base.from("images").insert({
    id, projet_id: projet, enseignant_id: laurent.id, chemin: `${laurent.id}/${projet}/${id}.jpg`, chemin_vignette: `${laurent.id}/${projet}/${id}-v.jpg`, largeur, hauteur, format: "jpeg",
  });
  if (error) throw new Error(error.message);
  return id;
}

describe("Créer la couverture (F11-AC110, AC111)", () => {
  it("F11-AC110 — pour imprimer : une seule image de 1824 × 2560 en qualité haute, même réglée sur deux, avec le style, le héros absent, les portraits et le titre mot pour mot ; posée d'office, hors des dix images gratuites", async () => {
    const projet = await lanterne();
    const portrait = await imageDuProjet(projet);
    await laurent.base.from("personnages").insert({ projet_id: projet, enseignant_id: laurent.id, nom: "Maël", autres_noms: ["le passeur"], heros: false, portrait_id: portrait, fiche: "Grand, barbe grise." });
    await laurent.base.from("personnages").insert({ projet_id: projet, enseignant_id: laurent.id, nom: "Lou", autres_noms: [], heros: true, portrait_id: portrait, fiche: "Dix ans." });
    await laurent.base.from("projets").update({ description_couverture: "Le bac du passeur sur le lac au lever du jour, Lou de dos." }).eq("id", projet);

    const demande = await lancee(await demanderLaCouverture(moi({ imagesParCreation: 2, qualite: "normale" }), projet, "imprimer"));
    const simulee = derniereCreationSimulee()!;
    expect(simulee).toMatchObject({ usage: "couverture", taille: "1824x2560", qualite: "haute", nombre: 1, references: 1 });
    expect(simulee.prompt).toContain("- « La lanterne du passeur »");
    expect(simulee.prompt).toContain("N'écrire aucun autre texte");
    expect(simulee.prompt).toContain("- Maël : Grand, barbe grise. (image de référence 1)");
    expect(simulee.prompt).not.toContain("Dix ans.");
    expect(simulee.prompt).toContain("aquarelle");
    expect(await appels()).toEqual([{ aide: "couverture", sorte: "image", nombre: 1 }]);

    const d = await demandeEnBase(demande);
    expect(d).toMatchObject({ etat: "posee", message: null });
    const [p] = await sql<{ couverture_id: string }>("select couverture_id from projets where id = $1", [projet]);
    expect(p.couverture_id).toBe(d.image_posee);
    const [image] = await sql<{ textes_demandes: string[]; chemin_vignette: string }>("select textes_demandes, chemin_vignette from images where id = $1", [p.couverture_id]);
    expect(image.textes_demandes).toEqual(["La lanterne du passeur"]);
    expect((await service().storage.from(SEAU).download(image.chemin_vignette)).data).toBeTruthy();
    expect((await limitesDuProjet(laurent.base, projet))!.images).toBe(0);

    const lue = (await couvertureDuProjet(moi(), projet))!;
    expect(lue.image).toMatchObject({ id: p.couverture_id, textes: ["La lanterne du passeur"] });
    expect(lue.portraits).toEqual(["Maël"]);
    expect(lue.demande).toBeNull();
  });

  it("F11-AC111 — pour le site : 1024 × 1440 en qualité normale, même réglée sur « haute »", async () => {
    const projet = await lanterne();
    await lancee(await demanderLaCouverture(moi({ qualite: "haute" }), projet, "site"));
    expect(derniereCreationSimulee()).toMatchObject({ usage: "couverture-site", taille: "1024x1440", qualite: "normale", nombre: 1 });
  });

  it("une couverture posée entre-temps n'est pas remplacée ; la nouvelle reste parmi les images du projet", async () => {
    const projet = await lanterne();
    const l = await demanderLaCouverture(moi(), projet, "imprimer");
    if (!l.ok) throw new Error(l.message);
    expect(await imagesEnRoute(moi(), projet)).toEqual([]);
    expect((await couvertureDuProjet(moi(), projet))!.demande).toMatchObject({ etat: "en_route", cible: "couverture" });
    expect(await demanderLaCouverture(moi(), projet, "imprimer")).toEqual({ ok: false, message: "Une couverture est déjà en route." });
    const importee = await imageDuProjet(projet, 1748, 2480);
    expect(await poserLaCouverture(moi(), projet, importee)).toBe(true);
    await l.travail();
    const d = await demandeEnBase(l.demande);
    expect(d.message).toBe("Vous aviez posé une autre couverture entre-temps : celle-ci est parmi les images du projet.");
    expect((await sql<{ couverture_id: string }>("select couverture_id from projets where id = $1", [projet]))[0].couverture_id).toBe(importee);
    expect(await demandeDe(moi(), "couverture", projet)).toBeNull();
  });

  it("sans description ni idée, ou les aides éteintes, rien ne part", async () => {
    const projet = await lanterne();
    expect(await demanderLaCouverture(moi({ proposer: false }), projet, "imprimer")).toMatchObject({ ok: false });
    await laurent.base.from("projets").update({ idee_couverture: "" }).eq("id", projet);
    expect(await demanderLaCouverture(moi(), projet, "imprimer")).toEqual({ ok: false, message: "Décrivez d’abord ce que montre la couverture, ou faites proposer la description." });
    expect(await appels()).toEqual([]);
  });
});

describe("Les textes de la couverture (F11-AC112)", () => {
  it("F11-AC112 — l'année cochée et le titre remplacé : le prompt copié les écrit mot pour mot, la page de titre ne change pas ; la ligne de la classe ne part que cochée", async () => {
    const projet = await lanterne();
    const avant = await promptDeLaCouverture(moi(), projet);
    expect(avant.ok && avant.prompt).not.toContain("Mme Laurent");
    expect(await noterLesCasesDeLaCouverture(moi(), projet, { titre: { coche: true, texte: "La lanterne" }, annee: { coche: true, texte: null } })).toBe(true);
    const r = await promptDeLaCouverture(moi(), projet);
    expect(r.ok && r.prompt).toContain("- « La lanterne »");
    expect(r.ok && r.prompt).toMatch(/- « \d{4}-\d{4} »/);
    expect(r.ok && r.prompt).not.toContain("La lanterne du passeur");
    expect(r.ok && r.prompt).not.toContain("Mme Laurent");
    const [p] = await sql<{ titre: string; pages_du_livre: unknown }>("select titre, pages_du_livre from projets where id = $1", [projet]);
    expect(p).toMatchObject({ titre: "La lanterne du passeur" });

    await noterLesCasesDeLaCouverture(moi(), projet, { ligne: { coche: true, texte: null } });
    const avecLigne = await promptDeLaCouverture(moi(), projet);
    expect(avecLigne.ok && avecLigne.prompt).toContain("- « La classe de CM1-CM2 de Mme Laurent »");
  });

  it("F11-AC112 — « ✦ Proposer la description » reçoit les textes cochés, pour dire où les placer", async () => {
    const projet = await lanterne();
    const d = await proposerLaCouverture(moi(), projet);
    expect(d.ok).toBe(true);
    expect(await appels()).toEqual([{ aide: "description-image", sorte: "texte", nombre: 1 }]);
  });
});

describe("Jamais de refus faute de texte (F13)", () => {
  it("F13-AC31 — « ✦ Proposer la description » sans idée ni univers : une description d'après le titre et le plan ; la couverture ne se crée pas sans elle", async () => {
    const projet = await lanterne();
    await laurent.base.from("projets").update({ idee_couverture: "" }).eq("id", projet);
    await laurent.base.from("preparations").update({ univers: "", enjeu: "" }).eq("projet_id", projet);
    const d = await proposerLaCouverture(moi(), projet);
    expect(d.ok && d.description.length).toBeGreaterThan(10);
    expect(await appels()).toEqual([{ aide: "description-image", sorte: "texte", nombre: 1 }]);
    expect(await demanderLaCouverture(moi(), projet, "imprimer")).toMatchObject({ ok: false });
  });
});

describe("Poser une couverture importée", () => {
  it("une image du projet seulement ; null la retire", async () => {
    const projet = await lanterne();
    const autre = await lanterne();
    const ailleurs = await imageDuProjet(autre);
    expect(await poserLaCouverture(moi(), projet, ailleurs)).toBe(false);
    const ici = await imageDuProjet(projet, 1748, 2480);
    expect(await poserLaCouverture(moi(), projet, ici)).toBe(true);
    expect((await couvertureDuProjet(moi(), projet))!.image).toEqual({ id: ici, largeur: 1748, hauteur: 2480, textes: null });
    expect(await poserLaCouverture(moi(), projet, null)).toBe(true);
    expect((await couvertureDuProjet(moi(), projet))!.image).toBeNull();
  });
});
