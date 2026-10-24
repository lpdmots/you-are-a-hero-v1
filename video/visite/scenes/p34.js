// Passage 34 — Le livre se fait : les scènes tombent sur la table, prennent leur numéro, leurs
// chemins se vérifient ; elles deviennent des pages, une page tourne ; puis le livre imprimé, et
// la lecture en ligne sur un téléphone.
window.SCENES.p34 = (tl, t0) => {
  const id = "p34";
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = window.dureeDe(id);
  const q = (s) => `#p34-${s}`;
  const alea = window.hasard(34);

  window.entreeParNumero(tl, id, 5, t0);
  tl.fromTo(q("filet"), { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.out" }, T(0.95));
  tl.fromTo(q("titre"), { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "expo.out" }, T(1.0));

  // Les scènes du chapitre et leurs chemins (histoire d'essai)
  const cartes = {
    A: [130, 470, "Gué — les pierres qui chantent", 1],
    B: [560, 290, "Rivière — la pierre glissante", 14],
    C: [560, 670, "Saule — le nid de la chouette", 7],
    E: [990, 210, "Clairière — les cloches muettes", 3],
    D: [990, 560, "Rive — le moulin au loin", 22],
    G: [1420, 210, "Clocher — l’écho du passeur", 18],
    F: [1420, 560, "Moulin — la roue noyée", 31],
  };
  const liens = [["A", "B"], ["A", "C"], ["B", "E"], ["B", "D"], ["C", "D"], ["E", "G"], ["D", "F"]];
  const zone = document.querySelector(q("cartes"));
  zone.innerHTML = Object.entries(cartes)
    .map(([k, [x, y, titre, n]]) => {
      const faux = [0, 1, 2, 3, 4].map(() => 1 + Math.floor(alea() * 40));
      return `<div class="carte" id="p34-k${k}" style="left:${x}px;top:${y}px"><span class="num"><span class="defile">${[...faux, n].map((v) => `<span>${v}</span>`).join("")}</span></span><b>${titre}</b></div>`;
    })
    .join("");
  const svg = document.querySelector(q("liens"));
  const oks = document.querySelector(q("oks"));
  liens.forEach(([a, b], i) => {
    const [xa, ya] = cartes[a], [xb, yb] = cartes[b];
    const x1 = xa + 340, y1 = ya + 85, x2 = xb - 6, y2 = yb + 85;
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", `M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "#0b6a73");
    p.setAttribute("stroke-width", "4");
    p.setAttribute("stroke-linecap", "round");
    p.id = `p34-l${i}`;
    svg.appendChild(p);
    oks.insertAdjacentHTML("beforeend", `<span class="ok" id="p34-o${i}" style="left:${x2 - 30}px;top:${y2}px">${window.icone("coche")}</span>`);
  });

  // « Vient le plus beau moment » : les scènes tombent en vrac sur la table
  const tMoment = m("moment") - 0.7;
  window.bruit("cartes", tMoment + 0.15, 0.6);
  Object.keys(cartes).forEach((k, i) => {
    const vrac = { x: (alea() - 0.5) * 260, y: (alea() - 0.5) * 160, r: (alea() - 0.5) * 22 };
    tl.fromTo(q("k" + k), { x: vrac.x, y: vrac.y - 420, rotation: vrac.r * 1.6, opacity: 0, scale: 1.1 }, { x: vrac.x, y: vrac.y, rotation: vrac.r, opacity: 1, scale: 1, duration: 0.6, ease: "power3.out" }, tMoment + i * 0.07);
    // « numérote les passages » : chacune se range, son numéro défile puis s'arrête
    tl.to(q("k" + k), { x: 0, y: 0, rotation: 0, duration: 0.85, ease: "power3.inOut" }, m("numerote") - 0.35 + i * 0.04);
  });
  tl.to(q("entete"), { x: -66, y: -58, scale: 0.5, duration: 0.9, ease: "power3.inOut" }, m("numerote") - 0.35);
  tl.fromTo(`${q("cartes")} .num`, { scale: 0 }, { scale: 1, duration: 0.35, ease: "back.out(2.5)", stagger: 0.05 }, m("numerote") + 0.1);
  tl.fromTo(`${q("cartes")} .defile`, { y: 0 }, { y: -5 * 48, duration: 1.0, ease: "power3.out", stagger: 0.07 }, m("numerote") + 0.15);

  // « vérifie que chaque chemin mène quelque part » : les chemins se tracent, une coche au bout
  liens.forEach((_, i) => {
    const t = m("chemin") - 0.2 + i * 0.13;
    tl.fromTo(q("l" + i), { strokeDasharray: 600, strokeDashoffset: 600 }, { strokeDashoffset: 0, duration: 0.5, ease: "power2.inOut" }, t);
    tl.fromTo(q("o" + i), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(3)" }, t + 0.45);
  });
  window.bruit("tampon", m("quelque") + 0.5, 0.8);
  tl.fromTo(q("verifie"), { scale: 1.8, opacity: 0, rotation: -10 }, { scale: 1, opacity: 1, rotation: -2, duration: 0.25, ease: "power4.in" }, m("quelque") + 0.3);

  // « met le livre en page » : les cartes se fondent dans une double page, puis une page tourne
  const tPage = m("met") - 0.2;
  tl.to([q("cartes"), q("liens"), q("oks"), q("verifie")], { opacity: 0, scale: 0.92, transformOrigin: "50% 50%", duration: 0.32, ease: "power2.in" }, tPage);
  tl.fromTo(q("livre"), { opacity: 0, scale: 0.84, y: 60 }, { opacity: 1, scale: 1, y: 0, duration: 0.85, ease: "power3.out" }, tPage + 0.28);
  window.bruit("page", m("page") + 0.25, 0.8);
  tl.fromTo(q("tourne"), { rotationY: 0 }, { rotationY: -180, duration: 1.1, ease: "power2.inOut" }, m("page") + 0.15);
  tl.to(q("entete"), { opacity: 0, duration: 0.3 }, tPage);

  // « l'imprimer » : la photo des livres imprimés, une lumière la traverse
  const tPhoto = m("imprimer") - 0.35;
  window.bruit("souffle", tPhoto, 0.5);
  tl.fromTo(q("photo"), { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.85, ease: "power3.inOut" }, tPhoto);
  tl.fromTo(`${q("photo")} img`, { scale: 1.14 }, { scale: 1.02, duration: fin - (tPhoto - t0), ease: "power1.out" }, tPhoto);
  tl.fromTo(q("lumiere"), { left: "-50%" }, { left: "120%", duration: 1.8, ease: "sine.inOut" }, tPhoto + 0.7);

  // « en ligne, à la maison » : un téléphone, la lecture qui défile
  const tTel = m("maison") - 0.45;
  tl.fromTo(q("tel"), { x: 520, y: 160, rotation: 12, opacity: 0 }, { x: 0, y: 0, rotation: -3, opacity: 1, duration: 1.0, ease: "back.out(1.2)" }, tTel);
  // Une scène à la fois : on touche un choix, la scène suivante arrive
  const tTouche = tTel + 1.5;
  const doigt = { x: 190, y: 440 };
  tl.fromTo(q("toucher"), { x: doigt.x, y: doigt.y, scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.18, ease: "power2.out" }, tTouche);
  tl.to(q("toucher"), { scale: 1.5, opacity: 0, duration: 0.35, ease: "power2.out" }, tTouche + 0.2);
  tl.to(q("touche"), { backgroundColor: "rgba(11,106,115,0.12)", duration: 0.12 }, tTouche);
  window.bruit("clic", tTouche, 0.5);
  tl.fromTo(q("sa"), { xPercent: 0 }, { xPercent: -100, duration: 0.5, ease: "power3.inOut" }, tTouche + 0.35);
  tl.fromTo(q("sb"), { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: "power3.inOut" }, tTouche + 0.35);

  // Fondu au papier, vers la fin
  tl.fromTo(q("fondu"), { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "sine.inOut" }, T(fin - 0.9));
};
