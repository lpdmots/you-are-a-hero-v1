// Passage 3 — « Dans les réglages, choisissez la police, la taille du texte et son alignement. Juste à
// côté, un aperçu miniature du livre vous permet de voir le résultat. » « Texte et pages » : la police,
// la taille du texte (on choisit « Grande »), l'alignement du récit ; puis « Le livre en petit », qui
// se recompose avec le texte plus grand.
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["reglages", "survol-grande", "grande", "grande-petit"]);
  U.reprendre(tl, id, "p2", t0);

  // « Texte et pages » : la police, la taille, l'alignement
  U.viser(tl, id, { x: 270, y: 300, l: 600, h: 480 }, 1.9, Math.max(T(0.0), m("reglages") - 0.5), 0.9);
  U.cadre(tl, id, U.boite("reglages", "groupePolice"), m("police") - 0.15, 0.9, 6);
  const grande = U.boite("reglages", "grande");
  const pGrande = U.point(grande, 0.5);
  U.cadre(tl, id, U.boite("reglages", "groupeTaille"), m("taille") - 0.15, 0.8, 6);
  U.aller(tl, id, pGrande, m("taille") - 0.2, 0.6);
  U.montrer(tl, id, "survol-grande", m("taille") + 0.4, 0.1);
  const tGrande = m("texte") + 0.2;
  U.cliquer(tl, id, pGrande, tGrande);
  U.montrer(tl, id, "grande", tGrande + 0.12, 0.15);
  U.cacherCurseur(tl, id, tGrande + 0.4);
  U.cadre(tl, id, U.boite("grande", "groupeAlignement"), Math.max(m("alignement") - 0.1, tGrande + 0.3), 1.2, 6);

  // « Juste à côté » : le livre en petit, qui se recompose
  const petit = U.boite("grande", "petit");
  U.viser(tl, id, petit, 2.4, m("juste") - 0.2, 1.0);
  U.cadre(tl, id, petit, m("miniature") - 0.2, 1.4, 6);
  const tResultat = m("voir") - 0.2;
  U.montrer(tl, id, "grande-petit", tResultat, 0.5);
  // la page du récit, mesurée sur la capture : le texte plus grand, un choix passé à la page suivante
  U.cadre(tl, id, { x: 1218, y: 277, l: 172, h: 238 }, m("resultat") + 0.1, Math.min(1.6, fin - m("resultat") - 0.2), 4);
};
