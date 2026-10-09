"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Icone } from "@/composants/Icone";
import { usePret } from "@/composants/Pret";
import { choisirMotDePasse, demanderNouveauMotDePasse, seConnecter, type EtatFormulaire } from "./actions";

const depart: EtatFormulaire = {};

function Erreur({ texte }: { texte?: string }) {
  return texte ? (
    <p className="erreur" role="alert">
      <Icone nom="alerte" />
      <span>{texte}</span>
    </p>
  ) : null;
}

export function FormulaireEntree() {
  const [etat, action, enCours] = useActionState(seConnecter, depart);
  const pret = usePret();
  return (
    <form action={action}>
      <label className="champ champ--plein">
        <span>Adresse électronique</span>
        <input type="email" name="adresse" autoComplete="username" required />
      </label>
      <label className="champ champ--plein">
        <span>Mot de passe</span>
        <input type="password" name="mot-de-passe" autoComplete="current-password" required />
      </label>
      <Erreur texte={etat.erreur} />
      <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret}>
        Entrer
        <Icone nom="fleche" />
      </button>
      <p>
        <Link href="/entree/oubli">Mot de passe oublié</Link>
      </p>
    </form>
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
        <input type="email" name="adresse" autoComplete="username" required />
      </label>
      <Erreur texte={etat.erreur} />
      <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret}>
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
        <input type="password" name="mot-de-passe" autoComplete="new-password" minLength={8} required />
      </label>
      <Erreur texte={etat.erreur} />
      <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret}>
        Enregistrer ce mot de passe
      </button>
    </form>
  );
}
