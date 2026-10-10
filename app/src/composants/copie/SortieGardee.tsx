"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { avantDePartir } from "./sortie";

/**
 * Tant qu'une copie est ouverte, une commande de l'application qui fait quitter la scène —
 * un lien, « Changer d'élève » — enregistre d'abord, puis agit (F08-AC34). Si
 * l'enregistrement échoue, on reste sur la scène, qui le dit (F08-AC38).
 */
export function SortieGardee() {
  const routeur = useRouter();
  useEffect(() => {
    const clic = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const lien = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!lien || lien.target === "_blank" || lien.hasAttribute("download") || lien.origin !== window.location.origin) return;
      if (lien.pathname === window.location.pathname && lien.search === window.location.search) return;
      ev.preventDefault();
      ev.stopPropagation();
      void avantDePartir().then((ok) => {
        if (ok) routeur.push(`${lien.pathname}${lien.search}${lien.hash}`);
      });
    };
    const envoi = (ev: SubmitEvent) => {
      const formulaire = ev.target as HTMLFormElement | null;
      if (!formulaire || formulaire.dataset.sortie === "libre") return;
      ev.preventDefault();
      ev.stopPropagation();
      const bouton = ev.submitter;
      void avantDePartir().then((ok) => {
        if (!ok) return;
        // Le navigateur ignore un envoi demandé pendant qu'il traite encore le premier : on attend qu'il ait fini
        setTimeout(() => {
          formulaire.dataset.sortie = "libre";
          formulaire.requestSubmit(bouton);
          delete formulaire.dataset.sortie;
        }, 0);
      });
    };
    // En capture : avant que la page ne commence à partir
    document.addEventListener("click", clic, true);
    document.addEventListener("submit", envoi, true);
    return () => {
      document.removeEventListener("click", clic, true);
      document.removeEventListener("submit", envoi, true);
    };
  }, [routeur]);
  return null;
}
