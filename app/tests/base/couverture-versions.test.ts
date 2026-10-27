import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { imagePubliee } from "@/serveur/bibliotheque-publique";
import { relecture } from "@/serveur/ia/aides/relecture";
import { SCENE_1 } from "@/serveur/ia/images-simulees";
import { SEAU } from "@/serveur/images";
import { instantaneDuLivre } from "@/serveur/livre/livre";
import { versionsDe } from "@/serveur/partage";
import { proposerALaBibliotheque } from "@/serveur/publication";
import { livresARelire, publier, relireLaProposition } from "@/serveur/relecture-des-livres";
import { NOMS_COMME_LE_LIVRE, type VersionPartagee } from "@/domaine/partage";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, nettoyer, service, sql, type Adulte } from "./outils";

/**
 * La couverture faite sur le site, lot 2 (F11.4, F11-AC113, AC115) : figée dans les versions
 * partagée et publiée, servie avec leurs images, relue par l'IA avec ses textes demandés, et
 * « Seule la couverture a changé » dans la file. Fournisseur simulé (IA_SIMULEE).
 */

let laurent: Adulte;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  await creerClasse(laurent, "CM1");
  const [{ n }] = await sql<{ n: number }>("select count(*)::int as n from public.enseignants where createur");
  if (!n) {
    const porteur = await creerEnseignant("Le porteur");
    await sql("update public.enseignants set createur = true where id = $1", [porteur.id]);
  }
});
afterAll(nettoyer);

const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string) => ({ type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });

async function ecrire(scene: string, texte: unknown[]): Promise<void> {
  const { data } = await laurent.base.from("scenes").select("version").eq("id", scene).single();
  const { error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: data!.version, p_texte: texte });
  if (error) throw new Error(error.message);
}

/** « La lanterne du passeur », fini : deux passages, prêts. */
async function lanterne(titre = "La lanterne du passeur") {
  const projet = await creerProjet(laurent, "classe", "choix", titre, null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "Le fleuve", "Le quai");
  const [depart, fin] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  await laurent.base.from("projets").update({ depart_scene_id: depart.id }).eq("id", projet.id);
  await ecrire(depart.id, [paragraphe("La brume monte sur le fleuve."), choix("Suivre le passeur", fin.id)]);
  await ecrire(fin.id, [paragraphe("La lanterne s’allume.")]);
  await laurent.base.from("scenes").update({ fin: true }).eq("id", fin.id);
  await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
  await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
  return projet.id;
}

/** Une couverture déposée pour de bon, avec les textes que le modèle devait écrire (ou aucun, importée). */
async function couverture(projet: string, textes: string[] | null): Promise<string> {
  const id = randomUUID();
  const octets = Buffer.from(SCENE_1, "base64");
  for (const chemin of [`${laurent.id}/${projet}/${id}.jpg`, `${laurent.id}/${projet}/${id}-v.jpg`]) {
    await service().storage.from(SEAU).upload(chemin, octets, { contentType: "image/jpeg" });
  }
  const { error } = await laurent.base.from("images").insert({
    id, projet_id: projet, enseignant_id: laurent.id, chemin: `${laurent.id}/${projet}/${id}.jpg`, chemin_vignette: `${laurent.id}/${projet}/${id}-v.jpg`,
    largeur: 1824, hauteur: 2560, format: "jpeg", textes_demandes: textes,
  });
  if (error) throw new Error(error.message);
  await laurent.base.from("projets").update({ couverture_id: id }).eq("id", projet);
  return id;
}

const proposer = (projet: string) => proposerALaBibliotheque(enseignantDe(laurent), projet, { presentation: "Au bord du fleuve, la brume ne se lève plus.", attestation: true });
const ligne = async (projet: string) => (await sql<{ version: VersionPartagee | null; proposee: VersionPartagee | null; adresse: string | null }>("select version, proposee, adresse from public.publications where projet_id = $1", [projet]))[0];

describe("La couverture dans les versions (F11-AC113, AC115)", () => {
  it("F11-AC113 — la version partagée fige la couverture, ses dimensions et ses textes, avec les images qu'elle sert ; une autre couverture dit que le livre a changé", async () => {
    const projet = await lanterne();
    const sans = versionsDe((await instantaneDuLivre(enseignantDe(laurent), projet))!, NOMS_COMME_LE_LIVRE);
    expect(sans.version.couverture).toBeNull();
    const id = await couverture(projet, ["La lanterne du passeur"]);
    const avec = versionsDe((await instantaneDuLivre(enseignantDe(laurent), projet))!, NOMS_COMME_LE_LIVRE);
    expect(avec.version.couverture).toEqual({ id, largeur: 1824, hauteur: 2560, textes: ["La lanterne du passeur"] });
    expect(avec.version.images[id]).toEqual({ largeur: 1824, hauteur: 2560 });
    expect(avec.empreinte).not.toBe(sans.empreinte);
    // Le PDF ne la contient pas : l'empreinte de lecture, qui se compare au PDF, ne change pas
    expect(avec.empreinteLecture).toBe(sans.empreinteLecture);
  });

  it("F11-AC115 — publiée, une autre couverture ne change rien en public avant la mise à jour ; la file dit « Seule la couverture a changé » ; publiée, la même adresse la sert", async () => {
    const projet = await lanterne("Le gué des saules");
    const premiere = await couverture(projet, ["Le gué des saules"]);
    expect(await proposer(projet)).toEqual({ ok: true });
    await publier(projet);
    const publiee = await ligne(projet);
    expect(publiee.version?.couverture?.id).toBe(premiere);
    expect(await imagePubliee(publiee.adresse!, premiere, true)).not.toBeNull();

    const seconde = await couverture(projet, ["Le gué des saules", "2026-2027"]);
    expect((await ligne(projet)).version?.couverture?.id).toBe(premiere);
    expect(await imagePubliee(publiee.adresse!, seconde, true)).toBeNull();

    expect(await proposer(projet)).toEqual({ ok: true });
    const [livre] = (await livresARelire()).filter((x) => x.projetId === projet);
    expect(livre).toMatchObject({ miseAJour: true, changes: [], couvertureChangee: true });

    await publier(projet);
    expect((await ligne(projet)).version?.couverture?.id).toBe(seconde);
    expect(await imagePubliee(publiee.adresse!, seconde, true)).not.toBeNull();
  });

  it("F11-AC115 — l'IA lit la couverture en premier, avec les textes demandés, pour signaler celui qui en diffère ; une couverture importée se lit sans ses textes", async () => {
    const projet = await lanterne("La lanterne de cuivre");
    await couverture(projet, ["La lanterne de cuivre"]);
    await proposer(projet);
    const simuler = vi.spyOn(relecture, "simuler");
    expect(await relireLaProposition(projet)).toBe("fait");
    const [entree] = simuler.mock.calls.at(-1)!;
    expect(entree.images[0]).toMatchObject({ repere: "I1", ou: "en couverture" });
    expect(relecture.message(entree)).toContain("I1 est la couverture. Elle doit porter exactement ces textes : « La lanterne de cuivre ».");

    const importee = await lanterne("Le moulin");
    await couverture(importee, null);
    await proposer(importee);
    await relireLaProposition(importee);
    const [lue] = simuler.mock.calls.at(-1)!;
    expect(relecture.message(lue)).toContain("I1 est la couverture, faite par l'enseignant");
  });
});
