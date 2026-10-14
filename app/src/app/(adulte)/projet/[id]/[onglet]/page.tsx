import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { estOnglet, NOM_ONGLET, ongletsDe, type Onglet } from "@/domaine/projets";
import { aTraiter } from "@/domaine/controles";
import { avertissementsAcceptes, estEtapeLivre, etatChemins, etatRelire, type EtapeLivre, type MarqueEtape } from "@/domaine/livre";
import { filtresDepuis } from "@/domaine/suivi";
import { exigerEnseignant } from "@/serveur/adulte";
import { textesGardesDuProjet } from "@/serveur/copie";
import { etatDuLivre } from "@/serveur/controles";
import { encouragementsDuProjet } from "@/serveur/encouragements";
import { projetDe } from "@/serveur/lectures";
import { elevesDeLaClasse, planDe, preparationDe } from "@/serveur/recit";
import { EnteteProjet } from "../_commun/EnteteProjet";
import { Plan } from "../_plan/Plan";
import { Suivi } from "../_suivi/Suivi";
import { Carnet } from "../_preparation/Carnet";
import { Livre } from "../_livre/Livre";
import { afficherChemins, afficherPoint } from "../_livre/points";
import styles from "./projet.module.css";

type Props = { params: Promise<{ id: string; onglet: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, onglet } = await params;
  const projet = await projetDe(await exigerEnseignant(), id);
  return { title: projet && estOnglet(onglet) ? `${NOM_ONGLET[onglet]} — ${projet.titre}` : "Projet" };
}

// Ce que cet onglet deviendra, et à quelle étape du plan de réalisation.
const A_VENIR: Partial<Record<Onglet, string>> = {};

export default async function PageProjet({ params, searchParams }: Props) {
  const { id, onglet } = await params;
  const { message } = (await searchParams) as { message?: string };
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet || !estOnglet(onglet) || !ongletsDe().includes(onglet)) notFound();
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
  } else if (onglet === "suivi") {
    const [plan, eleves, gardes, magasin, demande, encouragements] = await Promise.all([
      planDe(enseignant, projet.id), elevesDeLaClasse(enseignant, projet.classe?.id ?? null), textesGardesDuProjet(enseignant, projet.id), cookies(), searchParams,
      // Un projet personnel n'a ni encouragements ni classement (F07.5)
      deClasse ? encouragementsDuProjet(enseignant, projet.id) : undefined,
    ]);
    contenu = (
      <Suivi
        projet={{ id: projet.id, deClasse }}
        plan={plan}
        eleves={eleves}
        gardes={gardes}
        encouragements={encouragements}
        filtres={filtresDepuis(demande)}
        vue={demande.vue === "eleves" ? "eleves" : "scenes"}
        aideMasquee={enseignant.aidesMasquees.includes("suivi")}
        aideVue={magasin.get("aide-suivi")?.value === "vue"}
        direct={demande.direct === "1"}
        revenu={demande.revenu === "1"}
      />
    );
  } else if (onglet === "livre") {
    const [livre, plan, magasin, demande] = await Promise.all([etatDuLivre(enseignant, projet.id), planDe(enseignant, projet.id), cookies(), searchParams]);
    if (!livre) notFound();
    const acceptes = avertissementsAcceptes(livre.problemes, livre.acceptations, livre.changements);
    const chemins = aChoix ? etatChemins(livre.problemes, acceptes, livre.cheminsVerifies) : null;
    const relire = etatRelire(livre.problemes);
    // « Mettre en page » et « Imprimer et partager » se construisent à l'étape 6 du plan ; leurs règles les fermeraient de toute façon
    const marques: Record<EtapeLivre, MarqueEtape> = { relire: relire.marque, chemins: chemins?.marque ?? null, page: "fermee", sortie: "fermee" };
    // À l'étape 5 du plan, le Livre s'ouvre sur « Vérifier les chemins », seule étape construite
    const etape: EtapeLivre = estEtapeLivre(demande.etape) && (aChoix || demande.etape !== "chemins") ? demande.etape : aChoix ? "chemins" : "relire";
    contenu = (
      <Livre
        projet={{ id: projet.id, aChoix, deClasse }}
        etape={etape}
        marques={marques}
        chemins={chemins ? afficherChemins(chemins, plan, projet.id) : null}
        relire={{ finir: relire.finir, graves: aTraiter(livre.problemes).filter((p) => p.etape === "relire").map((p) => afficherPoint(p, plan, projet.id)) }}
        aideMasquee={enseignant.aidesMasquees.includes("livre-chemins")}
        aideVue={magasin.get("aide-livre")?.value === "vue"}
      />
    );
  } else {
    contenu = (
      <>
        <section className={styles.aVenir} aria-labelledby="a-venir">
          <h2 id="a-venir">{NOM_ONGLET[onglet]}</h2>
          <p>{A_VENIR[onglet]}</p>
        </section>
      </>
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
