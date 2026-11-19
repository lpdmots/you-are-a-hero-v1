// La version « à compléter » d'une leçon, tirée de la même source que la version complète :
// ouverte avec « ?a-completer », la page remplace chaque réponse par un blanc où l'élève écrit.
//   <span class="rep">mot</span>             → une ligne à remplir, un peu plus large que le mot ;
//   <… data-lignes="2">exemple</…>            → des lignes d'écriture à la place du texte ;
//   .seul-complet / .seul-a-completer         → ce qui ne paraît que dans l'une des deux versions.
// Le compositeur attend `data-pret` sur <html> avant d'imprimer.
(async () => {
  const racine = document.documentElement;
  // Chargé dans l'en-tête : attendre que toute la page soit lue, puis que ses polices soient là
  if (document.readyState === "loading") await new Promise((fini) => document.addEventListener("DOMContentLoaded", fini));
  await document.fonts.ready;
  if (new URLSearchParams(location.search).has("a-completer")) {
    // Mesurer d'abord, dans la mise en page complète, puis vider
    const reponses = [...document.querySelectorAll(".rep")].map((r) => [r, r.getBoundingClientRect().width]);
    racine.classList.add("a-completer");
    for (const [r, largeur] of reponses) {
      // Le nom d'une carte, seul sur sa ligne : un blanc à peine plus long que le mot
      const titre = r.closest(".carte-titre");
      r.style.width = titre ? `${Math.max(largeur * 1.15 + 10, 64)}px` : `${Math.min(Math.max(largeur * 1.25 + 18, 70), 240)}px`;
      r.textContent = "";
    }
    for (const bloc of document.querySelectorAll("[data-lignes]")) {
      // De vrais traits, un par ligne : un dégradé répété s'imprime mal (des lignes sautent)
      bloc.textContent = "";
      bloc.classList.add("lignes-a-ecrire");
      for (let i = 0; i < Number(bloc.dataset.lignes); i++) bloc.append(document.createElement("i"));
    }
  }
  racine.dataset.pret = "1";
})();
