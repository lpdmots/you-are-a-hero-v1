import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chiffrer } from "@/serveur/chiffrement";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, identifier, inscrire, lire, nettoyer, ouvrirPoste,
  posteDe, service, sql, type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

/**
 * Étape 3 du plan, lot 1 : le texte d'une scène, son enregistrement et ce qui est gardé à
 * part (F08.1, F08.2), contre la vraie base locale. C'est ici que se lève la vérification
 * V7 : contrôle de version d'un seul tenant, texte gardé au moment du refus, échange d'un
 * seul tenant, arrêt de l'élève tenu d'un poste à l'autre.
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

type Bloc = { type: "p"; id: string; children: { text: string; bold?: true }[] };
const texte = (...paragraphes: string[]): Bloc[] => paragraphes.map((t) => ({ type: "p", id: randomUUID(), children: [{ text: t }] }));
type Rendu = { etat: string; version?: number; motif?: string; dernier?: boolean };

/** « La lisière », où écrivent Alice et Bilal, avec ses scènes ; « Le sanctuaire », à Chloé. */
async function recit(scenes = 2): Promise<{ projet: string; lisiere: string; sanctuaire: string; s: SceneEssai[]; autel: SceneEssai }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const s: SceneEssai[] = [];
  for (let i = 0; i < scenes; i += 1) s.push(await creerScene(laurent.base, chapitreId));
  const autel = await creerScene(laurent.base, sanctuaire);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  await attribuer(laurent, sanctuaire, [{ eleve: chloe.id }]);
  return { projet: projet.id, lisiere: chapitreId, sanctuaire, s, autel };
}

const ecrireAdulte = async (adulte: Adulte, scene: string, version: number, t: unknown): Promise<Rendu> => {
  const { data, error } = await adulte.base.rpc("enregistrer_texte", { p_scene: scene, p_version: version, p_texte: t });
  if (error) throw new Error(error.message);
  return data as Rendu;
};
const ouvrir = async (poste: PosteEssai, scene: string): Promise<string | null> => {
  const { data, error } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: scene });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
};
const ecrireEleve = async (poste: PosteEssai, ecriture: string, version: number, t: unknown, refus: string | null = null): Promise<Rendu> => {
  const { data, error } = await service().rpc("ecriture_enregistrer", {
    p_ecriture: ecriture, p_jeton_hash: poste.jetonHash, p_version: version, p_texte: t, p_refus: refus,
  });
  if (error) throw new Error(error.message);
  return data as Rendu;
};
type SceneLue = { texte: Bloc[]; version: number; vide: boolean; consigne: string | null; profil: string | null; refus: string | null; marques: boolean };
const lireScene = async (poste: PosteEssai, scene: string): Promise<SceneLue | null> => {
  const { data, error } = await (await poste.base()).rpc("scene_du_poste", { p_scene: scene });
  if (error) throw new Error(error.message);
  return (data as SceneLue | null) ?? null;
};
const sceneEnBase = async (scene: string) =>
  (await sql<{ texte: Bloc[]; version: number; texte_vide: boolean; ecrit_par: string[] }>("select texte, version, texte_vide, ecrit_par from scenes where id = $1", [scene]))[0];
const copies = (scene: string) =>
  sql<{ id: string; sorte: string; eleve_id: string | null; motif: string | null; texte: Bloc[]; retire_le: string | null }>(
    "select id, sorte, eleve_id, motif, texte, retire_le from copies_recuperation where scene_id = $1 and retire_le is null order by garde_le, id",
    [scene],
  );
const mots = (t: Bloc[]): string => t.map((b) => b.children.map((l) => l.text).join("")).join(" / ");

describe("Écritures concurrentes (F08.1) — V7", () => {
  it("F08-AC01 — une version devenue ancienne ne remplace rien ; de dix enregistrements partis ensemble de la même version, un seul devient le texte", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    expect(await ecrireAdulte(laurent, scene, 0, texte("Le premier texte."))).toMatchObject({ etat: "enregistre", version: 1 });
    // La seconde session part de l'ancienne version
    expect(await ecrireAdulte(laurent, scene, 0, texte("Un texte parti trop tard."))).toMatchObject({ etat: "garde", motif: "conflit" });
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Le premier texte.");

    const partis = await Promise.all(Array.from({ length: 10 }, (_, i) => ecrireAdulte(laurent, scene, 1, texte(`Texte ${i}.`))));
    expect(partis.filter((p) => p.etat === "enregistre")).toHaveLength(1);
    expect(partis.filter((p) => p.etat === "garde")).toHaveLength(9);
    const apres = await sceneEnBase(scene);
    expect(apres.version).toBe(2);
    // Aucun des dix textes n'a disparu : un dans la scène, neuf gardés à part, plus celui du premier conflit
    const gardes = (await copies(scene)).map((c) => mots(c.texte));
    expect(new Set([mots(apres.texte), ...gardes]).size).toBe(11);
  });

  it("F08-AC02, AC03 — le texte courant reste, le texte concurrent est gardé à part, sans fusion ; la réponse ne dit pas « enregistré »", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const ea = (await ouvrir(pa, scene))!;
    const eb = (await ouvrir(pb, scene))!;
    expect(await ecrireEleve(pa, ea, 0, texte("Alice recopie son texte."))).toMatchObject({ etat: "enregistre", version: 1 });
    const refuse = await ecrireEleve(pb, eb, 0, texte("Bilal écrit depuis la version qu’il avait ouverte."));
    expect(refuse).toMatchObject({ etat: "garde", motif: "conflit" });
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Alice recopie son texte.");
    const gardes = await copies(scene);
    expect(gardes).toHaveLength(1);
    expect(gardes[0]).toMatchObject({ sorte: "refus", eleve_id: bilal.id, motif: "conflit" });
    expect(mots(gardes[0].texte)).toBe("Bilal écrit depuis la version qu’il avait ouverte.");
  });

  it("F08-AC04, AC09, AC10, AC12, AC17 — l'arrêt tient d'un poste à l'autre et sans limite ; les autres continuent, l'élève arrêté écrit ailleurs et ne lit pas son texte gardé", async () => {
    const r = await recit();
    const [s15, s16] = [r.s[0].id, r.s[1].id];
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const ea = (await ouvrir(pa, s15))!;
    const eb = (await ouvrir(pb, s15))!;
    await ecrireEleve(pa, ea, 0, texte("Le texte d’Alice."));
    await ecrireEleve(pb, eb, 0, texte("Le texte de Bilal."));

    // Bilal recharge, change de poste, revient trois semaines plus tard
    expect((await lireScene(pb, s15))?.refus).toBe("arrete");
    expect(await ouvrir(pb, s15)).toBeNull();
    const autre = await posteDe(classe.id, bilal.inscriptionId);
    expect((await lireScene(autre, s15))?.refus).toBe("arrete");
    expect(await ouvrir(autre, s15)).toBeNull();
    await sql("update copies_recuperation set garde_le = now() - interval '21 days' where scene_id = $1", [s15]);
    const lue = await lireScene(autre, s15);
    expect(lue?.refus).toBe("arrete");
    // Il lit le texte de la scène, pas le sien
    expect(mots(lue!.texte)).toBe("Le texte d’Alice.");
    expect(JSON.stringify(lue)).not.toContain("Bilal");
    const { data: arrets } = await (await autre.base()).rpc("scenes_ou_je_suis_arrete", { p_chapitre: r.lisiere });
    expect(arrets).toEqual([s15]);

    // Alice continue ; Bilal écrit dans S016
    expect(await ecrireEleve(pa, ea, 1, texte("Le texte d’Alice, suite."))).toMatchObject({ etat: "enregistre", version: 2 });
    const e16 = (await ouvrir(autre, s16))!;
    expect(e16).not.toBeNull();
    expect(await ecrireEleve(autre, e16, 0, texte("Bilal écrit ailleurs."))).toMatchObject({ etat: "enregistre" });
    const { data: arretsAlice } = await (await pa.base()).rpc("scenes_ou_je_suis_arrete", { p_chapitre: r.lisiere });
    expect(arretsAlice).toEqual([]);
  });

  it("F08-AC07, AC13, AC18, AC39 — « Ne plus garder » rend l'écriture sans changer la scène ; « Annuler » rétablit le texte et l'arrêt, et ce qui est tapé entre-temps est gardé à part à son tour", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    await ecrireEleve(pa, (await ouvrir(pa, scene))!, 0, texte("Le texte d’Alice."));
    const eb0 = (await ouvrir(pb, scene))!;
    await ecrireEleve(pb, eb0, 0, texte("Le texte de Bilal."));
    const [garde] = await copies(scene);

    expect((await laurent.base.rpc("ne_plus_garder", { p_copie: garde.id })).error).toBeNull();
    expect(await copies(scene)).toHaveLength(0);
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Le texte d’Alice.");
    // Bilal peut de nouveau écrire, et rien ne lui dit ce qui a été décidé
    const lue = await lireScene(pb, scene);
    expect(lue?.refus).toBeNull();
    const eb = (await ouvrir(pb, scene))!;
    expect(eb).not.toBeNull();

    // L'enseignante annule alors que Bilal a recommencé d'écrire
    expect((await laurent.base.rpc("garder_de_nouveau", { p_copie: garde.id })).error).toBeNull();
    expect((await lireScene(pb, scene))?.refus).toBe("arrete");
    expect(await ecrireEleve(pb, eb, 1, texte("Le texte d’Alice.", "Ce que Bilal venait de taper."))).toMatchObject({ etat: "garde", motif: "arrete" });
    const deux = await copies(scene);
    expect(deux.map((c) => mots(c.texte))).toEqual(["Le texte de Bilal.", "Le texte d’Alice. / Ce que Bilal venait de taper."]);
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Le texte d’Alice.");

    // Un autre enseignant ne touche à rien
    expect((await martin.base.rpc("ne_plus_garder", { p_copie: garde.id })).error).not.toBeNull();
    expect((await martin.base.rpc("mettre_copie_dans_scene", { p_copie: garde.id })).error).not.toBeNull();
  });

  it("F08-AC08, AC15, AC30 — l'échange ne perd rien : le texte de Bilal passe dans la scène, celui d'Alice est gardé à part sous « ancien », qui n'arrête personne ; le second échange les remet", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    await ecrireEleve(pa, (await ouvrir(pa, scene))!, 0, texte("Le texte d’Alice."));
    await ecrireEleve(pb, (await ouvrir(pb, scene))!, 0, texte("Le texte de Bilal."));
    const [garde] = await copies(scene);

    const { data: fait, error } = await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: garde.id });
    expect(error).toBeNull();
    expect(fait).toMatchObject({ version: 2, ancien: garde.id });
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Le texte de Bilal.");
    let gardes = await copies(scene);
    expect(gardes).toHaveLength(1);
    expect(gardes[0]).toMatchObject({ sorte: "ancien", eleve_id: null });
    expect(mots(gardes[0].texte)).toBe("Le texte d’Alice.");
    // Bilal écrit de nouveau, Alice aussi : l'ancien texte n'arrête personne
    expect((await lireScene(pb, scene))?.refus).toBeNull();
    expect((await lireScene(pa, scene))?.refus).toBeNull();

    // Second échange : le texte de Bilal ressort sous « ancien », et Bilal n'est pas arrêté de nouveau
    expect((await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: garde.id })).error).toBeNull();
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Le texte d’Alice.");
    gardes = await copies(scene);
    expect(gardes).toHaveLength(1);
    expect(gardes[0]).toMatchObject({ sorte: "ancien", eleve_id: null });
    expect(mots(gardes[0].texte)).toBe("Le texte de Bilal.");
    expect((await lireScene(pb, scene))?.refus).toBeNull();
  });

  it("F08-AC08 — deux échanges demandés ensemble ne se croisent pas : les deux textes existent toujours, une seule fois chacun", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    await ecrireAdulte(laurent, scene, 0, texte("Texte de la scène."));
    await ecrireAdulte(laurent, scene, 0, texte("Texte gardé A."));
    await ecrireAdulte(laurent, scene, 0, texte("Texte gardé B."));
    const [a, b] = await copies(scene);
    const faits = await Promise.all([
      laurent.base.rpc("mettre_copie_dans_scene", { p_copie: a.id }),
      laurent.base.rpc("mettre_copie_dans_scene", { p_copie: b.id }),
    ]);
    expect(faits.map((f) => f.error)).toEqual([null, null]);
    const tous = [mots((await sceneEnBase(scene)).texte), ...(await copies(scene)).map((c) => mots(c.texte))].sort();
    expect(tous).toEqual(["Texte de la scène.", "Texte gardé A.", "Texte gardé B."]);
  });

  it("F08-AC14 — un élève, un texte : traiter celui de Chloé ne libère pas Bilal", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    await attribuer(laurent, r.lisiere, [{ eleve: alice.id }, { eleve: bilal.id }, { eleve: chloe.id }]);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const pc = await posteDe(classe.id, chloe.inscriptionId);
    const [ea, eb, ec] = [(await ouvrir(pa, scene))!, (await ouvrir(pb, scene))!, (await ouvrir(pc, scene))!];
    await ecrireEleve(pa, ea, 0, texte("Alice."));
    await ecrireEleve(pb, eb, 0, texte("Bilal."));
    await ecrireEleve(pc, ec, 0, texte("Chloé."));
    const deChloe = (await copies(scene)).find((c) => c.eleve_id === chloe.id)!;
    await laurent.base.rpc("ne_plus_garder", { p_copie: deChloe.id });
    expect((await lireScene(pc, scene))?.refus).toBeNull();
    expect((await lireScene(pb, scene))?.refus).toBe("arrete");
  });

  it("F08-AC16 — échange pendant qu'Alice tape : son enregistrement suivant ne remplace rien, sa saisie est gardée à part et elle est arrêtée", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const ea = (await ouvrir(pa, scene))!;
    await ecrireEleve(pa, ea, 0, texte("Alice."));
    await ecrireEleve(pb, (await ouvrir(pb, scene))!, 0, texte("Bilal."));
    const [garde] = await copies(scene);
    await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: garde.id });
    expect(await ecrireEleve(pa, ea, 1, texte("Alice.", "Alice tape encore."))).toMatchObject({ etat: "garde", motif: "conflit" });
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Bilal.");
    expect((await lireScene(pa, scene))?.refus).toBe("arrete");
    expect((await copies(scene)).map((c) => [c.sorte, mots(c.texte)])).toEqual([["ancien", "Alice."], ["refus", "Alice. / Alice tape encore."]]);
  });

  it("F08-AC21, AC29 — le texte refusé de l'adulte est gardé à part sans l'arrêter : il écrit aussitôt dans le texte à jour", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    await ecrireEleve(pa, (await ouvrir(pa, scene))!, 0, texte("Alice écrit."));
    expect(await ecrireAdulte(laurent, scene, 0, texte("Les corrections de Mme Laurent."))).toMatchObject({ etat: "garde", motif: "conflit", version: 1 });
    const [garde] = await copies(scene);
    expect(garde).toMatchObject({ sorte: "refus", eleve_id: null });
    expect(await ecrireAdulte(laurent, scene, 1, texte("Alice écrit.", "Mme Laurent ajoute une phrase."))).toMatchObject({ etat: "enregistre", version: 2 });

    // Mode personnel : deux fenêtres du même auteur
    const perso = await creerProjet(laurent, "personnel", "choix", "Mon roman");
    const { chapitreId } = await creerPartie(laurent, perso.id, "Début", "Chapitre un");
    const s4 = await creerScene(laurent.base, chapitreId);
    await ecrireAdulte(laurent, s4.id, 0, texte("Première fenêtre."));
    expect(await ecrireAdulte(laurent, s4.id, 0, texte("Seconde fenêtre."))).toMatchObject({ etat: "garde" });
    expect(mots((await sceneEnBase(s4.id)).texte)).toBe("Première fenêtre.");
    const [aPart] = await copies(s4.id);
    expect((await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: aPart.id })).error).toBeNull();
    expect(mots((await sceneEnBase(s4.id)).texte)).toBe("Seconde fenêtre.");
  });

  it("F08.2 — une réponse perdue puis un nouvel essai ne font pas un conflit avec soi-même ; un texte inchangé n'augmente pas la version", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const t = texte("Une phrase.");
    expect(await ecrireAdulte(laurent, scene, 0, t)).toMatchObject({ etat: "enregistre", version: 1 });
    // La page n'a pas reçu la réponse : elle renvoie le même texte, avec la version qu'elle connaît
    expect(await ecrireAdulte(laurent, scene, 0, t)).toMatchObject({ etat: "enregistre", version: 1 });
    expect(await ecrireAdulte(laurent, scene, 1, t)).toMatchObject({ etat: "enregistre", version: 1 });
    expect(await copies(scene)).toHaveLength(0);
  });
});

describe("Enregistrement refusé pour une autre raison (F08.2)", () => {
  it("F08-AC36 — scène supprimée pendant la frappe : le texte est gardé à part sur la scène et revient avec elle", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const eb = (await ouvrir(pb, scene))!;
    await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: scene });
    expect(await ecrireEleve(pb, eb, 0, texte("Bilal tapait encore."))).toMatchObject({ etat: "garde", motif: "supprimee" });
    await laurent.base.rpc("restaurer_element", { p_sorte: "scene", p_id: scene });
    const [garde] = await copies(scene);
    expect(garde).toMatchObject({ eleve_id: bilal.id, sorte: "refus" });
    expect(mots(garde.texte)).toBe("Bilal tapait encore.");
    expect((await sceneEnBase(scene)).texte_vide).toBe(true);
  });

  it("F08-AC37 — chapitre retiré pendant la frappe : la dernière phrase est gardée à part, et l'élève ne lit plus la scène", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const eb = (await ouvrir(pb, scene))!;
    await ecrireEleve(pb, eb, 0, texte("Bilal écrit."));
    await attribuer(laurent, r.lisiere, [{ eleve: alice.id }]);
    expect(await ecrireEleve(pb, eb, 1, texte("Bilal écrit.", "Sa dernière phrase."))).toMatchObject({ etat: "garde", motif: "acces" });
    expect((await copies(scene))[0]).toMatchObject({ eleve_id: bilal.id });
    expect(await lireScene(pb, scene)).toBeNull();
    expect(mots((await sceneEnBase(scene)).texte)).toBe("Bilal écrit.");
  });

  it("F06-AC62, F08.1 — la scène que l'enseignante s'attribue ne s'écrit plus : ce que l'élève tapait est gardé à part ; désignée à sa place, Alice y écrit", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const ea = (await ouvrir(pa, scene))!;
    await ecrireEleve(pa, ea, 0, texte("Alice commence."));
    await laurent.base.from("scenes").update({ prise_par_enseignant: true }).eq("id", scene);
    expect((await lireScene(pa, scene))?.refus).toBe("scene");
    expect(await ouvrir(pa, scene)).toBeNull();
    expect(await ecrireEleve(pa, ea, 1, texte("Alice commence.", "Elle tapait encore."))).toMatchObject({ etat: "garde", motif: "scene" });
    const [garde] = await copies(scene);
    await laurent.base.rpc("ne_plus_garder", { p_copie: garde.id });
    // Elle la lit toujours, sans l'écrire
    expect(mots((await lireScene(pa, scene))!.texte)).toBe("Alice commence.");
    await laurent.base.from("scenes").update({ prise_par_enseignant: false, prise_par_eleve: alice.id }).eq("id", scene);
    expect((await lireScene(pa, scene))?.refus).toBeNull();
    const suite = (await ouvrir(pa, scene))!;
    expect(await ecrireEleve(pa, suite, 1, texte("Alice commence.", "Elle reprend."))).toMatchObject({ etat: "enregistre", version: 2 });
  });

  it("un texte refusé par le contrôle de l'application est gardé à part, jamais écrit dans la scène", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const ea = (await ouvrir(pa, scene))!;
    expect(await ecrireEleve(pa, ea, 0, texte("Un texte que le serveur a refusé."), "controle")).toMatchObject({ etat: "garde", motif: "controle" });
    expect((await sceneEnBase(scene)).texte_vide).toBe(true);
  });
});

describe("Dernier enregistrement à la fermeture d'un poste (F06.4)", () => {
  const ouverte = async () => {
    const autre = await creerClasse(laurent, "CE2");
    const [dylan] = await inscrire(laurent, autre.id, ["Dylan"]);
    const projet = await creerProjet(laurent, "classe", "choix", "Le phare", autre.id);
    const { chapitreId } = await creerPartie(laurent, projet.id, "La côte", "Le phare");
    const scene = await creerScene(laurent.base, chapitreId);
    await attribuer(laurent, chapitreId, [{ eleve: dylan.id }]);
    const poste = await posteDe(autre.id, dylan.inscriptionId);
    const ecriture = (await ouvrir(poste, scene.id))!;
    expect(await ecrireEleve(poste, ecriture, 0, texte("Dylan écrit."))).toMatchObject({ etat: "enregistre", version: 1, dernier: false });
    return { autre, dylan, scene: scene.id, poste, ecriture };
  };
  const derniere = texte("Dylan écrit.", "Sa dernière phrase.");

  it("F06-AC29 — la plage se termine : la dernière phrase est enregistrée, même après l'échéance, puis l'accès est fermé", async () => {
    const o = await ouverte();
    const hier = ((new Date().getDay() + 6) % 7) || 7;
    await laurent.base.rpc("regler_horaires", { p_classe: o.autre.id, p_limites: true, p_plages: [{ jours: [hier], de: "00:00", a: "00:01" }] });
    // Hors des horaires, le poste ne lit plus la scène
    expect(await lireScene(o.poste, o.scene)).toBeNull();
    expect(await ouvrir(o.poste, o.scene)).toBeNull();
    expect(await ecrireEleve(o.poste, o.ecriture, 1, derniere)).toMatchObject({ etat: "enregistre", version: 2, dernier: true });
    expect(mots((await sceneEnBase(o.scene)).texte)).toBe("Dylan écrit. / Sa dernière phrase.");
    // Une seule fois : ensuite, plus rien ne s'écrit depuis cette page
    expect(await ecrireEleve(o.poste, o.ecriture, 2, texte("Encore."))).toEqual({ etat: "ferme" });
    expect(mots((await sceneEnBase(o.scene)).texte)).toBe("Dylan écrit. / Sa dernière phrase.");
    await laurent.base.rpc("regler_horaires", { p_classe: o.autre.id, p_limites: false, p_plages: [] });
    // À la reprise, il retrouve son texte
    expect(mots((await lireScene(o.poste, o.scene))!.texte)).toBe("Dylan écrit. / Sa dernière phrase.");
  });

  it("F06-AC29 — les protections de F08.1 valent pour ce dernier enregistrement : sur un conflit, il est gardé à part", async () => {
    const o = await ouverte();
    await ecrireAdulte(laurent, o.scene, 1, texte("Dylan écrit.", "Mme Laurent corrige."));
    await sql("update postes set actif_le = now() - interval '3 hours' where id = $1", [o.poste.id]);
    expect(await ecrireEleve(o.poste, o.ecriture, 1, derniere)).toMatchObject({ etat: "garde", motif: "conflit", dernier: true });
    expect(mots((await sceneEnBase(o.scene)).texte)).toBe("Dylan écrit. / Mme Laurent corrige.");
  });

  it("F06-AC76 — deux heures sans activité : le texte en cours est enregistré", async () => {
    const o = await ouverte();
    await sql("update postes set actif_le = now() - interval '2 hours 1 minute' where id = $1", [o.poste.id]);
    expect(await ecrireEleve(o.poste, o.ecriture, 1, derniere)).toMatchObject({ etat: "enregistre", dernier: true });
  });

  it("F06-AC77 — mot de passe de la classe remplacé : le texte est enregistré, et le poste ne lit plus rien", async () => {
    const o = await ouverte();
    const { error } = await laurent.base
      .from("classes_secrets")
      .update({ mot_de_passe_chiffre: chiffrer("lune castor 17", { sorte: "classe", id: o.autre.id }) })
      .eq("classe_id", o.autre.id);
    expect(error).toBeNull();
    expect(await lireScene(o.poste, o.scene)).toBeNull();
    expect(await ecrireEleve(o.poste, o.ecriture, 1, derniere)).toMatchObject({ etat: "enregistre", dernier: true });
    expect(mots((await sceneEnBase(o.scene)).texte)).toBe("Dylan écrit. / Sa dernière phrase.");
  });

  it("F06-AC78 — année terminée : le texte est enregistré ; élève retiré de la classe : sa dernière phrase est gardée à part sur la scène (F08.2)", async () => {
    const annee = await ouverte();
    await laurent.base.from("classes").update({ terminee_le: new Date().toISOString() }).eq("id", annee.autre.id);
    expect(await ecrireEleve(annee.poste, annee.ecriture, 1, derniere)).toMatchObject({ etat: "enregistre", dernier: true });

    const retire = await ouverte();
    await laurent.base.from("inscriptions").update({ retire_le: new Date().toISOString() }).eq("id", retire.dylan.inscriptionId);
    expect(await ecrireEleve(retire.poste, retire.ecriture, 1, derniere)).toMatchObject({ etat: "garde", motif: "acces", dernier: true });
    expect(mots((await sceneEnBase(retire.scene)).texte)).toBe("Dylan écrit.");
    expect(mots((await copies(retire.scene))[0].texte)).toBe("Dylan écrit. / Sa dernière phrase.");
  });

  it("F06-AC17 — « Changer d'élève » : le texte d'Alice reste ; celui que Bilal enregistre ensuite sur le même poste est à Bilal", async () => {
    const r = await recit();
    const [s1, s2] = [r.s[0].id, r.s[1].id];
    const poste = (await ouvrirPoste(classe.id))!;
    await identifier(poste, alice.inscriptionId);
    await ecrireEleve(poste, (await ouvrir(poste, s1))!, 0, texte("Le texte d’Alice."));
    await service().rpc("changer_eleve", { p_poste: poste.id });
    await identifier(poste, bilal.inscriptionId);
    await ecrireEleve(poste, (await ouvrir(poste, s2))!, 0, texte("Le texte de Bilal."));
    expect(await sceneEnBase(s1)).toMatchObject({ ecrit_par: [alice.id] });
    expect(mots((await sceneEnBase(s1)).texte)).toBe("Le texte d’Alice.");
    expect(await sceneEnBase(s2)).toMatchObject({ ecrit_par: [bilal.id] });
  });

  it("une écriture ne sert qu'au poste qui l'a ouverte", async () => {
    const r = await recit();
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const ea = (await ouvrir(pa, r.s[0].id))!;
    expect(await ecrireEleve(pb, ea, 0, texte("Bilal se fait passer pour Alice."))).toEqual({ etat: "ferme" });
    expect((await sceneEnBase(r.s[0].id)).texte_vide).toBe(true);
  });
});

describe("Versions précédentes (F08.2)", () => {
  it("F08-AC40, AC41 — le texte d'avant est gardé au premier enregistrement du jour, une fois par personne et par jour ; un texte vide ne l'est pas", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const ea = (await ouvrir(pa, scene))!;
    const dixLignes = texte(...Array.from({ length: 10 }, (_, i) => `Ligne ${i + 1}.`));
    // Lundi : Alice part d'un texte vide, rien n'est gardé
    await ecrireEleve(pa, ea, 0, dixLignes);
    expect(await sql("select 1 from versions_precedentes where scene_id = $1", [scene])).toHaveLength(0);
    await sql("update versions_precedentes set jour = jour - 1 where scene_id = $1", [scene]);

    // Mardi : elle sélectionne tout, tape une lettre, puis modifie encore deux fois
    await ecrireEleve(pa, ea, 1, texte("x"));
    await ecrireEleve(pa, ea, 2, texte("xy"));
    await ecrireEleve(pa, ea, 3, texte("xyz"));
    const versions = await sql<{ id: string; sorte: string; eleve_id: string; de_l_adulte: boolean; texte: Bloc[] }>(
      "select id, sorte, eleve_id, de_l_adulte, texte from versions_precedentes where scene_id = $1",
      [scene],
    );
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({ sorte: "avant", eleve_id: alice.id, de_l_adulte: false });
    expect(versions[0].texte).toHaveLength(10);

    // L'enseignante modifie le même jour : sa propre version, celle d'avant ses modifications
    await ecrireAdulte(laurent, scene, 4, texte("xyz corrigé"));
    await ecrireAdulte(laurent, scene, 5, texte("xyz corrigé encore"));
    const lues = (await laurent.base.from("versions_precedentes").select("sorte, eleve_id, de_l_adulte, texte").eq("scene_id", scene).order("cree_le")).data!;
    expect(lues).toHaveLength(2);
    expect(lues[1]).toMatchObject({ sorte: "avant", eleve_id: null, de_l_adulte: true });
    expect(mots(lues[1].texte as Bloc[])).toBe("xyz");

    // « Mettre ce texte dans la scène » rend les dix lignes ; le texte remplacé devient une version
    const { error } = await laurent.base.rpc("mettre_version_dans_scene", { p_version: versions[0].id });
    expect(error).toBeNull();
    expect((await sceneEnBase(scene)).texte).toHaveLength(10);
    const apres = (await laurent.base.from("versions_precedentes").select("sorte, texte").eq("scene_id", scene).order("cree_le")).data!;
    expect(apres.map((v) => [v.sorte, mots(v.texte as Bloc[])])).toEqual([["avant", "xyz"], ["remplace", "xyz corrigé encore"]]);
  });

  it("F08-AC42 — remettre une version ne change que le texte : qui s'en occupe reste, et personne n'est arrêté", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    await laurent.base.from("scenes").update({ prise_par_eleve: alice.id }).eq("id", scene);
    await ecrireAdulte(laurent, scene, 0, texte("Avant."));
    await ecrireAdulte(laurent, scene, 1, texte("Après."));
    const [v] = await sql<{ id: string }>("select id from versions_precedentes where scene_id = $1", [scene]);
    await laurent.base.rpc("mettre_version_dans_scene", { p_version: v.id });
    const { data } = await laurent.base.from("scenes").select("prise_par_eleve, prise_par_enseignant").eq("id", scene).single();
    expect(data).toEqual({ prise_par_eleve: alice.id, prise_par_enseignant: false });
    const pa = await posteDe(classe.id, alice.inscriptionId);
    expect((await lireScene(pa, scene))?.refus).toBeNull();
    expect(await copies(scene)).toHaveLength(0);
    expect((await martin.base.rpc("mettre_version_dans_scene", { p_version: v.id })).error).not.toBeNull();
  });

  it("F08-AC43, AC17 — réservé à l'adulte : un poste ne lit ni les versions précédentes, ni les textes gardés à part, ni la colonne du texte", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    await ecrireAdulte(laurent, scene, 0, texte("Avant."));
    await ecrireAdulte(laurent, scene, 1, texte("Après."));
    await ecrireAdulte(laurent, scene, 0, texte("Refusé."));
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const base = await pa.base();
    for (const table of ["versions_precedentes", "copies_recuperation", "ecritures"]) {
      const lu = await lire(base, table);
      expect(lu.lignes, table).toHaveLength(0);
      expect(lu.refus, table).toMatch(/42501/);
    }
    expect((await lire(base, "scenes", "id, texte")).refus).toMatch(/42501/);
    expect((await lire(base, "scenes", "id, version, texte_vide")).refus).toBeNull();
    for (const fonction of ["mettre_version_dans_scene", "mettre_copie_dans_scene", "ne_plus_garder", "garder_de_nouveau"]) {
      const cle = fonction.includes("version") ? "p_version" : "p_copie";
      expect((await base.rpc(fonction, { [cle]: randomUUID() })).error, fonction).not.toBeNull();
    }
    expect((await base.rpc("enregistrer_texte", { p_scene: scene, p_version: 2, p_texte: texte("Par le poste.") })).error).not.toBeNull();
    expect((await base.rpc("ecriture_enregistrer", { p_ecriture: randomUUID(), p_jeton_hash: pa.jetonHash, p_version: 2, p_texte: [], p_refus: null })).error).not.toBeNull();
    // L'adulte, lui, les lit ; un autre enseignant ne lit rien
    expect((await lire(laurent.base, "versions_precedentes")).lignes.length).toBeGreaterThan(0);
    expect((await martin.base.from("versions_precedentes").select("id").eq("scene_id", scene)).data).toEqual([]);
    expect((await martin.base.from("copies_recuperation").select("id").eq("scene_id", scene)).data).toEqual([]);
  });
});

describe("Qui lit, qui écrit (F06.1, F06.2, F04.1)", () => {
  it("F06-AC20, AC21, F03-AC17, F07-AC19 — un élève écrit dans la scène préparée de son chapitre, sans consigne ; son camarade la lit ; hors du chapitre, rien", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const pc = await posteDe(classe.id, chloe.inscriptionId);
    const lue = (await lireScene(pa, scene))!;
    expect(lue).toMatchObject({ consigne: "", profil: "propositions", refus: null, vide: true, version: 0 });
    await ecrireEleve(pa, (await ouvrir(pa, scene))!, 0, texte("Alice a écrit trois lignes."));
    expect(mots((await lireScene(pb, scene))!.texte)).toBe("Alice a écrit trois lignes.");
    expect(await lireScene(pc, scene)).toBeNull();
    expect(await ouvrir(pc, scene)).toBeNull();
    // Créer une scène reste réservé au profil « écriture et organisation »
    expect((await (await pa.base()).rpc("eleve_creer_scene", { p_chapitre: r.lisiere })).error).not.toBeNull();

    // Lecture ouverte : Chloé lit le texte, sans consigne, sans pouvoir écrire (F06-AC48)
    await laurent.base.from("scenes").update({ consigne: "Décris la lisière." }).eq("id", scene);
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    const ouverteALaLecture = (await lireScene(pc, scene))!;
    expect(ouverteALaLecture).toMatchObject({ consigne: null, profil: null, refus: "acces" });
    expect(mots(ouverteALaLecture.texte)).toBe("Alice a écrit trois lignes.");
    expect(await ouvrir(pc, scene)).toBeNull();
    expect((await lireScene(pa, scene))!.consigne).toBe("Décris la lisière.");
  });

  it("F06-AC14, AC88 — une scène qui contient du travail ne se supprime pas par un élève ; un texte entièrement effacé ne compte plus", async () => {
    const r = await recit();
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const s64 = await creerScene(await pb.base(), r.lisiere, "eleve_creer_scene");
    const ea = (await ouvrir(pa, s64.id))!;
    await ecrireEleve(pa, ea, 0, texte("Alice a écrit trois lignes."));
    expect((await (await pb.base()).rpc("eleve_supprimer_scene", { p_scene: s64.id })).error).not.toBeNull();
    expect((await sceneEnBase(s64.id)).texte_vide).toBe(false);
    // Un texte gardé à part compte aussi
    await ecrireEleve(pa, ea, 1, texte(""));
    await ecrireAdulte(laurent, s64.id, 0, texte("Une correction refusée."));
    expect((await (await pb.base()).rpc("eleve_supprimer_scene", { p_scene: s64.id })).error).not.toBeNull();
    const [garde] = await copies(s64.id);
    await laurent.base.rpc("ne_plus_garder", { p_copie: garde.id });
    expect((await (await pb.base()).rpc("eleve_supprimer_scene", { p_scene: s64.id })).error).toBeNull();
  });

  it("F06-AC27 — hors des horaires, le poste ne lit le texte d'aucune scène", async () => {
    const autre = await creerClasse(laurent, "CE1");
    const [emma] = await inscrire(laurent, autre.id, ["Emma"]);
    const projet = await creerProjet(laurent, "classe", "choix", "Le lac", autre.id);
    const { chapitreId } = await creerPartie(laurent, projet.id, "La rive", "Le ponton");
    const scene = await creerScene(laurent.base, chapitreId);
    await attribuer(laurent, chapitreId, [{ eleve: emma.id }]);
    await ecrireAdulte(laurent, scene.id, 0, texte("Un texte préparé."));
    const poste = await posteDe(autre.id, emma.inscriptionId);
    expect(mots((await lireScene(poste, scene.id))!.texte)).toBe("Un texte préparé.");
    const hier = ((new Date().getDay() + 6) % 7) || 7;
    await laurent.base.rpc("regler_horaires", { p_classe: autre.id, p_limites: true, p_plages: [{ jours: [hier], de: "00:00", a: "00:01" }] });
    expect(await lireScene(poste, scene.id)).toBeNull();
    await laurent.base.rpc("regler_horaires", { p_classe: autre.id, p_limites: false, p_plages: [] });
  });

  it("F04-AC02, AC03 — la mise en forme des élèves est permise par défaut, et se règle projet par projet", async () => {
    const a = await recit();
    const b = await recit();
    const pa = await posteDe(classe.id, alice.inscriptionId);
    expect((await lireScene(pa, a.s[0].id))!.marques).toBe(true);
    expect((await laurent.base.from("projets").update({ mise_en_forme_eleves: false }).eq("id", a.projet)).error).toBeNull();
    expect((await lireScene(pa, a.s[0].id))!.marques).toBe(false);
    expect((await lireScene(pa, b.s[0].id))!.marques).toBe(true);
    expect((await martin.base.from("projets").update({ mise_en_forme_eleves: false }).eq("id", b.projet).select("id")).data).toEqual([]);
  });

  it("F01-AC01 — l'adulte reste seul responsable : le texte ne s'écrit que par les fonctions, jamais directement, et pas par un autre enseignant", async () => {
    const r = await recit();
    const scene = r.s[0].id;
    expect((await laurent.base.from("scenes").update({ texte: texte("Directement.") }).eq("id", scene)).error?.code).toBe("42501");
    expect((await laurent.base.from("scenes").update({ version: 99 }).eq("id", scene)).error?.code).toBe("42501");
    expect(await ecrireAdulte(martin, scene, 0, texte("Par un autre."))).toMatchObject({ etat: "refuse", motif: "acces" });
    expect((await sceneEnBase(scene)).texte_vide).toBe(true);
    expect((await laurent.base.from("copies_recuperation").insert({ scene_id: scene, projet_id: r.projet, enseignant_id: laurent.id, sorte: "refus", texte: [] })).error).not.toBeNull();
  });

  it("« Texte vide » : ni mot ni image ; une note de l'enseignant ne compte pas, une phrase de choix compte", async () => {
    const vide = async (t: unknown): Promise<boolean> => (await sql<{ v: boolean }>("select prive.texte_est_vide($1::jsonb) as v", [JSON.stringify(t)]))[0].v;
    expect(await vide([])).toBe(true);
    expect(await vide(texte("", "   "))).toBe(true);
    expect(await vide(texte("", "a"))).toBe(false);
    expect(await vide([{ type: "note", id: randomUUID(), children: [{ text: "Penser à l’image." }] }])).toBe(true);
    expect(await vide([{ type: "choix", id: randomUUID(), children: [{ text: "" }] }])).toBe(false);
    expect(await vide([{ type: "image", id: randomUUID(), children: [{ text: "" }] }])).toBe(false);
    expect(await vide([{ type: "p", id: randomUUID(), children: [{ text: "" }, { type: "image-ligne", children: [{ text: "" }] }, { text: "" }] }])).toBe(false);
    expect(await vide([{ type: "note", id: randomUUID(), children: [{ text: "" }, { type: "image-ligne", children: [{ text: "" }] }, { text: "" }] }])).toBe(true);
  });
});
