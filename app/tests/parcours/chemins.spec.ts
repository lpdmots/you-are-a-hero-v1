import { expect, test, type Locator, type Page } from "@playwright/test";
import { ATTENDU, poserLeMarais, type Requete } from "../../scripts/marais-des-feux-follets";
import { adultePret, aller, choixAuto, classeQuiEcrit, liaison, posteDe, semerBlocs, semerPartie, semerProjet, sql, supprimerComptes } from "./outils";

/**
 * La vue « Chemins » d'un chapitre (F03.1, « Vue Chemins à reprendre ») : un schéma de haut en
 * bas sur un écran large, la liste des scènes sur téléphone. Le chapitre d'essai est « Le marais
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
    const cadre = document.querySelector(".chemins__cadre")!;
    return {
      cartes: cartes.length, traits: traits.length, croisements, sousUneCarte, remontent,
      defileDeCote: cadre.scrollWidth > cadre.clientWidth || document.documentElement.scrollWidth > document.documentElement.clientWidth,
      hauteur: document.querySelector(".chemins__toile")!.getBoundingClientRect().height,
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

    await aller(page, `/projet/${l.projet}/chapitre/${l.lisiere.id}`);
    await expect(page.locator(".fiches .fiche__ref")).toHaveText(["S001", "S002", "S003", "S004"]);
    await page.getByRole("button", { name: "Chemins", exact: true }).click();
    await page.waitForURL(/vue=chemins/);
    await schemaPret(page, 4);
    // Les quatre scènes du chapitre, par leur titre : ni référence, ni consigne, ni liste de choix
    expect((await page.locator(".carte-chemin__titre").allInnerTexts()).sort()).toEqual(["Clairière", "La souche", "Le pont", "Le sentier"]);
    await expect(page.locator(".chemins .fiche__ref")).toHaveCount(0);
    await expect(page.locator(".chemins")).not.toContainText(/S00\d/);
    await expect(carte(page, "Le sentier")).toContainText("Départ du livre");
    await expect(carte(page, "Le sentier")).toContainText("En cours");
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
    await page.waitForURL(/vue=chemins/);
    await expect(page.getByRole("button", { name: "Chemins", exact: true })).toHaveAttribute("aria-pressed", "true");
    // Rien n'a été modifié en regardant les chemins
    expect(await sql("select id, version, rang from scenes where projet_id = $1 order by reference", [l.projet])).toEqual(avant);
  });

  test("F03-AC43, V15 — le marais, trente-deux scènes : de haut en bas dans la largeur de l'écran, la page défile ; lisibilité mesurée à l'écran — aucun trait sous une carte, peu de croisements", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, vueChemins(l, l.feuxFollets));
    await schemaPret(page, ATTENDU.scenes);
    await expect(TRAITS(page)).toHaveCount(ATTENDU.liens + 1);
    const mesure = await mesurer(page);
    // Trente-deux scènes et cinq étiquettes : deux sorties, une entrée, deux choix qui n'arrivent nulle part
    expect(mesure).toMatchObject({ cartes: ATTENDU.scenes + 5, traits: ATTENDU.liens + 1, sousUneCarte: 0, defileDeCote: false, remontent: 4 });
    // La vue sans bibliothèque en comptait 30 sur ce chapitre, et 3 traits sous 10 cartes
    expect(mesure.croisements).toBeLessThanOrEqual(12);
    // Les cartes gardent une taille où le titre se lit, et le chapitre dépasse l'écran : on fait défiler la page
    expect(await zoom(page)).toBeGreaterThanOrEqual(0.8);
    expect(mesure.hauteur).toBeGreaterThan(768);
    await page.mouse.move(683, 500);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(400);
    // L'entrée du chapitre est en haut, sa sortie en bas
    const y = async (titre: string) => (await carte(page, titre).boundingBox())!.y;
    expect(await y("Marais — la barque s’enlise")).toBeLessThan(await y("Île — le saule aux lanternes"));
    expect(await y("Île — le saule aux lanternes")).toBeLessThan(await y("Écluse — la sortie du marais"));
  });

  test("F03-AC46 — « À regarder » compte ce qui touche les chemins, et un clic y conduit, l'un après l'autre, sans rien masquer ; un chapitre où rien n'est à regarder n'a pas cette ligne", async ({ page }) => {
    test.setTimeout(120_000);
    const l = await avecLeMarais(page);
    await aller(page, vueChemins(l, l.feuxFollets));
    await schemaPret(page, ATTENDU.scenes);
    await expect(REGARDER(page).locator("button")).toHaveText(["1 choix sans destination", "1 choix vers une scène supprimée", "2 scènes où rien ne mène", "2 scènes sans suite"]);
    await expect(REGARDER(page)).toContainText("À regarder :");
    // La carte porte sa marque ; la scène où mène un autre chapitre et celle qu'atteint un lien caché n'en ont pas
    await expect(carte(page, "Marais — le crapaud qui parle").locator(".carte-chemin__bande--regarder")).toHaveText("Rien n’y mène");
    await expect(carte(page, "Saule — la lanterne s’allume seule").locator(".carte-chemin__bande--regarder")).toHaveText("Sans suite");
    await expect(carte(page, "sans titre").locator(".carte-chemin__bande--regarder")).toHaveText("Rien n’y mène · sans suite");
    await expect(page.locator(".carte-chemin__bande--regarder")).toHaveCount(3);
    await expect(carte(page, "Marais — la barque s’enlise").locator(".carte-chemin__bande")).toHaveCount(0);
    await expect(carte(page, "Sous le cercle — la salle des feux follets").locator(".carte-chemin__bande")).toHaveCount(0);

    // Un clic conduit à la première scène, le suivant à la seconde ; toutes les cartes restent là
    await REGARDER(page).getByRole("button", { name: "2 scènes où rien ne mène" }).click();
    await expect(page.locator(".carte-chemin.est-montree")).toContainText("Marais — le crapaud qui parle");
    await expect(page.locator(".carte-chemin.est-montree")).toBeInViewport();
    await REGARDER(page).getByRole("button", { name: "2 scènes où rien ne mène" }).click();
    await expect(page.locator(".carte-chemin.est-montree")).toContainText("sans titre");
    await expect(page.locator(".carte-chemin.est-montree")).toBeInViewport();
    await REGARDER(page).getByRole("button", { name: "1 choix sans destination" }).click();
    await expect(page.locator(".etiquette-chemin.est-montree")).toHaveText("Sans destination");
    await expect(page.locator(".etiquette-chemin.est-montree")).toBeInViewport();
    await REGARDER(page).getByRole("button", { name: "1 choix vers une scène supprimée" }).click();
    await expect(page.locator(".etiquette-chemin.est-montree")).toHaveText("Scène supprimée");
    await expect(CARTES(page)).toHaveCount(ATTENDU.scenes);

    // « Le marais », une seule scène où mènent deux choix d'autres chapitres : elle n'a pas de suite, c'est tout
    await aller(page, vueChemins(l, l.marais.id));
    await schemaPret(page, 1);
    await expect(REGARDER(page).locator("button")).toHaveText(["1 scène sans suite"]);
    await l.base.from("scenes").update({ fin: true }).eq("id", l.marais.scenes[0]);
    await aller(page, vueChemins(l, l.marais.id));
    await schemaPret(page, 1);
    await expect(REGARDER(page)).toHaveCount(0);
  });

  test("F03-AC45, AC48 — les libellés sur les flèches, coupés après deux lignes, entiers pour la scène survolée, masqués quand on voit tout ; « Tout voir », « Taille lisible », et la mini-carte au-delà de deux écrans", async ({ page }) => {
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

    // Au-delà de deux écrans, la mini-carte dit où l'on est ; un clic y conduit
    const miniCarte = page.locator(".chemins__carte");
    await expect(miniCarte).toBeVisible();
    const lisible = await zoom(page);
    const boite = (await miniCarte.boundingBox())!;
    await page.mouse.click(boite.x + boite.width / 2, boite.y + boite.height * 0.8);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(600);

    // « Tout voir » : le chapitre entier dans la fenêtre, sans libellés ; la carte se nomme dans une bulle
    await page.getByRole("button", { name: "Tout voir" }).click();
    await expect.poll(() => zoom(page)).toBeLessThan(0.62);
    await expect(LIBELLES(page)).toHaveCount(0);
    await expect(miniCarte).toHaveCount(0);
    await expect
      .poll(() => page.locator(".chemins__toile").evaluate((t) => { const r = t.getBoundingClientRect(); return r.top >= 58 && r.bottom <= window.innerHeight + 1; }))
      .toBe(true);
    await expect(CARTES(page).first()).toBeInViewport();
    await expect(carte(page, "Écluse — la sortie du marais")).toBeInViewport();
    await carte(page, "Île — le cercle de pierres").click();
    await expect(page.locator(".bulle-chemin")).toContainText("Île — le cercle de pierres");
    await expect(page.locator(".bulle-chemin").getByRole("link", { name: "Ouvrir" })).toBeVisible();
    await page.keyboard.press("Escape");
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
    // Cent quatre-vingt-quinze scènes de plus, par la base : quarante dans « La lisière », le reste dans « Le marais »
    await sql(
      `insert into scenes (chapitre_id, projet_id, enseignant_id, reference, rang, titre)
       select case when n <= 36 then $1::uuid else $2::uuid end, $3::uuid, (select enseignant_id from projets where id = $3), 5 + n, 10 + n, 'Scène ' || (5 + n)
       from generate_series(1, 195) n`,
      [l.lisiere.id, l.marais.id, l.projet],
    );
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
    await expect.poll(async () => (await mesurer(page)).defileDeCote).toBe(false);
    await expect
      .poll(() => page.locator(".chemins__toile").evaluate((t) => t.getBoundingClientRect().bottom <= window.innerHeight + 1))
      .toBe(true);
    await page.getByRole("button", { name: "Taille lisible" }).click();
    await expect(CARTES(page).first().getByRole("link", { name: /Ouvrir/ })).toHaveCount(1);
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
  await expect(REGARDER(page).locator("button")).toHaveText(["1 choix sans destination", "1 scène où rien ne mène"]);
  await REGARDER(page).getByRole("button", { name: "1 scène où rien ne mène" }).click();
  await expect(noeud("S004").locator(".noeud__carte")).toHaveClass(/est-montree/);
  await expect(noeud("S004").locator(".noeud__carte")).toBeInViewport();
});

test("F03-AC50, AC18 — les chemins lus par un élève : le même schéma, sans référence ni lien caché, un autre chapitre nommé sans qu'il puisse s'y rendre ; « À regarder » ne lui dit que ses choix", async ({ page, browser }) => {
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
  await aller(alice.page, `/travail/chapitre/${s.lisiere.id}`);
  await alice.page.getByRole("button", { name: "Chemins", exact: true }).click();
  await alice.page.waitForURL(/vue=chemins/);
  await schemaPret(alice.page, 2);
  expect((await alice.page.locator(".carte-chemin__titre").allInnerTexts()).sort()).toEqual(["Le pont", "Le sentier"]);
  await expect(alice.page.locator(".chemins")).not.toContainText(/S00\d/);
  // Ses choix sur les flèches ; ni lien caché, ni marque sur les scènes
  expect((await LIBELLES(alice.page).allInnerTexts()).sort()).toEqual(["Aller au sanctuaire", "Plus tard", "Traverser le pont"]);
  await expect(alice.page.locator(".libelle-chemin.est-cache, .trait-chemin.est-cache")).toHaveCount(0);
  await expect(alice.page.locator(".carte-chemin__bande")).toHaveCount(0);
  await expect(REGARDER(alice.page).locator("button")).toHaveText(["1 choix sans destination"]);
  // L'autre chapitre est nommé, sans lien : ce n'est pas le sien
  await expect(alice.page.locator(".etiquette-chemin--sortie")).toHaveText("Le sanctuaire");
  await expect(alice.page.locator(".etiquette-chemin--sortie a")).toHaveCount(0);
  // « Ouvrir » mène à sa page de scène
  await carte(alice.page, "Le sentier").click();
  await carte(alice.page, "Le sentier").getByRole("link", { name: "Ouvrir Le sentier" }).click();
  await alice.page.waitForURL(new RegExp(`/travail/scene/${s.lisiere.scenes[0]}`));
  await alice.contexte.close();
});
