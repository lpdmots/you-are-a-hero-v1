import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icone } from "@/composants/Icone";
import { libelleAnnee } from "@/domaine/annee";
import { nomPourEleves, trier } from "@/domaine/eleves";
import { exigerEnseignant, nomPourLesEleves } from "@/serveur/adulte";
import { adresseDuSite } from "@/serveur/env";
import { classeDe } from "@/serveur/lectures";
import { voirCodes, voirMotDePasse } from "../../actions";
import { Imprimer } from "./Imprimer";

export const metadata: Metadata = { title: "Imprimer" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ quoi?: string; qui?: string }> };

/**
 * Étiquettes des élèves et affiche de la classe (F06-AC67, AC69, AC70). Cette page
 * montre les codes et le mot de passe : on n'y vient que pour imprimer.
 */
export default async function PageImprimer({ params, searchParams }: Props) {
  const enseignant = await exigerEnseignant();
  const [{ id }, { quoi, qui }] = await Promise.all([params, searchParams]);
  const classe = await classeDe(enseignant, id);
  if (!classe) notFound();
  if (!classe.enCours) redirect(`/classes/${classe.id}`);

  const [codes, motDePasse, entetes] = await Promise.all([voirCodes(classe.id), voirMotDePasse(classe.id), headers()]);
  if (!codes.ok || !motDePasse.ok) notFound();
  const eleves = trier(classe.eleves).map((e) => ({
    id: e.id,
    prenom: e.prenom,
    nom: e.nom,
    couleur: e.couleur,
    affiche: nomPourEleves(e, classe.eleves),
    code: codes.codes[e.id] ?? "",
  }));

  return (
    <div className="page">
      <nav className="fil hors-impression">
        <Link href={`/classes/${classe.id}`}>
          <Icone nom="fleche-g" />
          Retour à {classe.nom}
        </Link>
      </nav>
      <header className="entete hors-impression">
        <div>
          <h1>Imprimer</h1>
          <p>
            {classe.nom} · {libelleAnnee(classe.anneeDebut)}
          </p>
        </div>
      </header>
      <Imprimer
        classe={{ nom: classe.nom, identifiant: classe.identifiant, motDePasse: motDePasse.motDePasse }}
        adresse={`${adresseDuSite(entetes.get("host")).replace(/^https?:\/\//, "")}/classe`}
        enseignant={enseignant.nomAffiche}
        pourLesEleves={nomPourLesEleves(enseignant.nomAffiche)}
        eleves={eleves}
        departQuoi={quoi === "affiche" ? "affiche" : "etiquettes"}
        departQui={eleves.some((e) => e.id === qui) ? (qui as string) : ""}
      />
    </div>
  );
}
