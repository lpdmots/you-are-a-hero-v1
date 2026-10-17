import "server-only";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { paragraphesACorriger } from "@/domaine/correction";
import { ciblesDe, estChoix } from "@/domaine/copie";
import { referenceScene } from "@/domaine/recit";
import type { Enseignant } from "./adulte";
import { lieuDeLaScene } from "./aides-de-la-scene";
import { texteDeScene } from "./copie";
import { ideesChoix as aideIdees } from "./ia/aides/idees-choix";
import { demanderUneAide } from "./ia/demander";
import { estUuid, preparationDe } from "./recit";

/**
 * Les idées de choix (F13.3), côté serveur. Comme pour les autres aides de la scène, le serveur
 * relit lui-même ce qui part : la consigne, le texte enregistré (la page l'enregistre d'abord),
 * le résumé du chapitre, les titres et consignes de ses scènes, les objets de l'histoire, la
 * Préparation. Jamais un prénom d'élève, une remarque ni le nom de l'adulte (F13, ce qui est
 * transmis). Rien n'est écrit ici : la demande seule ne change pas le projet (F13-AC08) ; les
 * choix s'ajoutent dans la copie, et les scènes par `creerSceneDepuisChoix`, comme un choix
 * créé à la main.
 */

/** Le texte de la scène qui part : sa fin d'abord, là où se décident les choix. */
export const TEXTE_ENVOYE = 6000;
/** Ce que la page peut redire de ce qu'elle a déjà montré, et de l'orientation. */
export const DEJA_MONTREES_MAX = 40;
export const ORIENTATION_MAX = 600;

export type IdeeProposee = {
  libelle: string;
  intention: string;
  destination: { sorte: "nouvelle"; titre: string } | { sorte: "existante"; sceneId: string };
};

export type ReponseIdees = { ok: true; idees: IdeeProposee[]; reste: string | null } | { ok: false; message: string };

export const SANS_DE_QUOI_PROPOSER = "Écrivez d’abord une consigne ou le début du texte.";
export const PAS_DE_CHOIX = "Ce récit se lit du début à la fin : il n’a pas de choix.";

/** La fin d'un texte, en paragraphes entiers, `max` lettres environ. */
export function finPourLesIdees(paragraphes: string[], max = TEXTE_ENVOYE): string[] {
  const pris: string[] = [];
  let longueur = 0;
  for (const p of [...paragraphes].reverse()) {
    const t = p.trim();
    if (!t) continue;
    if (longueur + t.length > max) {
      if (!pris.length) pris.push(`…${t.slice(-max).replace(/^\S*\s+/, "")}`);
      break;
    }
    pris.push(t);
    longueur += t.length;
  }
  return pris.reverse();
}

/** Ce que la page envoie, relu sans confiance : des libellés courts, en nombre borné. */
export function lireDejaMontrees(brut: unknown): string[] {
  if (!Array.isArray(brut)) return [];
  return brut
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.replace(/\s+/g, " ").trim().slice(0, 120))
    .filter(Boolean)
    .slice(-DEJA_MONTREES_MAX);
}
export const lireOrientation = (brut: unknown): string | undefined =>
  typeof brut === "string" ? brut.replace(/\s+/g, " ").trim().slice(0, ORIENTATION_MAX) || undefined : undefined;

/**
 * « ✦ Idées de choix » (F13.3) : dix idées en une demande, rangées par pertinence. Une destination
 * existante est une scène du chapitre ; celle où la scène mène déjà n'est pas reproposée.
 */
export async function demanderDesIdees(
  e: Enseignant,
  sceneId: string,
  options: { orientation?: unknown; dejaMontrees?: unknown } = {},
): Promise<ReponseIdees> {
  if (!estUuid(sceneId)) return { ok: false, message: "Cette scène n’existe plus." };
  const [lieu, texte, chapitre] = await Promise.all([
    lieuDeLaScene(e, sceneId),
    texteDeScene(e, sceneId),
    e.supabase.from("scenes").select("chapitre_id").eq("id", sceneId).maybeSingle(),
  ]);
  if (!lieu || !texte || !chapitre.data) return { ok: false, message: "Cette scène n’existe plus." };
  if (lieu.recit !== "choix") return { ok: false, message: PAS_DE_CHOIX };
  const paragraphes = finPourLesIdees(paragraphesACorriger(texte.texte).map((p) => p.texte));
  const consigne = lieu.scene.consigne?.slice(0, 1500) ?? null;
  if (!consigne && !paragraphes.length) return { ok: false, message: SANS_DE_QUOI_PROPOSER };

  const [preparation, scenes] = await Promise.all([
    preparationDe(e, lieu.projetId),
    e.supabase.from("scenes").select("id, reference, titre, consigne").eq("chapitre_id", chapitre.data.chapitre_id as string).is("supprime_le", null).order("rang"),
  ]);
  const deja = new Set(ciblesDe(texte.texte));
  const autres = ((scenes.data ?? []) as { id: string; reference: number; titre: string | null; consigne: string | null }[])
    .filter((s) => s.id !== sceneId)
    .slice(0, 60);
  const parRef = new Map(autres.map((s) => [referenceScene(s.reference), s.id]));

  const r = await demanderUneAide(e, aideIdees, {
    histoire: lieu.histoire,
    carnet: preparation ? { univers: preparation.univers, personnages: preparation.personnages, enjeu: preparation.enjeu } : undefined,
    chapitre: { titre: lieu.chapitre.titre, resume: lieu.chapitre.resume ?? undefined },
    scene: { titre: lieu.scene.titre ?? "Sans titre", consigne, paragraphes },
    scenes: autres.map((s) => ({ ref: referenceScene(s.reference), titre: s.titre?.trim() || "Sans titre", consigne: s.consigne?.trim().slice(0, 300) || undefined })),
    objets: (preparation?.objets ?? []).map((o) => o.nom.trim()).filter(Boolean).slice(0, 40),
    choixExistants: texte.texte.filter(estChoix).map((b) => b.libelle.trim()).filter(Boolean),
    dejaMontrees: lireDejaMontrees(options.dejaMontrees),
    orientation: lireOrientation(options.orientation),
  });
  if (!r.ok) return { ok: false, message: r.message };
  const idees = r.valeur.idees.flatMap((i): IdeeProposee[] => {
    if (i.destination.sorte === "nouvelle") return [{ libelle: i.libelle, intention: i.intention, destination: i.destination }];
    const id = parRef.get(i.destination.ref);
    return id && !deja.has(id) ? [{ libelle: i.libelle, intention: i.intention, destination: { sorte: "existante", sceneId: id } }] : [];
  });
  return idees.length ? { ok: true, idees, reste: r.reste } : { ok: false, message: MESSAGES_IA.pasDeReponse };
}
