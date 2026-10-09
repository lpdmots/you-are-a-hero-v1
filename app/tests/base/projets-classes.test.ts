import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { chiffrer, dechiffrer } from "@/serveur/chiffrement";
import { creerClasse, creerEnseignant, etat, identifier, inscrire, nettoyer, ouvrirPoste, type Adulte } from "./outils";

let laurent: Adulte;
beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
});
afterAll(nettoyer);

const creerProjet = async (a: Adulte, organisation: string, recit: string, titre: string, classe: string | null = null) =>
  a.base.from("projets").insert({ enseignant_id: a.id, organisation, recit, titre, classe_id: classe }).select("id, organisation, recit, classe_id, dernier_onglet").single();

describe("Projets (F01)", () => {
  it("F01-AC02 — les quatre combinaisons se créent", async () => {
    const classe = await creerClasse(laurent);
    for (const [organisation, recit] of [["personnel", "classique"], ["personnel", "choix"], ["classe", "classique"], ["classe", "choix"]]) {
      const { data, error } = await creerProjet(laurent, organisation, recit, `Projet ${organisation} ${recit}`, organisation === "classe" ? classe.id : null);
      expect(error, `${organisation}/${recit}`).toBeNull();
      expect(data).toMatchObject({ organisation, recit, dernier_onglet: "preparation" });
    }
  });

  it("F01-AC14 — un projet de classe se crée sans classe ; F01-AC16 — un projet personnel n'en a jamais", async () => {
    const classe = await creerClasse(laurent);
    expect((await creerProjet(laurent, "classe", "choix", "Les passeurs de brume")).data?.classe_id).toBeNull();
    expect((await creerProjet(laurent, "personnel", "choix", "Mon histoire", classe.id)).error).not.toBeNull();
    expect((await creerProjet(laurent, "classe", "choix", "   ")).error).not.toBeNull();
  });

  it("F01-AC04 — l'organisation et le type de récit ne se changent pas ; le titre, si", async () => {
    const { data: projet } = await creerProjet(laurent, "classe", "choix", "Titre provisoire");
    expect((await laurent.base.from("projets").update({ organisation: "personnel" }).eq("id", projet!.id)).error?.message).toMatch(/ne se changent pas/);
    expect((await laurent.base.from("projets").update({ recit: "classique" }).eq("id", projet!.id)).error?.message).toMatch(/ne se changent pas/);
    expect((await laurent.base.from("projets").update({ titre: "Les passeurs de brume" }).eq("id", projet!.id)).error).toBeNull();
    const { data } = await laurent.base.from("projets").select("organisation, recit, titre").eq("id", projet!.id).single();
    expect(data).toEqual({ organisation: "classe", recit: "choix", titre: "Les passeurs de brume" });
  });

  it("F01-AC08 — la classe se choisit après la préparation ; F01-AC24 — elle se change pour une autre classe en cours", async () => {
    const cm = await creerClasse(laurent, "CM1-CM2");
    const ce = await creerClasse(laurent, "CE2");
    const { data: projet } = await creerProjet(laurent, "classe", "choix", "Préparé cet été");
    expect((await laurent.base.from("projets").update({ classe_id: cm.id }).eq("id", projet!.id)).error).toBeNull();
    expect((await laurent.base.from("projets").update({ classe_id: ce.id }).eq("id", projet!.id)).error).toBeNull();
    expect((await laurent.base.from("projets").select("classe_id, titre").eq("id", projet!.id).single()).data).toEqual({ classe_id: ce.id, titre: "Préparé cet été" });
  });

  it("F01.1 — une classe dont l'année est terminée ne reçoit pas de projet", async () => {
    const passee = await creerClasse(laurent, "CM1-CM2", 2025);
    await laurent.base.from("classes").update({ terminee_le: new Date().toISOString() }).eq("id", passee.id);
    expect((await creerProjet(laurent, "classe", "choix", "Trop tard", passee.id)).error?.message).toMatch(/terminée/);
    const { data: projet } = await creerProjet(laurent, "classe", "choix", "Sans classe");
    expect((await laurent.base.from("projets").update({ classe_id: passee.id }).eq("id", projet!.id)).error?.message).toMatch(/terminée/);
  });

  it("F06-AC53 — le dernier projet ouvert et son dernier onglet sont tenus par le compte", async () => {
    const { data: projet } = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume");
    await laurent.base.from("projets").update({ dernier_onglet: "suivi" }).eq("id", projet!.id);
    await laurent.base.from("enseignants").update({ dernier_projet_id: projet!.id }).eq("id", laurent.id);
    const { data } = await laurent.base.from("enseignants").select("dernier_projet_id, projets!enseignants_dernier_projet_fk(dernier_onglet)").eq("id", laurent.id).single();
    expect(data?.dernier_projet_id).toBe(projet!.id);
    expect(JSON.stringify(data?.projets)).toContain("suivi");
    expect((await laurent.base.from("projets").update({ dernier_onglet: "ailleurs" }).eq("id", projet!.id)).error).not.toBeNull();
  });
});

describe("Classes, années et élèves (F01.1)", () => {
  it("F01-AC10 — 15 profils connus et 10 nouveaux : 25 inscriptions, 10 profils créés", async () => {
    const ancienne = await creerClasse(laurent, "CM1-CM2", 2025);
    const anciens = await inscrire(laurent, ancienne.id, Array.from({ length: 15 }, (_, i) => `Ancien${i} Nom${i}`));
    const avant = (await laurent.base.from("eleves").select("id", { count: "exact", head: true })).count ?? 0;

    const nouvelle = await creerClasse(laurent, "CM1-CM2", 2026);
    await inscrire(laurent, nouvelle.id, Array.from({ length: 10 }, (_, i) => `Nouveau${i}`), anciens.map((e) => e.id));

    expect((await laurent.base.from("inscriptions").select("id", { count: "exact", head: true }).eq("classe_id", nouvelle.id)).count).toBe(25);
    expect(((await laurent.base.from("eleves").select("id", { count: "exact", head: true })).count ?? 0) - avant).toBe(10);
  });

  it("F01-AC06 — réinscription sans doublon ; F06-AC23 — le code du profil ne change pas", async () => {
    const ancienne = await creerClasse(laurent, "CM1", 2025);
    const [alice] = await inscrire(laurent, ancienne.id, ["Alice Martin"]);
    const codeAvant = (await laurent.base.from("eleves_secrets").select("code_chiffre").eq("eleve_id", alice.id).single()).data!.code_chiffre;

    const nouvelle = await creerClasse(laurent, "CM2", 2026);
    await inscrire(laurent, nouvelle.id, [], [alice.id]);

    const { data: inscriptions } = await laurent.base.from("inscriptions").select("classe_id").eq("eleve_id", alice.id);
    expect(inscriptions?.map((i) => i.classe_id).sort()).toEqual([ancienne.id, nouvelle.id].sort());
    expect((await laurent.base.from("eleves").select("id").eq("prenom", "Alice").eq("nom", "Martin")).data).toHaveLength(1);
    const codeApres = (await laurent.base.from("eleves_secrets").select("code_chiffre").eq("eleve_id", alice.id).single()).data!.code_chiffre;
    expect(codeApres).toBe(codeAvant);
    expect(dechiffrer(codeApres, { sorte: "code", id: alice.id })).toBe(alice.code);
  });

  it("F01-AC05 — une nouvelle classe n'hérite ni des élèves ni des projets de l'ancienne", async () => {
    const ancienne = await creerClasse(laurent, "CM1-CM2", 2026);
    await inscrire(laurent, ancienne.id, ["Alice", "Bilal"]);
    await creerProjet(laurent, "classe", "choix", "Histoire 1", ancienne.id);
    await creerProjet(laurent, "classe", "classique", "Histoire 2", ancienne.id);
    const suivante = await creerClasse(laurent, "CM1-CM2", 2027);
    expect((await laurent.base.from("inscriptions").select("id").eq("classe_id", suivante.id)).data).toEqual([]);
    expect((await laurent.base.from("projets").select("id").eq("classe_id", suivante.id)).data).toEqual([]);
    expect((await laurent.base.from("projets").select("id").eq("classe_id", ancienne.id)).data).toHaveLength(2);
  });

  it("F01-AC07 — deux élèves de même nom restent deux profils", async () => {
    const classe = await creerClasse(laurent);
    const [a, b] = await inscrire(laurent, classe.id, ["Lucas Bernard", "Lucas Bernard"]);
    expect(a.id).not.toBe(b.id);
    expect((await laurent.base.from("inscriptions").select("eleve_id").eq("classe_id", classe.id)).data).toHaveLength(2);
  });

  it("F01-AC11 — un lot qui échoue ne crée rien", async () => {
    const classe = await creerClasse(laurent);
    const bon = randomUUID();
    const { error } = await laurent.base.rpc("inscrire_eleves", {
      p_classe: classe.id, p_connus: [],
      p_nouveaux: [
        { id: bon, prenom: "Noé", nom: null, couleur: 0, code_chiffre: chiffrer("4719", { sorte: "code", id: bon }) },
        { id: randomUUID(), prenom: "   ", nom: null, couleur: 1, code_chiffre: "x" },
      ],
    });
    expect(error).not.toBeNull();
    expect((await laurent.base.from("eleves").select("id").eq("id", bon)).data).toEqual([]);
    expect((await laurent.base.from("inscriptions").select("id").eq("classe_id", classe.id)).data).toEqual([]);
  });

  it("F01-AC18 — terminer l'année : la classe ne s'ouvre plus sur un poste, les projets restent", async () => {
    const classe = await creerClasse(laurent, "CM1-CM2", 2025);
    const eleves = await inscrire(laurent, classe.id, ["Alice", "Bilal"]);
    const { data: projet } = await creerProjet(laurent, "classe", "choix", "Le phare des sept vents", classe.id);
    const poste = (await ouvrirPoste(classe.id))!;
    await identifier(poste, eleves[0].inscriptionId);

    expect((await laurent.base.from("classes").update({ terminee_le: new Date().toISOString() }).eq("id", classe.id)).error).toBeNull();

    expect(await ouvrirPoste(classe.id)).toBeNull();
    expect(await etat(poste)).toBeNull();
    expect((await (await poste.base()).from("classes").select("id")).data).toEqual([]);
    expect((await laurent.base.from("projets").select("titre").eq("id", projet!.id).single()).data?.titre).toBe("Le phare des sept vents");
    expect((await laurent.base.from("inscriptions").select("id").eq("classe_id", classe.id)).data).toHaveLength(2);
  });

  it("F01-AC19 — rouvrir : mêmes informations de classe, mêmes codes ; les postes d'avant ne se rouvrent pas seuls", async () => {
    const classe = await creerClasse(laurent, "CM1-CM2", 2025);
    const [alice] = await inscrire(laurent, classe.id, ["Alice"]);
    const avant = (await ouvrirPoste(classe.id))!;
    const secrets = async () => ({
      classe: (await laurent.base.from("classes_secrets").select("mot_de_passe_chiffre").eq("classe_id", classe.id).single()).data,
      code: (await laurent.base.from("eleves_secrets").select("code_chiffre").eq("eleve_id", alice.id).single()).data,
      identifiant: (await laurent.base.from("classes").select("identifiant").eq("id", classe.id).single()).data,
    });
    const gardes = await secrets();

    await laurent.base.from("classes").update({ terminee_le: new Date().toISOString() }).eq("id", classe.id);
    expect((await laurent.base.from("classes").update({ terminee_le: null }).eq("id", classe.id)).error).toBeNull();

    expect(await secrets()).toEqual(gardes);
    expect(await etat(avant)).toBeNull();
    const apres = (await ouvrirPoste(classe.id))!;
    expect(await identifier(apres, alice.inscriptionId)).toBe(true);
  });

  it("F01-AC26 — année terminée : ni inscription, ni retrait, ni horaires, ni mot de passe", async () => {
    const classe = await creerClasse(laurent, "CM1-CM2", 2025);
    const [alice] = await inscrire(laurent, classe.id, ["Alice"]);
    await laurent.base.from("classes").update({ terminee_le: new Date().toISOString() }).eq("id", classe.id);

    expect((await laurent.base.rpc("inscrire_eleves", { p_classe: classe.id, p_connus: [], p_nouveaux: [] })).error?.message).toMatch(/terminée/);
    expect((await laurent.base.from("inscriptions").update({ retire_le: new Date().toISOString() }).eq("id", alice.inscriptionId).select("id")).data).toEqual([]);
    expect((await laurent.base.rpc("regler_horaires", { p_classe: classe.id, p_limites: true, p_plages: [{ jours: [1], de: "08:30", a: "16:30" }] })).error?.message).toMatch(/terminée/);
    expect((await laurent.base.from("classes_secrets").update({ mot_de_passe_chiffre: "x" }).eq("classe_id", classe.id).select("classe_id")).data).toEqual([]);
    expect((await laurent.base.from("classes").update({ nom: "Autre nom" }).eq("id", classe.id)).error?.message).toMatch(/terminée/);
    // Elle se lit toujours
    expect((await laurent.base.from("inscriptions").select("id").eq("classe_id", classe.id)).data).toHaveLength(1);
  });

  it("F01.1 — une classe sans élève ni projet se supprime, les autres non", async () => {
    const vide = await creerClasse(laurent, "Erreur");
    expect((await laurent.base.from("classes").delete().eq("id", vide.id).select("id")).data).toHaveLength(1);

    const pleine = await creerClasse(laurent, "CM1-CM2");
    await inscrire(laurent, pleine.id, ["Alice"]);
    expect((await laurent.base.from("classes").delete().eq("id", pleine.id)).error?.message).toMatch(/ne se supprime pas/);

    const avecProjet = await creerClasse(laurent, "CE2");
    await creerProjet(laurent, "classe", "choix", "Histoire", avecProjet.id);
    expect((await laurent.base.from("classes").delete().eq("id", avecProjet.id)).error?.message).toMatch(/ne se supprime pas/);
  });

  it("F06.4 — l'identifiant d'une classe est unique, fait de minuscules et de chiffres", async () => {
    const classe = await creerClasse(laurent);
    const autre = await creerEnseignant();
    const tenter = (identifiant: string) => {
      const id = randomUUID();
      return autre.base.rpc("creer_classe", { p_id: id, p_nom: "CE1", p_annee_debut: 2026, p_identifiant: identifiant, p_mot_de_passe_chiffre: chiffrer("lune sable 12", { sorte: "classe", id }) });
    };
    expect((await tenter(classe.identifiant)).error?.code).toBe("23505");
    expect((await tenter("CM1-Laurent")).error).not.toBeNull();
    // Rien n'est resté de ces essais refusés
    expect((await autre.base.from("classes").select("id")).data).toEqual([]);
  });
});
