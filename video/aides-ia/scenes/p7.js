// Passage 7 — « Toutes ces aides ont utilisé dix étoiles. Pour les essayer, vous avez déjà reçu
// trente étoiles sur votre compte. Et si vous souhaitez continuer, cent étoiles coûtent cinq euros.
// Alors, essayez sur votre prochaine scène ! » La scène finie (la consigne, le texte corrigé,
// l'image) ; le menu du nom : le solde réel, celui de l'étiquette de la table ; « 30 ✦ offertes »,
// « 100 ✦ · 5 € » ; le curseur revient sur une scène du chapitre ; le voile, le logo, le dragon.
// Hors série : aucun renvoi vers un tuto suivant.
window.SCENES.p7 = (tl, t0) => {
  const id = "p7";
  const U = window.TUTO, A = window.AIDES;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const q = (s) => `#p7-${s}`;
  const fv = T(window.finVoix(id));
  U.feuille(id, ["image-gardee", "scene-finie", "survol-nom", "menu-du-nom", "ajoutees-sans-message"]);
  U.reprendre(tl, id, "p6", t0);
  const solde = A.solde(id, [A.apres("image")]);

  // la scène finie : la page entière, sa consigne dépliée, descend puis remonte doucement
  const image = U.boite("image-gardee", "imageBloc");
  const page = U.page(tl, id, "scene-finie-page", 232, image.y - 150, t0);
  U.plan(tl, id, T(0.1), 1.2);
  page.aller(170, T(0.2), 1.4);
  // « ont utilisé dix étoiles » : l'étiquette de la table
  tl.fromTo(solde.sel, { scale: 1 }, { scale: 1.35, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, m("dix") - 0.1);
  window.bruit("etincelles", m("dix"), 0.5);
  // la page remonte : le nom, en bas de la colonne, et son menu
  page.aller(0, m("dix") + 0.5, 0.8);
  U.montrer(tl, id, "scene-finie", m("dix") + 1.25, 0.2);
  page.cacher(m("dix") + 1.5);
  const nom = U.boite("scene-finie", "nom");
  const pNom = U.point(nom, 0.5);
  const tNom = m("dix") + 1.5;
  U.viser(tl, id, { x: 0, y: 420, l: 560, h: 390 }, 1.9, tNom - 0.1, 0.9);
  U.aller(tl, id, pNom, tNom, 0.6);
  U.montrer(tl, id, "survol-nom", tNom + 0.6, 0.1);
  const tMenu = Math.max(tNom + 0.95, m("pour") - 0.4);
  U.cliquer(tl, id, pNom, tMenu);
  U.montrer(tl, id, "menu-du-nom", tMenu + 0.12, 0.2);
  U.cacherCurseur(tl, id, tMenu + 0.4);
  const ligne = U.boite("menu-du-nom", "solde");
  U.cadre(tl, id, { x: ligne.x - 6, y: ligne.y - 6, l: ligne.l + 12, h: ligne.h + 12 }, tMenu + 0.5, 1.6, 4);

  // « trente étoiles » puis « cent étoiles coûtent cinq euros » : deux grandes étiquettes, la table assombrie
  const tTrente = m("trente") - 0.25;
  U.plan(tl, id, tTrente - 0.3, 0.9);
  tl.to(q("ombre"), { opacity: 1, duration: 0.4 }, tTrente - 0.1);
  tl.fromTo(q("trente"), { y: 60, scale: 0.8, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", immediateRender: false }, tTrente);
  window.bruit("etincelles", tTrente, 0.5);
  const tCent = m("cent") - 0.25;
  tl.to(q("trente"), { y: -60, opacity: 0, duration: 0.35, ease: "power2.in" }, tCent - 0.3);
  tl.fromTo(q("cent"), { y: 60, scale: 0.8, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)", immediateRender: false }, tCent);
  window.bruit("cartes", tCent, 0.5);
  const tAlors = m("alors") - 0.3;
  tl.to(q("cent"), { y: -60, opacity: 0, duration: 0.35, ease: "power2.in" }, tAlors);
  tl.to(q("ombre"), { opacity: 0, duration: 0.4 }, tAlors);

  // « essayez sur votre prochaine scène » : « Chemins » et ses nouvelles scènes, le curseur sur l'une d'elles
  U.montrer(tl, id, "ajoutees-sans-message", tAlors - 0.2, 0.35);
  tl.to(solde.sel, { opacity: 0, duration: 0.3 }, tAlors);
  const p1 = U.boite("proposition", "proposee1"), p3 = U.boite("proposition", "proposee3"), carte = U.boite("proposition", "carte");
  U.viser(tl, id, { x: p1.x - 40, y: carte.y - 30, l: p3.x + p3.l - p1.x + 140, h: p1.y + p1.h - carte.y + 110 }, 1.5, tAlors + 0.1, 1.0);
  const pScene = { x: p1.x + p1.l * 0.5, y: p1.y + p1.h * 0.45 };
  U.aller(tl, id, pScene, m("essayez") - 0.1, 0.8);
  U.cadre(tl, id, p1, m("prochaine") - 0.1, 1.0, 6);
  const tScene = fv + 0.25;
  U.cliquer(tl, id, pScene, tScene);

  // le voile, depuis le centre de l'écran, après la voix
  const tVoile = fv + 0.7;
  window.bruit("souffle", tVoile, 0.8);
  tl.fromTo(q("voile"), { clipPath: "circle(0px at 960px 540px)", opacity: 1 }, { clipPath: "circle(1200px at 960px 540px)", duration: 1.0, ease: "power3.in" }, tVoile);
  // le logo, sur le papier
  const tLogo = tVoile + 0.85;
  window.bruit("etincelles", tLogo + 0.2, 0.5);
  tl.fromTo("#p7-logo #symbole", { scale: 0, rotation: -12, transformOrigin: "50% 60%" }, { scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.8)" }, tLogo);
  tl.fromTo("#p7-logo #nom", { clipPath: "inset(-100% 110% -100% -10%)" }, { clipPath: "inset(-100% -10% -100% -10%)", duration: 1.0, ease: "power1.inOut" }, tLogo + 0.15);
  tl.fromTo(q("suite"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, tLogo + 0.8);
  // le dragon arrive avec son livre, se redresse, fier, puis un petit bond (petits angles)
  const tDragon = tLogo + 0.5;
  tl.fromTo(q("dragon"), { y: 140, rotation: 6, opacity: 0 }, { y: 0, rotation: 0, opacity: 1, duration: 0.8, ease: "back.out(1.6)", immediateRender: false }, tDragon);
  tl.to(q("dragon"), { rotation: -4, scaleY: 1.04, duration: 0.45, ease: "sine.out" }, tDragon + 0.9);
  tl.to(q("dragon"), { rotation: 0, scaleY: 1, duration: 0.45, ease: "sine.inOut" }, tDragon + 1.35);
  tl.to(q("dragon"), { y: -22, duration: 0.25, ease: "power2.out", yoyo: true, repeat: 1 }, tDragon + 1.95);
  tl.to(q("dragon"), { rotation: 3, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, tDragon + 2.6);
};
