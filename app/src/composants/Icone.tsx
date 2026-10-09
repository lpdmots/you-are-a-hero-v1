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
