import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  attribuer, creerChapitre, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inscrire, nettoyer, posteDe, sql,
  type Adulte, type ClasseEssai, type EleveEssai, type PosteEssai, type SceneEssai,
} from "./outils";

// Le poste d'un élève se reconnaît à son cookie : ici, celui du poste qu'on fait écrire
let jetonDuPoste: string | null = null;
vi.mock("@/serveur/poste", () => ({ empreinteDuPoste: async () => jetonDuPoste }));

import type { Bloc, Choix, ChoixAuto, ChoixPerso, Enregistrement, Liaison, Texte } from "@/domaine/copie";
import { avecDestination, avecLibelle, avecPhrase, avecUneDestinationDePlus } from "@/domaine/modifier-choix";
import { cacherChoix, lireChoix, modifierChoix, proposerLiaison, relierChoix, remettreChoix, remettreLiaison, retirerChoix, retirerLiaison } from "@/serveur/chemins";
import { enregistrerPourAdulte, enregistrerPourEleve } from "@/serveur/copie";

/**
 * Modifier un choix depuis « Chemins » (F03.1, F03-AC70 à AC75), contre la vraie base locale. La phrase
 * modifiée prend la place de celle qui porte son identité, dans le texte de sa scène ; c'est une
 * retouche du plan, rejouée comme les autres : celui qui écrit la scène n'est pas arrêté, et pour un
 * même choix la dernière retouche compte (F08-AC44).
 */

let laurent: Adulte;
let martin: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai;
let bilal: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
  classe = await creerClasse(laurent);
  [alice, bilal] = await inscrire(laurent, classe.id, ["Alice", "Bilal"]);
});
afterAll(nettoyer);

const p = (texte: string, id: string = randomUUID()): Bloc => ({ type: "p", id, children: [{ text: texte }] });
const choix = (libelle: string, cible: string | null): ChoixAuto => ({
  type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }],
});
/** Le texte en mots : chaque choix avec ses destinations, pour lire d'un coup l'ordre, les phrases et les liaisons. */
const mots = (t: Texte, noms: Record<string, string>): string[] =>
  t.map((b) => {
    const ou = (cible: string | null) => (cible ? noms[cible] : "sans destination");
    if (b.type === "choix" && b.auto) return `→ ${b.libelle} : ${ou(b.cible)}`;
    if (b.type === "choix") return `→ ${b.children.map((x) => ("text" in x ? x.text : x.type === "renvoi" ? `[${ou(x.cible)}]` : "")).join("")}`;
    if (b.type === "liaison") return `caché : ${ou(b.cible)}`;
    return b.type === "p" ? b.children.map((l) => ("text" in l ? l.text : "")).join("") : b.type;
  });

/** « L'orée de la forêt », où Alice (écriture et propositions) et Bilal (écriture et organisation) écrivent, et trois scènes du chapitre. */
async function recit(): Promise<{ chapitre: string; oree: SceneEssai; digue: SceneEssai; ponton: SceneEssai; tourbiere: SceneEssai; ailleurs: SceneEssai; noms: Record<string, string> }> {
  const projet = await creerProjet(laurent, "classe", "choix", "Les passeurs de brume", classe.id);
  const { partieId, chapitreId } = await creerPartie(laurent, projet.id, "La forêt", "Le marais");
  const oree = await creerScene(laurent.base, chapitreId);
  const digue = await creerScene(laurent.base, chapitreId);
  const ponton = await creerScene(laurent.base, chapitreId);
  const tourbiere = await creerScene(laurent.base, chapitreId);
  const ailleurs = await creerScene(laurent.base, await creerChapitre(laurent, partieId, "Le sanctuaire"));
  await attribuer(laurent, chapitreId, [{ eleve: alice.id }, { eleve: bilal.id, profil: "organisation" }]);
  return {
    chapitre: chapitreId, oree, digue, ponton, tourbiere, ailleurs,
    noms: { [digue.id]: "digue", [ponton.id]: "ponton", [tourbiere.id]: "tourbière", [ailleurs.id]: "ailleurs" },
  };
}

const ouvrir = async (poste: PosteEssai, scene: string): Promise<string> => {
  const { data, error } = await (await poste.base()).rpc("eleve_ouvrir_ecriture", { p_scene: scene });
  if (error || !data) throw new Error(`Écriture d'essai : ${error?.message}`);
  return data as string;
};
/** L'élève enregistre comme le fait sa page : par le serveur de l'application, contrôle des droits compris. */
const ecrire = async (poste: PosteEssai, ecriture: string, version: number, texte: Texte): Promise<Enregistrement> => {
  jetonDuPoste = poste.jetonHash;
  try {
    return await enregistrerPourEleve(ecriture, version, texte);
  } finally {
    jetonDuPoste = null;
  }
};
const enBase = async (scene: string) => (await sql<{ texte: Texte; version: number }>("select texte, version from scenes where id = $1", [scene]))[0];
const gardes = async (scene: string): Promise<number> =>
  Number((await sql<{ n: string }>("select count(*) as n from copies_recuperation where scene_id = $1", [scene]))[0].n);
const liensDe = (scene: string) =>
  sql<{ libelle: string; cible_id: string | null; cache: boolean }>("select libelle, cible_id, cache from liens where scene_id = $1 order by rang", [scene]);

describe("Modifier un choix depuis « Chemins » (F03.1)", () => {
  it("F03-AC70 — l'onglet d'un choix ouvre sa phrase, lue dans le texte de sa scène : la phrase automatique, la phrase écrite à la main par l'un de ses renvois, le lien caché", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const longer = choix("Longer la vieille digue", r.digue.id);
    const renvoi = randomUUID();
    const phrase: ChoixPerso = {
      type: "choix", id: randomUUID(), libelle: "Appeler à l'aide",
      children: [{ text: "Si tu appelles à l'aide, va au " }, { type: "renvoi", id: renvoi, cible: r.ponton.id, children: [{ text: "" }] }, { text: "." }],
    };
    const cache: Liaison = { type: "liaison", id: randomUUID(), cible: r.tourbiere.id, children: [{ text: "" }] };
    await enregistrerPourAdulte(e, r.oree.id, 0, [p("La barque s'enlise."), longer, phrase, cache]);

    // Avec la façon dont ce livre écrit une phrase de choix, que ses réglages recomposent
    expect(await lireChoix(e, r.oree.id, longer.id)).toEqual({ ok: true, bloc: longer, formule: "rends", constructions: ["neutre"] });
    expect(await lireChoix(e, r.oree.id, renvoi)).toMatchObject({ ok: true, bloc: phrase });
    expect(await lireChoix(e, r.oree.id, cache.id)).toMatchObject({ ok: true, bloc: cache });
    // Ni un choix qui n'est pas dans la scène, ni la scène d'un autre enseignant
    expect((await lireChoix(e, r.oree.id, randomUUID())).ok).toBe(false);
    expect((await lireChoix(enseignantDe(martin), r.oree.id, longer.id)).ok).toBe(false);
  });

  it("F03-AC72 — la phrase « Longer la vieille digue » remplacée par « Suivre la vieille digue jusqu'au bout » : elle est à la même place dans le texte, le reste intact, et le lien porte le nouveau libellé", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const [longer, appeler] = [choix("Longer la vieille digue", r.digue.id), choix("Appeler à l'aide", r.ponton.id)];
    await enregistrerPourAdulte(e, r.oree.id, 0, [p("La barque s'enlise."), longer, p("Entre deux choix."), appeler]);

    // Le libellé d'une phrase automatique : la phrase le reprend
    expect(await modifierChoix(e, r.oree.id, avecLibelle(longer, "Suivre la vieille digue jusqu'au bout"))).toMatchObject({ ok: true });
    expect(await enBase(r.oree.id)).toMatchObject({ version: 2 });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "→ Suivre la vieille digue jusqu'au bout : digue", "Entre deux choix.", "→ Appeler à l'aide : ponton",
    ]);
    expect((await liensDe(r.oree.id)).map((l) => l.libelle)).toEqual(["Suivre la vieille digue jusqu'au bout", "Appeler à l'aide"]);

    // La phrase écrite à la main : elle est « modifiée », avec son numéro à sa place
    const ecrite = avecPhrase(longer, ["Pour suivre la vieille digue jusqu'au bout, rends-toi au ", "."], "rends");
    expect(await modifierChoix(e, r.oree.id, ecrite)).toMatchObject({ ok: true });
    const lue = (await enBase(r.oree.id)).texte[1] as Choix;
    expect(lue.id).toBe(longer.id);
    expect(lue.auto).toBeUndefined();
    expect(mots((await enBase(r.oree.id)).texte, r.noms)[1]).toBe("→ Pour suivre la vieille digue jusqu'au bout, rends-toi au [digue].");
    expect((await liensDe(r.oree.id)).map((l) => l.cible_id)).toEqual([r.digue.id, r.ponton.id]);

    // La même phrase renvoyée ne change rien : pas de version de plus
    expect(await modifierChoix(e, r.oree.id, ecrite)).toMatchObject({ ok: true });
    expect((await enBase(r.oree.id)).version).toBe(3);
  });

  it("F03-AC73 — « Appeler à l'aide », qui menait au ponton, mène à la tourbière : sa place et sa phrase ne changent pas ; une destination de plus, une scène d'un autre chapitre", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const [longer, appeler] = [choix("Longer la vieille digue", r.digue.id), choix("Appeler à l'aide", r.ponton.id)];
    await enregistrerPourAdulte(e, r.oree.id, 0, [p("La barque s'enlise."), appeler, longer]);

    expect(await modifierChoix(e, r.oree.id, avecDestination(appeler, appeler.id, r.tourbiere.id))).toMatchObject({ ok: true });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual(["La barque s'enlise.", "→ Appeler à l'aide : tourbière", "→ Longer la vieille digue : digue"]);
    expect((await liensDe(r.oree.id)).map((l) => l.cible_id)).toEqual([r.tourbiere.id, r.digue.id]);

    // Une destination de plus, hors du chapitre : l'écran du choix est celui de la copie, sans version réduite (F03-AC71)
    const deux = avecUneDestinationDePlus(avecDestination(appeler, appeler.id, r.tourbiere.id), r.ailleurs.id, "rends");
    expect(await modifierChoix(e, r.oree.id, deux)).toMatchObject({ ok: true });
    expect((await liensDe(r.oree.id)).map((l) => l.cible_id)).toEqual([r.tourbiere.id, r.ailleurs.id, r.digue.id]);
    expect((await enBase(r.oree.id)).texte.map((b) => b.id)[1]).toBe(appeler.id);
  });

  it("F03-AC74 — supprimer le choix le retire du texte ; « Annuler » le rend à sa place, entre ses deux voisins, et non à la fin", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const [longer, appeler, plonger] = [choix("Longer la vieille digue", r.digue.id), choix("Appeler à l'aide", r.ponton.id), choix("Plonger", r.tourbiere.id)];
    await enregistrerPourAdulte(e, r.oree.id, 0, [p("La barque s'enlise."), longer, appeler, plonger]);

    const retire = await retirerChoix(e, r.oree.id, appeler.id, true);
    expect(retire).toMatchObject({ ok: true, bloc: appeler, place: { apres: longer.id, avant: plonger.id } });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual(["La barque s'enlise.", "→ Longer la vieille digue : digue", "→ Plonger : tourbière"]);
    if (!retire.ok) return;
    expect(await remettreChoix(e, r.oree.id, retire.bloc, retire.place)).toMatchObject({ ok: true });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "→ Longer la vieille digue : digue", "→ Appeler à l'aide : ponton", "→ Plonger : tourbière",
    ]);

    // Le premier choix de la scène revient en premier ; sans voisin connu, à la fin du récit
    const premier = await retirerChoix(e, r.oree.id, longer.id, true);
    if (!premier.ok) throw new Error("le choix n'a pas été retiré");
    await remettreChoix(e, r.oree.id, premier.bloc, premier.place);
    expect(mots((await enBase(r.oree.id)).texte, r.noms)[1]).toBe("→ Longer la vieille digue : digue");
    await retirerChoix(e, r.oree.id, longer.id, true);
    await remettreChoix(e, r.oree.id, premier.bloc);
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "→ Appeler à l'aide : ponton", "→ Plonger : tourbière", "→ Longer la vieille digue : digue",
    ]);

    // Une phrase à plusieurs destinations ne part pas depuis le panneau de la scène ; depuis l'écran du choix, elle part entière
    const deux = avecUneDestinationDePlus(appeler, r.digue.id, "rends");
    await modifierChoix(e, r.oree.id, deux);
    const [un] = (deux as ChoixPerso).children.filter((x) => "type" in x && x.type === "renvoi") as { id: string }[];
    expect((await retirerChoix(e, r.oree.id, un.id)).ok).toBe(false);
    expect((await retirerChoix(e, r.oree.id, appeler.id, true)).ok).toBe(true);
    expect((await liensDe(r.oree.id)).map((l) => l.cible_id)).toEqual([r.tourbiere.id, r.digue.id]);
  });

  it("F03-AC75, F08-AC44 — Alice écrit « L'orée de la forêt » pendant que Mme Laurent modifie la phrase et la destination d'un de ses choix : son enregistrement suivant réussit, son texte est entier, le choix modifié est à sa place et lui revient ; rien n'est gardé à part", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const debut = p("La barque s'enlise.");
    const [longer, appeler] = [choix("Longer la vieille digue", r.digue.id), choix("Appeler à l'aide", r.ponton.id)];
    await enregistrerPourAdulte(e, r.oree.id, 0, [debut, longer, appeler]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, r.oree.id);
    const copie: Texte = [debut, p("Alice écrit."), longer, appeler];
    expect(await ecrire(poste, ecriture, 1, copie)).toMatchObject({ etat: "enregistre", version: 2 });

    // Depuis « Chemins », sans ouvrir la scène : la phrase, puis la destination
    const suivre = avecLibelle(longer, "Suivre la vieille digue jusqu'au bout");
    const versLaTourbiere = avecDestination(suivre, longer.id, r.tourbiere.id);
    expect(await modifierChoix(e, r.oree.id, suivre)).toMatchObject({ ok: true });
    expect(await modifierChoix(e, r.oree.id, versLaTourbiere)).toMatchObject({ ok: true });
    expect((await enBase(r.oree.id)).version).toBe(4);

    // Alice n'a rien vu : sa copie porte encore l'ancienne phrase, et elle continue d'écrire. Pour son
    // profil, un choix est un bloc préparé : sans le soin pris pour elle, son texte serait refusé
    copie[1] = p("Alice écrit encore.", copie[1].id);
    const fait = await ecrire(poste, ecriture, 2, copie);
    expect(fait).toMatchObject({ etat: "enregistre", version: 5 });
    // La réponse lui donne la phrase posée, la dernière, pour que sa copie la montre, et nomme la scène
    expect(fait.etat === "enregistre" && fait.duPlan?.pose?.map((x) => x.bloc)).toEqual([versLaTourbiere]);
    expect(fait.etat === "enregistre" && fait.duPlan?.scenes?.map((s) => s.id)).toEqual([r.tourbiere.id]);
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Alice écrit encore.", "→ Suivre la vieille digue jusqu'au bout : tourbière", "→ Appeler à l'aide : ponton",
    ]);
    expect(await gardes(r.oree.id)).toBe(0);

    // Sa copie à jour, elle continue : plus rien ne lui revient
    const aJour: Texte = [debut, p("Alice écrit toujours.", copie[1].id), versLaTourbiere, appeler];
    const suite = await ecrire(poste, ecriture, 5, aJour);
    expect(suite).toMatchObject({ etat: "enregistre", version: 6 });
    expect(suite.etat === "enregistre" && suite.duPlan).toBeUndefined();
  });

  it("F03-AC75 — Bilal avait changé ce même choix dans sa copie : c'est la version de Mme Laurent qui reste, le reste de son texte est gardé, rien n'est mis à part", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const debut = p("La barque s'enlise.");
    const [longer, appeler] = [choix("Longer la vieille digue", r.digue.id), choix("Appeler à l'aide", r.ponton.id)];
    await enregistrerPourAdulte(e, r.oree.id, 0, [debut, longer, appeler]);
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    const ecriture = await ouvrir(poste, r.oree.id);
    const [sonTexte, dePlus] = [p("Bilal écrit."), p("Un paragraphe de plus.")];
    expect(await ecrire(poste, ecriture, 1, [debut, sonTexte, longer, appeler])).toMatchObject({ etat: "enregistre", version: 2 });

    // Mme Laurent écrit la phrase à la main, vers la tourbière
    const deLaurent = avecPhrase(avecDestination(longer, longer.id, r.tourbiere.id), ["Pour suivre la digue, cours au ", " !"], "rends");
    expect(await modifierChoix(e, r.oree.id, deLaurent)).toMatchObject({ ok: true });

    // Bilal, qui organise son chapitre, avait changé ce même choix, et ajouté un paragraphe et un choix à lui
    const deBilal = avecLibelle(longer, "Marcher sur la digue");
    const sien = choix("Rester dans la barque", r.ponton.id);
    const fait = await ecrire(poste, ecriture, 2, [debut, sonTexte, deBilal, dePlus, appeler, sien]);
    expect(fait).toMatchObject({ etat: "enregistre", version: 4 });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Bilal écrit.", "→ Pour suivre la digue, cours au [tourbière] !", "Un paragraphe de plus.", "→ Appeler à l'aide : ponton", "→ Rester dans la barque : ponton",
    ]);
    expect(fait.etat === "enregistre" && fait.duPlan?.pose?.map((x) => x.bloc.id)).toEqual([longer.id]);
    expect(await gardes(r.oree.id)).toBe(0);

    // Il avait supprimé le choix dans sa copie : la retouche de Mme Laurent l'y remet, à sa place
    const versLaDigue = avecDestination(deLaurent, (deLaurent as ChoixPerso).children.find((x) => "type" in x && x.type === "renvoi")!.id as string, r.digue.id);
    await modifierChoix(e, r.oree.id, versLaDigue);
    const sans = await ecrire(poste, ecriture, 4, [debut, p("Bilal écrit encore.", sonTexte.id), dePlus, appeler, sien]);
    expect(sans).toMatchObject({ etat: "enregistre", version: 6 });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Bilal écrit encore.", "→ Pour suivre la digue, cours au [digue] !", "Un paragraphe de plus.", "→ Appeler à l'aide : ponton", "→ Rester dans la barque : ponton",
    ]);
    expect(await gardes(r.oree.id)).toBe(0);
  });

  it("F03-AC75 — dans l'ordre des gestes : relié puis modifié, modifié puis relié, modifié puis supprimé, supprimé puis rendu par « Annuler » ; pour chaque choix le dernier geste compte, et un camarade qui a écrit entre-temps reste un conflit", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const debut = p("La barque s'enlise.");
    const [ecouter, compter, plonger] = [choix("Écouter", null), choix("Compter", null), choix("Plonger", r.ponton.id)];
    await enregistrerPourAdulte(e, r.oree.id, 0, [debut, ecouter, compter, plonger]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, r.oree.id);
    const copie: Texte = [debut, p("Alice écrit."), ecouter, compter, plonger];
    expect(await ecrire(poste, ecriture, 1, copie)).toMatchObject({ etat: "enregistre", version: 2 });

    // « Écouter » : relié à la digue, puis modifié vers la tourbière. « Compter » : sa phrase modifiée, puis relié au ponton
    await relierChoix(e, r.oree.id, ecouter.id, r.digue.id);
    await modifierChoix(e, r.oree.id, avecDestination(avecLibelle(ecouter, "Écouter les pierres"), ecouter.id, r.tourbiere.id));
    await modifierChoix(e, r.oree.id, avecLibelle(compter, "Compter les pierres"));
    await relierChoix(e, r.oree.id, compter.id, r.ponton.id);
    // « Plonger » : modifié, puis supprimé
    await modifierChoix(e, r.oree.id, avecLibelle(plonger, "Plonger dans l'eau noire"));
    const retire = await retirerChoix(e, r.oree.id, plonger.id, true);
    expect((await enBase(r.oree.id)).version).toBe(8);

    copie[1] = p("Alice écrit encore.", copie[1].id);
    const fait = await ecrire(poste, ecriture, 2, copie);
    expect(fait).toMatchObject({ etat: "enregistre", version: 9 });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Alice écrit encore.", "→ Écouter les pierres : tourbière", "→ Compter les pierres : ponton",
    ]);
    expect(await gardes(r.oree.id)).toBe(0);

    // « Annuler » rend « Plonger » : Alice, dont la copie ne l'a plus, le retrouve à sa place, après « Compter »
    if (!retire.ok) throw new Error("le choix n'a pas été retiré");
    await remettreChoix(e, r.oree.id, retire.bloc, retire.place);
    const aJour = (await enBase(r.oree.id)).texte.filter((b) => b.id !== plonger.id);
    aJour[1] = p("Alice écrit toujours.", copie[1].id);
    const rendu = await ecrire(poste, ecriture, 9, [...aJour, p("Une dernière ligne.")]);
    expect(rendu).toMatchObject({ etat: "enregistre", version: 11 });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Alice écrit toujours.", "→ Écouter les pierres : tourbière", "→ Compter les pierres : ponton", "→ Plonger dans l'eau noire : ponton", "Une dernière ligne.",
    ]);
    expect(await gardes(r.oree.id)).toBe(0);

    // Un camarade a écrit entre-temps, en plus d'une retouche du plan : c'est toujours un conflit
    const autre = await posteDe(classe.id, bilal.inscriptionId);
    const sienne = await ouvrir(autre, r.oree.id);
    const lu = (await enBase(r.oree.id)).texte;
    expect(await ecrire(autre, sienne, 11, [...lu, p("Bilal passe par là.")])).toMatchObject({ etat: "enregistre", version: 12 });
    await modifierChoix(e, r.oree.id, avecLibelle(compter, "Recompter"));
    expect(await ecrire(poste, ecriture, 11, [...lu, p("Alice n'a rien vu.")])).toMatchObject({ etat: "garde", motif: "conflit" });
    expect(await gardes(r.oree.id)).toBe(1);
  });

  it("F03-AC71 — « Cacher ce choix (énigme) » et l'onglet « Lien caché » : la phrase devient un lien caché, hors du récit, et « Annuler » la rend à sa place ; le lien caché redevient un choix, à la fin du texte ; celui qui écrit la scène n'est pas arrêté", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const debut = p("La barque s'enlise.");
    const [longer, appeler] = [choix("Longer la vieille digue", r.digue.id), choix("Appeler à l'aide", r.ponton.id)];
    const deja: Liaison = { type: "liaison", id: randomUUID(), cible: r.tourbiere.id, children: [{ text: "" }] };
    await enregistrerPourAdulte(e, r.oree.id, 0, [debut, longer, appeler, deja]);
    const poste = await posteDe(classe.id, alice.inscriptionId);
    const ecriture = await ouvrir(poste, r.oree.id);
    const copie: Texte = [debut, p("Alice écrit."), longer, appeler, deja];
    expect(await ecrire(poste, ecriture, 1, copie)).toMatchObject({ etat: "enregistre", version: 2 });

    const cache = await cacherChoix(e, r.oree.id, longer.id);
    expect(cache).toMatchObject({ ok: true, bloc: longer, place: { apres: copie[1].id, avant: appeler.id } });
    if (!cache.ok) return;
    // Le nouveau lien caché va tout à la fin, après celui qui y était, et garde le libellé du choix
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual(["La barque s'enlise.", "Alice écrit.", "→ Appeler à l'aide : ponton", "caché : tourbière", "caché : digue"]);
    expect(cache.liaison).toMatchObject({ cible: r.digue.id, libelle: "Longer la vieille digue" });
    expect((await liensDe(r.oree.id)).map((l) => [l.cible_id, l.cache])).toEqual([[r.ponton.id, false], [r.tourbiere.id, true], [r.digue.id, true]]);

    // Alice, qui n'a rien vu, continue : le choix quitte sa copie, le lien caché y entre ; pour son profil, l'un et l'autre sont réservés
    copie[1] = p("Alice écrit encore.", copie[1].id);
    const fait = await ecrire(poste, ecriture, 2, copie);
    expect(fait).toMatchObject({ etat: "enregistre", version: 4 });
    expect(fait.etat === "enregistre" && fait.duPlan).toMatchObject({ ajoute: [cache.liaison], retire: [longer.id] });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual(["La barque s'enlise.", "Alice écrit encore.", "→ Appeler à l'aide : ponton", "caché : tourbière", "caché : digue"]);
    expect(await gardes(r.oree.id)).toBe(0);

    // « Annuler » : le lien caché part, la phrase revient à sa place
    expect(await remettreChoix(e, r.oree.id, cache.bloc, cache.place, [cache.liaison.id])).toMatchObject({ ok: true });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Alice écrit encore.", "→ Longer la vieille digue : digue", "→ Appeler à l'aide : ponton", "caché : tourbière",
    ]);

    // L'onglet « Lien caché » : « Proposer comme choix » en fait une phrase, à la fin du texte ; « Annuler » rend le lien
    const propose = await proposerLiaison(e, r.oree.id, deja.id, "Déchiffrer les symboles");
    expect(propose).toMatchObject({ ok: true, liaison: deja });
    if (!propose.ok) return;
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Alice écrit encore.", "→ Longer la vieille digue : digue", "→ Appeler à l'aide : ponton", "→ Déchiffrer les symboles : tourbière",
    ]);
    expect(await remettreLiaison(e, r.oree.id, propose.liaison, [propose.choix.id])).toMatchObject({ ok: true });
    // « Retirer ce lien caché », puis « Annuler »
    const retire = await retirerLiaison(e, r.oree.id, deja.id);
    expect(retire).toMatchObject({ ok: true, liaison: deja });
    expect((await liensDe(r.oree.id)).map((l) => l.cache)).toEqual([false, false]);
    expect(await remettreLiaison(e, r.oree.id, deja)).toMatchObject({ ok: true });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Alice écrit encore.", "→ Longer la vieille digue : digue", "→ Appeler à l'aide : ponton", "caché : tourbière",
    ]);

    // Alice, restée à la version 4, reprend tout cela sans être arrêtée
    const suite: Texte = [debut, p("Alice écrit toujours.", copie[1].id), appeler, deja, cache.liaison];
    const apres = await ecrire(poste, ecriture, 4, suite);
    expect(apres.etat).toBe("enregistre");
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual([
      "La barque s'enlise.", "Alice écrit toujours.", "→ Longer la vieille digue : digue", "→ Appeler à l'aide : ponton", "caché : tourbière",
    ]);
    expect(await gardes(r.oree.id)).toBe(0);
  });

  it("F03-AC76, F03-AC57 — réservé à l'adulte du projet : ni un élève, ni un autre enseignant ; et un choix qui n'est plus dans la scène ne se modifie pas", async () => {
    const r = await recit();
    const e = enseignantDe(laurent);
    const longer = choix("Longer la vieille digue", r.digue.id);
    await enregistrerPourAdulte(e, r.oree.id, 0, [p("La barque s'enlise."), longer]);
    const modifie = avecLibelle(longer, "Suivre la digue");

    expect((await modifierChoix(enseignantDe(martin), r.oree.id, modifie)).ok).toBe(false);
    const poste = await posteDe(classe.id, bilal.inscriptionId);
    const { error } = await (await poste.base()).rpc("retoucher_depuis_le_plan", { p_scene: r.oree.id, p_pose: [{ bloc: modifie, apres: null, avant: null }] });
    expect(error).not.toBeNull();
    // Un choix qui n'est plus dans la scène : rien ne se crée à sa place
    expect((await modifierChoix(e, r.oree.id, avecLibelle(choix("Un autre", r.digue.id), "Un autre, modifié"))).ok).toBe(false);
    // Un paragraphe de récit ne se remplace pas par là
    const recit0 = (await enBase(r.oree.id)).texte[0];
    expect((await modifierChoix(e, r.oree.id, { ...modifie, id: recit0.id })).ok).toBe(false);
    expect(await enBase(r.oree.id)).toMatchObject({ version: 1 });
    expect(mots((await enBase(r.oree.id)).texte, r.noms)).toEqual(["La barque s'enlise.", "→ Longer la vieille digue : digue"]);
  });
});
