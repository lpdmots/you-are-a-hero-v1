import "server-only";
import { composerLaFiche, type FicheDeLHistoire } from "@/domaine/fiche-histoire";
import type { Organisation } from "@/domaine/projets";
import type { Enseignant } from "./adulte";
import { projetDe } from "./lectures";
import { preparationDe } from "./recit";

/**
 * La fiche de l'histoire d'un projet de l'adulte (F02.1), relue dans la Préparation à chaque
 * ouverture : un lieu ajouté y figure sans autre geste (F02-AC22). Un projet qui n'est pas le
 * sien ne rend rien : la base ne lui donne ni le projet ni sa Préparation (F02-AC24).
 */
export async function ficheDuProjet(e: Enseignant, projetId: string): Promise<{ fiche: FicheDeLHistoire; organisation: Organisation } | null> {
  const projet = await projetDe(e, projetId);
  if (!projet) return null;
  const preparation = await preparationDe(e, projet.id);
  if (!preparation) return null;
  return {
    organisation: projet.organisation,
    fiche: composerLaFiche(
      { titre: projet.titre, organisation: projet.organisation, recit: projet.recit, consigneEcriture: projet.consigneEcriture },
      preparation,
    ),
  };
}
