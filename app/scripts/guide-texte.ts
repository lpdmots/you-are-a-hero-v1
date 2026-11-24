/**
 * Le texte du guide « Comment écrire un livre dont vous êtes le héros en classe » (F14-AC52) :
 * lu dans les « Premier jet » de `docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md`, qui reste
 * sa seule source, et écrit dans `src/domaine/texte-du-guide.ts`. Après une retouche du document :
 *
 *   npm run guide:texte
 *
 * La typographie française se pose ici (apostrophe courbe, espaces insécables comme ailleurs sur le site) ; le texte ne change
 * pas.
 */
import fs from "node:fs";
import path from "node:path";

const source = path.resolve(import.meta.dirname, "../../docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md");
const cible = path.resolve(import.meta.dirname, "../src/domaine/texte-du-guide.ts");

const typo = (l: string) =>
  l
    .replace(/'/g, "\u2019")
    .replace(/« /g, "«\u00a0")
    .replace(/ »/g, "\u00a0»")
    .replace(/ ([?!;:])/g, "\u00a0$1");

const lignes = fs.readFileSync(source, "utf8").split("\n");
const jets: string[][] = [];
for (let i = 0; i < lignes.length; i++) {
  if (lignes[i].trim() !== "#### Premier jet") continue;
  let j = i + 1;
  while (j < lignes.length && !lignes[j].startsWith(">")) j++;
  const bloc: string[] = [];
  while (j < lignes.length && lignes[j].startsWith(">")) bloc.push(typo(lignes[j++].replace(/^> ?/, "")));
  jets.push(bloc);
}
if (jets.length !== 16) throw new Error(`16 « Premier jet » attendus (le haut et quinze parties), ${jets.length} trouvés`);

const morceaux = (bloc: string[]) => {
  const out: string[][] = [];
  let cur: string[] = [];
  for (const l of bloc) {
    if (l.trim() !== "") cur.push(l);
    else if (cur.length) {
      out.push(cur);
      cur = [];
    }
  }
  if (cur.length) out.push(cur);
  return out;
};

type Bloc =
  | { sorte: "paragraphe"; tete: string | null; texte: string }
  | { sorte: "intertitre"; texte: string }
  | { sorte: "liste"; elements: string[]; ordonnee?: boolean }
  | { sorte: "tableau"; entete: string[]; rangs: string[][] }
  | { sorte: "classe"; texte: string; elements?: string[] }
  | { sorte: "exemple"; titre: string; texte: string; rappel: string; elements?: string[] }
  | { sorte: "encart"; texte: string };

/** Une liste qui suit « Dans ma classe » ou un exemple lui appartient : elle reste dans sa copie ou sa fiche */
function rattacher(blocs: Bloc[]): Bloc[] {
  const out: Bloc[] = [];
  for (const b of blocs) {
    const avant = out[out.length - 1];
    if (b.sorte === "liste" && (avant?.sorte === "classe" || avant?.sorte === "exemple") && !avant.elements) avant.elements = b.elements;
    else out.push(b);
  }
  return out;
}

function classer(m: string[]): Bloc {
  const t = m.join(" ");
  // Une liste à puces (« - ») ou numérotée (« 1. »), ses lignes suivantes en retrait
  const puce = /^(- |\d+\. )/;
  if (puce.test(m[0])) {
    const elements: string[] = [];
    for (const l of m) {
      if (puce.test(l)) elements.push(l.replace(puce, ""));
      else elements[elements.length - 1] += " " + l.trim();
    }
    return { sorte: "liste", elements, ...(/^\d/.test(m[0]) ? { ordonnee: true } : {}) };
  }
  if (m[0].startsWith("|")) {
    const rangs = m.filter((l) => !/^\|\s*-/.test(l)).map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
    return { sorte: "tableau", entete: rangs[0], rangs: rangs.slice(1) };
  }
  if (t.startsWith("**Dans ma classe.**")) return { sorte: "classe", texte: t.replace("**Dans ma classe.**", "").trim() };
  // « *Exemple.* **Titre.** Consigne : texte. J'ai pensé à : » : une fiche de consigne, sa liste à cocher ensuite
  const exemple = t.match(/^\*Exemple\.\*\s*\*\*([^*]+)\*\*\s*(.*?)\s*((?:Dans mon texte|J’ai pensé).*)$/);
  if (exemple) return { sorte: "exemple", titre: exemple[1], texte: exemple[2], rappel: exemple[3] };
  if (t.startsWith("*Encart.*")) return { sorte: "encart", texte: t.replace("*Encart.*", "").trim() };
  const tete = t.match(/^\*\*([^*]+)\*\*\s*(.*)$/);
  if (tete) return tete[2] ? { sorte: "paragraphe", tete: tete[1], texte: tete[2] } : { sorte: "intertitre", texte: tete[1] };
  return { sorte: "paragraphe", tete: null, texte: t };
}

const haut = morceaux(jets[0]);
const auteur = haut[2].join(" ").replace(/^\*|\*$/g, "");
// « Avant de commencer » : la note de l'auteur, sous sa ligne
const avant = haut.find((m) => m[0].startsWith("**Avant de commencer.**"));
if (!avant) throw new Error("« Avant de commencer » attendu sous la ligne d'auteur");
const iBref = haut.findIndex((m) => m[0].trim() === "**En bref**");
// La fin de la page : un titre à la main et une phrase, sur la feuille qui répond à la page de titre
const fin = haut
  .map((m) => m.join(" ").match(/^\*\*Fin\s?:\s?([^*]+?)\.?\*\*\s*(.+)$/))
  .find(Boolean);
if (!fin) throw new Error("« **Fin : Titre.** phrase » attendu avant « Lire et essayer »");
const plusLoin = haut.find((m) => m[0].startsWith("**Lire et essayer"))!.join(" ").replace(/^\*\*Lire et essayer\s?:\*\*\s*/, "");
// « Pour aller plus loin » : les lectures, en liste sous le titre, après la dernière question
const iLectures = haut.findIndex((m) => m[0].trim() === "**Pour aller plus loin**");
if (iLectures < 0) throw new Error("« Pour aller plus loin » attendu dans le haut du document");
const texte = {
  titre: haut[0][0].replace(/^# /, ""),
  definition: haut[1].join(" "),
  // La date de mise à jour se pose à part (DATE_DU_GUIDE), pas dans le texte
  auteur: auteur.replace(/\s*Mis à jour le …\s*$/, ""),
  // Chaque ligne : son chiffre en gras, puis la phrase, finie par « (partie N) », la question qui la développe
  avantDeCommencer: avant.join(" ").replace("**Avant de commencer.**", "").trim(),
  enBref: (classer(haut[iBref + 1]) as { elements: string[] }).elements.map((l) => {
    const m = l.match(/^\*\*([^*]+)\*\*\s*(.*?)\s*\(partie\s(\d+)\)$/);
    if (!m) throw new Error(`Ligne de « En bref » sans chiffre en gras ni « (partie N) » : ${l}`);
    return { chiffre: m[1], texte: m[2], partie: Number(m[3]) };
  }),
  // « Ressources », « La bibliothèque » et « Essayer Il était une classe » (F14-AC59)
  lectures: (classer(haut[iLectures + 1]) as { elements: string[] }).elements,
  fin: { titre: fin[1], texte: fin[2] },
  plusLoin: plusLoin
    .split(" · ")
    .map((l) => {
      const [, libelle, adresse] = l.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      return { libelle, adresse: adresse === "…" ? "/bibliotheque" : adresse };
    }),
  parties: jets.slice(1).map((bloc, k) => {
    const ms = morceaux(bloc);
    return { numero: k + 1, titre: ms[0][0].replace(/^## /, ""), blocs: rattacher(ms.slice(1).map(classer)) };
  }),
};

fs.writeFileSync(
  cible,
  `// Écrit par \`npm run guide:texte\` depuis docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md : ne pas
// modifier ici, retoucher le document puis relancer la commande.
import type { TexteDuGuide } from "./guide";

export const TEXTE_DU_GUIDE: TexteDuGuide = ${JSON.stringify(texte, null, 2)};
`,
);
console.log(`Texte du guide écrit : ${texte.parties.length} parties, ${texte.parties.flatMap((p) => p.blocs).filter((b) => b.sorte === "encart").length} encarts.`);
