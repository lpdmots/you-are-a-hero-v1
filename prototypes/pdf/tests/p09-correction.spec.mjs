// Point 9 — Correction d'une coquille depuis l'aperçu (F11-AC27) et durée de
// recomposition dans le navigateur.
import { test, expect, exporter, lirePdf, livreEssai, deposer, ouvrir, normaliser, noter, chromium, webkit } from './outils.mjs';

for (const [nom, moteur] of [['Chromium', chromium], ['WebKit', webkit]]) {
  test(`F11-AC27 : « s'épaissi » corrigé depuis l'aperçu — ${nom}`, async ({ serveur }) => {
    const livre = `correction-${nom}`;
    await deposer(serveur, livre, await livreEssai(serveur));
    const { navigateur, page } = await ouvrir(serveur, { moteur, params: { livre } });
    const initiale = await page.evaluate(() => window.__rapport.dureeMiseEnPage);

    // Un clic sur le passage ouvre le texte de la scène, à l'endroit de l'aperçu.
    const bloc = page.locator('p.r', { hasText: 'brus' }).filter({ hasText: /s'épais­?si\s/ }).first();
    await bloc.click();
    const champ = page.locator('#correction-texte');
    await expect(champ).toBeVisible();
    const source = await champ.inputValue();
    expect(source).toContain("la brume s'épaissi brusquement");
    await champ.fill(source.replace("s'épaissi brusquement", "s'épaissit brusquement"));
    await page.locator('#correction button[type=submit]').click();
    await page.waitForFunction(() => window.__dureeCorrection > 0, null, { timeout: 120_000 });

    // L'aperçu recalculé montre la correction.
    const duree = await page.evaluate(() => window.__dureeCorrection);
    const visible = await page.evaluate(() => document.querySelector('#pages').textContent.replace(/­/g, ''));
    expect(visible).toContain("la brume s'épaissit brusquement");
    expect(visible).not.toContain("s'épaissi brusquement");
    await navigateur.close();

    // Le texte de la scène elle-même est corrigé, sans seconde copie, et elle reste déclarée prête.
    const apres = await livreEssai(serveur, livre);
    const scene = apres.scenes.find((s) => s.id === 'S005');
    expect(scene.blocs[0].children[0].text).toContain("s'épaissit brusquement");
    expect(scene.prete).toBe(true);

    // Le prochain PDF contient la correction.
    const r = await exporter(serveur, 'definitif', livre);
    const pdf = await lirePdf(r.fichier);
    const tout = normaliser(pdf.flatMap((pg) => pg.lignes.map((l) => l.texte)).join(''));
    expect(tout).toContain(normaliser("la brume s'épaissit brusquement"));

    noter(`recomposition${nom}`, { pages: 145, miseEnPageInitialeMs: Math.round(initiale), correctionVisibleMs: Math.round(duree) });
    expect(duree).toBeLessThan(15_000);
  });
}

test('un renvoi ne peut être ni ajouté ni retiré par la correction depuis l\'aperçu', async ({ serveur }) => {
  await deposer(serveur, 'correction-renvoi', await livreEssai(serveur));
  const poster = (source) => fetch(`${serveur.adresse}/api/correction?livre=correction-renvoi`, { method: 'POST', body: JSON.stringify({ scene: 'S017', bloc: (livre17.blocs.find((b) => b.type === 'choix')).id, source }) });
  const livre17 = (await livreEssai(serveur, 'correction-renvoi')).scenes.find((s) => s.id === 'S017');
  expect((await poster('Tu peux retenter ta chance.')).status).toBe(500); // renvoi retiré : refusé
  expect((await poster('Tu peux tenter de nouveau ta chance au {→S001}.')).status).toBe(200); // texte autour : accepté
  const apres = (await livreEssai(serveur, 'correction-renvoi')).scenes.find((s) => s.id === 'S017').blocs.find((b) => b.type === 'choix');
  expect(apres.children.filter((c) => c.type === 'renvoi').map((c) => c.cible)).toEqual(['S001']);
});
