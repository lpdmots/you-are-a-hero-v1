import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { ONGLETS, type Onglet } from "@/domaine/projets";
import { exigerEnseignant } from "@/serveur/adulte";
import { livreALirePourLAdulte } from "@/serveur/lecture";
import { LectureAdulte } from "./LectureAdulte";
import { ParOuCommencer } from "./ParOuCommencer";

export const metadata: Metadata = { title: "Lecture d’essai" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ depart?: string; de?: string; scene?: string; onglet?: string; reprendre?: string }> };

/** D'où l'on vient, pour y revenir par « Quitter » : la tâche « Tester la lecture », ou une scène. */
/** D'où vient la lecture : le Livre, une scène, ou l'en-tête d'un onglet du projet */
export type Provenance = { de: "livre" } | { de: "scene"; scene: string } | { de: "onglet"; onglet: Onglet };

/**
 * La lecture d'essai de l'adulte (F09.1) : le livre entier, depuis le départ ou depuis une
 * scène. Sans point de départ, la page demande « Par où commencer ? ».
 */
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const enseignant = await exigerEnseignant();
  const [lu, demande] = await Promise.all([livreALirePourLAdulte(enseignant, id), searchParams]);
  if (!lu) notFound();
  const { livre, plan, titre, aChoix } = lu;
  const provenance: Provenance =
    demande.de === "scene" && typeof demande.scene === "string" && livre.passages[demande.scene]
      ? { de: "scene", scene: demande.scene }
      : demande.de === "onglet" && (ONGLETS as readonly string[]).includes(demande.onglet ?? "")
        ? { de: "onglet", onglet: demande.onglet as Onglet }
        : { de: "livre" };
  const depart = typeof demande.depart === "string" && livre.passages[demande.depart] ? demande.depart : null;
  // Revenue d'une scène : la page reprend la lecture gardée ; à défaut, elle repart du début du livre
  const reprise = demande.reprendre === "1" ? (depart ?? livre.departId ?? livre.ordre[0] ?? null) : null;
  return (
    <>
      <ProjetOuvert id={id} titre={titre} onglet="livre" />
      {depart || reprise ? (
        <LectureAdulte projetId={id} titre={titre} livre={livre} depart={(depart ?? reprise)!} reprendre={!depart} provenance={provenance} />
      ) : (
        <ParOuCommencer projetId={id} titre={titre} plan={plan} aChoix={aChoix} departId={livre.departId} provenance={provenance} />
      )}
    </>
  );
}
