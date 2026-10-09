// Point 1 — Format A5 en vis-à-vis, marge intérieure plus large (F11.3).
import { test, expect, exporter, lirePdf, noter, PT } from './outils.mjs';

test('chaque page mesure 148 × 210 mm', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pages = await lirePdf(r.fichier);
  for (const p of pages) {
    expect(Math.abs(p.largeur / PT - 148), `page ${p.numero}`).toBeLessThan(0.05);
    expect(Math.abs(p.hauteur / PT - 210), `page ${p.numero}`).toBeLessThan(0.05);
  }
  noter('format', { pages: pages.length, largeurMm: +(pages[0].largeur / PT).toFixed(3), hauteurMm: +(pages[0].hauteur / PT).toFixed(3) });
});

test('le texte tient dans la zone de texte, marge intérieure de 20 mm et extérieure de 15 mm, alternées', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pages = await lirePdf(r.fichier);
  let droites = 0;
  let gauches = 0;
  for (const p of pages) {
    // Tout le texte de la page, hors folio et en-tête : rien dans les marges latérales.
    const corps = p.elements.filter((e) => e.y > 20 * PT - 3 && e.y < (210 - 16) * PT + 3);
    if (corps.length < 40) continue;
    const gaucheMm = Math.min(...corps.map((e) => e.x)) / PT;
    const droiteMm = Math.max(...corps.map((e) => e.x + e.largeur)) / PT;
    const impaire = p.numero % 2 === 1; // page de droite : marge intérieure à gauche
    expect(gaucheMm, `page ${p.numero}`).toBeGreaterThan((impaire ? 20 : 15) - 0.2);
    expect(droiteMm, `page ${p.numero}`).toBeLessThan((impaire ? 133 : 128) + 0.3);
    // Une page de texte justifié touche ses deux marges.
    if (p.lignes.length > 12) {
      expect(gaucheMm, `page ${p.numero}`).toBeLessThan((impaire ? 20 : 15) + 0.2);
      impaire ? droites++ : gauches++;
    }
  }
  expect(droites).toBeGreaterThan(30);
  expect(gauches).toBeGreaterThan(30);
});

test('aucune image ne sort des marges, pleines pages comprises', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pages = await lirePdf(r.fichier, { images: true });
  let n = 0;
  for (const p of pages) {
    for (const i of p.images) {
      if (i.hauteur < 20) continue; // images en ligne
      n++;
      expect(i.x, `page ${p.numero}`).toBeGreaterThan(p.zone.gauche - 0.6);
      expect(i.x + i.largeur, `page ${p.numero}`).toBeLessThan(p.zone.droite + 0.6);
      expect(i.y, `page ${p.numero}`).toBeGreaterThan(p.zone.bas - 0.6);
      expect(i.y + i.hauteur, `page ${p.numero}`).toBeLessThan(p.zone.haut + 0.6);
    }
  }
  expect(n).toBe(30);
});
