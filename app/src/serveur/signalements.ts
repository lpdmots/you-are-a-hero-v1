import "server-only";
import { headers } from "next/headers";
import { envoyer } from "./courriel";
import { adresseDuSite, env } from "./env";
import { empreinte } from "./jetons";
import { estUuid } from "./recit";
import { clientService } from "./supabase";
import { ADRESSE_VALIDE } from "@/domaine/bibliotheque";
import { EDITEUR } from "@/domaine/textes-publics";

/**
 * Signaler un livre de la bibliothèque (F15, « Signaler » ; F15-AC14), et le retirer depuis
 * l'administration (F15-AC10). Le signalement se garde jusqu'à la décision du porteur, qui en
 * reçoit un courriel ; l'expéditeur, un accusé de réception. Le livre reste publié : rien ne le
 * masque d'office, ce que n'importe qui pourrait déclencher contre une classe.
 */

export const MOTIFS_DE_SIGNALEMENT = {
  age: "Inadapté à l’âge des lecteurs",
  haine: "Haine ou insultes",
  "vie-privee": "Vie privée",
  droits: "Droits d’auteur",
  autre: "Autre",
} as const;
export type MotifDeSignalement = keyof typeof MOTIFS_DE_SIGNALEMENT;
const estMotif = (m: unknown): m is MotifDeSignalement => typeof m === "string" && Object.hasOwn(MOTIFS_DE_SIGNALEMENT, m);

/** Une même adresse réseau ne signale pas plus de cinq fois dans l'heure : le formulaire n'est pas un canon à courriels. */
const SIGNALEMENTS_PAR_HEURE = 5;
const COURRIEL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ResultatSignalement = { ok: true } | { ok: false; erreur: string };

const contact = () => process.env.COURRIEL_CONTACT ?? EDITEUR.contact;

export async function signaler(adresse: string, demande: { motif: unknown; passage: unknown; message: unknown; courriel: unknown }): Promise<ResultatSignalement> {
  if (!ADRESSE_VALIDE.test(adresse)) return { ok: false, erreur: "Ce livre n’est plus dans la bibliothèque." };
  if (!estMotif(demande.motif)) return { ok: false, erreur: "Choisissez un motif." };
  const message = typeof demande.message === "string" ? demande.message.replace(/[ \t]+/g, " ").trim().slice(0, 2000) : "";
  if (!message) return { ok: false, erreur: "Dites en quelques mots ce qui pose problème." };
  const courriel = typeof demande.courriel === "string" ? demande.courriel.trim().slice(0, 254) : "";
  if (!COURRIEL.test(courriel)) return { ok: false, erreur: "Écrivez une adresse électronique, pour que l’éditeur puisse vous répondre." };
  const passage = typeof demande.passage === "string" && /^\d{1,4}$/.test(demande.passage.trim()) ? Number(demande.passage.trim()) : null;

  const base = clientService();
  const { data: livre } = await base.from("publications").select("projet_id, titre:version->>titre").eq("adresse", adresse).not("version", "is", null).maybeSingle();
  if (!livre) return { ok: false, erreur: "Ce livre n’est plus dans la bibliothèque." };
  const titre = (livre as unknown as { titre: string | null }).titre ?? "Sans titre";

  const entetes = await headers();
  const ip = (entetes.get("x-forwarded-for") ?? "").split(",")[0].trim() || entetes.get("x-real-ip") || "inconnue";
  const reseau = `r:${empreinte(`${ip}|signaler|${env.cleAcces}`)}`;
  const { count } = await base.from("signalements").select("id", { count: "exact", head: true }).eq("reseau", reseau).gte("recu_le", new Date(Date.now() - 3_600_000).toISOString());
  if ((count ?? 0) >= SIGNALEMENTS_PAR_HEURE) return { ok: false, erreur: `Trop de signalements depuis cette connexion. Écrivez à ${contact()}.` };

  const { error } = await base.from("signalements").insert({ projet_id: livre.projet_id, adresse, motif: demande.motif, passage, message, courriel, reseau });
  if (error) return { ok: false, erreur: "Le signalement n’a pas pu être envoyé. Réessayez dans un moment." };

  const lien = `${adresseDuSite()}/bibliotheque/${adresse}`;
  await Promise.all([
    envoyer({
      a: courriel,
      sujet: "Votre signalement est reçu — Il était une classe",
      texte: [
        "Bonjour,",
        "",
        `Votre signalement du livre « ${titre} » (${MOTIFS_DE_SIGNALEMENT[demande.motif]}) est bien reçu. L’équipe d’Il était une classe le lit et décide s’il faut retirer le livre ; elle peut vous écrire à cette adresse. La classe ou l’auteur du livre ne reçoit pas votre signalement.`,
        "",
        `Le livre : ${lien}`,
        "",
        `Il était une classe — ${adresseDuSite()}`,
      ].join("\n"),
    }),
    envoyer({
      a: contact(),
      sujet: `Signalement : « ${titre} » — ${MOTIFS_DE_SIGNALEMENT[demande.motif]}`,
      texte: [
        `Livre : « ${titre} », ${lien}`,
        `Motif : ${MOTIFS_DE_SIGNALEMENT[demande.motif]}${passage ? `, passage ${passage}` : ""}`,
        `De : ${courriel}`,
        "",
        message,
        "",
        `À décider dans l’administration : ${adresseDuSite()}/admin/livres`,
      ].join("\n"),
    }),
  ]);
  return { ok: true };
}

// ——— Dans l'administration ———

export type Signalement = {
  id: string; projetId: string; adresse: string; titre: string; publie: boolean;
  motif: MotifDeSignalement; passage: number | null; message: string; courriel: string; recuLe: string;
};

/** Les signalements qui attendent la décision du porteur, le plus ancien d'abord. */
export async function signalementsATraiter(): Promise<Signalement[]> {
  const base = clientService();
  const { data, error } = await base.from("signalements").select("id, projet_id, adresse, motif, passage, message, courriel, recu_le").is("traite_le", null).order("recu_le");
  if (error) throw new Error(`Signalements illisibles : ${error.message}`);
  const projets = [...new Set((data ?? []).map((s) => s.projet_id as string))];
  const { data: livres } = projets.length
    ? await base.from("publications").select("projet_id, titre:version->>titre").in("projet_id", projets)
    : { data: [] };
  const titreDe = new Map(((livres ?? []) as unknown as { projet_id: string; titre: string | null }[]).map((l) => [l.projet_id, l.titre]));
  return (data ?? []).map((s) => {
    const titre = titreDe.get(s.projet_id as string) ?? null;
    return {
      id: s.id as string, projetId: s.projet_id as string, adresse: s.adresse as string, titre: titre ?? "Livre retiré", publie: Boolean(titre),
      motif: s.motif as MotifDeSignalement, passage: (s.passage as number | null) ?? null, message: s.message as string, courriel: s.courriel as string, recuLe: s.recu_le as string,
    };
  });
}

export async function nombreDeSignalements(): Promise<number> {
  const { count } = await clientService().from("signalements").select("id", { count: "exact", head: true }).is("traite_le", null);
  return count ?? 0;
}

/** « Classer » : le livre reste publié, le signalement est traité. */
export async function classerLeSignalement(id: string): Promise<boolean> {
  if (!estUuid(id)) return false;
  const { error } = await clientService().from("signalements").update({ traite_le: new Date().toISOString(), decision: "classe" }).eq("id", id).is("traite_le", null);
  return !error;
}

/**
 * Le porteur retire un livre de la bibliothèque (F15-AC10), signalé ou non : la version publiée
 * s'efface, l'adresse et les cœurs restent ; l'adulte reçoit le motif par courriel et le lit dans
 * l'étape ; son projet ne change pas. Les signalements du livre sont traités du même geste.
 */
export async function retirerParLePorteur(projetId: string, motif: string): Promise<{ ok: boolean; courriel: boolean }> {
  const texte = motif.replace(/[ \t]+/g, " ").trim().slice(0, 2000);
  if (!estUuid(projetId) || !texte) return { ok: false, courriel: false };
  const base = clientService();
  const { data: l } = await base.from("publications").select("enseignant_id, version").eq("projet_id", projetId).maybeSingle();
  if (!l?.version) return { ok: false, courriel: false };
  const titre = (l.version as { titre?: string }).titre ?? "Sans titre";
  const maintenant = new Date().toISOString();
  const { error } = await base
    .from("publications")
    .update({
      version: null, presentation: null, age: null, empreinte: null,
      proposee: null, presentation_proposee: null, age_propose: null, empreinte_proposee: null, proposee_le: null, attestation: null,
      rapport: null, rapport_etat: null, rapport_le: null, rapport_cout_usd: null, refus_motif: null, refusee_le: null,
      retiree_le: maintenant, retrait_par: "porteur", retrait_motif: texte, modifie_le: maintenant,
    })
    .eq("projet_id", projetId);
  if (error) return { ok: false, courriel: false };
  await base.from("signalements").update({ traite_le: maintenant, decision: "retire" }).eq("projet_id", projetId).is("traite_le", null);
  const { data: compte } = await base.auth.admin.getUserById(l.enseignant_id as string);
  const courriel = compte.user?.email
    ? await envoyer({
        a: compte.user.email,
        sujet: `« ${titre} » n’est plus dans la bibliothèque — Il était une classe`,
        texte: [
          "Bonjour,",
          "",
          `L’éditeur du site a retiré « ${titre} » de la bibliothèque.`,
          "",
          "Le motif :",
          texte,
          "",
          "Votre projet n’a pas changé : rien n’est effacé. Vous pouvez corriger le livre, puis le proposer de nouveau depuis « Imprimer et partager ».",
          "",
          `Pour en savoir plus, répondez à ${contact()}.`,
          "",
          `Il était une classe — ${adresseDuSite()}`,
        ].join("\n"),
      })
    : false;
  return { ok: true, courriel };
}

export type LivrePublieAdministre = { projetId: string; adresse: string; titre: string; courriel: string | null; publieLe: string; coeurs: number };

/** Les livres de la bibliothèque, pour que le porteur puisse en retirer un sans signalement (F15-AC10). */
export async function livresPubliesPourLePorteur(): Promise<LivrePublieAdministre[]> {
  const base = clientService();
  const { data } = await base.from("publications").select("projet_id, enseignant_id, adresse, titre:version->>titre, publiee_le, coeurs").not("version", "is", null).order("publiee_le", { ascending: false }).limit(500);
  return Promise.all(((data ?? []) as unknown as { projet_id: string; enseignant_id: string; adresse: string; titre: string | null; publiee_le: string; coeurs: number }[]).map(async (l) => ({
    projetId: l.projet_id, adresse: l.adresse, titre: l.titre ?? "Sans titre", publieLe: l.publiee_le, coeurs: l.coeurs ?? 0,
    courriel: (await base.auth.admin.getUserById(l.enseignant_id)).data.user?.email ?? null,
  })));
}
