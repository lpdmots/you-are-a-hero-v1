// Passage 5 — « Il ne reste plus qu'à répartir le travail. Cliquez sur « Attribuer des élèves » et
// sélectionnez ceux qui écriront ce chapitre. Chacun aura alors accès uniquement aux chapitres qui
// lui sont attribués. » La page remonte sur « La forêt de la nuit » ; le menu de « La rivière aux
// reflets » ; quatre élèves cochés, leurs pastilles sur la carte ; puis le temps saute : chaque
// chapitre a ses élèves.
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["avant-menu", "menu", "attribuer", "coche-1", "coche-2", "coche-3", "coche-4", "attribue"]);
  U.reprendre(tl, id, "p4", t0);

  // la page remonte : la deuxième partie en haut de la fenêtre
  const gardien = U.page(tl, id, "plan-gardien", 232, 931, t0);
  gardien.aller(618, T(0.2), 1.0);
  gardien.cacher(T(1.25));
  U.viser(tl, id, { x: 240, y: 30, l: 1180, h: 640 }, 1.25, T(0.2), 1.1);

  // le menu à trois points de la carte, puis « Attribuer des élèves »
  const menu = U.boite("avant-menu", "menu");
  const pMenu = U.point(menu);
  U.aller(tl, id, pMenu, Math.max(m("cliquez") - 0.7, T(1.4)), 0.7);
  const tMenu = Math.max(m("cliquez") + 0.05, T(2.2));
  U.cliquer(tl, id, pMenu, tMenu);
  U.montrer(tl, id, "menu", tMenu + 0.1, 0.15);
  const attribuer = U.boite("menu", "attribuer");
  const pAttribuer = U.point(attribuer, 0.35);
  U.aller(tl, id, pAttribuer, tMenu + 0.3, 0.5, true);
  U.cadre(tl, id, attribuer, Math.max(m("attribuer") - 0.1, tMenu + 0.5), 0.9, 2);
  const tAttribuer = Math.max(m("eleves") + 0.1, tMenu + 1.2);
  U.cliquer(tl, id, pAttribuer, tAttribuer);
  U.montrer(tl, id, "attribuer", tAttribuer + 0.15, 0.3);
  // la carte et le panneau ensemble : les pastilles viendront sur la carte
  U.viser(tl, id, { x: 540, y: 90, l: 885, h: 640 }, 1.45, tAttribuer + 0.2, 1.0, 960, 560);

  // quatre élèves cochés, l'un après l'autre (chaque coche ajoute une ligne sous l'élève)
  const eleves = ["Chloé", "Emma", "Hugo", "Inès"];
  const avant = ["attribuer", "coche-1", "coche-2", "coche-3"];
  let t = Math.max(m("selectionnez") + 0.1, tAttribuer + 1.2);
  eleves.forEach((e, i) => {
    const b = U.boite(avant[i], e);
    const p = { x: b.x + 15, y: b.y + b.h / 2 };
    U.aller(tl, id, p, t - 0.5, 0.45, true);
    U.cliquer(tl, id, p, t);
    U.montrer(tl, id, `coche-${i + 1}`, t + 0.1, 0);
    t += 0.75;
  });
  // les pastilles des quatre élèves sur la carte
  const riviere = U.boite("coche-4", "riviere");
  U.cadre(tl, id, { x: riviere.x + 18, y: riviere.y + 219, l: 158, h: 30 }, t, 1.4, 4);

  // « Fermer »
  const fermer = { x: 1025, y: 746, l: 380, h: 46 };
  const pFermer = U.point(fermer);
  U.aller(tl, id, pFermer, t + 0.3, 0.6, true);
  const tFermer = t + 1.1;
  U.cliquer(tl, id, pFermer, tFermer);
  U.montrer(tl, id, "attribue", tFermer + 0.15, 0.3);
  U.cacherCurseur(tl, id, tFermer + 0.4);
  U.viser(tl, id, { x: 240, y: 30, l: 1180, h: 640 }, 1.25, tFermer + 0.2, 1.0);

  // le temps saute : chaque chapitre a ses élèves ; la page entière, à la même hauteur
  const tous = U.page(tl, id, "tous-attribues", 232, 618, Math.max(m("chacun") - 0.3, tFermer + 1.0));
  tous.montrer(Math.max(m("chacun") - 0.3, tFermer + 1.0), 0.5);
  // sur « accès uniquement », la page remonte sur la première partie, puis redescend
  const tVoir = Math.max(m("uniquement") - 0.6, tFermer + 1.6);
  U.viser(tl, id, { x: 240, y: 0, l: 1180, h: 810 }, 1.1, tVoir, 1.0);
  tous.aller(140, tVoir, 1.6, "sine.inOut");
};
