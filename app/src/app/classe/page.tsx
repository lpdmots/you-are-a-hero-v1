import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntreeIllustree, PASSAGES } from "@/composants/EntreeIllustree";
import { etatDuPoste } from "@/serveur/poste";
import { OuvrirLaClasse } from "./OuvrirLaClasse";

export const metadata: Metadata = { title: "Bienvenue dans ta classe" };

/** Entrée des élèves, première étape : ouvrir la classe sur cet ordinateur (F06-AC43), passage 14. */
export default async function EntreeDesEleves() {
  const poste = await etatDuPoste();
  if (poste) redirect(poste.inscriptionId ? "/travail" : "/classe/qui");
  return (
    <EntreeIllustree
      titre="Bienvenue dans ta classe"
      numero={PASSAGES.eleves.vers}
      illustration="eleves"
      parole="— Te voilà ! J’ai hâte de lire la suite de l’histoire."
      retourAccueil
      choix={[{ phrase: "Si vous enseignez, rendez-vous au", ...PASSAGES.enseignant }]}
    >
      <OuvrirLaClasse />
    </EntreeIllustree>
  );
}
