// Rendu des blocs et du renvoi dans l'éditeur.

import { PlateElement, type PlateElementProps, useSelected } from 'platejs/react';
import { createContext, useContext, useSyncExternalStore } from 'react';

import { type Bloc, type Livre, type Renvoi, RENVOI_VIDE, estFerme, estProtege, renvoisDe, segments, texteBloc } from '../modele';
import type { Serveur } from '../serveur';
import type { Commandes } from './commandes';
import type { Env } from './regles';

export type Proto = { env: Env; serveur: Serveur; commandes: () => Commandes };
export const ContexteProto = createContext<Proto | null>(null);
export const useProto = () => useContext(ContexteProto)!;

/** Numéros et formule viennent du serveur, pas du document. */
export function useLivre(serveur: Serveur): Livre {
  useSyncExternalStore(serveur.abonner, serveur.instantane);
  return serveur.livre();
}

export function Segments(props: { bloc: Bloc; livre: Livre; surRenvoi?: (cible: string) => void }) {
  const { bloc, livre, surRenvoi } = props;
  return (
    <>
      {segments(bloc, livre).map((s, i) => {
        if (s.genre === 'renvoi') {
          const numero = s.numero === null ? RENVOI_VIDE : String(s.numero);
          return surRenvoi && s.cible ? (
            <button key={i} type="button" className="numero" onClick={() => surRenvoi(s.cible!)}>
              {numero}
            </button>
          ) : (
            <span key={i} className={s.numero === null ? 'numero vide' : 'numero'} data-renvoi={s.id}>
              {numero}
            </span>
          );
        }
        let rendu: React.ReactNode = s.texte;
        if (s.bold) rendu = <strong>{rendu}</strong>;
        if (s.italic) rendu = <em>{rendu}</em>;
        if (s.underline) rendu = <u>{rendu}</u>;
        return <span key={i}>{rendu}</span>;
      })}
    </>
  );
}

function repere(bloc: Bloc, proto: Proto): string {
  const { env, serveur } = proto;
  const eleve = env.ctx.role !== 'adulte';
  if (bloc.type === 'choix') {
    const destinations = renvoisDe(bloc).map((r) => {
      if (!r.cible) return 'destination à décider';
      const scene = serveur.scenes.get(r.cible);
      if (!scene) return 'scène absente';
      // Un élève ne voit ni titre ni référence d'une scène d'un autre chapitre.
      if (eleve && scene.chapitre !== env.ctx.chapitreScene) return `autre chapitre · ${scene.chapitre}`;
      return `${scene.id} ${scene.titre}`;
    });
    return `→ ${destinations.join(' · ')}${estProtege(bloc, env.ctx) ? " · préparé par l'enseignant" : ''}`;
  }
  if (bloc.type === 'note') return "Note de l'enseignant · jamais imprimée";
  const legende = bloc.type === 'action' ? 'Action de jeu' : '';
  if (estProtege(bloc, env.ctx)) return [legende, "préparé par l'enseignant"].filter(Boolean).join(' · ');
  if (bloc.protege) return [legende, 'protégé'].filter(Boolean).join(' · ');
  return legende;
}

const NOMS: Record<Bloc['type'], string> = {
  p: 'Paragraphe',
  choix: 'Phrase de choix',
  action: 'Action de jeu',
  note: "Note de l'enseignant",
};

export function ElementBloc(props: PlateElementProps) {
  const proto = useProto();
  const livre = useLivre(proto.serveur);
  const selectionne = useSelected();
  const bloc = props.element as unknown as Bloc;
  const ferme = estFerme(bloc, proto.env.ctx);
  const protege = estProtege(bloc, proto.env.ctx);
  const legende = repere(bloc, proto);
  const special = bloc.type !== 'p' || ferme || Boolean(bloc.protege);
  const index = props.path[0];
  return (
    <PlateElement
      {...props}
      as="div"
      className={['bloc', `bloc-${bloc.type}`, ferme ? 'ferme' : '', selectionne && ferme ? 'selectionne' : ''].join(' ')}
      attributes={{
        ...props.attributes,
        'data-bloc': bloc.type,
        'data-id': bloc.id,
        'data-ferme': ferme ? 'oui' : undefined,
        'data-protege': protege || (bloc as { protege?: boolean }).protege ? 'oui' : undefined,
        'data-repere': legende || undefined,
        ...(special
          ? {
              role: 'group',
              'aria-label': `${NOMS[bloc.type]}${protege ? ", préparé par l'enseignant, non modifiable" : ''} : ${texteBloc(bloc, livre)}`,
            }
          : {}),
      }}
    >
      {/* Bloc fermé : Slate attend son espaceur avant le contenu, sinon la copie sort vide. */}
      {ferme && props.children}
      {ferme && (
        <button
          type="button"
          contentEditable={false}
          className="ecrire-ici"
          aria-label="Écrire un paragraphe avant ce bloc"
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => proto.commandes().ecrireA(index)}
        />
      )}
      {ferme && (
        <div contentEditable={false} className="contenu">
          <Segments bloc={bloc} livre={livre} />
        </div>
      )}
      {!ferme && props.children}
    </PlateElement>
  );
}

export function ElementRenvoi(props: PlateElementProps) {
  const proto = useProto();
  const livre = useLivre(proto.serveur);
  const selectionne = useSelected();
  const r = props.element as unknown as Renvoi;
  const numero = r.cible ? livre.numeroDe(r.cible) : undefined;
  return (
    <PlateElement
      {...props}
      as="span"
      className={['renvoi', selectionne ? 'selectionne' : ''].join(' ')}
      attributes={{ ...props.attributes, 'data-renvoi': r.id, 'data-cible': r.cible ?? '' }}
    >
      <span contentEditable={false} className={numero === undefined ? 'numero vide' : 'numero'}>
        {numero ?? RENVOI_VIDE}
      </span>
      {props.children}
    </PlateElement>
  );
}
