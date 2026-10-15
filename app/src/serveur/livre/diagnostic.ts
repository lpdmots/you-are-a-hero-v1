import { livreACompose, type LivreACompose } from "@/domaine/composition";
import { reglagesDeDepart } from "@/domaine/mise-en-page";
import type { Texte } from "@/domaine/copie";
import { controler } from "@/domaine/controles";
import { hasard } from "@/domaine/numeros";
import type { Plan, Scene } from "@/domaine/recit";

/**
 * Le livre de la page de diagnostic : fabriqué ici, sans la base ni aucune donnée d'élève,
 * à la taille du livre d'essai du prototype — soixante passages en trois parties, de 30 à
 * 1 700 mots, environ 145 pages. Il sert à mesurer la composition chez Vercel (V1 à V3) et à
 * comparer deux Chromium page à page.
 */

const PHRASES = [
  "Lou s’approcha des lanternes, qui s’éteignaient une à une au bout du quai.",
  "La brume montait du lac et recouvrait déjà les barques amarrées.",
  "Un héron s’envola en criant, et l’eau trembla sous la passerelle.",
  "Le passeur ne répondait pas ; il regardait la rive opposée sans bouger.",
  "Plus il avançait, plus la brume s’épaississait autour de lui.",
  "Dans la cabane, une lampe éclairait une carte couverte de signes inconnus.",
  "Maëlwenn posa la main sur la porte : elle était tiède, comme vivante.",
  "Les arbres de la forêt engloutie se dressaient au-dessus de l’eau noire.",
  "Il entendit des pas derrière lui, mais personne n’était là quand il se retourna.",
  "La cloche sonna trois fois, puis le silence retomba sur la clairière.",
  "« Attends-moi ! » cria-t-elle, mais sa voix se perdit dans le brouillard.",
  "Une odeur de cire et de bois mouillé emplissait la pièce étroite.",
];

const uuid = (n: number, s: number) => `00000000-0000-4000-${String(s).padStart(4, "0")}-${String(n).padStart(12, "0")}`;

export function livreDeDiagnostic(): LivreACompose {
  const tirage = hasard(20261015);
  const n = 60;
  const scenes: Scene[] = [];
  const textes = new Map<string, Texte>();
  for (let i = 1; i <= n; i += 1) {
    const id = uuid(i, 8000);
    const mots = 30 + Math.floor(tirage() * tirage() * 1670);
    const phrases: string[] = [];
    for (let total = 0; total < mots; ) {
      const phrase = PHRASES[Math.floor(tirage() * PHRASES.length)];
      phrases.push(phrase);
      total += phrase.split(" ").length;
    }
    const texte: Texte = [];
    for (let k = 0; k < phrases.length; k += 4) texte.push({ type: "p", id: `${id}-p${k}`, children: [{ text: phrases.slice(k, k + 4).join(" ") }] });
    const fin = i > n - 5;
    if (i % 4 === 0) texte.push({ type: "action", id: `${id}-a`, children: [{ text: "Retire un point de volonté à ton héros." }] });
    if (!fin) {
      texte.push({ type: "choix", id: `${id}-c1`, auto: true, libelle: "Suivre la lanterne", construction: "neutre", cible: uuid(Math.min(n, i + 1), 8000), children: [{ text: "" }] });
      texte.push({ type: "choix", id: `${id}-c2`, auto: true, libelle: "Monter dans la barque", construction: "pour", cible: uuid(Math.min(n, i + 3), 8000), children: [{ text: "" }] });
    }
    textes.set(id, texte);
    scenes.push({
      id, chapitreId: "", reference: i, titre: `Scène ${i}`, consigne: "", fin, horsLivre: false, creeParEleve: null, priseParEleve: null, priseParEnseignant: false,
      ancien: null, etat: "prete", texteVide: false, ecritPar: [], rangLivre: Math.floor(tirage() * 1000), numeroFixe: null,
    });
  }
  const parties = ["Le quai aux lanternes", "La forêt engloutie", "La tour du passeur"].map((titre, p) => {
    const ici = scenes.slice(p * 20, p * 20 + 20).map((s) => ({ ...s, chapitreId: uuid(p, 7000) }));
    return {
      id: uuid(p, 6000), titre, imageId: null, visuelChoisi: null, visuelDefaut: null, groupeAvecPrecedente: false, ouvertureSceneId: null,
      chapitres: [{ id: uuid(p, 7000), partieId: uuid(p, 6000), titre, couleur: p, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: null, attributions: [], scenes: ici }],
    };
  });
  const plan: Plan = { parties, corbeille: [], departSceneId: uuid(1, 8000), liens: [] };
  return livreACompose({
    titre: "Les passeurs de brume", aChoix: true, plan, textes, formule: "rends", marqueFin: "Fin", feuille: null,
    reglages: reglagesDeDepart(true), problemes: controler({ plan, aChoix: true, scenesAvecActions: new Set(), feuille: false }), images: {},
  });
}
