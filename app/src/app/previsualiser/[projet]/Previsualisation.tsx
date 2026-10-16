"use client";

import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { LecteurEnLigne } from "@/composants/lecture/LecteurEnLigne";
import type { SourceImage } from "@/composants/lecture/Passage";
import type { VersionPartagee } from "@/domaine/partage";

/** Les images de l'atelier, que l'adulte voit déjà ; la même page que le lecteur, sans rien retenir. */
export function Previsualisation({ projetId, version }: { projetId: string; version: VersionPartagee }) {
  const source: SourceImage = (image, symbole) =>
    symbole ? { src: `/images/${image}?v=1` } : { src: `/images/${image}?v=1`, srcSet: `/images/${image}?v=1 900w, /images/${image} 2600w`, sizes: "(max-width: 720px) 100vw, 680px" };
  return (
    <LecteurEnLigne
      version={version}
      source={source}
      memoire={{ sorte: "aucune" }}
      bandeau={
        <p className="lecteur__bandeau">
          <span>
            <Icone nom="oeil" />
            <b>Prévisualisation</b> : le livre tel que le lecteur le verra. Rien n’est partagé.
          </span>
          <Link className="lien" href={`/projet/${projetId}/livre?etape=sortie&volet=partager`}>
            <Icone nom="fleche-g" />
            Retour au partage
          </Link>
        </p>
      }
    />
  );
}
