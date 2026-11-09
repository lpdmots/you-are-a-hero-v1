import { messageDeLaDictee } from "@/domaine/dictee";
import { enseignantCourant } from "@/serveur/adulte";
import { dicteePossible, transcrire } from "@/serveur/dictee";

/**
 * La dictée de l'adulte (F07.4). GET : la dictée est-elle possible, avant d'enregistrer ?
 * POST : le son enregistré (formulaire : `audio`, et `projet` pour les noms de ses personnages),
 * transcrit ; rien n'est gardé, ni le son ni le texte.
 */
export const maxDuration = 90;

const sansCache = { "Cache-Control": "no-store" };
const refuse = (r: Parameters<typeof messageDeLaDictee>[0]) => Response.json({ ok: false, refus: r, message: messageDeLaDictee(r) }, { headers: sansCache });

export async function GET(): Promise<Response> {
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  try {
    const r = await dicteePossible(e);
    return r ? refuse(r) : Response.json({ ok: true }, { headers: sansCache });
  } catch (erreur) {
    console.error("Dictée", erreur);
    return refuse("echec");
  }
}

export async function POST(requete: Request): Promise<Response> {
  const origine = requete.headers.get("origin");
  if (origine && origine !== new URL(requete.url).origin) return new Response(null, { status: 403 });
  const e = await enseignantCourant();
  if (!e) return Response.json({ ok: false, message: "Connectez-vous de nouveau." }, { status: 401 });
  let audio: FormDataEntryValue | null;
  let projet: FormDataEntryValue | null;
  try {
    const corps = await requete.formData();
    audio = corps.get("audio");
    projet = corps.get("projet");
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!(audio instanceof Blob)) return new Response(null, { status: 400 });
  const idProjet = typeof projet === "string" && /^[0-9a-f-]{36}$/i.test(projet) ? projet : null;
  try {
    const r = await transcrire(e, { audio, projet: idProjet });
    return r.ok ? Response.json(r, { headers: sansCache }) : refuse(r.refus);
  } catch (erreur) {
    console.error("Dictée", erreur);
    return refuse("echec");
  }
}
