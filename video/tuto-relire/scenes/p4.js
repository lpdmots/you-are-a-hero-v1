// Passage 4 — « Si le texte a besoin d'être retravaillé, cliquez sur « Demander une reprise ». Vous
// pouvez aussi laisser une remarque pour guider l'élève. » « Demander une reprise… » ; la remarque
// pour Sacha s'écrit ligne après ligne ; « Demander la reprise » : la scène « À reprendre », la
// remarque gardée. La feuille part à gauche : on change d'ordinateur.
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["corrige-enregistre", "survol-reprise", "remarque-focus", "remarque-1", "remarque-2", "survol-demander", "reprise-demandee"]);
  U.reprendre(tl, id, "p3", t0);

  // la fiche « Votre relecture »
  U.viser(tl, id, { x: 1013, y: 160, l: 400, h: 230 }, 1.9, T(0.2), 1.0);
  const reprise = U.boite("corrige-enregistre", "reprise");
  const pReprise = U.point(reprise, 0.45);
  U.aller(tl, id, pReprise, m("retravaille") - 0.4, 0.7);
  U.montrer(tl, id, "survol-reprise", m("retravaille") + 0.3, 0.15);
  U.cadre(tl, id, reprise, m("cliquez") - 0.1, 1.3, 5);
  const tReprise = Math.max(m("reprise") + 0.2, m("cliquez") + 1.3);
  U.cliquer(tl, id, pReprise, tReprise);
  U.montrer(tl, id, "remarque-focus", tReprise + 0.15, 0.2);
  U.cacherCurseur(tl, id, tReprise + 0.35);
  // « Remarque pour Sacha », facultative
  U.viser(tl, id, { x: 1021, y: 230, l: 380, h: 240 }, 1.9, tReprise + 0.3, 0.9);

  // la remarque, ligne après ligne (lignes mesurées sur les captures)
  const t1 = Math.max(m("laisser") - 0.2, tReprise + 1.2);
  const a = U.taper(tl, id, "remarque-1", { x: 1048, y: 285, l: 275, h: 20 }, t1, 1.15, 18, 0);
  const b = U.taper(tl, id, "remarque-1", { x: 1048, y: 306, l: 46, h: 18 }, t1 + 1.2, 0.2, 4, 0);
  U.montrer(tl, id, "remarque-1", t1 + 1.42, 0);
  const c = U.taper(tl, id, "remarque-2", { x: 1094, y: 306, l: 222, h: 18 }, t1 + 1.45, 0.85, 14, 0);
  U.montrer(tl, id, "remarque-2", t1 + 2.32, 0);
  U.ranger(tl, [a, b, c], t1 + 2.4);

  // « Demander la reprise »
  const demander = U.boite("remarque-2", "demander");
  const pDemander = U.point(demander, 0.45);
  const tAller = t1 + 2.4;
  U.aller(tl, id, pDemander, tAller, 0.6);
  U.montrer(tl, id, "survol-demander", tAller + 0.5, 0.15);
  U.cadre(tl, id, demander, tAller + 0.45, 0.6, 5);
  const tDemander = tAller + 1.0;
  U.cliquer(tl, id, pDemander, tDemander);
  U.montrer(tl, id, "reprise-demandee", tDemander + 0.15, 0.3);
  U.cacherCurseur(tl, id, tDemander + 0.35);
  // la scène « À reprendre », votre remarque gardée
  U.viser(tl, id, { x: 1000, y: 60, l: 420, h: 400 }, 1.45, tDemander + 0.3, 0.8);
  U.cadre(tl, id, U.boite("reprise-demandee", "ficheRemarque"), tDemander + 0.9, 0.9, 5);
  U.depart(tl, id, fin);
};
