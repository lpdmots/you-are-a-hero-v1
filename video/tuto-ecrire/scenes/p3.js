// Passage 3 — « Ajoutez une consigne pour expliquer à l'élève ce qu'il devra raconter. Juste en
// dessous, une petite liste de vérification l'aidera à se relire. » La consigne s'écrit (deux lignes
// à l'écran, en trois frappes) ; « Ajouter un élément », puis trois éléments, un par un. La feuille
// part à gauche : on change d'ordinateur.
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "panneau", "consigne-focus", "consigne-1", "consigne-2", "consigne-3", "survol-ajouter-element",
    "element-1-focus", "element-1", "element-2-focus", "element-2", "element-3-focus", "element-3", "panneau-rempli",
  ]);
  U.reprendre(tl, id, "p2", t0);

  // la consigne : la caméra s'approche du champ
  const consigne = U.boite("panneau", "consigne");
  U.viser(tl, id, { x: 800, y: 420, l: 620, h: 300 }, 2.0, T(0.1), 0.9);
  const pConsigne = U.point(consigne, 0.4, 0.5);
  U.aller(tl, id, pConsigne, T(0.4), 0.7);
  U.cadre(tl, id, consigne, m("consigne") - 0.15, 0.9, 5);
  const tClic = m("consigne") + 0.35;
  U.cliquer(tl, id, pConsigne, tClic);
  U.montrer(tl, id, "consigne-focus", tClic + 0.1, 0);
  U.cacherCurseur(tl, id, tClic + 0.3);
  // trois frappes, ligne après ligne (lignes mesurées sur les captures, en points)
  const l1 = (x0, x1) => ({ x: x0, y: 489, l: x1 - x0, h: 19 });
  const l2 = (x0, x1) => ({ x: x0, y: 509, l: x1 - x0, h: 17 });
  const t1 = tClic + 0.35;
  const a = U.taper(tl, id, "consigne-1", l1(824, 1063), t1, 0.9, 16, 0);
  U.montrer(tl, id, "consigne-1", t1 + 0.95, 0);
  const t2 = t1 + 1.05;
  const b = U.taper(tl, id, "consigne-2", l1(1063, 1349), t2, 0.95, 16, 0);
  const c = U.taper(tl, id, "consigne-2", l2(824, 938), t2 + 1.0, 0.45, 8, 0);
  U.montrer(tl, id, "consigne-2", t2 + 1.5, 0);
  const t3 = t2 + 1.6;
  const d = U.taper(tl, id, "consigne-3", l2(938, 1063), t3, 0.5, 9, 0);
  U.montrer(tl, id, "consigne-3", t3 + 0.55, 0);
  U.ranger(tl, [a, b, c, d], t3 + 0.6);

  // « Juste en dessous » : la liste de vérification, « Ajouter un élément »
  U.viser(tl, id, { x: 800, y: 470, l: 620, h: 300 }, 2.0, Math.max(m("juste") - 0.3, t3 + 0.6), 0.9);
  const liste = U.boite("panneau", "liste");
  const ajouter = U.boite("survol-ajouter-element", "ajouterElement");
  const pAjouter = U.point(ajouter, 0.35);
  U.aller(tl, id, pAjouter, m("dessous") - 0.2, 0.7);
  U.cadre(tl, id, liste, m("dessous") - 0.05, 1.0, 6);
  U.montrer(tl, id, "survol-ajouter-element", m("dessous") + 0.5, 0.15);
  const tAjouter = Math.max(m("liste") - 0.2, m("dessous") + 1.1);
  U.cliquer(tl, id, pAjouter, tAjouter);
  U.montrer(tl, id, "element-1-focus", tAjouter + 0.12, 0);
  U.cacherCurseur(tl, id, tAjouter + 0.3);

  // trois éléments, un par un (Entrée en ajoute un autre)
  const champ = (y, x1) => ({ x: 843, y, l: x1 - 843, h: 22 });
  let t = tAjouter + 0.35;
  const morceaux = [];
  const elements = [[615, 1012, "element-1", "element-2-focus"], [652, 1007, "element-2", "element-3-focus"], [688, 1018, "element-3", null]];
  for (const [y, x1, nom, suivant] of elements) {
    morceaux.push(U.taper(tl, id, nom, champ(y, x1), t, 0.7, 13, 0, true));
    U.montrer(tl, id, nom, t + 0.75, 0);
    if (suivant) U.montrer(tl, id, suivant, t + 0.9, 0);
    t += 1.0;
  }
  U.ranger(tl, morceaux, t);
  // le panneau rempli, le curseur hors des champs
  U.montrer(tl, id, "panneau-rempli", t + 0.3, 0.3);
  U.viser(tl, id, { x: 790, y: 330, l: 640, h: 440 }, 1.55, t + 0.2, 0.9);
  U.depart(tl, id, fin);
};
