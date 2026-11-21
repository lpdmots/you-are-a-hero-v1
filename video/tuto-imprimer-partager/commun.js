// La visite en vidéo — outils communs aux passages. Chaque passage (scenes/<id>.js) s'inscrit
// dans window.SCENES ; index.html les joue tous sur une seule timeline, chacun à partir de son
// début (donnees/voix.js, écrit par outils/preparer.mjs).
window.SCENES = {};
/** Les bruitages, posés par les passages ; outils/mixer.mjs les lit pour faire la bande-son */
window.BRUITAGES = [];
window.bruit = (son, t, vol = 1) => window.BRUITAGES.push({ son, t: +t.toFixed(3), vol });

const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "");

/** Le temps d'un mot de la voix, depuis le début du passage : mot("p07", "heros") ; n-ième occurrence */
window.mot = (id, aiguille, n = 1, bord = "t") => {
  const p = window.VOIX.passages[id];
  const cherche = norm(aiguille);
  let vu = 0;
  for (const m of p.mots) if (norm(m.m).includes(cherche) && ++vu === n) return m[bord];
  throw new Error(`mot introuvable : ${id} « ${aiguille} » (${n})`);
};
window.finVoix = (id) => {
  const p = window.VOIX.passages[id];
  return p.mots.at(-1).f;
};
window.dureeDe = (id) => window.VOIX.passages[id].duree;

/** Générateur pseudo-aléatoire reproductible (le rendu doit être identique à chaque fois) */
window.hasard = (graine) => () => {
  graine |= 0;
  graine = (graine + 0x6d2b79f5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Position du chiffre d'en-tête (voir .entete et .numero dans commun.css) : son centre
const largeurChiffres = (n) => String(n).length * 25;
window.centreEntete = (n) => ({ x: 120 + largeurChiffres(n) / 2, y: 92 + 23 });
const ECHELLE_GRANDE = 6.6;

/**
 * Entrée d'un passage : l'écran est couvert de papier, le grand numéro au milieu ; il s'envole
 * vers l'en-tête, puis la scène s'ouvre en cercle autour de lui.
 *   s : préfixe des identifiants du passage (« p07 ») ; n : son numéro ; t0 : son début
 */
window.entreeParNumero = (tl, s, n, t0) => {
  const c = window.centreEntete(n);
  const grand = `#${s}-grand`, revele = `#${s}-revele`, chiffre = `#${s}-chiffre`;
  tl.set(revele, { clipPath: `circle(0px at ${c.x}px ${c.y}px)` }, t0);
  tl.fromTo(grand, { x: 960, y: 520, xPercent: -50, yPercent: -50, scale: ECHELLE_GRANDE, opacity: 1 }, { x: c.x, y: c.y, scale: 1, duration: 0.85, ease: "power3.inOut" }, t0 + 0.05);
  tl.to(revele, { clipPath: `circle(2300px at ${c.x}px ${c.y}px)`, duration: 1.1, ease: "power2.in" }, t0 + 0.55);
  tl.fromTo(chiffre, { opacity: 0 }, { opacity: 1, duration: 0.12 }, t0 + 0.88);
  tl.to(grand, { opacity: 0, duration: 0.12 }, t0 + 0.9);
  tl.set(revele, { clipPath: "none" }, t0 + 1.7);
};

/**
 * Sortie par une phrase de choix : le curseur touche le numéro (x, y : son centre), la pastille
 * se remplit, le papier s'ouvre en cercle depuis elle et couvre l'écran ; le numéro grandit au
 * milieu, où le passage suivant le reprend. tFin : fin du passage.
 */
window.sortieParRenvoi = (tl, s, x, y, tFin) => {
  const tClic = tFin - 1.05;
  window.bruit("clic", tClic, 0.7);
  window.bruit("souffle", tClic + 0.12, 0.8);
  tl.fromTo(`#${s}-curseur`, { x: x + 330, y: y + 250, opacity: 0, rotation: -8 }, { x: x - 4, y: y - 2, opacity: 1, rotation: 0, duration: 0.75, ease: "power3.out", immediateRender: false }, tClic - 0.8);
  tl.to(`#${s}-curseur`, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }, tClic);
  tl.fromTo(`#${s}-clic`, { x, y, scale: 0.3, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, tClic);
  tl.to(`#${s}-sortie .plein`, { opacity: 1, duration: 0.12 }, tClic);
  tl.fromTo(`#${s}-voile`, { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 1 }, { clipPath: `circle(2300px at ${x}px ${y}px)`, duration: 0.95, ease: "power3.in" }, tClic + 0.1);
  tl.fromTo(`#${s}-sortant`, { x, y, xPercent: -50, yPercent: -50, scale: 0.8, opacity: 0 }, { opacity: 1, duration: 0.15 }, tClic + 0.12);
  tl.to(`#${s}-sortant`, { x: 960, y: 520, scale: ECHELLE_GRANDE, duration: 0.9, ease: "power3.inOut" }, tClic + 0.15);
};

/** Un curseur qui va d'un point à un autre (coordonnées de l'écran) */
window.curseurVers = (tl, sel, de, a, t, d = 0.7) => {
  tl.fromTo(sel, { x: de.x, y: de.y, opacity: de.o ?? 1 }, { x: a.x, y: a.y, opacity: 1, duration: d, ease: "power3.inOut", immediateRender: false }, t);
};
window.clic = (tl, curseur, rond, x, y, t) => {
  window.bruit("clic", t, 0.7);
  tl.to(curseur, { scale: 0.86, duration: 0.08, yoyo: true, repeat: 1, ease: "power1.inOut" }, t);
  tl.fromTo(rond, { x, y, scale: 0.3, opacity: 0.9 }, { scale: 1.5, opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, t);
};

/** Texte qui s'écrit lettre à lettre (le contenu de l'élément est remplacé par des spans) */
window.lettres = (el) => {
  const texte = el.textContent;
  el.textContent = "";
  return [...texte].map((c) => {
    const span = document.createElement("span");
    span.textContent = c;
    el.appendChild(span);
    return span;
  });
};

/** Les icônes de l'outil (app/src/composants/Icone.tsx) */
window.ICONES = {
  coche: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  crayon: '<path d="M5 19l1-4.2L15.6 5.2a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L9.2 18 5 19z"/><path d="M13.8 7l3.2 3.2"/>',
  sablier: '<path d="M7 4h10M7 20h10"/><path d="M8 4c0 4 8 4.5 8 8s-8 4-8 8"/><path d="M16 4c0 4-8 4.5-8 8s8 4 8 8"/>',
  "demi-tour": '<path d="M9 7L4.5 11.5 9 16"/><path d="M5 11.5h9.5a4.5 4.5 0 0 1 0 9H12"/>',
  livre: '<path d="M4.5 5.5c2.8-.9 5.3-.5 7.5 1.2v12.8c-2.2-1.7-4.7-2.1-7.5-1.2z"/><path d="M19.5 5.5c-2.8-.9-5.3-.5-7.5 1.2v12.8c2.2-1.7 4.7-2.1 7.5-1.2z"/>',
  ia: '<path d="M10 4c.4 3.6 1.9 5.5 6.5 6.5-4.6 1-6.1 2.9-6.5 6.5-.4-3.6-1.9-5.5-6.5-6.5C8.1 9.5 9.6 7.6 10 4z"/><path d="M18 3v4M16 5h4"/><path d="M18 16.5v4M16 18.5h4"/>',
  fleche: '<path d="M4.5 12h14"/><path d="M13.5 7l5 5-5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
window.icone = (nom) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${window.ICONES[nom]}</svg>`;
/** Remplit les <i data-ic="nom"></i> du document par leur icône */
window.poserIcones = () => document.querySelectorAll("i[data-ic]").forEach((i) => (i.outerHTML = window.icone(i.dataset.ic)));
