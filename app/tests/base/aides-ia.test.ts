import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MESSAGES_IA, PLAFONDS, REGLAGES_IA_HABITUELS, lireReglagesIa } from "@/domaine/aides-ia";
import { demanderUneAide } from "@/serveur/ia/demander";
import { titre } from "@/serveur/ia/aides/titre";
import { creerEnseignant, nettoyer, service, sql, type Adulte } from "./outils";

/**
 * Étape 8 du plan, lot 1 : le socle des aides IA (F13, cadre commun), contre la vraie base
 * locale. Les réglages se gardent avec le compte ; chaque demande passe au journal, sans son
 * contenu ; les plafonds du jour et du mois tiennent ; une seule demande à la fois. Le
 * fournisseur est toujours simulé (IA_SIMULEE, tests/base/preparation.ts).
 */

let laurent: Adulte;
let martin: Adulte;
afterAll(nettoyer);
beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
});
afterEach(async () => {
  process.env.IA_SIMULEE = "1";
  await sql("delete from public.appels_ia where enseignant_id = any($1)", [[laurent.id, martin.id]]);
});

const demandeur = (a: Adulte, proposer = true) => ({ id: a.id, reglagesIa: { ...REGLAGES_IA_HABITUELS, proposer } });
const entreeTitre = {
  histoire: { titre: "Les passeurs de brume", mode: "classe" as const, recit: "choix" as const, niveaux: [] },
  consigne: "Lou arrive sur le pont de brume.", debut: null, autresTitres: [],
};
const journal = (a: Adulte) =>
  sql<{ aide: string; sorte: string; issue: string | null; fournisseur: string | null; modele: string | null; cout_usd: string | null }>(
    "select aide, sorte, issue, fournisseur, modele, cout_usd from public.appels_ia where enseignant_id = $1 order by commence_le", [a.id]);
/** n demandes déjà faites aujourd'hui, ou à l'instant donné, sans passer par un fournisseur. */
const dejaFaites = (a: Adulte, n: number, quand = "now()", sorte = "texte", cout = 0) =>
  sql(`insert into public.appels_ia (enseignant_id, aide, sorte, commence_le, termine_le, issue, cout_usd)
       select $1, 'titre', $2, ${quand}, ${quand}, 'reussi', $3 from generate_series(1, $4)`, [a.id, sorte, cout, n]);

describe("Réglages des aides IA, gardés avec le compte (F13)", () => {
  it("F13-AC01 — un compte neuf propose le degré 2 ; un défaut réglé à 3 vaut pour tous ses projets", async () => {
    const { data: neuf } = await laurent.base.from("enseignants").select("reglages_ia").eq("id", laurent.id).single();
    expect(lireReglagesIa(neuf?.reglages_ia).degre).toBe(2);
    const { error } = await laurent.base.from("enseignants").update({ reglages_ia: { ...REGLAGES_IA_HABITUELS, degre: 3 } }).eq("id", laurent.id);
    expect(error).toBeNull();
    const { data: apres } = await laurent.base.from("enseignants").select("reglages_ia").eq("id", laurent.id).single();
    expect(lireReglagesIa(apres?.reglages_ia).degre).toBe(3);
    await laurent.base.from("enseignants").update({ reglages_ia: {} }).eq("id", laurent.id);
  });

  it("un adulte ne règle que son compte, et un réglage démesuré est refusé", async () => {
    await martin.base.from("enseignants").update({ reglages_ia: { degre: 5 } }).eq("id", laurent.id);
    const { data } = await laurent.base.from("enseignants").select("reglages_ia").eq("id", laurent.id).single();
    expect(lireReglagesIa(data?.reglages_ia).degre).toBe(2);
    const { error } = await laurent.base.from("enseignants").update({ reglages_ia: { bourrage: "x".repeat(2000) } }).eq("id", laurent.id);
    expect(error).not.toBeNull();
  });
});

describe("Journal des appels, sans contenu (F13)", () => {
  it("une demande réussie est notée : l'aide, l'issue, le modèle, le coût — jamais le texte", async () => {
    const r = await demanderUneAide(demandeur(laurent), titre, entreeTitre);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.valeur.titres.length).toBeGreaterThan(0);
    const lignes = await journal(laurent);
    expect(lignes).toHaveLength(1);
    expect(lignes[0]).toMatchObject({ aide: "titre", sorte: "texte", issue: "reussi", fournisseur: "simule", cout_usd: "0.000000" });
    const colonnes = await sql<{ column_name: string }>("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'appels_ia'");
    expect(colonnes.map((c) => c.column_name).sort()).toEqual(
      ["aide", "commence_le", "cout_usd", "enseignant_id", "fournisseur", "id", "issue", "jetons_entree", "jetons_sortie", "modele", "nombre", "sorte", "termine_le"],
    );
  });

  it("l'adulte lit ses lignes, sans pouvoir en écrire, en effacer ni lire celles d'un autre", async () => {
    await demanderUneAide(demandeur(laurent), titre, entreeTitre);
    expect((await laurent.base.from("appels_ia").select("aide")).data).toHaveLength(1);
    expect((await martin.base.from("appels_ia").select("aide")).data).toHaveLength(0);
    await laurent.base.from("appels_ia").delete().eq("enseignant_id", laurent.id);
    await laurent.base.from("appels_ia").insert({ enseignant_id: laurent.id, aide: "titre", sorte: "texte" });
    await laurent.base.from("appels_ia").update({ sorte: "image" }).eq("enseignant_id", laurent.id);
    expect(await journal(laurent)).toMatchObject([{ sorte: "texte" }]);
    expect((await laurent.base.rpc("commencer_appel_ia", {
      p_enseignant: laurent.id, p_aide: "titre", p_sorte: "texte", p_nombre: 1, p_par_jour: 60, p_mois_usd: null, p_attente: 75,
    })).error).not.toBeNull();
  });

  it("aides éteintes dans « Mon compte » : aucune demande ne part, rien n'est noté", async () => {
    const r = await demanderUneAide(demandeur(laurent, false), titre, entreeTitre);
    expect(r).toMatchObject({ ok: false, refus: "eteint" });
    expect(await journal(laurent)).toHaveLength(0);
  });
});

describe("Plafonds et échecs (F13)", () => {
  it("rien ne s'affiche avant les dix dernières demandes du jour, puis « Encore 10 demandes aujourd'hui. »", async () => {
    await dejaFaites(laurent, PLAFONDS.textesParJour - 12);
    const avant = await demanderUneAide(demandeur(laurent), titre, entreeTitre);
    expect(avant).toMatchObject({ ok: true, reste: null });
    await dejaFaites(laurent, 1);
    const apres = await demanderUneAide(demandeur(laurent), titre, entreeTitre);
    expect(apres).toMatchObject({ ok: true, reste: "Encore 9 demandes aujourd'hui." });
  });

  it("à la limite du jour : « Les aides reviennent demain. Tout le reste fonctionne. », sans appel", async () => {
    await dejaFaites(laurent, PLAFONDS.textesParJour);
    const r = await demanderUneAide(demandeur(laurent), titre, entreeTitre);
    expect(r).toMatchObject({ ok: false, refus: "jour", message: MESSAGES_IA.demain });
    expect(await journal(laurent)).toHaveLength(PLAFONDS.textesParJour);
  });

  it("le jour se compte à l'heure de Paris : les demandes d'hier soir ne comptent plus", async () => {
    await dejaFaites(laurent, PLAFONDS.textesParJour, "(date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris') - interval '10 minutes'");
    expect((await demanderUneAide(demandeur(laurent), titre, entreeTitre)).ok).toBe(true);
  });

  it("les demandes d'un adulte ne comptent pas pour un autre", async () => {
    await dejaFaites(martin, PLAFONDS.textesParJour);
    expect((await demanderUneAide(demandeur(laurent), titre, entreeTitre)).ok).toBe(true);
  });

  it("une seule demande à la fois : la seconde est refusée tant que la première attend", async () => {
    await sql("insert into public.appels_ia (enseignant_id, aide, sorte) values ($1, 'correction', 'texte')", [laurent.id]);
    expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: false, refus: "occupe" });
    // Une demande abandonnée depuis longtemps ne retient plus l'adulte
    await sql("update public.appels_ia set commence_le = now() - interval '5 minutes' where enseignant_id = $1", [laurent.id]);
    expect((await demanderUneAide(demandeur(laurent), titre, entreeTitre)).ok).toBe(true);
  });

  it("deux demandes parties ensemble : une seule passe", async () => {
    process.env.IA_SIMULEE = "delai";
    const [a, b] = await Promise.all([
      demanderUneAide(demandeur(laurent), titre, entreeTitre, { delaiMs: 400 }),
      demanderUneAide(demandeur(laurent), titre, entreeTitre, { delaiMs: 400 }),
    ]);
    expect([a, b].filter((r) => !r.ok && r.refus === "occupe")).toHaveLength(1);
  });

  it("sans réponse dans le délai : « L'aide n'a pas répondu. Le texte n'a pas changé. », noté « délai »", async () => {
    process.env.IA_SIMULEE = "delai";
    const r = await demanderUneAide(demandeur(laurent), titre, entreeTitre, { delaiMs: 300 });
    expect(r).toMatchObject({ ok: false, refus: "delai", message: MESSAGES_IA.pasDeReponse });
    expect(await journal(laurent)).toMatchObject([{ issue: "delai" }]);
  });

  it("une réponse inutilisable ne rend rien et se note « échec »", async () => {
    process.env.IA_SIMULEE = "echec";
    const r = await demanderUneAide(demandeur(laurent), titre, entreeTitre);
    expect(r).toMatchObject({ ok: false, refus: "echec", message: MESSAGES_IA.pasDeReponse });
    expect(await journal(laurent)).toMatchObject([{ issue: "echec" }]);
  });

  it("images : vingt par jour, chaque image d'une création comptant ; trente euros par mois pour toute l'application", async () => {
    const commencer = (a: Adulte, nombre: number, moisUsd: number | null = PLAFONDS.imagesParMoisUsd) => service().rpc("commencer_appel_ia", {
      p_enseignant: a.id, p_aide: "image", p_sorte: "image", p_nombre: nombre, p_par_jour: PLAFONDS.imagesParJour, p_mois_usd: moisUsd, p_attente: 75,
    }).then((r) => r.data as { id?: string; refus?: string; restant?: number });
    await dejaFaites(laurent, PLAFONDS.imagesParJour - 1, "now()", "image");
    expect(await commencer(laurent, 2)).toMatchObject({ refus: "jour", restant: 1 });
    expect(await commencer(laurent, 1)).toMatchObject({ restant: 0 });
    // Le mois : les images de tous les adultes comptent ensemble
    await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
    await dejaFaites(martin, 1, "now()", "image", PLAFONDS.imagesParMoisUsd);
    expect(await commencer(laurent, 1)).toMatchObject({ refus: "mois" });
    // Les textes n'entrent pas dans le plafond des images
    await sql("delete from public.appels_ia where enseignant_id = $1", [martin.id]);
    await dejaFaites(martin, 1, "now()", "texte", 500);
    expect((await commencer(laurent, 1)).id).toBeTruthy();
  });
});
