// Point 6 — annulation et rétablissement.
import { expect, test } from '@playwright/test';

import { type Renvoi, choixAuto, recit } from '../src/modele';
import { MOD, copie, doc, docEditeur, liens, ouvrir, selectionner, texte, types } from './outils';

const renvoiDe = (c: { children: unknown[] }) => c.children.find((n) => (n as Renvoi).type === 'renvoi') as Renvoi;

test('après création d’une scène depuis un choix : un geste retire phrase et lien, un autre les rétablit', async ({ page }) => {
  const a = recit('Lou fit un pas, puis un autre.');
  await ouvrir(page, { S015: [a] });
  await selectionner(page, { bloc: a.id, offset: 30 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Traverser le pont');
  await copie(page).locator('[data-test="destination"]').fill('nouvelle');
  await copie(page).locator('[data-test="valider"]').click();
  const avecChoix = await doc(page, 'S015');
  const [lien] = await liens(page);
  expect(lien).toMatch(/^S015>S\d+$/);
  const creee = lien.split('>')[1];

  await page.keyboard.press(`${MOD}+z`);
  expect(await doc(page, 'S015')).toEqual([a]);
  expect(await liens(page)).toEqual([]);
  // Constat : la scène créée n'est pas supprimée par l'annulation (elle vit côté serveur).
  expect(await page.evaluate((id) => window.__proto.serveur.scenes.has(id), creee)).toBe(true);

  await page.keyboard.press(`${MOD}+Shift+z`);
  expect(await doc(page, 'S015')).toEqual(avecChoix);
  expect(await liens(page)).toEqual([lien]);
});

test('couper-coller entre deux scènes : chaque scène a son historique, il faut annuler dans les deux', async ({ page }) => {
  const [a, c] = [recit('Lou fit un pas, puis un autre.'), choixAuto('Continuer', 'S018')];
  const q = recit('Lou hésita.');
  await ouvrir(page, { S015: [a, c], S016: [q] });
  await texte(page, 'A').locator(`[data-id="${c.id}"] .contenu`).click();
  await page.keyboard.press(`${MOD}+x`);
  await selectionner(page, { bloc: q.id, offset: 11 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  expect(await liens(page)).toEqual(['S016>S018']);

  // Annuler dans la scène d'arrivée : le collage est défait, le choix n'est plus nulle part.
  await page.keyboard.press(`${MOD}+z`);
  expect(await doc(page, 'S016')).toEqual([q]);
  expect(await liens(page)).toEqual([]);
  // Annuler dans la scène de départ : le même choix revient, avec son lien.
  await texte(page, 'A').locator(`[data-id="${a.id}"]`).click();
  await page.keyboard.press(`${MOD}+z`);
  expect(await doc(page, 'S015')).toEqual([a, c]);
  expect(await liens(page)).toEqual(['S015>S018']);
});

test('annuler le couper sans annuler le coller : le serveur ne laisse jamais une identité dans deux scènes', async ({ page }) => {
  const [a, c] = [recit('Lou fit un pas, puis un autre.'), choixAuto('Continuer', 'S018')];
  const q = recit('Lou hésita.');
  await ouvrir(page, { S015: [a, c], S016: [q] });
  await texte(page, 'A').locator(`[data-id="${c.id}"] .contenu`).click();
  await page.keyboard.press(`${MOD}+x`);
  await selectionner(page, { bloc: q.id, offset: 11 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  await texte(page, 'A').locator(`[data-id="${a.id}"]`).click();
  await page.keyboard.press(`${MOD}+z`);
  await page.waitForTimeout(150);

  const [d15, d16] = [await doc(page, 'S015'), await doc(page, 'S016')];
  expect(types(d15)).toEqual(['p', 'choix']);
  expect(types(d16)).toEqual(['p', 'choix']);
  // Deux choix distincts : le revenu a reçu une nouvelle identité, reportée dans l'éditeur.
  expect(d16[1].id).toBe(c.id);
  expect(d15[1].id).not.toBe(c.id);
  expect(renvoiDe(d15[1]).id).not.toBe(renvoiDe(d16[1]).id);
  expect((await docEditeur(page, 'A'))[1].id).toBe(d15[1].id);
  expect((await liens(page)).sort()).toEqual(['S015>S018', 'S016>S018']);
  await expect(copie(page, 'A').locator('[data-test="etat"]')).toHaveAttribute('data-etat', 'enregistre');
});

test('les liens enregistrés suivent chaque annulation et chaque rétablissement d’un changement de destination', async ({ page }) => {
  const c = choixAuto('Continuer', 'S018');
  await ouvrir(page, { S015: [recit('Lou fit un pas.'), c] });
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).click();
  await copie(page).locator('[data-test="panneau-destination-0"]').selectOption('S016');
  expect(await liens(page)).toEqual(['S015>S016']);
  await copie(page).locator('[data-test="annuler"]').click();
  expect(await liens(page)).toEqual(['S015>S018']);
  await copie(page).locator('[data-test="retablir"]').click();
  expect(await liens(page)).toEqual(['S015>S016']);
});
