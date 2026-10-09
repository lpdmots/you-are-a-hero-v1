// Une commande pour les deux fichiers : PDF de travail puis PDF définitif.
//
//   node exporter.mjs                 → sorties/livre-travail.pdf, sorties/livre-definitif.pdf
//   node exporter.mjs --livre=essai
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { demarrer } from './serveur.mjs';

const RACINE = dirname(fileURLToPath(import.meta.url));
const livre = process.argv.find((a) => a.startsWith('--livre='))?.slice(8) ?? 'essai';
const { adresse, etat, fermer } = await demarrer({ port: 0 });
if (!etat.livres.has(livre)) {
  console.error("Aucun livre : lancer d'abord « npm run livre ».");
  process.exit(1);
}
console.log(`Livre : ${etat.livres.get(livre).origine}`);
mkdirSync(join(RACINE, 'sorties'), { recursive: true });
const rapport = { livre: etat.livres.get(livre).origine, date: new Date().toISOString() };
let code = 0;
for (const genre of ['travail', 'definitif']) {
  const r = await fetch(`${adresse}/api/export?livre=${livre}&genre=${genre}&fichier=livre-${genre}.pdf`, { method: 'POST' }).then((x) => x.json());
  rapport[genre] = r;
  if (r.refuse) {
    code = 2;
    console.log(`PDF définitif refusé : ${r.bloquants.length} problème(s) à corriger avant.`);
    for (const b of r.bloquants) console.log(`  - ${b.message}`);
  } else if (r.erreur) {
    code = 1;
    console.log(`PDF ${genre} : échec — ${r.erreur}`);
  } else {
    console.log(
      `PDF ${genre} : ${r.pages - r.pagesHorsPagination} pages de livre${r.pagesHorsPagination ? ` + ${r.pagesHorsPagination} hors pagination` : ''}, ` +
        `${(r.tailleOctets / 1048576).toFixed(1)} Mo, ${(r.durees.total / 1000).toFixed(1)} s (mise en page ${(r.durees.miseEnPage / 1000).toFixed(1)} s, impression ${(r.durees.impression / 1000).toFixed(1)} s), ` +
        `mémoire Chromium ${r.memoire.picChromiumMo} Mo — état du ${r.date}\n  → ${r.fichier}`
    );
    for (const a of r.ajustementsNonAppliques) console.log(`  ajustement non appliqué : ${JSON.stringify(a)}`);
    for (const d of r.debordements) console.log(`  page qui déborde : ${JSON.stringify(d)}`);
  }
}
writeFileSync(join(RACINE, 'sorties', 'rapport-export.json'), JSON.stringify(rapport, null, 1));
await fermer();
process.exit(code);
