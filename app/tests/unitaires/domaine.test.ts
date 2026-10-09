import { describe, expect, it } from "vitest";
import { anneeProposee, libelleAnnee } from "@/domaine/annee";
import {
  codePropose, codeValide, identifiantsProposes, identifiantValide, motDePassePropose,
  normaliserIdentifiant, normaliserMotDePasse,
} from "@/domaine/acces";
import { MOTS } from "@/domaine/mots";
import { construireLot, lireLignes, nomPourEleves, pointsARegler, prenomEnDouble, type ProfilConnu } from "@/domaine/eleves";
import { ecrireHeure, finDePlage, lireHeure, prochaineOuverture, textePlage, travailOuvert, type Plage } from "@/domaine/horaires";
import { ongletsDe } from "@/domaine/projets";
import { de } from "@/domaine/texte";

const suite = (valeurs: number[]) => {
  let i = 0;
  return (n: number) => valeurs[i++ % valeurs.length] % n;
};

describe("Année scolaire d'une classe (F01.1)", () => {
  it("propose l'année qui commence à la rentrée, dès juillet", () => {
    expect(libelleAnnee(anneeProposee(new Date(2026, 9, 9)))).toBe("2026-2027");
    expect(libelleAnnee(anneeProposee(new Date(2027, 2, 1)))).toBe("2026-2027");
    expect(libelleAnnee(anneeProposee(new Date(2027, 6, 10)))).toBe("2027-2028");
  });
});

describe("Prénoms et inscription en lot (F01.1)", () => {
  const connu = (id: string, prenom: string, nom: string | null): ProfilConnu => ({ id, prenom, nom, couleur: 0, de: "CM1-CM2 · 2025-2026" });

  it("lit une ligne « Prénom » ou « Prénom Nom », le nom restant facultatif", () => {
    expect(lireLignes("Noé\n  océane   Girard \n\nMalo Le Gall")).toEqual([
      { prenom: "Noé", nom: null },
      { prenom: "Océane", nom: "Girard" },
      { prenom: "Malo", nom: "Le Gall" },
    ]);
  });

  it("F01-AC21 — deux fois le même prénom : l'initiale du nom s'ajoute pour eux seuls", () => {
    const classe = [
      { id: "a", prenom: "Lucas", nom: "Bernard", couleur: 0 },
      { id: "b", prenom: "Lucas", nom: "Morel", couleur: 1 },
      { id: "c", prenom: "Alice", nom: "Martin", couleur: 2 },
    ];
    expect(nomPourEleves(classe[0], classe)).toBe("Lucas B.");
    expect(nomPourEleves(classe[1], classe)).toBe("Lucas M.");
    expect(nomPourEleves(classe[2], classe)).toBe("Alice");
  });

  it("F01-AC21 — une ligne « Lucas » sans nom, avec un Lucas déjà inscrit, est à régler", () => {
    const lignes = construireLot([], new Set(), "Lucas\nAlice");
    const points = pointsARegler([{ prenom: "Lucas", nom: "Bernard" }], lignes);
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ sorte: "double", rang: 0 });
    expect(pointsARegler([{ prenom: "Lucas", nom: "Bernard" }], construireLot([], new Set(), "Lucas Morel"))).toEqual([]);
  });

  it("F01-AC21 — la règle vaut aussi pour deux profils connus de même prénom, sans nom", () => {
    const connus = [connu("p1", "Lucas", null), { ...connu("p2", "Lucas", null), de: "CE2 · 2024-2025" }, connu("p3", "Alice", null)];
    const lignes = construireLot(connus, new Set(["p1", "p2", "p3"]), "");
    expect(pointsARegler([], lignes).map((p) => [p.sorte, p.rang])).toEqual([["double", 0], ["double", 1]]);
    // Un nom donné à l'un des deux suffit à les distinguer
    const regle = lignes.map((l, i) => (i === 0 && l.type === "connu" ? { ...l, eleve: { ...l.eleve, nom: "B." }, nomDonne: true } : l));
    expect(pointsARegler([], regle).map((p) => p.rang)).toEqual([1]);
    expect(prenomEnDouble([], [{ prenom: "Lucas", nom: null }, { prenom: "Lucas", nom: null }])).toBe("Lucas");
    expect(prenomEnDouble([{ prenom: "Lucas", nom: "Bernard" }], [{ prenom: "lucas", nom: null }])).toBe("lucas");
    expect(prenomEnDouble([{ prenom: "Lucas", nom: null }], [{ prenom: "Lucas", nom: "Morel" }, { prenom: "Alice", nom: null }])).toBeNull();
  });

  it("F01-AC12 — un nom déjà connu est signalé, jamais fusionné d'office", () => {
    const connus = [connu("p1", "Adam", "Morel"), connu("p2", "Inès", "Garcia")];
    const lignes = construireLot(connus, new Set(["p2"]), "adam morel\nNoé");
    expect(lignes[0]).toMatchObject({ type: "connu" });
    expect(lignes[1]).toMatchObject({ type: "neuf", prenom: "Adam", meme: { id: "p1" } });
    expect(pointsARegler([], lignes).map((p) => p.sorte)).toEqual(["meme"]);
  });

  it("F01-AC07 — un homonyme d'un profil déjà coché reste un autre élève", () => {
    const connus = [connu("p1", "Adam", "Morel")];
    const lignes = construireLot(connus, new Set(["p1"]), "Adam Morel");
    expect(lignes).toHaveLength(2);
    expect(lignes[1]).toMatchObject({ type: "neuf", meme: null });
  });
});

describe("Informations de la classe et code (F06.4)", () => {
  it("F06-AC81 — la saisie ignore les majuscules et les espaces en trop", () => {
    expect(normaliserIdentifiant(" CM1Laurent ")).toBe("cm1laurent");
    expect(normaliserMotDePasse("Tigre  nuage 42 ")).toBe("tigre nuage 42");
  });

  it("propose un identifiant fait de minuscules et de chiffres, sans accent", () => {
    const propositions = identifiantsProposes("CM1-CM2", "Mme Laurent", suite([5]));
    expect(propositions[0]).toBe("cm1cm2laurent");
    expect(propositions[1]).toBe("cm1cm2laurent2");
    expect(propositions.every(identifiantValide)).toBe(true);
    expect(identifiantsProposes("É", null, suite([5]))[0]).toBe("classee");
  });

  it("propose un mot de passe de deux mots simples et de deux chiffres", () => {
    expect(motDePassePropose(suite([0, 1, 32]))).toBe("tigre nuage 42");
    expect(motDePassePropose(suite([0, 0, 1, 5]))).toBe("tigre nuage 15");
  });

  it("n'a dans sa liste que des mots sans accent, tous différents", () => {
    expect(MOTS.every((m) => /^[a-z]{3,10}$/.test(m))).toBe(true);
    expect(new Set(MOTS).size).toBe(MOTS.length);
  });

  it("propose un code de quatre chiffres, hors des suites que l'on devine", () => {
    expect(codePropose(suite([1234, 0, 42]))).toBe("0042");
    expect(codeValide("0042")).toBe(true);
    expect(codeValide("42")).toBe(false);
    expect(codeValide("12a4")).toBe(false);
  });
});

describe("Horaires (F06.4)", () => {
  const semaine: Plage = { jours: [1, 2, 4, 5], de: "08:30", a: "16:30" };
  const mercredi: Plage = { jours: [3], de: "08:30", a: "11:30" };
  const paris = (iso: string) => new Date(iso);

  it("lit et écrit les heures comme on les dit", () => {
    expect(lireHeure("8 h 30")).toBe("08:30");
    expect(lireHeure("8h30")).toBe("08:30");
    expect(lireHeure("16 h")).toBe("16:00");
    expect(lireHeure("08:30")).toBe("08:30");
    expect(lireHeure("25 h")).toBeNull();
    expect(ecrireHeure("08:30:00")).toBe("8 h 30");
    expect(ecrireHeure("16:00")).toBe("16 h");
    expect(textePlage(semaine)).toBe("Lun., mar., jeu., ven. · 8 h 30 – 16 h 30");
  });

  it("F06-AC27 — sans horaires, l'heure ne bloque rien ; avec une plage, 18 h est fermé", () => {
    const lundi18h = paris("2026-10-12T18:00:00+02:00");
    expect(travailOuvert(false, [], lundi18h)).toBe(true);
    expect(travailOuvert(true, [{ jours: [1, 2, 3, 4, 5], de: "08:00", a: "17:00" }], lundi18h)).toBe(false);
    expect(travailOuvert(true, [{ jours: [1, 2, 3, 4, 5], de: "08:00", a: "17:00" }], paris("2026-10-12T10:00:00+02:00"))).toBe(true);
  });

  it("F06-AC72 — deux plages : le mercredi à 10 h est ouvert, à 14 h fermé", () => {
    expect(travailOuvert(true, [semaine, mercredi], paris("2026-10-14T10:00:00+02:00"))).toBe(true);
    expect(travailOuvert(true, [semaine, mercredi], paris("2026-10-14T14:00:00+02:00"))).toBe(false);
  });

  it("F06-AC80 — les heures affichées restent les mêmes après le changement d'heure", () => {
    // Vendredi 23 octobre 2026, heure d'été (UTC+2), puis lundi 26 octobre, heure d'hiver (UTC+1)
    expect(travailOuvert(true, [semaine], new Date("2026-10-23T06:29:00Z"))).toBe(false);
    expect(travailOuvert(true, [semaine], new Date("2026-10-23T06:30:00Z"))).toBe(true);
    expect(travailOuvert(true, [semaine], new Date("2026-10-26T06:30:00Z"))).toBe(false);
    expect(travailOuvert(true, [semaine], new Date("2026-10-26T07:30:00Z"))).toBe(true);
    expect(travailOuvert(true, [semaine], new Date("2026-10-26T15:29:00Z"))).toBe(true);
    expect(travailOuvert(true, [semaine], new Date("2026-10-26T15:30:00Z"))).toBe(false);
    // Mars 2027 : vendredi 26 en heure d'hiver, lundi 29 en heure d'été
    expect(travailOuvert(true, [semaine], new Date("2027-03-26T07:30:00Z"))).toBe(true);
    expect(travailOuvert(true, [semaine], new Date("2027-03-29T06:30:00Z"))).toBe(true);
    expect(travailOuvert(true, [semaine], new Date("2027-03-29T06:29:00Z"))).toBe(false);
  });

  it("dit quand le travail rouvre et quand il ferme", () => {
    expect(prochaineOuverture([semaine], paris("2026-10-12T18:00:00+02:00"))).toBe("demain, 8 h 30");
    expect(prochaineOuverture([semaine], paris("2026-10-16T18:00:00+02:00"))).toBe("lundi, 8 h 30");
    expect(prochaineOuverture([semaine], paris("2026-10-12T07:00:00+02:00"))).toBe("8 h 30");
    expect(prochaineOuverture([], paris("2026-10-12T07:00:00+02:00"))).toBeNull();
    expect(finDePlage(true, [semaine], paris("2026-10-12T10:00:00+02:00"))).toBe("16:30");
  });
});

describe("Projets (F01)", () => {
  it("le mode personnel n'a pas d'onglet Suivi", () => {
    expect(ongletsDe("classe")).toEqual(["preparation", "plan", "suivi", "livre"]);
    expect(ongletsDe("personnel")).toEqual(["preparation", "plan", "livre"]);
  });
});

describe("Mots", () => {
  it("élide « de » devant une voyelle ou un h", () => {
    expect(de("Bilal")).toBe("de Bilal");
    expect(de("Alice")).toBe("d’Alice");
    expect(de("Hugo")).toBe("d’Hugo");
    expect(de("Mme Laurent")).toBe("de Mme Laurent");
    expect(de("Élodie")).toBe("d’Élodie");
  });
});
