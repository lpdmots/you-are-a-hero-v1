import "server-only";
import { randomUUID } from "node:crypto";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { peutCreerSonImage, promptDeLObjet, promptDuPortrait } from "@/domaine/illustration";
import type { Enseignant } from "./adulte";
import { carnetDe, type Histoire } from "./ia/aides/contexte";
import { ficheVisuelle, personnages as aidePersonnages, type PersonnageConnu } from "./ia/aides/images";
import { demanderDesImages, demanderUneAide } from "./ia/demander";
import { lireImage, SEAU } from "./images";
import { projetDe, type Projet } from "./lectures";
import { estUuid, preparationDe } from "./recit";
import { clientService } from "./supabase";

/**
 * Les aides des personnages et des objets de l'histoire (F10.2), côté serveur : repérer les
 * personnages, préciser une fiche visuelle, créer un portrait ou une image de référence. Le
 * serveur relit lui-même la Préparation et la carte ; rien de ce qui part ne vient du navigateur.
 * Ne partent que la Préparation, la carte et le style : jamais un prénom d'élève, une classe ni
 * le nom de l'adulte (F13, ce qui est transmis).
 *
 * Les images créées ne sont pas encore des images du projet : elles attendent dans le stockage,
 * sous `propositions/`, que l'adulte en garde une ; la page la dépose alors comme une image
 * importée, et les autres sont effacées (F10.1 : une image écartée n'est pas conservée).
 */

export type SorteDeCarte = "personnage" | "objet";
export const estSorteDeCarte = (v: unknown): v is SorteDeCarte => v === "personnage" || v === "objet";

const INTROUVABLE = "Cette carte n’existe plus.";
/** Sans fiche visuelle, l'image de référence ne se crée pas : la page le dit sous le bouton éteint */
export const SANS_FICHE = "Décrivez d’abord son apparence.";
const histoireDe = (e: Enseignant, p: Projet): Histoire => ({
  titre: p.titre, mode: p.organisation, recit: p.recit, niveaux: p.organisation === "classe" ? e.reglagesIa.niveaux : [],
});

export type ReponseReperage = { ok: true; personnages: PersonnageConnu[]; reste: string | null } | { ok: false; message: string };

/**
 * « ✦ Repérer les personnages » (F10.2) : des cartes proposées d'après ce que la Préparation
 * retient, sans rien créer d'office ; une carte déjà là, sous son nom ou un autre, n'est pas
 * reproposée.
 */
export async function repererLesPersonnages(e: Enseignant, projetId: string): Promise<ReponseReperage> {
  if (!estUuid(projetId)) return { ok: false, message: "Ce projet n’existe plus." };
  const [projet, preparation] = await Promise.all([projetDe(e, projetId), preparationDe(e, projetId)]);
  if (!projet || !preparation) return { ok: false, message: "Ce projet n’existe plus." };
  const carnet = carnetDe(preparation);
  const idees = preparation.pistes.filter((p) => p.rubrique === "personnages" && p.etat === "retenue").map((p) => p.texte);
  // Le texte retenu de chaque héros nomme souvent ceux qu'il croise (18 octobre 2026)
  const herosDecrits = preparation.personnagesDeLHistoire.some((p) => p.heros && p.description.trim());
  if (!carnet.personnages?.trim() && !idees.length && !herosDecrits) {
    return { ok: false, message: "Écrivez d’abord dans « Nous retenons » d’un héros qui il croise, ou retenez des idées." };
  }
  const connus = preparation.personnagesDeLHistoire.map((p) => ({ nom: p.nom, autresNoms: p.autresNoms, description: p.description, heros: p.heros }));
  const r = await demanderUneAide(e, aidePersonnages, { histoire: histoireDe(e, projet), carnet, idees, connus });
  if (!r.ok) return { ok: false, message: r.message };
  if (!r.valeur.personnages.length) return { ok: false, message: "L’IA n’a pas trouvé d’autre personnage dans ce que vous retenez." };
  return { ok: true, personnages: r.valeur.personnages, reste: r.reste };
}

type Carte = { projetId: string; nom: string; description: string; fiche: string };

async function lireLaCarte(e: Enseignant, sorte: SorteDeCarte, id: string): Promise<Carte | null> {
  if (!estUuid(id)) return null;
  const { data } = await e.supabase
    .from(sorte === "personnage" ? "personnages" : "objets")
    .select("projet_id, nom, description, fiche")
    .eq("id", id)
    .maybeSingle();
  return data ? { projetId: data.projet_id as string, nom: data.nom as string, description: data.description as string, fiche: data.fiche as string } : null;
}

export type ReponseFiche = { ok: true; fiche: string; reste: string | null } | { ok: false; message: string };

/**
 * « ✦ Préciser pour les images » (F10.2) : la fiche visuelle d'après la description de la carte
 * (la page l'enregistre d'abord), l'univers et, pour un personnage, ce que la Préparation en
 * retient ; une fiche déjà écrite se précise plutôt qu'elle ne se refait.
 */
export async function preciserLaFiche(e: Enseignant, sorte: SorteDeCarte, id: string): Promise<ReponseFiche> {
  const carte = await lireLaCarte(e, sorte, id);
  if (!carte) return { ok: false, message: INTROUVABLE };
  if (!carte.description.trim() && !carte.fiche.trim()) {
    return { ok: false, message: sorte === "personnage" ? "Décrivez d’abord le personnage en quelques mots." : "Décrivez d’abord l’objet en quelques mots." };
  }
  const [projet, preparation] = await Promise.all([projetDe(e, carte.projetId), preparationDe(e, carte.projetId)]);
  if (!projet) return { ok: false, message: INTROUVABLE };
  const r = await demanderUneAide(e, ficheVisuelle, {
    histoire: histoireDe(e, projet),
    sorte,
    nom: carte.nom,
    description: carte.description,
    univers: preparation?.univers.trim() || undefined,
    retenu: sorte === "personnage" ? preparation?.personnages.trim() || undefined : undefined,
    ficheActuelle: carte.fiche.trim() || undefined,
  });
  return r.ok ? { ok: true, fiche: r.valeur.fiche, reste: r.reste } : { ok: false, message: r.message };
}

export const cheminProposition = (enseignantId: string, projetId: string, id: string): string => `${enseignantId}/${projetId}/propositions/${id}.jpg`;
const dossierDesPropositions = (enseignantId: string, projetId: string): string => `${enseignantId}/${projetId}/propositions`;
/** Une proposition laissée sans réponse (page fermée) s'efface à la création suivante, passé un jour. */
const DUREE_D_UNE_PROPOSITION_MS = 24 * 3600 * 1000;

async function effacerLesAnciennes(enseignantId: string, projetId: string): Promise<void> {
  const stockage = clientService().storage.from(SEAU);
  const { data } = await stockage.list(dossierDesPropositions(enseignantId, projetId), { limit: 100 });
  const limite = Date.now() - DUREE_D_UNE_PROPOSITION_MS;
  const anciennes = (data ?? []).filter((f) => f.created_at && Date.parse(f.created_at) < limite).map((f) => `${dossierDesPropositions(enseignantId, projetId)}/${f.name}`);
  if (anciennes.length) await stockage.remove(anciennes);
}

export type ReponseReferences = { ok: true; propositions: string[]; reste: string | null } | { ok: false; message: string };

/**
 * « Créer son portrait » (F10.2), ou l'image de référence d'un objet : une ou deux images selon
 * « Images par création », en qualité normale sous « Automatique » (F10-AC37), dans le style du
 * projet, d'après la fiche visuelle reprise mot pour mot, sans laquelle rien ne part. Les images
 * attendent dans le stockage ; la page les montre par `/images/proposition/…`.
 */
export async function creerLesReferences(e: Enseignant, sorte: SorteDeCarte, id: string): Promise<ReponseReferences> {
  const carte = await lireLaCarte(e, sorte, id);
  if (!carte) return { ok: false, message: INTROUVABLE };
  if (!peutCreerSonImage(carte)) {
    return { ok: false, message: SANS_FICHE };
  }
  const projet = await projetDe(e, carte.projetId);
  if (!projet) return { ok: false, message: INTROUVABLE };
  const style = { style: projet.styleImages, autre: projet.styleAutre };
  const r = await demanderDesImages(e, {
    aide: sorte === "personnage" ? "portrait" : "image-objet",
    usage: sorte === "personnage" ? "portrait" : "objet",
    prompt: sorte === "personnage" ? promptDuPortrait(carte, style) : promptDeLObjet(carte, style),
  });
  if (!r.ok) return { ok: false, message: r.message };

  const stockage = clientService().storage.from(SEAU);
  await effacerLesAnciennes(e.id, carte.projetId).catch(() => undefined);
  const propositions: string[] = [];
  for (const octets of r.images) {
    if (!lireImage(octets)) continue;
    const nouvelle = randomUUID();
    const { error } = await stockage.upload(cheminProposition(e.id, carte.projetId, nouvelle), octets, { contentType: "image/jpeg", upsert: false });
    if (!error) propositions.push(nouvelle);
  }
  if (!propositions.length) return { ok: false, message: MESSAGES_IA.pasDImage };
  return { ok: true, propositions, reste: r.reste };
}

/** Efface les propositions écartées ; celles d'un autre adulte ou d'un autre projet ne se nomment pas. */
export async function jeterLesPropositions(e: Enseignant, projetId: string, ids: readonly string[]): Promise<void> {
  const propres = ids.filter(estUuid).slice(0, 4);
  if (!estUuid(projetId) || !propres.length) return;
  await clientService().storage.from(SEAU).remove(propres.map((i) => cheminProposition(e.id, projetId, i)));
}
