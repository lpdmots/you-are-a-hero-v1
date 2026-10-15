import { describe, expect, it } from "vitest";
import { numeroter, type PlanNumerote } from "@/domaine/numeros";
import { deplacer, immobileDe, numerosDuGroupe, rangsActuels } from "@/domaine/ordre";

/**
 * Étape 6 du plan, lot 4 : les commandes d'un passage dans l'aperçu (F11.3) — monter, descendre,
 * placer après un numéro —, le passage restant dans son groupe de mélange.
 */

const s = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/** Une partie de `n` scènes, rangées dans l'ordre de leur création ; la première est le départ. */
function livre(n: number, o: { fixes?: Record<number, number>; parties?: number[] } = {}): PlanNumerote {
  const tailles = o.parties ?? [n];
  let k = 0;
  return {
    departSceneId: s(1),
    parties: tailles.map((taille, pi) => ({
      id: `p${pi}`,
      groupeAvecPrecedente: false,
      ouvertureSceneId: null,
      chapitres: [
        {
          horsLivre: false,
          scenes: Array.from({ length: taille }, () => {
            k += 1;
            return { id: s(k), horsLivre: false, rangLivre: k, numeroFixe: o.fixes?.[k] ?? null };
          }),
        },
      ],
    })),
  };
}
/** Le plan après un déplacement : les rangs gardés récrits. */
const apres = (plan: PlanNumerote, rangs: Record<string, number>): PlanNumerote => ({
  ...plan,
  parties: plan.parties.map((p) => ({ ...p, chapitres: p.chapitres.map((c) => ({ ...c, scenes: c.scenes.map((x) => (x.id in rangs ? { ...x, rangLivre: rangs[x.id] } : x)) })) })),
});
const numeroDe = (plan: PlanNumerote, n: number) => numeroter(plan).de.get(s(n));

describe("Déplacer un passage (F11.3)", () => {
  it("F11-AC42, F11-AC09 — le passage 31 placé après le n° 12 devient le n° 13 ; 13 à 30 deviennent 14 à 31", () => {
    const plan = livre(40);
    const r = deplacer(plan, s(31), { sorte: "apres", numero: 12 });
    expect(r).toMatchObject({ ok: true, avant: 31, apres: 13 });
    if (!r.ok) return;
    const nouveau = apres(plan, r.rangs);
    expect(numeroDe(nouveau, 13)).toBe(14);
    expect(numeroDe(nouveau, 30)).toBe(31);
    expect(numeroDe(nouveau, 12)).toBe(12);
    expect(numeroDe(nouveau, 32)).toBe(32);
  });

  it("F11-AC43 — le n° 12 fixé garde son numéro quand le 10 passe après le 14, et ne se déplace pas", () => {
    const plan = livre(20, { fixes: { 12: 12 } });
    expect(immobileDe(plan, s(12))).toBe("fixe");
    expect(deplacer(plan, s(12), { sorte: "monter" })).toMatchObject({ ok: false, refus: "Son numéro est fixé : il garde sa place." });
    const r = deplacer(plan, s(10), { sorte: "apres", numero: 14 });
    expect(r).toMatchObject({ ok: true, avant: 10, apres: 14 });
    if (!r.ok) return;
    const nouveau = apres(plan, r.rangs);
    expect(numeroDe(nouveau, 12)).toBe(12);
    expect(numeroDe(nouveau, 11)).toBe(10);
    expect(numeroDe(nouveau, 13)).toBe(11);
    expect(numeroDe(nouveau, 14)).toBe(13);
  });

  it("monter et descendre d'un rang échangent deux voisins ; autour d'un numéro fixé, le passage le saute", () => {
    const plan = livre(10, { fixes: { 5: 5 } });
    const monte = deplacer(plan, s(4), { sorte: "monter" });
    expect(monte).toMatchObject({ ok: true, avant: 4, apres: 3 });
    const descend = deplacer(plan, s(4), { sorte: "descendre" });
    expect(descend).toMatchObject({ ok: true, avant: 4, apres: 6 });
    // Le départ ne bouge pas ; le passage 2 est le premier qui se déplace
    expect(immobileDe(plan, s(1))).toBe("depart");
    expect(deplacer(plan, s(2), { sorte: "monter" })).toMatchObject({ ok: false });
    expect(deplacer(plan, s(10), { sorte: "descendre" })).toMatchObject({ ok: false });
  });

  it("F11-AC45 — annuler rend l'ordre, les numéros et donc les renvois d'avant", () => {
    const plan = livre(40);
    const r = deplacer(plan, s(31), { sorte: "apres", numero: 12 });
    if (!r.ok) throw new Error(r.refus);
    const avant = rangsActuels(plan, Object.keys(r.rangs));
    const annule = apres(apres(plan, r.rangs), avant);
    expect([...numeroter(annule).de]).toEqual([...numeroter(plan).de]);
  });

  it("le passage reste dans son groupe de mélange : un numéro d'une autre partie est refusé, avec les bornes", () => {
    const plan = livre(12, { parties: [6, 6] });
    expect(numerosDuGroupe(plan, s(9))).toEqual({ min: 7, max: 12 });
    expect(deplacer(plan, s(9), { sorte: "apres", numero: 3 })).toMatchObject({ ok: false, refus: "Choisissez un numéro de sa partie, du 7 au 12." });
    // L'ouverture de la partie 2 reste en tête de son groupe
    expect(immobileDe(plan, s(7))).toBe("ouverture");
    const r = deplacer(plan, s(12), { sorte: "apres", numero: 7 });
    expect(r).toMatchObject({ ok: true, avant: 12, apres: 8 });
    if (!r.ok) return;
    // Rien ne change dans la partie 1
    expect(Object.keys(r.rangs).every((id) => Number(id.slice(-12)) > 6)).toBe(true);
  });
});
