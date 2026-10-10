"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { estOnglet } from "@/domaine/projets";
import { estVisuel, tirerVisuel } from "@/domaine/visuels";
import { exigerEnseignant } from "@/serveur/adulte";

export type CreationProjet = {
  organisation: "classe" | "personnel"; recit: "choix" | "classique"; titre: string; classeId: string | null;
  /** Le visuel que la carte montrait pendant la création, et celui que l'adulte a retenu lui-même (F10-AC21) */
  visuelDefaut?: string; visuelChoisi?: string | null;
  /** Une image attend d'être importée : la page de création s'en charge, puis ouvre le projet */
  avecImage?: boolean;
};

/**
 * Créer un projet (F01, 6 octobre 2026) : rien n'existe avant cette confirmation
 * (F01-AC17). Le projet s'ouvre sur sa Préparation et devient le dernier projet ouvert.
 */
export async function creerProjet(demande: CreationProjet): Promise<{ erreur: string } | { id: string }> {
  const enseignant = await exigerEnseignant();
  const titre = demande.titre.trim().replace(/\s+/g, " ");
  if (!titre) return { erreur: "Donnez un titre à votre histoire." };
  if (titre.length > 120) return { erreur: "Ce titre est trop long." };
  if (!["classe", "personnel"].includes(demande.organisation) || !["choix", "classique"].includes(demande.recit)) {
    return { erreur: "Répondez d’abord aux deux premières questions." };
  }
  const id = randomUUID();
  const { data, error } = await enseignant.supabase
    .from("projets")
    .insert({
      id,
      enseignant_id: enseignant.id,
      organisation: demande.organisation,
      recit: demande.recit,
      titre,
      classe_id: demande.organisation === "classe" ? demande.classeId : null,
      visuel_defaut: estVisuel(demande.visuelDefaut) ? demande.visuelDefaut : tirerVisuel(id),
      visuel_choisi: estVisuel(demande.visuelChoisi) ? demande.visuelChoisi : null,
    })
    .select("id")
    .single();
  if (error || !data) return { erreur: "Le projet n’a pas pu être créé. Réessayez." };
  await enseignant.supabase.from("enseignants").update({ dernier_projet_id: data.id }).eq("id", enseignant.id);
  revalidatePath("/", "layout");
  if (demande.avecImage) return { id: data.id };
  redirect(`/projet/${data.id}/preparation?message=cree`);
}

/**
 * Choisir ou changer la classe d'un projet de classe (F01-AC08, F01-AC24). Seules les
 * classes en cours sont proposées ; la base refuse une classe dont l'année est terminée.
 */
export async function choisirClasseDuProjet(projetId: string, classeId: string): Promise<{ erreur?: string }> {
  const enseignant = await exigerEnseignant();
  const { data, error } = await enseignant.supabase
    .from("projets")
    .update({ classe_id: classeId })
    .eq("id", projetId)
    .eq("organisation", "classe")
    .select("id");
  // La base dit pourquoi : des chapitres sont déjà attribués (F01-AC24)
  if (error?.code === "P0001") return { erreur: error.message };
  if (error || !data?.length) return { erreur: "La classe n’a pas pu être choisie." };
  revalidatePath("/", "layout");
  return {};
}

/**
 * Le dernier projet ouvert et son dernier onglet, tenus par le compte et non par le
 * navigateur (F06-AC53). La base ne laisse noter qu'un projet à soi.
 */
export async function noterProjetOuvert(projetId: string, onglet: string): Promise<void> {
  const enseignant = await exigerEnseignant();
  if (!/^[0-9a-f-]{36}$/i.test(projetId) || !estOnglet(onglet)) return;
  const { data } = await enseignant.supabase.from("projets").update({ dernier_onglet: onglet }).eq("id", projetId).select("id");
  if (!data?.length) return;
  if (enseignant.dernierProjetId !== projetId) {
    await enseignant.supabase.from("enseignants").update({ dernier_projet_id: projetId }).eq("id", enseignant.id);
  }
}
