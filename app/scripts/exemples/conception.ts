/**
 * Ce que contient la conception d'un livre d'exemple (`scripts/exemples/<livre>.ts`) : de quoi
 * créer son projet de travail en local, sans IA (`npm run livres:exemple -- <clé> --brouillon`),
 * et ce que l'atelier des aides lui demande ensuite (`npm run livres:atelier -- <clé> …`).
 */
import type { AgeDesLecteurs, Degre } from "@/domaine/aides-ia";
import type { Style } from "@/domaine/illustration";
import type { Construction, Feuille, FormuleRenvoi } from "@/domaine/preparation";

export type SceneExemple = {
  ref: number;
  titre: string;
  consigne: string;
  fin?: true;
  /** Les choix : leur libellé et leur destination */
  choix?: [libelle: string, cible: number][];
  /** Phrase de choix écrite à la main : du texte, et le rang du choix à la place de chaque renvoi ; les choix qu'elle ne nomme pas gardent leur phrase automatique, avant elle */
  phrase?: (string | number)[];
  /** Un choix réservé au lecteur passé par une autre scène, ce que dit sa phrase (« Si le vieil homme t'a parlé… ») */
  condition?: { choix: number; apres: number };
  /** Liaison cachée par énigme (F05.1) */
  cachee?: { cible: number; libelle: string };
  /** Numéro fixé dans le livre : la destination d'une énigme, ou d'une règle du jeu */
  numero?: number;
};
export type ChapitreExemple = { cle: string; titre: string; couleur: number; visuel: string; resume: string; scenes: SceneExemple[] };
export type PartieExemple = { titre: string; visuel: string; chapitres: ChapitreExemple[] };

export type Conception = {
  TITRE: string;
  /** Les titres qu'il a portés : le livre déjà chargé sous l'un d'eux se retrouve, pour être remplacé */
  ANCIENS_TITRES?: string[];
  DEPART: number;
  AGE: AgeDesLecteurs;
  VISUEL_DU_PROJET: string;
  /** Le style des images du projet ; « lumineuse » sans autre indication */
  STYLE?: { style: Style; autre: string };
  /** « Pour l'IA, notre façon d'écrire » (F13), dans les réglages du projet */
  CONSIGNE_ECRITURE?: string;
  PREPARATION: {
    univers: string;
    personnages: string;
    enjeu: string;
    regles: string;
    formuleRenvoi: FormuleRenvoi;
    constructions: readonly Construction[];
  };
  /**
   * Les cartes de l'étape Personnages, le héros d'abord. `portrait` : l'aide le crée ; `planche` :
   * une image déjà faite, posée comme portrait par le brouillon (les planches des mascottes).
   */
  PERSONNAGES: { nom: string; autresNoms: string[]; heros: boolean; description: string; portrait: boolean; planche?: string }[];
  OBJETS: [nom: string, description: string][];
  FORMULES: [texte: string, signe: string][];
  FEUILLE: Feuille;
  /** Actions de jeu, par scène : elles se posent après le récit, avant les choix */
  ACTIONS: Record<number, string[]>;
  PARTIES: PartieExemple[];
  /** Les textes déjà écrits, qui passent à la correction */
  TEXTES_DE_BASE: Record<number, string[]>;
  /** La correction de l'atelier : son degré et le nombre de mots visé (aux degrés 4 et 5) */
  CORRECTION?: { degre: Degre; mots?: number };
  /** Les scènes vides, écrites par « ✦ Écrire » dans cet ordre */
  A_ECRIRE: number[];
  /** Le nombre de mots demandé à « ✦ Écrire », par scène, et à défaut */
  MOTS?: Record<number, number>;
  MOTS_PAR_DEFAUT?: number;
  /** « page » : pleine page ; « moitie » : 3:2 dans le texte ; « 16:9 » : bandeau dans le texte */
  IMAGES: { ref: number; cadrage: "page" | "moitie" | "16:9"; badges: string[]; idee: string }[];
};
