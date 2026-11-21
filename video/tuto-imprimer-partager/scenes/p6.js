// Passage 6 — « Et voilà, votre livre est terminé, et prêt à être lu ! Bravo à vous et à tous vos élèves
// pour cette belle aventure ! » « Ouvrir », à côté du lien pour les familles : le livre dans le lecteur
// en ligne, comme le liront les familles. Puis la fin de la série, sans tuto suivant : le voile, le
// logo, « Tous les tutos dans l'Aide », et le dragon qui tient son livre, fier.
window.SCENES.p6 = (tl, t0) => {
  const id = "p6";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p6-${s}`;
  const fv = T(window.finVoix(id));
  U.feuille(id, ["propose", "propose-calme", "survol-ouvrir", "lecteur"]);
  U.reprendre(tl, id, "p5", t0);

  // « Et voilà » : « Ouvrir », le lien pour les familles
  U.montrer(tl, id, "propose-calme", T(0.1), 0.4);
  const ouvrir = U.boite("propose-calme", "ouvrirLien");
  const pOuvrir = U.point(ouvrir, 0.5);
  U.viser(tl, id, { x: 256, y: 200, l: 760, h: 300 }, 1.6, T(0.0), 0.8);
  U.aller(tl, id, pOuvrir, T(0.3), 0.6);
  U.montrer(tl, id, "survol-ouvrir", T(0.85), 0.1);
  U.cadre(tl, id, ouvrir, T(0.8), 0.7, 4);
  const tOuvrir = Math.max(T(1.25), m("voila") + 0.3);
  U.cliquer(tl, id, pOuvrir, tOuvrir);
  U.cacherCurseur(tl, id, tOuvrir + 0.25);
  // le livre, ouvert dans le lecteur : la caméra recule sur sa page de titre
  U.montrer(tl, id, "lecteur", tOuvrir + 0.2, 0.25);
  // la ligne du bas du lecteur (« Écrit avec Il était une classe »), coupée par le bord de la
  // fenêtre, est couverte du blanc de la page (mesurée sur la capture : y 800 à 810)
  const f = document.getElementById(`${id}-feuille`);
  const blanc = document.createElement("div");
  blanc.className = "morceau";
  blanc.id = `${id}-bas-lecteur`;
  blanc.style.cssText = `left:0;top:794px;width:${U.W}px;height:${U.HT - 794}px;background:#fff;opacity:0`;
  f.insertBefore(blanc, f.querySelector(".clic-app"));
  tl.fromTo(`#${blanc.id}`, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power1.out", immediateRender: false }, tOuvrir + 0.2);
  U.plan(tl, id, tOuvrir + 0.3, 0.9);
  U.viser(tl, id, { x: 360, y: 90, l: 720, h: 560 }, 1.25, m("pret") - 0.2, 1.6);
  U.plan(tl, id, m("bravo") - 0.2, 1.4);

  // le voile, depuis le centre de l'écran, après la voix
  const tVoile = fv + 0.6;
  window.bruit("souffle", tVoile, 0.8);
  tl.fromTo(q("voile"), { clipPath: "circle(0px at 960px 540px)", opacity: 1 }, { clipPath: "circle(1200px at 960px 540px)", duration: 1.0, ease: "power3.in" }, tVoile);

  // le logo, sur le papier
  const tLogo = tVoile + 0.85;
  window.bruit("etincelles", tLogo + 0.2, 0.5);
  tl.fromTo("#p6-logo #symbole", { scale: 0, rotation: -12, transformOrigin: "50% 60%" }, { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.8)" }, tLogo);
  tl.fromTo("#p6-logo #nom", { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 1.0, ease: "power1.inOut" }, tLogo + 0.15);
  tl.fromTo(q("suite"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, tLogo + 0.8);

  // le dragon arrive avec son livre, se redresse, fier, puis un petit bond (petits angles)
  const tDragon = tLogo + 0.5;
  tl.fromTo(q("dragon"), { y: 140, rotation: 6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.6)", immediateRender: false }, tDragon);
  tl.to(q("dragon"), { rotation: -4, scaleY: 1.04, duration: 0.45, ease: "sine.out" }, tDragon + 0.9);
  tl.to(q("dragon"), { rotation: 0, scaleY: 1, duration: 0.45, ease: "sine.inOut" }, tDragon + 1.35);
  tl.to(q("dragon"), { y: -22, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }, tDragon + 1.95);
  tl.to(q("dragon"), { rotation: 3, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, tDragon + 2.6);
};
