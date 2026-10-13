import "server-only";
import { estEtat, sEcrit } from "@/domaine/etats";
import { rangerMonTravail, type SceneDeTravail } from "@/domaine/travail";
import { clientDuPoste } from "./poste";
import type { ContexteEleve } from "./recit-eleve";

/**
 * « Mon travail » (F06.5, 13 octobre 2026) : les scènes dont l'élève s'occupe, dans ses
 * chapitres, et ce qu'il reste à prendre dans chacun. Tout passe par l'accès du poste :
 * la base ne rend que les scènes de ses chapitres (F06-AC33).
 */
export type MonTravail = {
  /** Ses scènes, par urgence, puis dans l'ordre du plan */
  scenes: SceneDeTravail[];
  /** Par chapitre, les scènes sans élève qui s'écrivent encore (F06-AC96) */
  aPrendre: { chapitreId: string; chapitre: string; nombre: number }[];
  /** Ses chapitres, dans l'ordre du plan */
  chapitres: { id: string; titre: string }[];
};

export async function monTravail(c: ContexteEleve): Promise<MonTravail> {
  const base = await clientDuPoste(c.poste);
  const { data: attributions, error } = await base.from("attributions").select("chapitre_id").eq("eleve_id", c.moi.id);
  if (error) throw new Error(`Mon travail illisible : ${error.message}`);
  const ids = ((attributions ?? []) as { chapitre_id: string }[]).map((a) => a.chapitre_id);
  if (ids.length === 0) return { scenes: [], aPrendre: [], chapitres: [] };
  const [chapitres, parties, scenes, ...arrets] = await Promise.all([
    base.from("chapitres").select("id, partie_id, titre, rang").in("id", ids),
    base.from("parties").select("id, rang"),
    base
      .from("scenes")
      .select("id, chapitre_id, reference, titre, rang, etat, texte_vide, prise_par_eleve, prise_par_enseignant")
      .in("chapitre_id", ids),
    ...ids.map((id) => base.rpc("scenes_ou_je_suis_arrete", { p_chapitre: id })),
  ]);
  const illisible = chapitres.error ?? parties.error ?? scenes.error;
  if (illisible) throw new Error(`Mon travail illisible : ${illisible.message}`);
  const arrete = new Set(arrets.flatMap((r) => ((r.data ?? []) as unknown[]).map((x) => String(x))));
  const rangPartie = new Map(((parties.data ?? []) as { id: string; rang: number }[]).map((p) => [p.id, p.rang]));
  const lesChapitres = ((chapitres.data ?? []) as { id: string; partie_id: string; titre: string; rang: number }[]).sort(
    (a, b) => (rangPartie.get(a.partie_id) ?? 0) - (rangPartie.get(b.partie_id) ?? 0) || a.rang - b.rang,
  );
  const placeDuChapitre = new Map(lesChapitres.map((ch, i) => [ch.id, i]));
  const titre = new Map(lesChapitres.map((ch) => [ch.id, ch.titre]));
  type Ligne = {
    id: string; chapitre_id: string; reference: number; titre: string | null; rang: number; etat: string; texte_vide: boolean;
    prise_par_eleve: string | null; prise_par_enseignant: boolean;
  };
  const lesScenes = ((scenes.data ?? []) as Ligne[]).filter((s) => placeDuChapitre.has(s.chapitre_id));
  const miennes = lesScenes
    .filter((s) => s.prise_par_eleve === c.moi.id)
    .map((s): SceneDeTravail => ({
      id: s.id, reference: s.reference, titre: s.titre, chapitreId: s.chapitre_id, chapitre: titre.get(s.chapitre_id) ?? "",
      etat: estEtat(s.etat) ? s.etat : "cours", vide: s.texte_vide !== false, arrete: arrete.has(s.id),
      ordre: (placeDuChapitre.get(s.chapitre_id) ?? 0) * 10_000 + s.rang,
    }));
  return {
    scenes: rangerMonTravail(miennes),
    aPrendre: lesChapitres.flatMap((ch) => {
      const nombre = lesScenes.filter((s) => s.chapitre_id === ch.id && !s.prise_par_eleve && !s.prise_par_enseignant && estEtat(s.etat) && sEcrit(s.etat)).length;
      return nombre ? [{ chapitreId: ch.id, chapitre: ch.titre, nombre }] : [];
    }),
    chapitres: lesChapitres.map((ch) => ({ id: ch.id, titre: ch.titre })),
  };
}
