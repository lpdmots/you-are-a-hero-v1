// Passage 3 — « Passez ensuite dans « Partager ». D'un simple clic, vous pouvez permettre à vos élèves
// de lire leur livre depuis leur compte, en classe comme à la maison. » Le volet « Partager » ; la page
// descend sous la bibliothèque jusqu'à « Privé » (la barre des volets reste collée) ; l'interrupteur
// « Comptes des élèves », la case « J'ai relu le livre sur ces points. », « Partager aux comptes des
// élèves » ; « Vos élèves peuvent lire le livre. »
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["fait", "survol-partager", "partager", "prive", "survol-classes", "rappel-classes", "survol-relu-classes", "relu-classes", "survol-confirmer-classes", "classes"]);
  U.reprendre(tl, id, "p2", t0);

  // « Partager »
  const onglet = U.boite("fait", "ongletPartager");
  const pOnglet = U.point(onglet, 0.5);
  U.viser(tl, id, { x: 256, y: 120, l: 900, h: 400 }, 1.5, T(0.0), 0.8);
  U.aller(tl, id, pOnglet, T(0.3), 0.6);
  U.montrer(tl, id, "survol-partager", Math.max(T(0.95), m("passez") + 0.4), 0.1);
  U.cadre(tl, id, onglet, m("partager") - 0.2, 0.7, 5);
  const tPartager = m("partager") + 0.45;
  U.cliquer(tl, id, pOnglet, tPartager);
  U.montrer(tl, id, "partager", tPartager + 0.15, 0.25);
  U.cacherCurseur(tl, id, tPartager + 0.3);

  // la page descend jusqu'à « Privé », sous la barre des volets
  U.viser(tl, id, { x: 256, y: 150, l: 1150, h: 640 }, 1.2, tPartager + 0.3, 0.7);
  const y1 = U.fichier("prive").boites._fenetre.y;
  const volets = U.boite("partager", "volets");
  const page = U.colle(tl, id, "partager-page", 232, 0, [{ de: "partager", b: volets, k: volets.y - U.boite("prive", "volets").y }]);
  const tDescente = tPartager + 0.5;
  page.montrer(tDescente);
  page.aller(y1, tDescente, 1.0);
  U.montrer(tl, id, "prive", tDescente + 1.0, 0.001);
  page.cacher(tDescente + 1.05);
  U.viser(tl, id, { x: 270, y: 250, l: 740, h: 480 }, 1.6, tDescente + 0.8, 0.8);

  // « D'un simple clic » : l'interrupteur, la case, « Partager aux comptes des élèves »
  const inter = U.boite("prive", "interClasses");
  const pInter = U.point(inter, 0.16);
  U.aller(tl, id, pInter, Math.max(m("simple") - 0.3, tDescente + 1.05), 0.5);
  U.montrer(tl, id, "survol-classes", m("clic") - 0.05, 0.1);
  const tInter = m("clic") + 0.25;
  U.cliquer(tl, id, pInter, tInter);
  U.montrer(tl, id, "rappel-classes", tInter + 0.12, 0.2);
  const relu = U.boite("rappel-classes", "relu");
  const pRelu = { x: relu.x + 22, y: relu.y + relu.h / 2 };
  U.aller(tl, id, pRelu, tInter + 0.3, 0.45, true);
  U.montrer(tl, id, "survol-relu-classes", tInter + 0.7, 0.1);
  const tRelu = tInter + 0.85;
  U.cliquer(tl, id, pRelu, tRelu);
  U.montrer(tl, id, "relu-classes", tRelu + 0.08, 0.1);
  const confirmer = U.boite("rappel-classes", "confirmer");
  const pConfirmer = U.point(confirmer, 0.5);
  U.aller(tl, id, pConfirmer, tRelu + 0.25, 0.4, true);
  U.montrer(tl, id, "survol-confirmer-classes", tRelu + 0.6, 0.1);
  U.cadre(tl, id, confirmer, tRelu + 0.5, 0.6, 4);
  const tConfirmer = Math.max(tRelu + 0.95, m("eleves") - 0.1);
  U.cliquer(tl, id, pConfirmer, tConfirmer);
  U.montrer(tl, id, "classes", tConfirmer + 0.12, 0.25);
  U.cacherCurseur(tl, id, tConfirmer + 0.4);

  // « Comptes des élèves » activé ; « en classe comme à la maison »
  const canal = U.boite("classes", "canalClasses");
  U.cadre(tl, id, canal, Math.max(m("lire") + 0.1, tConfirmer + 0.5), 1.2, 6);
  // la ligne « Dans « Lire », en classe ou chez eux, avec leur code. », mesurée sur la capture
  U.cadre(tl, id, { x: canal.x, y: canal.y + 25, l: 336, h: 22 }, m("classe") - 0.2, Math.min(1.6, fin - m("classe")), 4);
};
