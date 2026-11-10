import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, posteDe, service, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

// Le poste d'un élève se reconnaît à son cookie : ici, celui du poste qu'on fait écrire
let jetonDuPoste: string | null = null;
vi.mock("@/serveur/poste", () => ({ empreinteDuPoste: async () => jetonDuPoste }));

import { placeALaFin, type Bloc, type ChoixAuto, type Enregistrement, type Texte } from "@/domaine/copie";
import { enregistrerPourAdulte, enregistrerPourEleve, retoucherDepuisLePlan } from "@/serveur/copie";

/**
 * Construire dans « Chemins », lot 1 : l'ajout venu du plan (F08.1, F08-AC44), contre la vraie
 * base locale. C'est ici que se vérifie le mécanisme : un choix posé depuis le plan dans une
 * scène qu'on écrit n'arrête personne, et tout autre changement reste un conflit.
 */

let laurent: Adulte;
let martin: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  [alice, bilal] = await inscrire(laurent, classe.id, ["Alice", "Bilal"]);
});
afterAll(nettoyer);

const p = (texte: string, id: string = randomUUID()): Bloc => ({ type: "p", id, children: [{ text: texte }] });
const choix = (libelle: string, cible: string | null): ChoixAuto => ({
  type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }],
});
const mots = (t: Texte): string[] => t.map((b) => (b.type === "choix" ? `→ ${b.libelle}` : b.type === "p" || b.type === "note" ? b.children.map((l) => ("text" in l ? l.text : "")).join("") : b.type));

/** « La forêt », où Alice (écriture et propositions) et Bilal (écriture et organisation) écrivent. */
async function recit(): Promise<{ projet: string; chapitre: string; oree: SceneEssai; s: SceneEssai[] }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La forêt");
  const oree = await creerScene(laurent.base, chapitreId);
  const s: SceneEssai[] = [];
  for (let i = 0; i < 3; i += 1) s.push(await creerScene(laurent.base, chapitreId));
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  return { projet: projet.id, chapitre: chapitreId, oree, s };
}

const ouvrir = async (poste: PosteEssai, scene: string): Promise<string> => {
  const { data, error } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: scene });
  if (error || !data) throw new Error(`Écriture d'essai : ${error?.message}`);
  return data as string;
};
/** L'élève enregistre comme le fait sa page : par le serveur de l'application, contrôle des droits compris. */
const ecrire = async (poste: PosteEssai, ecriture: string, version: number, texte: Texte): Promise<Enregistrement> => {
  jetonDuPoste = poste.jetonHash;
  try {
    return await enregistrerPourEleve(ecriture, version, texte);
  } finally {
    jetonDuPoste = null;
  }
};
const duPlan = (adulte: Adulte, scene: string, retouche: { ajoute?: ChoixAuto[]; retire?: string[] }) => retoucherDepuisLePlan(enseignantDe(adulte), scene, retouche);
const enBase = async (scene: string) =>
  (await sql<{ texte: Texte; version: number; etat: string; prise_par_eleve: string | null; ecrit_par: string[] }>(
    "select texte, version, etat, prise_par_eleve, ecrit_par from scenes where id = $1", [scene],
  ))[0];
const gardes = async (scene: string): Promise<number> =>
  Number((await sql<{ n: string }>("select count(*) as n from copies_recuperation where scene_id = $1", [scene]))[0].n);
const liensDe = (scene: string) => sql<{ libelle: string; cible_id: string | null }>("select libelle, cible_id from liens where scene_id = $1 order by rang", [scene]);
const lireScene = async (poste: PosteEssai, scene: string) => {
  const { data, error } = await (await poste.base()).rpc("scene_du_poste", { p_scene: scene });
  if (error) throw new Error(error.message);
  return data as { texte: Texte; version: number; refus: string | null } | null;
};

describe("Ajout venu du plan (F08.1)", () => {
  it("F08-AC44 — Alice écrit, Mme Laurent ajoute trois choix depuis « Chemins » : l'enregistrement suivant d'Alice réussit, son texte est entier, les trois choix sont à sa fin et reviennent à sa copie ; rien n'est gardé à part, elle n'est pas arrêtée", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, scene);
    const debut = p("Le héros arrive à l’orée de la forêt.");
    expect(await ecrire(poste, ecriture, 0, [debut])).toMatchObject({ etat: "enregistre", version: 1 });
    const avant = await enBase(scene);

    // Depuis « Chemins », sans ouvrir la scène
    const trois = [choix("Suivre le sentier des fougères", r.s[0].id), choix("Longer le ruisseau", r.s[1].id), choix("Entrer dans la grotte", r.s[2].id)];
    expect(await duPlan(laurent, scene, { ajoute: trois })).toEqual({ ok: true, version: 2 });
    expect(mots((await enBase(scene)).texte)).toEqual(["Le héros arrive à l’orée de la forêt.", "→ Suivre le sentier des fougères", "→ Longer le ruisseau", "→ Entrer dans la grotte"]);

    // Alice n'a rien vu : elle continue d'écrire, depuis la version qu'elle connaît
    const suite = [debut, p("Trois chemins s’ouvrent devant lui.")];
    const fait = await ecrire(poste, ecriture, 1, suite);
    expect(fait).toMatchObject({ etat: "enregistre", version: 3 });
    const apres = await enBase(scene);
    expect(mots(apres.texte)).toEqual([
      "Le héros arrive à l’orée de la forêt.", "Trois chemins s’ouvrent devant lui.", "→ Suivre le sentier des fougères", "→ Longer le ruisseau", "→ Entrer dans la grotte",
    ]);
    // Les trois choix lui reviennent, avec le nom des scènes où ils mènent : sa copie les montre
    expect(fait.etat === "enregistre" && fait.duPlan?.ajoute.map((b) => b.id)).toEqual(trois.map((b) => b.id));
    expect(fait.etat === "enregistre" && fait.duPlan?.scenes?.map((x) => x.id).sort()).toEqual(r.s.map((x) => x.id).sort());
    // Ni texte gardé à part, ni arrêt, ni changement d'état
    expect(await gardes(scene)).toBe(0);
    expect((await lireScene(poste, scene))?.refus).toBeNull();
    expect(apres.etat).toBe(avant.etat);
    expect(apres.prise_par_eleve).toBe(avant.prise_par_eleve);

    // Sa copie porte maintenant les choix, là où la base les a posés : l'envoi suivant ne change rien
    const copie = [...suite];
    copie.splice(placeALaFin(copie), 0, ...trois);
    expect(await ecrire(poste, ecriture, 3, copie)).toEqual({ etat: "enregistre", version: 3, dernier: false });
    // « Chemins » montre les trois flèches
    expect((await liensDe(scene)).map((l) => l.cible_id)).toEqual(r.s.map((x) => x.id));
  });

  it("F08-AC44 — sans le soin pris pour elle, la page d'Alice serait refusée : un choix est un bloc préparé pour son profil, et elle ne l'a pas supprimé", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, scene);
    const debut = p("Un texte.");
    await ecrire(poste, ecriture, 0, [debut]);
    await duPlan(laurent, scene, { ajoute: [choix("Avancer", r.s[0].id)] });
    // Un texte qui retire vraiment un bloc préparé reste refusé : Alice a reçu le choix, puis l'enlève
    const recu = await ecrire(poste, ecriture, 1, [debut, p("Elle continue.")]);
    expect(recu).toMatchObject({ etat: "enregistre", version: 3 });
    expect(await ecrire(poste, ecriture, 3, [debut, p("Elle continue, sans le choix.")])).toMatchObject({ etat: "garde", motif: "controle" });
  });

  it("F08-AC44 — un camarade a écrit entre-temps : c'est toujours un conflit, et le texte est gardé à part", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const ea = await ouvrir(pa, scene);
    const eb = await ouvrir(pb, scene);
    const debut = p("Le début.");
    await ecrire(pa, ea, 0, [debut]);
    await duPlan(laurent, scene, { ajoute: [choix("Avancer", r.s[0].id)] });
    // Bilal, parti de la version 1, enregistre : le plan seul l'a devancé, il passe
    expect(await ecrire(pb, eb, 1, [debut, p("Bilal ajoute une phrase.")])).toMatchObject({ etat: "enregistre", version: 3 });
    // Alice, partie de la version 1 elle aussi, arrive après Bilal : conflit ordinaire
    expect(await ecrire(pa, ea, 1, [debut, p("Alice écrit autre chose.")])).toMatchObject({ etat: "garde", motif: "conflit" });
    expect(await gardes(scene)).toBe(1);
    expect(mots((await enBase(scene)).texte)).toEqual(["Le début.", "Bilal ajoute une phrase.", "→ Avancer"]);
  });

  it("F08-AC44 — la réponse perdue en route : la page renvoie le même texte depuis la même version, il est reconnu, sans doublon ni conflit", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    const ecriture = await ouvrir(poste, scene);
    const debut = p("Le début.");
    await ecrire(poste, ecriture, 0, [debut]);
    const un = choix("Avancer", r.s[0].id);
    await duPlan(laurent, scene, { ajoute: [un] });
    const texte = [debut, p("La suite.")];
    expect(await ecrire(poste, ecriture, 1, texte)).toMatchObject({ etat: "enregistre", version: 3 });
    const encore = await ecrire(poste, ecriture, 1, texte);
    expect(encore).toMatchObject({ etat: "enregistre", version: 3 });
    expect(encore.etat === "enregistre" && encore.duPlan?.ajoute.map((b) => b.id)).toEqual([un.id]);
    expect(mots((await enBase(scene)).texte)).toEqual(["Le début.", "La suite.", "→ Avancer"]);
    expect(await gardes(scene)).toBe(0);
  });

  it("F08-AC44 — plusieurs retouches de suite, et un choix retiré depuis le plan : l'enregistrement suivant les reprend toutes", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, scene);
    const debut = p("Le début.");
    await ecrire(poste, ecriture, 0, [debut]);
    const [a, b, c] = [choix("Aller à gauche", r.s[0].id), choix("Aller à droite", r.s[1].id), choix("Rebrousser chemin", r.s[2].id)];
    await duPlan(laurent, scene, { ajoute: [a, b] });
    await duPlan(laurent, scene, { ajoute: [c] });
    // Alice reçoit les trois choix
    const recu = await ecrire(poste, ecriture, 1, [debut, p("Elle écrit.")]);
    expect(recu).toMatchObject({ etat: "enregistre", version: 4 });
    const copie: Texte = [debut, p("Elle écrit."), a, b, c];
    // Mme Laurent retire « Aller à droite » depuis « Chemins » ; Alice continue, son choix encore à l'écran
    expect(await duPlan(laurent, scene, { retire: [b.id] })).toEqual({ ok: true, version: 5 });
    copie[1] = p("Elle écrit encore.", copie[1].id);
    const fait = await ecrire(poste, ecriture, 4, copie);
    expect(fait).toMatchObject({ etat: "enregistre", version: 6 });
    expect(fait.etat === "enregistre" && fait.duPlan).toMatchObject({ ajoute: [], retire: [b.id] });
    expect(mots((await enBase(scene)).texte)).toEqual(["Le début.", "Elle écrit encore.", "→ Aller à gauche", "→ Rebrousser chemin"]);
    expect(await gardes(scene)).toBe(0);
    // Un choix ajouté puis retiré avant qu'elle n'enregistre ne lui arrive jamais
    const d = choix("Grimper", r.s[0].id);
    await duPlan(laurent, scene, { ajoute: [d] });
    await duPlan(laurent, scene, { retire: [d.id] });
    const copie2 = (await enBase(scene)).texte.filter((x) => x.id !== d.id);
    copie2[1] = p("Elle écrit toujours.", copie2[1].id);
    const apres = await ecrire(poste, ecriture, 6, copie2);
    expect(apres).toMatchObject({ etat: "enregistre", version: 9 });
    expect(apres.etat === "enregistre" && apres.duPlan?.ajoute).toEqual([]);
    expect(mots((await enBase(scene)).texte)).toEqual(["Le début.", "Elle écrit toujours.", "→ Aller à gauche", "→ Rebrousser chemin"]);
  });

  it("F08-AC44 — l'adulte qui a la scène ouverte ailleurs n'est pas arrêté non plus, et ses notes restent à leur place pour l'élève", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const e = enseignantDe(laurent);
    const debut = p("Le début.");
    const note: Bloc = { type: "note", id: randomUUID(), children: [{ text: "Penser au loup." }] };
    expect(await enregistrerPourAdulte(e, scene, 0, [debut, note])).toMatchObject({ etat: "enregistre", version: 1 });
    const un = choix("Avancer", r.s[0].id);
    await duPlan(laurent, scene, { ajoute: [un] });
    expect(mots((await enBase(scene)).texte)).toEqual(["Le début.", "Penser au loup.", "→ Avancer"]);
    // Dans l'autre onglet, l'adulte continue depuis la version 1
    const fait = await enregistrerPourAdulte(e, scene, 1, [debut, note, p("L’adulte corrige.")]);
    expect(fait).toMatchObject({ etat: "enregistre", version: 3 });
    expect(fait.etat === "enregistre" && fait.duPlan?.ajoute.map((b) => b.id)).toEqual([un.id]);
    // Bilal écrit ensuite : il ne reçoit pas la note, et elle reste après le paragraphe qu'elle suivait
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    const ecriture = await ouvrir(poste, scene);
    const lue = (await lireScene(poste, scene))!;
    expect(mots(lue.texte)).toEqual(["Le début.", "L’adulte corrige.", "→ Avancer"]);
    await duPlan(laurent, scene, { ajoute: [choix("Reculer", r.s[1].id)] });
    const texte = [...lue.texte];
    texte[1] = p("L’adulte corrige, Bilal aussi.", texte[1].id);
    expect(await ecrire(poste, ecriture, lue.version, texte)).toMatchObject({ etat: "enregistre" });
    expect(mots((await enBase(scene)).texte)).toEqual(["Le début.", "Penser au loup.", "L’adulte corrige, Bilal aussi.", "→ Avancer", "→ Reculer"]);
    expect(await gardes(scene)).toBe(0);
  });

  it("F08-AC44 — dix ajouts du plan et dix enregistrements de l'élève partis ensemble : jamais un texte gardé à part, aucun choix perdu", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    const ecriture = await ouvrir(poste, scene);
    const debut = p("Le début.");
    let copie: Texte = [debut];
    let version = (await ecrire(poste, ecriture, 0, copie) as { version: number }).version;
    const poses: string[] = [];
    for (let tour = 0; tour < 10; tour += 1) {
      const neuf = choix(`Choix ${tour}`, r.s[tour % 3].id);
      poses.push(neuf.id);
      copie = copie.map((b) => (b.id === debut.id ? p(`Le début, tour ${tour}.`, debut.id) : b));
      // L'ajout et l'enregistrement partent ensemble : l'un ou l'autre passe le premier
      const [, fait] = await Promise.all([duPlan(laurent, scene, { ajoute: [neuf] }), ecrire(poste, ecriture, version, copie)]);
      expect(fait.etat).toBe("enregistre");
      if (fait.etat !== "enregistre") return;
      version = fait.version;
      // La page reprend ce que le plan a posé, comme le fait la copie
      const recus = (fait.duPlan?.ajoute ?? []).filter((b) => !copie.some((x) => x.id === b.id));
      copie = [...copie];
      copie.splice(placeALaFin(copie), 0, ...recus);
    }
    // Un dernier enregistrement ramène ce que le plan a posé après le dixième
    const fin = await ecrire(poste, ecriture, version, copie.map((b) => (b.id === debut.id ? p("Le début, pour finir.", debut.id) : b)));
    expect(fin.etat).toBe("enregistre");
    expect(await gardes(scene)).toBe(0);
    const texte = (await enBase(scene)).texte;
    expect(texte.filter((b) => b.type === "choix").map((b) => b.id).sort()).toEqual([...poses].sort());
    expect(mots(texte)[0]).toBe("Le début, pour finir.");
  });

  it("F08-AC44 — « Remettre » juste après un ajout du plan, sans avoir rien tapé depuis : la remise se fait, avec les choix", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, scene);
    await ecrire(poste, ecriture, 0, [p("Le texte d’Alice.")]);
    await duPlan(laurent, scene, { ajoute: [choix("Avancer", r.s[0].id)] });
    const base = await poste.base();
    const { data } = await base.rpc("eleve_remettre", { p_scene: scene, p_version: 1 });
    expect(data).toMatchObject({ fait: true });
    expect((await enBase(scene)).etat).toBe("valider");
    const remise = await sql<{ texte: Texte }>("select texte from remises where scene_id = $1", [scene]);
    expect(mots(remise[0].texte)).toEqual(["Le texte d’Alice.", "→ Avancer"]);
    // Une version ancienne pour une autre raison reste refusée (F07-AC29)
    const autre = r.s[0].id;
    const e2 = await ouvrir(poste, autre);
    await ecrire(poste, e2, 0, [p("Un.")]);
    await ecrire(poste, e2, 1, [p("Deux.")]);
    expect((await base.rpc("eleve_remettre", { p_scene: autre, p_version: 1 })).data).toMatchObject({ fait: false, motif: "conflit" });
  });

  it("F03-AC52 — dans une scène que personne n'a ouverte, le choix se pose sous la ligne où écrire ; les liens cachés restent à la fin ; rien d'autre ne change", async () => {
    const r = await recit();
    const scene = r.oree.id;
    const un = choix("Suivre le ruisseau", r.s[0].id);
    expect(await duPlan(laurent, scene, { ajoute: [un] })).toEqual({ ok: true, version: 1 });
    const apres = await enBase(scene);
    expect(apres.texte.map((b) => b.type)).toEqual(["p", "choix"]);
    // La ligne où écrire est celle que la copie montre d'elle-même à l'ouverture
    expect(apres.texte[0].id).toBe(`00000000${scene.slice(8)}`);
    expect(apres.ecrit_par).toEqual([]);
    expect(apres.etat).toBe("cours");
    // Le même choix posé deux fois ne se double pas
    expect(await duPlan(laurent, scene, { ajoute: [un] })).toEqual({ ok: true, version: 1 });

    // Une scène écrite, avec des lignes vides à la fin et un lien caché
    const autre = r.s[1].id;
    const liaison: Bloc = { type: "liaison", id: randomUUID(), cible: r.s[2].id, children: [{ text: "" }] };
    await enregistrerPourAdulte(enseignantDe(laurent), autre, 0, [p("Un récit."), p(""), p(""), liaison]);
    await duPlan(laurent, autre, { ajoute: [choix("Avancer", r.s[2].id)] });
    const texte = (await enBase(autre)).texte;
    expect(texte.map((b) => b.type)).toEqual(["p", "choix", "p", "p", "liaison"]);
    // La copie ouverte pose au même endroit
    expect(placeALaFin(texte.filter((b) => b.type !== "liaison" && b.type !== "choix"))).toBe(1);
    // Une version précédente est gardée, comme pour une correction de l'adulte
    const versions = await sql("select 1 from versions_precedentes where scene_id = $1 and de_l_adulte", [autre]);
    expect(versions.length).toBe(1);
  });

  it("F03-AC57 — réservé à l'adulte du projet : ni un élève, ni un autre enseignant, ni un récit classique", async () => {
    const r = await recit();
    const un = [choix("Avancer", r.s[0].id)];
    expect((await duPlan(martin, r.oree.id, { ajoute: un })).ok).toBe(false);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const { error } = await (await poste.base()).rpc("retoucher_depuis_le_plan", { p_scene: r.oree.id, p_ajoute: un });
    expect(error).not.toBeNull();
    expect((await service().from("retouches_du_plan").select("scene_id").eq("scene_id", r.oree.id)).data).toEqual([]);
    // La table ne se lit pas : ni l'adulte ni le poste
    await duPlan(laurent, r.oree.id, { ajoute: un });
    expect((await laurent.base.from("retouches_du_plan").select("scene_id")).data ?? []).toEqual([]);
    // Un récit classique n'a pas de choix
    const classique = await creerProjet(laurent, "classe", "classique", "Un récit classique", classe.id);
    const { chapitreId } = await creerPartie(laurent, classique.id, "Partie", "Chapitre");
    const s = await creerScene(laurent.base, chapitreId);
    expect((await duPlan(laurent, s.id, { ajoute: [choix("Avancer", null)] })).ok).toBe(false);
    // Seules des phrases de choix se posent : un paragraphe glissé parmi elles est refusé avant la base
    expect((await duPlan(laurent, r.oree.id, { ajoute: [p("Du récit") as unknown as ChoixAuto] })).ok).toBe(false);
  });
});
