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
