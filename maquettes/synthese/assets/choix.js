/* Cinquième lot : créer et modifier les choix dans la scène (F05.2), blocs protégés (F06.1).
   La copie devient une suite de blocs : paragraphes de récit, phrases de choix, et repères hors récit.
   Simulation sans persistance : ce n'est pas le prototype de l'éditeur. La sélection à cheval sur une
   phrase et le presse-papiers réel ne sont pas joués ; la barre de présentation en montre le résultat. */
(function () {
  const A = window.App;
  const { D, H, st, $, $$, esc, tampon, etatDe, eleve, perso, choix, attribue, varsCouleur, toast, rendre } = A;
  const L = () => A.livre;
  st.colle = 'non';
  let uid = 0; const nid = p => p + (++uid);
  const E = {};                       // par scène : { blocs, cachees }
  const SEMIS = {};                   // texte du livre repris à l'ouverture d'une scène depuis l'aperçu (F11.2)
  const PROTEGES = { S015: [0] };     // paragraphe préparé et protégé par l'enseignante (F06-AC50)
  const ed = { ref: null, ctx: null, saisie: null, panneau: null, message: null, curseur: undefined, posPhrase: null, focus: null, encore: null, flash: null, colle: 'non', colleSnap: null, pile: null };
  const v = (vous, tu) => eleve() ? tu : vous;
  const titreCourt = ref => D.scenes[ref].titre;
  const nomScene = ref => `<span class="code">${ref}</span> ${esc(titreCourt(ref))}`;

  /* ——— Modèle : blocs de la scène ————————————————————————————— */
  function etat(ref) {
    if (E[ref]) return E[ref];
    const sc = D.scenes[ref];
    const ps = (SEMIS[ref] || A.contenu(sc).texte || []).map((p, i) => ({ id: nid('b'), t: 'p', html: esc(p), protege: (PROTEGES[ref] || []).includes(i) }));
    // Actions de jeu (F04.2) : paragraphes d'un type propre, placés entre les paragraphes de récit
    const acts = A.jeu.actionsDe(ref, true); const blocs = [];
    const act = a => ({ id: nid('b'), t: 'action', html: esc(a.t), protege: !!a.protege });
    ps.forEach((b, i) => { acts.filter(a => Math.min(a.pos, ps.length) === i).forEach(a => blocs.push(act(a))); blocs.push(b); });
    acts.filter(a => a.pos >= ps.length).forEach(a => blocs.push(act(a)));
    // Image en bloc (F10) : un bloc de la scène, posé par l'adulte ; il monte ou descend d'un bloc, sans quitter la scène
    const im = L().imageBase?.(ref);
    if (im) { let n = 0; let i = blocs.findIndex(b => { if (n === (im.pos || 0)) return true; if (b.t === 'p') n++; return false; }); if (i < 0) i = blocs.length;
      blocs.splice(i, 0, { id: nid('b'), t: 'image', nom: im.nom, src: im.src, forme: im.forme || 'perso', largeur: im.largeur, ppp: im.ppp || null }); }
    // La construction de chaque phrase automatique est conservée dès que la scène est ouverte (F05-AC11)
    const liens = sc.choix.map((k, i) => { k.construction = k.construction || L().phraseAuto(`${ref}:${i}`, k[0]).k; return { id: nid('l'), lib: k[0], dest: k[1], construction: k.construction }; });
    const phrases = sc.phrases || (sc.phrase ? [sc.phrase] : []); const faites = new Set();
    liens.forEach((l, i) => {
      const ph = phrases.find(p => p.includes(i));
      if (!ph) blocs.push({ id: nid('b'), t: 'choix', liens: [l], perso: null });
      else if (!faites.has(ph)) { faites.add(ph); blocs.push({ id: nid('b'), t: 'choix', liens: ph.filter(s => typeof s === 'number').map(n => liens[n]), perso: ph.map(s => typeof s === 'string' ? s : { id: liens[s].id }) }); }
    });
    const cachees = (sc.cachees || []).map(([dest, num, , lib]) => ({ id: nid('k'), dest, num, lib: lib || '' }));
    return (E[ref] = { blocs, cachees });
  }
  const raccords = sc => [...sc.choix.filter(k => k[1] && D.scenes[k[1]] && D.scenes[k[1]].chapitre !== sc.chapitre).map(k => k[1]), ...(sc.cachees || []).filter(k => D.scenes[k[0]] && D.scenes[k[0]].chapitre !== sc.chapitre).map(k => k[0])];
  // Les choix, les phrases personnalisées et les liaisons de la scène se déduisent des blocs : le graphe et le livre suivent
  function deriver(ref) {
    const sc = D.scenes[ref]; const e = etat(ref); const avant = raccords(sc);
    const liens = e.blocs.filter(b => b.t === 'choix').flatMap(b => b.liens);
    sc.choix = liens.map(l => { const a = [l.lib, l.dest]; const d = l.dest && D.scenes[l.dest]; if (d && d.chapitre !== sc.chapitre) a.push(d.chapitre); a.construction = l.construction; return a; });
    sc.phrases = e.blocs.filter(b => b.t === 'choix' && b.perso).map(b => b.perso.map(s => typeof s === 'string' ? s : liens.findIndex(l => l.id === s.id)));
    delete sc.phrase;
    sc.cachees = e.cachees.map(k => [k.dest, k.num, D.scenes[k.dest].chapitre, k.lib]);
    A.jeu.ecrire(ref, e.blocs);
    const apres = raccords(sc);
    avant.forEach(d => { const i = apres.indexOf(d); if (i >= 0) { apres.splice(i, 1); return; } const en = D.scenes[d]?.entrees || []; const j = en.findIndex(x => x[1] === ref); if (j >= 0) en.splice(j, 1); });
    apres.forEach(d => { (D.scenes[d].entrees = D.scenes[d].entrees || []).push([sc.chapitre, ref]); });
  }
  const photo = refs => ({ refs: Object.fromEntries(refs.map(r => [r, structuredClone(etat(r))])), creee: null });
  function restaurer(snap) {
    Object.entries(snap.refs).forEach(([r, e]) => { E[r] = structuredClone(e); deriver(r); });
    if (snap.creee) { const sc = D.scenes[snap.creee]; const c = D.chapitres[sc.chapitre]; c.scenes = c.scenes.filter(x => x !== sc); delete D.scenes[snap.creee]; delete E[snap.creee]; }
  }
  function creerScene(titre, chapId) {
    const c = D.chapitres[chapId]; let n = Math.max(0, ...c.scenes.map(x => +x.ref.slice(1))) + 1;
    while (D.scenes['S' + String(n).padStart(3, '0')]) n++;
    const ref = 'S' + String(n).padStart(3, '0');
    const sc = { ref, titre, etat: 'cours', pec: null, choix: [], consigne: false, vide: true, chapitre: chapId, nouvelle: true };
    c.scenes.push(sc); D.scenes[ref] = sc; return ref;
  }
  function inserer(e, b, apres) {
    if (apres === '') { e.blocs.unshift(b); return; }
    const i = e.blocs.findIndex(x => x.id === apres);
    if (apres === 'fin' || apres === undefined || i < 0) e.blocs.push(b); else e.blocs.splice(i + 1, 0, b);
  }
  const nums = () => { const S = L().modele(); const N = L().numeroter(S); return d => (d && S[d]?.inclus && N.num[d]) || '?'; };

  // L'éditeur de la scène sert dans la page de scène et, depuis le 3 octobre 2026, à côté de l'aperçu du livre
  A.surEditeur = () => st.page === 'scene' || (st.page === 'livre' && !!A.livre?.ui.tiroir);

  /* ——— Droits (F06.1) ———————————————————————————————————————— */
  function droits() {
    const { c, peutEcrire, profil, fige } = ed.ctx; const adulte = !eleve(); const orga = eleve() && profil === 'organisation'; const ok = peutEcrire && !fige;
    const interne = l => !l.dest || D.scenes[l.dest].chapitre === c.id;
    // Action de jeu (F04.2) : l'adulte et le profil « écriture et organisation » ; protégée d'office pour l'autre profil
    return { adulte, orga, ok, creer: ok && choix() && (adulte || orga), cachee: ok && adulte && choix(), proteger: ok && adulte && !perso(),
      action: ok && choix() && (adulte || orga), actionBloc: b => ok && (adulte || (orga && !b.protege)),
      bloc: b => ok && (adulte || (orga && b.liens.every(interne))), image: ok && adulte, ilot: b => b.t === 'choix' || b.t === 'action' || b.t === 'image' || (b.protege && !perso() && !adulte) };
  }

  /* ——— Rendu de la copie ——————————————————————————————————————— */
  function outils(sc, c, profil) {
    const adulte = !eleve(); const creer = choix() && (adulte || profil === 'organisation');
    return `<div class="copie__outils" role="toolbar" aria-label="Outils du texte"><button class="outil" aria-label="Gras"><b>G</b></button><button class="outil" aria-label="Italique"><i>I</i></button><button class="outil" aria-label="Souligné"><u>S</u></button>
      <span class="outil-sep"></span>${creer ? `<button class="outil outil--texte" data-act="cx-ouvrir" title="Ajouter un choix. Au clavier : /choix dans le texte">${ic('i-choix')}Choix</button>` : ''}
      ${creer ? `<button class="outil outil--texte" data-act="aj-ouvrir" aria-haspopup="listbox" title="Ajouter une action de jeu. Au clavier : /action dans le texte">${ic('i-noter')}Action de jeu</button>` : ''}
      <button class="outil outil--texte" data-act="obj-ouvrir" aria-haspopup="listbox" title="Objets de l’histoire. Au clavier : /objet dans le texte">${ic('i-sac')}Objets</button>${adulte ? '<span class="outil-sep"></span>' : ''}
      ${adulte && !perso() ? `<button class="outil outil--texte" id="cx-proteger" data-act="cx-proteger" aria-pressed="false" title="Protéger le paragraphe où se trouve le curseur : les élèves écrivent autour">${ic('i-cadenas')}<span>Protéger</span></button>` : ''}
      ${adulte ? `<button class="outil outil--texte">${ic('i-image')}Image</button>` : ''}</div>`;
  }
  const renvoi = (l, num) => l.dest
    ? `<span class="renvoi-copie" contenteditable="false" data-lien="${l.id}">${num(l.dest)}</span>`
    : `<span class="renvoi-copie renvoi-copie--vide" contenteditable="false" data-lien="${l.id}" title="Destination à décider"><span class="vh">numéro à décider</span></span>`;
  function phraseHTML(b, num) {
    if (b.perso) return b.perso.map(s => typeof s === 'string' ? esc(s) : renvoi(b.liens.find(l => l.id === s.id), num)).join('');
    const l = b.liens[0]; const p = L().phraseAuto('', l.lib, l.construction);
    return esc(p.avant + p.lib + p.entre + p.formule) + renvoi(l, num) + esc(p.apres);
  }
  function repere(l, c) {
    if (!l.dest) return `<span class="copie__dest-vide">${ic('i-bloque')}Sans destination</span>`;
    const d = D.scenes[l.dest]; const autre = d.chapitre !== c.id ? D.chapitres[d.chapitre] : null;
    // Pour un élève, le repère donne le lieu sans la référence : il ne lit pas deux numéros pour une même scène (F05.2, 5 octobre 2026)
    if (autre) return `<span>${ic('i-sortie')}${eleve() && !attribue(autre) ? `autre chapitre · ${esc(autre.titre)}` : eleve() ? esc(autre.titre) : `${esc(autre.titre)} · <span class="code">${l.dest}</span>`}</span>`;
    return `<span>${ic('i-fleche')}${eleve() ? '' : `<span class="code">${l.dest}</span> `}${esc(d.titre.split(' — ')[0])}</span>`;
  }
  const entre = apres => `<button class="entre" data-act="cx-entre" data-apres="${apres}" aria-label="Écrire un paragraphe ici" title="Écrire un paragraphe ici">${ic('i-plus')}</button>`;

  // etatFige : un texte gardé à part (F08.1), montré en lecture avec ses propres phrases de choix et ses images
  function corps(sc, c, { texte, peutEcrire, profil, fige, etatFige }) {
    if (ed.ref !== sc.ref) {
      if (ed.ref) { st.colle = 'non'; ed.colle = 'non'; }
      Object.assign(ed, { ref: sc.ref, saisie: null, panneau: null, message: null, curseur: undefined, encore: null, colleSnap: null, pile: null, vois: {} });
    }
    ed.ctx = { ref: sc.ref, c, peutEcrire, profil, fige };
    const dr = droits(); appliquerColle(sc, c, dr);
    const e = etatFige || etat(sc.ref); const num = nums();
    let blocs = e.blocs.filter(b => b.t === 'p' || b.t === 'image' || choix());
    if (fige && !etatFige && texte && texte !== A.contenu(sc).texte) blocs = [...texte.map(p => ({ id: '', t: 'p', html: esc(p) })), ...blocs.filter(b => b.t === 'choix')];
    const aucunTexte = !blocs.some(b => b.t === 'p');
    const out = []; let run = null; let prec = ''; let dernierIlot = true;
    const fermer = () => { if (run) { out.push(runHTML(run.blocs, run.apres, dr)); run = null; } };
    if (ed.saisie && ed.saisie.apres === '') out.push(saisieHTML());
    else if (aucunTexte && dr.ok) { out.push(runHTML([], '', dr, sc.papier ? v('Passage préparé sur papier : à recopier ici.', 'Tu as préparé ce passage sur papier ? Recopie-le ici.') : v('Commencez à écrire ici…', 'Commence à écrire ici…'), true)); dernierIlot = false; }
    else if (aucunTexte) out.push(`<p class="copie__vide">${ic('i-vide')}Le texte n’est pas encore écrit.</p>`);
    blocs.forEach(b => {
      if (!dr.ilot(b)) { if (!run) run = { blocs: [], apres: prec }; run.blocs.push(b); dernierIlot = false; }
      else { fermer(); out.push(ilotHTML(b, c, dr, num, dernierIlot && dr.ok ? prec : null)); dernierIlot = true; }
      prec = b.id;
      if (ed.saisie && ed.saisie.apres === b.id) { fermer(); out.push(saisieHTML()); dernierIlot = false; }
    });
    fermer();
    if (dr.ok && dernierIlot && !aucunTexte) out.push(runHTML([], prec, dr));
    if (ed.saisie && (ed.saisie.apres === 'fin' || (ed.saisie.apres && !blocs.some(b => b.id === ed.saisie.apres)))) out.push(saisieHTML());
    const aChoix = blocs.some(b => b.t === 'choix');
    const fin = choix() && sc.fin && !aChoix ? `<p class="copie__fin">${ic('i-fin')}Fin de l’histoire</p>` : '';
    const invite = choix() && dr.creer && !aChoix && !e.cachees.length && !sc.fin && !ed.saisie ? `<p class="copie__invite">${ic('i-choix')}<span>Cette scène ne propose encore aucune suite. ${v('Tapez', 'Tape')} <kbd>/choix</kbd> dans le texte ou ${v('utilisez', 'utilise')} le bouton Choix.</span></p>` : '';
    return `${fige ? '' : voisineHTML(sc, 'avant', num)}<div class="copie__texte" data-ref="${sc.ref}">${out.join('')}${fin}</div>${fige ? '' : voisineHTML(sc, 'apres', num)}${invite}${horsRecit(sc, c, e, dr, num)}${messageHTML()}`;
  }
  function runHTML(blocs, apres, dr, placeholder, debut) {
    const ps = blocs.map(b => `<p${b.id ? ` data-b="${b.id}"` : ''}${b.protege && !perso() ? ' data-protege title="Paragraphe protégé : les élèves écrivent autour"' : ''}>${b.html || '<br>'}</p>`).join('');
    return `<div class="run ${debut ? 'run--debut' : ''}" ${dr.ok ? 'contenteditable="true" data-saisie="texte" spellcheck="true" lang="fr" role="textbox" aria-multiline="true" aria-label="Texte du récit"' : ''} data-apres="${apres}" data-ids="${blocs.map(b => b.id).join(',')}" data-placeholder="${esc(placeholder || '')}">${ps}</div>`;
  }
  function ilotHTML(b, c, dr, num, apresPourEntre) {
    const poignee = apresPourEntre !== null ? entre(apresPourEntre) : '';
    const flash = ed.flash === b.id ? 'est-neuf' : '';
    if (b.t === 'action') return A.jeu.ilotAction(b, dr, poignee, flash);
    if (b.t === 'image') return ilotImage(b, dr, poignee, flash);
    if (b.t === 'p') return `<div class="bloc-protege ${flash}" data-b="${b.id}" ${dr.ok ? 'tabindex="0"' : ''}>${poignee}<span class="marge" aria-hidden="true">${ic('i-cadenas')}</span><p>${b.html}</p><span class="repere-prepare">Préparé par Mme Laurent${dr.ok ? ' : tu écris avant ou après' : ''}</span></div>`;
    const ouvert = ed.panneau?.bloc === b.id; const peut = dr.bloc(b);
    const verrou = eleve() && dr.ok && !peut; const edite = ouvert && b.perso && peut;
    const dests = `<span class="copie__dest">${b.liens.map(l => repere(l, c)).join('')}${verrou ? '<span class="repere-prepare">Choix préparé : tu écris autour</span>' : ''}${b.perso && dr.adulte ? '<span class="repere-prepare">phrase personnalisée</span>' : ''}</span>`;
    const attrs = peut && !ouvert ? `role="button" tabindex="0" data-act="cx-bloc" data-b="${b.id}" aria-label="Phrase de choix. Ouvrir ses réglages."` : '';
    return `<div class="phrase-choix ${ouvert ? 'est-ouvert' : ''} ${flash}" data-b="${b.id}" ${verrou ? 'tabindex="0"' : ''}>${poignee}<span class="marge" aria-hidden="true">${ic(verrou ? 'i-cadenas' : 'i-choix')}</span>
      <div class="phrase-choix__corps" ${attrs}><span class="recit" ${edite ? 'contenteditable="true" data-saisie="cx-phrase" spellcheck="true" lang="fr" role="textbox" aria-label="Texte de la phrase de choix"' : ''}>${phraseHTML(b, num)}</span>${dests}</div></div>${ouvert ? panneauHTML(b, c, dr, num) : ''}${ed.encore === b.id ? encoreHTML(b) : ''}`;
  }
  /* Image en bloc dans la copie (F10, F11.2) : montrée à sa largeur ; ses réglages s'ouvrent dessous, comme ceux d'un choix.
     Largeurs proposées : valeurs de la maquette, les seuils réels restent à fixer. */
  const LARGEURS = { petite: ['Petite', 40], moyenne: ['Moyenne', 65], pleine: ['Pleine largeur', 100], page: ['Pleine page', 100] };
  const libLargeur = b => ({ petite: 'petite largeur', moyenne: 'largeur moyenne', pleine: 'pleine largeur', page: 'pleine page, seule sur sa page' })[b.forme] || `${b.largeur} % de la largeur du texte`;
  function ilotImage(b, dr, poignee, flash) {
    const im = L().imageDe(ed.ref) || b; const peut = dr.image; const ouvert = peut && ed.panneau?.bloc === b.id;
    const vue = im.manquante ? `<span class="image-bloc__absente">${ic('i-bloque')}Image introuvable : ${esc(b.nom)}</span>` : `<img src="${b.src}" alt="">`;
    const attrs = peut && !ouvert ? `role="button" tabindex="0" data-act="im-bloc" data-b="${b.id}" aria-label="Image ${esc(b.nom)}, ${libLargeur(b)}. Ouvrir ses réglages."` : '';
    const legende = eleve() ? 'Image placée par Mme Laurent' : `Image · ${libLargeur(b)}`;
    return `<div class="image-bloc ${ouvert ? 'est-ouvert' : ''} ${flash}" data-b="${b.id}">${poignee}<span class="marge" aria-hidden="true">${ic(eleve() ? 'i-cadenas' : 'i-image')}</span>
      <figure class="image-bloc__fig ${b.forme === 'page' ? 'image-bloc__fig--page' : ''} ${im.manquante ? 'image-bloc__fig--absente' : ''}" style="--l:${b.forme === 'page' ? 100 : b.largeur}%" ${attrs}>${vue}</figure>
      <span class="repere-prepare">${legende}</span></div>${ouvert ? panneauImage(b, im) : ''}`;
  }
  function panneauImage(b, im) {
    const e = etat(ed.ref); const i = e.blocs.indexOf(b); const p = ed.panneau;
    const seg = Object.entries(LARGEURS).map(([k, [lib]]) => `<label><input type="radio" name="im-forme" value="${k}" data-act="im-forme" ${b.forme === k ? 'checked' : ''}><span>${lib}</span></label>`).join('');
    const note = b.forme === 'page' ? 'Elle occupe seule la page qui suit l’endroit où elle est posée ; le texte reprend à la page d’après.'
      : 'En bas de page, une image qui ne tient pas passe entière en tête de la page suivante : le texte ne remonte pas avant elle.';
    return `<section class="cx cx--image" data-cx="panneau" tabindex="-1" aria-label="Réglages de l’image"><header class="cx__tete">${ic('i-image')}<h3>Image</h3>
        <div class="cx__deplacer"><button class="btn btn--petit" data-act="cx-monter" ${i <= 0 ? 'disabled' : ''} aria-label="Monter l’image d’un bloc">${ic('i-chevron-haut')}Monter d’un bloc</button><button class="btn btn--petit" data-act="cx-descendre" ${i >= e.blocs.length - 1 ? 'disabled' : ''} aria-label="Descendre l’image d’un bloc">${ic('i-chevron-bas')}Descendre d’un bloc</button></div>
        <button class="btn btn--discret cx__fermer" data-act="cx-pan-fermer" aria-label="Fermer les réglages">${ic('i-fermer')}</button></header>
      <div class="cx__corps"><div class="cx-reglages">
        <div class="im-largeur"><fieldset class="choix-seg"><legend>Largeur</legend>${seg}</fieldset>
          <label class="champ champ--nombre im-pct"><span>ou, en % du texte</span><input type="number" id="im-pct" min="10" max="100" step="5" value="${b.forme === 'page' ? '' : b.largeur}" ${b.forme === 'page' ? 'disabled' : ''} data-act="im-pct" inputmode="numeric" ${p.erreur ? 'aria-invalid="true" aria-describedby="im-erreur"' : ''}></label></div>
        ${p.erreur ? `<p class="pl-erreur" id="im-erreur" role="alert">${ic('i-alerte')}<span>${p.erreur}</span></p>` : `<p class="cx-aide">${note}</p>`}
        <div class="cx-ligne"><span class="cx-ligne__t">Fichier</span><span class="cx-ligne__v">${esc(b.nom)}${im.manquante ? ` · <span class="copie__dest-vide">${ic('i-bloque')}introuvable</span>` : im.faible ? ` · ${im.ppp} ppp à cette taille : un dessin photographié peut être voulu tel quel` : ''}</span><button class="btn btn--petit" data-act="toast" data-msg="Import d’une image (simulation) : elle garde sa place et sa largeur.">${im.manquante ? 'Importer à nouveau…' : 'Remplacer…'}</button></div>
      </div></div>
      <footer class="cx__pied"><button class="btn btn--petit btn--danger cx__suppr" data-act="im-supprimer">${ic('i-corbeille')}Supprimer l’image de la scène</button></footer></section>`;
  }
  function encoreHTML(b) {
    const l = b.liens[0]; const d = l.dest && D.scenes[l.dest];
    const quoi = d?.nouvelle ? `Choix ajouté, et scène ${nomScene(l.dest)} créée vide dans « ${esc(D.chapitres[d.chapitre].titre)} ». ${v('Vous restez', 'Tu restes')} dans cette scène.` : !l.dest ? 'Choix ajouté sans destination : son renvoi reste vide.' : 'Choix ajouté.';
    return `<div class="cx-encore" role="status">${ic('i-coche')}<span>${quoi}</span><button class="btn btn--petit" data-act="cx-encore" data-b="${b.id}">${ic('i-plus')}Ajouter un autre choix</button><button class="lien" data-act="cx-annuler">Annuler</button></div>`;
  }
  function horsRecit(sc, c, e, dr, num) {
    if (!choix() || !e.cachees.length) return '';
    const items = e.cachees.map(k => {
      const d = D.scenes[k.dest]; const ch = D.chapitres[d.chapitre];
      if (eleve()) return `<div class="lien-cache lien-cache--fixe">${ic('i-cle')}<span><b>Ton énigme doit conduire au numéro ${k.num}.</b>${attribue(ch) ? ` C’est la scène ${nomScene(k.dest)}.` : ''} Le lecteur n’aura pas de choix écrit : il devra trouver ce numéro.</span></div>`;
      const ouvert = ed.panneau?.cachee === k.id;
      return `<button class="lien-cache ${ouvert ? 'est-ouvert' : ''}" data-act="cx-cachee" data-id="${k.id}" ${dr.cachee ? '' : 'disabled'} aria-expanded="${ouvert}">${ic('i-cle')}<span><b>Lien caché (énigme)</b> vers ${nomScene(k.dest)}${ch.id !== c.id ? ` · ${esc(ch.titre)}` : ''}</span><span class="lien-cache__num">${ic('i-epingle')}n° ${k.num} fixé</span></button>${ouvert ? panneauCachee(k, c, num) : ''}`;
    }).join('');
    return `<div class="copie__hors"><p class="copie__hors-t">Hors du récit · jamais imprimé</p>${items}</div>`;
  }
  function messageHTML() {
    const m = ed.message; if (!m) return '';
    return `<div class="copie__message" role="status">${ic(m.icone || 'i-info')}<p>${m.html}</p>${ed.pile ? `<button class="btn btn--petit" data-act="cx-annuler">Annuler</button>` : ''}<button class="btn btn--discret btn--petit" data-act="cx-msg-fermer" aria-label="Fermer ce message">${ic('i-fermer')}</button></div>`;
  }

  /* ——— Scènes voisines (F04.3) : fin de la précédente avant le texte, début de la suivante après ———
     Lecture seule, hors du texte enregistré ; préférence conservée par personne, cochée par défaut. */
  const prefs = {};
  const clePref = () => eleve() ? A.moi() : perso() ? 'perso' : 'adulte';
  const voisinesActives = () => prefs[clePref()] !== false;
  const caseVoisines = (sc, fige) => fige || !['avant', 'apres'].some(c => voisines(sc, c).length) ? '' : `<label class="voisines-case" title="Afficher la fin de la scène précédente et le début de la suivante"><input type="checkbox" class="case" data-act="cx-voisines" ${voisinesActives() ? 'checked' : ''}><span>Scènes voisines</span></label>`;
  // Page de scène ouverte depuis le livre : les scènes voisines montrent le texte que le livre compte (données du moment)
  const texteLivre = x => (A.retourLivre || A.suiviLivre) && A.livre ? (A.livre.modele()[x.ref]?.texte || null) : null;
  const parasDe = x => (E[x.ref] ? E[x.ref].blocs.filter(b => b.t === 'p').map(b => b.html) : (texteLivre(x) || texteDe(x)).map(esc)).filter(h => h.replace(/<[^>]+>/g, '').trim());
  function voisines(sc, cote) {
    const l = []; const ajoute = (ref, via, cachee) => { const d = l.find(x => x.ref === ref); if (d) { if (via && !d.via.includes(via)) d.via.push(via); } else l.push({ ref, via: via ? [via] : [], cachee }); };
    if (!choix()) { const plan = H.parties.flatMap(p => p.chapitres.flatMap(c => c.scenes)); const v = plan[plan.indexOf(sc) + (cote === 'avant' ? -1 : 1)]; if (v) ajoute(v.ref); }
    else if (cote === 'apres') { sc.choix.forEach(k => { if (k[1]) ajoute(k[1], k[0]); }); (sc.cachees || []).forEach(k => ajoute(k[0], '', true)); }
    else Object.values(D.scenes).forEach(y => { if (y === sc) return; y.choix.forEach(k => { if (k[1] === sc.ref) ajoute(y.ref, k[0]); }); (y.cachees || []).forEach(k => { if (k[0] === sc.ref) ajoute(y.ref, '', true); }); });
    // Un élève ne reçoit rien d'un chapitre non attribué (F06.2) ; une liaison cachée hors périmètre n'est pas mentionnée
    return l.map(v => Object.assign(v, { ferme: eleve() && !attribue(D.chapitres[D.scenes[v.ref].chapitre]) })).filter(v => !(v.ferme && v.cachee));
  }
  function phraseVers(y, ref, num) {
    const i = y.choix.findIndex(k => k[1] === ref); if (i < 0) return '';
    const r = d => `<span class="renvoi-copie">${num(d)}</span>`;
    const ph = (y.phrases || (y.phrase ? [y.phrase] : [])).find(p => p.includes(i));
    if (ph) return ph.map(s => typeof s === 'string' ? esc(s) : r(y.choix[s][1])).join('');
    const k = y.choix[i]; const p = L().phraseAuto(`${y.ref}:${i}`, k[0], k.construction);
    return esc(p.avant + p.lib + p.entre + p.formule) + r(ref) + esc(p.apres);
  }
  function voisineHTML(sc, cote, num) {
    if (!voisinesActives()) return '';
    const l = voisines(sc, cote); if (!l.length) return '';
    const avant = cote === 'avant'; ed.vois = ed.vois || {};
    const sel = l.find(v => v.ref === ed.vois[cote]) || l.find(v => !v.ferme && parasDe(D.scenes[v.ref]).length) || l[0];
    const x = D.scenes[sel.ref]; const ch = D.chapitres[x.chapitre]; const paras = sel.ferme ? [] : parasDe(x);
    const nom = v => v.ferme ? 'autre chapitre' : `<span class="code">${v.ref}</span> ${esc(D.scenes[v.ref].titre.split(' — ')[0])}`;
    const onglets = l.length > 1 ? `<div class="voisine__onglets" role="tablist" aria-label="${avant ? 'Scènes précédentes' : 'Scènes suivantes'}">${l.map(v => `<button role="tab" aria-selected="${v === sel}" data-act="cx-voisine" data-cote="${cote}" data-ref="${v.ref}">${nom(v)}</button>`).join('')}</div>` : `<span class="voisine__seule">${nom(sel)}</span>`;
    const via = !choix() ? '' : sel.cachee ? `${ic('i-cle')}par l’énigme` : !avant && sel.via.length ? `${ic('i-choix')}si le lecteur choisit « ${sel.via.map(esc).join(' » ou « ')} »` : '';
    let corpsV;
    if (sel.ferme) corpsV = `<p class="voisine__ligne">${ic('i-oeil')}Autre chapitre · ${esc(ch.titre)}. ${avant ? 'Le lecteur arrive d’un chapitre que tu découvriras plus tard.' : 'La suite se trouve dans un chapitre que tu découvriras plus tard.'}</p>`;
    else if (!paras.length) corpsV = `<p class="voisine__ligne">${ic('i-vide')}<span><span class="code">${x.ref}</span> ${esc(x.titre)} · Texte vide</span></p>`;
    else corpsV = avant
      ? `<div class="voisine__texte recit"><p class="voisine__coupe" aria-hidden="true">[…]</p><p>${paras[paras.length - 1]}</p>${choix() && !sel.cachee ? `<p class="voisine__phrase">${phraseVers(x, sc.ref, num)}</p>` : ''}</div>`
      : `<div class="voisine__texte recit"><p>${paras[0]}</p>${paras.length > 1 ? '<p class="voisine__coupe" aria-hidden="true">[…]</p>' : ''}</div>`;
    const tete = `<div class="voisine__tete"><span class="voisine__t">${ic(avant ? 'i-entree' : 'i-sortie')}${avant ? 'Juste avant' : 'Juste après'}</span>${onglets}${via ? `<span class="voisine__via">${via}</span>` : ''}${sel.ferme ? '' : `<span class="voisine__fin">${paras.length ? tampon(etatDe(x), true) : ''}<a class="lien" href="#/scene/${x.ref}">Ouvrir</a></span>`}</div>`;
    return `<aside class="voisine voisine--${cote}" aria-label="${avant ? 'Fin de la scène précédente' : 'Début de la scène suivante'}, en lecture seule"><span class="marge" aria-hidden="true">${ic(avant ? 'i-entree' : 'i-sortie')}</span>${tete}${corpsV}</aside>`;
  }

  /* ——— Choisir une destination : scène existante, nouvelle scène, plus tard ——— */
  const TX = () => window.LIVRE_TEXTES;
  const texteDe = x => { const t = A.contenu(x).texte; return t.length ? t : (x.vide ? [] : (TX().sept[x.ref] || TX().juin[x.ref] || [])); };
  const consigneDe = x => x.consigne ? A.contenu(x).consigne : '';
  function candidats(s) {
    const { c, ref } = ed.ctx; const adulte = !eleve();
    let l = Object.values(D.scenes).filter(x => x.ref !== ref && (adulte ? (s.chap === 'tous' || x.chapitre === s.chap) : x.chapitre === c.id));
    const q = s.q.trim().toLowerCase();
    if (q) l = l.filter(x => `${x.ref} ${x.titre} ${consigneDe(x) || ''} ${texteDe(x).join(' ')}`.toLowerCase().includes(q));
    return l;
  }
  function lignes(s, num) {
    const { c } = ed.ctx; const l = candidats(s); const q = s.q.trim().toLowerCase();
    if (!l.length) return `<li class="cx-liste__vide">Aucune scène ne correspond${eleve() ? ' dans ton chapitre' : ''}. ${v('Vous pouvez', 'Tu peux')} créer une nouvelle scène ou décider plus tard.</li>`;
    return l.map(x => {
      const ch = D.chapitres[x.chapitre]; const t = texteDe(x).join(' '); let extrait = '';
      if (q && !`${x.ref} ${x.titre}`.toLowerCase().includes(q)) { const i = t.toLowerCase().indexOf(q); if (i >= 0) extrait = `<small>… ${esc(t.slice(Math.max(0, i - 28), i))}<mark>${esc(t.slice(i, i + q.length))}</mark>${esc(t.slice(i + q.length, i + q.length + 30))} …</small>`; else extrait = '<small>dans la consigne</small>'; }
      return `<li role="option" id="cx-o-${x.ref}" aria-selected="${s.sel === x.ref}" data-act="cx-sel" data-ref="${x.ref}"><span class="code">${x.ref}</span><span class="cx-liste__t">${esc(x.titre)}${extrait}</span>${ch.id !== c.id ? `<span class="cx-liste__chap"><i class="pastille" style="background:${D.couleurs[ch.couleur].edge}"></i>${esc(ch.titre)}</span>` : ''}<span class="cx-liste__n">n° ${num(x.ref)}</span></li>`;
    }).join('');
  }
  function fiche(ref, num) {
    if (!ref) return `<p class="cx-fiche__vide">${ic('i-oeil')}L’aperçu de la scène s’affiche ici avant de confirmer.</p>`;
    const { c } = ed.ctx; const x = D.scenes[ref]; const ch = D.chapitres[x.chapitre]; const t = texteDe(x); const cons = consigneDe(x);
    const depuis = Object.values(D.scenes).filter(y => y.ref !== ed.ctx.ref && y.choix.some(k => k[1] === ref)).map(y => y.ref);
    return `<p class="cx-fiche__chap" style="${varsCouleur(ch)}">${esc(ch.titre)}<span>${esc(ch.partie.titre)}</span></p>
      <div class="cx-fiche__corps"><p class="cx-fiche__tete"><span class="fiche__ref">${ref}</span>${A.tamponSc(x, true)}</p><p class="cx-fiche__titre">${esc(x.titre)}</p>
      ${cons ? `<p class="cx-fiche__consigne">${esc(cons)}</p>` : ''}
      ${t.length ? `<p class="recit cx-fiche__texte">${esc(t.join(' '))}</p>` : '<p class="texte-vide">Texte vide</p>'}
      <p class="cx-fiche__meta">N° ${num(ref)} dans le livre aujourd’hui${depuis.length ? ` · déjà atteinte depuis ${depuis.join(', ')}` : ''}</p>
      ${ch.id !== c.id ? `<p class="cx-fiche__raccord">${ic('i-sortie')}Autre chapitre : les élèves ne peuvent pas créer ce lien.</p>` : ''}</div>`;
  }
  function selecteur(s, num, { cachee = false, question = 'Où mène ce choix ?' } = {}) {
    const { c } = ed.ctx; const adulte = !eleve();
    const issue = (val, icone, lib) => `<label><input type="radio" name="cx-issue" value="${val}" data-act="cx-issue" ${s.issue === val ? 'checked' : ''}><span>${ic(icone)}${lib}</span></label>`;
    const chapitres = Object.values(D.chapitres);
    const optsChap = (val, tous) => `${tous ? `<option value="tous" ${val === 'tous' ? 'selected' : ''}>Tous les chapitres</option>` : ''}${chapitres.filter(x => tous ? x.scenes.length : true).map(x => `<option value="${x.id}" ${val === x.id ? 'selected' : ''}>${esc(x.titre)}${x.id === c.id ? ' (ce chapitre)' : ''}</option>`).join('')}`;
    let corpsIssue;
    if (s.issue === 'existante') corpsIssue = `<div class="cx-dest">
        <div class="cx-cherche"><label class="cx-q">${ic('i-loupe')}<span class="vh">Chercher une scène</span><input type="search" id="cx-q" data-saisie="cx-q" value="${esc(s.q)}" placeholder="Chercher dans les titres, les consignes et les textes" autocomplete="off" role="combobox" aria-controls="cx-liste" aria-expanded="true"></label>
          ${adulte ? `<span class="champ__select"><select data-act="cx-chap" aria-label="Chapitre">${optsChap(s.chap, true)}</select>${ic('i-chevron-bas')}</span>` : `<p class="cx-perimetre">Dans ton chapitre, ${esc(c.titre)}</p>`}</div>
        <ul class="cx-liste" role="listbox" id="cx-liste" aria-label="Scènes">${lignes(s, num)}</ul>
        <div class="cx-fiche" id="cx-fiche" aria-live="polite">${fiche(s.sel, num)}</div></div>`;
    else if (s.issue === 'nouvelle') { const raccord = adulte && s.chapNouv !== c.id;
      corpsIssue = `<div class="cx-nouvelle"><label class="champ champ--plein"><span>Titre de travail de la nouvelle scène</span><input type="text" id="cx-titre" data-saisie="cx-titre" value="${esc(s.titre ?? s.lib ?? '')}" placeholder="Proposé depuis le libellé" maxlength="80"></label>
        ${adulte ? `<label class="champ"><span>Chapitre</span><span class="champ__select"><select data-act="cx-chap-nouv">${optsChap(s.chapNouv, false)}</select>${ic('i-chevron-bas')}</span></label>` : ''}
        <p class="cx-note"><span>La scène est créée vide${adulte ? '' : ` dans ton chapitre, ${esc(c.titre)}`}. ${v('Vous restez', 'Tu restes')} ici pour continuer à écrire ; le titre pourra changer sans toucher au libellé.${raccord ? ' <b>Ce choix mène à un autre chapitre.</b>' : ''}</span></p></div>`; }
    else corpsIssue = `<p class="cx-note cx-note--bloque">${ic('i-bloque')}<span>Le choix existera sans destination : son renvoi restera vide, bien visible. <b>Le PDF définitif sera bloqué</b> tant qu’il n’en aura pas ; ${v('vous pourrez', 'tu pourras')} la choisir plus tard sans ressaisir le libellé.</span></p>`;
    return `<fieldset class="cx-issues"><legend>${question}</legend>${cachee ? '' : `<div class="cx-seg">${issue('existante', 'i-grille', 'Une scène existante')}${issue('nouvelle', 'i-plus', 'Une nouvelle scène')}${issue('plus-tard', 'i-horloge', 'À décider plus tard')}</div>`}${corpsIssue}</fieldset>`;
  }
  // Numéro fixé d'une liaison cachée (F05.1, F05-AC36)
  function erreurNum(s, dest) {
    if (s.numMode !== 'saisi') return '';
    const n = +s.numSaisi; if (!s.numSaisi) return ' ';
    if (!Number.isInteger(n) || n < 1) return 'Saisissez un numéro de passage.';
    const pris = Object.values(D.scenes).flatMap(x => x.cachees || []).find(k => k[1] === n && k[0] !== dest);
    return pris ? `Le n° ${n} est déjà fixé pour ${pris[0]} ${titreCourt(pris[0])}.` : '';
  }
  function numeroFixe(s, dest, num) {
    const err = erreurNum(s, dest).trim();
    return `<fieldset class="cx-num"><legend>Numéro que doit donner l’énigme</legend>
      <label><input type="radio" name="cx-nummode" value="actuel" data-act="cx-nummode" ${s.numMode === 'actuel' ? 'checked' : ''}><span>Garder le numéro actuel de la destination${dest ? ` : <b>n° ${s.numActuel || num(dest)}</b>` : ''}</span></label>
      <label><input type="radio" name="cx-nummode" value="saisi" data-act="cx-nummode" ${s.numMode === 'saisi' ? 'checked' : ''}><span>Saisir le numéro que donne mon énigme</span></label>
      ${s.numMode === 'saisi' ? `<label class="champ champ--num"><span class="vh">Numéro donné par l’énigme</span><input type="text" inputmode="numeric" id="cx-num" data-saisie="cx-num" value="${esc(s.numSaisi)}" maxlength="3" aria-describedby="cx-num-err"></label>` : ''}
      <p class="cx-erreur" id="cx-num-err" role="alert">${err ? ic('i-bloque') + esc(err) : ''}</p>
      <p class="cx-note">${ic('i-epingle')}<span>Ce numéro reste fixé : la destination le gardera dans le livre, même si d’autres scènes sont ajoutées.</span></p></fieldset>`;
  }

  /* ——— Saisie d'un choix, ouverte par /choix ou par le bouton ————— */
  function apercuPhrase(s, num) {
    const lib = s.lib.trim(); const p = L().phraseAuto('', lib || 'Ce que fait le lecteur', s.construction);
    const n = s.issue === 'existante' && s.sel ? `<span class="renvoi-copie">${num(s.sel)}</span>` : s.issue === 'nouvelle' ? '<span class="renvoi-copie renvoi-copie--attente">n°</span>' : '<span class="renvoi-copie renvoi-copie--vide"></span>';
    return `${esc(p.avant)}<span class="${lib ? '' : 'cx-fantome'}">${esc(p.lib)}</span>${esc(p.entre + p.formule)}${n}${esc(p.apres)}`;
  }
  function piedSaisie(s) {
    const cachee = s.forme === 'cachee'; let lib, ok = true;
    if (cachee) { ok = !!s.sel && !erreurNum(s, s.sel); lib = s.sel ? `Créer le lien caché vers ${s.sel}` : 'Choisissez la destination'; }
    else {
      if (s.issue === 'existante') { ok = !!s.sel; lib = s.sel ? `Ajouter le choix vers ${s.sel}` : v('Choisissez une destination', 'Choisis une destination'); }
      else lib = s.issue === 'nouvelle' ? 'Créer la scène et ajouter le choix' : 'Ajouter le choix sans destination';
      if (!s.lib.trim()) ok = false;
    }
    return `<button class="btn btn--primaire" data-act="cx-valider" ${ok ? '' : 'disabled'}>${ic(cachee ? 'i-cle' : 'i-coche')}${lib}</button><button class="btn btn--discret" data-act="cx-fermer">Annuler</button><p class="cx-clavier"><kbd>↑</kbd><kbd>↓</kbd> parcourir · <kbd>Entrée</kbd> valider · <kbd>Échap</kbd> fermer sans rien créer</p>`;
  }
  function saisieHTML() {
    const s = ed.saisie; const dr = droits(); const num = nums(); const cachee = s.forme === 'cachee';
    const forme = (val, icone, lib) => `<label><input type="radio" name="cx-forme" value="${val}" data-act="cx-forme" ${s.forme === val ? 'checked' : ''}><span>${ic(icone)}${lib}</span></label>`;
    const apercu = cachee ? '' : `<div class="phrase-choix phrase-choix--apercu" aria-hidden="true"><span class="marge">${ic('i-choix')}</span><div class="phrase-choix__corps"><span class="recit" id="cx-apercu">${apercuPhrase(s, num)}</span></div></div>`;
    return `${apercu}<section class="cx" data-cx="saisie" aria-label="${cachee ? 'Nouveau lien caché' : 'Nouveau choix'}">
      <header class="cx__tete">${ic(cachee ? 'i-cle' : 'i-choix')}<h3>${cachee ? 'Nouveau lien caché' : 'Nouveau choix'}</h3>
        ${dr.cachee ? `<div class="cx-seg cx-seg--forme" role="radiogroup" aria-label="Forme">${forme('choix', 'i-choix', 'Choix proposé au lecteur')}${forme('cachee', 'i-cle', 'Lien caché (énigme)')}</div>` : ''}
        <button class="btn btn--discret cx__fermer" data-act="cx-fermer" aria-label="Fermer sans rien créer">${ic('i-fermer')}</button></header>
      <div class="cx__corps">
        ${cachee ? `<p class="cx-note">${ic('i-cle')}<span>Aucune phrase n’est ajoutée au texte : le lecteur trouvera la suite en résolvant l’énigme de cette scène. Le lien compte dans les chemins du récit.</span></p>`
          : `<label class="champ champ--plein"><span>Ce que fait le lecteur</span><input type="text" id="cx-lib" data-saisie="cx-lib" value="${esc(s.lib)}" placeholder="Une action à l’infinitif : Prendre la clé" maxlength="90" autocomplete="off"></label>`}
        ${selecteur(s, num, { cachee, question: cachee ? 'Où mène le lien caché ?' : 'Où mène ce choix ?' })}
        ${cachee ? numeroFixe(s, s.sel, num) : ''}
      </div>
      <footer class="cx__pied" id="cx-pied">${piedSaisie(s)}</footer></section>`;
  }
  const nouvelEtatSelecteur = (c, plus = {}) => Object.assign({ issue: 'existante', q: '', chap: c.id, sel: null, titre: null, chapNouv: c.id, lib: '', numMode: 'actuel', numSaisi: '' }, plus);
  function ouvrirSaisie(apres) {
    const act = [...L().ui.constructions];
    ed.saisie = nouvelEtatSelecteur(ed.ctx.c, { apres: apres === undefined ? 'fin' : apres, forme: 'choix', construction: act[Math.floor(Math.random() * act.length)] || 'neutre' });
    ed.panneau = null; ed.encore = null; ed.message = null; ed.focus = '#cx-lib'; cacherSlash(); rendre();
  }
  function validerSaisie() {
    const s = ed.saisie; const { ref, c } = ed.ctx; const e = etat(ref); const num = nums();
    if (s.forme === 'cachee') {
      if (!s.sel || erreurNum(s, s.sel)) return;
      const snap = photo([ref]); const n = s.numMode === 'saisi' ? +s.numSaisi : num(s.sel);
      e.cachees.push({ id: nid('k'), dest: s.sel, num: n, lib: '' }); deriver(ref);
      Object.assign(ed, { pile: snap, saisie: null, message: { icone: 'i-cle', html: `Lien caché créé vers ${nomScene(s.sel)}, au n° ${n} fixé. Aucune phrase n’a été ajoutée au texte : il reste à écrire l’énigme.` }, focus: '.lien-cache' });
      rendre(); return;
    }
    const lib = s.lib.trim(); if (!lib || (s.issue === 'existante' && !s.sel)) return;
    const snap = photo([ref]); let dest = null;
    if (s.issue === 'existante') dest = s.sel;
    else if (s.issue === 'nouvelle') { dest = creerScene((s.titre ?? lib).trim() || lib, eleve() ? c.id : s.chapNouv); snap.creee = dest; }
    const b = { id: nid('b'), t: 'choix', liens: [{ id: nid('l'), lib, dest, construction: s.construction }], perso: null };
    inserer(e, b, s.apres); deriver(ref);
    Object.assign(ed, { pile: snap, saisie: null, encore: b.id, flash: b.id, focus: '[data-act="cx-encore"]' }); rendre();
  }

  /* ——— Panneau « Choix » : réglages d'une phrase, sur place ————————— */
  function destLigne(l, c, num) {
    if (!l.dest) return `<span class="marque marque--bloque">${ic('i-bloque')}Sans destination</span> <span class="cx-aide">bloque le PDF définitif</span>`;
    const d = D.scenes[l.dest]; const ch = D.chapitres[d.chapitre]; const cache = eleve() && !attribue(ch);
    return cache ? `autre chapitre · ${esc(ch.titre)}` : `${nomScene(l.dest)}${ch.id !== c.id ? ` · <span class="cx-aide">${esc(ch.titre)}, raccord</span>` : ''} · <span class="cx-aide">n° ${num(l.dest)}</span>`;
  }
  function confirmation(p, b) {
    if (p.confirme === 'dernier') return `<div class="cx-confirme" role="alertdialog" aria-label="Confirmer">${ic('i-alerte')}<p>Une phrase de choix sans renvoi n’existe pas : retirer ce renvoi <b>supprime la phrase entière</b> et son lien. La scène de destination est conservée.</p><button class="btn btn--petit btn--danger" data-act="cx-supprimer">Supprimer la phrase</button><button class="btn btn--petit" data-act="cx-confirme-non">Garder</button></div>`;
    if (p.confirme === 'auto') return `<div class="cx-confirme" role="alertdialog" aria-label="Confirmer">${ic('i-alerte')}<p>${v('Votre', 'Ton')} texte sera remplacé par la phrase recomposée depuis le libellé « ${esc(b.liens[0].lib)} ». ${v('Vous pourrez', 'Tu pourras')} annuler.</p><button class="btn btn--petit btn--primaire" data-act="cx-auto-ok">Remplacer</button><button class="btn btn--petit" data-act="cx-confirme-non">Garder ${v('mon', 'mon')} texte</button></div>`;
    return '';
  }
  function panneauHTML(b, c, dr, num) {
    const p = ed.panneau; const seul = b.liens.length === 1; const l0 = b.liens[0];
    if (p.mode) {
      const renv = p.mode === 'renvoi';
      const ok = p.s.issue !== 'existante' || p.s.sel;
      return `<section class="cx" data-cx="panneau" aria-label="${renv ? 'Insérer un renvoi' : 'Changer la destination'}"><header class="cx__tete">${ic('i-choix')}<h3>${renv ? 'Insérer un renvoi' : 'Changer la destination'}</h3><button class="btn btn--discret cx__fermer" data-act="cx-mode-retour" aria-label="Revenir aux réglages du choix">${ic('i-fermer')}</button></header>
        <div class="cx__corps">${renv ? `<label class="champ champ--plein"><span>Libellé pour les chemins et la recherche <em>facultatif</em></span><input type="text" data-saisie="cx-s-lib" value="${esc(p.s.lib)}" placeholder="Sans libellé, la phrase en tient lieu" maxlength="90"></label>` : ''}${selecteur(p.s, num, { question: renv ? 'Où mène ce renvoi ?' : 'Nouvelle destination' })}</div>
        <footer class="cx__pied" id="cx-pied"><button class="btn btn--primaire" data-act="cx-dest-valider" ${ok ? '' : 'disabled'}>${ic('i-coche')}${renv ? 'Insérer le renvoi' : 'Changer la destination'}</button><button class="btn btn--discret" data-act="cx-mode-retour">Retour</button></footer></section>`;
    }
    const actives = [...L().ui.constructions]; const cons = L().CONSTRUCTIONS;
    let corpsP;
    if (!b.perso) corpsP = `<div class="cx-reglages">
        <label class="champ champ--plein"><span>Libellé</span><input type="text" id="cx-pan-lib" data-saisie="cx-pan-lib" data-lien="${l0.id}" value="${esc(l0.lib)}" maxlength="90" autocomplete="off"></label>
        <div class="cx-ligne"><span class="cx-ligne__t">Destination</span><span class="cx-ligne__v">${destLigne(l0, c, num)}</span><button class="btn btn--petit" data-act="cx-dest-changer" data-lien="${l0.id}">${l0.dest ? 'Changer…' : 'Choisir la destination…'}</button></div>
        <div class="cx-ligne"><span class="cx-ligne__t">Forme de la phrase</span><span class="cx-ligne__v">Automatique · ${esc(cons[l0.construction || 'neutre'][0])}<span class="cx-aide"> · suit la formule de renvoi du livre</span></span>
          <span class="cx-ligne__actions">${actives.length > 1 ? `<button class="btn btn--petit" data-act="cx-regenerer">${ic('i-recommencer')}Régénérer</button>` : ''}<button class="btn btn--petit" data-act="cx-personnaliser">${ic('i-crayon')}Personnaliser</button></span></div>
        ${actives.length > 1 ? '' : `<p class="cx-aide">Le texte de la phrase ne se saisit pas directement : ${v('corrigez', 'corrige')} le libellé, ou ${v('personnalisez', 'personnalise')} la phrase. Une seule construction est cochée dans la composition du livre.</p>`}</div>`;
    else corpsP = `<div class="cx-reglages">
        <p class="cx-note">${ic('i-crayon')}<span><b>Phrase personnalisée.</b> ${v('Écrivez', 'Écris')} directement dans la phrase, au-dessus : chaque numéro reste d’un seul bloc. La formule de renvoi du livre ne s’y applique plus.</span></p>
        <ul class="cx-renvois" aria-label="Renvois de la phrase">${b.liens.map(l => `<li><span class="renvoi-copie ${l.dest ? '' : 'renvoi-copie--vide'}">${l.dest ? num(l.dest) : ''}</span><span class="cx-renvois__dest">${destLigne(l, c, num)}</span>
          <label class="champ"><span class="vh">Libellé pour les chemins (facultatif)</span><input type="text" data-saisie="cx-renvoi-lib" data-lien="${l.id}" value="${esc(l.lib)}" placeholder="Libellé pour le graphe"></label>
          <button class="btn btn--petit" data-act="cx-dest-changer" data-lien="${l.id}">Changer…</button><button class="btn btn--petit" data-act="cx-renvoi-retirer" data-lien="${l.id}">Retirer</button></li>`).join('')}</ul>
        <div class="cx-ligne__actions"><button class="btn btn--petit" data-act="cx-renvoi-inserer">${ic('i-plus')}Insérer un renvoi à l’endroit du curseur</button>
          ${seul ? `<button class="btn btn--petit" data-act="cx-auto" ${l0.lib.trim() ? '' : 'disabled title="Donnez d’abord un libellé à ce renvoi"'}>Revenir à la phrase automatique</button>` : '<span class="cx-aide">Avec plusieurs renvois, la phrase ne peut pas redevenir automatique.</span>'}</div></div>`;
    const cacher = dr.cachee && seul && l0.dest && num(l0.dest) !== '?';
    return `<section class="cx" data-cx="panneau" tabindex="-1" aria-label="Réglages du choix"><header class="cx__tete">${ic('i-choix')}<h3>Choix</h3>
        <div class="cx__deplacer"><button class="btn btn--petit" data-act="cx-monter" aria-label="Monter la phrase d’un bloc">${ic('i-chevron-haut')}Monter</button><button class="btn btn--petit" data-act="cx-descendre" aria-label="Descendre la phrase d’un bloc">${ic('i-chevron-bas')}Descendre</button></div>
        <button class="btn btn--discret cx__fermer" data-act="cx-pan-fermer" aria-label="Fermer les réglages">${ic('i-fermer')}</button></header>
      <div class="cx__corps">${corpsP}${confirmation(p, b)}</div>
      <footer class="cx__pied">${cacher ? `<button class="btn btn--petit" data-act="cx-cacher">${ic('i-cle')}Cacher ce choix (énigme)</button>` : ''}<button class="btn btn--petit btn--danger cx__suppr" data-act="cx-supprimer">${ic('i-corbeille')}Supprimer ${seul ? 'le choix' : 'la phrase'}</button></footer></section>`;
  }
  function panneauCachee(k, c, num) {
    const p = ed.panneau;
    if (p.mode) return `<section class="cx" data-cx="panneau"><header class="cx__tete">${ic('i-cle')}<h3>Changer la destination du lien caché</h3><button class="btn btn--discret cx__fermer" data-act="cx-mode-retour" aria-label="Revenir au lien caché">${ic('i-fermer')}</button></header>
        <div class="cx__corps">${selecteur(p.s, num, { cachee: true, question: 'Nouvelle destination' })}</div><footer class="cx__pied" id="cx-pied"><button class="btn btn--primaire" data-act="cx-dest-valider" ${p.s.sel ? '' : 'disabled'}>${ic('i-coche')}Changer la destination</button><button class="btn btn--discret" data-act="cx-mode-retour">Retour</button></footer></section>`;
    const texteEcrit = etat(ed.ref).blocs.some(b => b.t === 'p');
    return `<section class="cx" data-cx="panneau" tabindex="-1" aria-label="Réglages du lien caché"><header class="cx__tete">${ic('i-cle')}<h3>Lien caché (énigme)</h3><button class="btn btn--discret cx__fermer" data-act="cx-pan-fermer" aria-label="Fermer les réglages">${ic('i-fermer')}</button></header>
      <div class="cx__corps"><div class="cx-ligne"><span class="cx-ligne__t">Destination</span><span class="cx-ligne__v">${nomScene(k.dest)} · <span class="cx-aide">${esc(D.chapitres[D.scenes[k.dest].chapitre].titre)}</span></span><button class="btn btn--petit" data-act="cx-dest-changer">Changer…</button></div>
        ${numeroFixe(p.s, k.dest, num)}
        ${texteEcrit ? `<p class="cx-note cx-note--avert">${ic('i-alerte')}<span>Cette scène a déjà un texte. Si le numéro change, elle sera signalée « à vérifier » dans les contrôles du livre : l’application ne lit pas l’énigme.</span></p>` : ''}</div>
      <footer class="cx__pied" id="cx-pied">${piedCachee(p.s, k)}</footer></section>`;
  }
  const piedCachee = (s, k) => `<button class="btn btn--primaire btn--petit" data-act="cx-cachee-ok" ${(s.numMode === 'saisi' && !erreurNum(s, k.dest) && +s.numSaisi !== k.num) || (s.numMode === 'actuel' && s.numActuel !== k.num) ? '' : 'disabled'}>${ic('i-epingle')}Fixer ce numéro</button><button class="btn btn--petit" data-act="cx-proposer">${ic('i-choix')}Proposer comme choix</button><button class="btn btn--petit btn--danger cx__suppr" data-act="cx-cachee-retirer">${ic('i-corbeille')}Supprimer le lien caché</button>`;

  /* ——— Collage simulé d'une phrase de choix (barre de présentation) ——— */
  function appliquerColle(sc, c, dr) {
    if (st.colle === ed.colle) return;
    if (ed.colleSnap) { restaurer(ed.colleSnap); if (ed.pile === ed.colleSnap) { ed.pile = null; ed.message = null; } ed.colleSnap = null; }
    ed.colle = st.colle; if (st.colle === 'non') return;
    if (!dr.ok || !choix()) { ed.message = { html: 'Le collage se joue dans une scène modifiable d’un récit à choix.' }; return; }
    // Action de jeu copiée avec un paragraphe de récit (F04-AC30) : écartée sans le droit requis, jamais convertie en texte
    if (st.colle === 'action') {
      const snap = photo([sc.ref]); const e = etat(sc.ref); const i = e.blocs.map(b => b.t).lastIndexOf('p');
      const para = { id: nid('b'), t: 'p', html: esc('Entre deux racines, quelque chose brillait : un petit couteau au manche de corne.'), protege: false };
      const action = { id: nid('b'), t: 'action', html: esc('Ajoute le couteau à ton inventaire.'), protege: false };
      e.blocs.splice(i + 1, 0, para, ...(dr.action ? [action] : [])); ed.flash = dr.action ? action.id : para.id;
      ed.message = dr.action ? { icone: 'i-noter', html: '<b>1 paragraphe et 1 action de jeu collés.</b> L’action de jeu est une copie : la modifier ici ne change pas celle de la scène d’origine.' }
        : { icone: 'i-info', html: `<b>1 paragraphe collé.</b> L’action de jeu copiée avec lui n’a pas été collée : écrire une action de jeu est réservé à Mme Laurent et aux élèves qui organisent le chapitre.` };
      deriver(sc.ref); ed.colleSnap = snap; ed.pile = snap; ed.panneau = null; ed.saisie = null; ed.encore = null; return;
    }
    const srcRef = sc.ref === 'S015' ? 'S016' : 'S015'; const src = etat(srcRef); const bloc = src.blocs.find(b => b.t === 'choix' && !b.perso); if (!bloc) return;
    const snap = photo([sc.ref, srcRef]); const e = etat(sc.ref); const l = bloc.liens[0]; const coupe = st.colle === 'coupe';
    const interne = l.dest && D.scenes[l.dest].chapitre === c.id;
    if (!(dr.adulte || (dr.orga && interne))) {
      const ps = A.contenu(D.scenes[srcRef]).texte.slice(0, 2).map(p => ({ id: nid('b'), t: 'p', html: esc(p), protege: false }));
      e.blocs.push(...ps); ed.flash = ps[0]?.id;
      ed.message = { icone: 'i-info', html: `<b>${ps.length} paragraphes collés.</b> La phrase de choix copiée avec eux n’a pas été collée : ${dr.orga ? 'ce choix mène à un autre chapitre, et les raccords sont réservés à Mme Laurent.' : 'créer ou déplacer un choix est réservé à Mme Laurent.'} Aucun lien n’a été créé.` };
    } else if (coupe) {
      src.blocs = src.blocs.filter(b => b !== bloc); e.blocs.push(bloc); ed.flash = bloc.id;
      ed.message = { icone: 'i-choix', html: `<b>Choix déplacé.</b> « ${esc(l.lib)} » part maintenant de ${sc.ref} : ${srcRef} ne le propose plus. Libellé, forme de la phrase et destination sont conservés ; les chemins suivent.` };
    } else {
      const copie = { id: nid('b'), t: 'choix', liens: [{ ...l, id: nid('l') }], perso: null }; e.blocs.push(copie); ed.flash = copie.id;
      ed.message = { icone: 'i-choix', html: `<b>Nouveau choix créé par copie.</b> Même libellé et même destination que celui de ${srcRef} ; les deux choix sont indépendants.` };
    }
    deriver(sc.ref); deriver(srcRef); ed.colleSnap = snap; ed.pile = snap; ed.panneau = null; ed.saisie = null; ed.encore = null;
  }

  /* ——— Lecture du texte saisi : les paragraphes d'une plage de récit ——— */
  function normaliser(run) {
    [...run.childNodes].forEach(n => {
      if (n.nodeType === 3 ? n.textContent.trim() : (n.nodeType === 1 && n.tagName !== 'P')) {
        const p = document.createElement('p'); run.insertBefore(p, n);
        if (n.nodeType === 3) p.appendChild(n); else { while (n.firstChild) p.appendChild(n.firstChild); n.remove(); }
        if (!p.firstChild) p.appendChild(document.createElement('br'));
        const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      }
    });
  }
  function lire(run) {
    const e = etat(ed.ref); const anciens = (run.dataset.ids || '').split(',').filter(Boolean); const vus = new Set(); const nouveaux = [];
    [...run.children].forEach(p => {
      if (!p.textContent.trim()) return;
      let id = p.dataset.b; if (!id || vus.has(id)) { id = nid('b'); p.dataset.b = id; }
      vus.add(id); nouveaux.push({ id, t: 'p', html: p.innerHTML, protege: p.hasAttribute('data-protege') });
    });
    e.blocs = e.blocs.filter(b => !anciens.includes(b.id));
    const i = run.dataset.apres ? e.blocs.findIndex(b => b.id === run.dataset.apres) + 1 : 0;
    e.blocs.splice(i, 0, ...nouveaux); run.dataset.ids = nouveaux.map(b => b.id).join(',');
  }
  // Bloc après lequel insérer : le paragraphe du curseur, ou le bloc qui précède une ligne vide
  function positionCurseur() {
    const s = getSelection(); const n = s.rangeCount && s.anchorNode; const el = n && (n.nodeType === 1 ? n : n.parentElement);
    const run = el?.closest?.('.copie__texte .run'); if (!run) return undefined;
    let p = el.closest('p'); if (p && !run.contains(p)) p = null;
    if (!p) return run.children.length ? run.lastElementChild.dataset.b : run.dataset.apres;
    while (p && !p.textContent.trim()) p = p.previousElementSibling;
    return p ? p.dataset.b : run.dataset.apres;
  }
  const paraCurseur = () => { const s = getSelection(); const n = s.rangeCount && s.anchorNode; const el = n && (n.nodeType === 1 ? n : n.parentElement); const p = el?.closest?.('.run > p'); return p || null; };

  /* ——— /choix dans le texte ————————————————————————————————————— */
  let slash = null;
  // Commandes du texte : /choix, /action et /objet, selon les droits de la personne
  const commandes = () => { const dr = droits(); return [
    dr.creer && ['choix', 'i-choix', 'Choix', 'Proposer une suite au lecteur'],
    dr.action && ['action', 'i-noter', 'Action de jeu', 'Demander au lecteur d’agir sur sa feuille'],
    dr.ok && ['objet', 'i-sac', 'Objet', 'Écrire un objet de l’histoire']].filter(Boolean); };
  function montrerSlash(p, cmds) {
    if (!slash) { slash = document.createElement('div'); slash.className = 'slash'; slash.setAttribute('role', 'listbox'); slash.setAttribute('aria-label', 'Commandes du texte'); document.body.appendChild(slash); slash.addEventListener('mousedown', ev => ev.preventDefault()); }
    if (slash.p !== p || slash.sel >= cmds.length || slash.hidden) slash.sel = 0;
    slash.cmds = cmds;
    slash.innerHTML = cmds.map((c, i) => `<button role="option" aria-selected="${i === slash.sel}" data-act="cx-slash" data-cmd="${c[0]}">${ic(c[1])}<span><b>${c[2]}</b> ${c[3]}</span>${i === slash.sel ? '<kbd>Entrée</kbd>' : ''}</button>`).join('');
    const r = getSelection().getRangeAt(0).getBoundingClientRect(); const base = r.height ? r : p.getBoundingClientRect();
    slash.style.left = Math.max(12, Math.min(base.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - 372)) + 'px'; slash.style.top = (base.bottom + window.scrollY + 6) + 'px';
    slash.hidden = false; slash.p = p;
  }
  function cacherSlash() { if (slash) { slash.hidden = true; slash.p = null; } }
  function declencher(p, cmd = 'choix') {
    const ancre = slash && !slash.hidden ? { left: parseFloat(slash.style.left), top: parseFloat(slash.style.top) } : null;
    cacherSlash(); const run = p.closest('.run'); const t = p.textContent.replace(/(^|\s)\/[a-zé]*$/, ''); let apres;
    // /objet n'ajoute pas de bloc : le nom retenu s'écrit dans le paragraphe, comme du texte ordinaire
    if (cmd === 'objet') { if (t) p.textContent = t; else p.innerHTML = '<br>'; lire(run); A.jeu.objetsDepuisTexte(p, ancre); return; }
    if (t.trim()) { p.textContent = t; apres = p.dataset.b; }
    else { let q = p.previousElementSibling; while (q && !q.textContent.trim()) q = q.previousElementSibling; apres = q ? q.dataset.b : run.dataset.apres; p.remove(); }
    lire(run);
    if (cmd === 'action') A.jeu.ouvrirFormules({ apres, ancre }); else ouvrirSaisie(apres);
  }
  const texte0 = A.saisies.texte;
  A.saisies.texte = (el, ev) => {
    texte0?.(el, ev); const run = el.closest('.run'); if (!run || !ed.ctx) return;
    normaliser(run); lire(run); ed.curseur = positionCurseur();
    if (!droits().ok) return;
    const p = paraCurseur(); if (!p) { cacherSlash(); return; }
    const m = p.textContent.match(/(^|\s)\/([a-zé]*)$/); if (!m) { cacherSlash(); return; }
    const cmds = commandes().filter(c => c[0].startsWith(m[2])); const exact = cmds.find(c => c[0] === m[2]);
    if (exact) declencher(p, exact[0]); else if (cmds.length) montrerSlash(p, cmds); else cacherSlash();
  };

  /* ——— Saisies sans nouveau rendu complet —————————————————————— */
  const S = () => ed.saisie || ed.panneau?.s;
  function majSelecteur() {
    const s = S(); if (!s) return; const num = nums();
    const li = $('#cx-liste'); if (li) li.innerHTML = lignes(s, num);
    const f = $('#cx-fiche'); if (f) f.innerHTML = fiche(s.sel, num);
    majPied();
    $(`#cx-o-${s.sel}`)?.scrollIntoView({ block: 'nearest' });
    const q = $('#cx-q'); if (q) q.setAttribute('aria-activedescendant', s.sel ? `cx-o-${s.sel}` : '');
  }
  function majPied() {
    const s = S(); const num = nums(); const pied = $('#cx-pied'); if (!pied) return;
    if (ed.saisie) { pied.innerHTML = piedSaisie(s); const a = $('#cx-apercu'); if (a) a.innerHTML = apercuPhrase(s, num); }
    else if (ed.panneau.mode) { const b = $('[data-act="cx-dest-valider"]', pied); if (b) b.disabled = s.issue === 'existante' && !s.sel; }
    else if (ed.panneau.cachee) pied.innerHTML = piedCachee(s, etat(ed.ref).cachees.find(k => k.id === ed.panneau.cachee));
  }
  const blocOuvert = () => etat(ed.ref).blocs.find(b => b.id === ed.panneau?.bloc);
  const lienDe = id => etat(ed.ref).blocs.flatMap(b => b.liens || []).find(l => l.id === id);
  Object.assign(A.changes, {
    'im-forme': el => { const b = blocOuvert(); if (!b) return; b.forme = el.value; if (LARGEURS[el.value]) b.largeur = LARGEURS[el.value][1]; ed.panneau.erreur = null; deriver(ed.ref); ed.focus = `[name="im-forme"][value="${el.value}"]`; rendre(); },
    'im-pct': el => {
      const b = blocOuvert(); if (!b) return; const n = Math.round(+el.value);
      if (!n || n < 10 || n > 100) { ed.panneau.erreur = 'Indiquez une largeur entre 10 et 100 % de la largeur du texte.'; ed.focus = '#im-pct'; rendre(); return; }
      const nomme = Object.entries(LARGEURS).find(([k, v]) => k !== 'page' && v[1] === n);
      b.largeur = n; b.forme = nomme ? nomme[0] : 'perso'; ed.panneau.erreur = null; deriver(ed.ref); ed.focus = '#im-pct'; rendre();
    }
  });
  Object.assign(A.saisies, {
    'cx-lib': el => { ed.saisie.lib = el.value; const t = $('#cx-titre'); if (t && ed.saisie.titre === null) t.value = el.value; majPied(); },
    'cx-q': el => { const s = S(); s.q = el.value; const l = candidats(s); s.sel = s.q.trim() && l.length ? l[0].ref : (l.some(x => x.ref === s.sel) ? s.sel : null); majSelecteur(); },
    'cx-titre': el => { S().titre = el.value; },
    'cx-s-lib': el => { S().lib = el.value; },
    'cx-num': el => { const s = S(); s.numSaisi = el.value.replace(/\D/g, ''); el.value = s.numSaisi; const k = ed.panneau?.cachee && etat(ed.ref).cachees.find(x => x.id === ed.panneau.cachee); const err = erreurNum(s, k ? k.dest : s.sel).trim(); $('#cx-num-err').innerHTML = err ? ic('i-bloque') + esc(err) : ''; majPied(); },
    'cx-pan-lib': el => { const l = lienDe(el.dataset.lien); l.lib = el.value; deriver(ed.ref); const b = blocOuvert(); const r = $(`.phrase-choix[data-b="${b.id}"] .recit`); if (r) r.innerHTML = phraseHTML(b, nums()); },
    'cx-renvoi-lib': el => { lienDe(el.dataset.lien).lib = el.value; deriver(ed.ref); },
    // Phrase personnalisée : texte libre, renvois insécables (un renvoi effacé au clavier est rétabli)
    'cx-phrase': el => {
      const b = blocOuvert(); const segs = [];
      el.childNodes.forEach(n => { if (n.nodeType === 3) { if (typeof segs[segs.length - 1] === 'string') segs[segs.length - 1] += n.textContent; else segs.push(n.textContent); } else if (n.dataset?.lien) segs.push({ id: n.dataset.lien }); else if (n.textContent) segs.push(n.textContent); });
      const presents = segs.filter(x => typeof x !== 'string').map(x => x.id);
      if (b.liens.some(l => !presents.includes(l.id))) { ed.focus = `.phrase-choix[data-b="${b.id}"] .recit`; rendre(); toast('Un renvoi ne s’efface pas au clavier : utilisez « Retirer » dans les réglages du choix.'); return; }
      b.perso = segs.map(x => typeof x === 'string' ? x.replace(/ /g, ' ').replace(/\n/g, ' ') : x); deriver(ed.ref);
    }
  });
  Object.assign(A.changes, {
    'cx-issue': el => { const s = S(); s.issue = el.value; ed.focus = `[data-act="cx-issue"][value="${el.value}"]`; rendre(); },
    'cx-forme': el => { ed.saisie.forme = el.value; if (el.value === 'cachee') { ed.saisie.issue = 'existante'; ed.saisie.chap = 'tous'; } ed.focus = `[data-act="cx-forme"][value="${el.value}"]`; rendre(); },
    'cx-chap': el => { const s = S(); s.chap = el.value; if (!candidats(s).some(x => x.ref === s.sel)) s.sel = null; ed.focus = '[data-act="cx-chap"]'; rendre(); },
    'cx-chap-nouv': el => { S().chapNouv = el.value; ed.focus = '[data-act="cx-chap-nouv"]'; rendre(); },
    'cx-voisines': el => { prefs[clePref()] = el.checked; ed.focus = '[data-act="cx-voisines"]'; rendre(); toast(`Scènes voisines ${el.checked ? 'affichées' : 'masquées'}. Ce réglage est retenu pour toutes ${v('vos', 'tes')} scènes.`); },
    'cx-nummode': el => { S().numMode = el.value; ed.focus = el.value === 'saisi' ? '#cx-num' : `[data-act="cx-nummode"][value="actuel"]`; rendre(); }
  });

  /* ——— Actions ———————————————————————————————————————————————— */
  function supprimerBloc() {
    const b = blocOuvert(); if (!b) return; const ref = ed.ref; const e = etat(ref); const snap = photo([ref]);
    e.blocs = e.blocs.filter(x => x !== b); deriver(ref);
    const dests = b.liens.filter(l => l.dest).map(l => l.dest);
    Object.assign(ed, { pile: snap, panneau: null, encore: null, focus: '[data-act="cx-annuler"]', message: { icone: 'i-corbeille', html: `<b>${b.liens.length} choix supprimé${b.liens.length > 1 ? 's' : ''}</b>${dests.length ? ` avec ${dests.length > 1 ? 'ses liens' : 'son lien'} ${dests.map(d => `${ref} → ${d}`).join(', ')}. ${dests.length > 1 ? 'Les scènes de destination sont conservées' : `La scène ${dests[0]} est conservée`}.` : '.'}` } });
    rendre();
  }
  function deplacer(sens) {
    const b = blocOuvert(); const e = etat(ed.ref); const vis = e.blocs; const i = vis.indexOf(b); const j = i + sens;
    const quoi = b.t === 'image' ? 'L’image' : 'La phrase';
    if (j < 0 || j >= vis.length) { toast(sens < 0 ? `${quoi} est déjà en tête de la scène.` : `${quoi} est déjà à la fin de la scène.`); return; }
    [vis[i], vis[j]] = [vis[j], vis[i]]; deriver(ed.ref); ed.focus = `[data-act="${sens < 0 ? 'cx-monter' : 'cx-descendre'}"]`; rendre();
  }
  Object.assign(A.actions, {
    'cx-voisine': el => { ed.vois[el.dataset.cote] = el.dataset.ref; ed.focus = `.voisine--${el.dataset.cote} [role="tab"][aria-selected="true"]`; rendre(); },
    'cx-ouvrir': () => { A.jeu.fermerPop(false); const p = positionCurseur(); ouvrirSaisie(p !== undefined ? p : ed.curseur); },
    'cx-slash': el => { if (slash?.p) declencher(slash.p, el.dataset.cmd); },
    'cx-fermer': () => { const a = ed.saisie?.apres; ed.saisie = null; ed.focus = a && a !== 'fin' ? `.run p[data-b="${a}"]` : '.copie__texte .run'; rendre(); },
    'cx-valider': () => validerSaisie(),
    'cx-sel': el => { S().sel = el.dataset.ref; majSelecteur(); },
    'cx-encore': el => { ouvrirSaisie(el.dataset.b); },
    'cx-entre': el => { const e = etat(ed.ref); const b = { id: nid('b'), t: 'p', html: '', protege: false }; inserer(e, b, el.dataset.apres); ed.focus = `.run p[data-b="${b.id}"]`; rendre(); },
    'cx-bloc': el => { ed.panneau = { bloc: el.dataset.b, mode: null, s: null, confirme: null }; ed.saisie = null; ed.encore = null; ed.focus = '.cx'; rendre(); },
    'cx-pan-fermer': () => { const p = ed.panneau; ed.panneau = null; ed.focus = p.image ? `.image-bloc[data-b="${p.bloc}"] .image-bloc__fig` : p.bloc ? `.phrase-choix[data-b="${p.bloc}"] .phrase-choix__corps` : `.lien-cache[data-id="${p.cachee}"]`; rendre(); },
    // Image en bloc : réglages, largeur, retrait (l'adulte seul, F10)
    'im-bloc': el => { ed.panneau = { bloc: el.dataset.b, image: true, mode: null, s: null, confirme: null, erreur: null }; ed.saisie = null; ed.encore = null; ed.focus = '.cx'; rendre(); },
    'im-supprimer': () => {
      const b = blocOuvert(); if (!b) return; const ref = ed.ref; const e = etat(ref); const snap = photo([ref]);
      e.blocs = e.blocs.filter(x => x !== b); deriver(ref);
      Object.assign(ed, { pile: snap, panneau: null, focus: '[data-act="cx-annuler"]', message: { icone: 'i-image', html: `<b>Image retirée de la scène.</b> Le fichier ${esc(b.nom)} n’est plus placé dans ${ref}.` } }); rendre();
    },
    'cx-mode-retour': () => { ed.panneau.mode = null; ed.focus = '.cx'; rendre(); },
    'cx-confirme-non': () => { ed.panneau.confirme = null; ed.focus = '.cx'; rendre(); },
    'cx-dest-changer': el => {
      const p = ed.panneau; const c = ed.ctx.c; const dest = p.cachee ? etat(ed.ref).cachees.find(k => k.id === p.cachee).dest : lienDe(el.dataset.lien).dest;
      p.mode = 'dest'; p.lien = el.dataset.lien || null; p.numS = p.s;
      p.s = nouvelEtatSelecteur(c, { sel: dest, chap: !eleve() && dest && D.scenes[dest].chapitre !== c.id ? D.scenes[dest].chapitre : c.id, titre: p.cachee ? null : (el.dataset.lien ? lienDe(el.dataset.lien).lib : null) || null });
      ed.focus = '#cx-q'; rendre();
    },
    'cx-renvoi-inserer': () => { const p = ed.panneau; p.mode = 'renvoi'; p.s = nouvelEtatSelecteur(ed.ctx.c); ed.focus = '.cx input'; rendre(); },
    'cx-dest-valider': () => {
      const p = ed.panneau; const s = p.s; const ref = ed.ref; const c = ed.ctx.c; const e = etat(ref);
      if (s.issue === 'existante' && !s.sel) return;
      const snap = photo([ref]); let dest = null;
      if (s.issue === 'existante') dest = s.sel;
      else if (s.issue === 'nouvelle') { dest = creerScene((s.titre || s.lib || 'Nouvelle scène').trim(), eleve() ? c.id : s.chapNouv); snap.creee = dest; }
      if (p.cachee) { const k = e.cachees.find(x => x.id === p.cachee); const avant = k.dest; k.dest = dest; k.num = nums()(dest) === '?' ? k.num : nums()(dest); p.s = { numMode: 'actuel', numSaisi: '', numActuel: k.num }; ed.message = { icone: 'i-cle', html: `Le lien caché mène maintenant à ${nomScene(dest)}, au n° ${k.num} fixé. ${avant} est conservée.` }; }
      else if (p.mode === 'dest') { const l = lienDe(p.lien); const avant = l.dest; l.dest = dest; ed.message = { icone: 'i-choix', html: dest ? `Destination changée : ${ref} → ${dest}.${avant ? ` La scène ${avant} est conservée.` : ' Le renvoi n’est plus vide.'}${D.scenes[dest].nouvelle ? ` ${nomScene(dest)} a été créée vide.` : ''}` : `Ce choix n’a plus de destination : son renvoi est vide.${avant ? ` La scène ${avant} est conservée.` : ''}` }; }
      else { const b = blocOuvert(); const l = { id: nid('l'), lib: (s.lib || '').trim(), dest, construction: null }; b.liens.push(l); insererSegment(b, l); ed.message = { icone: 'i-choix', html: `Renvoi inséré${dest ? ` vers ${nomScene(dest)}` : ', sans destination pour l’instant'}. ${v('Écrivez', 'Écris')} la phrase autour.` }; }
      deriver(ref); p.mode = null; ed.pile = snap; ed.focus = '.cx'; rendre();
    },
    'cx-regenerer': () => { const l = blocOuvert().liens[0]; const act = [...L().ui.constructions]; const i = act.indexOf(l.construction); l.construction = act[(i + 1) % act.length]; deriver(ed.ref); ed.focus = '[data-act="cx-regenerer"]'; rendre(); },
    'cx-personnaliser': () => { const b = blocOuvert(); const l = b.liens[0]; const p = L().phraseAuto('', l.lib, l.construction); ed.pile = photo([ed.ref]); b.perso = [p.avant + p.lib + p.entre + p.formule, { id: l.id }, p.apres]; deriver(ed.ref); ed.message = null; ed.focus = `.phrase-choix[data-b="${b.id}"] .recit`; rendre(); },
    'cx-auto': () => { ed.panneau.confirme = 'auto'; ed.focus = '.cx-confirme .btn'; rendre(); },
    'cx-auto-ok': () => { const b = blocOuvert(); ed.pile = photo([ed.ref]); b.perso = null; b.liens[0].construction = b.liens[0].construction || 'neutre'; deriver(ed.ref); ed.panneau.confirme = null; ed.message = { icone: 'i-coche', html: 'Phrase recomposée depuis le libellé. La formule de renvoi du livre s’y applique de nouveau.' }; ed.focus = '.cx'; rendre(); },
    'cx-renvoi-retirer': el => {
      const b = blocOuvert(); if (b.liens.length === 1) { ed.panneau.confirme = 'dernier'; ed.focus = '.cx-confirme .btn'; rendre(); return; }
      const l = lienDe(el.dataset.lien); ed.pile = photo([ed.ref]); b.liens = b.liens.filter(x => x !== l); b.perso = b.perso.filter(s => typeof s === 'string' || s.id !== l.id).reduce((a, s) => { if (typeof s === 'string' && typeof a[a.length - 1] === 'string') a[a.length - 1] += s; else a.push(s); return a; }, []);
      deriver(ed.ref); ed.message = { icone: 'i-choix', html: `Renvoi retiré${l.dest ? ` : le lien ${ed.ref} → ${l.dest} disparaît du récit et des chemins ; la scène ${l.dest} est conservée` : ''}. Le texte qui l’entourait reste dans la phrase, à réécrire.` }; ed.focus = `.phrase-choix[data-b="${b.id}"] .recit`; rendre();
    },
    'cx-monter': () => deplacer(-1),
    'cx-descendre': () => deplacer(1),
    'cx-supprimer': () => supprimerBloc(),
    'cx-cacher': () => {
      const b = blocOuvert(); const l = b.liens[0]; const ref = ed.ref; const e = etat(ref); const n = nums()(l.dest); const snap = photo([ref]);
      e.blocs = e.blocs.filter(x => x !== b); e.cachees.push({ id: nid('k'), dest: l.dest, num: n, lib: l.lib }); deriver(ref);
      Object.assign(ed, { pile: snap, panneau: null, focus: '.lien-cache', message: { icone: 'i-cle', html: `<b>Choix caché.</b> La phrase est retirée du texte ; le lien ${ref} → ${l.dest} est conservé et le n° ${n} est fixé. Il reste à écrire l’énigme qui donne ce numéro.` } }); rendre();
    },
    'cx-cachee': el => { const k = etat(ed.ref).cachees.find(x => x.id === el.dataset.id); if (ed.panneau?.cachee === k.id) { ed.panneau = null; rendre(); return; } ed.panneau = { cachee: k.id, mode: null, s: { numMode: 'actuel', numSaisi: '', numActuel: k.num }, confirme: null }; ed.saisie = null; ed.encore = null; ed.focus = '.cx'; rendre(); },
    'cx-cachee-ok': () => { const p = ed.panneau; const e = etat(ed.ref); const k = e.cachees.find(x => x.id === p.cachee); if (erreurNum(p.s, k.dest)) return; const snap = photo([ed.ref]); const avant = k.num; k.num = +p.s.numSaisi; deriver(ed.ref); p.s = { numMode: 'actuel', numSaisi: '', numActuel: k.num }; ed.pile = snap; ed.message = { icone: 'i-epingle', html: `${nomScene(k.dest)} est maintenant fixée au n° ${k.num} (au lieu du n° ${avant}).${e.blocs.some(b => b.t === 'p') ? ` L’énigme de ${ed.ref} est à vérifier : les contrôles du livre le signalent, sans bloquer.` : ''}` }; ed.focus = '.cx'; rendre(); },
    'cx-proposer': () => {
      const p = ed.panneau; const ref = ed.ref; const e = etat(ref); const k = e.cachees.find(x => x.id === p.cachee); const snap = photo([ref]);
      const b = { id: nid('b'), t: 'choix', liens: [{ id: nid('l'), lib: k.lib || '', dest: k.dest, construction: [...L().ui.constructions][0] || 'neutre' }], perso: null };
      e.cachees = e.cachees.filter(x => x !== k); e.blocs.push(b); deriver(ref);
      Object.assign(ed, { pile: snap, panneau: { bloc: b.id, mode: null, s: null, confirme: null }, flash: b.id, focus: '#cx-pan-lib', message: { icone: 'i-choix', html: `<b>Proposé comme choix.</b> Une phrase automatique vers ${k.dest} est ajoutée à la fin de la scène ; le numéro n’est plus fixé par cette scène.${k.lib ? '' : ' Il lui manque un libellé.'}` } }); rendre();
    },
    'cx-cachee-retirer': () => { const p = ed.panneau; const ref = ed.ref; const e = etat(ref); const k = e.cachees.find(x => x.id === p.cachee); const snap = photo([ref]); e.cachees = e.cachees.filter(x => x !== k); deriver(ref); Object.assign(ed, { pile: snap, panneau: null, focus: '[data-act="cx-annuler"]', message: { icone: 'i-corbeille', html: `Lien caché supprimé : ${ref} ne mène plus à ${k.dest}, qui est conservée.` } }); rendre(); },
    'cx-annuler': () => { if (!ed.pile) return; const colle = ed.pile === ed.colleSnap; restaurer(ed.pile); if (colle) { ed.colleSnap = null; st.colle = 'non'; ed.colle = 'non'; A.majHash(); } Object.assign(ed, { pile: null, message: null, encore: null, panneau: null, saisie: null }); rendre(); toast('Annulé : le texte, les phrases de choix et leurs liens sont rétablis.'); },
    'cx-msg-fermer': () => { ed.message = null; rendre(); },
    'cx-proteger': () => {
      const p = paraCurseur(); const id = p?.dataset.b; const b = id && etat(ed.ref).blocs.find(x => x.id === id);
      if (!b) { toast('Placez le curseur dans le paragraphe à protéger.'); return; }
      b.protege = !b.protege; ed.focus = `.run p[data-b="${id}"]`; rendre();
      toast(b.protege ? 'Paragraphe protégé : les élèves ne peuvent ni le modifier ni le supprimer, et écrivent autour. Vous pouvez toujours le corriger.' : 'Protection retirée : les élèves autorisés à écrire peuvent modifier ce paragraphe.');
    }
  });
  function insererSegment(b, l) {
    const pos = ed.posPhrase; const segs = []; let chips = 0; let fait = false;
    b.perso.forEach(s => {
      if (typeof s !== 'string') { if (!fait && pos && chips === pos.chips && pos.off === 0) { segs.push({ id: l.id }); fait = true; } chips++; segs.push(s); return; }
      if (!fait && pos && chips === pos.chips) { const o = Math.min(pos.off, s.length); segs.push(s.slice(0, o), { id: l.id }, s.slice(o)); fait = true; } else segs.push(s);
    });
    if (!fait) { const d = segs[segs.length - 1]; if (typeof d === 'string' && /[.!?]\s*$/.test(d)) { segs[segs.length - 1] = d.replace(/[.!?]\s*$/, ' ; sinon, va au '); segs.push({ id: l.id }, '.'); } else segs.push(' ', { id: l.id }); }
    b.perso = segs.filter(s => s !== '');
  }

  /* ——— Clavier et curseur ——————————————————————————————————————— */
  document.addEventListener('selectionchange', () => {
    if (!ed.ctx || !A.surEditeur()) return;
    const pos = positionCurseur(); if (pos !== undefined) ed.curseur = pos;
    const btn = $('#cx-proteger'); if (btn) { const on = !!paraCurseur()?.hasAttribute('data-protege'); btn.setAttribute('aria-pressed', on); btn.querySelector('span').textContent = on ? 'Retirer la protection' : 'Protéger'; btn.querySelector('use').setAttribute('href', on ? '#i-cadenas-ouvert' : '#i-cadenas'); }
    const s = getSelection(); const n = s.rangeCount && s.anchorNode; const r = n && (n.nodeType === 1 ? n : n.parentElement)?.closest('.phrase-choix .recit[contenteditable]');
    if (r) { let chips = 0, off = 0; const range = document.createRange(); range.selectNodeContents(r); range.setEnd(s.anchorNode, s.anchorOffset);
      const frag = range.cloneContents(); frag.childNodes.forEach(x => { if (x.nodeType === 1 && x.dataset?.lien) { chips++; off = 0; } else off += x.textContent.length; }); ed.posPhrase = { chips, off }; }
  });
  document.addEventListener('mousedown', ev => { if (ev.target.closest('.copie__outils button')) ev.preventDefault(); });
  document.addEventListener('keydown', ev => {
    if (!A.surEditeur() || !ed.ctx) return; const t = ev.target;
    if (slash && !slash.hidden && t.closest('.run')) {
      if (ev.key === 'Enter') { ev.preventDefault(); declencher(slash.p, slash.cmds[slash.sel][0]); return; }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); slash.sel = (slash.sel + (ev.key === 'ArrowDown' ? 1 : slash.cmds.length - 1)) % slash.cmds.length; montrerSlash(slash.p, slash.cmds); return; }
      if (ev.key === 'Escape') { cacherSlash(); return; }
    }
    const cx = t.closest('.cx');
    if (cx) {
      if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); (A.actions[ed.saisie ? 'cx-fermer' : ed.panneau?.mode ? 'cx-mode-retour' : ed.panneau?.confirme ? 'cx-confirme-non' : 'cx-pan-fermer'])(); return; }
      const s = S();
      if (s && (t.id === 'cx-q' || t.closest('.cx-liste')) && ['ArrowDown', 'ArrowUp'].includes(ev.key)) { ev.preventDefault(); const l = candidats(s); if (!l.length) return; const i = l.findIndex(x => x.ref === s.sel); s.sel = l[Math.max(0, Math.min(l.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))].ref; if (i < 0) s.sel = l[0].ref; majSelecteur(); return; }
      if (ev.key === 'Enter' && t.tagName === 'INPUT' && t.type !== 'radio') {
        ev.preventDefault();
        if (t.id === 'cx-lib' && ed.saisie.issue === 'existante') { $('#cx-q')?.focus(); return; }
        if (ed.saisie) validerSaisie(); else if (ed.panneau?.mode) A.actions['cx-dest-valider'](); else if (t.id === 'cx-num') A.actions['cx-cachee-ok']();
      }
      return;
    }
    if (t.matches('.phrase-choix .recit[contenteditable]') && ev.key === 'Enter') { ev.preventDefault(); return; }
    if (t.matches('.image-bloc__fig[role="button"]') && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); A.actions['im-bloc'](t); return; }
    if (t.matches('.phrase-choix__corps[role="button"]')) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); A.actions['cx-bloc'](t); }
      else if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); ed.panneau = { bloc: t.dataset.b }; supprimerBloc(); }
      else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { ev.preventDefault(); const l = $$('.copie__texte .run, .copie__texte .phrase-choix__corps[role="button"]'); const i = l.indexOf(t) + (ev.key === 'ArrowDown' ? 1 : -1); l[i]?.focus(); }
      return;
    }
    const run = t.closest?.('.run');
    if (run && (ev.key === 'ArrowDown' || ev.key === 'ArrowRight') && !ev.shiftKey) {
      const s = getSelection(); if (!s.isCollapsed) return; const r = document.createRange(); r.selectNodeContents(run); r.setStart(s.anchorNode, s.anchorOffset);
      if (!r.toString().trim()) { const suivant = run.nextElementSibling?.querySelector?.('.phrase-choix__corps[role="button"]'); if (suivant) { ev.preventDefault(); suivant.focus(); } }
    }
  }, true);

  /* ——— Après le rendu : focus, barre de présentation, drapeaux d'URL ——— */
  const reinit0 = A.reinit;
  A.reinit = nom => { reinit0?.(nom); if (['page', 'vue', 'mode', 'recit'].includes(nom)) { Object.assign(ed, { saisie: null, panneau: null, message: null, encore: null, pile: null }); cacherSlash(); } };
  const apres0 = A.apres;
  A.apres = page => {
    apres0?.(page);
    const g = $('#maquette-colle'); if (g) g.hidden = !(page === 'scene' && choix());
    if (!A.surEditeur()) { cacherSlash(); return; }
    if (ed.focus) {
      const el = $(ed.focus); ed.focus = null;
      if (el) {
        const run = el.closest('.run'); const cible = el.matches('p') && run ? run : el;
        cible.focus({ preventScroll: true });
        if (cible.isContentEditable) { const r = document.createRange(); r.selectNodeContents(el.matches('p') ? el : cible); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
        (el.closest('.cx') || el).scrollIntoView({ block: 'nearest' });
      }
    }
    ed.flash = null;
  };
  A.editeur = {
    outils, corps, caseVoisines,
    x: { ed, etat, deriver, photo, inserer, droits, positionCurseur, cacherSlash,
      // Éditeur de la scène ouvert depuis l'aperçu du livre (F11.2) : même état, même rendu
      semer: (ref, textes) => { delete E[ref]; SEMIS[ref] = textes; return etat(ref); },
      poser: (ref, e) => { E[ref] = structuredClone(e); deriver(ref); },
      image: ref => { if (!E[ref]) return undefined; const i = E[ref].blocs.findIndex(b => b.t === 'image'); if (i < 0) return null; const av = E[ref].blocs.slice(0, i); return { ...E[ref].blocs[i], pos: av.filter(b => b.t === 'p').length, apresChoix: av.some(b => b.t === 'choix') }; },
      textes: ref => E[ref] ? E[ref].blocs.filter(b => b.t === 'p').map(b => { const d = document.createElement('div'); d.innerHTML = b.html; return d.textContent.replace(/\s+/g, ' ').trim(); }).filter(Boolean) : null },
    corriger: (ref, paires) => { etat(ref).blocs.forEach(b => { if (b.t === 'p') paires.forEach(([a, c]) => { b.html = b.html.replace(esc(a), esc(c)); }); }); }
  };
  // Drapeaux d'URL pour les captures : ?etape=saisie|nouvelle|plus-tard|cachee|panneau|perso|renvoi|vide|supprime|enigme|numero
  document.addEventListener('DOMContentLoaded', () => {
    const q = new URLSearchParams(location.hash.split('?')[1] || ''); const etape = q.get('etape'); if (!etape || st.page !== 'scene') return;
    const sc = D.scenes[st.arg]; if (!ed.ctx || !sc) return; const e = etat(sc.ref); const c = ed.ctx.c; const premier = e.blocs.find(b => b.t === 'choix');
    const ouvrir = (plus) => { const p1 = e.blocs.find(b => b.t === 'p'); ed.saisie = nouvelEtatSelecteur(c, Object.assign({ apres: p1 ? p1.id : 'fin', forme: 'choix', construction: 'neutre' }, plus)); };
    if (etape === 'saisie') ouvrir({ lib: q.get('lib') || 'Écouter encore le chant', sel: 'S016' });
    if (etape === 'recherche') ouvrir({ lib: 'Suivre le son des cloches', chap: 'tous', q: 'cloche', sel: 'S026' });
    if (etape === 'nouvelle') ouvrir({ lib: 'Traverser le pont de brume', issue: 'nouvelle' });
    if (etape === 'plus-tard') ouvrir({ lib: 'Faire demi-tour', issue: 'plus-tard' });
    if (etape === 'cachee') ouvrir({ forme: 'cachee', chap: 'sommet', sel: 'S060', numMode: 'saisi', numSaisi: '38' });
    if (etape === 'cree') { ouvrir({ lib: 'Traverser le pont de brume', issue: 'nouvelle' }); validerSaisie(); return; }
    if (etape === 'vide') { ouvrir({ lib: 'Faire demi-tour', issue: 'plus-tard' }); validerSaisie(); ed.encore = null; rendre(); return; }
    if (premier && ['panneau', 'perso', 'renvoi', 'supprime', 'dernier'].includes(etape)) {
      ed.panneau = { bloc: premier.id, mode: null, s: null, confirme: null };
      if (etape === 'perso' && !premier.perso) { const l = premier.liens[0]; premier.perso = ['Si le chant t’attire, suis la lumière au ', { id: l.id }, '.']; deriver(sc.ref); }
      if (etape === 'renvoi') { ed.panneau.mode = 'renvoi'; ed.panneau.s = nouvelEtatSelecteur(c, { sel: 'S054' }); }
      if (etape === 'dernier') ed.panneau.confirme = 'dernier';
      if (etape === 'supprime') { supprimerBloc(); return; }
    }
    if (['enigme', 'numero'].includes(etape) && e.cachees[0]) { const k = e.cachees[0]; ed.panneau = { cachee: k.id, mode: null, s: { numMode: etape === 'numero' ? 'saisi' : 'actuel', numSaisi: etape === 'numero' ? q.get('n') || '31' : '', numActuel: k.num }, confirme: null }; }
    rendre();
  });
})();
