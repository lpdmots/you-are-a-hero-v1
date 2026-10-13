import { test, type Page } from "@playwright/test";
import {
  adultePret, aller, choixAuto, classeQuiEcrit, ecrire, posteDe, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, semerTexte, sql,
  supprimerComptes,
} from "../parcours/outils";

/**
 * Captures des écrans de l'étape 4 : npm run captures -- etape4
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 * Chaque lot a sa tranche de numéros, pour qu'un lot rejoué seul ne recouvre pas les autres.
 */
const dossier = "test-results/captures";
let n = 400;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

const tampon = (page: Page) => page.locator("summary.tampon--menu");
const fiche = (page: Page) => page.locator(".carnet-fiche--decision");

/** Ce que fera « Remettre » : le texte est conservé, la scène passe « À valider », le soumetteur s'en occupe. */
const remettre = (scene: string, eleve: string, ilYA = "0 minutes") =>
  sql(
    `with s as (
       update scenes set etat = 'valider', tour = tour + 1, prise_par_eleve = $2 where id = $1
       returning id, projet_id, enseignant_id, texte)
     insert into remises (scene_id, projet_id, enseignant_id, eleve_id, texte, remis_le)
     select id, projet_id, enseignant_id, $2, texte, now() - $3::interval from s`,
    [scene, eleve, ilYA],
  );

test("lot 1 : état et relecture, côté enseignant", async ({ page }) => {
  test.setTimeout(300_000);
  n = 400;
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal", "Chloé"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt des lanternes", [
    { titre: "La lisière", scenes: ["Sentier — le chant dans les fougères", "Souche creuse — la lanterne de secours", "Souche — la chouette messagère", "Clairière — les deux chemins se rejoignent", "Pont de brume — le passeur apparaît"] },
  ]);
  const [lisiere] = chapitres;
  const [sentier, souche, chouette, clairiere, pont] = lisiere.scenes;
  await semerAttribution(base, lisiere.id, [{ eleve: classe.eleves.Alice.id }, { eleve: classe.eleves.Bilal.id }, { eleve: classe.eleves.Chloé.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id }).in("id", [sentier, clairiere]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Bilal.id }).in("id", [souche, chouette]);
  await base.from("scenes").update({ consigne: "Lou se cache dans une souche creuse et allume la lanterne de secours. Décris ce qu’il découvre à l’intérieur." }).eq("id", souche);

  await semerTexte(base, sentier, ["Un chant montait des fougères, si doux que Lou s’arrêta pour l’écouter."]);
  await semerTexte(base, chouette, ["La chouette tenait un message dans son bec."]);
  await semerTexte(base, souche, ["Lou se glissa dans la souche creuse. Il faisait noir comme dans un four."]);
  await remettre(souche, classe.eleves.Bilal.id, "3 days");
  await sql(
    `insert into remarques (scene_id, projet_id, enseignant_id, remise_id, eleve_id, texte, cree_le)
     select r.scene_id, r.projet_id, r.enseignant_id, r.id, r.eleve_id, 'Dis ce que Lou entend avant d’allumer la lanterne.', now() - interval '2 days' from remises r where r.scene_id = $1`,
    [souche],
  );
  await semerBlocs(base, souche, [
    recit("Lou se glissa dans la souche creuse. Il faisait noir comme dans un four. Il sortit la lanterne de secour de son sac et frotta l’allumette."),
    recit("La flamme dansa sur les murs de bois. Des petits yeux brillait au fond, puis une voix murmura : « Éteins ça, tu vas les attirer. »"),
    choixAuto("Sortir de la souche", clairiere),
    choixAuto("Rester caché", chouette),
  ]);
  await remettre(souche, classe.eleves.Bilal.id, "1 day 2 hours");
  await sql("update scenes set etat = 'reprendre' where id = $1", [sentier]);
  await sql("update scenes set etat = 'valide' where id = $1", [chouette]);

  const adresse = `/projet/${projet}/scene/${souche}`;
  await aller(page, adresse);
  await capturer(page, "scene-a-valider");
  await tampon(page).click();
  await capturer(page, "scene-etat-liste");
  await page.keyboard.press("Escape");
  await page.getByRole("tab", { name: /^Remis le/ }).click();
  await capturer(page, "scene-onglet-remise");
  await page.locator("details").filter({ hasText: "Remises" }).locator("summary").click();
  await capturer(page, "scene-remises");
  await fiche(page).getByRole("button", { name: "Texte de la scène" }).click();
  await fiche(page).getByRole("button", { name: "Demander une reprise…" }).click();
  await page.getByLabel(/^Remarque pour Bilal/).fill("Ajoute ce que Lou voit à la lueur de la lanterne avant d’entendre la voix. J’ai corrigé « secours » et l’accord de « brillaient ».");
  await capturer(page, "scene-remarque");
  await fiche(page).getByRole("button", { name: "Demander la reprise" }).click();
  await capturer(page, "scene-a-reprendre");

  // Validation suspendue : la scène a changé depuis la lecture
  await sql("update scenes set etat = 'valider', tour = tour + 1 where id = $1", [souche]);
  await aller(page, adresse);
  await sql("update scenes set etat = 'cours', tour = tour + 1 where id = $1", [souche]);
  await semerTexte(base, souche, ["Lou se glissa dans la souche creuse. Bilal a tout repris depuis."]);
  await fiche(page).getByRole("button", { name: "Valider le travail élève" }).click();
  await capturer(page, "scene-validation-suspendue");

  // Valider, rappel avant « prête », prête
  await sql("update scenes set etat = 'valider', tour = tour + 1 where id = $1", [souche]);
  await aller(page, adresse);
  await fiche(page).getByRole("button", { name: "Valider le travail élève" }).click();
  await page.waitForTimeout(900);
  await capturer(page, "scene-validee");
  await fiche(page).getByRole("button", { name: "Prête pour le livre" }).click();
  await capturer(page, "scene-rappel-avant-prete");
  await fiche(page).getByRole("button", { name: "Déclarer prête" }).click();
  await capturer(page, "scene-prete");

  // Échec d'enregistrement : l'état attend
  await sql("update scenes set etat = 'valider', tour = tour + 1 where id = $1", [chouette]);
  await aller(page, `/projet/${projet}/scene/${chouette}`);
  await page.route("**/copie", (route) => route.abort());
  await ecrire(page, " Lou tendit la main.");
  await page.getByRole("alert").filter({ hasText: "pas encore enregistrées" }).waitFor({ timeout: 8_000 });
  await capturer(page, "scene-etat-attend-l-enregistrement");
  await page.unroute("**/copie");
  await page.getByRole("button", { name: "Réessayer maintenant" }).click();
  await page.waitForTimeout(1_500);

  // Scène sans élève, puis le chapitre et ses tampons
  await semerTexte(base, pont, ["Sur le pont de brume, une silhouette apparut."]);
  await aller(page, `/projet/${projet}/scene/${pont}`);
  await tampon(page).click();
  await capturer(page, "scene-sans-eleve-etats");
  await aller(page, `/projet/${projet}/chapitre/${lisiere.id}`);
  await capturer(page, "chapitre-tampons", true);

  // Téléphone : on lit, puis on décide
  await sql("update scenes set etat = 'valider', tour = tour + 1 where id = $1", [souche]);
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, adresse);
  await capturer(page, "scene-a-valider-390", true);
  await tampon(page).click();
  await capturer(page, "scene-etat-liste-390");
});

test("lot 1 : projet personnel, deux états", async ({ page }) => {
  n = 415;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "classique", "Mon roman");
  const { chapitres } = await semerPartie(base, projet, "Le début", [{ titre: "Chapitre un", scenes: ["La gare"] }]);
  await aller(page, `/projet/${projet}/scene/${chapitres[0].scenes[0]}`);
  await tampon(page).click();
  await capturer(page, "personnel-etats");
  await page.keyboard.press("Escape");
  await fiche(page).getByRole("button", { name: "Prête pour le livre" }).click();
  await capturer(page, "personnel-rappel-texte-vide");
});

test("lot 2 : côté élève", async ({ page, browser }) => {
  test.setTimeout(300_000);
  n = 420;
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  const plus: string[] = [];
  for (const titre of ["La souche creuse", "La clairière", "Le pont de brume"]) {
    const { data } = await s.base.rpc("creer_scene", { p_chapitre: s.lisiere.id });
    const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string };
    await s.base.from("scenes").update({ titre }).eq("id", ligne.scene_id);
    plus.push(ligne.scene_id);
  }
  const [souche, clairiere] = plus;
  await s.base.from("scenes").update({ consigne: "Lou suit le sentier jusqu’à la souche. Décris ce qu’il entend." }).eq("id", sentier);
  await s.base.from("scenes").update({ prise_par_eleve: s.eleves.Bilal.id }).in("id", [sentier, clairiere]);
  await s.base.from("scenes").update({ prise_par_eleve: s.eleves.Alice.id }).eq("id", pont);
  await semerTexte(s.base, pont, ["Le pont de bois craquait sous les pas de Lou."]);
  const etat = async (scene: string, voulu: string, remarque: string | null = null) => {
    const [vu] = await sql<{ version: number; tour: number }>("select version, tour from scenes where id = $1", [scene]);
    await s.base.rpc("changer_etat", { p_scene: scene, p_etat: voulu, p_version: vu.version, p_tour: vu.tour, p_remarque: remarque });
  };

  const bilal = await posteDe(browser, s, "Bilal");
  const p = bilal.page;
  await aller(p, `/travail/scene/${sentier}`);
  await capturer(p, "eleve-texte-vide");
  await ecrire(p, "Lou suivit le sentier. Un chant montait des fougères, si doux qu’il s’arrêta pour l’écouter.");
  await p.waitForTimeout(2_600);
  await capturer(p, "eleve-ecrit");
  await p.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
  await p.getByRole("status").filter({ hasText: "C’est remis !" }).waitFor();
  await capturer(p, "eleve-remis");
  await etat(sentier, "reprendre", "Dis d’où vient le chant, et ce que Lou ressent en l’entendant.");
  await p.reload();
  await capturer(p, "eleve-remarque-seule");
  await p.getByRole("button", { name: "J’ai lu, j’écris" }).click();
  await p.getByRole("button", { name: /^Voir mon texte du/ }).click();
  await capturer(p, "eleve-a-reprendre");
  await p.getByLabel("Tu t’en occupes. Changer").click();
  await capturer(p, "eleve-je-ne-m-en-occupe-plus");
  await p.keyboard.press("Escape");

  // La scène d'une camarade : la lire, puis s'en occuper
  await aller(p, `/travail/scene/${pont}`);
  await capturer(p, "eleve-scene-d-un-camarade");
  await p.getByRole("button", { name: "M’occuper de cette scène" }).click();
  await p.getByRole("status").filter({ hasText: "Tu t’occupes maintenant" }).waitFor();
  await capturer(p, "eleve-scene-prise");
  await p.getByRole("status").filter({ hasText: "Tu t’occupes maintenant" }).getByRole("button", { name: "Annuler" }).click();

  // Validé, puis le chapitre et sa sélection
  await semerTexte(s.base, clairiere, ["Les deux chemins se rejoignaient dans la clairière."]);
  await etat(clairiere, "valider");
  await etat(clairiere, "valide");
  await aller(p, `/travail/scene/${clairiere}`);
  await capturer(p, "eleve-valide");
  await aller(p, `/travail/chapitre/${s.lisiere.id}`);
  await p.getByLabel("Choisir S002 pour m’en occuper").check();
  await p.getByLabel(`Choisir S004 pour m’en occuper`).check().catch(() => {});
  await p.getByLabel("Choisir S006 pour m’en occuper").check().catch(() => {});
  await capturer(p, "eleve-chapitre-selection", true);
  void souche;

  await p.setViewportSize({ width: 390, height: 844 });
  await capturer(p, "eleve-chapitre-selection-390");
  await aller(p, `/travail/scene/${sentier}`);
  await capturer(p, "eleve-a-reprendre-390");
  await bilal.contexte.close();
});

test("lot 3 : Mon travail, et un élève retiré de la classe", async ({ page, browser }) => {
  test.setTimeout(300_000);
  n = 440;
  const s = await classeQuiEcrit(page);
  const [sentier, pont] = s.lisiere.scenes;
  const plus: string[] = [];
  for (const titre of ["La souche creuse", "La clairière", "Le gué", "Le pont de brume", "La lanterne"]) {
    const { data } = await s.base.rpc("creer_scene", { p_chapitre: s.lisiere.id });
    const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string };
    await s.base.from("scenes").update({ titre }).eq("id", ligne.scene_id);
    plus.push(ligne.scene_id);
  }
  const [souche, clairiere, gue] = plus;
  await s.base.from("scenes").update({ prise_par_eleve: s.eleves.Bilal.id }).in("id", [sentier, pont, souche, clairiere, gue]);
  for (const scene of [sentier, pont, clairiere, gue]) await semerTexte(s.base, scene, ["Un texte de Bilal."]);
  await sql("update scenes set ecrit_par = array[$1::uuid] where id = any($2::uuid[])", [s.eleves.Bilal.id, [sentier, pont, clairiere, gue]]);
  await sql("update scenes set etat = 'valide' where id = $1", [sentier]);
  await sql("update scenes set etat = 'valider' where id = $1", [pont]);
  await sql("update scenes set etat = 'reprendre' where id = $1", [clairiere]);

  const bilal = await posteDe(browser, s, "Bilal");
  await bilal.page.getByRole("region", { name: "Les scènes dont tu t’occupes" }).scrollIntoViewIfNeeded();
  await capturer(bilal.page, "mon-travail", true);
  await bilal.page.setViewportSize({ width: 390, height: 844 });
  await capturer(bilal.page, "mon-travail-390", true);
  await bilal.contexte.close();
  const alice = await posteDe(browser, s, "Alice");
  await capturer(alice.page, "mon-travail-aucune-scene");
  await alice.contexte.close();

  // Bilal retiré de la classe : ce que devient son travail
  await aller(page, `/classes/${s.classe.id}`);
  await page.getByRole("region", { name: "Élèves" }).getByRole("button", { name: /Bilal/ }).click();
  await page.getByRole("complementary").filter({ hasText: "Retirer de la classe" }).getByRole("button", { name: "Retirer de la classe" }).click();
  await page.locator(".message").waitFor();
  await capturer(page, "classe-eleve-retire");
  await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}`);
  await capturer(page, "chapitre-apres-retrait", true);
  await aller(page, `/projet/${s.projet}/scene/${pont}`);
  await capturer(page, "scene-a-valider-d-un-eleve-retire");
  await aller(page, `/classes/${s.classe.id}/inscrire`);
  await capturer(page, "inscrire-profil-retire");
});

test("lot 4 : le Suivi", async ({ page }) => {
  test.setTimeout(300_000);
  n = 460;
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent", aides_masquees: ["classes", "plan", "preparation"] }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal", "Chloé", "Dylan", "Emma", "Adam", "Maëlys"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt des lanternes", [
    { titre: "Le dernier bac", scenes: ["Quai — la sirène du dernier bac", "Passerelle — le bac s’éloigne", "Quai — la lanterne qui clignote", "Cabane du passeur — la carte oubliée"] },
    { titre: "La lisière", scenes: ["Lisière — les lanternes s’éteignent", "Sentier — le chant dans les fougères", "Souche creuse — la lanterne de secours", "Souche — la chouette messagère", "Clairière — les deux chemins se rejoignent"] },
    { titre: "Le sommet", scenes: ["Sommet — la brume se lève"] },
  ]);
  const [bac, lisiere, sommet] = chapitres;
  const e = classe.eleves;
  await semerAttribution(base, bac.id, [{ eleve: e.Chloé.id }, { eleve: e.Dylan.id }, { eleve: e.Emma.id }]);
  await semerAttribution(base, lisiere.id, [{ eleve: e.Alice.id }, { eleve: e.Bilal.id }]);
  const toutes = [...bac.scenes, ...lisiere.scenes, ...sommet.scenes];
  await base.from("scenes").update({ consigne: "Ce que la scène doit raconter." }).in("id", toutes.filter((_, i) => i !== 3 && i !== 8));
  const donner = (scenes: string[], prenom: string) => base.from("scenes").update({ prise_par_eleve: e[prenom].id }).in("id", scenes);
  await donner([bac.scenes[0], bac.scenes[3]], "Chloé");
  await donner([bac.scenes[1]], "Dylan");
  await donner([bac.scenes[2]], "Emma");
  await donner([lisiere.scenes[0], lisiere.scenes[1]], "Alice");
  await donner([lisiere.scenes[2], lisiere.scenes[3]], "Bilal");
  for (const scene of [bac.scenes[0], bac.scenes[1], bac.scenes[2], lisiere.scenes[0], lisiere.scenes[1], lisiere.scenes[2], lisiere.scenes[3]]) await semerTexte(base, scene, ["Un texte."]);
  const etat = (scene: string, voulu: string) => sql("update scenes set etat = $2 where id = $1", [scene, voulu]);
  await etat(bac.scenes[0], "prete");
  await etat(bac.scenes[1], "valider");
  await etat(lisiere.scenes[0], "valide");
  await etat(lisiere.scenes[1], "valider");
  await etat(lisiere.scenes[2], "valider");
  await etat(lisiere.scenes[3], "reprendre");
  await sql("update scenes set fin = true where id = any($1::uuid[])", [toutes]);

  await aller(page, "/projets");
  await capturer(page, "mes-projets-carte");
  await aller(page, `/projet/${projet}/suivi`);
  await capturer(page, "suivi-aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "suivi-scenes", true);
  await page.getByRole("button", { name: "Que veulent dire ces états ?" }).click();
  await capturer(page, "suivi-legende");
  await page.keyboard.press("Escape");
  await page.getByRole("combobox", { name: "Élève", exact: true }).selectOption({ label: "Bilal" });
  await capturer(page, "suivi-eleve-choisi");
  await page.getByRole("combobox", { name: "Élève", exact: true }).selectOption({ label: "Tous les élèves" });
  await page.getByRole("combobox", { name: "Chapitre", exact: true }).selectOption({ label: "Le sommet" });
  await page.getByRole("group", { name: "Filtrer par état" }).getByRole("button", { name: /^Texte vide/ }).click();
  await page.getByRole("combobox", { name: "Chapitre", exact: true }).selectOption({ label: "Le dernier bac" });
  await page.getByRole("group", { name: "Filtrer par état" }).getByRole("button", { name: /^Toutes/ }).click();
  await page.getByRole("group", { name: "Vue du suivi" }).getByRole("button", { name: "Élèves" }).click();
  await capturer(page, "suivi-eleves", true);
  await aller(page, `/projet/${projet}/suivi?etat=valider&direct=1`);
  await capturer(page, "suivi-a-valider");
  await page.getByRole("link", { name: "Relire S002" }).click();
  await page.waitForURL(/\/scene\//);
  await page.locator(".carnet-fiche--decision").getByRole("button", { name: "Valider le travail élève" }).click();
  await page.getByRole("link", { name: /^Suivante à valider/ }).waitFor();
  await capturer(page, "scene-suivante-a-valider");

  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/suivi?direct=1`);
  await capturer(page, "suivi-scenes-390", true);
  await aller(page, `/projet/${projet}/suivi?vue=eleves&direct=1`);
  await capturer(page, "suivi-eleves-390", true);
});

test("lot 4 : le Suivi d'un projet personnel", async ({ page }) => {
  n = 475;
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "classique", "Mon roman");
  const { chapitres } = await semerPartie(base, projet, "Le début", [
    { titre: "Chapitre un", scenes: ["La gare", "Le quai", "Le train"] },
    { titre: "Chapitre deux", scenes: ["La ville", "Le port"] },
  ]);
  for (const scene of [chapitres[0].scenes[0], chapitres[0].scenes[1], chapitres[1].scenes[0]]) await semerTexte(base, scene, ["Un texte."]);
  await sql("update scenes set etat = 'prete' where id = $1", [chapitres[0].scenes[0]]);
  await aller(page, `/projet/${projet}/suivi`);
  await capturer(page, "suivi-personnel");
});

test("lot 5 : les fiches de rédaction", async ({ page }) => {
  test.setTimeout(300_000);
  n = 480;
  await page.addInitScript(() => {
    window.print = () => {};
  });
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent", aides_masquees: ["classes", "plan", "preparation", "suivi"] }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal", "Chloé", "Dylan", "Emma"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt des lanternes", [
    { titre: "Le dernier bac", scenes: ["Quai — la sirène du dernier bac", "Passerelle — le bac s’éloigne", "Quai — la lanterne qui clignote", "Cabane du passeur — la carte oubliée", "Cabane — la carte s’anime", "Quai — la barque sans rameur", "Rive — le phare éteint"] },
    { titre: "La lisière", scenes: ["Lisière — les lanternes s’éteignent", "Sentier — le chant dans les fougères", "Souche — la chouette messagère", "Clairière — les deux chemins se rejoignent"] },
  ]);
  const [bac, lisiere] = chapitres;
  const e = classe.eleves;
  await semerAttribution(base, bac.id, [{ eleve: e.Chloé.id }, { eleve: e.Dylan.id }, { eleve: e.Emma.id }]);
  await semerAttribution(base, lisiere.id, [{ eleve: e.Alice.id }, { eleve: e.Bilal.id }]);
  const consigne = "Raconte ce que Lou entend et ressent quand le chant l’attire vers les fougères.\n– Décris le chant : doux, triste, joyeux ?\n– Utilise au moins deux sens";
  await base.from("scenes").update({ consigne }).in("id", [...bac.scenes, ...lisiere.scenes.slice(0, 3)]);
  const donner = (scenes: string[], prenom: string) => base.from("scenes").update({ prise_par_eleve: e[prenom].id }).in("id", scenes);
  await donner(bac.scenes.slice(0, 2), "Chloé");
  await donner(bac.scenes.slice(2, 4), "Dylan");
  await donner([bac.scenes[4]], "Emma");
  await donner(lisiere.scenes.slice(0, 2), "Alice");
  await donner([lisiere.scenes[2]], "Bilal");
  await semerBlocs(base, lisiere.scenes[1], [recit("Le chant était si doux que Lou en oublia la barque."), choixAuto("Continuer vers la lumière", lisiere.scenes[3])]);
  await semerTexte(base, lisiere.scenes[2], ["La chouette tenait un message."]);
  await sql("update scenes set etat = 'reprendre', tour = tour + 1 where id = $1", [lisiere.scenes[2]]);
  await sql(
    "insert into remarques (scene_id, projet_id, enseignant_id, eleve_id, texte) select id, projet_id, enseignant_id, prise_par_eleve, 'Dis ce que dit le message, et à qui il est adressé.' from scenes where id = $1",
    [lisiere.scenes[2]],
  );

  // Du Suivi aux fiches
  await aller(page, `/projet/${projet}/suivi?direct=1`);
  await capturer(page, "suivi-bouton-des-fiches");
  await aller(page, `/projet/${projet}/fiches`);
  await capturer(page, "fiches-par-chapitre", true);
  const tirage = page.getByRole("group", { name: "Une feuille" });
  await tirage.getByRole("button", { name: "par élève" }).click();
  await capturer(page, "fiches-par-eleve-scenes-sans-eleve");
  await page.getByRole("checkbox", { name: "À la suite, à découper" }).check();
  await capturer(page, "fiches-a-la-suite", true);
  await page.getByRole("checkbox", { name: "À la suite, à découper" }).uncheck();
  // Le partage des scènes sans élève
  await page.getByRole("button", { name: /répartir entre les élèves du chapitre/ }).click();
  await capturer(page, "fiches-partage-propose");
  await page.locator(".lot-imprimer").click();
  await capturer(page, "fiches-message-de-demande");
  await page.getByRole("alertdialog").getByRole("button", { name: "Annuler" }).click();
  await page.getByRole("button", { name: "Ne pas répartir" }).click();
  // Le plafond et le complément : sans maquette
  await page.getByRole("button", { name: "Fixer un nombre de scènes par élève" }).click();
  await page.getByLabel("Nombre de scènes à écrire par élève, au plus").fill("2");
  await capturer(page, "fiches-plafond-eleve-a-completer");
  await page.getByRole("button", { name: /^Emma/ }).click();
  await capturer(page, "fiches-eleve-complete");
  await page.locator(".lot-imprimer").click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Répartir et imprimer" }).click();
  await page.locator(".lot-note--fait").waitFor();
  await capturer(page, "fiches-repartition-faite");
  // Un seul élève : sa feuille
  await aller(page, `/projet/${projet}/fiches?suivi=${encodeURIComponent(`eleve=${e.Bilal.id}`)}`);
  await capturer(page, "fiches-un-eleve");
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/fiches`);
  await tirage.getByRole("button", { name: "par élève" }).click();
  await page.getByRole("button", { name: "Fixer un nombre de scènes par élève" }).click();
  await page.getByLabel("Nombre de scènes à écrire par élève, au plus").fill("2");
  await capturer(page, "fiches-390", true);
});
