"use server";

import { randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { codePropose, codeValide, identifiantConvient, identifiantsProposes, motDePassePropose } from "@/domaine/acces";
import { memePrenom, prenomEnDouble, type Personne } from "@/domaine/eleves";
import { plageValide, type Plage } from "@/domaine/horaires";
import { MOTS } from "@/domaine/mots";
import { exigerEnseignant, type Enseignant } from "@/serveur/adulte";
import { chiffrer, dechiffrer } from "@/serveur/chiffrement";
import { classeDe } from "@/serveur/lectures";

/**
 * Commandes de « Mes classes » (F01.1, F06.4). Chacune revérifie qui demande ; la base
 * refuse de son côté ce qui touche la classe d'un autre ou une classe terminée.
 */

type Fait<T = object> = ({ ok: true } & T) | { ok: false; erreur: string };
const echec = (erreur: string): { ok: false; erreur: string } => ({ ok: false, erreur });
const tirer = (n: number): number => randomInt(n);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const propre = (texte: string): string => texte.trim().replace(/\s+/g, " ");

async function classeEnCours(enseignant: Enseignant, classeId: string) {
  const classe = UUID.test(classeId) ? await classeDe(enseignant, classeId) : null;
  return classe?.enCours ? classe : null;
}

const rafraichir = (classeId?: string) => {
  revalidatePath("/classes");
  if (classeId) revalidatePath(`/classes/${classeId}`, "layout");
};

/** Une classe, c'est un nom et une année ; ses informations de connexion sont proposées. */
export async function creerClasse(nom: string, anneeDebut: number): Promise<Fait<{ id: string }>> {
  const enseignant = await exigerEnseignant();
  const nomPropre = propre(nom).slice(0, 60);
  if (!nomPropre) return echec("Donnez un nom à la classe.");
  if (!Number.isInteger(anneeDebut) || anneeDebut < 2000 || anneeDebut > 2100) return echec("Choisissez une année scolaire.");

  const id = randomUUID();
  const chiffre = chiffrer(motDePassePropose(tirer), { sorte: "classe", id });
  // L'identifiant est unique entre tous les enseignants : la base le dit, on essaie le suivant.
  for (const identifiant of identifiantsProposes(nomPropre, enseignant.nomAffiche, tirer)) {
    const { error } = await enseignant.supabase.rpc("creer_classe", {
      p_id: id, p_nom: nomPropre, p_annee_debut: anneeDebut, p_identifiant: identifiant, p_mot_de_passe_chiffre: chiffre,
    });
    if (!error) {
      rafraichir();
      return { ok: true, id };
    }
    if (error.code !== "23505") break;
  }
  return echec("La classe n’a pas pu être créée. Réessayez.");
}

/**
 * Renommer la classe. Sur demande seulement, son identifiant suit le nouveau nom
 * (F06-AC84) : il est proposé comme à la création, jamais écrit librement. Le mot de
 * passe et les codes ne changent pas, et les postes où la classe est ouverte le restent.
 */
export async function renommerClasse(classeId: string, nom: string, avecIdentifiant = false): Promise<Fait<{ identifiant: string | null }>> {
  const enseignant = await exigerEnseignant();
  const nomPropre = propre(nom).slice(0, 60);
  if (!nomPropre) return echec("Donnez un nom à la classe.");
  const classe = await classeEnCours(enseignant, classeId);
  if (!classe) return echec("Cette classe ne se modifie plus.");

  if (avecIdentifiant && !identifiantConvient(classe.identifiant, nomPropre, enseignant.nomAffiche)) {
    // Unique entre tous les enseignants : la base le dit, on essaie le suivant
    for (const identifiant of identifiantsProposes(nomPropre, enseignant.nomAffiche, tirer)) {
      const { error } = await enseignant.supabase.from("classes").update({ nom: nomPropre, identifiant }).eq("id", classeId);
      if (!error) {
        rafraichir(classeId);
        return { ok: true, identifiant };
      }
      if (error.code !== "23505") break;
    }
    return echec("Le nom et l’identifiant n’ont pas pu être changés. Réessayez.");
  }

  const { error } = await enseignant.supabase.from("classes").update({ nom: nomPropre }).eq("id", classeId);
  if (error) return echec("Le nom n’a pas pu être changé.");
  rafraichir(classeId);
  return { ok: true, identifiant: null };
}

/** Une classe sans élève ni projet se supprime ; les autres se terminent (F01.1). */
export async function supprimerClasse(classeId: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  if (!UUID.test(classeId)) return echec("Classe inconnue.");
  const { data, error } = await enseignant.supabase.from("classes").delete().eq("id", classeId).select("id");
  if (error || !data?.length) return echec("Une classe qui a des élèves ou un projet ne se supprime pas.");
  rafraichir();
  return { ok: true };
}

/** « Terminer l'année » : l'accès de classe ne s'ouvre plus, rien n'est supprimé (F01-AC18). */
export async function terminerAnnee(classeId: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  if (!UUID.test(classeId)) return echec("Classe inconnue.");
  const { data, error } = await enseignant.supabase
    .from("classes")
    .update({ terminee_le: new Date().toISOString() })
    .eq("id", classeId)
    .is("terminee_le", null)
    .select("id");
  if (error || !data?.length) return echec("L’année n’a pas pu être terminée.");
  rafraichir(classeId);
  return { ok: true };
}

/** « Rouvrir la classe » : mêmes informations de classe, mêmes codes (F01-AC19). */
export async function rouvrirClasse(classeId: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  if (!UUID.test(classeId)) return echec("Classe inconnue.");
  const { data, error } = await enseignant.supabase.from("classes").update({ terminee_le: null }).eq("id", classeId).select("id");
  if (error || !data?.length) return echec("La classe n’a pas pu être rouverte.");
  rafraichir(classeId);
  return { ok: true };
}

/** Le mot de passe de la classe, relu à la demande (F06-AC67, F06-AC71). */
export async function voirMotDePasse(classeId: string): Promise<Fait<{ motDePasse: string }>> {
  const enseignant = await exigerEnseignant();
  if (!UUID.test(classeId)) return echec("Classe inconnue.");
  const { data } = await enseignant.supabase.from("classes_secrets").select("mot_de_passe_chiffre").eq("classe_id", classeId).maybeSingle();
  if (!data) return echec("Mot de passe introuvable.");
  return { ok: true, motDePasse: dechiffrer(data.mot_de_passe_chiffre, { sorte: "classe", id: classeId }) };
}

/** Un nouveau mot de passe, proposé avant d'être confirmé. */
export async function proposerMotDePasse(): Promise<string> {
  await exigerEnseignant();
  return motDePassePropose(tirer);
}

/**
 * Remplacer le mot de passe (F06-AC68). La base ferme alors les postes où la classe
 * était ouverte (F06-AC77) ; les codes des élèves ne changent pas.
 */
export async function changerMotDePasse(classeId: string, nouveau: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  const morceaux = nouveau.split(" ");
  const forme =
    morceaux.length === 3 && morceaux[0] !== morceaux[1] &&
    (MOTS as readonly string[]).includes(morceaux[0]) && (MOTS as readonly string[]).includes(morceaux[1]) && /^[1-9][0-9]$/.test(morceaux[2]);
  if (!forme) return echec("Ce mot de passe n’a pas la forme attendue.");
  if (!(await classeEnCours(enseignant, classeId))) return echec("Cette classe ne se modifie plus.");
  const { data, error } = await enseignant.supabase
    .from("classes_secrets")
    .update({ mot_de_passe_chiffre: chiffrer(nouveau, { sorte: "classe", id: classeId }) })
    .eq("classe_id", classeId)
    .select("classe_id");
  if (error || !data?.length) return echec("Le mot de passe n’a pas pu être changé.");
  rafraichir(classeId);
  return { ok: true };
}

/** Tous les codes de la classe : « Afficher les codes » (F06-AC71). */
export async function voirCodes(classeId: string): Promise<Fait<{ codes: Record<string, string> }>> {
  const enseignant = await exigerEnseignant();
  const classe = await classeEnCours(enseignant, classeId);
  if (!classe) return echec("Classe inconnue.");
  const ids = classe.eleves.map((e) => e.id);
  if (!ids.length) return { ok: true, codes: {} };
  const { data, error } = await enseignant.supabase.from("eleves_secrets").select("eleve_id, code_chiffre").in("eleve_id", ids);
  if (error) return echec("Les codes n’ont pas pu être lus.");
  const codes: Record<string, string> = {};
  for (const s of data ?? []) codes[s.eleve_id] = dechiffrer(s.code_chiffre, { sorte: "code", id: s.eleve_id });
  return { ok: true, codes };
}

/** Le code d'un seul élève : sa fiche ne montre pas ceux des autres (F06-AC69, F06-AC71). */
export async function voirCode(classeId: string, eleveId: string): Promise<Fait<{ code: string }>> {
  const enseignant = await exigerEnseignant();
  const classe = await classeEnCours(enseignant, classeId);
  if (!classe?.eleves.some((e) => e.id === eleveId)) return echec("Élève inconnu.");
  const { data } = await enseignant.supabase.from("eleves_secrets").select("code_chiffre").eq("eleve_id", eleveId).maybeSingle();
  if (!data) return echec("Code introuvable.");
  return { ok: true, code: dechiffrer(data.code_chiffre, { sorte: "code", id: eleveId }) };
}

export async function proposerCode(): Promise<string> {
  await exigerEnseignant();
  return codePropose(tirer);
}

/**
 * Remplacer le code d'un élève (F06-AC24) : le nouveau vaut à sa prochaine
 * identification, sans couper sa séance en cours (F06-AC79).
 */
export async function changerCode(classeId: string, eleveId: string, code: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  if (!codeValide(code)) return echec("Un code a quatre chiffres.");
  const classe = await classeEnCours(enseignant, classeId);
  if (!classe?.eleves.some((e) => e.id === eleveId)) return echec("Élève inconnu.");
  const { data, error } = await enseignant.supabase
    .from("eleves_secrets")
    .update({ code_chiffre: chiffrer(code, { sorte: "code", id: eleveId }) })
    .eq("eleve_id", eleveId)
    .select("eleve_id");
  if (error || !data?.length) return echec("Le code n’a pas pu être changé.");
  return { ok: true };
}

/** Prénom obligatoire, nom facultatif (F01.1). */
export async function modifierEleve(classeId: string, eleveId: string, prenom: string, nom: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  const prenomPropre = propre(prenom).slice(0, 40);
  const nomPropre = propre(nom).slice(0, 60);
  if (!prenomPropre) return echec("Un élève a un prénom.");
  const classe = await classeEnCours(enseignant, classeId);
  if (!classe?.eleves.some((e) => e.id === eleveId)) return echec("Élève inconnu.");
  // Deux fois le même prénom dans la classe : le nom, ou son initiale, les distingue (F01-AC21)
  const autres = classe.eleves.filter((e) => e.id !== eleveId);
  if (!nomPropre && autres.some((a) => memePrenom(a, { prenom: prenomPropre, nom: null }))) {
    return echec(`Un autre élève s’appelle ${prenomPropre} : écrivez son nom, ou son initiale.`);
  }
  const { error } = await enseignant.supabase.from("eleves").update({ prenom: prenomPropre, nom: nomPropre || null }).eq("id", eleveId);
  if (error) return echec("Le nom n’a pas pu être changé.");
  rafraichir(classeId);
  return { ok: true };
}

/**
 * « Retirer de la classe » : fin de l'inscription (F01.1). L'élève ne figure plus au
 * choix des prénoms et son poste revient à ce choix (F06-AC78). Le sort de ses scènes
 * s'ajoute à l'étape 4 (F01-AC22, F01-AC25).
 */
export async function retirerEleve(classeId: string, inscriptionId: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  if (!UUID.test(inscriptionId)) return echec("Élève inconnu.");
  const { data, error } = await enseignant.supabase
    .from("inscriptions")
    .update({ retire_le: new Date().toISOString() })
    .eq("id", inscriptionId)
    .eq("classe_id", classeId)
    .is("retire_le", null)
    .select("id");
  if (error || !data?.length) return echec("L’élève n’a pas pu être retiré.");
  rafraichir(classeId);
  return { ok: true };
}

/** « Annuler », juste après un retrait. */
export async function annulerRetrait(classeId: string, inscriptionId: string): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  if (!UUID.test(inscriptionId)) return echec("Élève inconnu.");
  const { data, error } = await enseignant.supabase
    .from("inscriptions")
    .update({ retire_le: null })
    .eq("id", inscriptionId)
    .eq("classe_id", classeId)
    .select("id");
  if (error || !data?.length) return echec("Le retrait n’a pas pu être annulé.");
  rafraichir(classeId);
  return { ok: true };
}

/** Horaires : des jours cochés et une plage, d'autres pouvant s'ajouter (F06-AC27, F06-AC72). */
export async function reglerHoraires(classeId: string, limites: boolean, plages: Plage[]): Promise<Fait> {
  const enseignant = await exigerEnseignant();
  if (!UUID.test(classeId)) return echec("Classe inconnue.");
  if (limites && (!plages.length || !plages.every(plageValide))) {
    return echec("Cochez au moins un jour, et écrivez une heure de début avant l’heure de fin.");
  }
  const { error } = await enseignant.supabase.rpc("regler_horaires", {
    p_classe: classeId,
    p_limites: limites,
    p_plages: limites ? plages.map((p) => ({ jours: [...p.jours].sort((a, b) => a - b), de: p.de, a: p.a })) : [],
  });
  if (error) return echec("Les horaires n’ont pas pu être enregistrés.");
  rafraichir(classeId);
  return { ok: true };
}

/**
 * Inscription en lot (F01-AC10 à AC12) : les profils connus cochés sont réinscrits
 * avec leur code, les nouveaux reçoivent un profil et un code proposé. Rien n'est
 * créé avant cette confirmation (F01-AC11).
 */
export async function inscrireEleves(
  classeId: string,
  connus: string[],
  nouveaux: Personne[],
  nomsDonnes: { id: string; nom: string }[] = [],
): Promise<Fait<{ nombre: number }>> {
  const enseignant = await exigerEnseignant();
  const classe = await classeEnCours(enseignant, classeId);
  if (!classe) return echec("Cette classe n’existe pas, ou son année est terminée.");
  if (!connus.every((id) => UUID.test(id))) return echec("Liste illisible.");
  if (connus.length + nouveaux.length === 0) return echec("Aucun élève à inscrire.");
  if (connus.length + nouveaux.length > 200) return echec("Cette liste est trop longue.");

  const lignes = nouveaux.map((n) => ({ prenom: propre(n.prenom).slice(0, 40), nom: propre(n.nom ?? "").slice(0, 60) }));
  if (lignes.some((l) => !l.prenom)) return echec("Chaque élève a un prénom.");

  // Deux fois le même prénom : sans nom pour les distinguer, on n'inscrit pas (F01-AC21).
  // La règle vaut pour les nouveaux comme pour les profils connus que l'on réinscrit.
  const { data: profils } = connus.length
    ? await enseignant.supabase.from("eleves").select("id, prenom, nom").in("id", connus)
    : { data: [] as { id: string; prenom: string; nom: string | null }[] };
  const donnes = new Map(nomsDonnes.filter((n) => connus.includes(n.id)).map((n) => [n.id, propre(n.nom).slice(0, 60)]));
  const reinscrits = (profils ?? []).map((p) => ({ id: p.id, prenom: p.prenom, nom: p.nom ?? (donnes.get(p.id) || null) }));
  const double = prenomEnDouble(classe.eleves, [...reinscrits, ...lignes.map((l) => ({ prenom: l.prenom, nom: l.nom || null }))]);
  if (double) return echec(`Deux ${double} dans la classe : écrivez le nom de l’un des deux, ou son initiale.`);

  // Le nom donné pendant la vérification à un profil qui n'en avait pas est gardé avec lui
  for (const p of profils ?? []) {
    const nom = donnes.get(p.id);
    if (!p.nom && nom) {
      const { error } = await enseignant.supabase.from("eleves").update({ nom }).eq("id", p.id).is("nom", null);
      if (error) return echec("Les élèves n’ont pas pu être inscrits. Réessayez.");
    }
  }

  const depart = classe.eleves.length + connus.length;
  const { data, error } = await enseignant.supabase.rpc("inscrire_eleves", {
    p_classe: classeId,
    p_connus: connus,
    p_nouveaux: lignes.map((l, i) => {
      const id = randomUUID();
      return { id, prenom: l.prenom, nom: l.nom || null, couleur: (depart + i) % 10, code_chiffre: chiffrer(codePropose(tirer), { sorte: "code", id }) };
    }),
  });
  if (error) return echec("Les élèves n’ont pas pu être inscrits. Rien n’a été créé : réessayez.");
  rafraichir(classeId);
  return { ok: true, nombre: typeof data === "number" ? data : connus.length + lignes.length };
}
