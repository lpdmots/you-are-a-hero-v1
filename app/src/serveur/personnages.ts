import "server-only";
import { randomUUID } from "node:crypto";
import { peutCreerSonImage, promptDeLObjet, promptDuPortrait } from "@/domaine/illustration";
import type { Enseignant } from "./adulte";
import { carnetDe, histoireDuProjet, type Histoire } from "./ia/aides/contexte";
import { ficheVisuelle, personnages as aidePersonnages, type PersonnageConnu } from "./ia/aides/images";
import { demanderUneAide } from "./ia/demander";
import { lireImage, SEAU, TYPE_MIME } from "./images";
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
 * Le portrait et l'image de référence passent par les demandes d'images (`images-creees.ts`,
 * 19 octobre 2026) : la première se pose d'office, la seconde attend dans le stockage, sous
 * `propositions/`, que l'adulte la mette à la place ou la laisse (F10.1 : une image écartée n'est
 * pas conservée).
 */

export type SorteDeCarte = "personnage" | "objet";
export const estSorteDeCarte = (v: unknown): v is SorteDeCarte => v === "personnage" || v === "objet";

const INTROUVABLE = "Cette carte n’existe plus.";
/** Sans fiche visuelle, l'image de référence ne se crée pas : la page le dit sous le bouton éteint */
export const SANS_FICHE = "Décrivez d’abord son apparence.";
const histoireDe = (e: Enseignant, p: Projet): Histoire => histoireDuProjet(p, e.reglagesIa.niveaux);

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
  const [{ data }, { data: attendues }] = await Promise.all([
    stockage.list(dossierDesPropositions(enseignantId, projetId), { limit: 100 }),
    // Les images d'une demande prête attendent qu'on revienne les poser : elles ne s'effacent pas
    clientService().from("demandes_d_images").select("propositions").eq("projet_id", projetId).in("etat", ["en_route", "prete"]),
  ]);
  const gardees = new Set(((attendues ?? []) as { propositions: string[] | null }[]).flatMap((d) => d.propositions ?? []).map((p) => `${p}.jpg`));
  const limite = Date.now() - DUREE_D_UNE_PROPOSITION_MS;
  const anciennes = (data ?? [])
    .filter((f) => f.created_at && Date.parse(f.created_at) < limite && !gardees.has(f.name))
    .map((f) => `${dossierDesPropositions(enseignantId, projetId)}/${f.name}`);
  if (anciennes.length) await stockage.remove(anciennes);
}

/**
 * Ce que « Créer son portrait » (F10.2), ou l'image de référence d'un objet, envoie : le prompt
 * dans le style du projet, d'après la fiche visuelle reprise mot pour mot, sans laquelle rien ne
 * part. La demande elle-même passe par les demandes d'images (`demanderLaReference`).
 */
export async function promptDeLaReference(e: Enseignant, sorte: SorteDeCarte, id: string): Promise<{ ok: true; projetId: string; prompt: string } | { ok: false; message: string }> {
  const carte = await lireLaCarte(e, sorte, id);
  if (!carte) return { ok: false, message: INTROUVABLE };
  if (!peutCreerSonImage(carte)) return { ok: false, message: SANS_FICHE };
  const projet = await projetDe(e, carte.projetId);
  if (!projet) return { ok: false, message: INTROUVABLE };
  const style = { style: projet.styleImages, autre: projet.styleAutre };
  return { ok: true, projetId: carte.projetId, prompt: sorte === "personnage" ? promptDuPortrait(carte, style) : promptDeLObjet(carte, style) };
}

/**
 * Les images créées attendent dans le stockage que l'adulte en garde une (F10.1 : une image écartée
 * n'est pas conservée) ; celles d'une page fermée s'effacent passé un jour, à la création suivante.
 * Rend les identités des propositions déposées.
 */
export async function deposerLesPropositions(enseignantId: string, projetId: string, images: readonly Uint8Array[]): Promise<string[]> {
  const stockage = clientService().storage.from(SEAU);
  await effacerLesAnciennes(enseignantId, projetId).catch(() => undefined);
  const propositions: string[] = [];
  for (const octets of images) {
    const lue = lireImage(octets);
    if (!lue) continue;
    const nouvelle = randomUUID();
    // Une image détourée reste en PNG : le nom garde « .jpg », le type dit le vrai format
    const { error } = await stockage.upload(cheminProposition(enseignantId, projetId, nouvelle), octets, { contentType: TYPE_MIME[lue.format], upsert: false });
    if (!error) propositions.push(nouvelle);
  }
  return propositions;
}

/** Efface les propositions écartées ; celles d'un autre adulte ou d'un autre projet ne se nomment pas. */
export async function jeterLesPropositions(e: Enseignant, projetId: string, ids: readonly string[]): Promise<void> {
  const propres = ids.filter(estUuid).slice(0, 4);
  if (!estUuid(projetId) || !propres.length) return;
  await clientService().storage.from(SEAU).remove(propres.map((i) => cheminProposition(e.id, projetId, i)));
}
