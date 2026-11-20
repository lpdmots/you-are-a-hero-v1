// Passage 3 — « Son texte s'affiche. Vous repérez une faute ou une tournure maladroite ? Vous pouvez
// la corriger directement. » Le texte de Sacha ; « brillé » choisi d'un double clic, « brillait »
// tapé à sa place ; « Enregistré ».
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  const lettres = ["corrige-1", "corrige-2", "corrige-3", "corrige-4", "corrige-5", "corrige-6", "corrige-7", "corrige"];
  U.feuille(id, ["scene", "survol-faute", "faute-choisie", ...lettres, "corrige-enregistre"]);
  U.reprendre(tl, id, "p2", t0);

  // le texte de la scène
  const copie = U.boite("scene", "copie");
  U.viser(tl, id, { x: 256, y: 230, l: 760, h: 320 }, 1.55, T(0.2), 1.0);
  U.cadre(tl, id, { x: copie.x, y: copie.y - 30, l: copie.l, h: copie.h + 10 }, m("texte") - 0.1, 1.3, 4);

  // « une faute » : la caméra s'approche de « brillé »
  const faute = U.boite("scene", "faute");
  U.viser(tl, id, { x: 470, y: 300, l: 480, h: 120 }, 2.3, m("reperez") - 0.2, 1.0);
  const pFaute = U.point(faute, 0.5, 0.55);
  U.aller(tl, id, pFaute, m("faute") - 0.6, 0.7);
  U.montrer(tl, id, "survol-faute", m("faute") - 0.05, 0.1);
  U.cadre(tl, id, faute, m("faute") + 0.05, 1.2, 4);
  // un double clic choisit le mot, puis « brillait » s'écrit à sa place
  const tChoisir = Math.max(m("corriger") - 0.35, m("faute") + 1.4);
  U.cliquer(tl, id, pFaute, tChoisir);
  U.cliquer(tl, id, pFaute, tChoisir + 0.16);
  U.montrer(tl, id, "faute-choisie", tChoisir + 0.2, 0);
  U.cacherCurseur(tl, id, tChoisir + 0.35);
  const tTaper = tChoisir + 0.45;
  // une capture par lettre tapée : la sélection disparaît dès la première, comme dans l'éditeur
  lettres.forEach((nom, i) => U.montrer(tl, id, nom, tTaper + i * 0.08, 0));
  window.bruit("clavier", tTaper, 0.9);
  U.montrer(tl, id, "corrige-enregistre", tTaper + 1.2, 0.3); // « Enregistré »
  U.cadre(tl, id, U.boite("corrige", "corrige"), tTaper + 0.75, 1.0, 4);
  // la caméra recule : le texte et la fiche de relecture
  U.viser(tl, id, { x: 240, y: 60, l: 1180, h: 520 }, 1.2, Math.min(tTaper + 1.6, fin - 1.0), 0.9);
};
