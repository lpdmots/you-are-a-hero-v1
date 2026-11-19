// Passage 3 — « À chaque étape, une question pour lancer la réflexion. Projetez-la au tableau et
// guidez la discussion à l'aide des questions proposées. » La question en grand ; « Projeter » ;
// dans la projection, les questions pour la classe.
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["preparation", "projection"]);
  U.reprendre(tl, id, "p2", t0);

  // la question de l'étape
  const question = U.boite("preparation", "question");
  U.viser(tl, id, question, 1.6, T(0.15), 1.2);
  U.cadre(tl, id, question, m("question") - 0.1, 1.7, 10);

  // « Projeter », en haut à droite : la caméra recule pour le montrer
  U.plan(tl, id, m("projetez") - 1.3, 1.0);
  const projeter = U.boite("preparation", "projeter");
  const surProjeter = U.point(projeter);
  U.aller(tl, id, surProjeter, m("projetez") - 0.6, 0.7);
  U.cadre(tl, id, projeter, m("projetez") - 0.1, 0.7, 5);
  const tProjeter = m("projetez") + 0.6;
  U.cliquer(tl, id, surProjeter, tProjeter);
  U.montrer(tl, id, "projection", tProjeter + 0.15, 0.4);
  U.cacherCurseur(tl, id, tProjeter + 0.4);

  // les questions proposées, pour guider la discussion
  const relances = U.boite("projection", "relances");
  U.viser(tl, id, { x: 60, y: 120, l: 620, h: 300 }, 1.6, tProjeter + 0.7, 1.1);
  U.cadre(tl, id, relances, m("questions") - 0.15, 1.8, 8);
};
