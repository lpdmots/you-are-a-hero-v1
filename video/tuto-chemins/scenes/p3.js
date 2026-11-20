// Passage 3 — « Pour créer un choix, cliquez sur le « + » de la carte. Indiquez ce que le lecteur
// peut faire, puis donnez un titre à la scène suivante. » Le « + » de « Le grenier de Timéo » ; la
// bulle ; « Ouvrir le coffre » ; « La carte qui brille » (le champ porte d'abord l'action,
// sélectionnée) ; « Ajouter » : l'onglet, le trait, la nouvelle carte.
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["premiere-carte-titree", "choix1-survol", "choix1-bulle", "choix1-action", "choix1-titre-focus", "choix1-titre", "choix1-ajoute"]);
  U.reprendre(tl, id, "p2", t0);

  // le « + », au bord de la carte
  const plus = U.boite("choix1-survol", "plus");
  const pPlus = U.point(plus);
  U.viser(tl, id, { x: 700, y: 200, l: 380, h: 410 }, 1.75, T(0.2), 1.0);
  U.aller(tl, id, pPlus, Math.max(T(0.4), m("cliquez") - 0.4), 0.7);
  U.montrer(tl, id, "choix1-survol", Math.max(T(1.1), m("cliquez") + 0.3), 0.2);
  U.cadre(tl, id, plus, Math.max(T(1.0), m("cliquez") + 0.2), 1.0, 6);
  const tPlus = Math.max(m("carte") + 0.1, T(2.2));
  U.cliquer(tl, id, pPlus, tPlus);
  U.montrer(tl, id, "choix1-bulle", tPlus + 0.12, 0.2);
  U.cacherCurseur(tl, id, tPlus + 0.4);

  // « Ce que fait le lecteur » : « Ouvrir le coffre » (la ligne « Juste la suite » part à la
  // première lettre, comme dans l'application)
  const action = U.boite("choix1-action", "action");
  const tAction = Math.max(m("indiquez"), tPlus + 0.7);
  const dAction = 1.0;
  U.montrer(tl, id, "choix1-action", tAction, 0);
  const mAction = U.taper(tl, id, "choix1-action", action, tAction, dAction, 16, -4, true);
  U.ranger(tl, [mAction], tAction + dAction + 0.1);

  // « Nouvelle scène » : l'action y est déjà, sélectionnée ; le titre la remplace
  const suite = U.boite("choix1-titre-focus", "suite");
  const pSuite = U.point(suite, 0.35);
  U.aller(tl, id, pSuite, tAction + dAction + 0.05, 0.5, null);
  const tSuite = Math.max(m("titre") - 0.2, tAction + dAction + 0.6);
  U.cliquer(tl, id, pSuite, tSuite);
  U.montrer(tl, id, "choix1-titre-focus", tSuite + 0.1, 0);
  U.cacherCurseur(tl, id, tSuite + 0.3);
  const dSuite = 1.0;
  const mSuite = U.taper(tl, id, "choix1-titre", suite, tSuite + 0.45, dSuite, 19, -4, true);
  U.montrer(tl, id, "choix1-titre", tSuite + 0.45 + dSuite + 0.05, 0);
  U.ranger(tl, [mSuite], tSuite + 0.45 + dSuite + 0.1);

  // « Ajouter » : l'onglet sous la carte, le trait, la nouvelle carte
  const ajouter = U.boite("choix1-titre", "ajouter");
  const pAjouter = U.point(ajouter);
  const tVers = tSuite + 0.45 + dSuite + 0.2;
  U.aller(tl, id, pAjouter, tVers, 0.5, true);
  const tAjouter = Math.min(tVers + 0.7, fin - 0.6);
  U.cliquer(tl, id, pAjouter, tAjouter);
  U.montrer(tl, id, "choix1-ajoute", tAjouter + 0.15, 0.3);
  window.bruit("cartes", tAjouter + 0.2, 0.6);
  U.cacherCurseur(tl, id, tAjouter + 0.3);
  U.viser(tl, id, { x: 640, y: 200, l: 420, h: 280 }, 1.9, tAjouter + 0.25, Math.min(0.9, fin - tAjouter - 0.3));
};
