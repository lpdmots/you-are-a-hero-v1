// Point 3 — phrase automatique et phrase personnalisée.
import { expect, test } from '@playwright/test';

import { type Choix, choixAuto, choixPerso, recit, renvoi } from '../src/modele';
import { MOD, affiche, bloc, chaine, copie, doc, docEditeur, liens, message, ouvrir, selectionner, texte } from './outils';

const p1 = () => recit('Lou fit un pas, puis un autre.');

test('F05-AC10 : la phrase automatique suit la formule du livre, sans changer le texte enregistré', async ({ page }) => {
  const a = p1();
  await ouvrir(page, { S015: [a] });
  await selectionner(page, { bloc: a.id, offset: 30 });
  await copie(page).locator('[data-test="bouton-choix"]').click();
  await copie(page).locator('[data-test="libelle"]').fill('Suivre le chant');
  await copie(page).locator('[data-test="destination"]').fill('S014');
  await copie(page).locator('[data-test="valider"]').click();
  const phrase = texte(page).locator('[data-bloc="choix"]');
  await expect(phrase).toHaveText('Suivre le chant : rends-toi au 17.');
  const avant = JSON.stringify(await doc(page, 'S015'));
  await page.locator('[data-test="formule"]').selectOption('va au');
  await expect(phrase).toHaveText('Suivre le chant : va au 17.');
  expect(JSON.stringify(await doc(page, 'S015'))).toBe(avant);
});

test('F05-AC20 et AC21 : libellé corrigé puis destination changée dans le panneau', async ({ page }) => {
  const c = choixAuto('Continuer vers la lumière', 'S018');
  await ouvrir(page, { S015: [p1(), c] });
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).click();
  await copie(page).locator('[data-test="panneau-libelle"]').fill('Suivre la lumière');
  await copie(page).locator('[data-test="panneau-libelle"]').press('Enter');
  await expect(bloc(page, c.id)).toHaveText('Suivre la lumière : rends-toi au 21.');
  const corrige = (await doc(page, 'S015'))[1] as Choix;
  expect(corrige.construction).toBe(c.construction);
  expect(await liens(page)).toEqual(['S015>S018']);

  await copie(page).locator('[data-test="panneau-destination-0"]').selectOption('S016');
  await expect(bloc(page, c.id)).toHaveText('Suivre la lumière : rends-toi au 22.');
  expect(await liens(page)).toEqual(['S015>S016']);
  expect(await page.evaluate(() => window.__proto.serveur.scenes.has('S018'))).toBe(true);
  await expect(bloc(page, c.id)).toHaveAttribute('data-repere', /S016 Sentier des fougères/);
});

test('F05-AC22 : rien ne se tape dans une phrase automatique ; après « Personnaliser », le texte est libre et la formule ne s’applique plus', async ({ page }) => {
  const c = choixAuto('Suivre la lumière', 'S018');
  await ouvrir(page, { S015: [p1(), c] });
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).click();
  await page.keyboard.type('zzz');
  expect((await docEditeur(page))[1]).toEqual(c);
  await expect(message(page)).toContainText('Personnaliser');

  await copie(page).locator('[data-test="personnaliser"]').click();
  // Le renvoi est conservé tel quel, le texte devient modifiable.
  const perso = (await docEditeur(page))[1] as Choix;
  expect(perso.mode).toBe('perso');
  expect(perso.children[1]).toEqual(c.children[1]);
  await selectionner(page, { bloc: c.id, enfant: 0, offset: 0 }, { bloc: c.id, enfant: 0, offset: 33 });
  await page.keyboard.type("Si le chant t'attire, suis la lumière au ");
  await expect.poll(() => affiche(page, c.id)).toBe("Si le chant t'attire, suis la lumière au 21.");
  await page.locator('[data-test="formule"]').selectOption('va au');
  await page.waitForTimeout(100);
  expect(await affiche(page, c.id)).toBe("Si le chant t'attire, suis la lumière au 21.");
  expect(await liens(page)).toEqual(['S015>S018']);
});

test('F05-AC23 : retour à la phrase automatique après avertissement ; annuler rétablit le texte écrit à la main', async ({ page }) => {
  const c = choixPerso('Suivre la lumière', ["Si le chant t'attire, suis la lumière au ", renvoi('S018'), '.']);
  await ouvrir(page, { S015: [p1(), c] });
  await selectionner(page, { bloc: c.id, offset: 4 });
  await copie(page).locator('[data-test="revenir-auto"]').click();
  // Avertissement d'abord : rien n'a changé.
  expect((await docEditeur(page))[1]).toEqual(c);
  await copie(page).locator('[data-test="confirmer-auto"]').click();
  await expect(bloc(page, c.id)).toHaveText('Suivre la lumière : rends-toi au 21.');
  expect(((await doc(page, 'S015'))[1] as Choix).mode).toBe('auto');
  await copie(page).locator('[data-test="annuler"]').click();
  expect((await doc(page, 'S015'))[1]).toEqual(c);
  await expect.poll(() => affiche(page, c.id)).toBe("Si le chant t'attire, suis la lumière au 21.");
});

test('F05-AC23 : pas de retour à l’automatique pour une phrase à deux renvois', async ({ page }) => {
  const c = choixPerso('Porte', ['Ouvre au ', renvoi('S016'), ' ; sinon, va au ', renvoi('S040'), '.']);
  await ouvrir(page, { S015: [p1(), c] });
  await selectionner(page, { bloc: c.id, offset: 2 });
  await expect(copie(page).locator('[data-test="panneau"]')).toBeVisible();
  await expect(copie(page).locator('[data-test="revenir-auto"]')).toHaveCount(0);
});

test('F05-AC09 : second renvoi inséré au curseur d’une phrase personnalisée, chacun avec sa destination', async ({ page }) => {
  const c = choixPerso('Porte', ["Si tu as la clé d'argent, ouvre la porte au ", renvoi('S016'), ' ; sinon, déchiffre les symboles au .']);
  await ouvrir(page, { S015: [p1(), c] });
  await selectionner(page, { bloc: c.id, enfant: 2, offset: 36 });
  await copie(page).locator('[data-test="inserer-renvoi"]').click();
  await expect(bloc(page, c.id).locator('.numero.vide')).toHaveCount(1);
  await copie(page).locator('[data-test="panneau-destination-1"]').selectOption('S040');
  await expect.poll(() => affiche(page, c.id)).toBe("Si tu as la clé d'argent, ouvre la porte au 22 ; sinon, déchiffre les symboles au 33.");
  expect((await liens(page)).sort()).toEqual(['S015>S016', 'S015>S040']);
  // Les mêmes mots dans le livre et le lecteur en ligne ; activer 22 conduit à S016.
  for (const mode of ['livre', 'lecteur']) {
    await expect(page.locator(`[data-test="lecture-${mode}"] [data-bloc="choix"]`)).toHaveText(
      "Si tu as la clé d'argent, ouvre la porte au 22 ; sinon, déchiffre les symboles au 33."
    );
  }
  await page.locator('[data-test="lecture-lecteur"] button.numero', { hasText: '22' }).click();
  await expect(page.locator('[data-test="lue"]')).toHaveValue('S016');
});

test('« Régénérer » change la construction, qui reste ensuite enregistrée', async ({ page }) => {
  const c = choixAuto('Suivre le chant', 'S018');
  await ouvrir(page, { S015: [p1(), c] });
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).click();
  await copie(page).locator('[data-test="regenerer"]').click();
  const nouveau = (await doc(page, 'S015'))[1] as Choix;
  expect(nouveau.construction).not.toBe(0);
  const attendu = ['', 'Pour suivre le chant, rends-toi au 21.', 'Si tu veux suivre le chant, rends-toi au 21.', 'Suivre le chant ? Rends-toi au 21.'][nouveau.construction];
  await expect(bloc(page, c.id)).toHaveText(attendu);
  expect(chaine(nouveau)).toBe('');
});
