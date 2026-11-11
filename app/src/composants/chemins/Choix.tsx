"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { NoeudDeChemin } from "@/domaine/chemins";
import { estChoix, type Choix, type Liaison } from "@/domaine/copie";
import {
  automatisee, avecDestination, avecDestinationsOrdonnees, avecPhrase, avecUneDestinationDePlus, ongletsDuChoix, sansRenvoi, seuleDestination,
} from "@/domaine/modifier-choix";
import { constructionsUtiles, type Construction, type FormuleRenvoi } from "@/domaine/preparation";
import { Contexte, type ContexteDeCopie, type Livre, type Services } from "../copie/contexte";
import { FicheReglagesChoix, type GestesDeChoix } from "../copie/FicheChoix";
import { FicheLiaison } from "../copie/Liaisons";
import { useEnregistrement } from "../Enregistrement";
import { Icone } from "../Icone";

/**
 * Modifier un choix depuis « Chemins » (F03.1, F03-AC70 à AC76) : l'onglet d'un choix, ou sa ligne dans
 * « Ses choix », ouvre ce choix dans l'espace de travail, à la place de la scène. C'est le panneau des
 * réglages d'un choix de la copie, en entier (F05.2) : un choix se modifie de la même façon partout. Ce
 * qu'on y change est enregistré aussitôt, à la place du choix dans le texte de sa scène, sans arrêter
 * celui qui l'écrit (F08-AC44).
 */

type Resultat = { ok: true } | { ok: false; erreur: string };

/** Ce que la page offre à l'écran d'un choix : lire sa phrase, l'enregistrer, et les gestes qui le font partir. */
export type ServicesDuChoix = {
  projetId: string;
  chapitreId: string;
  /** Le livre autour du chapitre, d'après le plan : ses scènes, leurs numéros. La façon d'annoncer un numéro arrive avec le choix */
  livre: Omit<Livre, "formule" | "constructions">;
  /** Ce que les réglages demandent au serveur : chercher une destination, créer une scène, fixer un numéro */
  services: Services;
  lire: (sceneId: string, lienId: string) => Promise<{ ok: true; bloc: Choix | Liaison; formule: FormuleRenvoi; constructions: Construction[] } | { ok: false; erreur: string }>;
  modifier: (sceneId: string, bloc: Choix) => Promise<{ ok: boolean; erreur?: string }>;
  /** Chacun dit son résultat, avec « Annuler » (F03-AC74) */
  supprimer: (sceneId: string, bloc: Choix) => Promise<Resultat>;
  cacher: (sceneId: string, bloc: Choix, cible: string) => Promise<Resultat>;
  proposer: (sceneId: string, liaison: Liaison, libelle: string) => Promise<Resultat>;
  retirerLiaison: (sceneId: string, liaison: Liaison) => Promise<Resultat>;
};

const rien = () => {};

type Lu = { bloc: Choix | Liaison; formule: FormuleRenvoi; constructions: Construction[] };

export function PanneauDeChoix({
  scene, lienId, services, onRevenir, onOnglets, avant,
}: {
  scene: NoeudDeChemin;
  /** L'onglet cliqué : le renvoi d'une phrase, ou un lien caché */
  lienId: string;
  services: ServicesDuChoix;
  /** « ← » : l'espace de travail montre de nouveau la scène (F03-AC74) */
  onRevenir: () => void;
  /** Les onglets de ce choix, tels qu'ils sont à présent : le schéma les garde désignés (F03-AC70) */
  onOnglets: (ids: string[]) => void;
  /** Juste avant d'enregistrer : le schéma retient la carte qui ne doit pas bouger */
  avant: () => void;
}) {
  const id = useId();
  const e = useEnregistrement();
  const [lu, setLu] = useState<Lu | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Le choix tel qu'on le règle : l'écran le tient, le serveur le reçoit après chaque geste
  const [bloc, setBloc] = useState<Choix | Liaison | null>(null);
  const [enGeste, setEnGeste] = useState(false);
  const retour = useRef<HTMLButtonElement>(null);
  // La lecture qui dure se dit ; celle qui revient aussitôt ne fait rien clignoter
  const [tarde, setTarde] = useState(false);

  useEffect(() => {
    let actif = true;
    const minuteur = setTimeout(() => setTarde(true), 350);
    void services.lire(scene.id, lienId).then((fait) => {
      if (!actif) return;
      clearTimeout(minuteur);
      if (!fait.ok) return setErreur(fait.erreur);
      setBloc(fait.bloc);
      setLu(fait);
      onOnglets(ongletsDuChoix(fait.bloc));
    });
    retour.current?.focus({ preventScroll: true });
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ce que les réglages lisent du livre : celui du plan, et la façon d'annoncer un numéro, lue avec le choix
  const contexte = useMemo<ContexteDeCopie | null>(
    () =>
      lu && {
        livre: { ...services.livre, formule: lu.formule, constructions: lu.constructions },
        droits: { role: "adulte" },
        lieu: { projetId: services.projetId, sceneId: scene.id, chapitreId: services.chapitreId },
        pourEleve: false,
        enseignant: null,
        // Le texte de la scène n'est pas ici : rien de ce qui s'y écrit ne s'ouvre
        ecrireAvant: rien, ouvrirFormules: rien, reglerSigne: rien, supprimerBloc: rien, ouvrirImage: rien, ouvrirSymbole: rien, ouvrirLiaison: rien,
        fiche: null, apercu: null, formuleVue: { texte: "", signe: "crayon" }, ouvrir: rien, tire: null, commencerATirer: rien,
      },
    [lu, services.livre, services.projetId, services.chapitreId, scene.id],
  );

  /** Le choix prend sa nouvelle forme à l'écran, puis dans le texte de sa scène ; le schéma suit. */
  const changer = (suite: Choix, delai: number) => {
    if (suite === bloc) return;
    setBloc(suite);
    onOnglets(ongletsDuChoix(suite));
    avant();
    e.prevoir(() => services.modifier(scene.id, suite), delai, "choix");
  };
  /** Un geste qui fait partir le choix : ce qui attendait est d'abord enregistré, puis l'on revient à la scène. */
  const partir = async (geste: () => Promise<Resultat>) => {
    if (enGeste) return;
    setEnGeste(true);
    await e.partir();
    avant();
    const fait = await geste();
    setEnGeste(false);
    if (fait.ok) onRevenir();
  };

  /** Les gestes des réglages : chacun rend la phrase d'après, comme dans la copie (domaine/modifier-choix). */
  const gestes = (phrase: Choix, livre: Livre): GestesDeChoix => ({
    regler: (valeurs) => changer({ ...phrase, ...valeurs } as Choix, 0),
    reglerRenvoi: (renvoi, valeurs) => {
      if ("cible" in valeurs) changer(avecDestination(phrase, renvoi, (valeurs.cible as string | null) ?? null), 0);
    },
    // La phrase s'écrit : elle part après une courte pause dans la frappe
    ecrire: (textes) => changer(avecPhrase(phrase, textes, livre.formule), 700),
    automatiser: () => changer(automatisee(phrase, constructionsUtiles(livre.formule, livre.constructions)), 0),
    ajouterDestination: ({ cible }) => changer(avecUneDestinationDePlus(phrase, cible, livre.formule), 0),
    retirerRenvoi: (renvoi) => changer(sansRenvoi(phrase, renvoi), 0),
    ordonner: (cibles) => changer(avecDestinationsOrdonnees(phrase, cibles), 0),
    supprimer: () => void partir(() => services.supprimer(scene.id, phrase)),
    cacher: services.services.fixerNumero
      ? () => {
          const cible = seuleDestination(phrase);
          if (cible) void partir(() => services.cacher(scene.id, phrase, cible));
        }
      : undefined,
  });

  const titre = scene.titre ?? "Scène sans titre";
  return (
    <aside className="panneau-chemin panneau-choix" aria-labelledby={`${id}-nom`} aria-busy={enGeste || undefined}>
      <header className="panneau-chemin__tete">
        <button ref={retour} type="button" className="btn btn--discret panneau-choix__retour" title="Revenir à la scène (Échap)" onClick={onRevenir}>
          <Icone nom="fleche-g" />
          <span id={`${id}-nom`}>
            <span className="vh">Revenir à la scène </span>
            {titre}
          </span>
        </button>
        <p className={`enregistre${e.enCours ? " enregistre--attente" : ""}`} role="status">
          {e.enCours ? (
            "Enregistrement…"
          ) : e.enregistre ? (
            <>
              <Icone nom="coche" />
              Enregistré
            </>
          ) : null}
        </p>
      </header>
      <div
        className="panneau-choix__corps"
        // « Changer… » et « + » ouvrent la liste des scènes sous les destinations : elle vient en vue, sans qu'on la cherche
        onClick={(ev) => {
          const corps = ev.currentTarget;
          if (!(ev.target as Element).closest?.("button[aria-expanded]")) return;
          requestAnimationFrame(() => corps.querySelector(".cx-issues")?.scrollIntoView({ block: "nearest", behavior: "smooth" }));
        }}
      >
        {erreur ? (
          <p className="erreur" role="alert">
            {erreur}
          </p>
        ) : !bloc || !contexte ? (
          <p className="panneau-chemin__aucun" role="status">
            {tarde ? "Ouverture du choix…" : null}
          </p>
        ) : (
          <Contexte value={contexte}>
            {estChoix(bloc) ? (
              <FicheReglagesChoix
                // La même fiche quand la phrase, modifiée, cesse d'être automatique : on y est en train d'écrire
                key={bloc.id}
                bloc={bloc}
                services={services.services}
                gestes={gestes(bloc, contexte.livre)}
                onFermer={onRevenir}
              />
            ) : (
              <FicheLiaison
                key={bloc.id}
                liaison={bloc}
                services={services.services}
                gestes={{
                  // La fiche se referme d'elle-même avant le geste : on est déjà revenu à la scène
                  proposer: (liaison, libelle) => void services.proposer(scene.id, liaison, libelle),
                  retirer: (liaison) => void services.retirerLiaison(scene.id, liaison),
                }}
                onFermer={onRevenir}
              />
            )}
          </Contexte>
        )}
        {e.erreur ? (
          <p className="erreur" role="alert">
            {e.erreur}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
