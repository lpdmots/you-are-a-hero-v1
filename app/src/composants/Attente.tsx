"use client";

import { useState, useTransition, type ComponentProps, type KeyboardEvent } from "react";
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

/**
 * « Entrée », dans une case d'un formulaire, l'envoie. Le navigateur le fait déjà de
 * lui-même, mais pas toujours quand un gestionnaire de mots de passe a rempli la case
 * ou y affiche son menu : on le demande donc expressément. Rien ne part si le bouton
 * d'envoi attend déjà une réponse.
 */
export function envoyerParEntree(e: KeyboardEvent<HTMLInputElement>): void {
  if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
  const formulaire = e.currentTarget.form;
  const bouton = formulaire?.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!formulaire || !bouton) return;
  e.preventDefault();
  if (!bouton.disabled) formulaire.requestSubmit(bouton);
}
