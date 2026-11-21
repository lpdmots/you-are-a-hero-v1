// Passage 5 — « Et pourquoi ne pas aller plus loin ? Vous pouvez aussi proposer votre livre à la
// bibliothèque du site, pour que d'autres classes puissent le découvrir à leur tour ! » La page remonte
// à « Public, la bibliothèque du site » ; « Proposer à la bibliothèque… » ; la présentation tapée
// ligne après ligne ; la page descend ; l'autorisation cochée ; « Proposer le livre » ; « En attente
// de relecture ».
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["copie", "haut", "survol-proposer", "proposer", "presentation", "presentation-bas", "survol-atteste", "atteste", "survol-proposer-livre", "propose"]);
  U.reprendre(tl, id, "p4", t0);

  // la page remonte jusqu'à la bibliothèque, sous la barre des volets
  const y0 = U.fichier("copie").boites._fenetre.y;
  const volets = U.boite("haut", "volets");
  const monter = U.colle(tl, id, "partager-lien-page", 232, y0, [{ de: "haut", b: volets, k: volets.y }]);
  U.viser(tl, id, { x: 256, y: 150, l: 1150, h: 640 }, 1.2, T(0.0), 0.7);
  monter.montrer(T(0.3));
  monter.aller(0, T(0.3), 1.1);
  U.montrer(tl, id, "haut", T(1.4), 0.001);
  monter.cacher(T(1.45));
  U.viser(tl, id, { x: 256, y: 290, l: 760, h: 310 }, 1.7, T(1.2), 0.9);

  // « Proposer à la bibliothèque… »
  const proposer = U.boite("haut", "proposer");
  const pProposer = U.point(proposer, 0.5);
  U.cadre(tl, id, U.boite("haut", "public"), Math.max(T(2.0), m("loin") - 0.1), 0.9, 6);
  U.aller(tl, id, pProposer, m("vous") - 0.2, 0.6);
  U.montrer(tl, id, "survol-proposer", m("vous") + 0.35, 0.1);
  U.cadre(tl, id, proposer, m("proposer") - 0.15, 1.0, 5);
  const tProposer = m("bibliotheque") + 0.25;
  U.cliquer(tl, id, pProposer, tProposer);
  U.montrer(tl, id, "proposer", tProposer + 0.12, 0.25);
  U.cacherCurseur(tl, id, tProposer + 0.35);

  // la présentation, ligne après ligne (lignes mesurées sur les captures)
  U.viser(tl, id, { x: 280, y: 400, l: 620, h: 260 }, 1.9, tProposer + 0.2, 0.7);
  const tTape = tProposer + 0.75;
  const l1 = U.taper(tl, id, "presentation", { x: 300, y: 522, l: 488, h: 22 }, tTape, 0.95, 16, 0, true);
  const l2 = U.taper(tl, id, "presentation", { x: 300, y: 545, l: 382, h: 20 }, tTape + 1.0, 0.75, 13, 0);
  U.montrer(tl, id, "presentation", tTape + 1.8, 0.001);
  U.ranger(tl, [l1, l2], tTape + 1.85);

  // la page descend : l'autorisation et « Proposer le livre »
  const yBas = U.fichier("presentation-bas").boites._fenetre.y;
  const descendre = U.colle(tl, id, "presentation-page", 232, 0, [{ de: "presentation", b: U.boite("presentation", "volets"), k: U.boite("presentation", "volets").y }]);
  const tDescente = tTape + 1.9;
  descendre.montrer(tDescente);
  descendre.aller(yBas, tDescente, 0.8);
  U.montrer(tl, id, "presentation-bas", tDescente + 0.8, 0.001);
  descendre.cacher(tDescente + 0.85);
  U.viser(tl, id, { x: 280, y: 220, l: 620, h: 370 }, 1.7, tDescente, 0.8);

  const atteste = U.boite("presentation-bas", "atteste");
  const pAtteste = { x: atteste.x + 22, y: atteste.y + 23 };
  U.aller(tl, id, pAtteste, tDescente + 0.5, 0.45);
  U.montrer(tl, id, "survol-atteste", tDescente + 0.9, 0.1);
  const tAtteste = tDescente + 1.05;
  U.cliquer(tl, id, pAtteste, tAtteste);
  U.montrer(tl, id, "atteste", tAtteste + 0.08, 0.1);
  const livre = U.boite("presentation-bas", "proposerLivre");
  const pLivre = U.point(livre, 0.5);
  U.aller(tl, id, pLivre, tAtteste + 0.25, 0.45, true);
  U.montrer(tl, id, "survol-proposer-livre", tAtteste + 0.6, 0.1);
  U.cadre(tl, id, livre, tAtteste + 0.5, 0.5, 4);
  const tLivre = tAtteste + 0.95;
  U.cliquer(tl, id, pLivre, tLivre);
  // le formulaire se ferme : fondu court, puis la caméra recule sur « En attente de relecture »
  U.montrer(tl, id, "propose", tLivre + 0.12, 0.25);
  U.cacherCurseur(tl, id, tLivre + 0.3);
  U.viser(tl, id, { x: 256, y: 40, l: 900, h: 420 }, 1.5, tLivre + 0.35, 0.7);
  U.cadre(tl, id, U.boite("propose", "attente"), tLivre + 0.9, Math.max(0.6, Math.min(1.4, fin - tLivre - 1.2)), 5);
};
