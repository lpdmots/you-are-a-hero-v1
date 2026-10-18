import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { idees, questions, retenons } from "@/serveur/ia/aides/preparation";
import { demanderPourLEtape, entreeDeLEtape, RIEN_A_REDIGER } from "@/serveur/preparation-ia";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, enseignantDe, inscrire, lire, nettoyer, sql, type Adulte } from "./outils";

/**
 * Étape 8, lot 5 : les aides d'une étape de la Préparation (F13.4), contre la vraie base
 * locale, le fournisseur simulé (IA_SIMULEE). Le serveur relit lui-même ce qui part ; une
 * demande seule n'écrit rien : la page ajoute ce qu'elle livre, et « Nous retenons » ne change
 * qu'à « Utiliser ce texte ». Les questions, l'origine des idées et l'orientation restent à
 * l'adulte (migration `preparation_en_etapes`).
 */

let laurent: Adulte;
let martin: Adulte;
let classe: { id: string };

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  await inscrire(laurent, classe.id, ["Alice"]);
});
afterAll(nettoyer);
afterEach(async () => {
  vi.restoreAllMocks();
  await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
});

async function preparation() {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  await laurent.base.from("preparations").update({ univers: "Un pays de brume.", personnages: "Lou, 10 ans.", orientations: { personnages: "un compagnon animal" } }).eq("projet_id", projet.id);
  await laurent.base.from("questions").insert({ projet_id: projet.id, enseignant_id: laurent.id, etape: "personnages", texte: "A-t-il un animal ?", origine: "main" });
  return projet.id;
}
const appels = async () => (await sql<{ aide: string }>("select aide from public.appels_ia where enseignant_id = $1 order by commence_le", [laurent.id])).map((a) => a.aide);

describe("Les aides d'une étape de la Préparation (F13.4)", () => {
  it("F13-AC14 — une idée retenue fait partie du contexte de la demande suivante, avec les relances, les questions et l'orientation ; jamais un élève ni l'adulte", async () => {
    const projet = await preparation();
    await laurent.base.from("pistes").insert({ projet_id: projet, enseignant_id: laurent.id, rubrique: "personnages", texte: "il ne peut pas voler", etat: "retenue" });
    const simuler = vi.spyOn(questions, "simuler");
    const r = await demanderPourLEtape(enseignantDe(laurent), projet, "personnages", "questions");
    expect(r.ok && r.sorte === "questions" && r.elements.length).toBeGreaterThan(0);
    const parti = simuler.mock.calls.map(([e]) => `${questions.systeme(e as never)}\n${questions.message(e as never)}`).join("\n");
    for (const present of ["il ne peut pas voler (retenue)", "De quoi a-t-il peur ?", "A-t-il un animal ?", "un compagnon animal", "Un pays de brume.", "Lou, 10 ans."]) expect(parti).toContain(present);
    for (const absent of ["Alice", "Laurent", "CM1-CM2"]) expect(parti).not.toContain(absent);
    expect(await appels()).toEqual(["questions"]);
  });

  it("des idées rendues, mais rien d'ajouté : la page ajoute une idée à la fois", async () => {
    const projet = await preparation();
    const r = await demanderPourLEtape(enseignantDe(laurent), projet, "personnages", "idees");
    expect(r.ok && r.sorte === "idees" && r.elements).toHaveLength(6);
    expect(await sql("select 1 from public.pistes where projet_id = $1", [projet])).toHaveLength(0);
    expect(await appels()).toEqual(["idees"]);
  });

  it("F13-AC12 — « Rédiger d'après les idées » rend une proposition, et le texte retenu ne change pas", async () => {
    const projet = await preparation();
    await laurent.base.from("pistes").insert({ projet_id: projet, enseignant_id: laurent.id, rubrique: "personnages", texte: "Il connaît le chant des lanternes", etat: "retenue" });
    const r = await demanderPourLEtape(enseignantDe(laurent), projet, "personnages", "retenons");
    expect(r.ok && r.sorte === "retenons" && r.texte).toContain("Il connaît le chant des lanternes");
    expect((await sql("select personnages from public.preparations where projet_id = $1", [projet]))[0].personnages).toBe("Lou, 10 ans.");
  });

  it("sans idée retenue ni texte, « Rédiger » ne part pas ; Grandes étapes ne rédige pas de texte", async () => {
    const projet = await preparation();
    await laurent.base.from("pistes").insert({ projet_id: projet, enseignant_id: laurent.id, rubrique: "enjeu", texte: "Sauver le père", etat: "discuter" });
    expect(await demanderPourLEtape(enseignantDe(laurent), projet, "enjeu", "retenons")).toEqual({ ok: false, message: RIEN_A_REDIGER });
    expect((await demanderPourLEtape(enseignantDe(laurent), projet, "etapes", "retenons")).ok).toBe(false);
    expect(await appels()).toEqual([]);
  });

  it("Grandes étapes : le plan part avec la demande, parties et chapitres", async () => {
    const projet = await preparation();
    await creerPartie(laurent, projet, "La forêt", "La lisière");
    const entree = await entreeDeLEtape(enseignantDe(laurent), projet, "etapes");
    expect(entree?.plan).toEqual([{ partie: "La forêt", chapitres: [{ titre: "La lisière", resume: undefined }] }]);
    expect(idees.message(entree!)).toContain("Partie 1 : La forêt");
    expect(retenons.message(entree!)).toContain("Par quels lieux passe notre aventure ?");
  });

  it("le projet d'un autre adulte : rien ne part", async () => {
    const projet = await preparation();
    expect(await demanderPourLEtape(enseignantDe(martin), projet, "personnages", "questions")).toEqual({ ok: false, message: "Ce projet n’existe plus." });
  });
});

describe("Questions, origine des idées, orientation : à l'adulte seul (migration preparation_en_etapes)", () => {
  it("un autre adulte ne lit ni n'écrit les questions ; une idée de l'IA garde son origine", async () => {
    const projet = await preparation();
    expect((await lire(martin.base, "questions")).lignes).toEqual([]);
    expect((await martin.base.from("questions").insert({ projet_id: projet, enseignant_id: martin.id, etape: "univers", texte: "Piraté ?" })).error).not.toBeNull();
    expect((await laurent.base.from("questions").insert({ projet_id: projet, enseignant_id: laurent.id, etape: "choix", texte: "Hors étape ?" })).error).not.toBeNull();
    const { error } = await laurent.base.from("pistes").insert({ projet_id: projet, enseignant_id: laurent.id, rubrique: "personnages", texte: "Un renard", origine: "ia" });
    expect(error).toBeNull();
    expect(await sql("select etat, origine from public.pistes where projet_id = $1", [projet])).toEqual([{ etat: "discuter", origine: "ia" }]);
    expect((await laurent.base.from("pistes").insert({ projet_id: projet, enseignant_id: laurent.id, rubrique: "personnages", texte: "x", origine: "robot" })).error).not.toBeNull();
    // Une orientation démesurée est refusée par la base
    expect((await laurent.base.from("preparations").update({ orientations: { univers: "x".repeat(5000) } }).eq("projet_id", projet)).error).not.toBeNull();
  });
});
