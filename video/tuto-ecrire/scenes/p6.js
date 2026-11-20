// Passage 6 — « De votre côté, vous retrouvez sa scène dans le Suivi, marquée « À valider ». Et
// pour découvrir comment la relire, la corriger et la valider, rendez-vous dans le septième tuto ! »
// L'ordinateur de Mme Laurent : « Chemins », le « 1 » sur « Suivi » ; le Suivi, « La carte qui
// brille » « À valider » ; puis la phrase de choix vers le tuto 7, le papier qui couvre l'écran, le logo.
window.SCENES.p6 = (tl, t0) => {
  const id = "p6";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p6-${s}`;
  const fv = T(window.finVoix(id));
  U.feuille(id, ["chemins-apres", "survol-suivi", "suivi"]);
  U.reprendre(tl, id, null, t0);
  U.viser(tl, id, { x: 0, y: 150, l: 1200, h: 520 }, 1.2, t0, 0.01);
  U.arrivee(tl, id, t0, "droite");

  // « Suivi », dans la colonne, avec le nombre de scènes à valider
  const suivi = U.boite("chemins-apres", "suivi");
  const pSuivi = U.point(suivi, 0.3);
  U.aller(tl, id, pSuivi, m("retrouvez") - 0.3, 0.7);
  U.montrer(tl, id, "survol-suivi", m("retrouvez") + 0.35, 0.15);
  U.cadre(tl, id, suivi, m("suivi") - 0.25, 1.0, 5);
  const tSuivi = m("suivi") + 0.5;
  U.cliquer(tl, id, pSuivi, tSuivi);
  U.montrer(tl, id, "suivi", tSuivi + 0.15, 0.3);
  U.cacherCurseur(tl, id, tSuivi + 0.4);
  // sa scène, « À valider »
  U.viser(tl, id, { x: 250, y: 220, l: 1160, h: 260 }, 1.3, tSuivi + 0.3, 0.9);
  U.cadre(tl, id, U.boite("suivi", "tampon"), Math.max(m("valider") - 0.2, tSuivi + 1.1), 1.4, 5);
  // la caméra recule sur tout le Suivi
  U.plan(tl, id, m("pour") - 0.4, 1.6);

  // « Pour relire et valider, rendez-vous au tuto 7 », après la voix
  const tChoix = m("decouvrir") - 0.1;
  tl.fromTo(q("bas"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, tChoix);
  tl.fromTo(q("filet-choix"), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out" }, tChoix);
  tl.fromTo(q("choix"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, tChoix + 0.1);
  const r = { x: 1626, y: 1033 }; // le centre de la pastille du renvoi
  const tClic = Math.max(fv + 0.5, m("septieme") + 1.2);
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
