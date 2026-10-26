import { describe, expect, it } from "vitest";
import { adresseDepuisTitre, adresseLibre, etatDeLaPublication, passagesChanges, peutProposer, presentationPropre, PRESENTATION_MAX, reperesDuLivre, type LignePublication } from "@/domaine/bibliotheque";
import type { PassagePartage, VersionPartagee } from "@/domaine/partage";
import { chercheEnAdresse, demandeDepuis, livresDeLaListe, type LivrePublie } from "@/domaine/bibliotheque-publique";
import { relecture } from "@/serveur/ia/aides/relecture";
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

describe("La relecture (F15, lot 2)", () => {
  const passage = (id: string, numero: number, texte: string): PassagePartage => ({
    id, numero, partie: null, chapitre: null, separateur: false, fin: false, enigmes: [], blocs: [{ type: "p", id: `${id}-p`, mots: [{ text: texte }] }],
  });
  const version = (passages: PassagePartage[]): VersionPartagee => ({ titre: "La lanterne", aChoix: true, marqueFin: "Fin", passages, presentation: null, feuille: null, des: 0, images: {} });

  it("F15-AC07 — les passages changés d'une mise à jour, comparés par leur identité : changé, nouveau, retiré", () => {
    const avant = version([passage("a", 1, "La brume s’épaissi."), passage("b", 2, "Le pont."), passage("c", 3, "La fin.")]);
    const apres = version([passage("a", 1, "La brume s’épaissit."), passage("b", 2, "Le pont."), passage("d", 3, "Une autre fin.")]);
    expect(passagesChanges(avant, apres)).toEqual([
      { id: "a", repere: "Passage 1", sorte: "change" },
      { id: "d", repere: "Passage 3", sorte: "ajoute" },
      { id: "c", repere: "Passage 3", sorte: "retire" },
    ]);
    expect(reperesDuLivre(apres).get("d")).toBe("P3");
  });

  it("F15-AC03 — le rapport ne garde que des repères du livre et des raisons connues ; dix points au plus", () => {
    const e = { histoire: { titre: "La lanterne", mode: "classe" as const, recit: "choix" as const, age: "8-10" as const }, passages: [{ repere: "P17", texte: "…" }], autour: null, images: [] };
    const lu = relecture.lire({
      points: [
        { repere: "p17", phrase: "la maîtresse Mme Dupont est bête et grosse", motif: "moquerie", explication: "Une personne réelle." },
        { repere: "P99", phrase: "hors du livre", motif: "haine", explication: "" },
        { repere: "P17", phrase: "Alice", motif: "prenom", explication: "" },
      ],
    }, e);
    expect(lu).toEqual({ points: [{ repere: "P17", phrase: "la maîtresse Mme Dupont est bête et grosse", motif: "moquerie", explication: "Une personne réelle." }] });
    expect(relecture.lire({ points: [] }, e)).toEqual({ points: [] });
    expect(relecture.lire({}, e)).toBeNull();
  });
});

describe("La liste de /bibliotheque (F15, lot 3)", () => {
  const livre = (adresse: string, publieLe: string, x: Partial<LivrePublie> = {}): LivrePublie => ({
    adresse, titre: adresse, sousTitre: "", ligne: "", presentation: "", age: "8-10", aChoix: true, passages: 40, image: null, publieLe, coeurs: 0, ...x,
  });
  const livres = [
    livre("la-lanterne-du-passeur", "2026-11-02T10:00:00Z", { titre: "La lanterne du passeur", presentation: "Le passeur de brume attend sur le quai.", coeurs: 3 }),
    livre("le-grand-voyage", "2026-11-05T10:00:00Z", { titre: "Le grand voyage", aChoix: false, age: "6-8", coeurs: 9 }),
    livre("electro-nick", "2026-11-09T10:00:00Z", { titre: "Électro Nick", age: "10-12" }),
  ];
  const liste = (p: Record<string, string>) => livresDeLaListe(livres, demandeDepuis(p)).map((l) => l.adresse);

  it("F15-AC11 — les plus récents d'abord ; les plus aimés ; l'âge et le type ; la recherche dans le titre et la présentation", () => {
    expect(liste({})).toEqual(["electro-nick", "le-grand-voyage", "la-lanterne-du-passeur"]);
    expect(liste({ tri: "aimes" })).toEqual(["le-grand-voyage", "la-lanterne-du-passeur", "electro-nick"]);
    expect(liste({ age: "8-10", type: "choix" })).toEqual(["la-lanterne-du-passeur"]);
    expect(liste({ type: "classique" })).toEqual(["le-grand-voyage"]);
    expect(liste({ q: "lanterne" })).toEqual(["la-lanterne-du-passeur"]);
    expect(liste({ q: "passeur de brume" })).toEqual(["la-lanterne-du-passeur"]);
    expect(liste({ q: "electro" })).toEqual(["electro-nick"]);
    // Une valeur inconnue ne filtre rien ; l'adresse ne garde que ce qui diffère du défaut
    expect(liste({ age: "3-5", type: "roman", tri: "x" })).toHaveLength(3);
    expect(chercheEnAdresse(demandeDepuis({ q: " lanterne ", tri: "recents" }))).toBe("?q=lanterne");
  });
});
