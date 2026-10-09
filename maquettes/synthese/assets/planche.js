/* Planche d'ambiance : assemble les composants réels de la maquette. */
document.addEventListener('DOMContentLoaded', () => {
  const D = window.DATA; const $ = s => document.querySelector(s);
  const vars = k => { const c = D.couleurs[k]; return `--edge:${c.edge};--band:${c.band};--tint:${c.tint}`; };
  const tampon = e => `<span class="tampon" data-e="${e}">${ic(D.etats[e].icone)}${D.etats[e].long}</span>`;
  const cahier = (titre, sous, k, visuel) => `<div class="cahier" style="${vars(k)}"><div class="cahier__couv"><div class="cahier__vignette">${visuel}</div><div class="etiquette"><h3>${titre}</h3><p>${sous}</p></div><div class="cahier__couv-bas"></div></div></div>`;

  // Pile de cahiers
  const img = f => `<img src="assets/img/${f}.jpg" alt="">`;
  const defaut = f => img('ill-defaut-' + f);
  const pile = [
    ['Le dernier bac', 'Chapitre 1', 'bleuet', img('photo-cabane')],
    ['La clairière aux cloches', 'Chapitre 3', 'tournesol', img('ill-cloches')],
    ['La lisière', 'Chapitre 1', 'lagon', img('ill-lisiere')],
    ['Le sanctuaire', 'Chapitre 4', 'lilas', img('ill-sanctuaire')],
    ['Le sommet', 'Chapitre 2', 'coquelicot', img('ill-sommet')]
  ];
  $('#pile').innerHTML = pile.map((p, i) => `<div class="pile__item" style="--i:${i}">${cahier(...p)}</div>`).join('');

  $('#nuancier').innerHTML = Object.values(D.couleurs).map(c => `<div class="nuance" style="--edge:${c.edge};--band:${c.band};--tint:${c.tint}"><span class="nuance__dos"></span><span class="nuance__nom">${c.nom}</span></div>`).join('');
  $('#tampons').innerHTML = ['cours', 'valider', 'reprendre', 'valide', 'prete'].map(tampon).join('');
  document.querySelectorAll('.demo-fiche .tampon').forEach(t => { t.outerHTML = tampon('valider'); });
  $('.choix-demo').innerHTML = `${ic('i-choix')}2 choix → <span class="code">S018</span>, <span class="code">S017</span>`;

  // Mini carte de sentiers
  $('#sentier').innerHTML = `<svg viewBox="0 0 420 170" role="img" aria-label="Deux scènes reliées par des choix, et un raccord vers un autre chapitre">
    <defs><marker id="pf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#4A5157"/></marker>
    <marker id="pg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#8A9097"/></marker></defs>
    <g font-family="Atkinson Hyperlegible Next, sans-serif">
      <rect x="6" y="30" width="160" height="112" rx="9" fill="#fff" stroke="#C2C7BF"/>
      <text x="18" y="52" font-family="Atkinson Hyperlegible Mono, monospace" font-weight="700" font-size="13" fill="#4A5157">S016</text>
      <line x1="16" y1="61" x2="156" y2="61" stroke="#E8A0A9" stroke-width="1.5"/>
      <text x="18" y="80" font-weight="700" font-size="12.5" fill="#1E2226">Souche creuse</text>
      <rect x="6" y="94" width="160" height="48" rx="0" fill="#F8F9F6"/><path d="M6 94h160" stroke="#C2C7BF" stroke-dasharray="3 3"/>
      <text x="16" y="113" font-size="11" fill="#4A5157">Sortir de la souche</text><circle cx="166" cy="109" r="3.5" fill="#4A5157"/>
      <text x="16" y="134" font-size="11" fill="#4A5157">Rester caché</text><circle cx="166" cy="130" r="3.5" fill="#4A5157"/>
      <path d="M170 109 C210 109 210 44 244 44" fill="none" stroke="#4A5157" stroke-width="1.8" marker-end="url(#pf)"/>
      <path d="M170 130 C220 130 220 128 244 128" fill="none" stroke="#4A5157" stroke-width="1.8" marker-end="url(#pf)"/>
      <rect x="248" y="20" width="120" height="50" rx="9" fill="#fff" stroke="#C2C7BF"/>
      <text x="260" y="41" font-family="Atkinson Hyperlegible Mono, monospace" font-weight="700" font-size="13" fill="#4A5157">S018</text>
      <text x="260" y="60" font-size="11.5" font-weight="700" fill="#1E2226">Clairière</text>
      <rect x="248" y="104" width="120" height="50" rx="9" fill="#fff" stroke="#C2C7BF"/>
      <text x="260" y="125" font-family="Atkinson Hyperlegible Mono, monospace" font-weight="700" font-size="13" fill="#4A5157">S017</text>
      <text x="260" y="144" font-size="11.5" font-weight="700" fill="#1E2226">La chouette</text>
      <path d="M370 129 C392 129 396 150 412 150" fill="none" stroke="#8A9097" stroke-width="1.8" stroke-dasharray="4 4" marker-end="url(#pg)"/>
    </g></svg>`;

  // Illustrations
  $('#mondes').innerHTML = [['ill-quai', 'Quai aux lanternes'], ['ill-lisiere', 'Lisière'], ['ill-foret', 'Forêt engloutie'], ['ill-gue', 'Gué des saules'], ['ill-cloches', 'Clairière aux cloches'], ['ill-sanctuaire', 'Sanctuaire'], ['ill-moulin', 'Moulin'], ['ill-racines', 'Racines'], ['ill-tour', 'Tour du passeur'], ['ill-escalier', 'Escalier de brume'], ['ill-sommet', 'Sommet']].map(([f, n]) => `<figure class="monde">${img(f)}<figcaption>${n}</figcaption></figure>`).join('');
  $('#teintes').innerHTML = [['foret', 'Forêt', 'prairie'], ['mer', 'Mer', 'bleuet'], ['montagne', 'Montagne', 'lagon'], ['cite', 'Cité', 'coquelicot'], ['desert', 'Désert', 'tournesol']].map(([f, n, k]) => cahier(n, 'par défaut', k, defaut(f))).join('');
  $('#imports').innerHTML = [['Le dernier bac', 'bleuet', 'photo-cabane', 'photographie'], ['Le gué des saules', 'prairie', 'ill-gue', 'illustration']].map(([t, k, f, sous]) => cahier(t, sous, k, img(f))).join('');

  // Pastilles
  const neutres = [['Bureau', '#F1F2EE', 'fond adulte'], ['Feuille', '#FFFFFF', 'lecture, écriture'], ['Trait', '#DCDFD8', 'bordures'], ['Graphite', '#1E2226', 'texte · 16:1'], ['Graphite 2', '#4A5157', 'secondaire · 8:1'], ['Graphite 3', '#636B72', 'discret · 5,4:1'], ['Canard', '#0B6A73', 'actions · 6,3:1'], ['Filet bristol', '#E8A0A9', 'décor']];
  $('#neutres').innerHTML = neutres.map(([n, c, r]) => `<li><span class="pastille-grande" style="background:${c}"></span><b>${n}</b><span class="code">${c}</span><span>${r}</span></li>`).join('');
  const ratios = { cours: '6,9', valider: '5,9', reprendre: '5,7', valide: '5,9', prete: '6,9' };
  $('#etats').innerHTML = Object.keys(ratios).map(e => `<li>${tampon(e)}<span>${ratios[e]}:1</span></li>`).join('');

  // Déclinaisons
  $('#decli-adulte').innerHTML = `<div class="mini mini--adulte"><div class="mini__barre"><b>You Are a Hero</b><span>Mes projets</span><span>Mes classes</span><span>Suivi</span></div>
    <div class="mini__tete"><img src="assets/img/ill-quai.jpg" alt=""><div><p class="mini__titre">Les passeurs de brume</p><p>Classe CM1-CM2 · 25 élèves · Récit à choix</p></div></div>
    <p class="mini__reste">Reste à préparer : <span>1 chapitre sans scène</span><span>4 consignes à ajouter</span></p>
    <div class="mini__cahiers">${['lagon', 'prairie', 'tournesol'].map((k, i) => cahier(['La lisière', 'Le gué des saules', 'La clairière'][i], `Chapitre ${i + 1}`, k, i === 0 ? img('ill-lisiere') : i === 1 ? img('ill-gue') : img('ill-cloches'))).join('')}</div></div>`;
  $('#decli-eleve').innerHTML = `<div class="mini mini--eleve" style="${vars('lagon')}"><div class="mini__barre"><b>You Are a Hero</b><span class="identite"><span class="gommette gommette--s" style="--g:#C43E28">Al</span><span class="main">Alice</span></span></div>
    <div class="mini__accueil"><img src="assets/img/ill-quai.jpg" alt=""><div><p class="accueil-main">Bonjour Alice</p><p class="mini__titre">Les passeurs de brume</p><p>Ton chapitre : <b>La lisière</b>. Tu t’occupes de 3 scènes.</p><span class="btn btn--primaire">Ouvrir La lisière</span></div></div></div>`;
});
