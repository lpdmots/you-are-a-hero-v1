import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VeillePoste } from "@/composants/VeillePoste";
import { nomPourEleves, trier, type Eleve } from "@/domaine/eleves";
import { de } from "@/domaine/texte";
import { nomPourLesEleves } from "@/serveur/adulte";
import { clientDuPoste, etatDuPoste } from "@/serveur/poste";
import { ChoixDuProfil } from "./ChoixDuProfil";

export const metadata: Metadata = { title: "Qui utilise cet ordinateur ?" };

/**
 * Deuxième étape : « Qui utilise cet ordinateur ? ». La liste vient de la base, lue au
 * nom du poste : elle ne peut montrer que les élèves de la classe ouverte ici.
 */
export default async function QuiUtiliseCetOrdinateur() {
  const poste = await etatDuPoste();
  if (!poste) redirect("/classe");
  if (poste.inscriptionId) redirect("/travail");

  const base = await clientDuPoste(poste);
  const [{ data: classe }, { data: inscriptions, error }] = await Promise.all([
    base.from("classes").select("nom, enseignant_id").eq("id", poste.classeId).maybeSingle(),
    base.from("inscriptions").select("id, eleves(id, prenom, nom, couleur)").eq("classe_id", poste.classeId),
  ]);
  if (!classe) redirect("/classe");
  if (error) throw new Error(`Liste des élèves illisible : ${error.message}`);
  const { data: enseignant } = await base.from("enseignants").select("nom_affiche").eq("id", classe.enseignant_id).maybeSingle();

  const lignes = (inscriptions ?? []) as unknown as { id: string; eleves: Eleve | null }[];
  const eleves = lignes.filter((i) => i.eleves).map((i) => ({ ...i.eleves!, inscriptionId: i.id }));
  // Les élèves ne lisent que des prénoms, et l'initiale du nom pour deux mêmes prénoms (F01-AC21) :
  // le nom entier ne part pas vers le navigateur.
  const profils = trier(eleves).map((e) => ({
    inscriptionId: e.inscriptionId,
    prenom: e.prenom,
    couleur: e.couleur,
    affiche: nomPourEleves(e, eleves),
  }));

  return (
    <>
      <VeillePoste attendu="classe" />
      <ChoixDuProfil
        classe={`Classe ${classe.nom}${enseignant?.nom_affiche ? ` ${de(enseignant.nom_affiche)}` : ""}`}
        enseignant={nomPourLesEleves(enseignant?.nom_affiche)}
        profils={profils}
      />
    </>
  );
}
