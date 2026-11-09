import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { libelleAnnee } from "@/domaine/annee";
import { libelleOrganisation, libelleRecit } from "@/domaine/projets";
import { chapitresDe } from "@/domaine/recit";
import { exigerEnseignant } from "@/serveur/adulte";
import { mesClasses, projetDe } from "@/serveur/lectures";
import { limitesDuProjet, offreActuelle } from "@/serveur/offre";
import { planDe } from "@/serveur/recit";
import { EnteteProjet } from "../_commun/EnteteProjet";
import { ReglagesDuProjet } from "./ReglagesDuProjet";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const projet = await projetDe(await exigerEnseignant(), id);
  return { title: projet ? `Réglages du projet — ${projet.titre}` : "Réglages du projet" };
}

/** « Réglages du projet », une page de la colonne de navigation (F06.5, 8 novembre 2026 ; d'abord un panneau). */
export default async function Page({ params }: Props) {
  const { id } = await params;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet) notFound();
  const deClasse = projet.organisation === "classe";
  const [classes, plan, offre, limites] = await Promise.all([
    deClasse ? mesClasses(enseignant) : Promise.resolve([]), planDe(enseignant, projet.id), offreActuelle(), limitesDuProjet(enseignant.supabase, projet.id),
  ]);
  return (
    <div className="page">
      <EnteteProjet enseignant={enseignant} projet={projet} onglet={null} />
      <ReglagesDuProjet
        projet={{
          mode: `${libelleOrganisation(projet.organisation)} · ${libelleRecit(projet.recit)}`,
          id: projet.id, titre: projet.titre, deClasse, lectureOuverte: projet.lectureOuverte, miseEnFormeEleves: projet.miseEnFormeEleves,
          imageId: projet.imageId, visuelChoisi: projet.visuelChoisi, visuelDefaut: projet.visuelDefaut,
          styleImages: projet.styleImages, styleAutre: projet.styleAutre, herosAbsent: projet.herosAbsent, consigneEcriture: projet.consigneEcriture,
          ageDesLecteurs: projet.ageDesLecteurs,
        }}
        classe={
          deClasse
            ? {
                actuelle: projet.classe && !projet.classe.supprimee ? { id: projet.classe.id, nom: projet.classe.nom, eleves: projet.classe.nombreEleves } : null,
                offertes: classes.filter((c) => c.enCours).map((c) => ({ id: c.id, nom: c.nom, annee: libelleAnnee(c.anneeDebut), eleves: c.eleves.length })),
                attribue: chapitresDe(plan).some((c) => c.attributions.length > 0),
              }
            : null
        }
        livre={offre.livrePayant && limites && !enseignant.createur ? { offre, limites } : null}
        avecPass={limites?.pass === true}
      />
    </div>
  );
}
