"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { estPageMesuree } from "@/domaine/pages-publiques";

/** Sans l'adresse après « ? » : ni jeton d'un lien reçu, ni message passager ne partent à la mesure */
const sansQuestion = <T extends { url: string }>(e: T): T => ({ ...e, url: e.url.split("?")[0] });

/**
 * La mesure d'audience (F14-AC49) : Vercel Web Analytics et Speed Insights, sans témoin, sur les pages
 * publiques et les entrées seulement. Ailleurs, l'espace des élèves, les livres de `/lire` et l'espace
 * de l'adulte, leurs scripts ne sont pas chargés.
 */
export function Mesure() {
  const chemin = usePathname();
  if (!estPageMesuree(chemin)) return null;
  return (
    <>
      <Analytics beforeSend={sansQuestion} />
      <SpeedInsights beforeSend={sansQuestion} />
    </>
  );
}
