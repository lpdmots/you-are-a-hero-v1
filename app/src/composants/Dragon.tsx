import { TRACES_DU_DRAGON } from "./traces-du-dragon";

type Dessin = keyof typeof TRACES_DU_DRAGON;

/** Le dragon-livre seul, à la couleur du texte qui l'entoure (bleu canard par défaut via CSS). */
export function Dragon({ dessin = "moyen", className }: { dessin?: Dessin; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <g fill="currentColor" fillRule="evenodd">
        {TRACES_DU_DRAGON[dessin].map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}
