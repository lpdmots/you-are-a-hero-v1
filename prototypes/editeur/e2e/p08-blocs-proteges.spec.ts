// Point 8 — blocs protégés : l'élève écrit autour, jamais dedans.
import { expect, test } from '@playwright/test';

import { type Choix, type Doc, action, choixAuto, choixPerso, recit, renvoi } from '../src/modele';
import { MOD, bloc, chaine, copie, doc, docEditeur, liens, message, ouvrir, selectionner, texte, types } from './outils';

const protege = () => recit("À l'orée du bois, Lou s'arrêta.", { protege: true });
const libre = () => recit('Lou fit un pas, puis un autre.');
const interne = () => choixAuto('Traverser le pont', 'S018');
const mixte = () => choixPerso('La porte', ['Ouvre la porte au ', renvoi('S016'), ' ; sinon, va au ', renvoi('S040'), '.']);

test('F05-AC29 : Alice sélectionne tout et supprime — le récit part, la phrase de choix demeure avec son lien', async ({ page }) => {
  const [a, b, c, d] = [libre(), interne(), recit('Le chant reprit.'), mixte()];
  await ouvrir(page, { S015: [a, b, c, d] }, { role: 'propositions' });
  await texte(page).locator(`[data-id="${a.id}"]`).click();
  await page.keyboard.press(`${MOD}+a`);
  await page.waitForTimeout(250);
  await page.keyboard.press('Delete');
  const apres = await doc(page, 'S015');
  expect(apres.filter((x) => x.type === 'choix')).toEqual([b, d]);
  expect(apres.filter((x) => x.type === 'p').map(chaine).join('')).toBe('');
  expect((await liens(page)).sort()).toEqual(['S015>S016', 'S015>S018', 'S015>S040']);
  await expect(copie(page).locator('[data-test="etat"]')).toHaveAttribute('data-etat', 'enregistre');
});

test('F05-AC29 : Alice sélectionne tout et remplace — sa frappe devient le récit, les choix restent', async ({ page }) => {
  const [a, b, c] = [libre(), interne(), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, b, c] }, { role: 'propositions' });
  await texte(page).locator(`[data-id="${a.id}"]`).click();
  await page.keyboard.press(`${MOD}+a`);
  await page.keyboard.type('Lou courut.');
  const apres = await doc(page, 'S015');
  expect(apres.filter((x) => x.type === 'p').map(chaine).filter(Boolean)).toEqual(['Lou courut.']);
  expect(apres.find((x) => x.type === 'choix')).toEqual(b);
  expect(await liens(page)).toEqual(['S015>S018']);
});

test('F06-AC45 : Alice ne peut pas reformuler la phrase ; le curseur n’y entre pas ; aucun panneau', async ({ page }) => {
  const [a, b] = [libre(), choixPerso('Pont', ['Traverser le pont : va au ', renvoi('S018'), '.'])];
  await ouvrir(page, { S015: [a, b] }, { role: 'propositions' });
  await expect(copie(page).locator('[data-test="bouton-choix"]')).toHaveCount(0);
  await texte(page).locator(`[data-id="${b.id}"] .contenu`).click();
  // Le bloc est pris comme un tout : aucun curseur dans son texte.
  await expect(bloc(page, b.id)).toHaveAttribute('data-ferme', 'oui');
  await expect(bloc(page, b.id)).toHaveClass(/selectionne/);
  expect(await page.evaluate(() => window.__proto.editeurs.A.selection.anchor.offset)).toBe(0);
  await page.keyboard.type("Nager jusqu'à l'autre rive");
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Delete');
  await page.keyboard.press(`${MOD}+x`);
  expect(await docEditeur(page)).toEqual([a, b]);
  await expect(copie(page).locator('[data-test="panneau"]')).toHaveCount(0);
  await expect(message(page)).toContainText("préparé par l'enseignant");
  await expect(bloc(page, b.id)).toHaveAttribute('data-repere', /préparé par l'enseignant/);
});

test('F06-AC46 : Bilal reformule un choix interne à son chapitre, destination inchangée', async ({ page }) => {
  const [a, b] = [libre(), interne()];
  await ouvrir(page, { S015: [a, b] }, { role: 'organisation' });
  await texte(page).locator(`[data-id="${b.id}"] .contenu`).click();
  await copie(page).locator('[data-test="personnaliser"]').click();
  await page.keyboard.press(`${MOD}+a`);
  // Sélection limitée à la phrase par le curseur : on réécrit le début.
  await selectionner(page, { bloc: b.id, enfant: 0, offset: 0 }, { bloc: b.id, enfant: 0, offset: 17 });
  await page.keyboard.type('Franchir le pont');
  const apres = await doc(page, 'S015');
  expect(chaine(apres[1])).toBe('Franchir le pont : rends-toi au .');
  expect(await liens(page)).toEqual(['S015>S018']);
  await expect(copie(page).locator('[data-test="etat"]')).toHaveAttribute('data-etat', 'enregistre');
});

for (const role of ['propositions', 'organisation'] as const) {
  test(`F06-AC50 : paragraphe protégé intouchable pour « ${role} », écriture possible avant et après`, async ({ page }) => {
    const [a, b] = [protege(), libre()];
    await ouvrir(page, { S015: [a, b] }, { role });
    await texte(page).locator(`[data-id="${a.id}"] .contenu`).click();
    await page.keyboard.type('zzz');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Delete');
    expect(await docEditeur(page)).toEqual([a, b]);
    // Avant : le « + » placé au-dessus du bloc.
    await bloc(page, a.id).locator('.ecrire-ici').click();
    await page.waitForTimeout(300);
    await page.keyboard.type('Avant.');
    // Après : Entrée sur le bloc sélectionné ouvre un paragraphe dessous.
    await texte(page).locator(`[data-id="${a.id}"] .contenu`).click();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.keyboard.type('Après.');
    const apres = await doc(page, 'S015');
    expect(apres.map(chaine)).toEqual(['Avant.', "À l'orée du bois, Lou s'arrêta.", 'Après.', 'Lou fit un pas, puis un autre.']);
    expect(apres[1]).toEqual(a);
    // Retour arrière au début du paragraphe qui suit : pas de fusion avec le bloc protégé.
    await selectionner(page, { bloc: apres[2].id, offset: 0 });
    await page.keyboard.press('Backspace');
    expect((await docEditeur(page))[1]).toEqual(a);
    await expect(copie(page).locator('[data-test="etat"]')).toHaveAttribute('data-etat', 'enregistre');
  });
}

test('écrire entre deux blocs protégés voisins', async ({ page }) => {
  const [a, b] = [protege(), interne()];
  await ouvrir(page, { S015: [a, b] }, { role: 'propositions' });
  await bloc(page, b.id).locator('.ecrire-ici').click();
  // À la vitesse d'une machine, les premières touches devancent le curseur.
  await page.waitForTimeout(300);
  await page.keyboard.type('Entre les deux.');
  const apres = await doc(page, 'S015');
  expect(apres.map((x) => x.type)).toEqual(['p', 'p', 'choix']);
  expect(chaine(apres[1])).toBe('Entre les deux.');
  expect([apres[0], apres[2]]).toEqual([a, b]);
  // Et à la fin, sous un dernier bloc protégé.
  await copie(page).locator('[data-test="ecrire-fin"]').click();
  await page.waitForTimeout(300);
  await page.keyboard.type('À la fin.');
  expect((await doc(page, 'S015')).map(chaine).at(-1)).toBe('À la fin.');
});

test('au clavier seul, les flèches traversent un bloc protégé sans y écrire', async ({ page }) => {
  const [a, b, c] = [libre(), protege(), recit('Le chant reprit.')];
  await ouvrir(page, { S015: [a, b, c] }, { role: 'propositions' });
  await selectionner(page, { bloc: a.id, offset: 30 });
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('x');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.type('Puis ');
  const apres = await docEditeur(page);
  expect(apres.map(chaine)).toEqual(['Lou fit un pas, puis un autre.', "À l'orée du bois, Lou s'arrêta.", 'Puis Le chant reprit.']);
});

test('F06-AC51 : l’enseignante protège, corrige un mot sans lever la protection, puis la retire', async ({ page }) => {
  const a = libre();
  await ouvrir(page, { S015: [a] });
  await selectionner(page, { bloc: a.id, offset: 3 });
  await copie(page).locator('[data-test="bouton-proteger"]').click();
  expect((await doc(page, 'S015'))[0]).toMatchObject({ protege: true });
  // Elle corrige « Lou » en « Lia » : le paragraphe reste protégé.
  await selectionner(page, { bloc: a.id, offset: 1 }, { bloc: a.id, offset: 3 });
  await page.keyboard.type('ia');
  const corrige = (await doc(page, 'S015'))[0];
  expect(chaine(corrige)).toBe('Lia fit un pas, puis un autre.');
  expect(corrige).toMatchObject({ protege: true });

  // Alice ne peut pas y toucher.
  await page.locator('[data-test="role"]').selectOption('propositions');
  await texte(page).locator(`[data-id="${a.id}"] .contenu`).click();
  await page.keyboard.type('zzz');
  expect(chaine((await docEditeur(page))[0])).toBe('Lia fit un pas, puis un autre.');

  // « Retirer la protection » le rend modifiable.
  await page.locator('[data-test="role"]').selectOption('adulte');
  await selectionner(page, { bloc: a.id, offset: 3 });
  await expect(copie(page).locator('[data-test="bouton-proteger"]')).toHaveText('Retirer la protection');
  await copie(page).locator('[data-test="bouton-proteger"]').click();
  await page.locator('[data-test="role"]').selectOption('propositions');
  await selectionner(page, { bloc: a.id, offset: 30 });
  await page.keyboard.type(' Enfin.');
  expect(chaine((await doc(page, 'S015'))[0])).toBe('Lia fit un pas, puis un autre. Enfin.');
});

test('F06-AC52 : phrase mêlant renvoi interne et raccord, fermée même pour Bilal', async ({ page }) => {
  const [a, b, c] = [libre(), mixte(), interne()];
  await ouvrir(page, { S015: [a, b, c] }, { role: 'organisation' });
  await texte(page).locator(`[data-id="${b.id}"] .contenu`).click();
  await page.keyboard.type('zzz');
  await page.keyboard.press('Delete');
  await expect(copie(page).locator('[data-test="panneau"]')).toHaveCount(0);
  expect((await docEditeur(page))[1]).toEqual(b);
  // Le repère ne nomme pas la scène de l'autre chapitre.
  await expect(bloc(page, b.id)).toHaveAttribute('data-repere', /autre chapitre · Le marais/);
  await expect(bloc(page, b.id)).not.toHaveAttribute('data-repere', /S040|Berge/);
  // Le choix interne, lui, reste modifiable.
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).click();
  await expect(copie(page).locator('[data-test="panneau"]')).toBeVisible();
});

test('la garde d’opérations arrête une modification forcée par programme', async ({ page }) => {
  const [a, b, c] = [protege(), interne(), action('Ajoute le couteau.')];
  await ouvrir(page, { S015: [a, b, c] }, { role: 'propositions' });
  await page.evaluate(() => {
    const e = window.__proto.editeurs.A;
    e.tf.removeNodes({ at: [1] });
    e.tf.insertText('zzz', { at: { path: [0, 0], offset: 0 } });
    e.tf.setNodes({ libelle: 'Nager' }, { at: [1] });
    e.tf.unsetNodes('protege', { at: [0] });
    e.tf.insertNodes({ type: 'choix', id: 'x', mode: 'auto', libelle: 'Fuir', construction: 0, children: [{ text: '' }, { type: 'renvoi', id: 'y', cible: 'S018', children: [{ text: '' }] }, { text: '' }] }, { at: [3] });
    e.tf.setNodes({ type: 'p' }, { at: [2] });
  });
  expect(await docEditeur(page)).toEqual([a, b, c]);
  // Cinq refus : la sixième tentative (libellé) n'atteint même pas la garde, Slate n'écrit pas dans un bloc fermé.
  expect(await page.evaluate(() => window.__proto.env.A.garde.refus)).toBe(5);
});
