// Passage 5 — « Et voilà, votre projet est créé ! Vous arrivez sur la page de préparation. À
// gauche, vous retrouvez toutes les étapes de création de votre livre : la préparation, les parties
// et les chapitres, le suivi de la classe, puis le livre final. » L'écran d'aide de la Préparation
// et son message ; « Commencer » ; la caméra suit la colonne de gauche, étape après étape.
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["aide-preparation", "preparation"]);
  U.reprendre(tl, id, "p4", t0);

  // le message « « Le secret de la forêt bleue » est créé » (mesuré sur la capture)
  U.cadre(tl, id, { x: 478, y: 741, l: 469, h: 45 }, m("cree") - 0.2, 1.6, 6);

  // « Commencer » : la Préparation
  const commencer = U.point(U.boite("aide-preparation", "commencer"));
  U.aller(tl, id, commencer, m("arrivez") - 0.5, 0.7);
  const tCommencer = m("preparation") + 0.1;
  U.cliquer(tl, id, commencer, tCommencer);
  U.montrer(tl, id, "preparation", tCommencer + 0.15, 0.35);
  U.cacherCurseur(tl, id, tCommencer + 0.45);

  // à gauche : la colonne, et ses quatre étapes sur les mots de la voix
  U.viser(tl, id, { x: 12, y: 60, l: 207, h: 410 }, 1.75, m("gauche") - 0.6, 1.2, 760);
  U.cadre(tl, id, U.boite("preparation", "sections"), m("etapes") - 0.1, 1.5, 6);
  U.cadre(tl, id, U.boite("preparation", "preparation"), m("preparation", 2) - 0.1, 1.0, 3);
  U.cadre(tl, id, U.boite("preparation", "plan"), m("parties") - 0.1, 1.5, 3);
  U.cadre(tl, id, U.boite("preparation", "suivi"), m("suivi") - 0.1, 1.2, 3);
  U.cadre(tl, id, U.boite("preparation", "livre"), m("livre", 2) - 0.1, 1.6, 3);
};
