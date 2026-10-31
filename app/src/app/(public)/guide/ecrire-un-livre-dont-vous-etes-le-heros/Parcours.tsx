import type { ReactNode } from "react";
import styles from "./parcours.module.css";

/**
 * Le parcours d'une scène (partie 5 du guide), en schéma : quatre étapes, l'élève en haut et vous en
 * bas, la zone du papier puis celle de l'ordinateur, les deux retours possibles, la scène validée au
 * bout. Le texte de chaque étape est celui du guide ; le titre court et le rôle sont ceux du schéma.
 */

const Icone = ({ children }: { children: ReactNode }) => (
  <svg className={styles.icone} viewBox="0 0 24 24" aria-hidden="true">
    {children}
  </svg>
);

const ETAPES = [
  {
    qui: "eleve",
    titre: "Le brouillon",
    icone: (
      <Icone>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M9 9h6M9 13h6M9 17h3" />
      </Icone>
    ),
  },
  {
    qui: "vous",
    titre: "Votre lecture",
    icone: (
      <Icone>
        <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" />
        <circle cx="12" cy="12" r="2.6" />
      </Icone>
    ),
  },
  {
    qui: "eleve",
    titre: "La recopie",
    icone: (
      <Icone>
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M8 20h8M12 16v4" />
      </Icone>
    ),
  },
  {
    qui: "vous",
    titre: "La correction",
    icone: (
      <Icone>
        <path d="M4 20l4-1 11-11-3-3L5 16z" />
        <path d="M14 7l3 3" />
      </Icone>
    ),
  },
] as const;

const RETOURS = [
  { de: 2, texte: "à améliorer" },
  { de: 4, texte: "à reprendre" },
];

export function Parcours({ elements, enLigne }: { elements: string[]; enLigne: (texte: string) => ReactNode }) {
  return (
    <figure className={styles.parcours} aria-label="Le parcours d’une scène">
      <div className={styles.zones} aria-hidden="true">
        <span>Sur papier</span>
        <span>À l’ordinateur</span>
      </div>
      <div className={styles.piste}>
      <ol className={styles.etapes}>
        {elements.map((texte, i) => {
          const etape = ETAPES[i];
          const retour = RETOURS.find((r) => r.de === i + 1);
          return (
            <li key={texte} className={etape?.qui === "vous" ? styles.vous : styles.eleve}>
              <span className={styles.qui}>
                {i + 1} · {etape?.qui === "vous" ? "Vous" : "L’élève"}
              </span>
              <span className={styles.tete}>
                {etape?.icone}
                <span className={styles.titre}>{etape?.titre}</span>
              </span>
              <span className={styles.texte}>{enLigne(texte)}</span>
              {retour ? <span className={styles.retourCourt}>Si besoin, {retour.texte} : retour à l’étape {i}</span> : null}
              {i === elements.length - 1 ? (
                <span className={styles.validee}>
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3.5 8.5l3 3 6-7" />
                  </svg>
                  Validée
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
      {/* Les retours, sur grand écran : une boucle en pointillé, de l'étape de l'adulte à celle de l'élève */}
      {RETOURS.map((r) => (
        <span key={r.de} className={`${styles.boucle} ${r.de === 2 ? styles.boucleHaut : styles.boucleBas}`} aria-hidden="true">
          <span>{r.texte}</span>
        </span>
      ))}
      </div>
    </figure>
  );
}
