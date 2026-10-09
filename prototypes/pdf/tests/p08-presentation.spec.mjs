// Point 8 — Pages de présentation, feuille d'aventure, folios
// (F11-AC12, AC28, AC29, F04-AC19). Hypothèse de l'essai, non décidée : les
// pages de présentation comptent dans la pagination sans folio imprimé.
import { test, expect, exporter, lirePdf, livreEssai, normaliser, PT } from './outils.mjs';

const texteDe = (page) => page.elements.map((e) => e.texte.trim()).join(' ');

test('F11-AC12 : titre, auteurs, mode d\'emploi, feuille d\'aventure, récit et page de fin dans le même fichier', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const livre = await livreEssai(serveur);
  expect(texteDe(pdf[0])).toMatch(/Les passeurs de brume.*Un livre dont tu es le héros.*Classe de CM1-CM2.*2026-2027/);
  for (const prenom of livre.presentation.auteurs) expect(texteDe(pdf[1])).toContain(prenom); // F11-AC28 : prénoms seuls
  expect(livre.presentation.auteurs.length).toBe(25);
  expect(texteDe(pdf[2])).toMatch(/Comment lire ce livre.*Règles du jeu/); // F11-AC29
  expect(texteDe(pdf[3])).toMatch(/Feuille d'aventure/);
  expect(texteDe(pdf[4])).toMatch(/La lisière/); // le récit commence en page de droite
  expect(normaliser(texteDe(pdf.at(-1)))).toContain(normaliser('imaginé, écrit et illustré par les élèves'));
});

test('F04-AC19 : la feuille d\'aventure présente les sections composées, et aucune autre', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const feuille = texteDe(pdf[3]);
  expect(feuille).toMatch(/TON HÉROS.*Volonté.*départ : 5.*Temps.*départ : 12.*INVENTAIRE.*NUMÉROS ET INDICES/);
  const titres = pdf[3].elements.filter((e) => /^[A-ZÉÈ' ]{6,}$/.test(e.texte.trim())).map((e) => e.texte.trim());
  expect(titres).toEqual(['TON HÉROS', 'INVENTAIRE', 'NUMÉROS ET INDICES']);
});

test('folios : côté extérieur, égaux au rang de la page, absents des pages de présentation', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const folioDe = (page) => page.elements.filter((e) => e.y < page.zone.bas - 6 && /^\d+$/.test(e.texte.trim()));
  for (const page of pdf.slice(0, 4)) expect(folioDe(page), `page ${page.numero}`).toEqual([]);
  expect(folioDe(pdf.at(-1))).toEqual([]);
  let n = 0;
  for (const page of pdf.slice(4, -1)) {
    const [f, ...autres] = folioDe(page);
    expect(autres.length, `page ${page.numero}`).toBe(0);
    expect(f.texte.trim(), `page ${page.numero}`).toBe(String(page.numero));
    const droite = page.numero % 2 === 1;
    if (droite) expect((f.x + f.largeur) / PT).toBeCloseTo(133, 0);
    else expect(f.x / PT).toBeCloseTo(15, 0);
    n++;
  }
  expect(n).toBe(140);
});
