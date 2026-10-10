"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { ALT_MAX, LARGEUR_MIN, LARGEURS, LEGENDE_MAX, type ImageBloc, type ImageLigne } from "@/domaine/copie";
import { adresseImage } from "./Blocs";
import type { Services } from "./contexte";

/**
 * Les fiches des images (F10 ; docs/design.md, « Étape 3 : écrans arrêtés avant de
 * construire »). Une seule commande pose une image : on l'importe ou on reprend une image du
 * projet, puis on dit où la mettre — « Dans le texte », en bloc, ou « Sur la ligne », à la
 * hauteur du texte. L'image en bloc activée ouvre ses réglages dessous, comme un choix.
 */

function Cadre({ titre, onFermer, children, pied }: { titre: string; onFermer: () => void; children: ReactNode; pied?: ReactNode }) {
  return (
    <section
      className="cx cx--image"
      aria-label={titre}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        onFermer();
      }}
    >
      <header className="cx__tete">
        <Icone nom="image" />
        <h3>{titre}</h3>
        <button type="button" className="btn btn--discret cx__fermer" onClick={onFermer} aria-label="Fermer la fiche">
          <Icone nom="fermer" />
        </button>
      </header>
      <div className="cx__corps">{children}</div>
      {pied ? <footer className="cx__pied">{pied}</footer> : null}
    </section>
  );
}

/** « Importer une image », ou l'une des images déjà importées dans le projet (F10-AC27). */
function ChoisirUneImage({ services, onChoisir, focus }: { services: Services; onChoisir: (image: string) => void; focus?: boolean }) {
  const [images, setImages] = useState<string[] | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const fichier = useRef<HTMLInputElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let actif = true;
    void services.imagesDuProjet?.().then((lues) => {
      if (actif) setImages(lues);
    });
    if (focus) bouton.current?.focus();
    return () => {
      actif = false;
    };
  }, [services, focus]);

  const importer = async (choisi: File | undefined) => {
    if (!choisi || !services.importerImage) return;
    setAttente(true);
    setErreur(null);
    const fait = await services.importerImage(choisi);
    setAttente(false);
    if (fichier.current) fichier.current.value = "";
    // Rien n'est posé dans le texte tant que l'image n'est pas arrivée entière (F10-AC30)
    if (!fait.ok) return setErreur(`${fait.erreur} Rien n’a été posé dans le texte.`);
    setImages((avant) => [fait.id, ...(avant ?? [])]);
    onChoisir(fait.id);
  };

  return (
    <div className="cx-images">
      <p className="cx__cmd">
        <button type="button" className="btn" ref={bouton} disabled={attente} aria-busy={attente || undefined} onClick={() => fichier.current?.click()}>
          <Icone nom="importer" />
          {attente ? "Import en cours…" : "Importer une image"}
        </button>
        <span className="cx-aide">JPEG, PNG ou WebP, 20 Mo au plus.</span>
        <input ref={fichier} className="vh" type="file" tabIndex={-1} aria-label="Fichier de l’image" accept="image/jpeg,image/png,image/webp" onChange={(e) => void importer(e.target.files?.[0])} />
      </p>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      {images?.length ? (
        <>
          <p className="cx-titre">Images du projet</p>
          <ul className="cx-vignettes" aria-label="Images du projet">
            {images.map((id, i) => (
              <li key={id}>
                <button type="button" onClick={() => onChoisir(id)} aria-label={`Image ${i + 1} du projet`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir */}
                  <img src={adresseImage(id)} alt="" loading="lazy" />
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** Poser une image : la choisir, puis dire où la mettre. */
export function FichePoserImage({
  services, surLaLigne, onPoser, onFermer,
}: {
  services: Services;
  /** Le curseur est-il dans un paragraphe qui admet une image sur la ligne ? */
  surLaLigne: boolean;
  onPoser: (image: string, ou: "bloc" | "ligne") => void; onFermer: () => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  return (
    <Cadre titre="Image" onFermer={onFermer}>
      {image ? (
        <div className="cx-poser">
          {/* eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir */}
          <img className="cx-poser__apercu" src={adresseImage(image)} alt="" />
          <div className="cx-ou">
            <p className="cx-titre">Où mettre cette image ?</p>
            {/* Chaque choix se montre : l'image entre deux paragraphes, ou petite dans une phrase */}
            <div className="cx-ou__choix" role="group" aria-label="Où mettre cette image ?">
              <button type="button" className="cx-ou__carte" autoFocus onClick={() => onPoser(image, "bloc")}>
                <span className="cx-ou__schema" aria-hidden="true">
                  <i />
                  <i className="cx-ou__court" />
                  {/* eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir */}
                  <img src={adresseImage(image)} alt="" />
                  <i />
                  <i className="cx-ou__court" />
                </span>
                <span className="cx-ou__nom">Dans le texte</span>
                <span className="cx-ou__aide">Entre deux paragraphes, comme une illustration.</span>
              </button>
              <button type="button" className="cx-ou__carte" disabled={!surLaLigne} onClick={() => onPoser(image, "ligne")}>
                <span className="cx-ou__schema cx-ou__schema--ligne" aria-hidden="true">
                  <i />
                  <span>
                    <i />
                    {/* eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir */}
                    <img src={adresseImage(image)} alt="" />
                    <i />
                  </span>
                  <i />
                  <i className="cx-ou__court" />
                </span>
                <span className="cx-ou__nom">Sur la ligne</span>
                <span className="cx-ou__aide">Dans une phrase, à la hauteur des lettres, comme un symbole.</span>
              </button>
            </div>
            {surLaLigne ? null : <p className="cx-aide">Pour la mettre sur la ligne, placez d’abord le curseur dans un paragraphe.</p>}
            <button type="button" className="lien" onClick={() => setImage(null)}>
              Changer d’image
            </button>
          </div>
        </div>
      ) : (
        <ChoisirUneImage services={services} onChoisir={setImage} focus />
      )}
    </Cadre>
  );
}

/** Un champ d'une ligne qui s'enregistre en le quittant ou par Entrée. */
function Champ({ nom, valeur, max, aide, exemple, onChange }: { nom: string; valeur: string; max: number; aide?: string; exemple?: string; onChange: (v: string) => void }) {
  const [saisie, setSaisie] = useState(valeur);
  const valider = () => {
    const propre = saisie.replace(/\s+/g, " ").trim();
    if (propre !== valeur) onChange(propre);
  };
  return (
    <label className="champ champ--plein">
      <span>{nom}</span>
      <input
        className="pchamp"
        type="text"
        maxLength={max}
        value={saisie}
        placeholder={exemple}
        onChange={(e) => setSaisie(e.target.value)}
        onBlur={valider}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          e.stopPropagation();
          valider();
        }}
      />
      {aide ? <span className="cx-aide">{aide}</span> : null}
    </label>
  );
}

/** Les réglages d'une image en bloc : largeur, remplacement, ce qu'elle montre, légende, suppression. */
export function FicheImageBloc({
  bloc, services, regler, supprimer, onFermer,
}: {
  bloc: ImageBloc; services: Services;
  /** Change des propriétés de l'image ; une valeur vide retire la propriété */
  regler: (valeurs: Partial<Pick<ImageBloc, "image" | "largeur" | "page" | "alt" | "legende">>) => void;
  supprimer: () => void; onFermer: () => void;
}) {
  const [remplace, setRemplace] = useState(false);
  const [pourcent, setPourcent] = useState(String(bloc.largeur));
  const segment = bloc.page ? "page" : bloc.largeur === LARGEURS.petite ? "petite" : bloc.largeur === LARGEURS.moyenne ? "moyenne" : bloc.largeur === LARGEURS.pleine ? "pleine" : null;
  const largeur = (n: number) => {
    setPourcent(String(n));
    regler({ largeur: n, page: undefined });
  };
  const validerPourcent = () => {
    const n = Math.round(Number.parseInt(pourcent, 10));
    if (!Number.isFinite(n)) return setPourcent(String(bloc.largeur));
    largeur(Math.min(100, Math.max(LARGEUR_MIN, n)));
  };
  return (
    <Cadre
      titre="Image"
      onFermer={onFermer}
      pied={
        <button type="button" className="btn btn--danger cx__suppr" onClick={supprimer}>
          <Icone nom="corbeille" />
          Supprimer
        </button>
      }
    >
      <fieldset className="cx-issues">
        <legend>Largeur</legend>
        <div className="cx-seg" role="radiogroup" aria-label="Largeur">
          {(
            [
              ["petite", "Petite"],
              ["moyenne", "Moyenne"],
              ["pleine", "Pleine largeur"],
            ] as const
          ).map(([cle, nom]) => (
            <label key={cle}>
              <input type="radio" name="largeur" checked={segment === cle} onChange={() => largeur(LARGEURS[cle])} />
              <span>{nom}</span>
            </label>
          ))}
          <label>
            <input type="radio" name="largeur" checked={segment === "page"} onChange={() => { setPourcent("100"); regler({ largeur: 100, page: true }); }} />
            <span>Pleine page</span>
          </label>
        </div>
        <label className="champ cx-pourcent">
          <span>Largeur, en pourcentage de la page</span>
          <input
            className="pchamp"
            type="text"
            inputMode="numeric"
            maxLength={3}
            disabled={!!bloc.page}
            value={pourcent}
            onChange={(e) => setPourcent(e.target.value.replace(/\D/g, ""))}
            onBlur={validerPourcent}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              e.stopPropagation();
              validerPourcent();
            }}
          />
        </label>
        {bloc.page ? <p className="cx-aide">Dans le livre, l’image occupera seule une page.</p> : null}
      </fieldset>
      <Champ key={`l-${bloc.legende ?? ""}`} nom="Légende" valeur={bloc.legende ?? ""} max={LEGENDE_MAX} exemple="Le pont, dessiné par Chloé" aide="Facultative. Elle se lit sous l’image, dans la copie comme dans le livre." onChange={(v) => regler({ legende: v || undefined })} />
      <Champ key={`a-${bloc.alt ?? ""}`} nom="Ce que montre l’image" valeur={bloc.alt ?? ""} max={ALT_MAX} exemple="un pont de cordes dans la brume" aide="Facultatif. Lu à voix haute à qui ne voit pas l’image ; jamais imprimé." onChange={(v) => regler({ alt: v || undefined })} />
      <p className="cx__cmd">
        <button type="button" className="btn btn--petit" aria-expanded={remplace} onClick={() => setRemplace(!remplace)}>
          Remplacer l’image
        </button>
      </p>
      {remplace ? (
        <ChoisirUneImage
          services={services}
          onChoisir={(image) => {
            regler({ image });
            setRemplace(false);
          }}
        />
      ) : null}
    </Cadre>
  );
}

/** Les réglages d'une image sur la ligne : ce qu'elle montre, et sa suppression. */
export function FicheSymbole({ image, regler, supprimer, onFermer }: { image: ImageLigne; regler: (valeurs: { alt?: string }) => void; supprimer: () => void; onFermer: () => void }) {
  return (
    <Cadre
      titre="Image sur la ligne"
      onFermer={onFermer}
      pied={
        <button type="button" className="btn btn--danger cx__suppr" onClick={supprimer}>
          <Icone nom="corbeille" />
          Supprimer
        </button>
      }
    >
      <Champ
        key={image.alt ?? ""}
        nom="Ce que montre l’image"
        valeur={image.alt ?? ""}
        max={ALT_MAX}
        exemple="lune"
        aide="Facultatif. Lu à voix haute, et écrit entre crochets quand la phrase est copiée ailleurs : « [lune] »."
        onChange={(v) => regler({ alt: v || undefined })}
      />
    </Cadre>
  );
}
