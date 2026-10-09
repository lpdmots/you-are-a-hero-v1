import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { enseignantCourant, sessionDeRecuperation } from "@/serveur/adulte";
import { FormulaireNouveauMotDePasse } from "../FormulaireEntree";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function NouveauMotDePasse() {
  // Cette page ne s'ouvre qu'après le lien reçu par courriel
  if (!(await sessionDeRecuperation())) redirect((await enseignantCourant()) ? "/" : "/entree/oubli?lien=perime");
  return (
    <EntreeIllustree titre="Nouveau mot de passe" aide="Huit caractères au moins. L’ancien ne marchera plus.">
      <FormulaireNouveauMotDePasse />
    </EntreeIllustree>
  );
}
