"use client";

/**
 * Les points acceptés ou « à savoir », rappelés avant le PDF définitif et avant de partager (F11.6) : repliés,
 * pour ne pas redire en entier ce que l'adulte a déjà jugé à « Relire » et à « Vérifier les chemins »
 * (décidé par le porteur, révision de novembre 2026). Ils se relisent d'un clic.
 */
export function PointsASavoir({ rappels }: { rappels: string[] }) {
  if (!rappels.length) return null;
  return (
    <details className="points-a-savoir">
      <summary>
        {rappels.length} point{rappels.length > 1 ? "s" : ""} à savoir · <span className="points-a-savoir__revoir">Revoir</span>
      </summary>
      <ul>
        {rappels.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </details>
  );
}
