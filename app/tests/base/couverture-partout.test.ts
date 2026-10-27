import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { livresDeLAccueil, livresAChoisir } from "@/serveur/accueil";
import { livresPublies } from "@/serveur/bibliotheque-publique";
import { ouvrirCanal } from "@/serveur/partage";
import { SCENE_1 } from "@/serveur/ia/images-simulees";
import {
  creerClasse, creerEnseignant, creerPartie, creerProjet, creerScene, enseignantDe, identifier, inscrire, nettoyer, ouvrirPoste, service, sql, type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

/**
 * La couverture faite sur le site, lot 3 (F11.4, F11-AC114, AC117) : où elle se montre — la
 * bibliothèque, l'accueil, « Lire » côté élève — et la conversion des faces avant déposées pour
 * l'accueil en couverture de leur livre.
 */

let laurent: Adulte;
let cm1: ClasseEssai;
let alice: EleveEssai;
let accueilAvant: unknown;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  cm1 = await creerClasse(laurent, `CM1 ${randomUUID().slice(0, 4)}`);
  [alice] = await inscrire(laurent, cm1.id, ["Alice"]);
  accueilAvant = (await sql<{ l: unknown }>("select livres_de_l_accueil as l from public.reglages_application"))[0]?.l ?? [];
});
afterAll(async () => {
  await sql("update public.reglages_application set livres_de_l_accueil = $1::jsonb", [JSON.stringify(accueilAvant)]);
  await nettoyer();
});

/** Une image du projet déposée pour de bon. */
async function image(projet: string, largeur = 1824, hauteur = 2560): Promise<string> {
  const id = randomUUID();
  const octets = Buffer.from(SCENE_1, "base64");
  for (const chemin of [`${laurent.id}/${projet}/${id}.jpg`, `${laurent.id}/${projet}/${id}-v.jpg`]) {
    await service().storage.from("images").upload(chemin, octets, { contentType: "image/jpeg" });
  }
  await sql(
    "insert into public.images (id, projet_id, enseignant_id, chemin, chemin_vignette, largeur, hauteur, format) values ($1, $2, $3, $4, $5, $6, $7, 'jpeg')",
    [id, projet, laurent.id, `${laurent.id}/${projet}/${id}.jpg`, `${laurent.id}/${projet}/${id}-v.jpg`, largeur, hauteur],
  );
  return id;
}

/** Un livre publié dans la bibliothèque, pour les 8 à 10 ans, avec ou sans couverture dans sa version. */
async function publie(titre: string, avecCouverture: boolean): Promise<{ projet: string; adresse: string; couverture: string | null }> {
  const projet = await creerProjet(laurent, "personnel", "choix", titre);
  const adresse = `${titre.normalize("NFD").toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}-${randomUUID().slice(0, 6)}`;
  const couverture = avecCouverture ? await image(projet.id) : null;
  const version = {
    titre, aChoix: true, passages: [], images: couverture ? { [couverture]: { largeur: 1824, hauteur: 2560 } } : {},
    couverture: couverture ? { id: couverture, largeur: 1824, hauteur: 2560, textes: [titre] } : null,
  };
  await sql(
    `insert into public.publications (projet_id, enseignant_id, adresse, version, presentation, age, empreinte, publiee_le, mise_a_jour_le)
     values ($1, $2, $3, $4::jsonb, 'Une histoire.', '8-10', repeat('a', 32), now(), now())`,
    [projet.id, laurent.id, adresse, JSON.stringify(version)],
  );
  return { projet: projet.id, adresse, couverture };
}

describe("Où la couverture se montre (F11-AC114)", () => {
  it("F11-AC114 — la bibliothèque et l'accueil montrent la couverture de la version publiée, servie par l'adresse du livre ; sans elle, la page de titre", async () => {
    const avec = await publie("La lanterne", true);
    const sans = await publie("Le moulin", false);
    const tous = (await livresPublies())!;
    expect(tous.find((l) => l.adresse === avec.adresse)).toMatchObject({ couverture: `/images/publie/${avec.adresse}/${avec.couverture}?v=1`, couvertureId: avec.couverture });
    expect(tous.find((l) => l.adresse === sans.adresse)).toMatchObject({ couverture: null });

    await sql("update public.reglages_application set livres_de_l_accueil = $1::jsonb", [JSON.stringify([{ projet: avec.projet }, { projet: sans.projet }])]);
    const accueil = await livresDeLAccueil();
    expect(accueil.map((l) => l.couverture)).toEqual([`/images/publie/${avec.adresse}/${avec.couverture}?v=1`, null]);
    expect((await livresAChoisir()).find((l) => l.projet === avec.projet)?.couverture).toBe(`/images/publie/${avec.adresse}/${avec.couverture}?v=1`);
  });

  it("F11-AC114 — « Lire » côté élève : la couverture d'un livre de la bibliothèque et d'un livre partagé « À mes classes »", async () => {
    await sql("insert into public.projets (enseignant_id, organisation, recit, titre, classe_id, age_des_lecteurs) values ($1, 'classe', 'choix', 'Notre livre', $2, '8-10')", [laurent.id, cm1.id]);
    const autre = await creerEnseignant("M. Martin");
    const projetMartin = await creerProjet(autre, "personnel", "choix", "Le phare");
    const id = randomUUID();
    await sql(
      `insert into public.publications (projet_id, enseignant_id, adresse, version, presentation, age, empreinte, publiee_le, mise_a_jour_le)
       values ($1, $2, $3, $4::jsonb, 'Une histoire.', '8-10', repeat('a', 32), now(), now())`,
      [projetMartin.id, autre.id, `le-phare-${id.slice(0, 6)}`, JSON.stringify({ titre: "Le phare", aChoix: true, passages: [], images: {}, couverture: { id, largeur: 1824, hauteur: 2560, textes: null } })],
    );

    // Un livre de Mme Laurent partagé « À mes classes », avec sa couverture
    const projet = await creerProjet(laurent, "classe", "choix", "La lanterne du passeur", cm1.id);
    const { chapitreId } = await creerPartie(laurent, projet.id, "Le fleuve", "Le quai");
    const scene = await creerScene(laurent.base, chapitreId);
    await laurent.base.from("projets").update({ depart_scene_id: scene.id }).eq("id", projet.id);
    const { data } = await laurent.base.from("scenes").select("version").eq("id", scene.id).single();
    await laurent.base.rpc("enregistrer_texte", { p_scene: scene.id, p_version: data!.version, p_texte: [{ type: "p", id: randomUUID(), children: [{ text: "La lanterne s’allume." }] }] });
    await laurent.base.from("scenes").update({ fin: true }).eq("id", scene.id);
    await sql("update public.scenes set etat = 'prete' where projet_id = $1", [projet.id]);
    await sql("update public.projets set mise_en_page_ouverte_le = now(), mise_en_page_convient_le = now(), imprimer_ouvert_le = now() where id = $1", [projet.id]);
    const couverture = await image(projet.id);
    await laurent.base.from("projets").update({ couverture_id: couverture }).eq("id", projet.id);
    expect(await ouvrirCanal(enseignantDe(laurent), projet.id, "classes", true)).toEqual({ ok: true });

    const poste = (await ouvrirPoste(cm1.id))!;
    expect(await identifier(poste, alice.inscriptionId)).toBe(true);
    const base = await poste.base();
    const livres = (await base.rpc("livres_du_poste")).data as { projet_id: string; couverture: string | null }[];
    expect(livres.find((l) => l.projet_id === projet.id)?.couverture).toBe(couverture);
    const bibliotheque = (await base.rpc("bibliotheque_du_poste")).data as { titre: string; couverture: string | null }[];
    expect(bibliotheque.find((l) => l.titre === "Le phare")?.couverture).toBe(id);
  });
});

describe("Les faces avant de l'accueil deviennent des couvertures (F11-AC117)", () => {
  it("F11-AC117 — la conversion pose chaque face avant déposée en couverture de son projet et de sa version publiée, puis l'efface ; une couverture déjà là reste", async () => {
    const sans = await publie("Le gué", false);
    const deja = await publie("La rive", true);
    await sql("update public.projets set couverture_id = $2 where id = $1", [deja.projet, deja.couverture]);
    const faceAvant = await sharp({ create: { width: 666, height: 940, channels: 3, background: "#0000c0" } }).webp().toBuffer();
    const chemins = [`accueil/${sans.projet}-essai.webp`, `accueil/${deja.projet}-essai.webp`];
    for (const c of chemins) await service().storage.from("images").upload(c, faceAvant, { contentType: "image/webp", upsert: true });
    await sql("update public.reglages_application set livres_de_l_accueil = $1::jsonb", [
      JSON.stringify([{ projet: sans.projet, couverture: chemins[0] }, { projet: deja.projet, couverture: chemins[1] }]),
    ]);

    execFileSync("npx", ["tsx", "scripts/couvertures-accueil.ts"], { cwd: resolve(__dirname, "../.."), stdio: "pipe" });

    const [p] = await sql<{ couverture_id: string }>("select couverture_id from public.projets where id = $1", [sans.projet]);
    expect(p.couverture_id).toBeTruthy();
    const [pub] = await sql<{ c: { id: string; largeur: number; hauteur: number; textes: null }; i: unknown }>(
      "select version->'couverture' as c, version->'images'->$2 as i from public.publications where projet_id = $1",
      [sans.projet, p.couverture_id],
    );
    expect(pub.c).toEqual({ id: p.couverture_id, largeur: 666, hauteur: 940, textes: null });
    expect(pub.i).toEqual({ largeur: 666, hauteur: 940 });
    expect((await sql<{ couverture_id: string }>("select couverture_id from public.projets where id = $1", [deja.projet]))[0].couverture_id).toBe(deja.couverture);
    const [r] = await sql<{ l: { projet: string; couverture?: string }[] }>("select livres_de_l_accueil as l from public.reglages_application");
    expect(r.l).toEqual([{ projet: sans.projet }, { projet: deja.projet }]);
    for (const c of chemins) expect((await service().storage.from("images").download(c)).data).toBeNull();
  });
});
