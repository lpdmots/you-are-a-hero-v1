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

  const envoyer = async (cle: string) => {
    const prevu = attente.current.get(cle);
    if (!prevu) return;
    clearTimeout(prevu.minuteur);
    attente.current.delete(cle);
    setEnCours((n) => n + 1);
    const fait = await prevu.envoi();
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
  /** Envoie tout de suite ce qui attendait : à la sortie d'un champ. */
  const partir = async () => {
    await Promise.all([...attente.current.keys()].map(envoyer));
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
