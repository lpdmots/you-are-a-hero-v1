// Point 14 — paragraphe d'action de jeu.
import { expect, test } from '@playwright/test';

import { type Doc, action, choixPerso, recit, renvoi } from '../src/modele';
import { MOD, bloc, chaine, copie, doc, docEditeur, message, ouvrir, presseTexte, renvoisDansRecit, selectionner, texte, types } from './outils';

const p1 = () => recit('Lou fit un pas, puis un autre.');
const jeu = () => action('Ajoute le couteau à ton inventaire.');

test('passage d’un paragraphe de récit à une action de jeu et retour ; /action crée le paragraphe', async ({ page }) => {
  const a = p1();
  await ouvrir(page, { S015: [a] });
  await selectionner(page, { bloc: a.id, offset: 5 });
  await copie(page).locator('[data-test="bouton-action"]').click();
  expect((await doc(page, 'S015'))[0]).toMatchObject({ type: 'action', id: a.id });
  expect(chaine((await doc(page, 'S015'))[0])).toBe('Lou fit un pas, puis un autre.');
  await copie(page).locator('[data-test="bouton-action"]').click();
  expect(await doc(page, 'S015')).toEqual([a]);

  // Par la commande tapée, puis texte libre ; Entrée en fin d'action revient au récit.
  await selectionner(page, { bloc: a.id, offset: 30 });
  await page.keyboard.press('Enter');
  await page.keyboard.type('/action');
  await page.keyboard.type('Retire un point de volonté à ton héros.');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Lou reprit sa route.');
  const d = await doc(page, 'S015');
  expect(types(d)).toEqual(['p', 'action', 'p']);
  expect(d.map(chaine)).toEqual(['Lou fit un pas, puis un autre.', 'Retire un point de volonté à ton héros.', 'Lou reprit sa route.']);
  // Aucun élément en ligne, aucun renvoi : du texte seulement.
  expect((d[1].children as { text?: string }[]).every((n) => typeof n.text === 'string')).toBe(true);
});

test('aucun renvoi n’entre dans une action de jeu, ni par collage ni par fusion', async ({ page }) => {
  const [a, b, c] = [jeu(), choixPerso('Porte', ['Va au ', renvoi('S018'), '.']), p1()];
  await ouvrir(page, { S015: [a, b, c] });
  // Collage d'un morceau de phrase avec son renvoi au milieu de l'action.
  await selectionner(page, { bloc: b.id, enfant: 0, offset: 3 }, { bloc: b.id, enfant: 2, offset: 1 });
  await page.keyboard.press(`${MOD}+c`);
  await selectionner(page, { bloc: a.id, offset: 6 });
  await page.keyboard.press(`${MOD}+v`);
  // Fusion : Suppr. à la fin de l'action, retour arrière au début de la phrase.
  await selectionner(page, { bloc: a.id, offset: 35 });
  await page.keyboard.press('Delete');
  await selectionner(page, { bloc: b.id, offset: 0 });
  await page.keyboard.press('Backspace');
  const d = await docEditeur(page);
  expect(renvoisDansRecit(d)).toEqual([]);
  expect(d.find((x) => x.id === a.id)).toEqual(a);
  await expect(bloc(page, a.id).locator('[data-renvoi]')).toHaveCount(0);
});

test('F04-AC25 : Bilal a la commande, Alice ne l’a pas ; « tout supprimer » par Alice épargne l’action', async ({ page }) => {
  const [a, b, c] = [p1(), jeu(), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, b, c] }, { role: 'organisation' });
  await expect(copie(page).locator('[data-test="bouton-action"]')).toBeVisible();
  await selectionner(page, { bloc: c.id, offset: 16 });
  await page.keyboard.press('Enter');
  await page.keyboard.type('/action');
  await page.keyboard.type('Ajoute la corde.');
  expect(types(await doc(page, 'S015'))).toEqual(['p', 'action', 'p', 'action']);

  await page.locator('[data-test="role"]').selectOption('propositions');
  await expect(copie(page).locator('[data-test="bouton-action"]')).toHaveCount(0);
  // « /action » tapé par Alice reste du texte.
  await selectionner(page, { bloc: c.id, offset: 16 });
  await page.keyboard.type(' /action');
  expect(chaine((await docEditeur(page))[2])).toBe('Le chant reprit. /action');
  await page.keyboard.press(`${MOD}+a`);
  await page.waitForTimeout(250);
  await page.keyboard.press('Delete');
  const d = await doc(page, 'S015');
  expect(d.filter((x) => x.type === 'action').map(chaine)).toEqual(['Ajoute le couteau à ton inventaire.', 'Ajoute la corde.']);
  expect(d.filter((x) => x.type === 'p').map(chaine).join('')).toBe('');
});

test('F04-AC30 : Alice colle un paragraphe de récit et une action de jeu — le récit passe, l’action est écartée, un message le dit', async ({ page }) => {
  const [a, b] = [p1(), jeu()];
  const q = recit('Lou hésita.');
  await ouvrir(page, { S015: [a, b], S016: [q] }, { role: 'propositions' });
  await texte(page, 'A').locator(`[data-id="${a.id}"]`).click();
  await page.keyboard.press(`${MOD}+a`);
  await page.waitForTimeout(250);
  await page.keyboard.press(`${MOD}+c`);
  await selectionner(page, { bloc: q.id, offset: 11 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  const d = await doc(page, 'S016');
  expect(d.every((x) => x.type === 'p')).toBe(true);
  expect(d.map(chaine).join('|')).toContain('Lou fit un pas, puis un autre.');
  expect(d.map(chaine).join('|')).not.toContain('couteau');
  await expect(message(page, 'B')).toContainText('Non collé, faute du droit requis : 1 action de jeu.');
  await expect(copie(page, 'B').locator('[data-test="etat"]')).toHaveAttribute('data-etat', 'enregistre');
});

test('couper-coller déplace l’action entre deux scènes, copier-coller la duplique, sortie en texte simple', async ({ page }) => {
  const [a, b] = [p1(), jeu()];
  const q = recit('Lou hésita.');
  await ouvrir(page, { S015: [a, b], S016: [q] });
  await selectionner(page, { bloc: b.id, offset: 0 }, { bloc: b.id, offset: 35 });
  await page.keyboard.press(`${MOD}+c`);
  expect((await presseTexte(page)).trim()).toBe('Ajoute le couteau à ton inventaire.');
  // Copie d'un bloc entier, à cheval sur deux blocs, pour garder son type.
  await selectionner(page, { bloc: a.id, offset: 30 }, { bloc: b.id, offset: 35 });
  await page.keyboard.press(`${MOD}+x`);
  expect(types(await doc(page, 'S015'))).toEqual(['p']);
  await selectionner(page, { bloc: q.id, offset: 11 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  const d = await doc(page, 'S016');
  expect(types(d)).toEqual(['p', 'action']);
  expect(d[1]).toEqual(b);
  // Copier-coller : une autre action, de même texte.
  await selectionner(page, { bloc: q.id, offset: 11 }, { bloc: b.id, offset: 35 }, 'B');
  await page.keyboard.press(`${MOD}+c`);
  await selectionner(page, { bloc: b.id, offset: 35 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  const e = await doc(page, 'S016');
  expect(types(e)).toEqual(['p', 'action', 'action']);
  expect(e[2].id).not.toBe(b.id);
  expect(chaine(e[2])).toBe(chaine(b));
});

test('texte venu de l’extérieur : jamais d’action de jeu', async ({ page }) => {
  const a = p1();
  await ouvrir(page, { S015: [a] });
  await page.evaluate(() => navigator.clipboard.writeText('Ajoute le couteau à ton inventaire.'));
  await selectionner(page, { bloc: a.id, offset: 30 });
  await page.keyboard.press('Enter');
  await page.keyboard.press(`${MOD}+v`);
  expect(types(await doc(page, 'S015'))).toEqual(['p', 'p']);
});

test('F04-AC17 : même texte et même mise à part dans l’éditeur, le livre et le lecteur en ligne', async ({ page }) => {
  const [a, b] = [p1(), jeu()];
  await ouvrir(page, { S015: [a, b] });
  await expect(bloc(page, b.id)).toHaveText('Ajoute le couteau à ton inventaire.');
  for (const mode of ['livre', 'lecteur']) {
    const lu = page.locator(`[data-test="lecture-${mode}"] [data-bloc="action"]`);
    await expect(lu).toHaveText('Ajoute le couteau à ton inventaire.');
    await expect(lu).toHaveClass(/lu-action/);
  }
});
