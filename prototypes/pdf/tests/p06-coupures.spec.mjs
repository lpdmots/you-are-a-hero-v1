// Point 6 — Coupures : phrase de choix et action de jeu jamais coupées ni
// isolées, numéro et titre jamais seuls en bas de page, veuves, orphelines,
// césure française, aucun texte perdu. Les spécifications ne fixent pas encore
// ces règles : les tests décrivent ce que l'essai propose et tient.
import { test, expect, exporter, lirePdf, livreEssai, deposer, ouvrir, normaliser, noter, texte, webkit, chromium } from './outils.mjs';

/** Relevé des coupures de chaque page de l'aperçu. */
const releve = () => {
  const plage = document.createRange();
  const lignesDe = (el) => {
    const hauts = [];
    const marcheur = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
      plage.selectNodeContents(n);
      for (const r of plage.getClientRects()) if (r.width > 0 && !hauts.some((h) => Math.abs(h - r.top) < 5)) hauts.push(r.top);
    }
    return hauts.length;
  };
  let precedent = null; // dernier bloc de la page précédente
  const r = { pages: 0, blocsCoupes: [], isoles: [], apresPleinePage: [], titresSeuls: [], orphelines: [], veuves: [], texteHorsPage: [], coupuresDansUnParagraphe: 0, choixEnHautDePassage: 0 };
  for (const page of document.querySelectorAll('.pagedjs_page')) {
    if (!page.dataset.folio) continue;
    r.pages++;
    const folio = Number(page.dataset.folio);
    const contenu = page.querySelector('.pagedjs_page_content');
    const zone = contenu.getBoundingClientRect();
    const recit = contenu.querySelector('section.recit');
    if (!recit) continue;
    const blocs = [...recit.children];
    for (const b of contenu.querySelectorAll('.choix-groupe, p.choix, p.action, figure.image, p.fin, h2.numero, h1.partie')) {
      if (b.dataset.splitFrom || b.dataset.splitTo) r.blocsCoupes.push({ folio, bloc: b.className, scene: b.dataset.scene });
    }
    const premier = blocs[0];
    if (premier?.matches('.choix-groupe, p.action, p.fin')) {
      // Seul cas admis : l'auteur a placé une image pleine page juste avant ; elle occupe sa page à elle.
      (precedent?.matches('figure.image.page') ? r.apresPleinePage : r.isoles).push({ folio, bloc: premier.className, scene: premier.dataset.scene });
    }
    const dernier = blocs.at(-1);
    precedent = dernier;
    if (dernier?.matches('h2.numero, h1.partie')) r.titresSeuls.push({ folio, scene: dernier.dataset.scene });
    for (const para of recit.querySelectorAll('p.r')) {
      const n = lignesDe(para);
      if (para.dataset.splitTo) {
        r.coupuresDansUnParagraphe++;
        if (n < 2) r.orphelines.push({ folio, scene: para.dataset.scene, lignes: n });
      }
      if (para.dataset.splitFrom && n < 2) r.veuves.push({ folio, scene: para.dataset.scene, lignes: n });
    }
    // Tout le texte de la page est dans la zone de page : rien ne reste dans la colonne de débordement.
    const marcheur = document.createTreeWalker(contenu, NodeFilter.SHOW_TEXT);
    for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
      if (!n.data.trim()) continue;
      plage.selectNodeContents(n);
      for (const q of plage.getClientRects()) if (q.width > 0 && (q.left > zone.right + 1 || q.bottom > zone.bottom + 2)) { r.texteHorsPage.push({ folio, texte: n.data.slice(0, 30) }); break; }
    }
  }
  return r;
};

const controle = (r) => {
  expect(r.blocsCoupes, 'phrase de choix, action, image, numéro ou titre coupé entre deux pages').toEqual([]);
  expect(r.isoles, 'phrase de choix, action ou marque de fin en tête de page, isolée du texte').toEqual([]);
  expect(r.titresSeuls, 'numéro ou titre de partie seul en bas de page').toEqual([]);
  expect(r.orphelines, 'ligne orpheline en bas de page').toEqual([]);
  expect(r.veuves, 'ligne veuve en haut de page').toEqual([]);
  expect(r.texteHorsPage, 'texte resté hors de la page').toEqual([]);
};

test('livre d\'essai : aucun bloc coupé ni isolé, ni veuve ni orpheline, aucun texte hors page', async ({ serveur }) => {
  const { navigateur, page } = await ouvrir(serveur, { params: { rendu: '1', marques: '0' } });
  const r = await page.evaluate(releve);
  const corrigees = await page.evaluate(() => window.__rapport.coupuresCorrigees);
  await navigateur.close();
  controle(r);
  expect(r.coupuresDansUnParagraphe).toBeGreaterThan(60);
  expect(r.apresPleinePage.length).toBe(2); // S023 et S056 : image pleine page placée juste avant les choix
  noter('coupures', { pages: r.pages, choixSeulsApresUnePleinePage: r.apresPleinePage, coupuresDansUnParagraphe: r.coupuresDansUnParagraphe, coupuresRameneesAuDebutDeLigne: corrigees });
});

test('contre-épreuve : sans les règles de coupure, le relevé trouve bien des fautes', async ({ serveur }) => {
  const { navigateur, page } = await ouvrir(serveur, { params: { rendu: '1', marques: '0', coupures: '0' } });
  const r = await page.evaluate(releve);
  await navigateur.close();
  noter('coupuresSansRegles', { blocsCoupes: r.blocsCoupes.length, isoles: r.isoles.length, titresSeuls: r.titresSeuls.length, orphelines: r.orphelines.length, veuves: r.veuves.length });
  expect(r.blocsCoupes.length + r.isoles.length + r.titresSeuls.length).toBeGreaterThan(0);
});

for (const mots of [9, 23, 47, 71]) {
  test(`mêmes règles tenues quand tout le livre est décalé de ${mots} mots`, async ({ serveur }) => {
    const livre = await livreEssai(serveur);
    livre.scenes[0].blocs[0].children[0].text = `${texte(mots)} ${livre.scenes[0].blocs[0].children[0].text}`;
    await deposer(serveur, `decale-${mots}`, livre);
    const { navigateur, page } = await ouvrir(serveur, { params: { rendu: '1', marques: '0', livre: `decale-${mots}` } });
    const r = await page.evaluate(releve);
    await navigateur.close();
    controle(r);
  });
}

test('aucun texte perdu ni répété : le récit du PDF est celui de la composition, dans l\'ordre', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const { html } = await fetch(`${serveur.adresse}/api/composition?marques=0`).then((x) => x.json());
  const recit = html.slice(html.indexOf('<section class="recit">'), html.indexOf('<section class="page-fin">'));
  const source = normaliser(recit.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  const lu = normaliser(pdf.slice(4, -1).flatMap((pg) => pg.lignes.map((l) => l.texte)).join(''));
  expect(lu.length).toBe(source.length);
  expect(lu === source).toBe(true);
});

test('césure française : chaque coupure de mot tombe sur un point de césure du français', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const { html } = await fetch(`${serveur.adresse}/api/composition?marques=0`).then((x) => x.json());
  const brut = html.replace(/<[^>]+>/g, ' ').normalize('NFKC').toLowerCase().replace(/[’']/g, "'").replace(/[\s  ]/g, '');
  // Points de coupure permis : trait d'union conditionnel posé par les motifs de césure, ou trait d'union du texte.
  const permis = new Set();
  const nu = brut.replace(/[­-]/g, '');
  let k = 0;
  for (const c of brut) {
    if (c === '­' || c === '-') permis.add(`${nu.slice(Math.max(0, k - 3), k)}|${nu.slice(k, k + 3)}`);
    else k++;
  }
  const lignes = pdf.slice(4, -1).flatMap((pg) => pg.lignes.map((l) => l.texte.trim()));
  let cesures = 0;
  const fautives = [];
  for (let i = 0; i < lignes.length - 1; i++) {
    if (!/[-‐‑­]$/.test(lignes[i])) continue;
    cesures++;
    const avant = normaliser(lignes[i]);
    const apres = normaliser(lignes[i + 1]);
    if (!permis.has(`${avant.slice(-3)}|${apres.slice(0, 3)}`)) fautives.push(`${lignes[i].slice(-12)} / ${lignes[i + 1].slice(0, 12)}`);
  }
  noter('cesure', { lignes: lignes.length, lignesCoupees: cesures, part: +(cesures / lignes.length).toFixed(3) });
  expect(cesures).toBeGreaterThan(200);
  expect(fautives).toEqual([]);
});

test('mesure : la césure propre au navigateur, sans motifs posés à la composition', async ({ serveur }) => {
  // Relevé, sans exigence : dit seulement si le navigateur coupe les mots tout seul sur cette machine.
  const compter = async (moteur) => {
    const navigateur = await moteur.launch();
    const page = await navigateur.newPage();
    await page.setContent(`<p lang="fr" style="width:60mm;font:12pt serif;text-align:justify;hyphens:auto;-webkit-hyphens:auto">${texte(160)}</p>`);
    const n = await page.evaluate(() => {
      const el = document.querySelector('p');
      const r = document.createRange();
      const t = el.firstChild;
      let coupes = 0;
      let haut = null;
      for (let i = 1; i < t.data.length; i++) {
        r.setStart(t, i); r.setEnd(t, i + 1);
        const q = [...r.getClientRects()].filter((x) => x.width > 0).pop();
        if (!q) continue;
        if (haut !== null && q.top > haut + 5 && /\p{L}/u.test(t.data[i - 1]) && /\p{L}/u.test(t.data[i])) coupes++;
        haut = q.top;
      }
      return coupes;
    });
    await navigateur.close();
    return n;
  };
  noter('cesureDuNavigateur', { chromiumSansInterface: await compter(chromium), webkit: await compter(webkit), note: 'mots coupés sur 160 mots en colonne de 60 mm, macOS' });
});

test('action de jeu mise en valeur à part du récit, même texte dans l\'aperçu et le PDF (F04-AC17)', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const page = pdf.find((pg) => pg.lignes.some((l) => normaliser(l.texte) === normaliser('Ajoute le couteau à ton inventaire.')));
  expect(page).toBeTruthy();
  const ligne = page.lignes.find((l) => normaliser(l.texte) === normaliser('Ajoute le couteau à ton inventaire.'));
  // À part du récit : seule sur sa ligne, en retrait dans son encadré, dans une autre police que le récit.
  expect(ligne.x).toBeGreaterThan(page.zone.gauche + 6);
  const { navigateur, page: apercu } = await ouvrir(serveur);
  const style = await apercu.evaluate(() => {
    const a = [...document.querySelectorAll('p.action')].find((e) => e.textContent.replace(/­/g, '') === 'Ajoute le couteau à ton inventaire.');
    const s = getComputedStyle(a);
    return { police: s.fontFamily, bord: s.borderTopWidth, fond: s.backgroundColor, scene: a.dataset.scene };
  });
  await navigateur.close();
  expect(style.scene).toBe('S015');
  expect(style.police).toMatch(/Atkinson/);
  expect(parseFloat(style.bord)).toBeGreaterThan(0);
});
