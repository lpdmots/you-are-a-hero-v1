import { notFound, redirect } from "next/navigation";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";

/** Ouvrir un projet, c'est le reprendre à son dernier onglet utilisé (F06-AC53). */
export default async function OuvrirProjet({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet) notFound();
  redirect(`/projet/${projet.id}/${projet.dernierOnglet}`);
}
