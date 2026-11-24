import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Page } from "@playwright/test";
import { aller, connecter, sql } from "../parcours/outils";

/**
 * Les trois captures de la page de l'auteur seul (F14-AC76), prises le 24 novembre 2026 sur « La dernière traversée
 * du Cormoran », un livre-jeu pour adultes chargé en local (`npm run livres:exemple -- cormoran --brouillon`), à la
 * place de celles des livres de classe, jugées « un peu bébé » par le porteur pour ce public :
 *   npx playwright test --config playwright.local.config.ts auteur-seul
 * Depuis le compte local (V1/app/.compte-local, sur localhost seulement), sans aucune aide demandée. Les PNG
 * s'écrivent dans test-results/captures/auteur-seul/ ; la conversion en webp se fait à part.
 */
const dossier = "test-results/captures/auteur-seul";
const TITRE = "La dernière traversée du Cormoran";

test.use({ deviceScaleFactor: 2, viewport: { width: 1440, height: 900 }, actionTimeout: 20_000 });

/** Retire ce qui n'est pas de l'application (pastille de Next.js) et ce qui encombre le schéma. */
async function nettoyer(page: Page): Promise<void> {
  await page.addStyleTag({
    content: "nextjs-portal, .react-flow__attribution, .chemins__coin, .chemins__ia, .chemins__mini { display: none !important; }",
  });
}

test("Auteur seul : les chemins, la copie d'une scène et une double page du livre", async ({ page }) => {
  test.setTimeout(300_000);
  const [projet] = await sql<{ id: string }>("select id from projets where titre = $1 and organisation = 'personnel' order by cree_le desc limit 1", [TITRE]);
  const [chapitre] = await sql<{ id: string }>("select id from chapitres where projet_id = $1 limit 1", [projet.id]);
  const [scene] = await sql<{ id: string }>("select id from scenes where projet_id = $1 and reference = 10", [projet.id]);

  const [courriel, motDePasse] = readFileSync(resolve(__dirname, "../../.compte-local"), "utf8").split("\n").map((l) => l.trim());
  await connecter(page, { id: "", courriel, motDePasse });
  await page.waitForURL(/\/projet|\/projets/);

  // 1 — « Chemins » : le départ et ses trois choix, le commandant, les poches et la cabine
  await aller(page, `/projet/${projet.id}/chapitre/${chapitre.id}`);
  await page.locator(".carte-chemin").first().waitFor();
  await page.waitForTimeout(2500);
  await nettoyer(page);
  const cadre = (await page.locator(".chemins__cadre").first().boundingBox())!;
  const cabine = (await page.locator(".carte-chemin", { hasText: "Cabine A-24 — le désordre" }).first().boundingBox())!;
  const haut = cadre.y + 12;
  await page.screenshot({ path: `${dossier}/chemins.png`, clip: { x: cadre.x + 150, y: haut, width: 1040, height: cabine.y + cabine.height + 24 - haut } });

  // 2 — La copie d'une scène, sans les scènes voisines : le récit et ses deux choix
  await aller(page, `/projet/${projet.id}/scene/${scene.id}`);
  const voisines = page.getByLabel("Scènes voisines");
  await voisines.waitFor();
  if (await voisines.isChecked()) await voisines.click();
  await page.waitForTimeout(1500);
  await nettoyer(page);
  const recit = page.getByText("Vous grimpez jusqu’à la passerelle").first();
  const dernier = page.getByText(/Garder son secret/).first();
  await recit.scrollIntoViewIfNeeded();
  // La souris hors de la copie : ni « + » ni repère de prise
  await page.mouse.move(1430, 10);
  await page.waitForTimeout(400);
  const [r, d] = [(await recit.boundingBox())!, (await dernier.boundingBox())!];
  const feuille = (await page.locator("[contenteditable=true]").first().boundingBox())!;
  await page.screenshot({ path: `${dossier}/copie.png`, clip: { x: feuille.x, y: r.y - 28, width: feuille.width, height: d.y + d.height + 28 - (r.y - 28) } });

  // 2 bis — La même copie sur téléphone, pour la page vue en 390 points
  await page.setViewportSize({ width: 390, height: 844 });
  await aller(page, `/projet/${projet.id}/scene/${scene.id}`);
  await page.getByText("Vous grimpez jusqu’à la passerelle").first().waitFor();
  await page.waitForTimeout(1500);
  await nettoyer(page);
  // Sur téléphone, le second paragraphe et les deux choix : le récit entier n'y tient pas
  const suiteTel = page.getByText("Il ne cherche pas à mentir").first();
  await suiteTel.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 80));
  // Le pied collé de la copie (« Enregistré ») n'est pas de la scène
  await page.evaluate(() => {
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      const s = getComputedStyle(el);
      if ((s.position === "fixed" || s.position === "sticky") && el.getBoundingClientRect().bottom >= innerHeight - 2) el.style.visibility = "hidden";
    }
  });
  await page.mouse.move(385, 5);
  await page.waitForTimeout(500);
  const [rt, dt] = [(await suiteTel.boundingBox())!, (await page.getByText(/Garder son secret/).first().boundingBox())!];
  const feuilleTel = (await page.locator("[contenteditable=true]").first().boundingBox())!;
  // Le dernier choix tient sur deux lignes, et son renvoi au-dessous
  await page.screenshot({ path: `${dossier}/copie-telephone.png`, clip: { x: feuilleTel.x, y: rt.y - 20, width: feuilleTel.width, height: dt.y + 96 - (rt.y - 20) } });
  await page.setViewportSize({ width: 1440, height: 900 });

  // 3 — Une double page du livre, sans les marques de la version de travail : « La mise en page me convient », le PDF
  // définitif, puis l'aperçu dessiné d'après lui (même composition, mêmes pages) ; chaque étalée, pour choisir
  await aller(page, `/projet/${projet.id}/livre?etape=page`);
  const convient = page.getByRole("button", { name: "La mise en page me convient" });
  if (await convient.isVisible().catch(() => false)) {
    await convient.click();
    await page.waitForTimeout(2000);
  }
  const definitif = await page.request.post(`/livre/${projet.id}/definitif`, { headers: { origin: "http://localhost:4840" }, timeout: 180_000 });
  const fait = (await definitif.json()) as { ok: boolean; adresse?: string; erreur?: string; raisons?: unknown };
  if (!fait.ok || !fait.adresse) throw new Error(`PDF définitif refusé : ${JSON.stringify(fait)}`);
  await page.route("**/livre/*/apercu", async (route) => {
    const reponse = await route.fetch();
    const donnees = (await reponse.json()) as { apercu?: { adresse: string } };
    if (donnees.apercu) donnees.apercu.adresse = fait.adresse!;
    await route.fulfill({ response: reponse, json: donnees });
  });
  await aller(page, `/projet/${projet.id}/livre?etape=page`);
  await page.getByRole("tab", { name: "Aperçu" }).or(page.getByRole("button", { name: "Aperçu" })).first().click();
  await page.locator(".apercu__etat").filter({ hasText: "passages" }).first().waitFor({ timeout: 180_000 });
  await page.getByRole("button", { name: "Double page" }).click().catch(() => {});
  await page.waitForTimeout(2500);
  await nettoyer(page);
  // La barre de l'aperçu, collée en haut, et les numéros de page de l'écran : pas du livre
  await page.addStyleTag({ content: ".apercu__barre, .apercu__etat, .apercu__folio { visibility: hidden !important; }" });
  await page.mouse.move(1430, 10);
  const etalees = page.locator(".apercu__etalee");
  for (let i = 0; i < (await etalees.count()); i += 1) {
    // Sous la barre collée de l'aperçu, qui recouvrirait le haut des pages
    await etalees.nth(i).evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 110));
    await page.waitForTimeout(800);
    const boite = (await etalees.nth(i).boundingBox())!;
    await page.screenshot({ path: `${dossier}/etalee-${i + 1}.png`, clip: boite });
  }
});
