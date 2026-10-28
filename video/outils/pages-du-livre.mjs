#!/usr/bin/env node
// Les pages feuilletées d'une vidéo, remplies avec les vrais passages du livre : les passages
// (outils/passages-du-livre.mts) coulent de page en page dans la composition servie par le studio
// (port 4850), mesurés avec ses polices. Règles de coupure : un paragraphe se coupe en gardant au
// moins deux lignes de chaque côté ; un choix, une consigne ou une image ne commence pas une page
// seul : il emmène les choix qui le précèdent et les deux dernières lignes du paragraphe d'avant ;
// un numéro ne reste jamais seul en bas de page. Sortie : le HTML de chaque page et la place laissée
// vide en bas (en px), dans l'ordre de lecture.
//   node outils/pages-du-livre.mjs passages.json <passage> <de> <à> <nbPages> [imagesDir]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(path.join(process.env.HOME, "Projets/you-are-a-hero/V1/app/package.json"));
const { chromium } = require("playwright");
const [fichier, scene, de, a, nb, dossierImages = "assets/ill/livre"] = process.argv.slice(2);
const passages = JSON.parse(fs.readFileSync(fichier, "utf8")).filter((p) => p.n >= +de && p.n <= +a);

const navigateur = await chromium.launch();
const page = await navigateur.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://localhost:4850/api/projects/${process.env.VIDEO || "visite"}/preview/comp/index.html`);
await page.waitForFunction(() => window.__playerReady === true, null, { timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
const pages = await page.evaluate(async ({ scene, passages, nb, dossierImages }) => {
  const hote = document.querySelector(`#s-${scene} .livre`);
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const nouvelle = () => {
    const p = document.createElement("div");
    p.className = "page g";
    p.style.visibility = "hidden";
    hote.appendChild(p);
    return p;
  };
  const deborde = (p) => p.scrollHeight > p.clientHeight + 1;
  const lignes = (el) => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight));
  const vide = (p) => {
    const dernier = p.lastElementChild;
    if (!dernier) return p.clientHeight;
    const bas = dernier.lastElementChild ?? dernier;
    return Math.round(p.clientHeight - parseFloat(getComputedStyle(p).paddingBottom) - (bas.offsetTop + bas.offsetHeight));
  };
  const sortie = [];
  let pg = nouvelle();
  let bloc;
  const tourner = () => {
    sortie.push({ html: pg.innerHTML, vide: vide(pg) });
    pg.remove();
    pg = nouvelle();
    bloc = document.createElement("div");
    bloc.className = "passage suite";
    pg.appendChild(bloc);
  };
  /** Coupe le paragraphe p : ce qui tient (au moins deux lignes) reste, le reste (au moins deux lignes) est rendu */
  const couper = (p, garderAuPlus) => {
    const mots = p.textContent.split(" ");
    const total = lignes(p);
    let k = mots.length;
    while (k > 0 && (deborde(pg) || lignes(p) > Math.min(garderAuPlus, total - 2))) { k -= 1; p.textContent = mots.slice(0, k).join(" "); }
    if (k === 0 || lignes(p) < 2) { p.textContent = mots.join(" "); return null; }
    p.classList.add("coupe");
    return mots.slice(k).join(" ");
  };
  const paragraphe = (t) => { const p = document.createElement("p"); p.textContent = t; return p; };

  for (const ps of passages) {
    // le numéro et le début du passage
    bloc = document.createElement("div");
    bloc.className = "passage";
    bloc.innerHTML = `<span class="n">${ps.n}</span>`;
    pg.appendChild(bloc);
    for (const b of ps.blocs) {
      // une image pleine page a sa page à elle : en tête de passage, sous le numéro (F10-AC36)
      if (b.pleinePage) {
        const enTete = bloc.children.length === 1;
        if (enTete) bloc.remove();
        if (pg.querySelector("p, img")) tourner(); else bloc?.remove();
        bloc = document.createElement("div");
        bloc.className = enTete ? "passage" : "passage suite";
        if (enTete) bloc.innerHTML = `<span class="n">${ps.n}</span>`;
        pg.appendChild(bloc);
        const img = document.createElement("img");
        img.src = `${dossierImages}/${b.image}`; img.alt = ""; img.className = "pleine";
        bloc.appendChild(img);
        img.style.height = `${pg.clientHeight - parseFloat(getComputedStyle(pg).paddingBottom) - img.offsetTop}px`;
        tourner();
        continue;
      }
      let el;
      if (b.image) { el = document.createElement("img"); el.src = `${dossierImages}/${b.image}`; el.alt = ""; await el.decode().catch(() => {}); }
      else if (b.p) el = paragraphe(b.p);
      else {
        el = document.createElement("p");
        el.className = b.choix ? "ch" : "action";
        el.innerHTML = b.action ? `<i data-ic="crayon"></i>${esc(b.action)}` : esc(b.choix).replace(/au (\d+)/g, "au <strong>$1</strong>");
      }
      bloc.appendChild(el);
      if (!deborde(pg)) continue;
      // une image se réduit, jusqu'aux trois cinquièmes, pour tenir en bas de page
      if (b.image) {
        const naturelle = el.offsetHeight;
        const libre = naturelle - (pg.scrollHeight - pg.clientHeight) - 2;
        if (libre >= naturelle * 0.6) {
          el.style.height = `${libre}px`; el.style.width = "auto"; el.style.marginInline = "auto";
          if (!deborde(pg)) continue;
          el.style.height = el.style.width = el.style.marginInline = "";
        }
      }

      if (b.p) {
        // un paragraphe : il se coupe s'il garde deux lignes de chaque côté, sinon il passe entier
        const reste = couper(el, Infinity);
        if (reste !== null) { tourner(); bloc.appendChild(paragraphe(reste)); continue; }
        el.remove();
        if (bloc.children.length === 1) { bloc.remove(); tourner(); bloc.className = "passage"; bloc.innerHTML = `<span class="n">${ps.n}</span>`; }
        else tourner();
        bloc.appendChild(el);
        continue;
      }
      // un choix, une consigne, une image : ils emmènent les choix et consignes qui les précèdent…
      el.remove();
      const groupe = [el];
      while (bloc.lastElementChild && bloc.lastElementChild.tagName === "P" && bloc.lastElementChild.className && !bloc.lastElementChild.classList.contains("coupe")) groupe.unshift(bloc.lastElementChild), bloc.lastElementChild.remove();
      // … et la fin du paragraphe d'avant
      const avant = bloc.lastElementChild;
      if (avant?.tagName === "P" && !avant.className) {
        const n = lignes(avant);
        const reste = n >= 4 ? couper(avant, n - 2) : null;
        if (reste !== null) { tourner(); bloc.appendChild(paragraphe(reste)); }
        else if (bloc.children.length > 2) { avant.remove(); tourner(); bloc.appendChild(avant); }
        else { const num = ps.n; bloc.remove(); tourner(); bloc.className = "passage"; bloc.innerHTML = `<span class="n">${num}</span>`; bloc.appendChild(avant); }
      } else tourner();
      groupe.forEach((g) => bloc.appendChild(g));
    }
    if (sortie.length >= nb) break;
  }
  if (sortie.length < nb) sortie.push({ html: pg.innerHTML, vide: vide(pg) });
  pg.remove();
  return sortie.slice(0, nb);
}, { scene, passages, nb: +nb, dossierImages });
console.log(JSON.stringify(pages, null, 1));
await navigateur.close();
