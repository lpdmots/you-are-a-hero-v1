import { test, type Page } from "@playwright/test";
import { adultePret, aller, choixAuto, recit, semerAttribution, semerBlocs, semerClasse, semerPartie, semerProjet, semerTexte, sql, supprimerComptes } from "../parcours/outils";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie du Suivi (vue « Scènes », vue « Élèves », page des fiches),
 * contre le serveur local, sans recompiler :
 * npx playwright test --config playwright.local.config.ts revision-suivi
 * Aucun bouton ✦ n'est cliqué : le serveur local a de vraies clés.
 */
const dossier = "test-results/captures/suivi";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};
const echap = async (page: Page) => {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
};

test.afterEach(async () => {
  await supprimerComptes();
});

test("Suivi : aide, états, filtres, élèves, fiches, personnel, vide, 390 px", async ({ page, context }) => {
  test.setTimeout(500_000);
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent", aides_masquees: ["classes", "plan", "preparation", "livre-chemins", "livre-relire"] }).eq("id", compte.id);
  const classe = await semerClasse(base, "CM1-CM2", [...ELEVES]);
  const e = classe.eleves;
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const foret = await semerPartie(base, projet, "La forêt engloutie", [
    {
      titre: "La lisière",
      scenes: [
        "Sentier — le chant dans les fougères", "Souche creuse — la lanterne de secours", "Souche — la chouette messagère",
        "Clairière — les deux chemins se rejoignent", "Pont de brume — le passeur apparaît", "Gué — l’eau qui murmure",
        "Le terrier abandonné", "", "Sous la cascade, la grotte aux lucioles qui chantent quand on s’approche trop près",
      ],
    },
    { titre: "Le marais des feux follets", scenes: Array.from({ length: 32 }, (_, i) => `Marais — passage ${i + 1}`) },
    { titre: "Les racines" },
  ]);
  const fleuve = await semerPartie(base, projet, "Le fleuve", [
    { titre: "Le dernier bac", scenes: ["L’embarcadère", "Le passeur muet", "La corde qui cède", "L’île aux saules", "Le brouillard", "L’autre rive"] },
    { titre: "Le sanctuaire", scenes: ["La porte de pierre", "Les gardiens", "La salle des échos", "Le coffre", "La sortie"] },
    { titre: "La clairière d’argent", scenes: ["Le cercle de pierres", "La source", "Le retour"] },
  ], "mer");
  const [lisiere, marais] = foret.chapitres;
  const [bac, sanctuaire, argent] = fleuve.chapitres;
  const [sentier, souche, chouette, clairiere, pont, gue, terrier, , cascade] = lisiere.scenes;

  // Attributions : Adam et Maëlys sans chapitre, le sanctuaire sans élève
  await semerAttribution(base, lisiere.id, ["Alice", "Bilal", "Chloé", "Dylan"].map((p) => ({ eleve: e[p].id })));
  const duMarais = ["Hugo", "Inès", "Jade", "Kenza", "Léo", "Lina", "Malo", "Nahel", "Océane"];
  await semerAttribution(base, marais.id, duMarais.map((p) => ({ eleve: e[p].id })));
  await semerAttribution(base, bac.id, ["Emma", "Farah", "Gabin", "Noé", "Paul"].map((p) => ({ eleve: e[p].id })));
  await semerAttribution(base, argent.id, ["Rayan", "Sacha", "Tom", "Yasmine", "Zoé"].map((p) => ({ eleve: e[p].id })));

  const consigne = "Lou se cache dans une souche creuse et allume la lanterne de secours.";
  const toutes = [...lisiere.scenes, ...marais.scenes, ...bac.scenes, ...sanctuaire.scenes, ...argent.scenes];
  // Une consigne presque partout ; quelques scènes sans
  await sql("update scenes set consigne = $2 where id = any($1)", [toutes.filter((_, i) => i % 7 !== 3), consigne]);

  // La lisière : un état de chaque sorte
  await base.from("scenes").update({ prise_par_eleve: e.Alice.id }).in("id", [sentier, clairiere]);
  await base.from("scenes").update({ prise_par_eleve: e.Bilal.id }).in("id", [souche, chouette]);
  await base.from("scenes").update({ prise_par_eleve: e.Chloé.id }).eq("id", gue);
  await base.from("scenes").update({ prise_par_enseignant: true }).eq("id", pont);
  await semerBlocs(base, sentier, [recit("Un chant montait des fougères."), choixAuto("Suivre le chant", souche), choixAuto("Prendre le pont", pont)]);
  await semerBlocs(base, souche, [recit("Lou se glissa dans la souche creuse."), choixAuto("Sortir", clairiere)]);
  await semerTexte(base, chouette, ["La chouette tenait un message dans son bec."]);
  await semerTexte(base, clairiere, ["Les deux chemins se rejoignaient."]);
  await semerTexte(base, pont, ["Sur le pont de brume, une silhouette apparut."]);
  await semerTexte(base, gue, ["L’eau murmurait des noms oubliés."]);
  await semerTexte(base, cascade, ["Derrière l’eau, une lueur."]);
  await sql("update scenes set etat = 'valider' where id = $1", [souche]);
  await sql("update scenes set etat = 'valide' where id = $1", [chouette]);
  await sql("update scenes set etat = 'reprendre' where id = $1", [clairiere]);
  await sql("update scenes set etat = 'prete' where id = $1", [gue]);
  void terrier;

  // Le marais : 32 scènes, neuf élèves, tous les états
  const m = marais.scenes;
  for (const [i, s] of m.entries()) {
    if (i < 22) await base.from("scenes").update({ prise_par_eleve: e[duMarais[i % 9]].id }).eq("id", s);
    if (i < 18) await semerTexte(base, s, ["Les feux follets dansaient sur l’eau noire."]);
  }
  await sql("update scenes set etat = 'valide' where id = any($1)", [m.slice(0, 5)]);
  await sql("update scenes set etat = 'prete' where id = any($1)", [m.slice(5, 7)]);
  await sql("update scenes set etat = 'valider' where id = any($1)", [m.slice(7, 11)]);
  await sql("update scenes set etat = 'reprendre' where id = any($1)", [m.slice(11, 13)]);

  // Le dernier bac : deux scènes prises, une à valider
  await base.from("scenes").update({ prise_par_eleve: e.Emma.id }).eq("id", bac.scenes[0]);
  await base.from("scenes").update({ prise_par_eleve: e.Farah.id }).eq("id", bac.scenes[1]);
  await semerTexte(base, bac.scenes[0], ["Le bac attendait, amarré."]);
  await semerTexte(base, bac.scenes[1], ["Le passeur ne disait rien."]);
  await sql("update scenes set etat = 'valider' where id = $1", [bac.scenes[1]]);

  // Des encouragements
  const tampons: [string, string, string][] = [
    [souche, "Bilal", "effort"], [chouette, "Bilal", "plume"], [sentier, "Alice", "creativite"], [m[0], "Hugo", "effort"], [m[9], "Hugo", "plume"],
    [m[1], "Inès", "effort"], [m[2], "Jade", "creativite"], [m[10], "Inès", "creativite"],
  ];
  for (const [scene, prenom, categorie] of tampons) {
    await sql("insert into encouragements (scene_id, projet_id, enseignant_id, eleve_id, categorie) values ($1, $2, $3, $4, $5)", [scene, projet, compte.id, e[prenom].id, categorie]);
  }

  const suivi = `/projet/${projet}/suivi`;
  await page.setViewportSize({ width: 1366, height: 768 });

  // L'écran d'aide, puis la liste
  await aller(page, suivi);
  await capturer(page, "aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "liste");
  await capturer(page, "liste-toute", true);
  await page.mouse.wheel(0, 1800);
  await capturer(page, "liste-milieu");

  // Les bulles
  await aller(page, `${suivi}?direct=1`);
  await page.getByRole("button", { name: "Que veulent dire ces états ?" }).click();
  await capturer(page, "bulle-etats");
  await echap(page);
  await page.getByRole("button", { name: /Que veut dire « Qui s’en occupe »/ }).click();
  await capturer(page, "bulle-qui");
  await echap(page);
  await page.getByRole("button", { name: "Que sont les fiches de rédaction ?" }).click();
  await capturer(page, "bulle-fiches");
  await echap(page);

  // Les filtres
  await aller(page, `${suivi}?direct=1&etat=valider`);
  await capturer(page, "a-valider");
  await aller(page, `${suivi}?direct=1&chapitre=${marais.id}`);
  await capturer(page, "chapitre-marais");
  await aller(page, `${suivi}?direct=1&chapitre=${lisiere.id}&etat=prete`);
  await page.getByRole("button", { name: /Prête/ }).first().click().catch(() => undefined);
  await aller(page, `${suivi}?direct=1&chapitre=${sanctuaire.id}&etat=valider`);
  await capturer(page, "aucun-resultat");
  await aller(page, `${suivi}?direct=1&eleve=${e.Alice.id}`);
  await capturer(page, "eleve-alice");
  await aller(page, `${suivi}?direct=1&eleve=${e.Alice.id}&mode=chapitre`);
  await capturer(page, "eleve-alice-chapitre");
  await page.getByRole("button", { name: "Quelle différence entre ces deux sélections ?" }).click();
  await capturer(page, "bulle-selections");
  await echap(page);
  await aller(page, `${suivi}?direct=1&eleve=${e.Adam.id}`);
  await capturer(page, "eleve-sans-chapitre");
  await aller(page, `${suivi}?direct=1&eleve=moi`);
  await capturer(page, "moi");
  // Un groupe replié
  await aller(page, `${suivi}?direct=1`);
  await page.locator(".suivi-groupe > summary").first().click();
  await capturer(page, "groupe-replie");
  // Les menus Chapitre et Élève
  await page.getByLabel(/^Chapitre : /).click();
  await capturer(page, "menu-chapitre");
  await echap(page);
  await page.getByLabel(/^Élève : /).click();
  await capturer(page, "menu-eleve");
  await echap(page);

  // Les scènes à finir, depuis le Livre
  await aller(page, `${suivi}?livre=finir`);
  await capturer(page, "a-finir");

  // La bascule ne bouge pas d'une vue à l'autre
  const hauteurBascule = async () => JSON.stringify(await page.locator(".suivi-outils .bascule").boundingBox());
  await aller(page, `${suivi}?direct=1`);
  const yScenes = await hauteurBascule();
  // La vue Élèves et le classement
  await aller(page, `${suivi}?direct=1&vue=eleves`);
  console.log("bascule : scènes", yScenes, "élèves", await hauteurBascule(), "i", JSON.stringify(await page.locator(".suivi-outils > .bulle").boundingBox()));
  console.log("gouttière", await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter));
  await capturer(page, "eleves");
  await capturer(page, "eleves-toute", true);
  await page.getByRole("button", { name: "Que comptent ces nombres ?" }).click();
  await capturer(page, "bulle-nombres");
  await echap(page);
  await page.getByText("Classement des encouragements").scrollIntoViewIfNeeded();
  await capturer(page, "classement");
  const suite = page.getByRole("button", { name: /Voir la suite/ });
  if (await suite.count()) {
    await suite.click();
    await capturer(page, "classement-suite");
  }

  // Les fiches, depuis le Suivi
  await aller(page, `${suivi}?direct=1`);
  await page.getByRole("link", { name: /Imprimer les fiches de rédaction/ }).click();
  await page.waitForURL(/\/fiches/);
  await capturer(page, "fiches");
  await capturer(page, "fiches-toute", true);
  await page.getByRole("button", { name: "Réglages des feuilles" }).click();
  await capturer(page, "fiches-reglages");
  await echap(page);
  await aller(page, `${suivi}?direct=1&eleve=${e.Alice.id}`);
  await page.getByRole("link", { name: /Imprimer les fiches de rédaction/ }).click();
  await page.waitForURL(/\/fiches/);
  await capturer(page, "fiches-alice");
  await aller(page, `${suivi}?direct=1&chapitre=${sanctuaire.id}`);
  await page.getByRole("link", { name: /Imprimer les fiches de rédaction/ }).click();
  await page.waitForURL(/\/fiches/);
  await capturer(page, "fiches-sans-eleve");
  await page.getByRole("button", { name: "Réglages des feuilles" }).click();
  await capturer(page, "fiches-sans-eleve-reglages");
  await echap(page);

  // Retour depuis une scène
  await aller(page, `${suivi}?direct=1&etat=valider`);
  await page.getByRole("link", { name: /^Relire/ }).first().click();
  await page.waitForURL(/\/scene\//);
  await capturer(page, "scene-depuis-suivi");

  // Place de la barre gardée partout (base.css) : aucun onglet ne défile de côté
  for (const adresse of [`/projet/${projet}/preparation`, `/projet/${projet}/plan`, `/projet/${projet}/chapitre/${marais.id}`, `/projet/${projet}/livre`, suivi]) {
    await aller(page, adresse);
    console.log("débord", adresse.split("/").slice(3).join("/"), await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  }

  // 1024 px
  await page.setViewportSize({ width: 1024, height: 768 });
  await aller(page, `${suivi}?direct=1`);
  await capturer(page, "1024");
  await aller(page, `${suivi}?direct=1&eleve=${e.Alice.id}`);
  await capturer(page, "1024-alice");
  await page.setViewportSize({ width: 1366, height: 768 });

  // Projet de classe sans scène, puis projet personnel (et son aide)
  const neuf = await semerProjet(base, compte, "classe", "choix", "Le bidibule ridicule", classe.id);
  await aller(page, `/projet/${neuf}/suivi?direct=1`);
  await capturer(page, "projet-vide");
  const seul = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
  const perso = await semerPartie(base, seul, "Le départ", [
    { titre: "La gare", scenes: ["Le quai", "Le train", "La valise", "Le contrôleur", "La correspondance", "Le wagon-lit"] },
    { titre: "La frontière", scenes: ["Le douanier", "Le passeport", "La nuit", "L’aube", "Le marché", "La lettre"] },
  ], "cite");
  const ps = perso.chapitres.flatMap((c) => c.scenes);
  for (const s of ps.slice(0, 9)) await semerTexte(base, s, ["Le train entra en gare."]);
  await sql("update scenes set etat = 'prete' where id = any($1)", [ps.slice(0, 2)]);
  await context.clearCookies({ name: "aide-suivi" });
  await aller(page, `/projet/${seul}/suivi`);
  await capturer(page, "personnel-aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "personnel");

  // Téléphone
  await page.setViewportSize({ width: 390, height: 844 });
  await context.clearCookies({ name: "aide-suivi" });
  await aller(page, suivi);
  await capturer(page, "390-aide");
  await page.getByRole("button", { name: "Commencer" }).click();
  await capturer(page, "390-liste");
  await capturer(page, "390-liste-toute", true);
  await aller(page, `${suivi}?direct=1&etat=valider`);
  await capturer(page, "390-a-valider");
  await aller(page, `${suivi}?direct=1&eleve=${e.Alice.id}`);
  await capturer(page, "390-alice");
  await page.getByLabel(/^Élève : /).click();
  await capturer(page, "390-menu-eleve");
  await echap(page);
  const basculeScenes = await (async () => { await aller(page, `${suivi}?direct=1`); return JSON.stringify(await page.locator(".suivi-outils .bascule").boundingBox()); })();
  await aller(page, `${suivi}?direct=1&vue=eleves`);
  console.log("390 bascule : scènes", basculeScenes, "élèves", JSON.stringify(await page.locator(".suivi-outils .bascule").boundingBox()));
  await capturer(page, "390-eleves");
  await capturer(page, "390-eleves-toute", true);
  await aller(page, `${suivi}?direct=1`);
  await page.getByRole("link", { name: /Imprimer les fiches de rédaction/ }).click();
  await page.waitForURL(/\/fiches/);
  await capturer(page, "390-fiches");
  await capturer(page, "390-fiches-toute", true);
});
