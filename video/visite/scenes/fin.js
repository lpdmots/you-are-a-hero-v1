// Fin — « Il était une fois une classe… qui a écrit son livre. » La cursive s'écrit, « fois » se
// barre et « classe » s'écrit au-dessus, comme une correction ; puis le logo, le slogan, l'adresse ;
// le dragon s'endort sur son livre, la souris grignote. La dernière image reste sur le logo.
window.SCENES.fin = (tl, t0) => {
  const id = "fin";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = window.dureeDe(id);
  const q = (s) => `#fin-${s}`;
  const ecrire = (sel, t, d) => tl.fromTo(sel, { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: d, ease: "power1.inOut" }, t);

  tl.fromTo(`#s-fin .fond`, { opacity: 0 }, { opacity: 1, duration: 0.6 }, T(0));
  window.bruit("stylo", m("il") - 0.05, 0.3);
  ecrire(q("w1"), m("il") - 0.05, 0.3);
  ecrire(q("w2"), m("etait") - 0.05, 0.4);
  ecrire(q("w3"), m("une", 1) - 0.05, 0.3);
  ecrire(q("w4"), m("fois") - 0.05, 0.4);
  // « fois » écrit, son cadre s'ouvre : la correction au-dessus ne doit pas être coupée
  tl.set(q("w4"), { clipPath: "none" }, m("fois") + 0.4);
  // La correction de la maîtresse : « fois » barré, « classe » au-dessus
  tl.fromTo(`${q("w4")} .barre`, { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 0.35, ease: "power2.out" }, m("classe") - 0.3);
  ecrire(q("classe"), m("classe") - 0.02, 0.55);

  // « qui a écrit son livre » : la phrase s'efface, le logo s'assemble
  const tLogo = m("ecrit") - 0.35;
  window.bruit("etincelles", tLogo + 0.3, 0.55);
  tl.to(q("phrase"), { opacity: 0, y: -40, duration: 0.45, ease: "power2.in" }, tLogo);
  tl.fromTo("#fin-logo #symbole", { scale: 0, rotation: -12, transformOrigin: "50% 60%" }, { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.8)" }, tLogo + 0.3);
  tl.fromTo("#fin-logo #nom", { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 1.0, ease: "power1.inOut" }, tLogo + 0.45);
  tl.fromTo(q("slogan"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, m("livre") + 0.25);
  tl.fromTo(`${q("infos")} > *`, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", stagger: 0.08 }, m("livre") + 0.6);

  // Le dragon s'endort sur son livre ; la souris grignote un coin
  const tPerso = m("livre") + 0.7;
  tl.fromTo(q("dragon"), { y: 300, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "power3.out" }, tPerso);
  const reste = T(fin) - (tPerso + 1.1);
  tl.to(q("dragon"), { scaleY: 1.025, duration: 1.3, yoyo: true, repeat: Math.max(1, Math.floor(reste / 1.3) - 1), ease: "sine.inOut" }, tPerso + 1.1);
  // en marionnette : l'aile qui se soulève avec le souffle, l'oreille qui frémit
  const dragon = window.marionnette(document.getElementById("fin-dragon-m"), "assets/dragon-endormi.webp", window.DRAGON_ENDORMI);
  window.animerDragonEndormi(tl, dragon, tPerso + 1.1, reste);
  // Les « Z » du sommeil : au-dessus de la tête, ils montent en grandissant, l'un après l'autre
  const cycle = 2.1, tours = Math.max(1, Math.floor((reste - 0.3) / cycle));
  [["z1", 0], ["z2", 0.45], ["z3", 0.9]].forEach(([k, d], i) =>
    tl.fromTo(q(k), { x: 330 + i * 34, y: 770 - i * 46, opacity: 0, scale: 0.5, rotation: -12 }, { keyframes: { opacity: [0, 0.9, 0.9, 0], scale: [0.5, 1, 1.1, 1.15], rotation: [-12, 0, 6, 10], y: [770 - i * 46, 740 - i * 46, 715 - i * 46, 695 - i * 46], x: [330 + i * 34, 345 + i * 34, 360 + i * 34, 372 + i * 34] }, duration: 1.6, ease: "none", repeat: tours - 1, repeatDelay: cycle - 1.6 }, tPerso + 1.3 + d),
  );
  // La souris arrive, grignote par petites secousses ; des miettes de papier tombent
  tl.fromTo(q("souris"), { y: 220, opacity: 0, rotation: 8 }, { y: 0, opacity: 1, rotation: 0, duration: 0.8, ease: "back.out(1.6)" }, tPerso + 0.6);
  // la souris en marionnette (marionnette.js) : queue, oreilles, yeux, bouchées, miettes
  const boite = document.querySelector(q("souris-m"));
  const souris = window.marionnetteSouris(boite, "assets/souris-grignote.png");
  const miettes = [0, 1, 2, 3].map(() => { const d = document.createElement("i"); d.className = "miette"; boite.appendChild(d); return d; });
  window.animerSouris(tl, souris, tPerso + 1.3, T(fin) - (tPerso + 1.3), miettes);
};
