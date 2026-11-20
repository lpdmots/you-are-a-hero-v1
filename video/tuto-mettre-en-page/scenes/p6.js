// Passage 6 — « Le résultat vous plaît ? Cliquez sur « La mise en page me convient ». Et pour découvrir
// comment imprimer et partager votre livre, rendez-vous dans le onzième tuto ! » « La mise en page me
// convient » : « Mise en page terminée », et « Imprimer et partager » ; puis la phrase de choix vers le
// tuto 11, le voile, le logo.
window.SCENES.p6 = (tl, t0) => {
  const id = "p6";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p6-${s}`;
  const fv = T(window.finVoix(id));
  U.feuille(id, ["apercu-fin", "survol-convient", "convient", "survol-imprimer"]);
  U.reprendre(tl, id, "p5", t0);

  // « Le résultat vous plaît ? » : la double page reste à l'écran, comme au passage 5
  // « Cliquez sur « La mise en page me convient » »
  const convient = U.boite("apercu-fin", "convient");
  const pConvient = U.point(convient, 0.5);
  U.viser(tl, id, { x: 880, y: 0, l: 540, h: 300 }, 2.0, m("cliquez") - 0.5, 0.9);
  U.aller(tl, id, pConvient, m("cliquez") - 0.1, 0.6);
  U.montrer(tl, id, "survol-convient", m("cliquez") + 0.45, 0.1);
  U.cadre(tl, id, convient, m("mise") - 0.1, 0.9, 5);
  const tConvient = m("convient") + 0.3;
  U.cliquer(tl, id, pConvient, tConvient);
  U.montrer(tl, id, "convient", tConvient + 0.15, 0.25);
  U.cacherCurseur(tl, id, tConvient + 0.4);
  // « Mise en page terminée », et « Imprimer et partager »
  U.cadre(tl, id, U.boite("convient", "terminee"), tConvient + 0.5, 1.2, 5);
  const imprimer = U.boite("convient", "imprimer");
  const pImprimer = U.point(imprimer, 0.45);
  U.aller(tl, id, pImprimer, m("decouvrir") - 0.2, 0.7);
  U.montrer(tl, id, "survol-imprimer", m("imprimer") - 0.05, 0.15);
  U.cadre(tl, id, imprimer, m("imprimer") + 0.1, 1.6, 5);
  U.cacherCurseur(tl, id, m("livre") + 0.2);
  // la caméra recule sur tout l'écran
  U.plan(tl, id, m("livre") + 0.1, 1.4);

  // « Pour imprimer et partager, rendez-vous au tuto 11 », après la voix
  const tChoix = m("rendez") - 0.1;
  tl.fromTo(q("bas"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, tChoix);
  tl.fromTo(q("filet-choix"), { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power3.out" }, tChoix);
  tl.fromTo(q("choix"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, tChoix + 0.1);
  const r = { x: 1632, y: 1033 }; // le centre de la pastille du renvoi
  const tClic = Math.max(fv + 0.5, m("onzieme") + 1.2);
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
