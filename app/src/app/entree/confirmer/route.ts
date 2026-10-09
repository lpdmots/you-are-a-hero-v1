import { NextResponse, type NextRequest } from "next/server";
import { clientAdulte } from "@/serveur/supabase";

/**
 * Retour vers l'application après un passage chez Supabase : le lien reçu par courriel
 * (« Mot de passe oublié »), ou la connexion par Google.
 *
 * Le code reçu ne vaut qu'avec le témoin posé sur ce navigateur au moment de la demande :
 * un lien fabriqué par quelqu'un d'autre n'ouvre rien.
 */
export async function GET(requete: NextRequest) {
  const url = new URL(requete.url);
  const vers = (chemin: string) => NextResponse.redirect(new URL(chemin, url.origin));

  // Supabase refuse un compte Google qui n'est celui d'aucun enseignant inscrit : avant
  // l'ouverture, aucun compte ne se crée depuis l'application (F01-AC28, F01-AC32).
  const refus = url.searchParams.get("error_code") ?? url.searchParams.get("error");
  if (refus) return vers(`/entree?refus=${refus === "signup_disabled" ? "inconnu" : "echec"}`);

  const code = url.searchParams.get("code");
  if (!code) return vers("/entree?refus=echec");
  const supabase = await clientAdulte();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return vers("/entree?refus=echec");

  // Après « Mot de passe oublié », on choisit son nouveau mot de passe ; sinon, on entre.
  const { data } = await supabase.auth.getClaims();
  const methodes = (data?.claims?.amr ?? []) as ({ method?: string } | string)[];
  const recuperation = methodes.some((m) => (typeof m === "string" ? m : m.method) === "recovery");
  return vers(recuperation ? "/entree/nouveau-mot-de-passe" : "/");
}
