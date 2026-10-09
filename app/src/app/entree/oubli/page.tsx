import type { Metadata } from "next";
import Link from "next/link";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { FormulaireOubli } from "../FormulaireEntree";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function Oubli({ searchParams }: { searchParams: Promise<{ lien?: string }> }) {
  const { lien } = await searchParams;
  return (
    <EntreeIllustree
      titre="Mot de passe oublié"
      aide={
        lien === "perime"
          ? "Ce lien n’est plus valable. Demandez-en un nouveau, et ouvrez-le sur cet ordinateur."
          : "Écrivez votre adresse : vous recevrez un lien pour choisir un nouveau mot de passe."
      }
      pied={<Link href="/entree">Retour à l’entrée enseignant</Link>}
    >
      <FormulaireOubli />
    </EntreeIllustree>
  );
}
