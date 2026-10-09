// Point 15 — Image en ligne (F10, décision du 3 octobre 2026) : hauteur du
// texte, sans réglage ; interlignage inchangé ; aperçu et PDF identiques.
// La lisibilité d'un symbole imprimé à cette taille se juge sur le PDF.
import { test, expect, exporter, lirePdf, ouvrir, lignesApercu, normaliser, noter, PT } from './outils.mjs';

test('interlignage inchangé dans les paragraphes qui portent une image en ligne', async ({ serveur }) => {
  const { navigateur, page } = await ouvrir(serveur, { params: { rendu: '1', marques: '0' } });
  const mesures = await page.evaluate(() => {
    const plage = document.createRange();
    const hautsDe = (para) => {
      const hauts = [];
      const marcheur = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
      for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
        plage.selectNodeContents(n);
        for (const r of plage.getClientRects()) if (r.width > 0 && !hauts.some((h) => Math.abs(h - r.top) < 5)) hauts.push(r.top);
      }
      return hauts.sort((a, b) => a - b);
    };
    return [...document.querySelectorAll('img.en-ligne')].map((img) => {
      const para = img.closest('p');
      const hauts = hautsDe(para);
      const pas = hauts.slice(1).map((h, i) => +(h - hauts[i]).toFixed(2));
      const s = getComputedStyle(para);
      return { genre: para.className, scene: para.dataset.scene, lignes: hauts.length, pas, interligne: parseFloat(s.lineHeight), corps: parseFloat(s.fontSize), hauteurImage: img.getBoundingClientRect().height, hauteurBloc: para.getBoundingClientRect().height, marges: parseFloat(s.paddingTop) + parseFloat(s.paddingBottom) + parseFloat(s.borderTopWidth) + parseFloat(s.borderBottomWidth) };
    });
  });
  await navigateur.close();
  expect(mesures.length).toBe(5); // trois symboles dans l'énigme, un dans un récit, un dans une action de jeu
  for (const m of mesures) {
    // L'image a la hauteur du texte, sans réglage.
    expect(Math.abs(m.hauteurImage - m.corps), `${m.scene} : hauteur de l'image`).toBeLessThan(0.05);
    // Toutes les lignes gardent le même pas, celui de l'interligne du paragraphe.
    for (const p of m.pas) expect(Math.abs(p - m.interligne), `${m.scene} : pas de ligne ${p}`).toBeLessThan(0.05);
    // Et le paragraphe ne grandit pas : sa hauteur est un nombre entier de lignes.
    expect(Math.abs(m.hauteurBloc - m.marges - m.lignes * m.interligne), `${m.scene} : hauteur du paragraphe`).toBeLessThan(0.1);
  }
  noter('imageEnLigne', { hauteurMm: +((mesures[0].hauteurImage * 25.4) / 96).toFixed(2), corpsPt: +(mesures[0].corps * 0.75).toFixed(1), paragraphes: mesures.map((m) => `${m.scene} ${m.genre} : ${m.lignes} lignes au pas de ${m.interligne} px`) });
});

test('image en ligne : même page et mêmes lignes dans l\'aperçu et le PDF, à la hauteur du texte dans le PDF', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier, { images: true });
  const { navigateur, page } = await ouvrir(serveur);
  const apercu = await lignesApercu(page);
  const folios = await page.evaluate(() => [...new Set([...document.querySelectorAll('img.en-ligne')].map((i) => Number(i.closest('.pagedjs_page').dataset.folio)))]);
  await navigateur.close();
  expect(folios.length).toBeGreaterThanOrEqual(3);
  let symboles = 0;
  for (const f of folios) {
    expect(apercu[f - 1].lignes.map(normaliser), `page ${f}`).toEqual(pdf[f - 1].lignes.map((l) => normaliser(l.texte)));
    const petites = pdf[f - 1].images.filter((i) => i.hauteur < 20);
    // Hauteur du texte qui le porte : 12 points dans le récit, 10,5 dans une action de jeu.
    for (const i of petites) expect(Math.min(Math.abs(i.hauteur - 12), Math.abs(i.hauteur - 10.5)), `page ${f} : hauteur du symbole en points`).toBeLessThan(0.1);
    symboles += petites.length;
    // Le pas des lignes du PDF reste régulier sur la page : 17 points, ou un multiple après un espace entre blocs.
    const y = pdf[f - 1].lignes.map((l) => l.y);
    const pas = y.slice(1).map((v, k) => +(y[k] - v).toFixed(1));
    expect(pas.filter((p) => p > 0 && p < 13.5), `page ${f} : lignes resserrées`).toEqual([]);
  }
  expect(symboles).toBe(5);
  noter('imageEnLigneDansLePdf', { pages: folios });
});
