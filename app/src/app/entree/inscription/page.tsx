import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EntreeIllustree } from "@/composants/EntreeIllustree";
import { enseignantCourant } from "@/serveur/adulte";
import { FormulaireInscription } from "../FormulaireEntree";

export const metadata: Metadata = { title: "Créer un compte" };

/** Inscription libre d'un adulte (F14) : sans invitation, sans projet d'exemple créé d'office. */
export default async function Inscription() {
  if (await enseignantCourant()) redirect("/");
  return (
    <EntreeIllustree titre="Créer un compte" retourAccueil pied={<span>Déjà un compte ? <Link href="/entree">Entrer</Link></span>}>
      <FormulaireInscription />
    </EntreeIllustree>
  );
}
