import { llmsTxt } from "@/domaine/presentation";
import { adresseDuSite } from "@/serveur/env";
import { offreActuelle } from "@/serveur/offre";

// Recomposé au plus toutes les heures : un prix changé par `npm run prix` y paraît sans redéploiement
export const revalidate = 3600;

/** `llms.txt` (F14-AC48) : ce qu'est l'outil, pour qui, ses prix actuels, ses pages publiques. */
export async function GET(): Promise<Response> {
  return new Response(llmsTxt(await offreActuelle(), adresseDuSite()), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
