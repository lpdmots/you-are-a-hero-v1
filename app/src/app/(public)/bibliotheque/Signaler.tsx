"use client";

import { useEffect, useRef, useState } from "react";
import { signalerCeLivre } from "./actions";
import styles from "./bibliotheque.module.css";

const MOTIFS = [
  ["age", "Inadapté à l’âge des lecteurs"],
  ["haine", "Haine ou insultes"],
  ["vie-privee", "Vie privée"],
  ["droits", "Droits d’auteur"],
  ["autre", "Autre"],
] as const;

/**
 * « Signaler ce livre » (F15, « Signaler » ; F15-AC14) : un lien discret au pied du tiroir, qui
 * déplie un court formulaire — motif, passage facultatif, message, adresse de réponse. Envoyé, il
 * le dit en une phrase ; le livre reste publié jusqu'à la décision de l'éditeur.
 */
export function Signaler({ adresse, aChoix }: { adresse: string; aChoix: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);
  const formulaire = useRef<HTMLFormElement>(null);
  // Ouvert au pied du tiroir : il se montre, et le premier motif prend le focus
  useEffect(() => {
    if (!ouvert) return;
    formulaire.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    formulaire.current?.querySelector<HTMLInputElement>("input[type=radio]")?.focus({ preventScroll: true });
  }, [ouvert]);

  if (envoye)
    return (
      <p className={styles.signalEnvoye} role="status">
        Merci. Votre signalement est envoyé à l’équipe d’Il était une classe ; un accusé de réception part à votre adresse.
      </p>
    );
  if (!ouvert)
    return (
      <button type="button" className={`lien ${styles.signaler}`} onClick={() => setOuvert(true)}>
        Signaler ce livre
      </button>
    );

  const envoyer = async (f: FormData) => {
    setEnvoi(true);
    setErreur(null);
    const r = await signalerCeLivre(adresse, {
      motif: String(f.get("motif") ?? ""), passage: String(f.get("passage") ?? ""), message: String(f.get("message") ?? ""), courriel: String(f.get("courriel") ?? ""),
    });
    setEnvoi(false);
    if (r.ok) setEnvoye(true);
    else setErreur(r.erreur);
  };

  return (
    <form
      ref={formulaire}
      noValidate
      className={styles.signalement}
      aria-labelledby="signaler-t"
      onSubmit={(e) => {
        // Pas d'action de formulaire : React viderait les champs, même quand l'envoi est refusé
        e.preventDefault();
        void envoyer(new FormData(e.currentTarget));
      }}
    >
      <p id="signaler-t" className={styles.signalementTitre}>
        Signaler ce livre
      </p>
      <small>Il reste publié jusqu’à la décision de l’équipe d’Il était une classe, qui peut vous répondre. La classe ne reçoit pas votre signalement.</small>
      <fieldset>
        <legend>Pourquoi ?</legend>
        {MOTIFS.map(([valeur, nom]) => (
          <label key={valeur}>
            <input type="radio" name="motif" value={valeur} />
            {nom}
          </label>
        ))}
      </fieldset>
      {aChoix ? (
        <label className={styles.champCourt}>
          <span>Numéro du passage (facultatif)</span>
          <input name="passage" inputMode="numeric" pattern="[0-9]*" maxLength={4} />
        </label>
      ) : null}
      <label>
        <span>Ce qui pose problème</span>
        <textarea name="message" rows={3} maxLength={2000} />
      </label>
      <label>
        <span>Votre adresse électronique, pour la réponse</span>
        <input name="courriel" type="email" autoComplete="email" maxLength={254} />
      </label>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      <p className={styles.signalementPied}>
        <button type="submit" className="btn" disabled={envoi} aria-busy={envoi || undefined}>
          {envoi ? "Un instant…" : "Envoyer le signalement"}
        </button>
        <button type="button" className="lien" onClick={() => setOuvert(false)}>
          Annuler
        </button>
      </p>
    </form>
  );
}
