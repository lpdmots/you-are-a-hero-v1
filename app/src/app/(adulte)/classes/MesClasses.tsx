"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Gommette, PlacesVides } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { Panneau } from "@/composants/Panneau";
import { formerIdentifiant, identifiantPourClasse } from "@/domaine/acces";
import { libelleAnnee } from "@/domaine/annee";
import { trier } from "@/domaine/eleves";
import { textePlage } from "@/domaine/horaires";
import { pluriel } from "@/domaine/texte";
import type { Classe } from "@/serveur/lectures";
import { AideClasses } from "./AideClasses";
import { creerClasse } from "./actions";
import styles from "./classes.module.css";

export const horairesEnTexte = (c: Pick<Classe, "horairesLimites" | "plages">): string[] =>
  c.horairesLimites && c.plages.length ? c.plages.map(textePlage) : ["Pas de limite d’horaire"];

export function MesClasses({
  classes, annees, aideMasquee, aideVue, nouvelle, message,
}: {
  classes: Classe[];
  annees: number[];
  aideMasquee: boolean;
  aideVue: boolean;
  nouvelle: boolean;
  message: string | null;
}) {
  const routeur = useRouter();
  const [aide, setAide] = useState(!aideMasquee && !aideVue && !nouvelle && !message);
  const [vue, setVue] = useState(aideVue);
  const [panneau, setPanneau] = useState(nouvelle);
  const [nom, setNom] = useState("");
  const [annee, setAnnee] = useState(annees[0]);
  // L'identifiant suit le nom tant que l'enseignant ne l'a pas écrit lui-même (F06-AC85)
  const [identifiant, setIdentifiant] = useState("");
  const [identifiantEcrit, setIdentifiantEcrit] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [erreurIdentifiant, setErreurIdentifiant] = useState<string | null>(null);
  const [enCours, lancer] = useTransition();

  if (aide) {
    return (
      <div className="page">
        <h1 className="vh">Mes classes</h1>
        <AideClasses dejaVue={vue} masquee={aideMasquee} onCommencer={() => { setVue(true); setAide(false); }} />
      </div>
    );
  }

  const creer = () => {
    if (enCours) return;
    if (!nom.trim()) {
      setErreur("Donnez un nom à la classe.");
      return;
    }
    setErreur(null);
    setErreurIdentifiant(null);
    lancer(async () => {
      const resultat = await creerClasse(nom, annee, identifiant);
      if (!resultat.ok) {
        if (resultat.champ === "identifiant") setErreurIdentifiant(resultat.erreur);
        else setErreur(resultat.erreur);
        return;
      }
      // Proposé, jamais d'office : une classe d'une année antérieure encore en cours (F01-AC20)
      const ancienne = classes.find((c) => c.enCours && c.anneeDebut < annee);
      routeur.push(`/classes/${resultat.id}?message=creee${ancienne ? `&terminer=${ancienne.id}` : ""}`);
    });
  };

  const boutonAide = (
    <button type="button" className="aide-bouton" onClick={() => setAide(true)} title="Que fait-on ici ?">
      <Icone nom="aide" />
      Aide
    </button>
  );
  const cours = classes.filter((c) => c.enCours);
  const passees = classes.filter((c) => !c.enCours);

  return (
    <div className="page">
      {message ? <MessageAuChargement texte={message} /> : null}
      <header className="page-tete">
        <h1>Mes classes</h1>
        <div className="page-tete__cmd">
          {boutonAide}
          {classes.length ? (
            <button type="button" className="btn" onClick={() => setPanneau(true)}>
              <Icone nom="plus" />
              Nouvelle classe
            </button>
          ) : null}
        </div>
      </header>

      {!classes.length ? (
        <section className={styles.vide} aria-labelledby="vide-t">
          <div className={styles.places} aria-hidden="true">
            <PlacesVides nombre={7} />
          </div>
          <h2 id="vide-t">Pas encore de classe</h2>
          <p>Créez-la quand vos élèves commencent à écrire. D’ici là, votre histoire se prépare sans elle.</p>
          <button type="button" className="btn btn--primaire btn--grand" onClick={() => setPanneau(true)}>
            <Icone nom="plus" />
            Créer ma classe
          </button>
        </section>
      ) : (
        <>
          {cours.length ? (
            <ul className={styles.cartes}>
              {cours.map((c, i) => {
                const n = c.eleves.length;
                return (
                  <li key={c.id}>
                    <article className={styles.carte}>
                      <div>
                        <h2>{c.nom}</h2>
                        <p className={styles.annee}>{libelleAnnee(c.anneeDebut)}</p>
                        <ul className={styles.faits}>
                          <li>
                            <b>{n ? `${n} élève${pluriel(n)}` : "Aucun élève inscrit"}</b>
                          </li>
                          <li>{c.projets.length ? c.projets.map((p) => p.titre).join(" · ") : "Aucun projet"}</li>
                          <li>{horairesEnTexte(c).join(" ; ")}</li>
                        </ul>
                        <Link
                          className={`btn ${i ? "" : "btn--primaire"} ${styles.ouvrir}`}
                          href={`/classes/${c.id}`}
                          aria-label={`Ouvrir ${c.nom} ${libelleAnnee(c.anneeDebut)}`}
                        >
                          Ouvrir
                        </Link>
                      </div>
                      <div className={styles.gommettes} aria-hidden="true">
                        {n ? trier(c.eleves).map((e) => <Gommette key={e.id} prenom={e.prenom} couleur={e.couleur} />) : <PlacesVides nombre={9} />}
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.aucune}>Aucune classe en cours.</p>
          )}
          {passees.length ? (
            <>
              <h2 className={styles.titre2}>Années passées</h2>
              <ul className={styles.passees}>
                {passees.map((c) => (
                  <li key={c.id}>
                    <Link className={styles.passee} href={`/classes/${c.id}`}>
                      <b>{c.nom}</b>
                      <span>{libelleAnnee(c.anneeDebut)}</span>
                      <span>
                        {c.eleves.length} élève{pluriel(c.eleves.length)} · {c.projets.length} projet{pluriel(c.projets.length)}
                      </span>
                      <span className={styles.passeeOuvrir}>
                        Ouvrir
                        <Icone nom="fleche" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}

      {panneau ? (
        <Panneau
          titre="Nouvelle classe"
          onFermer={() => setPanneau(false)}
          pied={
            <button type="button" className="btn btn--primaire btn--grand" disabled={enCours} aria-busy={enCours || undefined} onClick={creer}>
              Créer la classe
            </button>
          }
        >
          <section>
            <h3>
              <label htmlFor="classe-nom">Nom de la classe</label>
            </h3>
            <input
              className="pchamp"
              id="classe-nom"
              type="text"
              value={nom}
              maxLength={60}
              placeholder="CM1-CM2"
              aria-invalid={erreur ? true : undefined}
              onChange={(e) => {
                setNom(e.target.value);
                if (!identifiantEcrit) setIdentifiant(e.target.value.trim() ? identifiantPourClasse(e.target.value) : "");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") creer(); }}
              data-focus
            />
            {erreur ? (
              <p className="erreur" role="alert">
                <Icone nom="alerte" />
                {erreur}
              </p>
            ) : null}
          </section>
          <section>
            <h3>
              <label htmlFor="classe-identifiant">Identifiant</label>
            </h3>
            <input
              className={`pchamp ${styles.champIdentifiant}`}
              id="classe-identifiant"
              type="text"
              value={identifiant}
              maxLength={30}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="classe-identifiant-aide"
              aria-invalid={erreurIdentifiant ? true : undefined}
              onChange={(e) => { setIdentifiantEcrit(true); setErreurIdentifiant(null); setIdentifiant(formerIdentifiant(e.target.value)); }}
              onKeyDown={(e) => { if (e.key === "Enter") creer(); }}
            />
            {erreurIdentifiant ? (
              <p className="erreur" role="alert">
                <Icone nom="alerte" />
                <span>{erreurIdentifiant}</span>
              </p>
            ) : null}
            <p id="classe-identifiant-aide">Les élèves le tapent pour ouvrir la classe. Vous pouvez en écrire un autre.</p>
          </section>
          <section>
            <h3 id="classe-annee">Année scolaire</h3>
            <div className={styles.jours} role="radiogroup" aria-labelledby="classe-annee">
              {annees.map((a) => (
                <label key={a} className={`${styles.jour} ${styles.jourLarge}`}>
                  <input type="radio" name="annee" value={a} checked={annee === a} onChange={() => setAnnee(a)} />
                  <span>{libelleAnnee(a)}</span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <p>Le mot de passe de la classe est proposé à la création. Vous pourrez le relire et le changer.</p>
          </section>
        </Panneau>
      ) : null}
    </div>
  );
}
