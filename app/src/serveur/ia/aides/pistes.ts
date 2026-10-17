import { niveauEnMots } from "@/domaine/aides-ia";
import { assembler, bloc, chaine, champs, liste, objet, textes, type DefinitionAide } from "../aide";
import { REGLES_COMMUNES, type Histoire } from "./contexte";

/**
 * « Proposer des pistes », sous la remarque de reprise (F13.1, F07.3) : deux ou trois pistes
 * que l'élève lira, qui remplissent la remarque si elle est vide ou s'ajoutent à la suite.
 * Mode classe seulement : un adulte seul ne se demande pas de reprise.
 */
export type EntreePistes = { histoire: Histoire; paragraphes: string[]; consigne: string | null };
export type Pistes = { pistes: string[] };

/** Les pistes, une par ligne, comme l'élève les lit dans la remarque. */
export const remarqueDesPistes = (p: Pistes): string => p.pistes.map((l) => `– ${l}`).join("\n");

export const pistes: DefinitionAide<EntreePistes, Pistes> = {
  aide: "pistes",
  sortieMax: 600,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `L'enseignant demande à un élève (${niveauEnMots(e.histoire.niveaux)}) de reprendre sa scène. Tu proposes deux ou trois pistes de reprise que l'élève lira lui-même.
- Tu tutoies l'élève, avec des mots qu'il comprend seul, une phrase courte par piste.
- Chaque piste est concrète et dit quoi faire, en s'appuyant sur son texte (« Dis ce que ressent Lou quand la barque bouge »), pas un jugement (« Ton texte est trop court »).
- Commence par ce qui compte le plus pour répondre à la consigne ; laisse l'orthographe de côté, sauf si elle empêche de comprendre.
- Pas de compliment ni de formule d'introduction : seulement les pistes, sans numéro ni tiret.`,
  ),
  message: (e) => assembler(bloc("consigne", e.consigne), bloc("texte_de_l_eleve", e.paragraphes.join("\n")), "Propose deux ou trois pistes."),
  schema: { nom: "pistes", schema: objet({ pistes: liste(chaine) }) },
  lire: (json) => {
    const l = textes(champs(json)?.pistes, 240)?.map((p) => p.replace(/^[–\-•\d.)\s]+/, ""));
    return l && l.length >= 1 && l.length <= 4 ? { pistes: l.slice(0, 3) } : null;
  },
  simuler: () => ({ pistes: ["Dis ce que tu vois en arrivant.", "Montre ce que ressent ton héros."] }),
};
