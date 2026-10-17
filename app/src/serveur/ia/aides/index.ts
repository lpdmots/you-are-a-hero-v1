import type { AideTexte } from "@/domaine/aides-ia";
import type { DefinitionAide } from "../aide";
import { consigne } from "./consigne";
import { correction } from "./correction";
import { ecriture } from "./ecriture";
import { ideesChoix } from "./idees-choix";
import { descriptionImage, ficheVisuelle, personnages } from "./images";
import { pistes } from "./pistes";
import { chapitres, parties, resume } from "./plan";
import { idees, questions, retenons } from "./preparation";
import { titre } from "./titre";

/** Toutes les aides de texte, par leur nom : chacune a sa définition, et une seule. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AIDES: Record<AideTexte, DefinitionAide<any, any>> = {
  correction, pistes, consigne, titre, ecriture, "idees-choix": ideesChoix, questions, idees, retenons, parties, chapitres, resume, personnages,
  "fiche-visuelle": ficheVisuelle, "description-image": descriptionImage,
};
