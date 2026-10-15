import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerEnseignant, creerPartie, creerProjet, creerScene, nettoyer, sql, type Adulte } from "./outils";

/**
 * Étape 6 du plan, lot 4 : contre la vraie base locale, ce que les commandes d'un passage
 * écrivent — les rangs gardés de son groupe (F11.3), la nouvelle page (F11-AC10), la
 * déclaration « La mise en page me convient » (F11.6) — et qui peut l'écrire.
 */

let laurent: Adulte;
let martin: Adulte;

beforeAll(async () => {
  laurent = await creerEnseignant("Mme Laurent");
  martin = await creerEnseignant("M. Martin");
});
afterAll(nettoyer);

async function livre() {
  const projet = await creerProjet(laurent, "personnel", "choix", "Le phare", null);
  const { chapitreId } = await creerPartie(laurent, projet.id, "La côte", "La plage");
  const scenes = [await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId), await creerScene(laurent.base, chapitreId)];
  return { projet: projet.id, scenes: scenes.map((s) => s.id) };
}

describe("Rangs gardés et ajustements (F11.3)", () => {
  it("placer_passages refuse tant que l'ordre du livre n'est pas établi, puis récrit les rangs d'un coup", async () => {
    const l = await livre();
    const rangs = { [l.scenes[0]]: 2, [l.scenes[1]]: 0, [l.scenes[2]]: 1 };
    const avant = await laurent.base.rpc("placer_passages", { p_projet: l.projet, p_rangs: rangs });
    expect(avant.error?.message).toBe("L'ordre du livre n'est pas encore établi.");
    await sql("update public.projets set ordre_etabli_le = now() where id = $1", [l.projet]);
    const fait = await laurent.base.rpc("placer_passages", { p_projet: l.projet, p_rangs: rangs });
    expect(fait.data).toBe(3);
    const lus = await sql<{ id: string; rang_livre: number }>("select id, rang_livre from public.scenes where projet_id = $1", [l.projet]);
    expect(Object.fromEntries(lus.map((x) => [x.id, x.rang_livre]))).toEqual(rangs);
  });

  it("un autre adulte ne déplace rien, ni ne règle une nouvelle page, ni ne déclare la mise en page", async () => {
    const l = await livre();
    await sql("update public.projets set ordre_etabli_le = now() where id = $1", [l.projet]);
    await martin.base.rpc("placer_passages", { p_projet: l.projet, p_rangs: { [l.scenes[0]]: 9 } });
    await martin.base.from("scenes").update({ nouvelle_page: true }).eq("id", l.scenes[0]);
    await martin.base.from("projets").update({ mise_en_page_convient_le: new Date().toISOString() }).eq("id", l.projet);
    const [s] = await sql<{ rang_livre: number | null; nouvelle_page: boolean }>("select rang_livre, nouvelle_page from public.scenes where id = $1", [l.scenes[0]]);
    expect(s).toEqual({ rang_livre: null, nouvelle_page: false });
    const [p] = await sql<{ mise_en_page_convient_le: string | null }>("select mise_en_page_convient_le from public.projets where id = $1", [l.projet]);
    expect(p.mise_en_page_convient_le).toBeNull();
  });

  it("F11-AC10 — la nouvelle page se garde avec la scène, réglée par son adulte", async () => {
    const l = await livre();
    const { error } = await laurent.base.from("scenes").update({ nouvelle_page: true }).eq("id", l.scenes[1]);
    expect(error).toBeNull();
    const [s] = await sql<{ nouvelle_page: boolean }>("select nouvelle_page from public.scenes where id = $1", [l.scenes[1]]);
    expect(s.nouvelle_page).toBe(true);
  });
});
