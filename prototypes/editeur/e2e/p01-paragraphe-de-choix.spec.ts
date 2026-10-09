// Point 1 — paragraphe de choix, seul à porter des renvois.
import { expect, test } from '@playwright/test';

import { type Doc, choixPerso, recit, renvoi } from '../src/modele';
import { MOD, bloc, copie, doc, docEditeur, liens, ouvrir, renvoisDansRecit, selectionner, texte, types, chaine } from './outils';

const p1 = recit('Lou fit un pas, puis un autre.');
const p2 = recit('Le chant reprit, plus proche.');
const phrase = choixPerso('La porte', ['Si tu as la clé, va au ', renvoi('S018'), '.']);

test('F05-AC13 : /choix insère la phrase après le paragraphe du curseur', async ({ page }) => {
  await ouvrir(page, { S015: [p1, p2] });
  await selectionner(page, { bloc: p1.id, offset: 10 });
  await page.keyboard.press('End');
  await page.keyboard.type('/choix');
  await expect(copie(page).locator('[data-test="libelle"]')).toBeFocused();
  await page.keyboard.type('Continuer vers la lumière');
  await page.keyboard.press('Enter');
  await page.keyboard.type('S018');
  await page.keyboard.press('Enter');
  const d = await doc(page, 'S015');
  expect(types(d)).toEqual(['p', 'choix', 'p']);
  expect(chaine(d[0])).toBe('Lou fit un pas, puis un autre.');
  expect(await liens(page)).toContain('S015>S018');
  await expect(texte(page).locator('[data-bloc="choix"]')).toHaveText('Continuer vers la lumière : rends-toi au 21.');
});

test('F05-AC14 : bouton sans curseur, la phrase va en fin de scène', async ({ page }) => {
  await ouvrir(page, { S015: [p1, p2] });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Faire demi-tour');
  await copie(page).locator('[data-test="destination"]').fill('S014');
  await copie(page).locator('[data-test="valider"]').click();
  expect(types(await doc(page, 'S015'))).toEqual(['p', 'p', 'choix']);
});

test('F05-AC15 : curseur au milieu du paragraphe, il reste entier et sans renvoi', async ({ page }) => {
  await ouvrir(page, { S015: [p1, p2] });
  await selectionner(page, { bloc: p1.id, offset: 14 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Avancer');
  await copie(page).locator('[data-test="destination"]').fill('S018');
  await copie(page).locator('[data-test="valider"]').click();
  const d = await doc(page, 'S015');
  expect(types(d)).toEqual(['p', 'choix', 'p']);
  expect(chaine(d[0])).toBe('Lou fit un pas, puis un autre.');
  expect(renvoisDansRecit(d)).toEqual([]);
});

test('fusion : retour arrière en début de bloc et Suppr. en fin du précédent ne mêlent jamais récit et choix', async ({ page }) => {
  const depart: Doc = [p1, phrase, p2];
  await ouvrir(page, { S015: depart });
  // Retour arrière au début du paragraphe qui suit la phrase.
  await selectionner(page, { bloc: p2.id, offset: 0 });
  await page.keyboard.press('Backspace');
  // Suppr. à la fin du paragraphe qui précède la phrase.
  await selectionner(page, { bloc: p1.id, offset: 30 });
  await page.keyboard.press('Delete');
  // Retour arrière au début de la phrase personnalisée.
  await selectionner(page, { bloc: phrase.id, offset: 0 });
  await page.keyboard.press('Backspace');
  // Suppr. à la fin de la phrase.
  await selectionner(page, { bloc: phrase.id, enfant: 2, offset: 1 });
  await page.keyboard.press('Delete');
  const d = await docEditeur(page);
  expect(types(d)).toEqual(['p', 'choix', 'p']);
  expect(d.map(chaine)).toEqual(depart.map(chaine));
  expect(renvoisDansRecit(d)).toEqual([]);
});

test('collage : un morceau de phrase avec son renvoi, collé dans un paragraphe de récit, ne crée pas de renvoi dans le récit', async ({ page }) => {
  await ouvrir(page, { S015: [p1, phrase, p2] });
  // « va au [renvoi] » : sélection à l'intérieur de la phrase personnalisée.
  await selectionner(page, { bloc: phrase.id, enfant: 0, offset: 16 }, { bloc: phrase.id, enfant: 2, offset: 1 });
  await page.keyboard.press(`${MOD}+c`);
  await selectionner(page, { bloc: p2.id, offset: 8 });
  await page.keyboard.press(`${MOD}+v`);
  const d = await docEditeur(page);
  expect(renvoisDansRecit(d)).toEqual([]);
  // Le morceau collé est une phrase de choix à part, pas un renvoi glissé dans le récit.
  expect(d.filter((b) => b.type === 'choix')).toHaveLength(2);
  await expect(bloc(page, p2.id).locator('[data-renvoi]')).toHaveCount(0);
});

test('un renvoi forcé dans un paragraphe de récit par programme est retiré', async ({ page }) => {
  await ouvrir(page, { S015: [p1, p2] });
  await page.evaluate(() => {
    const e = window.__proto.editeurs.A;
    e.tf.insertNodes({ type: 'renvoi', id: 'intrus', cible: 'S018', children: [{ text: '' }] }, { at: { path: [0, 0], offset: 3 } });
  });
  expect(renvoisDansRecit(await docEditeur(page))).toEqual([]);
});
