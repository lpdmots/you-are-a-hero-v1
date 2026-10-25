import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntreeIllustree, PASSAGES } from "@/composants/EntreeIllustree";
import { enseignantCourant } from "@/serveur/adulte";
import { FormulaireInscription } from "../FormulaireEntree";

export const metadata: Metadata = { title: "Créer un compte" };

/** Inscription libre d'un adulte (F14) : sans invitation, sans projet d'exemple créé d'office. */
export default async function Inscription() {
  if (await enseignantCourant()) redirect("/");
  return (
    <EntreeIllustree
      titre="Créer un compte"
      numero={PASSAGES.inscription.vers}
      illustration="inscription"
      retourAccueil
      choix={[{ phrase: "Si vous avez déjà un compte, rendez-vous au", ...PASSAGES.enseignant }]}
    >
      <FormulaireInscription />
    </EntreeIllustree>
  );
}
