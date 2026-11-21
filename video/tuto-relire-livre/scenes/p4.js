// Passage 4 — « Place maintenant à la lecture ! Votre livre s'affiche dans un aperçu, tel qu'il sera
// imprimé. Vous repérez une coquille ? Cliquez sur le passage concerné : la scène s'ouvre juste à
// côté, et vous pouvez la corriger directement. » « Lire et corriger » ; l'aperçu, première page du
// récit ; « brances » dans le premier passage ; un clic l'ouvre à côté ; « branches » tapé à sa place ;
// l'aperçu se recompose avec la correction.
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  const lettres = ["corrige-1", "corrige-2", "corrige-3", "corrige-4", "corrige-5", "corrige-6", "corrige-7", "corrige"];
  U.feuille(id, ["confirmer", "survol-continuer-lire", "lire", "survol-passage", "a-cote", "survol-coquille", "coquille-choisie", ...lettres, "corrige-enregistre", "apercu-corrige"]);
  U.reprendre(tl, id, "p3", t0);

  // « Continuer » : « Lire et corriger »
  const continuer = U.boite("confirmer", "continuer");
  const pContinuer = U.point(continuer, 0.4);
  // le curseur est resté sur « Continuer » à la fin du passage 3
  tl.set(`#${id}-curseur`, { x: pContinuer.x, y: pContinuer.y, opacity: 1 }, t0);
  U.montrer(tl, id, "survol-continuer-lire", T(0.0), 0);
  const tLire = Math.max(m("lecture") - 0.1, T(0.8));
  U.cliquer(tl, id, pContinuer, tLire);
  U.montrer(tl, id, "lire", tLire + 0.15, 0.25);
  U.cacherCurseur(tl, id, tLire + 0.4);
  U.cadre(tl, id, U.boite("lire", "lire"), tLire + 0.45, 1.0, 4);

  // l'aperçu : le livre tel qu'il sera imprimé (première page du récit)
  const page1 = U.boite("lire", "page1");
  const visible = { x: page1.x, y: page1.y, l: page1.l, h: 810 - page1.y };
  U.viser(tl, id, { x: 700, y: 210, l: 700, h: 600 }, 1.75, m("votre") - 0.2, 1.1);
  U.cadre(tl, id, visible, m("apercu") - 0.1, 1.6, 6);

  // « une coquille » : la caméra s'approche du premier paragraphe
  const coquille = { x: 964, y: 679, l: 68, h: 22 }; // « brances », mesuré sur la capture « apercu »
  U.viser(tl, id, { x: 800, y: 640, l: 500, h: 110 }, 2.9, m("reperez") - 0.3, 1.0);
  U.cadre(tl, id, coquille, m("coquille") - 0.1, 1.1, 4);
  // « Cliquez sur le passage concerné »
  const pPassage = U.point(coquille, 0.5, 0.55);
  U.aller(tl, id, pPassage, m("cliquez") - 0.5, 0.6);
  U.montrer(tl, id, "survol-passage", m("cliquez") + 0.05, 0.1);
  const tPassage = Math.max(m("concerne") + 0.1, m("cliquez") + 0.6);
  U.cliquer(tl, id, pPassage, tPassage);
  U.cacherCurseur(tl, id, tPassage + 0.3);
  // la scène s'ouvre à côté de l'aperçu
  U.montrer(tl, id, "a-cote", tPassage + 0.2, 0.25);
  U.viser(tl, id, { x: 250, y: 0, l: 1170, h: 790 }, 1.34, tPassage + 0.45, 0.9);
  const aCote = U.boite("a-cote", "aCote");
  U.cadre(tl, id, { x: aCote.x, y: aCote.y, l: aCote.l, h: 790 - aCote.y }, Math.max(m("cote") - 0.2, tPassage + 1.0), 1.2, 4);
  U.cadre(tl, id, U.boite("a-cote", "choisie"), Math.max(m("cote") - 0.2, tPassage + 1.0), 1.2, 4);

  // « la corriger directement » : « brances » choisi d'un double clic, « branches » tapé à sa place
  const faute = U.boite("a-cote", "coquille");
  U.viser(tl, id, { x: 430, y: 470, l: 400, h: 110 }, 2.6, Math.max(m("pouvez") - 0.3, tPassage + 2.0), 0.9);
  const pFaute = U.point(faute, 0.5, 0.55);
  const tAller = Math.max(m("corriger") - 0.5, tPassage + 2.5);
  U.aller(tl, id, pFaute, tAller, 0.6);
  U.montrer(tl, id, "survol-coquille", tAller + 0.55, 0.1);
  const tChoisir = tAller + 0.85;
  U.cliquer(tl, id, pFaute, tChoisir);
  U.cliquer(tl, id, pFaute, tChoisir + 0.16);
  U.montrer(tl, id, "coquille-choisie", tChoisir + 0.2, 0);
  U.cacherCurseur(tl, id, tChoisir + 0.35);
  const tTaper = tChoisir + 0.5;
  // une capture par lettre tapée : la sélection disparaît dès la première, comme dans l'éditeur
  lettres.forEach((nom, i) => U.montrer(tl, id, nom, tTaper + i * 0.08, 0));
  window.bruit("clavier", tTaper, 0.9);
  U.cadre(tl, id, U.boite("corrige", "corrige"), tTaper + 0.75, 1.0, 4);
  U.montrer(tl, id, "corrige-enregistre", tTaper + 1.1, 0.3); // « Enregistré »

  // l'aperçu suit : « branches » dans le livre
  const corrigeLivre = { x: 1064, y: 358, l: 70, h: 22 }; // mesuré sur la capture « apercu-corrige »
  const tLivre = tTaper + 1.5;
  U.viser(tl, id, { x: 890, y: 300, l: 500, h: 150 }, 2.7, tLivre, 1.0);
  U.montrer(tl, id, "apercu-corrige", tLivre + 0.6, 0.5);
  U.cadre(tl, id, corrigeLivre, tLivre + 1.1, Math.min(1.2, fin - tLivre - 1.2), 4);
};
