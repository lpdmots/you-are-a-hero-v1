import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

// Le poste d'un élève se reconnaît à son cookie : ici, celui du poste qu'on fait écrire
let jetonDuPoste: string | null = null;
vi.mock("@/serveur/poste", () => ({ empreinteDuPoste: async () => jetonDuPoste }));

import { REGLAGES_IA_HABITUELS } from "@/domaine/aides-ia";
import { peutConstruire } from "@/domaine/chemins";
import type { Bloc, ChoixAuto, Texte } from "@/domaine/copie";
import { ajouterUnBloc, annulerUnBloc, demanderUnBloc, enregistrerReglagesDuBloc, reglagesDuBloc } from "@/serveur/bloc-de-scenes";
import { enregistrerPourAdulte, enregistrerPourEleve } from "@/serveur/copie";
import { blocDeScenes } from "@/serveur/ia/aides/bloc-de-scenes";
import * as demander from "@/serveur/ia/demander";

/**
 * Construire dans « Chemins », lot 3 : le bloc de scènes (F13.7), contre la vraie base locale, le
 * fournisseur simulé (IA_SIMULEE) : une proposition ne crée rien ; l'ajout entre au chapitre d'un
 * seul tenant, ne fait qu'ajouter, et n'arrête pas l'élève qui écrit la scène d'origine.
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
  await sql("update public.enseignants set reglages_bloc = '{}' where id = $1", [laurent.id]);
  await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
});

const p = (texte: string): Bloc => ({ type: "p", id: randomUUID(), children: [{ text: texte }] });
const mots = (t: Texte): string[] => t.map((b) => (b.type === "choix" ? `→ ${b.libelle}` : b.type === "p" ? b.children.map((l) => ("text" in l ? l.text : "")).join("") : b.type));

/** « La lisière » : « L'orée de la forêt », qui a déjà un choix et pas de consigne, « Le vieux pont », « La souche ». */
async function lisiere(): Promise<{ projet: string; chapitre: string; oree: SceneEssai; pont: SceneEssai; souche: SceneEssai }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const oree = await creerScene(laurent.base, chapitreId);
  const pont = await creerScene(laurent.base, chapitreId);
  const souche = await creerScene(laurent.base, chapitreId);
  await laurent.base.from("scenes").update({ titre: "L’orée de la forêt" }).eq("id", oree.id);
  await laurent.base.from("scenes").update({ titre: "Le vieux pont", consigne: "Le héros traverse le pont." }).eq("id", pont.id);
  await laurent.base.from("scenes").update({ titre: "La souche" }).eq("id", souche.id);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  const existant: ChoixAuto = { type: "choix", id: randomUUID(), auto: true, libelle: "Se cacher dans la souche", construction: "neutre", cible: souche.id, children: [{ text: "" }] };
  await enregistrerPourAdulte(enseignantDe(laurent), oree.id, 0, [p("Le héros arrive à l’orée de la forêt."), existant]);
  return { projet: projet.id, chapitre: chapitreId, oree, pont, souche };
}

const compter = async (projet: string) => ({
  scenes: Number((await sql("select count(*) n from public.scenes where projet_id = $1 and supprime_le is null", [projet]))[0].n),
  liens: Number((await sql("select count(*) n from public.liens where projet_id = $1", [projet]))[0].n),
});
const scene = async (id: string) =>
  (await sql<{ titre: string | null; consigne: string; verification: string[]; texte: Texte; texte_vide: boolean; prise_par_eleve: string | null; rang: number; supprime_le: string | null }>(
    "select titre, consigne, verification, texte, texte_vide, prise_par_eleve, rang, supprime_le from scenes where id = $1", [id],
  ))[0];
const images = async (projet: string) => Number((await sql("select count(*) n from public.images where projet_id = $1", [projet]))[0].n);

describe("Bloc de scènes depuis le schéma (F13.7)", () => {
  it("F13-AC34 — « trois chemins : le sentier des fougères, le ruisseau, la grotte » depuis « L'orée » : trois scènes et trois choix proposés sous sa carte, et le projet ne contient encore ni ces scènes ni ces choix", async () => {
    const r = await lisiere();
    const avant = await compter(r.projet);
    const fait = await demanderUnBloc(enseignantDe(laurent), r.chapitre, { origine: r.oree.id, demande: "trois chemins : le sentier des fougères, le ruisseau, la grotte" });
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    expect(fait.proposition.origine).toBe(r.oree.id);
    expect(fait.proposition.scenes.map((s) => s.titre)).toEqual(["Le sentier des fougères", "Le ruisseau", "La grotte"]);
    expect(fait.proposition.choix.every((c) => c.de === r.oree.id)).toBe(true);
    expect(await compter(r.projet)).toEqual(avant);
    // Une seule demande au journal, l'aide du bloc
    expect((await sql("select aide from public.appels_ia where enseignant_id = $1", [laurent.id])).map((x) => x.aide)).toEqual(["bloc-scenes"]);
  });

  it("ce qui part : le chapitre, ses scènes et leurs choix, le texte de la scène d'origine, la demande ; jamais un prénom d'élève", async () => {
    const r = await lisiere();
    const espion = vi.spyOn(demander, "demanderUneAide");
    await demanderUnBloc(enseignantDe(laurent), r.chapitre, { origine: r.oree.id, demande: "deux chemins : le pont, la rivière" });
    const e = espion.mock.calls[0][2] as Parameters<typeof blocDeScenes.message>[0];
    const envoye = `${blocDeScenes.systeme(e)}\n${blocDeScenes.message(e)}`;
    expect(envoye).toContain("« L’orée de la forêt »");
    expect(envoye).toContain("« Se cacher dans la souche » → S003");
    expect(envoye).toContain("Le héros arrive à l’orée de la forêt.");
    expect(envoye).toContain("Le héros traverse le pont.");
    expect(envoye).toContain("deux chemins : le pont, la rivière");
    expect(envoye).not.toContain("Alice");
    expect(envoye).not.toContain("Mme Laurent");
  });

  it("F13-AC35 — « une scène dans la forêt avec trois choix » depuis « Le vieux pont » : quatre scènes et quatre choix", async () => {
    const r = await lisiere();
    const fait = await demanderUnBloc(enseignantDe(laurent), r.chapitre, { origine: r.pont.id, demande: "une scène dans la forêt avec trois choix" });
    expect(fait.ok && [fait.proposition.scenes.length, fait.proposition.choix.length]).toEqual([4, 4]);
  });

  it("F13-AC38 — la proposition, un titre retouché, « Ajouter 3 scènes et 3 choix » : les scènes à la fin du chapitre avec leur titre, leur consigne et leur liste, sans texte, élève ni image ; les choix à la fin de « L'orée » ; « Annuler » retire le tout", async () => {
    const r = await lisiere();
    const e = enseignantDe(laurent);
    const demande = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "trois chemins : le sentier des fougères, le ruisseau, la grotte" });
    if (!demande.ok) throw new Error(demande.message);
    const retouchee = { ...demande.proposition, scenes: demande.proposition.scenes.map((s) => (s.titre === "Le ruisseau" ? { ...s, titre: "Le ruisseau d’argent" } : s)) };
    const avant = await compter(r.projet);
    const fait = await ajouterUnBloc(e, r.chapitre, retouchee);
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    expect(await compter(r.projet)).toEqual({ scenes: avant.scenes + 3, liens: avant.liens + 3 });
    const nouvelles = await Promise.all(fait.scenes.map((s) => scene(s.id)));
    expect(nouvelles.map((s) => s.titre)).toEqual(["Le sentier des fougères", "Le ruisseau d’argent", "La grotte"]);
    expect(nouvelles.map((s) => s.rang)).toEqual([3, 4, 5]);
    for (const s of nouvelles) {
      expect(s.consigne).not.toBe("");
      expect(s.verification.length).toBeGreaterThanOrEqual(2);
      expect(s).toMatchObject({ texte_vide: true, prise_par_eleve: null });
    }
    expect(await images(r.projet)).toBe(0);
    expect(mots((await scene(r.oree.id)).texte)).toEqual([
      "Le héros arrive à l’orée de la forêt.", "→ Se cacher dans la souche", "→ Aller vers le sentier des fougères", "→ Aller vers le ruisseau", "→ Aller vers la grotte",
    ]);

    // « Annuler », aussitôt
    expect(await annulerUnBloc(e, fait.choix, fait.scenes.map((s) => s.id))).toMatchObject({ ok: true });
    expect(await compter(r.projet)).toEqual(avant);
    expect(mots((await scene(r.oree.id)).texte)).toEqual(["Le héros arrive à l’orée de la forêt.", "→ Se cacher dans la souche"]);
  });

  it("F13-AC39 — « … la grotte rejoint Le vieux pont », sans prendre la consigne proposée : le choix existant est inchangé, « L'orée » reste sans consigne, la grotte mène au pont déjà là, sans doublon", async () => {
    const r = await lisiere();
    const e = enseignantDe(laurent);
    const demande = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "trois chemins : le sentier des fougères, le ruisseau, la grotte rejoint Le vieux pont" });
    if (!demande.ok) throw new Error(demande.message);
    expect(demande.proposition.consigneOrigine).not.toBeNull();
    const fait = await ajouterUnBloc(e, r.chapitre, demande.proposition, { prendreConsigne: false });
    if (!fait.ok) throw new Error(fait.dit);
    const oree = await scene(r.oree.id);
    expect(oree.consigne).toBe("");
    expect(oree.texte.find((b) => b.type === "choix")).toMatchObject({ libelle: "Se cacher dans la souche", cible: r.souche.id });
    const titres = (await sql<{ titre: string }>("select titre from scenes where chapitre_id = $1 and supprime_le is null order by rang", [r.chapitre])).map((x) => x.titre);
    expect(titres.filter((t) => t === "Le vieux pont")).toHaveLength(1);
    // Le chemin de la grotte mène au pont déjà là : deux nouvelles scènes, trois nouveaux choix
    expect(fait.scenes.map((s) => s.titre)).toEqual(["Le sentier des fougères", "Le ruisseau"]);
    expect(oree.texte.filter((b) => b.type === "choix").at(-1)).toMatchObject({ libelle: "Aller vers la grotte", cible: r.pont.id });
  });

  it("F13-AC39 — prise, la consigne proposée se pose sur « L'orée » qui n'en a pas, et « Annuler » l'efface ; une consigne écrite entre-temps n'est jamais remplacée", async () => {
    const r = await lisiere();
    const e = enseignantDe(laurent);
    const demande = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "deux chemins : le sentier, le ruisseau" });
    if (!demande.ok) throw new Error(demande.message);
    const fait = await ajouterUnBloc(e, r.chapitre, demande.proposition, { prendreConsigne: true });
    if (!fait.ok) throw new Error(fait.dit);
    expect(fait.consignePrise).toBe(demande.proposition.consigneOrigine?.consigne);
    expect((await scene(r.oree.id)).consigne).toBe(fait.consignePrise);
    await annulerUnBloc(e, fait.choix, fait.scenes.map((s) => s.id), { scene: r.oree.id, texte: fait.consignePrise! });
    expect(await scene(r.oree.id)).toMatchObject({ consigne: "", verification: [] });

    // L'adulte a écrit une consigne entre la proposition et l'ajout : elle reste
    await laurent.base.from("scenes").update({ consigne: "Ma consigne." }).eq("id", r.oree.id);
    const encore = await ajouterUnBloc(e, r.chapitre, demande.proposition, { prendreConsigne: true });
    expect(encore.ok && encore.consignePrise).toBeNull();
    expect((await scene(r.oree.id)).consigne).toBe("Ma consigne.");
  });

  it("F13-AC39 — une proposition renvoyée par la page ne touche à aucune autre scène : un choix qui partirait d'une scène existante est écarté", async () => {
    const r = await lisiere();
    const avant = mots((await scene(r.pont.id)).texte);
    const fait = await ajouterUnBloc(enseignantDe(laurent), r.chapitre, {
      origine: r.oree.id,
      scenes: [{ cle: "N1", titre: "La grotte", consigne: "", liste: [] }],
      choix: [{ de: r.oree.id, vers: "N1", libelle: "Entrer" }, { de: r.pont.id, vers: "N1", libelle: "Descendre" }],
    });
    expect(fait.ok && fait.choix).toHaveLength(1);
    expect(mots((await scene(r.pont.id)).texte)).toEqual(avant);
  });

  it("F08-AC44 — Alice écrit « L'orée » pendant que le bloc s'ajoute : son enregistrement suivant réussit, son texte est entier, les choix du bloc sont à sa fin", async () => {
    const r = await lisiere();
    const poste: PosteEssai = await posteDe(classe.id, alice.inscriptionId);
    const { data: ecriture } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: r.oree.id });
    const version = (await sql<{ version: number }>("select version from scenes where id = $1", [r.oree.id]))[0].version;
    const texteDAlice = (await scene(r.oree.id)).texte;
    const demande = await demanderUnBloc(enseignantDe(laurent), r.chapitre, { origine: r.oree.id, demande: "deux chemins : le sentier, le ruisseau" });
    if (!demande.ok) throw new Error(demande.message);
    expect((await ajouterUnBloc(enseignantDe(laurent), r.chapitre, demande.proposition)).ok).toBe(true);
    jetonDuPoste = poste.jetonHash;
    try {
      const fait = await enregistrerPourEleve(ecriture as string, version, [...texteDAlice.filter((b) => b.type !== "choix"), p("Elle hésite."), ...texteDAlice.filter((b) => b.type === "choix")]);
      expect(fait).toMatchObject({ etat: "enregistre" });
    } finally {
      jetonDuPoste = null;
    }
    expect(mots((await scene(r.oree.id)).texte)).toEqual([
      "Le héros arrive à l’orée de la forêt.", "Elle hésite.", "→ Se cacher dans la souche", "→ Aller vers le sentier", "→ Aller vers le ruisseau",
    ]);
    expect(Number((await sql("select count(*) n from copies_recuperation where scene_id = $1", [r.oree.id]))[0].n)).toBe(0);
  });

  it("F13-AC41 — « Consignes » éteint : les nouvelles scènes ont un titre et pas de consigne ; le réglage est gardé avec le compte", async () => {
    const r = await lisiere();
    const e = enseignantDe(laurent);
    expect(await reglagesDuBloc(e)).toEqual({ consignes: true });
    expect(await enregistrerReglagesDuBloc(e, { consignes: false })).toBe(true);
    expect(await reglagesDuBloc(e)).toEqual({ consignes: false });
    const demande = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "deux chemins : le sentier, le ruisseau" });
    if (!demande.ok) throw new Error(demande.message);
    const fait = await ajouterUnBloc(e, r.chapitre, demande.proposition, { prendreConsigne: true });
    if (!fait.ok) throw new Error(fait.dit);
    for (const s of fait.scenes) expect(await scene(s.id)).toMatchObject({ consigne: "", verification: [] });
    expect((await scene(r.oree.id)).consigne).toBe("");
  });

  it("F13-AC42 — pour l'adulte seul : l'élève lit « Chemins » sans geste ; « Proposer les aides IA » éteint, la demande ne part pas et rien n'est compté", async () => {
    expect(peutConstruire({ adulte: false, aChoix: true, etroit: false })).toBe(false);
    const r = await lisiere();
    const e = { ...enseignantDe(laurent), reglagesIa: { ...REGLAGES_IA_HABITUELS, proposer: false } };
    const fait = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "deux chemins : le sentier, le ruisseau" });
    expect(fait.ok).toBe(false);
    expect(Number((await sql("select count(*) n from public.appels_ia where enseignant_id = $1", [laurent.id]))[0].n)).toBe(0);
    // Un autre adulte n'atteint pas ce chapitre
    const martin = await creerEnseignant("M. Martin");
    expect(await demanderUnBloc(enseignantDe(martin), r.chapitre, { origine: r.oree.id, demande: "deux chemins : a, b" })).toMatchObject({ ok: false });
  });

  it("un chapitre vide : le bloc en est le début, sans scène d'origine", async () => {
    const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
    const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La rivière");
    const e = enseignantDe(laurent);
    const demande = await demanderUnBloc(e, chapitreId, { origine: null, demande: "une scène au bord de la rivière avec deux choix" });
    if (!demande.ok) throw new Error(demande.message);
    const fait = await ajouterUnBloc(e, chapitreId, demande.proposition);
    expect(fait.ok && fait.scenes.map((s) => s.titre)).toEqual(["Bord de la rivière", "Chemin 1", "Chemin 2"]);
  });

  it("F13-AC36, AC37 — un troisième chemin non décrit : l'IA l'imagine et le marque, une question porte sur lui avec ses réponses toutes prêtes, aucune scène de plus ; l'adulte ajoute sans affiner ; une demande complète n'en reçoit aucune", async () => {
    const r = await lisiere();
    const e = enseignantDe(laurent);
    const flou = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "trois chemins : le sentier des fougères, le ruisseau, et un troisième" });
    if (!flou.ok) throw new Error(flou.message);
    expect(flou.proposition.questions).toEqual([{ question: "Où mène le chemin 3, et que s'y passe-t-il ?", reponses: ["Le chemin des ronces", "Une cabane de bûcheron", "Un ravin"] }]);
    expect(flou.proposition.scenes).toHaveLength(3);
    expect(flou.proposition.scenes.filter((s) => s.inventee).map((s) => s.titre)).toEqual(["Le chemin des ronces"]);
    const fait = await ajouterUnBloc(e, r.chapitre, flou.proposition);
    expect(fait.ok && fait.scenes).toHaveLength(3);
    const clair = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "trois chemins : le sentier des fougères, le ruisseau, la grotte" });
    expect(clair.ok && clair.proposition.questions).toEqual([]);
  });

  it("F13-AC44 — affiner : la précision, les réponses et la proposition retouchée partent avec la demande, relues sans confiance ; la proposition se modifie", async () => {
    const r = await lisiere();
    const e = enseignantDe(laurent);
    const flou = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "trois chemins : le sentier des fougères, le ruisseau, et un troisième" });
    if (!flou.ok) throw new Error(flou.message);
    const espion = vi.spyOn(demander, "demanderUneAide");
    const retouchee = { ...flou.proposition, scenes: flou.proposition.scenes.map((s, i) => (i === 0 ? { ...s, titre: "Les fougères géantes" } : s)) };
    const redessinee = await demanderUnBloc(e, r.chapitre, {
      origine: r.oree.id, demande: "trois chemins : le sentier des fougères, le ruisseau, et un troisième",
      reponses: [{ question: flou.proposition.questions[0].question, reponse: "Une cabane de bûcheron" }, { question: "", reponse: "vide" }],
      precision: "  le ruisseau doit être dangereux  ",
      actuelle: retouchee,
    });
    const entree = espion.mock.calls[0][2] as Parameters<typeof blocDeScenes.message>[0];
    expect(entree.reponses).toEqual([{ question: "Où mène le chemin 3, et que s'y passe-t-il ?", reponse: "Une cabane de bûcheron" }]);
    expect(entree.precision).toBe("le ruisseau doit être dangereux");
    expect(entree.actuelle?.scenes[0].titre).toBe("Les fougères géantes");
    expect(redessinee.ok && redessinee.proposition.scenes.map((s) => s.titre)).toEqual(["Les fougères géantes", "Le ruisseau", "Une cabane de bûcheron"]);
    expect(redessinee.ok && redessinee.proposition.questions).toEqual([]);
  });

  it("F13-AC40 — une demande trop large : la première partie, huit nouvelles scènes au plus, et ce qui reste ; ajouter n'ajoute que la première partie", async () => {
    const r = await lisiere();
    const e = enseignantDe(laurent);
    const avant = await compter(r.projet);
    const large = await demanderUnBloc(e, r.chapitre, { origine: r.oree.id, demande: "trois chemins : le sentier, le ruisseau, la grotte puis le campement et la rivière avec leurs propres choix" });
    if (!large.ok) throw new Error(large.message);
    expect(large.proposition.scenes.length).toBeLessThanOrEqual(8);
    expect(large.proposition.reste).toMatch(/Reste : le campement et la rivière/);
    const fait = await ajouterUnBloc(e, r.chapitre, large.proposition);
    if (!fait.ok) throw new Error(fait.dit);
    expect((await compter(r.projet)).scenes).toBe(avant.scenes + 3);
  });
});
