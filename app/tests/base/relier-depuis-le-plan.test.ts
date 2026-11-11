import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

// Le poste d'un élève se reconnaît à son cookie : ici, celui du poste qu'on fait écrire
let jetonDuPoste: string | null = null;
vi.mock("@/serveur/poste", () => ({ empreinteDuPoste: async () => jetonDuPoste }));

import type { Bloc, ChoixAuto, ChoixPerso, Enregistrement, Texte } from "@/domaine/copie";
import { relierChoix } from "@/serveur/chemins";
import { enregistrerPourAdulte, enregistrerPourEleve } from "@/serveur/copie";

/**
 * Choix en onglets (F03.1, F03-AC67) : relier depuis « Chemins » un choix « Sans destination », contre
 * la vraie base locale. Le choix garde sa phrase et sa place dans le texte, et celui qui écrit la
 * scène n'est pas arrêté : la liaison est une retouche du plan, rejouée comme les autres (F08-AC44).
 */

let laurent: Adulte;
let martin: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  [alice] = await inscrire(laurent, classe.id, ["Alice"]);
});
afterAll(nettoyer);

const p = (texte: string, id: string = randomUUID()): Bloc => ({ type: "p", id, children: [{ text: texte }] });
const choix = (libelle: string, cible: string | null): ChoixAuto => ({
  type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }],
});
/** Le texte en mots : chaque choix avec sa destination, pour lire d'un coup l'ordre et les liaisons. */
const mots = (t: Texte, noms: Record<string, string>): string[] =>
  t.map((b) => (b.type === "choix" && b.auto ? `→ ${b.libelle} : ${b.cible ? noms[b.cible] : "sans destination"}` : b.type === "p" ? b.children.map((l) => ("text" in l ? l.text : "")).join("") : b.type));

/** « Le cercle de pierres », où Alice écrit, et deux scènes du même chapitre ; une scène d'un autre chapitre. */
async function recit(): Promise<{ cercle: SceneEssai; lanterne: SceneEssai; passage: SceneEssai; ailleurs: SceneEssai; noms: Record<string, string> }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "Le marais");
  const cercle = await creerScene(laurent.base, chapitreId);
  const lanterne = await creerScene(laurent.base, chapitreId);
  const passage = await creerScene(laurent.base, chapitreId);
  const ailleurs = await creerScene(laurent.base, await creerChapitre(laurent, partieId, "Le sanctuaire"));
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  return { cercle, lanterne, passage, ailleurs, noms: { [lanterne.id]: "lanterne", [passage.id]: "passage", [ailleurs.id]: "ailleurs" } };
}

const ouvrir = async (poste: PosteEssai, scene: string): Promise<string> => {
  const { data, error } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: scene });
  if (error || !data) throw new Error(`Écriture d'essai : ${error?.message}`);
  return data as string;
};
const ecrire = async (poste: PosteEssai, ecriture: string, version: number, texte: Texte): Promise<Enregistrement> => {
  jetonDuPoste = poste.jetonHash;
  try {
    return await enregistrerPourEleve(ecriture, version, texte);
  } finally {
    jetonDuPoste = null;
  }
};
const enBase = async (scene: string) => (await sql<{ texte: Texte; version: number }>("select texte, version from scenes where id = $1", [scene]))[0];
const gardes = async (scene: string): Promise<number> =>
  Number((await sql<{ n: string }>("select count(*) as n from copies_recuperation where scene_id = $1", [scene]))[0].n);
const liensDe = (scene: string) => sql<{ libelle: string; cible_id: string | null }>("select libelle, cible_id from liens where scene_id = $1 order by rang", [scene]);

describe("Relier un choix « Sans destination » depuis « Chemins » (F03.1, « Choix en onglets »)", () => {
  it("F03-AC67 — « Écouter ce que disent les pierres », sans destination, tiré jusqu'à « La lanterne » : il y mène, sa phrase et sa place dans le texte inchangées, sans nouveau choix ; « Annuler » le rend sans destination", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const [poser, ecouter, compter] = [choix("Poser la clochette au centre", r.passage.id), choix("Écouter ce que disent les pierres", null), choix("Compter les pierres", null)];
    await enregistrerPourAdulte(e, r.cercle.id, 0, [p("Des pierres dressées forment un cercle."), poser, ecouter, compter]);

    expect(await relierChoix(e, r.cercle.id, ecouter.id, r.lanterne.id)).toMatchObject({ ok: true });
    const apres = await enBase(r.cercle.id);
    // Le deuxième choix reste le deuxième : rien ne passe à la fin du texte
    expect(mots(apres.texte, r.noms)).toEqual([
      "Des pierres dressées forment un cercle.", "→ Poser la clochette au centre : passage", "→ Écouter ce que disent les pierres : lanterne", "→ Compter les pierres : sans destination",
    ]);
    expect(apres.texte.map((b) => b.id)).toEqual([apres.texte[0].id, poser.id, ecouter.id, compter.id]);
    expect(apres.version).toBe(2);
    expect((await liensDe(r.cercle.id)).map((l) => l.cible_id)).toEqual([r.passage.id, r.lanterne.id, null]);

    // « Annuler » : il redevient sans destination, à la même place
    expect(await relierChoix(e, r.cercle.id, ecouter.id, null)).toMatchObject({ ok: true });
    expect(mots((await enBase(r.cercle.id)).texte, r.noms)[2]).toBe("→ Écouter ce que disent les pierres : sans destination");
    expect((await liensDe(r.cercle.id)).map((l) => l.cible_id)).toEqual([r.passage.id, null, null]);
    // Une version précédente est gardée, comme pour une correction de l'adulte
    expect((await sql("select 1 from versions_precedentes where scene_id = $1 and de_l_adulte", [r.cercle.id])).length).toBe(1);
  });

  it("F03-AC67 — une phrase écrite à la main : son renvoi sans destination se relie de même, le reste de la phrase intact", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const renvoi = randomUUID();
    const phrase: ChoixPerso = {
      type: "choix", id: randomUUID(), libelle: "Suivre la chouette",
      children: [{ text: "Si tu suis la chouette, va au " }, { type: "renvoi", id: renvoi, cible: null, children: [{ text: "" }] }, { text: "." }],
    };
    await enregistrerPourAdulte(e, r.cercle.id, 0, [p("Une chouette passe."), phrase]);
    expect(await relierChoix(e, r.cercle.id, renvoi, r.lanterne.id)).toMatchObject({ ok: true });
    const bloc = (await enBase(r.cercle.id)).texte[1] as ChoixPerso;
    expect(bloc.children).toEqual([{ text: "Si tu suis la chouette, va au " }, { type: "renvoi", id: renvoi, cible: r.lanterne.id, children: [{ text: "" }] }, { text: "." }]);
    expect((await liensDe(r.cercle.id)).map((l) => l.cible_id)).toEqual([r.lanterne.id]);
  });

  it("F03-AC67, F08-AC44 — Alice écrit « le cercle de pierres » pendant que Mme Laurent relie un de ses choix : son enregistrement suivant réussit, son texte garde la destination, rien n'est gardé à part", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const debut = p("Des pierres dressées forment un cercle.");
    const [ecouter, compter] = [choix("Écouter ce que disent les pierres", null), choix("Compter les pierres", r.passage.id)];
    await enregistrerPourAdulte(e, r.cercle.id, 0, [debut, ecouter, compter]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, r.cercle.id);
    const copie: Texte = [debut, p("Alice écrit."), ecouter, compter];
    expect(await ecrire(poste, ecriture, 1, copie)).toMatchObject({ etat: "enregistre", version: 2 });

    // Depuis « Chemins », sans ouvrir la scène
    expect(await relierChoix(e, r.cercle.id, ecouter.id, r.lanterne.id)).toMatchObject({ ok: true });
    expect((await enBase(r.cercle.id)).version).toBe(3);

    // Alice n'a rien vu : sa copie porte encore le choix sans destination, et elle continue d'écrire
    copie[1] = p("Alice écrit encore.", copie[1].id);
    const fait = await ecrire(poste, ecriture, 2, copie);
    expect(fait).toMatchObject({ etat: "enregistre", version: 4 });
    // La réponse lui donne la liaison, pour que sa copie la montre, et nomme la scène
    expect(fait.etat === "enregistre" && fait.duPlan?.relie).toEqual([{ id: ecouter.id, cible: r.lanterne.id }]);
    expect(fait.etat === "enregistre" && fait.duPlan?.scenes?.map((s) => s.id)).toEqual([r.lanterne.id]);
    expect(mots((await enBase(r.cercle.id)).texte, r.noms)).toEqual([
      "Des pierres dressées forment un cercle.", "Alice écrit encore.", "→ Écouter ce que disent les pierres : lanterne", "→ Compter les pierres : passage",
    ]);
    expect(await gardes(r.cercle.id)).toBe(0);

    // Relié puis annulé avant qu'elle n'enregistre : pour chaque choix, la dernière liaison compte
    await relierChoix(e, r.cercle.id, ecouter.id, null);
    await relierChoix(e, r.cercle.id, ecouter.id, r.passage.id);
    const suite: Texte = [debut, p("Alice écrit toujours.", copie[1].id), { ...ecouter, cible: r.lanterne.id }, compter];
    const apres = await ecrire(poste, ecriture, 4, suite);
    expect(apres).toMatchObject({ etat: "enregistre", version: 7 });
    expect(apres.etat === "enregistre" && apres.duPlan?.relie).toEqual([{ id: ecouter.id, cible: r.passage.id }]);
    expect(mots((await enBase(r.cercle.id)).texte, r.noms)[2]).toBe("→ Écouter ce que disent les pierres : passage");
    expect(await gardes(r.cercle.id)).toBe(0);
  });

  it("F03-AC67, F03-AC57 — hors de ce geste : une scène d'un autre chapitre, un choix qui a déjà sa destination, un autre enseignant, un élève", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const [ecouter, compter] = [choix("Écouter ce que disent les pierres", null), choix("Compter les pierres", r.passage.id)];
    await enregistrerPourAdulte(e, r.cercle.id, 0, [p("Un cercle."), ecouter, compter]);
    // Le schéma ne relie qu'à une scène de son chapitre
    expect((await relierChoix(e, r.cercle.id, ecouter.id, r.ailleurs.id)).ok).toBe(false);
    // Un choix qui mène déjà quelque part se change dans la scène, pas en le tirant
    expect((await relierChoix(e, r.cercle.id, compter.id, r.lanterne.id)).ok).toBe(false);
    // Un choix qui n'est pas dans la scène
    expect((await relierChoix(e, r.cercle.id, randomUUID(), r.lanterne.id)).ok).toBe(false);
    expect((await relierChoix(enseignantDe(martin), r.cercle.id, ecouter.id, r.lanterne.id)).ok).toBe(false);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const { error } = await (await poste.base()).rpc("relier_depuis_le_plan", { p_scene: r.cercle.id, p_renvoi: ecouter.id, p_cible: r.lanterne.id });
    expect(error).not.toBeNull();
    // Rien n'a changé
    expect(await enBase(r.cercle.id)).toMatchObject({ version: 1 });
    expect((await liensDe(r.cercle.id)).map((l) => l.cible_id)).toEqual([null, r.passage.id]);
  });
});
