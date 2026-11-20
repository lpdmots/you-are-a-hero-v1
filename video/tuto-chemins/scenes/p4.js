// Passage 4 — « Chaque choix apparaît alors sous la carte, avec un lien vers la nouvelle scène.
// Vous pouvez ainsi créer autant de chemins que vous le souhaitez ! » L'onglet, le trait ; un
// deuxième choix (« Appeler Pic à l'aide », « Pic l'écureuil ») ; puis le temps saute : un
// troisième, déjà fait.
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["choix1-ajoute", "choix2-survol", "choix2-bulle", "choix2-action", "choix2-titre-focus", "choix2-titre", "choix2-ajoute", "trois-choix"]);
  U.reprendre(tl, id, "p3", t0);

  // l'onglet du choix, puis le trait et la carte où il mène
  U.cadre(tl, id, U.boite("choix1-ajoute", "onglets"), Math.max(T(0.2), m("apparait") - 0.1), 1.5, 4);
  const brille = U.boite("choix1-ajoute", "carteBrille");
  U.cadre(tl, id, { x: brille.x, y: brille.y - 48, l: brille.l, h: brille.h + 48 }, Math.max(T(1.8), m("lien") - 0.1), 1.5, 6);

  // un deuxième choix, au même « + »
  U.viser(tl, id, { x: 700, y: 200, l: 380, h: 440 }, 1.7, m("vous") - 0.6, 0.9);
  const plus = U.boite("choix2-survol", "plus");
  const pPlus = U.point(plus);
  U.aller(tl, id, pPlus, m("vous") - 0.3, 0.6);
  U.montrer(tl, id, "choix2-survol", m("vous") + 0.3, 0.2);
  const tPlus = m("vous") + 0.7;
  U.cliquer(tl, id, pPlus, tPlus);
  U.montrer(tl, id, "choix2-bulle", tPlus + 0.12, 0.2);
  U.cacherCurseur(tl, id, tPlus + 0.35);
  const action = U.boite("choix2-action", "action");
  const tAction = tPlus + 0.5;
  const dAction = 1.0;
  U.montrer(tl, id, "choix2-action", tAction, 0);
  const mAction = U.taper(tl, id, "choix2-action", action, tAction, dAction, 18, -4, true);
  U.ranger(tl, [mAction], tAction + dAction + 0.1);
  const suite = U.boite("choix2-titre-focus", "suite");
  const pSuite = U.point(suite, 0.35);
  U.aller(tl, id, pSuite, tAction + dAction + 0.05, 0.4, null);
  const tSuite = tAction + dAction + 0.5;
  U.cliquer(tl, id, pSuite, tSuite);
  U.montrer(tl, id, "choix2-titre-focus", tSuite + 0.1, 0);
  const dSuite = 0.8;
  const mSuite = U.taper(tl, id, "choix2-titre", suite, tSuite + 0.3, dSuite, 14, -4, true);
  U.montrer(tl, id, "choix2-titre", tSuite + 0.3 + dSuite + 0.05, 0);
  U.ranger(tl, [mSuite], tSuite + 0.3 + dSuite + 0.1);
  const ajouter = U.boite("choix2-titre", "ajouter");
  const pAjouter = U.point(ajouter);
  U.aller(tl, id, pAjouter, tSuite + 0.3 + dSuite + 0.1, 0.4, true);
  const tAjouter = tSuite + 0.3 + dSuite + 0.6;
  U.cliquer(tl, id, pAjouter, tAjouter);
  U.montrer(tl, id, "choix2-ajoute", tAjouter + 0.15, 0.3);
  window.bruit("cartes", tAjouter + 0.2, 0.6);
  U.cacherCurseur(tl, id, tAjouter + 0.3);
  U.viser(tl, id, { x: 620, y: 200, l: 620, h: 300 }, 1.55, tAjouter + 0.2, 0.9);

  // le temps saute : un troisième choix, déjà fait
  const tSaut = Math.min(tAjouter + 1.3, fin - 0.6);
  U.montrer(tl, id, "trois-choix", tSaut, 0.5);
  window.bruit("cartes", tSaut + 0.1, 0.4);
};
