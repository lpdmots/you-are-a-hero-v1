// Point 3 — Marques du PDF de travail sans effet sur la mise en page
// (F11-AC15, F09-AC09, F05-AC08, F10-AC14, décision « une seule composition »).
import { test, expect, exporter, lirePdf, livreEssai, deposer, normaliser } from './outils.mjs';

test('F11-AC15 : le PDF de travail porte la mention et les références, le définitif aucune', async ({ serveur }) => {
  const travail = await exporter(serveur, 'travail');
  const definitif = await exporter(serveur, 'definitif');
  const t = await lirePdf(travail.fichier, { decalage: travail.pagesHorsPagination });
  const d = await lirePdf(definitif.fichier);
  const tout = (pages) => pages.flatMap((p) => p.elements.map((e) => e.texte)).join(' ');
  expect(tout(t)).toMatch(/version de travail/i);
  expect(tout(t)).toMatch(/S042/);
  expect(tout(t)).toMatch(/Image peu définie/);
  expect(tout(d)).not.toMatch(/version de travail/i);
  expect(tout(d)).not.toMatch(/S\d{3}/);
  expect(tout(d)).not.toMatch(/peu définie|inaccessible|non assurée/i);
});

test('les marques ne déplacent rien : mêmes lignes, aux mêmes endroits, dans les deux fichiers', async ({ serveur }) => {
  const travail = await exporter(serveur, 'travail');
  const definitif = await exporter(serveur, 'definitif');
  expect(travail.pagesHorsPagination).toBe(2); // page récapitulative et son verso, avant le livre
  const t = (await lirePdf(travail.fichier, { decalage: 2 })).slice(2);
  const d = await lirePdf(definitif.fichier);
  expect(t.length).toBe(d.length);
  for (let i = 0; i < d.length; i++) {
    expect(t[i].lignes.length, `page ${i + 1}`).toBe(d[i].lignes.length);
    d[i].lignes.forEach((l, k) => {
      expect(normaliser(t[i].lignes[k].texte), `page ${i + 1}, ligne ${k + 1}`).toBe(normaliser(l.texte));
      expect(Math.abs(t[i].lignes[k].x - l.x), `page ${i + 1}, ligne ${k + 1}`).toBeLessThan(0.02);
      expect(Math.abs(t[i].lignes[k].y - l.y), `page ${i + 1}, ligne ${k + 1}`).toBeLessThan(0.02);
    });
  }
});

test('la page récapitulative précède le livre, hors pagination : la première page du livre garde le folio 1', async ({ serveur }) => {
  const travail = await exporter(serveur, 'travail');
  const t = await lirePdf(travail.fichier, { decalage: 2 });
  const recap = t[0].elements.map((e) => e.texte).join(' ');
  expect(recap).toMatch(/Version de travail/i);
  expect(recap).toMatch(/À vérifier, sans blocage/);
  expect(recap).toMatch(/S037 est inaccessible/);
  expect(t[1].elements.length).toBe(0); // verso blanc : le livre reste en page de droite
  expect(t[2].elements.map((e) => e.texte).join(' ')).toMatch(/Les passeurs de brume/);
  // Premier folio imprimé : la première page du récit porte son rang dans le livre, récapitulatif exclu.
  const premiereRecit = t.find((p) => p.lignes.some((l) => normaliser(l.texte) === 'lalisière'));
  const folio = premiereRecit.elements.filter((e) => e.y < 18 * 72 / 25.4 && /^\d+$/.test(e.texte.trim()));
  expect(folio.map((e) => e.texte.trim())).toEqual([String(premiereRecit.folio)]);
});

test('F09-AC09, F10-AC14, F05-AC08 : problèmes montrés à leur place dans le PDF de travail, PDF définitif refusé', async ({ serveur }) => {
  const livre = await livreEssai(serveur);
  const s2 = livre.scenes.find((s) => s.id === 'S002');
  s2.blocs.find((b) => b.type === 'choix').children.find((c) => c.type === 'renvoi').cible = null; // choix sans destination
  livre.scenes.find((s) => s.id === 'S007').blocs.find((b) => b.type === 'image').src = 'images/absente.jpg'; // image manquante
  livre.scenes.find((s) => s.id === 'S035').numeroFixe = 59; // numéro fixé devenu impossible
  await deposer(serveur, 'problemes', livre);

  const refus = await fetch(`${serveur.adresse}/api/export?livre=problemes&genre=definitif`, { method: 'POST' });
  expect(refus.status).toBe(409);
  const { bloquants } = await refus.json();
  expect(bloquants.map((b) => b.code).sort()).toEqual(['destination', 'image-manquante', 'numero-fixe']);

  const { numeros } = await fetch(`${serveur.adresse}/api/composition?livre=problemes`).then((r) => r.json());
  const travail = await exporter(serveur, 'travail', 'problemes');
  const t = await lirePdf(travail.fichier, { decalage: travail.pagesHorsPagination });
  const recap = t[0].elements.map((e) => e.texte).join(' ');
  expect(recap).toMatch(/À corriger avant le PDF définitif/);
  expect(recap).toMatch(/Choix sans destination dans S002/);
  expect(recap).toMatch(/Image manquante dans S007/);
  expect(recap).toMatch(/Numéro fixé 59 impossible pour S035/);
  // Une marque en marge tient sur plusieurs lignes : on lit le texte de la page d'un seul tenant.
  const pageAvec = (motif) => t.slice(2).find((p) => motif.test(p.elements.map((e) => e.texte.trim()).join(' ')));
  // À sa place : la marque est sur la page qui porte le passage concerné.
  for (const [motif, scene] of [[/Destination à définir/, 'S002'], [/Image manquante/, 'S007'], [/Numéro fixé impossible/, 'S035']]) {
    const page = pageAvec(motif);
    expect(page, String(motif)).toBeTruthy();
    // L'en-tête courant de cette page couvre bien le numéro du passage concerné.
    const entete = page.elements.filter((e) => e.y > page.zone.haut + 3 && e.taille >= 8).sort((a, b) => a.x - b.x).map((e) => e.texte).join('').match(/\d+/g).map(Number);
    const n = numeros[scene];
    expect(n >= entete[0] && n <= entete.at(-1), `${scene} (n° ${n}) sur la page de sa marque, en-tête ${entete.join('–')}`).toBe(true);
  }
});
