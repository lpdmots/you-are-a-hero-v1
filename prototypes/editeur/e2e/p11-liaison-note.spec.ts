// Point 11 — liaison cachée et note de l'enseignant.
import { expect, test } from '@playwright/test';

import { type Choix, choixAuto, note, recit } from '../src/modele';
import { bloc, copie, doc, liens, ouvrir, selectionner, texte, types } from './outils';

test('F05-AC26 : choix caché puis proposé de nouveau', async ({ page }) => {
  const [a, c] = [recit('La porte était couverte de symboles.'), choixAuto('Déchiffrer les symboles', 'S062')];
  await ouvrir(page, { S040: [a, c] }, { A: 'S040' });
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).click();
  await copie(page).locator('[data-test="cacher-choix"]').click();
  // La phrase a quitté le texte ; la liaison existe, numéro 38 fixé ; le repère est hors du récit.
  expect(types(await doc(page, 'S040'))).toEqual(['p']);
  expect((await liens(page)).filter((l) => l.startsWith('S040'))).toEqual([]);
  await expect(page.locator('[data-lien-cache="S040>S062"]')).toContainText('n° 38 fixé');
  await expect(copie(page).locator('[data-test="liaison"]')).toContainText('numéro fixé 38');
  await expect(texte(page).locator('[data-test="liaison"]')).toHaveCount(0);

  await copie(page).locator('[data-test="liaison"] button').click();
  const d = await doc(page, 'S040');
  expect(types(d)).toEqual(['p', 'choix']);
  expect((d[1] as Choix).mode).toBe('auto');
  expect((await liens(page)).filter((l) => l.startsWith('S040'))).toEqual(['S040>S062']);
  await expect(page.locator('[data-lien-cache="S040>S062"]')).toHaveCount(0);
  await expect(texte(page).locator('[data-bloc="choix"]')).toHaveText('Déchiffrer les symboles : rends-toi au 38.');
});

test('F05-AC27 : « Lien caché (énigme) » proposé à l’adulte, pas à Bilal', async ({ page }) => {
  const a = recit('Lou fit un pas.');
  await ouvrir(page, { S015: [a] });
  await selectionner(page, { bloc: a.id, offset: 3 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await expect(copie(page).locator('[data-test="lien-cache"]')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.locator('[data-test="role"]').selectOption('organisation');
  await selectionner(page, { bloc: a.id, offset: 3 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await expect(copie(page).locator('[data-test="saisie"]')).toBeVisible();
  await expect(copie(page).locator('[data-test="lien-cache"]')).toHaveCount(0);
});

test('F05-AC37 : l’élève lit le numéro à obtenir, sans titre ni référence, et ne peut pas modifier la liaison', async ({ page }) => {
  // Jeu de départ : S015 porte une liaison cachée vers S062 (n° 38) et une note de l'enseignant.
  await ouvrir(page, {}, { role: 'propositions' });
  const liaison = copie(page).locator('[data-test="liaison"]');
  await expect(liaison).toHaveText('Ton énigme doit conduire au numéro 38.');
  await expect(liaison.locator('button')).toHaveCount(0);
  // Ce que le navigateur de l'élève a reçu ne contient ni la cible ni la note.
  const recu = await page.evaluate(() => JSON.stringify(window.__proto.serveur.vuePour('S015', 'propositions')));
  expect(recu).not.toContain('S062');
  expect(recu).not.toContain('Solution');
  await expect(texte(page).locator('[data-bloc="note"]')).toHaveCount(0);
  await expect(texte(page)).not.toContainText('Solution');
});

test('la note de l’enseignant : visible de l’adulte, absente du livre et du lecteur, conservée quand l’élève enregistre', async ({ page }) => {
  const [a, n] = [recit('Lou fit un pas.'), note("Solution de l'énigme : compter les pierres.")];
  await ouvrir(page, { S015: [a, n] });
  await expect(bloc(page, n.id)).toHaveText("Solution de l'énigme : compter les pierres.");
  await expect(bloc(page, n.id)).toHaveAttribute('data-repere', /jamais imprimée/);
  for (const mode of ['livre', 'lecteur']) await expect(page.locator(`[data-test="lecture-${mode}"]`)).not.toContainText('Solution');

  await page.locator('[data-test="role"]').selectOption('organisation');
  await expect(texte(page)).not.toContainText('Solution');
  await selectionner(page, { bloc: a.id, offset: 15 });
  await page.keyboard.type(' Puis un autre.');
  const d = await doc(page, 'S015');
  expect(types(d)).toEqual(['p', 'note']);
  expect(d[1]).toEqual(n);
});
