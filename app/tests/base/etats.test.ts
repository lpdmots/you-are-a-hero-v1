import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, lire, nettoyer, posteDe, service, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

/**
 * Étape 4 du plan, lot 1 : l'état d'une scène et la relecture de l'enseignant (F07.1,
 * F07.3, F11.1), contre la vraie base locale. Les remises des élèves se construisent au
 * lot 2 : ici, une remise est posée directement dans la base, telle que la fonction de
 * l'élève la posera.
 */

let laurent: Adulte;
let martin: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  [alice, bilal] = await inscrire(laurent, classe.id, ["Alice", "Bilal"]);
});
afterAll(nettoyer);

type Bloc = { type: "p"; id: string; children: { text: string }[] };
const texte = (...paragraphes: string[]): Bloc[] => paragraphes.map((t) => ({ type: "p", id: randomUUID(), children: [{ text: t }] }));
const mots = (t: Bloc[]): string => t.map((b) => b.children.map((c) => c.text).join("")).join("\n");
type Suite = { fait: boolean; suspendu: boolean; etat: string; version: number; tour: number };
type Ligne = { etat: string; version: number; tour: number; texte: Bloc[]; prise_par_eleve: string | null; prise_par_enseignant: boolean };

/** « La lisière », où écrivent Alice et Bilal : des scènes dont Alice s'occupe, sauf mention. */
async function lisiere(scenes = 1, prises: (EleveEssai | null)[] = []): Promise<{ projet: string; chapitre: string; s: SceneEssai[] }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  const s: SceneEssai[] = [];
  for (let i = 0; i < scenes; i += 1) {
    const scene = await creerScene(laurent.base, chapitreId);
    const eleve = i < prises.length ? prises[i] : alice;
    if (eleve) await laurent.base.from("scenes").update({ prise_par_eleve: eleve.id }).eq("id", scene.id);
    s.push(scene);
  }
  return { projet: projet.id, chapitre: chapitreId, s };
}

const scene = async (id: string): Promise<Ligne> =>
  (await sql<Ligne>("select etat, version, tour, texte, prise_par_eleve, prise_par_enseignant from public.scenes where id = $1", [id]))[0];

/** L'enseignant choisit un état, d'après le texte et l'état que sa page montre. */
async function choisir(adulte: Adulte, sceneId: string, etat: string, lu?: { version: number; tour: number }, remarque: string | null = null) {
  const vu = lu ?? (await scene(sceneId));
  const { data, error } = await adulte.base.rpc("changer_etat", { p_scene: sceneId, p_etat: etat, p_version: vu.version, p_tour: vu.tour, p_remarque: remarque });
  return { suite: (data as Suite | null) ?? null, erreur: error?.message ?? null };
}
const ecrire = async (adulte: Adulte, sceneId: string, t: Bloc[]): Promise<void> => {
  const { version } = await scene(sceneId);
  const { data, error } = await adulte.base.rpc("enregistrer_texte", { p_scene: sceneId, p_version: version, p_texte: t });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(`Texte d'essai : ${error?.message ?? JSON.stringify(data)}`);
};
/** Ce que fera « Remettre » au lot 2 : le texte est conservé, la scène passe « À valider », le soumetteur s'en occupe. */
async function remettre(sceneId: string, eleve: EleveEssai): Promise<string> {
  const [r] = await sql<{ id: string }>(
    `with s as (
       update public.scenes set etat = 'valider', tour = tour + 1, prise_par_eleve = $2 where id = $1
       returning id, projet_id, enseignant_id, texte)
     insert into public.remises (scene_id, projet_id, enseignant_id, eleve_id, texte)
     select id, projet_id, enseignant_id, $2, texte from s returning id`,
    [sceneId, eleve.id],
  );
  return r.id;
}
const remises = (sceneId: string) => sql<{ id: string; eleve_id: string; texte: Bloc[] }>("select id, eleve_id, texte from public.remises where scene_id = $1 order by remis_le", [sceneId]);
const remarques = (sceneId: string) =>
  sql<{ id: string; remise_id: string | null; eleve_id: string | null; texte: string }>("select id, remise_id, eleve_id, texte from public.remarques where scene_id = $1 order by cree_le", [sceneId]);
/** Ce que la base répond à un élève qui ouvre la scène : rien dans « refus » s'il peut y écrire. */
const refusPour = async (poste: PosteEssai, sceneId: string): Promise<string | null> => {
  const { data, error } = await (await poste.base()).rpc("scene_du_poste", { p_scene: sceneId });
  if (error) throw new Error(error.message);
  return (data as { refus: string | null }).refus;
};

describe("L'enseignant a la main sur l'état de la scène (F07.1)", () => {
  it("F07-AC02 — validation sans révision imposée : une scène remise se valide sans qu'aucune reprise ait été demandée", async () => {
    const { s } = await lisiere();
    await ecrire(laurent, s[0].id, texte("Lou entre dans la forêt."));
    await remettre(s[0].id, alice);
    const { suite } = await choisir(laurent, s[0].id, "valide");
    expect(suite).toMatchObject({ fait: true, etat: "valide" });
    expect((await scene(s[0].id)).etat).toBe("valide");
    expect(await remarques(s[0].id)).toHaveLength(0);
  });

  it("F07-AC04 — validation indépendante : neuf scènes validées, la dixième reste à reprendre", async () => {
    const { s } = await lisiere(3);
    for (const x of s) {
      await ecrire(laurent, x.id, texte("Un texte."));
      await remettre(x.id, alice);
    }
    await choisir(laurent, s[0].id, "valide");
    await choisir(laurent, s[1].id, "valide");
    await choisir(laurent, s[2].id, "reprendre");
    expect((await Promise.all(s.map((x) => scene(x.id)))).map((x) => x.etat)).toEqual(["valide", "valide", "reprendre"]);
  });

  it("F07-AC05, AC31 — correction directe : l'enseignant corrige le texte, avant comme après une remise, sans créer de remise ni changer l'état ; le texte remis reste tel quel", async () => {
    const { s } = await lisiere();
    // Avant toute remise : un brouillon corrigé reste un brouillon (AC31)
    await ecrire(laurent, s[0].id, texte("Lou entre dans la foret."));
    await ecrire(laurent, s[0].id, texte("Lou entre dans la forêt."));
    expect(await remises(s[0].id)).toHaveLength(0);
    expect((await scene(s[0].id)).etat).toBe("cours");
    // Après une remise : la correction ne touche pas au texte remis (AC05)
    await remettre(s[0].id, alice);
    await ecrire(laurent, s[0].id, texte("Lou entre dans la forêt, sa lanterne à la main."));
    const [remise] = await remises(s[0].id);
    expect(mots(remise.texte)).toBe("Lou entre dans la forêt.");
    expect((await scene(s[0].id)).etat).toBe("valider");
  });

  it("F07-AC14, AC23 — demande de révision : la scène passe « À reprendre », les élèves du chapitre peuvent y écrire, et ils reprennent le texte corrigé, non le texte remis", async () => {
    const { s } = await lisiere();
    const posteAlice = await posteDe(classe.id, alice.inscriptionId);
    const posteBilal = await posteDe(classe.id, bilal.inscriptionId);
    await ecrire(laurent, s[0].id, texte("Texte A."));
    await remettre(s[0].id, alice);
    expect(await refusPour(posteAlice, s[0].id)).toBe("scene");
    await ecrire(laurent, s[0].id, texte("Texte B, corrigé deux fois."));
    const { suite } = await choisir(laurent, s[0].id, "reprendre", undefined, "Développe la description.");
    expect(suite).toMatchObject({ fait: true, etat: "reprendre" });
    expect(await refusPour(posteAlice, s[0].id)).toBeNull();
    expect(await refusPour(posteBilal, s[0].id)).toBeNull();
    const lue = (await (await posteAlice.base()).rpc("scene_du_poste", { p_scene: s[0].id })).data as { texte: Bloc[] };
    expect(mots(lue.texte)).toBe("Texte B, corrigé deux fois.");
    expect(mots((await remises(s[0].id))[0].texte)).toBe("Texte A.");
  });

  it("F07-AC03 — texte validé protégé : l'enregistrement d'un élève dans une scène validée ne remplace pas le texte", async () => {
    const { s } = await lisiere();
    const poste = await posteDe(classe.id, alice.inscriptionId);
    await ecrire(laurent, s[0].id, texte("Le texte validé."));
    const { data: ecriture } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: s[0].id });
    await remettre(s[0].id, alice);
    await choisir(laurent, s[0].id, "valide");
    const { version } = await scene(s[0].id);
    const { data } = await service().rpc("ecriture_enregistrer", {
      p_ecriture: ecriture, p_jeton_hash: poste.jetonHash, p_version: version, p_texte: texte("Un autre texte."), p_refus: null,
    });
    expect((data as { etat: string; motif: string }).etat).toBe("garde");
    expect(mots((await scene(s[0].id)).texte)).toBe("Le texte validé.");
    // Une scène validée ne s'ouvre plus pour écrire
    expect((await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: s[0].id })).data).toBeNull();
  });

  it("F07-AC26 — validation fondée sur le texte examiné : si le texte ou l'état a changé depuis la lecture, rien n'est validé et la réponse le dit", async () => {
    const { s } = await lisiere();
    await ecrire(laurent, s[0].id, texte("Texte remis."));
    await remettre(s[0].id, alice);
    const lu = await scene(s[0].id);
    // Alice retire sa remise et modifie le texte depuis une autre session
    await sql("update public.scenes set etat = 'cours', tour = tour + 1 where id = $1", [s[0].id]);
    await ecrire(laurent, s[0].id, texte("Texte modifié entre-temps."));
    const { suite } = await choisir(laurent, s[0].id, "valide", { version: lu.version, tour: lu.tour });
    expect(suite).toMatchObject({ fait: false, suspendu: true, etat: "cours" });
    expect((await scene(s[0].id)).etat).toBe("cours");
    // Un retrait seul, sans modification du texte, suspend aussi : l'état n'est plus celui examiné
    await remettre(s[0].id, alice);
    const relu = await scene(s[0].id);
    await sql("update public.scenes set etat = 'cours', tour = tour + 1 where id = $1", [s[0].id]);
    expect((await choisir(laurent, s[0].id, "prete", { version: relu.version, tour: relu.tour })).suite).toMatchObject({ fait: false, suspendu: true });
    // Avec le texte et l'état à jour, la décision passe
    expect((await choisir(laurent, s[0].id, "valide")).suite).toMatchObject({ fait: true, etat: "valide" });
  });

  it("F07-AC27, F11-AC24 — nouvelle reprise après validation : « À reprendre » depuis « Validé » ou « Prête » garde les retouches et les remises ; la scène n'est plus prête", async () => {
    const { s } = await lisiere();
    await ecrire(laurent, s[0].id, texte("Texte remis."));
    await remettre(s[0].id, alice);
    await choisir(laurent, s[0].id, "prete");
    await ecrire(laurent, s[0].id, texte("Texte remis, retouché par l'enseignante."));
    expect((await choisir(laurent, s[0].id, "reprendre")).suite).toMatchObject({ fait: true, etat: "reprendre" });
    const apres = await scene(s[0].id);
    expect(apres.etat).toBe("reprendre");
    expect(mots(apres.texte)).toBe("Texte remis, retouché par l'enseignante.");
    expect(await remises(s[0].id)).toHaveLength(1);
    // Une nouvelle remise passe « À valider » et demande une nouvelle validation
    await remettre(s[0].id, alice);
    expect((await scene(s[0].id)).etat).toBe("valider");
    expect(await remises(s[0].id)).toHaveLength(2);
  });

  it("F07-AC61, F06-AC47 — finir à la place de l'élève : « Validé » depuis « À reprendre », sans nouvelle remise ; l'élève reste indiqué", async () => {
    const { s } = await lisiere();
    await ecrire(laurent, s[0].id, texte("Début."));
    await remettre(s[0].id, alice);
    await choisir(laurent, s[0].id, "reprendre");
    await ecrire(laurent, s[0].id, texte("Début, et la fin écrite par l'enseignante."));
    expect((await choisir(laurent, s[0].id, "valide")).suite).toMatchObject({ fait: true, etat: "valide" });
    const apres = await scene(s[0].id);
    expect(apres.prise_par_eleve).toBe(alice.id);
    expect(await remises(s[0].id)).toHaveLength(1);
  });

  it("F07-AC62 — annuler une validation : « À valider » depuis « Validé » garde la remise, et les élèves ne peuvent toujours pas écrire", async () => {
    const { s } = await lisiere();
    const poste = await posteDe(classe.id, alice.inscriptionId);
    await ecrire(laurent, s[0].id, texte("Texte."));
    await remettre(s[0].id, alice);
    await choisir(laurent, s[0].id, "valide");
    expect((await choisir(laurent, s[0].id, "valider")).suite).toMatchObject({ fait: true, etat: "valider" });
    expect(await remises(s[0].id)).toHaveLength(1);
    expect(await refusPour(poste, s[0].id)).toBe("scene");
  });

  it("F07-AC63 — de « À valider » à « Prête », d'un seul geste", async () => {
    const { s } = await lisiere();
    await ecrire(laurent, s[0].id, texte("Texte."));
    await remettre(s[0].id, alice);
    expect((await choisir(laurent, s[0].id, "prete")).suite).toMatchObject({ fait: true, etat: "prete" });
  });

  it("F07-AC64 — « À valider » sans remise : la scène prend cet état sans qu'aucune remise soit créée, et l'élève la lit sans pouvoir l'écrire", async () => {
    const { s } = await lisiere();
    const poste = await posteDe(classe.id, alice.inscriptionId);
    await ecrire(laurent, s[0].id, texte("Un début."));
    expect(await refusPour(poste, s[0].id)).toBeNull();
    expect((await choisir(laurent, s[0].id, "valider")).suite).toMatchObject({ fait: true, etat: "valider" });
    expect(await remises(s[0].id)).toHaveLength(0);
    expect(await refusPour(poste, s[0].id)).toBe("scene");
  });

  it("F07.1 — l'état est celui de l'enseignant : ni un autre enseignant, ni un poste, ni une écriture directe ne le changent", async () => {
    const { s } = await lisiere();
    const poste = await posteDe(classe.id, alice.inscriptionId);
    expect((await choisir(martin, s[0].id, "valide")).erreur).toMatch(/n'existe plus/);
    const duPoste = await (await poste.base()).rpc("changer_etat", { p_scene: s[0].id, p_etat: "valide", p_version: 0, p_tour: 0, p_remarque: null });
    expect(duPoste.error).not.toBeNull();
    const directe = await laurent.base.from("scenes").update({ etat: "prete" }).eq("id", s[0].id).select("id");
    expect(directe.error).not.toBeNull();
    expect((await scene(s[0].id)).etat).toBe("cours");
    expect((await choisir(laurent, s[0].id, "termine")).erreur).toMatch(/état/);
    // Les remises et les remarques ne se lisent pas depuis un poste
    expect((await lire(await poste.base(), "remises")).refus).not.toBeNull();
    expect((await lire(await poste.base(), "remarques")).refus).not.toBeNull();
  });
});

describe("Remarque de reprise (F07.3)", () => {
  it("F07-AC15 — remarque de scène : elle s'attache à la scène, à sa dernière remise et à l'élève qui s'en occupe ; sans remarque écrite, la demande est gardée quand même", async () => {
    const { s } = await lisiere(2, [bilal, bilal]);
    await ecrire(laurent, s[0].id, texte("Texte."));
    const remise = await remettre(s[0].id, bilal);
    await choisir(laurent, s[0].id, "reprendre", undefined, "  Ajoute ce que Lou voit à la lueur de la lanterne.  ");
    expect(await remarques(s[0].id)).toEqual([expect.objectContaining({ remise_id: remise, eleve_id: bilal.id, texte: "Ajoute ce que Lou voit à la lueur de la lanterne." })]);
    // Facultative : la reprise se demande sans rien écrire (4 octobre 2026)
    await choisir(laurent, s[1].id, "valider");
    await choisir(laurent, s[1].id, "reprendre");
    expect(await remarques(s[1].id)).toEqual([expect.objectContaining({ remise_id: null, eleve_id: bilal.id, texte: "" })]);
  });

  it("F07-AC25 — retours conservés avec leur remise : la remarque sur A reste avec A quand l'élève remet B, et B n'en porte aucune", async () => {
    const { s } = await lisiere();
    await ecrire(laurent, s[0].id, texte("Texte A."));
    const a = await remettre(s[0].id, alice);
    await choisir(laurent, s[0].id, "reprendre", undefined, "Développe.");
    await ecrire(laurent, s[0].id, texte("Texte B."));
    const b = await remettre(s[0].id, alice);
    expect((await scene(s[0].id)).etat).toBe("valider");
    const lues = await remarques(s[0].id);
    expect(lues.filter((r) => r.remise_id === a)).toHaveLength(1);
    expect(lues.filter((r) => r.remise_id === b)).toHaveLength(0);
    expect((await remises(s[0].id)).map((r) => mots(r.texte))).toEqual(["Texte A.", "Texte B."]);
  });
});

describe("« Validé » et « Prête » (F11.1)", () => {
  it("F11-AC01 — finitions encore à faire : une scène validée et une scène prête se distinguent, et la première ne rend pas l'écriture à l'élève", async () => {
    const { projet, s } = await lisiere(2);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    for (const x of s) {
      await ecrire(laurent, x.id, texte("Texte."));
      await remettre(x.id, alice);
    }
    await choisir(laurent, s[0].id, "valide");
    await choisir(laurent, s[1].id, "prete");
    const { data } = await laurent.base.from("scenes").select("id, etat").eq("projet_id", projet).eq("etat", "valide");
    expect((data ?? []).map((x) => x.id)).toEqual([s[0].id]);
    expect(await refusPour(poste, s[0].id)).toBe("scene");
  });

  it("F11-AC02 — retouche sans changement de statut : une scène prête que l'enseignant modifie reste prête, et l'élève ne peut toujours pas la reprendre", async () => {
    const { s } = await lisiere();
    const poste = await posteDe(classe.id, alice.inscriptionId);
    await ecrire(laurent, s[0].id, texte("Texte."));
    await remettre(s[0].id, alice);
    await choisir(laurent, s[0].id, "prete");
    await ecrire(laurent, s[0].id, texte("Texte retouché."));
    expect((await scene(s[0].id)).etat).toBe("prete");
    expect(await refusPour(poste, s[0].id)).toBe("scene");
  });

  it("F11-AC93 — retirer « Prête » : « Validé » depuis « Prête », sans rendre l'écriture à l'élève", async () => {
    const { s } = await lisiere();
    const poste = await posteDe(classe.id, alice.inscriptionId);
    await ecrire(laurent, s[0].id, texte("Texte."));
    await remettre(s[0].id, alice);
    await choisir(laurent, s[0].id, "prete");
    expect((await choisir(laurent, s[0].id, "valide")).suite).toMatchObject({ fait: true, etat: "valide" });
    expect(await refusPour(poste, s[0].id)).toBe("scene");
  });

  it("F11-AC14, AC94 — scène sans élève d'un projet de classe : « En cours », « Validé » et « Prête », sans remise ni reprise à demander", async () => {
    const { s } = await lisiere(1, [null]);
    await ecrire(laurent, s[0].id, texte("Une scène de liaison."));
    expect((await choisir(laurent, s[0].id, "valider")).erreur).toMatch(/Personne ne s'occupe/);
    expect((await choisir(laurent, s[0].id, "reprendre")).erreur).toMatch(/Personne ne s'occupe/);
    expect((await choisir(laurent, s[0].id, "valide")).suite).toMatchObject({ fait: true, etat: "valide" });
    expect((await choisir(laurent, s[0].id, "prete")).suite).toMatchObject({ fait: true, etat: "prete" });
    expect(await remises(s[0].id)).toHaveLength(0);
    // La scène que l'enseignant s'attribue a les mêmes états
    await laurent.base.from("scenes").update({ prise_par_enseignant: true }).eq("id", s[0].id);
    expect((await choisir(laurent, s[0].id, "valider")).erreur).toMatch(/Personne ne s'occupe/);
    expect((await choisir(laurent, s[0].id, "cours")).suite).toMatchObject({ fait: true, etat: "cours" });
  });

  it("F11-AC13, AC99 — projet personnel : « En cours » et « Prête », sans soumission ni « Validé »", async () => {
    const projet = await creerProjet(laurent, "personnel", "classique", "Mon roman");
    const { chapitreId } = await creerPartie(laurent, projet.id, "Le début", "Chapitre un");
    const s = await creerScene(laurent.base, chapitreId);
    await ecrire(laurent, s.id, texte("Le train entre en gare."));
    for (const etat of ["valide", "valider", "reprendre"]) expect((await choisir(laurent, s.id, etat)).erreur).toMatch(/projet personnel/);
    expect((await choisir(laurent, s.id, "prete")).suite).toMatchObject({ fait: true, etat: "prete" });
    expect((await choisir(laurent, s.id, "cours")).suite).toMatchObject({ fait: true, etat: "cours" });
  });
});

describe("État, prise en charge et textes gardés à part (F06.3, F08.1)", () => {
  it("F06-AC94 — scène remise puis prise par l'enseignant : elle reste « À valider », porte son nom seul, et la remise garde le prénom de l'élève", async () => {
    const { s } = await lisiere(1, [bilal]);
    await ecrire(laurent, s[0].id, texte("Texte de Bilal."));
    await remettre(s[0].id, bilal);
    const { error } = await laurent.base.from("scenes").update({ prise_par_enseignant: true, prise_par_eleve: null }).eq("id", s[0].id);
    expect(error).toBeNull();
    const apres = await scene(s[0].id);
    expect(apres).toMatchObject({ etat: "valider", prise_par_enseignant: true, prise_par_eleve: null });
    expect((await remises(s[0].id))[0].eleve_id).toBe(bilal.id);
    // Elle garde son état ; l'enseignant choisit ensuite celui qu'il veut
    expect((await choisir(laurent, s[0].id, "valide")).suite).toMatchObject({ fait: true, etat: "valide" });
  });

  it("F08-AC20 — état libre : avec un texte de Bilal gardé à part, l'enseignant choisit « Validé » sans l'avoir traité ; le texte reste gardé et Bilal arrêté", async () => {
    const { s } = await lisiere();
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    await ecrire(laurent, s[0].id, texte("Texte d'Alice."));
    const { data: ecriture } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: s[0].id });
    const avant = await scene(s[0].id);
    await remettre(s[0].id, alice);
    // Bilal tape encore une phrase : la scène ne s'écrit plus, sa phrase est gardée à part (F08-AC19)
    const { data } = await service().rpc("ecriture_enregistrer", {
      p_ecriture: ecriture, p_jeton_hash: poste.jetonHash, p_version: avant.version, p_texte: texte("Texte d'Alice.", "Une phrase de Bilal."), p_refus: null,
    });
    expect(data).toMatchObject({ etat: "garde", motif: "scene" });
    expect((await choisir(laurent, s[0].id, "valide")).suite).toMatchObject({ fait: true, etat: "valide" });
    const gardes = await sql<{ eleve_id: string }>("select eleve_id from public.copies_recuperation where scene_id = $1 and retire_le is null", [s[0].id]);
    expect(gardes).toEqual([{ eleve_id: bilal.id }]);
    // Arrêté : la base lui refuse l'écriture pour cette raison dès que la scène se rouvre
    await choisir(laurent, s[0].id, "cours");
    expect(await refusPour(poste, s[0].id)).toBe("arrete");
  });

  it("F08-AC25 — l'échange ne change que le texte : la scène reste « À valider », Alice reste indiquée et sa remise reste telle quelle", async () => {
    const { s } = await lisiere();
    await ecrire(laurent, s[0].id, texte("Texte d'Alice."));
    await remettre(s[0].id, alice);
    const [copie] = await sql<{ id: string }>(
      `insert into public.copies_recuperation (scene_id, projet_id, enseignant_id, sorte, eleve_id, motif, texte)
       select id, projet_id, enseignant_id, 'refus', $2, 'scene', $3::jsonb from public.scenes where id = $1 returning id`,
      [s[0].id, bilal.id, JSON.stringify(texte("Texte de Bilal."))],
    );
    const { error } = await laurent.base.rpc("mettre_copie_dans_scene", { p_copie: copie.id });
    expect(error).toBeNull();
    const apres = await scene(s[0].id);
    expect(apres).toMatchObject({ etat: "valider", prise_par_eleve: alice.id });
    expect(mots(apres.texte)).toBe("Texte de Bilal.");
    expect((await remises(s[0].id)).map((r) => mots(r.texte))).toEqual(["Texte d'Alice."]);
  });

  it("F06.1 — une scène remise contient du travail : un élève qui l'a créée ne peut plus la supprimer, même vidée", async () => {
    const { chapitre } = await lisiere(0);
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    const creee = await creerScene(await poste.base(), chapitre, "eleve_creer_scene");
    await ecrire(laurent, creee.id, texte("Texte."));
    await remettre(creee.id, bilal);
    await choisir(laurent, creee.id, "cours");
    await ecrire(laurent, creee.id, []);
    const { error } = await (await poste.base()).rpc("eleve_supprimer_scene", { p_scene: creee.id });
    expect(error?.message).toMatch(/ne peux pas supprimer/);
  });
});
