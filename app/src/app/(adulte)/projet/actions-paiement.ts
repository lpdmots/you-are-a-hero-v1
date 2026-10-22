"use server";

import { headers } from "next/headers";
import { EDITEUR } from "@/domaine/textes-publics";
import { adresseRepere } from "@/domaine/visuels";
import { exigerEnseignant } from "@/serveur/adulte";
import { adresseDuSite } from "@/serveur/env";
import { offreActuelle } from "@/serveur/offre";
import { estUuid } from "@/serveur/recit";
import { SEAU } from "@/serveur/images";
import { ouvrirLePaiement, paiementInstalle } from "@/serveur/stripe";
import { clientService } from "@/serveur/supabase";

/**
 * Acheter (F14-AC18, AC19) : le pass d'un projet ou une recharge d'étoiles, par Stripe Checkout.
 * Rien ne se vend « Paiement ouvert » éteint, ni au porteur. Le prix vient des réglages de
 * l'application (F14-AC21). `retour` : la page d'où l'on part, où ramène un abandon (F14-AC20).
 */
type Reponse = { ok: true; adresse: string } | { ok: false; erreur: string };

const FERME = "Les achats ne sont pas ouverts.";
const PAS_OUVERT = "Le paiement n’a pas pu s’ouvrir. Réessayez dans un moment.";

/** Une page de ce site, et rien d'autre : un abandon n'envoie jamais ailleurs. */
const pageDuSite = (chemin: unknown, parDefaut: string): string =>
  typeof chemin === "string" && /^\/(?!\/)[^\s\\]{0,300}$/.test(chemin) ? chemin : parDefaut;

/**
 * L'image du projet sur la page de Stripe, qui doit pouvoir la lire : l'image importée, par un
 * lien du stockage valable un jour (le temps d'une session de paiement), si le stockage est en
 * https ; sinon le visuel de l'application, lu au site public (en local aussi, où Stripe ne
 * voit pas l'ordinateur).
 */
async function imageDuProjet(
  e: Awaited<ReturnType<typeof exigerEnseignant>>,
  projet: { id: string; image_id: string | null; visuel_choisi: string | null; visuel_defaut: string | null },
  site: string,
): Promise<string> {
  if (projet.image_id) {
    const { data: image } = await e.supabase.from("images").select("chemin").eq("id", projet.image_id).maybeSingle();
    const { data: lien } = image ? await clientService().storage.from(SEAU).createSignedUrl(image.chemin, 24 * 3600) : { data: null };
    if (lien?.signedUrl.startsWith("https://")) return lien.signedUrl;
  }
  const visuel = adresseRepere({ imageId: null, visuelChoisi: projet.visuel_choisi, visuelDefaut: projet.visuel_defaut }, projet.id, true);
  return `${site.startsWith("https://") ? site : `https://${EDITEUR.site}`}${visuel}`;
}

export async function acheterLePass(projetId: string, retour?: string): Promise<Reponse> {
  const e = await exigerEnseignant();
  if (!estUuid(projetId)) return { ok: false, erreur: "Projet inconnu." };
  const [offre, { data: projet }, { data: pass }] = await Promise.all([
    offreActuelle(),
    e.supabase.from("projets").select("id, titre, image_id, visuel_choisi, visuel_defaut").eq("id", projetId).maybeSingle(),
    e.supabase.from("passes").select("projet_id").eq("projet_id", projetId).maybeSingle(),
  ]);
  if (!projet) return { ok: false, erreur: "Projet inconnu." };
  if (!offre.paiementOuvert || e.createur || !paiementInstalle()) return { ok: false, erreur: FERME };
  if (pass) return { ok: false, erreur: "Ce livre a déjà son pass." };
  const site = adresseDuSite((await headers()).get("host"));
  const adresse = await ouvrirLePaiement({
    achat: "pass", projetId, enseignantId: e.id, courriel: e.courriel, montant: offre.prixDuPass,
    libelle: `Pass du livre « ${String(projet.titre).slice(0, 120)} »`,
    description: `Scènes et images sans limite pour ce livre, et ${offre.etoilesDuPass} étoiles ✦ pour les aides IA. Payé une fois.`,
    image: await imageDuProjet(e, projet, site),
    merci: `${site}/paiement/merci`,
    abandon: `${site}${pageDuSite(retour, `/projet/${projetId}/plan`)}`,
  });
  return adresse ? { ok: true, adresse } : { ok: false, erreur: PAS_OUVERT };
}

/** La recharge à proposer quand une aide est refusée faute d'étoiles (F14-AC38) ; null si rien ne se vend. */
export async function offreDeRecharge(): Promise<{ prix: number; etoiles: number } | null> {
  const e = await exigerEnseignant();
  const offre = await offreActuelle();
  if (!offre.paiementOuvert || e.createur || !paiementInstalle()) return null;
  return { prix: offre.prixDeLaRecharge, etoiles: offre.etoilesDeLaRecharge };
}

export async function acheterUneRecharge(retour?: string): Promise<Reponse> {
  const e = await exigerEnseignant();
  const offre = await offreActuelle();
  if (!offre.paiementOuvert || e.createur || !paiementInstalle()) return { ok: false, erreur: FERME };
  const site = adresseDuSite((await headers()).get("host"));
  const adresse = await ouvrirLePaiement({
    achat: "recharge", enseignantId: e.id, courriel: e.courriel, montant: offre.prixDeLaRecharge,
    libelle: `Recharge de ${offre.etoilesDeLaRecharge} étoiles pour les aides IA`,
    description: `${offre.etoilesDeLaRecharge} étoiles ✦ ajoutées à votre compte, pour les aides IA de tous vos projets.`,
    merci: `${site}/paiement/merci`,
    abandon: `${site}${pageDuSite(retour, "/projets")}`,
  });
  return adresse ? { ok: true, adresse } : { ok: false, erreur: PAS_OUVERT };
}
