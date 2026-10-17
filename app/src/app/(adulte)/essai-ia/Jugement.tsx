"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { NOMS_DES_AIDES, type AideTexte } from "@/domaine/aides-ia";
import { Dialogue } from "@/composants/Dialogue";
import { Icone } from "@/composants/Icone";
import type { Note } from "../../../../scripts/essai-ia/commun";
import { juger } from "./actions";
import type { Affichage, CasAffiche } from "./donnees";
import styles from "./essai.module.css";

const NOTES: { note: Note; nom: string }[] = [
  { note: "bonne", nom: "Bonne" },
  { note: "passable", nom: "Passable" },
  { note: "mauvaise", nom: "À écarter" },
];

/** Les propositions d'un cas encore sans note. */
const aNoter = (c: CasAffiche) => c.propositions.filter((p) => !c.jugement.notes[p.lettre]).map((p) => p.lettre);

/** Un cas est jugé quand chaque proposition a sa note et qu'une meilleure, ou « aucune », est choisie. */
const juge = (c: CasAffiche) => !!c.jugement.meilleure && !aNoter(c).length;

type Etat = "pret" | "attente" | "enregistre" | "echec";

/**
 * Le jugement à l'aveugle, cas par cas : les propositions sous une lettre, une note pour
 * chacune, la meilleure ou aucune, et une remarque si besoin. Chaque geste s'enregistre
 * aussitôt et le dit ; les modèles ne se révèlent qu'après confirmation tant qu'il reste des
 * cas à juger.
 */
export function Jugement({ cas: depart }: { cas: CasAffiche[] }) {
  const routeur = useRouter();
  const [cas, setCas] = useState(depart);
  const [i, setI] = useState(() => Math.max(0, depart.findIndex((c) => !juge(c))));
  const [etat, setEtat] = useState<Etat>("pret");
  const [reveler, setReveler] = useState(false);
  const c = cas[i];
  const faits = cas.filter(juge).length;
  const reste = aNoter(c);

  const changer = (j: Partial<CasAffiche["jugement"]>, geste: Parameters<typeof juger>[1]) => {
    setCas((tous) => tous.map((x, k) => (k === i ? { ...x, jugement: { ...x.jugement, ...j } } : x)));
    setEtat("attente");
    juger(c.id, geste).then(() => setEtat("enregistre"), () => setEtat("echec"));
  };
  const noter = (lettre: string, note: Note) => {
    const notes = { ...c.jugement.notes };
    const retirer = notes[lettre] === note;
    if (retirer) delete notes[lettre];
    else notes[lettre] = note;
    changer({ notes }, { lettre, note: retirer ? null : note });
  };
  const meilleure = (lettre: string) => {
    const nouvelle = c.jugement.meilleure === lettre ? null : lettre;
    changer({ meilleure: nouvelle }, { meilleure: nouvelle });
  };
  const aller = (k: number) => {
    setI(k);
    window.scrollTo({ top: 0 });
  };
  const voirLesResultats = () => (faits < cas.length ? setReveler(true) : routeur.push("/essai-ia?resultats=1"));

  const groupes = useMemo(() => {
    const g = new Map<AideTexte, number[]>();
    cas.forEach((x, k) => g.set(x.aide, [...(g.get(x.aide) ?? []), k]));
    return [...g];
  }, [cas]);

  return (
    <div className={`page ${styles.essai}`}>
      <header className="page-tete">
        <h1>Essai des aides IA</h1>
        <div className="page-tete__cmd">
          <span className={styles.avance}>
            {faits} cas jugé{faits > 1 ? "s" : ""} sur {cas.length}
          </span>
          <button type="button" className="btn" onClick={voirLesResultats}>
            Voir les résultats
          </button>
        </div>
      </header>
      <p className={styles.consigne}>
        Chaque proposition vient d’un modèle que vous ne voyez pas. Notez-les toutes, puis choisissez la meilleure.
      </p>

      <nav className={styles.navigation} aria-label="Cas de l'essai">
        <button type="button" className="btn btn--discret" onClick={() => aller(i - 1)} disabled={i === 0} aria-label="Cas précédent">
          <Icone nom="chevron" className={styles.versLaGauche} />
        </button>
        <select className="pchamp" aria-label="Aller au cas" value={i} onChange={(e) => aller(Number(e.target.value))}>
          {groupes.map(([aide, indices]) => (
            <optgroup key={aide} label={NOMS_DES_AIDES[aide]}>
              {indices.map((k) => (
                <option key={k} value={k}>
                  {juge(cas[k]) ? "✓ " : ""}
                  {cas[k].titre}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" className="btn btn--discret" onClick={() => aller(i + 1)} disabled={i === cas.length - 1} aria-label="Cas suivant">
          <Icone nom="chevron" />
        </button>
        <span className={styles.etat} role="status" data-etat={etat}>
          {etat === "attente" ? "Enregistrement…" : etat === "enregistre" ? <><Icone nom="coche" />Enregistré</> : etat === "echec" ? "Note non enregistrée : refaites ce geste." : null}
        </span>
      </nav>

      <article className={styles.cas} aria-labelledby="cas-titre">
        <p className={styles.aide}>{NOMS_DES_AIDES[c.aide]}</p>
        <h2 id="cas-titre">{c.titre}</h2>

        <section className={styles.demande} aria-label="Ce qui est demandé">
          <dl>
            {c.demande.map((d) => (
              <div key={d.etiquette}>
                <dt>{d.etiquette}</dt>
                <dd>{d.texte}</dd>
              </div>
            ))}
          </dl>
          {c.repere ? (
            <p className={styles.repere}>
              <strong>Ce qu’on attend :</strong> {c.repere}
            </p>
          ) : null}
        </section>

        <div className={styles.propositions} data-large={c.aide === "correction" || c.aide === "idees-choix" || c.aide === "parties" ? "" : undefined}>
          {c.propositions.map((p) => {
            const note = c.jugement.notes[p.lettre];
            const estMeilleure = c.jugement.meilleure === p.lettre;
            return (
              <section key={p.lettre} className={styles.proposition} data-meilleure={estMeilleure ? "" : undefined} aria-label={`Proposition ${p.lettre}`}>
                <header>
                  <h3>Proposition {p.lettre}</h3>
                  <button type="button" className={styles.meilleure} aria-pressed={estMeilleure} onClick={() => meilleure(p.lettre)}>
                    <Icone nom={estMeilleure ? "coche" : "drapeau"} />
                    {estMeilleure ? "La meilleure" : "Meilleure ?"}
                  </button>
                </header>
                <Contenu a={p.affichage} />
                <div className="bascule" role="group" aria-label={`Note de la proposition ${p.lettre}`}>
                  {NOTES.map((n) => (
                    <button key={n.note} type="button" aria-pressed={note === n.note} onClick={() => noter(p.lettre, n.note)}>
                      {n.nom}
                    </button>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <button type="button" className={`lien ${styles.aucune}`} aria-pressed={c.jugement.meilleure === "aucune"} onClick={() => meilleure("aucune")}>
          {c.jugement.meilleure === "aucune" ? "Aucune n’est bonne : choisi" : "Aucune n’est bonne"}
        </button>

        <Remarque key={c.id} depart={c.jugement.remarque} onGarder={(remarque) => changer({ remarque }, { remarque })} />

        <div className={styles.suite}>
          <p className={styles.resteANoter}>
            {reste.length
              ? `Reste à noter : ${reste.length > 1 ? `propositions ${reste.slice(0, -1).join(", ")} et ${reste[reste.length - 1]}` : `proposition ${reste[0]}`}.`
              : !c.jugement.meilleure ? "Reste à choisir la meilleure." : null}
          </p>
          {i < cas.length - 1 ? (
            <button type="button" className="btn btn--primaire btn--grand" onClick={() => aller(i + 1)}>
              Cas suivant
            </button>
          ) : (
            <button type="button" className="btn btn--primaire btn--grand" onClick={voirLesResultats}>
              Voir les résultats
            </button>
          )}
        </div>
      </article>

      {reveler ? (
        <Dialogue
          titre="Voir les modèles maintenant ?"
          onFermer={() => setReveler(false)}
          boutons={
            <button type="button" className="btn btn--primaire" onClick={() => routeur.push("/essai-ia?resultats=1")}>
              Voir les résultats
            </button>
          }
        >
          <p>
            Il reste {cas.length - faits} cas à juger. Une fois les modèles connus, les notes suivantes ne seront plus à l’aveugle.
          </p>
        </Dialogue>
      ) : null}
    </div>
  );
}

/** La remarque d'un cas, gardée quand on quitte le champ. */
function Remarque({ depart, onGarder }: { depart: string; onGarder: (r: string) => void }) {
  const [remarque, setRemarque] = useState(depart);
  return (
    <label className={styles.remarque}>
      <span>Remarque sur ce cas (facultative)</span>
      <textarea className="pchamp" rows={2} value={remarque} onChange={(e) => setRemarque(e.target.value)} onBlur={() => remarque !== depart && onGarder(remarque)} />
    </label>
  );
}

function Contenu({ a }: { a: Affichage }) {
  switch (a.sorte) {
    case "erreur":
      return <p className={styles.erreur}>{a.texte}</p>;
    case "texte":
      return <p className={styles.texte}>{a.texte}</p>;
    case "liste":
      return (
        <ol className={styles.liste}>
          {a.elements.map((e, k) => (
            <li key={k}>
              <strong>{e.titre}</strong>
              {e.texte ? <span>{e.texte}</span> : null}
              {e.note ? <em>{e.note}</em> : null}
            </li>
          ))}
        </ol>
      );
    case "correction":
      return (
        <div className={styles.correction}>
          {a.paragraphes.map((morceaux, k) => (
            <p key={k}>
              {morceaux.map((m, j) => (m.sorte === "pareil" ? <span key={j}>{m.texte}</span> : m.sorte === "retire" ? <del key={j}>{m.texte}</del> : <ins key={j}>{m.texte}</ins>))}
            </p>
          ))}
        </div>
      );
  }
}
