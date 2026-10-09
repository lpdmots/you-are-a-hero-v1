"use client";

import { useActionState } from "react";
import { Icone } from "@/composants/Icone";
import { usePret } from "@/composants/Pret";
import { ouvrir, type EtatOuverture } from "./actions";

const depart: EtatOuverture = {};

export function OuvrirLaClasse() {
  const [etat, action, enCours] = useActionState(ouvrir, depart);
  const pret = usePret();
  return (
    <form action={action}>
      <label className="champ champ--plein">
        <span>Identifiant de la classe</span>
        <input type="text" name="identifiant" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
      </label>
      <label className="champ champ--plein">
        <span>Mot de passe de la classe</span>
        <input type="text" name="mot-de-passe" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} required />
      </label>
      {etat.erreur ? (
        <p className="erreur" role="alert">
          <Icone nom="alerte" />
          <span>{etat.erreur}</span>
        </p>
      ) : null}
      <button type="submit" className="btn btn--primaire btn--grand btn--large" disabled={enCours || !pret}>
        Entrer
        <Icone nom="fleche" />
      </button>
    </form>
  );
}
