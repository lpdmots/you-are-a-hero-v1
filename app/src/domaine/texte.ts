/** Outils de texte communs aux règles du domaine. */

/** Clé de comparaison : sans majuscules, sans accents, espaces réduits. */
export function cle(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** « s » du pluriel. */
export const pluriel = (n: number, marque = "s"): string => (n > 1 ? marque : "");

/** Première lettre en majuscule, le reste inchangé. */
export const majuscule = (texte: string): string => texte.charAt(0).toLocaleUpperCase("fr") + texte.slice(1);

/** « de Bilal », « d’Alice » : l'élision devant une voyelle ou un h. */
export const de = (nom: string): string => (/^[aeiouyàâäéèêëîïôöùûüh]/i.test(nom.trim()) ? `d’${nom.trim()}` : `de ${nom.trim()}`);
