import { describe, expect, it } from "vitest";
import {
  etapeDOuverture, etapeFaite, etapesDe, nomEtape, orientationsPropres, prendreDansLaReserve, questionDeLEtape, titreQuestions,
} from "@/domaine/preparation";
import { sansCoupureFautive } from "@/domaine/texte";
import { idees, questions, retenons, type EntreeEtape } from "@/serveur/ia/aides/preparation";

/**
 * La Préparation en étapes (F02, décision du 17 octobre 2026 ; F13.4) : le parcours, l'étape
 * d'ouverture, ce qui coche une étape, la réserve de l'IA et ce que reçoit le modèle.
 */
const vide = { univers: "", personnages: "", enjeu: "" };

describe("Le parcours en étapes (F02, 17 octobre 2026)", () => {
  it("quatre étapes de l'histoire, puis « Les choix » et « Le jeu » ; un récit classique n'a pas « Les choix », et « Le jeu » s'y appelle « Les objets »", () => {
    expect(etapesDe("choix")).toEqual(["univers", "personnages", "enjeu", "etapes", "choix", "jeu"]);
    expect(etapesDe("classique")).toEqual(["univers", "personnages", "enjeu", "etapes", "jeu"]);
    expect(nomEtape("jeu", "choix")).toBe("Le jeu");
    expect(nomEtape("jeu", "classique")).toBe("Les objets");
    expect(nomEtape("etapes", "choix")).toBe("Grandes étapes");
  });

  it("une étape de l'histoire est faite quand « Nous retenons » n'est pas vide ; Grandes étapes, dès qu'il y a une partie", () => {
    expect(etapeFaite("personnages", { ...vide, personnages: "  " }, 0)).toBe(false);
    expect(etapeFaite("personnages", { ...vide, personnages: "Lou, 10 ans." }, 0)).toBe(true);
    expect(etapeFaite("etapes", vide, 0)).toBe(false);
    expect(etapeFaite("etapes", vide, 2)).toBe(true);
  });

  it("la page s'ouvre sur la première étape sans texte retenu ; tout est fait : sur la première", () => {
    expect(etapeDOuverture(vide, 0)).toBe("univers");
    expect(etapeDOuverture({ ...vide, univers: "Un pays de brume." }, 0)).toBe("personnages");
    expect(etapeDOuverture({ univers: "a", personnages: "b", enjeu: "c" }, 0)).toBe("etapes");
    expect(etapeDOuverture({ univers: "a", personnages: "b", enjeu: "c" }, 1)).toBe("univers");
  });

  it("F02-AC19 — en projet personnel, les questions s'adressent à l'auteur, les étapes facultatives comprises", () => {
    expect(titreQuestions("classe")).toBe("Questions pour la classe");
    expect(titreQuestions("personnel")).toBe("Questions pour vous");
    expect(questionDeLEtape("personnages", "personnel", "choix")).toContain("votre héros");
    expect(questionDeLEtape("choix", "personnel", "choix")).toContain("votre livre");
    expect(questionDeLEtape("choix", "classe", "choix")).toContain("notre livre");
  });

  it("l'orientation gardée est relue sans confiance : une par étape de l'histoire, courte", () => {
    expect(orientationsPropres({ personnages: "  des animaux  ", jeu: "non", univers: 3 })).toEqual({ personnages: "des animaux" });
    expect(orientationsPropres(null)).toEqual({});
    expect(orientationsPropres({ enjeu: "x".repeat(900) }).enjeu).toHaveLength(600);
  });

  it("« ? » et « -ce » ne passent pas seuls à la ligne, à l'affichage", () => {
    expect(sansCoupureFautive("Qui est-ce ?")).toBe("Qui est‑ce ?");
  });
});

describe("La réserve de l'IA (F13.4)", () => {
  it("livre un élément à la fois, sans redire ce que la liste a déjà, casse comprise", () => {
    const r = prendreDansLaReserve(["De quoi a-t-il peur ?", "Qui l'aide ?", "Où dort-il ?"], ["de quoi a-t-il peur ?"]);
    expect(r).toEqual({ element: "Qui l'aide ?", reste: ["Où dort-il ?"] });
    expect(prendreDansLaReserve(r.reste, [])).toEqual({ element: "Où dort-il ?", reste: [] });
    expect(prendreDansLaReserve([], [])).toEqual({ element: null, reste: [] });
  });
});

describe("Ce que reçoit le modèle pour une étape (F13.4)", () => {
  const entree: EntreeEtape = {
    histoire: { titre: "Les passeurs de brume", mode: "classe", recit: "choix", niveaux: ["CM1"] },
    etape: "personnages",
    question: "Qui est notre héros, et qu'est-ce qui le rend unique ?",
    questions: ["De quoi a-t-il peur ?"],
    idees: [{ texte: "Il ne peut pas voler", etat: "retenue" }, { texte: "Des jumeaux", etat: "ecartee" }],
    retenu: "Lou, 10 ans.",
    carnet: { univers: "Un pays de brume.", personnages: "Lou, 10 ans.", enjeu: "" },
    orientation: "un compagnon animal",
  };

  it("F13-AC14 — la question de l'étape, ses questions, ses idées et leurs états, le texte retenu, les autres étapes et l'orientation", () => {
    for (const def of [questions, idees, retenons]) {
      const message = def.message(entree);
      expect(message).toContain("Qui est notre héros");
      expect(message).toContain("De quoi a-t-il peur ?");
      expect(message).toContain("Il ne peut pas voler (retenue)");
      expect(message).toContain("Des jumeaux (écartée)");
      expect(message).toContain("Lou, 10 ans.");
      expect(message).toContain("Univers : Un pays de brume.");
      expect(message).toContain("un compagnon animal");
      // L'étape elle-même n'est pas redite dans le carnet des autres étapes
      expect(message).not.toContain("Personnages : Lou");
    }
  });

  it("six questions ou six idées par demande, sans reprendre ce que la liste a déjà", () => {
    const q = questions.lire({ questions: ["De quoi a-t-il peur ?", "Qui l'aide ?", "Où dort-il ?", "A", "B", "C", "D", "E"] }, entree);
    expect(q?.questions).toEqual(["Qui l'aide ?", "Où dort-il ?", "A", "B", "C", "D"]);
    expect(idees.lire({ idees: ["il ne peut pas voler", "Un renard"] }, entree)?.idees).toEqual(["Un renard"]);
    expect(questions.lire({ questions: ["De quoi a-t-il peur ?"] }, entree)).toBeNull();
  });
});
