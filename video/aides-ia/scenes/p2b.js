// Passage 2 (suite) — « Puis cliquez sur « Formuler ». L'IA prépare une consigne pour vos élèves,
// avec sa liste de vérification. Vous pouvez l'ajuster si besoin, puis cliquez sur « Utiliser ». »
// « ✦ Formuler » : la vraie réponse arrive en temps réel (sa durée mesurée), le cadre « Consigne et
// liste proposées · modifiable » ; un verbe retouché dans la consigne ; « Utiliser ». Le solde descend.
window.SCENES.p2b = (tl, t0) => {
  const id = "p2b";
  const U = window.TUTO, A = window.AIDES;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  const lettres = Object.keys(window.BOITES.ecrans).filter((c) => /-mot-retouche-\d+$/.test(c)).length;
  U.feuille(id, [
    "dictee-posee", "survol-formuler", "formuler-attente", "consigne-proposee", "survol-mot", "mot-choisi",
    ...Array.from({ length: lettres }, (_, i) => `mot-retouche-${i + 1}`), "mot-retouche", "survol-utiliser", "consigne-utilisee",
  ]);
  U.reprendre(tl, id, "p2", t0);
  const solde = A.solde(id, [30, A.apres("consigne")]);

  // « Formuler », sous la consigne
  const formuler = U.boite("panneau", "formuler");
  const pFormuler = U.point(formuler, 0.45);
  U.aller(tl, id, pFormuler, T(0.05), 0.7);
  U.montrer(tl, id, "survol-formuler", T(0.8), 0.15);
  U.cadre(tl, id, formuler, m("formuler") - 0.35, 0.8, 5);
  const tFormuler = m("formuler") + 0.5;
  U.cliquer(tl, id, pFormuler, tFormuler);
  U.montrer(tl, id, "formuler-attente", tFormuler + 0.1, 0);
  A.attente(tl, id, "formuler", tFormuler + 0.12, A.duree("consigne") - 0.12);
  U.cacherCurseur(tl, id, tFormuler + 0.4);
  // la réponse, après sa durée réelle : la consigne et la liste proposées (le panneau a défilé jusqu'à elles)
  const tReponse = tFormuler + A.duree("consigne");
  U.montrer(tl, id, "consigne-proposee", tReponse, 0.3);
  window.bruit("etincelles", tReponse, 0.5);
  const propose = U.boite("consigne-proposee", "propose");
  U.viser(tl, id, { x: propose.x - 10, y: propose.y - 50, l: propose.l + 20, h: propose.h + 70 }, 1.55, tReponse - 0.1, 0.9);
  solde.descendre(tl, 1, tReponse + 0.5);
  U.cadre(tl, id, U.boite("consigne-proposee", "proposee"), Math.max(m("eleves") - 0.2, tReponse + 0.5), 1.3, 5);
  U.cadre(tl, id, U.boite("consigne-proposee", "listeProposee"), m("liste") - 0.1, 1.6, 5);

  // « Vous pouvez l'ajuster » : un verbe de la consigne, choisi d'un double clic, puis retapé lettre après lettre
  const mot = U.boite("survol-mot", "mot");
  const pMot = U.point(mot);
  U.viser(tl, id, { x: propose.x, y: propose.y - 10, l: propose.l, h: 170 }, 2.1, m("vous") - 0.7, 0.9);
  U.aller(tl, id, pMot, m("vous") - 0.4, 0.6);
  U.montrer(tl, id, "survol-mot", m("vous") + 0.15, 0);
  const tChoisi = m("ajuster") - 0.15;
  U.cliquer(tl, id, pMot, tChoisi);
  U.cliquer(tl, id, pMot, tChoisi + 0.16);
  U.montrer(tl, id, "mot-choisi", tChoisi + 0.2, 0);
  U.cacherCurseur(tl, id, tChoisi + 0.4);
  const tFrappe = tChoisi + 0.6;
  window.bruit("clavier", tFrappe, 0.9);
  for (let i = 1; i <= lettres; i += 1) U.montrer(tl, id, `mot-retouche-${i}`, tFrappe + (i - 1) * 0.1, 0);
  U.montrer(tl, id, "mot-retouche", tFrappe + lettres * 0.1, 0);

  // « Utiliser » : la consigne et la liste remplacent celles de la scène
  const utiliser = U.boite("consigne-proposee", "utiliser");
  const pUtiliser = U.point(utiliser);
  const tVers = Math.max(m("puis", 2) - 0.2, tFrappe + lettres * 0.1 + 0.5);
  U.viser(tl, id, { x: propose.x - 10, y: propose.y - 50, l: propose.l + 20, h: propose.h + 70 }, 1.55, tVers - 0.1, 0.8);
  U.aller(tl, id, pUtiliser, tVers, 0.7);
  U.montrer(tl, id, "survol-utiliser", tVers + 0.7, 0.1);
  U.cadre(tl, id, utiliser, m("utiliser") - 0.3, 0.8, 5);
  const tUtiliser = m("utiliser") + 0.55;
  U.cliquer(tl, id, pUtiliser, tUtiliser);
  U.montrer(tl, id, "consigne-utilisee", tUtiliser + 0.15, 0.3);
  U.cacherCurseur(tl, id, tUtiliser + 0.4);
  // la consigne et sa liste, dans la scène
  const consigne = U.boite("consigne-utilisee", "consigne"), liste = U.boite("consigne-utilisee", "liste");
  U.viser(tl, id, { x: 792, y: consigne.y - 40, l: 633, h: liste.y + liste.h - consigne.y + 70 }, 1.5, tUtiliser + 0.3, Math.min(0.9, fin - tUtiliser - 0.4));
};
