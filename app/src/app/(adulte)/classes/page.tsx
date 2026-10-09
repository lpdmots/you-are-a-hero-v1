import type { Metadata } from "next";
import { cookies } from "next/headers";
import { anneesOffertes } from "@/domaine/annee";
import { exigerEnseignant } from "@/serveur/adulte";
import { mesClasses } from "@/serveur/lectures";
import { MesClasses } from "./MesClasses";

export const metadata: Metadata = { title: "Mes classes" };

export default async function PageMesClasses({ searchParams }: { searchParams: Promise<{ nouvelle?: string; message?: string }> }) {
  const enseignant = await exigerEnseignant();
  const [{ nouvelle, message }, classes, magasin] = await Promise.all([searchParams, mesClasses(enseignant), cookies()]);
  return (
    <MesClasses
      classes={classes}
      annees={anneesOffertes(new Date())}
      aideMasquee={enseignant.aidesMasquees.includes("classes")}
      aideVue={magasin.get("aide-classes")?.value === "vue"}
      nouvelle={nouvelle === "1"}
      message={message === "supprimee" ? "La classe est supprimée." : null}
    />
  );
}
