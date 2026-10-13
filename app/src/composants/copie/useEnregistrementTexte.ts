"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Enregistrement, Motif, Texte } from "@/domaine/copie";
import { garderLaSortie } from "./sortie";

/** Deux secondes après la dernière frappe, quinze au plus si la frappe ne s'arrête pas (F08.2). */
export const PAUSE_MS = 2_000;
export const PLAFOND_MS = 15_000;
/** Après un échec, la page réessaie d'elle-même tant qu'elle reste ouverte (F08.1). */
export const NOUVEL_ESSAI_MS = 10_000;

export type Cible = { scene: string } | { ecriture: string };

export type EtatTexte =
  /** Le texte affiché est celui de la scène */
  | { etat: "enregistre" }
  /** Des changements attendent ou partent : « Pas encore enregistré » */
  | { etat: "attente" }
  /** Le dernier envoi a échoué : la page réessaie, rien n'est perdu tant qu'elle reste ouverte */
  | { etat: "echec" }
  /** Refusé : ce qui n'était pas enregistré est gardé à part (F08.1) */
  | { etat: "garde"; motif: Motif }
  /** La page n'a plus le droit d'écrire ici, et n'avait rien de neuf */
  | { etat: "refuse"; motif?: Motif }
  /** L'accès s'est fermé */
  | { etat: "ferme" };

const envoi = async (cible: Cible, version: number, texte: Texte, enPartant = false): Promise<Enregistrement> => {
  const reponse = await fetch("/copie", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...cible, version, texte }),
    // La page qui se ferme envoie encore ce qui attend ; le navigateur peut l'abandonner
    keepalive: enPartant,
    credentials: "same-origin",
  });
  if (!reponse.ok) throw new Error(`Enregistrement refusé (${reponse.status})`);
  return (await reponse.json()) as Enregistrement;
};

/**
 * Enregistrement automatique du texte d'une scène. Un seul envoi à la fois : le suivant
 * part avec la version que le précédent a rendue. Rien ici ne touche à l'éditeur, ni à son
 * curseur (F08-AC33).
 */
export function useEnregistrementTexte({
  cible, version: versionInitiale, texte: texteInitial, apresRetour, onVersion,
}: {
  cible: Cible; version: number; texte: Texte;
  /** La version que la base vient de rendre : la page la présente pour changer l'état (F07-AC26) */
  onVersion?: (version: number) => void;
  /** Un échec vient d'être rattrapé : le texte est enregistré (F08-AC22) */
  apresRetour?: () => void;
}) {
  const [etat, setEtat] = useState<EtatTexte>({ etat: "enregistre" });
  const version = useRef(versionInitiale);
  const enregistre = useRef<Texte>(texteInitial);
  const courant = useRef<Texte>(texteInitial);
  const cibleRef = useRef(cible);
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);
  const plafond = useRef<ReturnType<typeof setTimeout> | null>(null);
  const essai = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enVol = useRef<Promise<"fait" | "echec" | "arret"> | null>(null);
  const arrete = useRef(false);
  const enEchec = useRef(false);
  const gardeAPart = useRef(false);
  const retour = useRef(apresRetour);
  const direVersion = useRef(onVersion);
  useEffect(() => {
    retour.current = apresRetour;
    direVersion.current = onVersion;
    cibleRef.current = cible;
  });

  const arreterLesMinuteurs = () => {
    for (const m of [pause, plafond, essai]) {
      if (m.current) clearTimeout(m.current);
      m.current = null;
    }
  };

  /** Un envoi de ce qui attend, s'il n'y en a pas déjà un en route. */
  const lancer = useCallback((): Promise<"fait" | "echec" | "arret"> => {
    if (enVol.current) return enVol.current;
    if (arrete.current) return Promise.resolve("arret");
    if (courant.current === enregistre.current) return Promise.resolve("fait");
    for (const m of [pause, plafond, essai]) {
      if (m.current) clearTimeout(m.current);
      m.current = null;
    }
    const parti = courant.current;
    const vol = (async (): Promise<"fait" | "echec" | "arret"> => {
      let fait: Enregistrement;
      try {
        fait = await envoi(cibleRef.current, version.current, parti);
      } catch {
        enEchec.current = true;
        setEtat({ etat: "echec" });
        essai.current = setTimeout(() => void lancer(), NOUVEL_ESSAI_MS);
        return "echec";
      }
      if (fait.etat === "enregistre") {
        version.current = fait.version;
        direVersion.current?.(fait.version);
        enregistre.current = parti;
        if (enEchec.current) {
          enEchec.current = false;
          retour.current?.();
        }
        if (courant.current === parti) setEtat({ etat: "enregistre" });
        else {
          // La frappe a continué pendant l'envoi : la suite part après sa propre pause
          setEtat({ etat: "attente" });
          if (!pause.current) pause.current = setTimeout(() => void lancer(), PAUSE_MS);
        }
        return "fait";
      }
      // Refusé : plus aucun envoi depuis cette page, le texte reste à l'écran (F08-AC04)
      arrete.current = true;
      enEchec.current = false;
      gardeAPart.current = fait.etat === "garde";
      setEtat(fait.etat === "garde" ? { etat: "garde", motif: fait.motif } : fait.etat === "ferme" ? { etat: "ferme" } : { etat: "refuse", motif: fait.motif });
      return "arret";
    })();
    enVol.current = vol;
    void vol.finally(() => {
      if (enVol.current === vol) enVol.current = null;
    });
    return vol;
  }, []);

  /**
   * Envoie tout ce qui attend, jusqu'au bout. Rend faux si un envoi a échoué : le texte
   * n'est pas enregistré, on ne quitte pas la scène (F08-AC38).
   */
  const envoyer = useCallback(async (): Promise<boolean> => {
    for (;;) {
      if (arrete.current) return true;
      if (enVol.current) {
        if ((await enVol.current) === "echec") return false;
        continue;
      }
      if (courant.current === enregistre.current) return true;
      if ((await lancer()) === "echec") return false;
    }
  }, [lancer]);

  /** L'éditeur dit que le texte a changé. */
  const noter = useCallback(
    (texte: Texte) => {
      if (texte === courant.current) return;
      courant.current = texte;
      if (arrete.current) return;
      if (texte === enregistre.current) return;
      if (!enEchec.current) setEtat((avant) => (avant.etat === "attente" ? avant : { etat: "attente" }));
      if (pause.current) clearTimeout(pause.current);
      pause.current = setTimeout(() => void lancer(), PAUSE_MS);
      if (!plafond.current) plafond.current = setTimeout(() => void lancer(), PLAFOND_MS);
    },
    [lancer],
  );

  // Une commande de l'application qui fait quitter la scène enregistre d'abord (F08-AC34)
  useEffect(() => garderLaSortie({ partir: envoyer, garde: () => gardeAPart.current }), [envoyer]);

  useEffect(() => {
    // La page fermée par le navigateur envoie ce qui attend, sans garantie (F08-AC35)
    const fermeture = () => {
      if (arrete.current || courant.current === enregistre.current || enVol.current) return;
      void envoi(cibleRef.current, version.current, courant.current, true).catch(() => {});
    };
    // Le réseau revient : inutile d'attendre le prochain essai (F08-AC22)
    const reseau = () => {
      if (enEchec.current) void lancer();
    };
    // Pendant un échec, fermer la page perdrait le texte : le navigateur le redemande
    const avantFermeture = (e: BeforeUnloadEvent) => {
      if (enEchec.current && !arrete.current) e.preventDefault();
    };
    window.addEventListener("pagehide", fermeture);
    window.addEventListener("online", reseau);
    window.addEventListener("beforeunload", avantFermeture);
    return () => {
      window.removeEventListener("pagehide", fermeture);
      window.removeEventListener("online", reseau);
      window.removeEventListener("beforeunload", avantFermeture);
      // La page quittée dans l'application n'abandonne pas ce qui attendait
      fermeture();
      arreterLesMinuteurs();
    };
  }, [lancer]);

  return { etat, noter, envoyer, reessayer: lancer };
}
