// Point 10 — Export sur un instantané (F11-AC26) : une modification faite
// pendant le calcul ne figure pas dans le fichier, et l'écart est signalé.
import { test, expect, lirePdf, livreEssai, deposer, normaliser } from './outils.mjs';

test('F11-AC26 : le PDF reflète l\'état du contenu au moment de la demande', async ({ serveur }) => {
  await deposer(serveur, 'instantane', await livreEssai(serveur));
  const avant = await fetch(`${serveur.adresse}/api/etat?livre=instantane`).then((r) => r.json());
  expect(avant.changeDepuisDefinitif).toBe(false);

  // 10 h 00 : demande du PDF définitif. Le calcul commence.
  const demande = fetch(`${serveur.adresse}/api/export?livre=instantane&genre=definitif&fichier=test-instantane.pdf`, { method: 'POST' }).then((r) => r.json());
  // 10 h 01 : une scène est modifiée avant la fin du calcul.
  await new Promise((ok) => setTimeout(ok, 300));
  const scene = (await livreEssai(serveur, 'instantane')).scenes.find((s) => s.id === 'S005');
  const correction = await fetch(`${serveur.adresse}/api/correction?livre=instantane`, {
    method: 'POST',
    body: JSON.stringify({ scene: 'S005', bloc: scene.blocs[0].id, source: 'Phrase écrite pendant le calcul du fichier, qui ne doit pas y figurer.' }),
  }).then((r) => r.json());
  expect(correction.ok).toBe(true);

  const r = await demande;
  expect(r.durees.total).toBeGreaterThan(300); // la modification est bien arrivée pendant le calcul
  expect(r.date).toMatch(/\d{4}/); // la date de l'état est indiquée
  expect(r.changeDepuis).toBe(true);
  const tout = normaliser((await lirePdf(r.fichier)).flatMap((pg) => pg.lignes.map((l) => l.texte)).join(''));
  expect(tout).toContain(normaliser("la brume s'épaissi brusquement"));
  expect(tout).not.toContain(normaliser('Phrase écrite pendant le calcul'));

  const apres = await fetch(`${serveur.adresse}/api/etat?livre=instantane`).then((x) => x.json());
  expect(apres.changeDepuisDefinitif).toBe(true); // « le livre a changé depuis ce PDF »
  expect(apres.dernierDefinitif.date).toBe(r.date);
});
