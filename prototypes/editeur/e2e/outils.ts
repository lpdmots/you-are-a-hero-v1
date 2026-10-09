import { type Page, expect } from '@playwright/test';

import type { Doc, Role } from '../src/modele';

export const MOD = 'ControlOrMeta';

export type Options = { role?: Role; A?: string; B?: string };

/** Ouvre le prototype sur un jeu de scènes précis. */
export async function ouvrir(page: Page, docs: Record<string, Doc> = {}, options: Options & { nu?: boolean } = {}) {
  await page.goto(options.nu ? '/?nu' : '/');
  await page.waitForFunction(() => Boolean(window.__proto?.reinitialiser && window.__proto?.editeurs?.B));
  await page.evaluate(([d, o]) => window.__proto.reinitialiser(d, o), [docs, options] as const);
  await page.waitForFunction(() => Boolean(window.__proto.editeurs?.A && window.__proto.editeurs?.B));
  await page.waitForTimeout(150);
}

export const copie = (page: Page, cle = 'A') => page.locator(`[data-copie="${cle}"]`);
export const texte = (page: Page, cle = 'A') => copie(page, cle).locator('[data-test="texte"]');
export const bloc = (page: Page, id: string, cle = 'A') => copie(page, cle).locator(`[data-id="${id}"]`);
export const message = (page: Page, cle = 'A') => copie(page, cle).locator('[data-test="message"]');

/** Document enregistré côté serveur. */
export async function doc(page: Page, sceneId: string): Promise<Doc> {
  await page.waitForTimeout(80);
  return page.evaluate((id) => JSON.parse(JSON.stringify(window.__proto.serveur.scenes.get(id).doc)), sceneId);
}

/** Document tenu par l'éditeur, avant enregistrement. */
export const docEditeur = (page: Page, cle = 'A'): Promise<Doc> =>
  page.evaluate((c) => JSON.parse(JSON.stringify(window.__proto.editeurs[c].children)), cle);

export async function liens(page: Page): Promise<string[]> {
  await page.waitForTimeout(80);
  return page.evaluate(() => window.__proto.serveur.liens().map((l: { de: string; vers: string | null }) => `${l.de}>${l.vers ?? '?'}`));
}

type Point = { bloc: string; enfant?: number; offset: number };

/** Place le curseur ou une sélection par programme ; les frappes qui suivent sont réelles. */
export async function selectionner(page: Page, debut: Point, fin: Point = debut, cle = 'A') {
  await page.evaluate(
    ([c, d, f]) => {
      const e = window.__proto.editeurs[c];
      const point = (p: Point) => ({ path: [e.children.findIndex((b: { id: string }) => b.id === p.bloc), p.enfant ?? 0], offset: p.offset });
      e.tf.focus();
      e.tf.select({ anchor: point(d), focus: point(f) });
    },
    [cle, debut, fin] as const
  );
  await texte(page, cle).focus();
  await page.waitForTimeout(60);
}

/** Texte affiché d'un bloc, sans les caractères invisibles que Slate pose autour des éléments insécables. */
export async function affiche(page: Page, id: string, cle = 'A'): Promise<string> {
  return ((await bloc(page, id, cle).textContent()) ?? '').replace(/\uFEFF/g, '');
}

export const types = (d: Doc) => d.map((b) => b.type);
export const chaine = (b: Doc[number]) => (b.children as { text?: string }[]).map((n) => n.text ?? '').join('');
export const renvoisDansRecit = (d: Doc) =>
  d.filter((b) => b.type !== 'choix').flatMap((b) => (b.children as { type?: string }[]).filter((n) => n.type));

export async function presseTexte(page: Page): Promise<string> {
  return page.evaluate(() => navigator.clipboard.readText());
}

/** Dépose dans le presse-papiers ce qu'un autre logiciel y aurait mis. */
export async function presseExterieur(page: Page, html: string, brut: string) {
  await page.evaluate(
    async ([h, t]) => {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([h], { type: 'text/html' }), 'text/plain': new Blob([t], { type: 'text/plain' }) }),
      ]);
    },
    [html, brut] as const
  );
}

export async function attendreEnregistre(page: Page, cle = 'A') {
  await expect(copie(page, cle).locator('[data-test="etat"]')).toHaveAttribute('data-etat', 'enregistre');
}
