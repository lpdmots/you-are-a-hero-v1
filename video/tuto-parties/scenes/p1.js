// Passage 1 — l'ouverture : le titre du tuto, le plan d'une histoire rangée en chapitres, le
// dragon qui regarde ; puis tout se retire vers le haut, et la feuille de l'application monte à sa
// place (passage 2).
window.SCENES.p1 = (tl, t0) => {
  const id = "p1";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p1-${s}`;
  const fin = T(window.dureeDe(id));
  // la photo est une capture : sa version, pour que le studio ne garde pas l'ancienne
  document.querySelector("#p1-photo img").src = window.TUTO.fichier("tous-attribues").src;

  tl.fromTo(q("titre"), { clipPath: "inset(-20% 105% -20% -5%)" }, { clipPath: "inset(-20% -5% -20% -5%)", duration: 1.0, ease: "power2.inOut" }, T(0.15));
  tl.fromTo(q("sur"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, T(0.5));
  // le plan de l'histoire se pose sur la table sur « les grandes étapes de votre histoire »
  tl.fromTo(q("photo"), { y: 80, rotation: 6, opacity: 0 }, { y: 0, rotation: 2, opacity: 1, duration: 0.9, ease: "power3.out" }, m("histoire") - 0.5);
  // les trois repères, l'un après l'autre, sur « Voyons maintenant… »
  tl.fromTo(`${q("sous")} > *`, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.15 }, m("voyons") - 0.1);
  // le dragon passe la tête, puis hoche doucement
  tl.fromTo(q("dragon"), { y: 260, rotation: -6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.5)" }, m("voyons") + 0.2);
  tl.to(q("dragon"), { rotation: 3, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, m("chapitres") + 0.1);
  // tout se retire vers le haut : la feuille de l'application arrive d'en bas
  tl.to([q("sur"), q("entete"), q("sous"), q("camera")], { y: -1100, duration: 0.9, ease: "power3.in", stagger: 0.04 }, fin - 0.9);
};
