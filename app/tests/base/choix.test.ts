import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Texte } from "@/domaine/copie";
import { numeroter, type PlanNumerote } from "@/domaine/numeros";
import { assurerOrdre, numerosDuProjet, sansIdentitePrise } from "@/serveur/copie";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, lire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

/**
 * Étape 3 du plan, lot 2 : les chemins du récit se déduisent des textes, l'ordre du livre
 * s'établit une fois puis se garde, un numéro se fixe (F05, F05.2, F11.5), et un poste
 * d'élève ne lit des destinations que ce qu'il a le droit de lire (F05-AC03).
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

const p = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const auto = (libelle: string, cible: string | null, id = randomUUID()) => ({ type: "choix", id, auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });
const renvoi = (cible: string | null, id = randomUUID()) => ({ type: "renvoi", id, cible, children: [{ text: "" }] });
const perso = (libelle: string, ...enfants: unknown[]) => ({ type: "choix", id: randomUUID(), libelle, children: enfants.map((x) => (typeof x === "string" ? { text: x } : x)) });

/** « La lisière » (Alice, Bilal en organisation) et « Le marais » (Chloé), dans un récit à choix. */
async function recit(scenesLisiere = 3) {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId: lisiere } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const marais = await creerChapitre(laurent, partieId, "Le marais");
  const s: SceneEssai[] = [];
  for (let i = 0; i < scenesLisiere; i += 1) s.push(await creerScene(laurent.base, lisiere));
  const m = await creerScene(laurent.base, marais);
  if (s[1]) await laurent.base.from("scenes").update({ titre: "Clairière" }).eq("id", s[1].id);
  await laurent.base.from("scenes").update({ titre: "Le ponton du marais" }).eq("id", m.id);
  await attribuer(laurent, lisiere, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  await attribuer(laurent, marais, [{ eleve: chloe.id }]);
  return { projet: projet.id, partieId, lisiere, marais, s, m };
}
const ecrire = async (scene: string, texte: unknown[]) => {
  const [{ version }] = await sql<{ version: number }>("select version from scenes where id = $1", [scene]);
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: version, p_texte: texte });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(error?.message ?? JSON.stringify(data));
};
const liens = (projet: string) =>
  sql<{ de: number; vers: number | null; libelle: string; cache: boolean }>(
    `select o.reference as de, c.reference as vers, l.libelle, l.cache
     from liens l join scenes o on o.id = l.scene_id left join scenes c on c.id = l.cible_id
     where l.projet_id = $1 order by o.reference, l.rang`,
    [projet],
  );

describe("Les chemins se déduisent des textes (F05, F05.2)", () => {
  it("F05-AC13, AC17, AC09 — une phrase automatique, une phrase à deux renvois, un choix sans destination : chaque renvoi fait un lien, dans l'ordre du texte", async () => {
    const r = await recit();
    await ecrire(r.s[0].id, [
      p("Lou fit un pas, puis un autre."),
      auto("Continuer vers la lumière", r.s[1].id),
      p("Lou hésita."),
      perso("La porte", "Si tu as la clé, va au ", renvoi(r.s[2].id), " ; sinon, va au ", renvoi(r.m.id), "."),
      auto("Faire demi-tour", null),
    ]);
    expect(await liens(r.projet)).toEqual([
      { de: 1, vers: 2, libelle: "Continuer vers la lumière", cache: false },
      { de: 1, vers: 3, libelle: "La porte", cache: false },
      { de: 1, vers: 4, libelle: "La porte", cache: false },
      { de: 1, vers: null, libelle: "Faire demi-tour", cache: false },
    ]);
    // Aucune scène n'a été créée pour le choix sans destination
    expect(await sql("select 1 from scenes where projet_id = $1", [r.projet])).toHaveLength(4);
  });

  it("F05-AC21, AC24, AC25 — changer une destination, retirer un renvoi, supprimer la phrase : les liens suivent le texte, et aucune scène visée n'est supprimée", async () => {
    const r = await recit();
    const choix = auto("Continuer", r.s[1].id);
    const deux = perso("La porte", "Va au ", renvoi(r.s[1].id), " ou au ", renvoi(r.s[2].id), ".");
    await ecrire(r.s[0].id, [choix, deux]);
    await ecrire(r.s[0].id, [{ ...choix, cible: r.s[2].id }, { ...deux, children: deux.children.slice(0, 2).concat([{ text: "." }]) }]);
    expect((await liens(r.projet)).map((l) => [l.de, l.vers])).toEqual([[1, 3], [1, 2]]);
    await ecrire(r.s[0].id, [p("Plus aucun choix.")]);
    expect(await liens(r.projet)).toEqual([]);
    expect(await sql("select 1 from scenes where projet_id = $1 and supprime_le is null", [r.projet])).toHaveLength(4);
  });

  it("F05-AC02 — une scène renommée : ses choix entrants y conduisent toujours, sans doublon ; une destination supprimée n'est redirigée nulle part (F03-AC14)", async () => {
    const r = await recit();
    await ecrire(r.s[0].id, [auto("Faire demi-tour", r.s[1].id)]);
    await laurent.base.from("scenes").update({ titre: "Cour — porte condamnée" }).eq("id", r.s[1].id);
    expect((await liens(r.projet)).map((l) => [l.de, l.vers])).toEqual([[1, 2]]);
    await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: r.s[1].id });
    expect((await liens(r.projet)).map((l) => [l.de, l.vers])).toEqual([[1, 2]]);
    await laurent.base.rpc("restaurer_element", { p_sorte: "scene", p_id: r.s[1].id });
    expect((await liens(r.projet)).map((l) => [l.de, l.vers])).toEqual([[1, 2]]);
  });

  it("un renvoi vers une scène d'un autre projet, ou qui n'existe pas, ne fait pas de lien vers elle", async () => {
    const r = await recit();
    const autre = await recit(1);
    await ecrire(r.s[0].id, [auto("Ailleurs", autre.s[0].id), auto("Nulle part", randomUUID())]);
    expect((await liens(r.projet)).map((l) => l.vers)).toEqual([null, null]);
    expect(await liens(autre.projet)).toEqual([]);
  });

  it("F08-AC26 — les choix d'un texte gardé à part n'entrent dans les chemins qu'une fois ce texte mis dans la scène", async () => {
    const r = await recit();
    await ecrire(r.s[0].id, [p("Le texte d’Alice.")]);
    // Le texte de Bilal, parti d'une version ancienne, porte un choix vers S003
    const refuse = await laurent.base.rpc("enregistrer_texte", { p_scene: r.s[0].id, p_version: 0, p_texte: [p("Le texte de Bilal."), auto("Suivre la lumière", r.s[2].id)] });
    expect((refuse.data as { etat: string }).etat).toBe("garde");
    expect(await liens(r.projet)).toEqual([]);
    const [copie] = await sql<{ id: string }>("select id from copies_recuperation where scene_id = $1", [r.s[0].id]);
    await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: copie.id });
    expect((await liens(r.projet)).map((l) => [l.de, l.vers, l.libelle])).toEqual([[1, 3, "Suivre la lumière"]]);
    // Le second échange les retire : c'est le texte de la scène qui fait foi
    await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: copie.id });
    expect(await liens(r.projet)).toEqual([]);
  });

  it("F05.2 — un même choix ne vit jamais dans deux scènes : revenu dans la scène d'où il avait été coupé, il devient un autre choix, toujours le même d'un enregistrement à l'autre", async () => {
    const r = await recit();
    const choix = auto("Continuer", r.s[2].id);
    await ecrire(r.s[1].id, [choix]);
    // Le même bloc, avec la même identité, revient dans S001
    const texte = [p("Récit."), choix] as unknown as Texte;
    const une = await sansIdentitePrise(laurent.base, r.s[0].id, texte);
    const deux = await sansIdentitePrise(laurent.base, r.s[0].id, texte);
    expect(une[1].id).not.toBe(choix.id);
    expect(une[1].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(une).toEqual(deux);
    expect({ ...une[1], id: choix.id }).toEqual(choix);
    // Dans sa propre scène, il garde son identité
    expect(await sansIdentitePrise(laurent.base, r.s[1].id, [choix] as unknown as Texte)).toEqual([choix]);
  });
});

describe("Ordre du livre et numéros (F11.5)", () => {
  const numeros = async (projet: string) => (await numerosDuProjet(laurent.base, projet))!;
  const ordre = (projet: string) => sql<{ reference: number; rang_livre: number | null }>("select reference, rang_livre from scenes where projet_id = $1 order by reference", [projet]);

  it("F05-AC34, F11-AC16, AC19 — l'ordre s'établit une fois, dès qu'un numéro doit s'afficher, puis se garde ; une scène ajoutée prend la suite", async () => {
    const r = await recit(6);
    expect((await ordre(r.projet)).every((s) => s.rang_livre === null)).toBe(true);
    await ecrire(r.s[0].id, [auto("Continuer", r.s[1].id)]);
    await assurerOrdre(laurent.base, r.projet);
    const etabli = await ordre(r.projet);
    expect(etabli.every((s) => s.rang_livre !== null)).toBe(true);
    const avant = await numeros(r.projet);
    expect(avant.total).toBe(7);
    expect([...avant.de.values()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    // Réexporter sans rien changer : chaque scène garde son numéro, et l'ordre n'est pas retiré
    await assurerOrdre(laurent.base, r.projet);
    expect(await ordre(r.projet)).toEqual(etabli);
    expect((await numeros(r.projet)).de).toEqual(avant.de);

    // Une scène ajoutée : à la suite, les autres gardent leur ordre relatif
    const neuve = await creerScene(laurent.base, r.lisiere);
    const apres = await numeros(r.projet);
    expect(apres.de.get(neuve.id)).toBe(8);
    expect(apres.ordre.filter((x) => x !== neuve.id)).toEqual(avant.ordre);
    // Même créée par un élève du profil « écriture et organisation »
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const deBilal = await creerScene(await pb.base(), r.lisiere, "eleve_creer_scene");
    expect((await numeros(r.projet)).de.get(deBilal.id)).toBe(9);
  });

  it("F11-AC18, AC20 — le départ porte le n° 1 ; une scène exclue ne laisse pas de trou ; un autre enseignant n'établit rien", async () => {
    const r = await recit(4);
    await assurerOrdre(laurent.base, r.projet);
    await laurent.base.from("projets").update({ depart_scene_id: r.s[2].id }).eq("id", r.projet);
    expect((await numeros(r.projet)).de.get(r.s[2].id)).toBe(1);
    await laurent.base.from("scenes").update({ hors_livre: true }).eq("id", r.s[0].id);
    const n = await numeros(r.projet);
    expect(n.total).toBe(4);
    expect([...n.de.values()].sort()).toEqual([1, 2, 3, 4]);
    expect(n.de.has(r.s[0].id)).toBe(false);

    const autre = await recit(2);
    expect((await martin.base.rpc("etablir_ordre", { p_projet: autre.projet, p_rangs: {} })).data).toBe(false);
    expect((await ordre(autre.projet)).every((s) => s.rang_livre === null)).toBe(true);
    // Un récit classique n'a ni mélange ni numéros
    const classique = await creerProjet(laurent, "classe", "classique", "Le phare", classe.id);
    expect((await laurent.base.rpc("etablir_ordre", { p_projet: classique.id, p_rangs: {} })).data).toBe(false);
    expect(await numerosDuProjet(laurent.base, classique.id)).toBeNull();
  });

  it("F11-AC96, AC97, F05-AC36 — fixer un numéro : il prime sur l'ordre ; déjà fixé ailleurs, il est refusé et la scène est nommée ; libéré, le passage prend la suite ; le départ ne se fixe pas", async () => {
    const r = await recit(4);
    await assurerOrdre(laurent.base, r.projet);
    await laurent.base.from("projets").update({ depart_scene_id: r.s[0].id }).eq("id", r.projet);
    const fixer = async (scene: string, n: number) => (await laurent.base.rpc("fixer_numero", { p_scene: scene, p_numero: n })).data as { fixe: boolean; prise?: { reference: number; titre: string | null } };

    expect(await fixer(r.s[1].id, 4)).toEqual({ fixe: true });
    expect((await numeros(r.projet)).de.get(r.s[1].id)).toBe(4);
    // Un numéro plus grand que le livre est accepté : le livre grandit encore
    expect(await fixer(r.s[2].id, 100)).toEqual({ fixe: true });
    expect((await numeros(r.projet)).de.get(r.s[2].id)).toBe(100);
    // Déjà fixé pour S002 : refusé, S002 est nommée
    expect(await fixer(r.s[3].id, 4)).toEqual({ fixe: false, prise: { id: r.s[1].id, reference: 2, titre: "Clairière" } });
    // Le n° 1 est au départ
    expect((await fixer(r.s[3].id, 1)).prise?.reference).toBe(1);
    expect((await laurent.base.rpc("fixer_numero", { p_scene: r.s[0].id, p_numero: 7 })).error?.message).toMatch(/toujours le n° 1/);
    expect((await martin.base.rpc("fixer_numero", { p_scene: r.s[3].id, p_numero: 9 })).error).not.toBeNull();

    // Libérer : le repère disparaît, le passage prend place à la suite de son groupe
    expect((await laurent.base.rpc("liberer_numero", { p_scene: r.s[1].id })).error).toBeNull();
    const n = await numeros(r.projet);
    expect((await sql<{ numero_fixe: number | null }>("select numero_fixe from scenes where id = $1", [r.s[1].id]))[0].numero_fixe).toBeNull();
    expect(n.ordre[n.ordre.length - 1]).toBe(r.s[1].id);
    expect((await laurent.base.rpc("liberer_numero", { p_scene: r.s[1].id })).error).not.toBeNull();
  });
});

describe("Ce qu'un poste d'élève lit des choix (F05.2, F05-AC03)", () => {
  const lireDestinations = async (poste: PosteEssai, scene: string) =>
    (await (await poste.base()).rpc("destinations_de_la_scene", { p_scene: scene })).data as
      { renvoi_id: string; cible_id: string; lisible: boolean; reference: number | null; titre: string | null; chapitre: string }[];

  it("F05-AC42 — l'élève lit le numéro de la destination et son lieu ; hors de son chapitre, « autre chapitre » et son titre public, sans titre ni référence de scène", async () => {
    const r = await recit();
    await ecrire(r.s[0].id, [auto("Continuer vers la lumière", r.s[1].id), auto("Descendre au marais", r.m.id)]);
    await assurerOrdre(laurent.base, r.projet);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const destinations = await lireDestinations(pa, r.s[0].id);
    expect(destinations.map((d) => [d.lisible, d.reference, d.titre, d.chapitre])).toEqual([
      [true, 2, "Clairière", "La lisière"],
      [false, null, null, "Le marais"],
    ]);
    expect(JSON.stringify(destinations)).not.toContain("ponton");

    // Les numéros : la structure du plan, sans aucun titre ni texte ; les mêmes que ceux de l'adulte
    const { data } = await (await pa.base()).rpc("numerotation_du_projet", { p_projet: r.projet });
    expect(JSON.stringify(data)).not.toMatch(/Clairière|ponton|lisière|marais/i);
    const lu = data as { depart: string | null; parties: { id: string; groupe: boolean; ouverture: string | null; chapitres: { hors: boolean; scenes: { id: string; hors: boolean; rang: number | null; fixe: number | null }[] }[] }[] };
    const plan: PlanNumerote = {
      departSceneId: lu.depart,
      parties: lu.parties.map((x) => ({
        id: x.id, groupeAvecPrecedente: x.groupe, ouvertureSceneId: x.ouverture,
        chapitres: x.chapitres.map((c) => ({ horsLivre: c.hors, scenes: c.scenes.map((s) => ({ id: s.id, horsLivre: s.hors, rangLivre: s.rang, numeroFixe: s.fixe })) })),
      })),
    };
    expect(numeroter(plan).de).toEqual((await numerosDuProjet(laurent.base, r.projet))!.de);

    // Un poste d'une autre classe n'en lit rien ; la table des liens ne se lit pas directement
    const ailleurs = await creerClasse(laurent, "CE2");
    const [dylan] = await inscrire(laurent, ailleurs.id, ["Dylan"]);
    const pd = await posteDe(ailleurs.id, dylan.inscriptionId);
    expect((await (await pd.base()).rpc("numerotation_du_projet", { p_projet: r.projet })).data).toBeNull();
    expect(await lireDestinations(pd, r.s[0].id)).toEqual([]);
    expect((await lire(await pa.base(), "liens")).refus).toMatch(/42501/);
    expect((await martin.base.from("liens").select("renvoi_id").eq("projet_id", r.projet)).data).toEqual([]);
  });

  it("F05-AC47 — destinations d'un choix : seules les scènes du chapitre où il écrit, même quand la lecture de l'histoire est ouverte", async () => {
    const r = await recit();
    await ecrire(r.m.id, [p("L’eau noire clapotait contre la berge.")]);
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    const pb = await posteDe(classe.id, bilal.inscriptionId);
    const base = await pb.base();
    const duChapitre = (await base.rpc("destinations_du_chapitre", { p_chapitre: r.lisiere })).data as { reference: number }[];
    expect(duChapitre.map((s) => s.reference)).toEqual([1, 2, 3]);
    // Le marais se lit, mais ses scènes ne sont pas des destinations qu'il peut choisir
    expect((await base.rpc("destinations_du_chapitre", { p_chapitre: r.marais })).data).toEqual([]);
  });

  it("F03-AC18 — les liens du chapitre, pour la vue « Chemins » de l'élève : hors du chapitre, le seul titre du chapitre d'arrivée", async () => {
    const r = await recit();
    await ecrire(r.s[0].id, [auto("Continuer", r.s[1].id), auto("Descendre au marais", r.m.id), auto("Plus tard", null)]);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const { data } = await (await pa.base()).rpc("liens_du_chapitre", { p_chapitre: r.lisiere });
    expect((data as { cible_id: string | null; libelle: string; chapitre_cible: string | null; manque: string | null }[]).map((l) => [l.cible_id, l.libelle, l.chapitre_cible, l.manque])).toEqual([
      [r.s[1].id, "Continuer", null, null],
      [null, "Descendre au marais", "Le marais", null],
      [null, "Plus tard", null, "sans"],
    ]);
    // Chloé, qui n'a pas ce chapitre, n'en lit pas les chemins
    const pc = await posteDe(classe.id, chloe.inscriptionId);
    expect((await (await pc.base()).rpc("liens_du_chapitre", { p_chapitre: r.lisiere })).data).toEqual([]);
  });

  it("F05-AC48, AC03 — la recherche de l'élève : ses chapitres par le titre, le texte ou la consigne ; la lecture ouverte y ajoute les autres, jamais par leur consigne ; une note de l'enseignant n'y est pas", async () => {
    const r = await recit();
    await laurent.base.from("scenes").update({ titre: "Souche creuse — la lanterne de secours" }).eq("id", r.s[0].id);
    await ecrire(r.s[1].id, [p("Une lanterne brille au loin."), { type: "note", id: randomUUID(), children: [{ text: "Solution : la lanterne rouge." }] }]);
    await laurent.base.from("scenes").update({ consigne: "Décris la lanterne du passeur." }).eq("id", r.s[2].id);
    await ecrire(r.m.id, [p("Au marais, une lanterne s’éteint.")]);
    await laurent.base.from("scenes").update({ consigne: "Parle de la lanterne noyée." }).eq("id", r.m.id);
    const pa = await posteDe(classe.id, alice.inscriptionId);
    const chercher = async (poste: PosteEssai) =>
      ((await (await poste.base()).rpc("scenes_a_chercher")).data as { id: string; reference: number; chapitre: string; consigne: string | null; mots: string }[]).filter((s) =>
        r.s.some((x) => x.id === s.id) || s.id === r.m.id,
      );

    // Lecture fermée : rien du marais, pas même un titre de scène
    let lues = await chercher(pa);
    expect(lues.map((s) => s.reference)).toEqual([1, 2, 3]);
    expect(JSON.stringify(lues)).not.toMatch(/marais|ponton|noyée/i);
    expect(lues[1].mots).toContain("Une lanterne brille au loin.");
    expect(JSON.stringify(lues)).not.toContain("Solution");
    expect(lues[2].consigne).toBe("Décris la lanterne du passeur.");

    // Lecture ouverte : le texte du marais se trouve, sa consigne non
    await laurent.base.from("projets").update({ lecture_ouverte: true }).eq("id", r.projet);
    lues = await chercher(pa);
    expect(lues.map((s) => s.reference)).toEqual([1, 2, 3, 4]);
    expect(lues[3]).toMatchObject({ chapitre: "Le marais", consigne: null });
    expect(lues[3].mots).toContain("une lanterne s’éteint");
    expect(JSON.stringify(lues)).not.toContain("noyée");
  });
});
