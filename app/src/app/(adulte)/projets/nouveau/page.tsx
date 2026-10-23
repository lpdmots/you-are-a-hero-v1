import type { Metadata } from "next";
import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { randomUUID } from "node:crypto";
import { libelleAnnee } from "@/domaine/annee";
import { enEuros } from "@/domaine/offre";
import { tirerVisuel } from "@/domaine/visuels";
import { exigerEnseignant } from "@/serveur/adulte";
import { mesClasses } from "@/serveur/lectures";
import { offreActuelle } from "@/serveur/offre";
import { NouveauProjet } from "./NouveauProjet";

export const metadata: Metadata = { title: "Nouveau projet" };

/** Créer un projet : trois questions, l'une après l'autre, et rien d'autre (F01). */
export default async function PageNouveauProjet() {
  const enseignant = await exigerEnseignant();
  // Seules les classes en cours sont proposées (F01, F01.1)
  const [toutes, offre] = await Promise.all([mesClasses(enseignant), offreActuelle()]);
  const classes = toutes
    .filter((c) => c.enCours)
    .map((c) => ({ id: c.id, nom: c.nom, annee: libelleAnnee(c.anneeDebut), eleves: c.eleves.length }));
  // Les limites du livre gratuit, dites d'avance quand elles valent : vente ouverte, hors porteur (F14-AC43)
  const gratuit =
    offre.paiementOuvert && !enseignant.createur
      ? { scenes: offre.scenesGratuites, images: offre.imagesGratuites, prix: enEuros(offre.prixDuPass) }
      : null;
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
        {/* Le visuel par défaut de la carte est tiré ici, une fois : la carte le montre, le projet le garde (F10-AC21) */}
        <NouveauProjet classes={classes} visuelDefaut={tirerVisuel(randomUUID())} gratuit={gratuit} />
      </div>
    </div>
  );
}
