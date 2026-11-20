// Passage 5 — « Vous pouvez ensuite tester votre histoire en suivant les différents choix, comme un
// véritable lecteur. Une fois les vérifications terminées, cliquez sur « J'ai vérifié les chemins ». »
// « Continuer » : « Tester la lecture » ; la lecture d'essai : « Commencer au départ », deux choix
// suivis (le grenier, le coffre), « Quitter » ; de retour au Livre, « J'ai vérifié les chemins ».
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "voulu", "survol-continuer-essai", "essai", "survol-tester", "par-ou", "survol-commencer", "lecture-1", "survol-grenier",
    "lecture-2", "survol-coffre", "lecture-3", "survol-quitter", "retour-livre", "survol-declarer", "verifie",
  ]);
  U.reprendre(tl, id, "p4", t0);

  // « Continuer » : la dernière tâche, « Tester la lecture »
  U.viser(tl, id, { x: 256, y: 12, l: 385, h: 440 }, 1.85, T(0.0), 0.7);
  const continuer = U.boite("voulu", "continuer");
  const pContinuer = U.point(continuer, 0.4);
  U.aller(tl, id, pContinuer, T(0.1), 0.6);
  U.montrer(tl, id, "survol-continuer-essai", T(0.65), 0.1);
  const tEssai = Math.max(m("tester") - 0.4, T(0.9));
  U.cliquer(tl, id, pContinuer, tEssai);
  U.montrer(tl, id, "essai", tEssai + 0.15, 0.2);
  // « Tester la lecture »
  const tester = U.boite("essai", "tester");
  const pTester = U.point(tester, 0.5);
  U.aller(tl, id, pTester, tEssai + 0.3, 0.5, true);
  U.montrer(tl, id, "survol-tester", tEssai + 0.8, 0.1);
  U.cadre(tl, id, tester, tEssai + 0.8, 0.6, 4);
  const tTester = Math.max(m("histoire") + 0.1, tEssai + 1.2);
  U.cliquer(tl, id, pTester, tTester);
  U.cacherCurseur(tl, id, tTester + 0.3);
  // la lecture d'essai : « Par où commencer ? »
  U.montrer(tl, id, "par-ou", tTester + 0.2, 0.25);
  U.viser(tl, id, { x: 250, y: 20, l: 1000, h: 560 }, 1.35, tTester + 0.4, 0.7);
  const commencer = U.boite("par-ou", "commencer");
  const pCommencer = U.point(commencer, 0.5);
  U.aller(tl, id, pCommencer, tTester + 0.6, 0.5);
  U.montrer(tl, id, "survol-commencer", tTester + 1.1, 0.1);
  const tCommencer = tTester + 1.3;
  U.cliquer(tl, id, pCommencer, tCommencer);
  U.cacherCurseur(tl, id, tCommencer + 0.3);
  // le premier passage, ses choix ; on suit « Monter au grenier », puis « Ouvrir le coffre »
  U.montrer(tl, id, "lecture-1", tCommencer + 0.2, 0.25);
  U.viser(tl, id, { x: 300, y: 300, l: 740, h: 500 }, 1.55, tCommencer + 0.3, 0.8);
  const grenier = U.boite("lecture-1", "grenier");
  const pGrenier = U.point(grenier, 0.3);
  U.aller(tl, id, pGrenier, tCommencer + 0.8, 0.5);
  U.montrer(tl, id, "survol-grenier", tCommencer + 1.3, 0.1);
  const tGrenier = tCommencer + 1.55;
  U.cliquer(tl, id, pGrenier, tGrenier);
  U.montrer(tl, id, "lecture-2", tGrenier + 0.15, 0.25);
  const coffre = U.boite("lecture-2", "coffre");
  const pCoffre = U.point(coffre, 0.3);
  U.aller(tl, id, pCoffre, tGrenier + 0.6, 0.4, true);
  U.montrer(tl, id, "survol-coffre", tGrenier + 1.0, 0.1);
  const tCoffre = tGrenier + 1.3;
  U.cliquer(tl, id, pCoffre, tCoffre);
  U.montrer(tl, id, "lecture-3", tCoffre + 0.15, 0.25);
  U.cacherCurseur(tl, id, tCoffre + 0.35);
  // « Quitter », en haut à droite : la caméra recule d'abord
  U.plan(tl, id, tCoffre + 0.6, 0.8);
  const quitter = U.boite("lecture-3", "quitter");
  const pQuitter = U.point(quitter, 0.4);
  U.aller(tl, id, pQuitter, tCoffre + 1.0, 0.5);
  U.montrer(tl, id, "survol-quitter", tCoffre + 1.5, 0.1);
  const tQuitter = tCoffre + 1.75;
  U.cliquer(tl, id, pQuitter, tQuitter);
  U.cacherCurseur(tl, id, tQuitter + 0.3);
  U.montrer(tl, id, "retour-livre", tQuitter + 0.2, 0.25);

  // de retour au Livre : « J'ai vérifié les chemins »
  U.viser(tl, id, { x: 256, y: 176, l: 385, h: 480 }, 1.65, Math.max(tQuitter + 0.4, m("une") - 0.3), 0.9);
  const declarer = U.boite("retour-livre", "declarer");
  const pDeclarer = U.point(declarer, 0.45);
  U.aller(tl, id, pDeclarer, Math.max(m("cliquez") - 0.4, tQuitter + 1.0), 0.6);
  U.montrer(tl, id, "survol-declarer", Math.max(m("cliquez") + 0.15, tQuitter + 1.55), 0.1);
  U.cadre(tl, id, declarer, Math.max(m("verifie") - 0.2, tQuitter + 1.6), 0.9, 5);
  const tDeclarer = m("chemins") + 0.4;
  U.cliquer(tl, id, pDeclarer, tDeclarer);
  U.montrer(tl, id, "verifie", tDeclarer + 0.15, 0.3);
  U.cacherCurseur(tl, id, tDeclarer + 0.4);
  // « Chemins vérifiés. », et la dernière tâche cochée
  U.cadre(tl, id, U.boite("verifie", "ok"), tDeclarer + 0.5, Math.min(1.2, fin - tDeclarer - 0.5), 4);
  U.cadre(tl, id, U.boite("verifie", "essai"), tDeclarer + 0.5, Math.min(1.2, fin - tDeclarer - 0.5), 4);
};
