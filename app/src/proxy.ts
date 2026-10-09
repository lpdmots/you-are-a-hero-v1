import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Garde l'adulte connecté : rafraîchit son jeton quand il arrive à échéance et le
 * renvoie au navigateur. Ce n'est pas un contrôle de droits : chaque page et chaque
 * action vérifie elle-même qui demande, et la base aussi.
 */
export async function proxy(request: NextRequest) {
  let reponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CLE_PUBLIABLE!,
    {
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(aPoser, entetes) {
          aPoser.forEach(({ name, value }) => request.cookies.set(name, value));
          reponse = NextResponse.next({ request });
          aPoser.forEach(({ name, value, options }) => reponse.cookies.set(name, value, options));
          Object.entries(entetes ?? {}).forEach(([nom, valeur]) => reponse.headers.set(nom, valeur));
        },
      },
    },
  );
  await supabase.auth.getClaims();
  return reponse;
}

export const config = {
  // L'espace des élèves n'a pas de compte Supabase : le proxy n'y passe pas.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|illustrations/|classe|travail).*)"],
};
