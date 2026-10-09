import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { libelleAnnee } from "@/domaine/annee";
import { exigerEnseignant } from "@/serveur/adulte";
import { adresseDuSite } from "@/serveur/env";
import { classeDe, mesClasses } from "@/serveur/lectures";
import { PageClasse } from "./PageClasse";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ message?: string; terminer?: string; nombre?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const classe = await classeDe(await exigerEnseignant(), (await params).id);
  return { title: classe ? `${classe.nom} ${libelleAnnee(classe.anneeDebut)} — Mes classes` : "Mes classes" };
}

export default async function UneClasse({ params, searchParams }: Props) {
  const enseignant = await exigerEnseignant();
  const [{ id }, { message, terminer, nombre }] = await Promise.all([params, searchParams]);
  const classe = await classeDe(enseignant, id);
  if (!classe) notFound();

  // Proposé à la création d'une classe pour une année suivante, jamais d'office (F01-AC20)
  const ancienne = terminer ? (await mesClasses(enseignant)).find((c) => c.id === terminer && c.enCours && c.id !== classe.id) : null;
  const site = adresseDuSite((await headers()).get("host"));
  const n = Number(nombre) || 0;

  return (
    <PageClasse
      classe={classe}
      adresse={`${site.replace(/^https?:\/\//, "")}/classe`}
      aideMasquee={enseignant.aidesMasquees.includes("classes")}
      ancienne={ancienne ? { id: ancienne.id, nom: ancienne.nom, annee: libelleAnnee(ancienne.anneeDebut), projets: ancienne.projets.length } : null}
      message={
        message === "creee"
          ? `« ${classe.nom} » est créée. Inscrivez vos élèves quand vous voulez.`
          : message === "inscrits" && n
            ? `${n} élève${n > 1 ? "s" : ""} inscrit${n > 1 ? "s" : ""}. Chacun a son code : imprimez les étiquettes.`
            : null
      }
    />
  );
}
