import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { nomScene, scenesDe } from "@/domaine/recit";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import type { Livre } from "@/composants/copie/contexte";
import { numerosDuPlan } from "@/domaine/numeros";
import { texteDeScene, voisinesDe } from "@/serveur/copie";
import { elevesDeLaClasse, planDe, preparationDe } from "@/serveur/recit";
import { PageScene } from "./PageScene";

type Props = { params: Promise<{ id: string; scene: string }>; searchParams: Promise<{ texte?: string; de?: string }> };

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
  const [eleves, texte, demande, preparation, voisines, preference] = await Promise.all([
    elevesDeLaClasse(enseignant, projet.classe?.id ?? null),
    texteDeScene(enseignant, scene.id),
    props.searchParams,
    preparationDe(enseignant, projet.id),
    voisinesDe(enseignant.supabase, scene.id),
    enseignant.supabase.from("enseignants").select("voisines").eq("id", enseignant.id).maybeSingle(),
  ]);
  if (!texte) notFound();
  // Le livre autour de la scène : numéros des passages, scènes où peut mener un choix (F05, F11.5)
  const livre: Livre = {
    aChoix: projet.recit === "choix",
    formule: preparation?.formuleRenvoi ?? "rends",
    constructions: preparation?.constructions ?? ["neutre"],
    numeros: projet.recit === "choix" ? Object.fromEntries(numerosDuPlan(plan).de) : {},
    scenes: plan.parties.flatMap((p) =>
      p.chapitres.flatMap((c) =>
        c.scenes.map((s) => ({
          id: s.id, reference: s.reference, titre: s.titre, chapitreId: c.id, chapitre: c.titre, partie: p.titre, vide: s.texteVide, consigne: s.consigne,
        })),
      ),
    ),
    ailleurs: {},
    chapitres: plan.parties.flatMap((p) => p.chapitres.map((c) => ({ id: c.id, titre: c.titre, partie: p.titre }))),
    fixes: Object.fromEntries(scenesDe(plan).flatMap((s) => (s.numeroFixe ? [[s.id, s.numeroFixe]] : []))),
    depart: plan.departSceneId,
  };
  return (
    <div className="page">
      <ProjetOuvert id={projet.id} titre={projet.titre} onglet="plan" />
      <PageScene projet={{ id: projet.id, deClasse: projet.organisation === "classe", aChoix: projet.recit === "choix" }} plan={plan} sceneId={scene.id} eleves={eleves}
        texte={texte}
        livre={livre}
        jeu={{ objets: preparation?.objets ?? [], formules: projet.recit === "choix" ? (preparation?.formules ?? []) : [] }}
        voisines={voisines}
        voisinesAffichees={preference.data?.voisines !== false}
        ouvrir={typeof demande.texte === "string" ? demande.texte : undefined}
        venuDuSuivi={demande.de === "suivi"}
        venuDesChemins={demande.de === "chemins"}
      />
    </div>
  );
}
