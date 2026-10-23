import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { lireOffre, type Limites, type Offre } from "@/domaine/offre";
import { clientService } from "./supabase";

/** Les réglages de l'offre, lisibles de tous (F14-AC21). */
export async function offreActuelle(base: SupabaseClient = clientService()): Promise<Offre> {
  const { data } = await base.from("reglages_application").select("*").maybeSingle();
  return lireOffre(data);
}

/**
 * Les projets de l'adulte qui ont leur pass, pour la marque de « Mes projets » : vide tant que
 * « Paiement ouvert » est éteint et pour le porteur, dont les projets n'ont pas de limite.
 */
export async function projetsAvecPass(base: SupabaseClient, createur: boolean): Promise<Set<string>> {
  if (createur || !(await offreActuelle()).paiementOuvert) return new Set();
  const { data } = await base.from("passes").select("projet_id");
  return new Set((data ?? []).map((p) => p.projet_id as string));
}

/** Où en est un projet de l'adulte au regard des limites gratuites ; null s'il n'est pas le sien. */
export async function limitesDuProjet(base: SupabaseClient, projetId: string): Promise<Limites | null> {
  const [{ data, error }, { data: pass }] = await Promise.all([
    base.rpc("limites_du_projet", { p_projet: projetId }),
    base.from("passes").select("obtenu_le").eq("projet_id", projetId).maybeSingle(),
  ]);
  const ligne = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
  if (error || !ligne) return null;
  return {
    limite: ligne.limite === true,
    pass: ligne.pass === true,
    passLe: (pass?.obtenu_le as string | undefined) ?? null,
    scenes: Number(ligne.scenes ?? 0),
    scenesGratuites: Number(ligne.scenes_gratuites ?? 40),
    images: Number(ligne.images ?? 0),
    imagesGratuites: Number(ligne.images_gratuites ?? 10),
  };
}
