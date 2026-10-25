import { describe, expect, it } from "vitest";
import { adresseDepuisTitre, adresseLibre, etatDeLaPublication, peutProposer, presentationPropre, PRESENTATION_MAX, type LignePublication } from "@/domaine/bibliotheque";
import { CONDITIONS, MODELES } from "@/domaine/textes-publics";

/** Bibliothèque publique des livres (F15), sans base : l'adresse, la présentation, l'état, les textes. */

const vide: LignePublication = { adresse: null, version: null, mise_a_jour_le: null, proposee: null, proposee_le: null, refus_motif: null, refusee_le: null };

describe("L'adresse d'un livre (F15, « Liste, tri, filtres »)", () => {
  it("F15-AC04 — tirée du titre, sans accents ni signes ; un doublon reçoit un suffixe", () => {
    expect(adresseDepuisTitre("La lanterne du passeur")).toBe("la-lanterne-du-passeur");
    expect(adresseDepuisTitre("L’île aux dragons !")).toBe("l-ile-aux-dragons");
    expect(adresseDepuisTitre("Œuf de Pâques — épisode 2")).toBe("oeuf-de-paques-episode-2");
    expect(adresseDepuisTitre("???")).toBe("livre");
    expect(adresseDepuisTitre("Un titre vraiment très long qui ne tient pas dans une adresse raisonnable du tout").length).toBeLessThanOrEqual(60);
    expect(adresseLibre("La lanterne du passeur", new Set(["la-lanterne-du-passeur", "la-lanterne-du-passeur-2"]))).toBe("la-lanterne-du-passeur-3");
  });
});

describe("Proposer (F15)", () => {
  it("la présentation : espaces réduits, jamais vide ni trop longue", () => {
    expect(presentationPropre("  Au bord\n du fleuve.  ")).toBe("Au bord du fleuve.");
    expect(presentationPropre(" ")).toBeNull();
    expect(presentationPropre("a".repeat(PRESENTATION_MAX + 1))).toBeNull();
  });

  it("F15-AC18 — une seule proposition en attente ; la version publiée reste lisible pendant la relecture d'une mise à jour, et après son refus (F15-AC07)", () => {
    expect(etatDeLaPublication(null)).toEqual({ sorte: "aucune" });
    const attente = etatDeLaPublication({ ...vide, proposee: {}, proposee_le: "2026-11-02T10:00:00Z" });
    expect(attente).toEqual({ sorte: "attente", depuis: "2026-11-02T10:00:00Z" });
    expect(peutProposer(attente)).toBe(false);
    const publiee = { ...vide, adresse: "la-lanterne", version: {}, mise_a_jour_le: "2026-11-05T10:00:00Z" };
    const maj = etatDeLaPublication({ ...publiee, proposee: {}, proposee_le: "2026-11-09T10:00:00Z" });
    expect(maj).toMatchObject({ sorte: "publiee", adresse: "la-lanterne", miseAJour: { sorte: "attente" } });
    expect(peutProposer(maj)).toBe(false);
    const refusee = etatDeLaPublication({ ...publiee, refus_motif: "Contenu inadapté.", refusee_le: "2026-11-10T10:00:00Z" });
    expect(refusee).toMatchObject({ sorte: "publiee", miseAJour: { sorte: "refusee", motif: "Contenu inadapté." } });
    expect(peutProposer(refusee)).toBe(true);
    expect(etatDeLaPublication({ ...vide, refus_motif: "Contenu inadapté.", refusee_le: "2026-11-10T10:00:00Z" })).toMatchObject({ sorte: "refusee" });
  });
});

describe("Les textes (F15, « Autorisation des familles », « Conditions d'utilisation »)", () => {
  it("le modèle d'autorisation n'a plus que la ligne de la bibliothèque, rien de coché d'avance, et ne parle plus de lien", () => {
    const modele = MODELES.find((m) => m.cle === "autorisation-de-diffusion")!;
    const texte = JSON.stringify(modele);
    expect(texte).toContain("☐ autorise ☐ n’autorise pas la diffusion des textes et des dessins de mon enfant, avec son prénom, dans la bibliothèque du site.");
    expect(texte).not.toMatch(/lien de lecture|n’est publié nulle part|☑|☒/);
  });

  it("les conditions disent la clause de la bibliothèque", () => {
    const texte = JSON.stringify(CONDITIONS);
    expect(texte).toContain("vous permettez à l’éditeur de l’afficher publiquement et gratuitement tant qu’il est dans la bibliothèque");
  });
});
