/* Sixième lot : objets de l'histoire, feuille d'aventure, actions de jeu et dé (F04.2).
   Rien n'est vérifié par l'application : la liste d'objets aide les auteurs, l'action de jeu est un
   paragraphe à texte libre, la feuille est remplie par le lecteur et le dé n'est pas interprété.
   Simulation sans persistance ; dispositions proposées. */
(function () {
  const A = window.App;
  const { D, H, st, $, $$, esc, eleve, perso, choix, toast, rendre } = A;
  const L = () => A.livre; const X = () => A.editeur.x;
  const q0 = new URLSearchParams(location.hash.split('?')[1] || '');
  let uid = 0; const nid = p => p + (++uid);
  const v = (vous, tu) => eleve() ? tu : vous;
  const prof = 'Mme Laurent';
  const fr = t => esc(t).replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ');
  const brut = html => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/ /g, ' ').replace(/\s+/g, ' ').trim(); };

  /* ——— Contenu fictif : un livre à points de volonté et objets ———————————— */
  const J = {
    prep: true,
    // Enregistrés tels qu'ils s'écrivent dans une phrase : aucune grammaire automatique
    objets: [
      ['la clé d’argent', 'Petite clé trouvée dans le nid de la chouette. Elle ouvre la porte sans poignée.'],
      ['la carte du passeur', 'Carte de la cabane. Son trait bleu bouge pour montrer le chemin.'],
      ['la lanterne de secours', 'Dans le sac de Lou dès le départ. Elle s’allume avec une allumette.'],
      ['le couteau', 'Petit couteau de Lou, au manche de corne. Il coupe les cordes du grenier.'],
      ['la plume argentée', 'Plume laissée par la chouette messagère.'],
      ['la casquette de Marius', 'Casquette du père de Lou, oubliée sur la table de la cabane.'],
      ['la clochette fêlée', 'Clochette ramassée dans la clairière. Elle ne sonne que dans la brume.']
    ].map(([nom, desc]) => ({ id: nid('o'), nom, desc })),
    formules: ['Ajoute un point de volonté à ton héros.', 'Retire un point de volonté à ton héros.', 'Ajoute … à ton inventaire.', 'Raye … de ton inventaire.', 'Note … dans ce que tu découvres.', 'Lance le dé.'],
    // Par scène : nombre de paragraphes de récit placés avant l'action, puis son texte libre
    actions: {
      S005: [{ pos: 2, t: 'Ajoute la carte du passeur à ton inventaire.' }],
      S015: [{ pos: 1, t: 'Ajoute un point de volonté à ton héros.' }],
      S022: [{ pos: 1, t: 'Retire un point de volonté à ton héros.' }],
      S023: [{ pos: 2, t: 'Ajoute la clé d’argent à ton inventaire.' }],
      S034: [{ pos: 1, t: 'Note « la première lanterne » dans ce que tu découvres.' }],
      S041: [{ pos: 1, t: 'Retire un point de volonté à ton héros.' }],
      S052: [{ pos: 2, t: 'Lance le dé. Si tu fais 4 ou plus, tu peux sauter par-dessus la fente. Sinon, continue prudemment.' }]
    },
    feuille: {
      on: true, des: 1,
      sections: [
        { id: 'heros', type: 'compteurs', titre: 'Ton héros', compteurs: [{ id: 'vol', nom: 'Volonté', depart: 5 }] },
        { id: 'inv', type: 'liste', titre: 'Inventaire', lignes: 8 },
        { id: 'dec', type: 'notes', titre: 'Ce que tu découvres' }
      ]
    },
    regles: 'Avant de commencer, prends ta feuille d’aventure. Ton héros a 5 points de volonté et une lanterne de secours : écris-la dans ton inventaire.\nDans certains passages, un encadré te demande de changer ta feuille : ajouter ou retirer des points, noter ou rayer un objet. Fais-le avant de continuer ta lecture.\nSi ta volonté tombe à 0, Lou n’a plus le courage d’avancer : retourne au passage 1 et recommence l’aventure.\nQuand un passage te demande de lancer le dé, lance un dé à six faces, puis lis la suite du passage.'
  };
  const TYPES = { compteurs: ['Compteurs', 'i-plus', 'Un nom et une valeur de départ : volonté, temps, attributs.'], liste: ['Liste', 'i-liste', 'Des lignes à remplir : inventaire, compétences.'], notes: ['Notes libres', 'i-crayon', 'Numéros découverts, mots de passe, indices.'] };
  // Variantes pour les captures : livre à choix seuls (?jeu=sans), deux dés (?des=2)
  if (q0.get('jeu') === 'sans') { J.prep = false; J.objets = []; J.formules = []; J.actions = {}; J.feuille.on = false; J.feuille.des = 0; J.regles = ''; }
  if (q0.get('des')) J.feuille.des = +q0.get('des');
  // Feuille pas encore composée, alors que des scènes portent déjà des actions de jeu (?jeu=actions)
  if (q0.get('jeu') === 'actions') J.feuille.on = false;

  const actionsDe = (ref, toujours) => (toujours || choix() ? (J.actions[ref] || []) : []).filter(a => a.t.trim());
  function ecrire(ref, blocs) {
    let n = 0; const l = [];
    blocs.forEach(b => { if (b.t === 'p') n++; else if (b.t === 'action') l.push({ pos: n, t: brut(b.html), protege: !!b.protege }); });
    if (l.length) J.actions[ref] = l; else delete J.actions[ref];
  }
  const feuille = () => choix() && J.feuille.on && J.feuille.sections.length ? J.feuille : null;
  const regles = () => choix() ? J.regles.split('\n').map(s => s.trim()).filter(Boolean) : [];
  const sig = () => JSON.stringify([choix() ? J.actions : null, feuille(), regles()]);
  const touche = () => { const u = L().ui; if (u.pdf) u.change = true; };

  /* ——— L'action de jeu dans le livre, la lecture d'essai et le lecteur en ligne ———
     Même mise en valeur partout (F04-AC17) : un encadré fin et un crayon, sans couleur, lisible en noir et blanc. */
  const actionP = t => `<p class="action-jeu" contenteditable="false">${ic('i-noter')}<span>${fr(t)}</span></p>`;
  function paras(textes, actions) {
    const out = []; const n = textes.length;
    textes.forEach((t, i) => { actions.filter(a => Math.min(a.pos, n) === i).forEach(a => out.push(actionP(a.t))); out.push(`<p>${fr(t)}</p>`); });
    actions.filter(a => a.pos >= n).forEach(a => out.push(actionP(a.t)));
    return out.join('');
  }

  /* ——— Dans la copie : le paragraphe d'action de jeu ————————————————————— */
  const ed = () => X().ed;
  const blocAction = id => X().etat(ed().ref).blocs.find(b => b.id === id);
  function ilotAction(b, dr, poignee, flash) {
    const peut = dr.actionBloc(b); const verrou = eleve() && dr.ok && !peut; const protege = b.protege && !perso();
    const legende = verrou ? (protege ? `Préparé par ${prof} : tu écris avant ou après` : 'Action de jeu préparée : tu écris autour') : protege ? 'Action de jeu · protégée' : 'Action de jeu';
    const outils = peut ? `<div class="action-bloc__outils" role="toolbar" aria-label="Réglages de l’action de jeu">
        <button class="btn btn--petit" data-act="aj-formules" data-b="${b.id}" aria-haspopup="listbox">${ic('i-liste')}Formules…</button>
        <button class="btn btn--petit" data-act="aj-monter" data-b="${b.id}" aria-label="Monter l’action d’un bloc">${ic('i-chevron-haut')}Monter</button>
        <button class="btn btn--petit" data-act="aj-descendre" data-b="${b.id}" aria-label="Descendre l’action d’un bloc">${ic('i-chevron-bas')}Descendre</button>
        ${dr.proteger ? `<button class="btn btn--petit" data-act="aj-proteger" data-b="${b.id}" aria-pressed="${!!b.protege}">${ic(b.protege ? 'i-cadenas-ouvert' : 'i-cadenas')}${b.protege ? 'Retirer la protection' : 'Protéger'}</button>` : ''}
        <button class="btn btn--petit btn--danger action-bloc__suppr" data-act="aj-supprimer" data-b="${b.id}">${ic('i-corbeille')}Supprimer</button></div>` : '';
    return `<div class="action-bloc ${protege ? 'action-bloc--protege' : ''} ${verrou ? 'action-bloc--verrou' : ''} ${flash}" data-b="${b.id}">${poignee}${verrou || protege ? `<span class="marge" aria-hidden="true">${ic('i-cadenas')}</span>` : ''}
      <div class="action-bloc__cadre">${ic('i-noter')}<p class="action-bloc__texte recit" ${peut ? `contenteditable="true" data-saisie="aj-texte" data-b="${b.id}" spellcheck="true" lang="fr" role="textbox" aria-label="Action de jeu : consigne adressée au lecteur" data-placeholder="${v('Écrivez', 'Écris')} ce que le lecteur doit faire sur sa feuille…"` : ''}>${b.html}</p></div>
      <span class="repere-prepare">${legende}</span>${outils}</div>`;
  }
  function creerAction(texte, apres) {
    const x = X(); const e = x.etat(ed().ref); const snap = x.photo([ed().ref]);
    const b = { id: nid('ba'), t: 'action', html: esc(texte), protege: false };
    // Sans curseur dans le texte : après le dernier paragraphe de récit, avant les phrases de choix
    if (apres === undefined) { const i = e.blocs.map(k => k.t).lastIndexOf('p'); e.blocs.splice(i + 1, 0, b); } else x.inserer(e, b, apres);
    x.deriver(ed().ref);
    Object.assign(ed(), { pile: snap, saisie: null, panneau: null, encore: null, message: null, flash: b.id, focus: `.action-bloc[data-b="${b.id}"] .action-bloc__texte` });
    P.points = texte.includes('…'); rendre();
  }
  function bouger(id, sens) {
    const e = X().etat(ed().ref); const i = e.blocs.findIndex(b => b.id === id); const j = i + sens;
    if (j < 0 || j >= e.blocs.length) { toast(sens < 0 ? 'L’action est déjà en tête de la scène.' : 'L’action est déjà à la fin de la scène.'); return; }
    [e.blocs[i], e.blocs[j]] = [e.blocs[j], e.blocs[i]]; X().deriver(ed().ref);
    ed().focus = `.action-bloc[data-b="${id}"] [data-act="${sens < 0 ? 'aj-monter' : 'aj-descendre'}"]`; rendre();
  }

  /* ——— Fiche volante de la copie : objets de l'histoire, formules d'action ———
     Ouverte par /objet, /action ou les boutons de la barre ; posée près du curseur, sans quitter la scène. */
  let pop = null;
  const P = { mode: null, q: '', sel: 0, cible: null, dernier: null, nouveau: false, apres: undefined, remplace: null, retour: null, points: false };
  const adulte = () => !eleve();
  const objetsFiltres = () => { const q = P.q.trim().toLowerCase(); return q ? J.objets.filter(o => `${o.nom} ${o.desc}`.toLowerCase().includes(q)) : J.objets; };
  function listeObjets() {
    const l = objetsFiltres();
    if (!J.objets.length) return `<li class="fp-liste__vide">Aucun objet dans la liste pour l’instant.${adulte() ? '' : ` ${prof} la remplit avec la classe.`}</li>`;
    if (!l.length) return `<li class="fp-liste__vide">Aucun objet ne correspond à « ${esc(P.q)} ».</li>`;
    return l.map((o, i) => `<li role="option" id="fp-o-${i}" aria-selected="${i === P.sel}" data-act="fp-objet" data-id="${o.id}"><span class="fp-objet__nom recit">${esc(o.nom)}</span><span class="fp-objet__desc">${esc(o.desc)}</span></li>`).join('');
  }
  function popObjets() {
    const peutEcrire = !!P.cible;
    const pied = adulte()
      ? (P.nouveau
        ? `<div class="fp-nouveau"><label class="champ champ--plein"><span>Nom, tel qu’il s’écrit dans une phrase</span><input type="text" id="fp-nom" data-saisie="fp-nom" value="${esc(P.nom || '')}" placeholder="la lanterne sourde" maxlength="60" autocomplete="off"></label>
            <label class="champ champ--plein"><span>Courte description pour les auteurs</span><input type="text" id="fp-desc" data-saisie="fp-desc" value="${esc(P.desc || '')}" placeholder="Ce qu’elle est, à quoi elle sert" maxlength="120" autocomplete="off"></label>
            <div class="fp-nouveau__actions"><button class="btn btn--primaire btn--petit" data-act="fp-ajouter" ${(P.nom || '').trim() ? '' : 'disabled'}>${ic('i-plus')}${peutEcrire ? 'Ajouter à la liste et écrire ici' : 'Ajouter à la liste'}</button><button class="btn btn--discret btn--petit" data-act="fp-nouveau-non">Annuler</button></div></div>`
        : `<button class="btn btn--petit" data-act="fp-nouveau">${ic('i-plus')}Ajouter un objet à la liste</button><a class="lien" href="#/preparation" data-act="fp-preparation">Toute la liste dans la préparation</a>`)
      : `<p class="fp__lecture">${ic('i-cadenas')}<span>Liste tenue par ${prof}. Il manque un objet ? Parles-en en classe.</span></p>`;
    return `<header class="fp__tete">${ic('i-sac')}<h3 id="fp-titre">Objets de l’histoire</h3><span class="compte">${J.objets.length}</span><button class="btn btn--discret fp__fermer" data-act="fp-fermer" aria-label="Fermer la liste">${ic('i-fermer')}</button></header>
      <label class="cx-q fp-q">${ic('i-loupe')}<span class="vh">Chercher un objet</span><input type="search" id="fp-q" data-saisie="fp-q" value="${esc(P.q)}" placeholder="Chercher un objet" autocomplete="off" role="combobox" aria-controls="fp-liste" aria-expanded="true"></label>
      <ul class="fp-liste" role="listbox" id="fp-liste" aria-labelledby="fp-titre">${listeObjets()}</ul>
      <p class="fp__aide">${peutEcrire ? `${ic('i-crayon')}<span>Le nom s’écrit dans ${v('votre', 'ton')} texte comme du texte ordinaire : ${v('corrigez', 'corrige')} ensuite « de la clé », « sa clé ».</span>` : `<span>${v('Placez', 'Place')} le curseur dans ${v('le', 'ton')} texte pour y écrire un objet.</span>`}</p>
      <footer class="fp__pied">${pied}</footer>`;
  }
  function popFormules() {
    const lignes = [`<li role="option" id="fp-o-0" aria-selected="${P.sel === 0}" data-act="fp-formule" data-i="-1"><span class="fp-formule__vide">${ic('i-crayon')}${P.remplace ? 'Effacer et réécrire' : 'Paragraphe vide, à écrire'}</span></li>`,
      ...J.formules.map((f, i) => `<li role="option" id="fp-o-${i + 1}" aria-selected="${P.sel === i + 1}" data-act="fp-formule" data-i="${i}"><span class="recit">${fr(f)}</span></li>`)].join('');
    const pied = adulte()
      ? (P.nouveau
        ? `<div class="fp-nouveau"><label class="champ champ--plein"><span>Nouvelle formule</span><input type="text" id="fp-nom" data-saisie="fp-nom" value="${esc(P.nom || '')}" placeholder="Ajoute un point de courage à ton héros." maxlength="140" autocomplete="off"></label>
            <div class="fp-nouveau__actions"><button class="btn btn--primaire btn--petit" data-act="fp-ajouter" ${(P.nom || '').trim() ? '' : 'disabled'}>${ic('i-plus')}Ajouter à la liste et l’utiliser</button><button class="btn btn--discret btn--petit" data-act="fp-nouveau-non">Annuler</button></div></div>`
        : `<button class="btn btn--petit" data-act="fp-nouveau">${ic('i-plus')}Ajouter une formule à la liste</button><a class="lien" href="#/preparation" data-act="fp-preparation">Les formules dans la préparation</a>`)
      : `<p class="fp__lecture">${ic('i-cadenas')}<span>Formules tenues par ${prof}. Tu peux aussi écrire la tienne dans un paragraphe vide.</span></p>`;
    return `<header class="fp__tete">${ic('i-noter')}<h3 id="fp-titre">${P.remplace ? 'Reprendre une formule' : 'Action de jeu'}</h3><button class="btn btn--discret fp__fermer" data-act="fp-fermer" aria-label="Fermer sans rien créer">${ic('i-fermer')}</button></header>
      <p class="fp__aide fp__aide--haut"><span>Un paragraphe à part, adressé au lecteur, encadré dans le livre comme à l’écran. Son texte reste libre : l’application ne l’interprète pas.</span></p>
      <ul class="fp-liste fp-liste--formules" role="listbox" id="fp-liste" tabindex="0" aria-labelledby="fp-titre" aria-activedescendant="fp-o-${P.sel}">${lignes}</ul>
      <footer class="fp__pied">${pied}</footer>`;
  }
  const nbOptions = () => P.mode === 'objets' ? objetsFiltres().length : J.formules.length + 1;
  function rendrePop() { pop.innerHTML = P.mode === 'objets' ? popObjets() : popFormules(); pop.setAttribute('aria-label', P.mode === 'objets' ? 'Objets de l’histoire' : 'Action de jeu'); }
  function ouvrirPop(mode, opts = {}) {
    if (!pop) { pop = document.createElement('section'); pop.className = 'fiche-pop'; document.body.appendChild(pop); }
    X().cacherSlash();
    Object.assign(P, { mode, q: '', sel: 0, nouveau: false, nom: '', desc: '', cible: null, apres: undefined, remplace: null, retour: document.activeElement }, opts);
    rendrePop(); pop.hidden = false;
    const larg = Math.min(mode === 'objets' ? 400 : 380, document.documentElement.clientWidth - 24); pop.style.width = larg + 'px';
    const a = opts.ancre || { left: 24, top: 200 };
    pop.style.left = Math.max(12, Math.min(a.left, window.scrollX + document.documentElement.clientWidth - larg - 12)) + 'px'; pop.style.top = a.top + 'px';
    (mode === 'objets' ? $('#fp-q') : $('#fp-liste')).focus({ preventScroll: true });
  }
  function fermerPop(retour = true) {
    if (!pop || pop.hidden) return; pop.hidden = true;
    if (!retour) return;
    const c = P.cible;
    if (c && document.contains(c.startContainer)) { const z = (c.startContainer.nodeType === 1 ? c.startContainer : c.startContainer.parentElement).closest('[contenteditable="true"]'); z?.focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(c); }
    else if (P.retour && document.contains(P.retour)) P.retour.focus?.({ preventScroll: true });
  }
  const sousAncre = el => { const r = el.getBoundingClientRect(); return { left: r.left + window.scrollX, top: r.bottom + window.scrollY + 6 }; };
  // Écrit le nom à l'endroit du curseur, comme du texte ordinaire (F04-AC15)
  function ecrireDansTexte(nom) {
    const c = P.cible; if (!c || !document.contains(c.startContainer)) return false;
    const z = (c.startContainer.nodeType === 1 ? c.startContainer : c.startContainer.parentElement).closest('[contenteditable="true"]'); if (!z) return false;
    z.focus({ preventScroll: true }); const s = getSelection(); s.removeAllRanges(); s.addRange(c);
    const avant = document.createRange(); avant.selectNodeContents(c.startContainer.nodeType === 1 ? c.startContainer : c.startContainer.parentElement); avant.setEnd(c.startContainer, c.startOffset);
    const t = avant.toString(); const espace = t && !/[\s’'(« ]$/.test(t) ? ' ' : '';
    if (!document.execCommand('insertText', false, espace + nom)) { c.insertNode(document.createTextNode(espace + nom)); z.dispatchEvent(new InputEvent('input', { bubbles: true })); }
    return true;
  }
  function choisirObjet(o) {
    const ecrit = ecrireDansTexte(o.nom); pop.hidden = true;
    if (!ecrit) toast(`« ${o.nom} » : ${v('placez', 'place')} le curseur dans le texte pour l’y écrire.`);
  }
  function choisirFormule(i) {
    const texte = i < 0 ? '' : J.formules[i]; pop.hidden = true;
    if (P.remplace) {
      const b = blocAction(P.remplace); if (!b) return; ed().pile = X().photo([ed().ref]); b.html = esc(texte); X().deriver(ed().ref);
      ed().focus = `.action-bloc[data-b="${b.id}"] .action-bloc__texte`; P.points = texte.includes('…'); rendre(); return;
    }
    creerAction(texte, P.apres);
  }

  /* ——— Préparation : rubrique facultative « Objets et formules » ————————— */
  const pj = { objet: null, formule: null, plis: new Set() };
  // Capture : ?plis=feuille.regles ouvre ces deux parties de la rubrique
  (new URLSearchParams(location.hash.split('?')[1] || '').get('plis') || '').split('.').filter(Boolean).forEach(k => pj.plis.add(k));
  document.addEventListener('toggle', ev => { const k = ev.target.dataset?.pli; if (k) ev.target.open ? pj.plis.add(k) : pj.plis.delete(k); }, true);
  function rubrique() {
    if (!J.prep) return `<section class="rubrique--jeu rubrique-invite"><div><h2>Objets et formules <span class="fiche-tete__fin">rubrique facultative</span></h2>
        <p>${choix() ? 'Pour un livre à objets, à compteurs ou à dés : la classe décide ici du nom exact de chaque objet et des demandes au lecteur qui reviennent, pour que tous les auteurs les écrivent de la même façon.' : 'Pour que tous les auteurs écrivent de la même façon le nom des objets qui reviennent dans le récit.'}</p></div>
        <button class="btn" data-act="pj-activer">${ic('i-plus')}Ajouter cette rubrique</button></section>`;
    const objet = o => pj.objet === o.id
      ? `<li class="jeu-ligne jeu-ligne--edition"><label class="champ"><span>Nom, tel qu’il s’écrit dans une phrase</span><input type="text" id="pj-nom" value="${esc(o.nom)}" maxlength="60"></label><label class="champ"><span>Description pour les auteurs</span><input type="text" id="pj-desc" value="${esc(o.desc)}" maxlength="120"></label>
          <p class="jeu-ligne__note"><span>Renommer ne modifie pas les textes déjà écrits : la recherche des scènes retrouve « ${esc(o.nom)} ».</span></p>
          <div class="fiche-actions"><button class="btn btn--petit btn--primaire" data-act="pj-objet-ok" data-id="${o.id}">Enregistrer</button><button class="btn btn--petit" data-act="pj-annuler">Annuler</button><button class="btn btn--petit btn--danger" data-act="pj-objet-retirer" data-id="${o.id}">${ic('i-corbeille')}Supprimer de la liste</button></div></li>`
      : `<li class="jeu-ligne"><span class="jeu-ligne__nom recit">${esc(o.nom)}</span><span class="jeu-ligne__desc">${esc(o.desc)}</span><button class="lien" data-act="pj-objet" data-id="${o.id}" aria-label="Modifier ${esc(o.nom)}">Modifier</button></li>`;
    const formule = (f, i) => pj.formule === i
      ? `<li class="jeu-ligne jeu-ligne--edition"><label class="champ"><span>Formule</span><input type="text" id="pj-formule" value="${esc(f)}" maxlength="140"></label>
          <p class="jeu-ligne__note"><span>Corriger une formule ne modifie pas les paragraphes déjà écrits.</span></p>
          <div class="fiche-actions"><button class="btn btn--petit btn--primaire" data-act="pj-formule-ok" data-i="${i}">Enregistrer</button><button class="btn btn--petit" data-act="pj-annuler">Annuler</button><button class="btn btn--petit btn--danger" data-act="pj-formule-retirer" data-i="${i}">${ic('i-corbeille')}Supprimer</button></div></li>`
      : `<li class="jeu-ligne jeu-ligne--formule"><span class="action-jeu action-jeu--liste">${ic('i-noter')}<span>${fr(f)}</span></span><button class="lien" data-act="pj-formule" data-i="${i}" aria-label="Modifier la formule">Modifier</button></li>`;
    const colObjets = `<section class="jeu-col" aria-labelledby="pj-t-objets"><h3 id="pj-t-objets">${ic('i-sac')}Objets de l’histoire <span class="compte">${J.objets.length}</span></h3>
        <p class="jeu-aide">Écrits comme dans une phrase, avec leur article. ${perso() ? 'Vous les retrouvez' : 'Les élèves les consultent'} depuis la scène, par <kbd>/objet</kbd> ou le bouton Objets${perso() ? '' : ', sans pouvoir les modifier'}. Le lecteur ne voit jamais cette liste.</p>
        <ul class="jeu-liste">${J.objets.map(objet).join('')}</ul>
        <div class="jeu-ajout"><label class="champ"><span>Nouvel objet</span><input type="text" id="pj-n-nom" placeholder="la lanterne sourde" maxlength="60"></label><label class="champ"><span>Description</span><input type="text" id="pj-n-desc" placeholder="Ce qu’il est, à quoi il sert" maxlength="120"></label><button class="btn" data-act="pj-objet-ajouter">${ic('i-plus')}Ajouter</button></div></section>`;
    const colFormules = choix() ? `<section class="jeu-col" aria-labelledby="pj-t-formules"><h3 id="pj-t-formules">${ic('i-noter')}Formules d’action <span class="compte">${J.formules.length}</span></h3>
        <p class="jeu-aide">Les demandes au lecteur qui reviennent souvent. Elles sont proposées par <kbd>/action</kbd> et le bouton Action de jeu, puis restent modifiables dans chaque scène. « … » marque ce qu’il reste à compléter.</p>
        <ul class="jeu-liste">${J.formules.map(formule).join('')}</ul>
        <div class="jeu-ajout jeu-ajout--une"><label class="champ"><span>Nouvelle formule</span><input type="text" id="pj-n-formule" placeholder="Ajoute un point de courage à ton héros." maxlength="140"></label><button class="btn" data-act="pj-formule-ajouter">${ic('i-plus')}Ajouter</button></div></section>` : '';
    return `<section class="carnet-fiche rubrique rubrique--jeu"><header><h2>${choix() ? 'Objets et formules' : 'Objets de l’histoire'}</h2><span class="fiche-tete__fin">rubrique facultative</span></header><div class="carnet-fiche__corps">
        <p class="rubrique__question">${choix() ? 'Quels objets reviennent dans notre histoire, et que demande-t-on au lecteur de noter ?' : 'Quels objets reviennent dans notre histoire, et comment les appelle-t-on ?'}</p>
        <div class="jeu-cols ${choix() ? '' : 'jeu-cols--une'}">${colObjets}${colFormules}</div>
        ${choix() ? `<details class="jeu-pli" data-pli="feuille" ${pj.plis.has('feuille') ? 'open' : ''}><summary>${ic('i-feuille')}Feuille d’aventure du lecteur <span class="jeu-pli__etat">${carteFeuille(false).statut}</span></summary>
          <label class="inter"><input type="checkbox" role="switch" data-act="fa-on" ${J.feuille.on ? 'checked' : ''}><span class="inter__piste" aria-hidden="true"></span><span>Dans le livre et en ligne</span></label>${edition(false)}</details>
        <details class="jeu-pli" data-pli="regles" ${pj.plis.has('regles') ? 'open' : ''}><summary>${ic('i-noter')}Règles du jeu <span class="jeu-pli__etat">${regles().length ? 'écrites' : 'facultatives'}</span></summary>${editionRegles()}</details>` : ''}
      </div></section>`;
  }

  /* ——— Destination Livre : la page « Feuille d'aventure » et sa composition ——— */
  const lignesVides = n => Array.from({ length: n }, () => '<li></li>').join('');
  function pageFeuille(f = J.feuille) {
    return `<h3>Feuille d’aventure</h3>${f.sections.map(s => {
      if (s.type === 'compteurs') return `<section class="plf-section"><h4>${esc(s.titre || 'Compteurs')}</h4><div class="plf-compteurs">${s.compteurs.map(c => `<div class="plf-compteur"><span class="plf-compteur__nom">${esc(c.nom || 'Compteur')}</span><span class="plf-compteur__dep">au départ : ${c.depart}</span><span class="plf-compteur__case"></span></div>`).join('')}</div></section>`;
      if (s.type === 'liste') return `<section class="plf-section"><h4>${esc(s.titre || 'Liste')}</h4><ol class="plf-lignes">${lignesVides(s.lignes)}</ol></section>`;
      return `<section class="plf-section plf-section--notes"><h4>${esc(s.titre || 'Notes')}</h4><div class="plf-notes"></div></section>`;
    }).join('')}<p class="plf-pied">Écris au crayon : tu pourras gommer et rejouer.</p>`;
  }
  const blocFeuille = () => feuille() ? `<div data-seule="feuille" data-coule="1" class="pl-feuille">${pageFeuille()}</div>` : '';
  const blocRegles = () => regles().length ? `<h4 class="pl-mode__regles">Règles du jeu</h4>${regles().map(p => `<p>${fr(p)}</p>`).join('')}` : '';
  const resume = f => f.sections.map(s => s.type === 'compteurs' ? s.compteurs.map(c => `${c.nom} ${c.depart}`).join(', ') : s.titre).filter(Boolean).join(' · ');
  function vignette() {
    return J.feuille.sections.map(s => s.type === 'compteurs' ? '<span class="vg__case"></span>' : s.type === 'liste' ? '<span class="vg__l"></span><span class="vg__l"></span><span class="vg__l"></span>' : '<span class="vg__bloc"></span>').join('');
  }
  function edition(image) {
    const f = J.feuille; const n = f.sections.length;
    const section = (s, i) => {
      let corps = '';
      if (s.type === 'compteurs') corps = `<ul class="fa-compteurs">${s.compteurs.map(c => `<li><label class="champ"><span>Nom</span><input type="text" value="${esc(c.nom)}" data-saisie="fa-cnom" data-s="${s.id}" data-c="${c.id}" maxlength="24"></label><label class="champ champ--nombre"><span>Départ</span><input type="number" min="0" max="99" value="${c.depart}" data-saisie="fa-cdep" data-s="${s.id}" data-c="${c.id}"></label>${s.compteurs.length > 1 ? `<button class="btn btn--discret btn--petit" data-act="fa-compteur-retirer" data-s="${s.id}" data-c="${c.id}" aria-label="Supprimer le compteur ${esc(c.nom)}">${ic('i-corbeille')}</button>` : ''}</li>`).join('')}</ul><button class="lien" data-act="fa-compteur" data-s="${s.id}">Ajouter un compteur</button>`;
      else if (s.type === 'liste') corps = `<label class="champ champ--nombre champ--ligne"><span>Lignes sur la page imprimée</span><input type="number" min="3" max="14" value="${s.lignes}" data-saisie="fa-lignes" data-s="${s.id}"></label><p class="champ__aide">En ligne, la liste s’allonge au fil de la lecture.</p>`;
      else corps = '<p class="champ__aide">Un cadre libre : il occupe la place qui reste sur la page.</p>';
      return `<li class="fa-section"><div class="fa-section__tete"><span class="fa-type">${ic(TYPES[s.type][1])}${TYPES[s.type][0]}</span>
          <label class="champ fa-section__titre"><span class="vh">Titre de la section</span><input type="text" value="${esc(s.titre)}" data-saisie="fa-titre" data-s="${s.id}" maxlength="40" placeholder="Titre de la section"></label>
          <span class="fa-section__ordre"><button class="btn btn--discret btn--petit" data-act="fa-monter" data-s="${s.id}" ${i ? '' : 'disabled'} aria-label="Monter la section ${esc(s.titre)}">${ic('i-chevron-haut')}</button><button class="btn btn--discret btn--petit" data-act="fa-descendre" data-s="${s.id}" ${i < n - 1 ? '' : 'disabled'} aria-label="Descendre la section ${esc(s.titre)}">${ic('i-chevron-bas')}</button><button class="btn btn--discret btn--petit" data-act="fa-retirer" data-s="${s.id}" aria-label="Supprimer la section ${esc(s.titre)}">${ic('i-corbeille')}</button></span></div>
        <div class="fa-section__corps">${corps}</div></li>`;
    };
    return `<div class="fa">
      <div class="fa__reglages">
        ${image ? '<h4 class="fa__titre">Sections de la feuille, pour le lecteur en ligne</h4>' : ''}<ol class="fa-sections" aria-label="Sections de la feuille">${f.sections.map(section).join('')}</ol>
        ${n ? '' : '<p class="fa-vide">La feuille n’a encore aucune section : elle ne sera ni imprimée ni proposée en ligne.</p>'}
        <div class="fa-ajout"><p>Ajouter une section</p><div>${Object.entries(TYPES).map(([k, [lib, icone, aide]]) => `<button class="btn" data-act="fa-ajouter" data-v="${k}" title="${aide}">${ic(icone)}${lib}</button>`).join('')}</div></div>
        <fieldset class="choix-seg fa-des"><legend>Dé de la feuille en ligne</legend>${[['0', 'Aucun dé'], ['1', 'Un dé'], ['2', 'Deux dés']].map(([k, lib]) => `<label><input type="radio" name="fa-des" value="${k}" data-act="fa-des" ${String(f.des) === k ? 'checked' : ''}><span>${lib}</span></label>`).join('')}</fieldset>
        <p class="reglage__note">${ic('i-de')}<span>Dés à six faces. Le résultat est affiché au lecteur, jamais interprété : il lit la règle dans le passage et choisit lui-même la suite. Avec le livre imprimé, il prend un vrai dé.</span></p>
        <p class="reglage__note"><span>${image ? 'Votre image est imprimée ; ces sections sont remplies en ligne par le lecteur.' : 'La même feuille est imprimée et remplie en ligne par le lecteur.'} Rien n’y est vérifié, et aucun objet de votre liste ne lui est proposé.</span></p>
      </div>
      <div class="fa__apercu"><p class="fa__apercu-t">${image ? 'Page imprimée : votre image, à l’intérieur des marges' : 'Page imprimée, après « Comment lire ce livre »'}</p>
        <article class="pl pl--recto pl--feuille fa-page" aria-label="Aperçu de la page Feuille d’aventure"><div class="pl__corps">${image ? '<div class="pl-pageimg"><img src="assets/img/feuille-exemple.svg" alt=""></div>' : `<div class="pl-feuille" id="fa-page">${pageFeuille()}</div>`}</div></article></div>
    </div>`;
  }
  const carteFeuille = image => ({
    statut: !J.feuille.on ? 'Facultative · absente de ce livre' : `${J.feuille.sections.length} section${J.feuille.sections.length > 1 ? 's' : ''}${J.feuille.des ? ` · ${J.feuille.des === 2 ? 'deux dés' : 'un dé'} en ligne` : ''}`,
    on: J.feuille.on, vignette: `<div class="vg vg--feuille" aria-hidden="true"><span class="vg__h">Feuille d’aventure</span>${vignette()}</div>`, edition: edition(image)
  });
  const editionRegles = () => `<label class="champ"><span>Règles du jeu <em>facultatif</em></span><textarea rows="7" data-saisie="livre-regles" placeholder="Valeurs de départ, ce que demandent les encadrés, quand lancer le dé…">${esc(J.regles)}</textarea></label>
    <p class="champ__aide">Imprimées à la suite, sous le titre « Règles du jeu ». En ligne, le mode d’emploi est celui de l’écran ; vos règles le suivent, mot pour mot, et restent à portée du lecteur pendant toute la lecture.</p>`;
  const majApercu = () => { const p = $('#fa-page'); if (p) p.innerHTML = pageFeuille(); };
  const sec = id => J.feuille.sections.find(s => s.id === id);
  const refaire = focus => { L().ui.scroll = window.scrollY; apresFocus = focus || null; touche(); rendre(); };
  let apresFocus = null;

  /* ——— Lecteur en ligne : la feuille que le lecteur remplit, le dé, les règles ———
     Conservée comme la reprise de lecture (appareil, ou profil de l'élève si c'est réalisable) ; simulée ici. */
  const F = { sig: null, ouverte: null, c: {}, l: {}, n: {}, de: null };
  function remettre(f) {
    F.c = {}; F.l = {}; F.n = {}; F.de = null;
    f.sections.forEach(s => { if (s.type === 'compteurs') s.compteurs.forEach(c => { F.c[c.id] = c.depart; }); else if (s.type === 'liste') F.l[s.id] = []; else F.n[s.id] = ''; });
  }
  function etatFeuille(f) {
    const s = JSON.stringify(f); if (F.sig === s) return;
    const premier = F.sig === null; F.sig = s; remettre(f);
    if (!premier) return;
    // Drapeaux d'URL pour les captures : ?fv=4 (premier compteur), ?fi=a|b (première liste), ?fn=… (premières notes), ?fd=3.5, ?fo=1
    const c0 = f.sections.find(x => x.type === 'compteurs')?.compteurs[0]; const l0 = f.sections.find(x => x.type === 'liste'); const n0 = f.sections.find(x => x.type === 'notes');
    if (q0.get('fv') && c0) F.c[c0.id] = +q0.get('fv');
    if (q0.get('fi') && l0) F.l[l0.id] = q0.get('fi').split('|');
    if (q0.get('fn') && n0) F.n[n0.id] = q0.get('fn');
    if (q0.get('fd')) F.de = q0.get('fd').split('.').map(Number);
    if (q0.get('fo')) F.ouverte = q0.get('fo') === '1';
  }
  const large = () => matchMedia('(min-width: 1100px)').matches;
  const ouverte = () => F.ouverte ?? large();
  const PIPS = { 1: [[20, 20]], 2: [[12, 12], [28, 28]], 3: [[12, 12], [20, 20], [28, 28]], 4: [[12, 12], [28, 12], [12, 28], [28, 28]], 5: [[12, 12], [28, 12], [20, 20], [12, 28], [28, 28]], 6: [[12, 11], [28, 11], [12, 20], [28, 20], [12, 29], [28, 29]] };
  const face = n => `<svg class="lf-face" viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="2" width="36" height="36" rx="8"/>${(PIPS[n] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.3"/>`).join('')}</svg>`;
  const resultat = d => !d ? 'Le dé n’a pas encore été lancé.' : d.length > 1 ? `Tu as fait ${d[0]} et ${d[1]} : ${d[0] + d[1]} en tout.` : `Tu as fait ${d[0]}.`;
  const lignesDe = (s) => { const l = F.l[s.id] || []; const n = Math.max(4, l.filter(x => x.trim()).length + 1, l.length); return Array.from({ length: n }, (_, i) => l[i] || ''); };
  const ligneHTML = (s, t, i) => `<li><input type="text" value="${esc(t)}" data-saisie="lf-ligne" data-s="${s.id}" data-i="${i}" aria-label="${esc(s.titre)}, ligne ${i + 1}" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="48"></li>`;
  function resumeLecteur(f) {
    return f.sections.map(s => s.type === 'compteurs' ? s.compteurs.map(c => `${esc(c.nom)} <b>${F.c[c.id]}</b>`).join(' · ') : s.type === 'liste' ? `${esc(s.titre)} <b>${(F.l[s.id] || []).filter(x => x.trim()).length}</b>` : '').filter(Boolean).join(' · ');
  }
  function feuilleLecteur(V, essai) {
    const f = V.feuille; if (!f) return ''; etatFeuille(f);
    const sections = f.sections.map(s => {
      if (s.type === 'compteurs') return `<section class="lf-section"><h3>${esc(s.titre)}</h3>${s.compteurs.map(c => `<div class="lf-compteur"><span class="lf-compteur__nom">${esc(c.nom)}<small>au départ : ${c.depart}</small></span>
          <span class="lf-compteur__reglage"><button class="lf-pm" data-act="lf-moins" data-c="${c.id}" aria-label="Retirer 1 à ${esc(c.nom)}" ${F.c[c.id] <= 0 ? 'disabled' : ''}>${ic('i-moins')}</button><output class="lf-compteur__v" id="lf-c-${c.id}" aria-live="polite" aria-label="${esc(c.nom)}">${F.c[c.id]}</output><button class="lf-pm" data-act="lf-plus" data-c="${c.id}" aria-label="Ajouter 1 à ${esc(c.nom)}">${ic('i-plus')}</button></span></div>`).join('')}</section>`;
      if (s.type === 'liste') return `<section class="lf-section"><h3>${esc(s.titre)}</h3><ol class="lf-lignes" id="lf-l-${s.id}">${lignesDe(s).map((t, i) => ligneHTML(s, t, i)).join('')}</ol></section>`;
      return `<section class="lf-section"><h3><label for="lf-n-${s.id}">${esc(s.titre)}</label></h3><textarea class="lf-notes" id="lf-n-${s.id}" rows="4" data-saisie="lf-notes" data-s="${s.id}" spellcheck="false" autocomplete="off">${esc(F.n[s.id] || '')}</textarea></section>`;
    }).join('');
    const de = f.des ? `<section class="lf-section lf-de"><h3>${f.des > 1 ? 'Dés' : 'Dé'}</h3><div class="lf-de__ligne"><div class="lf-de__faces" id="lf-faces">${(F.de || Array(f.des).fill(0)).map(face).join('')}</div>
        <button class="btn" data-act="lf-lancer" data-n="${f.des}">${ic('i-de')}Lancer ${f.des > 1 ? 'les dés' : 'le dé'}</button></div>
        <p class="lf-de__res ${F.de ? '' : 'lf-de__res--attente'}" id="lf-res" role="status">${resultat(F.de)}</p><p class="lf-de__aide">Le dé ne décide de rien : lis la règle dans le passage, puis choisis toi-même.</p></section>` : '';
    const garde = essai ? 'Lecture d’essai : la feuille n’est pas conservée.' : st.acces === 'classe' ? 'Ta feuille est retenue avec ton prénom.' : st.acces === 'apercu' ? 'Prévisualisation : rien n’est retenu.' : 'Ta feuille est retenue sur cet appareil.';
    return `<div class="lf-voile" data-act="lf-ranger" aria-hidden="true"></div>
      <aside class="lec-feuille" id="lec-feuille" aria-labelledby="lf-titre">
        <header class="lf__tete"><h2 id="lf-titre">Feuille d’aventure</h2><button class="btn btn--discret btn--petit" data-act="lf-ranger" aria-label="Ranger la feuille d’aventure">${ic('i-fermer')}<span>Ranger</span></button></header>
        <div class="lf__corps">${sections}${de}</div>
        <footer class="lf__pied">${V.regles.length ? `<a class="lien" href="#/lire/comment" data-act="lf-regles">${ic('i-aide')}Règles du jeu</a>` : ''}<span>${garde} Tu la remplis toi-même : rien n’est vérifié.</span></footer>
      </aside>
      <button class="lf-barre" data-act="lf-ouvrir" aria-expanded="${ouverte()}" aria-controls="lec-feuille">${ic('i-feuille')}<span class="lf-barre__t">Ma feuille</span><span class="lf-barre__resume" id="lf-resume">${resumeLecteur(f)}</span>${ic('i-chevron-haut')}</button>`;
  }
  const boutonFeuille = V => V.feuille ? `<button class="btn btn--discret lf-bouton" data-act="lf-basculer" aria-pressed="${ouverte()}" aria-controls="lec-feuille">${ic('i-feuille')}<span class="lec-lib">Feuille</span></button>` : '';
  const reglesLecteur = V => V.regles.length ? `<h2 class="lec-regles" id="regles">Règles du jeu</h2><div class="lec-texte">${V.regles.map(p => `<p>${fr(p)}</p>`).join('')}</div>` : '';
  const majResume = () => { const V = lecV; const r = $('#lf-resume'); if (r && V?.feuille) r.innerHTML = resumeLecteur(V.feuille); };
  let lecV = null;
  function basculer(on) {
    F.ouverte = on; const l = $('.lec'); if (!l) return;
    l.classList.toggle('lec--feuille', on);
    $$('[aria-controls="lec-feuille"]').forEach(b => b.setAttribute(b.hasAttribute('aria-pressed') ? 'aria-pressed' : 'aria-expanded', on));
    if (on && !large()) $('.lec-feuille .lf__tete .btn')?.focus({ preventScroll: true });
    if (!on && !large()) $('.lf-barre')?.focus({ preventScroll: true });
  }
  function lancer(n) {
    const tire = () => Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6));
    const faces = $('#lf-faces'); const res = $('#lf-res'); if (!faces) return;
    const fin = () => { F.de = tire(); faces.innerHTML = F.de.map(face).join(''); faces.classList.remove('est-lance'); res.classList.remove('lf-de__res--attente'); res.textContent = resultat(F.de); };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { fin(); return; }
    faces.classList.add('est-lance'); res.textContent = '…'; let k = 0;
    const t = setInterval(() => { faces.innerHTML = tire().map(face).join(''); if (++k >= 6) { clearInterval(t); fin(); } }, 75);
  }

  /* ——— Actions, saisies et clavier ————————————————————————————————————— */
  Object.assign(A.actions, {
    // Copie : actions de jeu
    'aj-ouvrir': el => { const p = X().positionCurseur(); ouvrirPop('formules', { apres: p !== undefined ? p : ed().curseur, ancre: sousAncre(el) }); },
    'aj-formules': el => { ouvrirPop('formules', { remplace: el.dataset.b, ancre: sousAncre(el) }); },
    'aj-monter': el => bouger(el.dataset.b, -1),
    'aj-descendre': el => bouger(el.dataset.b, 1),
    'aj-proteger': el => { const b = blocAction(el.dataset.b); b.protege = !b.protege; X().deriver(ed().ref); ed().focus = `.action-bloc[data-b="${b.id}"] [data-act="aj-proteger"]`; rendre(); toast(b.protege ? 'Action de jeu protégée : aucun élève ne peut la modifier ni la supprimer, quel que soit son profil.' : 'Protection retirée : les élèves au profil « écriture et organisation » peuvent de nouveau la modifier.'); },
    'aj-supprimer': el => {
      const x = X(); const ref = ed().ref; const e = x.etat(ref); const b = blocAction(el.dataset.b); const snap = x.photo([ref]);
      e.blocs = e.blocs.filter(k => k !== b); x.deriver(ref);
      Object.assign(ed(), { pile: snap, focus: '[data-act="cx-annuler"]', message: { icone: 'i-corbeille', html: `<b>1 action de jeu supprimée.</b> « ${esc(brut(b.html)) || 'Paragraphe vide'} » ne figure plus dans la scène.` } }); rendre();
    },
    // Copie : objets de l'histoire
    'obj-ouvrir': el => { const c = P.dernier && document.contains(P.dernier.startContainer) ? P.dernier : null; ouvrirPop('objets', { cible: c, ancre: sousAncre(el) }); },
    'fp-fermer': () => fermerPop(),
    'fp-objet': el => { const o = J.objets.find(k => k.id === el.dataset.id); if (o) choisirObjet(o); },
    'fp-formule': el => choisirFormule(+el.dataset.i),
    'fp-nouveau': () => { P.nouveau = true; P.nom = P.mode === 'objets' && !objetsFiltres().length ? P.q.trim() : ''; P.desc = ''; rendrePop(); $('#fp-nom').focus(); },
    'fp-nouveau-non': () => { P.nouveau = false; rendrePop(); (P.mode === 'objets' ? $('#fp-q') : $('#fp-liste')).focus(); },
    'fp-ajouter': () => {
      const nom = (P.nom || '').trim(); if (!nom) return;
      if (P.mode === 'objets') {
        const o = { id: nid('o'), nom, desc: (P.desc || '').trim() }; J.objets.push(o);
        const ecrit = ecrireDansTexte(nom); pop.hidden = true;
        toast(`« ${nom} » figure maintenant dans les objets de l’histoire, à la préparation.${ecrit ? ` Vous êtes toujours dans ${ed().ref}.` : ''}`);
      } else { J.formules.push(nom); choisirFormule(J.formules.length - 1); toast('Formule ajoutée à la liste de la préparation.'); }
    },
    'fp-preparation': () => fermerPop(false),
    // Préparation
    'pj-activer': () => { J.prep = true; rendre(); },
    'pj-objet': el => { pj.objet = el.dataset.id; pj.formule = null; rendre(); $('#pj-nom')?.focus(); },
    'pj-formule': el => { pj.formule = +el.dataset.i; pj.objet = null; rendre(); $('#pj-formule')?.focus(); },
    'pj-annuler': () => { pj.objet = null; pj.formule = null; rendre(); },
    'pj-objet-ok': el => { const o = J.objets.find(k => k.id === el.dataset.id); const avant = o.nom; const nom = $('#pj-nom').value.trim(); if (!nom) return; o.nom = nom; o.desc = $('#pj-desc').value.trim(); pj.objet = null; rendre(); if (nom !== avant) toast(`Objet renommé « ${nom} ». Les textes déjà écrits gardent « ${avant} » : la recherche des scènes les retrouve.`); },
    'pj-objet-retirer': el => { const o = J.objets.find(k => k.id === el.dataset.id); J.objets = J.objets.filter(k => k !== o); pj.objet = null; rendre(); toast(`« ${o.nom} » est retiré de la liste. Les textes qui le nomment ne changent pas.`); },
    'pj-objet-ajouter': () => { const nom = $('#pj-n-nom').value.trim(); if (!nom) { $('#pj-n-nom').focus(); return; } J.objets.push({ id: nid('o'), nom, desc: $('#pj-n-desc').value.trim() }); rendre(); $('#pj-n-nom')?.focus(); },
    'pj-formule-ok': el => { const t = $('#pj-formule').value.trim(); if (!t) return; J.formules[+el.dataset.i] = t; pj.formule = null; rendre(); },
    'pj-formule-retirer': el => { J.formules.splice(+el.dataset.i, 1); pj.formule = null; rendre(); },
    'pj-formule-ajouter': () => { const t = $('#pj-n-formule').value.trim(); if (!t) { $('#pj-n-formule').focus(); return; } J.formules.push(t); rendre(); $('#pj-n-formule')?.focus(); },
    // Livre : composition de la feuille
    'fa-ajouter': el => { const t = el.dataset.v; const s = { id: nid('s'), type: t, titre: { compteurs: 'Compteurs', liste: 'Liste', notes: 'Notes' }[t] }; if (t === 'compteurs') s.compteurs = [{ id: nid('c'), nom: 'Compteur', depart: 0 }]; if (t === 'liste') s.lignes = 6; J.feuille.sections.push(s); refaire(`[data-saisie="fa-titre"][data-s="${s.id}"]`); },
    'fa-retirer': el => { const s = sec(el.dataset.s); J.feuille.sections = J.feuille.sections.filter(k => k !== s); refaire('.fa-ajout .btn'); toast(`Section « ${s.titre} » retirée de la feuille.`); },
    'fa-monter': el => { const l = J.feuille.sections; const i = l.indexOf(sec(el.dataset.s)); if (i > 0) [l[i - 1], l[i]] = [l[i], l[i - 1]]; refaire(`[data-act="fa-monter"][data-s="${el.dataset.s}"]`); },
    'fa-descendre': el => { const l = J.feuille.sections; const i = l.indexOf(sec(el.dataset.s)); if (i < l.length - 1) [l[i + 1], l[i]] = [l[i], l[i + 1]]; refaire(`[data-act="fa-descendre"][data-s="${el.dataset.s}"]`); },
    'fa-compteur': el => { const c = { id: nid('c'), nom: '', depart: 0 }; sec(el.dataset.s).compteurs.push(c); refaire(`[data-saisie="fa-cnom"][data-c="${c.id}"]`); },
    'fa-compteur-retirer': el => { const s = sec(el.dataset.s); s.compteurs = s.compteurs.filter(c => c.id !== el.dataset.c); refaire(`[data-act="fa-compteur"][data-s="${s.id}"]`); },
    // Lecteur en ligne : feuille et dé. Aucun rendu complet : le passage en cours ne bouge pas
    'lf-basculer': () => basculer(!ouverte()),
    'lf-ouvrir': () => basculer(!ouverte()),
    'lf-ranger': () => basculer(false),
    'lf-regles': () => { if (!large()) basculer(false); if (st.arg === 'comment') $('#regles')?.scrollIntoView({ block: 'start' }); else F.versRegles = true; },
    'lf-plus': el => { const id = el.dataset.c; F.c[id]++; $(`#lf-c-${id}`).textContent = F.c[id]; $(`[data-act="lf-moins"][data-c="${id}"]`).disabled = false; majResume(); },
    // Plancher à zéro : une borne d'affichage, pas une règle de jeu (décision du 2 octobre 2026)
    'lf-moins': el => { const id = el.dataset.c; if (F.c[id] <= 0) return; F.c[id]--; $(`#lf-c-${id}`).textContent = F.c[id]; el.disabled = F.c[id] <= 0; if (el.disabled) $(`[data-act="lf-plus"][data-c="${id}"]`).focus(); majResume(); },
    'lf-lancer': el => lancer(+el.dataset.n)
  });
  Object.assign(A.changes, {
    'fa-on': el => { J.feuille.on = el.checked; if (el.checked && !J.feuille.sections.length) L().ui.pageOuverte = 'feuille'; refaire('[data-act="fa-on"]'); },
    'fa-des': el => { J.feuille.des = +el.value; refaire(`[data-act="fa-des"][value="${el.value}"]`); }
  });
  Object.assign(A.saisies, {
    'aj-texte': (el, ev) => { const b = blocAction(el.dataset.b); if (!b) return; b.html = esc(el.textContent); X().deriver(ed().ref); A.saisies.texte(el, ev); },
    'fp-q': el => { P.q = el.value; P.sel = 0; $('#fp-liste').innerHTML = listeObjets(); el.setAttribute('aria-activedescendant', objetsFiltres().length ? 'fp-o-0' : ''); },
    'fp-nom': el => { P.nom = el.value; const b = $('[data-act="fp-ajouter"]'); if (b) b.disabled = !el.value.trim(); },
    'fp-desc': el => { P.desc = el.value; },
    'livre-regles': el => { J.regles = el.value; touche(); },
    'fa-titre': el => { touche(); sec(el.dataset.s).titre = el.value; majApercu(); },
    'fa-cnom': el => { touche(); sec(el.dataset.s).compteurs.find(c => c.id === el.dataset.c).nom = el.value; majApercu(); },
    'fa-cdep': el => { touche(); sec(el.dataset.s).compteurs.find(c => c.id === el.dataset.c).depart = Math.max(0, Math.min(99, parseInt(el.value, 10) || 0)); majApercu(); },
    'fa-lignes': el => { touche(); sec(el.dataset.s).lignes = Math.max(3, Math.min(14, parseInt(el.value, 10) || 3)); majApercu(); },
    'lf-ligne': el => {
      const id = el.dataset.s; const l = F.l[id] = F.l[id] || []; l[+el.dataset.i] = el.value; majResume();
      const ol = $(`#lf-l-${id}`); const s = lecV?.feuille.sections.find(x => x.id === id);
      // La liste s'allonge d'une ligne quand toutes sont remplies ; aucun nom d'objet n'est proposé (F04-AC20)
      if (ol && s && [...ol.querySelectorAll('input')].every(i => i.value.trim())) ol.insertAdjacentHTML('beforeend', ligneHTML(s, '', ol.children.length));
    },
    'lf-notes': el => { F.n[el.dataset.s] = el.value; }
  });
  document.addEventListener('selectionchange', () => {
    if (!A.surEditeur()) return; const s = getSelection(); const n = s.rangeCount && s.anchorNode; const el = n && (n.nodeType === 1 ? n : n.parentElement);
    if (el?.closest?.('.copie__texte .run, .action-bloc__texte[contenteditable="true"]')) P.dernier = s.getRangeAt(0).cloneRange();
  });
  document.addEventListener('mousedown', ev => { if (pop && !pop.hidden && !ev.target.closest('.fiche-pop') && !ev.target.closest('[data-act="obj-ouvrir"], [data-act="aj-ouvrir"], [data-act="aj-formules"]')) fermerPop(false); });
  document.addEventListener('keydown', ev => {
    const t = ev.target;
    if (pop && !pop.hidden && t.closest?.('.fiche-pop')) {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fermerPop(); return; }
      if (t.closest('.fp-nouveau')) { if (ev.key === 'Enter') { ev.preventDefault(); A.actions['fp-ajouter'](); } return; }
      const n = nbOptions();
      if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && n) {
        ev.preventDefault(); P.sel = (P.sel + (ev.key === 'ArrowDown' ? 1 : n - 1)) % n;
        $$('#fp-liste [role="option"]').forEach((li, i) => li.setAttribute('aria-selected', i === P.sel)); $(`#fp-o-${P.sel}`)?.scrollIntoView({ block: 'nearest' });
        (P.mode === 'objets' ? $('#fp-q') : $('#fp-liste')).setAttribute('aria-activedescendant', `fp-o-${P.sel}`);
      } else if (ev.key === 'Enter' && (t.id === 'fp-q' || t.id === 'fp-liste')) {
        ev.preventDefault();
        if (P.mode === 'objets') { const o = objetsFiltres()[P.sel]; if (o) choisirObjet(o); else if (adulte()) A.actions['fp-nouveau'](); } else choisirFormule(P.sel - 1);
      }
      return;
    }
    if (t.matches?.('.action-bloc__texte[contenteditable]') && ev.key === 'Enter') { ev.preventDefault(); return; }
    if (ev.key === 'Escape' && st.page === 'lire' && !large() && ouverte() && $('.lec--feuille')) { basculer(false); }
  }, true);

  /* ——— Après le rendu ————————————————————————————————————————————————— */
  const reinit0 = A.reinit;
  A.reinit = nom => { reinit0?.(nom); if (['page', 'vue', 'mode', 'recit'].includes(nom)) { fermerPop(false); pj.objet = null; pj.formule = null; } };
  const apres0 = A.apres;
  A.apres = page => {
    apres0?.(page);
    P.dernier = null;
    if (page === 'scene' && P.points) {
      // Une formule à compléter : les points de suspension sont sélectionnés, prêts à être remplacés
      P.points = false; const el = document.activeElement?.closest?.('.action-bloc__texte'); const n = el?.firstChild; const i = n?.nodeType === 3 ? n.textContent.indexOf('…') : -1;
      if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    }
    if (apresFocus) { const el = $(apresFocus); apresFocus = null; el?.focus({ preventScroll: true }); }
    if (page === 'lire' && F.versRegles) { F.versRegles = false; if (st.arg === 'comment') $('#regles')?.scrollIntoView({ block: 'start' }); }
  };

  A.jeu = {
    J, actionsDe, ecrire, paras, sig, feuille, regles,
    ilotAction, fermerPop, rubrique,
    objetsDepuisTexte: (p, ancre) => { const r = document.createRange(); r.selectNodeContents(p); r.collapse(!p.textContent); ouvrirPop('objets', { cible: r, ancre: ancre || sousAncre(p) }); },
    ouvrirFormules: opts => ouvrirPop('formules', opts),
    livre: { blocFeuille, blocRegles, carteFeuille, editionRegles },
    lecteur: {
      figer: () => ({ feuille: feuille() ? structuredClone(feuille()) : null, regles: regles() }),
      prendre: V => { lecV = V; if (V.feuille) etatFeuille(V.feuille); return V.feuille ? ouverte() : false; },
      feuille: feuilleLecteur, bouton: boutonFeuille, regles: reglesLecteur,
      recommencer: () => { if (lecV?.feuille) remettre(lecV.feuille); },
      // Lecture d'essai (F09.1) : la même feuille et le même dé, sans conservation (décision du 2 octobre 2026)
      essai: () => { const V = { feuille: feuille() ? structuredClone(feuille()) : null, regles: [] }; if (!V.feuille) return ''; lecV = V; return `<div class="essai-feuille">${feuilleLecteur(V, true)}</div>`; }
    }
  };

  // La feuille de la lecture d'essai repart de ses valeurs de départ à chaque nouveau test
  ['essai-depart', 'essai-depuis', 'essai-recommencer'].forEach(k => { const f0 = A.actions[k]; A.actions[k] = (el, ev) => { if (feuille()) remettre(feuille()); f0(el, ev); }; });

  // Drapeaux d'URL pour les captures de la page de scène : ?etape=objet|objet-nouveau|objets|action|action-cree|action-outils
  document.addEventListener('DOMContentLoaded', () => {
    const etape = q0.get('etape'); if (!etape || st.page !== 'scene' || !ed().ctx) return;
    const para = () => $$('.copie__texte .run p').pop();
    const finDe = p => { const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); return r; };
    document.fonts.ready.then(() => {
      const p = para(); const dernierP = X().etat(ed().ref).blocs.filter(b => b.t === 'p').pop()?.id;
      if (etape === 'objet' && p) ouvrirPop('objets', { cible: finDe(p), ancre: sousAncre(p), q: q0.get('q') || '' });
      if (etape === 'objet-nouveau' && p) { ouvrirPop('objets', { cible: finDe(p), ancre: sousAncre(p), q: 'lanterne sourde' }); P.nouveau = true; P.nom = 'la lanterne sourde'; P.desc = 'Lanterne à volet : elle éclaire sans être vue.'; rendrePop(); }
      if (etape === 'objets') ouvrirPop('objets', { cible: p ? finDe(p) : null, ancre: sousAncre($('[data-act="obj-ouvrir"]')) });
      if (etape === 'action' && p) ouvrirPop('formules', { apres: dernierP, ancre: sousAncre(p), sel: 2 });
      if (etape === 'action-cree') { creerAction('Retire un point de volonté à ton héros.', dernierP); }
    });
  });
})();
