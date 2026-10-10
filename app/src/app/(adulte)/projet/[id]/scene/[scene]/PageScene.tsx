"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { chapitresDe, departDe, referenceScene, scenesDe, type Plan } from "@/domaine/recit";
import { reglerScene } from "../../../actions-recit";
import { useCommandesScene } from "../../_plan/commandes";
import { ChoisirDepart } from "../../_plan/Panneaux";
import { varsCouleur } from "../../_plan/Plan";
import styles from "./scene.module.css";

/**
 * La page d'une scène, pour l'adulte. À l'étape 2 du plan de réalisation, on y prépare la
 * scène : son titre, sa consigne (F07.1), ses repères de départ et de fin (F03.2). Le
 * texte s'y écrira à l'étape 3.
 */
export function PageScene({ projet, plan, sceneId }: { projet: { id: string; deClasse: boolean; aChoix: boolean }; plan: Plan; sceneId: string }) {
  const routeur = useRouter();
  const scene = scenesDe(plan).find((s) => s.id === sceneId)!;
  const chapitre = chapitresDe(plan).find((c) => c.id === scene.chapitreId)!;
  const depart = departDe(plan);
  const [titre, setTitre] = useState(scene.titre ?? "");
  const [consigne, setConsigne] = useState(scene.consigne);
  const [etat, setEtat] = useState<"" | "attente" | "enregistre" | "erreur">("");
  const [choixDepart, setChoixDepart] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ce qui attend d'être enregistré : le titre et la consigne partent ensemble, aucun ne chasse l'autre
  const enAttente = useRef<{ titre?: string; consigne?: string }>({});
  const retour = `/projet/${projet.id}/chapitre/${chapitre.id}`;
  const commandes = useCommandesScene({ projetId: projet.id, plan, onChoisirDepart: () => setChoixDepart(true), apresSuppression: () => routeur.push(retour) });

  const envoyer = async () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    const valeurs = enAttente.current;
    enAttente.current = {};
    if (Object.keys(valeurs).length === 0) return;
    const fait = await reglerScene(scene.id, valeurs);
    // Une frappe arrivée entre-temps garde « Enregistrement… » jusqu'à son propre envoi
    if (Object.keys(enAttente.current).length === 0) setEtat(fait.ok ? "enregistre" : "erreur");
  };
  const enregistrer = (valeurs: { titre?: string; consigne?: string }) => {
    setEtat("attente");
    enAttente.current = { ...enAttente.current, ...valeurs };
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void envoyer(), 700);
  };
  // Quitter la page n'abandonne pas ce qui attendait
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
      if (Object.keys(enAttente.current).length) void reglerScene(scene.id, enAttente.current);
    },
    [scene.id],
  );

  const ref = referenceScene(scene.reference);
  return (
    <div className="sur-chapitre" style={varsCouleur(chapitre.couleur)}>
      <nav className="fil" aria-label="Fil d’Ariane">
        <Link href={retour}>
          <Icone nom="fleche-g" />
          Retour à {chapitre.titre}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{ref}</span>
      </nav>

      <header className={styles.tete}>
        <span className="fiche__ref">{ref}</span>
        <h1>
          <label className="vh" htmlFor="scene-titre">
            Titre de la scène
          </label>
          <input
            id="scene-titre"
            className={styles.titre}
            type="text"
            value={titre}
            maxLength={120}
            placeholder="Titre de la scène"
            onChange={(e) => {
              setTitre(e.target.value);
              enregistrer({ titre: e.target.value });
            }}
            onBlur={() => void envoyer()}
          />
        </h1>
        <span className="tampon" data-e="vide">
          <Icone nom="vide" />
          Texte vide
        </span>
        <Menu libelle={`Autres commandes de la scène ${ref}`} discret>
          {(fermer) => (
            <>
              {projet.aChoix ? (
                <>
                  <button type="button" onClick={() => { fermer(); if (depart?.id === scene.id) commandes.retirerDepart(); else commandes.designer(scene); }}>
                    {depart?.id === scene.id ? "Retirer le départ du livre" : "Départ du livre"}
                  </button>
                  <button type="button" onClick={() => { fermer(); commandes.basculerFin(scene); }}>
                    {scene.fin ? "Retirer le repère de fin" : "Fin de l’histoire"}
                  </button>
                  <hr />
                </>
              ) : null}
              <button type="button" onClick={() => { fermer(); commandes.basculerHorsLivre(scene); }}>
                {scene.horsLivre ? "Réintégrer dans le livre" : "Exclure du livre"}
              </button>
              <button type="button" onClick={() => { fermer(); commandes.supprimerScene(scene); }}>
                Supprimer
              </button>
            </>
          )}
        </Menu>
      </header>
      <p className={styles.reperes}>
        {depart?.id === scene.id ? (
          <span className="repere repere--depart">
            <Icone nom="drapeau" />
            Départ du livre
          </span>
        ) : null}
        {scene.fin ? (
          <span className="repere repere--fin">
            <Icone nom="fin" />
            Fin de l’histoire
          </span>
        ) : null}
        {scene.horsLivre ? <span className="repere">hors du livre</span> : null}
        <span className={styles.etat} role="status">
          {etat === "attente" ? "Enregistrement…" : etat === "enregistre" ? "Enregistré" : etat === "erreur" ? "Cela n’a pas pu être enregistré." : ""}
        </span>
      </p>

      <div className={styles.colonnes}>
        <section className={styles.copie} aria-labelledby="scene-texte">
          <h2 id="scene-texte">Texte de la scène</h2>
          <p>Le texte s’écrira ici. L’éditeur se construit à l’étape 3 du plan.</p>
        </section>
        <section className="carnet-fiche" aria-labelledby="scene-consigne-t">
          <header>
            <h2 id="scene-consigne-t">
              <label htmlFor="scene-consigne">Consigne</label> <span className="facultatif">facultative</span>
            </h2>
          </header>
          <div className="carnet-fiche__corps">
            <textarea
              id="scene-consigne"
              className="pchamp"
              rows={7}
              maxLength={4000}
              value={consigne}
              placeholder="Ce que la scène doit raconter."
              onChange={(e) => {
                setConsigne(e.target.value);
                enregistrer({ consigne: e.target.value });
              }}
              onBlur={() => void envoyer()}
            />
            <p className={styles.aide}>
              {projet.deClasse
                ? "Les élèves du chapitre la lisent en ouvrant la scène. Sans consigne écrite, ils suivent celle que vous leur avez donnée."
                : "Un rappel de ce que la scène doit raconter."}
            </p>
          </div>
        </section>
      </div>

      {choixDepart ? (
        <ChoisirDepart
          plan={plan}
          onChoisir={(id) => {
            const autre = scenesDe(plan).find((x) => x.id === id);
            setChoixDepart(false);
            if (autre) commandes.designer(autre);
          }}
          onFermer={() => setChoixDepart(false)}
        />
      ) : null}
      {commandes.dialogue}
    </div>
  );
}
