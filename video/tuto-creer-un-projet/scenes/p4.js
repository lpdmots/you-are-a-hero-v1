// Passage 4 — « Il ne reste plus qu'à donner un titre à votre histoire et à sélectionner la classe
// qui participera au projet. Vous pourrez aussi le faire plus tard. » Le titre s'écrit, la carte du
// projet le reprend ; la classe ; « Choisir plus tard » ; « Créer le projet ».
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["titre-vide", "titre-focus", "titre-rempli", "titre-classe", "aide-preparation"]);
  U.reprendre(tl, id, "p3", t0);

  // la caméra recule sur le titre, les classes et la carte du projet
  U.viser(tl, id, { x: 470, y: 225, l: 720, h: 470 }, 1.4, T(0.1), 1.1);

  // le titre : un clic dans le champ, puis la frappe ; la carte du projet suit
  const titre = U.boite("titre-vide", "titre");
  const dansTitre = U.point(titre, 0.12);
  U.aller(tl, id, dansTitre, m("donner") - 0.6, 0.7);
  const tTitre = m("titre") - 0.05;
  U.cliquer(tl, id, dansTitre, tTitre);
  U.montrer(tl, id, "titre-focus", tTitre + 0.08, 0);
  U.cacherCurseur(tl, id, tTitre + 0.25);
  // le champ porte le cadre du focus sur la capture : on n'en dévoile que l'intérieur
  const tFrappe = tTitre + 0.3;
  const dFrappe = 1.4;
  const morceaux = [
    U.taper(tl, id, "titre-rempli", titre, tFrappe, dFrappe, 20, -4, true),
    // le titre de la carte (mesuré sur la capture), sur son texte d'exemple
    U.taper(tl, id, "titre-rempli", { x: 903, y: 388, l: 266, h: 34 }, tFrappe, dFrappe, 20, 0, true),
  ];
  window.BRUITAGES.pop(); // une seule frappe au clavier, pas deux
  const tRempli = tFrappe + dFrappe + 0.1;
  U.montrer(tl, id, "titre-rempli", tRempli, 0);
  U.ranger(tl, morceaux, tRempli + 0.05);

  // la classe qui participera au projet (cochée d'office : seule classe en cours)
  const classe = U.boite("titre-rempli", "laClasse");
  const surClasse = U.point(classe, 0.3);
  U.aller(tl, id, surClasse, Math.max(m("selectionner") - 0.4, tRempli + 0.1), 0.55, true);
  const tClasse = Math.max(m("classe") + 0.1, tRempli + 0.7);
  U.cliquer(tl, id, surClasse, tClasse);
  U.montrer(tl, id, "titre-classe", tClasse + 0.1, 0);
  U.cadre(tl, id, classe, tClasse + 0.1, 1.5);

  // « Vous pourrez aussi le faire plus tard. »
  const plusTard = U.boite("titre-classe", "plusTard");
  U.aller(tl, id, U.point(plusTard, 0.3), m("pourrez") - 0.3, 0.6, true);
  U.cadre(tl, id, plusTard, m("plus", 2) - 0.2, 1.3);

  // « Créer le projet »
  const creer = U.point(U.boite("titre-classe", "creer"));
  U.aller(tl, id, creer, m("tard") + 0.2, 0.6, true);
  const tCreer = m("tard") + 0.9;
  U.cliquer(tl, id, creer, tCreer);
  U.montrer(tl, id, "aide-preparation", tCreer + 0.2, 0.35);
  U.cacherCurseur(tl, id, tCreer + 0.45);
  // la caméra a fini de reculer avant la fin du passage : le suivant reprend ce cadrage, sans saut
  const fin = T(window.dureeDe(id));
  U.plan(tl, id, tCreer + 0.2, Math.min(1.0, fin - 0.05 - (tCreer + 0.2)));
};
