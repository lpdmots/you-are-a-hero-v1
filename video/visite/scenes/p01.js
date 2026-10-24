// Passage 1 — Ouverture : le grand livre ouvert, son titre en cursive, le dragon qui s'assoit,
// et le premier choix, « rendez-vous au 7 ».
window.SCENES.p01 = (tl, t0) => {
  const id = "p01";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = window.dureeDe(id);
  const tClic = fin - 1.05;

  window.bruit("page", T(0.6), 0.6);
  // Ouverture au papier, puis la caméra s'approche jusqu'au clic
  tl.fromTo("#p01-debut", { opacity: 1 }, { opacity: 0, duration: 1.0, ease: "sine.inOut" }, T(0.05));
  // Plan large sur le livre, puis la caméra s'avance vers la page de droite, qui devient lisible
  const S = 1.38, DX = -415, DY = 14;
  tl.fromTo("#p01-camera", { scale: 1, x: 0, y: 0 }, { scale: S, x: DX, y: DY, duration: 4.4, ease: "power2.inOut" }, T(1.5));

  tl.fromTo("#p01-livre", { y: 60, scale: 0.955, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 1.5, ease: "expo.out" }, T(0.1));
  // La page tourne de droite à gauche ; une ombre passe sur elle à mi-course
  tl.fromTo("#p01-tourne", { rotationY: 0, transformPerspective: 30000 }, { rotationY: -180, duration: 1.25, ease: "power2.inOut" }, T(0.6));
  tl.fromTo("#p01-ombre-r", { opacity: 0 }, { opacity: 1, duration: 0.62, ease: "power1.in" }, T(0.6));
  tl.fromTo("#p01-ombre-v", { opacity: 1 }, { opacity: 0, duration: 0.63, ease: "power1.out" }, T(1.22));
  tl.fromTo("#p01-image img", { scale: 1.12 }, { scale: 1, duration: 4.5, ease: "power2.out" }, T(0.6));

  // Le numéro du passage, puis le titre qui s'écrit, au rythme de la voix
  tl.fromTo("#p01-num", { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, T(0.95));
  tl.fromTo("#p01-num i", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power3.out", stagger: 0.08 }, T(1.0));
  // « Et si votre classe » s'écrit pendant « Et si, cette année, votre classe », puis le reste au mot
  const morceaux = gsap.utils.toArray("#p01-titre span");
  const reperes = [m("et"), m("ecrivait"), m("propre")];
  const durees = [Math.max(0.7, m("classe") + 0.2 - m("et")), 0.55, 0.65];
  morceaux.forEach((el, i) =>
    tl.fromTo(el, { clipPath: "inset(-100% 110% -100% -10%)", opacity: 1 }, { clipPath: "inset(-100% -10% -100% -10%)", duration: durees[i], ease: "power1.inOut" }, reperes[i] - 0.05),
  );
  tl.fromTo("#p01-recit", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, m("vrai") - 0.1);

  // Les deux choix glissent sous le texte
  tl.fromTo("#p01-choix1", { opacity: 0, x: -36 }, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" }, m("choisit") - 0.15);
  tl.fromTo("#p01-choix2", { opacity: 0, x: -24 }, { opacity: 0.55, x: 0, duration: 0.6, ease: "sine.out" }, m("choisit") + 0.05);

  // Le dragon arrive une fois, s'assoit, puis respire à peine
  // (premier plan : il glisse plus vite que le livre, d'où la profondeur)
  tl.fromTo("#p01-dragon", { x: 420, y: 260, opacity: 0, rotation: 8 }, { x: 0, y: 0, opacity: 1, rotation: 0, duration: 1.3, ease: "back.out(1.3)" }, T(3.0));
  const souffle = 1.6;
  tl.to("#p01-dragon", { scaleY: 1.015, scaleX: 0.995, duration: souffle, yoyo: true, repeat: Math.max(1, Math.floor((fin - 4.4) / souffle) - 1), ease: "sine.inOut" }, T(4.3));
  // en marionnette (marionnette.js) : ailes, bout de la queue, clignements
  const dragon = window.marionnette(document.getElementById("p01-dragon-m"), "assets/dragon-regarde.webp", window.DRAGON_ASSIS);
  window.animerDragonAssis(tl, dragon, T(4.1), fin - 4.1);
  // une petite bouffée de fumée par les narines, deux fois
  const boite = document.getElementById("p01-dragon-m");
  window.fumer(tl, boite, [[33, 196], [72, 212]], T(5.3));
  if (fin > 9.8) window.fumer(tl, boite, [[33, 196], [72, 212]], T(8.6));

  // Le clic sur le « 7 » : sa position à l'écran, la caméra étant arrêtée
  const local = { x: 210 + 806 + 548 - 2 - 33, y: -30 + 190 + 480 + 2 + 39 };
  const x = 960 + (local.x - 960) * S + DX, y = 540 + (local.y - 540) * S + DY;
  window.sortieParRenvoi(tl, id, x, y, T(fin));
};
