import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  aller, classeQuiEcrit, copie, copiesGardees, ecrire, MESSAGE, motsEnBase, note, posteDe, sauv, semerBlocs, semerTexte, sql, supprimerComptes, type Situation,
} from "./outils";

/**
 * Étape 4 du plan, lot 2 : ce que l'élève fait de ses scènes (F06.3, F07.1, F07.2, F07.3,
 * F08.1). Remettre, modifier encore, lire la remarque, prendre une scène, la rendre, la
 * reprendre à un camarade, annuler. Les postes sont de vrais navigateurs, chacun avec son
 * élève.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

const sceneEleve = (scene: string) => `/travail/scene/${scene}`;
const chapitreEleve = (chapitre: string) => `/travail/chapitre/${chapitre}`;
const tampon = (page: Page) => page.locator("header .tampon");
const remettre = (page: Page) => page.getByRole("button", { name: "Remettre à Mme Laurent" });
const lecture = (page: Page) => page.locator(".copie__lecture");
type Ligne = { etat: string; prise_par_eleve: string | null; version: number; tour: number };
const enBase = async (scene: string): Promise<Ligne> => (await sql<Ligne>("select etat, prise_par_eleve, version, tour from scenes where id = $1", [scene]))[0];
const remises = (scene: string) =>
  sql<{ eleve_id: string; mots: string }>(
    `select eleve_id, (select string_agg(c ->> 'text', '') from jsonb_array_elements(texte) b, jsonb_array_elements(b -> 'children') c) as mots
     from remises where scene_id = $1 order by remis_le`,
    [scene],
  );

/** L'enseignante choisit un état, comme depuis le tampon de la scène. */
async function etat(base: SupabaseClient, scene: string, voulu: string, remarque: string | null = null): Promise<void> {
  const vu = await enBase(scene);
  const { data, error } = await base.rpc("changer_etat", { p_scene: scene, p_etat: voulu, p_version: vu.version, p_tour: vu.tour, p_remarque: remarque });
  if (error || !(data as { fait: boolean }).fait) throw new Error(error?.message ?? "État non changé");
}
const confier = async (s: Situation, scene: string, prenom: string | null): Promise<void> => {
  const { error } = await s.base.from("scenes").update({ prise_par_eleve: prenom ? s.eleves[prenom].id : null }).eq("id", scene);
  if (error) throw new Error(error.message);
};
/** Des scènes de plus dans « La lisière », libres. */
async function plusDeScenes(s: Situation, titres: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const titre of titres) {
    const { data, error } = await s.base.rpc("creer_scene", { p_chapitre: s.lisiere.id });
    const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string } | null;
    if (error || !ligne) throw new Error(error?.message);
    await s.base.from("scenes").update({ titre }).eq("id", ligne.scene_id);
    ids.push(ligne.scene_id);
  }
  return ids;
}

test.describe("Remettre et modifier encore (F07.1)", () => {
  test("F07-AC07, AC67, AC28, AC01 — un texte vide ne se remet pas ; la dernière phrase tapée est dans le texte remis ; la scène passe « À valider » sans être validée, et se lit sans s'écrire", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Alice");
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await expect(sauv(alice.page)).toHaveText("Écris d’abord ton texte.");
    await expect(remettre(alice.page)).toBeDisabled();
    // Elle remet aussitôt après sa dernière phrase, sans attendre l'enregistrement automatique
    await ecrire(alice.page, "Lou s’avance sur le sentier.");
    await expect(remettre(alice.page)).toBeEnabled();
    expect((await enBase(sentier)).etat).toBe("cours");
    await remettre(alice.page).click();
    await expect(alice.page.getByRole("status").filter({ hasText: "C’est remis !" })).toContainText("Mme Laurent va relire ton texte. En attendant, tu ne peux plus écrire dedans.");
    await expect(tampon(alice.page)).toHaveText("À valider");
    await expect(copie(alice.page)).toHaveCount(0);
    await expect(lecture(alice.page)).toHaveText("Tu ne peux plus écrire : Mme Laurent relit");
    await expect(alice.page.locator(".copie__etat")).toHaveText("Mme Laurent relit ce texte.");
    expect(await enBase(sentier)).toMatchObject({ etat: "valider", prise_par_eleve: s.eleves.Alice.id });
    expect(await remises(sentier)).toEqual([{ eleve_id: s.eleves.Alice.id, mots: "Lou s’avance sur le sentier." }]);
    await alice.contexte.close();
  });

  test("F07-AC09, AC30, AC13 — « Modifier encore mon texte » : Alice retire sa remise sans attendre l'enseignante, reprend le texte déjà corrigé, et le texte remis reste conservé", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Alice");
    await semerTexte(s.base, sentier, ["Texte A."]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await remettre(alice.page).click();
    await expect(tampon(alice.page)).toHaveText("À valider");
    // Mme Laurent commence à corriger, sans valider
    await semerTexte(s.base, sentier, ["Texte B, corrigé."]);
    await alice.page.reload();
    await alice.page.getByRole("button", { name: "Modifier encore mon texte" }).click();
    await expect(MESSAGE(alice.page)).toHaveText("Tu peux de nouveau écrire.");
    await expect(tampon(alice.page)).toHaveText("En cours");
    await expect(copie(alice.page)).toHaveText("Texte B, corrigé.");
    await expect(remettre(alice.page)).toBeEnabled();
    expect((await enBase(sentier)).etat).toBe("cours");
    expect((await remises(sentier)).map((r) => r.mots)).toEqual(["Texte A."]);
    await alice.contexte.close();
  });

  test("F07-AC29 — échec de sauvegarde pendant la remise : rien n'est remis, la scène ne passe pas « À valider », et le pied dit que le texte n'est pas enregistré ; l'enregistrement revenu, la remise passe", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Alice");
    await semerTexte(s.base, sentier, ["Le début."]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await alice.page.route("**/copie", (route) => route.abort());
    await ecrire(alice.page, " La suite.");
    await remettre(alice.page).click();
    await expect(sauv(alice.page)).toHaveText("Ton texte n’est pas remis : il n’est pas encore enregistré. Ne ferme pas cette page et appelle Mme Laurent.", { timeout: 8_000 });
    await expect(tampon(alice.page)).toHaveText("En cours");
    expect((await enBase(sentier)).etat).toBe("cours");
    expect(await remises(sentier)).toHaveLength(0);
    // La saisie est toujours à l'écran, et s'enregistre dès que le réseau revient
    await expect(copie(alice.page)).toHaveText("Le début. La suite.");
    await alice.page.unroute("**/copie");
    await expect(sauv(alice.page)).toHaveText("Ça y est, ton texte est enregistré.", { timeout: 15_000 });
    await remettre(alice.page).click();
    await expect(tampon(alice.page)).toHaveText("À valider");
    expect((await remises(sentier)).map((r) => r.mots)).toEqual(["Le début. La suite."]);
    await alice.contexte.close();
  });

  test("F07-AC10, AC12 — texte remis par un camarade : Bilal remet la scène signalée au nom d'Alice et s'en occupe ; Alice lit qui l'a remis et peut retirer la remise, Bilal restant indiqué", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await semerTexte(s.base, sentier, ["Un texte écrit à deux."]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(sentier));
    // La page de Bilal est ouverte pour écrire ; entre-temps, Alice se signale sur la scène
    await confier(s, sentier, "Alice");
    await remettre(bilal.page).click();
    await expect(MESSAGE(bilal.page)).toHaveText("Tu t’occupes maintenant de cette scène, à la place d’Alice.");
    await expect(bilal.page.getByText("Tu t’en occupes")).toBeVisible();
    expect(await enBase(sentier)).toMatchObject({ etat: "valider", prise_par_eleve: s.eleves.Bilal.id });

    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await expect(alice.page.locator(".copie__etat")).toHaveText("Mme Laurent relit ce texte. C’est Bilal qui l’a remis.");
    await alice.page.getByRole("button", { name: "Modifier encore ce texte" }).click();
    await expect(MESSAGE(alice.page)).toHaveText("Ce texte peut de nouveau être modifié.");
    expect(await enBase(sentier)).toMatchObject({ etat: "cours", prise_par_eleve: s.eleves.Bilal.id });
    await bilal.contexte.close();
    await alice.contexte.close();
  });

  test("F07-AC66, AC11, AC03 — texte validé : l'élève le lit, ne peut ni le modifier ni retirer sa remise, et l'écran lui dit de s'adresser à l'enseignante, sans commande de demande", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    for (const scene of [sentier, pont]) {
      await confier(s, scene, "Alice");
      await semerTexte(s.base, scene, ["Un texte fini."]);
      await etat(s.base, scene, "valider");
    }
    await etat(s.base, sentier, "valide");
    await etat(s.base, pont, "prete");
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await expect(tampon(alice.page)).toHaveText("Validé");
    await expect(lecture(alice.page)).toHaveText("Tu ne peux plus écrire : c’est validé");
    await expect(alice.page.locator(".copie__etat")).toHaveText("Validé par Mme Laurent");
    await expect(alice.page.getByText("Pour changer quelque chose, demande à Mme Laurent.")).toBeVisible();
    await expect(copie(alice.page)).toHaveCount(0);
    await expect(alice.page.getByRole("button", { name: /Modifier encore|Demander|Remettre/ })).toHaveCount(0);
    // « Tu t'en occupes » reste le repère, sans rien à rendre (F06-AC65)
    await expect(alice.page.getByText("Tu t’en occupes")).toBeVisible();
    await expect(alice.page.getByLabel("Tu t’en occupes. Changer")).toHaveCount(0);
    await aller(alice.page, sceneEleve(pont));
    await expect(tampon(alice.page)).toHaveText("Prête");
    await expect(alice.page.locator(".copie__etat")).toHaveText("Validé par Mme Laurent, prêt pour le livre");
    await alice.contexte.close();
  });

  test("F05-AC51, F07-AC68 — une scène qui ne porte qu'une note de l'enseignante ne se remet pas ; et rien ne propose à Alice de créer une scène ni d'en demander une", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Alice");
    await semerBlocs(s.base, sentier, [note("Penser à l’image du sentier.")]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await expect(tampon(alice.page)).toHaveText("Texte vide");
    await expect(remettre(alice.page)).toBeDisabled();
    await expect(sauv(alice.page)).toHaveText("Écris d’abord ton texte.");
    await aller(alice.page, chapitreEleve(s.lisiere.id));
    await expect(alice.page.getByRole("button", { name: /Ajouter une scène|Demander|Proposer/ })).toHaveCount(0);
    await alice.contexte.close();
  });
});

test.describe("La remarque de l'enseignante (F07.3)", () => {
  test("F07-AC16, AC24 — la remarque d'abord : Bilal, qui s'occupe de la reprise, la lit seule, puis écrit, la remarque à côté de son texte ; Alice la lit à sa place ordinaire ; aucune réponse écrite n'est demandée", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Bilal");
    await semerTexte(s.base, sentier, ["Lou se glisse dans la souche."]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(sentier));
    await remettre(bilal.page).click();
    await expect(tampon(bilal.page)).toHaveText("À valider");
    await etat(s.base, sentier, "reprendre", "Ajoute ce que Lou voit à la lueur de la lanterne.");

    await bilal.page.reload();
    const grande = bilal.page.getByRole("region", { name: "Mme Laurent te demande de reprendre ton texte" });
    await expect(grande).toContainText("Ajoute ce que Lou voit à la lueur de la lanterne.");
    await expect(copie(bilal.page)).toBeHidden();
    await grande.getByRole("button", { name: "J’ai lu, j’écris" }).click();
    await expect(grande).toHaveCount(0);
    await expect(copie(bilal.page)).toBeFocused();
    await expect(bilal.page.locator(".copie__titre")).toHaveText("Ton texte, avec les corrections de Mme Laurent");
    const remarque = bilal.page.getByRole("region", { name: "Remarque de Mme Laurent" });
    await expect(remarque).toContainText("Ajoute ce que Lou voit à la lueur de la lanterne.");
    await expect(remarque).toContainText("pour toi");
    await expect(remarque).toContainText("Si tu hésites, demande une explication en classe.");
    // Le texte qu'il avait remis se relit, sans remplacer celui de la scène
    await remarque.getByRole("button", { name: /^Voir mon texte du/ }).click();
    await expect(remarque.locator(".remise-apercu")).toContainText("Lou se glisse dans la souche.");
    // Aucun champ de réponse ni de note d'accompagnement (AC24)
    await expect(bilal.page.locator("textarea, input[type=text]")).toHaveCount(0);
    // La fiche en grand ne revient pas
    await bilal.page.reload();
    await expect(bilal.page.getByRole("region", { name: "Mme Laurent te demande de reprendre ton texte" })).toHaveCount(0);
    await expect(copie(bilal.page)).toBeVisible();

    // Alice, du même chapitre, lit la remarque sans devenir responsable de la reprise
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await expect(alice.page.getByRole("region", { name: "Mme Laurent te demande de reprendre ton texte" })).toHaveCount(0);
    const lue = alice.page.getByRole("region", { name: "Remarque de Mme Laurent" });
    await expect(lue).toContainText("Ajoute ce que Lou voit à la lueur de la lanterne.");
    await expect(lue).toContainText("Tu peux lire cette remarque ; c’est Bilal qui s’occupe de la reprise.");
    expect((await enBase(sentier)).prise_par_eleve).toBe(s.eleves.Bilal.id);

    // Après la nouvelle remise, la remarque reste lisible, repliée (F07-AC25)
    await ecrire(bilal.page, " Une lueur danse sur le bois.");
    await remettre(bilal.page).click();
    await expect(tampon(bilal.page)).toHaveText("À valider");
    await expect(bilal.page.locator("details").filter({ hasText: "Remarque de Mme Laurent" })).toBeVisible();
    await bilal.contexte.close();
    await alice.contexte.close();
  });

  test("F07.3 — reprise demandée sans remarque écrite : l'écran dit que la reprise est demandée et renvoie vers l'enseignante", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Alice");
    await semerTexte(s.base, sentier, ["Un texte."]);
    await etat(s.base, sentier, "valider");
    await etat(s.base, sentier, "reprendre");
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    const grande = alice.page.getByRole("region", { name: "Mme Laurent te demande de reprendre ton texte" });
    await expect(grande).toContainText("Pas de remarque écrite. Si tu ne sais pas quoi changer, demande à Mme Laurent.");
    await grande.getByRole("button", { name: "J’ai lu, j’écris" }).click();
    await expect(alice.page.getByRole("region", { name: "Remarque de Mme Laurent" })).toContainText("Reprise demandée, sans remarque écrite.");
    await expect(tampon(alice.page)).toHaveText("À reprendre");
    await alice.contexte.close();
  });
});

test.describe("S'occuper d'une scène, la rendre, la reprendre à un camarade (F06.3)", () => {
  test("F06-AC41, AC42, AC66, AC10 — scène d'un camarade : Bilal la lit et voit qu'Alice s'en occupe ; il la quitte, rien ne change ; il la prend à son nom, peut y écrire, puis annule, et Alice est de nouveau signalée", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Alice");
    await semerTexte(s.base, sentier, ["Le texte d’Alice."]);
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, sceneEleve(sentier));
    await expect(bilal.page.getByText("Alice s’occupe de cette scène. Tu peux la lire. Pour écrire dedans, parle-lui d’abord, ou à Mme Laurent.")).toBeVisible();
    await expect(copie(bilal.page)).toHaveCount(0);
    // Il abandonne : Alice reste signalée, rien n'est modifié (AC41)
    await bilal.page.getByRole("link", { name: "Retour à La lisière" }).click();
    await bilal.page.waitForURL(/\/travail\/chapitre\//);
    expect((await enBase(sentier)).prise_par_eleve).toBe(s.eleves.Alice.id);
    // Il confirme : il la reprend à son nom, sans l'enseignante (AC42)
    await aller(bilal.page, sceneEleve(sentier));
    await bilal.page.getByRole("button", { name: "M’occuper de cette scène" }).click();
    const prise = bilal.page.getByRole("status").filter({ hasText: "Tu t’occupes maintenant de cette scène" });
    await expect(prise).toContainText("Tu t’occupes maintenant de cette scène, à la place d’Alice.");
    await expect(copie(bilal.page)).toHaveText("Le texte d’Alice.");
    expect((await enBase(sentier)).prise_par_eleve).toBe(s.eleves.Bilal.id);
    expect(await motsEnBase(sentier)).toBe("Le texte d’Alice.");
    // « Annuler », tant qu'il reste sur la page (AC66)
    await prise.getByRole("button", { name: "Annuler" }).click();
    await expect(bilal.page.getByRole("button", { name: "M’occuper de cette scène" })).toBeVisible();
    await expect(copie(bilal.page)).toHaveCount(0);
    expect((await enBase(sentier)).prise_par_eleve).toBe(s.eleves.Alice.id);
    expect(await motsEnBase(sentier)).toBe("Le texte d’Alice.");
    await bilal.contexte.close();
  });

  test("F06-AC64, AC65 — « Je ne m'en occupe plus » : tant que la scène s'écrit, Alice retire son signalement, son texte reste et elle peut toujours écrire ; le geste s'annule ; une fois la scène remise, il n'est plus proposé", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await confier(s, sentier, "Alice");
    await semerTexte(s.base, sentier, ["Le texte d’Alice."]);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, sceneEleve(sentier));
    await alice.page.getByLabel("Tu t’en occupes. Changer").click();
    await expect(alice.page.getByText("Ton texte reste dans la scène.")).toBeVisible();
    await alice.page.getByRole("button", { name: "Je ne m’en occupe plus" }).click();
    const rendue = alice.page.getByRole("status").filter({ hasText: "Tu ne t’occupes plus de cette scène." });
    await expect(rendue).toContainText("Ton texte reste dedans.");
    expect((await enBase(sentier)).prise_par_eleve).toBeNull();
    expect(await motsEnBase(sentier)).toBe("Le texte d’Alice.");
    await expect(copie(alice.page)).toBeVisible();
    await rendue.getByRole("button", { name: "Annuler" }).click();
    await expect(alice.page.getByLabel("Tu t’en occupes. Changer")).toBeVisible();
    expect((await enBase(sentier)).prise_par_eleve).toBe(s.eleves.Alice.id);
    // « À valider » : le retrait n'est plus proposé (AC65)
    await remettre(alice.page).click();
    await expect(tampon(alice.page)).toHaveText("À valider");
    await expect(alice.page.getByText("Tu t’en occupes")).toBeVisible();
    await expect(alice.page.getByLabel("Tu t’en occupes. Changer")).toHaveCount(0);
    await alice.contexte.close();
  });

  test("F06-AC38, AC39, AC04, AC40 — dans son chapitre, Alice coche plusieurs scènes et s'en occupe : celles d'un camarade sont annoncées, « Seulement les libres » les lui laisse, la scène suivante n'est pas ajoutée, et Bilal voit qui prépare quoi", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    const [souche, clairiere] = await plusDeScenes(s, ["La souche", "La clairière"]);
    await confier(s, pont, "Bilal");
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, chapitreEleve(s.lisiere.id));
    await alice.page.getByLabel("Choisir S001 pour m’en occuper").check();
    await alice.page.getByLabel("Choisir S002 pour m’en occuper").check();
    await alice.page.getByLabel("Choisir S004 pour m’en occuper").check();
    const selection = alice.page.getByRole("region", { name: "Sélection" });
    await expect(selection).toContainText("3 scènes : S001, S002, S004");
    await expect(selection).toContainText("S002 : Bilal s’en occupe. Parle-lui d’abord, ou à Mme Laurent.");
    await selection.getByRole("button", { name: "Seulement les libres" }).click();
    await expect(MESSAGE(alice.page)).toContainText("Tu t’occupes maintenant de S001, S004.");
    await expect(selection).toHaveCount(0);
    // Les signalements tiennent sur des textes encore vides ; ni S003 ni la scène de Bilal ne sont ajoutées (AC39)
    expect((await enBase(sentier)).prise_par_eleve).toBe(s.eleves.Alice.id);
    expect((await enBase(souche)).prise_par_eleve).toBe(s.eleves.Alice.id);
    expect((await enBase(pont)).prise_par_eleve).toBe(s.eleves.Bilal.id);
    expect((await enBase(clairiere)).prise_par_eleve).toBeNull();
    const fiche = (ref: string) => alice.page.locator(".fiche").filter({ has: alice.page.locator(".fiche__ref", { hasText: ref }) });
    await expect(fiche("S001")).toContainText("Tu t’en occupes");
    // Sa propre scène ne se coche plus ; celle de Bilal se coche encore, après l'avoir prévenu
    await expect(alice.page.getByLabel("Choisir S001 pour m’en occuper")).toHaveCount(0);
    await expect(alice.page.getByLabel("Choisir S002 pour m’en occuper")).toBeVisible();

    // Bilal, à la séance suivante, voit qui prépare quoi avant de commencer (AC04, AC06), et garde ses droits (AC40)
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(bilal.page, chapitreEleve(s.lisiere.id));
    const chezBilal = (ref: string) => bilal.page.locator(".fiche").filter({ has: bilal.page.locator(".fiche__ref", { hasText: ref }) });
    await expect(chezBilal("S001")).toContainText("Alice s’en occupe");
    await expect(chezBilal("S002")).toContainText("Tu t’en occupes");
    await aller(bilal.page, sceneEleve(clairiere));
    await expect(copie(bilal.page)).toBeVisible();
    await alice.contexte.close();
    await bilal.contexte.close();
  });

  test("F06-AC42, AC66 — reprise depuis le chapitre : « Je m'en occupe » reprend aussi la scène du camarade, le message le dit, et « Annuler » rétablit tout", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    await confier(s, pont, "Bilal");
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, chapitreEleve(s.lisiere.id));
    await alice.page.getByLabel("Choisir S001 pour m’en occuper").check();
    await alice.page.getByLabel("Choisir S002 pour m’en occuper").check();
    await alice.page.getByRole("region", { name: "Sélection" }).getByRole("button", { name: "Je m’en occupe" }).click();
    await expect(MESSAGE(alice.page)).toContainText("Tu t’occupes maintenant de S001, S002. À la place de : S002 (Bilal). Les textes ne changent pas.");
    expect((await enBase(pont)).prise_par_eleve).toBe(s.eleves.Alice.id);
    await MESSAGE(alice.page).getByRole("button", { name: "Annuler" }).click();
    await expect.poll(async () => (await enBase(pont)).prise_par_eleve).toBe(s.eleves.Bilal.id);
    await expect.poll(async () => (await enBase(sentier)).prise_par_eleve).toBeNull();
    await alice.contexte.close();
  });

  test("F06.3 — scène qui vient de changer de main : de deux scènes cochées dont l'une vient d'être prise, Alice reçoit l'autre et lit laquelle ne l'était plus", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, chapitreEleve(s.lisiere.id));
    await alice.page.getByLabel("Choisir S001 pour m’en occuper").check();
    await alice.page.getByLabel("Choisir S002 pour m’en occuper").check();
    // Bilal vient de prendre S002 depuis son poste
    await confier(s, pont, "Bilal");
    await alice.page.getByRole("region", { name: "Sélection" }).getByRole("button", { name: "Je m’en occupe" }).click();
    await expect(MESSAGE(alice.page)).toContainText("Tu t’occupes maintenant de S001. S002 vient de changer : elle n’est pas à toi.");
    expect((await enBase(sentier)).prise_par_eleve).toBe(s.eleves.Alice.id);
    expect((await enBase(pont)).prise_par_eleve).toBe(s.eleves.Bilal.id);
    await alice.contexte.close();
  });

  test("F06-AC62 — scène de l'enseignante : Alice la lit, voit que Mme Laurent s'en occupe, et rien ne lui propose de l'écrire ni de la prendre ; désignée à sa place, elle y écrit", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier] = s.lisiere.scenes;
    await semerTexte(s.base, sentier, ["Une scène de liaison."]);
    await s.base.from("scenes").update({ prise_par_enseignant: true }).eq("id", sentier);
    const alice = await posteDe(browser, s, "Alice");
    await aller(alice.page, chapitreEleve(s.lisiere.id));
    await expect(alice.page.getByLabel("Choisir S001 pour m’en occuper")).toHaveCount(0);
    await aller(alice.page, sceneEleve(sentier));
    await expect(alice.page.getByText("Mme Laurent s’occupe de cette scène. Tu peux la lire.")).toBeVisible();
    await expect(copie(alice.page)).toHaveCount(0);
    await expect(alice.page.getByRole("button", { name: /M’occuper|Remettre|Modifier encore/ })).toHaveCount(0);
    await s.base.from("scenes").update({ prise_par_enseignant: false, prise_par_eleve: s.eleves.Alice.id }).eq("id", sentier);
    await alice.page.reload();
    await expect(copie(alice.page)).toBeVisible();
    await alice.contexte.close();
  });
});

test.describe("Pendant l'arrêt d'un conflit (F08.1)", () => {
  test("F08-AC19, AC31 — Alice remet pendant que Bilal tape : sa phrase est gardée à part, il est arrêté ; rien ne lui propose de modifier la remise, ni ensuite de prendre la scène ; Alice arrêtée ne peut pas rendre la sienne", async ({ page, browser }) => {
    const s = await classeQuiEcrit(page);
    const [sentier, pont] = s.lisiere.scenes;
    await semerTexte(s.base, sentier, ["Le texte d’Alice."]);
    const alice = await posteDe(browser, s, "Alice");
    const bilal = await posteDe(browser, s, "Bilal");
    await aller(alice.page, sceneEleve(sentier));
    await aller(bilal.page, sceneEleve(sentier));
    await remettre(alice.page).click();
    await expect(tampon(alice.page)).toHaveText("À valider");
    await ecrire(bilal.page, " Une phrase de Bilal.");
    await expect(bilal.page.locator(".copie__pied")).toContainText("Cette scène a changé pendant que tu écrivais : tu ne peux plus y écrire. Ce que tu venais d’écrire est gardé. Appelle Mme Laurent.", { timeout: 8_000 });
    expect(await motsEnBase(sentier)).toBe("Le texte d’Alice.");
    expect((await copiesGardees(sentier)).map((c) => c.eleve_id)).toEqual([s.eleves.Bilal.id]);
    // Au retour : la scène « À valider » se lit, sans « Modifier encore ce texte » (AC19)
    await bilal.page.reload();
    await expect(tampon(bilal.page)).toHaveText("À valider");
    await expect(bilal.page.locator(".copie__pied")).toContainText("Ton texte est gardé à part. Mme Laurent doit le regarder avant que tu écrives ici.");
    await expect(bilal.page.getByRole("button", { name: /Modifier encore/ })).toHaveCount(0);
    // La scène rendue à l'écriture, au nom d'Alice : Bilal, toujours arrêté, ne se voit pas proposer de la prendre (AC31)
    await etat(s.base, sentier, "cours");
    await bilal.page.reload();
    await expect(bilal.page.getByText("Alice s’occupe de cette scène. Tu peux la lire.")).toBeVisible();
    await expect(bilal.page.getByRole("button", { name: "M’occuper de cette scène" })).toHaveCount(0);
    await aller(bilal.page, chapitreEleve(s.lisiere.id));
    await expect(bilal.page.getByLabel("Choisir S001 pour m’en occuper")).toHaveCount(0);

    // Alice arrêtée sur une scène dont elle s'occupe : « Je ne m'en occupe plus » ne lui est pas proposé
    await confier(s, pont, "Alice");
    await sql(
      `insert into copies_recuperation (scene_id, projet_id, enseignant_id, sorte, eleve_id, motif, texte)
       select id, projet_id, enseignant_id, 'refus', $2, 'conflit', '[]'::jsonb from scenes where id = $1`,
      [pont, s.eleves.Alice.id],
    );
    await aller(alice.page, sceneEleve(pont));
    await expect(alice.page.getByText("Tu t’en occupes")).toBeVisible();
    await expect(alice.page.getByLabel("Tu t’en occupes. Changer")).toHaveCount(0);
    await alice.contexte.close();
    await bilal.contexte.close();
  });
});
