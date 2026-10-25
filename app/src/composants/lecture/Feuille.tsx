"use client";

import { useEffect, type RefObject } from "react";
import { Icone } from "@/composants/Icone";
import { changerCompteur, lancer, type EtatFeuille } from "@/domaine/lecture";
import type { Feuille as FeuilleDuLivre } from "@/domaine/preparation";

/**
 * La feuille d'aventure du lecteur (F04.2) : il la remplit lui-même, rien n'est vérifié. Ses
 * compteurs par « − » et « + », jamais sous zéro ; ses listes, une ligne de plus dès qu'elles
 * sont pleines ; ses notes ; le dé, dont le résultat est affiché, jamais interprété.
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

/** « Volonté 4 · Inventaire 2 » : ce que la barre du téléphone dit de la feuille. */
export function resumeFeuille(feuille: FeuilleDuLivre, etat: EtatFeuille): string {
  return feuille.sections
    .flatMap((s) => {
      if (s.type === "compteurs") return s.compteurs.map((c) => `${c.nom || "Compteur"} ${etat.compteurs[`${s.id}/${c.id}`] ?? c.depart}`);
      if (s.type === "liste") return [`${s.titre || "Liste"} ${(etat.listes[s.id] ?? []).filter((l) => l.trim()).length}`];
      return [];
    })
    .join(" · ");
}

/** « Volonté 4 » : les compteurs seuls, sur le bouton qui ouvre la feuille ; rien sans compteur. */
export function resumeCompteurs(feuille: FeuilleDuLivre, etat: EtatFeuille): string {
  return feuille.sections
    .flatMap((s) => (s.type === "compteurs" ? s.compteurs.map((c) => `${c.nom || "Compteur"} ${etat.compteurs[`${s.id}/${c.id}`] ?? c.depart}`) : []))
    .join(" · ");
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
          {s.type === "liste"
            ? (() => {
                const lignes = etat.listes[s.id] ?? [];
                // Quatre lignes, puis une de plus dès qu'elles sont pleines
                const montrees = Math.max(4, lignes.filter((l) => l.trim()).length + 1, lignes.length);
                return (
                  <div className="fa-liste">
                    {Array.from({ length: montrees }, (_, i) => (
                      <input
                        key={i}
                        type="text"
                        aria-label={`${s.titre || "Liste"}, ligne ${i + 1}`}
                        maxLength={80}
                        value={lignes[i] ?? ""}
                        onChange={(ev) => {
                          const suite = [...lignes];
                          suite[i] = ev.target.value;
                          onChange({ ...etat, listes: { ...etat.listes, [s.id]: suite } });
                        }}
                      />
                    ))}
                  </div>
                );
              })()
            : null}
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
