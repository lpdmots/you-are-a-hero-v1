import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { relecture } from "@/serveur/ia/aides/relecture";
import { proposerALaBibliotheque, publicationDuProjet } from "@/serveur/publication";
import { livresARelire, publier, refuser, relireLaProposition } from "@/serveur/relecture-des-livres";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, nettoyer, sql, type Adulte } from "./outils";

/**
 * Bibliothèque publique des livres (F15), lot 2 : la relecture par l'IA, au compte du porteur, puis
 * sa décision — publier à une adresse fixée à la première publication, refuser avec un motif — et
 * la mise à jour relue, la version publiée restant lisible. Fournisseur simulé (IA_SIMULEE).
 */

let laurent: Adulte;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  await creerClasse(laurent, "CM1");
  // Un compte porteur, qui paie la relecture, s'il n'y en a pas déjà un dans la base locale
  const [{ n }] = await sql<{ n: number }>("select count(*)::int as n from public.enseignants where createur");
  if (!n) {
    const porteur = await creerEnseignant("Le porteur");
    await sql("update public.enseignants set createur = true where id = $1", [porteur.id]);
  }
});
afterAll(nettoyer);

const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string | null) => ({ type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });

async function ecrire(a: Adulte, scene: string, texte: unknown[]): Promise<void> {
  const { data } = await a.base.from("scenes").select("version").eq("id", scene).single();
  const { error } = await a.base.rpc("enregistrer_texte", { p_scene: scene, p_version: data!.version, p_texte: texte });
  if (error) throw new Error(error.message);
}

/** « La lanterne du passeur », proposée : un départ, une fin où un personnage moque une enseignante réelle, et une page des auteurs. */
async function propose(titre = "La lanterne du passeur") {
  const projet = await creerProjet(laurent, "classe", "choix", titre, null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "Le fleuve", "Le quai");
  const [depart, fin] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  await laurent.base.from("projets").update({ depart_scene_id: depart.id }).eq("id", projet.id);
  await ecrire(laurent, depart.id, [paragraphe("La brume s’épaissi sur le fleuve."), choix("Suivre le passeur", fin.id)]);
  await ecrire(laurent, fin.id, [paragraphe("« La maîtresse Mme Dupont est bête et grosse », ricane le passeur. La lanterne s’allume.")]);
  await laurent.base.from("scenes").update({ fin: true }).eq("id", fin.id);
  await sql(
    `update public.projets set pages_du_livre = jsonb_build_object('auteurs', jsonb_build_object('presente', true, 'noms', jsonb_build_array('Alice', 'Bilal', 'Chloé'))) where id = $1`,
    [projet.id],
  );
  await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
  await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
  const r = await proposerALaBibliotheque(enseignantDe(laurent), projet.id, { presentation: "Au bord du fleuve, la brume ne se lève plus.", attestation: true });
  expect(r).toEqual({ ok: true });
  return { projet: projet.id, depart: depart.id, fin: fin.id };
}

const ligne = async (projet: string) => (await sql<Record<string, unknown>>("select * from public.publications where projet_id = $1", [projet]))[0];
const etoiles = async () => (await sql<{ e: number }>("select etoiles as e from public.enseignants where id = $1", [laurent.id]))[0].e;

describe("Relecture par l'IA (F15)", () => {
  it("F15-AC03 — le rapport cite le passage et sa phrase, sans rien dire des prénoms, qui ne partent pas ; aucune étoile de l'adulte, le coût au journal du porteur", async () => {
    const l = await propose();
    const avant = await etoiles();
    const simuler = vi.spyOn(relecture, "simuler");
    expect(await relireLaProposition(l.projet)).toBe("fait");
    const parti = simuler.mock.calls.map(([e]) => `${relecture.systeme(e)}\n${relecture.message(e)}`).join("\n");
    expect(parti).toContain("La brume s’épaissi sur le fleuve.");
    for (const absent of ["Alice", "Bilal", "Chloé", "Laurent"]) expect(parti).not.toContain(absent);

    const [livre] = (await livresARelire()).filter((x) => x.projetId === l.projet);
    expect(livre.rapport.etat).toBe("fait");
    expect(livre.rapport.points).toEqual([
      expect.objectContaining({ repere: "P2", passage: l.fin, motif: "moquerie", phrase: expect.stringContaining("Mme Dupont est bête et grosse") }),
    ]);
    expect(await etoiles()).toBe(avant);
    const [appel] = await sql<{ createur: boolean }>(
      "select e.createur from public.appels_ia a join public.enseignants e on e.id = a.enseignant_id where a.aide = 'relecture' order by a.commence_le desc limit 1",
    );
    expect(appel.createur).toBe(true);
  });

  it("une nouvelle proposition efface le rapport de l'ancienne ; un rapport en retard ne s'écrit pas sur la nouvelle", async () => {
    const l = await propose("Le gué des saules");
    await relireLaProposition(l.projet);
    await refuser(l.projet, "Autre.");
    await proposerALaBibliotheque(enseignantDe(laurent), l.projet, { presentation: "Une autre présentation.", attestation: true });
    expect((await ligne(l.projet)).rapport).toBeNull();
  });
});

describe("Publier et refuser (F15)", () => {
  it("F15-AC04 — publier : le livre est lisible, à l'adresse tirée de son titre ; un second livre du même titre reçoit un suffixe", async () => {
    const titre = `La lanterne ${randomUUID().slice(0, 6)}`;
    const l = await propose(titre);
    const r = await publier(l.projet);
    expect(r.ok).toBe(true);
    const adresse = r.adresse!;
    expect(adresse).toMatch(/^la-lanterne-[a-z0-9]+$/);
    const publiee = await ligne(l.projet);
    expect(publiee).toMatchObject({ adresse, proposee: null, refus_motif: null });
    expect(JSON.stringify(publiee.version)).toContain("La brume s’épaissi");
    expect((await publicationDuProjet(enseignantDe(laurent), l.projet))!.etat).toMatchObject({ sorte: "publiee", adresse, miseAJour: null });

    const double = await propose(titre);
    expect((await publier(double.projet)).adresse).toBe(`${adresse}-2`);
  });

  it("F15-AC05 — refuser : le motif reste à l'adulte, qui propose de nouveau", async () => {
    const l = await propose();
    expect((await refuser(l.projet, "Contenu inadapté à l’âge des lecteurs. Le passage 2 se moque d’une enseignante réelle.")).ok).toBe(true);
    const p = (await publicationDuProjet(enseignantDe(laurent), l.projet))!;
    expect(p.etat).toMatchObject({ sorte: "refusee", motif: expect.stringContaining("Le passage 2") });
    expect(p.presentation).toBe("Au bord du fleuve, la brume ne se lève plus.");
    expect(await proposerALaBibliotheque(enseignantDe(laurent), l.projet, { presentation: p.presentation, attestation: true })).toEqual({ ok: true });
    expect((await publicationDuProjet(enseignantDe(laurent), l.projet))!.etat).toMatchObject({ sorte: "attente" });
  });

  it("F15-AC07 — la mise à jour relue : le public lit l'ancienne version, le porteur voit le passage changé ; publiée, la même adresse ; refusée, l'ancienne reste", async () => {
    const l = await propose(`Le passeur ${randomUUID().slice(0, 6)}`);
    const { adresse } = await publier(l.projet);
    await ecrire(laurent, l.depart, [paragraphe("La brume s’épaissit sur le fleuve."), choix("Suivre le passeur", l.fin)]);
    await sql("update public.scenes set etat = 'prete' where projet_id = $1", [l.projet]);
    await proposerALaBibliotheque(enseignantDe(laurent), l.projet, { presentation: "Au bord du fleuve, la brume ne se lève plus.", attestation: true });
    expect(JSON.stringify((await ligne(l.projet)).version)).toContain("s’épaissi sur");
    const [livre] = (await livresARelire()).filter((x) => x.projetId === l.projet);
    expect(livre.miseAJour).toBe(true);
    expect(livre.changes).toEqual([{ id: l.depart, repere: "Passage 1", sorte: "change" }]);

    await refuser(l.projet, "Autre.");
    expect(JSON.stringify((await ligne(l.projet)).version)).toContain("s’épaissi sur");
    expect((await publicationDuProjet(enseignantDe(laurent), l.projet))!.etat).toMatchObject({ sorte: "publiee", miseAJour: { sorte: "refusee" } });

    await proposerALaBibliotheque(enseignantDe(laurent), l.projet, { presentation: "Au bord du fleuve, la brume ne se lève plus.", attestation: true });
    expect((await publier(l.projet)).adresse).toBe(adresse);
    const apres = await ligne(l.projet);
    expect(JSON.stringify(apres.version)).toContain("s’épaissit sur");
    // Les passages gardent leur identité : une lecture arrêtée continue (F12-AC25)
    expect((apres.version as { passages: { id: string }[] }).passages.map((p) => p.id)).toEqual([l.depart, l.fin]);
  });
});
