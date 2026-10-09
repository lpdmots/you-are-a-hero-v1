import styles from "./entree.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { enseignantCourant } from "@/serveur/adulte";
import { FormulaireEntree } from "./FormulaireEntree";

export const metadata: Metadata = { title: "Entrée enseignant" };

/** Entrée de l'enseignant (F01-AC27, F01-AC28) : aucune commande ne crée de compte. */
export default async function Entree({ searchParams }: { searchParams: Promise<{ refus?: string }> }) {
  if (await enseignantCourant()) redirect("/");
  const { refus } = await searchParams;
  return (
    <EntreeIllustree
      titre="Entrée enseignant"
      pied={
        <span className={styles.pied}>
          <Link href="/entree/oubli">Mot de passe oublié</Link>
          <span>
            Vous êtes élève ? <Link href="/classe">Ouvrir la classe</Link>
          </span>
        </span>
      }
    >
      <FormulaireEntree refus={refus} />
    </EntreeIllustree>
  );
}
