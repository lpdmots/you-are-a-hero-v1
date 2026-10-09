// Points 11, 12 et 13 — Durée, mémoire et taille ; polices incorporées ;
// même entrée, même pagination deux fois de suite.
import { statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, exporter, lirePdf, normaliser, noter, livreEssai, RACINE } from './outils.mjs';
import { policesDuPdf } from '../outils/lire-pdf.mjs';
import { dossierDuLivre } from '../serveur.mjs';

test('durée, mémoire et taille de l\'export du livre d\'essai, trois fois de suite', async ({ serveur }) => {
  const livre = await livreEssai(serveur);
  const dossier = join(dossierDuLivre().dossier, 'images');
  const poidsImages = readdirSync(dossier).reduce((t, f) => t + statSync(join(dossier, f)).size, 0);
  const essais = [];
  for (let i = 0; i < 3; i++) essais.push(await exporter(serveur, 'definitif', 'essai', { frais: true }));
  const max = (f) => Math.max(...essais.map(f));
  const mesure = {
    livre: { scenes: livre.scenes.length, pages: essais[0].pages, images: 30, poidsDesImagesMo: +(poidsImages / 1048576).toFixed(1) },
    dureeTotaleMs: essais.map((e) => e.durees.total),
    lancementChromiumMs: essais.map((e) => e.durees.lancementChromium),
    miseEnPageMs: essais.map((e) => e.durees.miseEnPage),
    impressionMs: essais.map((e) => e.durees.impression),
    ajustementDesPagesMs: essais.map((e) => e.durees.ajustementDesPages),
    picMemoireChromiumMo: essais.map((e) => e.memoire.picChromiumMo),
    picMemoireNodeMo: essais.map((e) => e.memoire.picNodeMo),
    taillePdfMo: +(essais[0].tailleOctets / 1048576).toFixed(2),
    machine: 'Apple M5 Pro, macOS, Chromium sans interface de Playwright 1.63',
  };
  noter('export', mesure);
  // Limites documentées d'une fonction Vercel : 300 s par défaut, 2 Go par défaut.
  expect(max((e) => e.durees.total)).toBeLessThan(300_000);
  expect(max((e) => e.memoire.picChromiumMo + e.memoire.picNodeMo)).toBeLessThan(2048);
  expect(essais[0].pages).toBeGreaterThanOrEqual(120);
  expect(essais[0].pages).toBeLessThanOrEqual(150);
});

test('polices : toutes incorporées, et seulement celles du livre', async ({ serveur }) => {
  for (const genre of ['travail', 'definitif']) {
    const r = await exporter(serveur, genre);
    const polices = await policesDuPdf(r.fichier);
    expect(polices.length).toBeGreaterThan(0);
    expect(polices.filter((p) => !p.incorporee), genre).toEqual([]);
    const familles = [...new Set(polices.map((p) => p.nom.replace(/^\/[A-Z]{6}\+/, '').replace(/-.*/, '')))].sort();
    expect(familles, genre).toEqual(['AtkinsonHyperlegible', 'Literata']);
    if (genre === 'definitif') noter('polices', polices.map((p) => `${p.nom.replace(/^\/[A-Z]{6}\+/, '')} (${p.sousType.slice(1)})`));
  }
});

test('même entrée, même pagination : deux exports successifs donnent les mêmes lignes aux mêmes endroits', async ({ serveur }) => {
  const a = await lirePdf((await exporter(serveur, 'definitif', 'essai', { frais: true })).fichier);
  const b = await lirePdf((await exporter(serveur, 'definitif', 'essai', { frais: true })).fichier);
  expect(a.length).toBe(b.length);
  for (let i = 0; i < a.length; i++) {
    expect(a[i].lignes.map((l) => normaliser(l.texte)), `page ${i + 1}`).toEqual(b[i].lignes.map((l) => normaliser(l.texte)));
    expect(a[i].lignes.map((l) => [l.x.toFixed(2), l.y.toFixed(2)]), `page ${i + 1}`).toEqual(b[i].lignes.map((l) => [l.x.toFixed(2), l.y.toFixed(2)]));
  }
});
