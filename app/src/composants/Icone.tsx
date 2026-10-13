/** Jeu d'icônes du système : trait 1,8, extrémités arrondies, grille 24. Une icône, un sens. */
const TRACES = {
  plus: <path d="M12 5v14M5 12h14" />,
  fleche: (
    <>
      <path d="M4.5 12h14" />
      <path d="M13.5 7l5 5-5 5" />
    </>
  ),
  "fleche-g": (
    <>
      <path d="M19.5 12h-14" />
      <path d="M10.5 7l-5 5 5 5" />
    </>
  ),
  coche: <path d="M5 12.5l4.2 4.2L19 7" />,
  oeil: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  imprimer: (
    <>
      <path d="M7 9V4h10v5" />
      <rect x="4" y="9" width="16" height="7.5" rx="1.8" />
      <path d="M7 14h10v6H7z" />
    </>
  ),
  points: (
    <>
      <circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  chevron: <path d="M9 5.5l6.5 6.5L9 18.5" />,
  "chevron-bas": <path d="M5.5 9l6.5 6.5L18.5 9" />,
  aide: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.6 9.8a2.4 2.4 0 1 1 3.6 2.1c-.8.5-1.2 1-1.2 1.9" />
      <circle cx="12" cy="16.2" r=".4" fill="currentColor" />
    </>
  ),
  alerte: (
    <>
      <path d="M12 4.2L20.8 19.5H3.2L12 4.2z" />
      <path d="M12 10v4.2" />
      <circle cx="12" cy="16.9" r=".4" fill="currentColor" />
    </>
  ),
  fermer: <path d="M6 6l12 12M18 6L6 18" />,
  crayon: (
    <>
      <path d="M5 19l1-4.2L15.6 5.2a1.9 1.9 0 0 1 2.7 0l.5.5a1.9 1.9 0 0 1 0 2.7L9.2 18 5 19z" />
      <path d="M13.8 7l3.2 3.2" />
    </>
  ),
  horloge: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  eleves: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c.6-3.3 2.8-5 5.5-5s4.9 1.7 5.5 5" />
      <circle cx="17" cy="9.5" r="2.5" />
      <path d="M16 14.6c2.4-.3 4.1 1.3 4.6 4.4" />
    </>
  ),
  main: (
    <path d="M8 12.5V6.8a1.5 1.5 0 0 1 3 0v4.7M11 11.5V5.3a1.5 1.5 0 0 1 3 0v6.2M14 11.5V6.8a1.5 1.5 0 0 1 3 0V14c0 3.6-2.4 6.5-5.8 6.5-2.1 0-3.4-.9-4.6-2.6L4.3 13.6a1.5 1.5 0 0 1 2.4-1.8L8 13.4" />
  ),
  vide: <circle cx="12" cy="12" r="7.5" strokeDasharray="2.6 2.6" />,
  drapeau: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4.5h10.5l-2.4 3.7 2.4 3.8H6" />
    </>
  ),
  fin: (
    <>
      <path d="M6 21V4" />
      <path d="M6 4.5h12v7.5H6" />
      <path d="M10 4.5v7.5M14 4.5v7.5M6 8.2h12" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="M4 17.5l5-4.5 3.5 3 3-2.5 4.5 4" />
    </>
  ),
  corbeille: (
    <>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6.5 7l.8 12.5h9.4L17.5 7" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  loupe: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5 5" />
    </>
  ),
  // Repère de prise : la carte se déplace en la tirant (F03.1, 10 octobre 2026)
  prise: (
    <>
      {[6, 12, 18].flatMap((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" fill="currentColor" stroke="none" />))}
    </>
  ),
  "chevron-haut": <path d="M5.5 15l6.5-6.5L18.5 15" />,
  // Un retour en arrière, dans les chemins : la flèche qui remonte
  "fleche-haut": (
    <>
      <path d="M12 19.5v-14" />
      <path d="M7 10.5l5-5 5 5" />
    </>
  ),
  sac: (
    <>
      <path d="M5.5 9.5h13l1 9.2a1.6 1.6 0 0 1-1.6 1.8H6.1a1.6 1.6 0 0 1-1.6-1.8z" />
      <path d="M9 9.5V7.2a3 3 0 0 1 6 0v2.3" />
      <path d="M9.5 14h5" />
    </>
  ),
  noter: (
    <>
      <path d="M9.5 15.5l.8-3.4 7.2-7.2a1.7 1.7 0 0 1 2.4 0l.2.2a1.7 1.7 0 0 1 0 2.4l-7.2 7.2z" />
      <path d="M4 19.5h8.5" />
      <path d="M16 6.5l2.6 2.6" />
    </>
  ),
  feuille: (
    <>
      <path d="M5.5 3.5h13v17h-13z" />
      <path d="M9 8h6" />
      <rect x="8.6" y="11.3" width="3" height="3" rx=".7" />
      <path d="M14 12.8h1.5M8.8 17.5h6.4" />
    </>
  ),
  importer: (
    <>
      <path d="M12 15.5V5M7.5 9.5L12 5l4.5 4.5" />
      <path d="M5 19.5h14" />
    </>
  ),
  // Bannette : un texte gardé à part (F08.1)
  apart: (
    <>
      <path d="M8 12V4.5h8V12" />
      <path d="M10.5 7.5h3M10.5 10h3" />
      <path d="M3.5 12h5l1 2.6h5l1-2.6h5v6.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 11v5" />
      <circle cx="12" cy="8.1" r=".4" fill="currentColor" />
    </>
  ),
  bloque: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 8.5l7 7" />
    </>
  ),
  sablier: (
    <>
      <path d="M7 4h10M7 20h10" />
      <path d="M8 4c0 4 8 4.5 8 8s-8 4-8 8" />
      <path d="M16 4c0 4-8 4.5-8 8s8 4 8 8" />
    </>
  ),
  // Une phrase de choix : les chemins qui partent d'une scène (F05)
  choix: (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="12" cy="19" r="2" />
      <path d="M12 17v-3.5c0-2-6-2.5-6-6M12 13.5c0-2 6-2.5 6-6" />
    </>
  ),
  chemins: (
    <>
      <rect x="3" y="9.5" width="6" height="5" rx="1.2" />
      <rect x="15" y="3.5" width="6" height="5" rx="1.2" />
      <rect x="15" y="15.5" width="6" height="5" rx="1.2" />
      <path d="M9 12h2.5c1.5 0 1.5-6 3.5-6M11.5 12c1.5 0 1.5 6 3.5 6" />
    </>
  ),
  entree: (
    <>
      <path d="M13 4.5h5.5v15H13" />
      <path d="M3.5 12H13" />
      <path d="M9.5 8l4 4-4 4" />
    </>
  ),
  sortie: (
    <>
      <path d="M11 4.5H5.5v15H11" />
      <path d="M10 12h10.5" />
      <path d="M16.5 8l4 4-4 4" />
    </>
  ),
  // Liaison cachée : le lecteur trouve lui-même le numéro (F05.1)
  cle: (
    <>
      <circle cx="8" cy="15" r="3.8" />
      <path d="M10.8 12.3L19 4.5M16 7.5l2.5 2.5M13.8 9.7l1.8 1.8" />
    </>
  ),
  cadenas: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
      <path d="M12 14.2v2.2" />
    </>
  ),
  "cadenas-ouvert": (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 6.6-1.6" />
      <path d="M12 14.2v2.2" />
    </>
  ),
  // Refaire la phrase automatiquement : une flèche ronde
  refaire: (
    <>
      <path d="M19.5 12a7.5 7.5 0 1 1-2.4-5.5" />
      <path d="M19.8 4.5v4.2h-4.2" />
    </>
  ),
  // Un chapitre : le cahier du plan
  cahier: (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3.5v17M12.5 8h3.5M12.5 11.5h3.5" />
    </>
  ),
  coeur: <path d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 7.8a3.9 3.9 0 0 1 7 2.3c0 5.1-7 9.4-7 9.4z" />,
  de: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.5" />
      {[[8.6, 8.6], [15.4, 8.6], [12, 12], [8.6, 15.4], [15.4, 15.4]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r=".7" fill="currentColor" />
      ))}
    </>
  ),
  // « À reprendre » : le demi-tour, pour la seule reprise demandée par l'enseignant
  "demi-tour": (
    <>
      <path d="M9 7L4.5 11.5 9 16" />
      <path d="M5 11.5h9.5a4.5 4.5 0 0 1 0 9H12" />
    </>
  ),
  // « Prête » : la scène entre dans le livre
  livre: (
    <>
      <path d="M4.5 5.5c2.8-.9 5.3-.5 7.5 1.2v12.8c-2.2-1.7-4.7-2.1-7.5-1.2z" />
      <path d="M19.5 5.5c-2.8-.9-5.3-.5-7.5 1.2v12.8c2.2-1.7 4.7-2.1 7.5-1.2z" />
    </>
  ),
  // Une remise : la feuille que l'élève a rendue
  papier: (
    <>
      <path d="M6.5 3.5h7.5l4 4v13h-11.5z" />
      <path d="M14 3.5v4h4" />
      <path d="M9.5 12h5M9.5 15h5M9.5 18h3" />
    </>
  ),
} as const;

export type NomIcone = keyof typeof TRACES;

export function Icone({ nom, className }: { nom: NomIcone; className?: string }) {
  return (
    <svg
      className={className ? `ic ${className}` : "ic"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRACES[nom]}
    </svg>
  );
}
