// Passage 3 — « Rendez-vous ensuite dans « Livre », puis dans « Relire ». L'application vous guide en
// quatre tâches : elle vérifie d'abord que toutes les scènes sont écrites, puis vous signale les
// erreurs importantes et les points à confirmer. » « Livre » dans la colonne ; l'étape « Relire » ;
// la fiche et ses quatre tâches ; la première, puis « Continuer » deux fois : tout est déjà fait.
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "prete", "survol-livre", "livre", "survol-relire", "relire", "survol-ecrire", "ecrire",
    "survol-continuer-graves", "graves", "survol-continuer-confirmer", "confirmer",
  ]);
  U.reprendre(tl, id, "p2", t0);

  // « Livre », dans la colonne
  U.viser(tl, id, { x: 0, y: 40, l: 1000, h: 560 }, 1.35, T(0.1), 0.9);
  const livre = U.boite("prete", "livre");
  const pLivre = U.point(livre, 0.3);
  U.aller(tl, id, pLivre, m("rendez") - 0.3, 0.6);
  U.montrer(tl, id, "survol-livre", m("rendez") + 0.25, 0.15);
  U.cadre(tl, id, livre, m("livre") - 0.3, 0.8, 5);
  const tLivre = m("livre") + 0.3;
  U.cliquer(tl, id, pLivre, tLivre);
  U.montrer(tl, id, "livre", tLivre + 0.15, 0.3);

  // l'étape « Relire »
  const relire = U.boite("livre", "relire");
  const pRelire = U.point(relire, 0.6);
  U.aller(tl, id, pRelire, tLivre + 0.3, 0.5, true);
  U.montrer(tl, id, "survol-relire", tLivre + 0.75, 0.1);
  U.cadre(tl, id, relire, Math.max(m("relire") - 0.2, tLivre + 0.7), 0.8, 5);
  const tRelire = Math.max(m("relire") + 0.3, tLivre + 1.1);
  U.cliquer(tl, id, pRelire, tRelire);
  U.montrer(tl, id, "relire", tRelire + 0.15, 0.1);
  U.cacherCurseur(tl, id, tRelire + 0.35);

  // la fiche « Relire » : quatre tâches
  U.viser(tl, id, { x: 256, y: 176, l: 385, h: 400 }, 1.95, tRelire + 0.3, 0.9);
  U.cadre(tl, id, U.boite("relire", "taches"), m("quatre") - 0.1, 1.2, 6);

  // « Ce qui reste à écrire » : toutes les scènes sont prêtes
  const ecrire = U.boite("relire", "ecrire");
  const pEcrire = U.point(ecrire, 0.45);
  U.aller(tl, id, pEcrire, m("elle") - 0.3, 0.6);
  U.montrer(tl, id, "survol-ecrire", m("elle") + 0.25, 0.1);
  const tEcrire = m("verifie") + 0.2;
  U.cliquer(tl, id, pEcrire, tEcrire);
  U.montrer(tl, id, "ecrire", tEcrire + 0.15, 0.2);
  U.cadre(tl, id, U.boite("ecrire", "ok"), Math.max(m("ecrites") - 0.4, tEcrire + 0.4), 1.0, 5);

  // « Continuer » : « Aucune erreur grave. »
  const continuer = U.boite("ecrire", "continuer");
  const pContinuer = U.point(continuer, 0.4);
  U.aller(tl, id, pContinuer, Math.max(m("puis", 2) - 0.3, tEcrire + 0.5), 0.5, true);
  U.montrer(tl, id, "survol-continuer-graves", Math.max(m("puis", 2) + 0.15, tEcrire + 0.95), 0.1);
  const tGraves = Math.max(m("erreurs") - 0.1, tEcrire + 1.2);
  U.cliquer(tl, id, pContinuer, tGraves);
  U.montrer(tl, id, "graves", tGraves + 0.15, 0.2);
  U.cadre(tl, id, U.boite("graves", "ok"), tGraves + 0.4, 0.9, 5);

  // « Continuer » : « Rien à confirmer. »
  U.montrer(tl, id, "survol-continuer-confirmer", tGraves + 0.5, 0.1);
  const tConfirmer = Math.max(m("points") - 0.1, tGraves + 1.2);
  U.cliquer(tl, id, pContinuer, tConfirmer);
  U.montrer(tl, id, "confirmer", tConfirmer + 0.15, 0.2);
  U.cadre(tl, id, U.boite("confirmer", "ok"), tConfirmer + 0.4, Math.min(1.1, fin - tConfirmer - 0.4), 5);
};
