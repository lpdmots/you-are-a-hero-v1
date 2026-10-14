import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  adultePret, aller, choixAuto, figure, MESSAGE, recit, semerAttribution, semerBlocs, semerClasse, semerImage, semerPartie, semerProjet, semerTexte, sql,
  supprimerComptes, type Compte,
} from "./outils";

/**
 * Étape 4 du plan, lot 5 : les fiches de rédaction (F07.4). La page des fiches, la feuille
 * compacte, « par chapitre » et « par élève », « À la suite, à découper », le partage des
 * scènes sans élève, le plafond et le complément. La fenêtre d'impression du navigateur
 * est remplacée par un compteur : l'application ne sait pas si la feuille est sortie.
 */

test.afterEach(async () => {
  await supprimerComptes();
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { imprime: number };
    w.imprime = 0;
    window.print = () => {
      w.imprime += 1;
    };
  });
});

const fiches = (projet: string, suivi = "") => `/projet/${projet}/fiches${suivi ? `?suivi=${encodeURIComponent(suivi)}` : ""}`;
const impressions = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { imprime: number }).imprime);
const decompte = (page: Page) => page.locator(".lot-apercu__barre").getByRole("status");
const imprimer = (page: Page) => page.locator(".lot-imprimer");
const caseDe = (page: Page, ref: string) => page.getByRole("checkbox", { name: new RegExp(`^${ref}\\b`) });
const feuille = (page: Page) => page.locator(".fr-feuille:visible");
/** « Réglages » : tout ce qui n'est pas le cas courant. Ouvre le panneau s'il ne l'est pas, et le rend. */
const reglages = async (page: Page) => {
  const panneau = page.getByRole("dialog", { name: "Réglages des feuilles" });
  if (!(await panneau.isVisible())) await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await expect(panneau).toBeVisible();
  return panneau;
};
const tirer = async (page: Page, par: "par chapitre" | "par élève") => (await reglages(page)).getByRole("group", { name: "Une feuille" }).getByRole("button", { name: par }).click();
const eleveDuTirage = async (page: Page) => (await reglages(page)).getByRole("combobox", { name: "Élève", exact: true });
const note = async (page: Page) => (await reglages(page)).locator(".lot-note");
const repartir = async (page: Page) => (await reglages(page)).getByRole("button", { name: /^L(a|es) répartir entre les élèves du chapitre$/ }).click();
const nombre = async (page: Page) => (await reglages(page)).getByLabel("Nombre de scènes à écrire par élève, au plus");
const mention = (page: Page) => page.locator(".lot-mention");
const qui = async (scene: string): Promise<string | null> => (await sql<{ p: string | null }>("select prise_par_eleve as p from scenes where id = $1", [scene]))[0].p;

type Classe = {
  compte: Compte; base: SupabaseClient; projet: string; bac: { id: string; scenes: string[] }; lisiere: { id: string; scenes: string[] }; sommet: { id: string; scenes: string[] };
  eleves: Record<string, { id: string; inscriptionId: string }>;
};

/**
 * « Le dernier bac » (S001 à S006), à Chloé, Dylan et Emma : S001 et S002 à Chloé, S003 et
 * S004 à Dylan, S005 à Emma, S006 libre. « La lisière » (S007 à S010), à Alice et Bilal :
 * S007 et S008 à Alice, S009 à Bilal, S010 sans consigne. « Le sommet » (S011), sans élève.
 */
async function classeEtFiches(page: Page): Promise<Classe> {
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2", ["Alice", "Bilal", "Chloé", "Dylan", "Emma"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const { chapitres } = await semerPartie(base, projet, "La forêt", [
    { titre: "Le dernier bac", scenes: ["Le quai", "La passerelle", "La lanterne", "La cabane", "La carte", "La barque"] },
    { titre: "La lisière", scenes: ["Le sentier", "La souche", "La chouette", "La clairière"] },
    { titre: "Le sommet", scenes: ["La brume"] },
  ]);
  const [bac, lisiere, sommet] = chapitres;
  const e = classe.eleves;
  await semerAttribution(base, bac.id, [{ eleve: e.Chloé.id }, { eleve: e.Dylan.id }, { eleve: e.Emma.id }]);
  await semerAttribution(base, lisiere.id, [{ eleve: e.Alice.id }, { eleve: e.Bilal.id }]);
  await base.from("scenes").update({ consigne: "Ce que la scène doit raconter." }).in("id", [...bac.scenes, ...lisiere.scenes.slice(0, 3), ...sommet.scenes]);
  const donner = (scenes: string[], prenom: string) => base.from("scenes").update({ prise_par_eleve: e[prenom].id }).in("id", scenes);
  await donner(bac.scenes.slice(0, 2), "Chloé");
  await donner(bac.scenes.slice(2, 4), "Dylan");
  await donner([bac.scenes[4]], "Emma");
  await donner(lisiere.scenes.slice(0, 2), "Alice");
  await donner([lisiere.scenes[2]], "Bilal");
  return { compte, base, projet, bac, lisiere, sommet, eleves: e };
}

test.describe("Du Suivi aux fiches (F06.5, F07.4)", () => {
  test("F06-AC57, F07-AC54 — fiches des scènes listées : depuis le Suivi filtré sur « La lisière » et « Texte vide », les fiches s'ouvrent avec les scènes qui ont une consigne ; celle qui n'en a pas ne peut pas être choisie, jusqu'à ce qu'on lui en écrive une", async ({ page }) => {
    const c = await classeEtFiches(page);
    await aller(page, `/projet/${c.projet}/suivi`);
    await page.getByRole("combobox", { name: "Chapitre", exact: true }).selectOption({ label: "La lisière" });
    await page.getByRole("group", { name: "Filtrer par état" }).getByRole("button", { name: /^Texte vide/ }).click();
    await page.getByRole("link", { name: "Imprimer les fiches de rédaction" }).click();
    await page.waitForURL(/\/fiches\?suivi=/);
    for (const ref of ["S007", "S008", "S009"]) await expect(caseDe(page, ref)).toBeChecked();
    await expect(caseDe(page, "S001")).not.toBeChecked();
    // Repliée au pied de son chapitre, sous une ligne qui dit pourquoi
    await expect(caseDe(page, "S010")).toBeHidden();
    await page.locator(".lot-hors summary", { hasText: "1 scène sans consigne : pas imprimée" }).click();
    await expect(caseDe(page, "S010")).toBeDisabled();
    await expect(page.locator(".lot-scene").filter({ hasText: "S010" })).toContainText("sans consigne : pas imprimée");
    // Elles ont un élève : une feuille par élève, sans rien régler — Alice, puis Bilal
    await expect(decompte(page)).toHaveText("3 scènes sur 2 feuilles");
    await expect(page.locator(".lot-pager__ou")).toHaveText(/^Alice\s*1 \/ 2$/);
    // Ce choix se corrige avant d'imprimer
    await caseDe(page, "S009").uncheck();
    await expect(decompte(page)).toHaveText("2 scènes sur 1 feuille");
    await expect(feuille(page)).not.toContainText("S009");
    // « Retour au Suivi » rend les filtres
    await page.getByRole("link", { name: "Retour au Suivi" }).click();
    await expect(page.getByRole("combobox", { name: "Chapitre", exact: true })).toHaveValue(c.lisiere.id);
    // Une consigne ajoutée : la scène peut être choisie
    await c.base.from("scenes").update({ consigne: "Décris la clairière." }).eq("id", c.lisiere.scenes[3]);
    await aller(page, fiches(c.projet));
    await expect(caseDe(page, "S010")).toBeEnabled();
    await expect(caseDe(page, "S010")).toBeChecked();
  });

  test("F06-AC57 — corriger le choix d'un geste : tout décocher, recocher un chapitre entier, puis ajouter les scènes en cours ; chaque raccourci dit ce qu'il ajouterait, et s'éteint quand il n'ajouterait rien", async ({ page }) => {
    const c = await classeEtFiches(page);
    await semerTexte(c.base, c.bac.scenes[0], ["Un texte commencé."]);
    await semerTexte(c.base, c.lisiere.scenes[0], ["Un autre texte commencé."]);
    await aller(page, fiches(c.projet));
    const toutes = page.getByRole("checkbox", { name: "Toutes les scènes", exact: true });
    const combien = page.locator(".lot-tout").getByRole("status");
    const ajouter = (sorte: RegExp) => page.locator(".lot-raccourcis").getByRole("button", { name: sorte });
    await tirer(page, "par chapitre");
    // Dix scènes peuvent être choisies : S010 n'a pas de consigne
    await expect(toutes).toBeChecked();
    await expect(combien).toHaveText("10 cochées sur 10");
    await expect(ajouter(/^en cours/)).toBeDisabled();
    await toutes.uncheck();
    await expect(combien).toHaveText("0 cochée sur 10");
    await expect(decompte(page)).toHaveText("Aucune feuille");
    await expect(ajouter(/^en cours/)).toHaveText("en cours +2");
    await expect(ajouter(/^les textes vides/)).toHaveText("les textes vides +8");
    await expect(ajouter(/^à reprendre/)).toBeDisabled();
    // Un chapitre entier, d'un geste ; une scène retirée, sa case le dit
    const bac = page.getByRole("checkbox", { name: "Toutes les scènes de Le dernier bac" });
    await bac.check();
    await expect(combien).toHaveText("6 cochées sur 10");
    await expect(decompte(page)).toHaveText("6 scènes sur 1 feuille");
    await caseDe(page, "S003").uncheck();
    await expect(bac).not.toBeChecked();
    expect(await bac.evaluate((el: HTMLInputElement) => el.indeterminate)).toBe(true);
    await expect(page.locator(".lot-chap").filter({ hasText: "Le dernier bac" }).locator("legend small")).toHaveText("5 sur 6");
    // Les scènes en cours des autres chapitres s'ajoutent sans rien décocher
    await ajouter(/^en cours/).click();
    await expect(combien).toHaveText("6 cochées sur 10");
    await expect(caseDe(page, "S007")).toBeChecked();
    await expect(caseDe(page, "S003")).not.toBeChecked();
    await expect(ajouter(/^en cours/)).toBeDisabled();
    await toutes.check();
    await expect(combien).toHaveText("10 cochées sur 10");
  });

  test("F06.5 — un élève choisi au Suivi : « Dont Alice s'occupe » ouvre sa feuille, « Tout son chapitre » celle du chapitre, camarades compris", async ({ page }) => {
    const c = await classeEtFiches(page);
    await aller(page, fiches(c.projet, `eleve=${c.eleves.Alice.id}`));
    await expect(decompte(page)).toHaveText("2 scènes sur 1 feuille");
    await expect(feuille(page)).toContainText("Prénom : Alice");
    await expect(page.locator(".lot-scene")).toHaveCount(2);
    await aller(page, fiches(c.projet, `eleve=${c.eleves.Alice.id}&mode=chapitre`));
    await expect(decompte(page)).toHaveText("3 scènes sur 1 feuille");
    await expect(feuille(page)).toContainText("S009");
    await expect(feuille(page)).toContainText("Prénom : ______________");
  });

  test("F07-AC69 — pas de fiches en mode personnel : aucun bouton dans le Suivi, et l'adresse des fiches, tapée à la main, ne montre aucune fiche", async ({ page }) => {
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "personnel", "classique", "Mon roman");
    const { chapitres } = await semerPartie(base, projet, "Le début", [{ titre: "Chapitre un", scenes: ["La gare"] }]);
    await base.from("scenes").update({ consigne: "Le train arrive." }).eq("id", chapitres[0].scenes[0]);
    await aller(page, `/projet/${projet}/suivi`);
    await expect(page.getByRole("link", { name: /fiches de rédaction/ })).toHaveCount(0);
    await page.goto(fiches(projet));
    await expect(page.getByRole("heading", { name: "Fiches de rédaction" })).toHaveCount(0);
    await expect(page.locator(".fr-feuille, .lot-scene")).toHaveCount(0);
  });
});

test.describe("La feuille de rédaction (F07.4)", () => {
  test("F07-AC52, AC17 — feuille compacte : une même feuille liste les scènes sous leur référence, avec leur consigne ; l'une porte son texte déjà écrit et son image, l'autre son texte et la reprise demandée ; aucune place pour écrire", async ({ page }) => {
    const c = await classeEtFiches(page);
    const [sentier, souche, chouette] = c.lisiere.scenes;
    const image = await semerImage(c.base, c.compte, c.projet);
    await semerBlocs(c.base, sentier, [recit("Un chant montait des fougères."), figure(image), choixAuto("Suivre le chant", souche)]);
    await semerTexte(c.base, chouette, ["La chouette tenait un message."]);
    await sql("update scenes set etat = 'reprendre', tour = tour + 1 where id = $1", [chouette]);
    await sql(
      "insert into remarques (scene_id, projet_id, enseignant_id, eleve_id, texte) select s.id, s.projet_id, p.enseignant_id, s.prise_par_eleve, 'Dis ce que dit le message.' from scenes s join projets p on p.id = s.projet_id where s.id = $1",
      [chouette],
    );
    await aller(page, fiches(c.projet, `chapitre=${c.lisiere.id}`));
    await tirer(page, "par chapitre");
    const f = feuille(page);
    await expect(f.locator(".fr-tete")).toContainText("Les passeurs de brume · La lisière");
    await expect(f).toContainText("Sur ton cahier, recopie le repère de la scène (S007), puis écris ton texte.");
    await expect(f.locator(".fr-num")).toHaveText(["S007", "S008", "S009"]);
    const scene = (ref: string) => f.locator(".fr-scene").filter({ has: page.locator(".fr-num", { hasText: ref }) });
    await expect(scene("S007")).toContainText("Le sentier");
    await expect(scene("S007")).toContainText("Ce que la scène doit raconter.");
    await expect(scene("S007")).toContainText("Déjà écrit");
    await expect(scene("S007")).toContainText("Un chant montait des fougères.");
    await expect(scene("S007")).toContainText("À la fin, le lecteur pourra : Suivre le chant");
    await expect(scene("S007").locator(".fr-image img")).toHaveAttribute("src", new RegExp(image));
    await expect(scene("S008")).not.toContainText("Déjà écrit");
    await expect(scene("S009")).toContainText("La chouette tenait un message.");
    await expect(scene("S009")).toContainText("À reprendre");
    await expect(scene("S009")).toContainText("Dis ce que dit le message.");
    await expect(f).toContainText("Fiche de rédaction · à recopier dans l’application");
    await expect(f.locator("textarea, input")).toHaveCount(0);
    // À l'impression, sur la largeur d'une page A4, l'image est toujours là
    await page.setViewportSize({ width: 680, height: 960 });
    await page.emulateMedia({ media: "print" });
    await expect(scene("S007").locator(".fr-image img")).toBeVisible();
    await expect(page.locator(".lot-liste")).toBeHidden();
  });

  test("F07-AC53, AC56, AC55 — une feuille par élève ; un élève choisi, sa seule feuille ; à la suite, les parties s'enchaînent sous le prénom de chacun, séparées par un trait de coupe", async ({ page }) => {
    const c = await classeEtFiches(page);
    await aller(page, fiches(c.projet, `chapitre=${c.bac.id}`));
    // Une feuille par élève, d'office : à l'écran, le décompte, la feuille montrée, « Réglages » et « Imprimer »
    await expect(decompte(page)).toHaveText("5 scènes sur 3 feuilles");
    await expect(page.getByRole("dialog", { name: "Réglages des feuilles" })).toHaveCount(0);
    await expect(page.locator(".lot-apercu").getByRole("checkbox")).toHaveCount(0);
    // S006, sans élève, n'est sur aucune feuille : la barre le dit en deux mots, les réglages en entier (AC53)
    await expect(mention(page)).toHaveText("1 sans élève");
    await mention(page).click();
    await expect(await note(page)).toContainText("1 des 6 scènes choisies n’a pas d’élève : sur aucune feuille.");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Réglages des feuilles" })).toHaveCount(0);
    // Par chapitre : une seule feuille, les six scènes
    await tirer(page, "par chapitre");
    await expect(decompte(page)).toHaveText("6 scènes sur 1 feuille");
    await expect(mention(page)).toHaveCount(0);
    await tirer(page, "par élève");
    await expect(decompte(page)).toHaveText("5 scènes sur 3 feuilles");
    await expect(feuille(page)).toContainText("Prénom : Chloé");
    await expect(feuille(page).locator(".fr-num")).toHaveText(["S001", "S002"]);
    // Entre les flèches, la feuille montrée : son élève, puis son rang
    await expect(page.locator(".lot-pager__ou")).toHaveText(/^Chloé\s*1 \/ 3$/);
    await page.getByRole("button", { name: "Feuille suivante" }).click();
    await expect(feuille(page)).toContainText("Prénom : Dylan");
    await expect(page.locator(".lot-pager__ou")).toHaveText(/^Dylan\s*2 \/ 3$/);
    await expect(imprimer(page)).toHaveText("Imprimer 3 feuilles");
    // Un élève choisi : sa seule feuille, et les autres ne s'impriment pas (AC56)
    await (await eleveDuTirage(page)).selectOption({ label: "Dylan" });
    await expect(decompte(page)).toHaveText("2 scènes sur 1 feuille");
    await expect(page.getByRole("heading", { name: /^Les scènes de Dylan/ })).toBeVisible();
    await expect(page.locator(".lot-scene")).toHaveCount(2);
    await expect(imprimer(page)).toHaveText("Imprimer 1 feuille");
    await expect(page.locator(".fr-feuille")).toHaveCount(1);
    await page.getByRole("button", { name: "Toutes les scènes du livre" }).click();
    await expect(await eleveDuTirage(page)).toHaveValue("");
    await expect(decompte(page)).toHaveText("5 scènes sur 3 feuilles");
    // « par chapitre » : plus de choix d'élève ; il revient avec « par élève », sur tous
    await tirer(page, "par chapitre");
    await expect(page.getByRole("combobox", { name: "Élève", exact: true })).toHaveCount(0);
    await tirer(page, "par élève");
    // À la suite, à découper (AC55)
    await (await reglages(page)).getByRole("checkbox", { name: "À la suite, à découper" }).check();
    await expect(decompte(page)).toHaveText("5 scènes en 3 parties à découper");
    await expect(imprimer(page)).toHaveText("Imprimer à la suite");
    await expect(page.locator(".fr-feuille")).toHaveCount(1);
    await expect(page.locator(".fr-feuille .fr-tete")).toHaveText([/Prénom : Chloé/, /Prénom : Dylan/, /Prénom : Emma/]);
    await expect(page.locator(".fr-coupe")).toHaveCount(2);
    await imprimer(page).click();
    expect(await impressions(page)).toBe(1);
  });

  test("F07-AC21, AC22, AC18 — fiches avant inscriptions : sans élève ni attribution, les fiches se tirent par chapitre, sans nom ; une scène retirée du lot n'est pas imprimée ; imprimer ne remet ni ne valide rien", async ({ page }) => {
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "classe", "classique", "Le voyage");
    const { chapitres } = await semerPartie(base, projet, "Le départ", [{ titre: "La gare", scenes: ["Le hall", "Le quai"] }, { titre: "Le train", scenes: ["Le wagon"] }]);
    const toutes = chapitres.flatMap((x) => x.scenes);
    await base.from("scenes").update({ consigne: "Ce que la scène doit raconter." }).in("id", toutes);
    await aller(page, fiches(projet));
    await expect(decompte(page)).toHaveText("3 scènes sur 2 feuilles");
    await caseDe(page, "S002").uncheck();
    await expect(decompte(page)).toHaveText("2 scènes sur 2 feuilles");
    await expect(page.locator(".fr-feuille").first()).toContainText("Prénom : ______________");
    await imprimer(page).click();
    expect(await impressions(page)).toBe(1);
    // Rien n'a changé dans le projet : ni état, ni remise, ni élève, et la scène retirée du lot y est toujours
    expect(await sql("select 1 from scenes where id = any($1::uuid[]) and etat = 'cours' and prise_par_eleve is null", [toutes])).toHaveLength(3);
    expect(await sql("select 1 from remises where projet_id = $1", [projet])).toHaveLength(0);
  });

  test("F07-AC70 — scène de l'enseignante hors des fiches : avec sa consigne, elle ne peut pas être choisie et n'est sur aucune feuille ; rendue à Alice, elle peut l'être", async ({ page }) => {
    const c = await classeEtFiches(page);
    await c.base.from("scenes").update({ prise_par_enseignant: true, prise_par_eleve: null }).eq("id", c.lisiere.scenes[0]);
    await aller(page, fiches(c.projet, `chapitre=${c.lisiere.id}`));
    // Avec S010, sans consigne : deux raisons différentes sous une même ligne, chacune dite sur sa scène
    await page.locator(".lot-hors summary", { hasText: "2 scènes sans fiche" }).click();
    await expect(caseDe(page, "S007")).toBeDisabled();
    await expect(page.locator(".lot-scene").filter({ hasText: "S007" })).toContainText("à votre nom : pas de fiche");
    await tirer(page, "par chapitre");
    await expect(feuille(page).locator(".fr-num")).toHaveText(["S008", "S009"]);
    await tirer(page, "par élève");
    await expect(page.locator(".fr-num", { hasText: "S007" })).toHaveCount(0);
    await c.base.from("scenes").update({ prise_par_enseignant: false, prise_par_eleve: c.eleves.Alice.id }).eq("id", c.lisiere.scenes[0]);
    await page.reload();
    await expect(caseDe(page, "S007")).toBeEnabled();
  });
});

test.describe("Partage des scènes sans élève (F07.4)", () => {
  test("F07-AC57, AC59, AC73 — S006, sans élève, est proposée à Emma ; rien n'est donné avant « Répartir et imprimer » ; le partage fait, « Annuler la répartition » la rend « Pas encore prise », tant qu'on reste sur la page", async ({ page }) => {
    const c = await classeEtFiches(page);
    const barque = c.bac.scenes[5];
    await aller(page, fiches(c.projet, `chapitre=${c.bac.id}`));
    await repartir(page);
    // Emma a une scène à son nom quand Chloé et Dylan en ont deux (AC57)
    await expect(await note(page)).toContainText("S006 est proposée à Emma : elle sera à son nom à l’impression.");
    await expect(mention(page)).toHaveText("1 proposée");
    await expect(decompte(page)).toHaveText("6 scènes sur 3 feuilles");
    await expect(page.locator(".lot-scene").filter({ hasText: "S006" }).locator(".lot-scene__qui--propose")).toContainText("proposée à Emma");
    expect(await qui(barque)).toBeNull();
    // Le message de demande ; « Annuler » ne donne rien à personne (AC59)
    await imprimer(page).click();
    const message = page.getByRole("alertdialog");
    await expect(message).toContainText("Emma s’occupe de S006 « La barque » ?");
    await expect(message).toContainText("Elle sera à son nom, comme les scènes déjà prises. Vous pourrez encore changer d’élève.");
    await message.getByRole("button", { name: "Annuler" }).click();
    expect(await qui(barque)).toBeNull();
    expect(await impressions(page)).toBe(0);
    // « Échap » le referme de même, et le clavier revient à « Imprimer »
    await imprimer(page).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(imprimer(page)).toBeFocused();
    expect(await qui(barque)).toBeNull();
    await imprimer(page).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Répartir et imprimer" }).click();
    await expect.poll(() => qui(barque)).toBe(c.eleves.Emma.id);
    await expect.poll(() => impressions(page)).toBe(1);
    // La fenêtre d'impression fermée, le partage reste fait, et s'annule sur place (AC73)
    const fait = page.locator(".lot-note--fait");
    await expect(fait).toContainText("1 scène répartie.");
    await expect(page.locator(".lot-scene").filter({ hasText: "S006" }).locator(".lot-scene__qui")).toHaveAttribute("title", "Emma s’en occupe");
    await fait.getByRole("button", { name: "Annuler la répartition" }).click();
    await expect(MESSAGE(page)).toContainText("1 scène est de nouveau « Pas encore prise ».");
    expect(await qui(barque)).toBeNull();
    // Redonnée, puis la page quittée et rouverte : « Annuler la répartition » n'est plus proposé
    await repartir(page);
    await imprimer(page).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Répartir et imprimer" }).click();
    await expect.poll(() => qui(barque)).toBe(c.eleves.Emma.id);
    await page.reload();
    await expect(page.locator(".lot-note--fait")).toHaveCount(0);
    expect(await qui(barque)).toBe(c.eleves.Emma.id);
  });

  test("F07-AC73 — annuler la répartition : la scène qu'un autre élève a prise entre-temps lui reste", async ({ page }) => {
    const c = await classeEtFiches(page);
    await c.base.from("scenes").update({ prise_par_eleve: null }).in("id", c.bac.scenes);
    await aller(page, fiches(c.projet, `chapitre=${c.bac.id}`));
    // Aucune scène cochée n'a d'élève : la page s'ouvre par chapitre, où « par élève » ne donnerait aucune feuille
    await expect(decompte(page)).toHaveText("6 scènes sur 1 feuille");
    await tirer(page, "par élève");
    await expect(decompte(page)).toHaveText("Aucune feuille");
    await repartir(page);
    await expect(await note(page)).toContainText("6 scènes sans élève sont réparties entre les élèves de leur chapitre : elles seront à leur nom à l’impression.");
    await imprimer(page).click();
    await expect(page.getByRole("alertdialog")).toContainText("Les élèves proposés s’occupent de ces 6 scènes ?");
    await page.getByRole("alertdialog").getByRole("button", { name: "Répartir et imprimer" }).click();
    await expect(page.locator(".lot-note--fait")).toContainText("6 scènes réparties.");
    expect(await sql("select 1 from scenes where chapitre_id = $1 and prise_par_eleve is not null", [c.bac.id])).toHaveLength(6);
    // Chloé, Dylan et Emma en ont deux chacun ; Dylan reprend entre-temps une scène de Chloé
    const [deChloe] = await sql<{ id: string }>("select id from scenes where chapitre_id = $1 and prise_par_eleve = $2 order by rang limit 1", [c.bac.id, c.eleves.Chloé.id]);
    await sql("update scenes set prise_par_eleve = $2 where id = $1", [deChloe.id, c.eleves.Dylan.id]);
    await page.locator(".lot-note--fait").getByRole("button", { name: "Annuler la répartition" }).click();
    await expect(MESSAGE(page)).toContainText("5 scènes sont de nouveau « Pas encore prise ». 1 a été prise entre-temps par un autre élève.");
    expect(await qui(deChloe.id)).toBe(c.eleves.Dylan.id);
  });

  test("F07-AC60 — hors partage : la scène d'un chapitre non attribué reste sur aucune feuille ; la liste réduite à un élève, le partage n'est plus proposé", async ({ page }) => {
    const c = await classeEtFiches(page);
    await aller(page, fiches(c.projet));
    await expect(mention(page)).toHaveText("2 sans élève");
    await expect(await note(page)).toContainText("2 des 10 scènes choisies n’ont pas d’élève : sur aucune feuille.");
    await repartir(page);
    // S006 est proposée ; S011, du « Sommet », n'a personne à qui aller
    await expect(await note(page)).toContainText("S006 est proposée à Emma");
    await expect(await note(page)).toContainText("1 reste sans élève, sur aucune feuille.");
    await expect(mention(page)).toHaveText("1 proposée · 1 sans élève");
    await (await reglages(page)).getByRole("button", { name: "Ne pas répartir" }).click();
    // Le bouton disparaît sous le clic : le panneau, lui, reste ouvert
    await expect(page.getByRole("dialog", { name: "Réglages des feuilles" })).toBeVisible();
    await (await eleveDuTirage(page)).selectOption({ label: "Alice" });
    // Un seul élève : ni partage, ni nombre, ni mention
    await expect(page.getByRole("button", { name: /répartir entre les élèves/ })).toHaveCount(0);
    await expect(page.getByLabel("Nombre de scènes à écrire par élève, au plus")).toHaveCount(0);
    await expect(mention(page)).toHaveCount(0);
  });
});

test.describe("Plafond et complément (F07.4)", () => {
  test("F07-AC74 — plafond : avec « Au plus 2 scènes à écrire par élève », seules les scènes qui tiennent sous le nombre sont réparties, et la page dit combien restent sans élève", async ({ page }) => {
    const c = await classeEtFiches(page);
    // Quatre scènes libres dans « La lisière » : Alice et Bilal n'en ont plus aucune
    await c.base.from("scenes").update({ prise_par_eleve: null, consigne: "Ce que la scène doit raconter." }).in("id", c.lisiere.scenes);
    await sql("update scenes set prise_par_eleve = $2 where id = $1", [c.lisiere.scenes[0], c.eleves.Alice.id]);
    await aller(page, fiches(c.projet, `chapitre=${c.lisiere.id}`));
    // Au plus quatre scènes par élève, d'office ; le nombre se change dans les réglages
    await expect(await nombre(page)).toHaveValue("4");
    await (await nombre(page)).fill("2");
    await repartir(page);
    // Bilal, qui n'en a aucune, en reçoit deux ; Alice, qui en a une, une ; aucune ne reste
    await expect(await note(page)).toContainText("3 scènes sans élève sont réparties entre les élèves de leur chapitre");
    await (await nombre(page)).fill("1");
    await expect(await note(page)).toContainText("S008 est proposée à Bilal : elle sera à son nom à l’impression. 2 restent sans élève, sur aucune feuille : chaque élève du chapitre a déjà 1 scène à écrire.");
    await expect(mention(page)).toHaveText("1 proposée · 2 sans élève");
    // La case vidée : aucun nombre, tout est réparti
    await (await nombre(page)).fill("");
    await expect(await note(page)).toContainText("3 scènes sans élève sont réparties");
  });

  test("F07-AC75 — compléter un élève : le nombre fixé, la page signale Emma, à qui il reste moins de scènes à écrire, sans rien lui proposer ; complétée, les premières scènes libres lui sont proposées, à son nom à l'impression seulement", async ({ page }) => {
    const c = await classeEtFiches(page);
    // « Le dernier bac » : Chloé 2, Dylan 2, Emma 1, et S006 libre ; trois scènes libres de plus
    const plus: string[] = [];
    for (const titre of ["Le phare", "La digue", "Le ponton"]) {
      const { data } = await c.base.rpc("creer_scene", { p_chapitre: c.bac.id });
      const ligne = (Array.isArray(data) ? data[0] : data) as { scene_id: string };
      await c.base.from("scenes").update({ titre, consigne: "Ce que la scène doit raconter." }).eq("id", ligne.scene_id);
      plus.push(ligne.scene_id);
    }
    await aller(page, fiches(c.projet, `chapitre=${c.bac.id}`));
    // Avec quatre, d'office, les trois élèves du chapitre sont à compléter ; sans nombre, personne
    const completer = (await reglages(page)).locator(".lot-completer");
    await expect(completer.getByRole("button")).toHaveCount(3);
    await (await nombre(page)).fill("");
    await expect(completer).toHaveCount(0);
    await (await nombre(page)).fill("2");
    // Chloé et Dylan en ont déjà deux : seule Emma est signalée, et rien ne lui est encore proposé
    await expect(completer).toContainText("ou compléter jusqu’à 2 scènes :");
    await expect(completer.getByRole("button")).toHaveCount(1);
    await expect(page.locator(".lot-scene__qui--propose")).toHaveCount(0);
    await completer.getByRole("button", { name: /^Emma : 1 scène à écrire/ }).click();
    await expect(completer.getByRole("button", { pressed: true })).toHaveAccessibleName("Emma : 1 scène à écrire, 1 de plus proposée");
    await expect(completer.locator('.lot-eleve i[data-vu="oui"]')).toHaveText("+ 1");
    await expect(page.locator(".lot-scene").filter({ hasText: "S006" }).locator(".lot-scene__qui--propose")).toContainText("proposée à Emma");
    await page.getByRole("button", { name: "Feuille suivante" }).click();
    await page.getByRole("button", { name: "Feuille suivante" }).click();
    await expect(feuille(page)).toContainText("Prénom : Emma");
    await expect(feuille(page).locator(".fr-num")).toHaveText(["S005", "S006"]);
    expect(await qui(c.bac.scenes[5])).toBeNull();
    // « Ne pas compléter » : le même prénom, cliqué de nouveau, dans les réglages
    await reglages(page);
    await completer.getByRole("button", { pressed: true }).click();
    await expect(page.locator(".lot-scene__qui--propose")).toHaveCount(0);
    await completer.getByRole("button", { name: /^Emma : 1 scène à écrire/ }).click();
    // Données à l'impression, après le même message
    await imprimer(page).click();
    await expect(page.getByRole("alertdialog")).toContainText("Emma s’occupe de S006 « La barque » ?");
    await page.getByRole("alertdialog").getByRole("button", { name: "Répartir et imprimer" }).click();
    await expect.poll(() => qui(c.bac.scenes[5])).toBe(c.eleves.Emma.id);
    expect(await sql("select 1 from scenes where id = any($1::uuid[]) and prise_par_eleve is not null", [plus])).toHaveLength(0);
  });

  test("F07-AC75 — plus de scène libre : une seule scène sans élève pour trois élèves à compléter ; Emma complétée, les deux autres prénoms ne se cliquent plus, et la page le dit", async ({ page }) => {
    const c = await classeEtFiches(page);
    await aller(page, fiches(c.projet, `chapitre=${c.bac.id}`));
    const completer = (await reglages(page)).locator(".lot-completer");
    await expect(completer.getByRole("button")).toHaveCount(3);
    await expect(completer.locator("small")).toHaveCount(0);
    await completer.getByRole("button", { name: /^Emma/ }).click();
    await expect(completer.getByRole("button", { name: /^Chloé/ })).toBeDisabled();
    await expect(completer.getByRole("button", { name: /^Dylan/ })).toBeDisabled();
    await expect(completer).toContainText("Plus de scène libre cochée.");
    // Emma décomplétée : les trois prénoms se cliquent de nouveau
    await completer.getByRole("button", { name: /^Emma/ }).click();
    await expect(completer.getByRole("button", { name: /^Chloé/ })).toBeEnabled();
    // Un nombre de 1 s'accorde
    await (await nombre(page)).fill("1");
    await expect(page.locator(".lot-plafond__phrase")).toContainText("scène à écrire par élève");
    await expect(page.locator(".lot-plafond__phrase")).not.toContainText("scènes");
  });
});
