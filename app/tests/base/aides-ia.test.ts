import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { MESSAGES_IA, REGLAGES_IA_HABITUELS, lireReglagesIa } from "@/domaine/aides-ia";
import { demanderDesImages, demanderUneAide } from "@/serveur/ia/demander";
import { titre } from "@/serveur/ia/aides/titre";
import { creerEnseignant, nettoyer, retenir, service, sql, type Adulte } from "./outils";

/**
 * Étape 8 du plan, lot 1 : le socle des aides IA (F13, cadre commun), contre la vraie base
 * locale. Les réglages se gardent avec le compte ; chaque demande passe au journal, sans son
 * contenu. Étape 9, lot 3 : les étoiles remplacent les plafonds (F14-AC05 à AC11). Le
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
  await remettreLeSolde(laurent, 30);
  await remettreLeSolde(martin, 30);
  await sql("update public.enseignants set createur = false where id = any($1)", [[laurent.id, martin.id]]);
});

/** Remet le solde à n, par un mouvement comme un autre, pour qu'il reste la somme des mouvements. */
async function remettreLeSolde(a: Adulte, n: number): Promise<void> {
  const [{ etoiles }] = await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [a.id]);
  if (etoiles !== n) await sql("insert into public.mouvements_etoiles (enseignant_id, nombre, motif) values ($1, $2, 'cadeau')", [a.id, n - etoiles]);
}
const solde = async (a: Adulte) => (await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [a.id]))[0].etoiles;
/** Une demande au journal, puis sa fin, comme le fait l'application, avec un coût choisi. */
async function appelFini(a: Adulte, issue: "reussi" | "echec" | "delai", coutUsd: number, sorte = "texte"): Promise<void> {
  const { data } = await service().rpc("commencer_appel_ia", { p_enseignant: a.id, p_aide: "correction", p_sorte: sorte, p_nombre: 1, p_par_jour: null, p_mois_usd: null, p_attente: 75 });
  const id = (data as { id: string }).id;
  expect(id).toBeTruthy();
  await service().rpc("terminer_appel_ia", { p_id: id, p_issue: issue, p_fournisseur: "anthropic", p_modele: "claude-sonnet-5-5", p_entree: 1000, p_sortie: 500, p_cout: coutUsd });
}

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

describe("Étoiles (F14-AC05 à AC11)", () => {
  it("F14-AC05 — zéro tant que l'adresse n'est pas confirmée, puis 30 ✦, une seule fois ; un compte créé confirmé, comme par Google, les a aussitôt", async () => {
    const admin = service().auth.admin;
    const { data } = await admin.createUser({ email: `essai-${crypto.randomUUID()}@exemple.test`, password: "un-mot-de-passe-42", email_confirm: false });
    const id = data.user!.id;
    retenir(id);
    const de = async () => (await sql<{ etoiles: number }>("select etoiles from public.enseignants where id = $1", [id]))[0].etoiles;
    expect(await de()).toBe(0);
    await admin.updateUserById(id, { email_confirm: true });
    expect(await de()).toBe(30);
    // Une nouvelle adresse confirmée plus tard ne redonne rien
    await sql("update auth.users set email_confirmed_at = null where id = $1", [id]);
    await sql("update auth.users set email_confirmed_at = now() where id = $1", [id]);
    expect(await de()).toBe(30);
    expect((await sql("select motif, nombre from public.mouvements_etoiles where enseignant_id = $1", [id]))).toEqual([{ motif: "bienvenue", nombre: 30 }]);
    // Créé confirmé (Google, ou depuis la console) : 30 ✦ d'emblée
    expect(await solde(laurent)).toBe(30);
  });

  it("F14-AC06 — une demande qui coûte 0,042 euro débite 5 ✦ (arrondi à l'étoile supérieure) ; un échec ou un délai ne débite rien", async () => {
    const [{ taux }] = await sql<{ taux: string }>("select euros_par_dollar::text as taux from public.reglages_application");
    await appelFini(laurent, "reussi", Number((0.042 / Number(taux)).toFixed(6)));
    expect(await solde(laurent)).toBe(25);
    await appelFini(laurent, "echec", 0.05);
    await appelFini(laurent, "delai", 0.05);
    expect(await solde(laurent)).toBe(25);
    // Débitée une seule fois, même si la fin est notée deux fois
    const [{ id }] = await sql<{ id: string }>("select id from public.appels_ia where enseignant_id = $1 and issue = 'reussi'", [laurent.id]);
    await service().rpc("terminer_appel_ia", { p_id: id, p_issue: "reussi", p_fournisseur: "anthropic", p_modele: "x", p_entree: 1, p_sortie: 1, p_cout: 1 });
    expect(await solde(laurent)).toBe(25);
    expect((await sql("select motif, nombre from public.mouvements_etoiles where enseignant_id = $1 and motif = 'aide'", [laurent.id]))).toEqual([{ motif: "aide", nombre: -5 }]);
  });

  it("F14-AC07 — après une aide, le solde se dit quand il en reste peu, jamais au-dessus ; l'adulte le lit sans pouvoir l'écrire", async () => {
    expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: true, reste: null });
    await remettreLeSolde(laurent, 8);
    expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: true, reste: "Il vous reste 8 ✦." });
    const { data } = await laurent.base.from("enseignants").select("etoiles, createur").eq("id", laurent.id).single();
    expect(data).toEqual({ etoiles: 8, createur: false });
    await laurent.base.from("enseignants").update({ etoiles: 500, createur: true }).eq("id", laurent.id);
    await laurent.base.from("mouvements_etoiles").insert({ enseignant_id: laurent.id, nombre: 500, motif: "cadeau" });
    expect(await solde(laurent)).toBe(8);
    expect((await sql<{ createur: boolean }>("select createur from public.enseignants where id = $1", [laurent.id]))[0].createur).toBe(false);
    expect((await laurent.base.from("mouvements_etoiles").select("motif")).data?.length).toBeGreaterThan(0);
    expect((await martin.base.from("mouvements_etoiles").select("motif").eq("enseignant_id", laurent.id)).data).toEqual([]);
  });

  it("F14-AC08 — à 0 ✦ : aucun appel ne part, « Vous n'avez plus d'étoiles. Tout le reste fonctionne. »", async () => {
    await remettreLeSolde(laurent, 0);
    expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: false, refus: "etoiles", message: MESSAGES_IA.etoiles });
    expect(await demanderDesImages(demandeur(laurent), { aide: "image-scene", usage: "carre", prompt: "le ponton" })).toMatchObject({ ok: false, refus: "etoiles", message: MESSAGES_IA.etoiles });
    expect(await journal(laurent)).toHaveLength(0);
  });

  it("F14-AC09 — à 3 ✦, cinq images lancées ensemble partent toutes ; le solde finit négatif et la demande suivante est refusée", async () => {
    await remettreLeSolde(laurent, 3);
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      const { data } = await service().rpc("commencer_appel_ia", { p_enseignant: laurent.id, p_aide: "image-scene", p_sorte: "image", p_nombre: 1, p_par_jour: null, p_mois_usd: null, p_attente: 135 });
      expect((data as { id?: string }).id).toBeTruthy();
      ids.push((data as { id: string }).id);
    }
    for (const id of ids) {
      await service().rpc("terminer_appel_ia", { p_id: id, p_issue: "reussi", p_fournisseur: "openai", p_modele: "gpt-image", p_entree: 1, p_sortie: 1, p_cout: 0.015 });
    }
    expect(await solde(laurent)).toBeLessThan(0);
    expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: false, refus: "etoiles" });
  });

  it("F14-AC10 — plus de quota : quarante images dans la journée et une demande de texte pendant qu'une autre attend passent ; les demandes d'un adulte ne comptent pas pour un autre", async () => {
    await remettreLeSolde(laurent, 1000);
    await dejaFaites(laurent, 40, "now()", "image");
    await dejaFaites(laurent, 200);
    await sql("insert into public.appels_ia (enseignant_id, aide, sorte) values ($1, 'correction', 'texte')", [laurent.id]);
    expect((await demanderUneAide(demandeur(laurent), titre, entreeTitre)).ok).toBe(true);
    expect((await demanderDesImages(demandeur(laurent), { aide: "image-scene", usage: "carre", prompt: "le ponton" })).ok).toBe(true);
    await remettreLeSolde(martin, 0);
    expect((await demanderUneAide(demandeur(laurent), titre, entreeTitre)).ok).toBe(true);
  });

  it("F14-AC11 — le compte du porteur : rien n'est débité, rien n'est refusé, aucun solde n'est dit", async () => {
    await sql("update public.enseignants set createur = true where id = $1", [laurent.id]);
    await remettreLeSolde(laurent, 0);
    await appelFini(laurent, "reussi", 0.5);
    expect(await solde(laurent)).toBe(0);
    expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: true, reste: null });
  });
});

describe("Échecs (F13)", () => {
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

  it("lot 9 — sans les clés du fournisseur, rien ne part ni ne compte : « Les aides IA ne sont pas installées sur ce site »", async () => {
    process.env.IA_SIMULEE = "sans-cle";
    expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: false, refus: "absentes", message: MESSAGES_IA.absentes });
    const image = await demanderDesImages(demandeur(laurent), { aide: "image-scene", usage: "carre", prompt: "le ponton" });
    expect(image).toMatchObject({ ok: false, refus: "absentes", message: MESSAGES_IA.absentes });
    expect(await journal(laurent)).toHaveLength(0);

    // Sans simulation, des clés vides suffisent : le refus vient avant tout appel
    const garde = { s: process.env.IA_SIMULEE, a: process.env.ANTHROPIC_API_KEY, o: process.env.OPENAI_API_KEY };
    try {
      delete process.env.IA_SIMULEE;
      process.env.ANTHROPIC_API_KEY = "";
      process.env.OPENAI_API_KEY = "";
      expect(await demanderUneAide(demandeur(laurent), titre, entreeTitre)).toMatchObject({ ok: false, refus: "absentes" });
      expect(await demanderDesImages(demandeur(laurent), { aide: "image-scene", usage: "carre", prompt: "le ponton" })).toMatchObject({ ok: false, refus: "absentes" });
    } finally {
      process.env.IA_SIMULEE = garde.s;
      if (garde.a === undefined) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = garde.a;
      if (garde.o === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = garde.o;
    }
    expect(await journal(laurent)).toHaveLength(0);
  });
});
