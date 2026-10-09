"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { veiller } from "@/app/classe/actions";

const PERIODE = 60_000;

/**
 * Tient la page d'un poste à jour de ses accès : si la classe s'est fermée ou si
 * l'accès de l'élève s'est terminé, la page revient d'elle-même à l'écran qui convient.
 * À l'étape 3, le texte en cours sera enregistré avant ce retour.
 */
export function VeillePoste({ attendu }: { attendu: "eleve" | "classe" }) {
  const routeur = useRouter();
  const actif = useRef(false);

  useEffect(() => {
    const agir = () => {
      actif.current = true;
    };
    const verifier = async () => {
      if (document.visibilityState !== "visible") return;
      const vient = attendu === "eleve" && actif.current;
      actif.current = false;
      try {
        const etat = await veiller(vient);
        if (etat === "ferme") routeur.replace("/classe");
        else if (etat !== attendu) routeur.replace(etat === "eleve" ? "/travail" : "/classe/qui");
      } catch {
        // Réseau coupé : on réessaiera au prochain tour, sans rien fermer.
      }
    };
    window.addEventListener("pointerdown", agir);
    window.addEventListener("keydown", agir);
    document.addEventListener("visibilitychange", verifier);
    const minuteur = setInterval(verifier, PERIODE);
    return () => {
      window.removeEventListener("pointerdown", agir);
      window.removeEventListener("keydown", agir);
      document.removeEventListener("visibilitychange", verifier);
      clearInterval(minuteur);
    };
  }, [attendu, routeur]);

  return null;
}
