import { describe, expect, it } from "vitest";
import { feuilleReprise, reprendre } from "@/domaine/lecture";
import {
  codeAffiche, codeDepuis, codeSaisi, commeLeLivre, etatDuPartage, livreLuDe, nomsPropres, NOMS_COMME_LE_LIVRE, premiersMots, sortieAJour, versionDuLivre,
} from "@/domaine/partage";
import type { Feuille } from "@/domaine/preparation";
import { choix, id, image, imageId, liaison, livreDe, p, planDe, type Decrite } from "../livre/fabrique";

/**
 * Étape 7 du plan, lot 1 : la version partagée tirée du livre composé (F12.1), ses noms, le
 * code du lien, l'état du partage et la coche de « Imprimer et partager » (F11.6), sans base.
 */

const scenes: Decrite[] = [
  { ref: 1, texte: [p("Le quai."), image(1), choix("Suivre la lanterne", id(2)), liaison(id(3))] },
  { ref: 2, fin: true, texte: [p("La lanterne.")] },
  { ref: 3, fin: true, texte: [p("La salle des brumes.")] },
];
const images = { [imageId(1)]: { largeur: 1200, hauteur: 800 }, [imageId(9)]: { largeur: 100, hauteur: 100 } };
const livre = (o: Parameters<typeof livreDe>[1] = {}) => livreDe(scenes, { images, pages: (x) => x, ...o });

describe("La version partagée (F12.1)", () => {
  it("garde l'ordre, les numéros, les choix et les énigmes du livre ; ni référence, ni marque de travail, ni réglage d'impression", () => {
    const v = versionDuLivre(livre(), NOMS_COMME_LE_LIVRE);
    expect(v.passages.map((x) => [x.id, x.numero])).toEqual([[id(1), 1], [id(2), 2], [id(3), 3]]);
    const premier = v.passages[0];
    expect(premier.blocs.find((b) => b.type === "choix")).toMatchObject({ morceaux: expect.arrayContaining([expect.objectContaining({ numero: "2", cible: { sorte: "passage", id: id(2) } })]) });
    expect(premier.enigmes).toEqual([{ numero: 3, cible: id(3) }]);
    const texte = JSON.stringify(v);
    expect(texte).not.toMatch(/S00\d|reference|marques|reglages|recapitulatif/);
    // Seules les images que la version montre
    expect(Object.keys(v.images)).toEqual([imageId(1)]);
  });

  it("F12-AC21 — une marge ou une police changée ne change pas la version ; une coquille corrigée, si", () => {
    const avant = JSON.stringify(versionDuLivre(livre(), NOMS_COMME_LE_LIVRE));
    const marges = livre({ reglages: { marges: { haut: 16, bas: 20, exterieur: 22, interieur: 20 }, taille: "grande", police: "andika" } });
    expect(JSON.stringify(versionDuLivre(marges, NOMS_COMME_LE_LIVRE))).toBe(avant);
    const corrige = livreDe([{ ...scenes[0], texte: [p("Le quai, au matin."), image(1), choix("Suivre la lanterne", id(2)), liaison(id(3))] }, scenes[1], scenes[2]], { images, pages: (x) => x });
    expect(JSON.stringify(versionDuLivre(corrige, NOMS_COMME_LE_LIVRE))).not.toBe(avant);
  });

  it("récit classique : un chapitre par écran, numérotés comme dans le livre, filet entre les scènes, aucun numéro de passage", () => {
    const classique: Decrite[] = [{ ref: 1, chapitre: "Le départ", texte: [p("Un.")] }, { ref: 2, chapitre: "Le départ", texte: [p("Deux.")] }, { ref: 3, chapitre: "Le retour", texte: [p("Trois.")] }];
    const chapitres = new Map(planDe(classique).parties.flatMap((x) => x.chapitres.flatMap((c) => c.scenes.map((s) => [s.id, { id: c.id, titre: c.titre }] as const))));
    const v = versionDuLivre(livreDe(classique, { aChoix: false }), NOMS_COMME_LE_LIVRE, chapitres);
    expect(v.passages.map((x) => [x.numero, x.chapitre?.numero ?? null, x.separateur])).toEqual([[null, 1, false], [null, null, true], [null, 2, false]]);
    expect(v.passages[2].chapitre).toEqual({ numero: 2, titre: "Le retour", imprime: true });
    expect(v.feuille).toBeNull();
    // Titres de chapitre non imprimés : les chapitres restent, sans titre affiché
    const sansTitres = versionDuLivre(livreDe(classique, { aChoix: false, reglages: { titresDeChapitre: false } }), NOMS_COMME_LE_LIVRE, chapitres);
    expect(sansTitres.passages[2].chapitre).toEqual({ numero: 2, titre: "Le retour", imprime: false });
  });
});

describe("Noms dans la version partagée (F12.1, révisé le 16 octobre 2026)", () => {
  it("F12-AC15 — par défaut, la ligne et les prénoms comme dans le livre ; la page des auteurs retirée pour le partage", () => {
    const v = versionDuLivre(livre(), NOMS_COMME_LE_LIVRE);
    expect(v.presentation?.titre.ligne).toMatch(/CM1-CM2/);
    expect(v.presentation?.auteurs?.noms).toEqual(["Alice", "Bilal", "Inès"]);
    const sans = versionDuLivre(livre(), { ...NOMS_COMME_LE_LIVRE, auteurs: false });
    expect(sans.presentation?.auteurs).toBeNull();
  });

  it("F12-AC16 — la ligne remplacée par « Une classe de CM2 », ou retirée avec son année", () => {
    const v = versionDuLivre(livre(), { ligne: true, texte: "Une classe de CM2", auteurs: true });
    expect(v.presentation?.titre).toMatchObject({ ligne: "Une classe de CM2", annee: "2026-2027" });
    const retiree = versionDuLivre(livre(), { ligne: false, texte: null, auteurs: true });
    expect(retiree.presentation?.titre).toMatchObject({ ligne: "", annee: "" });
  });

  it("une page de titre en image s'affiche telle quelle", () => {
    const l = livre({ pages: (x) => ({ ...x, titre: { ...x.titre, forme: "image", imageId: imageId(1) } }) });
    const v = versionDuLivre(l, { ligne: false, texte: null, auteurs: true });
    expect(v.presentation?.titre.image).toBe(imageId(1));
    expect(v.presentation?.titre.ligne).toMatch(/CM1-CM2/);
  });

  it("des réglages lus d'où qu'ils viennent : comme le livre par défaut", () => {
    expect(nomsPropres(null)).toEqual(NOMS_COMME_LE_LIVRE);
    expect(nomsPropres({ ligne: false, texte: "  Une   classe ", auteurs: "non" })).toEqual({ ligne: false, texte: "Une classe", auteurs: true });
    expect(commeLeLivre(NOMS_COMME_LE_LIVRE)).toBe(true);
    expect(commeLeLivre({ ...NOMS_COMME_LE_LIVRE, texte: "Une classe" })).toBe(false);
  });
});

describe("Code du lien (F12.1, 16 octobre 2026)", () => {
  it("dix caractères sans lettres ambiguës, un octet de 248 ou plus écarté", () => {
    const octets = Uint8Array.from([255, 0, 1, 2, 3, 248, 4, 5, 6, 7, 8, 9, 30]);
    const code = codeDepuis(octets);
    expect(code).toBe("abcdefghjk");
    expect(code).not.toMatch(/[ilo01]/);
    expect(() => codeDepuis(Uint8Array.from([250, 251]))).toThrow();
  });

  it("affiché en trois groupes, recopié avec tirets, espaces ou majuscules", () => {
    expect(codeAffiche("p3wd8hncx2")).toBe("p3wd-8hn-cx2");
    expect(codeSaisi(" P3WD-8hn cx2 ")).toBe("p3wd8hncx2");
    expect(codeSaisi("p3wd-8hn-cx")).toBeNull();
    expect(codeSaisi("p3wd-8hn-cx1")).toBeNull();
  });
});

describe("État du partage et coche de l'étape d'arrivée", () => {
  it("à jour, changé, et la comparaison au PDF définitif sur le texte seul (F12-AC22)", () => {
    const partage = { empreinte: "v1", empreinteLecture: "texte1" };
    expect(etatDuPartage(null, { empreinte: "v1" }, null)).toEqual({ sorte: "aucun" });
    expect(etatDuPartage(partage, { empreinte: "v1" }, { empreinteLecture: "texte1" })).toEqual({ sorte: "partage", aJour: true, memeTexteQueLePdf: true });
    expect(etatDuPartage(partage, { empreinte: "v2" }, { empreinteLecture: "texte2" })).toEqual({ sorte: "partage", aJour: false, memeTexteQueLePdf: false });
    expect(etatDuPartage(partage, { empreinte: "v1" }, { empreinteLecture: null })).toMatchObject({ memeTexteQueLePdf: "inconnu" });
    expect(etatDuPartage(partage, { empreinte: "v1" }, null)).toMatchObject({ memeTexteQueLePdf: null });
  });

  it("F11-AC108 — cochée quand tout ce qui a été produit est à jour, l'un des deux au moins existant", () => {
    const rien = { existe: false, aJour: false };
    expect(sortieAJour(rien, rien)).toBe(false);
    expect(sortieAJour(rien, { existe: true, aJour: true })).toBe(true);
    expect(sortieAJour(rien, { existe: true, aJour: false })).toBe(false);
    expect(sortieAJour({ existe: true, aJour: true }, { existe: true, aJour: false })).toBe(false);
    expect(sortieAJour({ existe: true, aJour: true }, rien)).toBe(true);
  });
});

describe("Une lecture retenue, reprise après une mise à jour (F12-AC25, F04-AC43)", () => {
  const feuille = (sections: Feuille["sections"]): Feuille => ({ on: true, des: 1, sections });
  const heros = { id: "heros", type: "compteurs" as const, titre: "Ton héros", compteurs: [{ id: "vol", nom: "Volonté", depart: 5 }] };
  const inventaire = { id: "inv", type: "liste" as const, titre: "Inventaire", lignes: 6 };

  it("F04-AC43 — un compteur ajouté part de sa valeur de départ, une section retirée disparaît, le reste garde ses valeurs", () => {
    const ancienne = { compteurs: { "heros/vol": 2 }, listes: { inv: ["couteau"] }, notes: {} };
    const ajout = feuilleReprise(feuille([{ ...heros, compteurs: [...heros.compteurs, { id: "tps", nom: "Temps", depart: 10 }] }, inventaire]), ancienne);
    expect(ajout).toEqual({ compteurs: { "heros/vol": 2, "heros/tps": 10 }, listes: { inv: ["couteau"] }, notes: {} });
    expect(feuilleReprise(feuille([heros]), ancienne)).toEqual({ compteurs: { "heros/vol": 2 }, listes: {}, notes: {} });
  });

  it("F12-AC25 — la lecture suit les passages par leur identité ; arrêtée sur un passage retiré, elle reprend au début", () => {
    const v = versionDuLivre(livre(), NOMS_COMME_LE_LIVRE);
    const lu = livreLuDe(v);
    const gardee = { parcours: { etapes: [id(1), id(9), id(3)], position: 2 }, deja: ["c-x"], feuille: { compteurs: {}, listes: {}, notes: {} }, des: [4] };
    const r = reprendre(gardee, lu);
    expect(r.perdue).toBe(false);
    expect(r.lecture?.parcours).toEqual({ etapes: [id(1), id(3)], position: 1 });
    expect(r.lecture?.des).toEqual([4]);
    expect(reprendre({ ...gardee, parcours: { etapes: [id(1), id(9)], position: 1 } }, lu)).toEqual({ lecture: null, perdue: true });
    expect(reprendre("n'importe quoi", lu)).toEqual({ lecture: null, perdue: false });
  });

  it("le passage lu en ligne : ni titre de travail ni référence ; nommé dans le parcours par ses premiers mots", () => {
    const v = versionDuLivre(livre(), NOMS_COMME_LE_LIVRE);
    const lu = livreLuDe(v);
    expect(lu.departId).toBe(id(1));
    expect(lu.passages[id(1)]).toMatchObject({ titre: null, reference: null, etat: null });
    expect(lu.passages[id(1)].enigmes).toEqual([{ id: "enigme-3", numero: 3, cible: { sorte: "passage", id: id(3) } }]);
    expect(premiersMots(v.passages[0])).toBe("Le quai.");
  });
});
