// Passage 5 — « Tout est prêt ! En début de séance, il suffit d'ouvrir la classe… » L'ordinateur
// d'un élève arrive ; la classe s'ouvre (identifiant et mot
// de passe recopiés de l'affiche), Inès clique sur son prénom, tape son code, et entre. Puis la
// feuille s'en va : on revient chez l'enseignant.
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["poste-classe", "poste-classe-rempli", "poste-qui", "poste-code", "poste-code-1", "poste-code-2", "poste-code-3", "poste-code-4", "poste-dans-la-classe"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "droite");

  U.viser(tl, id, { x: 740, y: 250, l: 450, h: 330 }, 1.6, m("ouvrir") - 0.2, 1.2);
  const ident = U.boite("poste-classe", "identifiant");
  const mdp = U.boite("poste-classe", "motDePasse");
  U.aller(tl, id, U.point(ident, 0.15), m("chaque", 1) - 0.3, 0.7);
  U.cliquer(tl, id, U.point(ident, 0.15), m("ordinateur") - 0.05);
  // les deux champs l'un après l'autre : chaque geste attend la fin du précédent
  const tId = m("aide") - 0.3;
  const morceaux = [U.taper(tl, id, "poste-classe-rempli", ident, tId, 0.9, 14)];
  U.aller(tl, id, U.point(mdp, 0.15), tId + 0.95, 0.4, true);
  U.cliquer(tl, id, U.point(mdp, 0.15), tId + 1.35);
  morceaux.push(U.taper(tl, id, "poste-classe-rempli", mdp, tId + 1.45, 0.9, 16));
  U.montrer(tl, id, "poste-classe-rempli", tId + 2.4, 0);
  U.ranger(tl, morceaux, tId + 2.45);
  const entrer = U.point(U.boite("poste-classe-rempli", "entrer"));
  U.aller(tl, id, entrer, tId + 2.4, 0.45, true);
  const tEntrer = Math.max(m("chaque", 2) - 0.35, tId + 2.95);
  U.cliquer(tl, id, entrer, tEntrer);

  // « Qui utilise cet ordinateur ? » : Inès clique sur son prénom
  U.montrer(tl, id, "poste-qui", tEntrer + 0.15, 0.35);
  U.viser(tl, id, { x: 97, y: 100, l: 1240, h: 340 }, 1.3, tEntrer + 0.15, 1.0);
  const ines = U.point(U.boite("poste-qui", "prenom"), 0.35);
  U.aller(tl, id, ines, m("clique") - 0.3, 0.7, true);
  U.cliquer(tl, id, ines, m("prenom") - 0.05);
  U.montrer(tl, id, "poste-code", m("prenom") + 0.08, 0.25);

  // son code secret, chiffre après chiffre
  U.viser(tl, id, { x: 960, y: 110, l: 400, h: 260 }, 1.9, m("prenom") + 0.25, 1.0);
  const cases = U.boite("poste-code", "cases");
  // les quatre chiffres, un par un, puis le code part de lui-même
  const tCode = Math.max(m("entre"), m("prenom") + 1.25);
  U.aller(tl, id, U.point(cases, 0.1, 0.6), tCode - 0.6, 0.5, true);
  [1, 2, 3, 4].forEach((i) => U.montrer(tl, id, `poste-code-${i}`, tCode + (i - 1) * 0.3, 0.04));
  window.bruit("clavier", tCode, 0.9);
  U.cacherCurseur(tl, id, tCode + 0.2);

  // le voilà prêt à écrire : « Mon travail », ses scènes, « Écrire »
  const tDedans = Math.max(m("voila") - 0.25, tCode + 1.35);
  U.montrer(tl, id, "poste-dans-la-classe", tDedans, 0.4);
  U.viser(tl, id, { x: 96, y: 70, l: 1240, h: 530 }, 1.2, tDedans - 0.05, 1.1);
  U.cadre(tl, id, U.boite("poste-dans-la-classe", "ecrire"), Math.max(m("ecrire") - 0.1, tDedans + 1.1), 1.4);

  // on revient chez l'enseignant
  U.depart(tl, id, fin);
};
