"use client";

import { useState, useTransition, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";

/**
 * Plusieurs commandes sur un même écran : seule celle qui attend le dit. « lancer » reçoit
 * le nom de la commande, « attente » le rend tant que sa réponse n'est pas à l'écran.
 */
export function useAttente(): { attente: string | null; lancer: (nom: string, suite: () => Promise<void>) => void } {
  const [nom, setNom] = useState<string | null>(null);
  const [enCours, transition] = useTransition();
  const lancer = (commande: string, suite: () => Promise<void>) => {
    setNom(commande);
    transition(suite);
  };
  return { attente: enCours ? nom : null, lancer };
}

/** Bouton d'envoi d'un formulaire : il tourne et ne s'envoie pas deux fois pendant l'attente. */
export function BoutonEnvoi({ disabled, ...reste }: ComponentProps<"button">) {
  const { pending } = useFormStatus();
  return <button type="submit" {...reste} disabled={disabled || pending} aria-busy={pending || undefined} />;
}
