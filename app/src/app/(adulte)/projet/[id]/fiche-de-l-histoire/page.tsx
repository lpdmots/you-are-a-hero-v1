import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigerEnseignant } from "@/serveur/adulte";
import { ficheDuProjet } from "@/serveur/fiche-histoire";
import { projetDe } from "@/serveur/lectures";
import { ColonneDuProjet } from "../_commun/EnteteProjet";
import { FicheDeLHistoire } from "./FicheDeLHistoire";

export const metadata: Metadata = { title: "Fiche de l’histoire" };

/** « 18 novembre 2026 », à l'heure de Paris : sur la feuille, la version que l'élève a en main. */
const aujourdhui = () => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date());

type Props = { params: Promise<{ id: string }> };

/**
 * La fiche de l'histoire à imprimer (F02.1) : ouverte depuis la Préparation, pour l'adulte seul.
 * Un élève n'a pas de session d'adulte : il est renvoyé à l'entrée sans rien voir (F02-AC24).
 */
export default async function Page({ params }: Props) {
  const { id } = await params;
  const enseignant = await exigerEnseignant();
  const [projet, lue] = await Promise.all([projetDe(enseignant, id), ficheDuProjet(enseignant, id)]);
  if (!projet || !lue) notFound();
  return (
    <div className="page">
      <ColonneDuProjet enseignant={enseignant} projet={projet} actif="preparation" />
      <FicheDeLHistoire projetId={projet.id} fiche={lue.fiche} masquees={lue.masquees} retour={`/projet/${projet.id}/preparation`} aJourDu={aujourdhui()} />
    </div>
  );
}
