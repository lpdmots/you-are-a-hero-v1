import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { instantaneDuLivre, produirePdfDefinitif } from "@/serveur/livre/livre";
import { pdfDuProjet } from "@/serveur/livre/pdf";
import { couperCanal, mettreAJourLePartage, ouvrirCanal, partageDuProjet, reglerNoms, versionsDe } from "@/serveur/partage";
import { creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, inconnu, nettoyer, sql, type Adulte, enseignantDe } from "./outils";

/**
 * Étape 7 du plan, lot 1 : le partage contre la vraie base locale (F12.1, F12.3) — la règle
 * revérifiée à chaque geste, le rappel exigé, la version figée et sa mise à jour, le retrait,
 * le changement de lien, les droits sur la table.
 */

let laurent: Adulte;
let martin: Adulte;

beforeAll(async () => {
  [laurent, martin] = await Promise.all([creerEnseignant("Mme Laurent"), creerEnseignant("M. Martin")]);
  // Le partage privé suppose une classe en cours (F12-AC24) ; le lien seul ne s'ouvre plus (F15-AC15)
  await creerClasse(laurent, "CM1");
});
afterAll(nettoyer);

const enseignant = enseignantDe;
const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const note = (t: string) => ({ type: "note", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string | null) => ({ type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });

async function ecrire(a: Adulte, scene: string, texte: unknown[]): Promise<void> {
  const { data } = await a.base.from("scenes").select("version").eq("id", scene).single();
  const { error } = await a.base.rpc("enregistrer_texte", { p_scene: scene, p_version: data!.version, p_texte: texte });
  if (error) throw new Error(error.message);
}

/** Un départ et une fin, tout prêt, « Imprimer et partager » ouverte. */
async function livre(a: Adulte = laurent, organisation: "personnel" | "classe" = "personnel") {
  const classe = organisation === "classe" ? await creerClasse(a, `CM2 ${randomUUID().slice(0, 4)}`) : null;
  const projet = await creerProjet(a, organisation, "choix", "Le phare", classe?.id ?? null);
  const { chapitreId } = await creerPartie(a, projet.id, "La côte", "La plage");
  const [depart, fin] = [await creerScene(a.base, chapitreId), await creerScene(a.base, chapitreId)];
  await a.base.from("projets").update({ depart_scene_id: depart.id }).eq("id", projet.id);
  await ecrire(a, depart.id, [paragraphe("La brume s’épaissi sur la plage."), note("Penser à Bilal"), choix("Aller au phare", fin.id)]);
  await ecrire(a, fin.id, [paragraphe("La lanterne s’allume.")]);
  await a.base.from("scenes").update({ fin: true }).eq("id", fin.id);
  await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
  await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
  return { projet: projet.id, depart: depart.id, fin: fin.id };
}

const texteDe = (v: unknown) => JSON.stringify(v);

describe("Partager (F12.1)", () => {
  it("F12-AC17 — sans le rappel confirmé, aucun canal ne s'ouvre", async () => {
    const l = await livre();
    expect(await ouvrirCanal(enseignant(laurent), l.projet, "classes", false)).toMatchObject({ ok: false });
    expect(await partageDuProjet(enseignant(laurent), l.projet)).toBeNull();
  });

  it("F12-AC05 — un livre inachevé ne se partage pas : le refus dit ce qui reste", async () => {
    const l = await livre();
    await sql("update public.scenes set etat = 'cours' where id = $1", [l.fin]);
    const refus = await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    expect(refus).toMatchObject({ ok: false, raisons: [{ etape: "relire", texte: "1 scène à finir" }] });
    expect((await partageDuProjet(enseignant(laurent), l.projet))?.version ?? null).toBeNull();
  });

  it("F12-AC04 — la version ne porte ni note de l'enseignant ni référence ; F12-AC02 — une correction ne la change pas ; F12-AC08 — la mise à jour, sous le même lien", async () => {
    const l = await livre();
    expect(await ouvrirCanal(enseignant(laurent), l.projet, "classes", true)).toEqual({ ok: true });
    const partage = (await partageDuProjet(enseignant(laurent), l.projet))!;
    expect(partage.auxClasses).toBe(true);
    expect(partage.code).toMatch(/^[a-z2-9]{10}$/);
    expect(texteDe(partage.version!.contenu)).toContain("La brume s’épaissi");
    expect(texteDe(partage.version!.contenu)).not.toMatch(/Penser à Bilal|S00\d/);

    await ecrire(laurent, l.depart, [paragraphe("La brume s’épaissit sur la plage."), choix("Aller au phare", l.fin)]);
    const toujours = (await partageDuProjet(enseignant(laurent), l.projet))!;
    expect(texteDe(toujours.version!.contenu)).toContain("La brume s’épaissi sur");

    expect(await mettreAJourLePartage(enseignant(laurent), l.projet, true)).toEqual({ ok: true });
    const corrige = (await partageDuProjet(enseignant(laurent), l.projet))!;
    expect(texteDe(corrige.version!.contenu)).toContain("La brume s’épaissit sur");
    expect(corrige.code).toBe(partage.code);
  });

  it("F12-AC09, F11-AC72 — une scène rouverte : mise à jour refusée avec son motif, la version précédente reste lisible ; le retrait reste possible", async () => {
    const l = await livre();
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    const avant = (await partageDuProjet(enseignant(laurent), l.projet))!;
    await sql("update public.scenes set etat = 'reprendre' where id = $1", [l.fin]);
    const refus = await mettreAJourLePartage(enseignant(laurent), l.projet, true);
    expect(refus).toMatchObject({ ok: false, raisons: [{ etape: "relire" }] });
    expect((await partageDuProjet(enseignant(laurent), l.projet))!.version!.etatDu).toBe(avant.version!.etatDu);
    expect(await couperCanal(enseignant(laurent), l.projet, "classes")).toEqual({ ok: true });
    expect((await partageDuProjet(enseignant(laurent), l.projet))!.version).toBeNull();
  });

  it("F12-AC03, F12-AC10 — couper le dernier canal retire la version ; un nouveau partage réactive le même lien", async () => {
    const l = await livre();
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    const { code } = (await partageDuProjet(enseignant(laurent), l.projet))!;
    await couperCanal(enseignant(laurent), l.projet, "classes");
    const [ligne] = await sql<{ version: unknown; aux_classes: boolean }>("select version, aux_classes from public.partages where projet_id = $1", [l.projet]);
    expect(ligne).toEqual({ version: null, aux_classes: false });
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    expect((await partageDuProjet(enseignant(laurent), l.projet))!.code).toBe(code);
  });
});

describe("Deux canaux (F12.3)", () => {
  it("F12-AC24 — un récit personnel : « À mes classes » refusé sans classe en cours, possible avec une", async () => {
    const seul = await creerEnseignant("M. Seul");
    const l = await livre(seul);
    expect(await ouvrirCanal(enseignant(seul), l.projet, "classes", true)).toMatchObject({ ok: false });
    await creerClasse(seul, "CE2");
    expect(await ouvrirCanal(enseignant(seul), l.projet, "classes", true)).toEqual({ ok: true });
    expect((await partageDuProjet(enseignant(seul), l.projet))).toMatchObject({ auxClasses: true, parLien: false });
  });

  it("F15-AC15 — le lien de lecture seul ne s'ouvre plus ; un lien ouvert avant se coupe, et les classes lisent toujours", async () => {
    const l = await livre(laurent, "classe");
    expect(await ouvrirCanal(enseignant(laurent), l.projet, "lien", true)).toMatchObject({ ok: false });
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    const classes = (await partageDuProjet(enseignant(laurent), l.projet))!;
    expect(classes).toMatchObject({ auxClasses: true, parLien: false });
    // Un lien ouvert avant le 25 octobre 2026
    await sql("update public.partages set par_lien = true where projet_id = $1", [l.projet]);
    expect(await couperCanal(enseignant(laurent), l.projet, "lien")).toEqual({ ok: true });
    const apres = (await partageDuProjet(enseignant(laurent), l.projet))!;
    expect(apres).toMatchObject({ auxClasses: true, parLien: false });
    expect(apres.version!.etatDu).toBe(classes.version!.etatDu);
  });
});

describe("Ce que la version montre et à quoi elle se compare", () => {
  it("F12-AC21 — une marge élargie : le livre n'a pas changé pour le lecteur ; une coquille corrigée, si", async () => {
    const l = await livre();
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    const partage = (await partageDuProjet(enseignant(laurent), l.projet))!;
    await sql("update public.projets set mise_en_page = jsonb_build_object('marges', jsonb_build_object('haut', 16, 'bas', 20, 'exterieur', 24, 'interieur', 20)) where id = $1", [l.projet]);
    const marges = await instantaneDuLivre(enseignant(laurent), l.projet);
    expect(versionsDe(marges!, partage.noms).empreinte).toBe(partage.version!.empreinte);
    await ecrire(laurent, l.fin, [paragraphe("La lanterne s’allume enfin.")]);
    const corrige = await instantaneDuLivre(enseignant(laurent), l.projet);
    expect(versionsDe(corrige!, partage.noms).empreinte).not.toBe(partage.version!.empreinte);
  });

  it("F12-AC22 — le PDF définitif et la version partagée ont le même texte, même si les noms du partage diffèrent", async () => {
    const l = await livre();
    const pdf = await produirePdfDefinitif(enseignant(laurent), l.projet);
    expect(pdf.ok).toBe(true);
    await reglerNoms(enseignant(laurent), l.projet, { ligne: true, texte: "Un auteur", auteurs: true });
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    const partage = (await partageDuProjet(enseignant(laurent), l.projet))!;
    const [definitif] = (await pdfDuProjet(enseignant(laurent), l.projet)).filter((x) => x.sorte === "definitif");
    expect(definitif.empreinteLecture).toBe(partage.version!.empreinteLecture);
    expect(texteDe(partage.version!.contenu)).toContain("Un auteur");
  });

  it("F12-AC23 — les numéros de la version restent ceux de son instantané", async () => {
    const l = await livre();
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    const avant = (await partageDuProjet(enseignant(laurent), l.projet))!.version!.contenu.passages.map((x) => [x.id, x.numero]);
    // Une nouvelle scène vient au n° 2 du livre courant
    const { data: chapitre } = await laurent.base.from("scenes").select("chapitre_id").eq("id", l.fin).single();
    const nouvelle = await creerScene(laurent.base, chapitre!.chapitre_id as string);
    await sql("update public.scenes set rang_livre = -1, etat = 'prete' where id = $1", [nouvelle.id]);
    expect((await partageDuProjet(enseignant(laurent), l.projet))!.version!.contenu.passages.map((x) => [x.id, x.numero])).toEqual(avant);
  });
});

describe("Droits sur les partages", () => {
  it("un autre enseignant et une personne sans compte ne lisent aucun partage", async () => {
    const l = await livre();
    await ouvrirCanal(enseignant(laurent), l.projet, "classes", true);
    const vuParMartin = await martin.base.from("partages").select("code").eq("projet_id", l.projet);
    expect(vuParMartin.data ?? []).toEqual([]);
    const vuSansCompte = await inconnu().from("partages").select("code").eq("projet_id", l.projet);
    expect(vuSansCompte.data ?? []).toEqual([]);
    expect(await ouvrirCanal(enseignant(martin), l.projet, "classes", true)).toMatchObject({ ok: false });
  });
});
