// Point 5 — sélection et suppression : la phrase part en entier ou pas du tout.
import { expect, test } from '@playwright/test';

import { type Doc, choixAuto, choixPerso, recit, renvoi } from '../src/modele';
import { MOD, chaine, copie, doc, docEditeur, liens, message, ouvrir, selectionner, texte, types } from './outils';

const p1 = recit('Lou fit un pas, puis un autre.');
const p2 = recit('Le chant reprit, plus proche.');

for (const forme of ['automatique', 'personnalisée'] as const) {
  test(`F05-AC28 : sélection à cheval sur une phrase ${forme}`, async ({ page }) => {
    const phrase =
      forme === 'automatique'
        ? choixAuto('Continuer vers la lumière', 'S018')
        : choixPerso('Lumière', ['Si le chant t’attire, suis la lumière au ', renvoi('S018'), '.']);
    const depart: Doc = [p1, phrase, p2];
    await ouvrir(page, { S015: depart });
    expect(await liens(page)).toEqual(['S015>S018']);
    // Du milieu du paragraphe au milieu de la phrase suivante.
    await selectionner(page, { bloc: p1.id, offset: 14 }, { bloc: phrase.id, offset: forme === 'automatique' ? 0 : 12 });
    await page.keyboard.press('Delete');

    const d = await doc(page, 'S015');
    expect(types(d)).toEqual(['p', 'p']);
    expect(chaine(d[0])).toBe('Lou fit un pas');
    expect(await liens(page)).toEqual([]);
    await expect(message(page)).toContainText('1 choix supprimé');
    // S018 n'est pas supprimée.
    expect(await page.evaluate(() => window.__proto.serveur.scenes.has('S018'))).toBe(true);

    // Un seul geste rétablit le texte, la phrase et le lien.
    await copie(page).locator('[data-test="message-annuler"]').click();
    expect(await doc(page, 'S015')).toEqual(depart);
    expect(await liens(page)).toEqual(['S015>S018']);
  });
}

test('« tout sélectionner » puis frappe : tout est remplacé, les choix partent avec leurs liens, un geste annule', async ({ page }) => {
  const depart: Doc = [p1, choixAuto('Continuer', 'S018'), p2, choixPerso('Porte', ['Ouvre au ', renvoi('S016'), ' ou fuis au ', renvoi('S040'), '.'])];
  await ouvrir(page, { S015: depart });
  await texte(page).click();
  await page.keyboard.press(`${MOD}+a`);
  await page.keyboard.type('Tout recommence.');
  const d = await doc(page, 'S015');
  expect(d.map(chaine)).toEqual(['Tout recommence.']);
  expect(await liens(page)).toEqual([]);
  await expect(message(page)).toContainText('2 choix supprimés');
  // La frappe se regroupe ; Ctrl+Z jusqu'au retour du texte d'origine.
  await page.keyboard.press(`${MOD}+z`);
  await page.keyboard.press(`${MOD}+z`);
  expect(await doc(page, 'S015')).toEqual(depart);
  expect((await liens(page)).sort()).toEqual(['S015>S016', 'S015>S018', 'S015>S040']);
});

test('phrase fermée sélectionnée seule : Suppr. la supprime avec message et annulation', async ({ page }) => {
  const phrase = choixAuto('Continuer', 'S018');
  const depart: Doc = [p1, phrase, p2];
  await ouvrir(page, { S015: depart });
  await texte(page).locator(`[data-id="${phrase.id}"] .contenu`).click();
  await page.keyboard.press('Delete');
  expect(types(await doc(page, 'S015'))).toEqual(['p', 'p']);
  await expect(message(page)).toContainText('1 choix supprimé');
  await page.keyboard.press(`${MOD}+z`);
  expect(await doc(page, 'S015')).toEqual(depart);
});

test('F05-AC24 : retirer un renvoi sur deux, le lien disparaît, la scène et l’autre renvoi restent', async ({ page }) => {
  const r53 = renvoi('S016');
  const r55 = renvoi('S040');
  const phrase = choixPerso('Porte', ['Ouvre la porte au ', r53, ' ; sinon, déchiffre au ', r55, '.']);
  await ouvrir(page, { S015: [p1, phrase] });
  await selectionner(page, { bloc: phrase.id, offset: 3 });
  await copie(page).locator('[data-test="retirer-renvoi-1"]').click();
  expect(await liens(page)).toEqual(['S015>S016']);
  expect(await page.evaluate(() => window.__proto.serveur.scenes.has('S040'))).toBe(true);
  const d = await doc(page, 'S015');
  expect(d[1].children.find((n) => 'type' in n)).toEqual(r53);
  expect(chaine(d[1])).toBe('Ouvre la porte au  ; sinon, déchiffre au .');
});

test('F05-AC25 : retirer le dernier renvoi supprime la phrase après confirmation ; annuler rétablit phrase, renvoi et lien', async ({ page }) => {
  const phrase = choixPerso('Lumière', ['Suis la lumière au ', renvoi('S018'), '.']);
  const depart: Doc = [p1, phrase];
  await ouvrir(page, { S015: depart });
  // Au clavier : retour arrière juste après le renvoi.
  await selectionner(page, { bloc: phrase.id, enfant: 2, offset: 0 });
  await page.keyboard.press('Backspace');
  // Rien n'est supprimé avant la confirmation.
  expect(await docEditeur(page)).toEqual(depart);
  await copie(page).locator('[data-test="confirmer-dernier"]').click();
  expect(types(await doc(page, 'S015'))).toEqual(['p']);
  expect(await liens(page)).toEqual([]);
  await copie(page).locator('[data-test="message-annuler"]').click();
  expect(await doc(page, 'S015')).toEqual(depart);
  expect(await liens(page)).toEqual(['S015>S018']);
});

test('sélection couvrant tous les renvois d’une phrase personnalisée : la phrase entière part', async ({ page }) => {
  const phrase = choixPerso('Lumière', ['Suis la lumière au ', renvoi('S018'), ' sans tarder.']);
  await ouvrir(page, { S015: [p1, phrase] });
  await selectionner(page, { bloc: phrase.id, enfant: 0, offset: 5 }, { bloc: phrase.id, enfant: 2, offset: 5 });
  await page.keyboard.press('Backspace');
  expect(types(await doc(page, 'S015'))).toEqual(['p']);
  await expect(message(page)).toContainText('1 choix supprimé');
});
