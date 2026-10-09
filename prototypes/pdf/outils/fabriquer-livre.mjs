// Fabrique le livre d'essai : « Les passeurs de brume », livre à choix de
// 60 scènes en trois parties, textes de longueurs très inégales, 30 images
// dont des pleines pages et des dessins peu définis, phrases à deux renvois,
// actions de jeu, images en ligne, feuille d'aventure. Tirage à graine fixe :
// deux fabrications donnent le même livre.
//
//   node outils/fabriquer-livre.mjs            → sorties/livre-essai/
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = join(RACINE, 'sorties', 'livre-essai');

// --- Hasard à graine fixe ---------------------------------------------------
function graine(n) {
  let a = n >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const alea = graine(20261003);
const entier = (min, max) => min + Math.floor(alea() * (max - min + 1));
const parmi = (liste) => liste[Math.floor(alea() * liste.length)];
function melanger(liste) {
  const l = [...liste];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

// --- Matière du récit -------------------------------------------------------
// Espaces : U+00A0 avant « : » et dans les guillemets, U+202F avant ; ! ?
const NBSP = ' ';
const FINE = ' ';
const typo = (s) =>
  s
    .replace(/ ([;!?])/g, `${FINE}$1`)
    .replace(/ :/g, `${NBSP}:`)
    .replace(/« /g, `«${NBSP}`)
    .replace(/ »/g, `${NBSP}»`);

const LIEUX = {
  P1: ['la lisière', 'le sentier des fougères', 'la clairière aux pierres levées', 'le vieux pont de cordes', 'la cabane du passeur', 'le ruisseau endormi'],
  P2: ['le marais', 'la passerelle engloutie', 'le village sur pilotis', 'la barque abandonnée', "l'île aux roseaux", 'le chemin de planches'],
  P3: ['la tour des brumes', "l'escalier en colimaçon", 'la salle des cartes', 'la galerie des miroirs', 'le sommet de la tour', 'la bibliothèque oubliée'],
};
const COMPAGNONS = ['le passeur', 'la vieille herboriste', 'le hibou gris', 'la jeune éclaireuse', 'le marchand de lanternes', "l'enfant du village"];
const OBJETS = ["la clé d'argent", 'la lanterne sourde', 'le couteau de poche', 'la corde tressée', 'la carte déchirée', 'le sifflet en os', 'la boussole fêlée'];

const PHRASES = [
  "Tu avances prudemment vers {lieu}, et chaque pas s'enfonce dans une terre molle qui garde longtemps l'empreinte de tes semelles.",
  "La brume s'épaissit autour de toi, si dense que tu distingues à peine le bout de tes doigts lorsque tu tends le bras.",
  "Quelque part sur ta gauche, une branche craque ; tu retiens ton souffle et tu attends, immobile, que le silence revienne.",
  "{Compagnon} t'observe sans rien dire, puis hoche lentement la tête, comme si ta présence ici était attendue depuis longtemps.",
  "Tu te souviens des recommandations entendues au village : ne jamais quitter le chemin, ne jamais répondre aux voix, ne jamais regarder en arrière.",
  "Une odeur de mousse humide et de bois brûlé flotte dans l'air, mêlée à quelque chose de plus sucré que tu ne parviens pas à reconnaître.",
  "Au loin, une cloche sonne trois coups, étouffés par l'épaisseur du brouillard, et tu comprends que la nuit tombera bientôt.",
  "Tu serres {objet} contre toi : c'est peu de chose, mais c'est tout ce qu'il te reste de ton départ précipité.",
  "Le sol tremble légèrement sous tes pieds, puis tout redevient calme, extraordinairement calme, comme si la forêt entière écoutait.",
  "« Tu n'aurais pas dû venir seul, murmure {compagnon}. Ceux qui traversent sans guide ne retrouvent pas toujours leur ombre. »",
  "Entre les troncs, tu aperçois une lueur vacillante qui s'éloigne dès que tu t'en approches, puis qui t'attend, patiemment, un peu plus loin.",
  "Tes vêtements sont trempés, tes mains engourdies, et pourtant une étrange chaleur te gagne à mesure que tu progresses.",
  "Devant toi, {lieu} apparaît enfin, exactement comme sur le dessin griffonné que tu gardes dans ta poche depuis le début du voyage.",
  "Tu hésites : rebrousser chemin serait plus sage, mais la curiosité te pousse en avant, irrésistiblement.",
  "Des silhouettes passent à la limite de ton regard, trop rapides pour être des animaux, trop silencieuses pour être des voyageurs.",
  "« Écoute bien, dit {compagnon}. La brume ne ment jamais, mais elle ne dit jamais toute la vérité non plus. »",
  "Le vent se lève brusquement et déchire le brouillard ; pendant quelques secondes, tu découvres l'étendue immense qui t'entoure.",
  "Tu t'accroupis pour examiner les traces : quelqu'un est passé par ici il y a peu, quelqu'un qui boitait et traînait un lourd fardeau.",
  "Une inscription est gravée dans la pierre, à demi effacée par les années ; tu en déchiffres quelques mots, sans en saisir le sens.",
  "Ton cœur bat plus vite. Tu sais que la prochaine décision comptera davantage que toutes celles que tu as prises jusqu'ici.",
  "L'eau clapote doucement contre les planches vermoulues, et de longues herbes noires ondulent sous la surface comme des chevelures.",
  "Tu repenses à ta sœur, restée au village, et à la promesse que tu lui as faite de revenir avant la première neige.",
  "Rien ne bouge. Pas un oiseau, pas un insecte, pas même le frémissement d'une feuille : seulement ta respiration, trop bruyante.",
  "{Compagnon} sort de sa besace un petit paquet enveloppé de tissu et te le tend, sans un mot d'explication.",
  "La fatigue alourdit tes paupières, mais tu refuses de t'arrêter : dormir ici serait la pire des imprudences.",
  "Tu poses la main sur le bois froid, et la porte s'entrouvre d'elle-même dans un long gémissement.",
  "Un rire léger résonne au-dessus de toi, quelque part dans les branches, puis s'éteint aussi soudainement qu'il était venu.",
  "Les anciens racontaient qu'un passeur attendait autrefois ici les voyageurs égarés, et qu'il demandait toujours le même prix : un souvenir.",
  "Tu comptes mentalement tes provisions ; il te reste de quoi tenir deux jours, peut-être trois si tu te montres raisonnable.",
  "« Par ici ! » crie une voix que tu crois reconnaître. Tu te retournes, mais il n'y a personne.",
  "La lumière change : le gris devient doré, puis rose, et les ombres s'allongent démesurément sur le sol détrempé.",
  "Tu glisses, tu te rattrapes de justesse à une racine, et {objet} manque de t'échapper des mains.",
  "Plus tu avances, plus le chemin se resserre, jusqu'à n'être plus qu'un mince ruban de terre entre deux étendues d'eau sombre.",
  "Il te semble entendre une mélodie, très faible, jouée sur un instrument que tu ne connais pas ; elle vient de {lieu}.",
  "Tu inspires profondément. Quoi qu'il arrive maintenant, tu ne pourras pas dire que tu n'avais pas été prévenu.",
  "Une chouette s'envole lourdement à ton passage et disparaît dans la grisaille, emportant avec elle le dernier bruit familier.",
  "« Nous y sommes presque, souffle {compagnon}. Ne lâche surtout pas la corde, quoi que tu voies. »",
  "Le froid te mord les joues. Tu enfonces ton bonnet sur tes oreilles et tu reprends ta marche, un pied devant l'autre.",
  "Sur la table, quelqu'un a laissé une chandelle allumée, un bol encore tiède et une lettre dont l'encre n'a pas fini de sécher.",
  "Tu voudrais appeler, mais ta voix reste coincée dans ta gorge ; alors tu frappes dans tes mains, deux fois, et tu attends.",
];

const INCIPITS = [
  "Le jour se lève à peine lorsque tu quittes le village.",
  "Tu n'aurais jamais cru que le chemin serait aussi long.",
  "Tout est arrivé très vite.",
  "Il fait presque nuit quand tu atteins {lieu}.",
  "Tu reprends ton souffle, adossé à un tronc.",
  "Le silence qui suit est pire que le vacarme.",
  "Cette fois, tu n'as plus le choix.",
  "Une surprise t'attend à {lieu}.",
];

const LIBELLES = [
  'Suivre la lueur', 'Traverser le pont', 'Faire demi-tour', 'Appeler à l\'aide', 'Ouvrir la porte', 'Longer la rive',
  'Suivre le chant', 'Grimper à l\'arbre', 'Attendre le matin', 'Descendre l\'escalier', 'Prendre la barque', 'Fouiller la cabane',
  'Parler au passeur', 'Se cacher dans les roseaux', 'Allumer la lanterne', 'Suivre les traces', 'Monter au sommet', 'Lire l\'inscription',
];

const ACTIONS = [
  'Retire un point de volonté à ton héros.',
  'Ajoute {objet} à ton inventaire.',
  'Avance le temps de deux cases sur ta feuille d\'aventure.',
  'Gagne un point de volonté : tu as repris courage.',
  'Raye {objet} de ton inventaire.',
  'Note le mot « passeur » dans tes indices.',
  'Lance un dé. Si tu fais 4 ou plus, ajoute un point de volonté ; sinon, retires-en un.',
];

const maj = (s) => s[0].toUpperCase() + s.slice(1);
function remplir(modele, partie) {
  const c = parmi(COMPAGNONS);
  return typo(
    modele
      .replace('{lieu}', parmi(LIEUX[partie]))
      .replace('{Compagnon}', maj(c))
      .replace('{compagnon}', c)
      .replace('{objet}', parmi(OBJETS))
  );
}

let nBloc = 0;
const idBloc = () => `b${String(++nBloc).padStart(4, '0')}`;

/** Paragraphes de récit pour un nombre de mots visé. */
function recit(mots, partie) {
  const blocs = [];
  let total = 0;
  let premier = true;
  while (total < mots) {
    const nPhrases = mots - total < 40 ? 1 : entier(2, 7);
    const phrases = [];
    if (premier) phrases.push(remplir(parmi(INCIPITS), partie));
    premier = false;
    for (let i = 0; i < nPhrases; i++) phrases.push(remplir(parmi(PHRASES), partie));
    const texte = phrases.join(' ');
    total += texte.split(/\s+/).length;
    // Un peu de mise en forme légère (F04.1) : un mot en italique de temps en temps.
    if (alea() < 0.12) {
      const coupe = texte.indexOf(' ', Math.floor(texte.length / 2));
      const fin = texte.indexOf(' ', coupe + 1);
      blocs.push({
        type: 'p',
        id: idBloc(),
        children: [{ text: texte.slice(0, coupe + 1) }, { text: texte.slice(coupe + 1, fin), italic: true }, { text: texte.slice(fin) }],
      });
    } else {
      blocs.push({ type: 'p', id: idBloc(), children: [{ text: texte }] });
    }
  }
  return blocs;
}

// --- Plan : trois parties, soixante scènes -----------------------------------
const PARTIES = [
  { id: 'P1', titre: 'La lisière', scenes: 18 },
  { id: 'P2', titre: 'Le marais', scenes: 24 },
  { id: 'P3', titre: 'La tour des brumes', scenes: 18 },
];
const ref = (n) => `S${String(n).padStart(3, '0')}`;
const FINS = new Set([12, 17, 30, 39, 41, 55, 58, 60].map(ref));
const INACCESSIBLE = ref(37);
const ENIGME = ref(33); // liaison cachée vers S035, numéro fixé
const CIBLE_ENIGME = ref(35);
const COQUILLE = ref(5);

// Longueurs très inégales : de 30 à 1 700 mots.
function longueur(r) {
  if (FINS.has(r)) return entier(30, 140);
  const t = alea();
  if (t < 0.22) return entier(35, 120);
  if (t < 0.62) return entier(220, 480);
  if (t < 0.9) return entier(560, 900);
  return entier(1150, 1700);
}

const scenes = [];
let n = 0;
for (const partie of PARTIES) {
  for (let i = 0; i < partie.scenes; i++) {
    n += 1;
    const r = ref(n);
    scenes.push({
      id: r,
      partie: partie.id,
      titre: `${maj(parmi(LIEUX[partie.id]))} — ${parmi(LIBELLES).toLowerCase()}`,
      incluse: true,
      prete: true,
      fin: FINS.has(r),
      depart: n === 1,
      blocs: recit(longueur(r), partie.id),
    });
  }
}
const parRef = new Map(scenes.map((s) => [s.id, s]));
const indice = (r) => Number(r.slice(1));

// --- Choix : chaque scène accessible depuis le départ, sauf S037 -------------
let nChoix = 0;
const choixVers = new Map(scenes.map((s) => [s.id, []]));
const peutRecevoir = (r) => r !== INACCESSIBLE;
for (const s of scenes) {
  const i = indice(s.id);
  if (s.fin || s.id === ENIGME) continue;
  const nb = entier(1, 3);
  const cibles = new Set();
  for (let k = 0; k < nb; k++) {
    let c = Math.min(60, i + entier(1, 6));
    if (alea() < 0.08 && i > 4) c = i - entier(1, 3); // retour en arrière voulu
    if (peutRecevoir(ref(c)) && c !== i) cibles.add(ref(c));
  }
  if (!cibles.size) cibles.add(ref(Math.min(60, i + 1) === 37 ? 38 : Math.min(60, i + 1)));
  choixVers.get(s.id).push(...cibles);
}
// Toute scène a au moins une entrée venue d'une scène précédente.
for (const s of scenes) {
  const i = indice(s.id);
  if (i === 1 || s.id === INACCESSIBLE || s.id === CIBLE_ENIGME) continue;
  const entrante = scenes.some((a) => indice(a.id) < i && choixVers.get(a.id).includes(s.id));
  if (!entrante) {
    for (let k = i - 1; k >= 1; k--) {
      const a = parRef.get(ref(k));
      if (!a.fin && a.id !== ENIGME && a.id !== INACCESSIBLE) {
        choixVers.get(a.id).push(s.id);
        break;
      }
    }
  }
}
choixVers.get(ref(17)).push(ref(1)); // fin portant « retenter ta chance » (F11-AC34)

const DEUX_RENVOIS = new Set([8, 20, 27, 44, 51].map(ref));
for (const r of DEUX_RENVOIS) {
  const cibles = choixVers.get(r);
  for (let k = 1; new Set(cibles).size < 2; k++) cibles.push(ref(indice(r) + k));
}
const renvoi = (cible) => ({ type: 'renvoi', id: `c${String(++nChoix).padStart(4, '0')}`, cible, children: [{ text: '' }] });
for (const s of scenes) {
  const cibles = [...new Set(choixVers.get(s.id))];
  if (s.id === ref(17)) {
    s.blocs.push({ type: 'choix', id: idBloc(), mode: 'perso', libelle: 'Retenter ta chance', construction: 0, children: [{ text: 'Tu peux retenter ta chance au ' }, renvoi(ref(1)), { text: '.' }] });
    continue;
  }
  if (DEUX_RENVOIS.has(s.id) && cibles.length >= 2) {
    const [a, b, ...reste] = cibles;
    s.blocs.push({
      type: 'choix',
      id: idBloc(),
      mode: 'perso',
      libelle: "Si tu as la clé d'argent",
      construction: 0,
      children: [
        { text: "Si tu as la clé d'argent, ouvre la porte au " },
        renvoi(a),
        { text: typo(' ; sinon, déchiffre les symboles au ') },
        renvoi(b),
        { text: '.' },
      ],
    });
    cibles.splice(0, cibles.length, ...reste);
  }
  for (const c of cibles) {
    s.blocs.push({ type: 'choix', id: idBloc(), mode: 'auto', libelle: parmi(LIBELLES), construction: entier(0, 3), children: [renvoi(c)] });
  }
}

// --- Actions de jeu, images en ligne, coquille --------------------------------
const AVEC_ACTION = [3, 6, 9, 14, 15, 21, 24, 28, 31, 36, 40, 45, 48, 52, 57].map(ref);
for (const r of AVEC_ACTION) {
  const s = parRef.get(r);
  const premierChoix = s.blocs.findIndex((b) => b.type === 'choix');
  const place = premierChoix === -1 ? s.blocs.length : entier(Math.max(1, premierChoix - 1), premierChoix);
  s.blocs.splice(place, 0, { type: 'action', id: idBloc(), children: [{ text: typo(parmi(ACTIONS).replace('{objet}', parmi(OBJETS))) }] });
}
// S015 porte l'exemple de F04-AC17.
parRef.get(ref(15)).blocs.find((b) => b.type === 'action').children = [{ text: 'Ajoute le couteau à ton inventaire.' }];

// Image en ligne dans un paragraphe d'énigme, dans un paragraphe long et dans une action de jeu.
const enigme = parRef.get(ENIGME);
enigme.titre = 'La porte aux symboles';
enigme.liaisonsCachees = [{ cible: CIBLE_ENIGME }];
enigme.blocs = [
  ...recit(180, 'P2'),
  {
    type: 'p',
    id: idBloc(),
    children: [
      { text: typo("Trois symboles sont gravés sur le linteau de la porte : ") },
      { type: 'image-ligne', src: 'images/symbole-rune.png', alt: 'une rune' },
      { text: ', puis ' },
      { type: 'image-ligne', src: 'images/symbole-rose.png', alt: 'une rose des vents' },
      { text: ' et enfin ' },
      { type: 'image-ligne', src: 'images/symbole-cle.png', alt: 'une clé' },
      { text: typo(". Tu les as déjà vus quelque part, chacun accompagné d'un chiffre ; additionne ces trois chiffres, multiplie le résultat par deux, et tu sauras à quel passage te rendre. Prends ton temps : la brume, elle, n'est pas pressée, et la porte ne s'ouvrira pas une seconde fois si tu te trompes.") },
    ],
  },
  ...recit(60, 'P2'),
];
const sceneRune = parRef.get(ref(22));
sceneRune.blocs.splice(1, 0, {
  type: 'p',
  id: idBloc(),
  children: [
    { text: typo("Sur l'écorce, quelqu'un a tracé au couteau une marque étrange, ") },
    { type: 'image-ligne', src: 'images/symbole-rune.png', alt: 'une rune' },
    { text: typo(", suivie du chiffre 4. Tu la recopies soigneusement dans ton carnet, sans trop savoir pourquoi, avec le sentiment diffus qu'elle te servira plus tard, bien plus loin, lorsque le marais aura laissé place à des murs de pierre et que tu chercheras désespérément par où continuer.") },
  ],
});
parRef.get(ref(24)).blocs.find((b) => b.type === 'action').children = [
  { text: "Ajoute la clé d'argent " },
  { type: 'image-ligne', src: 'images/symbole-cle.png', alt: 'une clé' },
  { text: ' à ton inventaire.' },
];
parRef.get(CIBLE_ENIGME).titre = 'La salle des brumes';
parRef.get(INACCESSIBLE).titre = 'Le passage oublié';

// La coquille de F11-AC27, dans une scène déclarée prête.
const coquille = parRef.get(COQUILLE);
coquille.blocs[0].children = [{ text: typo("Tu marches depuis une heure lorsque la brume s'épaissi brusquement. Les arbres disparaissent un à un, avalés par une blancheur silencieuse, et tu ne vois bientôt plus que tes propres pieds sur le sentier.") }];

// --- Images en bloc : trente, avec pleines pages et dessins peu définis --------
const images = [];
const placeImage = (r, image) => {
  const s = parRef.get(r);
  const premierChoix = s.blocs.findIndex((b) => b.type === 'choix' || b.type === 'action');
  const max = premierChoix === -1 ? s.blocs.length : premierChoix;
  s.blocs.splice(entier(Math.min(1, max), max), 0, image);
};
const plan = [
  // [scène, genre, largeur]
  [1, 'paysage', 'pleine'], [2, 'paysage', 'moyenne'], [4, 'portrait', 'page'], [6, 'dessin', 'pleine'],
  [7, 'paysage', 'petite'], [9, 'paysage', { pourcent: 60 }], [10, 'carre', 'moyenne'], [13, 'portrait', 'page'],
  [16, 'paysage', 'pleine'], [18, 'dessin', 'moyenne'], [19, 'paysage', 'pleine'], [21, 'carre', 'petite'],
  [23, 'portrait', 'page'], [25, 'paysage', 'moyenne'], [26, 'dessin', 'pleine'], [28, 'paysage', { pourcent: 80 }],
  [29, 'carre', 'moyenne'], [32, 'portrait', 'page'], [34, 'paysage', 'pleine'], [36, 'paysage', 'petite'],
  [38, 'dessin', 'pleine'], [42, 'paysage', 'moyenne'], [43, 'paysage', 'pleine'], [46, 'portrait', 'page'],
  [47, 'carre', { pourcent: 45 }], [49, 'paysage', 'moyenne'], [50, 'portrait', 'moyenne'], [53, 'paysage', 'pleine'],
  [56, 'portrait', 'page'], [59, 'paysage', 'pleine'],
];
const TAILLES = { paysage: [1500, 1000], carre: [1100, 1100], portrait: [1340, 2040], dessin: [340, 250] };
plan.forEach(([nScene, genre, largeur], k) => {
  const nom = `images/ill-${String(k + 1).padStart(2, '0')}-${genre}.jpg`;
  const px = TAILLES[genre];
  images.push({ nom, genre, px, teinte: entier(0, 359), graine: entier(1, 9999) });
  placeImage(ref(nScene), { type: 'image', id: idBloc(), src: nom, px, largeur, alt: `Illustration ${k + 1}` });
});

// --- Ordre imprimé : donnée d'entrée (le mélange de F11.5 n'est pas l'objet) ----
const ordre = [];
let debut = 1;
for (const partie of PARTIES) {
  const refs = scenes.filter((s) => s.partie === partie.id).map((s) => s.id);
  ordre.push(refs[0], ...melanger(refs.slice(1)));
  partie.ouverture = ref(debut);
  debut += partie.scenes;
}
parRef.get(CIBLE_ENIGME).numeroFixe = ordre.indexOf(CIBLE_ENIGME) + 1;

// Ajustements de composition (F11.3) : deux scènes commencent sur une nouvelle page.
parRef.get(ordre[9]).nouvellePage = true;
parRef.get(ordre[31]).nouvellePage = true;

const PRENOMS = ['Alice', 'Bilal', 'Camille', 'Djibril', 'Élise', 'Farid', 'Gabrielle', 'Hugo', 'Inès', 'Jules', 'Kenza', 'Léo', 'Maëlle', 'Nathan', 'Océane', 'Paul', 'Quentin', 'Romane', 'Sacha', 'Théo', 'Ulysse', 'Valentine', 'Wassim', 'Yasmine', 'Zoé'];

const livre = {
  titre: 'Les passeurs de brume',
  sousTitre: 'Un livre dont tu es le héros',
  signature: 'Classe de CM1-CM2 — École des Tilleuls',
  annee: '2026-2027',
  reglages: { formule: 'rends-toi au', titresDePartie: true, marqueFin: 'Fin', des: 1 },
  parties: PARTIES.map(({ id, titre, ouverture }) => ({ id, titre, ouverture })),
  scenes,
  ordre,
  presentation: {
    commentLire: {
      paragraphes: [
        "Ce livre ne se lit pas de la première à la dernière page. Il est découpé en passages numérotés, et c'est toi qui décides de la route à suivre.",
        "Commence au passage 1. À la fin de chaque passage, on te propose un ou plusieurs choix : rends-toi au numéro indiqué, et poursuis ta lecture à partir de là.",
        typo("Parfois, aucun numéro n'est donné : une énigme te permet de le trouver toi-même. Si tu arrives au mot « Fin », ton aventure s'arrête… mais rien ne t'empêche de recommencer et d'essayer un autre chemin."),
      ],
      regles: [
        typo("Avant de commencer, prends ta feuille d'aventure. Ton héros possède 5 points de volonté et dispose de 12 cases de temps."),
        typo("Quand un encadré te demande d'ajouter ou de retirer quelque chose, fais-le aussitôt sur ta feuille : personne ne le vérifiera à ta place."),
        typo("Si un passage te demande de lancer un dé, lance-le une seule fois et lis la suite qui correspond à ton résultat."),
      ],
    },
    feuille: {
      sections: [
        { type: 'compteurs', titre: 'Ton héros', compteurs: [{ nom: 'Volonté', depart: 5 }, { nom: 'Temps', depart: 12 }] },
        { type: 'liste', titre: 'Inventaire', lignes: 8 },
        { type: 'notes', titre: 'Numéros et indices' },
      ],
    },
    auteurs: PRENOMS,
    fin: { paragraphes: ["Ce livre a été imaginé, écrit et illustré par les élèves de la classe.", 'Merci à toutes celles et ceux qui ont relu nos passages.'] },
  },
};

// --- Fichiers d'images : dessinés par Chromium, sans autre outil ---------------
// Le grain imite un dessin numérisé : sans lui, des aplats pèseraient dix fois
// moins qu'un vrai scan et la taille du PDF ne serait pas représentative.
function svgPaysage({ px: [w, h], teinte, graine: g }) {
  const r = graine(g);
  const collines = [0, 1, 2, 3]
    .map((i) => {
      const y = h * (0.45 + i * 0.13);
      let d = `M0 ${h} L0 ${y}`;
      for (let x = 0; x <= w; x += w / 8) d += ` Q${x + w / 16} ${y - r() * h * 0.16} ${x + w / 8} ${y + (r() - 0.5) * h * 0.05}`;
      return `<path d="${d} L${w} ${h} Z" fill="hsl(${(teinte + i * 18) % 360} ${38 + i * 6}% ${72 - i * 13}%)"/>`;
    })
    .join('');
  const arbres = Array.from({ length: 14 }, () => {
    const x = r() * w, y = h * (0.62 + r() * 0.3), t = h * (0.05 + r() * 0.09);
    return `<rect x="${x - t * 0.07}" y="${y}" width="${t * 0.14}" height="${t * 0.7}" fill="#5b4636"/><ellipse cx="${x}" cy="${y}" rx="${t * 0.45}" ry="${t * 0.75}" fill="hsl(${(teinte + 90) % 360} 35% ${30 + r() * 20}%)"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="${g}"/><feColorMatrix values="1.4 0 0 0 0.1  0 1.4 0 0 0.1  0 0 1.4 0 0.1  0 0 0 0.6 0"/><feComposite operator="in" in2="SourceGraphic"/><feBlend in="SourceGraphic" mode="multiply"/></filter></defs>
  <g filter="url(#grain)"><rect width="${w}" height="${h}" fill="hsl(${(teinte + 200) % 360} 55% 88%)"/>
  <circle cx="${w * (0.2 + r() * 0.6)}" cy="${h * 0.22}" r="${h * 0.09}" fill="#fff3c4"/>${collines}${arbres}
  <rect x="${w * 0.7}" y="${h * 0.3}" width="${w * 0.05}" height="${h * 0.35}" fill="#4a4e69"/><path d="M${w * 0.69} ${h * 0.3} L${w * 0.725} ${h * 0.2} L${w * 0.76} ${h * 0.3} Z" fill="#9a8c98"/></g></svg>`;
}
function svgDessin({ px: [w, h], graine: g }) {
  // Dessin d'élève photographié : traits de crayon sur papier, petite définition.
  const r = graine(g);
  const traits = Array.from({ length: 26 }, () => `<path d="M${r() * w} ${r() * h} q${(r() - 0.5) * 90} ${(r() - 0.5) * 90} ${(r() - 0.5) * 140} ${(r() - 0.5) * 120}" stroke="hsl(${r() * 360} 55% 38%)" stroke-width="${1 + r() * 2.5}" fill="none" stroke-linecap="round"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#f4f0e6"/>
  <circle cx="${w * 0.3}" cy="${h * 0.4}" r="${h * 0.2}" fill="none" stroke="#333" stroke-width="2"/><path d="M${w * 0.5} ${h * 0.8} l${w * 0.12} -${h * 0.5} l${w * 0.12} ${h * 0.5} z" fill="none" stroke="#333" stroke-width="2"/>${traits}</svg>`;
}
const SYMBOLES = {
  // Symboles détaillés : traits fins, à juger une fois imprimés à la hauteur du texte.
  'symbole-rune': `<circle cx="120" cy="120" r="104" fill="none" stroke="#1b1b1b" stroke-width="10"/><path d="M120 34 V206 M120 62 L176 104 L120 146 M120 100 L72 136 M120 150 L164 182" stroke="#1b1b1b" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="72" cy="78" r="9" fill="#1b1b1b"/><circle cx="170" cy="150" r="6" fill="#1b1b1b"/>`,
  'symbole-rose': `<circle cx="120" cy="120" r="100" fill="none" stroke="#1b1b1b" stroke-width="7"/><circle cx="120" cy="120" r="66" fill="none" stroke="#1b1b1b" stroke-width="3"/>${Array.from({ length: 16 }, (_, i) => `<path d="M120 120 L${120 + (i % 2 ? 60 : 98) * Math.cos((i * Math.PI) / 8)} ${120 + (i % 2 ? 60 : 98) * Math.sin((i * Math.PI) / 8)}" stroke="#1b1b1b" stroke-width="${i % 4 === 0 ? 9 : 4}"/>`).join('')}<circle cx="120" cy="120" r="12" fill="#b23a48"/>`,
  'symbole-cle': `<circle cx="70" cy="120" r="44" fill="none" stroke="#1b1b1b" stroke-width="14"/><circle cx="70" cy="120" r="14" fill="#c9a227"/><path d="M114 120 H224 M176 120 V158 M200 120 V150 M224 120 V166" stroke="#1b1b1b" stroke-width="14" fill="none" stroke-linecap="round"/>`,
};

async function ecrireImages() {
  mkdirSync(join(SORTIE, 'images'), { recursive: true });
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ deviceScaleFactor: 1 });
  for (const image of images) {
    const [w, h] = image.px;
    await page.setViewportSize({ width: w, height: h });
    const svg = image.genre === 'dessin' ? svgDessin(image) : svgPaysage(image);
    await page.setContent(`<body style="margin:0">${svg}</body>`);
    await page.screenshot({ path: join(SORTIE, image.nom), type: 'jpeg', quality: image.genre === 'dessin' ? 60 : 90 });
  }
  await page.setViewportSize({ width: 240, height: 240 });
  for (const [nom, contenu] of Object.entries(SYMBOLES)) {
    await page.setContent(`<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">${contenu}</svg></body>`);
    await page.screenshot({ path: join(SORTIE, 'images', `${nom}.png`), omitBackground: true });
  }
  await navigateur.close();
}

mkdirSync(SORTIE, { recursive: true });
writeFileSync(join(SORTIE, 'livre.json'), JSON.stringify(livre, null, 1));
const mots = scenes.reduce((t, s) => t + s.blocs.filter((b) => b.children).reduce((u, b) => u + b.children.map((c) => c.text ?? '').join('').split(/\s+/).length, 0), 0);
console.log(`Livre d'essai : ${scenes.length} scènes, ${mots} mots, ${images.length} images en bloc, ${nChoix} renvois.`);
if (!process.argv.includes('--sans-images') || !existsSync(join(SORTIE, 'images'))) await ecrireImages();
console.log(`Écrit dans ${SORTIE}`);
