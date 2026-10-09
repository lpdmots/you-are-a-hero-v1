/* Maquette « Parties et chapitres » — interactions simulées, sans persistance. */
(function () {
  window.App = window.App || { pages: {}, actions: {}, changes: {}, titres: {} };
  const D = window.DATA;
  const H = D.histoire;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let MOI = 'alice';

  const st = {
    vue: 'enseignant', moi: 'alice', mode: 'classe', recit: 'choix', img: 'choisies',
    sauv: 'ok', horaire: 'ouvert', concurrent: 'non', arg: null,
    page: 'plan', chap: null, onglet: 'scenes',
    selection: new Set(), filtre: 'toutes', fiche: null, surligne: null, zoom: 'lisible', recherche: '', noeud: null,
    vise: null, planaide: null, pmenu: null, ppanneau: null, pdialogue: null, pcorbeille: null, pneuve: null, phors: null, pcherche: ''
  };
  /* Organisation du récit reprise après la critique du 5 octobre 2026 (F03.1, décisions du 6 octobre) : la carte ouvre le chapitre,
     un menu à trois points porte ses commandes, « À compléter » informe sans filtrer, la corbeille reçoit ce qui est supprimé.
     Adresses à drapeaux, pour les captures :
       #/plan?planaide=1 (écran d'aide) · ?planaide=0 (sans l'aide) · ?pmenu=chap:lisiere · ?pmenu=scene:S017 · ?pmenu=qui:S018
       ?ppanneau=reglages:lisiere · ?ppanneau=attribuer:lisiere · ?ppanneau=corbeille · ?pdialogue=supprimer:sanctuaire
       ?pcorbeille=sanctuaire (déjà supprimé) · ?pneuve=lisiere (scène tout juste ajoutée) · ?phors=sommet (chapitre exclu du livre)
     Le préfixe « p » évite les drapeaux du même nom des autres écrans (menu, panneau…).
       #/plan?pcherche=souche (recherche des scènes de tout le livre) · #/chapitre/lisiere/scenes?pdialogue=supprimer:S017
       #/chapitre/lisiere/graphe?vise=S014 (scène d'arrivée désignée). La scène touchée, sur téléphone, s'obtient en la touchant. */
  const ui = { aide: false, aideVue: false, aideJamais: false, avecParams: false, corbeille: [], panneau: null, montre: [], neuve: null, drapeaux: false };

  /* ——— État dérivé selon la variante ————————————————————————— */
  const eleve = () => st.vue === 'eleve' && st.mode === 'classe';
  const perso = () => st.mode === 'perso';
  const choix = () => st.recit === 'choix';
  const etatDe = sc => perso() ? ({ valide: 'prete', valider: 'cours', reprendre: 'cours' }[sc.etat] || sc.etat) : sc.etat;
  const choixDe = sc => choix() ? sc.choix : [];
  const attribue = (c, id = MOI) => c.eleves.some(([e]) => e === id);
  const peutVoir = c => !eleve() || attribue(c);

  /* ——— Images de repérage —————————————————————————————————— */
  const DEFAUTS = ['foret', 'mer', 'montagne', 'cite', 'desert'];
  function image(img, couleur, alt) {
    if (st.img === 'defaut' || !img) {
      // Visuel par défaut : tiré une seule fois de la bibliothèque, puis stable pour cet objet
      const cle = String(alt || couleur || 'projet'); let h = 0; for (const ch of cle) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      // Dans une même partie, deux chapitres voisins ne reçoivent pas le même visuel tant que la bibliothèque le permet (F10.1, 6 octobre 2026)
      const chap = alt ? Object.values(D.chapitres).find(x => x.titre === alt && x.partie) : null;
      const f = chap ? defautDe(chap) : DEFAUTS[h % DEFAUTS.length];
      return `<img src="assets/img/ill-defaut-${f}.jpg" alt="${alt ? esc('Visuel par défaut — ' + alt) : ''}" loading="lazy">`;
    }
    return `<img src="${img.src}" alt="${esc(alt ? img.alt : '')}" loading="lazy">`;
  }
  const estDefaut = img => st.img === 'defaut' || !img;
  function defautDe(c) {
    const pris = new Set(); let res = DEFAUTS[0];
    c.partie.chapitres.filter(x => estDefaut(x.image)).forEach(x => {
      let h = 0; for (const ch of String(x.titre)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
      let i = h % DEFAUTS.length, k = 0; while (pris.has(DEFAUTS[i]) && k < DEFAUTS.length) { i = (i + 1) % DEFAUTS.length; k++; }
      pris.add(DEFAUTS[i]); if (x === c) res = DEFAUTS[i];
    });
    return res;
  }
  const varsCouleur = c => { const k = D.couleurs[c.couleur]; return `--edge:${k.edge};--band:${k.band};--tint:${k.tint}`; };

  /* ——— Petits composants ———————————————————————————————————— */
  const tampon = (e, court) => `<span class="tampon" data-e="${e}">${ic(D.etats[e].icone)}${court ? D.etats[e].court : D.etats[e].long}</span>`;
  // Une scène « En cours » sans texte porte « Texte vide », partout où son état s'affiche (F06.5, 4 octobre 2026) ; les états de F07.1 ne changent pas
  const tamponVide = `<span class="tampon" data-e="vide">${ic('i-vide')}Texte vide</span>`;
  const tamponSc = (sc, court) => (etatDe(sc) === 'cours' && sc.vide ? tamponVide : tampon(etatDe(sc), court));
  const initiales = p => p.slice(0, 2).replace(/^(.)(.)/, (m, a, b) => a + b.toLowerCase());
  const gommette = (id, taille = '') => { const e = D.eleves[id]; return `<span class="gommette ${taille}" style="--g:${e.couleur}" aria-hidden="true">${e.initiales || initiales(e.prenom)}</span>`; };
  // Qui s'en occupe : une seule tournure, quel que soit l'état. Sans élève : « Pas encore prise » dans un chapitre attribué,
  // « Aucun élève » sinon, comme au Suivi. L'enseignante peut s'attribuer une scène (F06.3).
  function pec(sc, court) {
    if (perso()) return '';
    if (!sc.pec) { const c = D.chapitres[sc.chapitre]; return `<span class="pec pec--libre">${c && c.eleves.length ? 'Pas encore prise' : 'Aucun élève'}</span>`; }
    const e = D.eleves[sc.pec]; const toi = eleve() && sc.pec === MOI;
    if (sc.pec === 'prof' && !eleve()) return `<span class="pec">${gommette(sc.pec, 'gommette--s')}<b>${court ? 'Vous' : 'Vous vous en occupez'}</b></span>`;
    return `<span class="pec ${toi ? 'pec--toi' : ''}">${gommette(sc.pec, 'gommette--s')}${toi ? '<b>Tu t’en occupes</b>' : `<span><b>${e.prenom}</b>${court ? '' : ' s’en occupe'}</span>`}</span>`;
  }
  const nomsEleves = c => c.eleves.map(([id]) => D.eleves[id].prenom);

  function compte(c) {
    const n = {}; c.scenes.forEach(sc => { const e = etatDe(sc); n[e] = (n[e] || 0) + 1; });
    return n;
  }
  const pl = n => (n > 1 ? 's' : '');
  // Hors du livre : la même exclusion que dans la page de scène et dans le Livre (F11.2)
  const hors = sc => !eleve() && !!window.App.livre?.ui?.mods?.exclure?.has(sc.ref);
  // Où en est le chapitre, en deux lignes au plus : ce qui est fini, puis ce qui attend l'adulte. Les mots du Suivi.
  function resumeEtats(c) {
    const n = compte(c); const t = c.scenes.length;
    if (!t) return ['', ''];
    // « Validé » et « Prête » sont deux jalons (F07.1) : la carte les compte chacun sous son nom, comme les tampons du chapitre
    const l1 = [`${t} scène${pl(t)}`]; if (!perso() && n.valide) l1.push(`${n.valide} validée${pl(n.valide)}`); if (n.prete) l1.push(`${n.prete} prête${pl(n.prete)}`);
    const l2 = []; if (!perso()) { if (n.valider) l2.push(`${n.valider} à valider`); if (n.reprendre) l2.push(`${n.reprendre} à reprendre`); }
    const h = c.scenes.filter(hors).length; if (h) l2.push(h === t ? 'hors du livre' : `${h} hors du livre sur ${t}`);
    return [l1.join(' · '), l2.join(' · ')];
  }
  // Ce qui manque à un chapitre. La consigne, facultative, n'est plus comptée (F03.1, 6 octobre 2026) ;
  // un chapitre dont l'enseignante s'occupe de toutes les scènes n'attend pas d'élève.
  const ecritSeule = c => c.scenes.length > 0 && c.scenes.every(s => s.pec === 'prof');
  const sansEleve = c => !perso() && !c.eleves.length && !ecritSeule(c);
  function aPreparer(c) {
    const l = [];
    if (!c.scenes.length) l.push('Aucune scène');
    if (sansEleve(c)) l.push(l.length ? 'aucun élève' : 'Aucun élève');
    return l;
  }
  const tousChapitres = () => H.parties.flatMap(p => p.chapitres);
  function reindexer() { H.parties.forEach((p, pi) => p.chapitres.forEach((c, ci) => { c.partie = p; c.index = ci + 1; c.partieIndex = pi + 1; })); }

  /* ——— Barre d'application ——————————————————————————————————— */
  function appbar() {
    const logo = `<a class="logo" href="${eleve() ? '#/plan' : (window.App.dernierOnglet || '#/plan')}"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="3" width="22" height="26" rx="3.5" fill="#0B6A73"/><rect x="5" y="3" width="4.5" height="26" rx="2" fill="#07525A"/><path d="M13 23c3-1 2-5 5-6s4-3 3-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-dasharray=".1 3.6"/><circle cx="21" cy="10" r="2.2" fill="#E6A33D"/></svg><span>You Are a Hero</span></a>`;
    if (eleve()) {
      $('#appbar').className = 'appbar appbar--eleve';
      $('#appbar').innerHTML = `${logo}<nav class="appbar__nav appbar__nav--eleve" aria-label="Espace élève"><a href="#/plan" ${st.page === 'plan' ? 'aria-current="page"' : ''}>Mon travail</a><a href="#/lectures" ${st.page === 'lectures' ? 'aria-current="page"' : ''}>Lectures</a></nav><span class="appbar__classe">${ic('i-eleves')}Classe CM1-CM2 de Mme Laurent</span>
        <div class="appbar__droite"><span class="identite">${gommette(MOI)}<span class="main">${D.eleves[MOI].prenom}</span></span>
        <a class="btn btn--discret" href="#/profils">Changer d’élève</a></div>`;
      return;
    }
    // La barre du haut est globale : le nom du dernier projet ouvert y ramène, à son dernier onglet utilisé ; « Mes projets » en donne la liste
    const dansProjet = !['projets', 'classes', 'nouveau'].includes(st.page); const reprise = window.App.dernierOnglet || '#/plan';
    $('#appbar').className = 'appbar';
    $('#appbar').innerHTML = `${logo}<nav class="appbar__nav" aria-label="Espace adulte"><a class="appbar__projet" href="${reprise}" title="${esc(H.titre)}" ${dansProjet ? 'aria-current="page"' : ''}>${H.titre}</a><a href="#/projets" ${['projets', 'nouveau'].includes(st.page) ? 'aria-current="page"' : ''}>Mes projets</a>${perso() ? '' : `<a href="#/classes" ${st.page === 'classes' ? 'aria-current="page"' : ''}>Mes classes</a>`}</nav>
      <div class="appbar__droite"><span class="identite">${perso() ? '<span class="gommette" style="--g:#4A5157" aria-hidden="true">Ca</span><span>Camille Roux</span>' : '<span class="gommette" style="--g:#4A5157" aria-hidden="true">ML</span><span>Mme Laurent</span>'}</span></div>`;
  }

  /* ——— Page : parties et chapitres ————————————————————————————— */
  function pagePlan() {
    const nbChap = H.parties.reduce((a, p) => a + p.chapitres.length, 0);
    const nbScenes = Object.keys(D.scenes).length;
    let tete;
    if (eleve()) {
      // Mon travail, repris après la critique du 5 octobre 2026 : le chapitre est celui de l'élève, les scènes sont rangées
      // par urgence, une seule porte le bouton plein, « Texte vide » se lit comme ailleurs, et les horaires se disent ici aussi.
      const mien = Object.values(D.chapitres).find(c => attribue(c)) || null;
      const ferme = st.horaire === 'ferme';
      const prof = 'Mme Laurent';
      const entete = corps => `<section class="accueil" style="${varsCouleur(mien || D.chapitres.lisiere)}">
        <div class="accueil__image">${image(H.image, null, H.titre)}</div>
        <div class="accueil__texte">
          <p class="accueil__bonjour">Bonjour ${D.eleves[MOI].prenom}</p>
          <h1>${H.titre}</h1>${corps}
        </div></section>`;
      if (!mien) tete = `${entete(`<p>Tu n’as pas encore de chapitre dans cette histoire.</p><p class="accueil__acces">${ic('i-main')}${prof} va t’en donner un.</p>`)}
      <h2 class="histoire-titre">Toute l’histoire</h2>`;
      else if (ferme) tete = `${entete(`<p>Ton chapitre : <b>${mien.titre}</b>, dans ${mien.partie.titre}.</p><p class="accueil__acces accueil__acces--ferme">${ic('i-horloge')}Le travail est fermé jusqu’à demain, 8 h 30.</p>`)}
      <section class="travail"><p class="aucun">Tu retrouveras tes scènes demain. Tes textes sont enregistrés.</p></section>
      <h2 class="histoire-titre">Toute l’histoire</h2>`;
      else {
      // Texte gardé à part après un conflit (F08.1, 7 octobre 2026) : l'élève est arrêté sur cette scène jusqu'au geste de l'enseignante.
      // Elle porte la phrase de la scène, sans bouton pour écrire, et se range après ce qu'il peut écrire, avant ce qu'il a remis.
      const arret = sc => !!window.App.apart?.arrete(sc.ref, MOI);
      const rang = sc => arret(sc) ? 2.5 : sc.etat === 'reprendre' ? 0 : sc.etat === 'cours' ? (sc.vide ? 2 : 1) : sc.etat === 'valider' ? 3 : 4;
      const miennes = mien.scenes.filter(s => s.pec === MOI).sort((x, y) => rang(x) - rang(y));
      const autres = mien.scenes.filter(s => s.pec !== MOI).sort((x, y) => arret(y) - arret(x));
      const action = sc => {
        if (arret(sc)) return [window.App.apart.phrase, 'Lire la scène'];
        if (sc.etat === 'valider') return [prof + ' relit ton texte.', 'Lire mon texte'];
        if (sc.etat === 'reprendre') return [prof + ' t’a laissé une remarque.', 'Reprendre mon texte'];
        if (['valide', 'prete'].includes(sc.etat)) return ['Validé. Bravo !', 'Lire mon texte'];
        if (sc.vide) return [sc.papier ? 'Tu l’as préparée sur papier : recopie-la ici.' : 'Tu peux préparer ton texte sur papier ou l’écrire ici.', 'Écrire'];
        return ['Continue ton texte.', 'Continuer'];
      };
      // La prochaine chose à faire : la première scène qui attend l'élève
      const suivante = miennes.find(sc => rang(sc) < 3 && !arret(sc));
      tete = `${entete(`<p>Ton chapitre : <b>${mien.titre}</b>, dans ${mien.partie.titre}.</p>
          <p class="accueil__acces">${ic('i-horloge')}${st.horaire === 'fin' ? 'Le travail se ferme à 16 h 30, dans 5 minutes.' : 'Aujourd’hui, le travail est ouvert jusqu’à 16 h 30.'}</p>`)}
      <section class="travail" aria-labelledby="t-mien">
        <h2 id="t-mien">Les scènes dont tu t’occupes</h2>
        ${miennes.length ? `<ul class="travail__fiches">${miennes.map(sc => { const [msg, lib] = action(sc); return `<li class="fiche fiche--travail">
          <div class="fiche__tete"><span class="fiche__ref">${sc.ref}</span>${tamponSc(sc)}</div>
          <p class="fiche__titre">${sc.titre}</p>
          <p class="fiche__msg ${arret(sc) ? 'ga-msg' : ''}">${arret(sc) ? ic('i-apart') : ''}<span>${msg}</span></p>
          <a class="btn ${sc === suivante ? 'btn--primaire' : ''}" href="#/scene/${sc.ref}">${lib}${ic('i-fleche')}</a>
        </li>`; }).join('')}</ul>` : `<p class="aucun">Tu ne t’occupes encore d’aucune scène. ${mien.scenes.some(s => !s.pec) ? 'Choisis-en une dans ton chapitre.' : `Demande à ${prof} laquelle écrire.`} <a href="#/chapitre/${mien.id}">Voir les scènes de ${mien.titre}</a></p>`}
        ${autres.length ? `<h2>Dans ton chapitre</h2>
        <p class="travail__aide">Tu peux lire les scènes de tes camarades.</p>
        <ul class="travail__autres">${autres.map(sc => `<li><span class="fiche__ref">${sc.ref}</span><span class="travail__titre">${sc.titre}</span>${pec(sc, true)}<a class="btn btn--petit" href="#/scene/${sc.ref}">Lire</a>${arret(sc) ? `<p class="ga-msg">${ic('i-apart')}<span>${window.App.apart.phrase}</span></p>` : ''}</li>`).join('')}</ul>` : ''}
        <p class="travail__plus"><a href="#/chapitre/${mien.id}">Voir tout le chapitre ${mien.titre}${ic('i-fleche')}</a></p>
        <div class="essai-entree"><div><h2>Tester la lecture</h2><p>Lis ton chapitre comme un lecteur : suis les choix et vérifie que tout s’enchaîne.</p></div><a class="btn" href="#/lecture">${ic('i-livre')}Commencer une lecture d’essai</a></div>
      </section>
      <h2 class="histoire-titre">Toute l’histoire</h2>`;
      }
    } else {
      // Écran d'aide à la première ouverture, comme au Suivi et au Livre (F03.1, 6 octobre 2026)
      if (!ui.aideVue && !ui.aideJamais && st.planaide !== '0' && (st.planaide === '1' || !ui.avecParams)) ui.aide = true;
      if (ui.aide) return `<div class="page page--plan">${window.App.enteteProjet('plan')}${aidePlan()}</div>`;
      // « À compléter » : une phrase qui informe, dont chaque manque est un lien vers la première carte concernée. Ni filtre ni état enfoncé.
      const chaps = tousChapitres();
      const vides = chaps.filter(c => !c.scenes.length).map(c => c.id);
      const sansEl = chaps.filter(sansEleve).map(c => c.id);
      const sansChap = perso() || window.App.classes?.sansClasse() ? [] : Object.values(D.eleves).filter(e => !chaps.some(c => attribue(c, e.id)));
      const lien = (ids, txt) => `<button class="lien" data-act="montrer" data-ids="${ids.join(',')}">${txt}</button>`;
      const manques = [];
      if (choix() && !chaps.some(c => c.scenes.some(s => s.depart))) manques.push('<span>le départ du livre n’est pas choisi</span>');
      if (vides.length) manques.push(lien(vides, `${vides.length} chapitre${pl(vides.length)} sans scène`));
      if (sansEl.length) manques.push(lien(sansEl, `${sansEl.length} chapitre${pl(sansEl.length)} sans élève`));
      if (sansChap.length) manques.push(`<span>${sansChap.length} élève${pl(sansChap.length)} sans chapitre <a class="lien" href="#/suivi?sv=eleves">Voir</a></span>`);
      const nbSc = chaps.reduce((a, c) => a + c.scenes.length, 0);
      tete = `${window.App.enteteProjet('plan')}
      <section class="reste" aria-label="Le plan de l’histoire">
        <div class="reste__texte">
          <p class="reste__titre">${H.parties.length} partie${pl(H.parties.length)} · ${chaps.length} chapitre${pl(chaps.length)} · ${nbSc} scène${pl(nbSc)}</p>
          ${manques.length ? `<p class="reste__manques"><b>À compléter :</b> ${manques.join('<span class="reste__sep" aria-hidden="true"> · </span>')}</p>` : ''}
        </div>
        <div class="reste__actions">
          <label class="recherche plan-cherche"><span class="vh">Rechercher une scène dans tout le livre</span>${ic('i-loupe')}<input type="search" data-saisie="plan-cherche" placeholder="Rechercher une scène" value="${esc(st.pcherche || '')}"></label>
          <button class="plan-aide" data-act="plan-aide" title="Que fait-on ici ?">${ic('i-aide')}Aide</button>
          <button class="btn" data-act="toast" data-msg="Idées de parties : l’aide propose des parties, vous retenez celles que vous voulez. Rien n’est ajouté sans votre accord.">${ic('i-etincelle')}Idées de parties</button>
          <button class="btn btn--primaire" data-act="partie-ajouter">${ic('i-plus')}Ajouter une partie</button>
        </div>
      </section>`;
    }

    const parties = H.parties.map((p, pi) => {
      const nbS = p.chapitres.reduce((a, c) => a + c.scenes.length, 0);
      const nbE = new Set(p.chapitres.flatMap(c => c.eleves.map(e => e[0]))).size;
      const meta = [`Partie ${pi + 1}`, `${p.chapitres.length} chapitre${p.chapitres.length > 1 ? 's' : ''}`];
      if (!eleve()) meta.push(`${nbS} scène${pl(nbS)}`);
      if (!eleve() && !perso()) meta.push(`${nbE} élève${nbE > 1 ? 's' : ''}`);
      return `<section class="partie" aria-labelledby="p-${p.id}">
        <header class="partie__tete">
          <div class="partie__vignette">${image(p.image, null)}</div>
          <div class="partie__titres"><h2 id="p-${p.id}">${p.titre}</h2><p>${meta.join(' · ')}</p></div>
          ${eleve() ? '' : `<details class="menu-scene partie__menu"><summary class="btn btn--petit menu-plus" title="Autres commandes de la partie">${ic('i-points')}<span class="vh">Autres commandes de la partie ${esc(p.titre)}</span></summary>
            <div class="menu-scene__liste"><button data-act="partie-reglages" data-id="${p.id}">Réglages</button><button data-act="partie-supprimer" data-id="${p.id}">Supprimer</button></div></details>`}
        </header>
        <div class="cahiers ${p.chapitres.length === 1 ? 'cahiers--seul' : ''}">
          ${p.chapitres.map(cahier).join('')}
          ${eleve() ? '' : `<button class="cahier-ajout" data-act="chap-ajouter" data-id="${p.id}">${ic('i-plus')}<span>Ajouter un chapitre</span></button>`}
        </div>
      </section>`;
    }).join('');

    // Une recherche en cours remplace les cartes par les scènes trouvées, rangées sous leur chapitre
    const cherche = !eleve() && (st.pcherche || '').trim();
    return `<div class="page page--plan ${eleve() ? 'page--eleve' : ''}">${tete}${cherche ? scenesTrouvees(cherche) : `<div class="parties">${parties}</div>`}${eleve() ? '' : lienCorbeille()}</div>`;
  }

  /* ——— Recherche des scènes de tout le livre (F03.1, 6 octobre 2026) : celle de F05, ouverte depuis « Parties et chapitres ».
     La maquette ne cherche que dans les références et les titres ; la règle couvre aussi consignes et textes. ——— */
  const sansAccent = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function passageTrouve(titre, nq) {
    const lettres = [...titre]; const plates = lettres.map(sansAccent);
    const i = plates.every(x => x.length === 1) ? plates.join('').indexOf(nq) : -1; const n = [...nq].length;
    return i < 0 ? esc(titre) : `${esc(lettres.slice(0, i).join(''))}<mark>${esc(lettres.slice(i, i + n).join(''))}</mark>${esc(lettres.slice(i + n).join(''))}`;
  }
  function scenesTrouvees(q) {
    const nq = sansAccent(q); const effacer = '<button class="lien" data-act="plan-cherche-effacer">Effacer la recherche</button>';
    const groupes = tousChapitres().map(c => [c, c.scenes.filter(sc => sansAccent(sc.ref + ' ' + sc.titre).includes(nq))]).filter(([, l]) => l.length);
    const n = groupes.reduce((a, [, l]) => a + l.length, 0);
    if (!n) return `<p class="aucun" aria-live="polite">Aucune scène trouvée pour « ${esc(q)} » dans le livre. ${effacer}</p>`;
    return `<section class="trouves" aria-live="polite" aria-label="Scènes trouvées"><p class="trouves__compte"><span><b>${n} scène${pl(n)}</b> pour « ${esc(q)} »</span>${effacer}</p>
      ${groupes.map(([c, l]) => `<div class="trouves__chap" style="${varsCouleur(c)}"><h3><a href="#/chapitre/${c.id}/scenes">${esc(c.titre)}</a><span>${esc(c.partie.titre)}</span></h3>
        <ul>${l.map(sc => `<li class="trouve"><span class="fiche__ref">${sc.ref}</span><span class="trouve__titre">${passageTrouve(sc.titre, nq)}</span>${tamponSc(sc, true)}${perso() ? '<span></span>' : pec(sc, true)}<span class="trouve__ouvrir" aria-hidden="true">Ouvrir${ic('i-fleche')}</span><a class="trouve__cible" href="#/scene/${sc.ref}" aria-label="Ouvrir ${sc.ref} — ${esc(sc.titre)}"></a></li>`).join('')}</ul></div>`).join('')}</section>`;
  }

  function cahier(c) {
    const surl = st.surligne && (st.surligneIds || []).includes(c.id);
    const ferme = eleve() && !attribue(c);
    let infos;
    if (eleve()) {
      if (!ferme) {
        const n = c.scenes.filter(s => s.pec === MOI).length;
        infos = `<p class="cahier__ruban">${ic('i-crayon')}Ton chapitre · tu t’occupes de ${n} scène${n > 1 ? 's' : ''}</p>
          <div class="cahier__ligne"><span class="gommettes">${c.eleves.map(([id]) => gommette(id, 'gommette--s')).join('')}</span><span>Avec ${nomsEleves(c).filter(n => n !== D.eleves[MOI].prenom).join(' et ')}</span></div>`;
      } else infos = `<p class="cahier__ligne cahier__ligne--ferme">Pas dans ton travail</p>`;
    } else {
      // Carte de l'adulte : où en est le chapitre, qui y écrit, ce qui manque. Les mots du Suivi, sans ambre (réservé au tampon « À valider »).
      const [l1, l2] = resumeEtats(c); const prep = aPreparer(c);
      infos = `${l1 ? `<p class="cahier__ligne cahier__ligne--etats">${l1}</p>` : ''}
        ${l2 ? `<p class="cahier__ligne cahier__ligne--attente">${l2}</p>` : ''}
        ${perso() || !c.eleves.length ? '' : `<div class="cahier__ligne"><span class="gommettes" title="${esc(nomsEleves(c).join(', '))}">${c.eleves.map(([id]) => gommette(id, 'gommette--s')).join('')}</span><span>${c.eleves.length} élève${pl(c.eleves.length)}</span></div>`}
        ${!perso() && !c.eleves.length && ecritSeule(c) ? `<div class="cahier__ligne">${gommette('prof', 'gommette--s')}<span>Vous l’écrivez</span></div>` : ''}
        ${prep.length ? `<p class="manque">${ic('i-alerte')}<span>${prep.join(' · ')}</span></p>` : ''}`;
    }
    const adulte = !eleve();
    const actions = adulte ? `<span class="cahier__ouvrir" aria-hidden="true">Ouvrir${ic('i-fleche')}</span>`
      : ferme
        ? `<button class="lien" data-act="fiche" data-id="${c.id}" aria-haspopup="dialog">Détails</button>`
        : `<button class="lien" data-act="fiche" data-id="${c.id}" aria-haspopup="dialog">Détails</button><a class="btn btn--petit btn--ouvrir" href="#/chapitre/${c.id}">Ouvrir${ic('i-fleche')}</a>`;
    // Pour l'adulte, toute la carte ouvre le chapitre ; le menu à trois points porte ses commandes (F03.1, 6 octobre 2026)
    return `<article class="cahier ${adulte ? 'cahier--adulte' : ''} ${ferme ? 'cahier--ferme' : ''} ${eleve() && !ferme ? 'cahier--mien' : ''} ${ui.montre.includes(c.id) ? 'est-montree' : ''}" data-chap="${c.id}" style="${varsCouleur(c)}" ${st.fiche === c.id ? 'aria-current="true"' : ''}>
      <div class="cahier__couv">
        <div class="cahier__vignette">${image(c.image, c.couleur, c.titre)}</div>
        <div class="etiquette"><h3 data-titre="${c.id}">${esc(c.titre)}</h3>${adulte ? '' : `<p>Chapitre ${c.index}${c.partie.chapitres.length === 1 ? ' · seul chapitre' : ''}</p>`}</div>
        <div class="cahier__couv-bas"></div>
      </div>
      <div class="cahier__pied">${infos}<div class="cahier__actions">${actions}</div></div>
      ${adulte ? `<a class="cahier__cible" href="#/chapitre/${c.id}" aria-label="Ouvrir le chapitre ${esc(c.titre)}"></a>${menuChapitre(c, 'cahier__menu')}` : ''}
    </article>`;
  }

  /* ——— Commandes du chapitre : un même menu sur la carte et dans le bandeau de sa page ——— */
  function menuChapitre(c, cls) {
    const tout = c.scenes.length > 0 && c.scenes.every(hors);
    const seul = c.partie.chapitres.length === 1;
    return `<details class="menu-scene ${cls}" data-menu="chap:${c.id}"><summary class="btn btn--petit menu-plus" title="Autres commandes du chapitre">${ic('i-points')}<span class="vh">Autres commandes du chapitre ${esc(c.titre)}</span></summary>
      <div class="menu-scene__liste"><button data-act="chap-reglages" data-id="${c.id}">Réglages</button>
        ${perso() ? '' : `<button data-act="chap-attribuer" data-id="${c.id}">Attribuer des élèves</button>`}
        ${c.scenes.length ? `<button data-act="chap-exclure" data-id="${c.id}">${tout ? 'Réintégrer dans le livre' : 'Exclure du livre'}</button>` : ''}
        <button data-act="chap-supprimer" data-id="${c.id}" ${seul ? 'disabled' : ''}>Supprimer</button>
        ${seul ? '<p class="menu-scene__note">Seul chapitre de sa partie : supprimez la partie.</p>' : ''}</div></details>`;
  }
  const lienCorbeille = () => `<p class="corbeille-lien"><button class="lien" data-act="corbeille">${ic('i-corbeille')}Corbeille du projet${ui.corbeille.length ? ` (${ui.corbeille.length})` : ''}</button></p>`;

  /* ——— Écran d'aide de « Parties et chapitres » : le même que celui du Suivi et d'une étape du Livre ——— */
  const aidePlan = () => `<section class="aide-etape aide-plan" aria-labelledby="aide-t">
      <h2 id="aide-t" tabindex="-1">Parties et chapitres</h2>
      <div class="aide-etape__q">
        <details open><summary>Que fait-on ici ?</summary><p>On construit le plan de l’histoire${perso() ? '.' : ', et on dit quels élèves écrivent chaque chapitre.'}</p>
          <ul class="aide-etape__taches"><li>Ajouter des parties, des chapitres et des scènes</li>${perso() ? '' : '<li>Attribuer chaque chapitre à des élèves</li>'}${choix() ? '<li>Suivre les chemins d’une scène à l’autre</li>' : '<li>Ranger les scènes dans l’ordre de lecture</li>'}</ul></details>
        <details><summary>Partie, chapitre, scène : quelle différence ?</summary><p>Une partie range plusieurs chapitres. ${perso() ? 'Un chapitre regroupe des scènes.' : 'Un chapitre est confié à des élèves.'} Une scène est un passage du livre${perso() ? '.' : ', écrit par un élève.'}</p></details>
        ${perso() ? '' : '<details><summary>Qui peut écrire où ?</summary><p>Un élève lit et écrit dans les chapitres que vous lui attribuez, pas dans les autres. Dans son chapitre, il choisit une scène et s’en occupe.</p></details>'}
        ${choix() ? '<details><summary>Scènes ou Chemins ?</summary><p>Dans un chapitre, « Scènes » donne la liste des scènes. « Chemins » montre où mène chaque choix.</p></details>' : ''}
      </div>
      <p class="aide-etape__cmd"><button class="btn btn--primaire btn--grand" data-act="plan-commencer">${ui.aideVue ? 'Fermer l’aide' : 'Commencer'}</button>
        <label class="aide-etape__plus"><input type="checkbox" data-act="plan-aide-jamais" ${ui.aideJamais ? 'checked' : ''}><span>Ne plus afficher</span></label></p></section>`;

  /* ——— Fiche du chapitre (panneau) ————————————————————————————— */
  function fiche(id) {
    const c = D.chapitres[id]; const k = D.couleurs[c.couleur];
    const tete = `<div class="panneau__tete" style="${varsCouleur(c)}">
        <button class="btn btn--discret panneau__fermer" data-act="fermer" aria-label="Fermer la fiche">${ic('i-fermer')}</button>
        <div class="panneau__image">${image(c.image, c.couleur, c.titre)}</div>
        <h2 id="panneau-titre">${c.titre}</h2>
        <p>Chapitre ${c.index} · ${c.partie.titre}</p>
      </div>`;
    let corps;
    if (eleve() && !attribue(c)) {
      corps = `<div class="panneau__corps"><div class="note-fermee">${ic('i-oeil')}<div><p><b>Ce chapitre ne fait pas partie de ton travail.</b></p><p>Tu vois son titre et son image, mais ses scènes et ses consignes ne sont pas ouvertes pour toi.</p></div></div></div>`;
    } else if (eleve()) {
      const miennes = c.scenes.filter(s => s.pec === MOI);
      corps = `<div class="panneau__corps">
        ${c.resume ? `<section><h3>Ce qui se passe</h3><p>${c.resume}</p></section>` : ''}
        <section><h3>Avec toi</h3><ul class="liste-eleves">${c.eleves.map(([e]) => `<li>${gommette(e, 'gommette--s')}${D.eleves[e].prenom}${e === MOI ? ' (toi)' : ''}</li>`).join('')}</ul></section>
        <section><h3>Tes scènes</h3><ul class="liste-scenes">${miennes.map(s => `<li><span class="code">${s.ref}</span> ${s.titre} ${tamponSc(s, true)}</li>`).join('')}</ul></section>
      </div>
      <div class="panneau__pied"><a class="btn btn--primaire btn--grand" href="#/chapitre/${c.id}" data-act="ouvrir">${ic('i-fleche')}Ouvrir le chapitre</a></div>`;
    } else corps = ''; // l'adulte n'a plus de fiche « Détails » : la carte ouvre le chapitre, ses réglages sont dans un panneau (plus bas)
    return tete + corps;
  }

  /* ——— Panneaux de l'adulte : réglages, attribution, corbeille. Le même contenant que la fiche de l'élève ——— */
  const teteDe = (titre, sous, c) => `<div class="panneau__tete panneau__tete--court" ${c ? `style="${varsCouleur(c)}"` : ''}>
      <button class="btn btn--discret panneau__fermer" data-act="fermer" aria-label="Fermer">${ic('i-fermer')}</button>
      <h2 id="panneau-titre">${titre}</h2>${sous ? `<p data-titre="${c ? c.id : ''}">${esc(sous)}</p>` : ''}</div>`;
  const piedFerme = '<div class="panneau__pied"><button class="btn btn--grand" data-act="fermer">Fermer</button></div>';
  function panneauReglages(id) {
    const c = D.chapitres[id];
    return `${teteDe('Réglages du chapitre', c.titre, c)}<div class="panneau__corps">
      <section><h3><label for="reg-titre">Titre</label></h3><input class="pchamp" id="reg-titre" type="text" data-saisie="chap-titre" data-id="${c.id}" value="${esc(c.titre)}"></section>
      <section><h3>Image et couleur</h3>
        <div class="reg-image"><span class="reg-image__vue">${image(c.image, c.couleur, c.titre)}</span><button class="btn btn--petit" data-act="toast" data-msg="Choisissez une image déjà importée, ou importez-en une. Elle sert de repère à l’écran : elle n’entre pas dans le livre.">${ic('i-image')}Changer l’image</button></div>
        <div class="palette" role="group" aria-label="Couleur du chapitre">${Object.entries(D.couleurs).map(([k, v]) => `<button class="palette__c" data-act="chap-couleur" data-id="${c.id}" data-c="${k}" style="--c:${v.edge}" aria-pressed="${c.couleur === k}" title="${v.nom}"><span class="vh">${v.nom}</span></button>`).join('')}</div></section>
      <section><h3><label for="reg-resume">Résumé</label> <span class="facultatif">facultatif</span></h3>
        <textarea class="pchamp" id="reg-resume" rows="3" data-saisie="chap-resume" data-id="${c.id}" placeholder="Ce qui se passe dans ce chapitre">${esc(c.resume || '')}</textarea>
        <p>${perso() ? 'Il sert de contexte à l’aide IA.' : 'Les élèves du chapitre le lisent. Il sert aussi de contexte à l’aide IA.'}</p></section>
    </div>${piedFerme}`;
  }
  function panneauPartie(id) {
    const p = H.parties.find(x => x.id === id);
    return `${teteDe('Réglages de la partie', p.titre)}<div class="panneau__corps">
      <section><h3><label for="reg-titre">Titre</label></h3><input class="pchamp" id="reg-titre" type="text" data-saisie="partie-titre" data-id="${p.id}" value="${esc(p.titre)}"></section>
      <section><h3>Image</h3><div class="reg-image"><span class="reg-image__vue">${image(p.image, null)}</span><button class="btn btn--petit" data-act="toast" data-msg="Choisissez une image déjà importée, ou importez-en une. Elle sert de repère à l’écran : elle n’entre pas dans le livre.">${ic('i-image')}Changer l’image</button></div></section>
    </div>${piedFerme}`;
  }
  // Attribuer des élèves : l'unité attribuée est nommée, l'accès est immédiat, et le profil se dit par ce qu'il permet (F06.1)
  function panneauAttribuer(id) {
    const c = D.chapitres[id]; const chaps = tousChapitres();
    if (window.App.classes?.sansClasse()) return window.App.classes.attribuer(teteDe('Attribuer des élèves', c.titre, c), piedFerme);
    const ailleurs = e => chaps.filter(x => x !== c && attribue(x, e.id)).map(x => x.titre);
    const rang = e => (attribue(c, e.id) ? 0 : ailleurs(e).length ? 2 : 1);
    const liste = Object.values(D.eleves).sort((a, b) => rang(a) - rang(b) || a.prenom.localeCompare(b.prenom, 'fr'));
    const ligne = e => { const ici = attribue(c, e.id); const prof = ici && c.eleves.find(([x]) => x === e.id)[1]; const ou = ailleurs(e);
      return `<li class="attr ${ici ? 'attr--ici' : ''}"><label class="attr__eleve"><input type="checkbox" class="case" data-act="attr-eleve" data-id="${c.id}" data-e="${e.id}" ${ici ? 'checked' : ''}>${gommette(e.id, 'gommette--s')}<span><b>${e.prenom}</b>${ici ? '' : `<span class="attr__ou">${ou.length ? ou.join(', ') : 'sans chapitre'}</span>`}</span></label>
        ${ici ? `<label class="attr__profil"><input type="checkbox" data-act="attr-profil" data-id="${c.id}" data-e="${e.id}" ${prof === 'organisation' ? 'checked' : ''}><span>peut créer des scènes et des choix</span></label>` : ''}</li>`; };
    return `${teteDe('Attribuer des élèves', c.titre, c)}<div class="panneau__corps">
      <p class="attr__intro">Un élève coché lit et écrit dans ce chapitre, tout de suite.</p>
      <ul class="attr-liste">${liste.map(ligne).join('')}</ul>
    </div>${piedFerme}`;
  }
  function panneauCorbeille() {
    const ligne = (x, i) => { const orphelin = x.type === 'scene' && !tousChapitres().includes(x.c);
      const titre = x.type === 'partie' ? x.p.titre : x.type === 'chapitre' ? x.c.titre : `<span class="code">${x.sc.ref}</span> ${esc(x.sc.titre)}`;
      const quoi = x.type === 'partie' ? `Partie · ${x.p.chapitres.length} chapitre${pl(x.p.chapitres.length)}` : x.type === 'chapitre' ? `Chapitre de « ${esc(x.p.titre)} » · ${x.c.scenes.length} scène${pl(x.c.scenes.length)}` : `Scène de « ${esc(x.c.titre)} »`;
      return `<li class="corb"><span class="corb__texte"><b>${titre}</b><span>${quoi}</span>${orphelin ? '<span>Restaurez d’abord son chapitre.</span>' : ''}</span><button class="btn btn--petit" data-act="corbeille-restaurer" data-i="${i}" ${orphelin ? 'disabled' : ''}>Restaurer</button></li>`; };
    return `${teteDe('Corbeille du projet', '')}<div class="panneau__corps">
      ${ui.corbeille.length ? `<p class="attr__intro">Ce que vous avez supprimé, avec ses textes. « Restaurer » le remet à sa place.</p><ul class="corb-liste">${ui.corbeille.map(ligne).join('')}</ul>` : '<p class="attr__intro">La corbeille est vide.</p>'}
    </div>${piedFerme}`;
  }
  function ouvrirPanneau(focus = true) {
    const x = ui.panneau; const p = $('#panneau'); if (!x) return;
    $$('details.menu-scene[open]').forEach(m => { m.open = false; });
    const avant = $('.panneau__corps', p); const y = avant ? avant.scrollTop : 0;
    p.innerHTML = { reglages: panneauReglages, partie: panneauPartie, attribuer: panneauAttribuer, corbeille: panneauCorbeille }[x.type](x.id);
    p.hidden = false; $('#voile').hidden = false;
    requestAnimationFrame(() => { p.classList.add('est-ouvert'); $('#voile').classList.add('est-ouvert'); });
    const corps = $('.panneau__corps', p); if (corps) corps.scrollTop = y;
    if (focus) setTimeout(() => { const f = x.type === 'corbeille' || x.type === 'attribuer' ? $('.panneau__fermer', p) : $('#reg-titre', p); if (f) { f.focus(); if (f.select && x.neuf) f.select(); } }, 80);
  }
  const panneau = (type, id, neuf) => { ui.panneau = { type, id, neuf }; ouvrirPanneau(); };

  /* ——— Dialogue de confirmation : supprimer, exclure du livre, changer le départ ——— */
  function dialogue(titre, corps, boutons) {
    let d = $('#dialogue'); if (!d) { document.body.insertAdjacentHTML('beforeend', '<div class="dialogue-voile" id="dialogue" hidden></div>'); d = $('#dialogue'); }
    d.innerHTML = `<div class="dialogue" role="alertdialog" aria-modal="true" aria-labelledby="dialogue-t"><h2 id="dialogue-t" tabindex="-1">${titre}</h2>${corps}<p class="dialogue__cmd">${boutons}<button class="btn" data-act="dialogue-fermer">Annuler</button></p></div>`;
    $$('details.menu-scene[open]').forEach(m => { m.open = false; });
    d.hidden = false; setTimeout(() => $('#dialogue-t')?.focus(), 30);
  }
  const fermerDialogue = () => { const d = $('#dialogue'); if (d) d.hidden = true; };
  const liste = a => (a.length > 1 ? a.slice(0, -1).join(', ') + ' et ' + a[a.length - 1] : a[0] || '');
  const auteurs = scs => [...new Set(scs.filter(s => !s.vide && s.pec && s.pec !== 'prof').map(s => D.eleves[s.pec].prenom))];
  // Avant de supprimer : ce qui part, qui y a écrit, quels choix y mènent, et où le retrouver (F03-AC13, F03-AC14)
  function demanderSuppression(type, id) {
    const p = type === 'partie' ? H.parties.find(x => x.id === id) : null;
    const chaps = type === 'partie' ? p.chapitres : type === 'chapitre' ? [D.chapitres[id]] : [];
    const scs = type === 'scene' ? [D.scenes[id]] : chaps.flatMap(c => c.scenes);
    const ecrites = scs.filter(s => !s.vide);
    if (!ecrites.length) { supprimer(type, id); return; } // rien d'écrit : pas de confirmation, « Annuler » dans le message
    const refs = new Set(scs.map(s => s.ref));
    const arrivees = scs.flatMap(s => [...(s.entrees || []).map(([ch, ref]) => ref), ...(s.internes || []).map(([, ref]) => ref)]).filter(r => !refs.has(r));
    const qui = auteurs(scs);
    const nom = type === 'scene' ? nomScene(D.scenes[id]) : `« ${esc(type === 'partie' ? p.titre : chaps[0].titre)} »`;
    const lignes = [];
    if (type === 'scene') lignes.push(qui.length ? `${qui[0]} y a écrit.` : 'Elle a déjà un texte.');
    else lignes.push(`${scs.length} scène${pl(scs.length)}, dont ${ecrites.length} déjà écrite${pl(ecrites.length)}${qui.length ? ` par ${liste(qui)}` : ''}.`);
    if (arrivees.length) lignes.push(`${arrivees.length} choix y ${arrivees.length > 1 ? 'mènent' : 'mène'}, depuis ${liste([...new Set(arrivees)].map(r => (D.scenes[r] ? nomScene(D.scenes[r]) : `<span class="code">${r}</span>`)))}. ${arrivees.length > 1 ? 'Ils ne mèneront' : 'Il ne mènera'} plus nulle part.`);
    if (scs.some(s => s.depart)) lignes.push('Le départ du livre s’y trouve : il faudra en choisir un autre.');
    lignes.push(`Vous ${type === 'scene' ? 'la' : type === 'partie' ? 'la' : 'le'} retrouverez dans la corbeille du projet, avec ses textes.`);
    dialogue(`Supprimer ${nom} ?`, `<ul class="dialogue__faits">${lignes.map(l => `<li>${l}</li>`).join('')}</ul>`, `<button class="btn btn--danger" data-act="supprimer-oui" data-type="${type}" data-id="${id}">Supprimer</button>`);
  }
  function supprimer(type, id) {
    let nom;
    if (type === 'partie') { const p = H.parties.find(x => x.id === id); const i = H.parties.indexOf(p); H.parties.splice(i, 1); p.chapitres.forEach(c => { c.supprime = true; c.scenes.forEach(s => { s.supprime = true; }); }); ui.corbeille.unshift({ type, p, i }); nom = `« ${p.titre} »`; }
    else if (type === 'chapitre') { const c = D.chapitres[id]; const p = c.partie; const i = p.chapitres.indexOf(c); p.chapitres.splice(i, 1); c.supprime = true; c.scenes.forEach(s => { s.supprime = true; }); ui.corbeille.unshift({ type, c, p, i }); nom = `« ${c.titre} »`; }
    else { const sc = D.scenes[id]; const c = D.chapitres[sc.chapitre]; const i = c.scenes.indexOf(sc); c.scenes.splice(i, 1); sc.supprime = true; ui.corbeille.unshift({ type, sc, c, i }); nom = nomSceneTexte(sc); }
    reindexer(); fermerDialogue(); ui.panneau = null;
    if (type === 'chapitre' && st.page === 'chapitre' && st.chap === id) { location.hash = '#/plan'; setTimeout(() => toastAnnuler(`${nom} est dans la corbeille du projet.`), 60); return; }
    rendre(); toastAnnuler(`${nom} est dans la corbeille du projet.`);
  }
  function restaurer(i) {
    const x = ui.corbeille[i]; if (!x) return;
    if (x.type === 'partie') { H.parties.splice(Math.min(x.i, H.parties.length), 0, x.p); x.p.chapitres.forEach(c => { c.supprime = false; c.scenes.forEach(s => { s.supprime = false; }); }); }
    else if (x.type === 'chapitre') { x.p.chapitres.splice(Math.min(x.i, x.p.chapitres.length), 0, x.c); x.c.supprime = false; x.c.scenes.forEach(s => { s.supprime = false; }); }
    else { x.c.scenes.splice(Math.min(x.i, x.c.scenes.length), 0, x.sc); x.sc.supprime = false; }
    ui.corbeille.splice(i, 1); reindexer();
    return x.type === 'partie' ? `« ${x.p.titre} »` : x.type === 'chapitre' ? `« ${x.c.titre} »` : nomSceneTexte(x.sc);
  }
  // Une destination supprimée reste signalée, sans être redirigée (F03-AC14)
  const perdue = ref => !D.scenes[ref] || !!D.scenes[ref].supprime;
  // Dans une phrase, une scène se nomme par sa référence suivie de son titre : la référence seule ne dit rien à qui ne l'a pas en tête
  const nomScene = sc => `<span class="code">${sc.ref}</span> « ${esc(sc.titre)} »`;
  const nomSceneTexte = sc => `${sc.ref} « ${sc.titre} »`;
  // Liens cachés (F05.1) : une suite du récit, que l'adulte voit sur la carte de la scène et dans les chemins. [destination, numéro, chapitre, libellé]
  const cachees = sc => (!eleve() && choix() ? (sc.cachees || []) : []);

  /* ——— Page : chapitre ————————————————————————————————————————— */
  function pageChapitre() {
    const c = D.chapitres[st.chap];
    const fil = `<nav class="fil" aria-label="Fil d’Ariane"><a href="#/plan">${ic('i-fleche-g')}${eleve() ? 'Mon travail' : 'Parties et chapitres'}</a><span aria-hidden="true">/</span>${eleve() ? `<span>${c.partie.titre}</span><span aria-hidden="true">/</span>` : ''}<span aria-current="page" data-titre="${c.id}">${esc(c.titre)}</span></nav>`;
    if (!peutVoir(c)) {
      return `<div class="page page--chapitre" style="${varsCouleur(c)}">${fil}
        <div class="chap-ferme"><div class="chap-ferme__image">${image(c.image, c.couleur, c.titre)}</div>
        <h1>${c.titre}</h1><p>Ce chapitre ne fait pas partie de ton travail : ses scènes ne sont pas ouvertes pour toi.</p>
        <a class="btn" href="#/chapitre/lisiere">Retourner à La lisière</a></div></div>`;
    }
    const adulte = !eleve(); const classe = adulte && !perso(); const vide = !c.scenes.length;
    const eleves = perso() ? '' : `<ul class="chap-eleves" aria-label="Élèves attribués">${c.eleves.map(([e]) => `<li>${gommette(e, 'gommette--s')}<span>${D.eleves[e].prenom}${eleve() && e === MOI ? ' (toi)' : ''}</span></li>`).join('')}${!c.eleves.length ? (ecritSeule(c) ? `<li>${gommette('prof', 'gommette--s')}<span>Vous écrivez ce chapitre</span></li>` : '<li class="vide">Aucun élève</li>') : ''}</ul>`;
    // Une seule commande pleine à l'écran : « Ajouter une scène », dans le bandeau, ou dans le chapitre vide
    const actions = eleve() ? '' : `<div class="chap-actions">
        <button class="btn ${vide ? '' : 'btn--primaire'}" data-act="scene-ajouter" data-id="${c.id}">${ic('i-plus')}Ajouter une scène</button>
        ${perso() ? '' : `<button class="btn" data-act="chap-attribuer" data-id="${c.id}">${ic('i-eleves')}Attribuer des élèves</button>`}
        ${menuChapitre(c, 'chap-menu')}
      </div>`;
    // La vue s'appelle « Chemins » à l'écran depuis le 6 octobre 2026 ; son adresse garde « graphe »
    const onglets = choix() ? `<div class="bascule" role="tablist" aria-label="Affichage des scènes">
        <a role="tab" href="#/chapitre/${c.id}/scenes" aria-selected="${st.onglet === 'scenes'}">${ic('i-grille')}Scènes</a>
        <a role="tab" href="#/chapitre/${c.id}/graphe" aria-selected="${st.onglet === 'graphe'}">${ic('i-graphe')}Chemins</a></div>${adulte && st.onglet === 'scenes' ? `<button class="info" data-act="livre-info" data-msg="L’ordre des cartes ne fait pas le chemin du lecteur : ce sont les choix qui le font. « Chemins » le montre." aria-expanded="false" aria-label="Que montre l’ordre des cartes ?">${ic('i-info')}</button>` : ''}` : `<p class="ordre-lecture">${ic('i-livre')}Ordre de lecture</p>`;
    // Le chapitre est le plan, le Suivi est le travail : les filtres par état et par élève restent au Suivi (F03.1, 6 octobre 2026).
    // Le mode personnel, sans Suivi, et l'élève gardent les leurs.
    const outils = `<div class="chap-outils">${onglets}${classe ? '' : filtres(c)}<label class="recherche"><span class="vh">Rechercher dans ce chapitre</span>${ic('i-loupe')}<input type="search" data-saisie="recherche" placeholder="Rechercher dans ce chapitre" value="${esc(st.recherche)}"></label>${classe ? `<a class="lien-suivi" href="#/suivi?sch=${c.id}">Voir dans le Suivi${ic('i-fleche')}</a>` : ''}</div>`;
    return `<div class="page page--chapitre ${eleve() ? 'page--eleve' : ''}" style="${varsCouleur(c)}">
      ${fil}
      <header class="chap-bandeau">
        <div class="chap-bandeau__image">${image(c.image, c.couleur, c.titre)}</div>
        <div class="chap-bandeau__texte">
          <h1 data-titre="${c.id}">${esc(c.titre)}</h1>
          <p class="chap-meta">${adulte ? `${c.partie.titre}` : `Chapitre ${c.index} de ${c.partie.titre}`} · ${c.scenes.length} scène${c.scenes.length > 1 ? 's' : ''}${eleve() ? ' · ton chapitre' : ''}</p>
          ${eleves}
        </div>
        ${actions}
      </header>
      ${c.resume && eleve() && attribue(c) ? `<details class="chap-resume"><summary>Résumé du chapitre <span class="facultatif">facultatif</span></summary><p>${c.resume}</p></details>` : ''}
      ${adulte && vide ? '' : outils}
      <section class="chap-contenu" aria-live="polite">${c.scenes.length ? (st.onglet === 'graphe' && choix() ? graphe(c) : scenes(c)) : videChapitre(c)}</section>
      ${barreSelection()}
      ${adulte && ui.corbeille.length ? lienCorbeille() : ''}
    </div>`;
  }

  function videChapitre(c) {
    if (!eleve()) return `<div class="vide-chap"><div class="vide-chap__image">${image(null, c.couleur)}</div><div><h2>Ce chapitre n’a pas encore de scène</h2><p>Ajoutez une première scène.</p>
      <button class="btn btn--primaire" data-act="scene-ajouter" data-id="${c.id}">${ic('i-plus')}Ajouter une scène</button></div></div>`;
    return `<div class="vide-chap"><div class="vide-chap__image">${image(null, c.couleur)}</div><div><h2>Ce chapitre n’a pas encore de scène</h2><p>Ajoutez une première scène : elle reçoit une référence et peut être écrite avant même d’être reliée au reste du récit.</p></div></div>`;
  }

  function filtres(c) {
    const f = st.filtre; const n = compte(c);
    const chip = (v, lib, nb) => `<button class="puce" data-act="filtre" data-v="${v}" aria-pressed="${f === v}">${lib}${nb !== undefined ? ` <span>${nb}</span>` : ''}</button>`;
    if (perso()) return `<div class="filtres" aria-label="Filtrer">${chip('toutes', 'Toutes', c.scenes.length)}${chip('cours', 'En cours', n.cours || 0)}${chip('prete', 'Prêtes', n.prete || 0)}</div>`;
    const nv = c.scenes.filter(x => x.vide).length;
    if (eleve()) return `<div class="filtres" aria-label="Filtrer">${chip('toutes', 'Toutes', c.scenes.length)}${chip('pec:' + MOI, 'Les miennes', c.scenes.filter(s => s.pec === MOI).length)}${chip('libres', 'Libres', c.scenes.filter(s => !s.pec).length)}</div>`;
    return `<div class="filtres" aria-label="Filtrer">${chip('toutes', 'Toutes', c.scenes.length)}${chip('valider', 'À valider', n.valider || 0)}${chip('reprendre', 'À reprendre', n.reprendre || 0)}${chip('vide', 'Texte vide', nv)}
      <label class="puce puce--select"><span class="vh">Prises en charge par</span><select data-act="filtre-select">
        <option value="">Prises en charge par…</option>
        ${c.eleves.map(([e]) => `<option value="pec:${e}" ${f === 'pec:' + e ? 'selected' : ''}>${D.eleves[e].prenom}</option>`).join('')}
        <option value="libres" ${f === 'libres' ? 'selected' : ''}>Personne</option></select>${ic('i-chevron-bas')}</label></div>`;
  }
  function correspond(sc) {
    const q = st.recherche.trim().toLowerCase();
    if (q && !(sc.ref + ' ' + sc.titre).toLowerCase().includes(q)) return false;
    const f = st.filtre;
    if (f === 'vide') return !!sc.vide;
    if (f === 'toutes') return true;
    if (f === 'libres') return !sc.pec;
    if (f.startsWith('pec:')) return sc.pec === f.slice(4);
    return etatDe(sc) === f;
  }

  function selectionnable(sc) { return !(eleve() && ['valide', 'prete'].includes(sc.etat)); }
  function metaScene(sc, c) {
    const m = [];
    if (choix() && sc.depart) m.push(`<span class="repere repere--depart">${ic('i-drapeau')}Départ du livre</span>`);
    if (choix() && sc.fin) m.push(`<span class="repere repere--fin">${ic('i-fin')}Fin de l’histoire</span>`);
    if (choix()) (sc.entrees || []).filter(([, ref]) => !perdue(ref)).forEach(([ch, ref]) => m.push(`<span>${ic('i-entree')}Arrive depuis ${D.chapitres[ch].titre}${eleve() && !attribue(D.chapitres[ch]) ? '' : ` · <span class="code">${ref}</span>`}</span>`));
    const ch = choixDe(sc);
    if (ch.length) {
      const dests = ch.map(([, d, x]) => !d ? 'à décider' : perdue(d) ? `<span class="code">${d}</span> supprimée` : x ? (eleve() && !attribue(D.chapitres[x]) ? `${D.chapitres[x].titre}` : `${D.chapitres[x].titre} · <span class="code">${d}</span>`) : `<span class="code">${d}</span>`);
      m.push(`<span>${ic('i-choix')}${ch.length} choix → ${dests.join(', ')}</span>`);
    }
    cachees(sc).forEach(([d, , x]) => m.push(`<span>${ic('i-cle')}Lien caché → ${perdue(d) ? `<span class="code">${d}</span> supprimée` : `${x && x !== sc.chapitre ? D.chapitres[x].titre + ' · ' : ''}<span class="code">${d}</span>`}</span>`));
    if (sc.vide && etatDe(sc) !== 'cours') m.push(`<span class="texte-vide">Texte vide</span>`);
    if (!perso() && sc.papier) m.push(`<span>${ic('i-papier')}Préparée sur papier</span>`);
    // « sans consigne », neutre, comme au Suivi : la consigne est facultative (F07.1)
    if (!eleve() && !perso() && !sc.consigne) m.push(`<span class="sans-consigne">sans consigne</span>`);
    if (hors(sc)) m.push(`<span class="repere">hors du livre</span>`);
    return m.join('');
  }
  // Commandes d'une scène, sur sa carte : son rang dans le chapitre, les repères de départ et de fin (F03.2), l'exclusion et la suppression
  function menuScene(sc, c) {
    const i = c.scenes.indexOf(sc); const coche = ic('i-coche');
    const b = (act, lib, o = '') => `<button data-act="${act}" data-ref="${sc.ref}" ${o}>${lib}</button>`;
    return `<details class="menu-scene fiche__menu" data-menu="scene:${sc.ref}"><summary class="btn btn--petit menu-plus" title="Autres commandes de la scène">${ic('i-points')}<span class="vh">Autres commandes de ${sc.ref}</span></summary>
      <div class="menu-scene__liste">${b('sc-monter', 'Monter', i === 0 ? 'disabled' : '')}${b('sc-descendre', 'Descendre', i === c.scenes.length - 1 ? 'disabled' : '')}
        ${choix() ? `<hr>${b('sc-depart', `<span>Départ du livre</span>${sc.depart ? coche : ''}`, sc.depart ? 'aria-current="true" disabled' : '')}${b('sc-fin', `<span>Fin de l’histoire</span>${sc.fin ? coche : ''}`, `aria-pressed="${!!sc.fin}"`)}` : ''}
        <hr>${b(hors(sc) ? 'livre-inclure' : 'livre-exclure', hors(sc) ? 'Réintégrer dans le livre' : 'Exclure du livre')}${b('sc-supprimer', 'Supprimer')}</div></details>`;
  }
  // Qui s'en occupe, changé sur la carte : le même menu que dans la page de scène (F06.3)
  function quiCarte(sc, c) {
    const ids = [...c.eleves.map(([id]) => id), 'prof', ''];
    return `<details class="menu-scene menu-qui fiche__qui" data-menu="qui:${sc.ref}"><summary class="menu-qui__b" aria-label="Qui s’en occupe. Changer">${pec(sc)}${ic('i-chevron-bas')}</summary>
      <div class="menu-scene__liste" role="group" aria-label="Qui s’en occupe"><p class="menu-scene__t">Qui s’en occupe</p>
        ${ids.map(id => `<button data-act="qui-poser" data-ref="${sc.ref}" data-id="${id}" ${(sc.pec || '') === id ? 'aria-current="true"' : ''}>${id ? gommette(id, 'gommette--s') : '<span class="gommette gommette--libre gommette--s" aria-hidden="true"></span>'}<span>${id === 'prof' ? 'Moi' : id ? D.eleves[id].prenom : c.eleves.length ? 'Pas encore prise' : 'Aucun élève'}</span>${(sc.pec || '') === id ? ic('i-coche') : ''}</button>`).join('')}
        <p class="menu-scene__note">« Moi » : les élèves lisent la scène, sans y écrire.</p></div></details>`;
  }
  function scenes(c) {
    const liste = c.scenes.filter(correspond);
    if (!liste.length) return st.recherche.trim() && st.filtre === 'toutes'
      ? `<p class="aucun">Aucun titre de scène ne contient « ${esc(st.recherche.trim())} » dans ce chapitre. <button class="lien" data-act="recherche-effacer">Effacer la recherche</button></p>`
      : `<p class="aucun">Aucune scène ne correspond à ce filtre. <button class="lien" data-act="filtre" data-v="toutes">Tout afficher</button></p>`;
    const classique = !choix(); const adulte = !eleve(); const classe = adulte && !perso();
    // Pour l'enseignante, plus de case à cocher : les fiches se préparent au Suivi, et « qui s'en occupe » se change sur la carte
    const cartes = liste.map((sc, i) => {
      const e = etatDe(sc); const sel = st.selection.has(sc.ref);
      return `<li class="fiche ${adulte ? 'fiche--adulte' : ''} ${sel ? 'est-choisie' : ''} ${eleve() && sc.pec === MOI ? 'fiche--mienne' : ''} ${ui.neuve === sc.ref || st.vise === sc.ref ? 'est-montree' : ''}" data-ref="${sc.ref}">
        <div class="fiche__tete">
          ${classe ? '' : selectionnable(sc) ? `<input type="checkbox" class="case" data-act="choisir" data-ref="${sc.ref}" ${sel ? 'checked' : ''} aria-label="Sélectionner ${sc.ref}">` : '<span class="case-vide" aria-hidden="true"></span>'}
          ${classique ? `<span class="fiche__ordre">${c.scenes.indexOf(sc) + 1}</span>` : ''}<span class="fiche__ref">${sc.ref}</span>
          ${tamponSc(sc)}${adulte ? menuScene(sc, c) : ''}
        </div>
        <p class="fiche__titre">${sc.titre}</p>
        <div class="fiche__meta">${metaScene(sc, c)}</div>
        ${adulte ? `<div class="fiche__pied">${classe ? quiCarte(sc, c) : ''}<span class="fiche__ouvrir" aria-hidden="true">Ouvrir${ic('i-fleche')}</span></div>` : pec(sc)}
        <button class="fiche__cible" data-act="scene" data-ref="${sc.ref}" aria-label="Ouvrir ${sc.ref} — ${esc(sc.titre)}"></button>
      </li>`;
    }).join('');
    const suite = classique ? suiteClassique(c) : '';
    return `<ol class="fiches ${classique ? 'fiches--ordre' : ''}">${cartes}</ol>${suite}
      ${choix() && !adulte ? '<p class="note-rangement">Dans un récit à choix, l’ordre des cartes ne définit pas le chemin du lecteur : ce sont les choix qui le font.</p>' : ''}`;
  }
  function suiteClassique(c) {
    const tous = tousChapitres(); const i = tous.indexOf(c); const n = tous[i + 1];
    return n ? `<p class="suite-lecture">${ic('i-fleche')}La lecture continue avec <b>${n.titre}</b>${n.partie !== c.partie ? ` (${n.partie.titre})` : ''}.</p>` : '';
  }

  function barreSelection() {
    const n = st.selection.size; if (!n) return '';
    const refs = [...st.selection];
    if (eleve()) {
      const prises = refs.filter(r => D.scenes[r].pec && D.scenes[r].pec !== MOI);
      const avert = prises.length ? `<p class="selection__avert">${ic('i-main')}${prises.map(r => `<span class="code">${r}</span> : ${D.eleves[D.scenes[r].pec].prenom} s’en occupe`).join(' · ')}. Parle-leur d’abord, ou à Mme Laurent.</p>` : '';
      return `<div class="selection" role="region" aria-label="Sélection">
        <p class="selection__compte"><b>${n}</b> scène${n > 1 ? 's' : ''} : ${refs.map(r => `<span class="code">${r}</span>`).join(', ')}</p>${avert}
        <div class="selection__actions">
          ${prises.length && prises.length < n ? `<button class="btn" data-act="prendre" data-mode="libres">Seulement les libres</button>` : ''}
          <button class="btn btn--primaire" data-act="prendre" data-mode="tout">${ic('i-main')}Je m’en occupe</button>
          <button class="btn btn--discret" data-act="vider">Annuler</button></div></div>`;
    }
    return `<div class="selection" role="region" aria-label="Sélection">
      <p class="selection__compte"><b>${n}</b> scène${n > 1 ? 's' : ''} sélectionnée${n > 1 ? 's' : ''} : ${refs.map(r => `<span class="code">${r}</span>`).join(', ')}</p>
      <div class="selection__actions">
        <a class="btn" href="#/fiches/${refs.join(',')}">${ic('i-imprimer')}Préparer les fiches</a>
        ${perso() ? '' : `<button class="btn" data-act="toast" data-msg="Indiquer ou retirer l’élève qui s’en occupe, sans toucher aux textes.">${ic('i-main')}Qui s’en occupe…</button>`}
        <button class="btn btn--discret" data-act="vider">Tout désélectionner</button></div></div>`;
  }

  /* ——— Graphe : carte des sentiers ————————————————————————————— */
  function graphe(c) {
    const vertical = window.matchMedia('(max-width: 720px)').matches;
    const nodes = {}; const edges = [];
    c.scenes.forEach(sc => { nodes[sc.ref] = { id: sc.ref, sc, preds: [], succ: [] }; });
    const add = (a, b, lib, type, port) => { edges.push({ a, b, lib, type, port }); nodes[a].succ.push(b); nodes[b].preds.push(a); };
    c.scenes.forEach(sc => (sc.entrees || []).filter(([, ref]) => !perdue(ref)).forEach(([ch, ref]) => {
      const id = `in-${ch}-${ref}`; nodes[id] = nodes[id] || { id, gate: 'in', ch, ref, preds: [], succ: [] };
      add(id, sc.ref, null, 'raccord', 0);
    }));
    c.scenes.forEach(sc => sc.choix.forEach(([lib, dest, ch], i) => {
      if (!dest || perdue(dest)) return; // choix sans destination (F05.2), ou vers une scène supprimée : listé dans le nœud, sans lien
      if (ch) { const id = `out-${ch}-${dest}`; nodes[id] = nodes[id] || { id, gate: 'out', ch, ref: dest, preds: [], succ: [] }; add(sc.ref, id, lib, 'raccord', i); }
      else if (nodes[dest]) add(sc.ref, dest, lib, 'choix', i);
    }));
    // Un lien caché est une suite du récit : il a son trait, comme un choix, et sa ligne dans la scène (F05.1)
    c.scenes.forEach(sc => cachees(sc).forEach(([dest, , ch], j) => {
      if (perdue(dest)) return; const i = sc.choix.length + j;
      if (ch && ch !== c.id) { const id = `out-${ch}-${dest}`; nodes[id] = nodes[id] || { id, gate: 'out', ch, ref: dest, preds: [], succ: [] }; add(sc.ref, id, null, 'raccord', i); }
      else if (nodes[dest]) add(sc.ref, dest, null, 'choix', i);
    }));
    const sorties = sc => [...choixDe(sc).map(([lib, dest, x]) => ({ lib, dest, x })), ...cachees(sc).map(([dest, num, x, lib]) => ({ lib: 'Lien caché', dest, x: x !== c.id ? x : null, cache: true, info: `${lib} — énigme, numéro ${num}` }))];
    // Une scène sans choix ni repère de fin est « sans suite » : repère neutre, ce n'est pas une faute (F03.2). Une liaison cachée est une suite.
    const sansSuite = sc => choix() && !choixDe(sc).length && !sc.fin && !(sc.cachees || []).length;
    // Couches : plus long chemin depuis les entrées ; portes de sortie en dernière colonne
    const layer = {}; const hasGates = Object.values(nodes).some(n => n.gate === 'in');
    const visit = (id, seen = new Set()) => {
      if (layer[id] !== undefined) return layer[id]; if (seen.has(id)) return 0; seen.add(id);
      const n = nodes[id];
      if (n.gate === 'in') return (layer[id] = 0);
      const ps = n.preds.filter(p => nodes[p].gate !== 'out');
      return (layer[id] = ps.length ? Math.max(...ps.map(p => visit(p, seen) + 1)) : (hasGates ? 1 : 0));
    };
    Object.keys(nodes).filter(id => nodes[id].gate !== 'out').forEach(id => visit(id));
    const maxL = Math.max(...Object.values(layer));
    Object.values(nodes).filter(n => n.gate === 'out').forEach(n => { layer[n.id] = maxL + 1; });
    const couches = []; Object.entries(layer).forEach(([id, l]) => (couches[l] = couches[l] || []).push(id));
    // Rang dans la couche : barycentre des prédécesseurs, puis écartement minimal
    const pos = {};
    couches.forEach(ids => {
      if (!ids) return;
      ids.forEach((id, i) => { const ps = nodes[id].preds.filter(p => pos[p] !== undefined); nodes[id].want = ps.length ? ps.reduce((a, p) => a + pos[p], 0) / ps.length : i; });
      ids.sort((a, b) => nodes[a].want - nodes[b].want || a.localeCompare(b));
      let prev = -Infinity; const placed = ids.map(id => { const v = Math.max(nodes[id].want, prev + 1); prev = v; return v; });
      const shift = (ids.reduce((a, id) => a + nodes[id].want, 0) - placed.reduce((a, v) => a + v, 0)) / ids.length;
      ids.forEach((id, i) => { pos[id] = placed[i] + shift; });
    });
    const minP = Math.min(...Object.values(pos)); Object.keys(pos).forEach(k => (pos[k] -= minP));
    const maxP = Math.max(...Object.values(pos));

    // Dimensions : la hauteur d'un nœud dépend du nombre de choix listés
    const NW = vertical ? 150 : 196, GW = vertical ? 150 : 164, GX = vertical ? 20 : 56, GY = vertical ? 58 : 34, PAD = 18, TOP = 28;
    const ROW = 22, BASE = vertical ? 112 : 118;
    const haut = id => { const n = nodes[id]; if (n.gate) return vertical ? 98 : 100; const k = sorties(n.sc).length || (sansSuite(n.sc) ? 1 : 0); return BASE + (vertical ? (sansSuite(n.sc) ? 20 : 0) : k ? 10 + k * ROW : 0); };
    const larg = id => nodes[id].gate ? GW : NW;
    const hMax = Math.max(...Object.keys(nodes).map(haut));
    const colX = []; let acc = PAD;
    for (let l = 0; l <= maxL + 1; l++) { colX[l] = acc; const w = (couches[l] || []).some(id => !nodes[id].gate) ? NW : GW; acc += w + GX; }
    const W = vertical ? PAD * 2 + (maxP + 1) * NW + maxP * GX : acc - GX + PAD;
    const rowY = []; let accY = PAD + TOP;
    for (let l = 0; l <= maxL + 1; l++) { rowY[l] = accY; accY += Math.max(...(couches[l] || []).map(haut), 0) + GY; }
    const xy = id => vertical
      ? { x: PAD + pos[id] * (NW + GX) + (NW - larg(id)) / 2, y: rowY[layer[id]] }
      : { x: colX[layer[id]], y: PAD + TOP + pos[id] * (hMax + GY) };
    const Ht = vertical ? accY - GY + PAD : PAD * 2 + TOP + (maxP + 1) * hMax + maxP * GY;

    const portOut = (id, i) => {
      const p = xy(id), n = nodes[id];
      if (n.gate) return vertical ? { x: p.x + GW / 2, y: p.y + haut(id) } : { x: p.x + GW, y: p.y + haut(id) / 2 };
      const k = sorties(n.sc).length;
      if (vertical) return { x: p.x + NW * (i + 1) / (k + 1), y: p.y + haut(id) };
      return { x: p.x + NW, y: p.y + BASE + 10 + i * ROW + ROW / 2 };
    };
    const portIn = id => { const p = xy(id); return vertical ? { x: p.x + larg(id) / 2, y: p.y } : { x: p.x, y: p.y + (nodes[id].gate ? haut(id) / 2 : 20) }; };
    const paths = edges.map(e => {
      const a = portOut(e.a, e.port), b = portIn(e.b);
      const d = vertical ? `M${a.x} ${a.y} C${a.x} ${a.y + GY * .75} ${b.x} ${b.y - GY * .75} ${b.x} ${b.y - 3}`
        : `M${a.x} ${a.y} C${a.x + GX * .75} ${a.y} ${b.x - GX * .75} ${b.y} ${b.x - 3} ${b.y}`;
      return `<path class="lien lien--${e.type}" data-a="${e.a}" data-b="${e.b}" d="${d}" marker-end="url(#fl-${e.type})"/>`;
    }).join('');

    const nodeHTML = Object.values(nodes).map(n => {
      const p = xy(n.id); const style = `left:${p.x}px;top:${p.y}px;width:${larg(n.id)}px;height:${haut(n.id)}px`;
      if (n.gate) {
        const ch = D.chapitres[n.ch]; const k = D.couleurs[ch.couleur]; const ouvert = !eleve() || attribue(ch);
        const sc = D.scenes[n.ref];
        // Suivre le choix : l'autre chapitre s'ouvre dans la même vue, et la scène d'arrivée y est désignée (F03.1, 6 octobre 2026)
        return `<div class="raccord raccord--${n.gate}" data-id="${n.id}" style="${style};--edge:${k.edge};--band:${k.band}">
          <p class="raccord__sens">${ic(n.gate === 'in' ? 'i-entree' : 'i-sortie')}${n.gate === 'in' ? 'Arrive depuis' : 'Mène vers'}</p>
          <p class="raccord__chap">${ch.titre}</p>
          ${ouvert ? `<p class="raccord__scene"><span class="code">${n.ref}</span> ${sc.titre.split(' — ')[1] || ''}</p>` : '<p class="raccord__scene">Non ouvert pour toi</p>'}
          ${ouvert ? `<a class="raccord__cible" href="#/chapitre/${ch.id}/graphe?vise=${n.ref}" aria-label="Voir ${n.ref} dans les chemins de ${esc(ch.titre)}"></a>` : ''}
        </div>`;
      }
      const sc = n.sc; const e = etatDe(sc); const sel = st.selection.has(sc.ref); const f = correspond(sc);
      const internes = n.preds.filter(x => !nodes[x].gate).length;
      const ch = sorties(sc); const classe = !eleve() && !perso();
      // Au-dessus de la scène, en mots : son rôle dans le livre, et les chemins qui s'y rejoignent
      const role = choix() && sc.depart ? [ic('i-drapeau'), 'Départ du livre', 'Départ'] : choix() && sc.fin ? [ic('i-fin'), 'Fin de l’histoire', 'Fin'] : null;
      const rejoint = internes >= 2 ? `${internes} chemins se rejoignent` : '';
      const annot = role || rejoint ? `<span class="noeud__annot ${role ? 'noeud__annot--role' : ''}">${role ? role[0] + (rejoint ? role[2] + ' · ' : role[1]) : ic('i-convergence')}${rejoint}</span>` : '';
      const p2 = pec(sc, true);
      const liste = vertical ? (sansSuite(sc) ? '<p class="noeud__suite">Sans suite</p>' : '')
        : ch.length ? `<ul class="noeud__choix">${ch.map(({ lib, dest, x, cache, info }) => `<li ${cache ? 'class="noeud__cache"' : ''} title="${esc(cache ? info : lib)}"><span>${cache ? ic('i-cle') : ''}${esc(lib)}</span><span class="code">${!dest ? '?' : perdue(dest) ? 'supprimée' : x && eleve() && !attribue(D.chapitres[x]) ? '…' : dest}</span></li>`).join('')}</ul>`
          : sansSuite(sc) ? '<ul class="noeud__choix noeud__choix--vide"><li><span>Sans suite</span></li></ul>' : '';
      return `<div class="noeud ${sel ? 'est-choisie' : ''} ${f ? '' : 'est-attenue'} ${eleve() && sc.pec === MOI ? 'fiche--mienne' : ''} ${st.vise === sc.ref || ui.neuve === sc.ref ? 'est-visee' : ''} ${vertical && st.noeud === sc.ref ? 'est-touchee' : ''}" data-id="${sc.ref}" style="${style}">
        ${annot}
        <div class="noeud__tete">${selectionnable(sc) && !classe ? `<input type="checkbox" class="case" data-act="choisir" data-ref="${sc.ref}" ${sel ? 'checked' : ''} aria-label="Sélectionner ${sc.ref}">` : ''}<span class="fiche__ref">${sc.ref}</span>${tamponSc(sc, true)}</div>
        <p class="noeud__titre">${sc.titre}</p>
        ${p2 ? `<div class="noeud__pied">${p2}</div>` : ''}
        ${liste}
        <button class="fiche__cible" data-act="${vertical ? 'noeud' : 'scene'}" data-ref="${sc.ref}" aria-label="${vertical ? 'Voir les choix de' : 'Ouvrir'} ${sc.ref} — ${esc(sc.titre)}, ${D.etats[e].long}"></button>
      </div>`;
    }).join('');
    const sel = vertical && st.noeud && nodes[st.noeud] ? nodes[st.noeud].sc : null;
    const encart = vertical ? `<div class="encart-choix" aria-live="polite">${sel ? `<p class="encart-choix__tete"><span class="fiche__ref">${sel.ref}</span> ${sel.titre}</p>
        ${sorties(sel).length ? `<ul>${sorties(sel).map(({ lib, dest, x, cache }) => `<li><span class="${cache ? 'encart-choix__cache' : 'recit'}">${cache ? ic('i-cle') : ''}${esc(lib)}</span><span class="code">${!dest ? 'à décider' : perdue(dest) ? dest + ' supprimée' : x && eleve() && !attribue(D.chapitres[x]) ? D.chapitres[x].titre : (x ? D.chapitres[x].titre + ' · ' : '') + dest}</span></li>`).join('')}</ul>` : `<p class="vide">${sel.fin ? 'Fin de l’histoire.' : 'Pas de choix dans cette scène.'}</p>`}
        <a class="btn btn--petit btn--primaire" href="#/scene/${sel.ref}">Ouvrir la scène${ic('i-fleche')}</a>` : '<p class="vide">Touchez une scène pour lire ses choix.</p>'}</div>` : '';

    // Par défaut, une taille lisible, quitte à faire défiler ; « Tout voir » réduit le chapitre à la largeur de l'écran
    return `${vertical ? '' : `<div class="carte-outils"><div class="zoom" role="group" aria-label="Taille des chemins"><button class="btn btn--petit" data-act="zoom" data-v="-" aria-label="Réduire">−</button><button class="btn btn--petit zoom__val" data-act="zoom" data-v="ajuste" aria-pressed="${st.zoom === 'ajuste'}">Tout voir</button><button class="btn btn--petit" data-act="zoom" data-v="+" aria-label="Agrandir">+</button></div></div>`}
      <div class="carte ${vertical ? 'carte--verticale' : ''}" tabindex="0" role="group" aria-label="Chemins du chapitre ${esc(c.titre)}">
        <div class="carte__cadre"><div class="carte__plan" style="width:${W}px;height:${Ht}px" data-w="${W}" data-h="${Ht}">
          <svg class="carte__liens" width="${W}" height="${Ht}" aria-hidden="true">
            <defs>
              <marker id="fl-choix" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#4A5157"/></marker>
              <marker id="fl-raccord" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8A9097"/></marker>
            </defs>${paths}</svg>
          ${nodeHTML}
        </div></div>
      </div>
      <div class="legende">
        <span><svg width="34" height="10" aria-hidden="true"><path d="M1 5h28" stroke="#4A5157" stroke-width="1.8"/><path d="M26 1l7 4-7 4z" fill="#4A5157"/></svg>Choix dans le chapitre</span>
        <span><svg width="34" height="10" aria-hidden="true"><path d="M1 5h28" stroke="#8A9097" stroke-width="1.8" stroke-dasharray="4 4"/><path d="M26 1l7 4-7 4z" fill="#8A9097"/></svg>Choix vers un autre chapitre${eleve() ? ' (réservé à l’enseignante)' : ''}</span>
      </div>${encart}`;
  }
  const LISIBLE = .85;
  const echelle = () => { const plan = $('.carte__plan'); const carte = $('.carte'); const fit = Math.min(1, (carte.clientWidth - 2) / +plan.dataset.w);
    return carte.classList.contains('carte--verticale') || st.zoom === 'lisible' ? Math.max(fit, Math.min(1, LISIBLE)) : st.zoom === 'ajuste' ? fit : +st.zoom; };
  function ajusterCarte() {
    const plan = $('.carte__plan'); if (!plan) return;
    const carte = $('.carte'); const cadre = $('.carte__cadre');
    const w = +plan.dataset.w, h = +plan.dataset.h;
    const s = echelle();
    plan.style.transform = s !== 1 ? `scale(${s})` : ''; plan.style.transformOrigin = '0 0';
    cadre.style.width = (w * s) + 'px'; cadre.style.height = (h * s) + 'px';
  }

  /* ——— Rendu, routes, événements ————————————————————————————— */
  function lireHash() {
    const [chemin, q] = location.hash.replace(/^#\/?/, '').split('?');
    const parts = chemin.split('/').filter(Boolean);
    new URLSearchParams(q || '').forEach((v, k) => { if (k in st) st[k] = v; });
    MOI = st.moi; ui.avecParams = !!q; st.vise = new URLSearchParams(q || '').get('vise');
    if (window.App.pages[parts[0]]) {
      st.page = parts[0]; st.arg = parts[1] || null;
      if (st.page === 'scene' && D.scenes[st.arg]) st.chap = D.scenes[st.arg].chapitre;
    } else if (parts[0] === 'chapitre' && D.chapitres[parts[1]]) {
      const meme = st.chap === parts[1];
      if (!meme) { st.selection.clear(); st.filtre = 'toutes'; st.recherche = ''; st.noeud = null; }
      // Revenir d'une scène ramène à la vue quittée, Scènes ou Chemins (F03.1, 6 octobre 2026)
      st.page = 'chapitre'; st.chap = parts[1]; st.onglet = parts[2] === 'graphe' ? 'graphe' : parts[2] === 'scenes' ? 'scenes' : meme ? st.onglet : 'scenes';
    } else st.page = 'plan';
    if (st.mode === 'perso') st.vue = 'enseignant';
    if (!choix()) st.onglet = 'scenes';
    // Hors des horaires, l'élève ne lit pas non plus son chapitre (F06.4) : il revient à Mon travail, qui dit quand cela rouvre
    if (eleve() && st.horaire === 'ferme' && st.page === 'chapitre') st.page = 'plan';
  }
  function syncBarre() {
    ['mode', 'recit', 'img', 'sauv', 'horaire', 'concurrent', 'colle'].forEach(k => { const r = $(`input[name="${k}"][value="${st[k]}"]`); if (r) r.checked = true; });
    const rv = $(`input[name="vue"][value="${st.vue === 'eleve' ? 'eleve:' + st.moi : 'enseignant'}"]`); if (rv) rv.checked = true;
    $$('input[name="vue"]').forEach(r => { r.disabled = st.mode === 'perso' && r.value !== 'enseignant'; });
    const sim = $('#maquette-sim'); if (sim) sim.hidden = st.page !== 'scene';
  }
  function rendre(focus) {
    document.body.dataset.vue = eleve() ? 'eleve' : 'adulte';
    if (eleve()) document.body.style.setProperty('--fond-eleve', D.couleurs[D.chapitres.lisiere.couleur].tint);
    appbar(); syncBarre();
    const autre = window.App.pages[st.page];
    const c = st.page === 'chapitre' || st.page === 'scene' ? D.chapitres[st.chap] : null;
    document.title = window.App.titres[st.page]?.() || (c ? `${c.titre} — ${H.titre}` : `${H.titre} — Parties et chapitres`);
    document.body.dataset.page = st.page;
    $('#vue').innerHTML = autre ? autre() : st.page === 'chapitre' ? pageChapitre() : pagePlan();
    document.body.classList.toggle('sur-chapitre', !!c);
    if (c) document.body.style.setProperty('--fond-chap', D.couleurs[c.couleur].tint); else document.body.style.removeProperty('--fond-chap');
    window.App.apres?.(st.page);
    if (st.fiche && st.page === 'plan') ouvrirFiche(st.fiche, false); else if (ui.panneau && !eleve()) ouvrirPanneau(false); else fermerFiche(false);
    ajusterCarte();
    const visee = $('.noeud.est-visee'); if (visee && $('.carte')) { const k = $('.carte'); const r = visee.getBoundingClientRect(), rk = k.getBoundingClientRect(); if (r.right > rk.right || r.left < rk.left) k.scrollLeft += r.left - rk.left - 40; }
    if (focus) $('#vue').focus({ preventScroll: true });
  }
  function ouvrirFiche(id, focus = true) {
    st.fiche = id; const p = $('#panneau');
    p.innerHTML = fiche(id); p.hidden = false; $('#voile').hidden = false;
    requestAnimationFrame(() => { p.classList.add('est-ouvert'); $('#voile').classList.add('est-ouvert'); });
    $$('.cahier').forEach(el => el.removeAttribute('aria-current'));
    const btn = $(`.cahier [data-act="fiche"][data-id="${id}"]`); if (btn) { btn.closest('.cahier').setAttribute('aria-current', 'true'); btn.setAttribute('aria-expanded', 'true'); }
    if (focus) setTimeout(() => $('.panneau__fermer', p).focus(), 60);
  }
  function fermerFiche(retour = true) {
    const id = st.fiche; st.fiche = null; const p = $('#panneau');
    p.classList.remove('est-ouvert'); $('#voile').classList.remove('est-ouvert');
    setTimeout(() => { if (!st.fiche && !ui.panneau) { p.hidden = true; $('#voile').hidden = true; } }, 220);
    $$('.cahier').forEach(el => el.removeAttribute('aria-current'));
    $$('.cahier [data-act="fiche"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (retour && id) { const b = $(`.cahier [data-act="fiche"][data-id="${id}"]`); if (b) b.focus(); }
  }
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.remove('a-action'); t.classList.add('est-visible'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('est-visible'), 4200); }
  // Après une suppression, le message propose « Annuler » : la corbeille rend ce qu'elle vient de recevoir
  function toastAnnuler(msg) { const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span><button class="toast__act" data-act="corbeille-annuler">Annuler</button>`; t.classList.add('est-visible', 'a-action'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('est-visible', 'a-action'), 8000); }
  function majHash() {
    const q = new URLSearchParams(); if (st.vue !== 'enseignant') q.set('vue', st.vue); if (st.vue === 'eleve' && st.moi !== 'alice') q.set('moi', st.moi); if (st.mode !== 'classe') q.set('mode', st.mode); if (st.recit !== 'choix') q.set('recit', st.recit); if (st.img !== 'choisies') q.set('img', st.img);
    const defs = { sauv: 'ok', horaire: 'ouvert', concurrent: 'non' }; Object.keys(defs).forEach(k => { if (st[k] !== defs[k]) q.set(k, st[k]); });
    const base = window.App.pages[st.page] ? `#/${st.page}${st.arg ? '/' + st.arg : ''}` : st.page === 'chapitre' ? `#/chapitre/${st.chap}/${st.onglet}` : '#/plan';
    const h = base + (q.toString() ? '?' + q : ''); if (location.hash !== h) history.replaceState(null, '', h);
  }

  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]'); if (!el) { if ((st.fiche || ui.panneau) && !ev.target.closest('#panneau, #dialogue')) { ui.panneau = null; fermerFiche(); } return; }
    const a = el.dataset.act;
    if (window.App.actions[a]) { window.App.actions[a](el, ev); return; }
    if (a === 'fiche') { st.fiche === el.dataset.id ? fermerFiche() : ouvrirFiche(el.dataset.id); }
    else if (a === 'fermer') { ui.panneau = null; fermerFiche(); }
    else if (a === 'ouvrir') { st.fiche = null; }
    else if (a === 'toast') { ev.preventDefault(); toast(el.dataset.msg); }
    else if (a === 'surligne') {
      st.surligne = st.surligne === el.dataset.cle ? null : el.dataset.cle; st.surligneIds = el.dataset.ids.split(',');
      rendre(); const first = $('.cahier.est-surligne'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    else if (a === 'filtre') { st.filtre = el.dataset.v; rendre(); }
    else if (a === 'scene') { location.hash = `#/scene/${el.dataset.ref}`; }
    else if (a === 'zoom') {
      const cur = echelle();
      st.zoom = el.dataset.v === 'ajuste' ? (st.zoom === 'ajuste' ? 'lisible' : 'ajuste') : Math.max(.5, Math.min(1.4, Math.round((cur + (el.dataset.v === '+' ? .1 : -.1)) * 10) / 10));
      rendre();
    }
    // Sur téléphone, la scène touchée garde sa marque et la page ne bouge pas : ses choix se lisent dans l'encart, collé en bas
    else if (a === 'noeud') { const y = window.scrollY; st.noeud = el.dataset.ref; rendre(); window.scrollTo(0, y); }
    else if (a === 'vider') { st.selection.clear(); rendre(); }
    else if (a === 'prendre') {
      const refs = [...st.selection].filter(r => el.dataset.mode === 'tout' || !D.scenes[r].pec || D.scenes[r].pec === MOI);
      const repris = refs.filter(r => D.scenes[r].pec && D.scenes[r].pec !== MOI).map(r => `${r} (${D.eleves[D.scenes[r].pec].prenom})`);
      refs.forEach(r => { D.scenes[r].pec = MOI; });
      st.selection.clear(); rendre();
      toast(`Tu t’occupes maintenant de ${refs.join(', ')}.${repris.length ? ` À la place de : ${repris.join(', ')}. Les textes ne changent pas.` : ''}`);
    }
  });
  document.addEventListener('change', ev => {
    const el = ev.target;
    if (el.matches('.maquette input[type="radio"]')) {
      if (el.name === 'vue') { const [v, m] = el.value.split(':'); st.vue = v; if (m) { st.moi = m; MOI = m; } } else st[el.name] = el.value;
      if (!['img', 'sauv', 'horaire', 'concurrent', 'colle'].includes(el.name)) { st.selection.clear(); st.filtre = 'toutes'; st.surligne = null; }
      if (st.mode === 'perso') st.vue = 'enseignant'; if (!choix()) st.onglet = 'scenes';
      if (eleve() && ['chapitre', 'scene'].includes(st.page) && !attribue(D.chapitres[st.chap])) { st.page = 'chapitre'; st.chap = 'lisiere'; }
      if (eleve() && ['suivi', 'fiches', 'preparation', 'atelier', 'livre', 'projets', 'classes', 'nouveau'].includes(st.page)) { st.page = 'plan'; st.arg = null; }
      window.App.reinit?.(el.name);
      majHash(); rendre(); return;
    }
    if (el.dataset.act === 'choisir') { el.checked ? st.selection.add(el.dataset.ref) : st.selection.delete(el.dataset.ref); const y = window.scrollY; rendre(); window.scrollTo(0, y); const again = $(`.case[data-ref="${el.dataset.ref}"]`); if (again) again.focus({ preventScroll: true }); }
    if (el.dataset.act === 'filtre-select') { st.filtre = el.value || 'toutes'; rendre(); }
    if (window.App.changes[el.dataset.act]) window.App.changes[el.dataset.act](el, ev);
  });
  window.App.saisies = Object.assign(window.App.saisies || {}, {
    recherche: el => { st.recherche = el.value; const pos = el.selectionStart; rendre(); const i = $('input[data-saisie="recherche"]'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } },
    'plan-cherche': el => { st.pcherche = el.value; const pos = el.selectionStart; const y = window.scrollY; rendre(); window.scrollTo(0, y); const i = $('input[data-saisie="plan-cherche"]'); if (i) { i.focus({ preventScroll: true }); i.setSelectionRange(pos, pos); } }
  });
  document.addEventListener('input', ev => { const f = window.App.saisies?.[ev.target.dataset.saisie]; if (f) f(ev.target, ev); });

  Object.assign(window.App, { appbar, D, H, st, $, $$, esc, image, tampon, tamponSc, gommette, pec, etatDe, choixDe, eleve, perso, choix, attribue, varsCouleur, toast, rendre, majHash, compte, aPreparer, moi: () => MOI });

  /* ——— Commandes de l'organisation du récit (F03.1 et F03.2, 6 octobre 2026) ——— */
  const garderPlace = f => { const y = window.scrollY; f(); window.scrollTo(0, y); };
  const montrer = (ids, defiler = true) => {
    ui.montre = ids; rendre();
    const el = $('.cahier.est-montree, .fiche.est-montree'); if (el && defiler) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    clearTimeout(montrer.t); montrer.t = setTimeout(() => { ui.montre = []; ui.neuve = null; $$('.est-montree').forEach(x => x.classList.remove('est-montree')); }, 2600);
  };
  const libre = (prefixe, dans) => { let n = 1; while (dans(prefixe + n)) n++; return prefixe + n; };
  function ajouterChapitre(p) {
    const id = libre('chapitre', x => D.chapitres[x]); const prises = p.chapitres.map(x => x.couleur);
    const couleur = Object.keys(D.couleurs).find(k => !prises.includes(k)) || Object.keys(D.couleurs)[p.chapitres.length % 8];
    const c = { id, titre: 'Nouveau chapitre', couleur, image: null, eleves: [], scenes: [], partie: p };
    p.chapitres.push(c); D.chapitres[id] = c; reindexer(); return c;
  }
  function ajouterScene(c) {
    const max = Math.max(...Object.keys(D.scenes).map(r => +r.slice(1)));
    const sc = { ref: 'S' + String(max + 1).padStart(3, '0'), titre: 'Nouvelle scène', etat: 'cours', vide: true, pec: null, choix: [], consigne: false, chapitre: c.id };
    c.scenes.push(sc); D.scenes[sc.ref] = sc; return sc;
  }
  Object.assign(window.App.actions, {
    'plan-commencer': () => { ui.aideVue = true; ui.aide = false; rendre(); window.scrollTo(0, 0); },
    'plan-aide': () => { ui.aide = true; rendre(); $('#aide-t')?.focus({ preventScroll: true }); window.scrollTo(0, 0); },
    // Un manque de « À compléter » mène à la première carte concernée et la désigne un instant : rien n'est filtré, aucun état ne reste
    montrer: el => montrer(el.dataset.ids.split(',')),
    'partie-ajouter': () => {
      const p = { id: libre('partie', x => H.parties.some(y => y.id === x)), titre: 'Nouvelle partie', image: null, chapitres: [] };
      H.parties.push(p); const c = ajouterChapitre(p);
      montrer([c.id]); panneau('partie', p.id, true); toast('Partie ajoutée, avec un premier chapitre. Donnez-lui un titre.');
    },
    'chap-ajouter': el => { const c = ajouterChapitre(H.parties.find(p => p.id === el.dataset.id)); montrer([c.id]); panneau('reglages', c.id, true); toast('Chapitre ajouté. Donnez-lui un titre.'); },
    'scene-ajouter': el => {
      const c = D.chapitres[el.dataset.id]; const sc = ajouterScene(c); ui.neuve = sc.ref; st.recherche = '';
      montrer([], false); const carte = $(`.fiche[data-ref="${sc.ref}"], .noeud[data-id="${sc.ref}"]`); if (carte) carte.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(`${sc.ref} est ajoutée à la fin du chapitre. Ouvrez-la pour lui donner un titre.`);
    },
    'chap-reglages': el => panneau('reglages', el.dataset.id),
    'partie-reglages': el => panneau('partie', el.dataset.id),
    'chap-attribuer': el => panneau('attribuer', el.dataset.id),
    corbeille: () => panneau('corbeille'),
    'chap-couleur': el => { D.chapitres[el.dataset.id].couleur = el.dataset.c; garderPlace(rendre); },
    'chap-exclure': el => {
      const c = D.chapitres[el.dataset.id]; const tout = c.scenes.every(hors);
      if (tout) { c.scenes.forEach(s => window.App.actions['livre-inclure']({ dataset: { ref: s.ref } })); toast(`« ${c.titre} » est de nouveau dans le livre.`); return; }
      dialogue(`Exclure « ${esc(c.titre)} » du livre ?`, `<ul class="dialogue__faits"><li>Ses ${c.scenes.length} scène${pl(c.scenes.length)} ${c.scenes.length > 1 ? 'seront' : 'sera'} hors du livre. Elles restent dans le projet.</li>${perso() ? '' : '<li>Les élèves continuent d’écrire : rien ne leur est affiché.</li>'}</ul>`, `<button class="btn btn--primaire" data-act="exclure-oui" data-id="${c.id}">Exclure du livre</button>`);
    },
    'exclure-oui': el => { const c = D.chapitres[el.dataset.id]; fermerDialogue(); c.scenes.forEach(s => window.App.actions['livre-exclure']({ dataset: { ref: s.ref } })); toast(`« ${c.titre} » est hors du livre. Pour l’y remettre : le menu du chapitre.`); },
    'chap-supprimer': el => demanderSuppression('chapitre', el.dataset.id),
    'partie-supprimer': el => demanderSuppression('partie', el.dataset.id),
    'sc-supprimer': el => demanderSuppression('scene', el.dataset.ref),
    'supprimer-oui': el => supprimer(el.dataset.type, el.dataset.id),
    'dialogue-fermer': () => fermerDialogue(),
    'corbeille-annuler': () => { const nom = restaurer(0); $('#toast').classList.remove('est-visible', 'a-action'); garderPlace(rendre); if (nom) toast(`${nom} est de retour.`); },
    'corbeille-restaurer': el => { const nom = restaurer(+el.dataset.i); garderPlace(rendre); if (nom) toast(`${nom} est de retour, à sa place.`); },
    'sc-monter': el => { const sc = D.scenes[el.dataset.ref]; const l = D.chapitres[sc.chapitre].scenes; const i = l.indexOf(sc); if (i > 0) { l.splice(i, 1); l.splice(i - 1, 0, sc); garderPlace(rendre); } },
    'sc-descendre': el => { const sc = D.scenes[el.dataset.ref]; const l = D.chapitres[sc.chapitre].scenes; const i = l.indexOf(sc); if (i < l.length - 1) { l.splice(i, 1); l.splice(i + 1, 0, sc); garderPlace(rendre); } },
    // Un seul départ : le remplacer nomme celui qu'il remplace (F03-AC03)
    'sc-depart': el => {
      const sc = D.scenes[el.dataset.ref]; const avant = Object.values(D.scenes).find(s => s.depart && !s.supprime);
      if (!avant) { sc.depart = true; H.depart = sc.ref; garderPlace(rendre); toast(`${nomSceneTexte(sc)} est le départ du livre.`); return; }
      dialogue('Changer le départ du livre ?', `<ul class="dialogue__faits"><li>Nouveau départ : ${nomScene(sc)}.</li><li>Départ actuel : ${nomScene(avant)}. Il ne le sera plus : un livre n’a qu’un départ.</li></ul>`, `<button class="btn btn--primaire" data-act="depart-oui" data-ref="${sc.ref}">Changer le départ</button>`);
    },
    'depart-oui': el => { Object.values(D.scenes).forEach(s => { s.depart = false; }); const sc = D.scenes[el.dataset.ref]; sc.depart = true; H.depart = sc.ref; fermerDialogue(); garderPlace(rendre); toast(`${nomSceneTexte(sc)} est le départ du livre.`); },
    'sc-fin': el => { const sc = D.scenes[el.dataset.ref]; sc.fin = !sc.fin; garderPlace(rendre); toast(sc.fin ? `${nomSceneTexte(sc)} est une fin de l’histoire.` : `${nomSceneTexte(sc)} n’est plus une fin.`); },
    'recherche-effacer': () => { st.recherche = ''; rendre(); $('input[data-saisie="recherche"]')?.focus(); },
    'plan-cherche-effacer': () => { st.pcherche = ''; rendre(); $('input[data-saisie="plan-cherche"]')?.focus(); }
  });
  Object.assign(window.App.changes, {
    'plan-aide-jamais': el => { ui.aideJamais = el.checked; },
    'attr-eleve': el => {
      const c = D.chapitres[el.dataset.id]; const e = el.dataset.e;
      if (el.checked) c.eleves.push([e, 'propositions']); else c.eleves = c.eleves.filter(([x]) => x !== e);
      garderPlace(rendre);
    },
    'attr-profil': el => { const c = D.chapitres[el.dataset.id]; const l = c.eleves.find(([x]) => x === el.dataset.e); if (l) l[1] = el.checked ? 'organisation' : 'propositions'; }
  });
  // Titres et résumé se corrigent dans le panneau, et la page suit sans se redessiner
  Object.assign(window.App.saisies, {
    'chap-titre': el => { const c = D.chapitres[el.dataset.id]; c.titre = el.value || 'Sans titre'; $$(`[data-titre="${c.id}"]`).forEach(x => { x.textContent = c.titre; }); },
    'chap-resume': el => { D.chapitres[el.dataset.id].resume = el.value; },
    'partie-titre': el => { const p = H.parties.find(x => x.id === el.dataset.id); p.titre = el.value || 'Sans titre'; const h = $(`#p-${p.id}`); if (h) h.textContent = p.titre; const s = $('#panneau .panneau__tete p'); if (s) s.textContent = p.titre; }
  });
  // Adresses à drapeaux, pour les captures (décrites en tête de fichier)
  function drapeaux() {
    if (ui.drapeaux || eleve()) return; ui.drapeaux = true;
    if (st.pcorbeille) st.pcorbeille.split(',').forEach(id => { if (D.chapitres[id] && !D.chapitres[id].supprime) { const c = D.chapitres[id]; const p = c.partie; const i = p.chapitres.indexOf(c); p.chapitres.splice(i, 1); c.supprime = true; ui.corbeille.unshift({ type: 'chapitre', c, p, i }); reindexer(); } });
    if (st.phors) st.phors.split(',').forEach(id => (D.chapitres[id]?.scenes || []).forEach(s => window.App.livre?.ui.mods.exclure.add(s.ref)));
    if (st.pneuve && D.chapitres[st.pneuve]) { ui.neuve = ajouterScene(D.chapitres[st.pneuve]).ref; setTimeout(() => toast(`${ui.neuve} est ajoutée à la fin du chapitre. Ouvrez-la pour lui donner un titre.`), 200); }
    if (st.ppanneau) { const [type, id] = st.ppanneau.split(':'); ui.panneau = { type, id }; }
    rendre();
    if (st.pdialogue) { const [, id] = st.pdialogue.split(':'); demanderSuppression(D.chapitres[id] ? 'chapitre' : 'scene', id); }
    if (st.pmenu) setTimeout(() => { const m = $(`details[data-menu="${st.pmenu}"]`); if (m) { m.open = true; m.scrollIntoView({ block: 'center' }); } }, 250);
  }
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if ($('#dialogue') && !$('#dialogue').hidden) fermerDialogue(); else if (st.fiche || ui.panneau) { ui.panneau = null; fermerFiche(); }
  });
  // Surbrillance des chemins au survol ou au focus d'un nœud
  const eclaire = id => { $$('.lien, .lien__lib').forEach(l => l.classList.toggle('est-eclaire', !!id && (l.dataset.a === id || l.dataset.b === id))); $('.carte__plan')?.classList.toggle('a-eclairage', !!id); };
  document.addEventListener('pointerover', ev => { const n = ev.target.closest('.noeud, .raccord'); if (n) eclaire(n.dataset.id); });
  document.addEventListener('pointerout', ev => { if (ev.target.closest('.noeud, .raccord') && !ev.relatedTarget?.closest?.('.noeud, .raccord')) eclaire(null); });
  document.addEventListener('focusin', ev => { const n = ev.target.closest('.noeud, .raccord'); eclaire(n ? n.dataset.id : null); });

  let largeur = window.innerWidth;
  window.addEventListener('resize', () => { const v = window.innerWidth <= 720; if ((largeur <= 720) !== v && st.onglet === 'graphe') rendre(); else ajusterCarte(); largeur = window.innerWidth; });
  window.addEventListener('hashchange', () => { const cle = () => [st.page, st.chap, st.onglet, st.arg, st.vue, st.moi].join('|'); const avant = cle(); const pageAvant = st.page; if (pageAvant === 'plan') ui.yPlan = window.scrollY; lireHash(); const change = cle() !== avant; if (change) { window.App.reinit?.('page'); ui.panneau = null; fermerDialogue(); } rendre(change); if (change && st.page !== 'plan') window.scrollTo(0, 0); else if (change && ['chapitre', 'scene'].includes(pageAvant) && ui.yPlan) window.scrollTo(0, ui.yPlan); });
  document.addEventListener('DOMContentLoaded', () => { lireHash(); rendre(); if (st.pcorbeille || st.phors || st.pneuve || st.ppanneau || st.pdialogue || st.pmenu) setTimeout(drapeaux, 0); });
})();
