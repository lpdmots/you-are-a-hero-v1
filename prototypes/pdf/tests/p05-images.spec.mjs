// Point 5 — Images (F10-AC13, AC14, AC15, F11.3) : largeurs, pleine page à
// l'intérieur des marges, image trop grande réduite, dessin peu défini.
import { test, expect, exporter, lirePdf, deposer, livreDe, p, texte, image, choix, PT } from './outils.mjs';
import { controler } from '../src/composer.mjs';

const LARGEUR_TEXTE = 113;
const paysage = (id, largeur) => image(id, 'images/ill-01-paysage.jpg', [1500, 1000], largeur);
const livreImages = () =>
  livreDe([
    { id: 'A', depart: true, blocs: [p('a1', texte(40)), paysage('i-petite', 'petite'), p('a2', texte(30)), paysage('i-moyenne', 'moyenne'), choix('a3', 'Continuer', 'B')] },
    { id: 'B', blocs: [p('b1', texte(30)), paysage('i-pleine', 'pleine'), p('b2', texte(30)), paysage('i-60', { pourcent: 60 }), choix('b3', 'Continuer', 'C')] },
    { id: 'C', blocs: [p('c1', texte(30)), image('i-page', 'images/ill-03-portrait.jpg', [1340, 2040], 'page'), p('c2', texte(30)), choix('c3', 'Continuer', 'D')] },
    { id: 'D', blocs: [p('d1', texte(30)), image('i-haute', 'images/ill-03-portrait.jpg', [1340, 2040], 'pleine'), p('d2', texte(20)), choix('d3', 'Continuer', 'E')] },
    { id: 'E', fin: true, blocs: [p('e1', texte(30)), image('i-dessin', 'images/ill-04-dessin.jpg', [340, 250], 'pleine')] },
  ]);

test('F10-AC13 : petite, moyenne, pleine largeur et 60 % occupent la largeur prévue dans le PDF', async ({ serveur }) => {
  await deposer(serveur, 'images', livreImages());
  const r = await exporter(serveur, 'definitif', 'images');
  const pdf = await lirePdf(r.fichier, { images: true });
  const largeurs = pdf.flatMap((pg) => pg.images.map((i) => +(i.largeur / PT).toFixed(1)));
  // Dans l'ordre du livre : 40 %, 65 %, 100 %, 60 %, pleine page, portrait réduit, dessin en pleine largeur.
  const attendues = [0.4, 0.65, 1, 0.6].map((f) => +(LARGEUR_TEXTE * f).toFixed(1));
  expect(largeurs.slice(0, 4).map((l, i) => Math.abs(l - attendues[i]) < 0.3)).toEqual([true, true, true, true]);
  expect(Math.abs(largeurs.at(-1) - LARGEUR_TEXTE)).toBeLessThan(0.3);
});

test('pleine page : seule sur sa page, à l\'intérieur des marges, sans fond perdu', async ({ serveur }) => {
  await deposer(serveur, 'images', livreImages());
  const r = await exporter(serveur, 'definitif', 'images');
  const pdf = await lirePdf(r.fichier, { images: true });
  const page = pdf.find((pg) => pg.images.some((i) => i.hauteur / PT > 165));
  expect(page).toBeTruthy();
  expect(page.lignes.length).toBe(0);
  const [i] = page.images;
  expect(i.hauteur / PT).toBeLessThanOrEqual(173.1);
  expect(i.x).toBeGreaterThan(page.zone.gauche - 0.6);
  expect(i.x + i.largeur).toBeLessThan(page.zone.droite + 0.6);
  expect(i.y).toBeGreaterThan(page.zone.bas - 0.6);
  expect(i.y + i.hauteur).toBeLessThan(page.zone.haut + 0.6);
});

test('image trop grande pour la page : réduite, et la réduction est connue de la composition', async ({ serveur }) => {
  await deposer(serveur, 'images', livreImages());
  const r = await exporter(serveur, 'definitif', 'images');
  const pdf = await lirePdf(r.fichier, { images: true });
  const hautes = pdf.flatMap((pg) => pg.images).filter((i) => i.hauteur / PT > 150 && i.hauteur / PT < 165);
  expect(hautes.length).toBe(1);
  expect(hautes[0].hauteur / PT).toBeLessThanOrEqual(160.2);
  expect(Math.abs(hautes[0].largeur / hautes[0].hauteur - 1340 / 2040)).toBeLessThan(0.01); // proportions gardées
  expect(r.ajustementsNonAppliques).toContainEqual(expect.objectContaining({ genre: 'largeur-image', bloc: 'i-haute', demande: 100 }));
  expect(r.debordements).toEqual([]);
});

test('F10-AC15 : un dessin peu défini avertit sans bloquer le PDF définitif', async ({ serveur }) => {
  const livre = livreImages();
  const c = controler(livre);
  expect(c.bloquants).toEqual([]);
  expect(c.avertissements).toContainEqual(expect.objectContaining({ code: 'image-peu-definie', bloc: 'i-dessin', ppp: 76 }));
  // Une image de 1 500 points sur 113 mm fait 337 points par pouce : pas d'avertissement.
  expect(c.avertissements.filter((a) => a.code === 'image-peu-definie').length).toBe(1);
  await deposer(serveur, 'images', livre);
  const r = await exporter(serveur, 'definitif', 'images');
  expect(r.refuse).toBeUndefined();
  expect(r.pages).toBeGreaterThan(5);
});
