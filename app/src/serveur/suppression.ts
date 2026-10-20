import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envoyer } from "./courriel";
import { adresseDuSite } from "./env";
import { clientService } from "./supabase";

/**
 * Supprimer pour de bon un compte (F14-AC26, AC29) : ses fichiers du stockage, puis ses projets,
 * ses élèves et ses classes, puis le compte lui-même. Les ventes restent, sans nom. Un lien de
 * lecture de ses livres ne mène plus qu'à la page neutre. Toujours côté serveur, avec la clé de
 * service, après que l'appelant a vérifié qui demande.
 */

const SEAUX = ["images", "livres"] as const;

/** Tous les fichiers rangés sous un préfixe, sous-dossiers compris. */
async function fichiersSous(base: SupabaseClient, seau: string, prefixe: string): Promise<string[]> {
  const trouves: string[] = [];
  const parcourir = async (dossier: string) => {
    for (let depart = 0; ; depart += 1000) {
      const { data } = await base.storage.from(seau).list(dossier, { limit: 1000, offset: depart });
      if (!data?.length) break;
      for (const f of data) {
        const chemin = `${dossier}/${f.name}`;
        // Un dossier n'a pas d'identifiant dans la liste du stockage
        if (f.id === null) await parcourir(chemin);
        else trouves.push(chemin);
      }
      if (data.length < 1000) break;
    }
  };
  await parcourir(prefixe);
  return trouves;
}

/** Supprime un compte et tout ce qu'il possède. Une erreur est levée si quelque chose résiste. */
export async function supprimerLeCompte(id: string): Promise<void> {
  const base = clientService();
  for (const seau of SEAUX) {
    const chemins = await fichiersSous(base, seau, id);
    for (let i = 0; i < chemins.length; i += 500) {
      const { error } = await base.storage.from(seau).remove(chemins.slice(i, i + 500));
      if (error) throw new Error(`Stockage : ${error.message}`);
    }
  }
  // Dans cet ordre : ce qui retient une classe part avant elle (F01.1)
  for (const table of ["projets", "inscriptions", "eleves", "classes"] as const) {
    const { error } = await base.from(table).delete().eq("enseignant_id", id);
    if (error) throw new Error(`Suppression du compte (${table}) : ${error.message}`);
  }
  const { error } = await base.auth.admin.deleteUser(id);
  if (error) throw new Error(`Suppression du compte : ${error.message}`);
}

export type Tournee = { prevenus: number; supprimes: number };

/**
 * La tournée quotidienne des comptes inactifs (F14-AC29) : un compte sans connexion depuis cinq
 * ans reçoit un avis qui dit que lui et ses livres partagés seront supprimés dans trente jours ;
 * trente jours après l'avis, sans connexion, il est supprimé. Une connexion annule l'avis.
 */
export async function tourneeDesComptesInactifs(): Promise<Tournee> {
  const base = clientService();
  const { data, error } = await base.rpc("comptes_inactifs");
  if (error) throw new Error(`Comptes inactifs : ${error.message}`);
  const lignes = (data ?? []) as { id: string; courriel: string | null; a_prevenir: boolean; a_supprimer: boolean; reconnecte: boolean }[];
  let prevenus = 0;
  let supprimes = 0;
  for (const c of lignes) {
    if (c.a_supprimer) {
      await supprimerLeCompte(c.id);
      supprimes += 1;
    } else if (c.a_prevenir && c.courriel) {
      const parti = await envoyer({
        a: c.courriel,
        sujet: "Votre compte sera supprimé dans trente jours — Il était une classe",
        texte: [
          "Bonjour,",
          "",
          "Personne ne s'est connecté à votre compte Il était une classe depuis cinq ans.",
          "Sans connexion d'ici trente jours, il sera supprimé avec vos projets, vos classes et vos images ; vos livres partagés ne seront plus lisibles.",
          "Pour le garder, il suffit d'entrer une fois :",
          `${adresseDuSite()}/entree`,
          "",
          "Il était une classe",
        ].join("\n"),
      });
      // Sans courriel parti, pas d'avis : la suppression attendra un avis vraiment envoyé
      if (parti) {
        await base.from("avis_d_inactivite").insert({ enseignant_id: c.id });
        prevenus += 1;
      }
    } else if (c.reconnecte) {
      // Reconnecté depuis l'avis : l'avis tombe
      await base.from("avis_d_inactivite").delete().eq("enseignant_id", c.id);
    }
  }
  return { prevenus, supprimes };
}
