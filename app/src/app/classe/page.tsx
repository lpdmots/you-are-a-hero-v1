import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { etatDuPoste } from "@/serveur/poste";
import { OuvrirLaClasse } from "./OuvrirLaClasse";

export const metadata: Metadata = { title: "Bienvenue dans la classe" };

/** Entrée des élèves, première étape : ouvrir la classe sur cet ordinateur (F06-AC43). */
export default async function EntreeDesEleves() {
  const poste = await etatDuPoste();
  if (poste) redirect(poste.inscriptionId ? "/travail" : "/classe/qui");
  return (
    <EntreeIllustree
      titre="Bienvenue dans la classe"
      pied={
        <>
          Vous enseignez dans cette classe ? <Link href="/entree">Entrée des enseignants</Link>
        </>
      }
    >
      <OuvrirLaClasse />
    </EntreeIllustree>
  );
}
