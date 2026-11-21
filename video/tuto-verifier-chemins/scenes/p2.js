// Passage 2 — « Pour commencer, rendez-vous dans « Livre », puis dans « Vérifier les chemins ».
// L'application analyse automatiquement le départ, les fins et tous les choix de votre histoire. »
// « Livre » dans la colonne : le Livre se rouvre sur « Relire » (« Livre relu. ») ; l'étape
// « Vérifier les chemins » ; ses quatre tâches ; « Départ et fins », déjà en place ; les choix.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["plan", "survol-livre", "livre", "survol-verifier", "chemins", "survol-depart", "depart-fins"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // « Livre », dans la colonne
  U.viser(tl, id, { x: 0, y: 40, l: 1000, h: 560 }, 1.35, T(0.6), 0.9);
  const livre = U.boite("plan", "livre");
  const pLivre = U.point(livre, 0.3);
  U.aller(tl, id, pLivre, m("rendez") - 0.3, 0.6);
  U.montrer(tl, id, "survol-livre", m("rendez") + 0.25, 0.15);
  U.cadre(tl, id, livre, m("livre") - 0.3, 0.8, 5);
  const tLivre = m("livre") + 0.3;
  U.cliquer(tl, id, pLivre, tLivre);
  U.montrer(tl, id, "livre", tLivre + 0.15, 0.3);

  // l'étape « Vérifier les chemins »
  U.viser(tl, id, { x: 0, y: 40, l: 1100, h: 600 }, 1.34, tLivre + 0.2, 0.7);
  const verifier = U.boite("livre", "verifier");
  const pVerifier = U.point(verifier, 0.5);
  U.aller(tl, id, pVerifier, tLivre + 0.3, 0.6, true);
  U.montrer(tl, id, "survol-verifier", tLivre + 0.85, 0.1);
  U.cadre(tl, id, verifier, Math.max(m("verifier") - 0.2, tLivre + 0.8), 0.9, 5);
  const tVerifier = Math.max(m("chemins") + 0.3, tLivre + 1.3);
  U.cliquer(tl, id, pVerifier, tVerifier);
  U.montrer(tl, id, "chemins", tVerifier + 0.15, 0.15);
  U.cacherCurseur(tl, id, tVerifier + 0.35);

  // la fiche : quatre tâches, l'analyse est déjà faite
  U.viser(tl, id, { x: 256, y: 176, l: 385, h: 420 }, 1.9, tVerifier + 0.4, 0.9);
  U.cadre(tl, id, U.boite("chemins", "taches"), m("analyse") - 0.1, 1.3, 6);
  // « le départ, les fins » : la première tâche, déjà faite
  const depart = U.boite("chemins", "departFins");
  const pDepart = U.point(depart, 0.45);
  U.aller(tl, id, pDepart, m("automatiquement") - 0.1, 0.6);
  U.montrer(tl, id, "survol-depart", m("automatiquement") + 0.5, 0.1);
  const tDepart = m("depart") + 0.1;
  U.cliquer(tl, id, pDepart, tDepart);
  U.montrer(tl, id, "depart-fins", tDepart + 0.15, 0.2);
  U.cadre(tl, id, U.boite("depart-fins", "ok"), tDepart + 0.4, 1.4, 5);
  U.cacherCurseur(tl, id, tDepart + 0.5);
  // « et tous les choix » : les deux tâches qui ont chacune un point
  const choix = U.boite("depart-fins", "choix");
  U.cadre(tl, id, { x: choix.x, y: choix.y, l: choix.l, h: 90 }, m("choix") - 0.2, Math.min(1.6, fin - m("choix")), 4);
};
