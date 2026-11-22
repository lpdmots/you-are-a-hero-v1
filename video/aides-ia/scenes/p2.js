// Passage 2 — « Cette scène n'a pas encore de consigne. Dictez votre idée comme elle vous vient. »
// « Chemins » du chapitre « La rivière aux reflets », sa seule scène ; un clic sur la carte ouvre
// l'espace de travail ; le micro de la consigne : la pastille et son temps, la phrase dite par
// l'enseignante (sa voix, et ses mots au bas de la table), puis le texte entendu dans le champ.
window.SCENES.p2 = (tl, t0) => {
  const id = "p2";
  const U = window.TUTO, A = window.AIDES;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  const secondes = Object.keys(window.BOITES.ecrans).filter((c) => /^\d+-dictee-\d+$/.test(c)).length;
  U.feuille(id, [
    "chemins", "survol-carte", "panneau", "survol-micro",
    ...Array.from({ length: secondes }, (_, i) => `dictee-${i + 1}`), "dictee-transcrit", "dictee-posee",
  ]);
  U.reprendre(tl, id, null, t0);
  U.arrivee(tl, id, t0, "bas");
  const solde = A.solde(id, [30]);
  document.querySelector(solde.sel).style.opacity = 0;
  solde.montrer(tl, T(0.9));

  // « Cette scène » : la carte, dans « Chemins »
  const carte = U.boite("chemins", "carte");
  const pCarte = U.point(carte, 0.5, 0.45);
  U.viser(tl, id, { x: 232, y: 60, l: 1200, h: 560 }, 1.2, T(0.7), 0.9);
  U.aller(tl, id, pCarte, m("cette") - 0.1, 0.6);
  U.montrer(tl, id, "survol-carte", m("scene") - 0.05, 0.15);
  U.cadre(tl, id, carte, m("scene") - 0.1, 0.8, 6);
  const tCarte = m("scene") + 0.5;
  U.cliquer(tl, id, pCarte, tCarte);
  // l'espace de travail s'ouvre à droite, la colonne se replie : fondu court, puis la caméra s'approche
  U.montrer(tl, id, "panneau", tCarte + 0.15, 0.25);
  U.cacherCurseur(tl, id, tCarte + 0.3);
  // « pas encore de consigne » : le champ, vide
  const consigne = U.boite("panneau", "consigne");
  U.viser(tl, id, { x: 792, y: consigne.y - 150, l: 633, h: 400 }, 1.55, tCarte + 0.4, 0.9);
  // pendant la dictée, plus près : la pastille et son temps se lisent
  U.viser(tl, id, { x: 792, y: consigne.y - 90, l: 633, h: 300 }, 1.95, window.finVoix(id) + t0 - 0.4, 1.0);
  U.cadre(tl, id, consigne, Math.max(m("consigne") - 0.1, tCarte + 1.2), 1.2, 5);

  // « Dictez » : le micro, dans le coin du champ
  const micro = U.boite("panneau", "micro");
  const pMicro = U.point(micro);
  U.aller(tl, id, pMicro, m("dictez") - 0.2, 0.7);
  U.montrer(tl, id, "survol-micro", m("dictez") + 0.5, 0.15);
  U.cadre(tl, id, micro, m("dictez") + 0.4, 0.9, 6);
  const tMicro = window.finVoix(id) + t0 + 0.25;
  U.cliquer(tl, id, pMicro, tMicro);
  U.cacherCurseur(tl, id, tMicro + 0.5);
  // la pastille et son temps, seconde après seconde, pendant que l'enseignante parle
  for (let s = 1; s <= secondes; s += 1) U.montrer(tl, id, `dictee-${s}`, tMicro + (s === 1 ? 0.12 : s - 0.5), 0);
  const dit = A.dictee(tl, id, tMicro + 0.7);
  // second clic : l'enregistrement s'arrête, le texte entendu se pose dans le champ
  const tArret = Math.max(dit.fin + 0.5, tMicro + secondes - 0.2);
  tl.to(`#${id}-curseur`, { opacity: 1, duration: 0.2 }, tArret - 0.4);
  U.cliquer(tl, id, pMicro, tArret);
  U.montrer(tl, id, "dictee-transcrit", tArret + 0.1, 0);
  // la transcription : le micro respire, le temps réel de la réponse
  A.attente(tl, id, "dictee", tArret + 0.12, 0.9);
  U.montrer(tl, id, "dictee-posee", tArret + 1.0, 0.3);
  U.cacherCurseur(tl, id, tArret + 0.5);
  U.cadre(tl, id, consigne, tArret + 1.1, 0.9, 5);
  dit.cacher(Math.min(tArret + 1.7, fin - 0.45));
};
