"use client";

import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { LecteurEnLigne } from "@/composants/lecture/LecteurEnLigne";
import type { SourceImage } from "@/composants/lecture/Passage";
import type { VersionPartagee } from "@/domaine/partage";

/** Le lecteur de la file de relecture : ouvert sur le passage du point, les images servies au seul porteur. */
export function LectureDeLaProposition({ version, passage }: { version: VersionPartagee; passage: string | null }) {
  const source: SourceImage = (image, symbole) =>
    symbole
      ? { src: `/admin/images/${image}?v=1` }
      : { src: `/admin/images/${image}?v=1`, srcSet: `/admin/images/${image}?v=1 900w, /admin/images/${image} 2600w`, sizes: "(max-width: 720px) 100vw, 680px" };
  return (
    <LecteurEnLigne
      version={version}
      source={source}
      memoire={{ sorte: "aucune" }}
      ouvrirA={passage}
      bandeau={
        <p className="lecteur__bandeau">
          <span>
            <Icone nom="sablier" />
            <b>Proposition à relire</b> : pas encore publiée.
          </span>
          <Link className="lien" href="/admin/livres">
            <Icone nom="fleche-g" />
            Retour à la file
          </Link>
        </p>
      }
    />
  );
}
