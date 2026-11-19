// Passage 3 — « Il ne reste plus qu'à ajouter vos élèves, un prénom par ligne. Vous pouvez aussi
// coller directement votre liste. Chacun reçoit alors un code à quatre chiffres. »
// « Inscrire des élèves », trois prénoms tapés, la liste collée ; la page défile jusqu'à
// « Continuer » ; « Vérifiez la liste », « Inscrire 24 élèves » ; puis « Afficher les codes ».
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["classe-creee", "inscrire-vide", "inscrire-liste-collee", "inscrire-confirmer", "classe-eleves", "classe-codes"]);
  U.reprendre(tl, id, "p2", t0);

  const inscrire = U.point(U.boite("classe-creee", "inscrire"));
  U.aller(tl, id, inscrire, m("ajouter") - 0.6, 0.7);
  U.cliquer(tl, id, inscrire, m("ajouter") + 0.3);
  U.montrer(tl, id, "inscrire-vide", m("ajouter") + 0.45, 0.3);
  U.viser(tl, id, { x: 470, y: 290, l: 560, h: 260 }, 1.7, m("ajouter") + 0.55, 1.1);

  // un prénom par ligne
  const l1 = U.boite("inscrire-vide", "ligne1");
  U.aller(tl, id, U.point(l1, 0.2), m("prenom") - 0.35, 0.45, true);
  U.cliquer(tl, id, U.point(l1, 0.2), m("prenom") + 0.15);
  // la troisième ligne a le cadre vert du champ actif sur la capture : on n'en dévoile que
  // l'intérieur (marge négative), le cadre qui se dessinerait par à-coups serait laid
  const morceaux = [0, 1, 2].map((i) => U.taper(tl, id, "inscrire-trois", { ...l1, y: l1.y + i * 50 }, m("prenom") + 0.3 + i * 0.7, 0.5, 5, i === 2 ? -4 : 3));
  U.cacherCurseur(tl, id, m("prenom") + 2.0);

  // la liste collée remplit les lignes d'un coup ; la caméra recule pour la voir
  U.montrer(tl, id, "inscrire-liste-collee", m("coller") + 0.05, 0.15);
  U.ranger(tl, morceaux, m("coller") + 0.2);
  U.viser(tl, id, { x: 440, y: 250, l: 620, h: 560 }, 1.3, m("coller"), 0.9);

  // la page défile jusqu'à « Continuer » (la colonne de gauche, 232 points mesurés, reste en place)
  const tDefile = m("liste") + 0.35;
  const defile = U.defiler(tl, id, "inscrire-liste-entiere", 232, tDefile, 1.3);
  U.viser(tl, id, { x: 520, y: 330, l: 700, h: 420 }, 1.25, tDefile, 1.3);
  const c = U.boite("inscrire-liste-entiere", "continuer");
  const continuer = U.point({ ...c, y: c.y - defile.dy });
  U.aller(tl, id, continuer, tDefile + 1.0, 0.6, true);
  const tContinuer = tDefile + 1.75;
  U.cliquer(tl, id, continuer, tContinuer);

  // « Vérifiez la liste » : on inscrit les 24 élèves
  U.montrer(tl, id, "inscrire-confirmer", tContinuer + 0.15, 0);
  tl.set(defile.sel, { opacity: 0 }, tContinuer + 0.15);
  const confirmer = U.point(U.boite("inscrire-confirmer", "confirmer"));
  U.aller(tl, id, confirmer, tContinuer + 0.45, 0.4, true);
  const tConfirmer = Math.max(m("chacun") - 0.2, tContinuer + 1.2);
  U.cliquer(tl, id, confirmer, tConfirmer);
  U.montrer(tl, id, "classe-eleves", tConfirmer + 0.15, 0.3);
  U.plan(tl, id, tConfirmer + 0.2, 0.8);

  // chacun a son code
  const afficher = U.point(U.boite("classe-eleves", "afficher"));
  const tCodes = Math.max(m("code") - 0.1, tConfirmer + 1.0);
  U.aller(tl, id, afficher, tCodes - 0.65, 0.5, true);
  U.cliquer(tl, id, afficher, tCodes);
  U.montrer(tl, id, "classe-codes", tCodes + 0.15, 0.25);
  U.cacherCurseur(tl, id, tCodes + 0.5);
  U.viser(tl, id, { x: 256, y: 200, l: 749, h: 330 }, 1.6, tCodes + 0.2, 1.0);
  U.cadre(tl, id, U.boite("classe-codes", "premiere"), Math.max(m("quatre") - 0.1, tCodes + 0.9), 1.3);
};
