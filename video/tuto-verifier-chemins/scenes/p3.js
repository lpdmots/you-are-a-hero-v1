// Passage 3 — « Un choix ne mène nulle part ? Il suffit d'ouvrir la scène concernée et de le relier à
// la bonne suite. » « Continuer » : « « Suivre le hibou » ne mène nulle part. » ; « Ouvrir la scène » :
// la scène de Rayan à côté de l'aperçu, le choix ouvert dans son panneau ; « Choisir… », « grottes »
// cherché, « L'entrée des grottes » : « rends-toi au 12 », dans le panneau puis dans l'aperçu.
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "depart-fins", "survol-continuer-choix", "choix", "survol-ouvrir", "a-cote", "survol-choisir", "choisir", "cherche",
    "survol-grottes", "relie", "relie-apercu",
  ]);
  U.reprendre(tl, id, "p2", t0);

  // « Continuer » : le choix qui ne mène nulle part
  const continuer = U.boite("depart-fins", "continuer");
  const pContinuer = U.point(continuer, 0.4);
  U.aller(tl, id, pContinuer, T(0.0), 0.6);
  U.montrer(tl, id, "survol-continuer-choix", T(0.55), 0.1);
  const tChoix = Math.max(m("choix") + 0.1, T(0.8));
  U.cliquer(tl, id, pContinuer, tChoix);
  U.montrer(tl, id, "choix", tChoix + 0.15, 0.2);
  U.cadre(tl, id, U.boite("choix", "pointChoix"), Math.max(m("nulle") - 0.2, tChoix + 0.35), 1.4, 5);

  // « Ouvrir la scène » : la scène s'ouvre à côté de l'aperçu, son choix déjà ouvert
  const ouvrir = U.boite("choix", "ouvrir");
  const pOuvrir = U.point(ouvrir, 0.5);
  U.aller(tl, id, pOuvrir, Math.max(m("suffit") - 0.4, tChoix + 0.4), 0.6, true);
  U.montrer(tl, id, "survol-ouvrir", m("ouvrir") - 0.05, 0.1);
  U.cadre(tl, id, ouvrir, m("ouvrir"), 0.7, 4);
  const tOuvrir = m("scene") + 0.15;
  U.cliquer(tl, id, pOuvrir, tOuvrir);
  U.cacherCurseur(tl, id, tOuvrir + 0.3);
  U.montrer(tl, id, "a-cote", tOuvrir + 0.2, 0.25);
  U.viser(tl, id, { x: 250, y: 0, l: 1170, h: 790 }, 1.3, tOuvrir + 0.45, 0.8);
  const panneau = U.boite("a-cote", "panneauChoix");
  U.cadre(tl, id, panneau, tOuvrir + 0.9, 1.1, 4);

  // « le relier à la bonne suite » : « Choisir… », une recherche, « L'entrée des grottes »
  U.viser(tl, id, { x: 960, y: 10, l: 460, h: 560 }, 1.8, Math.max(m("relier") - 0.3, tOuvrir + 1.4), 0.9);
  const choisir = U.boite("a-cote", "choisir");
  const pChoisir = U.point(choisir, 0.5);
  const tAllerChoisir = Math.max(m("relier"), tOuvrir + 1.7);
  U.aller(tl, id, pChoisir, tAllerChoisir, 0.6);
  U.montrer(tl, id, "survol-choisir", tAllerChoisir + 0.55, 0.1);
  const tChoisir = Math.max(m("suite") + 0.1, tAllerChoisir + 0.85);
  U.cliquer(tl, id, pChoisir, tChoisir);
  U.montrer(tl, id, "choisir", tChoisir + 0.15, 0.2);
  U.cacherCurseur(tl, id, tChoisir + 0.35);
  // « grottes » tapé dans le champ, puis la liste filtrée
  const tTaper = tChoisir + 0.6;
  const tape = U.taper(tl, id, "cherche", U.boite("cherche", "demande"), tTaper, 0.5, 7, -3);
  U.montrer(tl, id, "cherche", tTaper + 0.6, 0.15);
  U.ranger(tl, [tape], tTaper + 0.8);
  const grottes = U.boite("cherche", "grottes");
  const pGrottes = U.point(grottes, 0.3, 0.45);
  U.aller(tl, id, pGrottes, tTaper + 0.75, 0.55);
  U.montrer(tl, id, "survol-grottes", tTaper + 1.3, 0.1);
  U.cadre(tl, id, grottes, tTaper + 1.3, 0.6, 3);
  const tGrottes = tTaper + 1.6;
  U.cliquer(tl, id, pGrottes, tGrottes);
  U.montrer(tl, id, "relie", tGrottes + 0.15, 0.2);
  U.cacherCurseur(tl, id, tGrottes + 0.35);
  // le choix mène au 12 : dans le panneau, puis dans l'aperçu recomposé, sous le panneau
  const phrase = U.boite("relie", "phrase");
  U.cadre(tl, id, { x: 1006, y: 202, l: 186, h: 22 }, tGrottes + 0.45, 0.9, 5); // « n° 12 L'entrée des grottes », mesuré sur « relie »
  U.cadre(tl, id, { x: phrase.x, y: phrase.y + 34, l: phrase.l, h: 50 }, tGrottes + 0.75, 0.9, 3);
  const tApercu = tGrottes + 1.4;
  U.viser(tl, id, { x: 880, y: 20, l: 540, h: 560 }, 1.6, tApercu - 0.2, 0.7);
  U.montrer(tl, id, "relie-apercu", tApercu, 0.4);
  U.cadre(tl, id, { x: 944, y: 502, l: 192, h: 24 }, tApercu + 0.5, Math.min(1.1, fin - tApercu - 0.5), 4); // « rends-toi au 12. » dans l'aperçu
};
