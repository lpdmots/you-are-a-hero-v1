// Passage 3 — « D'abord, qui va écrire ? Toute la classe, ou seulement vous ? Ensuite, quel type
// de récit ? Une histoire à choix… ou un récit classique ? Attention, ces deux choix sont
// définitifs : prenez le temps d'y réfléchir. » « Ma classe », « Continuer » ; « À choix »,
// « Continuer » ; à l'étape du titre, les deux étiquettes qui « ne se changent pas ensuite ».
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["qui-ecrit", "qui-ecrit-classe", "quel-recit", "quel-recit-choix", "titre-vide"]);
  U.reprendre(tl, id, "p2", t0);

  // les deux cartes et « Continuer »
  const zone = { x: 470, y: 225, l: 720, h: 390 };
  U.viser(tl, id, zone, 1.45, T(0.15), 1.1);

  // qui va écrire ? toute la classe, ou seulement vous
  U.cadre(tl, id, U.boite("qui-ecrit", "maClasse"), m("classe") - 0.15, 1.0);
  U.cadre(tl, id, U.boite("qui-ecrit", "moi"), m("vous") - 0.15, 0.9);
  const maClasse = U.point(U.boite("qui-ecrit", "maClasse"), 0.5, 0.6);
  U.aller(tl, id, maClasse, m("vous") + 0.5, 0.6);
  const tClasse = m("vous") + 1.2;
  U.cliquer(tl, id, maClasse, tClasse);
  U.montrer(tl, id, "qui-ecrit-classe", tClasse + 0.1, 0.2);
  const continuer1 = U.point(U.boite("qui-ecrit-classe", "continuer"));
  U.aller(tl, id, continuer1, tClasse + 0.3, 0.55, true);
  const tSuite1 = Math.max(m("ensuite") + 0.05, tClasse + 1.0);
  U.cliquer(tl, id, continuer1, tSuite1);
  U.montrer(tl, id, "quel-recit", tSuite1 + 0.15, 0.3);
  U.cacherCurseur(tl, id, tSuite1 + 0.4);

  // quel type de récit ? une histoire à choix, ou un récit classique
  U.cadre(tl, id, U.boite("quel-recit", "aChoix"), m("choix") - 0.15, 2.4);
  U.cadre(tl, id, U.boite("quel-recit", "classique"), m("classique") - 0.15, 0.9);
  const aChoix = U.point(U.boite("quel-recit", "aChoix"), 0.5, 0.6);
  U.aller(tl, id, aChoix, m("classique") + 0.3, 0.6);
  const tChoix = m("classique") + 1.0;
  U.cliquer(tl, id, aChoix, tChoix);
  U.montrer(tl, id, "quel-recit-choix", tChoix + 0.1, 0.2);
  const continuer2 = U.point(U.boite("quel-recit-choix", "continuer"));
  U.aller(tl, id, continuer2, tChoix + 0.3, 0.5, true);
  const tSuite2 = tChoix + 0.95;
  U.cliquer(tl, id, continuer2, tSuite2);
  U.montrer(tl, id, "titre-vide", tSuite2 + 0.15, 0.3);
  U.cacherCurseur(tl, id, tSuite2 + 0.4);

  // ces deux choix sont définitifs : « Projet de classe », « Récit à choix », « ne se changent pas ensuite »
  // les étiquettes et leur phrase seulement, sans le filet au-dessus (mesuré sur la capture)
  const recap = { x: 483, y: 557, l: 330, h: 56 };
  U.viser(tl, id, recap, 1.9, Math.max(m("attention") - 0.4, tSuite2 + 0.3), 1.1);
  U.cadre(tl, id, recap, m("deux") - 0.1, 2.6, 10);
};
