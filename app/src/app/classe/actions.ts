"use server";

import { redirect } from "next/navigation";
import {
  changerDEleve, entrerLeCode, etatDuPoste, noterActivite, ouvrirLaClasse, quitterLaClasse, type ResultatCode,
} from "@/serveur/poste";

/**
 * Commandes de l'espace des élèves (F06.4). Aucune ne fait confiance au navigateur :
 * l'état du poste est relu dans la base à chaque fois.
 */

// saisie : ce qui était écrit, rendu au formulaire après un refus pour corriger sans tout retaper
export type EtatOuverture = { erreur?: string; saisie?: { identifiant: string; motDePasse: string } };

export async function ouvrir(_avant: EtatOuverture, formulaire: FormData): Promise<EtatOuverture> {
  const identifiant = String(formulaire.get("identifiant") ?? "");
  const motDePasse = String(formulaire.get("mot-de-passe") ?? "");
  if (!identifiant.trim() || !motDePasse.trim()) return { erreur: "Écris l’identifiant et le mot de passe de la classe." };
  const resultat = await ouvrirLaClasse(identifiant.slice(0, 100), motDePasse.slice(0, 100));
  if (resultat.ok) redirect("/classe/qui");
  const saisie = { identifiant: identifiant.slice(0, 100), motDePasse: motDePasse.slice(0, 100) };
  if (resultat.raison === "attente") {
    return { erreur: `Trop d’essais. Attends ${resultat.minutes > 1 ? `${resultat.minutes} minutes` : "une minute"}, ou demande à ton enseignant(e).`, saisie };
  }
  return { erreur: "Ce n’est pas le bon identifiant, ou pas le bon mot de passe. Regarde l’affiche, ou demande à ton enseignant(e).", saisie };
}

export async function entrer(inscriptionId: string, code: string): Promise<ResultatCode> {
  const resultat = await entrerLeCode(String(inscriptionId), String(code).slice(0, 10));
  if (resultat.ok) redirect("/travail");
  return resultat;
}

export async function changer(): Promise<void> {
  await changerDEleve();
  redirect("/classe/qui");
}

export async function quitter(): Promise<void> {
  await quitterLaClasse();
  redirect("/classe");
}

/**
 * La page d'un poste demande de temps en temps où elle en est : la classe a pu être
 * fermée (nuit, mot de passe remplacé, année terminée), l'élève retiré ou resté deux
 * heures sans rien faire (F06-AC75 à AC78). « actif » dit que l'élève vient d'agir.
 */
export async function veiller(actif: boolean): Promise<"eleve" | "classe" | "ferme"> {
  if (actif) await noterActivite();
  const etat = await etatDuPoste();
  if (!etat) return "ferme";
  return etat.inscriptionId ? "eleve" : "classe";
}
