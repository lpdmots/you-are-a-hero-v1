"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { estPageMesuree } from "@/domaine/pages-publiques";

/** Un navigateur du porteur, marqué en ouvrant l'administration : ses visites ne se comptent pas */
const CLE_DU_PORTEUR = "mesure-exclue";
function navigateurDuPorteur(): boolean {
  try {
    return window.localStorage.getItem(CLE_DU_PORTEUR) === "1";
  } catch {
    return false;
  }
}

/** Sans l'adresse après « ? » : ni jeton d'un lien reçu, ni message passager ne partent à la mesure */
const sansQuestion = <T extends { url: string }>(e: T): T | null => (navigateurDuPorteur() ? null : { ...e, url: e.url.split("?")[0] });

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

/**
 * Posé dans l'administration, que seul le porteur ouvre : ce navigateur ne compte plus ses visites des
 * pages publiques (rien n'est envoyé, la marque reste dans le navigateur). Une fois par navigateur.
 */
export function NePasCompterCeNavigateur() {
  useEffect(() => {
    try {
      window.localStorage.setItem(CLE_DU_PORTEUR, "1");
    } catch {
      // Navigation privée : ses visites se comptent
    }
  }, []);
  return null;
}
