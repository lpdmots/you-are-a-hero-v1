import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { VeillePoste } from "@/composants/VeillePoste";
import { livreDuPoste } from "@/serveur/livres-eleve";
import { contexteEleve } from "@/serveur/recit-eleve";
import { LecteurDeLEleve } from "./LecteurDeLEleve";

type Props = { params: Promise<{ projet: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lu = await livreDuPoste(await contexteEleve(), (await params).projet);
  return { title: lu?.version.titre ?? "Lire" };
}

/**
 * Un livre ouvert à la classe (F12.3), lu dans le lecteur en ligne, à toute heure : la lecture
 * et la feuille sont gardées avec le prénom de l'élève, d'un poste à l'autre (F12-AC26).
 */
export default async function Page({ params }: Props) {
  const { projet } = await params;
  const contexte = await contexteEleve();
  const lu = await livreDuPoste(contexte, projet);
  if (!lu) notFound();
  return (
    <Messages>
      <VeillePoste attendu="eleve" />
      <LecteurDeLEleve projetId={projet} version={lu.version} lecture={lu.lecture} />
    </Messages>
  );
}
