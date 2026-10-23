import "server-only";
import { codeSaisi, type PresentationPartagee } from "@/domaine/partage";
import { clientService } from "./supabase";

export type LivreDeLAccueil = { code: string; titre: string; ligne: string; image: string | null };

/**
 * Les livres à feuilleter de l'accueil (F14, « Pages publiques », révisé le 22 octobre 2026) : deux
 * livres de la classe du porteur, partagés par lien. Leurs codes de lecture, séparés par une
 * virgule, sont dans `LIVRES_DE_L_ACCUEIL` (l'ancienne `LIVRE_DE_L_ACCUEIL`, d'un seul livre, sert
 * encore). Le titre et l'image viennent de la version partagée : rien n'est écrit en dur, et un
 * partage retiré disparaît de l'accueil. Une base qui ne répond pas laisse la page sans livres.
 */
export async function livresDeLAccueil(): Promise<LivreDeLAccueil[]> {
  const brut = process.env.LIVRES_DE_L_ACCUEIL ?? process.env.LIVRE_DE_L_ACCUEIL ?? "";
  const codes = brut
    .split(",")
    .map((c) => codeSaisi(c.trim()))
    .filter((c): c is string => Boolean(c))
    .slice(0, 2);
  if (codes.length === 0) return [];
  try {
    const { data, error } = await clientService()
      .from("partages")
      .select("code, titre:version->>titre, presentation:version->presentation, images:version->images")
      .in("code", codes)
      .eq("par_lien", true)
      .not("version", "is", null);
    if (error || !data) return [];
    const lus = data as { code: string; titre: string | null; presentation: PresentationPartagee | null; images: Record<string, unknown> | null }[];
    return codes.flatMap((code) => {
      const lu = lus.find((l) => l.code === code);
      if (!lu) return [];
      const page = lu.presentation?.titre;
      const image = page?.image ?? page?.illustration ?? Object.keys(lu.images ?? {})[0] ?? null;
      return [
        {
          code,
          titre: lu.titre?.trim() || "Un livre de la classe",
          ligne: [page?.ligne, page?.annee].filter((x) => x && x.trim()).join(" · "),
          image: image ? `/images/lire/${code}/${image}?v=1` : null,
        },
      ];
    });
  } catch {
    return [];
  }
}
