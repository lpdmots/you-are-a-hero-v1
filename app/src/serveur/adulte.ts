import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { clientAdulte } from "./supabase";

export type Enseignant = {
  id: string;
  courriel: string | null;
  nomAffiche: string | null;
  dernierProjetId: string | null;
  aidesMasquees: string[];
  supabase: SupabaseClient;
};

/** L'adulte connecté, ou null. Le jeton est vérifié, jamais seulement lu dans le cookie. */
export const enseignantCourant = cache(async (): Promise<Enseignant | null> => {
  const supabase = await clientAdulte();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub || claims.role !== "authenticated" || claims.is_anonymous) return null;
  const { data: ligne } = await supabase
    .from("enseignants")
    .select("id, nom_affiche, dernier_projet_id, aides_masquees")
    .eq("id", claims.sub)
    .maybeSingle();
  if (!ligne) return null;
  return {
    id: ligne.id,
    courriel: typeof claims.email === "string" ? claims.email : null,
    nomAffiche: ligne.nom_affiche,
    dernierProjetId: ligne.dernier_projet_id,
    aidesMasquees: ligne.aides_masquees ?? [],
    supabase,
  };
});

/** Toute page et toute action de l'espace adulte commence ici (F01-AC28). */
export async function exigerEnseignant(): Promise<Enseignant> {
  const enseignant = await enseignantCourant();
  if (!enseignant) redirect("/entree");
  return enseignant;
}

/** Nom que lisent les élèves (F01-AC13). */
export const nomPourLesEleves = (nomAffiche: string | null | undefined): string =>
  nomAffiche?.trim() || "ton enseignant(e)";

/**
 * La session vient-elle du lien « Mot de passe oublié » ? Le mot de passe ne se choisit
 * que là : une session laissée ouverte sur un poste ne suffit pas à le changer.
 */
export async function sessionDeRecuperation(): Promise<boolean> {
  const supabase = await clientAdulte();
  const { data } = await supabase.auth.getClaims();
  const methodes = (data?.claims?.amr ?? []) as ({ method?: string } | string)[];
  return !!data?.claims?.sub && methodes.some((m) => (typeof m === "string" ? m : m.method) === "recovery");
}
