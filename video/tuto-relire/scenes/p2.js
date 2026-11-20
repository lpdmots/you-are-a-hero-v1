// Passage 2 — « Pour commencer, rendez-vous dans « Suivi ». Vous y retrouvez sa scène, marquée
// « À valider ». Cliquez sur « Relire ». » « Chemins » du chapitre, là où le tuto 6 s'arrête ;
// « Suivi » dans la colonne ; la ligne de « La carte qui brille », son tampon ; « Relire » ouvre la scène.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["chemins", "survol-suivi", "suivi", "survol-relire", "scene"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // « Suivi », dans la colonne, avec le nombre de scènes à valider
  U.viser(tl, id, { x: 0, y: 150, l: 1200, h: 520 }, 1.2, T(0.8), 1.0);
  const suivi = U.boite("chemins", "suivi");
  const pSuivi = U.point(suivi, 0.3);
  U.aller(tl, id, pSuivi, m("rendez") - 0.3, 0.7);
  U.montrer(tl, id, "survol-suivi", m("rendez") + 0.35, 0.15);
  U.cadre(tl, id, suivi, m("suivi") - 0.3, 0.9, 5);
  const tSuivi = m("suivi") + 0.45;
  U.cliquer(tl, id, pSuivi, tSuivi);
  U.montrer(tl, id, "suivi", tSuivi + 0.15, 0.3);
  U.cacherCurseur(tl, id, tSuivi + 0.4);

  // sa scène, « À valider »
  U.viser(tl, id, { x: 250, y: 270, l: 1160, h: 220 }, 1.3, tSuivi + 0.3, 0.9);
  const ligne = U.boite("suivi", "ligne");
  U.cadre(tl, id, ligne, Math.max(m("retrouvez") - 0.1, tSuivi + 1.1), 1.4, 4);
  U.cadre(tl, id, U.boite("suivi", "tampon"), Math.max(m("valider") - 0.3, tSuivi + 2.6), 1.2, 5);

  // « Relire »
  const relire = U.boite("suivi", "relire");
  const pRelire = U.point(relire, 0.45);
  U.aller(tl, id, pRelire, m("cliquez") - 0.6, 0.7);
  U.montrer(tl, id, "survol-relire", m("cliquez") + 0.1, 0.15);
  U.cadre(tl, id, relire, m("sur") - 0.1, 0.9, 5);
  const tRelire = m("relire") + 0.3;
  U.cliquer(tl, id, pRelire, tRelire);
  U.montrer(tl, id, "scene", tRelire + 0.15, 0.3);
  U.cacherCurseur(tl, id, tRelire + 0.4);
  // la scène : son texte à gauche, « Votre relecture » à droite
  U.viser(tl, id, { x: 240, y: 60, l: 1180, h: 520 }, 1.2, tRelire + 0.3, Math.min(1.0, fin - tRelire - 0.4));
};
