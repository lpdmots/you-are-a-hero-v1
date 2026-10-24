// Passage 7 — On prépare ensemble : la Préparation projetée au tableau, ses étapes qui se cochent
// au mot près, une idée d'élève retenue qui devient une partie, puis les idées de l'IA.
window.SCENES.p07 = (tl, t0) => {
  const id = "p07";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = window.dureeDe(id);
  const q = (s) => `#p07-${s}`;

  window.entreeParNumero(tl, id, 2, t0);
  tl.fromTo(q("filet"), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, T(0.95));
  tl.fromTo(q("titre"), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, T(1.0));
  tl.fromTo(q("prep"), { y: 90, opacity: 0, rotationX: 12, transformPerspective: 1800, transformOrigin: "50% 0%" }, { y: 0, opacity: 1, rotationX: 0, duration: 1.2, ease: "expo.out" }, T(1.1));

  // « au tableau » : la note à la main et sa flèche
  tl.fromTo(q("note"), { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 0.8, ease: "power1.inOut" }, m("tableau") - 0.25);
  tl.fromTo(q("fleche"), { strokeDasharray: 170, strokeDashoffset: 170 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.inOut" }, m("tableau") + 0.25);
  tl.fromTo(q("pointe"), { strokeDasharray: 60, strokeDashoffset: 60 }, { strokeDashoffset: 0, duration: 0.18, ease: "power1.out" }, m("tableau") + 0.68);

  // « Étape par étape » : le titre se range en haut à gauche, l'écran grandit jusqu'à remplir la largeur
  const K = 1.15, X0 = -6, Y0 = 150;
  const W = (xl, yl) => ({ x: X0 + xl * K, y: Y0 + yl * K });
  // (la note et sa flèche restent lisibles une seconde avant que l'écran grandisse)
  const tZoom = Math.min(Math.max(m("etape") - 0.45, m("tableau") + 1.3), m("monde") - 1.1);
  tl.to(q("entete"), { x: -66, y: -58, scale: 0.5, duration: 1.0, ease: "power3.inOut" }, tZoom);
  tl.to([q("note"), q("fleche-svg")], { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, tZoom);
  tl.to(q("cadre"), { x: X0 - 120 * K, y: Y0 - 272 * K, scale: K, duration: 1.0, ease: "power3.inOut" }, tZoom);

  // Les étapes, une à une ; la question et ce que la classe retient changent avec elles
  const reperes = [m("monde"), m("heros"), m("jeu"), m("lieux")];
  reperes.forEach((t, i) => {
    const n = i + 1;
    const avant = t - 0.15;
    tl.fromTo(`${q("e" + n)} .surligne`, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, avant);
    tl.fromTo(q("q" + n), { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, avant);
    tl.fromTo(q("v" + n), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, avant + 0.05);
    tl.fromTo(`${q("s" + n)} > *`, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.06 }, avant + 0.08);
    if (n > 1) {
      tl.to(`${q("e" + (n - 1))} .surligne`, { opacity: 0, duration: 0.25, ease: "power1.out" }, avant);
      tl.fromTo(`${q("e" + (n - 1))} .ok`, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2.6)" }, avant);
      tl.to(q("q" + (n - 1)), { y: -70, opacity: 0, duration: 0.3, ease: "power2.in" }, avant - 0.12);
      tl.to(q("v" + (n - 1)), { y: -40, opacity: 0, duration: 0.28, ease: "power2.in" }, avant - 0.1);
      tl.to(q("s" + (n - 1)), { opacity: 0, duration: 0.2, ease: "power1.in" }, avant - 0.12);
    }
  });
  // Grandes étapes : deux parties tombent dans la liste ; la troisième viendra d'une idée
  tl.fromTo([q("pa1"), q("pa2")], { x: 70, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.16 }, reperes[3] + 0.1);
  tl.set(q("pa3"), { opacity: 0 }, T(0));

  // « Les élèves proposent » : trois idées arrivent, chacune avec son prénom
  const tIdees = m("proposent") - 0.35;
  tl.to(q("s4"), { opacity: 0, x: -20, duration: 0.3, ease: "power2.in" }, tIdees - 0.3);
  tl.fromTo(q("label"), { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, tIdees);
  [["i1", -2.2], ["i2", 1.6], ["i3", -1.1]].forEach(([k, r], i) =>
    tl.fromTo(q(k), { y: 40, opacity: 0, rotation: r }, { y: 0, opacity: 1, rotation: 0, duration: 0.6, ease: "back.out(1.6)" }, tIdees + 0.1 + i * 0.13),
  );
  tl.fromTo(q("noter"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, tIdees + 0.45);

  // « vous retenez » : un clic sur l'idée de Malo, qui rejoint la liste et devient la partie 3
  const tRetient = m("retenez");
  const C = W(56 + 360, 104 + 326 + 36);
  window.curseurVers(tl, q("curseur"), { x: C.x + 380, y: C.y + 240, o: 0 }, C, tRetient - 0.85, 0.7);
  window.clic(tl, q("curseur"), q("clic"), C.x, C.y, tRetient - 0.12);
  tl.fromTo(q("i2ok"), { opacity: 0 }, { opacity: 1, duration: 0.18 }, tRetient - 0.1);
  tl.fromTo(`${q("i2ok")} .pastille`, { scale: 0 }, { scale: 1, duration: 0.4, ease: "back.out(3)" }, tRetient - 0.08);
  tl.to([q("i1"), q("i3")], { opacity: 0, x: -24, duration: 0.35, ease: "power2.in", stagger: 0.05 }, tRetient + 0.45);
  tl.to(q("i2"), { x: 830, y: 62 + 8, scale: 0.92, duration: 0.75, ease: "power3.inOut" }, tRetient + 0.5);
  tl.to(q("i2"), { opacity: 0, duration: 0.25 }, tRetient + 1.05);
  tl.fromTo(q("pa3"), { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2)", immediateRender: false }, tRetient + 1.0);
  tl.to(q("label"), { opacity: 0, duration: 0.3 }, tRetient + 0.5);

  // « l'IA vous souffle des idées » : la pastille palpite, un clic, trois idées s'ouvrent
  const tIA = m("ia");
  const P = W(56 + 290 + 37, 104 + 478 + 31);
  tl.fromTo(q("halo"), { opacity: 0.9, scale: 0.8 }, { opacity: 0, scale: 1.6, duration: 0.9, ease: "power2.out", repeat: 1 }, tIA - 0.35);
  window.curseurVers(tl, q("curseur"), C, P, tIA - 0.55, 0.65);
  window.clic(tl, q("curseur"), q("clic"), P.x, P.y, m("souffle") - 0.3);
  tl.to(q("ia"), { scale: 0.9, duration: 0.08, yoyo: true, repeat: 1 }, m("souffle") - 0.3);
  window.bruit("etincelles", m("souffle"), 0.6);
  ["a1", "a2", "a3"].forEach((k, i) => {
    const t = m("souffle") + i * 0.14;
    tl.fromTo(q(k), { x: -40, opacity: 0, scale: 0.95 }, { x: 0, opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" }, t);
    tl.fromTo(`${q(k)} .reflet`, { left: "-40%" }, { left: "140%", duration: 0.9, ease: "sine.inOut" }, t + 0.2);
  });
  tl.to(q("curseur"), { opacity: 0, duration: 0.3 }, m("souffle") + 0.4);

  // Le choix vers le passage 3, dès que la voix se tait : le temps de le lire avant le clic
  const tChoix = Math.min(T(window.finVoix(id)) + 0.1, T(fin - 2.0));
  tl.fromTo(q("filet-choix"), { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power3.out" }, tChoix);
  tl.fromTo(q("choix"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, tChoix + 0.1);
  window.sortieParRenvoi(tl, id, 1800 - 38, 968 + 24, T(fin));
};
