import { test, type Page } from "@playwright/test";
import {
  adultePret, aller, choixAuto, copie, note, recit, selectionner, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, sql, supprimerComptes,
} from "../parcours/outils";

/**
 * Captures des écrans de l'étape 8 : npm run captures -- etape8
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 800;
const capturer = async (page: Page, nom: string, toute = true) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

const ouvrirMonCompte = async (page: Page) => {
  await page.locator("header button[aria-haspopup='dialog']").first().click();
  await page.getByRole("heading", { name: "Mon compte" }).waitFor();
};

test("lot 1 : « Aides IA » dans « Mon compte », et la page de jugement de l'essai", async ({ page }) => {
  test.setTimeout(240_000);
  await adultePret(page);

  await ouvrirMonCompte(page);
  await capturer(page, "mon-compte-aides-ia", false);
  await page.locator(".panneau__corps").evaluate((e) => e.scrollTo(0, e.scrollHeight));
  await capturer(page, "mon-compte-aides-ia-bas", false);
  await page.getByRole("checkbox", { name: "CM1" }).check();
  await page.getByRole("checkbox", { name: "CM2" }).check();
  await page.getByLabel("Degré de correction par défaut").selectOption("3");
  await page.getByText("Enregistré").waitFor();
  await capturer(page, "mon-compte-aides-ia-reglees", false);
  await page.getByText("Proposer les aides IA", { exact: true }).click();
  await page.getByText("Aucune aide IA dans vos projets").waitFor();
  await capturer(page, "mon-compte-aides-ia-eteintes", false);
  await page.getByText("Proposer les aides IA", { exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator("html[data-pret]").waitFor();
  await ouvrirMonCompte(page);
  await page.getByRole("heading", { name: "Aides IA" }).scrollIntoViewIfNeeded();
  await capturer(page, "mon-compte-aides-ia-390", false);

  // La page de jugement lit essais-ia/resultats.json, s'il existe
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, "/essai-ia");
  await capturer(page, "essai-premier-cas");
  for (const cas of ["Correction, degré 3 (phrases plus claires), CM2", "Dix idées de choix : enfermé au grenier, sans la clé", "Fiche visuelle : la chouette messagère"]) {
    const option = page.locator("option", { hasText: cas });
    if (!(await option.count())) continue;
    await page.getByLabel("Aller au cas").selectOption({ label: (await option.textContent())!.trim() });
    await capturer(page, `essai-${cas.split(" ")[0].toLowerCase()}`);
  }
  const propositions = page.locator("section[aria-label^='Proposition']");
  if (await propositions.count()) {
    await propositions.first().getByRole("button", { name: "Bonne" }).click();
    await propositions.first().getByRole("button", { name: /Meilleure/ }).click();
    await propositions.nth(1).getByRole("button", { name: "Passable" }).click();
    await capturer(page, "essai-note");
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await capturer(page, "essai-390");
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, "/essai-ia?resultats=1");
  await capturer(page, "essai-resultats");
});

test("lot 2 : la correction dans la page de scène, et les pistes de reprise", async ({ page }) => {
  test.setTimeout(240_000);
  n = 812;
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CE2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["La grotte du dragon", "Le pont", "Le sentier"] }]);
  const [s1, s2] = chapitres[0].scenes;
  await semerAttribution(base, chapitres[0].id, [{ eleve: classe.eleves.Alice.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id, consigne: "Lou découvre le dragon endormi. Décris la grotte et ce que ressent Lou." }).eq("id", s1);
  await semerBlocs(base, s1, [
    recit("Le dragon dormé dans la grote. Il était très très grand."),
    recit("Lou avancé doucement pour ne pas le révéyer. Sous ses pied, les cailloux brillé comme des étoile. Soudin, le dragon ouvri un œil."),
    note("Penser à l’image du dragon pour la page 12."),
    choixAuto("Reculer sans bruit", s2),
  ]);
  await sql(
    `with sc as (update public.scenes set etat = 'valider', tour = tour + 1 where id = $1 returning id, projet_id, enseignant_id, texte)
     insert into public.remises (scene_id, projet_id, enseignant_id, eleve_id, texte) select id, projet_id, enseignant_id, $2, texte from sc`,
    [s1, classe.eleves.Alice.id],
  );
  const scene = `/projet/${projet}/scene/${s1}`;
  await aller(page, scene);
  await copie(page).waitFor();
  await capturer(page, "scene-corriger");
  await page.locator(".corriger summary").click();
  await capturer(page, "scene-degres", false);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Corriger", exact: true }).click();
  await page.locator("button.corr").first().waitFor();
  await capturer(page, "marques-degre-2");
  await page.locator("button.corr").nth(2).click();
  await page.locator("button.corr").nth(2).hover();
  await capturer(page, "marques-un-refus");
  await page.getByRole("button", { name: "Garder les changements" }).click();
  await page.locator(".message").waitFor();
  await capturer(page, "marques-gardees", false);
  await page.locator(".message").getByRole("button", { name: "Annuler" }).click();
  await page.getByText("La scène a retrouvé son texte").waitFor();

  await selectionner(page, { bloc: 1, offset: 4 }, { bloc: 1, offset: 20 });
  await capturer(page, "corriger-la-selection", false);
  await page.mouse.click(5, 5);

  await sql("update public.scenes set version = version + 1 where id = $1", [s1]);
  await page.getByRole("button", { name: /^Corriger/ }).click();
  await page.getByText("Le texte a changé depuis la demande").waitFor();
  await capturer(page, "texte-change", false);
  await page.getByRole("button", { name: "Laisser" }).click();
  await page.reload();
  await copie(page).waitFor();

  await page.locator(".corriger summary").click();
  await page.getByRole("menuitemradio", { name: /^Degré 4 ·/ }).click();
  await page.getByRole("button", { name: "Corriger", exact: true }).click();
  await page.getByLabel("Paragraphe proposé").first().waitFor();
  await capturer(page, "cote-a-cote-degre-4");
  await page.getByLabel("Paragraphe proposé").first().click();
  await capturer(page, "cote-a-cote-retouche", false);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".corr-cote").scrollIntoViewIfNeeded();
  await capturer(page, "cote-a-cote-390-proposition", false);
  await page.getByRole("tab", { name: "Texte actuel" }).click();
  await capturer(page, "cote-a-cote-390-scene", false);
  await page.getByRole("button", { name: "Laisser" }).click();
  await aller(page, scene);
  await copie(page).waitFor();
  await capturer(page, "scene-390", false);
  await page.locator(".copie__barre").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Corriger", exact: true }).click();
  await page.locator("button.corr").first().waitFor();
  await page.locator(".copie__barre").scrollIntoViewIfNeeded();
  await capturer(page, "marques-390", false);
  await page.getByRole("button", { name: "Laisser" }).click();

  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, scene);
  await page.getByRole("button", { name: "Demander une reprise…" }).click();
  await page.getByRole("button", { name: "Proposer des pistes" }).click();
  await page.waitForFunction(() => (document.querySelector("#remarque") as HTMLTextAreaElement | null)?.value.includes("–"));
  await capturer(page, "reprise-pistes");

  // La longueur, aux degrés 4 et 5
  await aller(page, scene);
  await copie(page).waitFor();
  await page.locator(".corriger summary").click();
  await page.getByRole("menuitemradio", { name: /^Degré 4 ·/ }).click();
  await capturer(page, "longueur-menu", false);
  await page.getByRole("group", { name: "Longueur de la proposition" }).getByRole("button", { name: /×2/ }).click();
  await capturer(page, "longueur-choisie", false);
  await page.getByRole("button", { name: "Corriger", exact: true }).click();
  await page.getByLabel("Paragraphe proposé").first().waitFor();
  await page.locator(".copie__pied").scrollIntoViewIfNeeded();
  await capturer(page, "longueur-cote-a-cote", false);
  await page.getByRole("button", { name: "Laisser" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".corriger summary").scrollIntoViewIfNeeded();
  await page.locator(".corriger summary").click();
  await capturer(page, "longueur-menu-390", false);
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1366, height: 900 });

  await base.from("enseignants").update({ reglages_ia: { degre: 2, proposer: false, niveaux: [], imagesParCreation: 1, qualite: "normale" } }).eq("id", compte.id);
  await aller(page, scene);
  await copie(page).waitFor();
  await capturer(page, "scene-aides-eteintes", false);
});

test("lot 3 : « ✦ Formuler » sous la consigne, et le ✦ du titre de scène", async ({ page }) => {
  test.setTimeout(240_000);
  n = 831;
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CE2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Gué — les pierres qui chantent", "Le pont", "Souche — la lanterne de secours"] }]);
  const [, s2] = chapitres[0].scenes;
  await semerAttribution(base, chapitres[0].id, [{ eleve: classe.eleves.Alice.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id }).eq("id", s2);
  await semerBlocs(base, s2, [recit("Une silhouette avance sur le pont de brume, une lanterne à la main. Lou retient son souffle.")]);
  const scene = `/projet/${projet}/scene/${s2}`;
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, scene);
  await copie(page).waitFor();
  const consigne = page.getByRole("textbox", { name: "Consigne", exact: true });
  await consigne.fill("le passeur apparaît sur le pont");
  await page.getByText("Enregistré").waitFor();
  await capturer(page, "scene-titre-et-formuler", false);

  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await page.getByRole("group", { name: "Titres proposés" }).waitFor();
  await capturer(page, "titre-propose", false);
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Formuler" }).click();
  await page.getByRole("textbox", { name: "Consigne proposée" }).waitFor();
  await capturer(page, "consigne-proposee");
  await page.getByRole("button", { name: "Utiliser" }).last().click();
  await capturer(page, "consigne-utilisee");

  await base.from("scenes").update({ consigne: "le passeur apparaît sur le pont" }).eq("id", s2);
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, scene);
  await copie(page).waitFor();
  await capturer(page, "scene-390", false);
  await page.getByRole("button", { name: "Proposer des titres" }).click();
  await page.getByRole("group", { name: "Titres proposés" }).waitFor();
  await capturer(page, "titre-propose-390", false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Formuler" }).click();
  await page.getByRole("textbox", { name: "Consigne proposée" }).scrollIntoViewIfNeeded();
  await capturer(page, "consigne-proposee-390", false);

  // En projet personnel : la note d'intention
  await page.setViewportSize({ width: 1366, height: 900 });
  const perso = await semerProjet(base, compte, "personnel", "choix", "Mon roman");
  const { chapitres: cp } = await semerPartie(base, perso, "Le début", [{ titre: "Chapitre un", scenes: ["La gare"] }]);
  await base.from("scenes").update({ consigne: "la rencontre avec le passeur" }).eq("id", cp[0].scenes[0]);
  await aller(page, `/projet/${perso}/scene/${cp[0].scenes[0]}`);
  await copie(page).waitFor();
  await page.getByRole("button", { name: "Formuler" }).click();
  await page.getByRole("textbox", { name: "Consigne proposée" }).waitFor();
  await capturer(page, "note-proposee-personnel", false);
});
