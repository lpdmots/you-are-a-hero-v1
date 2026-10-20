import { NextResponse, type NextRequest } from "next/server";
import { clientAdulte } from "@/serveur/supabase";

/**
 * Retour vers l'application après un passage chez Supabase : le lien de confirmation d'une
 * inscription, le lien reçu par courriel (« Mot de passe oublié »), ou la connexion par Google.
 *
 * La confirmation d'une adresse porte son jeton dans le lien : elle s'ouvre sur tout appareil,
 * le téléphone compris (F14-AC01). Les autres retours portent un code qui ne vaut qu'avec le
 * témoin posé sur ce navigateur au moment de la demande : un lien fabriqué par quelqu'un
 * d'autre n'ouvre rien, et le mot de passe ne se choisit que sur l'ordinateur d'où il a été
 * demandé (F01).
 */
export async function GET(requete: NextRequest) {
  const url = new URL(requete.url);
  const vers = (chemin: string) => NextResponse.redirect(new URL(chemin, url.origin));

  const refus = url.searchParams.get("error_code") ?? url.searchParams.get("error");
  if (refus) return vers("/entree?refus=echec");

  const supabase = await clientAdulte();
  const jeton = url.searchParams.get("token_hash");
  if (jeton) {
    if (url.searchParams.get("type") !== "email") return vers("/entree?refus=echec");
    const { error } = await supabase.auth.verifyOtp({ token_hash: jeton, type: "email" });
    // Un lien déjà ouvert (par l'antivirus d'une messagerie, souvent) a confirmé l'adresse :
    // il reste à entrer avec son mot de passe
    return vers(error ? "/entree?refus=lien" : "/");
  }

  const code = url.searchParams.get("code");
  if (!code) return vers("/entree?refus=echec");
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return vers("/entree?refus=echec");

  // Après « Mot de passe oublié », on choisit son nouveau mot de passe ; sinon, on entre.
  const { data } = await supabase.auth.getClaims();
  const methodes = (data?.claims?.amr ?? []) as ({ method?: string } | string)[];
  const recuperation = methodes.some((m) => (typeof m === "string" ? m : m.method) === "recovery");
  return vers(recuperation ? "/entree/nouveau-mot-de-passe" : "/");
}
