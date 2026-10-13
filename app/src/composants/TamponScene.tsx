import { NOM_TAMPON, SIGNE_TAMPON, tamponDe, type Etat } from "@/domaine/etats";
import { Icone } from "./Icone";

/**
 * Tampon d'état d'une scène : « En cours », « À reprendre », « À valider », « Validé »,
 * « Prête » (F07.1, F11.1). Une scène « En cours » sans texte porte « Texte vide », partout
 * où l'état se lit (F06.5). Ce tampon ne se clique pas : celui qui change l'état porte un
 * chevron (`EtatScene`).
 */
export function TamponScene({ etat = "cours", vide }: { etat?: Etat; vide: boolean }) {
  const tampon = tamponDe(etat, vide);
  return (
    <span className="tampon" data-e={tampon}>
      <Icone nom={SIGNE_TAMPON[tampon]} />
      {NOM_TAMPON[tampon]}
    </span>
  );
}
