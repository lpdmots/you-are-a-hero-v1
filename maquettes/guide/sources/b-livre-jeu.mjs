// Direction B — « Le livre-jeu » : la table chaude de l'accueil, chaque question sur un feuillet
// numéroté comme un passage ; à côté, ce qui le prouve : captures scotchées, copie de l'enseignant.
import { parties, H, IMG, enLigne, schemas, couvertures, enTete, pied, etiquette, html } from "./commun.mjs";

export const fichier = "guide-b-livre-jeu.html";

const renvoi = (p) => `<a class="b-renvoi" href="#${p.id}" aria-label="partie ${p.n}">${p.n}</a>`;

function tirage(img, rot) {
  return `<figure class="b-tirage${img.portrait ? " b-tirage--portrait" : ""}" style="--r:${rot}deg"><img src="${img.src}" alt="${img.alt}" width="${img.l}" height="${img.h}" loading="lazy"></figure>${
    img.legende ? `<p class="b-note">${img.legende}</p>` : ""
  }`;
}

function partie(p, i) {
  const img = IMG[p.id];
  let texte = "";
  let cote = "";
  for (const m of p.corps) {
    if (m.sorte === "p") {
      texte += m.tete
        ? m.texte
          ? `<p><strong>${enLigne(m.tete, { renvoi })}</strong> ${enLigne(m.texte, { renvoi })}</p>`
          : `<p class="b-sous">${enLigne(m.tete)}</p>`
        : `<p>${enLigne(m.texte, { renvoi })}</p>`;
    } else if (m.sorte === "liste") {
      texte += `<ul class="b-erreurs">${m.items.map((t) => `<li>${enLigne(t, { renvoi })}</li>`).join("")}</ul>`;
    } else if (m.sorte === "tableau") {
      texte += `<table class="b-etapes"><caption class="sr">${m.entete.join(" et ")}</caption><tbody>${m.rangs
        .map((r) => `<tr><th scope="row"><span>${enLigne(r[0])}</span></th><td>${enLigne(r[1])}</td></tr>`)
        .join("")}</tbody></table>`;
    } else if (m.sorte === "classe") {
      cote += `<aside class="b-copie" aria-label="Dans ma classe" style="--r:${i % 2 ? 1.2 : -1}deg"><p class="b-copie-titre">Dans ma classe</p><p>${enLigne(m.texte, { renvoi })}</p></aside>`;
    } else if (m.sorte === "encart") {
      cote += `<aside class="b-encart" aria-label="Avec Il était une classe">${img?.dans === "encart" ? tirage(img, i % 2 ? -1.4 : 1.6) : ""}<div class="b-encart-carte"><p class="b-encart-titre"><img src="images/dragon-petit.svg" alt="" width="18" height="18">Avec Il était une classe</p><p>${enLigne(m.texte)}</p></div></aside>`;
    }
  }
  // Les images hors encart vont à côté du texte, en tête de colonne
  let preuve = "";
  if (img && img.dans !== "encart") {
    if (img.sorte === "couvertures") preuve = couvertures("b-couv");
    else if (img.sorte === "schemas") preuve = `<div class="b-schemas">${schemas()}</div>`;
    else preuve = tirage(img, i % 2 ? 1.2 : -1.2);
  }
  const suite = parties[i + 1];
  const bas = suite
    ? `<p class="b-choix"><a href="#${suite.id}"><em>${suite.titre}</em><span class="b-rdv">Rendez-vous au</span></a>${renvoi(suite)}</p>`
    : `<p class="b-fin">Fin</p>`;
  return `<section class="b-partie" id="${p.id}" aria-labelledby="${p.id}-t">
  <div class="b-feuillet" style="--r:${i % 2 ? 0.35 : -0.35}deg">
    <p class="b-numero"><span>${p.n}</span></p>
    <h2 id="${p.id}-t">${p.titre}</h2>
    ${texte}
    ${bas}
  </div>
  ${preuve || cote ? `<div class="b-cote">${preuve}${cote}</div>` : ""}
</section>`;
}

export function rendre() {
  const liens = H.plusLoin.split(" · ").map((l) => enLigne(l));
  const c = `${etiquette("B · le livre-jeu")}
${enTete()}
<main class="b">
  <header class="b-titre">
    <h1>${H.titre}</h1>
    <p class="b-orn" aria-hidden="true"><span></span>✦<span></span></p>
    <p class="b-def">${enLigne(H.definition)}</p>
    <p class="b-auteur">${enLigne(H.auteur)}</p>
  </header>
  <div class="b-ouverture">
    <section class="b-bref" aria-labelledby="bref">
      <h2 id="bref">En bref</h2>
      <ul>${H.enBref.map((t) => `<li>${enLigne(t)}</li>`).join("")}</ul>
    </section>
    <nav class="b-table" id="sommaire" aria-labelledby="table-t">
      <h2 id="table-t">Sommaire</h2>
      <ol>${parties.map((p) => `<li><a href="#${p.id}"><span class="b-q">${p.titre}</span><span class="b-pts" aria-hidden="true"></span><span class="b-renvoi">${p.n}</span></a></li>`).join("")}</ol>
    </nav>
  </div>
  ${parties.map(partie).join("\n")}
  <footer class="b-fin-livre">
    <img src="images/dragon-endormi.webp" alt="" width="720" height="559" loading="lazy">
    <div class="b-plusloin">
      <p class="b-plusloin-titre">Pour aller plus loin</p>
      ${liens.map((l) => `<p class="b-choix b-choix--lien">${l.replace('href="#">Ressources', 'href="#" title="Page à venir">Ressources')}<span class="b-fleche" aria-hidden="true">→</span></p>`).join("")}
    </div>
  </footer>
</main>
${pied()}`;
  return html({ titre: H.titre, css: "b-livre-jeu.css", corps: c });
}
