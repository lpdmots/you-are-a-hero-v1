import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inconnu, inscrire, lire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

/**
 * Étape 4 du plan, lot 6 : les encouragements de l'enseignant et le classement (F07.5),
 * contre la vraie base locale. L'adulte donne et retire par une fonction ; le poste d'un
 * élève ne lit jamais la table, seulement ce que sa fonction lui rend.
 */

let laurent: Adulte;
let martin: Adulte;
afterAll(nettoyer);
beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
});

const texte = (t: string) => [{ type: "p", id: randomUUID(), children: [{ text: t }] }];
type Recu = { tampons: { scene: string; categorie: string }[]; classement: Record<string, { total: number; eleves: string[] }[]> | null };
const recu = async (poste: PosteEssai, projet: string): Promise<Recu | null> =>
  ((await (await poste.base()).rpc("mes_encouragements", { p_projet: projet })).data as Recu | null) ?? null;
const encourager = async (adulte: Adulte, scene: string, categorie: string, donner = true): Promise<string | null> =>
  (await adulte.base.rpc("encourager", { p_scene: scene, p_categorie: categorie, p_donner: donner })).error?.message ?? null;
const donnes = (scene: string) =>
  sql<{ eleve_id: string; categorie: string }>("select eleve_id, categorie from public.encouragements where scene_id = $1 order by donne_le, categorie", [scene]);
const total = async (projet: string, eleve: string, categorie: string): Promise<number> =>
  (await sql<{ n: number }>("select count(*)::int as n from public.encouragements where projet_id = $1 and eleve_id = $2 and categorie = $3", [projet, eleve, categorie]))[0].n;

type Situation = { classe: ClasseEssai; eleves: Record<string, EleveEssai>; projet: string; lisiere: string; sanctuaire: string; s: SceneEssai[]; autel: SceneEssai };

/** « La lisière », où écrivent Alice et Bilal, avec `scenes` scènes écrites, au nom de Bilal ; « Le sanctuaire », à Chloé. */
async function situation(prenoms = ["Alice", "Bilal", "Chloé"], scenes = 3): Promise<Situation> {
  const classe = await creerClasse(laurent);
  const inscrits = await inscrire(laurent, classe.id, prenoms);
  const eleves = Object.fromEntries(inscrits.map((e) => [e.prenom, e]));
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const { data: autre } = await laurent.base.rpc("creer_chapitre", { p_partie: partieId, p_titre: "Le sanctuaire", p_couleur: 2, p_visuel: "foret" });
  const sanctuaire = autre as string;
  await attribuer(laurent, chapitreId, [{ eleve: eleves.Alice.id }, { eleve: eleves.Bilal.id }]);
  if (eleves.Chloé) await attribuer(laurent, sanctuaire, [{ eleve: eleves.Chloé.id }]);
  const s: SceneEssai[] = [];
  for (let i = 0; i < scenes; i += 1) {
    const cree = await creerScene(laurent.base, chapitreId);
    await laurent.base.from("scenes").update({ prise_par_eleve: eleves.Bilal.id }).eq("id", cree.id);
    await laurent.base.rpc("enregistrer_texte", { p_scene: cree.id, p_version: 0, p_texte: texte(`Texte de la scène ${i + 1}.`) });
    s.push(cree);
  }
  const autel = await creerScene(laurent.base, sanctuaire);
  return { classe, eleves, projet: projet.id, lisiere: chapitreId, sanctuaire, s, autel };
}

describe("Donner et retirer un encouragement (F07.5)", () => {
  it("F07-AC50, AC76, AC77 — « Effort » puis « Créativité » : la scène porte les deux tampons, les totaux de Bilal montent chacun de un ; « Effort » donné deux fois ne compte qu'une fois ; retiré, son total redescend ; la scène est toujours « En cours »", async () => {
    const { s, eleves, projet } = await situation();
    expect(await encourager(laurent, s[0].id, "effort")).toBeNull();
    expect(await encourager(laurent, s[0].id, "creativite")).toBeNull();
    expect((await donnes(s[0].id)).map((d) => d.categorie).sort()).toEqual(["creativite", "effort"]);
    expect(await total(projet, eleves.Bilal.id, "effort")).toBe(1);
    expect(await total(projet, eleves.Bilal.id, "creativite")).toBe(1);
    // Un par catégorie (AC77) : le donner de nouveau ne fait rien
    expect(await encourager(laurent, s[0].id, "effort")).toBeNull();
    expect(await total(projet, eleves.Bilal.id, "effort")).toBe(1);
    // Un second clic retire
    expect(await encourager(laurent, s[0].id, "effort", false)).toBeNull();
    expect(await total(projet, eleves.Bilal.id, "effort")).toBe(0);
    expect(await total(projet, eleves.Bilal.id, "creativite")).toBe(1);
    expect((await sql<{ etat: string }>("select etat from public.scenes where id = $1", [s[0].id]))[0].etat).toBe("cours");
  });

  it("F07-AC78 — l'encouragement reste à son élève : Alice a reçu « Effort », Bilal reprend la scène ; le total d'Alice ne change pas, et « Effort » se donne aussi à Bilal", async () => {
    const { s, eleves, projet } = await situation();
    await laurent.base.from("scenes").update({ prise_par_eleve: eleves.Alice.id }).eq("id", s[0].id);
    expect(await encourager(laurent, s[0].id, "effort")).toBeNull();
    await laurent.base.from("scenes").update({ prise_par_eleve: eleves.Bilal.id }).eq("id", s[0].id);
    expect(await total(projet, eleves.Alice.id, "effort")).toBe(1);
    expect(await encourager(laurent, s[0].id, "effort")).toBeNull();
    expect((await donnes(s[0].id)).map((d) => d.eleve_id).sort()).toEqual([eleves.Alice.id, eleves.Bilal.id].sort());
    // Retirer celui de Bilal ne touche pas à celui d'Alice
    expect(await encourager(laurent, s[0].id, "effort", false)).toBeNull();
    expect((await donnes(s[0].id)).map((d) => d.eleve_id)).toEqual([eleves.Alice.id]);
  });

  it("F07-AC79 — personne à encourager : aucun tampon sur une scène sans élève, sur celle que l'enseignante s'est attribuée, ni sur un texte vide", async () => {
    const { s, autel, eleves } = await situation();
    // Sans élève
    expect(await encourager(laurent, autel.id, "effort")).toMatch(/Aucun élève/);
    // À l'enseignante
    await laurent.base.from("scenes").update({ prise_par_eleve: null, prise_par_enseignant: true }).eq("id", s[0].id);
    expect(await encourager(laurent, s[0].id, "effort")).toMatch(/Aucun élève/);
    // Texte vide, dont Bilal s'occupe
    const vide = await creerScene(laurent.base, (await sql<{ chapitre_id: string }>("select chapitre_id from public.scenes where id = $1", [s[1].id]))[0].chapitre_id);
    await laurent.base.from("scenes").update({ prise_par_eleve: eleves.Bilal.id }).eq("id", vide.id);
    expect(await encourager(laurent, vide.id, "plume")).toMatch(/pas encore de texte/);
    expect(await donnes(autel.id)).toHaveLength(0);
    expect(await donnes(vide.id)).toHaveLength(0);
    // Une catégorie inconnue n'existe pas
    expect(await encourager(laurent, s[1].id, "coeur")).toMatch(/n'existe pas/);
  });

  it("F07.5 — droits : un autre enseignant ne donne rien et ne lit rien ; un poste, un inconnu ne lisent pas la table et ne donnent rien ; pas d'encouragement en projet personnel", async () => {
    const { s, eleves, classe } = await situation();
    expect(await encourager(laurent, s[0].id, "effort")).toBeNull();
    expect(await encourager(martin, s[0].id, "plume")).toMatch(/n'existe plus/);
    expect((await lire(martin.base, "encouragements")).lignes).toHaveLength(0);
    const pBilal = await posteDe(classe.id, eleves.Bilal.inscriptionId);
    const poste = await pBilal.base();
    expect((await lire(poste, "encouragements")).refus).not.toBeNull();
    expect((await poste.rpc("encourager", { p_scene: s[0].id, p_categorie: "plume", p_donner: true })).error).not.toBeNull();
    expect((await lire(inconnu(), "encouragements")).refus).not.toBeNull();
    expect((await inconnu().rpc("mes_encouragements", { p_projet: randomUUID() })).error).not.toBeNull();
    // L'adulte n'écrit pas dans la table sans la fonction
    const direct = await laurent.base.from("encouragements").delete().eq("scene_id", s[0].id).select("id");
    expect(direct.error ?? direct.data?.length === 0).toBeTruthy();
    expect(await donnes(s[0].id)).toHaveLength(1);
    // Projet personnel
    const perso = await creerProjet(laurent, "personnel", "classique", "Mon roman");
    const { chapitreId } = await creerPartie(laurent, perso.id, "Le début", "Chapitre un");
    const seule = await creerScene(laurent.base, chapitreId);
    await laurent.base.rpc("enregistrer_texte", { p_scene: seule.id, p_version: 0, p_texte: texte("Un texte.") });
    expect(await encourager(laurent, seule.id, "effort")).not.toBeNull();
  });
});

describe("Ce que l'élève reçoit (F07.5)", () => {
  it("F07-AC80, AC81, AC82 — rien tant qu'il n'y a rien ; puis Bilal reçoit ses tampons par scène, et Alice, du même chapitre, ne reçoit rien de ceux de Bilal", async () => {
    const { s, eleves, classe, projet } = await situation();
    const pBilal = await posteDe(classe.id, eleves.Bilal.inscriptionId);
    const pAlice = await posteDe(classe.id, eleves.Alice.inscriptionId);
    expect(await recu(pBilal, projet)).toEqual({ tampons: [], classement: null });
    await encourager(laurent, s[0].id, "effort");
    await encourager(laurent, s[0].id, "plume");
    await encourager(laurent, s[1].id, "effort");
    const deBilal = await recu(pBilal, projet);
    expect(deBilal?.tampons.map((t) => `${t.scene}:${t.categorie}`).sort()).toEqual([`${s[0].id}:effort`, `${s[0].id}:plume`, `${s[1].id}:effort`].sort());
    expect(deBilal?.classement).toBeNull();
    // Alice lit la scène de Bilal : rien de ce que son poste reçoit ne dit ses encouragements
    expect(await recu(pAlice, projet)).toEqual({ tampons: [], classement: null });
    const scene = (await (await pAlice.base()).rpc("scene_du_poste", { p_scene: s[0].id })).data;
    expect(JSON.stringify(scene)).not.toMatch(/effort|plume|encourag/);
    // Un projet d'une autre classe ne rend rien
    expect(await recu(pBilal, randomUUID())).toBeNull();
  });

  it("F07-AC51, AC83, AC86 — classement montré : pour chaque catégorie, les trois meilleurs totaux, ex æquo compris ; Chloé, quatrième, ne reçoit que ces trois marches, et le total d'aucun élève au-delà", async () => {
    const { eleves, classe, projet, lisiere } = await situation(["Alice", "Bilal", "Chloé", "Jade", "Lina", "Noé"], 0);
    await attribuer(laurent, lisiere, ["Alice", "Bilal", "Chloé", "Jade", "Lina", "Noé"].map((p) => ({ eleve: eleves[p].id })));
    // Effort : Lina 4, Bilal 3, Alice 3, Jade 2, Chloé 1, Noé 0
    const donner = async (prenom: string, combien: number, categorie = "effort") => {
      for (let i = 0; i < combien; i += 1) {
        const cree = await creerScene(laurent.base, lisiere);
        await laurent.base.from("scenes").update({ prise_par_eleve: eleves[prenom].id }).eq("id", cree.id);
        await laurent.base.rpc("enregistrer_texte", { p_scene: cree.id, p_version: 0, p_texte: texte("Un texte.") });
        expect(await encourager(laurent, cree.id, categorie)).toBeNull();
      }
    };
    await donner("Lina", 4);
    await donner("Bilal", 3);
    await donner("Alice", 3);
    await donner("Jade", 2);
    await donner("Chloé", 1);
    await donner("Chloé", 2, "plume");
    const pChloe = await posteDe(classe.id, eleves.Chloé.inscriptionId);
    // Éteint par défaut (AC51) : ses tampons, aucun total d'un camarade
    const eteint = await recu(pChloe, projet);
    expect(eteint?.classement).toBeNull();
    expect(eteint?.tampons).toHaveLength(3);
    expect(JSON.stringify(eteint)).not.toContain(eleves.Lina.id);
    // Allumé par l'enseignante
    expect((await laurent.base.from("projets").update({ classement_montre: true }).eq("id", projet).select("id")).data).toHaveLength(1);
    const allume = await recu(pChloe, projet);
    expect(allume?.classement?.effort).toEqual([
      { total: 4, eleves: [eleves.Lina.id] },
      { total: 3, eleves: [eleves.Alice.id, eleves.Bilal.id].sort() },
      { total: 2, eleves: [eleves.Jade.id] },
    ]);
    // Chloé, à 1, n'y est pas ; son propre total lui vient de ses tampons
    expect(JSON.stringify(allume?.classement?.effort)).not.toContain(eleves.Chloé.id);
    expect(allume?.classement?.plume).toEqual([{ total: 2, eleves: [eleves.Chloé.id] }]);
    // Aucune catégorie sans tampon, aucun total général, et Noé, sans tampon, nulle part
    expect(Object.keys(allume?.classement ?? {}).sort()).toEqual(["effort", "plume"]);
    expect(JSON.stringify(allume)).not.toContain(eleves.Noé.id);
    // Un élève retiré de la classe garde ses tampons et sort du classement
    await laurent.base.rpc("retirer_eleve", { p_inscription: eleves.Lina.inscriptionId });
    const apres = await recu(pChloe, projet);
    expect(apres?.classement?.effort.map((m) => m.total)).toEqual([3, 2, 1]);
    expect(await total(projet, eleves.Lina.id, "effort")).toBe(4);
    // Un poste ne règle pas le classement
    const poste = await pChloe.base();
    await poste.from("projets").update({ classement_montre: false }).eq("id", projet);
    expect((await sql<{ m: boolean }>("select classement_montre as m from public.projets where id = $1", [projet]))[0].m).toBe(true);
  });

  it("F07-AC85 — par projet : les trois tampons de Bilal restent dans « Les passeurs de brume » ; dans un second projet de la même classe, il part de zéro", async () => {
    const { s, eleves, classe, projet } = await situation();
    for (const c of ["effort", "plume", "creativite"]) expect(await encourager(laurent, s[0].id, c)).toBeNull();
    const second = await creerProjet(laurent, "classe", "classique", "Le second livre", classe.id);
    const pBilal = await posteDe(classe.id, eleves.Bilal.inscriptionId);
    expect((await recu(pBilal, second.id))?.tampons).toEqual([]);
    expect((await recu(pBilal, projet))?.tampons).toHaveLength(3);
  });

  it("F07.5 — scène supprimée définitivement, élève supprimé : leurs tampons partent avec eux", async () => {
    const { s, projet } = await situation();
    await encourager(laurent, s[0].id, "effort");
    await encourager(laurent, s[1].id, "effort");
    await sql("delete from public.scenes where id = $1", [s[0].id]);
    expect((await sql("select 1 from public.encouragements where projet_id = $1", [projet]))).toHaveLength(1);
  });
});
