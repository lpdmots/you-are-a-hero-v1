import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { adultePret, aller, semerClasse, semerPartie, semerProjet, service, supprimerComptes } from "../parcours/outils";

/**
 * La vidéo « Gagner du temps avec l'IA » sur le site (F14-AC68 à AC72), capturée pour la juger :
 * npx playwright test --config playwright.local.config.ts video-ia (serveur 4840 lancé).
 * Ce n'est pas un test de la suite : un compte d'essai, supprimé à la fin. Aucune aide n'est
 * demandée : l'aide « utilisée » est une ligne posée au journal. Chrome, et non le Chromium de
 * Playwright, qui ne lit pas le H.264 : la lecture de la vidéo se constate.
 * Les images vont dans test-results/video-ia/ (ou CAPTURES=<dossier>).
 */
const dossier = process.env.CAPTURES ?? resolve(__dirname, "../../test-results/video-ia");

test.use({ channel: "chrome", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2 });
test.afterAll(async () => {
  await supprimerComptes();
});

async function capturer(page: Page, nom: string, clip?: { x: number; y: number; width: number; height: number }): Promise<void> {
  await page.evaluate(() => document.querySelectorAll("nextjs-portal").forEach((e) => e.remove()));
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${dossier}/${nom}.png`, ...(clip ? { clip } : {}) });
}

const invitation = (page: Page) => page.getByRole("button", { name: /Gagner du temps avec l’IA/ });

test("la vidéo des aides de l'IA : Aide, Mon compte, accueil, invitation de la colonne", async ({ page }) => {
  test.setTimeout(240_000);
  mkdirSync(dossier, { recursive: true });
  const vus: Record<string, unknown> = {};
  const { compte, base } = await adultePret(page);
  const masquees = async () => ((await base.from("enseignants").select("aides_masquees").eq("id", compte.id).single()).data?.aides_masquees ?? []) as string[];
  const remontrer = async () => {
    await base.from("enseignants").update({ aides_masquees: (await masquees()).filter((c) => c !== "video-ia") }).eq("id", compte.id);
  };

  // Sans projet : pas d'invitation (l'écran dit « Créer mon premier projet »)
  await aller(page, "/projets");
  vus.sansProjet = await invitation(page).count();

  const classe = await semerClasse(base, "CM2 des Tilleuls", ["Inès", "Mathis", "Léna"]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Le secret de la forêt bleue", classe.id);
  await semerPartie(base, projet, "La forêt", [{ titre: "L’entrée du bois", scenes: ["La clairière"] }]);
  const page1 = `/projet/${projet}/plan`;

  // 1 — L'invitation, au pied de la colonne, sur une page du projet
  await aller(page, page1);
  await expect(invitation(page)).toBeVisible();
  await capturer(page, "01-colonne-1366");
  await capturer(page, "02-colonne-pied", { x: 0, y: 468, width: 420, height: 300 });

  // Colonne repliée : le signe seul
  await page.getByRole("button", { name: "Replier la colonne" }).click();
  await capturer(page, "03-colonne-repliee", { x: 0, y: 468, width: 420, height: 300 });
  await page.getByRole("button", { name: "Déplier la colonne" }).click();

  // 2 — La vidéo s'ouvre au clic, se lit, et l'invitation s'en va une fois refermée
  await invitation(page).click();
  const fenetre = page.locator("dialog[open]");
  await expect(fenetre).toBeVisible();
  const video = fenetre.locator("video");
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 20_000 }).toBeGreaterThan(1);
  vus.lecture = await video.evaluate((v: HTMLVideoElement) => ({ src: v.currentSrc.replace(/^https?:\/\/[^/]+/, ""), duree: Math.round(v.duration), sousTitres: v.textTracks.length, enPause: v.paused }));
  await capturer(page, "04-lecteur");
  await fenetre.getByRole("button", { name: "Fermer" }).click();
  await expect(fenetre).toHaveCount(0);
  await expect(invitation(page)).toHaveCount(0);
  await expect.poll(masquees).toContain("video-ia");
  await aller(page, page1);
  vus.apresLaVideo = await invitation(page).count();

  // 3 — « Ne plus afficher » tient après rechargement
  await remontrer();
  await aller(page, page1);
  await expect(invitation(page)).toBeVisible();
  await page.getByRole("button", { name: "Ne plus afficher cette vidéo" }).click();
  await expect(invitation(page)).toHaveCount(0);
  await expect.poll(masquees).toContain("video-ia");
  await aller(page, page1);
  vus.apresNePlusAfficher = await invitation(page).count();

  // 4 — Une aide qui répond pendant la visite : l'invitation s'en va sur place
  await remontrer();
  await aller(page, page1);
  await expect(invitation(page)).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("aide-utilisee")));
  await expect(invitation(page)).toHaveCount(0);

  // 5 — Une aide réussie au journal : plus d'invitation, sans rien masquer
  // Seul le serveur écrit au journal : la clé de service
  const { data: appel } = await service()
    .from("appels_ia")
    .insert({ enseignant_id: compte.id, aide: "consigne", sorte: "texte", termine_le: new Date().toISOString(), issue: "reussi", fournisseur: "simule", modele: "essai" })
    .select("id")
    .single();
  await aller(page, page1);
  vus.apresUneAide = await invitation(page).count();
  vus.masqueesApresUneAide = (await masquees()).includes("video-ia");
  await service().from("appels_ia").delete().eq("id", appel!.id);

  // 6 — Les aides éteintes : pas d'invitation
  await aller(page, page1);
  await expect(invitation(page)).toBeVisible();
  const { data: avant } = await base.from("enseignants").select("reglages_ia").eq("id", compte.id).single();
  await service().from("enseignants").update({ reglages_ia: { ...(avant?.reglages_ia ?? {}), proposer: false } }).eq("id", compte.id);
  await aller(page, page1);
  vus.aidesEteintes = await invitation(page).count();
  await service().from("enseignants").update({ reglages_ia: avant?.reglages_ia ?? {} }).eq("id", compte.id);

  // 7 — « Mon compte » : la vignette sous le solde
  await aller(page, "/compte");
  await expect(page.getByRole("button", { name: /Gagner du temps avec l’IA.*Vidéo/ }).last()).toBeVisible();
  await capturer(page, "05-compte-1366");

  // 8 — 390 px : le tiroir et « Mon compte »
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, page1);
  await page.getByRole("button", { name: "Menu" }).click();
  await expect(invitation(page)).toBeVisible();
  await capturer(page, "06-tiroir-390");
  await aller(page, "/compte");
  await page.getByRole("heading", { name: "Étoiles" }).scrollIntoViewIfNeeded();
  await capturer(page, "07-compte-390");

  // 9 — L'« Aide » et l'accueil, sans compte
  await page.context().clearCookies();
  for (const [largeur, hauteur, suffixe] of [[1366, 768, "1366"], [390, 844, "390"]] as const) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    await aller(page, "/aide");
    await page.locator("#video-ia").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 120));
    await capturer(page, `08-aide-${suffixe}`);
    await aller(page, "/");
    const lien = page.getByRole("button", { name: /Voir en vidéo/ });
    await lien.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, 160));
    await capturer(page, `09-accueil-${suffixe}`);
    if (largeur === 1366) {
      // Le lien de l'accueil ouvre la même vidéo, sur place
      await lien.click();
      await expect.poll(() => page.locator("dialog[open] video").evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 20_000 }).toBeGreaterThan(0.5);
      vus.accueil = await page.locator("dialog[open] video source").getAttribute("src");
      await page.locator("dialog[open]").getByRole("button", { name: "Fermer" }).click();
      // Et la carte de l'« Aide »
      await aller(page, "/aide");
      await page.locator("#video-ia button").click();
      await expect.poll(() => page.locator("dialog[open] video").evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 20_000 }).toBeGreaterThan(0.5);
      vus.aide = await page.locator("dialog[open] video source").getAttribute("src");
      await page.locator("dialog[open]").getByRole("button", { name: "Fermer" }).click();
    }
  }
  console.log(JSON.stringify(vus, null, 1));
});
