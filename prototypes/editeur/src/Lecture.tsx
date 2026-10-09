// Lecture du texte enregistré : livre imprimé (numéros) et lecteur en ligne
// (renvois activables). Même fonction `segments` que l'éditeur (point 13).

import { Segments, useLivre } from './editeur/elements';
import type { Serveur } from './serveur';

export function Lecture(props: { serveur: Serveur; sceneId: string; mode: 'livre' | 'lecteur'; surAller?: (id: string) => void }) {
  const { serveur, sceneId, mode, surAller } = props;
  const livre = useLivre(serveur);
  const scene = serveur.scenes.get(sceneId);
  if (!scene) return null;
  return (
    <article className={`lecture lecture-${mode}`} data-test={`lecture-${mode}`} aria-label={mode === 'livre' ? 'Aperçu du livre' : 'Lecteur en ligne'}>
      <h3>
        {mode === 'livre' ? 'Livre' : 'Lecteur en ligne'} · {livre.numeroDe(sceneId)}
      </h3>
      {scene.doc
        .filter((b) => b.type !== 'note')
        .map((b) => (
          <p key={b.id} className={`lu lu-${b.type}`} data-bloc={b.type}>
            <Segments bloc={b} livre={livre} surRenvoi={mode === 'lecteur' ? surAller : undefined} />
          </p>
        ))}
    </article>
  );
}
