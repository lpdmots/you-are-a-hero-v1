import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { compterMots } from "@/domaine/correction";
import { correction } from "@/serveur/ia/aides/correction";
import { demanderDesPistes, demanderUneCorrection, garderUneCorrection, remplacerSiInchange } from "@/serveur/correction";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, sql,
  type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * Étape 8, lot 2 : la correction d'une scène (F13.1), contre la vraie base locale, le
 * fournisseur simulé (IA_SIMULEE). Le serveur relit lui-même le texte ; rien ne s'applique
 * sans l'adulte ; un texte changé pendant la demande ne reçoit rien ; l'état, les choix et la
 * remise de l'élève restent.
 */

let laurent: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  classe = await creerClasse(laurent);
  [alice] = await inscrire(laurent, classe.id, ["Alice"]);
});
afterAll(nettoyer);
afterEach(async () => {
  vi.restoreAllMocks();
  await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
});

const DRAGON = "Le dragon dormé dans la grote. Il était très très grand.";
type Ligne = { etat: string; version: number; texte: { id: string; type: string; children: { text: string }[] }[]; prise_par_eleve: string | null };
const ligne = async (id: string): Promise<Ligne> => (await sql<Ligne>("select etat, version, texte, prise_par_eleve from public.scenes where id = $1", [id]))[0];
const mots = (l: Ligne) => l.texte.filter((b) => b.type === "p").map((b) => b.children.map((c) => c.text).join(""));

/** S015 de « La lisière », dont Alice s'occupe, avec un paragraphe, un choix vers S018, une note et une action de jeu. */
async function scene(organisation: "classe" | "personnel" = "classe") {
  const projet = await creerProjet(laurent, organisation, "choix", "Les passeurs de brume", organisation === "classe" ? classe.id : null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  if (organisation === "classe") await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  const s015 = await creerScene(laurent.base, chapitreId);
  const s018 = await creerScene(laurent.base, chapitreId);
  if (organisation === "classe") await laurent.base.from("scenes").update({ prise_par_eleve: alice.id }).eq("id", s015.id);
  await laurent.base.from("scenes").update({ consigne: "Lou découvre le dragon endormi." }).eq("id", s015.id);
  const p = randomUUID();
  const texte = [
    { type: "p", id: p, children: [{ text: DRAGON }] },
    { type: "choix", id: randomUUID(), auto: true, libelle: "Entrer dans la grote", construction: "neutre", cible: s018.id, children: [{ text: "" }] },
    { type: "note", id: randomUUID(), children: [{ text: "Alice a oublié la grote." }] },
    { type: "action", id: randomUUID(), children: [{ text: "Note la clé sur ta feuile." }] },
  ];
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: s015.id, p_version: (await ligne(s015.id)).version, p_texte: texte });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(`Texte d'essai : ${error?.message ?? JSON.stringify(data)}`);
  return { projet: projet.id, s015: s015.id, s018: s018.id, paragraphe: p };
}

describe("Demander une correction (F13.1)", () => {
  it("F13-AC02 — la proposition arrive sans rien changer au texte ; seuls les paragraphes de récit partent", async () => {
    const { s015, paragraphe } = await scene();
    // Le fournisseur simulé ne lit pas le message : on le recompose d'après ce que l'aide a reçu
    const simuler = vi.spyOn(correction, "simuler");
    const avant = await ligne(s015);
    const r = await demanderUneCorrection(enseignantDe(laurent), s015, avant.version, 1, null);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.propositions).toEqual([{ id: paragraphe, avant: DRAGON, apres: "Le dragon dormait dans la grotte. Il était très très grand." }]);
    // Ni la note, ni le choix, ni l'action de jeu, ni le prénom de l'élève, ni le nom de l'adulte ne partent (F13)
    const envoye = simuler.mock.calls.map(([e]) => `${correction.systeme(e)}\n${correction.message(e)}`).join("\n");
    expect(envoye).toContain("dormé dans la grote");
    for (const absent of ["Alice", "Laurent", "feuile", "Entrer dans"]) expect(envoye).not.toContain(absent);
    expect(await ligne(s015)).toEqual(avant);
  });

  it("un texte changé avant la demande ne reçoit rien : « Le texte a changé depuis la demande. Redemander ? »", async () => {
    const { s015 } = await scene();
    const lue = (await ligne(s015)).version;
    await sql("update public.scenes set version = version + 1 where id = $1", [s015]);
    const r = await demanderUneCorrection(enseignantDe(laurent), s015, lue, 2, null);
    expect(r).toEqual({ ok: false, change: true, message: MESSAGES_IA.texteChange });
  });

  it("un texte changé pendant la demande, par un élève qui écrit, ne reçoit rien non plus", async () => {
    const { s015 } = await scene();
    const lue = (await ligne(s015)).version;
    const simuler = correction.simuler;
    // Pendant que l'aide « réfléchit », la scène change : l'écriture se fait d'un seul tenant, avant la réponse
    vi.spyOn(correction, "simuler").mockImplementation((e) => {
      execFileSync("docker", ["exec", "supabase_db_you-are-a-hero", "psql", "-U", "postgres", "-qc", `update public.scenes set version = version + 1 where id = '${s015}'`]);
      return simuler(e);
    });
    const r = await demanderUneCorrection(enseignantDe(laurent), s015, lue, 2, null);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.change).toBe(true);
  });

  it("une sélection sans paragraphe de récit ne demande rien", async () => {
    const { s015 } = await scene();
    const l = await ligne(s015);
    const r = await demanderUneCorrection(enseignantDe(laurent), s015, l.version, 1, [l.texte[1].id]);
    expect(r).toEqual({ ok: false, message: "La sélection ne touche aucun paragraphe de récit." });
  });

  it("les aides éteintes ne demandent rien", async () => {
    const { s015 } = await scene();
    const e = { ...enseignantDe(laurent), reglagesIa: { ...enseignantDe(laurent).reglagesIa, proposer: false } };
    const r = await demanderUneCorrection(e, s015, (await ligne(s015)).version, 2, null);
    expect(r.ok).toBe(false);
  });
});

describe("Garder une correction (F13.1)", () => {
  it("F13-AC03 — les changements gardés, le choix mène toujours à S018, rien n'est validé ni ajouté", async () => {
    const { projet, s015, s018 } = await scene();
    const e = enseignantDe(laurent);
    const avant = await ligne(s015);
    const scenesAvant = await sql("select id from public.scenes where projet_id = $1 order by id", [projet]);
    const r = await demanderUneCorrection(e, s015, avant.version, 1, null);
    if (!r.ok) throw new Error("correction attendue");
    // « dormé » → « dormait » refusé, « grote » → « grotte » gardé
    const fait = await garderUneCorrection(e, s015, r.version, r.propositions, [0]);
    expect(fait.ok).toBe(true);
    const apres = await ligne(s015);
    expect(mots(apres)).toEqual(["Le dragon dormé dans la grotte. Il était très très grand."]);
    expect(apres.etat).toBe(avant.etat);
    expect(apres.prise_par_eleve).toBe(alice.id);
    expect(apres.texte.slice(1)).toEqual(avant.texte.slice(1));
    expect(await sql("select cible_id from public.liens where scene_id = $1", [s015])).toEqual([{ cible_id: s018 }]);
    expect(await sql("select id from public.scenes where projet_id = $1 order by id", [projet])).toEqual(scenesAvant);
  });

  it("F13-AC04 — la remise de l'élève reste consultable dans sa forme d'avant la correction", async () => {
    const { s015 } = await scene();
    await sql(
      `with s as (update public.scenes set etat = 'valider', tour = tour + 1 where id = $1 returning id, projet_id, enseignant_id, texte)
       insert into public.remises (scene_id, projet_id, enseignant_id, eleve_id, texte) select id, projet_id, enseignant_id, $2, texte from s`,
      [s015, alice.id],
    );
    const e = enseignantDe(laurent);
    const r = await demanderUneCorrection(e, s015, (await ligne(s015)).version, 2, null);
    if (!r.ok) throw new Error("correction attendue");
    expect((await garderUneCorrection(e, s015, r.version, r.propositions, [])).ok).toBe(true);
    const [remise] = await sql<{ texte: Ligne["texte"] }>("select texte from public.remises where scene_id = $1", [s015]);
    expect(remise.texte[0].children[0].text).toBe(DRAGON);
    expect((await ligne(s015)).etat).toBe("valider");
  });

  it("aux degrés 4 et 5, la proposition retouchée par l'adulte est ce qui entre dans la scène", async () => {
    const { s015 } = await scene();
    const e = enseignantDe(laurent);
    const r = await demanderUneCorrection(e, s015, (await ligne(s015)).version, 4, null);
    if (!r.ok) throw new Error("correction attendue");
    const retouchee = r.propositions.map((p) => ({ ...p, apres: "Le dragon dormait au fond de la grotte, immense." }));
    expect((await garderUneCorrection(e, s015, r.version, retouchee, [])).ok).toBe(true);
    expect(mots(await ligne(s015))).toEqual(["Le dragon dormait au fond de la grotte, immense."]);
  });

  it("F10-AC44 — les noms des personnages, leurs autres noms et ceux des objets partent comme noms propres, que la correction ne touche pas", async () => {
    const { projet, s015 } = await scene();
    await laurent.base.from("personnages").insert([
      { projet_id: projet, enseignant_id: laurent.id, nom: "Lou", autres_noms: ["le garçon"], heros: true, rang: 0 },
      { projet_id: projet, enseignant_id: laurent.id, nom: "Maël", autres_noms: ["le passeur"], heros: false, rang: 1 },
    ]);
    await laurent.base.from("objets").insert({ projet_id: projet, enseignant_id: laurent.id, nom: "la clé d’argent" });
    const simuler = vi.spyOn(correction, "simuler");
    await demanderUneCorrection(enseignantDe(laurent), s015, (await ligne(s015)).version, 1, null);
    expect(simuler.mock.calls[0][0].nomsPropres).toEqual(["Lou", "le garçon", "Maël", "le passeur", "la clé d’argent"]);
  });

  it("F13-AC21 — aux degrés 4 et 5, la longueur demandée part chez l'aide, comptée sur le texte que le serveur relit ; aux degrés 1 à 3, jamais", async () => {
    const { s015 } = await scene();
    const e = enseignantDe(laurent);
    const simuler = vi.spyOn(correction, "simuler");
    const v = (await ligne(s015)).version;
    const r = await demanderUneCorrection(e, s015, v, 4, null, { facteur: 2 });
    if (!r.ok) throw new Error("correction attendue");
    expect(simuler.mock.calls[0][0].cible).toBe(22);
    expect(compterMots(r.propositions[0].apres)).toBeGreaterThanOrEqual(22);
    await demanderUneCorrection(e, s015, v, 5, null, { mots: 300 });
    expect(simuler.mock.calls[1][0].cible).toBe(300);
    await demanderUneCorrection(e, s015, v, 2, null, { facteur: 2 });
    expect(simuler.mock.calls[2][0].cible).toBeNull();
  });

  it("le texte a changé entre la proposition et « Garder » : rien ne s'applique, rien n'est gardé à part", async () => {
    const { s015 } = await scene();
    const e = enseignantDe(laurent);
    const r = await demanderUneCorrection(e, s015, (await ligne(s015)).version, 2, null);
    if (!r.ok) throw new Error("correction attendue");
    await sql("update public.scenes set version = version + 1 where id = $1", [s015]);
    expect(await garderUneCorrection(e, s015, r.version, r.propositions, [])).toEqual({ ok: false, change: true, message: MESSAGES_IA.texteChange });
    expect(mots(await ligne(s015))).toEqual([DRAGON]);
    expect(await sql("select id from public.copies_recuperation where scene_id = $1", [s015])).toEqual([]);
  });

  it("« Annuler » rend le texte d'avant ; après une autre écriture, il n'annule rien", async () => {
    const { s015 } = await scene();
    const e = enseignantDe(laurent);
    const avant = await ligne(s015);
    const r = await demanderUneCorrection(e, s015, avant.version, 1, null);
    if (!r.ok) throw new Error("correction attendue");
    const fait = await garderUneCorrection(e, s015, r.version, r.propositions, []);
    if (!fait.ok) throw new Error("correction gardée attendue");
    expect((await remplacerSiInchange(e, s015, fait.scene.version, r.texte)).ok).toBe(true);
    expect(mots(await ligne(s015))).toEqual([DRAGON]);
    const tard = await remplacerSiInchange(e, s015, fait.scene.version, r.texte);
    expect(tard).toMatchObject({ ok: false, change: true });
  });
});

describe("« Proposer des pistes » (F13.1, F07.3)", () => {
  it("des pistes, une par ligne, comme l'élève les lira dans la remarque", async () => {
    const { s015 } = await scene();
    const r = await demanderDesPistes(enseignantDe(laurent), s015);
    expect(r).toEqual({ ok: true, remarque: "– Dis ce que tu vois en arrivant.\n– Montre ce que ressent ton héros.", reste: null });
  });

  it("en mode personnel, pas de pistes : personne ne reprend la scène", async () => {
    const { s015 } = await scene("personnel");
    expect((await demanderDesPistes(enseignantDe(laurent), s015)).ok).toBe(false);
  });
});
