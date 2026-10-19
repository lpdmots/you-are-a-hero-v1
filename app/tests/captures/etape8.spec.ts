import { test, type Page } from "@playwright/test";
import {
  adultePret, aller, choixAuto, classeQuiEcrit, copie, note, posteDe, recit, selectionner, semerAttribution, semerBlocs, semerClasse, semerImageDeposee, semerPartie, semerProjet,
  sql, supprimerComptes,
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
  // Noter écrirait dans essais-ia/jugements.json, les notes du porteur : la capture n'y touche pas
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

test("lot 3 : « ✦ Écrire » une scène vide", async ({ page }) => {
  test.setTimeout(240_000);
  n = 839;
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CE2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Grotte — le dragon endormi", "Le pont"] }]);
  const [s1] = chapitres[0].scenes;
  await semerAttribution(base, chapitres[0].id, [{ eleve: classe.eleves.Alice.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id, consigne: "Lou entre dans la grotte où dort le dragon. Raconte comment il avance sans le réveiller.\nDécris :\n– la grotte ;\n– ce que ressent Lou." }).eq("id", s1);
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, `/projet/${projet}/scene/${s1}`);
  await copie(page).waitFor();
  await capturer(page, "ecrire-scene-vide", false);
  await page.getByRole("button", { name: "Écrire", exact: true }).click();
  await page.getByRole("alertdialog").waitFor();
  await capturer(page, "ecrire-prevenir", false);
  await page.getByRole("button", { name: "Écrire quand même" }).click();
  await page.getByRole("button", { name: "Mettre ce texte dans la scène" }).waitFor();
  await capturer(page, "ecrire-proposition", false);
  await page.setViewportSize({ width: 390, height: 844 });
  await capturer(page, "ecrire-proposition-390", false);
});

test("lot 4 : les idées de choix dans le panneau à droite du texte", async ({ page }) => {
  test.setTimeout(240_000);
  n = 843;
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await semerClasse(base, "CE2", ["Alice"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["Gué — les pierres qui chantent", "Le pont", "Souche — la lanterne de secours", "La clairière aux lucioles"] },
  ]);
  const [gue, pont, souche] = chapitres[0].scenes;
  await semerAttribution(base, chapitres[0].id, [{ eleve: classe.eleves.Alice.id }]);
  await base.from("scenes").update({ prise_par_eleve: classe.eleves.Alice.id, consigne: "Le passeur apparaît sur le pont. Raconte ce qu'il dit à Lou.\nDécris :\n– sa lanterne ;\n– sa voix." }).eq("id", pont);
  await semerBlocs(base, pont, [
    recit("Une silhouette avance sur le pont de brume, une lanterne à la main. Lou retient son souffle."),
    recit("« Personne ne traverse sans payer », dit le passeur d'une voix rauque. Sa lanterne grésille, et la brume se referme derrière lui."),
  ]);
  // Des idées comme l'IA en rend, servies par le navigateur : aucune demande ne part chez le fournisseur
  const nouvelle = (libelle: string, intention: string, titre: string) => ({ libelle, intention, destination: { sorte: "nouvelle", titre } });
  const existante = (libelle: string, intention: string, sceneId: string) => ({ libelle, intention, destination: { sorte: "existante", sceneId } });
  const idees = [
    nouvelle("Suivre le passeur sur l'autre rive", "Le passeur mène Lou vers une rive inconnue ; on découvre ce qu'il cache sous sa cape.", "La rive des lanternes"),
    existante("Retourner au gué", "Prudence : Lou revient sur ses pas, mais les pierres ne chantent plus de la même façon.", gue),
    nouvelle("Se cacher sous le pont", "Lou observe le passeur sans être vu et surprend une conversation avec quelqu'un d'invisible.", "Sous les planches du pont"),
    nouvelle("Proposer un objet en échange", "Lou fouille son sac : le passeur accepte, mais pas ce que Lou croyait.", "Le prix du passage"),
    existante("Allumer la lanterne de secours", "La lumière fait reculer la brume et révèle un sentier caché.", souche),
    nouvelle("Sauter dans la brume", "Un choix audacieux : Lou tombe plus loin qu'il ne l'imaginait.", "La chute dans la brume"),
    nouvelle("Demander son nom au passeur", "Le passeur hésite ; son nom ouvre une piste pour la suite du livre.", "Le nom oublié"),
    nouvelle("Courir sans payer", "Lou fonce ; le pont tangue, et une planche cède.", "La planche qui cède"),
    nouvelle("Attendre que la brume se lève", "Le temps passe, le passeur s'impatiente, et la nuit tombe.", "La nuit sur le pont"),
    nouvelle("Chanter la chanson des pierres", "Le chant apaise le passeur, qui laisse passer Lou en silence.", "Le chant qui apaise"),
  ];
  let attente = 0;
  await page.route("**/ia/idees-choix", async (route) => {
    if (attente) await new Promise((fin) => setTimeout(fin, attente));
    await route.fulfill({ json: { ok: true, idees, reste: null } });
  });
  const panneau = page.getByRole("region", { name: "Idées de choix" });
  const ligne = (i: number) => panneau.getByRole("listitem").nth(i);
  const scene = `/projet/${projet}/scene/${pont}`;

  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, scene);
  await copie(page).waitFor();
  attente = 4000;
  await page.getByRole("button", { name: "Idées de choix" }).click();
  await panneau.getByRole("button", { name: "Proposer des idées" }).waitFor();
  await capturer(page, "idees-ouverture", false);
  await panneau.getByRole("button", { name: "Proposer des idées" }).click();
  await panneau.getByText("L’IA cherche des idées").waitFor();
  await capturer(page, "idees-attente", false);
  await panneau.getByRole("listitem").first().waitFor({ timeout: 10_000 });
  attente = 0;
  await capturer(page, "idees-trois", false);
  await ligne(0).getByRole("checkbox").check();
  await ligne(1).getByRole("checkbox").check();
  await capturer(page, "idees-cochees", false);
  await ligne(2).getByRole("textbox", { name: "Ce que fait le lecteur" }).fill("Se cacher sous le pont et écouter");
  await capturer(page, "idees-retouche", false);
  await ligne(0).getByRole("button", { name: "Changer" }).click();
  await capturer(page, "idees-changer", false);
  await ligne(0).getByRole("button", { name: "Fermer sans changer" }).click();
  await ligne(2).getByRole("checkbox").uncheck();
  await panneau.getByRole("button", { name: "D’autres idées" }).click();
  await capturer(page, "idees-autres", false);
  await panneau.getByRole("button", { name: "Orienter l’IA" }).click();
  await panneau.getByRole("textbox", { name: /Orienter l’IA/ }).fill("un choix qui utilise un objet du sac");
  await capturer(page, "idees-orienter", false);
  await panneau.getByRole("button", { name: /^Ajouter/ }).click();
  await page.locator(".copie__message").waitFor();
  await capturer(page, "idees-ajoutees", false);

  // Comme le serveur, qui ne repropose pas un choix déjà dans la scène
  idees.splice(0, 2);
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, scene);
  await copie(page).waitFor();
  await capturer(page, "idees-bouton-390", false);
  await page.getByRole("button", { name: "Idées de choix" }).click();
  await panneau.getByRole("button", { name: "Proposer des idées" }).click();
  await panneau.getByRole("listitem").first().waitFor();
  await capturer(page, "idees-390", false);
  await ligne(0).getByRole("checkbox").check();
  await panneau.getByRole("button", { name: /^Ajouter/ }).scrollIntoViewIfNeeded();
  await capturer(page, "idees-390-cochee", false);
});

/** Une préparation en cours : l'univers retenu, des questions et des idées pour les personnages. */
async function semerPreparation(base: import("@supabase/supabase-js").SupabaseClient, compte: { id: string }, projet: string) {
  await base.from("preparations").update({
    univers: "Un pays de lacs et de forêts noyé dans la brume. Des passeurs guident les voyageurs avec des lanternes ; quand elles s’éteignent, les chemins changent de place.",
  }).eq("projet_id", projet);
  await base.from("questions").insert([
    { projet_id: projet, enseignant_id: compte.id, etape: "personnages", texte: "A-t-il un animal avec lui ?", origine: "main" },
    { projet_id: projet, enseignant_id: compte.id, etape: "personnages", texte: "Que fait-il quand il a très peur ?", origine: "ia" },
  ]);
  const idees: [string, string, string][] = [
    ["Lou, 10 ans, fils du dernier passeur", "retenue", "main"],
    ["Il connaît le chant des lanternes", "retenue", "ia"],
    ["Une chouette qui ne parle qu’aux enfants", "discuter", "main"],
    ["Il a peur de l’eau", "discuter", "main"],
    ["Des jumeaux inséparables", "ecartee", "main"],
  ];
  for (const [texte, etat, origine] of idees) {
    await base.from("pistes").insert({ projet_id: projet, enseignant_id: compte.id, rubrique: "personnages", texte, etat, origine });
  }
}

test("lot 5 : la Préparation en étapes (F02, F13.4)", async ({ page }) => {
  test.setTimeout(240_000);
  n = 855;
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  await semerPreparation(base, compte, projet);

  // L'écran d'aide, à la première ouverture
  await base.from("enseignants").update({ aides_masquees: [] }).eq("id", compte.id);
  await aller(page, `/projet/${projet}/preparation`);
  await page.getByRole("button", { name: "Commencer" }).waitFor();
  await capturer(page, "preparation-aide");
  await page.getByRole("button", { name: "Commencer" }).click();

  // La page s'ouvre sur la première étape sans texte retenu : Personnages
  await page.getByRole("heading", { name: /Qui est notre héros/ }).waitFor();
  await capturer(page, "preparation-personnages");
  await capturer(page, "preparation-personnages-ecran", false);
  // Le ✦ des idées, la première fois : « Orienter l'IA » d'abord
  await page.getByRole("button", { name: "Demander une idée à l’IA" }).click();
  await page.getByRole("button", { name: "Proposer une idée" }).waitFor();
  await page.getByRole("textbox", { name: /Orienter l’IA/ }).fill("un compagnon animal");
  await capturer(page, "preparation-orienter", false);
  await page.getByRole("button", { name: "Proposer une idée" }).click();
  await page.getByText("Il parle aux chouettes").waitFor();
  await page.getByRole("button", { name: "Demander une question à l’IA" }).click();
  await page.getByText(/le rend différent des autres/).waitFor();
  await capturer(page, "preparation-idee-ia");
  // « Rédiger d'après les idées » : une proposition, rien de remplacé
  await page.getByRole("button", { name: "Rédiger d’après les idées" }).click();
  await page.getByText("Texte proposé · modifiable").waitFor();
  await capturer(page, "preparation-rediger");

  // Grandes étapes : les parties seules
  await semerPartie(base, projet, "Le port", [{ titre: "Le départ" }], "port");
  await semerPartie(base, projet, "La forêt", [{ titre: "La lisière" }, { titre: "Le sanctuaire" }, { titre: "Les racines" }], "foret");
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await page.getByRole("heading", { name: /Par quels lieux/ }).waitFor();
  await capturer(page, "preparation-grandes-etapes");
  await aller(page, `/projet/${projet}/preparation?etape=choix`);
  await capturer(page, "preparation-les-choix");
  await aller(page, `/projet/${projet}/preparation?etape=jeu`);
  await capturer(page, "preparation-le-jeu");

  // « Projeter » : le même écran, en grand
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await page.getByRole("link", { name: "Projeter" }).click();
  await page.getByRole("link", { name: "Quitter la projection" }).first().waitFor();
  await capturer(page, "preparation-projetee", false);
  await capturer(page, "preparation-projetee-toute");

  // Aides éteintes : les boutons doubles redeviennent simples
  await base.from("enseignants").update({ reglages_ia: { proposer: false } }).eq("id", compte.id);
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await capturer(page, "preparation-sans-ia", false);
  await base.from("enseignants").update({ reglages_ia: {} }).eq("id", compte.id);

  // Sur téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/preparation?etape=personnages`);
  await capturer(page, "preparation-390", false);
  await capturer(page, "preparation-390-toute");
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await capturer(page, "preparation-390-grandes-etapes");

  // Projet personnel : « Je retiens », questions pour soi, pas de projection
  await page.setViewportSize({ width: 1366, height: 900 });
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  await aller(page, `/projet/${seul}/preparation`);
  await capturer(page, "preparation-personnel");
});

test("lot 6 : parties, chapitres et résumés (F13.5)", async ({ page }) => {
  test.setTimeout(240_000);
  n = 871;
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  await semerPreparation(base, compte, projet);
  await semerPartie(base, projet, "Le port", [{ titre: "Le départ", scenes: ["Le quai"] }], "port");
  const foret = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["L’entrée du bois", "La souche creuse"] }, { titre: "Le sanctuaire" }], "foret");
  await base.from("chapitres").update({ resume: "Lou entre dans le bois, guidé par la chouette." }).eq("id", foret.chapitres[0].id);

  // « Parties et chapitres » : les boutons doubles
  await aller(page, `/projet/${projet}/plan`);
  await capturer(page, "plan-boutons-doubles", false);
  await capturer(page, "plan-boutons-doubles-toute");

  // Idées de parties : orienter d'abord, puis trois ensembles
  await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
  await page.getByRole("button", { name: "Proposer des parties" }).waitFor();
  await capturer(page, "parties-ouverture", false);
  await page.getByRole("textbox", { name: /Orienter l’IA/ }).fill("un passage près de l’eau");
  await page.getByRole("button", { name: "Proposer des parties" }).click();
  await page.getByRole("textbox", { name: "Titre de la partie" }).first().waitFor();
  await capturer(page, "parties-trois", false);
  await page.getByRole("checkbox", { name: "Garder la partie « Le marais des lucioles »" }).check();
  await page.getByRole("textbox", { name: "Titre du premier chapitre" }).nth(2).fill("Les cloches d’en bas");
  await capturer(page, "parties-cochees", false);
  await page.getByRole("button", { name: "D’autres idées" }).click();
  await page.getByRole("textbox", { name: "Titre de la partie" }).nth(3).waitFor();
  await capturer(page, "parties-autres", false);
  await page.getByRole("button", { name: "Ajouter 2 parties" }).click();
  await page.getByText(/2 parties ajoutées à la fin du plan/).waitFor();
  await capturer(page, "parties-ajoutees", false);

  // Un chapitre par l'IA : orienter d'abord, sous la partie
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
  await page.getByRole("button", { name: "Proposer des chapitres" }).waitFor();
  await page.getByRole("textbox", { name: /Orienter l’IA/ }).fill("une rencontre au bord de l’eau");
  await capturer(page, "chapitre-orienter", false);
  await page.getByRole("button", { name: "Proposer des chapitres" }).click();
  await page.getByRole("textbox", { name: "Titre du chapitre proposé" }).waitFor();
  await capturer(page, "chapitre-propose", false);
  await page.getByRole("button", { name: "Proposition suivante" }).click();
  await capturer(page, "chapitre-propose-suivant", false);
  await page.getByRole("button", { name: "Ajouter ce chapitre" }).click();
  await page.getByText(/« La cabane du pêcheur » est ajouté/).waitFor();
  await capturer(page, "chapitre-ajoute", false);
  await page.getByRole("button", { name: "Fermer l’aide de l’IA" }).click();

  // Le résumé proposé, dans les réglages du chapitre
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await page.getByRole("button", { name: "Proposer un autre résumé avec l’IA" }).click();
  await page.getByText("Résumé remplacé.").waitFor();
  await capturer(page, "resume-propose", false);
  await page.keyboard.press("Escape");

  // Grandes étapes : le même bouton double, le même panneau
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await page.getByRole("heading", { name: /Par quels lieux/ }).waitFor();
  await capturer(page, "grandes-etapes-double");
  await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
  await page.getByRole("button", { name: "Proposer des parties" }).waitFor();
  await capturer(page, "grandes-etapes-panneau", false);

  // Sur téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/plan`);
  await capturer(page, "plan-390", false);
  await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
  await page.getByRole("button", { name: "Proposer des parties" }).click();
  await page.getByRole("textbox", { name: "Titre de la partie" }).first().waitFor();
  await capturer(page, "parties-390", false);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).scrollIntoViewIfNeeded();
  await capturer(page, "chapitre-double-390", false);
  await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
  await page.getByRole("button", { name: "Proposer des chapitres" }).click();
  await page.getByRole("textbox", { name: "Titre du chapitre proposé" }).waitFor();
  await capturer(page, "chapitre-propose-390", false);

  // Aides éteintes : des boutons simples
  await page.setViewportSize({ width: 1366, height: 900 });
  await base.from("enseignants").update({ reglages_ia: { proposer: false } }).eq("id", compte.id);
  await aller(page, `/projet/${projet}/plan`);
  await capturer(page, "plan-sans-ia", false);
});

test("lot 7 : personnages et objets de l'histoire (F10.2), un onglet par héros", async ({ page }) => {
  test.setTimeout(300_000);
  n = 890;
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  await semerPreparation(base, compte, projet);
  await base.from("preparations").update({
    personnages: "Lou, 10 ans, fils du dernier passeur du village. Il connaît le chant des lanternes mais a peur de l’eau. Son père, Maël, a disparu dans la brume. Une chouette, Brindille, le guide la nuit.",
  }).eq("projet_id", projet);
  await base.from("enseignants").update({ reglages_ia: { imagesParCreation: 2 } }).eq("id", compte.id);
  const etape = `/projet/${projet}/preparation?etape=personnages`;

  // Sans carte de héros : un seul onglet, « Le héros », et « Donner un nom au héros »
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, etape);
  await capturer(page, "heros-sans-carte", false);
  await page.getByRole("button", { name: "Donner un nom au héros" }).click();
  await page.locator(".panneau").getByLabel("Nom", { exact: true }).fill("Lou");
  await page.locator(".panneau").getByRole("button", { name: /son apparence avec l’IA/ }).click();
  await page.getByRole("button", { name: "Utiliser ce texte" }).click();
  await page.locator(".panneau").getByRole("button", { name: "Créer son portrait" }).click();
  await page.getByText("Une autre proposition").waitFor();
  await page.locator(".panneau__corps").evaluate((e) => e.scrollTo(0, e.scrollHeight));
  await capturer(page, "heros-deux-portraits", false);
  await page.getByRole("button", { name: "Mettre celle-ci à la place" }).click();
  await page.getByText("Portrait de « Lou » gardé.").waitFor();
  await page.locator(".panneau").getByRole("button", { name: "Fermer", exact: true }).last().click();
  await page.reload();
  await page.getByRole("link", { name: "Lou" }).waitFor();
  await capturer(page, "heros-lou", false);
  await capturer(page, "heros-lou-toute");

  // Un autre héros : son onglet, sa question, ses questions et ses idées
  await page.getByRole("button", { name: "Un autre héros" }).click();
  await page.getByRole("textbox", { name: "Nom du nouveau héros" }).fill("Mina");
  await page.getByRole("textbox", { name: "Nom du nouveau héros" }).press("Enter");
  await page.getByRole("heading", { name: /Qui est Mina/ }).waitFor();
  await page.getByRole("textbox", { name: "Nous retenons…" }).fill("La sœur de Lou, onze ans. Elle sait nager et n’a peur de rien.");
  await page.getByRole("button", { name: "Demander une idée à l’IA" }).click();
  await page.getByRole("button", { name: "Proposer une idée" }).click();
  await page.getByText("Il parle aux chouettes").waitFor();
  await capturer(page, "heros-mina", false);

  // Autres personnages : la liste simple, et « Repérer les personnages »
  await page.getByRole("link", { name: /Autres personnages/ }).click();
  await page.getByRole("heading", { name: /Qui d’autre croise/ }).waitFor();
  await capturer(page, "autres-vide", false);
  await page.getByRole("button", { name: "Repérer les personnages d’après le texte retenu" }).click();
  await page.getByText("Personnages repérés").waitFor();
  await capturer(page, "autres-reperes", false);
  await page.getByRole("button", { name: "Ajouter 2 personnages" }).click();
  await page.getByText("2 personnages ajoutés.").waitFor();
  await capturer(page, "autres-cartes", false);
  await page.getByRole("button", { name: "Ouvrir la carte de Maël" }).click();
  await capturer(page, "autre-panneau", false);
  await page.keyboard.press("Escape");

  // Un objet de l'histoire : sa fiche visuelle et son image de référence
  await base.from("objets").insert({ projet_id: projet, enseignant_id: compte.id, nom: "la lanterne de cuivre", description: "Celle du père de Lou" });
  await aller(page, `/projet/${projet}/preparation?etape=jeu`);
  await page.getByRole("button", { name: "Modifier la lanterne de cuivre" }).click();
  await page.getByRole("button", { name: /son apparence avec l’IA/ }).click();
  await page.getByRole("button", { name: "Utiliser ce texte" }).click();
  await page.getByRole("button", { name: "Créer son image" }).click();
  await page.getByText("Une autre proposition").waitFor();
  await capturer(page, "objet-images", false);
  await page.keyboard.press("Escape");

  // Réglages du projet : le style des images et le héros absent
  await page.getByRole("button", { name: "Réglages du projet" }).click();
  await page.getByRole("heading", { name: "Le héros dans les images" }).scrollIntoViewIfNeeded();
  await capturer(page, "projet-style-images", false);
  await page.keyboard.press("Escape");

  // `/personnage` dans une scène
  const { chapitres } = await semerPartie(base, projet, "Le port", [{ titre: "Le départ", scenes: ["Le quai"] }], "port");
  await aller(page, `/projet/${projet}/scene/${chapitres[0].scenes[0]}`);
  await copie(page).click();
  await page.keyboard.type("Au bout du quai, /perso");
  await page.locator(".slash").waitFor();
  await page.keyboard.press("Enter");
  await page.getByRole("dialog", { name: "Personnages de l’histoire" }).waitFor();
  await capturer(page, "personnage-commande", false);
  await page.keyboard.press("Escape");

  // Projection : les mêmes onglets
  await aller(page, `/atelier/${projet}/personnages`);
  await capturer(page, "heros-projete", false);

  // Sur téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, etape);
  await capturer(page, "heros-390", false);
  await capturer(page, "heros-390-toute");
});

/** Les réponses des images créées attendent un peu : l'attente se capture (IA_SIMULEE répond sur-le-champ). */
const ralentirLesImages = (page: Page, ms = 2500) =>
  page.route("**/ia/images", async (route) => {
    await new Promise((r) => setTimeout(r, ms));
    await route.continue();
  });

test("lot 8 : les images créées (F10.1, F10.2, F11.4)", async ({ page, browser }) => {
  test.setTimeout(300_000);
  n = 909;
  const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  const { base, compte, projet } = s;
  await base.from("enseignants").update({ reglages_ia: { imagesParCreation: 2 } }).eq("id", compte.id);
  await base.from("projets").update({ style_images: "lumineuse" }).eq("id", projet);
  await semerPreparation(base, compte, projet);
  await base.from("chapitres").update({ resume: "Lou s’aventure sous les grands arbres, où la brume efface le sentier derrière lui." }).eq("id", s.lisiere.id);
  const portrait = await semerImageDeposee(base, compte, projet);
  await base.from("personnages").insert([
    { projet_id: projet, enseignant_id: compte.id, nom: "Lou", autres_noms: ["le garçon"], heros: true, fiche: "Dix ans, ciré moutarde, bottes vertes.", portrait_id: portrait, rang: 0 },
    { projet_id: projet, enseignant_id: compte.id, nom: "Maël", autres_noms: ["le passeur"], heros: false, fiche: "Grand, barbe grise, manteau bleu nuit.", portrait_id: portrait, rang: 1 },
    { projet_id: projet, enseignant_id: compte.id, nom: "Brindille", autres_noms: ["la chouette"], heros: false, fiche: "Petite chouette grise aux yeux d’ambre.", portrait_id: null, rang: 2 },
  ]).throwOnError();
  await base.from("objets").insert({ projet_id: projet, enseignant_id: compte.id, nom: "la lanterne de cuivre", description: "Celle du père de Lou.", fiche: "Cuivre patiné, verre bleuté." });
  const scene = s.lisiere.scenes[1];
  await semerBlocs(base, scene, [
    recit("Le pont de cordes se balance au-dessus du ravin. De l’autre côté, le passeur lève sa lanterne de cuivre et te fait signe d’avancer."),
    recit("Une chouette se pose sur la rambarde."),
  ]);
  await page.setViewportSize({ width: 1366, height: 900 });

  // « Choisir une image » d'un chapitre : créer d'après le résumé
  await aller(page, `/projet/${projet}/plan`);
  await page.getByLabel("Autres commandes du chapitre La lisière").click();
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await capturer(page, "chapitre-reglages", false);
  await page.getByRole("complementary").getByRole("button", { name: "Choisir une image" }).click();
  await page.getByRole("heading", { name: "Choisir une image" }).waitFor();
  await capturer(page, "reperage-choisir", false);
  await ralentirLesImages(page);
  await page.getByRole("button", { name: "Créer une image d’après le résumé" }).click();
  await page.getByText("L’IA dessine un lieu").waitFor();
  await capturer(page, "reperage-attente", false);
  await page.getByRole("group", { name: /Une autre proposition/ }).waitFor();
  await capturer(page, "reperage-propositions", false);
  await page.getByRole("button", { name: "Garder celle-ci" }).first().click();
  await page.getByRole("heading", { name: "Choisir une image" }).waitFor({ state: "detached" });
  await page.unrouteAll({ behavior: "wait" });

  // L'image d'une scène, dans le panneau à droite du texte
  await aller(page, `/projet/${projet}/scene/${scene}`);
  await copie(page).click();
  await page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Image" }).click();
  await capturer(page, "scene-ajouter-image", false);
  await page.locator(".cx").first().getByRole("button", { name: "Créer une image" }).click();
  const creer = page.getByRole("region", { name: "Créer une image" });
  await creer.getByRole("group", { name: "Dans l’image" }).waitFor();
  await capturer(page, "scene-creer", false);
  // Tous nommés dans le texte : un badge retiré revient par « + »
  await creer.getByRole("button", { name: "Retirer la lanterne de cuivre de l’image" }).click();
  await creer.getByLabel("Ajouter un personnage ou un objet à l’image").click();
  await capturer(page, "scene-badges-plus", false);
  await page.getByRole("button", { name: "la lanterne de cuivre" }).click();
  await creer.getByLabel("Ce que montre l’image").fill("le passeur qui attend au bout du pont, la lanterne levée");
  await creer.getByRole("radio", { name: "Pleine page" }).check({ force: true });
  await creer.getByRole("button", { name: "Proposer la description" }).click();
  await creer.locator(".ci__decrit").waitFor();
  await capturer(page, "scene-description", false);
  await ralentirLesImages(page);
  await creer.getByRole("button", { name: "Créer l’image" }).click();
  await creer.getByText("L’IA dessine…").waitFor();
  await capturer(page, "scene-attente", false);
  await creer.getByRole("group", { name: /Deux propositions/ }).waitFor();
  await capturer(page, "scene-propositions", false);
  await creer.getByRole("button", { name: "Garder celle-ci" }).first().click();
  await copie(page).locator(".image-bloc").waitFor();
  await capturer(page, "scene-image-posee", false);
  await page.unrouteAll({ behavior: "wait" });

  // Sur téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/scene/${s.lisiere.scenes[0]}`);
  await copie(page).click();
  await page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Image" }).click();
  await page.locator(".cx").first().getByRole("button", { name: "Créer une image" }).click();
  await page.getByRole("region", { name: "Créer une image" }).getByRole("group", { name: "Dans l’image" }).waitFor();
  await capturer(page, "scene-creer-390", false);
  await page.setViewportSize({ width: 1366, height: 900 });

  // Aides éteintes : le prompt seul
  await base.from("enseignants").update({ reglages_ia: { imagesParCreation: 2, proposer: false } }).eq("id", compte.id);
  await aller(page, `/projet/${projet}/scene/${s.lisiere.scenes[0]}`);
  await copie(page).click();
  await page.getByRole("toolbar", { name: "Outils de la copie" }).getByRole("button", { name: "Image" }).click();
  await capturer(page, "scene-sans-ia", false);
  await page.locator(".cx").first().getByRole("button", { name: "Préparer le prompt d’une image" }).click();
  await page.getByRole("heading", { name: "Prompt d’une image" }).waitFor();
  await capturer(page, "scene-prompt-sans-ia", false);
  await base.from("enseignants").update({ reglages_ia: { imagesParCreation: 2 } }).eq("id", compte.id);

  // L'image créée d'office : un chapitre ajouté par l'IA, son signe d'attente, la mention
  await aller(page, `/projet/${projet}/plan`);
  await page.getByRole("button", { name: "Demander des chapitres à l’IA pour « La forêt »" }).click();
  const espace = page.getByRole("group", { name: "Chapitres proposés pour « La forêt »" });
  await espace.getByRole("button", { name: "Proposer des chapitres" }).click();
  await espace.getByText("Image créée à l’ajout").waitFor();
  await capturer(page, "ajout-mention", false);
  await ralentirLesImages(page, 4000);
  await espace.getByRole("button", { name: "Ajouter ce chapitre" }).click();
  await page.locator(".attente-image").first().waitFor();
  await page.locator(".attente-image").first().scrollIntoViewIfNeeded();
  await capturer(page, "ajout-attente", false);
  await page.locator(".attente-image").first().waitFor({ state: "detached" });
  await page.waitForTimeout(800);
  await capturer(page, "ajout-image", false);
  await page.unrouteAll({ behavior: "wait" });
  await page.getByRole("button", { name: "Demander des idées de parties à l’IA" }).click();
  await page.getByRole("button", { name: "Proposer des parties" }).click();
  await page.getByText("Image créée à l’ajout").last().waitFor();
  await capturer(page, "parties-mention", false);
  await page.getByRole("button", { name: "Régler" }).last().click();
  await page.getByRole("heading", { name: "Mon compte" }).waitFor();
  await capturer(page, "mon-compte-image-ajout", false);
  await page.keyboard.press("Escape");

  // L'idée d'image de l'élève
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.setViewportSize({ width: 1366, height: 900 });
  await aller(alice.page, `/travail/scene/${s.lisiere.scenes[0]}`);
  const n0 = n;
  n += 1;
  await alice.page.waitForTimeout(500);
  await alice.page.screenshot({ path: `${dossier}/${n}-eleve-idee-fermee.png` });
  await alice.page.locator("details", { hasText: "Mon idée d’image" }).locator("summary").click();
  await alice.page.locator("details", { hasText: "Mon idée d’image" }).getByRole("textbox").fill("Une grotte pleine de cristaux bleus qui brillent dans le noir, et une petite rivière.");
  await alice.page.locator("details", { hasText: "Mon idée d’image" }).getByRole("textbox").blur();
  await alice.page.getByText("Enregistrée.").waitFor();
  n += 1;
  await alice.page.screenshot({ path: `${dossier}/${n}-eleve-idee.png` });
  await alice.page.setViewportSize({ width: 390, height: 844 });
  await alice.page.waitForTimeout(400);
  n += 1;
  await alice.page.screenshot({ path: `${dossier}/${n}-eleve-idee-390.png`, fullPage: true });
  await alice.contexte.close();
  void n0;

  // Le prompt de couverture
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  await capturer(page, "couverture-replie", false);
  const prompt = page.locator("details.couverture__prompt");
  await prompt.locator("summary").click();
  await prompt.getByLabel("Ce que montre la couverture").fill("le bac sur le lac au lever du jour");
  await prompt.getByRole("button", { name: "Proposer la description" }).click();
  await prompt.locator(".ci__decrit").waitFor();
  await prompt.scrollIntoViewIfNeeded();
  await capturer(page, "couverture-prompt", false);
});

test("lot 9 : l'application sans les aides, en panne, et sur un site sans les clés", async ({ page, request }) => {
  test.setTimeout(240_000);
  n = 950;
  const s = await classeQuiEcrit(page, ["Alice", "Bilal"]);
  const { base, compte, projet } = s;
  const [sentier] = s.lisiere.scenes;
  await semerPreparation(base, compte, projet);
  await base.from("scenes").update({ consigne: "Lou découvre le dragon endormi. Décris la grotte." }).eq("id", sentier);
  await semerBlocs(base, sentier, [recit("Le dragon dormé dans la grote. Il était très très grand.")]);
  await page.setViewportSize({ width: 1366, height: 900 });

  // Aides éteintes : les mêmes écrans, sans un signe de l'IA
  await base.from("enseignants").update({ reglages_ia: { proposer: false } }).eq("id", compte.id);
  for (const [adresse, nom] of [
    [`/projet/${projet}/preparation?etape=personnages`, "sans-ia-preparation"],
    [`/projet/${projet}/plan`, "sans-ia-plan"],
    [`/projet/${projet}/scene/${sentier}`, "sans-ia-scene"],
  ]) {
    await aller(page, adresse);
    await capturer(page, nom, false);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet}/scene/${sentier}`);
  await capturer(page, "sans-ia-scene-390", false);

  // Aides allumées, fournisseur en panne puis clés absentes
  await base.from("enseignants").update({ reglages_ia: {} }).eq("id", compte.id);
  try {
    for (const [mode, nom] of [["echec", "panne"], ["sans-cle", "sans-cle"]]) {
      await request.post("/ia/simulation", { data: { mode } });
      for (const largeur of [1366, 390]) {
        await page.setViewportSize({ width: largeur, height: largeur > 400 ? 900 : 844 });
        await aller(page, `/projet/${projet}/scene/${sentier}`);
        await page.getByRole("button", { name: "Formuler" }).click();
        await page.locator(".message").first().waitFor();
        await capturer(page, `${nom}-formuler${largeur < 400 ? "-390" : ""}`, false);
      }
      await page.setViewportSize({ width: 1366, height: 900 });
      await page.getByRole("button", { name: "Corriger", exact: true }).click();
      await page.waitForTimeout(800);
      await capturer(page, `${nom}-corriger`, false);
    }
  } finally {
    await request.post("/ia/simulation", { data: { mode: null } });
  }
});
