import { test, type Browser, type Page } from "@playwright/test";
import {
  action, aller, autrePoste, choixAuto, connecter, creerClasse, creerCompte, baseDe, ecrire, elevesDe, inscrire, lireCodes, masquerAides, nommer, ouvrirLaClasse,
  protege, recit, semerAttribution, semerBlocs, semerPartie, semerProjet, semerTexte, sql, supprimerComptes, taperCode,
} from "../parcours/outils";
import { ELEVES } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie du côté élève (novembre 2026), contre le serveur local,
 * sans recompiler : npx playwright test --config playwright.local.config.ts revision-eleve
 * Un essai par page (`-g copie`, `-g travail`…). Aucun bouton ✦ n'est cliqué. Ce n'est pas un
 * test : rien n'y est vérifié.
 */
let dossier = "test-results/captures/eleve";
let n = 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};

test.afterEach(async () => {
  await supprimerComptes();
});

const CONSIGNE = "Lou suit le sentier jusqu’à la souche. Un chant monte des fougères : raconte ce qu’il entend et ce qu’il ressent.";

/** Ce que fera « Remettre » : le texte est conservé, la scène passe « À valider », le soumetteur s'en occupe. */
const remettre = (scene: string, eleve: string, ilYA = "0 minutes") =>
  sql(
    `with s as (
       update scenes set etat = 'valider', tour = tour + 1, prise_par_eleve = $2 where id = $1
       returning id, projet_id, enseignant_id, texte)
     insert into remises (scene_id, projet_id, enseignant_id, eleve_id, texte, remis_le)
     select id, projet_id, enseignant_id, $2, texte, now() - $3::interval from s`,
    [scene, eleve, ilYA],
  );

/** Mme Laurent, sa classe de vingt-cinq élèves et « Les passeurs de brume ». */
async function laClasse(page: Page) {
  const compte = await creerCompte();
  const base = await baseDe(compte);
  await masquerAides(base, compte);
  await connecter(page, compte);
  await page.waitForURL(/\/projets$/);
  await nommer(page, compte, "Mme Laurent");
  const classe = await creerClasse(page, "CM1-CM2");
  await inscrire(page, classe.id, [...ELEVES]);
  const codes = await lireCodes(page, classe.id);
  const e = await elevesDe(base, classe.id);
  const projet = await semerProjet(base, compte, "classe", "choix", "Les passeurs de brume", classe.id);
  const foret = await semerPartie(base, projet, "La forêt engloutie", [
    {
      titre: "La lisière",
      scenes: [
        "Le sentier", "La souche creuse", "Le pont de brume", "La clairière", "Le gué", "La chouette messagère", "Le terrier abandonné",
        "Sous la cascade, la grotte aux lucioles qui chantent", "Le bord du lac", "Les lucioles",
      ],
    },
    { titre: "Le marais des feux follets", scenes: ["Le marais", "Les feux follets"] },
  ]);
  const [lisiere, marais] = foret.chapitres;
  await semerAttribution(base, lisiere.id, ["Alice", "Bilal", "Chloé", "Dylan"].map((p) => ({ eleve: e[p].id })));
  await semerAttribution(base, marais.id, ["Hugo", "Inès", "Jade"].map((p) => ({ eleve: e[p].id })));
  return { compte, base, classe, codes, e, projet, lisiere, marais };
}
type Classe = Awaited<ReturnType<typeof laClasse>>;

/** Un poste de la salle où un élève s'est identifié. */
async function poste(browser: Browser, c: Classe, prenom: string) {
  const p = await autrePoste(browser);
  await ouvrirLaClasse(p.page, c.classe.identifiant, c.classe.motDePasse);
  await taperCode(p.page, prenom, c.codes[prenom]);
  await p.page.waitForURL(/\/travail$/);
  return p;
}

const etat = async (c: Classe, scene: string, voulu: string, remarque: string | null = null) => {
  const [vu] = await sql<{ version: number; tour: number }>("select version, tour from scenes where id = $1", [scene]);
  await c.base.rpc("changer_etat", { p_scene: scene, p_etat: voulu, p_version: vu.version, p_tour: vu.tour, p_remarque: remarque });
};

test("copie : écrire, consigne et liste, remettre, remarque, camarade, validé, échec, conflit, 390 px", async ({ page, browser }) => {
  test.setTimeout(600_000);
  n = 0;
  const c = await laClasse(page);
  const { e, base } = c;
  const [sentier, souche, pont, clairiere, gue, chouette, terrier, cascade, lac, lucioles] = c.lisiere.scenes;

  await sql("update scenes set consigne = $2 where id = any($1)", [[sentier, souche, pont, clairiere, gue, terrier, cascade, lac, lucioles], CONSIGNE]);
  await sql("update scenes set verification = $2 where id = any($1)", [[sentier, terrier], ["Dire d’où vient le chant.", "Montrer ce que ressent Lou."]]);
  await base.from("scenes").update({ prise_par_eleve: e.Bilal.id }).in("id", [sentier, souche, clairiere, chouette, terrier, cascade, lac]);
  await base.from("scenes").update({ prise_par_eleve: e.Alice.id }).eq("id", pont);
  await base.from("scenes").update({ prise_par_enseignant: true }).eq("id", gue);

  // Une scène longue : récit, paragraphe protégé, action de jeu, deux choix
  const long = [
    "Lou se glissa dans la souche creuse. L’odeur de mousse et de bois mouillé lui remplit le nez, et il dut se faire tout petit pour passer sous les racines.",
    "Au fond, une lanterne de secours attendait, posée sur une pierre plate. Quelqu’un l’avait laissée là exprès, pensa-t-il, pour les voyageurs perdus dans la brume.",
    "Il frotta l’allumette. La flamme hésita, puis grandit d’un coup, et des dizaines de petits yeux brillèrent dans le noir.",
    "C’étaient des loirs, serrés les uns contre les autres. Ils ne bougeaient pas. Lou retint son souffle.",
    "Dehors, le chant des fougères reprit, plus fort, comme s’il l’appelait.",
  ];
  await semerBlocs(base, souche, [
    protege("La brume tombait sur la forêt comme un drap mouillé."),
    ...long.map((t) => recit(t)),
    action("Note la lanterne dans ta feuille d’aventure."),
    choixAuto("Sortir et suivre le chant", chouette),
    choixAuto("Rester caché avec les loirs", pont),
  ]);
  await semerTexte(base, pont, ["Le pont de bois craquait sous les pas de Lou.", "Au milieu, une silhouette l’attendait, immobile dans la brume."]);
  await semerTexte(base, clairiere, ["Les deux chemins se rejoignaient dans la clairière.", "Une lumière d’argent tombait entre les arbres."]);
  await etat(c, clairiere, "valider");
  await etat(c, clairiere, "valide");
  for (const [categorie] of [["effort"], ["plume"]]) {
    await sql("insert into encouragements (scene_id, projet_id, enseignant_id, eleve_id, categorie) values ($1, $2, $3, $4, $5)", [clairiere, c.projet, c.compte.id, e.Bilal.id, categorie]);
  }
  await semerTexte(base, lac, ["Le lac était si calme qu’on y voyait la lune deux fois."]);
  await etat(c, lac, "valider");
  await etat(c, lac, "valide");
  await etat(c, lac, "prete");
  await semerTexte(base, gue, ["L’eau murmurait des noms oubliés."]);
  await semerTexte(base, chouette, ["La chouette tenait un message dans son bec."]);
  await semerTexte(base, cascade, ["Derrière l’eau, une lueur bleue."]);
  // À reprendre, avec une remarque, une coche sur deux
  await semerTexte(base, terrier, ["Lou entra dans le terrier. Il faisait noir. Il avait peur."]);
  await remettre(terrier, e.Bilal.id, "2 days");
  await sql("update scenes set verification_cochee = $2 where id = $1", [terrier, ["Dire d’où vient le chant."]]);
  await etat(c, terrier, "reprendre", "Ton début est bien. Dis ce que Lou entend dans le noir, et ce qu’il touche avec ses mains.");
  // Remis par une camarade
  await base.from("scenes").update({ prise_par_eleve: e.Chloé.id }).eq("id", lucioles);
  await semerTexte(base, lucioles, ["Les lucioles chantaient tout bas."]);
  await remettre(lucioles, e.Chloé.id, "1 day");

  const bilal = await poste(browser, c, "Bilal");
  const p = bilal.page;
  const scene = (id: string) => aller(p, `/travail/scene/${id}`);

  // Texte vide, consigne et « J'ai pensé à »
  await scene(sentier);
  await capturer(p, "vide-consigne-liste");
  await ecrire(p, "Lou suivit le sentier. Un chant montait des fougères, si doux qu’il s’arrêta pour l’écouter.");
  await capturer(p, "en-train-d-ecrire");
  await p.waitForTimeout(2_600);
  await capturer(p, "ecrit-enregistre");
  await p.getByRole("button", { name: "Remettre à Mme Laurent" }).click();
  await capturer(p, "rappel-liste");
  await p.getByRole("checkbox").first().check();
  await capturer(p, "liste-une-coche");
  await p.getByRole("button", { name: /^Remettre/ }).click();
  await p.getByRole("button", { name: "Remettre quand même" }).click().catch(() => {});
  await p.getByRole("status").filter({ hasText: "C’est remis !" }).waitFor();
  await capturer(p, "remis");

  // Scène longue : en haut, puis le pied en bas
  await scene(souche);
  await capturer(p, "longue-haut");
  await p.mouse.wheel(0, 700);
  await capturer(p, "longue-bas");
  await p.locator(".copie__texte").getByText("Sortir et suivre le chant").click().catch(() => {});
  await capturer(p, "longue-choix-clique");
  await p.keyboard.press("Escape");

  // À reprendre : la remarque seule, puis à côté du texte
  await scene(terrier);
  await capturer(p, "remarque-seule");
  await p.getByRole("button", { name: "J’ai lu, j’écris" }).click();
  await capturer(p, "a-reprendre");
  await p.getByRole("button", { name: /^Voir mon texte du/ }).click().catch(() => {});
  await capturer(p, "a-reprendre-texte-remis");
  await p.getByLabel("Tu t’en occupes. Changer").click();
  await capturer(p, "menu-je-ne-m-en-occupe-plus");
  await p.keyboard.press("Escape");

  // Une camarade, l'enseignante, une camarade qui a remis
  await scene(pont);
  await capturer(p, "scene-d-une-camarade");
  await p.getByRole("button", { name: "M’occuper de cette scène" }).click();
  await p.getByRole("status").filter({ hasText: "Tu t’occupes maintenant" }).waitFor();
  await capturer(p, "scene-prise");
  await p.getByRole("status").filter({ hasText: "Tu t’occupes maintenant" }).getByRole("button", { name: "Annuler" }).click();
  await scene(gue);
  await capturer(p, "scene-de-l-enseignante");
  await scene(lucioles);
  await capturer(p, "remise-par-une-camarade");

  // Validé, avec encouragements ; prête
  await scene(clairiere);
  await capturer(p, "valide-encouragements");
  await scene(lac);
  await capturer(p, "prete");

  // Sans consigne ; échec simple, puis remise en échec, puis retour
  await scene(chouette);
  await capturer(p, "sans-consigne");
  await bilal.contexte.setOffline(true);
  await ecrire(p, " Elle le posa sur la main de Lou.");
  await p.locator(".copie__pied .pied-alerte").waitFor({ timeout: 20_000 }).catch(() => {});
  await capturer(p, "echec-simple");
  await p.getByRole("button", { name: "Remettre à Mme Laurent" }).click().catch(() => {});
  await p.waitForTimeout(3_000);
  await capturer(p, "echec-remise");
  await bilal.contexte.setOffline(false);
  await p.getByText("Ça y est, ton texte est enregistré.").waitFor({ timeout: 20_000 }).catch(() => {});
  await capturer(p, "echec-puis-enregistre");

  // Conflit : le texte change ailleurs pendant une coupure
  await scene(cascade);
  await bilal.contexte.setOffline(true);
  await ecrire(p, " Lou s’approcha.");
  await p.waitForTimeout(4_000);
  await semerTexte(base, cascade, ["Derrière l’eau, une lueur bleue, corrigée par Mme Laurent."]);
  await bilal.contexte.setOffline(false);
  await p.getByText("Quelqu’un d’autre a écrit").waitFor({ timeout: 20_000 }).catch(() => {});
  await capturer(p, "conflit");
  await p.reload();
  await capturer(p, "conflit-arrete");

  // 390 px
  await p.setViewportSize({ width: 390, height: 844 });
  await scene(souche);
  await capturer(p, "390-longue-haut");
  await p.mouse.wheel(0, 900);
  await capturer(p, "390-longue-bas");
  await scene(terrier);
  await capturer(p, "390-a-reprendre");
  await scene(pont);
  await capturer(p, "390-scene-d-une-camarade");
  await scene(clairiere);
  await capturer(p, "390-valide");
  await scene(sentier);
  await capturer(p, "390-remis");
  await bilal.contexte.close();
});

test("classe : ouvrir la classe, refus, qui utilise cet ordinateur, code, quitter, classe vide, hors horaires, 390 px", async ({ page, browser }) => {
  test.setTimeout(600_000);
  n = 0;
  dossier = "test-results/captures/eleve/classe";
  const c = await laClasse(page);
  const vide = await creerClasse(page, "CE2");

  const { contexte, page: p } = await autrePoste(browser);
  const remplir = async (identifiant: string, motDePasse: string) => {
    await p.getByLabel("Identifiant de la classe").fill(identifiant);
    await p.getByLabel("Mot de passe de la classe").fill(motDePasse);
  };

  // Ouvrir la classe sur cet ordinateur
  await aller(p, "/classe");
  await capturer(p, "classe");
  await remplir(c.classe.identifiant, c.classe.motDePasse);
  await capturer(p, "classe-rempli");
  await remplir(c.classe.identifiant, "mauvais");
  await p.getByRole("button", { name: "Entrer", exact: true }).click();
  await p.getByRole("alert").waitFor();
  await capturer(p, "classe-refus");

  // La classe sans élève
  await remplir(vide.identifiant, vide.motDePasse);
  await p.getByRole("button", { name: "Entrer", exact: true }).click();
  await p.waitForURL(/\/classe\/qui$/);
  await capturer(p, "qui-classe-sans-eleve");
  await p.getByRole("button", { name: "Quitter la classe sur cet ordinateur" }).click();
  await p.getByRole("alertdialog").getByRole("button", { name: "Quitter", exact: true }).click();
  await p.waitForURL(/\/classe$/);

  // Qui utilise cet ordinateur ?
  await ouvrirLaClasse(p, c.classe.identifiant, c.classe.motDePasse);
  await p.waitForURL(/\/classe\/qui$/);
  await capturer(p, "qui");
  await p.getByRole("button", { name: "Bilal", exact: true }).click();
  await capturer(p, "qui-choisi");
  await p.getByLabel("Chiffre 1").pressSequentially("0000");
  await p.getByRole("alert").waitFor();
  await capturer(p, "qui-code-faux");
  await p.getByRole("button", { name: "Quitter la classe sur cet ordinateur" }).click();
  await capturer(p, "qui-quitter");
  await p.getByRole("button", { name: "Rester" }).click();

  // Trop d'essais (Emma)
  await p.getByRole("button", { name: "Emma", exact: true }).click();
  for (let i = 0; i < 15; i++) {
    await p.getByLabel("Chiffre 1").pressSequentially(String(1000 + i).padStart(4, "0") === c.codes.Emma ? "9999" : String(1000 + i));
    await p.waitForTimeout(700);
    if (await p.getByText("Trop d’essais").count()) break;
  }
  await capturer(p, "qui-attente");

  // Tablette : une seule colonne, le code en tête
  await p.setViewportSize({ width: 1024, height: 768 });
  await p.getByRole("button", { name: "Bilal", exact: true }).click();
  await capturer(p, "1024-qui-choisi");
  await p.setViewportSize({ width: 1366, height: 768 });

  // Hors des horaires : Bilal entre, le travail est fermé
  const hier = ((new Date().getDay() + 5) % 7) + 1;
  await sql("insert into horaires (classe_id, enseignant_id, jours, de, a) select id, enseignant_id, array[$2::smallint], '08:30', '11:30' from classes where id = $1", [c.classe.id, hier]);
  await sql("update classes set horaires_limites = true where id = $1", [c.classe.id]);
  await p.getByLabel("Chiffre 1").pressSequentially(c.codes.Bilal);
  await p.waitForURL(/\/travail$/);
  await capturer(p, "travail-ferme");
  await p.setViewportSize({ width: 390, height: 844 });
  await capturer(p, "390-travail-ferme");
  await sql("update classes set horaires_limites = false where id = $1", [c.classe.id]);
  await p.getByRole("button", { name: "Changer d’élève" }).click();
  await p.waitForURL(/\/classe\/qui$/);

  // 390 px
  await capturer(p, "390-qui");
  await capturer(p, "390-qui-toute", true);
  await p.getByRole("button", { name: "Chloé", exact: true }).click();
  await capturer(p, "390-qui-choisi");
  await p.getByLabel("Chiffre 1").pressSequentially("0000");
  await p.getByRole("alert").waitFor();
  await capturer(p, "390-qui-code-faux");
  await p.getByRole("button", { name: "Quitter la classe sur cet ordinateur" }).click();
  await capturer(p, "390-qui-quitter");
  await p.getByRole("alertdialog").getByRole("button", { name: "Quitter", exact: true }).click();
  await p.waitForURL(/\/classe$/);
  await capturer(p, "390-classe");
  await capturer(p, "390-classe-toute", true);
  await remplir(c.classe.identifiant, "mauvais");
  await p.getByRole("button", { name: "Entrer", exact: true }).click();
  await p.getByRole("alert").waitFor();
  await capturer(p, "390-classe-refus");
  await contexte.close();
});

test("travail : mes scènes par urgence, encouragements, classement, toute l'histoire, sans chapitre, rien de pris, 390 px", async ({ page, browser }) => {
  test.setTimeout(600_000);
  n = 0;
  dossier = "test-results/captures/eleve/travail";
  const c = await laClasse(page);
  const { e, base } = c;
  const [sentier, souche, pont, clairiere, gue, chouette, terrier, cascade, lac] = c.lisiere.scenes;
  await sql("update scenes set consigne = $2 where id = any($1)", [c.lisiere.scenes, CONSIGNE]);
  await base.from("scenes").update({ prise_par_eleve: e.Bilal.id }).in("id", [sentier, souche, clairiere, terrier, cascade, lac]);
  await base.from("scenes").update({ prise_par_eleve: e.Alice.id }).in("id", [pont, chouette]);
  await semerTexte(base, souche, ["Lou se glissa dans la souche creuse."]);
  await semerTexte(base, clairiere, ["Les deux chemins se rejoignaient dans la clairière."]);
  await etat(c, clairiere, "valider");
  await etat(c, clairiere, "valide");
  await semerTexte(base, lac, ["Le lac était si calme qu’on y voyait la lune deux fois."]);
  await etat(c, lac, "valider");
  await etat(c, lac, "valide");
  await etat(c, lac, "prete");
  await semerTexte(base, cascade, ["Derrière l’eau, une lueur bleue."]);
  await remettre(cascade, e.Bilal.id, "1 day");
  await semerTexte(base, terrier, ["Lou entra dans le terrier. Il faisait noir."]);
  await remettre(terrier, e.Bilal.id, "2 days");
  await etat(c, terrier, "reprendre", "Dis ce que Lou entend dans le noir.");
  await semerTexte(base, pont, ["Le pont craquait."]);
  await etat(c, pont, "valider");
  await etat(c, pont, "valide");
  await semerTexte(base, chouette, ["La chouette tenait un message."]);
  await etat(c, chouette, "valider");
  await etat(c, chouette, "valide");
  const tampon = (scene: string, eleve: string, categorie: string) =>
    sql("insert into encouragements (scene_id, projet_id, enseignant_id, eleve_id, categorie) values ($1, $2, $3, $4, $5)", [scene, c.projet, c.compte.id, eleve, categorie]);
  await tampon(clairiere, e.Bilal.id, "effort");
  await tampon(clairiere, e.Bilal.id, "plume");
  await tampon(lac, e.Bilal.id, "creativite");
  await tampon(chouette, e.Alice.id, "effort");
  await tampon(chouette, e.Alice.id, "creativite");
  await tampon(pont, e.Alice.id, "plume");

  const bilal = await poste(browser, c, "Bilal");
  const p = bilal.page;
  await capturer(p, "bilal");
  await capturer(p, "bilal-toute", true);
  await p.mouse.wheel(0, 700);
  await capturer(p, "bilal-bas");
  // Un chapitre qui n'est pas le sien
  await p.getByRole("button", { name: /ce chapitre n’est pas le tien/ }).first().click();
  await capturer(p, "chapitre-ferme");
  await p.getByRole("button", { name: "Fermer" }).click();
  // Rechercher
  await p.getByPlaceholder("Rechercher une scène").fill("lune");
  await p.waitForTimeout(900);
  await capturer(p, "recherche");
  await p.getByPlaceholder("Rechercher une scène").fill("");
  // Texte gardé à part
  await aller(p, "/travail?texte=garde");
  await capturer(p, "texte-garde");

  // Le classement montré
  await sql("update projets set classement_montre = true where id = $1", [c.projet]);
  await aller(p, "/travail");
  await p.getByRole("heading", { name: /encouragements/ }).scrollIntoViewIfNeeded();
  await capturer(p, "classement");
  await capturer(p, "classement-toute", true);

  // 390 px
  await p.setViewportSize({ width: 390, height: 844 });
  await aller(p, "/travail");
  await capturer(p, "390-bilal");
  await capturer(p, "390-bilal-toute", true);
  await bilal.contexte.close();

  // Dylan : un chapitre, rien de pris
  const dylan = await poste(browser, c, "Dylan");
  await capturer(dylan.page, "dylan-rien-de-pris");
  await capturer(dylan.page, "dylan-rien-de-pris-toute", true);
  await dylan.contexte.close();

  // Emma : sans chapitre
  const emma = await poste(browser, c, "Emma");
  await capturer(emma.page, "emma-sans-chapitre");
  await emma.page.setViewportSize({ width: 390, height: 844 });
  await capturer(emma.page, "390-emma-sans-chapitre", true);
  await emma.contexte.close();

  // Alice : tout est validé, le classement en tête
  const alice = await poste(browser, c, "Alice");
  await capturer(alice.page, "alice-tout-valide", true);
  await alice.contexte.close();
});

test("chapitre : Chemins d'abord, Scènes, prendre une scène, celle d'un camarade, un chapitre lu, l'organisation, vide, 390 px", async ({ page, browser }) => {
  test.setTimeout(600_000);
  n = 0;
  dossier = "test-results/captures/eleve/chapitre";
  const c = await laClasse(page);
  const { e, base } = c;
  const [sentier, souche, pont, clairiere, gue, chouette, terrier, cascade, lac, lucioles] = c.lisiere.scenes;
  await sql("update scenes set consigne = $2 where id = any($1)", [c.lisiere.scenes, CONSIGNE]);
  // Les chemins du chapitre
  await semerBlocs(base, sentier, [recit("Le sentier se sépare en deux devant Lou."), choixAuto("Entrer dans la souche creuse", souche), choixAuto("Traverser le pont de brume", pont)]);
  await semerBlocs(base, souche, [recit("Lou se glissa dans la souche creuse."), choixAuto("Suivre le chant", clairiere), choixAuto("Rester caché", terrier)]);
  await semerBlocs(base, pont, [recit("Le pont craquait sous ses pas."), choixAuto("Continuer jusqu’à la clairière", clairiere), choixAuto("Descendre vers le gué", gue)]);
  await semerBlocs(base, clairiere, [recit("Une lumière d’argent tombait entre les arbres."), choixAuto("Appeler la chouette", chouette), choixAuto("Suivre les lucioles", lucioles)]);
  await semerBlocs(base, gue, [recit("L’eau murmurait des noms oubliés."), choixAuto("Remonter vers le sentier", sentier), choixAuto("Longer la rivière", cascade)]);
  await semerBlocs(base, chouette, [recit("La chouette tenait un message dans son bec."), choixAuto("Lire le message", lac)]);
  await semerBlocs(base, cascade, [recit("Derrière l’eau, une lueur bleue."), choixAuto("Entrer dans la grotte", null)]);
  await base.from("scenes").update({ prise_par_eleve: e.Bilal.id }).in("id", [souche, clairiere, cascade]);
  await base.from("scenes").update({ prise_par_eleve: e.Alice.id }).in("id", [pont, chouette]);
  await base.from("scenes").update({ prise_par_eleve: e.Chloé.id }).eq("id", gue);
  await base.from("scenes").update({ prise_par_enseignant: true }).eq("id", sentier);
  await etat(c, clairiere, "valider");
  await etat(c, clairiere, "valide");
  await remettre(chouette, e.Alice.id, "1 day");

  const bilal = await poste(browser, c, "Bilal");
  const p = bilal.page;
  await aller(p, `/travail/chapitre/${c.lisiere.id}`);
  await p.waitForTimeout(1500);
  await capturer(p, "chemins");
  await p.getByRole("button", { name: /Comment lire|aide|Aide/ }).first().click({ timeout: 5000 }).catch(() => {});
  await capturer(p, "chemins-aide");
  await p.keyboard.press("Escape");
  await p.getByText("Le pont de brume").first().click({ timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(600);
  await capturer(p, "chemins-clic");

  // Scènes
  await p.getByRole("button", { name: "Scènes", exact: true }).click();
  await p.waitForURL(/vue=scenes/);
  await capturer(p, "scenes");
  await capturer(p, "scenes-toute", true);
  await p.getByLabel("Choisir S009 pour m’en occuper").check();
  await capturer(p, "selection");
  await p.getByLabel("Choisir S005 pour m’en occuper").check();
  await capturer(p, "selection-camarade");
  await p.getByRole("button", { name: "Seulement les libres" }).click();
  await p.waitForTimeout(800);
  await capturer(p, "pris");

  // Un chapitre qui n'est pas le sien, la lecture ouverte
  await sql("update projets set lecture_ouverte = true where id = $1", [c.projet]);
  await semerTexte(base, c.marais.scenes[0], ["Les roseaux bruissaient."]);
  await aller(p, `/travail/chapitre/${c.marais.id}`);
  await capturer(p, "chapitre-lu");

  // 390 px
  await p.setViewportSize({ width: 390, height: 844 });
  await aller(p, `/travail/chapitre/${c.lisiere.id}`);
  await p.waitForTimeout(1200);
  await capturer(p, "390-chemins");
  await capturer(p, "390-chemins-toute", true);
  await aller(p, `/travail/chapitre/${c.lisiere.id}?vue=scenes`);
  await capturer(p, "390-scenes");
  await p.getByLabel("Choisir S007 pour m’en occuper").check({ timeout: 5000 }).catch(() => {});
  await capturer(p, "390-selection");
  await bilal.contexte.close();

  // Dylan organise le chapitre ; puis un chapitre vide
  await semerAttribution(base, c.lisiere.id, [{ eleve: e.Alice.id }, { eleve: e.Bilal.id }, { eleve: e.Chloé.id }, { eleve: e.Dylan.id, profil: "organisation" }]);
  const vide = await semerPartie(base, c.projet, "La montagne", [{ titre: "Le col", scenes: [] }]);
  await semerAttribution(base, vide.chapitres[0].id, [{ eleve: e.Dylan.id, profil: "organisation" }]);
  const dylan = await poste(browser, c, "Dylan");
  await aller(dylan.page, `/travail/chapitre/${c.lisiere.id}?vue=scenes`);
  await capturer(dylan.page, "organisation");
  await aller(dylan.page, `/travail/chapitre/${vide.chapitres[0].id}`);
  await capturer(dylan.page, "vide-organisation");
  await dylan.page.getByRole("button", { name: "Ajouter une scène" }).click();
  await dylan.page.waitForTimeout(900);
  await capturer(dylan.page, "vide-ajoutee");
  await dylan.page.getByLabel(/Autres commandes de la scène/).first().click({ timeout: 10_000 });
  await dylan.page.getByRole("button", { name: "Supprimer" }).click({ timeout: 10_000 });
  await capturer(dylan.page, "supprimer");
  await dylan.contexte.close();
});

test("lire : la page « Lire », le départ de la lecture à l'essai, sans chapitre, hors horaires, année finie, 390 px", async ({ page, browser }) => {
  test.setTimeout(600_000);
  n = 0;
  dossier = "test-results/captures/eleve/lire-page";
  const c = await laClasse(page);
  const { e, base } = c;
  const [sentier, souche, pont] = c.lisiere.scenes;
  await semerBlocs(base, sentier, [recit("Le sentier se sépare en deux devant Lou."), choixAuto("Entrer dans la souche creuse", souche), choixAuto("Traverser le pont de brume", pont)]);
  await semerBlocs(base, souche, [recit("Lou se glissa dans la souche creuse.")]);
  await semerBlocs(base, pont, [recit("Le pont craquait sous ses pas.")]);
  await semerBlocs(base, c.marais.scenes[0], [recit("Les roseaux bruissaient.")]);
  await base.from("projets").update({ depart_scene_id: sentier }).eq("id", c.projet);

  const bilal = await poste(browser, c, "Bilal");
  const p = bilal.page;
  await aller(p, "/travail/lecture");
  await capturer(p, "lire");
  await p.getByRole("link", { name: "Lire à l’essai" }).click();
  await p.waitForURL(/\/travail\/lecture\//);
  await capturer(p, "depart");
  await p.getByPlaceholder("Chercher une scène à lire").fill("pont", { timeout: 5000 }).catch(() => {});
  await p.waitForTimeout(900);
  await capturer(p, "depart-recherche");
  await sql("update projets set lecture_ouverte = true where id = $1", [c.projet]);
  await p.reload();
  await capturer(p, "depart-lecture-ouverte");
  await capturer(p, "depart-lecture-ouverte-toute", true);
  await p.setViewportSize({ width: 390, height: 844 });
  await capturer(p, "390-depart", true);
  await aller(p, "/travail/lecture");
  await capturer(p, "390-lire", true);
  await p.setViewportSize({ width: 1366, height: 768 });

  // Hors des horaires
  const hier = ((new Date().getDay() + 5) % 7) + 1;
  await sql("insert into horaires (classe_id, enseignant_id, jours, de, a) select id, enseignant_id, array[$2::smallint], '08:30', '11:30' from classes where id = $1", [c.classe.id, hier]);
  await sql("update classes set horaires_limites = true where id = $1", [c.classe.id]);
  await p.reload();
  await capturer(p, "lire-ferme");
  await sql("update classes set horaires_limites = false where id = $1", [c.classe.id]);
  await bilal.contexte.close();

  // Emma, sans chapitre
  const emma = await poste(browser, c, "Emma");
  await aller(emma.page, "/travail/lecture");
  await capturer(emma.page, "lire-sans-chapitre");
  await emma.contexte.close();

  // L'année finie
  await sql("update classes set terminee_le = now() where id = $1", [c.classe.id]);
  const alice = await autrePoste(browser);
  await ouvrirLaClasse(alice.page, c.classe.identifiant, c.classe.motDePasse);
  await taperCode(alice.page, "Alice", c.codes.Alice);
  await alice.page.waitForURL(/\/travail/, { timeout: 15_000 });
  await aller(alice.page, "/travail/lecture");
  await capturer(alice.page, "lire-annee-finie");
  await alice.contexte.close();
  void e;
});
