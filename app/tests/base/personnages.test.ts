import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PLAFONDS, REGLAGES_IA_HABITUELS, type ReglagesIa } from "@/domaine/aides-ia";
import { ficheVisuelle, personnages as aidePersonnages } from "@/serveur/ia/aides/images";
import { demanderDesImages } from "@/serveur/ia/demander";
import { SEAU } from "@/serveur/images";
import { cheminProposition, creerLesReferences, jeterLesPropositions, preciserLaFiche, repererLesPersonnages } from "@/serveur/personnages";
import { entreeDeLEtape } from "@/serveur/preparation-ia";
import { questions as aideQuestions } from "@/serveur/ia/aides/preparation";
import { preparationDe } from "@/serveur/recit";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, lire, nettoyer, posteDe, service, sql, type Adulte,
  type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * Étape 8, lot 7 : personnages et objets de l'histoire (F10.2), contre la vraie base locale et le
 * fournisseur simulé (IA_SIMULEE) : aucune image n'est vraiment créée, aucune dépense. Le serveur
 * relit la Préparation et la carte ; les cartes ne regardent que l'adulte ; le poste d'un élève ne
 * reçoit que les noms, pour `/personnage`.
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

const RETENU = "Lou, 10 ans, fils du dernier passeur. Son père, Maël, a disparu dans la brume. Une chouette, Brindille, le guide la nuit.";

async function passeurs() {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  await laurent.base.from("preparations").update({ univers: "Un pays de lacs noyé dans la brume.", personnages: RETENU }).eq("projet_id", projet.id);
  return projet.id;
}
const carte = async (projet: string, valeurs: Record<string, unknown>) => {
  const { data, error } = await laurent.base.from("personnages").insert({ projet_id: projet, enseignant_id: laurent.id, ...valeurs }).select("id").single();
  if (error || !data) throw new Error(error?.message);
  return data.id as string;
};
const avecReglages = (reglages: Partial<ReglagesIa>) => ({ ...enseignantDe(laurent), reglagesIa: { ...REGLAGES_IA_HABITUELS, ...reglages } });
const appels = () =>
  sql<{ aide: string; sorte: string; nombre: number; issue: string }>("select aide, sorte, nombre, issue from public.appels_ia where enseignant_id = $1 order by commence_le", [laurent.id]);
const propositionsEnStockage = async (projet: string) =>
  ((await service().storage.from(SEAU).list(`${laurent.id}/${projet}/propositions`)).data ?? []).map((f) => f.name);

describe("Les cartes des personnages (F10.2)", () => {
  it("F10-AC38 — « Repérer les personnages » propose des cartes d'après le texte retenu, sans rien créer ; une carte déjà là, sous un autre nom, n'est pas reproposée", async () => {
    const projet = await passeurs();
    await carte(projet, { nom: "Maël le passeur", autres_noms: ["Maël"] });
    const simuler = vi.spyOn(aidePersonnages, "simuler");
    const r = await repererLesPersonnages(enseignantDe(laurent), projet);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.personnages.map((p) => p.nom)).toEqual(["Lou", "Brindille"]);
    expect(r.personnages.find((p) => p.nom === "Lou")?.heros).toBe(true);
    // Rien n'est créé par la demande
    expect((await sql("select nom from public.personnages where projet_id = $1", [projet])).map((p) => p.nom)).toEqual(["Maël le passeur"]);
    // Ce qui part : la Préparation et les cartes existantes ; jamais un élève ni l'adulte
    const parti = simuler.mock.calls.map(([e]) => `${aidePersonnages.systeme(e)}\n${aidePersonnages.message(e)}`).join("\n");
    expect(parti).toContain(RETENU);
    expect(parti).toContain("Maël le passeur, Maël");
    for (const absent of ["Alice", "Laurent", "CM1-CM2"]) expect(parti).not.toContain(absent);
    expect((await appels()).map((a) => a.aide)).toEqual(["personnages"]);
  });

  it("sans texte retenu ni idée retenue, rien ne part, et la page dit quoi faire", async () => {
    const projet = (await creerProjet(laurent, "classe", "choix", "Vide", classe.id)).id;
    const r = await repererLesPersonnages(enseignantDe(laurent), projet);
    expect(r).toEqual({ ok: false, message: "Écrivez d’abord dans « Nous retenons » d’un héros qui il croise, ou retenez des idées." });
    expect(await appels()).toEqual([]);
  });

  it("F10-AC39 — plusieurs héros : la Préparation les rend tous, et les aides reçoivent leur liste et leurs compétences", async () => {
    const projet = await passeurs();
    await carte(projet, { nom: "Lou", heros: true, description: "Il connaît le chant des lanternes.", rang: 0 });
    await carte(projet, { nom: "Mina", heros: true, description: "Elle sait nager.", rang: 1 });
    await carte(projet, { nom: "Maël", autres_noms: ["le passeur"], rang: 2 });
    const preparation = await preparationDe(enseignantDe(laurent), projet);
    expect(preparation?.personnagesDeLHistoire.filter((p) => p.heros).map((p) => p.nom)).toEqual(["Lou", "Mina"]);
    // Une aide qui reçoit le carnet : les idées de choix, les consignes, la Préparation, le plan
    const { carnetDe, blocCarnet } = await import("@/serveur/ia/aides/contexte");
    const bloc = blocCarnet(carnetDe(preparation!));
    expect(bloc).toContain("Lou (héros) : Il connaît le chant des lanternes.");
    expect(bloc).toContain("Mina (héros) : Elle sait nager.");
    expect(bloc).toContain("Maël (aussi : le passeur)");
    expect(bloc).toContain("Le lecteur choisit son héros au début du livre parmi : Lou, Mina.");
  });

  it("les cartes ne regardent que l'adulte : un autre adulte et le poste d'un élève ne les lisent pas ; le poste reçoit les noms seuls pour `/personnage`", async () => {
    const projet = await passeurs();
    await carte(projet, { nom: "Maël", autres_noms: ["le passeur"], description: "Le père de Lou.", fiche: "Grand, barbe grise." });
    expect((await martin.base.from("personnages").select("id").eq("projet_id", projet)).data).toEqual([]);
    expect((await martin.base.from("personnages").insert({ projet_id: projet, enseignant_id: martin.id, nom: "Intrus" })).error).not.toBeNull();
    const { partieId, chapitreId } = await creerPartie(laurent, projet, "La forêt", "La lisière");
    void partieId;
    const scene = await creerScene(laurent.base, chapitreId);
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const base = await poste.base();
    expect((await lire(base, "personnages")).lignes).toEqual([]);
    const { data } = await base.rpc("jeu_de_la_scene", { p_scene: scene.id });
    expect((data as { personnages: unknown }).personnages).toEqual([{ id: expect.any(String), nom: "Maël", autres_noms: ["le passeur"] }]);
    expect(JSON.stringify(data)).not.toContain("Grand, barbe grise");
  });
});

describe("Un onglet par héros (F10.2, 18 octobre 2026)", () => {
  it("F10-AC46 — les aides de l'onglet d'un héros ne lisent que ses questions, ses idées et son texte retenu ; les autres héros partent en cartes", async () => {
    const projet = await passeurs();
    const lou = await carte(projet, { nom: "Lou", heros: true, rang: 0, description: "Lou, dix ans, a peur de l’eau." });
    const mina = await carte(projet, { nom: "Mina", heros: true, rang: 1, description: "Mina, onze ans, sait nager." });
    await laurent.base.from("questions").insert([
      { projet_id: projet, enseignant_id: laurent.id, etape: "personnages", texte: "A-t-il un animal ?", personnage_id: lou },
      { projet_id: projet, enseignant_id: laurent.id, etape: "personnages", texte: "Pourquoi suit-elle Lou ?", personnage_id: mina },
    ]);
    await laurent.base.from("pistes").insert({ projet_id: projet, enseignant_id: laurent.id, rubrique: "personnages", texte: "Elle a un sifflet", personnage_id: mina });
    const entree = await entreeDeLEtape(enseignantDe(laurent), projet, "personnages", mina);
    expect(entree?.retenu).toBe("Mina, onze ans, sait nager.");
    expect(entree?.heros).toBe("Mina");
    expect(entree?.questions).toContain("Pourquoi suit-elle Lou ?");
    expect(entree?.questions).not.toContain("A-t-il un animal ?");
    expect(entree?.idees.map((i) => i.texte)).toEqual(["Elle a un sifflet"]);
    const message = aideQuestions.message(entree!);
    expect(message).toContain("Cette page parle de Mina");
    expect(message).toContain("Lou (héros) : Lou, dix ans, a peur de l’eau.");
    expect(message).not.toContain("Mina (héros)");
  });

  it("une question ou une idée ne se rattache qu'à un personnage de son projet", async () => {
    const projet = await passeurs();
    const autre = await passeurs();
    const lou = await carte(autre, { nom: "Lou", heros: true });
    const { error } = await laurent.base.from("pistes").insert({ projet_id: projet, enseignant_id: laurent.id, rubrique: "personnages", texte: "x", personnage_id: lou });
    expect(error).not.toBeNull();
  });
});

describe("Fiche visuelle et images de référence (F10.2)", () => {
  it("F10-AC40 — « Préciser pour les images » rend une fiche proposée, sans rien changer à la carte", async () => {
    const projet = await passeurs();
    const lou = await carte(projet, { nom: "Lou", heros: true, description: "Fils du passeur, dix ans." });
    const simuler = vi.spyOn(ficheVisuelle, "simuler");
    const r = await preciserLaFiche(enseignantDe(laurent), "personnage", lou);
    expect(r.ok && r.fiche.length > 20).toBe(true);
    expect((await sql("select fiche from public.personnages where id = $1", [lou]))[0].fiche).toBe("");
    // Ce qui part : la carte, l'univers, ce que la Préparation retient des personnages
    const parti = simuler.mock.calls.map(([e]) => `${ficheVisuelle.systeme(e)}\n${ficheVisuelle.message(e)}`).join("\n");
    for (const present of ["Lou : Fils du passeur, dix ans.", "Un pays de lacs noyé dans la brume.", RETENU]) expect(parti).toContain(present);
    for (const absent of ["Alice", "Laurent"]) expect(parti).not.toContain(absent);
  });

  it("une carte sans description ni fiche ne part pas ; sans fiche visuelle, aucun portrait ne se crée", async () => {
    const projet = await passeurs();
    const sans = await carte(projet, { nom: "Brindille" });
    expect(await preciserLaFiche(enseignantDe(laurent), "personnage", sans)).toEqual({ ok: false, message: "Décrivez d’abord le personnage en quelques mots." });
    const decrite = await carte(projet, { nom: "Maël", description: "Le père de Lou." });
    expect(await creerLesReferences(enseignantDe(laurent), "personnage", decrite)).toEqual({ ok: false, message: "Décrivez d’abord son apparence." });
    expect(await appels()).toEqual([]);
  });

  it("F10-AC41 — « Créer son portrait », deux par création : deux images attendent dans le stockage, comptées deux au journal ; les écartées s'effacent", async () => {
    const projet = await passeurs();
    const lou = await carte(projet, { nom: "Lou", heros: true, description: "Fils du passeur.", fiche: "Ciré jaune, bottes vertes." });
    const r = await creerLesReferences(avecReglages({ imagesParCreation: 2 }), "personnage", lou);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.propositions).toHaveLength(2);
    expect((await propositionsEnStockage(projet)).sort()).toEqual(r.propositions.map((p) => `${p}.jpg`).sort());
    expect(await appels()).toEqual([{ aide: "portrait", sorte: "image", nombre: 2, issue: "reussi" }]);
    // Le portrait n'est posé que quand l'adulte en garde un : la carte n'a encore rien
    expect((await sql("select portrait_id from public.personnages where id = $1", [lou]))[0].portrait_id).toBeNull();
    await jeterLesPropositions(enseignantDe(laurent), projet, r.propositions);
    expect(await propositionsEnStockage(projet)).toEqual([]);
  });

  it("F10-AC42 — un objet de l'histoire reçoit de même une image de référence, une seule par défaut", async () => {
    const projet = await passeurs();
    const { data } = await laurent.base.from("objets").insert({ projet_id: projet, enseignant_id: laurent.id, nom: "la lanterne de cuivre", description: "Celle du père.", fiche: "Cuivre patiné, verre bleuté." }).select("id").single();
    const r = await creerLesReferences(enseignantDe(laurent), "objet", data!.id);
    expect(r.ok && r.propositions.length).toBe(1);
    expect(await appels()).toEqual([{ aide: "image-objet", sorte: "image", nombre: 1, issue: "reussi" }]);
    // Une image d'un autre projet ne se pose pas : la base la refuse
    const autre = await creerProjet(laurent, "personnel", "classique", "Autre");
    const { data: image } = await service().from("images").insert({
      projet_id: autre.id, enseignant_id: laurent.id, chemin: `${laurent.id}/${autre.id}/x.jpg`, chemin_vignette: `${laurent.id}/${autre.id}/x-v.jpg`, largeur: 10, hauteur: 10,
    }).select("id").single();
    expect((await laurent.base.from("objets").update({ image_id: image!.id }).eq("id", data!.id)).error).not.toBeNull();
    if (r.ok) await jeterLesPropositions(enseignantDe(laurent), projet, r.propositions);
  });

  it("une proposition d'un autre adulte ne se nomme pas : le chemin se compose avec l'identité de qui demande", () => {
    expect(cheminProposition(laurent.id, "p", "i")).toBe(`${laurent.id}/p/propositions/i.jpg`);
  });

  it("F10-AC37 — qualité automatique : le portrait en qualité normale, la pleine page en haute ; « Normale » impose la normale", async () => {
    const demande = { aide: "image-scene" as const, prompt: "Un quai dans la brume.", nombre: 1 as const };
    const portrait = await demanderDesImages(enseignantDe(laurent), { ...demande, aide: "portrait", usage: "portrait" });
    const pleine = await demanderDesImages(enseignantDe(laurent), { ...demande, usage: "pleine-page" });
    const troisDeux = await demanderDesImages(enseignantDe(laurent), { ...demande, usage: "3:2" });
    const normale = await demanderDesImages(avecReglages({ qualite: "normale" }), { ...demande, usage: "pleine-page" });
    expect([portrait, pleine, troisDeux, normale].map((r) => r.ok && r.qualite)).toEqual(["normale", "haute", "normale", "normale"]);
  });

  it("plafond des images : vingt par jour, chaque image d'une création compte ; aides éteintes, rien ne part", async () => {
    await sql(
      "insert into public.appels_ia (enseignant_id, aide, sorte, nombre, termine_le, issue, fournisseur, modele, cout_usd) select $1, 'portrait', 'image', 1, now(), 'reussi', 'simule', 'x', 0 from generate_series(1, $2)",
      [laurent.id, PLAFONDS.imagesParJour - 1],
    );
    const deux = await demanderDesImages(avecReglages({ imagesParCreation: 2 }), { aide: "portrait", usage: "portrait", prompt: "Lou." });
    expect(deux).toEqual({ ok: false, refus: "jour", message: "Les aides reviennent demain. Tout le reste fonctionne." });
    const une = await demanderDesImages(enseignantDe(laurent), { aide: "portrait", usage: "portrait", prompt: "Lou." });
    expect(une.ok && une.reste).toBe(null);
    const eteint = await demanderDesImages(avecReglages({ proposer: false }), { aide: "portrait", usage: "portrait", prompt: "Lou." });
    expect(eteint.ok).toBe(false);
  });

  it("une création qui échoue ne garde rien et le dit : « L'image n'a pas pu être créée. Rien n'a changé. »", async () => {
    const projet = await passeurs();
    const lou = await carte(projet, { nom: "Lou", description: "Fils du passeur.", fiche: "Ciré jaune." });
    vi.stubEnv("IA_SIMULEE", "echec");
    try {
      expect(await creerLesReferences(enseignantDe(laurent), "personnage", lou)).toEqual({ ok: false, message: "L'image n'a pas pu être créée. Rien n'a changé." });
    } finally {
      vi.unstubAllEnvs();
    }
    expect(await propositionsEnStockage(projet)).toEqual([]);
    expect((await appels()).map((a) => a.issue)).toEqual(["echec"]);
  });
});

describe("Les options du projet pour les images (F10.2)", () => {
  it("F10-AC12 — un nouveau projet a le héros absent des images, et le style de l'application ; l'adulte les change", async () => {
    const projet = await creerProjet(laurent);
    expect((await sql("select style_images, style_autre, heros_absent from public.projets where id = $1", [projet.id]))[0]).toEqual({ style_images: "lumineuse", style_autre: "", heros_absent: true });
    expect((await laurent.base.from("projets").update({ style_images: "autre", style_autre: "linogravure", heros_absent: false }).eq("id", projet.id)).error).toBeNull();
    expect((await laurent.base.from("projets").update({ style_images: "pixel" }).eq("id", projet.id)).error).not.toBeNull();
  });
});
