// Page d'aperçu de l'essai. La même page sert à l'écran (aperçu corrigeable)
// et, avec ?rendu=1, de source au PDF : une seule composition (F11.2).
import { Previewer, registerHandlers } from '/pagedjs/paged.esm.js';
import { Greffon, lignesParPage } from '/public/greffon.js';

registerHandlers(Greffon);
window.__lignesParPage = lignesParPage;

const q = new URLSearchParams(location.search);
const rendu = q.get('rendu') === '1';
const livre = q.get('livre') ?? 'essai';
if (rendu) document.body.classList.add('rendu');
// Contre-épreuve des tests : ?coupures=0 retire les règles de coupure.
if (q.get('coupures') === '0') document.querySelector('link[href="/src/coupures.css"]').disabled = true;

const $ = (id) => document.getElementById(id);
const pages = $('pages');
let derniere = null;

async function composer() {
  window.__etat = 'composition';
  const marques = rendu ? q.get('marques') !== '0' : $('marques').checked;
  const params = new URLSearchParams({ livre, marques: marques ? '1' : '0', cesure: q.get('cesure') ?? '1' });
  if (q.get('instantane')) params.set('instantane', q.get('instantane'));
  const c = await fetch(`/api/composition?${params}`).then((r) => r.json());
  if (c.erreur) throw new Error(c.erreur);

  // Rien ne doit déformer les mesures pendant la mise en page.
  pages.style.transform = '';
  pages.style.marginBottom = '';
  pages.innerHTML = '';
  document.querySelectorAll('style[data-pagedjs-inserted-styles]').forEach((s) => s.remove());
  await Promise.all(['400 12pt Literata', 'italic 400 12pt Literata', '700 12pt Literata', '400 10pt Atkinson', '700 10pt Atkinson'].map((f) => document.fonts.load(f)));

  const gabarit = document.createElement('template');
  gabarit.innerHTML = c.html;
  Greffon.reglages = { travail: marques, date: gabarit.content.firstElementChild.dataset.date };
  Greffon.coupuresCorrigees = 0;
  const t0 = performance.now();
  const flux = await new Previewer({ hyphenGlyph: '-' }).preview(gabarit.content, ['/src/livre.css'], pages);
  const duree = performance.now() - t0;

  const tous = [...document.querySelectorAll('.pagedjs_page')];
  window.__rapport = {
    pages: flux.total,
    pagesHorsPagination: tous.filter((p) => p.dataset.horsPagination === '1').length,
    dureeMiseEnPage: duree,
    version: c.version,
    controles: c.controles,
    numeros: c.numeros,
    ...window.__rapportMiseEnPage,
  };
  derniere = c;
  if (!rendu) afficher();
  window.__etat = 'pret';
}

function afficher() {
  const r = window.__rapport;
  const livrePages = r.pages - r.pagesHorsPagination;
  $('etat').textContent = `${livrePages} pages · mise en page en ${(r.dureeMiseEnPage / 1000).toFixed(1)} s`;
  const liste = (titre, points, classe = '') => (points.length ? `<strong class="${classe}">${titre}</strong><ul>${points.map((p) => `<li>${p}</li>`).join('')}</ul>` : '');
  $('controles').innerHTML =
    liste('À corriger avant le PDF définitif', r.controles.bloquants.map((p) => p.message), 'bloquant') +
    liste('À vérifier, sans blocage', r.controles.avertissements.map((p) => p.message)) +
    liste('À savoir', r.controles.aSavoir.map((p) => p.message)) +
    liste(
      'Ajustements qui n\'ont pas pu être appliqués',
      r.ajustementsNonAppliques.map((a) => (a.genre === 'largeur-image' ? `Image de ${a.scene} : ${a.demande} % demandés, ${a.obtenu} % obtenus (page ${a.folio}).` : `${a.scene} ne commence pas en haut de page (page ${a.folio}).`)),
      'bloquant'
    ) +
    liste('Pages qui débordent', r.debordements.map((d) => `Page ${d.folio}${d.scene ? `, ${d.scene}` : ''}.`), 'bloquant');
  tailler();
}

function tailler() {
  const e = Number($('taille').value);
  pages.style.transform = e === 1 ? '' : `scale(${e})`;
  pages.style.marginBottom = e === 1 ? '' : `${-(1 - e) * pages.offsetHeight}px`;
}

if (!rendu) {
  $('marques').addEventListener('change', composer);
  $('taille').addEventListener('change', tailler);

  // Correction depuis l'aperçu (F11-AC27) : un clic sur un passage ouvre le
  // texte de la scène ; l'enregistrement corrige la scène, puis l'aperçu est recalculé.
  let cible = null;
  pages.addEventListener('click', async (e) => {
    const bloc = e.target.closest?.('[data-bloc]');
    if (!bloc) return;
    cible = { scene: bloc.dataset.scene, bloc: bloc.dataset.bloc };
    const s = await fetch(`/api/source?${new URLSearchParams({ livre, ...cible })}`).then((r) => r.json());
    $('correction-titre').textContent = `${cible.scene} — ${s.genre === 'libelle' ? 'libellé du choix' : 'texte du paragraphe'}`;
    $('correction-texte').value = s.source;
    $('correction').hidden = false;
    $('correction-texte').focus();
  });
  $('correction-annuler').addEventListener('click', () => ($('correction').hidden = true));
  $('correction').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t0 = performance.now();
    const r = await fetch(`/api/correction?livre=${livre}`, { method: 'POST', body: JSON.stringify({ ...cible, source: $('correction-texte').value }) }).then((x) => x.json());
    if (r.erreur) return alert(r.erreur);
    $('correction').hidden = true;
    await composer();
    window.__dureeCorrection = performance.now() - t0;
    $('etat').textContent += ` · correction visible en ${(window.__dureeCorrection / 1000).toFixed(1)} s`;
    document.querySelector(`[data-bloc="${cible.bloc}"]`)?.scrollIntoView({ block: 'center' });
  });

  const exporter = async (genre) => {
    $('etat').textContent = `Production du PDF ${genre === 'travail' ? 'de travail' : 'définitif'}…`;
    const r = await fetch(`/api/export?livre=${livre}&genre=${genre}`, { method: 'POST' }).then((x) => x.json());
    if (r.refuse) $('etat').textContent = `PDF définitif refusé : ${r.bloquants.length} problème(s) à corriger.`;
    else if (r.erreur) $('etat').textContent = `Échec : ${r.erreur}`;
    else $('etat').innerHTML = `PDF ${genre} : ${r.pages - r.pagesHorsPagination} pages, ${(r.tailleOctets / 1048576).toFixed(1)} Mo, ${(r.durees.total / 1000).toFixed(1)} s — état du ${r.date} — <a href="/sorties/${livre}-${genre}.pdf" target="_blank">ouvrir</a>`;
  };
  $('pdf-travail').addEventListener('click', () => exporter('travail'));
  $('pdf-definitif').addEventListener('click', () => exporter('definitif'));
}

window.__composer = composer;
composer().catch((e) => {
  window.__etat = 'erreur';
  window.__erreur = String(e);
  console.error(e);
  if (!rendu) $('etat').textContent = `Erreur : ${e.message}`;
});
