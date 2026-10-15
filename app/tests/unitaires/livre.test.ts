import { describe, expect, it } from "vitest";
import { controler, type Probleme } from "@/domaine/controles";
import type { Etat } from "@/domaine/etats";
import { avertissementsAcceptes, empreinteDe, etatChemins, etatRelire, type Acceptation, type Changement } from "@/domaine/livre";
import type { Chapitre, Lien, Plan, Scene } from "@/domaine/recit";

/**
 * Étape 5 du plan, lot 2 : la destination Livre — marques des étapes, tâches de « Vérifier
 * les chemins », déclaration et avertissements acceptés (F11.6), sans base ni navigateur.
 */

type Decrite = { ref: number; etat?: Etat; vide?: boolean; fin?: boolean; choix?: (number | null)[] };
const id = (ref: number) => `00000000-0000-4000-8000-${String(ref).padStart(12, "0")}`;

function controle(scenes: Decrite[]): Probleme[] {
  const chapitre: Chapitre = {
    id: "lisiere", partieId: "partie", titre: "La lisière", couleur: 0, resume: "", horsLivre: false, imageId: null, visuelChoisi: null, visuelDefaut: null, attributions: [],
    scenes: scenes.map((s): Scene => ({
      id: id(s.ref), chapitreId: "lisiere", reference: s.ref, titre: `Scène ${s.ref}`, consigne: "", fin: s.fin ?? false, horsLivre: false, creeParEleve: null,
      priseParEleve: null, priseParEnseignant: false, ancien: null, etat: s.etat ?? "prete", texteVide: s.vide ?? false, ecritPar: [], rangLivre: null, numeroFixe: null,
    })),
  };
  const liens: Lien[] = scenes.flatMap((s) => (s.choix ?? []).map((c, k) => ({ sceneId: id(s.ref), renvoiId: `${s.ref}>${k}`, cibleId: c === null ? null : id(c), libelle: `Choix ${k + 1}`, cache: false })));
  const plan: Plan = {
    parties: [{ id: "partie", titre: "La forêt", imageId: null, visuelChoisi: null, visuelDefaut: null, groupeAvecPrecedente: false, ouvertureSceneId: null, chapitres: [chapitre] }],
    corbeille: [], departSceneId: id(1), liens,
  };
  return controler({ plan, aChoix: true, scenesAvecActions: new Set(), feuille: true });
}

const accepter = (p: Probleme, le = "2026-10-14T10:00:00Z"): Acceptation => ({ cle: p.cle, empreinte: empreinteDe(p), accepteLe: le });

describe("Vérifier les chemins (F11.6)", () => {
  it("F11-AC73 — coche : destination désignée, puis « C'est voulu », puis la déclaration", () => {
    // Un choix sans destination et un passage inaccessible
    const avant = controle([{ ref: 1, choix: [2, null] }, { ref: 2, fin: true }, { ref: 43, fin: true }]);
    let etat = etatChemins(avant, new Set(), false);
    expect(etat.marque).toBe("reste");
    expect(etat.taches.map((t) => [t.nom, t.points.length])).toEqual([["Départ et fins", 0], ["Choix à relier", 1], ["Passages à confirmer", 1], ["Tester la lecture", 0]]);

    // La destination est désignée : l'étape garde sa marque, « Passages à confirmer » indique un point
    const apres = controle([{ ref: 1, choix: [2, 2] }, { ref: 2, fin: true }, { ref: 43, fin: true }]);
    etat = etatChemins(apres, new Set(), false);
    expect(etat.marque).toBe("reste");
    expect(etat.taches[2].points).toHaveLength(1);
    expect(etat.declarable).toBe(false);

    // « C'est voulu » : plus de marque, la déclaration devient possible
    const acceptes = avertissementsAcceptes(apres, [accepter(apres[0])], []);
    etat = etatChemins(apres, acceptes, false);
    expect(etat.marque).toBeNull();
    expect(etat.declarable).toBe(true);
    expect(etat.taches[2]).toMatchObject({ points: [], faite: true });
    expect(etat.taches[2].acceptes).toHaveLength(1);

    // Déclarée : l'étape porte une coche
    etat = etatChemins(apres, acceptes, true);
    expect(etat.marque).toBe("coche");
    expect(etat.taches[3].faite).toBe(true);
  });

  it("F11-AC75 — acceptation durable : une coquille ne la rouvre pas ; un choix qui y mène puis qui est supprimé, si", () => {
    const p = controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true }, { ref: 43, fin: true }]);
    const acceptation = accepter(p[0]);
    // Une coquille corrigée dans S043 : ses chemins n'ont pas changé, rien n'est noté
    expect(avertissementsAcceptes(p, [acceptation], [])).toEqual(new Set([p[0].cle]));
    // Un choix est venu y mener, puis a été supprimé : la base a noté deux changements de ses entrées
    const changements: Changement[] = [
      { sceneId: id(43), sens: "entree", le: "2026-10-14T11:00:00Z" },
      { sceneId: id(43), sens: "entree", le: "2026-10-14T11:05:00Z" },
    ];
    expect(avertissementsAcceptes(p, [acceptation], changements)).toEqual(new Set());
    // Un changement d'avant l'acceptation, ou des chemins qui partent de la scène, n'y font rien
    expect(avertissementsAcceptes(p, [acceptation], [{ sceneId: id(43), sens: "entree", le: "2026-10-14T09:00:00Z" }, { sceneId: id(43), sens: "sortie", le: "2026-10-14T12:00:00Z" }]).size).toBe(1);
  });

  it("F09-AC24 — un seul « C'est voulu » pour un groupe ; un groupe qui change n'est plus celui qu'on a jugé", () => {
    const avant = controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true }, { ref: 25, choix: [64] }, { ref: 64, fin: true }]);
    const acceptation = accepter(avant[0]);
    expect(etatChemins(avant, avertissementsAcceptes(avant, [acceptation], []), false).confirmer).toBe(0);
    // Une scène de plus n'est atteinte qu'à travers S025 : le groupe a changé
    const apres = controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true }, { ref: 25, choix: [64, 65] }, { ref: 64, fin: true }, { ref: 65, fin: true }]);
    expect(avertissementsAcceptes(apres, [acceptation], []).size).toBe(0);
  });

  it("F11-AC89 — septembre : scènes à finir, deux passages où rien ne mène ; sablier, pas de triangle, les deux passages listés", () => {
    const p = controle([{ ref: 1, choix: [2], etat: "cours" }, { ref: 2, etat: "cours", vide: true }, { ref: 40, fin: true }, { ref: 41, fin: true }]);
    const etat = etatChemins(p, new Set(), false);
    expect(etat.marque).toBe("attente");
    expect(etat.taches[2].points).toHaveLength(2);
    expect(etatRelire(p).marque).toBe("attente");
    // Les tâches vides disent « Rien pour l'instant », sans coche
    expect(etat.taches[0]).toMatchObject({ attente: true, faite: false });
  });

  it("F11.6 — la déclaration attend que toutes les scènes soient prêtes, et elle est gardée quand une scène est rouverte", () => {
    const rouverte = controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true, etat: "cours" }]);
    const etat = etatChemins(rouverte, new Set(), true);
    expect(etat.declarable).toBe(false);
    expect(etat.marque).toBe("attente");
    expect(etat.declaree).toBe(true);
    // La scène de nouveau prête : la coche revient, sans nouvelle déclaration
    expect(etatChemins(controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true }]), new Set(), true).marque).toBe("coche");
  });

  it("F11.6 — un point à corriger porte le triangle même s'il reste des scènes à finir ; un problème bloquant ne s'accepte pas", () => {
    const p = controle([{ ref: 1, choix: [2], etat: "cours" }, { ref: 2 }]);
    expect(etatChemins(p, new Set(), false).marque).toBe("reste");
    const impasse = p.find((x) => x.sorte === "impasse")!;
    expect(avertissementsAcceptes(p, [{ cle: impasse.cle, empreinte: "", accepteLe: "2026-10-14T10:00:00Z" }], []).size).toBe(0);
    // « Relire » : une scène prête mais vide est une erreur grave
    expect(etatRelire(controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true, vide: true }])).marque).toBe("reste");
  });
});

describe("« Relire » (F11.6, étape 6 du plan, lot 2)", () => {
  it("F11-AC88 — tout prêt, sans erreur grave : l'étape garde son numéro et propose « J'ai relu le livre » ; déclarée, elle porte une coche ; quatre scènes à finir, la déclaration attend", () => {
    const pret = controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true }]);
    const avant = etatRelire(pret, new Set(), false);
    expect(avant).toMatchObject({ declarable: true, terminee: false, marque: null });
    expect(etatRelire(pret, new Set(), true)).toMatchObject({ terminee: true, marque: "coche" });
    const quatre = controle([{ ref: 1, choix: [2] }, { ref: 2, choix: [3], etat: "cours" }, { ref: 3, choix: [4], etat: "valide" }, { ref: 4, choix: [5], etat: "cours" }, { ref: 5, fin: true, etat: "cours" }]);
    const attente = etatRelire(quatre, new Set(), false);
    expect(attente.finir).toBe(4);
    expect(attente.declarable).toBe(false);
    expect(attente.marque).toBe("attente");
  });

  it("F11-AC90 — sans erreur grave, toutes les scènes prêtes : « Erreurs graves » reste affichée, cochée, et « Lire et corriger » garde son rang", () => {
    const etat = etatRelire(controle([{ ref: 1, choix: [2] }, { ref: 2, fin: true }]), new Set(), false);
    expect(etat.taches.map((t) => t.id)).toEqual(["ecrire", "graves", "confirmer", "lire"]);
    expect(etat.taches[1]).toMatchObject({ nom: "Erreurs graves", points: [], faite: true });
    expect(etat.taches[3]).toMatchObject({ nom: "Lire et corriger", faite: false });
  });

  it("F11-AC91 — « J'ai relu le livre » déclaré, S028 rouverte puis de nouveau prête : la coche revient sans nouvelle déclaration", () => {
    const rouverte = etatRelire(controle([{ ref: 1, choix: [28] }, { ref: 28, fin: true, etat: "reprendre" }]), new Set(), true);
    expect(rouverte).toMatchObject({ declaree: true, terminee: false, marque: "attente" });
    expect(rouverte.taches[0].faite).toBe(false);
    expect(etatRelire(controle([{ ref: 1, choix: [28] }, { ref: 28, fin: true }]), new Set(), true).marque).toBe("coche");
  });

  it("F11-AC89 — septembre : les tâches vides de « Relire » disent « Rien pour l'instant », sans coche", () => {
    const etat = etatRelire(controle([{ ref: 1, choix: [2], etat: "cours" }, { ref: 2, fin: true, etat: "cours" }]), new Set(), false);
    expect(etat.taches[1]).toMatchObject({ attente: true, faite: false });
    expect(etat.taches[2]).toMatchObject({ attente: true, faite: false });
  });
});
