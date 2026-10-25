import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Garde l'adulte connecté : rafraîchit son jeton quand il arrive à échéance et le
 * renvoie au navigateur. Ce n'est pas un contrôle de droits : chaque page et chaque
 * action vérifie elle-même qui demande, et la base aussi.
 */
export async function proxy(request: NextRequest) {
  // Sans session ni poste de classe, l'accueil est le même pour tous : sa copie gardée en cache, à la
  // même adresse (F14-AC47). Avec l'un ou l'autre, l'accueil renvoie au projet ou à l'espace des élèves.
  // Les parcours l'éteignent (ACCUEIL_SANS_CACHE) : ils changent la base et relisent l'accueil aussitôt.
  if (request.nextUrl.pathname === "/" && process.env.ACCUEIL_SANS_CACHE !== "1" && !request.cookies.has("poste") && !request.cookies.getAll().some((t) => /^sb-.+-auth-token/.test(t.name))) {
    return NextResponse.rewrite(new URL(`/vitrine${request.nextUrl.search}`, request.url));
  }
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
  // L'espace des élèves n'a pas de compte Supabase : le proxy n'y passe pas. Le diagnostic du
  // livre non plus : il ne lit pas la base, et une préversion n'en a pas les clés. Le lien de
  // lecture et ses images non plus : on y lit sans compte (F12.1).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|illustrations/|classe(?:/|$)|travail(?:/|$)|diagnostic(?:/|$)|lire(?:/|$)|images/lire/).*)"],
};
