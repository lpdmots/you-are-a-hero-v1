// Point 4 — Numéros imprimés, renvois, titres de partie, en-tête courant,
// marque de fin (F11-AC18, AC20, AC22, AC33, AC34, F11-AC09, F05-AC09, AC10).
import { test, expect, exporter, lirePdf, livreEssai, ouvrir, normaliser, livreDe, p, choix, texte } from './outils.mjs';
import { composerLivre, numeroter } from '../src/composer.mjs';

const texteDe = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/ /g, ' ').replace(/\s+/g, ' ');

test('F11-AC20 : numéros continus de 1 à N, sans trou après une exclusion ; F11-AC33 : renvois recalculés', async ({ serveur }) => {
  const livre = await livreEssai(serveur);
  const avant = numeroter(livre);
  expect([...avant.values()]).toEqual(Array.from({ length: 60 }, (_, i) => i + 1));
  expect(avant.get(livre.scenes.find((s) => s.depart).id)).toBe(1); // le départ ouvre l'ordre fourni

  const exclue = livre.ordre[16]; // le n° 17
  livre.scenes.find((s) => s.id === exclue).incluse = false;
  const apres = numeroter(livre);
  expect([...apres.values()]).toEqual(Array.from({ length: 59 }, (_, i) => i + 1));
  expect(apres.has(exclue)).toBe(false);
  // Un renvoi vers une scène placée après l'exclue imprime son nouveau numéro, sans intervention.
  const { html } = composerLivre(livre);
  const cible = livre.ordre[40];
  expect(apres.get(cible)).toBe(avant.get(cible) - 1);
  expect(html).toContain(`data-cible="${cible}">${apres.get(cible)}</b>`);
  expect(html).not.toContain(`data-cible="${cible}">${avant.get(cible)}</b>`);
});

test('F11-AC09 : échanger deux scènes dans l\'ordre imprimé ne change pas la destination d\'un choix', async () => {
  const livre = livreDe([
    { id: 'A', depart: true, blocs: [p('a1', 'Départ.'), choix('a2', 'Suivre la lanterne', 'B')] },
    { id: 'B', fin: true, blocs: [p('b1', 'Scène B.')] },
    { id: 'C', fin: true, blocs: [p('c1', 'Scène C.')] },
  ]);
  expect(composerLivre(livre).html).toContain('data-cible="B">2</b>');
  livre.ordre = ['A', 'C', 'B'];
  const { html, numeros } = composerLivre(livre);
  expect(numeros).toEqual({ A: 1, C: 2, B: 3 });
  expect(html).toContain('data-cible="B">3</b>');
});

test('F05-AC10 : phrase automatique recomposée avec la formule du livre', async () => {
  const livre = livreDe([
    { id: 'A', depart: true, blocs: [p('a1', 'Départ.'), choix('a2', 'Suivre le chant', 'B')] },
    { id: 'B', fin: true, blocs: [p('b1', 'Scène B.')] },
  ]);
  expect(texteDe(composerLivre(livre).html)).toContain('Suivre le chant : rends-toi au 2 .');
  livre.reglages.formule = 'va au';
  expect(texteDe(composerLivre(livre).html)).toContain('Suivre le chant : va au 2 .');
});

test('F05-AC09 : la phrase à deux renvois imprime les deux numéros de destination dans le PDF', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const { numeros } = await fetch(`${serveur.adresse}/api/composition`).then((x) => x.json());
  const livre = await livreEssai(serveur);
  const phrase = livre.scenes.find((s) => s.id === 'S051').blocs.find((b) => b.type === 'choix' && b.mode === 'perso');
  const [a, b] = phrase.children.filter((c) => c.type === 'renvoi').map((c) => numeros[c.cible]);
  const attendu = normaliser(`Si tu as la clé d'argent, ouvre la porte au ${a} ; sinon, déchiffre les symboles au ${b}.`);
  const tout = normaliser(pdf.flatMap((pg) => pg.lignes.map((l) => l.texte)).join(''));
  expect(tout).toContain(attendu);
});

test('F11-AC22 : le titre de partie s\'imprime juste au-dessus de sa scène d\'ouverture', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const { numeros } = await fetch(`${serveur.adresse}/api/composition`).then((x) => x.json());
  for (const [titre, ouverture] of [['La lisière', 'S001'], ['Le marais', 'S019'], ['La tour des brumes', 'S043']]) {
    const page = pdf.find((pg) => pg.lignes.some((l) => normaliser(l.texte) === normaliser(titre)));
    expect(page, titre).toBeTruthy();
    const i = page.lignes.findIndex((l) => normaliser(l.texte) === normaliser(titre));
    expect(i, `${titre} en tête de page`).toBe(0);
    expect(normaliser(page.lignes[i + 1].texte), `numéro sous ${titre}`).toBe(String(numeros[ouverture]));
  }
});

test('en-tête courant : les numéros des passages présents sur la page, « 12 – 14 »', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const { navigateur, page } = await ouvrir(serveur, { params: { rendu: '1', marques: '0' } });
  const attendus = await page.evaluate(() =>
    [...document.querySelectorAll('.pagedjs_page')].map((pg) => {
      const n = [...pg.querySelectorAll('.pagedjs_page_content [data-numero]')].map((e) => Number(e.dataset.numero));
      return n.length ? (n[0] === n.at(-1) ? `${n[0]}` : `${n[0]} – ${n.at(-1)}`) : '';
    })
  );
  await navigateur.close();
  let verifies = 0;
  pdf.forEach((pg, i) => {
    const entete = pg.elements.filter((e) => e.y > pg.zone.haut + 3).sort((a, b) => a.x - b.x).map((e) => e.texte).join('').trim();
    expect(entete, `page ${i + 1}`).toBe(attendus[i]);
    if (attendus[i].includes('–')) verifies++;
  });
  expect(verifies).toBeGreaterThan(20);
});

test('F11-AC34 : la marque de fin s\'imprime avant le choix d\'une fin qui permet de recommencer', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const pdf = await lirePdf(r.fichier);
  const lignes = pdf.flatMap((pg) => pg.lignes.map((l) => normaliser(l.texte)));
  const i = lignes.indexOf(normaliser('Tu peux retenter ta chance au 1.'));
  expect(i).toBeGreaterThan(0);
  expect(lignes[i - 1]).toBe('fin');
  expect((await fetch(`${serveur.adresse}/api/etat`).then((x) => x.json())).controles.bloquants).toEqual([]);
});
