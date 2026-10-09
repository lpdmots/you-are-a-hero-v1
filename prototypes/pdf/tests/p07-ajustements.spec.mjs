// Point 7 — Ajustements de composition (F11-AC10, AC11) : conservés au
// réexport tant qu'ils sont applicables, signalés quand ils ne le sont plus.
import { test, expect, exporter, lirePdf, normaliser, livreEssai, deposer, ouvrir, livreDe, p, choix, texte, image } from './outils.mjs';

const etat = () =>
  [...document.querySelectorAll('h2.numero.nouvelle-page')].map((t) => ({
    scene: t.dataset.scene,
    folio: Number(t.closest('.pagedjs_page').dataset.folio),
    enHaut: !t.previousElementSibling || t.previousElementSibling.matches('h1.partie'),
  }));
const largeur60 = () => {
  const f = document.querySelector('figure.image[data-pourcent="60"]');
  return Math.round((f.querySelector('img').getBoundingClientRect().width / f.closest('.pagedjs_page_content').getBoundingClientRect().width) * 100);
};

test('F11-AC10 : saut de page et largeur d\'image conservés après une modification du texte', async ({ serveur }) => {
  const avant = await ouvrir(serveur, { params: { rendu: '1', marques: '0' } });
  const a = await avant.page.evaluate(etat);
  const la = await avant.page.evaluate(largeur60);
  await avant.navigateur.close();
  expect(a.length).toBe(2);
  expect(a.every((x) => x.enHaut)).toBe(true);
  expect(la).toBe(60);

  // Le texte évolue en amont : deux pages de plus avant les scènes réglées.
  const livre = await livreEssai(serveur);
  const premiere = livre.scenes.find((s) => s.id === livre.ordre[2]);
  premiere.blocs.unshift(p('ajout-1', texte(260)), p('ajout-2', texte(260)));
  await deposer(serveur, 'ajuste', livre);
  const apres = await ouvrir(serveur, { params: { rendu: '1', marques: '0', livre: 'ajuste' } });
  const b = await apres.page.evaluate(etat);
  const lb = await apres.page.evaluate(largeur60);
  const rapport = await apres.page.evaluate(() => window.__rapport.ajustementsNonAppliques);
  await apres.navigateur.close();
  expect(b.map((x) => x.scene)).toEqual(a.map((x) => x.scene));
  expect(b.every((x) => x.enHaut)).toBe(true); // le saut est conservé
  expect(b[0].folio).toBeGreaterThan(a[0].folio); // le numéro de page, lui, a changé
  expect(lb).toBe(60);
  expect(rapport.filter((x) => x.genre === 'nouvelle-page')).toEqual([]);
});

test('F11-AC11 : une largeur d\'image qui ne peut plus être appliquée est signalée, pas passée sous silence', async ({ serveur }) => {
  const portrait = (largeur) => image('img', 'images/ill-03-portrait.jpg', [1340, 2040], largeur);
  const livre = (largeur) => livreDe([{ id: 'A', depart: true, fin: true, blocs: [p('a1', texte(60)), portrait(largeur), p('a2', texte(40))] }]);
  await deposer(serveur, 'aj-possible', livre({ pourcent: 50 }));
  const ok = await exporter(serveur, 'travail', 'aj-possible');
  expect(ok.ajustementsNonAppliques).toEqual([]);
  // L'adulte demande 95 % : l'image, trop haute pour la page, ne peut pas atteindre cette largeur.
  await deposer(serveur, 'aj-impossible', livre({ pourcent: 95 }));
  const ko = await exporter(serveur, 'travail', 'aj-impossible');
  expect(ko.ajustementsNonAppliques.length).toBe(1);
  expect(ko.ajustementsNonAppliques[0]).toMatchObject({ genre: 'largeur-image', scene: 'A', bloc: 'img', demande: 95 });
  expect(ko.ajustementsNonAppliques[0].obtenu).toBeLessThan(95);
});

test('un groupe de choix plus haut qu\'une page est coupé plutôt que perdu ou débordant', async ({ serveur }) => {
  // Quarante phrases de choix d'affilée : le groupe ne peut pas tenir sur une page.
  const cibles = Array.from({ length: 40 }, (_, i) => choix(`c${i}`, `Prendre le chemin numéro ${i + 1} qui s'enfonce dans la brume`, 'B'));
  await deposer(serveur, 'deborde', livreDe([{ id: 'A', depart: true, blocs: [p('a1', texte(30)), ...cibles] }, { id: 'B', fin: true, blocs: [p('b1', texte(20))] }]));
  const r = await exporter(serveur, 'travail', 'deborde');
  expect(r.debordements).toEqual([]);
  const pdf = await lirePdf(r.fichier, { decalage: r.pagesHorsPagination });
  const tout = normaliser(pdf.flatMap((pg) => pg.lignes.map((l) => l.texte)).join(''));
  for (let i = 1; i <= 40; i++) expect(tout, `choix ${i}`).toContain(normaliser(`Prendre le chemin numéro ${i} qui`));
  const pagesAvecChoix = pdf.filter((pg) => pg.lignes.some((l) => /chemin numéro/.test(l.texte))).length;
  expect(pagesAvecChoix).toBeGreaterThan(1);
});
