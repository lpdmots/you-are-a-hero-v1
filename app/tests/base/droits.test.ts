import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  creerClasse, creerEnseignant, identifier, inconnu, inscrire, lire, nettoyer, ouvrirPoste,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai,
} from "./outils";

/**
 * Les droits sont tenus par la base elle-même. Deux enseignantes, chacune sa classe,
 * ses élèves et son projet ; un poste ouvert dans chaque classe.
 */
let laurent: Adulte, dupont: Adulte;
let classeA: ClasseEssai, classeB: ClasseEssai;
let elevesA: EleveEssai[], elevesB: EleveEssai[];
let posteA: PosteEssai, posteB: PosteEssai;
let projetA: string, projetB: string;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  dupont = await creerEnseignant("M. Dupont");
  classeA = await creerClasse(laurent, "CM1-CM2");
  classeB = await creerClasse(dupont, "CE2");
  elevesA = await inscrire(laurent, classeA.id, ["Alice Martin", "Bilal Haddad", "Chloé"]);
  elevesB = await inscrire(dupont, classeB.id, ["Zoé Henry", "Tom"]);
  const cree = async (a: Adulte, classe: string, titre: string) => {
    const { data, error } = await a.base
      .from("projets")
      .insert({ enseignant_id: a.id, organisation: "classe", recit: "choix", titre, classe_id: classe })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return data.id as string;
  };
  projetA = await cree(laurent, classeA.id, "Les passeurs de brume");
  projetB = await cree(dupont, classeB.id, "La cabane du bout du monde");
  posteA = (await ouvrirPoste(classeA.id))!;
  posteB = (await ouvrirPoste(classeB.id))!;
  await identifier(posteA, elevesA[0].inscriptionId);
});

afterAll(nettoyer);

describe("Un élève ne lit rien d'une autre classe", () => {
  it("le poste d'Alice ne lit que sa classe, ses camarades et son enseignante", async () => {
    const base = await posteA.base();
    const classes = await lire(base, "classes", "id, nom");
    expect(classes.lignes.map((c) => c.id)).toEqual([classeA.id]);

    const eleves = await lire(base, "eleves", "id, prenom");
    expect(eleves.lignes.map((e) => e.id).sort()).toEqual(elevesA.map((e) => e.id).sort());
    expect(eleves.lignes.some((e) => elevesB.some((b) => b.id === e.id))).toBe(false);

    const inscriptions = await lire(base, "inscriptions", "id, classe_id");
    expect(inscriptions.lignes).toHaveLength(3);
    expect(inscriptions.lignes.every((i) => i.classe_id === classeA.id)).toBe(true);

    const enseignants = await lire(base, "enseignants", "id, nom_affiche");
    expect(enseignants.lignes).toEqual([{ id: laurent.id, nom_affiche: "Mme Laurent" }]);

    const postes = await lire(base, "postes", "id, classe_id");
    expect(postes.lignes).toEqual([{ id: posteA.id, classe_id: classeA.id }]);
  });

  it("il lit une inscription avec son élève, comme le demande le choix des profils", async () => {
    const base = await posteA.base();
    const { data, error } = await base.from("inscriptions").select("id, eleves(id, prenom, nom, couleur)").eq("classe_id", classeA.id);
    expect(error).toBeNull();
    expect((data as unknown as { eleves: { prenom: string } }[]).map((i) => i.eleves.prenom).sort()).toEqual(["Alice", "Bilal", "Chloé"]);
    const ailleurs = await base.from("inscriptions").select("id, eleves(id, prenom)").eq("classe_id", classeB.id);
    expect(ailleurs.data).toEqual([]);
  });

  it("même en demandant la classe de l'autre par son identifiant, il ne reçoit rien", async () => {
    const base = await posteA.base();
    expect((await base.from("classes").select("id, nom").eq("id", classeB.id)).data).toEqual([]);
    expect((await base.from("eleves").select("id, prenom").in("id", elevesB.map((e) => e.id))).data).toEqual([]);
    expect((await base.from("inscriptions").select("id").eq("classe_id", classeB.id)).data).toEqual([]);
    expect((await base.from("enseignants").select("id, nom_affiche").eq("id", dupont.id)).data).toEqual([]);
    expect((await base.from("postes").select("id").eq("id", posteB.id)).data).toEqual([]);
    expect((await base.from("horaires").select("id").eq("classe_id", classeB.id)).data).toEqual([]);
  });

  it("F06-AC25 — il ne lit ni les codes, ni le mot de passe de la classe, ni les projets", async () => {
    const base = await posteA.base();
    for (const table of ["eleves_secrets", "classes_secrets", "projets", "essais_entree"]) {
      const lu = await lire(base, table);
      expect(lu.lignes, table).toEqual([]);
      expect(lu.refus, table).toMatch(/42501/);
    }
    // Les colonnes qui ne le regardent pas lui sont refusées aussi
    expect((await lire(base, "classes", "identifiant")).refus).toMatch(/42501/);
    expect((await lire(base, "classes", "version_acces")).refus).toMatch(/42501/);
    expect((await lire(base, "postes", "jeton_hash")).refus).toMatch(/42501/);
    expect((await lire(base, "enseignants", "dernier_projet_id")).refus).toMatch(/42501/);
  });

  it("F01-AC01 — il n'écrit nulle part et n'appelle aucune commande de l'adulte ou du serveur", async () => {
    const base = await posteA.base();
    expect((await base.from("eleves").update({ prenom: "Autre" }).eq("id", elevesA[0].id)).error?.code).toBe("42501");
    expect((await base.from("inscriptions").insert({ classe_id: classeA.id, eleve_id: elevesA[0].id, enseignant_id: laurent.id })).error?.code).toBe("42501");
    expect((await base.from("postes").update({ inscription_id: elevesA[1].inscriptionId }).eq("id", posteA.id)).error?.code).toBe("42501");
    expect((await base.from("classes").delete().eq("id", classeA.id)).error?.code).toBe("42501");
    for (const [commande, arguments_] of [
      ["identifier_eleve", { p_poste: posteA.id, p_inscription: elevesA[1].inscriptionId }],
      ["etat_poste", { p_jeton_hash: posteB.jetonHash }],
      ["ouvrir_poste", { p_classe: classeB.id, p_jeton_hash: "x" }],
      ["noter_code_faux", { p_eleve: elevesA[1].id }],
      ["creer_classe", { p_id: classeA.id, p_nom: "x", p_annee_debut: 2026, p_identifiant: "xxxx", p_mot_de_passe_chiffre: "x" }],
      ["inscrire_eleves", { p_classe: classeA.id, p_connus: [], p_nouveaux: [] }],
    ] as const) {
      expect((await base.rpc(commande, arguments_)).error?.code, commande).toBe("42501");
    }
  });

  it("le poste de l'autre classe voit sa classe, et rien de celle d'Alice", async () => {
    const base = await posteB.base();
    expect((await lire(base, "classes", "id")).lignes).toEqual([{ id: classeB.id }]);
    expect((await lire(base, "eleves", "id")).lignes.map((e) => e.id).sort()).toEqual(elevesB.map((e) => e.id).sort());
  });
});

describe("Quelqu'un sans compte ni poste", () => {
  it("F01-AC28 — ne lit aucune table et n'appelle aucune commande", async () => {
    const base = inconnu();
    for (const table of ["enseignants", "classes", "classes_secrets", "horaires", "eleves", "eleves_secrets", "inscriptions", "projets", "postes", "essais_entree"]) {
      const lu = await lire(base, table);
      expect(lu.lignes, table).toEqual([]);
      expect(lu.refus, table).not.toBeNull();
    }
    expect((await base.rpc("etat_poste", { p_jeton_hash: posteA.jetonHash })).error).not.toBeNull();
    expect((await base.rpc("travail_ouvert")).error).not.toBeNull();
  });

  it("F01-AC28 — ne peut pas se créer de compte", async () => {
    const { data, error } = await inconnu().auth.signUp({ email: "quelquun@exemple.test", password: "un-mot-de-passe-long" });
    expect(error).not.toBeNull();
    expect(data.user).toBeNull();
  });
});

describe("Un enseignant ne lit ni ne change rien d'un autre enseignant", () => {
  it("F01-AC01 — M. Dupont ne lit que ses propres lignes", async () => {
    for (const table of ["classes", "classes_secrets", "eleves", "eleves_secrets", "inscriptions", "projets", "horaires"]) {
      const lu = await lire(dupont.base, table);
      expect(lu.refus, table).toBeNull();
      expect(lu.lignes.every((l) => l.enseignant_id === dupont.id), table).toBe(true);
    }
    expect((await lire(dupont.base, "enseignants", "id")).lignes).toEqual([{ id: dupont.id }]);
    expect((await dupont.base.from("classes").select("id").eq("id", classeA.id)).data).toEqual([]);
    expect((await dupont.base.from("eleves_secrets").select("eleve_id").eq("eleve_id", elevesA[0].id)).data).toEqual([]);
    expect((await dupont.base.from("projets").select("id").eq("id", projetA)).data).toEqual([]);
    // Les postes et les essais d'entrée ne regardent que le serveur
    expect((await lire(dupont.base, "postes")).refus).toMatch(/42501/);
    expect((await lire(dupont.base, "essais_entree")).refus).toMatch(/42501/);
  });

  it("il ne modifie ni la classe, ni les élèves, ni les codes, ni le projet de Mme Laurent", async () => {
    const rien = async (requete: PromiseLike<{ data: unknown[] | null }>) => expect((await requete).data ?? []).toEqual([]);
    await rien(dupont.base.from("classes").update({ nom: "À moi" }).eq("id", classeA.id).select("id"));
    await rien(dupont.base.from("classes").delete().eq("id", classeA.id).select("id"));
    await rien(dupont.base.from("eleves").update({ prenom: "Autre" }).eq("id", elevesA[0].id).select("id"));
    await rien(dupont.base.from("eleves_secrets").update({ code_chiffre: "x" }).eq("eleve_id", elevesA[0].id).select("eleve_id"));
    await rien(dupont.base.from("classes_secrets").update({ mot_de_passe_chiffre: "x" }).eq("classe_id", classeA.id).select("classe_id"));
    await rien(dupont.base.from("inscriptions").update({ retire_le: new Date().toISOString() }).eq("classe_id", classeA.id).select("id"));
    await rien(dupont.base.from("projets").update({ titre: "À moi" }).eq("id", projetA).select("id"));
    expect((await laurent.base.from("classes").select("nom").eq("id", classeA.id).single()).data?.nom).toBe("CM1-CM2");
  });

  it("il n'inscrit personne dans la classe d'un autre et n'y rattache pas son projet", async () => {
    expect((await dupont.base.rpc("inscrire_eleves", { p_classe: classeA.id, p_connus: [elevesB[0].id], p_nouveaux: [] })).error).not.toBeNull();
    expect((await dupont.base.from("inscriptions").insert({ classe_id: classeA.id, eleve_id: elevesB[0].id, enseignant_id: dupont.id })).error).not.toBeNull();
    expect((await dupont.base.from("inscriptions").insert({ classe_id: classeA.id, eleve_id: elevesA[0].id, enseignant_id: laurent.id })).error).not.toBeNull();
    expect((await dupont.base.from("projets").update({ classe_id: classeA.id }).eq("id", projetB)).error).not.toBeNull();
    expect((await dupont.base.from("projets").insert({ enseignant_id: laurent.id, organisation: "personnel", recit: "choix", titre: "Intrus" })).error).not.toBeNull();
    expect((await dupont.base.rpc("regler_horaires", { p_classe: classeA.id, p_limites: false, p_plages: [] })).error).not.toBeNull();
  });

  it("il ne change pas d'identité, et n'appelle pas les commandes du serveur", async () => {
    expect((await dupont.base.from("enseignants").update({ id: laurent.id }).eq("id", dupont.id)).error?.code).toBe("42501");
    expect((await dupont.base.from("enseignants").update({ nom_affiche: "Intrus" }).eq("id", laurent.id).select("id")).data).toEqual([]);
    expect((await dupont.base.rpc("etat_poste", { p_jeton_hash: posteA.jetonHash })).error?.code).toBe("42501");
    expect((await dupont.base.rpc("identifier_eleve", { p_poste: posteA.id, p_inscription: elevesA[1].inscriptionId })).error?.code).toBe("42501");
    expect((await dupont.base.rpc("ouvrir_poste", { p_classe: classeA.id, p_jeton_hash: "x" })).error?.code).toBe("42501");
  });
});
