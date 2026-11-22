// Passage 1 — « Faire écrire un livre à toute une classe, ça demande du temps ! Heureusement, l'IA
// peut vous aider à plusieurs étapes. Mais ce sont toujours vos élèves qui écrivent leurs textes.
// Les boutons marqués d'une étoile ? Vous seul les voyez. Prenons une scène en exemple. » L'ouverture :
// le titre, des morceaux entiers de vrais écrans (la correction marquée au stylo, l'image de la scène),
// le dragon ; sur « étoile », un vrai bouton de l'IA s'allume ; puis tout se retire vers le haut.
window.SCENES.p1 = (tl, t0) => {
  const id = "p1";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p1-${s}`;
  const fin = T(window.dureeDe(id));
  // un morceau de capture dans la boîte b (points de la capture), posé à la largeur l (pixels de la vidéo)
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
  // le texte d'Inès, ses fautes barrées et corrigées (de la première à la dernière ligne marquée)
  const m1 = U.boite("correction", "marque1"), m7 = U.boite("correction", "marque7");
  poser("#p1-correction", "correction", { x: 304, y: m1.y - 14, l: 690, h: m7.y + m7.h - m1.y + 28 }, 720);
  // l'image de la scène, telle qu'elle est posée dans le texte
  const image = U.boite("image-gardee", "imageBloc");
  poser("#p1-image", "scene-finie-page", { x: image.x + 5, y: image.y + 5, l: image.l - 10, h: image.h - 10 }, 520);
  // un vrai bouton à étincelles : « Construire avec l'IA »
  const bouton = U.boite("panneau", "construire");
  poser("#p1-bouton", "panneau", bouton, 372);

  tl.fromTo(q("titre"), { clipPath: "inset(-20% 105% -20% -5%)" }, { clipPath: "inset(-20% -5% -20% -5%)", duration: 1.0, ease: "power2.inOut" }, T(0.15));
  tl.fromTo(q("sur"), { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, T(0.5));
  // les trois repères, l'un après l'autre, sur « ça demande du temps »
  tl.fromTo(`${q("sous")} > *`, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", stagger: 0.15 }, m("demande") - 0.1);
  // « l'IA peut vous aider » : la correction, puis l'image, se posent sur la table
  tl.fromTo(q("correction"), { y: 80, rotation: -8, opacity: 0 }, { y: 0, rotation: -2.5, opacity: 1, duration: 0.9, ease: "power3.out" }, m("heureusement") - 0.1);
  tl.fromTo(q("image"), { y: 90, rotation: 8, opacity: 0 }, { y: 0, rotation: 2.5, opacity: 1, duration: 0.9, ease: "power3.out" }, m("aider") - 0.1);
  // le dragon passe la tête sur « vos élèves », puis hoche doucement
  tl.fromTo(q("dragon"), { y: 260, rotation: -6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.5)" }, m("eleves") - 0.2);
  tl.to(q("dragon"), { rotation: 3, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" }, m("textes") + 0.1);
  // « Les boutons marqués d'une étoile ? » : un vrai bouton de l'IA, qui s'allume
  tl.fromTo(q("bouton"), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" }, m("boutons") - 0.15);
  window.bruit("etincelles", m("etoile"), 0.6);
  tl.fromTo(q("halo"), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, m("etoile"));
  tl.to(q("halo"), { scale: 1.12, opacity: 0, duration: 0.7, ease: "power1.out" }, m("etoile") + 0.5);
  tl.fromTo(q("halo"), { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out", immediateRender: false }, m("seul") - 0.1);
  tl.to(q("halo"), { scale: 1.12, opacity: 0, duration: 0.7, ease: "power1.out" }, m("seul") + 0.5);
  // tout se retire vers le haut : la feuille de l'application arrive d'en bas
  tl.to([q("sur"), q("entete"), q("sous"), q("camera")], { y: -1100, duration: 0.9, ease: "power3.in", stagger: 0.04 }, fin - 0.9);
};
