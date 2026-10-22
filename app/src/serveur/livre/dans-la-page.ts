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
  /** Les faces imprimées sur les pages de droite du récit, dans l'ordre (F11.4) ; rien sans dés */
  des: number[][] | null;
  /** Pour les essais : sans le contournement du défaut de Paged.js */
  sansGreffe?: boolean;
};

/** Un bloc à sa place sur une page, en millimètres depuis le coin de la page (la carte des blocs). */
export type BlocPlace = {
  page: number;
  scene: string;
  bloc: string | null;
  /** Un renvoi, à suivre d'un clic : la scène où il mène (F11-AC83) */
  cible?: string;
  x: number;
  y: number;
  l: number;
  h: number;
};

export type RapportDeLaPage = {
  /** Pages du livre, page récapitulative et sa blanche non comprises */
  pages: number;
  /** Pages avant le livre : la page récapitulative du PDF de travail */
  horsPagination: number;
  /** La page où commence chaque passage */
  pageDe: Record<string, number>;
  /** La première page du récit, après les pages de présentation */
  premierePageDuRecit: number;
  carte: BlocPlace[];
  /** Ce qui dépasse de la zone de texte : un mot insécable trop long (F11-AC57) */
  debordements: { page: number; scene: string | null }[];
  /** Images qui n'ont pas pu être lues pendant la composition */
  introuvables: string[];
  /** Pour comparer deux compositions page à page : début, fin et nombre de lignes de chaque page */
  signature: string[];
  coupuresCorrigees: number;
  dureeMiseEnPage: number;
  /** Les dés imprimés, page par page (F11.4) */
  des: { page: number; faces: number[] }[];
  /** Les pages de présentation : leur nom et leur page */
  presentation: { nom: string; page: number }[];
  /** Le nombre de lignes à écrire de chaque liste de la feuille d'aventure (F04-AC42) */
  lignesDeListes: number[];
  /** La hauteur de l'illustration de la page de titre, en millimètres, et la hauteur utile de la page */
  illustration: { mm: number; page: number } | null;
  /**
   * Les pages du récit dont plus d'un quart de la hauteur utile reste blanc (F11.3, F11-AC44) :
   * le blanc, en millimètres sur la feuille. Ni la dernière page du récit, ni une page suivie
   * d'une nouvelle partie, d'un nouveau chapitre ou d'une nouvelle page demandée (F11.5).
   */
  peuRemplies: { page: number; mm: number; x: number; y: number; l: number; h: number; apres: string | null; dedans: boolean }[];
  /**
   * Ce que mesure chaque passage, pour l'ordre des passages (F11.5) : sa hauteur entière,
   * l'espace au-dessus de son numéro compris, celle de son groupe de choix, qui ne se coupe pas,
   * et s'il porte une image pleine page. En millimètres.
   */
  mesures: Record<string, { h: number; choix: number; pleinePage: boolean }>;
  /** La hauteur utile d'une page du récit, en millimètres */
  hauteurUtile: number;
  /** Tout le blanc laissé au bas des pages du récit, compté comme les pages peu remplies, sans seuil */
  blancTotal: number;
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
  // Ni veuve ni orpheline (F11.3) : Chromium ne tient pas toujours la règle quand Paged.js remplit
  // une page. Avant chaque coupure, on la vérifie sur le paragraphe coupé : s'il laisse moins de
  // deux lignes d'un côté, la coupure recule d'une ligne, ou le paragraphe entier passe à la page
  // suivante, avec le numéro ou le titre qui le précède.
  const DEBUT_DE_PASSAGE = "h2.numero, h1.partie, h2.chapitre, .separateur, .debut-scene";
  const lignesDe = (el, bord) => {
    const plage = document.createRange();
    plage.selectNodeContents(el);
    const avant = new Set();
    const apres = new Set();
    for (const r of plage.getClientRects()) {
      if (r.width < 0.5) continue;
      if (r.left < bord - 1) avant.add(Math.round(r.top));
      else apres.add(Math.round(r.left) + ":" + Math.round(r.top));
    }
    return { avant: [...avant].sort((x, y) => x - y), apres: apres.size };
  };
  // Le premier caractère du paragraphe posé sur la ligne de cette hauteur
  const debutDeLigne = (el, haut) => {
    const marcheur = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const plage = document.createRange();
    for (let n = marcheur.nextNode(); n; n = marcheur.nextNode()) {
      for (let i = 0; i < n.data.length; i += 1) {
        plage.setStart(n, i);
        plage.setEnd(n, i + 1);
        const r = [...plage.getClientRects()].filter((x) => x.width > 0).pop();
        if (r && Math.round(r.top) >= haut) return { noeud: n, offset: i };
      }
    }
    return null;
  };
  class Greffe extends Handler {
    onOverflow(overflow, rendered, bounds) {
      if (!overflow || !overflow.startContainer) return;
      const depart = overflow.startContainer.nodeType === 3 ? overflow.startContainer.parentElement : overflow.startContainer.childNodes[overflow.startOffset] || overflow.startContainer;
      const p = depart && depart.closest ? depart.closest("p.r") : null;
      if (!p || !rendered.contains(p)) return;
      const { avant, apres } = lignesDe(p, bounds.right);
      if (avant.length === 0 || (avant.length >= 2 && apres >= 2)) return;
      const nouvelle = document.createRange();
      nouvelle.setEnd(overflow.endContainer, overflow.endOffset);
      if (avant.length >= 3 && apres === 1) {
        // Une veuve : la dernière ligne de la page part avec elle
        const ici = debutDeLigne(p, avant[avant.length - 1]);
        if (!ici) return;
        nouvelle.setStart(ici.noeud, ici.offset);
        return nouvelle;
      }
      // Une orpheline, ou un paragraphe trop court pour être coupé : il passe entier à la page suivante
      let cible = p;
      while (cible.previousElementSibling && cible.previousElementSibling.matches(DEBUT_DE_PASSAGE)) cible = cible.previousElementSibling;
      // Rien ne le précède sur la page : la coupure reste où elle est, plutôt qu'une page vide
      const avantLui = document.createRange();
      avantLui.setStart(rendered, 0);
      avantLui.setEndBefore(cible);
      if (!avantLui.toString().trim() && !avantLui.cloneContents().querySelector("img, figure")) return;
      nouvelle.setStartBefore(cible);
      return nouvelle;
    }

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
  if (!o.sansGreffe) registerHandlers(Greffe);

  await document.fonts.ready;
  const t0 = performance.now();
  await new Previewer({ hyphenGlyph: "-" }).preview(document.querySelector("#contenu").content, ["/livre.css"], document.querySelector("#livre"));
  const dureeMiseEnPage = performance.now() - t0;
  await Promise.all([...document.images].map((img) => (img.complete ? null : new Promise((ok) => { img.onload = ok; img.onerror = ok; }))));

  const pages = [...document.querySelectorAll(".pagedjs_page")];
  const premiere = pages.findIndex((p) => p.querySelector("[data-debut-livre]"));
  const horsPagination = Math.max(0, premiere);
  const numeroDe = {};
  for (const h of document.querySelectorAll("h2.numero[data-scene]")) numeroDe[h.dataset.scene] = Number(h.dataset.numero);
  const enMm = (v) => Math.round((v / MM) * 10) / 10;
  const rapport = {
    pages: pages.length - horsPagination, horsPagination, pageDe: {}, premierePageDuRecit: 0, carte: [], debordements: [], introuvables: [], signature: [],
    coupuresCorrigees, dureeMiseEnPage, des: [], presentation: [], lignesDeListes: [], illustration: null, peuRemplies: [], mesures: {}, hauteurUtile: 0, blancTotal: 0,
  };
  // Le blanc au bas de chaque page du récit, pour repérer les pages peu remplies
  const blancs = [];
  const pageDeElement = new Map();
  const m = o.marges;
  let chapitreCourant = null;
  let pagesDeDroite = 0;

  pages.forEach((page, i) => {
    const feuille = page.querySelector(".pagedjs_sheet");
    const contenu = page.querySelector(".pagedjs_page_content");
    if (i < horsPagination) return;
    const n = i - horsPagination + 1;
    page.dataset.folio = String(n);
    const f = feuille.getBoundingClientRect();
    const droite = page.classList.contains("pagedjs_right_page");
    const blanche = page.classList.contains("pagedjs_blank_page") || !contenu.textContent.trim() && !contenu.querySelector("img, figure");
    // Les pages de présentation n'ont ni en-tête, ni numéro, ni dés (F11.4)
    const presentation = Boolean(contenu.querySelector(".pres"));
    if (!presentation && !rapport.premierePageDuRecit && contenu.querySelector(".recit [data-reference]")) rapport.premierePageDuRecit = n;
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
    if (!blanche && !ouvre && !presentation) {
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
    const folio = !blanche && !presentation && o.basDePage === "numero";
    const bas = Math.max(5, m.bas / 2 - 2) + "mm";
    if (folio) poser("folio", String(n), { bottom: bas, [exterieur]: m.exterieur + "mm" });
    // Les dés, sur chaque page de droite du récit : ouvrir le livre au hasard tient lieu de lancer
    if (o.des && droite && !blanche && !presentation) {
      const faces = o.des[pagesDeDroite % o.des.length];
      pagesDeDroite += 1;
      const des = document.createElement("div");
      des.className = "des-imprimes";
      des.setAttribute("aria-label", "Dés : " + faces.join(" et "));
      des.style.bottom = Math.max(4, m.bas / 2 - 4.5) + "mm";
      des.style.right = m.exterieur + "mm";
      const POINTS = { 1: [[12, 12]], 2: [[7, 7], [17, 17]], 3: [[7, 7], [12, 12], [17, 17]], 4: [[7, 7], [17, 7], [7, 17], [17, 17]], 5: [[7, 7], [17, 7], [12, 12], [7, 17], [17, 17]], 6: [[7, 7], [17, 7], [7, 12], [17, 12], [7, 17], [17, 17]] };
      des.innerHTML = faces.map((f) => '<svg viewBox="0 0 24 24"><rect x="1.5" y="1.5" width="21" height="21" rx="4.5"/>' + POINTS[f].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="2.1"/>').join("") + "</svg>").join("");
      feuille.appendChild(des);
      rapport.des.push({ page: n, faces });
    }
    for (const pres of contenu.querySelectorAll(".pres[data-page]:not([data-split-from])")) rapport.presentation.push({ nom: pres.dataset.page, page: n });
    for (const lignes of contenu.querySelectorAll(".feuille__lignes")) {
      const bas = lignes.getBoundingClientRect().bottom + 0.5;
      rapport.lignesDeListes.push([...lignes.children].filter((l) => l.getBoundingClientRect().bottom <= bas).length);
    }
    const illustration = contenu.querySelector(".pres__illustration img");
    if (illustration) rapport.illustration = { mm: enMm(illustration.getBoundingClientRect().height), page: enMm(contenu.getBoundingClientRect().height) };
    if (o.travail) {
      poser("marque mention", "Version de travail · " + o.etatDu, { top: Math.max(4, m.haut - 9) + "mm", [droite ? "left" : "right"]: m.interieur + "mm" });
      // Les dés ou le numéro de page, jamais les deux : avec les dés, aucune page ne porte de numéro
      if (!folio && !o.des) poser("marque page", "p. " + n, { bottom: bas, [exterieur]: m.exterieur + "mm" });
    }

    // La carte des blocs : où se trouve chaque bloc, pour retrouver la scène sous un clic
    for (const el of contenu.querySelectorAll("[data-bloc], h2.numero, .debut-scene, b.renvoi[data-cible]")) {
      const r = el.getBoundingClientRect();
      if (!r.height && !r.width) continue;
      const passage = el.closest("section.passage");
      const place = { page: n, scene: passage ? passage.dataset.scene : null, bloc: el.dataset.bloc || null, x: enMm(r.left - f.left), y: enMm(r.top - f.top), l: enMm(r.width), h: enMm(r.height) };
      if (el.dataset.cible) place.cible = el.dataset.cible;
      rapport.carte.push(place);
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

    if (!presentation && !blanche && contenu.querySelector(".recit, section.passage")) {
      const zone = contenu.getBoundingClientRect();
      let fond = zone.top;
      for (const el of contenu.querySelectorAll("p, h1, h2, li, figure, img, svg, .choix-groupe")) {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.bottom > fond) fond = r.bottom;
      }
      // La page s'ouvre sur un saut demandé : nouvelle partie, nouveau chapitre ou nouvelle page
      const premier = contenu.querySelector("h1, h2, p, figure, li, .debut-scene");
      const force = Boolean(premier && premier.classList.contains("nouvelle-page") && !premier.dataset.splitFrom);
      // Le dernier passage de la page, et s'il continue sur la suivante : le blanc est alors en lui
      // Paged.js peut laisser au bas de la page un morceau vide du passage suivant : il ne compte pas
      const passagesIci = [...contenu.querySelectorAll("section.passage[data-scene]")].filter((x) => x.textContent.trim() || x.querySelector("img, figure"));
      const dernier = passagesIci.length ? passagesIci[passagesIci.length - 1] : null;
      blancs.push({ page: n, ouvreForce: force, hauteur: zone.height, apres: dernier ? dernier.dataset.scene : null, dedans: Boolean(dernier && dernier.dataset.splitTo), x: enMm(zone.left - f.left), y: enMm(fond - f.top), l: enMm(zone.width), h: enMm(zone.bottom - fond) });
    }
  });
  blancs.forEach((b, i) => {
    const suivante = blancs[i + 1];
    if (!suivante || suivante.page !== b.page + 1 || suivante.ouvreForce) return;
    rapport.blancTotal = Math.round((rapport.blancTotal + b.h) * 10) / 10;
    if (b.h * MM > b.hauteur / 4) rapport.peuRemplies.push({ page: b.page, mm: Math.round(b.h), x: b.x, y: b.y, l: b.l, h: b.h, apres: b.apres, dedans: b.dedans });
  });
  if (blancs.length) rapport.hauteurUtile = enMm(blancs[0].hauteur);
  // Chaque passage mesuré, tous ses morceaux additionnés
  for (const section of document.querySelectorAll("section.passage[data-scene]")) {
    const id = section.dataset.scene;
    const m = rapport.mesures[id] || (rapport.mesures[id] = { h: 0, choix: 0, pleinePage: false });
    let h = section.getBoundingClientRect().height;
    const numero = section.querySelector("h2.numero:not([data-split-from])");
    if (numero && !section.dataset.splitFrom) h += parseFloat(getComputedStyle(numero).marginTop) || 0;
    m.h = Math.round((m.h + h / MM) * 10) / 10;
    for (const g of section.querySelectorAll(".choix-groupe")) m.choix = Math.round((m.choix + g.getBoundingClientRect().height / MM) * 10) / 10;
    if (section.querySelector("figure.image.page, .page-image")) m.pleinePage = true;
    // Ses blocs, dans l'ordre, pour que l'ordre des passages simule les coupures (F11.5) : « t » se
    // coupe entre deux lignes (un paragraphe, un groupe de choix), « i » ne se coupe pas (image,
    // action, fin), « n » ouvre le passage et reste avec ce qui le suit. Un bloc coupé entre deux
    // pages additionne ses morceaux.
    m.blocs = m.blocs || [];
    const enfants = [...section.children].filter((el) => el.getBoundingClientRect().height > 0 || el.matches("h2.numero"));
    enfants.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const suivant = enfants[i + 1];
      const fond = suivant ? suivant.getBoundingClientRect().top : r.bottom + (parseFloat(getComputedStyle(el).marginBottom) || 0);
      const haut = r.top - (i === 0 ? parseFloat(getComputedStyle(el).marginTop) || 0 : 0);
      const mm = Math.max(0, (fond - haut) / MM);
      const sorte = el.matches("h2.numero, h1, h2, .separateur, .debut-scene") ? "n" : el.matches("p.r, li, .choix-groupe") ? "t" : "i";
      const ref = el.dataset.splitFrom || el.dataset.ref || "";
      const deja = el.dataset.splitFrom ? m.blocs.find((b) => b[2] === ref) : null;
      if (deja) deja[1] = Math.round((deja[1] + mm) * 10) / 10;
      else m.blocs.push([sorte, Math.round(mm * 10) / 10, ref]);
    });
  }
  // La référence de Paged.js ne sert qu'à recoller les morceaux
  for (const m of Object.values(rapport.mesures)) if (m.blocs) m.blocs = m.blocs.map((b) => [b[0], b[1]]);

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
    // La page récapitulative dit où se trouve chaque point ; avec les dés, aucune page n'a de
    // numéro imprimé : le numéro du passage et sa référence suffisent à le retrouver
    for (const li of o.des ? [] : document.querySelectorAll("[data-recap-scene]")) {
      const p = rapport.pageDe[li.dataset.recapScene];
      const ou = li.querySelector(".recap__page");
      if (p && ou) ou.textContent = "p. " + p;
    }
  }
  return rapport;
}`;
