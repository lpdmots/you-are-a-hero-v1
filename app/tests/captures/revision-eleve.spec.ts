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
const dossier = "test-results/captures/eleve";
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
