import { NextResponse, type NextRequest } from "next/server";
import { clientAdulte } from "@/serveur/supabase";

/**
 * Arrivée du lien reçu par courriel (« Mot de passe oublié ») : le lien ouvre l'accès
 * le temps de choisir un nouveau mot de passe, sur l'ordinateur d'où il a été demandé.
 */
export async function GET(requete: NextRequest) {
  const url = new URL(requete.url);
  const code = url.searchParams.get("code");
  const supabase = await clientAdulte();
  let ouvert = false;
  // Le code ne vaut qu'avec le témoin posé sur ce navigateur au moment de la demande :
  // un lien fabriqué par quelqu'un d'autre n'ouvre rien.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ouvert = !error;
  }
  return NextResponse.redirect(new URL(ouvert ? "/entree/nouveau-mot-de-passe" : "/entree/oubli?lien=perime", url.origin));
}
