import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { enseignantCourant } from "@/serveur/adulte";
import { FormulaireEntree } from "./FormulaireEntree";

export const metadata: Metadata = { title: "Entrée enseignant" };

/** Entrée de l'enseignant (F01-AC27, F01-AC28) : aucune commande ne crée de compte. */
export default async function Entree() {
  if (await enseignantCourant()) redirect("/");
  return (
    <EntreeIllustree
      titre="Entrée enseignant"
      aide="Avec votre adresse électronique et votre mot de passe."
      pied={
        <>
          Vous êtes élève ? <Link href="/classe">Ouvrir la classe</Link>
        </>
      }
    >
      <FormulaireEntree />
    </EntreeIllustree>
  );
}
