import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { aTraiter } from "@/domaine/controles";
import { avertissementsAcceptes, empreinteDe, etatChemins } from "@/domaine/livre";
import { etatDuLivre } from "@/serveur/controles";
import {
  attribuer, creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inconnu, inscrire, lire, nettoyer, posteDe, sql, type Adulte,
} from "./outils";

/**
 * Étape 5 du plan, lot 2 : ce que la base tient de « Vérifier les chemins » (F11.6) — le
 * journal des changements de chemins, les avertissements acceptés, la déclaration — contre la
 * vraie base locale.
 */

let laurent: Adulte;
let martin: Adulte;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
});
afterAll(nettoyer);

const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string | null, id = randomUUID()) => ({ type: "choix", id, auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });
const enseignant = enseignantDe;

async function ecrire(scene: string, texte: unknown[]): Promise<void> {
  const { data } = await laurent.base.from("scenes").select("version").eq("id", scene).single();
  const { error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: data!.version, p_texte: texte });
  if (error) throw new Error(error.message);
}

/** Un départ qui mène à une fin, et S043, une fin où rien ne mène. Toutes prêtes. */
async function livre() {
  const projet = await creerProjet(laurent, "personnel", "choix", "Le phare", null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La côte", "La plage");
  const [depart, fin, s043] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  await laurent.base.from("projets").update({ depart_scene_id: depart.id }).eq("id", projet.id);
  const versFin = choix("Aller au phare", fin.id);
  await ecrire(depart.id, [paragraphe("La plage au matin."), versFin]);
  await ecrire(fin.id, [paragraphe("La lanterne s’allume.")]);
  await ecrire(s043.id, [paragraphe("La crique est calme.")]);
  await laurent.base.from("scenes").update({ fin: true }).in("id", [fin.id, s043.id]);
  await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
  return { projet: projet.id, depart: depart.id, fin: fin.id, s043: s043.id, versFin };
}

const etat = async (projet: string) => {
  const l = (await etatDuLivre(enseignant(laurent), projet))!;
  return { l, acceptes: avertissementsAcceptes(l.problemes, l.acceptations, l.changements) };
};
const inaccessible = (l: { problemes: { sorte: string; cle: string }[] }) => l.problemes.find((p) => p.sorte === "inaccessible");

describe("Avertissements acceptés et journal des chemins (F11.6)", () => {
  it("F11-AC75 — acceptation durable : une coquille ne la rouvre pas ; un choix qui vient à y mener puis qui est supprimé, si", async () => {
    const r = await livre();
    let { l } = await etat(r.projet);
    const point = inaccessible(l)!;
    expect(point.cle).toBe(`inaccessible:${r.s043}`);
    expect((await laurent.base.rpc("accepter_avertissement", { p_projet: r.projet, p_cle: point.cle, p_empreinte: empreinteDe(l.problemes.find((p) => p.cle === point.cle)!) })).error).toBeNull();
    expect((await etat(r.projet)).acceptes.has(point.cle)).toBe(true);

    // Une coquille corrigée dans S043 : l'acceptation tient
    await ecrire(r.s043, [paragraphe("La crique est calme et bleue.")]);
    expect((await etat(r.projet)).acceptes.has(point.cle)).toBe(true);

    // Un choix vient à y mener : le point disparaît ; il est supprimé : le point est de nouveau à traiter
    const versCrique = choix("Descendre à la crique", r.s043);
    await ecrire(r.depart, [paragraphe("La plage au matin."), r.versFin, versCrique]);
    expect(inaccessible((await etat(r.projet)).l)).toBeUndefined();
    await ecrire(r.depart, [paragraphe("La plage au matin."), r.versFin]);
    ({ l } = await etat(r.projet));
    expect(inaccessible(l)?.cle).toBe(point.cle);
    expect(avertissementsAcceptes(l.problemes, l.acceptations, l.changements).has(point.cle)).toBe(false);
  });

  it("F11.6 — la base note les chemins qui changent, et rien pour une coquille ; le repère de fin compte parmi les chemins qui partent", async () => {
    const r = await livre();
    const notes = async () => ((await laurent.base.from("chemins_changes").select("scene_id, sens").eq("projet_id", r.projet).order("id")).data ?? []) as { scene_id: string; sens: string }[];
    const avant = (await notes()).length;
    await ecrire(r.depart, [paragraphe("La plage au matin, encore."), r.versFin]);
    expect((await notes()).length).toBe(avant);
    // Le choix change de destination : sa scène, l'ancienne et la nouvelle arrivée sont notées
    await ecrire(r.depart, [paragraphe("La plage au matin, encore."), { ...r.versFin, cible: r.s043 }]);
    expect((await notes()).slice(avant)).toEqual(
      expect.arrayContaining([{ scene_id: r.depart, sens: "sortie" }, { scene_id: r.fin, sens: "entree" }, { scene_id: r.s043, sens: "entree" }]),
    );
    const n = (await notes()).length;
    await laurent.base.from("scenes").update({ fin: false }).eq("id", r.fin);
    expect((await notes()).slice(n)).toEqual([{ scene_id: r.fin, sens: "sortie" }]);
  });

  it("F11-AC73 — « J'ai vérifié les chemins » se pose et se retire ; la base la garde", async () => {
    const r = await livre();
    expect((await laurent.base.from("projets").update({ chemins_verifies_le: new Date().toISOString() }).eq("id", r.projet).select("id")).data).toHaveLength(1);
    const { l, acceptes } = await etat(r.projet);
    expect(l.cheminsVerifies).toBe(true);
    // Il reste le passage S043 à confirmer : l'étape n'a pas encore sa coche
    expect(etatChemins(l.problemes, acceptes, true).marque).toBe("reste");
    expect(aTraiter(l.problemes).map((p) => p.sorte)).toEqual(["inaccessible"]);
    await laurent.base.from("projets").update({ chemins_verifies_le: null }).eq("id", r.projet);
    expect((await etat(r.projet)).l.cheminsVerifies).toBe(false);
  });

  it("F11.6 — droits : un autre adulte, un poste, un inconnu ne lisent ni le journal ni les acceptations, et n'en posent pas ; personne n'écrit le journal", async () => {
    const r = await livre();
    const point = inaccessible((await etat(r.projet)).l)!;
    await laurent.base.rpc("accepter_avertissement", { p_projet: r.projet, p_cle: point.cle, p_empreinte: "x" });
    expect((await martin.base.rpc("accepter_avertissement", { p_projet: r.projet, p_cle: "sortie:x", p_empreinte: "" })).error?.message).toMatch(/n'existe plus/);
    for (const table of ["chemins_changes", "avertissements_acceptes"]) {
      expect((await lire(martin.base, table)).lignes).toHaveLength(0);
      expect((await lire(inconnu(), table)).refus).not.toBeNull();
    }
    const supprime = await martin.base.from("avertissements_acceptes").delete().eq("projet_id", r.projet).select("cle");
    expect(supprime.data ?? []).toHaveLength(0);
    expect((await martin.base.from("projets").update({ chemins_verifies_le: new Date().toISOString() }).eq("id", r.projet).select("id")).data ?? []).toHaveLength(0);
    // L'adulte lui-même n'écrit pas dans le journal
    const ecrit = await laurent.base.from("chemins_changes").insert({ scene_id: r.s043, projet_id: r.projet, enseignant_id: laurent.id, sens: "entree" });
    expect(ecrit.error).not.toBeNull();
    // Un poste d'élève
    const classe = await creerClasse(laurent);
    const [alice] = await inscrire(laurent, classe.id, ["Alice"]);
    const projetClasse = await creerProjet(laurent, "classe", "choix", "La forêt", classe.id);
    const { chapitreId } = await creerPartie(laurent, projetClasse.id, "La forêt", "La lisière");
    await attribuer(laurent, chapitreId, [{ eleve: alice.id }]);
    const poste = await (await posteDe(classe.id, alice.inscriptionId)).base();
    for (const table of ["chemins_changes", "avertissements_acceptes"]) expect((await lire(poste, table)).refus).not.toBeNull();
    expect((await poste.rpc("accepter_avertissement", { p_projet: projetClasse.id, p_cle: "x", p_empreinte: "" })).error).not.toBeNull();
  });
});
