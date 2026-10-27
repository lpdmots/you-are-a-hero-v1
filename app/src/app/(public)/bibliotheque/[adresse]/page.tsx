import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { demandeDepuis } from "@/domaine/bibliotheque-publique";
import { livrePublie, livresPublies } from "@/serveur/bibliotheque-publique";
import { Bibliotheque } from "../Bibliotheque";
import styles from "../bibliotheque.module.css";

type Props = { params: Promise<{ adresse: string }>; searchParams: Promise<{ tri?: string; age?: string; type?: string; q?: string }> };

const lire = cache(livrePublie);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const livre = await lire((await params).adresse);
  // L'adresse d'un livre reste hors des moteurs : la page indexée est la bibliothèque (F15-AC12)
  const robots = { index: false, follow: true };
  if (!livre) return { title: "Ce livre n’est plus dans la bibliothèque", robots };
  // L'aperçu d'un lien envoyé aux familles : la couverture du livre, en entier (F11-AC114)
  const couverture = livre.couvertureId ? `/images/publie/${livre.adresse}/${livre.couvertureId}` : null;
  return {
    title: livre.titre, description: livre.presentation, robots, alternates: { canonical: `/bibliotheque/${livre.adresse}` },
    ...(couverture
      ? {
          openGraph: { type: "book", locale: "fr_FR", siteName: "Il était une classe", url: `/bibliotheque/${livre.adresse}`, title: livre.titre, description: livre.presentation, images: [{ url: couverture, alt: `Couverture de « ${livre.titre} »` }] },
          twitter: { card: "summary_large_image", images: [couverture] },
        }
      : {}),
  };
}

/**
 * L'adresse d'un livre, le lien direct donné aux familles (F15-AC12) : la bibliothèque, tiroir du
 * livre ouvert. Une adresse inconnue ou retirée dit seulement « Ce livre n'est plus dans la
 * bibliothèque », sans titre ni nom (F15-AC09).
 */
export default async function Page({ params, searchParams }: Props) {
  const [{ adresse }, demande] = await Promise.all([params, searchParams]);
  const livre = await lire(adresse);
  if (!livre)
    return (
      <main className={styles.neutre}>
        <p className={styles.neutreTitre}>Ce livre n’est plus dans la bibliothèque.</p>
        <Link className="lien" href="/bibliotheque">
          Voir les autres livres
        </Link>
      </main>
    );
  return <Bibliotheque livres={await livresPublies()} demande={demandeDepuis(demande)} ouvert={livre} />;
}
