import { NextResponse, type NextRequest } from "next/server";
import { mesurer } from "@/serveur/mesure";
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
    const { data: confirme, error } = await supabase.auth.verifyOtp({ token_hash: jeton, type: "email" });
    // L'adresse confirmée une fois, le lien d'une inscription : le compte est créé (F14-AC50)
    if (!error && confirme.user) await mesurer({ evenement: "compte_cree", methode: "adresse" }, confirme.user.id);
    // Un lien déjà ouvert (par l'antivirus d'une messagerie, souvent) a confirmé l'adresse :
    // il reste à entrer avec son mot de passe
    return vers(error ? "/entree?refus=lien" : "/");
  }

  const code = url.searchParams.get("code");
  if (!code) return vers("/entree?refus=echec");
  const { data: ouvert, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return vers("/entree?refus=echec");
  // Un compte ouvert par Google à l'instant : sa création et sa première entrée ont la même heure (F14-AC50)
  const nouveau = ouvert.user;
  if (nouveau?.app_metadata?.provider === "google" && nouveau.last_sign_in_at && Math.abs(Date.parse(nouveau.last_sign_in_at) - Date.parse(nouveau.created_at)) < 60_000) {
    await mesurer({ evenement: "compte_cree", methode: "google" }, nouveau.id);
  }

  // Après « Mot de passe oublié », on choisit son nouveau mot de passe ; sinon, on entre.
  const { data } = await supabase.auth.getClaims();
  const methodes = (data?.claims?.amr ?? []) as ({ method?: string } | string)[];
  const recuperation = methodes.some((m) => (typeof m === "string" ? m : m.method) === "recovery");
  return vers(recuperation ? "/entree/nouveau-mot-de-passe" : "/");
}
