import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icone } from "@/composants/Icone";
import { libelleAnnee } from "@/domaine/annee";
import { exigerEnseignant } from "@/serveur/adulte";
import { classeDe, mesClasses, profilsConnus } from "@/serveur/lectures";
import { Inscrire } from "./Inscrire";

export const metadata: Metadata = { title: "Inscrire des élèves" };

/** Inscription en lot : élèves déjà connus, nouveaux élèves, vérifier (F01.1). */
export default async function PageInscrire({ params }: { params: Promise<{ id: string }> }) {
  const enseignant = await exigerEnseignant();
  const classe = await classeDe(enseignant, (await params).id);
  if (!classe) notFound();
  // Une classe dont l'année est terminée ne reçoit pas d'élève (F01-AC26)
  if (!classe.enCours) redirect(`/classes/${classe.id}`);
  const connus = profilsConnus(classe, await mesClasses(enseignant));
  return (
    <div className="page">
      <nav className="fil">
        <Link href={`/classes/${classe.id}`}>
          <Icone nom="fleche-g" />
          Retour à {classe.nom}
        </Link>
      </nav>
      <div className="colonne">
        <header className="entete">
          <div>
            <h1>Inscrire des élèves</h1>
            <p>
              {classe.nom} · {libelleAnnee(classe.anneeDebut)}
            </p>
          </div>
        </header>
        <Inscrire
          classeId={classe.id}
          inscrits={classe.eleves.map((e) => ({ id: e.id, prenom: e.prenom, nom: e.nom, couleur: e.couleur }))}
          connus={connus}
        />
      </div>
    </div>
  );
}
