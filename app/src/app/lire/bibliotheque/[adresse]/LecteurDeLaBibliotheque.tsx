"use client";

import { Coeur } from "@/composants/Coeur";
import { LecteurEnLigne } from "@/composants/lecture/LecteurEnLigne";
import type { SourceImage } from "@/composants/lecture/Passage";
import type { VersionPartagee } from "@/domaine/partage";

/** Le lecteur d'un livre de la bibliothèque : ses images par son adresse, la lecture retenue sur l'appareil, le retour à la bibliothèque. */
export function LecteurDeLaBibliotheque({ adresse, version, coeurs }: { adresse: string; version: VersionPartagee; coeurs: number }) {
  const source: SourceImage = (image, symbole) => {
    const base = `/images/publie/${adresse}/${image}`;
    return symbole ? { src: `${base}?v=1` } : { src: `${base}?v=1`, srcSet: `${base}?v=1 900w, ${base} 2600w`, sizes: "(max-width: 720px) 100vw, 680px" };
  };
  return (
    <LecteurEnLigne
      version={version}
      source={source}
      memoire={{ sorte: "appareil", cle: `lecture:bibliotheque:${adresse}` }}
      mention
      retour={{ href: `/bibliotheque/${adresse}`, nom: "Bibliothèque" }}
      apresLaFin={<Coeur adresse={adresse} nombre={coeurs} variante="fin" />}
    />
  );
}
