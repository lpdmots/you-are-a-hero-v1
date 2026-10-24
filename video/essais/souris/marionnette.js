// La souris en marionnette : le même dessin, découpé en calques par des formes, chaque morceau
// pivote autour de son articulation. Coordonnées en pixels du dessin (1254 × 1254).
// Les oreilles et la queue passent sous le corps, dont on retire leur place : en bougeant, elles
// ne laissent ni trou ni double. Le papier et les mains passent au-dessus.
window.marionnetteSouris = (conteneur, image) => {
  const poly = (pts) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
  const chemin = (pts) => `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;
  const trouOreilleG = [[190, 70], [515, 55], [520, 150], [515, 250], [500, 310], [478, 390], [445, 452], [420, 475], [190, 475]];
  const trouOreilleD = [[790, 10], [1060, 10], [1060, 400], [925, 400], [885, 350], [860, 290], [830, 225], [800, 175], [790, 120]];
  const trouQueue = [[185, 570], [345, 565], [425, 615], [428, 770], [380, 860], [382, 940], [396, 958], [396, 1050], [185, 1050]];
  const corps = `path(evenodd, "M0 0 L1254 0 L1254 1254 L0 1254 Z ${chemin(trouOreilleG)} ${chemin(trouOreilleD)} ${chemin(trouQueue)}")`;
  const calques = {
    oreilleG: { clip: poly([[190, 70], [545, 50], [550, 150], [545, 250], [530, 320], [505, 400], [470, 470], [420, 490], [190, 490]]), pivot: [495, 330] },
    oreilleD: { clip: poly([[785, 0], [1065, 0], [1065, 410], [915, 410], [870, 365], [840, 300], [805, 230], [775, 175], [770, 110]]), pivot: [850, 300] },
    queue: { clip: poly([[185, 565], [350, 560], [430, 610], [434, 770], [386, 860], [388, 935], [405, 955], [410, 1050], [185, 1050]]), pivot: [395, 1010] },
    corps: { clip: corps, pivot: [640, 1180] },
    papier: { clip: poly([[635, 620], [700, 575], [790, 565], [870, 590], [965, 600], [975, 690], [1030, 780], [1030, 940], [930, 870], [760, 870], [700, 760], [635, 745]]), pivot: [800, 700] },
  };
  const el = {};
  for (const [nom, c] of Object.entries(calques)) {
    const d = document.createElement("div");
    d.className = `m-${nom}`;
    Object.assign(d.style, { position: "absolute", left: 0, top: 0, width: "1254px", height: "1254px", background: `url(${image}) 0 0 / 1254px 1254px`, clipPath: c.clip, transformOrigin: `${c.pivot[0]}px ${c.pivot[1]}px` });
    conteneur.appendChild(d);
    el[nom] = d;
  }
  // Les paupières : du pelage qui descend dans l'œil, un trait de cils au bord
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 1254 1254");
  Object.assign(svg.style, { position: "absolute", left: 0, top: 0, width: "1254px", height: "1254px", overflow: "visible" });
  svg.innerHTML = `
    <defs>
      <linearGradient id="m-pelage" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb(189,114,58)"/><stop offset="1" stop-color="rgb(214,140,78)"/></linearGradient>
      <clipPath id="m-oeilG"><ellipse cx="632" cy="419" rx="76" ry="54" transform="rotate(8 632 419)"/></clipPath>
      <clipPath id="m-oeilD"><ellipse cx="867" cy="395" rx="52" ry="73" transform="rotate(-6 867 395)"/></clipPath>
    </defs>
    <g clip-path="url(#m-oeilG)"><g class="m-paupiereG"><rect x="540" y="250" width="190" height="120" fill="url(#m-pelage)"/><path d="M548 368 Q632 386 716 368" stroke="#2b1a0e" stroke-width="7" fill="none" stroke-linecap="round"/></g></g>
    <g clip-path="url(#m-oeilD)"><g class="m-paupiereD"><rect x="800" y="200" width="140" height="122" fill="url(#m-pelage)"/><path d="M812 320 Q867 336 922 320" stroke="#2b1a0e" stroke-width="7" fill="none" stroke-linecap="round"/></g></g>`;
  conteneur.insertBefore(svg, el.papier);
  // l'ordre : oreilles et queue sous le corps
  conteneur.prepend(el.queue);
  conteneur.prepend(el.oreilleD);
  conteneur.prepend(el.oreilleG);
  return { ...el, paupiereG: svg.querySelector(".m-paupiereG"), paupiereD: svg.querySelector(".m-paupiereD") };
};

/** Les gestes : clignements, oreilles, queue, bouchées, respiration, sur une durée donnée */
window.animerSouris = (tl, m, t0, duree, miettes = []) => {
  const fin = t0 + duree;
  // respiration et queue, en continu (répétitions comptées : le rendu doit pouvoir se rejouer)
  tl.fromTo(m.corps.parentElement, { scaleY: 1 }, { scaleY: 1.012, transformOrigin: "50% 94%", duration: 1.0, ease: "sine.inOut", yoyo: true, repeat: Math.floor(duree / 1.0) - 1 }, t0);
  tl.fromTo(m.queue, { rotation: -3 }, { rotation: 3.5, duration: 1.2, ease: "sine.inOut", yoyo: true, repeat: Math.floor(duree / 1.2) - 1 }, t0);
  // clignements : la paupière descend de son haut, d'environ 120 px
  const cligne = (t) => {
    for (const [p, h] of [[m.paupiereG, 122], [m.paupiereD, 150]]) {
      tl.fromTo(p, { y: 0 }, { y: h, duration: 0.07, ease: "power2.in" }, t);
      tl.to(p, { y: 0, duration: 0.13, ease: "power2.out" }, t + 0.12);
    }
  };
  for (let t = t0 + 1.1; t < fin - 0.3; t += 3.3) cligne(t);
  // oreilles : un frémissement de temps en temps
  for (let t = t0 + 1.9, i = 0; t < fin - 0.5; t += 2.2, i++) {
    const o = i % 2 ? m.oreilleG : m.oreilleD, s = i % 2 ? 1 : -1;
    tl.to(o, { keyframes: { rotation: [0, 6 * s, -2.5 * s, 1 * s, 0] }, duration: 0.5, ease: "none" }, t);
  }
  // bouchées : la souris tire sur le papier, une miette tombe
  for (let t = t0 + 0.5, i = 0; t < fin - 0.4; t += 1.15, i++) {
    tl.to(m.papier, { keyframes: { y: [0, 7, 0], rotation: [0, 1.6, 0] }, duration: 0.32, ease: "sine.inOut" }, t);
    const mi = miettes[i % (miettes.length || 1)];
    if (mi) tl.fromTo(mi, { x: 770 + (i % 3) * 18, y: 600, opacity: 0, rotation: 0 }, { keyframes: { opacity: [1, 1, 1, 0], y: [600, 760, 1000, 1170], x: [770 + (i % 3) * 18, 760 + (i % 3) * 30, 745 + (i % 3) * 40, 735 + (i % 3) * 46], rotation: [0, 120, 240, 300] }, duration: 1.1, ease: "power1.in" }, t + 0.12);
  }
};
