import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { referenceScene } from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";
import type { RappelTextes as Rappel } from "@/serveur/copie";

/**
 * Ligne de rappel du Suivi (F08-AC11) : « 1 texte gardé à part : S015 Le pont ». En lien,
 * non en filtre : le nom de la scène l'ouvre sur l'onglet de ce texte. Au-delà de deux
 * scènes, les références seules, avec le nombre quand une scène en porte plusieurs.
 */
export function RappelTextes({ projetId, scenes }: { projetId: string; scenes: Rappel[] }) {
  if (scenes.length === 0) return null;
  const total = scenes.reduce((n, s) => n + s.nombre, 0);
  const court = scenes.length > 2;
  return (
    <p className="rappel">
      <Icone nom="apart" />
      <span>
        {total} texte{pluriel(total)} gardé{pluriel(total)} à part :
      </span>
      {scenes.map((s, i) => (
        <span key={s.sceneId}>
          {i > 0 ? (court ? "· " : "et ") : null}
          <Link className="lien" href={`/projet/${projetId}/scene/${s.sceneId}?texte=${s.copieId}&de=suivi`}>
            <span className="code">{referenceScene(s.reference)}</span>
            {!court && s.titre ? ` ${s.titre}` : ""}
          </Link>
          {s.nombre > 1 ? ` (${s.nombre})` : ""}
        </span>
      ))}
    </p>
  );
}
