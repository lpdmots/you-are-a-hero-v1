import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Texte } from "@/domaine/copie";
import { livreACompose, reglagesDeDepart, type LivreACompose, type ReglagesDuLivre } from "@/domaine/composition";
import { controler } from "@/domaine/controles";
import type { Etat } from "@/domaine/etats";
import { hasard } from "@/domaine/numeros";
import type { Feuille } from "@/domaine/preparation";
import type { Chapitre, Lien, Partie, Plan, Scene } from "@/domaine/recit";

/**
 * Des livres fabriqués pour les essais de composition, sans base : un plan, des textes tirés
 * d'une graine (le même livre d'une fois à l'autre), et la lecture des PDF produits.
 */

export const id = (ref: number) => `00000000-0000-4000-8000-${String(ref).padStart(12, "0")}`;
export const imageId = (n: number) => `00000000-0000-4000-9000-${String(n).padStart(12, "0")}`;

export type Decrite = {
  ref: number;
  partie?: number;
  chapitre?: string;
  fin?: boolean;
  hors?: boolean;
  vide?: boolean;
  texte?: Texte;
  fixe?: number;
  etat?: Etat;
  rang?: number;
};

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
];

/** Un texte de quelques paragraphes, tiré d'une graine. */
export function recit(graine: number, paragraphes = 3, phrasesParParagraphe = 4): Texte {
  const tirage = hasard(graine);
  return Array.from({ length: paragraphes }, (_, i) => ({
    type: "p" as const, id: `p-${graine}-${i}`,
    children: [{ text: Array.from({ length: phrasesParParagraphe }, () => PHRASES[Math.floor(tirage() * PHRASES.length)]).join(" ") }],
  }));
}

export const p = (t: string, bloc = `p-${t.slice(0, 12)}`) => ({ type: "p" as const, id: bloc, children: [{ text: t }] });
export const choix = (libelle: string, cible: string | null, bloc = `c-${libelle}`) => ({
  type: "choix" as const, id: bloc, auto: true as const, libelle, construction: "neutre" as const, cible, children: [{ text: "" as const }] as [{ text: "" }],
});
export const action = (t: string, bloc = `a-${t.slice(0, 12)}`) => ({ type: "action" as const, id: bloc, children: [{ text: t }] });
export const image = (n: number, largeur = 65, bloc = `i-${n}`, page = false) => ({ type: "image" as const, id: bloc, image: imageId(n), largeur, ...(page ? { page: true as const } : {}), children: [{ text: "" as const }] as [{ text: "" }] });
export const liaison = (cible: string, bloc = `l-${cible}`) => ({ type: "liaison" as const, id: bloc, cible, children: [{ text: "" as const }] as [{ text: "" }] });

export function planDe(scenes: Decrite[], o: { parties?: string[]; depart?: number; groupes?: number[] } = {}): Plan {
  const noms = o.parties ?? ["Le quai aux lanternes"];
  const parties: Partie[] = noms.map((titre, i) => {
    const ici = scenes.filter((s) => (s.partie ?? 0) === i);
    const chapitres: Chapitre[] = [...new Set(ici.map((s) => s.chapitre ?? `Chapitre ${i + 1}`))].map((nom, j) => ({
      id: `c-${i}-${j}`, partieId: `p-${i}`, titre: nom, couleur: j, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: null, attributions: [],
      scenes: ici.filter((s) => (s.chapitre ?? `Chapitre ${i + 1}`) === nom).map((s): Scene => ({
        id: id(s.ref), chapitreId: `c-${i}-${j}`, reference: s.ref, titre: `Scène ${s.ref}`, consigne: "", fin: s.fin ?? false, horsLivre: s.hors ?? false,
        creeParEleve: null, priseParEleve: null, priseParEnseignant: false, ancien: null, etat: s.etat ?? "prete", texteVide: s.vide ?? false, ecritPar: [],
        rangLivre: s.rang ?? null, numeroFixe: s.fixe ?? null,
      })),
    }));
    return { id: `p-${i}`, titre, imageId: null, visuelChoisi: null, visuelDefaut: null, groupeAvecPrecedente: (o.groupes ?? []).includes(i), ouvertureSceneId: null, chapitres };
  });
  return { parties, corbeille: [], departSceneId: id(o.depart ?? scenes[0].ref), liens: [] };
}

/** Le livre à composer d'un plan et de ses textes, avec les points des contrôles. */
export function livreDe(
  scenes: Decrite[],
  o: { aChoix?: boolean; parties?: string[]; groupes?: number[]; reglages?: Partial<ReglagesDuLivre>; images?: Record<string, { largeur: number; hauteur: number }>; feuille?: Feuille | null; titre?: string } = {},
): LivreACompose {
  const aChoix = o.aChoix ?? true;
  const plan = planDe(scenes, o);
  const textes = new Map(scenes.map((s) => [id(s.ref), s.texte ?? (s.vide ? [] : recit(s.ref))]));
  // Les liens du plan, tels que la base les tire des textes
  plan.liens = scenes.flatMap((s) => (textes.get(id(s.ref)) ?? []).flatMap((b): Lien[] => {
    if (b.type === "choix" && "auto" in b && b.auto) return [{ sceneId: id(s.ref), renvoiId: b.id, cibleId: b.cible, libelle: b.libelle, cache: false }];
    if (b.type === "liaison") return [{ sceneId: id(s.ref), renvoiId: b.id, cibleId: b.cible, libelle: "", cache: true }];
    return [];
  }));
  const problemes = controler({ plan, aChoix, scenesAvecActions: new Set(), feuille: true });
  return livreACompose({
    titre: o.titre ?? "Les passeurs de brume", aChoix, plan, textes, formule: "rends", marqueFin: "Fin", feuille: o.feuille ?? null,
    reglages: { ...reglagesDeDepart(aChoix), ...o.reglages }, problemes, images: o.images ?? {},
  });
}

/** Un livre à choix d'une quarantaine de passages en trois parties, où chaque scène mène à deux autres. */
export function livreAChoix(n = 40, o: Parameters<typeof livreDe>[1] = {}): LivreACompose {
  const scenes: Decrite[] = Array.from({ length: n }, (_, i) => {
    const ref = i + 1;
    const partie = i < n / 4 ? 0 : i < (3 * n) / 4 ? 1 : 2;
    const fin = ref > n - 4;
    const texte: Texte = [...recit(ref, 1 + (ref % 4), 3 + (ref % 3))];
    if (!fin) texte.push(choix(`Suivre la piste ${ref}`, id(Math.min(n, ref + 1))), choix(`Prendre la barque ${ref}`, id(Math.min(n, ref + 2))));
    return { ref, partie, fin, texte };
  });
  return livreDe(scenes, { parties: ["Le quai aux lanternes", "La forêt engloutie", "La tour du passeur"], ...o });
}

export type PageLue = { lignes: string[]; largeur: number; hauteur: number; elements: { texte: string; x: number; y: number; police: string; taille: number }[] };

/** Les pages d'un PDF : leurs lignes de texte, de haut en bas, et la position de chaque morceau. */
export async function lirePdf(pdf: Buffer | Uint8Array): Promise<PageLue[]> {
  const doc = await getDocument({ data: new Uint8Array(pdf), useSystemFonts: false, isEvalSupported: false }).promise;
  const pages: PageLue[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const vue = page.getViewport({ scale: 1 });
    const contenu = await page.getTextContent();
    const elements = contenu.items.flatMap((it) => ("str" in it && it.str.trim()
      ? [{ texte: it.str, x: it.transform[4], y: vue.height - it.transform[5], police: it.fontName, taille: Math.hypot(it.transform[2], it.transform[3]) }]
      : []));
    const parLigne = new Map<number, { x: number; texte: string }[]>();
    for (const e of elements) {
      const y = [...parLigne.keys()].find((k) => Math.abs(k - e.y) < 2) ?? e.y;
      parLigne.set(y, [...(parLigne.get(y) ?? []), { x: e.x, texte: e.texte }]);
    }
    const lignes = [...parLigne.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l.sort((a, b) => a.x - b.x).map((m) => m.texte).join(" ").replace(/\s+/g, " ").trim());
    pages.push({ lignes, largeur: vue.width, hauteur: vue.height, elements });
  }
  return pages;
}
