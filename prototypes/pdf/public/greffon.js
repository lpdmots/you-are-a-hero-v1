// Greffon Paged.js de l'essai : en-tête courant et folio de chaque page,
// marques du PDF de travail posées après la mise en page, et rapport sur ce
// que la composition a réellement fait (ajustements, débordements).
import { Handler } from '/pagedjs/paged.esm.js';

const MM = 96 / 25.4;

export class Greffon extends Handler {
  /** Réglé par la page avant chaque mise en page. */
  static reglages = { travail: false, date: '' };
  static coupuresCorrigees = 0;

  constructor(chunker, polisher, caller) {
    super(chunker, polisher, caller);
    this.debut = null; // numéro de la première page du livre (après la page récapitulative)
  }

  /**
   * Contournement d'un défaut de Paged.js 0.4.3 : quand la première ligne
   * reportée commence au milieu d'un mot coupé par une césure, la coupure est
   * placée une lettre trop loin (« brusq- / uement »). La première lettre de la
   * ligne porte aussi le rectangle du trait d'union de la ligne précédente, ce
   * qui trompe sa détection. On ramène la coupure au vrai début de ligne.
   */
  onBreakToken(breakToken, overflow, rendered, layout) {
    if (!breakToken || !overflow || overflow.startContainer.nodeType !== 3) return;
    const noeud = overflow.startContainer;
    const limite = layout.bounds.right;
    const plage = document.createRange();
    let o = overflow.startOffset;
    while (o > 0) {
      plage.setStart(noeud, o - 1);
      plage.setEnd(noeud, o);
      const r = [...plage.getClientRects()].filter((x) => x.width > 0).pop();
      if (!r || r.left < limite) break;
      o -= 1;
    }
    const recul = overflow.startOffset - o;
    if (!recul) return;
    overflow.setStart(noeud, o);
    breakToken.offset -= recul;
    Greffon.coupuresCorrigees += 1;
  }

  afterPageLayout(pageElement) {
    const n = Number(pageElement.dataset.pageNumber);
    if (this.debut === null && pageElement.querySelector('[data-debut-livre]')) this.debut = n;
    if (this.debut === null) {
      pageElement.dataset.horsPagination = '1'; // page récapitulative et page blanche qui la suit
      return;
    }
    const folio = n - this.debut + 1;
    pageElement.dataset.folio = String(folio);
    const passages = [...pageElement.querySelectorAll('.pagedjs_page_content [data-numero]')].map((e) => Number(e.dataset.numero));
    if (!passages.length) return; // pages de présentation : ni en-tête ni folio imprimé
    const premier = passages[0];
    const dernier = passages[passages.length - 1];
    pageElement.style.setProperty('--entete', `"${premier === dernier ? premier : `${premier} – ${dernier}`}"`);
    pageElement.style.setProperty('--folio', `"${folio}"`);
  }

  afterRendered(pages) {
    const travail = Greffon.reglages.travail;
    const ajustementsNonAppliques = [];
    const debordements = [];
    // Carte des blocs : où se trouve chaque bloc de scène, page par page, en
    // millimètres. Elle permettrait à un aperçu calculé côté serveur de
    // retrouver la scène sous un clic, sans refaire la mise en page à l'écran.
    const carte = [];
    for (const { element } of pages) {
      const feuille = element.querySelector('.pagedjs_sheet');
      const contenu = element.querySelector('.pagedjs_page_content');
      const f = feuille.getBoundingClientRect();
      const c = contenu.getBoundingClientRect();
      const folio = Number(element.dataset.folio ?? 0);
      const droite = element.classList.contains('pagedjs_right_page');
      if (folio) {
        for (const el of contenu.querySelectorAll('[data-bloc]')) {
          const r = el.getBoundingClientRect();
          const arrondi = (v) => Math.round((v / MM) * 10) / 10;
          carte.push({ folio, scene: el.dataset.scene, bloc: el.dataset.bloc, x: arrondi(r.left - f.left), y: arrondi(r.top - f.top), l: arrondi(r.width), h: arrondi(r.height) });
        }
      }

      // Ce qui dépasse de la zone de texte : un bloc insécable plus haut que la page, par exemple.
      const dernierBloc = contenu.querySelector(':scope > div')?.lastElementChild;
      if (dernierBloc && dernierBloc.getBoundingClientRect().bottom > c.bottom + 1.5) debordements.push({ folio, scene: dernierBloc.dataset.scene ?? null });

      // Ajustements de composition (F11.3) : vérifier qu'ils ont bien été appliqués.
      for (const titre of contenu.querySelectorAll('h2.numero.nouvelle-page')) {
        const precedent = titre.previousElementSibling;
        const enTete = !precedent || precedent.matches('h1.partie');
        if (!enTete) ajustementsNonAppliques.push({ genre: 'nouvelle-page', scene: titre.dataset.scene, folio });
      }
      for (const figure of contenu.querySelectorAll('figure.image:not(.page)')) {
        const img = figure.querySelector('img');
        if (!img) continue;
        const boite = img.getBoundingClientRect();
        const obtenue = Math.min(boite.width, (boite.height * img.naturalWidth) / img.naturalHeight || boite.width);
        const demande = Number(figure.dataset.pourcent);
        const obtenu = Math.round((obtenue / c.width) * 100);
        if (obtenu < demande - 1) ajustementsNonAppliques.push({ genre: 'largeur-image', scene: figure.dataset.scene, bloc: figure.dataset.bloc, demande, obtenu, folio });
      }

      if (!travail || !folio) continue;
      const mention = document.createElement('div');
      mention.className = 'marque mention';
      mention.textContent = `Version de travail · ${Greffon.reglages.date}`;
      feuille.appendChild(mention);
      // Référence stable à côté de chaque numéro de passage.
      for (const titre of contenu.querySelectorAll('h2.numero[data-ref-scene]')) {
        const n = titre.querySelector('.n').getBoundingClientRect();
        const m = document.createElement('span');
        m.className = 'marque ref';
        m.textContent = titre.dataset.refScene;
        m.style.left = `${n.right - f.left + 2 * MM}px`;
        m.style.top = `${n.top - f.top + 0.45 * (n.height)}px`;
        feuille.appendChild(m);
      }
      // Signalements à leur place, en marge extérieure.
      for (const el of contenu.querySelectorAll('[data-signal]:not([data-split-from])')) {
        const r = el.getBoundingClientRect();
        const m = document.createElement('div');
        m.className = 'marque signal';
        m.textContent = el.dataset.signal;
        m.style.left = droite ? `${c.right - f.left + 1.5 * MM}px` : `${c.left - f.left - 13.5 * MM}px`;
        m.style.top = `${r.top - f.top + 1}px`;
        feuille.appendChild(m);
      }
    }
    window.__rapportMiseEnPage = { carte, ajustementsNonAppliques, debordements, coupuresCorrigees: Greffon.coupuresCorrigees };
  }
}

/**
 * Lignes de texte de chaque page, telles que le navigateur les a coupées.
 * Sert à comparer l'aperçu et le PDF page par page et ligne par ligne.
 */
export function lignesParPage() {
  const plage = document.createRange();
  return [...document.querySelectorAll('.pagedjs_page')].map((page) => {
    const contenu = page.querySelector('.pagedjs_page_content');
    const lignes = [];
    let courante = null;
    const marcheur = document.createTreeWalker(contenu, NodeFilter.SHOW_TEXT);
    for (let noeud = marcheur.nextNode(); noeud; noeud = marcheur.nextNode()) {
      const texte = noeud.data;
      if (!texte.trim()) continue;
      for (let i = 0; i < texte.length; i++) {
        if (texte[i] === ' ' || texte[i] === '\n' || texte[i] === '­') continue;
        plage.setStart(noeud, i);
        plage.setEnd(noeud, i + 1);
        // Après une césure, le premier caractère de la ligne porte aussi le
        // rectangle du trait d'union de la ligne précédente : on retient le dernier.
        const r = [...plage.getClientRects()].filter((x) => x.width > 0).pop();
        if (!r) continue;
        if (!courante || Math.abs(r.top - courante.haut) > 5) {
          courante = { haut: r.top, texte: '' };
          lignes.push(courante);
        }
        courante.texte += texte[i];
      }
    }
    const hautPage = contenu.getBoundingClientRect().top;
    return {
      folio: Number(page.dataset.folio ?? 0),
      horsPagination: page.dataset.horsPagination === '1',
      blanche: page.classList.contains('pagedjs_blank_page'),
      lignes: lignes.map((l) => l.texte),
      hauts: lignes.map((l) => Math.round((l.haut - hautPage) * 100) / 100),
    };
  });
}
