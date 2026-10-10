"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { veiller, type EtatVeille } from "@/app/classe/actions";
import { avantDePartir, texteQuitte } from "./copie/sortie";

const PERIODE = 60_000;

/**
 * Tient la page d'un poste à jour de ses accès : si la classe s'est fermée, si l'accès de
 * l'élève s'est terminé ou si la plage horaire est finie, la page revient d'elle-même à
 * l'écran qui convient. Le texte en cours est enregistré avant ce retour ; s'il ne peut pas
 * l'être, la page reste où elle est et le dit (F06-AC29, AC30, AC76 à AC78).
 */
export function VeillePoste({ attendu, auTravail }: {
  attendu: "eleve" | "classe";
  /** La page montre le récit : elle se quitte quand la plage horaire se termine */
  auTravail?: boolean;
}) {
  const routeur = useRouter();
  const actif = useRef(false);
  const dernier = useRef<EtatVeille | null>(null);

  useEffect(() => {
    const agir = () => {
      actif.current = true;
    };
    let enCours = false;
    const verifier = async () => {
      if (document.visibilityState !== "visible" || enCours) return;
      enCours = true;
      const vient = attendu === "eleve" && actif.current;
      actif.current = false;
      try {
        const etat = await veiller(vient);
        const identifie = etat === "eleve" || etat === "pause";
        const avant = dernier.current;
        dernier.current = etat;
        if (attendu === "eleve" && identifie && !(etat === "pause" && auTravail)) {
          // Sur « Mon travail », la plage qui s'ouvre ou se ferme se lit sans rien quitter
          if (avant && avant !== etat && !auTravail) routeur.refresh();
          return;
        }
        if (attendu === "classe" && etat === "classe") return;
        // Ce qui attend s'enregistre d'abord ; un échec passe devant l'annonce de fermeture
        if (!(await avantDePartir())) return;
        const quitte = texteQuitte();
        if (etat === "ferme") routeur.replace("/classe");
        else if (etat === "classe") routeur.replace("/classe/qui");
        else routeur.replace(quitte ? `/travail?texte=${quitte}` : "/travail");
      } catch {
        // Réseau coupé : on réessaiera au prochain tour, sans rien fermer.
      } finally {
        enCours = false;
      }
    };
    window.addEventListener("pointerdown", agir);
    window.addEventListener("keydown", agir);
    document.addEventListener("visibilitychange", verifier);
    const minuteur = setInterval(verifier, PERIODE);
    // Les parcours joués par les tests ne patientent pas une minute
    const surDemande = () => void verifier();
    window.addEventListener("veille-poste", surDemande);
    return () => {
      window.removeEventListener("pointerdown", agir);
      window.removeEventListener("keydown", agir);
      document.removeEventListener("visibilitychange", verifier);
      window.removeEventListener("veille-poste", surDemande);
      clearInterval(minuteur);
    };
  }, [attendu, auTravail, routeur]);

  return null;
}
