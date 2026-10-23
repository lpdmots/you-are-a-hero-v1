import { expect, test, type Browser, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  action, adultePret, aller, choixAuto, figure, liaison, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes, type Compte,
} from "./outils";

/**
 * Étape 7 du plan, lot 2 : le lecteur en ligne par le lien, sans compte, sur un téléphone
 * (F12.1, F04.2) — la page de titre, les passages et leurs choix, l'énigme, le parcours, la
 * feuille et le dé, « Comment lire ce livre », la lecture retenue sur l'appareil et reprise
 * après une mise à jour, la page neutre d'un lien coupé ou changé ; le récit classique.
 */

test.afterEach(async () => {
  await supprimerComptes();
});
// Les codes faux comptent par adresse réseau : tous les essais viennent de la même, on repart à zéro
test.beforeEach(async () => {
  await sql("delete from essais_entree");
});

type Livre = { compte: Compte; base: SupabaseClient; projet: string; s: Record<string, string> };

/** Tout prêt, les trois premières étapes déclarées, « Imprimer et partager » ouverte. */
async function pret(projet: string): Promise<void> {
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
}

/**
 * « Le phare » : la plage (départ, une image entre deux paragraphes, une action de jeu), d'où
 * l'on monte à la porte aux symboles (une énigme vers le sommet, et « Redescendre ») ou l'on
 * rentre (une fin). Une feuille : Volonté 2, un inventaire, deux dés, des règles.
 */
async function phare(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Le phare");
  const quai = (await semerPartie(base, projet, "Le quai", [{ titre: "La plage", scenes: ["La plage", "Le retour"] }])).chapitres[0].scenes;
  const tour = (await semerPartie(base, projet, "La tour", [{ titre: "La tour", scenes: ["La porte", "Le sommet"] }])).chapitres[0].scenes;
  const s = { depart: quai[0], retour: quai[1], porte: tour[0], sommet: tour[1] };
  const image = await semerImage(base, compte, projet);
  await base.from("projets").update({ depart_scene_id: s.depart }).eq("id", projet);
  await semerBlocs(base, s.depart, [
    recit("La plage au matin."), figure(image), recit("Le phare clignote au loin."), action("Ajoute la corde à ton inventaire."),
    choixAuto("Monter au phare", s.porte), choixAuto("Rentrer à la maison", s.retour),
  ]);
  await semerBlocs(base, s.retour, [recit("Tu rentres chez toi.")]);
  await semerBlocs(base, s.porte, [recit("Trois symboles sur la porte."), liaison(s.sommet, "Déchiffrer"), choixAuto("Redescendre sur la plage", s.depart)]);
  await semerBlocs(base, s.sommet, [recit("La lanterne s’allume.")]);
  await base.from("scenes").update({ fin: true }).in("id", [s.sommet, s.retour]);
  const feuille = {
    on: true, des: 2,
    sections: [{ id: "heros", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "vol", nom: "Volonté", depart: 2 }] }, { id: "inv", type: "liste", titre: "Inventaire", lignes: 6 }],
  };
  await base.from("preparations").update({ feuille, rubrique_jeu: true, regles: "Lance les deux dés quand le livre le demande." }).eq("projet_id", projet);
  await pret(projet);
  return { compte, base, projet, s };
}

/** Partager par le lien depuis le volet « Partager », rappel confirmé ; rend l'adresse du lien. */
async function partager(page: Page, projet: string): Promise<string> {
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "Par un lien" }) }).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Partager" }).click();
  return page.getByRole("textbox", { name: "Lien de lecture" }).inputValue();
}

async function mettreAJour(page: Page, projet: string): Promise<void> {
  await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
  await page.getByRole("button", { name: "Mettre à jour le partage…" }).click();
  const rappel = page.getByRole("group", { name: "À relire avant de partager" });
  await rappel.getByText("J’ai relu le livre sur ces points.").click();
  await rappel.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.getByText(/Livre partagé, à jour depuis le/)).toBeVisible();
}

/** Un téléphone, sans compte ni cookie de l'application. */
async function telephone(browser: Browser) {
  const contexte = await browser.newContext({ baseURL: "http://localhost:3100", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "fr-FR", timezoneId: "Europe/Paris" });
  return { contexte, lecteur: await contexte.newPage() };
}

const numeroDe = async (projet: string, scene: string): Promise<number> => {
  const [{ version }] = await sql<{ version: { passages: { id: string; numero: number }[] } }>("select version from partages where projet_id = $1", [projet]);
  return version.passages.find((p) => p.id === scene)!.numero;
};
const texte = (p: Page) => p.locator(".lecteur__corps");
const choix = (p: Page, libelle: string) => texte(p).getByRole("button", { name: new RegExp(libelle) });

test("F12-AC01, F04-AC17, F11-AC46, F04-AC18, F04-AC20, F04-AC21, F04-AC31, F04-AC32, F12-AC13, F12-AC14, F12-AC18 — sur un téléphone, sans compte : la page de titre, le passage tel que le livre l'imprime, la feuille et les dés, l'énigme, le retour par le parcours", async ({ page, browser }) => {
  const l = await phare(page);
  const adresse = await partager(page, l.projet);
  const { contexte, lecteur } = await telephone(browser);
  const reponse = await lecteur.goto(adresse);
  expect(reponse?.headers()["x-robots-tag"]).toContain("noindex");
  expect((await contexte.cookies()).filter((c) => c.name.startsWith("sb-"))).toEqual([]);
  await expect(lecteur).toHaveTitle("Le phare");
  await expect(lecteur.getByRole("heading", { name: "Le phare", level: 1 })).toBeVisible();
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();

  // Le passage n° 1, l'image à sa place entre les deux paragraphes, l'action mise à part
  await expect(texte(lecteur).locator(".lu-numero-passage")).toHaveText("1");
  const blocs = texte(lecteur).locator(".lu-texte > *");
  await expect(blocs.nth(0)).toHaveText("La plage au matin.");
  await expect(blocs.nth(1)).toHaveClass(/lu-image/);
  await expect(blocs.nth(2)).toHaveText("Le phare clignote au loin.");
  await expect(texte(lecteur).locator(".lu-action")).toHaveText("Ajoute la corde à ton inventaire.");
  expect(await lecteur.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  // L'action ouvre la feuille, sans rien y noter ; la liste ne propose aucun objet
  await texte(lecteur).locator(".lu-action").click();
  const feuille = lecteur.getByRole("complementary", { name: "Feuille d’aventure" });
  await expect(feuille).toBeVisible();
  await expect(feuille.getByRole("textbox", { name: "Inventaire, ligne 1" })).toHaveValue("");
  expect(await feuille.locator("input[list], datalist").count()).toBe(0);
  for (let i = 0; i < 3; i += 1) if (await feuille.getByRole("button", { name: "Retirer un point : Volonté" }).isEnabled()) await feuille.getByRole("button", { name: "Retirer un point : Volonté" }).click();
  await expect(feuille.locator(".fa-compteur__valeur")).toHaveText("0");
  await expect(feuille.getByRole("button", { name: "Retirer un point : Volonté" })).toBeDisabled();
  await feuille.getByRole("textbox", { name: "Inventaire, ligne 1" }).fill("corde");
  await feuille.getByRole("button", { name: "Lancer les dés" }).click();
  await expect(feuille.locator(".fa-de__resultat")).toHaveText(/^\d et \d : \d+ en tout$/);
  await feuille.getByRole("button", { name: "Ranger" }).click();
  await expect(choix(lecteur, "Monter au phare")).toBeEnabled();
  await expect(choix(lecteur, "Rentrer à la maison")).toBeEnabled();

  // L'énigme : un numéro faux, celui d'un autre passage, puis le bon ; jamais de « Passer »
  await choix(lecteur, "Monter au phare").click();
  await expect(texte(lecteur)).toContainText("Trois symboles sur la porte.");
  await expect(texte(lecteur).getByRole("button", { name: "Passer l’énigme" })).toHaveCount(0);
  const saisie = texte(lecteur).getByRole("textbox", { name: "Numéro trouvé" });
  await saisie.fill(String(await numeroDe(l.projet, l.s.retour)));
  await texte(lecteur).getByRole("button", { name: "Y aller" }).click();
  await expect(texte(lecteur).getByRole("alert")).toHaveText("Ce n’est pas ce numéro.");
  await expect(texte(lecteur)).toContainText("Trois symboles sur la porte.");
  await saisie.fill(String(await numeroDe(l.projet, l.s.sommet)));
  await texte(lecteur).getByRole("button", { name: "Y aller" }).click();
  await expect(texte(lecteur)).toContainText("La lanterne s’allume.");
  await expect(texte(lecteur).locator(".lu-fin__marque")).toHaveText("Fin");

  // Retour libre au premier passage par le parcours, et un autre choix
  await lecteur.getByRole("button", { name: /Parcours/ }).click();
  await lecteur.getByRole("list", { name: "Passages lus" }).getByRole("button", { name: /^1 · La plage au matin/ }).click();
  await expect(texte(lecteur).locator(".lu-numero-passage")).toHaveText("1");
  await choix(lecteur, "Rentrer à la maison").click();
  await expect(texte(lecteur)).toContainText("Tu rentres chez toi.");
  await contexte.close();
});

test("F12-AC19, F04-AC23, F04-AC24 — la lecture retenue sur l'appareil : continuer avec sa feuille, ou recommencer ; les règles ouvertes puis refermées sans perdre le passage", async ({ page, browser }) => {
  const l = await phare(page);
  const adresse = await partager(page, l.projet);
  const { contexte, lecteur } = await telephone(browser);
  await lecteur.goto(adresse);
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await lecteur.getByRole("button", { name: "Ma feuille" }).click();
  const feuille = lecteur.getByRole("complementary", { name: "Feuille d’aventure" });
  await feuille.getByRole("button", { name: "Retirer un point : Volonté" }).click();
  await feuille.getByRole("textbox", { name: "Inventaire, ligne 1" }).fill("corde");
  await feuille.getByRole("button", { name: "Ranger" }).click();
  await choix(lecteur, "Monter au phare").click();
  const porte = await numeroDe(l.projet, l.s.porte);

  // Les règles du jeu, puis le même passage, la feuille inchangée
  await lecteur.getByRole("button", { name: "Comment lire" }).click();
  await expect(lecteur.getByRole("heading", { name: "Règles du jeu" })).toBeVisible();
  await expect(lecteur.getByText("Lance les deux dés quand le livre le demande.")).toBeVisible();
  await lecteur.getByRole("button", { name: `Reprendre au passage ${porte}` }).click();
  await expect(texte(lecteur)).toContainText("Trois symboles sur la porte.");

  // La page rouverte : continuer, la feuille telle qu'il l'avait laissée
  await lecteur.reload();
  await expect(lecteur.getByRole("button", { name: "Recommencer au début" })).toBeVisible();
  await lecteur.getByRole("button", { name: `Continuer au passage ${porte}` }).click();
  await expect(texte(lecteur)).toContainText("Trois symboles sur la porte.");
  await lecteur.getByRole("button", { name: "Ma feuille" }).click();
  await expect(feuille.locator(".fa-compteur__valeur")).toHaveText("1");
  await expect(feuille.getByRole("textbox", { name: "Inventaire, ligne 1" })).toHaveValue("corde");
  await feuille.getByRole("button", { name: "Ranger" }).click();

  // Recommencer : la feuille revient à ses valeurs de départ
  await lecteur.getByRole("button", { name: "Le phare" }).click();
  await lecteur.getByRole("button", { name: "Recommencer au début" }).click();
  await expect(texte(lecteur).locator(".lu-numero-passage")).toHaveText("1");
  await lecteur.getByRole("button", { name: "Ma feuille" }).click();
  await expect(feuille.locator(".fa-compteur__valeur")).toHaveText("2");
  await expect(feuille.getByRole("textbox", { name: "Inventaire, ligne 1" })).toHaveValue("");
  await contexte.close();
});

test("F12-AC25, F04-AC43, F12-AC10, F12-AC11 — après une mise à jour, la lecture continue et la feuille garde ses valeurs ; une scène retirée fait reprendre au début ; un lien coupé ou changé mène à la page neutre", async ({ page, browser }) => {
  const l = await phare(page);
  const adresse = await partager(page, l.projet);
  const { contexte, lecteur } = await telephone(browser);
  await lecteur.goto(adresse);
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await lecteur.getByRole("button", { name: "Ma feuille" }).click();
  const feuille = lecteur.getByRole("complementary", { name: "Feuille d’aventure" });
  await feuille.getByRole("button", { name: "Retirer un point : Volonté" }).click();
  await feuille.getByRole("button", { name: "Ranger" }).click();
  await choix(lecteur, "Monter au phare").click();

  // L'adulte ajoute un compteur et corrige la porte, puis met à jour
  const feuilleDuLivre = {
    on: true, des: 2,
    sections: [
      { id: "heros", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "vol", nom: "Volonté", depart: 2 }, { id: "tps", nom: "Temps", depart: 10 }] },
      { id: "inv", type: "liste", titre: "Inventaire", lignes: 6 },
    ],
  };
  await l.base.from("preparations").update({ feuille: feuilleDuLivre }).eq("projet_id", l.projet);
  await semerBlocs(l.base, l.s.porte, [recit("Trois symboles gravés sur la porte."), liaison(l.s.sommet, "Déchiffrer"), choixAuto("Redescendre sur la plage", l.s.depart)]);
  await sql("update scenes set etat = 'prete' where id = $1", [l.s.porte]);
  await mettreAJour(page, l.projet);
  await lecteur.reload();
  await lecteur.getByRole("button", { name: /^Continuer au passage/ }).click();
  await expect(texte(lecteur)).toContainText("Trois symboles gravés sur la porte.");
  await lecteur.getByRole("button", { name: "Ma feuille" }).click();
  await expect(feuille.locator(".fa-compteur__valeur")).toHaveText(["1", "10"]);
  await feuille.getByRole("button", { name: "Ranger" }).click();

  // La lectrice rentre à la maison ; l'adulte retire ce passage du livre et met à jour
  await lecteur.getByRole("button", { name: "Redescendre sur la plage" }).click();
  await choix(lecteur, "Rentrer à la maison").click();
  await expect(texte(lecteur)).toContainText("Tu rentres chez toi.");
  await semerBlocs(l.base, l.s.depart, [recit("La plage au matin."), choixAuto("Monter au phare", l.s.porte)]);
  await sql("update scenes set hors_livre = true where id = $1", [l.s.retour]);
  await sql("update scenes set etat = 'prete' where id = $1", [l.s.depart]);
  await mettreAJour(page, l.projet);
  await lecteur.reload();
  await expect(lecteur.getByText("Le livre a été mis à jour : la lecture reprend au début.")).toBeVisible();
  await expect(lecteur.getByRole("button", { name: /^Continuer/ })).toHaveCount(0);
  await expect(lecteur.getByRole("button", { name: "Commencer la lecture" })).toBeVisible();

  // Le lien coupé : la page neutre, sans titre ni nom, jusque dans l'onglet
  await aller(page, `/projet/${l.projet}/livre?etape=sortie&volet=partager`);
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "Par un lien" }) }).click();
  await page.getByRole("group", { name: "Retirer le partage ?" }).getByRole("button", { name: "Retirer le partage" }).click();
  await expect(page.getByText("Ce livre n’est pas partagé.")).toBeVisible();
  await lecteur.reload();
  await expect(lecteur.getByText("Ce livre n’est plus partagé.")).toBeVisible();
  await expect(lecteur).toHaveTitle("Ce livre n’est plus partagé");
  await expect(lecteur.locator("body")).not.toContainText("phare");

  // Partagé de nouveau : le même lien ; puis changé : l'ancien est neutre, le nouveau lit le livre
  expect(await partager(page, l.projet)).toBe(adresse);
  await page.getByRole("button", { name: "Changer de lien…" }).click();
  await page.getByRole("group", { name: "Changer de lien ?" }).getByRole("button", { name: "Changer de lien" }).click();
  const champ = page.getByRole("textbox", { name: "Lien de lecture" });
  await expect(champ).not.toHaveValue(adresse);
  await lecteur.goto(adresse);
  await expect(lecteur.getByText("Ce livre n’est plus partagé.")).toBeVisible();
  await lecteur.goto(await champ.inputValue());
  await expect(lecteur.getByRole("heading", { name: "Le phare", level: 1 })).toBeVisible();
  await contexte.close();
});

test("F12.1 — récit classique : un chapitre par écran, le filet entre les scènes, le sommaire, sans marque de fin ; la lecture reprend au chapitre", async ({ page, browser }) => {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "classique", "Le grand voyage");
  const { chapitres } = await semerPartie(base, projet, "Le voyage", [{ titre: "Le départ", scenes: ["", ""] }, { titre: "Le retour", scenes: [""] }]);
  await semerBlocs(base, chapitres[0].scenes[0], [recit("Le bateau quitte le port.")]);
  await semerBlocs(base, chapitres[0].scenes[1], [recit("La mer est calme.")]);
  await semerBlocs(base, chapitres[1].scenes[0], [recit("Le port, enfin.")]);
  await pret(projet);
  const adresse = await partager(page, projet);
  const { contexte, lecteur } = await telephone(browser);
  await lecteur.goto(adresse);
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await expect(texte(lecteur).getByRole("heading", { name: /Chapitre 1\s*Le départ/ })).toBeVisible();
  await expect(texte(lecteur)).toContainText("Le bateau quitte le port.");
  await expect(texte(lecteur)).toContainText("La mer est calme.");
  await expect(texte(lecteur).locator(".lecteur__filet")).toHaveCount(1);
  await expect(texte(lecteur)).not.toContainText("Le port, enfin.");
  await lecteur.getByRole("button", { name: /Sommaire/ }).click();
  await expect(lecteur.getByRole("list", { name: "Sommaire" }).getByRole("button")).toHaveText(["1 Le départ", "2 Le retour"]);
  await lecteur.getByRole("button", { name: /Sommaire/ }).click();
  await texte(lecteur).getByRole("button", { name: "Chapitre suivant" }).click();
  await expect(texte(lecteur)).toContainText("Le port, enfin.");
  await expect(texte(lecteur).locator(".lu-fin__marque")).toHaveCount(0);
  await expect(texte(lecteur).getByRole("button", { name: "Relire depuis le début" })).toBeVisible();
  await lecteur.reload();
  await expect(lecteur.getByRole("button", { name: "Continuer au chapitre 2" })).toBeVisible();
  await contexte.close();
});

test("un code qui n'existe pas mène à la page neutre", async ({ browser }) => {
  const { contexte, lecteur } = await telephone(browser);
  await lecteur.goto("/lire/aaaa-bbb-ccc");
  await expect(lecteur.getByText("Ce livre n’est plus partagé.")).toBeVisible();
  await contexte.close();
});

test("F14-AC34 — « Écrit avec Il était une classe » au pied de la page de titre et après la fin, menant à l'accueil ; ni pendant la lecture, ni sur la page neutre", async ({ page, browser }) => {
  const l = await phare(page);
  const lien = await partager(page, l.projet);
  const { contexte, lecteur } = await telephone(browser);
  await lecteur.goto(new URL(lien).pathname);
  const mention = lecteur.getByRole("link", { name: "Écrit avec Il était une classe" });
  await expect(mention).toBeVisible();
  await expect(mention).toHaveAttribute("href", "/");
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await expect(lecteur.getByText("La plage au matin.")).toBeVisible();
  await expect(mention).toHaveCount(0);
  await lecteur.getByRole("button", { name: /Rentrer à la maison/ }).click();
  await expect(lecteur.getByText("Tu rentres chez toi.")).toBeVisible();
  await expect(mention).toBeVisible();
  await mention.click();
  await expect(lecteur).toHaveURL(/\/$/);
  await expect(lecteur.getByRole("heading", { level: 1, name: "Votre classe écrit son livre-jeu." })).toBeVisible();
  // La page neutre ne la porte pas
  await lecteur.goto("/lire/zzzzzzzzzz");
  await expect(lecteur).toHaveTitle("Ce livre n’est plus partagé");
  await expect(lecteur.getByRole("link", { name: "Écrit avec Il était une classe" })).toHaveCount(0);
  await contexte.close();
});
