// Composition du livre : un livre (JSON) → un seul HTML, le même pour
// l'aperçu, le PDF de travail et le PDF définitif. Seules différences du
// mode « travail » : la classe portée par la racine et la page récapitulative
// placée avant le livre. Les marques elles-mêmes sont posées après la mise en
// page, hors du flux (voir public/greffon.js). Essai jetable.
import { segments, RENVOI_VIDE } from './texte.mjs';

// Géométrie du livre (F11.3) : A5, marge intérieure plus large. Calculée ici,
// jamais réglée par l'adulte.
export const GEOMETRIE = {
  largeur: 148,
  hauteur: 210,
  haut: 16,
  bas: 20,
  interieur: 20,
  exterieur: 15,
};
export const LARGEUR_TEXTE = GEOMETRIE.largeur - GEOMETRIE.interieur - GEOMETRIE.exterieur; // 113 mm
export const HAUTEUR_TEXTE = GEOMETRIE.hauteur - GEOMETRIE.haut - GEOMETRIE.bas; // 174 mm
export const HAUTEUR_PLEINE_PAGE = 173; // mm, à l'intérieur des marges
export const HAUTEUR_MAX_IMAGE = 160; // mm, image en bloc trop haute : réduite
const LARGEURS = { petite: 40, moyenne: 65, pleine: 100, page: 100 };
export const SEUIL_PPP = 200;

const echapper = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function pourcentDe(largeur) {
  return typeof largeur === 'object' ? largeur.pourcent : LARGEURS[largeur];
}

/** Largeur imprimée (mm) d'une image en bloc, réduction pour hauteur comprise. */
export function largeurImprimee(image) {
  const [w, h] = image.px;
  const demandee = (LARGEUR_TEXTE * pourcentDe(image.largeur)) / 100;
  const hauteurMax = image.largeur === 'page' ? HAUTEUR_PLEINE_PAGE : HAUTEUR_MAX_IMAGE;
  return Math.min(demandee, (hauteurMax * w) / h);
}

/** Numéros imprimés : de 1 à N sur les seules scènes incluses, dans l'ordre imprimé. */
export function numeroter(livre) {
  const incluses = new Set(livre.scenes.filter((s) => s.incluse !== false).map((s) => s.id));
  const numeros = new Map();
  for (const id of livre.ordre) if (incluses.has(id)) numeros.set(id, numeros.size + 1);
  return numeros;
}

/**
 * Contrôles de F09.2 et F10, réduits à ce que l'essai doit montrer dans le
 * PDF de travail. `imageExiste` dit si le fichier d'une image est disponible.
 */
export function controler(livre, { imageExiste = () => true } = {}) {
  const numeros = numeroter(livre);
  const parId = new Map(livre.scenes.map((s) => [s.id, s]));
  const bloquants = [];
  const avertissements = [];
  const aSavoir = [];
  const depart = livre.scenes.find((s) => s.depart);
  if (!depart || !numeros.has(depart.id)) bloquants.push({ code: 'depart', message: 'Le départ du livre est absent ou exclu.' });

  const suites = new Map();
  for (const s of livre.scenes) {
    if (!numeros.has(s.id)) continue;
    const sorties = [];
    let texte = 0;
    for (const b of s.blocs) {
      if (b.type === 'image') {
        if (!imageExiste(b.src)) bloquants.push({ code: 'image-manquante', scene: s.id, bloc: b.id, message: `Image manquante dans ${s.id}.` });
        else {
          const ppp = Math.round(b.px[0] / (largeurImprimee(b) / 25.4));
          if (ppp < SEUIL_PPP) avertissements.push({ code: 'image-peu-definie', scene: s.id, bloc: b.id, ppp, message: `Image peu définie dans ${s.id} : ${ppp} points par pouce.` });
        }
        continue;
      }
      if (!b.children) continue;
      texte += b.children.map((c) => c.text ?? '').join('').trim().length + (b.type === 'choix' ? b.libelle.length : 0);
      for (const c of b.children) {
        if (c.type !== 'renvoi') continue;
        if (!c.cible || !parId.has(c.cible)) bloquants.push({ code: 'destination', scene: s.id, bloc: b.id, message: `Choix sans destination dans ${s.id}.` });
        else if (!numeros.has(c.cible)) bloquants.push({ code: 'destination', scene: s.id, bloc: b.id, message: `Choix de ${s.id} vers ${c.cible}, exclue du livre.` });
        else sorties.push(c.cible);
      }
    }
    const cachees = (s.liaisonsCachees ?? []).map((l) => l.cible).filter((c) => numeros.has(c));
    suites.set(s.id, [...sorties, ...cachees]);
    if (!texte) bloquants.push({ code: 'vide', scene: s.id, message: `Le texte de ${s.id} est vide.` });
    if (!sorties.length && !cachees.length && !s.fin) bloquants.push({ code: 'sans-issue', scene: s.id, message: `${s.id} n'a ni choix ni repère de fin.` });
    if (!sorties.length && cachees.length && !s.fin) avertissements.push({ code: 'sortie-non-assuree', scene: s.id, message: `Sortie non assurée : ${s.id} ne continue que par une énigme.` });
    if (s.numeroFixe && s.numeroFixe !== numeros.get(s.id)) bloquants.push({ code: 'numero-fixe', scene: s.id, message: `Numéro fixé ${s.numeroFixe} impossible pour ${s.id}, placée au ${numeros.get(s.id)}.` });
  }
  if (depart && numeros.has(depart.id)) {
    const vues = new Set([depart.id]);
    const file = [depart.id];
    while (file.length) for (const c of suites.get(file.pop()) ?? []) if (!vues.has(c)) vues.add(c), file.push(c);
    for (const id of numeros.keys()) if (!vues.has(id)) avertissements.push({ code: 'inaccessible', scene: id, message: `${id} est inaccessible depuis le départ.` });
  }
  const actions = livre.scenes.some((s) => numeros.has(s.id) && s.blocs.some((b) => b.type === 'action'));
  if (actions && !livre.presentation?.feuille) aSavoir.push({ code: 'sans-feuille', message: "Le livre contient des actions de jeu sans feuille d'aventure." });
  return { bloquants, avertissements, aSavoir };
}

/**
 * @param {object} livre
 * @param {{marques?: boolean, cesure?: (s: string) => string, date?: string, imageExiste?: (src: string) => boolean, baseImages?: string}} options
 */
export function composerLivre(livre, { marques = false, cesure = (s) => s, date = '', imageExiste = () => true, baseImages = '' } = {}) {
  const numeros = numeroter(livre);
  const controles = controler(livre, { imageExiste });
  const contexte = { formule: livre.reglages.formule, numeroDe: (id) => numeros.get(id) };
  const parId = new Map(livre.scenes.map((s) => [s.id, s]));
  const signaux = new Map(); // bloc ou scène → messages à poser en marge
  for (const p of [...controles.bloquants, ...controles.avertissements]) {
    const cle = p.bloc ?? p.scene;
    if (!cle) continue;
    const court = {
      'image-manquante': 'Image manquante',
      'image-peu-definie': `Image peu définie (${p.ppp} ppp)`,
      destination: 'Destination à définir',
      vide: 'Texte vide',
      'sans-issue': 'Ni choix ni fin',
      'sortie-non-assuree': 'Sortie non assurée',
      'numero-fixe': 'Numéro fixé impossible',
      inaccessible: 'Passage inaccessible',
    }[p.code];
    signaux.set(cle, [...(signaux.get(cle) ?? []), court]);
  }
  const attributSignal = (cle) => (signaux.has(cle) ? ` data-signal="${echapper(signaux.get(cle).join(' · '))}"` : '');

  const enLigne = (bloc) => {
    const segs = segments(bloc, contexte);
    return segs
      .map((s, i) => {
        if (s.genre === 'renvoi') return `<b class="renvoi" data-cible="${s.cible ?? ''}">${s.numero ?? RENVOI_VIDE}</b>`;
        if (s.genre === 'image-ligne') return `<img class="en-ligne" src="${baseImages}${echapper(s.src)}" alt="${echapper(s.alt)}">`;
        let t = s.texte;
        // Le numéro ne se retrouve jamais seul en début de ligne.
        if (segs[i + 1]?.genre === 'renvoi') t = t.replace(/ $/, ' ');
        const h = echapper(cesure(t));
        return s.bold ? `<strong>${h}</strong>` : s.italic ? `<em>${h}</em>` : h;
      })
      .join('');
  };

  const html = [];
  const paragraphe = (t) => `<p class="r">${echapper(cesure(t))}</p>`;

  // --- Page récapitulative du PDF de travail : avant le livre, hors pagination.
  if (marques) {
    const liste = (titre, points) =>
      points.length ? `<h3>${titre}</h3><ul>${points.map((p) => `<li>${echapper(p.message)}${p.scene && numeros.has(p.scene) ? ` <span class="ou">passage ${numeros.get(p.scene)}</span>` : ''}</li>`).join('')}</ul>` : '';
    html.push(
      `<section class="recap"><p class="recap-mention">Version de travail</p><h1>${echapper(livre.titre)}</h1>` +
        `<p class="recap-etat">État du contenu : ${echapper(date)} · ${numeros.size} passages</p>` +
        (controles.bloquants.length + controles.avertissements.length + controles.aSavoir.length === 0 ? '<p>Aucun problème détecté.</p>' : '') +
        liste('À corriger avant le PDF définitif', controles.bloquants) +
        liste('À vérifier, sans blocage', controles.avertissements) +
        liste('À savoir', controles.aSavoir) +
        `</section>`
    );
  }

  // --- Pages de présentation (F11.4). Hypothèse de l'essai, non décidée : elles
  // comptent dans la pagination, sans folio imprimé ; le récit commence en page de droite.
  const pres = livre.presentation ?? {};
  html.push(
    `<section class="page-titre" data-debut-livre><h1>${echapper(livre.titre)}</h1>` +
      (livre.sousTitre ? `<p class="sous-titre">${echapper(livre.sousTitre)}</p>` : '') +
      `<p class="signature">${echapper(livre.signature ?? '')}</p><p class="annee">${echapper(livre.annee ?? '')}</p></section>`
  );
  if (pres.auteurs?.length) html.push(`<section class="page-auteurs"><h2>Les auteurs</h2><p class="prenoms">${pres.auteurs.map(echapper).join(' · ')}</p></section>`);
  if (pres.commentLire)
    html.push(
      `<section class="comment-lire"><h2>Comment lire ce livre</h2>${pres.commentLire.paragraphes.map(paragraphe).join('')}` +
        (pres.commentLire.regles?.length ? `<h3>Règles du jeu</h3>${pres.commentLire.regles.map(paragraphe).join('')}` : '') +
        `</section>`
    );
  if (pres.feuille) {
    const section = (s) => {
      if (s.type === 'compteurs')
        return `<div class="f-section f-compteurs"><h3>${echapper(s.titre)}</h3>${s.compteurs
          .map((c) => `<div class="f-compteur"><span class="f-nom">${echapper(c.nom)}</span><span class="f-depart">départ : ${c.depart}</span><span class="f-cases">${'<i></i>'.repeat(10)}</span></div>`)
          .join('')}</div>`;
      if (s.type === 'liste') return `<div class="f-section f-liste"><h3>${echapper(s.titre)}</h3>${'<div class="f-ligne"></div>'.repeat(s.lignes)}</div>`;
      return `<div class="f-section f-notes"><h3>${echapper(s.titre)}</h3><div class="f-cadre"></div></div>`;
    };
    html.push(`<section class="feuille"><h2>Feuille d'aventure</h2>${pres.feuille.sections.map(section).join('')}</section>`);
  }

  // --- Récit : blocs à plat, dans l'ordre imprimé.
  html.push('<section class="recit">');
  const ouvertures = new Map(livre.parties.map((p) => [p.ouverture, p]));
  for (const id of livre.ordre) {
    if (!numeros.has(id)) continue;
    const s = parId.get(id);
    const n = numeros.get(id);
    const commun = `data-scene="${id}" data-numero="${n}"`;
    const partie = ouvertures.get(id);
    // Une partie entièrement exclue n'imprime pas son titre : ici le titre suit sa scène d'ouverture.
    if (partie && livre.reglages.titresDePartie) html.push(`<h1 class="partie" ${commun}>${echapper(partie.titre)}</h1>`);
    const classes = ['numero', s.nouvellePage ? 'nouvelle-page' : ''].filter(Boolean).join(' ');
    html.push(`<h2 class="${classes}" ${commun} data-ref-scene="${id}"${attributSignal(id)}><span class="n">${n}</span></h2>`);

    let apresTitre = true;
    let finPosee = false;
    const poserFin = () => {
      if (s.fin && !finPosee) html.push(`<p class="fin" ${commun}>${echapper(livre.reglages.marqueFin)}</p>`);
      finPosee = true;
    };
    for (let i = 0; i < s.blocs.length; i++) {
      const b = s.blocs[i];
      const attrs = `${commun} data-bloc="${b.id}"${attributSignal(b.id)}`;
      if (b.type === 'p') {
        html.push(`<p class="r${apresTitre ? ' premier' : ''}" ${attrs}>${enLigne(b)}</p>`);
        apresTitre = false;
      } else if (b.type === 'action') {
        html.push(`<p class="action" ${attrs}>${enLigne(b)}</p>`);
        apresTitre = true;
      } else if (b.type === 'image') {
        const pct = pourcentDe(b.largeur);
        const [w, h] = b.px;
        const classe = `image${b.largeur === 'page' ? ' page' : ''}`;
        const contenu = imageExiste(b.src)
          ? `<img src="${baseImages}${echapper(b.src)}" width="${w}" height="${h}" alt="${echapper(b.alt ?? '')}">`
          : `<div class="image-manquante" style="aspect-ratio:${w}/${h}">Image manquante</div>`;
        html.push(`<figure class="${classe}" ${attrs} data-pourcent="${pct}" style="--l:${pct}%">${contenu}</figure>`);
        apresTitre = true;
      } else if (b.type === 'choix') {
        // Marque de fin avant les choix d'une fin (F11-AC34). Les phrases de
        // choix qui se suivent forment un groupe, jamais coupé.
        poserFin();
        const groupe = [];
        let j = i;
        for (; j < s.blocs.length && s.blocs[j].type === 'choix'; j++) {
          const c = s.blocs[j];
          groupe.push(`<p class="choix" ${commun} data-bloc="${c.id}"${attributSignal(c.id)}>${enLigne(c)}</p>`);
        }
        i = j - 1;
        html.push(`<div class="choix-groupe" ${commun}>${groupe.join('')}</div>`);
        apresTitre = true;
      }
    }
    poserFin();
  }
  html.push('</section>');
  if (pres.fin) html.push(`<section class="page-fin">${pres.fin.paragraphes.map(paragraphe).join('')}</section>`);

  return {
    html: `<div class="livre${marques ? ' travail' : ''}" lang="fr" data-date="${echapper(date)}">${html.join('\n')}</div>`,
    controles,
    numeros: Object.fromEntries(numeros),
  };
}
