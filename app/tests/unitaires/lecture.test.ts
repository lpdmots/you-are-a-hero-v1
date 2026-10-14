import { describe, expect, it } from "vitest";
import type { Texte } from "@/domaine/copie";
import {
  changerCompteur, commencer, feuilleDeDepart, issueDe, lancer, livrePourLAdulte, phraseLue, resoudre, revenir, suivre, type BlocLu, type LivreLu,
} from "@/domaine/lecture";
import type { Feuille } from "@/domaine/preparation";
import type { Chapitre, Plan, Scene } from "@/domaine/recit";

/**
 * Étape 5 du plan, lot 3 : ce qu'une lecture reçoit d'un livre, et ses règles — énigme,
 * issues d'un passage, parcours, feuille et dé (F09.1, F12.1, F04.2), sans base ni navigateur.
 */

const id = (ref: number) => `00000000-0000-4000-8000-${String(ref).padStart(12, "0")}`;
type Decrite = { ref: number; chapitre?: string; fin?: boolean; hors?: boolean; vide?: boolean; texte?: Texte; fixe?: number };

function livre(scenes: Decrite[], { aChoix = true, feuille = null as Feuille | null } = {}): LivreLu {
  const noms = [...new Set(scenes.map((s) => s.chapitre ?? "La lisière"))];
  const chapitres: Chapitre[] = noms.map((nom, i) => ({
    id: `c-${nom}`, partieId: "p", titre: nom, couleur: i, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: null, attributions: [],
    scenes: scenes.filter((s) => (s.chapitre ?? "La lisière") === nom).map((s): Scene => ({
      id: id(s.ref), chapitreId: `c-${nom}`, reference: s.ref, titre: `Scène ${s.ref}`, consigne: "", fin: s.fin ?? false, horsLivre: s.hors ?? false, creeParEleve: null,
      priseParEleve: null, priseParEnseignant: false, ancien: null, etat: "cours", texteVide: s.vide ?? false, ecritPar: [], rangLivre: null, numeroFixe: s.fixe ?? null,
    })),
  }));
  const plan: Plan = {
    parties: [{ id: "p", titre: "La forêt", imageId: null, visuelChoisi: null, visuelDefaut: null, groupeAvecPrecedente: false, ouvertureSceneId: null, chapitres }],
    corbeille: [], departSceneId: id(scenes[0].ref), liens: [],
  };
  return livrePourLAdulte(plan, new Map(scenes.map((s) => [id(s.ref), s.texte ?? []])), { aChoix, formule: "rends", marqueFin: "Fin", feuille, regles: "" });
}

const p = (t: string, id = `p-${t}`) => ({ type: "p" as const, id, children: [{ text: t }] });
const auto = (libelle: string, cible: string | null, id = `c-${libelle}`) => ({ type: "choix" as const, id, auto: true as const, libelle, construction: "neutre" as const, cible, children: [{ text: "" as const }] as [{ text: "" }] });
const liaison = (cible: string | null, id = `l-${cible}`) => ({ type: "liaison" as const, id, cible, children: [{ text: "" as const }] as [{ text: "" }] });
const choixDe = (l: LivreLu, ref: number) => l.passages[id(ref)].blocs.filter((b): b is Extract<BlocLu, { type: "choix" }> => b.type === "choix");

describe("Ce que la lecture reçoit d'un passage (F09.1)", () => {
  it("F05-AC09 — deux renvois dans une phrase : la lecture montre la phrase du livre, chaque numéro menant à sa scène", () => {
    const phrase = {
      type: "choix" as const, id: "s051", libelle: "",
      children: [
        { text: "Si tu as la clé d’argent, ouvre la porte au " }, { type: "renvoi" as const, id: "r1", cible: id(2), children: [{ text: "" as const }] as [{ text: "" }] },
        { text: " ; sinon, déchiffre les symboles au " }, { type: "renvoi" as const, id: "r2", cible: id(3), children: [{ text: "" as const }] as [{ text: "" }] },
        { text: "." },
      ],
    };
    const l = livre([{ ref: 1, texte: [p("La porte."), phrase] }, { ref: 2, fin: true }, { ref: 3, fin: true }]);
    const [bloc] = choixDe(l, 1);
    const n = (ref: number) => String(l.passages[id(ref)].numero);
    expect(phraseLue(bloc)).toBe(`Si tu as la clé d’argent, ouvre la porte au ${n(2)} ; sinon, déchiffre les symboles au ${n(3)}.`);
    expect(bloc.morceaux.filter((m) => "renvoi" in m).map((m) => ("renvoi" in m ? m.cible : null))).toEqual([{ sorte: "passage", id: id(2) }, { sorte: "passage", id: id(3) }]);
  });

  it("F09-AC17 — un choix sans destination, ou vers une scène supprimée, se lit avec sa phrase, sans suite à suivre ; une note de l'enseignant n'est pas lue", () => {
    const l = livre([{ ref: 1, texte: [p("Le héron."), { type: "note", id: "n", children: [{ text: "Penser au héron" }] }, auto("Suivre le héron", null), auto("Descendre au port", "inconnue")] }]);
    expect(choixDe(l, 1).map((b) => b.morceaux.find((m) => "renvoi" in m))).toEqual([
      { renvoi: "c-Suivre le héron", numero: "…", cible: { sorte: "sans" } },
      { renvoi: "c-Descendre au port", numero: "…", cible: { sorte: "supprimee" } },
    ]);
    expect(l.passages[id(1)].blocs.map((b) => b.type)).toEqual(["p", "choix", "choix"]);
  });

  it("F09-AC18 — une scène exclue du livre se lit, marquée « Hors du livre » pour l'adulte, et sans numéro", () => {
    const l = livre([{ ref: 1, texte: [p("Départ."), auto("Approcher", id(5))] }, { ref: 5, hors: true, fin: true, texte: [p("Le coffre.")] }]);
    expect(l.passages[id(5)]).toMatchObject({ horsLivre: true, numero: null, reference: 5 });
  });

  it("F09-AC20 — ni choix ni fin, une fin, une scène vide : ce que la lecture rencontre en fin de passage", () => {
    const l = livre([{ ref: 1, texte: [p("Rien après.")] }, { ref: 2, fin: true, texte: [p("Fin.")] }, { ref: 3, vide: true }, { ref: 4, texte: [p("Énigme."), liaison(id(2))] }]);
    expect(issueDe(l.passages[id(1)], true)).toBe("rien");
    expect(issueDe(l.passages[id(2)], true)).toBe("fin");
    expect(issueDe(l.passages[id(3)], true)).toBe("vide");
    expect(issueDe(l.passages[id(4)], true)).toBe("suite");
    // Récit classique : la scène suivante dans l'ordre du plan
    expect(issueDe(livre([{ ref: 1, texte: [p("Un.")] }], { aChoix: false }).passages[id(1)], false)).toBe("suite");
  });
});

describe("Énigme (F09.1, F05.1)", () => {
  it("F09-AC19 — numéro d'une énigme : un autre numéro, même d'une scène du livre, n'y mène pas ; le bon, si", () => {
    const l = livre([{ ref: 1, texte: [p("Départ."), auto("Monter", id(55))] }, { ref: 55, texte: [p("Symboles."), liaison(id(62))] }, { ref: 62, fixe: 3, fin: true, texte: [p("La salle.")] }]);
    const porte = l.passages[id(55)];
    expect(porte.enigmes).toEqual([{ id: `l-${id(62)}`, numero: 3, cible: { sorte: "passage", id: id(62) } }]);
    expect(resoudre(porte, "2")).toBeNull();
    expect(resoudre(porte, String(l.passages[id(1)].numero))).toBeNull();
    expect(resoudre(porte, "3")?.cible).toEqual({ sorte: "passage", id: id(62) });
    expect(resoudre(porte, " 3 ")?.cible).toEqual({ sorte: "passage", id: id(62) });
    expect(resoudre(porte, "3b")).toBeNull();
  });
});

describe("Parcours (F09.1, F12.1)", () => {
  it("F09-AC13 — on suit, on revient à une étape, on y fait un autre choix : ce qui suivait est remplacé", () => {
    let parcours = commencer("a");
    parcours = suivre(parcours, "b");
    parcours = suivre(parcours, "c");
    expect(parcours).toEqual({ etapes: ["a", "b", "c"], position: 2 });
    parcours = revenir(parcours, 0);
    expect(parcours.position).toBe(0);
    parcours = suivre(parcours, "d");
    expect(parcours).toEqual({ etapes: ["a", "d"], position: 1 });
    expect(revenir(parcours, -3).position).toBe(0);
  });
});

describe("Feuille et dé (F04.2)", () => {
  const feuille: Feuille = {
    on: true, des: 2,
    sections: [
      { id: "heros", type: "compteurs", titre: "Ton héros", compteurs: [{ id: "vol", nom: "Volonté", depart: 5 }] },
      { id: "inv", type: "liste", titre: "Inventaire", lignes: 6 },
      { id: "dec", type: "notes", titre: "Ce que tu découvres" },
    ],
  };

  it("F04-AC32 — compteur jamais négatif, sans maximum ; la feuille repart de ses valeurs de départ", () => {
    expect(changerCompteur(0, -1)).toBe(0);
    expect(changerCompteur(99, 1)).toBe(100);
    expect(feuilleDeDepart(feuille)).toEqual({ compteurs: { "heros/vol": 5 }, listes: { inv: [] }, notes: { dec: "" } });
  });

  it("F04-AC31 — deux dés : deux faces de 1 à 6, dont le total se lit ; la feuille d'un livre à choix seuls n'est pas montrée", () => {
    const suite = [0.34, 0.7];
    const faces = lancer(2, () => suite.shift()!);
    expect(faces).toEqual([3, 5]);
    expect(livre([{ ref: 1 }], { feuille }).feuille).toEqual(feuille);
    expect(livre([{ ref: 1 }], { feuille: { ...feuille, on: false } }).feuille).toBeNull();
    expect(livre([{ ref: 1 }], { aChoix: false, feuille }).feuille).toBeNull();
  });
});
