/* Quatrième lot : partager une version terminée et la lire en ligne (F12.1, F12.3).
   Onglet Partage de la destination Livre, lecteur en ligne sans compte, entrée
   « Lectures » de l'espace élève. Simulation sans persistance ; dispositions proposées. */
(function () {
  const A = window.App; const L = A.livre;
  const { D, H, st, $, $$, esc, tampon, eleve, perso, choix, toast, rendre } = A;
  const ui = L.ui; const fr = L.fr;
  st.partage = 'non';   // cas de la barre de présentation
  st.acces = 'lien';    // lien (famille, sans compte) · classe (élève identifié) · apercu (prévisualisation de l'adulte)

  const JETONS = ['7kq2-m9xd', 'p3wd-8hnc', 'v6ra-2tjk'];
  const HOTE = 'youareahero.example/lire/';
  const DATE_PARTAGE = { long: 'vendredi 18 juin 2027, 16 h 45', court: '18 juin, 16 h 45' };
  const DATE_SUITE = { long: 'lundi 21 juin 2027, 9 h 10', court: '21 juin, 9 h 10' };
  const AUTRES_LIVRES = [
    { titre: 'Le phare des sept vents', sous: 'Un livre dont tu es le héros', ligne: 'Classe de CM1-CM2, 2025-2026', meta: 'Livre à choix · 52 passages' },
    { titre: 'L’île aux horloges', sous: 'Roman de classe', ligne: '', meta: 'Récit · 9 chapitres' }
  ];

  /* ——— État de la maquette ——————————————————————————————————— */
  const pg = {};
  const lec = { chemin: [], chap: null, erreur: null, panneau: false, vide: false };
  const ligneImprimee = () => [ui.pages.titre.auteur, ui.pages.titre.annee].filter(Boolean).join(', ');
  const formuleDiscrete = () => perso() ? '' : 'Une classe de CM1-CM2';
  // Auteurs et classe : affichés par défaut lorsque le livre les comporte, comme dans le livre ; l'adulte peut retirer chacun (F12-AC15, révisé le 3 octobre 2026)
  const reglages0 = () => ({ ligne: { on: !!ligneImprimee().trim(), texte: ligneImprimee() }, auteurs: { on: !!ui.pages.auteurs.on, noms: [...ui.pages.auteurs.noms] } });
  const corrige = p => p.replace('s’épaissi ', 's’épaissit ');
  function init() {
    Object.assign(pg, { version: null, canaux: { lien: false, classes: false }, jeton: 0, anciens: [], ancien: false, retireLe: null, reglages: reglages0(),
      feuille: null, canal: null, coche: false, fait: null, confirme: null, retourFocus: null, nomsOuverts: false });
    ui.etatsSim = {};
    Object.assign(lec, { chemin: [], chap: null, erreur: null, panneau: false });
    const cas = st.partage;
    if (cas === 'non') return;
    // Un livre déjà partagé a passé toutes les étapes : elles restent ouvertes, quoi qu'il arrive ensuite (F11.6)
    ui.convient = true; ui.preAccepte = true; ui.ouvertes.add('page'); ui.ouvertes.add('sortie');
    // Les cas « déjà partagé » partent du livre prêt du 18 juin, avec son PDF définitif
    ui.pdf = '18 juin, 16 h 40';
    const version = instantane(pg.reglages, DATE_PARTAGE);
    ui.pdfSig = version.contenu;
    if (cas === 'retire') { pg.retireLe = DATE_SUITE; return; }
    pg.version = version; pg.canaux = { lien: true, classes: !perso() };
    // Depuis le partage : coquille corrigée dans l'aperçu (F12-AC08), puis scène rouverte aux élèves (F12-AC09)
    if (cas === 'modifie' || cas === 'rouverte') { ui.edits.S003 = L.TX.juin.S003.map(corrige); ui.change = true; }
    if (cas === 'rouverte') ui.etatsSim = { S028: 'reprendre' };
  }
  init();

  /* ——— Instantané : ce que la version partagée fige —————————————— */
  const contenuSig = (S, N) => JSON.stringify([N.liste.map(r => { const x = S[r]; return [r, N.num[r], x.texte, x.choix.map(c => [L.texteAuto(`${r}:${c.i}`, c.lib, '', c.construction), c.dest]), x.phrases, x.cachees, x.fin, x.image?.nom]; }),
    ui.pages.titre.titre, ui.pages.titre.sous, choix() && ui.pages.mode.on, ui.pages.fin, ui.fin, ui.titres, ui.titresChap, A.jeu.sig()]);
  const reglSig = r => JSON.stringify([r.ligne.on && r.ligne.texte.trim(), r.auteurs.on && r.auteurs.noms]);
  L.signature = () => { const S = L.modele(); return contenuSig(S, L.numeroter(S)); };
  function instantane(regl, date) {
    const S = L.modele(); const N = L.numeroter(S); const P = {}; const parNum = {}; const chapitres = [];
    N.liste.forEach(r => {
      const x = S[r];
      P[r] = {
        ref: r, n: N.num[r] || null, texte: x.texte, fin: x.fin,
        // Les actions de jeu font partie de l'instantané partagé, comme la feuille d'aventure (F04.2, F12.1)
        actions: A.jeu.actionsDe(r).map(a => ({ ...a })),
        // Le lecteur affiche la phrase de choix du livre, renvoi compris (F05, F12.1)
        choix: L.phrasesDe(x).filter(o => o.c && S[o.c.dest]?.inclus).map(({ c }) => ({ texte: L.texteAuto(`${r}:${c.i}`, c.lib, N.num[c.dest], c.construction), n: N.num[c.dest] })),
        phrases: x.phrases.map(ph => ph.map(seg => typeof seg === 'string' ? seg : N.num[x.choix[seg].dest])),
        cles: x.cachees.filter(c => S[c.dest]?.inclus).map(c => N.num[c.dest]),
        image: x.image && !x.image.manquante ? { src: x.image.src, largeur: x.image.largeur } : null,
        partie: x.partie, ouverture: L.ouverture(x.partie) === r
      };
      if (P[r].n) parNum[P[r].n] = P[r];
      const d = chapitres[chapitres.length - 1];
      if (d && d.id === x.chap.id) d.refs.push(r); else chapitres.push({ id: x.chap.id, titre: x.chap.titre, partie: x.partie, refs: [r] });
    });
    chapitres.forEach((c, i) => { c.premier = i === 0 || chapitres[i - 1].partie !== c.partie; });
    const p = ui.pages;
    return {
      date, choix: choix(), P, parNum, chapitres, total: N.liste.length, depart: N.num[H.depart] || null,
      titre: p.titre.titre, sous: p.titre.sous, ligne: regl.ligne.on ? regl.ligne.texte.trim() : '', auteurs: regl.auteurs.on ? [...regl.auteurs.noms] : null,
      mode: choix() && p.mode.on, finPage: p.fin.on ? p.fin.texte : '', marque: ui.fin || 'Fin', titres: ui.titres, titresChap: ui.titresChap,
      sorties: N.liste.filter(r => !S[r].choix.length && S[r].cachees.length),
      contenu: contenuSig(S, N), regl: reglSig(regl), ...A.jeu.lecteur.figer()
    };
  }
  function situation(S, N, P) {
    const v = pg.version; const cour = contenuSig(S, N);
    const pdfSig = ui.pdf ? (ui.pdfSig ?? (ui.change ? null : cour)) : null;
    return { v, B: L.bloquants(P), actif: !!v && (pg.canaux.lien || pg.canaux.classes), change: !!v && v.contenu !== cour, reglChange: !!v && v.regl !== reglSig(pg.reglages),
      memePdf: !!v && !!ui.pdf && pdfSig === v.contenu };
  }
  const maintenant = () => st.partage !== 'non' || pg.version || pg.retireLe ? DATE_SUITE : DATE_PARTAGE;
  const url = j => `${HOTE}<b>${JETONS[j]}</b>`;
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

  /* ——— Onglet Partage, simplifié le 4 octobre 2026 ———————————————————————
     Le porteur le jugeait beaucoup trop compliqué. L'écran dit l'état en une phrase, propose deux façons de lire,
     replie les noms affichés et montre la première page du lecteur. Les explications passent derrière une icône
     d'information ; les règles de F12.1 sont inchangées. */
  // Ce qui empêche de partager ou de mettre à jour : les raisons du PDF définitif, sans celles de la mise en page
  const raisonsContenu = P => L.raisonsPdf(P).filter(([t]) => t !== 'page');
  const listeRaisons = P => `<ul class="sortie__raisons">${raisonsContenu(P).map(([t, quoi]) => `<li><a class="lien" href="#/livre" data-act="partage-vers-temps" data-v="${t}">${L.ETAPES[t]}</a> · ${quoi}</li>`).join('')}</ul>`;
  function phraseEtat(s) {
    const v = s.v;
    if (v && s.change) return ['change', 'i-alerte', `<b>Le livre a changé depuis le partage</b> du ${v.date.court}.`, 'Les lecteurs lisent toujours la version partagée : rien ne change pour eux tant que vous ne la mettez pas à jour.'];
    if (v && s.reglChange) return ['change', 'i-alerte', `<b>Les noms affichés ont changé depuis le partage</b> du ${v.date.court}.`, 'Vos réglages s’appliqueront à la prochaine mise à jour.'];
    if (v && !s.actif) return ['neutre', 'i-info', '<b>Personne ne peut lire ce livre pour l’instant.</b>', `La version du ${v.date.long} est conservée. Activez une façon de lire ci-dessous.`];
    if (v) return ['ok', 'i-coche', `<b>Livre partagé</b>, à jour depuis le ${v.date.court}.`, 'Les lecteurs lisent une copie datée du livre. Vos corrections n’y entrent que lorsque vous la mettez à jour.'];
    if (pg.retireLe) return ['neutre', 'i-info', `<b>Partage retiré</b> le ${pg.retireLe.court}.`, 'Le lien affiche « Ce livre n’est plus partagé ». Un nouveau partage réactivera le même lien.'];
    return s.B.length
      ? ['bloque', 'i-bloque', '<b>Ce livre ne peut pas encore être partagé.</b>', 'Les conditions sont celles du PDF définitif : toutes les scènes prêtes, aucun point à corriger. Avoir exporté un PDF n’est pas exigé.']
      : ['neutre', 'i-partage', '<b>Ce livre n’est pas partagé.</b> Choisissez qui peut le lire.', 'Le partage fige une copie datée du livre. Activer une façon de lire demande de confirmer un court rappel.'];
  }
  function phrasePdf(s) {
    if (!s.v || !ui.pdf) return '';
    return s.memePdf ? ` Cette version et le PDF définitif du ${ui.pdf} portent sur le même état du livre.` : ` Le PDF définitif du ${ui.pdf} porte sur un autre état du livre.`;
  }
  function ficheEtat(s, P) {
    const [cls, icone, phrase, plus] = phraseEtat(s); const v = s.v;
    const maj = v && (s.change || s.reglChange); const bloque = s.B.length > 0;
    // Mise à jour impossible (scène rouverte, point à corriger) : l'écran le dit au lieu de proposer un bouton qui sera refusé
    const refus = maj && bloque ? `<p class="pg-refus">${ic('i-bloque')}<span><b>Mise à jour impossible pour l’instant.</b> Les lecteurs gardent la version partagée.</span></p>${listeRaisons(P)}` : !v && !pg.retireLe && bloque ? listeRaisons(P) : '';
    const actions = [
      maj && !bloque ? `<button class="btn btn--primaire" data-act="partage-maj" aria-haspopup="dialog">${ic('i-recommencer')}Mettre à jour le partage</button>` : '',
      v && pg.confirme !== 'retrait' ? `<button class="btn btn--discret" data-act="partage-confirme" data-v="retrait">Retirer le partage…</button>` : ''
    ].join('');
    const retrait = pg.confirme === 'retrait' ? `<div class="pg-confirm" role="alertdialog" aria-labelledby="pg-ret-t"><p id="pg-ret-t"><b>Retirer le partage ?</b></p>
        <p>Plus personne ne pourra lire ce livre en ligne. Un nouveau partage réactivera le même lien.</p>
        <div><button class="btn btn--primaire" data-act="partage-retirer">Retirer le partage</button><button class="btn" data-act="partage-confirme" data-v="">Annuler</button></div></div>` : '';
    return `<section class="pg-etat" aria-label="État du partage">
        <p class="pg-phrase pg-phrase--${cls}">${ic(icone)}<span>${phrase}</span>${L.info(plus + phrasePdf(s), 'Où en est le partage ?')}</p>
        ${refus}${actions ? `<div class="pg-etat__actions">${actions}</div>` : ''}${retrait}
      </section>`;
  }
  // Ligne reprise dans le bandeau « Livre intérieur », visible depuis tous les onglets
  L.lignePartage = (S, N, P) => {
    const s = situation(S, N, P); if (!s.v && !pg.retireLe) return '';
    const lien = st.arg === 'partage' ? '' : ' <a href="#/livre/partage">Voir le partage</a>';
    if (!s.v) return `<p class="livre-pdf livre-pdf--neutre">${ic('i-partage')}<span><b>Partage retiré</b> le ${pg.retireLe.court}.${lien}</span></p>`;
    return s.change || s.reglChange
      ? `<p class="livre-pdf livre-pdf--change">${ic('i-partage')}<span><b>${s.change ? 'Le livre a changé depuis la version partagée' : 'Réglages d’auteurs modifiés depuis la version partagée'}</b> du ${s.v.date.court}.${lien}</span></p>`
      : `<p class="livre-pdf livre-pdf--ok">${ic('i-partage')}<span><b>Version partagée à jour</b> : ${s.v.date.court}.${lien}</span></p>`;
  };

  // État du partage en deux mots, pour l'étape « Imprimer et partager » de la frise du livre
  L.pointPartage = (S, N, P) => { const s = situation(S, N, P); if (!s.v) return ''; return s.change || s.reglChange ? `<span class="tpoint tpoint--avert">${ic('i-partage')}partage à mettre à jour</span>` : `<span class="tpoint">${ic('i-partage')}partagé</span>`; };
  L.partage = (S, N, P) => !!situation(S, N, P).v;

  /* ——— Onglet Partage : qui peut lire, noms affichés, aperçu ——————————— */
  const inter = (act, v, on, nom) => `<label class="inter pg-inter"><input type="checkbox" role="switch" data-act="${act}" data-v="${v}" ${on ? 'checked' : ''} aria-label="${nom}"><span class="inter__piste" aria-hidden="true"></span><span aria-hidden="true">${on ? 'Activé' : 'Désactivé'}</span></label>`;
  function blocCanaux(s) {
    const c = pg.canaux; const v = s.v;
    const aideLien = L.info('Le lien reste le même d’une mise à jour à l’autre. Il est transmissible : ce n’est pas un accès privé, même si les moteurs de recherche sont priés de ne pas l’indexer. Changer de lien désactive l’ancien, par exemple après une diffusion non souhaitée.', 'Le lien change-t-il après une mise à jour ?');
    const changer = pg.confirme === 'lien'
      ? `<div class="pg-confirm" role="alertdialog" aria-labelledby="pg-lien-t"><p id="pg-lien-t"><b>Changer de lien ?</b></p><p>L’ancien lien n’ouvrira plus le livre. À vous de transmettre le nouveau.</p><div><button class="btn btn--primaire" data-act="partage-lien-changer">Changer de lien</button><button class="btn" data-act="partage-confirme" data-v="">Annuler</button></div></div>`
      : `<p class="pg-canal__suite"><button class="lien" data-act="partage-confirme" data-v="lien">Changer de lien…</button>${aideLien}</p>`;
    const anciens = pg.anciens.length ? `<p class="pg-ancien">${ic('i-bloque')}<span>Ancien lien désactivé. <button class="lien" data-act="partage-ouvrir" data-v="ancien">Voir ce qu’il affiche</button></span></p>` : '';
    const lien = `<div class="pg-canal ${c.lien ? 'est-actif' : ''}"><span class="pg-canal__ic">${ic('i-lien')}</span>
        <div class="pg-canal__txt"><h3>Par un lien</h3><p>Pour les familles : toute personne qui a le lien, sans compte.</p></div>
        ${inter('partage-canal', 'lien', c.lien, 'Lecture par un lien')}
        ${c.lien ? `<div class="pg-canal__detail">
          <div class="pg-lien"><span class="pg-lien__url">${url(pg.jeton)}</span><button class="btn btn--petit" data-act="partage-copier">${ic('i-copier')}Copier le lien</button><button class="btn btn--petit" data-act="partage-ouvrir" data-v="lien">${ic('i-ouvrir')}Ouvrir</button></div>
          ${anciens}${changer}</div>` : pg.retireLe && !v ? `<div class="pg-canal__detail"><p class="pg-note"><span>Le même lien sera réactivé.</span></p></div>` : ''}
      </div>`;
    const classes = perso() ? '' : `<div class="pg-canal ${c.classes ? 'est-actif' : ''}"><span class="pg-canal__ic">${ic('i-eleves')}</span>
        <div class="pg-canal__txt"><h3>À mes classes</h3><p>Vos élèves le trouvent dans « Lectures », sans lien à distribuer.</p></div>
        ${inter('partage-canal', 'classes', c.classes, 'Lecture par mes classes')}
        ${c.classes ? `<div class="pg-canal__detail"><p class="pg-canal__suite"><a class="lien" href="#/lectures?vue=eleve">Voir les lectures d’Alice</a>${L.info(`Proposé à la classe ${H.classe.split(' · ')[0]} 2026-2027 (${H.effectif} élèves), votre seule classe en cours. Les élèves lisent le livre entier, sans droit de travail ni accès aux corrections. Le choix classe par classe est différé.`, 'Quelles classes peuvent lire ?')}</p></div>` : ''}
      </div>`;
    return `<section class="reglage pg-bloc" aria-labelledby="pg-canaux-t"><div class="reglage__tete"><h2 id="pg-canaux-t">Qui peut lire</h2></div>
      <div class="reglage__corps pg-canaux">${lien}${classes}</div></section>`;
  }
  function blocAuteurs(s) {
    const r = pg.reglages; const discrete = formuleDiscrete(); const livreSans = !ui.pages.auteurs.on;
    const enImage = ui.pages.auteurs.forme === 'image';
    const sans = [!r.ligne.on ? (perso() ? 'sans nom d’auteur' : 'sans ligne de classe') : '', !r.auteurs.on && !perso() && !livreSans ? 'sans page des auteurs' : ''].filter(Boolean).join(', ');
    const aide = L.info(`La version partagée montre par défaut les mêmes noms que le livre. Vous pouvez en retirer ou leur donner un texte propre au partage : le livre imprimé ne change pas. Un lien circule au-delà des personnes à qui vous l’avez donné.`, 'Quels noms sont affichés ?');
    const tete = `<div class="reglage__tete"><h2 id="pg-auteurs-t">Noms affichés</h2></div>`;
    if (!pg.nomsOuverts) return `<section class="reglage pg-bloc pg-noms" aria-labelledby="pg-auteurs-t">${tete}
      <div class="reglage__corps"><p class="pg-noms__resume"><span>${sans ? sans.charAt(0).toUpperCase() + sans.slice(1) : 'Comme dans le livre'}.</span><button class="lien" data-act="partage-noms" aria-expanded="false">Modifier</button>${aide}</p></div></section>`;
    const ligne = `<div class="pg-canal ${r.ligne.on ? 'est-actif' : ''}"><span class="pg-canal__ic">${ic('i-crayon')}</span>
        <div class="pg-canal__txt"><h3>${perso() ? 'Nom d’auteur' : 'Ligne de classe'}</h3><p>Sous le titre, sur la première page.</p></div>
        ${inter('partage-regl', 'ligne', r.ligne.on, 'Afficher la ligne sous le titre')}
        ${r.ligne.on ? `<div class="pg-canal__detail">
          <label class="champ champ--plein"><span>Texte affiché</span><input type="text" value="${esc(r.ligne.texte)}" data-saisie="partage-ligne" maxlength="90"></label>
          <p class="champ__aide">${discrete ? `<button class="lien" data-act="partage-formule" data-v="discrete">Écrire « ${discrete} »</button> · ` : ''}<button class="lien" data-act="partage-formule" data-v="imprimee">Reprendre le texte du livre</button></p></div>` : ''}
      </div>`;
    const auteurs = livreSans ? '' : `<div class="pg-canal ${r.auteurs.on ? 'est-actif' : ''}"><span class="pg-canal__ic">${ic('i-eleves')}</span>
        <div class="pg-canal__txt"><h3>Page des auteurs</h3><p>${enImage ? 'Votre page en image, après la fin.' : `${pluriel(ui.pages.auteurs.noms.length, 'prénom')}, après la fin.`}</p></div>
        ${inter('partage-regl', 'auteurs', r.auteurs.on, 'Afficher la page des auteurs')}
        ${r.auteurs.on && !enImage ? `<div class="pg-canal__detail"><label class="champ champ--plein"><span>Un prénom par ligne</span><textarea rows="5" data-saisie="partage-auteurs">${esc(r.auteurs.noms.join('\n'))}</textarea></label></div>` : ''}
      </div>`;
    return `<section class="reglage pg-bloc pg-noms" aria-labelledby="pg-auteurs-t">${tete}
      <div class="reglage__corps pg-canaux"><p class="pg-noms__resume"><span>Le livre imprimé ne change pas.</span><button class="lien" data-act="partage-noms" aria-expanded="true">Replier</button>${aide}</p>${ligne}${auteurs}</div></section>`;
  }
  function cotePartage(s) {
    const r = pg.reglages; const possible = !s.B.length;
    return `<aside class="partage__cote" aria-label="Aperçu du partage">
      <section class="pg-vue" aria-labelledby="pg-vue-t"><h2 id="pg-vue-t">Ce que voit le lecteur</h2>
        <div class="pg-vue__page" aria-hidden="true"><p class="pg-vue__t">${esc(ui.pages.titre.titre)}</p>${ui.pages.titre.sous ? `<p class="pg-vue__s">${esc(ui.pages.titre.sous)}</p>` : ''}<span class="pl-titre__orn"></span><p class="pg-vue__l" id="pg-vue-ligne" ${r.ligne.on ? '' : 'hidden'}>${esc(r.ligne.texte)}</p><span class="pg-vue__btn">Commencer la lecture</span></div>
        <button class="btn" data-act="partage-ouvrir" data-v="apercu" ${possible ? '' : 'disabled title="Possible quand le livre pourra être partagé"'}>${ic('i-oeil')}Prévisualiser</button>
        ${s.v && pg.canaux.lien ? `<p class="pg-vue__aide"><button class="lien" data-act="partage-ouvrir" data-v="lien">Lire la version partagée</button></p>` : ''}
      </section>
      <p class="pg-jamais">${ic('i-oeil')}<span>Le partage ne montre jamais ${perso() ? 'votre travail en cours' : 'le travail de la classe'}.</span>${L.info(`${perso() ? 'Ni' : 'Ni les profils des élèves, leurs remises et les corrections, ni'} la préparation, ni les scènes exclues, ni le travail en cours. Il n’anonymise rien : un prénom écrit dans le récit ou une photo restent visibles.`, 'Que ne montre jamais le partage ?')}</p>
    </aside>`;
  }
  L.pagePartage = (S, N, P) => {
    const s = situation(S, N, P);
    return `<div class="partage"><div class="partage__principal">${ficheEtat(s, P)}${blocCanaux(s)}${blocAuteurs(s)}</div>${cotePartage(s)}</div>`;
  };

  /* ——— Feuille latérale : partager, mettre à jour, refus ——————— */
  function listeBlocages(S, B) {
    const genres = Object.keys(L.GENRES).filter(k => B.some(p => p.k === k));
    return `<ul class="fl__problemes">${genres.map(k => {
      const l = B.filter(p => p.k === k);
      const detail = k === 'pretes' && l.length <= 2 ? l.map(p => { const x = S[p.ref]; return `<p class="pg-motif">${L.titreDe(S, p.ref)} ${tampon(x.etat, true)}${x.etat === 'reprendre' && x.pec && !perso() ? ` <span>rouverte : ${D.eleves[x.pec].prenom} reprend son texte.</span>` : ''}</p>`; }).join('') : '';
      return `<li><p class="fl__genre">${ic('i-bloque')}<b>${L.GENRES[k][1]}</b> <span>${l.length}</span></p><p class="fl__refs">${l.slice(0, 8).map(p => `<a class="code" href="#/scene/${p.ref}">${p.ref}</a>`).join(' ')}${l.length > 8 ? ` <span>et ${l.length - 8} autres</span>` : ''}</p>${detail}</li>`;
    }).join('')}</ul>`;
  }
  const rappelPoints = () => ['Aucun nom ni prénom réel dans le récit, sauf si vous l’avez voulu.', 'Aucune photo où une personne est reconnaissable.', 'Aucune image dont vous n’avez pas les droits.', ...(perso() ? [] : ['Les autorisations des familles couvrent cette diffusion.'])];
  function contenuFeuille() {
    const S = L.modele(); const N = L.numeroter(S); const P = L.controler(S, N); const s = situation(S, N, P);
    const tete = (titre, sous) => `<div class="fl__tete"><button class="btn btn--discret fl__fermer" data-act="partage-fermer" aria-label="Fermer">${ic('i-fermer')}</button><h2 id="flp-titre">${titre}</h2>${sous ? `<p>${sous}</p>` : ''}</div>`;
    const maj = pg.feuille === 'maj'; const v = s.v; const cree = maj || !v;
    const nomCanal = { lien: 'le lien de lecture', classes: 'la lecture par vos classes' }[pg.canal];
    if (pg.feuille === 'fait') {
      const f = pg.fait;
      return `${tete(f.maj ? 'Version partagée mise à jour' : f.cree ? 'Le livre est partagé' : 'Canal activé', f.maj ? 'Le contenu a été remplacé sous le même lien.' : `Par ${f.nom}.`)}
      <div class="fl__corps">
        <div class="fl__fait">${ic('i-coche')}<div><p><b>Version du ${v.date.long}</b></p><p>${v.choix ? pluriel(v.total, 'passage') : pluriel(v.chapitres.length, 'chapitre')} · ${[pg.canaux.lien ? 'lien de lecture' : '', pg.canaux.classes ? 'lecture par vos classes' : ''].filter(Boolean).join(' et ') || 'aucun canal activé'}</p></div></div>
        ${pg.canaux.lien ? `<div class="pg-lien"><span class="pg-lien__url">${url(pg.jeton)}</span><button class="btn btn--petit" data-act="partage-copier">${ic('i-copier')}Copier le lien</button></div>` : ''}
        <ul class="liste-simple fl__liste"><li>Votre travail reste modifiable : les lecteurs ne verront vos changements qu’après une mise à jour.</li>${pg.canaux.lien ? '<li>Le lien reste le même d’une mise à jour à l’autre.</li>' : '<li>Aucun lien de lecture n’existe pour ce livre.</li>'}<li>Vous pouvez retirer le partage à tout moment.</li></ul>
      </div>
      <div class="fl__pied">${pg.canaux.lien ? `<button class="btn btn--grand" data-act="partage-ouvrir" data-v="lien">${ic('i-ouvrir')}Ouvrir le lecteur</button>` : ''}<button class="btn btn--grand" data-act="partage-fermer">Fermer</button></div>`;
    }
    if (cree && s.B.length) {
      return `${tete(maj ? 'La mise à jour est refusée' : 'Ce livre ne peut pas encore être partagé', 'Voici ce qui reste, étape par étape.')}
      <div class="fl__corps">
        ${maj ? `<div class="fl__fait pg-inchange">${ic('i-livre')}<div><p><b>Rien ne change pour les lecteurs.</b></p><p>Ils continuent de lire la version du ${v.date.long}.</p></div></div>` : ''}
        <ul class="fl__problemes fl__problemes--etapes">${raisonsContenu(P).map(([t, quoi]) => `<li><p class="fl__genre">${ic('i-fleche')}<b><a class="lien" href="#/livre" data-act="partage-vers-temps" data-v="${t}">${L.ETAPES[t]}</a></b></p><p class="fl__refs">${quoi}</p></li>`).join('')}</ul>
      </div>
      <div class="fl__pied"><button class="btn btn--grand" data-act="partage-fermer">Fermer</button></div>`;
    }
    // Partage ou mise à jour possible : conditions, avertissement rappelé, résumé, rappel à confirmer
    const cible = cree ? { ligne: pg.reglages.ligne.on ? pg.reglages.ligne.texte.trim() : '', auteurs: pg.reglages.auteurs.on ? pg.reglages.auteurs.noms : null } : v;
    const sorties = cree ? P.filter(p => p.k === 'sortie').map(p => p.ref) : v.sorties;
    const date = cree ? maintenant() : v.date;
    const titre = maj ? 'Mettre à jour le partage' : pg.canal === 'lien' ? 'Partager par un lien' : 'Partager à mes classes';
    const sous = maj ? 'Même lien : les lecteurs n’ont rien à faire.' : cree ? `Une copie du livre, datée du ${date.court}.` : `La version du ${v.date.court} devient lisible par ce canal.`;
    const verifs = '';
    const avert = sorties.map(r => `<div class="pg-sortie">${ic('i-alerte')}<div><p><b>Sa seule suite est une énigme</b> · ${L.titreDe(S, r)}</p><p>Le lecteur qui ne trouve pas le numéro reste bloqué. Vous pouvez partager quand même.</p></div></div>`).join('')
      + (cree ? P.filter(p => p.k === 'jeu').map(p => `<div class="pg-sortie">${ic('i-info')}<div><p><b>Actions de jeu sans feuille d’aventure</b></p><p>En ligne, le lecteur n’aura rien à remplir. Ne bloque pas le partage.</p></div></div>`).join('') : '');
    const lecteurs = pg.canal === 'classes' && !maj ? 'Vos élèves, depuis « Lectures ». Ils liront le livre entier, y compris les chapitres qu’ils n’avaient pas vus.' : pg.canal === 'lien' && !maj ? 'Toute personne qui a le lien, sans compte.' : ([pg.canaux.lien ? 'les personnes qui ont le lien' : '', pg.canaux.classes ? 'les élèves de vos classes' : ''].filter(Boolean).join(' et ').replace(/^l/, 'L') || 'Aucun canal n’est activé pour l’instant') + '.';
    const montre = ['le titre et le sous-titre', cible.ligne ? `la ligne « ${esc(cible.ligne)} »` : '', cible.auteurs ? `la page des auteurs (${pluriel(cible.auteurs.length, 'prénom')})` : ''].filter(Boolean).join(', ');
    const sans = [!cible.ligne ? (perso() ? 'pas de nom d’auteur' : 'pas de ligne de classe') : '', !cible.auteurs && !perso() ? 'pas de page des auteurs' : ''].filter(Boolean).join(', ');
    return `${tete(titre, sous)}
      <div class="fl__corps">
        ${verifs}${avert}
        <dl class="pg-resume">
          <dt>Lecteurs</dt><dd>${lecteurs}</dd>
          <dt>Noms</dt><dd>${montre.charAt(0).toUpperCase() + montre.slice(1)}${sans ? ` ; ${sans}` : ''}. ${cree ? `<button class="lien" data-act="partage-fermer">Modifier</button>` : ''}</dd>
        </dl>
        <section class="carnet-fiche carnet-fiche--attente pg-rappel" aria-labelledby="pg-rappel-t"><header>${ic('i-main')}<h2 id="pg-rappel-t">À relire avant de ${maj ? 'mettre à jour' : 'partager'}</h2></header><div class="carnet-fiche__corps">
          <ul class="liste-simple">${rappelPoints().map(p => `<li>${p}</li>`).join('')}</ul>
          <label class="pg-coche"><input type="checkbox" class="case" data-act="partage-coche" ${pg.coche ? 'checked' : ''}><span>J’ai relu le livre sur ces points.</span></label>
          <p class="fl__note">L’application ne détecte ni les noms ni les visages.</p>
        </div></section>
      </div>
      <div class="fl__pied"><button class="btn btn--primaire btn--grand" id="pg-confirmer" data-act="partage-confirmer" ${pg.coche ? '' : 'disabled'}>${ic(maj ? 'i-recommencer' : 'i-partage')}${maj ? 'Mettre à jour' : cree ? 'Partager cette version' : 'Activer ce canal'}</button>
        <button class="btn btn--grand" data-act="partage-ouvrir" data-v="apercu">${ic('i-oeil')}Prévisualiser d’abord</button>
        ${pg.coche ? '' : '<p class="fl__note pg-attente" id="pg-attente">Cochez le rappel pour continuer.</p>'}</div>`;
  }
  function majFeuille(focus) {
    let f = $('#feuille-partage');
    if (!f) {
      document.body.insertAdjacentHTML('beforeend', '<div class="voile voile--fl" id="voile-partage" data-act="partage-fermer" hidden></div><aside class="panneau fl" id="feuille-partage" role="dialog" aria-modal="true" aria-labelledby="flp-titre" hidden></aside>');
      f = $('#feuille-partage');
    }
    if (!pg.feuille) return;
    f.innerHTML = contenuFeuille(); f.hidden = false; $('#voile-partage').hidden = false;
    requestAnimationFrame(() => { f.classList.add('est-ouvert'); $('#voile-partage').classList.add('est-ouvert'); });
    if (focus) setTimeout(() => $('.fl__fermer', f)?.focus(), 60);
  }
  function ouvrirFeuille(type, canal, el) { pg.feuille = type; pg.canal = canal || null; pg.coche = false; pg.retourFocus = el || document.activeElement; majFeuille(true); }
  function fermerFeuille(retour = true) {
    const f = $('#feuille-partage'); if (!f || !pg.feuille) { pg.feuille = null; return; }
    pg.feuille = null;
    f.classList.remove('est-ouvert'); $('#voile-partage').classList.remove('est-ouvert');
    setTimeout(() => { if (!pg.feuille) { f.hidden = true; $('#voile-partage').hidden = true; } }, 220);
    if (retour && pg.retourFocus && document.body.contains(pg.retourFocus)) pg.retourFocus.focus();
  }

  /* ——— Lecteur en ligne ————————————————————————————————————— */
  // La version que ce lecteur peut ouvrir : null affiche la page neutre
  function versionLue() {
    if (st.acces === 'apercu') return instantane(pg.reglages, null);
    if (!pg.version || pg.ancien) return null;
    return (st.acces === 'classe' ? pg.canaux.classes : pg.canaux.lien) ? pg.version : null;
  }
  const paras = (t, actions = []) => A.jeu.paras(t, actions);
  const extrait = p => { const m = (p.texte[0] || '').split(' '); return m.slice(0, 6).join(' ') + (m.length > 6 ? '…' : ''); };
  const image = p => p.image ? `<figure class="lec-image" style="--l:${p.image.largeur}%"><img src="${p.image.src}" alt=""></figure>` : '';
  const partie = (V, pi) => V.titres ? `<div class="lec-partie"><p>${L.ORDINAUX[pi]} partie</p><p class="lec-partie__t">${esc(H.parties[pi].titre)}</p></div>` : '';
  function colophon(V) {
    return `${V.auteurs ? `<section class="lec-auteurs" aria-labelledby="lec-aut-t"><h2 id="lec-aut-t">Ce livre a été écrit par</h2><p>${V.auteurs.map(esc).join(' · ')}</p></section>` : ''}${V.finPage ? `<p class="lec-finpage">${esc(V.finPage)}</p>` : ''}`;
  }
  function barreLecteur(V) {
    const retour = st.acces === 'classe' ? `<a class="btn btn--discret lec-barre__retour" href="#/lectures">${ic('i-fleche-g')}<span class="lec-lib">Retour aux lectures</span></a>` : '';
    const n = lec.chemin.length;
    const outils = V.choix
      ? `${V.mode ? `<a class="btn btn--discret" href="#/lire/comment" ${st.arg === 'comment' ? 'aria-current="page"' : ''}>${ic('i-aide')}<span class="lec-lib">${V.regles.length ? 'Règles' : 'Comment lire'}</span></a>` : ''}${A.jeu.lecteur.bouton(V)}${n ? `<button class="btn btn--discret" data-act="lire-panneau" aria-expanded="${lec.panneau}" aria-controls="lec-parcours">${ic('i-choix')}<span class="lec-lib">Parcours</span><span class="compte">${n}</span></button>` : ''}`
      : `<button class="btn btn--discret" data-act="lire-panneau" aria-expanded="${lec.panneau}" aria-controls="lec-parcours">${ic('i-liste')}<span class="lec-lib">Sommaire</span></button>`;
    let panneau = '';
    if (lec.panneau && V.choix) {
      panneau = `<div class="lec-parcours" id="lec-parcours" role="region" aria-label="Parcours de lecture"><ol>${lec.chemin.map((x, i) => {
        const p = V.parNum[x]; const der = i === n - 1; const lib = `<span class="lec-parcours__n">${x}</span><span class="lec-parcours__x">${esc(extrait(p))}</span>`;
        return `<li ${der ? 'aria-current="step"' : ''}>${der ? `<span class="lec-parcours__e">${lib}</span>` : `<button class="lec-parcours__e" data-act="lire-etape" data-i="${i}">${lib}</button>`}</li>`;
      }).join('')}</ol><p class="lec-parcours__pied"><span>Touche un passage pour y revenir.</span><button class="lien" data-act="lire-recommencer">Recommencer au début</button></p></div>`;
    } else if (lec.panneau) {
      panneau = `<div class="lec-parcours" id="lec-parcours" role="region" aria-label="Sommaire"><ol>${V.chapitres.map((c, i) => `${c.premier && V.titres ? `<li class="lec-parcours__partie">${esc(H.parties[c.partie].titre)}</li>` : ''}<li ${lec.chap === i && st.arg ? 'aria-current="step"' : ''}><a class="lec-parcours__e" href="#/lire/c${i}"><span class="lec-parcours__n">${i + 1}</span><span class="lec-parcours__x">${V.titresChap ? esc(c.titre) : `Suite ${i + 1} sur ${V.chapitres.length}`}</span></a></li>`).join('')}</ol></div>`;
    }
    return `<header class="lec-barre">${retour}<a class="lec-barre__titre" href="#/lire">${esc(V.titre)}</a><div class="lec-barre__outils">${outils}${panneau}</div></header>`;
  }
  function cadre(V, corps) {
    const apercu = st.acces === 'apercu' ? `<p class="lec-apercu">${ic('i-oeil')}<span><b>Prévisualisation.</b> Le livre actuel, tel que le lecteur le verra. Rien n’est partagé par cette page.</span><a class="btn btn--petit" href="#/livre/partage">${ic('i-fleche-g')}Retour au partage</a></p>` : '';
    // La feuille d'aventure accompagne toute la lecture : à côté du texte sur grand écran, en feuille basse sinon
    const ouverte = A.jeu.lecteur.prendre(V);
    return `<div class="lec ${V.feuille ? 'lec--jeu' : ''} ${ouverte ? 'lec--feuille' : ''}">${apercu}${barreLecteur(V)}<div class="lec-zone"><div class="lec-corps">${corps}</div>${A.jeu.lecteur.feuille(V)}</div>
      <footer class="lec-pied"><span>You Are a Hero</span>${st.acces === 'lien' ? '<span>Lecture sans compte</span>' : ''}</footer></div>`;
  }
  function pageTitre(V) {
    const reprise = V.choix ? (lec.chemin.length > 1 ? lec.chemin[lec.chemin.length - 1] : null) : (lec.chap > 0 ? lec.chap : null);
    const debut = V.choix ? `#/lire/${V.depart}` : '#/lire/c0';
    const actions = reprise != null
      ? `<a class="btn btn--primaire btn--grand" href="#/lire/${V.choix ? reprise : 'c' + reprise}">${ic('i-fleche')}${V.choix ? `Continuer au passage ${reprise}` : `Continuer${V.titresChap ? ` : ${esc(V.chapitres[reprise].titre)}` : ' la lecture'}`}</a>
         <button class="btn btn--discret" data-act="lire-recommencer" data-v="debut">${ic('i-recommencer')}Recommencer au début</button>
         <p class="lec-titre__note">${st.acces === 'classe' ? `Ta lecture${V.feuille ? ' et ta feuille d’aventure sont retenues' : ' est retenue'} avec ton prénom : tu ${V.feuille ? 'les' : 'la'} retrouves sur n’importe quel ordinateur de la classe.` : `Cet appareil a retenu où la lecture s’est arrêtée${V.feuille ? ', et ta feuille d’aventure' : ''}. Rien n’est enregistré ailleurs.`}${V.feuille ? ' Recommencer remet la feuille à ses valeurs de départ.' : ''}</p>`
      : `<a class="btn btn--primaire btn--grand" href="${debut}" data-act="lire-debut">${ic('i-fleche')}Commencer la lecture</a>`;
    return `<article class="lec-titre"><h1>${esc(V.titre)}</h1>${V.sous ? `<p class="lec-titre__s">${esc(V.sous)}</p>` : ''}<span class="pl-titre__orn" aria-hidden="true"></span>${V.ligne ? `<p class="lec-titre__l">${esc(V.ligne)}</p>` : ''}
      <div class="lec-titre__actions">${actions}${V.mode ? `<a class="lien" href="#/lire/comment">Comment lire ce livre</a>` : ''}</div></article>`;
  }
  // Mode d'emploi propre à l'écran, fourni par l'application : la page imprimée parle de « se rendre au numéro »
  function pageComment(V) {
    const encours = lec.chemin.length ? lec.chemin[lec.chemin.length - 1] : null;
    return `<article class="lec-article lec-comment"><h1>Comment lire ce livre</h1><div class="lec-texte">
        <p>Ce livre ne se lit pas dans l’ordre. À la fin de chaque passage, choisis ce que tu veux faire : touche ton choix, ou le numéro écrit dans la phrase, et l’histoire continue.</p>
        <p>Chaque passage porte un numéro, écrit en petit au-dessus du texte. C’est le même que dans le livre imprimé.</p>
        <p>Parfois, aucun choix n’est écrit : une énigme te donne le numéro de la suite. Écris-le dans la case pour continuer. Si ce n’est pas le bon, tu peux réessayer.</p>
        <p>Tu peux toujours revenir au passage précédent, et retrouver ton parcours en haut de l’écran. Bonne aventure !</p>${V.feuille ? '<p>Ce livre se joue avec une feuille d’aventure. Elle reste à portée de main pendant toute la lecture : tu la remplis toi-même, quand un encadré te le demande.</p>' : ''}</div>${A.jeu.lecteur.regles(V)}
      <div class="lec-fin-actions"><a class="btn btn--primaire btn--grand" href="#/lire/${encours || V.depart}" ${encours ? '' : 'data-act="lire-debut"'}>${ic('i-fleche')}${encours ? `Revenir au passage ${encours}` : 'Commencer la lecture'}</a></div></article>`;
  }
  function pagePassage(V, p) {
    const prec = lec.chemin.length > 1; const e = lec.erreur;
    const choixH = p.choix.length ? `<ul class="lec-choix" aria-label="Tes choix">${p.choix.map(c => `<li><button data-act="lire-aller" data-n="${c.n}"><span class="lec-choix__lib">${esc(c.texte)}</span>${ic('i-fleche')}</button></li>`).join('')}</ul>` : '';
    const phrase = p.phrases.map(ph => `<p class="lec-phrase">${ph.map(seg => typeof seg === 'string' ? esc(seg) : `<button class="renvoi-num" data-act="lire-aller" data-n="${seg}" aria-label="Aller au passage ${seg}">${seg}</button>`).join('')}</p>`).join('');
    const enigme = p.cles.length ? `<form class="lec-enigme ${e ? 'est-erreur' : ''}" novalidate>
        <label for="lec-num">${ic('i-cle')}<span>${p.choix.length ? 'Ce passage cache aussi une énigme. Tu as trouvé un numéro ?' : 'Aucun choix n’est écrit ici : l’énigme du passage donne le numéro de la suite.'}</span></label>
        <div class="lec-enigme__ligne"><input id="lec-num" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" placeholder="n°" value="${e?.val ? esc(e.val) : ''}" ${e ? 'aria-invalid="true" aria-describedby="lec-err"' : ''}><button class="btn btn--primaire btn--grand" type="submit">Y aller${ic('i-fleche')}</button></div>
        ${e ? `<p class="lec-enigme__err" id="lec-err" role="alert">${ic('i-alerte')}<span>${e.val ? `<b>${esc(e.val)} n’est pas le bon numéro.</b> Relis le passage et réessaie : tu peux essayer autant de fois que tu veux.` : 'Écris le numéro que tu as trouvé.'}</span></p>` : ''}</form>` : '';
    const retour = prec ? `<button class="lien lec-retour" data-act="lire-retour">${ic('i-fleche-g')}Revenir au passage précédent</button>` : '';
    const fin = p.fin ? `<p class="passage__fin lec-fin">${esc(V.marque)}</p>` : '';
    const apres = p.fin ? `<div class="lec-fin-actions"><button class="btn btn--grand" data-act="lire-recommencer" data-v="relire">${ic('i-recommencer')}Recommencer au début</button>${retour}</div>${colophon(V)}` : retour ? `<p class="lec-retour-bas">${retour}</p>` : '';
    return `<article class="lec-article" aria-label="Passage ${p.n}">${p.ouverture ? partie(V, p.partie) : ''}<p class="lec-num"><span class="vh">Passage </span>${p.n}</p>
      ${image(p)}<div class="lec-texte">${paras(p.texte, p.actions)}</div>${fin}${choixH}${phrase}${enigme}${apres}</article>`;
  }
  // Récit classique : un chapitre par écran, scènes séparées comme dans le livre
  function pageChapitreLu(V, i) {
    const c = V.chapitres[i]; const suiv = V.chapitres[i + 1];
    const scenes = c.refs.map(r => `<section class="lec-texte">${image(V.P[r])}${paras(V.P[r].texte)}</section>`).join('<p class="passage__sep lec-sep" aria-hidden="true"><span></span><span></span><span></span></p>');
    const nav = `<nav class="lec-suite" aria-label="Suite de la lecture">${suiv ? `<a class="btn btn--primaire btn--grand" href="#/lire/c${i + 1}">${V.titresChap ? esc(suiv.titre) : 'Suite'}${ic('i-fleche')}</a>` : `<button class="btn btn--grand" data-act="lire-recommencer" data-v="relire">${ic('i-recommencer')}Relire depuis le début</button>`}${i > 0 ? `<a class="lien lec-retour" href="#/lire/c${i - 1}">${ic('i-fleche-g')}${V.titresChap ? 'Chapitre précédent' : 'Revenir en arrière'}</a>` : ''}</nav>`;
    return `<article class="lec-article">${c.premier ? partie(V, c.partie) : ''}${V.titresChap ? `<h1 class="lec-chapitre">${esc(c.titre)}</h1>` : `<p class="lec-num"><span class="vh">Partie de lecture </span>${i + 1}</p>`}
      ${scenes}${nav}${suiv ? '' : colophon(V)}</article>`;
  }
  function pageNeutre() {
    const classe = st.acces === 'classe';
    return `<div class="lec lec--neutre"><div class="lec-neutre"><span class="pl-titre__orn" aria-hidden="true"></span><h1>${classe ? 'Ce livre n’est plus proposé à la lecture' : 'Ce livre n’est plus partagé'}</h1>
        <p>${classe ? 'Mme Laurent ne le propose plus pour l’instant.' : 'La personne qui l’avait partagé a retiré cet accès. Pour le lire, il faut lui demander un nouveau lien.'}</p>
        ${classe ? `<a class="btn" href="#/lectures">${ic('i-fleche-g')}Retour aux lectures</a>` : ''}</div>
      <footer class="lec-pied"><span>You Are a Hero</span></footer></div>`;
  }
  function pageLire() {
    const V = versionLue(); if (!V) return pageNeutre();
    const arg = st.arg;
    if (!arg) return cadre(V, pageTitre(V));
    if (arg === 'comment' && V.mode) return cadre(V, pageComment(V));
    if (!V.choix) { const i = Math.max(0, Math.min(V.chapitres.length - 1, parseInt(String(arg).slice(1), 10) || 0)); lec.chap = i; return cadre(V, pageChapitreLu(V, i)); }
    const p = /^S\d+$/.test(arg) ? V.P[arg] : V.parNum[+arg];
    if (!p) return cadre(V, `<article class="lec-article"><div class="lec-texte"><p>Ce passage n’existe pas dans ce livre.</p></div><div class="lec-fin-actions"><a class="btn" href="#/lire">Revenir à la première page</a></div></article>`);
    const k = lec.chemin.lastIndexOf(p.n); lec.chemin = k === -1 ? [...lec.chemin, p.n] : lec.chemin.slice(0, k + 1);
    return cadre(V, pagePassage(V, p));
  }

  /* ——— Espace élève : Lectures ——————————————————————————————— */
  function pageLectures() {
    if (!eleve()) return `<div class="page"><p class="aucun">« Lectures » est une entrée de l’espace élève. <a href="#/lectures?vue=eleve">Voir celle d’Alice</a> · <a href="#/livre/partage">Retour au partage</a></p></div>`;
    const V = pg.version && pg.canaux.classes ? pg.version : null;
    const objet = (t, s) => `<div class="lects-objet" aria-hidden="true"><span class="lects-objet__t">${esc(t)}</span><span class="pl-titre__orn"></span>${s ? `<span class="lects-objet__s">${esc(s)}</span>` : ''}</div>`;
    const livres = [];
    if (V) {
      const reprise = V.choix ? (lec.chemin.length > 1 ? lec.chemin[lec.chemin.length - 1] : null) : (lec.chap > 0 ? lec.chap : null);
      livres.push(`<li class="lects-livre lects-livre--une">${objet(V.titre, V.sous)}<div class="lects-livre__txt">
        <p class="repere repere--depart">${ic('i-crayon')}Écrit par ta classe</p><h2>${esc(V.titre)}</h2>
        <p class="lects-livre__meta">${V.choix ? `Livre à choix · ${pluriel(V.total, 'passage')}` : `Récit · ${pluriel(V.chapitres.length, 'chapitre')}`}${V.ligne ? ` · ${esc(V.ligne)}` : ''}</p>
        ${reprise != null ? `<p class="lects-livre__reprise">${ic('i-horloge')}${V.choix ? `Tu en es au passage ${reprise}.` : `Tu en es à « ${esc(V.chapitres[reprise].titre)} ».`}</p>` : ''}
        <div class="lects-livre__actions"><button class="btn btn--primaire btn--grand" data-act="lectures-lire" data-v="${reprise != null ? (V.choix ? reprise : 'c' + reprise) : ''}">${ic('i-livre')}${reprise != null ? 'Reprendre la lecture' : 'Lire'}</button>${reprise != null ? `<button class="btn btn--discret" data-act="lectures-lire" data-v="debut">${ic('i-recommencer')}Recommencer au début</button>` : ''}</div></div></li>`);
    }
    if (!lec.vide) AUTRES_LIVRES.forEach(l => livres.push(`<li class="lects-livre">${objet(l.titre, l.sous)}<div class="lects-livre__txt"><h2>${esc(l.titre)}</h2><p class="lects-livre__meta">${l.meta}${l.ligne ? ` · ${esc(l.ligne)}` : ''}</p>
        <div class="lects-livre__actions"><button class="btn btn--grand" data-act="toast" data-msg="« ${esc(l.titre)} » s’ouvre dans le même lecteur. Seul « ${esc(H.titre)} » est jouable dans la maquette.">${ic('i-livre')}Lire</button></div></div></li>`));
    return `<div class="page page--eleve page--lectures">
      <header class="lects-tete"><h1>Lectures</h1><p>Des livres terminés que Mme Laurent te propose. Ici, tu lis pour le plaisir : rien à écrire, rien à corriger.</p></header>
      ${livres.length ? `<ul class="lects">${livres.join('')}</ul>` : `<div class="lects-vide"><div class="lects-objet lects-objet--vide" aria-hidden="true"></div><div><h2>Aucun livre à lire pour l’instant</h2><p>Quand Mme Laurent proposera un livre terminé, tu le trouveras ici.</p><a class="btn" href="#/plan">${ic('i-fleche-g')}Retour à Mon travail</a></div></div>`}
      <p class="essai-note lects-note"><span>Pour vérifier le chapitre que tu es en train d’écrire, utilise « Tester la lecture » dans <a href="#/plan">Mon travail</a>.</span></p>
    </div>`;
  }

  /* ——— Actions ———————————————————————————————————————————————— */
  const garder = () => { ui.scroll = window.scrollY; };
  const aller = h => { if (location.hash !== h) location.hash = h; else rendre(); };
  const refaire = () => { garder(); rendre(); };
  Object.assign(A.actions, {
    'partage-demander': el => ouvrirFeuille('partager', el.dataset.v || 'lien', el),
    'partage-maj': el => ouvrirFeuille('maj', null, el),
    'partage-fermer': () => fermerFeuille(),
    'partage-controles': () => { fermerFeuille(false); aller('#/livre'); },
    // Noms affichés : repliés par défaut, ouverts à la demande
    'partage-noms': () => { pg.nomsOuverts = !pg.nomsOuverts; refaire(); },
    // Une raison de refus mène à l'étape où elle se traite
    'partage-vers-temps': el => { fermerFeuille(false); ui.temps = el.dataset.v; ui.aide = null; },
    'partage-confirmer': () => {
      const maj = pg.feuille === 'maj'; const cree = maj || !pg.version;
      const nom = { lien: 'le lien de lecture', classes: 'la lecture par vos classes' }[pg.canal];
      if (cree) pg.version = instantane(pg.reglages, maintenant());
      if (pg.canal) pg.canaux[pg.canal] = true;
      pg.retireLe = null; pg.ancien = false; pg.fait = { maj, cree, nom }; pg.feuille = 'fait';
      refaire(); majFeuille(true);
    },
    'partage-confirme': el => { pg.confirme = el.dataset.v || null; refaire(); if (pg.confirme) $('.pg-confirm .btn')?.focus(); },
    'partage-retirer': () => { pg.retireLe = maintenant(); pg.version = null; pg.canaux = { lien: false, classes: false }; pg.confirme = null; refaire(); toast('Partage retiré. Le lien affiche « Ce livre n’est plus partagé » ; un nouveau partage le réactivera.'); },
    'partage-lien-changer': () => { pg.anciens.push(pg.jeton); pg.jeton = (pg.jeton + 1) % JETONS.length; pg.confirme = null; refaire(); toast('Nouveau lien créé. L’ancien n’ouvre plus le livre ; la version partagée est inchangée.'); },
    'partage-copier': () => toast('Lien copié (simulation).'),
    'partage-ouvrir': el => {
      const v = el.dataset.v; fermerFeuille(false);
      pg.ancien = v === 'ancien'; st.acces = v === 'ancien' ? 'lien' : v;
      Object.assign(lec, { chemin: [], chap: null, erreur: null, panneau: false });
      aller('#/lire');
    },
    'partage-formule': el => { pg.reglages.ligne.texte = el.dataset.v === 'discrete' ? formuleDiscrete() : ligneImprimee(); refaire(); },
    'lire-debut': (el, ev) => { ev.preventDefault(); const V = versionLue(); A.jeu.lecteur.recommencer(); lec.chemin = V.choix ? [V.depart] : []; aller(V.choix ? `#/lire/${V.depart}` : '#/lire/c0'); },
    'lire-aller': el => { const n = +el.dataset.n; lec.chemin.push(n); lec.erreur = null; aller(`#/lire/${n}`); },
    'lire-retour': () => { if (lec.chemin.length < 2) return; lec.chemin.pop(); aller(`#/lire/${lec.chemin[lec.chemin.length - 1]}`); },
    'lire-etape': el => { lec.chemin = lec.chemin.slice(0, +el.dataset.i + 1); lec.panneau = false; aller(`#/lire/${lec.chemin[lec.chemin.length - 1]}`); },
    'lire-recommencer': () => { A.jeu.lecteur.recommencer(); Object.assign(lec, { chemin: [], chap: null, erreur: null, panneau: false }); aller('#/lire'); },
    'lire-panneau': () => { lec.panneau = !lec.panneau; rendre(); $('[data-act="lire-panneau"]')?.focus(); },
    'lectures-lire': el => {
      const v = el.dataset.v; st.acces = 'classe'; pg.ancien = false;
      if (v === 'debut' || !v) { A.jeu.lecteur.recommencer(); Object.assign(lec, { chemin: [], chap: null }); }
      aller(v && v !== 'debut' ? `#/lire/${v}` : '#/lire');
    }
  });
  Object.assign(A.changes, {
    // Activer un canal passe toujours par le rappel à confirmer (F12-AC17) ; le désactiver est immédiat
    'partage-canal': el => {
      const c = el.dataset.v;
      if (el.checked) { el.checked = false; ouvrirFeuille('partager', c, el); return; }
      pg.canaux[c] = false; refaire();
      toast(c === 'lien' ? 'Lien de lecture désactivé : il affiche « Ce livre n’est plus partagé ».' : 'Lecture par vos classes désactivée : le livre quitte les lectures des élèves.');
    },
    'partage-regl': el => { pg.reglages[el.dataset.v].on = el.checked; refaire(); $(`[data-act="partage-regl"][data-v="${el.dataset.v}"]`)?.focus(); },
    'partage-coche': el => { pg.coche = el.checked; const b = $('#pg-confirmer'); if (b) b.disabled = !pg.coche; const n = $('#pg-attente'); if (n) n.hidden = pg.coche; }
  });
  A.saisies = Object.assign(A.saisies || {}, {
    'partage-ligne': el => { pg.reglages.ligne.texte = el.value; const l = $('#pg-vue-ligne'); if (l) l.textContent = el.value; },
    'partage-auteurs': el => { pg.reglages.auteurs.noms = el.value.split('\n').map(s => s.trim()).filter(Boolean); }
  });
  document.addEventListener('change', ev => { if (ev.target.matches?.('[data-saisie^="partage-"]')) refaire(); });
  document.addEventListener('submit', ev => {
    if (!ev.target.matches?.('.lec-enigme')) return;
    ev.preventDefault();
    const V = versionLue(); const p = V.parNum[lec.chemin[lec.chemin.length - 1]];
    const brut = $('#lec-num').value.trim(); const val = parseInt(brut, 10);
    // Seuls les numéros des liaisons cachées de ce passage sont acceptés (F12-AC13, F12-AC14)
    if (brut && p.cles.includes(val)) { lec.erreur = null; lec.chemin.push(val); aller(`#/lire/${val}`); return; }
    lec.erreur = { val: brut }; rendre();
    const i = $('#lec-num'); i.focus(); i.select();
  });
  document.addEventListener('click', ev => { if (lec.panneau && !ev.target.closest('.lec-barre__outils')) { lec.panneau = false; rendre(); } });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (pg.feuille) fermerFeuille();
    else if (lec.panneau) { lec.panneau = false; rendre(); $('[data-act="lire-panneau"]')?.focus(); }
  });

  /* ——— Enregistrement, barre de présentation et drapeaux d'URL ——— */
  Object.assign(A.pages, { lire: pageLire, lectures: pageLectures });
  Object.assign(A.titres, {
    lire: () => { const V = versionLue(); return V ? V.titre : 'Livre non partagé'; },   // la page neutre ne révèle pas le titre
    lectures: () => 'Lectures'
  });
  const reinit0 = A.reinit;
  A.reinit = nom => {
    if (nom === 'partage' && st.partage !== 'non') st.moment = 'pret';
    if (nom === 'moment' && st.moment !== 'pret') st.partage = 'non';
    reinit0?.(nom);
    if (nom === 'partage') L.reinitLivre();
    if (['partage', 'moment', 'mode', 'recit'].includes(nom)) { fermerFeuille(false); init(); }
    if (nom === 'vue') {
      if (!eleve() && st.page === 'lectures') { st.page = 'livre'; st.arg = 'partage'; }
      if (st.page === 'lire' && st.acces !== 'apercu') st.acces = eleve() ? 'classe' : 'lien';
    }
    if (nom === 'page') { fermerFeuille(false); pg.confirme = null; lec.erreur = null; lec.panneau = false; if (st.page !== 'lire') pg.ancien = false; }
  };
  const apres0 = A.apres;
  A.apres = page => {
    apres0?.(page);
    const barre = $('#maquette-partage'); if (barre) barre.hidden = !['livre', 'lire', 'lectures'].includes(page);
    const r = $(`input[name="partage"][value="${st.partage}"]`); if (r) r.checked = true;
    if (pg.feuille) majFeuille(false);
    // Sur téléphone, les quatre onglets du livre défilent : l'onglet courant reste visible
    const nav = $('.livre-nav'); const actif = nav && $('[aria-selected="true"]', nav); if (actif) nav.scrollLeft = actif.offsetLeft + actif.offsetWidth - nav.clientWidth + 8;
  };
  document.addEventListener('DOMContentLoaded', () => {
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    if (st.partage !== 'non') { st.moment = 'pret'; L.reinitLivre(); }
    init();
    if (q.get('ligne')) { pg.reglages.ligne.on = true; pg.reglages.ligne.texte = q.get('ligne') === 'discrete' ? formuleDiscrete() : ligneImprimee(); }
    if (q.get('auteurs')) pg.reglages.auteurs.on = true;
    if (q.get('noms')) pg.nomsOuverts = true;
    if (q.get('canaux') && pg.version) pg.canaux = { lien: q.get('canaux').includes('lien'), classes: q.get('canaux').includes('classes') };
    if (q.get('nouveaulien') && pg.version) { pg.anciens.push(pg.jeton); pg.jeton = 1; }
    if (q.get('ancien')) pg.ancien = true;
    if (q.get('confirme')) pg.confirme = q.get('confirme');
    if (q.get('demande')) { pg.feuille = q.get('demande') === 'maj' ? 'maj' : 'partager'; pg.canal = pg.feuille === 'maj' ? null : q.get('demande'); pg.coche = !!q.get('coche'); }
    if (q.get('lectures') === 'vide') lec.vide = true;
    if (q.get('parcours')) { const V = versionLue(); if (V?.choix) lec.chemin = q.get('parcours').split('.').map(r => V.P[r]?.n).filter(Boolean); }
    if (q.get('chapitre')) lec.chap = +q.get('chapitre');
    if (q.get('essai')) lec.erreur = { val: q.get('essai') };
    if (q.get('panneau')) lec.panneau = true;
    rendre();
  });
})();
