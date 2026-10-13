/** Dates dites en mots, à l'heure de Paris, la même sur le serveur et dans le navigateur. */

const FUSEAU = "Europe/Paris";
const JOUR = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, weekday: "long", day: "numeric", month: "long" });
const HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, hour: "numeric", minute: "2-digit", hour12: false });

// Un jour sans heure (« 2026-10-06 ») se lit à midi : aucun fuseau ne le fait changer de date
const instant = (date: string): Date => new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00Z` : date);

/** « mardi 6 octobre », « jeudi 1er octobre ». */
export const jourEnMots = (date: string): string => JOUR.format(instant(date)).replace(/ 1 /, " 1er ");

/** « 10 h 42 », « 9 h 05 ». */
export function heureEnMots(date: string): string {
  const parts = HEURE.formatToParts(instant(date));
  const heure = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  return `${heure} h ${parts.find((p) => p.type === "minute")?.value ?? "00"}`;
}

/** « 29 septembre », « 1er octobre » : le jour sans son nom, pour un onglet. */
export const jourCourt = (date: string): string => jourEnMots(date).replace(/^\S+ /, "");
