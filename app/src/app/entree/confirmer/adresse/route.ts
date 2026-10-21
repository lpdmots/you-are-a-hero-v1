import { NextResponse, type NextRequest } from "next/server";
import { clientAdulte } from "@/serveur/supabase";

/**
 * Retour d'un lien « Confirmer votre nouvelle adresse » (F01, 21 octobre 2026). Quand Supabase
 * demande les deux confirmations, le premier lien ouvert revient avec un message et sans code :
 * il reste à ouvrir l'autre. Le second revient avec un code, qui ne vaut qu'avec le témoin
 * posé sur le navigateur d'où le changement a été demandé.
 */
export async function GET(requete: NextRequest) {
  const url = new URL(requete.url);
  const vers = (message: string) => NextResponse.redirect(new URL(`/compte?message=${message}`, url.origin));

  if (url.searchParams.get("error_code") ?? url.searchParams.get("error")) return vers("adresse-refusee");
  const code = url.searchParams.get("code");
  if (!code) return vers(url.searchParams.get("message") ? "adresse-une" : "adresse-refusee");
  const supabase = await clientAdulte();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return vers(error ? "adresse-refusee" : "adresse");
}
