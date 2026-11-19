// Passage 2 — « Pour cela, la préparation se fait en plusieurs étapes : l'univers, les personnages,
// l'enjeu, puis les grandes étapes de l'histoire. » La Préparation du projet du tuto 2 ; la caméra
// sur les quatre premières étapes de la ligne (« Les choix » et « Le jeu » restent hors du cadre).
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["preparation"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // les quatre étapes de l'histoire, la caméra un peu à droite pour laisser les facultatives dehors
  const b = (q) => U.boite("preparation", q);
  const quatre = { x: 258, y: 82, l: 875, h: 64 };
  U.viser(tl, id, quatre, 2.1, m("etapes") - 0.7, 1.2, 980);
  U.cadre(tl, id, b("univers"), m("univers") - 0.1, 1.0, 3);
  U.cadre(tl, id, b("personnages"), m("personnages") - 0.1, 1.0, 3);
  U.cadre(tl, id, b("enjeu"), m("enjeu") - 0.1, 1.0, 3);
  U.cadre(tl, id, b("etapes"), m("grandes") - 0.1, 1.3, 3);
};
