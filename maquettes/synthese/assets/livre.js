/* Troisième lot : destination Livre (étapes, tâches, aperçu, réglages, exports) et lecture d'essai.
   Depuis le 3 octobre 2026, un clic sur un passage ouvre l'éditeur complet de sa scène à côté de l'aperçu (F11.2),
   sous une zone « Ce passage dans le livre » qui porte les commandes de composition du passage (F11.3). Simulation sans persistance ; la composition est
   calculée dans le navigateur pour l'examen, sans valeur de moteur PDF. */
(function () {
  const A = window.App;
  const { D, H, st, $, $$, esc, tampon, gommette, etatDe, eleve, perso, choix, attribue, varsCouleur, toast, rendre } = A;
  const moi = () => A.moi();
  const TX = window.LIVRE_TEXTES;
  st.moment = 'juin';

  /* ——— Moments simulés (barre de présentation) ———————————————— */
  const MOMENTS = {
    sept: { date: 'mardi 29 septembre 2026, 14 h 05', court: '29 septembre, 14 h 05', exclues: [], etats: null, vides: [], image50: null, travail: null },
    juin: { date: 'vendredi 11 juin 2027, 10 h 00', court: '11 juin, 10 h 00', exclues: ['S042'], etats: { S028: 'reprendre', S060: 'cours', S061: 'cours', S025: 'cours' }, vides: ['S025'], image50: 'manquante', travail: { date: 'jeudi 3 juin 2027, 16 h 20', note: '9 problèmes récapitulés en première page' } },
    pret: { date: 'vendredi 18 juin 2027, 16 h 40', court: '18 juin, 16 h 40', exclues: ['S025'], etats: {}, vides: ['S025'], image50: 'ok', travail: { date: 'vendredi 11 juin 2027, 10 h 05', note: '6 problèmes récapitulés en première page' }, choix: { S029: [['Suivre la flèche', 'S031', 'sanctuaire']] } }
  };
  const M = () => MOMENTS[st.moment] || MOMENTS.juin;
  // Ajustements manuels de composition (F11.3) : l'échange S040/S042 devient inapplicable quand S042 est hors du livre
  const ECHANGES = [['S027', 'S033'], ['S040', 'S042']];
  const NOUVELLE_PAGE = ['S060'];
  const ORDINAUX = ['Première', 'Deuxième', 'Troisième', 'Quatrième', 'Cinquième'];
  // Formule de renvoi : une seule pour le livre (F11.5). Constructions : façons d'introduire le libellé dans une
  // phrase de choix automatique (F05), cochées dans les réglages ; l'une d'elles est tirée à la création du choix.
  const FORMULES = { rends: ['« rends-toi au 12 »', 'rends-toi au '], va: ['« va au 12 »', 'va au '], fleche: ['« → 12 »', '→ '] };
  const CONSTRUCTIONS = {
    neutre: ['Le libellé, puis le renvoi', '{L} : {r}.'],
    pour: ['« Pour… »', 'Pour {l}, {r}.'],
    si: ['« Si tu veux… »', 'Si tu veux {l}, {r}.'],
    question: ['« … ? »', '{L} ? {R}.']
  };
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1); const minu = t => t.charAt(0).toLowerCase() + t.slice(1);
  const hache = t => { let h = 0; for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  // Phrase automatique d'un choix, en morceaux : avant le libellé, libellé, entre les deux, formule, après le numéro
  function phraseAuto(cle, lib, construction) {
    const actives = Object.keys(CONSTRUCTIONS).filter(k => ui.constructions.has(k));
    const k = construction || actives[hache(cle) % actives.length] || 'neutre';
    let gabarit = CONSTRUCTIONS[k][1]; const f = FORMULES[ui.formule][1];
    if (ui.formule === 'fleche' && k === 'neutre') gabarit = '{L} {r}';
    const m = gabarit.match(/^(.*)\{(l|L)\}(.*)\{(r|R)\}(.*)$/);
    return { k, avant: m[1], lib: m[2] === 'L' ? cap(lib) : minu(lib), entre: m[3], formule: m[4] === 'R' ? cap(f) : f, apres: m[5] };
  }
  const texteAuto = (cle, lib, n, construction) => { const p = phraseAuto(cle, lib, construction); return p.avant + p.lib + p.entre + p.formule + n + p.apres; };
  const POLICES = { vollkorn: ['Vollkorn', '"Vollkorn", Georgia, serif'], andika: ['Andika', '"Andika", "Atkinson Hyperlegible Next", sans-serif'] };
  const TAILLES = { s: ['Petite', 2.7], m: ['Moyenne', 2.95], l: ['Grande', 3.25] };

  /* ——— État de travail de la maquette ———————————————————————— */
  const nouveauxMods = () => ({ inclure: new Set(), exclure: new Set(), fins: new Set(), images: new Set(), journal: [] });
  // Marges de départ (F11.3), en millimètres : haut, bas, extérieur, intérieur
  const MARGES0 = { h: 16, b: 20, e: 15, i: 20 };
  const NOMS_MARGE = { h: ['Haut', 'haute'], b: ['Bas', 'basse'], e: ['Extérieur', 'extérieure'], i: ['Intérieur, côté reliure', 'intérieure'] };
  const IMAGES_PAGE = { titre: 'page-de-titre.png', mode: 'comment-lire.png', feuille: 'feuille-daventure.png', auteurs: 'les-auteurs.png', fin: 'page-de-fin.png' };
  const PAGES0 = () => ({
    titre: { titre: H.titre, sous: 'Un livre dont tu es le héros', auteur: 'La classe de CM1-CM2 de Mme Laurent', annee: '2026-2027' },
    feuille: {},
    mode: { on: true, texte: 'Ce livre ne se lit pas dans l’ordre des pages. Commence au passage 1. À la fin de chaque passage, choisis ce que tu veux faire et rends-toi au numéro indiqué.\nParfois, aucun choix n’est écrit : une énigme te donnera le numéro de la suite. Bonne aventure !' },
    auteurs: { on: true, noms: Object.values(D.eleves).map(e => e.prenom), place: 'debut' },
    fin: { on: false, texte: 'Merci d’avoir lu notre histoire. Elle a été écrite en classe, scène par scène, pendant toute l’année.' }
  });
  const ui = {
    mods: nouveauxMods(), edits: {}, flash: null, zoom: 'double', ouverts: new Set(),
    // Scène ouverte à côté de l'aperçu, état de l'aperçu ('ok' ou 'attente'), déplacements de passages, dernière action annulable
    tiroir: null, trajet: [], apercu: 'ok', fige: false, calcule: '10 h 02', ordres: [], nouvellesPages: new Set(NOUVELLE_PAGE), dernier: null, semes: new Set(), viser: null, suivre: false, anciennes: null,
    feuille: null, etape: null, pdf: null, travail: null, change: false, retourFocus: null,
    groupes: new Set(), seed: 0, cellule: null,
    titres: true, titresChap: true, partiePage: true, chapitrePage: false, alignement: 'justifie', bas: null, marges: { ...MARGES0 }, margeErreur: null, pb: null, peu: [], peuPage: null, ficheOuverte: null, formule: 'rends', constructions: new Set(['neutre']), fin: 'Fin', police: 'vollkorn', taille: 'm', pages: PAGES0(), pageOuverte: null,
    chemin: [], scroll: null,
    // Temps en cours de la préparation du livre (F11.6) : 'relire', 'chemins' ou 'page'
    temps: 'relire',
    // Mise en page : réorganisation des passages, l'agencement de F11.5 (null, 'refuse', 'fait')
    agencement: null,
    // Parcours guidé (F11.6) : avertissements acceptés ou retirés, étapes ouvertes (elles ne se referment pas), déclaration
    // « La mise en page me convient », tâche choisie par étape, tâches passées, écran d'aide et scènes déclarées prêtes ici
    acceptes: new Set(), retires: new Set(), preAccepte: false, ouvertes: new Set(), convient: false, tache: {}, passees: new Set(),
    aide: null, aideVue: new Set(), guidage: true, pretesMain: new Set(),
    // 4 octobre 2026 : aide qu'on ne veut plus voir, doute sur l'ordre des passages après une modification,
    // rappel avant de déclarer une scène prête, menu de la scène ouverte
    aideJamais: new Set(), doute: false, sigOrdre: null, rappelPrete: null,
    // Déclarations qui terminent les deux premières étapes (4 octobre 2026) : « J'ai relu le livre », « J'ai vérifié les chemins »
    declare: { relire: false, chemins: false },
    // « Mettre en page » en deux volets (4 octobre 2026) : 'reglages' ou 'apercu' ; chacun retrouve l'endroit quitté
    volet: 'reglages', yVolet: {}, section: null
  };
  // Bas de page du récit (F11.4) : rien par défaut pour le récit à choix, numéro de page pour le récit classique ;
  // les dés ne sont proposés que si le dé de la feuille est réglé sur un ou deux
  const desPossibles = () => choix() && A.jeu.J.feuille.des > 0;
  const bas = () => { const b = ui.bas || (choix() ? 'rien' : 'folio'); return b === 'des' && !desPossibles() ? 'rien' : b; };
  const mm = v => (v * 100 / 148.17).toFixed(2);
  const dimUtile = () => { const m = ui.marges; const l = 148.17 - m.e - m.i, h = 209.9 - m.h - m.b; const pt = v => Math.round(v / 25.4 * 300).toLocaleString('fr-FR'); return { mm: `${Math.round(l)} × ${Math.round(h)} mm`, pt: `${pt(l)} × ${pt(h)} points` }; };
  const formesPages = () => Object.keys(IMAGES_PAGE).forEach(k => { ui.pages[k].forme = 'modele'; ui.pages[k].image = IMAGES_PAGE[k]; });
  // Heures de la maquette : l'aperçu est calculé deux minutes après l'état du moment affiché, la saisie quatre minutes après
  function plusMin(min) { const m = M().court.match(/(\d+) h (\d+)$/); const t = +m[1] * 60 + +m[2] + min; return `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')}`; }
  function reinitLivre() {
    Object.assign(ui, { mods: nouveauxMods(), edits: {}, tiroir: null, trajet: [], apercu: 'ok', calcule: plusMin(2), ordres: [], nouvellesPages: new Set(NOUVELLE_PAGE), dernier: null, semes: new Set(), anciennes: null, feuille: null, etape: null, pdf: null, travail: null, change: false, ouverts: new Set(), cellule: null, pb: null, peuPage: null, margeErreur: null, volet: 'reglages', yVolet: {}, section: null,
      acceptes: new Set(), retires: new Set(), ouvertes: new Set(), convient: false, tache: {}, passees: new Set(), aide: null, pretesMain: new Set(), agencement: null, doute: false, sigOrdre: null, rappelPrete: null, declare: { relire: false, chemins: false } });
    // « Juin, prêt » : les passages à confirmer ont déjà reçu leur « C'est voulu »
    ui.preAccepte = st.moment === 'pret';
    // … et l'adulte a déclaré avoir relu le livre et vérifié les chemins
    ui.declare = { relire: st.moment === 'pret', chemins: st.moment === 'pret' };
    ui.pages = PAGES0(); formesPages();
    if (perso()) { ui.pages.titre.auteur = 'Camille Roux'; ui.pages.auteurs.on = false; }
  }
  const r0 = A.reinit;
  A.reinit = nom => {
    r0?.(nom);
    if (['moment', 'mode', 'recit'].includes(nom)) { reinitLivre(); ui.chemin = []; }
    if (nom === 'page' || nom === 'vue') { if (st.page !== 'livre') ui.dernier = null; ui.tiroir = null; ui.trajet = []; ui.apercu = 'ok'; ui.anciennes = null; clearTimeout(tApercu); fermerFeuille(false); }
  };

  /* ——— Modèle du livre pour le moment affiché ————————————————— */
  const scenesPlan = () => H.parties.flatMap((p, pi) => p.chapitres.flatMap(c => c.scenes.map(sc => ({ sc, c, pi }))));
  function texteDe(sc) {
    // Une scène ouverte depuis l'aperçu est lue dans l'éditeur : il n'existe pas de seconde copie (F11.2)
    if (ui.semes.has(sc.ref)) { const t = A.editeur.x.textes(sc.ref); if (t) return t; }
    if (ui.edits[sc.ref]) return ui.edits[sc.ref];
    if (st.moment === 'sept') return sc.vide ? [] : (TX.sept[sc.ref] || TX.juin[sc.ref] || []);
    if (M().vides.includes(sc.ref)) return [];
    return TX.juin[sc.ref] || [];
  }
  // Image en bloc d'une scène (F10) : fichier, place parmi les paragraphes (pos) et largeur de départ du scénario
  function imageBase(ref) {
    if (st.moment === 'sept') return null;
    if (ref === 'S014') return { src: 'assets/img/ill-lisiere.jpg', largeur: 60, forme: 'perso', pos: 1, faible: true, nom: 'dessin-chloe-lisiere.jpg', ppp: 140 };
    if (ref === 'S026') return { src: 'assets/img/ill-cloches.jpg', largeur: 100, forme: 'page', pos: 2, nom: 'dessin-kenza-cloches.jpg' };
    if (ref === 'S031') return { src: 'assets/img/ill-sanctuaire.jpg', largeur: 100, forme: 'pleine', pos: 0, nom: 'chapelle-lucioles.jpg' };
    if (ref === 'S050') return M().image50 === 'manquante' && !ui.mods.images.has('S050')
      ? { src: null, largeur: 65, forme: 'moyenne', pos: 1, nom: 'dessin-rayan-escalier.jpg', manquante: true }
      : { src: 'assets/img/ill-escalier.jpg', largeur: 65, forme: 'moyenne', pos: 1, nom: 'dessin-rayan-escalier.jpg' };
    return null;
  }
  // Une scène ouverte dans l'éditeur dit elle-même où est son image et à quelle largeur (F11.2) ; le fichier reste celui du scénario
  function imageDe(ref) {
    const base = imageBase(ref); const e = A.editeur?.x.image(ref);
    if (e === undefined) return base;
    if (!e || st.moment === 'sept') return null;
    return { ...e, src: base?.src ?? e.src, manquante: !!base?.manquante, faible: !!base?.faible && e.forme !== 'petite', ppp: base?.ppp ? Math.round(base.ppp * 60 / (e.forme === 'page' ? 100 : e.largeur)) : null };
  }
  function modele() {
    const m = M(); const S = {};
    const exclues = new Set(m.exclues); ui.mods.exclure.forEach(r => exclues.add(r)); ui.mods.inclure.forEach(r => exclues.delete(r));
    scenesPlan().forEach(({ sc, c, pi }) => {
      let etat = st.moment === 'sept' || sc.nouvelle ? etatDe(sc) : ((ui.etatsSim || {})[sc.ref] || m.etats[sc.ref] || 'prete');
      if (perso() && etat !== 'prete') etat = 'cours';
      if (ui.pretesMain.has(sc.ref)) etat = 'prete';
      const base = choix() ? [...(sc.choix || []), ...((m.choix || {})[sc.ref] || [])] : [];
      const texte = texteDe(sc);
      S[sc.ref] = {
        ref: sc.ref, titre: sc.titre, sc, chap: c, partie: pi, etat, texte, vide: !texte.length,
        inclus: !exclues.has(sc.ref), fin: choix() && (!!sc.fin || ui.mods.fins.has(sc.ref)),
        choix: base.map(([lib, dest], i) => ({ lib, dest, i, construction: base[i].construction })),
        cachees: choix() ? (sc.cachees || []).map(([dest, num]) => ({ dest, num })) : [],
        // Phrases personnalisées (F05.2) : segments de texte et indices des choix qu'elles renvoient ; les autres choix sont automatiques
        phrases: choix() ? (sc.phrases || (sc.phrase ? [sc.phrase] : [])) : [],
        image: imageDe(sc.ref), nouvellePage: ui.nouvellesPages.has(sc.ref), pec: sc.pec
      };
    });
    return S;
  }
  function rng(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const ouverture = pi => H.parties[pi].chapitres.find(c => c.scenes.length)?.scenes[0].ref;
  function groupesParties() { const g = [[0]]; for (let i = 1; i < H.parties.length; i++) { if (ui.groupes.has(i - 1)) g[g.length - 1].push(i); else g.push([i]); } return g; }
  // Ordre imprimé : mélange par groupe de parties, départ en tête, ouverture de la première partie du groupe en tête
  function numeroter(S) {
    if (!choix()) { const l = scenesPlan().map(x => x.sc.ref).filter(r => S[r].inclus); return { liste: l, num: {}, impossibles: [], ajustements: [] }; }
    const freres = (a, b) => Object.values(S).some(x => { const d = x.choix.map(c => c.dest); return d.includes(a) && d.includes(b); });
    let base = [];
    groupesParties().forEach(g => {
      const refs = g.flatMap(pi => H.parties[pi].chapitres.flatMap(c => c.scenes.map(s => s.ref)));
      const tete = ouverture(g[0]);
      const debut = [...new Set([H.depart, tete].filter(r => refs.includes(r)))];
      // Une scène créée depuis un choix (F05.2) prend la suite sans rebattre les numéros déjà affichés
      const reste = refs.filter(r => !debut.includes(r) && !D.scenes[r].nouvelle);
      const alea = rng(g.reduce((a, b) => a * 31 + b + 7, 17) + ui.seed * 7919);
      for (let i = reste.length - 1; i > 0; i--) { const j = Math.floor(alea() * (i + 1)); [reste[i], reste[j]] = [reste[j], reste[i]]; }
      for (let pass = 0; pass < 3; pass++) for (let i = 1; i < reste.length; i++) if (freres(reste[i - 1], reste[i])) { const k = (i + 2) % reste.length; [reste[i], reste[k]] = [reste[k], reste[i]]; }
      base.push(...debut, ...reste, ...refs.filter(r => D.scenes[r].nouvelle && !debut.includes(r)));
    });
    let l = base.filter(r => S[r].inclus);
    const ajustements = [];
    ECHANGES.forEach(([a, b]) => { const i = l.indexOf(a), j = l.indexOf(b); if (i >= 0 && j >= 0) [l[i], l[j]] = [l[j], l[i]]; else ajustements.push([a, b, S[a].inclus ? b : a]); });
    const impossibles = [];
    Object.values(S).filter(x => x.inclus).forEach(x => x.cachees.forEach(({ dest, num }) => {
      if (!S[dest]?.inclus) return;
      if (num > l.length) { impossibles.push({ src: x.ref, dest, num, total: l.length }); return; }
      l.splice(l.indexOf(dest), 1); l.splice(num - 1, 0, dest);
    }));
    // Déplacements demandés depuis l'aperçu (F11.3) : un passage reste dans son groupe de mélange ; le départ, un
    // numéro fixé et l'ouverture en tête de groupe gardent leur rang, les autres passages se décalent autour d'eux.
    const groupes = groupesParties(); const groupe = {}; const immobile = {};
    const fixes = new Set(Object.values(S).filter(x => x.inclus).flatMap(x => x.cachees.map(c => c.dest)));
    l.forEach(r => { groupe[r] = groupes.findIndex(g => g.includes(S[r].partie)); });
    groupes.forEach(g => { const t = ouverture(g[0]); if (t) immobile[t] = 'ouverture'; });
    fixes.forEach(r => { immobile[r] = 'fixe'; }); immobile[H.depart] = 'depart';
    const mobiles = g => l.map((r, i) => i).filter(i => groupe[l[i]] === g && !immobile[l[i]]);
    ui.ordres.forEach(({ ref, apres }) => {
      if (!l.includes(ref) || immobile[ref] || (apres && !l.includes(apres))) return;
      const places = mobiles(groupe[ref]); const suite = places.map(i => l[i]).filter(r => r !== ref);
      suite.splice(apres ? suite.indexOf(apres) + 1 : 0, 0, ref); places.forEach((i, j) => { l[i] = suite[j]; });
    });
    const num = {}; l.forEach((r, i) => { num[r] = i + 1; });
    return { liste: l, num, impossibles, ajustements, groupes, groupe, immobile, mobiles: g => mobiles(g).map(i => l[i]) };
  }

  /* ——— Contrôles avant le PDF définitif (F09.2, F10, F11.2) ————— */
  const GENRES = {
    depart: ['bloque', 'Départ absent ou hors du livre'],
    dest: ['bloque', 'Choix sans destination dans le livre'],
    issue: ['bloque', 'Scènes sans choix ni fin'],
    vide: ['bloque', 'Textes vides'],
    image: ['bloque', 'Images manquantes'],
    numero: ['bloque', 'Numéros d’énigme impossibles'],
    pretes: ['bloque', 'Scènes pas encore déclarées prêtes'],
    inaccessible: ['avert', 'Inaccessibles depuis le départ'],
    sortie: ['avert', 'Sorties non assurées'],
    resolution: ['avert', 'Images peu définies'],
    ajustement: ['info', 'Ajustements non appliqués'],
    insertion: ['info', 'Scènes réintégrées'],
    jeu: ['info', 'Actions de jeu sans feuille d’aventure'],
    hors: ['info', 'Hors du livre']
  };
  function controler(S, N) {
    const P = []; const add = (k, o) => P.push(Object.assign({ k, g: GENRES[k][0] }, o));
    const inc = Object.values(S).filter(x => x.inclus);
    if (choix()) {
      if (!S[H.depart]?.inclus) add('depart', { ref: H.depart });
      inc.forEach(x => {
        x.choix.forEach(c => { if (!S[c.dest]?.inclus) add('dest', { ref: x.ref, dest: c.dest, lib: c.lib }); });
        x.cachees.forEach(c => { if (!S[c.dest]?.inclus) add('dest', { ref: x.ref, dest: c.dest, lib: 'énigme' }); });
        if (!x.fin && !x.choix.length && !x.cachees.length) add('issue', { ref: x.ref });
        // Seule suite : une liaison cachée. Avertit sans bloquer le PDF définitif ni le partage (F09-AC15)
        if (!x.choix.length && x.cachees.length) add('sortie', { ref: x.ref });
      });
      N.impossibles.forEach(o => add('numero', { ref: o.src, dest: o.dest, num: o.num, total: o.total }));
      const vus = new Set(); const pile = S[H.depart]?.inclus ? [H.depart] : [];
      while (pile.length) { const r = pile.pop(); if (vus.has(r)) continue; vus.add(r); [...S[r].choix.map(c => c.dest), ...S[r].cachees.map(c => c.dest)].forEach(d => { if (S[d]?.inclus && !vus.has(d)) pile.push(d); }); }
      inc.forEach(x => { if (!vus.has(x.ref)) add('inaccessible', { ref: x.ref }); });
    }
    inc.forEach(x => { if (x.vide) add('vide', { ref: x.ref }); });
    inc.forEach(x => { if (x.image?.manquante) add('image', { ref: x.ref }); if (x.image?.faible) add('resolution', { ref: x.ref }); });
    inc.forEach(x => { if (x.etat !== 'prete') add('pretes', { ref: x.ref }); });
    N.ajustements.forEach(([a, b, absent]) => add('ajustement', { ref: a, b, absent }));
    ui.mods.journal.forEach(j => add('insertion', { ref: j }));
    // Simple rappel, jamais bloquant et jamais affiché pendant l'écriture (F04.2, décision du 2 octobre 2026)
    const jeu = inc.filter(x => !x.vide && A.jeu.actionsDe(x.ref).length);
    if (jeu.length && !A.jeu.feuille()) add('jeu', { ref: jeu[0].ref, n: jeu.length });
    Object.values(S).filter(x => !x.inclus).forEach(x => add('hors', { ref: x.ref }));
    // Scène à finir (F09.2, 4 octobre 2026) : tant qu'elle n'est pas déclarée prête, ses défauts d'écriture — texte vide,
    // ni choix ni fin, choix sans destination — ne sont pas des problèmes. Elle reste comptée parmi les scènes à finir ;
    // les contrôles du plan (départ, passage inaccessible) restent actifs.
    P.forEach(p => { const x = S[p.ref]; if (x && x.etat !== 'prete' && ['vide', 'issue', 'dest'].includes(p.k)) p.differe = true; });
    return P;
  }
  const bloquants = P => P.filter(p => p.g === 'bloque');

  /* ——— Composition des blocs du livre ——————————————————————— */
  // Espaces insécables de la typographie française (« », : ; ! ?)
  const fr = t => esc(t).replace(/ ([:;!?»])/g, '\u202F$1').replace(/« /g, '«\u202F');
  const para = t => t.map(p => `<p>${fr(p)}</p>`).join('');
  const marque = (g, txt, icone) => `<span class="marque marque--${g}">${ic(icone || { bloque: 'i-bloque', avert: 'i-alerte', info: 'i-info' }[g])}${txt}</span>`;
  const numeroOuMarque = (S, N, c) => { const d = S[c.dest]; return d?.inclus ? N.num[c.dest] : marque('bloque', d ? `destination hors du livre (${c.dest})` : 'destination à définir'); };
  // Un renvoi se suit d'un clic, pour éprouver les enchaînements sans quitter l'aperçu ; il reste un texte en ligne,
  // pour ne rien changer aux coupures (demande du porteur, 3 octobre 2026) ; à toutes les étapes depuis sa demande du même jour
  const suivre = (S, c, lib) => S[c.dest]?.inclus ? ` role="link" tabindex="0" data-act="livre-suivre" data-ref="${c.dest}" data-lib="${esc(lib || c.lib || '')}" title="Aller à ce passage"` : '';
  // Phrases de choix d'un passage, dans l'ordre de la scène : automatique ({ c }) ou personnalisée ({ ph })
  function phrasesDe(x) {
    const vues = new Set(); const l = [];
    x.choix.forEach(c => { const ph = x.phrases.find(p => p.includes(c.i)); if (!ph) l.push({ c }); else if (!vues.has(ph)) { vues.add(ph); l.push({ ph }); } });
    return l;
  }
  function lignesChoix(x, S, N) {
    return phrasesDe(x).map(({ c, ph }) => { if (ph) return `<li class="choix-perso">${ph.map(seg => typeof seg === 'string' ? esc(seg) : `<span class="renvoi"${suivre(S, x.choix[seg])}>${numeroOuMarque(S, N, x.choix[seg])}</span>`).join('')}</li>`;
      const p = phraseAuto(`${x.ref}:${c.i}`, c.lib, c.construction);
      return `<li>${esc(p.avant)}<span class="choix-lib">${esc(p.lib)}</span>${esc(p.entre)}<span class="renvoi"${suivre(S, c)}>${esc(p.formule)}${numeroOuMarque(S, N, c)}</span>${esc(p.apres)}</li>`; }).join('');
  }
  function blocPassage(x, S, N, P) {
    const n = N.num[x.ref]; const ouvert = ui.tiroir?.ref === x.ref;
    const pb = P.filter(p => p.ref === x.ref);
    const titres = ui.titres;
    const partie = H.parties[x.partie];
    const estOuverture = ouverture(x.partie) === x.ref;
    // « Chaque partie commence sur une nouvelle page » : une partie qui ouvre son groupe de mélange, toute partie en récit
    // classique ; « chaque chapitre » en récit classique seulement (F11.5). La première page du récit n'est pas concernée.
    const premiere = N.liste[0] === x.ref;
    const sautPartie = ui.partiePage && !premiere && (choix() ? N.groupes.some(g => ouverture(g[0]) === x.ref) : estOuverture);
    const sautChapitre = !choix() && ui.chapitrePage && !premiere && x.chap.scenes.find(s => S[s.ref].inclus)?.ref === x.ref;
    const saut = x.nouvellePage || sautPartie || sautChapitre;
    let entete = '';
    if (estOuverture && titres) entete += `<div class="passage__partie"><p>${ORDINAUX[x.partie]} partie</p><p class="passage__partie-t">${esc(partie.titre)}</p></div>`;
    if (!choix() && ui.titresChap && x.chap.scenes.find(s => S[s.ref].inclus)?.ref === x.ref) entete += `<p class="passage__chapitre">${esc(x.chap.titre)}</p>`;
    const marques = [
      pb.some(p => p.k === 'pretes') ? marque('bloque', 'à finir', 'i-horloge') : '',
      pb.some(p => p.k === 'inaccessible') ? marque('avert', 'inaccessible') : '',
      pb.some(p => p.k === 'sortie') ? marque('avert', 'seule suite : une énigme') : '',
      x.cachees.length ? `<span class="marque-lien"${suivre(S, x.cachees[0], 'l’énigme')}>${marque('info', `énigme → ${N.num[x.cachees[0].dest] || '?'} · ${x.cachees[0].dest}`, 'i-cle')}</span>` : '',
      Object.values(S).some(y => y.cachees.some(c => c.dest === x.ref)) ? marque('info', 'n° fixé', 'i-epingle') : '',
      x.nouvellePage ? marque('info', 'nouvelle page', 'i-pages') : ''
    ].join('');
    const tete = choix()
      ? `<header class="passage__tete"><span class="marque marque--ref">${x.ref}</span><h3 class="passage__num">${n}</h3><span class="marques">${marques}</span></header>`
      : `<header class="passage__tete passage__tete--classique"><span class="marque marque--ref">${x.ref}</span><span class="marques">${marques}</span></header>`;
    // L'image reste où l'auteur l'a posée parmi les blocs de la scène (F10) ; pleine page, elle occupe seule la page suivante
    const im = x.image; const acts = A.jeu.actionsDe(x.ref); const page = im?.forme === 'page';
    const figure = !im ? '' : im.manquante
      ? `<figure class="passage__image passage__image--manquante" style="--l:${page ? 100 : im.largeur}%">${marque('bloque', `Image introuvable : ${im.nom}`)}</figure>`
      : `<figure class="passage__image ${page ? 'passage__image--page' : ''}" style="--l:${page ? 100 : im.largeur}%"><img src="${im.src}" alt="">${im.faible ? marque('avert', `${im.ppp} ppp à cette taille`) : ''}</figure>`;
    const pos = im && !im.apresChoix ? Math.min(im.pos ?? 0, x.texte.length) : x.texte.length;
    const avant = A.jeu.paras(x.texte.slice(0, pos), acts.filter(a => a.pos < pos));
    const apres = A.jeu.paras(x.texte.slice(pos), acts.filter(a => a.pos >= pos).map(a => ({ ...a, pos: a.pos - pos })));
    const dansTexte = im && !page && !im.apresChoix ? figure : '';
    const txt = x.vide
      ? `<div class="passage__texte passage__texte--vide">${marque('bloque', 'Texte vide')}</div>${dansTexte}`
      : `<div class="passage__texte">${avant}${dansTexte}${page ? '' : apres}</div>`;
    const fin = x.fin ? `<p class="passage__fin">${esc(ui.fin || 'Fin')}</p>` : '';
    const ch = x.choix.length ? `<ul class="passage__choix">${lignesChoix(x, S, N)}</ul>` : '';
    const issue = pb.some(p => p.k === 'issue') ? `<p class="passage__issue">${marque('bloque', 'ni choix ni fin : la lecture s’arrête ici')}</p>` : '';
    const sep = !choix() ? '<p class="passage__sep" aria-hidden="true"><span></span><span></span><span></span></p>' : '';
    // Tout le passage ouvre l'éditeur de sa scène à côté de l'aperçu (F11.2, décision révisée le 3 octobre 2026)
    const attrs = (cls, tab) => `class="passage ${cls} ${ouvert ? 'est-ouvert' : ''} ${ui.flash === x.ref ? 'est-flash' : ''}" data-ref="${x.ref}" data-n="${n || ''}" data-act="livre-ouvrir" role="button" tabindex="${tab}" aria-pressed="${ouvert}" aria-label="${choix() ? `Passage n° ${n}, ` : ''}scène ${x.ref} : ouvrir son éditeur à côté de l’aperçu"`;
    const suiteChoix = `${fin}${ch}${issue}`;
    if (page) {
      // Trois blocs : le texte d'avant, l'image seule sur sa page, puis la suite, qui ouvre la page d'après (F10-AC19)
      const pleine = `<div data-seule="image" class="pl-image ${ouvert ? 'est-ouvert' : ''}" data-ref="${x.ref}" data-act="livre-ouvrir">${figure}</div>`;
      const reste = im.apresChoix ? '' : `${x.vide ? '' : apres ? `<div class="passage__texte">${apres}</div>` : ''}${suiteChoix}`;
      return `<section ${attrs('', 0)} ${saut ? 'data-nouvelle-page="1"' : ''}>${entete}${tete}${txt}${im.apresChoix ? suiteChoix : ''}${reste ? '' : sep}</section>${pleine}${reste ? `<section ${attrs('passage--suite', -1)}>${reste}${sep}</section>` : ''}`;
    }
    return `<section ${attrs('', 0)} ${saut ? 'data-nouvelle-page="1"' : ''}>${entete}${tete}${txt}${suiteChoix}${im?.apresChoix ? figure : ''}${sep}</section>`;
  }
  // Page de présentation remplacée par une image de l'adulte : elle reste à l'intérieur des marges (F11.4)
  const pageImage = k => `<div data-seule="${k}" class="pl-pageimg">${k === 'feuille' ? '<img src="assets/img/feuille-exemple.svg" alt="">' : `<figure class="pl-pageimg__vide">${ic('i-image')}<span>${esc(ui.pages[k].image)}</span></figure>`}</div>`;
  function blocsLivre(S, N, P) {
    const pg = ui.pages; const b = [];
    const page = (k, modele) => pg[k].forme === 'image' ? pageImage(k) : modele;
    // Ordre fixe : titre, auteurs (au début ou à la fin), « Comment lire ce livre » et ses règles, feuille d'aventure, récit, fin
    b.push(page('titre', `<div data-seule="titre" class="pl-titre"><p class="pl-titre__t">${esc(pg.titre.titre)}</p>${pg.titre.sous ? `<p class="pl-titre__s">${esc(pg.titre.sous)}</p>` : ''}<span class="pl-titre__orn" aria-hidden="true"></span><p class="pl-titre__a">${esc(pg.titre.auteur)}</p><p class="pl-titre__an">${esc(pg.titre.annee)}</p></div>`));
    const auteurs = pg.auteurs.on ? page('auteurs', `<div data-seule="auteurs" class="pl-auteurs"><h3>Ce livre a été écrit par</h3><ul>${pg.auteurs.noms.map(n => `<li>${esc(n)}</li>`).join('')}</ul><p>avec ${perso() ? 'Camille Roux' : 'Mme Laurent'}</p></div>`) : '';
    if (auteurs && pg.auteurs.place !== 'fin') b.push(auteurs);
    if (choix() && pg.mode.on) b.push(page('mode', `<div data-seule="mode" class="pl-mode"><h3>Comment lire ce livre</h3>${pg.mode.texte.split('\n').filter(Boolean).map(p => `<p>${esc(p)}</p>`).join('')}${A.jeu.livre.blocRegles()}</div>`));
    if (A.jeu.feuille()) b.push(pg.feuille.forme === 'image' ? pageImage('feuille') : A.jeu.livre.blocFeuille());
    b.push('<div data-debut-recit="1"></div>');
    N.liste.forEach(r => b.push(blocPassage(S[r], S, N, P)));
    b.push('<div data-fin-recit="1"></div>');
    if (auteurs && pg.auteurs.place === 'fin') b.push(auteurs);
    if (pg.fin.on) b.push(page('fin', `<div data-seule="fin" class="pl-finale"><p>${esc(pg.fin.texte)}</p></div>`));
    return b.join('');
  }

  /* ——— Mise en pages (A5 en vis-à-vis), mesurée dans le navigateur ——— */
  function creerPage(n) {
    const el = document.createElement('article');
    el.className = `pl ${n % 2 ? 'pl--recto' : 'pl--verso'}`; el.dataset.page = n; el.setAttribute('aria-label', `Page ${n}`);
    el.innerHTML = `<header class="pl__tete"><span class="pl__passages"></span><span class="pl__travail">Version de travail</span></header><div class="pl__corps"></div><footer class="pl__pied"><span class="pl__bas"></span><span class="pl__date">p. ${n} · aperçu du ${ui.tiroir ? `${M().court.split(',')[0]}, ${ui.calcule}` : M().court}</span></footer>`;
    return el;
  }
  // Coupe un passage entre deux paragraphes : le numéro et le premier paragraphe restent ensemble
  function scinder(bloc, corps, deborde) {
    const texte = bloc.querySelector('.passage__texte');
    if (!texte || texte.classList.contains('passage__texte--vide')) return null;
    const avant = bloc.innerHTML;
    const suite = bloc.cloneNode(false); suite.classList.add('passage--suite'); suite.removeAttribute('data-nouvelle-page'); suite.setAttribute('tabindex', '-1');
    const enfants = [...bloc.children]; const apres = enfants.slice(enfants.indexOf(texte) + 1).reverse();
    for (const el of apres) { suite.prepend(el); if (!deborde(corps)) break; }
    // Pas de choix orphelins en haut de page : le dernier paragraphe les accompagne
    const orphelins = !deborde(corps) && texte.children.length >= 2;
    if (deborde(corps) || orphelins) {
      const t2 = texte.cloneNode(false); suite.prepend(t2);
      const ps = [...texte.children];
      for (let i = ps.length - 1; i >= 1; i--) { t2.prepend(ps[i]); if (!deborde(corps) && (!orphelins || t2.children.length)) break; }
    }
    if (deborde(corps)) { bloc.innerHTML = avant; return null; }
    return suite.children.length ? suite : null;
  }
  // Une seule composition : les pages sont toujours composées à la même largeur (430 px),
  // puis agrandies ou réduites à l'affichage ; les coupures ne dépendent pas de l'écran.
  function ajusterZoom() {
    const zone = $('.apercu__pages'); if (!zone || zone.closest('.apercu--cache')) return;
    const dispo = zone.parentElement.clientWidth;
    const double = ui.zoom === 'double' && dispo >= 640;
    zone.classList.toggle('apercu__pages--une', !double);
    zone.style.zoom = Math.min(double ? 1 : 1.45, dispo / (double ? 860 : 430));
  }
  window.addEventListener('resize', ajusterZoom);
  let jeton = 0;
  // Dés imprimés (F11.4) : faces réparties également, deux pages de droite qui se suivent ne portent pas le même tirage,
  // et le même livre donne les mêmes faces d'un export à l'autre
  const PIPS = { 1: [[20, 20]], 2: [[12, 12], [28, 28]], 3: [[12, 12], [20, 20], [28, 28]], 4: [[12, 12], [28, 12], [12, 28], [28, 28]], 5: [[12, 12], [28, 12], [20, 20], [12, 28], [28, 28]], 6: [[12, 11], [28, 11], [12, 20], [28, 20], [12, 29], [28, 29]] };
  const faceDe = n => `<svg class="pl-de" viewBox="0 0 40 40" aria-hidden="true"><rect x="2.5" y="2.5" width="35" height="35" rx="7"/>${PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4"/>`).join('')}</svg>`;
  const TIRAGES = [[3, 6, 1, 4, 2, 5], [5, 2, 6, 3, 1, 4]];
  const tirage = (k, nb) => nb === 2 ? [TIRAGES[0][k % 6], TIRAGES[1][(k + Math.floor(k / 6)) % 6]] : [TIRAGES[0][k % 6]];
  // Place la fenêtre sur un élément de l'aperçu ; la rangée vient se ranger sous la barre de l'application
  function placer(el) {
    const zone = $('.apercu__pages'); const rang = $('.livre-apercu'); if (!el || !zone || !rang) return;
    // Écran étroit, onglet « Scène » : l'aperçu est composé hors écran ; la fenêtre se place sur la scène
    if (el.getBoundingClientRect().left < -5000) { window.scrollTo(0, rang.getBoundingClientRect().top + window.scrollY - 62); return; }
    if (ui.cadre) {
      // Capture sans défilement (?cadre=1) : les pages sont remontées dans leur colonne, comme après le défilement
      zone.style.translate = ''; const r = el.getBoundingClientRect(); const z = zone.getBoundingClientRect();
      const y = Math.max(0, r.top + r.height / 2 - z.top - (window.innerHeight - z.top) / 2); zone.style.translate = `0 ${-y / (+zone.style.zoom || 1)}px`;
    } else { const r = el.getBoundingClientRect(); const haut = rang.getBoundingClientRect().top + window.scrollY - 70; window.scrollTo(0, Math.max(haut, r.top + window.scrollY + r.height / 2 - window.innerHeight / 2)); }
  }
  async function paginer() {
    const zone = $('.apercu__pages'); const src = $('#livre-source'); if (!zone || !src) return;
    const moi = ++jeton;
    await document.fonts.ready; if (moi !== jeton || !document.body.contains(zone)) return;
    // La hauteur est gardée pendant le calcul : la fenêtre ne remonte pas quand les pages sont remplacées
    zone.style.minHeight = `${zone.offsetHeight}px`; zone.innerHTML = ''; ajusterZoom();
    let page = null, n = 0, recit = false;
    let debut = false;
    const nouvelle = () => { page = creerPage(++n); if (recit) { page.classList.add('pl--recit'); if (!debut) { debut = true; page.classList.add('pl--debut'); } } else page.classList.add('pl--presentation'); zone.appendChild(page); return page.querySelector('.pl__corps'); };
    const deborde = corps => corps.scrollHeight > corps.clientHeight + 1;
    [...src.children].forEach(bloc => {
      // Le récit commence sur une page de droite : une page blanche le précède si nécessaire (F11-AC48)
      if (bloc.dataset.debutRecit) { page = null; if (n % 2) { nouvelle(); page.classList.add('pl--blanche'); page = null; } recit = true; return; }
      if (bloc.dataset.finRecit) { if (page) page.dataset.fin = '1'; recit = false; page = null; return; }
      if (bloc.dataset.seule) {
        let c = nouvelle(); const cls = `pl--${bloc.dataset.seule}`; page.classList.add(cls);
        if (bloc.dataset.coule) {
          // Page de présentation plus longue qu'une page : elle continue sur la suivante, sans couper une section (F11-AC52)
          const sections = [...bloc.children]; let cont = bloc.cloneNode(false); c.appendChild(cont);
          sections.forEach(el => { cont.appendChild(el); if (deborde(c) && cont.children.length > 1) { cont.removeChild(el); c = nouvelle(); page.classList.add(cls, 'pl--suite'); cont = bloc.cloneNode(false); c.appendChild(cont); cont.appendChild(el); } });
        } else c.appendChild(bloc);
        page = null; return;
      }
      let corps = page?.querySelector('.pl__corps');
      if (!corps || (bloc.dataset.nouvellePage && corps.children.length)) { if (page && bloc.dataset.nouvellePage) page.dataset.saut = '1'; corps = nouvelle(); }
      corps.appendChild(bloc);
      if (deborde(corps) && corps.children.length > 1) {
        const suite = scinder(bloc, corps, deborde);
        if (suite) { corps = nouvelle(); corps.appendChild(suite); }
        else { corps.removeChild(bloc); corps = nouvelle(); corps.appendChild(bloc); }
      }
    });
    const b = bas(); const nbDes = A.jeu.J.feuille.des; let droite = 0; ui.peu = [];
    $$('.pl', zone).forEach(p => {
      const nums = [...new Set($$('.passage', p).map(x => +x.dataset.n).filter(Boolean))];
      $('.pl__passages', p).textContent = nums.length ? (nums.length > 1 ? `${nums[0]} – ${nums[nums.length - 1]}` : `${nums[0]}`) : '';
      if (!p.classList.contains('pl--recit') || p.classList.contains('pl--blanche')) return;
      // Bas de page du récit : rien, numéro de page ou dés (F11.4) ; les dés ne s'impriment qu'en page de droite
      const no = +p.dataset.page; const zoneBas = $('.pl__bas', p);
      if (b === 'folio') zoneBas.innerHTML = `<span class="pl__folio">${no}</span>`;
      else if (b === 'des' && no % 2) { const t = tirage(droite++, nbDes); zoneBas.innerHTML = `<span class="pl__des" role="img" aria-label="Dé imprimé : ${t.join(' et ')}">${t.map(faceDe).join('')}</span>`; }
      // Page peu remplie (F11.3) : plus d'un quart de blanc (seuil proposé, révisé le 4 octobre 2026), hors blanc voulu avant une partie, un chapitre ou un saut demandé
      const corps = $('.pl__corps', p); const dernier = corps.lastElementChild;
      if (!dernier || p.classList.contains('pl--image') || p.dataset.saut || p.dataset.fin) return;
      const plein = dernier.offsetTop + dernier.offsetHeight; const blanc = 1 - plein / corps.clientHeight;
      if (blanc > 1 / 4) {
        ui.peu.push(no); p.classList.add('pl--peu'); p.dataset.blanc = Math.round(blanc * 100); p.dataset.blancMm = Math.round(blanc * (209.9 - ui.marges.h - ui.marges.b));
        corps.insertAdjacentHTML('beforeend', `<p class="pl__blanc" style="top:${Math.round(plein + corps.clientHeight * .03)}px">${ic('i-pages')}<span><b>${Math.round(blanc * (209.9 - ui.marges.h - ui.marges.b))} mm de blanc</b> · page peu remplie</span></p>`);
      }
    });
    ajusterZoom(); ui.nbPages = n; const nb = $('#livre-nbpages'); if (nb) nb.textContent = `${n} pages`;
    zone.style.minHeight = ''; majPagesTiroir(); majPeu(); majMini(zone); verifierOrdre(zone);
    if (ui.section) { const sec = $(`#sec-${ui.section}`); ui.section = null; if (sec) { ui.scroll = null; window.scrollTo(0, sec.getBoundingClientRect().top + window.scrollY - 136); sec.querySelector('h3')?.focus({ preventScroll: true }); } }
    if (ui.viserSel) { const p = $(ui.viserSel, zone); ui.viserSel = null; ui.viser = null; if (p) { ui.scroll = null; placer(p); } }
    else if (ui.viser) { const p = $(`.passage[data-ref="${ui.viser}"]`, zone); ui.viser = null; if (p) { ui.scroll = null; placer(p); } }
    else if (ui.viserPage) { ui.viserPage = false; const p = $('.pl--vise', zone); if (p) { ui.scroll = null; placer(p); } }
    if (ui.scroll != null) { window.scrollTo(0, ui.scroll); ui.scroll = null; }
    $$('.pages-n').forEach(x => { x.textContent = `${ui.pdfPages || n} pages`; });
    if (ui.feuille) majFeuille(false);
    if (ui.flash) { const f = $(`.passage[data-ref="${ui.flash}"]`, zone); if (f) f.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => { ui.flash = null; $$('.passage.est-flash').forEach(x => x.classList.remove('est-flash')); }, 2400); }
  }
  // « Texte et pages » : une vraie double page du livre, en petit, suit les réglages à côté d'eux (4 octobre 2026)
  function majMini(zone) {
    const mini = $('#mini-livre'); if (!mini) return;
    const recit = $$('.pl--recit:not(.pl--blanche)', zone); const g = recit.find(p => !(+p.dataset.page % 2) && $('.passage', p)); const d = g && $(`.pl[data-page="${+g.dataset.page + 1}"]`, zone);
    if (!g || !d) return;
    mini.innerHTML = [g, d].map(p => { const c = p.cloneNode(true); c.classList.remove('pl--vise', 'pl--peu'); c.querySelectorAll('.pl__blanc').forEach(x => x.remove());
      c.querySelectorAll('*').forEach(x => { ['data-ref', 'data-act', 'role', 'tabindex', 'id'].forEach(a => x.removeAttribute(a)); x.classList.remove('est-ouvert', 'est-flash'); }); return c.outerHTML; }).join('');
  }
  // Doute sur l'ordre des passages (F11.6, 4 octobre 2026) : une fois l'ordre décidé, si une modification fait changer
  // des passages de page, la tâche « Réordonner les passages » le signale. Une coquille sans effet ne demande rien.
  function verifierOrdre(zone) {
    if (!choix() || !ui.agencement) { ui.sigOrdre = null; return; }
    const sig = $$('.passage', zone).map(x => `${x.dataset.ref}:${x.closest('.pl').dataset.page}`).join(' ');
    if (ui.sigOrdre != null && sig !== ui.sigOrdre && !ui.doute) {
      ui.doute = true; const S = modele(); const N = numeroter(S); const P = controler(S, N);
      const f = $('.temps'); if (f) f.outerHTML = frise(S, N, P, st.arg);
      const v = $('.volets'); if (v) v.outerHTML = voletsPage();
      const o = $('#sec-ordre'); if (o) o.outerHTML = sectionOrdre(S, N);
    }
    ui.sigOrdre = sig;
  }
  // Pages peu remplies : compteur de la barre et page visée
  function majPeu() {
    const l = ui.peu || []; if (ui.peuRang && l.length) { ui.peuPage = l[Math.min(ui.peuRang, l.length) - 1]; ui.peuRang = null; if (!ui.viser) ui.viserPage = true; }
    if (!l.includes(ui.peuPage)) ui.peuPage = null;
    $$('.pl--vise').forEach(p => p.classList.remove('pl--vise'));
    if (ui.peuPage) $(`.apercu__pages .pl[data-page="${ui.peuPage}"]`)?.classList.add('pl--vise');
    const c = $('#peu-compte'); if (c) c.textContent = !l.length ? 'aucune' : ui.peuPage ? `${l.indexOf(ui.peuPage) + 1} sur ${l.length} · page ${ui.peuPage}` : `${l.length}`;
    $$('[data-act="livre-peu"]').forEach(b => { b.disabled = !l.length; });
    const z = $('#peu-zone'); if (z) z.innerHTML = suggestions();
    // Capture : ?suggere=1 valide le premier passage suggéré de la page visée
    if (ui.autoSuggere && ui.peuPage) { ui.autoSuggere = false; setTimeout(() => $('#peu-zone [data-act="livre-suggere"]')?.click(), 60); }
  }

  /* ——— En-tête de la destination Livre ——————————————————————— */
  const dateCourte = () => M().court;
  function etatPdf(P) {
    if (ui.pdf && ui.change) return `<p class="livre-pdf livre-pdf--change">${ic('i-alerte')}<span><b>Le livre a changé depuis le PDF définitif</b> du ${ui.pdf}. Un nouveau PDF définitif reste possible.</span></p>`;
    if (ui.pdf) return `<p class="livre-pdf livre-pdf--ok">${ic('i-coche')}<span><b>PDF définitif à jour</b> : ${ui.pdf}.</span></p>`;
    const nb = bloquants(P).length;
    return nb
      ? `<p class="livre-pdf">${ic('i-bloque')}<span><b>PDF définitif pas encore possible</b> : ${nb} problème${nb > 1 ? 's' : ''} à corriger.</span></p>`
      : `<p class="livre-pdf livre-pdf--ok">${ic('i-coche')}<span><b>Le PDF définitif est possible.</b> Aucun problème bloquant.</span></p>`;
  }
  /* ——— Les étapes du livre (F11.6, parcours guidé du 3 octobre 2026) ————————————
     Une seule ligne en tête de la destination Livre : trois temps (deux en récit classique), puis l'arrivée
     « Imprimer et partager ». Les deux premiers temps sont ouverts dès le début ; « Mettre en page » s'ouvre quand
     ils sont terminés, l'arrivée quand l'adulte a déclaré que la mise en page lui convient. Une étape ouverte ne se
     referme pas. Le canard désigne l'étape en cours ; une coche remplace le numéro d'une étape terminée. */
  const ETAPES = { relire: 'Relire', chemins: 'Vérifier les chemins', page: 'Mettre en page', sortie: 'Imprimer et partager' };
  // Récit classique : deux temps, les contrôles des chemins n'y ont pas lieu d'être
  const tempsLivre = () => choix() ? ['relire', 'chemins', 'page'] : ['relire', 'page'];
  const tempsEnCours = () => tempsLivre().includes(ui.temps) ? ui.temps : 'relire';
  // Temps où se traite chaque nature de problème
  const TEMPS_DE = { pretes: 'relire', vide: 'relire', image: 'relire', resolution: 'relire', hors: 'relire', depart: 'chemins', dest: 'chemins', issue: 'chemins', numero: 'chemins', inaccessible: 'chemins', sortie: 'chemins', jeu: 'chemins', ajustement: 'page', insertion: 'page' };
  const duTemps = (P, t) => P.filter(p => TEMPS_DE[p.k] === t && !p.differe);
  const plur = n => n > 1 ? 's' : '';
  const phrasePeu = () => { const n = (ui.peu || []).length; return !ui.nbPages ? 'pages en calcul' : !n ? 'aucune page peu remplie' : `${n} page${plur(n)} peu remplie${plur(n)}`; };
  // Avertissement accepté (« C'est voulu ») : il ne compte plus parmi ce qui reste à faire
  const accepte = p => p.g === 'avert' && (ui.acceptes.has(clePb(p)) || (ui.preAccepte && !ui.retires.has(clePb(p))));
  // Ce qui reste dans un temps : scènes à finir (l'état normal d'un livre en cours), points à corriger, passages à confirmer
  function resteNb(t, P) {
    const l = duTemps(P, t); const finir = l.filter(p => p.k === 'pretes').length;
    return { finir, corriger: l.filter(p => p.g === 'bloque').length - finir, confirmer: l.filter(p => p.g === 'avert' && !accepte(p)).length };
  }
  // Un fait se calcule, un jugement se pose : « Mettre en page » est terminée par la déclaration de l'adulte
  const terminee = (t, P) => t === 'sortie' ? !!ui.pdf && !ui.change : t === 'page' ? ui.convient && !ui.doute : rienNeReste(t, P) && ui.declare[t];
  const rienNeReste = (t, P) => Object.values(resteNb(t, P)).every(n => !n);
  const DECLARER = { relire: 'J’ai relu le livre', chemins: 'J’ai vérifié les chemins' };
  function ouverte(t, P) {
    if (t === 'relire' || t === 'chemins' || ui.ouvertes.has(t)) return true;
    const ok = t === 'page' ? tempsLivre().filter(x => x !== 'page').every(x => terminee(x, P)) : ui.convient;
    if (ok) ui.ouvertes.add(t);
    return ok;
  }
  // Bulle d'information : ancrée à son icône, elle reste affichée jusqu'à ce qu'on la ferme (4 octobre 2026)
  const info = (txt, sujet) => `<button class="info" data-act="livre-info" data-msg="${esc(txt)}" aria-expanded="false" aria-label="${esc(sujet || 'Que faut-il savoir ici ?')}">${ic('i-info')}</button>`;
  /* Ligne d'étapes allégée (4 octobre 2026) : plus de décompte sous le nom. Une marque dit seulement qu'il reste
     quelque chose (triangle), que l'étape attend la fin de l'écriture (sablier) ou qu'elle est fermée (cadenas) ;
     le détail se lit en ouvrant l'étape. La marque garde son texte au survol et pour les lecteurs d'écran. */
  function marqueDe(t, S, N, P) {
    if (!ouverte(t, P)) return { ic: 'i-cadenas', g: 'ferme', txt: t === 'page' ? (choix() ? 'fermée, s’ouvre après les deux premières étapes' : 'fermée, s’ouvre après « Relire »') : 'fermée, s’ouvre après la mise en page' };
    if (t === 'page') return ui.doute ? { ic: 'i-alerte', g: 'avert', txt: 'ordre des passages à confirmer' } : null;
    if (t === 'sortie') {
      if (bloquants(P).some(p => !p.differe) || !ui.convient || ui.doute) return { ic: 'i-alerte', g: 'avert', txt: 'PDF définitif pas encore possible' };
      if (ui.pdf && ui.change) return { ic: 'i-alerte', g: 'avert', txt: 'le livre a changé depuis le PDF définitif' };
      if ((A.livre.pointPartage?.(S, N, P) || '').includes('tpoint--avert')) return { ic: 'i-alerte', g: 'avert', txt: 'partage à mettre à jour' };
      return null;
    }
    const r = resteNb(t, P); const o = [r.corriger ? `${r.corriger} à corriger` : '', r.confirmer ? `${r.confirmer} à confirmer` : '', r.finir ? `${r.finir} scène${plur(r.finir)} à finir` : ''].filter(Boolean);
    // Septembre ne doit pas paraître fautif (F11.6, 4 octobre 2026) : tant qu'il reste des scènes à finir et rien à corriger,
    // « Vérifier les chemins » attend l'écriture ; ses passages à confirmer restent listés dans sa tâche
    const attend = t === 'chemins' ? resteNb('relire', P).finir : 0;
    if (r.corriger || (r.confirmer && !attend)) return { ic: 'i-alerte', g: 'avert', txt: `il reste à faire : ${o.join(', ')}` };
    if (attend) return { ic: 'i-horloge', g: 'attente', txt: `attend la fin de l’écriture${o.length ? ` ; ${o.join(', ')}` : ''}` };
    return r.finir ? { ic: 'i-horloge', g: 'attente', txt: o.join(', ') } : null;
  }
  function frise(S, N, P, sous) {
    const ici = ['exports', 'partage'].includes(sous) ? 'sortie' : tempsEnCours();
    const etape = (t, i) => {
      const fermee = !ouverte(t, P); const ok = !fermee && terminee(t, P); const m = ok ? null : marqueDe(t, S, N, P);
      return `<li class="temps__etape"><a class="temps__lien ${t === ici ? 'est-en-cours' : ''} ${fermee ? 'est-fermee' : ''}" href="${t === 'sortie' ? '#/livre/exports' : '#/livre'}" ${t === 'sortie' ? '' : `data-act="livre-temps" data-v="${t}"`} ${t === ici ? 'aria-current="step"' : ''} ${m ? `title="${esc(cap(m.txt))}"` : ''}>
        <span class="temps__num ${ok ? 'temps__num--faite' : ''}" aria-hidden="true">${ok ? ic('i-coche') : i + 1}</span>
        <span class="temps__nom">${ETAPES[t]}${t === ici ? '<span class="vh"> — étape en cours</span>' : ''}${ok ? '<span class="vh"> — terminée</span>' : ''}</span>
        ${m ? `<span class="temps__marque temps__marque--${m.g}">${ic(m.ic)}<span class="vh"> — ${m.txt}</span></span>` : ''}</a></li>`;
    };
    return `<div class="temps">
      <nav class="temps__frise" aria-label="Étapes pour préparer le livre"><ol>${[...tempsLivre(), 'sortie'].map(etape).join('')}</ol></nav>
      <button class="temps__hors temps__aide" data-act="livre-aide" title="Que fait-on à cette étape ?">${ic('i-aide')}Aide</button>
    </div>`;
  }
  /* Étape fermée : elle dit ce qui reste à faire pour l'ouvrir et mène au temps concerné (F11-AC63, F11-AC72) */
  function porte(t, S, N, P) {
    const page = t === 'page';
    const lignes = tempsLivre().filter(x => x !== 'page').map(x => {
      const r = resteNb(x, P); const o = [r.finir ? `${r.finir} scène${plur(r.finir)} à finir` : '', r.corriger ? `${r.corriger} point${plur(r.corriger)} à corriger` : '', r.confirmer ? `${r.confirmer} ${x === 'chemins' ? 'passage' : 'point'}${plur(r.confirmer)} à confirmer` : ''].filter(Boolean);
      if (!o.length && !ui.declare[x]) o.push(`« ${DECLARER[x]} » reste à déclarer`);
      return o.length ? `<li>${ic('i-fleche')}<span>${versTemps(x, ETAPES[x])} · ${o.join(' · ')}</span></li>` : `<li class="est-faite">${ic('i-coche')}<span>${ETAPES[x]} · terminé</span></li>`;
    }).join('');
    // « Mettre en page » encore fermée n'est pas un lien : il mènerait à un autre écran fermé
    const mep = page ? '' : ouverte('page', P) ? `<li>${ic('i-fleche')}<span>${versTemps('page', ETAPES.page)} · « La mise en page me convient » reste à déclarer</span></li>` : `<li class="est-fermee">${ic('i-cadenas')}<span>${ETAPES.page} · s’ouvre ensuite</span></li>`;
    return `<section class="porte" aria-labelledby="porte-t"><span class="porte__ic" aria-hidden="true">${ic('i-cadenas')}</span>
      <h2 id="porte-t" tabindex="-1">« ${ETAPES[t]} » n’est pas encore ouverte</h2>
      <p class="porte__quoi">${page ? `Elle s’ouvre quand ${choix() ? 'toutes les scènes sont prêtes et les chemins vérifiés' : 'toutes les scènes sont prêtes'}.` : 'Elle s’ouvre quand la mise en page vous convient.'} ${info(page ? 'La mise en page dépend de la longueur de chaque scène : sur un livre incomplet, elle serait à refaire. Une scène en retard peut être attendue, terminée par vous ou exclue du livre, depuis son menu.' : 'Le PDF définitif et le partage portent sur le livre mis en page. Une fois ouverte, cette étape ne se referme plus.', page ? 'Quand la mise en page s’ouvre-t-elle ?' : 'Quand cette étape s’ouvre-t-elle ?')}</p>
      <ul class="porte__reste">${lignes}${mep}</ul>
      ${resteNb('relire', P).finir ? `<p class="porte__issue"><span>Une scène qui ne sera pas finie peut être exclue du livre, depuis son menu ${ic('i-points')}.</span></p>` : ''}</section>`;
  }
  /* Aide à l'ouverture d'une étape (F11.6) : un écran très simple, que le bouton « Aide » rouvre. La première
     question est ouverte d'emblée. Depuis le 4 octobre 2026, l'écran revient à l'ouverture de l'étape tant que la
     case « Ne plus afficher » n'est pas cochée. */
  const AIDE = {
    relire: ['On lit le livre d’une traite et on corrige ce qu’on voit.', [
      ['Que veut dire « scène prête » ?', 'Une scène que vous avez relue et que vous jugez bonne pour le livre. Le travail d’un élève peut être validé sans que la scène soit prête : il reste parfois une image ou une finition.'],
      ['À quoi sert le PDF de travail ?', 'À relire sur papier. Il porte la mention « Version de travail » et la référence de chaque scène : ce n’est pas le livre à imprimer.'],
      ['Pourquoi la mise en page est-elle fermée ?', 'Elle dépend de la longueur de chaque scène. Elle s’ouvre quand toutes sont prêtes et que les chemins sont vérifiés.']]],
    chemins: ['On vérifie que chaque choix mène quelque part et que chaque chemin a une fin.', [
      ['Que veut dire « Aucun chemin n’y mène » ?', 'Aucun choix ne conduit à ce passage depuis le départ. C’est peut-être voulu, comme un passage caché, ou c’est un oubli.'],
      ['Que veut dire « C’est voulu » ?', 'Vous dites que ce n’est pas une erreur. L’application ne vous le redemande plus, sauf si les chemins changent.'],
      ['À quoi sert « Tester la lecture » ?', 'À lire le livre comme un lecteur, choix après choix. Dans l’aperçu, un clic sur un renvoi mène aussi au passage visé.']]],
    page: ['On règle l’allure du livre, puis on remplit mieux les pages à moitié vides.', [
      ['Pourquoi les numéros changent-ils ?', 'Réordonner les passages les déplace pour mieux remplir les pages. Les renvois suivent : aucun choix ne change de destination.'],
      ['Que veut dire « page peu remplie » ?', 'Une page dont plus d’un quart reste blanc. Ce n’est pas une erreur, seulement une aide.'],
      ['Et si une scène change ensuite ?', 'Les réglages vous le signalent, à « Ordre des passages ». Vous gardez l’ordre, ou vous réordonnez à nouveau : vos réglages de texte et de pages sont conservés.']]],
    sortie: ['Le livre est prêt : on fabrique le fichier pour l’imprimeur et, si on veut, on le partage en ligne.', [
      ['Le PDF définitif peut-il encore changer ?', 'Non : un fichier produit ne change plus. Si le livre change, vous en demandez un nouveau.'],
      ['Qui peut lire le livre partagé ?', 'Les personnes à qui vous donnez le lien, sans compte, et vos classes si vous le choisissez. Ils lisent une copie datée : vos corrections n’y entrent que lorsque vous la mettez à jour.'],
      ['Et la couverture ?', 'Elle se prépare dans l’outil de l’imprimeur, qui calcule le dos d’après le nombre de pages.']]]
  };
  const TACHES_AIDE = () => ({
    relire: ['Voir ce qui reste à écrire', 'Corriger les erreurs graves', 'Confirmer les images peu nettes', 'Lire, corriger les coquilles, puis dire que vous avez relu'],
    chemins: ['Départ et fins', 'Choix à relier', 'Passages à confirmer', 'Tester la lecture, puis dire que vous avez vérifié les chemins'],
    page: ['Régler le texte et les pages', choix() ? 'Réordonner les passages, si vous le voulez' : '', 'Choisir les pages de début et de fin', 'Regarder l’aperçu et combler les blancs', 'Dire que la mise en page vous convient'].filter(Boolean),
    sortie: ['Créer le PDF définitif', 'Préparer la couverture chez l’imprimeur', 'Partager le livre, si vous le souhaitez']
  });
  function aideEtape(t) {
    const [quoi, questions] = AIDE[t]; const rang = [...tempsLivre(), 'sortie'].indexOf(t) + 1; const premiere = !ui.aideVue.has(t);
    return `<section class="aide-etape" aria-labelledby="aide-t">
      <p class="aide-etape__rang">Étape ${rang}</p><h2 id="aide-t" tabindex="-1">${ETAPES[t]}</h2>
      <div class="aide-etape__q">
        <details open><summary>Que fait-on maintenant ?</summary><p>${quoi}</p><ol class="aide-etape__taches">${TACHES_AIDE()[t].map(x => `<li>${x}</li>`).join('')}</ol></details>
        ${questions.map(([q, r]) => `<details><summary>${q}</summary><p>${r}</p></details>`).join('')}
      </div>
      <p class="aide-etape__cmd"><button class="btn btn--primaire btn--grand" data-act="livre-commencer">${premiere ? 'Commencer' : 'Fermer l’aide'}</button>
        <label class="aide-etape__plus"><input type="checkbox" data-act="livre-aide-jamais" data-v="${t}" ${ui.aideJamais.has(t) ? 'checked' : ''}><span>Ne plus afficher</span></label></p></section>`;
  }

  /* ——— Points à traiter ——————————————————————————————————————— */
  const titreDe = (S, r) => `<span class="code">${r}</span> ${esc(S[r]?.titre || '')}`;
  const voir = (N, r) => N.num[r] || !choix() ? `<button class="lien" data-act="livre-voir" data-ref="${r}">${choix() ? `Voir au n° ${N.num[r]}` : 'Voir dans l’aperçu'}</button>` : '';
  // Ouvrir la scène d'un point : elle s'affiche à côté de l'aperçu, placé sur son passage ; « Fermer » ramène à la
  // liste de l'étape, sans passer par le bouton « Précédent » du navigateur (4 octobre 2026)
  const ouvrir = p => `<button class="lien" data-act="livre-traiter" data-k="${esc(clePb(p))}">Ouvrir la scène</button>`;
  // Un avertissement se corrige ou s'accepte ; un problème bloquant ne s'accepte pas (F09.2, F11.6)
  const voulu = p => `<button class="btn btn--petit" data-act="livre-accepter" data-k="${esc(clePb(p))}">${ic('i-coche')}${p.k === 'resolution' ? 'Garder ainsi' : 'C’est voulu'}</button>`;
  /* Messages courts (4 octobre 2026) : une phrase simple dans la liste (quoi) ; le détail est donné quand la scène
     est ouverte (detail). */
  function detailProbleme(p, S, N) {
    const x = S[p.ref]; let quoi = '', detail = '', act = [];
    switch (p.k) {
      case 'dest': quoi = S[p.dest] ? 'Un choix mène hors du livre.' : 'Un choix ne mène nulle part.';
        detail = S[p.dest] ? `« ${esc(p.lib)} » mène à <span class="code">${p.dest}</span>, qui est hors du livre.` : `« ${esc(p.lib)} » n’a pas encore de destination.`;
        act = [ouvrir(p), S[p.dest] ? `<button class="lien" data-act="livre-inclure" data-ref="${p.dest}">Réintégrer ${p.dest}</button>` : '']; break;
      case 'issue': quoi = 'Cette scène est une impasse.'; detail = 'Elle n’a ni choix, ni énigme, ni repère de fin : le lecteur ne peut ni continuer ni finir.';
        act = [ouvrir(p), `<button class="lien" data-act="livre-fin" data-ref="${p.ref}">Marquer comme fin</button>`]; break;
      case 'vide': quoi = x.etat === 'prete' ? 'Déclarée prête, mais vide.' : 'Pas encore de texte.'; detail = x.etat === 'prete' ? 'La scène est déclarée prête pour le livre et n’a aucun texte.' : ''; act = [ouvrir(p)]; break;
      case 'image': quoi = 'Image introuvable.'; detail = `Le fichier « ${esc(x.image.nom)} » n’a pas été retrouvé.`;
        act = [ouvrir(p), `<button class="lien" data-act="livre-image" data-ref="${p.ref}">Importer à nouveau</button>`]; break;
      case 'numero': quoi = 'Une énigme mène à un numéro qui n’existe pas.'; detail = `L’énigme mène au n° ${p.num}, mais le livre n’en compte que ${p.total}.`; act = [ouvrir(p)]; break;
      case 'depart': quoi = 'Le livre n’a pas de départ.'; detail = 'La scène de départ est hors du livre.'; act = [ouvrir(p)]; break;
      case 'pretes': quoi = `<span class="probleme__etat">${tampon(x.etat, true)}${x.etat === 'reprendre' && x.pec && !perso() ? ` <span>${D.eleves[x.pec].prenom} reprend son texte.</span>` : !x.pec && st.moment !== 'sept' ? ' <span>Écrite par l’adulte, finitions en cours.</span>' : ''}</span>`; act = [ouvrir(p)]; break;
      case 'inaccessible': quoi = 'Aucun chemin n’y mène.'; detail = 'Aucun choix n’y mène depuis le départ : passage caché voulu, ou choix oublié ?';
        act = [voulu(p), ouvrir(p), `<a class="lien" href="#/chapitre/${x.chap.id}/graphe">Voir les chemins du chapitre</a>`]; break;
      case 'sortie': quoi = 'Sa seule suite est une énigme.'; detail = 'Le lecteur qui ne résout pas l’énigme reste bloqué.'; act = [voulu(p), ouvrir(p)]; break;
      case 'resolution': quoi = 'Image peu définie.'; detail = `« ${esc(x.image.nom)} » sera peu nette à ${x.image.largeur} % de largeur. Réduisez-la, ou gardez-la telle quelle.`; act = [voulu(p), ouvrir(p)]; break;
      case 'ajustement': quoi = `L’échange de <span class="code">${p.ref}</span> et <span class="code">${p.b}</span> n’est plus appliqué : <span class="code">${p.absent}</span> est hors du livre.`; act = []; break;
      case 'insertion': quoi = `Réintégrée au n° ${N.num[p.ref]} : les numéros suivants sont décalés.`; act = [ouvrir(p)]; break;
      case 'jeu': quoi = `${p.n} passage${p.n > 1 ? 's demandent' : ' demande'} d’agir sur une feuille d’aventure, et le livre n’en a pas.`; act = ['<a class="lien" href="#/preparation">Composer la feuille d’aventure</a>']; break;
      case 'hors': quoi = 'Hors du livre.'; act = [`<button class="lien" data-act="livre-inclure" data-ref="${p.ref}">Réintégrer</button>`]; break;
    }
    return { quoi, detail: detail || quoi, act: act.filter(Boolean) };
  }
  function itemProbleme(p, S, N) {
    const { quoi, act } = detailProbleme(p, S, N);
    const titre = ['ajustement', 'jeu'].includes(p.k) ? '' : `<p class="probleme__scene">${titreDe(S, p.ref)}</p>`;
    return `<li class="probleme">${titre}<p class="probleme__quoi">${quoi}</p>${act.length ? `<p class="probleme__actions">${act.join('')}</p>` : ''}</li>`;
  }
  const versTemps = (t, lib) => `<a class="lien" href="#/livre" data-act="livre-temps" data-v="${t}">${lib}</a>`;
  /* Pages peu remplies et passage suggéré (F11.3) : pour le blanc de la page choisie, les passages situés plus loin
     dans le même groupe de mélange qui y tiendraient, le plus haut d'abord, trois au plus. Les hauteurs sont lues
     dans les pages composées par la maquette : elles n'ont pas valeur d'essai. */
  function candidats(no) {
    const zone = $('.apercu__pages'); const pg = zone && $(`.pl[data-page="${no}"]`, zone); if (!pg || !choix()) return null;
    const S = modele(); const N = numeroter(S); const utile = 209.9 - ui.marges.h - ui.marges.b; const blanc = +pg.dataset.blancMm;
    const corps = $('.pl__corps', pg); const surPage = $$('.passage', pg).map(x => x.dataset.ref); const dernier = surPage[surPage.length - 1]; if (!dernier) return null;
    // Double page : la page et sa voisine ; un passage n'y rejoint pas celui qui y mène
    const voisine = $(`.pl[data-page="${no % 2 ? no - 1 : no + 1}"]`, zone); const double = new Set([...surPage, ...(voisine ? $$('.passage', voisine).map(x => x.dataset.ref) : [])]);
    const mene = r => [...double].some(d => S[d] && [...S[d].choix, ...S[d].cachees].some(c => c.dest === r));
    // Blanc à l'intérieur d'un passage : sa suite (image pleine page, choix) ouvre la page suivante ; aucun passage ne peut s'y glisser
    const suivante = $(`.pl[data-page="${no + 1}"]`, zone);
    if (suivante && $(`[data-ref="${dernier}"]`, suivante)) return { dedans: N.num[dernier], ref: dernier, image: !!$(`.pl-image[data-ref="${dernier}"], .pl--image [data-ref="${dernier}"]`, suivante), blanc, l: [] };
    const g = N.groupe[dernier]; const suite = N.mobiles(g); const rang = N.num[dernier];
    const avant = suite.filter(r => N.num[r] <= rang); const apres = avant[avant.length - 1] || '';
    const marges = el => { const c = getComputedStyle(el); return (parseFloat(c.marginTop) || 0) + (parseFloat(c.marginBottom) || 0); };
    const haut = r => Math.ceil($$(`.passage[data-ref="${r}"]`, zone).reduce((h, el) => h + el.offsetHeight + marges(el), 0) / corps.clientHeight * utile);
    const l = suite.filter(r => N.num[r] > rang && !double.has(r) && !S[r].nouvellePage && S[r].image?.forme !== 'page' && !mene(r))
      .map(r => ({ ref: r, n: N.num[r], h: haut(r) })).filter(c => c.h > 0 && c.h <= blanc).sort((a, b) => b.h - a.h).slice(0, 3);
    return { blanc, apres, rang, l, ou: partiesDe(N.groupes[g] || [0]), S };
  }
  const N0 = () => numeroter(modele());
  // Dans la barre de l'aperçu, juste au-dessus de la page choisie : les passages qui peuvent combler son blanc
  function suggestions() {
    const no = ui.peuPage; if (!no || !retouches()) return '';
    const c = candidats(no); let corps;
    if (!choix()) corps = '<p class="sugg__rien"><span>Ouvrez la scène pour récrire une phrase ou déplacer une image.</span></p>';
    else if (c?.dedans) corps = `<p class="sugg__rien"><span>Ce blanc est dans le passage n° ${c.dedans} : rien ne peut s’y glisser. ${c.image ? 'Réduisez son image, ou laissez-le.' : 'Vous pouvez le laisser.'}</span><button class="btn btn--petit" data-act="livre-ouvrir" data-ref="${c.ref}">Ouvrir la scène</button></p>`;
    else if (!c || !c.l.length) corps = '<p class="sugg__rien"><span>Aucun passage ne tient dans ce blanc. Ouvrez une scène pour récrire ou déplacer une image.</span></p>';
    else corps = `<ol class="sugg__cands">${c.l.map((k, i) => `<li><span class="peu__n">${k.n}</span><span class="sugg__t"><b>${esc(c.S[k.ref].titre)}</b><span>${k.h} mm · reste ${c.blanc - k.h} mm</span></span><button class="btn btn--petit ${i ? '' : 'btn--primaire'}" data-act="livre-suggere" data-ref="${k.ref}" data-apres="${c.apres}">Placer ici</button></li>`).join('')}</ol>`;
    return `<div class="sugg"><p class="sugg__tete"><b>Page ${no}</b><span>${c ? `${c.blanc} mm de blanc` : ''}${c?.l.length ? ` · ${c.l.length} passage${plur(c.l.length)} ${c.l.length > 1 ? 'peuvent' : 'peut'} le combler` : ''}</span></p>${corps}</div>`;
  }
  /* ——— Tâches d'une étape (F11.6) ————————————————————————————————————————
     Depuis le 4 octobre 2026 : la liste des tâches en haut de la fiche, puis la tâche en cours, toujours au même
     endroit ; plus d'accordéon. À « Relire » et à « Vérifier les chemins », la fiche tient en colonne à côté de
     l'aperçu. « Mettre en page » n'a plus de tâches : deux volets, « Réglages » et « Aperçu ». Une tâche où il n'y
     a rien à faire reste affichée, à sa place. Une coche veut dire « il ne reste rien ». */
  const RAIL = { relire: 'i-oeil', chemins: 'i-graphe', page: 'i-pages' };
  const listeP = (l, S, N) => `<ul class="genre__liste points">${l.map(p => itemProbleme(p, S, N)).join('')}</ul>`;
  const fait = txt => `<p class="tache__ok">${ic('i-coche')}<span>${txt}</span></p>`;
  const acceptesHTML = (ok, S) => ok.length ? `<details class="acceptes"><summary>${ok.length} accepté${plur(ok.length)}</summary><ul>${ok.map(p => `<li><span>${titreDe(S, p.ref)}</span><button class="lien" data-act="livre-accepter" data-k="${esc(clePb(p))}" data-v="non">Revoir</button></li>`).join('')}</ul></details>` : '';
  const versTache = (id, lib) => `<button class="lien" data-act="livre-tache" data-v="${id}">${lib}</button>`;
  /* « Mettre en page » en deux volets (4 octobre 2026, après la troisième critique) : « Réglages » réunit, dans l'ordre,
     le texte et les pages, l'ordre des passages et les pages de début et de fin ; « Aperçu » montre le livre entier et
     sert à combler les blancs. Les deux onglets et la déclaration restent en vue pendant le défilement. Cette
     disposition remplace les cinq onglets de tâches, dont les ronds numérotés doublaient ceux des étapes, et le
     bouton d'aller-retour. */
  const retouches = () => tempsEnCours() === 'page' && (ui.volet === 'apercu' || !!ui.tiroir);
  function sectionOrdre(S, N) {
    const n = ui.ordres.length;
    const relance = info('Réordonner à nouveau repart de zéro : les numéros changent et les passages déplacés à la main reprennent une place calculée. Vos réglages de texte et de pages sont conservés.', 'Que fait « Réordonner à nouveau » ?');
    // Doute sur l'ordre (F11.6) : une modification a fait changer des passages de page ; l'adulte garde l'ordre ou réordonne
    const corps = ui.doute
      ? `<p class="tache__alerte">${ic('i-alerte')}<span><b>Le livre a changé.</b> Des passages ne sont plus sur la même page.</span></p>
          <p class="tache__cmd"><button class="btn btn--petit btn--primaire" data-act="livre-doute">${ic('i-coche')}Garder cet ordre</button><button class="btn btn--petit" data-act="livre-agencer" data-v="relance">${ic('i-melange')}Réordonner à nouveau</button>${relance}</p>`
      : ui.agencement === 'fait'
        ? `${fait('Passages réordonnés.')}<p class="tache__cmd"><button class="btn btn--petit" data-act="livre-agencer" data-v="">Annuler</button><button class="lien" data-act="livre-agencer" data-v="relance">Réordonner à nouveau</button>${relance}</p>`
        : ui.agencement === 'refuse'
          ? `${fait('Ordre actuel gardé.')}<p class="tache__cmd"><button class="lien" data-act="livre-agencer" data-v="offre">Réordonner les passages…</button></p>`
          : `<p class="tache__aide">Un nouvel ordre, calculé pour laisser le moins de blanc possible. ${info('Calculé dans chaque partie. Le départ garde le n° 1, un numéro fixé par une énigme ne bouge pas, et un passage n’est pas placé sur la double page de celui qui y mène. Aucun choix ne change de destination.', 'Comment le nouvel ordre est-il calculé ?')}</p>
            <p class="tache__alerte">${ic('i-alerte')}<span><b>Les numéros changent, les renvois suivent.</b>${n ? ` ${n > 1 ? `Vos ${n} passages déplacés` : 'Votre passage déplacé'} à la main ${n > 1 ? 'reprennent' : 'reprend'} une place calculée.` : ''}</span></p>
            <p class="tache__cmd"><button class="btn btn--petit" data-act="livre-agencer" data-v="fait">${ic('i-melange')}Réordonner les passages</button><button class="btn btn--petit" data-act="livre-agencer" data-v="refuse">Garder cet ordre</button></p>`;
    // Deux blocs côte à côte, comme à « Texte et pages » : où les passages se mélangent, puis le nouvel ordre proposé
    return `<section class="reg-section" id="sec-ordre" aria-labelledby="sec-ordre-t"><h3 id="sec-ordre-t" tabindex="-1">Ordre des passages${ui.doute ? `<span class="fil__marque fil__marque--avert">${ic('i-alerte')}<span class="vh"> — à confirmer</span></span>` : ''}</h3>
      <div class="tache__colonnes">${reg('Mélange par partie', 'Dans un livre à choix, les passages ne se suivent pas dans l’ordre de l’histoire. Ceux d’une même partie sont mélangés entre eux, et les parties restent dans l’ordre du plan. Le départ garde le n° 1 ; un numéro fixé par une énigme ne bouge pas. Réunir deux parties sert surtout quand l’une est très courte.', melangeHTML(S, N))}
        ${reg('Moins de blanc', '', corps)}</div></section>`;
  }
  /* Où les passages se mélangent (F11.5) : une ligne par partie, avec ses numéros ; entre deux parties, un interrupteur
     nommé les réunit. Remplace le ruban de cases colorées et ses « + », que rien n'expliquait (4 octobre 2026). */
  function melangeHTML(S, N) {
    const groupes = groupesParties(); const refsDe = g => N.liste.filter(r => g.includes(S[r].partie));
    const plage = refs => refs.length ? `n° ${N.num[refs[0]]} à ${N.num[refs[refs.length - 1]]}` : 'aucun passage';
    const joint = (i, on) => `<label class="inter melange__joint"><input type="checkbox" role="switch" data-act="livre-groupe" data-i="${i}" ${on ? 'checked' : ''}><span class="inter__piste" aria-hidden="true"></span><span>Mélanger les parties ${i + 1} et ${i + 2}</span></label>`;
    return `<p class="tache__aide">Les passages sont mélangés dans chaque partie : la suite d’un choix n’est pas à côté de lui.</p>
      <ol class="melange">${groupes.map((g, gi) => `<li class="melange__groupe ${g.length > 1 ? 'melange__groupe--reuni' : ''}">
        <div class="melange__parties">${g.map((i, k) => `<p class="melange__partie"><b>Partie ${i + 1}</b><span>${esc(H.parties[i].titre)}</span></p>${k < g.length - 1 ? joint(i, true) : ''}`).join('')}</div>
        <p class="melange__plage"><b>${plage(refsDe(g))}</b>${g.length > 1 ? '<span>mélangés ensemble</span>' : ''}</p></li>${gi < groupes.length - 1 ? `<li class="melange__entre">${joint(g[g.length - 1], false)}</li>` : ''}`).join('')}</ol>`;
  }
  function reglagesPage(S, N) {
    const R = reglagesHTML(S, N);
    const sec = (id, titre, corps) => `<section class="reg-section" id="sec-${id}" aria-labelledby="sec-${id}-t"><h3 id="sec-${id}-t" tabindex="-1">${titre}</h3>${corps}</section>`;
    return `<div class="livre-etape volet-cadre controles" role="tabpanel" aria-labelledby="volet-reglages" tabindex="-1">
      ${sec('texte', 'Texte et pages', `<div class="tache__colonnes">${R.texte}${R.recit}${R.sauts}${R.titres}</div>`)}
      ${choix() ? sectionOrdre(S, N) : ''}
      ${sec('presentation', 'Pages de début et de fin', pagesPresentation())}
      <p class="tache__suite"><span class="tache__suite-fin"><button class="btn btn--petit" data-act="livre-volet" data-v="apercu">Voir l’aperçu${ic('i-fleche')}</button></span></p>
    </div>`;
  }
  // La déclaration de l'étape reste au bout de la barre des volets : visible des réglages comme de l'aperçu
  function declarationPage() {
    if (ui.doute) return `<button class="lien volets__etat volets__etat--avert" data-act="livre-section" data-v="ordre">${ic('i-alerte')}Ordre des passages à confirmer</button><button class="btn btn--primaire" disabled>${ic('i-coche')}La mise en page me convient</button>`;
    if (ui.convient) return `<span class="volets__etat volets__etat--ok">${ic('i-coche')}Mise en page terminée</span><button class="lien" data-act="livre-convient" data-v="">Revenir sur cette déclaration</button><a class="btn btn--primaire" href="#/livre/exports">${ETAPES.sortie}${ic('i-fleche')}</a>`;
    return `${info('Ouvre « Imprimer et partager ». Vous pourrez encore retoucher.', 'Que change cette déclaration ?')}<button class="btn btn--primaire" data-act="livre-convient" data-v="1">${ic('i-coche')}La mise en page me convient</button>`;
  }
  function voletsPage() {
    const onglet = (v, icn, lib, plus = '') => `<button role="tab" id="volet-${v}" data-act="livre-volet" data-v="${v}" aria-selected="${ui.volet === v}">${ic(icn)}${lib}${plus}</button>`;
    return `<div class="volets"><div class="bascule" role="tablist" aria-label="Réglages ou aperçu">${onglet('reglages', 'i-reglages', 'Réglages', ui.doute ? `<span class="volets__marque">${ic('i-alerte')}<span class="vh"> — ordre des passages à confirmer</span></span>` : '')}${onglet('apercu', 'i-livre', 'Aperçu')}</div>
      <div class="volets__fin">${declarationPage()}</div></div>`;
  }
  /* Déclaration qui termine une étape (F11.6, 4 octobre 2026) : « J'ai relu le livre », « J'ai vérifié les chemins ».
     C'est un jugement de l'adulte, que l'application ne peut pas calculer ; elle se pose quand il ne reste rien aux
     tâches précédentes, et l'étape reçoit alors sa coche. */
  function declaration(t, P) {
    if (ui.declare[t] && rienNeReste(t, P)) return `${fait(t === 'relire' ? 'Livre relu.' : 'Chemins vérifiés.')}<p class="tache__cmd"><button class="lien" data-act="livre-declarer" data-k="${t}" data-v="">Revenir sur cette déclaration</button></p>`;
    const pret = rienNeReste(t, P);
    return `<p class="tache__cmd tache__declarer"><button class="btn btn--primaire" data-act="livre-declarer" data-k="${t}" data-v="1" ${pret ? '' : 'disabled'}>${ic('i-coche')}${DECLARER[t]}</button></p>${pret ? '' : '<p class="tache__aide">Possible quand les tâches précédentes sont terminées.</p>'}`;
  }
  function tachesDe(t, S, N, Ptous) {
    const P = duTemps(Ptous, t); const de = (...ks) => P.filter(p => ks.includes(p.k));
    // Rien à faire dans une tâche : elle reste à sa place ; elle n'est cochée que lorsqu'il ne reste plus de scène à finir,
    // dont les défauts d'écriture ne sont pas encore contrôlés (F09.2)
    const attente = resteNb('relire', Ptous).finir;
    const rien = txt => attente ? '<p class="tache__aide">Rien pour l’instant.</p>' : fait(txt);
    if (t === 'relire') {
      const finir = de('pretes'); const graves = de('image', 'vide'); const conf = de('resolution'); const aConf = conf.filter(p => !accepte(p)); const ok = conf.filter(accepte);
      const tr = ui.travail || (M().travail && { date: M().travail.date });
      return [
        { id: 'ecrire', titre: 'Ce qui reste à écrire', attente: finir.length,
          corps: finir.length ? `<p class="tache__chiffre"><b>${finir.length}</b> scène${plur(finir.length)} à finir</p><p class="tache__cmd"><a class="btn btn--petit btn--primaire" href="${perso() ? '#/plan' : '#/suivi'}" data-act="livre-suivi">${ic('i-grille')}${perso() ? 'Voir dans le plan' : 'Voir dans le Suivi'}</a>${info('Une scène est à finir tant que vous ne l’avez pas déclarée prête pour le livre. Ce geste se fait dans la scène. Une scène en retard peut aussi être exclue du livre, depuis son menu.', 'Que veut dire « à finir » ?')}</p>` : fait('Toutes les scènes sont prêtes.') },
        { id: 'graves', titre: 'Erreurs graves', reste: graves.length, corps: graves.length ? listeP(graves, S, N) : rien('Aucune erreur grave.') },
        { id: 'confirmer', titre: 'À confirmer', reste: aConf.length, avert: true,
          corps: `${aConf.length ? listeP(aConf, S, N) : conf.length ? fait('Tout est confirmé.') : rien('Rien à confirmer.')}${acceptesHTML(ok, S)}` },
        { id: 'lire', titre: 'Lire et corriger', declarer: true,
          corps: `<p class="tache__aide">Cliquez sur un passage : sa scène s’ouvre à côté.</p><p class="tache__cmd"><button class="btn btn--petit" data-act="livre-feuille" data-v="travail" aria-haspopup="dialog">${ic('i-pdf')}PDF de travail</button>${info(`Pour relire sur papier. Il porte la mention « Version de travail » : ce n’est pas le livre à imprimer.${tr ? ` Dernier : ${tr.date.split(' ').slice(1, 3).join(' ')}.` : ''}`, 'À quoi sert le PDF de travail ?')}${choix() ? '' : `<a class="btn btn--petit" href="#/lecture">${ic('i-livre')}Tester la lecture</a>`}</p>${declaration('relire', Ptous)}` }
      ];
    }
    const fins = de('depart', 'issue'); const relier = de('dest', 'numero'); const conf = de('inaccessible', 'sortie'); const aConf = conf.filter(p => !accepte(p)); const ok = conf.filter(accepte);
    return [
      { id: 'fins', titre: 'Départ et fins', reste: fins.length, corps: fins.length ? listeP(fins, S, N) : rien('Le départ et les fins sont en place.') },
      { id: 'relier', titre: 'Choix à relier', reste: relier.length, corps: relier.length ? listeP(relier, S, N) : rien('Tous les choix mènent quelque part.') },
      { id: 'confirmer', titre: 'Passages à confirmer', reste: aConf.length, avert: true,
        corps: `${aConf.length ? listeP(aConf, S, N) : conf.length ? fait('Tout est confirmé.') : rien('Rien à confirmer.')}${acceptesHTML(ok, S)}` },
      { id: 'essai', titre: 'Tester la lecture', declarer: true,
        corps: `<p class="tache__aide">Lisez comme un lecteur, ou suivez un renvoi d’un clic dans l’aperçu.</p><p class="tache__cmd"><a class="btn btn--petit" href="#/lecture">${ic('i-livre')}Tester la lecture</a></p>${declaration('chemins', Ptous)}` }
    ];
  }
  function ficheEtape(S, N, Ptous) {
    const t = tempsEnCours(); const l = tachesDe(t, S, N, Ptous); const aFinir = resteNb('relire', Ptous).finir;
    l.forEach(x => { x.faite = x.declarer ? terminee(t, Ptous) : !x.reste && !x.attente && !aFinir; });
    const cour = l.find(x => x.id === ui.tache[t]) || l.find(x => x.reste || x.attente) || l[l.length - 1];
    ui.tacheCourante = cour.id; const i = l.indexOf(cour); const suiv = l[i + 1];
    const num = (x, k) => `<span class="tache__n ${x.faite ? 'tache__n--faite' : ''}" aria-hidden="true">${x.faite ? ic('i-coche') : k + 1}</span>`;
    const etat = x => x.alerte ? `<span class="fil__marque fil__marque--avert">${ic('i-alerte')}<span class="vh"> — à confirmer</span></span>`
      : x.reste ? `<span class="compte compte--${x.avert ? 'avert' : 'bloque'}">${x.reste}<span class="vh"> ${x.avert ? 'à confirmer' : 'à corriger'}</span></span>`
        : x.attente ? `<span class="fil__marque">${ic('i-horloge')}<span class="vh"> — en attente de l’écriture</span></span>` : '';
    const fil = `<ol class="fil-taches" aria-label="Tâches de l’étape">${l.map((x, k) => `<li><button class="fil__b" data-act="livre-tache" data-v="${x.id}" ${x === cour ? 'aria-current="step"' : ''}>${num(x, k)}<span class="fil__nom">${x.titre}${x.faite ? '<span class="vh"> — fait</span>' : ''}</span>${etat(x)}</button></li>`).join('')}</ol>`;
    const infos = duTemps(Ptous, t).filter(p => p.g === 'info');
    const savoir = infos.length ? `<details class="asavoir" ${ui.savoirOuvert ? 'open' : ''}><summary>${ic('i-info')}À savoir <span class="compte">${infos.length}</span></summary>${listeP(infos, S, N)}</details>` : '';
    // Scènes à finir : leurs défauts d'écriture ne sont pas des problèmes ; leurs chemins sont vérifiés une fois prêtes (F09.2)
    const attente = t === 'chemins' ? resteNb('relire', Ptous).finir : 0;
    const note = attente ? `<p class="fiche-note">${ic('i-horloge')}<span>${attente} scène${plur(attente)} à finir : ${attente > 1 ? 'leurs choix seront vérifiés' : 'ses choix seront vérifiés'} ensuite.</span></p>` : '';
    // Pied de la fiche : la tâche suivante, puis l'étape suivante ; fermée, elle porte un cadenas
    const ordre = [...tempsLivre(), 'sortie']; const apres = ordre[ordre.indexOf(t) + 1]; const ferme = !ouverte(apres, Ptous);
    const continuer = suiv ? `<button class="btn btn--petit" data-act="livre-tache" data-v="${suiv.id}">Continuer${ic('i-fleche')}</button>` : '';
    const etapeSuiv = !suiv ? `<span class="controles__suite ${terminee(t, Ptous) && !ferme ? 'controles__suite--prete' : ''}">${ferme ? ic('i-cadenas') : ''}${versTemps(apres, `Étape suivante : ${ETAPES[apres]}`)}${ferme ? '' : ic('i-fleche')}</span>` : '';
    const pied = continuer || etapeSuiv ? `<p class="tache__suite"><span class="tache__suite-fin">${continuer}${etapeSuiv}</span></p>` : '';
    const panneau = `<div class="tache-panneau tache-panneau--${cour.id}" role="group" aria-labelledby="tache-t"><h3 class="vh" id="tache-t">${cour.titre}</h3>${cour.corps}</div>${savoir}${note}${pied}`;
    return `<section class="carnet-fiche carnet-fiche--decision controles" tabindex="-1"><header>${ic(RAIL[t])}<h2>${ETAPES[t]}</h2></header>
      <div class="carnet-fiche__corps">${fil}${panneau}</div></section>`;
  }
  /* ——— Parcours depuis l'aperçu : problèmes (F11.2) et pages peu remplies (F11.3) ———————————
     Le rail garde la liste par gravité ; le parcours la suit dans l'ordre du livre, un problème à la fois, la scène
     ouverte à côté. Les points « à savoir » ne sont pas des problèmes ; les pages peu remplies non plus. */
  const clePb = p => `${p.k}:${p.ref}:${p.dest || ''}:${p.lib || ''}`;
  const aParcourir = (P, N) => duTemps(P, tempsEnCours()).filter(p => p.g !== 'info' && p.k !== 'pretes' && !accepte(p)).sort((a, b) => (N.num[a.ref] || 999) - (N.num[b.ref] || 999));
  function parcoursHTML(P, N) {
    const l = aParcourir(P, N); const i = l.findIndex(p => clePb(p) === ui.pb); const bloque = l.some(p => p.g === 'bloque');
    const fleches = (act, quoi) => `<button class="parcours__b" data-act="${act}" data-v="-1" aria-label="${quoi} précédent${quoi.endsWith('e') ? 'e' : ''}">${ic('i-chevron-haut')}</button><button class="parcours__b" data-act="${act}" data-v="1" aria-label="${quoi} suivant${quoi.endsWith('e') ? 'e' : ''}">${ic('i-chevron-bas')}</button>`;
    const page = tempsEnCours() === 'page';
    const pb = l.length
      ? `<div class="parcours__g parcours__g--${bloque ? 'bloque' : 'avert'}" role="group" aria-label="Parcourir les problèmes">${ic(bloque ? 'i-bloque' : 'i-alerte')}<span class="parcours__t"><b>À traiter</b> <span>${i >= 0 ? `${i + 1} sur ${l.length}` : l.length}</span></span>${fleches('livre-pb', 'Problème')}</div>`
      : '';
    const peu = page && retouches() ? `<div class="parcours__g" role="group" aria-label="Parcourir les pages peu remplies">${ic('i-pages')}<span class="parcours__t"><b>Pages peu remplies</b> <span id="peu-compte"></span></span>${fleches('livre-peu', 'Page peu remplie')}${info('Une page est peu remplie quand plus d’un quart reste blanc. C’est une aide, pas une erreur : rien n’est bloqué. Choisissez une page : les passages qui peuvent combler son blanc s’affichent. Le passage placé prend le numéro qui suit, les renvois suivent, et rien n’est déplacé sans vous.', 'Que veut dire « page peu remplie » ?')}</div>` : '';
    return `<div class="parcours">${pb}${peu}</div>`;
  }
  function carteProbleme(S, N, P) {
    const t = ui.tiroir; if (!ui.pb || !t) return '';
    const l = aParcourir(P, N); const i = l.findIndex(p => clePb(p) === ui.pb);
    const nav = `<span class="pb-carte__nav"><button class="btn btn--petit" data-act="livre-pb" data-v="-1">${ic('i-chevron-haut')}Précédent</button><button class="btn btn--petit" data-act="livre-pb" data-v="1">${ic('i-chevron-bas')}Suivant</button></span>`;
    if (i < 0) return ui.pbRef === t.ref ? `<section class="pb-carte pb-carte--ok" role="status">${ic('i-coche')}<div class="pb-carte__txt"><h3>C’est réglé</h3>${l.length ? `<p>Il reste ${l.length} point${l.length > 1 ? 's' : ''} à traiter.</p>` : ''}</div><div class="pb-carte__fin">${l.length ? nav : ''}</div></section>` : '';
    const p = l[i]; if (p.ref !== t.ref) return '';
    // La scène est déjà ouverte à côté : ni « Voir au n° », ni « Ouvrir », sauf quand la suite se joue dans la page de la scène
    const d = detailProbleme(p, S, N); const act = d.act.filter(a => !a.includes('livre-voir') && !a.includes('livre-traiter'));
    return `<section class="pb-carte pb-carte--${p.g}" aria-labelledby="pb-titre">${ic(p.g === 'bloque' ? 'i-bloque' : 'i-alerte')}
      <div class="pb-carte__txt"><h3 id="pb-titre" tabindex="-1">${d.quoi}</h3>${d.detail !== d.quoi ? `<p>${d.detail}</p>` : ''}${act.length ? `<p class="probleme__actions">${act.join('')}</p>` : ''}</div>
      <div class="pb-carte__fin"><span class="pb-carte__rang">${p.g === 'bloque' ? 'À corriger' : 'À vérifier'} · ${i + 1} sur ${l.length}</span>${nav}</div></section>`;
  }

  /* ——— Scène ouverte à côté de l'aperçu (F11.2, F11.3) ———————————————————
     Un seul tiroir, à la place du rail des contrôles : la zone « Ce passage dans le livre », puis l'éditeur
     complet de la scène, le même que dans la page de scène (choix.js, jeu.js). L'aperçu reste à droite. */
  const X = () => A.editeur.x;
  const HEURES = { get ouverture() { return plusMin(2); }, get saisie() { return plusMin(4); } };
  const insec = t => t.replace(/ /g, '\u00A0');
  const partiesDe = g => g.length === 1 ? (H.parties.length === 1 ? 'tout le livre' : `la ${ORDINAUX[g[0]].toLowerCase()} partie`) : `les parties ${g.map(i => i + 1).join(' et ')}, mélangées ensemble`;
  // Rang d'un passage : ce qui l'empêche de bouger, ou les numéros entre lesquels il peut aller
  function rangDe(N, ref) {
    const g = N.groupe[ref]; const suite = N.mobiles(g); const i = suite.indexOf(ref);
    const nums = suite.map(r => N.num[r]);
    return { g, suite, i, fixe: N.immobile[ref] || null, min: Math.min(...nums), max: Math.max(...nums), ou: partiesDe(N.groupes[g] || [0]) };
  }
  function phraseDernier(N) {
    const d = ui.dernier; if (!d) return '';
    const autre = d.ref !== ui.tiroir?.ref ? ` <span class="code">${d.ref}</span>` : '';
    let quoi;
    if (d.quoi === 'page') quoi = d.on ? `<b>Nouvelle page.</b> Le passage${autre} commence désormais en haut d’une page.` : `<b>Nouvelle page retirée.</b> Le passage${autre} suit de nouveau le précédent.`;
    else {
      const n = N.num[d.ref]; const a = d.avant;
      const lie = Math.abs(n - a) === 2 ? 'et' : 'à';
      const decale = n < a ? `les n° ${n} ${lie} ${a - 1} deviennent ${n + 1} ${lie} ${a}` : `les n° ${a + 1} ${lie} ${n} deviennent ${a} ${lie} ${n - 1}`;
      quoi = `<b>Passé du n° ${a} au n° ${n}.</b>${autre} ${Math.abs(n - a) > 1 ? cap(decale) : `L’ancien n° ${n} devient le n° ${a}`} ; les renvois suivent, aucune destination ne change.`;
    }
    return `<p class="pl-fait" role="status">${ic('i-coche')}<span>${quoi}</span><button class="btn btn--petit" data-act="livre-annuler-apercu">Annuler</button></p>`;
  }
  function fichePassage(x, S, N, ouverte) {
    const t = ui.tiroir; const n = N.num[x.ref];
    const page = interrupteur('livre-nouvelle-page', x.nouvellePage, 'Commencer sur une nouvelle page');
    let rang = '';
    if (choix()) {
      const r = rangDe(N, x.ref);
      if (r.fixe) {
        const enigme = Object.values(S).find(y => y.cachees.some(c => c.dest === x.ref));
        const pourquoi = { depart: 'c’est le départ du livre.', ouverture: `il ouvre ${r.ou}.`, fixe: `son numéro est fixé${enigme ? ` par l’énigme de <span class="code">${enigme.ref}</span>` : ''}.` }[r.fixe];
        rang = `<p class="pl-fixe">${ic('i-epingle')}<span><b>Ce passage garde son rang :</b> ${pourquoi} Les autres passages se déplacent autour de lui.</span></p>`;
      } else {
        rang = `<div class="pl-rang" role="group" aria-label="Rang du passage dans l’ordre imprimé">
            <button class="btn btn--petit" data-act="livre-rang" data-v="monter" ${r.i <= 0 ? 'disabled' : ''}>${ic('i-chevron-haut')}Monter d’un rang</button>
            <button class="btn btn--petit" data-act="livre-rang" data-v="descendre" ${r.i >= r.suite.length - 1 ? 'disabled' : ''}>${ic('i-chevron-bas')}Descendre d’un rang</button>
            <span class="pl-apres"><label for="pl-apres">Placer après le n°</label><input id="pl-apres" class="pl-apres__n" type="text" inputmode="numeric" maxlength="3" autocomplete="off" value="${esc(t.apres || '')}" data-saisie="pl-apres" ${t.erreur ? 'aria-invalid="true" aria-describedby="pl-erreur"' : ''}><button class="btn btn--petit" data-act="livre-placer">Placer</button></span>
          </div>
          ${t.erreur ? `<p class="pl-erreur" id="pl-erreur" role="alert">${ic('i-alerte')}<span>${t.erreur}</span></p>` : `<p class="pl-limite">Il reste dans ${r.ou} : du n° ${r.min} au n° ${r.max}. Ses choix mènent aux mêmes scènes ; seuls les numéros changent.</p>`}`;
      }
    } else {
      rang = `<p class="pl-fixe"><span>Dans un récit classique, l’ordre des scènes fait partie du récit : il se change dans <a class="lien" href="#/plan">le plan</a>.</span></p>`;
    }
    return `<details class="carnet-fiche carnet-fiche--decision carnet-fiche--pli passage-livre" ${ouverte ? 'open' : ''}>
      <summary><header>${ic('i-pages')}<h2 id="pl-titre">${choix() ? 'Ce passage dans le livre' : 'Cette scène dans le livre'}</h2><span class="fiche-tete__fin">${choix() && n ? `n° ${n} · ` : ''}<span id="tiroir-pages"></span></span></header></summary>
      <div class="carnet-fiche__corps passage-livre__corps">
        ${choix() ? `<p class="pl-numero"><span class="pl-numero__n">${n || '–'}</span><span class="pl-numero__l">numéro imprimé</span></p>` : ''}
        <div class="passage-livre__cmd">${rang}${page}${phraseDernier(N)}</div>
      </div></details>`;
  }
  function piedTiroir() {
    const t = ui.tiroir; const nb = t.pile.length;
    if (t.confirme) return `<footer class="copie__pied tiroir__pied tiroir__pied--confirme"><p role="alert"><b>Rétablir la scène telle qu’elle était à ${HEURES.ouverture} ?</b> ${nb > 1 ? `Vos ${nb} modifications` : 'Votre modification'} depuis l’ouverture ${nb > 1 ? 'seront retirées' : 'sera retirée'} de la scène.</p>
      <div class="tiroir__actions"><button class="btn btn--petit" data-act="livre-tout-annuler-oui">Tout annuler</button><button class="btn btn--petit btn--discret" data-act="livre-tout-annuler-non">Garder mes modifications</button></div></footer>`;
    return `<footer class="copie__pied tiroir__pied">
      <div class="tiroir__sauv"><p class="sauv" role="status" id="tiroir-sauv">${ic('i-coche')}<span>Enregistré à ${t.sauv || HEURES.ouverture}</span></p>
        <p class="tiroir__direct">Écrit dans la scène dès la saisie, sans brouillon.</p></div>
      <div class="tiroir__actions"><button class="btn btn--petit" data-act="livre-annuler-pas" ${nb ? '' : 'disabled'}>Annuler</button><button class="btn btn--petit btn--discret" data-act="livre-tout-annuler" ${nb ? '' : 'disabled'}>Tout annuler</button></div></footer>`;
  }
  function tiroir(S, N, P) {
    const t = ui.tiroir; const x = S[t.ref]; const c = x.chap; const carte = carteProbleme(S, N, P);
    const reprise = x.etat === 'reprendre' && x.pec && x.pec !== 'prof' && !perso();
    const hors = perso() ? 'Consigne :' : 'Consigne, remises et relecture :';
    const de = ui.trajet[ui.trajet.length - 1]; const venu = de && S[de.ref]?.inclus ? `<p class="tiroir__trajet"><button class="btn btn--petit" data-act="livre-revenir">${ic('i-fleche-g')}Revenir ${choix() ? `au n° ${N.num[de.ref]}` : `à ${de.ref}`}</button><span>Vous arrivez ${de.lib ? `par « ${esc(de.lib)} »` : 'par un renvoi'}${ui.trajet.length > 1 ? ` · ${ui.trajet.length} passages suivis` : ''}</span></p>` : '';
    return `<aside class="tiroir" aria-labelledby="tiroir-titre">
      ${venu}
      <header class="tiroir__tete">
        <div class="tiroir__titre">
          <h2 id="tiroir-titre" tabindex="-1"><span class="fiche__ref">${x.ref}</span> ${esc(x.titre)}</h2>
        </div>
        ${A.menuEtat({ ...x.sc, etat: x.etat, vide: x.vide }, x.etat, 'tiroir')}
        <details class="menu-scene"><summary class="btn btn--petit menu-plus" title="Autres commandes de la scène">${ic('i-points')}<span class="vh">Autres commandes de la scène</span></summary><div class="menu-scene__liste">${x.inclus
          ? `<button data-act="livre-exclure" data-ref="${x.ref}">Exclure du livre</button>`
          : `<button data-act="livre-inclure" data-ref="${x.ref}">Réintégrer dans le livre</button>`}</div></details>
        <button class="btn btn--petit tiroir__fermer" data-act="livre-fermer-tiroir" title="Fermer la scène et revenir à l’étape (Échap)">${ic('i-fermer')}Fermer</button>
      </header>
      ${ui.rappelPrete === x.ref ? `<p class="tiroir__alerte tiroir__rappel" role="alert">${ic('i-alerte')}<span><b>${controler(S, N).filter(p => p.ref === x.ref && p.differe && ['issue', 'dest'].includes(p.k)).map(p => detailProbleme(p, S, N).quoi).join(' ')}</b> La déclarer prête quand même ?</span><span class="tiroir__rappel-cmd"><button class="btn btn--petit" data-act="livre-prete" data-ref="${x.ref}" data-v="oui">Déclarer prête</button><button class="btn btn--petit btn--discret" data-act="livre-prete-non">Pas maintenant</button></span></p>` : ''}
      ${ui.repriseTiroir === x.ref ? `<div class="tiroir__alerte tiroir__reprise decision"><label for="remarque" class="decision__label">Remarque${x.pec && x.pec !== 'prof' ? ` pour ${D.eleves[x.pec].prenom}` : ''} <span>facultative · lisible par les élèves du chapitre</span></label><textarea id="remarque" rows="3"></textarea><span class="tiroir__rappel-cmd"><button class="btn btn--petit btn--primaire" data-act="reprise-envoyer" data-ref="${x.ref}">${ic('i-retour')}Demander la reprise</button><button class="btn btn--petit btn--discret" data-act="reprise-annuler">Annuler</button></span></div>` : ''}
      <p class="tiroir__meta"><span class="pastille" style="background:${D.couleurs[c.couleur].edge}" aria-hidden="true"></span><span>${esc(c.titre)}</span>${x.inclus ? '' : marque('info', 'hors du livre')}<span class="tiroir__hors">${hors} <a class="lien" href="#/scene/${x.ref}" data-act="livre-vers-scene">page de la scène</a></span></p>
      ${A.apart ? A.apart.tiroir(x.ref) : ''}
      ${reprise ? `<p class="tiroir__alerte">${gommette(x.pec, 'gommette--s')}<span><b>${D.eleves[x.pec].prenom} reprend cette scène.</b> Ce que vous écrivez ici entre dans le texte de la scène, comme depuis sa page, et ${D.eleves[x.pec].prenom} le verra en l’ouvrant. En cas d’écriture en même temps, les deux versions sont gardées.</span></p>` : ''}
      ${carte}${tempsEnCours() === 'page' ? fichePassage(x, S, N, ui.ficheOuverte ?? !carte) : ''}
      <section class="copie tiroir__copie" aria-label="Texte de la scène ${x.ref}">
        <div class="copie__barre">${A.editeur.outils(x.sc, c, null)}</div>
        <div class="tiroir__defile">${A.editeur.corps(x.sc, c, { texte: null, peutEcrire: true, profil: null, fige: false })}</div>
        ${piedTiroir()}
      </section>
    </aside>`;
  }
  // Retour en arrière de l'éditeur (F11.2) : une étape par suite de frappes ou par changement de structure
  function noter() {
    const t = ui.tiroir; if (!t) return false; const e = X().etat(t.ref); const sig = JSON.stringify(e);
    if (sig === t.sig) return false;
    if (!t.rafale) t.pile.push(t.clone);
    t.clone = structuredClone(e); t.sig = sig; t.sauv = HEURES.saisie; return true;
  }
  function ouvrirTiroir(ref) {
    const S = modele(); const x = S[ref]; if (!x) return;
    if (!ui.semes.has(ref)) { X().semer(ref, texteDe(x.sc)); ui.semes.add(ref); }
    const e = X().etat(ref);
    ui.tiroir = { ref, ouverture: structuredClone(e), clone: structuredClone(e), sig: JSON.stringify(e), pile: [], rafale: false, sauv: null, confirme: false, erreur: null, apres: '' };
    ui.viser = ref; if (!new URLSearchParams(location.hash.split('?')[1] || '').get('vue-etroite')) ui.vueEtroite = 'scene';
  }
  // État de l'aperçu : calculé côté serveur dans l'application (ADR 0003), il suit la saisie avec un délai, simulé ici
  let tApercu = 0;
  function etatApercu() {
    const conseil = { relire: 'Cliquez sur un passage pour ouvrir sa scène, sur un renvoi pour le suivre.', chemins: 'Cliquez sur un renvoi pour suivre le choix, sur un passage pour ouvrir sa scène.', page: choix() ? 'Cliquez sur un passage pour régler sa place dans le livre.' : 'Cliquez sur une scène pour l’ouvrir à côté de l’aperçu.' }[tempsEnCours()];
    if (!ui.tiroir) return `<p class="apercu__etat">${ic('i-main')}<span>${conseil}</span></p>`;
    return ui.apercu === 'attente'
      ? `<p class="apercu__etat apercu__etat--attente" role="status"><span class="tourne" aria-hidden="true"></span><span><b>Aperçu en cours de mise à jour.</b> Les pages datent de ${insec(ui.calcule)}.</span></p>`
      : `<p class="apercu__etat apercu__etat--ok" role="status">${ic('i-coche')}<span><b>Aperçu à jour</b>, calculé à ${insec(ui.calcule)}.</span></p>`;
  }
  function majEtatApercu() {
    const a = $('.livre-apercu--tiroir .apercu'); if (!a) return;
    a.classList.toggle('apercu--attente', ui.apercu === 'attente');
    const e = $('.apercu__etat', a); if (e) e.outerHTML = etatApercu();
    const pc = $('.parcours', a); if (pc) { const S = modele(); const N = numeroter(S); pc.outerHTML = parcoursHTML(controler(S, N), N); }
  }
  function demanderApercu(delai) {
    ui.apercu = 'attente'; majEtatApercu(); clearTimeout(tApercu);
    if (!ui.fige) tApercu = setTimeout(recalculer, delai);
  }
  function recalculer() {
    const src = $('#livre-source'); if (!src || !ui.tiroir) { ui.apercu = 'ok'; return; }
    if (ui.tiroir.rafale) { ui.tiroir.rafale = false; }
    const S = modele(); const N = numeroter(S); const P = controler(S, N);
    src.innerHTML = blocsLivre(S, N, P); ui.apercu = 'ok'; ui.calcule = HEURES.saisie; ui.anciennes = null;
    if (ui.pdf) ui.change = true;
    if (ui.suivre) { ui.suivre = false; ui.viser = ui.tiroir.ref; }
    majEtatApercu(); paginer();
  }
  function majPagesTiroir() {
    const el = $('#tiroir-pages'); if (!el || !ui.tiroir) return;
    const pages = [...new Set($$(`.apercu__pages .passage[data-ref="${ui.tiroir.ref}"], .apercu__pages .pl-image[data-ref="${ui.tiroir.ref}"]`).map(p => +p.closest('.pl').dataset.page))];
    el.textContent = !pages.length ? 'hors du livre' : pages.length > 2 ? `pages ${pages[0]} à ${pages[pages.length - 1]}` : pages.length > 1 ? `pages ${pages[0]} et ${pages[1]}` : `page ${pages[0]}`;
  }

  const pagesLivre = (S, N, P) => `<div class="apercu__pages" data-police="${ui.police}" data-alignement="${ui.alignement}" style="--pl-taille:${TAILLES[ui.taille][1]};--m-h:${mm(ui.marges.h)}cqw;--m-b:${mm(ui.marges.b)}cqw;--m-e:${mm(ui.marges.e)}cqw;--m-i:${mm(ui.marges.i)}cqw"></div><div id="livre-source" hidden>${blocsLivre(S, N, P)}</div>`;
  /* ——— Page : aperçu et contrôles ————————————————————————————— */
  function pageApercu(S, N, P) {
    if (ui.tiroir && !S[ui.tiroir.ref]) ui.tiroir = null;
    const t = ui.tiroir;
    // Un changement de structure fait dans l'éditeur (choix, action de jeu…) demande aussi un nouvel aperçu
    if (t && noter() && ui.anciennes) ui.apercu = 'attente';
    // Écran étroit : la scène et le livre ne tiennent pas côte à côte ; deux onglets passent de l'une à l'autre
    // La fiche de l'étape est composée d'abord : la tâche en cours décide de ce que montre l'aperçu
    const enPage = tempsEnCours() === 'page';
    if (enPage) ui.tacheCourante = null;
    const fiche = t || enPage ? '' : ficheEtape(S, N, P);
    // « Relire » et « Vérifier les chemins » : la fiche de l'étape en colonne, à côté de l'aperçu. « Mettre en page » :
    // la fiche en pleine largeur, l'aperçu dessous (décision du porteur, 4 octobre 2026, après essai des deux dispositions)
    const colonne = !enPage;
    // Aperçu limité au récit aux deux premières étapes ; livre entier, pages de présentation comprises, à « Mettre en page » (F11-AC80)
    const entier = enPage;
    // Volet « Réglages » : l'aperçu reste composé hors écran, pour la petite double page et le nombre de pages
    const cache = enPage && !t && ui.volet !== 'apercu';
    const onglets = t ? `<div class="tiroir-onglets bascule" role="tablist" aria-label="Scène ou livre"><button role="tab" data-act="livre-vue" data-v="scene" aria-selected="${ui.vueEtroite !== 'livre'}">${ic('i-crayon')}Scène ${t.ref}</button><button role="tab" data-act="livre-vue" data-v="livre" aria-selected="${ui.vueEtroite === 'livre'}">${ic('i-livre')}Dans le livre</button></div>` : '';
    return `<div class="livre-apercu ${t ? `livre-apercu--tiroir livre-apercu--vue-${ui.vueEtroite === 'livre' ? 'livre' : 'scene'}` : colonne ? 'livre-apercu--colonne' : `livre-apercu--large livre-apercu--volets livre-apercu--volet-${ui.volet === 'apercu' ? 'apercu' : 'reglages'}`}">
      ${onglets}${t ? tiroir(S, N, P) : colonne ? `<aside class="livre-rail livre-etape" aria-label="Tâches de l’étape">${fiche}</aside>` : `${voletsPage()}${cache ? reglagesPage(S, N) : ''}`}
      <section class="apercu apercu--${ui.zoom} ${entier ? '' : 'apercu--recit'} ${cache ? 'apercu--cache' : ''} ${t && ui.apercu === 'attente' ? 'apercu--attente' : ''}" aria-label="Aperçu du livre composé" ${enPage && !t ? 'role="tabpanel" aria-labelledby="volet-apercu"' : ''} ${cache ? 'aria-hidden="true"' : ''}>
        <div class="apercu__barre">
          <div class="apercu__ligne">${etatApercu()}
            <div class="bascule bascule--petite" role="group" aria-label="Affichage des pages"><button data-act="livre-zoom" data-v="double" aria-pressed="${ui.zoom === 'double'}">Double page</button><button data-act="livre-zoom" data-v="simple" aria-pressed="${ui.zoom === 'simple'}">Page agrandie</button></div></div>
          <div class="apercu__ligne apercu__ligne--parcours">${parcoursHTML(P, N)}<p class="apercu__meta">${choix() ? `${N.liste.length} passages` : `${N.liste.length} scènes`} · <span id="livre-nbpages">${ui.nbPages ? `${ui.nbPages} pages` : 'pages en calcul'}</span> · état du ${dateCourte()}</p></div>
          <div id="peu-zone">${suggestions()}</div>${enPage && !t ? `<div id="peu-fait">${phraseDernier(N)}</div>` : ''}
        </div>
        ${pagesLivre(S, N, P)}
      </section>
    </div>`;
  }

  /* ——— Ordre des passages, réglages et pages de présentation ———————————— */
  const interrupteur = (act, on, lib, v = '') => `<label class="inter"><input type="checkbox" role="switch" data-act="${act}" ${v ? `data-v="${v}"` : ''} ${on ? 'checked' : ''}><span class="inter__piste" aria-hidden="true"></span><span>${lib}</span></label>`;
  function vignette(type) {
    const pg = ui.pages;
    if (pg[type].forme === 'image') return `<div class="vg vg--image" aria-hidden="true">${ic('i-image')}<span>image</span></div>`;
    const contenu = {
      titre: `<span class="vg__t">${esc(pg.titre.titre)}</span><span class="vg__s">${esc(pg.titre.sous)}</span><span class="vg__a">${esc(pg.titre.auteur)}</span>`,
      mode: `<span class="vg__h">Comment lire ce livre</span><span class="vg__l"></span><span class="vg__l"></span><span class="vg__l vg__l--c"></span>${A.jeu.regles().length ? '<span class="vg__h vg__h--2">Règles du jeu</span><span class="vg__l"></span><span class="vg__l"></span><span class="vg__l vg__l--c"></span>' : ''}`,
      auteurs: `<span class="vg__h">Ce livre a été écrit par</span><span class="vg__noms">${pg.auteurs.noms.slice(0, 12).map(esc).join(' · ')}…</span>`,
      fin: '<span class="vg__l"></span><span class="vg__l vg__l--c"></span>'
    }[type];
    return `<div class="vg" aria-hidden="true">${contenu}</div>`;
  }
  // Chaque page de présentation est composée d'après son modèle ou remplacée par une image pleine page (F11.4)
  const NOTES_IMAGE = {
    titre: 'Une page de titre en image s’affiche telle quelle dans une version partagée.',
    mode: 'En ligne, le lecteur garde le mode d’emploi de l’écran et le texte de vos règles du jeu, à saisir ci-dessous.',
    feuille: 'Le livre imprime votre image. Le lecteur en ligne ne peut pas la remplir : il présente les sections ci-dessous. Leur accord avec l’image n’est pas vérifié.',
    auteurs: 'Une page des auteurs en image n’est pas limitée aux prénoms : son contenu relève de vous. Elle s’affiche telle quelle dans une version partagée.',
    fin: 'Une page de fin en image s’affiche telle quelle dans une version partagée.'
  };
  function formePage(k) {
    const p = ui.pages[k]; const d = dimUtile(); const image = p.forme === 'image';
    return `<fieldset class="choix-seg pp-forme"><legend>Forme de la page</legend>${[['modele', 'Modèle'], ['image', 'Image pleine page']].map(([v, lib]) => `<label><input type="radio" name="forme-${k}" value="${v}" data-act="livre-forme" data-v="${k}" ${(image ? 'image' : 'modele') === v ? 'checked' : ''}><span>${lib}</span></label>`).join('')}</fieldset>
      ${image ? `<div class="pp-image"><p class="pp-image__fichier">${ic('i-image')}<span><b>${esc(p.image)}</b> · importée par vous</span><button class="btn btn--petit" data-act="toast" data-msg="Import d’une image (simulation) : elle remplace la page composée.">Remplacer…</button></p>
        <p class="pp-image__dim"><b>Dimension utile : ${d.mm}</b>, soit ${d.pt} à 300 points par pouce. L’image s’imprime à l’intérieur des marges : une page dessinée bord à bord est réduite.</p>
        <p class="champ__aide">${NOTES_IMAGE[k]}${k === 'feuille' || k === 'mode' ? '' : ' Les textes du modèle sont conservés : ils reviennent si vous choisissez « Modèle ».'}</p></div>` : ''}`;
  }
  function pagesPresentation() {
    const pg = ui.pages; const img = k => pg[k].forme === 'image';
    const fa = A.jeu.livre.carteFeuille(img('feuille'));
    const carte = (id, titre, statut, on, edit, bascule, vg) => `<article class="pp ${on ? '' : 'pp--off'} ${ui.pageOuverte === id ? 'pp--large' : ''}">
      ${vg || vignette(id)}
      <div class="pp__corps"><h3>${titre}</h3><p class="pp__statut">${statut}${on && img(id) ? ' · en image' : ''}</p>
        ${bascule || ''}
        <button class="lien" data-act="livre-page" data-v="${id}" aria-expanded="${ui.pageOuverte === id}">${ui.pageOuverte === id ? 'Fermer' : 'Modifier'}</button></div>
      ${ui.pageOuverte === id ? `<div class="pp__edition">${formePage(id)}${edit}</div>` : ''}</article>`;
    const champ = (k, lib) => `<label class="champ"><span>${lib}</span><input type="text" value="${esc(pg.titre[k])}" data-saisie="livre-titre" data-k="${k}"></label>`;
    const place = `<fieldset class="choix-seg"><legend>Place dans le livre</legend>${[['debut', 'Au début, après la page de titre'], ['fin', 'À la fin, avant la page de fin']].map(([v, lib]) => `<label><input type="radio" name="auteurs-place" value="${v}" data-act="livre-auteurs-place" ${(pg.auteurs.place === 'fin' ? 'fin' : 'debut') === v ? 'checked' : ''}><span>${lib}</span></label>`).join('')}</fieldset>`;
    const noms = `<label class="champ"><span>Un prénom par ligne</span><textarea rows="8" data-saisie="livre-auteurs">${esc(pg.auteurs.noms.join('\n'))}</textarea></label><p class="champ__aide">Prénoms seuls par défaut. La page est affichée par défaut dans une version partagée ; vous pourrez l’en retirer au moment du partage.</p>`;
    return `<div class="pps">
      ${carte('titre', 'Page de titre', 'Toujours présente', true, img('titre') ? '' : `${champ('titre', 'Titre')}${champ('sous', 'Sous-titre (facultatif)')}${champ('auteur', perso() ? 'Auteur' : 'Classe ou auteur')}${champ('annee', 'Année')}`)}
      ${carte('auteurs', 'Les auteurs', pg.auteurs.on ? `${img('auteurs') ? 'Votre page' : `${pg.auteurs.noms.length} prénoms, sans autre information`} · ${pg.auteurs.place === 'fin' ? 'à la fin' : 'au début'}` : perso() ? 'Facultative, absente par défaut' : 'Facultative · retirée', pg.auteurs.on, `${place}${img('auteurs') ? '' : noms}`, interrupteur('livre-page-on', pg.auteurs.on, 'Dans le livre', 'auteurs'))}
      ${choix() ? carte('mode', 'Comment lire ce livre', pg.mode.on ? `Proposée par défaut · modifiable${A.jeu.regles().length ? ' · avec vos règles du jeu' : ''}` : 'Retirée', pg.mode.on, `${img('mode') ? '' : `<label class="champ"><span>Texte de la page</span><textarea rows="6" data-saisie="livre-mode">${esc(pg.mode.texte)}</textarea></label>`}<p class="champ__aide">Les règles du jeu s’écrivent dans <a href="#/preparation">la préparation</a>.</p>`, interrupteur('livre-page-on', pg.mode.on, 'Dans le livre', 'mode')) : ''}
      ${choix() ? carte('feuille', 'Feuille d’aventure', fa.statut, fa.on, '<p class="champ__aide">Les sections de la feuille et le dé se règlent dans <a href="#/preparation">la préparation</a>.</p>', interrupteur('fa-on', fa.on, 'Dans le livre et en ligne'), img('feuille') ? '<div class="vg vg--image vg--feuille-image" aria-hidden="true"><img src="assets/img/feuille-exemple.svg" alt=""></div>' : fa.vignette) : ''}
      ${carte('fin', 'Page de fin', pg.fin.on ? 'Ajoutée' : 'Facultative', pg.fin.on, img('fin') ? '' : `<label class="champ"><span>Texte de la page</span><textarea rows="4" data-saisie="livre-finale">${esc(pg.fin.texte)}</textarea></label>`, interrupteur('livre-page-on', pg.fin.on, 'Dans le livre', 'fin'))}
    </div>`;
  }
  /* Réglages répartis (F11.6, 3 octobre 2026) : il n'existe plus de page « Réglages du livre ». Les phrases de choix
     et la marque de fin sont dans la préparation ; texte, pages, titres et ordre des passages sont des tâches de
     « Mettre en page ». Chaque bloc garde son exemple ; l'explication est derrière une icône d'information. */
  const reg = (titre, aide, contenu) => `<section class="reg"><h4>${titre}${aide ? ` ${info(aide)}` : ''}</h4>${contenu}</section>`;
  function reglagesHTML(S, N) {
    const exemple = S.S033 && S.S034 ? [S.S033.choix[0]?.lib || 'Plonger la main', N.num.S034 || 17] : ['Plonger la main', 17];
    const titres = reg(choix() ? 'Titres de partie' : 'Titres', choix()
      ? 'Imprimés au-dessus de la scène d’ouverture de chaque partie. Les titres de chapitre ne sont pas imprimés dans un livre à choix : ses scènes y sont dispersées.'
      : 'Dans un récit classique, les titres se placent à leur place naturelle dans l’ordre du plan ; un séparateur discret distingue les scènes.',
      `<div class="inters">${interrupteur('livre-titres', ui.titres, 'Imprimer les titres de partie')}${!choix() ? interrupteur('livre-titres-chap', ui.titresChap, 'Imprimer les titres de chapitre') : ''}</div>
        ${choix() ? `<details class="reg__plus"><summary>Scènes d’ouverture</summary><ul class="ouvertures">${H.parties.map((p, i) => { const r = ouverture(i); return `<li><span class="ouvertures__p">Partie ${i + 1}</span><span>${titreDe(S, r)}${N.num[r] ? ` · n° ${N.num[r]}` : ''}</span><button class="lien" data-act="toast" data-msg="Par défaut, la première scène du premier chapitre de la partie. La commande pour en choisir une autre reste à concevoir.">Changer</button></li>`; }).join('')}</ul></details>` : ''}`);
    const renvois = choix() ? `<fieldset class="formules"><legend>Formule de renvoi ${info('Le numéro de destination est calculé à chaque composition, jamais saisi. Une seule formule vaut pour tout le livre.', 'D’où vient le numéro du renvoi ?')}</legend>${Object.entries(FORMULES).map(([k, [lib, f]]) => `<label class="formule ${ui.formule === k ? 'est-choisie' : ''}"><input type="radio" name="formule" value="${k}" data-act="livre-formule" ${ui.formule === k ? 'checked' : ''}><span class="formule__nom">${lib}${k === 'rends' ? ' <em>par défaut</em>' : ''}</span><span class="formule__ex">${esc(f)}${exemple[1]}</span></label>`).join('')}</fieldset>
      <fieldset class="formules formules--constructions"><legend>Constructions proposées à la création d’un choix ${info('Avec plusieurs constructions cochées, l’une est tirée au hasard à la création de chaque choix, puis conservée ; la phrase reste modifiable. Les trois dernières supposent un libellé commençant par un verbe. Une phrase personnalisée place elle-même ses numéros.', 'Que se passe-t-il avec plusieurs constructions ?')}</legend>${Object.entries(CONSTRUCTIONS).map(([k, [lib]]) => `<label class="formule ${ui.constructions.has(k) ? 'est-choisie' : ''}"><input type="checkbox" value="${k}" data-act="livre-construction" ${ui.constructions.has(k) ? 'checked' : ''} ${k === 'neutre' ? 'disabled' : ''}><span class="formule__nom">${lib}${k === 'neutre' ? ' <em>toujours disponible</em>' : ''}</span><span class="formule__ex">${esc(texteAuto('', exemple[0], exemple[1], k))}</span></label>`).join('')}</fieldset>
      <div class="reglage__ligne"><label class="champ champ--court"><span>Marque de fin ${info('Une fin peut garder des choix, comme « Retenter ta chance » : la marque s’imprime avant eux.', 'Une fin peut-elle garder des choix ?')}</span><input type="text" value="${esc(ui.fin)}" data-saisie="livre-fin" maxlength="40"></label><div class="extrait extrait--fin" aria-hidden="true"><p class="extrait__txt">…la carte froissée dans la main. Le dernier bac était parti.</p><p class="passage__fin">${esc(ui.fin || 'Fin')}</p><p class="extrait__choix">${esc(texteAuto('S054:0', 'Retenter ta chance', 1))}</p></div></div>` : '';
    const sauts = reg('Nouvelles pages', choix() ? 'Une partie mélangée avec la précédente garde son titre dans le fil du texte : une nouvelle page couperait le groupe. Pour une seule scène, « Commencer sur une nouvelle page » se règle depuis son passage.' : 'Sans nouvelle page, le titre de chapitre reste dans le fil du texte. Pour une seule scène, le réglage se fait depuis sa scène, dans l’aperçu.',
      `<div class="inters">${interrupteur('livre-partie-page', ui.partiePage, 'Chaque partie commence sur une nouvelle page')}${!choix() ? interrupteur('livre-chapitre-page', ui.chapitrePage, 'Chaque chapitre commence sur une nouvelle page') : ''}</div>`);
    const texte = reg('Texte du livre', 'Ces réglages valent pour tout le livre : les élèves n’ont pas à reprendre la présentation de leur texte. Numéros, titres, phrases de choix et actions de jeu restent alignés à gauche, sans mot coupé. L’alignement à gauche convient à des lecteurs fragiles.',
      `<div class="reglage__ligne reglage__ligne--haut"><fieldset class="choix-seg"><legend>Police</legend>${Object.entries(POLICES).map(([k, [lib]]) => `<label><input type="radio" name="police" value="${k}" data-act="livre-police" ${ui.police === k ? 'checked' : ''}><span class="police--${k}">${lib}</span></label>`).join('')}</fieldset>
      <fieldset class="choix-seg"><legend>Taille</legend>${Object.entries(TAILLES).map(([k, [lib]]) => `<label><input type="radio" name="taille" value="${k}" data-act="livre-taille" ${ui.taille === k ? 'checked' : ''}><span>${lib}</span></label>`).join('')}</fieldset></div>
      <fieldset class="formules formules--alignement"><legend>Alignement du récit</legend>${[['justifie', 'Justifié, avec césure <em>par défaut</em>'], ['gauche', 'Aligné à gauche, sans césure']].map(([k, lib]) => `<label class="formule ${ui.alignement === k ? 'est-choisie' : ''}"><input type="radio" name="alignement" value="${k}" data-act="livre-alignement" ${ui.alignement === k ? 'checked' : ''}><span class="formule__nom">${lib}</span><span class="formule__ex formule__ex--para formule__ex--${k}" lang="fr">Plus il avançait, plus la brume s’épaississait autour de lui. La lanterne clignotait toujours.</span></label>`).join('')}</fieldset>`);
    const b = bas(); const nbd = A.jeu.J.feuille.des; const m = ui.marges; const e = ui.margeErreur;
    const optBas = (k, lib, ex, off, aide) => `<label class="formule ${b === k ? 'est-choisie' : ''} ${off ? 'formule--off' : ''}"><input type="radio" name="bas" value="${k}" data-act="livre-bas" ${b === k ? 'checked' : ''} ${off ? 'disabled' : ''}><span class="formule__nom">${lib}</span><span class="formule__ex bas-ex">${ex}</span>${aide ? `<span class="formule__aide">${aide}</span>` : ''}</label>`;
    const depart = Object.keys(MARGES0).every(k => m[k] === MARGES0[k]);
    const champM = k => `<label class="champ champ--nombre champ--marge"><span>${NOMS_MARGE[k][0]}</span><span class="champ__unite"><input type="number" min="10" step="1" value="${m[k]}" data-act="livre-marge" data-k="${k}" id="marge-${k}" inputmode="numeric" ${e?.k === k ? 'aria-invalid="true" aria-describedby="marge-erreur"' : ''}><span aria-hidden="true">mm</span></span></label>`;
    const pct = (v, total) => (Math.min(v, 60) / total * 100).toFixed(2);
    const pageS = cote => `<div class="ms-page ms-page--${cote}"><div class="ms-texte" style="top:${pct(m.h, 209.9)}%;bottom:${pct(m.b, 209.9)}%;${cote === 'g' ? `left:${pct(m.e, 148.17)}%;right:${pct(m.i, 148.17)}%` : `left:${pct(m.i, 148.17)}%;right:${pct(m.e, 148.17)}%`}"></div></div>`;
    const recit = `${reg('Marges', 'Marges proposées par l’application : changez-les pour votre imprimeur ou votre goût. La marge intérieure reste du côté de la reliure. Aucune marge sous 10 mm, pour qu’un texte ne soit pas rogné.',
      `<div class="reglage__ligne reglage__ligne--haut marges">
        <div class="marges__champs"><div class="marges__grille">${['h', 'b', 'e', 'i'].map(champM).join('')}</div>
          ${e ? `<p class="pl-erreur" id="marge-erreur" role="alert">${ic('i-alerte')}<span>${e.msg}</span></p>` : ''}
          <p class="marges__actions"><button class="btn btn--petit" data-act="livre-marges-depart" ${depart ? 'disabled' : ''}>${ic('i-recommencer')}Valeurs de départ</button></p></div>
        <figure class="ms"><div class="mini-livre" id="mini-livre" aria-hidden="true" data-police="${ui.police}" data-alignement="${ui.alignement}" style="--pl-taille:${TAILLES[ui.taille][1]};--m-h:${mm(ui.marges.h)}cqw;--m-b:${mm(ui.marges.b)}cqw;--m-e:${mm(ui.marges.e)}cqw;--m-i:${mm(ui.marges.i)}cqw"><div class="ms-pages">${pageS('g')}${pageS('d')}</div></div><figcaption>Une double page du livre, avec vos réglages · zone de texte : ${dimUtile().mm}</figcaption></figure>
      </div>`)}${reg('Bas de page du récit', `Les pages de présentation ne portent jamais de numéro. L’aperçu et le PDF de travail indiquent toujours « p. 12 » dans la marge, comme marque de relecture.${choix() ? ' Dans un livre à choix, l’en-tête donne déjà les numéros des passages : un numéro de page pourrait se confondre avec eux.' : ''}`,
      `<fieldset class="formules formules--bas"><legend class="vh">Bas de page du récit</legend>
        ${optBas('rien', `Rien${choix() ? ' <em>par défaut</em>' : ''}`, '<span class="bas-ex__vide">aucune mention</span>')}
        ${optBas('folio', `Numéro de page${choix() ? '' : ' <em>par défaut</em>'}`, '<span class="pl__folio">37</span>')}
        ${choix() ? optBas('des', 'Dés', `<span class="pl__des">${tirage(0, nbd || 1).map(faceDe).join('')}</span>`, !desPossibles(), desPossibles() ? `${nbd === 2 ? 'Deux dés' : 'Un dé'} sur chaque page de droite` : 'Avec un dé dans la feuille d’aventure') : ''}</fieldset>
      ${b === 'des' ? `<p class="reglage__note">${ic('i-de')}<span>Ouvrir le livre au hasard tient lieu de lancer. <button class="lien" data-act="livre-des-phrase">Ajouter la phrase proposée aux règles du jeu</button></span></p>` : ''}`)}`;
    return { titres, renvois, sauts, texte, recit };
  }
  // Préparation : rubrique « Phrases de choix », utile dès l'écriture (F11-AC70)
  function rubriquePhrases() {
    if (!choix()) return '';
    const S = modele(); const N = numeroter(S);
    return `<section class="carnet-fiche rubrique rubrique--phrases"><header><h2>Phrases de choix</h2><span class="fiche-tete__fin">pour tout le livre</span></header><div class="carnet-fiche__corps">
      <p class="rubrique__question">Comment écrit-on un choix, et comment finit une histoire ?</p>${reglagesHTML(S, N).renvois}</div></section>`;
  }

  /* ——— Page : exports ————————————————————————————————————————— */
  // Ce qui empêche le PDF définitif, étape par étape, avec les mots et les décomptes de chaque étape. Un avertissement
  // à confirmer ne bloque pas le PDF (F09.2) : il n'est pas compté ici.
  function raisonsPdf(P) {
    const ou = tempsLivre().filter(t => t !== 'page').map(t => { const r = resteNb(t, P); return [t, [r.finir ? `${r.finir} scène${plur(r.finir)} à finir` : '', r.corriger ? `${r.corriger} à corriger` : ''].filter(Boolean).join(', ')]; }).filter(x => x[1]);
    if (ui.doute) ou.push(['page', 'ordre des passages à confirmer']);
    else if (!ui.convient) ou.push(['page', '« La mise en page me convient » reste à déclarer']);
    return ou;
  }
  function pageExports(S, N, P) {
    const def = ui.pdf ? `<li class="fichier">${ic('i-pdf')}<div><p><b>Livre intérieur — définitif</b></p><p>État du ${ui.pdf} · A5 · <span class="pages-n">${ui.pdfPages || ui.nbPages || ''} pages</span></p>${ui.change ? `<p class="fichier__change">${ic('i-alerte')}Le livre a changé depuis ce PDF.</p>` : '<p class="fichier__ok">Correspond au livre actuel.</p>'}</div><button class="btn btn--petit" data-act="toast" data-msg="Téléchargement simulé.">${ic('i-telecharger')}Télécharger</button></li>` : '';
    const nbB = bloquants(P).filter(p => !p.differe).length;
    // L'étape ne se referme pas : si un problème réapparaît, le PDF est refusé et chaque raison mène à son temps
    const ou = raisonsPdf(P);
    const raisons = ou.length ? `<ul class="sortie__raisons">${ou.map(([t, quoi]) => `<li>${versTemps(t, ETAPES[t])} · ${quoi}</li>`).join('')}</ul>` : '';
    const possible = !nbB && !ou.length;
    // PDF à jour : le parcours est fini. L'écran le dit, puis montre la suite (couverture chez l'imprimeur, partage)
    const fini = ui.pdf && !ui.change;
    const partage = A.livre.partage?.(S, N, P);
    const suiteFin = fini ? `<section class="et-apres" aria-labelledby="apres-t"><h3 id="apres-t">Et maintenant ?</h3><ol>
        <li><span class="tache__n" aria-hidden="true">1</span><span>Préparez la couverture chez votre imprimeur.</span>${info('La couverture ne se compose pas ici : ses dimensions dépendent du nombre de pages, du papier et de la reliure. L’outil de l’imprimeur calcule le dos ; la fiche à droite liste ce qu’il vous faut.', 'Pourquoi la couverture ne se fait-elle pas ici ?')}</li>
        <li><span class="tache__n" aria-hidden="true">2</span><span>Envoyez-lui le PDF définitif et la couverture.</span></li>
        ${partage ? `<li class="est-fait"><span class="tache__n tache__n--faite" aria-hidden="true">${ic('i-coche')}</span><span>Livre partagé en ligne.</span><a class="lien" href="#/livre/partage">Voir le partage</a></li>` : `<li><span class="tache__n" aria-hidden="true">3</span><span>Partagez le livre en ligne, si vous le souhaitez.</span><a class="btn btn--petit" href="#/livre/partage">${ic('i-partage')}Partager</a></li>`}
      </ol></section>` : '';
    const etat = fini ? `<p class="arrivee arrivee--faite">${ic('i-coche')}<span><b>Le livre est fait.</b> PDF définitif du ${ui.pdf}.</span></p>` : ui.pdf ? etatPdf(P) : possible ? `<p class="arrivee">${ic('i-coche')}<span><b>Le livre est prêt.</b> Il ne reste qu’à fabriquer le fichier.</span></p>` : `<p class="livre-pdf">${ic('i-bloque')}<span><b>PDF définitif pas encore possible.</b></span></p>`;
    return `<div class="livre-exports">
      <section class="exports__col">
        <h2>PDF définitif ${info('Le livre sans marques, prêt pour l’imprimeur. Chaque fichier reste tel qu’il a été produit ; le projet reste modifiable.', 'Qu’est-ce que le PDF définitif ?')}</h2>
        ${etat}${raisons}
        ${ui.pdf && !ui.change
          ? `<p class="tache__cmd"><button class="btn btn--primaire btn--grand" data-act="toast" data-msg="Téléchargement simulé.">${ic('i-telecharger')}Télécharger le PDF définitif</button><button class="lien" data-act="livre-feuille" data-v="definitif" aria-haspopup="dialog">Nouveau PDF définitif</button></p>`
          : `<p><button class="btn ${possible ? 'btn--primaire btn--grand' : ''}" data-act="livre-feuille" data-v="definitif" aria-haspopup="dialog">${ic('i-pdf')}${ui.pdf ? 'Nouveau PDF définitif…' : 'Créer le PDF définitif…'}</button></p>`}
        ${suiteFin}
        ${def ? `<h2>PDF définitifs conservés</h2><ul class="fichiers">${def}</ul>` : ''}
      </section>
      <aside class="exports__col exports__col--aide">
        <section class="carnet-fiche"><header>${ic('i-image')}<h2>La couverture, chez l’imprimeur</h2><span class="fiche-tete__fin">${info('Elle ne se compose pas ici : ses dimensions dépendent du nombre de pages, du papier et de la reliure, et l’outil de l’imprimeur calcule le dos. Le fichier intérieur est un seul PDF, A5 portrait, sans fond perdu ; sa conformité à chaque imprimeur n’est pas garantie.', 'Pourquoi la couverture ne se fait-elle pas ici ?')}</span></header><div class="carnet-fiche__corps">
          <p>À préparer :</p>
          <ul class="liste-simple"><li>une <b>image de face</b> au format A5 ;</li><li>le <b>titre</b> et le nom de la classe ou de l’auteur ;</li><li>le <b>texte de quatrième</b>.</li></ul>
          <button class="btn btn--petit" data-act="toast" data-msg="Idée d’illustration de couverture (F10.2) : un prompt cadré au format du livre, dans le style du projet, à copier dans votre outil d’image.">${ic('i-etincelle')}Idée d’illustration de couverture</button>
        </div></section>
      </aside>
    </div>`;
  }

  /* ——— Feuille latérale : demandes de PDF ———————————————————— */
  function contenuFeuille() {
    // Une scène pas encore écrite n'est comptée qu'une fois, parmi les scènes à finir
    const S = modele(); const N = numeroter(S); const P = controler(S, N); const B = bloquants(P).filter(p => !p.differe);
    const tete = (titre, sous) => `<div class="fl__tete"><button class="btn btn--discret fl__fermer" data-act="livre-fermer" aria-label="Fermer">${ic('i-fermer')}</button><h2 id="fl-titre">${titre}</h2>${sous ? `<p>${sous}</p>` : ''}</div>`;
    const calcul = lib => `<div class="fl__calcul" role="status"><span class="fl__roue" aria-hidden="true"></span><p><b>${lib}</b></p><p>État du livre au ${M().date}. Une modification faite pendant le calcul n’y figurera pas.</p></div>`;
    const nbPages = ui.nbPages || 28;
    if (ui.feuille === 'travail') {
      const fait = ui.etape === 'fait';
      return `${tete('PDF de travail', 'Pour relire le livre sur papier pendant sa préparation.')}
      <div class="fl__corps">
        ${ui.etape === 'calcul' ? calcul('Composition du PDF de travail…') : fait ? `<div class="fl__fait">${ic('i-coche')}<div><p><b>PDF de travail prêt</b></p><p>État du ${M().date}.</p></div></div>
          <ul class="fichiers"><li class="fichier fichier--travail">${ic('i-pdf')}<div><p><b>passeurs-de-brume_travail.pdf</b></p><p>${B.length ? '1 page de problèmes + ' : ''}${nbPages} pages A5</p></div><button class="btn btn--petit" data-act="toast" data-msg="Téléchargement simulé.">${ic('i-telecharger')}Télécharger</button></li></ul>` : ''}
        <div class="fl__apercu" aria-hidden="true">
          <div class="mini mini--recap"><p class="mini__h">Version de travail — problèmes détectés</p>${B.length ? B.slice(0, 5).map(p => `<p class="mini__l">${p.ref} · ${GENRES[p.k][1].toLowerCase()}</p>`).join('') + (B.length > 5 ? `<p class="mini__l">… et ${B.length - 5} autres</p>` : '') : '<p class="mini__l">Aucun problème bloquant.</p>'}</div>
          <div class="mini"><p class="mini__h">Version de travail</p><p class="mini__n">7 <span>S014</span></p><p class="mini__l mini__l--t"></p><p class="mini__l mini__l--t"></p><p class="mini__l mini__l--c"></p></div>
        </div>
        <ul class="liste-simple fl__liste">
          <li>La mention « Version de travail » sur chaque page.</li>
          <li>La référence stable de chaque scène (S014…) à côté de son numéro : vos annotations restent retrouvables si les numéros changent.</li>
          <li>${B.length ? `Les ${B.length} problèmes des contrôles, à leur place dans le texte et récapitulés sur une première page hors pagination.` : 'Une première page indiquant qu’aucun problème bloquant n’a été détecté.'}</li>
          <li>La même mise en page que l’aperçu et que le futur PDF définitif.</li>
        </ul>
        <p class="fl__note">Ce fichier ne peut pas tenir lieu de livre définitif. Il remplace le précédent PDF de travail.</p>
      </div>
      <div class="fl__pied">${fait ? '<button class="btn btn--grand" data-act="livre-fermer">Fermer</button>' : `<button class="btn btn--primaire btn--grand" data-act="livre-creer" data-v="travail" ${ui.etape === 'calcul' ? 'disabled' : ''}>${ic('i-pdf')}Créer le PDF de travail</button>`}</div>`;
    }
    // PDF définitif
    const ou = raisonsPdf(P);
    if (ou.length && ui.etape !== 'fait') {
      return `${tete('Le PDF définitif n’est pas encore possible', 'Voici ce qui reste, étape par étape.')}
      <div class="fl__corps">
        <ul class="fl__problemes fl__problemes--etapes">${ou.map(([t, quoi]) => `<li><p class="fl__genre">${ic('i-fleche')}<b><a class="lien" href="#/livre" data-act="livre-vers-temps" data-v="${t}">${ETAPES[t]}</a></b></p><p class="fl__refs">${quoi}</p></li>`).join('')}</ul>
        <p class="fl__note">Le PDF de travail reste disponible pour relire le livre en l’état.</p>
      </div>
      <div class="fl__pied"><button class="btn btn--grand" data-act="livre-feuille" data-v="travail">${ic('i-pdf')}Créer un PDF de travail à la place</button></div>`;
    }
    const av = P.filter(p => p.g === 'avert' && !p.differe);
    if (ui.etape === 'fait') {
      return `${tete('PDF définitif créé', 'Livre intérieur prêt pour l’imprimeur.')}
      <div class="fl__corps">
        <div class="fl__fait">${ic('i-coche')}<div><p><b>passeurs-de-brume_livre.pdf</b></p><p>État du ${ui.pdf} · A5 · <span class="pages-n">${ui.pdfPages || ui.nbPages} pages</span></p></div></div>
        <button class="btn btn--primaire btn--grand fl__dl" data-act="toast" data-msg="Téléchargement simulé.">${ic('i-telecharger')}Télécharger le PDF définitif</button>
        <ul class="liste-simple fl__liste"><li>Ce fichier ne changera plus. Vous pouvez continuer à modifier le projet : l’application vous signalera si le livre change depuis ce PDF.</li><li>Il ne porte ni « Version de travail », ni références, ni signalements.</li></ul>
        <p class="fl__note">Et maintenant : <a href="#/livre/exports" data-act="livre-fermer-lien">préparer la couverture</a>, puis, si vous le souhaitez, <a href="#/livre/partage" data-act="livre-fermer-lien">partager le livre en ligne</a>.</p>
      </div>
      <div class="fl__pied"><button class="btn btn--grand" data-act="livre-fermer">Fermer</button></div>`;
    }
    return `${tete('PDF définitif', 'Le livre sans marques, prêt pour l’imprimeur.')}
      <div class="fl__corps">
        ${ui.etape === 'calcul' ? calcul('Composition du PDF définitif…') : ''}
        <ul class="verifs">
          <li>${ic('i-coche')}${choix() ? `${N.liste.length} passages numérotés de 1 à ${N.liste.length}, départ au n° 1` : `${N.liste.length} scènes dans l’ordre du plan`}</li>
          <li>${ic('i-coche')}Toutes les scènes du livre sont déclarées prêtes</li>
          <li>${ic('i-coche')}Aucun problème bloquant${choix() ? ' dans les chemins, les textes et les images' : ''}</li>
          ${av.map(p => `<li class="verifs__avert">${ic('i-alerte')}À vérifier : ${GENRES[p.k][1].toLowerCase()} (${p.ref}). Ne bloque pas.</li>`).join('')}
          ${P.filter(p => p.k === 'jeu').map(p => `<li class="verifs__avert">${ic('i-info')}À savoir : ${p.n} passage${p.n > 1 ? 's contiennent' : ' contient'} une action de jeu, et le livre n’a pas de feuille d’aventure. Ne bloque pas.</li>`).join('')}
        </ul>
        <p>Le fichier reprendra exactement la mise en page de l’aperçu, sans « Version de travail », références ni signalements. Il reflétera l’état du livre au moment de la demande.</p>
      </div>
      <div class="fl__pied"><button class="btn btn--primaire btn--grand" data-act="livre-creer" data-v="definitif" ${ui.etape === 'calcul' ? 'disabled' : ''}>${ic('i-telecharger')}Créer le PDF définitif</button></div>`;
  }
  function majFeuille(focus) {
    let f = $('#feuille-livre');
    if (!f) {
      document.body.insertAdjacentHTML('beforeend', '<div class="voile" id="voile-livre" data-act="livre-fermer" hidden></div><aside class="panneau fl" id="feuille-livre" role="dialog" aria-modal="true" aria-labelledby="fl-titre" hidden></aside>');
      f = $('#feuille-livre');
    }
    if (!ui.feuille) return;
    f.innerHTML = contenuFeuille(); f.hidden = false; $('#voile-livre').hidden = false;
    requestAnimationFrame(() => { f.classList.add('est-ouvert'); $('#voile-livre').classList.add('est-ouvert'); });
    if (focus) setTimeout(() => $('.fl__fermer', f)?.focus(), 60);
  }
  function ouvrirFeuille(type, el) { ui.feuille = type; ui.etape = null; ui.retourFocus = el || document.activeElement; majFeuille(true); }
  function fermerFeuille(retour = true) {
    const f = $('#feuille-livre'); if (!f || !ui.feuille) { ui.feuille = null; return; }
    ui.feuille = null; ui.etape = null;
    f.classList.remove('est-ouvert'); $('#voile-livre').classList.remove('est-ouvert');
    setTimeout(() => { if (!ui.feuille) { f.hidden = true; $('#voile-livre').hidden = true; } }, 220);
    if (retour && ui.retourFocus && document.body.contains(ui.retourFocus)) ui.retourFocus.focus();
  }

  /* ——— Page Livre ——————————————————————————————————————————— */
  function pageLivre() {
    if (eleve()) return `<div class="page"><p class="aucun">Le livre est préparé par Mme Laurent. <a href="#/plan">Retour à Mon travail</a></p></div>`;
    const S = modele(); const N = numeroter(S); const P = controler(S, N);
    // L'ancienne page « Réglages du livre » n'existe plus : son adresse mène à « Mettre en page »
    if (st.arg === 'composition') { ui.temps = 'page'; st.arg = ''; }
    const sous = ['exports', 'partage'].includes(st.arg) ? st.arg : 'apercu';
    if (sous !== 'apercu') ui.tiroir = null;
    const ici = sous === 'apercu' ? tempsEnCours() : 'sortie';
    const fermee = !ouverte(ici, P);
    // Ouverture d'une étape : son écran d'aide, tant que « Ne plus afficher » n'est pas cochée (F11-AC79). Refermé
    // par « Commencer », il ne revient pas avant la visite suivante.
    if (!fermee && ui.guidage && !ui.aideVue.has(ici) && !ui.aideJamais.has(ici) && !ui.tiroir) ui.aide = ici;
    if (ui.aide && (ui.aide !== ici || fermee)) ui.aide = null;
    const ecran = fermee ? porte(ici, S, N, P) : ui.aide ? aideEtape(ici) : '';
    if (ecran) ui.tiroir = null;
    // Avec une scène ouverte, les pages déjà calculées restent affichées pendant la mise à jour (F11.2)
    const z = $('.livre-apercu--tiroir .apercu__pages'); ui.anciennes = ui.tiroir && z?.children.length ? z.innerHTML : null;
    if (ui.tiroir && z && ui.scroll == null) ui.scroll = window.scrollY;
    const corps = ecran || (sous === 'partage' ? A.livre.pagePartage(S, N, P) : sous === 'exports' ? pageExports(S, N, P) : pageApercu(S, N, P));
    // Hors de l'aperçu, la composition est calculée hors écran pour connaître le nombre de pages
    const cache = sous === 'apercu' && !ecran ? '' : `<div class="apercu apercu--double apercu--cache" aria-hidden="true">${pagesLivre(S, N, P)}</div>`;
    const sortie = !ecran && sous !== 'apercu' ? `<div class="sortie-nav"><div class="bascule" role="tablist" aria-label="Imprimer ou partager"><a role="tab" href="#/livre/exports" aria-selected="${sous === 'exports'}">${ic('i-imprimer')}Imprimer</a><a role="tab" href="#/livre/partage" aria-selected="${sous === 'partage'}">${ic('i-partage')}Partager</a></div></div>` : '';
    return `<div class="page page--livre page--livre-${ecran ? 'ecran' : sous}">${A.enteteProjet('livre')}${frise(S, N, P, sous)}${sortie}${corps}${cache}</div>`;
  }

  /* ——— Lecture d'essai (playtest) ——————————————————————————— */
  const accessible = ref => { const sc = D.scenes[ref]; return !!sc && (!eleve() || attribue(D.chapitres[sc.chapitre])); };
  const suivantClassique = ref => { const l = scenesPlan().map(x => x.sc.ref); return l[l.indexOf(ref) + 1]; };
  function enteteEssai(actions) {
    return `<header class="essai-tete">
      <div class="essai-tete__titre"><h1>${ic('i-livre')}Lecture d’essai</h1><p class="essai-tete__meta">${esc(H.titre)} · ${eleve() ? 'tes chapitres, textes tels qu’ils sont maintenant' : 'texte courant des scènes, sans validation'}</p></div>
      <div class="essai-tete__actions">${actions}<a class="btn btn--discret" href="${eleve() ? '#/plan' : '#/livre'}">${ic('i-fermer')}Quitter</a></div>
    </header>`;
  }
  function debutEssai(S) {
    if (eleve()) {
      const chaps = Object.values(D.chapitres).filter(c => attribue(c) && c.scenes.length);
      return `<div class="page page--essai page--eleve">${enteteEssai('')}
        <div class="essai-debut">
          <h2>Par où veux-tu commencer ?</h2>
          <p>Lis l’histoire comme un lecteur : choisis une scène, puis suis les choix. Tu lis les textes tels qu’ils sont maintenant, même s’ils ne sont pas terminés.</p>
          ${chaps.map(c => `<section class="essai-debut__chap" style="${varsCouleur(c)}"><h3>${esc(c.titre)}</h3><ul>${c.scenes.map(sc => `<li><a class="essai-debut__scene" href="#/lecture/${sc.ref}" data-act="essai-depart" data-ref="${sc.ref}"><span class="fiche__ref">${sc.ref}</span><span>${esc(sc.titre)}</span>${S[sc.ref].vide ? '<span class="essai-debut__vide">Texte vide</span>' : ''}${ic('i-fleche')}</a></li>`).join('')}</ul></section>`).join('')}
          <p class="essai-note">${ic('i-oeil')}Quand Mme Laurent ouvre la lecture de toute l’histoire, tu peux aussi commencer au début du livre.</p>
        </div></div>`;
    }
    const opts = H.parties.map(p => p.chapitres.filter(c => c.scenes.length).map(c => `<optgroup label="${esc(c.titre)}">${c.scenes.map(sc => `<option value="${sc.ref}">${sc.ref} — ${esc(sc.titre)}</option>`).join('')}</optgroup>`).join('')).join('');
    return `<div class="page page--essai">${enteteEssai('')}
      <div class="essai-debut essai-debut--adulte">
        <h2>Par où commencer ?</h2>
        <p>Suivez les choix comme un lecteur, à travers tout le livre. La lecture d’essai montre le texte courant de chaque scène, même non validée, et ne change l’état d’aucune scène.</p>
        <div class="essai-debut__options">
          <section class="carnet-fiche carnet-fiche--decision"><header>${ic('i-drapeau')}<h2>Depuis le départ</h2></header><div class="carnet-fiche__corps"><p>${titreDe(S, H.depart)}</p><a class="btn btn--primaire" href="#/lecture/${H.depart}" data-act="essai-depart" data-ref="${H.depart}">${ic('i-fleche')}Commencer au départ</a></div></section>
          <section class="carnet-fiche"><header>${ic('i-grille')}<h2>Depuis une scène</h2></header><div class="carnet-fiche__corps"><label class="champ"><span>Scène</span><select id="essai-scene">${opts}</select></label><button class="btn" data-act="essai-depuis">${ic('i-fleche')}Commencer ici</button></div></section>
        </div>
        <p class="essai-note"><span>Un parcours joué ne prouve pas que tous les chemins aboutissent : les <a href="#/livre">contrôles du livre</a> vérifient l’ensemble.</span></p>
      </div></div>`;
  }
  function pageLecture() {
    const S = modele(); const N = numeroter(S);
    const ref = st.arg;
    if (!ref) return debutEssai(S);
    // Retour par l'historique du navigateur : on revient à la dernière étape correspondante
    const i = ui.chemin.lastIndexOf(ref); ui.chemin = i === -1 ? [ref] : ui.chemin.slice(0, i + 1);
    const prec = ui.chemin.length > 1;
    const actions = `<button class="btn" data-act="essai-retour" ${prec ? '' : 'disabled'}>${ic('i-fleche-g')}Passage précédent</button><button class="btn" data-act="essai-recommencer">${ic('i-recommencer')}Recommencer</button>`;
    let contexte = '', page = '', suite = '', c = null;
    if (ref === 'suite') {
      page = `<article class="essai-page essai-page--suite"><div class="essai-suite__brume" aria-hidden="true"></div><p class="essai-suite__t">La suite se trouve dans un chapitre que tu découvriras plus tard.</p><p class="essai-suite__s">Tu peux revenir au passage précédent pour essayer un autre choix.</p></article>`;
      suite = `<div class="essai-choix"><button class="btn btn--primaire btn--grand" data-act="essai-retour" ${prec ? '' : 'disabled'}>${ic('i-fleche-g')}Revenir au passage précédent</button></div>`;
    } else {
      const x = S[ref]; if (!x) return '<div class="page"><p>Scène introuvable.</p></div>';
      c = x.chap;
      contexte = `<p class="essai-contexte"><span class="pastille" style="background:${D.couleurs[c.couleur].edge}"></span><span>${esc(c.titre)}</span><span class="essai-contexte__sep" aria-hidden="true">·</span><span class="fiche__ref">${x.ref}</span><span class="essai-contexte__titre">${esc(x.titre)}</span>${eleve() ? '' : `<span class="essai-contexte__fin">${tampon(x.etat, true)}<a class="lien" href="#/scene/${x.ref}" data-act="essai-vers-scene">Ouvrir la scène</a></span>`}</p>`;
      const hors = !eleve() && !x.inclus ? `<p class="essai-hors">${ic('i-info')}<span><b>Hors du livre.</b> Cette scène est exclue ; elle n’aura pas de numéro. <em>(proposition non arbitrée)</em></span></p>` : '';
      const texte = x.vide ? `<p class="essai-page__vide">${ic('i-vide')}Ce passage n’est pas encore écrit.</p>` : A.jeu.paras(x.texte, A.jeu.actionsDe(x.ref));
      const fin = x.fin ? `<p class="passage__fin essai-page__fin">${esc(ui.fin || 'Fin')}</p>` : '';
      page = `${hors}<article class="essai-page recit">${texte}${fin}</article>`;
      const btn = (dest, lib, cls = '', extra = '') => {
        const sortie = eleve() && !accessible(dest);
        return `<button class="essai-option ${cls}" data-act="essai-aller" data-ref="${sortie ? 'suite' : dest}">${ic(cls ? 'i-cle' : 'i-fleche')}<span>${lib}</span>${extra}</button>`;
      };
      if (!choix()) {
        const n = suivantClassique(ref);
        suite = n ? `<div class="essai-choix">${btn(n, 'Passage suivant')}</div>` : `<div class="essai-choix essai-choix--fin"><button class="btn btn--grand" data-act="essai-recommencer">${ic('i-recommencer')}Recommencer</button></div>`;
      } else {
        const num = k => N.num[k.dest] || '?';
        const aDefinir = k => `<p class="essai-impasse">${ic('i-bloque')}<span>« ${esc(k.lib)} » n’a pas encore de destination.</span></p>`;
        const ch = phrasesDe(x).map(({ c, ph }) => ph
          ? `<p class="essai-phrase recit">${ph.map(seg => { if (typeof seg === 'string') return esc(seg); const k = x.choix[seg]; return k.dest ? `<button class="renvoi-num" data-act="essai-aller" data-ref="${eleve() && !accessible(k.dest) ? 'suite' : k.dest}" aria-label="Aller au passage ${num(k)}">${num(k)}</button>` : '…'; }).join('')}</p>`
          : c.dest ? btn(c.dest, esc(texteAuto(`${x.ref}:${c.i}`, c.lib, num(c), c.construction))) : aDefinir(c)).join('');
        const cachees = x.cachees.map(k => btn(k.dest, 'Énigme — aller à la suite prévue', 'essai-option--enigme', eleve() ? '' : `<span class="essai-option__ref">${k.dest} · n° ${k.num}</span>`)).join('');
        const rien = !x.choix.length && !x.cachees.length && !x.fin;
        suite = `<div class="essai-choix">${ch ? `<p class="essai-choix__h">${eleve() ? 'Que fais-tu ?' : 'Choix du lecteur'}</p>${ch}` : ''}${cachees ? `<p class="essai-choix__h essai-choix__h--enigme">Sans choix écrit : le lecteur résout l’énigme</p>${cachees}` : ''}
          ${rien ? `<p class="essai-impasse">${ic('i-alerte')}<span>Ce passage n’a ni choix ni fin : la lecture s’arrête ici.${eleve() ? '' : ' Les contrôles du livre le signalent.'}</span></p>` : ''}
          ${x.fin || rien ? `<div class="essai-choix__fin"><button class="btn" data-act="essai-recommencer">${ic('i-recommencer')}Recommencer</button>${prec ? `<button class="btn btn--discret" data-act="essai-retour">${ic('i-fleche-g')}Revenir au passage précédent</button>` : ''}</div>` : ''}</div>`;
      }
    }
    const etapes = ui.chemin.map((r, i) => {
      const der = i === ui.chemin.length - 1;
      const lib = r === 'suite' ? '<span class="essai-parcours__suite">Suite à découvrir</span>' : `<span class="fiche__ref">${r}</span><span class="essai-parcours__t">${esc(D.scenes[r].titre)}</span>`;
      return `<li ${der ? 'aria-current="step"' : ''}>${der ? `<span class="essai-parcours__e">${lib}</span>` : `<button class="essai-parcours__e" data-act="essai-etape" data-i="${i}" title="Revenir à cette étape">${lib}</button>`}</li>`;
    }).join('');
    return `<div class="page page--essai ${eleve() ? 'page--eleve' : ''}" ${c ? `style="${varsCouleur(c)}"` : ''}>${enteteEssai(actions)}
      <div class="essai-grille">
        <div class="essai-principal">${contexte}${page}${suite}</div>
        <div class="essai-cote"><aside class="essai-parcours" aria-labelledby="essai-parcours-t"><h2 id="essai-parcours-t">${eleve() ? 'Ton parcours' : 'Parcours'} <span class="compte">${ui.chemin.length}</span></h2><ol>${etapes}</ol>
          <p class="essai-note">${eleve() ? 'Lire ne change rien à tes textes ni à ceux de tes camarades.' : 'La lecture d’essai ne valide aucune scène et ne change l’état d’aucune.'}</p></aside>${ref === 'suite' ? '' : A.jeu.lecteur.essai()}</div>
      </div></div>`;
  }

  /* ——— Actions ———————————————————————————————————————————————— */
  const garder = () => { ui.scroll = window.scrollY; };
  // Scènes à finir, avec leur état dans le livre : le Suivi filtré les montre telles que le livre les compte
  const scenesAFinir = () => { const S = modele(); const l = Object.values(S).filter(x => x.inclus && x.etat !== 'prete'); A.suiviEtats = Object.fromEntries(l.map(x => [x.ref, { etat: x.etat, vide: x.vide }])); return l.map(x => x.ref); };
  function fermerInfo() { const b = $('#info-bulle'); if (b) b.hidden = true; $$('.info[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false')); }
  // Un réglage qui recompose tout le livre, après la tâche « Réordonner les passages » : l'ordre est à confirmer (F11.6)
  const douter = () => { if (choix() && ui.agencement) { ui.doute = true; ui.sigOrdre = null; } };
  function deplacer(N, ref, apres) {
    const t = ui.tiroir;
    ui.dernier = { quoi: 'rang', ref, avant: N.num[ref], ordres: [...ui.ordres], pages: new Set(ui.nouvellesPages) };
    ui.ordres = [...ui.ordres, { ref, apres }]; Object.assign(t, { erreur: null, apres: '' }); ui.sigOrdre = null;
    if (ui.pdf) ui.change = true; ui.apercu = 'attente'; ui.suivre = true; garder(); rendre();
  }
  const aller = h => { if (location.hash !== h) location.hash = h; else rendre(); };
  function viserPeu(no) {
    ui.peuPage = no;
    if (ui.tiroir) { clearTimeout(tApercu); Object.assign(ui, { tiroir: null, trajet: [], apercu: 'ok', anciennes: null, viserPage: !!no }); rendre(); return; }
    majPeu(); if (no) placer($('.pl--vise'));
  }
  Object.assign(A.actions, {
    'livre-ouvrir': (el, ev) => {
      const ref = el.dataset.ref; if (ev?.target.closest?.('a')) return;
      if (ui.tiroir?.ref === ref) { $('.tiroir .run')?.focus({ preventScroll: true }); return; }
      clearTimeout(tApercu); ui.apercu = 'ok'; ui.trajet = []; ouvrirTiroir(ref); rendre(); $('#tiroir-titre')?.focus({ preventScroll: true });
    },
    // Suivre un renvoi : l'aperçu se place sur le passage de destination et sa scène s'ouvre ; le trajet permet de revenir
    'livre-suivre': el => {
      const dest = el.dataset.ref; const de = el.closest('.passage')?.dataset.ref; if (!dest || !D.scenes[dest]) return;
      if (de && de !== dest) ui.trajet.push({ ref: de, lib: el.dataset.lib });
      clearTimeout(tApercu); ui.apercu = 'ok'; ouvrirTiroir(dest); rendre(); $('#tiroir-titre')?.focus({ preventScroll: true });
    },
    'livre-vue': el => { ui.vueEtroite = el.dataset.v; const a = $('.livre-apercu'); a.classList.toggle('livre-apercu--vue-livre', ui.vueEtroite === 'livre'); a.classList.toggle('livre-apercu--vue-scene', ui.vueEtroite !== 'livre'); $$('.tiroir-onglets [role="tab"]').forEach(b => b.setAttribute('aria-selected', b.dataset.v === ui.vueEtroite)); ajusterZoom(); if (ui.vueEtroite === 'livre') $('.passage.est-ouvert')?.scrollIntoView({ block: 'center' }); else window.scrollTo(0, $('.livre-apercu').getBoundingClientRect().top + window.scrollY - 62); },
    'livre-revenir': () => {
      const de = ui.trajet.pop(); if (!de) return;
      clearTimeout(tApercu); ui.apercu = 'ok'; ouvrirTiroir(de.ref); rendre(); $('#tiroir-titre')?.focus({ preventScroll: true });
    },
    'livre-fermer-tiroir': () => {
      const ref = ui.tiroir?.ref; clearTimeout(tApercu); ui.tiroir = null; ui.trajet = []; ui.apercu = 'ok'; ui.anciennes = null; ui.rappelPrete = null; ui.pb = null;
      garder(); rendre();
      ($(`.apercu__pages .passage[data-ref="${ref}"]`) || $('.controles'))?.focus({ preventScroll: true });
    },
    // Commandes d'un passage (F11.3) : le rang dans l'ordre imprimé et le début sur une nouvelle page
    'livre-rang': el => {
      const t = ui.tiroir; const N = numeroter(modele()); const r = rangDe(N, t.ref); const j = r.i + (el.dataset.v === 'monter' ? -1 : 1);
      if (r.fixe || j < 0 || j >= r.suite.length) return;
      deplacer(N, t.ref, el.dataset.v === 'monter' ? r.suite[j - 1] || null : r.suite[j]);
    },
    'livre-placer': () => {
      const t = ui.tiroir; const N = numeroter(modele()); const r = rangDe(N, t.ref); const brut = (t.apres || '').trim(); const k = +brut; const n = N.num[t.ref];
      const refuser = m => { t.erreur = m; garder(); rendre(); $('#pl-apres')?.focus({ preventScroll: true }); };
      if (!brut || !Number.isInteger(k)) return refuser('Indiquez le numéro du passage après lequel placer celui-ci.');
      if (k < 1 || k > N.liste.length) return refuser(`Le livre compte ${N.liste.length} passages : il n’y a pas de n° ${k}.`);
      if (k === n) return refuser(`C’est le numéro de ce passage. Indiquez celui après lequel le placer.`);
      if (N.groupe[N.liste[k - 1]] !== r.g) return refuser(`Le n° ${k} n’est pas dans ${r.ou}. Ce passage y reste : du n° ${r.min} au n° ${r.max}.`);
      if (k < r.min - 1 || k > r.max) return refuser(`Ce passage peut aller du n° ${r.min} au n° ${r.max}. Pour le n° ${r.min}, placez-le après le n° ${r.min - 1}.`);
      const avant = r.suite.filter(x => x !== t.ref && N.num[x] <= k); const apres = avant[avant.length - 1] || null;
      if ((r.suite[r.i - 1] || null) === apres) return refuser(`Il est déjà placé juste après le n° ${k}.`);
      deplacer(N, t.ref, apres);
    },
    'livre-pb': el => {
      const S = modele(); const N = numeroter(S); const P = controler(S, N); const l = aParcourir(P, N); if (!l.length) return;
      const sens = +el.dataset.v; let i = l.findIndex(p => clePb(p) === ui.pb); i = i < 0 ? (sens > 0 ? 0 : l.length - 1) : (i + sens + l.length) % l.length;
      const p = l[i]; Object.assign(ui, { pb: clePb(p), pbRef: p.ref, pbGenre: GENRES[p.k][1], trajet: [], apercu: 'ok' }); clearTimeout(tApercu);
      if (S[p.ref]) { if (ui.tiroir?.ref !== p.ref) ouvrirTiroir(p.ref); else ui.viser = p.ref; }
      rendre(); $('#pb-titre')?.focus({ preventScroll: true });
    },
    // Une page peu remplie se traite depuis le rail : la scène ouverte lui rend la place
    'livre-peu': el => {
      const l = ui.peu || []; if (!l.length) return;
      const sens = +el.dataset.v; let i = l.indexOf(ui.peuPage); i = i < 0 ? (sens > 0 ? 0 : l.length - 1) : (i + sens + l.length) % l.length;
      viserPeu(l[i]);
    },
    'livre-peu-page': el => viserPeu(ui.peuPage === +el.dataset.v ? null : +el.dataset.v),
    // Valider un passage suggéré revient à « placer après le n° … » : mêmes effets, même annulation (F11.3)
    'livre-suggere': el => {
      const N = numeroter(modele()); const ref = el.dataset.ref;
      ui.dernier = { quoi: 'rang', ref, avant: N.num[ref], ordres: [...ui.ordres], pages: new Set(ui.nouvellesPages) };
      ui.ordres = [...ui.ordres, { ref, apres: el.dataset.apres || null }]; if (ui.pdf) ui.change = true; ui.peuPage = null; ui.viser = ref; ui.sigOrdre = null; garder(); rendre();
    },
    // Réordonner les passages (agencement de F11.5) : proposé, jamais imposé, relançable à la demande
    'livre-agencer': el => {
      const v = el.dataset.v; const n = ui.ordres.length;
      // Réordonner à nouveau lève le doute et demande une nouvelle déclaration ; garder l'ordre ne change rien d'autre
      if (v === 'relance' || v === 'fait') { ui.ordres = []; ui.dernier = null; ui.agencement = 'fait'; if (ui.pdf) ui.change = true; if (ui.convient) ui.convient = false; }
      else ui.agencement = v === 'offre' || !v ? null : v;
      ui.doute = false; ui.sigOrdre = null; garder(); rendre();
      if (v === 'fait' || v === 'relance') toast(`Simulation : la maquette ne calcule pas le nouvel ordre, les numéros affichés restent les mêmes.${n ? ` Dans l’application, ${n > 1 ? `vos ${n} passages déplacés` : 'votre passage déplacé'} à la main ${n > 1 ? 'reprendraient' : 'reprendrait'} une place calculée.` : ''}`);
      else if (!v) toast('Annulé : l’ordre imprimé, les numéros et les renvois reviennent à leur état précédent.');
    },
    // Volets de « Mettre en page » : chacun retrouve l'endroit qu'on y avait quitté ; la barre reste en haut de la fenêtre
    'livre-volet': el => {
      const v = el.dataset.v; if (v === ui.volet) return;
      const barre = $('.volets'); const haut = barre ? barre.parentElement.getBoundingClientRect().top + window.scrollY - 58 : 0;
      ui.yVolet[ui.volet] = window.scrollY; ui.volet = v; ui.pageOuverte = v === 'apercu' ? null : ui.pageOuverte; fermerInfo();
      ui.scroll = Math.max(0, ui.yVolet[v] ?? Math.min(window.scrollY, haut)); rendre();
      $(`#volet-${v}`)?.focus({ preventScroll: true });
    },
    // Vers une section des réglages, depuis la barre des volets
    'livre-section': el => { if (ui.volet !== 'reglages') { ui.yVolet[ui.volet] = window.scrollY; ui.volet = 'reglages'; } ui.section = el.dataset.v; rendre(); },
    // Tâches d'une étape : en ouvrir une, ou passer à la suivante (« Mettre en page »)
    // La tâche choisie s'affiche toujours au même endroit : la fenêtre ne descend pas, elle remonte au besoin sur la fiche
    'livre-tache': el => {
      ui.tache[tempsEnCours()] = el.dataset.v; ui.pb = null; ui.peuPage = null; ui.pageOuverte = null;
      const f = $('.livre-etape'); ui.scroll = f ? Math.min(window.scrollY, f.getBoundingClientRect().top + window.scrollY - 70) : window.scrollY; rendre();
      $(`.fil__b[data-v="${el.dataset.v}"]`)?.focus({ preventScroll: true });
    },
    // Bulle d'information : ancrée à son icône, elle reste jusqu'à ce qu'on la ferme (clic, Échap ou clic ailleurs)
    'livre-info': el => {
      const ouverte = el.getAttribute('aria-expanded') === 'true'; fermerInfo(); if (ouverte) return;
      let b = $('#info-bulle'); if (!b) { document.body.insertAdjacentHTML('beforeend', '<div class="info-bulle" id="info-bulle" role="note" aria-live="polite" hidden></div>'); b = $('#info-bulle'); }
      b.innerHTML = `<p>${esc(el.dataset.msg)}</p><button class="info-bulle__fermer" data-act="livre-info-fermer" aria-label="Fermer l’explication">${ic('i-fermer')}</button>`;
      b.hidden = false; el.setAttribute('aria-expanded', 'true');
      const r = el.getBoundingClientRect(); const large = document.documentElement.clientWidth;
      b.style.left = `${Math.max(12, Math.min(r.left + window.scrollX - 18, large - b.offsetWidth - 12))}px`; b.style.top = `${r.bottom + window.scrollY + 8}px`;
    },
    'livre-info-fermer': () => { const b = $('.info[aria-expanded="true"]'); fermerInfo(); b?.focus({ preventScroll: true }); },
    // Ouvrir la scène d'un point à traiter : à côté de l'aperçu, avec son détail ; « Fermer » ramène à la liste
    'livre-traiter': el => {
      const S = modele(); const N = numeroter(S); const p = controler(S, N).find(x => clePb(x) === el.dataset.k); if (!p || !S[p.ref]) return;
      Object.assign(ui, { pb: clePb(p), pbRef: p.ref, pbGenre: GENRES[p.k][1], trajet: [], apercu: 'ok' }); clearTimeout(tApercu);
      ouvrirTiroir(p.ref); rendre(); $('#tiroir-titre')?.focus({ preventScroll: true });
    },
    'livre-declarer': el => { ui.declare[el.dataset.k] = !!el.dataset.v; garder(); rendre(); if (el.dataset.v) toast(el.dataset.k === 'relire' ? 'Livre relu : « Relire » est terminée.' : 'Chemins vérifiés : « Vérifier les chemins » est terminée.'); },
    // Doute sur l'ordre des passages : l'adulte garde l'ordre ; s'il avait déclaré la mise en page, elle retrouve sa coche
    'livre-doute': () => { ui.doute = false; garder(); rendre(); },
    // Vers la page d'une scène : elle proposera « Retour au livre »
    'livre-vers-scene': () => { A.retourLivre = 'livre'; A.livreRevenir = ui.tiroir ? ui.tiroir.ref : null; },
    // Depuis la lecture d'essai : la page de la scène proposera « Retour à la lecture d'essai »
    'essai-vers-scene': () => { A.retourEssai = location.hash; },
    'livre-vers-temps': el => { fermerFeuille(false); ui.temps = el.dataset.v; ui.pb = null; ui.peuPage = null; ui.aide = null; if (st.page === 'livre' && !st.arg) rendre(); },
    // Un avertissement s'accepte (« C'est voulu ») ; l'acceptation se retire (« Revoir »)
    'livre-accepter': el => {
      const k = el.dataset.k; if (el.dataset.v === 'non') { ui.acceptes.delete(k); ui.retires.add(k); } else { ui.acceptes.add(k); ui.retires.delete(k); }
      if (ui.pb === k) ui.pb = null; garder(); rendre();
    },
    'livre-convient': el => {
      if (ui.doute) return;
      ui.convient = !!el.dataset.v; if (ui.convient) ui.ouvertes.add('sortie');
      garder(); rendre(); if (ui.convient) toast('Mise en page terminée : « Imprimer et partager » est ouverte.');
    },
    // Déclarer une scène prête : le geste est dans la scène, donc aussi quand elle est ouverte à côté de l'aperçu (F11.1)
    // Si la scène garde un défaut d'écriture (impasse, choix sans destination), la déclaration le rappelle d'abord (F09.2)
    'livre-prete': el => {
      const ref = el.dataset.ref; const S = modele(); const N = numeroter(S);
      if (el.dataset.v !== 'oui' && controler(S, N).some(p => p.ref === ref && p.differe && ['issue', 'dest'].includes(p.k))) { ui.rappelPrete = ref; garder(); rendre(); return; }
      ui.rappelPrete = null; ui.pretesMain.add(ref); garder(); rendre(); toast(`${ref} est déclarée prête pour le livre.`);
    },
    'livre-prete-non': () => { ui.rappelPrete = null; garder(); rendre(); },
    // Scènes à finir : le Suivi s'ouvre filtré sur elles (F11-AC78)
    'livre-suivi': () => { A.suiviLivre = scenesAFinir(); },
    'suivi-livre-fin': () => { A.suiviLivre = null; rendre(); },
    // Écran d'aide d'une étape : montré à sa première ouverture, rouvert par le bouton « Aide »
    'livre-aide': () => { ui.aide = st.arg ? 'sortie' : tempsEnCours(); ui.tiroir = null; rendre(); $('#aide-t')?.focus({ preventScroll: true }); window.scrollTo(0, 0); },
    'livre-commencer': () => { ui.aideVue.add(ui.aide); ui.aide = null; rendre(); },
    'livre-marges-depart': () => { ui.marges = { ...MARGES0 }; ui.margeErreur = null; if (ui.pdf) ui.change = true; garder(); rendre(); toast('Marges revenues aux valeurs de départ : 16 mm en haut, 20 en bas, 15 à l’extérieur, 20 à l’intérieur.'); },
    'livre-des-phrase': () => { const J = A.jeu.J; const ph = 'Tu n’as pas de dé ? Ferme le livre, ouvre-le au hasard et lis le dé imprimé en bas de la page de droite.'; if (!J.regles.includes(ph)) J.regles = `${J.regles.trim()}\n${ph}`.trim(); if (ui.pdf) ui.change = true; garder(); rendre(); toast('Phrase ajoutée à vos règles du jeu, dans « Comment lire ce livre ». Vous pouvez la récrire.'); },
    'livre-annuler-apercu': () => {
      const d = ui.dernier; if (!d) return;
      ui.ordres = d.ordres; ui.nouvellesPages = d.pages; ui.dernier = null; ui.apercu = 'attente'; garder(); rendre();
      toast(d.quoi === 'page' ? 'Annulé : le début sur une nouvelle page revient à son réglage précédent.' : 'Annulé : l’ordre imprimé, les numéros et les renvois reviennent à leur état précédent.');
    },
    'livre-annuler-pas': () => {
      const t = ui.tiroir; noter(); const e = t.pile.pop(); if (!e) return;
      X().poser(t.ref, e); Object.assign(t, { clone: structuredClone(e), sig: JSON.stringify(X().etat(t.ref)), rafale: false, sauv: HEURES.saisie });
      ui.apercu = 'attente'; garder(); rendre();
    },
    'livre-tout-annuler': () => { noter(); ui.tiroir.confirme = true; garder(); rendre(); $('[data-act="livre-tout-annuler-oui"]')?.focus({ preventScroll: true }); },
    'livre-tout-annuler-non': () => { ui.tiroir.confirme = false; garder(); rendre(); },
    'livre-tout-annuler-oui': () => {
      const t = ui.tiroir; X().poser(t.ref, t.ouverture);
      Object.assign(t, { clone: structuredClone(t.ouverture), sig: JSON.stringify(X().etat(t.ref)), pile: [], rafale: false, confirme: false, sauv: HEURES.saisie });
      ui.apercu = 'attente'; garder(); rendre();
      toast(`${t.ref} est revenue à son texte de ${HEURES.ouverture}, tel qu’à l’ouverture. L’aperçu se met à jour.`);
    },
    'livre-voir': el => {
      if (st.arg) { ui.flash = el.dataset.ref; aller('#/livre'); return; }
      // Depuis les réglages de « Mettre en page » : le volet « Aperçu » s'ouvre sur le passage
      if (tempsEnCours() === 'page' && ui.volet !== 'apercu' && !ui.tiroir) { ui.yVolet.reglages = window.scrollY; ui.volet = 'apercu'; ui.viser = el.dataset.ref; rendre(); return; }
      const p = $(`.apercu__pages .passage[data-ref="${el.dataset.ref}"]`); if (!p) return;
      p.scrollIntoView({ block: 'center', behavior: 'smooth' }); p.classList.remove('est-flash'); void p.offsetWidth; p.classList.add('est-flash');
      setTimeout(() => p.classList.remove('est-flash'), 2400);
    },
    'livre-deplier': el => { const k = el.dataset.k; ui.ouverts.has(k) ? ui.ouverts.delete(k) : ui.ouverts.add(k); garder(); rendre(); },
    'livre-inclure': el => { const r = el.dataset.ref; ui.mods.exclure.delete(r); ui.mods.inclure.add(r); ui.mods.journal.push(r); if (ui.pdf) ui.change = true; garder(); rendre(); toast(`${r} réintégrée dans le livre, comme une nouvelle scène de sa partie. Les numéros suivants sont décalés.`); },
    'livre-exclure': el => { const r = el.dataset.ref; ui.mods.inclure.delete(r); ui.mods.exclure.add(r); ui.mods.journal = ui.mods.journal.filter(x => x !== r); if (ui.pdf) ui.change = true; garder(); rendre(); toast(`${r} est hors du livre. Elle reste dans le projet avec son travail ; rien n’est affiché aux élèves.`); },
    'livre-fin': el => { ui.mods.fins.add(el.dataset.ref); if (ui.pdf) ui.change = true; garder(); rendre(); toast(`${el.dataset.ref} est maintenant une fin : la marque « ${ui.fin || 'Fin'} » s’imprime après son texte.`); },
    'livre-image': el => { ui.mods.images.add(el.dataset.ref); garder(); rendre(); toast(`Image de ${el.dataset.ref} importée à nouveau (simulation) : elle reprend sa place et sa largeur.`); },
    'livre-zoom': el => { ui.zoom = el.dataset.v; rendre(); },
    // Choisir une étape : ouverte, elle s'affiche ; fermée, elle dit ce qui reste à faire (F11.6)
    'livre-temps': (el, ev) => { ui.temps = el.dataset.v; ui.pb = null; ui.peuPage = null; ui.aide = null; if (st.page === 'livre' && !st.arg) { ev.preventDefault(); rendre(); } },
    'livre-feuille': (el, ev) => { ev.preventDefault(); ouvrirFeuille(el.dataset.v, el); },
    'livre-fermer': () => fermerFeuille(),
    'livre-fermer-lien': () => { fermerFeuille(false); },
    'livre-voir-controles': () => { fermerFeuille(false); if (st.arg) aller('#/livre'); else $('.livre-rail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => $('.controles')?.focus?.(), 400); },
    'livre-creer': el => {
      ui.etape = 'calcul'; majFeuille(false);
      setTimeout(() => {
        if (!ui.feuille) return;
        ui.etape = 'fait';
        if (el.dataset.v === 'definitif') { ui.pdf = M().court; ui.pdfPages = ui.nbPages; ui.change = false; ui.pdfSig = A.livre.signature?.(); }
        else ui.travail = { date: M().date, note: `${bloquants(controler(modele(), numeroter(modele()))).length} problèmes récapitulés en première page` };
        majFeuille(false); garder(); rendre();
      }, 1400);
    },
    'livre-groupe': el => { const i = +el.dataset.i; ui.groupes.has(i) ? ui.groupes.delete(i) : ui.groupes.add(i); garder(); rendre(); if (ui.pdf) ui.change = true; toast(ui.groupes.has(i) ? `Parties ${i + 1} et ${i + 2} mélangées ensemble : leurs numéros changent, les renvois suivent.` : `Parties ${i + 1} et ${i + 2} mélangées chacune de son côté : leurs numéros changent, les renvois suivent.`); },
    'livre-page': el => { ui.pageOuverte = ui.pageOuverte === el.dataset.v ? null : el.dataset.v; garder(); rendre(); },
    'essai-depart': (el, ev) => { ev.preventDefault(); ui.chemin = [el.dataset.ref]; aller(`#/lecture/${el.dataset.ref}`); },
    'essai-depuis': () => { const r = $('#essai-scene').value; ui.chemin = [r]; aller(`#/lecture/${r}`); },
    'essai-aller': el => { const r = el.dataset.ref; ui.chemin.push(r); aller(`#/lecture/${r}`); },
    'essai-retour': () => { if (ui.chemin.length < 2) return; ui.chemin.pop(); aller(`#/lecture/${ui.chemin[ui.chemin.length - 1]}`); },
    'essai-etape': el => { ui.chemin = ui.chemin.slice(0, +el.dataset.i + 1); aller(`#/lecture/${ui.chemin[ui.chemin.length - 1]}`); },
    'essai-recommencer': () => { const d = ui.chemin[0]; if (!d || d === 'suite') { ui.chemin = []; aller('#/lecture'); return; } ui.chemin = [d]; aller(`#/lecture/${d}`); }
  });
  Object.assign(A.changes, {
    'livre-titres': el => { ui.titres = el.checked; garder(); rendre(); },
    'livre-titres-chap': el => { ui.titresChap = el.checked; garder(); rendre(); },
    'livre-formule': el => { ui.formule = el.value; garder(); rendre(); },
    'livre-nouvelle-page': el => {
      const t = ui.tiroir; if (!t) return;
      ui.dernier = { quoi: 'page', ref: t.ref, on: el.checked, ordres: [...ui.ordres], pages: new Set(ui.nouvellesPages) };
      el.checked ? ui.nouvellesPages.add(t.ref) : ui.nouvellesPages.delete(t.ref); ui.sigOrdre = null;
      if (ui.pdf) ui.change = true; ui.apercu = 'attente'; ui.suivre = true; garder(); rendre();
    },
    'livre-alignement': el => { ui.alignement = el.value; if (ui.pdf) ui.change = true; douter(); garder(); rendre(); },
    'livre-bas': el => { ui.bas = el.value; if (ui.pdf) ui.change = true; garder(); rendre(); },
    'livre-partie-page': el => { ui.partiePage = el.checked; if (ui.pdf) ui.change = true; douter(); garder(); rendre(); },
    'livre-chapitre-page': el => { ui.chapitrePage = el.checked; if (ui.pdf) ui.change = true; garder(); rendre(); },
    // Marges (F11-AC60) : une valeur sous 10 mm est refusée et la marge garde sa valeur
    'livre-marge': el => {
      const k = el.dataset.k; const v = Math.round(+el.value);
      if (!el.value.trim() || !(v >= 10)) ui.margeErreur = { k, saisi: el.value, msg: `<b>${esc(el.value || '0')} mm refusé</b> pour la marge ${NOMS_MARGE[k][1]} : aucune marge sous 10 mm, pour qu’un texte ne soit pas rogné. Elle reste à ${ui.marges[k]} mm.` };
      else { ui.marges[k] = v; ui.margeErreur = null; if (ui.pdf) ui.change = true; douter(); }
      garder(); rendre(); $(`#marge-${k}`)?.focus({ preventScroll: true });
    },
    'livre-forme': el => { ui.pages[el.dataset.v].forme = el.value; if (ui.pdf) ui.change = true; garder(); rendre(); },
    'livre-auteurs-place': el => { ui.pages.auteurs.place = el.value; if (ui.pdf) ui.change = true; garder(); rendre(); },
    'livre-police': el => { ui.police = el.value; douter(); garder(); rendre(); },
    'livre-taille': el => { ui.taille = el.value; douter(); garder(); rendre(); },
    'livre-aide-jamais': el => { el.checked ? ui.aideJamais.add(el.dataset.v) : ui.aideJamais.delete(el.dataset.v); },
    'livre-page-on': el => { ui.pages[el.dataset.v].on = el.checked; garder(); rendre(); },
    'livre-construction': el => { el.checked ? ui.constructions.add(el.value) : ui.constructions.delete(el.value); if (ui.pdf) ui.change = true; garder(); rendre(); }
  });
  A.saisies = Object.assign(A.saisies || {}, {
    'pl-apres': el => { if (ui.tiroir) ui.tiroir.apres = el.value; },
    'livre-fin': el => { ui.fin = el.value; $$('.extrait--fin .passage__fin').forEach(x => { x.textContent = el.value || 'Fin'; }); },
    'livre-titre': el => { ui.pages.titre[el.dataset.k] = el.value; },
    'livre-mode': el => { ui.pages.mode.texte = el.value; },
    'livre-auteurs': el => { ui.pages.auteurs.noms = el.value.split('\n').map(s => s.trim()).filter(Boolean); },
    'livre-finale': el => { ui.pages.fin.texte = el.value; }
  });
  document.addEventListener('toggle', ev => { if (ev.target.matches?.('.controles__details')) ui.detailOuvert = ev.target.open; }, true);
  document.addEventListener('click', ev => { if (!ev.target.closest?.('.info, .info-bulle')) fermerInfo(); const m = $('.menu-scene[open]'); if (m && !ev.target.closest?.('.menu-scene')) m.open = false; });
  document.addEventListener('keydown', ev => {
    if (ev.key === 'Escape' && $('.info[aria-expanded="true"]')) { A.actions['livre-info-fermer'](); return; }
    if (ev.key === 'Escape' && ui.feuille) { fermerFeuille(); return; }
    if (st.page !== 'livre') return;
    const t = ev.target.matches?.('.passage[role="button"]') ? ev.target : null;
    if (t && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); A.actions['livre-ouvrir'](t, ev); return; }
    if (ev.key === 'Enter' && ev.target.matches?.('.renvoi[role="link"]')) { ev.preventDefault(); A.actions['livre-suivre'](ev.target); return; }
    if (ev.key === 'Enter' && ev.target.id === 'pl-apres') { ev.preventDefault(); A.actions['livre-placer'](); return; }
    // Échap ferme la scène, sauf pendant la saisie : rien n'est à valider, tout est déjà dans la scène
    if (ev.key === 'Escape' && ui.tiroir && !ev.defaultPrevented && !ev.target.closest?.('.tiroir__copie, input, .fiche-pop, .slash')) A.actions['livre-fermer-tiroir']();
  });
  document.addEventListener('click', ev => { const su = ev.target.closest?.('.passage-livre > summary'); if (su) setTimeout(() => { ui.ficheOuverte = su.parentElement.open; }); });
  // Saisie dans l'éditeur ouvert depuis l'aperçu : enregistrée comme dans la page de scène (F08), sans nouveau
  // rendu ; l'aperçu est redemandé après une pause, non à chaque frappe (F11.2)
  let tSauv = 0;
  document.addEventListener('input', ev => {
    const t = ui.tiroir; if (!t || st.page !== 'livre' || !ev.target.closest?.('.tiroir__copie .run, .tiroir__copie .action-bloc__texte, .tiroir__copie .phrase-choix .recit')) return;
    noter(); t.rafale = true;
    const s = $('#tiroir-sauv'); if (s) { s.innerHTML = `${ic('i-horloge')}<span>Enregistrement…</span>`; clearTimeout(tSauv); tSauv = setTimeout(() => { const s2 = $('#tiroir-sauv'); if (s2) s2.innerHTML = `${ic('i-coche')}<span>Enregistré à ${HEURES.saisie}</span>`; }, 900); }
    $$('.tiroir__actions .btn').forEach(b => { b.disabled = false; });
    demanderApercu(2400);
  });
  // Les champs texte de la composition se valident à la sortie du champ (l'aperçu est recalculé à l'ouverture)
  document.addEventListener('change', ev => { if (ev.target.matches?.('[data-saisie^="livre-"]')) { garder(); rendre(); } });

  /* ——— Enregistrement, barre de présentation et drapeaux d'URL ——— */
  // Le lot Partage (partage.js) réutilise le modèle, la numérotation et les contrôles du livre
  A.livre = { rubriquePhrases, scenesAFinir, info, raisonsPdf, ETAPES, ui, M, TX, imageBase, imageDe, texteAuto, phraseAuto, phrasesDe, CONSTRUCTIONS, FORMULES, modele, numeroter, controler, bloquants, GENRES, ORDINAUX, ouverture, fr, titreDe, reinitLivre };
  Object.assign(A.pages, { livre: pageLivre, lecture: pageLecture });
  Object.assign(A.titres, {
    livre: () => `Livre — ${H.titre}`,
    lecture: () => `Lecture d’essai — ${H.titre}`
  });
  const apres0 = A.apres;
  A.apres = page => {
    apres0?.(page);
    const barre = $('#maquette-livre'); if (barre) barre.hidden = !['livre', 'lecture', 'lire', 'lectures'].includes(page);
    const r = $(`input[name="moment"][value="${st.moment}"]`); if (r) r.checked = true;
    fermerInfo(); if (!['scene', 'suivi'].includes(page)) A.retourLivre = null;
    if (['plan', 'chapitre', 'preparation'].includes(page)) A.suiviLivre = null;
    if (page === 'livre') {
      const z = $('.apercu__pages');
      // Mise à jour simulée : les anciennes pages restent visibles, puis l'aperçu recalculé les remplace
      if (ui.tiroir && ui.apercu === 'attente' && ui.anciennes && !ui.fige && z) {
        z.innerHTML = ui.anciennes; ajusterZoom(); majPagesTiroir(); if (ui.scroll != null) { window.scrollTo(0, ui.scroll); ui.scroll = null; }
        clearTimeout(tApercu); tApercu = setTimeout(recalculer, 1500);
      } else paginer();
    }
    if (page === 'livre' && st.arg && ui.scroll != null) { window.scrollTo(0, ui.scroll); ui.scroll = null; }
    // Retour de la page de scène : la scène quittée se rouvre à côté de l'aperçu, sur son passage, comme par un clic
    if (page === 'livre' && !st.arg && A.livreRevenir) { const ref = A.livreRevenir; A.livreRevenir = null; setTimeout(() => { if (st.page === 'livre' && !ui.tiroir && modele()[ref]) { ouvrirTiroir(ref); rendre(); } }, 0); }
    else if (!['scene', 'livre'].includes(page)) A.livreRevenir = null;
    if (page === 'lecture') {
      const x = D.scenes[st.arg]; const c = x && D.chapitres[x.chapitre];
      document.body.classList.toggle('sur-chapitre', !!c);
      if (c) document.body.style.setProperty('--fond-chap', D.couleurs[c.couleur].tint);
    }
    if (ui.feuille) majFeuille(false);
  };
  document.addEventListener('DOMContentLoaded', () => {
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    reinitLivre();
    if (ETAPES[q.get('temps')]) ui.temps = q.get('temps');
    if (TAILLES[q.get('taille')]) ui.taille = q.get('taille');
    // Parcours guidé : une adresse à drapeaux (captures) n'affiche pas l'aide de première ouverture, sauf ?aide=relire|chemins|page|sortie ;
    // ?tache=… (tâche des deux premières étapes), ?volet=apercu (« Mettre en page »), ?convient=1, ?accepte=1 (passages confirmés), ?groupes=1 (parties 2 et 3 mélangées ensemble)
    ui.guidage = !location.hash.includes('?');
    if (q.get('accepte')) ui.preAccepte = true;
    if (q.get('passees')) q.get('passees').split('.').forEach(k => ui.passees.add(k));
    if (q.get('convient')) { ui.convient = true; ui.ouvertes.add('page'); ui.ouvertes.add('sortie'); }
    if (q.get('ouvertes')) q.get('ouvertes').split('.').forEach(k => ui.ouvertes.add(k));
    if (q.get('tache')) ui.tache[q.get('temps') || 'relire'] = q.get('tache');
    if (q.get('temps') === 'page') { const ta = q.get('tache'); if (q.get('volet') === 'apercu' || ta === 'retouches' || q.get('peu')) ui.volet = 'apercu'; else if (['ordre', 'presentation'].includes(ta)) ui.section = ta; }
    if (q.get('savoir')) ui.savoirOuvert = true;
    if (q.get('afinir')) A.suiviLivre = scenesAFinir();
    // 4 octobre 2026 : ?doute=1 (ordre des passages à confirmer), ?info=2 (deuxième bulle d'information ouverte), ?menu=1 (menu de la scène), ?rappel=1
    if (q.get('doute')) { ui.doute = true; ui.agencement = ui.agencement || 'fait'; }
    // ?declare=relire.chemins (déclarations posées) ou ?declare=0 (aucune, pour montrer le moment où elles se posent)
    if (q.get('declare')) { const d = q.get('declare').split('.'); ui.declare = { relire: d.includes('relire'), chemins: d.includes('chemins') }; }
    if (AIDE[q.get('aide')]) { ui.guidage = true; ['relire', 'chemins', 'page', 'sortie'].filter(k => k !== q.get('aide')).forEach(k => ui.aideVue.add(k)); }
    if (q.get('suggere')) ui.autoSuggere = true;
    if (q.get('agencement')) ui.agencement = q.get('agencement');
    if (q.get('chemin')) ui.chemin = q.get('chemin').split('.');
    // Scène ouverte à côté de l'aperçu : ?tiroir=S003, avec &corrige=1 (coquille corrigée), &rang=monter|descendre,
    // &saut=1 (nouvelle page), &maj=1 (aperçu en cours de mise à jour, figé), &toutannuler=1 (« Tout annuler » à confirmer), &de=S003 (renvoi suivi), &image=1 (réglages de l'image), &bloc=descendre
    const tr = q.get('tiroir') || q.get('edition');
    if (tr && st.page === 'livre' && !st.arg && !eleve() && D.scenes[tr]) {
      ouvrirTiroir(tr); const t = ui.tiroir;
      if (q.get('corrige')) { A.editeur.corriger(tr, [['s’épaissi ', 's’épaissit ']]); noter(); }
      if (q.get('rang')) { const N = numeroter(modele()); const r = rangDe(N, tr); const j = r.i + (q.get('rang') === 'monter' ? -1 : 1); if (!r.fixe && r.suite[j]) { ui.dernier = { quoi: 'rang', ref: tr, avant: N.num[tr], ordres: [], pages: new Set(ui.nouvellesPages) }; ui.ordres = [{ ref: tr, apres: q.get('rang') === 'monter' ? r.suite[j - 1] || null : r.suite[j] }]; } }
      if (q.get('saut')) { ui.dernier = { quoi: 'page', ref: tr, on: true, ordres: [], pages: new Set(ui.nouvellesPages) }; ui.nouvellesPages.add(tr); }
      if (q.get('maj')) { ui.apercu = 'attente'; ui.fige = true; }

      if (q.get('toutannuler')) t.confirme = true;
      if (q.get('rappel')) ui.rappelPrete = tr;
      if (q.get('de') && D.scenes[q.get('de')]) ui.trajet = [{ ref: q.get('de'), lib: (D.scenes[q.get('de')].choix.find(k => k[1] === tr) || [''])[0] }];
    } else if (q.get('corrige')) ui.edits.S003 = TX.juin.S003.map(p => p.replace('s’épaissi ', 's’épaissit '));
    // Réglages du 3 octobre 2026 : ?bas=rien|folio|des, ?aligne=gauche, ?marge=i.23, ?merr=e.8 (valeur refusée),
    // ?pimage=feuille.titre (pages en image), ?place=fin (page des auteurs), ?viser=image, ?feuille2=1 (feuille de cinq sections), ?pb=3, ?peu=1
    // ?cadre=1 : la fenêtre telle qu'elle se présente après le défilement automatique, pour les captures (le navigateur
    // sans écran ne capture pas une page défilée)
    if (q.get('cadre')) { ui.cadre = true; document.documentElement.classList.add('cadre'); }
    if (q.get('vue-etroite')) ui.vueEtroite = q.get('vue-etroite');
    if (q.get('bas')) ui.bas = q.get('bas');
    if (q.get('aligne')) ui.alignement = q.get('aligne');
    if (q.get('marge')) { const [k, v] = q.get('marge').split('.'); ui.marges[k] = +v; }
    if (q.get('merr')) { const [k, v] = q.get('merr').split('.'); ui.margeErreur = { k, saisi: v, msg: `<b>${v} mm refusé</b> pour la marge ${NOMS_MARGE[k][1]} : aucune marge sous 10 mm, pour qu’un texte ne soit pas rogné. Elle reste à ${ui.marges[k]} mm.` }; }
    if (q.get('pimage')) q.get('pimage').split('.').forEach(k => { if (ui.pages[k]) ui.pages[k].forme = 'image'; });
    if (q.get('place')) ui.pages.auteurs.place = q.get('place');
    if (q.get('viser') === 'image') ui.viserSel = '.pl--image';
    if (q.get('feuille2')) A.jeu.J.feuille.sections.splice(2, 0, { id: 'comp', type: 'liste', titre: 'Compétences', lignes: 6 }, { id: 'temps', type: 'compteurs', titre: 'Le temps qui passe', compteurs: [{ id: 'heures', nom: 'Heures avant la nuit', depart: 6 }] });
    if (q.get('pb') && st.page === 'livre' && !st.arg && !eleve()) { const S = modele(); const N = numeroter(S); const p = aParcourir(controler(S, N), N)[+q.get('pb') - 1]; if (p) { Object.assign(ui, { pb: clePb(p), pbRef: p.ref, pbGenre: GENRES[p.k][1] }); if (S[p.ref]) ouvrirTiroir(p.ref); } }
    if (q.get('peu')) ui.peuRang = +q.get('peu');
    if (q.get('groupes')) q.get('groupes').split('.').forEach(i => ui.groupes.add(+i));
    if (q.get('pdf')) ui.pdf = M().court;
    if (q.get('change')) ui.change = true;
    if (q.get('zoom')) ui.zoom = q.get('zoom');
    if (q.get('constructions')) q.get('constructions').split('.').forEach(k => ui.constructions.add(k));
    if (q.get('page')) ui.pageOuverte = q.get('page');
    if (q.get('feuille')) { ui.feuille = q.get('feuille'); ui.etape = q.get('etape') || null; if (ui.etape === 'fait' && ui.feuille === 'definitif') ui.pdf = M().court; }
    rendre();
    if (q.get('info')) setTimeout(() => $$('.page--livre .info')[+q.get('info') - 1]?.click(), 700);
    // ?menu=1 ouvre le menu « Plus » de la scène, ?menu=etat la liste des états, ?menu=qui « qui s'en occupe » (page de scène et scène à côté de l'aperçu)
    if (q.get('menu')) setTimeout(() => { const m = $({ etat: '.menu-etat', qui: '.menu-qui' }[q.get('menu')] || '.menu-scene:not(.menu-etat):not(.menu-qui)'); if (m) m.open = true; }, 300);
    if (ui.tiroir && (q.get('image') || q.get('bloc'))) {
      const x = A.editeur.x; const e = x.etat(ui.tiroir.ref); const b = e.blocs.find(k => k.t === 'image');
      if (b) {
        if (q.get('bloc')) { const i = e.blocs.indexOf(b); const j = i + (q.get('bloc') === 'monter' ? -1 : 1); if (e.blocs[j]) { [e.blocs[i], e.blocs[j]] = [e.blocs[j], e.blocs[i]]; x.deriver(ui.tiroir.ref); } }
        x.ed.panneau = { bloc: b.id, image: true, mode: null, s: null, confirme: null, erreur: null }; ui.viser = ui.tiroir.ref; rendre(); ui.apercu = 'ok'; majEtatApercu();
      }
    }
  });
})();
