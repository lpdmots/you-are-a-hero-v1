import { Icone } from "./Icone";

/** Ligne d'étapes d'un parcours guidé : l'étape en cours, celles qui sont faites. */
export function Etapes({ noms, enCours }: { noms: string[]; enCours: number }) {
  return (
    <ol className="etapes">
      {noms.map((nom, i) => {
        const rang = i + 1;
        const etat = rang === enCours ? "est-en-cours" : rang < enCours ? "est-faite" : undefined;
        return (
          <li key={nom} className={etat} aria-current={rang === enCours ? "step" : undefined}>
            <span className="etapes__n">{rang < enCours ? <Icone nom="coche" /> : rang}</span>
            <span className="etapes__nom">{nom}</span>
          </li>
        );
      })}
    </ol>
  );
}
