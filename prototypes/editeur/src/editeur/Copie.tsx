// Une copie : un éditeur Plate sur une scène, sa barre, sa saisie de choix,
// son panneau et son état de sauvegarde.

import { BoldPlugin, ItalicPlugin, UnderlinePlugin } from '@platejs/basic-nodes/react';
import { ParagraphPlugin, Plate, PlateContent, createPlatePlugin, usePlateEditor } from 'platejs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { type Bloc, type Choix, type Doc, type Role, CONSTRUCTIONS, action, estFerme, estProtege, renvoisDe } from '../modele';
import type { Serveur, Vue } from '../serveur';
import { type Commandes, type Position, creerCommandes } from './commandes';
import { ContexteProto, ElementBloc, ElementRenvoi, useLivre } from './elements';
import { type Env, blocs, creerPluginRegles, indexCourant, peutCreerChoix } from './regles';

type Message = { texte: string; annulable?: boolean; autreChoix?: Position; cle: number };
type Sauvegarde = { etat: 'enregistre' | 'conflit' | 'refuse'; detail?: string };

declare global {
  interface Window {
    // Accès réservé aux tests et à la curiosité : serveur et éditeurs.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __proto: any;
  }
}

export function Copie(props: { cle: string; role: Role; serveur: Serveur; sceneId: string; surScene: (id: string) => void; autres: string[] }) {
  const { cle, role, serveur, sceneId, surScene, autres } = props;
  useLivre(serveur);
  // Recharger depuis le serveur : nouvelle vue, nouvel éditeur.
  const [chargement, setChargement] = useState(0);
  const vue = useMemo(() => serveur.vuePour(sceneId, role), [serveur, sceneId, role, chargement]);
  return (
    <section className="copie" data-copie={cle} aria-label={`Copie ${cle}`}>
      <header>
        <label>
          Scène{' '}
          <select value={sceneId} onChange={(ev) => surScene(ev.target.value)} data-test="scene">
            {[...serveur.scenes.values()].map((s) => (
              <option key={s.id} value={s.id} disabled={autres.includes(s.id)}>
                {s.id} {s.titre} · {s.chapitre} · n° {serveur.numeros.get(s.id)}
              </option>
            ))}
          </select>
        </label>
      </header>
      <EditeurScene
        key={`${role}:${sceneId}:${chargement}`}
        cle={cle}
        role={role}
        serveur={serveur}
        vue={vue}
        recharger={() => setChargement((n) => n + 1)}
      />
    </section>
  );
}

function EditeurScene(props: { cle: string; role: Role; serveur: Serveur; vue: Vue; recharger: () => void }) {
  const { cle, role, serveur, vue, recharger } = props;
  const sceneId = vue.sceneId;
  const [message, setMessage] = useState<Message | null>(null);
  const [saisie, setSaisie] = useState<{ position: Position } | null>(null);
  const [aConfirmer, setAConfirmer] = useState<string | null>(null);
  const [sauvegarde, setSauvegarde] = useState<Sauvegarde>({ etat: 'enregistre' });
  const [, setTic] = useState(0);
  const version = useRef(vue.version);
  const suspendu = useRef(false);
  const panneau = useRef<HTMLDivElement>(null);
  const commandes = useRef<Commandes | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editeur = useRef<any>(null);

  const env = useMemo<Env>(
    () => ({
      ctx: serveur.contexte(sceneId, role),
      idExisteAilleurs: (id) =>
        [...serveur.scenes.values()].some(
          (s) => s.id !== sceneId && s.doc.some((b) => b.id === id || renvoisDe(b).some((r) => r.id === id))
        ),
      sceneExiste: serveur.sceneExiste,
      message: (texte, options) => setMessage({ texte, annulable: options?.annulable, cle: Date.now() }),
      slash: (commande) => {
        if (commande === 'choix') {
          const position = commandes.current!.positionCourante();
          // Sans cela, Slate reprend le focus en reposant sa sélection.
          editeur.current?.tf.blur();
          setSaisie({ position });
        }
        else commandes.current!.insererBloc(commandes.current!.positionCourante(), action(''));
      },
      confirmerDernierRenvoi: (id) => setAConfirmer(id),
      garde: { refus: 0 },
    }),
    [serveur, sceneId, role]
  );

  const plugins = useMemo(
    () => [
      ParagraphPlugin.withComponent(ElementBloc),
      createPlatePlugin({ key: 'choix', node: { isElement: true, component: ElementBloc } }),
      createPlatePlugin({ key: 'action', node: { isElement: true, component: ElementBloc } }),
      createPlatePlugin({ key: 'note', node: { isElement: true, component: ElementBloc } }),
      createPlatePlugin({ key: 'renvoi', node: { isElement: true, isInline: true, isVoid: true, component: ElementRenvoi } }),
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      // `?nu` : Plate sans les règles de l'essai, pour distinguer ses défauts des nôtres.
      ...(new URLSearchParams(location.search).has('nu') ? [] : [creerPluginRegles(env)]),
    ],
    [env]
  );
  // Les identités sont gérées par l'essai (déplacement ou copie), pas par Plate.
  const editor = usePlateEditor({ plugins, value: vue.doc as never, nodeId: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = editor as any;
  editeur.current = e;
  if (!commandes.current) commandes.current = creerCommandes(e, env, serveur, sceneId);
  const cmd = commandes.current;

  useEffect(() => {
    window.__proto = window.__proto ?? {};
    window.__proto.editeurs = { ...(window.__proto.editeurs ?? {}), [cle]: e };
    window.__proto.env = { ...(window.__proto.env ?? {}), [cle]: env };
  }, [cle, e, env]);

  const enregistrer = (doc: Doc) => {
    if (suspendu.current) return;
    const r = serveur.enregistrer({ sceneId, doc, versionConnue: version.current, role });
    if (r.etat === 'enregistre') {
      version.current = r.version;
      setSauvegarde({ etat: 'enregistre' });
      // Identités renouvelées par le serveur : reportées sans entrer dans l'historique.
      const remplacements = Object.entries(r.idsRemplaces);
      if (remplacements.length > 0) {
        e.tf.withoutSaving(() => {
          for (const [ancien, neuf] of remplacements) {
            blocs(e).forEach((b, i) => {
              if (b.id === ancien) e.tf.setNodes({ id: neuf }, { at: [i] });
              (b.children as { id?: string }[]).forEach((n, k) => {
                if (n.id === ancien) e.tf.setNodes({ id: neuf }, { at: [i, k], voids: true });
              });
            });
          }
        });
      }
    } else if (r.etat === 'conflit') {
      // F08.1 : la saisie n'est pas devenue le texte courant ; plus d'enregistrement automatique.
      suspendu.current = true;
      setSauvegarde({ etat: 'conflit', detail: r.copieId });
    } else {
      setSauvegarde({ etat: 'refuse', detail: r.refus.join(' ; ') });
    }
  };

  // Les liaisons vivent côté serveur : on enregistre la scène avant de la relire.
  const sauverPuisRecharger = () => {
    enregistrer(blocs(e) as Doc);
    recharger();
  };

  const courant: Bloc | undefined = blocs(e)[indexCourant(e)];
  const liste = blocs(e);
  const dernierFerme = liste.length > 0 && estFerme(liste[liste.length - 1], env.ctx);
  const adulte = role === 'adulte';
  const choixModifiable = courant?.type === 'choix' && !estProtege(courant, env.ctx) ? (courant as Choix) : null;
  const garder = (ev: React.MouseEvent) => ev.preventDefault();

  const ouvrirSaisie = () => setSaisie({ position: cmd.positionCourante() });
  const fermerSaisie = () => {
    setSaisie(null);
    e.tf.focus();
  };

  return (
    <ContexteProto.Provider value={{ env, serveur, commandes: () => cmd }}>
      <div className="barre" role="toolbar" aria-label="Outils de la copie">
        {(['bold', 'italic', 'underline'] as const).map((marque) => (
          <button key={marque} type="button" onMouseDown={garder} onClick={() => e.tf.toggleMark(marque)} data-test={marque}>
            {{ bold: 'Gras', italic: 'Italique', underline: 'Souligné' }[marque]}
          </button>
        ))}
        {peutCreerChoix(env.ctx) && (
          <>
            <button type="button" onMouseDown={garder} onClick={ouvrirSaisie} data-test="bouton-choix">
              Choix
            </button>
            <button type="button" onMouseDown={garder} onClick={() => cmd.basculerAction()} data-test="bouton-action">
              {courant?.type === 'action' ? 'Revenir au récit' : 'Action de jeu'}
            </button>
          </>
        )}
        {adulte && (courant?.type === 'p' || courant?.type === 'action') && (
          <button type="button" onMouseDown={garder} onClick={() => cmd.basculerProtection()} data-test="bouton-proteger">
            {courant.protege ? 'Retirer la protection' : 'Protéger ce paragraphe'}
          </button>
        )}
        <button type="button" onMouseDown={garder} onClick={() => e.undo()} data-test="annuler">
          Annuler
        </button>
        <button type="button" onMouseDown={garder} onClick={() => e.redo()} data-test="retablir">
          Rétablir
        </button>
      </div>

      {vue.liaisons.map((l) => (
        <p key={l.id} className="liaison" data-test="liaison">
          {adulte ? (
            <>
              Lien caché (énigme) → {l.cible} {serveur.scenes.get(l.cible!)?.titre} · numéro fixé {l.numero}{' '}
              <button
                type="button"
                onClick={() => {
                  cmd.proposerCommeChoix(l.id);
                  sauverPuisRecharger();
                }}
              >
                Proposer comme choix
              </button>
            </>
          ) : (
            <>Ton énigme doit conduire au numéro {l.numero}.</>
          )}
        </p>
      ))}

      {saisie && (
        <SaisieChoix
          serveur={serveur}
          env={env}
          surAnnuler={fermerSaisie}
          surValider={(libelle, destination, cache) => {
            let cible: string | null = null;
            if (destination === 'nouvelle') cible = serveur.creerScene(libelle, env.ctx.chapitreScene).id;
            else if (destination !== 'plus-tard') cible = destination;
            const position = saisie.position;
            setSaisie(null);
            if (cache && cible) {
              serveur.ajouterLiaison(sceneId, cible, libelle);
              recharger();
              return;
            }
            const cochees = [0];
            const id = cmd.insererChoix(position, libelle, cible, cochees[0]);
            e.tf.focus();
            setMessage({ texte: 'Choix créé.', autreChoix: { genre: 'apres', id }, cle: Date.now() });
          }}
        />
      )}

      <Plate
        editor={editor}
        onChange={() => setTic((n) => n + 1)}
        onValueChange={({ value }) => enregistrer(value as unknown as Doc)}
      >
        <PlateContent
          className="texte"
          aria-label={`Texte de la scène ${sceneId}`}
          data-test="texte"
          spellCheck={false}
          onKeyDown={(ev) => {
            // « Tout sélectionner » natif échoue quand la scène finit par un bloc
            // fermé : la sélection est posée par l'éditeur lui-même.
            if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'a') {
              ev.preventDefault();
              e.tf.select({ anchor: e.api.start([]), focus: e.api.end([]) });
              return;
            }
            // Entrée sur une phrase de choix modifiable : aller à ses réglages.
            // Annuler et rétablir : sans cela, tout dépend de l'historique propre au navigateur.
            if ((ev.metaKey || ev.ctrlKey) && (ev.key.toLowerCase() === 'z' || ev.key.toLowerCase() === 'y')) {
              ev.preventDefault();
              if (ev.shiftKey || ev.key.toLowerCase() === 'y') e.redo();
              else e.undo();
              return;
            }
            // Bloc sous le curseur au moment de la frappe, pas au dernier rendu.
            const courant: Bloc | undefined = blocs(e)[indexCourant(e)];
            const choixModifiable = courant?.type === 'choix' && !estProtege(courant, env.ctx);
            // Frappe sur un bloc fermé : rien ne s'écrit, et on le dit.
            if (courant && estFerme(courant, env.ctx) && ev.key.length === 1 && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
              ev.preventDefault();
              e.tf.insertText(ev.key);
              return;
            }
            if (ev.key === 'Enter' && courant && estFerme(courant, env.ctx)) {
              // Sur un bloc fermé, le navigateur n'émet pas de saut de ligne : on le traite ici.
              ev.preventDefault();
              if (choixModifiable) panneau.current?.querySelector<HTMLElement>('input, select, button')?.focus();
              else e.tf.insertBreak();
            }
          }}
        />
      </Plate>
      {dernierFerme && (
        <button type="button" className="ecrire-fin" onMouseDown={garder} onClick={() => cmd.ecrireA(liste.length)} data-test="ecrire-fin">
          + Écrire à la fin
        </button>
      )}

      <div className="message" role="status" aria-live="polite" data-test="message">
        {message && (
          <>
            <span>{message.texte}</span>{' '}
            {message.annulable && (
              <button
                type="button"
                data-test="message-annuler"
                onClick={() => {
                  e.undo();
                  setMessage(null);
                  e.tf.focus();
                }}
              >
                Annuler
              </button>
            )}
            {message.autreChoix && (
              <button type="button" data-test="autre-choix" onClick={() => setSaisie({ position: message.autreChoix! })}>
                Ajouter un autre choix
              </button>
            )}
          </>
        )}
      </div>

      {aConfirmer && (
        <div className="confirmation" role="alertdialog" aria-label="Retirer le dernier renvoi">
          Retirer le dernier renvoi supprime la phrase de choix entière. La scène visée est conservée.{' '}
          <button
            type="button"
            data-test="confirmer-dernier"
            onClick={() => {
              cmd.supprimerBloc(aConfirmer);
              setAConfirmer(null);
              e.tf.focus();
            }}
          >
            Supprimer la phrase
          </button>{' '}
          <button type="button" onClick={() => setAConfirmer(null)}>
            Garder
          </button>
        </div>
      )}

      {choixModifiable && (
        <PanneauChoix refPanneau={panneau} choix={choixModifiable} serveur={serveur} env={env} cmd={cmd} adulte={adulte} recharger={sauverPuisRecharger} retour={() => e.tf.focus()} />
      )}

      <footer className="etat" data-test="etat" data-etat={sauvegarde.etat}>
        {sauvegarde.etat === 'enregistre' && <>Enregistré dans la scène (version {version.current}).</>}
        {sauvegarde.etat === 'conflit' && (
          <>
            Une autre session a modifié cette scène. Ta saisie n'a pas remplacé le texte de la scène : elle est gardée à
            part comme copie de récupération, pour l'enseignant.{' '}
            <button type="button" onClick={recharger} data-test="recharger">
              Voir le texte actuel de la scène
            </button>
          </>
        )}
        {sauvegarde.etat === 'refuse' && <>Enregistrement refusé par le serveur : {sauvegarde.detail}</>}
        <button
          type="button"
          className="discret"
          data-test="autre-session"
          onClick={() =>
            serveur.autreSession(sceneId, (doc) => {
              const premier = doc.find((b) => b.type === 'p');
              if (premier) premier.children = [{ text: "Texte enregistré par l'autre session." }];
              return doc;
            })
          }
        >
          Simuler l'enregistrement d'une autre session
        </button>
      </footer>
    </ContexteProto.Provider>
  );
}

type Option = { valeur: string; texte: string };

function destinations(serveur: Serveur, env: Env, filtre: string): Option[] {
  const eleve = env.ctx.role !== 'adulte';
  const f = filtre.trim().toLowerCase();
  return [...serveur.scenes.values()]
    // Un élève ne relie qu'à l'intérieur du chapitre : les raccords sont à l'enseignant.
    .filter((s) => !eleve || s.chapitre === env.ctx.chapitreScene)
    .map((s) => ({ valeur: s.id, texte: `${s.chapitre} · ${s.id} · ${s.titre}` }))
    .filter((o) => f === '' || o.texte.toLowerCase().includes(f));
}

function SaisieChoix(props: {
  serveur: Serveur;
  env: Env;
  surAnnuler: () => void;
  surValider: (libelle: string, destination: string, cache: boolean) => void;
}) {
  const { serveur, env, surAnnuler, surValider } = props;
  const [libelle, setLibelle] = useState('');
  const [filtre, setFiltre] = useState('');
  const [actif, setActif] = useState(0);
  const [cache, setCache] = useState(false);
  const champDestination = useRef<HTMLInputElement>(null);
  const champLibelle = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => champLibelle.current?.focus(), 0);
    return () => clearTimeout(t);
  }, []);
  const fixes: Option[] = [
    { valeur: 'nouvelle', texte: `Nouvelle scène « ${libelle || '…'} »` },
    { valeur: 'plus-tard', texte: 'À décider plus tard' },
  ];
  const f = filtre.trim().toLowerCase();
  const scenes = destinations(serveur, env, filtre);
  const fixesRetenus = fixes.filter((o) => f === '' || o.texte.toLowerCase().includes(f));
  // La recherche porte aussi sur les deux issues sans scène existante.
  const options: Option[] = [...scenes, ...(scenes.length + fixesRetenus.length > 0 ? fixesRetenus : fixes)];
  const indexActif = Math.min(actif, options.length - 1);
  const valider = () => libelle.trim() !== '' && surValider(libelle.trim(), options[indexActif].valeur, cache);
  return (
    <div
      className="saisie"
      role="dialog"
      aria-label="Nouveau choix"
      data-test="saisie"
      onKeyDown={(ev) => {
        if (ev.key === 'Escape') {
          ev.preventDefault();
          surAnnuler();
        }
      }}
    >
      <label>
        Libellé{' '}
        <input
          ref={champLibelle}
          value={libelle}
          data-test="libelle"
          placeholder="Prendre la clé"
          onChange={(ev) => setLibelle(ev.target.value)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              champDestination.current?.focus();
            }
          }}
        />
      </label>
      <label>
        Destination{' '}
        <input
          ref={champDestination}
          role="combobox"
          aria-expanded="true"
          aria-controls="liste-destinations"
          aria-activedescendant={`destination-${indexActif}`}
          value={filtre}
          data-test="destination"
          placeholder="Rechercher une scène…"
          onChange={(ev) => {
            setFiltre(ev.target.value);
            setActif(0);
          }}
          onKeyDown={(ev) => {
            if (ev.key === 'ArrowDown') {
              ev.preventDefault();
              setActif(Math.min(indexActif + 1, options.length - 1));
            } else if (ev.key === 'ArrowUp') {
              ev.preventDefault();
              setActif(Math.max(indexActif - 1, 0));
            } else if (ev.key === 'Enter') {
              ev.preventDefault();
              valider();
            }
          }}
        />
      </label>
      <ul role="listbox" id="liste-destinations" aria-label="Destinations">
        {options.map((o, i) => (
          <li
            key={o.valeur}
            id={`destination-${i}`}
            role="option"
            aria-selected={i === indexActif}
            className={i === indexActif ? 'actif' : ''}
            data-valeur={o.valeur}
            onClick={() => setActif(i)}
          >
            {o.texte}
          </li>
        ))}
      </ul>
      {env.ctx.role === 'adulte' && (
        <label>
          <input type="checkbox" checked={cache} onChange={(ev) => setCache(ev.target.checked)} data-test="lien-cache" /> Lien
          caché (énigme) : aucune phrase dans le texte
        </label>
      )}
      <button type="button" onClick={valider} data-test="valider">
        Valider
      </button>{' '}
      <button type="button" onClick={surAnnuler}>
        Annuler (Échap)
      </button>
    </div>
  );
}

function PanneauChoix(props: {
  refPanneau: React.RefObject<HTMLDivElement | null>;
  choix: Choix;
  serveur: Serveur;
  env: Env;
  cmd: Commandes;
  adulte: boolean;
  recharger: () => void;
  retour: () => void;
}) {
  const { refPanneau, choix, serveur, env, cmd, adulte } = props;
  const renvois = renvoisDe(choix);
  const [libelle, setLibelle] = useState(choix.libelle);
  const [avertir, setAvertir] = useState(false);
  useEffect(() => setLibelle(choix.libelle), [choix.id, choix.libelle]);
  const toutes = destinations(serveur, env, '');
  return (
    <div
      className="panneau"
      ref={refPanneau}
      role="group"
      aria-label="Réglages du choix (Échap pour revenir au texte)"
      data-test="panneau"
      onKeyDown={(ev) => {
        // Échap rend le focus au texte, phrase toujours sélectionnée.
        if (ev.key === 'Escape') props.retour();
      }}
    >
      <strong>Choix</strong> · phrase {choix.mode === 'auto' ? 'automatique' : 'personnalisée'}
      <label>
        Libellé{' '}
        <input
          value={libelle}
          data-test="panneau-libelle"
          onChange={(ev) => setLibelle(ev.target.value)}
          onBlur={() => libelle !== choix.libelle && cmd.modifierLibelle(choix.id, libelle)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') cmd.modifierLibelle(choix.id, libelle);
          }}
        />
      </label>
      {renvois.map((r, n) => (
        <label key={r.id}>
          Destination{renvois.length > 1 ? ` ${n + 1}` : ''}{' '}
          <select
            value={r.cible ?? 'plus-tard'}
            data-test={`panneau-destination-${n}`}
            onChange={(ev) => {
              const v = ev.target.value;
              const cible = v === 'plus-tard' ? null : v === 'nouvelle' ? serveur.creerScene(choix.libelle, env.ctx.chapitreScene).id : v;
              cmd.modifierCible(choix.id, r.id, cible);
            }}
          >
            {toutes.map((o) => (
              <option key={o.valeur} value={o.valeur}>
                {o.texte}
              </option>
            ))}
            <option value="nouvelle">Nouvelle scène « {choix.libelle} »</option>
            <option value="plus-tard">À décider plus tard</option>
          </select>{' '}
          <button type="button" onClick={() => cmd.retirerRenvoi(choix.id, r.id)} data-test={`retirer-renvoi-${n}`}>
            Retirer ce renvoi
          </button>
        </label>
      ))}
      <div className="actions">
        {choix.mode === 'auto' ? (
          <>
            <button type="button" onClick={() => cmd.personnaliser(choix.id)} data-test="personnaliser">
              Personnaliser
            </button>
            <button type="button" onClick={() => cmd.regenerer(choix.id, CONSTRUCTIONS.map((_, i) => i))} data-test="regenerer">
              Régénérer
            </button>
          </>
        ) : (
          <>
            <button type="button" onMouseDown={(ev) => ev.preventDefault()} onClick={() => cmd.insererRenvoi(null)} data-test="inserer-renvoi">
              Insérer un renvoi
            </button>
            {renvois.length === 1 &&
              (avertir ? (
                <span role="alert">
                  Le texte écrit à la main sera remplacé.{' '}
                  <button
                    type="button"
                    data-test="confirmer-auto"
                    onClick={() => {
                      cmd.revenirAuto(choix.id);
                      setAvertir(false);
                    }}
                  >
                    Confirmer
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setAvertir(true)} data-test="revenir-auto">
                  Revenir à la phrase automatique
                </button>
              ))}
          </>
        )}
        <button type="button" onClick={() => cmd.deplacer(choix.id, -1)} data-test="monter">
          Monter
        </button>
        <button type="button" onClick={() => cmd.deplacer(choix.id, 1)} data-test="descendre">
          Descendre
        </button>
        <button type="button" onClick={() => cmd.supprimerBloc(choix.id)} data-test="supprimer-choix">
          Supprimer
        </button>
        {adulte && renvois.length === 1 && renvois[0].cible && (
          <button
            type="button"
            data-test="cacher-choix"
            onClick={() => {
              cmd.cacherChoix(choix.id);
              props.recharger();
            }}
          >
            Cacher ce choix (énigme)
          </button>
        )}
      </div>
    </div>
  );
}
