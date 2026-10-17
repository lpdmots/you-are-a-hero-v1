import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { instantaneDuLivre, produirePdfDefinitif, produirePdfDeTravail, supprimerPdfDefinitif } from "@/serveur/livre/livre";
import { pdfDuProjet, SEAU } from "@/serveur/livre/pdf";
import { lirePdf } from "../livre/fabrique";
import { creerEnseignant, creerPartie, creerProjet, creerScene, nettoyer, service, sql, type Adulte, enseignantDe } from "./outils";

/**
 * Étape 6 du plan, lot 5 : le PDF définitif contre la vraie base locale (F11.2) — la règle
 * unique vérifiée sur l'instantané, sans contournement ; le livre sans marques ; tous les PDF
 * définitifs gardés ; le livre qui change après lui.
 */

let laurent: Adulte;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
});
afterAll(nettoyer);

const enseignant = enseignantDe;
const paragraphe = (t: string) => ({ type: "p", id: randomUUID(), children: [{ text: t }] });
const choix = (libelle: string, cible: string | null) => ({ type: "choix", id: randomUUID(), auto: true, libelle, construction: "neutre", cible, children: [{ text: "" }] });

async function ecrire(scene: string, texte: unknown[]): Promise<void> {
  const { data } = await laurent.base.from("scenes").select("version").eq("id", scene).single();
  const { error } = await laurent.base.rpc("enregistrer_texte", { p_scene: scene, p_version: data!.version, p_texte: texte });
  if (error) throw new Error(error.message);
}

/** Un départ et une fin, tout prêt, la mise en page déclarée. */
async function livre() {
  const projet = await creerProjet(laurent, "personnel", "choix", "Le phare", null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La côte", "La plage");
  const [depart, fin] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  await laurent.base.from("projets").update({ depart_scene_id: depart.id }).eq("id", projet.id);
  await ecrire(depart.id, [paragraphe("La plage au matin."), choix("Aller au phare", fin.id)]);
  await ecrire(fin.id, [paragraphe("La lanterne s’allume.")]);
  await laurent.base.from("scenes").update({ fin: true }).eq("id", fin.id);
  await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
  await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
  return { projet: projet.id, depart: depart.id, fin: fin.id };
}

describe("PDF définitif (F11.2)", () => {
  it("F11-AC04, F09-AC10 — une scène à finir : refusé avec ce qui reste, rien n'est déposé ; le PDF de travail reste possible", async () => {
    const l = await livre();
    await sql("update public.scenes set etat = 'cours' where id = $1", [l.fin]);
    const refus = await produirePdfDefinitif(enseignant(laurent), l.projet);
    expect(refus).toMatchObject({ ok: false, raisons: [{ etape: "relire", texte: "1 scène à finir" }] });
    expect(await pdfDuProjet(enseignant(laurent), l.projet)).toEqual([]);
    expect((await produirePdfDeTravail(enseignant(laurent), l.projet)).ok).toBe(true);
  });

  it("le livre sans marques de travail, à l'empreinte de son instantané ; puis F11-AC26 : une scène modifiée, l'empreinte du livre n'est plus la sienne", async () => {
    const l = await livre();
    const fait = await produirePdfDefinitif(enseignant(laurent), l.projet);
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    const [ligne] = await sql<{ chemin: string; sorte: string }>("select chemin, sorte from public.pdf_du_livre where id = $1", [fait.pdf.id]);
    expect(ligne.sorte).toBe("definitif");
    const { data } = await service().storage.from(SEAU).download(ligne.chemin);
    const texte = (await lirePdf(Buffer.from(await data!.arrayBuffer()))).map((x) => x.lignes.join(" ")).join(" ");
    expect(texte).toContain("La plage au matin.");
    expect(texte).not.toMatch(/Version de travail|S00\d/);
    expect(fait.pdf.empreinte).toBe((await instantaneDuLivre(enseignant(laurent), l.projet))!.empreinte);
    await ecrire(l.fin, [paragraphe("La lanterne s’allume enfin.")]);
    expect(fait.pdf.empreinte).not.toBe((await instantaneDuLivre(enseignant(laurent), l.projet))!.empreinte);
  });

  it("F11-AC101 — deux PDF définitifs sont gardés, le plus récent en tête ; l'un supprimé, l'autre reste, son fichier aussi", async () => {
    const l = await livre();
    const premier = await produirePdfDefinitif(enseignant(laurent), l.projet);
    const second = await produirePdfDefinitif(enseignant(laurent), l.projet);
    if (!premier.ok || !second.ok) throw new Error("PDF non créés");
    const liste = (await pdfDuProjet(enseignant(laurent), l.projet)).filter((x) => x.sorte === "definitif");
    expect(liste.map((x) => x.id)).toEqual([second.pdf.id, premier.pdf.id]);
    const [{ chemin }] = await sql<{ chemin: string }>("select chemin from public.pdf_du_livre where id = $1", [premier.pdf.id]);
    expect(await supprimerPdfDefinitif(enseignant(laurent), premier.pdf.id)).toMatchObject({ ok: true });
    expect((await pdfDuProjet(enseignant(laurent), l.projet)).map((x) => x.id)).toEqual([second.pdf.id]);
    const { data } = await service().storage.from(SEAU).list(chemin.split("/").slice(0, 2).join("/"));
    expect((data ?? []).map((o) => o.name)).not.toContain(chemin.split("/").pop());
  });
});
