// Points 9 et 10 vus depuis l'interface. Les règles elles-mêmes sont testées
// sans navigateur dans tests/validation.test.ts et tests/serveur.test.ts.
import { expect, test } from '@playwright/test';

import { choixAuto, recit } from '../src/modele';
import { copie, doc, liens, ouvrir, selectionner } from './outils';

test('point 9 : navigateur contourné — le serveur refuse et le texte de la scène ne bouge pas', async ({ page }) => {
  const [a, c] = [recit('Lou fit un pas.'), choixAuto('Continuer', 'S018')];
  await ouvrir(page, { S015: [a, c] }, { role: 'propositions' });
  // Navigateur trafiqué : l'éditeur se croit adulte, sa garde ne retient plus rien.
  await page.evaluate(() => {
    window.__proto.env.A.ctx.role = 'adulte';
    window.__proto.editeurs.A.tf.removeNodes({ at: [1] });
  });
  expect((await page.evaluate(() => window.__proto.editeurs.A.children.length))).toBe(1);
  await expect(copie(page).locator('[data-test="etat"]')).toHaveAttribute('data-etat', 'refuse');
  await expect(copie(page).locator('[data-test="etat"]')).toContainText('bloc protégé supprimé');
  expect(await doc(page, 'S015')).toEqual([a, c]);
  expect(await liens(page)).toEqual(['S015>S018']);
});

test('point 10, F08-AC01 à AC03 : conflit sur une scène dont les choix ont changé', async ({ page }) => {
  const a = recit('Lou fit un pas.');
  await ouvrir(page, { S015: [a] });
  // Une autre session enregistre d'abord.
  await copie(page).locator('[data-test="autre-session"]').click();
  // Puis cette session ajoute un choix et du texte depuis l'ancienne version.
  await selectionner(page, { bloc: a.id, offset: 15 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Rebrousser chemin');
  await copie(page).locator('[data-test="destination"]').fill('S014');
  await copie(page).locator('[data-test="valider"]').click();

  const etat = copie(page).locator('[data-test="etat"]');
  await expect(etat).toHaveAttribute('data-etat', 'conflit');
  // AC03 : l'état ne dit pas que la saisie est devenue le texte de la scène.
  await expect(etat).toContainText("n'a pas remplacé le texte de la scène");
  await expect(etat).not.toContainText('Enregistré dans la scène');
  // AC01 : le texte de l'autre session est intact.
  const courant = await doc(page, 'S015');
  expect(JSON.stringify(courant)).toContain("Texte enregistré par l'autre session.");
  expect(courant.some((b) => b.type === 'choix')).toBe(false);
  // AC02 : la saisie est gardée à part, renvoi compris ; le graphe n'en tient pas compte.
  const copies = await page.evaluate(() => JSON.parse(JSON.stringify(window.__proto.serveur.copies)));
  expect(copies).toHaveLength(1);
  expect(JSON.stringify(copies[0].doc)).toContain('"cible":"S014"');
  expect(await liens(page)).toEqual([]);
  await expect(page.locator('[data-test="copies"]')).toContainText('S015');

  // Les frappes suivantes ne créent ni nouvelle copie ni écrasement, et restent à l'écran.
  await selectionner(page, { bloc: a.id, offset: 15 });
  await page.keyboard.type(' Encore.');
  expect(await page.evaluate(() => window.__proto.serveur.copies.length)).toBe(1);
  expect(JSON.stringify(await doc(page, 'S015'))).not.toContain('Encore.');
  await expect(copie(page).locator('[data-test="texte"]')).toContainText('Lou fit un pas. Encore.');
});
