import { donneesDeLAccueil, enJsonLd, type Video } from "@/domaine/presentation";
import type { Offre } from "@/domaine/offre";
import { adresseDuSite } from "@/serveur/env";

/** Les données structurées de l'accueil (F14-AC48) : l'organisation, le site, l'application et son offre, la visite en vidéo. */
export function DonneesDeLAccueil({ offre, video }: { offre: Offre; video: Video | null }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: enJsonLd(donneesDeLAccueil(offre, adresseDuSite(), video)) }} />;
}
