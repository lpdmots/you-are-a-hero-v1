import "server-only";
import { createHash } from "node:crypto";
import { cache } from "react";
import type { Enseignant } from "../adulte";
import { projetDe, type Projet } from "../lectures";
import { elevesDeLaClasse, estUuid, planDe, preparationDe } from "../recit";
import { clientService } from "../supabase";
import { livreACompose, presentationDe, type LivreACompose } from "@/domaine/composition";
import type { Texte } from "@/domaine/copie";
import type { ContenuAControler, Probleme } from "@/domaine/controles";
import { nomPourEleves } from "@/domaine/eleves";
import { NOMS_COMME_LE_LIVRE, versionDuLivre, type VersionPartagee } from "@/domaine/partage";
import { reglagesPropres, type ReglagesDuLivre } from "@/domaine/mise-en-page";
import { imagesDesPages, pagesParDefaut, pagesPropres, type PagesDuLivre } from "@/domaine/pages";
import type { Preparation } from "@/domaine/preparation";
import type { Plan } from "@/domaine/recit";
import { cheminDeLApercu, SEAU } from "./pdf";

/**
 * Le contenu du livre d'un projet, lu une fois par demande : plan, textes, images, préparation,
 * réglages et pages de présentation. Les contrôles, l'aperçu et les PDF le partagent. Son
 * empreinte est celle de ce que le livre imprime, sans les marques du PDF de travail : elle
 * change quand le livre change, et seulement alors.
 */

export type ImageDuProjet = { chemin: string; vignette: string; format: "jpeg" | "png" | "webp"; largeur: number; hauteur: number };

export type ContenuDuLivre = {
  projet: Projet;
  aChoix: boolean;
  plan: Plan;
  preparation: Preparation | null;
  textes: Map<string, Texte>;
  images: Map<string, ImageDuProjet>;
  reglages: ReglagesDuLivre;
  pages: PagesDuLivre;
  /** Les pages telles que l'adulte les a laissées, sans les valeurs proposées : rien si jamais réglées */
  pagesGardees: unknown;
  scenesAvecActions: Set<string>;
  empreinte: string;
};

export const contenuDuLivre = cache(async (e: Enseignant, projetId: string): Promise<ContenuDuLivre | null> => {
  if (!estUuid(projetId)) return null;
  const projet = await projetDe(e, projetId);
  if (!projet) return null;
  const aChoix = projet.recit === "choix";
  const [plan, preparation, textes, images, gardes, eleves] = await Promise.all([
    planDe(e, projetId),
    preparationDe(e, projetId),
    e.supabase.from("scenes").select("id, texte").eq("projet_id", projetId).is("supprime_le", null),
    e.supabase.from("images").select("id, chemin, chemin_vignette, format, largeur, hauteur").eq("projet_id", projetId),
    e.supabase.from("projets").select("mise_en_page, pages_du_livre").eq("id", projetId).maybeSingle(),
    elevesDeLaClasse(e, projet.classe?.id ?? null),
  ]);
  const erreur = textes.error ?? images.error ?? gardes.error;
  if (erreur) throw new Error(`Livre illisible : ${erreur.message}`);
  const lesTextes = new Map(((textes.data ?? []) as { id: string; texte: Texte | null }[]).map((s) => [s.id, s.texte ?? []]));
  const lignes = (images.data ?? []) as { id: string; chemin: string; chemin_vignette: string; format: ImageDuProjet["format"]; largeur: number; hauteur: number }[];
  const feuille = preparation?.feuille ?? null;
  const reglages = reglagesPropres(gardes.data?.mise_en_page, { aChoix, des: feuille?.on ? feuille.des : 0 });
  const deClasse = projet.organisation === "classe";
  const pages = pagesPropres(
    gardes.data?.pages_du_livre,
    pagesParDefaut({
      aChoix, deClasse, adulte: e.nomAffiche ?? "", classe: projet.classe ? { nom: projet.classe.nom, anneeDebut: projet.classe.anneeDebut } : null,
      prenoms: eleves.map((x) => nomPourEleves(x, eleves)), annee: anneeScolaireEnCours(),
    }),
  );
  const contenu: Omit<ContenuDuLivre, "empreinte"> = {
    projet, aChoix, plan, preparation, textes: lesTextes,
    images: new Map(lignes.map((i) => [i.id, { chemin: i.chemin, vignette: i.chemin_vignette, format: i.format, largeur: i.largeur, hauteur: i.hauteur }])),
    reglages, pages, pagesGardees: gardes.data?.pages_du_livre ?? null,
    scenesAvecActions: new Set([...lesTextes].filter(([, t]) => t.some((b) => b.type === "action")).map(([id]) => id)),
  };
  return { ...contenu, empreinte: createHash("sha256").update(JSON.stringify(livreDuContenu(contenu, []))).digest("hex") };
});

/** L'année scolaire en cours : une année commencée en septembre. */
function anneeScolaireEnCours(): number {
  const maintenant = new Date();
  return maintenant.getMonth() >= 7 ? maintenant.getFullYear() : maintenant.getFullYear() - 1;
}

/** Le livre à composer : le contenu, et les points des contrôles pour les marques du PDF de travail. */
export function livreDuContenu(c: Omit<ContenuDuLivre, "empreinte">, problemes: Probleme[]): LivreACompose {
  const feuille = c.preparation?.feuille ?? null;
  return livreACompose({
    titre: c.projet.titre, aChoix: c.aChoix, plan: c.plan, textes: c.textes,
    formule: c.preparation?.formuleRenvoi ?? "rends", marqueFin: c.preparation?.marqueFin ?? "Fin", feuille,
    reglages: c.reglages, problemes,
    nouvellesPages: new Set(c.plan.parties.flatMap((p) => p.chapitres.flatMap((ch) => ch.scenes.filter((s) => s.nouvellePage).map((s) => s.id)))),
    images: Object.fromEntries([...c.images].map(([id, i]) => [id, { largeur: i.largeur, hauteur: i.hauteur }])),
    presentation: presentationDe(c.pages, {
      titre: c.projet.titre, aChoix: c.aChoix, feuille, regles: c.preparation?.regles ?? "",
      aDesEnigmes: c.plan.liens.some((l) => l.cache), desImprimes: c.reglages.basDePage === "des",
    }),
  });
}

/**
 * Ce que les contrôles du livre lisent pour les images et les marges (F10, F11.2). Les textes
 * qui dépassent de la marge sont ceux qu'a vus le dernier aperçu de ce même contenu.
 */
export async function contenuAControler(e: Enseignant, c: ContenuDuLivre): Promise<ContenuAControler> {
  let debordements: ContenuAControler["debordements"] = [];
  const lu = await clientService().storage.from(SEAU).download(`${cheminDeLApercu(e.id, c.projet.id, c.empreinte)}.json`);
  if (!lu.error && lu.data) debordements = (JSON.parse(await lu.data.text()) as { debordements?: ContenuAControler["debordements"] }).debordements ?? [];
  return {
    textes: c.textes,
    images: Object.fromEntries([...c.images].map(([id, i]) => [id, { largeur: i.largeur, hauteur: i.hauteur }])),
    reglages: c.reglages, debordements,
    imagesDesPages: imagesDesPages(c.pages, { aChoix: c.aChoix, feuille: Boolean(c.preparation?.feuille?.on && c.preparation.feuille.sections.length) }),
  };
}

/** L'empreinte d'une version partagée : ce que le lecteur lit, écrit toujours de la même façon (F12.1). */
export const empreinteDeLaVersion = (v: VersionPartagee): string => createHash("sha256").update(JSON.stringify(v)).digest("hex");

/**
 * L'empreinte de ce que le lecteur lit, avec les noms du livre : le PDF définitif la garde, la
 * version partagée aussi, et les deux disent ainsi s'ils ont le même texte (F12-AC22).
 */
export const empreinteDeLecture = (livre: LivreACompose, chapitres: ReadonlyMap<string, { id: string; titre: string }>): string =>
  empreinteDeLaVersion(versionDuLivre(livre, NOMS_COMME_LE_LIVRE, chapitres));
