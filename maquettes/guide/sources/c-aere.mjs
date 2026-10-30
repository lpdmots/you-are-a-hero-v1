// Direction C — « L'aérée » : la feuille blanche, de grands numéros, la question tenue à gauche
// pendant qu'on lit à droite, les images en pleine largeur.
import { parties, H, IMG, enLigne, schemas, couvertures, figureImage, enTete, pied, etiquette, html } from "./commun.mjs";

export const fichier = "guide-c-aere.html";

// Le chiffre de chaque ligne de « En bref », mis en avant : une mise en forme à juger, pas du texte nouveau
const CHIFFRES = ["4 ans", "2 × 1 h", "1 ou 2", "20 h", "5 à 30 €"];

const deux = (n) => String(n).padStart(2, "0");

function corps(p) {
  const img = IMG[p.id];
  let out = "";
  for (const m of p.corps) {
    if (img?.avant === m.sorte) out += `<div class="c-large">${figureImage(img)}</div>`;
    if (m.sorte === "p") {
      out += m.tete
        ? m.texte
          ? `<p><strong>${enLigne(m.tete)}</strong> ${enLigne(m.texte)}</p>`
          : `<p class="c-sous">${enLigne(m.tete)}</p>`
        : `<p class="c-chapeau">${enLigne(m.texte)}</p>`;
      if (img?.apres && m.tete === img.apres)
        out += `<div class="c-large">${img.sorte === "couvertures" ? couvertures("c-couv") : img.sorte === "schemas" ? schemas() : figureImage(img)}</div>`;
    } else if (m.sorte === "liste") {
      out += `<ol class="c-erreurs">${m.items.map((t) => `<li>${enLigne(t)}</li>`).join("")}</ol>`;
    } else if (m.sorte === "tableau") {
      out += `<div class="c-tableau"><table><thead><tr>${m.entete.map((c) => `<th scope="col">${c}</th>`).join("")}</tr></thead><tbody>${m.rangs
        .map((r) => `<tr><th scope="row">${enLigne(r[0])}</th><td>${enLigne(r[1])}</td></tr>`)
        .join("")}</tbody></table></div>`;
    } else if (m.sorte === "classe") {
      out += `<blockquote class="c-classe"><p class="c-classe-titre">Dans ma classe</p><p>${enLigne(m.texte)}</p></blockquote>`;
    } else if (m.sorte === "encart") {
      const avecImg = img?.dans === "encart";
      out += `<aside class="c-encart${avecImg ? " c-encart--img" : ""}${avecImg && img.portrait ? " c-encart--portrait" : ""}" aria-label="Avec Il était une classe"><div><p class="c-encart-titre"><img src="images/dragon-petit.svg" alt="" width="20" height="20">Avec Il était une classe</p><p>${enLigne(m.texte)}</p></div>${
        avecImg ? `<img class="c-encart-img" src="${img.src}" alt="${img.alt}" width="${img.l}" height="${img.h}" loading="lazy">` : ""
      }</aside>`;
    }
  }
  return out;
}

export function rendre() {
  const liens = H.plusLoin.split(" · ").map((l) => enLigne(l));
  const c = `${etiquette("C · l'aérée")}
${enTete()}
<main class="c">
  <header class="c-haut">
    <div class="c-haut-titre">
      <p class="c-sur">Guide</p>
      <h1>${H.titre}</h1>
    </div>
    <div class="c-haut-texte">
      <p class="c-def">${enLigne(H.definition)}</p>
      <p class="c-auteur"><span class="c-initiales" aria-hidden="true">NC</span><span>${enLigne(H.auteur)}</span></p>
    </div>
  </header>
  <section class="c-bref" aria-labelledby="bref">
    <h2 id="bref">En bref</h2>
    <ul>${H.enBref.map((t, i) => `<li><span class="c-chiffre" aria-hidden="true">${CHIFFRES[i]}</span><span>${enLigne(t)}</span></li>`).join("")}</ul>
  </section>
  <nav class="c-sommaire" id="sommaire" aria-labelledby="sommaire-t">
    <h2 id="sommaire-t">Sommaire</h2>
    <ol>${parties.map((p) => `<li><a href="#${p.id}"><span class="c-n">${deux(p.n)}</span><span>${p.titre}</span></a></li>`).join("")}</ol>
  </nav>
  ${parties
    .map(
      (p) => `<section class="c-partie" id="${p.id}" aria-labelledby="${p.id}-t">
    <div class="c-gauche"><p class="c-numero" aria-hidden="true">${deux(p.n)}</p><h2 id="${p.id}-t">${p.titre}</h2><a class="c-haut-lien" href="#sommaire">Sommaire</a></div>
    <div class="c-droite">${corps(p)}</div>
  </section>`,
    )
    .join("\n")}
  <footer class="c-plusloin">
    <p class="c-plusloin-titre">Pour aller plus loin</p>
    <ul>${liens.map((l) => `<li>${l.replace('href="#">Ressources', 'href="#" title="Page à venir">Ressources')}</li>`).join("")}</ul>
  </footer>
</main>
${pied()}`;
  return html({ titre: H.titre, css: "c-aere.css", corps: c });
}
