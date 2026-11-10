import { test, type Page } from "@playwright/test";
import { action, adultePret, aller, choixAuto, note, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, semerTexte, sql, supprimerComptes } from "../parcours/outils";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de la page de scène de l'adulte (novembre 2026), contre le
 * serveur local : npx playwright test --config playwright.local.config.ts revision-scene
 * Elles s'écrivent dans test-results/captures/scene/. Ce n'est pas un test : rien n'y est vérifié.
 * Aucun appel d'IA n'y part : aucun bouton ✦ n'est cliqué.
 */
const dossier = "test-results/captures/scene";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};
const echap = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
};

test.afterEach(async () => {
  await supprimerComptes();
});

/** Ce que fera « Remettre » : le texte est conservé, la scène passe « À valider ». */
const remettre = (scene: string, eleve: string, ilYA = "0 minutes") =>
  sql(
    `with s as (
       update scenes set etat = 'valider', tour = tour + 1, prise_par_eleve = $2 where id = $1
       returning id, projet_id, enseignant_id, texte)
     insert into remises (scene_id, projet_id, enseignant_id, eleve_id, texte, remis_le)
     select id, projet_id, enseignant_id, $2, texte, now() - $3::interval from s`,
    [scene, eleve, ilYA],
  );

test("Page de scène : une scène longue à valider, ses menus, l'écriture, les états, en 1366 et 390 px", async ({ page }) => {
  test.setTimeout(400_000);
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt engloutie", [
    {
      titre: "La lisière",
      scenes: [
        "Sentier — le chant dans les fougères", "Souche creuse — la lanterne de secours", "Souche — la chouette messagère",
        "Clairière — les deux chemins se rejoignent", "Pont de brume — le passeur apparaît", "Gué — l’eau qui murmure",
      ],
    },
  ]);
  const [lisiere] = chapitres;
  const [sentier, souche, chouette, clairiere, pont, gue] = lisiere.scenes;
  const e = classe.eleves;
  await semerAttribution(base, lisiere.id, [{ eleve: e.Alice.id }, { eleve: e.Bilal.id }, { eleve: e.Chloé.id }]);
  await base.from("scenes").update({ prise_par_eleve: e.Alice.id }).in("id", [sentier, clairiere]);
  await base.from("scenes").update({ prise_par_eleve: e.Bilal.id }).in("id", [souche, chouette]);
  await base.from("scenes").update({
    consigne: "Lou se cache dans une souche creuse et allume la lanterne de secours. Décris ce qu’il découvre à l’intérieur, puis propose deux choix.",
    verification: ["Ce que Lou entend", "Ce que Lou voit à la lueur de la lanterne", "Deux choix à la fin"],
  }).eq("id", souche);
  await semerTexte(base, sentier, ["Un chant montait des fougères, si doux que Lou s’arrêta pour l’écouter."]);
  await semerTexte(base, chouette, ["La chouette tenait un message dans son bec."]);
  await semerBlocs(base, souche, [
    recit("Lou se glissa dans la souche creuse. Il faisait noir comme dans un four, et l’odeur de la mousse mouillée lui chatouillait le nez."),
    recit("Il sortit la lanterne de secour de son sac et frotta l’allumette. La flamme hésita, puis grandit d’un coup, comme si elle avait attendu ce moment depuis longtemps."),
    recit("La lumière dansa sur les murs de bois. Des petits yeux brillait au fond, ronds et dorés. Lou retint son souffle."),
    action("Note la lanterne de secours dans ton inventaire."),
    recit("Une voix murmura : « Éteins ça, tu vas les attirer. » C’était une chouette, ses plumes argentées toutes ébouriffées par la peur."),
    note("Demander à Bilal qui sont « ils » : on ne le sait pas encore."),
    recit("Dehors, quelque chose glissait sur les feuilles mortes, lentement, en s’arrêtant parfois comme pour écouter."),
    choixAuto("Sortir de la souche", clairiere),
    choixAuto("Rester caché avec la chouette", chouette),
  ]);
  await remettre(souche, e.Bilal.id, "1 day 2 hours");

  const adresse = `/projet/${projet}/scene/${souche}`;
  await page.setViewportSize({ width: 1366, height: 768 });

  // À valider : la relecture
  await aller(page, adresse);
  await page.locator('.copie__texte[contenteditable]').waitFor();
  await capturer(page, "a-valider");
  await capturer(page, "a-valider-toute", true);

  // Les menus de l'en-tête : l'état, qui s'en occupe, les autres commandes
  await page.locator("summary.tampon--menu").click();
  await capturer(page, "menu-etat");
  await echap(page);
  await page.getByText(/s’en occupe/).first().click();
  await capturer(page, "menu-qui");
  await echap(page);
  await page.locator('summary[aria-label^="Autres commandes de la scène"]').click();
  await capturer(page, "menu-scene");
  await echap(page);

  // L'onglet du texte remis, la consigne ouverte, la remarque de reprise
  await page.getByRole("tab", { name: /^Remis le/ }).click();
  await capturer(page, "onglet-remis");
  await page.getByRole("tab", { name: /Texte de la scène/ }).first().click();
  await page.locator("summary").filter({ hasText: "Consigne" }).first().click({ timeout: 5000 }).catch(() => undefined);
  await capturer(page, "consigne-ouverte");
  await aller(page, adresse);
  await page.getByRole("button", { name: "Demander une reprise…" }).click();
  await page.getByLabel(/^Remarque pour Bilal/).fill("Ajoute ce que Lou voit à la lueur de la lanterne avant d’entendre la voix.");
  await capturer(page, "remarque");

  // Écrire : un choix ouvert dans le panneau, le menu « Insérer »
  await aller(page, adresse);
  await page.getByText("Sortir de la souche").first().click();
  await capturer(page, "choix-panneau");
  await echap(page);
  await aller(page, adresse);
  await page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Insérer" }).click();
  await capturer(page, "inserer");
  await echap(page);

  // Les autres états : en cours chez l'enseignant, validée, texte vide, sans élève
  await sql("update scenes set etat = 'cours', prise_par_eleve = null, prise_par_enseignant = true, tour = tour + 1 where id = $1", [souche]);
  await aller(page, adresse);
  await capturer(page, "en-cours-enseignant");
  await sql("update scenes set etat = 'valide', prise_par_enseignant = false, prise_par_eleve = $2, tour = tour + 1 where id = $1", [souche, e.Bilal.id]);
  await aller(page, adresse);
  await capturer(page, "validee");
  await aller(page, `/projet/${projet}/scene/${gue}`);
  await capturer(page, "texte-vide");
  await semerTexte(base, pont, ["Sur le pont de brume, une silhouette apparut."]);
  await aller(page, `/projet/${projet}/scene/${pont}`);
  await page.locator("summary.tampon--menu").click();
  await capturer(page, "sans-eleve-etats");
  await echap(page);

  // Projet personnel
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  const perso = await semerPartie(base, seul, "Le départ", [{ titre: "La gare", scenes: ["Le quai"] }], "cite");
  await semerTexte(base, perso.chapitres[0].scenes[0], ["Le train entra en gare dans un nuage de vapeur."]);
  await aller(page, `/projet/${seul}/scene/${perso.chapitres[0].scenes[0]}`);
  await capturer(page, "personnel");

  // Téléphone
  await sql("update scenes set etat = 'valider', tour = tour + 1 where id = $1", [souche]);
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, adresse);
  await page.locator('.copie__texte[contenteditable]').waitFor();
  await capturer(page, "390");
  await capturer(page, "390-toute", true);
  await page.locator("summary.tampon--menu").click();
  await capturer(page, "390-menu-etat");
});
