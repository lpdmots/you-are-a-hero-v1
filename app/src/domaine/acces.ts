/**
 * Informations de la classe et code personnel (F06.4, décisions du 8 octobre 2026).
 *
 * - Identifiant : lettres minuscules et chiffres, sans accent, unique.
 * - Mot de passe : deux mots simples et deux chiffres (« tigre nuage 42 »).
 * - Code personnel : quatre chiffres.
 * À la saisie, les majuscules et les espaces en trop sont ignorés (F06-AC81).
 */
import { MOTS } from "./mots";

/** Tirage entier dans [0, n[ ; remplaçable dans les tests. */
export type Tirage = (n: number) => number;

const sansAccent = (t: string): string => t.normalize("NFD").replace(/[̀-ͯ]/g, "");
const lettresEtChiffres = (t: string): string => sansAccent(t).toLowerCase().replace(/[^a-z0-9]/g, "");

/** Ce que l'élève a tapé, ramené à la forme gardée. */
export const normaliserIdentifiant = (saisie: string): string => saisie.trim().toLowerCase().replace(/\s+/g, "");
export const normaliserMotDePasse = (saisie: string): string => saisie.trim().toLowerCase().replace(/\s+/g, " ");

export const identifiantValide = (v: string): boolean => /^[a-z0-9]{3,30}$/.test(v);
export const codeValide = (v: string): boolean => /^[0-9]{4}$/.test(v);

/**
 * Ce que l'enseignant écrit pour l'identifiant, ramené à sa forme au fil de la frappe :
 * minuscules et chiffres, sans accent ni espace, trente caractères au plus.
 */
export const formerIdentifiant = (saisie: string): string => lettresEtChiffres(saisie).slice(0, 30);

/**
 * L'identifiant proposé pour une classe : son nom seul, sans celui de l'enseignant
 * (décisions du 9 octobre 2026). « CM1-CM2 » donne « cm1cm2 ». L'enseignant peut
 * toujours en écrire un autre ; s'il est pris, c'est lui qui choisit.
 */
export function identifiantPourClasse(nomClasse: string): string {
  const base = lettresEtChiffres(nomClasse).slice(0, 30);
  return base.length < 3 ? `classe${base}` : base;
}

/** Un identifiant voisin à suggérer quand celui-ci est pris : « cm2tigre ». */
export const autreIdentifiant = (identifiant: string, tirer: Tirage): string =>
  `${identifiant.slice(0, 20)}${MOTS[tirer(MOTS.length)]}`;

/**
 * Vrai si l'identifiant va déjà avec ce nom de classe : « cm2 », ou « cm2 » suivi d'un
 * mot simple. Quand la classe change de nom, il n'y a alors rien à proposer d'autre.
 */
export function identifiantConvient(identifiant: string, nomClasse: string): boolean {
  const base = identifiantPourClasse(nomClasse);
  if (!identifiant.startsWith(base)) return false;
  const suite = identifiant.slice(base.length);
  return suite === "" || (MOTS as readonly string[]).includes(suite);
}

/** « tigre nuage 42 » : deux mots différents, deux chiffres de 10 à 99. */
export function motDePassePropose(tirer: Tirage): string {
  const premier = MOTS[tirer(MOTS.length)];
  let second = MOTS[tirer(MOTS.length)];
  while (second === premier) second = MOTS[tirer(MOTS.length)];
  return `${premier} ${second} ${10 + tirer(90)}`;
}

const TROP_SIMPLES = new Set(["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321", "0123"]);

/** Code à quatre chiffres proposé, hors des suites que l'on devine. */
export function codePropose(tirer: Tirage): string {
  for (;;) {
    const code = String(tirer(10000)).padStart(4, "0");
    if (!TROP_SIMPLES.has(code)) return code;
  }
}

/** « 4 7 1 9 », pour se lire et se dicter. */
export const chiffresEspaces = (code: string): string => code.split("").join(" ");

/** Seuils des essais faux (F06-AC73, AC74, AC83), tenus par la base. */
export const ESSAIS = {
  codeFauxDeSuite: 5,
  attenteCodeMinutes: 2,
  entreeFausseParNavigateur: 10,
  entreeFausseParReseau: 100,
  attenteEntreeMinutes: 5,
} as const;
