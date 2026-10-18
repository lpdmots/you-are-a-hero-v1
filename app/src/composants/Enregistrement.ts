"use client";

import { useEffect, useRef, useState } from "react";

type Envoi = () => Promise<{ ok: boolean; erreur?: string }>;

/**
 * Enregistre un champ après une courte pause dans la frappe, et à la sortie du champ.
 * Plusieurs champs d'un même écran ont chacun leur clé : ce qui attend pour l'un n'est
 * jamais chassé par ce qu'on change dans un autre.
 */
export function useEnregistrement() {
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const attente = useRef(new Map<string, { envoi: Envoi; minuteur: ReturnType<typeof setTimeout> }>());
  // Les envois partis et pas encore revenus : `partir` les attend aussi (lot 7 de l'étape 8 : un
  // clic juste après la sortie d'un champ demandait une aide avant que le champ soit enregistré)
  const enVol = useRef(new Set<Promise<unknown>>());

  const envoyer = async (cle: string) => {
    const prevu = attente.current.get(cle);
    if (!prevu) return;
    clearTimeout(prevu.minuteur);
    attente.current.delete(cle);
    setEnCours((n) => n + 1);
    const envoi = prevu.envoi();
    enVol.current.add(envoi);
    const fait = await envoi.finally(() => enVol.current.delete(envoi));
    setEnCours((n) => n - 1);
    if (fait.ok) {
      setErreur(null);
      setEnregistre(true);
    } else setErreur(fait.erreur ?? "Cela n’a pas pu être enregistré.");
  };
  /** Prévoit un envoi ; un autre envoi prévu sous la même clé est remplacé par celui-ci. */
  const prevoir = (envoi: Envoi, delai = 700, cle = "champ") => {
    setEnregistre(false);
    const avant = attente.current.get(cle);
    if (avant) clearTimeout(avant.minuteur);
    attente.current.set(cle, { envoi, minuteur: setTimeout(() => void envoyer(cle), delai) });
  };
  /** Envoie tout de suite ce qui attendait, et attend ce qui est déjà parti : à la sortie d'un champ, avant une aide. */
  const partir = async () => {
    await Promise.all([...[...attente.current.keys()].map(envoyer), ...[...enVol.current].map((p) => p.catch(() => undefined))]);
  };
  // Le panneau qui se ferme n'abandonne pas ce qui attendait d'être enregistré
  useEffect(() => {
    const enAttente = attente.current;
    return () => {
      for (const prevu of enAttente.values()) {
        clearTimeout(prevu.minuteur);
        void prevu.envoi();
      }
      enAttente.clear();
    };
  }, []);
  return { enregistre: enregistre && enCours === 0, enCours: enCours > 0, erreur, prevoir, partir, setErreur };
}
