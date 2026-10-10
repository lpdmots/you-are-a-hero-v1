"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { Panneau } from "@/composants/Panneau";
import { choisirClasseDuProjet } from "../../../projets/actions";
import styles from "./projet.module.css";

type ClasseOfferte = { id: string; nom: string; annee: string; eleves: number };

/**
 * La classe d'un projet de classe, sous son titre. Elle se choisit et se change tant
 * qu'aucun chapitre n'est attribué (F01-AC24).
 */
export function ClasseDuProjet({
  projetId, titre, classeId, libelle, classes, attribue,
}: {
  projetId: string; titre: string; classeId: string | null; libelle: string; classes: ClasseOfferte[];
  /** Un chapitre au moins est attribué : la classe ne se change plus (F01-AC24) */
  attribue: boolean;
}) {
  const routeur = useRouter();
  const dire = useMessage();
  const [ouvert, setOuvert] = useState(false);
  const [choix, setChoix] = useState(classeId ?? (classes.length === 1 ? classes[0].id : ""));
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, lancer] = useTransition();

  const choisir = () => {
    setErreur(null);
    lancer(async () => {
      const resultat = await choisirClasseDuProjet(projetId, choix);
      if (resultat.erreur) {
        setErreur(resultat.erreur);
        return;
      }
      const classe = classes.find((c) => c.id === choix);
      setOuvert(false);
      routeur.refresh();
      dire({ texte: `« ${titre} » est le projet de ${classe?.nom ?? "la classe"}. Les élèves commencent quand vous leur attribuez un chapitre.` });
    });
  };

  return (
    <>
      {libelle}
      {attribue ? null : (
        <>
          {" · "}
          <button type="button" className="lien" onClick={() => setOuvert(true)}>
            {classeId ? "Changer de classe" : "Choisir une classe"}
          </button>
        </>
      )}
      {ouvert ? (
        <Panneau
          titre="Classe du projet"
          sous={titre}
          onFermer={() => setOuvert(false)}
          pied={
            classes.length ? (
              <button type="button" className="btn btn--primaire btn--grand" disabled={!choix || choix === classeId || enCours} aria-busy={enCours || undefined} onClick={choisir}>
                Choisir cette classe
              </button>
            ) : (
              <button type="button" className="btn btn--grand" onClick={() => setOuvert(false)}>
                Fermer
              </button>
            )
          }
        >
          {classes.length ? (
            <>
              <section>
                <fieldset className={styles.classes}>
                  <legend className="vh">Classe</legend>
                  {classes.map((c) => (
                    <label key={c.id} className={styles.classe}>
                      <input type="radio" name="classe-du-projet" value={c.id} checked={choix === c.id} onChange={() => setChoix(c.id)} />
                      <span>
                        <b>{c.nom}</b>
                        <span>
                          {c.annee} · {c.eleves ? `${c.eleves} élève${c.eleves > 1 ? "s" : ""}` : "aucun élève inscrit"}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>
                {erreur ? (
                  <p className="erreur" role="alert">
                    <Icone nom="alerte" />
                    <span>{erreur}</span>
                  </p>
                ) : null}
              </section>
              <section>
                <p>Choisir la classe ne donne encore aucun accès aux élèves. Ils commencent quand vous leur attribuez un chapitre.</p>
              </section>
            </>
          ) : (
            <section>
              <p>Vous n’avez pas encore de classe.</p>
              <Link className="btn" href="/classes?nouvelle=1">
                <Icone nom="plus" />
                Créer ma classe
              </Link>
            </section>
          )}
        </Panneau>
      ) : null}
    </>
  );
}
