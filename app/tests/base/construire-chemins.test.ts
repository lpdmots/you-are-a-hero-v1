import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cheminsDuPlan } from "@/domaine/chemins";
import type { Bloc, Texte } from "@/domaine/copie";
import { chapitresDe, fautConfirmer, travailDans } from "@/domaine/recit";
import { ajouterAuPlan, ajouterSceneApres, annulerAjout, remettreChoix, retirerChoix } from "@/serveur/chemins";
import { enregistrerPourAdulte } from "@/serveur/copie";
import { planDe } from "@/serveur/recit";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type SceneEssai,
} from "./outils";

/**
 * Construire dans « Chemins », lot 2 : les gestes à la main (F03.1, F03-AC52 à AC57), contre la
 * vraie base locale — ce que chaque geste écrit dans le projet, et ce qu'il refuse.
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

const p = (texte: string): Bloc => ({ type: "p", id: randomUUID(), children: [{ text: texte }] });
const mots = (t: Texte): string[] => t.map((b) => (b.type === "choix" ? `→ ${b.libelle}` : b.type === "p" ? b.children.map((l) => ("text" in l ? l.text : "")).join("") : b.type));

/** « La forêt » : « Clairière » et « Le vieux pont », deux scènes titrées ; « Le sanctuaire », un autre chapitre. */
async function recit(): Promise<{ projet: string; foret: string; sanctuaire: string; clairiere: SceneEssai; pont: SceneEssai; autel: SceneEssai }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La forêt");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const clairiere = await creerScene(laurent.base, chapitreId);
  const pont = await creerScene(laurent.base, chapitreId);
  const autel = await creerScene(laurent.base, sanctuaire);
  await laurent.base.from("scenes").update({ titre: "Clairière" }).eq("id", clairiere.id);
  await laurent.base.from("scenes").update({ titre: "Le vieux pont" }).eq("id", pont.id);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  return { projet: projet.id, foret: chapitreId, sanctuaire, clairiere, pont, autel };
}

const scene = async (id: string) =>
  (await sql<{ titre: string | null; consigne: string; texte: Texte; texte_vide: boolean; version: number; rang: number; prise_par_eleve: string | null; prise_par_enseignant: boolean; supprime_le: string | null; chapitre_id: string }>(
    "select titre, consigne, texte, texte_vide, version, rang, prise_par_eleve, prise_par_enseignant, supprime_le, chapitre_id from scenes where id = $1", [id],
  ))[0];
const nombreDeScenes = async (projet: string): Promise<number> => Number((await sql<{ n: string }>("select count(*) as n from scenes where projet_id = $1", [projet]))[0].n);
const chemins = async (r: { projet: string; foret: string }) => cheminsDuPlan(await planDe(enseignantDe(laurent), r.projet), r.foret, r.projet);

describe("Construire dans « Chemins » (F03.1)", () => {
  it("F03-AC52 — « + » sous « Clairière », « Suivre le ruisseau » puis « Le ruisseau » : la scène existe à la fin du chapitre, sans texte, consigne ni élève ; le choix est à la fin du texte de « Clairière » et mène à elle ; sa flèche est dessinée", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    await enregistrerPourAdulte(e, r.clairiere.id, 0, [p("Le héros entre dans la clairière.")]);
    const fait = await ajouterSceneApres(e, r.foret, r.clairiere.id, "Suivre le ruisseau", "Le ruisseau");
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    const ruisseau = await scene(fait.scenes[0].id);
    expect(ruisseau).toMatchObject({ titre: "Le ruisseau", consigne: "", texte_vide: true, prise_par_eleve: null, prise_par_enseignant: false, chapitre_id: r.foret });
    // À la fin du chapitre : après « Clairière » et « Le vieux pont »
    expect(ruisseau.rang).toBe(2);
    expect(fait.scenes[0].titre).toBe("Le ruisseau");
    expect(mots((await scene(r.clairiere.id)).texte)).toEqual(["Le héros entre dans la clairière.", "→ Suivre le ruisseau"]);
    // La flèche du schéma : le choix part de « Clairière » et arrive à « Le ruisseau »
    const c = await chemins(r);
    expect(c.liens).toEqual([expect.objectContaining({ id: fait.choix[0].id, de: r.clairiere.id, vers: fait.scenes[0].id, libelle: "Suivre le ruisseau", cache: false })]);
    expect(c.noeuds.map((n) => n.titre)).toEqual(["Clairière", "Le vieux pont", "Le ruisseau"]);

    // Sans titre donné, la scène prend celui du choix, comme une scène créée depuis la copie (F05-AC12)
    const sansTitre = await ajouterSceneApres(e, r.foret, r.clairiere.id, "  Grimper à   l’arbre ", "");
    expect(sansTitre.ok && (await scene(sansTitre.scenes[0].id)).titre).toBe("Grimper à l’arbre");
    // Un choix sans libellé ne se pose pas, et rien n'est créé
    const avant = await nombreDeScenes(r.projet);
    expect(await ajouterSceneApres(e, r.foret, r.clairiere.id, "   ", "Sans choix")).toMatchObject({ ok: false, dit: "Écrivez ce que fait le lecteur." });
    expect(await nombreDeScenes(r.projet)).toBe(avant);
  });

  it("F03-AC53 — un lien tiré de « Le ruisseau » vers « Le vieux pont », « Traverser » : le choix est à la fin du texte de « Le ruisseau » et mène au pont ; aucune scène n'est créée", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const ruisseau = await ajouterSceneApres(e, r.foret, r.clairiere.id, "Suivre le ruisseau", "Le ruisseau");
    if (!ruisseau.ok) throw new Error("Le ruisseau n'a pas été créé.");
    const avant = await nombreDeScenes(r.projet);
    const fait = await ajouterAuPlan(e, r.foret, [], [{ de: ruisseau.scenes[0].id, vers: r.pont.id, libelle: "Traverser" }]);
    expect(fait).toMatchObject({ ok: true, scenes: [] });
    expect(await nombreDeScenes(r.projet)).toBe(avant);
    // Une scène que personne n'a ouverte garde sa ligne où écrire, au-dessus du choix
    const texte = (await scene(ruisseau.scenes[0].id)).texte;
    expect(texte.map((b) => b.type)).toEqual(["p", "choix"]);
    expect(texte[1]).toMatchObject({ libelle: "Traverser", cible: r.pont.id, auto: true });
    const fleches = (await chemins(r)).liens.map((l) => `${l.libelle} > ${l.vers}`).sort();
    expect(fleches).toEqual([`Suivre le ruisseau > ${ruisseau.scenes[0].id}`, `Traverser > ${r.pont.id}`]);
  });

  it("F03-AC53 — hors du chapitre, rien : une scène d'un autre chapitre, une scène supprimée ou inconnue font refuser le geste entier, sans scène créée ni choix posé", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const avant = await nombreDeScenes(r.projet);
    // Vers un autre chapitre : cela se règle dans la copie (F03.1)
    expect((await ajouterAuPlan(e, r.foret, [], [{ de: r.clairiere.id, vers: r.autel.id, libelle: "Entrer dans le sanctuaire" }])).ok).toBe(false);
    // D'un seul tenant : la scène demandée avec un choix impossible n'est pas créée
    const mixte = await ajouterAuPlan(e, r.foret, [{ cle: "a", titre: "La grotte" }], [{ de: r.clairiere.id, vers: "a", libelle: "Entrer" }, { de: "a", vers: randomUUID(), libelle: "Ressortir" }]);
    expect(mixte.ok).toBe(false);
    await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: r.pont.id });
    expect((await ajouterAuPlan(e, r.foret, [], [{ de: r.clairiere.id, vers: r.pont.id, libelle: "Traverser" }])).ok).toBe(false);
    expect(await nombreDeScenes(r.projet)).toBe(avant);
    expect((await scene(r.clairiere.id)).version).toBe(0);
  });

  it("F03-AC52 — plusieurs scènes et leurs choix d'un seul tenant, comme le fera un bloc de scènes : une nouvelle scène peut mener à une autre, et à une scène du chapitre", async () => {
    const r = await recit();
    const fait = await ajouterAuPlan(
      enseignantDe(laurent), r.foret,
      [{ cle: "a", titre: "Le sentier", consigne: "Décris le sentier.", verification: ["Le bruit des pas", ""] }, { cle: "b", titre: "La grotte" }],
      [{ de: r.clairiere.id, vers: "a", libelle: "Prendre le sentier" }, { de: r.clairiere.id, vers: "b", libelle: "Entrer dans la grotte" }, { de: "a", vers: "b", libelle: "Descendre" }, { de: "b", vers: r.pont.id, libelle: "Ressortir" }],
    );
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    const [a, b] = fait.scenes;
    expect(await sql("select consigne, verification from scenes where id = $1", [a.id])).toEqual([{ consigne: "Décris le sentier.", verification: ["Le bruit des pas"] }]);
    expect(mots((await scene(r.clairiere.id)).texte).slice(-2)).toEqual(["→ Prendre le sentier", "→ Entrer dans la grotte"]);
    const trajets = (await chemins(r)).liens.map((l) => `${l.de}>${l.vers}`).sort();
    expect(trajets).toEqual([`${r.clairiere.id}>${a.id}`, `${r.clairiere.id}>${b.id}`, `${a.id}>${b.id}`, `${b.id}>${r.pont.id}`].sort());
    // « Annuler » : les choix quittent « Clairière », les deux scènes rejoignent la corbeille
    expect((await annulerAjout(enseignantDe(laurent), fait.choix, fait.scenes.map((s) => s.id))).ok).toBe(true);
    expect(mots((await scene(r.clairiere.id)).texte).filter((m) => m.startsWith("→"))).toEqual([]);
    const plan = await planDe(enseignantDe(laurent), r.projet);
    expect(chapitresDe(plan).find((c) => c.id === r.foret)!.scenes.map((s) => s.titre)).toEqual(["Clairière", "Le vieux pont"]);
    expect(plan.corbeille.filter((x) => x.sorte === "scene").map((x) => x.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("F03-AC55 — le titre et la consigne changés depuis le panneau sont enregistrés, la carte porte le nouveau titre ; le texte de la scène n'est pas touché", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    await enregistrerPourAdulte(e, r.pont.id, 0, [p("Le pont grince.")]);
    const avant = await scene(r.pont.id);
    // Ce que fait l'action du panneau (reglerScene) : le titre et la consigne, rien d'autre
    const { error } = await laurent.base.from("scenes").update({ titre: "Le pont de lianes", consigne: "Décris le pont." }).eq("id", r.pont.id);
    expect(error).toBeNull();
    const carte = (await chemins(r)).noeuds.find((n) => n.id === r.pont.id);
    expect(carte).toMatchObject({ titre: "Le pont de lianes", consigne: "Décris le pont." });
    const apres = await scene(r.pont.id);
    expect(apres.version).toBe(avant.version);
    expect(mots(apres.texte)).toEqual(["Le pont grince."]);
  });

  it("F03-AC56 — « Le ruisseau », sans texte, se supprime sans confirmation et rejoint la corbeille ; une scène écrite demande la confirmation de F03-AC13 ; le choix « Traverser » supprimé, son bloc quitte « Le ruisseau » et « Le vieux pont » reste", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const ruisseau = await ajouterSceneApres(e, r.foret, r.clairiere.id, "Suivre le ruisseau", "Le ruisseau");
    if (!ruisseau.ok) throw new Error("Le ruisseau n'a pas été créé.");
    const lien = await ajouterAuPlan(e, r.foret, [], [{ de: ruisseau.scenes[0].id, vers: r.pont.id, libelle: "Traverser" }]);
    if (!lien.ok) throw new Error("Le lien n'a pas été posé.");
    await enregistrerPourAdulte(e, r.pont.id, 0, [p("Le pont grince.")]);

    // Le choix : sa phrase quitte le texte, la scène où il menait reste
    const retire = await retirerChoix(e, ruisseau.scenes[0].id, lien.choix[0].id);
    expect(retire).toMatchObject({ ok: true, bloc: { type: "choix", libelle: "Traverser" } });
    expect((await scene(ruisseau.scenes[0].id)).texte.map((b) => b.type)).toEqual(["p"]);
    expect((await scene(r.pont.id)).supprime_le).toBeNull();
    // « Annuler » : la phrase revient, la même
    expect(retire.ok && (await remettreChoix(e, ruisseau.scenes[0].id, retire.bloc)).ok).toBe(true);
    expect((await chemins(r)).liens.map((l) => l.id)).toContain(lien.choix[0].id);
    // Un choix qui n'y est plus se dit en une phrase
    expect(await retirerChoix(e, ruisseau.scenes[0].id, randomUUID())).toMatchObject({ ok: false, dit: "Ce choix n’est plus dans la scène." });
    // « Le ruisseau » porte de nouveau son choix « Traverser », et rien d'autre : elle reste « Texte vide »
    // (F06-AC105), une phrase de choix n'étant pas du texte de la scène
    expect((await scene(ruisseau.scenes[0].id)).texte_vide).toBe(true);

    // La scène : sans texte, pas de confirmation depuis le schéma, même si un choix y mène ou en part ; écrite, la confirmation
    const plan = await planDe(e, r.projet);
    const duRuisseau = travailDans(plan, "scene", ruisseau.scenes[0].id);
    expect(duRuisseau.menentIci.map((s) => s.id)).toEqual([r.clairiere.id]);
    expect(fautConfirmer(duRuisseau, true)).toBe(false);
    expect(fautConfirmer(travailDans(plan, "scene", r.pont.id), true)).toBe(true);
    // Depuis la vue « Scènes », le choix qui y mène est annoncé avant confirmation, comme avant (F03-AC13)
    expect(fautConfirmer(duRuisseau)).toBe(true);
    expect((await laurent.base.rpc("supprimer_element", { p_sorte: "scene", p_id: ruisseau.scenes[0].id })).error).toBeNull();
    const apres = await planDe(e, r.projet);
    expect(apres.corbeille.map((x) => x.id)).toContain(ruisseau.scenes[0].id);
    // Le choix qui y menait reste, marqué, sans être redirigé (F03-AC14)
    expect((await chemins(r)).liens.find((l) => l.de === r.clairiere.id)).toMatchObject({ vers: null, manque: "supprimee" });
  });

  it("F03-AC56 — une phrase écrite à la main qui mène à deux scènes ne se supprime pas d'ici ; à une seule scène, elle part entière ; un lien caché se règle dans la scène", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const [un, deux, seul, cache] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
    const renvoi = (id: string, cible: string) => ({ type: "renvoi", id, cible, children: [{ text: "" }] });
    await enregistrerPourAdulte(e, r.clairiere.id, 0, [
      p("Deux chemins."),
      { type: "choix", id: randomUUID(), libelle: "Choisir", children: [{ text: "Si tu as la clé, va au " }, renvoi(un, r.pont.id), { text: " ; sinon, au " }, renvoi(deux, r.pont.id), { text: "." }] },
      { type: "choix", id: randomUUID(), libelle: "Fuir", children: [{ text: "Pour fuir, cours au " }, renvoi(seul, r.pont.id), { text: "." }] },
      { type: "liaison", id: cache, cible: r.pont.id, children: [{ text: "" }] },
    ]);
    expect(await retirerChoix(e, r.clairiere.id, un)).toMatchObject({ ok: false, dit: "Cette phrase mène à plusieurs scènes : ouvrez la scène pour la modifier." });
    expect(await retirerChoix(e, r.clairiere.id, cache)).toMatchObject({ ok: false });
    expect((await retirerChoix(e, r.clairiere.id, seul)).ok).toBe(true);
    expect((await scene(r.clairiere.id)).texte.map((b) => b.type)).toEqual(["p", "choix", "liaison"]);
  });

  it("F03-AC57 — réservé à l'adulte du projet : Alice, attribuée au chapitre, ne peut rien ajouter ; un autre enseignant non plus ; un récit classique n'a pas ces gestes", async () => {
    const r = await recit();
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const choix = [{ de: r.clairiere.id, vers: r.pont.id, bloc: { type: "choix", id: randomUUID(), auto: true, libelle: "Traverser", construction: "neutre", cible: null, children: [{ text: "" }] } }];
    const eleve = await (await poste.base()).rpc("ajouter_au_plan", { p_chapitre: r.foret, p_scenes: [], p_choix: choix });
    expect(eleve.error).not.toBeNull();
    expect((await ajouterAuPlan(enseignantDe(martin), r.foret, [], [{ de: r.clairiere.id, vers: r.pont.id, libelle: "Traverser" }])).ok).toBe(false);
    expect((await retirerChoix(enseignantDe(martin), r.clairiere.id, randomUUID())).ok).toBe(false);
    expect((await scene(r.clairiere.id)).version).toBe(0);
    const classique = await creerProjet(laurent, "classe", "classique", "Un récit classique", classe.id);
    const { chapitreId } = await creerPartie(laurent, classique.id, "Partie", "Chapitre");
    const s = await creerScene(laurent.base, chapitreId);
    expect((await ajouterSceneApres(enseignantDe(laurent), chapitreId, s.id, "Avancer", "La suite")).ok).toBe(false);
  });
});
