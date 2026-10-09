/* Contenu fictif de la maquette : « Les passeurs de brume », CM1-CM2 de Mme Laurent,
   25 élèves, 10 ordinateurs, travail papier possible. Aucune persistance. */
window.DATA = (function () {
  const couleurs = {
    coquelicot: { nom: 'Coquelicot', edge: '#E0533D', band: '#F7CBC1', tint: '#FCEFEB' },
    abricot: { nom: 'Abricot', edge: '#E98A2F', band: '#F9D6B1', tint: '#FEF3E8' },
    tournesol: { nom: 'Tournesol', edge: '#D9A514', band: '#F4E1A0', tint: '#FCF7E4' },
    prairie: { nom: 'Prairie', edge: '#57A043', band: '#CDE6C0', tint: '#F0F7EC' },
    lagon: { nom: 'Lagon', edge: '#1C9C98', band: '#BDE5E2', tint: '#ECF7F6' },
    bleuet: { nom: 'Bleuet', edge: '#3E74D2', band: '#C8D8F4', tint: '#EEF3FC' },
    lilas: { nom: 'Lilas', edge: '#8A60C6', band: '#DCCFEF', tint: '#F5F1FB' },
    pivoine: { nom: 'Pivoine', edge: '#CF4E8C', band: '#F3C7DB', tint: '#FCEEF4' }
  };

  const gommettes = ['#C43E28', '#2466AD', '#2B7A40', '#9A6200', '#7447B2', '#B0386F', '#0E736F', '#586620', '#A34A1A', '#3F4EA8'];
  const prenoms = ['Alice', 'Bilal', 'Chloé', 'Dylan', 'Emma', 'Farah', 'Gabin', 'Hugo', 'Inès', 'Jade', 'Kenza', 'Léo', 'Lina', 'Malo', 'Nahel', 'Noé', 'Océane', 'Paul', 'Rayan', 'Sacha', 'Tom', 'Yasmine', 'Zoé', 'Adam', 'Maëlys'];
  const eleves = {};
  prenoms.forEach((p, i) => {
    const id = p.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    eleves[id] = { id, prenom: p, couleur: gommettes[i % gommettes.length] };
  });

  const etats = {
    // Un seul nom par état, partout (F11.1, 4 octobre 2026) : « Validé » et « Prête », comme au Suivi
    cours: { court: 'En cours', long: 'En cours', icone: 'i-crayon' },
    valider: { court: 'À valider', long: 'À valider', icone: 'i-sablier' },
    reprendre: { court: 'À reprendre', long: 'À reprendre', icone: 'i-retour' },
    valide: { court: 'Validé', long: 'Validé', icone: 'i-coche' },
    prete: { court: 'Prête', long: 'Prête', icone: 'i-livre' }
  };
  // L'enseignante peut s'attribuer une scène (F06.3, 4 octobre 2026) : elle n'est pas une élève, et ne figure donc dans aucune liste d'élèves
  Object.defineProperty(eleves, 'prof', { value: { id: 'prof', prenom: 'Mme Laurent', initiales: 'ML', couleur: '#4A5157' }, enumerable: false });

  // s(ref, titre, etat, priseEnCharge, options)
  const s = (ref, titre, etat, pec, o = {}) => Object.assign({ ref, titre, etat, pec: pec || null, choix: [], consigne: true }, o);

  const histoire = {
    titre: 'Les passeurs de brume',
    classe: 'CM1-CM2 · Mme Laurent',
    effectif: 25, postes: 10,
    image: { type: 'import', src: 'assets/img/ill-quai.jpg', alt: 'Quai aux lanternes, un chat sur un poteau' },
    depart: 'S001',
    parties: [
      {
        id: 'quai', titre: 'Le quai aux lanternes',
        image: { type: 'import', src: 'assets/img/ill-quai.jpg', alt: 'Quai aux lanternes, un chat sur un poteau' },
        chapitres: [
          {
            id: 'bac', titre: 'Le dernier bac', couleur: 'bleuet',
            image: { type: 'import', src: 'assets/img/photo-cabane.jpg', alt: 'Cabane en forêt, photographie' },
            resume: 'Le héros rate le dernier bac et découvre que les lanternes du quai s’éteignent une à une.',
            eleves: [['chloe', 'propositions'], ['dylan', 'propositions'], ['emma', 'propositions']],
            scenes: [
              s('S001', 'Quai — la sirène du dernier bac', 'prete', 'chloe', { depart: true, choix: [['Courir vers la passerelle', 'S002'], ['Regarder les lanternes', 'S003']] }),
              s('S002', 'Passerelle — le bac s’éloigne', 'valide', 'dylan', { choix: [['Appeler le passeur', 'S004']] }),
              s('S003', 'Quai — la lanterne qui clignote', 'valider', 'emma', { choix: [['La suivre', 'S004']] }),
              s('S004', 'Cabane du passeur — la carte oubliée', 'cours', 'chloe', { choix: [['Prendre la carte', 'S005'], ['Sortir par la fenêtre', 'S006']] }),
              s('S005', 'Cabane — la carte s’anime', 'cours', 'dylan', { choix: [['Suivre la carte', 'S006']] }),
              s('S006', 'Quai — la barque sans rameur', 'ecrire', null, { choix: [['Monter dans la barque', 'S014', 'lisiere']] })
            ]
          }
        ]
      },
      {
        id: 'foret', titre: 'La forêt engloutie',
        image: { type: 'import', src: 'assets/img/ill-foret.jpg', alt: 'Forêt engloutie, un héron dans l’eau' },
        chapitres: [
          {
            id: 'lisiere', titre: 'La lisière', couleur: 'lagon',
            image: { type: 'import', src: 'assets/img/ill-lisiere.jpg', alt: 'Barque à la lisière, lanternes et chouette' },
            resume: 'La barque accoste au bord de la forêt. Deux chemins possibles, qui se rejoignent au pont de brume.',
            // Profils des exemples de F05.2 et F06.1 : Alice « écriture et propositions », Bilal « écriture et organisation »
            eleves: [['alice', 'propositions'], ['bilal', 'organisation'], ['ines', 'propositions']],
            scenes: [
              s('S014', 'Lisière — les lanternes s’éteignent', 'valide', 'ines', { entrees: [['bac', 'S006']], choix: [['Suivre le chant', 'S015'], ['Allumer la lanterne de secours', 'S016']] }),
              s('S015', 'Sentier — le chant dans les fougères', 'cours', 'alice', { choix: [['Continuer vers la lumière', 'S018']] }),
              s('S016', 'Souche creuse — la lanterne de secours', 'valider', 'bilal', { choix: [['Sortir de la souche', 'S018'], ['Rester caché', 'S017']] }),
              s('S017', 'Souche — la chouette messagère', 'reprendre', 'bilal', { choix: [['Suivre la chouette', 'S021', 'gue']] }),
              s('S018', 'Clairière — les deux chemins se rejoignent', 'cours', 'alice', { papier: true, vide: true, choix: [['Traverser le pont de brume', 'S019']] }),
              s('S019', 'Pont de brume — le passeur apparaît', 'ecrire', 'alice', { consigne: false, choix: [['Suivre le passeur', 'S031', 'sanctuaire']] })
            ]
          },
          {
            id: 'gue', titre: 'Le gué des saules', couleur: 'prairie',
            image: { type: 'import', src: 'assets/img/ill-gue.jpg', alt: 'Gué sous les saules, une loutre' },
            eleves: [['farah', 'propositions'], ['gabin', 'propositions'], ['hugo', 'organisation'], ['jade', 'propositions']],
            scenes: [
              s('S021', 'Gué — les pierres qui chantent', 'valider', 'farah', { entrees: [['lisiere', 'S017']], choix: [['Sauter de pierre en pierre', 'S022'], ['Appeler la chouette', 'S023']] }),
              s('S022', 'Rivière — la pierre glissante', 'cours', 'gabin', { choix: [['Nager vers la rive', 'S024'], ['Suivre le son des cloches', 'S026', 'clairiere']] }),
              s('S023', 'Saule — le nid de la chouette', 'cours', 'hugo', { choix: [['Monter dans le saule', 'S024']] }),
              s('S024', 'Rive — le moulin au loin', 'ecrire', 'jade', { choix: [['Marcher vers le moulin', 'S040', 'moulin']] }),
              s('S025', 'Gué — la loutre passeuse', 'ecrire', null, { consigne: false })
            ]
          },
          {
            id: 'clairiere', titre: 'La clairière aux cloches', couleur: 'tournesol',
            image: { type: 'import', src: 'assets/img/ill-cloches.jpg', alt: 'Clairière aux cloches, un renard' },
            eleves: [['kenza', 'propositions'], ['leo', 'propositions'], ['lina', 'propositions']],
            scenes: [
              s('S026', 'Clairière — les cloches muettes', 'valide', 'kenza', { entrees: [['gue', 'S022']], choix: [['Sonner la grande cloche', 'S027'], ['Écouter le silence', 'S028']] }),
              s('S027', 'Clocher — l’écho du passeur', 'valider', 'leo', { choix: [['Suivre l’écho', 'S029']] }),
              s('S028', 'Silence — la voix sous la mousse', 'reprendre', 'lina', { choix: [['Creuser', 'S029']] }),
              s('S029', 'Clairière — la cloche fêlée', 'cours', 'kenza')
            ]
          },
          {
            id: 'sanctuaire', titre: 'Le sanctuaire', couleur: 'lilas',
            image: { type: 'import', src: 'assets/img/ill-sanctuaire.jpg', alt: 'Petite chapelle et hérisson' },
            eleves: [['malo', 'propositions'], ['nahel', 'propositions'], ['noe', 'propositions']],
            scenes: [
              s('S031', 'Sanctuaire — la porte aux mille lucioles', 'valide', 'malo', { entrees: [['lisiere', 'S019']], choix: [['Entrer', 'S032'], ['Faire le tour', 'S033']] }),
              s('S032', 'Nef — les statues endormies', 'valide', 'nahel', { choix: [['Réveiller une statue', 'S034']] }),
              s('S033', 'Cloître — le bassin des reflets', 'valider', 'noe', { choix: [['Plonger la main', 'S034'], ['Repartir', 'S036']] }),
              s('S034', 'Nef — la statue parle', 'cours', 'malo', { choix: [['Écouter son secret', 'S035']] }),
              s('S035', 'Crypte — la lanterne du premier passeur', 'cours', 'nahel', { choix: [['Monter l’escalier', 'S050', 'escalier']] }),
              s('S036', 'Cloître — perdu dans la brume', 'ecrire', 'noe', { fin: true })
            ]
          },
          {
            id: 'moulin', titre: 'Le moulin noyé', couleur: 'bleuet',
            image: { type: 'import', src: 'assets/img/ill-moulin.jpg', alt: 'Moulin et canard' },
            eleves: [['oceane', 'propositions'], ['paul', 'propositions']],
            scenes: [
              s('S040', 'Moulin — la roue immobile', 'cours', 'oceane', { entrees: [['gue', 'S024']], choix: [['Pousser la roue', 'S041']] }),
              s('S041', 'Moulin — l’eau remonte', 'ecrire', 'paul', { consigne: false, choix: [['Grimper au grenier', 'S042']] }),
              s('S042', 'Grenier — la barque suspendue', 'ecrire', null, { choix: [['Détacher la barque', 'S043']] }),
              s('S043', 'Rivière souterraine — le courant vers la tour', 'ecrire', null, { consigne: false, choix: [['Mettre pied à terre', 'S050', 'escalier']] })
            ]
          },
          {
            id: 'racines', titre: 'Les racines', couleur: 'abricot',
            image: { type: 'import', src: 'assets/img/ill-racines.jpg', alt: 'Racines géantes et écureuil' }, eleves: [], scenes: []
          }
        ]
      },
      {
        id: 'tour', titre: 'La tour du passeur',
        image: { type: 'import', src: 'assets/img/ill-tour.jpg', alt: 'Tour au-dessus des nuages, un corbeau' },
        chapitres: [
          {
            id: 'escalier', titre: 'L’escalier de brume', couleur: 'pivoine',
            image: { type: 'import', src: 'assets/img/ill-escalier.jpg', alt: 'Escalier dans les nuages, un escargot' },
            eleves: [['rayan', 'propositions'], ['sacha', 'propositions'], ['tom', 'propositions'], ['yasmine', 'propositions'], ['zoe', 'propositions']],
            scenes: [
              s('S050', 'Escalier — les marches qui s’effacent', 'ecrire', 'rayan', { entrees: [['sanctuaire', 'S035'], ['moulin', 'S043']], choix: [['Monter vite', 'S051'], ['Compter les marches', 'S052']] }),
              // Phrase de choix personnalisée (F05) : deux renvois dans une même phrase, placés par l'auteur
              s('S051', 'Palier — la porte sans poignée', 'cours', 'sacha', { choix: [['Ouvrir avec la clé d’argent', 'S053'], ['Déchiffrer les symboles', 'S055']], phrase: ['Si tu as la clé d’argent, ouvre la porte au ', 0, ' ; sinon, déchiffre les symboles au ', 1, '.'] }),
              s('S052', 'Escalier — la marche numéro cent', 'ecrire', 'tom', { choix: [['Continuer', 'S053'], ['Sauter une marche', 'S054']] }),
              s('S053', 'Palier — le miroir de brume', 'ecrire', 'yasmine', { choix: [['Traverser le miroir', 'S060', 'sommet']] }),
              s('S054', 'Escalier — la chute', 'ecrire', 'zoe', { fin: true, choix: [['Retenter ta chance', 'S001', 'bac']] }),
              // Liaison cachée (F05.1) : l'énigme de S055, rédigée par Sacha, donne le numéro fixé de S062.
              // Le libellé est celui du choix avant qu'il soit caché (F05-AC26).
              s('S055', 'Palier — la porte aux symboles', 'cours', 'sacha', { cachees: [['S062', 38, 'sommet', 'Déchiffrer les symboles']] })
            ]
          },
          {
            id: 'sommet', titre: 'Le sommet', couleur: 'coquelicot',
            image: { type: 'import', src: 'assets/img/ill-sommet.jpg', alt: 'Sommet de la tour, une chouette' }, eleves: [],
            scenes: [
              s('S060', 'Sommet — le passeur se retourne', 'ecrire', null, { entrees: [['escalier', 'S053']], choix: [['Prendre sa lanterne', 'S061']] }),
              s('S061', 'Sommet — la brume se lève', 'ecrire', null, { fin: true, consigne: false }),
              s('S062', 'Tour — la salle des brumes', 'ecrire', null, { consigne: false, entrees: [['escalier', 'S055']], choix: [['Monter vers le sommet', 'S060']] })
            ]
          }
        ]
      }
    ]
  };

  // Index pratiques
  const chapitres = {};
  const scenes = {};
  histoire.parties.forEach((p, pi) => p.chapitres.forEach((c, ci) => {
    c.partie = p; c.index = ci + 1; c.partieIndex = pi + 1;
    chapitres[c.id] = c;
    c.scenes.forEach(sc => {
      sc.chapitre = c.id; scenes[sc.ref] = sc;
      // Une scène jamais écrite reste « En cours d'écriture » : seul son texte est vide (pas d'état supplémentaire)
      if (sc.etat === 'ecrire') { sc.etat = 'cours'; sc.vide = true; }
    });
  }));
  // Entrées internes calculées depuis les choix
  Object.values(scenes).forEach(sc => sc.choix.forEach(([lib, dest, chap]) => {
    if (!chap && scenes[dest]) (scenes[dest].internes = scenes[dest].internes || []).push([lib, sc.ref]);
  }));

  return { couleurs, eleves, etats, histoire, chapitres, scenes };
})();
