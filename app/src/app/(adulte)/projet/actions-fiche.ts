"use server";

import { revalidatePath } from "next/cache";
import { exigerEnseignant } from "@/serveur/adulte";
import { garderLesRubriques } from "@/serveur/fiche-histoire";

/**
 * Les rubriques décochées de la fiche de l'histoire (F02.1), gardées avec le projet : une prochaine
 * ouverture de la fiche les retrouve.
 */
export async function reglerLesRubriques(projetId: string, masquees: string[]) {
  const fait = await garderLesRubriques(await exigerEnseignant(), projetId, masquees);
  if (fait.ok) revalidatePath(`/projet/${projetId}/fiche-de-l-histoire`);
  return fait;
}
