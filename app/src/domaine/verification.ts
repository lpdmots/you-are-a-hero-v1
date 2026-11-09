/**
 * La liste de vérification d'une scène (F13.2, F07.2, F07.4) : sous la consigne, quelques éléments
 * courts que l'élève coche en se relisant (« Décrire le garde. »). L'adulte les écrit ou les reçoit
 * de « ✦ Formuler » ; l'élève qui peut écrire la scène les coche, et ses coches restent avec la
 * scène. Une coche tient au libellé : un élément récrit redevient à vérifier.
 */

export const VERIFICATION = {
  /** Huit éléments au plus par scène */
  elementsMax: 8,
  /** Quatre-vingts caractères au plus par élément */
  longueurMax: 80,
} as const;

/** Ce que l'élève lit au-dessus de ses cases, et ce que les fiches impriment */
export const TITRE_ELEVE = "J'ai pensé à :";
/** Ce que l'adulte lit au-dessus de la liste */
export const TITRE_ADULTE = "Liste de vérification";

/** Un élément tel qu'il s'enregistre : une ligne, sans espace autour, coupé à sa longueur. */
export const elementPropre = (texte: string): string => texte.replace(/\s+/g, " ").trim().slice(0, VERIFICATION.longueurMax);

/** La liste telle qu'elle s'enregistre : sans élément vide, sans doublon, huit au plus. */
export function listePropre(elements: readonly unknown[]): string[] {
  const vus = new Set<string>();
  const liste: string[] = [];
  for (const brut of elements) {
    if (typeof brut !== "string") continue;
    const e = elementPropre(brut);
    if (!e || vus.has(e)) continue;
    vus.add(e);
    liste.push(e);
    if (liste.length >= VERIFICATION.elementsMax) break;
  }
  return liste;
}

/** Les éléments que l'élève a cochés et qui sont encore dans la liste. */
export const cocheesValides = (elements: readonly string[], cochees: readonly string[]): string[] => elements.filter((e) => cochees.includes(e));

/** Ce qui reste à vérifier avant de remettre. */
export const restants = (elements: readonly string[], cochees: readonly string[]): number => elements.filter((e) => !cochees.includes(e)).length;

/** « Il te reste 2 éléments à vérifier. » : le rappel à la remise (F07.2). */
export const rappelARemettre = (n: number): string => `Il te reste ${n === 1 ? "1 élément" : `${n} éléments`} à vérifier dans « J'ai pensé à ».`;

/** « 3 sur 4 cochés » : ce que l'adulte lit d'un coup d'œil, la consigne repliée. */
export const decompteDesCoches = (elements: readonly string[], cochees: readonly string[]): string =>
  `${cocheesValides(elements, cochees).length} sur ${elements.length} ${cocheesValides(elements, cochees).length > 1 ? "cochés" : "coché"}`;

/**
 * La consigne et sa liste en un seul texte, tel que les aides IA le lisent comme contexte (« ✦ Écrire »,
 * titres, idées de choix) : la liste dit ce que la scène doit contenir.
 */
export const consigneEtListe = (consigne: string | null | undefined, liste: readonly string[] | null | undefined): string | null => {
  const c = consigne?.trim() ?? "";
  const l = (liste ?? []).filter((e) => e.trim());
  if (!l.length) return c || null;
  return [c, TITRE_ELEVE, ...l.map((e) => `- ${e}`)].filter(Boolean).join("\n");
};
