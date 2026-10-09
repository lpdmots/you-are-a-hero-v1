// Point 2 — Aperçu et PDF identiques à la page près (F11-AC30) : même nombre
// de pages, mêmes lignes sur chaque page, donc mêmes premier et dernier mots.
import { test, expect, exporter, lirePdf, ouvrir, lignesApercu, pagesDifferentes, normaliser, noter, chromium, webkit } from './outils.mjs';

const cas = [
  ['Chromium sans interface, écran ordinaire', { contexte: { deviceScaleFactor: 1 } }],
  ['Chromium complet, écran haute densité', { lancement: { channel: 'chromium' }, contexte: { deviceScaleFactor: 2 } }],
  ['Chromium complet, affichage à 125 %, fenêtre étroite', { lancement: { channel: 'chromium' }, contexte: { deviceScaleFactor: 1.25, viewport: { width: 900, height: 700 } } }],
];
for (const [nom, options] of cas) {
  test(`aperçu = PDF définitif, ligne à ligne — ${nom}`, async ({ serveur }) => {
    const r = await exporter(serveur, 'definitif');
    const pdf = await lirePdf(r.fichier);
    const { navigateur, page } = await ouvrir(serveur, options);
    const apercu = await lignesApercu(page);
    await navigateur.close();
    expect(apercu.length).toBe(pdf.length);
    expect(pagesDifferentes(apercu, pdf)).toEqual([]);
    // Premier et dernier mot de chaque page, comme demandé.
    for (let i = 0; i < pdf.length; i++) {
      if (!pdf[i].lignes.length) continue;
      const a = apercu[i].lignes.map(normaliser);
      const b = pdf[i].lignes.map((l) => normaliser(l.texte));
      expect(a[0].slice(0, 8), `premier mot, page ${i + 1}`).toBe(b[0].slice(0, 8));
      expect(a.at(-1).slice(-8), `dernier mot, page ${i + 1}`).toBe(b.at(-1).slice(-8));
    }
  });
}

test('F11-AC30 : un passage qui commence en haut d\'une page dans l\'aperçu y commence aussi dans le PDF', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const { navigateur, page } = await ouvrir(serveur);
  const hauts = await page.evaluate(() =>
    [...document.querySelectorAll('.pagedjs_page')]
      .filter((p) => p.dataset.folio)
      .map((p) => {
        const premier = p.querySelector('.pagedjs_page_content > div')?.querySelector('h1.partie, h2.numero, p, figure, .choix-groupe');
        return premier?.matches('h2.numero') ? { folio: Number(p.dataset.folio), numero: premier.dataset.numero } : null;
      })
      .filter(Boolean)
  );
  await navigateur.close();
  expect(hauts.length).toBeGreaterThan(1);
  for (const { folio, numero } of hauts) expect(normaliser(pdf[folio - 1].lignes[0].texte), `page ${folio}`).toBe(numero);
});

test('aperçu sous WebKit (moteur de Safari) = PDF définitif', async ({ serveur }) => {
  // Échec attendu et gardé visible : WebKit ne coupe pas les lignes comme Chromium.
  test.fail();
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const { navigateur, page } = await ouvrir(serveur, { moteur: webkit });
  const apercu = await lignesApercu(page);
  const duree = await page.evaluate(() => window.__rapport.dureeMiseEnPage);
  await navigateur.close();
  const ecarts = pagesDifferentes(apercu, pdf);
  noter('fideliteWebKit', { pagesApercu: apercu.length, pagesPdf: pdf.length, pagesDifferentes: ecarts.length, premierePageDifferente: ecarts[0] ?? null, miseEnPageMs: Math.round(duree) });
  expect(apercu.length).toBe(pdf.length);
  expect(ecarts).toEqual([]);
});
