// Passage 6 — « Pour finir, place à l'illustration ! L'IA propose une description, y joint les
// portraits de vos personnages et crée une image dans le style de votre livre. Et voilà Timéo et Pic,
// comme la classe les avait imaginés. » « + Insérer », « Image », « ✦ Créer une image » ; le ✦ de « Ce
// que montre l'image » : la description arrive en temps réel ; les badges de Timéo et de Pic ; « ✦ Créer
// l'image » : le temps saute, sa durée réelle dite sur la table ; « ✓ Garder » : l'image dans le texte
// d'Inès, les deux portraits à côté. Le solde descend deux fois.
window.SCENES.p6 = (tl, t0) => {
  const id = "p6";
  const U = window.TUTO, A = window.AIDES;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "gardes", "scene-corrigee", "survol-inserer", "menu-inserer", "survol-image", "fiche-image", "survol-creer-une", "creer-une-image",
    "survol-decrire", "description-attente", "description", "survol-creer-l-image", "image-attente", "image-proposee-vue",
    "survol-garder-l-image", "image-gardee",
  ]);
  U.reprendre(tl, id, "p5", t0);
  const solde = A.solde(id, [A.apres("correction"), A.apres("description"), A.apres("image")]);
  U.montrer(tl, id, "scene-corrigee", T(0.1), 0.3);

  // « place à l'illustration » : « + Insérer », « Image », puis « ✦ Créer une image »
  const inserer = U.boite("scene-corrigee", "inserer");
  const pInserer = U.point(inserer, 0.45);
  // 1,36 : la feuille remplit l'écran (à 1,3, une fine bande de table l'entourait)
  U.viser(tl, id, { x: 256, y: 180, l: 1160, h: 500 }, 1.36, T(0.2), 0.9);
  U.aller(tl, id, pInserer, m("place") - 0.5, 0.7);
  U.montrer(tl, id, "survol-inserer", m("place") + 0.2, 0.1);
  const tInserer = m("illustration") + 0.3;
  U.cliquer(tl, id, pInserer, tInserer);
  U.montrer(tl, id, "menu-inserer", tInserer + 0.12, 0.15);
  const entree = U.boite("menu-inserer", "image");
  const pEntree = U.point(entree, 0.3);
  U.aller(tl, id, pEntree, tInserer + 0.25, 0.5, true);
  U.montrer(tl, id, "survol-image", tInserer + 0.75, 0.1);
  const tEntree = tInserer + 1.15;
  U.cliquer(tl, id, pEntree, tEntree);
  U.montrer(tl, id, "fiche-image", tEntree + 0.12, 0.2);
  const creerUne = U.boite("fiche-image", "creerUne");
  const pCreerUne = U.point(creerUne, 0.45);
  U.viser(tl, id, { x: 1000, y: 150, l: 420, h: 420 }, 1.6, tEntree + 0.2, 0.8);
  U.aller(tl, id, pCreerUne, tEntree + 0.3, 0.6, true);
  U.montrer(tl, id, "survol-creer-une", tEntree + 0.9, 0.1);
  const tCreerUne = tEntree + 1.25;
  U.cliquer(tl, id, pCreerUne, tCreerUne);
  U.montrer(tl, id, "creer-une-image", tCreerUne + 0.12, 0.25);

  // le ✦ de « Ce que montre l'image » : la description arrive après sa durée réelle
  const decrire = U.boite("creer-une-image", "decrire");
  const pDecrire = U.point(decrire);
  const creer = U.boite("creer-une-image", "creer");
  U.viser(tl, id, { x: creer.x - 20, y: creer.y - 10, l: creer.l + 40, h: 420 }, 1.75, tCreerUne + 0.25, 0.8);
  U.aller(tl, id, pDecrire, tCreerUne + 0.35, 0.6, true);
  U.montrer(tl, id, "survol-decrire", tCreerUne + 0.95, 0.1);
  U.cadre(tl, id, decrire, tCreerUne + 0.9, 0.6, 5);
  const tDecrire = Math.max(tCreerUne + 1.3, m("ia") - 0.4);
  U.cliquer(tl, id, pDecrire, tDecrire);
  U.montrer(tl, id, "description-attente", tDecrire + 0.1, 0);
  A.attente(tl, id, "description", tDecrire + 0.12, A.duree("description") - 0.12);
  U.cacherCurseur(tl, id, tDecrire + 0.4);
  const tDescription = tDecrire + A.duree("description");
  U.montrer(tl, id, "description", tDescription, 0.35);
  window.bruit("etincelles", tDescription, 0.5);
  solde.descendre(tl, 1, tDescription + 0.5);
  const description = U.boite("description", "description"), badges = U.boite("description", "badges");
  U.viser(tl, id, { x: creer.x - 20, y: description.y - 60, l: creer.l + 40, h: badges.y + badges.h - description.y + 90 }, 1.75, tDescription - 0.1, 0.9);
  // « y joint les portraits de vos personnages » : les badges de Timéo et de Pic
  U.cadre(tl, id, { x: badges.x - 4, y: badges.y + 14, l: 270, h: badges.h - 10 }, Math.max(m("portraits") - 0.2, tDescription + 0.7), 1.6, 5);

  // « et crée une image » : « ✦ Créer l'image », puis le temps saute
  const creerLImage = U.boite("survol-creer-l-image", "creerLImage");
  const pCreer = U.point(creerLImage, 0.45);
  const tVers = Math.max(m("cree") - 0.6, tDescription + 1.6);
  U.aller(tl, id, pCreer, tVers, 0.6);
  U.montrer(tl, id, "survol-creer-l-image", tVers + 0.55, 0);
  const tCreer = Math.max(m("image") + 0.2, tVers + 0.9);
  U.cliquer(tl, id, pCreer, tCreer);
  U.montrer(tl, id, "image-attente", tCreer + 0.15, 0);
  U.cacherCurseur(tl, id, tCreer + 0.4);
  // l'image arrive : sa durée réelle est dite sur la table
  const tImage = Math.max(tCreer + 2.6, m("voila") - 2.4);
  A.attente(tl, id, "image", tCreer + 0.2, tImage - tCreer - 0.2);
  A.saut(tl, id, A.duree("image"), tImage - 1.1, 2.4);
  // le panneau a défilé jusqu'à la proposition : coupe franche (un fondu superposerait deux hauteurs du même texte)
  U.montrer(tl, id, "image-proposee-vue", tImage, 0.12);
  window.bruit("etincelles", tImage, 0.6);
  solde.descendre(tl, 2, tImage + 0.6);
  const proposition = U.boite("image-proposee-vue", "proposition"), badges2 = U.boite("image-proposee-vue", "badges");
  U.viser(tl, id, { x: creer.x - 20, y: badges2.y - 30, l: creer.l + 40, h: proposition.y + proposition.h - badges2.y + 50 }, 1.9, tImage + 0.15, 0.9);

  // « Et voilà Timéo et Pic » : « ✓ Garder », l'image se pose dans le texte d'Inès
  const garder = U.boite("image-proposee-vue", "garderLImage");
  const pGarder = U.point(garder, 0.5);
  U.aller(tl, id, pGarder, tImage + 0.9, 0.6);
  U.montrer(tl, id, "survol-garder-l-image", tImage + 1.45, 0.1);
  const tGarder = tImage + 1.7;
  U.cliquer(tl, id, pGarder, tGarder);
  U.montrer(tl, id, "image-gardee", tGarder + 0.15, 0.25);
  U.cacherCurseur(tl, id, tGarder + 0.4);
  // la page descend jusqu'à l'image (la page entière, telle qu'elle est après « Garder »)
  const image = U.boite("image-gardee", "imageBloc");
  const page = U.page(tl, id, "image-gardee-page", 232, 0, tGarder + 0.45);
  const descente = image.y - 150;
  page.aller(descente, tGarder + 0.6, 1.0);
  U.viser(tl, id, { x: image.x - 30, y: 150 - 20, l: image.l + 330, h: image.h + 40 }, 1.5, tGarder + 0.45, 1.4);
  // « comme la classe les avait imaginés » : les deux portraits, posés à côté de l'image
  const portraits = [
    A.note(id, '<div class="portraits"><figure><img src="portraits/timeo.jpg" alt="" />Timéo</figure></div>', 1466, 250, 176, 3),
    A.note(id, '<div class="portraits"><figure><img src="portraits/pic.jpg" alt="" />Pic</figure></div>', 1500, 560, 176, -3),
  ];
  portraits.forEach((sel, i) => {
    const angle = [3, -3][i];
    tl.fromTo(sel, { x: 260, rotation: angle + 8, opacity: 0 }, { x: 0, rotation: angle, opacity: 1, duration: 0.7, ease: "back.out(1.4)", immediateRender: false }, Math.max(m("comme") - 0.3, tGarder + 1.9) + i * 0.25);
    tl.to(sel, { x: 260, opacity: 0, duration: 0.5, ease: "power2.in" }, fin - 0.6 + i * 0.05);
  });
};
