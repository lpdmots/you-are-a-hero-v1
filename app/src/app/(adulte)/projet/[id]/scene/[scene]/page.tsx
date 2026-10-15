import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { nomScene, scenesDe } from "@/domaine/recit";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { planDe } from "@/serveur/recit";
import { donneesDeLaScene } from "@/serveur/scene";
import { PageScene } from "./PageScene";

type Props = { params: Promise<{ id: string; scene: string }>; searchParams: Promise<{ texte?: string; de?: string; suivi?: string; choix?: string; lecture?: string }> };

/** La provenance d'une lecture d'essai, telle que l'adresse la porte : le Livre, ou une scène. */
const requeteDeLecture = (v: unknown): string => (typeof v === "string" && /^de=(livre|scene&scene=[0-9a-f-]{36})$/.test(v) ? v : "de=livre");

/** Les filtres du Suivi, tels que l'adresse les porte : rien d'autre qu'une suite de « nom=valeur ». */
const requeteDuSuivi = (v: unknown): string => (typeof v === "string" && /^[\w=&%.~-]{0,400}$/.test(v) ? v : "");

async function lire({ params }: Props) {
  const { id, scene: sceneId } = await params;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet) return null;
  const plan = await planDe(enseignant, projet.id);
  const scene = scenesDe(plan).find((s) => s.id === sceneId);
  // Une scène partie dans la corbeille n'a plus de page : on revient au plan, où elle se restaure
  if (!scene && plan.corbeille.some((x) => x.id === sceneId)) redirect(`/projet/${projet.id}/plan`);
  return scene ? { enseignant, projet, plan, scene } : null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const lu = await lire(props);
  return { title: lu ? `${nomScene(lu.scene)} — ${lu.projet.titre}` : "Scène" };
}

/** La page d'une scène : son titre, sa consigne, ses repères et son texte (F04, F08). */
export default async function Page(props: Props) {
  const lu = await lire(props);
  if (!lu) notFound();
  const { enseignant, projet, plan, scene } = lu;
  const [donnees, demande] = await Promise.all([donneesDeLaScene(enseignant, projet, plan, scene.id), props.searchParams]);
  if (!donnees) notFound();
  return (
    <div className="page">
      <ProjetOuvert id={projet.id} titre={projet.titre} onglet="plan" />
      <PageScene projet={{ id: projet.id, deClasse: projet.organisation === "classe", aChoix: projet.recit === "choix" }} plan={plan} sceneId={scene.id}
        {...donnees}
        ouvrir={typeof demande.texte === "string" ? demande.texte : undefined}
        venuDuSuivi={demande.de === "suivi"}
        suivi={requeteDuSuivi(demande.suivi)}
        venuDesChemins={demande.de === "chemins"}
        venuDuLivre={demande.de === "livre"}
        lecture={demande.de === "lecture" ? requeteDeLecture(demande.lecture) : undefined}
        ouvrirChoix={typeof demande.choix === "string" && /^[\w-]{1,64}$/.test(demande.choix) ? demande.choix : undefined}
      />
    </div>
  );
}
