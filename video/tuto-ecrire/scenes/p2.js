// Passage 2 — « Pour commencer, ouvrez votre chapitre et cliquez sur une scène. » « Parties et
// chapitres » ; « Le vieux coffre » s'ouvre sur « Chemins » ; « La carte qui brille » : l'espace de
// travail s'ouvre à droite, la colonne se replie.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["plan", "chemins", "survol-carte", "panneau"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // « Le vieux coffre », dans « Le village des racines »
  const coffre = U.boite("plan", "coffre");
  U.viser(tl, id, { x: 240, y: 120, l: 900, h: 520 }, 1.4, T(0.9), 1.0);
  U.cadre(tl, id, coffre, m("ouvrez") - 0.1, 1.0, 6);
  const pCoffre = U.point(coffre, 0.5, 0.35);
  U.aller(tl, id, pCoffre, m("ouvrez") + 0.05, 0.7);
  const tCoffre = Math.max(m("chapitre") + 0.1, m("ouvrez") + 1.0);
  U.cliquer(tl, id, pCoffre, tCoffre);
  U.montrer(tl, id, "chemins", tCoffre + 0.15, 0.25);

  // « Chemins » : « La carte qui brille »
  const brille = U.boite("chemins", "brille");
  U.viser(tl, id, { x: 500, y: 190, l: 640, h: 440 }, 1.55, tCoffre + 0.3, 0.9);
  const pBrille = U.point(brille, 0.45, 0.4);
  U.aller(tl, id, pBrille, tCoffre + 0.5, 0.7, true);
  U.montrer(tl, id, "survol-carte", tCoffre + 1.15, 0.15);
  const tCadre = Math.max(m("cliquez") - 0.1, tCoffre + 1.0);
  U.cadre(tl, id, brille, tCadre, 0.9, 6);
  const tBrille = Math.max(m("scene") + 0.2, tCadre + 0.8);
  U.cliquer(tl, id, pBrille, tBrille);
  U.montrer(tl, id, "panneau", tBrille + 0.15, 0.3);
  U.cacherCurseur(tl, id, tBrille + 0.4);
  // l'espace de travail, à droite : son titre, sa consigne, sa liste
  U.viser(tl, id, { x: 520, y: 200, l: 900, h: 560 }, 1.4, tBrille + 0.3, Math.min(1.1, fin - tBrille - 0.4));
};
