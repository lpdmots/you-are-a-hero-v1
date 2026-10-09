import type { Metadata } from "next";
import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { libelleAnnee } from "@/domaine/annee";
import { exigerEnseignant } from "@/serveur/adulte";
import { mesClasses } from "@/serveur/lectures";
import { NouveauProjet } from "./NouveauProjet";

export const metadata: Metadata = { title: "Nouveau projet" };

/** Créer un projet : trois questions, l'une après l'autre, et rien d'autre (F01). */
export default async function PageNouveauProjet() {
  const enseignant = await exigerEnseignant();
  // Seules les classes en cours sont proposées (F01, F01.1)
  const classes = (await mesClasses(enseignant))
    .filter((c) => c.enCours)
    .map((c) => ({ id: c.id, nom: c.nom, annee: libelleAnnee(c.anneeDebut), eleves: c.eleves.length }));
  return (
    <div className="page">
      <nav className="fil">
        <Link href="/projets">
          <Icone nom="fleche-g" />
          Retour à Mes projets
        </Link>
      </nav>
      <div className="colonne">
        <header className="entete">
          <h1>Nouveau projet</h1>
        </header>
        <NouveauProjet classes={classes} />
      </div>
    </div>
  );
}
