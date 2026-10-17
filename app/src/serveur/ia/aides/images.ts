import { assembler, bloc, chaine, champs, liste, objet, texte, textes, type DefinitionAide } from "../aide";
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
Pour chacun : « nom » (le nom qu'on emploie le plus), « autres_noms » (les autres façons de le désigner dans l'histoire : « le passeur », « le vieux Maël »), « description » en quelques mots tirés de la préparation, « heros » vrai pour le personnage principal, celui que le lecteur suit ou incarne, et pour lui seul.
- Seulement les personnages que la préparation nomme ou décrit ; n'en invente aucun et n'ajoute rien à leur description.
- Une seule carte par personnage : le héros a la sienne sous son nom ; ne crée pas de carte « Le héros » ni « tu » à part. Seulement si le héros n'a aucun nom, sa carte s'appelle « Le héros ».
- Ne reprends pas les personnages qui ont déjà leur carte.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    bloc("personnages_retenus", e.carnet.personnages),
    bloc("univers", e.carnet.univers), bloc("enjeu", e.carnet.enjeu),
    bloc("idees_retenues", e.idees),
    bloc("cartes_existantes", e.connus.map((p) => p.nom)),
    "Repère les personnages.",
  ),
  schema: { nom: "personnages", schema: objet({ personnages: liste(objet({ nom: chaine, autres_noms: liste(chaine), description: chaine, heros: { type: "boolean" } })) }) },
  lire: (json, e) => {
    const l = champs(json)?.personnages;
    if (!Array.isArray(l)) return null;
    const connus = new Set(e.connus.map((p) => p.nom.toLocaleLowerCase("fr")));
    let heros = e.connus.some((p) => p.heros);
    const sortie = l.flatMap((b) => {
      const o = champs(b);
      const nom = texte(o?.nom, 60);
      const description = texte(o?.description, 400) ?? "";
      if (!nom || connus.has(nom.toLocaleLowerCase("fr"))) return [];
      connus.add(nom.toLocaleLowerCase("fr"));
      const estHeros = o?.heros === true && !heros;
      if (estHeros) heros = true;
      return [{ nom, autresNoms: textes(o?.autres_noms, 60)?.slice(0, 5) ?? [], description, heros: estHeros }];
    });
    return { personnages: sortie.slice(0, 12) };
  },
  simuler: () => ({ personnages: [{ nom: "Lou", autres_noms: ["le garçon"], description: "Fils du passeur, a peur de l'eau.", heros: true }] }),
};

export type EntreeFiche = { histoire: Histoire; sorte: "personnage" | "objet"; nom: string; description: string; univers?: string };

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
  message: (e) => assembler(presentation(e.histoire), bloc("univers", e.univers), bloc(e.sorte, `${e.nom} : ${e.description}`), "Écris sa fiche visuelle."),
  schema: { nom: "fiche", schema: objet({ fiche: chaine }) },
  lire: (json) => {
    const t = texte(champs(json)?.fiche, 900);
    return t ? { fiche: t } : null;
  },
  simuler: (e) => ({ fiche: `${e.nom}, ${e.description}` }),
};

export type Cadrage = "pleine-page" | "3:2" | "16:9" | "carre";

export const CADRAGES: Record<Cadrage, string> = {
  "pleine-page": "illustration pleine page, en hauteur",
  "3:2": "illustration horizontale, format 3:2",
  "16:9": "bandeau horizontal, format 16:9",
  carre: "illustration carrée",
};

export type EntreeDescription = {
  histoire: Histoire;
  /** « Ce que montre l'image » : l'idée de l'élève ou de l'adulte, s'il y en a une */
  idee: string;
  paragraphes: string[];
  chapitre?: { titre: string; resume?: string };
  cadrage: Cadrage;
  /** Le héros n'est pas représenté : au plus des mains neutres (F10-AC08) */
  herosAbsent: boolean;
  /** Personnages et objets retenus par leurs badges, avec leur fiche visuelle */
  badges: { nom: string; fiche: string }[];
};

/** « ✦ Proposer la description » : ce que montre l'image, sans le style ni les fiches, que l'application ajoute. */
export const descriptionImage: DefinitionAide<EntreeDescription, { description: string }> = {
  aide: "description-image",
  sortieMax: 500,
  systeme: (e) => assembler(
    REGLES_COMMUNES,
    `Tu décris l'image à créer pour une scène du livre, en français, comme on le demanderait à un illustrateur : ce qu'on voit, où, la lumière, l'ambiance, la composition.
- Une image ne montre qu'un instant : choisis le moment le plus parlant de la scène, ou celui que décrit l'idée donnée.
- Les personnages et objets retenus apparaissent ; nomme-les, sans redécrire leur apparence, que l'application ajoutera.
- ${e.herosAbsent ? "Le héros n'est PAS représenté : ni son visage ni son corps. Au plus, ses mains, neutres (sans bijou, ni manche distinctive, ni couleur de peau marquée), quand il agit sur un objet." : "Le héros est représenté, comme un personnage retenu."}
- Aucun texte, lettre ni chiffre dans l'image. Pas de style de dessin : l'application l'ajoutera.
- Au plus quatre-vingts mots.`,
  ),
  message: (e) => assembler(
    presentation(e.histoire),
    e.chapitre ? bloc("chapitre", `${e.chapitre.titre}${e.chapitre.resume ? ` : ${e.chapitre.resume}` : ""}`) : "",
    bloc("texte_de_la_scene", e.paragraphes.join("\n")),
    bloc("idee", e.idee),
    bloc("retenus", e.badges.map((b) => b.nom)),
    bloc("cadrage", CADRAGES[e.cadrage]),
    "Décris l'image.",
  ),
  schema: { nom: "description", schema: objet({ description: chaine }) },
  lire: (json) => {
    const t = texte(champs(json)?.description, 1200);
    return t ? { description: t } : null;
  },
  simuler: (e) => ({ description: e.idee || "Un quai dans la brume, le soir, éclairé par une lanterne." }),
};
