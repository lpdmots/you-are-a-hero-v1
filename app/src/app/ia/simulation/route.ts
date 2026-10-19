import { reglerLaSimulation, type ModeSimule } from "@/serveur/ia/demander";

/**
 * Le mode simulé du serveur d'essai, changé le temps d'un parcours (étape 8, lot 9) : une panne
 * du fournisseur ou des clés absentes se jouent dans le navigateur. N'existe que si `IA_SIMULEE`
 * est posée, donc jamais chez Vercel. Corps : { mode: "echec" | "sans-cle" | "reponse" | null }.
 */
const MODES: (ModeSimule | null)[] = ["reponse", "echec", "delai", "sans-cle", null];

export async function POST(requete: Request): Promise<Response> {
  if (!process.env.IA_SIMULEE) return new Response(null, { status: 404 });
  let corps: { mode?: unknown };
  try {
    corps = await requete.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const mode = (corps.mode ?? null) as ModeSimule | null;
  if (!MODES.includes(mode)) return new Response(null, { status: 400 });
  reglerLaSimulation(mode);
  return new Response(null, { status: 204 });
}
