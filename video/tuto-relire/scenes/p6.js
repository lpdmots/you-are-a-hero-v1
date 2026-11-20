// Passage 6 — « Cette fois, si le texte vous convient, cliquez sur « Valider le travail élève ». La
// scène est terminée pour lui, et l'application vous propose directement la suivante à valider. Pour
// découvrir comment composer votre livre, rendez-vous dans le huitième tuto ! » L'ordinateur de
// Mme Laurent : la scène, son nouveau paragraphe ; « Valider le travail élève » : « Validé » et
// « Suivante à valider : S003 » ; puis la phrase de choix vers le tuto 8, le voile, le logo.
window.SCENES.p6 = (tl, t0) => {
  const id = "p6";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p6-${s}`;
  const fv = T(window.finVoix(id));
  U.feuille(id, ["scene-remise", "survol-valider", "validee", "survol-suivante"]);
  U.reprendre(tl, id, null, t0);
  U.viser(tl, id, { x: 240, y: 60, l: 1180, h: 520 }, 1.2, t0, 0.01);
  U.arrivee(tl, id, t0, "droite");

  // « le texte vous convient ? » : le paragraphe que Sacha a ajouté
  U.viser(tl, id, { x: 256, y: 366, l: 760, h: 220 }, 1.7, T(0.9), 0.9);
  U.cadre(tl, id, { x: 316, y: 472, l: 680, h: 70 }, Math.max(m("texte") - 0.1, T(1.6)), 1.1, 5);

  // « Valider le travail élève »
  U.viser(tl, id, { x: 1013, y: 160, l: 400, h: 230 }, 1.9, m("convient") + 0.2, 0.9);
  const valider = U.boite("scene-remise", "valider");
  const pValider = U.point(valider, 0.45);
  U.aller(tl, id, pValider, m("cliquez") - 0.2, 0.7);
  U.montrer(tl, id, "survol-valider", m("cliquez") + 0.45, 0.15);
  U.cadre(tl, id, valider, m("valider") - 0.1, 1.2, 5);
  const tValider = Math.max(m("eleve") + 0.35, m("valider") + 1.2);
  U.cliquer(tl, id, pValider, tValider);
  U.montrer(tl, id, "validee", tValider + 0.15, 0.3);
  U.cacherCurseur(tl, id, tValider + 0.4);

  // « Validé » : terminée pour lui ; puis « Suivante à valider »
  U.viser(tl, id, { x: 1013, y: 60, l: 400, h: 330 }, 1.6, tValider + 0.3, 0.9);
  U.cadre(tl, id, U.boite("validee", "tampon"), Math.max(m("terminee") - 0.2, tValider + 1.0), 1.3, 5);
  const suivante = U.boite("validee", "suivante");
  const pSuivante = U.point(suivante, 0.55);
  U.aller(tl, id, pSuivante, m("propose") - 0.3, 0.7);
  U.montrer(tl, id, "survol-suivante", m("propose") + 0.35, 0.15);
  U.cadre(tl, id, suivante, m("suivante") - 0.3, 1.6, 5);
  U.cacherCurseur(tl, id, m("valider", 2) + 1.0);
  // la caméra recule sur toute la scène
  U.plan(tl, id, m("pour", 2) - 0.4, 1.6);

  // « Pour composer le livre, rendez-vous au tuto 8 », après la voix
  const tChoix = m("decouvrir") - 0.1;
  tl.fromTo(q("bas"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, tChoix);
  tl.fromTo(q("filet-choix"), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out" }, tChoix);
  tl.fromTo(q("choix"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, tChoix + 0.1);
  const r = { x: 1626, y: 1033 }; // le centre de la pastille du renvoi
  const tClic = Math.max(fv + 0.5, m("huitieme") + 1.2);
  window.bruit("clic", tClic, 0.7);
  window.bruit("souffle", tClic + 0.12, 0.8);
  tl.fromTo(q("curseur-fin"), { x: r.x + 300, y: r.y + 120, opacity: 0, rotation: -8 }, { x: r.x - 4, y: r.y - 2, opacity: 1, rotation: 0, duration: 0.75, ease: "power3.out", immediateRender: false }, tClic - 0.8);
  tl.to(q("curseur-fin"), { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }, tClic);
  tl.fromTo(q("clic-fin"), { x: r.x, y: r.y, scale: 0.3, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, tClic);
  tl.to(`${q("sortie")} .plein`, { opacity: 1, duration: 0.12 }, tClic);
  tl.fromTo(q("voile"), { clipPath: `circle(0px at ${r.x}px ${r.y}px)`, opacity: 1 }, { clipPath: `circle(2300px at ${r.x}px ${r.y}px)`, duration: 0.95, ease: "power3.in" }, tClic + 0.1);

  // le logo, sur le papier
  const tLogo = tClic + 0.9;
  window.bruit("etincelles", tLogo + 0.2, 0.5);
  tl.fromTo("#p6-logo #symbole", { scale: 0, rotation: -12, transformOrigin: "50% 60%" }, { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.8)" }, tLogo);
  tl.fromTo("#p6-logo #nom", { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 1.0, ease: "power1.inOut" }, tLogo + 0.15);
  tl.fromTo(q("suite"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, tLogo + 0.8);
};
