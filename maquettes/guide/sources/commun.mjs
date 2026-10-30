// Maquettes du guide « Comment écrire un livre dont vous êtes le héros avec sa classe ».
// Lit les « Premier jet » de docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md, tels quels,
// et prépare ce que les trois directions partagent (voir construire.mjs).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ici = path.dirname(fileURLToPath(import.meta.url));
const racine = path.resolve(ici, "..");
const source = path.resolve(racine, "../../docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md");

// La typographie française de la page : apostrophe courbe, espaces insécables (le texte ne change pas)
const typo = (l) =>
  l
    .replace(/'/g, "’")
    .replace(/« /g, "«\u00a0")
    .replace(/ »/g, "\u00a0»")
    .replace(/ ([?!;:])/g, "\u202f$1");

// ——— Lecture des jets ———
const lignes = fs.readFileSync(source, "utf8").split("\n");
const jets = [];
for (let i = 0; i < lignes.length; i++) {
  if (lignes[i].trim() !== "#### Premier jet") continue;
  let j = i + 1;
  while (j < lignes.length && !lignes[j].startsWith(">")) j++;
  const bloc = [];
  while (j < lignes.length && lignes[j].startsWith(">")) bloc.push(typo(lignes[j++].replace(/^> ?/, "")));
  jets.push(bloc);
}
if (jets.length !== 14) throw new Error(`14 jets attendus, ${jets.length} trouvés`);

const morceaux = (bloc) => {
  const out = [];
  let cur = [];
  for (const l of bloc) {
    if (l.trim() === "") {
      if (cur.length) out.push(cur), (cur = []);
    } else cur.push(l);
  }
  if (cur.length) out.push(cur);
  return out;
};

const IDS = ["pourquoi", "age", "commencer", "inventer", "repartir", "combien", "choix", "relire", "objets", "chemins", "temps", "illustrer", "erreurs"];

const parties = jets.slice(1).map((bloc, k) => {
  const ms = morceaux(bloc);
  const titre = ms[0][0].replace(/^## /, "");
  return { n: k + 1, id: IDS[k], titre, corps: ms.slice(1) };
});
const titreVersId = new Map(parties.map((p) => [p.titre, p]));

// ——— Mise en forme du texte ———
const echapper = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function enLigne(s, { renvoi } = {}) {
  let h = echapper(s);
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => `<a href="${u === "…" ? "#" : u}">${t}</a>`);
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // « (voir « Titre ? ») » : un lien vers la partie, et son numéro en renvoi
  h = h.replace(/\(voir «\s?([^»]+?)\s?»\)/g, (m, t) => {
    const p = titreVersId.get(t.trim());
    if (!p) return m;
    return `(voir <a class="voir" href="#${p.id}">«\u00a0${t.trim()}\u00a0»</a>${renvoi ? `<span style="white-space:nowrap">${renvoi(p)})</span>` : ")"}`;
  });
  return h;
}

/** Les sortes de morceaux d'une partie, pour que chaque direction les habille à sa façon. */
function classer(m) {
  const t = m.join(" ");
  if (m[0].startsWith("- ")) {
    const items = [];
    for (const l of m) l.startsWith("- ") ? items.push(l.slice(2)) : (items[items.length - 1] += " " + l.trim());
    return { sorte: "liste", items };
  }
  if (m[0].startsWith("|")) {
    const rangs = m.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
    return { sorte: "tableau", entete: rangs[0], rangs: rangs.slice(1) };
  }
  if (t.startsWith("**Dans ma classe.**")) return { sorte: "classe", texte: t.replace("**Dans ma classe.**", "").trim() };
  if (t.startsWith("*Encart.*")) return { sorte: "encart", texte: t.replace("*Encart.*", "").trim() };
  const tete = t.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
  if (tete) return { sorte: "p", tete: tete[1], texte: tete[2] };
  return { sorte: "p", texte: t };
}
parties.forEach((p) => (p.corps = p.corps.map(classer)));

// ——— Le haut ———
const haut = morceaux(jets[0]);
const H = {
  titre: haut[0][0].replace(/^# /, ""),
  definition: haut[1].join(" "),
  auteur: haut[2].join(" ").replace(/^\*|\*$/g, ""),
  enBref: classer(haut[4]).items,
  plusLoin: haut.find((m) => m[0].startsWith("**Pour aller plus loin")).join(" ").replace(/^\*\*Pour aller plus loin\s?:\*\*\s*/, ""),
};
// La date se pose à la publication ; la maquette montre où elle va.
H.auteur = H.auteur.replace("Mis à jour le …", "Mis à jour le 30 octobre 2026");
const AUTEUR_NOM = "Nicolas Coussot";

// ——— Images : une par partie au plus, aucune pour décorer ———
// Les légendes sont des propositions, à valider : elles ne font pas partie du texte arrêté.
const IMG = {
  commencer: {
    apres: "Montrez que c’est possible.",
    sorte: "couvertures",
    legende: "Dans la bibliothèque : deux livres de classe et un livre d'exemple du site.",
  },
  inventer: {
    dans: "encart",
    src: "images/preparation-heros.webp",
    alt: "La Préparation d'Il était une classe : sous le héros, ce que la classe retient.",
    l: 2000, h: 1128,
  },
  combien: { apres: "Une forme simple, qui tient sur des mois.", sorte: "schemas" },
  objets: {
    avant: "classe",
    src: "images/fiche-aventure-electro-nick.jpg",
    alt: "La fiche aventure d'« Électro Nick » : volonté, boulons, rations, unités de temps, bonus aux jets, inventaire.",
    legende: "La fiche aventure d'« Électro Nick », mon plus long livre, imprimée au début du livre.",
    l: 707, h: 1000, portrait: true,
  },
  chemins: {
    dans: "encart",
    src: "images/verifier-les-chemins.jpg",
    alt: "« Vérifier les chemins » : une scène où aucun chemin ne mène, une autre dont la seule suite est une énigme.",
    l: 772, h: 1110, portrait: true,
  },
  illustrer: {
    apres: "Imprimer.",
    src: "images/photo-des-livres.webp",
    alt: "« Le labyrinthe oublié » ouvert sur sa fiche aventure et son premier passage, « Électro Nick » à côté, un crayon et un dé.",
    legende: "Deux de nos livres imprimés : « Le labyrinthe oublié », ouvert sur sa fiche aventure, et « Électro Nick ».",
    l: 1300, h: 975,
  },
};

for (const v of Object.values(IMG)) for (const k of ["legende", "alt"]) if (v[k]) v[k] = typo(v[k]);

const COUVERTURES = [
  { src: "images/couverture-electro-nick.webp", titre: "Électro Nick", note: "323 passages", l: 960, h: 1414 },
  { src: "images/couverture-labyrinthe.webp", titre: "Le labyrinthe oublié", note: "213 passages", l: 960, h: 1414 },
  { src: "images/couverture-bouquin.jpg", titre: "Bouquin mène l’enquête", note: "livre d’exemple", l: 666, h: 999 },
];

// ——— Schémas de la partie 6 : SVG simples, aux couleurs du système ———
const fleche = (id) =>
  `<defs><marker id="${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="currentColor"/></marker></defs>`;
const noeud = (x, y, cls = "") => `<rect class="sc-n ${cls}" x="${x - 9}" y="${y - 6}" width="18" height="12" rx="3"/>`;
const trait = (x1, y1, x2, y2, id, cls = "") => `<line class="sc-t ${cls}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" marker-end="url(#${id})"/>`;

function schemaArbre() {
  const id = "fa";
  let s = fleche(id);
  const niv = [[100], [56, 144], [32, 80, 120, 168], [20, 44, 68, 92, 108, 132, 156, 180]];
  const ys = [22, 62, 102, 142];
  for (let n = 0; n < niv.length - 1; n++)
    niv[n].forEach((x, i) => {
      const [a, b] = [niv[n + 1][2 * i], niv[n + 1][2 * i + 1]];
      s += `<line class="sc-t sc-gris" x1="${x}" y1="${ys[n]}" x2="${a}" y2="${ys[n + 1]}"/><line class="sc-t sc-gris" x1="${x}" y1="${ys[n]}" x2="${b}" y2="${ys[n + 1]}"/>`;
    });
  niv.forEach((r, n) => r.forEach((x) => (s += `<circle class="sc-p" cx="${x}" cy="${ys[n]}" r="${n === 3 ? 3.5 : 5}"/>`)));
  s += `<text class="sc-x" x="100" y="168" text-anchor="middle">… 1 024</text>`;
  return s;
}
function schemaBranches() {
  const id = "fb";
  let s = fleche(id);
  s += trait(100, 26, 100, 44, id) + trait(100, 56, 48, 80, id) + trait(100, 56, 100, 80, id) + trait(100, 56, 152, 80, id);
  s += trait(48, 92, 48, 112, id) + trait(152, 92, 152, 112, id);
  s += trait(48, 124, 92, 146, id) + trait(152, 124, 108, 146, id);
  s += `<line class="sc-t" x1="100" y1="92" x2="100" y2="104"/><line class="sc-fin" x1="92" y1="106" x2="108" y2="106"/>`;
  s += noeud(100, 20, "sc-entree") + noeud(100, 50) + noeud(48, 86) + noeud(100, 86) + noeud(152, 86) + noeud(48, 118) + noeud(152, 118) + noeud(100, 152, "sc-entree");
  return s;
}
function schemaCarrefour() {
  const id = "fc";
  let s = fleche(id);
  const pts = [[36, 34], [164, 34], [36, 130], [164, 130]];
  for (const [x, y] of pts) {
    // Aller et retour : le lecteur revient au carrefour
    const ux = (x - 100) / Math.hypot(x - 100, y - 82), uy = (y - 82) / Math.hypot(x - 100, y - 82);
    s += `<line class="sc-t" x1="${100 + ux * 17}" y1="${82 + uy * 17}" x2="${x - ux * 12}" y2="${y - uy * 9}" marker-start="url(#${id})" marker-end="url(#${id})"/>`;
  }
  s += `<circle class="sc-hub" cx="100" cy="82" r="15"/>`;
  for (const [x, y] of pts) s += noeud(x, y);
  s += trait(100, 98, 100, 150, id) + noeud(100, 158, "sc-entree");
  return s;
}
function schemaGoulot() {
  const id = "fd";
  let s = fleche(id);
  const xs = [26, 76, 124, 174];
  xs.forEach((x, i) => {
    s += noeud(x, 24) + trait(x, 30, x, 52, id) + noeud(x, 58);
    s += trait(x + (x < 100 ? 6 : -6), 64, 100 + (i - 1.5) * 6, 110, id);
  });
  s += `<rect class="sc-n sc-goulot" x="84" y="114" width="32" height="16" rx="4"/>` + trait(100, 130, 100, 150, id) + noeud(100, 158, "sc-entree");
  return s;
}
const SCHEMAS = [
  { nom: "L'arbre", svg: schemaArbre, ecarte: true },
  { nom: "Les branches qui se rejoignent", svg: schemaBranches },
  { nom: "Le carrefour", svg: schemaCarrefour },
  { nom: "Le goulot", svg: schemaGoulot },
];
const schemas = () =>
  `<figure class="schemas">${SCHEMAS.map(
    (s) =>
      `<div class="schema${s.ecarte ? " schema--ecarte" : ""}"><svg viewBox="0 0 200 172" role="img" aria-label="${s.nom}">${s.svg()}</svg><span>${s.nom}</span></div>`,
  ).join("")}</figure>`;

// ——— Morceaux communs aux trois directions ———
const enTete = (dir) => `<header class="tete">
  <a class="marque" href="#"><img src="images/logo.svg" alt="Il était une classe" width="236" height="47"></a>
  <nav class="nav" aria-label="Pages publiques">
    <a href="#">Bibliothèque</a><a href="#">Aide</a><a href="#" class="nav-long">Entrée des élèves</a><a href="#" class="nav-court">Élèves</a><a href="#" class="nav-cnx">Se connecter</a><a href="#" class="btn-ligne">Créer un compte</a>
  </nav>
</header>`;

const pied = () => `<footer class="pied">
  <div class="pied-haut">
    <div class="pied-marque"><img src="images/logo.svg" alt="Il était une classe" width="236" height="47"><p>Votre classe écrit son livre-jeu.</p></div>
    <div class="pied-pages">
      <div><p class="pied-titre">Commencer</p><a href="#">Créer un compte</a><a href="#">Entrée enseignant</a><a href="#">Entrée des élèves</a></div>
      <div><p class="pied-titre">Lire</p><a href="#">La bibliothèque</a><a href="#" aria-current="page">Écrire un livre-jeu</a></div>
      <div><p class="pied-titre">Besoin d'aide ?</p><a href="#">Aide</a><a href="#">Écrire au créateur</a></div>
    </div>
  </div>
  <div class="pied-bas"><span>© 2026 Il était une classe</span><a href="#">Mentions légales</a><a href="#">Confidentialité</a><a href="#">Conditions</a></div>
</footer>`;

/** Le libellé de la direction, pour qu'on sache laquelle on regarde (absent de la vraie page). */
const etiquette = (nom) => `<div class="maquette-etiquette" aria-hidden="true">Maquette · ${nom}</div>`;

function figureImage(cfg, { cadre = "" } = {}) {
  return `<figure class="photo${cfg.portrait ? " photo--portrait" : ""} ${cadre}"><img src="${cfg.src}" alt="${echapper(cfg.alt)}" width="${cfg.l}" height="${cfg.h}" loading="lazy">${cfg.legende ? `<figcaption>${echapper(cfg.legende)}</figcaption>` : ""}</figure>`;
}
function couvertures(cls = "") {
  return `<figure class="couvertures ${cls}"><div class="couv-rang">${COUVERTURES.map(
    (c) => `<a class="couv" href="#"><img src="${c.src}" alt="Couverture de « ${c.titre} »" width="${c.l}" height="${c.h}" loading="lazy"><span class="couv-titre">${c.titre}</span><span class="couv-note">${c.note}</span></a>`,
  ).join("")}</div><figcaption>${IMG.commencer.legende}</figcaption></figure>`;
}

const html = ({ titre, css, corps, script = "" }) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titre}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700;800&family=Playwrite+FR+Trad:wght@300;400&family=Vollkorn:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="sources/commun.css">
<link rel="stylesheet" href="sources/${css}">
</head>
<body>
${corps}
${script}
</body>
</html>
`;

export { parties, H, IMG, AUTEUR_NOM, enLigne, echapper, schemas, couvertures, figureImage, enTete, pied, etiquette, html, racine };

