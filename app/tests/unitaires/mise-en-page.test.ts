import { describe, expect, it } from "vitest";
import { controler, type Probleme } from "@/domaine/controles";
import type { Texte } from "@/domaine/copie";
import { desImprimes } from "@/domaine/des";
import { largeurImprimee, reglagesDeDepart, reglagesPropres, SEUIL_PPP } from "@/domaine/mise-en-page";
import { colonnesDesNoms, imagesDesPages, nomsTries, pagesParDefaut, pagesPropres } from "@/domaine/pages";
import { etatRelire } from "@/domaine/livre";
import { corpsDuLivre } from "@/domaine/composition";
import { choix, id, image, imageId, liaison, livreDe, p, planDe } from "../livre/fabrique";

/**
 * Étape 6 du plan, lot 3 : ce que la mise en page décide sans composer (F10, F11.3, F11.4) — les
 * contrôles des images et des marges, les pages de présentation, les dés, les réglages.
 */

const reglages = reglagesDeDepart(true);
function controlesAvec(texte: Texte, images: Record<string, { largeur: number; hauteur: number }>, debordements: { sceneId: string | null; page: number }[] = []): Probleme[] {
  const plan = planDe([{ ref: 1, fin: true, texte }]);
  return controler({
    plan, aChoix: true, scenesAvecActions: new Set(), feuille: true,
    contenu: { textes: new Map([[id(1), texte]]), images, reglages, debordements, imagesDesPages: [] },
  });
}

describe("Images et marges dans les contrôles (F10, F11.2)", () => {
  it("F10-AC14 — une image qui n'est plus dans le projet bloque le PDF définitif et se traite à « Relire », dans les erreurs graves", () => {
    const [point] = controlesAvec([p("Le pont."), image(1, 65)], {}).filter((x) => x.sorte === "image-manquante");
    expect(point).toMatchObject({ gravite: "bloque", etape: "relire", tache: "graves", sceneId: id(1) });
    expect(etatRelire([point]).graves).toBe(1);
  });

  it("F10-AC15, F10-AC35 — 800 points de large en pleine largeur : 180 points par pouce, un avertissement ; à 40 %, rien", () => {
    const pleine = controlesAvec([image(1, 100)], { [imageId(1)]: { largeur: 800, hauteur: 600 } }).find((x) => x.sorte === "image-floue");
    expect(pleine).toMatchObject({ gravite: "avert", tache: "confirmer", etape: "relire" });
    expect(pleine && "ppp" in pleine ? pleine.ppp : 0).toBe(180);
    expect(SEUIL_PPP).toBe(200);
    expect(controlesAvec([image(1, 40)], { [imageId(1)]: { largeur: 800, hauteur: 600 } }).some((x) => x.sorte === "image-floue")).toBe(false);
  });

  it("F10-AC16 — une photographie de 4 000 points, gardée à 2 600, passe en pleine largeur sans avertissement", () => {
    expect(controlesAvec([image(1, 100)], { [imageId(1)]: { largeur: 2600, hauteur: 1950 } }).some((x) => x.sorte === "image-floue")).toBe(false);
  });

  it("F10-AC17 — un dessin en hauteur réglé à 95 % qui ne tient qu'à moins : « à savoir », avec les deux largeurs ; placé en pleine largeur, rien", () => {
    const haut = { [imageId(1)]: { largeur: 1000, hauteur: 1600 } };
    const point = controlesAvec([image(1, 95)], haut).find((x) => x.sorte === "largeur-reduite");
    const obtenue = largeurImprimee({ largeur: 95 }, haut[imageId(1)], reglages).pourcent;
    expect(obtenue).toBeLessThan(95);
    expect(point).toMatchObject({ gravite: "info", etape: "relire", demandee: 95, obtenue: Math.round(obtenue) });
    expect(controlesAvec([image(1, 100)], haut).some((x) => x.sorte === "largeur-reduite")).toBe(false);
    // L'image composée prend la largeur obtenue
    const l = livreDe([{ ref: 1, fin: true, texte: [image(1, 95)] }], { images: haut });
    expect(corpsDuLivre(l, { travail: false, etatDu: "", image: (x) => x })).toContain(`width:${obtenue}%`);
  });

  it("F11-AC57 — ce qui dépassait de la marge à la dernière composition avertit, page dite, sans bloquer ; l'acceptation tient tant que la scène et les marges n'ont pas changé", () => {
    const texte = [p("http://www.une-adresse-tres-longue-qui-ne-se-coupe-nulle-part.fr")];
    const [point] = controlesAvec(texte, {}, [{ sceneId: id(1), page: 37 }]).filter((x) => x.sorte === "hors-marges");
    expect(point).toMatchObject({ gravite: "avert", etape: "relire", tache: "confirmer", page: 37 });
    const memeCle = controlesAvec(texte, {}, [{ sceneId: id(1), page: 37 }]).find((x) => x.sorte === "hors-marges")!.cle;
    expect(memeCle).toBe(point.cle);
    const autre = controlesAvec([p("Un autre texte.")], {}, [{ sceneId: id(1), page: 37 }]).find((x) => x.sorte === "hors-marges")!.cle;
    expect(autre).not.toBe(point.cle);
  });

  it("F11-AC84 — une image peu définie reste à traiter à « Relire » : la déclaration attend qu'on l'ait réduite ou gardée", () => {
    const pts = controlesAvec([image(1, 60)], { [imageId(1)]: { largeur: 500, hauteur: 400 } });
    const floue = pts.find((x) => x.sorte === "image-floue")!;
    expect(etatRelire(pts, new Set(), false)).toMatchObject({ confirmer: 1, declarable: false, marque: "reste" });
    expect(etatRelire(pts, new Set([floue.cle]), false)).toMatchObject({ confirmer: 0, declarable: true });
  });
});

describe("Pages de présentation (F11.4)", () => {
  const defaut = pagesParDefaut({ aChoix: true, deClasse: true, adulte: "Mme Laurent", classe: { nom: "CM1-CM2", anneeDebut: 2026 }, prenoms: ["Inès", "Élodie", "adam", "Bilal"], annee: 2026 });

  it("F11-AC28, F11-AC105 — la page des auteurs propose les prénoms seuls, triés sans tenir compte des accents, « avec Mme Laurent », sur trois colonnes pour vingt-cinq élèves", () => {
    expect(defaut.auteurs).toMatchObject({ presente: true, introduction: "Ce livre a été écrit par", conclusion: "avec Mme Laurent" });
    expect(nomsTries(defaut.auteurs.noms)).toEqual(["adam", "Bilal", "Élodie", "Inès"]);
    expect(colonnesDesNoms(25)).toBe(3);
    expect(colonnesDesNoms(10)).toBe(2);
    expect(defaut.titre).toMatchObject({ ligne: "La classe de CM1-CM2 de Mme Laurent", annee: "2026-2027" });
    // Pas de page des auteurs d'office en mode personnel
    expect(pagesParDefaut({ aChoix: true, deClasse: false, adulte: "Léa", classe: null, prenoms: [], annee: 2026 }).auteurs.presente).toBe(false);
    // Sans nom affiché, pas de « avec » seul en dernière ligne
    expect(pagesParDefaut({ aChoix: true, deClasse: false, adulte: "", classe: null, prenoms: [], annee: 2026 }).auteurs.conclusion).toBe("");
  });

  it("F11-AC29 — « Comment lire ce livre » est proposée pour un livre à choix ; absente d'un récit classique", () => {
    expect(defaut.commentLire.presente).toBe(true);
    const classique = livreDe([{ ref: 1, fin: true }], { aChoix: false, pages: (x) => x });
    expect(classique.presentation?.commentLire).toBeNull();
  });

  it("F11-AC107 — sans liaison cachée, le texte de départ ne parle pas d'énigme ; une liaison ajoutée, le paragraphe vient", () => {
    const corps = (avecEnigme: boolean) => {
      const l = livreDe(
        [{ ref: 1, texte: [p("La porte."), ...(avecEnigme ? [liaison(id(2))] : []), choix("Entrer", id(2))] }, { ref: 2, fin: true }],
        { pages: (x) => x },
      );
      return corpsDuLivre(l, { travail: false, etatDu: "", image: (x) => x });
    };
    expect(corps(false)).not.toContain("énigme");
    expect(corps(true)).toContain("en résolvant une énigme");
  });

  it("des pages gardées incomplètes ou fausses sont complétées par celles proposées ; une image de page est contrôlée", () => {
    const lues = pagesPropres({ titre: { sousTitre: "Un livre dont tu es le héros", forme: "image", imageId: "pas-un-id" }, auteurs: { place: "fin", noms: ["Zoé", 3] } }, defaut);
    expect(lues.titre).toMatchObject({ sousTitre: "Un livre dont tu es le héros", forme: "image", imageId: null, ligne: defaut.titre.ligne });
    expect(lues.auteurs).toMatchObject({ place: "fin", noms: ["Zoé"] });
    const avecImage = pagesPropres({ fin: { presente: true, forme: "image", imageId: imageId(4) } }, defaut);
    expect(imagesDesPages(avecImage, { aChoix: true, feuille: false })).toEqual([{ page: "Page de fin", image: imageId(4) }]);
  });
});

describe("Dés imprimés (F11.4)", () => {
  it("F11-AC53 — sur 60 pages de droite, chaque face revient autant de fois qu'une autre à une près ; deux pages qui se suivent ne portent pas le même tirage ; le même livre, les mêmes faces", () => {
    for (const des of [1, 2] as const) {
      const tirages = desImprimes(60, des);
      for (let d = 0; d < des; d += 1) {
        const comptes = [1, 2, 3, 4, 5, 6].map((f) => tirages.filter((t) => t[d] === f).length);
        expect(Math.max(...comptes) - Math.min(...comptes)).toBeLessThanOrEqual(1);
      }
      for (let i = 1; i < tirages.length; i += 1) expect(tirages[i].join()).not.toBe(tirages[i - 1].join());
      expect(desImprimes(60, des)).toEqual(tirages);
    }
  });
});

describe("Réglages du livre (F11.3)", () => {
  it("F11-AC60 — une marge sous 10 mm est refusée et garde sa valeur ; « Dés » n'est gardé que pour un livre qui a un dé", () => {
    const r = reglagesPropres({ marges: { interieur: 23, exterieur: 8 }, basDePage: "des", police: "comic" }, { aChoix: true, des: 0 });
    expect(r.marges).toEqual({ haut: 16, bas: 20, exterieur: 15, interieur: 23 });
    expect(r.basDePage).toBe("rien");
    expect(r.police).toBe("vollkorn");
    expect(reglagesPropres({ basDePage: "des" }, { aChoix: true, des: 2 }).basDePage).toBe("des");
  });
});
