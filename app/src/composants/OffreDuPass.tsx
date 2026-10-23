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
 * Dans les réglages du projet : où en est le livre au regard des limites gratuites, puis « Acheter
 * le pass », ce qu'il donne dans un « i » ; ou le pass reçu, en une ligne datée. Resserré le
 * 21 octobre 2026 (le panneau tenait deux écrans) : l'étiquette du pass reste au dialogue d'une
 * limite atteinte, qui s'ouvre seul quand une limite bloque.
 */
export function LivreGratuit({ projetId, offre, limites }: { projetId: string; titre: string; offre: Offre; limites: Limites }) {
  if (limites.pass) {
    return (
      <section className={styles.etat}>
        <h3>Pass du livre</h3>
        <p className={styles.recu}>
          <Icone nom="coche" />
          {limites.passLe ? `Reçu le ${jourEnMots(limites.passLe)} : ` : "Reçu : "}scènes et images sans limite pour ce livre.
        </p>
      </section>
    );
  }
  if (!limites.limite) return null;
  const plein = (n: number, max: number) => (n >= max ? styles.atteint : undefined);
  return (
    <section className={styles.etat} id="pass-du-livre">
      <span className="reg-ligne">
        <h3>Pass du livre</h3>
        <Bulle question="Que donne le pass ?">
          Payé une fois, pour ce livre : scènes et images sans limite
          {offre.etoilesDuPass > 0 ? `, et ${offre.etoilesDuPass} étoiles ✦ pour les aides IA` : ""}. {NE_COMPTE_PAS}
        </Bulle>
      </span>
      <p className={styles.compte}>
        <span className={plein(limites.scenes, limites.scenesGratuites)}>
          <strong>{limites.scenes}</strong> scène{limites.scenes > 1 ? "s" : ""} sur {limites.scenesGratuites}
        </span>
        {" · "}
        <span className={plein(limites.images, limites.imagesGratuites)}>
          <strong>{limites.images}</strong> image{limites.images > 1 ? "s" : ""} sur {limites.imagesGratuites}
        </span>
      </p>
      <p className={styles.commandes}>
        <AcheterLePass projetId={projetId} offre={offre} plein={false} />
      </p>
    </section>
  );
}

const TITRES: Record<Limite, (o: Offre) => string> = {
  scenes: (o) => `Ce livre a atteint ses ${o.scenesGratuites} scènes gratuites`,
  images: (o) => `Ce livre a atteint ses ${o.imagesGratuites} images gratuites`,
};

/**
 * Demande, d'où qu'on soit dans un projet, le dialogue du pass. `limite` : celle qui vient d'arrêter
 * l'adulte, ou null quand il ouvre l'offre avant toute limite, depuis le décompte des scènes (F14-AC43).
 * `rappel` : ouvert depuis le décompte, sans qu'aucun geste n'ait été refusé.
 */
export function ouvrirOffreDuPass(projetId: string, limite: Limite | null, rappel = false): void {
  window.dispatchEvent(new CustomEvent("offre-du-pass", { detail: { projetId, limite, rappel } }));
}

/** Une jauge de limite gratuite : pleine, elle passe à l'ambre (« cela attend »). */
function Jauge({ nom, n, max }: { nom: string; n: number; max: number }) {
  const plein = n >= max;
  return (
    <div className={`${styles.jauge} ${plein ? styles.jaugePleine : ""}`}>
      <span className={styles.jaugeNom}>{nom}</span>
      <span className={styles.jaugeTrait} aria-hidden="true">
        <span style={{ width: `${Math.min(100, Math.round((n / Math.max(1, max)) * 100))}%` }} />
      </span>
      <span className={styles.jaugeCompte}>
        <strong>{n}</strong> / {max}
      </span>
    </div>
  );
}

/**
 * Le dialogue d'une limite atteinte, posé une fois dans l'espace adulte : rien n'a été créé, tout
 * le reste continue, la corbeille ne compte pas, et le pass lève la limite. Il relit l'offre du
 * projet à l'ouverture ; sans « Paiement ouvert », il ne s'ouvre pas. Sa forme est celle d'une
 * offre : la couverture du livre à côté du pass, les deux jauges au-dessus, distincte du merci.
 */
export function OffreDuPass() {
  const [ouvert, setOuvert] = useState<{ offre: OffreDuProjet; limite: Limite | null; rappel: boolean } | null>(null);
  useEffect(() => {
    const ouvrir = async (e: Event) => {
      const { projetId, limite, rappel } = (e as CustomEvent<{ projetId: string; limite: Limite | null; rappel?: boolean }>).detail;
      const offre = await offreDuProjet(projetId);
      if (offre) setOuvert({ offre, limite, rappel: rappel === true });
    };
    window.addEventListener("offre-du-pass", ouvrir);
    return () => window.removeEventListener("offre-du-pass", ouvrir);
  }, []);
  if (!ouvert) return null;
  const { offre: o, limite, rappel } = ouvert;
  const { offre, limites } = o;
  const refuse = rappel || !limite ? "" : limite === "scenes" ? "La scène n’a pas été ajoutée. " : "L’image n’a pas été posée. ";
  const leve = limite === "images" ? ["Images sans limite", "Scènes sans limite"] : ["Scènes sans limite", "Images sans limite"];
  return (
    <Dialogue
      className={styles.dialogue}
      titre={limite ? TITRES[limite](offre) : `Ce livre est gratuit jusqu’à ${offre.scenesGratuites} scènes et ${offre.imagesGratuites} images`}
      fermer="Plus tard"
      onFermer={() => setOuvert(null)}
      boutons={
        <>
          <AcheterLePass projetId={o.projetId} offre={offre} />
          <span className={styles.sur}>
            <Icone nom="cadenas" /> Paiement par Stripe · facture par courriel
          </span>
        </>
      }
    >
      <p className={styles.rien}>
        {limite ? `${refuse}Tout le reste continue : écrire, faire le PDF, partager.` : "Le pass les lève pour toujours, quand vous voulez. Le PDF et le partage restent gratuits."}{" "}
        <Bulle question="Qu’est-ce qui compte ?">{NE_COMPTE_PAS}</Bulle>
      </p>
      <div className={styles.jauges}>
        <Jauge nom="Scènes" n={limites.scenes} max={limites.scenesGratuites} />
        <Jauge nom="Images" n={limites.images} max={limites.imagesGratuites} />
      </div>
      <div className={styles.offre}>
        <div className={styles.couverture} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- images servies par l'application */}
          <img src={adresseRepereEnGrand(o.repere, o.projetId)} alt="" decoding="async" />
        </div>
        <div className={styles.offreTexte}>
          <p className={styles.nom}>Pass du livre</p>
          <p className={styles.offreTitre}>« {o.titre} »</p>
          <ul className={styles.offreLeve}>
            {leve.map((l) => (
              <li key={l}>
                <Icone nom="coche" /> {l}
              </li>
            ))}
            {offre.etoilesDuPass > 0 ? (
              <li>
                <Icone nom="coche" /> {offre.etoilesDuPass} étoiles ✦ pour les aides IA
              </li>
            ) : null}
          </ul>
          <p className={styles.offrePrix}>
            <strong>{enEuros(offre.prixDuPass)}</strong> une fois, pour ce livre
          </p>
        </div>
      </div>
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
