import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { demanderUneConsigne, lieuDeLaScene } from "@/serveur/aides-de-la-scene";
import { ficheDuProjet } from "@/serveur/fiche-histoire";
import { consigne } from "@/serveur/ia/aides/consigne";
import { planDe } from "@/serveur/recit";
import {
  creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, lire, nettoyer, posteDe, sql, type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * La fiche de l'histoire et la description des parties (F02.1, révisé le 19 novembre 2026), contre
 * la base locale et le fournisseur simulé : la description d'une partie se lit dans les deux vues
 * du plan, s'imprime sur la fiche, part avec les aides demandées sur une scène de cette partie, et
 * ne regarde ni un élève ni un autre adulte.
 */

let laurent: Adulte;
let martin: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  [alice] = await inscrire(laurent, classe.id, ["Alice"]);
});
afterAll(nettoyer);
afterEach(async () => {
  vi.restoreAllMocks();
  await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
});

const projetDeClasse = async (recit: "choix" | "classique" = "choix") => (await creerProjet(laurent, "classe", recit, "Les passeurs de brume", classe.id)).id;
const decrire = async (partieId: string, description: string) => {
  const { error } = await laurent.base.from("parties").update({ description }).eq("id", partieId);
  if (error) throw new Error(error.message);
};
const partiesDeLaFiche = async (projet: string) => {
  const lue = await ficheDuProjet(enseignantDe(laurent), projet);
  const r = lue?.fiche.rubriques.find((x) => x.sorte === "parties");
  return r && "parties" in r ? r.parties.map((p) => (p.description ? `${p.titre} : ${p.description}` : p.titre)) : [];
};
const envoye = (espion: { mock: { calls: unknown[][] } }) =>
  espion.mock.calls.map(([e]) => `${consigne.systeme(e as never)}\n${consigne.message(e as never)}`).join("\n");

describe("La description des parties et la fiche de l'histoire (F02.1)", () => {
  it("F02-AC25 — la description écrite pour « Le lac » se lit dans le plan, s'imprime sur la fiche et part avec l'aide d'une scène de cette partie, pas d'une autre", async () => {
    const projet = await projetDeClasse();
    const port = await creerPartie(laurent, projet, "Le port", "Le quai");
    const lac = await creerPartie(laurent, projet, "Le lac", "La traversée");
    await decrire(lac.partieId, "Couvert de brume ; les chemins y changent de place quand les lanternes s’éteignent.");
    const surLeLac = await creerScene(laurent.base, lac.chapitreId);
    const auPort = await creerScene(laurent.base, port.chapitreId);
    await laurent.base.from("scenes").update({ consigne: "Lou monte dans la barque." }).in("id", [surLeLac.id, auPort.id]);

    // Une seule description, celle que lisent la carte de « Grandes étapes » et les réglages de la partie
    const plan = await planDe(enseignantDe(laurent), projet);
    expect(plan.parties.map((p) => [p.titre, p.description])).toEqual([
      ["Le port", ""],
      ["Le lac", "Couvert de brume ; les chemins y changent de place quand les lanternes s’éteignent."],
    ]);
    expect(await partiesDeLaFiche(projet)).toEqual(["Le port", "Le lac : Couvert de brume ; les chemins y changent de place quand les lanternes s’éteignent."]);
    // Avec son image de repérage, celle que montre sa carte
    const lue = await ficheDuProjet(enseignantDe(laurent), projet);
    const r = lue?.fiche.rubriques.find((x) => x.sorte === "parties");
    expect(r && "parties" in r ? r.parties.map((p) => p.repere?.visuelDefaut) : []).toEqual(["foret", "foret"]);

    expect((await lieuDeLaScene(enseignantDe(laurent), surLeLac.id))?.chapitre.partie).toEqual({
      titre: "Le lac", description: "Couvert de brume ; les chemins y changent de place quand les lanternes s’éteignent.",
    });
    const simuler = vi.spyOn(consigne, "simuler");
    expect((await demanderUneConsigne(enseignantDe(laurent), surLeLac.id)).ok).toBe(true);
    expect(envoye(simuler)).toContain("<partie>\nLe lac : Couvert de brume ; les chemins y changent de place");
    simuler.mockClear();
    expect((await demanderUneConsigne(enseignantDe(laurent), auPort.id)).ok).toBe(true);
    expect(envoye(simuler)).not.toContain("<partie>");
    expect(envoye(simuler)).not.toContain("Couvert de brume");
  });

  it("F02-AC22 — une fiche déjà ouverte : la description du « Marais » écrite ensuite y figure à la réouverture, toutes les parties dans l'ordre du livre", async () => {
    const projet = await projetDeClasse();
    const port = await creerPartie(laurent, projet, "Le port");
    const marais = await creerPartie(laurent, projet, "Le marais");
    await decrire(port.partieId, "D’où partent les barques.");
    expect(await partiesDeLaFiche(projet)).toEqual(["Le port : D’où partent les barques.", "Le marais"]);
    await decrire(marais.partieId, "Des feux follets dansent sur l’eau noire.");
    expect(await partiesDeLaFiche(projet)).toEqual(["Le port : D’où partent les barques.", "Le marais : Des feux follets dansent sur l’eau noire."]);
    // L'ordre du livre : la partie tirée en tête passe en tête
    expect((await laurent.base.rpc("placer_partie", { p_partie: marais.partieId, p_position: 0 })).error).toBeNull();
    expect(await partiesDeLaFiche(projet)).toEqual(["Le marais : Des feux follets dansent sur l’eau noire.", "Le port : D’où partent les barques."]);
  });

  it("une description de partie tient en 300 signes ; au-delà, la base la refuse", async () => {
    const projet = await projetDeClasse();
    const { partieId } = await creerPartie(laurent, projet, "Le port");
    expect((await laurent.base.from("parties").update({ description: "a".repeat(301) }).eq("id", partieId)).error).not.toBeNull();
    expect((await laurent.base.from("parties").update({ description: "a".repeat(300) }).eq("id", partieId)).error).toBeNull();
  });

  it("F02-AC24 — un poste d'élève ne lit ni la description d'une partie ni rien de la Préparation ; un autre adulte n'obtient pas la fiche", async () => {
    const projet = await projetDeClasse();
    const { partieId } = await creerPartie(laurent, projet, "Le port");
    await decrire(partieId, "D’où partent les barques.");
    const base = await (await posteDe(classe.id, alice.inscriptionId)).base();
    expect((await base.from("parties").select("description").eq("id", partieId)).error).not.toBeNull();
    for (const table of ["preparations", "personnages", "objets"]) {
      const { lignes, refus } = await lire(base, table);
      expect(lignes, table).toEqual([]);
      expect(refus, table).not.toBeNull();
    }
    expect((await base.from("parties").update({ description: "Piraté" }).eq("id", partieId)).error).not.toBeNull();
    expect(await ficheDuProjet(enseignantDe(martin), projet)).toBeNull();
    await martin.base.from("parties").update({ description: "Piraté" }).eq("id", partieId);
    expect(await partiesDeLaFiche(projet)).toEqual(["Le port : D’où partent les barques."]);
  });

  it("F02-AC26 — la fiche d'un récit classique, lue dans la base, ne montre ni feuille d'aventure ni règles du jeu", async () => {
    const projet = await projetDeClasse("classique");
    await laurent.base.from("preparations").update({
      univers: "Une ville au bord de la mer.", regles: "Lance le dé.", feuille: { on: true, des: 1, sections: [{ id: "s1", type: "liste", titre: "Inventaire", lignes: 6 }] },
    }).eq("projet_id", projet);
    const lue = await ficheDuProjet(enseignantDe(laurent), projet);
    expect(lue?.fiche.rubriques.map((r) => r.sorte)).toEqual(["univers"]);
  });
});
