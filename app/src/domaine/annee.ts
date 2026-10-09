/**
 * Année scolaire d'une classe (F01.1) : « 2026-2027 » se garde par son année de début.
 * Elle est proposée d'après la date et se corrige.
 */

/** Année de début proposée : la rentrée se prépare dès juillet. */
export function anneeProposee(aujourdhui: Date): number {
  const mois = aujourdhui.getMonth(); // 0 = janvier
  return mois >= 6 ? aujourdhui.getFullYear() : aujourdhui.getFullYear() - 1;
}

export const libelleAnnee = (debut: number): string => `${debut}-${debut + 1}`;

/** Les deux années offertes à la création : celle proposée et la suivante. */
export const anneesOffertes = (aujourdhui: Date): number[] => {
  const debut = anneeProposee(aujourdhui);
  return [debut, debut + 1];
};
