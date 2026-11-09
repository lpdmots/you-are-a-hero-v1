import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { DICTEE } from "@/domaine/dictee";
import { reglerLaSimulation } from "@/serveur/ia/demander";
import { derniereDicteeSimulee, dicteePossible, TEXTE_SIMULE, transcrire } from "@/serveur/dictee";
import { creerEnseignant, creerProjet, enseignantDe, nettoyer, service, sql, type Adulte } from "./outils";

/**
 * La dictée de l'adulte (F07.4), contre la vraie base locale, le fournisseur simulé
 * (IA_SIMULEE) : le plafond du mois, le journal sans contenu, les noms du projet en indices.
 */

let laurent: Adulte;
let martin: Adulte;
const son = (octets = 2000) => new Blob([new Uint8Array(octets)], { type: "audio/webm" });

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
});
afterAll(nettoyer);
afterEach(async () => {
  reglerLaSimulation(null);
  await sql("delete from public.dictees where enseignant_id = any($1)", [[laurent.id, martin.id]]);
});

const journal = (a: Adulte) => sql<{ secondes: string; fournisseur: string }>("select secondes, fournisseur from public.dictees where enseignant_id = $1", [a.id]);

describe("Dicter (F07.4)", () => {
  it("F07-AC88, F07-AC96 — le texte entendu revient ; le journal ne note que la durée", async () => {
    const r = await transcrire(enseignantDe(laurent), { audio: son(), projet: null });
    expect(r).toEqual({ ok: true, texte: TEXTE_SIMULE });
    const lignes = await journal(laurent);
    expect(lignes).toHaveLength(1);
    expect(Number(lignes[0].secondes)).toBe(4);
    expect(lignes[0].fournisseur).toBe("simule");
    const colonnes = await sql<{ column_name: string }>("select column_name from information_schema.columns where table_schema = 'public' and table_name = 'dictees'");
    expect(colonnes.map((c) => c.column_name).sort()).toEqual(["enseignant_id", "fournisseur", "id", "le", "secondes"]);
  });

  it("F07-AC96 — l'adulte lit ses lignes, pas celles d'un autre, et n'en écrit ni n'en efface aucune", async () => {
    await transcrire(enseignantDe(laurent), { audio: son(), projet: null });
    await transcrire(enseignantDe(martin), { audio: son(), projet: null });
    const { data } = await laurent.base.from("dictees").select("enseignant_id");
    expect(data?.map((l) => l.enseignant_id)).toEqual([laurent.id]);
    const { error } = await laurent.base.from("dictees").insert({ enseignant_id: laurent.id, secondes: 1, fournisseur: "simule" });
    expect(error).not.toBeNull();
    await laurent.base.from("dictees").delete().eq("enseignant_id", laurent.id);
    expect(await journal(laurent)).toHaveLength(1);
    const { error: compte } = await laurent.base.rpc("secondes_dictees_du_mois", { p_enseignant: laurent.id });
    expect(compte).not.toBeNull();
  });

  it("F07-AC92 — trois heures dictées ce mois-ci, heure de Paris : refusée avant d'enregistrer, rien ne part ; celles du mois dernier ne comptent pas", async () => {
    const { error: e1 } = await service().from("dictees").insert([
      { enseignant_id: laurent.id, secondes: 600, fournisseur: "simule", le: new Date(Date.now() - 40 * 86_400_000).toISOString() },
      ...Array.from({ length: 17 }, () => ({ enseignant_id: laurent.id, secondes: 600, fournisseur: "simule", le: new Date().toISOString() })),
    ]);
    expect(e1).toBeNull();
    // 17 × 10 minutes : il reste dix minutes ce mois-ci
    expect(await dicteePossible(enseignantDe(laurent))).toBeNull();
    await service().from("dictees").insert({ enseignant_id: laurent.id, secondes: 600, fournisseur: "simule" });
    expect(await dicteePossible(enseignantDe(laurent))).toBe("plafond");
    expect(await transcrire(enseignantDe(laurent), { audio: son(), projet: null })).toEqual({ ok: false, refus: "plafond" });
    expect(await journal(laurent)).toHaveLength(19);
    // Le plafond est celui du compte : un autre adulte dicte
    expect(await dicteePossible(enseignantDe(martin))).toBeNull();
    expect(DICTEE.secondesParMois).toBe(18 * 600);
  });

  it("F07-AC93 — sans clé du fournisseur, rien ne part et rien ne compte", async () => {
    reglerLaSimulation("sans-cle");
    expect(await dicteePossible(enseignantDe(laurent))).toBe("absente");
    expect(await transcrire(enseignantDe(laurent), { audio: son(), projet: null })).toEqual({ ok: false, refus: "absente" });
    expect(await journal(laurent)).toHaveLength(0);
  });

  it("F07-AC94 — une réponse inutilisable, un délai dépassé, un son vide : le texte ne change pas, rien ne compte", async () => {
    reglerLaSimulation("echec");
    expect(await transcrire(enseignantDe(laurent), { audio: son(), projet: null })).toEqual({ ok: false, refus: "echec" });
    reglerLaSimulation("delai");
    expect(await transcrire(enseignantDe(laurent), { audio: son(), projet: null }, { delaiMs: 50 })).toEqual({ ok: false, refus: "echec" });
    reglerLaSimulation(null);
    expect(await transcrire(enseignantDe(laurent), { audio: son(0), projet: null })).toEqual({ ok: false, refus: "rien" });
    expect(await transcrire(enseignantDe(laurent), { audio: son(DICTEE.octetsMax + 1), projet: null })).toEqual({ ok: false, refus: "trop-long" });
    expect(await journal(laurent)).toHaveLength(0);
  });

  it("F07-AC95 — les noms des personnages, leurs autres noms et les objets du projet partent en indices ; ceux d'un projet d'un autre, jamais", async () => {
    const projet = await creerProjet(laurent, "personnel", "choix", "Les passeurs de brume");
    const { error: e1 } = await service().from("personnages").insert([
      { projet_id: projet.id, enseignant_id: laurent.id, nom: "Lou", autres_noms: ["la petite"], heros: true, rang: 0 },
      { projet_id: projet.id, enseignant_id: laurent.id, nom: "Le passeur", autres_noms: [], heros: false, rang: 1 },
    ]);
    expect(e1).toBeNull();
    await service().from("objets").insert({ projet_id: projet.id, enseignant_id: laurent.id, nom: "Lanterne de brume" });
    await transcrire(enseignantDe(laurent), { audio: son(), projet: projet.id });
    expect(derniereDicteeSimulee()?.termes).toEqual(["Lou", "la petite", "Le passeur", "Lanterne de brume"]);

    await transcrire(enseignantDe(martin), { audio: son(), projet: projet.id });
    expect(derniereDicteeSimulee()?.termes).toEqual([]);
  });
});
