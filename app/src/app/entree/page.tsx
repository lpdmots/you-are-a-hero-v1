import styles from "./entree.module.css";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { enseignantCourant } from "@/serveur/adulte";
import { FormulaireEntree } from "./FormulaireEntree";

export const metadata: Metadata = { title: "Entrée enseignant" };

/** Entrée de l'enseignant (F01-AC27) ; « Créer un compte » mène à l'inscription (F14). */
export default async function Entree({ searchParams }: { searchParams: Promise<{ refus?: string; compte?: string }> }) {
  if (await enseignantCourant()) redirect("/");
  const { refus, compte } = await searchParams;
  return (
    <EntreeIllustree
      titre="Entrée enseignant"
      retourAccueil
      aide={compte === "supprime" ? <span role="status">Votre compte est supprimé, avec tout ce qu’il contenait.</span> : undefined}
      pied={
        <span className={styles.pied}>
          <Link href="/entree/oubli">Mot de passe oublié</Link>
          <span>
            Pas encore de compte ? <Link href="/entree/inscription">Créer un compte</Link>
          </span>
          <span>
            Élève ? <Link href="/classe">Entre dans ta classe</Link>
          </span>
        </span>
      }
    >
      <FormulaireEntree refus={refus} />
    </EntreeIllustree>
  );
}
