"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Icone } from "@/composants/Icone";
import { LecteurEnLigne, type Memoire } from "@/composants/lecture/LecteurEnLigne";
import type { SourceImage } from "@/composants/lecture/Passage";
import type { LectureGardee } from "@/domaine/lecture";
import type { VersionPartagee } from "@/domaine/partage";
import { garderLecture } from "../actions";

/**
 * Le lecteur de l'élève : ses images par son poste, sa lecture gardée par la base une seconde
 * après le dernier geste, et au départ de la page ; « Retour à Lire » en tête.
 */
export function LecteurDeLEleve({ projetId, version, lecture }: { projetId: string; version: VersionPartagee; lecture: unknown }) {
  const attente = useRef<{ minuteur: ReturnType<typeof setTimeout>; lecture: LectureGardee } | null>(null);
  const envoyer = () => {
    if (!attente.current) return;
    clearTimeout(attente.current.minuteur);
    void garderLecture(projetId, attente.current.lecture);
    attente.current = null;
  };
  useEffect(() => {
    window.addEventListener("pagehide", envoyer);
    return () => {
      window.removeEventListener("pagehide", envoyer);
      envoyer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `envoyer` ne lit que la référence
  }, []);
  const memoire = useMemo<Memoire>(
    () => ({
      sorte: "profil",
      initiale: lecture,
      garder: (l) => {
        if (attente.current) clearTimeout(attente.current.minuteur);
        attente.current = { lecture: l, minuteur: setTimeout(envoyer, 1000) };
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule mémoire pour la page
    [],
  );
  const source: SourceImage = (image, symbole) => {
    const base = `/images/classe/${projetId}/${image}`;
    return symbole ? { src: `${base}?v=1` } : { src: `${base}?v=1`, srcSet: `${base}?v=1 900w, ${base} 2600w`, sizes: "(max-width: 720px) 100vw, 680px" };
  };
  return (
    <LecteurEnLigne
      version={version}
      source={source}
      memoire={memoire}
      bandeau={
        <p className="lecteur__bandeau lecteur__bandeau--eleve">
          <Link className="lien" href="/travail/lecture">
            <Icone nom="fleche-g" />
            Retour à Lire
          </Link>
        </p>
      }
    />
  );
}
