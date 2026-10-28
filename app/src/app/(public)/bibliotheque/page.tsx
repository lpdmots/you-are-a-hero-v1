import type { Metadata } from "next";
import { demandeDepuis } from "@/domaine/bibliotheque-publique";
import { livresPublies } from "@/serveur/bibliotheque-publique";
import { Bibliotheque } from "./Bibliotheque";

export const metadata: Metadata = {
  title: "Histoires dont vous êtes le héros à lire en ligne",
  description: "Des histoires dont vous êtes le héros et des récits écrits par des classes de l’école élémentaire : des livres-jeux pour les enfants, à lire en ligne gratuitement, sans compte.",
  alternates: { canonical: "/bibliotheque" },
};

type Props = { searchParams: Promise<{ tri?: string; age?: string; type?: string; q?: string }> };

/** `/bibliotheque` (F15-AC11, AC12) : ouverte aux moteurs, au plan du site et à `llms.txt`. */
export default async function Page({ searchParams }: Props) {
  const [livres, demande] = await Promise.all([livresPublies(), searchParams]);
  return <Bibliotheque livres={livres} demande={demandeDepuis(demande)} ouvert={null} />;
}
