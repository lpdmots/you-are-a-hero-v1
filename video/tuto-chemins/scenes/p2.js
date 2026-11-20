// Passage 2 — « Pour commencer, ouvrez un chapitre et cliquez sur « Ajouter une scène » : vous
// voilà dans « Chemins », avec la première carte de votre chapitre ! Cliquez dessus pour lui donner
// un titre. » « Parties et chapitres » tel que le tuto 4 le laisse ; « Le vieux coffre » ; le
// chapitre vide ; la première carte, « Chemins » ; le panneau de la scène, son titre ; retour au plan.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["plan", "chapitre-vide", "premiere-carte", "panneau", "panneau-titre-focus", "panneau-titre", "premiere-carte-titree"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // « Le vieux coffre », dans « Le village des racines »
  const coffre = U.boite("plan", "coffre");
  U.viser(tl, id, { x: 240, y: 120, l: 900, h: 520 }, 1.4, T(0.9), 1.1);
  U.cadre(tl, id, coffre, m("ouvrez") - 0.1, 1.2, 6);
  const pCoffre = U.point(coffre, 0.5, 0.35);
  U.aller(tl, id, pCoffre, m("ouvrez") + 0.1, 0.8);
  const tCoffre = Math.max(m("chapitre") + 0.1, m("ouvrez") + 1.1);
  U.cliquer(tl, id, pCoffre, tCoffre);
  U.montrer(tl, id, "chapitre-vide", tCoffre + 0.15, 0.25);

  // le chapitre vide : « Ajouter une scène »
  const aj = U.boite("chapitre-vide", "ajouterScene");
  U.viser(tl, id, { x: 250, y: 40, l: 900, h: 420 }, 1.5, tCoffre + 0.3, 0.9);
  const pAj = U.point(aj);
  U.aller(tl, id, pAj, tCoffre + 0.5, 0.7, true);
  const tCadreAj = Math.max(m("cliquez") - 0.1, tCoffre + 0.9);
  U.cadre(tl, id, aj, tCadreAj, 1.0, 5);
  const tAj = Math.max(m("scene") + 0.15, tCadreAj + 0.9);
  U.cliquer(tl, id, pAj, tAj);
  U.montrer(tl, id, "premiere-carte", tAj + 0.15, 0.3);
  window.bruit("cartes", tAj + 0.2, 0.6);
  U.cacherCurseur(tl, id, tAj + 0.4);
  // « Chemins », la bascule qui paraît avec la première carte, puis la carte
  U.viser(tl, id, { x: 400, y: 40, l: 900, h: 330 }, 1.45, tAj + 0.3, 1.0);
  const bascule = { x: 1092, y: 73, l: 107, h: 37 }; // mesurée sur la capture premiere-carte
  U.cadre(tl, id, bascule, Math.max(m("chemins") - 0.1, tAj + 0.8), 1.0, 4);
  const carte = U.boite("premiere-carte", "carte");
  U.cadre(tl, id, carte, Math.max(m("carte") - 0.2, tAj + 1.9), 1.3, 6);

  // « Cliquez dessus » : l'espace de travail s'ouvre, la colonne se replie
  const pCarte = U.point(carte, 0.4, 0.45);
  U.aller(tl, id, pCarte, m("dessus") - 0.9, 0.7);
  const tCarte = m("dessus") + 0.1;
  U.cliquer(tl, id, pCarte, tCarte);
  U.montrer(tl, id, "panneau", tCarte + 0.15, 0.25);
  U.viser(tl, id, { x: 300, y: 190, l: 1120, h: 400 }, 1.25, tCarte + 0.2, 1.0);
  // le titre, dans le panneau
  const titre = U.boite("panneau", "titre");
  const pTitre = U.point(titre, 0.3);
  U.aller(tl, id, pTitre, tCarte + 0.6, 0.7, true);
  const tTitre = Math.max(m("titre") - 0.3, tCarte + 1.4);
  U.cliquer(tl, id, pTitre, tTitre);
  U.montrer(tl, id, "panneau-titre-focus", tTitre + 0.1, 0);
  U.cacherCurseur(tl, id, tTitre + 0.3);
  const dTitre = 1.1;
  const mTitre = U.taper(tl, id, "panneau-titre", titre, tTitre + 0.3, dTitre, 19, -4);
  // la carte prend le titre avec la dernière lettre
  U.montrer(tl, id, "panneau-titre", tTitre + 0.3 + dTitre + 0.05, 0);
  U.ranger(tl, [mTitre], tTitre + 0.3 + dTitre + 0.1);

  // la croix du panneau : retour au plan
  const croix = { x: 1386, y: 200, l: 22, h: 22 }; // mesurée sur la capture panneau
  const pCroix = U.point(croix);
  const tFin = tTitre + 0.3 + dTitre + 0.2;
  U.aller(tl, id, pCroix, tFin, 0.6, true);
  const tCroix = Math.min(tFin + 0.8, fin - 0.6);
  U.cliquer(tl, id, pCroix, tCroix);
  U.montrer(tl, id, "premiere-carte-titree", tCroix + 0.15, 0.25);
  U.cacherCurseur(tl, id, tCroix + 0.3);
  U.viser(tl, id, { x: 560, y: 150, l: 560, h: 450 }, 1.6, tCroix + 0.2, Math.min(1.0, fin - tCroix - 0.25));
};
