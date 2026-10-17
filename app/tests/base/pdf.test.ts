import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { composerLInstantane, instantaneDuLivre, produirePdfDeTravail } from "@/serveur/livre/livre";
import { adresseDuPdf, pdfDuProjet, SEAU } from "@/serveur/livre/pdf";
import { lirePdf } from "../livre/fabrique";
import { creerEnseignant, creerPartie, creerProjet, creerScene, nettoyer, service, sql, type Adulte, enseignantDe } from "./outils";

/**
 * Étape 6 du plan, lot 1 : le PDF de travail produit, déposé et donné, contre la vraie base
 * locale (F11.2) — l'instantané, le seau privé, le dernier PDF de travail seul gardé.
 */

let laurent: Adulte;
let martin: Adulte;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
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

/** Un départ et une fin, la fin seule déclarée prête : le livre n'est pas fini. */
async function livre() {
  const projet = await creerProjet(laurent, "personnel", "choix", "Le phare", null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La côte", "La plage");
  const [depart, fin] = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  await laurent.base.from("projets").update({ depart_scene_id: depart.id }).eq("id", projet.id);
  await ecrire(depart.id, [paragraphe("La plage au matin, la brume s’épaissi."), choix("Aller au phare", fin.id)]);
  await ecrire(fin.id, [paragraphe("La lanterne s’allume.")]);
  await laurent.base.from("scenes").update({ fin: true }).eq("id", fin.id);
  await sql("update public.scenes set etat = 'prete' where id = $1", [fin.id]);
  return { projet: projet.id, depart: depart.id, fin: fin.id };
}

describe("PDF de travail (F11.2)", () => {
  it("F11-AC03 — un livre dont une scène n'est pas prête donne son PDF de travail, déposé dans le seau privé", async () => {
    const l = await livre();
    const fait = await produirePdfDeTravail(enseignant(laurent), l.projet);
    expect(fait.ok).toBe(true);
    if (!fait.ok) return;
    const [ligne] = await sql<{ chemin: string; sorte: string; pages: number }>("select chemin, sorte, pages from public.pdf_du_livre where id = $1", [fait.pdf.id]);
    expect(ligne.sorte).toBe("travail");
    const { data } = await service().storage.from(SEAU).download(ligne.chemin);
    const pages = await lirePdf(Buffer.from(await data!.arrayBuffer()));
    expect(pages).toHaveLength(ligne.pages);
    const tout = pages.map((x) => x.lignes.join(" ")).join(" ").normalize("NFKC").replace(/\s+/g, "");
    expect(tout).toContain("1scèneàfinir.");
  });

  it("F11-AC101 — deux PDF de travail de suite : seul le second est gardé, en base comme dans le seau", async () => {
    const l = await livre();
    const premier = await produirePdfDeTravail(enseignant(laurent), l.projet);
    const second = await produirePdfDeTravail(enseignant(laurent), l.projet);
    if (!premier.ok || !second.ok) throw new Error("PDF non produits");
    const liste = await pdfDuProjet(enseignant(laurent), l.projet);
    expect(liste.map((x) => x.id)).toEqual([second.pdf.id]);
    const restes = await sql("select name from storage.objects where bucket_id = 'livres' and name like $1", [`${laurent.id}/${l.projet}/%`]);
    expect(restes).toHaveLength(1);
  });

  it("un PDF ne se donne qu'à l'adulte du projet : un autre enseignant ne le voit ni ne l'obtient", async () => {
    const l = await livre();
    const fait = await produirePdfDeTravail(enseignant(laurent), l.projet);
    if (!fait.ok) throw new Error("PDF non produit");
    expect(await adresseDuPdf(enseignant(laurent), fait.pdf.id)).toMatch(/\/storage\/v1\/object\/sign\/livres\//);
    expect(await adresseDuPdf(enseignant(martin), fait.pdf.id)).toBeNull();
    expect(await pdfDuProjet(enseignant(martin), l.projet)).toEqual([]);
    const { error } = await martin.base.from("pdf_du_livre").insert({
      projet_id: l.projet, enseignant_id: laurent.id, sorte: "definitif", etat_du: new Date().toISOString(), empreinte: "x".repeat(64), chemin: "faux.pdf", taille: 1, pages: 1,
    });
    expect(error).not.toBeNull();
    // Le seau est privé : aucune adresse publique
    const { data } = await laurent.base.storage.from(SEAU).download(`${laurent.id}/${l.projet}/${fait.pdf.id}.pdf`);
    expect(data).toBeNull();
  });

  it("F11-AC26 — une scène modifiée pendant le calcul n'est pas dans le fichier, qui garde l'état de la demande ; l'empreinte dit que le livre a changé", async () => {
    const l = await livre();
    const avant = await instantaneDuLivre(enseignant(laurent), l.projet);
    await ecrire(l.depart, [paragraphe("La plage au matin, la brume s’épaissit."), choix("Aller au phare", l.fin)]);
    const composition = await composerLInstantane(avant!, false);
    const texte = (await lirePdf(composition.pdf)).map((x) => x.lignes.join(" ")).join(" ").replaceAll("­", "").replace(/\s+/g, " ");
    expect(texte).toContain("s’épaissi.");
    const apres = await instantaneDuLivre(enseignant(laurent), l.projet);
    expect(apres!.empreinte).not.toBe(avant!.empreinte);
    expect(Date.parse(apres!.etatDu)).toBeGreaterThan(Date.parse(avant!.etatDu));
  });
});
