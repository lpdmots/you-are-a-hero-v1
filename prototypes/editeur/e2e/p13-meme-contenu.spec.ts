// Point 13 — même contenu partout, graphe déduit des renvois.
import { expect, test } from '@playwright/test';

import { type Doc, texteBloc } from '../src/modele';
import { affiche, doc, ouvrir } from './outils';

test('éditeur, livre et lecteur en ligne affichent le même texte que la fonction commune, pour chaque bloc', async ({ page }) => {
  await ouvrir(page);
  const d: Doc = await doc(page, 'S015');
  const numeros = await page.evaluate(() => Object.fromEntries(window.__proto.serveur.numeros));
  const livre = { formule: 'rends-toi au', numeroDe: (id: string) => numeros[id] as number };
  const imprimes = d.filter((b) => b.type !== 'note');
  expect(imprimes.map((b) => b.type)).toEqual(['p', 'p', 'choix', 'p', 'action', 'choix']);
  for (const [i, b] of imprimes.entries()) {
    const attendu = texteBloc(b, livre);
    expect(await affiche(page, b.id)).toBe(attendu);
    for (const mode of ['livre', 'lecteur']) {
      await expect(page.locator(`[data-test="lecture-${mode}"] .lu`).nth(i)).toHaveText(attendu);
    }
  }
  // Le numéro n'est écrit nulle part dans le document enregistré.
  expect(JSON.stringify(d)).not.toMatch(/"text":"[^"]*\b(21|22|33)\b/);
});

test('le graphe affiché se déduit des renvois enregistrés', async ({ page }) => {
  await ouvrir(page);
  const attendus = await page.evaluate(() =>
    window.__proto.serveur.scenes.get('S015').doc.flatMap((b: { type: string; children: { type?: string; cible?: string }[] }) =>
      b.type === 'choix' ? b.children.filter((n) => n.type === 'renvoi').map((n) => `S015>${n.cible}`) : []
    )
  );
  const affiches = await page.locator('[data-test="graphe"] [data-lien]').evaluateAll((els) => els.map((el) => el.getAttribute('data-lien')));
  expect(affiches).toEqual(attendus);
  expect(affiches).toEqual(['S015>S018', 'S015>S016', 'S015>S040']);
});
