// Passage 5 — « De son côté, l'élève retrouve votre remarque en ouvrant sa scène. Il peut alors
// améliorer son texte, puis vous le remettre à nouveau. » L'ordinateur de Sacha (la feuille arrive de
// droite) : « Mon travail », « Reprendre mon texte » ; la remarque en grand, « J'ai lu, j'écris » ; un
// paragraphe de plus, puis « Remettre à Mme Laurent » : « C'est remis ! ».
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "mon-travail", "survol-ouvrir", "remarque-en-grand", "survol-lu", "scene-eleve", "copie-focus",
    "ajout-enregistre", "survol-remettre", "remise",
  ]);
  U.reprendre(tl, id, null, t0);
  U.viser(tl, id, { x: 97, y: 300, l: 1232, h: 260 }, 1.15, t0, 0.01);
  U.arrivee(tl, id, t0, "droite");

  // « Mon travail » : sa scène, « Mme Laurent te demande de reprendre ton texte »
  const ligne = U.boite("mon-travail", "ligne");
  U.cadre(tl, id, ligne, Math.max(m("eleve") - 0.3, T(1.0)), 1.0, 5);
  const ouvrir = U.boite("mon-travail", "ouvrir");
  const pOuvrir = U.point(ouvrir, 0.4);
  U.aller(tl, id, pOuvrir, m("eleve") + 0.1, 0.6);
  U.montrer(tl, id, "survol-ouvrir", m("eleve") + 0.65, 0.15);
  const tOuvrir = Math.max(m("retrouve") + 0.3, m("eleve") + 1.0);
  U.cliquer(tl, id, pOuvrir, tOuvrir);
  U.montrer(tl, id, "remarque-en-grand", tOuvrir + 0.15, 0.3);
  U.cacherCurseur(tl, id, tOuvrir + 0.35);
  // la remarque, en grand
  const grand = U.boite("remarque-en-grand", "grand");
  U.viser(tl, id, grand, 1.6, tOuvrir + 0.25, 0.8);
  U.cadre(tl, id, U.boite("remarque-en-grand", "texte"), Math.max(m("remarque") - 0.1, tOuvrir + 0.9), 1.4, 6);
  // « J'ai lu, j'écris »
  const lu = U.boite("remarque-en-grand", "lu");
  const pLu = U.point(lu, 0.45);
  const tAllerLu = Math.max(m("scene") - 0.4, tOuvrir + 1.6);
  U.aller(tl, id, pLu, tAllerLu, 0.6);
  U.montrer(tl, id, "survol-lu", tAllerLu + 0.55, 0.15);
  const tLu = tAllerLu + 1.0;
  U.cliquer(tl, id, pLu, tLu);
  U.montrer(tl, id, "scene-eleve", tLu + 0.15, 0.3);
  // la copie, et la remarque à côté
  U.viser(tl, id, { x: 97, y: 220, l: 1232, h: 430 }, 1.12, tLu + 0.25, 0.8);

  // un clic à la fin du texte, puis un paragraphe de plus (le temps saute : il s'écrit en entier)
  const pFin = { x: 252, y: 490 };
  U.aller(tl, id, pFin, tLu + 0.5, 0.5, true);
  const tCopie = Math.max(m("il") - 0.1, tLu + 1.1);
  U.cliquer(tl, id, pFin, tCopie);
  U.montrer(tl, id, "copie-focus", tCopie + 0.1, 0);
  U.cacherCurseur(tl, id, tCopie + 0.25);
  U.viser(tl, id, { x: 150, y: 420, l: 780, h: 200 }, 1.55, tCopie, 0.8);
  const tTexte = Math.max(m("ameliorer") - 0.1, tCopie + 0.3);
  const ligne1 = U.taper(tl, id, "ajout-enregistre", { x: 158, y: 524, l: 760, h: 36 }, tTexte, 1.3, 22, 0);
  U.montrer(tl, id, "ajout-enregistre", tTexte + 1.35, 0.5);
  U.ranger(tl, [ligne1], tTexte + 1.9);

  // « Remettre à Mme Laurent »
  const remettre = U.boite("ajout-enregistre", "remettre");
  const pRemettre = U.point(remettre, 0.4);
  U.viser(tl, id, { x: 97, y: 300, l: 1232, h: 400 }, 1.12, tTexte + 1.4, 0.8);
  U.aller(tl, id, pRemettre, tTexte + 1.6, 0.6);
  U.montrer(tl, id, "survol-remettre", tTexte + 2.15, 0.15);
  U.cadre(tl, id, remettre, Math.max(m("remettre") - 0.1, tTexte + 2.1), 0.8, 5);
  const tRemettre = Math.max(m("nouveau") + 0.3, tTexte + 2.7);
  U.cliquer(tl, id, pRemettre, tRemettre);
  U.montrer(tl, id, "remise", tRemettre + 0.15, 0.3);
  U.cacherCurseur(tl, id, tRemettre + 0.4);
  // « C'est remis ! » et le tampon « À valider »
  U.viser(tl, id, { x: 97, y: 100, l: 1240, h: 580 }, 1.1, tRemettre + 0.3, 0.8);
  const tampon = { x: 1222, y: 124, l: 93, h: 31 }; // mesuré sur la capture remise
  U.cadre(tl, id, tampon, tRemettre + 0.9, 1.0, 5);
  U.depart(tl, id, fin);
};
