"use client";

import { useEffect, useRef, useState } from "react";
import { listerImages } from "@/app/(adulte)/projet/actions-images";
import { adresseVisuel, estVisuel, VISUELS } from "@/domaine/visuels";
import { Icone } from "./Icone";
import { deposer, reduire, REFUS_IMPORT, type ImageReduite } from "./importer";
import { Panneau } from "./Panneau";

export type ChoixImage = { image: string } | { visuel: string } | { defaut: true } | { locale: ImageReduite };

/**
 * « Choisir une image » (F10.1) : le même sélecteur pour le projet, la partie et le
 * chapitre, à la création comme ensuite. Importer, réutiliser une image du projet,
 * retenir un visuel proposé, ou revenir au visuel par défaut.
 */
export function ChoisirImage({
  projetId, actuel, pour, onChoisir, onFermer,
}: {
  /** null pendant la création d'un projet : l'image importée attend que le projet existe */
  projetId: string | null;
  actuel: { imageId: string | null; visuelChoisi: string | null; locale?: boolean };
  /** « du projet », « de « La lisière » » */
  pour: string;
  onChoisir: (choix: ChoixImage) => Promise<string | null> | string | null;
  onFermer: () => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!projetId) return;
    let vivant = true;
    listerImages(projetId)
      .then((liste) => vivant && setImages(liste))
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, [projetId]);

  const choisir = async (choix: ChoixImage) => {
    setErreur(null);
    setAttente(true);
    const refus = await onChoisir(choix);
    setAttente(false);
    if (refus) setErreur(refus);
    else onFermer();
  };

  const importer = async (choisi: File | undefined) => {
    if (!choisi) return;
    setErreur(null);
    setAttente(true);
    const reduite = await reduire(choisi);
    if (!reduite) {
      setAttente(false);
      setErreur(REFUS_IMPORT);
      return;
    }
    if (!projetId) return choisir({ locale: reduite });
    const depot = await deposer(projetId, reduite);
    URL.revokeObjectURL(reduite.apercu);
    if (!depot.ok) {
      setAttente(false);
      setErreur(depot.erreur);
      return;
    }
    return choisir({ image: depot.id });
  };

  const choisie = actuel.imageId !== null || actuel.locale === true || estVisuel(actuel.visuelChoisi);
  return (
    <Panneau
      titre="Choisir une image"
      sous={`Image ${pour}. Elle sert de repère à l’écran : elle n’entre pas dans le livre.`}
      onFermer={onFermer}
      pied={
        <>
          {choisie ? (
            <button type="button" className="btn btn--grand" disabled={attente} onClick={() => choisir({ defaut: true })}>
              Revenir au visuel par défaut
            </button>
          ) : null}
          <button type="button" className="btn btn--grand" onClick={onFermer}>
            Fermer
          </button>
        </>
      }
    >
      <section>
        <input
          ref={fichier}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          aria-label="Fichier de l’image"
          onChange={(e) => {
            const choisi = e.target.files?.[0];
            e.target.value = "";
            void importer(choisi);
          }}
        />
        <button type="button" className="btn btn--primaire" data-focus disabled={attente} aria-busy={attente || undefined} onClick={() => fichier.current?.click()}>
          <Icone nom="importer" />
          Importer une image
        </button>
        <p>JPEG, PNG ou WebP, 20 Mo au plus.</p>
        {erreur ? (
          <p className="erreur" role="alert">
            {erreur}
          </p>
        ) : null}
      </section>
      {images.length ? (
        <section aria-labelledby="ci-projet">
          <h3 id="ci-projet">Images du projet</h3>
          <ul className="vignettes">
            {images.map((id, i) => (
              <li key={id}>
                <button
                  type="button"
                  className="vignette-choix"
                  aria-pressed={actuel.imageId === id}
                  aria-label={`Image ${i + 1} du projet`}
                  disabled={attente}
                  onClick={() => choisir({ image: id })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- images servies par l'application */}
                  <img className="image-couvrante" src={`/images/${id}?v=1`} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="ci-visuels">
        <h3 id="ci-visuels">Visuels proposés</h3>
        <ul className="vignettes">
          {VISUELS.map((v) => (
            <li key={v.cle}>
              <button
                type="button"
                className="vignette-choix"
                aria-pressed={actuel.imageId === null && !actuel.locale && actuel.visuelChoisi === v.cle}
                aria-label={v.nom}
                title={v.nom}
                disabled={attente}
                onClick={() => choisir({ visuel: v.cle })}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- visuels livrés avec l'application */}
                <img className="image-couvrante" src={adresseVisuel(v.cle)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </Panneau>
  );
}
