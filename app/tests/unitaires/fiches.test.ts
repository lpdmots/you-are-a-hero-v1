import { describe, expect, it } from "vitest";
import type { Etat } from "@/domaine/etats";
import { completer, decompte, elevesACompleter, feuilles, horsFiche, lireReglages, REGLAGES_HABITUELS, repartir, surAucuneFeuille } from "@/domaine/fiches";
import type { Chapitre, ElevePlan, Partie, Plan, Scene } from "@/domaine/recit";

/** Étape 4 du plan, lot 5 : les fiches de rédaction, leurs feuilles et le partage des scènes sans élève (F07.4), sans base ni navigateur. */

const eleve = (prenom: string): ElevePlan => ({ id: prenom.toLowerCase(), prenom, nom: null, couleur: 0 });
let reference = 0;
const scene = (etat: Etat = "cours", par: string | null = null, extra: Partial<Scene> = {}): Scene => {
  reference += 1;
  return {
    id: `s${reference}`, chapitreId: "", reference, titre: `Scène ${reference}`, consigne: "Une consigne.", fin: false, horsLivre: false, creeParEleve: null,
    priseParEleve: par, priseParEnseignant: false, ancien: null, etat, texteVide: true, ecritPar: [], rangLivre: null, numeroFixe: null, ...extra,
  };
};
const chapitre = (id: string, eleves: ElevePlan[], scenes: Scene[]): Chapitre => ({
  id, partieId: "foret", titre: id, couleur: 0, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: null,
  scenes: scenes.map((s) => ({ ...s, chapitreId: id })), attributions: eleves.map((e) => ({ eleveId: e.id, profil: "propositions" })),
});
const plan = (...chapitres: Chapitre[]): Plan => {
  const partie: Partie = { id: "foret", titre: "La forêt", chapitres, imageId: null, visuelChoisi: null, visuelDefaut: null, groupeAvecPrecedente: false, ouvertureSceneId: null };
  return { parties: [partie], corbeille: [], departSceneId: null, liens: [] };
};
const toutes = (p: Plan): Set<string> => new Set(p.parties.flatMap((x) => x.chapitres.flatMap((c) => c.scenes.map((s) => s.id))));
/** Les scènes proposées à chaque élève, par leur rang dans le chapitre. */
const parts = (p: Plan, propositions: Map<string, string>): Record<string, number[]> => {
  const scenes = p.parties.flatMap((x) => x.chapitres.flatMap((c) => c.scenes));
  const recu: Record<string, number[]> = {};
  for (const [id, e] of propositions) (recu[e] ??= []).push(scenes.findIndex((s) => s.id === id));
  return recu;
};
const libres = (n: number): Scene[] => Array.from({ length: n }, () => scene());

describe("Ce qui se choisit (F07.4)", () => {
  it("F07-AC54, AC70 — pas de fiche sans consigne, ni pour la scène de l'enseignant ; dès qu'une consigne est ajoutée, ou la scène rendue à un élève, elle peut l'être", () => {
    expect(horsFiche(scene("cours", null, { consigne: "  " }))).toBe("sans-consigne");
    expect(horsFiche(scene("cours", null, { consigne: "Décris le pont." }))).toBeNull();
    expect(horsFiche(scene("cours", null, { priseParEnseignant: true }))).toBe("enseignant");
    expect(horsFiche(scene("cours", "alice"))).toBeNull();
    // Une scène remise ou validée n'a plus rien à écrire
    expect(horsFiche(scene("valider", "alice"))).toBe("ne-s-ecrit-plus");
    expect(horsFiche(scene("reprendre", "alice"))).toBeNull();
  });
});

describe("Les feuilles (F07.4)", () => {
  const [alice, bilal, jade] = [eleve("Alice"), eleve("Bilal"), eleve("Jade")];

  it("F07-AC53 — une feuille par élève : celle d'Alice liste ses deux scènes, celle de Bilal la sienne, et la scène sans élève n'est sur aucune ; par chapitre, elle est sur la feuille du chapitre", () => {
    const p = plan(chapitre("lisiere", [alice, bilal], [scene("cours", "alice"), scene("reprendre", "bilal"), scene("cours", "alice"), scene()]));
    const parEleve = feuilles(p, [alice, bilal], toutes(p), { par: "eleve", eleve: null });
    expect(parEleve.map((f) => [f.eleve?.prenom, f.chapitres[0].scenes.length])).toEqual([["Alice", 2], ["Bilal", 1]]);
    expect(surAucuneFeuille(p, toutes(p), { par: "eleve", eleve: null })).toHaveLength(1);
    const parChapitre = feuilles(p, [alice, bilal], toutes(p), { par: "chapitre", eleve: null });
    expect(parChapitre.map((f) => [f.eleve, f.chapitres[0].scenes.length])).toEqual([[null, 4]]);
    expect(surAucuneFeuille(p, toutes(p), { par: "chapitre", eleve: null })).toEqual([]);
  });

  it("F07-AC56, AC55 — un élève choisi, sa seule feuille : « 2 scènes sur 1 feuille · Alice » ; tous les élèves, quatre scènes sur trois feuilles, ou « en 3 parties à découper »", () => {
    const p = plan(chapitre("lisiere", [alice, bilal, jade], [scene("cours", "alice"), scene("cours", "alice"), scene("cours", "bilal"), scene("cours", "jade")]));
    const seule = feuilles(p, [alice, bilal, jade], toutes(p), { par: "eleve", eleve: "alice" });
    expect(decompte(seule, false, alice)).toBe("2 scènes sur 1 feuille · Alice");
    const trois = feuilles(p, [alice, bilal, jade], toutes(p), { par: "eleve", eleve: null });
    expect(decompte(trois, false, null)).toBe("4 scènes sur 3 feuilles");
    expect(decompte(trois, true, null)).toBe("4 scènes en 3 parties à découper");
    expect(decompte([], false, null)).toBe("Aucune feuille");
  });

  it("F07-AC22 — lot vérifié avant impression : une scène retirée de la sélection n'est sur aucune feuille", () => {
    const p = plan(chapitre("lisiere", [alice], libres(2)), chapitre("sanctuaire", [bilal], libres(1)));
    const choisies = toutes(p);
    choisies.delete(p.parties[0].chapitres[0].scenes[1].id);
    expect(feuilles(p, [alice, bilal], choisies, { par: "chapitre", eleve: null }).map((f) => f.chapitres[0].scenes.length)).toEqual([1, 1]);
  });

  it("F07-AC72 — élève de deux chapitres : en « par élève », Alice a une seule feuille, ses scènes rangées par chapitre", () => {
    const p = plan(chapitre("lisiere", [alice], [scene("cours", "alice")]), chapitre("sanctuaire", [alice, jade], [scene("cours", "alice"), scene("cours", "jade")]));
    const lesFeuilles = feuilles(p, [alice, jade], toutes(p), { par: "eleve", eleve: null });
    expect(lesFeuilles.map((f) => [f.eleve?.prenom, f.chapitres.map((c) => c.chapitre.id)])).toEqual([["Alice", ["lisiere", "sanctuaire"]], ["Jade", ["sanctuaire"]]]);
  });
});

describe("Partage des scènes sans élève (F07.4)", () => {
  const [chloe, dylan, emma] = [eleve("Chloé"), eleve("Dylan"), eleve("Emma")];
  const [marie, mohamed] = [eleve("Marie"), eleve("Mohamed")];

  it("F07-AC57 — S006, sans élève, est proposée à Emma, qui a une scène à son nom quand Chloé et Dylan en ont deux", () => {
    const p = plan(chapitre("bac", [chloe, dylan, emma], [scene("cours", "chloé"), scene("cours", "chloé"), scene("cours", "dylan"), scene("cours", "dylan"), scene("cours", "emma"), scene()]));
    const { propositions, sansEleve } = repartir(p, [chloe, dylan, emma], toutes(p));
    expect([...propositions.values()]).toEqual(["emma"]);
    expect(sansEleve).toEqual([]);
  });

  it("F07-AC58 — partage équitable : Marie en a cinq, Mohamed une, il en reste six : une pour Marie, cinq pour Mohamed ; avec huit pour Marie, les trois vont à Mohamed et rien n'est retiré à Marie", () => {
    const six = plan(chapitre("lisiere", [marie, mohamed], [...Array.from({ length: 5 }, () => scene("cours", "marie")), scene("cours", "mohamed"), ...libres(6)]));
    const recu = parts(six, repartir(six, [marie, mohamed], toutes(six)).propositions);
    expect([recu.marie.length, recu.mohamed.length]).toEqual([1, 5]);
    const trois = plan(chapitre("lisiere", [marie, mohamed], [...Array.from({ length: 8 }, () => scene("cours", "marie")), scene("cours", "mohamed"), ...libres(3)]));
    const partage = repartir(trois, [marie, mohamed], toutes(trois));
    expect([...partage.propositions.values()]).toEqual(["mohamed", "mohamed", "mohamed"]);
  });

  it("F07-AC71 — scène de trop : à nombre égal, Dylan et Emma, à qui il reste une scène à écrire, passent avant Chloé, et Dylan, qui en a une validée, avant Emma ; les deux scènes de Dylan se suivent ; la page rouverte propose le même partage", () => {
    const p = plan(chapitre("lisiere", [chloe, dylan, emma], [
      scene("cours", "chloé"), scene("cours", "chloé"), scene("cours", "dylan"), scene("valide", "dylan"), scene("cours", "emma"), scene("valider", "emma"), ...libres(4),
    ]));
    const partage = repartir(p, [chloe, dylan, emma], toutes(p));
    expect(parts(p, partage.propositions)).toEqual({ dylan: [6, 7], emma: [8], "chloé": [9] });
    expect([...repartir(p, [emma, chloe, dylan], toutes(p)).propositions]).toEqual([...partage.propositions]);
  });

  it("F07-AC72 — élève de deux chapitres : Alice, qui s'occupe de trois scènes de « La lisière », ne reçoit rien au « Sanctuaire » ; les trois vont à Jade", () => {
    const [alice, jade] = [eleve("Alice"), eleve("Jade")];
    const p = plan(chapitre("lisiere", [alice], [scene("cours", "alice"), scene("cours", "alice"), scene("cours", "alice")]), chapitre("sanctuaire", [alice, jade], libres(3)));
    expect([...repartir(p, [alice, jade], toutes(p)).propositions.values()]).toEqual(["jade", "jade", "jade"]);
  });

  it("F07-AC60 — hors partage : une scène sans consigne n'est pas partagée, et celle d'un chapitre non attribué reste sur aucune feuille", () => {
    const p = plan(chapitre("lisiere", [chloe, dylan, emma], [scene(), scene("cours", null, { consigne: "" })]), chapitre("sommet", [], libres(1)));
    const { propositions, sansEleve } = repartir(p, [chloe, dylan, emma], toutes(p));
    expect([...propositions.keys()]).toEqual([p.parties[0].chapitres[0].scenes[0].id]);
    expect(sansEleve).toEqual([p.parties[0].chapitres[1].scenes[0].id]);
  });

  it("F07-AC74 — plafond : au plus 4 scènes à écrire par élève ; Mohamed, à qui il n'en reste aucune, en reçoit quatre, Marie, à qui il en reste une, trois, les sept premières du chapitre ; trois restent sans élève ; sans nombre, les dix sont réparties", () => {
    const p = plan(chapitre("lisiere", [marie, mohamed], [scene("cours", "marie"), scene("valide", "mohamed"), ...libres(10)]));
    const partage = repartir(p, [marie, mohamed], toutes(p), 4);
    const recu = parts(p, partage.propositions);
    expect([recu.mohamed.length, recu.marie.length]).toEqual([4, 3]);
    expect([...recu.mohamed, ...recu.marie].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(partage.sansEleve).toHaveLength(3);
    expect(repartir(p, [marie, mohamed], toutes(p)).propositions.size).toBe(10);
  });

  it("F07-AC75 — compléter un élève : avec « Au plus 4 », Emma, à qui il en reste deux, est signalée, pas Dylan, à qui il en reste quatre ; complétée, elle reçoit les deux premières scènes libres du chapitre, et rien n'est proposé sans ce geste", () => {
    const p = plan(chapitre("lisiere", [dylan, emma], [
      scene("cours", "emma"), scene("cours", "emma"), ...Array.from({ length: 4 }, () => scene("cours", "dylan")), ...libres(5),
    ]));
    expect(elevesACompleter(p, [dylan, emma], toutes(p), 4).map((x) => [x.eleve.prenom, x.reste])).toEqual([["Emma", 2]]);
    expect(elevesACompleter(p, [dylan, emma], toutes(p), null)).toEqual([]);
    expect(completer(p, [dylan, emma], toutes(p), 4, []).propositions.size).toBe(0);
    const partage = completer(p, [dylan, emma], toutes(p), 4, ["emma"]);
    expect(parts(p, partage.propositions)).toEqual({ emma: [6, 7] });
    expect(partage.sansEleve).toHaveLength(3);
    const sa = feuilles(p, [dylan, emma], toutes(p), { par: "eleve", eleve: null, propositions: partage.propositions }).find((f) => f.eleve?.id === "emma");
    expect(sa?.chapitres[0].scenes).toHaveLength(4);
  });

  it("F07.4 — de deux élèves complétés l'un après l'autre, le premier reçoit les premières scènes libres", () => {
    const [emma2, jade] = [eleve("Emma"), eleve("Jade")];
    const p = plan(chapitre("lisiere", [emma2, jade], libres(4)));
    expect(parts(p, completer(p, [emma2, jade], toutes(p), 2, ["jade", "emma"]).propositions)).toEqual({ jade: [0, 1], emma: [2, 3] });
  });
});

describe("Réglages gardés (F07.4)", () => {
  it("F07.4 — sans rien de gardé, ou abîmé : par élève, une par page, au plus 4 ; « aucun nombre » est gardé comme tel", () => {
    expect(lireReglages({})).toEqual({ par: "eleve", suite: false, plafond: 4 });
    expect(lireReglages(null)).toEqual(REGLAGES_HABITUELS);
    expect(lireReglages({ par: "chapitre", suite: true, plafond: 6 })).toEqual({ par: "chapitre", suite: true, plafond: 6 });
    expect(lireReglages({ plafond: null })).toEqual({ par: "eleve", suite: false, plafond: null });
    expect(lireReglages({ par: "page", suite: "oui", plafond: 0 })).toEqual(REGLAGES_HABITUELS);
    expect(lireReglages({ plafond: 2.5 })).toEqual(REGLAGES_HABITUELS);
  });
});
