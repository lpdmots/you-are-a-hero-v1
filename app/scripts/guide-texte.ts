/**
 * Le texte du guide « Comment écrire un livre dont vous êtes le héros avec sa classe » (F14-AC52) :
 * lu dans les « Premier jet » de `docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md`, qui reste
 * sa seule source, et écrit dans `src/domaine/texte-du-guide.ts`. Après une retouche du document :
 *
 *   npm run guide:texte
 *
 * La typographie française se pose ici (apostrophe courbe, espaces insécables comme ailleurs sur le site) ; le texte ne change
 * pas, sauf les renvois à la page « Ressources », tant qu'elle n'existe pas (voir SANS_RESSOURCES).
 */
import fs from "node:fs";
import path from "node:path";

const source = path.resolve(import.meta.dirname, "../../docs/guide-ecrire-un-livre-dont-vous-etes-le-heros.md");
const cible = path.resolve(import.meta.dirname, "../src/domaine/texte-du-guide.ts");

/**
 * Tant que la page « Ressources » n'existe pas (plan, « Suite recommandée », point 5), le guide n'y
 * renvoie pas : une phrase retirée, un renvoi mené au modèle d'autorisation qui existe déjà. À retirer
 * d'ici le jour où la page est en ligne.
 */
const SANS_RESSOURCES: [string, string][] = [
  ["Un modèle d’autorisation est sur la page « Ressources ».", "Un [modèle d’autorisation](/modeles/autorisation-de-diffusion) est prêt à télécharger."],
];

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
if (jets.length !== 14) throw new Error(`14 « Premier jet » attendus (le haut et treize parties), ${jets.length} trouvés`);

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

const sansRessources = (t: string) => SANS_RESSOURCES.reduce((s, [de, vers]) => s.replace(typo(de), vers), t);

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
  const t = sansRessources(m.join(" "));
  // Une liste à puces (« - ») ou numérotée (« 1. »), ses lignes suivantes en retrait
  const puce = /^(- |\d+\. )/;
  if (puce.test(m[0])) {
    const elements: string[] = [];
    for (const l of m) {
      if (puce.test(l)) elements.push(l.replace(puce, ""));
      else elements[elements.length - 1] += " " + l.trim();
    }
    return { sorte: "liste", elements: elements.map(sansRessources), ...(/^\d/.test(m[0]) ? { ordonnee: true } : {}) };
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
const plusLoin = haut.find((m) => m[0].startsWith("**Pour aller plus loin"))!.join(" ").replace(/^\*\*Pour aller plus loin\s?:\*\*\s*/, "");
const texte = {
  titre: haut[0][0].replace(/^# /, ""),
  definition: haut[1].join(" "),
  // La date de mise à jour se pose à part (DATE_DU_GUIDE), pas dans le texte
  auteur: auteur.replace(/\s*Mis à jour le …\s*$/, ""),
  // Chaque ligne : son chiffre en gras, puis la phrase, finie par « (partie N) », la question qui la développe
  enBref: (classer(haut[4]) as { elements: string[] }).elements.map((l) => {
    const m = l.match(/^\*\*([^*]+)\*\*\s*(.*?)\s*\(partie\s(\d+)\)$/);
    if (!m) throw new Error(`Ligne de « En bref » sans chiffre en gras ni « (partie N) » : ${l}`);
    return { chiffre: m[1], texte: m[2], partie: Number(m[3]) };
  }),
  // « Ressources » attend sa page ; « La bibliothèque » et « Essayer Il était une classe » restent
  plusLoin: plusLoin
    .split(" · ")
    .filter((l) => !l.includes("Ressources"))
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
