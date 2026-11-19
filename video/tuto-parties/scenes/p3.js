// Passage 3 — « Pour ajouter un chapitre, cliquez sur « Ajouter un chapitre » sous la partie de
// votre choix. Donnez-lui un titre, ajoutez un résumé si vous le souhaitez, puis choisissez une
// image. » La page remonte sur « La forêt de la nuit » ; « Ajouter un chapitre » ; les réglages du
// chapitre remplis, l'image choisie ; la carte du chapitre. Puis le temps saute : trois chapitres
// de plus.
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  // avant-fete d'abord : sa colonne, sans le voile d'un panneau, reste sous la page qui défile
  const ecrans = ["avant-fete", "reglages", "titre-frappe", "resume-focus", "resume-2", "images", "chercher-focus", "images-riviere", "survol-riviere", "image-choisie", "chapitre-ajoute"];
  U.feuille(id, ecrans);
  U.reprendre(tl, id, "p2", t0);

  // la page, restée en bas, remonte sur la deuxième partie, en haut de la fenêtre (618 points) :
  // sa carte « Ajouter un chapitre » entière
  const plan = U.page(tl, id, "plan", 232, 931, t0);
  plan.aller(618, T(0.1), 1.2);
  U.viser(tl, id, { x: 240, y: 0, l: 1180, h: 500 }, 1.3, T(0.4), 1.2);

  // « Ajouter un chapitre », au bout de la partie (sa place dans la fenêtre descendue)
  const ajPage = U.boite("plan", "ajouterForet");
  const aj = { ...ajPage, y: ajPage.y - 618 };
  const pAj = U.point(aj, 0.5, 0.45);
  U.cadre(tl, id, aj, m("ajouter", 2) - 0.1, 1.6, 6);
  U.aller(tl, id, pAj, m("ajouter", 2) + 0.3, 0.8);
  const tAj = Math.max(m("choix") + 0.15, m("ajouter", 2) + 1.4);
  U.cliquer(tl, id, pAj, tAj);
  plan.cacher(tAj + 0.15);
  U.montrer(tl, id, "reglages", tAj + 0.1, 0);
  // « Réglages du chapitre » : « Nouveau chapitre » sélectionné dans le titre
  // de près : le titre et le résumé, le temps de les voir s'écrire
  U.viser(tl, id, { x: 1005, y: 115, l: 420, h: 270 }, 2.35, tAj + 0.25, 1.0, 960, 540);
  U.cacherCurseur(tl, id, tAj + 0.4);

  // le titre s'écrit (le champ porte le cadre du focus : on n'en dévoile que l'intérieur)
  const titre = U.boite("reglages", "titre");
  const tTitre = Math.max(m("titre") - 0.25, tAj + 1.2);
  const dTitre = 1.1;
  const mTitre = U.taper(tl, id, "titre-frappe", titre, tTitre, dTitre, 18, -4, true);
  U.montrer(tl, id, "titre-frappe", tTitre + dTitre + 0.1, 0);
  U.ranger(tl, [mTitre], tTitre + dTitre + 0.15);

  // le résumé : un clic dans le champ, puis deux lignes, l'une après l'autre
  const resume = U.boite("reglages", "resume");
  const pResume = U.point(resume, 0.4, 0.55);
  U.aller(tl, id, pResume, tTitre + dTitre - 0.05, 0.45);
  const tResume = tTitre + dTitre + 0.4;
  U.cliquer(tl, id, pResume, tResume);
  U.montrer(tl, id, "resume-focus", tResume + 0.1, 0);
  U.cacherCurseur(tl, id, tResume + 0.3);
  const ligne = (n) => ({ x: resume.x + 8, y: resume.y + 9 + 21 * n, l: resume.l - 40, h: 21 });
  const tL1 = tResume + 0.3;
  const m1 = U.taper(tl, id, "resume-2", ligne(0), tL1, 1.05, 16, 0);
  const m2 = U.taper(tl, id, "resume-2", ligne(1), tL1 + 1.15, 0.95, 14, 0);
  const tRempli = tL1 + 2.15;
  U.montrer(tl, id, "resume-2", tRempli, 0);
  U.ranger(tl, [m1, m2], tRempli + 0.05);

  // « Choisir une image » : les visuels proposés, la rivière
  const choisir = U.boite("reglages", "choisir");
  const pChoisir = U.point(choisir);
  U.viser(tl, id, { x: 1005, y: 110, l: 420, h: 450 }, 1.85, tRempli - 0.1, 0.7, 960, 560);
  U.aller(tl, id, pChoisir, tRempli + 0.05, 0.6, true);
  const tChoisir = Math.max(m("choisissez") + 0.2, tRempli + 0.5);
  U.cliquer(tl, id, pChoisir, tChoisir);
  U.montrer(tl, id, "images", tChoisir + 0.15, 0.25);
  U.viser(tl, id, { x: 1005, y: 60, l: 420, h: 520 }, 1.75, tChoisir + 0.2, 0.9, 960, 540);
  // la rivière est en bas de la liste : on la cherche (« Chercher : forêt, mer, château… »)
  const chercher = U.boite("images", "chercher");
  const pChercher = U.point(chercher, 0.3);
  U.aller(tl, id, pChercher, tChoisir + 0.3, 0.5, true);
  const tChercher = tChoisir + 0.85;
  U.cliquer(tl, id, pChercher, tChercher);
  U.montrer(tl, id, "chercher-focus", tChercher + 0.1, 0);
  U.cacherCurseur(tl, id, tChercher + 0.3);
  // « rivière » s'écrit (le champ porte le cadre du focus) ; la liste se réduit à la rivière
  const dCherche = 0.5;
  const mCherche = U.taper(tl, id, "images-riviere", chercher, tChercher + 0.3, dCherche, 7, -4, true);
  const tFiltre = tChercher + 0.3 + dCherche + 0.1;
  U.montrer(tl, id, "images-riviere", tFiltre, 0.2);
  U.ranger(tl, [mCherche], tFiltre + 0.2);
  const riviere = U.point(U.boite("images-riviere", "riviere"));
  U.aller(tl, id, riviere, tFiltre + 0.1, 0.5);
  U.montrer(tl, id, "survol-riviere", tFiltre + 0.6, 0.15);
  const tRiviere = tFiltre + 0.8;
  U.cliquer(tl, id, riviere, tRiviere);
  U.montrer(tl, id, "image-choisie", tRiviere + 0.15, 0.25);

  // retour aux réglages, l'image posée ; « Fermer »
  const fermer = U.boite("image-choisie", "fermer");
  const pFermer = U.point(fermer);
  U.aller(tl, id, pFermer, tRiviere + 0.4, 0.6, true);
  const tFermer = tRiviere + 1.1;
  U.cliquer(tl, id, pFermer, tFermer);
  U.montrer(tl, id, "chapitre-ajoute", tFermer + 0.15, 0.3);
  U.cacherCurseur(tl, id, tFermer + 0.35);
  // la carte du chapitre, dans sa partie
  U.viser(tl, id, { x: 240, y: 0, l: 1180, h: 500 }, 1.3, tFermer + 0.2, 1.0);
  const carte = U.boite("chapitre-ajoute", "ajouterForet"); // « Ajouter » a glissé : la carte est à sa place d'avant
  U.cadre(tl, id, { x: carte.x - 292, y: carte.y, l: carte.l, h: carte.h }, tFermer + 0.45, 1.0, 6);

  // le temps saute : trois chapitres de plus, la page entière à la même hauteur
  const rempli = U.page(tl, id, "plan-rempli", 232, 618, fin - 0.7);
  rempli.montrer(fin - 0.7, 0.45);
};
