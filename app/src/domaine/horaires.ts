/**
 * Horaires d'accès au travail (F06.4) : des jours cochés et une plage d'heures,
 * d'autres plages pouvant s'ajouter. Ils se lisent à l'heure de la classe, qui suit
 * seule l'heure d'été et l'heure d'hiver (F06-AC80).
 */
import { majuscule } from "./texte";

export type Plage = { jours: number[]; de: string; a: string }; // jours : 1 = lundi … 7 = dimanche ; heures « HH:MM »

export const FUSEAU = "Europe/Paris";
export const JOURS_COURTS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."] as const;
const JOURS_LONGS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;

export const PLAGE_PAR_DEFAUT: Plage = { jours: [1, 2, 4, 5], de: "08:30", a: "16:30" };

/** « 8 h 30 », « 8h30 », « 8h », « 08:30 », « 16 » → « 08:30 » ; sinon null. */
export function lireHeure(saisie: string): string | null {
  const m = saisie.trim().toLowerCase().match(/^(\d{1,2})\s*(?:h|:|\s)?\s*(\d{1,2})?$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** « 08:30 » → « 8 h 30 » ; « 16:00 » → « 16 h ». Les secondes de la base sont ignorées. */
export function ecrireHeure(heure: string): string {
  const [h, min] = heure.split(":").map(Number);
  return min ? `${h} h ${String(min).padStart(2, "0")}` : `${h} h`;
}

const minutes = (heure: string): number => {
  const [h, min] = heure.split(":").map(Number);
  return h * 60 + min;
};

/** « Lun., mar., jeu., ven. · 8 h 30 – 16 h 30 » */
export const textePlage = (p: Plage): string =>
  `${majuscule([...p.jours].sort((x, y) => x - y).map((j) => JOURS_COURTS[j - 1]).join(", "))} · ${ecrireHeure(p.de)} – ${ecrireHeure(p.a)}`;

export const plageValide = (p: Plage): boolean =>
  p.jours.length > 0 && p.jours.every((j) => Number.isInteger(j) && j >= 1 && j <= 7) &&
  /^\d{2}:\d{2}$/.test(p.de) && /^\d{2}:\d{2}$/.test(p.a) && minutes(p.de) < minutes(p.a);

/** Jour de la semaine et minutes écoulées, à l'horloge du fuseau. */
export function horlogeLocale(instant: Date, fuseau: string = FUSEAU): { jour: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: fuseau, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(instant);
  const valeur = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const jour = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(valeur("weekday")) + 1;
  return { jour, minutes: Number(valeur("hour")) * 60 + Number(valeur("minute")) };
}

/** La classe est-elle ouverte au travail à cet instant ? Sans limite, toujours (F06-AC27). */
export function travailOuvert(limites: boolean, plages: readonly Plage[], instant: Date, fuseau: string = FUSEAU): boolean {
  if (!limites) return true;
  const { jour, minutes: m } = horlogeLocale(instant, fuseau);
  return plages.some((p) => p.jours.includes(jour) && m >= minutes(p.de) && m < minutes(p.a));
}

/** Heure de fin de la plage en cours, ou null. */
export function finDePlage(limites: boolean, plages: readonly Plage[], instant: Date, fuseau: string = FUSEAU): string | null {
  if (!limites) return null;
  const { jour, minutes: m } = horlogeLocale(instant, fuseau);
  const fins = plages.filter((p) => p.jours.includes(jour) && m >= minutes(p.de) && m < minutes(p.a)).map((p) => p.a);
  return fins.sort().at(-1) ?? null;
}

/** Quand le travail rouvre : « demain, 8 h 30 », « lundi, 8 h 30 », « 13 h 30 » ; null si jamais. */
export function prochaineOuverture(plages: readonly Plage[], instant: Date, fuseau: string = FUSEAU): string | null {
  const { jour, minutes: m } = horlogeLocale(instant, fuseau);
  for (let dans = 0; dans <= 7; dans += 1) {
    const j = ((jour - 1 + dans) % 7) + 1;
    const debuts = plages
      .filter((p) => p.jours.includes(j) && (dans > 0 || minutes(p.de) > m))
      .map((p) => p.de)
      .sort();
    if (!debuts.length) continue;
    const heure = ecrireHeure(debuts[0]);
    if (dans === 0) return heure;
    if (dans === 1) return `demain, ${heure}`;
    return `${JOURS_LONGS[j - 1]}, ${heure}`;
  }
  return null;
}
