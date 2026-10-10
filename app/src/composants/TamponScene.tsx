import { Icone } from "./Icone";

/**
 * Tampon d'état d'une scène. À l'étape 3, une scène est « En cours » ; sans texte, elle
 * porte « Texte vide », partout où l'état se lit (F06.5). Les autres états arrivent avec
 * la remise et la validation.
 */
export function TamponScene({ vide }: { vide: boolean }) {
  return vide ? (
    <span className="tampon" data-e="vide">
      <Icone nom="vide" />
      Texte vide
    </span>
  ) : (
    <span className="tampon" data-e="cours">
      <Icone nom="crayon" />
      En cours
    </span>
  );
}
