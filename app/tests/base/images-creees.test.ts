import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { REGLAGES_IA_HABITUELS, type ReglagesIa } from "@/domaine/aides-ia";
import { STYLES_DES_IMAGES } from "@/domaine/illustration";
import { derniereCreationSimulee } from "@/serveur/ia/demander";
import { SCENE_1 } from "@/serveur/ia/images-simulees";
import { SEAU } from "@/serveur/images";
import {
  demandeDe, demanderLeReperage, demanderLesImagesALAjout, demanderLImageDeScene, fermerLaDemande, imagesEnRoute, ouvrirLImageDeScene, promptDeLaCouverture, promptDeLImageDeScene,
  proposerLaCouverture, proposerLaDescription, type Lancee,
} from "@/serveur/images-creees";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, posteDe, service, sql, type Adulte, type ClasseEssai,
  type EleveEssai,
} from "./outils";

/**
 * Étape 8, lot 8 : les images créées (F10.1, F10.2, F11.4), contre la vraie base locale et le
 * fournisseur simulé (IA_SIMULEE) : aucune image n'est vraiment créée, aucune dépense. Le serveur
 * relit le résumé, la scène, l'idée et les cartes ; l'idée d'image s'écrit par l'élève sans IA.
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
afterEach(async () => {
  await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
});

const avec = (reglages: Partial<ReglagesIa>) => ({ ...enseignantDe(laurent), reglagesIa: { ...REGLAGES_IA_HABITUELS, ...reglages } });
const appels = () => sql<{ aide: string; sorte: string; nombre: number }>("select aide, sorte, nombre from public.appels_ia where enseignant_id = $1 order by commence_le", [laurent.id]);
const propositionsEnStockage = async (projet: string) => ((await service().storage.from(SEAU).list(`${laurent.id}/${projet}/propositions`)).data ?? []).map((f) => f.name);

async function passeurs(valeurs: Record<string, unknown> = {}) {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  await laurent.base.from("projets").update({ style_images: "aquarelle", ...valeurs }).eq("id", projet.id);
  await laurent.base.from("preparations").update({ univers: "Un pays de lacs noyé dans la brume.", enjeu: "Retrouver le passeur disparu." }).eq("projet_id", projet.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La traversée", "Le dernier bac");
  return { projet: projet.id, partie: partieId, chapitre: chapitreId };
}

/** Une image du projet, déposée pour de bon dans le stockage : elle sert de portrait de référence. */
async function imageDuProjet(projet: string): Promise<string> {
  const id = randomUUID();
  const chemin = `${laurent.id}/${projet}/${id}.jpg`;
  const octets = Buffer.from(SCENE_1, "base64");
  await service().storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg" });
  await service().storage.from(SEAU).upload(`${laurent.id}/${projet}/${id}-v.jpg`, octets, { contentType: "image/jpeg" });
  const { error } = await laurent.base.from("images").insert({ id, projet_id: projet, enseignant_id: laurent.id, chemin, chemin_vignette: `${laurent.id}/${projet}/${id}-v.jpg`, largeur: 240, hauteur: 160, format: "jpeg" });
  if (error) throw new Error(error.message);
  return id;
}

const paragraphe = (texte: string) => ({ type: "p", id: randomUUID(), children: [{ text: texte }] });
async function ecrire(scene: string, ...textes: string[]) {
  const [{ version }] = await sql<{ version: number }>("select version from scenes where id = $1", [scene]);
  const { error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: version, p_texte: textes.map(paragraphe) });
  if (error) throw new Error(error.message);
}

/** Une demande lancée, puis son travail attendu : la route le fait après la réponse (`after`). */
const lancee = async (l: Lancee): Promise<string> => {
  if (!l.ok) throw new Error(l.message);
  await l.travail();
  return l.demande;
};
const demandeEnBase = (id: string) =>
  sql<{ etat: string; propositions: string[]; image_posee: string | null; message: string | null }>("select etat, propositions, image_posee, message from demandes_d_images where id = $1", [id]).then((l) => l[0]);

describe("L'image de repérage d'après le résumé (F10.1)", () => {
  it("F10-AC48 — « Créer une image d'après le résumé » : la demande part, la première image se pose d'office dans le style du projet, la seconde attend un choix", async () => {
    const { projet, chapitre } = await passeurs();
    await laurent.base.from("chapitres").update({ resume: "Le bac traverse le lac dans la brume." }).eq("id", chapitre);
    const l = await demanderLeReperage(avec({ imagesParCreation: 2 }), "chapitre", chapitre);
    // Avant que l'image n'arrive, la demande est en route : une seconde pour le même chapitre est refusée
    expect((await demandeDe(enseignantDe(laurent), "chapitre", chapitre))?.etat).toBe("en_route");
    expect(await imagesEnRoute(enseignantDe(laurent), projet)).toEqual([chapitre]);
    expect(await demanderLeReperage(enseignantDe(laurent), "chapitre", chapitre)).toEqual({ ok: false, message: "Une image est déjà en route pour cet élément." });
    const id = await lancee(l);
    const simulee = derniereCreationSimulee()!;
    expect(simulee.usage).toBe("reperage");
    expect(simulee.qualite).toBe("normale");
    expect(simulee.prompt).toContain("Chapitre « Le dernier bac » : Le bac traverse le lac dans la brume.");
    expect(simulee.prompt).toContain(STYLES_DES_IMAGES.aquarelle.prompt);
    expect(await appels()).toEqual([{ aide: "image-reperage", sorte: "image", nombre: 2 }]);
    const d = await demandeEnBase(id);
    expect(d.etat).toBe("prete");
    expect(d.propositions).toHaveLength(1);
    expect((await sql("select image_id from chapitres where id = $1", [chapitre]))[0].image_id).toBe(d.image_posee);
    expect(await propositionsEnStockage(projet)).toEqual([`${d.propositions[0]}.jpg`]);
    // « Laisser » : la demande se ferme, la seconde proposition s'efface, l'image posée reste
    await fermerLaDemande(enseignantDe(laurent), id);
    expect((await demandeEnBase(id)).etat).toBe("posee");
    expect(await propositionsEnStockage(projet)).toEqual([]);
    expect(await imagesEnRoute(enseignantDe(laurent), projet)).toEqual([]);
  });

  it("F10-AC48 — sans résumé, rien ne part ; une partie se dit par les résumés de ses chapitres, le projet par l'univers et l'enjeu", async () => {
    const { projet, partie, chapitre } = await passeurs();
    expect(await demanderLeReperage(enseignantDe(laurent), "chapitre", chapitre)).toEqual({ ok: false, message: "Écrivez d’abord le résumé du chapitre." });
    expect(await demanderLeReperage(enseignantDe(laurent), "partie", partie)).toEqual({ ok: false, message: "Écrivez d’abord le résumé d’un de ses chapitres." });
    expect(await appels()).toEqual([]);
    await lancee(await demanderLeReperage(enseignantDe(laurent), "projet", projet));
    expect(derniereCreationSimulee()!.prompt).toContain("Histoire « Les passeurs de brume » : Un pays de lacs noyé dans la brume. Retrouver le passeur disparu.");
    expect((await sql("select image_id from projets where id = $1", [projet]))[0].image_id).not.toBeNull();
  });

  it("le geste le plus récent gagne : une image choisie entre la demande et l'arrivée n'est pas remplacée, l'image arrivée reste parmi les images du projet", async () => {
    const { projet, chapitre } = await passeurs();
    await laurent.base.from("chapitres").update({ resume: "Le bac traverse le lac." }).eq("id", chapitre);
    const l = await demanderLeReperage(enseignantDe(laurent), "chapitre", chapitre);
    await laurent.base.from("chapitres").update({ visuel_choisi: "lac" }).eq("id", chapitre);
    const id = await lancee(l);
    const d = await demandeEnBase(id);
    expect(d.etat).toBe("posee");
    expect(d.message).toContain("Vous aviez choisi une autre image");
    expect((await sql("select image_id, visuel_choisi from chapitres where id = $1", [chapitre]))[0]).toEqual({ image_id: null, visuel_choisi: "lac" });
    expect((await sql("select id from images where projet_id = $1", [projet])).map((x) => x.id)).toEqual([d.image_posee]);
  });
});

describe("L'image créée d'office à l'ajout par l'IA (F10.1, 18 octobre 2026)", () => {
  it("F10-AC50 — une seule image, sans choix, quel que soit « Images par création » ; elle rejoint les images du projet et remplace le visuel par défaut", async () => {
    const { projet, partie, chapitre } = await passeurs();
    await laurent.base.from("chapitres").update({ resume: "Le bac traverse le lac dans la brume." }).eq("id", chapitre);
    const r = await demanderLesImagesALAjout(avec({ imagesParCreation: 2 }), "partie", [partie]);
    expect(r.demandes).toHaveLength(1);
    await r.travail();
    expect(await appels()).toEqual([{ aide: "image-ajout", sorte: "image", nombre: 1 }]);
    const d = await demandeEnBase(r.demandes[0]);
    expect(d).toMatchObject({ etat: "posee", propositions: [] });
    const [lue] = await sql<{ image_id: string }>("select image_id from parties where id = $1", [partie]);
    expect(lue.image_id).toBe(d.image_posee);
    const [image] = await sql<{ projet_id: string; format: string }>("select projet_id, format from images where id = $1", [lue.image_id]);
    expect(image).toEqual({ projet_id: projet, format: "jpeg" });
    expect(await propositionsEnStockage(projet)).toEqual([]);
  });

  it("F10-AC50 — sans résumé, rien ne part, sans rien bloquer ; plusieurs éléments se créent en même temps", async () => {
    const { partie, chapitre } = await passeurs();
    expect((await demanderLesImagesALAjout(enseignantDe(laurent), "chapitre", [chapitre])).demandes).toEqual([]);
    expect(await appels()).toEqual([]);
    const autre = await creerChapitre(laurent, partie, "La rive d'en face");
    await laurent.base.from("chapitres").update({ resume: "Un lac sous la brume." }).in("id", [chapitre, autre]);
    const r = await demanderLesImagesALAjout(enseignantDe(laurent), "chapitre", [chapitre, autre]);
    expect(r.demandes).toHaveLength(2);
    await r.travail();
    expect((await sql("select count(*)::int as n from chapitres where id = any($1) and image_id is not null", [[chapitre, autre]]))[0].n).toBe(2);
  });

  it("F10-AC51 — réglage éteint, ou aides éteintes : aucune image d'office", async () => {
    const { chapitre } = await passeurs();
    await laurent.base.from("chapitres").update({ resume: "Le bac traverse le lac." }).eq("id", chapitre);
    expect((await demanderLesImagesALAjout(avec({ imageALAjout: false }), "chapitre", [chapitre])).demandes).toEqual([]);
    expect((await demanderLesImagesALAjout(avec({ proposer: false }), "chapitre", [chapitre])).demandes).toEqual([]);
    expect(await appels()).toEqual([]);
  });

  it("une demande de texte à la fois ; les images, plusieurs en même temps", async () => {
    const commencer = (sorte: "texte" | "image") =>
      service().rpc("commencer_appel_ia", { p_enseignant: laurent.id, p_aide: sorte === "texte" ? "titre" : "image-ajout", p_sorte: sorte, p_nombre: 1, p_par_jour: 99, p_mois_usd: null, p_attente: 120 });
    expect(((await commencer("texte")).data as { id?: string }).id).toBeTruthy();
    expect(((await commencer("image")).data as { id?: string }).id).toBeTruthy();
    expect(((await commencer("image")).data as { id?: string }).id).toBeTruthy();
    expect((await commencer("texte")).data).toEqual({ refus: "occupe" });
  });
});

describe("L'image d'une scène (F10.2)", () => {
  async function scene(valeurs: Record<string, unknown> = {}) {
    const p = await passeurs(valeurs);
    const s = await creerScene(laurent.base, p.chapitre);
    const portrait = await imageDuProjet(p.projet);
    const perso = async (nom: string, autres: string[], heros: boolean, portraitId: string | null, fiche: string) => {
      const { data } = await laurent.base.from("personnages").insert({ projet_id: p.projet, enseignant_id: laurent.id, nom, autres_noms: autres, heros, portrait_id: portraitId, fiche }).select("id").single();
      return data!.id as string;
    };
    const lou = await perso("Lou", ["le garçon"], true, portrait, "Dix ans, ciré moutarde.");
    const mael = await perso("Maël", ["le passeur"], false, portrait, "Grand, barbe grise.");
    const { data: objet } = await laurent.base.from("objets").insert({ projet_id: p.projet, enseignant_id: laurent.id, nom: "la lanterne de cuivre", description: "Celle du père.", fiche: "Cuivre patiné." }).select("id").single();
    return { ...p, scene: s.id, lou, mael, lanterne: objet!.id as string };
  }

  it("F10-AC49 — à l'ouverture : l'idée gardée, les personnages et objets du projet ; le héros absent n'en fait pas partie", async () => {
    const s = await scene();
    await laurent.base.from("scenes").update({ idee_image: "la lanterne sur le ponton" }).eq("id", s.scene);
    const o = await ouvrirLImageDeScene(enseignantDe(laurent), s.scene);
    expect(o?.idee).toBe("la lanterne sur le ponton");
    expect(o?.herosAbsent).toBe(true);
    expect(o?.style).toBe("Aquarelle douce");
    expect(o?.candidats.map((c) => c.nom)).toEqual(["Maël", "la lanterne de cuivre"]);
    await laurent.base.from("projets").update({ heros_absent: false }).eq("id", s.projet);
    expect((await ouvrirLImageDeScene(enseignantDe(laurent), s.scene))?.candidats.map((c) => c.nom)).toEqual(["Lou", "Maël", "la lanterne de cuivre"]);
  });

  it("F10-AC49 — « Créer l'image » : au cadrage choisi, en haute qualité pour la pleine page, avec les portraits des badges en référence et leurs fiches mot pour mot", async () => {
    const s = await scene({ heros_absent: false });
    await ecrire(s.scene, "Le passeur lève sa lanterne de cuivre.");
    await laurent.base.from("scenes").update({ description_image: "Le passeur debout dans la barque, la lanterne levée." }).eq("id", s.scene);
    const id = await lancee(await demanderLImageDeScene(enseignantDe(laurent), s.scene, { cadrage: "pleine-page", badges: [s.lou, s.mael, s.lanterne], apresBloc: "b1", alt: "le passeur" }));
    const simulee = derniereCreationSimulee()!;
    expect(simulee).toMatchObject({ usage: "pleine-page", qualite: "haute", nombre: 1, references: 2 });
    expect(simulee.prompt).toContain("Ce que montre l'image : Le passeur debout dans la barque, la lanterne levée.");
    expect(simulee.prompt).toContain("- Lou : Dix ans, ciré moutarde. (image de référence 1)");
    expect(simulee.prompt).toContain("- Maël : Grand, barbe grise. (image de référence 2)");
    expect(simulee.prompt).toContain("- la lanterne de cuivre : Cuivre patiné.");
    expect(simulee.prompt).not.toContain("n'est pas représenté");
    expect(await appels()).toEqual([{ aide: "image-scene", sorte: "image", nombre: 1 }]);
    // L'image attend avec la scène, sans que son texte change : elle se pose d'un clic au retour
    const d = await demandeDe(enseignantDe(laurent), "scene", s.scene);
    expect(d).toMatchObject({ id, etat: "prete", apresBloc: "b1", cadrage: "pleine-page", alt: "le passeur" });
    expect(d?.propositions).toHaveLength(1);
    expect((await ouvrirLImageDeScene(enseignantDe(laurent), s.scene))?.demande?.id).toBe(id);
    expect((await sql("select texte from scenes where id = $1", [s.scene]))[0].texte).toHaveLength(1);
    await fermerLaDemande(enseignantDe(laurent), id);
  });

  it("F10-AC08 — héros absent : un badge de héros envoyé par la page est écarté, le prompt dit l'absence ; sans description, l'idée sert", async () => {
    const s = await scene();
    await laurent.base.from("scenes").update({ idee_image: "je pousse la porte du château" }).eq("id", s.scene);
    const id = await lancee(await demanderLImageDeScene(enseignantDe(laurent), s.scene, { cadrage: "3:2", badges: [s.lou] }));
    const simulee = derniereCreationSimulee()!;
    expect(simulee.qualite).toBe("normale");
    expect(simulee.references).toBe(0);
    expect(simulee.prompt).toContain("Ce que montre l'image : je pousse la porte du château");
    expect(simulee.prompt).toContain("n'est pas représenté");
    expect(simulee.prompt).not.toContain("ciré moutarde");
    await fermerLaDemande(enseignantDe(laurent), id);
  });

  it("F10-AC07 — « Copier le prompt » sans IA : rien ne part chez le fournisseur ; sans idée ni description, il ne se compose pas", async () => {
    const s = await scene();
    expect(await promptDeLImageDeScene(enseignantDe(laurent), s.scene, { cadrage: "carre", badges: [] })).toEqual({ ok: false, message: "Décrivez d’abord ce que montre l’image." });
    expect(await demanderLImageDeScene(enseignantDe(laurent), s.scene, { cadrage: "carre", badges: [] })).toEqual({
      ok: false, message: "Décrivez d’abord ce que montre l’image, ou faites proposer la description.",
    });
    await laurent.base.from("scenes").update({ idee_image: "la grotte avec des cristaux bleus" }).eq("id", s.scene);
    const r = await promptDeLImageDeScene(avec({ proposer: false }), s.scene, { cadrage: "carre", badges: [s.mael] });
    expect(r.ok && r.prompt).toContain("la grotte avec des cristaux bleus");
    expect(r.ok && r.prompt).toContain(STYLES_DES_IMAGES.aquarelle.prompt);
    expect(r.ok && r.prompt).toContain("- Maël : Grand, barbe grise. (image de référence 1)");
    expect(await appels()).toEqual([]);
    // Rien n'est inséré dans la scène
    expect((await sql("select texte from scenes where id = $1", [s.scene]))[0].texte).toEqual([]);
  });

  it("« ✦ Proposer la description » : d'après la scène et l'idée, les badges nommés ; ni la description gardée ni le texte ne changent", async () => {
    const s = await scene();
    await ecrire(s.scene, "Tu montes dans la barque du passeur.");
    await laurent.base.from("scenes").update({ idee_image: "la barque dans la brume" }).eq("id", s.scene);
    const r = await proposerLaDescription(enseignantDe(laurent), s.scene, { cadrage: "16:9", badges: [s.mael] });
    expect(r.ok && r.description).toContain("la barque dans la brume");
    expect(await appels()).toEqual([{ aide: "description-image", sorte: "texte", nombre: 1 }]);
    expect((await sql("select description_image from scenes where id = $1", [s.scene]))[0].description_image).toBe("");
    const vide = await scene();
    expect(await proposerLaDescription(enseignantDe(laurent), vide.scene, { cadrage: "16:9", badges: [] })).toEqual({ ok: false, message: "Écrivez d’abord ce que montre l’image, ou le texte de la scène." });
  });
});

describe("L'idée d'image de l'élève (F10-AC10)", () => {
  it("F10-AC10 — l'élève qui peut écrire la scène note son idée, sans aucune commande d'IA ; l'adulte la retrouve ; la description reste à l'adulte", async () => {
    const { projet, chapitre } = await passeurs();
    const s = await creerScene(laurent.base, chapitre);
    await attribuer(laurent, chapitre, [{ eleve: alice.id }]);
    const poste = await (await posteDe(classe.id, alice.inscriptionId)).base();
    expect((await poste.rpc("eleve_noter_idee_image", { p_scene: s.id, p_idee: "  une grotte pleine de cristaux bleus " })).error).toBeNull();
    expect((await poste.from("scenes").select("idee_image").eq("id", s.id).single()).data?.idee_image).toBe("une grotte pleine de cristaux bleus");
    expect((await poste.from("scenes").select("description_image").eq("id", s.id)).error).not.toBeNull();
    expect((await ouvrirLImageDeScene(enseignantDe(laurent), s.id))?.idee).toBe("une grotte pleine de cristaux bleus");
    // Une camarade d'un autre chapitre n'y écrit pas ; une scène à valider ne s'écrit plus
    const autre = await (await posteDe(classe.id, chloe.inscriptionId)).base();
    expect((await autre.rpc("eleve_noter_idee_image", { p_scene: s.id, p_idee: "autre chose" })).error?.message).toBe("Tu ne peux pas écrire dans cette scène.");
    await sql("update scenes set etat = 'valider' where id = $1", [s.id]);
    expect((await poste.rpc("eleve_noter_idee_image", { p_scene: s.id, p_idee: "autre chose" })).error?.message).toBe("Tu ne peux pas écrire dans cette scène.");
    expect((await sql("select idee_image from scenes where id = $1", [s.id]))[0].idee_image).toBe("une grotte pleine de cristaux bleus");
    expect(await appels()).toEqual([]);
    void projet;
  });
});

describe("Le prompt de couverture (F11.4)", () => {
  it("F10-AC52 — la couverture : un prompt à copier au format du livre, d'après l'idée ou la description proposée ; aucune image créée", async () => {
    const { projet } = await passeurs();
    expect(await promptDeLaCouverture(enseignantDe(laurent), projet)).toEqual({ ok: false, message: "Décrivez d’abord ce que montre la couverture." });
    await laurent.base.from("projets").update({ idee_couverture: "le bac sur le lac au lever du jour" }).eq("id", projet);
    const r = await promptDeLaCouverture(enseignantDe(laurent), projet);
    expect(r.ok && r.prompt).toContain("le bac sur le lac au lever du jour");
    expect(r.ok && r.prompt).toContain("A5, 148 × 210 mm");
    const d = await proposerLaCouverture(enseignantDe(laurent), projet);
    expect(d.ok && d.description).toContain("le bac sur le lac");
    expect(await appels()).toEqual([{ aide: "description-image", sorte: "texte", nombre: 1 }]);
  });
});
