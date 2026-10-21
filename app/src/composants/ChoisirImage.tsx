"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { chercherDesImages, listerImages, prendreUneImage } from "@/app/(adulte)/projet/actions-images";
import type { Repere } from "@/domaine/illustration";
import { adresseVisuel, estVisuel, VISUELS } from "@/domaine/visuels";
import type { DemandeDImage } from "@/serveur/images-creees";
import { Agrandissable } from "./Agrandissable";
import { useAidesIa } from "./AidesIa";
import { Icone } from "./Icone";
import { demandeDImage, fermerUneDemande, suivreLaDemande } from "@/app/(adulte)/projet/actions-images-creees";
import { demanderAuxImages, garderLaProposition } from "./imagesCreees";
import { suivreDesImages } from "./ImagesALAjout";
import { deposer, reduire, REFUS_IMPORT, type ImageReduite } from "./importer";
import { Panneau } from "./Panneau";

/** Sans accents ni majuscules : « foret » trouve « Forêt ». */
const simple = (t: string) => t.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").trim();

export type ChoixImage = { image: string } | { visuel: string } | { defaut: true } | { locale: ImageReduite };

/**
 * « Choisir une image » (F10.1) : le même sélecteur pour le projet, la partie et le
 * chapitre, à la création comme ensuite. Importer, réutiliser une image du projet,
 * retenir un visuel proposé, ou revenir au visuel par défaut.
 */
export function ChoisirImage({
  projetId, actuel, pour, creer, onChoisir, onFermer,
}: {
  /**
   * « ✦ Créer une image d'après le résumé » (F10.1), quand les aides sont proposées : ce que
   * l'image illustre, et pourquoi elle ne se crée pas encore (pas de résumé), s'il y a lieu
   */
  creer?: { sorte: Repere; id: string; raison?: string | null };
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
  // La bibliothèque d'images (F10.1, 21 octobre 2026) : un mot cherche dans les visuels et ses mots-clés
  const [terme, setTerme] = useState("");
  const [bibliotheque, setBibliotheque] = useState<{ id: string; mots: string[] }[]>([]);
  const [cherche, setCherche] = useState(false);

  useEffect(() => {
    // À la création d'un projet, rien ne peut encore être copié dans le projet : visuels seulement
    if (!projetId) return;
    let vivant = true;
    const minuterie = setTimeout(() => {
      void chercherDesImages(terme)
        .then((l) => {
          if (!vivant) return;
          setBibliotheque(l);
          setCherche(true);
        })
        .catch(() => {});
    }, terme ? 250 : 0);
    return () => {
      vivant = false;
      clearTimeout(minuterie);
    };
  }, [projetId, terme]);

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

  const prendre = async (id: string) => {
    if (!projetId) return;
    setErreur(null);
    setAttente(true);
    const r = await prendreUneImage(projetId, id);
    if (!r.ok) {
      setAttente(false);
      setErreur(r.erreur);
      return;
    }
    setImages((avant) => [r.id, ...avant]);
    return choisir({ image: r.id });
  };

  const motCherche = simple(terme);
  const visuels = VISUELS.filter((v) => !motCherche || simple(v.nom).includes(motCherche) || simple(v.cle).includes(motCherche));
  const choisie = actuel.imageId !== null || actuel.locale === true || estVisuel(actuel.visuelChoisi);
  const aides = useAidesIa();
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
      {creer && aides.proposer && projetId ? (
        <CreerDApresLeResume
          projetId={projetId}
          creer={creer}
          occupe={attente}
          onGarder={(image) => {
            setImages((avant) => [image, ...avant]);
            return choisir({ image });
          }}
        />
      ) : null}
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
        <input
          className="pchamp ci-chercher"
          type="search"
          aria-label="Chercher un visuel"
          placeholder="Chercher : forêt, mer, château…"
          value={terme}
          maxLength={60}
          onChange={(e) => setTerme(e.target.value)}
        />
        {terme.trim() && (cherche || !projetId) && !visuels.length && !bibliotheque.length ? <p>Aucun visuel pour « {terme.trim()} ».</p> : null}
        <ul className="vignettes">
          {visuels.map((v) => (
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
                <img className="image-couvrante" src={adresseVisuel(v.cle, true)} alt="" loading="lazy" />
              </button>
            </li>
          ))}
          {/* Les images de la bibliothèque, après les visuels livrés ; prise, l'image est copiée dans le projet */}
          {bibliotheque.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                className="vignette-choix"
                aria-label={b.mots.length ? `Image de la bibliothèque : ${b.mots.slice(0, 3).join(", ")}` : "Image de la bibliothèque"}
                title={b.mots.slice(0, 4).join(", ") || undefined}
                disabled={attente}
                onClick={() => void prendre(b.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- images servies par l'application */}
                <img className="image-couvrante" src={`/images/bibliotheque/${b.id}?v=1`} alt="" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </Panneau>
  );
}

/**
 * « ✦ Créer une image d'après le résumé » (F10.1, repris le 18 octobre 2026) : la demande part et
 * l'adulte peut fermer le panneau ou quitter la page ; la première image se pose d'office à son
 * arrivée. S'il y en a deux, la seconde attend ici, en tête, jusqu'à ce qu'il la garde ou la laisse.
 * Une image choisie entre-temps n'est pas remplacée.
 */
function CreerDApresLeResume({
  projetId, creer, occupe, onGarder,
}: {
  projetId: string;
  creer: { sorte: Repere; id: string; raison?: string | null };
  occupe: boolean;
  onGarder: (image: string) => Promise<void> | void;
}) {
  const routeur = useRouter();
  const [demande, setDemande] = useState<DemandeDImage | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [garde, setGarde] = useState<string | null>(null);
  const [arrivee, setArrivee] = useState<string | null>(null);
  // L'image arrivée, posée sur l'élément (ou gardée parmi les images du projet) : montrée, agrandie d'un clic
  const [posee, setPosee] = useState<string | null>(null);

  // La demande de l'élément, s'il y en a une en route ou prête
  useEffect(() => {
    let vivant = true;
    void demandeDImage(creer.sorte, creer.id)
      .then((d) => {
        if (!vivant) return;
        setDemande(d);
        if (d?.imagePosee) setPosee(d.imagePosee);
      })
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, [creer.sorte, creer.id]);
  // Tant qu'elle est en route, la demande se relit ; arrivée, la page aussi
  const enRoute = demande?.etat === "en_route";
  const suivie = enRoute ? demande.id : null;
  useEffect(() => {
    if (!suivie) return;
    const minuterie = setInterval(() => {
      void suivreLaDemande(suivie).then((d) => {
        if (!d || d.etat === "en_route") return;
        if (d.etat === "echec") {
          setDemande(null);
          setErreur(d.message ?? "L’image n’a pas pu être créée. Rien n’a changé.");
          return;
        }
        setDemande(d.etat === "prete" ? d : null);
        setPosee(d.imagePosee);
        setArrivee(d.message ? null : "Image posée.");
        if (d.message) setErreur(null);
        routeur.refresh();
      });
    }, 2500);
    return () => clearInterval(minuterie);
  }, [suivie, routeur]);

  const demander = async () => {
    setErreur(null);
    setArrivee(null);
    setPosee(null);
    setEnvoi(true);
    const r = await demanderAuxImages<{ ok: true; demande: string } | { ok: false; message: string }>({ demande: "reperage", sorte: creer.sorte, id: creer.id }, true);
    setEnvoi(false);
    if (!r.ok) return setErreur(r.message);
    suivreDesImages([creer.id]);
    setDemande({ id: r.demande, cible: creer.sorte, cibleId: creer.id, etat: "en_route", propositions: [], imagePosee: null, message: null, apresBloc: null, cadrage: null, detouree: false, alt: "" });
  };

  const autre = demande?.etat === "prete" ? demande.propositions[0] : undefined;
  const garder = async (proposition: string) => {
    if (!demande) return;
    setGarde(proposition);
    setErreur(null);
    const fait = await garderLaProposition(projetId, proposition, []);
    if (!fait.ok) {
      setGarde(null);
      return setErreur(fait.erreur);
    }
    await fermerUneDemande(demande.id);
    setDemande(null);
    setGarde(null);
    await onGarder(fait.id);
  };
  const laisser = async () => {
    if (!demande) return;
    await fermerUneDemande(demande.id);
    setDemande(null);
  };

  return (
    <section className="cree" aria-labelledby="ci-creer">
      <h3 id="ci-creer" className="vh">
        Créer une image
      </h3>
      {enRoute ? (
        <div className="cree__dessine" role="status" aria-label="L’IA dessine l’image">
          <span className="cree__attente">
            <Icone nom="ia" />
          </span>
          <span className="cree__aide">
            L’IA dessine un lieu d’après le résumé…
            <br />
            Vous pouvez fermer : elle se posera d’elle-même.
          </span>
        </div>
      ) : (
        <p className="cree__cmd">
          <button type="button" className="btn btn--ia" disabled={envoi || garde !== null || occupe || !!creer.raison} aria-busy={envoi || undefined} onClick={() => void demander()}>
            <Icone nom="ia" />
            {demande || arrivee ? "En créer une autre" : "Créer une image d’après le résumé"}
          </button>
          {creer.raison ? <span className="cree__aide">{creer.raison}</span> : null}
        </p>
      )}
      {posee && !enRoute ? (
        <div className="cree__posee">
          <Agrandissable className="cree__vignette" src={`/images/${posee}`} nom="L’image créée" fichier="Image créée.jpg">
            {/* eslint-disable-next-line @next/next/no-img-element -- image du projet, servie par l'application */}
            <img src={`/images/${posee}?v=1`} alt="" draggable={false} />
          </Agrandissable>
          {arrivee ? <span className="cree__aide">{arrivee}</span> : null}
        </div>
      ) : null}
      {demande?.message ? <p className="cree__aide">{demande.message}</p> : null}
      {autre ? (
        <div className="ia-propose cree__propositions" role="group" aria-labelledby="ci-props">
          <p className="ia-propose__tete" id="ci-props">
            <Icone nom="ia" />
            Une autre proposition <span>· la première est posée</span>
          </p>
          <ul>
            <li>
              <Agrandissable src={`/images/proposition/${projetId}/${autre}`} nom="L’autre proposition" fichier="Proposition.jpg">
                {/* eslint-disable-next-line @next/next/no-img-element -- image créée, en attente, servie par l'application */}
                <img src={`/images/proposition/${projetId}/${autre}`} alt="L’autre proposition" draggable={false} />
              </Agrandissable>
              <button type="button" className="btn btn--petit" disabled={garde !== null} aria-busy={garde === autre || undefined} onClick={() => void garder(autre)}>
                <Icone nom="coche" />
                Garder celle-ci
              </button>
            </li>
          </ul>
          <span className="ia-propose__gestes">
            <button type="button" className="btn btn--petit btn--discret" disabled={garde !== null} onClick={() => void laisser()}>
              Laisser
            </button>
          </span>
        </div>
      ) : null}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </section>
  );
}
