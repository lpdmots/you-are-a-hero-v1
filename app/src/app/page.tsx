import { redirect } from "next/navigation";
import { enseignantCourant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { etatDuPoste } from "@/serveur/poste";

/**
 * Arrivée. Connecté, l'adulte reprend son dernier projet à son dernier onglet, sans
 * choisir ; sans projet, il arrive sur « Mes projets » (F06-AC53). Un poste où la
 * classe est ouverte retourne à l'espace des élèves.
 */
export default async function Arrivee() {
  const enseignant = await enseignantCourant();
  if (enseignant) {
    const projet = enseignant.dernierProjetId ? await projetDe(enseignant, enseignant.dernierProjetId) : null;
    redirect(projet ? `/projet/${projet.id}/${projet.dernierOnglet}` : "/projets");
  }
  const poste = await etatDuPoste();
  if (poste) redirect(poste.inscriptionId ? "/travail" : "/classe/qui");
  redirect("/entree");
}
