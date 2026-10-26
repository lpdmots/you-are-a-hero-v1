import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { presentation as aidePresentation } from "@/serveur/ia/aides/presentation";
import { mettreAJourLePartage, ouvrirCanal, partageDuProjet, reglerNoms } from "@/serveur/partage";
import { demanderUnePresentation, proposerALaBibliotheque, publicationDuProjet } from "@/serveur/publication";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, inconnu, nettoyer, sql, type Adulte } from "./outils";

/**
 * Bibliothèque publique des livres (F15), contre la vraie base locale. Lot 1 : proposer un livre,
 * la règle du partage revérifiée, l'attestation, une seule proposition en attente, privé et public
 * séparés, la table écrite par le serveur seul.
 */

let laurent: Adulte;
let bernard: Adulte;
let martin: Adulte;

beforeAll(async () => {
  [laurent, bernard, martin] = await Promise.all([creerEnseignant("Mme Laurent"), creerEnseignant("M. Bernard"), creerEnseignant("M. Martin")]);
});
afterAll(nettoyer);

const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string | null) => ({ type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });

async function ecrire(a: Adulte, scene: string, texte: unknown[]): Promise<void> {
  const { data } = await a.base.from("scenes").select("version").eq("id", scene).single();
  const { error } = await a.base.rpc("enregistrer_texte", { p_scene: scene, p_version: data!.version, p_texte: texte });
  if (error) throw new Error(error.message);
}

/** « La lanterne du passeur » : un départ et une fin, tout prêt, « Imprimer et partager » ouverte. */
async function livre(a: Adulte = laurent, organisation: "personnel" | "classe" = "classe") {
  const classe = organisation === "classe" ? await creerClasse(a, `CM1 ${randomUUID().slice(0, 4)}`) : null;
  const projet = await creerProjet(a, organisation, "choix", "La lanterne du passeur", classe?.id ?? null);
  const { chapitreId } = await creerPartie(a, projet.id, "Le fleuve", "Le quai");
  const [depart, fin] = [await creerScene(a.base, chapitreId), await creerScene(a.base, chapitreId)];
  await a.base.from("projets").update({ depart_scene_id: depart.id }).eq("id", projet.id);
  await ecrire(a, depart.id, [paragraphe("La brume s’épaissi sur le fleuve."), choix("Suivre le passeur", fin.id)]);
  await ecrire(a, fin.id, [paragraphe("La lanterne s’allume sur l’autre rive.")]);
  await a.base.from("scenes").update({ fin: true }).eq("id", fin.id);
  await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
  await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
  return { projet: projet.id, depart: depart.id, fin: fin.id, classe };
}

const PRESENTATION = "Au bord du fleuve, la brume ne se lève plus. Tu suis le passeur vers l’autre rive.";
const proposer = (a: Adulte, projet: string, attestation: unknown = true, presentation: unknown = PRESENTATION) =>
  proposerALaBibliotheque(enseignantDe(a), projet, { presentation, attestation });
const ligne = async (projet: string) =>
  (await sql<Record<string, unknown>>("select * from public.publications where projet_id = $1", [projet]))[0] ?? null;

describe("Proposer à la bibliothèque (F15)", () => {
  it("F15-AC01 — sans la coche, rien ne part ; cochée, le livre attend la relecture et n'est lisible nulle part en public", async () => {
    const l = await livre();
    expect(await proposer(laurent, l.projet, false)).toMatchObject({ ok: false, erreur: "Cochez d’abord l’autorisation des familles." });
    expect(await ligne(l.projet)).toBeNull();
    expect(await proposer(laurent, l.projet, true, "  ")).toMatchObject({ ok: false });

    expect(await proposer(laurent, l.projet)).toEqual({ ok: true });
    const p = (await publicationDuProjet(enseignantDe(laurent), l.projet))!;
    expect(p.etat).toMatchObject({ sorte: "attente" });
    const l1 = (await ligne(l.projet))!;
    expect(l1).toMatchObject({ version: null, adresse: null, attestation: "classe", age_propose: "8-10", presentation_proposee: PRESENTATION });
    expect(JSON.stringify(l1.proposee)).toContain("La brume s’épaissi");
    // Personne sans compte ne lit la table
    expect((await inconnu().from("publications").select("projet_id").eq("projet_id", l.projet)).data ?? []).toEqual([]);
  });

  it("F15-AC02 — une scène incluse rouverte : la proposition est refusée avec le motif, comme un partage", async () => {
    const l = await livre();
    await sql("update public.scenes set etat = 'reprendre' where id = $1", [l.fin]);
    expect(await proposer(laurent, l.projet)).toMatchObject({ ok: false, raisons: [{ etape: "relire" }] });
    expect((await ligne(l.projet))?.proposee ?? null).toBeNull();
  });

  it("F15-AC06 — le public lit ce que montre le partage : la ligne de classe et les prénoms, ou rien si la page des auteurs est retirée", async () => {
    const l = await livre();
    await sql(
      `update public.projets set pages_du_livre = jsonb_build_object('titre', jsonb_build_object('ligne', 'CM1 de l''école Jean-Moulin, 2026'),
         'auteurs', jsonb_build_object('presente', true, 'noms', jsonb_build_array('Alice', 'Bilal', 'Chloé'))) where id = $1`,
      [l.projet],
    );
    await proposer(laurent, l.projet);
    const avec = JSON.stringify((await ligne(l.projet))!.proposee);
    expect(avec).toMatch(/CM1 de l['’]école Jean-Moulin, 2026/);
    expect(avec).toContain("Chloé");

    const autre = await livre();
    await sql(
      `update public.projets set pages_du_livre = jsonb_build_object('auteurs', jsonb_build_object('presente', true, 'noms', jsonb_build_array('Alice', 'Bilal', 'Chloé'))) where id = $1`,
      [autre.projet],
    );
    await reglerNoms(enseignantDe(laurent), autre.projet, { ligne: true, texte: null, auteurs: false });
    await proposer(laurent, autre.projet);
    expect(JSON.stringify((await ligne(autre.projet))!.proposee)).not.toContain("Chloé");
  });

  it("F15-AC08 — privé et public séparés : mettre à jour ou retirer le partage privé ne change rien à la proposition", async () => {
    const l = await livre();
    await ouvrirCanal(enseignantDe(laurent), l.projet, "classes", true);
    await proposer(laurent, l.projet);
    const avant = (await ligne(l.projet))!;
    await ecrire(laurent, l.depart, [paragraphe("La brume s’épaissit sur le fleuve."), choix("Suivre le passeur", l.fin)]);
    expect(await mettreAJourLePartage(enseignantDe(laurent), l.projet, true)).toEqual({ ok: true });
    expect(JSON.stringify((await partageDuProjet(enseignantDe(laurent), l.projet))!.version!.contenu)).toContain("s’épaissit");
    const apres = (await ligne(l.projet))!;
    expect(apres.proposee).toEqual(avant.proposee);
    expect(JSON.stringify(apres.proposee)).toContain("s’épaissi sur");
  });

  it("F15-AC17 — en mode personnel, l'attestation demandée est celle de l'auteur", async () => {
    const l = await livre(bernard, "personnel");
    expect(await proposer(bernard, l.projet, false)).toMatchObject({ ok: false, erreur: "Cochez d’abord que vous êtes l’auteur du livre." });
    expect(await proposer(bernard, l.projet)).toEqual({ ok: true });
    expect((await ligne(l.projet))!.attestation).toBe("auteur");
  });

  it("F15-AC18 — gratuit, sans pass, « Paiement ouvert » allumé ; une seconde proposition n'est pas possible tant que la première attend", async () => {
    const [{ p: avant }] = await sql<{ p: boolean }>("select paiement_ouvert as p from public.reglages_application");
    await sql("update public.reglages_application set paiement_ouvert = true");
    try {
      const l = await livre();
      expect(await proposer(laurent, l.projet)).toEqual({ ok: true });
      expect(await proposer(laurent, l.projet)).toMatchObject({ ok: false, erreur: "Une proposition attend déjà sa relecture." });
      // Deux envois simultanés : une seule passe
      const deux = await livre();
      const r = await Promise.all([proposer(laurent, deux.projet), proposer(laurent, deux.projet)]);
      expect(r.filter((x) => x.ok)).toHaveLength(1);
      const [{ n }] = await sql<{ n: number }>("select count(*)::int as n from public.mouvements_etoiles where enseignant_id = $1 and nombre < 0", [laurent.id]);
      expect(n).toBe(0);
    } finally {
      await sql("update public.reglages_application set paiement_ouvert = $1", [avant]);
    }
  });

  it("l'adulte lit sa ligne sans pouvoir l'écrire ; un autre ne la lit pas et ne propose pas son livre", async () => {
    const l = await livre();
    await proposer(laurent, l.projet);
    expect((await laurent.base.from("publications").select("projet_id").eq("projet_id", l.projet)).data).toHaveLength(1);
    const ecrit = await laurent.base.from("publications").update({ version: { titre: "x" } }).eq("projet_id", l.projet).select("projet_id");
    expect(ecrit.data ?? []).toEqual([]);
    expect((await ligne(l.projet))!.version).toBeNull();
    expect((await martin.base.from("publications").select("projet_id").eq("projet_id", l.projet)).data ?? []).toEqual([]);
    expect(await proposer(martin, l.projet)).toMatchObject({ ok: false, erreur: "Ce projet est introuvable." });
  });
});

describe("« ✦ Écrire » la présentation (F15)", () => {
  it("d'après le début du livre, payée en étoiles comme les autres aides ; ni prénom d'élève ni nom d'enseignant ne part", async () => {
    const l = await livre();
    await sql(
      `update public.projets set pages_du_livre = jsonb_build_object('auteurs', jsonb_build_object('presente', true, 'noms', jsonb_build_array('Alice', 'Bilal'))) where id = $1`,
      [l.projet],
    );
    const simuler = vi.spyOn(aidePresentation, "simuler");
    const [{ e: avant }] = await sql<{ e: number }>("select etoiles as e from public.enseignants where id = $1", [laurent.id]);
    const r = await demanderUnePresentation(enseignantDe(laurent), l.projet, "");
    expect(r).toMatchObject({ ok: true, presentation: expect.stringContaining("passeur") });
    const parti = simuler.mock.calls.map(([e]) => `${aidePresentation.systeme(e)}\n${aidePresentation.message(e)}`).join("\n");
    expect(parti).toContain("La brume s’épaissi sur le fleuve.");
    for (const absent of ["Alice", "Bilal", "Laurent"]) expect(parti).not.toContain(absent);
    const [{ n }] = await sql<{ n: number }>("select count(*)::int as n from public.appels_ia where enseignant_id = $1 and aide = 'presentation' and issue = 'reussi'", [laurent.id]);
    expect(n).toBe(1);
    const [{ e: apres }] = await sql<{ e: number }>("select etoiles as e from public.enseignants where id = $1", [laurent.id]);
    // Une réponse simulée ne coûte rien : le débit suit le coût réel
    expect(apres).toBe(avant);
  });
});
