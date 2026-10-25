import { Accueil, METADATA_ACCUEIL } from "../Accueil";

export const metadata = METADATA_ACCUEIL;

// Régénérée par les actions de l'administration (livres de l'accueil, offre), et toutes les cinq
// minutes au plus pour un prix changé par `npm run prix`, qui écrit dans la base sans passer par elle
export const revalidate = 300;

/**
 * L'accueil gardé en cache (F14-AC47), le même pour tous : le proxy y mène, sans changer l'adresse,
 * le visiteur qui n'a ni session ni poste de classe. `/vitrine` elle-même renvoie à `/`.
 */
export default function AccueilEnCache() {
  return <Accueil />;
}
