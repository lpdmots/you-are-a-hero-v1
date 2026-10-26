import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { VeillePoste } from "@/composants/VeillePoste";
import { livreDeLaBibliothequeDuPoste } from "@/serveur/livres-eleve";
import { contexteEleve } from "@/serveur/recit-eleve";
import { LecteurBibliothequeEleve } from "./LecteurBibliothequeEleve";

type Props = { params: Promise<{ adresse: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lu = await livreDeLaBibliothequeDuPoste(await contexteEleve(), (await params).adresse);
  return { title: lu?.version.titre ?? "Lire" };
}

/**
 * Un livre de la bibliothèque, lu depuis « Lire » (F15-AC20) : à toute heure, sa lecture gardée
 * pour le profil de l'élève, son cœur aussi, après la fin.
 */
export default async function Page({ params }: Props) {
  const { adresse } = await params;
  const lu = await livreDeLaBibliothequeDuPoste(await contexteEleve(), adresse);
  if (!lu) notFound();
  return (
    <Messages>
      <VeillePoste attendu="eleve" />
      <LecteurBibliothequeEleve adresse={adresse} version={lu.version} lecture={lu.lecture} coeurs={lu.coeurs} donne={lu.donne} />
    </Messages>
  );
}
