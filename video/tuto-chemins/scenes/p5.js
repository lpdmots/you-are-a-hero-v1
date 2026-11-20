// Passage 5 — « Et si deux chemins doivent se rejoindre ? Il suffit de faire glisser le « + »
// d'une scène vers une autre. Les deux sont alors reliées, sans avoir à créer de nouvelle scène. »
// Le « + » de « Pic l'écureuil » tiré jusqu'à « La carte qui brille » ; la bulle : « Ouvrir le
// coffre avec Pic » ; « Relier » : le schéma se range, deux traits arrivent sur la carte.
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, ["trois-choix", "lien-survol", "lien-en-route", "lien-sur-la-carte", "lien-bulle", "lien-action", "lien-fait"]);
  U.reprendre(tl, id, "p4", t0);

  // les deux scènes qui vont se rejoindre
  U.viser(tl, id, { x: 620, y: 370, l: 620, h: 250 }, 1.75, Math.max(T(0.2), m("rejoindre") - 0.6), 1.0);
  const pic = U.boite("trois-choix", "pic");
  const brille = U.boite("trois-choix", "carteBrille");
  U.cadre(tl, id, pic, m("rejoindre") - 0.2, 1.1, 6);
  U.cadre(tl, id, brille, m("rejoindre") + 0.2, 1.1, 6);

  // le « + » de « Pic l'écureuil », tiré jusqu'à « La carte qui brille »
  const plus = U.boite("lien-survol", "plus");
  const p0 = U.point(plus);
  const p1 = U.point(brille, 0.5, 0.45);
  const mi = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  U.aller(tl, id, p0, m("suffit") - 0.2, 0.7);
  U.montrer(tl, id, "lien-survol", m("suffit") + 0.4, 0.2);
  const tTire = Math.max(m("glisser"), m("suffit") + 0.7);
  tl.to(`#${id}-curseur`, { scale: 0.86, duration: 0.12, ease: "power1.out" }, tTire); // le bouton enfoncé
  window.bruit("clic", tTire, 0.5);
  tl.to(`#${id}-curseur`, { x: mi.x, y: mi.y, duration: 0.7, ease: "sine.in" }, tTire + 0.15);
  U.montrer(tl, id, "lien-en-route", tTire + 0.55, 0);
  const tArrive = Math.max(tTire + 1.6, m("autre") - 0.3);
  tl.to(`#${id}-curseur`, { x: p1.x, y: p1.y, duration: tArrive - tTire - 0.85, ease: "sine.out" }, tTire + 0.85);
  U.montrer(tl, id, "lien-sur-la-carte", tArrive - 0.25, 0);
  // relâché sur la carte : la bulle ne demande que ce que fait le lecteur
  const tLache = tArrive + 0.3;
  tl.to(`#${id}-curseur`, { scale: 1, duration: 0.12, ease: "power1.out" }, tLache);
  U.montrer(tl, id, "lien-bulle", tLache + 0.05, 0.2);
  U.cacherCurseur(tl, id, tLache + 0.3);
  U.viser(tl, id, { x: 620, y: 380, l: 520, h: 240 }, 1.9, tLache + 0.1, 0.8);
  const action = U.boite("lien-action", "action");
  const tAction = tLache + 0.7;
  const dAction = 1.3;
  U.montrer(tl, id, "lien-action", tAction, 0);
  const mAction = U.taper(tl, id, "lien-action", action, tAction, dAction, 22, -4, true);
  U.ranger(tl, [mAction], tAction + dAction + 0.1);

  // « Relier » : le schéma se range ; deux traits arrivent sur « La carte qui brille »
  const relier = U.boite("lien-action", "relier");
  const pRelier = U.point(relier);
  U.aller(tl, id, pRelier, tAction + dAction + 0.1, 0.5, null);
  const tRelier = Math.max(m("reliees") - 0.3, tAction + dAction + 0.8);
  U.cliquer(tl, id, pRelier, tRelier);
  U.montrer(tl, id, "lien-fait", tRelier + 0.15, 0.4);
  window.bruit("cartes", tRelier + 0.2, 0.6);
  U.cacherCurseur(tl, id, tRelier + 0.3);
  U.viser(tl, id, { x: 620, y: 200, l: 620, h: 430 }, 1.3, tRelier + 0.3, 1.0);
  const brille2 = U.boite("lien-fait", "carteBrille");
  U.cadre(tl, id, { x: brille2.x - 40, y: brille2.y - 40, l: brille2.l + 40, h: brille2.h + 40 }, Math.max(m("nouvelle") - 0.2, tRelier + 1.0), 1.4, 6);
};
