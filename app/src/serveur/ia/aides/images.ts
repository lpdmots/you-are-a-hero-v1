import { assembler, bloc, chaine, champs, liste, objet, texte, textes, type DefinitionAide } from "../aide";
import { CADRAGES_EN_MOTS, DESCRIPTION_IMAGE_MAX, type Cadrage } from "@/domaine/illustration";
import { lireAutresNoms } from "@/domaine/personnages";
import { REGLES_COMMUNES, presentation, type Carnet, type Histoire } from "./contexte";

/**
 * Les aides de texte qui préparent les images (F10.2) : repérer les personnages, préciser une
 * fiche visuelle, proposer la description d'une image. Les prompts sont en français, lisibles
 * et faciles à retoucher. La fiche visuelle se reprend mot pour mot : l'application l'ajoute
 * elle-même au prompt, sans la confier au modèle.
 */

export type PersonnageConnu = { nom: string; autresNoms: string[]; description: string; heros: boolean };

export type EntreePersonnages = { histoire: Histoire; carnet: Carnet; idees: string[]; connus: PersonnageConnu[] };

export const personnages: DefinitionAide<EntreePersonnages, { personnages: PersonnageConnu[] }> = {
  aide: "personnages",
  sortieMax: 1500,
  systeme: () => assembler(
    REGLES_COMMUNES,
    `Tu repères les personnages importants d'une histoire d'après ce que la préparation en retient, pour en faire des cartes.
Pour chacun : « nom » (le nom qu'on emploie le plus), « autres_noms » (les autres façons de le désigner dans l'histoire : « le passeur », « le vieux Maël »), « description » en quelques mots tirés de la préparation, « heros » vrai pour le personnage que le lecteur suit ou incarne.
- Plusieurs héros seulement si la préparation en retient plusieurs (au choix du lecteur, en groupe…) ; leur description dit ce que chacun sait faire, si la préparation le dit.
- Seulement les personnages que la préparation nomme ou décrit ; n'en invente aucun et n'ajoute rien à leur description.
- Une seule carte par personnage : le héros a la sienne sous son nom ; ne crée pas de carte « Le héros » ni « tu » à part. Seulement si le héros n'a aucun nom, sa carte s'appelle « Le héros ».
- Ne reprends pas les personnages qui ont déjà leur carte, sous leur nom ou l'un de leurs autres noms.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    bloc("personnages_retenus", e.carnet.personnages),
    bloc("univers", e.carnet.univers), bloc("enjeu", e.carnet.enjeu),
    bloc("idees_retenues", e.idees),
    // Les héros ont chacun leur texte retenu (18 octobre 2026) : les personnages s'y nomment aussi
    bloc("cartes_existantes", e.connus.map((p) => `${[p.nom, ...p.autresNoms].join(", ")}${p.heros ? " (héros)" : ""}${p.description.trim() ? ` : ${p.description.trim()}` : ""}`)),
    "Repère les personnages.",
  ),
  schema: { nom: "personnages", schema: objet({ personnages: liste(objet({ nom: chaine, autres_noms: liste(chaine), description: chaine, heros: { type: "boolean" } })) }) },
  lire: (json, e) => {
    const l = champs(json)?.personnages;
    if (!Array.isArray(l)) return null;
    // Plusieurs héros sont possibles, au choix du lecteur (F10.2, 18 octobre 2026)
    const connus = new Set(e.connus.flatMap((p) => [p.nom, ...p.autresNoms]).map((n) => n.toLocaleLowerCase("fr")));
    const sortie = l.flatMap((b) => {
      const o = champs(b);
      const nom = texte(o?.nom, 60);
      const description = texte(o?.description, 400) ?? "";
      if (!nom || connus.has(nom.toLocaleLowerCase("fr")) || /^(tu|toi|le lecteur)$/i.test(nom)) return [];
      connus.add(nom.toLocaleLowerCase("fr"));
      const autresNoms = lireAutresNoms((textes(o?.autres_noms, 60) ?? []).filter((n) => !connus.has(n.toLocaleLowerCase("fr"))), nom);
      return [{ nom, autresNoms, description, heros: o?.heros === true }];
    });
    return { personnages: sortie.slice(0, 12) };
  },
  simuler: () => ({
    personnages: [
      { nom: "Lou", autres_noms: ["le garçon"], description: "Fils du passeur, dix ans, a peur de l'eau.", heros: true },
      { nom: "Maël", autres_noms: ["le passeur", "le vieux Maël"], description: "Le père de Lou, disparu dans la brume.", heros: false },
      { nom: "Brindille", autres_noms: ["la chouette"], description: "Une chouette qui guide Lou la nuit.", heros: false },
    ],
  }),
};

export type EntreeFiche = {
  histoire: Histoire;
  sorte: "personnage" | "objet";
  nom: string;
  description: string;
  univers?: string;
  /** Ce que la Préparation retient des personnages, où l'apparence est parfois dite */
  retenu?: string;
  /** La fiche déjà écrite, à préciser plutôt qu'à refaire */
  ficheActuelle?: string;
};

/** « ✦ Préciser pour les images » : la fiche visuelle, retouchable, reprise mot pour mot ensuite. */
export const ficheVisuelle: DefinitionAide<EntreeFiche, { fiche: string }> = {
  aide: "fiche-visuelle",
  sortieMax: 400,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    e.sorte === "personnage"
      ? `Tu écris la fiche visuelle d'un personnage : une description de son apparence, reprise mot pour mot dans chaque image pour qu'il reste le même d'une image à l'autre.
Dans cet ordre, quand cela s'applique : âge apparent, silhouette, visage, cheveux ou pelage ou plumage, vêtements et leurs couleurs, objet fétiche. Omets sans le dire ce qui ne s'applique pas (une chouette n'a pas de vêtements).
Un objet fétiche ou un accessoire seulement si la description ou l'univers en donnent un : n'en invente pas.`
      : `Tu écris la fiche visuelle d'un objet : une description de son apparence (forme, taille, matière, couleurs, détails distinctifs), reprise mot pour mot dans chaque image pour qu'il reste le même.`,
    `- Pars de la description de l'adulte : garde tout ce qu'elle dit, précise ce qu'elle laisse ouvert, de façon simple et cohérente avec l'univers.
- Des traits concrets et visibles ; pas d'émotion, d'histoire ni de style de dessin.
- Au plus soixante-dix mots, en phrases simples.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    bloc("univers", e.univers),
    e.sorte === "personnage" ? bloc("personnages_retenus", e.retenu) : "",
    bloc(e.sorte, `${e.nom} : ${e.description}`),
    bloc("fiche_actuelle", e.ficheActuelle),
    e.ficheActuelle?.trim() ? "Reprends la fiche actuelle : garde ce qu'elle dit, précise-la et complète-la." : "Écris sa fiche visuelle.",
  ),
  schema: { nom: "fiche", schema: objet({ fiche: chaine }) },
  lire: (json) => {
    const t = texte(champs(json)?.fiche, 900);
    return t ? { fiche: t } : null;
  },
  simuler: (e) => ({
    fiche: e.sorte === "personnage"
      ? `Environ dix ans, petit et vif. Visage rond, joues roses, yeux noisette. Cheveux bruns en bataille. Ciré jaune moutarde sur un pull bleu marine, bottes vertes. Porte une petite lanterne de cuivre.`
      : `${e.nom} : objet de cuivre patiné, grand comme une main, poignée arrondie, verre légèrement bleuté.`,
  }),
};

export type EntreeDescription = {
  histoire: Histoire;
  /** L'image d'une scène, ou l'illustration de couverture (F11.4) */
  pour: "scene" | "couverture";
  /** « Ce que montre l'image » : l'idée de l'élève ou de l'adulte, s'il y en a une */
  idee: string;
  /** Les paragraphes de récit de la scène ; pour la couverture, rien */
  paragraphes: string[];
  chapitre?: { titre: string; resume?: string };
  /** Pour la couverture : l'univers et l'enjeu que la Préparation retient */
  univers?: string;
  enjeu?: string;
  cadrage: Cadrage | "couverture";
  /** Le héros n'est pas représenté : au plus des mains neutres (F10-AC08) */
  herosAbsent: boolean;
  /** Personnages et objets retenus par leurs badges ; leur fiche est ajoutée par l'application */
  badges: { nom: string }[];
};

/**
 * « ✦ Proposer la description » (F10.2) : ce que montre l'image, d'après la scène, le chapitre et
 * les badges, sans le style ni les fiches, que l'application ajoute elle-même au prompt.
 */
export const descriptionImage: DefinitionAide<EntreeDescription, { description: string }> = {
  aide: "description-image",
  sortieMax: 500,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    e.pour === "couverture"
      ? `Tu décris l'illustration de couverture d'un livre, en français, comme on la demanderait à un illustrateur : ce qu'on voit, où, la lumière, l'ambiance, la composition.
- Une image qui donne envie d'ouvrir le livre, tirée de son univers et de son enjeu, sans rien dévoiler de la fin.
- Laisse le haut de l'image assez calme pour le titre.`
      : `Tu décris l'image à créer pour une scène du livre, en français, comme on le demanderait à un illustrateur : ce qu'on voit, où, la lumière, l'ambiance, la composition.
- Une image ne montre qu'un instant : choisis le moment le plus parlant de la scène, ou celui que décrit l'idée donnée.
- Les personnages et objets retenus apparaissent ; nomme-les, sans redécrire leur apparence, que l'application ajoutera.`,
    `- ${e.herosAbsent ? "Le héros n'est PAS représenté : ni son visage ni son corps. Au plus, ses mains, neutres (sans bijou, ni manche distinctive, ni couleur de peau marquée), quand il agit sur un objet." : "Le héros est représenté, comme un personnage retenu."}
- Aucun texte, lettre ni chiffre dans l'image. Pas de style de dessin : l'application l'ajoutera.
- Au plus quatre-vingts mots.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    e.chapitre ? bloc("chapitre", `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}`) : "",
    bloc("univers", e.univers), bloc("enjeu", e.enjeu),
    e.paragraphes.length ? bloc("texte_de_la_scene", e.paragraphes.join("\n")) : "",
    bloc("idee", e.idee),
    bloc("retenus", e.badges.map((b) => b.nom)),
    bloc("cadrage", e.cadrage === "couverture" ? "couverture, image de face en hauteur" : CADRAGES_EN_MOTS[e.cadrage]),
    e.pour === "couverture" ? "Décris l'illustration de couverture." : "Décris l'image.",
  ),
  schema: { nom: "description", schema: objet({ description: chaine }) },
  lire: (json) => {
    const t = texte(champs(json)?.description, DESCRIPTION_IMAGE_MAX);
    return t ? { description: t } : null;
  },
  simuler: (e) => ({
    description: e.idee.trim()
      ? `${e.idee.trim()}, dans une lumière de fin de journée.`
      : e.pour === "couverture"
        ? "Un lac noyé de brume au lever du jour, une barque vide amarrée à un ponton, une lanterne allumée à sa proue."
        : "Un quai dans la brume, le soir, éclairé par une lanterne.",
  }),
};
