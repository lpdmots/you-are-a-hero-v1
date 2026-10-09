import { useEffect, useState, useSyncExternalStore } from 'react';

import { Copie } from './editeur/Copie';
import { Lecture } from './Lecture';
import { type Doc, type Role, FORMULES } from './modele';
import { type Serveur, jeuDeDepart } from './serveur';

const ROLES: { valeur: Role; texte: string }[] = [
  { valeur: 'adulte', texte: 'Adulte (enseignante)' },
  { valeur: 'propositions', texte: 'Élève « écriture et propositions »' },
  { valeur: 'organisation', texte: 'Élève « écriture et organisation »' },
];

export function App() {
  const [serveur, setServeur] = useState<Serveur>(jeuDeDepart);
  const [generation, setGeneration] = useState(0);
  const [role, setRole] = useState<Role>('adulte');
  const [scenes, setScenes] = useState({ A: 'S015', B: 'S016' });
  const [lue, setLue] = useState('S015');
  useSyncExternalStore(serveur.abonner, serveur.instantane);

  useEffect(() => {
    window.__proto = {
      ...(window.__proto ?? {}),
      serveur,
      // Tests : repartir d'un jeu de scènes précis.
      reinitialiser: (docs: Record<string, Doc> = {}, options: { role?: Role; A?: string; B?: string } = {}) => {
        window.__proto.editeurs = {};
        const neuf = jeuDeDepart();
        for (const [id, doc] of Object.entries(docs)) neuf.scenes.get(id)!.doc = doc;
        setServeur(neuf);
        if (options.role) setRole(options.role);
        setScenes({ A: options.A ?? 'S015', B: options.B ?? 'S016' });
        setGeneration((n) => n + 1);
      },
    };
  }, [serveur]);

  return (
    <main>
      <h1>Prototype de l'éditeur — essai jetable</h1>
      <div className="reglages">
        <label>
          Rôle{' '}
          <select value={role} onChange={(ev) => setRole(ev.target.value as Role)} data-test="role">
            {ROLES.map((r) => (
              <option key={r.valeur} value={r.valeur}>
                {r.texte}
              </option>
            ))}
          </select>
        </label>
        <label>
          Formule du livre{' '}
          <select value={serveur.formule} onChange={(ev) => serveur.definirFormule(ev.target.value)} data-test="formule">
            {FORMULES.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          data-test="decaler"
          onClick={() => serveur.definirNumero('S018', serveur.numeros.get('S018') === 21 ? 24 : 21)}
        >
          Décaler S018 : n° {serveur.numeros.get('S018')} → {serveur.numeros.get('S018') === 21 ? 24 : 21}
        </button>
      </div>

      <div className="copies">
        {(['A', 'B'] as const).map((cle) => (
          <Copie
            key={`${cle}:${generation}`}
            cle={cle}
            role={role}
            serveur={serveur}
            sceneId={scenes[cle]}
            surScene={(id) => setScenes((s) => ({ ...s, [cle]: id }))}
            autres={[scenes[cle === 'A' ? 'B' : 'A']]}
          />
        ))}
      </div>

      <section className="suite">
        <div>
          <h2>Graphe déduit des renvois enregistrés</h2>
          <ul data-test="graphe">
            {serveur.liens().map((l) => (
              <li key={l.renvoiId} data-lien={`${l.de}>${l.vers ?? '?'}`}>
                {l.de} → {l.vers ?? 'à décider'} · {l.libelle}
              </li>
            ))}
            {[...serveur.scenes.values()].flatMap((s) =>
              s.liaisons.map((l) => (
                <li key={l.id} data-lien-cache={`${s.id}>${l.cible}`}>
                  {s.id} ⇢ {l.cible} · lien caché, n° {l.numeroFixe} fixé
                </li>
              ))
            )}
          </ul>
          <h2>Copies de récupération</h2>
          <ul data-test="copies">
            {serveur.copies.map((c) => (
              <li key={c.id}>
                {c.sceneId} · saisie de « {c.role} » depuis la version {c.versionConnue} · {c.doc.length} blocs
              </li>
            ))}
            {serveur.copies.length === 0 && <li>Aucune.</li>}
          </ul>
        </div>
        <div>
          <h2>
            Lecture de{' '}
            <select value={lue} onChange={(ev) => setLue(ev.target.value)} data-test="lue">
              {[...serveur.scenes.keys()].map((id) => (
                <option key={id}>{id}</option>
              ))}
            </select>
          </h2>
          <div className="lectures">
            <Lecture serveur={serveur} sceneId={lue} mode="livre" />
            <Lecture serveur={serveur} sceneId={lue} mode="lecteur" surAller={setLue} />
          </div>
        </div>
      </section>
    </main>
  );
}
