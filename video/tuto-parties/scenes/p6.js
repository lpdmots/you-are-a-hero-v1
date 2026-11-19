// Passage 6 — « Et voilà, vos chapitres sont prêts à accueillir leurs premières scènes ! Pour
// découvrir comment faire écrire vos élèves, rendez-vous dans le cinquième tuto ! » Tout le plan,
// chaque chapitre avec ses élèves ; puis la phrase de choix vers le tuto 5, le papier qui couvre
// l'écran, le logo.
window.SCENES.p6 = (tl, t0) => {
  const id = "p6";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p6-${s}`;
  const fv = T(window.finVoix(id));
  U.feuille(id, ["attribue"]);
  U.reprendre(tl, id, "p5", t0);

  // tout le plan, de la première partie à la dernière ; la caméra recule sur toute la feuille
  const tous = U.page(tl, id, "tous-attribues", 232, 140, t0);
  U.plan(tl, id, T(0.3), 1.4);
  tous.aller(931, Math.max(m("chapitres") - 0.3, T(0.6)), 3.6, "sine.inOut");

  // « Pour faire écrire vos élèves, rendez-vous au tuto 5 », pendant que la voix le dit
  const tChoix = m("decouvrir") - 0.1;
  tl.fromTo(q("bas"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, tChoix);
  tl.fromTo(q("filet-choix"), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out" }, tChoix);
  tl.fromTo(q("choix"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, tChoix + 0.1);
  const r = { x: 1626, y: 1033 }; // le centre de la pastille du renvoi
  const tClic = Math.max(fv + 0.5, m("cinquieme") + 1.2);
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
