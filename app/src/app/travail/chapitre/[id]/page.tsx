import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { chapitreDuPoste, contexteEleve } from "@/serveur/recit-eleve";
import { EnteteEleve } from "../../EnteteEleve";
import { ChapitreEleve } from "./ChapitreEleve";

export const metadata: Metadata = { title: "Mon chapitre" };

/**
 * Un chapitre ouvert par un élève (F03.1, 10 octobre 2026) : la même page que celle de
 * l'enseignant, en lecture. Le profil « écriture et organisation » y ajoute, déplace et
 * supprime ses scènes (F06.1). Un chapitre qui n'est pas le sien ne s'ouvre pas (F06-AC22).
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contexte = await contexteEleve();
  if (!contexte.ouvert) redirect("/travail");
  const chapitre = await chapitreDuPoste(contexte, id);
  if (!chapitre) notFound();
  return (
    <Messages>
      <EnteteEleve contexte={contexte} />
      <main className="page page--eleve">
        <ChapitreEleve chapitre={chapitre} prof={contexte.prof} moi={contexte.moi.id} eleves={contexte.eleves} />
      </main>
    </Messages>
  );
}
