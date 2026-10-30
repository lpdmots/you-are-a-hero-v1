// Direction A — « L'article » : la page de texte du site (fond du bureau, comme l'Aide et la
// bibliothèque), une colonne de lecture, le sommaire collant à gauche sur grand écran.
import { parties, H, IMG, enLigne, schemas, couvertures, figureImage, enTete, pied, etiquette, html } from "./commun.mjs";

export const fichier = "guide-a-article.html";

const encartTitre = `<p class="a-encart-titre"><img src="images/dragon-petit.svg" alt="" width="20" height="20">Avec Il était une classe</p>`;

function corps(p) {
  const img = IMG[p.id];
  let out = "";
  for (const m of p.corps) {
    if (img?.avant === m.sorte) out += figureImage(img);
    if (m.sorte === "p") {
      out += m.tete
        ? `<p>${m.texte ? `<strong class="a-tete">${enLigne(m.tete)}</strong> ${enLigne(m.texte)}` : `<strong class="a-tete a-tete--seule">${enLigne(m.tete)}</strong>`}</p>`
        : `<p>${enLigne(m.texte)}</p>`;
      if (img?.apres && m.tete === img.apres) out += img.sorte === "couvertures" ? couvertures("a-couv") : img.sorte === "schemas" ? schemas() : figureImage(img);
    } else if (m.sorte === "liste") {
      out += `<ol class="a-erreurs">${m.items.map((t) => `<li>${enLigne(t)}</li>`).join("")}</ol>`;
    } else if (m.sorte === "tableau") {
      out += `<div class="a-tableau"><table><thead><tr>${m.entete.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${m.rangs
        .map((r) => `<tr><th scope="row">${enLigne(r[0])}</th><td>${enLigne(r[1])}</td></tr>`)
        .join("")}</tbody></table></div>`;
    } else if (m.sorte === "classe") {
      out += `<aside class="a-classe" aria-label="Dans ma classe"><p class="a-classe-titre">Dans ma classe</p><p>${enLigne(m.texte)}</p></aside>`;
    } else if (m.sorte === "encart") {
      out += `<aside class="a-encart" aria-label="Avec Il était une classe">${encartTitre}<div class="a-encart-corps"><p>${enLigne(m.texte)}</p>${
        img?.dans === "encart" ? `<img class="a-encart-img${img.portrait ? " a-encart-img--portrait" : ""}" src="${img.src}" alt="${img.alt}" width="${img.l}" height="${img.h}" loading="lazy">` : ""
      }</div></aside>`;
    }
  }
  return out;
}

const sommaire = (cls) =>
  `<ol class="${cls}">${parties.map((p) => `<li><a href="#${p.id}"><span class="a-n">${p.n}</span><span>${p.titre}</span></a></li>`).join("")}</ol>`;

export function rendre() {
  const plusLoin = enLigne(H.plusLoin)
    .replace('href="#">Ressources', 'href="#" title="Page à venir">Ressources')
    .replace(/ · /g, "</li><li>");
  const c = `${etiquette("A · l'article")}
${enTete()}
<main class="a">
  <header class="a-haut">
    <p class="a-sur">Guide</p>
    <h1>${H.titre}</h1>
    <p class="a-def">${enLigne(H.definition)}</p>
    <p class="a-auteur">${enLigne(H.auteur)}</p>
  </header>
  <div class="a-grille">
    <nav class="a-sommaire" aria-label="Sommaire">
      <p class="a-sommaire-titre">Sommaire</p>
      ${sommaire("a-sommaire-liste")}
    </nav>
    <article class="a-article">
      <section class="a-bref" aria-labelledby="bref">
        <h2 id="bref">En bref</h2>
        <ul>${H.enBref.map((t) => `<li>${enLigne(t)}</li>`).join("")}</ul>
      </section>
      <nav class="a-sommaire-court" id="sommaire" aria-label="Sommaire">
        <p class="a-sommaire-titre">Sommaire</p>
        ${sommaire("a-sommaire-liste")}
      </nav>
      ${parties.map((p) => `<section class="a-partie" id="${p.id}" aria-labelledby="${p.id}-t"><h2 id="${p.id}-t"><span class="a-num">${p.n}</span>${p.titre}</h2>${corps(p)}</section>`).join("\n")}
      <footer class="a-plusloin"><p>Pour aller plus loin</p><ul><li>${plusLoin}</li></ul></footer>
    </article>
  </div>
  <a class="a-vers-sommaire" href="#sommaire">Sommaire</a>
</main>
${pied()}`;
  const script = `<script>
  // Le sommaire collant suit la lecture : la question en cours en canard
  const liens = new Map([...document.querySelectorAll('.a-sommaire a')].map(a => [a.hash.slice(1), a]));
  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    liens.forEach(a => a.removeAttribute('aria-current'));
    liens.get(e.target.id)?.setAttribute('aria-current', 'true');
  }), { rootMargin: '-15% 0px -75% 0px' });
  document.querySelectorAll('.a-partie').forEach(s => obs.observe(s));
</script>`;
  return html({ titre: H.titre, css: "a-article.css", corps: c, script });
}
