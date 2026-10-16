import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  action, aller, choixAuto, classeQuiEcrit, liaison, posteDe, recit, semerBlocs, semerImage, semerPartie, semerProjet, sql, supprimerComptes, type Compte,
} from "../parcours/outils";

/**
 * Captures des écrans de l'étape 7 : npm run captures -- etape7
 * Elles s'écrivent dans test-results/captures/. Ce n'est pas un test : rien n'y est vérifié.
 */
const dossier = "test-results/captures";
let n = 700;
const capturer = async (page: Page, nom: string, toute = true) => {
  n += 1;
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dossier}/${n}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});
// Les codes faux comptent par adresse réseau : tous les essais viennent de la même, on repart à zéro
test.beforeEach(async () => {
  await sql("delete from essais_entree");
});

/** Une vraie image dans le seau, pour que la couverture et le passage la montrent. */
async function image(base: SupabaseClient, compte: Compte, projet: string, nom: string): Promise<string> {
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_CLE_SECRETE!, { auth: { persistSession: false } });
  const id = await semerImage(base, compte, projet);
  for (const [suffixe, fichier] of [["", `defaut-${nom}.jpg`], ["-v", `defaut-${nom}-v.jpg`]]) {
    await service.storage.from("images").upload(`${compte.id}/${projet}/${id}${suffixe}.jpg`, readFileSync(`public/illustrations/${fichier}`), { contentType: "image/jpeg", upsert: true });
  }
  return id;
}

/** Un livre fini, partagé par l'écran sur les canaux demandés. */
async function livreFini(page: Page, base: SupabaseClient, compte: Compte, titre: string, classeId: string | null, canaux: ("Par un lien" | "À mes classes")[], illustration?: string) {
  const projet = await semerProjet(base, compte, classeId ? "classe" : "personnel", "choix", titre, classeId);
  const s = (await semerPartie(base, projet, "Le quai aux lanternes", [{ titre: "Le dernier bac", scenes: ["Le quai", "La porte", "Le sommet"] }])).chapitres[0].scenes;
  await base.from("projets").update({ depart_scene_id: s[0] }).eq("id", projet);
  const img = illustration ? await image(base, compte, projet, illustration) : null;
  await semerBlocs(base, s[0], [
    recit("La sirène du dernier bac retentit trois fois. Lou courut sur le quai, son sac rebondissant dans son dos, pendant que la brume avalait les lanternes une à une."),
    action("Ajoute la lanterne de secours à ton inventaire."),
    choixAuto("Monter vers la porte", s[1]), choixAuto("Attendre le prochain bac", s[2]),
  ]);
  await semerBlocs(base, s[1], [recit("Trois symboles brillent sur la porte."), liaison(s[2], "Déchiffrer"), choixAuto("Redescendre", s[0])]);
  await semerBlocs(base, s[2], [recit("La lanterne du sommet s’allume.")]);
  await base.from("scenes").update({ fin: true }).eq("id", s[2]);
  const feuille = { on: true, des: 1, sections: [{ id: "v", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "c", nom: "Volonté", depart: 5 }] }, { id: "i", type: "liste", titre: "Inventaire", lignes: 8 }] };
  await sql("update preparations set regles = 'Tu commences avec 5 points de volonté.', feuille = $2 where projet_id = $1", [projet, JSON.stringify(feuille)]);
  if (img) await sql(`update projets set pages_du_livre = jsonb_build_object('titre', jsonb_build_object('illustration', $2::text)) where id = $1`, [projet, img]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );
  for (const canal of canaux) {
    await aller(page, `/projet/${projet}/livre?etape=sortie&volet=partager`);
    await page.locator("label.inter", { has: page.getByRole("switch", { name: canal }) }).click();
    const rappel = page.getByRole("group", { name: "À relire avant de partager" });
    await rappel.getByText("J’ai relu le livre sur ces points.").click();
    await rappel.getByRole("button", { name: "Partager" }).click();
    await expect(page.getByText(/Livre partagé, à jour depuis le/)).toBeVisible();
  }
  return { projet, s };
}

test("lots 1 à 3 : partager, le lecteur en ligne, « Lire »", async ({ page, browser }) => {
  test.setTimeout(400_000);
  n = 700;
  const s = await classeQuiEcrit(page);
  const phare = await livreFini(page, s.base, s.compte, "La lanterne du passeur", s.classe.id, ["À mes classes", "Par un lien"], "chateau");
  await livreFini(page, s.base, s.compte, "Le bateau de brume", null, ["À mes classes"], "bateau");

  // L'adulte : le volet « Partager », partagé, puis le rappel
  await page.setViewportSize({ width: 1366, height: 860 });
  await aller(page, `/projet/${phare.projet}/livre?etape=sortie&volet=partager`);
  await capturer(page, "partager-partage");
  await page.getByRole("button", { name: "Modifier" }).click();
  await capturer(page, "partager-noms-ouverts");
  const adresse = await page.getByRole("textbox", { name: "Lien de lecture" }).inputValue();

  // L'élève : « Lire », grand écran, puis téléphone
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.setViewportSize({ width: 1366, height: 860 });
  await alice.page.getByRole("navigation", { name: "Espace élève" }).getByRole("link", { name: "Lire", exact: true }).click();
  await capturer(alice.page, "lire-eleve");
  await alice.page.getByRole("link", { name: /La lanterne du passeur/ }).click();
  await capturer(alice.page, "lire-eleve-page-de-titre", false);
  await alice.page.getByRole("button", { name: "Commencer la lecture" }).click();
  await alice.page.getByRole("button", { name: "Ma feuille" }).first().click();
  await capturer(alice.page, "lire-eleve-passage-feuille", false);
  await alice.page.setViewportSize({ width: 390, height: 844 });
  await alice.page.getByRole("link", { name: "Retour à Lire" }).click();
  await capturer(alice.page, "mobile-lire-eleve");

  // Hors des horaires : la lecture à l'essai fermée, les livres ouverts
  await sql("insert into horaires (classe_id, enseignant_id, jours, de, a) values ($1, $2, '{1,2,3,4,5,6,7}', '00:00', '00:01')", [s.classe.id, s.compte.id]);
  await sql("update classes set horaires_limites = true where id = $1", [s.classe.id]);
  await alice.page.reload();
  await capturer(alice.page, "mobile-lire-eleve-hors-horaires");
  await alice.page.setViewportSize({ width: 1366, height: 860 });
  await alice.page.reload();
  await capturer(alice.page, "lire-eleve-hors-horaires");
  await alice.contexte.close();

  // Le lecteur du lien, sur un téléphone, sans compte : reprise perdue après une mise à jour
  const tel = await browser.newContext({ baseURL: "http://localhost:3100", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "fr-FR" });
  const lecteur = await tel.newPage();
  await lecteur.goto(adresse);
  await capturer(lecteur, "mobile-lecteur-page-de-titre");
  await lecteur.evaluate((cle) => localStorage.setItem(cle, JSON.stringify({ parcours: { etapes: ["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000002"], position: 1 }, deja: [], feuille: {}, des: null })), `lecture:${adresse.split("/").pop()!.replace(/-/g, "")}`);
  await lecteur.reload();
  await capturer(lecteur, "mobile-lecteur-reprise-perdue", false);
  await lecteur.getByRole("button", { name: "Commencer la lecture" }).click();
  await capturer(lecteur, "mobile-lecteur-passage", false);
  await lecteur.goto("/lire/aaaa-bbb-ccc");
  await capturer(lecteur, "mobile-lecteur-page-neutre", false);
  // « Momentanément indisponible » : la même mise en page que la page neutre, avec son texte
  await lecteur.evaluate(() => {
    const p = document.querySelectorAll(".lecteur-seul p");
    p[0].textContent = "Le livre est momentanément indisponible.";
    p[1].outerHTML = '<button type="button" class="btn">Réessayer dans quelques minutes</button>';
  });
  await capturer(lecteur, "mobile-lecteur-indisponible", false);
  await tel.close();
});
