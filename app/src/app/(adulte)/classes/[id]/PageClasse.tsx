"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useAttente } from "@/composants/Attente";
import { Dialogue } from "@/composants/Dialogue";
import { Gommette, PlacesVides } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { MessageAuChargement } from "@/composants/MessageAuChargement";
import { useMessage } from "@/composants/Messages";
import { formerIdentifiant, identifiantConvient, identifiantPourClasse } from "@/domaine/acces";
import { libelleAnnee } from "@/domaine/annee";
import { trier } from "@/domaine/eleves";
import { libelleRecit } from "@/domaine/projets";
import { pluriel } from "@/domaine/texte";
import type { Classe } from "@/serveur/lectures";
import { AideClasses } from "../AideClasses";
import { horairesEnTexte } from "../MesClasses";
import {
  annulerRetrait, changerMotDePasse, proposerMotDePasse, renommerClasse, retirerEleve, rouvrirClasse,
  supprimerClasse, terminerAnnee, voirCodes, voirMotDePasse,
} from "../actions";
import styles from "../classes.module.css";
import { PanneauEleve } from "./PanneauEleve";
import { PanneauHoraires } from "./PanneauHoraires";

type Ancienne = { id: string; nom: string; annee: string; projets: number };
type Ouvert =
  | { sorte: "eleve"; id: string }
  | { sorte: "horaires" }
  | { sorte: "terminer"; id: string; nom: string; annee: string; projets: number }
  | { sorte: "motDePasse"; neuf: string }
  | { sorte: "renommer" }
  | null;

const dateLongue = (iso: string): string =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(iso));

/** Une classe : ses élèves à gauche, ses trois fiches à droite (F01.1, F06.4). */
export function PageClasse({
  classe, adresse, aideMasquee, ancienne, message,
}: {
  classe: Classe; adresse: string; aideMasquee: boolean; ancienne: Ancienne | null; message: string | null;
}) {
  const routeur = useRouter();
  const dire = useMessage();
  const { attente, lancer } = useAttente();
  const [aide, setAide] = useState(false);
  const [ouvert, setOuvert] = useState<Ouvert>(null);
  // Codes et mot de passe masqués à l'ouverture : l'écran est souvent projeté (F06-AC71)
  const [codes, setCodes] = useState<Record<string, string> | null>(null);
  const [motDePasse, setMotDePasse] = useState<string | null>(null);
  const [proposition, setProposition] = useState(ancienne);
  const [nom, setNom] = useState(classe.nom);
  // L'identifiant suit le nouveau nom tant que l'enseignant ne l'a pas écrit lui-même (F06-AC84, AC85)
  const [identifiant, setIdentifiant] = useState(classe.identifiant);
  const [identifiantEcrit, setIdentifiantEcrit] = useState(false);
  const [erreurIdentifiant, setErreurIdentifiant] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const menu = useRef<HTMLDetailsElement>(null);

  const annee = libelleAnnee(classe.anneeDebut);
  const n = classe.eleves.length;
  const liste = trier(classe.eleves);
  const enCours = classe.enCours;
  const fermerMenu = () => {
    if (menu.current) menu.current.open = false;
  };
  const echec = (texte: string) => dire({ texte });

  if (aide) {
    return (
      <div className="page">
        <h1 className="vh">Mes classes</h1>
        {/* Rouverte par « Aide » : elle a déjà été vue */}
        <AideClasses dejaVue masquee={aideMasquee} onCommencer={() => setAide(false)} />
      </div>
    );
  }

  const basculerCodes = () => {
    if (codes) {
      setCodes(null);
      return;
    }
    lancer("codes", async () => {
      const r = await voirCodes(classe.id);
      if (r.ok) setCodes(r.codes);
      else echec(r.erreur);
    });
  };
  const basculerMotDePasse = () => {
    if (motDePasse) {
      setMotDePasse(null);
      return;
    }
    lancer("voir", async () => {
      const r = await voirMotDePasse(classe.id);
      if (r.ok) setMotDePasse(r.motDePasse);
      else echec(r.erreur);
    });
  };
  const retirer = (inscriptionId: string, prenom: string) => {
    // Personne n'a encore écrit : le retrait se fait d'un geste, avec « Annuler » (F01.1)
    lancer("retirer", async () => {
      const r = await retirerEleve(classe.id, inscriptionId);
      if (!r.ok) return echec(r.erreur);
      setOuvert(null);
      routeur.refresh();
      dire({
        texte: `${prenom} n’est plus dans la classe.`,
        annuler: () =>
          lancer("annuler", async () => {
            const a = await annulerRetrait(classe.id, inscriptionId);
            if (!a.ok) return echec(a.erreur);
            routeur.refresh();
            dire({ texte: `${prenom} est de retour dans la classe.` });
          }),
      });
    });
  };
  const terminer = (id: string, nomClasse: string, anneeClasse: string) =>
    lancer("terminer", async () => {
      const r = await terminerAnnee(id);
      if (!r.ok) return echec(r.erreur);
      setOuvert(null);
      setProposition(null);
      setCodes(null);
      setMotDePasse(null);
      routeur.refresh();
      dire({ texte: `L’année de ${nomClasse} ${anneeClasse} est terminée. La classe est sous « Années passées ».` });
    });
  const rouvrir = () =>
    lancer("rouvrir", async () => {
      const r = await rouvrirClasse(classe.id);
      if (!r.ok) return echec(r.erreur);
      routeur.refresh();
      dire({ texte: `${classe.nom} ${annee} est rouverte : mêmes informations de classe, mêmes codes.` });
    });
  const demanderMotDePasse = () =>
    lancer("proposer", async () => {
      setOuvert({ sorte: "motDePasse", neuf: await proposerMotDePasse() });
    });
  const confirmerMotDePasse = (neuf: string) =>
    lancer("motDePasse", async () => {
      const r = await changerMotDePasse(classe.id, neuf);
      if (!r.ok) return echec(r.erreur);
      setOuvert(null);
      setMotDePasse(null);
      dire({ texte: "Le mot de passe de la classe est changé." });
    });
  const ouvrirRenommer = () => {
    setNom(classe.nom);
    setIdentifiant(classe.identifiant);
    setIdentifiantEcrit(false);
    setErreur(null);
    setErreurIdentifiant(null);
    setOuvert({ sorte: "renommer" });
  };
  // L'identifiant suit le nom s'il en était tiré ; celui que l'enseignant a choisi autrement reste
  const tireDuNom = classe.identifiant.startsWith(identifiantPourClasse(classe.nom));
  const ecrireNom = (valeur: string) => {
    setNom(valeur);
    if (identifiantEcrit || !tireDuNom) return;
    setErreurIdentifiant(null);
    setIdentifiant(valeur.trim() && !identifiantConvient(classe.identifiant, valeur) ? identifiantPourClasse(valeur) : classe.identifiant);
  };
  const renommer = () => {
    setErreur(null);
    setErreurIdentifiant(null);
    lancer("renommer", async () => {
      const r = await renommerClasse(classe.id, nom, identifiant);
      if (!r.ok) return r.champ === "identifiant" ? setErreurIdentifiant(r.erreur) : setErreur(r.erreur);
      setOuvert(null);
      routeur.refresh();
      if (r.identifiant) dire({ texte: `L’identifiant de la classe est maintenant « ${r.identifiant} ». Pensez à réimprimer l’affiche.` });
    });
  };
  const supprimer = () =>
    lancer("supprimer", async () => {
      const r = await supprimerClasse(classe.id);
      if (!r.ok) return echec(r.erreur);
      routeur.push("/classes?message=supprimee");
    });

  const eleveOuvert = ouvert?.sorte === "eleve" ? classe.eleves.find((e) => e.id === ouvert.id) : undefined;

  return (
    <div className="page">
      {message ? <MessageAuChargement texte={message} /> : null}
      <nav className="fil">
        <Link href="/classes">
          <Icone nom="fleche-g" />
          Retour à Mes classes
        </Link>
      </nav>
      <header className="entete">
        <div>
          <h1>{classe.nom}</h1>
          <p>
            {annee}
            {n ? ` · ${n} élève${pluriel(n)}` : ""}
          </p>
        </div>
        <div className="page-tete__cmd">
          <button type="button" className="aide-bouton" onClick={() => setAide(true)} title="Que fait-on ici ?">
            <Icone nom="aide" />
            Aide
          </button>
          {enCours ? (
            <details className="menu" ref={menu}>
              <summary className="btn" aria-label="Autres commandes de la classe">
                <Icone nom="points" />
              </summary>
              <div className="menu__liste">
                <button type="button" onClick={() => { fermerMenu(); ouvrirRenommer(); }}>
                  Renommer la classe
                </button>
                {!n && !classe.projets.length ? (
                  <button type="button" onClick={() => { fermerMenu(); supprimer(); }}>
                    Supprimer la classe
                  </button>
                ) : null}
              </div>
            </details>
          ) : null}
        </div>
      </header>

      {!enCours && classe.termineeLe ? (
        <div className={`note note--ok ${styles.bande}`}>
          <Icone nom="coche" />
          <div>
            <p>
              <b>Année terminée le {dateLongue(classe.termineeLe)}.</b> Les élèves ne peuvent plus ouvrir cette classe. Rien
              n’est supprimé.
            </p>
          </div>
          <button type="button" className="btn" disabled={attente === "rouvrir"} aria-busy={attente === "rouvrir" || undefined} onClick={rouvrir}>
            Rouvrir la classe
          </button>
        </div>
      ) : proposition ? (
        <div className={`alerte ${styles.proposition}`}>
          <Icone nom="horloge" />
          <span>
            <b>Votre classe {proposition.annee}</b> ({proposition.nom}) est encore en cours. Son année est finie ?
          </span>
          <button type="button" className="btn" onClick={() => setOuvert({ sorte: "terminer", ...proposition })}>
            Terminer son année
          </button>
          <button type="button" className="btn btn--discret" onClick={() => setProposition(null)}>
            Plus tard
          </button>
        </div>
      ) : null}

      {enCours && n ? (
        <p className={styles.sommaire}>
          Aller à : <a href="#fiche-acces">Connexion</a>
          <a href="#fiche-horaires">Horaires</a>
          <a href="#fiche-projets">Projets</a>
        </p>
      ) : null}

      <div className={styles.grille}>
        <section className={styles.liste} aria-labelledby="titre-eleves">
          <header className={styles.listeTete}>
            <h2 id="titre-eleves">Élèves</h2>
            {enCours && n ? (
              <div className={styles.listeCmd}>
                <button type="button" className="btn btn--discret" aria-pressed={!!codes} disabled={attente === "codes"} aria-busy={attente === "codes" || undefined} onClick={basculerCodes}>
                  <Icone nom="oeil" />
                  {codes ? "Masquer les codes" : "Afficher les codes"}
                </button>
                <Link className="btn" href={`/classes/${classe.id}/imprimer`}>
                  <Icone nom="imprimer" />
                  Imprimer les étiquettes
                </Link>
                <Link className="btn" href={`/classes/${classe.id}/inscrire`}>
                  <Icone nom="plus" />
                  Inscrire des élèves
                </Link>
              </div>
            ) : null}
          </header>
          {n ? (
            <ol className={styles.eleves}>
              {liste.map((e) => {
                const identite = (
                  <span className={styles.eleveNom}>
                    <b>{e.prenom}</b>
                    {e.nom ? ` ${e.nom}` : ""}
                  </span>
                );
                return (
                  <li key={e.id}>
                    {enCours ? (
                      <button
                        type="button"
                        className={styles.eleve}
                        aria-current={eleveOuvert?.id === e.id ? "true" : undefined}
                        onClick={() => setOuvert({ sorte: "eleve", id: e.id })}
                      >
                        <Gommette prenom={e.prenom} couleur={e.couleur} taille="s" />
                        {identite}
                        <span className={styles.eleveCode} aria-hidden={codes ? undefined : true}>
                          {codes ? (codes[e.id] ?? "") : "••••"}
                        </span>
                        <Icone nom="chevron" />
                      </button>
                    ) : (
                      <span className={styles.eleve}>
                        <Gommette prenom={e.prenom} couleur={e.couleur} taille="s" />
                        {identite}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <div className={styles.listeVide}>
              <div className={styles.places} aria-hidden="true">
                <PlacesVides nombre={7} />
              </div>
              <p>Aucun élève pour l’instant.</p>
              {enCours ? (
                <>
                  <Link className="btn btn--primaire btn--grand" href={`/classes/${classe.id}/inscrire`}>
                    <Icone nom="plus" />
                    Inscrire des élèves
                  </Link>
                  <p className={styles.listeAide}>Écrivez ou collez leurs prénoms : chacun reçoit son code.</p>
                </>
              ) : null}
            </div>
          )}
        </section>

        <aside className={styles.cote} aria-label="Réglages de la classe">
          {enCours ? (
            <section className={`carnet-fiche ${styles.fiche}`} aria-labelledby="fiche-acces">
              <header>
                <h2 id="fiche-acces">Pour ouvrir la classe sur un ordinateur</h2>
              </header>
              <div className="carnet-fiche__corps">
                <p className={styles.ficheAide}>Une fois par ordinateur. Ensuite, chaque élève clique sur son prénom et tape son code.</p>
                <dl className={styles.acces}>
                  <div>
                    <dt>Adresse</dt>
                    <dd>{adresse}</dd>
                  </div>
                  <div>
                    <dt>Identifiant</dt>
                    <dd>{classe.identifiant}</dd>
                  </div>
                  <div>
                    <dt>Mot de passe</dt>
                    <dd>
                      <span aria-hidden={motDePasse ? undefined : true}>{motDePasse ?? "••••••••••"}</span>
                      <button
                        type="button"
                        className={styles.oeil}
                        aria-pressed={!!motDePasse}
                        aria-label={`${motDePasse ? "Masquer" : "Afficher"} le mot de passe`}
                        disabled={attente === "voir"}
                        aria-busy={attente === "voir" || undefined}
                        onClick={basculerMotDePasse}
                      >
                        <Icone nom="oeil" />
                      </button>
                    </dd>
                  </div>
                </dl>
                <div className={styles.ficheCmd}>
                  <Link className="btn" href={`/classes/${classe.id}/imprimer?quoi=affiche`}>
                    <Icone nom="imprimer" />
                    Imprimer l’affiche
                  </Link>
                  <button type="button" className="lien" disabled={attente === "proposer"} aria-busy={attente === "proposer" || undefined} onClick={demanderMotDePasse}>
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {enCours ? (
            <section className={`carnet-fiche ${styles.fiche}`} aria-labelledby="fiche-horaires">
              <header>
                <h2 id="fiche-horaires">Horaires</h2>
              </header>
              <div className="carnet-fiche__corps">
                <ul className={`${styles.horaires} ${classe.horairesLimites ? styles.horairesRegles : ""}`}>
                  {horairesEnTexte(classe).map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <p className={styles.ficheAide}>
                  {classe.horairesLimites ? "Hors de ces horaires, les élèves ne peuvent ni lire ni écrire." : "Les élèves travaillent quand ils veulent."}
                </p>
                <div className={styles.ficheCmd}>
                  <button type="button" className="btn" onClick={() => setOuvert({ sorte: "horaires" })}>
                    {classe.horairesLimites ? "Changer les horaires" : "Limiter les horaires"}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          <section className={`carnet-fiche ${styles.fiche}`} aria-labelledby="fiche-projets">
            <header>
              <h2 id="fiche-projets">Projets de la classe</h2>
            </header>
            <div className="carnet-fiche__corps">
              {classe.projets.length ? (
                <ul className={styles.projets}>
                  {classe.projets.map((p) => (
                    <li key={p.id}>
                      <Link href={`/projet/${p.id}`}>{p.titre}</Link>
                      <span>{libelleRecit(p.recit)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.ficheAide}>Aucun projet. La classe se choisit à la création d’un projet, ou plus tard, dans le projet.</p>
              )}
            </div>
          </section>

          {enCours ? (
            <p className={styles.finLien}>
              L’année est finie ?{" "}
              <button
                type="button"
                className="lien"
                onClick={() => setOuvert({ sorte: "terminer", id: classe.id, nom: classe.nom, annee, projets: classe.projets.length })}
              >
                Terminer l’année
              </button>
            </p>
          ) : null}
        </aside>
      </div>

      {eleveOuvert ? (
        <PanneauEleve
          key={eleveOuvert.id}
          classe={classe}
          eleve={eleveOuvert}
          onFermer={() => setOuvert(null)}
          onCodeChange={(code) => setCodes((c) => (c ? { ...c, [eleveOuvert.id]: code } : c))}
          onRetirer={() => retirer(eleveOuvert.inscriptionId, eleveOuvert.prenom)}
          retraitEnCours={attente === "retirer"}
        />
      ) : null}
      {ouvert?.sorte === "horaires" ? <PanneauHoraires classe={classe} onFermer={() => setOuvert(null)} /> : null}

      {ouvert?.sorte === "terminer" ? (
        <Dialogue
          titre={`Terminer l’année de ${ouvert.nom} ${ouvert.annee} ?`}
          onFermer={() => setOuvert(null)}
          boutons={
            <button type="button" className="btn btn--primaire" disabled={attente === "terminer"} aria-busy={attente === "terminer" || undefined} onClick={() => terminer(ouvert.id, ouvert.nom, ouvert.annee)}>
              Terminer l’année
            </button>
          }
        >
          <ul className="dialogue__faits">
            <li>Les élèves ne pourront plus ouvrir la classe sur un ordinateur.</li>
            <li>
              Rien n’est supprimé
              {ouvert.projets ? ` : vous gardez ${ouvert.projets > 1 ? `ses ${ouvert.projets} projets` : "son projet"}, les textes et les livres` : ""}.
            </li>
            <li>Vous pourrez rouvrir la classe.</li>
          </ul>
        </Dialogue>
      ) : null}

      {ouvert?.sorte === "motDePasse" ? (
        <Dialogue
          titre="Changer le mot de passe de la classe ?"
          onFermer={() => setOuvert(null)}
          boutons={
            <button type="button" className="btn btn--primaire" disabled={attente === "motDePasse"} aria-busy={attente === "motDePasse" || undefined} onClick={() => confirmerMotDePasse(ouvert.neuf)}>
              Changer le mot de passe
            </button>
          }
        >
          <p className={styles.motDePasseNeuf}>
            Nouveau mot de passe : <b>{ouvert.neuf}</b>
          </p>
          <ul className="dialogue__faits">
            <li>Il faudra le nouveau pour ouvrir la classe sur un ordinateur.</li>
            <li>Les codes des élèves ne changent pas.</li>
            <li>L’affiche est à réimprimer, et les étiquettes qui portent le mot de passe.</li>
          </ul>
        </Dialogue>
      ) : null}

      {ouvert?.sorte === "renommer" ? (
        <Dialogue
          titre="Renommer la classe"
          onFermer={() => setOuvert(null)}
          boutons={
            <button type="button" className="btn btn--primaire" disabled={attente === "renommer"} aria-busy={attente === "renommer" || undefined} onClick={renommer}>
              Enregistrer
            </button>
          }
        >
          <label className="champ champ--plein">
            <span>Nom de la classe</span>
            <input type="text" value={nom} maxLength={60} onChange={(e) => ecrireNom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") renommer(); }} />
          </label>
          {erreur ? (
            <p className="erreur" role="alert">
              <Icone nom="alerte" />
              {erreur}
            </p>
          ) : null}
          <label className={`champ champ--plein ${styles.champSuivant}`}>
            <span>Identifiant</span>
            <input
              className={styles.champIdentifiant}
              type="text"
              value={identifiant}
              maxLength={30}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={erreurIdentifiant ? true : undefined}
              onChange={(e) => { setIdentifiantEcrit(true); setErreurIdentifiant(null); setIdentifiant(formerIdentifiant(e.target.value)); }}
              onKeyDown={(e) => { if (e.key === "Enter") renommer(); }}
            />
          </label>
          {erreurIdentifiant ? (
            <p className="erreur" role="alert">
              <Icone nom="alerte" />
              <span>{erreurIdentifiant}</span>
            </p>
          ) : null}
          <p className={styles.ficheAide}>
            {identifiant === classe.identifiant ? (
              "L’identifiant de la classe ne change pas."
            ) : (
              <>
                L’affiche sera à réimprimer, et les étiquettes qui portent l’identifiant.{" "}
                <button type="button" className="lien" onClick={() => { setIdentifiantEcrit(true); setErreurIdentifiant(null); setIdentifiant(classe.identifiant); }}>
                  Garder « {classe.identifiant} »
                </button>
              </>
            )}
          </p>
        </Dialogue>
      ) : null}
    </div>
  );
}
