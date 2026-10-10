import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Messages } from "@/composants/Messages";
import { contexteEleve, sceneDuPoste } from "@/serveur/recit-eleve";
import { EnteteEleve } from "../../EnteteEleve";
import { SceneEleve } from "./SceneEleve";

export const metadata: Metadata = { title: "Ma scène" };

/**
 * Une scène ouverte par un élève : il y écrit si elle est dans son chapitre et que
 * personne d'autre ne s'en occupe (F03-AC17, F06-AC20, AC62), sinon il la lit. Une scène
 * qu'il ne peut pas lire n'a pas de page (F06-AC21).
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contexte = await contexteEleve();
  if (!contexte.ouvert) redirect("/travail");
  const scene = await sceneDuPoste(contexte, id);
  if (!scene) notFound();
  return (
    <Messages>
      <EnteteEleve contexte={contexte} auTravail />
      <main className="page page--eleve">
        <SceneEleve scene={scene} prof={contexte.prof} eleves={contexte.eleves} />
      </main>
    </Messages>
  );
}
