import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { supprimerLeCompte, tourneeDesComptesInactifs } from "@/serveur/suppression";
import { attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inscrire, nettoyer, service, sql, type Adulte } from "./outils";

/**
 * Étape 9, lot 7 : supprimer pour de bon (F14-AC26 à AC29), contre la vraie base locale. Les
 * courriels partent dans la boîte locale (Mailpit).
 */

let bernard: Adulte;
afterAll(nettoyer);
beforeAll(async () => {
  bernard = await creerEnseignant("M. Bernard");
});

const compter = async (requete: string, valeurs: unknown[]) => (await sql<{ n: number }>(`select count(*)::int as n from ${requete}`, valeurs))[0].n;

describe("La corbeille (F14-AC28)", () => {
  it("F14-AC28 — une scène supprimée pour de bon disparaît ; « Vider la corbeille » emporte le reste, chapitre et scènes ; ce qui n'est pas à la corbeille ne se supprime pas ainsi", async () => {
    const projet = (await creerProjet(bernard, "personnel", "choix", "Le marais")).id;
    const { partieId, chapitreId } = await creerPartie(bernard, projet, "La traversée", "Le dernier bac");
    const [a, b, c] = [await creerScene(bernard.base, chapitreId), await creerScene(bernard.base, chapitreId), await creerScene(bernard.base, chapitreId)];
    const autre = await creerScene(bernard.base, chapitreId);
    await bernard.base.from("projets").update({ depart_scene_id: a.id }).eq("id", projet);
    const second = (await bernard.base.rpc("creer_chapitre", { p_partie: partieId, p_titre: "Le gué", p_couleur: 1, p_visuel: "mer" })).data as string;
    await creerScene(bernard.base, second);
    for (const [sorte, id] of [["scene", a.id], ["scene", b.id], ["chapitre", second]]) {
      expect((await bernard.base.rpc("supprimer_element", { p_sorte: sorte, p_id: id })).error).toBeNull();
    }
    // Ce qui n'est pas à la corbeille ne se supprime pas pour de bon
    expect((await bernard.base.rpc("supprimer_pour_de_bon", { p_sorte: "scene", p_id: c.id })).error?.code).toBe("P0001");
    // Une scène, pour de bon : le départ qui y menait s'oublie
    expect((await bernard.base.rpc("supprimer_pour_de_bon", { p_sorte: "scene", p_id: a.id })).error).toBeNull();
    expect(await compter("public.scenes where id = $1", [a.id])).toBe(0);
    expect((await sql("select depart_scene_id from public.projets where id = $1", [projet]))[0].depart_scene_id).toBeNull();
    // « Restaurer » restait possible jusque-là
    expect((await bernard.base.rpc("restaurer_element", { p_sorte: "scene", p_id: b.id })).error).toBeNull();
    expect((await bernard.base.rpc("supprimer_element", { p_sorte: "scene", p_id: b.id })).error).toBeNull();
    // Vider : la scène et le chapitre avec sa scène
    const { data } = await bernard.base.rpc("vider_la_corbeille", { p_projet: projet });
    expect(data).toBe(2);
    expect(await compter("public.scenes where projet_id = $1", [projet])).toBe(2);
    expect(await compter("public.chapitres where id = $1", [second])).toBe(0);
    expect(await compter("public.scenes where id = any($1)", [[c.id, autre.id]])).toBe(2);
    // Un autre adulte ne vide pas la corbeille de ce projet
    const martin = await creerEnseignant("M. Martin");
    expect((await bernard.base.rpc("supprimer_element", { p_sorte: "scene", p_id: c.id })).error).toBeNull();
    await martin.base.rpc("vider_la_corbeille", { p_projet: projet });
    expect(await compter("public.scenes where id = $1", [c.id])).toBe(1);
  });
});

describe("Une classe passée (F14-AC27)", () => {
  it("F14-AC27 — supprimer « CM1 2025-2026 » terminée : profils, codes et inscriptions effacés, S015 reste signée « Alice » ; une classe en cours ne se supprime pas ainsi", async () => {
    const classe = await creerClasse(bernard, "CM1", 2025);
    const [alice] = await inscrire(bernard, classe.id, ["Alice Martin", "Bilal Durand"]);
    const projet = (await creerProjet(bernard, "classe", "choix", "Le marais", classe.id)).id;
    const { chapitreId } = await creerPartie(bernard, projet, "La traversée", "Le dernier bac");
    await attribuer(bernard, chapitreId, [{ eleve: alice.id }]);
    const s015 = await creerScene(bernard.base, chapitreId);
    await sql("update public.scenes set prise_par_eleve = $2, ecrit_par = array[$2]::uuid[], etat = 'valide' where id = $1", [s015.id, alice.id]);

    // En cours : refusé
    expect((await bernard.base.rpc("supprimer_la_classe", { p_classe: classe.id })).error?.code).toBe("P0001");
    await bernard.base.from("classes").update({ terminee_le: new Date().toISOString() }).eq("id", classe.id);
    expect((await bernard.base.rpc("supprimer_la_classe", { p_classe: classe.id })).error).toBeNull();

    expect(await compter("public.inscriptions where classe_id = $1", [classe.id])).toBe(0);
    expect(await compter("public.attributions where eleve_id = $1", [alice.id])).toBe(0);
    expect(await compter("public.eleves_secrets where eleve_id = $1", [alice.id])).toBe(0);
    expect(await compter("public.classes_secrets where classe_id = $1", [classe.id])).toBe(0);
    expect((await sql("select prenom, nom from public.eleves where id = $1", [alice.id]))[0]).toEqual({ prenom: "Alice", nom: null });
    expect((await sql("select prise_par_eleve from public.scenes where id = $1", [s015.id]))[0].prise_par_eleve).toBe(alice.id);
    // La classe ne se montre plus ; son projet garde tout
    expect((await bernard.base.from("classes").select("id").eq("id", classe.id).is("supprimee_le", null)).data).toEqual([]);
    expect(await compter("public.projets where id = $1 and classe_id = $2", [projet, classe.id])).toBe(1);
  });
});

describe("Supprimer un compte (F14-AC26)", () => {
  it("F14-AC26 — deux projets, une classe, un livre partagé, une image : tout est effacé, le compte ne s'ouvre plus", async () => {
    const dupont = await creerEnseignant("M. Dupont");
    const classe = await creerClasse(dupont, "CE2", 2026);
    await inscrire(dupont, classe.id, ["Chloé"]);
    const p1 = (await creerProjet(dupont, "classe", "choix", "Le marais", classe.id)).id;
    await creerProjet(dupont, "personnel", "classique", "Le phare");
    await sql(
      `insert into public.partages (projet_id, enseignant_id, code, par_lien, version, etat_du, empreinte, empreinte_lecture)
       values ($1, $2, 'mnpqrstuvw', true, '{"titre":"Le marais"}'::jsonb, now(), repeat('a', 32), repeat('b', 32))`,
      [p1, dupont.id],
    );
    const chemin = `${dupont.id}/${p1}/essai.jpg`;
    await service().storage.from("images").upload(chemin, Buffer.from("image"), { contentType: "image/jpeg" });
    await service().storage.from("images").upload(`${dupont.id}/${p1}/propositions/p.jpg`, Buffer.from("image"), { contentType: "image/jpeg" });

    await supprimerLeCompte(dupont.id);
    expect(await compter("auth.users where id = $1", [dupont.id])).toBe(0);
    expect(await compter("public.projets where enseignant_id = $1", [dupont.id])).toBe(0);
    expect(await compter("public.classes where enseignant_id = $1", [dupont.id])).toBe(0);
    expect(await compter("public.eleves where enseignant_id = $1", [dupont.id])).toBe(0);
    expect(await compter("public.partages where code = 'mnpqrstuvw'", [])).toBe(0);
    expect((await service().storage.from("images").list(`${dupont.id}/${p1}`)).data ?? []).toEqual([]);
    const entree = await dupont.base.auth.signInWithPassword({ email: dupont.courriel, password: dupont.motDePasse });
    expect(entree.error).not.toBeNull();
  });
});

describe("Les comptes inactifs (F14-AC29)", () => {
  it("F14-AC29 — cinq ans sans connexion : un avis ; trente jours après, sans connexion, le compte est supprimé ; une connexion annule ; le porteur n'est jamais concerné", async () => {
    const vieux = await creerEnseignant("M. Vieux");
    const revenu = await creerEnseignant("Mme Revenue");
    for (const a of [vieux, revenu]) {
      await sql("update auth.users set last_sign_in_at = now() - interval '6 years', created_at = now() - interval '7 years' where id = $1", [a.id]);
      await sql("update public.enseignants set vu_le = now() - interval '6 years' where id = $1", [a.id]);
    }
    const premiere = await tourneeDesComptesInactifs();
    expect(premiere.prevenus).toBeGreaterThanOrEqual(2);
    expect(await compter("public.avis_d_inactivite where enseignant_id = any($1)", [[vieux.id, revenu.id]])).toBe(2);
    const boite = process.env.COURRIER_LOCAL_URL!;
    const liste = await (await fetch(`${boite}/api/v1/search?query=${encodeURIComponent(`to:${vieux.courriel}`)}`)).json();
    expect(liste.messages?.[0]?.Subject).toBe("Votre compte sera supprimé dans trente jours — Il était une classe");

    // Rien de plus le lendemain ; Mme Revenue se reconnecte
    await tourneeDesComptesInactifs();
    expect(await compter("public.avis_d_inactivite where enseignant_id = any($1)", [[vieux.id, revenu.id]])).toBe(2);
    await sql("update public.enseignants set vu_le = now() where id = $1", [revenu.id]);
    await sql("update public.avis_d_inactivite set envoye_le = now() - interval '31 days' where enseignant_id = any($1)", [[vieux.id, revenu.id]]);
    const apres = await tourneeDesComptesInactifs();
    expect(apres.supprimes).toBeGreaterThanOrEqual(1);
    expect(await compter("auth.users where id = $1", [vieux.id])).toBe(0);
    expect(await compter("auth.users where id = $1", [revenu.id])).toBe(1);
    expect(await compter("public.avis_d_inactivite where enseignant_id = $1", [revenu.id])).toBe(0);
  });
});
