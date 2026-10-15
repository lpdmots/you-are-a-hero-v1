import { beforeAll, describe, expect, it } from "vitest";
import type { LivreACompose } from "@/domaine/composition";
import { composer, type Composition } from "@/serveur/livre/composer";
import { choix, id, image, imageId, livreDe, p, png, recit } from "./fabrique";

/**
 * Étape 6 du plan, lot 4 : ce que la composition dit des blancs (F11.3, pages peu remplies) et
 * l'ajustement « Commencer sur une nouvelle page », gardé d'un export à l'autre (F11-AC10).
 */

const ETAT = "état du 15 octobre, 10 h 00";
const compose = (livre: LivreACompose, lireImage: Parameters<typeof composer>[1]["lireImage"] = async () => null) => composer(livre, { travail: false, etatDu: ETAT, lireImage });
const HAUTEUR_UTILE = 210 - 16 - 20;

describe("Pages peu remplies (F11.3, F11-AC44)", () => {
  let avecImage: Composition;
  let avecSaut: Composition;
  beforeAll(async () => {
    // Le passage 2 s'ouvre sur une image pleine page : la page du passage 1 reste presque blanche
    const images = { [imageId(1)]: { largeur: 1400, hauteur: 2000 } };
    const dessin = png(1400, 2000);
    avecImage = await compose(
      livreDe(
        [
          { ref: 1, texte: [p("Lou longe le quai."), choix("Monter à bord", id(2))] },
          { ref: 2, texte: [image(1, 100, "i-1", true), ...recit(2, 2), choix("Descendre", id(3))] },
          { ref: 3, fin: true, texte: recit(3, 3) },
        ],
        { images },
      ),
      async () => ({ octets: dessin, type: "image/png" }),
    );
    // Le passage 3 commence sur une nouvelle page, à la demande de l'adulte
    avecSaut = await compose(
      livreDe(
        [
          { ref: 1, texte: [p("Lou longe le quai."), choix("Monter à bord", id(2))] },
          { ref: 2, texte: [p("Le bac tangue."), choix("Attendre", id(3))] },
          { ref: 3, texte: [...recit(3, 2), choix("Rentrer", id(4))] },
          { ref: 4, fin: true, texte: recit(4, 3) },
        ],
        { nouvellesPages: [3] },
      ),
    );
  }, 60_000);

  it("le blanc qui précède une image pleine page est compté : sa page est repérée, avec sa hauteur en millimètres", () => {
    const page = avecImage.rapport.pageDe[id(1)];
    const blanc = avecImage.rapport.peuRemplies.find((x) => x.page === page);
    expect(blanc).toBeDefined();
    expect(blanc!.mm).toBeGreaterThan(HAUTEUR_UTILE / 4);
    expect(blanc!.y + blanc!.h).toBeCloseTo(210 - 20, 0);
  });

  it("F11-AC10 — un passage réglé pour commencer sur une nouvelle page commence en haut d'une page ; le blanc qui le précède n'est pas compté", () => {
    const r = avecSaut.rapport;
    expect(r.pageDe[id(3)]).toBe(r.pageDe[id(2)] + 1);
    const numero = r.carte.find((b) => b.scene === id(3) && b.page === r.pageDe[id(3)]);
    // En tête de la zone de texte : la marge du haut, puis l'espace au-dessus du numéro
    expect(numero!.y).toBeLessThan(16 + 10);
    expect(r.peuRemplies.some((x) => x.page === r.pageDe[id(2)])).toBe(false);
  });

  it("la dernière page du récit n'est jamais comptée", () => {
    for (const c of [avecImage, avecSaut]) {
      const derniere = Math.max(...Object.values(c.rapport.pageDe));
      expect(c.rapport.peuRemplies.some((x) => x.page >= derniere)).toBe(false);
    }
  });
});
