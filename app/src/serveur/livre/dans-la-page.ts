/**
 * Ce que la page du serveur exécute dans Chromium : Paged.js calcule les pages, puis la page
 * pose ce qui n'appartient pas au fil du texte — en-tête courant, numéro de page, marques du
 * PDF de travail — et rend compte de ce que la composition a fait.
 *
 * Écrit comme un texte, et non comme une fonction de ce module : Chromium l'exécute tel quel,
 * sans les transformations que la compilation pourrait ajouter à une fonction.
 */

export type OptionsDeLaPage = {
  travail: boolean;
  etatDu: string;
  aChoix: boolean;
  titre: string;
  marges: { haut: number; bas: number; exterieur: number; interieur: number };
  basDePage: "rien" | "numero" | "des";
};

/** Un bloc à sa place sur une page, en millimètres depuis le coin de la page (la carte des blocs). */
export type BlocPlace = { page: number; scene: string; bloc: string | null; x: number; y: number; l: number; h: number };

export type RapportDeLaPage = {
  /** Pages du livre, page récapitulative et sa blanche non comprises */
  pages: number;
  /** Pages avant le livre : la page récapitulative du PDF de travail */
  horsPagination: number;
  /** La page où commence chaque passage */
  pageDe: Record<string, number>;
  carte: BlocPlace[];
  /** Ce qui dépasse de la zone de texte : un mot insécable trop long (F11-AC57) */
  debordements: { page: number; scene: string | null }[];
  /** Images qui n'ont pas pu être lues pendant la composition */
  introuvables: string[];
  /** Pour comparer deux compositions page à page : début, fin et nombre de lignes de chaque page */
  signature: string[];
  coupuresCorrigees: number;
  dureeMiseEnPage: number;
};

export const SCRIPT_DE_LA_PAGE = String.raw`async (o) => {
  const MM = 96 / 25.4;
  const { Previewer, Handler, registerHandlers } = window.Paged;
  let coupuresCorrigees = 0;

  // Défaut de Paged.js 0.4.3 relevé par le prototype : quand une page se termine au milieu d'un
  // mot coupé par la césure, la suite reprend une lettre trop loin, et une ligne peut se perdre.
  // Le premier caractère reporté porte aussi le rectangle du trait d'union de la ligne d'avant,
  // ce qui trompe Paged.js. On recule le début du report jusqu'au premier caractère qui est
  // vraiment hors de la page.
  class Greffe extends Handler {
    onBreakToken(breakToken, overflow, rendered, layout) {
      if (!breakToken || !overflow || !overflow.startContainer || overflow.startContainer.nodeType !== 3) return;
      const noeud = overflow.startContainer;
      const bord = layout.bounds.right;
      const plage = document.createRange();
      let debut = overflow.startOffset;
      while (debut > 0) {
        plage.setStart(noeud, debut - 1);
        plage.setEnd(noeud, debut);
        const rects = [...plage.getClientRects()].filter((r) => r.width > 0);
        const dernier = rects[rects.length - 1];
        if (!dernier || dernier.left < bord) break;
        debut -= 1;
      }
      const recul = overflow.startOffset - debut;
      if (!recul) return;
      overflow.setStart(noeud, debut);
      breakToken.offset -= recul;
      coupuresCorrigees += 1;
    }
  }
  registerHandlers(Greffe);

  await document.fonts.ready;
  const t0 = performance.now();
  await new Previewer({ hyphenGlyph: "-" }).preview(document.querySelector("#contenu").content, ["/livre.css"], document.querySelector("#livre"));
  const dureeMiseEnPage = performance.now() - t0;
  await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((ok) => { img.onload = ok; img.onerror = ok; }))));

  const pages = [...document.querySelectorAll(".pagedjs_page")];
  const premiere = pages.findIndex((p) => p.querySelector(".recit"));
  const horsPagination = Math.max(0, premiere);
  const numeroDe = {};
  for (const h of document.querySelectorAll("h2.numero[data-scene]")) numeroDe[h.dataset.scene] = Number(h.dataset.numero);
  const enMm = (v) => Math.round((v / MM) * 10) / 10;
  const rapport = {
    pages: pages.length - horsPagination, horsPagination, pageDe: {}, carte: [], debordements: [], introuvables: [], signature: [],
    coupuresCorrigees, dureeMiseEnPage,
  };
  const pageDeElement = new Map();
  const m = o.marges;
  let chapitreCourant = null;

  pages.forEach((page, i) => {
    const feuille = page.querySelector(".pagedjs_sheet");
    const contenu = page.querySelector(".pagedjs_page_content");
    if (i < horsPagination) return;
    const n = i - horsPagination + 1;
    page.dataset.folio = String(n);
    const f = feuille.getBoundingClientRect();
    const droite = page.classList.contains("pagedjs_right_page");
    const blanche = page.classList.contains("pagedjs_blank_page") || !contenu.textContent.trim() && !contenu.querySelector("img, figure");
    const exterieur = droite ? "right" : "left";
    const poser = (classe, texte, style) => {
      const el = document.createElement("div");
      el.className = classe;
      el.textContent = texte;
      Object.assign(el.style, style);
      feuille.appendChild(el);
      return el;
    };

    for (const d of contenu.querySelectorAll("[data-reference]:not([data-split-from])")) {
      pageDeElement.set(d, n);
      if (!(d.dataset.scene in rapport.pageDe)) rapport.pageDe[d.dataset.scene] = n;
    }
    const scenes = [...new Set([...contenu.querySelectorAll("section.passage[data-scene]")].filter((s) => s.textContent.trim() || s.querySelector("img, figure")).map((s) => s.dataset.scene))];
    const chapitresIci = [...contenu.querySelectorAll("h2.chapitre[data-chapitre]")];
    const chapitreEnHaut = chapitreCourant;
    if (chapitresIci.length) chapitreCourant = chapitresIci[chapitresIci.length - 1].dataset.chapitre;

    // L'en-tête courant : les numéros des passages de la page (F11.5), ou en récit classique le
    // titre du livre à gauche et celui du chapitre à droite ; aucun sur une page qui ouvre une
    // partie ou un chapitre (F11-AC104)
    const ouvre = contenu.querySelector("h1.partie, h2.chapitre");
    if (!blanche && !ouvre) {
      let texte = null;
      if (o.aChoix) {
        const numeros = scenes.map((s) => numeroDe[s]).filter((x) => x);
        if (numeros.length) {
          const a = Math.min(...numeros);
          const b = Math.max(...numeros);
          texte = a === b ? String(a) : a + " – " + b;
        }
      } else {
        texte = droite ? chapitreEnHaut : o.titre;
      }
      if (texte) {
        const style = { top: Math.max(5, m.haut - 8.5) + "mm" };
        if (o.aChoix) style[exterieur] = m.exterieur + "mm";
        else Object.assign(style, { left: (droite ? m.interieur : m.exterieur) + "mm", right: (droite ? m.exterieur : m.interieur) + "mm", textAlign: "center" });
        poser("entete", texte, style);
      }
    }

    // Le numéro de page, côté extérieur (F11.4) ; le PDF de travail l'imprime toujours
    const folio = !blanche && o.basDePage === "numero";
    const bas = Math.max(5, m.bas / 2 - 2) + "mm";
    if (folio) poser("folio", String(n), { bottom: bas, [exterieur]: m.exterieur + "mm" });
    if (o.travail) {
      poser("marque mention", "Version de travail · " + o.etatDu, { top: Math.max(4, m.haut - 9) + "mm", [droite ? "left" : "right"]: m.interieur + "mm" });
      if (!folio) poser("marque page", "p. " + n, { bottom: bas, [exterieur]: m.exterieur + "mm" });
    }

    // La carte des blocs : où se trouve chaque bloc, pour retrouver la scène sous un clic
    for (const el of contenu.querySelectorAll("[data-bloc], h2.numero, .debut-scene")) {
      const r = el.getBoundingClientRect();
      if (!r.height && !r.width) continue;
      const passage = el.closest("section.passage");
      rapport.carte.push({ page: n, scene: passage ? passage.dataset.scene : null, bloc: el.dataset.bloc || null, x: enMm(r.left - f.left), y: enMm(r.top - f.top), l: enMm(r.width), h: enMm(r.height) });
    }

    // Ce qui dépasse de la zone de texte (F11-AC57)
    for (const p of contenu.querySelectorAll("p, figcaption, h1, h2")) {
      if (p.scrollWidth > p.clientWidth + 1) {
        const passage = p.closest("section.passage");
        rapport.debordements.push({ page: n, scene: passage ? passage.dataset.scene : null });
      }
    }

    // Une signature de la page, pour comparer deux compositions
    let lignes = 0;
    const plage = document.createRange();
    for (const el of contenu.querySelectorAll("p, h1, h2, figcaption")) {
      plage.selectNodeContents(el);
      lignes += new Set([...plage.getClientRects()].filter((r) => r.width > 0.5).map((r) => Math.round(r.top))).size;
    }
    const texte = contenu.textContent.replace(/[\s­]+/g, " ").trim();
    rapport.signature.push(n + ":" + lignes + ":" + texte.slice(0, 24) + "…" + texte.slice(-24));
  });

  for (const img of document.querySelectorAll("img")) {
    if (img.naturalWidth === 0) {
      const id = (img.getAttribute("src") || "").split("/").pop();
      if (id && !rapport.introuvables.includes(id)) rapport.introuvables.push(id);
    }
  }

  // Les marques du PDF de travail (F11.2) : la référence stable à côté du numéro, les énigmes
  // et le numéro fixé, puis chaque point des contrôles à sa place, en marge extérieure. Elles
  // sont posées sur la page, au-dessus du texte : elles ne déplacent rien.
  if (o.travail) {
    const occupe = new Map();
    const placer = (page, x, y, classe, texte) => {
      const feuille = page.querySelector(".pagedjs_sheet");
      const cle = page.dataset.folio + ":" + Math.round(x);
      let haut = y;
      for (const b of occupe.get(cle) || []) if (haut < b + 0.4 * MM) haut = b + 0.4 * MM;
      const el = document.createElement("div");
      el.className = classe;
      el.textContent = texte;
      el.style.left = x + "px";
      el.style.top = haut + "px";
      feuille.appendChild(el);
      occupe.set(cle, [...(occupe.get(cle) || []), haut + el.getBoundingClientRect().height]);
    };
    const marge = (page, r) => {
      const c = page.querySelector(".pagedjs_page_content").getBoundingClientRect();
      const f = page.querySelector(".pagedjs_sheet").getBoundingClientRect();
      return page.classList.contains("pagedjs_right_page") ? c.right - f.left + 1.4 * MM : c.left - f.left - 13.9 * MM;
    };
    for (const d of document.querySelectorAll("[data-reference]:not([data-split-from])")) {
      const page = d.closest(".pagedjs_page");
      if (!page || !page.dataset.folio) continue;
      const f = page.querySelector(".pagedjs_sheet").getBoundingClientRect();
      const c = page.querySelector(".pagedjs_page_content").getBoundingClientRect();
      const r = d.getBoundingClientRect();
      const lignes = [d.dataset.reference];
      if (d.dataset.fixe) lignes.push("n° fixé");
      if (d.dataset.enigmes) lignes.push("énigme → " + d.dataset.enigmes.split(",").join(", "));
      const x = o.aChoix ? c.left - f.left : marge(page, r);
      for (const l of lignes) placer(page, x, r.top - f.top + (o.aChoix ? 1 : 0), "marque ref", l);
    }
    for (const section of document.querySelectorAll("section.passage[data-marques]:not([data-split-from])")) {
      for (const mq of JSON.parse(section.dataset.marques)) {
        const ancre = (mq.bloc && document.querySelector('[data-bloc="' + mq.bloc + '"]:not([data-split-from])')) || document.querySelector('[data-reference][data-scene="' + section.dataset.scene + '"]:not([data-split-from])');
        const page = ancre && ancre.closest(".pagedjs_page");
        if (!page || !page.dataset.folio) continue;
        const f = page.querySelector(".pagedjs_sheet").getBoundingClientRect();
        const r = ancre.getBoundingClientRect();
        placer(page, marge(page, r), r.top - f.top, "marque signal signal--" + mq.gravite, mq.texte);
      }
    }
    // La page récapitulative dit où se trouve chaque point
    for (const li of document.querySelectorAll("[data-recap-scene]")) {
      const p = rapport.pageDe[li.dataset.recapScene];
      const ou = li.querySelector(".recap__page");
      if (p && ou) ou.textContent = "p. " + p;
    }
  }
  return rapport;
}`;
