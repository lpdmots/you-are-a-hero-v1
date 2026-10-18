/**
 * Les personnages de l'histoire (F10.2, F02) : une carte par personnage important, dans
 * l'étape « Personnages » de la Préparation. Plusieurs peuvent porter la marque « héros »,
 * sans limite, quand le lecteur choisit le sien (décision du 18 octobre 2026) ; la compétence
 * d'un héros s'écrit dans sa description. Les cartes servent de contexte aux aides et donnent
 * aux images une fiche visuelle et un portrait de référence.
 */

export const NOM_MAX = 60;
export const AUTRES_NOMS_MAX = 5;
/** La description d'un héros est son « Nous retenons » (18 octobre 2026) : la longueur d'un texte retenu */
export const DESCRIPTION_MAX = 6000;
/** Celle d'un autre personnage tient en une ligne ou deux */
export const DESCRIPTION_COURTE_MAX = 400;

/**
 * « tu » désigne le héros, et tous les héros quand il y en a plusieurs : ce n'est jamais l'autre
 * nom d'un personnage (18 octobre 2026). Le héros rejoint une image par la règle du badge.
 */
export const estUnPronomDuLecteur = (nom: string): boolean => /^(tu|toi|te|vous)$/i.test(nom.trim());
export const FICHE_MAX = 900;

export type Personnage = {
  id: string;
  nom: string;
  /** « le passeur », « le vieux Maël » */
  autresNoms: string[];
  heros: boolean;
  description: string;
  /** La fiche visuelle, reprise mot pour mot dans chaque image */
  fiche: string;
  /** Le portrait de référence, une image du projet */
  portraitId: string | null;
};

/** Une ligne de texte propre et bornée. */
export const ligne = (v: unknown, max: number): string => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** Un texte de plusieurs lignes, propre et borné. */
export const paragraphes = (v: unknown, max: number): string =>
  String(v ?? "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim().slice(0, max);

/**
 * « le passeur, le vieux Maël » : les autres noms, séparés par des virgules ou des points-virgules,
 * sans doublon ni le nom lui-même, ni « tu », cinq au plus.
 */
export function lireAutresNoms(texte: string | readonly string[], nom = ""): string[] {
  const morceaux = typeof texte === "string" ? texte.split(/[,;\n]/) : [...texte];
  const vus = new Set([nom.trim().toLocaleLowerCase("fr")]);
  const sortie: string[] = [];
  for (const m of morceaux) {
    const t = ligne(m, NOM_MAX);
    const cle = t.toLocaleLowerCase("fr");
    if (!t || vus.has(cle) || estUnPronomDuLecteur(t)) continue;
    vus.add(cle);
    sortie.push(t);
    if (sortie.length === AUTRES_NOMS_MAX) break;
  }
  return sortie;
}

export const autresNomsEnTexte = (p: Pick<Personnage, "autresNoms">): string => p.autresNoms.join(", ");

/** Les héros, dans l'ordre des cartes : aucun, un seul, ou plusieurs au choix du lecteur. */
export const herosDe = <P extends Pick<Personnage, "heros">>(personnages: readonly P[]): P[] => personnages.filter((p) => p.heros);

/**
 * Les noms propres que la correction ne touche pas (F13.1) : les noms des personnages et leurs
 * autres noms, puis ceux des objets, sans doublon.
 */
export function nomsPropresDeLHistoire(personnages: readonly Pick<Personnage, "nom" | "autresNoms">[], objets: readonly { nom: string }[]): string[] {
  const vus = new Set<string>();
  const sortie: string[] = [];
  for (const n of [...personnages.flatMap((p) => [p.nom, ...p.autresNoms]), ...objets.map((o) => o.nom)]) {
    const t = n.trim();
    if (t && !vus.has(t.toLocaleLowerCase("fr"))) {
      vus.add(t.toLocaleLowerCase("fr"));
      sortie.push(t);
    }
  }
  return sortie;
}

/**
 * Les noms qu'un personnage repéré par l'IA ne doit pas reprendre : une carte existante sous son
 * nom ou l'un de ses autres noms.
 */
export function dejaUneCarte(nom: string, personnages: readonly Pick<Personnage, "nom" | "autresNoms">[]): boolean {
  const cle = nom.trim().toLocaleLowerCase("fr");
  return personnages.some((p) => [p.nom, ...p.autresNoms].some((n) => n.trim().toLocaleLowerCase("fr") === cle));
}
