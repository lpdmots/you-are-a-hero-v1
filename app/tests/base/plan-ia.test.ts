import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { chapitres as aideChapitres, parties as aideParties, resume as aideResume } from "@/serveur/ia/aides/plan";
import { demanderDesChapitres, demanderDesParties, demanderUnResume } from "@/serveur/plan-ia";
import { creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, sql, type Adulte } from "./outils";

/**
 * Étape 8, lot 6 : parties, chapitres et résumés (F13.5), contre la vraie base locale, le
 * fournisseur simulé (IA_SIMULEE). Le serveur relit lui-même ce qui part : la Préparation et le
 * plan, sans texte d'élève ; une demande seule ne crée rien (F13-AC15). L'ajout passe par les
 * actions ordinaires, éprouvées par les parcours (F13-AC16).
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

async function passeurs() {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  await laurent.base.from("preparations").update({ univers: "Un pays de brume.", personnages: "Lou, 10 ans.", enjeu: "Retrouver son père." }).eq("projet_id", projet.id);
  const foret = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  await laurent.base.from("chapitres").update({ resume: "Lou entre dans le bois." }).eq("id", foret.chapitreId);
  return { projet: projet.id, foret };
}
const appels = async () => (await sql<{ aide: string }>("select aide from public.appels_ia where enseignant_id = $1 order by commence_le", [laurent.id])).map((a) => a.aide);
const compte = async (table: "parties" | "chapitres", projet: string) => (await sql("select 1 from public." + table + " where projet_id = $1", [projet])).length;

describe("Idées de parties (F13.5)", () => {
  it("F13-AC15 — chaque ensemble a un titre de partie, un premier chapitre et son résumé ; rien n'est créé", async () => {
    const { projet } = await passeurs();
    const r = await demanderDesParties(enseignantDe(laurent), projet);
    expect(r.ok && r.sorte === "parties").toBe(true);
    if (!r.ok || r.sorte !== "parties") return;
    expect(r.ensembles).toHaveLength(10);
    for (const x of r.ensembles) {
      expect(x.partie.trim()).not.toBe("");
      expect(x.chapitre.trim()).not.toBe("");
      expect(x.resume.trim()).not.toBe("");
    }
    // La génération seule ne change pas le projet
    expect(await compte("parties", projet)).toBe(1);
    expect(await compte("chapitres", projet)).toBe(1);
    expect(await appels()).toEqual(["parties"]);
  });

  it("ce qui part : la Préparation, le plan et ses résumés, l'orientation et les titres déjà montrés ; jamais un élève ni l'adulte", async () => {
    const { projet } = await passeurs();
    const simuler = vi.spyOn(aideParties, "simuler");
    await demanderDesParties(enseignantDe(laurent), projet, { orientation: "un passage sous la mer", dejaMontres: ["Le marais des lucioles"] });
    const parti = simuler.mock.calls.map(([e]) => `${aideParties.systeme(e as never)}\n${aideParties.message(e as never)}`).join("\n");
    for (const present of ["Un pays de brume.", "Lou, 10 ans.", "Retrouver son père.", "Partie 1 : La forêt", "La lisière", "Lou entre dans le bois.", "un passage sous la mer", "Le marais des lucioles"]) {
      expect(parti).toContain(present);
    }
    for (const absent of ["Alice", "Laurent", "CM1-CM2"]) expect(parti).not.toContain(absent);
  });

  it("une partie déjà dans le plan, ou déjà montrée, n'est pas reproposée", async () => {
    const { projet } = await passeurs();
    await creerPartie(laurent, projet, "La tour du guetteur");
    const r = await demanderDesParties(enseignantDe(laurent), projet, { dejaMontres: ["Le marais des lucioles"] });
    const titres = r.ok && r.sorte === "parties" ? r.ensembles.map((x) => x.partie) : [];
    expect(titres).not.toContain("Le marais des lucioles");
    expect(titres).not.toContain("La tour du guetteur");
    expect(titres.length).toBeGreaterThanOrEqual(3);
  });

  it("le projet d'un autre adulte ne se lit pas", async () => {
    const { projet } = await passeurs();
    expect((await demanderDesParties(enseignantDe(martin), projet)).ok).toBe(false);
  });
});

describe("Chapitres proposés pour une partie (F13.5)", () => {
  it("six chapitres, titre et résumé, d'après la partie et ses chapitres ; rien n'est créé, et un titre déjà dans la partie n'est pas reproposé", async () => {
    const { projet, foret } = await passeurs();
    await creerChapitre(laurent, foret.partieId, "Le gué des saules");
    const simuler = vi.spyOn(aideChapitres, "simuler");
    const r = await demanderDesChapitres(enseignantDe(laurent), foret.partieId, { orientation: "une rencontre au bord de l'eau" });
    expect(r.ok && r.sorte === "chapitres").toBe(true);
    if (!r.ok || r.sorte !== "chapitres") return;
    expect(r.chapitres.map((c) => c.titre)).not.toContain("Le gué des saules");
    expect(r.chapitres.every((c) => c.titre && c.resume)).toBe(true);
    const parti = simuler.mock.calls.map(([e]) => aideChapitres.message(e as never)).join("\n");
    for (const present of ["« La forêt »", "La lisière", "Le gué des saules", "une rencontre au bord de l'eau"]) expect(parti).toContain(present);
    expect(await compte("chapitres", projet)).toBe(2);
    expect(await appels()).toEqual(["chapitres"]);
  });

  it("la partie d'un autre adulte ne se lit pas", async () => {
    const { foret } = await passeurs();
    expect((await demanderDesChapitres(enseignantDe(martin), foret.partieId)).ok).toBe(false);
  });
});

describe("Résumé proposé (F13.5)", () => {
  it("d'après le résumé enregistré, le plan, les titres et consignes des scènes, jamais leur texte ; le résumé ne change pas", async () => {
    const { foret } = await passeurs();
    const scene = await creerScene(laurent.base, foret.chapitreId);
    await laurent.base.from("scenes").update({ titre: "La souche creuse", consigne: "Décris la lanterne de secours." }).eq("id", scene.id);
    await sql("update public.scenes set texte = $2::jsonb where id = $1", [scene.id, JSON.stringify([{ type: "recit", children: [{ text: "Alice a écrit ce texte secret." }] }])]);
    const simuler = vi.spyOn(aideResume, "simuler");
    const r = await demanderUnResume(enseignantDe(laurent), foret.chapitreId);
    expect(r.ok && r.sorte === "resume" && r.resume.trim()).toBeTruthy();
    const parti = simuler.mock.calls.map(([e]) => aideResume.message(e as never)).join("\n");
    for (const present of ["Lou entre dans le bois.", "La souche creuse", "Décris la lanterne de secours.", "La lisière (partie « La forêt »)"]) expect(parti).toContain(present);
    for (const absent of ["texte secret", "Alice"]) expect(parti).not.toContain(absent);
    expect((await sql<{ resume: string }>("select resume from public.chapitres where id = $1", [foret.chapitreId]))[0].resume).toBe("Lou entre dans le bois.");
    expect(await appels()).toEqual(["resume"]);
  });

  it("le chapitre d'un autre adulte ne se lit pas", async () => {
    const { foret } = await passeurs();
    expect((await demanderUnResume(enseignantDe(martin), foret.chapitreId)).ok).toBe(false);
  });
});
