import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { chapitresDe } from "@/domaine/recit";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { elevesDeLaClasse, planDe } from "@/serveur/recit";
import { PageChapitre } from "./PageChapitre";

type Props = { params: Promise<{ id: string; chapitre: string }> };

async function lire({ params }: Props) {
  const { id, chapitre: chapitreId } = await params;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet) return null;
  const plan = await planDe(enseignant, projet.id);
  const chapitre = chapitresDe(plan).find((c) => c.id === chapitreId);
  if (!chapitre) return null;
  return { enseignant, projet, plan, chapitre };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const lu = await lire(props);
  return { title: lu ? `${lu.chapitre.titre} — ${lu.projet.titre}` : "Chapitre" };
}

/** La page d'un chapitre : ses scènes, dans l'ordre du plan (F03.1). */
export default async function Page(props: Props) {
  const lu = await lire(props);
  if (!lu) notFound();
  const { enseignant, projet, plan, chapitre } = lu;
  const eleves = await elevesDeLaClasse(enseignant, projet.classe?.id ?? null);
  return (
    <div className="page">
      <ProjetOuvert id={projet.id} titre={projet.titre} onglet="plan" />
      <PageChapitre
        projet={{
          id: projet.id, titre: projet.titre, deClasse: projet.organisation === "classe", aChoix: projet.recit === "choix",
          classe: projet.classe ? { id: projet.classe.id, nom: projet.classe.nom } : null,
        }}
        plan={plan}
        chapitreId={chapitre.id}
        eleves={eleves}
      />
    </div>
  );
}
