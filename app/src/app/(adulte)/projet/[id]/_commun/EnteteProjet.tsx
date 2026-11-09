import { SuiviDesImages } from "@/composants/ImagesALAjout";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { NOM_ONGLET, type Onglet } from "@/domaine/projets";
import type { Enseignant } from "@/serveur/adulte";
import { projetDeLaColonne, type Projet } from "@/serveur/lectures";

/**
 * Ce que toute page du projet pose (F06.5, révisé le 8 novembre 2026) : le projet dans la colonne de
 * navigation, avec l'onglet qu'elle désigne (`actif`, celui de la page ou celui d'où l'on vient ;
 * aucun pour ses réglages), et le suivi des images en route, la page se relisant à leur arrivée.
 */
export async function ColonneDuProjet({
  enseignant, projet, actif, suivreLesImages = true,
}: {
  enseignant: Enseignant; projet: Projet; actif: Onglet | null;
  /** La page du chapitre suit déjà les images en route */
  suivreLesImages?: boolean;
}) {
  const colonne = await projetDeLaColonne(enseignant, projet);
  return (
    <>
      <ProjetOuvert projet={colonne} actif={actif} />
      {suivreLesImages ? <SuiviDesImages projetId={projet.id} /> : null}
    </>
  );
}

/**
 * En tête d'une page du projet : le projet dans la colonne, puis la ligne de titre de la page, son nom
 * à gauche et, à droite, la place de son bouton « Aide » (F06-AC98, 8 novembre 2026).
 */
export async function EnteteProjet({ enseignant, projet, onglet }: { enseignant: Enseignant; projet: Projet; onglet: Onglet | null }) {
  return (
    <>
      <ColonneDuProjet enseignant={enseignant} projet={projet} actif={onglet} />
      <header className="page-tete page-tete--onglet">
        <h1>{onglet ? NOM_ONGLET[onglet] : "Réglages du projet"}</h1>
        <div className="page-tete__cmd" id="tete-de-page" />
      </header>
    </>
  );
}
