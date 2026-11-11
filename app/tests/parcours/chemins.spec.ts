import { expect, test, type Locator, type Page } from "@playwright/test";
import { ATTENDU, poserLeMarais, type Requete } from "../../scripts/marais-des-feux-follets";
import { adultePret, aller, choixAuto, classeQuiEcrit, liaison, MESSAGE, posteDe, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * La vue « Chemins » d'un chapitre (F03.1, « Vue Chemins à reprendre », puis « Chemins en atelier »,
 * 11 novembre 2026) : un schéma de haut en bas sur un écran large, dans un cadre qu'on tire — la page
 * ne défile plus —, la liste des scènes sur téléphone. « Chemins » s'ouvre en premier (F03-AC61). Le chapitre d'essai est « Le marais
 * des feux follets » (scripts/marais-des-feux-follets.ts) : trente-deux scènes, quarante-neuf choix.
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
const LIBELLES = (page: Page): Locator => page.locator(".libelle-chemin");
const TRAITS = (page: Page): Locator => page.locator(".chemins .react-flow__edge-path");
const REGARDER = (page: Page): Locator => page.locator(".chemins__regarder");
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
  test("F03-AC18, AC25, AC44, AC47 — les mêmes scènes, reliées par les choix enregistrés, sans rien modifier ; la carte dit le titre et l'état, sans référence ; cliquer une scène montre ses chemins et « Ouvrir » y mène ; l'étiquette d'un autre chapitre ouvre ce chapitre dans la même vue, la scène d'arrivée désignée", async ({ page }) => {
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
    // Les quatre scènes du chapitre, par leur titre : ni référence, ni consigne, ni liste de choix
    expect((await page.locator(".carte-chemin__titre").allInnerTexts()).sort()).toEqual(["Clairière", "La souche", "Le pont", "Le sentier"]);
    await expect(page.locator(".chemins .fiche__ref")).toHaveCount(0);
    await expect(page.locator(".chemins")).not.toContainText(/S00\d/);
    await expect(carte(page, "Le sentier")).toContainText("Départ du livre");
    // « Le sentier » n'a que ses choix : une phrase de choix n'est pas du texte de la scène (F06-AC105)
    await expect(carte(page, "Le sentier")).toContainText("Texte vide");
    await expect(carte(page, "Le pont")).toContainText("Fin de l’histoire");
    await expect(carte(page, "Le pont")).toContainText("Texte vide");
    // Un trait par choix, son libellé sur la flèche ; le choix sans destination et le choix vers « Le marais » ont leur étiquette
    await expect(TRAITS(page)).toHaveCount(5);
    expect((await LIBELLES(page).allInnerTexts()).sort()).toEqual(["Continuer vers la lumière", "Descendre au marais", "Longer la souche", "Plus tard", "Rejoindre la clairière"]);
    await expect(page.locator(".etiquette-chemin--manque")).toHaveText("Sans destination");
    await expect(page.locator(".etiquette-chemin--sortie")).toHaveText("Le marais");
    // De haut en bas : le départ en haut, la clairière, où deux chemins se rejoignent, plus bas
    const hauteurDe = async (titre: string) => (await carte(page, titre).boundingBox())!.y;
    expect(await hauteurDe("Le sentier")).toBeLessThan(await hauteurDe("La souche"));
    expect(await hauteurDe("La souche")).toBeLessThan(await hauteurDe("Clairière"));

    // Cliquer une scène : les chemins qui y arrivent et en partent ressortent, les autres s'effacent
    await carte(page, "Clairière").click();
    await expect(carte(page, "Clairière")).toHaveClass(/est-choisie/);
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(3);
    await expect(page.locator(".trait-chemin.est-efface")).toHaveCount(2);
    await expect(page.locator(".libelle-chemin.est-entier")).toHaveCount(3);
    expect((await page.locator(".libelle-chemin.est-entier").allInnerTexts()).sort()).toEqual(["Continuer vers la lumière", "Descendre au marais", "Rejoindre la clairière"]);
    // « Échap » ne montre plus rien ; la souris partie, plus aucun chemin ne ressort
    await page.keyboard.press("Escape");
    await expect(page.locator(".carte-chemin.est-choisie, .trait-chemin.est-efface")).toHaveCount(0);
    await page.mouse.move(5, 300);
    await expect(page.locator(".trait-chemin.est-actif")).toHaveCount(0);

    // L'étiquette « Le marais » ouvre ce chapitre dans la même vue, S005 désignée
    await page.locator(".etiquette-chemin--sortie").getByRole("link", { name: "Le marais" }).click();
    await page.waitForURL(new RegExp(`/chapitre/${l.marais.id}\\?vue=chemins&scene=${l.marais.scenes[0]}`));
    await schemaPret(page, 1);
    await expect(page.locator(".carte-chemin.est-designee")).toContainText("Le ponton");
    await expect(page.locator(".carte-chemin.est-designee")).toContainText(/sans suite/i);
    await expect(page.locator(".etiquette-chemin--entree").getByRole("link")).toHaveText("depuis La lisière");
    // Ouvrir une scène depuis les chemins, puis revenir : on retrouve la vue quittée
    await carte(page, "Le ponton").click();
    await carte(page, "Le ponton").getByRole("link", { name: "Ouvrir Le ponton" }).click();
    await page.waitForURL(/\/scene\/.*de=chemins/);
    await page.getByRole("link", { name: "Retour à Le marais" }).click();
    await page.waitForURL(new RegExp(`/chapitre/${l.marais.id}$`));
    await expect(page.getByRole("button", { name: "Chemins", exact: true })).toHaveAttribute("aria-pressed", "true");
    // Rien n'a été modifié en regardant les chemins
    expect(await sql("select id, version, rang from scenes where projet_id = $1 order by reference", [l.projet])).toEqual(avant);
  });

  test("F03-AC43, AC58, V15 — le marais, trente-deux scènes : de haut en bas dans la largeur du cadre, qui remplit la fenêtre sans que la page défile ; la molette déplace le schéma ; lisibilité mesurée à l'écran — aucun trait sous une carte, peu de croisements", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, vueChemins(l, l.feuxFollets));
    // Un si grand chapitre tient en 1 366 points la colonne de navigation repliée (F03-AC43 révisé, F06.5)
    await page.getByRole("button", { name: "Replier la colonne" }).click();
    await schemaPret(page, ATTENDU.scenes);
    await expect(TRAITS(page)).toHaveCount(ATTENDU.liens + 1);
    await expect.poll(async () => (await mesurer(page)).defileDeCote).toBe(false);
    const mesure = await mesurer(page);
    // Trente-deux scènes et cinq étiquettes : deux sorties, une entrée, deux choix qui n'arrivent nulle part
    expect(mesure).toMatchObject({ cartes: ATTENDU.scenes + 5, traits: ATTENDU.liens + 1, sousUneCarte: 0, defileDeCote: false, remontent: 4 });
    // Les quatre retours en arrière se distinguent : trait plus sombre, petite flèche vers le haut sur leur libellé
    await expect(page.locator(".trait-chemin.remonte")).toHaveCount(4);
    await expect(page.locator(".libelle-chemin.remonte .libelle-chemin__retour")).toHaveCount(4);
    await expect(LIBELLES(page).filter({ hasText: "Revenir vers le ponton" })).toHaveClass(/remonte/);
    // La vue sans bibliothèque en comptait 30 sur ce chapitre, et 3 traits sous 10 cartes
    expect(mesure.croisements).toBeLessThanOrEqual(12);
    // Les cartes gardent une taille où le titre se lit, et le chapitre dépasse le cadre : on y tire le schéma,
    // la page ne défile pas (F03-AC58)
    expect(await zoom(page)).toBeGreaterThanOrEqual(0.8);
    expect(mesure.hauteur).toBeGreaterThan(768);
    expect(mesure.depasseEnBas).toBe(true);
    expect(mesure.pageDefile).toBe(false);
    const y = async (titre: string) => (await carte(page, titre).boundingBox())!.y;
    // La molette déplace le schéma dans son cadre, à la même taille
    const taille = await zoom(page);
    const avant = await y("Marais — la barque s’enlise");
    await page.mouse.move(683, 500);
    await page.mouse.wheel(0, 600);
    await expect.poll(async () => avant - (await y("Marais — la barque s’enlise"))).toBeGreaterThan(200);
    expect(await zoom(page)).toBe(taille);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
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
    // La carte porte sa marque ; la scène où mène un autre chapitre et celle qu'atteint un lien caché n'en ont pas
    await expect(carte(page, "Marais — le crapaud qui parle").locator(".carte-chemin__bande--regarder")).toHaveText("Rien n’y mène");
    await expect(carte(page, "Saule — la lanterne s’allume seule").locator(".carte-chemin__bande--regarder")).toHaveText("Sans suite");
    await expect(carte(page, "sans titre").locator(".carte-chemin__bande--regarder")).toHaveText("Rien n’y mène · sans suite");
    await expect(page.locator(".carte-chemin__bande--regarder")).toHaveCount(3);
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
    // Pour un choix : la scène d'où il part est choisie, et le bout de sa flèche est encadré
    await REGARDER(page).getByRole("button", { name: "1 choix sans destination" }).click();
    await expect(choisie).toContainText("Île — le cercle de pierres");
    await expect(page.locator(".etiquette-chemin.est-montree")).toHaveText("Sans destination");
    await expect(page.locator(".etiquette-chemin.est-montree")).toBeInViewport();
    await expect(compte).toHaveText("1 / 6");
    await REGARDER(page).getByRole("button", { name: "Suivant" }).click();
    await expect(choisie).toContainText("Cabane — le coffre de la passeuse");
    await expect(page.locator(".etiquette-chemin.est-montree")).toHaveText("Scène supprimée");
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

  test("F03-AC45, AC48 — les libellés sur les flèches, coupés après deux lignes, entiers pour la scène survolée, masqués quand on voit tout ; « Tout voir », « Taille lisible », et la mini-carte dès que le schéma dépasse du cadre", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, vueChemins(l, l.feuxFollets));
    await schemaPret(page, ATTENDU.scenes);
    await expect(LIBELLES(page)).toHaveCount(ATTENDU.liens);
    const long = LIBELLES(page).filter({ hasText: "Échanger la plume argentée" });
    const coupe = (libelle: Locator) => libelle.locator("span").last().evaluate((s) => s.scrollHeight > s.clientHeight + 1);
    expect(await coupe(long)).toBe(true);
    await expect(long).toHaveAttribute("title", "Échanger la plume argentée contre une barque");
    expect(await coupe(LIBELLES(page).filter({ hasText: "Suivre les feux follets" }))).toBe(false);
    // Le lien caché a son trait en pointillé et son signe
    await expect(page.locator(".libelle-chemin.est-cache")).toHaveText("Lien caché");
    await expect(page.locator(".trait-chemin.est-cache")).toHaveCount(1);
    // Survoler la scène d'où part le choix le donne en entier
    await carte(page, "Ponton — le marché du héron").hover();
    await expect(long).toHaveClass(/est-entier/);
    await expect(long).toHaveText("Échanger la plume argentée contre une barque");
    expect(await coupe(long)).toBe(false);
    await page.mouse.move(5, 300);

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

    // « Tout voir » : le chapitre entier dans la fenêtre, sans libellés ; la carte se nomme dans une bulle
    await page.getByRole("button", { name: "Tout voir" }).click();
    await expect.poll(() => zoom(page)).toBeLessThan(0.62);
    await expect(LIBELLES(page)).toHaveCount(0);
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
    await expect(LIBELLES(page)).toHaveCount(ATTENDU.liens);
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
    expect(Math.round(e.x + e.width)).toBe(1366);
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
  await expect(page.locator(".libelle-chemin.est-cache")).toHaveText("Lien caché");
  await expect(page.locator(".etiquette-chemin--sortie").getByRole("link", { name: "Le sanctuaire" })).toBeVisible();

  const alice = await posteDe(browser, s, "Alice");
  // « Chemins » s'ouvre en premier pour l'élève aussi (F03-AC61), « Scènes » restant à un clic
  await aller(alice.page, `/travail/chapitre/${s.lisiere.id}`);
  await expect(alice.page.getByRole("button", { name: "Chemins", exact: true })).toHaveAttribute("aria-pressed", "true");
  await schemaPret(alice.page, 2);
  // En lecture : ni « + », ni espace de travail, ni bouton d'IA
  await expect(alice.page.locator(".plus-chemin, .chemins__ia")).toHaveCount(0);
  expect((await alice.page.locator(".carte-chemin__titre").allInnerTexts()).sort()).toEqual(["Le pont", "Le sentier"]);
  await expect(alice.page.locator(".chemins")).not.toContainText(/S00\d/);
  // Ses choix sur les flèches ; ni lien caché, ni marque sur les scènes
  expect((await LIBELLES(alice.page).allInnerTexts()).sort()).toEqual(["Aller au sanctuaire", "Plus tard", "Traverser le pont"]);
  await expect(alice.page.locator(".libelle-chemin.est-cache, .trait-chemin.est-cache")).toHaveCount(0);
  await expect(alice.page.locator(".carte-chemin__bande")).toHaveCount(0);
  await expect(REGARDER(alice.page).locator("button.lien")).toHaveText(["1 choix sans destination"]);
  // L'autre chapitre est nommé, sans lien : ce n'est pas le sien
  await expect(alice.page.locator(".etiquette-chemin--sortie")).toHaveText("Le sanctuaire");
  await expect(alice.page.locator(".etiquette-chemin--sortie a")).toHaveCount(0);
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
