import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { ideesChoix } from "@/serveur/ia/aides/idees-choix";
import { demanderDesIdees, finPourLesIdees, lireDejaMontrees, PAS_DE_CHOIX } from "@/serveur/idees-de-choix";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, sql,
  type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * Étape 8, lot 4 : les idées de choix (F13.3), contre la vraie base locale, le fournisseur
 * simulé (IA_SIMULEE). Le serveur relit lui-même ce qui part ; une demande seule n'ajoute ni
 * choix, ni lien, ni scène. L'ajout se fait dans la copie : voir le parcours `idees-choix`.
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

const envoye = (espion: { mock: { calls: unknown[][] } }) =>
  espion.mock.calls.map(([e]) => `${ideesChoix.systeme(e as never)}\n${ideesChoix.message(e as never)}`).join("\n");

async function ecrire(sceneId: string, texte: unknown[]) {
  const version = (await sql("select version from public.scenes where id = $1", [sceneId]))[0].version as number;
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: sceneId, p_version: version, p_texte: texte });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(`Texte d'essai : ${error?.message ?? JSON.stringify(data)}`);
}

/** « La lisière » : le gué, la scène où l'on travaille (Alice s'en occupe), la souche. */
async function lisiere(recit: "choix" | "classique" = "choix") {
  const projet = await creerProjet(laurent, "classe", recit, "Les passeurs de brume", classe.id);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  await laurent.base.from("chapitres").update({ resume: "Lou traverse la lisière et rencontre le passeur." }).eq("id", chapitreId);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  const gue = await creerScene(laurent.base, chapitreId);
  const ici = await creerScene(laurent.base, chapitreId);
  const souche = await creerScene(laurent.base, chapitreId);
  await laurent.base.from("scenes").update({ titre: "Le gué", consigne: "Lou traverse le gué sur les pierres." }).eq("id", gue.id);
  await laurent.base.from("scenes").update({ titre: "La souche" }).eq("id", souche.id);
  await laurent.base.from("scenes").update({ titre: "Le pont", consigne: "Le passeur apparaît sur le pont.", prise_par_eleve: alice.id }).eq("id", ici.id);
  return { projet: projet.id, chapitreId, gue: gue.id, ici: ici.id, souche: souche.id };
}

const compter = async (projet: string) => ({
  scenes: Number((await sql("select count(*) n from public.scenes where projet_id = $1", [projet]))[0].n),
  liens: Number((await sql("select count(*) n from public.liens where projet_id = $1", [projet]))[0].n),
});

describe("Idées de choix (F13.3)", () => {
  it("F13-AC08 — des idées rendues, mais rien d'ajouté : ni choix, ni lien, ni scène", async () => {
    const { projet, ici } = await lisiere();
    const avant = await compter(projet);
    const texteAvant = (await sql("select texte from public.scenes where id = $1", [ici]))[0].texte;
    const r = await demanderDesIdees(enseignantDe(laurent), ici);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.idees).toHaveLength(10);
    expect(await compter(projet)).toEqual(avant);
    expect((await sql("select texte from public.scenes where id = $1", [ici]))[0].texte).toEqual(texteAvant);
  });

  it("F13-AC11 — les choix et les titres de leurs nouvelles scènes dans la même réponse, un seul appel", async () => {
    const { ici, gue } = await lisiere();
    const r = await demanderDesIdees(enseignantDe(laurent), ici);
    if (!r.ok) throw new Error(r.message);
    const nouvelles = r.idees.filter((i) => i.destination.sorte === "nouvelle");
    expect(nouvelles.length).toBeGreaterThan(0);
    for (const i of nouvelles) expect(i.destination.sorte === "nouvelle" && i.destination.titre).toBeTruthy();
    // Une scène existante se désigne par la scène du chapitre que l'IA a nommée
    expect(r.idees.find((i) => i.destination.sorte === "existante")?.destination).toEqual({ sorte: "existante", sceneId: gue });
    for (const i of r.idees) expect(i.intention).not.toBe("");
    const appels = await sql<{ aide: string }>("select aide from public.appels_ia where enseignant_id = $1", [laurent.id]);
    expect(appels.map((a) => a.aide)).toEqual(["idees-choix"]);
  });

  it("ce qui part : la consigne, le texte, le chapitre et ses scènes, les choix déjà là ; jamais l'élève ni l'adulte", async () => {
    const { ici, souche } = await lisiere();
    await ecrire(ici, [
      { type: "p", id: "00000000-0000-4000-8000-000000000001", children: [{ text: "Le passeur lève sa lanterne. Lou recule d'un pas." }] },
      { type: "note", id: "00000000-0000-4000-8000-000000000002", children: [{ text: "Alice : penser au chien" }] },
      { type: "choix", id: "00000000-0000-4000-8000-000000000003", auto: true, libelle: "Fuir vers la souche", construction: "neutre", cible: souche, children: [{ text: "" }] },
    ]);
    const simuler = vi.spyOn(ideesChoix, "simuler");
    const r = await demanderDesIdees(enseignantDe(laurent), ici, { orientation: "  une fausse   piste ", dejaMontrees: ["Suivre la chouette", 42] });
    expect(r.ok).toBe(true);
    const parti = envoye(simuler);
    for (const present of ["Le passeur apparaît sur le pont.", "Le passeur lève sa lanterne", "rencontre le passeur", "Le gué", "Fuir vers la souche", "une fausse piste", "Suivre la chouette"]) {
      expect(parti).toContain(present);
    }
    for (const absent of ["Alice", "Laurent", "CM1-CM2", "penser au chien"]) expect(parti).not.toContain(absent);
  });

  it("une scène où la scène mène déjà n'est pas reproposée comme destination", async () => {
    const { ici, gue } = await lisiere();
    await ecrire(ici, [
      { type: "choix", id: "00000000-0000-4000-8000-000000000004", auto: true, libelle: "Revenir au gué", construction: "neutre", cible: gue, children: [{ text: "" }] },
    ]);
    const r = await demanderDesIdees(enseignantDe(laurent), ici);
    if (!r.ok) throw new Error(r.message);
    expect(r.idees.some((i) => i.destination.sorte === "existante" && i.destination.sceneId === gue)).toBe(false);
  });

  it("F13-AC32 — sans consigne ni texte, des idées se proposent d'après le titre et le chapitre ; en récit classique, pas d'idées de choix", async () => {
    const classique = await lisiere("classique");
    expect(await demanderDesIdees(enseignantDe(laurent), classique.ici)).toEqual({ ok: false, message: PAS_DE_CHOIX });
    expect(await sql("select 1 from public.appels_ia where enseignant_id = $1", [laurent.id])).toHaveLength(0);
    const { ici } = await lisiere();
    await laurent.base.from("scenes").update({ consigne: "" }).eq("id", ici);
    const r = await demanderDesIdees(enseignantDe(laurent), ici);
    expect(r.ok && r.idees.length).toBeGreaterThan(0);
  });

  it("une réponse inutilisable ne change rien et le dit", async () => {
    const { projet, ici } = await lisiere();
    const avant = await compter(projet);
    vi.stubEnv("IA_SIMULEE", "echec");
    try {
      expect(await demanderDesIdees(enseignantDe(laurent), ici)).toEqual({ ok: false, message: MESSAGES_IA.pasDeReponse });
    } finally {
      vi.unstubAllEnvs();
    }
    expect(await compter(projet)).toEqual(avant);
  });
});

describe("Ce que la page envoie, relu sans confiance", () => {
  it("des libellés courts et bornés ; la fin du texte, en paragraphes entiers", () => {
    expect(lireDejaMontrees(["  a  b ", 3, "", "x".repeat(300)])).toEqual(["a b", "x".repeat(120)]);
    expect(lireDejaMontrees("non")).toEqual([]);
    expect(finPourLesIdees(["un", "deux", "trois"], 9)).toEqual(["deux", "trois"]);
  });
});
