// Passage 3 — « Pour imaginer la suite, cliquez sur « Construire avec l'IA » et demandez-lui trois
// choix. Elle connaît déjà votre préparation, vos personnages et votre plan : pas besoin de tout lui
// réexpliquer ! Les nouvelles scènes apparaissent alors en pointillé, chacune avec sa consigne. Et
// rien n'est ajouté sans votre accord. » « ✦ Construire avec l'IA », « Ajoute trois choix. »,
// « ✦ Proposer » ; pendant la vraie attente (sa durée mesurée), ce que l'IA connaît déjà, en notes
// sur la table ; trois cartes en pointillé, une fiche et sa liste ; « Ajouter 3 scènes et 3 choix ».
window.SCENES.p3 = (tl, t0) => {
  const id = "p3";
  const U = window.TUTO, A = window.AIDES;
  const T = (t) => t0 + t;
  const m = (mot, n) => T(window.mot(id, mot, n));
  const fin = T(window.dureeDe(id));
  U.feuille(id, [
    "consigne-utilisee", "survol-construire", "bloc-vide", "bloc-focus", "survol-proposer", "bloc-attente",
    "proposition", "proposition-liste", "survol-ajouter", "ajoutees", "ajoutees-sans-message",
  ]);
  U.reprendre(tl, id, "p2b", t0);
  const solde = A.solde(id, [A.apres("consigne"), A.apres("bloc")]);

  // « Construire avec l'IA », sous « Ses choix »
  const construire = U.boite("consigne-utilisee", "construire");
  const pConstruire = U.point(construire, 0.45);
  U.viser(tl, id, { x: 792, y: construire.y - 120, l: 633, h: 400 }, 1.5, T(0.3), 0.9);
  U.aller(tl, id, pConstruire, m("cliquez") - 0.5, 0.7);
  U.montrer(tl, id, "survol-construire", m("cliquez") + 0.25, 0.15);
  U.cadre(tl, id, construire, m("construire") - 0.3, 1.2, 5);
  const tConstruire = m("ia") + 0.35;
  U.cliquer(tl, id, pConstruire, tConstruire);
  U.montrer(tl, id, "bloc-vide", tConstruire + 0.15, 0.3);
  // le panneau du bloc : « La suite de Au bord de la rivière »
  const bloc = U.boite("bloc-vide", "bloc"), demande = U.boite("bloc-vide", "demande");
  U.viser(tl, id, { x: bloc.x, y: bloc.y - 10, l: bloc.l, h: 360 }, 1.5, tConstruire + 0.3, 0.8);
  // « demandez-lui trois choix » : la demande s'écrit
  const pDemande = { x: demande.x + 120, y: demande.y + 26 };
  U.aller(tl, id, pDemande, tConstruire + 0.4, 0.5, true);
  const tChamp = Math.max(m("demandez") - 0.25, tConstruire + 1.0);
  U.cliquer(tl, id, pDemande, tChamp);
  U.montrer(tl, id, "bloc-focus", tChamp + 0.1, 0);
  U.cacherCurseur(tl, id, tChamp + 0.3);
  const tTape = Math.max(m("trois") - 0.35, tChamp + 0.35);
  // le texte d'exemple du champ s'efface dès la première lettre : un blanc sur tout l'intérieur du champ
  const blanc = document.createElement("div");
  blanc.className = "morceau";
  blanc.id = `${id}-blanc`;
  blanc.style.cssText = `left:${demande.x + 5}px;top:${demande.y + 5}px;width:${demande.l - 60}px;height:${demande.h - 10}px;background:#fff;border-radius:6px`;
  const feuille = document.getElementById(`${id}-feuille`);
  feuille.insertBefore(blanc, feuille.querySelector(".clic-app"));
  tl.set(`#${blanc.id}`, { opacity: 1 }, tTape);
  const tape = U.taper(tl, id, "survol-proposer", { x: demande.x + 6, y: demande.y + 6, l: 170, h: 44 }, tTape, 0.9, 19, 0);
  // « ✦ Proposer »
  const proposer = U.boite("bloc-vide", "proposer");
  const pProposer = U.point(proposer, 0.45);
  const tVers = tTape + 1.1;
  U.aller(tl, id, pProposer, tVers, 0.6);
  U.montrer(tl, id, "survol-proposer", tVers + 0.6, 0.1);
  U.ranger(tl, [tape, `#${blanc.id}`], tVers + 0.75);
  const tProposer = tVers + 0.95;
  U.cliquer(tl, id, pProposer, tProposer);
  U.montrer(tl, id, "bloc-attente", tProposer + 0.15, 0);
  A.attente(tl, id, "bloc", tProposer + 0.17, A.duree("bloc") - 0.17);
  U.cacherCurseur(tl, id, tProposer + 0.4);
  // la vraie attente : la caméra recule sur tout l'écran
  const tReponse = tProposer + A.duree("bloc");
  U.plan(tl, id, tProposer + 0.5, 1.0);

  // « Elle connaît déjà votre préparation, vos personnages et votre plan » : trois notes de l'histoire,
  // posées sur la table, qui glissent vers le panneau de l'IA quand la voix dit « pas besoin de tout lui réexpliquer »
  const notes = [
    [A.note(id, "<h4>Votre préparation</h4><p>Une immense forêt dont les arbres deviennent bleus la nuit. Retrouver la pierre de lune avant la fin de l’hiver…</p>", 330, 560, 430, -3), "preparation"],
    [A.note(id, '<h4>Vos personnages</h4><div class="portraits"><figure><img src="portraits/timeo.jpg" alt="" />Timéo</figure><figure><img src="portraits/pic.jpg" alt="" />Pic</figure></div>', 800, 530, 322, 2.5), "personnages"],
    [A.note(id, "<h4>Votre plan</h4><ul><li>Le vieux coffre</li><li>Le sentier interdit</li><li>La rivière aux reflets</li><li>Les grottes chantantes</li></ul>", 480, 300, 380, 2), "plan"],
  ];
  notes.forEach(([sel, mot], i) => {
    const angle = [-3, 2.5, 2][i];
    tl.fromTo(sel, { y: 60, rotation: angle - 6, opacity: 0, scale: 1 }, { y: 0, rotation: angle, opacity: 1, duration: 0.6, ease: "back.out(1.5)", immediateRender: false }, Math.max(m(mot) - 0.25, tProposer + 0.9));
  });
  const tGlisse = Math.max(m("besoin") - 0.2, tProposer + 1.5);
  notes.forEach(([sel], i) => {
    tl.to(sel, { x: [700, 330, 560][i], y: [-200, -150, 40][i], scale: 0.25, opacity: 0, rotation: 0, duration: 0.8, ease: "power2.in" }, tGlisse + i * 0.18);
  });

  // la proposition, après la durée réelle de la réponse : trois cartes en pointillé sous la scène
  U.montrer(tl, id, "proposition", tReponse, 0.35);
  window.bruit("etincelles", tReponse, 0.6);
  solde.descendre(tl, 1, tReponse + 0.6);
  const p1 = U.boite("proposition", "proposee1"), p3 = U.boite("proposition", "proposee3"), carte = U.boite("proposition", "carte");
  const schema = { x: p1.x - 40, y: carte.y - 30, l: p3.x + p3.l - p1.x + 80, h: p1.y + p1.h - carte.y + 70 };
  U.viser(tl, id, schema, 1.75, Math.max(tReponse + 0.3, m("nouvelles") - 0.3), 1.0);
  U.cadre(tl, id, { x: p1.x, y: p1.y, l: p3.x + p3.l - p1.x, h: p1.h }, Math.max(m("pointille") - 0.3, tReponse + 1.4), 1.3, 8);
  // « chacune avec sa consigne » : une fiche du panneau, son titre et sa consigne, puis sa liste
  U.viser(tl, id, { x: bloc.x, y: 420, l: bloc.l, h: 390 }, 1.6, m("chacune") - 0.5, 0.9);
  U.montrer(tl, id, "proposition-liste", m("consigne") + 0.5, 0.4);

  // « rien n'est ajouté sans votre accord » : les cartes restent en pointillé jusqu'au bouton « Ajouter 3 scènes et 3 choix »
  const ajouter = U.boite("proposition", "ajouter");
  const pAjouter = U.point(ajouter, 0.5);
  U.plan(tl, id, m("rien") - 0.9, 0.9);
  U.cadre(tl, id, { x: p1.x, y: p1.y, l: p3.x + p3.l - p1.x, h: p1.h }, m("rien") - 0.1, 1.0, 8);
  U.aller(tl, id, pAjouter, m("ajoute") - 0.2, 0.7);
  U.montrer(tl, id, "survol-ajouter", m("ajoute") + 0.5, 0.1);
  U.cadre(tl, id, ajouter, m("accord") - 0.3, 0.9, 5);
  const tAjouter = Math.max(window.finVoix(id) + t0 + 0.3, m("accord") + 0.6);
  U.cliquer(tl, id, pAjouter, tAjouter);
  U.montrer(tl, id, "ajoutees", tAjouter + 0.15, 0.3);
  U.cacherCurseur(tl, id, tAjouter + 0.4);
  // les trois scènes sont dans le chapitre : leurs cartes sont pleines
  U.viser(tl, id, { x: schema.x, y: schema.y, l: schema.l + 60, h: schema.h + 40 }, 1.5, tAjouter + 0.3, 0.8);
  U.depart(tl, id, fin);
  tl.to(solde.sel, { opacity: 0, duration: 0.3 }, fin - 0.5);
};
