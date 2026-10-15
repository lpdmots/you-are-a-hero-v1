import { describe, expect, it } from "vitest";
import { controler, type Probleme } from "@/domaine/controles";
import type { Texte } from "@/domaine/copie";
import { conditionsDuLivre } from "@/domaine/livre";
import type { Lien } from "@/domaine/recit";
import { reglagesDeDepart } from "@/domaine/mise-en-page";
import { choix, id, image, imageId, p, planDe, type Decrite } from "../livre/fabrique";

/**
 * Étape 6 du plan, lot 5 : la règle unique du PDF définitif et du partage (F11.2, 15 octobre
 * 2026), calculée d'après les points des contrôles.
 */

function controles(scenes: Decrite[], o: { images?: Record<string, { largeur: number; hauteur: number }>; actions?: number[]; feuille?: boolean } = {}): Probleme[] {
  const plan = planDe(scenes);
  const textes = new Map(scenes.map((s) => [id(s.ref), s.texte ?? [p(`Texte ${s.ref}.`)]] as [string, Texte]));
  plan.liens = scenes.flatMap((s) => (textes.get(id(s.ref)) ?? []).flatMap((b): Lien[] => (b.type === "choix" && "auto" in b && b.auto ? [{ sceneId: id(s.ref), renvoiId: b.id, cibleId: b.cible, libelle: b.libelle, cache: false }] : [])));
  return controler({
    plan, aChoix: true, scenesAvecActions: new Set((o.actions ?? []).map(id)), feuille: o.feuille ?? true,
    contenu: { textes, images: o.images ?? {}, reglages: reglagesDeDepart(true), debordements: [], imagesDesPages: [] },
  });
}
const PRET = { aChoix: true, convient: true, doute: false, imprimerOuvert: true };
const livreFini: Decrite[] = [{ ref: 1, texte: [p("Le quai."), choix("Partir", id(2))] }, { ref: 2, fin: true }];

describe("Une seule règle pour le PDF définitif et le partage (F11.2)", () => {
  it("un livre fini et déclaré : le PDF définitif et le partage sont possibles, sans rien à rappeler", () => {
    expect(conditionsDuLivre(controles(livreFini), PRET)).toEqual({ pdf: { possible: true, raisons: [] }, partage: { possible: true, raisons: [] }, rappels: [] });
  });

  it("F11-AC04, F11-AC05 — une scène du livre à finir refuse le PDF et le partage ; une scène hors du livre, même en cours, ne bloque rien", () => {
    const c = conditionsDuLivre(controles([...livreFini.slice(0, 1), { ref: 2, fin: true, etat: "cours" }]), PRET);
    expect(c.pdf).toEqual({ possible: false, raisons: [{ etape: "relire", texte: "1 scène à finir" }] });
    expect(c.partage.possible).toBe(false);
    expect(conditionsDuLivre(controles([...livreFini, { ref: 3, hors: true, etat: "cours" }]), PRET).pdf.possible).toBe(true);
  });

  it("F09-AC04, F09-AC10, F10-AC14, F11-AC56 — un choix vers une scène exclue, une image introuvable, un numéro fixé trop grand : refusé, chacun à son étape", () => {
    const c = conditionsDuLivre(
      controles([
        { ref: 1, texte: [p("Le quai."), image(9, 60), choix("Partir", id(2)), choix("Rester", id(3))] },
        { ref: 2, fin: true, fixe: 40 },
        { ref: 3, fin: true, hors: true },
      ]),
      PRET,
    );
    expect(c.pdf.possible).toBe(false);
    expect(c.pdf.raisons).toEqual([
      { etape: "relire", texte: "1 à corriger" },
      { etape: "chemins", texte: "2 à corriger" },
    ]);
  });

  it("F11-AC99 — un doute sur l'ordre refuse le PDF définitif, pas le partage ; sans « La mise en page me convient », le PDF attend sa déclaration", () => {
    const pts = controles(livreFini);
    const doute = conditionsDuLivre(pts, { ...PRET, doute: true });
    expect(doute.pdf).toEqual({ possible: false, raisons: [{ etape: "page", texte: "L’ordre des passages est à confirmer" }] });
    expect(doute.partage.possible).toBe(true);
    expect(conditionsDuLivre(pts, { ...PRET, convient: false }).pdf.raisons).toEqual([{ etape: "page", texte: "« La mise en page me convient » reste à déclarer" }]);
    expect(conditionsDuLivre(pts, { ...PRET, imprimerOuvert: false }).partage.raisons).toEqual([{ etape: "sortie", texte: "« Imprimer et partager » n’est pas encore ouverte" }]);
  });

  it("F11-AC100, F04-AC33 — une image peu définie et des actions sans feuille d'aventure ne bloquent rien ; elles sont rappelées", () => {
    const c = conditionsDuLivre(
      controles([{ ref: 1, texte: [p("Le quai."), image(1, 100), choix("Partir", id(2))] }, { ref: 2, fin: true }], { images: { [imageId(1)]: { largeur: 500, hauteur: 400 } }, actions: [1], feuille: false }),
      PRET,
    );
    expect(c.pdf.possible).toBe(true);
    expect(c.rappels.map((x) => x.sorte).sort()).toEqual(["image-floue", "jeu-sans-feuille"]);
  });
});
