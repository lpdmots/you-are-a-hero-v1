import { describe, expect, it } from "vitest";
import { libelleDAjout } from "@/composants/copie/FicheIdees";
import { ideesChoix } from "@/serveur/ia/aides/idees-choix";

/** Étape 8, lot 4 : les idées de choix (F13.3), ce qui se vérifie sans base ni navigateur. */

const entree = {
  histoire: { titre: "Les passeurs de brume", mode: "classe" as const, recit: "choix" as const, age: "8-10" as const },
  chapitre: { titre: "La lisière" },
  scene: { titre: "Le pont", consigne: null, paragraphes: ["Lou avance."] },
  scenes: [{ ref: "S001", titre: "Le gué" }],
  objets: [],
  choixExistants: ["Fuir"],
  dejaMontrees: ["Suivre la chouette"],
};

describe("Le bouton qui dit ce qu'il ajoute (F13.3)", () => {
  const nouvelle = { destination: { sorte: "nouvelle" as const, titre: "Le nid", chapitreId: "c" } };
  const existante = { destination: { sorte: "existante" as const, sceneId: "s" } };
  it("« Ajouter 2 choix et 1 scène », « Ajouter 1 choix », « Ajouter 3 choix et 2 scènes »", () => {
    expect(libelleDAjout([nouvelle, existante])).toBe("Ajouter 2 choix et 1 scène");
    expect(libelleDAjout([existante])).toBe("Ajouter 1 choix");
    expect(libelleDAjout([nouvelle, nouvelle, existante])).toBe("Ajouter 3 choix et 2 scènes");
    expect(libelleDAjout([])).toBe("Ajouter");
  });
});

describe("La réponse de l'IA, relue sans confiance (F13-AC11)", () => {
  it("une destination inconnue devient une nouvelle scène si un titre l'accompagne, sinon l'idée tombe ; les doublons et les idées déjà vues aussi", () => {
    const lu = ideesChoix.lire(
      {
        idees: [
          { libelle: "Traverser le pont.", intention: "Lou passe.", scene: "", titre: "L'autre rive" },
          { libelle: "Revenir au gué", intention: "Prudence.", scene: "s001", titre: "" },
          { libelle: "Aller ailleurs", intention: "Inconnu.", scene: "S999", titre: "" },
          { libelle: "fuir", intention: "Déjà dans la scène.", scene: "", titre: "La fuite" },
          { libelle: "Suivre la chouette", intention: "Déjà montrée.", scene: "", titre: "Le nid" },
          { libelle: "Traverser le pont", intention: "Doublon.", scene: "", titre: "Encore" },
          { libelle: "Appeler à l'aide", intention: "Quelqu'un répond.", scene: "S999", titre: "L'écho" },
        ],
      },
      entree,
    );
    expect(lu?.idees).toEqual([
      { libelle: "Traverser le pont", intention: "Lou passe.", destination: { sorte: "nouvelle", titre: "L'autre rive" } },
      { libelle: "Revenir au gué", intention: "Prudence.", destination: { sorte: "existante", ref: "S001" } },
      { libelle: "Appeler à l'aide", intention: "Quelqu'un répond.", destination: { sorte: "nouvelle", titre: "L'écho" } },
    ]);
  });
});
