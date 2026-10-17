import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { demanderDesTitres, demanderUneConsigne, RIEN_POUR_UN_TITRE, SANS_INDICATION } from "@/serveur/aides-de-la-scene";
import { consigne } from "@/serveur/ia/aides/consigne";
import { titre } from "@/serveur/ia/aides/titre";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, sql,
  type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * Étape 8, lot 3 : l'aide à la consigne (F13.2) et le ✦ du titre de scène (F05), contre la
 * vraie base locale, le fournisseur simulé (IA_SIMULEE). Le serveur relit lui-même ce qui
 * part ; une proposition ne change rien à la scène.
 */

let laurent: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  classe = await creerClasse(laurent);
  [alice] = await inscrire(laurent, classe.id, ["Alice"]);
});
afterAll(nettoyer);
afterEach(async () => {
  vi.restoreAllMocks();
  await sql("delete from public.appels_ia where enseignant_id = $1", [laurent.id]);
});

const ligne = async (id: string) =>
  (await sql("select titre, consigne, etat, version, texte, prise_par_eleve from public.scenes where id = $1", [id]))[0];
/** Ce que l'aide a envoyé au fournisseur, recomposé d'après ce qu'elle a reçu */
const envoye = <E,>(def: { systeme: (e: E) => string; message: (e: E) => string }, espion: { mock: { calls: unknown[][] } }) =>
  espion.mock.calls.map(([e]) => `${def.systeme(e as E)}\n${def.message(e as E)}`).join("\n");

/**
 * « La lisière » : S015 (la scène où l'on travaille, dont Alice s'occupe), entre « Le gué » et
 * « La souche », avec une remarque d'élève dans une note ; un choix vers « La souche ».
 */
async function lisiere(organisation: "classe" | "personnel" = "classe") {
  const projet = await creerProjet(laurent, organisation, "choix", "Les passeurs de brume", organisation === "classe" ? classe.id : null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "La lisière");
  await laurent.base.from("chapitres").update({ resume: "Lou traverse la lisière et rencontre le passeur." }).eq("id", chapitreId);
  if (organisation === "classe") await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
  const gue = await creerScene(laurent.base, chapitreId);
  const ici = await creerScene(laurent.base, chapitreId);
  const souche = await creerScene(laurent.base, chapitreId);
  await laurent.base.from("scenes").update({ titre: "Gué — les pierres qui chantent", consigne: "Lou traverse le gué sur les pierres." }).eq("id", gue.id);
  await laurent.base.from("scenes").update({ titre: "Souche — la lanterne de secours" }).eq("id", souche.id);
  await laurent.base.from("scenes").update({ titre: "Le pont", consigne: "le passeur apparaît sur le pont" }).eq("id", ici.id);
  if (organisation === "classe") await laurent.base.from("scenes").update({ prise_par_eleve: alice.id }).eq("id", ici.id);
  return { projet: projet.id, chapitreId, ici: ici.id, souche: souche.id };
}

async function ecrire(sceneId: string, texte: unknown[]) {
  const version = (await ligne(sceneId)).version as number;
  const { data, error } = await laurent.base.rpc("enregistrer_texte", { p_scene: sceneId, p_version: version, p_texte: texte });
  if (error || (data as { etat: string }).etat !== "enregistre") throw new Error(`Texte d'essai : ${error?.message ?? JSON.stringify(data)}`);
}

describe("Formuler une consigne (F13.2)", () => {
  it("F13-AC06 — d'après l'indication enregistrée, une consigne pour les élèves et une courte liste de points", async () => {
    const { ici } = await lisiere();
    const simuler = vi.spyOn(consigne, "simuler");
    const r = await demanderUneConsigne(enseignantDe(laurent), ici);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.consigne).toBe("Le passeur apparaît sur le pont. Raconte ce qui se passe.\nDécris :\n– le lieu ;\n– ce que ressent ton héros.");
    // L'indication, le chapitre et les scènes voisines partent ; ni l'élève, ni l'adulte, ni la classe (F13)
    const parti = envoye(consigne, simuler);
    for (const present of ["le passeur apparaît sur le pont", "rencontre le passeur", "Gué — les pierres qui chantent", "Lou traverse le gué", "Souche — la lanterne de secours"]) {
      expect(parti).toContain(present);
    }
    for (const absent of ["Alice", "Laurent", "CM1-CM2"]) expect(parti).not.toContain(absent);
  });

  it("F13-AC18 — la proposition suit le modèle : une ou deux phrases, « Décris : », deux ou trois points", async () => {
    const { ici } = await lisiere();
    const r = await demanderUneConsigne(enseignantDe(laurent), ici);
    if (!r.ok) throw new Error(r.message);
    const [phrases, decris, ...points] = r.consigne.split("\n");
    expect(phrases.split(/(?<=[.!?])\s/).length).toBeLessThanOrEqual(2);
    expect(decris).toBe("Décris :");
    expect(points.length).toBeGreaterThanOrEqual(2);
    expect(points.length).toBeLessThanOrEqual(3);
    expect(points.every((p) => p.startsWith("– "))).toBe(true);
  });

  it("F13-AC07 — une génération seule ne change ni la consigne ni le texte de la scène", async () => {
    const { ici } = await lisiere();
    await ecrire(ici, [{ type: "p", id: randomUUID(), children: [{ text: "Une silhouette avance sur le pont." }] }]);
    const avant = await ligne(ici);
    const r = await demanderUneConsigne(enseignantDe(laurent), ici);
    expect(r.ok).toBe(true);
    expect(await ligne(ici)).toEqual(avant);
  });

  it("en mode personnel, une note d'intention pour soi, sans « Décris : »", async () => {
    const { ici } = await lisiere("personnel");
    const simuler = vi.spyOn(consigne, "simuler");
    const r = await demanderUneConsigne(enseignantDe(laurent), ici);
    expect(r).toEqual({ ok: true, consigne: "le passeur apparaît sur le pont ; à faire sentir : le lieu, l'émotion.", reste: null });
    expect(envoye(consigne, simuler)).toContain("note d'intention");
  });

  it("sans indication, rien ne part", async () => {
    const { ici } = await lisiere();
    await laurent.base.from("scenes").update({ consigne: "  " }).eq("id", ici);
    const simuler = vi.spyOn(consigne, "simuler");
    expect(await demanderUneConsigne(enseignantDe(laurent), ici)).toEqual({ ok: false, message: SANS_INDICATION });
    expect(simuler).not.toHaveBeenCalled();
  });

  it("les aides éteintes ne demandent rien ; une réponse inutilisable ne change rien", async () => {
    const { ici } = await lisiere();
    const e = enseignantDe(laurent);
    expect((await demanderUneConsigne({ ...e, reglagesIa: { ...e.reglagesIa, proposer: false } }, ici)).ok).toBe(false);
    vi.spyOn(consigne, "simuler").mockReturnValue({ phrases: "Raconte.", points: ["un seul point"] });
    const avant = await ligne(ici);
    expect(await demanderUneConsigne(e, ici)).toEqual({ ok: false, message: MESSAGES_IA.pasDeReponse });
    expect(await ligne(ici)).toEqual(avant);
  });
});

describe("Le ✦ du titre de scène (F05)", () => {
  it("trois titres en une demande, d'après la consigne et le début du texte ; les autres titres du chapitre partent pour la forme", async () => {
    const { ici } = await lisiere();
    await ecrire(ici, [
      { type: "p", id: randomUUID(), children: [{ text: "Une silhouette avance sur le pont, une lanterne à la main." }] },
      { type: "note", id: randomUUID(), children: [{ text: "Alice : penser au passeur." }] },
    ]);
    const simuler = vi.spyOn(titre, "simuler");
    const r = await demanderDesTitres(enseignantDe(laurent), ici);
    expect(r).toEqual({ ok: true, titres: ["Le pont de brume", "La lanterne qui tremble", "Rencontre sur le pont"], reste: null });
    const parti = envoye(titre, simuler);
    for (const present of ["le passeur apparaît sur le pont", "Une silhouette avance sur le pont", "Gué — les pierres qui chantent", "Le pont"]) expect(parti).toContain(present);
    // La note de l'enseignant ne part pas, ni le prénom de l'élève
    for (const absent of ["Alice", "Laurent", "penser au passeur"]) expect(parti).not.toContain(absent);
  });

  it("F05-AC04 — demander des titres, puis les laisser, ne change ni le titre, ni le texte, ni les relations du récit", async () => {
    const { ici, souche } = await lisiere();
    await ecrire(ici, [
      { type: "p", id: randomUUID(), children: [{ text: "Une silhouette avance sur le pont." }] },
      { type: "choix", id: randomUUID(), auto: true, libelle: "Suivre la lanterne", construction: "neutre", cible: souche, children: [{ text: "" }] },
    ]);
    const avant = await ligne(ici);
    const liens = async () => sql("select scene_id, cible_id, libelle from public.liens where scene_id = $1 order by rang", [ici]);
    const liensAvant = await liens();
    expect(liensAvant).toHaveLength(1);
    const r = await demanderDesTitres(enseignantDe(laurent), ici);
    expect(r.ok).toBe(true);
    expect(await ligne(ici)).toEqual(avant);
    expect(await liens()).toEqual(liensAvant);
  });

  it("un titre déjà pris dans le chapitre n'est pas reproposé", async () => {
    const { ici, souche } = await lisiere();
    await laurent.base.from("scenes").update({ titre: "Le pont de brume" }).eq("id", souche);
    const r = await demanderDesTitres(enseignantDe(laurent), ici);
    expect(r.ok && r.titres).toEqual(["La lanterne qui tremble", "Rencontre sur le pont"]);
  });

  it("sans consigne ni texte, rien ne part", async () => {
    const { ici } = await lisiere();
    await laurent.base.from("scenes").update({ consigne: "" }).eq("id", ici);
    const simuler = vi.spyOn(titre, "simuler");
    expect(await demanderDesTitres(enseignantDe(laurent), ici)).toEqual({ ok: false, message: RIEN_POUR_UN_TITRE });
    expect(simuler).not.toHaveBeenCalled();
  });

  it("chaque demande se note au journal, sans son contenu", async () => {
    const { ici } = await lisiere();
    await demanderDesTitres(enseignantDe(laurent), ici);
    await demanderUneConsigne(enseignantDe(laurent), ici);
    const lignes = await sql<{ aide: string }>("select aide from public.appels_ia where enseignant_id = $1 order by commence_le", [laurent.id]);
    expect(lignes.map((l) => l.aide)).toEqual(["titre", "consigne"]);
  });
});
