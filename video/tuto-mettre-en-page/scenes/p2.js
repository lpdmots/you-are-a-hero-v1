// Passage 2 — « Pour commencer, rendez-vous dans « Livre », puis dans « Mettre en page ». Vous y
// trouverez deux volets : « Réglages du livre » et « Aperçu ». » « Livre » dans la colonne : le Livre
// se rouvre sur « Vérifier les chemins » ; l'étape « Mettre en page » ; les deux volets.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["plan", "survol-livre", "livre", "survol-page", "reglages"]);
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

  // l'étape « Mettre en page »
  U.viser(tl, id, { x: 300, y: 40, l: 1100, h: 600 }, 1.34, tLivre + 0.2, 0.7);
  const etape = U.boite("livre", "enPage");
  const pEtape = U.point(etape, 0.5);
  U.aller(tl, id, pEtape, tLivre + 0.3, 0.6, true);
  U.montrer(tl, id, "survol-page", tLivre + 0.85, 0.1);
  U.cadre(tl, id, etape, Math.max(m("mettre") - 0.2, tLivre + 0.8), 0.9, 5);
  const tEtape = Math.max(m("page") + 0.3, tLivre + 1.3);
  U.cliquer(tl, id, pEtape, tEtape);
  U.montrer(tl, id, "reglages", tEtape + 0.15, 0.25);
  U.cacherCurseur(tl, id, tEtape + 0.35);

  // les deux volets : « Réglages du livre » et « Aperçu »
  U.viser(tl, id, { x: 256, y: 150, l: 700, h: 300 }, 1.8, Math.max(m("vous") - 0.4, tEtape + 0.5), 0.9);
  U.cadre(tl, id, U.boite("reglages", "bascule"), m("volets") - 0.1, 0.7, 6);
  U.cadre(tl, id, U.boite("reglages", "ongletReglages"), m("reglages") - 0.1, 1.2, 4);
  U.cadre(tl, id, U.boite("reglages", "ongletApercu"), m("apercu") - 0.1, Math.min(1.4, fin - m("apercu")), 4);
};
