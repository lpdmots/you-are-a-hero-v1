// Point 14 — Faisabilité dans une fonction Vercel : ce qui se mesure sans rien
// déployer. L'exécution réelle chez Vercel reste « non vérifiée ».
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { join } from 'node:path';
import { test, expect, exporter, noter, RACINE } from './outils.mjs';

const poids = (dossier) =>
  readdirSync(dossier, { withFileTypes: true }).reduce((t, f) => t + (f.isDirectory() ? poids(join(dossier, f.name)) : statSync(join(dossier, f.name)).size), 0);
const Mo = (o) => +(o / 1048576).toFixed(1);

test('taille de ce qu\'il faudrait embarquer, comparée à la limite de 250 Mo', async ({ serveur }) => {
  const nm = join(RACINE, 'node_modules');
  const bin = join(nm, '@sparticuz/chromium/bin');
  const compresse = poids(join(nm, '@sparticuz/chromium'));
  // Le Chromium embarquable est livré compressé ; il se décompresse au démarrage dans /tmp.
  const decompresse = readdirSync(bin).reduce((t, f) => t + brotliDecompressSync(readFileSync(join(bin, f))).length, 0);
  const paquet = {
    chromiumEmbarqueCompresseMo: Mo(compresse),
    chromiumEmbarqueDecompresseMo: Mo(decompresse),
    playwrightCoreMo: Mo(poids(join(nm, 'playwright-core'))),
    pagedjsFichierUtileMo: Mo(statSync(join(nm, 'pagedjs/dist/paged.esm.js')).size),
    pdfLibMo: Mo(poids(join(nm, 'pdf-lib'))),
    cesureMotifsFrancaisMo: Mo(statSync(join(nm, 'hyphenopoly/patterns/fr.wasm')).size + statSync(join(nm, 'hyphenopoly/hyphenopoly.module.js')).size),
    policesDuLivreMo: Mo(
      ['literata-latin-400-normal', 'literata-latin-400-italic', 'literata-latin-700-normal'].reduce((t, f) => t + statSync(join(nm, '@fontsource/literata/files', `${f}.woff2`)).size, 0) +
        ['atkinson-hyperlegible-latin-400-normal', 'atkinson-hyperlegible-latin-700-normal'].reduce((t, f) => t + statSync(join(nm, '@fontsource/atkinson-hyperlegible/files', `${f}.woff2`)).size, 0)
    ),
  };
  paquet.totalDansLaFonctionMo = +(paquet.chromiumEmbarqueCompresseMo + paquet.playwrightCoreMo + paquet.pagedjsFichierUtileMo + paquet.pdfLibMo + paquet.cesureMotifsFrancaisMo + paquet.policesDuLivreMo).toFixed(1);
  const r = await exporter(serveur, 'definitif');
  const limites = { tailleMo: 250, memoireParDefautMo: 2048, memoireMaxProMo: 4096, dureeParDefautS: 300, dureeMaxProS: 800, reponseMo: 4.5 };
  noter('vercel', {
    paquet,
    limites,
    mesureLocale: { dureeS: +(r.durees.total / 1000).toFixed(1), memoireMo: r.memoire.picChromiumMo + r.memoire.picNodeMo, pdfMo: Mo(r.tailleOctets) },
    pdfDepasseLaReponseDirecte: r.tailleOctets / 1048576 > limites.reponseMo,
    nonVerifie: 'exécution du Chromium Linux embarqué, démarrage à froid, durée et mémoire réelles chez Vercel, accord entre ce Chromium et Playwright',
  });
  expect(paquet.totalDansLaFonctionMo).toBeLessThan(limites.tailleMo);
  expect(r.durees.total / 1000).toBeLessThan(limites.dureeParDefautS);
});
