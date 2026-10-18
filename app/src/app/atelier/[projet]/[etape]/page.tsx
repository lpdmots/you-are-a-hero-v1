import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AidesIa } from "@/composants/AidesIa";
import { Messages } from "@/composants/Messages";
import { estRubrique, NOM_RUBRIQUE } from "@/domaine/preparation";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { planDe, preparationDe } from "@/serveur/recit";
import { Projection } from "./Projection";

type Props = { params: Promise<{ projet: string; etape: string }>; searchParams: Promise<{ heros?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { etape } = await params;
  return { title: estRubrique(etape) ? `Préparation projetée — ${NOM_RUBRIQUE[etape]}` : "Préparation projetée" };
}

/**
 * « Projeter » (F02, 17 octobre 2026) : une étape de l'histoire de la Préparation, le même écran
 * en grand, sans la barre de l'application. La page reste celle de l'enseignant : la projeter ne
 * donne aucun accès aux élèves (F02-AC04). Elle n'existe que pour un projet de classe.
 */
export default async function PageProjection({ params, searchParams }: Props) {
  const { projet: projetId, etape } = await params;
  const { heros } = await searchParams;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, projetId);
  if (!projet || projet.organisation !== "classe" || !estRubrique(etape)) notFound();
  const [preparation, plan] = await Promise.all([preparationDe(enseignant, projet.id), planDe(enseignant, projet.id)]);
  if (!preparation) notFound();
  return (
    <Messages>
      <AidesIa reglages={enseignant.reglagesIa}>
        <Projection
          projet={{ id: projet.id, titre: projet.titre, organisation: projet.organisation, recit: projet.recit, herosAbsent: projet.herosAbsent }}
          etape={etape}
          onglet={typeof heros === "string" ? heros : null}
          preparation={preparation}
          plan={plan}
        />
      </AidesIa>
    </Messages>
  );
}
