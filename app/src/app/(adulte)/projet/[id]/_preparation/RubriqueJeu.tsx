"use client";

import { useState } from "react";
import { useEnregistrement } from "@/composants/Enregistrement";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { nouvelleSection, resumeFeuille, TYPES_SECTION, type Feuille, type Formule, type Objet, type Preparation, type Section, type TypeSection } from "@/domaine/preparation";
import { activerRubriqueJeu, enregistrerFormule, enregistrerObjet, reglerJeu, supprimerFormule, supprimerObjet } from "../../actions-preparation";
import type { ProjetDuCarnet } from "./Carnet";
import styles from "./preparation.module.css";

/**
 * Rubrique facultative « Objets et formules » (F04.2) : les objets de l'histoire et, dans un
 * récit à choix, les formules d'action, la feuille d'aventure, le dé et les règles du jeu.
 */
export function RubriqueJeu({ projet, preparation }: { projet: ProjetDuCarnet; preparation: Preparation }) {
  const dire = useMessage();
  const aChoix = projet.recit === "choix";
  const deClasse = projet.organisation === "classe";
  const titre = aChoix ? "Objets et formules" : "Objets de l’histoire";
  const [attente, setAttente] = useState(false);

  if (!preparation.rubriqueJeu) {
    return (
      <section className={`${styles.invite} ${styles.large}`} aria-labelledby="rubrique-jeu">
        <div>
          <h2 id="rubrique-jeu">
            {titre} <span className={styles.fin}>rubrique facultative</span>
          </h2>
          <p>
            {aChoix
              ? "Pour un livre à objets, à compteurs ou à dés : on décide ici du nom exact de chaque objet et des demandes au lecteur qui reviennent."
              : "Pour écrire toujours de la même façon le nom des objets qui reviennent dans le récit."}
          </p>
        </div>
        <button
          type="button"
          className="btn"
          disabled={attente}
          aria-busy={attente || undefined}
          onClick={async () => {
            setAttente(true);
            const fait = await activerRubriqueJeu(projet.id, true);
            setAttente(false);
            if (!fait.ok) dire({ texte: fait.erreur });
          }}
        >
          <Icone nom="plus" />
          Ajouter cette rubrique
        </button>
      </section>
    );
  }

  return (
    <section className={`carnet-fiche ${styles.rubrique} ${styles.large}`} aria-labelledby="rubrique-jeu">
      <header>
        <h2 id="rubrique-jeu">{titre}</h2>
        <span className={styles.fin}>rubrique facultative</span>
      </header>
      <div className="carnet-fiche__corps">
        <p className={styles.question}>
          {aChoix
            ? "Quels objets reviennent dans l’histoire, et que demande-t-on au lecteur de noter ?"
            : "Quels objets reviennent dans l’histoire, et comment les appelle-t-on ?"}
        </p>
        <div className={aChoix ? styles.cols : undefined}>
          <Objets projetId={projet.id} objets={preparation.objets} deClasse={deClasse} />
          {aChoix ? <Formules projetId={projet.id} formules={preparation.formules} /> : null}
        </div>
        {aChoix ? (
          <>
            <details className={styles.pli}>
              <summary>
                <Icone nom="feuille" />
                Feuille d’aventure du lecteur
                <span className={styles.pli__etat}>
                  {preparation.feuille.sections.length === 0 ? "facultative" : preparation.feuille.on ? resumeFeuille(preparation.feuille) || "composée" : "composée, non imprimée"}
                </span>
              </summary>
              <EditionFeuille projetId={projet.id} depart={preparation.feuille} />
            </details>
            <details className={styles.pli}>
              <summary>
                <Icone nom="noter" />
                Règles du jeu
                <span className={styles.pli__etat}>{preparation.regles.trim() ? "écrites" : "facultatives"}</span>
              </summary>
              <Regles projetId={projet.id} depart={preparation.regles} />
            </details>
          </>
        ) : null}
      </div>
    </section>
  );
}

/** Identifiant d'une section ou d'un compteur ajoutés à la feuille. */
const identifiant = (prefixe: string): string => `${prefixe}${Date.now().toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;

function Objets({ projetId, objets, deClasse }: { projetId: string; objets: Objet[]; deClasse: boolean }) {
  const dire = useMessage();
  const [edite, setEdite] = useState<string | null>(null);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [neufNom, setNeufNom] = useState("");
  const [neufDescription, setNeufDescription] = useState("");

  const enregistrer = async (id: string | null, n: string, d: string) => {
    const fait = await enregistrerObjet(projetId, id, n, d);
    if (!fait.ok) return dire({ texte: fait.erreur });
    if (id) setEdite(null);
    else {
      setNeufNom("");
      setNeufDescription("");
    }
  };

  return (
    <section className={styles.col} aria-labelledby="jeu-objets">
      <h3 id="jeu-objets">
        <Icone nom="sac" />
        Objets de l’histoire <span className={styles.compte}>{objets.length}</span>
      </h3>
      <p className={styles.aide}>
        Écrits comme dans une phrase, avec leur article.{deClasse ? " Les élèves les consulteront depuis la scène, sans pouvoir les modifier." : ""} Le lecteur ne voit jamais cette liste.
      </p>
      <ul className={styles.liste}>
        {objets.map((o) =>
          edite === o.id ? (
            <li key={o.id} className={styles.edition}>
              <label className={styles.champ}>
                <span>Nom, tel qu’il s’écrit dans une phrase</span>
                <input className="pchamp" type="text" maxLength={60} value={nom} onChange={(e) => setNom(e.target.value)} />
              </label>
              <label className={styles.champ}>
                <span>Description pour les auteurs</span>
                <input className="pchamp" type="text" maxLength={120} value={description} onChange={(e) => setDescription(e.target.value)} />
              </label>
              <p className={styles.aide}>Renommer ne modifie pas les textes déjà écrits.</p>
              <div className={styles.actions}>
                <button type="button" className="btn btn--petit btn--primaire" onClick={() => void enregistrer(o.id, nom, description)}>
                  Enregistrer
                </button>
                <button type="button" className="btn btn--petit" onClick={() => setEdite(null)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn--petit"
                  onClick={async () => {
                    const fait = await supprimerObjet(projetId, o.id);
                    setEdite(null);
                    dire(fait.ok ? { texte: `« ${o.nom} » est supprimé de la liste.`, annuler: () => void enregistrerObjet(projetId, null, o.nom, o.description) } : { texte: fait.erreur });
                  }}
                >
                  <Icone nom="corbeille" />
                  Supprimer de la liste
                </button>
              </div>
            </li>
          ) : (
            <li key={o.id}>
              <span className={`recit ${styles.liste__nom}`}>{o.nom}</span>
              <span className={styles.liste__desc}>{o.description}</span>
              <button
                type="button"
                className="lien"
                aria-label={`Modifier ${o.nom}`}
                onClick={() => {
                  setNom(o.nom);
                  setDescription(o.description);
                  setEdite(o.id);
                }}
              >
                Modifier
              </button>
            </li>
          ),
        )}
      </ul>
      <form
        className={styles.ajout}
        onSubmit={(e) => {
          e.preventDefault();
          void enregistrer(null, neufNom, neufDescription);
        }}
      >
        <label className={styles.champ}>
          <span>Nouvel objet</span>
          <input className="pchamp" type="text" maxLength={60} placeholder="la lanterne sourde" value={neufNom} onChange={(e) => setNeufNom(e.target.value)} />
        </label>
        <label className={styles.champ}>
          <span>Description</span>
          <input className="pchamp" type="text" maxLength={120} placeholder="Ce qu’il est, à quoi il sert" value={neufDescription} onChange={(e) => setNeufDescription(e.target.value)} />
        </label>
        <button type="submit" className="btn" disabled={!neufNom.trim()}>
          <Icone nom="plus" />
          Ajouter
        </button>
      </form>
    </section>
  );
}

function Formules({ projetId, formules }: { projetId: string; formules: Formule[] }) {
  const dire = useMessage();
  const [edite, setEdite] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const [neuf, setNeuf] = useState("");
  return (
    <section className={styles.col} aria-labelledby="jeu-formules">
      <h3 id="jeu-formules">
        <Icone nom="noter" />
        Formules d’action <span className={styles.compte}>{formules.length}</span>
      </h3>
      <p className={styles.aide}>Les demandes au lecteur qui reviennent souvent. Elles seront proposées dans la scène, puis resteront modifiables dans chaque texte.</p>
      <ul className={styles.liste}>
        {formules.map((f) =>
          edite === f.id ? (
            <li key={f.id} className={styles.edition}>
              <label className={styles.champ}>
                <span>Formule</span>
                <input className="pchamp" type="text" maxLength={140} value={texte} onChange={(e) => setTexte(e.target.value)} />
              </label>
              <p className={styles.aide}>Corriger une formule ne modifie pas les paragraphes déjà écrits.</p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="btn btn--petit btn--primaire"
                  onClick={async () => {
                    const fait = await enregistrerFormule(projetId, f.id, texte);
                    if (fait.ok) setEdite(null);
                    else dire({ texte: fait.erreur });
                  }}
                >
                  Enregistrer
                </button>
                <button type="button" className="btn btn--petit" onClick={() => setEdite(null)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn btn--petit"
                  onClick={async () => {
                    const fait = await supprimerFormule(projetId, f.id);
                    setEdite(null);
                    dire(fait.ok ? { texte: "La formule est supprimée de la liste.", annuler: () => void enregistrerFormule(projetId, null, f.texte) } : { texte: fait.erreur });
                  }}
                >
                  <Icone nom="corbeille" />
                  Supprimer
                </button>
              </div>
            </li>
          ) : (
            <li key={f.id}>
              <span className={`recit ${styles.formule_action}`}>{f.texte}</span>
              <button
                type="button"
                className="lien"
                aria-label={`Modifier la formule « ${f.texte} »`}
                onClick={() => {
                  setTexte(f.texte);
                  setEdite(f.id);
                }}
              >
                Modifier
              </button>
            </li>
          ),
        )}
      </ul>
      <form
        className={`${styles.ajout} ${styles.ajout_une}`}
        onSubmit={async (e) => {
          e.preventDefault();
          const fait = await enregistrerFormule(projetId, null, neuf);
          if (fait.ok) setNeuf("");
          else dire({ texte: fait.erreur });
        }}
      >
        <label className={styles.champ}>
          <span>Nouvelle formule</span>
          <input className="pchamp" type="text" maxLength={140} placeholder="Ajoute un point de courage à ton héros." value={neuf} onChange={(e) => setNeuf(e.target.value)} />
        </label>
        <button type="submit" className="btn" disabled={!neuf.trim()}>
          <Icone nom="plus" />
          Ajouter
        </button>
      </form>
    </section>
  );
}

function EditionFeuille({ projetId, depart }: { projetId: string; depart: Feuille }) {
  const [feuille, setFeuille] = useState<Feuille>(depart);
  const e = useEnregistrement();
  const changer = (suite: Feuille, delai = 600) => {
    setFeuille(suite);
    e.prevoir(() => reglerJeu(projetId, { feuille: suite }), delai);
  };
  const section = (id: string, maj: (s: Section) => Section) => changer({ ...feuille, sections: feuille.sections.map((s) => (s.id === id ? maj(s) : s)) });
  const bouger = (i: number, pas: number) => {
    const suite = [...feuille.sections];
    [suite[i], suite[i + pas]] = [suite[i + pas], suite[i]];
    changer({ ...feuille, sections: suite }, 0);
  };

  return (
    <div className={styles.feuille}>
      <label className="inter">
        <input type="checkbox" role="switch" checked={feuille.on} onChange={(ev) => changer({ ...feuille, on: ev.target.checked }, 0)} />
        <span className="inter__piste" aria-hidden="true" />
        <span>Dans le livre et en ligne</span>
      </label>
      {feuille.sections.length === 0 ? <p className={styles.aide}>La feuille n’a encore aucune section : elle ne sera ni imprimée ni proposée en ligne.</p> : null}
      <ol className={styles.sections} aria-label="Sections de la feuille">
        {feuille.sections.map((s, i) => (
          <li key={s.id}>
            <div className={styles.section__tete}>
              <span className={styles.section__type}>{TYPES_SECTION[s.type].nom}</span>
              <label className={styles.section__titre}>
                <span className="vh">Titre de la section</span>
                <input className="pchamp" type="text" maxLength={40} placeholder="Titre de la section" value={s.titre} onChange={(ev) => section(s.id, (x) => ({ ...x, titre: ev.target.value }))} />
              </label>
              <button type="button" className="btn btn--discret btn--petit" disabled={i === 0} aria-label={`Monter la section ${s.titre}`} onClick={() => bouger(i, -1)}>
                <Icone nom="chevron-haut" />
              </button>
              <button type="button" className="btn btn--discret btn--petit" disabled={i === feuille.sections.length - 1} aria-label={`Descendre la section ${s.titre}`} onClick={() => bouger(i, 1)}>
                <Icone nom="chevron-bas" />
              </button>
              <button
                type="button"
                className="btn btn--discret btn--petit"
                aria-label={`Supprimer la section ${s.titre}`}
                onClick={() => changer({ ...feuille, sections: feuille.sections.filter((x) => x.id !== s.id) }, 0)}
              >
                <Icone nom="corbeille" />
              </button>
            </div>
            {s.type === "compteurs" ? (
              <>
                <ul className={styles.compteurs}>
                  {s.compteurs.map((c) => (
                    <li key={c.id}>
                      <label className={styles.champ}>
                        <span>Nom</span>
                        <input
                          className="pchamp"
                          type="text"
                          maxLength={24}
                          value={c.nom}
                          onChange={(ev) => section(s.id, (x) => (x.type === "compteurs" ? { ...x, compteurs: x.compteurs.map((y) => (y.id === c.id ? { ...y, nom: ev.target.value } : y)) } : x))}
                        />
                      </label>
                      <label className={`${styles.champ} ${styles.nombre}`}>
                        <span>Départ</span>
                        <input
                          className="pchamp"
                          type="number"
                          min={0}
                          max={99}
                          value={c.depart}
                          onChange={(ev) =>
                            section(s.id, (x) =>
                              x.type === "compteurs" ? { ...x, compteurs: x.compteurs.map((y) => (y.id === c.id ? { ...y, depart: Math.min(99, Math.max(0, Number(ev.target.value) || 0)) } : y)) } : x,
                            )
                          }
                        />
                      </label>
                      {s.compteurs.length > 1 ? (
                        <button
                          type="button"
                          className="btn btn--discret btn--petit"
                          aria-label={`Supprimer le compteur ${c.nom}`}
                          onClick={() => section(s.id, (x) => (x.type === "compteurs" ? { ...x, compteurs: x.compteurs.filter((y) => y.id !== c.id) } : x))}
                        >
                          <Icone nom="corbeille" />
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {s.compteurs.length < 8 ? (
                  <button
                    type="button"
                    className="lien"
                    onClick={() => section(s.id, (x) => (x.type === "compteurs" ? { ...x, compteurs: [...x.compteurs, { id: identifiant("c"), nom: "", depart: 0 }] } : x))}
                  >
                    Ajouter un compteur
                  </button>
                ) : null}
              </>
            ) : s.type === "liste" ? (
              <label className={`${styles.champ} ${styles.nombre} ${styles.enLigne}`}>
                <span>Lignes sur la page imprimée</span>
                <input
                  className="pchamp"
                  type="number"
                  min={3}
                  max={14}
                  value={s.lignes}
                  onChange={(ev) => section(s.id, (x) => (x.type === "liste" ? { ...x, lignes: Math.min(14, Math.max(3, Number(ev.target.value) || 3)) } : x))}
                />
              </label>
            ) : (
              <p className={styles.aide}>Un cadre libre : il occupe la place qui reste sur la page.</p>
            )}
          </li>
        ))}
      </ol>
      {feuille.sections.length < 12 ? (
        <div className={styles.actions}>
          <span className={styles.aide}>Ajouter une section :</span>
          {(Object.keys(TYPES_SECTION) as TypeSection[]).map((type) => (
            <button key={type} type="button" className="btn btn--petit" title={TYPES_SECTION[type].aide} onClick={() => changer({ ...feuille, sections: [...feuille.sections, nouvelleSection(type, identifiant("s"))] }, 0)}>
              <Icone nom="plus" />
              {TYPES_SECTION[type].nom}
            </button>
          ))}
        </div>
      ) : null}
      <fieldset className={styles.des}>
        <legend>Dé de la feuille en ligne</legend>
        {([0, 1, 2] as const).map((n) => (
          <label key={n}>
            <input type="radio" name="feuille-des" checked={feuille.des === n} onChange={() => changer({ ...feuille, des: n }, 0)} />
            <span>{n === 0 ? "Aucun dé" : n === 1 ? "Un dé" : "Deux dés"}</span>
          </label>
        ))}
      </fieldset>
      <p className={styles.etat} role="status">
        {e.enCours ? "Enregistrement…" : e.erreur ? e.erreur : e.enregistre ? "Enregistré" : ""}
      </p>
    </div>
  );
}

function Regles({ projetId, depart }: { projetId: string; depart: string }) {
  const [texte, setTexte] = useState(depart);
  const e = useEnregistrement();
  return (
    <div className={styles.feuille}>
      <label className={styles.aide} htmlFor="regles-du-jeu">
        Ce que le lecteur doit savoir avant de commencer : comment noter, quand lancer le dé. Un paragraphe par ligne.
      </label>
      <textarea
        id="regles-du-jeu"
        className={`pchamp ${styles.texte}`}
        rows={6}
        maxLength={6000}
        value={texte}
        onChange={(ev) => {
          setTexte(ev.target.value);
          e.prevoir(() => reglerJeu(projetId, { regles: ev.target.value }));
        }}
        onBlur={() => void e.partir()}
      />
      <p className={styles.etat} role="status">
        {e.enCours ? "Enregistrement…" : e.erreur ? e.erreur : e.enregistre ? "Enregistré" : ""}
      </p>
    </div>
  );
}
