import { NextResponse, type NextRequest } from "next/server";
import { clientAdulte } from "@/serveur/supabase";

/**
 * Arrivée du lien reçu par courriel (« Mot de passe oublié ») : le lien ouvre l'accès
 * le temps de choisir un nouveau mot de passe.
 */
export async function GET(requete: NextRequest) {
  const url = new URL(requete.url);
  const code = url.searchParams.get("code");
  const empreinte = url.searchParams.get("token_hash");
  const supabase = await clientAdulte();
  let ouvert = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ouvert = !error;
  } else if (empreinte) {
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: empreinte });
    ouvert = !error;
  }
  return NextResponse.redirect(new URL(ouvert ? "/entree/nouveau-mot-de-passe" : "/entree/oubli?lien=perime", url.origin));
}
