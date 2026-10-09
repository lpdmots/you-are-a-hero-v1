import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { chiffrer, dechiffrer } from "@/serveur/chiffrement";
import {
  creerClasse, creerEnseignant, etat, identifier, inscriptionVueParLaBase, inscrire, nettoyer, ouvrirPoste, service, sql,
  type Adulte, type ClasseEssai, type EleveEssai,
} from "./outils";

let laurent: Adulte;
let classe: ClasseEssai;
let alice: EleveEssai, bilal: EleveEssai;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  classe = await creerClasse(laurent);
  [alice, bilal] = await inscrire(laurent, classe.id, ["Alice Martin", "Bilal Haddad"]);
});
afterAll(nettoyer);

const inscriptionDuPoste = inscriptionVueParLaBase;

describe("Accès de classe, puis accès individuel (F06.4)", () => {
  it("F06-AC43 — la classe ouverte donne le choix des profils, pas encore le travail d'un élève", async () => {
    const poste = (await ouvrirPoste(classe.id))!;
    expect(await etat(poste)).toMatchObject({ classe_id: classe.id, inscription_id: null, eleve_id: null });
    const base = await poste.base();
    expect((await base.from("eleves").select("prenom").order("prenom")).data?.map((e) => e.prenom)).toEqual(["Alice", "Bilal"]);
    expect(await inscriptionDuPoste(poste.id)).toBeNull();
    // Les informations de classe ne donnent aucun accès enseignant
    expect((await base.from("projets").select("id")).error?.code).toBe("42501");
  });

  it("F06-AC15 — changer d'élève termine l'accès individuel et garde la classe ; F06-AC16 — l'identité est celle du nouvel élève", async () => {
    const poste = (await ouvrirPoste(classe.id))!;
    expect(await identifier(poste, alice.inscriptionId)).toBe(true);
    expect((await etat(poste))?.eleve_id).toBe(alice.id);
    expect(await inscriptionDuPoste(poste.id)).toBe(alice.inscriptionId);

    await service().rpc("changer_eleve", { p_poste: poste.id });
    expect(await etat(poste)).toMatchObject({ classe_id: classe.id, inscription_id: null });
    expect(await inscriptionDuPoste(poste.id)).toBeNull();

    expect(await identifier(poste, bilal.inscriptionId)).toBe(true);
    expect((await etat(poste))?.eleve_id).toBe(bilal.id);
    expect(await inscriptionDuPoste(poste.id)).toBe(bilal.inscriptionId);
  });

  it("un élève d'une autre classe ne s'identifie pas sur ce poste", async () => {
    const autre = await creerClasse(laurent, "CE2");
    const [zoe] = await inscrire(laurent, autre.id, ["Zoé"]);
    const poste = (await ouvrirPoste(classe.id))!;
    expect(await identifier(poste, zoe.inscriptionId)).toBe(false);
    expect((await etat(poste))?.inscription_id).toBeNull();
  });

  it("F06-AC44 — quitter la classe ne laisse aucun accès sur le poste", async () => {
    const poste = (await ouvrirPoste(classe.id))!;
    await identifier(poste, alice.inscriptionId);
    await service().rpc("quitter_classe", { p_poste: poste.id });
    expect(await etat(poste)).toBeNull();
    expect((await (await poste.base()).from("classes").select("id")).data).toEqual([]);
    expect((await (await poste.base()).from("eleves").select("id")).data).toEqual([]);
  });

  it("F06-AC75, F06-AC82 — la classe se ferme à 3 h, heure de Paris", async () => {
    const fermeture = async (instant: string) =>
      (await sql<{ f: Date }>("select prive.fermeture_nocturne($1::timestamptz, 'Europe/Paris') as f", [instant]))[0].f.toISOString();
    // Lundi 12 octobre 2026, 16 h à Paris (heure d'été) : fermeture mardi à 3 h, soit 1 h UTC
    expect(await fermeture("2026-10-12T16:00:00+02:00")).toBe("2026-10-13T01:00:00.000Z");
    // Ouverte à 2 h 59 : elle ferme une minute plus tard ; ouverte à 3 h : le lendemain
    expect(await fermeture("2026-10-13T02:59:00+02:00")).toBe("2026-10-13T01:00:00.000Z");
    expect(await fermeture("2026-10-13T03:00:00+02:00")).toBe("2026-10-14T01:00:00.000Z");
    // En hiver, 3 h à Paris, c'est 2 h UTC
    expect(await fermeture("2026-12-01T16:00:00+01:00")).toBe("2026-12-02T02:00:00.000Z");

    const poste = (await ouvrirPoste(classe.id))!;
    const [{ expire_le }] = await sql<{ expire_le: Date }>("select expire_le from postes where id = $1", [poste.id]);
    expect(expire_le.getTime()).toBeGreaterThan(Date.now());
    expect(expire_le.getTime()).toBeLessThanOrEqual(Date.now() + 24 * 3600 * 1000);
    expect(new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" }).format(expire_le)).toBe("03:00");

    // Le lendemain matin : l'heure de fermeture est passée, la liste des profils ne se lit plus
    await sql("update postes set expire_le = now() - interval '1 minute' where id = $1", [poste.id]);
    expect(await etat(poste)).toBeNull();
    expect((await (await poste.base()).from("eleves").select("id")).data).toEqual([]);
  });

  it("F06-AC76 — deux heures sans activité terminent l'accès de l'élève ; une heure, non", async () => {
    const poste = (await ouvrirPoste(classe.id))!;
    await identifier(poste, alice.inscriptionId);

    await sql("update postes set actif_le = now() - interval '1 hour' where id = $1", [poste.id]);
    expect((await etat(poste))?.eleve_id).toBe(alice.id);
    expect(await inscriptionDuPoste(poste.id)).toBe(alice.inscriptionId);

    await sql("update postes set actif_le = now() - interval '2 hours 1 minute' where id = $1", [poste.id]);
    // La base ne reconnaît plus l'élève, avant même que le serveur ne s'en aperçoive
    expect(await inscriptionDuPoste(poste.id)).toBeNull();
    expect(await etat(poste)).toMatchObject({ classe_id: classe.id, inscription_id: null });

    // Une activité notée prolonge l'accès
    await identifier(poste, alice.inscriptionId);
    await sql("update postes set actif_le = now() - interval '1 hour 59 minutes' where id = $1", [poste.id]);
    await service().rpc("noter_activite", { p_poste: poste.id });
    const [{ recent }] = await sql<{ recent: boolean }>("select actif_le > now() - interval '1 minute' as recent from postes where id = $1", [poste.id]);
    expect(recent).toBe(true);
  });

  it("F06-AC68, F06-AC77 — mot de passe remplacé : les postes ouverts se ferment, les codes ne changent pas", async () => {
    const c = await creerClasse(laurent, "CM2", 2026, "tigre nuage 42");
    const [eleve] = await inscrire(laurent, c.id, ["Alice"]);
    const postes = await Promise.all(Array.from({ length: 3 }, () => ouvrirPoste(c.id)));
    await identifier(postes[0]!, eleve.inscriptionId);
    const codeAvant = (await laurent.base.from("eleves_secrets").select("code_chiffre").eq("eleve_id", eleve.id).single()).data!.code_chiffre;

    const { error } = await laurent.base
      .from("classes_secrets")
      .update({ mot_de_passe_chiffre: chiffrer("moulin castor 58", { sorte: "classe", id: c.id }) })
      .eq("classe_id", c.id);
    expect(error).toBeNull();

    for (const poste of postes) {
      expect(await etat(poste!)).toBeNull();
      expect((await (await poste!.base()).from("classes").select("id")).data).toEqual([]);
    }
    const garde = (await laurent.base.from("classes_secrets").select("mot_de_passe_chiffre").eq("classe_id", c.id).single()).data!.mot_de_passe_chiffre;
    expect(dechiffrer(garde, { sorte: "classe", id: c.id })).toBe("moulin castor 58");
    expect((await laurent.base.from("eleves_secrets").select("code_chiffre").eq("eleve_id", eleve.id).single()).data!.code_chiffre).toBe(codeAvant);
    // Un poste rouvert avec le nouveau mot de passe tient
    expect(await etat((await ouvrirPoste(c.id))!)).not.toBeNull();
  });

  it("F06-AC78 — élève retiré : son poste revient au choix des profils, où il ne figure plus", async () => {
    const c = await creerClasse(laurent, "CM1");
    const [a, b] = await inscrire(laurent, c.id, ["Alice", "Bilal"]);
    const posteBilal = (await ouvrirPoste(c.id))!;
    const posteAlice = (await ouvrirPoste(c.id))!;
    await identifier(posteBilal, b.inscriptionId);
    await identifier(posteAlice, a.inscriptionId);

    expect((await laurent.base.from("inscriptions").update({ retire_le: new Date().toISOString() }).eq("id", b.inscriptionId)).error).toBeNull();

    expect(await inscriptionDuPoste(posteBilal.id)).toBeNull();
    expect(await etat(posteBilal)).toMatchObject({ classe_id: c.id, inscription_id: null });
    expect((await (await posteBilal.base()).from("eleves").select("prenom")).data).toEqual([{ prenom: "Alice" }]);
    expect(await identifier(posteBilal, b.inscriptionId)).toBe(false);
    // Alice, elle, continue
    expect((await etat(posteAlice))?.eleve_id).toBe(a.id);

    // « Annuler » : Bilal revient au choix des prénoms, avec le même code
    await laurent.base.from("inscriptions").update({ retire_le: null }).eq("id", b.inscriptionId);
    expect(await identifier(posteBilal, b.inscriptionId)).toBe(true);
  });

  it("F06-AC24, F06-AC79 — code remplacé : la séance en cours continue, le nouveau code est le seul gardé", async () => {
    const c = await creerClasse(laurent, "CM1");
    const [a] = await inscrire(laurent, c.id, ["Alice"]);
    const poste = (await ouvrirPoste(c.id))!;
    await identifier(poste, a.inscriptionId);

    const { error } = await laurent.base.from("eleves_secrets").update({ code_chiffre: chiffrer("8052", { sorte: "code", id: a.id }) }).eq("eleve_id", a.id);
    expect(error).toBeNull();

    expect((await etat(poste))?.eleve_id).toBe(a.id);
    expect(await inscriptionDuPoste(poste.id)).toBe(a.inscriptionId);
    const garde = (await laurent.base.from("eleves_secrets").select("code_chiffre").eq("eleve_id", a.id).single()).data!.code_chiffre;
    expect(dechiffrer(garde, { sorte: "code", id: a.id })).toBe("8052");
    expect(garde).not.toContain(a.code);
    expect((await laurent.base.from("eleves").select("prenom").eq("id", a.id).single()).data?.prenom).toBe("Alice");
  });
});

describe("Essais faux (F06.4, 8 et 9 octobre 2026)", () => {
  const fautes = async (eleve: string, n: number) => {
    let dernier: string | null = null;
    for (let i = 0; i < n; i += 1) dernier = (await service().rpc("noter_code_faux", { p_eleve: eleve })).data as string | null;
    return dernier;
  };
  const blocage = async (eleve: string) =>
    (await sql<{ bloque: boolean; essais_faux: number }>("select coalesce(bloque_jusqua > now(), false) as bloque, essais_faux from eleves_secrets where eleve_id = $1", [eleve]))[0];

  it("F06-AC73 — cinq codes faux de suite : deux minutes d'attente pour ce profil seulement", async () => {
    const c = await creerClasse(laurent, "CM1");
    const [b, a] = await inscrire(laurent, c.id, ["Bilal", "Alice"]);

    expect(await fautes(b.id, 4)).toBeNull();
    expect((await blocage(b.id)).bloque).toBe(false);
    const jusqua = await fautes(b.id, 1);
    expect(jusqua).not.toBeNull();
    const attente = new Date(jusqua!).getTime() - Date.now();
    expect(attente).toBeGreaterThan(110_000);
    expect(attente).toBeLessThanOrEqual(120_000);
    expect((await blocage(b.id)).bloque).toBe(true);
    // Alice, sur le poste voisin, n'attend pas
    expect(await blocage(a.id)).toEqual({ bloque: false, essais_faux: 0 });

    // Deux minutes plus tard : le bon code est accepté, et le compte repart de zéro
    await sql("update eleves_secrets set bloque_jusqua = now() - interval '1 second' where eleve_id = $1", [b.id]);
    expect((await blocage(b.id)).bloque).toBe(false);
    const poste = (await ouvrirPoste(c.id))!;
    expect(await identifier(poste, b.inscriptionId)).toBe(true);
    expect(await blocage(b.id)).toEqual({ bloque: false, essais_faux: 0 });
  });

  it("F06-AC73 — l'attente ne s'allonge pas d'une fois sur l'autre", async () => {
    const c = await creerClasse(laurent, "CM1");
    const [b] = await inscrire(laurent, c.id, ["Bilal"]);
    await fautes(b.id, 5);
    await sql("update eleves_secrets set bloque_jusqua = now() - interval '1 second' where eleve_id = $1", [b.id]);
    expect(await fautes(b.id, 4)).toBeNull();
    const jusqua = await fautes(b.id, 1);
    expect(new Date(jusqua!).getTime() - Date.now()).toBeLessThanOrEqual(120_000);
  });

  it("F06-AC73 — un bon code entre deux codes faux remet le compte à zéro", async () => {
    const c = await creerClasse(laurent, "CM1");
    const [b] = await inscrire(laurent, c.id, ["Bilal"]);
    await fautes(b.id, 4);
    await identifier((await ouvrirPoste(c.id))!, b.inscriptionId);
    expect(await fautes(b.id, 4)).toBeNull();
    expect((await blocage(b.id)).bloque).toBe(false);
  });

  const cles = () => ({ navigateur: `n:${randomBytes(8).toString("hex")}`, reseau: `r:${randomBytes(8).toString("hex")}` });
  const entreeFausse = async (navigateur: string, reseau: string, n: number) => {
    let dernier: string | null = null;
    for (let i = 0; i < n; i += 1) dernier = (await service().rpc("noter_entree_fausse", { p_navigateur: navigateur, p_reseau: reseau })).data as string | null;
    return dernier;
  };
  const bloquee = async (navigateur: string, reseau: string) =>
    (await service().rpc("entree_bloquee_jusqua", { p_navigateur: navigateur, p_reseau: reseau })).data as string | null;

  it("F06-AC74 — dix essais faux depuis un poste : cinq minutes d'attente sur ce poste, pas sur un autre", async () => {
    const poste = cles();
    const voisin = { navigateur: cles().navigateur, reseau: poste.reseau }; // même école, autre ordinateur
    expect(await entreeFausse(poste.navigateur, poste.reseau, 9)).toBeNull();
    expect(await bloquee(poste.navigateur, poste.reseau)).toBeNull();
    const jusqua = await entreeFausse(poste.navigateur, poste.reseau, 1);
    const attente = new Date(jusqua!).getTime() - Date.now();
    expect(attente).toBeGreaterThan(290_000);
    expect(attente).toBeLessThanOrEqual(300_000);
    expect(await bloquee(poste.navigateur, poste.reseau)).not.toBeNull();
    expect(await bloquee(voisin.navigateur, voisin.reseau)).toBeNull();

    // Cinq minutes plus tard, le poste peut réessayer ; les bonnes informations remettent son compte à zéro
    await sql("update essais_entree set bloque_jusqua = now() - interval '1 second' where cle = $1", [poste.navigateur]);
    expect(await bloquee(poste.navigateur, poste.reseau)).toBeNull();
    await service().rpc("noter_entree_juste", { p_navigateur: poste.navigateur });
    expect(await sql("select 1 from essais_entree where cle = $1", [poste.navigateur])).toEqual([]);
  });

  it("F06-AC83 — cent essais faux en cinq minutes depuis une adresse réseau, quel que soit le navigateur", async () => {
    const reseau = cles().reseau;
    // Un navigateur neuf à chaque essai, comme quelqu'un qui efface ses données
    for (let i = 0; i < 99; i += 1) expect(await entreeFausse(cles().navigateur, reseau, 1), `essai ${i + 1}`).toBeNull();
    expect(await bloquee(cles().navigateur, reseau)).toBeNull();
    expect(await entreeFausse(cles().navigateur, reseau, 1)).not.toBeNull();
    expect(await bloquee(cles().navigateur, reseau)).not.toBeNull();
    // Depuis une autre adresse, la classe s'ouvre
    expect(await bloquee(cles().navigateur, cles().reseau)).toBeNull();
  });

  it("F06-AC83 — des essais faux étalés sur plus de cinq minutes ne bloquent pas une école", async () => {
    const reseau = cles().reseau;
    await entreeFausse(cles().navigateur, reseau, 60);
    await sql("update essais_entree set debut = now() - interval '6 minutes' where cle = $1", [reseau]);
    for (let i = 0; i < 60; i += 1) expect(await entreeFausse(cles().navigateur, reseau, 1)).toBeNull();
  });
});

describe("Horaires (F06.4)", () => {
  const ouvert = async (classeId: string, instant: string) =>
    (await sql<{ o: boolean }>("select prive.horaires_ouverts($1, $2::timestamptz) as o", [classeId, instant]))[0].o;
  const regler = (classeId: string, limites: boolean, plages: unknown[]) =>
    laurent.base.rpc("regler_horaires", { p_classe: classeId, p_limites: limites, p_plages: plages });

  it("F06-AC27 — sans horaires, l'heure ne bloque rien ; avec une plage, 18 h est fermé pour toute la classe", async () => {
    const c = await creerClasse(laurent, "CM1");
    expect(await ouvert(c.id, "2026-10-12T18:00:00+02:00")).toBe(true);
    expect((await regler(c.id, true, [{ jours: [1, 2, 3, 4, 5], de: "08:00", a: "17:00" }])).error).toBeNull();
    expect(await ouvert(c.id, "2026-10-12T18:00:00+02:00")).toBe(false);
    expect(await ouvert(c.id, "2026-10-12T10:00:00+02:00")).toBe(true);
    expect(await ouvert(c.id, "2026-10-17T10:00:00+02:00")).toBe(false); // samedi
  });

  it("F06-AC28 — fermé par l'horaire, puis de retour dans la plage : rien n'a été retiré", async () => {
    const c = await creerClasse(laurent, "CM1");
    const [a] = await inscrire(laurent, c.id, ["Alice"]);
    // Une plage qui exclut l'instant présent : seul hier est ouvert
    const hier = ((new Date().getUTCDay() + 5) % 7) + 1;
    await regler(c.id, true, [{ jours: [hier], de: "00:00", a: "00:01" }]);
    const poste = (await ouvrirPoste(c.id))!;
    await identifier(poste, a.inscriptionId);
    expect((await (await poste.base()).rpc("travail_ouvert")).data).toBe(false);
    // L'élève reste identifié et inscrit : l'horaire ne retire rien
    expect((await etat(poste))?.eleve_id).toBe(a.id);

    await regler(c.id, false, []);
    expect((await (await poste.base()).rpc("travail_ouvert")).data).toBe(true);
    expect((await etat(poste))?.eleve_id).toBe(a.id);
  });

  it("F06-AC72 — deux plages : le mercredi à 10 h est ouvert, à 14 h fermé", async () => {
    const c = await creerClasse(laurent, "CM1");
    await regler(c.id, true, [
      { jours: [1, 2, 4, 5], de: "08:30", a: "16:30" },
      { jours: [3], de: "08:30", a: "11:30" },
    ]);
    expect(await ouvert(c.id, "2026-10-14T10:00:00+02:00")).toBe(true);
    expect(await ouvert(c.id, "2026-10-14T14:00:00+02:00")).toBe(false);
    expect(await ouvert(c.id, "2026-10-15T14:00:00+02:00")).toBe(true);
    expect((await laurent.base.from("horaires").select("rang").eq("classe_id", c.id).order("rang")).data).toEqual([{ rang: 0 }, { rang: 1 }]);
  });

  it("F06-AC80 — au changement d'heure, l'accès ouvre et ferme aux mêmes heures de l'horloge", async () => {
    const c = await creerClasse(laurent, "CM1");
    await regler(c.id, true, [{ jours: [1, 2, 4, 5], de: "08:30", a: "16:30" }]);
    // Vendredi 23 octobre 2026 en heure d'été, lundi 26 en heure d'hiver
    expect(await ouvert(c.id, "2026-10-23T06:29:00Z")).toBe(false);
    expect(await ouvert(c.id, "2026-10-23T06:30:00Z")).toBe(true);
    expect(await ouvert(c.id, "2026-10-26T06:30:00Z")).toBe(false);
    expect(await ouvert(c.id, "2026-10-26T07:30:00Z")).toBe(true);
    expect(await ouvert(c.id, "2026-10-26T15:29:00Z")).toBe(true);
    expect(await ouvert(c.id, "2026-10-26T15:30:00Z")).toBe(false);
    // Vendredi 26 mars 2027 en heure d'hiver, lundi 29 en heure d'été
    expect(await ouvert(c.id, "2027-03-26T07:30:00Z")).toBe(true);
    expect(await ouvert(c.id, "2027-03-29T06:30:00Z")).toBe(true);
    expect(await ouvert(c.id, "2027-03-29T06:29:00Z")).toBe(false);
  });

  it("F06-AC31 — hors plage, l'enseignant garde son accès", async () => {
    const c = await creerClasse(laurent, "CM1");
    await inscrire(laurent, c.id, ["Alice"]);
    const hier = ((new Date().getUTCDay() + 5) % 7) + 1;
    await regler(c.id, true, [{ jours: [hier], de: "00:00", a: "00:01" }]);
    expect((await laurent.base.from("classes").select("nom").eq("id", c.id).single()).data?.nom).toBe("CM1");
    expect((await laurent.base.from("inscriptions").select("id").eq("classe_id", c.id)).data).toHaveLength(1);
  });

  it("des horaires limités demandent une plage, dont le début précède la fin", async () => {
    const c = await creerClasse(laurent, "CM1");
    expect((await regler(c.id, true, [])).error).not.toBeNull();
    expect((await regler(c.id, true, [{ jours: [1], de: "16:30", a: "08:30" }])).error).not.toBeNull();
    expect((await regler(c.id, true, [{ jours: [8], de: "08:30", a: "16:30" }])).error).not.toBeNull();
    expect((await laurent.base.from("classes").select("horaires_limites").eq("id", c.id).single()).data?.horaires_limites).toBe(false);
  });
});
