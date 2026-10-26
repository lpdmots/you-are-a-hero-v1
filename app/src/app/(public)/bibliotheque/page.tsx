import type { Metadata } from "next";
import { demandeDepuis } from "@/domaine/bibliotheque-publique";
import { livresPublies } from "@/serveur/bibliotheque-publique";
import { Bibliotheque } from "./Bibliotheque";

export const metadata: Metadata = {
  title: "La bibliothèque",
  description: "Des livres écrits par des classes de l’école élémentaire avec Il était une classe : des livres-jeux à choix et des récits, à lire en ligne, gratuitement, sans compte.",
  alternates: { canonical: "/bibliotheque" },
};

type Props = { searchParams: Promise<{ tri?: string; age?: string; type?: string; q?: string }> };

/** `/bibliotheque` (F15-AC11, AC12) : ouverte aux moteurs, au plan du site et à `llms.txt`. */
export default async function Page({ searchParams }: Props) {
  const [livres, demande] = await Promise.all([livresPublies(), searchParams]);
  return <Bibliotheque livres={livres} demande={demandeDepuis(demande)} ouvert={null} />;
}
