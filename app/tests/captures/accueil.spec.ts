import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { test, type Locator, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  action, adultePret, aller, choixAuto, connecter, creerClasse, elevesDe, inscrire, liaison, lireCodes, recit, semerAttribution, semerBlocs, semerPartie,
  semerProjet, service, sql, supprimerComptes, type BlocSeme, type Compte,
} from "../parcours/outils";
import {
  ACTIONS, CONSIGNES, DEPART, ELEVES, FEUILLE, FORMULES, OBJETS, PARTIES, PISTES, PREPARATION, RESUMES, TEXTES, TEXTES_EN_COURS, TITRE, VISUELS,
} from "../../scripts/passeurs-de-brume";

/**
 * Captures des écrans montrés sur l'accueil public (app/public/accueil/), refaites le 14 novembre 2026 après la
 * colonne de navigation et la révision de l'ergonomie, contre le serveur local, sans recompiler :
 *   npx playwright test --config playwright.local.config.ts accueil
 * Elles s'écrivent dans test-results/captures/accueil/, en PNG à double densité, chaque morceau d'écran découpé
 * comme les originaux du 22 octobre 2026 (V1/identite/accueil/captures/) ; la conversion en webp se fait à part.
 * Ce n'est pas un test : rien n'y est vérifié, et une vue qui échoue est notée sans arrêter les suivantes.
 * Le serveur local a de vraies clés : aucun bouton ✦ n'est cliqué. « Les passeurs de brume » est semé dans un
 * compte jetable, supprimé à la fin (GARDER=1 le garde, ses accès écrits dans GARDER_DANS) ; « Électro Nick »,
 * livre de la bibliothèque locale, se lit sans compte.
 */
const dossier = "test-results/captures/accueil";
const marge = 8;

test.use({ deviceScaleFactor: 2, viewport: { width: 1366, height: 768 }, actionTimeout: 15_000 });
test.afterEach(async () => {
  if (!process.env.GARDER) await supprimerComptes();
});

/** Une vue qui échoue n'arrête pas les suivantes. */
const vue = async (nom: string, faire: () => Promise<void>) => {
  try {
    await faire();
  } catch (e) {
    console.log(`Vue « ${nom} » manquée : ${(e as Error).message.split("\n")[0]}`);
  }
};

/** Le morceau d'écran qui couvre ces éléments, avec une petite marge, défilé en vue d'abord. */
async function decouper(page: Page, nom: string, elements: Locator[], { marge: m = marge, hauteur }: { marge?: number; hauteur?: number } = {}) {
  await elements[0].scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  // La pastille de développement de Next.js n'est pas de l'application
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  const defile = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
  const boites = await Promise.all(elements.map(async (e) => (await e.boundingBox())!));
  const x = Math.max(0, Math.min(...boites.map((b) => b.x)) - m) + defile.x;
  const y = Math.max(0, Math.min(...boites.map((b) => b.y)) - m) + defile.y;
  const droite = Math.max(...boites.map((b) => b.x + b.width)) + m + defile.x;
  const bas = hauteur ? y + hauteur : Math.max(...boites.map((b) => b.y + b.height)) + m + defile.y;
  await page.screenshot({ path: `${dossier}/${nom}.png`, fullPage: true, clip: { x, y, width: droite - x, height: bas - y } });
}

/** Le plus petit élément qui contient ce texte de départ et aussi cet autre texte : une carte, un cadre. */
async function enveloppe(page: Page, depart: Locator, aussi: string): Promise<Locator> {
  const marque = `d${Math.random().toString(36).slice(2)}`;
  await depart.first().evaluate((el, [a, m]) => {
    let e: Element | null = el;
    while (e && !(e.textContent ?? "").includes(a)) e = e.parentElement;
    e?.setAttribute("data-decoupe", m);
  }, [aussi, marque] as const);
  return page.locator(`[data-decoupe="${marque}"]`);
}
const plein = (page: Page, nom: string) => page.screenshot({ path: `${dossier}/plein-${nom}.png`, fullPage: true });

/** Une copie du portrait de Lou du compte local, déposée dans le projet jetable : rien n'est partagé avec l'original. */
async function copierLePortrait(base: SupabaseClient, compte: Compte, projetId: string): Promise<string | null> {
  const [source] = await sql<{ chemin: string; chemin_vignette: string; largeur: number; hauteur: number; format: string }>(
    `select i.chemin, i.chemin_vignette, i.largeur, i.hauteur, i.format from personnages p join images i on i.id = p.portrait_id
     where p.nom = 'Lou' and p.enseignant_id <> $1 order by i.cree_le desc limit 1`,
    [compte.id],
  );
  if (!source) return null;
  const id = crypto.randomUUID();
  const extension = (c: string) => c.split(".").pop();
  const chemins = [`${compte.id}/${projetId}/${id}.${extension(source.chemin)}`, `${compte.id}/${projetId}/${id}-v.${extension(source.chemin_vignette)}`];
  for (const [i, origine] of [source.chemin, source.chemin_vignette].entries()) {
    const { data, error } = await service().storage.from("images").download(origine);
    if (error || !data) throw new Error(error?.message ?? "portrait introuvable");
    const envoi = await service().storage.from("images").upload(chemins[i], Buffer.from(await data.arrayBuffer()), { contentType: data.type });
    if (envoi.error) throw new Error(envoi.error.message);
  }
  const { error } = await base.from("images").insert({
    id, projet_id: projetId, enseignant_id: compte.id, chemin: chemins[0], chemin_vignette: chemins[1], largeur: source.largeur, hauteur: source.hauteur, format: source.format,
  });
  if (error) throw new Error(error.message);
  return id;
}

/** « Les passeurs de brume » en cours d'année, comme l'histoire d'essai : plan, visuels, élèves, consignes, textes et choix. */
async function semerLesPasseurs(base: SupabaseClient, compte: Compte, classeId: string, eleves: Record<string, { id: string }>) {
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classeId);
  await sql("update projets set visuel_defaut = $2 where id = $1", [projet, VISUELS.projet]);
  await sql(
    `update preparations set univers = $2, personnages = $3, enjeu = $4, rubrique_jeu = true, feuille = $5, regles = $6, formule_renvoi = $7, constructions = $8
     where projet_id = $1`,
    [projet, PREPARATION.univers, PREPARATION.personnages, PREPARATION.enjeu, JSON.stringify(FEUILLE), PREPARATION.regles, PREPARATION.formuleRenvoi, [...PREPARATION.constructions]],
  );
  for (const [rubrique, texte, etat] of PISTES) await base.from("pistes").insert({ projet_id: projet, enseignant_id: compte.id, rubrique, texte, etat, origine: "main" });
  const portrait = await copierLePortrait(base, compte, projet);
  const personnages = await base.from("personnages").insert([
    {
      projet_id: projet, enseignant_id: compte.id, nom: "Lou", heros: true, rang: 0, portrait_id: portrait,
      fiche: "Un garçon de 10 ans aux cheveux bruns en bataille, ciré jaune, pull vert, bottes de pluie noires ; une petite lanterne de cuivre à la main.",
      description: "Lou, 10 ans, fils du dernier passeur du village. Il connaît le chant des lanternes mais a peur de l’eau.\nIl garde toujours sur lui la petite lanterne de son père.",
    },
    { projet_id: projet, enseignant_id: compte.id, nom: "Marius", heros: false, rang: 1, fiche: "", description: "Le père de Lou, parti chercher la première lanterne." },
    { projet_id: projet, enseignant_id: compte.id, nom: "Plume", heros: false, rang: 2, fiche: "", description: "La chouette messagère, aux plumes argentées : elle montre le chemin sans parler." },
  ]);
  if (personnages.error) throw new Error(personnages.error.message);
  for (const [nom, description] of OBJETS) await base.from("objets").insert({ projet_id: projet, enseignant_id: compte.id, nom, description });
  for (const texte of FORMULES) await base.from("formules").insert({ projet_id: projet, enseignant_id: compte.id, texte });

  const ids = new Map<number, string>();
  const chapitres: Record<string, string> = {};
  const scenes = PARTIES.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
  for (const partie of PARTIES) {
    const posee = await semerPartie(base, projet, partie.titre, partie.chapitres.map((c) => ({ titre: c.titre, scenes: c.scenes.map((s) => s.titre) })), VISUELS[partie.cle]);
    for (const [k, chapitre] of partie.chapitres.entries()) {
      const ch = posee.chapitres[k];
      chapitres[chapitre.cle] = ch.id;
      await sql("update chapitres set couleur = $2, resume = $3, visuel_defaut = $4 where id = $1", [ch.id, chapitre.couleur, RESUMES[chapitre.cle] ?? "", VISUELS[chapitre.cle]]);
      if (chapitre.eleves.length) await semerAttribution(base, ch.id, chapitre.eleves.map(([prenom, profil]) => ({ eleve: eleves[prenom].id, profil })));
      for (const [j, s] of chapitre.scenes.entries()) {
        ids.set(s.ref, ch.scenes[j]);
        // La consigne et sa liste de vérification (F13.2) : les tirets des consignes d'essai deviennent la liste
        const lignes = (s.sansConsigne ? "" : (CONSIGNES[s.ref] ?? "")).split("\n");
        const liste = lignes.filter((l) => /^\s*[–-]\s/.test(l)).map((l) => l.replace(/^\s*[–-]\s*/, "").replace(/\s*[;.]?$/, "").slice(0, 78)).map((l) => `${l[0].toUpperCase()}${l.slice(1)}${/[?!.…]$/.test(l) ? "" : "."}`);
        await sql("update scenes set consigne = $2, fin = $3, prise_par_eleve = $4, verification = $5 where id = $1", [
          ch.scenes[j], lignes.filter((l) => !/^\s*[–-]\s/.test(l)).join("\n").trim(), s.fin === true, s.pec ? eleves[s.pec].id : null, liste.slice(0, 8),
        ]);
      }
    }
  }
  let pose = 0;
  for (const s of scenes) {
    const paragraphes = s.vide ? [] : (TEXTES_EN_COURS[s.ref] ?? TEXTES[s.ref] ?? []);
    const actions = s.vide ? [] : (ACTIONS[s.ref] ?? []);
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

  // Une classe en plein travail : quelques scènes avancées, pour que les cartes disent où en est chaque chapitre
  const etat = (refs: number[], e: string) => sql("update scenes set etat = $2 where id = any($1)", [refs.map((r) => ids.get(r)), e]);
  await etat([1, 16, 22], "valide");
  await etat([17], "prete");
  await etat([2, 21], "valider");
  await etat([3], "reprendre");
  // Adam s'occupe d'une scène remise du sommet : ses encouragements se donnent sur la page de la scène
  await semerAttribution(base, chapitres.sommet, [{ eleve: eleves.Adam.id }]);
  await semerBlocs(base, ids.get(60)!, (TEXTES[60] ?? ["Au sommet, Lou retrouve son père, assis près de la grande lanterne éteinte."]).map((t) => recit(t)));
  await sql("update scenes set prise_par_eleve = $2, etat = 'valider' where id = $1", [ids.get(60), eleves.Adam.id]);
  return { projet, ids, chapitres };
}

test.describe(() => {
// Densité 3 : ces éléments sont plus petits qu'en octobre (colonne de navigation, cartes resserrées) ; on retrouve la
// définition des originaux
test.use({ deviceScaleFactor: 3 });
test("Accueil : les écrans de l'outil, « Les passeurs de brume » en cours d'année", async ({ page, browser }) => {
  test.setTimeout(600_000);
  const { compte, base } = await adultePret(page);
  await base.from("enseignants").update({ nom_affiche: "Mme Laurent" }).eq("id", compte.id);
  const classe = await creerClasse(page, "CM1-CM2 d’essai");
  await inscrire(page, classe.id, [...ELEVES]);
  const codes = await lireCodes(page, classe.id);
  const eleves = await elevesDe(base, classe.id);
  const { projet, ids } = await semerLesPasseurs(base, compte, classe.id, eleves);
  if (process.env.GARDER_DANS) {
    writeFileSync(process.env.GARDER_DANS, JSON.stringify({ courriel: compte.courriel, motDePasse: compte.motDePasse, projet, classe, scenes: Object.fromEntries(ids) }, null, 2));
  }

  // 12, temps 1 : le héros et ce que la classe en a retenu
  await vue("prep-heros", async () => {
    await aller(page, `/projet/${projet}/preparation?etape=personnages`);
    const carte = page.getByRole("button", { name: "Ouvrir la carte de Lou" });
    await carte.waitFor();
    if (process.env.PLEIN) await plein(page, "preparation");
    const retenons = await enveloppe(page, page.getByText("Nous retenons…"), "Reprendre les idées retenues");
    await decouper(page, "prep-heros", [carte, retenons]);
  });

  // 12, temps 1 : deux cartes de chapitre et deux cartes de scène, découpées pour le collage
  await vue("prep-chapitres", async () => {
    await aller(page, `/projet/${projet}/plan`);
    await page.getByText("La lisière").first().waitFor();
    if (process.env.PLEIN) await plein(page, "plan");
    for (const [nom, titre] of [["prep-chapitre-1", "La lisière"], ["prep-chapitre-2", "Le gué des saules"]]) {
      const carte = await enveloppe(page, page.getByText(titre, { exact: true }), "Ouvrir");
      await decouper(page, nom, [carte], { marge: 0 });
    }
  });
  await vue("prep-scenes", async () => {
    const [ligne] = await sql<{ chapitre_id: string }>("select chapitre_id from scenes where id = $1", [ids.get(14)]);
    await aller(page, `/projet/${projet}/chapitre/${ligne.chapitre_id}?vue=scenes`);
    await page.getByText("les lanternes s’éteignent").first().waitFor();
    if (process.env.PLEIN) await plein(page, "chapitre");
    await page.mouse.move(0, 0);
    for (const [nom, titre] of [["prep-scene-1", "Lisière — les lanternes s’éteignent"], ["prep-scene-2", "Sentier — le chant dans les fougères"]]) {
      await decouper(page, nom, [page.locator("article.fiche").filter({ hasText: titre })], { marge: 0 });
    }
  });

  // 12, temps 2 : la fiche de rédaction (la première feuille, celle d'Alice)
  await vue("ecrire-fiche", async () => {
    await aller(page, `/projet/${projet}/fiches`);
    await page.locator(".fr-partie").first().waitFor();
    if (process.env.PLEIN) await plein(page, "fiches");
    // Le haut de la feuille, comme l'original : la première scène entière se lit sans agrandir
    await decouper(page, "ecrire-fiche", [page.locator(".fr-partie").first()], { marge: 24, hauteur: 515 });
  });

  // 33 : les deux sortes de récit, à la création d'un projet
  await vue("classe-recits", async () => {
    await aller(page, "/projets/nouveau");
    await page.getByRole("radio", { name: /Ma classe/ }).click();
    await page.getByRole("button", { name: "Continuer" }).click();
    await page.getByRole("radio", { name: /À choix/ }).click();
    await page.mouse.move(0, 0);
    if (process.env.PLEIN) await plein(page, "nouveau");
    await decouper(page, "classe-recits", [page.getByRole("radiogroup")], { marge: 4 });
  });

  // 33 : les étiquettes des élèves, Chloé et Dylan côte à côte
  await vue("classe-etiquettes", async () => {
    await aller(page, `/classes/${classe.id}/imprimer?quoi=etiquettes`);
    await page.getByText("Ton code").first().waitFor();
    if (process.env.PLEIN) await plein(page, "etiquettes");
    const etiquette = async (prenom: string) => enveloppe(page, page.locator('[role="img"] span').getByText(prenom, { exact: true }), "Ton code");
    await decouper(page, "classe-etiquettes-2", [await etiquette("Chloé"), await etiquette("Dylan")], { marge: 2 });
  });

  // 33 : les encouragements, sur la page de la scène remise par Adam, « Effort » donné
  await vue("classe-encouragements", async () => {
    await aller(page, `/projet/${projet}/scene/${ids.get(60)}`);
    const cadre = page.locator('section[aria-labelledby="encouragements-t"]');
    await cadre.waitFor();
    await cadre.getByRole("button", { name: /Effort/ }).click();
    await page.waitForTimeout(1500);
    await page.mouse.move(0, 0);
    if (process.env.PLEIN) await plein(page, "scene-adam");
    await decouper(page, "classe-encouragements", [cadre], { marge: 4 });
  });

  // 33 : le code secret, sur l'ordinateur de la classe
  await vue("classe-code", async () => {
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 1366, height: 768 }, deviceScaleFactor: 3 });
    const poste = await contexte.newPage();
    await aller(poste, "/classe");
    await poste.getByLabel("Identifiant de la classe").fill(classe.identifiant);
    await poste.getByLabel("Mot de passe de la classe").fill(classe.motDePasse);
    await poste.getByRole("button", { name: "Entrer", exact: true }).click();
    await poste.getByRole("button", { name: "Maëlys", exact: true }).click();
    await poste.getByLabel("Chiffre 1").pressSequentially(codes["Maëlys"].slice(0, 3));
    await poste.waitForTimeout(500);
    if (process.env.PLEIN) await plein(poste, "code");
    await decouper(poste, "classe-code", [poste.locator('section[aria-labelledby="titre-code"]')], { marge: 0 });
    await contexte.close();
  });
});

});

/**
 * « Électro Nick », livre de la bibliothèque locale (importé de la V0) : un passage lu en ligne, sans compte, et sa mise
 * en page, depuis le compte local (V1/app/.compte-local, sur localhost seulement : rien n'y est écrit que l'étape du
 * Livre ouverte en dernier). Puis l'image de partage : le premier écran de l'accueil, en 1200 × 630.
 */
test("Accueil : « Électro Nick » lu en ligne et mis en page ; l'image de partage", async ({ page, browser }) => {
  test.setTimeout(400_000);
  const [livre] = await sql<{ id: string }>("select id from projets where titre = 'Électro Nick' order by cree_le limit 1");
  const [passage] = await sql<{ id: string }>("select id from scenes where projet_id = $1 and texte::text like '%Couper humain%' limit 1", [livre.id]);
  const [depart] = await sql<{ id: string }>("select depart_scene_id as id from projets where id = $1", [livre.id]);

  // 12, temps 3 : un passage, son illustration et ses trois choix, dans le lecteur en ligne
  await vue("lecture-electro-nick", async () => {
    await aller(page, "/bibliotheque");
    // « Continuer » ne se propose qu'après un premier pas : le départ, puis le passage voulu
    await page.evaluate(([d, id]) => {
      localStorage.setItem("lecture:bibliotheque:electro-nick", JSON.stringify({ parcours: { etapes: [d, id], position: 1 }, deja: [d], feuille: { compteurs: {}, listes: {}, notes: {} }, des: null }));
    }, [depart.id, passage.id] as const);
    await aller(page, "/lire/bibliotheque/electro-nick");
    await page.waitForTimeout(1500);
    if (process.env.PLEIN) await plein(page, "lecture-depart");
    await page.getByText(/Continuer au passage/).first().click();
    await page.getByText("Couper humain").waitFor();
    await page.waitForTimeout(1500);
    if (process.env.PLEIN) await plein(page, "lecture");
    // Comme l'original : le dernier paragraphe, l'illustration et les trois choix
    const paragraphe = page.locator("p").filter({ hasText: "Couper humain" });
    const choix = await enveloppe(page, page.getByText(/Pour prendre à gauche/), "Pour la droite");
    await paragraphe.evaluate((p) => window.scrollTo(0, p.getBoundingClientRect().top + window.scrollY - 200));
    await decouper(page, "lecture-electro-nick", [paragraphe, choix], { marge: 16 });
  });

  // 12, temps 3 : « Pages peu remplies », la première signalée, dans l'aperçu de « Mettre en page »
  await vue("livre-pages-peu-remplies", async () => {
    const [courriel, motDePasse] = readFileSync(resolve(__dirname, "../../.compte-local"), "utf8").split("\n").map((l) => l.trim());
    await connecter(page, { id: "", courriel, motDePasse });
    await page.waitForURL(/\/projet|\/projets/);
    await aller(page, `/projet/${livre.id}/livre?etape=page`);
    await page.getByRole("tab", { name: "Aperçu" }).or(page.getByRole("button", { name: "Aperçu" })).first().click();
    await page.locator(".apercu__etat").filter({ hasText: "passages" }).first().waitFor({ timeout: 180_000 });
    await page.getByRole("button", { name: "Page peu remplie suivante" }).click();
    await page.waitForTimeout(2500);
    await page.mouse.move(0, 0);
    // Le livre fait des milliers de points de haut : une capture de la fenêtre, agrandie pour l'occasion
    await page.setViewportSize({ width: 1366, height: 1200 });
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    const parcours = page.locator(".parcours--pages");
    await parcours.evaluate((el) => window.scrollBy(0, el.getBoundingClientRect().top - 16));
    await page.waitForTimeout(800);
    if (process.env.PLEIN) await page.screenshot({ path: `${dossier}/plein-mise-en-page.png` });
    const b = (await parcours.boundingBox())!;
    // Jusqu'au bout de la phrase de la carte du blanc (sans « Ouvrir le n° 4 ») : la page de gauche entière, la marge
    // blanche de sa voisine ; en hauteur, jusqu'au pied de la page signalée
    const fin = await page.getByText(/Ce blanc est dans le/).first().evaluate((el) => {
      const texte = [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").includes("Ce blanc"))!;
      const r = document.createRange();
      r.selectNodeContents(texte);
      return Math.max(...[...r.getClientRects()].map((c) => c.right));
    });
    await page.screenshot({ path: `${dossier}/livre-pages-peu-remplies.png`, clip: { x: b.x - 8, y: b.y - 8, width: fin - b.x + 12, height: 738 } });
    await page.setViewportSize({ width: 1366, height: 768 });
  });

  // L'image de partage des pages publiques : le premier écran de l'accueil, sans compte
  await vue("partage", async () => {
    const contexte = await browser.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 1440, height: 800 }, deviceScaleFactor: 2 });
    const visiteur = await contexte.newPage();
    await aller(visiteur, "/");
    await visiteur.waitForTimeout(2500);
    // Le livre et le dragon entiers (sa queue dépasse de la section) ; la mise au format 1200 × 630 se fait à la conversion
    const livre = visiteur.locator('section[aria-labelledby="p1"] > div[class*="livre"]').first();
    const dragon = visiteur.getByRole("img", { name: "Le dragon de la classe, assis à côté du livre" });
    // Le cadre du livre déborde du livre dessiné : l'illustration donne le haut, le dragon le bas et la droite
    await visiteur.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    const image = visiteur.locator('section[aria-labelledby="p1"] figure').first();
    const [l, f, d] = [(await livre.boundingBox())!, (await image.boundingBox())!, (await dragon.boundingBox())!];
    const haut = f.y - 50;
    await visiteur.screenshot({ path: `${dossier}/partage.png`, clip: { x: l.x - 10, y: haut, width: Math.min(1440, d.x + d.width + 24) - (l.x - 10), height: d.y + d.height + 24 - haut } });
    await contexte.close();
  });
});
