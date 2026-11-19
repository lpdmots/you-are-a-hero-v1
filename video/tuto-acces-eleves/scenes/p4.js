// Passage 4 — « Une fois les élèves inscrits, imprimez l'affiche… Imprimez également les
// étiquettes, à découper et à distribuer à chaque élève. » Depuis la classe, « Imprimer l'affiche » ; l'affiche (l'adresse,
// l'identifiant, le mot de passe désignés l'un après l'autre), puis la planche d'étiquettes, dont
// celle d'Inès se détache. La feuille s'en va : on passe sur l'ordinateur d'un élève.
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["classe-codes", "affiche", "etiquettes"]);
  U.reprendre(tl, id, "p3", t0);

  // la caméra glisse vers la fiche « Pour ouvrir la classe », et l'on clique « Imprimer l'affiche »
  const boite = U.boite("classe-codes", "affiche");
  U.viser(tl, id, { x: 990, y: 250, l: 440, h: 260 }, 1.8, T(0.1), 1.2);
  const bouton = U.point(boite, 0.4);
  U.aller(tl, id, bouton, m("imprimez") - 0.55, 0.75);
  U.cadre(tl, id, boite, m("imprimez") - 0.1, 0.55, 5);
  U.cliquer(tl, id, bouton, m("affiche") + 0.1);
  U.montrer(tl, id, "affiche", m("affiche") + 0.25, 0.35);
  U.cacherCurseur(tl, id, m("affiche") + 0.4);
  U.viser(tl, id, { x: 700, y: 150, l: 640, h: 500 }, 1.5, m("affiche") + 0.3, 1.1);
  U.cadre(tl, id, U.boite("affiche", "adresse"), m("adresse") - 0.1, 1.2);
  U.cadre(tl, id, U.boite("affiche", "identifiant"), m("identifiant") - 0.1, 1.1);
  U.cadre(tl, id, U.boite("affiche", "motDePasse"), m("mot") - 0.1, 1.5);

  // la caméra recule jusqu'à l'onglet « Étiquettes des élèves » (mesuré sur la capture), et l'on clique
  const onglet = { x: 258, y: 146, l: 170, h: 36 };
  U.viser(tl, id, { x: 240, y: 110, l: 1000, h: 560 }, 1.3, Math.max(m("mot") + 1.5, m("imprimez", 2) - 0.9), 1.0);
  U.aller(tl, id, U.point(onglet), m("imprimez", 2) - 0.1, 0.8);
  U.cadre(tl, id, onglet, m("imprimez", 2) + 0.35, 0.9, 5);
  const tOnglet = Math.max(m("etiquettes") - 0.05, m("imprimez", 2) + 0.9);
  U.cliquer(tl, id, U.point(onglet), tOnglet);

  // les étiquettes ; mesurée sur la capture : celle d'Inès, troisième colonne, troisième rangée
  U.montrer(tl, id, "etiquettes", tOnglet + 0.12, 0.35);
  U.cacherCurseur(tl, id, tOnglet + 0.4);
  U.viser(tl, id, { x: 700, y: 160, l: 620, h: 420 }, 1.55, tOnglet + 0.35, 1.1);
  const ines = { x: 1114, y: 362, l: 194, h: 92 };
  const pointilles = U.cadre(tl, id, ines, m("decouper") - 0.1, 0);
  const tSienne = m("distribuer");
  // l'étiquette se soulève de la feuille, distribuée : sa place reste vide, découpée
  const trou = document.createElement("div");
  trou.id = "p4-trou";
  trou.style.cssText = `position:absolute;left:${ines.x}px;top:${ines.y}px;width:${ines.l}px;height:${ines.h}px;background:#f3f3f0;outline:1.5px dashed #b9bdb6;outline-offset:-1px;opacity:0`;
  const feuille = document.getElementById("p4-feuille");
  feuille.insertBefore(trou, feuille.querySelector(".clic-app"));
  tl.to("#p4-trou", { opacity: 1, duration: 0.15 }, tSienne - 0.4);
  const piece = U.taper(tl, id, "etiquettes", ines, tSienne - 0.45, 0.01, 1, 0);
  tl.to(pointilles, { opacity: 0, duration: 0.2 }, tSienne - 0.4);
  tl.to(piece, { y: -16, x: 16, rotation: -3, scale: 1.07, boxShadow: "0 22px 30px -10px rgba(40,30,10,0.45)", duration: 0.6, ease: "back.out(1.7)" }, tSienne - 0.4);

  // on passe à l'ordinateur d'un élève
  U.depart(tl, id, fin);
};
