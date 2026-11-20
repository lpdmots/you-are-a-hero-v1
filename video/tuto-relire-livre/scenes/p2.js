// Passage 2 — « Pour commencer, vérifiez que la présentation de chaque scène vous convient, avec ou
// sans image, puis cliquez sur « Prête pour le livre ». » La scène de Sacha, validée au tuto 7 : la
// copie entière, puis son image ; « Prête pour le livre » : la fiche le dit, le tampon passe à « Prête ».
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["scene", "survol-prete", "prete"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // la présentation de la scène : la copie entière (image et texte), puis son image
  const copie = U.boite("scene", "copie");
  U.viser(tl, id, { x: 256, y: 60, l: 1160, h: 680 }, 1.15, T(0.6), 0.9);
  U.viser(tl, id, { x: copie.x, y: copie.y, l: copie.l, h: 810 - copie.y }, 1.7, Math.max(m("verifiez") - 0.3, T(1.6)), 1.0);
  U.cadre(tl, id, { x: copie.x, y: copie.y, l: copie.l, h: 806 - copie.y }, m("presentation") - 0.1, 1.9, 4);
  const image = U.boite("scene", "image");
  U.cadre(tl, id, image, m("avec") - 0.1, 1.4, 6);

  // « Prête pour le livre »
  U.viser(tl, id, { x: 1000, y: 60, l: 420, h: 300 }, 1.9, m("puis") - 0.2, 0.9);
  const prete = U.boite("scene", "prete");
  const pPrete = U.point(prete, 0.45);
  U.aller(tl, id, pPrete, m("cliquez") - 0.3, 0.7);
  U.montrer(tl, id, "survol-prete", m("cliquez") + 0.35, 0.15);
  U.cadre(tl, id, prete, m("prete") - 0.2, 1.0, 5);
  const tPrete = m("livre") + 0.35;
  U.cliquer(tl, id, pPrete, tPrete);
  U.montrer(tl, id, "prete", tPrete + 0.15, 0.3);
  U.cacherCurseur(tl, id, tPrete + 0.4);
  // « Prête pour le livre. », et le tampon « Prête » en haut
  U.cadre(tl, id, U.boite("prete", "fait"), tPrete + 0.5, Math.min(1.2, fin - tPrete - 0.5), 5);
  U.cadre(tl, id, U.boite("prete", "tampon"), tPrete + 0.5, Math.min(1.2, fin - tPrete - 0.5), 5);
};
