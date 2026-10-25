import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntreeIllustree, PASSAGES } from "@/composants/EntreeIllustree";
import { enseignantCourant } from "@/serveur/adulte";
import { FormulaireEntree } from "./FormulaireEntree";

export const metadata: Metadata = { title: "Entrée enseignant" };

/** Entrée de l'enseignant (F01-AC27), passage 7 ; « rendez-vous au 3 » mène à l'inscription (F14). */
export default async function Entree({ searchParams }: { searchParams: Promise<{ refus?: string; compte?: string }> }) {
  if (await enseignantCourant()) redirect("/");
  const { refus, compte } = await searchParams;
  return (
    <EntreeIllustree
      titre="Entrée enseignant"
      numero={PASSAGES.enseignant.vers}
      illustration="enseignant"
      retourAccueil
      aide={compte === "supprime" ? <span role="status">Votre compte est supprimé, avec tout ce qu’il contenait.</span> : undefined}
      choix={[
        { phrase: "Pour créer un compte, rendez-vous au", ...PASSAGES.inscription },
        { phrase: "Si vous êtes élève, rendez-vous au", ...PASSAGES.eleves },
      ]}
    >
      <FormulaireEntree refus={refus} />
    </EntreeIllustree>
  );
}
