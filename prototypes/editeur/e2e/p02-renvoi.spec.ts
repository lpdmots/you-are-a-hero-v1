// Point 2 — renvoi insécable, relié à une identité de scène, numéro calculé ailleurs.
import { expect, test } from '@playwright/test';

import { type Renvoi, choixAuto, choixPerso, recit, renvoi } from '../src/modele';
import { bloc, copie, doc, docEditeur, liens, ouvrir, selectionner, texte } from './outils';

const p1 = recit('Lou fit un pas, puis un autre.');

test('F05-AC34 et AC35 : le numéro affiché suit le livre sans modifier le texte enregistré', async ({ page }) => {
  const phrase = choixAuto('Continuer vers la lumière', 'S018');
  await ouvrir(page, { S015: [p1, phrase] });
  await expect(bloc(page, phrase.id)).toHaveText('Continuer vers la lumière : rends-toi au 21.');
  const avant = JSON.stringify(await doc(page, 'S015'));
  const version = await page.evaluate(() => window.__proto.serveur.scenes.get('S015').version);
  expect(avant).not.toContain('21');

  await page.locator('[data-test="decaler"]').click();
  await expect(bloc(page, phrase.id)).toHaveText('Continuer vers la lumière : rends-toi au 24.');
  // Le repère, hors du texte, garde la référence stable.
  await expect(bloc(page, phrase.id)).toHaveAttribute('data-repere', /S018 Clairière/);
  expect(JSON.stringify(await doc(page, 'S015'))).toBe(avant);
  expect(await page.evaluate(() => window.__proto.serveur.scenes.get('S015').version)).toBe(version);
  // Rien à annuler : le changement de numéro n'est pas une modification du texte.
  expect(await page.evaluate(() => window.__proto.editeurs.A.history.undos.length)).toBe(0);
});

test('le renvoi est un élément insécable : on écrit autour, jamais dedans', async ({ page }) => {
  const r = renvoi('S018');
  const phrase = choixPerso('Lumière', ['Va au ', r, '.']);
  await ouvrir(page, { S015: [p1, phrase] });
  await selectionner(page, { bloc: phrase.id, enfant: 0, offset: 5 });
  // Flèches : fin du texte, puis le renvoi sélectionné comme un tout, puis l'autre côté.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(bloc(page, phrase.id).locator('.renvoi.selectionne')).toHaveCount(1);
  // Renvoi sélectionné : la frappe n'y écrit rien.
  await page.keyboard.type('x');
  expect(await docEditeur(page)).toEqual([p1, phrase]);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type(' vite');
  // Retour devant le renvoi, puis frappe.
  for (let i = 0; i < 7; i += 1) await page.keyboard.press('ArrowLeft');
  await page.keyboard.type('numéro ');
  const d = await docEditeur(page);
  const enfants = d[1].children as ({ text: string } | Renvoi)[];
  expect(enfants.map((n) => ('text' in n ? n.text : '[renvoi]')).join('')).toBe('Va au numéro [renvoi] vite.');
  expect(enfants.find((n) => 'type' in n)).toEqual(r);
  await expect(bloc(page, phrase.id)).toHaveText('Va au numéro 21 vite.');
});

test("F05-AC17 : destination à décider plus tard, renvoi vide, puis destination donnée sans ressaisir le libellé", async ({ page }) => {
  await ouvrir(page, { S015: [p1] });
  const scenes = await page.evaluate(() => window.__proto.serveur.scenes.size);
  await selectionner(page, { bloc: p1.id, offset: 0 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Faire demi-tour');
  await copie(page).locator('[data-test="destination"]').fill('plus tard');
  await copie(page).locator('[data-test="valider"]').click();
  await expect(texte(page).locator('[data-bloc="choix"]')).toHaveText('Faire demi-tour : rends-toi au ?.');
  await expect(texte(page).locator('[data-bloc="choix"] .numero.vide')).toHaveCount(1);
  expect(await page.evaluate(() => window.__proto.serveur.scenes.size)).toBe(scenes);
  expect(await liens(page)).toEqual(['S015>?']);

  await texte(page).locator('[data-bloc="choix"]').click();
  await copie(page).locator('[data-test="panneau-destination-0"]').selectOption('S014');
  await expect(texte(page).locator('[data-bloc="choix"]')).toHaveText('Faire demi-tour : rends-toi au 17.');
  expect(await liens(page)).toEqual(['S015>S014']);
});
