import "server-only";
import { headers } from "next/headers";
import { env } from "./env";
import { empreinte } from "./jetons";
import { clientService } from "./supabase";
import { ADRESSE_VALIDE } from "@/domaine/bibliotheque";

/**
 * Les cœurs de la bibliothèque (F15, « Les cœurs » ; F15-AC13), sans compte : le navigateur tire
 * un identifiant au hasard et le garde pour lui ; la base n'en garde que l'empreinte, salée par la
 * clé de l'application, comme celle de l'adresse réseau, qui sert à la seule limite par jour. Une
 * limite atteinte ne dit rien au lecteur : son cœur ne compte pas, c'est tout.
 */

/** Au-delà, depuis une même adresse réseau, pour un même livre et dans la journée, les cœurs ne comptent plus. */
export const COEURS_PAR_RESEAU = 40;

/** L'identifiant tiré par le navigateur : 16 à 64 signes sûrs ; rien d'autre n'est accepté. */
const LECTEUR = /^[A-Za-z0-9_-]{16,64}$/;

export type Coeur = { ok: true; coeurs: number; donne: boolean } | { ok: false };

async function reseau(): Promise<string> {
  const entetes = await headers();
  const adresse = (entetes.get("x-forwarded-for") ?? "").split(",")[0].trim() || entetes.get("x-real-ip") || "inconnue";
  return `r:${empreinte(`${adresse}|coeurs|${env.cleAcces}`)}`;
}

/** Donner (oui) ou retirer (non) le cœur d'un lecteur sans compte à un livre publié. */
export async function donnerUnCoeur(adresse: unknown, lecteur: unknown, oui: unknown): Promise<Coeur> {
  if (typeof adresse !== "string" || !ADRESSE_VALIDE.test(adresse) || typeof lecteur !== "string" || !LECTEUR.test(lecteur) || typeof oui !== "boolean") return { ok: false };
  const { data, error } = await clientService().rpc("donner_un_coeur", {
    p_adresse: adresse, p_lecteur: `n:${empreinte(`${lecteur}|${env.cleAcces}`)}`, p_reseau: await reseau(), p_oui: oui, p_limite: COEURS_PAR_RESEAU,
  });
  const r = data as { etat: string; coeurs?: number; donne?: boolean } | null;
  if (error || !r || r.etat === "absent") return { ok: false };
  return { ok: true, coeurs: r.coeurs ?? 0, donne: r.donne === true };
}

/** Le cœur de ce lecteur est-il donné ? Pour l'état du bouton, à l'ouverture du tiroir. */
export async function coeurDonne(adresse: string, lecteur: string): Promise<boolean> {
  if (!ADRESSE_VALIDE.test(adresse) || !LECTEUR.test(lecteur)) return false;
  const base = clientService();
  const { data: pub } = await base.from("publications").select("projet_id").eq("adresse", adresse).maybeSingle();
  if (!pub) return false;
  const { data } = await base.from("coeurs").select("projet_id").eq("projet_id", pub.projet_id).eq("lecteur", `n:${empreinte(`${lecteur}|${env.cleAcces}`)}`).maybeSingle();
  return Boolean(data);
}
