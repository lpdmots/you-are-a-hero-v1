// Passage 5 — « Il peut alors écrire son texte en suivant la consigne, puis se relire à l'aide de sa
// liste de vérification. Une fois satisfait, il clique sur « Remettre ». » De nouveau l'ordinateur de
// Sacha : sa scène s'ouvre, la consigne à droite ; un paragraphe s'écrit, puis le temps saute (le
// texte entier) ; les trois cases cochées ; « Remettre à Mme Laurent » : « C'est remis ! ».
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "prise", "survol-ouvrir", "scene", "copie-focus", "texte-1", "texte-enregistre",
    "survol-coche-1", "survol-coche-2", "survol-coche-3", "cochees", "survol-remettre", "remise",
  ]);
  U.reprendre(tl, id, "p4", t0);
  U.arrivee(tl, id, t0, "droite");

  // sa carte s'ouvre
  const brille = U.boite("prise", "brille");
  const pBrille = U.point(brille, 0.5, 0.3);
  U.aller(tl, id, pBrille, T(0.7), 0.6);
  U.montrer(tl, id, "survol-ouvrir", T(1.05), 0.15);
  const tOuvrir = Math.max(T(1.35), m("ecrire") - 0.1);
  U.cliquer(tl, id, pBrille, tOuvrir);
  U.montrer(tl, id, "scene", tOuvrir + 0.15, 0.25);
  // la copie et, à droite, la consigne et « J'ai pensé à : »
  U.viser(tl, id, { x: 97, y: 260, l: 1240, h: 440 }, 1.12, tOuvrir + 0.25, 0.8);

  // un clic dans la copie, puis le premier paragraphe
  const copie = U.boite("scene", "copie");
  const pCopie = { x: 300, y: 420 };
  U.aller(tl, id, pCopie, tOuvrir + 0.45, 0.5, true);
  const tCopie = tOuvrir + 1.0;
  U.cliquer(tl, id, pCopie, tCopie);
  U.montrer(tl, id, "copie-focus", tCopie + 0.1, 0);
  U.cacherCurseur(tl, id, tCopie + 0.25);
  U.viser(tl, id, { x: 97, y: 330, l: 900, h: 300 }, 1.5, tCopie, 0.8);
  const tTexte = tCopie + 0.35;
  const dTexte = 1.75;
  const p1 = U.taper(tl, id, "texte-1", { x: 158, y: 392, l: 670, h: 30 }, tTexte, dTexte, 24, 0, true);
  U.montrer(tl, id, "texte-1", tTexte + dTexte + 0.05, 0);
  U.ranger(tl, [p1], tTexte + dTexte + 0.1);
  // le temps saute : le texte entier, enregistré
  U.montrer(tl, id, "texte-enregistre", tTexte + dTexte + 0.35, 0.6);
  U.viser(tl, id, { x: 97, y: 270, l: 1240, h: 430 }, 1.12, tTexte + dTexte + 0.4, 0.9);

  // « J'ai pensé à : », trois cases cochées une à une
  const liste = U.boite("scene", "liste");
  U.cadre(tl, id, liste, Math.max(m("liste") - 0.15, tTexte + dTexte + 1.0), 1.0, 6);
  const cases = ["survol-coche-1", "survol-coche-2", "survol-coche-3"].map((n) => U.boite(n, "coche"));
  const pCase = (b) => ({ x: b.x + 14, y: b.y + b.h / 2 });
  let t = Math.max(m("verification") + 0.1, tTexte + dTexte + 1.4);
  U.aller(tl, id, pCase(cases[0]), t - 0.6, 0.6, true);
  U.montrer(tl, id, "survol-coche-1", t - 0.1, 0.1);
  const suivants = ["survol-coche-2", "survol-coche-3", "cochees"];
  for (let i = 0; i < 3; i++) {
    U.cliquer(tl, id, pCase(cases[i]), t + 0.1);
    U.montrer(tl, id, suivants[i], t + 0.2, 0);
    if (i < 2) U.aller(tl, id, pCase(cases[i + 1]), t + 0.35, 0.3, true);
    t += 0.65;
  }

  // « Remettre à Mme Laurent »
  const remettre = U.boite("cochees", "remettre");
  const pRemettre = U.point(remettre, 0.4);
  U.aller(tl, id, pRemettre, Math.max(m("satisfait") - 0.2, t + 0.2), 0.8, true);
  U.montrer(tl, id, "survol-remettre", Math.max(m("satisfait") + 0.6, t + 1.0), 0.15);
  U.cadre(tl, id, remettre, Math.max(m("clique") - 0.1, t + 1.0), 0.9, 5);
  const tRemettre = Math.max(m("remettre") + 0.25, t + 1.8);
  U.cliquer(tl, id, pRemettre, tRemettre);
  U.montrer(tl, id, "remise", tRemettre + 0.15, 0.3);
  U.cacherCurseur(tl, id, tRemettre + 0.4);
  // « C'est remis ! » et le tampon « À valider »
  U.viser(tl, id, { x: 97, y: 100, l: 1240, h: 580 }, 1.1, tRemettre + 0.3, 0.9);
  const tampon = { x: 1222, y: 124, l: 93, h: 31 }; // mesuré sur la capture remise
  U.cadre(tl, id, tampon, tRemettre + 1.1, 1.2, 5);
  U.depart(tl, id, fin);
};
