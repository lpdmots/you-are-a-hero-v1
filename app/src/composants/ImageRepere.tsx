import { adresseRepere } from "@/domaine/visuels";

/**
 * Image de repérage d'un projet, d'une partie ou d'un chapitre (F10.1) : l'image choisie,
 * sinon un visuel de l'application. Décorative : le titre est toujours écrit à côté.
 */
export function ImageRepere({
  repere, graine, grande, prioritaire,
}: {
  repere: { imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null };
  /** Ce qui tient lieu de visuel par défaut tant qu'aucun n'est gardé : l'identifiant de l'élément */
  graine: string;
  /** Pour une image large à l'écran : le visuel entier, et non sa vignette */
  grande?: boolean;
  prioritaire?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- images servies par l'application, déjà réduites à l'import
    <img
      className="image-couvrante"
      src={adresseRepere(repere, graine, grande)}
      alt=""
      loading={prioritaire ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
    />
  );
}
