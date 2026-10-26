import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { publicationDuProjet, retirerDeLaBibliotheque } from "@/serveur/publication";
import { livrePublie } from "@/serveur/bibliotheque-publique";
import { classerLeSignalement, retirerParLePorteur, signalementsATraiter, signaler } from "@/serveur/signalements";
import { creerEnseignant, creerProjet, enseignantDe, nettoyer, sql, type Adulte } from "./outils";

// Le signalement lit l'adresse réseau dans l'en-tête de la demande : une demande d'essai
vi.mock("next/headers", () => ({ headers: async () => new Headers({ "x-forwarded-for": "203.0.113.7" }) }));

/**
 * Bibliothèque publique des livres (F15), lot 5 : retirer un livre, par l'adulte ou par le porteur,
 * l'adresse et les cœurs gardés ; le signaler, sans que rien ne le masque d'office (F15-AC09, AC10,
 * AC14).
 */

let laurent: Adulte;
beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
});
afterAll(nettoyer);

async function publie(): Promise<{ projet: string; adresse: string }> {
  const projet = await creerProjet(laurent, "personnel", "choix", "La lanterne du passeur");
  const adresse = `la-lanterne-${randomUUID().slice(0, 8)}`;
  await sql(
    `insert into public.publications (projet_id, enseignant_id, adresse, version, presentation, age, empreinte, publiee_le, mise_a_jour_le)
     values ($1, $2, $3, '{"titre":"La lanterne du passeur"}'::jsonb, 'Au bord du fleuve.', '8-10', repeat('a', 32), now(), now())`,
    [projet.id, laurent.id, adresse],
  );
  await sql("insert into public.coeurs (projet_id, lecteur, reseau) select $1, 'n:essai-' || g, 'r:essai-local' from generate_series(1, 12) g", [projet.id]);
  return { projet: projet.id, adresse };
}

describe("Retirer (F15)", () => {
  it("F15-AC09 — retiré par l'adulte : l'adresse mène à la page neutre ; les 12 cœurs restent, et l'adresse avec eux", async () => {
    const l = await publie();
    expect(await retirerDeLaBibliotheque(enseignantDe(laurent), l.projet)).toEqual({ ok: true });
    expect(await livrePublie(l.adresse)).toBeNull();
    const [ligne] = await sql<{ adresse: string; coeurs: number; retrait_par: string }>("select adresse, coeurs, retrait_par from public.publications where projet_id = $1", [l.projet]);
    expect(ligne).toEqual({ adresse: l.adresse, coeurs: 12, retrait_par: "adulte" });
    expect((await publicationDuProjet(enseignantDe(laurent), l.projet))!.etat).toMatchObject({ sorte: "retiree", par: "adulte" });
  });

  it("F15-AC10 — retiré par le porteur avec un motif : l'adulte le lit, son projet ne change pas, les signalements sont traités", async () => {
    const l = await publie();
    await signaler(l.adresse, { motif: "haine", passage: "17", message: "Une insulte.", courriel: "parent@exemple.test" });
    const r = await retirerParLePorteur(l.projet, "Le passage 17 se moque d’une enseignante réelle.");
    expect(r.ok).toBe(true);
    expect((await publicationDuProjet(enseignantDe(laurent), l.projet))!.etat).toMatchObject({ sorte: "retiree", par: "porteur", motif: "Le passage 17 se moque d’une enseignante réelle." });
    expect(await sql("select titre from public.projets where id = $1", [l.projet])).toEqual([{ titre: "La lanterne du passeur" }]);
    expect((await signalementsATraiter()).filter((s) => s.projetId === l.projet)).toEqual([]);
  });
});

describe("Signaler (F15)", () => {
  it("F15-AC14 — le signalement se garde pour le porteur ; le livre reste publié jusqu'à sa décision", async () => {
    const l = await publie();
    expect(await signaler(l.adresse, { motif: "haine", passage: "17", message: "Le passage 17 insulte quelqu’un.", courriel: "parent@exemple.test" })).toEqual({ ok: true });
    const [s] = (await signalementsATraiter()).filter((x) => x.projetId === l.projet);
    expect(s).toMatchObject({ motif: "haine", passage: 17, courriel: "parent@exemple.test", titre: "La lanterne du passeur", publie: true });
    expect(await livrePublie(l.adresse)).not.toBeNull();
    expect(await classerLeSignalement(s.id)).toBe(true);
    expect((await signalementsATraiter()).filter((x) => x.projetId === l.projet)).toEqual([]);
  });

  it("un motif, un message et une adresse sont demandés ; un livre absent ne se signale pas ; cinq par heure depuis une même connexion", async () => {
    const l = await publie();
    expect(await signaler(l.adresse, { motif: "x", passage: "", message: "a", courriel: "a@b.fr" })).toMatchObject({ ok: false, erreur: "Choisissez un motif." });
    expect(await signaler(l.adresse, { motif: "age", passage: "", message: " ", courriel: "a@b.fr" })).toMatchObject({ ok: false });
    expect(await signaler(l.adresse, { motif: "age", passage: "", message: "Trop effrayant.", courriel: "pas-une-adresse" })).toMatchObject({ ok: false });
    expect(await signaler("un-livre-absent", { motif: "age", passage: "", message: "Trop effrayant.", courriel: "a@b.fr" })).toMatchObject({ ok: false });
    await sql("delete from public.signalements where reseau is not null and recu_le > now() - interval '1 hour'");
    for (let i = 0; i < 5; i += 1) expect((await signaler(l.adresse, { motif: "age", passage: "", message: `Essai ${i}`, courriel: "a@b.fr" })).ok).toBe(true);
    expect(await signaler(l.adresse, { motif: "age", passage: "", message: "Encore", courriel: "a@b.fr" })).toMatchObject({ ok: false, erreur: expect.stringContaining("Trop de signalements") });
  });
});
