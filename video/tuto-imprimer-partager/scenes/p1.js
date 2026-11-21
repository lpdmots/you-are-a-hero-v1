// Passage 1 — « Votre mise en page est terminée ? Il ne reste plus qu'à imprimer et partager votre
// livre ! » L'ouverture : le titre du tuto, deux morceaux entiers de vrais écrans (le livre ouvert
// dans le lecteur ; la carte « Privé », ses deux partages activés), le dragon et la souris au petit
// livre ; puis tout se retire
// vers le haut, et la feuille de l'application monte.
window.SCENES.p1 = (tl, t0) => {
  const id = "p1";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p1-${s}`;
  const fin = T(window.dureeDe(id));
  // un morceau de capture (sa version : le studio ne garde pas l'ancienne), dans la boîte b (points),
  // posé à la largeur l (pixels de la vidéo)
  const poser = (sel, nom, b, l) => {
    const f = U.fichier(nom);
    const e = l / b.l;
    const boite = document.querySelector(sel);
    boite.style.width = `${l}px`;
    boite.style.height = `${Math.round(b.h * e)}px`;
    const img = boite.querySelector("img");
    img.src = f.src;
    img.style.cssText = `left:${-b.x * e}px;top:${-b.y * e}px;width:${1440 * e}px;height:${f.boites._fenetre.h * e}px`;
  };
  // le livre, ouvert dans le lecteur en ligne : son titre et le portrait des héros (mesurés sur la capture)
  poser("#p1-fiche", "lecteur", { x: 380, y: 88, l: 666, h: 472 }, 470);
  // la carte « Privé » : ses deux interrupteurs activés et le lien pour les familles, jusqu'à
  // « Changer de lien… » (mesuré sur la capture), avant « À jour depuis… »
  const prive = U.boite("copie", "prive");
  poser("#p1-page", "copie", { x: prive.x, y: prive.y, l: prive.l, h: 486 - prive.y }, 600);

  tl.fromTo(q("titre"), { clipPath: "inset(-20% 105% -20% -5%)" }, { clipPath: "inset(-20% -5% -20% -5%)", duration: 1.0, ease: "power2.inOut" }, T(0.15));
  tl.fromTo(q("sur"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, T(0.5));
  // les deux morceaux se posent sur la table, l'un après l'autre
  tl.fromTo(q("fiche"), { y: 80, rotation: -8, opacity: 0 }, { y: 0, rotation: -3, opacity: 1, duration: 0.9, ease: "power3.out" }, Math.max(T(0.9), m("mise") - 0.1));
  tl.fromTo(q("page"), { y: 90, rotation: 7, opacity: 0 }, { y: 0, rotation: 2, opacity: 1, duration: 0.9, ease: "power3.out" }, Math.max(T(1.5), m("terminee") - 0.1));
  // les trois repères, l'un après l'autre, sur « Il ne reste plus… »
  tl.fromTo(`${q("sous")} > *`, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.15 }, m("reste") - 0.1);
  // le dragon passe la tête, puis hoche doucement
  tl.fromTo(q("dragon"), { y: 260, rotation: -6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.5)" }, m("imprimer"));
  tl.to(q("dragon"), { rotation: 3, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, m("livre") + 0.1);
  // la souris au petit livre arrive à côté, puis se balance (petits angles)
  tl.fromTo(q("souris"), { y: 220, rotation: 6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.7, ease: "back.out(1.6)" }, m("partager") - 0.1);
  tl.to(q("souris"), { rotation: -4, duration: 0.45, yoyo: true, repeat: 1, ease: "sine.inOut" }, m("livre") + 0.3);
  // tout se retire vers le haut : la feuille de l'application arrive d'en bas
  tl.to([q("sur"), q("entete"), q("sous"), q("camera")], { y: -1100, duration: 0.9, ease: "power3.in", stagger: 0.04 }, fin - 0.9);
};
