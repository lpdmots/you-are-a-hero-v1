// Passage 4 — « C'est maintenant au tour d'Inès d'écrire. Et sur son écran, aucune étoile :
// l'histoire, c'est elle qui l'écrit ! » L'ordinateur d'Inès (la feuille arrive de droite) : sa copie,
// la consigne et « J'ai pensé à : » ; sa première phrase s'écrit, puis le temps saute ; la caméra
// parcourt sa barre et son côté : aucun bouton de l'IA, aucun micro ; « Remettre à Mme Laurent ».
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "ines-scene", "ines-focus", "ines-texte-1", "ines-texte-2", "ines-texte-3", "ines-texte-4", "ines-texte-5",
    "ines-enregistre", "ines-cochee", "ines-survol-remettre", "ines-remise",
  ]);
  U.reprendre(tl, id, null, t0);
  const copie = U.boite("ines-scene", "copie");
  U.viser(tl, id, { x: 97, y: 180, l: 1232, h: 520 }, 1.12, t0, 0.01);
  U.arrivee(tl, id, t0, "droite");

  // « au tour d'Inès d'écrire » : un clic dans sa copie, sa première phrase, puis le temps saute
  const pCopie = { x: copie.x + 190, y: copie.y + 40 };
  U.aller(tl, id, pCopie, m("ines") - 0.9, 0.6);
  const tCopie = m("ines") - 0.2;
  U.cliquer(tl, id, pCopie, tCopie);
  U.montrer(tl, id, "ines-focus", tCopie + 0.1, 0);
  U.cacherCurseur(tl, id, tCopie + 0.3);
  U.viser(tl, id, { x: copie.x, y: copie.y - 60, l: copie.l, h: 330 }, 1.5, tCopie, 0.8);
  const tTexte = Math.max(m("ecrire") - 0.2, tCopie + 0.5);
  // la première ligne de la copie, là où sa phrase s'écrit (mesurée sur la capture)
  const ligne = U.taper(tl, id, "ines-texte-1", { x: copie.x + 56, y: copie.y + 22, l: 372, h: 40 }, tTexte, 1.2, 24, 0);
  U.montrer(tl, id, "ines-texte-1", tTexte + 1.25, 0);
  U.ranger(tl, [ligne], tTexte + 1.3);
  ["ines-texte-2", "ines-texte-3", "ines-texte-4", "ines-texte-5"].forEach((nom, i) => U.montrer(tl, id, nom, tTexte + 1.6 + i * 0.42, 0.3));
  window.bruit("clavier", tTexte + 1.6, 0.7);
  U.montrer(tl, id, "ines-enregistre", tTexte + 3.6, 0.3);

  // « sur son écran, aucune étoile » : sa barre d'outils, puis la consigne et sa liste
  const barre = U.boite("ines-scene", "barre");
  U.viser(tl, id, { x: barre.x - 10, y: barre.y - 40, l: barre.l + 20, h: 200 }, 1.6, m("sur") - 0.5, 0.9);
  U.cadre(tl, id, barre, m("ecran") - 0.1, 1.0, 5);
  const consigne = U.boite("ines-scene", "consigne"), liste = U.boite("ines-scene", "liste");
  U.viser(tl, id, { x: consigne.x - 30, y: consigne.y - 60, l: consigne.l + 60, h: liste.y + liste.h - consigne.y + 90 }, 1.5, m("aucune") - 0.2, 0.9);
  // « c'est elle qui l'écrit » : son texte
  U.viser(tl, id, { x: copie.x, y: copie.y - 60, l: copie.l, h: 400 }, 1.4, m("histoire") - 0.1, 1.0);

  // elle a coché sa liste ; « Remettre à Mme Laurent »
  const fv = T(window.finVoix(id));
  U.montrer(tl, id, "ines-cochee", fv + 0.1, 0.3);
  const remettre = U.boite("ines-cochee", "remettre");
  const pRemettre = U.point(remettre, 0.4);
  U.viser(tl, id, { x: 97, y: 240, l: 1232, h: 540 }, 1.12, fv, 0.8);
  U.aller(tl, id, pRemettre, fv + 0.15, 0.6);
  U.montrer(tl, id, "ines-survol-remettre", fv + 0.75, 0.1);
  U.cadre(tl, id, remettre, fv + 0.6, 0.6, 5);
  const tRemettre = fv + 1.2;
  U.cliquer(tl, id, pRemettre, tRemettre);
  U.montrer(tl, id, "ines-remise", tRemettre + 0.15, 0.3);
  U.cacherCurseur(tl, id, tRemettre + 0.4);
  U.depart(tl, id, fin);
};
