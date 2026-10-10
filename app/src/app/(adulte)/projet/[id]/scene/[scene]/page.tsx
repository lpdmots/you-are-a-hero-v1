import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { nomScene, scenesDe } from "@/domaine/recit";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { planDe } from "@/serveur/recit";
import { PageScene } from "./PageScene";

type Props = { params: Promise<{ id: string; scene: string }> };

async function lire({ params }: Props) {
  const { id, scene: sceneId } = await params;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet) return null;
  const plan = await planDe(enseignant, projet.id);
  const scene = scenesDe(plan).find((s) => s.id === sceneId);
  return scene ? { projet, plan, scene } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const lu = await lire(props);
  return { title: lu ? `${nomScene(lu.scene)} — ${lu.projet.titre}` : "Scène" };
}

/** La page d'une scène. À l'étape 2 : son titre, sa consigne, ses repères ; le texte arrive à l'étape 3. */
export default async function Page(props: Props) {
  const lu = await lire(props);
  if (!lu) notFound();
  const { projet, plan, scene } = lu;
  return (
    <div className="page">
      <ProjetOuvert id={projet.id} titre={projet.titre} onglet="plan" />
      <PageScene projet={{ id: projet.id, deClasse: projet.organisation === "classe", aChoix: projet.recit === "choix" }} plan={plan} sceneId={scene.id} />
    </div>
  );
}
