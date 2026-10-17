/**
 * Essai de qualité V17 (étape 8, lot 1) : chaque cas du jeu d'essai, sur chaque modèle candidat,
 * avec les vraies consignes des aides. Les réponses vont dans essais-ia/resultats.json (hors de
 * Git), que la page locale /essai-ia montre à l'aveugle au porteur.
 *
 *   npm run ia:essai                    lance ce qui manque (un cas déjà réussi n'est pas refait)
 *   npm run ia:essai -- --cas consigne-1,titre-1   seulement ces cas
 *   npm run ia:essai -- --refaire       refait aussi ce qui a réussi
 *   npm run ia:essai -- --plafond 15    s'arrête avant de dépasser 15 dollars au total (10 par défaut)
 *   npm run ia:essai -- --modeles claude-sonnet-5-5,gpt-5.6-terra   seulement ces modèles
 *   npm run ia:essai -- --a-blanc       dit seulement ce qui serait lancé
 *
 * Les clés sont lues dans .env.local par ce seul processus, jamais affichées. Le coût affiché
 * est celui que le fournisseur annonce en jetons, au prix du tableau des modèles.
 */
import { config } from "dotenv";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomInt } from "node:crypto";
import { AIDES } from "@/serveur/ia/aides";
import { essayerUneAide } from "@/serveur/ia/demander";
import { MODELES, type IdModele } from "@/serveur/ia/modeles";
import { DOLLARS_PAR_EURO } from "@/domaine/aides-ia";
import { JEU_D_ESSAI, type Cas } from "./jeu";
import { CANDIDATS, FICHIER_RESULTATS, type Resultat, type Resultats } from "./commun";

config({ path: resolve(__dirname, "../../.env.local"), quiet: true });
delete process.env.IA_SIMULEE;

const args = process.argv.slice(2);
const option = (nom: string): string | undefined => {
  const i = args.indexOf(nom);
  return i >= 0 ? args[i + 1] : undefined;
};
const seulement = option("--cas")?.split(",");
const modelesChoisis = option("--modeles")?.split(",");
const refaire = args.includes("--refaire");
const aBlanc = args.includes("--a-blanc");
const plafond = Number(option("--plafond") ?? 10);

const chemin = resolve(__dirname, "../..", FICHIER_RESULTATS);
mkdirSync(resolve(chemin, ".."), { recursive: true });
const fichier: Resultats = existsSync(chemin) ? JSON.parse(readFileSync(chemin, "utf8")) : { resultats: [], ordres: {} };
const garder = () => writeFileSync(chemin, JSON.stringify(fichier, null, 2));

const dejaDepense = () => fichier.resultats.reduce((s, r) => s + r.cout, 0);

/** L'ordre des propositions d'un cas, tiré une fois au hasard et gardé : la page le suit. */
function ordreDe(cas: Cas, modeles: IdModele[]): void {
  const deja = fichier.ordres[cas.id] ?? [];
  const nouveaux = modeles.filter((m) => !deja.includes(m));
  const ordre = [...deja];
  for (const m of nouveaux) ordre.splice(randomInt(ordre.length + 1), 0, m);
  fichier.ordres[cas.id] = ordre;
}

const aFaire: [Cas, IdModele][] = [];
for (const cas of JEU_D_ESSAI) {
  if (seulement && !seulement.includes(cas.id)) continue;
  const modeles = CANDIDATS(cas.aide);
  ordreDe(cas, modeles);
  for (const m of modeles) {
    if (modelesChoisis && !modelesChoisis.includes(m)) continue;
    const reussi = fichier.resultats.some((r) => r.cas === cas.id && r.modele === m && !r.erreur);
    if (!reussi || refaire) aFaire.push([cas, m]);
  }
}

console.log(`${aFaire.length} appel${aFaire.length > 1 ? "s" : ""} à faire ; déjà dépensé : ${dejaDepense().toFixed(3)} $ ; plafond : ${plafond} $.`);
if (aBlanc) {
  for (const [cas, m] of aFaire) console.log(`  ${cas.id} · ${MODELES[m].nom}`);
  process.exit(0);
}
if (!process.env.ANTHROPIC_API_KEY || !process.env.OPENAI_API_KEY) {
  console.error("Une clé manque dans .env.local (ANTHROPIC_API_KEY, OPENAI_API_KEY).");
  process.exit(1);
}

let arrete = false;
async function travailleur(): Promise<void> {
  while (aFaire.length && !arrete) {
    if (dejaDepense() >= plafond) {
      arrete = true;
      console.log(`Plafond de ${plafond} $ atteint : arrêt.`);
      return;
    }
    const [cas, modele] = aFaire.shift()!;
    const r = await essayerUneAide(AIDES[cas.aide], cas.entree, modele);
    const resultat: Resultat = { cas: cas.id, modele, le: new Date().toISOString(), ...r };
    fichier.resultats = fichier.resultats.filter((x) => !(x.cas === cas.id && x.modele === modele));
    fichier.resultats.push(resultat);
    garder();
    const etat = r.erreur ? `ÉCHEC ${r.erreur}` : r.valeur === null ? "illisible" : "ok";
    console.log(`${cas.id.padEnd(22)} ${MODELES[modele].nom.padEnd(18)} ${etat.padEnd(10)} ${(r.duree / 1000).toFixed(1).padStart(5)} s  ${r.cout.toFixed(4)} $`);
  }
}

void Promise.all(Array.from({ length: 4 }, travailleur)).then(() => {
  garder();
  const total = dejaDepense();
  console.log(`Total de l'essai : ${total.toFixed(3)} $ (environ ${(total / DOLLARS_PAR_EURO).toFixed(2)} €).`);
});
