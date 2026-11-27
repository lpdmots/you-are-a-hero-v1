import { expect, test, type Locator, type Page } from "@playwright/test";
import { ATTENDU, poserLeMarais, type Requete } from "../../scripts/marais-des-feux-follets";
import { adultePret, aller, choixAuto, classeQuiEcrit, liaison, liensEnBase, MESSAGE, posteDe, recit, sceneEnBase, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes, typesEnBase } from "./outils";

/**
 * La vue « Chemins » d'un chapitre (F03.1, « Vue Chemins à reprendre », puis « Chemins en atelier » et
 * « Choix en onglets », 11 novembre 2026) : un schéma de haut en bas sur un écran large, dans un cadre
 * qu'on tire — la page ne défile plus —, les choix en onglets sous leur carte, la liste des scènes sur
 * téléphone. « Chemins » s'ouvre en premier (F03-AC61). Le chapitre d'essai est « Le marais des feux
 * follets » (scripts/marais-des-feux-follets.ts) : trente-deux scènes, quarante-neuf choix.
 */

test.afterEach(async () => {
  await supprimerComptes();
});

type Livre = { base: Awaited<ReturnType<typeof adultePret>>["base"]; compte: string; projet: string; partie: string; lisiere: { id: string; scenes: string[] }; marais: { id: string; scenes: string[] } };

/** Un auteur seul et son récit : « La lisière » (S001 Le sentier, S002 Clairière, S003 La souche, S004 Le pont) et « Le marais » (S005 Le ponton). */
async function auteur(page: Page): Promise<Livre> {
  const { compte, base } = await adultePret(page);
  const projet = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
  const { partieId, chapitres } = await semerPartie(base, projet, "La forêt", [
    { titre: "La lisière", scenes: ["Le sentier", "Clairière", "La souche", "Le pont"] },
    { titre: "Le marais", scenes: ["Le ponton"] },
  ]);
  return { base, compte: compte.id, projet, partie: partieId, lisiere: chapitres[0], marais: chapitres[1] };
}

/** Le même livre, avec « Le marais des feux follets » : on y arrive depuis S001, on en sort vers S005 et S004. */
async function avecLeMarais(page: Page): Promise<Livre & { feuxFollets: string }> {
  const l = await auteur(page);
  await l.base.from("projets").update({ depart_scene_id: l.lisiere.scenes[0] }).eq("id", l.projet);
  const pose = await poserLeMarais(sql as Requete, {
    projetId: l.projet, partieId: l.partie, enseignantId: l.compte, ailleurs: { moulin: l.marais.scenes[0], sanctuaire: l.lisiere.scenes[3] }, entreeDepuis: l.lisiere.scenes[0],
  });
  return { ...l, feuxFollets: pose.chapitreId };
}

const vueChemins = (l: Livre, chapitre: string) => `/projet/${l.projet}/chapitre/${chapitre}?vue=chemins`;
const CARTES = (page: Page): Locator => page.locator(".carte-chemin");
const carte = (page: Page, titre: string): Locator => CARTES(page).filter({ has: page.locator(".carte-chemin__titre", { hasText: titre }) });
/** Les onglets des choix, sous leur carte (F03-AC62) : la phrase du choix, et ce que l'outil en dit quand aucun trait n'en part. */
const ONGLETS = (page: Page): Locator => page.locator(".onglet-chemin");
const onglet = (page: Page, phrase: string): Locator => ONGLETS(page).filter({ has: page.locator(".onglet-chemin__phrase", { hasText: phrase }) });
const phrases = async (page: Page): Promise<string[]> => (await page.locator(".onglet-chemin__phrase").allInnerTexts()).map((t) => t.trim()).sort();
const TRAITS = (page: Page): Locator => page.locator(".chemins .react-flow__edge-path");
const REGARDER = (page: Page): Locator => page.locator(".chemins__regarder");
/** Les traits du marais au repos : ses choix, moins ceux qu'un onglet dit sans trait — quatre retours, deux sorties, deux à regarder —, plus l'entrée. */
const TRAITS_DU_MARAIS = ATTENDU.liens - 4 - 2 - ATTENDU.choixSansDestination - ATTENDU.choixVersSupprimee + 1;
const zoom = (page: Page): Promise<number> => page.locator(".chemins__cadre").evaluate((c) => Number((c as HTMLElement).dataset.zoom));
/** Le schéma est dessiné : ses cartes à leur place, ses traits tracés. */
async function schemaPret(page: Page, cartes: number): Promise<void> {
  await expect(page.locator(".chemins__toile[data-dessine]")).toBeVisible();
  await expect(CARTES(page)).toHaveCount(cartes);
  // Un trait tout droit n'a pas de largeur : on compte les traits, on ne demande pas qu'ils se voient
  await expect.poll(() => TRAITS(page).count()).toBeGreaterThan(0);
}

/** Ce qui se lit à l'écran : croisements entre traits, traits qui passent sous une carte, place prise. */
const mesurer = (page: Page) =>
  page.evaluate(() => {
    type Pt = { x: number; y: number };
    const cartes = [...document.querySelectorAll(".chemins .react-flow__node")].map((c) => c.getBoundingClientRect());
    const traits = [...document.querySelectorAll<SVGPathElement>(".chemins .react-flow__edge-path")].map((p) => {
      const m = p.getScreenCTM()!;
      const longueur = p.getTotalLength();
      const points: Pt[] = [];
      for (let d = 0; d <= longueur; d += 4) {
        const q = p.getPointAtLength(d);
        points.push({ x: q.x * m.a + q.y * m.c + m.e, y: q.x * m.b + q.y * m.d + m.f });
      }
      return points;
    });
    const dans = (r: DOMRect, p: Pt, marge: number) => p.x > r.left + marge && p.x < r.right - marge && p.y > r.top + marge && p.y < r.bottom - marge;
    // Un trait passe sous une carte s'il la traverse sans y commencer ni y finir
    const sousUneCarte = traits.filter((points) => cartes.some((r) => !dans(r, points[0], -8) && !dans(r, points[points.length - 1], -8) && points.some((p) => dans(r, p, 3)))).length;
    const coupe = (a: Pt, b: Pt, c: Pt, d: Pt) => {
      const sens = (p: Pt, q: Pt, r: Pt) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
      return sens(a, b, c) * sens(a, b, d) < 0 && sens(c, d, a) * sens(c, d, b) < 0;
    };
    // Deux traits se croisent quand deux de leurs segments se coupent, hors de leurs extrémités
    const rognes = traits.map((points) => points.slice(4, -4));
    let croisements = 0;
    for (let i = 0; i < rognes.length; i++) {
      for (let j = i + 1; j < rognes.length; j++) {
        for (let k = 0; k + 1 < rognes[i].length; k++) {
          for (let n = 0; n + 1 < rognes[j].length; n++) if (coupe(rognes[i][k], rognes[i][k + 1], rognes[j][n], rognes[j][n + 1])) croisements += 1;
        }
      }
    }
    const remontent = traits.filter((points) => points[points.length - 1].y < points[0].y).length;
    // Le schéma se tire dans son cadre (F03-AC58) : il « dépasse de côté » quand une carte sort du cadre à gauche ou à droite
    const cadre = document.querySelector(".chemins__cadre")!.getBoundingClientRect();
    return {
      cartes: cartes.length, traits: traits.length, croisements, sousUneCarte, remontent,
      defileDeCote: cartes.some((r) => r.left < cadre.left - 1 || r.right > cadre.right + 1) || document.documentElement.scrollWidth > document.documentElement.clientWidth,
      depasseEnBas: cartes.some((r) => r.bottom > cadre.bottom + 1),
      hauteur: Math.max(...cartes.map((r) => r.bottom)) - Math.min(...cartes.map((r) => r.top)),
      // La page elle-même ne défile pas : le cadre va jusqu'au bas de la fenêtre
      pageDefile: document.documentElement.scrollHeight > window.innerHeight + 1 || window.scrollY > 0,
    };
  });

test.describe("Chemins d'un chapitre : le schéma (F03.1)", () => {
  test("F03-AC18, AC25, AC44, AC47, AC62, AC65 — les mêmes scènes, reliées par les choix enregistrés, sans rien modifier en regardant ; la carte dit le titre, l'état et ses choix en onglets, sans référence ; cliquer une scène montre ses chemins et « Ouvrir » y mène ; l'onglet d'un choix vers un autre chapitre ouvre ce chapitre dans la même vue, la scène d'arrivée désignée", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await auteur(page);
    await l.base.from("projets").update({ depart_scene_id: l.lisiere.scenes[0] }).eq("id", l.projet);
    await l.base.from("scenes").update({ fin: true }).eq("id", l.lisiere.scenes[3]);
    await semerBlocs(l.base, l.lisiere.scenes[0], [choixAuto("Continuer vers la lumière", l.lisiere.scenes[1]), choixAuto("Longer la souche", l.lisiere.scenes[2]), choixAuto("Plus tard", null)]);
    await semerBlocs(l.base, l.lisiere.scenes[1], [choixAuto("Descendre au marais", l.marais.scenes[0])]);
    await semerBlocs(l.base, l.lisiere.scenes[2], [choixAuto("Rejoindre la clairière", l.lisiere.scenes[1])]);
    const avant = await sql("select id, version, rang from scenes where projet_id = $1 order by reference", [l.projet]);

    // « Scènes » reste à un clic : les mêmes scènes en cartes, puis leurs chemins
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}?vue=scenes`);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002", "S003", "S004"]);
    await page.getByRole("button", { name: "Chemins", exact: true }).click();
    await page.waitForURL(new RegExp(`/chapitre/${l.lisiere.id}$`));
    await schemaPret(page, 4);
    // Les quatre scènes du chapitre, par leur titre : ni référence, ni consigne
    expect((await page.locator(".carte-chemin__titre").allInnerTexts()).sort()).toEqual(["Clairière", "La souche", "Le pont", "Le sentier"]);
    await expect(page.locator(".chemins .fiche__ref")).toHaveCount(0);
    await expect(page.locator(".chemins")).not.toContainText(/S00\d/);
    await expect(carte(page, "Le sentier")).toContainText("Départ du livre");
    // « Le sentier » n'a que ses choix : une phrase de choix n'est pas du texte de la scène (F06-AC105)
    await expect(carte(page, "Le sentier")).toContainText("Texte vide");
    await expect(carte(page, "Le pont")).toContainText("Fin de l’histoire");
    await expect(carte(page, "Le pont")).toContainText("Texte vide");
    // Un onglet par choix, sous la carte d'où il part, sa phrase dedans : aucun trait ne porte de texte (F03-AC62)
    await expect(ONGLETS(page)).toHaveCount(5);
    expect(await phrases(page)).toEqual(["Continuer vers la lumière", "Descendre au marais", "Longer la souche", "Plus tard", "Rejoindre la clairière"]);
    await expect(carte(page, "Le sentier").locator(".onglet-chemin__phrase")).toHaveText(["Continuer vers la lumière", "Longer la souche", "Plus tard"]);
    await expect(page.locator(".chemins .react-flow__edge-text, .chemins .react-flow__edge-textwrapper")).toHaveCount(0);
    // Un trait par choix qui mène dans le chapitre ; le choix sans destination et le choix vers « Le marais » le disent
    // dans leur onglet, sans trait ni étiquette au bout (F03-AC65)
    await expect(TRAITS(page)).toHaveCount(3);
    await expect(page.locator(".etiquette-chemin")).toHaveCount(0);
    await expect(onglet(page, "Plus tard")).toHaveClass(/onglet-chemin--manque/);
    await expect(onglet(page, "Plus tard").locator(".onglet-chemin__note--manque")).toHaveText("Sans destination");
    await expect(onglet(page, "Descendre au marais").locator(".onglet-chemin__note")).toHaveText("Le marais");
    // De haut en bas : le départ en haut, la clairière, où deux chemins se rejoignent, plus bas
    const hauteurDe = async (titre: string) => (await carte(page, titre).boundingBox())!.y;
    expect(await hauteurDe("Le sentier")).toBeLessThan(await hauteurDe("La souche"));
    expect(await hauteurDe("La souche")).toBeLessThan(await hauteurDe("Clairière"));

    // Cliquer une scène : les deux chemins qui y arrivent ressortent, l'autre s'efface ; celui qui en part vers
    // « Le marais » se lit dans son onglet, et la scène où rien d'elle ne mène se met en retrait
    await carte(page, "Clairière").click();
    await expect(carte(page, "Clairière")).toHaveClass(/est-choisie/);
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(2);
    await expect(page.locator(".trait-chemin.est-efface")).toHaveCount(1);
    await expect(carte(page, "Le pont")).toHaveClass(/est-en-retrait/);
    await expect(carte(page, "Le sentier")).not.toHaveClass(/est-en-retrait/);
    // « Échap » ne montre plus rien ; la souris partie, plus aucun chemin ne ressort
    await page.keyboard.press("Escape");
    await expect(page.locator(".carte-chemin.est-choisie, .trait-chemin.est-efface")).toHaveCount(0);
    await page.mouse.move(5, 300);
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(0);

    // L'onglet « Descendre au marais » nomme « Le marais », en lien : il ouvre ce chapitre dans la même vue, S005 désignée
    await onglet(page, "Descendre au marais").getByRole("link", { name: "Le marais" }).click();
    await page.waitForURL(new RegExp(`/chapitre/${l.marais.id}\\?vue=chemins&scene=${l.marais.scenes[0]}`));
    await schemaPret(page, 1);
    await expect(page.locator(".carte-chemin.est-designee")).toContainText("Le ponton");
    await expect(page.locator(".carte-chemin.est-designee")).toContainText(/sans suite/i);
    await expect(page.locator(".etiquette-chemin--entree").getByRole("link")).toHaveText("depuis La lisière");
    // Ouvrir une scène depuis les chemins, puis revenir : on retrouve la vue quittée
    // La carte survolée propose « Ouvrir » ; cliquée, c'est le panneau de la scène qui le porte, la carte ne le répète pas
    await carte(page, "Le ponton").hover();
    await expect(carte(page, "Le ponton").getByRole("link", { name: "Ouvrir Le ponton" })).toBeVisible();
    await carte(page, "Le ponton").click();
    await page.locator(".chemins__espace").getByRole("link", { name: "Ouvrir", exact: true }).click();
    await page.waitForURL(/\/scene\/.*de=chemins/);
    await page.getByRole("link", { name: "Retour à Le marais" }).click();
    await page.waitForURL(new RegExp(`/chapitre/${l.marais.id}$`));
    await expect(page.getByRole("button", { name: "Chemins", exact: true })).toHaveAttribute("aria-pressed", "true");
    // Rien n'a été modifié en regardant les chemins
    expect(await sql("select id, version, rang from scenes where projet_id = $1 order by reference", [l.projet])).toEqual(avant);
  });

  test("F03-AC43, AC58, AC64, V15 — le marais, trente-deux scènes : de haut en bas dans la largeur du cadre, qui remplit la fenêtre sans que la page défile ; les quatre retours en arrière écrits dans leur onglet, sans trait au repos ; la molette change la taille, on déplace le schéma en tirant le fond ; lisibilité mesurée à l'écran — aucun trait sous une carte, peu de croisements", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, vueChemins(l, l.feuxFollets));
    // Un si grand chapitre tient en 1 366 points la colonne de navigation repliée (F03-AC43 révisé, F06.5)
    await page.getByRole("button", { name: "Replier la colonne" }).click();
    await schemaPret(page, ATTENDU.scenes);
    await expect(TRAITS(page)).toHaveCount(TRAITS_DU_MARAIS);
    await expect.poll(async () => (await mesurer(page)).defileDeCote).toBe(false);
    const mesure = await mesurer(page);
    // Trente-deux scènes et l'étiquette de l'entrée ; les sorties et les choix qui n'arrivent nulle part se lisent dans
    // leur onglet. Tout trait dessiné descend (F03-AC64)
    expect(mesure).toMatchObject({ cartes: ATTENDU.scenes + 1, traits: TRAITS_DU_MARAIS, sousUneCarte: 0, defileDeCote: false, remontent: 0 });
    // Les quatre retours en arrière s'écrivent dans leur onglet, précédés de leur signe, sans trait au repos
    await expect(page.locator(".onglet-chemin--retour")).toHaveCount(4);
    await expect(page.locator(".trait-chemin.est-retour")).toHaveCount(0);
    await expect(onglet(page, "Revenir vers le ponton").locator(".onglet-chemin__note")).toHaveText("retour à « Ponton — la voix du héron »");
    await expect(onglet(page, "Revenir vers le ponton").locator(".onglet-chemin__note svg")).toHaveCount(1);
    // Survoler la carte où il revient, comme celle d'où il part, trace sa ligne
    await expect(carte(page, "Ponton — la voix du héron")).toBeInViewport();
    await carte(page, "Ponton — la voix du héron").hover();
    await expect(page.locator(".trait-chemin.est-retour")).toHaveCount(1);
    await page.mouse.move(5, 300);
    await expect(page.locator(".trait-chemin.est-retour")).toHaveCount(0);
    // La vue sans bibliothèque en comptait 30 sur ce chapitre, et 3 traits sous 10 cartes
    expect(mesure.croisements).toBeLessThanOrEqual(12);
    // Les cartes gardent une taille où le titre se lit — pas sous 70 % (F03.1) —, et le chapitre dépasse le cadre :
    // on y tire le schéma, la page ne défile pas (F03-AC58)
    expect(await zoom(page)).toBeGreaterThanOrEqual(0.7);
    expect(mesure.hauteur).toBeGreaterThan(768);
    expect(mesure.depasseEnBas).toBe(true);
    expect(mesure.pageDefile).toBe(false);
    const y = async (titre: string) => (await carte(page, titre).boundingBox())!.y;
    // La molette change la taille du schéma, sans faire défiler la page (F03-AC58 révisé) ; « Taille lisible » y ramène
    const taille = await zoom(page);
    await page.mouse.move(683, 500);
    await page.mouse.wheel(0, 300);
    await expect.poll(() => zoom(page)).toBeLessThan(taille);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await page.getByRole("button", { name: "Taille lisible" }).click();
    await expect.poll(() => zoom(page)).toBe(taille);
    await page.mouse.move(683, 500);
    await page.mouse.wheel(0, -300);
    await expect.poll(() => zoom(page)).toBeGreaterThan(taille);
    await aller(page, vueChemins(l, l.feuxFollets));
    await schemaPret(page, ATTENDU.scenes);
    expect(await zoom(page)).toBe(taille);
    // On tire le fond : le schéma suit la main, aucune carte ne se déplace par rapport aux autres
    const ecart = (await y("Île — le saule aux lanternes")) - (await y("Marais — la barque s’enlise"));
    const fond = (await page.locator(".chemins__cadre").boundingBox())!;
    const haut = await y("Île — le saule aux lanternes");
    await page.mouse.move(fond.x + 30, fond.y + fond.height - 30);
    await page.mouse.down();
    await page.mouse.move(fond.x + 30, fond.y + fond.height - 150, { steps: 6 });
    await page.mouse.up();
    await expect.poll(async () => haut - (await y("Île — le saule aux lanternes"))).toBeGreaterThan(100);
    expect((await y("Île — le saule aux lanternes")) - (await y("Marais — la barque s’enlise"))).toBeCloseTo(ecart, 0);
    // L'entrée du chapitre est en haut, sa sortie en bas
    expect(await y("Marais — la barque s’enlise")).toBeLessThan(await y("Île — le saule aux lanternes"));
    expect(await y("Île — le saule aux lanternes")).toBeLessThan(await y("Écluse — la sortie du marais"));
  });

  test("F03-AC46 — « À regarder » compte ce qui touche les chemins, et un clic y conduit, l'un après l'autre, sans rien masquer ; un chapitre où rien n'est à regarder n'a pas cette ligne", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, vueChemins(l, l.feuxFollets));
    await schemaPret(page, ATTENDU.scenes);
    await expect(REGARDER(page).locator("button.lien")).toHaveText(["1 choix sans destination", "1 choix vers une scène supprimée", "2 scènes où rien ne mène", "2 scènes sans suite"]);
    await expect(REGARDER(page)).toContainText("À regarder :");
    // La carte porte sa marque — en tête d'où l'on vient, au pied où l'on va (« Choix en onglets ») ; la scène où mène
    // un autre chapitre et celle qu'atteint un lien caché n'en ont pas
    await expect(carte(page, "Marais — le crapaud qui parle").locator(".carte-chemin__bande--regarder")).toHaveText("Rien n’y mène");
    await expect(carte(page, "Marais — le crapaud qui parle").locator(".carte-chemin__bande--tete")).toHaveCount(1);
    await expect(carte(page, "Saule — la lanterne s’allume seule").locator(".carte-chemin__bande--regarder")).toHaveText("Sans suite");
    await expect(carte(page, "Saule — la lanterne s’allume seule").locator(".carte-chemin__bande--pied")).toHaveCount(1);
    await expect(carte(page, "sans titre").locator(".carte-chemin__bande--regarder")).toHaveText(["Rien n’y mène", "Sans suite"]);
    await expect(page.locator(".carte-chemin__bande--regarder")).toHaveCount(4);
    await expect(carte(page, "Marais — la barque s’enlise").locator(".carte-chemin__bande")).toHaveCount(0);
    await expect(carte(page, "Sous le cercle — la salle des feux follets").locator(".carte-chemin__bande")).toHaveCount(0);

    // Un compte cliqué choisit la première scène de sa sorte, comme un clic sur sa carte, et l'amène à l'écran ;
    // cliqué de nouveau, la suivante. Le compteur dit où l'on en est parmi les six.
    const compte = page.locator(".chemins__compte");
    const choisie = page.locator(".carte-chemin.est-choisie");
    // Rien tant qu’aucun cas n’est désigné (révision de novembre 2026)
    await expect(compte).toHaveText("");
    await REGARDER(page).getByRole("button", { name: "2 scènes où rien ne mène" }).click();
    await expect(choisie).toContainText("Marais — le crapaud qui parle");
    await expect(choisie).toBeInViewport();
    await expect(compte).toHaveText("3 / 6");
    await expect(REGARDER(page).getByRole("button", { name: "2 scènes où rien ne mène" })).toHaveAttribute("aria-current", "true");
    await REGARDER(page).getByRole("button", { name: "2 scènes où rien ne mène" }).click();
    await expect(choisie).toContainText("sans titre");
    await expect(choisie).toBeInViewport();
    await expect(compte).toHaveText("4 / 6");
    // « Suivant » et « Précédent » passent de l'un à l'autre, toutes sortes à la suite, et font le tour
    await REGARDER(page).getByRole("button", { name: "Suivant" }).click();
    await expect(choisie).toContainText("Saule — la lanterne s’allume seule");
    await expect(choisie).toBeInViewport();
    await expect(compte).toHaveText("5 / 6");
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(1);
    // Pour un choix : la scène d'où il part est choisie, et son onglet, en ambre, est encadré (F03-AC65)
    await REGARDER(page).getByRole("button", { name: "1 choix sans destination" }).click();
    await expect(choisie).toContainText("Île — le cercle de pierres");
    await expect(page.locator(".onglet-chemin.est-montree")).toHaveClass(/onglet-chemin--manque/);
    await expect(page.locator(".onglet-chemin.est-montree .onglet-chemin__phrase")).toHaveText("Écouter ce que disent les pierres");
    await expect(page.locator(".onglet-chemin.est-montree .onglet-chemin__note")).toHaveText("Sans destination");
    await expect(page.locator(".onglet-chemin.est-montree")).toBeInViewport();
    await expect(compte).toHaveText("1 / 6");
    await REGARDER(page).getByRole("button", { name: "Suivant" }).click();
    await expect(choisie).toContainText("Cabane — le coffre de la passeuse");
    await expect(page.locator(".onglet-chemin.est-montree .onglet-chemin__note")).toHaveText("Scène supprimée");
    await REGARDER(page).getByRole("button", { name: "Précédent" }).click();
    await REGARDER(page).getByRole("button", { name: "Précédent" }).click();
    await expect(compte).toHaveText("6 / 6");
    await expect(choisie).toContainText("sans titre");
    // Rien n'est masqué
    await expect(CARTES(page)).toHaveCount(ATTENDU.scenes);

    // « Le marais », une seule scène où mènent deux choix d'autres chapitres : elle n'a pas de suite, c'est tout
    await aller(page, vueChemins(l, l.marais.id));
    await schemaPret(page, 1);
    await expect(REGARDER(page).locator("button.lien")).toHaveText(["1 scène sans suite"]);
    await l.base.from("scenes").update({ fin: true }).eq("id", l.marais.scenes[0]);
    await aller(page, vueChemins(l, l.marais.id));
    await schemaPret(page, 1);
    await expect(REGARDER(page)).toHaveCount(0);
  });

  test("F03-AC62, AC63, AC65, AC68, AC48 — un onglet par choix, côte à côte sous la carte, borné à 128 points et trois lignes ; le lien caché en onglet, son trait en pointillé ; de loin les onglets gardent leurs phrases ; « Tout voir », « Taille lisible », et la mini-carte dès que le schéma dépasse du cadre", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, vueChemins(l, l.feuxFollets));
    await schemaPret(page, ATTENDU.scenes);
    // Un onglet par choix, sa phrase dans la voix du récit (F03-AC62)
    await expect(ONGLETS(page)).toHaveCount(ATTENDU.liens);
    await expect(carte(page, "Marais — la barque s’enlise").locator(".onglet-chemin__phrase")).toHaveText(["Suivre les feux follets", "Longer la vieille digue", "Appeler à l’aide"]);
    const bords = await carte(page, "Marais — la barque s’enlise").locator(".onglet-chemin").evaluateAll((o) => o.map((x) => x.getBoundingClientRect()).map((b) => ({ gauche: b.left, droite: b.right, haut: b.top })));
    // Côte à côte, sur un seul rang
    expect(bords[0].droite).toBeLessThanOrEqual(bords[1].gauche + 1);
    expect(bords[1].droite).toBeLessThanOrEqual(bords[2].gauche + 1);
    expect(bords[1].haut).toBeCloseTo(bords[0].haut, 0);
    expect(await onglet(page, "Longer la vieille digue").locator(".onglet-chemin__phrase").evaluate((p) => getComputedStyle(p).fontStyle)).toBe("italic");
    // Borné : 128 points de large, trois lignes au plus ; le seul choix d'une scène prend la largeur de sa carte (F03-AC63)
    const long = onglet(page, "Échanger la plume argentée");
    const taille = (o: Locator) => o.evaluate((x) => ({ largeur: (x as HTMLElement).offsetWidth, lignes: Math.round(x.querySelector<HTMLElement>(".onglet-chemin__phrase > span:last-child")!.clientHeight / 17) }));
    expect(await taille(long)).toMatchObject({ largeur: 128 });
    expect((await taille(long)).lignes).toBeLessThanOrEqual(3);
    await expect(long.locator(".onglet-chemin__phrase")).toHaveText("Échanger la plume argentée contre une barque");
    const seul = onglet(page, "Lui répondre");
    expect((await taille(seul)).largeur).toBeGreaterThan(128);
    expect((await taille(seul)).largeur).toBe(await carte(page, "Marais — le crapaud qui parle").evaluate((c) => (c as HTMLElement).offsetWidth));
    // Le lien caché a son onglet, marqué de la clé, et son trait en pointillé ; les sorties et ce qui manque se lisent
    // dans leur onglet (F03-AC65)
    await expect(page.locator(".onglet-chemin.est-cache .onglet-chemin__phrase")).toHaveText("Lien caché");
    await expect(page.locator(".onglet-chemin.est-cache .onglet-chemin__phrase svg")).toHaveCount(1);
    await expect(page.locator(".trait-chemin.est-cache")).toHaveCount(1);
    await expect(onglet(page, "Passer l’écluse").getByRole("link", { name: "La lisière" })).toBeVisible();
    await expect(page.locator(".onglet-chemin--manque .onglet-chemin__note")).toHaveText(["Sans destination", "Scène supprimée"]);
    // Survoler un onglet ne fait ressortir que son trait ; survoler sa carte, tous les siens
    await onglet(page, "Longer la vieille digue").hover();
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(1);
    await carte(page, "Marais — la barque s’enlise").locator(".carte-chemin__titre").hover();
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(4);
    await page.mouse.move(5, 300);
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(0);

    // Le schéma dépasse de son cadre : la mini-carte dit où l'on est ; un clic y conduit, sans changer la taille
    const miniCarte = page.locator(".chemins__carte");
    await expect(miniCarte).toBeVisible();
    const lisible = await zoom(page);
    await expect(carte(page, "Marais — la barque s’enlise")).toBeInViewport();
    const boite = (await miniCarte.getByRole("img").boundingBox())!;
    await page.mouse.click(boite.x + boite.width / 2, boite.y + boite.height * 0.9);
    await expect(carte(page, "Marais — la barque s’enlise")).not.toBeInViewport();
    await expect(carte(page, "Écluse — la sortie du marais")).toBeInViewport();
    expect(await zoom(page)).toBe(lisible);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    // Elle se replie d'un clic et reste repliée, même en rouvrant le chapitre (F03.1, 14 octobre 2026)
    await page.getByRole("button", { name: "Replier la mini-carte" }).click();
    await expect(miniCarte).toHaveCount(0);
    await page.reload();
    await schemaPret(page, ATTENDU.scenes);
    await expect(page.getByRole("button", { name: "Mini-carte" })).toBeVisible();
    await expect(miniCarte).toHaveCount(0);
    await page.getByRole("button", { name: "Mini-carte" }).click();
    await expect(miniCarte).toBeVisible();

    // « Tout voir » : le chapitre entier dans la fenêtre ; les onglets gardent leurs phrases, à l'échelle du schéma
    // (F03-AC68) ; la carte se nomme dans une bulle
    await page.getByRole("button", { name: "Tout voir" }).click();
    await expect.poll(() => zoom(page)).toBeLessThan(0.62);
    await expect(ONGLETS(page)).toHaveCount(ATTENDU.liens);
    await expect(onglet(page, "Longer la vieille digue").locator(".onglet-chemin__phrase")).toBeVisible();
    await expect(miniCarte).toHaveCount(0);
    await expect.poll(async () => { const m = await mesurer(page); return m.defileDeCote || m.depasseEnBas || m.pageDefile; }).toBe(false);
    await expect(CARTES(page).first()).toBeInViewport();
    await expect(carte(page, "Écluse — la sortie du marais")).toBeInViewport();
    await carte(page, "Île — le cercle de pierres").click();
    await expect(page.locator(".bulle-chemin")).toContainText("Île — le cercle de pierres");
    await expect(page.locator(".bulle-chemin").getByRole("link", { name: "Ouvrir" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(".chemins__espace")).toHaveCount(0);
    // « Taille lisible » y ramène ; « − » et « + » changent la taille pas à pas
    await page.getByRole("button", { name: "Taille lisible" }).click();
    await expect.poll(() => zoom(page)).toBe(lisible);
    await expect(ONGLETS(page)).toHaveCount(ATTENDU.liens);
    await expect(page.getByRole("button", { name: "Taille lisible" })).toHaveCount(0);
    await page.getByRole("button", { name: "Réduire" }).click();
    await expect.poll(() => zoom(page)).toBeCloseTo(lisible - 0.1, 5);
    await page.getByRole("button", { name: "Agrandir" }).click();
    await expect.poll(() => zoom(page)).toBe(lisible);

    // Un chapitre de quatre scènes tient dans l'écran : pas de mini-carte
    await aller(page, vueChemins(l, l.lisiere.id));
    await schemaPret(page, 4);
    await expect(miniCarte).toHaveCount(0);
  });

  test("V15 — un chapitre de quarante scènes dans un livre de deux cents : la vue « Chemins » s'affiche en moins de trois secondes, sans trait sous une carte ; « Tout voir » le ramène dans la fenêtre", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1024, height: 768 });
    const l = await auteur(page);
    // Cent quatre-vingt-quinze scènes de plus, par la base : quarante dans « La lisière », le reste dans « Le marais ».
    // « Paiement ouvert » éteint le temps de semer, la limite gratuite refusant sinon la 41e (F14-AC13)
    const [{ paiement_ouvert: ouvert }] = await sql<{ paiement_ouvert: boolean }>("select paiement_ouvert from public.reglages_application");
    await sql("update public.reglages_application set paiement_ouvert = false");
    try {
      await sql(
        `insert into scenes (chapitre_id, projet_id, enseignant_id, reference, rang, titre)
         select case when n <= 36 then $1::uuid else $2::uuid end, $3::uuid, (select enseignant_id from projets where id = $3), 5 + n, 10 + n, 'Scène ' || (5 + n)
         from generate_series(1, 195) n`,
        [l.lisiere.id, l.marais.id, l.projet],
      );
    } finally {
      await sql("update public.reglages_application set paiement_ouvert = $1", [ouvert]);
    }
    await sql("update projets set reference_suivante = 201 where id = $1", [l.projet]);
    const scenes = await sql<{ id: string; reference: number }>("select id, reference from scenes where chapitre_id = $1 order by reference", [l.lisiere.id]);
    expect(scenes).toHaveLength(40);
    // Chaque scène propose deux ou trois choix : un arbre qui se rejoint, plus serré qu'un vrai livre
    for (const [i, s] of scenes.entries()) {
      const suites = [scenes[2 * i + 1], scenes[2 * i + 2], scenes[i + 7]].filter(Boolean);
      if (suites.length) await semerBlocs(l.base, s.id, suites.map((d) => choixAuto(`Aller vers ${d.reference}`, d.id)));
    }
    const debut = Date.now();
    await aller(page, vueChemins(l, l.lisiere.id));
    await schemaPret(page, 40);
    expect(Date.now() - debut).toBeLessThan(3_000);
    const mesure = await mesurer(page);
    expect(mesure.traits).toBeGreaterThan(60);
    expect(mesure.sousUneCarte).toBe(0);
    // « Tout voir » ramène le chapitre dans la fenêtre, sans défilement de côté
    await page.getByRole("button", { name: "Tout voir" }).click();
    await expect.poll(async () => { const m = await mesurer(page); return m.defileDeCote || m.depasseEnBas || m.pageDefile; }).toBe(false);
    await page.getByRole("button", { name: "Taille lisible" }).click();
    await expect(CARTES(page).first().getByRole("link", { name: /Ouvrir/ })).toHaveCount(1);
  });
});

test.describe("« Chemins » en atelier (F03.1, 11 novembre 2026)", () => {
  /** Un point du cadre où il n'y a que le fond du schéma : ni carte, ni libellé, ni commande. */
  const pointVide = (page: Page): Promise<{ x: number; y: number }> =>
    page.evaluate(() => {
      const r = document.querySelector(".chemins__cadre")!.getBoundingClientRect();
      for (let y = r.top + 14; y < r.bottom - 90; y += 22) {
        for (let x = r.left + 14; x < r.right - 14; x += 22) {
          if (document.elementFromPoint(x, y)?.classList.contains("react-flow__pane")) return { x, y };
        }
      }
      throw new Error("Aucun point vide dans le cadre");
    });

  test("F03-AC59 — deux états : une carte cliquée replie la colonne et ouvre l'espace de travail à côté du schéma, la carte au milieu, à la même taille ; une autre carte y vient à son tour ; Échap, la croix ou un clic dans le vide — pas un glissé — ramènent au plan", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, `/projet/${l.projet}/chapitre/${l.feuxFollets}`);
    await schemaPret(page, ATTENDU.scenes);
    const espace = page.locator(".chemins__espace");
    const cadre = page.locator(".chemins__cadre");
    const colonne = page.locator("#colonne-adulte");
    const titre = espace.locator(".panneau-chemin__champ--titre input");
    // Le plan : colonne ouverte, schéma sur toute la largeur
    await expect(espace).toHaveCount(0);
    await expect(colonne).not.toHaveAttribute("data-repliee", "oui");
    const taille = await zoom(page);
    const largeurAuPlan = (await cadre.boundingBox())!.width;
    const ecartAuMilieu = async (nom: string) => {
      const c = (await cadre.boundingBox())!;
      const k = (await carte(page, nom).boundingBox())!;
      return Math.abs(k.x + k.width / 2 - (c.x + c.width / 2));
    };

    // Le travail : la colonne se replie, l'espace s'ouvre à droite, à côté du schéma, et la carte glisse au milieu
    await carte(page, "Ponton — le marché du héron").click();
    await expect(espace).toBeVisible();
    await expect(colonne).toHaveAttribute("data-repliee", "oui");
    await expect(titre).toHaveValue("Ponton — le marché du héron");
    await expect.poll(() => ecartAuMilieu("Ponton — le marché du héron")).toBeLessThan(3);
    const c = (await cadre.boundingBox())!;
    const e = (await espace.boundingBox())!;
    expect(e.x).toBeGreaterThanOrEqual(c.x + c.width - 1);
    expect(c.width).toBeLessThan(largeurAuPlan);
    // L'espace va jusqu'au bord droit de la page, où la place de la barre de défilement reste gardée (base.css)
    expect(Math.round(e.x + e.width)).toBe(await page.evaluate(() => Math.round(document.body.getBoundingClientRect().right)));
    expect(await zoom(page)).toBe(taille);
    expect((await mesurer(page)).pageDefile).toBe(false);
    await expect(carte(page, "Ponton — le marché du héron")).toHaveClass(/est-choisie/);

    // Une autre carte : seul le contenu de l'espace change, le schéma glisse jusqu'à elle
    await carte(page, "Ponton — la barque du héron").click();
    await expect(titre).toHaveValue("Ponton — la barque du héron");
    await expect.poll(() => ecartAuMilieu("Ponton — la barque du héron")).toBeLessThan(3);
    expect((await cadre.boundingBox())!.width).toBe(c.width);
    expect(await zoom(page)).toBe(taille);

    // Échap ramène au plan : la colonne revient comme elle était
    await page.keyboard.press("Escape");
    await expect(espace).toHaveCount(0);
    await expect(colonne).not.toHaveAttribute("data-repliee", "oui");
    await expect.poll(async () => (await cadre.boundingBox())!.width).toBe(largeurAuPlan);
    // La croix aussi
    await carte(page, "Ponton — la barque du héron").click();
    await expect(espace).toBeVisible();
    await espace.getByRole("button", { name: "Fermer le panneau de la scène" }).click();
    await expect(espace).toHaveCount(0);
    // Tirer le fond ne ferme rien ; un clic dans le vide, si
    await carte(page, "Ponton — la barque du héron").click();
    await expect(espace).toBeVisible();
    await expect.poll(() => ecartAuMilieu("Ponton — la barque du héron")).toBeLessThan(3);
    const prise = await pointVide(page);
    await page.mouse.move(prise.x, prise.y);
    await page.mouse.down();
    await page.mouse.move(prise.x + 70, prise.y + 50, { steps: 6 });
    await page.mouse.up();
    await expect.poll(() => ecartAuMilieu("Ponton — la barque du héron")).toBeGreaterThan(40);
    await expect(espace).toBeVisible();
    const vide = await pointVide(page);
    await page.mouse.click(vide.x, vide.y);
    await expect(espace).toHaveCount(0);
  });

  test("F03-AC60 — l'en-tête en une bande : la bascule et son « i » dans le bandeau, sans « Ajouter une scène » ni « Attribuer des élèves » ; les prénoms ouvrent « Attribuer des élèves », que le menu offre aussi ; « À regarder » dans « Chemins » seulement ; dans « Scènes », « + Nouvelle scène » en dernière carte", async ({ page }) => {
    test.setTimeout(120_000);
    const s = await classeQuiEcrit(page);
    await semerBlocs(s.base, s.lisiere.scenes[0], [choixAuto("Traverser le pont", s.lisiere.scenes[1]), choixAuto("Plus tard", null)]);
    await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}`);
    await schemaPret(page, 2);
    const bandeau = page.locator(".chap-bandeau");
    await expect(bandeau.getByRole("group", { name: "Vue du chapitre" })).toBeVisible();
    await expect(bandeau.getByRole("button", { name: "Comment lire ces chemins ?" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^(Ajouter une scène|Nouvelle scène)$/ })).toHaveCount(0);
    await expect(bandeau.getByRole("button", { name: "Attribuer des élèves", exact: true })).toHaveCount(0);
    await expect(bandeau.locator(".chap-eleves--bouton")).toContainText("Alice");
    await expect(bandeau.locator(".chap-eleves--bouton")).toContainText("Bilal");
    // « À regarder », sous le bandeau, dans « Chemins »
    await expect(REGARDER(page)).toContainText("1 choix sans destination");
    // Le menu « … » offre « Attribuer des élèves »
    await bandeau.locator(".chap-actions summary").click();
    await expect(bandeau.getByRole("button", { name: "Attribuer des élèves", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    // Les prénoms l'ouvrent
    await bandeau.locator(".chap-eleves--bouton").click();
    await expect(page.getByRole("complementary").filter({ hasText: "Un élève coché lit et écrit dans ce chapitre" })).toBeVisible();

    // « Scènes » : pas de ligne « À regarder », et « + Nouvelle scène » en dernière carte de la grille
    await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}?vue=scenes`);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002"]);
    await expect(REGARDER(page)).toHaveCount(0);
    await expect(page.locator(".chap-bandeau").getByRole("button", { name: "Que change l’ordre des cartes ?" })).toBeVisible();
    const derniere = page.locator(".fiches > li").last();
    await expect(derniere.getByRole("button", { name: "Nouvelle scène" })).toBeVisible();
    await derniere.getByRole("button", { name: "Nouvelle scène" }).click();
    await expect(MESSAGE(page)).toContainText("S004 est ajoutée à la fin du chapitre.");
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002", "S004"]);
    await expect(page.locator(".fiches > li").last().getByRole("button", { name: "Nouvelle scène" })).toBeVisible();
  });

  test("F03-AC61 — « Chemins » s'ouvre en premier dans un chapitre à choix, « Scènes » restant à un clic ; une scène ouverte depuis « Scènes » y ramène ; un récit classique s'ouvre sur ses scènes", async ({ page }) => {
    test.setTimeout(120_000);
    const { compte, base } = await adultePret(page);
    const projet = await semerProjet(base, compte, "personnel", "choix", "Les passeurs de brume");
    const { chapitres } = await semerPartie(base, projet, "La forêt", [{ titre: "La lisière", scenes: ["Le sentier", "Clairière"] }]);
    await semerBlocs(base, chapitres[0].scenes[0], [choixAuto("Continuer vers la lumière", chapitres[0].scenes[1])]);
    await aller(page, `/projet/${projet}/plan`);
    await page.getByRole("link", { name: "Ouvrir La lisière", exact: true }).click();
    await page.waitForURL(new RegExp(`/chapitre/${chapitres[0].id}$`));
    await schemaPret(page, 2);
    await expect(page.getByRole("button", { name: "Chemins", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".fiches")).toHaveCount(0);
    // « Scènes » à un clic ; une scène ouverte de là y ramène
    await page.getByRole("button", { name: "Scènes", exact: true }).click();
    await page.waitForURL(/vue=scenes/);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002"]);
    await page.getByRole("link", { name: /Ouvrir S002/ }).click();
    await page.waitForURL(/\/scene\//);
    await page.getByRole("link", { name: "Retour à La lisière" }).click();
    await page.waitForURL(/vue=scenes/);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002"]);

    // Un récit classique : ses scènes, sans bascule ni schéma
    const classique = await semerProjet(base, compte, "personnel", "classique", "Carnet de voyage");
    const c = await semerPartie(base, classique, "Le départ", [{ titre: "Le port", scenes: ["A", "B"] }]);
    await aller(page, `/projet/${classique}/chapitre/${c.chapitres[0].id}`);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002"]);
    await expect(page.getByRole("group", { name: "Vue du chapitre" })).toHaveCount(0);
    await expect(page.locator(".chemins__plan")).toHaveCount(0);
    await expect(page.locator(".fiches > li").last().getByRole("button", { name: "Nouvelle scène" })).toBeVisible();
  });
});

test.describe("Construire dans « Chemins » : les gestes de l'adulte (F03.1, 10, 11 et 14 novembre 2026)", () => {
  const plus = (page: Page, titre: string): Locator => page.getByRole("button", { name: `Ajouter une suite à « ${titre} »` });
  const bulle = (page: Page): Locator => page.locator("form.geste-chemin");
  const panneauScene = (page: Page): Locator => page.locator(".panneau-chemin:not(.panneau-choix)");
  const panneauChoix = (page: Page): Locator => page.locator(".panneau-choix");
  const enregistre = (panneau: Locator) => expect(panneau.getByText("Enregistré")).toBeVisible();
  const scenesDuChapitreEnBase = (chapitre: string) =>
    sql<{ id: string; titre: string | null; consigne: string | null; eleve: string | null; texte_vide: boolean }>(
      "select id, titre, consigne, prise_par_eleve as eleve, texte_vide from scenes where chapitre_id = $1 and supprime_le is null order by rang, reference", [chapitre],
    );
  const libellesEnBase = async (scene: string): Promise<string[]> =>
    (await sceneEnBase(scene)).texte.filter((b) => b.type === "choix").map((b) => (b as unknown as { libelle: string }).libelle);
  /** Tire d'un point à un autre, comme à la souris : le « + » ou un onglet, jusqu'à une carte. */
  async function tirerJusqua(page: Page, source: Locator, cible: Locator): Promise<void> {
    const a = (await source.boundingBox())!;
    const b = (await cible.boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 12, a.y + a.height / 2 + 12, { steps: 4 });
    // Au milieu de la carte : près d'un bord du cadre, la vue se décalerait sous le pointeur
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 });
    await page.mouse.up();
  }

  test("F03-AC52, AC53, AC55, AC56 — le « + » cliqué ajoute une scène et son choix ; tiré jusqu'à une carte, il relie sans rien créer ; le panneau règle le titre et la consigne, pas le texte ; un choix puis une scène se suppriment d'ici", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await auteur(page);
    const [sentier, clairiere] = l.lisiere.scenes;
    await semerBlocs(l.base, sentier, [recit("Le sentier s’enfonce sous les arbres."), choixAuto("Continuer vers la lumière", clairiere)]);
    await semerBlocs(l.base, clairiere, [recit("La clairière s’ouvre.")]);
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await schemaPret(page, 4);

    // « + » sous « Clairière » : le choix, puis le titre de la nouvelle scène ; Entrée, sans bouton d'enregistrement (F03-AC52)
    await carte(page, "Clairière").hover();
    await plus(page, "Clairière").click();
    await expect(bulle(page)).toHaveAccessibleName("Ajouter une suite à « Clairière »");
    await bulle(page).getByLabel("Ce que fait le lecteur").fill("Suivre le ruisseau");
    await bulle(page).getByLabel("Nouvelle scène").fill("Le ruisseau");
    await page.keyboard.press("Enter");
    await expect(carte(page, "Le ruisseau")).toBeVisible();
    await expect(MESSAGE(page)).toContainText("« Le ruisseau » est ajoutée.");
    await expect(carte(page, "Clairière").locator(".onglet-chemin__phrase")).toHaveText("Suivre le ruisseau");
    await expect(TRAITS(page)).toHaveCount(2);
    const apresAjout = await scenesDuChapitreEnBase(l.lisiere.id);
    expect(apresAjout.map((x) => x.titre)).toEqual(["Le sentier", "Clairière", "La souche", "Le pont", "Le ruisseau"]);
    expect(apresAjout[4]).toMatchObject({ consigne: "", eleve: null, texte_vide: true });
    const ruisseau = apresAjout[4].id;
    // Le choix est à la fin du texte de « Clairière », avec sa phrase automatique, et mène à la nouvelle scène
    expect(await typesEnBase(clairiere)).toEqual(["p", "choix"]);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S002 > S006"]);

    // Le « + » de « Le ruisseau », tiré jusqu'à « Le pont » : la bulle ne demande que le choix, aucune scène n'est créée (F03-AC53)
    await carte(page, "Le ruisseau").hover();
    await tirerJusqua(page, plus(page, "Le ruisseau"), carte(page, "Le pont"));
    await expect(bulle(page)).toHaveAccessibleName("Relier « Le ruisseau » à « Le pont »");
    await expect(bulle(page).getByLabel("Nouvelle scène")).toHaveCount(0);
    await bulle(page).getByLabel("Ce que fait le lecteur").fill("Traverser");
    await page.keyboard.press("Enter");
    await expect(MESSAGE(page)).toContainText("mène à S004 « Le pont ».");
    await expect(TRAITS(page)).toHaveCount(3);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S002 > S006", "S006 > S004"]);
    expect(await scenesDuChapitreEnBase(l.lisiere.id)).toHaveLength(5);

    // Le panneau de la scène cliquée : titre et consigne, enregistrés sans bouton ; le texte ne s'y écrit pas (F03-AC55)
    await carte(page, "Le ruisseau").click();
    const scene = panneauScene(page);
    await expect(scene.getByLabel("Titre")).toHaveValue("Le ruisseau");
    await scene.getByLabel("Titre").fill("Le ruisseau qui chante");
    await scene.getByLabel(/^Consigne/).fill("Décris le bruit de l’eau.");
    await scene.getByLabel(/^Consigne/).blur();
    await enregistre(scene);
    await expect(carte(page, "Le ruisseau qui chante")).toBeVisible();
    await expect.poll(async () => (await scenesDuChapitreEnBase(l.lisiere.id))[4]).toMatchObject({ titre: "Le ruisseau qui chante", consigne: "Décris le bruit de l’eau.", texte_vide: true });
    await expect(scene.locator('[contenteditable="true"]')).toHaveCount(0);
    await expect(scene.getByRole("link", { name: "Ouvrir", exact: true })).toHaveAttribute("href", new RegExp(`/scene/${ruisseau}`));

    // Supprimer le choix « Traverser » : son bloc quitte le texte, « Le pont » reste (F03-AC56)
    await scene.getByRole("button", { name: "Supprimer le choix « Traverser »" }).click();
    await expect(MESSAGE(page).getByRole("button", { name: "Annuler" })).toBeVisible();
    await expect.poll(() => liensEnBase(l.projet)).toEqual(["S001 > S002", "S002 > S006"]);
    await expect(carte(page, "Le pont")).toBeVisible();
    expect(await typesEnBase(ruisseau)).not.toContain("choix");
    // Une scène sans texte rejoint la corbeille sans confirmation
    await scene.getByRole("button", { name: "Supprimer la scène" }).click();
    await expect(CARTES(page)).toHaveCount(4);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect((await sql<{ c: boolean }>("select supprime_le is not null as c from scenes where id = $1", [ruisseau]))[0].c).toBe(true);
    // Une scène écrite demande la confirmation de F03-AC13
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await schemaPret(page, 4);
    await carte(page, "Le sentier").click();
    await panneauScene(page).getByRole("button", { name: "Supprimer la scène" }).click();
    await expect(page.getByRole("alertdialog", { name: "Supprimer S001 « Le sentier » ?" })).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Annuler" }).click();
    await expect(CARTES(page)).toHaveCount(4);
  });

  test("F03-AC67 — l'onglet d'un choix « Sans destination » se tire jusqu'à une scène : il y mène, sans bulle, sa phrase et sa place gardées ; « Annuler » le rend sans destination ; « Relier à… », dans le panneau, fait de même", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await auteur(page);
    const [sentier, clairiere] = l.lisiere.scenes;
    await semerBlocs(l.base, sentier, [recit("Le sentier s’enfonce sous les arbres."), choixAuto("Continuer vers la lumière", clairiere), choixAuto("Plus tard", null), recit("Le vent se lève.")]);
    const avant = (await sceneEnBase(sentier)).texte.map((b) => b.id);
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await schemaPret(page, 4);
    const plusTard = onglet(page, "Plus tard");
    await expect(plusTard).toHaveClass(/onglet-chemin--manque/);
    await expect(plusTard).toHaveClass(/se-tire/);
    await expect(TRAITS(page)).toHaveCount(1);

    await tirerJusqua(page, plusTard, carte(page, "La souche"));
    await expect(MESSAGE(page)).toContainText("mène à S003 « La souche ».");
    await expect(bulle(page)).toHaveCount(0);
    await expect(plusTard).not.toHaveClass(/onglet-chemin--manque/);
    await expect(plusTard.locator(".onglet-chemin__note")).toHaveCount(0);
    await expect(TRAITS(page)).toHaveCount(2);
    expect(await liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S003"]);
    // La phrase et sa place dans le texte n'ont pas changé
    expect((await sceneEnBase(sentier)).texte.map((b) => b.id)).toEqual(avant);
    expect(await libellesEnBase(sentier)).toEqual(["Continuer vers la lumière", "Plus tard"]);
    // « Annuler » le rend sans destination
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(plusTard).toHaveClass(/onglet-chemin--manque/);
    await expect.poll(() => liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > ?"]);

    // « Relier à… », dans le panneau de la scène, à côté de « Sans destination »
    await carte(page, "Le sentier").click();
    await panneauScene(page).getByLabel("Relier le choix « Plus tard » à une scène").selectOption({ label: "S003 « La souche »" });
    await expect(MESSAGE(page)).toContainText("mène à S003 « La souche ».");
    await expect.poll(() => liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S003"]);
    expect((await sceneEnBase(sentier)).texte.map((b) => b.id)).toEqual(avant);
  });

  test("F03-AC70, AC71, AC72, AC73, AC74, AC76 — l'onglet cliqué ouvre le choix : ses réglages en entier ; le libellé change l'onglet, la destination son trait ; « ← », Échap et la ligne de « Ses choix » ; supprimé, « Annuler » le rend à sa place ; de loin, rien ne s'ouvre", async ({ page }) => {
    test.setTimeout(150_000);
    const l = await auteur(page);
    const [sentier, clairiere, souche] = l.lisiere.scenes;
    await semerBlocs(l.base, sentier, [recit("Le sentier s’enfonce sous les arbres."), choixAuto("Continuer vers la lumière", clairiere), choixAuto("Longer la souche", souche), recit("Le vent se lève.")]);
    const avant = (await sceneEnBase(sentier)).texte.map((b) => b.id);
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await schemaPret(page, 4);

    // L'onglet cliqué : sa scène est choisie, le choix s'ouvre, l'onglet et son trait restent désignés (F03-AC70)
    await onglet(page, "Longer la souche").click();
    const choix = panneauChoix(page);
    await expect(choix.getByLabel("Ce que fait le lecteur")).toHaveValue("Longer la souche");
    await expect(choix.getByRole("button", { name: /Revenir à la scène/ })).toContainText("Le sentier");
    await expect(carte(page, "Le sentier")).toHaveClass(/est-choisie/);
    await expect(onglet(page, "Longer la souche")).toHaveClass(/est-ouvert/);
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(1);
    // Les réglages de la copie, en entier (F03-AC71)
    await expect(choix.locator(".cx-phrase__texte").first()).toContainText("rends-toi au");
    for (const nom of ["Changer…", "Ajouter une destination", "Cacher ce choix (énigme)", "Supprimer ce choix"]) await expect(choix.getByRole("button", { name: nom })).toBeVisible();

    // « Ce que fait le lecteur » : l'onglet le porte sans autre geste, la phrase automatique le reprend (F03-AC72)
    await choix.getByLabel("Ce que fait le lecteur").fill("Contourner la souche");
    await choix.getByLabel("Ce que fait le lecteur").press("Enter");
    await enregistre(choix);
    await expect(onglet(page, "Contourner la souche")).toHaveClass(/est-ouvert/);
    await expect(choix.locator(".cx-phrase__texte").first()).toContainText(/contourner la souche/i);
    await expect.poll(() => libellesEnBase(sentier)).toEqual(["Continuer vers la lumière", "Contourner la souche"]);

    // Changer de destination : le trait mène ailleurs, le choix garde sa place dans le texte (F03-AC73)
    await choix.getByRole("button", { name: "Changer…" }).click();
    await choix.locator(".cx-liste button", { hasText: "Le pont" }).first().click();
    await expect.poll(() => liensEnBase(l.projet)).toEqual(["S001 > S002", "S001 > S004"]);
    expect((await sceneEnBase(sentier)).texte.map((b) => b.id)).toEqual(avant);
    await expect(TRAITS(page)).toHaveCount(2);

    // Échap ramène à la scène, « Ses choix » dans l'ordre du texte ; sa ligne rouvre le choix, « ← » en revient (F03-AC74)
    await page.keyboard.press("Escape");
    await expect(choix).toHaveCount(0);
    const scene = panneauScene(page);
    await expect(scene.locator(".panneau-chemin__libelle")).toHaveText(["Continuer vers la lumière", "Contourner la souche"]);
    await scene.getByRole("button", { name: "Contourner la souche", exact: true }).click();
    await expect(choix.getByLabel("Ce que fait le lecteur")).toHaveValue("Contourner la souche");
    await choix.getByRole("button", { name: /Revenir à la scène/ }).click();
    await expect(choix).toHaveCount(0);
    await expect(scene.getByLabel("Titre")).toHaveValue("Le sentier");
    // Supprimer le choix ramène à la scène, avec un message et « Annuler », qui le rend à sa place
    await scene.getByRole("button", { name: "Contourner la souche", exact: true }).click();
    await choix.getByRole("button", { name: "Supprimer ce choix" }).click();
    await expect(choix).toHaveCount(0);
    await expect(scene.locator(".panneau-chemin__libelle")).toHaveText(["Continuer vers la lumière"]);
    await expect(ONGLETS(page)).toHaveCount(1);
    await expect.poll(() => liensEnBase(l.projet)).toEqual(["S001 > S002"]);
    await MESSAGE(page).getByRole("button", { name: "Annuler" }).click();
    await expect(ONGLETS(page)).toHaveCount(2);
    await expect.poll(async () => (await sceneEnBase(sentier)).texte.map((b) => b.id)).toEqual(avant);

    // De loin, aucun choix ne s'ouvre pour être modifié (F03-AC76)
    await page.keyboard.press("Escape");
    await expect(page.locator(".chemins__espace")).toHaveCount(0);
    await expect(page.locator("#colonne-adulte")).not.toHaveAttribute("data-repliee", "oui");
    while ((await zoom(page)) >= 0.62) {
      const taille = await zoom(page);
      await page.getByRole("button", { name: "Réduire" }).click();
      await expect.poll(() => zoom(page)).toBeLessThan(taille);
    }
    await expect(page.locator(".onglet-chemin.se-choisit, .onglet-chemin.se-tire")).toHaveCount(0);
    await onglet(page, "Continuer vers la lumière").click({ force: true });
    await expect(choix).toHaveCount(0);
  });

  test("F03-AC77 — la suite : un choix sans action a son onglet « Suite », de la largeur de la carte ; « Juste la suite », dans la bulle du « + », en ajoute une", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await auteur(page);
    const [, clairiere, souche] = l.lisiere.scenes;
    await semerBlocs(l.base, clairiere, [recit("La clairière s’ouvre."), choixAuto("", souche)]);
    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await schemaPret(page, 4);
    const suite = carte(page, "Clairière").locator(".onglet-chemin");
    await expect(suite).toHaveCount(1);
    await expect(suite).toHaveClass(/est-sans-action/);
    await expect(suite.locator(".onglet-chemin__phrase")).toHaveText("Suite");
    expect(await suite.evaluate((o) => (o as HTMLElement).offsetWidth)).toBe(await carte(page, "Clairière").evaluate((c) => (c as HTMLElement).offsetWidth));
    await expect(TRAITS(page)).toHaveCount(1);

    // « + » sous « La souche », « Juste la suite », puis le titre de la nouvelle scène
    await carte(page, "La souche").hover();
    await plus(page, "La souche").click();
    await bulle(page).getByRole("button", { name: "Juste la suite" }).click();
    await bulle(page).getByLabel("Nouvelle scène").fill("Le vieux pont");
    await page.keyboard.press("Enter");
    await expect(carte(page, "Le vieux pont")).toBeVisible();
    await expect(carte(page, "La souche").locator(".onglet-chemin__phrase")).toHaveText("Suite");
    await expect(TRAITS(page)).toHaveCount(2);
    expect(await libellesEnBase(souche)).toEqual([""]);
    expect(await liensEnBase(l.projet)).toEqual(["S002 > S003", "S003 > S006"]);
  });
});

test("F03-AC49 — sur téléphone, « Chemins » est la liste des scènes, dans l'ordre où on les rencontre, chaque choix disant où il mène, avec la même ligne « À regarder » ; le schéma ne s'y charge pas", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const l = await auteur(page);
  await l.base.from("projets").update({ depart_scene_id: l.lisiere.scenes[0] }).eq("id", l.projet);
  await l.base.from("scenes").update({ fin: true }).eq("id", l.lisiere.scenes[3]);
  await semerBlocs(l.base, l.lisiere.scenes[0], [choixAuto("Continuer vers la lumière", l.lisiere.scenes[1]), choixAuto("Longer la souche", l.lisiere.scenes[2]), choixAuto("Plus tard", null)]);
  await semerBlocs(l.base, l.lisiere.scenes[1], [choixAuto("Descendre au marais", l.marais.scenes[0])]);
  await semerBlocs(l.base, l.lisiere.scenes[2], [choixAuto("Rejoindre la clairière", l.lisiere.scenes[1])]);
  const fichiers: string[] = [];
  page.on("response", async (reponse) => {
    // Ce que seuls portent les fichiers de React Flow et de dagre, et pas la feuille de style de l'application
    if (reponse.url().includes("/_next/static/") && /react-flow__attribution|network-simplex/.test(await reponse.text().catch(() => ""))) fichiers.push(reponse.url());
  });
  await aller(page, vueChemins(l, l.lisiere.id));
  const noeud = (ref: string) => page.locator(".noeud").filter({ has: page.locator(".noeud__tete .fiche__ref", { hasText: ref }) });
  // Le départ, puis S004 où rien ne mène, puis ce qu'on atteint en un pas
  await expect(page.locator(".chemins__liste .noeud .fiche__ref")).toHaveText(["S001", "S004", "S002", "S003"]);
  await expect(noeud("S001")).toContainText("Départ du livre");
  await expect(noeud("S001").locator(".noeud__suites li")).toHaveText([/Continuer vers la lumière.*S002 Clairière/, /Longer la souche.*S003 La souche/, /Plus tard.*Sans destination/]);
  await expect(noeud("S002")).toContainText("2 chemins se rejoignent");
  await expect(noeud("S002").getByRole("link", { name: /Le marais · S005/ })).toBeVisible();
  await expect(noeud("S004")).toContainText("Fin de l’histoire");
  await expect(noeud("S004")).toContainText("Rien n’y mène");
  await expect(noeud("S004")).not.toContainText("Sans suite");
  // Ni schéma ni ses bibliothèques ; la page ne déborde pas
  await expect(page.locator(".react-flow")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(fichiers).toEqual([]);
  // La même ligne « À regarder », qui conduit au choix
  await expect(REGARDER(page).locator("button.lien")).toHaveText(["1 choix sans destination", "1 scène où rien ne mène"]);
  await REGARDER(page).getByRole("button", { name: "1 scène où rien ne mène" }).click();
  await expect(noeud("S004").locator(".noeud__carte")).toHaveClass(/est-montree/);
  await expect(noeud("S004").locator(".noeud__carte")).toBeInViewport();
  await expect(page.locator(".chemins__compte")).toHaveText("2 / 2");
  await REGARDER(page).getByRole("button", { name: "Suivant" }).click();
  await expect(noeud("S001").locator(".noeud__suites li.est-montree")).toContainText("Plus tard");
  await expect(page.locator(".chemins__compte")).toHaveText("1 / 2");
});

test("F03-AC50, AC18, AC61 — les chemins lus par un élève : le même schéma, sans référence ni lien caché, un autre chapitre nommé sans qu'il puisse s'y rendre ; « À regarder » ne lui dit que ses choix", async ({ page, browser }) => {
  test.setTimeout(150_000);
  const s = await classeQuiEcrit(page);
  await semerBlocs(s.base, s.lisiere.scenes[0], [choixAuto("Traverser le pont", s.lisiere.scenes[1]), choixAuto("Aller au sanctuaire", s.sanctuaire.scenes[0]), choixAuto("Plus tard", null)]);
  await semerBlocs(s.base, s.lisiere.scenes[1], [liaison(s.lisiere.scenes[0], "Résoudre l’énigme du pont")]);
  // L'enseignant lit le lien caché, et se rend au sanctuaire par son étiquette
  await aller(page, `/projet/${s.projet}/chapitre/${s.lisiere.id}?vue=chemins`);
  await schemaPret(page, 2);
  await expect(page.locator(".onglet-chemin.est-cache .onglet-chemin__phrase")).toHaveText("Lien caché");
  await expect(onglet(page, "Aller au sanctuaire").getByRole("link", { name: "Le sanctuaire" })).toBeVisible();

  const alice = await posteDe(browser, s, "Alice");
  // « Chemins » s'ouvre en premier pour l'élève aussi (F03-AC61), « Scènes » restant à un clic
  await aller(alice.page, `/travail/chapitre/${s.lisiere.id}`);
  await expect(alice.page.getByRole("button", { name: "Chemins", exact: true })).toHaveAttribute("aria-pressed", "true");
  await schemaPret(alice.page, 2);
  // En lecture : ni « + », ni espace de travail, ni bouton d'IA
  await expect(alice.page.locator(".plus-chemin, .chemins__ia")).toHaveCount(0);
  expect((await alice.page.locator(".carte-chemin__titre").allInnerTexts()).sort()).toEqual(["Le pont", "Le sentier"]);
  await expect(alice.page.locator(".chemins")).not.toContainText(/S00\d/);
  // Ses choix en onglets, comme pour l'adulte (F03-AC62) ; ni lien caché, ni marque sur les scènes
  expect(await phrases(alice.page)).toEqual(["Aller au sanctuaire", "Plus tard", "Traverser le pont"]);
  await expect(alice.page.locator(".onglet-chemin.est-cache, .trait-chemin.est-cache")).toHaveCount(0);
  await expect(alice.page.locator(".carte-chemin__bande")).toHaveCount(0);
  await expect(REGARDER(alice.page).locator("button.lien")).toHaveText(["1 choix sans destination"]);
  // L'autre chapitre est nommé dans l'onglet, sans lien : ce n'est pas le sien (F03-AC65)
  await expect(onglet(alice.page, "Aller au sanctuaire").locator(".onglet-chemin__note")).toHaveText("Le sanctuaire");
  await expect(alice.page.locator(".onglet-chemin a")).toHaveCount(0);
  // Cliquer un onglet, pour elle, c'est cliquer sa carte : aucun choix ne s'ouvre, aucun onglet ne se tire (F03-AC70, AC76)
  await onglet(alice.page, "Traverser le pont").click();
  await expect(carte(alice.page, "Le sentier")).toHaveClass(/est-choisie/);
  await expect(alice.page.locator(".chemins__espace, .onglet-chemin.se-choisit, .onglet-chemin.se-tire")).toHaveCount(0);
  await alice.page.keyboard.press("Escape");
  // « Ouvrir » mène à sa page de scène
  await carte(alice.page, "Le sentier").click();
  await expect(alice.page.locator(".chemins__espace")).toHaveCount(0);
  await carte(alice.page, "Le sentier").getByRole("link", { name: "Ouvrir Le sentier" }).click();
  await alice.page.waitForURL(new RegExp(`/travail/scene/${s.lisiere.scenes[0]}`));
  // Venu des chemins, il y revient ; « Scènes » reste à un clic
  await alice.page.getByRole("link", { name: "Retour à La lisière" }).click();
  await alice.page.waitForURL(new RegExp(`/travail/chapitre/${s.lisiere.id}$`));
  await alice.page.getByRole("button", { name: "Scènes", exact: true }).click();
  await alice.page.waitForURL(/vue=scenes/);
  await expect(alice.page.locator(".fiches")).toBeVisible();
  await alice.contexte.close();
});

test("F14-AC35 — sur un grand écran, le nom de la bibliothèque se lit dans un coin du schéma", async ({ page }) => {
  const l = await auteur(page);
  await semerBlocs(l.base, l.lisiere.scenes[0], [choixAuto("Continuer vers la lumière", l.lisiere.scenes[1])]);
  await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}?vue=chemins`);
  await schemaPret(page, 4);
  const mention = page.locator(".react-flow__attribution");
  await expect(mention).toBeVisible();
  await expect(mention).toContainText("React Flow");
});
