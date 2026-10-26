"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Coeur } from "@/composants/Coeur";
import { Icone } from "@/composants/Icone";
import { LecteurEnLigne, type Memoire } from "@/composants/lecture/LecteurEnLigne";
import type { SourceImage } from "@/composants/lecture/Passage";
import type { LectureGardee } from "@/domaine/lecture";
import type { VersionPartagee } from "@/domaine/partage";
import { coeurDeLEleve, garderLectureBibliotheque } from "../../actions";

/**
 * Le lecteur de l'élève pour un livre de la bibliothèque : ses images par l'adresse du livre, sa
 * lecture gardée pour son profil une seconde après le dernier geste, son cœur après la fin.
 */
export function LecteurBibliothequeEleve({ adresse, version, lecture, coeurs, donne }: {
  adresse: string; version: VersionPartagee; lecture: unknown; coeurs: number; donne: boolean;
}) {
  const attente = useRef<{ minuteur: ReturnType<typeof setTimeout>; lecture: LectureGardee } | null>(null);
  const envoyer = () => {
    if (!attente.current) return;
    clearTimeout(attente.current.minuteur);
    void garderLectureBibliotheque(adresse, attente.current.lecture);
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
    const base = `/images/publie/${adresse}/${image}`;
    return symbole ? { src: `${base}?v=1` } : { src: `${base}?v=1`, srcSet: `${base}?v=1 900w, ${base} 2600w`, sizes: "(max-width: 720px) 100vw, 680px" };
  };
  return (
    <LecteurEnLigne
      version={version}
      source={source}
      memoire={memoire}
      apresLaFin={<Coeur adresse={adresse} nombre={coeurs} variante="fin" profil={{ donne, basculer: (oui) => coeurDeLEleve(adresse, oui) }} />}
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
