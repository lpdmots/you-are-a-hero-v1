"use client";

import { LecteurEnLigne } from "@/composants/lecture/LecteurEnLigne";
import type { SourceImage } from "@/composants/lecture/Passage";
import type { VersionPartagee } from "@/domaine/partage";

/** Le lecteur du lien : les images par le même lien, en deux tailles ; la lecture retenue sur l'appareil (F12-AC19). */
export function LecteurParLeLien({ code, version }: { code: string; version: VersionPartagee }) {
  const source: SourceImage = (image, symbole) => {
    const base = `/images/lire/${encodeURIComponent(code)}/${image}`;
    return symbole ? { src: `${base}?v=1` } : { src: `${base}?v=1`, srcSet: `${base}?v=1 900w, ${base} 2600w`, sizes: "(max-width: 720px) 100vw, 680px" };
  };
  return <LecteurEnLigne version={version} source={source} memoire={{ sorte: "appareil", cle: `lecture:${code.replace(/[\s-]/g, "").toLowerCase()}` }} />;
}
