// Passage 4 — « Pour que les familles puissent aussi profiter du livre, cliquez sur « Créer le lien »,
// puis transmettez-le simplement par le moyen de votre choix. » L'interrupteur « Lien pour les
// familles », la case, « Créer le lien » ; le lien prêt ; « Copier le lien ».
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["classes", "survol-lien", "rappel-lien", "survol-relu-lien", "relu-lien", "survol-confirmer-lien", "lien", "survol-copier", "copie"]);
  U.reprendre(tl, id, "p3", t0);

  // l'interrupteur « Lien pour les familles »
  const inter = U.boite("survol-lien", "interLien");
  const pInter = U.point(inter, 0.16);
  U.aller(tl, id, pInter, T(0.2), 0.6);
  U.montrer(tl, id, "survol-lien", Math.max(T(0.8), m("familles") - 0.1), 0.15);
  U.cadre(tl, id, U.boite("survol-lien", "canalLien"), m("familles") - 0.1, 0.9, 6);
  const tInter = m("familles") + 0.7;
  U.cliquer(tl, id, pInter, tInter);
  U.montrer(tl, id, "rappel-lien", tInter + 0.12, 0.2);
  // la case, puis « Créer le lien »
  const relu = U.boite("rappel-lien", "relu");
  const pRelu = { x: relu.x + 22, y: relu.y + relu.h / 2 };
  U.aller(tl, id, pRelu, tInter + 0.35, 0.45, true);
  U.montrer(tl, id, "survol-relu-lien", tInter + 0.75, 0.1);
  const tRelu = tInter + 0.95;
  U.cliquer(tl, id, pRelu, tRelu);
  U.montrer(tl, id, "relu-lien", tRelu + 0.08, 0.1);
  const confirmer = U.boite("rappel-lien", "confirmer");
  const pConfirmer = U.point(confirmer, 0.5);
  U.aller(tl, id, pConfirmer, Math.max(tRelu + 0.3, m("cliquez") - 0.4), 0.45, true);
  U.montrer(tl, id, "survol-confirmer-lien", Math.max(tRelu + 0.7, m("cliquez") + 0.05), 0.1);
  U.cadre(tl, id, confirmer, m("creer") - 0.15, 0.9, 5);
  const tCreer = m("lien") + 0.2;
  U.cliquer(tl, id, pConfirmer, tCreer);
  U.montrer(tl, id, "lien", tCreer + 0.12, 0.25);
  U.cacherCurseur(tl, id, tCreer + 0.35);

  // le lien prêt, puis « Copier le lien »
  U.cadre(tl, id, U.boite("lien", "adresse"), Math.max(m("puis") - 0.1, tCreer + 0.4), 1.1, 5);
  const copier = U.boite("lien", "copier");
  const pCopier = U.point(copier, 0.5);
  U.aller(tl, id, pCopier, m("transmettez") + 0.1, 0.55);
  U.montrer(tl, id, "survol-copier", m("simplement") - 0.1, 0.1);
  U.cadre(tl, id, copier, m("simplement"), 0.9, 4);
  const tCopier = m("simplement") + 0.6;
  U.cliquer(tl, id, pCopier, tCopier);
  U.montrer(tl, id, "copie", tCopier + 0.1, 0.15);
  U.cacherCurseur(tl, id, Math.min(tCopier + 0.9, fin - 0.3));
};
