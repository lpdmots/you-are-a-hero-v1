// Les tutos — outils communs, en plus de commun.js. Un tuto montre les vrais écrans de
// l'application (captures/, joués par app/tests/captures/tuto-acces-eleves.spec.ts) : une
// feuille posée sur la table, que la caméra vise, sur laquelle un curseur agit, et dont les
// champs se remplissent en dévoilant l'écran suivant à l'endroit du champ.
//
// Les coordonnées des captures (window.BOITES, en points de l'application, 1440 × 810) sont
// celles de la feuille : rien n'est mesuré à la main, sauf où c'est dit.
window.TUTO = (() => {
  const B = window.BOITES;
  const L = 240, H = 135; // la feuille sur l'écran de la vidéo (1920 × 1080), centrée
  const W = B.largeur, HT = B.hauteur;
  /** Le fichier d'une capture par son nom, sans son numéro d'ordre */
  const fichier = (nom) => {
    const cle = Object.keys(B.ecrans).find((c) => c.slice(3) === nom);
    if (!cle) throw new Error(`capture introuvable : ${nom}`);
    return { cle, src: `captures/${cle}.png`, boites: B.ecrans[cle] };
  };
  const boite = (nom, quoi) => {
    const b = fichier(nom).boites[quoi];
    if (!b) throw new Error(`boîte introuvable : ${nom} ${quoi}`);
    return b;
  };

  /**
   * Pose la feuille d'un passage : ses captures empilées (la première visible), le curseur et le
   * cercle du clic. s : préfixe du passage (« p2 »).
   */
  function feuille(s, noms) {
    const camera = document.getElementById(`${s}-camera`);
    const f = document.createElement("div");
    f.className = "feuille-app";
    f.id = `${s}-feuille`;
    f.style.cssText = `left:${L}px;top:${H}px;width:${W}px;height:${HT}px`;
    f.innerHTML =
      noms.map((n, i) => `<img id="${s}-${n}" src="${fichier(n).src}" alt="" style="opacity:${i ? 0 : 1}">`).join("") +
      `<div class="clic-app" id="${s}-clic"></div>` +
      `<svg class="curseur-app" id="${s}-curseur" viewBox="0 0 24 24" style="opacity:0"><path d="M3.2 2.2v16.6l4.4-4.1 3 6.6 2.9-1.3-3-6.5 6.1-.4z" fill="#fff" stroke="#1e2226" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
    camera.appendChild(f);
    return f;
  }

  /** Une capture en remplace une autre, en fondu (d = 0 : coupe franche) */
  const montrer = (tl, s, nom, t, d = 0.3) => tl.fromTo(`#${s}-${nom}`, { opacity: 0 }, { opacity: 1, duration: d || 0.001, ease: "power1.out", immediateRender: false }, t);

  /**
   * La caméra vise une boîte de la feuille (coordonnées des captures) à l'échelle e : le centre de
   * la boîte vient au point (cx, cy) de l'écran.
   */
  // La dernière place de la caméra de chaque passage : le passage suivant la reprend telle quelle,
  // si bien que rien ne saute d'un passage à l'autre
  const derniere = {};
  const noter = (s, etat, fin) => {
    if (!derniere[s] || fin >= derniere[s].fin) derniere[s] = { ...etat, fin };
  };
  const viser = (tl, s, b, e, t, d = 1.1, cx = 960, cy = 540) => {
    const x = cx - e * (L + b.x + b.l / 2);
    const y = cy - e * (H + b.y + b.h / 2);
    tl.to(`#${s}-camera`, { x, y, scale: e, duration: d, ease: "power2.inOut" }, t);
    noter(s, { x, y, scale: e }, t + d);
  };
  const plan = (tl, s, t, d = 1.1) => {
    tl.to(`#${s}-camera`, { x: 0, y: 0, scale: 1, duration: d, ease: "power2.inOut" }, t);
    noter(s, { x: 0, y: 0, scale: 1 }, t + d);
  };
  /** Le passage commence là où le précédent s'est arrêté : même capture, même cadrage */
  const reprendre = (tl, s, avant, t0) => {
    const e = derniere[avant] || { x: 0, y: 0, scale: 1 };
    tl.set(`#${s}-camera`, { x: e.x, y: e.y, scale: e.scale }, t0);
    noter(s, e, t0);
  };
  /** La feuille arrive (d'en bas, ou de droite quand on change d'ordinateur), ou s'en va à gauche */
  const arrivee = (tl, s, t, de = "bas") =>
    tl.fromTo(`#${s}-feuille`, de === "bas" ? { y: 900, rotation: 2 } : { x: 2000, rotation: 3 }, { x: 0, y: 0, rotation: 0, duration: 1.0, ease: "power3.out" }, t);
  const depart = (tl, s, tFin) => tl.to(`#${s}-feuille`, { x: -2100, rotation: -3, duration: 0.8, ease: "power3.in" }, tFin - 0.8);

  /** Le centre d'une boîte, ou un point pris dans elle (fx, fy de 0 à 1) */
  const point = (b, fx = 0.5, fy = 0.5) => ({ x: b.x + b.l * fx, y: b.y + b.h * fy });

  /** Le curseur va à un point de la feuille ; de : d'où il part (null : il apparaît en venant du bas) */
  const aller = (tl, s, a, t, d = 0.8, de = null) => {
    const sel = `#${s}-curseur`;
    if (de) tl.to(sel, { x: a.x, y: a.y, opacity: 1, duration: d, ease: "power3.inOut" }, t);
    else tl.fromTo(sel, { x: a.x + 160, y: a.y + 140, opacity: 0 }, { x: a.x, y: a.y, opacity: 1, duration: d, ease: "power3.out", immediateRender: false }, t);
  };
  const cliquer = (tl, s, a, t) => window.clic(tl, `#${s}-curseur`, `#${s}-clic`, a.x, a.y, t);
  const cacherCurseur = (tl, s, t) => tl.to(`#${s}-curseur`, { opacity: 0, duration: 0.25 }, t);

  /**
   * Un champ se remplit : la capture d'après se dévoile dans la boîte du champ, de gauche à droite,
   * par à-coups comme une frappe (pas : nombre de touches). Rien n'est redessiné.
   */
  let morceaux = 0;
  function taper(tl, s, nom, b, t, d = 0.8, pas = 14, marge = 3, vider = false) {
    const f = document.getElementById(`${s}-feuille`);
    // vider : le texte d'exemple du champ s'efface quand on commence à taper
    if (vider) {
      const v = document.createElement("div");
      v.className = "morceau";
      v.id = `${s}-v${++morceaux}`;
      v.style.cssText = `left:${b.x + 3}px;top:${b.y + 3}px;width:${b.l - 6}px;height:${b.h - 6}px;background:#fff;border-radius:6px`;
      f.insertBefore(v, f.querySelector(".clic-app"));
      tl.set(`#${v.id}`, { opacity: 1 }, t);
      tl.set(`#${v.id}`, { opacity: 0 }, t + d + 0.5);
    }
    const m = document.createElement("div");
    m.className = "morceau";
    m.id = `${s}-m${++morceaux}`;
    const x = b.x - marge, y = b.y - marge, l = b.l + 2 * marge, h = b.h + 2 * marge;
    m.style.cssText = `left:${x}px;top:${y}px;width:${l}px;height:${h}px;background-image:url(${fichier(nom).src});background-size:${W}px ${HT}px;background-position:${-x}px ${-y}px`;
    f.insertBefore(m, f.querySelector(".clic-app"));
    tl.fromTo(`#${m.id}`, { clipPath: "inset(0 100% 0 0)", opacity: 1 }, { clipPath: "inset(0 0% 0 0)", duration: d, ease: `steps(${pas})`, immediateRender: false }, t);
    if (pas > 2) window.bruit("clavier", t, 0.9);
    return `#${m.id}`;
  }
  /** Les morceaux dévoilés s'effacent quand la capture entière prend leur place */
  const ranger = (tl, sels, t) => tl.set(sels, { opacity: 0 }, t);


  /** Un cadre canard autour d'une boîte, pour désigner ce dont parle la voix */
  let cadres = 0;
  function cadre(tl, s, b, t, d = 1.4, marge = 6) {
    const f = document.getElementById(`${s}-feuille`);
    const c = document.createElement("div");
    c.className = "cadre-app";
    c.id = `${s}-c${++cadres}`;
    c.style.cssText = `left:${b.x - marge}px;top:${b.y - marge}px;width:${b.l + 2 * marge}px;height:${b.h + 2 * marge}px`;
    f.insertBefore(c, f.querySelector(".clic-app"));
    tl.fromTo(`#${c.id}`, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false }, t);
    if (d) tl.to(`#${c.id}`, { opacity: 0, duration: 0.3 }, t + d);
    return `#${c.id}`;
  }

  /**
   * La page défile : la capture prise en entier (« _page ») glisse vers le haut dans la zone à droite
   * de la colonne de navigation, qui reste en place comme dans l'application. Rend le sélecteur de
   * la zone (à cacher quand l'écran suivant arrive) et la distance parcourue.
   */
  function defiler(tl, s, nom, gauche, t, d = 1.3) {
    const f = document.getElementById(`${s}-feuille`);
    const c = fichier(nom);
    const page = c.boites._page;
    const z = document.createElement("div");
    z.className = "morceau";
    z.id = `${s}-defile`;
    z.style.cssText = `left:${gauche}px;top:0;width:${W - gauche}px;height:${HT}px;overflow:hidden;background:#f1f1ee`;
    z.innerHTML = `<img src="${c.src}" alt="" style="position:absolute;left:${-gauche}px;top:0;width:${W}px;height:${page.h}px;max-width:none">`;
    f.insertBefore(z, f.querySelector(".clic-app"));
    const dy = page.h - HT;
    tl.set(`#${z.id}`, { opacity: 1 }, t);
    tl.fromTo(`#${z.id} img`, { y: 0 }, { y: -dy, duration: d, ease: "power2.inOut", immediateRender: false }, t);
    return { sel: `#${z.id}`, dy };
  }

  return { defiler, L, H, W, HT, fichier, boite, feuille, montrer, viser, plan, reprendre, arrivee, depart, point, aller, cliquer, cacherCurseur, taper, ranger, cadre };
})();
