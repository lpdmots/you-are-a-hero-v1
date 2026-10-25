"use client";

import { useEffect, useState, type RefObject } from "react";
import { Icone } from "@/composants/Icone";
import { ajouterALaListe, lignesEcrites, rayerDeLaListe } from "@/domaine/inventaire";
import { changerCompteur, lancer, type EtatFeuille } from "@/domaine/lecture";
import type { Feuille as FeuilleDuLivre } from "@/domaine/preparation";

/**
 * La feuille d'aventure du lecteur (F04.2) : il la remplit lui-même, rien n'est vérifié. Ses
 * compteurs par « − » et « + », jamais sous zéro ; ses listes en badges, qu'un clic raye
 * (F04-AC45) ; ses notes ; le dé, dont le résultat est affiché, jamais interprété.
 */

const POINTS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

export function Face({ valeur }: { valeur: number | null }) {
  return (
    <span className="de-face" role="img" aria-label={valeur ? `Face ${valeur}` : "Dé pas encore lancé"}>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={valeur && POINTS[valeur]?.includes(i) ? "de-face__point" : undefined} />
      ))}
    </span>
  );
}

/** « Volonté 4 », « Inventaire 2 » : les valeurs de la feuille, dans son ordre. */
export function valeursDeLaFeuille(feuille: FeuilleDuLivre, etat: EtatFeuille): string[] {
  return feuille.sections.flatMap((s) => {
    if (s.type === "compteurs") return s.compteurs.map((c) => `${c.nom || "Compteur"} ${etat.compteurs[`${s.id}/${c.id}`] ?? c.depart}`);
    if (s.type === "liste") return [`${s.titre || "Liste"} ${(etat.listes[s.id] ?? []).filter((l) => l.trim()).length}`];
    return [];
  });
}

/** « Volonté 4 » : les compteurs seuls, sur le bouton qui ouvre la feuille ; rien sans compteur. */
export function resumeCompteurs(feuille: FeuilleDuLivre, etat: EtatFeuille): string {
  return feuille.sections
    .flatMap((s) => (s.type === "compteurs" ? s.compteurs.map((c) => `${c.nom || "Compteur"} ${etat.compteurs[`${s.id}/${c.id}`] ?? c.depart}`) : []))
    .join(" · ");
}

/**
 * La barre basse du téléphone et de la tablette (retour du porteur, 25 octobre 2026) : « Ma
 * feuille », puis une ou deux valeurs, celles qui tiennent entières, sans points de suspension ;
 * le dé du livre à droite, qui affiche son dernier lancer, le même que celui de la feuille.
 */
export function BarreDeLaFeuille({
  feuille, etat, ouverte, onFeuille, des, onDes,
}: {
  feuille: FeuilleDuLivre;
  etat: EtatFeuille;
  ouverte: boolean;
  onFeuille: () => void;
  des: number[] | null;
  onDes: (des: number[]) => void;
}) {
  // Chaque lancer rejoue l'arrivée du résultat, même quand la face ne change pas
  const [lancers, setLancers] = useState(0);
  const nombre = feuille.des;
  return (
    <>
      <button type="button" className="btn barre-feuille__ouvrir" aria-expanded={ouverte} aria-controls="feuille-aventure" onClick={onFeuille}>
        <Icone nom="feuille" />
        Ma feuille
      </button>
      <span className="barre-feuille__valeurs">
        {valeursDeLaFeuille(feuille, etat)
          .slice(0, 2)
          .map((v) => (
            <span key={v}>{v}</span>
          ))}
      </span>
      {nombre ? (
        // Le résultat s'affiche dans le bouton même (idée du porteur, 25 octobre 2026) : le dé
        // tant qu'on n'a pas lancé, puis la face tirée ; un nouvel appui relance
        <button
          type="button"
          className={`btn barre-feuille__lancer${des ? " barre-feuille__lancer--lance" : ""}`}
          aria-label={des ? `${des.length === 2 ? `${des[0]} et ${des[1]} : ${des[0] + des[1]}` : `Tu as fait ${des[0]}`}. Relancer` : nombre === 2 ? "Lancer les dés" : "Lancer le dé"}
          title={nombre === 2 ? "Lancer les dés" : "Lancer le dé"}
          onClick={() => {
            setLancers((n) => n + 1);
            onDes(lancer(nombre));
          }}
        >
          {des ? (
            <span key={lancers} className="barre-feuille__resultat" aria-hidden="true">
              {des.map((v, i) => (
                <Face key={i} valeur={v} />
              ))}
              {des.length === 2 ? <span className="barre-feuille__total">{des[0] + des[1]}</span> : null}
            </span>
          ) : (
            <Icone nom="de" />
          )}
        </button>
      ) : null}
    </>
  );
}

/**
 * Sur téléphone, la feuille ouverte est posée au bas de l'écran : le clavier la cachait dès qu'on
 * écrivait une ligne (retour du porteur, 25 octobre 2026). Tant qu'elle est ouverte, elle suit la
 * partie visible de l'écran (`--clavier`, `--visible`) et la ligne en cours reste sous les yeux.
 */
export function useAuDessusDuClavier(feuille: RefObject<HTMLElement | null>, ouverte: boolean) {
  useEffect(() => {
    const vue = window.visualViewport;
    const el = feuille.current;
    if (!ouverte || !vue || !el) return;
    const suivre = () => {
      const clavier = Math.max(0, window.innerHeight - vue.height - vue.offsetTop);
      el.style.setProperty("--clavier", `${Math.round(clavier)}px`);
      el.style.setProperty("--visible", `${Math.round(vue.height)}px`);
      const champ = document.activeElement;
      if (clavier > 0 && champ instanceof HTMLElement && el.contains(champ) && champ.matches("input, textarea")) {
        champ.scrollIntoView({ block: "nearest" });
      }
    };
    suivre();
    vue.addEventListener("resize", suivre);
    vue.addEventListener("scroll", suivre);
    el.addEventListener("focusin", suivre);
    return () => {
      vue.removeEventListener("resize", suivre);
      vue.removeEventListener("scroll", suivre);
      el.removeEventListener("focusin", suivre);
      el.style.removeProperty("--clavier");
      el.style.removeProperty("--visible");
    };
  }, [feuille, ouverte]);
}

export function Feuille({
  feuille, etat, onChange, des, onDes, regles,
}: {
  feuille: FeuilleDuLivre;
  etat: EtatFeuille;
  onChange: (etat: EtatFeuille) => void;
  /** Le dernier lancer, s'il y en a eu un */
  des: number[] | null;
  onDes: (des: number[]) => void;
  regles: string;
}) {
  return (
    <div className="feuille-aventure recit">
      {feuille.sections.map((s) => (
        <section key={s.id} className="fa-section" aria-label={s.titre || undefined}>
          {s.titre ? <h3 className="fa-section__titre">{s.titre}</h3> : null}
          {s.type === "compteurs"
            ? s.compteurs.map((c) => {
                const cle = `${s.id}/${c.id}`;
                const valeur = etat.compteurs[cle] ?? c.depart;
                const regler = (pas: 1 | -1) => onChange({ ...etat, compteurs: { ...etat.compteurs, [cle]: changerCompteur(valeur, pas) } });
                return (
                  <div key={c.id} className="fa-compteur">
                    <span className="fa-compteur__nom">
                      {c.nom || "Compteur"}
                      <small>au départ : {c.depart}</small>
                    </span>
                    <button type="button" className="fa-rond" aria-label={`Retirer un point : ${c.nom}`} disabled={valeur === 0} onClick={() => regler(-1)}>
                      −
                    </button>
                    <span className="fa-compteur__valeur" aria-live="polite">
                      {valeur}
                    </span>
                    <button type="button" className="fa-rond" aria-label={`Ajouter un point : ${c.nom}`} onClick={() => regler(1)}>
                      +
                    </button>
                  </div>
                );
              })
            : null}
          {s.type === "liste" ? <ListeEnBadges titre={s.titre || "Liste"} lignes={etat.listes[s.id]} onChange={(lignes) => onChange({ ...etat, listes: { ...etat.listes, [s.id]: lignes } })} /> : null}
          {s.type === "notes" ? (
            <textarea
              className="fa-notes"
              aria-label={s.titre || "Notes"}
              rows={4}
              maxLength={2000}
              value={etat.notes[s.id] ?? ""}
              onChange={(ev) => onChange({ ...etat, notes: { ...etat.notes, [s.id]: ev.target.value } })}
            />
          ) : null}
        </section>
      ))}
      {feuille.des ? (
        <section className="fa-section" id="feuille-de" aria-label="Dé">
          <h3 className="fa-section__titre">{feuille.des === 2 ? "Dés" : "Dé"}</h3>
          <div className="fa-de">
            {(des ?? Array.from({ length: feuille.des }, () => null)).map((v, i) => (
              <Face key={i} valeur={v} />
            ))}
            <button type="button" className="btn btn--petit" onClick={() => onDes(lancer(feuille.des as 1 | 2))}>
              <Icone nom="de" />
              {feuille.des === 2 ? "Lancer les dés" : "Lancer le dé"}
            </button>
          </div>
          <p className="fa-de__resultat" aria-live="polite">
            {!des ? "Le dé n’a pas encore été lancé." : des.length === 2 ? `${des[0]} et ${des[1]} : ${des[0] + des[1]} en tout` : `Tu as fait ${des[0]}`}
          </p>
          <p className="fa-de__aide">Le dé ne décide de rien : lis la règle dans le passage, puis choisis toi-même.</p>
        </section>
      ) : null}
      {regles.trim() ? (
        <details className="fa-regles">
          <summary>
            <Icone nom="aide" />
            Règles du jeu
          </summary>
          <div className="recit">
            {regles.split(/\n+/).map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

/**
 * Une liste de la feuille, en badges (demandé par le porteur le 25 octobre 2026, F04-AC45) : un
 * clic sur un badge le raye, « Remettre » le rend tant qu'on n'a rien changé d'autre ; un champ
 * au bout pour en écrire un. Le livre imprimé garde ses lignes à remplir.
 */
function ListeEnBadges({ titre, lignes, onChange }: { titre: string; lignes: string[] | undefined; onChange: (lignes: string[]) => void }) {
  const [saisie, setSaisie] = useState("");
  const [raye, setRaye] = useState<{ nom: string; rang: number } | null>(null);
  const ecrites = lignesEcrites(lignes);
  const etat = (l: string[]): EtatFeuille => ({ compteurs: {}, listes: { l }, notes: {} });
  const ajouter = () => {
    const suite = ajouterALaListe(etat(ecrites), "l", saisie).listes.l;
    if (suite !== ecrites) onChange(suite);
    setSaisie("");
    setRaye(null);
  };
  return (
    <div className="fa-liste">
      {ecrites.length ? (
        <ul className="fa-badges" aria-label={titre}>
          {ecrites.map((nom, i) => (
            <li key={`${i}-${nom}`}>
              <button
                type="button"
                className="fa-badge"
                aria-label={`Rayer ${nom}`}
                title="Rayer"
                onClick={() => {
                  setRaye({ nom, rang: ecrites.indexOf(nom) });
                  onChange(rayerDeLaListe(etat(ecrites), "l", nom).listes.l);
                }}
              >
                {nom}
                <Icone nom="fermer" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {raye ? (
        <p className="fa-raye" aria-live="polite">
          {raye.nom} rayé.{" "}
          <button
            type="button"
            className="lien"
            onClick={() => {
              onChange([...ecrites.slice(0, raye.rang), raye.nom, ...ecrites.slice(raye.rang)]);
              setRaye(null);
            }}
          >
            Remettre
          </button>
        </p>
      ) : null}
      <form
        className="fa-ajout"
        onSubmit={(ev) => {
          ev.preventDefault();
          ajouter();
        }}
      >
        <input type="text" aria-label={`${titre}, écrire`} placeholder="Écrire…" maxLength={80} value={saisie} enterKeyHint="done" onChange={(ev) => setSaisie(ev.target.value)} />
        <button type="submit" className="fa-rond" aria-label={`Ajouter à ${titre}`} disabled={!saisie.trim()}>
          +
        </button>
      </form>
    </div>
  );
}
