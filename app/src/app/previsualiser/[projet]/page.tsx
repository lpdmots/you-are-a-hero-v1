import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { NOMS_COMME_LE_LIVRE } from "@/domaine/partage";
import { exigerEnseignant } from "@/serveur/adulte";
import { instantaneDuLivre } from "@/serveur/livre/livre";
import { partageDuProjet, versionsDe } from "@/serveur/partage";
import { Previsualisation } from "./Previsualisation";

export const metadata: Metadata = { title: "Prévisualisation" };

type Props = { params: Promise<{ projet: string }> };

/**
 * « Prévisualiser » (F12.1, « Prévisualisation ») : le livre tel que le lecteur le verra, sur la
 * page même du lecteur en ligne, précédé d'un bandeau. Rien n'est partagé, rien n'est retenu.
 */
export default async function Page({ params }: Props) {
  const { projet } = await params;
  const enseignant = await exigerEnseignant();
  const [instantane, partage] = await Promise.all([instantaneDuLivre(enseignant, projet), partageDuProjet(enseignant, projet)]);
  if (!instantane) notFound();
  const { version } = versionsDe(instantane, partage?.noms ?? NOMS_COMME_LE_LIVRE);
  return (
    <Messages>
      <Previsualisation projetId={projet} version={version} />
    </Messages>
  );
}
