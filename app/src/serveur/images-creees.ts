import "server-only";
import { randomUUID } from "node:crypto";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { paragraphesACorriger } from "@/domaine/correction";
import type { Texte } from "@/domaine/copie";
import {
  REFERENCES_MAX, candidatsDeLImage, estCadrage, nomDuStyle, promptDeCouverture, promptDeLaScene, promptDuReperage, type Cadrage, type Candidat, type Repere, type Retenu, type StyleDuProjet,
} from "@/domaine/illustration";
import { PAGE } from "@/domaine/mise-en-page";
import type { Enseignant } from "./adulte";
import { histoireDuProjet } from "./ia/aides/contexte";
import { descriptionImage } from "./ia/aides/images";
import { demanderDesImages, demanderUneAide } from "./ia/demander";
import { cheminImage, cheminVignette, lireImage, SEAU, type FormatImage } from "./images";
import { projetDe, type Projet } from "./lectures";
import { cheminProposition, deposerLesPropositions, promptDeLaReference, type SorteDeCarte } from "./personnages";
import { estUuid, preparationDe } from "./recit";
import { clientService } from "./supabase";

/**
 * Les images créées du lot 8 de l'étape 8 (F10.1, F10.2, F11.4), côté serveur : l'image de
 * repérage d'après le résumé, celle créée d'office pour une partie ou un chapitre ajouté par l'IA,
 * l'image d'une scène et l'illustration de couverture. Le serveur relit lui-même ce qui part :
 * le résumé, la scène, l'idée et la description que la page vient d'enregistrer, les cartes des
 * badges ; du navigateur ne viennent que le cadrage et les badges choisis. Ne partent jamais un
 * prénom d'élève, une classe ni le nom de l'adulte (F13, ce qui est transmis).
 *
 * Les prompts s'assemblent ici, sans modèle de texte entre la fiche et l'image : la fiche
 * visuelle se reprend mot pour mot, le style et la règle du héros absent aussi.
 */

type Echec = { ok: false; message: string };
const echec = (message: string): Echec => ({ ok: false, message });
const PERDU = "Cet élément n’existe plus.";


const styleDe = (p: Projet): StyleDuProjet => ({ style: p.styleImages, autre: p.styleAutre });

/** Ce que l'image de repérage illustre, relu par le serveur : un titre et un résumé. */
type Sujet = { projetId: string; sorte: Repere; cibleId: string; titre: string; resume: string; univers?: string };

/**
 * Le titre et le résumé d'un chapitre, d'une partie (les résumés de ses chapitres) ou du projet
 * (l'univers et l'enjeu de la Préparation). Sans résumé, rien ne part : l'image se créerait
 * d'après un titre seul, et ne dirait rien du lieu.
 */
async function sujetDe(e: Enseignant, sorte: Repere, id: string): Promise<Sujet | Echec> {
  if (!estUuid(id)) return echec(PERDU);
  if (sorte === "chapitre") {
    const { data } = await e.supabase.from("chapitres").select("projet_id, titre, resume").eq("id", id).is("supprime_le", null).maybeSingle();
    if (!data) return echec(PERDU);
    if (!String(data.resume ?? "").trim()) return echec("Écrivez d’abord le résumé du chapitre.");
    return { projetId: data.projet_id as string, sorte, cibleId: id, titre: data.titre as string, resume: data.resume as string };
  }
  if (sorte === "partie") {
    const [{ data: partie }, { data: chapitres }] = await Promise.all([
      e.supabase.from("parties").select("projet_id, titre").eq("id", id).is("supprime_le", null).maybeSingle(),
      e.supabase.from("chapitres").select("titre, resume").eq("partie_id", id).is("supprime_le", null).order("rang"),
    ]);
    if (!partie) return echec(PERDU);
    const resumes = (chapitres ?? []).filter((c) => String(c.resume ?? "").trim()).map((c) => `${c.titre} : ${String(c.resume).trim()}`);
    if (!resumes.length) return echec("Écrivez d’abord le résumé d’un de ses chapitres.");
    return { projetId: partie.projet_id as string, sorte, cibleId: id, titre: partie.titre as string, resume: resumes.join(" ") };
  }
  const [projet, preparation] = await Promise.all([projetDe(e, id), preparationDe(e, id)]);
  if (!projet || !preparation) return echec(PERDU);
  const resume = [preparation.univers, preparation.enjeu].map((t) => t.trim()).filter(Boolean).join(" ");
  if (!resume) return echec("Écrivez d’abord l’univers de l’histoire, dans la Préparation.");
  return { projetId: id, sorte, cibleId: id, titre: projet.titre, resume };
}

async function promptDuSujet(e: Enseignant, sujet: Sujet): Promise<{ projet: Projet; prompt: string } | Echec> {
  const [projet, preparation] = await Promise.all([projetDe(e, sujet.projetId), sujet.sorte === "projet" ? null : preparationDe(e, sujet.projetId)]);
  if (!projet) return echec(PERDU);
  return { projet, prompt: promptDuReperage({ ...sujet, univers: preparation?.univers }, styleDe(projet)) };
}

// ——— Les demandes d'images : on demande, puis on continue son chemin ———

/** Ce qui reçoit une image : le projet, une partie, un chapitre, une scène, ou la carte d'un personnage ou d'un objet. */
export type Cible = Repere | "scene" | SorteDeCarte;
const TABLE_DE: Record<Repere, "projets" | "parties" | "chapitres"> = { projet: "projets", partie: "parties", chapitre: "chapitres" };
/** La colonne de l'image de référence d'une carte (F10.2) */
const REFERENCE_DE: Record<SorteDeCarte, { table: "personnages" | "objets"; colonne: "portrait_id" | "image_id" }> = {
  personnage: { table: "personnages", colonne: "portrait_id" },
  objet: { table: "objets", colonne: "image_id" },
};

/** Une demande d'image, telle que la page la lit (F10.1, F10.2, reprise du 18 octobre 2026). */
export type DemandeDImage = {
  id: string;
  cible: Cible;
  cibleId: string;
  etat: "en_route" | "prete" | "posee" | "laissee" | "echec";
  /** Les images créées qui attendent encore un choix ; pour une scène, toutes */
  propositions: string[];
  /** L'image posée d'office sur le projet, la partie ou le chapitre, ou gardée parmi les images du projet */
  imagePosee: string | null;
  /** « Vous aviez choisi une autre image… », ou la raison d'un échec */
  message: string | null;
  apresBloc: string | null;
  cadrage: Cadrage | null;
  /** Le sujet seul, sur fond transparent : posé en petit */
  detouree: boolean;
  alt: string;
};

const COLONNES = "id, cible, cible_id, etat, propositions, image_posee, message, apres_bloc, cadrage, detouree, alt";
type Ligne = {
  id: string; cible: Cible; cible_id: string; etat: DemandeDImage["etat"]; propositions: string[] | null; image_posee: string | null; message: string | null;
  apres_bloc: string | null; cadrage: string | null; detouree: boolean | null; alt: string | null;
};
const lireLigne = (l: Ligne): DemandeDImage => ({
  id: l.id, cible: l.cible, cibleId: l.cible_id, etat: l.etat, propositions: l.propositions ?? [], imagePosee: l.image_posee, message: l.message,
  apresBloc: l.apres_bloc, cadrage: estCadrage(l.cadrage) ? l.cadrage : null, detouree: l.detouree === true, alt: l.alt ?? "",
});

/** La demande en route, ou prête, d'un élément : la plus récente. */
export async function demandeDe(e: Enseignant, cible: Cible, cibleId: string): Promise<DemandeDImage | null> {
  if (!estUuid(cibleId)) return null;
  const { data } = await e.supabase
    .from("demandes_d_images")
    .select(COLONNES)
    .eq("cible", cible)
    .eq("cible_id", cibleId)
    .in("etat", ["en_route", "prete"])
    .order("cree_le", { ascending: false })
    .limit(1);
  const l = (data as Ligne[] | null)?.[0];
  return l ? lireLigne(l) : null;
}

/** Une demande, quel que soit son état : la page la suit jusqu'à son arrivée, ou son échec. */
export async function demandeParId(e: Enseignant, id: string): Promise<DemandeDImage | null> {
  if (!estUuid(id)) return null;
  const { data } = await e.supabase.from("demandes_d_images").select(COLONNES).eq("id", id).maybeSingle();
  return data ? lireLigne(data as Ligne) : null;
}

/** Les éléments d'un projet dont l'image est en route : leurs cartes portent le signe d'attente. */
export async function imagesEnRoute(e: Enseignant, projetId: string): Promise<string[]> {
  if (!estUuid(projetId)) return [];
  const { data } = await e.supabase.from("demandes_d_images").select("cible_id").eq("projet_id", projetId).eq("etat", "en_route");
  return ((data ?? []) as { cible_id: string }[]).map((d) => d.cible_id);
}

const ecrire = (id: string, maj: Record<string, unknown>) => clientService().from("demandes_d_images").update({ ...maj, termine_le: maj.etat === "en_route" ? null : new Date().toISOString() }).eq("id", id);

/** L'image ou le visuel d'un élément maintenant : comparés à l'arrivée, ils disent si l'adulte a choisi autre chose. */
async function repereActuel(e: Enseignant, cible: Repere | SorteDeCarte, id: string): Promise<{ image: string | null; visuel: string | null } | null> {
  if (cible === "personnage" || cible === "objet") {
    const { table, colonne } = REFERENCE_DE[cible];
    const { data } = await e.supabase.from(table).select(colonne).eq("id", id).maybeSingle();
    return data ? { image: ((data as Record<string, unknown>)[colonne] as string | null) ?? null, visuel: null } : null;
  }
  const { data } = await e.supabase.from(TABLE_DE[cible]).select("image_id, visuel_choisi").eq("id", id).maybeSingle();
  return data ? { image: (data.image_id as string | null) ?? null, visuel: (data.visuel_choisi as string | null) ?? null } : null;
}

export type Lancee = { ok: true; demande: string; /** Le travail, à faire après la réponse (`after` dans la route), ou attendu dans les essais */ travail: () => Promise<void> } | Echec;

/** Ouvre une demande ; une seule en route à la fois pour un même élément. */
async function ouvrir(
  e: Enseignant,
  d: { projetId: string; cible: Cible; cibleId: string; dOffice?: boolean; apresBloc?: string | null; cadrage?: Cadrage; detouree?: boolean; alt?: string },
): Promise<{ id: string } | Echec> {
  const avant = d.cible === "scene" ? null : await repereActuel(e, d.cible, d.cibleId);
  const { data, error } = await clientService()
    .from("demandes_d_images")
    .insert({
      enseignant_id: e.id, projet_id: d.projetId, cible: d.cible, cible_id: d.cibleId, d_office: d.dOffice === true,
      apres_bloc: d.apresBloc ?? null, cadrage: d.cadrage ?? null, detouree: d.detouree === true, alt: (d.alt ?? "").slice(0, 200),
      image_avant: avant?.image ?? null, visuel_avant: avant?.visuel ?? null,
    })
    .select("id")
    .single();
  if (error?.code === "23505") return echec(d.cible === "scene" ? "Une image est déjà en route pour cette scène." : "Une image est déjà en route pour cet élément.");
  if (error || !data) return echec(MESSAGES_IA.pasDImage);
  return { id: data.id as string };
}

/**
 * L'arrivée d'une image de repérage : la première se pose d'office, comme une image importée, sauf
 * si l'adulte a choisi autre chose entre-temps (elle reste alors parmi les images du projet) ; la
 * seconde, s'il y en a deux, attend dans « Choisir une image » de l'élément.
 */
async function poserLeReperage(e: Enseignant, demande: string, sujet: Sujet, images: readonly Uint8Array[]): Promise<void> {
  const imageId = await inscrireLImage(e, sujet.projetId, images[0]);
  if (!imageId) {
    await ecrire(demande, { etat: "echec", message: MESSAGES_IA.pasDImage });
    return;
  }
  const { data: d } = await clientService().from("demandes_d_images").select("image_avant, visuel_avant").eq("id", demande).single();
  const maintenant = await repereActuel(e, sujet.sorte, sujet.cibleId);
  const inchange = !!maintenant && maintenant.image === (d?.image_avant ?? null) && maintenant.visuel === (d?.visuel_avant ?? null);
  if (inchange) await e.supabase.from(TABLE_DE[sujet.sorte]).update({ image_id: imageId }).eq("id", sujet.cibleId);
  const autres = images.length > 1 ? await deposerLesPropositions(e.id, sujet.projetId, images.slice(1)) : [];
  await ecrire(demande, {
    etat: autres.length ? "prete" : "posee", propositions: autres, image_posee: imageId,
    message: inchange ? null : "Vous aviez choisi une autre image entre-temps : celle-ci est parmi les images du projet.",
  });
}

/**
 * « ✦ Créer une image d'après le résumé » (F10.1), depuis « Choisir une image » : une ou deux images
 * selon « Images par création », en qualité normale sous « Automatique » (F10-AC37). La demande part,
 * l'adulte peut fermer le tiroir ou quitter la page : la première image se pose d'office à l'arrivée.
 */
export async function demanderLeReperage(e: Enseignant, sorte: Repere, id: string, options: { dOffice?: boolean } = {}): Promise<Lancee> {
  const sujet = await sujetDe(e, sorte, id);
  if ("ok" in sujet) return sujet;
  const lu = await promptDuSujet(e, sujet);
  if ("ok" in lu) return lu;
  if (!e.reglagesIa.proposer) return echec(MESSAGES_IA.pasDImage);
  const ouverte = await ouvrir(e, { projetId: sujet.projetId, cible: sorte, cibleId: id, dOffice: options.dOffice });
  if ("ok" in ouverte) return ouverte;
  const travail = async () => {
    try {
      const r = await demanderDesImages(e, { aide: options.dOffice ? "image-ajout" : "image-reperage", usage: "reperage", prompt: lu.prompt, nombre: options.dOffice ? 1 : undefined });
      if (!r.ok) {
        await ecrire(ouverte.id, { etat: "echec", message: r.message });
        return;
      }
      await poserLeReperage(e, ouverte.id, sujet, r.images);
    } catch (erreur) {
      console.error("Image de repérage", erreur);
      await ecrire(ouverte.id, { etat: "echec", message: MESSAGES_IA.pasDImage });
    }
  };
  return { ok: true, demande: ouverte.id, travail };
}

/**
 * « Créer son portrait », ou l'image de référence d'un objet (F10.2), repris le 19 octobre 2026 à la
 * demande du porteur, comme le repérage : la demande part, l'adulte peut refermer le panneau ou
 * quitter la page ; à l'arrivée, la première image devient la référence de la carte, sauf si
 * l'adulte en a choisi une autre entre-temps ; la seconde attend dans le panneau de la carte.
 */
export async function demanderLaReference(e: Enseignant, sorte: SorteDeCarte, id: string): Promise<Lancee> {
  if (!e.reglagesIa.proposer) return echec(MESSAGES_IA.pasDImage);
  const lu = await promptDeLaReference(e, sorte, id);
  if (!lu.ok) return echec(lu.message);
  const ouverte = await ouvrir(e, { projetId: lu.projetId, cible: sorte, cibleId: id });
  if ("ok" in ouverte) return ouverte;
  const travail = async () => {
    try {
      const r = await demanderDesImages(e, { aide: sorte === "personnage" ? "portrait" : "image-objet", usage: sorte === "personnage" ? "portrait" : "objet", prompt: lu.prompt });
      if (!r.ok) {
        await ecrire(ouverte.id, { etat: "echec", message: r.message });
        return;
      }
      const imageId = await inscrireLImage(e, lu.projetId, r.images[0]);
      if (!imageId) {
        await ecrire(ouverte.id, { etat: "echec", message: MESSAGES_IA.pasDImage });
        return;
      }
      const { data: d } = await clientService().from("demandes_d_images").select("image_avant").eq("id", ouverte.id).single();
      const maintenant = await repereActuel(e, sorte, id);
      const inchange = !!maintenant && maintenant.image === (d?.image_avant ?? null);
      if (inchange) await e.supabase.from(REFERENCE_DE[sorte].table).update({ [REFERENCE_DE[sorte].colonne]: imageId }).eq("id", id);
      const autres = r.images.length > 1 ? await deposerLesPropositions(e.id, lu.projetId, r.images.slice(1)) : [];
      await ecrire(ouverte.id, {
        etat: autres.length ? "prete" : "posee", propositions: autres, image_posee: imageId,
        message: inchange ? null : "Vous aviez choisi une autre image entre-temps : celle-ci est parmi les images du projet.",
      });
    } catch (erreur) {
      console.error("Image de référence", erreur);
      await ecrire(ouverte.id, { etat: "echec", message: MESSAGES_IA.pasDImage });
    }
  };
  return { ok: true, demande: ouverte.id, travail };
}

/**
 * Inscrit parmi les images du projet une image créée sans choix (l'image d'office) : l'image et sa
 * réduction d'écran sont le même JPEG, l'application n'ayant pas de quoi réduire une image côté
 * serveur. Rend son identité, ou rien.
 */
async function inscrireLImage(e: Enseignant, projetId: string, octets: Uint8Array): Promise<string | null> {
  const lu = lireImage(octets);
  if (!lu) return null;
  const id = randomUUID();
  const chemins = [cheminImage(e.id, projetId, id), cheminVignette(e.id, projetId, id)];
  const stockage = clientService().storage.from(SEAU);
  const deposes = await Promise.all(chemins.map((c) => stockage.upload(c, octets, { contentType: "image/jpeg", upsert: false })));
  if (deposes.some((d) => d.error)) {
    await stockage.remove(chemins);
    return null;
  }
  const { error } = await e.supabase.from("images").insert({
    id, projet_id: projetId, enseignant_id: e.id, chemin: chemins[0], chemin_vignette: chemins[1], largeur: lu.largeur, hauteur: lu.hauteur, format: lu.format,
  });
  if (error) {
    await stockage.remove(chemins);
    return null;
  }
  return id;
}

/**
 * L'image créée d'office pour une partie ou un chapitre ajouté depuis une proposition de l'IA
 * (F10.1, 18 octobre 2026) : une seule, sans choix, quel que soit « Images par création », quand le
 * réglage « Créer l'image des parties et chapitres ajoutés par l'IA » est allumé. Les images se
 * créent en même temps, chacune par sa demande ; un élément sans résumé n'en reçoit pas.
 */
export async function demanderLesImagesALAjout(e: Enseignant, sorte: "partie" | "chapitre", ids: readonly string[]): Promise<{ ok: true; demandes: string[]; travail: () => Promise<void> }> {
  if (!e.reglagesIa.proposer || !e.reglagesIa.imageALAjout) return { ok: true, demandes: [], travail: async () => {} };
  const lancees: { demande: string; travail: () => Promise<void> }[] = [];
  for (const id of ids.filter(estUuid).slice(0, 10)) {
    const l = await demanderLeReperage(e, sorte, id, { dOffice: true });
    if (l.ok) lancees.push(l);
  }
  return { ok: true, demandes: lancees.map((l) => l.demande), travail: async () => void (await Promise.all(lancees.map((l) => l.travail()))) };
}

/** Une liste de propositions au format d'un tableau Postgres, pour comparer la ligne telle qu'on l'a lue. */
const tableau = (liste: readonly string[]) => `{${liste.map((p) => `"${p}"`).join(",")}}`;

/**
 * Réserve une proposition prête avant de la poser dans une scène : elle quitte la liste, et une seule
 * voie l'emporte, le panneau (« Garder ») ou la pose d'office quand on a quitté le panneau. Sans quoi
 * les deux posaient la même image (doublon signalé par le porteur le 19 octobre 2026).
 */
export async function reserverLaProposition(e: Enseignant, demandeId: string, proposition: string): Promise<boolean> {
  if (!estUuid(demandeId) || typeof proposition !== "string" || !proposition) return false;
  const { data } = await e.supabase.from("demandes_d_images").select("propositions").eq("id", demandeId).eq("etat", "prete").maybeSingle();
  const liste = (data?.propositions as string[] | null) ?? [];
  if (!liste.includes(proposition)) return false;
  const { data: prise } = await clientService()
    .from("demandes_d_images")
    .update({ propositions: liste.filter((p) => p !== proposition) })
    .eq("id", demandeId)
    .eq("etat", "prete")
    .filter("propositions", "eq", tableau(liste))
    .select("id");
  return (prise?.length ?? 0) > 0;
}

/** La proposition réservée n'a pas pu se poser : elle revient en tête de la liste. */
export async function rendreLaProposition(e: Enseignant, demandeId: string, proposition: string): Promise<void> {
  if (!estUuid(demandeId) || typeof proposition !== "string" || !proposition) return;
  const { data } = await e.supabase.from("demandes_d_images").select("propositions").eq("id", demandeId).eq("etat", "prete").maybeSingle();
  if (!data) return;
  const liste = (data.propositions as string[] | null) ?? [];
  if (!liste.includes(proposition)) await ecrire(demandeId, { etat: "prete", propositions: [proposition, ...liste] });
}

/**
 * Une proposition réservée vient d'être posée par la copie de l'adulte (« Garder », ou à son retour,
 * panneau fermé : « quitter vaut accord », 18 octobre 2026) : son fichier s'efface ; l'autre, s'il y en
 * a une, attend qu'il la mette à la place ou la laisse.
 */
export async function noterLaPropositionPosee(e: Enseignant, demandeId: string, proposition: string, imageId: string): Promise<void> {
  if (!estUuid(demandeId) || !estUuid(imageId) || typeof proposition !== "string" || !proposition) return;
  const { data } = await e.supabase.from("demandes_d_images").select("projet_id, propositions").eq("id", demandeId).eq("etat", "prete").maybeSingle();
  if (!data) return;
  const autres = ((data.propositions as string[] | null) ?? []).filter((p) => p !== proposition);
  await clientService().storage.from(SEAU).remove([cheminProposition(e.id, data.projet_id as string, proposition)]);
  await ecrire(demandeId, { etat: autres.length ? "prete" : "posee", propositions: autres, image_posee: imageId });
}

/**
 * Garder la seconde proposition (la page l'a déposée comme une image importée et posée par
 * « Choisir une image »), ou les laisser : la demande se ferme, ses propositions s'effacent.
 */
export async function fermerLaDemande(e: Enseignant, demandeId: string): Promise<void> {
  if (!estUuid(demandeId)) return;
  const { data } = await e.supabase.from("demandes_d_images").select("projet_id, propositions, image_posee").eq("id", demandeId).maybeSingle();
  if (!data) return;
  const restantes = (data.propositions as string[] | null) ?? [];
  if (restantes.length) await clientService().storage.from(SEAU).remove(restantes.map((p) => cheminProposition(e.id, data.projet_id as string, p)));
  await ecrire(demandeId, { etat: data.image_posee ? "posee" : "laissee", propositions: [] });
}

// ——— L'image d'une scène (F10.2) ———

/** Ce que le panneau « Créer une image » reçoit en s'ouvrant : rien n'est demandé à l'IA. */
export type OuvertureDeLImage = {
  idee: string;
  description: string;
  /** Les personnages et objets que l'image peut montrer ; un héros absent des images n'y est pas */
  candidats: Candidat[];
  herosAbsent: boolean;
  /** Les héros que l'image ne dessine pas (héros absent) : la ligne qui le rappelle les nomme */
  herosNonDessines: string[];
  /** « Illustration 2D lumineuse » : dit sous le bouton */
  style: string;
  /** L'image demandée pour cette scène, en route ou prête à poser */
  demande: DemandeDImage | null;
};

type LaScene = { projetId: string; chapitreId: string; texte: Texte; idee: string; description: string };

async function laScene(e: Enseignant, sceneId: string): Promise<LaScene | null> {
  if (!estUuid(sceneId)) return null;
  const { data } = await e.supabase
    .from("scenes")
    .select("projet_id, chapitre_id, texte, idee_image, description_image")
    .eq("id", sceneId)
    .is("supprime_le", null)
    .maybeSingle();
  if (!data) return null;
  return {
    projetId: data.projet_id as string, chapitreId: data.chapitre_id as string, texte: (data.texte ?? []) as Texte,
    idee: (data.idee_image as string | null) ?? "", description: (data.description_image as string | null) ?? "",
  };
}

async function candidatsDu(e: Enseignant, projetId: string): Promise<Candidat[]> {
  const preparation = await preparationDe(e, projetId);
  if (!preparation) return [];
  return [
    ...preparation.personnagesDeLHistoire.map((p): Candidat => ({ id: p.id, sorte: "personnage", nom: p.nom, autresNoms: p.autresNoms, heros: p.heros, fiche: p.fiche, referenceId: p.portraitId })),
    ...preparation.objets.map((o): Candidat => ({ id: o.id, sorte: "objet", nom: o.nom, autresNoms: [], heros: false, fiche: o.fiche ?? "", referenceId: o.imageId ?? null })),
  ];
}

export async function ouvrirLImageDeScene(e: Enseignant, sceneId: string): Promise<OuvertureDeLImage | null> {
  const scene = await laScene(e, sceneId);
  if (!scene) return null;
  const [projet, candidats, demande] = await Promise.all([projetDe(e, scene.projetId), candidatsDu(e, scene.projetId), demandeDe(e, "scene", sceneId)]);
  if (!projet) return null;
  return {
    demande,
    idee: scene.idee, description: scene.description, candidats: candidatsDeLImage(candidats, projet.herosAbsent), herosAbsent: projet.herosAbsent,
    herosNonDessines: projet.herosAbsent ? candidats.filter((c) => c.sorte === "personnage" && c.heros).map((c) => c.nom) : [],
    style: nomDuStyle(projet.styleImages),
  };
}

export type DemandeDeScene = { cadrage: Cadrage; badges: string[]; /** Le sujet seul, sur fond transparent */ detouree?: boolean };
export const lireDemandeDeScene = (v: { cadrage?: unknown; badges?: unknown; detouree?: unknown }): DemandeDeScene | null =>
  estCadrage(v.cadrage) && Array.isArray(v.badges) ? { cadrage: v.cadrage, badges: v.badges.filter(estUuid).slice(0, 12), detouree: v.detouree === true } : null;

/** Les badges retenus, dans l'ordre où l'adulte les a posés, relus dans les cartes du projet. */
const retenusDe = (candidats: readonly Candidat[], badges: readonly string[]): Candidat[] =>
  badges.flatMap((id) => candidats.filter((c) => c.id === id));

/** Le prompt d'une image de scène, et les images de référence à joindre (au plus quatre). */
async function preparerLaScene(e: Enseignant, sceneId: string, d: DemandeDeScene) {
  const scene = await laScene(e, sceneId);
  if (!scene) return null;
  const [projet, tous] = await Promise.all([projetDe(e, scene.projetId), candidatsDu(e, scene.projetId)]);
  if (!projet) return null;
  const retenus = retenusDe(candidatsDeLImage(tous, projet.herosAbsent), d.badges);
  const joints = retenus.filter((r) => r.referenceId).slice(0, REFERENCES_MAX).map((r) => r.id);
  const lignes: Retenu[] = retenus.map((r) => ({ nom: r.nom, sorte: r.sorte, fiche: r.fiche, reference: joints.includes(r.id) }));
  // L'ordre des images jointes suit celui des lignes du prompt
  const references = joints.map((id) => retenus.find((r) => r.id === id)!.referenceId!);
  const description = scene.description.trim() || scene.idee.trim();
  const prompt = promptDeLaScene({ description, cadrage: d.cadrage, retenus: lignes, herosAbsent: projet.herosAbsent, detouree: d.detouree }, styleDe(projet));
  return { scene, projet, retenus, references, description, prompt };
}

/**
 * « Copier le prompt » (F10.2, F10-AC07) : le prompt assemblé, sans IA, d'après la description,
 * sinon l'idée ; le repli de F10.2 quand l'IA manque. Rien n'est inséré dans la scène.
 */
export async function promptDeLImageDeScene(e: Enseignant, sceneId: string, d: DemandeDeScene): Promise<{ ok: true; prompt: string } | Echec> {
  const prepare = await preparerLaScene(e, sceneId, d);
  if (!prepare) return echec("Cette scène n’existe plus.");
  if (!prepare.description) return echec("Décrivez d’abord ce que montre l’image.");
  return { ok: true, prompt: prepare.prompt };
}

/**
 * « ✦ Proposer la description » (F10.2) : ce que montre l'image, d'après la scène, le chapitre,
 * l'idée et les badges ; le style et les fiches s'ajoutent ensuite, sans passer par le modèle.
 */
export async function proposerLaDescription(e: Enseignant, sceneId: string, d: DemandeDeScene): Promise<{ ok: true; description: string; reste: string | null } | Echec> {
  const prepare = await preparerLaScene(e, sceneId, d);
  if (!prepare) return echec("Cette scène n’existe plus.");
  const paragraphes = paragraphesACorriger(prepare.scene.texte).map((p) => p.texte).join("\n").slice(0, 6000);
  if (!paragraphes.trim() && !prepare.scene.idee.trim()) return echec("Écrivez d’abord ce que montre l’image, ou le texte de la scène.");
  const { data: chapitre } = await e.supabase.from("chapitres").select("titre, resume").eq("id", prepare.scene.chapitreId).maybeSingle();
  const r = await demanderUneAide(e, descriptionImage, {
    histoire: histoireDuProjet(prepare.projet, e.reglagesIa.niveaux),
    pour: "scene",
    idee: prepare.scene.idee,
    paragraphes: paragraphes ? paragraphes.split("\n") : [],
    chapitre: chapitre ? { titre: chapitre.titre as string, resume: String(chapitre.resume ?? "").trim() || undefined } : undefined,
    cadrage: d.cadrage,
    herosAbsent: prepare.projet.herosAbsent,
    badges: prepare.retenus.map((r) => ({ nom: r.nom })),
  });
  return r.ok ? { ok: true, description: r.valeur.description, reste: r.reste } : echec(r.message);
}

async function lesReferences(e: Enseignant, projetId: string, ids: readonly string[]): Promise<{ octets: Uint8Array; format: FormatImage }[]> {
  if (!ids.length) return [];
  const { data } = await e.supabase.from("images").select("id, chemin, format").eq("projet_id", projetId).in("id", ids);
  const lues = await Promise.all(
    ids.map(async (id) => {
      const ligne = (data ?? []).find((x) => x.id === id);
      if (!ligne) return null;
      const { data: fichier } = await clientService().storage.from(SEAU).download(ligne.chemin as string);
      return fichier ? { octets: new Uint8Array(await fichier.arrayBuffer()), format: (ligne.format as FormatImage) ?? "jpeg" } : null;
    }),
  );
  return lues.flatMap((x) => (x ? [x] : []));
}

/**
 * « Créer l'image » (F10.2) : une ou deux images selon « Images par création », au cadrage choisi,
 * en haute qualité pour la pleine page sous « Automatique » (F10-AC37), faites avec les portraits
 * et images de référence des badges. La demande part, l'adulte peut fermer le panneau ou quitter
 * la scène : les images attendent avec la scène, sans que le serveur n'écrive dans son texte, et
 * celle que l'adulte garde se pose après le bloc où il l'avait demandée, comme une image importée.
 */
export async function demanderLImageDeScene(e: Enseignant, sceneId: string, d: DemandeDeScene & { apresBloc?: string | null; alt?: string }): Promise<Lancee> {
  const prepare = await preparerLaScene(e, sceneId, d);
  if (!prepare) return echec("Cette scène n’existe plus.");
  if (!prepare.description) return echec("Décrivez d’abord ce que montre l’image, ou faites proposer la description.");
  if (!e.reglagesIa.proposer) return echec(MESSAGES_IA.pasDImage);
  const apresBloc = typeof d.apresBloc === "string" && /^[\w-]{1,64}$/.test(d.apresBloc) ? d.apresBloc : null;
  const ouverte = await ouvrir(e, { projetId: prepare.scene.projetId, cible: "scene", cibleId: sceneId, apresBloc, cadrage: d.cadrage, detouree: d.detouree, alt: d.alt });
  if ("ok" in ouverte) return ouverte;
  const travail = async () => {
    try {
      const references = await lesReferences(e, prepare.scene.projetId, prepare.references);
      const r = await demanderDesImages(e, { aide: "image-scene", usage: d.cadrage, prompt: prepare.prompt, references, transparente: d.detouree });
      if (!r.ok) {
        await ecrire(ouverte.id, { etat: "echec", message: r.message });
        return;
      }
      const propositions = await deposerLesPropositions(e.id, prepare.scene.projetId, r.images);
      await ecrire(ouverte.id, propositions.length ? { etat: "prete", propositions } : { etat: "echec", message: MESSAGES_IA.pasDImage });
    } catch (erreur) {
      console.error("Image de scène", erreur);
      await ecrire(ouverte.id, { etat: "echec", message: MESSAGES_IA.pasDImage });
    }
  };
  return { ok: true, demande: ouverte.id, travail };
}

// ——— La couverture (F11.4) ———

/** Le format unique de la première livraison (F11.3) : la couverture en a la face. */
const FORMAT_DU_LIVRE = `A5, ${PAGE.largeur} × ${PAGE.hauteur} mm`;

async function laCouverture(e: Enseignant, projetId: string) {
  if (!estUuid(projetId)) return null;
  const [projet, preparation, { data }] = await Promise.all([
    projetDe(e, projetId),
    preparationDe(e, projetId),
    e.supabase.from("projets").select("idee_couverture, description_couverture").eq("id", projetId).maybeSingle(),
  ]);
  if (!projet || !data) return null;
  return { projet, preparation, idee: (data.idee_couverture as string) ?? "", description: (data.description_couverture as string) ?? "" };
}

/** « Copier le prompt » de la couverture, sans IA : d'après la description, sinon l'idée. */
export async function promptDeLaCouverture(e: Enseignant, projetId: string): Promise<{ ok: true; prompt: string } | Echec> {
  const c = await laCouverture(e, projetId);
  if (!c) return echec(PERDU);
  const description = c.description.trim() || c.idee.trim();
  if (!description) return echec("Décrivez d’abord ce que montre la couverture.");
  return { ok: true, prompt: promptDeCouverture({ titre: c.projet.titre, description, herosAbsent: c.projet.herosAbsent, format: FORMAT_DU_LIVRE }, styleDe(c.projet)) };
}

/** « ✦ Proposer la description » de la couverture : d'après l'idée, l'univers et l'enjeu. */
export async function proposerLaCouverture(e: Enseignant, projetId: string): Promise<{ ok: true; description: string; reste: string | null } | Echec> {
  const c = await laCouverture(e, projetId);
  if (!c) return echec(PERDU);
  const univers = c.preparation?.univers.trim() ?? "";
  const enjeu = c.preparation?.enjeu.trim() ?? "";
  if (!c.idee.trim() && !univers && !enjeu) return echec("Écrivez d’abord ce que montre la couverture, ou l’univers dans la Préparation.");
  const r = await demanderUneAide(e, descriptionImage, {
    histoire: histoireDuProjet(c.projet, e.reglagesIa.niveaux),
    pour: "couverture",
    idee: c.idee,
    paragraphes: [],
    univers: univers.slice(0, 3000) || undefined,
    enjeu: enjeu.slice(0, 3000) || undefined,
    cadrage: "couverture",
    herosAbsent: c.projet.herosAbsent,
    badges: [],
  });
  return r.ok ? { ok: true, description: r.valeur.description, reste: r.reste } : echec(r.message);
}
