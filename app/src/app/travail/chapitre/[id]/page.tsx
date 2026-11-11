import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { vueDuChapitre } from "@/domaine/chemins";
import { chapitreDuPoste, contexteDeTravail } from "@/serveur/recit-eleve";
import { EnteteEleve } from "../../EnteteEleve";
import { ChapitreEleve } from "./ChapitreEleve";

export const metadata: Metadata = { title: "Mon chapitre" };

/**
 * Un chapitre ouvert par un élève (F03.1, 10 octobre 2026) : la même page que celle de
 * l'enseignant, en lecture. Le profil « écriture et organisation » y ajoute, déplace et
 * supprime ses scènes (F06.1). Un chapitre qui n'est pas le sien ne s'ouvre pas (F06-AC22).
 */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ vue?: string }> }) {
  const { id } = await params;
  const { vue } = await searchParams;
  const contexte = await contexteDeTravail();
  if (!contexte.ouvert) redirect("/travail");
  // « Chemins » s'ouvre en premier dans un chapitre à choix (F03.1, « Chemins en atelier ») : ses repères se lisent sauf si l'on demande « Scènes »
  const chapitre = await chapitreDuPoste(contexte, id, { chemins: vue !== "scenes" });
  if (!chapitre) notFound();
  return (
    <Messages>
      <EnteteEleve contexte={contexte} auTravail />
      <main className="page page--eleve">
        <ChapitreEleve chapitre={chapitre} prof={contexte.prof} moi={contexte.moi.id} eleves={contexte.eleves} vue={vueDuChapitre(vue, chapitre.aChoix)} />
      </main>
    </Messages>
  );
}
