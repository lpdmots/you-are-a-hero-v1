// La version complète de « Mon chapitre » est un exemple rempli : le texte de chaque champ se pose à la
// main sur ses lignes. La version à compléter (« ?a-completer ») est la feuille vierge, dont
// commun/a-completer.js ne garde que les lignes. De vrais traits, un par ligne : un dégradé s'imprime mal.
if (!new URLSearchParams(location.search).has("a-completer")) {
  for (const champ of document.querySelectorAll(".ecrit[data-lignes]")) {
    const main = document.createElement("span");
    main.className = "main";
    main.append(...champ.childNodes);
    champ.append(main);
    for (let i = 0; i < Number(champ.dataset.lignes); i++) champ.append(document.createElement("i"));
  }
}

// « ?obstacles » : la seule feuille « Un obstacle », deux fois, pour l'imprimer en recto verso
// (mon-chapitre-obstacles.pdf). Fait avant que commun/a-completer.js ne vide les champs des deux feuilles.
if (new URLSearchParams(location.search).has("obstacles")) {
  const [chapitre, obstacle] = document.querySelectorAll(".page");
  chapitre.remove();
  obstacle.querySelector(".pied .droite").textContent = "Mon chapitre · un obstacle · iletaituneclasse.com";
  obstacle.after(obstacle.cloneNode(true));
}
