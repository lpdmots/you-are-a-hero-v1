import "server-only";
import { notFound } from "next/navigation";
import { enseignantCourant, type Enseignant } from "./adulte";
import { envoyer } from "./courriel";
import { adresseDuSite } from "./env";
import { offreActuelle } from "./offre";
import { clientService } from "./supabase";

/**
 * Les pages d'administration du porteur (F14, F14-AC22 à AC25). Tout commence par
 * `exigerLePorteur` : un autre compte, connecté ou non, reçoit la même réponse qu'une page qui
 * n'existe pas. Les lectures et les gestes passent ensuite par la clé de service.
 */

export async function exigerLePorteur(): Promise<Enseignant> {
  const e = await enseignantCourant();
  if (!e?.createur) notFound();
  return e;
}

export type CompteAdministre = {
  id: string; courriel: string; inscritLe: string; connecteLe: string | null; confirme: boolean;
  etoiles: number; createur: boolean; projets: number; pass: number;
};

/** Le premier instant du mois, heure de Paris. */
function debutDuMois(maintenant = new Date()): string {
  const paris = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(maintenant);
  const [annee, mois] = paris.split("-").map(Number);
  // Minuit à Paris le premier du mois : une heure ou deux avant, en temps universel
  const utc = new Date(Date.UTC(annee, mois - 1, 1));
  const decalage = new Date(utc.toLocaleString("en-US", { timeZone: "Europe/Paris" })).getTime() - new Date(utc.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  return new Date(utc.getTime() - decalage).toISOString();
}

export type Tableau = {
  comptes: CompteAdministre[];
  /** La dépense d'IA du mois, en dollars facturés, et en euros au taux des réglages */
  depenseUsd: number;
  depenseEuros: number;
  appels: number;
  /** Les ventes du mois */
  ventes: { nombre: number; montant: number; pass: number; recharges: number };
  paiementOuvert: boolean;
};

/** Le tableau de l'administration (F14-AC23). */
export async function tableau(): Promise<Tableau> {
  const base = clientService();
  const debut = debutDuMois();
  const [{ data: comptes }, { data: appels }, { data: ventes }, offre, { data: reglages }] = await Promise.all([
    base.rpc("comptes_pour_l_administration"),
    base.from("appels_ia").select("cout_usd").gte("commence_le", debut),
    base.from("paiements").select("achat, montant").gte("recu_le", debut),
    offreActuelle(base),
    base.from("reglages_application").select("euros_par_dollar").single(),
  ]);
  const depenseUsd = (appels ?? []).reduce((t, a) => t + Number(a.cout_usd ?? 0), 0);
  const v = ventes ?? [];
  return {
    comptes: ((comptes ?? []) as Record<string, unknown>[]).map((c) => ({
      id: c.id as string, courriel: c.courriel as string, inscritLe: c.inscrit_le as string, connecteLe: (c.connecte_le as string | null) ?? null,
      confirme: c.confirme === true, etoiles: Number(c.etoiles ?? 0), createur: c.createur === true, projets: Number(c.projets ?? 0), pass: Number(c.pass ?? 0),
    })),
    depenseUsd,
    depenseEuros: depenseUsd * Number(reglages?.euros_par_dollar ?? 0.87),
    appels: (appels ?? []).length,
    ventes: {
      nombre: v.length,
      montant: v.reduce((t, p) => t + Number(p.montant), 0),
      pass: v.filter((p) => p.achat === "pass").length,
      recharges: v.filter((p) => p.achat === "recharge").length,
    },
    paiementOuvert: offre.paiementOuvert,
  };
}

export type FicheDuCompte = {
  compte: CompteAdministre;
  projets: { id: string; titre: string; pass: { le: string; origine: string } | null; partage: { code: string; lien: boolean } | null }[];
  mouvements: { quand: string; nombre: number; motif: string; note: string | null }[];
};

/** Un compte, ses projets, ses partages et l'histoire de ses étoiles. */
export async function ficheDuCompte(id: string): Promise<FicheDuCompte | null> {
  const base = clientService();
  const { data: comptes } = await base.rpc("comptes_pour_l_administration");
  const ligne = ((comptes ?? []) as Record<string, unknown>[]).find((c) => c.id === id);
  if (!ligne) return null;
  const [{ data: projets }, { data: passes }, { data: partages }, { data: mouvements }] = await Promise.all([
    base.from("projets").select("id, titre").eq("enseignant_id", id).order("cree_le"),
    base.from("passes").select("projet_id, obtenu_le, origine").eq("enseignant_id", id),
    base.from("partages").select("projet_id, code, par_lien, version").eq("enseignant_id", id),
    base.from("mouvements_etoiles").select("quand, nombre, motif, note").eq("enseignant_id", id).order("quand", { ascending: false }).limit(100),
  ]);
  return {
    compte: {
      id, courriel: ligne.courriel as string, inscritLe: ligne.inscrit_le as string, connecteLe: (ligne.connecte_le as string | null) ?? null,
      confirme: ligne.confirme === true, etoiles: Number(ligne.etoiles ?? 0), createur: ligne.createur === true, projets: Number(ligne.projets ?? 0), pass: Number(ligne.pass ?? 0),
    },
    projets: (projets ?? []).map((p) => {
      const pass = (passes ?? []).find((x) => x.projet_id === p.id);
      const partage = (partages ?? []).find((x) => x.projet_id === p.id && x.version);
      return {
        id: p.id as string, titre: p.titre as string,
        pass: pass ? { le: pass.obtenu_le as string, origine: pass.origine as string } : null,
        partage: partage ? { code: partage.code as string, lien: partage.par_lien === true } : null,
      };
    }),
    mouvements: (mouvements ?? []).map((m) => ({ quand: m.quand as string, nombre: m.nombre as number, motif: m.motif as string, note: (m.note as string | null) ?? null })),
  };
}

/** Offrir des étoiles à un compte (F14-AC24) : un mouvement « cadeau », daté, comme les autres. */
export async function offrirDesEtoiles(id: string, nombre: number, note: string): Promise<boolean> {
  if (!Number.isInteger(nombre) || nombre < 1 || nombre > 10000) return false;
  const { error } = await clientService().from("mouvements_etoiles").insert({ enseignant_id: id, nombre, motif: "cadeau", note: note.trim().slice(0, 200) || null });
  return !error;
}

/** Offrir le pass d'un projet (F14-AC24) : inscrit « cadeau », avec ses étoiles. */
export async function offrirUnPass(projetId: string): Promise<boolean> {
  const { data, error } = await clientService().rpc("donner_le_pass", { p_projet: projetId, p_origine: "cadeau" });
  return !error && data === true;
}

/** Le code d'un lien de lecture, depuis le lien collé tel quel ou le seul code. */
export function codeDuLien(texte: string): string | null {
  const m = texte.trim().toLowerCase().match(/(?:\/lire\/)?([abcdefghjkmnpqrstuvwxyz23456789]{10})\/?(?:[?#].*)?$/);
  return m ? m[1] : null;
}

async function titreDuProjet(id: string): Promise<string> {
  const { data } = await clientService().from("projets").select("titre").eq("id", id).maybeSingle();
  return (data?.titre as string | undefined) ?? "Livre";
}

export type PartageTrouve = { projetId: string; titre: string; code: string; enseignantId: string; courriel: string | null };

/** Le livre derrière un lien signalé, s'il est encore partagé. */
export async function partageDuLien(texte: string): Promise<PartageTrouve | null> {
  const code = codeDuLien(texte);
  if (!code) return null;
  const base = clientService();
  const { data } = await base.from("partages").select("projet_id, code, enseignant_id, version").eq("code", code).maybeSingle();
  if (!data?.version) return null;
  const [{ data: compte }, titre] = await Promise.all([base.auth.admin.getUserById(data.enseignant_id as string), titreDuProjet(data.projet_id as string)]);
  return { projetId: data.projet_id as string, code, enseignantId: data.enseignant_id as string, titre, courriel: compte.user?.email ?? null };
}

/**
 * Retirer un partage signalé (F14-AC25) : les deux canaux se coupent et la version s'efface, le
 * lien mène à la page neutre ; le projet ne change pas ; l'adulte en est averti par courriel ; le
 * geste reste inscrit.
 */
export async function retirerLePartage(projetId: string): Promise<{ ok: boolean; courriel: boolean }> {
  const base = clientService();
  const { data: partage } = await base.from("partages").select("code, enseignant_id, version").eq("projet_id", projetId).maybeSingle();
  if (!partage?.version) return { ok: false, courriel: false };
  const { error } = await base.from("partages").update({ version: null, par_lien: false, aux_classes: false, modifie_le: new Date().toISOString() }).eq("projet_id", projetId);
  if (error) return { ok: false, courriel: false };
  const titre = await titreDuProjet(projetId);
  await base.from("partages_retires").insert({ projet_id: projetId, enseignant_id: partage.enseignant_id, titre: titre.slice(0, 200), code: partage.code });
  const { data: compte } = await base.auth.admin.getUserById(partage.enseignant_id as string);
  const courriel = compte.user?.email
    ? await envoyer({
        a: compte.user.email,
        sujet: `Votre livre « ${titre} » n’est plus partagé — Il était une classe`,
        texte: [
          "Bonjour,",
          "",
          `Le livre « ${titre} » a été signalé, et son partage est retiré : son lien de lecture ne mène plus au livre, et vos classes ne le lisent plus.`,
          "Votre projet n'a pas changé : rien n'est effacé.",
          "",
          `Pour en savoir plus, répondez à ${process.env.COURRIEL_CONTACT ?? "contact@iletaituneclasse.com"}.`,
          "",
          `Il était une classe — ${adresseDuSite()}`,
        ].join("\n"),
      })
    : false;
  return { ok: true, courriel };
}

/** « Paiement ouvert » : l'interrupteur des limites et de la vente (F14). */
export async function reglerLePaiement(ouvert: boolean): Promise<boolean> {
  const { error } = await clientService().from("reglages_application").update({ paiement_ouvert: ouvert }).eq("id", true);
  return !error;
}
