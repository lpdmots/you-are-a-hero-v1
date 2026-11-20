// Passage 4 — « Plus bas, vous pouvez personnaliser les premières et les dernières pages : la page de
// titre, celle des auteurs, avec les prénoms de vos élèves, et la page de fin. » La page descend sous
// la barre des volets et le livre en petit, qui restent collés ; « Pages de début et de fin » ; la
// page des auteurs ouverte (« Modifier ») : ses prénoms dans le panneau et dans la petite double page.
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["grande-petit", "pages", "survol-auteurs", "auteurs"]);
  U.reprendre(tl, id, "p3", t0);

  // la caméra recule, puis la page descend jusqu'aux pages de début et de fin
  U.plan(tl, id, T(0.0), 0.8);
  const y1 = U.fichier("pages").boites._fenetre.y;
  const page = U.colle(tl, id, "reglages-page", 232, 0, [
    { de: "grande-petit", b: { x: 240, y: 170, l: 1200, h: 68 }, k: 176 }, // la barre des volets
    { de: "grande-petit", b: { x: 1013, y: 247, l: 396, h: 400 }, k: 190 }, // le livre en petit
  ]);
  const tDescente = Math.max(T(0.5), m("bas") - 0.2);
  page.montrer(tDescente);
  page.aller(y1, tDescente, 1.4);
  U.montrer(tl, id, "pages", tDescente + 1.4, 0.001);
  page.cacher(tDescente + 1.45);

  // « Pages de début et de fin »
  U.viser(tl, id, { x: 270, y: 60, l: 1140, h: 680 }, 1.45, tDescente + 1.5, 0.9);
  U.cadre(tl, id, U.boite("pages", "liste"), Math.max(m("premieres") - 0.1, tDescente + 1.9), 1.6, 6);
  U.cadre(tl, id, U.boite("pages", "pageTitre"), m("titre") - 0.3, 0.9, 4);
  // « celle des auteurs » : « Modifier », le panneau de la page à droite
  const modifier = U.boite("pages", "modifierAuteurs");
  const pModifier = U.point(modifier, 0.5);
  U.aller(tl, id, pModifier, m("celle") - 0.5, 0.6);
  U.montrer(tl, id, "survol-auteurs", m("celle") + 0.05, 0.1);
  U.cadre(tl, id, U.boite("pages", "pageAuteurs"), m("celle"), 1.0, 4);
  const tAuteurs = m("auteurs") + 0.35;
  U.cliquer(tl, id, pModifier, tAuteurs);
  U.montrer(tl, id, "auteurs", tAuteurs + 0.15, 0.3);
  U.cacherCurseur(tl, id, tAuteurs + 0.4);
  // « avec les prénoms de vos élèves » : dans le panneau, et sur la page des auteurs en petit (mesurée sur la capture)
  U.cadre(tl, id, U.boite("auteurs", "prenoms"), m("prenoms") - 0.2, 1.2, 4);
  U.cadre(tl, id, { x: 1045, y: 84, l: 162, h: 108 }, m("prenoms") - 0.2, 1.2, 4);
  // « et la page de fin »
  U.cadre(tl, id, U.boite("auteurs", "pageFin"), m("fin") - 0.3, Math.min(1.4, fin - m("fin")), 4);
};
