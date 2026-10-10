import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { estOnglet, NOM_ONGLET, ongletsDe, type Onglet } from "@/domaine/projets";
import { exigerEnseignant } from "@/serveur/adulte";
import { projetDe } from "@/serveur/lectures";
import { elevesDeLaClasse, planDe, preparationDe } from "@/serveur/recit";
import { EnteteProjet } from "../_commun/EnteteProjet";
import { Plan } from "../_plan/Plan";
import { Carnet } from "../_preparation/Carnet";
import styles from "./projet.module.css";

type Props = { params: Promise<{ id: string; onglet: string }>; searchParams: Promise<{ message?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, onglet } = await params;
  const projet = await projetDe(await exigerEnseignant(), id);
  return { title: projet && estOnglet(onglet) ? `${NOM_ONGLET[onglet]} — ${projet.titre}` : "Projet" };
}

// Ce que ces onglets deviendront, et à quelle étape du plan de réalisation.
const A_VENIR: Partial<Record<Onglet, string>> = {
  suivi: "Le suivi du travail des élèves se construit à l’étape 4 du plan.",
  livre: "La lecture d’essai et le livre se construisent aux étapes 5 et 6 du plan.",
};

export default async function PageProjet({ params, searchParams }: Props) {
  const { id, onglet } = await params;
  const { message } = await searchParams;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet || !estOnglet(onglet) || !ongletsDe(projet.organisation).includes(onglet)) notFound();
  const deClasse = projet.organisation === "classe";
  const aChoix = projet.recit === "choix";

  let contenu;
  if (onglet === "plan") {
    const [plan, eleves, magasin] = await Promise.all([planDe(enseignant, projet.id), elevesDeLaClasse(enseignant, projet.classe?.id ?? null), cookies()]);
    contenu = (
      <Plan
        projet={{ id: projet.id, titre: projet.titre, deClasse, aChoix, classe: projet.classe ? { id: projet.classe.id, nom: projet.classe.nom } : null }}
        plan={plan}
        eleves={eleves}
        aideMasquee={enseignant.aidesMasquees.includes("plan")}
        aideVue={magasin.get("aide-plan")?.value === "vue"}
      />
    );
  } else if (onglet === "preparation") {
    const [preparation, plan, magasin] = await Promise.all([preparationDe(enseignant, projet.id), planDe(enseignant, projet.id), cookies()]);
    if (!preparation) notFound();
    contenu = (
      <Carnet
        projet={{ id: projet.id, titre: projet.titre, organisation: projet.organisation, recit: projet.recit }}
        preparation={preparation}
        plan={plan}
        aideMasquee={enseignant.aidesMasquees.includes("preparation")}
        aideVue={magasin.get("aide-preparation")?.value === "vue"}
      />
    );
  } else {
    contenu = (
      <section className={styles.aVenir} aria-labelledby="a-venir">
        <h2 id="a-venir">{NOM_ONGLET[onglet]}</h2>
        <p>{A_VENIR[onglet]}</p>
      </section>
    );
  }

  return (
    <div className="page">
      {message === "cree" ? <MessageAuChargement texte={`« ${projet.titre} » est créé. Commencez par la préparation.`} /> : null}
      {message === "cree-sans-image" ? (
        <MessageAuChargement texte={`« ${projet.titre} » est créé, mais son image n’a pas pu être importée. Choisissez-la depuis les réglages du projet.`} />
      ) : null}
      <EnteteProjet enseignant={enseignant} projet={projet} onglet={onglet} />
      {contenu}
    </div>
  );
}
