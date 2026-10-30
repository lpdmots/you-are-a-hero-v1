// Direction A2 — l'article retenu le 30 octobre 2026, repris avec le meilleur de B et de C :
// la table chaude et une page de titre sur papier (B), les chiffres de « En bref » et les images en
// grand (C), « Dans ma classe » en copie à marge rouge et les renvois cerclés (B).
import { parties, H, IMG, enLigne, schemas, couvertures, figureImage, enTete, pied, etiquette, html } from "./commun.mjs";

export const fichier = "guide-a2.html";

// Le chiffre de chaque ligne de « En bref », mis en avant ; la phrase reste entière à côté
const CHIFFRES = ["4 ans", "2 × 1 h", "1 ou 2", "20 h", "5 à 30 €"];

const renvoi = (p) => `<a class="g-renvoi" href="#${p.id}" aria-label="partie ${p.n}">${p.n}</a>`;
const croix = `<svg class="g-croix" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11"/><path d="M8 8l8 8M16 8l-8 8"/></svg>`;
const signe = `<span class="g-encart-signe" aria-hidden="true"><img src="images/dragon-petit.svg" alt="" width="22" height="22"></span>`;

function large(contenu) {
  return `<div class="g-large">${contenu}</div>`;
}

function corps(p) {
  const img = IMG[p.id];
  let out = "";
  for (const m of p.corps) {
    if (img?.avant === m.sorte) out += large(figureImage(img));
    if (m.sorte === "p") {
      out += m.tete
        ? m.texte
          ? `<p><strong>${enLigne(m.tete)}</strong> ${enLigne(m.texte)}</p>`
          : `<h3>${enLigne(m.tete)}</h3>`
        : `<p>${enLigne(m.texte)}</p>`;
      if (img?.apres && m.tete === img.apres)
        out += large(img.sorte === "couvertures" ? couvertures() : img.sorte === "schemas" ? schemas() : figureImage(img));
    } else if (m.sorte === "liste") {
      out += `<ol class="g-erreurs">${m.items.map((t) => `<li>${croix}<p>${enLigne(t, { renvoi })}</p></li>`).join("")}</ol>`;
    } else if (m.sorte === "tableau") {
      out += `<div class="g-tableau"><table><thead><tr>${m.entete.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${m.rangs
        .map((r) => `<tr><th scope="row">${enLigne(r[0])}</th><td>${enLigne(r[1])}</td></tr>`)
        .join("")}</tbody></table></div>`;
    } else if (m.sorte === "classe") {
      out += `<aside class="g-classe" aria-label="Dans ma classe"><p class="g-classe-titre">Dans ma classe</p><p>${enLigne(m.texte)}</p></aside>`;
    } else if (m.sorte === "encart") {
      const i = img?.dans === "encart" ? img : null;
      out += `<aside class="g-encart${i ? (i.portrait ? " g-encart--portrait" : " g-encart--paysage") : ""}" aria-label="L’outil Il était une classe">${signe}<p>${enLigne(m.texte)}</p>${
        i ? `<img class="g-encart-img" src="${i.src}" alt="${i.alt}" width="${i.l}" height="${i.h}" loading="lazy">` : ""
      }</aside>`;
    }
  }
  return out;
}

const sommaire = () =>
  `<ol class="g-sommaire-liste">${parties.map((p) => `<li><a href="#${p.id}"><span class="g-n">${p.n}</span><span>${p.titre}</span></a></li>`).join("")}</ol>`;

export function rendre() {
  const liens = H.plusLoin.split(" · ").map((l) => enLigne(l));
  const [ressources, bibliotheque, essayer] = liens;
  const c = `${etiquette("A2 · l'article repris")}
${enTete()}
<main class="g">
  <header class="g-titre">
    <div class="g-titre-texte">
      <h1>${H.titre}</h1>
      <p class="g-def">${enLigne(H.definition)}</p>
      <p class="g-auteur">${enLigne(H.auteur)}</p>
    </div>
    <img class="g-dragon" src="images/dragon-grand-livre.webp" alt="" width="500" height="620">
  </header>
  <div class="g-grille">
    <nav class="g-sommaire" aria-label="Sommaire">
      <p class="g-sommaire-titre">Sommaire</p>
      ${sommaire()}
    </nav>
    <article class="g-article">
      <section class="g-bref" aria-labelledby="bref">
        <h2 id="bref">En bref</h2>
        <ul>${H.enBref.map((t, i) => `<li><span class="g-chiffre" aria-hidden="true">${CHIFFRES[i]}</span><span>${enLigne(t)}</span></li>`).join("")}</ul>
      </section>
      <nav class="g-sommaire-court" id="sommaire" aria-label="Sommaire">
        <p class="g-sommaire-titre">Sommaire</p>
        ${sommaire()}
      </nav>
      ${parties.map((p) => `<section class="g-partie" id="${p.id}" aria-labelledby="${p.id}-t"><h2 id="${p.id}-t"><span class="g-num">${p.n}</span><span>${p.titre}</span></h2>${corps(p)}</section>`).join("\n")}
      <footer class="g-plusloin">
        <h2>Pour aller plus loin</h2>
        <p class="g-choix">${ressources.replace('href="#">', 'href="#" title="Page à venir">')}<span aria-hidden="true">→</span></p>
        <p class="g-choix">${bibliotheque}<span aria-hidden="true">→</span></p>
        <p class="g-essayer">${essayer.replace("<a ", '<a class="g-bouton" ')}</p>
      </footer>
    </article>
  </div>
  <a class="g-vers-sommaire" href="#sommaire" hidden>Sommaire<span class="g-ou"></span></a>
</main>
${pied()}`;
  const script = `<script>
  // Grand écran : le sommaire collant met en canard la question qu'on lit.
  // Téléphone : un bouton « Sommaire », seulement une fois le sommaire dépassé, avec le numéro en cours.
  const liens = new Map([...document.querySelectorAll('.g-sommaire a')].map(a => [a.hash.slice(1), a]));
  const bouton = document.querySelector('.g-vers-sommaire');
  const ou = bouton.querySelector('.g-ou');
  const total = liens.size;
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    liens.forEach(a => a.removeAttribute('aria-current'));
    const a = liens.get(e.target.id);
    a?.setAttribute('aria-current', 'true');
    ou.textContent = a ? '· ' + a.querySelector('.g-n').textContent + ' / ' + total : '';
  }), { rootMargin: '-15% 0px -75% 0px' });
  document.querySelectorAll('.g-partie').forEach(s => obs.observe(s));
  const court = document.querySelector('.g-sommaire-court');
  // Le bouton ne paraît qu'une fois le sommaire passé au-dessus de l'écran
  let attente = false;
  const placer = () => { attente = false; bouton.hidden = court.getBoundingClientRect().bottom > 0; };
  addEventListener('scroll', () => { if (!attente) { attente = true; requestAnimationFrame(placer); } }, { passive: true });
  placer();
</script>`;
  return html({ titre: H.titre, css: "a2.css", corps: c, script });
}
