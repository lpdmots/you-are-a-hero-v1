// Passage 2 — « Pour commencer, rendez-vous dans « Imprimer et partager », puis cliquez sur « Créer le
// PDF définitif ». En quelques secondes, votre livre est prêt à être envoyé à l'imprimeur ! » La fin
// du tuto 10 (« Mise en page terminée ») ; « Imprimer et partager » ; « Créer le PDF définitif… », le
// rappel « À savoir avant de créer le PDF » et son bouton ; « Création du PDF… » ; « Le livre est fait. »
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["page", "survol-imprimer", "imprimer", "survol-creer", "rappel", "survol-creer-rappel", "creation", "fait"]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");

  // « Mise en page terminée », puis « Imprimer et partager »
  const imprimer = U.boite("page", "imprimer");
  U.viser(tl, id, { x: 256, y: 120, l: 1150, h: 300 }, 1.4, T(0.7), 0.9);
  U.cadre(tl, id, U.boite("page", "terminee"), T(1.0), 0.8, 5);
  const pImprimer = U.point(imprimer, 0.45);
  U.aller(tl, id, pImprimer, m("rendez") - 0.3, 0.6);
  U.montrer(tl, id, "survol-imprimer", m("rendez") + 0.3, 0.1);
  U.cadre(tl, id, imprimer, m("imprimer") - 0.2, 1.0, 5);
  const tImprimer = m("partager") + 0.4;
  U.cliquer(tl, id, pImprimer, tImprimer);
  U.montrer(tl, id, "imprimer", tImprimer + 0.15, 0.3);
  U.cacherCurseur(tl, id, tImprimer + 0.35);

  // « Créer le PDF définitif… », puis le bouton du rappel
  U.viser(tl, id, { x: 256, y: 240, l: 700, h: 260 }, 1.9, tImprimer + 0.3, 0.9);
  const creer = U.boite("imprimer", "creer");
  const pCreer = U.point(creer, 0.5);
  U.aller(tl, id, pCreer, Math.max(m("cliquez") - 0.3, tImprimer + 0.7), 0.6);
  U.montrer(tl, id, "survol-creer", m("cliquez") + 0.35, 0.1);
  U.cadre(tl, id, creer, m("creer") - 0.15, 1.0, 5);
  const tCreer = m("definitif") + 0.35;
  U.cliquer(tl, id, pCreer, tCreer);
  U.montrer(tl, id, "rappel", tCreer + 0.15, 0.2);
  const creerRappel = U.boite("rappel", "creerRappel");
  const pRappel = U.point(creerRappel, 0.5);
  U.cadre(tl, id, U.boite("rappel", "rappel"), tCreer + 0.35, 0.7, 4);
  U.aller(tl, id, pRappel, tCreer + 0.4, 0.5, true);
  U.montrer(tl, id, "survol-creer-rappel", tCreer + 0.9, 0.1);
  const tRappel = tCreer + 1.15;
  U.cliquer(tl, id, pRappel, tRappel);
  U.montrer(tl, id, "creation", tRappel + 0.12, 0.15);
  U.cacherCurseur(tl, id, tRappel + 0.4);

  // « En quelques secondes » : « Le livre est fait. »
  const tFait = Math.max(m("secondes") + 0.2, tRappel + 0.9);
  U.montrer(tl, id, "fait", tFait, 0.3);
  U.cadre(tl, id, U.boite("fait", "pret"), m("pret") - 0.3, Math.min(2.2, fin - m("pret") - 0.4), 6);
  // la caméra recule un peu avant « Partager »
  U.viser(tl, id, { x: 256, y: 160, l: 1000, h: 420 }, 1.35, Math.min(m("imprimeur") + 0.3, fin - 1.0), 0.9);
};
