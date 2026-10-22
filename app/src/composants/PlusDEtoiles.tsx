"use client";

import { useEffect, useState, useTransition } from "react";
import { acheterUneRecharge, offreDeRecharge } from "@/app/(adulte)/projet/actions-paiement";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { enEuros } from "@/domaine/offre";
import { Dialogue } from "./Dialogue";
import { Icone } from "./Icone";
import styles from "./OffreDuPass.module.css";

const EVENEMENT = "plus-d-etoiles";

/**
 * L'appel d'une aide depuis le navigateur : `fetch`, et, si l'aide est refusée faute d'étoiles,
 * le dialogue de recharge demandé d'où qu'on soit (F14-AC38). La réponse est rendue intacte :
 * chaque aide dit son message à sa place, comme avant.
 */
export async function appelerUneAide(adresse: string, init: RequestInit): Promise<Response> {
  const reponse = await fetch(adresse, init);
  void reponse
    .clone()
    .json()
    .then((j: { message?: unknown } | null) => {
      if (j?.message === MESSAGES_IA.etoiles) window.dispatchEvent(new Event(EVENEMENT));
    })
    .catch(() => {});
  return reponse;
}

/**
 * Plus d'étoiles, une aide demandée (F14-AC38) : « Paiement ouvert » allumé, une recharge se
 * propose sur place, de la même famille que le pass sans lui ressembler ; éteint, rien ne
 * s'ouvre, le message de l'aide suffit. Posé une fois dans l'espace adulte.
 */
export function PlusDEtoiles() {
  const [offre, setOffre] = useState<{ prix: number; etoiles: number } | null>(null);
  const [enCours, lancer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    const ouvrir = async () => setOffre(await offreDeRecharge());
    window.addEventListener(EVENEMENT, ouvrir);
    return () => window.removeEventListener(EVENEMENT, ouvrir);
  }, []);
  if (!offre) return null;
  const recharger = () =>
    lancer(async () => {
      setErreur(null);
      // Un abandon chez Stripe ramène ici (F14-AC20)
      const r = await acheterUneRecharge(`${window.location.pathname}${window.location.search}`);
      if (r.ok) window.location.assign(r.adresse);
      else setErreur(r.erreur);
    });
  return (
    <Dialogue
      titre="Vous n’avez plus d’étoiles"
      fermer="Plus tard"
      onFermer={() => setOffre(null)}
      boutons={
        <>
          <button type="button" className="btn btn--primaire" onClick={recharger} disabled={enCours} aria-busy={enCours || undefined}>
            Recharger · {enEuros(offre.prix)}
          </button>
          {erreur ? (
            <span className={styles.erreur} role="alert">
              {erreur}
            </span>
          ) : null}
          <span className={styles.sur}>
            <Icone nom="cadenas" /> Paiement par Stripe · facture par courriel
          </span>
        </>
      }
    >
      <p className={styles.rien}>Aucune aide n’est partie. Tout le reste continue : écrire, faire le PDF, partager.</p>
      <div className={`${styles.carte} ${styles.recharge}`}>
        <p className={styles.nom}>Recharge</p>
        <p className={styles.etoilesRecharge}>
          {offre.etoiles} <span aria-hidden="true">✦</span>
        </p>
        <p className={styles.pourQuoi}>pour les aides IA de tous vos projets</p>
        <p className={styles.prix}>
          <strong>{enEuros(offre.prix)}</strong> une fois
        </p>
      </div>
    </Dialogue>
  );
}
