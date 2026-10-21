import "server-only";
import type { User } from "@supabase/supabase-js";

/**
 * Un compte créé par adresse a un mot de passe ; un compte ouvert par Google seul n'en a pas,
 * jusqu'à ce qu'il en choisisse un depuis « Mon compte », ce que retient `app_metadata`
 * (que seul le serveur écrit). Avec un mot de passe, le changer demande l'actuel.
 */
export function aUnMotDePasse(utilisateur: User | null): boolean {
  if (!utilisateur) return false;
  return (utilisateur.identities ?? []).some((i) => i.provider === "email") || utilisateur.app_metadata?.mot_de_passe === true;
}
