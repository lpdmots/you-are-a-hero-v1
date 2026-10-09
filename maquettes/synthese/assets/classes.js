/* Maquette « Mes classes » et « Nouveau projet » (6 octobre 2026) — interactions simulées, sans persistance.
   Règles : F01 (créer un projet), F01.1 (classe, année, élèves), F06.4 (informations de la classe, codes, horaires).
   Code neuf dans ce fichier et dans classes.css : classes CSS préfixées .cl- et .np-, drapeaux d'adresse préfixés cl et np.
   Adresses à drapeaux, pour les captures :
     #/classes (écran d'aide) · ?claide=0 (sans l'aide) · ?cletat=vide (aucune classe) · ?cletat=premiere (première classe, sans élève)
     ?cletat=rentree (classe de la rentrée, l'ancienne encore en cours) · ?clpanneau=nouvelle (nouvelle classe)
     #/classes/cm ?clcodes=1 (codes affichés) · ?clpanneau=eleve:bilal (code oublié) · &clchange=1 (code en cours de changement)
     ?clpanneau=horaires · ?cldialogue=retirer:bilal · ?cldialogue=terminer · ?cldialogue=mdp · ?clmenu=1 · #/classes/cm25 (année passée)
     #/classes/cm/inscrire ?cllot=1|2|3 (étape) · &clregle=1 (points réglés)
     #/classes/cm/imprimer ?climpr=affiche · ?climpr=bilal (une seule étiquette) · ?clmaison=1
     #/nouveau ?npetape=1|2|3 · ?npqui=classe|moi · ?nprecit=choix|classique · ?nptitre=… · ?npclasse=plus-tard
     #/projets?npvide=1 (aucun projet) · #/preparation?npsans=1 (projet sans classe) · &nppanneau=1 (choisir la classe) */
(function () {
  const A = window.App; const { D, H, st, $, $$, esc, toast, perso } = A; const ic = window.ic;
  const rendre = () => A.rendre();
  const pl = n => (n > 1 ? 's' : '');
  const ADRESSE = 'youareahero.example/classe';
  const PAL = ['#C43E28', '#2466AD', '#2B7A40', '#9A6200', '#7447B2', '#B0386F', '#0E736F', '#586620', '#A34A1A', '#3F4EA8'];
  // Le nom est facultatif (F01.1) : trois élèves n'en ont pas
  const NOMS = { alice: 'Martin', bilal: 'Haddad', chloe: 'Bernard', dylan: 'Petit', emma: 'Dubois', farah: 'Benali', gabin: 'Roux', hugo: 'Lambert', ines: 'Garcia', jade: 'Moreau', kenza: 'Cherif', leo: 'Fournier', lina: 'Robin', malo: 'Le Gall', nahel: 'Diallo', noe: '', oceane: 'Girard', paul: '', rayan: 'Mansouri', sacha: '', tom: 'Leroy', yasmine: 'Belkacem', zoe: 'Henry', adam: 'Morel', maelys: 'Colin' };
  const PARTIS = [['Anaïs', 'Caron'], ['Baptiste', 'Roy'], ['Clara', 'Noël'], ['Enzo', 'Marchand'], ['Lucie', 'Barbier'], ['Mehdi', 'Saïdi'], ['Nina', 'Perrin'], ['Théo', 'Blanc']];
  const hash = s => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const codeDe = id => String(1000 + (hash(id + '/code') % 9000));
  const cle = t => String(t).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const maj = t => t.charAt(0).toUpperCase() + t.slice(1);

  const cl = {
    etat: null, classes: [], aide: false, aideVue: false, aideJamais: false, avecParams: false, codes: false, mdp: false,
    panneau: null, changeCode: null, attente: null, prop: null, lot: null, retire: null,
    impr: { quoi: 'etiquettes', qui: '', maison: false },
    neuve: { nom: '', annee: '2026-2027' }, np: null, sansClasse: false, projetsVides: false, choixClasse: ''
  };

  /* ——— Données : une classe en cours, une classe d'une année passée ——————————— */
  function init(etat) {
    cl.etat = etat; cl.lot = null; cl.prop = null; cl.panneau = null;
    const tous = Object.keys(D.eleves).map(id => ({ id, prenom: D.eleves[id].prenom, nom: NOMS[id] || '', couleur: D.eleves[id].couleur, code: codeDe(id) }));
    const partis = PARTIS.map(([prenom, nom], i) => ({ id: 'parti' + i, prenom, nom, couleur: PAL[(i * 3 + 2) % 10], code: codeDe('parti' + i) }));
    const cm = { id: 'cm', nom: 'CM1-CM2', annee: '2026-2027', enCours: true, ident: 'cm-laurent', mdp: 'lanterne-renard-47',
      horaires: [{ jours: [1, 2, 4, 5], de: '8 h 30', a: '16 h 30' }], eleves: tous,
      projets: [{ titre: H.titre, type: 'Récit à choix', href: '#/plan' }, { titre: 'La cabane du bout du monde', type: 'Récit classique' }] };
    const cm25 = { id: 'cm25', nom: 'CM1-CM2', annee: '2025-2026', enCours: false, finLe: '4 juillet 2026', ident: 'cm-laurent-25', mdp: 'phare-hibou-23',
      horaires: [], eleves: [...tous.slice(0, 15), tous.find(e => e.id === 'adam'), ...partis], projets: [{ titre: 'Le phare des sept vents', type: 'Récit à choix' }] };
    const neuve = { ...cm, eleves: [], horaires: [], projets: [] };
    if (etat === 'vide') cl.classes = [];
    else if (etat === 'premiere') cl.classes = [neuve];
    else if (etat === 'rentree') { cl.classes = [neuve, { ...cm25, enCours: true, finLe: null }]; cl.prop = 'cm25'; }
    else cl.classes = [cm, cm25];
  }
  init('normal');

  const classe = id => cl.classes.find(c => c.id === id);
  const enCours = () => cl.classes.filter(c => c.enCours);
  const tri = l => [...l].sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  // Les élèves ne voient que des prénoms ; l'initiale du nom s'ajoute quand deux élèves de la classe portent le même (F01.1)
  const memePrenom = (e, l) => l.some(x => x !== e && x.id !== e.id && cle(x.prenom) === cle(e.prenom));
  const affiche = (e, l) => (memePrenom(e, l) && e.nom.trim() ? `${e.prenom} ${e.nom.trim()[0].toUpperCase()}.` : e.prenom);
  const gom = (e, t = '') => `<span class="gommette ${t}" style="--g:${e.couleur}" aria-hidden="true">${esc(e.prenom.slice(0, 1).toUpperCase() + e.prenom.slice(1, 2).toLowerCase())}</span>`;
  const JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
  const plageTexte = p => `${maj(p.jours.map(j => JOURS[j - 1]).join(', '))} · ${p.de} – ${p.a}`;
  const chiffres = code => String(code).split('').join(' ');
  const route = () => { const p = location.hash.replace(/^#\/?/, '').split('?')[0].split('/'); return { page: p[0], id: p[1] || null, sous: p[2] || null }; };
  const npInit = () => ({ etape: 1, qui: null, recit: null, titre: '', classe: null });

  /* ——— Drapeaux d'adresse : lus à chaque changement d'adresse, avant le rendu ——— */
  let adresseLue = null;
  function synchro() {
    if (location.hash === adresseLue) return; adresseLue = location.hash;
    const q = new URLSearchParams(location.hash.split('?')[1] || ''); const g = k => q.get(k); const r = route();
    cl.avecParams = [...q.keys()].length > 0;
    if (g('cletat') && g('cletat') !== cl.etat) init(g('cletat'));
    if (g('claide') === '1') cl.aide = true;
    if (g('claide') === '0') { cl.aide = false; cl.aideVue = true; }
    if (g('clcodes')) cl.codes = true;
    if (g('clmdp')) cl.mdp = true;
    if (g('npvide')) cl.projetsVides = true;
    if (g('npsans')) cl.sansClasse = true;
    if (g('nppanneau')) cl.panneau = { type: 'projet' };
    const c = r.page === 'classes' && r.id ? classe(r.id) : null;
    if (g('clpanneau')) { const [type, id] = g('clpanneau').split(':'); cl.panneau = { type, id, classe: c ? c.id : null }; cl.changeCode = g('clchange') && c ? codeDe(id + '/neuf') : null; }
    if (g('cldialogue')) { const [type, id] = g('cldialogue').split(':'); cl.attente = () => ({ retirer: () => demanderRetrait(c, id), terminer: () => demanderFin(c), mdp: () => demanderMdp(c) }[type] || (() => {}))(); }
    if (g('clmenu')) cl.attente = () => { const m = $('details[data-menu="cl-classe"]'); if (m) m.open = true; };
    if (c && g('cllot')) {
      cl.lot = null; const L = lot(c); const n = +g('cllot'); const connus = profilsConnus(c);
      connus.slice(0, 15).forEach(e => L.connus.add(e.id));
      if (n >= 2) L.texte = connus.length ? EXEMPLE : D25();
      if (n >= 3) { construire(c, L); if (g('clregle')) L.lignes.forEach(l => { if (l.meme) { l.type = 'connu'; l.e = l.meme; l.meme = null; } else if (l.type === 'neuf' && cle(l.e.prenom) === 'leo') l.e.nom = 'Marchand'; }); }
      L.etape = connus.length ? Math.min(3, Math.max(1, n)) : Math.min(3, Math.max(2, n));
    }
    if (g('climpr')) { const v = g('climpr'); cl.impr.quoi = v === 'affiche' ? 'affiche' : 'etiquettes'; cl.impr.qui = c && c.eleves.some(e => e.id === v) ? v : ''; }
    if (g('clmaison')) cl.impr.maison = true;
    if (r.page === 'nouveau' && ['npetape', 'npqui', 'nprecit', 'nptitre', 'npclasse'].some(k => g(k) !== null)) {
      const n = cl.np = cl.np || npInit();
      if (g('npqui')) n.qui = g('npqui') === 'moi' ? 'moi' : 'classe';
      if (g('nprecit')) n.recit = g('nprecit') === 'classique' ? 'classique' : 'choix';
      if (g('nptitre') !== null) n.titre = g('nptitre');
      if (g('npclasse') !== null) n.classe = classe(g('npclasse')) ? g('npclasse') : '';
      if (g('npetape')) n.etape = Math.min(3, Math.max(1, +g('npetape') || 1));
    }
  }

  /* ——— Panneau et dialogue de ces pages : les mêmes formes que ceux du plan, dans leurs propres éléments ——— */
  function monPanneau() {
    let p = $('#cl-panneau');
    if (!p) { document.body.insertAdjacentHTML('beforeend', '<div class="voile" id="cl-voile" hidden></div><aside class="panneau" id="cl-panneau" aria-labelledby="cl-panneau-titre" hidden></aside>'); p = $('#cl-panneau'); }
    return p;
  }
  function contenuPanneau() {
    const x = cl.panneau; if (!x) return '';
    if (x.type === 'nouvelle') return panneauNouvelle();
    if (x.type === 'projet') return panneauClasseProjet();
    const c = classe(x.classe); if (!c) return '';
    if (x.type === 'horaires') return panneauHoraires(c);
    const e = c.eleves.find(y => y.id === x.id); return e ? panneauEleve(c, e) : '';
  }
  function ouvrirPanneau(focus = true) {
    const p = monPanneau(); const html = contenuPanneau(); if (!html) { fermerPanneau(); return; }
    const avant = $('.panneau__corps', p); const y = avant ? avant.scrollTop : 0;
    p.innerHTML = html; p.hidden = false; $('#cl-voile').hidden = false;
    requestAnimationFrame(() => { p.classList.add('est-ouvert'); $('#cl-voile').classList.add('est-ouvert'); });
    const corps = $('.panneau__corps', p); if (corps) corps.scrollTop = y;
    if (focus) setTimeout(() => ($('[data-focus]', p) || $('.panneau__fermer', p))?.focus(), 80);
  }
  function fermerPanneau() {
    const x = cl.panneau; cl.panneau = null; cl.changeCode = null; const p = $('#cl-panneau'); if (!p) return;
    p.classList.remove('est-ouvert'); $('#cl-voile').classList.remove('est-ouvert');
    setTimeout(() => { if (!cl.panneau) { p.hidden = true; $('#cl-voile').hidden = true; } }, 220);
    $$('.cl-eleve[aria-current]').forEach(b => b.removeAttribute('aria-current'));
    if (x && x.type === 'eleve') $(`.cl-eleve[data-id="${x.id}"]`)?.focus();
  }
  const tetePanneau = (titre, sous) => `<div class="panneau__tete panneau__tete--court"><button class="btn btn--discret panneau__fermer" data-act="cl-fermer" aria-label="Fermer">${ic('i-fermer')}</button>
      <h2 id="cl-panneau-titre">${titre}</h2>${sous ? `<p>${esc(sous)}</p>` : ''}</div>`;
  const piedFerme = () => `<div class="panneau__pied"><p class="cl-enr" id="cl-enr" role="status" ${cl.enr ? '' : 'hidden'}>${ic('i-coche')}Enregistré</p><button class="btn btn--grand" data-act="cl-fermer">Fermer</button></div>`;
  const noteEnr = () => { cl.enr = true; const p = $('#cl-enr'); if (p) p.hidden = false; };
  const montrer = x => { cl.panneau = x; cl.enr = false; cl.changeCode = null; ouvrirPanneau(); };
  function dialogue(titre, corps, boutons) {
    let d = $('#cl-dialogue'); if (!d) { document.body.insertAdjacentHTML('beforeend', '<div class="dialogue-voile" id="cl-dialogue" hidden></div>'); d = $('#cl-dialogue'); }
    d.innerHTML = `<div class="dialogue" role="alertdialog" aria-modal="true" aria-labelledby="cl-dialogue-t"><h2 id="cl-dialogue-t" tabindex="-1">${titre}</h2>${corps}<p class="dialogue__cmd">${boutons}<button class="btn" data-act="cl-dialogue-fermer">Annuler</button></p></div>`;
    $$('details.menu-scene[open]').forEach(m => { m.open = false; });
    d.hidden = false; setTimeout(() => $('#cl-dialogue-t')?.focus(), 30);
  }
  const fermerDialogue = () => { const d = $('#cl-dialogue'); if (d) d.hidden = true; };
  function messageAnnuler(msg, act) {
    const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span><button class="toast__act" data-act="${act}">Annuler</button>`;
    t.classList.add('est-visible', 'a-action'); clearTimeout(messageAnnuler.t); messageAnnuler.t = setTimeout(() => t.classList.remove('est-visible', 'a-action'), 8000);
  }
  const aller = h => { if (location.hash !== h) location.hash = h; else rendre(); };

  /* ——— Mes classes : écran d'aide à l'ouverture, comme au Suivi ————————————— */
  const aideClasses = () => `<section class="aide-etape" aria-labelledby="aide-t">
      <h2 id="aide-t" tabindex="-1">Mes classes</h2>
      <div class="aide-etape__q">
        <details open><summary>Que fait-on ici ?</summary><p>On inscrit ses élèves et on leur donne de quoi se connecter.</p>
          <ul class="aide-etape__taches"><li>Inscrire les élèves de la classe</li><li>Imprimer leurs étiquettes, avec leur code</li><li>Régler les horaires, si on le souhaite</li></ul></details>
        <details><summary>Comment un élève se connecte-t-il ?</summary><p>Sur l’ordinateur, on ouvre la classe avec son identifiant et son mot de passe. L’élève clique sur son prénom, puis tape son code à quatre chiffres.</p></details>
        <details><summary>Un élève a oublié son code ?</summary><p>Ouvrez la classe et cliquez sur son prénom : son code s’affiche. Vous pouvez le changer et réimprimer son étiquette.</p></details>
        <details><summary>Et l’année prochaine ?</summary><p>Vous terminez l’année de cette classe, puis vous en créez une nouvelle. Les élèves que vous gardez se réinscrivent d’une coche, avec le même code.</p></details>
      </div>
      <p class="aide-etape__cmd"><button class="btn btn--primaire btn--grand" data-act="cl-commencer">${cl.aideVue ? 'Fermer l’aide' : 'Commencer'}</button>
        <label class="aide-etape__plus"><input type="checkbox" data-act="cl-aide-jamais" ${cl.aideJamais ? 'checked' : ''}><span>Ne plus afficher</span></label></p></section>`;
  const boutonAide = `<button class="cl-aide" data-act="cl-aide" title="Que fait-on ici ?">${ic('i-aide')}Aide</button>`;
  const horairesTexte = c => (c.horaires.length ? c.horaires.map(plageTexte) : ['Pas de limite d’horaire']);
  const places = n => Array.from({ length: n }, () => '<span class="gommette gommette--libre"></span>').join('');

  function pageListe() {
    const tete = cmd => `<header class="suivi-tete"><div><h1>Mes classes</h1></div>${cmd}</header>`;
    if (!cl.classes.length) return `<div class="page page--classes">${tete(`<div class="cl-tete__cmd">${boutonAide}</div>`)}
      <section class="cl-vide" aria-labelledby="cl-vide-t">
        <div class="cl-vide__places" aria-hidden="true">${places(7)}</div>
        <h2 id="cl-vide-t">Pas encore de classe</h2>
        <p>Créez-la quand vos élèves commencent à écrire. D’ici là, votre histoire se prépare sans elle.</p>
        <button class="btn btn--primaire btn--grand" data-act="cl-nouvelle">${ic('i-plus')}Créer ma classe</button>
      </section></div>`;
    const cours = enCours(); const passees = cl.classes.filter(c => !c.enCours);
    const carte = (c, i) => { const n = c.eleves.length; const np = c.projets.length;
      return `<li><article class="cl-carte">
        <div class="cl-carte__texte"><h2>${esc(c.nom)}</h2><p class="cl-carte__annee">${c.annee}</p>
          <ul class="cl-carte__faits">
            <li><b>${n ? `${n} élève${pl(n)}` : 'Aucun élève inscrit'}</b></li>
            <li>${np ? c.projets.map(p => esc(p.titre)).join(' · ') : 'Aucun projet'}</li>
            <li>${horairesTexte(c).join(' ; ')}</li></ul>
          <a class="btn ${i ? '' : 'btn--primaire'} cl-carte__ouvrir" href="#/classes/${c.id}" aria-label="Ouvrir ${esc(c.nom)} ${c.annee}">Ouvrir</a></div>
        <div class="cl-carte__eleves" aria-hidden="true">${n ? tri(c.eleves).map(e => gom(e)).join('') : places(9)}</div>
      </article></li>`; };
    return `<div class="page page--classes">${tete(`<div class="cl-tete__cmd">${boutonAide}<button class="btn" data-act="cl-nouvelle">${ic('i-plus')}Nouvelle classe</button></div>`)}
      ${cours.length ? `<ul class="cl-cartes">${cours.map(carte).join('')}</ul>` : '<p class="cl-aucune">Aucune classe en cours.</p>'}
      ${passees.length ? `<h2 class="cl-titre2">Années passées</h2>
      <ul class="cl-passees">${passees.map(c => `<li><a class="cl-passee" href="#/classes/${c.id}"><b>${esc(c.nom)}</b><span>${c.annee}</span><span>${c.eleves.length} élèves · ${c.projets.length} projet${pl(c.projets.length)}</span><span class="cl-passee__ouvrir">Ouvrir${ic('i-fleche')}</span></a></li>`).join('')}</ul>` : ''}
    </div>`;
  }

  /* ——— Une classe : ses élèves à gauche, ses fiches à droite ————————————————— */
  function pageClasse(c) {
    const n = c.eleves.length; const ouvert = c.enCours; const liste = tri(c.eleves);
    const menu = ouvert ? `<details class="menu-scene" data-menu="cl-classe"><summary class="btn menu-plus" aria-label="Autres commandes de la classe">${ic('i-points')}</summary><div class="menu-scene__liste">
        <button data-act="cl-renommer">Renommer la classe</button>
        ${!n && !c.projets.length ? '<button data-act="cl-supprimer">Supprimer la classe</button>' : ''}</div></details>` : '';
    const fin = ouvert ? `<p class="cl-fin-lien">L’année est finie ? <button class="lien" data-act="cl-terminer" data-id="${c.id}">Terminer l’année</button></p>` : '';
    // Sur un écran étroit, les fiches passent sous la liste : une ligne de liens y mène
    const sommaire = ouvert && n ? `<p class="cl-sommaire">Aller à : <button class="lien" data-act="cl-aller" data-v="cl-f-acces">Connexion</button><button class="lien" data-act="cl-aller" data-v="cl-f-hor">Horaires</button><button class="lien" data-act="cl-aller" data-v="cl-f-proj">Projets</button></p>` : '';
    const autre = cl.prop && cl.prop !== c.id ? classe(cl.prop) : null;
    const bande = !ouvert ? `<div class="note note--ok cl-fin">${ic('i-coche')}<div><p><b>Année terminée le ${c.finLe}.</b> Les élèves ne peuvent plus ouvrir cette classe. Rien n’est supprimé.</p></div><button class="btn" data-act="cl-rouvrir">Rouvrir la classe</button></div>`
      : autre && autre.enCours ? `<div class="alerte cl-prop">${ic('i-horloge')}<span><b>Votre classe ${autre.annee}</b> (${esc(autre.nom)}) est encore en cours. Son année est finie ?</span><button class="btn" data-act="cl-terminer" data-id="${autre.id}">Terminer son année</button><button class="btn btn--discret" data-act="cl-prop-non">Plus tard</button></div>` : '';
    const ligne = e => { const nom = `<span class="cl-eleve__nom"><b>${esc(e.prenom)}</b>${e.nom ? ` ${esc(e.nom)}` : ''}</span>`;
      const code = `<span class="cl-eleve__code" ${cl.codes && ouvert ? '' : 'aria-hidden="true"'}>${cl.codes && ouvert ? e.code : '••••'}</span>`;
      return ouvert ? `<li><button class="cl-eleve" data-act="cl-eleve" data-id="${e.id}" ${cl.panneau && cl.panneau.id === e.id ? 'aria-current="true"' : ''}>${gom(e, 'gommette--s')}${nom}${code}${ic('i-chevron')}</button></li>`
        : `<li><span class="cl-eleve cl-eleve--fixe">${gom(e, 'gommette--s')}${nom}</span></li>`; };
    const eleves = n ? `<ol class="cl-eleves">${liste.map(ligne).join('')}</ol>`
      : `<div class="cl-liste__vide"><div class="cl-vide__places" aria-hidden="true">${places(7)}</div><p>Aucun élève pour l’instant.</p>
          <a class="btn btn--primaire btn--grand" href="#/classes/${c.id}/inscrire">${ic('i-plus')}Inscrire des élèves</a>
          <p class="cl-liste__aide">Écrivez ou collez leurs prénoms : chacun reçoit son code.</p></div>`;
    const outils = ouvert && n ? `<div class="cl-liste__cmd">
          <button class="btn btn--discret" data-act="cl-codes" aria-pressed="${cl.codes}">${ic('i-oeil')}${cl.codes ? 'Masquer les codes' : 'Afficher les codes'}</button>
          <a class="btn" href="#/classes/${c.id}/imprimer">${ic('i-imprimer')}Imprimer les étiquettes</a>
          <a class="btn" href="#/classes/${c.id}/inscrire">${ic('i-plus')}Inscrire des élèves</a></div>` : '';
    const acces = ouvert ? `<section class="carnet-fiche cl-fiche" aria-labelledby="cl-f-acces"><header><h2 id="cl-f-acces">Pour ouvrir la classe sur un ordinateur</h2></header>
        <div class="carnet-fiche__corps"><p class="cl-fiche__aide">Une fois par ordinateur. Ensuite, chaque élève clique sur son prénom et tape son code.</p><dl class="cl-acces">
            <div><dt>Adresse</dt><dd>${ADRESSE}</dd></div>
            <div><dt>Identifiant</dt><dd>${esc(c.ident)}</dd></div>
            <div><dt>Mot de passe</dt><dd><span ${cl.mdp ? '' : 'aria-hidden="true"'}>${cl.mdp ? esc(c.mdp) : '••••••••••'}</span><button class="cl-oeil" data-act="cl-mdp-voir" aria-pressed="${cl.mdp}" aria-label="${cl.mdp ? 'Masquer' : 'Afficher'} le mot de passe">${ic('i-oeil')}</button></dd></div></dl>
          <div class="cl-fiche__cmd"><a class="btn" href="#/classes/${c.id}/imprimer?climpr=affiche">${ic('i-imprimer')}Imprimer l’affiche</a><button class="lien" data-act="cl-mdp">Changer le mot de passe</button></div></div></section>` : '';
    const horaires = ouvert ? `<section class="carnet-fiche cl-fiche" aria-labelledby="cl-f-hor"><header><h2 id="cl-f-hor">Horaires</h2></header>
        <div class="carnet-fiche__corps"><ul class="cl-hor ${c.horaires.length ? 'cl-hor--regle' : ''}">${horairesTexte(c).map(t => `<li>${t}</li>`).join('')}</ul>
          <p class="cl-fiche__aide">${c.horaires.length ? 'Hors de ces horaires, les élèves ne peuvent ni lire ni écrire.' : 'Les élèves travaillent quand ils veulent.'}</p>
          <div class="cl-fiche__cmd"><button class="btn" data-act="cl-horaires">${c.horaires.length ? 'Changer les horaires' : 'Limiter les horaires'}</button></div></div></section>` : '';
    const projets = `<section class="carnet-fiche cl-fiche" aria-labelledby="cl-f-proj"><header><h2 id="cl-f-proj">Projets de la classe</h2></header>
        <div class="carnet-fiche__corps">${c.projets.length ? `<ul class="cl-projets">${c.projets.map(p => `<li>${p.href ? `<a href="${p.href}">${esc(p.titre)}</a>` : `<button class="lien" data-act="toast" data-msg="Projet d’exemple : seul « Les passeurs de brume » est maquetté.">${esc(p.titre)}</button>`}<span>${p.type}</span></li>`).join('')}</ul>`
          : '<p class="cl-fiche__aide">Aucun projet. La classe se choisit à la création d’un projet, ou plus tard, dans le projet.</p>'}</div></section>`;
    return `<div class="page page--classes">
      <nav class="fil"><a href="#/classes">${ic('i-fleche-g')}Retour à Mes classes</a></nav>
      <header class="cl-entete"><div><h1>${esc(c.nom)}</h1><p>${c.annee}${n ? ` · ${n} élève${pl(n)}` : ''}</p></div><div class="cl-tete__cmd">${boutonAide}${menu}</div></header>
      ${bande}${sommaire}
      <div class="cl-grille">
        <section class="cl-liste" aria-labelledby="cl-t-eleves"><header class="cl-liste__tete"><h2 id="cl-t-eleves">Élèves</h2>${outils}</header>${eleves}</section>
        <aside class="cl-cote" aria-label="Réglages de la classe">${acces}${horaires}${projets}${fin}</aside>
      </div></div>`;
  }

  /* ——— Panneaux : un élève, les horaires, une nouvelle classe, la classe d'un projet ——— */
  function panneauEleve(c, e) {
    const chg = cl.changeCode;
    return `${tetePanneau(`<span class="cl-qui">${gom(e, 'gommette--l')}<span class="cl-prenom" data-cl-prenom>${esc(e.prenom)}</span></span>`, `${c.nom} · ${c.annee}`)}<div class="panneau__corps">
      <section><h3>${chg ? '<label for="cl-ncode">Nouveau code</label>' : 'Son code'}</h3>
        ${chg ? `<div class="cl-chg"><input class="pchamp" id="cl-ncode" inputmode="numeric" maxlength="4" value="${chg}" aria-describedby="cl-ncode-aide" data-focus>
            <p id="cl-ncode-aide">Code proposé : vous pouvez en taper un autre. L’ancien, ${e.code}, ne marchera plus.</p>
            <p class="cl-erreur" id="cl-ncode-err" role="alert" hidden>${ic('i-alerte')}Un code a quatre chiffres.</p>
            <div class="cl-rang"><button class="btn btn--primaire" data-act="cl-code-ok">Enregistrer ce code</button><button class="btn" data-act="cl-code-non">Annuler</button></div></div>`
        : `<p class="cl-code-grand" aria-label="Code : ${chiffres(e.code)}">${chiffres(e.code)}</p><div class="cl-rang"><button class="btn" data-act="cl-code-changer">Changer le code</button><a class="btn" href="#/classes/${c.id}/imprimer?climpr=${e.id}">${ic('i-imprimer')}Imprimer son étiquette</a></div>`}</section>
      <section><h3><label for="cl-prenom">Prénom</label></h3><input class="pchamp" id="cl-prenom" type="text" data-saisie="cl-prenom" value="${esc(e.prenom)}">
        <h3><label for="cl-nom">Nom</label> <span class="facultatif">facultatif</span></h3><input class="pchamp" id="cl-nom" type="text" data-saisie="cl-nom" value="${esc(e.nom)}">
        <p>Les élèves ne voient que le prénom, et l’initiale du nom si deux élèves portent le même.</p></section>
      <section><button class="btn btn--danger" data-act="cl-retirer" data-id="${e.id}">Retirer de la classe</button></section>
    </div>${piedFerme()}`;
  }
  function panneauHoraires(c) {
    const on = c.horaires.length > 0;
    const plage = (p, i) => `<fieldset class="cl-plage"><legend class="vh">Horaires ${i + 1}</legend>
        <div class="cl-jours" role="group" aria-label="Jours">${JOURS.map((j, k) => `<label class="cl-jour"><input type="checkbox" data-act="cl-jour" data-i="${i}" data-j="${k + 1}" ${p.jours.includes(k + 1) ? 'checked' : ''}><span>${maj(j)}</span></label>`).join('')}</div>
        <div class="cl-heures"><label>De <input class="pchamp" type="text" data-saisie="cl-heure" data-i="${i}" data-k="de" value="${p.de}"></label><label>à <input class="pchamp" type="text" data-saisie="cl-heure" data-i="${i}" data-k="a" value="${p.a}"></label>
          ${i ? `<button class="btn btn--discret" data-act="cl-plage-retirer" data-i="${i}" aria-label="Retirer ces horaires">${ic('i-fermer')}</button>` : ''}</div></fieldset>`;
    return `${tetePanneau('Horaires', `${c.nom} · ${c.annee}`)}<div class="panneau__corps">
      <section><label class="inter"><input type="checkbox" role="switch" data-act="cl-hor-on" ${on ? 'checked' : ''}><span class="inter__piste" aria-hidden="true"></span><span>Limiter les horaires</span></label>
        <p>${on ? 'Hors de ces horaires, les élèves ne peuvent ni lire ni écrire. À l’heure de fin, leur texte est enregistré.' : 'Sans horaires, les élèves travaillent quand ils veulent, à l’école comme à la maison.'}</p></section>
      ${on ? `<section class="cl-plages">${c.horaires.map(plage).join('')}<button class="lien" data-act="cl-plage-ajouter">Ajouter d’autres horaires</button></section>` : ''}
      <section><p>Ces horaires valent pour tous les projets de la classe. Vous gardez toujours votre accès.</p></section>
    </div>${piedFerme()}`;
  }
  function panneauNouvelle() {
    const an = cl.neuve.annee;
    return `${tetePanneau('Nouvelle classe', '')}<div class="panneau__corps">
      <section><h3><label for="cl-neuve-nom">Nom de la classe</label></h3><input class="pchamp" id="cl-neuve-nom" type="text" data-saisie="cl-neuve-nom" value="${esc(cl.neuve.nom)}" placeholder="CM1-CM2" data-focus><p class="cl-erreur" id="cl-neuve-err" role="alert" hidden>${ic('i-alerte')}Donnez un nom à la classe.</p></section>
      <section><h3 id="cl-neuve-an">Année scolaire</h3><div class="cl-jours" role="radiogroup" aria-labelledby="cl-neuve-an">${['2026-2027', '2027-2028'].map(a => `<label class="cl-jour cl-jour--large"><input type="radio" name="cl-neuve-annee" data-act="cl-neuve-annee" value="${a}" ${an === a ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div></section>
      <section><p>L’identifiant et le mot de passe de la classe sont proposés à la création. Vous pourrez les relire et les changer.</p></section>
    </div><div class="panneau__pied"><button class="btn btn--primaire btn--grand" data-act="cl-creer">Créer la classe</button></div>`;
  }
  function panneauClasseProjet() {
    const cours = enCours(); const v = cl.choixClasse || (cours.length === 1 ? cours[0].id : '');
    return `${tetePanneau('Classe du projet', H.titre)}<div class="panneau__corps">
      ${cours.length ? `<section><fieldset class="np-classes np-classes--panneau"><legend class="vh">Classe</legend>${cours.map(c => `<label class="np-classe"><input type="radio" name="np-classe-projet" data-act="np-classe-projet" value="${c.id}" ${v === c.id ? 'checked' : ''}><span><b>${esc(c.nom)}</b><span>${c.annee} · ${c.eleves.length ? `${c.eleves.length} élèves` : 'aucun élève inscrit'}</span></span></label>`).join('')}</fieldset></section>
      <section><p>Choisir la classe ne donne encore aucun accès aux élèves. Ils commencent quand vous leur attribuez un chapitre.</p></section>`
      : `<section><p>Vous n’avez pas encore de classe.</p><a class="btn" href="#/classes?clpanneau=nouvelle">${ic('i-plus')}Créer ma classe</a></section>`}
    </div><div class="panneau__pied">${cours.length ? `<button class="btn btn--primaire btn--grand" data-act="np-classe-ok" data-id="${v}" ${v ? '' : 'disabled'}>Choisir cette classe</button>` : '<button class="btn btn--grand" data-act="cl-fermer">Fermer</button>'}</div>`;
  }

  /* ——— Dialogues : retirer un élève, terminer l'année, changer le mot de passe ——— */
  const nomScene = s => `<span class="code">${s.ref}</span> ${esc(s.titre)}`;
  function demanderRetrait(c, id) {
    const e = c && c.eleves.find(x => x.id === id); if (!e) return;
    const chaps = D.eleves[id] ? Object.values(D.chapitres).filter(x => !x.supprime && x.eleves.some(([y]) => y === id)) : [];
    const scs = D.eleves[id] ? Object.values(D.scenes).filter(s => s.pec === id && !s.supprime) : [];
    const ecrites = scs.filter(s => !s.vide); const ouvertes = scs.filter(s => !['valider', 'valide', 'prete'].includes(s.etat));
    // Un élève qui n'a ni chapitre ni texte : pas de confirmation, « Annuler » dans le message (F01.1)
    if (!chaps.length && !scs.length) { retirer(c, id); return; }
    const nom = esc(e.prenom);
    const lignes = [`${nom} ne pourra plus se connecter${chaps.length ? `, et quitte ${chaps.map(x => `« ${esc(x.titre)} »`).join(' et ')}` : ''}.`];
    if (ecrites.length || ouvertes.length) lignes.push(`${ecrites.length ? `Ses ${ecrites.length > 1 ? `${ecrites.length} textes restent` : 'texte reste'}, à son prénom.` : ''}${ouvertes.length ? ` ${ouvertes.map(nomScene).join(', ')}, pas ${ouvertes.length > 1 ? 'finies, redeviennent' : 'finie, redevient'} « Pas encore prise ».` : ''}`.trim());
    lignes.push(`Vous pourrez réinscrire ${nom}, avec le même code.`);
    dialogue(`Retirer ${nom} de la classe ?`, `<ul class="dialogue__faits">${lignes.map(l => `<li>${l}</li>`).join('')}</ul>`, `<button class="btn btn--danger" data-act="cl-retirer-oui" data-id="${id}">Retirer de la classe</button>`);
  }
  function retirer(c, id) {
    const i = c.eleves.findIndex(x => x.id === id); if (i < 0) return; const [e] = c.eleves.splice(i, 1);
    cl.retire = { c, e, i }; fermerDialogue(); fermerPanneau(); rendre();
    messageAnnuler(`${e.prenom} n’est plus dans la classe.`, 'cl-retrait-annuler');
  }
  function demanderFin(c) {
    if (!c) return; const np = c.projets.length;
    dialogue(`Terminer l’année de ${esc(c.nom)} ${c.annee} ?`, `<ul class="dialogue__faits"><li>Les élèves ne pourront plus ouvrir la classe sur un ordinateur.</li><li>Rien n’est supprimé${np ? ` : vous gardez ${np > 1 ? `ses ${np} projets` : 'son projet'}, les textes et les livres` : ''}.</li><li>Vous pourrez rouvrir la classe.</li></ul>`, `<button class="btn btn--primaire" data-act="cl-terminer-oui" data-id="${c.id}">Terminer l’année</button>`);
  }
  function demanderMdp(c) {
    if (!c) return; const neuf = c.mdp === 'moulin-castor-58' ? 'tambour-pivoine-31' : 'moulin-castor-58';
    dialogue('Changer le mot de passe de la classe ?', `<p class="cl-mdp-neuf">Nouveau mot de passe : <b>${neuf}</b></p><ul class="dialogue__faits"><li>Il faudra le nouveau pour ouvrir la classe sur un ordinateur.</li><li>Les codes des élèves ne changent pas.</li><li>L’affiche est à réimprimer, et les étiquettes qui portent le mot de passe.</li></ul>`, `<button class="btn btn--primaire" data-act="cl-mdp-oui" data-id="${c.id}" data-v="${neuf}">Changer le mot de passe</button>`);
  }

  /* ——— Inscrire des élèves en lot : déjà connus, nouveaux, vérifier (F01.1) ——— */
  const EXEMPLE = ['Noé', 'Océane Girard', 'Paul', 'Rayan Mansouri', 'Sacha', 'Tom Leroy', 'Yasmine Belkacem', 'Zoé Henry', 'Adam Morel', 'Léo'].join('\n');
  const D25 = () => Object.keys(D.eleves).map(id => `${D.eleves[id].prenom}${NOMS[id] ? ' ' + NOMS[id] : ''}`).join('\n');
  // Les profils déjà connus : les élèves des autres classes de l'enseignant qui ne sont pas dans celle-ci
  function profilsConnus(c) {
    const ici = new Set(c.eleves.map(e => e.id)); const vus = new Set(); const l = [];
    cl.classes.filter(x => x !== c).forEach(x => x.eleves.forEach(e => { if (!ici.has(e.id) && !vus.has(e.id)) { vus.add(e.id); l.push({ ...e, de: `${x.nom} · ${x.annee}` }); } }));
    return l;
  }
  function lot(c) {
    if (!cl.lot || cl.lot.classe !== c.id) cl.lot = { classe: c.id, etape: profilsConnus(c).length ? 1 : 2, connus: new Set(), texte: '', lignes: null, edit: null };
    return cl.lot;
  }
  const lignesTexte = t => t.split('\n').map(x => x.trim().replace(/\s+/g, ' ')).filter(Boolean);
  function construire(c, L) {
    const connus = profilsConnus(c);
    const lignes = connus.filter(e => L.connus.has(e.id)).map(e => ({ type: 'connu', e }));
    lignesTexte(L.texte).forEach((t, i) => {
      const [prenom, ...reste] = t.split(' '); const nom = reste.join(' ');
      // Même prénom et même nom qu'un profil connu non coché : signalé, jamais fusionné d'office (F01-AC12)
      const meme = nom ? connus.find(e => !L.connus.has(e.id) && cle(e.prenom) === cle(prenom) && cle(e.nom) === cle(nom)) : null;
      lignes.push({ type: 'neuf', e: { id: `neuf-${cle(t).replace(/[^a-z]/g, '')}-${i}`, prenom: maj(prenom), nom, couleur: PAL[(c.eleves.length + lignes.length) % 10], code: codeDe(t + i) }, meme: meme || null });
    });
    L.lignes = lignes; L.edit = null;
  }
  function problemes(c, L) {
    const tous = [...c.eleves.map(e => ({ type: 'inscrit', e })), ...L.lignes]; const pb = [];
    L.lignes.forEach((l, i) => {
      if (l.type !== 'neuf') return;
      if (l.meme) { pb.push({ k: 'meme', i, l }); return; }
      const autre = tous.find(x => x !== l && cle(x.e.prenom) === cle(l.e.prenom));
      if (autre && !l.e.nom.trim()) pb.push({ k: 'double', i, l, autre });
    });
    return pb;
  }
  const etapes = (noms, n) => `<ol class="cl-etapes">${noms.map((t, i) => `<li class="${i + 1 === n ? 'est-en-cours' : i + 1 < n ? 'est-faite' : ''}" ${i + 1 === n ? 'aria-current="step"' : ''}><span class="cl-etapes__n">${i + 1 < n ? ic('i-coche') : i + 1}</span>${t}</li>`).join('')}</ol>`;
  function pageInscrire(c) {
    const L = lot(c); const connus = profilsConnus(c); const avecConnus = connus.length > 0;
    const noms = avecConnus ? ['Élèves déjà connus', 'Nouveaux élèves', 'Vérifier'] : ['Les prénoms', 'Vérifier'];
    const rang = avecConnus ? L.etape : L.etape - 1;
    let corps;
    if (L.etape === 1) {
      const groupes = [...new Set(connus.map(e => e.de))];
      corps = `<h2 id="cl-lot-t" tabindex="-1">Qui retrouvez-vous cette année ?</h2>
        <p class="cl-lot__aide">Un élève coché garde son code et ses anciens textes.</p>
        ${groupes.map(gr => { const l = tri(connus.filter(e => e.de === gr)); const tous = l.every(e => L.connus.has(e.id));
          return `<section class="cl-connus"><header><h3>${gr}</h3><button class="lien" data-act="cl-connus-tous" data-g="${esc(gr)}">${tous ? 'Tout décocher' : 'Tout cocher'}</button></header>
          <ul>${l.map(e => `<li><label class="cl-connu"><input type="checkbox" class="case" data-act="cl-connu" value="${e.id}" ${L.connus.has(e.id) ? 'checked' : ''}>${gom(e, 'gommette--s')}<span><b>${esc(e.prenom)}</b> ${esc(e.nom)}</span></label></li>`).join('')}</ul></section>`; }).join('')}
        <footer class="cl-lot__pied"><p><b>${L.connus.size}</b> élève${pl(L.connus.size)} coché${pl(L.connus.size)}</p><button class="btn btn--primaire btn--grand" data-act="cl-lot-suite">Continuer${ic('i-fleche')}</button></footer>`;
    } else if (L.etape === 2) {
      const nb = lignesTexte(L.texte).length;
      corps = `<h2 id="cl-lot-t" tabindex="-1">${avecConnus ? 'Les nouveaux élèves' : 'Les prénoms de vos élèves'}</h2>
        <p class="cl-lot__aide">Un élève par ligne : son prénom, puis son nom si vous voulez.</p>
        <textarea class="cl-saisie" rows="12" data-saisie="cl-lot-texte" aria-labelledby="cl-lot-t" placeholder="Noé Garnier&#10;Océane&#10;Paul Lefèvre" spellcheck="false">${esc(L.texte)}</textarea>
        <footer class="cl-lot__pied"><p id="cl-lot-nb"><b>${nb}</b> <span>${avecConnus ? (nb > 1 ? 'nouveaux élèves' : 'nouvel élève') : `élève${pl(nb)}`}</span></p>
          ${avecConnus ? '<button class="btn btn--grand" data-act="cl-lot-retour">Retour</button>' : ''}<button class="btn btn--primaire btn--grand" data-act="cl-lot-suite" ${nb || L.connus.size ? '' : 'disabled'}>Continuer${ic('i-fleche')}</button></footer>`;
    } else {
      const pb = problemes(c, L);
      const nc = L.lignes.filter(l => l.type === 'connu').length; const nn = L.lignes.length - nc; const n = L.lignes.length;
      const unPb = p => p.k === 'meme'
        ? `<li class="cl-pb"><p><b>${esc(p.l.e.prenom)} ${esc(p.l.e.nom)}</b> était déjà dans ${p.l.meme.de}. Est-ce le même élève ?</p>
            <div class="cl-rang"><button class="btn" data-act="cl-pb-meme" data-i="${p.i}">Oui, le même : il garde son code</button><button class="btn" data-act="cl-pb-autre" data-i="${p.i}">Non, un autre élève</button></div></li>`
        : `<li class="cl-pb"><p><b>Deux ${esc(p.l.e.prenom)} dans la classe.</b> Écrivez le nom du nouveau, ou son initiale : les élèves liront « ${esc(affiche(p.autre.e, [p.autre.e, { ...p.l.e, id: 'x' }]))} » et « ${esc(p.l.e.prenom)} D. ».</p>
            <label class="cl-pb__champ">Nom du nouveau ${esc(p.l.e.prenom)}<input class="pchamp" type="text" data-act="cl-pb-nom" data-i="${p.i}" placeholder="Durand, ou D."></label></li>`;
      const ligne = (l, i) => (L.edit === i
        ? `<li class="cl-recap__edit"><input class="pchamp" type="text" id="cl-edit-prenom" value="${esc(l.e.prenom)}" aria-label="Prénom"><input class="pchamp" type="text" id="cl-edit-nom" value="${esc(l.e.nom)}" aria-label="Nom, facultatif" placeholder="Nom, facultatif"><button class="btn btn--petit" data-act="cl-ligne-ok" data-i="${i}">Valider</button></li>`
        : `<li>${gom(l.e, 'gommette--s')}<span class="cl-recap__nom"><b>${esc(l.e.prenom)}</b>${l.e.nom ? ` ${esc(l.e.nom)}` : ''}</span><span class="cl-recap__quoi">${l.type === 'connu' ? 'garde son code' : 'nouveau'}</span>
            ${l.type === 'neuf' ? `<button class="cl-recap__cmd" data-act="cl-ligne-corriger" data-i="${i}" aria-label="Corriger ${esc(l.e.prenom)}">${ic('i-crayon')}</button>` : '<span class="cl-recap__cmd" aria-hidden="true"></span>'}<button class="cl-recap__cmd" data-act="cl-ligne-retirer" data-i="${i}" aria-label="Retirer ${esc(l.e.prenom)} de la liste">${ic('i-fermer')}</button></li>`);
      const ordre = L.lignes.map((l, i) => [l, i]).sort((a, b) => a[0].e.prenom.localeCompare(b[0].e.prenom, 'fr'));
      corps = `<h2 id="cl-lot-t" tabindex="-1">Vérifiez la liste</h2>
        ${pb.length ? `<section class="cl-regler" aria-labelledby="cl-regler-t"><h3 id="cl-regler-t" tabindex="-1">${ic('i-alerte')}À régler avant d’inscrire</h3><ul>${pb.map(unPb).join('')}</ul></section>` : ''}
        <ul class="cl-recap">${ordre.map(([l, i]) => ligne(l, i)).join('')}</ul>
        <footer class="cl-lot__pied"><p><b>${n} élève${pl(n)}</b>${pb.length ? ` · <button class="lien" data-act="cl-pb-voir">${pb.length} point${pl(pb.length)} à régler</button> avant d’inscrire` : nc && nn ? ` : ${nc} garde${nc > 1 ? 'nt' : ''} leur code, ${nn} nouveau${nn > 1 ? 'x' : ''}` : ''}</p>
          <button class="btn btn--grand" data-act="cl-lot-retour">Retour</button><button class="btn btn--primaire btn--grand" data-act="cl-inscrire" ${pb.length || !n ? 'disabled' : ''}>Inscrire ${n} élève${pl(n)}</button></footer>`;
    }
    return `<div class="page page--classes">
      <nav class="fil"><a href="#/classes/${c.id}">${ic('i-fleche-g')}Retour à ${esc(c.nom)}</a></nav>
      <div class="cl-colonne"><header class="cl-entete"><div><h1>Inscrire des élèves</h1><p>${esc(c.nom)} · ${c.annee}</p></div></header>
        ${etapes(noms, rang)}
        <section class="cl-lot" aria-labelledby="cl-lot-t">${corps}</section></div></div>`;
  }

  /* ——— Imprimer : les étiquettes des élèves, ou l'affiche de la classe (F06.4) ——— */
  function pageImprimer(c) {
    const I = cl.impr; const liste = I.qui ? c.eleves.filter(e => e.id === I.qui) : tri(c.eleves);
    const parFeuille = I.maison ? 14 : 27; const nf = Math.max(1, Math.ceil(liste.length / parFeuille)); const n = liste.length;
    const etiq = e => `<div class="cl-etiq">${gom(e)}<span class="cl-etiq__prenom">${esc(affiche(e, c.eleves))}</span><span class="cl-etiq__code"><span>Ton code</span>${chiffres(e.code)}</span>
        ${I.maison ? `<span class="cl-etiq__classe">${ADRESSE}<br>Identifiant : <b>${esc(c.ident)}</b><br>Mot de passe : <b>${esc(c.mdp)}</b></span>` : ''}</div>`;
    const reglages = I.quoi === 'etiquettes' ? `
        <label class="champ"><span>Élèves</span><span class="champ__select"><select data-act="cl-impr-qui"><option value="">Toute la classe</option>${tri(c.eleves).map(e => `<option value="${e.id}" ${I.qui === e.id ? 'selected' : ''}>${esc(e.prenom)}${e.nom ? ` ${esc(e.nom)}` : ''}</option>`).join('')}</select>${ic('i-chevron-bas')}</span></label>
        <label class="cl-option"><input type="checkbox" class="case" data-act="cl-impr-maison" ${I.maison ? 'checked' : ''}><span><b>Avec l’identifiant et le mot de passe de la classe</b><span>Pour travailler à la maison. Si le mot de passe change, ces étiquettes sont à réimprimer.</span></span></label>
        <p class="cl-impr__compte">${n ? `<b>${n} étiquette${pl(n)}</b> sur ${nf} feuille${pl(nf)}` : 'Aucun élève inscrit : rien à imprimer.'}</p>
        <button class="btn btn--primaire btn--grand cl-impr__bouton" data-act="cl-imprimer" ${n ? '' : 'disabled'}>${ic('i-imprimer')}Imprimer${n ? ` ${nf} feuille${pl(nf)}` : ''}</button>
        <p class="cl-impr__aide">À découper : chaque élève garde la sienne.</p>`
      : `<p class="cl-impr__compte"><b>1 feuille</b>, à afficher près des ordinateurs.</p>
        <button class="btn btn--primaire btn--grand cl-impr__bouton" data-act="cl-imprimer">${ic('i-imprimer')}Imprimer l’affiche</button>
        <p class="cl-impr__aide">Elle porte le mot de passe de la classe, pas les codes des élèves.</p>`;
    const apercu = I.quoi === 'etiquettes'
      ? `<div class="feuille cl-planche ${I.maison ? 'cl-planche--maison' : ''}" role="img" aria-label="Aperçu de la première feuille d’étiquettes">${liste.slice(0, parFeuille).map(etiq).join('')}</div>${nf > 1 ? `<p class="cl-impr__suite">Feuille 1 sur ${nf}</p>` : ''}`
      : `<div class="feuille cl-affiche" role="img" aria-label="Aperçu de l’affiche de la classe"><p class="cl-affiche__classe">${esc(c.nom)} · Mme Laurent</p><h2>Pour ouvrir la classe</h2>
          <ol><li><b>Ouvre cette adresse</b><span class="cl-affiche__val">${ADRESSE}</span></li>
            <li><b>Écris l’identifiant de la classe</b><span class="cl-affiche__val">${esc(c.ident)}</span></li>
            <li><b>Écris le mot de passe de la classe</b><span class="cl-affiche__val">${esc(c.mdp)}</span></li>
            <li><b>Clique sur ton prénom, puis tape ton code</b><span>Ton code est sur ton étiquette.</span></li></ol><p class="cl-affiche__pied">Un souci ? Demande à Mme Laurent.</p></div>`;
    return `<div class="page page--classes">
      <nav class="fil"><a href="#/classes/${c.id}">${ic('i-fleche-g')}Retour à ${esc(c.nom)}</a></nav>
      <header class="cl-entete"><div><h1>Imprimer</h1><p>${esc(c.nom)} · ${c.annee}</p></div></header>
      <div class="cl-impr">
        <div class="cl-impr__reglages"><div class="bascule" role="group" aria-label="Ce qu’on imprime"><button data-act="cl-impr-quoi" data-v="etiquettes" aria-pressed="${I.quoi === 'etiquettes'}">Étiquettes des élèves</button><button data-act="cl-impr-quoi" data-v="affiche" aria-pressed="${I.quoi === 'affiche'}">Affiche de la classe</button></div>${reglages}</div>
        <div class="cl-impr__apercu">${apercu}</div>
      </div></div>`;
  }

  function pageClasses() {
    synchro(); const r = route(); const c = r.id ? classe(r.id) : null;
    if (!r.id && !cl.aideVue && !cl.aideJamais && !cl.avecParams) cl.aide = true;
    if (cl.aide && !r.sous) return `<div class="page page--classes"><h1 class="vh">Mes classes</h1>${aideClasses()}</div>`;
    if (c && r.sous === 'inscrire' && c.enCours) return pageInscrire(c);
    if (c && r.sous === 'imprimer' && c.enCours) return pageImprimer(c);
    return c ? pageClasse(c) : pageListe();
  }

  /* ——— Nouveau projet : trois questions, l'une après l'autre (F01) —————————— */
  const fichette = (x, y) => `<rect x="${x}" y="${y}" width="34" height="24" rx="4"/><path class="np-filet" d="M${x + 5} ${y + 8}h24"/>`;
  const DESSINS = {
    classe: () => `<span class="np-ronde">${['alice', 'bilal', 'chloe', 'dylan', 'emma', 'farah', 'gabin'].map(id => A.gommette(id)).join('')}</span>`,
    moi: () => `<span class="np-ronde"><span class="gommette" style="--g:#4A5157">${ic('i-crayon')}</span></span>`,
    choix: () => `<svg class="np-plan" viewBox="0 0 190 84" aria-hidden="true"><path class="np-trait" d="M36 42h18M54 42c12 0 10-26 24-26M54 42c12 0 10 26 24 26M112 16h20M112 68c14 0 8-26 20-26M112 16c14 0 8 26 20 26M112 68h20"/>${fichette(2, 30)}${fichette(78, 4)}${fichette(78, 56)}${fichette(132, 4)}${fichette(132, 30)}${fichette(132, 56)}</svg>`,
    classique: () => `<svg class="np-plan" viewBox="0 0 190 84" aria-hidden="true"><path class="np-trait" d="M36 42h14M84 42h14M132 42h14"/>${fichette(2, 30)}${fichette(50, 30)}${fichette(98, 30)}${fichette(146, 30)}</svg>`
  };
  function pageNouveau() {
    synchro(); const n = cl.np = cl.np || npInit(); const cours = enCours();
    const carte = (act, v, on, titre, texte) => `<label class="np-choix"><input type="radio" name="${act}" data-act="${act}" value="${v}" ${on ? 'checked' : ''}><span class="np-choix__dessin" aria-hidden="true">${DESSINS[v]()}</span><span class="np-choix__texte"><b>${titre}</b><span>${texte}</span></span><span class="np-choix__coche" aria-hidden="true">${ic('i-coche')}</span></label>`;
    let titre, corps, suite;
    if (n.etape === 1) {
      titre = 'Qui écrit ?';
      corps = `<div class="np-choix-grille" role="radiogroup" aria-labelledby="np-q">${carte('np-qui', 'classe', n.qui === 'classe', 'Ma classe', 'Les élèves écrivent les scènes. Vous préparez, relisez et validez.')}${carte('np-qui', 'moi', n.qui === 'moi', 'Moi', 'Vous écrivez votre histoire, sans élèves.')}</div>
        <p class="np-fixe">Ce choix ne se change pas ensuite. Avec une classe, vous préparez d’abord l’histoire sans les élèves : ils n’entrent que quand vous le décidez.</p>`;
      suite = `<button class="btn btn--primaire btn--grand" data-act="np-suite" ${n.qui ? '' : 'disabled'}>Continuer${ic('i-fleche')}</button>`;
    } else if (n.etape === 2) {
      titre = 'Quel récit ?';
      corps = `<div class="np-choix-grille" role="radiogroup" aria-labelledby="np-q">${carte('np-recit', 'choix', n.recit === 'choix', 'À choix', 'Le lecteur choisit sa route, comme dans un livre dont on est le héros.')}${carte('np-recit', 'classique', n.recit === 'classique', 'Classique', 'L’histoire se lit du début à la fin, comme un roman.')}</div>
        <p class="np-fixe">Ce choix ne se change pas ensuite.</p>`;
      suite = `<button class="btn btn--primaire btn--grand" data-act="np-suite" ${n.recit ? '' : 'disabled'}>Continuer${ic('i-fleche')}</button>`;
    } else {
      titre = 'Quel titre ?';
      if (n.classe === null) n.classe = cours.length === 1 ? cours[0].id : '';
      const classes = n.qui !== 'classe' ? '' : cours.length
        ? `<fieldset class="np-classes"><legend>Classe</legend>${cours.map(c => `<label class="np-classe"><input type="radio" name="np-classe" data-act="np-classe" value="${c.id}" ${n.classe === c.id ? 'checked' : ''}><span><b>${esc(c.nom)}</b><span>${c.annee} · ${c.eleves.length ? `${c.eleves.length} élèves` : 'aucun élève inscrit'}</span></span></label>`).join('')}
            <label class="np-classe"><input type="radio" name="np-classe" data-act="np-classe" value="" ${n.classe ? '' : 'checked'}><span><b>Choisir plus tard</b><span>Vous préparez d’abord l’histoire.</span></span></label></fieldset>`
        : '<p class="np-sans-classe">Vous n’avez pas encore de classe. Vous la créerez quand vos élèves commenceront à écrire.</p>';
      corps = `<label class="np-champ"><span class="vh">Titre du projet</span><input class="np-titre" id="np-titre" type="text" data-saisie="np-titre" value="${esc(n.titre)}" placeholder="Le titre de votre histoire" autocomplete="off"><span class="np-champ__aide">Vous pourrez le changer.</span></label>
        ${classes}
        <p class="np-recap"><span class="repere">${n.qui === 'moi' ? 'Projet personnel' : 'Projet de classe'}</span><span class="repere">${n.recit === 'classique' ? 'Récit classique' : 'Récit à choix'}</span><span>ne se changent pas ensuite. ${n.qui === 'moi' ? 'Le titre, si.' : 'Le titre et la classe, si.'}</span></p>`;
      suite = `<button class="btn btn--primaire btn--grand" data-act="np-creer" ${n.titre.trim() ? '' : 'disabled'}>Créer le projet</button>`;
    }
    return `<div class="page page--nouveau">
      <nav class="fil"><a href="#/projets">${ic('i-fleche-g')}Retour à Mes projets</a></nav>
      <div class="cl-colonne"><header class="cl-entete"><div><h1>Nouveau projet</h1></div></header>
        ${etapes(['Qui écrit ?', 'Quel récit ?', 'Le titre'], n.etape)}
        <section class="np-etape" aria-labelledby="np-q"><h2 id="np-q" tabindex="-1">${titre}</h2>${corps}
          <footer class="np-pied">${n.etape > 1 ? '<button class="btn btn--grand" data-act="np-retour">Retour</button>' : '<span></span>'}${suite}</footer></section></div></div>`;
  }
  // « Mes projets » sans aucun projet : le projet d'abord, la classe ensuite (F01, 6 octobre 2026)
  const pageProjetsVide = () => `<div class="page page--projets">
      <header class="suivi-tete"><div><h1>Mes projets</h1></div></header>
      <section class="np-vide" aria-labelledby="np-vide-t">
        <div class="np-vide__cahier" aria-hidden="true"><div class="cahier"><div class="cahier__couv"><div class="cahier__vignette"><img src="assets/img/ill-defaut-montagne.jpg" alt=""></div><div class="etiquette"><span class="np-vide__ligne"></span><span class="np-vide__ligne np-vide__ligne--courte"></span></div><div class="cahier__couv-bas"></div></div></div></div>
        <div class="np-vide__texte"><h2 id="np-vide-t">Votre premier livre commence ici</h2>
          <p>Un projet, c’est une histoire : vous la préparez, elle s’écrit, puis elle devient un livre.</p>
          <a class="btn btn--primaire btn--grand" href="#/nouveau">${ic('i-plus')}Créer mon premier projet</a>
          <p class="np-vide__plus">Vous écrivez avec une classe ? Vous l’inscrirez plus tard, quand les élèves commenceront.</p></div>
      </section></div>`;

  /* ——— Ce que les autres pages demandent à ce fichier : projet sans classe, « Mes projets » vide ——— */
  A.classes = {
    projetsVides: () => { synchro(); return cl.projetsVides; },
    pageProjetsVide,
    sansClasse: () => { synchro(); return cl.sansClasse && !perso(); },
    metaProjet: () => { synchro(); return cl.sansClasse && !perso() ? 'Sans classe · <button class="lien" data-act="np-classe-choisir">Choisir une classe</button>' : ''; },
    metaCarte: () => { synchro(); return cl.sansClasse && !perso() ? 'Sans classe' : ''; },
    attribuer: (tete, pied) => `${tete}<div class="panneau__corps"><section><p>Ce projet n’a pas encore de classe : il n’y a pas d’élèves à choisir.</p><button class="btn btn--primaire" data-act="np-classe-choisir">Choisir une classe</button></section></div>${pied}`
  };

  /* ——— Commandes ———————————————————————————————————————————————— */
  const ici = () => classe(route().id);
  const garder = f => { const y = window.scrollY; f(); window.scrollTo(0, y); };
  const viser = sel => setTimeout(() => $(sel)?.focus({ preventScroll: true }), 30);
  Object.assign(A.actions, {
    'cl-commencer': () => { cl.aideVue = true; cl.aide = false; rendre(); window.scrollTo(0, 0); },
    'cl-aide': () => { cl.aide = true; rendre(); viser('#aide-t'); window.scrollTo(0, 0); },
    'cl-fermer': () => fermerPanneau(),
    'cl-aller': el => { const x = document.getElementById(el.dataset.v); if (x) x.closest('section').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'cl-pb-voir': () => { const x = $('#cl-regler-t'); if (x) { x.scrollIntoView({ behavior: 'smooth', block: 'center' }); x.focus({ preventScroll: true }); } },
    'cl-dialogue-fermer': () => fermerDialogue(),
    'cl-nouvelle': () => { cl.neuve = { nom: '', annee: '2026-2027' }; montrer({ type: 'nouvelle' }); },
    'cl-creer': () => {
      const nom = cl.neuve.nom.trim(); if (!nom) { $('#cl-neuve-nom').setAttribute('aria-invalid', 'true'); $('#cl-neuve-err').hidden = false; $('#cl-neuve-nom').focus(); return; }
      const id = classe('cm') ? 'neuve' + cl.classes.length : 'cm';
      const avant = enCours().find(c => c.annee < cl.neuve.annee);
      cl.classes.unshift({ id, nom, annee: cl.neuve.annee, enCours: true, ident: id === 'cm' ? 'cm-laurent' : `${cle(nom).replace(/[^a-z0-9]/g, '')}-laurent-${cl.neuve.annee.slice(2, 4)}`, mdp: id === 'cm' ? 'lanterne-renard-47' : 'tambour-pivoine-31', horaires: [], eleves: [], projets: [] });
      // L'application propose de terminer l'année d'une classe plus ancienne encore en cours ; elle ne le fait jamais seule (F01-AC20)
      cl.prop = avant ? avant.id : null; fermerPanneau(); aller(`#/classes/${id}`);
      setTimeout(() => toast(`« ${nom} » est créée. Inscrivez vos élèves quand vous voulez.`), 80);
    },
    'cl-eleve': el => { const c = ici(); $$('.cl-eleve[aria-current]').forEach(b => b.removeAttribute('aria-current')); el.setAttribute('aria-current', 'true'); montrer({ type: 'eleve', id: el.dataset.id, classe: c.id }); },
    'cl-codes': () => { cl.codes = !cl.codes; garder(rendre); viser('[data-act="cl-codes"]'); },
    'cl-mdp-voir': () => { cl.mdp = !cl.mdp; garder(rendre); viser('[data-act="cl-mdp-voir"]'); },
    'cl-code-changer': () => { cl.changeCode = codeDe(cl.panneau.id + '/neuf' + Date.now()); ouvrirPanneau(); },
    'cl-code-non': () => { cl.changeCode = null; ouvrirPanneau(false); viser('[data-act="cl-code-changer"]'); },
    'cl-code-ok': () => {
      const c = classe(cl.panneau.classe); const e = c.eleves.find(x => x.id === cl.panneau.id); const v = ($('#cl-ncode').value || '').replace(/\D/g, '');
      if (v.length !== 4) { $('#cl-ncode').setAttribute('aria-invalid', 'true'); $('#cl-ncode-err').hidden = false; $('#cl-ncode').focus(); return; }
      e.code = v; cl.changeCode = null; cl.enr = true; garder(rendre); toast(`Le code de ${e.prenom} est changé. Pensez à réimprimer son étiquette.`);
    },
    'cl-retirer': el => demanderRetrait(classe(cl.panneau.classe), el.dataset.id),
    'cl-retirer-oui': el => retirer(ici(), el.dataset.id),
    'cl-retrait-annuler': () => { const x = cl.retire; if (!x) return; x.c.eleves.splice(x.i, 0, x.e); cl.retire = null; $('#toast').classList.remove('est-visible', 'a-action'); garder(rendre); toast(`${x.e.prenom} est de retour dans la classe.`); },
    'cl-terminer': el => demanderFin(classe(el.dataset.id)),
    'cl-terminer-oui': el => { const c = classe(el.dataset.id); c.enCours = false; c.finLe = '6 octobre 2026'; if (cl.prop === c.id) cl.prop = null; fermerDialogue(); fermerPanneau(); rendre(); toast(`L’année de ${c.nom} ${c.annee} est terminée. La classe est sous « Années passées ».`); },
    'cl-rouvrir': () => { const c = ici(); c.enCours = true; c.finLe = null; $$('details.menu-scene[open]').forEach(m => { m.open = false; }); rendre(); toast(`${c.nom} ${c.annee} est rouverte : mêmes informations de classe, mêmes codes.`); },
    'cl-prop-non': () => { cl.prop = null; rendre(); },
    'cl-mdp': () => demanderMdp(ici()),
    'cl-mdp-oui': el => { const c = classe(el.dataset.id); c.mdp = el.dataset.v; cl.mdp = true; fermerDialogue(); garder(rendre); toast('Le mot de passe de la classe est changé.'); },
    'cl-horaires': () => montrer({ type: 'horaires', classe: ici().id }),
    'cl-plage-ajouter': () => { classe(cl.panneau.classe).horaires.push({ jours: [3], de: '8 h 30', a: '11 h 30' }); cl.enr = true; garder(rendre); },
    'cl-plage-retirer': el => { classe(cl.panneau.classe).horaires.splice(+el.dataset.i, 1); cl.enr = true; garder(rendre); },
    'cl-renommer': () => { $$('details.menu-scene[open]').forEach(m => { m.open = false; }); toast('Le nom de la classe se corrige ici. L’identifiant de la classe ne change pas.'); },
    'cl-supprimer': () => { const c = ici(); cl.classes.splice(cl.classes.indexOf(c), 1); if (cl.prop) cl.prop = null; aller('#/classes'); setTimeout(() => toast(`« ${c.nom} » est supprimée.`), 80); },
    // Inscription en lot
    'cl-connus-tous': el => { const L = lot(ici()); const l = profilsConnus(ici()).filter(e => e.de === el.dataset.g); const tous = l.every(e => L.connus.has(e.id)); l.forEach(e => (tous ? L.connus.delete(e.id) : L.connus.add(e.id))); garder(rendre); },
    'cl-lot-suite': () => { const c = ici(); const L = lot(c); if (L.etape === 2) construire(c, L); L.etape = Math.min(3, L.etape + 1); rendre(); window.scrollTo(0, 0); viser('#cl-lot-t'); },
    'cl-lot-retour': () => { const c = ici(); const L = lot(c); L.etape = Math.max(profilsConnus(c).length ? 1 : 2, L.etape - 1); rendre(); window.scrollTo(0, 0); viser('#cl-lot-t'); },
    'cl-pb-meme': el => { const l = lot(ici()).lignes[+el.dataset.i]; l.type = 'connu'; l.e = l.meme; l.meme = null; garder(rendre); },
    'cl-pb-autre': el => { lot(ici()).lignes[+el.dataset.i].meme = null; garder(rendre); },
    'cl-ligne-corriger': el => { lot(ici()).edit = +el.dataset.i; garder(rendre); viser('#cl-edit-prenom'); },
    'cl-ligne-ok': el => { const L = lot(ici()); const l = L.lignes[+el.dataset.i]; const p = $('#cl-edit-prenom').value.trim(); if (p) l.e.prenom = p; l.e.nom = $('#cl-edit-nom').value.trim(); L.edit = null; garder(rendre); },
    'cl-ligne-retirer': el => { const L = lot(ici()); L.lignes.splice(+el.dataset.i, 1); L.edit = null; garder(rendre); },
    'cl-inscrire': () => { const c = ici(); const L = lot(c); const n = L.lignes.length; c.eleves.push(...L.lignes.map(l => ({ ...l.e }))); cl.lot = null; aller(`#/classes/${c.id}`); setTimeout(() => toast(`${n} élève${pl(n)} inscrit${pl(n)}. Chacun a son code : imprimez les étiquettes.`), 80); },
    // Imprimer
    'cl-impr-quoi': el => { cl.impr.quoi = el.dataset.v; garder(rendre); viser(`[data-act="cl-impr-quoi"][data-v="${el.dataset.v}"]`); },
    'cl-imprimer': () => toast('L’impression s’ouvre dans le navigateur.'),
    // Nouveau projet
    'np-suite': () => { cl.np.etape = Math.min(3, cl.np.etape + 1); rendre(); window.scrollTo(0, 0); viser(cl.np.etape === 3 ? '#np-titre' : '#np-q'); },
    'np-retour': () => { cl.np.etape = Math.max(1, cl.np.etape - 1); rendre(); window.scrollTo(0, 0); viser('#np-q'); },
    'np-creer': () => {
      const n = cl.np; const titre = n.titre.trim(); if (!titre) return;
      // Le projet créé s'ouvre sur sa Préparation et devient le dernier projet ouvert (F01, F06.5)
      st.mode = n.qui === 'moi' ? 'perso' : 'classe'; st.recit = n.recit === 'classique' ? 'classique' : 'choix'; if (st.mode === 'perso') st.vue = 'enseignant';
      H.titre = titre; cl.sansClasse = st.mode === 'classe' && !n.classe; cl.projetsVides = false; A.dernierOnglet = '#/preparation'; cl.np = null;
      location.hash = '#/preparation'; setTimeout(() => toast(`« ${titre} » est créé. Commencez par la préparation.`), 120);
    },
    'np-classe-choisir': () => { $('#panneau [data-act="fermer"]')?.click(); cl.choixClasse = ''; montrer({ type: 'projet' }); },
    'np-classe-ok': el => { const c = classe(el.dataset.id); if (!c) return; cl.sansClasse = false; if (!c.projets.some(p => p.titre === H.titre)) c.projets.unshift({ titre: H.titre, type: st.recit === 'classique' ? 'Récit classique' : 'Récit à choix', href: '#/plan' }); fermerPanneau(); rendre(); toast(`« ${H.titre} » est le projet de ${c.nom}. Les élèves commencent quand vous leur attribuez un chapitre.`); }
  });
  Object.assign(A.changes, {
    'cl-aide-jamais': el => { cl.aideJamais = el.checked; },
    'cl-neuve-annee': el => { cl.neuve.annee = el.value; },
    'cl-hor-on': el => { const c = classe(cl.panneau.classe); c.horaires = el.checked ? [{ jours: [1, 2, 4, 5], de: '8 h 30', a: '16 h 30' }] : []; cl.enr = true; garder(rendre); viser('#cl-panneau [data-act="cl-hor-on"]'); },
    'cl-jour': el => { const p = classe(cl.panneau.classe).horaires[+el.dataset.i]; const j = +el.dataset.j; p.jours = el.checked ? [...p.jours, j].sort() : p.jours.filter(x => x !== j); cl.enr = true; const y = window.scrollY; rendre(); window.scrollTo(0, y); viser(`#cl-panneau [data-act="cl-jour"][data-i="${el.dataset.i}"][data-j="${j}"]`); },
    'cl-connu': el => { const L = lot(ici()); el.checked ? L.connus.add(el.value) : L.connus.delete(el.value); garder(rendre); viser(`[data-act="cl-connu"][value="${el.value}"]`); },
    'cl-pb-nom': el => { const v = el.value.trim(); if (!v) return; lot(ici()).lignes[+el.dataset.i].e.nom = v; garder(rendre); },
    'cl-impr-qui': el => { cl.impr.qui = el.value; garder(rendre); viser('[data-act="cl-impr-qui"]'); },
    'cl-impr-maison': el => { cl.impr.maison = el.checked; garder(rendre); viser('[data-act="cl-impr-maison"]'); },
    'np-qui': el => { cl.np.qui = el.value; $('[data-act="np-suite"]')?.removeAttribute('disabled'); },
    'np-recit': el => { cl.np.recit = el.value; $('[data-act="np-suite"]')?.removeAttribute('disabled'); },
    'np-classe': el => { cl.np.classe = el.value; },
    'np-classe-projet': el => { cl.choixClasse = el.value; const b = $('[data-act="np-classe-ok"]'); if (b) { b.dataset.id = el.value; b.disabled = false; } }
  });
  A.saisies = Object.assign(A.saisies || {}, {
    'cl-neuve-nom': el => { cl.neuve.nom = el.value; },
    'cl-prenom': el => { const c = classe(cl.panneau.classe); const e = c.eleves.find(x => x.id === cl.panneau.id); e.prenom = el.value.trim() || e.prenom; noteEnr(); const t = $('[data-cl-prenom]'); if (t) t.textContent = e.prenom; const b = $(`.cl-eleve[data-id="${e.id}"] .cl-eleve__nom b`); if (b) b.textContent = e.prenom; },
    'cl-nom': el => { const c = classe(cl.panneau.classe); const e = c.eleves.find(x => x.id === cl.panneau.id); e.nom = el.value.trim(); noteEnr(); const s = $(`.cl-eleve[data-id="${e.id}"] .cl-eleve__nom`); if (s) s.innerHTML = `<b>${esc(e.prenom)}</b>${e.nom ? ` ${esc(e.nom)}` : ''}`; },
    'cl-heure': el => { classe(cl.panneau.classe).horaires[+el.dataset.i][el.dataset.k] = el.value; noteEnr(); },
    'cl-lot-texte': el => { const L = lot(ici()); L.texte = el.value; const nb = lignesTexte(L.texte).length; const p = $('#cl-lot-nb b'); if (p) p.textContent = nb; const m = $('#cl-lot-nb span'); if (m) m.textContent = profilsConnus(ici()).length ? (nb > 1 ? 'nouveaux élèves' : 'nouvel élève') : `élève${pl(nb)}`; const b = $('[data-act="cl-lot-suite"]'); if (b) b.disabled = !(nb || L.connus.size); },
    'np-titre': el => { cl.np.titre = el.value; const b = $('[data-act="np-creer"]'); if (b) b.disabled = !el.value.trim(); }
  });

  /* ——— Raccord avec le reste de la maquette ————————————————————————— */
  const apres0 = A.apres;
  A.apres = page => {
    apres0?.(page);
    // Sans aucun projet, la barre du haut ne porte pas de nom de projet
    if (cl.projetsVides) $('.appbar__projet')?.remove();
    if (!['classes', 'nouveau'].includes(page) && cl.panneau && cl.panneau.type !== 'projet') cl.panneau = null;
    if (cl.panneau) ouvrirPanneau(false); else { const p = $('#cl-panneau'); if (p && !p.hidden) fermerPanneau(); }
    if (cl.attente) { const f = cl.attente; cl.attente = null; setTimeout(f, 0); }
  };
  const reinit0 = A.reinit;
  A.reinit = nom => { reinit0?.(nom); if (nom === 'page') { fermerDialogue(); if (!location.hash.includes('clpanneau') && !location.hash.includes('nppanneau')) cl.panneau = null; } };
  let chemin = route();
  window.addEventListener('hashchange', () => {
    const r = route(); const change = r.page !== chemin.page || r.id !== chemin.id || r.sous !== chemin.sous; chemin = r;
    if (change && ['classes', 'nouveau'].includes(r.page)) { fermerDialogue(); window.scrollTo(0, 0); }
  });
  document.addEventListener('click', ev => { if (cl.panneau && !ev.target.closest('#cl-panneau, #cl-dialogue, #toast, [data-act]')) fermerPanneau(); });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    const d = $('#cl-dialogue'); if (d && !d.hidden) fermerDialogue(); else if (cl.panneau) fermerPanneau();
  });
  // Entrée valide le nom demandé dans le récapitulatif, ou la ligne en cours de correction
  document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.matches('#cl-edit-prenom, #cl-edit-nom')) $('[data-act="cl-ligne-ok"]')?.click(); });

  Object.assign(A.pages, { classes: pageClasses, nouveau: pageNouveau });
  Object.assign(A.titres, {
    classes: () => { const r = route(); const c = classe(r.id); return c ? `${c.nom} ${c.annee} — Mes classes` : 'Mes classes'; },
    nouveau: () => 'Nouveau projet'
  });
})();
