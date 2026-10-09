// Point 12 — émulation d'iPad sous WebKit : écran tactile simulé par des
// « tap », clavier matériel. Ni clavier virtuel ni poignées de sélection.
import { expect, test } from '@playwright/test';

import { type Choix, choixAuto, recit } from '../src/modele';
import { bloc, chaine, copie, doc, docEditeur, liens, message, ouvrir, texte, types } from './outils';

test('appui sur une phrase : le panneau s’ouvre ; « Monter » la déplace sans glisser (F05-AC40)', async ({ page }) => {
  const [a, c1, c2] = [recit('Lou fit un pas.'), choixAuto('Avancer', 'S018'), choixAuto('Reculer', 'S014')];
  await ouvrir(page, { S015: [a, c1, c2] });
  await texte(page).locator(`[data-id="${c2.id}"] .contenu`).tap();
  await expect(copie(page).locator('[data-test="panneau"]')).toBeVisible();
  await expect(copie(page).locator('[data-test="panneau-libelle"]')).toHaveValue('Reculer');
  const avant = (await liens(page)).sort();
  await copie(page).locator('[data-test="monter"]').tap();
  const d = await doc(page, 'S015');
  expect(d.map((b) => (b as Choix).libelle ?? 'récit')).toEqual(['récit', 'Reculer', 'Avancer']);
  expect([d[1], d[2]]).toEqual([c2, c1]);
  expect((await liens(page)).sort()).toEqual(avant);
  await copie(page).locator('[data-test="descendre"]').tap();
  expect((await doc(page, 'S015')).slice(1)).toEqual([c1, c2]);
});

test('bouton « Choix » au doigt : saisie, destination touchée dans la liste, phrase créée', async ({ page }) => {
  const a = recit('Lou fit un pas.');
  await ouvrir(page, { S015: [a] });
  await copie(page).locator('[data-test="bouton-choix"]').tap();
  await copie(page).locator('[data-test="libelle"]').fill('Avancer');
  await copie(page).locator('[role="option"][data-valeur="S018"]').tap();
  await copie(page).locator('[data-test="valider"]').tap();
  expect(types(await doc(page, 'S015'))).toEqual(['p', 'choix']);
  await expect(texte(page).locator('[data-bloc="choix"]')).toHaveText('Avancer : rends-toi au 21.');
});

test('élève : appui sur un bloc protégé sans effet, « + » pour écrire à côté', async ({ page }) => {
  const [a, c] = [recit("À l'orée du bois, Lou s'arrêta.", { protege: true }), choixAuto('Avancer', 'S018')];
  await ouvrir(page, { S015: [a, c] }, { role: 'propositions' });
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).tap();
  await expect(copie(page).locator('[data-test="panneau"]')).toHaveCount(0);
  await page.keyboard.type('zzz');
  expect(await docEditeur(page)).toEqual([a, c]);
  await bloc(page, c.id).locator('.ecrire-ici').tap();
  await page.waitForTimeout(200);
  await page.keyboard.type('Entre les deux.');
  const d = await doc(page, 'S015');
  expect(d.map(chaine)).toEqual(["À l'orée du bois, Lou s'arrêta.", 'Entre les deux.', '']);
  expect([d[0], d[2]]).toEqual([a, c]);
});

test('WebKit : frappe, suppression à cheval et annulation se comportent comme sous Chromium', async ({ page }) => {
  const [a, c, b] = [recit('Lou fit un pas, puis un autre.'), choixAuto('Avancer', 'S018'), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, c, b] });
  await page.evaluate(([ida]) => {
    const e = window.__proto.editeurs.A;
    e.tf.focus();
    e.tf.select({ anchor: { path: [0, 0], offset: 14 }, focus: { path: [1, 0], offset: 0 } });
    void ida;
  }, [a.id]);
  await texte(page).focus();
  await page.waitForTimeout(150);
  await page.keyboard.press('Backspace');
  expect((await doc(page, 'S015')).map(chaine)).toEqual(['Lou fit un pas', 'Le chant reprit.']);
  await expect(message(page)).toContainText('1 choix supprimé');
  await copie(page).locator('[data-test="message-annuler"]').tap();
  expect(await doc(page, 'S015')).toEqual([a, c, b]);
});
