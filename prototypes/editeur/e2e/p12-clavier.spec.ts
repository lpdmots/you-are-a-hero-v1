// Point 12 — clavier seul et annonces. Aucune action de souris dans ce fichier.
import { expect, test } from '@playwright/test';

import { choixAuto, recit } from '../src/modele';
import { type Page } from '@playwright/test';

import { chaine, copie, doc, docEditeur, liens, message, ouvrir, texte, types } from './outils';

/**
 * Entrée dans le texte sans souris. Constat : après une prise de focus sans
 * clic, Slate pose sa sélection avec un léger retard ; une frappe faite dans
 * les 100 ms suivantes peut atterrir en début de scène. D'où l'attente.
 * Cmd+flèche droite est la « fin de ligne » de macOS, où tournent ces tests.
 */
async function entrerAuClavier(page: Page, ou: 'debut' | 'fin') {
  await texte(page).focus();
  await page.waitForTimeout(300);
  await page.keyboard.press(ou === 'debut' ? 'ControlOrMeta+ArrowUp' : 'ControlOrMeta+ArrowDown');
  if (ou === 'debut') await page.keyboard.press('ControlOrMeta+ArrowRight');
  await page.waitForTimeout(150);
}

test('F05-AC39 : création au clavier seul, destination choisie aux flèches, Entrée valide', async ({ page }) => {
  const [a, b] = [recit('Lou fit un pas, puis un autre.'), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, b] });
  await entrerAuClavier(page, 'debut');
  await page.keyboard.type('/choix');
  await expect(copie(page).locator('[data-test="libelle"]')).toBeFocused();
  await page.keyboard.type('Continuer vers la lumière');
  await page.keyboard.press('Enter');
  await expect(copie(page).locator('[data-test="destination"]')).toBeFocused();
  // S014, S015, S016, S018 : trois flèches vers le bas.
  for (let i = 0; i < 3; i += 1) await page.keyboard.press('ArrowDown');
  await expect(copie(page).locator('[role="option"][aria-selected="true"]')).toContainText('S018');
  await page.keyboard.press('Enter');
  expect(types(await doc(page, 'S015'))).toEqual(['p', 'choix', 'p']);
  expect(await liens(page)).toEqual(['S015>S018']);
  await expect(texte(page)).toBeFocused();
});

test('F05-AC39 : Échap referme la saisie sans rien créer, le curseur revient dans le texte', async ({ page }) => {
  const a = recit('Lou fit un pas.');
  await ouvrir(page, { S015: [a] });
  await entrerAuClavier(page, 'fin');
  await page.keyboard.type('/choix');
  await expect(copie(page).locator('[data-test="libelle"]')).toBeFocused();
  await page.keyboard.type('Avancer');
  await page.keyboard.press('Escape');
  await expect(copie(page).locator('[data-test="saisie"]')).toHaveCount(0);
  expect(await docEditeur(page)).toEqual([a]);
  await expect(texte(page)).toBeFocused();
  await page.waitForTimeout(150);
  await page.keyboard.type(' Puis deux.');
  expect(chaine((await docEditeur(page))[0])).toBe('Lou fit un pas. Puis deux.');
});

test('la phrase se sélectionne aux flèches comme un bloc ; Entrée ouvre son panneau ; Suppr. la supprime avec le message', async ({ page }) => {
  const [a, c, b] = [recit('Lou fit un pas.'), choixAuto('Continuer', 'S018'), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, c, b] });
  await entrerAuClavier(page, 'debut');
  // Flèche bas : la phrase est un arrêt à elle seule, entre les deux paragraphes.
  await page.keyboard.press('ArrowDown');
  await expect(texte(page).locator(`[data-id="${c.id}"]`)).toHaveClass(/selectionne/);
  await page.keyboard.press('ArrowDown');
  await expect(texte(page).locator(`[data-id="${c.id}"]`)).not.toHaveClass(/selectionne/);
  await page.keyboard.press('ArrowUp');
  await expect(texte(page).locator(`[data-id="${c.id}"]`)).toHaveClass(/selectionne/);
  // Entrée : le panneau reçoit le focus.
  await page.keyboard.press('Enter');
  await expect(copie(page).locator('[data-test="panneau-libelle"]')).toBeFocused();
  // Échap ramène dans le texte, la phrase toujours sélectionnée ; Suppr. la supprime.
  // (Revenir par Maj+Tab perdrait la sélection : le navigateur replace le curseur au début.)
  await page.keyboard.press('Escape');
  await expect(texte(page)).toBeFocused();
  await page.waitForTimeout(300);
  await expect(texte(page).locator(`[data-id="${c.id}"]`)).toHaveClass(/selectionne/);
  await page.keyboard.press('Delete');
  expect(types(await doc(page, 'S015'))).toEqual(['p', 'p']);
  await expect(message(page)).toContainText('1 choix supprimé');
});

test('annonces pour lecteur d’écran : zone de message vivante, blocs nommés', async ({ page }) => {
  await ouvrir(page, {}, { role: 'propositions' });
  await expect(message(page)).toHaveAttribute('role', 'status');
  await expect(message(page)).toHaveAttribute('aria-live', 'polite');
  await expect(texte(page)).toHaveAttribute('role', 'textbox');
  await expect(texte(page)).toHaveAttribute('aria-label', 'Texte de la scène S015');
  const choix = texte(page).locator('[data-bloc="choix"]').first();
  await expect(choix).toHaveAttribute('aria-label', "Phrase de choix, préparé par l'enseignant, non modifiable : Continuer vers la lumière : rends-toi au 21.");
  await expect(texte(page).locator('[data-bloc="action"]')).toHaveAttribute('aria-label', /^Action de jeu, préparé par l'enseignant, non modifiable : Ajoute le couteau/);
  await expect(texte(page).locator('.ecrire-ici').first()).toHaveAttribute('aria-label', 'Écrire un paragraphe avant ce bloc');
});
