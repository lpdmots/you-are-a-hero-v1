"use client";

import { useEffect, useRef, useState } from "react";

/** Enregistre un champ après une courte pause dans la frappe, et à la sortie du champ. */
export function useEnregistrement() {
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attente = useRef<(() => Promise<{ ok: boolean; erreur?: string }>) | null>(null);

  const partir = async () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    const envoi = attente.current;
    attente.current = null;
    if (!envoi) return;
    setEnCours(true);
    const fait = await envoi();
    setEnCours(false);
    if (fait.ok) {
      setErreur(null);
      setEnregistre(true);
    } else setErreur(fait.erreur ?? "Cela n’a pas pu être enregistré.");
  };
  const prevoir = (envoi: () => Promise<{ ok: boolean; erreur?: string }>, delai = 700) => {
    setEnregistre(false);
    attente.current = envoi;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void partir(), delai);
  };
  // Le panneau qui se ferme n'abandonne pas ce qui attendait d'être enregistré
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
      void attente.current?.();
    },
    [],
  );
  return { enregistre, enCours, erreur, prevoir, partir, setErreur };
}
