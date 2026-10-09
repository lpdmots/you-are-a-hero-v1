/* Deuxième lot : suivi, fiches papier, espace de la scène (écriture, reprise,
   révision), carnet de préparation et atelier projeté. Simulation sans persistance. */
(function () {
  const A = window.App;
  const { D, H, st, $, esc, image, tampon, gommette, pec, etatDe, choixDe, eleve, perso, choix, attribue, varsCouleur, toast, rendre } = A;
  const moi = () => A.moi();
  const prof = 'Mme Laurent';
  const MAINTENANT = 'mardi 29 septembre, 14 h 05';

  /* ——— Contenus fictifs des scènes ———————————————————————————— */
  const T = {
    S014: {
      consigne: 'Décris l’arrivée de la barque à la lisière et le moment où les lanternes s’éteignent une à une.',
      points: ['Ce que Lou voit, puis ce qu’il ne voit plus', 'Un bruit qui inquiète', 'Termine par les deux choix déjà préparés'],
      texte: ['La barque toucha la rive sans un bruit. Devant Lou, la forêt ressemblait à un grand mur noir piqué de lanternes.', 'Puis, une à une, les lanternes s’éteignirent, comme si quelqu’un soufflait dessus. Au loin, un chant très doux s’éleva.'],
      remises: [{ n: 1, date: 'jeudi 24 septembre, 10 h 40', par: 'ines', texte: null }]
    },
    S015: {
      consigne: 'Raconte ce que Lou entend et ressent quand le chant l’attire vers les fougères. Termine en montrant une lumière au loin.',
      points: ['Décris le chant : doux, triste, joyeux ?', 'Montre ce que ressent Lou : peur, curiosité…', 'Utilise au moins deux sens'],
      texte: ['Le chant était si doux que Lou en oublia la barque. Il venait de derrière les fougères, là où la brume restait accrochée aux branches comme de la laine mouillée.', 'Lou fit un pas, puis un autre. Les feuilles lui chatouillaient les joues.'],
      remises: []
    },
    S016: {
      consigne: 'Lou se cache dans une souche creuse et allume la lanterne de secours. Décris ce qu’il découvre à l’intérieur.',
      points: ['L’obscurité, puis la lumière', 'Un détail étrange dans la souche', 'Les deux choix de la fin'],
      texte: ['Lou se glissa dans la souche creuse. Il faisait noir comme dans un four. Il sortit la lanterne de secour de son sac et frotta l’allumette.', 'La flamme dansa sur les murs de bois. Des petits yeux brillait au fond, puis une voix murmura : « Éteins ça, tu vas les attirer. »'],
      remises: [{ n: 1, date: 'mardi 29 septembre, 10 h 12', par: 'bilal' }]
    },
    S017: {
      consigne: 'Lou reste caché. Une chouette entre dans la souche : raconte comment Lou comprend qu’elle veut l’aider.',
      points: ['La chouette : ses plumes, ses yeux', 'Le moment où Lou comprend', 'Finir en suivant la chouette'],
      texte: ['Une chouette se posa sur le bord de la souche. Ses plumes argentées brillaient dans la nuit. Elle regarda Lou longtemps.', 'Lou décida de la suivre.'],
      remises: [{
        n: 1, date: 'lundi 28 septembre, 11 h 05', par: 'bilal',
        texte: ['Une chouette se posa sur le bord de la souche. Ses plumes argentés brillait dans la nuit. Elle regarda Lou longtemps.', 'Lou décida de la suivre.'],
        retour: { date: 'lundi 28 septembre, 17 h 40', texte: 'On ne comprend pas encore comment Lou devine que la chouette veut l’aider. Ajoute un moment où elle lui montre le chemin, par un geste ou un bruit. J’ai corrigé les accords de la deuxième phrase.', cite: 'Elle regarda Lou longtemps.' }
      }]
    },
    S018: {
      consigne: 'Les deux chemins se rejoignent dans une clairière. Lou y retrouve la lumière aperçue plus tôt : décris ce lieu.',
      points: ['Ce que Lou reconnaît', 'D’où vient la lumière', 'Le pont de brume qui apparaît'],
      texte: [], remises: []
    },
    S019: { consigne: null, points: [], texte: [], remises: [] },
    S051: {
      consigne: 'Lou arrive devant une porte sans poignée. Décris-la, puis laisse le lecteur choisir comment l’ouvrir.',
      points: ['Ce qui rend la porte étrange', 'Les deux façons d’entrer'],
      texte: ['Sur le palier, une porte barrait le passage. Elle n’avait ni poignée ni serrure, seulement des symboles gravés qui luisaient faiblement dans la brume.'],
      remises: []
    },
    S055: {
      consigne: 'Invente l’énigme gravée sur la porte. Le lecteur doit pouvoir trouver seul le numéro du passage suivant.',
      points: ['Décris les symboles', 'Écris l’énigme comme une phrase gravée', 'Vérifie que le calcul tombe juste'],
      texte: ['Lou approcha sa lanterne. Sur la porte, quatre lunes et neuf étoiles étaient gravées autour de deux petites clés.', 'Dessous, une phrase : « Multiplie les lunes par les étoiles, ajoute les clés, et tu sauras où aller. »'],
      remises: []
    }
  };
  // Scènes sans contenu rédigé pour la maquette : un texte d'exemple si la scène n'est pas vide, sa remise si le travail a été remis,
  // et pas de consigne quand le Suivi la dit « sans consigne ». Une scène « À valider » ne s'ouvre donc plus sur un texte vide.
  const EXEMPLE = ['Lou avança sans bruit. La brume glissait sur l’eau et, quelque part devant lui, une lanterne clignotait.', 'Il retint son souffle, compta jusqu’à trois, puis fit un pas de plus.'];
  const parDefaut = {};
  const contenu = A.contenu = sc => T[sc.ref] || (parDefaut[sc.ref] = parDefaut[sc.ref] || {
    consigne: sc.consigne ? 'Consigne rédigée par l’enseignante pour cette scène.' : null, points: [],
    texte: sc.vide ? [] : EXEMPLE.slice(),
    remises: sc.pec && ['valider', 'reprendre', 'valide', 'prete'].includes(sc.etat)
      ? [{ n: 1, date: 'lundi 28 septembre, 11 h 20', par: sc.pec, ...(sc.etat === 'reprendre' ? { retour: { date: 'lundi 28 septembre, 17 h 45', texte: 'Ajoute ce que Lou ressent à ce moment-là, puis relis les accords de la dernière phrase.' } } : {}) }]
      : []
  });
  // État de travail modifiable de la maquette
  const ui = { lecture: {}, remis: {}, retire: {}, envoi: null, ia: null, reprise: false, onglet: 'courant', decision: null, suivi: 'scenes', filtreSuivi: 'tous', eleveSuivi: '', modeEleve: 'pec', chapSuivi: '', charge: null, fichesMode: 'chapitre', fichesSuite: false, ficheEleve: '', replies: new Set(), fiches: null, ficheVue: 0, atelier: {}, iaAtelier: 1 };
  // Côté élève (5 octobre 2026) : retours déjà lus, note qui suit une prise en charge prise ou rendue, connexion
  Object.assign(ui, { retourVu: {}, pecNote: null, quitter: false, codeFaux: false });
  A.reinit = nom => {
    if (nom === 'page' || nom === 'vue') { ui.pecNote = null; ui.quitter = false; ui.envoi = null; ui.ia = null; ui.reprise = false; ui.rappel = null; ui.decide = null; ui.onglet = 'courant'; ui.decision = null; }
    // F08.1 : un conflit est un instant. Quitter la page ou changer de vue le termine ; le texte gardé à part, lui, reste,
    // et « Ne plus garder ce texte » ne s'annule plus.
    if (['page', 'vue', 'mode'].includes(nom)) { finirGa(); if (st.sauv === 'conflit' && !(nom === 'page' && /[?&]sauv=conflit/.test(location.hash))) st.sauv = 'ok'; }
    // Retour du réseau : l'enregistrement qui échouait aboutit, et le pied de l'élève l'annonce (F08-AC22)
    if (nom === 'sauv') { ga.revenu = eleve() && ga.sauvAvant === 'echec' && st.sauv === 'ok' ? (ui.envoi === 'echec' ? 'remise' : true) : false; if (ui.envoi === 'echec' && st.sauv !== 'echec') ui.envoi = null; ga.vus.clear(); ga.sauvAvant = st.sauv; }
  };

  /* ——— Textes gardés à part après un conflit de sauvegarde (F08.1, 7 octobre 2026) ——————————————————
     Un texte refusé à l'enregistrement est gardé à part : c'est un onglet de la copie, côté adulte, avec deux gestes — « Ne plus
     garder ce texte », qui s'annule tant qu'on reste sur la page, et « Mettre ce texte dans la scène », qui est un échange. Seul
     l'élève dont le texte attend est arrêté, sur cette scène ; l'adulte ne l'est jamais. Le texte qui sort de la scène par un échange
     s'appelle « Ancien texte de la scène » et n'arrête personne, même après un second échange (décision du 7 octobre).
     Adresses à drapeaux, pour les captures — préfixe « ga », libre dans les autres écrans :
       ?ga=bilal · ?ga=bilal.ines · ?ga=prof · ?ga=ancien sur une scène ; ?ga=S015:bilal,S016:prof ailleurs (Suivi, « Mon travail », Livre)
       ?texte=g1 (onglet du premier texte gardé à part) · ?gafait=retire|echange (juste après le geste) · ?gafait=conflit (conflit de l'adulte, à l'instant)
       ?gafait=suspendue (après ce conflit, « Validé » d'abord suspendu) · ?garemis=1 (Alice a remis la scène à 10 h 40)
       ?gareseau=1 (élève : l'enregistrement qui échouait vient d'aboutir) · ?gatous=1 (Suivi : aucun élève sans chapitre)
     Avec la barre de présentation : « Conflit » garde à part le texte de la personne affichée, sur la scène ouverte. */
  const JOUR_GA = 'mardi 6 octobre'; const HEURE_GA = '14 h 05';
  const ECRITS = { S015: {
    bilal: { heure: '10 h 42', texte: [T.S015.texte[0], T.S015.texte[1], 'Soudain, il vit une petite lumière bleue entre deux troncs. Elle clignotait, comme pour l’appeler.'], plus: [['Se cacher dans la souche creuse', 'S016']] },
    ines: { heure: '10 h 47', texte: [T.S015.texte[0], 'Lou fit un pas, puis un autre.'] } } };
  const SUITE_GA = 'Lou retint son souffle. Le chant reprit, plus près cette fois.';      // ce que l'élève tapait quand son enregistrement a été refusé
  const MAJ_GA = 'Tout à coup, le chant s’arrêta. Lou n’osait plus bouger.';              // ce qu'un élève a écrit pendant que l'adulte corrigeait
  const CORR_GA = { S015: [['Les feuilles lui', 'Les fougères lui']], S016: [['secour ', 'secours '], ['brillait', 'brillaient']] };
  const GA = {}; let nGa = 0;
  const ga = { fait: null, instant: null, vus: new Set(), relire: {}, viser: null, revenu: false, sauvAvant: 'ok' };
  const gardes = ref => GA[ref] || [];
  const estEleve = id => !!id && id !== 'prof' && id !== 'ancien' && !!D.eleves[id];
  const arrete = (ref, id) => !perso() && gardes(ref).some(g => g.qui === id);
  const nomGa = g => (g.qui === 'ancien' ? 'Ancien texte de la scène' : g.qui === 'prof' ? (perso() ? 'Votre texte' : 'Vos corrections') : `Texte ${de(nomEl(g.qui))}`);
  const gardeGa = g => `${g.qui === 'prof' && !perso() ? 'gardées' : 'gardé'} à part ${g.jour}`;
  // À qui est ce texte, pour la mention de lecture de son onglet
  const telQue = g => (g.qui === 'ancien' ? `tel qu’il était à ${g.heure}` : g.qui === 'prof' ? (perso() ? `tel que vous l’avez écrit à ${g.heure}` : `telles que vous les avez écrites à ${g.heure}`) : `tel que ${nomEl(g.qui)} l’a écrit à ${g.heure}`);
  const dernierP = e => { let i = -1; e.blocs.forEach((b, k) => { if (b.t === 'p') i = k; }); return i; };
  // Le texte gardé à part est une copie entière de la scène telle que son auteur la voyait : paragraphes, phrases de choix, images
  function etatGa(ref, g) {
    if (g.etat) return g.etat;
    const e = structuredClone(A.editeur.x.etat(ref)); const ps = e.blocs.filter(b => b.t === 'p');
    // Ses paragraphes prennent la place de ceux de la scène ; les autres blocs (action de jeu, image, phrase de choix) restent où ils sont
    if (g.texte) {
      let k = 0; e.blocs = e.blocs.filter(b => b.t !== 'p' || k++ < g.texte.length);
      k = 0; e.blocs.forEach(b => { if (b.t === 'p') { const p = esc(g.texte[k++]); if (b.html !== p) { b.html = p; b.protege = false; } } });
      e.blocs.splice(dernierP(e) + 1, 0, ...g.texte.slice(Math.min(ps.length, g.texte.length)).map((p, i) => ({ id: `${g.id}p${i}`, t: 'p', html: esc(p) })));
    } else e.blocs.splice(dernierP(e) + 1, 0, { id: `${g.id}p`, t: 'p', html: esc(SUITE_GA) });
    (g.plus || []).forEach(([lib, dest], i) => e.blocs.push({ id: `${g.id}c${i}`, t: 'choix', liens: [{ id: `${g.id}l${i}`, lib, dest, construction: 'si' }], perso: null }));
    return (g.etat = e);
  }
  function garder(ref, qui, o = {}) {
    const ecrit = (ECRITS[ref] || {})[qui] || {};
    const g = { id: 'g' + (++nGa), qui, jour: JOUR_GA, heure: ecrit.heure || HEURE_GA, texte: ecrit.texte || null, plus: ecrit.plus || null, ...o };
    (GA[ref] = GA[ref] || []).push(g); etatGa(ref, g); return g;
  }
  // Le texte de la scène a changé : la fiche, le Suivi et « Mon travail » le suivent
  function suivreTexte(ref) { const sc = D.scenes[ref]; const txt = A.editeur.x.textes(ref) || []; contenu(sc).texte = txt; sc.vide = !txt.length; }
  // L'enregistrement d'un élève est refusé : sa saisie est gardée à part et il est arrêté sur cette scène, jusqu'au geste de l'adulte
  function conflitEleve(ref, id) {
    const cle = `${ref}:${id}`; if (ga.vus.has(cle) || arrete(ref, id)) return; ga.vus.add(cle);
    garder(ref, id); ga.instant = cle;
  }
  // Celui de l'adulte : ses corrections sont gardées à part, « Texte de la scène » montre le texte à jour, et il n'est pas arrêté (F08-AC21)
  function conflitAdulte(ref, frais = true) {
    const cle = `${ref}:prof`; if (ga.vus.has(cle)) return null; ga.vus.add(cle);
    const X = A.editeur.x; const mien = structuredClone(X.etat(ref));
    mien.blocs.forEach(b => { if (b.t === 'p') (CORR_GA[ref] || []).forEach(([a, c]) => { b.html = b.html.replace(esc(a), esc(c)); }); });
    const g = garder(ref, 'prof', { etat: mien, frais });
    const e = X.etat(ref); e.blocs.splice(dernierP(e) + 1, 0, { id: `${g.id}m`, t: 'p', html: esc(MAJ_GA) });
    suivreTexte(ref); if (frais) ga.relire[ref] = true; return g;
  }
  // Ce qu'un élève ferait sans incident : écrire (« base »), ou trouver la scène qui ne s'écrit plus (« nePlus »)
  const refus = (sc, c) => { const autre = !!sc.pec && sc.pec !== moi() && editable(sc); return { base: editable(sc) && attribue(c) && !autre, nePlus: attribue(c) && (!editable(sc) || sc.pec === 'prof') }; };
  function retirerGa(ref, id) {
    const l = gardes(ref); const i = l.findIndex(g => g.id === id); if (i < 0) return;
    const [g] = l.splice(i, 1); ga.fait = { type: 'retire', ref, g, i }; ui.onglet = 'courant';
  }
  // L'échange : le texte gardé à part devient le texte de la scène, ses choix compris (F08-AC26) ; celui qu'il remplace attend à son tour
  function echangerGa(ref, id, dit = true) {
    const l = gardes(ref); const i = l.findIndex(g => g.id === id); if (i < 0) return;
    const X = A.editeur.x; const g = l[i]; const avant = structuredClone(X.etat(ref));
    X.poser(ref, etatGa(ref, g));
    const ancien = { id: 'g' + (++nGa), qui: 'ancien', jour: JOUR_GA, heure: HEURE_GA, etat: avant };
    l.splice(i, 1, ancien); suivreTexte(ref); ui.onglet = 'courant';
    ga.fait = dit ? { type: 'echange', ref, g, id: ancien.id } : null;
  }
  function finirGa() { ga.fait = null; ga.instant = null; ga.revenu = false; Object.values(GA).forEach(l => l.forEach(g => { g.frais = false; })); }
  const PHRASE_GA = `<b>Ton texte est gardé à part.</b> ${prof} doit le regarder avant que tu écrives ici.`;
  const enumerer = l => (l.length > 1 ? `${l.slice(0, -1).join(', ')} et ${l[l.length - 1]}` : l[0] || '');
  // Message au-dessus de la copie de l'adulte : ce qui vient d'être fait, le conflit à l'instant, puis ce qui attend
  function notesGa(sc, gs, gVue) {
    const out = []; const f = ga.fait && ga.fait.ref === sc.ref ? ga.fait : null;
    const voir = (g, lib) => (gVue && gVue.id === g.id ? '' : ` <button class="lien" data-act="onglet-texte" data-v="${g.id}">${lib}</button>`);
    if (f) {
      const el = estEleve(f.g.qui) ? nomEl(f.g.qui) : null; const nom = f.g.qui === 'ancien' ? 'L’ancien texte de la scène' : f.g.qui === 'prof' ? (perso() ? 'Votre texte' : 'Vos corrections') : `Le texte ${de(el)}`;
      const pl = f.g.qui === 'prof' && !perso();
      if (f.type === 'retire') out.push(`<div class="note note--fait" role="status">${ic('i-coche')}<div><p><b>${nom} ${pl ? 'ne sont plus gardées' : 'n’est plus gardé'}${el ? ' :' : '.'}</b>${el ? ` ${el} peut de nouveau écrire dans cette scène.` : ''}</p>
        <div class="note__actions"><button class="btn btn--petit" data-act="ga-annuler">Annuler</button><span class="ga-tant">tant que vous restez sur cette page</span></div></div></div>`);
      else { const anc = gs.find(g => g.id === f.id);
        out.push(`<div class="note note--fait" role="status">${ic('i-coche')}<p><b>${f.g.qui === 'ancien' ? 'L’ancien texte est de nouveau' : `${nom} ${pl ? 'sont' : 'est'} maintenant`} le texte de la scène.</b> ${f.g.qui === 'ancien' ? 'Celui qu’il remplace' : 'L’ancien'} est gardé à part${el ? `, et ${el} peut de nouveau écrire` : ''}.${anc ? voir(anc, f.g.qui === 'ancien' ? 'Voir ce texte' : 'Voir l’ancien texte') : ''}</p></div>`); }
    }
    gs.filter(g => g.frais).forEach(g => out.push(`<div class="note note--conflit" role="alert">${ic('i-apart')}<p><b>${perso() ? 'Vous avez modifié cette scène dans une autre fenêtre.' : 'Quelqu’un a modifié cette scène pendant que vous la corrigiez.'}</b> ${perso() ? 'Ce que vous veniez d’écrire ici est gardé à part' : 'Vos corrections sont gardées à part'} ; la scène montre le texte à jour.${voir(g, perso() ? 'Voir ce texte' : 'Voir vos corrections')}</p></div>`));
    const l = gs.filter(g => !g.frais && !(f && f.type === 'echange' && f.id === g.id));
    if (l.length) {
      const noms = l.filter(g => estEleve(g.qui)).map(g => nomEl(g.qui)); const g = l[0];
      const dit = l.length > 1 ? `<b>${l.length} textes sont gardés à part${noms.length ? ' :' : '.'}</b>${noms.length ? ` tant qu’ils attendent, ${enumerer(noms)} ne ${noms.length > 1 ? 'peuvent' : 'peut'} pas écrire dans cette scène.` : ''}`
        : g.qui === 'ancien' ? '<b>L’ancien texte de la scène est gardé à part.</b>'
        : g.qui === 'prof' ? `<b>${perso() ? `Votre texte du ${g.jour} est gardé` : `Vos corrections du ${g.jour} sont gardées`} à part.</b>`
        : `<b>Un texte ${de(noms[0])} est gardé à part :</b> tant qu’il attend, ${noms[0]} ne peut pas écrire dans cette scène.`;
      out.push(`<div class="note note--conflit" role="status">${ic('i-apart')}<p>${dit}${l.length > 1 ? l.map(x => voir(x, nomGa(x))).join('') : voir(g, 'Voir ce texte')}</p></div>`);
    }
    return out;
  }
  // Pied de l'onglet d'un texte gardé à part : les deux gestes, aucun n'est le bouton plein, « Ne plus garder » efface
  function piedGa(sc, g) {
    const el = estEleve(g.qui) ? nomEl(g.qui) : null;
    const aide = `« Ne plus garder ce texte » : il est effacé${el ? `, et ${el} peut de nouveau écrire dans la scène` : ''}. « Mettre ce texte dans la scène » : il prend la place du texte de la scène, qui est gardé à part à son tour. Vous pouvez aussi copier un passage et le coller dans le texte de la scène.`;
    return `<p class="ga-pied">Que faire de ce texte ?${info('suivi-info', 'Que font ces deux commandes ?', aide)}</p>
      <div class="ga-cmd"><button class="btn btn--danger" data-act="ga-retirer" data-ref="${sc.ref}" data-id="${g.id}">Ne plus garder ce texte</button><button class="btn" data-act="ga-echanger" data-ref="${sc.ref}" data-id="${g.id}">Mettre ce texte dans la scène</button></div>`;
  }
  // Scène ouverte à côté de l'aperçu du livre : une ligne, et le renvoi à la page de la scène, où sont déjà les remises
  function ligneTiroir(ref) {
    const gs = perso() ? gardes(ref).filter(g => !estEleve(g.qui)) : gardes(ref); if (!gs.length) return '';
    const g = gs[0]; const noms = gs.filter(x => estEleve(x.qui)).map(x => nomEl(x.qui));
    const dit = gs.length > 1 ? `${gs.length} textes sont gardés à part dans cette scène.`
      : g.frais ? `Quelqu’un a modifié cette scène pendant que vous la corrigiez : vos corrections sont gardées à part.`
      : g.qui === 'ancien' ? 'L’ancien texte de cette scène est gardé à part.'
      : g.qui === 'prof' ? `${perso() ? `Votre texte du ${g.jour} est gardé` : `Vos corrections du ${g.jour} sont gardées`} à part.`
      : `Un texte ${de(noms[0])} est gardé à part dans cette scène.`;
    return `<p class="tiroir__alerte ga-tiroir" role="status">${ic('i-apart')}<span><b>${dit}</b> <a class="lien" href="#/scene/${ref}" data-act="ga-vers-scene" data-id="${g.id}">${gs.length > 1 ? 'Les voir' : g.qui === 'prof' && !perso() ? 'Les voir' : 'Le voir'} sur la page de la scène</a></span></p>`;
  }
  A.apart = { de: gardes, arrete, phrase: PHRASE_GA, tiroir: ligneTiroir,
    // Toutes les scènes du projet où un texte attend : la ligne de rappel du Suivi (F08-AC11)
    toutes: () => (perso() ? [] : Object.entries(GA).filter(([r, l]) => l.length && D.scenes[r] && !D.scenes[r].supprime).sort(([a], [b]) => a.localeCompare(b))) };

  const nomEl = id => D.eleves[id].prenom;
  const editable = sc => ['cours', 'reprendre'].includes(sc.etat);
  const para = t => (t || []).map(p => `<p>${esc(p)}</p>`).join('');
  const mots = t => (t || []).join(' ').split(/\s+/).filter(Boolean).length;
  const retourVers = c => `<a class="retour-chap" href="#/chapitre/${c.id}">${ic('i-fleche-g')}${c.titre}</a>`;

  /* ——— Indicateur de sauvegarde : jamais « enregistré » à tort ——— */
  function etatSauvegarde() {
    if (st.sauv === 'echec') return `<p class="sauv sauv--echec" role="status">${ic('i-horloge')}<span><b>Pas encore enregistré.</b> Nouvel essai dans 10 s.</span></p>`;
    return `<p class="sauv" role="status" id="sauv">${ic('i-coche')}<span>Enregistré à 14 h 05</span></p>`;
  }

  /* ——— État de la scène : l'enseignante a la main (F07.1, 4 octobre 2026) ————————————————
     Le tampon de l'en-tête ouvre la liste des états, chacun avec ce qu'il change pour les élèves. Une scène sans élève
     (personne, ou l'enseignante) n'en a que trois (F11.1). La même commande sert dans la scène ouverte à côté de l'aperçu. */
  const sansEleve = sc => perso() || !sc.pec || sc.pec === 'prof';
  const duLivre = () => !eleve() && (A.retourLivre === 'livre' || !!A.suiviLivre || st.page === 'livre');
  const etatCourant = ref => (duLivre() && A.livre ? A.livre.modele()[ref].etat : etatDe(D.scenes[ref]));
  const LIGNES = {
    cours: ['Les élèves peuvent écrire.', 'Le texte n’est pas fini.'],
    reprendre: ['Les élèves reprennent, avec votre remarque.'],
    valider: ['À vous de relire. Les élèves ne peuvent plus écrire.'],
    valide: ['L’élève a fini. À vous de finir la scène.', 'Le texte est fini. Reste à finir la scène.'],
    prete: ['Elle entre dans le livre telle quelle.']
  };
  function menuEtat(sc, etat, ctx) {
    const seul = sansEleve(sc);
    const liste = perso() ? ['cours', 'prete'] : seul && !['valider', 'reprendre'].includes(etat) ? ['cours', 'valide', 'prete'] : ['cours', 'reprendre', 'valider', 'valide', 'prete'];
    // À côté de l'aperçu, « Prête » garde le rappel du livre (F09.2) ; ailleurs, celui de la page
    const act = e => (ctx === 'tiroir' && e === 'prete' && etat !== 'prete' ? 'livre-prete' : 'etat-poser');
    // Sans texte, « En cours » se lit « Texte vide », comme au Suivi ; la liste garde les états de F07.1
    const vide = etat === 'cours' && sc.vide; const nom = vide ? 'Texte vide' : D.etats[etat].court;
    const ligne = e => (e === 'cours' && vide ? (seul ? 'Le texte est encore vide.' : 'Les élèves peuvent écrire. Le texte est encore vide.') : LIGNES[e][seul ? 1 : 0] || LIGNES[e][0]);
    return `<details class="menu-scene menu-etat"><summary class="tampon tampon--menu" data-e="${vide ? 'vide' : etat}" aria-label="État : ${nom}. Changer l’état">${ic(vide ? 'i-vide' : D.etats[etat].icone)}${nom}${ic('i-chevron-bas')}</summary>
      <div class="menu-scene__liste menu-etat__liste" role="group" aria-label="État de la scène"><p class="menu-scene__t">État de la scène</p>
        ${liste.map(e => `<button data-act="${act(e)}" data-ref="${sc.ref}" data-e="${e}" ${ctx ? `data-ctx="${ctx}"` : ''} ${e === etat ? 'aria-current="true"' : ''}>${tampon(e, true)}<span>${ligne(e)}</span>${e === etat ? ic('i-coche') : ''}</button>`).join('')}</div></details>`;
  }
  A.menuEtat = menuEtat;
  // Qui s'en occupe : un élève du chapitre, l'enseignante (la scène est alors la sienne, F06.3) ou personne
  function menuQui(sc, c) {
    if (perso()) return '';
    const ids = [...c.eleves.map(([id]) => id), 'prof', ''];
    return `<details class="menu-scene menu-qui"><summary class="menu-qui__b" aria-label="Qui s’en occupe. Changer">${pec(sc)}${ic('i-chevron-bas')}</summary>
      <div class="menu-scene__liste" role="group" aria-label="Qui s’en occupe"><p class="menu-scene__t">Qui s’en occupe</p>
        ${ids.map(id => `<button data-act="qui-poser" data-ref="${sc.ref}" data-id="${id}" ${(sc.pec || '') === id ? 'aria-current="true"' : ''}>${id ? gommette(id, 'gommette--s') : '<span class="gommette gommette--libre gommette--s" aria-hidden="true"></span>'}<span>${id === 'prof' ? 'Moi' : id ? nomEl(id) : c.eleves.length ? 'Pas encore prise' : 'Aucun élève'}</span>${(sc.pec || '') === id ? ic('i-coche') : ''}</button>`).join('')}
        <p class="menu-scene__note">« Moi » : les élèves lisent la scène, sans y écrire.</p></div></details>`;
  }
  // Défauts d'écriture rappelés au moment de déclarer prête, sans l'empêcher (F09.2)
  function defauts(sc, vide) {
    const d = [];
    if (vide) d.push('Le texte est vide.');
    if (choix()) { const ch = choixDe(sc); if (!ch.length && !sc.fin && !(sc.cachees || []).length) d.push('Cette scène n’a ni choix ni fin.'); else if (ch.some(k => !k[1])) d.push('Un choix n’a pas de destination.'); }
    return d;
  }

  /* ——— Espace de la scène : une copie, des fiches de contexte ———— */
  function pageScene() {
    const sc = D.scenes[st.arg]; if (!sc) return '<div class="page"><p>Scène introuvable.</p></div>';
    const c = D.chapitres[sc.chapitre]; const t = contenu(sc); const e = etatDe(sc);
    // Conflit à l'instant (barre de présentation) : le texte est gardé à part avant de dessiner l'en-tête, qui en dépend (F08.1)
    if (st.sauv === 'conflit') { if (!eleve()) conflitAdulte(sc.ref); else { const r = refus(sc, c); if (r.base || r.nePlus) conflitEleve(sc.ref, moi()); } }
    // Un seul retour : le fil dit où l'on est, la pastille de l'en-tête ramène d'où l'on vient
    const fil = `<nav class="fil" aria-label="Fil d’Ariane"><a href="#/plan">${eleve() ? 'Mon travail' : 'Parties et chapitres'}</a><span aria-hidden="true">/</span><a href="#/chapitre/${c.id}" class="fil__chap">${c.titre}</a><span aria-hidden="true">/</span><span aria-current="page">${sc.ref}</span></nav>`;
    if (eleve() && st.horaire === 'ferme') {
      return `<div class="page page--scene" style="${varsCouleur(c)}">${fil}<div class="ferme-horaire">
        <div class="ferme-horaire__image">${image(c.image, c.couleur, '')}</div>
        ${st.sauv === 'echec'
          // L'échec passe devant la fermeture : c'est lui le titre, et rien n'invite à quitter la page (critique du 5 octobre 2026)
          ? `<h1>Ton texte n’est pas enregistré</h1>
        <p class="ferme-horaire__alerte" role="alert">${ic('i-alerte')}<span>Ne ferme pas cette page et appelle Mme Laurent.</span></p>
        <p>Le travail est fermé jusqu’à demain, 8 h 30.</p>`
          : `<h1>Le travail est fermé jusqu’à demain, 8 h 30</h1>
        <p>${arrete(sc.ref, moi()) ? `Ton texte est gardé à part. ${prof} doit le regarder.` : 'Ton texte a été enregistré à 16 h 30. Tu le retrouveras demain.'}</p>
        <a class="btn" href="#/plan">Retour à Mon travail</a>`}</div></div>`;
    }
    if (eleve() && ui.derniere === 'plan') A.retourTravail = true;
    const origine = eleve() ? (A.retourTravail ? ['#/plan', 'Retour à Mon travail'] : null) : A.retourEssai ? [A.retourEssai, 'Retour à la lecture d’essai'] : A.retourLivre === 'livre' ? ['#/livre', 'Retour au Livre'] : A.suiviLivre ? ['#/suivi', 'Retour aux scènes à finir'] : A.retourSuivi ? [A.retourSuivi.href, 'Retour au Suivi'] : null;
    const M = !eleve() && A.livre ? A.livre.modele()[sc.ref] : null;
    const x = duLivre() ? M : null;
    // Venue du livre, la page montre le texte et l'état que le livre compte, et non ceux du début d'année
    const scL = x ? { ...sc, etat: x.etat, vide: x.vide } : sc; const tL = x && x.texte.length ? { ...t, texte: x.texte } : t;
    if (x && x.texte.length && !A.livre.ui.semes.has(sc.ref)) { A.editeur.x.semer(sc.ref, x.texte); A.livre.ui.semes.add(sc.ref); }
    const inclus = !M || M.inclus;
    // « Exclure du livre » est dans le menu de la scène, d'où qu'on vienne (F11.2)
    const plus = `<details class="menu-scene"><summary class="btn btn--petit menu-plus" title="Autres commandes de la scène">${ic('i-points')}<span class="vh">Autres commandes de la scène</span></summary><div class="menu-scene__liste">${choix() ? `<button data-act="sc-depart" data-ref="${sc.ref}" ${sc.depart ? 'aria-current="true" disabled' : ''}>Départ du livre${sc.depart ? ' ✓' : ''}</button><button data-act="sc-fin" data-ref="${sc.ref}" aria-pressed="${!!sc.fin}">Fin de l’histoire${sc.fin ? ' ✓' : ''}</button><hr>` : ''}${inclus ? `<button data-act="livre-exclure" data-ref="${sc.ref}">Exclure du livre</button>` : `<button data-act="livre-inclure" data-ref="${sc.ref}">Réintégrer dans le livre</button>`}</div></details>`;
    const tete = `<header class="scene-tete">
        <a class="retour-chap" href="${origine ? origine[0] : `#/chapitre/${c.id}`}">${ic('i-fleche-g')}${origine ? origine[1] : c.titre}</a>
        <div class="scene-tete__titre"><span class="fiche__ref">${sc.ref}</span><h1>${sc.titre}</h1></div>
        <div class="scene-tete__etat">${eleve() ? A.tamponSc(sc) + pecEleve(sc, c) :`${inclus ? '' : `<span class="tampon tampon--hors">${ic('i-moins')}Hors du livre</span>`}${menuEtat(scL, x ? x.etat : e)}${menuQui(sc, c)}${plus}`}</div>
      </header>`;
    const fin = eleve() && st.horaire === 'fin' ? `<p class="bandeau-horaire" role="status">${ic('i-horloge')}Le travail se ferme à 16 h 30, dans 5 minutes.${st.sauv === 'ok' ? ' Ton texte sera enregistré automatiquement.' : ''}</p>` : '';
    // Première ouverture d'une scène à reprendre : l'élève qui s'en occupe ne voit d'abord que le retour (idée du porteur, à l'essai)
    if (eleve() && retourAMontrer(sc) && !arrete(sc.ref, moi())) return `<div class="page page--scene page--eleve" style="${varsCouleur(c)}">${fil}${tete}${fin}${retourGrand(sc, t)}</div>`;
    const v = eleve() ? vueEleve(sc, c, t) : vueAdulte(scL, c, tL);
    return `<div class="page page--scene ${eleve() ? 'page--eleve' : ''}" style="${varsCouleur(c)}">${fil}${tete}${fin}${v.alertes || ''}
      <div class="scene-grille">
        <div class="scene-principal">${v.principal}</div>
        <aside class="scene-cote" aria-label="Contexte de la scène">${v.cote}</aside>
      </div></div>`;
  }

  /* Fiche de consigne (filet rose bristol), repliable quand un retour passe devant */
  function ficheConsigne(sc, t, { modifiable = false, replie = false, mien = true } = {}) {
    const titre = eleve() ? (mien ? 'Ta consigne' : 'La consigne') : 'Consigne';
    const corps = t.consigne
      ? `<p class="consigne__texte">${esc(t.consigne)}</p>${t.points.length ? `<ul class="consigne__points">${t.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}`
      : `<p class="consigne__vide">${modifiable ? 'Pas encore de consigne écrite. Les élèves peuvent quand même écrire, avec une consigne orale ou sur fiche.' : (mien ? 'Pas de consigne écrite. Suis celle que Mme Laurent t’a donnée.' : 'Pas de consigne écrite.')}</p>`;
    const actions = modifiable ? `<div class="fiche-actions"><button class="btn btn--petit" data-act="toast" data-msg="Saisie de la consigne (simulation).">${ic('i-crayon')}${t.consigne ? 'Modifier' : 'Écrire la consigne'}</button><button class="btn btn--petit" data-act="ia-consigne">${ic('i-etincelle')}M’aider à la formuler</button></div>${ui.ia === 'consigne' ? propositionConsigne() : ''}` : '';
    if (replie) return `<details class="carnet-fiche carnet-fiche--pli"><summary><header>${ic('i-consigne')}<h2>${titre}</h2></header></summary><div class="carnet-fiche__corps">${corps}</div></details>`;
    return `<section class="carnet-fiche"><header>${ic('i-consigne')}<h2>${titre}</h2></header><div class="carnet-fiche__corps">${corps}${actions}</div></section>`;
  }

  /* Fiche de retour (filet corail) : prend la place de la consigne pendant une reprise.
     La remarque est facultative (F07.3) : sans elle, la fiche dit seulement que la reprise est demandée. */
  function ficheRetour(sc, t, { remise = null, replie = false } = {}) {
    const r = remise || t.remises[t.remises.length - 1]; const ret = (r && r.retour) || t.retourSeul; if (!ret) return '';
    // Après une nouvelle remise, le retour précédent reste lisible, replié sous la consigne
    if (replie) return `<details class="carnet-fiche carnet-fiche--pli carnet-fiche--retour"><summary><header><span class="gommette gommette--s" style="--g:#4A5157" aria-hidden="true">ML</span><h2>Remarque de ${prof}</h2></header></summary>
      <div class="carnet-fiche__corps">${ret.cite ? `<blockquote class="recit">« ${esc(ret.cite)} »</blockquote>` : ''}<p class="retour__texte">${ret.texte ? esc(ret.texte) : 'Reprise demandée, sans remarque écrite.'}</p><p class="retour__meta">${ret.date}</p></div></details>`;
    const leTexte = r && eleve() ? (r.par === moi() ? 'mon texte' : `le texte de ${nomEl(r.par)}`) : '';
    const dest = sc.pec && sc.pec !== 'prof' ? sc.pec : null; const pourMoi = eleve() && dest === moi();
    return `<section class="carnet-fiche carnet-fiche--retour"><header><span class="gommette gommette--s" style="--g:#4A5157" aria-hidden="true">ML</span><h2>Remarque de ${prof}</h2></header>
      <div class="carnet-fiche__corps">
        ${ret.cite ? `<blockquote class="recit">« ${esc(ret.cite)} »</blockquote>` : ''}
        <p class="retour__texte">${ret.texte ? esc(ret.texte) : 'Reprise demandée, sans remarque écrite.'}</p>
        <p class="retour__meta">${ret.date}${dest ? ` · pour ${pourMoi ? 'toi' : nomEl(dest)}` : ''}</p>
        ${eleve() && dest && !pourMoi ? `<p class="retour__meta">Tu peux lire cette remarque ; c’est ${nomEl(dest)} qui s’occupe de la reprise.</p>` : ''}
        ${eleve() ? '<p class="retour__meta">Si tu hésites, demande une explication en classe.</p>' : ''}
        ${eleve() && r ? `<button class="btn btn--petit" data-act="voir-remise">${ic('i-papier')}${ui.remiseOuverte ? 'Masquer' : 'Voir'} ${leTexte} du ${r.date.split(',')[0]}</button>
        ${ui.remiseOuverte ? `<div class="remise-apercu"><p class="remise-apercu__tete">Remis par ${nomEl(r.par)} · ${r.date}</p><div class="recit">${para(r.texte || t.texte)}</div></div>` : ''}` : ''}
      </div></section>`;
  }

  /* La copie : en-tête (onglets ou titre + outils), blocs du texte, pied d'action.
     Paragraphes, phrases de choix, blocs protégés et repères hors récit sont rendus par choix.js (F05.2, F06.1). */
  function copie(sc, c, { texte, peutEcrire, entete, pied, profil, source, lecture, etatFige, icone }) {
    const E = A.editeur;
    return `<section class="copie ${peutEcrire ? '' : 'copie--lecture'}" aria-label="Texte de la scène">
      <div class="copie__barre">${entete}${E.caseVoisines(sc, !!source)}
        ${peutEcrire ? E.outils(sc, c, profil) : `<p class="copie__lecture">${ic(icone || (source ? 'i-papier' : 'i-oeil'))}${source || lecture || 'Lecture seule'}</p>`}
      </div>
      ${E.corps(sc, c, { texte, peutEcrire, profil, fige: !!source, etatFige })}
      ${pied ? `<footer class="copie__pied">${pied}</footer>` : ''}
    </section>`;
  }

  /* Vue de l'élève, reprise après la critique du 5 octobre 2026. Le pied de la copie reste à l'écran : il porte
     l'enregistrement, la remise et les incidents, à l'endroit où l'élève regarde. Mots : « remettre » reste un verbe,
     « reprendre » ne désigne que la correction après un retour, « s'occuper de » la prise en charge. */
  // Tant que la scène s'écrit, l'élève peut retirer son propre signalement (F06.3, 5 octobre 2026)
  function pecEleve(sc, c) {
    if (sc.pec !== moi() || !editable(sc) || !attribue(c) || arrete(sc.ref, moi())) return pec(sc);   // ni pendant l'arrêt d'un conflit (F08.1)
    return `<details class="menu-scene menu-moi"><summary class="menu-qui__b" aria-label="Tu t’en occupes. Changer">${pec(sc)}${ic('i-chevron-bas')}</summary>
      <div class="menu-scene__liste" role="group" aria-label="Qui s’en occupe"><button data-act="pec-lacher" data-ref="${sc.ref}"><span>Je ne m’en occupe plus</span></button>
        <p class="menu-scene__note">Ton texte reste dans la scène.</p></div></details>`;
  }
  // Retour mis en avant à la première ouverture d'une scène à reprendre : idée du porteur, à l'essai (F07.3)
  const AVANT = 'Écris d’abord ton texte.';
  const retourAMontrer = sc => sc.etat === 'reprendre' && sc.pec === moi() && !ui.retourVu[sc.ref];
  function retourGrand(sc, t) {
    const r = t.remises[t.remises.length - 1]; const ret = (r && r.retour) || t.retourSeul || {};
    return `<section class="retour-grand" aria-labelledby="t-retour">
      <header><span class="gommette gommette--l" style="--g:#4A5157" aria-hidden="true">ML</span><h2 id="t-retour">${prof} te demande de reprendre ton texte</h2></header>
      ${ret.cite ? `<blockquote class="recit">« ${esc(ret.cite)} »</blockquote>` : ''}
      <p class="retour-grand__texte">${ret.texte ? esc(ret.texte) : 'Elle n’a pas écrit de remarque. Si tu ne sais pas quoi changer, demande-lui.'}</p>
      <button class="btn btn--primaire btn--grand" data-act="retour-lu" data-ref="${sc.ref}">J’ai lu, j’écris${ic('i-fleche')}</button>
    </section>`;
  }
  function vueEleve(sc, c, t) {
    const monProfil = (c.eleves.find(([e]) => e === moi()) || [])[1];
    const mien = sc.pec === moi(); const libre = !sc.pec;
    const autrePec = !!sc.pec && !mien && editable(sc);
    // Conflit : l'élève arrête d'écrire, son texte est gardé ; un simple échec le laisse continuer (F08.1, 5 octobre 2026).
    // L'arrêt tient jusqu'au geste de l'enseignante sur ce texte : page rechargée, autre poste ou séance suivante (7 octobre 2026).
    // « nePlus » : la scène ne s'écrit plus, remise par un camarade, validée ou prise par l'enseignante pendant qu'il tapait (F08-AC19)
    const { base, nePlus } = refus(sc, c);
    const arret = arrete(sc.ref, moi()); const instant = arret && ga.instant === `${sc.ref}:${moi()}`;
    const peutEcrire = base && !arret;
    const alertes = [];
    if (ui.envoi === 'ok') alertes.push(`<div class="note note--ok" role="status">${ic('i-coche')}<p><b>C’est remis !</b> ${prof} va relire ton texte. En attendant, tu ne peux plus écrire dedans.</p></div>`);
    // Prendre ou rendre une scène se dit sur place et s'annule, sans bulle qui disparaît
    const pn = ui.pecNote && ui.pecNote.ref === sc.ref ? ui.pecNote : null;
    const annuler = `<div class="note__actions"><button class="btn btn--petit" data-act="pec-annuler">Annuler</button></div>`;
    if (pn && pn.type === 'pris') alertes.push(`<div class="note note--pec" role="status">${gommette(moi())}<div><p><b>Tu t’occupes maintenant de cette scène</b>${pn.avant ? `, à la place de ${nomEl(pn.avant)}` : ''}.</p>${annuler}</div></div>`);
    else if (pn && pn.type === 'lache') alertes.push(`<div class="note note--pec" role="status">${ic('i-main')}<div><p><b>Tu ne t’occupes plus de cette scène.</b> Ton texte reste dedans.</p>${annuler}</div></div>`);
    else if (sc.pec === 'prof') alertes.push(`<div class="note note--pec">${gommette(sc.pec)}<div><p><b>${prof} s’occupe de cette scène.</b> Tu peux la lire.</p></div></div>`);
    // Pendant l'arrêt, rien ne propose de prendre la scène : le bouton promettrait l'écriture (décision du 7 octobre 2026)
    else if (autrePec && arret) alertes.push(`<div class="note note--pec">${gommette(sc.pec)}<div><p><b>${nomEl(sc.pec)} s’occupe de cette scène.</b> Tu peux la lire.</p></div></div>`);
    else if (autrePec) alertes.push(`<div class="note note--pec">${gommette(sc.pec)}<div><p><b>${nomEl(sc.pec)} s’occupe de cette scène.</b> Tu peux la lire. Pour écrire dedans, parle-lui d’abord, ou à ${prof}.</p>
      <div class="note__actions"><button class="btn btn--petit" data-act="reprendre-pec" data-ref="${sc.ref}">${ic('i-main')}M’occuper de cette scène</button></div></div></div>`);
    const attente = ui.envoi === 'attente';
    let pied = '';
    // À l'instant du refus : la phrase du conflit, ou celle d'une scène qui ne s'écrit plus. Au retour, avant le geste : son texte
    // est gardé à part, il lit la scène, et rien ne lui propose d'écrire, de remettre ni de retirer la remise.
    if (instant) pied = `<p class="pied-alerte pied-alerte--conflit" role="alert">${ic('i-alerte')}<span>${nePlus
      ? `<b>Cette scène a changé pendant que tu écrivais : tu ne peux plus y écrire.</b> Ce que tu venais d’écrire est gardé. Appelle ${prof}.`
      : `<b>Quelqu’un d’autre a écrit dans cette scène en même temps que toi.</b> Ton texte est gardé. Arrête d’écrire et appelle ${prof}.`}</span></p>`;
    else if (arret) pied = `<p class="pied-alerte pied-alerte--conflit" role="status">${ic('i-apart')}<span>${PHRASE_GA}</span></p>${A.retourTravail ? '' : `<a class="btn" href="#/plan">${ic('i-fleche-g')}Retour à Mon travail</a>`}`;
    else if (peutEcrire) {
      // Une seule indication à la fois : l'attente d'enregistrement prend la place de l'heure
      const etat = attente ? `<p class="sauv" role="status">${ic('i-horloge')}<span>Enregistrement de ta dernière phrase…</span></p>`
        : st.sauv === 'echec' ? `<p class="pied-alerte" role="alert">${ic('i-alerte')}<span>${ui.envoi === 'echec'
          ? `<b>Ton texte n’est pas remis : il n’est pas encore enregistré.</b> Ne ferme pas cette page et appelle ${prof}.`
          : '<b>Ton texte n’est pas encore enregistré.</b> Tu peux continuer, mais ne ferme pas cette page.'}</span></p>`
        // Un texte vide ne se remet pas : le bouton attend la première phrase (F07.1, 5 octobre 2026)
        : sc.vide ? `<p class="sauv sauv--avant" role="status" id="sauv">${ic('i-crayon')}<span>${AVANT}</span></p>`
        // L'enregistrement qui échouait vient d'aboutir : l'écran l'annonce, sans rien demander (F08-AC22)
        : ga.revenu ? `<p class="sauv" role="status" id="sauv">${ic('i-coche')}<span><b>Ça y est, ton texte est enregistré.</b>${ga.revenu === 'remise' ? ' Tu peux le remettre.' : ''}</span></p>`
        : etatSauvegarde();
      pied = `${etat}<button class="btn btn--primaire btn--grand" data-act="soumettre" data-ref="${sc.ref}" ${attente || sc.vide ? 'disabled' : ''}>Remettre à ${prof}${ic('i-fleche')}</button>`;
    }
    else if (sc.etat === 'valider') {
      const r = t.remises[t.remises.length - 1]; const par = r && r.par !== moi() ? nomEl(r.par) : null;
      pied = `<p class="copie__etat">${ic('i-sablier')}${prof} relit ce texte.${par ? ` C’est ${par} qui l’a remis.` : ''}</p><button class="btn" data-act="retirer" data-ref="${sc.ref}">${ic('i-crayon')}Modifier encore ${mien ? 'mon' : 'ce'} texte</button>`;
    }
    // Demande après validation : à l'oral en première livraison (F07.2, 5 octobre 2026)
    else if (['valide', 'prete'].includes(sc.etat)) pied = `<p class="copie__etat copie__etat--valide">${ic('i-coche')}Validé par ${prof}${sc.etat === 'prete' ? ', prêt pour le livre' : ''}</p><p class="copie__apres">Pour changer quelque chose, demande à ${prof}.</p>`;
    const entete = `<h2 class="copie__titre">${mien ? (sc.etat === 'reprendre' ? 'Ton texte, avec les corrections de ' + prof : 'Ton texte') : libre ? 'Le texte de la scène' : 'Le texte ' + de(nomEl(sc.pec))}</h2>`;
    const lecture = arret && !nePlus ? 'Tu ne peux plus écrire pour l’instant' : !mien && !libre ? 'Tu peux lire, pas écrire'
      : sc.etat === 'valider' ? `Tu ne peux plus écrire : ${prof} relit` : 'Tu ne peux plus écrire : c’est validé';
    // Après une nouvelle remise, le dernier retour reste lisible, replié (F07.3)
    const ancien = sc.etat === 'valider' ? [...t.remises].reverse().find(x => x.retour) : null;
    const cote = sc.etat === 'reprendre'
      ? ficheRetour(sc, t) + ficheConsigne(sc, t, { replie: true, mien: mien || libre })
      : ficheConsigne(sc, t, { mien: mien || libre }) + (ancien ? ficheRetour(sc, t, { remise: ancien, replie: true }) : '') + (sc.papier && sc.pec !== 'prof' && peutEcrire ? `<p class="cote-aide">${ic('i-papier')}Tu as préparé ce texte sur papier ? Recopie-le dans la copie.</p>` : '');
    const resume = c.resume ? `<details class="carnet-fiche carnet-fiche--pli carnet-fiche--neutre"><summary><header>${ic('i-livre')}<h2>Le chapitre en quelques mots</h2></header></summary><div class="carnet-fiche__corps"><p>${esc(c.resume)}</p></div></details>` : '';
    return { alertes: alertes.join(''), principal: copie(sc, c, { texte: t.texte, peutEcrire, entete, pied, profil: monProfil, lecture }), cote: cote + resume };
  }

  /* ——— Relecture et correction côté adulte ————————————————————— */
  const jourRemise = r => r.date.split(',')[0].replace(/^\S+ /, '');
  function vueAdulte(sc, c, t) {
    const alertes = [];
    if (ui.decision === 'suspendue') alertes.push(`<div class="note note--echec" role="alert">${ic('i-horloge')}<p><b>Validation suspendue : le texte a changé.</b> Alice a retiré la remise à 14 h 12 et modifié le texte. Relisez-le avant de choisir l’état.</p></div>`);
    // Échec et conflit : dits au-dessus de la copie, à la place de la validation suspendue, et non dans le seul pied (F08.1)
    if (st.sauv === 'echec') alertes.push(`<div class="note note--echec" role="alert">${ic('i-horloge')}<div><p><b>Vos dernières corrections ne sont pas encore enregistrées.</b> Nouvel essai dans 10 s : gardez cette page ouverte.</p><div class="note__actions"><button class="btn btn--petit" data-act="toast" data-msg="Nouvel essai d’enregistrement (simulation).">Réessayer maintenant</button></div></div></div>`);
    if (ui.decision === 'suspendue-ga') alertes.push(`<div class="note note--echec" role="alert">${ic('i-horloge')}<p><b>Validation suspendue : le texte a changé</b> pendant que vous le corrigiez. Relisez-le avant de choisir l’état.</p></div>`);
    // Conflit (F08.1, 7 octobre 2026) : les corrections refusées sont gardées à part, dans leur onglet ; l'adulte n'est pas arrêté.
    // Un texte gardé à part se dit au-dessus de la copie, d'où qu'on vienne, avec un lien vers son onglet.
    if (ga.viser) { if (gardes(sc.ref).some(g => g.id === ga.viser)) ui.onglet = ga.viser; ga.viser = null; }
    const gs = perso() ? gardes(sc.ref).filter(g => !estEleve(g.qui)) : gardes(sc.ref);
    const gVue = gs.find(g => g.id === ui.onglet) || null;
    if (/^g\d/.test(ui.onglet) && !gVue) ui.onglet = 'courant';
    alertes.push(...notesGa(sc, gs, gVue));
    const remiseVue = ui.onglet !== 'courant' && !gVue ? t.remises.find(x => 'r' + x.n === ui.onglet) : null;
    const texte = remiseVue ? (remiseVue.texte || t.texte) : t.texte;
    const aRemises = !perso() && t.remises.length;
    const entete = aRemises || gs.length ? `<div class="copie__onglets" role="tablist" aria-label="Versions du texte">
        <button role="tab" data-act="onglet-texte" data-v="courant" aria-selected="${ui.onglet === 'courant'}">Texte de la scène</button>
        ${aRemises ? t.remises.map(x => `<button role="tab" data-act="onglet-texte" data-v="r${x.n}" aria-selected="${ui.onglet === 'r' + x.n}">Remis le ${jourRemise(x)}</button>`).join('') : ''}
        ${gs.map(g => `<button role="tab" class="ga-onglet" data-act="onglet-texte" data-v="${g.id}" aria-selected="${ui.onglet === g.id}">${ic('i-apart')}<span class="ga-onglet__t"><b>${nomGa(g)}</b><span class="vh">, </span><small>${gardeGa(g)}</small></span></button>`).join('')}</div>${info('suivi-info', 'Que montrent ces onglets ?', `${perso() ? 'Vous écrivez dans' : 'Vous corrigez'} le texte de la scène.${aRemises ? ' Ce que l’élève a remis reste conservé tel quel, dans son onglet.' : ''}${gs.length ? ' Un texte gardé à part attend votre décision dans le sien.' : ''}`)}` : `<h2 class="copie__titre">Texte de la scène</h2>`;
    const pied = remiseVue ? '' : gVue ? piedGa(sc, gVue) : etatSauvegarde();
    const lu = remiseVue || gVue;
    const principal = `${ui.ia === 'correction' && !lu ? propositionCorrection(sc) : ''}${copie(sc, c, { texte, peutEcrire: !lu, entete, pied, etatFige: gVue ? etatGa(sc.ref, gVue) : null, icone: gVue ? 'i-apart' : null,
      source: remiseVue ? `Remis par ${nomEl(remiseVue.par)} · ${remiseVue.date} · conservé tel quel` : gVue ? `En lecture · ${telQue(gVue)}` : '' })}`;
    return { alertes: alertes.join(''), principal, cote: ficheDecision(sc, t, remiseVue, gVue) + (sc.etat === 'reprendre' ? ficheRetour(sc, t) : '') + ficheConsigne(sc, t, { modifiable: true }) + ficheAide(t) + ficheHistorique(sc, t) };
  }

  /* Fiche de décision (filet canard) : l'étape suivante seulement. Tout autre état se choisit sur le tampon de l'en-tête. */
  function ficheDecision(sc, t, remiseVue, gVue) {
    const r = t.remises[t.remises.length - 1]; const seul = sansEleve(sc); const qui = sc.pec && sc.pec !== 'prof' ? nomEl(sc.pec) : null;
    const pourLivre = seul || ['valide', 'prete'].includes(sc.etat);
    const prete = `<button class="btn btn--primaire btn--large" data-act="etat-poser" data-ref="${sc.ref}" data-e="prete">${ic('i-livre')}Prête pour le livre</button>`;
    let corps;
    if (st.sauv === 'echec') corps = `<p>${ic('i-horloge')}Vos corrections ne sont pas enregistrées. L’état se choisira ensuite.</p>`;
    // L'onglet d'un texte gardé à part ne décide pas de l'état : comme celui d'une remise, il ramène au texte de la scène
    else if (gVue) corps = `<p>Vous lisez ${gVue.qui === 'ancien' ? 'l’ancien texte de la scène' : gVue.qui === 'prof' ? (perso() ? 'votre texte' : 'vos corrections') : `le texte ${de(nomEl(gVue.qui))}`}, gardé${gVue.qui === 'prof' && !perso() ? 'es' : ''} à part ${gVue.jour}. Pour ${perso() ? 'choisir' : 'décider de'} l’état, revenez au texte de la scène.</p>
        <button class="btn btn--large" data-act="onglet-texte" data-v="courant">${ic('i-fleche-g')}Texte de la scène</button>`;
    else if (ui.rappel === sc.ref) corps = `<p class="decision__rappel" role="alert">${ic('i-alerte')}<span><b>${defauts(sc, sc.vide || !t.texte.length).join(' ')}</b> La déclarer prête quand même ?</span></p>
        <button class="btn btn--large" data-act="etat-poser" data-ref="${sc.ref}" data-e="prete" data-v="oui">Déclarer prête</button><button class="btn btn--discret btn--large" data-act="rappel-non">Pas maintenant</button>`;
    else if (ui.reprise) corps = `<label for="remarque" class="decision__label">Remarque${qui ? ` pour ${qui}` : ''} <span>facultative · lisible par les élèves du chapitre</span></label>
        <textarea id="remarque" rows="5">${sc.ref === 'S016' && sc.etat === 'valider' ? 'Ajoute ce que Lou voit à la lueur de la lanterne avant d’entendre la voix. J’ai corrigé « secours » et l’accord de « brillaient ».' : ''}</textarea>
        <p class="decision__aide">Pour citer un passage, sélectionnez-le puis <button class="lien" data-act="toast" data-msg="Le passage sélectionné est ajouté entre guillemets à la remarque.">citez la sélection</button>.</p>
        <button class="btn btn--primaire btn--large" data-act="reprise-envoyer" data-ref="${sc.ref}">${ic('i-retour')}Demander la reprise</button><button class="btn btn--discret btn--large" data-act="reprise-annuler">Annuler</button>`;
    else if (remiseVue) corps = `<p>Vous lisez le texte remis le ${jourRemise(remiseVue)}. Pour décider, revenez au texte de la scène.</p>
        <button class="btn btn--large" data-act="onglet-texte" data-v="courant">${ic('i-fleche-g')}Texte de la scène</button>`;
    else if (sc.etat === 'prete') corps = `<p class="decision__fait">${ic('i-livre')}Prête pour le livre.</p><p>Vos retouches gardent cet état.</p>`;
    else if (seul) corps = `<p>${sc.etat === 'valide' ? 'Le texte est fini. Quand l’image et les choix vous conviennent aussi :' : 'Quand le texte, l’image et les choix vous conviennent :'}</p>${prete}`;
    else if (sc.etat === 'valider') corps = `<p>${r ? `<b>${nomEl(r.par)}</b> a remis ce texte ${r.date.replace(/^\S+ /, 'le ').split(',')[0]}.` : 'Cette scène attend votre relecture.'} Vous pouvez le corriger vous-même.</p>
        <button class="btn btn--primaire btn--large" data-act="etat-poser" data-ref="${sc.ref}" data-e="valide">${ic('i-coche')}Valider le travail élève</button>
        <button class="btn btn--large" data-act="etat-poser" data-ref="${sc.ref}" data-e="reprendre">${ic('i-retour')}Demander une reprise…</button>
        <p class="decision__aide">Validé : l’élève a fini. Il vous restera à finir la scène pour le livre.</p>`;
    else if (sc.etat === 'reprendre') corps = `<p>${ic('i-horloge')}En attente d’une nouvelle remise ${qui ? de(qui) : 'des élèves'}.</p>`;
    else if (sc.etat === 'valide') corps = `<p>Validé : ${qui || 'l’élève'} a fini. Quand le texte, l’image et les choix vous conviennent :</p>${prete}`;
    else corps = `<p>${sc.vide || !t.texte.length ? 'Le texte est vide.' : `${qui || 'L’élève'} n’a pas encore remis ce texte.`} Vous pouvez l’écrire ou le corriger vous-même.</p>`;
    // Juste après une décision sur une scène à valider : la suivante, sans repasser par la liste (F06.5)
    if (ui.decide === sc.ref && !duLivre() && st.sauv !== 'echec' && !gVue && !ui.reprise && ui.rappel !== sc.ref) { const s = suivanteAValider(sc.ref);
      corps += s ? `<a class="btn btn--large decision__suite" href="#/scene/${s.ref}">Suivante à valider : ${s.ref}${ic('i-fleche')}</a>` : `<p class="decision__aide">Plus de scène à valider${A.retourSuivi ? ' dans cette liste' : ''}.</p>`; }
    return `<section class="carnet-fiche carnet-fiche--decision"><header>${ic(pourLivre ? 'i-livre' : 'i-oeil')}<h2>${pourLivre ? 'Pour le livre' : 'Votre relecture'}</h2></header><div class="carnet-fiche__corps decision">${corps}</div></section>`;
  }
  // La scène « À valider » qui suit : dans la liste du Suivi quand on en vient, avec ses filtres de chapitre et d'élève ; sinon dans l'ordre du projet
  function suivanteAValider(ref) {
    const liste = A.retourSuivi ? scenesHorsEtat() : toutesScenes(); const refs = liste.map(s => s.ref); const i = refs.indexOf(ref);
    const l = liste.filter(s => s.etat === 'valider' && s.ref !== ref);
    return l.find(s => refs.indexOf(s.ref) > i) || l[0] || null;
  }
  function ficheAide(t) {
    return `<details class="carnet-fiche carnet-fiche--pli carnet-fiche--neutre" ${ui.ia === 'correction' ? 'open' : ''}><summary><header>${ic('i-etincelle')}<h2>Aide à la correction</h2><span class="fiche-tete__fin">facultative</span></header></summary><div class="carnet-fiche__corps">
      <div class="ia-actions" role="radiogroup" aria-label="Type d’aide">
        ${[['erreurs', 'Corriger les erreurs'], ['clarifier', 'Clarifier la formulation'], ['ameliorer', 'Suggérer des améliorations']].map(([v, l]) => `<label><input type="radio" name="ia-action" value="${v}" data-act="ia-action" ${(ui.iaAction || 'erreurs') === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </div>
      <button class="btn btn--petit" data-act="ia-corriger" ${t.texte.length ? '' : 'disabled'}>${ic('i-etincelle')}Proposer</button>
      <p class="cote-note">La proposition s’affiche au-dessus du texte ; rien n’est appliqué sans vous.</p></div></details>`;
  }
  // L'historique des remises : seulement quand il y en a ; qui s'en occupe se lit dans l'en-tête
  function ficheHistorique(sc, t) {
    if (perso() || !t.remises.length) return '';
    return `<details class="carnet-fiche carnet-fiche--pli carnet-fiche--neutre"><summary><header>${ic('i-papier')}<h2>Remises</h2><span class="fiche-tete__fin">${t.remises.length}</span></header></summary><div class="carnet-fiche__corps">
      <ol class="historique">${t.remises.slice().reverse().map(r => `<li><p><b>Remis le ${jourRemise(r)}</b> · ${nomEl(r.par)}</p><p class="historique__date">${r.date}</p>${r.retour ? `<p class="historique__retour">${ic('i-retour')}${r.retour.texte ? esc(r.retour.texte.slice(0, 80)) + '…' : 'Reprise demandée, sans remarque.'}</p>` : ''}</li>`).join('')}</ol></div></details>`;
  }

  const CORR = {
    S016: [['secour ', 'secours '], ['brillait', 'brillaient']],
    S017: [['Elle regarda Lou longtemps.', 'Elle regarda Lou longtemps.']]
  };
  function propositionConsigne() {
    return `<div class="proposition" role="region" aria-label="Proposition de consigne">
      <p class="proposition__tete">${ic('i-etincelle')}À partir de votre indication « le passeur apparaît sur le pont »</p>
      <p><b>Consigne :</b> Sur le pont de brume, une silhouette apparaît : c’est le passeur. Décris-le et raconte ce qu’il dit à Lou.</p>
      <ul><li>Son apparence : habits, lanterne, visage</li><li>Sa voix et ses premiers mots</li><li>Ce que Lou ressent en le voyant</li></ul>
      <div class="proposition__actions"><button class="btn btn--primaire btn--petit" data-act="toast" data-msg="Consigne appliquée : elle apparaît aux élèves et sur les fiches.">Appliquer</button><button class="btn btn--petit" data-act="toast" data-msg="Vous pouvez retoucher la consigne et les points avant de les retenir.">Retoucher</button><button class="btn btn--discret btn--petit" data-act="ia-fermer">Rejeter</button></div></div>`;
  }
  function propositionCorrection(sc) {
    const action = ui.iaAction || 'erreurs';
    const t = contenu(sc).texte.join('\n');
    let diff = esc(t);
    if (action === 'erreurs') (CORR[sc.ref] || []).forEach(([a, b]) => { if (a !== b) diff = diff.replace(esc(a), `<del>${esc(a.trim())}</del> <ins>${esc(b.trim())}</ins> `); });
    const intro = { erreurs: 'Corriger les erreurs : orthographe, accords, conjugaison, ponctuation. Les idées et la formulation sont conservées.', clarifier: 'Clarifier la formulation : aucune phrase ne pose de difficulté de compréhension ; pas de reformulation proposée.', ameliorer: 'Pistes pour la reprise, sans réécrire le texte :' }[action];
    const contenuProp = action === 'ameliorer'
      ? `<ul><li>Faire entendre la voix mystérieuse avant de la montrer.</li><li>Préciser ce que Lou voit à la lueur de la lanterne.</li><li>Rendre le passage vers les deux choix plus net.</li></ul>`
      : action === 'clarifier' ? '' : `<div class="proposition__texte">${diff.split('\n').map(p => `<p>${p}</p>`).join('')}</div>`;
    return `<div class="proposition" role="region" aria-label="Proposition de l’aide IA">
      <p class="proposition__tete">${ic('i-etincelle')}${intro}</p>${contenuProp}
      <p class="proposition__note">Rien n’est modifié tant que vous n’appliquez pas. Les choix et leurs destinations ne sont jamais touchés.</p>
      <div class="proposition__actions">${action === 'erreurs' ? '<button class="btn btn--primaire btn--petit" data-act="ia-appliquer">Appliquer au texte courant</button><button class="btn btn--petit" data-act="toast" data-msg="Retouchez la proposition avant de l’appliquer (simulation).">Retoucher</button>' : ''}<button class="btn btn--discret btn--petit" data-act="ia-fermer">${action === 'erreurs' ? 'Rejeter' : 'Fermer'}</button></div></div>`;
  }

  /* ——— Actions de la scène ———————————————————————————————————— */
  Object.assign(A.actions, {
    // Prendre une scène, la rendre, revenir en arrière : la note reste sur place avec « Annuler » (F06.3)
    'reprendre-pec': el => { const sc = D.scenes[el.dataset.ref]; ui.pecNote = { ref: sc.ref, type: 'pris', avant: sc.pec }; sc.pec = moi(); ui.retourVu[sc.ref] = true; rendre(); },  // le retour, lu à côté du texte, n'est pas remontré en grand
    'pec-lacher': el => { const sc = D.scenes[el.dataset.ref]; ui.pecNote = { ref: sc.ref, type: 'lache', avant: sc.pec }; sc.pec = null; rendre(); },
    'pec-annuler': () => { const n = ui.pecNote; if (n) D.scenes[n.ref].pec = n.avant || null; ui.pecNote = null; rendre(); },
    'retour-lu': el => { ui.retourVu[el.dataset.ref] = true; if (A.editeur) A.editeur.x.ed.focus = '.copie__texte .run[contenteditable="true"] p:last-child'; rendre(); },
    retirer: el => { const sc = D.scenes[el.dataset.ref]; const mien = !sc.pec || sc.pec === moi(); sc.etat = 'cours'; ui.envoi = null; rendre(); toast(mien ? 'Tu peux de nouveau écrire.' : 'Ce texte peut de nouveau être modifié.'); },
    soumettre: el => {
      const sc = D.scenes[el.dataset.ref]; ui.envoi = 'attente'; rendre();
      setTimeout(() => {
        if (st.sauv !== 'ok') { ui.envoi = st.sauv; rendre(); return; }
        const t = contenu(sc); t.remises.push({ n: t.remises.length + 1, date: MAINTENANT, par: moi() });
        const avant = sc.pec; sc.etat = 'valider'; sc.pec = moi(); ui.envoi = 'ok'; ui.pecNote = null; rendre();
        // La confirmation est en haut de la page : on y remonte
        if (eleve()) window.scrollTo(0, 0);
        if (avant && avant !== moi()) toast(`Tu t’occupes maintenant de cette scène, à la place de ${nomEl(avant)}.`);
      }, 900);
    },
    'voir-remise': () => { ui.remiseOuverte = !ui.remiseOuverte; rendre(); },
    'onglet-texte': el => { ui.onglet = el.dataset.v; rendre(); },
    'ia-corriger': () => { ui.ia = 'correction'; ui.onglet = 'courant'; rendre(); },
    'ia-consigne': () => { ui.ia = 'consigne'; rendre(); },
    'ia-fermer': () => { ui.ia = null; rendre(); },
    'ia-appliquer': () => { ui.ia = null; A.editeur.corriger(st.arg, CORR[st.arg] || []); rendre(); toast('Correction appliquée au texte courant. La remise de Bilal reste consultable telle quelle ; la scène n’est pas validée pour autant.'); },
    'ia-action': el => { ui.iaAction = el.value; if (ui.ia === 'correction') rendre(); },
    'reprise-annuler': () => { ui.reprise = false; if (A.livre) A.livre.ui.repriseTiroir = null; rendre(); },
    'reprise-envoyer': el => {
      const ref = el.dataset.ref; const sc = D.scenes[ref]; const t = contenu(sc); const r = t.remises[t.remises.length - 1];
      const texte = $('#remarque').value.trim(); const retour = { date: MAINTENANT, texte, cite: null };
      if (r) r.retour = retour; else t.retourSeul = retour;
      poser(ref, 'reprendre'); if (A.livre) A.livre.ui.repriseTiroir = null; rendre();
      const qui = sc.pec && sc.pec !== 'prof' ? nomEl(sc.pec) : null;
      toast(`Reprise demandée${qui ? ` : ${qui} la retrouvera dans son chapitre` : ''}.${texte ? ' Les élèves du chapitre peuvent lire la remarque.' : ''}`);
    },
    // Choisir l'état : depuis le tampon de l'en-tête, depuis la fiche (l'étape suivante) ou depuis la scène à côté de l'aperçu
    'etat-poser': el => {
      const ref = el.dataset.ref; const e = el.dataset.e; const sc = D.scenes[ref]; const tiroir = el.dataset.ctx === 'tiroir';
      const cur = etatCourant(ref);
      // Le second clic d'un double-clic ne doit pas enchaîner deux décisions : « Prête » prend la place de « Valider »
      if (el.closest('.decision') && Date.now() - (ui.pose || 0) < 700) return;
      if (e === cur && !(ui.rappel === ref)) { rendre(); return; }
      if (st.sauv === 'echec') { rendre(); toast('Vos corrections ne sont pas encore enregistrées : l’état changera ensuite.'); return; }
      // Après un conflit de l'adulte, la page montre un texte qu'il n'a pas relu : « Validé » et « Prête » le lui demandent d'abord (F08-AC21)
      if (['valide', 'prete'].includes(e) && ga.relire[ref] && !tiroir) { ga.relire[ref] = false; ui.rappel = null; ui.onglet = 'courant'; ui.decision = 'suspendue-ga'; rendre(); window.scrollTo(0, 0); return; }
      if (e === 'reprendre') { ui.rappel = null; if (tiroir) A.livre.ui.repriseTiroir = ref; else { ui.reprise = true; ui.onglet = 'courant'; } rendre(); setTimeout(() => $('#remarque')?.focus(), 50); return; }
      if (['valide', 'prete'].includes(e) && st.concurrent === 'oui' && cur === 'valider') { poser(ref, 'cours'); ui.decision = 'suspendue'; rendre(); return; }
      if (e === 'prete' && el.dataset.v !== 'oui' && !tiroir) { const M = A.livre && duLivre() ? A.livre.modele()[ref] : null; if (defauts(sc, M ? M.vide : sc.vide || !contenu(sc).texte.length).length) { ui.rappel = ref; ui.reprise = false; rendre(); return; } }
      poser(ref, e); rendre();
      const eleves = sansEleve(sc) ? '' : { cours: ' Les élèves peuvent y écrire.', valider: ' Les élèves ne peuvent plus y écrire.' }[e] || '';
      toast({ cours: `${ref} est de nouveau en cours.${eleves}`, valider: `${ref} est à valider.${eleves}`, valide: `${ref} est validée. Pour changer d’état : le tampon, en haut.`, prete: `${ref} est prête pour le livre. Pour changer d’état : le tampon, en haut.` }[e]);
    },
    'rappel-non': () => { ui.rappel = null; rendre(); },
    // Texte gardé à part (F08.1) : les deux gestes de l'adulte, l'annulation sur place, et les liens qui ouvrent la scène sur l'onglet
    'ga-retirer': el => { retirerGa(el.dataset.ref, el.dataset.id); rendre(); window.scrollTo(0, 0); },
    'ga-annuler': () => { const f = ga.fait; if (!f || f.type !== 'retire') return; const l = (GA[f.ref] = GA[f.ref] || []); l.splice(Math.min(f.i, l.length), 0, f.g); ui.onglet = f.g.id; ga.fait = null; rendre(); },
    'ga-echanger': el => { echangerGa(el.dataset.ref, el.dataset.id); rendre(); window.scrollTo(0, 0); },
    'ga-ouvrir': el => { A.retourSuivi = { href: '#/suivi', y: window.scrollY }; ga.viser = el.dataset.id; },
    'ga-vers-scene': (el, ev) => { A.actions['livre-vers-scene'](el, ev); ga.viser = el.dataset.id; },
    'qui-poser': el => {
      const ref = el.dataset.ref; const sc = D.scenes[ref]; const id = el.dataset.id || null;
      if ((sc.pec || null) === id) { rendre(); return; }
      sc.pec = id; rendre();
      toast(id === 'prof' ? `Vous vous occupez de ${ref} : les élèves peuvent la lire, sans y écrire.` : id ? `${nomEl(id)} s’occupe de ${ref}.` : `Plus personne ne s’occupe de ${ref}. Son texte est conservé.`);
    }
  });
  // L'état posé par l'enseignante : dans le projet, ou dans le moment que le livre simule quand on vient du livre
  function poser(ref, e) {
    const sc = D.scenes[ref]; const avant = etatCourant(ref);
    ui.decide = avant === 'valider' && ['valide', 'prete', 'reprendre'].includes(e) ? ref : null;
    if (duLivre() && A.livre) { const u = A.livre.ui; u.etatsSim = u.etatsSim || {}; u.etatsSim[ref] = e; u.pretesMain.delete(ref); if (st.moment === 'sept') sc.etat = e; }
    else sc.etat = e;
    ui.decision = null; ui.reprise = false; ui.rappel = null; ui.pose = Date.now();
  }
  A.poserEtat = poser;
  // Un menu de l'en-tête se referme quand on clique ailleurs, quand on en ouvre un autre ou par Échap
  document.addEventListener('click', ev => { document.querySelectorAll('details.menu-scene[open]').forEach(d => { if (!d.contains(ev.target)) d.open = false; }); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') document.querySelectorAll('details.menu-scene[open]').forEach(d => { d.open = false; d.querySelector('summary').focus(); }); });
  A.changes['ia-action'] = el => { ui.iaAction = el.value; if (ui.ia === 'correction') rendre(); };
  let tSauv;
  A.saisies = Object.assign(A.saisies || {}, { texte: () => {
    // Scène au texte vide, vue par l'élève : dès la première phrase, « Remettre » s'active et le tampon quitte « Texte vide »
    const sc = eleve() && st.page === 'scene' ? D.scenes[st.arg] : null;
    if (sc && (sc.vide || ui.etaitVide === sc.ref)) {
      ui.etaitVide = sc.ref; sc.vide = ![...document.querySelectorAll('.copie__texte .run p')].some(p => p.textContent.trim());
      const b = $('[data-act="soumettre"]'); if (b && ui.envoi !== 'attente') b.disabled = sc.vide;
      const t = $('.scene-tete__etat .tampon'); if (t) t.outerHTML = A.tamponSc(sc);
      const h = $('#sauv'); if (h) h.classList.toggle('sauv--avant', sc.vide);
      if (sc.vide) { clearTimeout(tSauv); if (h) h.innerHTML = `${ic('i-crayon')}<span>${AVANT}</span>`; return; }
    }
    const s = $('#sauv'); if (!s || st.sauv !== 'ok') return; s.innerHTML = `${ic('i-horloge')}<span>Enregistrement…</span>`; clearTimeout(tSauv); tSauv = setTimeout(() => { s.innerHTML = `${ic('i-coche')}<span>Enregistré à 14 h 06</span>`; }, 900); } });

  /* ——— En-tête de projet, commun à Préparation, Parties et chapitres, Suivi ——— */
  function enteteProjet(actif) {
    const lien = (id, href, lib) => `<a href="${href}" ${actif === id ? 'aria-current="page"' : ''}>${lib}</a>`;
    return `<section class="histoire"><div class="histoire__vignette">${image(H.image, null, H.titre)}</div>
      <div class="histoire__infos"><h1>${H.titre}</h1><p class="histoire__meta">${perso() ? 'Projet personnel' : A.classes?.metaProjet() || `Classe ${H.classe} · ${H.effectif} élèves`} · ${choix() ? 'Récit à choix' : 'Récit classique'}</p></div>
      <nav class="onglets" aria-label="Sections du projet">${lien('prep', '#/preparation', 'Préparation')}${lien('plan', '#/plan', 'Parties et chapitres')}${perso() ? '' : lien('suivi', '#/suivi', 'Suivi')}${lien('livre', '#/livre', 'Livre')}</nav></section>`;
  }
  A.enteteProjet = enteteProjet;

  /* ——— Suivi ——————————————————————————————————————————————————— */
  // Le suivi est celui d'un projet (F06.5, révisé le 4 octobre 2026) : il n'y a plus de suivi de tous les projets.
  // État affiché : une scène « En cours d'écriture » sans texte porte « Texte vide ». Les états de F07.1 ne changent pas.
  const etatVu = s => (s.etat === 'cours' && s.vide ? 'vide' : s.etat);
  const ETATS_VUS = { valider: 'À valider', reprendre: 'À reprendre', cours: 'En cours', vide: 'Texte vide', valide: 'Validé', prete: 'Prête' };
  const ETATS_MINI = { valider: 'à valider', reprendre: 'à reprendre', cours: 'en cours', vide: 'texte vide', valide: 'validé', prete: 'prête' };
  const ICONES_VUES = { valider: 'i-sablier', reprendre: 'i-retour', cours: 'i-crayon', vide: 'i-vide', valide: 'i-coche', prete: 'i-livre' };
  const tamponVide = `<span class="tampon" data-e="vide">${ic('i-vide')}Texte vide</span>`;
  const tamponVu = s => (etatVu(s) === 'vide' ? tamponVide : tampon(s.etat, true));
  const plur = n => (n > 1 ? 's' : '');
  const de = prenom => (/^[AEIOUYÉÈÊÎÔH]/i.test(prenom) ? `d’${prenom}` : `de ${prenom}`);
  const chapsDe = id => Object.values(D.chapitres).filter(c => attribue(c, id));
  const info = (act, sujet, msg) => `<button class="info" data-act="${act}" ${msg ? `data-msg="${esc(msg)}"` : ''} aria-expanded="false" aria-label="${esc(sujet)}">${ic('i-info')}</button>`;
  // ?veille=1 : la veille de la première séance, rien n'est écrit ni pris en charge
  // Les scènes réparties à l'impression des fiches (F07.4) gardent leur élève, même dans cette variante
  A.pecRepartis = {};
  const toutesScenes = () => Object.values(D.scenes).map(s => ({ ...s, ...(A.suiviVeille ? { etat: 'cours', vide: true, pec: A.pecRepartis[s.ref] || null } : {}), chapObj: D.chapitres[s.chapitre] }));
  // Tout sauf l'élève et l'état : sert aux nombres des deux sélections par élève
  function scenesBase() {
    let l = toutesScenes();
    // Filtre venu du temps « Relire » de la destination Livre : les scènes à finir, dans l'état que le livre leur compte (F11-AC78)
    // La liste se recalcule à chaque affichage : une scène déclarée prête ou exclue depuis sa page n'y figure plus au retour
    if (A.suiviLivre && A.livre) A.suiviLivre = A.livre.scenesAFinir();
    if (A.suiviLivre) l = l.filter(s => A.suiviLivre.includes(s.ref)).map(s => ({ ...s, ...((A.suiviEtats || {})[s.ref] || {}) }));
    if (ui.chapSuivi) l = l.filter(s => s.chapitre === ui.chapSuivi);
    return l;
  }
  // Tout sauf l'état : les nombres des filtres d'état suivent ainsi le chapitre et l'élève choisis
  function scenesHorsEtat() {
    const l = scenesBase(); const id = ui.eleveSuivi;
    if (!id) return l;
    return ui.modeEleve === 'pec' ? l.filter(s => s.pec === id) : l.filter(s => attribue(s.chapObj, id));
  }
  const scenesSuivi = () => { const f = A.suiviLivre || ui.filtreSuivi === 'tous' ? null : ui.filtreSuivi; return scenesHorsEtat().filter(s => !f || etatVu(s) === f); };
  const select = (act, lib, opts, val) => `<label class="champ"><span>${lib}</span><span class="champ__select"><select data-act="${act}">${opts.map(([v, l]) => `<option value="${v}" ${val === v ? 'selected' : ''}>${l}</option>`).join('')}</select>${ic('i-chevron-bas')}</span></label>`;
  // Filtres d'état : les mêmes tampons que dans le tableau ; celui qui est choisi est plein, celui qui ne compte rien est éteint
  function filtresEtat(hors, suite) {
    const n = k => hors.filter(s => etatVu(s) === k).length;
    // Sur téléphone, les tampons tiennent sur une seule rangée qui défile : « Toutes », « À valider » et « À reprendre » restent en vue
    return `<div class="filtres suivi-etats"><span class="suivi-etats__lib" aria-hidden="true">État</span><div class="suivi-etats__tampons" role="group" aria-label="Filtrer par état">
      <button class="tampon tampon--filtre" data-e="tous" data-act="suivi-filtre" data-v="tous" aria-pressed="${ui.filtreSuivi === 'tous'}">Toutes <b>${hors.length}</b></button>
      ${Object.entries(ETATS_VUS).map(([k, lib]) => `<button class="tampon tampon--filtre" data-e="${k}" data-act="suivi-filtre" data-v="${k}" aria-pressed="${ui.filtreSuivi === k}" ${n(k) || ui.filtreSuivi === k ? '' : 'disabled'}>${ic(ICONES_VUES[k])}${lib} <b>${n(k)}</b></button>`).join('')}</div>
      ${info('suivi-legende', 'Que veulent dire ces états ?')}${suite}</div>`;
  }
  // Un seul signal en tête du Suivi, et c'est un lien, pas un filtre : les élèves sans chapitre (F06-AC32).
  // Les scènes sans consigne ne sont plus signalées ici : la mention suit leur titre. « Parties et chapitres » ne les compte plus non plus (6 octobre 2026).
  // Seconde ligne, de la même forme (F08.1, 7 octobre 2026) : les scènes où un texte est gardé à part ; chacune s'ouvre sur l'onglet de ce texte.
  function signaux() {
    if (ui.charge === 'echec') return '';
    const n = Object.values(D.eleves).filter(e => !chapsDe(e.id).length).length;
    const sans = n ? `<p class="suivi-signaux">${ic('i-eleves')}<span>${n} élève${plur(n)} sans chapitre</span>${ui.suivi === 'eleves' ? '' : `<button class="lien" data-act="suivi-vue" data-v="eleves">Voir</button>`}</p>` : '';
    const sg = A.apart.toutes(); const nb = sg.reduce((a, [, l]) => a + l.length, 0);
    // Jusqu'à deux scènes, la référence et le titre ; au-delà, les références seules
    const part = nb ? `<p class="suivi-signaux suivi-signaux--ga">${ic('i-apart')}<span>${nb} texte${plur(nb)} gardé${plur(nb)} à part :</span><span class="suivi-signaux__scenes">${sg.map(([r, l]) => `<a class="lien" href="#/scene/${r}" data-act="ga-ouvrir" data-id="${l[0].id}"><span class="code">${r}</span>${sg.length > 2 ? '' : ` ${esc(D.scenes[r].titre)}`}${l.length > 1 && sg.length > 1 ? ` (${l.length})` : ''}</a>`).join('<span aria-hidden="true"> · </span>')}</span></p>` : '';
    return sans + part;
  }
  const remettre = () => Object.assign(ui, { suivi: 'scenes', filtreSuivi: 'tous', eleveSuivi: '', modeEleve: 'pec', chapSuivi: '' });
  // Écran d'aide du Suivi : le même que celui d'une étape du Livre. Montré à l'ouverture tant que « Ne plus afficher »
  // n'est pas cochée, rouvert par le bouton « Aide ». Peu de questions : ce qu'on fait ici, les états, qui s'occupe d'une scène, les fiches.
  const QUI = 'L’élève qui a pris la scène, ou qui a remis son texte. Les élèves d’un chapitre se répartissent ses scènes. « Pas encore prise » : elle attend un élève.';
  const aideSuivi = () => `<section class="aide-etape aide-suivi" aria-labelledby="aide-t">
      <h2 id="aide-t" tabindex="-1">Suivi</h2>
      <div class="aide-etape__q">
        <details open><summary>Que fait-on ici ?</summary><p>On voit où en est chaque scène, et on ouvre celles qui attendent une relecture.</p>
          <ul class="aide-etape__taches"><li>Relire les scènes « À valider »</li><li>Voir ce que fait chaque élève, dans la vue « Élèves »</li><li>Imprimer les fiches de rédaction</li></ul></details>
        <details><summary>Que veulent dire les états ?</summary>${legende()}</details>
        <details><summary>Qui s’occupe d’une scène ?</summary><p>${QUI}</p></details>
        <details><summary>Que sont les fiches de rédaction ?</summary><p>Une feuille par chapitre ou par élève : les scènes à écrire ou à reprendre, sous leur référence, avec leur consigne. Les élèves écrivent sur leur cahier, puis recopient. Une scène sans consigne n’est pas imprimée.</p></details>
      </div>
      <p class="aide-etape__cmd"><button class="btn btn--primaire btn--grand" data-act="suivi-commencer">${ui.suiviAideVue ? 'Fermer l’aide' : 'Commencer'}</button>
        <label class="aide-etape__plus"><input type="checkbox" data-act="suivi-aide-jamais" ${ui.suiviAideJamais ? 'checked' : ''}><span>Ne plus afficher</span></label></p></section>`;
  // Son signe est un point d'interrogation, celui du bouton « Aide » du Livre : les « i » ouvrent une bulle, « Aide » ouvre l'écran d'aide
  const boutonAide = `<button class="suivi-aide" data-act="suivi-aide" title="Que fait-on ici ?">${ic('i-aide')}Aide</button>`;
  function pageSuivi() {
    // Les filtres tiennent pendant la visite, aller-retour vers une scène ou vers les fiches compris ; une nouvelle entrée repart de « Toutes »
    if (!['suivi', 'fiches'].includes(ui.derniere) && !A.retourSuivi) { remettre(); ui.suiviDirect = false; }
    // « 5 scènes à valider · Voir », sur la carte du projet, ouvre le Suivi sur ces scènes, sans passer par l'écran d'aide (F06.5)
    if (A.suiviEntree) { remettre(); ui.filtreSuivi = A.suiviEntree; A.suiviEntree = null; ui.suiviDirect = true; }
    if (A.suiviLivre) ui.suivi = 'scenes';
    // À l'ouverture du Suivi : son écran d'aide, sauf quand on vient du Livre finir des scènes, de la carte du projet voir les scènes
    // à valider, ou que le suivi n'a pas pu être chargé
    if (!ui.suiviAideVue && !ui.suiviAideJamais && !A.suiviLivre && !ui.suiviDirect && ui.charge !== 'echec') ui.suiviAide = true;
    if (ui.suiviAide) return `<div class="page page--suivi">${enteteProjet('suivi')}${aideSuivi()}</div>`;
    // Le décompte suit la liste : une scène déclarée prête ou exclue depuis sa page n'est plus à finir au retour
    if (A.suiviLivre && A.livre) A.suiviLivre = A.livre.scenesAFinir();
    const nL = A.suiviLivre ? A.suiviLivre.length : 0;
    const e = ui.eleveSuivi; const base = scenesBase(); const hors = scenesHorsEtat();
    const mesChaps = e ? chapsDe(e) : []; const toutChap = mesChaps.length > 1 ? 'Tous ses chapitres' : 'Tout son chapitre';
    const segE = e ? `<div class="seg-mini" role="group" aria-label="Scènes de ${nomEl(e)}"><button data-act="suivi-mode" data-v="pec" aria-pressed="${ui.modeEleve === 'pec'}">Dont ${nomEl(e)} s’occupe <span>${base.filter(s => s.pec === e).length}</span></button><button data-act="suivi-mode" data-v="chapitre" aria-pressed="${ui.modeEleve === 'chapitre'}">${toutChap} <span>${base.filter(s => attribue(s.chapObj, e)).length}</span></button></div>${info('suivi-info', 'Quelle différence entre ces deux sélections ?', `« Dont ${nomEl(e)} s’occupe » : les scènes à son nom, à écrire ou à corriger. « ${toutChap} » : toutes les scènes ${mesChaps.length > 1 ? 'de ses chapitres' : 'de son chapitre'}, celles de ses camarades comprises.`)}` : '';
    // Fiches de rédaction : celles des scènes listées qui restent à écrire ou à reprendre
    const fiches = `<div class="suivi-fiches"><button class="btn" data-act="suivi-fiches">${ic('i-imprimer')}Imprimer les fiches de rédaction</button>${info('suivi-info', 'Que sont les fiches de rédaction ?', 'Une feuille par chapitre ou par élève : les scènes à écrire ou à reprendre, sous leur référence, avec leur consigne. Les élèves écrivent sur leur cahier, puis recopient. Une scène sans consigne n’est pas imprimée. Vous choisirez les scènes avant d’imprimer.')}</div>`;
    const outils = ui.suivi === 'scenes'
      ? `<div class="champs">
          ${select('suivi-chap', 'Chapitre', [['', 'Tous les chapitres']].concat(Object.values(D.chapitres).filter(c => c.scenes.length).map(c => [c.id, c.titre])), ui.chapSuivi || '')}
          ${select('suivi-eleve', 'Élève', [['', 'Tous les élèves']].concat(Object.values(D.eleves).map(x => [x.id, x.prenom])), e)}
          ${segE ? `<div class="champs__seg">${segE}</div>` : ''}
        </div>`
      : info('suivi-info', 'Que comptent ces nombres ?', '« Tout son chapitre » : les scènes que l’élève peut ouvrir, celles de ses camarades comprises. « S’en occupe » : celles à son nom, à écrire ou à corriger. Ces nombres ne mesurent pas ce que l’élève a écrit. Sans chapitre, le travail sur papier reste possible.');
    return `<div class="page page--suivi">${enteteProjet('suivi')}
      ${A.suiviLivre
        ? `<p class="alerte alerte--filtre">${ic('i-livre')}<span><b>${nL} scène${plur(nL)} à finir pour le livre.</b> Ouvrez une scène pour la finir et la déclarer prête, ou pour l’exclure du livre (menu ${ic('i-points')} de la scène).${info('suivi-info', 'Que veut dire « à finir » ?', 'Une scène est à finir tant que vous ne l’avez pas déclarée prête pour le livre, même si le travail de l’élève est validé.')}</span><a class="btn btn--petit" href="#/livre">Retour au Livre</a><button class="btn btn--petit" data-act="suivi-livre-fin">Tout afficher</button></p>`
        : signaux()}
      ${ui.charge === 'echec' ? `<p class="aucun" role="alert">Le suivi n’a pas pu être chargé. <button class="lien" data-act="suivi-recharger">Réessayer</button></p>` : `
      <div class="suivi-outils">
        ${A.suiviLivre ? '' : `<div class="bascule" role="tablist" aria-label="Vue du suivi"><button role="tab" data-act="suivi-vue" data-v="scenes" aria-selected="${ui.suivi === 'scenes'}">${ic('i-grille')}Scènes</button><button role="tab" data-act="suivi-vue" data-v="eleves" aria-selected="${ui.suivi === 'eleves'}">${ic('i-eleves')}Élèves</button></div>`}
        ${outils}
        ${boutonAide}
      </div>
      ${ui.suivi === 'scenes' && !A.suiviLivre ? filtresEtat(hors, fiches) : ''}
      ${ui.suivi === 'eleves' ? suiviEleves() : suiviScenes()}`}
    </div>`;
  }
  function aucunResultat() {
    const e = ui.eleveSuivi; const tout = `<button class="lien" data-act="suivi-reset">Tout afficher</button>`;
    if (e && !chapsDe(e).length) return `<p class="aucun">${nomEl(e)} n’a aucun chapitre. Le travail sur papier reste possible. <a class="lien" href="#/plan">Attribuer un chapitre</a> · ${tout}</p>`;
    const actifs = [];
    if (A.suiviLivre) actifs.push('scènes à finir');
    if (ui.chapSuivi) actifs.push(D.chapitres[ui.chapSuivi].titre);
    if (e) actifs.push(ui.modeEleve === 'pec' ? nomEl(e) : `tout le chapitre ${de(nomEl(e))}`);
    if (!A.suiviLivre && ui.filtreSuivi !== 'tous') actifs.push(ETATS_VUS[ui.filtreSuivi]);
    return `<p class="aucun">Aucune scène${actifs.length ? ` pour : ${actifs.join(' · ')}` : ''}. ${tout}</p>`;
  }
  function suiviScenes() {
    const l = scenesSuivi();
    if (!l.length) return aucunResultat();
    const groupes = new Map(); l.forEach(s => { if (!groupes.has(s.chapitre)) groupes.set(s.chapitre, []); groupes.get(s.chapitre).push(s); });
    const groupe = ([k, ss]) => {
      const c = D.chapitres[k]; const av = ss.filter(s => s.etat === 'valider').length; const rp = ss.filter(s => s.etat === 'reprendre').length; const fi = ss.filter(s => s.etat === 'valide').length; const pr = ss.filter(s => s.etat === 'prete').length; // la même ligne que sur la carte du chapitre : « validée » et « prête » comptées chacune (6 octobre 2026)
      const eleves = c.eleves.length
        ? `<span class="gommettes suivi-groupe__eleves" role="img" aria-label="Élèves du chapitre : ${c.eleves.map(([id]) => nomEl(id)).join(', ')}" title="${c.eleves.map(([id]) => nomEl(id)).join(', ')}">${c.eleves.map(([id]) => gommette(id, 'gommette--s')).join('')}</span>`
        : '<span class="suivi-groupe__eleves vide">Chapitre non attribué</span>';
      return `<details class="suivi-groupe" style="${varsCouleur(c)}" ${ui.replies.has(k) ? '' : 'open'} data-cle="${esc(k)}">
        <summary><span class="suivi-groupe__dos" aria-hidden="true"></span><span class="suivi-groupe__titre"><b>${c.titre}</b><span>${c.partie.titre}</span></span><span class="suivi-groupe__meta">${eleves}<span class="suivi-groupe__compte">${ss.length} scène${plur(ss.length)}${fi ? `<span class="suivi-groupe__plus"> · ${fi} validée${plur(fi)}</span>` : ''}${pr ? `<span class="suivi-groupe__plus"> · ${pr} prête${plur(pr)}</span>` : ''}${av ? ` · <b>${av} à valider</b>` : ''}${rp ? `<span class="suivi-groupe__plus"> · ${rp} à reprendre</span>` : ''}</span></span>${ic('i-chevron-bas', 'suivi-groupe__chevron')}</summary>
        <table class="table-suivi table-scenes"><colgroup><col><col><col><col><col></colgroup><thead><tr><th scope="col">Réf.</th><th scope="col">Scène</th><th scope="col">État</th><th scope="col">Qui s’en occupe</th><th scope="col">Action</th></tr></thead><tbody>
        ${ss.map(s => { const lib = s.etat === 'valider' ? 'Relire' : 'Ouvrir'; return `<tr><td class="code">${s.ref}</td><td class="table-suivi__titre"><a class="table-suivi__lien" href="#/scene/${s.ref}" data-act="suivi-ouvrir" tabindex="-1">${s.titre}</a>${!s.consigne && !A.suiviLivre ? '<span class="texte-vide">sans consigne</span>' : ''}</td><td>${tamponVu(s)}</td><td>${s.pec ? `<span class="pec">${gommette(s.pec, 'gommette--s')}${nomEl(s.pec)}</span>` : `<span class="vide">${c.eleves.length ? 'Pas encore prise' : 'Aucun élève'}</span>`}</td>
          <td><a class="btn btn--petit ${s.etat === 'valider' ? 'btn--primaire' : ''}" href="#/scene/${s.ref}" data-act="suivi-ouvrir" aria-label="${lib} ${s.ref}">${lib}</a></td></tr>`; }).join('')}
        </tbody></table></details>`;
    };
    return `<div class="suivi-colonnes"><span aria-hidden="true">Réf.</span><span aria-hidden="true">Scène</span><span aria-hidden="true">État</span><span><span aria-hidden="true">Qui s’en occupe</span>${info('suivi-info', 'Que veut dire « Qui s’en occupe » ?', QUI)}</span><span></span></div>
      <div class="suivi-liste">${[...groupes].map(groupe).join('')}</div>`;
  }
  function suiviEleves() {
    const scenes = toutesScenes();
    const lignes = Object.values(D.eleves).sort((a, b) => !!chapsDe(a.id).length - !!chapsDe(b.id).length).map(e => {
      const mesChaps = chapsDe(e.id);
      const acc = scenes.filter(s => attribue(s.chapObj, e.id)).length;
      const miennes = scenes.filter(s => s.pec === e.id);
      const modif = scenes.some(s => attribue(s.chapObj, e.id) && editable(s));
      const par = {}; miennes.forEach(s => { par[etatVu(s)] = (par[etatVu(s)] || 0) + 1; });
      let signal = '';
      if (!mesChaps.length) signal = `<span class="signal-ligne"><span class="signal">${ic('i-consigne')}Sans chapitre</span><a class="lien" href="#/plan">Attribuer un chapitre</a></span>`;
      else if (!modif) signal = `<span class="signal">${ic('i-consigne')}Aucune scène modifiable</span>`;
      return `<tr class="${mesChaps.length ? '' : 'ligne--alerte'}">
        <th scope="row"><span class="pec">${gommette(e.id, 'gommette--s')}<b>${e.prenom}</b></span></th>
        <td>${mesChaps.map(c => `<span class="chap-puce" style="${varsCouleur(c)}">${c.titre}</span>`).join('') || '<span class="vide">Aucun chapitre</span>'}</td>
        <td data-lib="Tout son chapitre">${acc ? `<button class="lien" data-act="suivi-voir" data-id="${e.id}" data-mode="chapitre">${acc} scène${plur(acc)}</button>` : '<span class="vide">—</span>'}</td>
        <td data-lib="S’en occupe">${miennes.length ? `<button class="lien" data-act="suivi-voir" data-id="${e.id}" data-mode="pec">${miennes.length} scène${plur(miennes.length)}</button>` : '<span class="vide">Aucune</span>'} ${Object.keys(ETATS_MINI).filter(k => par[k]).map(k => `<span class="mini-etat">${par[k]} ${ETATS_MINI[k]}</span>`).join(' ')}</td>
        <td>${signal}</td></tr>`;
    }).join('');
    return `<div class="table-defile"><table class="table-suivi table-eleves"><thead><tr><th scope="col">Élève</th><th scope="col">Chapitres</th><th scope="col">Tout son chapitre</th><th scope="col">S’en occupe</th><th scope="col">À régler</th></tr></thead><tbody>${lignes}</tbody></table></div>`;
  }
  // Bulle d'information : la même que celle du livre, ancrée à son icône, qui reste jusqu'à ce qu'on la ferme
  function bulle(el, html) {
    const ouverte = el.getAttribute('aria-expanded') === 'true';
    A.$$('.info[aria-expanded="true"]').forEach(x => x.setAttribute('aria-expanded', 'false'));
    let b = $('#info-bulle'); if (!b) { document.body.insertAdjacentHTML('beforeend', '<div class="info-bulle" id="info-bulle" role="note" aria-live="polite" hidden></div>'); b = $('#info-bulle'); }
    b.hidden = true; if (ouverte) return;
    b.innerHTML = `${html}<button class="info-bulle__fermer" data-act="livre-info-fermer" aria-label="Fermer l’explication">${ic('i-fermer')}</button>`;
    b.hidden = false; el.setAttribute('aria-expanded', 'true');
    const r = el.getBoundingClientRect(); const large = document.documentElement.clientWidth;
    b.style.left = `${Math.max(12, Math.min(r.left + window.scrollX - 18, large - b.offsetWidth - 12))}px`; b.style.top = `${r.bottom + window.scrollY + 8}px`;
  }
  const legende = () => `<ul class="legende-etats">
      <li>${tampon('valider', true)}<span>L’élève a remis son texte. <b>À vous</b> de le relire.</span></li>
      <li>${tampon('reprendre', true)}<span>Vous avez demandé une reprise. <b>À l’élève</b> de retravailler.</span></li>
      <li>${tampon('cours', true)}<span>L’élève écrit.</span></li>
      <li>${tamponVide}<span>Rien n’est saisi. Le travail peut être sur papier.</span></li>
      <li>${tampon('valide', true)}<span>Travail de l’élève terminé. <b>À vous</b> de finir la scène pour le livre.</span></li>
      <li>${tampon('prete', true)}<span>Bonne pour le livre.</span></li>
    </ul>`;
  const refocus = sel => { const x = $(sel); if (x) x.focus({ preventScroll: true }); };
  Object.assign(A.actions, {
    'suivi-filtre': el => { ui.filtreSuivi = el.dataset.v; rendre(); refocus('.suivi-etats [aria-pressed="true"]'); },
    'suivi-vue': el => { ui.suivi = el.dataset.v; rendre(); refocus('.page--suivi .bascule [aria-selected="true"]'); },
    'suivi-mode': el => { ui.modeEleve = el.dataset.v; rendre(); refocus('.seg-mini [aria-pressed="true"]'); },
    'suivi-voir': el => { ui.eleveSuivi = el.dataset.id; ui.modeEleve = el.dataset.mode; ui.suivi = 'scenes'; ui.filtreSuivi = 'tous'; ui.chapSuivi = ''; rendre(); refocus('select[data-act="suivi-eleve"]'); },
    'suivi-reset': () => { remettre(); rendre(); },
    // Retour d'un geste depuis la scène : on retrouve les filtres et l'endroit quittés
    'suivi-ouvrir': () => { A.retourSuivi = { href: '#/suivi', y: window.scrollY }; },
    // Les fiches s'ouvrent sur les scènes listées qui restent à écrire ou à reprendre et qui ont une consigne ; le choix se corrige avant d'imprimer.
    // Avec « Dont Alice s'occupe », on arrive sur la feuille d'Alice ; avec « Tout son chapitre », sur celle du chapitre.
    'suivi-fiches': () => { ui.fiches = new Set(scenesSuivi().filter(s => s.consigne && ['vide', 'cours', 'reprendre'].includes(etatVu(s))).map(s => s.ref)); ui.fichesRien = !ui.fiches.size; ui.ficheVue = 0; const lui = ui.eleveSuivi && ui.modeEleve === 'pec' ? ui.eleveSuivi : ''; ui.fichesMode = lui ? 'eleve' : 'chapitre'; ui.ficheEleve = lui; ui.fichesTout = false; ui.fichesConfirme = false; location.hash = '#/fiches'; },
    'suivi-legende': el => bulle(el, legende()),
    'suivi-info': el => bulle(el, `<p>${esc(el.dataset.msg)}</p>`),
    'suivi-recharger': () => { ui.charge = null; rendre(); },
    'projet-valider': () => { A.suiviEntree = 'valider'; },
    'suivi-aide': () => { ui.suiviAide = true; rendre(); $('#aide-t')?.focus({ preventScroll: true }); window.scrollTo(0, 0); },
    'suivi-commencer': () => { ui.suiviAideVue = true; ui.suiviAide = false; rendre(); window.scrollTo(0, 0); }
  });
  A.changes['suivi-aide-jamais'] = el => { ui.suiviAideJamais = el.checked; };
  Object.assign(A.changes, {
    'suivi-eleve': el => { ui.eleveSuivi = el.value; rendre(); refocus('select[data-act="suivi-eleve"]'); },
    'suivi-chap': el => { ui.chapSuivi = el.value; rendre(); refocus('select[data-act="suivi-chap"]'); }
  });
  document.addEventListener('toggle', ev => { const d = ev.target; if (d.matches && d.matches('.suivi-groupe')) { d.open ? ui.replies.delete(d.dataset.cle) : ui.replies.add(d.dataset.cle); } }, true);
  // Dernier onglet du projet utilisé : c'est là que mènent le nom du projet dans la barre du haut et « Continuer »
  const ONGLETS = { preparation: '#/preparation', plan: '#/plan', suivi: '#/suivi', livre: '#/livre' };
  A.apres = page => {
    ui.derniere = page;
    if (ONGLETS[page] && A.dernierOnglet !== ONGLETS[page]) { A.dernierOnglet = ONGLETS[page]; if (A.appbar) A.appbar(); }
    if (page !== 'scene') { const r = A.retourSuivi; A.retourSuivi = null; A.retourTravail = null; A.retourEssai = null; if (page === 'suivi' && r && r.y) setTimeout(() => window.scrollTo(0, r.y), 0); }
    if (page === 'projets') A.suiviLivre = null;
    // Rangée des états qui défile (téléphone) : le tampon choisi est amené en vue
    if (page === 'suivi') { const r = $('.suivi-etats__tampons'); const x = r && r.querySelector('[aria-pressed="true"]'); if (x && r.scrollWidth > r.clientWidth) r.scrollLeft = x.offsetLeft - (r.clientWidth - x.offsetWidth) / 2;
      // Le fondu ne s'affiche que du côté où il reste des tampons
      if (r) { const maj = () => { r.dataset.plus = (r.scrollLeft > 4 ? 'g' : '') + (r.scrollLeft + r.clientWidth < r.scrollWidth - 4 ? 'd' : ''); }; maj(); r.addEventListener('scroll', maj, { passive: true }); } }
  };
  // Adresses à drapeaux, pour les captures : ?sv=eleves (vue), ?se=valider (état), ?sch=lisiere (chapitre), ?sel=alice et ?sm=chapitre (élève),
  // ?fm=eleve, ?fe=alice et ?fs=1 (fiches : une feuille par élève, liste d'un élève, à la suite), ?fr=1 (scènes sans élève réparties, en proposition), &fc=1 (message de demande), ?replie=1, ?veille=1, ?charge=echec, ?legende=1 ; ?dusuivi=1 sur une scène (ouverte depuis le Suivi) ;
  // ?onglet=suivi|livre|preparation (dernier onglet utilisé, pour « Mes projets » et la barre du haut) ;
  // ?vu=1 (l'aide du Suivi a déjà été vue : sans lui, ni aucun autre drapeau, elle s'affiche à l'ouverture) ; ?aide=1 (l'aide rouverte)
  document.addEventListener('DOMContentLoaded', () => {
    const q = new URLSearchParams(location.hash.split('?')[1] || ''); const g = k => q.get(k);
    if (g('sv') === 'eleves') ui.suivi = 'eleves';
    if (ETATS_VUS[g('se')]) ui.filtreSuivi = g('se');
    if (D.chapitres[g('sch')]) ui.chapSuivi = g('sch');
    if (D.eleves[g('sel')]) ui.eleveSuivi = g('sel');
    if (g('sm') === 'chapitre') ui.modeEleve = 'chapitre';
    if (g('fm') === 'eleve') ui.fichesMode = 'eleve';
    if (g('fs')) ui.fichesSuite = true;
    if (D.eleves[g('fe')]) ui.ficheEleve = g('fe');
    if (g('fr')) ui.fichesTout = true;
    if (g('fc')) ui.fichesConfirme = true;
    if (g('replie')) Object.values(D.chapitres).forEach(c => ui.replies.add(c.id));
    if (g('veille')) A.suiviVeille = true;
    if (g('charge')) ui.charge = g('charge');
    if (g('dusuivi')) A.retourSuivi = { href: '#/suivi', y: 0 };
    // Pour les captures : ?dutravail=1 (élève venu de Mon travail), ?delessai=1 (scène ouverte depuis la lecture d'essai)
    if (g('dutravail')) A.retourTravail = true;
    if (g('delessai')) A.retourEssai = '#/lecture';
    // Page de scène, pour les captures : ?pose=valide|prete|valider|reprendre|cours (état choisi par l'enseignante), ?qui=prof|alice… (qui s'en occupe),
    // ?rappel=1 (rappel avant « prête »), ?reprise=1 (remarque de reprise ouverte), ?texte=r1 (onglet d'une remise) ; les menus s'ouvrent par ?menu=etat|qui|1
    const scq = location.hash.match(/^#\/scene\/(S\d+)/); const refq = scq && D.scenes[scq[1]] ? scq[1] : null;
    // Côté élève : ?retour=vu (le retour d'une scène à reprendre a déjà été lu ; ?etape= le suppose aussi),
    // et sur #/profils : ?profil=alice (prénom choisi), ?code=faux (code refusé), ?quitter=1 (confirmation de « Quitter la classe »)
    if (refq && (g('retour') === 'vu' || g('etape'))) { ui.retourVu[refq] = true; rendre(); }
    if (location.hash.startsWith('#/profils')) {
      if (D.eleves[g('profil')]) ui.profil = g('profil');
      if (g('code') === 'faux') { ui.codeFaux = true; ui.profil = ui.profil || 'alice'; }
      if (g('quitter')) ui.quitter = true;
      if (['profil', 'code', 'quitter'].some(k => g(k) !== null)) rendre();
    }
    if (refq) {
      if (g('qui') !== null && (g('qui') === '' || D.eleves[g('qui')])) D.scenes[refq].pec = g('qui') || null;
      if (D.etats[g('pose')]) { st.page = 'scene'; poser(refq, g('pose')); ui.pose = 0; }
      if (g('rappel')) ui.rappel = refq;
      if (g('reprise')) ui.reprise = true;
      if (g('texte')) ui.onglet = g('texte');
      if (['qui', 'pose', 'rappel', 'reprise', 'texte'].some(k => g(k) !== null)) rendre();
    }
    // Textes gardés à part (F08.1) : drapeaux décrits en tête du bloc « Textes gardés à part »
    ga.sauvAvant = st.sauv;
    if (g('ga') !== null || g('garemis') || g('gareseau') || g('gatous')) {
      const defaut = refq || (D.scenes[g('tiroir')] ? g('tiroir') : 'S015');
      if (g('garemis')) { const sc = D.scenes[defaut]; const t = contenu(sc); t.remises.push({ n: t.remises.length + 1, date: `${JOUR_GA}, 10 h 40`, par: 'alice' }); sc.etat = 'valider'; sc.pec = 'alice'; }
      (g('ga') || '').split(',').filter(Boolean).forEach(lot => {
        const [a, b] = lot.split(':'); const ref = b ? a : defaut; if (!D.scenes[ref]) return;
        (b || a).split('.').forEach(qui => {
          if (qui === 'prof') conflitAdulte(ref, ['conflit', 'suspendue'].includes(g('gafait')));
          else if (qui === 'ancien') { const x = garder(ref, 'bilal'); echangerGa(ref, x.id, false); }
          else if (estEleve(qui)) garder(ref, qui);
        });
      });
      if (g('gafait') === 'retire' && gardes(defaut)[0]) retirerGa(defaut, gardes(defaut)[0].id);
      if (g('gafait') === 'echange' && gardes(defaut)[0]) echangerGa(defaut, gardes(defaut)[0].id);
      const m = /^g(\d+)$/.exec(g('texte') || ''); ui.onglet = m && gardes(defaut)[m[1] - 1] ? gardes(defaut)[m[1] - 1].id : (m ? 'courant' : ui.onglet);
      if (g('gafait') === 'suspendue') { ga.relire[defaut] = false; ui.decision = 'suspendue-ga'; }
      if (g('gareseau')) ga.revenu = g('gareseau') === 'remise' ? 'remise' : true;
      // ?gatous=1 : tous les élèves ont un chapitre, pour voir la ligne des textes gardés à part seule en tête du Suivi
      if (g('gatous')) Object.values(D.eleves).filter(e => !chapsDe(e.id).length).forEach(e => D.chapitres.sommet?.eleves.push([e.id, 'propositions']));
      rendre();
    }
    if (ONGLETS[g('onglet')]) A.dernierOnglet = ONGLETS[g('onglet')];
    if ([...q.keys()].some(k => ['vu', 'sv', 'se', 'sch', 'sel', 'sm', 'replie', 'veille', 'charge', 'legende', 'afinir', 'aide', 'ga'].includes(k))) { ui.suiviAideVue = true; ui.suiviAide = false; }
    if (g('aide') && location.hash.startsWith('#/suivi')) ui.suiviAide = true;
    if ([...q.keys()].some(k => ['sv', 'se', 'sch', 'sel', 'sm', 'fm', 'fe', 'fs', 'fr', 'fc', 'replie', 'veille', 'charge', 'dusuivi', 'onglet', 'vu', 'aide', 'legende', 'afinir', 'ga'].includes(k))) rendre();
    if (g('legende')) setTimeout(() => { const b = $('[data-act="suivi-legende"]'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }, 80);
  });

  /* ——— Mes projets ————————————————————————————————————————————— */
  // Peu de projets, donc de grandes cartes : ce qui attend l'adulte, où en est le livre, et « Continuer » sur le dernier projet ouvert
  const AUTRE = { titre: 'La cabane du bout du monde', meta: 'Classe CM1-CM2 · Récit classique', image: { type: 'import', src: 'assets/img/ill-defaut-foret.jpg', alt: 'Forêt' }, aValider: 1, pretes: 9, total: 14 };
  function pageProjets() {
    if (A.classes?.projetsVides()) return A.classes.pageProjetsVide();
    const scenes = Object.values(D.scenes); const av = scenes.filter(s => s.etat === 'valider').length; const pretes = scenes.filter(s => etatDe(s) === 'prete').length;
    const carte = (titre, meta, img, n, p, t, bouton, voir) => { const pc = Math.round(100 * p / t); return `<span class="projet__image">${image(img, null, '')}</span>
        <span class="projet__texte"><b>${titre}</b><span>${meta}</span></span>
        <span class="projet__faits">${n ? `<span class="projet__attente">${ic('i-sablier')}<span>${n} scène${plur(n)} à valider</span>${voir}</span>` : ''}
          <span class="projet__livre"><span class="projet__barre" role="img" aria-label="${pc} % des scènes prêtes pour le livre"><span style="width:${pc}%"></span></span><span><b>${pc} %</b> des scènes prêtes pour le livre</span></span></span>
        <span class="projet__pied">${bouton}</span>`; };
    return `<div class="page page--projets">
      <header class="suivi-tete"><div><h1>Mes projets</h1></div><a class="btn" href="#/nouveau">${ic('i-plus')}Nouveau projet</a></header>
      <ul class="projets">
        <li><div class="projet">${carte(H.titre, `${perso() ? 'Projet personnel' : A.classes?.metaCarte() || `Classe ${H.classe.split(' · ')[0]}`} · ${choix() ? 'Récit à choix' : 'Récit classique'}`, H.image, perso() || A.classes?.sansClasse() ? 0 : av, pretes, scenes.length, `<a class="btn btn--primaire projet__ouvrir" href="${A.dernierOnglet || '#/plan'}">Continuer</a>`, `<a class="lien" href="#/suivi" data-act="projet-valider" aria-label="Voir les scènes à valider de ${esc(H.titre)}">Voir</a>`)}</div></li>
        ${perso() ? '' : `<li><div class="projet">${carte(AUTRE.titre, AUTRE.meta, AUTRE.image, AUTRE.aValider, AUTRE.pretes, AUTRE.total, '<button class="btn projet__ouvrir" data-act="toast" data-msg="Projet d’exemple : seul « Les passeurs de brume » est maquetté.">Ouvrir</button>', '<button class="lien" data-act="toast" data-msg="Projet d’exemple : seul « Les passeurs de brume » est maquetté.">Voir</button>')}</div></li>`}
      </ul>
    </div>`;
  }

  /* ——— Fiches de rédaction ————————————————————————————————————— */
  // F07.4, révisé le 4 octobre 2026 : une feuille compacte qui liste les scènes choisies, numérotées, avec consigne, image,
  // texte déjà écrit et demande de reprise ; une feuille par chapitre ou par élève, au choix. Une scène sans consigne n'y figure pas.
  const pourFiche = s => !!s.consigne;
  // La veille de la première séance (?veille=1), les fiches montrent le même projet que le Suivi : rien d'écrit, aucune scène prise
  const vuFiche = s => (A.suiviVeille ? { ...s, etat: 'cours', vide: true, pec: A.pecRepartis[s.ref] || null } : s);
  const scenesFiches = () => Object.values(D.scenes).map(vuFiche);
  function selectionFiches() {
    if (!ui.fiches) ui.fiches = new Set((st.arg ? st.arg.split(',') : ['S015', 'S017', 'S018', 'S024']).filter(r => D.scenes[r] && pourFiche(D.scenes[r])));
    return ui.fiches;
  }
  // Ce qu'on voit est ce qui s'imprime : avec un élève choisi, seules ses scènes cochées, sur sa feuille (F07.4, 4 octobre 2026)
  const choisiesFiches = sel => scenesFiches().filter(s => sel.has(s.ref) && (!ui.ficheEleve || s.pec === ui.ficheEleve));
  // Répartition des scènes sans élève (F07.4, 4 octobre 2026) : en « par élève », les scènes cochées que personne n'a prises peuvent
  // être réparties entre les élèves de leur chapitre. On sert d'abord celui qui a le moins de scènes à son nom, scènes finies
  // comprises, puis on les donne dans l'ordre du chapitre, pour garder des scènes voisines. Ce n'est qu'une proposition, montrée
  // dans la liste et dans l'aperçu : elle devient une prise en charge à l'impression, après confirmation, pas avant.
  function repartition(choisies) {
    const prop = {}; const toutes = scenesFiches();
    Object.values(D.chapitres).forEach(c => {
      const libres = choisies.filter(s => s.chapitre === c.id && !s.pec); const ids = c.eleves.map(([id]) => id);
      if (!libres.length || !ids.length) return;
      const n = {}; const part = {}; ids.forEach(id => { n[id] = toutes.filter(s => s.chapitre === c.id && s.pec === id).length; part[id] = 0; });
      libres.forEach(() => { const id = ids.reduce((a, b) => (n[b] + part[b] < n[a] + part[a] ? b : a)); part[id] += 1; });
      let i = 0; ids.forEach(id => { for (let k = 0; k < part[id]; k += 1) { prop[libres[i].ref] = id; i += 1; } });
    });
    return prop;
  }
  const propFiches = () => (ui.fichesMode === 'eleve' && ui.fichesTout && !ui.ficheEleve ? repartition(choisiesFiches(selectionFiches())) : {});
  const avecProp = (l, prop) => l.map(s => (prop[s.ref] ? { ...s, pec: prop[s.ref] } : s));
  // Les feuilles à imprimer : [titre de la feuille, chapitre qui donne sa couleur, scènes, prénom imprimé]
  function feuillesFiches(choisies) {
    const e = ui.ficheEleve;
    if (ui.fichesMode === 'eleve') return Object.values(D.eleves).filter(x => !e || x.id === e).map(x => [x.prenom, choisies.filter(s => s.pec === x.id), x.prenom]).filter(([, ss]) => ss.length).map(([t, ss, p]) => [t, D.chapitres[ss[0].chapitre], ss, p]);
    return Object.values(D.chapitres).map(c => [c.titre, c, choisies.filter(s => s.chapitre === c.id), e ? nomEl(e) : '']).filter(([, , ss]) => ss.length);
  }
  function pageFiches() {
    const sel = selectionFiches(); const e = ui.ficheEleve;
    const parEleve = ui.fichesMode === 'eleve';
    const brutes = choisiesFiches(sel); const prop = propFiches(); const nRep = Object.keys(prop).length;
    const choisies = avecProp(brutes, prop); const n = choisies.length;
    const feuilles = feuillesFiches(choisies);
    ui.ficheVue = Math.min(ui.ficheVue, Math.max(0, feuilles.length - 1));
    const sansEleve = parEleve ? choisies.filter(s => !s.pec).length : 0;
    // Celles qu'on peut répartir : leur chapitre a des élèves, et la liste n'est pas réduite à un élève
    const aRepartir = parEleve && !e && !ui.fichesTout ? brutes.filter(s => !s.pec && D.chapitres[s.chapitre].eleves.length).length : 0;
    const montre = s => !e || s.pec === e;
    const liste = H.parties.map(p => { const chaps = p.chapitres.filter(c => c.scenes.map(vuFiche).some(montre)); return chaps.length ? `<section class="lot-partie"><h2>${p.titre}</h2>${chaps.map(c => `<fieldset class="lot-chap" style="${varsCouleur(c)}"><legend>${c.titre}</legend>
      ${c.scenes.map(vuFiche).filter(montre).map(s => `<label class="lot-scene ${['valide', 'prete'].includes(s.etat) || !pourFiche(s) ? 'lot-scene--fait' : ''}"><input type="checkbox" class="case" data-act="fiche-choix" value="${s.ref}" ${sel.has(s.ref) ? 'checked' : ''} ${pourFiche(s) ? '' : 'disabled'}><span class="fiche__ref">${s.ref}</span><span class="lot-scene__titre">${s.titre}${pourFiche(s) ? '' : '<span class="texte-vide">sans consigne : pas imprimée</span>'}</span>${s.pec ? `<span class="pec">${gommette(s.pec, 'gommette--s')}</span>` : prop[s.ref] ? `<span class="pec pec--propose" title="Proposée à ${nomEl(prop[s.ref])}">${gommette(prop[s.ref], 'gommette--s')}<span class="vh">proposée à ${nomEl(prop[s.ref])}</span></span>` : ''}${tamponVu(s)}</label>`).join('')}</fieldset>`).join('')}</section>` : ''; }).join('');
    const f = feuilles[ui.ficheVue];
    // Les deux façons de tirer « par élève » : les scènes déjà prises seulement, ou toutes, les autres étant réparties
    const repartir = aRepartir ? `<button class="lien" data-act="fiche-repartir" data-v="1">${aRepartir > 1 ? 'Les répartir' : 'La répartir'} entre les élèves du chapitre</button> · ` : '';
    const parChap = `<button class="lien" data-act="fiche-mode" data-v="chapitre">Passer par chapitre</button>`;
    const rien = e && !liste ? `Rien à imprimer pour ${nomEl(e)}.`
      : sansEleve && !feuilles.length ? `Aucune scène choisie n’a encore d’élève : rien à imprimer par élève. ${repartir}${parChap}`
      : ui.fichesRien ? 'Rien à écrire ni à reprendre dans les scènes listées. Cochez des scènes dans la liste.' : 'Aucune scène choisie. Cochez des scènes dans la liste.';
    const une = nRep === 1 ? Object.entries(prop)[0] : null;
    const note = nRep
      ? `<p class="lot-note lot-note--prop">${une ? `${une[0]} est proposée à ${nomEl(une[1])} : elle sera à son nom à l’impression.` : `${nRep} scènes sans élève sont réparties entre les élèves de leur chapitre : elles seront à leur nom à l’impression.`}${sansEleve ? ` ${sansEleve} dans un chapitre sans élève : sur aucune feuille.` : ''} <button class="lien" data-act="fiche-repartir" data-v="">Ne pas répartir</button></p>`
      : sansEleve && feuilles.length ? `<p class="lot-note">${sansEleve} des ${n} scènes choisies ${sansEleve > 1 ? 'n’ont' : 'n’a'} pas d’élève : sur aucune feuille. ${repartir}${parChap}</p>` : '';
    // Le message de demande : rien n'est donné aux élèves avant « Répartir et imprimer »
    const demande = ui.fichesConfirme && nRep ? `<div class="pg-confirm lot-confirme" role="alertdialog" aria-labelledby="lot-conf-t"><p id="lot-conf-t" tabindex="-1"><b>${une ? `${nomEl(une[1])} s’occupe de ${une[0]} ?` : `Les élèves proposés s’occupent de ces ${nRep} scènes ?`}</b></p><p>${une ? 'Elle sera à son nom' : 'Elles seront à leur nom'}, comme les scènes déjà prises. Vous pourrez encore changer d’élève.</p><div><button class="btn btn--primaire" data-act="fiche-repartir-oui">Répartir et imprimer</button><button class="btn" data-act="fiche-repartir-non">Annuler</button></div></div>` : '';
    return `<div class="page page--fiches">
      <nav class="fil"><a href="#/suivi">${ic('i-fleche-g')}Retour au Suivi</a></nav>
      <header class="suivi-tete"><div><h1>Fiches de rédaction</h1><p class="suivi-tete__meta">Choisissez les scènes à travailler sur papier.${info('suivi-info', 'Que change l’impression des fiches ?', 'Une scène sans consigne n’est pas imprimée. Imprimer ne remet aucun texte et ne donne aucun accès aux élèves.')}</p></div></header>
      <div class="lot">
        <div class="lot-liste">
          <div class="lot-filtres">${select('fiche-eleve', 'Élève', [['', 'Tous les élèves']].concat(Object.values(D.eleves).map(x => [x.id, x.prenom])), e || '')}
            <p class="lot-raccourcis">Ajouter : <button class="lien" data-act="fiche-lot" data-v="vide">les textes vides</button> · <button class="lien" data-act="fiche-lot" data-v="reprendre">à reprendre</button><button class="lien lot-raccourcis__vider" data-act="fiche-lot" data-v="vider">Tout décocher</button></p></div>
          ${liste || `<p class="aucun">${nomEl(e)} ${chapsDe(e).length ? 'ne s’occupe d’aucune scène' : 'n’a aucun chapitre'}. <button class="lien" data-act="fiche-tous">Tous les élèves</button></p>`}
        </div>
        <div class="lot-apercu">
          <div class="lot-reglage"><span id="lot-reglage">Une feuille</span><div class="seg-mini" role="group" aria-labelledby="lot-reglage"><button data-act="fiche-mode" data-v="chapitre" aria-pressed="${ui.fichesMode !== 'eleve'}">par chapitre</button><button data-act="fiche-mode" data-v="eleve" aria-pressed="${ui.fichesMode === 'eleve'}">par élève</button></div>
            <label class="lot-suite"><input type="checkbox" class="case" data-act="fiche-suite" ${ui.fichesSuite ? 'checked' : ''}>À la suite, à découper</label></div>
          <div class="lot-apercu__barre"><p>${!feuilles.length ? 'Aucune feuille' : `<b>${n - sansEleve}</b> scène${plur(n - sansEleve)} ${ui.fichesSuite ? `en <b>${feuilles.length}</b> partie${plur(feuilles.length)} à découper` : `sur <b>${feuilles.length}</b> feuille${plur(feuilles.length)}${f ? ` · <b>${f[0]}</b>` : ''}`}`}</p>
            ${feuilles.length > 1 && !ui.fichesSuite ? `<div class="lot-pager"><button class="btn btn--petit" data-act="fiche-pager" data-v="-1" aria-label="Feuille précédente" ${ui.ficheVue ? '' : 'disabled'}>${ic('i-fleche-g')}</button><span>${ui.ficheVue + 1} / ${feuilles.length}</span><button class="btn btn--petit" data-act="fiche-pager" data-v="1" aria-label="Feuille suivante" ${ui.ficheVue < feuilles.length - 1 ? '' : 'disabled'}>${ic('i-fleche')}</button></div>` : ''}
            <button class="btn btn--primaire lot-imprimer" data-act="fiche-imprimer" ${feuilles.length && !demande ? '' : 'disabled'}>${ic('i-imprimer')}${!feuilles.length ? 'Imprimer' : ui.fichesSuite ? 'Imprimer à la suite' : `Imprimer ${feuilles.length} feuille${plur(feuilles.length)}`}</button></div>
          ${demande || note}
          ${!f ? `<p class="aucun">${rien}</p>` : ui.fichesSuite ? feuilleSuite(feuilles) : feuille(f[1], f[2], f[3])}
        </div>
      </div></div>`;
  }
  function feuille(c, scenes, prenom, seule) {
    const chaps = [...new Set(scenes.map(s => D.chapitres[s.chapitre].titre))].join(', ');
    const une = sc => {
      const t = contenu(sc); const ch = choixDe(sc); const retour = [...t.remises].reverse().find(r => r.retour); const cs = D.chapitres[sc.chapitre];
      const texte = !sc.vide && t.texte.length && ['cours', 'reprendre'].includes(sc.etat) ? t.texte : null;
      return `<li class="fr-scene"><span class="fr-num">${sc.ref}</span><div class="fr-corps">
          <h3>${sc.titre}</h3>
          <p class="fr-consigne">${esc(t.consigne)}</p>${t.points.length ? `<ul class="fr-points">${t.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}
          ${texte ? `<p class="fr-lib">Déjà écrit</p><div class="fr-texte">${texte.map(p => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
          ${sc.etat === 'reprendre' && retour ? `<p class="fr-lib">À reprendre</p><p class="fr-reprise">${esc(retour.retour.texte)}</p>` : ''}
          ${ch.length ? `<p class="fr-choix">À la fin, le lecteur pourra : ${ch.map(([lib]) => esc(lib)).join(' · ')}</p>` : ''}
        </div>${sc.ref === 'S015' || sc.ref === 'S018' ? `<span class="fr-image">${image(cs.image, cs.couleur, '')}</span>` : ''}</li>`;
    };
    const partie = `<section class="fr-partie" style="${varsCouleur(c)}"><header class="feuille__tete"><p>${H.titre} · <b>${chaps}</b></p><p>Prénom : ${prenom ? `<b>${prenom}</b>` : '______________'}</p></header>
      <p class="fr-mode">Sur ton cahier, recopie le repère de la scène (${scenes[0] ? scenes[0].ref : 'S015'}), puis écris ton texte.</p>
      <ol class="fr-liste">${scenes.map(une).join('')}</ol></section>`;
    if (seule === false) return partie;
    return `<article class="feuille feuille--liste" aria-label="Aperçu de la feuille ${prenom ? `de ${prenom}` : `du chapitre ${c.titre}`}">${partie}
      <p class="feuille__pied">Fiche de rédaction · à recopier dans l’application</p>
    </article>`;
  }
  // « À la suite, à découper » : pas de saut de page entre les parties, pour ne pas laisser de blanc ; un trait de coupe les sépare
  const feuilleSuite = feuilles => `<article class="feuille feuille--liste feuille--suite" aria-label="Aperçu des fiches à la suite, à découper">
      ${feuilles.map(([, c, ss, p]) => feuille(c, ss, p, false)).join('<p class="fr-coupe"><span>✂ à découper</span></p>')}
      <p class="feuille__pied">Fiches de rédaction · à recopier dans l’application</p>
    </article>`;
  const msgImpression = () => { const n = feuillesFiches(avecProp(choisiesFiches(selectionFiches()), propFiches())).length; const parQui = ui.fichesMode === 'eleve' ? 'élève' : 'chapitre';
    return `La fenêtre d’impression s’ouvre : ${n} feuille${plur(n)}, ${ui.fichesSuite ? `à la suite, une partie à découper par ${parQui}` : `une par ${parQui}`}.`; };
  Object.assign(A.actions, {
    'fiche-lot': el => { ui.fichesConfirme = false; const s = selectionFiches(); const vues = scenesFiches().filter(x => !ui.ficheEleve || x.pec === ui.ficheEleve); ui.fichesRien = false;
      if (el.dataset.v === 'vider') vues.forEach(x => s.delete(x.ref)); else vues.filter(x => pourFiche(x) && (el.dataset.v === 'vide' ? x.vide : x.etat === el.dataset.v)).forEach(x => s.add(x.ref)); rendre(); },
    'fiche-pager': el => { ui.ficheVue += +el.dataset.v; rendre(); },
    // Imprimer : si des scènes sont réparties, un message demande d'abord de le confirmer ; elles ne passent au nom des élèves qu'à ce moment
    'fiche-imprimer': () => { if (Object.keys(propFiches()).length) { ui.fichesConfirme = true; rendre(); const t = $('#lot-conf-t'); if (t) t.focus({ preventScroll: true }); } else A.toast(msgImpression()); },
    'fiche-repartir': el => { ui.fichesTout = !!el.dataset.v; ui.fichesConfirme = false; ui.ficheVue = 0; rendre(); },
    'fiche-repartir-non': () => { ui.fichesConfirme = false; rendre(); },
    'fiche-repartir-oui': () => { const prop = propFiches(); const k = Object.keys(prop).length; const msg = msgImpression();
      Object.entries(prop).forEach(([ref, id]) => { D.scenes[ref].pec = id; A.pecRepartis[ref] = id; });
      ui.fichesTout = false; ui.fichesConfirme = false; rendre(); A.toast(`${k} scène${plur(k)} ${k > 1 ? 'données aux élèves' : 'donnée à son élève'}. ${msg}`); },
    'fiche-mode': el => { ui.fichesMode = el.dataset.v; ui.ficheVue = 0; ui.fichesConfirme = false; rendre(); const x = $('.lot-reglage [aria-pressed="true"]'); if (x) x.focus({ preventScroll: true }); },
    'fiche-tous': () => { ui.ficheEleve = ''; rendre(); }
  });
  A.changes['fiche-choix'] = el => { const s = selectionFiches(); ui.fichesRien = false; ui.fichesConfirme = false; el.checked ? s.add(el.value) : s.delete(el.value); const y = scrollY; rendre(); scrollTo(0, y); };
  A.changes['fiche-suite'] = el => { ui.fichesSuite = el.checked; ui.ficheVue = 0; const y = scrollY; rendre(); scrollTo(0, y); const x = $('[data-act="fiche-suite"]'); if (x) x.focus({ preventScroll: true }); };
  A.changes['fiche-eleve'] = el => { ui.ficheEleve = el.value; ui.fichesConfirme = false; rendre(); const x = $('select[data-act="fiche-eleve"]'); if (x) x.focus({ preventScroll: true }); };

  /* ——— Carnet de préparation et atelier projeté ———————————————— */
  const RUB = [
    { id: 'univers', nom: 'Univers', question: 'Où se passe notre histoire, et <span class="nw">qu’a-t-elle</span> d’étrange ?', relances: ['À quelle époque ?', 'Qu’est-ce qui est dangereux, qu’est-ce qui est beau ?', 'Une règle magique ou mystérieuse ?'], retenu: 'Un pays de lacs et de forêts noyé dans la brume. Des passeurs guident les voyageurs d’une rive à l’autre avec des lanternes. Quand les lanternes s’éteignent, les chemins changent de place.', pistes: [['Une ville sous l’eau', 'ecarte'], ['Des lanternes qui guident', 'retenu'], ['Une forêt qui bouge la nuit', 'retenu']] },
    { id: 'personnages', nom: 'Personnages', question: 'Qui est notre héros, et <span class="nw">qu’est-ce</span> qui le rend unique ?', relances: ['Quel âge a-t-il ? Que sait-il faire ?', 'De quoi a-t-il peur ?', 'Qui va l’aider, qui va le gêner ?'], retenu: 'Lou, 10 ans, fils du dernier passeur du village. Il connaît le chant des lanternes mais a peur de l’eau.', pistes: [['Lou, fils du dernier passeur', 'retenu'], ['Un renard qui parle', 'discute'], ['Des jumeaux inséparables', 'ecarte'], ['Il a peur de l’eau', 'retenu']] },
    { id: 'enjeu', nom: 'Enjeu', question: 'Que doit réussir notre héros, et que se <span class="nw">passe-t-il</span> s’il échoue ?', relances: ['Qu’est-ce qui l’oblige à partir ?', 'Qu’est-ce qu’il risque de perdre ?'], retenu: 'Retrouver son père, disparu dans la brume, avant que la dernière lanterne ne s’éteigne.', pistes: [['Retrouver son père', 'retenu'], ['Rallumer toutes les lanternes', 'discute']] },
    { id: 'etapes', nom: 'Grandes étapes', question: 'Par quels lieux passe notre aventure ?', relances: ['Où commence-t-elle ?', 'Où le héros peut-il se perdre ?', 'Où se termine-t-elle ?'], retenu: null, pistes: [] }
  ];
  const rub = id => RUB.find(r => r.id === id) || RUB[1];
  const piste = ([p, e]) => `<li class="piste piste--${e}"><span>${esc(p)}</span><span class="piste__etat">${{ retenu: 'retenue', ecarte: 'écartée', discute: 'à discuter' }[e]}</span></li>`;
  function pagePreparation() {
    const plan = H.parties.map((p, i) => `<li><b>Partie ${i + 1} · ${p.titre}</b><ul>${p.chapitres.map(c => `<li><span class="pastille" style="background:${D.couleurs[c.couleur].edge}"></span>${c.titre}${c.resume ? `<span class="plan-resume">${esc(c.resume)}</span>` : ''}</li>`).join('')}</ul></li>`).join('');
    return `<div class="page page--prep">${enteteProjet('prep')}
      <div class="prep-intro"><p>Le carnet garde les décisions de la classe. Il sert de repère pendant l’écriture et, si vous l’utilisez, de contexte à l’aide IA. Remplissez seulement ce qui vous sert. Il reste dans votre espace : le projeter le montre à la classe sans ouvrir d’accès aux élèves.</p>
        <a class="btn btn--primaire btn--grand" href="#/atelier/personnages">${ic('i-oeil')}Projeter l’atelier</a></div>
      <div class="carnet">${RUB.map(r => {
        if (r.id === 'etapes') return `<section class="carnet-fiche rubrique rubrique--plan"><header><h2>${r.nom}</h2><span class="fiche-tete__fin">même plan que Parties et chapitres</span></header><div class="carnet-fiche__corps"><ol class="plan-liste">${plan}</ol><div class="fiche-actions"><a class="btn btn--petit" href="#/plan">Ouvrir Parties et chapitres</a><button class="btn btn--petit" data-act="toast" data-msg="Idées de parties : des propositions à retenir, rien n’est créé sans vous.">${ic('i-etincelle')}Idées de parties</button></div></div></section>`;
        const ecartees = r.pistes.filter(p => p[1] === 'ecarte');
        return `<section class="carnet-fiche rubrique"><header><h2>${r.nom}</h2><a class="fiche-tete__fin lien" href="#/atelier/${r.id}">Projeter</a></header><div class="carnet-fiche__corps">
          <p class="rubrique__question">${r.question}</p>
          <p class="rubrique__texte">${ui.atelier[r.id] || r.retenu}</p>
          ${ecartees.length ? `<details class="rubrique__ecartees"><summary>Pistes écartées · ${ecartees.length}</summary><ul class="pistes pistes--petit">${ecartees.map(piste).join('')}</ul></details>` : ''}
          <div class="fiche-actions"><button class="btn btn--petit" data-act="toast" data-msg="« M’aider à développer » : questions, pistes puis proposition ; rien n’est remplacé sans « Utiliser ce texte ».">${ic('i-etincelle')}M’aider à développer</button></div></div></section>`;
      }).join('')}${A.livre?.rubriquePhrases?.() || ''}${A.jeu.rubrique()}</div></div>`;
  }
  function pageAtelier() {
    const r = rub(st.arg); const i = RUB.indexOf(r); const suiv = RUB[i + 1];
    const ia = ui.iaAtelier; const iaOuverte = ui.iaAtelierOuverte;
    const echange = `<div class="atelier-ia" aria-label="Aide IA facultative">
        <p class="atelier-ia__tete">${ic('i-etincelle')}M’aider à développer <button class="lien" data-act="atelier-ia" aria-expanded="true">Fermer</button></p>
        <p class="echange__ia">Qu’est-ce que Lou sait faire que les autres enfants du village ne savent pas ?</p>
        <p class="echange__prof">Il connaît le chant qui rallume les lanternes.</p>
        ${ia >= 2 ? `<p class="echange__ia">Et pourquoi a-t-il peur de l’eau, alors qu’il est fils de passeur ?</p><p class="echange__prof">Il est tombé du bac quand il était petit.</p>` : ''}
        <div class="echange__prop"><p class="echange__label">Proposition</p><p id="prop-atelier">${ia >= 2 ? 'Lou, 10 ans, fils du dernier passeur. Il connaît le chant qui rallume les lanternes, mais depuis sa chute du bac, il a peur de l’eau.' : 'Lou, 10 ans, fils du dernier passeur. Il est le seul à connaître le chant qui rallume les lanternes, mais il a peur de l’eau.'}</p></div>
        <div class="atelier-ia__actions"><button class="btn btn--primaire" data-act="atelier-utiliser" data-id="${r.id}">Utiliser ce texte</button><button class="btn" data-act="atelier-poursuivre">Poursuivre</button></div>
      </div>`;
    return `<div class="atelier">
      <header class="atelier-barre">
        <p class="atelier-barre__titre">${H.titre}</p>
        <nav class="atelier-etapes" aria-label="Étapes de l’atelier">${RUB.map((x, k) => `<a href="#/atelier/${x.id}" ${x.id === r.id ? 'aria-current="step"' : ''}><span>${k + 1}</span>${x.nom}</a>`).join('')}</nav>
        <a class="btn btn--petit" href="#/preparation">${ic('i-fermer')}Quitter la projection</a>
      </header>
      <div class="atelier-grille">
        <section class="atelier-question">
          <p class="atelier-num">Étape ${i + 1} sur 4 · ${r.nom}</p>
          <h1>${r.question}</h1>
          ${r.id === 'etapes' ? `<ol class="atelier-plan">${H.parties.map(p => `<li>${p.titre}<span>${p.chapitres.map(c => c.titre).join(' · ')}</span></li>`).join('')}</ol>` : iaOuverte ? echange : `
          <details class="atelier-relances"><summary>Relances pour la classe</summary><ul>${r.relances.map(x => `<li>${x}</li>`).join('')}</ul></details>
          <div class="atelier-idees"><p class="atelier-idees__titre">Idées de la classe</p><ul class="pistes">${r.pistes.map(piste).join('')}<li><button class="lien" data-act="toast" data-msg="L’enseignante note l’idée entendue ; aucun élève n’a besoin de se connecter.">${ic('i-plus')}Noter une idée</button></li></ul></div>
          <button class="btn" data-act="atelier-ia" aria-expanded="false">${ic('i-etincelle')}M’aider à développer</button>`}
        </section>
        ${r.id === 'etapes' ? '' : `<section class="atelier-retenu" aria-labelledby="retenons">
          <h2 id="retenons">Nous retenons…</h2>
          <div class="retenons" contenteditable="true" role="textbox" aria-multiline="true" aria-labelledby="retenons">${ui.atelier[r.id] || r.retenu}</div>
          <p class="atelier-sauv">${ic('i-coche')}Enregistré dans le carnet · les idées écartées y restent repliées</p>
        </section>`}
      </div>
      <footer class="atelier-pied"><span>Échanges oraux · l’enseignante consigne les décisions</span>${suiv ? `<a class="lien" href="#/atelier/${suiv.id}">Passer à ${suiv.nom.toLowerCase()}${ic('i-fleche')}</a>` : ''}</footer>
    </div>`;
  }
  Object.assign(A.actions, {
    'atelier-ia': () => { ui.iaAtelierOuverte = !ui.iaAtelierOuverte; rendre(); },
    'atelier-utiliser': el => { const r = rub(el.dataset.id); ui.atelier[r.id] = $('#prop-atelier').textContent; ui.iaAtelierOuverte = false; rendre(); toast('Texte repris dans « Nous retenons » et dans le carnet. Les élèves n’y ont pas accès individuellement.'); },
    'atelier-poursuivre': () => { ui.iaAtelier = 2; rendre(); }
  });

  /* ——— Connexion élève : la classe, puis « qui utilise cet ordinateur ? » ——— */
  function pageClasse() {
    return `<div class="accueil-poste">
      <div class="accueil-poste__image">${image(null, null, 'Accueil de la classe')}</div>
      <section class="accueil-poste__carte" aria-labelledby="t-classe">
        <p class="accueil-poste__marque">You Are a Hero</p>
        <h1 id="t-classe">Ouvrir la classe sur cet ordinateur</h1>
        <p class="accueil-poste__aide">Les informations de la classe sont données par l’enseignante. Elles ne donnent accès qu’au choix des élèves.</p>
        <label class="champ champ--plein"><span>Identifiant de la classe</span><input type="text" value="cm-laurent" autocomplete="off"></label>
        <label class="champ champ--plein"><span>Mot de passe de la classe</span><input type="password" value="brume2026" autocomplete="off"></label>
        <a class="btn btn--primaire btn--grand btn--large" href="#/profils">Ouvrir la classe${ic('i-fleche')}</a>
        <p class="accueil-poste__autre">Vous enseignez dans cette classe ? <button class="lien" data-act="toast" data-msg="L’entrée des enseignants est distincte : elle passe par le compte adulte.">Entrée des enseignants</button></p>
      </section></div>`;
  }
  function pageProfils() {
    const sel = ui.profil; const faux = ui.codeFaux && !!sel;
    // Prénoms dans l'ordre alphabétique ; la grille ne bouge pas quand le code s'affiche : sa place est réservée
    const eleves = Object.values(D.eleves).sort((a, b) => a.prenom.localeCompare(b.prenom, 'fr'));
    const tuile = e => `<li><button class="porte-manteau ${sel === e.id ? 'est-choisi' : ''}" data-act="profil" data-id="${e.id}" aria-pressed="${sel === e.id}">${gommette(e.id)}<span class="porte-manteau__nom">${e.prenom}</span></button></li>`;
    const code = sel ? `<section class="code-perso" aria-labelledby="t-code">
        <p class="code-perso__qui">${gommette(sel, 'gommette--l')}<span class="main">${nomEl(sel)}</span></p>
        <h2 id="t-code">Ton code secret</h2>
        <div class="code-perso__cases" role="group" aria-label="Code à quatre chiffres">${[0, 1, 2, 3].map(k => `<input inputmode="numeric" maxlength="1" aria-label="Chiffre ${k + 1}" value="${faux ? '' : '•'}" ${faux ? 'aria-invalid="true"' : ''} readonly>`).join('')}</div>
        ${faux ? `<p class="code-perso__erreur" role="alert">${ic('i-alerte')}<span>Ce n’est pas le bon code. Essaie encore, ou demande à ${prof}.</span></p>` : ''}
        <button class="btn btn--primaire btn--grand btn--large" data-act="entrer" data-id="${sel}">Entrer${ic('i-fleche')}</button>
        <button class="lien" data-act="profil" data-id="">Ce n’est pas moi</button>
      </section>` : `<section class="code-perso code-perso--vide"><p>${ic('i-main')}Clique sur ton prénom.</p></section>`;
    // « Quitter la classe » demande une confirmation : il faudra les identifiants de la classe pour revenir
    const quitter = `<div class="quitter"><button class="btn btn--discret" data-act="quitter-demander" aria-expanded="${!!ui.quitter}">Quitter la classe sur cet ordinateur</button>
        ${ui.quitter ? `<div class="quitter__bulle" role="alertdialog" aria-labelledby="t-quitter"><p><b id="t-quitter">Quitter la classe ?</b> Pour revenir, il faudra le mot de passe de la classe.</p>
          <div><button class="btn btn--petit" data-act="quitter-oui">Quitter</button><button class="btn btn--petit btn--primaire" data-act="quitter-non">Rester</button></div></div>` : ''}</div>`;
    return `<div class="page page--profils">
      <header class="profils-tete"><div><p class="profils-tete__classe">${ic('i-eleves')}Classe CM1-CM2 de Mme Laurent</p><h1>Qui utilise cet ordinateur ?</h1></div>
        ${quitter}</header>
      <div class="profils-grille profils-grille--code">
        <ul class="porte-manteaux" aria-label="Élèves de la classe">${eleves.map(tuile).join('')}</ul>
        ${code}
      </div></div>`;
  }
  Object.assign(A.actions, {
    'quitter-demander': () => { ui.quitter = !ui.quitter; rendre(); setTimeout(() => $('[data-act="quitter-non"]')?.focus(), 30); },
    'quitter-non': () => { ui.quitter = false; rendre(); $('[data-act="quitter-demander"]')?.focus(); },
    'quitter-oui': () => { ui.quitter = false; ui.profil = null; location.hash = '#/classe'; },
    profil: el => { ui.profil = el.dataset.id || null; ui.codeFaux = false; rendre(); setTimeout(() => $('.code-perso .btn--primaire')?.focus(), 30); },
    entrer: el => { st.vue = 'eleve'; st.moi = el.dataset.id; ui.profil = null; ui.codeFaux = false; location.hash = `#/plan?vue=eleve${el.dataset.id !== 'alice' ? '&moi=' + el.dataset.id : ''}`; }
  });

  /* ——— Enregistrement des pages ————————————————————————————— */
  Object.assign(A.pages, { scene: pageScene, suivi: pageSuivi, projets: pageProjets, fiches: pageFiches, preparation: pagePreparation, atelier: pageAtelier, classe: pageClasse, profils: pageProfils });
  Object.assign(A.titres, {
    scene: () => { const s = D.scenes[st.arg]; return s ? `${s.ref} ${s.titre} — ${H.titre}` : H.titre; },
    suivi: () => `Suivi — ${H.titre}`, projets: () => 'Mes projets', fiches: () => 'Fiches de rédaction', preparation: () => `Préparation — ${H.titre}`, atelier: () => `Atelier — ${H.titre}`, classe: () => 'Ouvrir la classe', profils: () => 'Qui utilise cet ordinateur ?'
  });
})();
