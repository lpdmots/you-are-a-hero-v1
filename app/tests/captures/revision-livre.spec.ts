import { test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  action, adultePret, aller, choixAuto, figure, liaison, recit, semerAttribution, semerBlocs, semerClasse, semerImageDeposee, semerPartie,
  semerProjet, sql, supprimerComptes, type BlocSeme, type Compte,
} from "../parcours/outils";
import { poserLeMarais, type Requete } from "../../scripts/marais-des-feux-follets";
import { ACTIONS, CONSIGNES, DEPART, ELEVES, FEUILLE, PARTIES, PREPARATION, TEXTES, TEXTES_EN_COURS, TITRE } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie du Livre et de ses étapes (novembre 2026), contre le serveur local, sans
 * recompiler : npx playwright test --config playwright.local.config.ts revision-livre
 * Elles s'écrivent dans test-results/captures/livre/. Ce n'est pas un test : rien n'y est vérifié, et une vue qui
 * échoue est notée sans arrêter les suivantes. Le serveur local a de vraies clés : aucun bouton ✦ n'est cliqué.
 * Aucun envoi à un imprimeur : le PDF définitif se crée et se télécharge seulement.
 */
const dossier = "test-results/captures/livre";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};
/** Une vue qui échoue n'arrête pas les suivantes. */
const vue = async (nom: string, faire: () => Promise<void>) => {
  try {
    await Promise.race([faire(), new Promise((_, non) => setTimeout(() => non(new Error("plus de quatre minutes")), 240_000))]);
  } catch (e) {
    console.log(`Vue « ${nom} » manquée : ${(e as Error).message.split("\n")[0]}`);
  }
};
const apercuPret = (page: Page) => page.locator(".apercu__etat").filter({ hasText: "passages" }).first().waitFor({ timeout: 120_000 });
const tache = (page: Page, nom: string | RegExp) => page.locator(".fil__b").filter({ hasText: nom }).first().click();

test.use({ actionTimeout: 15_000 });
test.afterEach(async () => {
  await supprimerComptes();
});

/** « Les passeurs de brume » dans le compte jetable : le plan, les élèves, les textes ; « complet » écrit toutes les scènes. */
async function semerLesPasseurs(base: SupabaseClient, compte: Compte, classeId: string, eleves: Record<string, { id: string }>, complet: boolean) {
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classeId);
  await sql(
    `update preparations set univers = $2, personnages = $3, enjeu = $4, rubrique_jeu = true, feuille = $5, regles = $6, formule_renvoi = $7, constructions = $8
     where projet_id = $1`,
    [projet, PREPARATION.univers, PREPARATION.personnages, PREPARATION.enjeu, JSON.stringify(FEUILLE), PREPARATION.regles, PREPARATION.formuleRenvoi, [...PREPARATION.constructions]],
  );
  const ids = new Map<number, string>();
  const parties: Record<string, string> = {};
  const scenes = PARTIES.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
  for (const [i, partie] of PARTIES.entries()) {
    const posee = await semerPartie(base, projet, partie.titre, partie.chapitres.map((c) => ({ titre: c.titre, scenes: c.scenes.map((s) => s.titre) })), ["mer", "foret", "montagne", "cite"][i % 4]);
    parties[partie.cle] = posee.partieId;
    for (const [k, chapitre] of partie.chapitres.entries()) {
      const ch = posee.chapitres[k];
      if (chapitre.eleves.length) await semerAttribution(base, ch.id, chapitre.eleves.map(([prenom, profil]) => ({ eleve: eleves[prenom].id, profil })));
      for (const [j, s] of chapitre.scenes.entries()) {
        ids.set(s.ref, ch.scenes[j]);
        await sql("update scenes set consigne = $2, fin = $3, prise_par_eleve = $4 where id = $1", [
          ch.scenes[j], s.sansConsigne ? "" : (CONSIGNES[s.ref] ?? ""), s.fin === true || (complet && !s.choix?.length && !s.cachee), s.pec ? eleves[s.pec].id : null,
        ]);
      }
    }
  }
  let pose = 0;
  for (const s of scenes) {
    const ecrite = complet || !s.vide;
    const paragraphes = ecrite ? ((complet ? undefined : TEXTES_EN_COURS[s.ref]) ?? TEXTES[s.ref] ?? [`${s.titre.split(" — ").pop()} : Lou avance dans la brume, la lanterne levée, et regarde autour de lui avant de choisir.`]) : [];
    const actions = ecrite ? (ACTIONS[s.ref] ?? []) : [];
    const blocs: BlocSeme[] = [];
    paragraphes.forEach((texte, i) => {
      actions.filter(([avant]) => Math.min(avant, paragraphes.length) === i).forEach(([, t]) => blocs.push(action(t)));
      blocs.push(recit(texte));
    });
    actions.filter(([avant]) => avant >= paragraphes.length).forEach(([, t]) => blocs.push(action(t)));
    for (const [libelle, vers] of s.choix ?? []) {
      blocs.push(choixAuto(libelle, ids.get(vers) ?? null, PREPARATION.constructions[pose % PREPARATION.constructions.length]));
      pose += 1;
    }
    if (s.cachee && ids.get(s.cachee.cible)) blocs.push(liaison(ids.get(s.cachee.cible)!, s.cachee.libelle));
    if (blocs.length) await semerBlocs(base, ids.get(s.ref)!, blocs);
  }
  for (const s of scenes) if (s.cachee && ids.get(s.cachee.cible)) await sql("update scenes set numero_fixe = $2 where id = $1", [ids.get(s.cachee.cible), s.cachee.numero]);
  await base.from("projets").update({ depart_scene_id: ids.get(DEPART) }).eq("id", projet);
  return { projet, ids, parties };
}

test("Livre : ses étapes, en septembre puis livre fini, aides, aperçu, scène à côté, mise en page, impression, partage, 1366 et 390 px", async ({ page }) => {
  test.setTimeout(900_000);
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  await page.setViewportSize({ width: 1366, height: 768 });
  const livre = (projet: string, etape?: string) => `/projet/${projet}/livre${etape ? `?etape=${etape}` : ""}`;

  // ——— A. En cours d'année : la classe écrit encore, le marais de trente-deux scènes a ses défauts ———
  const classeA = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const a = await semerLesPasseurs(base, compte, classeA.id, classeA.eleves, false);
  await sql("update scenes set etat = 'prete' where id = any($1)", [[1, 2, 3, 4, 5].map((r) => a.ids.get(r))]);
  await sql("update scenes set etat = 'valide' where id = any($1)", [[14, 15, 16].map((r) => a.ids.get(r))]);
  await poserLeMarais(sql as Requete, {
    projetId: a.projet, partieId: a.parties.foret, enseignantId: compte.id, ailleurs: { moulin: a.ids.get(40)!, sanctuaire: a.ids.get(31)! }, entreeDepuis: a.ids.get(21)!,
    eleves: new Map(Object.entries(classeA.eleves).map(([prenom, e]) => [prenom, e.id])),
  });

  // L'aide à l'ouverture de « Relire », puis de « Vérifier les chemins » : les aides du Livre redeviennent visibles
  await base.from("enseignants").update({ aides_masquees: ["classes", "plan", "preparation", "suivi"] }).eq("id", compte.id);
  await vue("aide-relire", async () => {
    await aller(page, livre(a.projet));
    await page.getByRole("button", { name: "Commencer" }).waitFor();
    await capturer(page, "A-aide-relire");
    await capturer(page, "A-aide-relire-toute", true);
  });
  await vue("aide-chemins", async () => {
    await page.context().clearCookies({ name: "aide-livre" });
    await aller(page, livre(a.projet, "chemins"));
    await page.getByRole("button", { name: "Commencer" }).waitFor();
    await capturer(page, "A-aide-chemins");
  });
  await base.from("enseignants").update({ aides_masquees: ["classes", "plan", "preparation", "suivi", "livre-chemins", "livre-relire"] }).eq("id", compte.id);

  await vue("relire-septembre", async () => {
    await aller(page, livre(a.projet, "relire"));
    await apercuPret(page);
    await capturer(page, "A-relire-reste-a-ecrire");
    await capturer(page, "A-relire-reste-a-ecrire-toute", true);
    await tache(page, "Erreurs graves");
    await capturer(page, "A-relire-erreurs-graves");
    await tache(page, "Lire et corriger");
    await capturer(page, "A-relire-lire-et-corriger");
  });
  await vue("relire-scene-a-cote", async () => {
    await page.getByRole("button", { name: /^Ouvrir n° \d+ ·/ }).nth(2).evaluate((b: HTMLButtonElement) => b.click(), undefined, { timeout: 20_000 });
    await page.locator(".copie__texte[contenteditable]").first().waitFor({ timeout: 30_000 });
    await capturer(page, "A-relire-scene-a-cote");
  });
  await vue("chemins-septembre", async () => {
    await aller(page, livre(a.projet, "chemins"));
    await apercuPret(page);
    await capturer(page, "A-chemins-depart-et-fins");
    await tache(page, "Choix à relier");
    await capturer(page, "A-chemins-choix-a-relier");
    await capturer(page, "A-chemins-choix-a-relier-toute", true);
    await tache(page, "Passages à confirmer");
    await capturer(page, "A-chemins-passages-a-confirmer");
    await tache(page, "Tester la lecture");
    await capturer(page, "A-chemins-tester");
  });
  await vue("chemins-point-ouvert", async () => {
    await tache(page, "Choix à relier");
    await page.getByRole("button", { name: "Ouvrir la scène" }).first().click();
    await page.locator(".copie__texte[contenteditable]").first().waitFor({ timeout: 30_000 });
    await capturer(page, "A-chemins-point-ouvert");
  });
  await vue("page-fermee", async () => {
    await aller(page, livre(a.projet, "page"));
    await capturer(page, "A-mettre-en-page-fermee");
    await aller(page, livre(a.projet, "sortie"));
    await capturer(page, "A-imprimer-fermee");
  });

  // ——— B. Le livre fini : toutes les scènes écrites et prêtes, une image peu définie, puis deux erreurs graves ———
  const classeB = await semerClasse(base, "CM1-CM2 d’essai", [...ELEVES]);
  const b = await semerLesPasseurs(base, compte, classeB.id, classeB.eleves, true);
  const dessin = await semerImageDeposee(base, compte, b.projet);
  const souche = b.ids.get(16)!;
  const [{ texte: texteSouche }] = await sql<{ texte: BlocSeme[] }>("select texte from scenes where id = $1", [souche]);
  await semerBlocs(base, souche, [...texteSouche.slice(0, 1), figure(dessin, 100), ...texteSouche.slice(1)]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [b.projet]);
  const loutre = b.ids.get(25)!;
  const cloche = b.ids.get(29)!;
  const [{ texte: texteLoutre }] = await sql<{ texte: BlocSeme[] }>("select texte from scenes where id = $1", [loutre]);
  const [{ texte: texteCloche }] = await sql<{ texte: BlocSeme[] }>("select texte from scenes where id = $1", [cloche]);
  await semerBlocs(base, loutre, []);
  await semerBlocs(base, cloche, [...texteCloche, figure(crypto.randomUUID(), 60)]);

  await vue("relire-fini-erreurs", async () => {
    await aller(page, livre(b.projet, "relire"));
    await apercuPret(page);
    await capturer(page, "B-relire-erreurs-graves");
  });
  await semerBlocs(base, loutre, texteLoutre);
  await semerBlocs(base, cloche, texteCloche);
  await vue("relire-fini-a-confirmer", async () => {
    await aller(page, livre(b.projet, "relire"));
    await apercuPret(page);
    await capturer(page, "B-relire-a-confirmer");
    await page.getByRole("button", { name: "Garder ainsi" }).first().click();
    await page.waitForTimeout(1500);
    await capturer(page, "B-relire-a-confirmer-garde");
  });
  await vue("relire-fini-lire", async () => {
    await tache(page, "Lire et corriger");
    await capturer(page, "B-relire-lire-et-corriger");
    await page.getByRole("button", { name: "Page agrandie" }).click().catch(() => undefined);
    await page.getByRole("button", { name: /^Ouvrir n° 1 ·/ }).first().evaluate((x: HTMLButtonElement) => x.click(), undefined, { timeout: 20_000 });
    await page.locator(".copie__texte[contenteditable]").first().waitFor({ timeout: 30_000 });
    await capturer(page, "B-relire-scene-a-cote");
    await page.locator('summary[aria-label^="Autres commandes de la scène"]').first().click();
    await capturer(page, "B-relire-scene-a-cote-menu");
    await page.keyboard.press("Escape");
    await capturer(page, "B-relire-scene-a-cote-toute", true);
  });
  await vue("relire-declarer", async () => {
    await aller(page, livre(b.projet, "relire"));
    await apercuPret(page);
    await tache(page, "Lire et corriger");
    await page.getByRole("button", { name: "J’ai relu le livre" }).click();
    await page.waitForTimeout(1500);
    await capturer(page, "B-relire-declare");
  });
  await vue("chemins-fini", async () => {
    await aller(page, livre(b.projet, "chemins"));
    await apercuPret(page);
    await capturer(page, "B-chemins");
    await tache(page, "Passages à confirmer");
    await capturer(page, "B-chemins-passages-a-confirmer");
    for (let k = 0; k < 12; k += 1) {
      const bouton = page.getByRole("button", { name: "C’est voulu" }).first();
      if (!(await bouton.isVisible().catch(() => false))) break;
      await bouton.click();
      await page.waitForTimeout(1200);
    }
    await capturer(page, "B-chemins-acceptes");
    await tache(page, "Tester la lecture");
    await capturer(page, "B-chemins-tester");
    await page.getByRole("button", { name: "J’ai vérifié les chemins" }).click();
    await page.waitForTimeout(1500);
    await capturer(page, "B-chemins-declare");
  });

  await vue("mettre-en-page-reglages", async () => {
    await aller(page, livre(b.projet, "page"));
    await page.locator(".petite-double__legende").filter({ hasText: "pages en tout" }).waitFor({ timeout: 120_000 });
    await capturer(page, "B-page-reglages");
    await capturer(page, "B-page-reglages-toute", true);
    await page.locator("#moins-de-blanc").scrollIntoViewIfNeeded();
    await capturer(page, "B-page-ordre-des-passages");
  });
  await vue("mettre-en-page-reordonner", async () => {
    await page.getByRole("button", { name: "Réordonner les passages" }).click();
    await page.waitForTimeout(4000);
    await page.locator("#moins-de-blanc").scrollIntoViewIfNeeded();
    await capturer(page, "B-page-reordonne");
  });
  await vue("mettre-en-page-panneau", async () => {
    await page.locator(".page-du-livre").filter({ hasText: "Page de titre" }).getByRole("button", { name: "Modifier" }).click();
    await page.waitForTimeout(2000);
    await capturer(page, "B-page-panneau-titre");
    await page.getByRole("button", { name: "Fermer le panneau" }).click();
    await page.locator(".page-du-livre").filter({ hasText: "Comment lire ce livre" }).getByRole("button", { name: "Modifier" }).click();
    await page.waitForTimeout(2000);
    await capturer(page, "B-page-fenetre-comment-lire");
    await page.keyboard.press("Escape");
  });
  await vue("mettre-en-page-apercu", async () => {
    await page.getByRole("tab", { name: "Aperçu" }).click();
    await apercuPret(page);
    await capturer(page, "B-apercu");
    const suivante = page.getByRole("button", { name: "Page peu remplie suivante" });
    if (await suivante.isEnabled().catch(() => false)) {
      await suivante.click();
      await page.waitForTimeout(1500);
      await capturer(page, "B-apercu-page-peu-remplie");
    }
    await page.getByRole("button", { name: /^Ouvrir n° 4 ·/ }).first().evaluate((x: HTMLButtonElement) => x.click(), undefined, { timeout: 20_000 });
    await page.getByRole("region", { name: "Ce passage dans le livre" }).waitFor({ timeout: 30_000 });
    await capturer(page, "B-apercu-ce-passage");
  });
  await vue("mettre-en-page-doute", async () => {
    // L'ordre se décide d'abord, pour qu'un texte allongé fasse naître le doute
    await aller(page, livre(b.projet, "page"));
    await page.getByRole("button", { name: "Garder cet ordre" }).first().click({ timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(2000);
    const [{ texte }] = await sql<{ texte: BlocSeme[] }>("select texte from scenes where id = $1", [b.ids.get(4)]);
    const long = recit("Lou fouilla la cabane de fond en comble : les étagères, le coffre, les filets suspendus. ".repeat(14));
    await semerBlocs(base, b.ids.get(4)!, [long, ...texte]);
    await aller(page, livre(b.projet, "page"));
    await page.locator("#moins-de-blanc").filter({ hasText: "Le livre a changé." }).waitFor({ timeout: 45_000 });
    await capturer(page, "B-page-doute-en-haut");
    await page.locator("#moins-de-blanc").scrollIntoViewIfNeeded();
    await capturer(page, "B-page-doute");
    await page.getByRole("button", { name: "Garder cet ordre" }).first().click();
    await page.waitForTimeout(2000);
  });
  await vue("mettre-en-page-convient", async () => {
    await aller(page, livre(b.projet, "page"));
    await page.getByRole("button", { name: "La mise en page me convient" }).click();
    await page.waitForTimeout(2000);
    await capturer(page, "B-page-convient");
  });

  await vue("imprimer", async () => {
    await aller(page, livre(b.projet, "sortie"));
    await capturer(page, "B-imprimer");
    await capturer(page, "B-imprimer-toute", true);
    await page.getByRole("button", { name: /^Créer le PDF définitif/ }).first().click();
    await page.waitForTimeout(1000);
    await capturer(page, "B-imprimer-rappel");
    const rappel = page.getByRole("group").filter({ has: page.getByRole("checkbox") }).first();
    if (await rappel.isVisible().catch(() => false)) {
      await rappel.getByRole("checkbox").first().check().catch(() => undefined);
    }
    const telechargement = page.waitForEvent("download", { timeout: 180_000 });
    await page.getByRole("button", { name: /^Créer le PDF définitif$/ }).click();
    await capturer(page, "B-imprimer-en-cours");
    await telechargement;
    await aller(page, livre(b.projet, "sortie"));
    await capturer(page, "B-imprimer-fait");
  });
  await vue("partager", async () => {
    await aller(page, `${livre(b.projet, "sortie")}&volet=partager`);
    await capturer(page, "B-partager");
    await capturer(page, "B-partager-toute", true);
    await page.locator("label.inter", { has: page.getByRole("switch", { name: "À mes classes" }) }).click();
    await capturer(page, "B-partager-rappel");
    await capturer(page, "B-partager-rappel-toute", true);
  });

  // ——— Téléphone ———
  await page.setViewportSize({ width: 390, height: 844 });
  await vue("390", async () => {
    await aller(page, livre(a.projet, "relire"));
    await apercuPret(page);
    await capturer(page, "390-A-relire");
    await capturer(page, "390-A-relire-toute", true);
    await aller(page, livre(a.projet, "chemins"));
    await tache(page, "Choix à relier");
    await capturer(page, "390-A-chemins");
    await aller(page, livre(b.projet, "relire"));
    await apercuPret(page);
    await tache(page, "Lire et corriger");
    await page.getByRole("button", { name: /^Ouvrir n° 1 ·/ }).first().evaluate((x: HTMLButtonElement) => x.click(), undefined, { timeout: 20_000 });
    await page.locator(".copie__texte[contenteditable]").first().waitFor({ timeout: 30_000 });
    await capturer(page, "390-B-scene-a-cote");
    await aller(page, livre(b.projet, "page"));
    await page.waitForTimeout(3000);
    await capturer(page, "390-B-page-reglages");
    await page.getByRole("tab", { name: "Aperçu" }).click();
    await apercuPret(page);
    await capturer(page, "390-B-apercu");
    await aller(page, livre(b.projet, "sortie"));
    await capturer(page, "390-B-imprimer");
    await aller(page, `${livre(b.projet, "sortie")}&volet=partager`);
    await capturer(page, "390-B-partager");
  });
});
