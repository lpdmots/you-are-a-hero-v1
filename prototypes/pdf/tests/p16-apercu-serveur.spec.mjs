// Complément au point 2 — Si l'aperçu devait être calculé par le serveur, avec
// le même Chromium que le PDF, il faudrait encore retrouver la scène sous un
// clic. Ce test vérifie seulement que la composition sait dire où se trouve
// chaque bloc ; l'affichage d'un tel aperçu n'est pas prototypé.
import { readFileSync, statSync } from 'node:fs';
import { test, expect, exporter, lirePdf, normaliser, noter, PT } from './outils.mjs';

test('la carte des blocs situe chaque paragraphe à l\'endroit où le PDF l\'imprime', async ({ serveur }) => {
  const r = await exporter(serveur, 'definitif');
  const fichier = r.fichier.replace(/\.pdf$/, '.carte.json');
  const carte = JSON.parse(readFileSync(fichier, 'utf8'));
  const pdf = await lirePdf(r.fichier);
  expect(carte.length).toBe(r.blocsDansLaCarte);
  expect(carte.length).toBeGreaterThan(500);

  // La coquille de S005 : la carte donne sa page et son rectangle ; le PDF y imprime bien ce texte.
  const { html } = await fetch(`${serveur.adresse}/api/composition?marques=0`).then((x) => x.json());
  const bloc = html.match(/data-scene="S005"[^>]*data-bloc="([^"]+)"/)[1];
  const zone = carte.find((c) => c.bloc === bloc);
  expect(zone.scene).toBe('S005');
  const page = pdf[zone.folio - 1];
  const dedans = page.lignes.filter((l) => {
    const yDuHaut = (page.hauteur - l.y) / PT; // la carte compte depuis le haut de la page
    return yDuHaut >= zone.y && yDuHaut <= zone.y + zone.h + 1 && l.x / PT >= zone.x - 1;
  });
  expect(normaliser(dedans.map((l) => l.texte).join(''))).toContain(normaliser("Tu marches depuis une heure lorsque la brume s'épaissi"));

  // Un clic au milieu de ce rectangle désigne ce bloc, et lui seul.
  const clic = { folio: zone.folio, x: zone.x + zone.l / 2, y: zone.y + zone.h / 2 };
  const touches = carte.filter((c) => c.folio === clic.folio && clic.x >= c.x && clic.x <= c.x + c.l && clic.y >= c.y && clic.y <= c.y + c.h);
  expect(touches.map((c) => c.bloc)).toEqual([bloc]);
  noter('apercuServeur', { blocsDansLaCarte: carte.length, poidsDeLaCarteKo: Math.round(statSync(fichier).size / 1024), dureeDuRenduMs: r.durees.total, affichage: 'non prototypé' });
});
