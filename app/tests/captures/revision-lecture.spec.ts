import { readFileSync } from "node:fs";
import { test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  action, aller, choixAuto, classeQuiEcrit, figure, liaison, posteDe, recit, semerAttribution, semerBlocs, semerImage, semerPartie, semerProjet, service, sql,
  supprimerComptes, type BlocSeme, type Compte,
} from "../parcours/outils";
import { ACTIONS, CONSIGNES, DEPART, ELEVES, FEUILLE, PARTIES, PREPARATION, TEXTES, TITRE } from "../../scripts/passeurs-de-brume";

/**
 * Captures de la révision d'ergonomie de la lecture (novembre 2026) : la lecture d'essai de l'adulte, celle de
 * l'élève, le lecteur en ligne (lien, « Lire » de l'élève) et la bibliothèque, contre le serveur local, sans
 * recompiler : npx playwright test --config playwright.local.config.ts revision-lecture
 * Elles s'écrivent dans test-results/captures/lecture/. Ce n'est pas un test : rien n'y est vérifié, et une vue
 * qui échoue est notée sans arrêter les suivantes. Le serveur local a de vraies clés : aucun bouton ✦ n'est cliqué.
 */
const dossier = process.env.DOSSIER ?? "test-results/captures/lecture";
let n = process.env.SEULEMENT ? 200 : 0;
const capturer = async (page: Page, nom: string, toute = false) => {
  n += 1;
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${dossier}/${String(n).padStart(2, "0")}-${nom}.png`, fullPage: toute });
};
const vue = async (nom: string, faire: () => Promise<void>) => {
  try {
    await Promise.race([faire(), new Promise((_, non) => setTimeout(() => non(new Error("plus de deux minutes")), 120_000))]);
  } catch (e) {
    console.log(`Vue « ${nom} » manquée : ${(e as Error).message.split("\n")[0]}`);
  }
};
/** SEULEMENT=CDE ne prend que ces parties (A : essai de l'adulte ; C : lien ; D : élève ; E : bibliothèque). */
const partie = (x: string) => !process.env.SEULEMENT || process.env.SEULEMENT.includes(x);
const TAILLES = { grand: { width: 1366, height: 768 }, moyen: { width: 1024, height: 768 }, tel: { width: 390, height: 844 } };

test.use({ actionTimeout: 15_000 });
test.afterEach(async () => {
  await supprimerComptes();
});
test.beforeEach(async () => {
  await sql("delete from essais_entree");
});

/** Une image du projet, son fichier déposé, assez définie pour une pleine page. */
async function imageDeposee(base: SupabaseClient, compte: Compte, projet: string, nom: string): Promise<string> {
  const id = await semerImage(base, compte, projet);
  for (const [suffixe, fichier] of [["", `defaut-${nom}.jpg`], ["-v", `defaut-${nom}-v.jpg`]]) {
    await service().storage.from("images").upload(`${compte.id}/${projet}/${id}${suffixe}.jpg`, readFileSync(`public/illustrations/${fichier}`), { contentType: "image/jpeg", upsert: true });
  }
  await sql("update images set largeur = 2400, hauteur = 3400 where id = $1", [id]);
  return id;
}

/** « Les passeurs de brume » entier, toutes les scènes écrites et prêtes (repris de revision-livre). */
async function semerLesPasseurs(base: SupabaseClient, compte: Compte, classeId: string, eleves: Record<string, { id: string }>) {
  const projet = await semerProjet(base, compte, "classe", "choix", TITRE, classeId);
  await sql(
    `update preparations set univers = $2, personnages = $3, enjeu = $4, rubrique_jeu = true, feuille = $5, regles = $6, formule_renvoi = $7, constructions = $8
     where projet_id = $1`,
    [projet, PREPARATION.univers, PREPARATION.personnages, PREPARATION.enjeu, JSON.stringify(FEUILLE), PREPARATION.regles, PREPARATION.formuleRenvoi, [...PREPARATION.constructions]],
  );
  const ids = new Map<number, string>();
  const scenes = PARTIES.flatMap((p) => p.chapitres.flatMap((c) => c.scenes));
  for (const [i, partie] of PARTIES.entries()) {
    const posee = await semerPartie(base, projet, partie.titre, partie.chapitres.map((c) => ({ titre: c.titre, scenes: c.scenes.map((s) => s.titre) })), ["mer", "foret", "montagne", "cite"][i % 4]);
    for (const [k, chapitre] of partie.chapitres.entries()) {
      const ch = posee.chapitres[k];
      const avec = chapitre.eleves.filter(([prenom]) => eleves[prenom]);
      if (avec.length) await semerAttribution(base, ch.id, avec.map(([prenom, profil]) => ({ eleve: eleves[prenom].id, profil })));
      for (const [j, s] of chapitre.scenes.entries()) {
        ids.set(s.ref, ch.scenes[j]);
        await sql("update scenes set consigne = $2, fin = $3 where id = $1", [ch.scenes[j], CONSIGNES[s.ref] ?? "", s.fin === true || (!s.choix?.length && !s.cachee)]);
      }
    }
  }
  let pose = 0;
  for (const s of scenes) {
    const paragraphes = TEXTES[s.ref] ?? [`${s.titre.split(" — ").pop()} : Lou avance dans la brume, la lanterne levée, et regarde autour de lui avant de choisir.`];
    const actions = ACTIONS[s.ref] ?? [];
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
    await semerBlocs(base, ids.get(s.ref)!, blocs);
  }
  for (const s of scenes) if (s.cachee && ids.get(s.cachee.cible)) await sql("update scenes set numero_fixe = $2 where id = $1", [ids.get(s.cachee.cible), s.cachee.numero]);
  await base.from("projets").update({ depart_scene_id: ids.get(DEPART), lecture_ouverte: true }).eq("id", projet);
  return { projet, ids, scenes };
}

test("Lecture : essai de l'adulte et de l'élève, lecteur en ligne, bibliothèque, 1366, 1024 et 390 px", async ({ page, browser }) => {
  test.setTimeout(900_000);
  const s = await classeQuiEcrit(page, [...ELEVES]);
  await sql("delete from projets where id = $1", [s.projet]);
  const { base, compte } = s;
  const p = await semerLesPasseurs(base, compte, s.classe.id, s.eleves);
  const scene = (ref: number) => p.ids.get(ref)!;
  // Une image pleine page en tête de la scène où mène le premier choix du départ (F10-AC36)
  const deuxieme = p.scenes.find((x) => x.ref === DEPART)!.choix![0][1];
  const pleine = await imageDeposee(base, compte, p.projet, "chateau");
  const [{ texte }] = await sql<{ texte: BlocSeme[] }>("select texte from scenes where id = $1", [scene(deuxieme)]);
  await semerBlocs(base, scene(deuxieme), [{ ...figure(pleine, 100), page: true }, ...texte]);
  // Une image dans le texte d'une scène à action
  const vignette = await imageDeposee(base, compte, p.projet, "foret");
  const [{ texte: t5 }] = await sql<{ texte: BlocSeme[] }>("select texte from scenes where id = $1", [scene(5)]);
  await semerBlocs(base, scene(5), [...t5.slice(0, 1), { ...figure(vignette, 65), legende: "La lisière, au matin." }, ...t5.slice(1)]);
  await sql("update scenes set etat = 'prete' where projet_id = $1", [p.projet]);
  // Un passage long : six paragraphes de plus après le récit de S004
  const longue = 4;
  const [{ texte: t4 }] = await sql<{ texte: BlocSeme[] }>("select texte from scenes where id = $1", [scene(longue)]);
  const recits = t4.filter((b) => b.type === "p");
  await semerBlocs(base, scene(longue), [...recits, ...[...TEXTES[5] ?? [], ...TEXTES[2] ?? [], ...TEXTES[3] ?? []].map((t) => recit(t)), ...t4.filter((b) => b.type !== "p")]);
  const fin = p.scenes.find((x) => x.fin)?.ref ?? p.scenes.find((x) => !x.choix?.length && !x.cachee)!.ref;
  const enigme = p.scenes.find((x) => x.cachee)?.ref;

  const lecture = (depart?: string) => `/projet/${p.projet}/lecture?${depart ? `depart=${depart}&` : ""}de=onglet&onglet=livre`;

  // ——— A. La lecture d'essai de l'adulte ———
  for (const [taille, dim] of Object.entries(TAILLES)) {
    if (!partie("A")) break;
    await page.setViewportSize(dim);
    const t = taille === "grand" ? "" : `${taille}-`;
    await vue(`${t}par-ou-commencer`, async () => {
      await aller(page, lecture());
      await capturer(page, `A-${t}par-ou-commencer`);
      if (taille !== "moyen") {
        await page.getByPlaceholder("Rechercher une scène").fill("souche");
        await capturer(page, `A-${t}par-ou-commencer-recherche`);
      }
    });
    await vue(`${t}depart`, async () => {
      await aller(page, lecture());
      await page.getByRole("link", { name: /Commencer au départ/ }).click();
      await page.locator(".lu-page").waitFor();
      await capturer(page, `A-${t}depart`);
      if (taille !== "moyen") await capturer(page, `A-${t}depart-toute`, true);
      // Le premier choix : la scène qui commence par une image pleine page
      await page.locator("button.lu-choix").first().click();
      await page.waitForTimeout(500);
      await capturer(page, `A-${t}image-pleine-page`);
      if (taille === "grand") await capturer(page, `A-${t}image-pleine-page-toute`, true);
      await page.locator("button.lu-choix").first().click().catch(() => undefined);
      await page.locator(".lecture__parcours-b").first().click();
      await capturer(page, `A-${t}parcours-ouvert`);
    });
    await vue(`${t}action`, async () => {
      await aller(page, lecture(scene(5)));
      await page.locator(".lu-page").waitFor();
      await capturer(page, `A-${t}action-et-image`);
      await page.locator(".lu-action--feuille").first().click();
      await capturer(page, `A-${t}action-feuille-ouverte`);
    });
    await vue(`${t}de`, async () => {
      await aller(page, lecture(scene(52)));
      await page.locator(".lu-page").waitFor();
      await page.locator(".lu-action--feuille").first().click();
      await page.getByRole("button", { name: /Lancer le dé/ }).first().click().catch(() => undefined);
      await capturer(page, `A-${t}de-lance`);
    });
    if (taille === "moyen") continue;
    await vue(`${t}longue`, async () => {
      await aller(page, lecture(scene(longue)));
      await page.locator(".lu-page").waitFor();
      await capturer(page, `A-${t}passage-long`);
      await capturer(page, `A-${t}passage-long-toute`, true);
    });
    await vue(`${t}regles`, async () => {
      await aller(page, lecture(scene(DEPART)));
      await page.getByRole("button", { name: "Règles du jeu" }).first().click();
      await capturer(page, `A-${t}regles-du-jeu`);
    });
    if (enigme)
      await vue(`${t}enigme`, async () => {
        await aller(page, lecture(scene(enigme)));
        await page.locator(".lu-page").waitFor();
        await capturer(page, `A-${t}enigme`);
      });
    await vue(`${t}fin`, async () => {
      await aller(page, lecture(scene(fin)));
      await page.locator(".lu-page").waitFor();
      await capturer(page, `A-${t}fin`);
    });
  }

  // ——— B. Le partage, par un lien et aux classes ———
  await page.setViewportSize(TAILLES.grand);
  await sql(
    "update projets set mise_en_page_ouverte_le = now(), livre_relu_le = now(), chemins_verifies_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1",
    [p.projet],
  );
  let partage = false;
  await vue("partager", async () => {
    await aller(page, `/projet/${p.projet}/livre?etape=sortie&volet=partager`);
    await page.locator("label.inter", { has: page.getByRole("switch", { name: /À mes classes/ }) }).click();
    const rappel = page.getByRole("group", { name: "À relire avant de partager" });
    await rappel.getByText("J’ai relu le livre sur ces points.").click();
    await rappel.getByRole("button", { name: "Partager" }).click();
    await page.getByText(/À jour depuis le/).first().waitFor({ timeout: 60_000 });
    await capturer(page, "B-partage-fait");
    partage = true;
  });

  /** Les indices des choix à suivre depuis le départ jusqu'à une scène (parcours en largeur). */
  const cheminVers = (cible: number): number[] => {
    const vus = new Map<number, number[]>([[DEPART, []]]);
    const file = [DEPART];
    while (file.length) {
      const ici = file.shift()!;
      if (ici === cible) return vus.get(ici)!;
      (p.scenes.find((x) => x.ref === ici)?.choix ?? []).forEach(([, vers], i) => {
        if (!vus.has(vers)) {
          vus.set(vers, [...vus.get(ici)!, i]);
          file.push(vers);
        }
      });
    }
    return [];
  };
  const finAtteinte = p.scenes.find((x) => (x.fin || (!x.choix?.length && !x.cachee)) && cheminVers(x.ref).length)?.ref ?? fin;
  /** Le lecteur partagé : depuis la page de titre, suivre les choix jusqu'à la scène. */
  const suivreJusqua = async (l: Page, depuis: string, ref: number) => {
    await l.goto(depuis);
    await l.getByRole("button", { name: /Recommencer au début|Commencer la lecture/ }).first().click();
    for (const i of cheminVers(ref)) {
      await l.locator("button.lu-choix").nth(i).click();
      await l.waitForTimeout(250);
    }
    await l.locator(".lecteur__page").first().waitFor();
  };
  const lecteurPartage = async (l: Page, depuis: string, sorte: string, t: string, tout: boolean) => {
    await vue(`${sorte}-${t}lecteur`, async () => {
      await l.goto(depuis);
      await capturer(l, `${sorte}-${t}page-de-titre`);
      if (tout) await capturer(l, `${sorte}-${t}page-de-titre-toute`, true);
      await l.getByRole("button", { name: /Recommencer au début|Commencer la lecture/ }).first().click();
      await capturer(l, `${sorte}-${t}depart`);
      await l.locator("button.lu-choix").first().click();
      await capturer(l, `${sorte}-${t}image-pleine-page`);
      await l.locator(".lecteur__parcours button").first().click();
      await capturer(l, `${sorte}-${t}parcours`);
      await suivreJusqua(l, depuis, 5);
      await capturer(l, `${sorte}-${t}action-et-image`);
      await l.locator(".lu-action--feuille").first().click();
      await capturer(l, `${sorte}-${t}feuille-ouverte`);
      await suivreJusqua(l, depuis, 52);
      await l.locator(".lu-action--feuille").first().click();
      await l.getByRole("button", { name: /Lancer le dé/ }).first().click().catch(() => undefined);
      await capturer(l, `${sorte}-${t}de-lance`);
      if (!tout) return;
      await suivreJusqua(l, depuis, longue);
      await capturer(l, `${sorte}-${t}passage-long`);
      await capturer(l, `${sorte}-${t}passage-long-toute`, true);
      await suivreJusqua(l, depuis, finAtteinte);
      await capturer(l, `${sorte}-${t}fin`);
      await capturer(l, `${sorte}-${t}fin-toute`, true);
      await l.goto(depuis);
      await capturer(l, `${sorte}-${t}reprise`);
      await l.getByRole("button", { name: "Comment lire ce livre" }).click();
      await capturer(l, `${sorte}-${t}comment-lire`);
    });
  };

  // ——— C. La prévisualisation de l'adulte : le lecteur partagé ———
  if (partage && partie("C"))
    for (const [taille, dim] of Object.entries(TAILLES)) {
      await page.setViewportSize(dim);
      await lecteurPartage(page, `/previsualiser/${p.projet}`, "C", taille === "grand" ? "" : `${taille}-`, taille !== "moyen");
    }

  // ——— D. L'élève : la lecture d'essai, puis « Lire » ———
  const alice = await posteDe(browser, s, "Alice");
  if (!partie("D")) await alice.contexte.close();
  for (const [taille, dim] of Object.entries(TAILLES)) {
    if (taille === "moyen" || !partie("D")) continue;
    const t = taille === "grand" ? "" : `${taille}-`;
    await alice.page.setViewportSize(dim);
    await vue(`D-${t}essai`, async () => {
      await alice.page.goto(`/travail/lecture/${p.projet}`);
      await capturer(alice.page, `D-${t}essai-depart`);
      await alice.page.goto(`/travail/lecture/${p.projet}?depart=${scene(DEPART)}`);
      await alice.page.locator(".lu-page").waitFor();
      await capturer(alice.page, `D-${t}essai-passage`);
      await alice.page.goto(`/travail/lecture/${p.projet}?depart=${scene(5)}`);
      await alice.page.locator(".lu-action--feuille").first().click();
      await capturer(alice.page, `D-${t}essai-feuille`);
    });
    await vue(`D-${t}lire`, async () => {
      await alice.page.goto("/travail/lecture");
      await capturer(alice.page, `D-${t}lire`);
    });
    if (partage) await lecteurPartage(alice.page, `/travail/lire/${p.projet}`, "D-lire", t, taille === "grand");
  }
  if (partie("D")) await alice.contexte.close();

  // ——— E. La bibliothèque : un livre d'exemple, sans compte ———
  for (const [taille, dim] of Object.entries(TAILLES)) {
    if (!partie("E")) break;
    const t = taille === "grand" ? "" : `${taille}-`;
    const ctx = await browser.newContext({ baseURL: "http://localhost:4840", viewport: dim, locale: "fr-FR", ...(taille === "tel" ? { isMobile: true, hasTouch: true } : {}) });
    const l = await ctx.newPage();
    await vue(`E-${t}bibliotheque`, async () => {
      await l.goto("/lire/bibliotheque/bouquin-mene-l-enquete");
      await capturer(l, `E-${t}bibliotheque-page-de-titre`);
      await l.getByRole("button", { name: "Commencer la lecture" }).click();
      await capturer(l, `E-${t}bibliotheque-depart`);
      await l.locator("button.lu-choix").first().click();
      await capturer(l, `E-${t}bibliotheque-passage-2`);
      await l.getByRole("button", { name: "Ma feuille" }).first().click().catch(() => undefined);
      await capturer(l, `E-${t}bibliotheque-feuille`);
    });
    await ctx.close();
  }
});
