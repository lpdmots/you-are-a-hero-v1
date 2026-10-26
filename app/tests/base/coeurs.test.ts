import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerEnseignant, creerProjet, inconnu, nettoyer, sql, type Adulte } from "./outils";

/**
 * Bibliothèque publique des livres (F15), lot 4 : les cœurs, contre la vraie base locale — un par
 * lecteur, retiré d'un second geste, comptés sur la publication, la limite par adresse réseau, les
 * cœurs retrouvés après un retrait (F15-AC13, AC09).
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
  return { projet: projet.id, adresse };
}
const coeur = async (adresse: string, lecteur: string, oui: boolean, reseau = "r:essai-local", limite = 40) =>
  (await sql<{ r: { etat: string; coeurs: number; donne: boolean } }>("select public.donner_un_coeur($1, $2, $3, $4, $5) as r", [adresse, lecteur, reseau, oui, limite]))[0].r;

describe("Les cœurs (F15)", () => {
  it("F15-AC13 — un clic donne, un second retire ; le même lecteur ne compte qu'une fois", async () => {
    const l = await publie();
    expect(await coeur(l.adresse, "n:alice", true)).toMatchObject({ etat: "fait", coeurs: 1, donne: true });
    expect(await coeur(l.adresse, "n:alice", true)).toMatchObject({ coeurs: 1, donne: true });
    expect(await coeur(l.adresse, "n:bilal", true)).toMatchObject({ coeurs: 2 });
    expect(await coeur(l.adresse, "n:alice", false)).toMatchObject({ coeurs: 1, donne: false });
    expect((await sql<{ c: number }>("select coeurs as c from public.publications where projet_id = $1", [l.projet]))[0].c).toBe(1);
  });

  it("F15-AC13 — au-delà de la limite de la journée pour une adresse réseau, les cœurs suivants ne comptent pas ; une autre adresse, si", async () => {
    const l = await publie();
    for (let i = 0; i < 3; i += 1) await coeur(l.adresse, `n:ecole-${i}`, true, "r:une-ecole", 3);
    expect(await coeur(l.adresse, "n:ecole-4", true, "r:une-ecole", 3)).toMatchObject({ etat: "limite", coeurs: 3, donne: false });
    expect(await coeur(l.adresse, "n:maison", true, "r:la-maison", 3)).toMatchObject({ etat: "fait", coeurs: 4 });
  });

  it("F15-AC09 — retiré de la bibliothèque, le livre garde ses cœurs, qu'on ne donne plus ; publié de nouveau, il les retrouve", async () => {
    const l = await publie();
    await coeur(l.adresse, "n:alice", true);
    await coeur(l.adresse, "n:bilal", true);
    await sql("update public.publications set version = null, presentation = null, age = null, empreinte = null where projet_id = $1", [l.projet]);
    expect(await coeur(l.adresse, "n:chloe", true)).toEqual({ etat: "absent" });
    await sql("update public.publications set version = '{\"titre\":\"La lanterne\"}'::jsonb, presentation = 'x', age = '8-10', empreinte = repeat('a', 32) where projet_id = $1", [l.projet]);
    expect((await sql<{ c: number }>("select coeurs as c from public.publications where projet_id = $1", [l.projet]))[0].c).toBe(2);
  });

  it("personne ne lit ni n'écrit les cœurs, sauf le serveur", async () => {
    const l = await publie();
    await coeur(l.adresse, "n:alice", true);
    expect((await inconnu().from("coeurs").select("lecteur").eq("projet_id", l.projet)).data ?? []).toEqual([]);
    expect((await laurent.base.from("coeurs").select("lecteur").eq("projet_id", l.projet)).data ?? []).toEqual([]);
    const appel = await inconnu().rpc("donner_un_coeur", { p_adresse: l.adresse, p_lecteur: "n:pirate", p_reseau: null, p_oui: true });
    expect(appel.error).not.toBeNull();
  });
});
