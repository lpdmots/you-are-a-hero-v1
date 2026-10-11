"use client";

import { useState } from "react";
import { Icone } from "@/composants/Icone";
import type { Liaison } from "@/domaine/copie";
import { RepereDeLiaison } from "./Blocs";
import { useCopie, type Services } from "./contexte";
import { nomDeDestination } from "./FicheChoix";

/**
 * « Hors du récit · jamais imprimé » : la zone sous le texte où se rappellent les liaisons
 * cachées de la scène (F05.1, F05.2). Le pointillé et la clé désignent le lien caché, comme
 * dans la lecture d'essai. L'adulte y règle chaque lien ; l'élève y lit le numéro que son
 * énigme doit donner, sans commande (F05-AC37).
 */

export type GestesDeLiaison = {
  /** « Proposer comme choix » : une phrase automatique reprend le lien (F05-AC26) */
  proposer: (liaison: Liaison, libelle: string) => void;
  retirer: (liaison: Liaison) => void;
};

export function HorsRecit({ liaisons, lecture }: { liaisons: Liaison[]; /** La copie ne s'écrit plus : les liens se lisent, sans réglage */ lecture: boolean }) {
  const { livre, pourEleve, droits, fiche, ouvrirLiaison } = useCopie();
  if (liaisons.length === 0) return null;
  const regle = droits.role === "adulte" && !lecture;
  return (
    <section className="hors-recit" aria-label="Hors du récit">
      <p className="hors-recit__titre">Hors du récit · jamais imprimé</p>
      {liaisons.map((liaison) => {
        const ouverte = fiche?.sorte === "liaison" && fiche.liaison === liaison.id;
        return regle ? (
          <div key={liaison.id} className={`lien-cache${ouverte ? " est-ouvert" : ""}`}>
            <button type="button" className="lien-cache__corps" aria-expanded={ouverte} onClick={() => ouvrirLiaison(liaison.id)}>
              <RepereDeLiaison liaison={liaison} livre={livre} pourEleve={false} />
              <span className="lien-cache__regler">Régler ce lien</span>
            </button>
          </div>
        ) : (
          <p key={liaison.id} className="lien-cache lien-cache--lu">
            <RepereDeLiaison liaison={liaison} livre={livre} pourEleve={pourEleve} />
          </p>
        );
      })}
    </section>
  );
}

/** Les réglages d'une liaison cachée : son numéro, « Proposer comme choix », son retrait. */
export function FicheLiaison({ liaison, services, gestes, onFermer }: { liaison: Liaison; services: Services; gestes: GestesDeLiaison; onFermer: () => void }) {
  const { livre } = useCopie();
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [attente, setAttente] = useState(false);
  const [libelle, setLibelle] = useState<string | null>(null);
  const scene = livre.scenes.find((s) => s.id === liaison.cible);
  const nom = nomDeDestination(scene, false);
  const numero = liaison.cible ? livre.numeros[liaison.cible] : undefined;
  const fixe = liaison.cible ? livre.fixes[liaison.cible] : undefined;
  const estDepart = !!liaison.cible && liaison.cible === livre.depart;
  const voulu = Number.parseInt(saisie, 10);

  const fixer = async (n: number | null) => {
    if (!liaison.cible || !services.fixerNumero) return;
    setAttente(true);
    setErreur(null);
    const fait = await services.fixerNumero(liaison.cible, n);
    setAttente(false);
    if (!fait.ok) return setErreur(fait.erreur);
    setSaisie("");
  };

  return (
    <section
      className="cx"
      aria-label={scene ? `Lien caché · ${nom}` : "Lien caché"}
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        onFermer();
      }}
    >
      <header className="cx__tete">
        <Icone nom="cle" />
        <h3>Lien caché{scene ? ` · ${nom}` : ""}</h3>
        <button type="button" className="btn btn--discret cx__fermer" onClick={onFermer} aria-label="Fermer la fiche">
          <Icone nom="fermer" />
        </button>
      </header>
      <div className="cx__corps">
        <p className="cx-aide">Le lecteur trouve lui-même où poursuivre : rien ne s’imprime ici. L’énigme s’écrit dans le texte.</p>
        {scene ? (
          <div className="cx-numero">
            <p className="cx-titre">Le numéro que doit donner l’énigme</p>
            <p>
              {estDepart
                ? `${nom} est le départ du livre : il porte toujours le n° 1.`
                : numero
                  ? `${nom} porte le n° ${numero}${fixe ? ", fixé : le passage le garde, même si d’autres changent de place." : ". Il n’est plus fixé : il peut changer."}`
                  : `${nom} n’a pas de numéro : elle est hors du livre.`}
            </p>
            {estDepart ? null : (
              <form
                className="fiche-numero__autre"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (Number.isInteger(voulu) && voulu >= 1) void fixer(voulu);
                }}
              >
                {numero && !fixe ? (
                  <button type="button" className="btn" disabled={attente} onClick={() => void fixer(null)}>
                    Fixer le n° {numero}
                  </button>
                ) : null}
                <label className="champ">
                  <span>Un autre numéro</span>
                  <input className="pchamp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={saisie} onChange={(e) => setSaisie(e.target.value.replace(/\D/g, ""))} />
                </label>
                <button type="submit" className="btn" disabled={attente || !Number.isInteger(voulu) || voulu < 1}>
                  Fixer ce numéro
                </button>
              </form>
            )}
            {erreur ? (
              <p className="erreur" role="alert">
                {erreur}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="cx-note cx-note--bloque">
            <Icone nom="bloque" />
            <span>Ce lien caché mène à une scène supprimée. Retirez-le, ou restaurez la scène depuis la corbeille du projet.</span>
          </p>
        )}
        {scene ? (
          libelle === null ? (
            <p className="cx__cmd">
              <button
                type="button"
                className="btn btn--petit"
                onClick={() => {
                  // Le libellé que portait le choix avant d'être caché ; à défaut, on le demande
                  if (!liaison.libelle) return setLibelle("");
                  onFermer();
                  gestes.proposer(liaison, liaison.libelle);
                }}
              >
                Proposer comme choix
              </button>
              <span className="cx-aide">Une phrase de choix remplace alors le lien caché, à la fin du texte.</span>
            </p>
          ) : (
            <form
              className="fiche-numero__autre"
              onSubmit={(e) => {
                e.preventDefault();
                if (!libelle.trim()) return;
                onFermer();
                gestes.proposer(liaison, libelle.trim());
              }}
            >
              <label className="champ champ--plein">
                <span>Ce que fait le lecteur</span>
                <input className="pchamp" type="text" maxLength={200} value={libelle} autoFocus placeholder="Par exemple : Déchiffrer les symboles" onChange={(e) => setLibelle(e.target.value)} />
              </label>
              <button type="submit" className="btn" disabled={!libelle.trim()}>
                Proposer comme choix
              </button>
            </form>
          )
        ) : null}
      </div>
      <footer className="cx__pied">
        <button
          type="button"
          className="btn btn--danger cx__suppr"
          onClick={() => {
            onFermer();
            gestes.retirer(liaison);
          }}
        >
          <Icone nom="corbeille" />
          Retirer ce lien caché
        </button>
      </footer>
    </section>
  );
}
