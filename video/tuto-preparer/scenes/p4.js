// Passage 4 — « Au fil des échanges, notez les idées des élèves. Vous pouvez alors les retenir, les
// garder pour en reparler plus tard, ou les écarter. » Une idée s'écrit, les autres suivent ; deux
// retenues, deux laissées à discuter, une écartée.
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const ecrans = ["projection", "idee-champ", "idee-frappee", "idees-1", "idees-2", "idees-3", "idees-4", "idees-5", "retenue-1", "retenue-2", "survol-ecarter", "ecartee"];
  U.feuille(id, ecrans);
  U.reprendre(tl, id, "p3", t0);

  // la liste des idées, qui va s'allonger
  U.viser(tl, id, { x: 60, y: 410, l: 620, h: 360 }, 1.45, T(0.1), 1.1);

  // « Noter une idée », puis la première idée, tapée
  const noter = U.point(U.boite("projection", "noter"), 0.4);
  U.aller(tl, id, noter, m("notez") - 0.7, 0.7);
  const tNoter = m("notez") + 0.1;
  U.cliquer(tl, id, noter, tNoter);
  U.montrer(tl, id, "idee-champ", tNoter + 0.1, 0);
  U.cacherCurseur(tl, id, tNoter + 0.3);
  // le champ porte le cadre du focus sur la capture : on n'en dévoile que l'intérieur
  const tFrappe = tNoter + 0.35;
  const dFrappe = 1.2;
  const champ = U.boite("idee-champ", "champ");
  const morceau = U.taper(tl, id, "idee-frappee", champ, tFrappe, dFrappe, 18, -4);
  // Entrée : l'idée rejoint la liste ; les suivantes arrivent au fil des échanges
  let t = tFrappe + dFrappe + 0.2;
  U.montrer(tl, id, "idees-1", t, 0);
  U.ranger(tl, [morceau], t + 0.05);
  for (const n of [2, 3, 4, 5]) {
    t += 0.5;
    U.montrer(tl, id, `idees-${n}`, t, 0.15);
    window.bruit("clavier", t - 0.35, 0.5);
  }

  // retenir : la coche des deux premières
  const coche = (i) => ({ x: 89, y: 501 + 41 * (i - 1) });
  U.aller(tl, id, coche(1), Math.max(m("retenir") - 0.8, t + 0.2), 0.7);
  const tCoche1 = Math.max(m("retenir") + 0.05, t + 1.0);
  U.cliquer(tl, id, coche(1), tCoche1);
  U.montrer(tl, id, "retenue-1", tCoche1 + 0.1, 0.15);
  U.aller(tl, id, coche(2), tCoche1 + 0.2, 0.3, true);
  const tCoche2 = tCoche1 + 0.6;
  U.cliquer(tl, id, coche(2), tCoche2);
  U.montrer(tl, id, "retenue-2", tCoche2 + 0.1, 0.15);
  U.cacherCurseur(tl, id, tCoche2 + 0.35);

  // les garder pour en reparler plus tard : les deux idées sans coche
  const i3 = U.boite("retenue-2", "idee3");
  U.cadre(tl, id, { x: i3.x, y: i3.y, l: i3.l, h: 80 }, Math.max(m("garder") - 0.1, tCoche2 + 0.3), 1.6, 4);

  // ou les écarter : la souris sur la dernière, « Écarter »
  const ecarter = U.boite("survol-ecarter", "ecarter");
  const surLigne = U.point(U.boite("survol-ecarter", "idee5"), 0.6);
  U.aller(tl, id, surLigne, m("ecarter") - 1.3, 0.6);
  U.montrer(tl, id, "survol-ecarter", m("ecarter") - 0.75, 0.15);
  U.aller(tl, id, U.point(ecarter), m("ecarter") - 0.6, 0.4, true);
  U.cadre(tl, id, ecarter, m("ecarter") - 0.15, 0.6, 3);
  const tEcarter = m("ecarter") + 0.45;
  U.cliquer(tl, id, U.point(ecarter), tEcarter);
  U.montrer(tl, id, "ecartee", tEcarter + 0.1, 0.3);
  U.cacherCurseur(tl, id, tEcarter + 0.4);
  U.cadre(tl, id, U.boite("ecartee", "ecartees"), tEcarter + 0.45, 1.2, 5);
};
