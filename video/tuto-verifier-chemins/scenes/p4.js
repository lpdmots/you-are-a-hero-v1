// Passage 4 — « Et si une scène n'est reliée à aucun chemin ? C'est peut-être un oubli, ou bien vous
// l'avez voulu ainsi : cliquez alors sur « C'est voulu ». » « Fermer » : la fiche revient sur
// « Passages à confirmer », « Choix à relier » coché ; « Le passage secret » : « Aucun chemin n'y
// mène. » ; « C'est voulu » : « C'est noté : ce passage reste tel quel. », « Tout est confirmé. »
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["relie-apercu", "survol-fermer", "fiche-revenue", "survol-voulu", "voulu-message", "voulu"]);
  U.reprendre(tl, id, "p3", t0);

  // « Fermer » : la scène se referme, la fiche revient
  U.viser(tl, id, { x: 250, y: 0, l: 1170, h: 790 }, 1.3, T(0.0), 0.7);
  const fermer = U.boite("relie-apercu", "fermer");
  const pFermer = U.point(fermer, 0.5);
  U.aller(tl, id, pFermer, T(0.2), 0.6);
  U.montrer(tl, id, "survol-fermer", T(0.75), 0.1);
  const tFermer = T(1.0);
  U.cliquer(tl, id, pFermer, tFermer);
  U.montrer(tl, id, "fiche-revenue", tFermer + 0.15, 0.25);
  U.cacherCurseur(tl, id, tFermer + 0.35);
  U.viser(tl, id, { x: 256, y: 12, l: 385, h: 440 }, 1.85, tFermer + 0.45, 0.9);
  // « Choix à relier » est coché ; le passage où aucun chemin ne mène
  U.cadre(tl, id, U.boite("fiche-revenue", "choix"), tFermer + 1.0, 0.8, 4);
  U.cadre(tl, id, U.boite("fiche-revenue", "pointPassage"), Math.max(m("aucun") - 0.2, tFermer + 1.4), 1.5, 5);

  // « C'est voulu »
  const voulu = U.boite("fiche-revenue", "voulu");
  const pVoulu = U.point(voulu, 0.5);
  U.aller(tl, id, pVoulu, m("bien") - 0.2, 0.6);
  U.montrer(tl, id, "survol-voulu", m("bien") + 0.35, 0.1);
  U.cadre(tl, id, voulu, m("cliquez") - 0.1, 1.2, 5);
  const tVoulu = m("voulu", 2) + 0.35;
  U.cliquer(tl, id, pVoulu, tVoulu);
  U.montrer(tl, id, "voulu-message", tVoulu + 0.15, 0.2);
  U.cacherCurseur(tl, id, tVoulu + 0.35);
  // le message, en bas de l'écran : la caméra recule pour le montrer
  U.viser(tl, id, { x: 256, y: 12, l: 620, h: 790 }, 1.25, tVoulu + 0.2, 0.7);
  U.cadre(tl, id, U.boite("voulu-message", "message"), tVoulu + 0.8, 1.1, 5);
  // le message s'efface : « Tout est confirmé. »
  U.montrer(tl, id, "voulu", tVoulu + 2.0, 0.4);
  U.cadre(tl, id, U.boite("voulu", "ok"), tVoulu + 2.3, Math.min(1.0, fin - tVoulu - 2.4), 4);
};
