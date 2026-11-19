// Passage 2 — « Pour commencer, rendez-vous dans Mes classes et créez votre classe. Renseignez le
// nom, l'année scolaire et cliquez sur Créer. » « Mes classes » vide, « Créer ma classe », le nom qui s'écrit
// (et l'identifiant proposé avec lui), l'année cochée, « Créer la classe ».
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["mes-classes-vide", "nouvelle-classe", "nouvelle-classe-remplie", "classe-creee"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  const creer = U.point(U.boite("mes-classes-vide", "creer"));
  U.aller(tl, id, creer, m("mes") - 0.2);
  U.cliquer(tl, id, creer, m("creez") + 0.1);
  U.montrer(tl, id, "nouvelle-classe", m("creez") + 0.22, 0.3);
  U.viser(tl, id, { x: 1005, y: 90, l: 420, h: 330 }, 1.7, m("creez") + 0.35, 1.1);

  // le nom s'écrit ; l'identifiant proposé suit la frappe
  const nom = U.boite("nouvelle-classe", "nom");
  const tNom = Math.max(m("nom") - 0.3, m("creez") + 1.6);
  U.aller(tl, id, U.point(nom, 0.15), tNom - 0.65, 0.5, true);
  U.cliquer(tl, id, U.point(nom, 0.15), tNom - 0.1);
  const morceaux = [
    U.taper(tl, id, "nouvelle-classe-remplie", nom, tNom, 1.0, 16, 3, true),
    U.taper(tl, id, "nouvelle-classe-remplie", U.boite("nouvelle-classe-remplie", "identifiant"), tNom + 0.05, 1.0, 14),
  ];
  // l'année, une fois le nom écrit
  const annee = U.boite("nouvelle-classe-remplie", "annee");
  const tAnnee = Math.max(m("annee") + 0.05, tNom + 1.5);
  U.aller(tl, id, U.point(annee), tAnnee - 0.5, 0.45, true);
  U.cliquer(tl, id, U.point(annee), tAnnee);
  morceaux.push(U.taper(tl, id, "nouvelle-classe-remplie", annee, tAnnee + 0.05, 0.05, 1));
  U.montrer(tl, id, "nouvelle-classe-remplie", tAnnee + 0.35, 0);
  U.ranger(tl, morceaux, tAnnee + 0.4);

  // « et cliquez sur Créer » : la classe est créée
  const valider = U.point(U.boite("nouvelle-classe-remplie", "valider"));
  const tValider = Math.max(m("creer"), tAnnee + 1.1);
  U.viser(tl, id, { x: 1005, y: 300, l: 420, h: 500 }, 1.4, tAnnee + 0.3, 0.9);
  U.aller(tl, id, valider, tValider - 0.75, 0.6, true);
  U.cliquer(tl, id, valider, tValider);
  U.montrer(tl, id, "classe-creee", tValider + 0.15, 0.35);
  U.cacherCurseur(tl, id, tValider + 0.45);
  U.plan(tl, id, tValider + 0.2, 1.2);
};
