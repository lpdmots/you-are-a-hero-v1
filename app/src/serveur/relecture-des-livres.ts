import "server-only";
import { envoyer } from "./courriel";
import { adresseDuSite } from "./env";
import { relecture, type EntreeRelecture, type PointDeRelecture } from "./ia/aides/relecture";
import { demanderUneAide } from "./ia/demander";
import { SEAU, type FormatImage } from "./images";
import { estUuid } from "./recit";
import { clientService } from "./supabase";
import { estAge, lireReglagesIa } from "@/domaine/aides-ia";
import { adresseDepuisTitre, adresseLibre, passagesChanges, reperesDuLivre, texteDuPassage, type PassageChange } from "@/domaine/bibliotheque";
import { imagesDesBlocs, type VersionPartagee } from "@/domaine/partage";
import type { TexteLeger } from "@/domaine/pages";

/**
 * La relecture des livres proposés à la bibliothèque (F15, « Ce que vérifie l'IA », « La file de
 * relecture », « Refus et motifs »), côté porteur. L'IA lit la proposition entière à chaque
 * proposition, au compte du porteur ; le porteur publie ou refuse depuis l'administration, et
 * l'adulte en reçoit un courriel. Tout passe par la clé de service, après `exigerLePorteur`.
 */

/** Les images d'un livre que l'IA regarde : 20 au plus, en vignette (900 points). */
const IMAGES_MAX = 20;
/** Un livre entier se relit en plus d'une minute : quatre au plus. */
const DELAI_RELECTURE_MS = 240_000;

const lettres = (t: TexteLeger | undefined): string =>
  (t ?? []).map((p) => p.map((l) => l.text).join("")).filter((l) => l.trim()).join("\n");

/** Le compte du porteur, qui paie la relecture : ses réglages, l'IA toujours allumée pour elle. */
async function lePorteur(): Promise<{ id: string; reglagesIa: ReturnType<typeof lireReglagesIa> } | null> {
  const { data } = await clientService().from("enseignants").select("id, reglages_ia").eq("createur", true).limit(1).maybeSingle();
  return data ? { id: data.id as string, reglagesIa: { ...lireReglagesIa(data.reglages_ia), proposer: true } } : null;
}

/**
 * Ce qui part à l'IA : les passages, ce que le livre montre autour (titre, règles du jeu, page de
 * fin), et ses images en vignette. Jamais la page des auteurs, ni la ligne de la page de titre :
 * aucun prénom d'élève ni nom d'enseignant ne part (F13, « Ce qui est transmis »).
 */
async function entreeDe(projetId: string, version: VersionPartagee, titre: string, recit: "choix" | "classique", age: string): Promise<EntreeRelecture> {
  const reperes = reperesDuLivre(version);
  const passages = version.passages.map((p) => ({ repere: reperes.get(p.id)!, texte: texteDuPassage(p) })).filter((p) => p.texte);
  const pr = version.presentation;
  const autour = [
    pr?.titre.titre ? `Titre : ${pr.titre.titre}` : "",
    pr?.titre.sousTitre ? `Sous-titre : ${pr.titre.sousTitre}` : "",
    pr?.commentLire?.regles.trim() ? `Règles du jeu : ${pr.commentLire.regles.trim()}` : "",
    pr?.fin && !pr.fin.image ? `Page de fin : ${lettres(pr.fin.texte)}` : "",
  ].filter(Boolean).join("\n");

  // Les images, dans l'ordre du livre, avec l'endroit où elles paraissent
  const ou = new Map<string, string>();
  const passageDe = new Map<string, string>();
  if (pr?.titre.image) ou.set(pr.titre.image, "en page de titre");
  if (pr?.titre.illustration) ou.set(pr.titre.illustration, "en page de titre");
  for (const p of version.passages)
    for (const i of imagesDesBlocs(p.blocs))
      if (!ou.has(i)) {
        ou.set(i, `dans ${reperes.get(p.id)}`);
        passageDe.set(i, p.id);
      }
  if (pr?.fin?.image && !ou.has(pr.fin.image)) ou.set(pr.fin.image, "en page de fin");
  const ids = [...ou.keys()].filter((id) => id in version.images).slice(0, IMAGES_MAX);
  const base = clientService();
  const { data: lignes } = ids.length
    ? await base.from("images").select("id, chemin_vignette, format").eq("projet_id", projetId).in("id", ids)
    : { data: [] };
  const images = (
    await Promise.all(ids.map(async (id, i) => {
      const l = (lignes ?? []).find((x) => x.id === id);
      if (!l) return null;
      const { data } = await base.storage.from(SEAU).download(l.chemin_vignette as string);
      return data
        ? { repere: `I${i + 1}`, ou: ou.get(id)!, passage: passageDe.get(id) ?? null, piece: { octets: new Uint8Array(await data.arrayBuffer()), format: l.format as FormatImage } }
        : null;
    }))
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    histoire: { titre, mode: "classe", recit, age: estAge(age) ? age : "8-10" },
    passages,
    autour: autour || null,
    images,
  };
}

/**
 * Relire la proposition en attente d'un projet (F15-AC03) : le rapport se garde avec elle, s'il
 * s'agit toujours de la même ; un échec se dit dans la file, qui propose de relancer. Aucune
 * étoile n'est débitée à l'adulte : la demande est au compte du porteur.
 */
export async function relireLaProposition(projetId: string): Promise<"fait" | "echec" | "rien"> {
  if (!estUuid(projetId)) return "rien";
  const base = clientService();
  const { data: ligne } = await base.from("publications").select("proposee, proposee_le, age_propose").eq("projet_id", projetId).maybeSingle();
  if (!ligne?.proposee) return "rien";
  const porteur = await lePorteur();
  const { data: projet } = await base.from("projets").select("recit").eq("id", projetId).maybeSingle();
  // Le rapport ne s'écrit que sur la proposition même qui a été lue : une nouvelle l'aurait remplacée
  const ecrire = (champs: Record<string, unknown>) =>
    base.from("publications").update(champs).eq("projet_id", projetId).eq("proposee_le", ligne.proposee_le as string);
  await ecrire({ rapport_etat: "en_cours", rapport: null, rapport_le: null, rapport_cout_usd: null });
  if (!porteur || !projet) {
    await ecrire({ rapport_etat: "echec" });
    return "echec";
  }
  const version = ligne.proposee as VersionPartagee;
  const debut = new Date().toISOString();
  const entree = await entreeDe(projetId, version, version.titre, projet.recit as "choix" | "classique", ligne.age_propose as string);
  const r = await demanderUneAide(porteur, relecture, entree, { delaiMs: DELAI_RELECTURE_MS });
  // Le coût, lu au journal des appels, où il paraît aussi dans la dépense de l'administration
  const { data: appel } = await base
    .from("appels_ia").select("cout_usd").eq("enseignant_id", porteur.id).eq("aide", "relecture").gte("commence_le", debut).order("commence_le", { ascending: false }).limit(1).maybeSingle();
  const cout = appel?.cout_usd === null || appel?.cout_usd === undefined ? null : Number(appel.cout_usd);
  if (!r.ok) {
    await ecrire({ rapport_etat: "echec", rapport_cout_usd: cout });
    return "echec";
  }
  const reperes = reperesDuLivre(version);
  // Un point sur une image ouvre le passage qui la montre
  const parRepere = new Map<string, string | null>([...[...reperes].map(([id, rep]) => [rep, id] as const), ...entree.images.map((i) => [i.repere, i.passage ?? null] as const)]);
  const points = r.valeur.points.map((p: PointDeRelecture) => ({ ...p, passage: parRepere.get(p.repere) ?? null }));
  await ecrire({
    rapport: { points, lu: { passages: entree.passages.length, images: entree.images.length } },
    rapport_etat: "fait", rapport_le: new Date().toISOString(), rapport_cout_usd: cout,
  });
  return "fait";
}

// ——— La file de relecture, dans l'administration ———

export type PointDuRapport = PointDeRelecture & { passage: string | null };

export type LivreARelire = {
  projetId: string;
  titre: string;
  courriel: string | null;
  proposeLe: string;
  miseAJour: boolean;
  presentation: string;
  /** La présentation publiée, quand une mise à jour la change */
  presentationAvant: string | null;
  age: string;
  attestation: "classe" | "auteur";
  rapport: { etat: "en_cours" | "fait" | "echec" | null; points: PointDuRapport[]; lu: { passages: number; images: number } | null; coutUsd: number | null };
  changes: PassageChange[];
};

/** Les livres qui attendent la relecture du porteur, le plus ancien d'abord. */
export async function livresARelire(): Promise<LivreARelire[]> {
  const base = clientService();
  const { data, error } = await base
    .from("publications")
    .select("projet_id, enseignant_id, version, presentation, proposee, presentation_proposee, age_propose, proposee_le, attestation, rapport, rapport_etat, rapport_cout_usd, projets(titre)")
    .not("proposee", "is", null)
    .order("proposee_le");
  if (error) throw new Error(`File de relecture illisible : ${error.message}`);
  return Promise.all((data ?? []).map(async (l) => {
    const { data: compte } = await base.auth.admin.getUserById(l.enseignant_id as string);
    const rapport = (l.rapport ?? null) as { points?: PointDuRapport[]; lu?: { passages: number; images: number } } | null;
    const proposee = l.proposee as VersionPartagee;
    const publiee = (l.version ?? null) as VersionPartagee | null;
    return {
      projetId: l.projet_id as string,
      titre: proposee.titre?.trim() || ((l.projets as unknown as { titre: string } | null)?.titre ?? "Sans titre"),
      courriel: compte.user?.email ?? null,
      proposeLe: l.proposee_le as string,
      miseAJour: Boolean(publiee),
      presentation: l.presentation_proposee as string,
      presentationAvant: publiee && l.presentation !== l.presentation_proposee ? (l.presentation as string) : null,
      age: l.age_propose as string,
      attestation: l.attestation as "classe" | "auteur",
      rapport: {
        etat: (l.rapport_etat as LivreARelire["rapport"]["etat"]) ?? null,
        points: rapport?.points ?? [],
        lu: rapport?.lu ?? null,
        coutUsd: l.rapport_cout_usd === null ? null : Number(l.rapport_cout_usd),
      },
      changes: publiee ? passagesChanges(publiee, proposee) : [],
    };
  }));
}

/** La proposition d'un projet, pour la lire dans le lecteur depuis la file : seulement si elle attend. */
export async function propositionALire(projetId: string): Promise<VersionPartagee | null> {
  if (!estUuid(projetId)) return null;
  const { data } = await clientService().from("publications").select("proposee").eq("projet_id", projetId).maybeSingle();
  return (data?.proposee as VersionPartagee | null) ?? null;
}

async function courrielDeLAdulte(enseignantId: string): Promise<string | null> {
  const { data } = await clientService().auth.admin.getUserById(enseignantId);
  return data.user?.email ?? null;
}

const signature = () => [`Il était une classe — ${adresseDuSite()}`];

/**
 * « Publier » (F15-AC04, AC07) : la proposition devient la version publiée, à l'adresse fixée à
 * la première publication (tirée du titre, un suffixe en cas de doublon) ; l'adulte en reçoit un
 * courriel avec le lien. Une mise à jour remplace la version à la même adresse.
 */
export async function publier(projetId: string): Promise<{ ok: boolean; adresse?: string; courriel: boolean }> {
  if (!estUuid(projetId)) return { ok: false, courriel: false };
  const base = clientService();
  const { data: l } = await base
    .from("publications").select("enseignant_id, adresse, version, proposee, presentation_proposee, age_propose, empreinte_proposee, proposee_le").eq("projet_id", projetId).maybeSingle();
  if (!l?.proposee) return { ok: false, courriel: false };
  const version = l.proposee as VersionPartagee;
  let adresse = l.adresse as string | null;
  const maintenant = new Date().toISOString();
  for (let essai = 0; essai < 3; essai += 1) {
    if (!adresse) {
      const { data: prises } = await base.from("publications").select("adresse").like("adresse", `${adresseDepuisTitre(version.titre)}%`);
      adresse = adresseLibre(version.titre, new Set((prises ?? []).map((p) => p.adresse as string)));
    }
    const { data: ecrite, error } = await base
      .from("publications")
      .update({
        adresse, version, presentation: l.presentation_proposee, age: l.age_propose, empreinte: l.empreinte_proposee,
        ...(l.version ? {} : { publiee_le: maintenant }), mise_a_jour_le: maintenant,
        proposee: null, presentation_proposee: null, age_propose: null, empreinte_proposee: null, proposee_le: null, attestation: null,
        refus_motif: null, refusee_le: null, rapport: null, rapport_etat: null, rapport_le: null, rapport_cout_usd: null, modifie_le: maintenant,
        // Un livre retiré puis proposé de nouveau revient à la même adresse, avec ses cœurs (F15-AC09)
        retiree_le: null, retrait_par: null, retrait_motif: null,
      })
      .eq("projet_id", projetId).eq("proposee_le", l.proposee_le as string)
      .select("projet_id");
    // Une adresse prise entre-temps par un autre livre : la suivante
    if (error?.code === "23505" && !l.adresse) {
      adresse = null;
      continue;
    }
    if (error || !ecrite?.length) return { ok: false, courriel: false };
    const a = await courrielDeLAdulte(l.enseignant_id as string);
    const lien = `${adresseDuSite()}/bibliotheque/${adresse}`;
    const courriel = a
      ? await envoyer({
          a,
          sujet: `« ${version.titre} » est dans la bibliothèque — Il était une classe`,
          texte: [
            "Bonjour,",
            "",
            l.version
              ? `La mise à jour de « ${version.titre} » est publiée : la bibliothèque montre désormais la nouvelle version, à la même adresse.`
              : `« ${version.titre} » est publié dans la bibliothèque du site : tout le monde peut le lire, sans compte.`,
            "",
            `Son adresse, à donner aux familles : ${lien}`,
            "",
            "Vous pouvez le retirer de la bibliothèque à tout moment, depuis « Imprimer et partager ».",
            "",
            ...signature(),
          ].join("\n"),
        })
      : false;
    return { ok: true, adresse: adresse!, courriel };
  }
  return { ok: false, courriel: false };
}

/** Les trois phrases prêtes du refus (F15, « Refus et motifs ») ; « Autre » laisse écrire. */
export const MOTIFS_DE_REFUS = [
  "Contenu inadapté à l’âge des lecteurs.",
  "Un personnage ou un texte protégé par le droit d’auteur.",
  "Autre.",
] as const;

/**
 * « Refuser » (F15-AC05, AC07) : la proposition s'efface, le motif reste à l'adulte, qui le lit
 * dans « Imprimer et partager » et le reçoit par courriel ; il corrige et propose de nouveau. Une
 * version publiée reste lisible.
 */
export async function refuser(projetId: string, motif: string): Promise<{ ok: boolean; courriel: boolean }> {
  const texte = motif.replace(/[ \t]+/g, " ").trim().slice(0, 2000);
  if (!estUuid(projetId) || !texte) return { ok: false, courriel: false };
  const base = clientService();
  const { data: l } = await base.from("publications").select("enseignant_id, proposee, proposee_le, version").eq("projet_id", projetId).maybeSingle();
  if (!l?.proposee) return { ok: false, courriel: false };
  const titre = (l.proposee as VersionPartagee).titre;
  const maintenant = new Date().toISOString();
  const { data: ecrite, error } = await base
    .from("publications")
    .update({
      proposee: null, presentation_proposee: null, age_propose: null, empreinte_proposee: null, proposee_le: null, attestation: null,
      refus_motif: texte, refusee_le: maintenant, rapport: null, rapport_etat: null, rapport_le: null, rapport_cout_usd: null, modifie_le: maintenant,
    })
    .eq("projet_id", projetId).eq("proposee_le", l.proposee_le as string)
    .select("projet_id");
  if (error || !ecrite?.length) return { ok: false, courriel: false };
  const a = await courrielDeLAdulte(l.enseignant_id as string);
  const courriel = a
    ? await envoyer({
        a,
        sujet: `${l.version ? `La mise à jour de « ${titre} » n’est pas publiée` : `« ${titre} » n’est pas publié`} — Il était une classe`,
        texte: [
          "Bonjour,",
          "",
          l.version
            ? `La mise à jour de « ${titre} » n'est pas publiée. La bibliothèque montre toujours la version précédente.`
            : `« ${titre} » n'est pas publié dans la bibliothèque du site.`,
          "",
          "Le motif :",
          texte,
          "",
          "Vous pouvez corriger le livre, puis le proposer de nouveau depuis « Imprimer et partager ».",
          "",
          ...signature(),
        ].join("\n"),
      })
    : false;
  return { ok: true, courriel };
}

/** « 2 livres à relire », sur la page principale de l'administration. */
export async function nombreDeLivresARelire(): Promise<number> {
  const { count } = await clientService().from("publications").select("projet_id", { count: "exact", head: true }).not("proposee", "is", null);
  return count ?? 0;
}
