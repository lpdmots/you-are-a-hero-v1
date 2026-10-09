// Outils communs aux tests : serveur de l'essai, exports mis en mémoire,
// lecture de l'aperçu, petits livres de test, journal des mesures.
import { test as base, expect, chromium, webkit } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demarrer } from '../serveur.mjs';
import { lirePdf, normaliser } from '../outils/lire-pdf.mjs';

export { expect, chromium, webkit, lirePdf, normaliser };
export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SORTIES = join(RACINE, 'sorties');
export const PT = 72 / 25.4;

export const test = base.extend({
  serveur: [
    async ({}, use) => {
      const s = await demarrer({ port: 0 });
      await use(s);
      await s.fermer();
    },
    { scope: 'worker' },
  ],
});

/** Les mesures chiffrées sont écrites dans sorties/mesures.json, pour l'architecture. */
export function noter(cle, valeur) {
  mkdirSync(SORTIES, { recursive: true });
  const f = join(SORTIES, 'mesures.json');
  const m = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
  m[cle] = valeur;
  writeFileSync(f, JSON.stringify(m, null, 1));
}

const exports = new Map();
/** Export du livre, une seule fois par genre et par livre pour toute la série. */
export function exporter(serveur, genre, livre = 'essai', { frais = false } = {}) {
  const cle = `${livre}-${genre}`;
  if (frais || !exports.has(cle)) {
    exports.set(
      cle,
      fetch(`${serveur.adresse}/api/export?livre=${livre}&genre=${genre}&fichier=test-${cle}${frais ? `-${Date.now()}` : ''}.pdf`, { method: 'POST' }).then((r) => r.json())
    );
  }
  return exports.get(cle);
}

export async function deposer(serveur, nom, livre) {
  await fetch(`${serveur.adresse}/api/livre?livre=${nom}`, { method: 'PUT', body: JSON.stringify({ livre }) });
  return nom;
}
export const livreEssai = (serveur, nom = 'essai') => fetch(`${serveur.adresse}/api/livre?livre=${nom}`).then((r) => r.json());

/** Ouvre l'aperçu et attend la fin de la mise en page. */
export async function ouvrir(serveur, { moteur = chromium, lancement = {}, contexte = {}, params = {} } = {}) {
  const navigateur = await moteur.launch(lancement);
  const page = await navigateur.newPage(contexte);
  await page.goto(`${serveur.adresse}/?${new URLSearchParams(params)}`);
  await page.waitForFunction(() => window.__etat === 'pret' || window.__etat === 'erreur', null, { timeout: 150_000 });
  expect(await page.evaluate(() => window.__erreur ?? null)).toBeNull();
  return { navigateur, page };
}

/** Lignes du livre dans l'aperçu, page par page (hors page récapitulative). */
export async function lignesApercu(page) {
  return (await page.evaluate(() => window.__lignesParPage())).filter((p) => !p.horsPagination);
}

/** Pages dont les lignes diffèrent entre deux lectures (aperçu ou PDF). */
export function pagesDifferentes(a, b) {
  const lignes = (p) => (p?.lignes ?? []).map((l) => normaliser(typeof l === 'string' ? l : l.texte)).join('|');
  const ecarts = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (lignes(a[i]) !== lignes(b[i])) ecarts.push(i + 1);
  return ecarts;
}

// --- Petits livres de test ---------------------------------------------------
const PHRASE = "La brume s'épaississait lentement autour de la cabane du passeur, et chacun retenait son souffle en écoutant les planches craquer sous les pas d'un visiteur invisible. ";
export const texte = (mots) => {
  const m = PHRASE.repeat(Math.ceil(mots / 28)).split(' ').slice(0, mots).join(' ');
  return m.endsWith('.') ? m : `${m}.`;
};
export const p = (id, t) => ({ type: 'p', id, children: [{ text: t }] });
export const action = (id, t) => ({ type: 'action', id, children: [{ text: t }] });
export const renvoi = (id, cible) => ({ type: 'renvoi', id, cible, children: [{ text: '' }] });
export const choix = (id, libelle, cible, construction = 0) => ({ type: 'choix', id, mode: 'auto', libelle, construction, children: [renvoi(`r-${id}`, cible)] });
export const image = (id, src, px, largeur) => ({ type: 'image', id, src, px, largeur, alt: '' });
export function livreDe(scenes, extra = {}) {
  return {
    titre: 'Livre de test',
    signature: 'Essai',
    annee: '2026',
    reglages: { formule: 'rends-toi au', titresDePartie: true, marqueFin: 'Fin' },
    parties: [{ id: 'P1', titre: 'Partie une', ouverture: scenes[0].id }],
    scenes: scenes.map((s) => ({ partie: 'P1', incluse: true, prete: true, titre: s.id, ...s })),
    ordre: scenes.map((s) => s.id),
    presentation: {},
    ...extra,
  };
}
