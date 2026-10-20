"use client";

import { useActionState } from "react";
import { BoutonEnvoi, envoyerParEntree } from "@/composants/Attente";
import { Icone } from "@/composants/Icone";
import { usePret } from "@/composants/Pret";
import Link from "next/link";
import { choisirMotDePasse, demanderNouveauMotDePasse, entrerAvecGoogle, renvoyerConfirmation, seConnecter, sInscrire, type EtatFormulaire } from "./actions";
import styles from "./entree.module.css";

const depart: EtatFormulaire = {};

function Erreur({ texte }: { texte?: string }) {
  return texte ? (
    <p className="erreur" role="alert">
      <Icone nom="alerte" />
      <span>{texte}</span>
    </p>
  ) : null;
}

const REFUS: Record<string, string> = {
  echec: "La connexion n’a pas abouti. Réessayez.",
  // Un lien de confirmation déjà ouvert, ou trop ancien (F14-AC01)
  lien: "Ce lien n’est plus valable. Si vous l’avez déjà ouvert, entrez avec votre mot de passe.",
};

/** Le « G » de Google, tel que Google demande de le montrer sur un bouton de connexion. */
function SigneGoogle() {
  return (
    <svg className={styles.signe} viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

/** « Renvoyer le courriel » de confirmation, à l'adresse déjà écrite. */
function Renvoyer({ adresse }: { adresse: string }) {
  const [etat, action] = useActionState(renvoyerConfirmation, depart);
  if (etat.fait) return <p role="status">Un nouveau courriel vient de partir.</p>;
  return (
    <form action={action} className={styles.renvoi}>
      <input type="hidden" name="email" value={adresse} />
      {etat.erreur ? <span role="alert">{etat.erreur}</span> : null}
      <BoutonEnvoi className="btn btn--petit">Renvoyer le courriel</BoutonEnvoi>
    </form>
  );
}

/** Le bouton de Google, en tête de l'entrée comme de l'inscription. */
function ContinuerAvecGoogle({ refus }: { refus?: string }) {
  const pret = usePret();
  return (
    <form action={entrerAvecGoogle}>
      <Erreur texte={refus ? (REFUS[refus] ?? REFUS.echec) : undefined} />
      <BoutonEnvoi className={`btn btn--grand btn--large ${styles.google}`} disabled={!pret}>
        <SigneGoogle />
        Continuer avec Google
      </BoutonEnvoi>
    </form>
  );
}

export function FormulaireEntree({ refus }: { refus?: string }) {
  const [etat, action, enCours] = useActionState(seConnecter, depart);
  const pret = usePret();
  return (
    <>
    <form action={action}>
      <label className="champ champ--plein">
        <span>Adresse électronique</span>
        <input type="email" id="email" name="email" autoComplete="username" defaultValue={etat.adresse} onKeyDown={envoyerParEntree} required />
      </label>
      <label className="champ champ--plein">
        <span>Mot de passe</span>
        <input type="password" id="password" name="password" autoComplete="current-password" onKeyDown={envoyerParEntree} required />
      </label>
      <Erreur texte={etat.erreur} />
      <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret} aria-busy={enCours || undefined}>
        Entrer
        <Icone nom="fleche" />
      </button>
    </form>
    {etat.nonConfirmee && etat.adresse ? <Renvoyer adresse={etat.adresse} /> : null}
    <p className={styles.ou}>
      <span>ou</span>
    </p>
    <ContinuerAvecGoogle refus={etat.erreur ? undefined : refus} />
    </>
  );
}

/** Phrase des conditions, sous les deux façons de créer un compte, sans case à cocher (F14-AC03). */
export function PhraseDesConditions() {
  return (
    <p className={styles.conditions}>
      En créant un compte, vous acceptez les <Link href="/conditions">conditions d’utilisation</Link> et la{" "}
      <Link href="/confidentialite">politique de confidentialité</Link>.
    </p>
  );
}

/**
 * Créer un compte (F14-AC01 à AC04) : Google en tête, comme à l'entrée, puis l'adresse et le
 * mot de passe. Envoyé, le formulaire laisse place à la même phrase, que l'adresse ait déjà un
 * compte ou non.
 */
export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState(sInscrire, depart);
  const pret = usePret();
  if (etat.fait) {
    return (
      <>
        <p role="status" className={styles.envoye}>
          Un courriel vient de partir vers <strong>{etat.adresse}</strong>. Ouvrez son lien pour entrer.
        </p>
        <p className={styles.conditions}>Rien reçu ? Regardez dans les indésirables, puis :</p>
        <Renvoyer adresse={etat.adresse ?? ""} />
      </>
    );
  }
  return (
    <>
      <ContinuerAvecGoogle />
      <p className={styles.ou}>
        <span>ou</span>
      </p>
      <form action={action}>
        <label className="champ champ--plein">
          <span>Adresse électronique</span>
          <input type="email" id="email" name="email" autoComplete="email" defaultValue={etat.adresse} onKeyDown={envoyerParEntree} required />
        </label>
        <label className="champ champ--plein">
          <span>Mot de passe, huit caractères au moins</span>
          <input type="password" id="password" name="password" autoComplete="new-password" minLength={8} onKeyDown={envoyerParEntree} required />
        </label>
        <Erreur texte={etat.erreur} />
        <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret} aria-busy={enCours || undefined}>
          Créer mon compte
        </button>
      </form>
      <PhraseDesConditions />
    </>
  );
}

export function FormulaireOubli() {
  const [etat, action, enCours] = useActionState(demanderNouveauMotDePasse, depart);
  const pret = usePret();
  if (etat.fait) {
    return (
      <p role="status">
        Si cette adresse a un compte, un courriel vient de partir. Ouvrez son lien sur cet ordinateur.
      </p>
    );
  }
  return (
    <form action={action}>
      <label className="champ champ--plein">
        <span>Adresse électronique</span>
        <input type="email" id="email" name="email" autoComplete="username" onKeyDown={envoyerParEntree} required />
      </label>
      <Erreur texte={etat.erreur} />
      <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret} aria-busy={enCours || undefined}>
        Recevoir le lien
      </button>
    </form>
  );
}

export function FormulaireNouveauMotDePasse() {
  const [etat, action, enCours] = useActionState(choisirMotDePasse, depart);
  const pret = usePret();
  return (
    <form action={action}>
      <label className="champ champ--plein">
        <span>Nouveau mot de passe</span>
        <input type="password" id="password" name="password" autoComplete="new-password" minLength={8} onKeyDown={envoyerParEntree} required />
      </label>
      <Erreur texte={etat.erreur} />
      <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret} aria-busy={enCours || undefined}>
        Enregistrer ce mot de passe
      </button>
    </form>
  );
}
