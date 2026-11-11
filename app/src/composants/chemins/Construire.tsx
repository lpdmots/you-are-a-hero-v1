"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ordreDeLecture, type Chemins, type LienDeChemin, type NoeudDeChemin } from "@/domaine/chemins";
import { LIBELLE_MAX } from "@/domaine/copie";
import { nomScene, referenceScene } from "@/domaine/recit";
import { useConsigneIa } from "@/app/(adulte)/projet/[id]/scene/[scene]/AidesDeScene";
import { ChampQuiGrandit } from "../ChampQuiGrandit";
import { ListeAModifier } from "../verification/Liste";
import { useEnregistrement } from "../Enregistrement";
import type { Placement } from "@floating-ui/dom";
import { poser } from "../flottant";
import { Icone } from "../Icone";
import { TamponScene } from "../TamponScene";
import { useAidesIa } from "../AidesIa";
import type { ServicesDuBloc } from "./Bloc";

/**
 * Construire dans « Chemins » (F03.1, F03-AC52 à AC56) : ce que l'adulte fait du plan depuis le
 * schéma. Quatre gestes — ajouter une scène, relier deux scènes, donner un titre et une consigne,
 * supprimer —, chacun enregistré aussitôt. Le texte d'une scène ne s'écrit pas ici.
 */

type Resultat = { ok: true } | { ok: false; erreur: string };

/** Ce que la page offre au schéma : chaque geste rend ce qu'il est devenu, la page dit le reste. */
export type Construire = {
  /** Un projet de classe : la consigne a sa liste de vérification (F13.2) */
  deClasse: boolean;
  /** « + » sous une scène : une nouvelle scène et le choix qui y mène (F03-AC52) */
  ajouterScene: (de: string, libelle: string, titre: string) => Promise<Resultat>;
  /** Un lien tiré, ou « Scène existante » : un choix vers une scène du chapitre (F03-AC53) */
  relier: (de: string, vers: string, libelle: string) => Promise<Resultat>;
  /** Titre, consigne et liste de vérification, depuis le panneau (F03-AC55, F13.2) */
  reglerScene: (sceneId: string, valeurs: { titre?: string; consigne?: string; verification?: string[] }) => Promise<{ ok: boolean; erreur?: string }>;
  supprimerChoix: (lien: LienDeChemin) => Promise<Resultat>;
  /** Avec les protections de la suppression, et la corbeille (F03-AC56) */
  supprimerScene: (sceneId: string) => void;
  /** Le bloc de scènes proposé par l'IA (F13.7) */
  bloc?: ServicesDuBloc;
};

/** Ce que demande la bulle : une suite depuis une scène, ou le libellé d'un lien qu'on vient de tirer. */
export type Geste = { sorte: "ajout"; de: string } | { sorte: "lien"; de: string; vers: string };

const titreDe = (n: NoeudDeChemin | undefined): string => (n ? (n.titre ?? "sans titre") : "");
/** L'exemple de libellé de la copie (« Nouveau choix ») : les mêmes mots aux deux endroits. */
const EXEMPLE = "Traverser le pont";

/**
 * La bulle d'un geste, posée sous la carte : ce que fait le lecteur, puis où cela mène — une
 * nouvelle scène, dont on donne le titre, ou une scène du chapitre. Elle tient hors du schéma,
 * dont elle ne prend ni la taille ni le défilement.
 */
export function BulleDuGeste({
  geste, chemins, repere, cote, construire, avant, onFermer,
}: {
  geste: Geste; chemins: Chemins;
  /** Ce près de quoi la bulle se pose : la carte d'où l'on part, celle où le lien arrive, ou le bouton du panneau */
  repere: () => Element | null;
  /** À côté de la carte plutôt que dessous : ses choix déjà posés restent visibles ; à gauche du panneau */
  cote: Placement;
  construire: Construire;
  /** Juste avant d'enregistrer : le schéma retient la carte qui ne doit pas bouger */
  avant: (de: string) => void;
  onFermer: (fait: boolean) => void;
}) {
  const bulle = useRef<HTMLFormElement>(null);
  const idLibelle = useId();
  const idSuite = useId();
  const [libelle, setLibelle] = useState("");
  // Le titre proposé est celui du choix, tant qu'on ne l'a pas écrit soi-même (F05-AC12)
  const [titreEcrit, setTitreEcrit] = useState<string | null>(null);
  const titre = titreEcrit ?? libelle;
  const [existante, setExistante] = useState(false);
  const [vers, setVers] = useState("");
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const origine = chemins.noeuds.find((n) => n.id === geste.de);
  const arrivee = geste.sorte === "lien" ? chemins.noeuds.find((n) => n.id === geste.vers) : undefined;
  // Dans l'ordre où le lecteur les rencontre, comme la liste du téléphone
  const autres = ordreDeLecture(chemins.noeuds, chemins.liens).filter((n) => n.id !== geste.de);

  useLayoutEffect(() => {
    const r = repere();
    if (!r || !bulle.current) return;
    return poser(r, bulle.current, { cote, ecart: 12, fixe: true, suivre: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    bulle.current?.querySelector<HTMLElement>("input")?.focus({ preventScroll: true });
    const touche = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onFermer(false);
    };
    const dehors = (e: PointerEvent) => {
      if (!bulle.current?.contains(e.target as Node)) onFermer(false);
    };
    document.addEventListener("keydown", touche, true);
    document.addEventListener("pointerdown", dehors, true);
    return () => {
      document.removeEventListener("keydown", touche, true);
      document.removeEventListener("pointerdown", dehors, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pret = libelle.trim() !== "" && (geste.sorte === "lien" || !existante || vers !== "");
  const envoyer = async () => {
    if (!pret || attente) return;
    setAttente(true);
    setErreur(null);
    avant(geste.de);
    const fait =
      geste.sorte === "lien"
        ? await construire.relier(geste.de, geste.vers, libelle)
        : existante
          ? await construire.relier(geste.de, vers, libelle)
          : await construire.ajouterScene(geste.de, libelle, titre);
    setAttente(false);
    if (fait.ok) onFermer(true);
    else setErreur(fait.erreur);
  };

  return createPortal(
    <form
      ref={bulle}
      className="geste-chemin"
      aria-label={geste.sorte === "lien" ? `Relier « ${titreDe(origine)} » à « ${titreDe(arrivee)} »` : `Ajouter une suite à « ${titreDe(origine)} »`}
      onSubmit={(e) => {
        e.preventDefault();
        void envoyer();
      }}
    >
      {/* D'où l'on part, et où l'on arrive : la bulle peut couvrir les cartes */}
      <p className="geste-chemin__trajet">
        <span>{titreDe(origine)}</span>
        <Icone nom="fleche" />
        {geste.sorte === "lien" ? <span>{titreDe(arrivee)}</span> : null}
      </p>
      <div className="geste-chemin__champ">
        <label htmlFor={idLibelle}>Ce que fait le lecteur</label>
        <input id={idLibelle} className="pchamp" type="text" value={libelle} maxLength={LIBELLE_MAX} placeholder={`Par exemple : ${EXEMPLE}`} autoComplete="off" onChange={(e) => setLibelle(e.target.value)} />
      </div>
      {geste.sorte === "ajout" ? (
        <div className="geste-chemin__champ">
          <label htmlFor={idSuite}>{existante ? "Scène existante" : "Nouvelle scène"}</label>
          {existante ? (
            <span className="geste-chemin__liste">
              <select id={idSuite} className="pchamp" value={vers} onChange={(e) => setVers(e.target.value)}>
                <option value="">Choisir une scène du chapitre</option>
                {autres.map((n) => (
                  <option key={n.id} value={n.id}>
                    {nomScene(n)}
                  </option>
                ))}
              </select>
              <Icone nom="chevron-bas" />
            </span>
          ) : (
            <input
              id={idSuite}
              className="pchamp"
              type="text"
              value={titre}
              maxLength={120}
              placeholder="Son titre"
              autoComplete="off"
              onFocus={(e) => e.target.select()}
              onChange={(e) => setTitreEcrit(e.target.value)}
            />
          )}
          {/* Après les deux champs dans l'ordre du clavier : on écrit le choix, le titre, puis Entrée */}
          {autres.length ? (
            <button
              type="button"
              className="lien geste-chemin__autre"
              onClick={() => {
                setExistante(!existante);
                setErreur(null);
              }}
            >
              {existante ? "Créer plutôt une nouvelle scène" : "Relier plutôt à une scène existante"}
            </button>
          ) : null}
        </div>
      ) : null}
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      <div className="geste-chemin__pied">
        <button type="button" className="btn btn--petit btn--discret" onClick={() => onFermer(false)}>
          Annuler
        </button>
        <button type="submit" className="btn btn--petit btn--primaire" disabled={!pret} aria-busy={attente || undefined}>
          {geste.sorte === "lien" || existante ? "Relier" : "Ajouter"}
        </button>
      </div>
    </form>,
    document.body,
  );
}

/**
 * Le panneau de la scène cliquée, à droite du schéma : son titre, sa consigne et, en classe, sa
 * liste de vérification, qui s'enregistrent en les écrivant, avec « ✦ Formuler » comme dans la
 * page de scène (F13.2) ; ses choix, que l'on supprime ici ; « Ouvrir » mène à la scène.
 */
export function PanneauDeScene({
  scene, chemins, construire, designe, onAjouter, onFermer, boutonAjouter, onConstruireLaSuite,
}: {
  scene: NoeudDeChemin; chemins: Chemins; construire: Construire;
  /** Le choix dont on vient de cliquer le libellé sur sa flèche : sa ligne se montre un instant */
  designe?: string | null;
  /** « Ajouter » ouvre la même bulle que le « + » de la carte */
  onAjouter: () => void; onFermer: () => void;
  boutonAjouter: RefObject<HTMLButtonElement | null>;
  /** « ✦ Construire avec l'IA » : le panneau du bloc de scènes, depuis cette scène (F13.7) */
  onConstruireLaSuite?: () => void;
}) {
  const id = useId();
  const aides = useAidesIa();
  const [titre, setTitre] = useState(scene.titre ?? "");
  const [consigne, setConsigne] = useState(scene.consigne ?? "");
  const [verification, setVerification] = useState(scene.verification ?? []);
  // La liste ne relit sa valeur qu'au montage : une liste proposée par « Formuler » la remonte
  const [cleListe, setCleListe] = useState(0);
  const [enRetrait, setEnRetrait] = useState<string | null>(null);
  const e = useEnregistrement();
  const choix = chemins.liens.filter((l) => l.de === scene.id);
  const parId = new Map(chemins.noeuds.map((n) => [n.id, n]));

  const consigneIa = useConsigneIa({
    sceneId: scene.id,
    // Le serveur relit lui-même la consigne : ce qu'on vient de taper part d'abord
    avantDePartir: async () => {
      await e.partir();
      return true;
    },
    deClasse: construire.deClasse,
    actuelle: consigne,
    actuelleListe: verification,
    onUtiliser: (c, liste) => {
      setConsigne(c);
      const valeurs: { consigne: string; verification?: string[] } = { consigne: c };
      if (construire.deClasse) {
        setVerification(liste);
        setCleListe((n) => n + 1);
        valeurs.verification = liste;
      }
      e.prevoir(() => construire.reglerScene(scene.id, valeurs), 0, "consigne");
    },
    onDemande: () => {},
  });

  const retirer = async (lien: LienDeChemin) => {
    setEnRetrait(lien.id);
    await construire.supprimerChoix(lien);
    setEnRetrait(null);
  };

  return (
    <aside className="panneau-chemin" aria-labelledby={`${id}-nom`}>
      <header className="panneau-chemin__tete">
        <h2 id={`${id}-nom`} className="fiche__ref">
          <span className="vh">Scène </span>
          {referenceScene(scene.reference)}
        </h2>
        <TamponScene etat={scene.etat} vide={scene.vide} />
        <p className={`enregistre${e.enCours ? " enregistre--attente" : ""}`} role="status">
          {e.enCours ? (
            "Enregistrement…"
          ) : e.enregistre ? (
            <>
              <Icone nom="coche" />
              Enregistré
            </>
          ) : null}
        </p>
        <button type="button" className="btn btn--discret panneau-chemin__fermer" aria-label="Fermer le panneau de la scène" onClick={onFermer}>
          <Icone nom="fermer" />
        </button>
      </header>

      <div className="panneau-chemin__corps">
        <div className="panneau-chemin__champ panneau-chemin__champ--titre">
          <label htmlFor={`${id}-titre`}>Titre</label>
          <input
            id={`${id}-titre`}
            className="pchamp"
            type="text"
            value={titre}
            maxLength={120}
            autoComplete="off"
            onChange={(ev) => {
              setTitre(ev.target.value);
              e.prevoir(() => construire.reglerScene(scene.id, { titre: ev.target.value }), 700, "titre");
            }}
            onBlur={() => void e.partir()}
          />
        </div>
        {/* Les choix tout de suite sous le titre : dans « Chemins », ils sont le plan */}
        <section className="panneau-chemin__choix" aria-labelledby={`${id}-choix`}>
          <div className="panneau-chemin__rang">
            <h3 id={`${id}-choix`}>Ses choix</h3>
            <button type="button" className="btn btn--petit" ref={boutonAjouter} onClick={onAjouter}>
              <Icone nom="plus" />
              Ajouter un choix
            </button>
          </div>
          {choix.length ? (
            <ul>
              {choix.map((l) => {
                const cible = l.vers ? parId.get(l.vers) : undefined;
                return (
                  <li key={l.id} data-choix={l.id} className={designe === l.id ? "est-designe" : undefined}>
                    <span className="panneau-chemin__libelle">
                      {l.cache ? (
                        <>
                          <Icone nom="cle" />
                          Lien caché
                        </>
                      ) : (
                        l.libelle || "Choix sans libellé"
                      )}
                    </span>
                    {l.manque ? (
                      <span className="panneau-chemin__vers panneau-chemin__vers--manque">
                        <span className="point-regarder" aria-hidden="true" />
                        {l.manque === "sans" ? "Sans destination" : "Scène supprimée"}
                      </span>
                    ) : (
                      <span className="panneau-chemin__vers">
                        <Icone nom={l.ailleurs ? "sortie" : "fleche"} />
                        {l.ailleurs ? `${l.ailleurs.chapitre}${l.ailleurs.nom ? ` · ${l.ailleurs.nom}` : ""}` : cible ? nomScene(cible) : ""}
                      </span>
                    )}
                    {/* Un lien caché se règle dans la scène, où se lit son énigme (F03.1) */}
                    {l.cache ? null : (
                      <button
                        type="button"
                        className="btn btn--discret panneau-chemin__retirer"
                        aria-label={`Supprimer le choix « ${l.libelle || "sans libellé"} »`}
                        title="Supprimer ce choix"
                        disabled={enRetrait !== null}
                        aria-busy={enRetrait === l.id || undefined}
                        onClick={() => void retirer(l)}
                      >
                        <Icone nom="corbeille" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="panneau-chemin__aucun">{scene.fin ? "Fin de l’histoire : aucun choix n’en part." : "Aucun choix n’en part encore."}</p>
          )}
          {/* Plusieurs scènes d'un coup ne s'ajoutent que par l'IA (F03.1, F13.7) */}
          {onConstruireLaSuite && aides.proposer && !scene.fin ? (
            <button type="button" className="btn btn--petit btn--ia panneau-chemin__bloc" onClick={onConstruireLaSuite}>
              <Icone nom="ia" />
              Construire avec l’IA
            </button>
          ) : null}
        </section>
        <div className="panneau-chemin__champ">
          <label htmlFor={`${id}-consigne`}>
            Consigne <span className="facultatif">facultative</span>
          </label>
          <ChampQuiGrandit
            id={`${id}-consigne`}
            className="pchamp"
            rows={3}
            value={consigne}
            maxLength={4000}
            onChange={(ev) => {
              setConsigne(ev.target.value);
              e.prevoir(() => construire.reglerScene(scene.id, { consigne: ev.target.value }), 700, "consigne");
            }}
            onBlur={() => void e.partir()}
          />
          {consigneIa.bouton}
          {consigneIa.proposition}
          {construire.deClasse ? (
            <ListeAModifier
              key={cleListe}
              depart={verification}
              cochees={scene.cochees ?? []}
              onChange={(liste) => {
                setVerification(liste);
                e.prevoir(() => construire.reglerScene(scene.id, { verification: liste }), 700, "verification");
              }}
            />
          ) : null}
        </div>
        {e.erreur ? (
          <p className="erreur" role="alert">
            {e.erreur}
          </p>
        ) : null}
      </div>

      <footer className="panneau-chemin__pied">
        <button type="button" className="btn btn--discret panneau-chemin__supprimer" onClick={() => void e.partir().then(() => construire.supprimerScene(scene.id))}>
          <Icone nom="corbeille" />
          Supprimer la scène
        </button>
        <Link className="btn" href={scene.lien}>
          Ouvrir
          <Icone nom="fleche" />
        </Link>
      </footer>
    </aside>
  );
}
