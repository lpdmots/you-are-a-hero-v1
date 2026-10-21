"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { changerAdresse, changerMotDePasse } from "@/app/(adulte)/actions-compte";
import { Icone } from "@/composants/Icone";
import styles from "./compte.module.css";

/**
 * La feuille « Connexion » de « Mon compte » (F01, 21 octobre 2026) : l'adresse et le mot de
 * passe, chacun derrière « Changer ». Rien ne s'ouvre avant qu'on le demande ; une seule
 * modification à la fois.
 */
export function Connexion({ courriel, motDePasse, adresseEnAttente }: { courriel: string | null; motDePasse: boolean; adresseEnAttente: string | null }) {
  const id = useId();
  const routeur = useRouter();
  const [ouvert, setOuvert] = useState<"adresse" | "mot-de-passe" | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enAttente, setEnAttente] = useState(adresseEnAttente);
  const [change, setChange] = useState(false);
  const [envoi, lancer] = useTransition();

  const ouvrir = (quoi: "adresse" | "mot-de-passe" | null) => {
    setOuvert(quoi);
    setErreur(null);
    setChange(false);
  };

  const envoyerAdresse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nouvelle = String(new FormData(e.currentTarget).get("adresse") ?? "").trim();
    lancer(async () => {
      const r = await changerAdresse(nouvelle);
      if (!r.ok) return setErreur(r.erreur);
      setEnAttente(nouvelle);
      ouvrir(null);
      routeur.refresh();
    });
  };

  const envoyerMotDePasse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    lancer(async () => {
      const r = await changerMotDePasse(String(donnees.get("actuel") ?? ""), String(donnees.get("nouveau") ?? ""));
      if (!r.ok) return setErreur(r.erreur);
      ouvrir(null);
      setChange(true);
      routeur.refresh();
    });
  };

  return (
    <section className={styles.bloc} aria-labelledby={`${id}-connexion`}>
      <h2 id={`${id}-connexion`}>Connexion</h2>
      <div className={styles.lignes}>
        <div className={styles.ligne}>
          <span className={styles.nomReglage}>Adresse électronique</span>
          {ouvert === "adresse" ? (
            <form className={styles.formulaire} onSubmit={envoyerAdresse}>
              <label className={styles.champLegende}>
                <span>Nouvelle adresse</span>
                <input className="pchamp" name="adresse" type="email" autoComplete="email" required autoFocus />
              </label>
              {erreur ? (
                <p className="erreur" role="alert">
                  {erreur}
                </p>
              ) : null}
              <div className={styles.boutons}>
                <button type="submit" className="btn btn--primaire" disabled={envoi} aria-busy={envoi || undefined}>
                  Envoyer le lien
                </button>
                <button type="button" className="lien" onClick={() => ouvrir(null)}>
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.commande}>
              <span className={styles.valeur}>{courriel}</span>
              <button type="button" className="btn btn--petit" onClick={() => ouvrir("adresse")} aria-label="Changer d’adresse">
                Changer
              </button>
              {enAttente ? (
                <p className={styles.attenteAdresse} role="status">
                  Un lien de confirmation est parti vers {enAttente}. Ouvrez-le. Si un courriel arrive aussi à votre adresse actuelle,
                  ouvrez également son lien. D’ici là, vous entrez avec votre adresse actuelle.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className={styles.ligne}>
          <span className={styles.nomReglage}>Mot de passe</span>
          {ouvert === "mot-de-passe" ? (
            <form className={styles.formulaire} onSubmit={envoyerMotDePasse}>
              {motDePasse ? (
                <label className={styles.champLegende}>
                  <span>Mot de passe actuel</span>
                  <input className="pchamp" name="actuel" type="password" autoComplete="current-password" required autoFocus />
                </label>
              ) : null}
              <label className={styles.champLegende}>
                <span>{motDePasse ? "Nouveau mot de passe" : "Mot de passe"}</span>
                <input
                  className="pchamp"
                  name="nouveau"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  placeholder="Huit caractères au moins"
                  required
                  autoFocus={!motDePasse}
                />
              </label>
              {erreur ? (
                <p className="erreur" role="alert">
                  {erreur}
                </p>
              ) : null}
              <div className={styles.boutons}>
                <button type="submit" className="btn btn--primaire" disabled={envoi} aria-busy={envoi || undefined}>
                  Enregistrer
                </button>
                <button type="button" className="lien" onClick={() => ouvrir(null)}>
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.commande}>
              <span className={styles.valeur}>{motDePasse ? "••••••••" : "Aucun : vous entrez avec Google"}</span>
              <button
                type="button"
                className="btn btn--petit"
                onClick={() => ouvrir("mot-de-passe")}
                aria-label={motDePasse ? "Changer de mot de passe" : "Choisir un mot de passe"}
              >
                {motDePasse ? "Changer" : "Choisir un mot de passe"}
              </button>
              {change ? (
                <span className={`${styles.etat} ${styles.fait}`} role="status">
                  <Icone nom="coche" />
                  Mot de passe enregistré
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
