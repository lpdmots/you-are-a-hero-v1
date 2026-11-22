// Passage 5 — « Quand elle vous remet sa scène, cliquez sur « Corriger ». Vous choisissez ce que l'IA
// doit corriger : ici, seulement l'orthographe. Les modifications apparaissent directement dans le
// texte. À vous de refuser celles qui ne vous conviennent pas et de garder les autres. »
// L'ordinateur de Mme Laurent : la scène « À valider » ; le menu des degrés, « Degré 1 · Orthographe » ;
// « ✦ Corriger » : les marques au stylo arrivent en temps réel ; un clic refuse un changement, un
// second le rétablit (une vraie faute ne se laisse pas) ; « ✓ Garder les changements ». Le solde descend.
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO, A = window.AIDES;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "scene-a-valider", "survol-degre", "degres", "survol-degre-1", "degre-1", "survol-corriger", "correction-attente",
    "correction", "survol-refus", "refuse", "survol-retablir", "retabli", "survol-garder", "gardes",
  ]);
  U.reprendre(tl, id, null, t0);
  U.viser(tl, id, { x: 232, y: 30, l: 1200, h: 660 }, 1.15, t0, 0.01);
  U.arrivee(tl, id, t0, "droite");
  const solde = A.solde(id, [A.apres("bloc"), A.apres("correction")]);
  document.querySelector(solde.sel).style.opacity = 0;
  solde.montrer(tl, T(1.0));

  // « Quand elle vous remet sa scène » : « À valider »
  U.cadre(tl, id, U.boite("scene-a-valider", "tampon"), m("remet") - 0.1, 1.0, 5);
  // « cliquez sur Corriger » : le bouton, et à côté le degré
  const corriger = U.boite("scene-a-valider", "corriger"), degre = U.boite("scene-a-valider", "degre");
  U.viser(tl, id, { x: 256, y: 180, l: 760, h: 380 }, 1.6, m("cliquez") - 0.5, 0.9);
  U.cadre(tl, id, corriger, m("corriger") - 0.2, 1.0, 5);
  // « Vous choisissez ce que l'IA doit corriger » : le menu des degrés
  const pDegre = U.point(degre, 0.55);
  U.aller(tl, id, pDegre, m("vous", 2) - 0.5, 0.7);
  U.montrer(tl, id, "survol-degre", m("vous", 2) + 0.2, 0.1);
  const tDegre = m("choisissez") + 0.45;
  U.cliquer(tl, id, pDegre, tDegre);
  U.montrer(tl, id, "degres", tDegre + 0.15, 0.2);
  const menu = U.boite("degres", "menu");
  U.viser(tl, id, { x: menu.x - 60, y: degre.y - 20, l: menu.l + 120, h: menu.h + 80 }, 1.75, tDegre + 0.2, 0.9);
  // « ici, seulement l'orthographe » : « Degré 1 · Orthographe »
  const degre1 = U.boite("degres", "degre1");
  const pDegre1 = U.point(degre1, 0.4);
  U.aller(tl, id, pDegre1, m("ici") - 0.5, 0.6, true);
  U.montrer(tl, id, "survol-degre-1", m("ici") + 0.1, 0.1);
  U.cadre(tl, id, degre1, m("seulement") - 0.2, 1.0, 3);
  const tDegre1 = m("orthographe") + 0.55;
  U.cliquer(tl, id, pDegre1, tDegre1);
  U.montrer(tl, id, "degre-1", tDegre1 + 0.15, 0.2);
  // « ✦ Corriger »
  const pCorriger = U.point(corriger, 0.5);
  U.viser(tl, id, { x: 256, y: 180, l: 760, h: 400 }, 1.55, tDegre1 + 0.3, 0.8);
  U.aller(tl, id, pCorriger, tDegre1 + 0.4, 0.6, true);
  U.montrer(tl, id, "survol-corriger", tDegre1 + 1.0, 0.1);
  const tReponse = Math.max(m("modifications") + 0.2, tDegre1 + 1.4 + A.duree("correction"));
  const tCorriger = tReponse - A.duree("correction");
  U.cliquer(tl, id, pCorriger, tCorriger);
  U.montrer(tl, id, "correction-attente", tCorriger + 0.1, 0);
  U.cacherCurseur(tl, id, tCorriger + 0.4);
  // les marques au stylo, après la durée réelle de la réponse
  U.montrer(tl, id, "correction", tReponse, 0.35);
  window.bruit("stylo", tReponse, 0.8);
  solde.descendre(tl, 1, tReponse + 0.6);
  const m1 = U.boite("correction", "marque1"), m7 = U.boite("correction", "marque7");
  const texte = { x: 256, y: m1.y - 40, l: 743, h: m7.y + m7.h - m1.y + 80 };
  U.viser(tl, id, texte, 2.0, tReponse - 0.2, 1.0);
  U.cadre(tl, id, m1, Math.max(m("apparaissent") - 0.1, tReponse + 0.6), 0.9, 3);
  U.cadre(tl, id, U.boite("correction", "marque2"), Math.max(m("directement") + 0.1, tReponse + 1.5), 0.9, 3);

  // « À vous de refuser » : un clic sur un changement le refuse ; le décompte suit
  const refus = U.boite("survol-refus", "refus"), compte = U.boite("correction", "compte"), garder = U.boite("correction", "garder");
  const pRefus = U.point(refus, 0.5);
  U.viser(tl, id, { x: 256, y: m7.y - 90, l: 743, h: garder.y + garder.h - m7.y + 130 }, 1.7, m("vous", 3) - 0.7, 0.9);
  U.aller(tl, id, pRefus, m("vous", 3) - 0.5, 0.7);
  U.montrer(tl, id, "survol-refus", m("vous", 3) + 0.2, 0.1);
  const tRefus = m("refuser") + 0.3;
  U.cliquer(tl, id, pRefus, tRefus);
  U.montrer(tl, id, "refuse", tRefus + 0.12, 0.15);
  U.cadre(tl, id, { x: compte.x - 4, y: compte.y - 4, l: 190, h: compte.h + 8 }, tRefus + 0.45, 0.9, 4);
  // un second clic le rétablit : c'était une vraie faute, elle sera corrigée
  const tRetabli = Math.max(m("pas") + 0.2, tRefus + 1.5);
  U.montrer(tl, id, "survol-retablir", tRetabli - 0.25, 0);
  U.cliquer(tl, id, pRefus, tRetabli);
  U.montrer(tl, id, "retabli", tRetabli + 0.12, 0.15);
  U.cadre(tl, id, { x: compte.x - 4, y: compte.y - 4, l: 190, h: compte.h + 8 }, tRetabli + 0.4, 0.8, 4);
  // « et de garder les autres » : « ✓ Garder les changements »
  const pGarder = U.point(garder, 0.5);
  const tVersGarder = Math.max(m("garder") + 0.2, tRetabli + 0.9);
  U.aller(tl, id, pGarder, tVersGarder, 0.7, true);
  U.montrer(tl, id, "survol-garder", tVersGarder + 0.7, 0.1);
  U.cadre(tl, id, garder, tVersGarder + 0.5, 0.8, 5);
  const tGarder = Math.max(T(window.finVoix(id)) + 0.45, tVersGarder + 1.2);
  U.cliquer(tl, id, pGarder, tGarder);
  U.montrer(tl, id, "gardes", tGarder + 0.15, 0.3);
  U.cacherCurseur(tl, id, tGarder + 0.4);
  // le texte d'Inès, corrigé
  U.viser(tl, id, { x: 232, y: 60, l: 1200, h: 660 }, 1.2, tGarder + 0.3, Math.min(1.0, fin - tGarder - 0.4));
};
