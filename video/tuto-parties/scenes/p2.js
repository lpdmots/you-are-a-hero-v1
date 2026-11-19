// Passage 2 — « Pour commencer, rendez-vous dans « Parties et chapitres ». Vous y retrouvez toutes
// les parties imaginées avec la classe. » La Préparation là où le tuto 3 s'arrête ; le lien de la
// colonne ; l'écran d'aide de la première visite, « Commencer » ; puis les trois parties, la page
// défilant de haut en bas.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["preparation", "aide"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // « Parties et chapitres », dans la colonne
  const lien = U.boite("preparation", "lienPlan");
  U.viser(tl, id, { x: 0, y: 100, l: 700, h: 420 }, 1.7, T(0.9), 1.1);
  U.cadre(tl, id, lien, m("parties") - 0.2, 1.0, 2);
  const pLien = U.point(lien, 0.45);
  U.aller(tl, id, pLien, m("rendez") - 0.3, 0.8);
  const tLien = m("chapitres") + 0.25;
  U.cliquer(tl, id, pLien, tLien);
  U.montrer(tl, id, "aide", tLien + 0.15, 0.3);

  // l'écran d'aide, à la première visite : « Commencer »
  U.viser(tl, id, { x: 480, y: 70, l: 680, h: 650 }, 1.25, tLien + 0.3, 1.0);
  const commencer = U.boite("aide", "commencer");
  const pCommencer = U.point(commencer);
  U.aller(tl, id, pCommencer, tLien + 0.6, 0.9, true);
  U.cadre(tl, id, commencer, tLien + 1.3, 0.8, 4);
  const tCommencer = tLien + 2.0;
  U.cliquer(tl, id, pCommencer, tCommencer);
  U.cacherCurseur(tl, id, tCommencer + 0.4);

  // les trois parties, un chapitre chacune : la page entière, qui défile de haut en bas
  const plan = U.page(tl, id, "plan", 232, 0, tCommencer + 0.15);
  plan.montrer(tCommencer + 0.15, 0.3);
  U.plan(tl, id, tCommencer + 0.3, 1.0);
  const tDefile = Math.max(m("retrouvez") + 0.2, tCommencer + 1.4);
  plan.aller(931, tDefile, Math.min(3.2, fin - tDefile - 0.1), "sine.inOut");
};
