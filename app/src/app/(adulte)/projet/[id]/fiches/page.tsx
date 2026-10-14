import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjetOuvert } from "@/composants/ProjetCourant";
import { horsFiche } from "@/domaine/fiches";
import { filtrer, filtresDepuis, lignesDuPlan } from "@/domaine/suivi";
import { exigerEnseignant } from "@/serveur/adulte";
import { contenusDesFiches } from "@/serveur/fiches";
import { projetDe } from "@/serveur/lectures";
import { elevesDeLaClasse, planDe } from "@/serveur/recit";
import { Fiches } from "./Fiches";

export const metadata: Metadata = { title: "Fiches de rédaction" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ suivi?: string }> };

/** Les filtres du Suivi, tels que l'adresse les porte : rien d'autre qu'une suite de « nom=valeur ». */
const requeteDuSuivi = (v: unknown): string => (typeof v === "string" && /^[\w=&%.~-]{0,400}$/.test(v) ? v : "");

/**
 * Fiches de rédaction (F07.4). La page s'ouvre sur les scènes que le Suivi listait à ce
 * moment-là, qui restent à écrire ou à reprendre et qui ont une consigne (F06-AC57) ; ce
 * choix se corrige avant d'imprimer. Un projet personnel n'a pas de fiches (F07-AC69).
 */
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const enseignant = await exigerEnseignant();
  const projet = await projetDe(enseignant, id);
  if (!projet || projet.organisation !== "classe") notFound();
  const [plan, eleves, contenus, demande] = await Promise.all([
    planDe(enseignant, projet.id), elevesDeLaClasse(enseignant, projet.classe?.id ?? null), contenusDesFiches(enseignant, projet.id), searchParams,
  ]);
  const suivi = requeteDuSuivi(demande.suivi);
  const filtres = filtresDepuis(Object.fromEntries(new URLSearchParams(suivi)));
  // « Dont Alice s'occupe » : on arrive sur sa feuille ; « Tout son chapitre » : sur celle du chapitre, camarades compris
  const eleve = filtres.eleve && filtres.eleve !== "moi" && filtres.mode === "occupe" && eleves.some((e) => e.id === filtres.eleve) ? filtres.eleve : null;
  const choisies = filtrer(lignesDuPlan(plan), filtres)
    .filter((l) => horsFiche(l.scene) === null)
    .map((l) => l.scene.id);
  return (
    <div className="page">
      <ProjetOuvert id={projet.id} titre={projet.titre} onglet="suivi" />
      <Fiches
        projet={{ id: projet.id, titre: projet.titre }}
        plan={plan}
        eleves={eleves}
        contenus={contenus}
        depart={{ choisies, eleve, par: filtres.eleve && filtres.eleve !== "moi" && filtres.mode === "chapitre" ? "chapitre" : null }}
        retour={`/projet/${projet.id}/suivi?${suivi ? `${suivi}&` : ""}revenu=1`}
      />
    </div>
  );
}
