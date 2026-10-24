import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MODELES, modeleDe } from "@/domaine/textes-publics";
import { PageDeTexte } from "../../PageDeTexte";
import styles from "../../public.module.css";

export function generateStaticParams() {
  return MODELES.map((m) => ({ cle: m.cle }));
}

export async function generateMetadata({ params }: { params: Promise<{ cle: string }> }): Promise<Metadata> {
  const m = modeleDe((await params).cle);
  return m ? { title: m.nom, description: m.pour, alternates: { canonical: `/modeles/${m.cle}` } } : {};
}

/** Un modèle (F14-AC33) : lisible ici, à télécharger pour le compléter dans Word ou LibreOffice. */
export default async function Modele({ params }: { params: Promise<{ cle: string }> }) {
  const m = modeleDe((await params).cle);
  if (!m) notFound();
  return (
    <PageDeTexte
      document={m.document}
      avant={
        <p className={styles.telecharger}>
          <a className="btn btn--primaire" href={`/modeles/${m.cle}/fichier`} download>
            Télécharger le modèle
          </a>
          <span className={styles.maj}>Un fichier qui s’ouvre dans Word ou LibreOffice, pour le compléter.</span>
        </p>
      }
      apres={
        <p className={styles.telecharger}>
          <Link href="/aide">Retour à l’aide</Link>
        </p>
      }
    />
  );
}
