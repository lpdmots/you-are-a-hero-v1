import type { CSSProperties } from "react";
import { couleurDe, initiales } from "@/domaine/eleves";

/** La gommette désigne un élève : ses deux premières lettres, à sa couleur adoucie. */
export function Gommette({ prenom, couleur, taille }: { prenom: string; couleur: number; taille?: "s" | "l" }) {
  return (
    <span
      className={`gommette${taille ? ` gommette--${taille}` : ""}`}
      style={{ "--g": couleurDe(couleur) } as CSSProperties}
      aria-hidden="true"
    >
      {initiales(prenom)}
    </span>
  );
}

/** Places vides, comme des porte-manteaux qui attendent. */
export function PlacesVides({ nombre }: { nombre: number }) {
  return (
    <>
      {Array.from({ length: nombre }, (_, i) => (
        <span key={i} className="gommette gommette--libre" />
      ))}
    </>
  );
}
