// Point 4 — saisie sur place.
import { expect, test } from '@playwright/test';

import { type Choix, recit } from '../src/modele';
import { chaine, copie, doc, liens, ouvrir, selectionner, texte, types } from './outils';

test('F05-AC16 : nouvelle scène créée sans quitter la page', async ({ page }) => {
  const a = recit('Lou fit un pas, puis un autre.');
  await ouvrir(page, { S015: [a] });
  const avant = await page.evaluate(() => window.__proto.serveur.scenes.size);
  await selectionner(page, { bloc: a.id, offset: 30 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Traverser le pont de brume');
  await copie(page).locator('[data-test="destination"]').fill('nouvelle');
  await copie(page).locator('[data-test="valider"]').click();
  const creee = await page.evaluate(() => {
    const s = [...window.__proto.serveur.scenes.values()].at(-1);
    return { id: s.id, titre: s.titre, chapitre: s.chapitre, texte: s.doc.map((b: { children: { text: string }[] }) => b.children[0].text).join('') };
  });
  expect(await page.evaluate(() => window.__proto.serveur.scenes.size)).toBe(avant + 1);
  expect(creee).toMatchObject({ titre: 'Traverser le pont de brume', chapitre: 'La lisière', texte: '' });
  expect(await liens(page)).toEqual([`S015>${creee.id}`]);
  // L'auteur est toujours dans la scène où il écrivait, curseur dans le texte.
  await expect(copie(page).locator('[data-test="scene"]')).toHaveValue('S015');
  await expect(texte(page)).toBeFocused();
  await expect(texte(page).locator('[data-bloc="choix"]')).toHaveText(/Traverser le pont de brume : rends-toi au \d+\./);
});

test('F05-AC18 : « Ajouter un autre choix » place le second juste sous le premier', async ({ page }) => {
  const [a, b] = [recit('Lou fit un pas, puis un autre.'), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, b] });
  await selectionner(page, { bloc: a.id, offset: 5 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Avancer');
  await copie(page).locator('[data-test="destination"]').fill('S018');
  await copie(page).locator('[data-test="valider"]').click();
  await copie(page).locator('[data-test="autre-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Reculer');
  await copie(page).locator('[data-test="destination"]').fill('S014');
  await copie(page).locator('[data-test="valider"]').click();
  const d = await doc(page, 'S015');
  expect(types(d)).toEqual(['p', 'choix', 'choix', 'p']);
  expect(d.slice(1, 3).map((c) => (c as Choix).libelle)).toEqual(['Avancer', 'Reculer']);
  expect(d[1].id).not.toBe(d[2].id);
});

test('sur une ligne vide, la phrase remplace la ligne', async ({ page }) => {
  const [a, vide, b] = [recit('Lou fit un pas.'), recit(''), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, vide, b] });
  await selectionner(page, { bloc: vide.id, offset: 0 });
  await page.keyboard.type('/choix');
  await expect(copie(page).locator('[data-test="libelle"]')).toBeFocused();
  await page.keyboard.type('Avancer');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Clairière');
  await page.keyboard.press('Enter');
  const d = await doc(page, 'S015');
  expect(types(d)).toEqual(['p', 'choix', 'p']);
  expect(d.map(chaine)).toEqual(['Lou fit un pas.', '', 'Le chant reprit.']);
  expect(await liens(page)).toEqual(['S015>S018']);
});
