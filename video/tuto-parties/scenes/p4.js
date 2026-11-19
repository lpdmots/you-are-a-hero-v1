// Passage 4 — « Besoin de changer l'ordre ? Il suffit de faire glisser les cartes. Vous pouvez même
// déplacer un chapitre d'une partie à une autre ! » « La fête des lucioles » passe avant « Le vieux
// coffre » ; puis « Le gardien de la pierre » quitte « La forêt de la nuit » pour « Le cœur de la
// forêt », la page défilant pendant qu'on le tire, comme dans l'application.
window.SCENES.p4 = (tl, t0) => {
  const id = "p4";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["avant-fete", "tire-fete", "pose-fete", "avant-gardien", "tire-gardien", "pose-gardien"]);
  U.reprendre(tl, id, "p3", t0);

  // la page remonte sur la première partie
  const rempli = U.page(tl, id, "plan-rempli", 232, 618, t0);
  rempli.aller(138, T(0.1), 0.9);
  rempli.cacher(T(1.05));
  U.viser(tl, id, { x: 240, y: 20, l: 980, h: 520 }, 1.45, T(0.1), 1.1);

  // « La fête des lucioles » : prise par le milieu, posée devant « Le vieux coffre »
  const fete = U.boite("avant-fete", "fete");
  const arrivee = U.boite("tire-fete", "volante");
  const prise = { x: fete.x + fete.l / 2, y: fete.y + 200 };
  const lache = { x: prise.x + (arrivee.x - fete.x) + 4, y: prise.y + (arrivee.y - fete.y) + 3 };
  U.aller(tl, id, prise, Math.max(m("ordre") - 0.4, T(1.0)), 0.7);
  const tPrend = Math.max(m("glisser") - 0.15, T(1.9));
  const dTire = 1.0;
  const creux1 = U.creuser(id, fete);
  const carte1 = U.volante(id, "avant-fete", fete);
  tl.set([creux1, carte1], { opacity: 1 }, tPrend);
  tl.fromTo(creux1, { opacity: 0 }, { opacity: 0.55, duration: 0.2, immediateRender: false }, tPrend);
  tl.fromTo(carte1, { x: 0, y: 0, rotation: 0, scale: 1 }, { scale: 1.03, rotation: -2, duration: 0.2, ease: "power2.out", immediateRender: false }, tPrend);
  tl.to(carte1, { x: arrivee.x - fete.x + 4, y: arrivee.y - fete.y + 3, duration: dTire, ease: "power2.inOut" }, tPrend + 0.15);
  tl.to(`#${id}-curseur`, { x: lache.x, y: lache.y, duration: dTire, ease: "power2.inOut" }, tPrend + 0.15);
  // la carte arrivée : « Le vieux coffre » a pris sa place, la carte tenue au-dessus
  const tArrive = tPrend + 0.15 + dTire;
  U.montrer(tl, id, "tire-fete", tArrive - 0.25, 0.25);
  tl.set([creux1, carte1], { opacity: 0 }, tArrive);
  // lâchée : elle se pose
  const tPose = tArrive + 0.35;
  window.bruit("cartes", tPose, 0.5);
  U.montrer(tl, id, "pose-fete", tPose, 0.2);

  // la page descend : « Le gardien de la pierre » en haut de la fenêtre, la troisième partie dessous
  const tDescend = tPose + 0.5;
  const apres = U.page(tl, id, "plan-fete", 232, 138, tDescend);
  apres.aller(755, tDescend, 1.1);
  apres.cacher(tDescend + 1.15);
  U.montrer(tl, id, "avant-gardien", tDescend + 1.1, 0);
  U.viser(tl, id, { x: 240, y: 0, l: 1180, h: 810 }, 1.12, tDescend, 1.1, 960, 520);
  U.cacherCurseur(tl, id, tDescend);

  // le gardien, tiré jusqu'à la troisième partie ; la page défile avec lui. Dans l'application, la
  // deuxième partie raccourcit quand la carte la quitte (la page perd 162 points) : la page d'avant
  // défile donc jusqu'à 1093, où la troisième partie est à la même place que sur la capture d'après
  const gardien = U.boite("avant-gardien", "gardien");
  const fin2 = U.boite("tire-gardien", "volante");
  const prise2 = { x: gardien.x + gardien.l / 2, y: gardien.y + 200 };
  const lache2 = { x: prise2.x + (fin2.x - gardien.x) + 4, y: prise2.y + (fin2.y - gardien.y) + 3 };
  U.aller(tl, id, prise2, tDescend + 1.0, 0.7);
  const tPrend2 = Math.max(m("deplacer") - 0.1, tDescend + 1.8);
  const dTire2 = 1.5;
  // pendant qu'on tire, la page entière (sans la carte) défile sous elle
  const sous = U.page(tl, id, "plan-fete", 232, 755, tPrend2);
  const creux2 = U.creuser(id, { x: gardien.x - 232, y: gardien.y, l: gardien.l, h: gardien.h });
  // le creux appartient à la page : il défile avec elle
  document.querySelector(`${sous.sel}`).appendChild(document.querySelector(creux2));
  tl.set(creux2, { opacity: 0.55 }, tPrend2);
  tl.set(`${creux2}`, { y: 0 }, tPrend2);
  tl.to(creux2, { y: -338, duration: dTire2, ease: "power2.inOut" }, tPrend2 + 0.15);
  sous.aller(1093, tPrend2 + 0.15, dTire2);
  const carte2 = U.volante(id, "avant-gardien", gardien);
  tl.set(carte2, { opacity: 1 }, tPrend2);
  tl.fromTo(carte2, { x: 0, y: 0, rotation: 0, scale: 1 }, { scale: 1.03, rotation: -2, duration: 0.2, ease: "power2.out", immediateRender: false }, tPrend2);
  tl.to(carte2, { x: fin2.x - gardien.x + 4, y: fin2.y - gardien.y + 3, duration: dTire2, ease: "power2.inOut" }, tPrend2 + 0.15);
  tl.to(`#${id}-curseur`, { x: lache2.x, y: lache2.y, duration: dTire2, ease: "power2.inOut" }, tPrend2 + 0.15);
  const tArrive2 = tPrend2 + 0.15 + dTire2;
  U.montrer(tl, id, "tire-gardien", tArrive2 - 0.35, 0.35);
  tl.set([carte2, sous.sel], { opacity: 0 }, tArrive2);
  const tPose2 = Math.max(tArrive2 + 0.35, m("autre") - 0.1);
  window.bruit("cartes", tPose2, 0.5);
  U.montrer(tl, id, "pose-gardien", tPose2, 0.2);
  U.cacherCurseur(tl, id, Math.min(tPose2 + 0.6, fin - 0.3));
};
