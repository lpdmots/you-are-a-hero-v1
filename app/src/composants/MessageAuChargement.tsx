"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMessage } from "./Messages";

/** Dit une fois ce qui vient d'être fait sur la page précédente, puis nettoie l'adresse. */
export function MessageAuChargement({ texte }: { texte: string }) {
  const dire = useMessage();
  const routeur = useRouter();
  const chemin = usePathname();
  const fait = useRef(false);
  useEffect(() => {
    if (fait.current) return;
    fait.current = true;
    dire({ texte });
    routeur.replace(chemin, { scroll: false });
  }, [dire, texte, routeur, chemin]);
  return null;
}
