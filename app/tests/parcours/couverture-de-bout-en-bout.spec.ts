import { expect, test } from "@playwright/test";
import { MESSAGE, aller, choixAuto, classeQuiEcrit, posteDe, recit, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * La couverture faite sur le site, de bout en bout (F11.4, lot 4) : décrite sans rien écrire,
 * créée pour imprimer, proposée à la bibliothèque, publiée, puis vue dans la bibliothèque, en
 * aperçu de partage et dans « Lire » côté élève. L'IA simulée.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

test("Couverture — la décrire sans rien écrire, la créer, la proposer, la publier, la retrouver dans la bibliothèque et dans « Lire »", async ({ page, browser }) => {
  test.setTimeout(180_000);
  const s = await classeQuiEcrit(page);
  const projet = await semerProjet(s.base, s.compte, "classe", "choix", "La lanterne du passeur", s.classe.id);
  const scenes = (await semerPartie(s.base, projet, "Le quai", [{ titre: "Le dernier bac", scenes: ["Le quai", "Le sommet"] }])).chapitres[0].scenes;
  await s.base.from("projets").update({ depart_scene_id: scenes[0] }).eq("id", projet);
  await semerBlocs(s.base, scenes[0], [recit("La sirène du dernier bac retentit trois fois."), choixAuto("Monter", scenes[1])]);
  await semerBlocs(s.base, scenes[1], [recit("La lanterne du sommet s’allume.")]);
  await s.base.from("scenes").update({ fin: true }).eq("id", scenes[1]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [projet]);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [projet],
  );

  // Rien d'écrit : l'IA propose quand même la description, puis la couverture se crée
  await aller(page, `/projet/${projet}/livre?etape=sortie`);
  const bloc = page.locator("aside.couverture");
  await expect(bloc.getByRole("button", { name: "Créer la couverture" })).toBeDisabled();
  await bloc.getByRole("button", { name: "Proposer la description avec l’IA" }).click();
  await expect(bloc.locator(".ci__decrit")).not.toHaveValue("");
  await bloc.getByRole("button", { name: "Créer la couverture" }).click();
  await expect(MESSAGE(page)).toContainText("Couverture posée.", { timeout: 30_000 });
  const [{ couverture }] = await sql<{ couverture: string }>("select couverture_id as couverture from projets where id = $1", [projet]);

  // Partagée « À mes classes », proposée à la bibliothèque avec sa vignette
  await page.getByRole("tab", { name: "Partager" }).click();
  await page.locator("label.inter", { has: page.getByRole("switch", { name: "À mes classes" }) }).click();
  await page.getByText("J’ai relu le livre sur ces points.").click();
  await page.getByRole("button", { name: "Partager à mes classes" }).click();
  await expect(page.getByText(/À jour depuis le/)).toBeVisible();
  await page.getByRole("button", { name: "Proposer à la bibliothèque…" }).click();
  const panneau = page.getByRole("group", { name: "Proposer à la bibliothèque" });
  await expect(panneau.getByRole("img", { name: "La couverture proposée" })).toBeVisible();
  await panneau.getByLabel("Présentation").fill("Au bord du fleuve, la brume ne se lève plus.");
  await panneau.getByText("J’ai l’autorisation écrite").click();
  await panneau.getByRole("button", { name: "Proposer le livre" }).click();
  await expect(page.getByText("En attente de relecture")).toBeVisible();
  const [{ c }] = await sql<{ c: string }>("select proposee->'couverture'->>'id' as c from publications where projet_id = $1", [projet]);
  expect(c).toBe(couverture);

  // Publiée par l'éditeur : la bibliothèque et l'aperçu de partage la montrent
  await sql(
    `update publications set adresse = 'la-lanterne-' || substr(md5(projet_id::text), 1, 6), version = proposee, presentation = presentation_proposee, age = age_propose,
       empreinte = empreinte_proposee, publiee_le = now(), mise_a_jour_le = now(), proposee = null, presentation_proposee = null, age_propose = null,
       empreinte_proposee = null, proposee_le = null, attestation = null
     where projet_id = $1`,
    [projet],
  );
  const [{ adresse }] = await sql<{ adresse: string }>("select adresse from publications where projet_id = $1", [projet]);
  const visiteur = await (await browser.newContext()).newPage();
  await visiteur.goto(`http://localhost:3100/bibliotheque/${adresse}`);
  await expect(visiteur.locator(`img[src="/images/publie/${adresse}/${couverture}?v=1"]`).first()).toBeVisible();
  await expect(visiteur.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(`/images/publie/${adresse}/${couverture}$`));
  await visiteur.context().close();

  // Côté élève, « Lire » montre la couverture du livre de la classe
  const alice = await posteDe(browser, s, "Alice");
  await alice.page.goto("/travail/lecture");
  await expect(alice.page.locator(`img[src="/images/classe/${projet}/${couverture}?v=1"]`)).toBeVisible();
  await alice.contexte.close();
});
