import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, etat as etatPoste, inscrire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type SceneEssai,
} from "./outils";

/**
 * Étape 4 du plan, lot 3 : les scènes d'un élève retiré de la classe, ou d'un chapitre
 * (F01.1, F06.3), contre la vraie base locale.
 */

let laurent: Adulte;
let martin: Adulte;
afterAll(nettoyer);
beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
});

type Bloc = { type: "p"; id: string; children: { text: string }[] };
const texte = (...paragraphes: string[]): Bloc[] => paragraphes.map((t) => ({ type: "p", id: randomUUID(), children: [{ text: t }] }));
const mots = (t: Bloc[]): string => t.map((b) => b.children.map((c) => c.text).join("")).join("\n");
type Ligne = { etat: string; version: number; tour: number; texte: Bloc[]; prise_par_eleve: string | null };
const scene = async (id: string): Promise<Ligne> => (await sql<Ligne>("select etat, version, tour, texte, prise_par_eleve from public.scenes where id = $1", [id]))[0];

type Situation = { classe: ClasseEssai; alice: EleveEssai; bilal: EleveEssai; projet: string; lisiere: string; s: SceneEssai[] };

/** Une classe neuve à chaque fois : Bilal et Alice dans « La lisière », quatre scènes au nom de Bilal. */
async function situation(): Promise<Situation> {
  const classe = await creerClasse(laurent);
  const [alice, bilal] = await inscrire(laurent, classe.id, ["Alice", "Bilal"]);
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  const s: SceneEssai[] = [];
  for (let i = 0; i < 4; i += 1) {
    const cree = await creerScene(laurent.base, chapitreId);
    await laurent.base.from("scenes").update({ prise_par_eleve: bilal.id }).eq("id", cree.id);
    await laurent.base.rpc("enregistrer_texte", { p_scene: cree.id, p_version: 0, p_texte: texte(`Texte de la scène ${i + 1}.`) });
    s.push(cree);
  }
  return { classe, alice, bilal, projet: projet.id, lisiere: chapitreId, s };
}
const choisir = async (sceneId: string, etat: string, remarque: string | null = null) => {
  const vu = await scene(sceneId);
  const { data, error } = await laurent.base.rpc("changer_etat", { p_scene: sceneId, p_etat: etat, p_version: vu.version, p_tour: vu.tour, p_remarque: remarque });
  if (error) throw new Error(error.message);
  return data as { fait: boolean; etat: string };
};
/** S1 validée, S2 à reprendre, S3 à valider, S4 en cours, toutes au nom de Bilal. */
async function travailDeBilal(x: Situation): Promise<void> {
  const poste = await posteDe(x.classe.id, x.bilal.inscriptionId);
  for (const s of x.s.slice(0, 3)) {
    const { data } = await (await poste.base()).rpc("eleve_remettre", { p_scene: s.id, p_version: (await scene(s.id)).version });
    if (!(data as { fait: boolean }).fait) throw new Error("Remise d'essai refusée");
  }
  await choisir(x.s[0].id, "valide");
  await choisir(x.s[1].id, "reprendre", "Développe la description.");
}
const retirer = async (adulte: Adulte, inscription: string) => (await adulte.base.rpc("retirer_eleve", { p_inscription: inscription })).error?.message ?? null;
const attributions = (chapitre: string) => sql<{ eleve_id: string }>("select eleve_id from public.attributions where chapitre_id = $1", [chapitre]);

describe("Retirer un élève de la classe (F01.1)", () => {
  it("F01-AC22, AC25 — retirer un élève qui a écrit : il quitte « La lisière » ; sa scène validée garde son texte et son prénom, sa scène à valider reste à valider à son prénom, sa scène à reprendre devient « En cours », « Pas encore prise », avec son texte", async () => {
    const x = await situation();
    await travailDeBilal(x);
    const poste = await posteDe(x.classe.id, x.bilal.inscriptionId);
    expect(await retirer(laurent, x.bilal.inscriptionId)).toBeNull();
    expect((await attributions(x.lisiere)).map((a) => a.eleve_id)).toEqual([x.alice.id]);
    // Il n'est plus au choix des prénoms : son poste revient à ce choix
    expect((await etatPoste(poste))?.inscription_id ?? null).toBeNull();
    const [validee, aReprendre, aValider, enCours] = await Promise.all(x.s.map((s) => scene(s.id)));
    expect(validee).toMatchObject({ etat: "valide", prise_par_eleve: x.bilal.id });
    expect(aValider).toMatchObject({ etat: "valider", prise_par_eleve: x.bilal.id });
    expect(aReprendre).toMatchObject({ etat: "cours", prise_par_eleve: null });
    expect(enCours).toMatchObject({ etat: "cours", prise_par_eleve: null });
    expect(mots(aReprendre.texte)).toBe("Texte de la scène 2.");
    // La remarque reste lisible avec la remise
    expect(await sql("select 1 from public.remarques where scene_id = $1 and texte = 'Développe la description.'", [x.s[1].id])).toHaveLength(1);
    // Validée par l'enseignant, sa scène à valider garde son prénom (AC25)
    expect(await choisir(x.s[2].id, "valide")).toMatchObject({ fait: true, etat: "valide" });
    expect((await scene(x.s[2].id)).prise_par_eleve).toBe(x.bilal.id);
  });

  it("F01-AC25 — scène à valider d'un élève retiré, renvoyée : elle devient « En cours », sans élève, et la remarque est gardée avec sa remise", async () => {
    const x = await situation();
    await travailDeBilal(x);
    await retirer(laurent, x.bilal.inscriptionId);
    expect(await choisir(x.s[2].id, "reprendre", "À reprendre par un camarade.")).toMatchObject({ fait: true, etat: "cours" });
    expect(await scene(x.s[2].id)).toMatchObject({ etat: "cours", prise_par_eleve: null });
    expect(await sql("select 1 from public.remarques where scene_id = $1 and eleve_id = $2", [x.s[2].id, x.bilal.id])).toHaveLength(1);
    // Alice, du même chapitre, peut alors la prendre
    const poste = await posteDe(x.classe.id, x.alice.inscriptionId);
    const { data } = await (await poste.base()).rpc("eleve_prendre", { p_scenes: [{ scene: x.s[2].id, vu: null }] });
    expect((data as { prises: string[] }).prises).toEqual([x.s[2].id]);
  });

  it("F01-AC22 — réinscrit avec le même code : son profil et son code sont conservés, sans ses anciens chapitres", async () => {
    const x = await situation();
    await travailDeBilal(x);
    const [avant] = await sql<{ code_chiffre: string }>("select code_chiffre from public.eleves_secrets where eleve_id = $1", [x.bilal.id]);
    await retirer(laurent, x.bilal.inscriptionId);
    const { error } = await laurent.base.rpc("inscrire_eleves", { p_classe: x.classe.id, p_connus: [x.bilal.id], p_nouveaux: [] });
    expect(error).toBeNull();
    const [apres] = await sql<{ code_chiffre: string }>("select code_chiffre from public.eleves_secrets where eleve_id = $1", [x.bilal.id]);
    expect(apres.code_chiffre).toBe(avant.code_chiffre);
    expect((await sql("select 1 from public.inscriptions where eleve_id = $1 and retire_le is null", [x.bilal.id]))).toHaveLength(1);
    expect((await attributions(x.lisiere)).map((a) => a.eleve_id)).toEqual([x.alice.id]);
  });

  it("F01.1 — « Annuler », juste après un retrait : l'élève retrouve son chapitre, son profil d'organisation et les scènes qu'il écrivait, si personne ne les a prises", async () => {
    const x = await situation();
    await travailDeBilal(x);
    await retirer(laurent, x.bilal.inscriptionId);
    // Entre-temps, Alice a pris la scène qui était en cours
    await laurent.base.from("scenes").update({ prise_par_eleve: x.alice.id }).eq("id", x.s[3].id);
    const { error } = await laurent.base.rpc("annuler_retrait", { p_inscription: x.bilal.inscriptionId });
    expect(error).toBeNull();
    expect(await sql("select profil from public.attributions where chapitre_id = $1 and eleve_id = $2", [x.lisiere, x.bilal.id])).toEqual([{ profil: "organisation" }]);
    expect(await scene(x.s[1].id)).toMatchObject({ etat: "reprendre", prise_par_eleve: x.bilal.id });
    expect(await scene(x.s[3].id)).toMatchObject({ etat: "cours", prise_par_eleve: x.alice.id });
    // Rien à annuler deux fois
    expect((await laurent.base.rpc("annuler_retrait", { p_inscription: x.bilal.inscriptionId })).error?.message).toMatch(/ne peut plus être annulé/);
  });

  it("F01.1 — on ne retire que ses propres élèves : un autre enseignant, un poste, ne retirent personne", async () => {
    const x = await situation();
    expect(await retirer(martin, x.bilal.inscriptionId)).toMatch(/n'est plus inscrit/);
    const poste = await posteDe(x.classe.id, x.bilal.inscriptionId);
    expect((await (await poste.base()).rpc("retirer_eleve", { p_inscription: x.alice.inscriptionId })).error).not.toBeNull();
    expect((await attributions(x.lisiere))).toHaveLength(2);
  });
});

describe("Retirer un élève d'un chapitre (F06.3)", () => {
  it("F06.3 — un élève retiré d'un chapitre ne s'occupe plus des scènes qu'il écrivait, qui redeviennent « Pas encore prise » avec leur texte ; celles qu'il a remises ou finies gardent son prénom", async () => {
    const x = await situation();
    await travailDeBilal(x);
    await attribuer(laurent, x.lisiere, [{ eleve: x.alice.id }]);
    const [validee, aReprendre, aValider, enCours] = await Promise.all(x.s.map((s) => scene(s.id)));
    expect([validee.prise_par_eleve, aValider.prise_par_eleve]).toEqual([x.bilal.id, x.bilal.id]);
    expect(aReprendre).toMatchObject({ etat: "cours", prise_par_eleve: null });
    expect(enCours).toMatchObject({ etat: "cours", prise_par_eleve: null });
    expect(mots(enCours.texte)).toBe("Texte de la scène 4.");
  });
});
