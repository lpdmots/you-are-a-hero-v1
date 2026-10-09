import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "./env";

/**
 * Trois façons de parler à la base (voir la migration de l'étape 1) :
 * l'adulte connecté, le poste d'élève, et le serveur lui-même.
 */

export const OPTIONS_COOKIE_ADULTE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Client de l'adulte connecté : ses droits sont ceux de son compte, tenus par la base. */
export async function clientAdulte(): Promise<SupabaseClient> {
  const magasin = await cookies();
  return createServerClient(env.supabaseUrl, env.clePubliable, {
    cookieOptions: OPTIONS_COOKIE_ADULTE,
    cookies: {
      getAll: () => magasin.getAll(),
      setAll(aPoser) {
        try {
          aPoser.forEach(({ name, value, options }) => magasin.set(name, value, options));
        } catch {
          // Depuis un composant serveur, un cookie ne s'écrit pas : le proxy s'en charge.
        }
      },
    },
  });
}

/** Client d'un poste d'élève : le jeton signé par l'application porte le rôle « poste ». */
export function clientPoste(jeton: string): SupabaseClient {
  return createClient(env.supabaseUrl, env.clePubliable, { accessToken: async () => jeton });
}

/**
 * Client du serveur : contourne les règles d'accès. Réservé à l'entrée des élèves
 * (ouvrir la classe, vérifier un code), avant qu'un poste n'ait de jeton.
 */
export function clientService(): SupabaseClient {
  return createClient(env.supabaseUrl, env.cleSecrete, { auth: { persistSession: false, autoRefreshToken: false } });
}
