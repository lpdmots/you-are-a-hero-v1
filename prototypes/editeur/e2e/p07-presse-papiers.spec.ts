// Point 7 — presse-papiers : couper déplace, copier duplique, l'extérieur ne crée rien.
import { expect, test } from '@playwright/test';

import { type Choix, type Doc, type Renvoi, action, choixAuto, recit } from '../src/modele';
import { MOD, bloc, chaine, copie, doc, docEditeur, liens, message, ouvrir, presseExterieur, presseTexte, renvoisDansRecit, selectionner, texte, types } from './outils';

const p1 = recit('Lou fit un pas, puis un autre.');
const q1 = recit('Le sentier montait entre les fougères.');
const q2 = recit('Lou hésita.');
const phrase = () => choixAuto('Continuer vers la lumière', 'S018');
const renvoiDe = (c: Doc[number]) => (c.children as unknown[]).find((n) => (n as Renvoi).type === 'renvoi') as Renvoi;

test('F05-AC30 : couper-coller vers une autre scène déplace le même choix, le graphe suit', async ({ page }) => {
  const c = phrase();
  await ouvrir(page, { S015: [p1, c], S016: [q1, q2] });
  expect(await liens(page)).toEqual(['S015>S018']);
  await texte(page, 'A').locator(`[data-id="${c.id}"] .contenu`).click();
  await page.keyboard.press(`${MOD}+x`);
  expect(types(await doc(page, 'S015'))).toEqual(['p']);
  expect(await liens(page)).toEqual([]);

  await selectionner(page, { bloc: q1.id, offset: 38 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  const b = await doc(page, 'S016');
  expect(types(b)).toEqual(['p', 'choix', 'p']);
  // Même choix : même identité, même libellé, même forme, même destination.
  expect(b[1]).toEqual(c);
  expect(await liens(page)).toEqual(['S016>S018']);
  await expect(bloc(page, c.id, 'B')).toHaveText('Continuer vers la lumière : rends-toi au 21.');
});

test('F05-AC31 : copier-coller crée un autre choix, indépendant du premier', async ({ page }) => {
  const c = phrase();
  await ouvrir(page, { S015: [p1, c], S016: [q1, q2] });
  await texte(page, 'A').locator(`[data-id="${c.id}"] .contenu`).click();
  await page.keyboard.press(`${MOD}+c`);
  await selectionner(page, { bloc: q2.id, offset: 11 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  const b = await doc(page, 'S016');
  expect(types(b)).toEqual(['p', 'p', 'choix']);
  const colle = b[2] as Choix;
  expect(colle.id).not.toBe(c.id);
  expect(renvoiDe(colle).id).not.toBe(renvoiDe(c).id);
  expect(colle.libelle).toBe(c.libelle);
  expect(renvoiDe(colle).cible).toBe('S018');
  expect((await liens(page)).sort()).toEqual(['S015>S018', 'S016>S018']);

  // Modifier le libellé de l'un ne change pas l'autre.
  await texte(page, 'B').locator(`[data-id="${colle.id}"] .contenu`).click();
  await copie(page, 'B').locator('[data-test="panneau-libelle"]').fill('Suivre la lumière');
  await copie(page, 'B').locator('[data-test="panneau-libelle"]').press('Enter');
  expect(((await doc(page, 'S016'))[2] as Choix).libelle).toBe('Suivre la lumière');
  expect(((await doc(page, 'S015'))[1] as Choix).libelle).toBe('Continuer vers la lumière');
});

test('entre chapitres : l’adulte déplace un choix vers une scène du marais', async ({ page }) => {
  const c = phrase();
  const m = recit("L'eau noire clapotait contre la berge.");
  await ouvrir(page, { S015: [p1, c], S040: [m] }, { B: 'S040' });
  await texte(page, 'A').locator(`[data-id="${c.id}"] .contenu`).click();
  await page.keyboard.press(`${MOD}+x`);
  await selectionner(page, { bloc: m.id, offset: 38 }, undefined, 'B');
  await page.keyboard.press(`${MOD}+v`);
  expect(await liens(page)).toEqual(['S040>S018']);
  expect((await doc(page, 'S040'))[1]).toEqual(c);
});

test('vers l’extérieur : la phrase et l’action de jeu sortent en texte simple, avec le numéro affiché', async ({ page }) => {
  const c = phrase();
  const a = action('Ajoute le couteau à ton inventaire.');
  await ouvrir(page, { S015: [p1, c, a] });
  await texte(page).locator(`[data-id="${c.id}"] .contenu`).click();
  await page.keyboard.press(`${MOD}+c`);
  expect((await presseTexte(page)).trim()).toBe('Continuer vers la lumière : rends-toi au 21.');
  // Sélection de tout le texte : trois paragraphes de texte simple, sans repère ni balise.
  await texte(page).click();
  await page.keyboard.press(`${MOD}+a`);
  // Slate reporte la sélection du navigateur avec un léger retard : une copie
  // lancée dans les 100 ms suivantes prendrait l'ancienne sélection.
  await page.waitForTimeout(250);
  await page.keyboard.press(`${MOD}+c`);
  const lignes = (await presseTexte(page)).split('\n').map((l) => l.trim()).filter(Boolean);
  expect(lignes).toEqual(['Lou fit un pas, puis un autre.', 'Continuer vers la lumière : rends-toi au 21.', 'Ajoute le couteau à ton inventaire.']);
});

test('F05-AC33 : « rends-toi au 12 » collé depuis Word reste du texte ordinaire', async ({ page }) => {
  await ouvrir(page, { S015: [p1] });
  const html = `<html xmlns:w="urn:schemas-microsoft-com:office:word"><body><!--StartFragment--><p class=MsoNormal><span style='font-family:"Calibri"'>Si tu prends la clé, rends-toi au 12.</span></p><!--EndFragment--></body></html>`;
  await presseExterieur(page, html, 'Si tu prends la clé, rends-toi au 12.');
  await selectionner(page, { bloc: p1.id, offset: 30 });
  await page.keyboard.press('Enter');
  await page.keyboard.press(`${MOD}+v`);
  const d = await doc(page, 'S015');
  expect(d.map((b) => b.type)).toEqual(['p', 'p']);
  expect(chaine(d[1])).toBe('Si tu prends la clé, rends-toi au 12.');
  expect(await liens(page)).toEqual([]);
  expect(renvoisDansRecit(d)).toEqual([]);
});

test('F04-AC04 : collage nettoyé — mots, paragraphes et gras gardés ; police, taille et couleur retirées', async ({ page }) => {
  await ouvrir(page, { S015: [recit('')] });
  const html = `<html><body><!--StartFragment--><p class=MsoNormal style='margin:0cm'><span style='font-size:24.0pt;font-family:"Comic Sans MS";color:red'>Lou <b>courut</b> vers la rive.</span></p><p class=MsoNormal><span style='font-size:24.0pt;font-family:"Comic Sans MS";color:red'>Le <b style='mso-bidi-font-weight:normal'>pont</b> tremblait.</span></p><!--EndFragment--></body></html>`;
  await presseExterieur(page, html, 'Lou courut vers la rive.\nLe pont tremblait.');
  await texte(page).click();
  await page.keyboard.press(`${MOD}+v`);
  const d = await doc(page, 'S015');
  expect(d.map(chaine)).toEqual(['Lou courut vers la rive.', 'Le pont tremblait.']);
  expect(d.map((b) => b.type)).toEqual(['p', 'p']);
  const feuilles = d.flatMap((b) => b.children as Record<string, unknown>[]);
  expect(feuilles.filter((f) => f.bold).map((f) => f.text)).toEqual(['courut', 'pont']);
  // Aucune autre propriété que le texte et le gras.
  for (const f of feuilles) expect(Object.keys(f).filter((k) => k !== 'text' && k !== 'bold')).toEqual([]);
  for (const b of d) expect(Object.keys(b).sort()).toEqual(['children', 'id', 'type']);
  await expect(texte(page).locator('strong')).toHaveCount(2);
  expect(await texte(page).locator('[style*="color"], [style*="font"]').count()).toBe(0);
});

test('texte brut à plusieurs lignes : un paragraphe par ligne, jamais de phrase de choix scindée', async ({ page }) => {
  await ouvrir(page, { S015: [p1] });
  await page.evaluate(() => navigator.clipboard.writeText('Première ligne.\nrends-toi au 12'));
  await selectionner(page, { bloc: p1.id, offset: 30 });
  await page.keyboard.press(`${MOD}+v`);
  const d = await doc(page, 'S015');
  expect(d.map(chaine)).toEqual(['Lou fit un pas, puis un autre.', 'Première ligne.', 'rends-toi au 12']);
  expect(d.every((b) => b.type === 'p')).toBe(true);
});

test('fragment forgé visant une scène inconnue : la phrase est écartée', async ({ page }) => {
  await ouvrir(page, { S015: [p1] });
  await selectionner(page, { bloc: p1.id, offset: 30 });
  await page.evaluate(() => {
    const e = window.__proto.editeurs.A;
    e.tf.insertFragment([
      { type: 'p', children: [{ text: 'Texte venu d’ailleurs.' }] },
      { type: 'choix', id: 'x', mode: 'auto', libelle: 'Fuir', construction: 0, children: [{ text: '' }, { type: 'renvoi', id: 'y', cible: 'S999', children: [{ text: '' }] }, { text: '' }] },
    ]);
  });
  const d = await docEditeur(page);
  // Le texte est repris dans le paragraphe du curseur ; la phrase forgée n'entre pas.
  expect(d.map((b) => b.type)).toEqual(['p']);
  expect(chaine(d[0])).toBe('Lou fit un pas, puis un autre.Texte venu d’ailleurs.');
  await expect(message(page)).toContainText('Non collé');
});
