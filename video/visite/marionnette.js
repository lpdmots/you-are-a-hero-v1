// Les personnages en marionnettes : le même dessin, découpé en calques par des formes, chaque
// morceau pivote autour de son articulation. Coordonnées en pixels du dessin.
// Un morceau « dessous » (oreille, aile, queue) passe sous le corps, dont on retire sa place (trou) :
// en bougeant, il ne laisse ni trou ni double. Un morceau « dessus » (le papier de la souris) se pose
// par-dessus. Les paupières sont dessinées, de la couleur de la peau, avec un trait de cils.

const poly = (pts) => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
let numero = 0;
const chemin = (pts) => `M${pts.map(([x, y]) => `${x} ${y}`).join(" L")} Z`;

window.marionnette = (conteneur, image, def) => {
  const [W, H] = def.taille;
  const calque = (nom, clip, pivot) => {
    const d = document.createElement("div");
    d.className = `m-${nom}`;
    Object.assign(d.style, { position: "absolute", left: 0, top: 0, width: `${W}px`, height: `${H}px`, background: `url(${image}) 0 0 / ${W}px ${H}px`, clipPath: clip, transformOrigin: `${pivot[0]}px ${pivot[1]}px` });
    return d;
  };
  const el = {};
  const dessous = Object.entries(def.morceaux).filter(([, m]) => m.trou);
  const dessus = Object.entries(def.morceaux).filter(([, m]) => !m.trou);
  for (const [nom, m] of dessous) conteneur.appendChild((el[nom] = calque(nom, poly(m.clip), m.pivot)));
  const trous = dessous.map(([, m]) => chemin(m.trou)).join(" ");
  conteneur.appendChild((el.corps = calque("corps", `path(evenodd, "M0 0 L${W} 0 L${W} ${H} L0 ${H} Z ${trous}")`, [W / 2, H])));
  // les yeux : un fond de peau, puis l'œil lui-même, qui s'écrase pour cligner
  if (def.yeux) {
    const [haut, bas] = def.peau;
    el.yeux = def.yeux.map((o, i) => {
      const pts = Array.from({ length: 28 }, (_, k) => {
        const a = (k / 28) * Math.PI * 2, r = ((o.rot || 0) * Math.PI) / 180;
        const x = Math.cos(a) * o.rx, y = Math.sin(a) * o.ry;
        return [Math.round((o.cx + x * Math.cos(r) - y * Math.sin(r)) * 10) / 10, Math.round((o.cy + x * Math.sin(r) + y * Math.cos(r)) * 10) / 10];
      });
      const fond = document.createElement("div");
      Object.assign(fond.style, { position: "absolute", left: 0, top: 0, width: `${W}px`, height: `${H}px`, clipPath: poly(pts), background: `linear-gradient(180deg, ${haut} ${((o.cy - o.ry) / H) * 100}%, ${bas} ${((o.cy + o.ry) / H) * 100}%)` });
      conteneur.appendChild(fond);
      const oeil = calque(`oeil${i}`, poly(pts), [o.cx, o.cy + o.ry * (o.bas ?? 0.3)]);
      conteneur.appendChild(oeil);
      return oeil;
    });
  }
  for (const [nom, m] of dessus) conteneur.appendChild((el[nom] = calque(nom, poly(m.clip), m.pivot)));
  return el;
};

/** Un clignement à l'instant t : les yeux se ferment en un trait, puis se rouvrent */
window.cligner = (tl, m, t) => {
  for (const oeil of m.yeux) {
    tl.fromTo(oeil, { scaleY: 1 }, { scaleY: 0.08, duration: 0.07, ease: "power2.in" }, t);
    tl.to(oeil, { scaleY: 1, duration: 0.14, ease: "power2.out" }, t + 0.11);
  }
};
/** Un frémissement (oreille), s : sens */
window.fremir = (tl, el, t, s = 1, ampleur = 6) => tl.to(el, { keyframes: { rotation: [0, ampleur * s, -0.4 * ampleur * s, 0.15 * ampleur * s, 0] }, duration: 0.5, ease: "none" }, t);
/** Un balancement continu, de a à b, période p, sur la durée d */
window.balancer = (tl, el, t, d, a, b, p) => tl.fromTo(el, { rotation: a }, { rotation: b, duration: p / 2, ease: "sine.inOut", yoyo: true, repeat: Math.max(1, Math.floor(d / (p / 2)) - 1) }, t);

// ——— La souris (1254 × 1254) ———
window.SOURIS = {
  taille: [1254, 1254],
  peau: ["rgb(189,114,58)", "rgb(214,140,78)"],
  morceaux: {
    oreilleG: { trou: [[190, 70], [515, 55], [520, 150], [515, 250], [500, 310], [478, 390], [445, 452], [420, 475], [190, 475]], clip: [[190, 70], [545, 50], [550, 150], [545, 250], [530, 320], [505, 400], [470, 470], [420, 490], [190, 490]], pivot: [495, 330] },
    oreilleD: { trou: [[790, 10], [1060, 10], [1060, 400], [925, 400], [885, 350], [860, 290], [830, 225], [800, 175], [790, 120]], clip: [[785, 0], [1065, 0], [1065, 410], [915, 410], [870, 365], [840, 300], [805, 230], [775, 175], [770, 110]], pivot: [850, 300] },
    queue: { trou: [[185, 570], [345, 565], [425, 615], [428, 770], [380, 860], [382, 940], [396, 958], [396, 1050], [185, 1050]], clip: [[185, 565], [350, 560], [430, 610], [434, 770], [386, 860], [388, 935], [405, 955], [410, 1050], [185, 1050]], pivot: [395, 1010] },
    papier: { clip: [[635, 620], [700, 575], [790, 565], [870, 590], [965, 600], [975, 690], [1030, 780], [1030, 940], [930, 870], [760, 870], [700, 760], [635, 745]], pivot: [800, 700] },
  },
  yeux: [
    { cx: 632, cy: 421, rx: 78, ry: 58, rot: 8 },
    { cx: 867, cy: 395, rx: 54, ry: 76, rot: -6 },
  ],
};
window.animerSouris = (tl, m, t0, duree, miettes = []) => {
  const fin = t0 + duree;
  tl.fromTo(m.corps.parentElement, { scaleY: 1 }, { scaleY: 1.012, transformOrigin: "50% 94%", duration: 1.0, ease: "sine.inOut", yoyo: true, repeat: Math.floor(duree / 1.0) - 1 }, t0);
  window.balancer(tl, m.queue, t0, duree, -3, 3.5, 2.4);
  for (let t = t0 + 1.1; t < fin - 0.3; t += 3.3) window.cligner(tl, m, t);
  for (let t = t0 + 1.9, i = 0; t < fin - 0.5; t += 2.2, i++) window.fremir(tl, i % 2 ? m.oreilleG : m.oreilleD, t, i % 2 ? 1 : -1);
  for (let t = t0 + 0.5, i = 0; t < fin - 0.4; t += 1.15, i++) {
    tl.to(m.papier, { keyframes: { y: [0, 7, 0], rotation: [0, 1.6, 0] }, duration: 0.32, ease: "sine.inOut" }, t);
    const mi = miettes[i % (miettes.length || 1)];
    if (mi) tl.fromTo(mi, { x: 770 + (i % 3) * 18, y: 600, opacity: 0, rotation: 0 }, { keyframes: { opacity: [1, 1, 1, 0], y: [600, 760, 1000, 1170], x: [770 + (i % 3) * 18, 760 + (i % 3) * 30, 745 + (i % 3) * 40, 735 + (i % 3) * 46], rotation: [0, 120, 240, 300] }, duration: 1.1, ease: "power1.in" }, t + 0.12);
  }
};
window.marionnetteSouris = (conteneur, image) => window.marionnette(conteneur, image, window.SOURIS);

// ——— Le dragon assis du début, qui regarde (640 × 591) ———
window.DRAGON_ASSIS = {
  taille: [640, 591],
  peau: ["rgb(22,118,140)", "rgb(34,138,158)"],
  morceaux: {
    aileG: { trou: [[0, 272], [105, 268], [150, 286], [162, 300], [160, 335], [150, 370], [110, 350], [95, 405], [0, 415]], clip: [[0, 265], [110, 262], [160, 280], [185, 300], [185, 350], [160, 380], [110, 358], [95, 412], [0, 420]], pivot: [165, 320] },
    aileD: { trou: [[343, 244], [428, 255], [516, 356], [516, 372], [478, 369], [458, 371], [442, 374], [430, 381], [421, 389], [412, 392], [394, 378], [370, 368], [345, 362], [328, 359], [314, 347], [304, 333], [316, 300], [328, 260]], clip: [[338, 238], [432, 250], [522, 356], [522, 380], [478, 378], [448, 384], [432, 398], [414, 406], [390, 386], [366, 374], [343, 368], [322, 366], [300, 345], [290, 320], [310, 290], [322, 254]], pivot: [318, 332] },
    queue: { trou: [[548, 336], [645, 336], [645, 452], [560, 452], [546, 420]], clip: [[545, 330], [645, 330], [645, 470], [555, 470], [540, 420]], pivot: [600, 462] },
  },
  yeux: [
    { cx: 52, cy: 148, rx: 24, ry: 34, rot: -10 },
    { cx: 157, cy: 189, rx: 43, ry: 38, rot: 0 },
  ],
};
window.animerDragonAssis = (tl, m, t0, duree) => {
  const fin = t0 + duree;
  window.balancer(tl, m.aileD, t0, duree, 0, -5, 2.0);
  window.balancer(tl, m.aileG, t0 + 0.15, duree - 0.15, 0, 5, 2.0);
  window.balancer(tl, m.queue, t0, duree, -4, 7, 1.6);
  for (let t = t0 + 0.8; t < fin - 0.3; t += 2.9) window.cligner(tl, m, t);
};

// ——— Le dragon endormi de la fin (720 × 559) ———
window.DRAGON_ENDORMI = {
  taille: [720, 559],
  morceaux: {
    oreille: { trou: [[15, 238], [100, 232], [108, 260], [106, 300], [100, 322], [60, 322], [15, 300]], clip: [[10, 230], [125, 225], [130, 260], [128, 305], [115, 330], [55, 330], [10, 305]], pivot: [110, 285] },
    aile: { trou: [[392, 15], [640, 15], [640, 140], [575, 140], [545, 158], [510, 165], [470, 170], [430, 172], [410, 170], [404, 120], [394, 70]], clip: [[388, 10], [645, 10], [645, 150], [580, 165], [540, 185], [500, 192], [450, 195], [410, 192], [398, 130], [386, 60]], pivot: [420, 175] },
  },
};
window.animerDragonEndormi = (tl, m, t0, duree) => {
  const fin = t0 + duree;
  window.balancer(tl, m.aile, t0, duree, 0, -3.5, 2.6);
  for (let t = t0 + 1.4; t < fin - 0.5; t += 2.7) window.fremir(tl, m.oreille, t, 1, 7);
};

/** Une bouffée de fumée par les narines : de petits nuages qui sortent, montent, grossissent et s'effacent */
window.fumer = (tl, conteneur, narines, t, direction = [-1, -1]) => {
  narines.forEach(([x, y], n) => {
    for (let k = 0; k < 3; k++) {
      const b = document.createElement("i");
      Object.assign(b.style, {
        position: "absolute", left: 0, top: 0, width: "40px", height: "40px", margin: "-20px 0 0 -20px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(250,252,253,0.95) 0%, rgba(205,216,222,0.8) 45%, rgba(205,216,222,0) 72%)",
        filter: "blur(1.5px)", opacity: 0, pointerEvents: "none",
      });
      conteneur.appendChild(b);
      const d = 1.7 + k * 0.15, dx = direction[0] * (50 + k * 22 + n * 8), dy = direction[1] * (62 + k * 26);
      tl.fromTo(b, { x, y, scale: 0.35, opacity: 0 }, { keyframes: { opacity: [0, 0.9, 0.55, 0], scale: [0.35, 1.1, 1.8, 2.4], x: [x, x + dx * 0.35, x + dx * 0.75, x + dx], y: [y, y + dy * 0.3, y + dy * 0.7, y + dy] }, duration: d, ease: "power1.out" }, t + k * 0.12 + n * 0.05);
    }
  });
};
