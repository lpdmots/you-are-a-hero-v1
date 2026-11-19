import { expect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { adultePret, aller, semerClasse, semerPartie, semerProjet, service, sql, supprimerComptes } from "../parcours/outils";
import { ELEVES, FEUILLE, OBJETS, PREPARATION } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la fiche de l'histoire et de la description des parties (F02.1), pour la critique en deux
 * lectures : npx playwright test --config playwright.local.config.ts fiche-de-l-histoire
 * Elles s'écrivent dans test-results/captures/fiche-histoire/. Ce n'est pas un test : rien n'y est
 * vérifié. Les portraits sont copiés depuis une image du stockage local dans le dossier du compte
 * d'essai, qui part avec lui.
 */
const dossier = "test-results/captures/fiche-histoire";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

/** Les parties du livre : trois décrites, une sans description (F02.1, 19 novembre 2026) */
const PARTIES: [string, string][] = [
  ["Le port de Brumeval", "Le village des passeurs, ses pontons et ses barques, au bord du grand lac."],
  ["Le grand lac", "Couvert de brume ; les chemins y changent de place quand les lanternes s’éteignent."],
  ["La forêt des Murmures", ""],
  ["Le phare éteint", "Sur l’île du milieu, une tour noire où l’on entend chanter la nuit."],
];

test("Fiche de l'histoire et description des parties (F02.1), en 1366 et 390 px, à l'écran et à l'impression", async ({ page }) => {
  test.setTimeout(300_000);
  const erreurs: string[] = [];
  page.on("console", (m) => (m.type() === "error" ? erreurs.push(`${page.url()} — ${m.text()}`) : undefined));
  page.on("pageerror", (e) => erreurs.push(`${page.url()} — ${e.message}`));
  const { compte, base } = await adultePret(page);
  const classe = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  await base.from("projets").update({ consigne_ecriture: "Au présent, en « tu », avec des phrases courtes pour des lecteurs de 8 à 10 ans." }).eq("id", projet);
  await base.from("preparations").update({ univers: PREPARATION.univers, enjeu: PREPARATION.enjeu, regles: PREPARATION.regles, feuille: FEUILLE }).eq("projet_id", projet);

  // Des portraits : une image de personnage du stockage local, copiée dans le dossier du compte d'essai
  const [source] = await sql<{ chemin: string; chemin_vignette: string; largeur: number; hauteur: number }>(
    "select i.chemin, i.chemin_vignette, i.largeur, i.hauteur from public.personnages c join public.images i on i.id = c.portrait_id limit 1",
  );
  const portrait = async (nom: string): Promise<string | null> => {
    if (!source) return null;
    const stockage = service().storage.from("images");
    const [grand, petit] = await Promise.all([stockage.download(source.chemin), stockage.download(source.chemin_vignette)]);
    if (!grand.data || !petit.data) return null;
    const chemin = `${compte.id}/${projet}/${nom}.jpg`;
    for (const [ou, fichier] of [[chemin, grand.data], [`${compte.id}/${projet}/${nom}-v.jpg`, petit.data]] as const) {
      const { error } = await stockage.upload(ou, fichier, { contentType: "image/jpeg" });
      if (error) throw new Error(`Portrait d'essai : ${error.message}`);
    }
    const { data, error } = await base.from("images").insert({ projet_id: projet, enseignant_id: compte.id, chemin, chemin_vignette: `${compte.id}/${projet}/${nom}-v.jpg`, largeur: source.largeur, hauteur: source.hauteur }).select("id").single();
    if (error) throw new Error(`Portrait d'essai : ${error.message}`);
    return data?.id ?? null;
  };
  const [lou, marius] = [await portrait("lou"), await portrait("marius")];
  const cartes = await base.from("personnages").insert([
    { projet_id: projet, enseignant_id: compte.id, nom: "Lou", autres_noms: ["le garçon", "le petit passeur"], heros: true, rang: 0, portrait_id: lou,
      description: "Lou a dix ans. C’est le fils de Marius, le dernier passeur du village.\nIl connaît par cœur le chant des lanternes, mais il a peur de l’eau profonde : il ne sait pas nager.\nIl ne se sépare jamais de sa petite lanterne, un cadeau de son père." },
    { projet_id: projet, enseignant_id: compte.id, nom: "Marius", autres_noms: ["le père de Lou"], heros: false, rang: 1, portrait_id: marius, description: "Le père de Lou, parti chercher la première lanterne. Calme et courageux." },
    { projet_id: projet, enseignant_id: compte.id, nom: "Plume", autres_noms: ["la chouette"], heros: false, rang: 2, description: "Une chouette aux plumes argentées. Elle ne parle pas, mais elle connaît tous les chemins du lac." },
    { projet_id: projet, enseignant_id: compte.id, nom: "Le Gardien", autres_noms: [], heros: false, rang: 3, description: "Il veille sur la tour des Brumes et ne laisse passer que ceux qui connaissent le chant." },
  ]);
  if (cartes.error) throw new Error(`Cartes d'essai : ${cartes.error.message}`);
  for (const [i, [titre, description]] of PARTIES.entries()) {
    const { partieId } = await semerPartie(base, projet, titre, [{ titre: `Chapitre ${i + 1}` }], ["cite", "mer", "foret", "montagne"][i]);
    if (description) await base.from("parties").update({ description }).eq("id", partieId);
  }
  for (const [nom, description] of OBJETS.slice(0, 4)) await base.from("objets").insert({ projet_id: projet, enseignant_id: compte.id, nom, description });

  // ——— La description des parties, sur leur carte de « Grandes étapes » et dans leurs réglages ———
  await page.setViewportSize({ width: 1366, height: 900 });
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await capturer(page, "grandes-etapes");
  await page.getByLabel("Description de la partie La forêt des Murmures").click();
  await page.keyboard.type("Les arbres y répètent ce qu’on dit tout bas.");
  await capturer(page, "description-en-cours");
  await page.getByLabel("Autres commandes de la partie Le grand lac").click();
  await page.getByRole("button", { name: "Réglages" }).click();
  await capturer(page, "reglages-de-la-partie");
  await page.getByRole("button", { name: "Fermer" }).last().click();

  // ——— La fiche ———
  await page.getByRole("link", { name: "Imprimer la fiche de l’histoire" }).click();
  await page.waitForURL(/fiche-de-l-histoire$/);
  await page.evaluate(() => document.fonts.ready);
  await capturer(page, "fiche-ecran");
  await capturer(page, "fiche-ecran-entiere", true);

  // « Réglages » : une case par rubrique ; décochée, la rubrique sort de la fiche, et le projet s'en souvient
  await page.getByRole("button", { name: "Réglages" }).click();
  await capturer(page, "reglages-de-la-fiche");
  await page.getByLabel("Les objets").uncheck();
  await page.getByLabel("Notre façon d’écrire").uncheck();
  await capturer(page, "rubriques-decochees");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  if (await page.getByRole("heading", { name: "Les objets" }).count()) throw new Error("La rubrique décochée est revenue après le rechargement.");
  await capturer(page, "rubriques-gardees", true);
  await page.getByRole("button", { name: "Réglages" }).click();
  await page.getByLabel("Les objets").check();
  await page.getByLabel("Notre façon d’écrire").check();
  await page.keyboard.press("Escape");

  // À l'impression : la feuille seule, et le vrai nombre de pages du PDF
  await page.emulateMedia({ media: "print" });
  await capturer(page, "fiche-impression", true);
  const pdf = await page.pdf({ format: "A4", preferCSSPageSize: true });
  writeFileSync(`${dossier}/fiche.pdf`, pdf);
  await page.emulateMedia({ media: "screen" });

  // Un téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await capturer(page, "fiche-390");
  await aller(page, `/projet/${projet}/preparation?etape=etapes`);
  await page.getByLabel("Description de la partie Le port de Brumeval").scrollIntoViewIfNeeded();
  await capturer(page, "grandes-etapes-390");

  // Au-delà d'un recto verso : un héros à la description longue
  await page.setViewportSize({ width: 1366, height: 900 });
  const longue = Array.from({ length: 55 }, (_, i) => `Souvenir ${i + 1} : Lou se rappelle une traversée avec son père, la brume, le chant et la lanterne.`).join("\n");
  expect((await base.from("personnages").update({ description: longue }).eq("projet_id", projet).eq("nom", "Lou")).error).toBeNull();

  await aller(page, `/projet/${projet}/fiche-de-l-histoire`);
  await page.evaluate(() => document.fonts.ready);
  await capturer(page, "fiche-trop-longue");

  // Une Préparation vide
  const vide = await semerProjet(base, compte, "classe", "classique", "Le grand voyage", classe.id);
  await aller(page, `/projet/${vide}/fiche-de-l-histoire`);
  await capturer(page, "fiche-vide");
  writeFileSync(`${dossier}/erreurs.txt`, erreurs.join("\n"));
});
