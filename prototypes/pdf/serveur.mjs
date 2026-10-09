// Serveur de l'essai : sert la page d'aperçu, compose le livre, reçoit les
// corrections et produit les PDF. Tout est en mémoire ; pas de compte, pas de
// base. Essai jetable.
//
//   node serveur.mjs            → http://localhost:4832
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { composerLivre, controler } from './src/composer.mjs';
import { cesure, sansCesure } from './src/cesure.mjs';
import { versSource, depuisSource } from './src/texte.mjs';
import { produirePdf } from './src/export.mjs';

const RACINE = dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.pdf': 'application/pdf' };
const POLICES = { literata: join(RACINE, 'node_modules/@fontsource/literata/files'), atkinson: join(RACINE, 'node_modules/@fontsource/atkinson-hyperlegible/files') };

/** Le livre fourni par le porteur s'il existe, sinon le livre fabriqué. */
export function dossierDuLivre() {
  const fourni = join(RACINE, 'livre');
  if (existsSync(join(fourni, 'livre.json'))) return { dossier: fourni, origine: 'fourni par le porteur (livre/)' };
  return { dossier: join(RACINE, 'sorties', 'livre-essai'), origine: 'fabriqué par outils/fabriquer-livre.mjs' };
}

const horodatage = (d = new Date()) =>
  d.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function creerEtat() {
  const livres = new Map(); // nom → { livre, dossier, version, definitif }
  const instantanes = new Map(); // id → { nom, livre, dossier, date, version }
  const { dossier, origine } = dossierDuLivre();
  if (existsSync(join(dossier, 'livre.json'))) livres.set('essai', { livre: JSON.parse(readFileSync(join(dossier, 'livre.json'), 'utf8')), dossier, version: 1, origine });
  return { livres, instantanes, n: 0 };
}

function composer(etat, nom, { marques, instantane, avecCesure = true }) {
  const source = instantane ? etat.instantanes.get(instantane) : etat.livres.get(nom);
  if (!source) throw Object.assign(new Error(`Livre ou instantané inconnu : ${instantane ?? nom}`), { code: 404 });
  const imageExiste = (src) => existsSync(join(source.dossier, src));
  const r = composerLivre(source.livre, {
    marques,
    cesure: avecCesure ? cesure : sansCesure,
    date: source.date ?? horodatage(),
    imageExiste,
    baseImages: `/fichiers/${encodeURIComponent(instantane ? etat.instantanes.get(instantane).nom : nom)}/`,
  });
  return { ...r, version: source.version };
}

function figer(etat, nom) {
  const source = etat.livres.get(nom);
  if (!source) throw Object.assign(new Error(`Livre inconnu : ${nom}`), { code: 404 });
  const id = `i${++etat.n}`;
  // L'instantané est une copie : les modifications ultérieures n'y figurent pas.
  // Les fichiers d'images de l'essai ne changent pas ; dans l'application, ils
  // devront être désignés par un identifiant immuable.
  etat.instantanes.set(id, { nom, livre: structuredClone(source.livre), dossier: source.dossier, date: horodatage(), version: source.version });
  return id;
}

async function corps(req) {
  const morceaux = [];
  for await (const m of req) morceaux.push(m);
  return morceaux.length ? JSON.parse(Buffer.concat(morceaux).toString('utf8')) : {};
}

export async function demarrer({ port = 4832, etat = creerEtat() } = {}) {
  let adresse = '';
  const serveur = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const q = url.searchParams;
    const nom = q.get('livre') ?? 'essai';
    const json = (objet, code = 200) => {
      res.writeHead(code, { 'content-type': TYPES['.json'], 'cache-control': 'no-store' });
      res.end(JSON.stringify(objet));
    };
    const fichier = (chemin) => {
      if (!existsSync(chemin) || !statSync(chemin).isFile()) return json({ erreur: 'introuvable' }, 404);
      res.writeHead(200, { 'content-type': TYPES[extname(chemin)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(readFileSync(chemin));
    };
    try {
      const chemin = decodeURIComponent(url.pathname);
      if (chemin === '/') return fichier(join(RACINE, 'public/apercu.html'));
      if (chemin.startsWith('/public/') || chemin.startsWith('/src/') || chemin.startsWith('/sorties/')) return fichier(join(RACINE, normalize(chemin)));
      if (chemin === '/pagedjs/paged.esm.js') return fichier(join(RACINE, 'node_modules/pagedjs/dist/paged.esm.js'));
      if (chemin.startsWith('/polices/')) {
        const f = chemin.slice(9);
        return fichier(join(f.startsWith('literata') ? POLICES.literata : POLICES.atkinson, normalize(f)));
      }
      if (chemin.startsWith('/fichiers/')) {
        const [, , livre, ...reste] = chemin.split('/');
        const source = etat.livres.get(livre);
        return source ? fichier(join(source.dossier, normalize(reste.join('/')))) : json({ erreur: 'livre inconnu' }, 404);
      }

      if (chemin === '/api/composition') {
        return json(composer(etat, nom, { marques: q.get('marques') !== '0', instantane: q.get('instantane'), avecCesure: q.get('cesure') !== '0' }));
      }
      if (chemin === '/api/livre' && req.method === 'GET') return json(etat.livres.get(nom)?.livre ?? null);
      if (chemin === '/api/livre' && req.method === 'PUT') {
        // Livres de test : déposés par les tests, images prises dans le livre d'essai.
        const { livre, dossier } = await corps(req);
        etat.livres.set(nom, { livre, dossier: dossier ?? dossierDuLivre().dossier, version: 1, origine: 'test' });
        return json({ ok: true });
      }
      if (chemin === '/api/source') {
        const scene = etat.livres.get(nom).livre.scenes.find((s) => s.id === q.get('scene'));
        const bloc = scene.blocs.find((b) => b.id === q.get('bloc'));
        return json({ source: versSource(bloc), genre: bloc.type === 'choix' && bloc.mode === 'auto' ? 'libelle' : 'texte' });
      }
      if (chemin === '/api/correction' && req.method === 'POST') {
        // La correction s'applique au texte de la scène elle-même, sans seconde copie (F11.2).
        const { scene: idScene, bloc: idBloc, source } = await corps(req);
        const entree = etat.livres.get(nom);
        const scene = entree.livre.scenes.find((s) => s.id === idScene);
        const i = scene.blocs.findIndex((b) => b.id === idBloc);
        scene.blocs[i] = depuisSource(scene.blocs[i], source);
        entree.version += 1;
        return json({ ok: true, version: entree.version, prete: scene.prete });
      }
      if (chemin === '/api/etat') {
        const e = etat.livres.get(nom);
        const d = e.definitif;
        return json({
          origine: e.origine,
          version: e.version,
          controles: controler(e.livre, { imageExiste: (src) => existsSync(join(e.dossier, src)) }),
          dernierDefinitif: d ?? null,
          changeDepuisDefinitif: d ? d.version !== e.version : false,
        });
      }
      if (chemin === '/api/export' && req.method === 'POST') {
        const genre = q.get('genre') ?? 'travail';
        const entree = etat.livres.get(nom);
        const instantane = figer(etat, nom); // état du contenu au moment de la demande (F11-AC26)
        const fige = etat.instantanes.get(instantane);
        if (genre === 'definitif') {
          const c = controler(fige.livre, { imageExiste: (src) => existsSync(join(fige.dossier, src)) });
          if (c.bloquants.length) return json({ refuse: true, bloquants: c.bloquants }, 409);
        }
        const sorties = join(RACINE, 'sorties');
        mkdirSync(sorties, { recursive: true });
        const sortie = join(sorties, q.get('fichier') ?? `${nom}-${genre}.pdf`);
        const r = await produirePdf({ base: adresse, livre: nom, instantane, marques: genre === 'travail', sortie });
        if (genre === 'definitif') entree.definitif = { date: fige.date, version: fige.version, fichier: sortie };
        return json({ ...r, genre, fichier: sortie, date: fige.date, version: fige.version, changeDepuis: entree.version !== fige.version });
      }
      return json({ erreur: 'introuvable' }, 404);
    } catch (e) {
      json({ erreur: String(e.message ?? e) }, e.code === 404 ? 404 : 500);
    }
  });
  await new Promise((ok) => serveur.listen(port, '127.0.0.1', ok));
  adresse = `http://127.0.0.1:${serveur.address().port}`;
  return { serveur, adresse, etat, fermer: () => new Promise((ok) => serveur.close(ok)) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { adresse, etat } = await demarrer({ port: Number(process.env.PORT ?? 4832) });
  console.log(`Aperçu : ${adresse.replace('127.0.0.1', 'localhost')}  —  livre : ${etat.livres.get('essai')?.origine ?? "absent (lancer d'abord : npm run livre)"}`);
}
