import { redirect } from "next/navigation";
import { enseignantCourant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { etatDuPoste } from "@/serveur/poste";
import { Accueil, METADATA_ACCUEIL } from "./Accueil";

export const metadata = METADATA_ACCUEIL;

/**
 * L'accueil quand le navigateur porte une session ou le témoin d'un poste : l'adulte connecté retrouve
 * son dernier projet, et le poste d'une classe ouverte retourne à l'espace des élèves (F06-AC53). Sans
 * l'un ni l'autre, le proxy sert la copie gardée en cache (`vitrine`, F14-AC47).
 */
export default async function AccueilDeCeNavigateur() {
  const enseignant = await enseignantCourant();
  if (enseignant) {
    const projet = enseignant.dernierProjetId ? await projetDe(enseignant, enseignant.dernierProjetId) : null;
    redirect(projet ? `/projet/${projet.id}/${projet.dernierOnglet}` : "/projets");
  }
  const poste = await etatDuPoste();
  if (poste) redirect(poste.inscriptionId ? "/travail" : "/classe/qui");
  return <Accueil />;
}
