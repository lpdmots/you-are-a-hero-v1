// Passage 1 — « Toutes les scènes de votre histoire sont validées ? Voyons maintenant comment relire
// votre livre avant de le mettre en page. » L'ouverture : le titre du tuto, deux morceaux entiers de
// vrais écrans (la fiche « Relire » et ses quatre tâches faites, une page de l'aperçu du livre), le
// dragon qui regarde ; puis tout se retire vers le haut, et la feuille de l'application monte.
window.SCENES.p1 = (tl, t0) => {
  const id = "p1";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p1-${s}`;
  const fin = T(window.dureeDe(id));
  // deux morceaux de captures (leur version : le studio ne garde pas l'ancienne), en points × échelle
  const poser = (sel, nom, x, y, e) => {
    const img = document.querySelector(`${sel} img`);
    img.src = window.TUTO.fichier(nom).src;
    img.style.cssText = `left:${-x * e}px;top:${-y * e}px;width:${1440 * e}px;height:${810 * e}px`;
  };
  poser("#p1-fiche", "relu", 256, 12, 335 / 385);
  poser("#p1-page", "apercu-corrige", 880, 0, 406 / 521);

  tl.fromTo(q("titre"), { clipPath: "inset(-20% 105% -20% -5%)" }, { clipPath: "inset(-20% -5% -20% -5%)", duration: 1.0, ease: "power2.inOut" }, T(0.15));
  tl.fromTo(q("sur"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, T(0.5));
  // les deux morceaux se posent sur la table, l'un après l'autre
  tl.fromTo(q("fiche"), { y: 80, rotation: -8, opacity: 0 }, { y: 0, rotation: -3, opacity: 1, duration: 0.9, ease: "power3.out" }, Math.max(T(0.9), m("scenes") - 0.3));
  tl.fromTo(q("page"), { y: 90, rotation: 7, opacity: 0 }, { y: 0, rotation: 2, opacity: 1, duration: 0.9, ease: "power3.out" }, Math.max(T(1.5), m("validees") - 0.2));
  // les trois repères, l'un après l'autre, sur « Voyons maintenant… »
  tl.fromTo(`${q("sous")} > *`, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.15 }, m("voyons") - 0.1);
  // le dragon passe la tête, puis hoche doucement
  tl.fromTo(q("dragon"), { y: 260, rotation: -6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.5)" }, m("voyons") + 0.2);
  tl.to(q("dragon"), { rotation: 3, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, m("livre") + 0.1);
  // tout se retire vers le haut : la feuille de l'application arrive d'en bas
  tl.to([q("sur"), q("entete"), q("sous"), q("camera")], { y: -1100, duration: 0.9, ease: "power3.in", stagger: 0.04 }, fin - 0.9);
};
