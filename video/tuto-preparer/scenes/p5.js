// Passage 5 — « Une fois la classe d'accord, résumez ce que vous avez décidé dans « Nous retenons ».
// L'étape est alors cochée, et vous pouvez passer à la suivante. » Le résumé s'écrit, la pastille
// d'Univers se coche ; « Étape suivante » ; Personnages, puis Enjeu, déjà faits avec la classe.
window.SCENES.p5 = (tl, t0) => {
  const id = "p5";
  const U = window.TUTO;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  U.feuille(id, ["ecartee", "retenons-focus", "retenons-agrandi", "retenons-rempli", "univers-coche", "personnages", "enjeu"]);
  U.reprendre(tl, id, "p4", t0);

  // « Nous retenons… », de près : on doit lire le résumé pendant qu'il s'écrit
  U.viser(tl, id, { x: 711, y: 220, l: 646, h: 260 }, 1.9, T(0.2), 1.2);

  // le résumé : un clic dans le champ, puis la frappe, ligne après ligne (une seconde chacune)
  const texte = U.boite("retenons-focus", "texte");
  const dans = U.point(texte, 0.1, 0.3);
  U.aller(tl, id, dans, m("resumez") - 0.8, 0.7);
  const tClic = m("resumez") + 0.05;
  U.cliquer(tl, id, dans, tClic);
  U.montrer(tl, id, "retenons-focus", tClic + 0.1, 0);
  U.cacherCurseur(tl, id, tClic + 0.3);
  const morceaux = [];
  const ligne = 1.0;
  for (let i = 0; i < 4; i++) {
    const tl0 = tClic + 0.35 + i * ligne;
    // le champ grandit quand la quatrième ligne commence, comme dans l'application ; sa capture porte
    // déjà « après », que l'on couvre pour le taper
    if (i === 3) U.montrer(tl, id, "retenons-agrandi", tl0, 0);
    // la première ligne efface d'abord le texte d'exemple (« Nos repères pour écrire. »)
    morceaux.push(U.taper(tl, id, "retenons-rempli", { x: 749, y: 268 + 34.5 * i, l: 588, h: 33 }, tl0, ligne - 0.05, 16, 0, i === 0 || i === 3));
    if (i) window.BRUITAGES.pop(); // une seule frappe au clavier pour tout le résumé
  }
  // l'écran rempli prend la place des lignes dévoilées quand le blanc posé sur « après » est retiré
  const tRempli = tClic + 0.35 + 3 * ligne + ligne + 0.5;
  U.montrer(tl, id, "retenons-rempli", tRempli, 0);
  U.ranger(tl, morceaux, tRempli + 0.05);
  U.cadre(tl, id, U.boite("retenons-focus", "retenons"), m("retenons") - 0.1, Math.min(1.6, tClic + 0.35 + 3 * ligne - 0.35 - (m("retenons") - 0.1)), 6);

  // l'étape cochée : la caméra recule pour montrer la ligne d'étapes, la pastille d'Univers se coche
  const tRecul = Math.max(m("letape") - 0.6, tRempli + 0.3);
  U.viser(tl, id, { x: 270, y: 16, l: 1090, h: 470 }, 1.4, tRecul, 0.9);
  const tCoche = Math.max(m("cochee") - 0.35, tRecul + 0.8);
  U.montrer(tl, id, "univers-coche", tCoche, 0.25);
  U.cadre(tl, id, U.boite("univers-coche", "univers"), tCoche + 0.2, 1.5, 4);

  // passer à la suivante : la caméra recule sur la page, « Étape suivante : Personnages »
  U.plan(tl, id, m("pouvez") - 0.6, 1.0);
  const suivante = U.boite("univers-coche", "suivante");
  const surSuivante = U.point(suivante);
  U.aller(tl, id, surSuivante, m("passer") - 0.4, 0.7);
  U.cadre(tl, id, suivante, m("suivante") - 0.15, 0.7, 5);
  const tSuivante = m("suivante") + 0.55;
  U.cliquer(tl, id, surSuivante, tSuivante);
  U.montrer(tl, id, "personnages", tSuivante + 0.15, 0.3);

  // Enjeu, dans la ligne d'étapes
  const enjeu = U.point(U.boite("personnages", "enjeu"));
  U.aller(tl, id, enjeu, tSuivante + 0.6, 0.7, true);
  const tEnjeu = tSuivante + 1.6;
  U.cliquer(tl, id, enjeu, tEnjeu);
  U.montrer(tl, id, "enjeu", tEnjeu + 0.15, 0.3);
};
