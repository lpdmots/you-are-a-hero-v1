import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { estRubrique, NOM_RUBRIQUE } from "@/domaine/preparation";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { planDe, preparationDe } from "@/serveur/recit";
import { Atelier } from "./Atelier";

type Props = { params: Promise<{ projet: string; rubrique: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rubrique } = await params;
  return { title: estRubrique(rubrique) ? `Atelier — ${NOM_RUBRIQUE[rubrique]}` : "Atelier" };
}

/**
 * Atelier de préparation projeté (F02) : la même préparation que le carnet, présentée en
 * étapes pour la classe. La page reste celle de l'enseignant : la projeter ne donne aucun
 * accès aux élèves (F02-AC04). Il n'existe que pour un projet de classe.
 */
export default async function PageAtelier({ params }: Props) {
  const { projet: projetId, rubrique } = await params;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, projetId);
  if (!projet || projet.organisation !== "classe" || !estRubrique(rubrique)) notFound();
  const [preparation, plan] = await Promise.all([preparationDe(enseignant, projet.id), planDe(enseignant, projet.id)]);
  if (!preparation) notFound();
  return (
    <Messages>
      <Atelier
        key={rubrique}
        projet={{ id: projet.id, titre: projet.titre, organisation: projet.organisation, recit: projet.recit }}
        rubrique={rubrique}
        preparation={preparation}
        plan={plan}
      />
    </Messages>
  );
}
