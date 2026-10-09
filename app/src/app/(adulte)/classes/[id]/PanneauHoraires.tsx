"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icone } from "@/composants/Icone";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { libelleAnnee } from "@/domaine/annee";
import { ecrireHeure, JOURS_COURTS, lireHeure, PLAGE_PAR_DEFAUT, plageValide, type Plage } from "@/domaine/horaires";
import { majuscule } from "@/domaine/texte";
import type { Classe } from "@/serveur/lectures";
import { reglerHoraires } from "../actions";
import styles from "../classes.module.css";

type Saisie = { jours: number[]; de: string; a: string }; // heures telles qu'on les écrit : « 8 h 30 »

const enSaisie = (p: Plage): Saisie => ({ jours: p.jours, de: ecrireHeure(p.de), a: ecrireHeure(p.a) });

/** Horaires : un interrupteur, des jours en pastilles, « De … à … » (F06.4, 7 octobre 2026). */
export function PanneauHoraires({ classe, onFermer }: { classe: Classe; onFermer: () => void }) {
  const routeur = useRouter();
  const [, lancer] = useTransition();
  const [limites, setLimites] = useState(classe.horairesLimites);
  const [plages, setPlages] = useState<Saisie[]>((classe.plages.length ? classe.plages : [PLAGE_PAR_DEFAUT]).map(enSaisie));
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const enregistrer = (l: boolean, saisies: Saisie[]) => {
    setEnregistre(false);
    const lues = saisies.map((s) => ({ jours: s.jours, de: lireHeure(s.de), a: lireHeure(s.a) }));
    if (l && lues.some((p) => !p.de || !p.a)) {
      setErreur("Écrivez les heures comme « 8 h 30 ».");
      return;
    }
    const propres = lues as Plage[];
    if (l && !propres.every(plageValide)) {
      setErreur("Cochez au moins un jour, et écrivez une heure de début avant l’heure de fin.");
      return;
    }
    setErreur(null);
    lancer(async () => {
      const r = await reglerHoraires(classe.id, l, propres);
      if (!r.ok) {
        setErreur(r.erreur);
        return;
      }
      setEnregistre(true);
      routeur.refresh();
    });
  };

  const changer = (suivantes: Saisie[], tout_de_suite = true) => {
    setPlages(suivantes);
    if (tout_de_suite) enregistrer(limites, suivantes);
    else setEnregistre(false);
  };
  const plage = (i: number, morceau: Partial<Saisie>): Saisie[] => plages.map((p, k) => (k === i ? { ...p, ...morceau } : p));

  return (
    <Panneau
      titre="Horaires"
      sous={`${classe.nom} · ${libelleAnnee(classe.anneeDebut)}`}
      onFermer={onFermer}
      pied={<PiedFermer enregistre={enregistre} onFermer={onFermer} />}
    >
      <section>
        <label className="inter">
          <input
            type="checkbox"
            role="switch"
            checked={limites}
            onChange={(e) => { setLimites(e.target.checked); enregistrer(e.target.checked, plages); }}
          />
          <span className="inter__piste" aria-hidden="true" />
          <span>Limiter les horaires</span>
        </label>
        <p>
          {limites
            ? "Hors de ces horaires, les élèves ne peuvent ni lire ni écrire. À l’heure de fin, leur texte est enregistré."
            : "Sans horaires, les élèves travaillent quand ils veulent, à l’école comme à la maison."}
        </p>
      </section>
      {limites ? (
        <section className={styles.plages}>
          {plages.map((p, i) => (
            <fieldset key={i} className={styles.plage}>
              <legend className="vh">Horaires {i + 1}</legend>
              <div className={styles.jours} role="group" aria-label="Jours">
                {JOURS_COURTS.map((j, k) => (
                  <label key={j} className={styles.jour}>
                    <input
                      type="checkbox"
                      checked={p.jours.includes(k + 1)}
                      onChange={(e) => changer(plage(i, { jours: e.target.checked ? [...p.jours, k + 1] : p.jours.filter((x) => x !== k + 1) }))}
                    />
                    <span>{majuscule(j)}</span>
                  </label>
                ))}
              </div>
              <div className={styles.heures}>
                <label>
                  De{" "}
                  <input className="pchamp" type="text" value={p.de} onChange={(e) => changer(plage(i, { de: e.target.value }), false)} onBlur={() => enregistrer(limites, plages)} />
                </label>
                <label>
                  à{" "}
                  <input className="pchamp" type="text" value={p.a} onChange={(e) => changer(plage(i, { a: e.target.value }), false)} onBlur={() => enregistrer(limites, plages)} />
                </label>
                {i ? (
                  <button type="button" className="btn btn--discret" aria-label="Retirer ces horaires" onClick={() => changer(plages.filter((_, k) => k !== i))}>
                    <Icone nom="fermer" />
                  </button>
                ) : null}
              </div>
            </fieldset>
          ))}
          {erreur ? (
            <p className="erreur" role="alert">
              <Icone nom="alerte" />
              <span>{erreur}</span>
            </p>
          ) : null}
          <button type="button" className="lien" onClick={() => changer([...plages, { jours: [3], de: "8 h 30", a: "11 h 30" }])}>
            Ajouter d’autres horaires
          </button>
        </section>
      ) : null}
      <section>
        <p>Ces horaires valent pour tous les projets de la classe. Vous gardez toujours votre accès.</p>
      </section>
    </Panneau>
  );
}
