// Passage 5 — « Une fois votre relecture terminée, cliquez sur « J'ai relu le livre ». » La scène se
// ferme, la fiche « Relire » revient ; « J'ai relu le livre » : « Livre relu. »
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["apercu-corrige", "survol-fermer", "fiche-revenue", "survol-declarer", "relu"]);
  U.reprendre(tl, id, "p4", t0);

  // « Fermer » : la scène se referme, la fiche revient
  U.viser(tl, id, { x: 250, y: 0, l: 1170, h: 790 }, 1.3, T(0.0), 0.8);
  const fermer = U.boite("apercu-corrige", "fermer");
  const pFermer = U.point(fermer, 0.5);
  U.aller(tl, id, pFermer, T(0.3), 0.6);
  U.montrer(tl, id, "survol-fermer", T(0.85), 0.1);
  const tFermer = Math.max(m("terminee") - 0.1, T(1.1));
  U.cliquer(tl, id, pFermer, tFermer);
  U.montrer(tl, id, "fiche-revenue", tFermer + 0.15, 0.35);

  // « J'ai relu le livre »
  U.viser(tl, id, { x: 256, y: 30, l: 385, h: 560 }, 1.65, tFermer + 0.3, 0.9);
  const declarer = U.boite("fiche-revenue", "declarer");
  const pDeclarer = U.point(declarer, 0.45);
  U.aller(tl, id, pDeclarer, Math.max(m("cliquez") - 0.3, tFermer + 0.5), 0.6, true);
  U.montrer(tl, id, "survol-declarer", Math.max(m("cliquez") + 0.25, tFermer + 1.05), 0.1);
  U.cadre(tl, id, declarer, Math.max(m("relu") - 0.3, tFermer + 1.1), 0.9, 5);
  const tDeclarer = Math.max(m("livre") + 0.35, tFermer + 1.6);
  U.cliquer(tl, id, pDeclarer, tDeclarer);
  U.montrer(tl, id, "relu", tDeclarer + 0.15, 0.3);
  U.cacherCurseur(tl, id, tDeclarer + 0.4);
  // « Livre relu. », et les quatre tâches cochées
  U.cadre(tl, id, U.boite("relu", "ok"), tDeclarer + 0.5, Math.min(1.3, fin - tDeclarer - 0.5), 5);
  U.cadre(tl, id, U.boite("relu", "lire"), tDeclarer + 0.5, Math.min(1.3, fin - tDeclarer - 0.5), 4);
};
