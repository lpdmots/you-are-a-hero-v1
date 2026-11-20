// Passage 5 — « Passez ensuite dans « Aperçu » pour feuilleter votre livre en double page, exactement
// comme s'il était déjà imprimé ! » Le volet « Aperçu » : le livre en double page (« Double page »,
// choisie d'office à cette étape) ; on le feuillette, une double page après l'autre, sous la barre
// des volets et celle de l'aperçu, qui restent collées.
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["auteurs", "survol-apercu", "apercu", "apercu-fin"]);
  U.reprendre(tl, id, "p4", t0);

  // « Aperçu », dans la barre des volets
  const onglet = U.boite("auteurs", "ongletApercu");
  const pOnglet = U.point(onglet, 0.5);
  U.viser(tl, id, { x: 256, y: 0, l: 900, h: 420 }, 1.6, T(0.0), 0.8);
  U.aller(tl, id, pOnglet, T(0.4), 0.6);
  U.montrer(tl, id, "survol-apercu", T(0.95), 0.1);
  U.cadre(tl, id, onglet, m("apercu") - 0.2, 0.7, 4);
  const tApercu = m("apercu") + 0.35;
  U.cliquer(tl, id, pOnglet, tApercu);
  U.montrer(tl, id, "apercu", tApercu + 0.15, 0.3);
  U.cacherCurseur(tl, id, tApercu + 0.35);
  // la caméra recule juste assez pour que la double page se lise
  U.viser(tl, id, { x: 250, y: 40, l: 1170, h: 770 }, 1.3, tApercu + 0.3, 0.9);

  // on feuillette : une double page après l'autre
  const f = U.fichier("apercu-page").boites;
  const decalage = f._feuillete.l;
  const page = U.colle(tl, id, "apercu-page", 232, f._feuillete.y, [{ de: "apercu", b: { x: 240, y: 0, l: 1200, h: 133 }, k: 0 }]);
  const tFeuillete = Math.max(m("feuilleter") - 0.1, tApercu + 1.0);
  page.montrer(tFeuillete);
  [2, 3, 4, 5].forEach((r, i) => page.aller(f[`rangee${r}`].y - decalage, tFeuillete + i * 1.15, 0.8));
  const tFin = tFeuillete + 3 * 1.15 + 0.8;
  U.montrer(tl, id, "apercu-fin", tFin + 0.05, 0.001);
  page.cacher(tFin + 0.1);
  // « en double page »
  U.cadre(tl, id, U.boite("apercu", "double"), m("double") - 0.1, 1.3, 4);
};
