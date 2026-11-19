// Passage 2 — « Pour commencer, rendez-vous dans « Mes projets » et cliquez sur « Créer mon
// premier projet ». Trois petites questions, et c'est parti ! » Depuis la classe du tuto 1,
// « Mes projets » dans la colonne ; « Mes projets » vide, « Créer mon premier projet » ;
// « Nouveau projet » et sa ligne de trois étapes.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["classe", "mes-projets-vide", "qui-ecrit"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // « Mes projets », dans la colonne de gauche
  const mesProjets = U.boite("classe", "mesProjets");
  const lien = U.point(mesProjets, 0.35);
  U.aller(tl, id, lien, m("mes") - 0.7, 0.8);
  U.cadre(tl, id, mesProjets, m("mes") - 0.15, 0.6, 4);
  const tLien = m("projets") + 0.25;
  U.cliquer(tl, id, lien, tLien);
  U.montrer(tl, id, "mes-projets-vide", tLien + 0.15, 0.3);

  // « Créer mon premier projet »
  const creer = U.boite("mes-projets-vide", "creer");
  U.aller(tl, id, U.point(creer, 0.4), Math.max(m("cliquez") - 0.3, tLien + 0.4), 0.7, true);
  U.cadre(tl, id, creer, m("creer") - 0.15, 0.9, 5);
  const tCreer = m("premier") + 0.45;
  U.cliquer(tl, id, U.point(creer, 0.4), tCreer);
  U.montrer(tl, id, "qui-ecrit", tCreer + 0.15, 0.3);
  U.cacherCurseur(tl, id, tCreer + 0.45);

  // trois petites questions : la ligne des étapes
  const etapes = U.boite("qui-ecrit", "etapes");
  U.viser(tl, id, etapes, 1.7, Math.max(m("trois") - 0.5, tCreer + 0.3), 1.0);
  U.cadre(tl, id, etapes, m("trois") + 0.2, 1.8, 8);
};
