import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, identifier, inscrire, nettoyer, ouvrirPoste, posteDe, service, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

/**
 * Étape 4 du plan, lot 2 : ce que l'élève fait de ses scènes (F06.3, F07.1, F07.3), contre
 * la vraie base locale. Chaque geste passe par une fonction que seul un poste appelle, et
 * qui relit qui est l'élève, s'il est du chapitre, et où en est la scène.
 */

let laurent: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;
let chloe: EleveEssai;
let pAlice: PosteEssai;
let pBilal: PosteEssai;
let pChloe: PosteEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  classe = await creerClasse(laurent);
  [alice, bilal, chloe] = await inscrire(laurent, classe.id, ["Alice", "Bilal", "Chloé"]);
  pAlice = await posteDe(classe.id, alice.inscriptionId);
  pBilal = await posteDe(classe.id, bilal.inscriptionId);
  pChloe = await posteDe(classe.id, chloe.inscriptionId);
});
afterAll(nettoyer);

type Bloc = { type: string; id: string; children: { text: string }[] };
const texte = (...paragraphes: string[]): Bloc[] => paragraphes.map((t) => ({ type: "p", id: randomUUID(), children: [{ text: t }] }));
const mots = (t: Bloc[]): string => t.map((b) => b.children.map((c) => c.text).join("")).join("\n");
type Ligne = { etat: string; version: number; tour: number; texte: Bloc[]; prise_par_eleve: string | null; prise_par_enseignant: boolean };
const scene = async (id: string): Promise<Ligne> =>
  (await sql<Ligne>("select etat, version, tour, texte, prise_par_eleve, prise_par_enseignant from public.scenes where id = $1", [id]))[0];
const qui = async (id: string): Promise<string | null> => (await scene(id)).prise_par_eleve;

/** « La lisière », où écrivent Alice et Bilal ; « Le sanctuaire », à Chloé. Les scènes sont libres. */
async function recit(scenes = 3): Promise<{ projet: string; lisiere: string; sanctuaire: string; s: SceneEssai[]; autel: SceneEssai }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  const sanctuaire = await creerChapitre(laurent, partieId, "Le sanctuaire");
  const s: SceneEssai[] = [];
  for (let i = 0; i < scenes; i += 1) s.push(await creerScene(laurent.base, chapitreId));
  const autel = await creerScene(laurent.base, sanctuaire);
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  await attribuer(laurent, sanctuaire, [{ eleve: chloe.id }]);
  return { projet: projet.id, lisiere: chapitreId, sanctuaire, s, autel };
}

const ecrire = async (sceneId: string, t: Bloc[]): Promise<number> => {
  const { version } = await scene(sceneId);
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: sceneId, p_version: version, p_texte: t });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(`Texte d'essai : ${error?.message ?? JSON.stringify(data)}`);
  return (data as { version: number }).version;
};
const confier = async (sceneId: string, a: EleveEssai | "moi" | null): Promise<void> => {
  const { error } = await laurent.base.from("scenes").update({ prise_par_enseignant: a === "moi", prise_par_eleve: a && a !== "moi" ? a.id : null }).eq("id", sceneId);
  if (error) throw new Error(error.message);
};
const etat = async (sceneId: string, voulu: string, remarque: string | null = null): Promise<void> => {
  const vu = await scene(sceneId);
  const { data, error } = await laurent.base.rpc("changer_etat", { p_scene: sceneId, p_etat: voulu, p_version: vu.version, p_tour: vu.tour, p_remarque: remarque });
  if (error || !(data as { fait: boolean }).fait) throw new Error(`État d'essai : ${error?.message ?? JSON.stringify(data)}`);
};

type Prises = { prises: string[]; changees: { scene: string; par: string | null; enseignant: boolean; etat: string }[] };
const prendre = async (poste: PosteEssai, scenes: { scene: string; vu?: string | null }[]) => {
  const { data, error } = await (await poste.base()).rpc("eleve_prendre", { p_scenes: scenes.map((x) => ({ scene: x.scene, vu: x.vu ?? null })) });
  return { fait: (data as Prises | null) ?? null, erreur: error?.message ?? null };
};
const appeler = async (poste: PosteEssai, fonction: string, sceneId: string): Promise<string | null> =>
  (await (await poste.base()).rpc(fonction, { p_scene: sceneId })).error?.message ?? null;
type Remise = { fait: boolean; motif?: string; avant?: string | null };
const remettre = async (poste: PosteEssai, sceneId: string, version?: number): Promise<Remise> => {
  const v = version ?? (await scene(sceneId)).version;
  const { data, error } = await (await poste.base()).rpc("eleve_remettre", { p_scene: sceneId, p_version: v });
  if (error) throw new Error(error.message);
  return data as Remise;
};
const remises = (sceneId: string) => sql<{ id: string; eleve_id: string; texte: Bloc[] }>("select id, eleve_id, texte from public.remises where scene_id = $1 order by remis_le", [sceneId]);
type Lue = { refus: string | null; texte: Bloc[]; prise_par_eleve: string | null; prise_par_enseignant: boolean };
const lire = async (poste: PosteEssai, sceneId: string): Promise<Lue | null> => ((await (await poste.base()).rpc("scene_du_poste", { p_scene: sceneId })).data as Lue | null) ?? null;
type Relecture = { etat: string; tour: number; remise: { par: string; le: string; texte: Bloc[] } | null; remarque: { texte: string; le: string; lue: boolean } | null };
const relecture = async (poste: PosteEssai, sceneId: string): Promise<Relecture | null> =>
  ((await (await poste.base()).rpc("relecture_du_poste", { p_scene: sceneId })).data as Relecture | null) ?? null;
/** Un texte de cet élève gardé à part sur la scène : il y est arrêté (F08.1). */
const arreter = (sceneId: string, eleve: EleveEssai) =>
  sql(
    `insert into public.copies_recuperation (scene_id, projet_id, enseignant_id, sorte, eleve_id, motif, texte)
     select id, projet_id, enseignant_id, 'refus', $2, 'conflit', $3::jsonb from public.scenes where id = $1`,
    [sceneId, eleve.id, JSON.stringify(texte("Une phrase gardée à part."))],
  );

describe("Prendre une scène, la rendre, la reprendre à un camarade (F06.3)", () => {
  it("F06-AC38, AC39, AC06 — plusieurs scènes dès la répartition : Alice en prend trois encore vides, sans que la suivante soit ajoutée ; le signalement tient d'une séance à l'autre", async () => {
    const { s } = await recit(4);
    const { fait } = await prendre(pAlice, s.slice(0, 3).map((x) => ({ scene: x.id })));
    expect(fait?.prises.sort()).toEqual(s.slice(0, 3).map((x) => x.id).sort());
    expect(fait?.changees).toEqual([]);
    expect(await Promise.all(s.map((x) => qui(x.id)))).toEqual([alice.id, alice.id, alice.id, null]);
    // Elle ferme sa session et revient sur un autre poste : le signalement est conservé (AC06)
    const autre = await ouvrirPoste(classe.id);
    await identifier(autre!, alice.inscriptionId);
    expect((await lire(autre!, s[0].id))?.prise_par_eleve).toBe(alice.id);
  });

  it("F06-AC04, F03-AC19 — signalement visible : Bilal voit qu'Alice prépare la scène, et la lire ne la lui transfère pas", async () => {
    const { s } = await recit(1);
    await prendre(pAlice, [{ scene: s[0].id }]);
    expect((await lire(pBilal, s[0].id))?.prise_par_eleve).toBe(alice.id);
    expect(await qui(s[0].id)).toBe(alice.id);
  });

  it("F06-AC40 — préparation sur papier et droits conservés : Alice signalée sur ses scènes, Bilal garde le droit d'y écrire, et rien ne s'ouvre dans un autre chapitre", async () => {
    const { s, autel } = await recit(2);
    await prendre(pAlice, s.map((x) => ({ scene: x.id })));
    expect((await lire(pBilal, s[0].id))?.refus).toBeNull();
    expect((await prendre(pAlice, [{ scene: autel.id }])).erreur).toMatch(/pas dans ton chapitre/);
    expect(await lire(pAlice, autel.id)).toBeNull();
  });

  it("F06-AC41, AC42, AC10 — reprise volontaire sans enseignant : tant que Bilal ne confirme pas, Alice reste signalée ; quand il confirme, il la remplace, le texte et les remises d'Alice restent", async () => {
    const { s } = await recit(1);
    await prendre(pAlice, [{ scene: s[0].id }]);
    await ecrire(s[0].id, texte("Le texte d'Alice."));
    await remettre(pAlice, s[0].id);
    await etat(s[0].id, "reprendre");
    // Il ouvre la scène et abandonne : rien ne change (AC41)
    await lire(pBilal, s[0].id);
    expect(await qui(s[0].id)).toBe(alice.id);
    // Il confirme : il remplace Alice, sans l'enseignante (AC42, AC10)
    const { fait } = await prendre(pBilal, [{ scene: s[0].id, vu: alice.id }]);
    expect(fait?.prises).toEqual([s[0].id]);
    expect(await qui(s[0].id)).toBe(bilal.id);
    expect(mots((await scene(s[0].id)).texte)).toBe("Le texte d'Alice.");
    expect((await remises(s[0].id)).map((r) => r.eleve_id)).toEqual([alice.id]);
    // Alice garde le droit d'écrire dans son chapitre
    expect((await lire(pAlice, s[0].id))?.refus).toBeNull();
  });

  it("F06-AC61 — répartition non exclusive : la scène donnée à Alice par le partage des fiches se reprend comme toute prise en charge ; Bilal, du même chapitre, est averti qu'Alice s'en occupe et la reprend à son nom ; l'enseignante peut retirer l'élève", async () => {
    const { s } = await recit(1);
    // Ce que fait « Répartir et imprimer » : la scène restée libre passe au nom de l'élève proposé
    const { data } = await laurent.base.from("scenes").update({ prise_par_eleve: alice.id }).eq("id", s[0].id).is("prise_par_eleve", null).select("id");
    expect(data).toHaveLength(1);
    // Bilal la croyait libre : il est averti, et rien ne change
    const averti = await prendre(pBilal, [{ scene: s[0].id }]);
    expect(averti.fait?.prises).toEqual([]);
    expect(averti.fait?.changees).toEqual([expect.objectContaining({ scene: s[0].id, par: alice.id })]);
    expect(await qui(s[0].id)).toBe(alice.id);
    // Il confirme : il remplace Alice, sans l'enseignante
    const repris = await prendre(pBilal, [{ scene: s[0].id, vu: alice.id }]);
    expect(repris.fait?.prises).toEqual([s[0].id]);
    expect(await qui(s[0].id)).toBe(bilal.id);
    // L'enseignante retire l'élève : « Pas encore prise »
    await confier(s[0].id, null);
    expect(await qui(s[0].id)).toBeNull();
    // Un partage ne donne pas une scène à un élève d'un autre chapitre
    const hors = await laurent.base.from("scenes").update({ prise_par_eleve: chloe.id }).eq("id", s[0].id).is("prise_par_eleve", null).select("id");
    expect(hors.error).not.toBeNull();
    expect(await qui(s[0].id)).toBeNull();
  });

  it("F06.3 — scène qui vient de changer de main : de plusieurs scènes cochées, l'élève reçoit celles qui sont restées comme sa page les montrait, et la réponse nomme l'autre", async () => {
    const { s } = await recit(3);
    // La page d'Alice montrait trois scènes libres ; Bilal vient d'en prendre une
    await prendre(pBilal, [{ scene: s[1].id }]);
    const { fait } = await prendre(pAlice, s.map((x) => ({ scene: x.id })));
    expect(fait?.prises.sort()).toEqual([s[0].id, s[2].id].sort());
    expect(fait?.changees).toEqual([expect.objectContaining({ scene: s[1].id, par: bilal.id })]);
    expect(await qui(s[1].id)).toBe(bilal.id);
  });

  it("F06-AC62 — scène de l'enseignant : un élève ne peut ni y écrire ni la reprendre à son nom ; rendue à Alice, elle s'écrit", async () => {
    const { s } = await recit(1);
    await confier(s[0].id, "moi");
    expect((await lire(pAlice, s[0].id))?.refus).toBe("scene");
    const { fait } = await prendre(pAlice, [{ scene: s[0].id }]);
    expect(fait?.prises).toEqual([]);
    expect(fait?.changees).toEqual([expect.objectContaining({ scene: s[0].id, enseignant: true })]);
    await confier(s[0].id, alice);
    expect((await lire(pAlice, s[0].id))?.refus).toBeNull();
  });

  it("F06-AC07 — retrait par l'enseignant : le signalement disparaît, le texte est conservé", async () => {
    const { s } = await recit(1);
    await prendre(pAlice, [{ scene: s[0].id }]);
    await ecrire(s[0].id, texte("Un texte enregistré."));
    await confier(s[0].id, null);
    const apres = await scene(s[0].id);
    expect(apres.prise_par_eleve).toBeNull();
    expect(mots(apres.texte)).toBe("Un texte enregistré.");
  });

  it("F06-AC64, AC65 — retrait de son signalement : tant que la scène s'écrit, Alice cesse de s'en occuper et peut toujours y écrire ; une fois remise, le retrait est refusé", async () => {
    const { s } = await recit(2);
    await prendre(pAlice, s.map((x) => ({ scene: x.id })));
    await ecrire(s[0].id, texte("Un texte."));
    expect(await appeler(pAlice, "eleve_rendre", s[0].id)).toBeNull();
    const apres = await scene(s[0].id);
    expect(apres.prise_par_eleve).toBeNull();
    expect(mots(apres.texte)).toBe("Un texte.");
    expect((await lire(pAlice, s[0].id))?.refus).toBeNull();
    // On ne rend que sa propre scène
    expect(await appeler(pBilal, "eleve_rendre", s[1].id)).toMatch(/ne peux pas rendre/);
    // « À valider » : l'élève signalé reste le repère du suivi (AC65)
    await ecrire(s[1].id, texte("Un texte."));
    await remettre(pAlice, s[1].id);
    expect(await appeler(pAlice, "eleve_rendre", s[1].id)).toMatch(/ne peux pas rendre/);
    expect(await qui(s[1].id)).toBe(alice.id);
  });

  it("F06-AC66 — reprise annulée : Alice prend la scène de Bilal puis annule aussitôt, Bilal est de nouveau signalé ; un retrait s'annule de même", async () => {
    const { s } = await recit(2);
    await prendre(pBilal, [{ scene: s[0].id }]);
    await ecrire(s[0].id, texte("Le texte de Bilal."));
    await prendre(pAlice, [{ scene: s[0].id, vu: bilal.id }]);
    expect(await qui(s[0].id)).toBe(alice.id);
    expect(await appeler(pAlice, "eleve_annuler_geste", s[0].id)).toBeNull();
    expect(await qui(s[0].id)).toBe(bilal.id);
    expect(mots((await scene(s[0].id)).texte)).toBe("Le texte de Bilal.");
    // Rien à annuler deux fois, ni à la place d'un autre
    expect(await appeler(pAlice, "eleve_annuler_geste", s[0].id)).toMatch(/ne peut plus être annulé/);
    // Un retrait annulé : elle s'en occupe de nouveau
    await prendre(pAlice, [{ scene: s[1].id }]);
    await appeler(pAlice, "eleve_rendre", s[1].id);
    expect(await qui(s[1].id)).toBeNull();
    expect(await appeler(pAlice, "eleve_annuler_geste", s[1].id)).toBeNull();
    expect(await qui(s[1].id)).toBe(alice.id);
  });

  it("F06-AC66 — rien à annuler si la scène a changé de main entre-temps : l'enseignante l'a confiée à un autre", async () => {
    const { s } = await recit(1);
    await prendre(pBilal, [{ scene: s[0].id }]);
    await prendre(pAlice, [{ scene: s[0].id, vu: bilal.id }]);
    await confier(s[0].id, bilal);
    await confier(s[0].id, alice);
    expect(await appeler(pAlice, "eleve_annuler_geste", s[0].id)).toMatch(/ne peut plus être annulé/);
    expect(await qui(s[0].id)).toBe(alice.id);
  });

  it("F08-AC31 — pas de prise en charge pendant l'arrêt : Bilal arrêté ne prend pas la scène d'Alice, Alice arrêtée ne rend pas la sienne", async () => {
    const { s } = await recit(2);
    await prendre(pAlice, s.map((x) => ({ scene: x.id })));
    await arreter(s[0].id, bilal);
    const { fait } = await prendre(pBilal, [{ scene: s[0].id, vu: alice.id }]);
    expect(fait?.prises).toEqual([]);
    expect(await qui(s[0].id)).toBe(alice.id);
    await arreter(s[1].id, alice);
    expect(await appeler(pAlice, "eleve_rendre", s[1].id)).toMatch(/ne peux pas rendre/);
    expect(await qui(s[1].id)).toBe(alice.id);
  });
});

describe("Remettre, retirer la remise (F07.1)", () => {
  it("F07-AC01, AC07 — soumission distincte de la validation : finir de saisir ne valide rien ; remettre conserve le texte et présente la scène à relire, sans la valider", async () => {
    const { s } = await recit(1);
    await prendre(pAlice, [{ scene: s[0].id }]);
    await ecrire(s[0].id, texte("Le texte recopié."));
    expect((await scene(s[0].id)).etat).toBe("cours");
    expect(await remettre(pAlice, s[0].id)).toMatchObject({ fait: true });
    expect((await scene(s[0].id)).etat).toBe("valider");
    expect((await remises(s[0].id)).map((r) => mots(r.texte))).toEqual(["Le texte recopié."]);
  });

  it("F07-AC19 — recopier sans consigne numérique : une scène sans consigne s'écrit et se remet", async () => {
    const { s } = await recit(1);
    expect((await lire(pAlice, s[0].id))?.refus).toBeNull();
    await ecrire(s[0].id, texte("Recopié depuis la fiche papier."));
    expect(await remettre(pAlice, s[0].id)).toMatchObject({ fait: true });
  });

  it("F07-AC08 — plusieurs remises conservées : A, puis B après une reprise, restent consultables séparément ; une correction de l'enseignante ne change ni l'une ni l'autre", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte A."));
    await remettre(pAlice, s[0].id);
    await etat(s[0].id, "reprendre", "Développe.");
    await ecrire(s[0].id, texte("Texte B."));
    await remettre(pAlice, s[0].id);
    await ecrire(s[0].id, texte("Texte B, corrigé."));
    expect((await remises(s[0].id)).map((r) => mots(r.texte))).toEqual(["Texte A.", "Texte B."]);
  });

  it("F07-AC09, AC30, AC13 — retrait autonome : « À valider », Alice lit sans écrire ; elle retire sa remise, la scène revient « En cours » avec les corrections déjà faites, et la remise reste", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte A."));
    await remettre(pAlice, s[0].id);
    expect((await lire(pAlice, s[0].id))?.refus).toBe("scene");
    await ecrire(s[0].id, texte("Texte B, corrigé par l'enseignante."));
    expect(await appeler(pAlice, "eleve_retirer_remise", s[0].id)).toBeNull();
    const lue = await lire(pAlice, s[0].id);
    expect(lue?.refus).toBeNull();
    expect(mots(lue!.texte)).toBe("Texte B, corrigé par l'enseignante.");
    expect((await scene(s[0].id)).etat).toBe("cours");
    expect((await remises(s[0].id)).map((r) => mots(r.texte))).toEqual(["Texte A."]);
  });

  it("F07-AC10 — transfert lors de la soumission : la scène signalée au nom d'Alice, que Bilal remet, passe à son nom ; Alice garde ses droits", async () => {
    const { s } = await recit(1);
    await prendre(pAlice, [{ scene: s[0].id }]);
    await ecrire(s[0].id, texte("Un texte à deux."));
    expect(await remettre(pBilal, s[0].id)).toMatchObject({ fait: true, avant: alice.id });
    expect(await qui(s[0].id)).toBe(bilal.id);
    expect((await remises(s[0].id))[0].eleve_id).toBe(bilal.id);
    await etat(s[0].id, "cours");
    expect((await lire(pAlice, s[0].id))?.refus).toBeNull();
  });

  it("F07-AC11, AC66 — travail élève terminé : une fois validé, l'élève ne retire plus sa remise et ne modifie plus le texte ; les remises restent", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte."));
    await remettre(pAlice, s[0].id);
    await etat(s[0].id, "valide");
    expect(await appeler(pAlice, "eleve_retirer_remise", s[0].id)).toMatch(/ne peut plus être modifié/);
    expect((await lire(pAlice, s[0].id))?.refus).toBe("scene");
    expect((await scene(s[0].id)).etat).toBe("valide");
    expect(await remises(s[0].id)).toHaveLength(1);
  });

  it("F07-AC12 — retrait par un camarade : Bilal retire la remise d'Alice sans elle ni l'enseignante ; Alice reste indiquée", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte."));
    await remettre(pAlice, s[0].id);
    expect(await appeler(pBilal, "eleve_retirer_remise", s[0].id)).toBeNull();
    const apres = await scene(s[0].id);
    expect(apres).toMatchObject({ etat: "cours", prise_par_eleve: alice.id });
    // Hors du chapitre, rien : Chloé ne retire pas une remise de « La lisière »
    await remettre(pAlice, s[0].id);
    expect(await appeler(pChloe, "eleve_retirer_remise", s[0].id)).toMatch(/pas dans ton chapitre/);
  });

  it("F07-AC28, AC29 — la remise porte sur le texte enregistré : si la version que la page présente n'est plus celle de la scène, rien n'est remis et la scène ne passe pas « À valider »", async () => {
    const { s } = await recit(1);
    const ancienne = await ecrire(s[0].id, texte("Texte."));
    await ecrire(s[0].id, texte("Texte, avec une phrase de plus."));
    expect(await remettre(pAlice, s[0].id, ancienne)).toMatchObject({ fait: false, motif: "conflit" });
    expect((await scene(s[0].id)).etat).toBe("cours");
    expect(await remises(s[0].id)).toHaveLength(0);
    // Avec la dernière saisie enregistrée, la remise la contient
    expect(await remettre(pAlice, s[0].id)).toMatchObject({ fait: true });
    expect(mots((await remises(s[0].id))[0].texte)).toBe("Texte, avec une phrase de plus.");
  });

  it("F07-AC67, F05-AC51 — un texte vide ne se remet pas, une scène qui ne porte qu'une note de l'enseignante non plus ; la note n'est jamais dans le texte remis", async () => {
    const { s } = await recit(1);
    expect(await remettre(pAlice, s[0].id)).toMatchObject({ fait: false, motif: "vide" });
    const note = { type: "note", id: randomUUID(), children: [{ text: "Penser à l'image du pont." }] };
    await ecrire(s[0].id, [note]);
    expect(await remettre(pAlice, s[0].id)).toMatchObject({ fait: false, motif: "vide" });
    await ecrire(s[0].id, [note, ...texte("Lou traverse le pont.")]);
    expect(await remettre(pAlice, s[0].id)).toMatchObject({ fait: true });
    expect((await remises(s[0].id))[0].texte.map((b) => b.type)).toEqual(["p"]);
  });

  it("F08-AC19 — scène remise entre-temps : Alice remet, la phrase que Bilal tape encore est gardée à part, il est arrêté et ne peut pas retirer la remise", async () => {
    const { s } = await recit(1);
    const version = await ecrire(s[0].id, texte("Le texte d'Alice."));
    const { data: ecriture } = await (await pBilal.base()).rpc("eleve_ouvrir_ecriture", { p_scene: s[0].id });
    await remettre(pAlice, s[0].id);
    const { data } = await service().rpc("ecriture_enregistrer", {
      p_ecriture: ecriture, p_jeton_hash: pBilal.jetonHash, p_version: version, p_texte: texte("Le texte d'Alice.", "Une phrase de Bilal."), p_refus: null,
    });
    expect(data).toMatchObject({ etat: "garde", motif: "scene" });
    const apres = await scene(s[0].id);
    expect(apres.etat).toBe("valider");
    expect(mots(apres.texte)).toBe("Le texte d'Alice.");
    expect(await appeler(pBilal, "eleve_retirer_remise", s[0].id)).toMatch(/ne peut plus être modifié/);
    expect(await remettre(pBilal, s[0].id)).toMatchObject({ fait: false });
  });

  it("F07.1 — ces gestes sont ceux d'un poste d'élève : l'adulte et un inconnu ne remettent ni ne prennent rien", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte."));
    const { error } = await laurent.base.rpc("eleve_remettre", { p_scene: s[0].id, p_version: (await scene(s[0].id)).version });
    expect(error).not.toBeNull();
    expect((await laurent.base.rpc("eleve_prendre", { p_scenes: [{ scene: s[0].id, vu: null }] })).error).not.toBeNull();
    expect((await scene(s[0].id)).etat).toBe("cours");
  });
});

describe("La remarque de l'enseignante, lue par les élèves du chapitre (F07.3)", () => {
  it("F07-AC16 — retour consultable par les contributeurs : Bilal, qui s'occupe de la scène, et Alice lisent la remarque ; Alice n'en devient pas responsable ; Chloé, hors du chapitre, ne lit rien", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte."));
    await remettre(pBilal, s[0].id);
    await etat(s[0].id, "reprendre", "Ajoute ce que Lou voit.");
    expect((await relecture(pBilal, s[0].id))?.remarque).toMatchObject({ texte: "Ajoute ce que Lou voit.", lue: false });
    expect((await relecture(pAlice, s[0].id))?.remarque).toMatchObject({ texte: "Ajoute ce que Lou voit." });
    expect(await qui(s[0].id)).toBe(bilal.id);
    expect(await relecture(pChloe, s[0].id)).toBeNull();
  });

  it("F07.3 — « J'ai lu, j'écris » : la remarque est notée lue par l'élève qui s'occupe de la scène, et par lui seul", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte."));
    await remettre(pBilal, s[0].id);
    await etat(s[0].id, "reprendre", "Ajoute ce que Lou voit.");
    await appeler(pAlice, "eleve_lire_remarque", s[0].id);
    expect((await relecture(pBilal, s[0].id))?.remarque?.lue).toBe(false);
    await appeler(pBilal, "eleve_lire_remarque", s[0].id);
    expect((await relecture(pBilal, s[0].id))?.remarque?.lue).toBe(true);
  });

  it("F07-AC24, AC25 — reprise sans échange écrit : la nouvelle remise ne porte aucune note de l'élève ; la remarque reste lisible après elle, et ne se lit plus une fois la scène validée", async () => {
    const { s } = await recit(1);
    await ecrire(s[0].id, texte("Texte A."));
    await remettre(pAlice, s[0].id);
    await etat(s[0].id, "reprendre", "Développe la description.");
    await ecrire(s[0].id, texte("Texte B."));
    expect(await remettre(pAlice, s[0].id)).toEqual({ fait: true, avant: null });
    const lue = await relecture(pAlice, s[0].id);
    expect(lue).toMatchObject({ etat: "valider", remarque: { texte: "Développe la description." } });
    expect(mots(lue!.remise!.texte)).toBe("Texte B.");
    await etat(s[0].id, "valide");
    expect((await relecture(pAlice, s[0].id))?.remarque).toBeNull();
  });
});
