"use client";

import { useEffect, useState, useTransition } from "react";
import { offreDuProjet, type OffreDuProjet } from "@/app/(adulte)/projet/actions-offre";
import { acheterLePass } from "@/app/(adulte)/projet/actions-paiement";
import { enEuros, type Limite, type Limites, type Offre } from "@/domaine/offre";
import { adresseRepereEnGrand } from "@/domaine/visuels";
import { Bulle } from "./Bulle";
import { Dialogue } from "./Dialogue";
import { Icone } from "./Icone";
import styles from "./OffreDuPass.module.css";

/** « 20 octobre 2026 » */
const jourEnMots = (iso: string): string =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso));

/** Ce qui ne compte pas dans les limites, dit d'une phrase (F14, « Ce que la formule lève »). */
export const NE_COMPTE_PAS = "Les scènes de la corbeille ne comptent pas, ni les images de repérage et les portraits.";

/**
 * Le pass d'un livre (F14-AC13, AC14, AC16) : une étiquette de livre, comme un ex-libris collé
 * sur la page de garde, qui dit ce que le pass lève et ce qu'il donne. Elle sert au dialogue
 * d'une limite atteinte et aux réglages du projet ; reçu, le pass garde son étiquette, datée.
 * `enTete` : la limite qui vient d'arrêter l'adulte, dite d'abord.
 */
export function CarteDuPass({ titre, offre, enTete = "scenes", recuLe = null }: { titre: string; offre: Offre; enTete?: Limite; recuLe?: string | null }) {
  const leve = { scenes: "Scènes sans limite", images: "Images sans limite" };
  return (
    <div className={`${styles.carte} ${recuLe ? styles.recue : ""}`}>
      <p className={styles.nom}>Pass du livre</p>
      <p className={styles.titre}>« {titre} »</p>
      <ul className={styles.leve}>
        {(enTete === "images" ? (["images", "scenes"] as const) : (["scenes", "images"] as const)).map((l) => (
          <li key={l}>
            <Icone nom="coche" /> {leve[l]}
          </li>
        ))}
        {offre.etoilesDuPass > 0 ? (
          <li>
            <Icone nom="coche" /> {offre.etoilesDuPass} étoiles ✦ pour les aides IA
          </li>
        ) : null}
      </ul>
      <p className={styles.prix}>
        {recuLe ? (
          <>Reçu le {jourEnMots(recuLe)}</>
        ) : (
          <>
            <strong>{enEuros(offre.prixDuPass)}</strong> une fois, pour ce livre
          </>
        )}
      </p>
    </div>
  );
}

/** Le bouton qui ouvre le paiement du pass ; l'erreur s'affiche dessous. Le prix, quand l'étiquette n'est pas à côté. */
export function AcheterLePass({ projetId, offre, plein = true, avecPrix = true }: { projetId: string; offre: Offre; plein?: boolean; avecPrix?: boolean }) {
  const [enCours, lancer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const acheter = () =>
    lancer(async () => {
      setErreur(null);
      // Un abandon chez Stripe ramène ici (F14-AC20)
      const r = await acheterLePass(projetId, `${window.location.pathname}${window.location.search}`);
      if (r.ok) window.location.assign(r.adresse);
      else setErreur(r.erreur);
    });
  return (
    <>
      <button type="button" className={`btn ${plein ? "btn--primaire" : ""}`} onClick={acheter} disabled={enCours} aria-busy={enCours || undefined}>
        {avecPrix ? `Acheter le pass · ${enEuros(offre.prixDuPass)}` : "Acheter le pass"}
      </button>
      {erreur ? (
        <span className={styles.erreur} role="alert">
          {erreur}
        </span>
      ) : null}
    </>
  );
}

/**
 * Dans les réglages du projet : où en est le livre au regard des limites gratuites, puis son pass ;
 * ou le pass reçu, avec sa date. Rien d'autre : le dialogue s'ouvre seul quand une limite bloque.
 */
export function LivreGratuit({ projetId, titre, offre, limites }: { projetId: string; titre: string; offre: Offre; limites: Limites }) {
  if (limites.pass) {
    return (
      <section className={styles.etat}>
        <h3>Pass du livre</h3>
        <CarteDuPass titre={titre} offre={offre} recuLe={limites.passLe} />
      </section>
    );
  }
  if (!limites.limite) return null;
  const plein = (n: number, max: number) => (n >= max ? styles.atteint : undefined);
  return (
    <section className={styles.etat} id="pass-du-livre">
      <h3>Pass du livre</h3>
      <p className={styles.compte}>
        <span className={plein(limites.scenes, limites.scenesGratuites)}>
          <strong>{limites.scenes}</strong> scène{limites.scenes > 1 ? "s" : ""} sur {limites.scenesGratuites}
        </span>
        {" · "}
        <span className={plein(limites.images, limites.imagesGratuites)}>
          <strong>{limites.images}</strong> image{limites.images > 1 ? "s" : ""} sur {limites.imagesGratuites}
        </span>{" "}
        <Bulle question="Qu’est-ce qui compte ?">{NE_COMPTE_PAS}</Bulle>
      </p>
      <CarteDuPass titre={titre} offre={offre} />
      <p className={styles.commandes}>
        <AcheterLePass projetId={projetId} offre={offre} plein={false} avecPrix={false} />
      </p>
    </section>
  );
}

const TITRES: Record<Limite, (o: Offre) => string> = {
  scenes: (o) => `Ce livre a atteint ses ${o.scenesGratuites} scènes gratuites`,
  images: (o) => `Ce livre a atteint ses ${o.imagesGratuites} images gratuites`,
};

/**
 * Demande, d'où qu'on soit dans un projet, le dialogue d'une limite atteinte. `rappel` : ouvert
 * depuis le décompte, sans qu'aucun geste n'ait été refusé.
 */
export function ouvrirOffreDuPass(projetId: string, limite: Limite, rappel = false): void {
  window.dispatchEvent(new CustomEvent("offre-du-pass", { detail: { projetId, limite, rappel } }));
}

/**
 * Le dialogue d'une limite atteinte, posé une fois dans l'espace adulte : rien n'a été créé, tout
 * le reste continue, la corbeille ne compte pas, et le pass lève la limite. Il relit l'offre du
 * projet à l'ouverture ; sans « Paiement ouvert », il ne s'ouvre pas.
 */
export function OffreDuPass() {
  const [ouvert, setOuvert] = useState<{ offre: OffreDuProjet; limite: Limite; rappel: boolean } | null>(null);
  useEffect(() => {
    const ouvrir = async (e: Event) => {
      const { projetId, limite, rappel } = (e as CustomEvent<{ projetId: string; limite: Limite; rappel?: boolean }>).detail;
      const offre = await offreDuProjet(projetId);
      if (offre) setOuvert({ offre, limite, rappel: rappel === true });
    };
    window.addEventListener("offre-du-pass", ouvrir);
    return () => window.removeEventListener("offre-du-pass", ouvrir);
  }, []);
  if (!ouvert) return null;
  const { offre, limite, rappel } = ouvert;
  const refuse = rappel ? "" : limite === "scenes" ? "La scène n’a pas été ajoutée. " : "L’image n’a pas été posée. ";
  return (
    <Dialogue
      titre={TITRES[limite](offre.offre)}
      fermer="Plus tard"
      onFermer={() => setOuvert(null)}
      boutons={<AcheterLePass projetId={offre.projetId} offre={offre.offre} />}
    >
      <p className={styles.rien}>
        {refuse}Tout le reste continue : écrire, faire le PDF, partager.{" "}
        {limite === "scenes" ? "Les scènes de la corbeille ne comptent pas." : "Les images de repérage et les portraits ne comptent pas."}
      </p>
      <CarteDuPass titre={offre.titre} offre={offre.offre} enTete={limite} />
    </Dialogue>
  );
}

/**
 * Au retour du pass payé (F14-AC18) : un merci, l'image du livre, son étiquette reçue, le solde
 * d'étoiles qui vient d'être garni et ce qu'il sert à payer. Une fois, puis l'adresse se nettoie.
 */
export function MerciDuPass({
  titre, offre, repere, projetId, recuLe, solde,
}: {
  titre: string;
  offre: Offre;
  repere: { imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null };
  projetId: string;
  recuLe: string;
  solde: number | null;
}) {
  const [ouvert, setOuvert] = useState(true);
  // L'adresse se nettoie sans relire la page : relue sans « message », elle retirerait ce merci
  useEffect(() => {
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);
  if (!ouvert) return null;
  const fermer = () => setOuvert(false);
  return (
    <Dialogue
      titre="Merci ! Votre livre a son pass"
      fermer={null}
      onFermer={fermer}
      boutons={
        <button type="button" className="btn btn--primaire" onClick={fermer}>
          Continuer l’écriture
        </button>
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- images servies par l'application */}
      <img className={styles.image} src={adresseRepereEnGrand(repere, projetId)} alt="" decoding="async" />
      <CarteDuPass titre={titre} offre={offre} recuLe={recuLe} />
      {solde !== null && offre.etoilesDuPass > 0 ? (
        <div className={styles.etoiles}>
          <p>
            <span className={styles.gain}>+{offre.etoilesDuPass} ✦</span> Votre solde : <strong>{solde} ✦</strong>
          </p>
          <p className={styles.usage}>Les étoiles paient les aides IA : correction, idées, images. Chacune en use quelques-unes ; le solde se lit dans « Mon compte ».</p>
        </div>
      ) : null}
      <p className={styles.rien}>La facture vous arrive par courriel. Belle écriture !</p>
    </Dialogue>
  );
}
