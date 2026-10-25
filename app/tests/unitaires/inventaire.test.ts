import { describe, expect, it } from "vitest";
import { ajouterALaListe, blocsAvecObjets, dansLaListe, listeDesObjets, nomDInventaire, objetsDeLAction, rayerDeLaListe } from "@/domaine/inventaire";
import type { BlocLu, EtatFeuille } from "@/domaine/lecture";
import type { Feuille } from "@/domaine/preparation";

const OBJETS = ["la corde", "la clé", "la clé d’argent", "l’épée", "Excalibur", "une lanterne"];

describe("Objets à noter depuis une action de jeu (F04.2, 25 octobre 2026)", () => {
  it("F04-AC44 — l'action qui donne un objet de la liste le propose, sans son article", () => {
    expect(objetsDeLAction("Ajoute la corde à ton inventaire.", OBJETS)).toEqual([{ nom: "Corde", geste: "noter" }]);
    expect(objetsDeLAction("Tu ramasses l'épée.", OBJETS)).toEqual([{ nom: "Épée", geste: "noter" }]);
    expect(objetsDeLAction("Note Excalibur sur ta feuille.", OBJETS)).toEqual([{ nom: "Excalibur", geste: "noter" }]);
  });

  it("F04-AC44 — l'action qui retire propose de rayer ; chaque objet prend le verbe de sa phrase", () => {
    expect(objetsDeLAction("Raye la corde de ton inventaire.", OBJETS)).toEqual([{ nom: "Corde", geste: "rayer" }]);
    expect(objetsDeLAction("Donne la lanterne au passeur, puis ajoute la corde.", OBJETS)).toEqual([
      { nom: "Lanterne", geste: "rayer" },
      { nom: "Corde", geste: "noter" },
    ]);
  });

  it("F04-AC44 — « te donne » donne au lecteur, « te prend » lui ôte", () => {
    expect(objetsDeLAction("Le vieil homme te donne la lanterne.", OBJETS)).toEqual([{ nom: "Lanterne", geste: "noter" }]);
    expect(objetsDeLAction("Le garde te prend l’épée.", OBJETS)).toEqual([{ nom: "Épée", geste: "rayer" }]);
  });

  it("F04-AC44 — le nom le plus long l'emporte, sans doublon ; sans verbe qui donne ou retire, rien", () => {
    expect(objetsDeLAction("Ajoute la clé d'argent à ton inventaire.", OBJETS)).toEqual([{ nom: "Clé d’argent", geste: "noter" }]);
    expect(objetsDeLAction("Si tu as la corde, rends-toi au 12.", OBJETS)).toEqual([]);
    expect(objetsDeLAction("Ajoute la cordelette à ton inventaire.", OBJETS)).toEqual([]);
  });

  it("F04-AC20 — seuls les objets que l'action nomme sont posés sur elle ; les autres blocs ne changent pas", () => {
    const blocs: BlocLu[] = [
      { type: "p", id: "p", mots: [{ text: "Une corde pend du mât." }] },
      { type: "action", id: "a", signe: "sac", mots: [{ text: "Ajoute la " }, { text: "corde", bold: true }, { text: " à ton inventaire." }] },
    ];
    const lus = blocsAvecObjets(blocs, OBJETS);
    expect(lus[0]).toBe(blocs[0]);
    expect(lus[1]).toMatchObject({ objets: [{ nom: "Corde", geste: "noter" }] });
    expect(blocsAvecObjets(blocs, [])).toBe(blocs);
  });
});

describe("L'inventaire en badges (F04-AC45)", () => {
  const feuille: Feuille = {
    on: true, des: 0,
    sections: [{ id: "comp", type: "liste", titre: "Compétences", lignes: 4 }, { id: "inv", type: "liste", titre: "Mon sac", lignes: 6 }],
  };
  const vide: EtatFeuille = { compteurs: {}, listes: { inv: ["", "Corde", ""] }, notes: {} };

  it("les objets se notent dans la liste qui s'appelle inventaire ou sac, sinon dans la première", () => {
    expect(listeDesObjets(feuille)).toBe("inv");
    expect(listeDesObjets({ ...feuille, sections: [feuille.sections[0]] })).toBe("comp");
    expect(listeDesObjets({ ...feuille, sections: [] })).toBeNull();
  });

  it("un nom déjà écrit, quelle qu'en soit la casse ou l'article, ne se répète pas ; il se raye de même", () => {
    expect(dansLaListe(vide.listes.inv, "la corde")).toBe(true);
    expect(ajouterALaListe(vide, "inv", "corde")).toBe(vide);
    const avec = ajouterALaListe(vide, "inv", "  Clé   d’argent ");
    expect(avec.listes.inv).toEqual(["Corde", "Clé d’argent"]);
    expect(rayerDeLaListe(avec, "inv", "la corde").listes.inv).toEqual(["Clé d’argent"]);
    expect(nomDInventaire("une lanterne")).toBe("Lanterne");
  });
});
