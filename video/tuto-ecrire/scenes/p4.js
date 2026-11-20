// Passage 4 — « Le jour de l'écriture, chaque élève se rend dans « Mon travail », sur son
// ordinateur. Il choisit une scène dans son chapitre, puis clique sur « Je m'en occupe ». Ses
// camarades voient alors qu'elle est prise. » L'ordinateur de Sacha (la feuille arrive de droite) :
// « Mon travail », « Choisir une scène », la case de « La carte qui brille », « Je m'en occupe » ;
// puis celui de Léna, où la carte dit « Sacha s'en occupe ».
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["mon-travail", "survol-choisir", "scenes", "survol-fiche", "cochee", "survol-occupe", "prise"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "droite");

  // « Mon travail » : le titre de la page, sur son nom
  const titre = { x: 745, y: 192, l: 185, h: 44 }; // mesuré sur la capture mon-travail
  U.viser(tl, id, { x: 97, y: 150, l: 1240, h: 430 }, 1.15, T(1.0), 1.0);
  U.cadre(tl, id, titre, m("mon") - 0.15, 1.2, 6);

  // « Choisir une scène »
  const choisir = U.boite("mon-travail", "choisir");
  const pChoisir = U.point(choisir, 0.4);
  U.viser(tl, id, { x: 97, y: 370, l: 900, h: 220 }, 1.5, m("ordinateur") - 0.2, 1.0);
  U.aller(tl, id, pChoisir, m("choisit") - 0.6, 0.7);
  U.montrer(tl, id, "survol-choisir", m("choisit") + 0.1, 0.15);
  U.cadre(tl, id, choisir, m("choisit") - 0.1, 0.8, 5);
  const tChoisir = m("scene") + 0.05;
  U.cliquer(tl, id, pChoisir, tChoisir);
  U.montrer(tl, id, "scenes", tChoisir + 0.15, 0.25);
  // les cartes de son chapitre ; Léna et Yanis ont pris les leurs
  U.viser(tl, id, { x: 97, y: 205, l: 1232, h: 450 }, 1.12, tChoisir + 0.25, 0.9);

  // la case de « La carte qui brille », puis « Je m'en occupe »
  const kase = U.boite("scenes", "case");
  const pCase = U.point(kase);
  U.aller(tl, id, pCase, tChoisir + 0.5, 0.7, true);
  U.montrer(tl, id, "survol-fiche", tChoisir + 1.0, 0.15);
  const tCase = Math.max(m("chapitre") + 0.3, tChoisir + 1.3);
  U.cliquer(tl, id, pCase, tCase);
  U.montrer(tl, id, "cochee", tCase + 0.1, 0);
  const occupe = U.boite("cochee", "occupe");
  const pOccupe = U.point(occupe, 0.45);
  U.aller(tl, id, pOccupe, tCase + 0.35, 0.65, true);
  U.montrer(tl, id, "survol-occupe", tCase + 0.95, 0.15);
  U.cadre(tl, id, occupe, Math.max(m("je") - 0.1, tCase + 0.9), 0.5, 5);
  const tOccupe = Math.max(m("occupe") + 0.15, tCase + 1.5);
  U.cliquer(tl, id, pOccupe, tOccupe);
  U.montrer(tl, id, "prise", tOccupe + 0.15, 0.25);
  U.cacherCurseur(tl, id, tOccupe + 0.4);
  // « Tu t'en occupes », sur sa carte
  U.viser(tl, id, { x: 400, y: 200, l: 640, h: 200 }, 1.7, tOccupe + 0.3, 0.9);
  U.cadre(tl, id, U.boite("prise", "qui"), tOccupe + 0.75, 0.8, 5);

  // « Ses camarades… » : l'ordinateur de Léna, où la carte dit « Sacha s'en occupe »
  const tChange = Math.max(m("camarades") - 0.7, tOccupe + 1.5);
  U.depart(tl, id, tChange + 0.8);
  U.feuille("p4l", ["chez-lena"]);
  tl.set("#p4l-feuille", { x: 2000 }, t0);
  U.viser(tl, "p4l", { x: 400, y: 200, l: 640, h: 200 }, 1.7, T(0), 0.01);
  U.arrivee(tl, "p4l", tChange + 0.5, "droite");
  U.cadre(tl, "p4l", U.boite("chez-lena", "qui"), Math.max(m("prise") - 0.6, tChange + 1.55), 1.4, 5);
  U.depart(tl, "p4l", fin);
};
