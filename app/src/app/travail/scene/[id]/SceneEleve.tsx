"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { TexteLu } from "@/composants/copie/Blocs";
import { Copie } from "@/composants/copie/Copie";
import type { Services } from "@/composants/copie/contexte";
import { avantDePartir } from "@/composants/copie/sortie";
import type { EtatTexte } from "@/composants/copie/useEnregistrementTexte";
import { TamponEncouragement } from "@/composants/Encouragements";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { TamponScene } from "@/composants/TamponScene";
import { nomPourEleves, type Eleve } from "@/domaine/eleves";
import { NOM_CATEGORIE, type Categorie } from "@/domaine/encouragements";
import { sEcrit } from "@/domaine/etats";
import { couleurDeChapitre, referenceScene } from "@/domaine/recit";
import { de, majuscule } from "@/domaine/texte";
import type { SceneOuverte } from "@/serveur/recit-eleve";
import {
  annulerGeste, creerSceneDepuisChoix, prendreScenes, reglerVoisines, relireNumeros, remarqueLue, remettreScene, rendreScene, retirerRemise, supprimerScene,
} from "../../actions";
import styles from "../../travail.module.css";
import { FicheRemarque, RemarqueEnGrand } from "./Remarque";

/** Ce que l'élève vient de faire de « qui s'en occupe », dit sur place avec « Annuler » (F06-AC66). */
type Geste = { sorte: "pris"; avant: Eleve | null } | { sorte: "rendu" };

/**
 * La scène d'un élève (docs/design.md, « Côté élève repris après critique » et « Conflit
 * de sauvegarde »). Le pied de la copie reste à l'écran : il dit où en est
 * l'enregistrement, porte « Remettre », et dit quoi faire quand rien ne s'enregistre
 * (F07.1, F08-AC04, AC05). Selon l'état, la scène s'écrit ou se lit, et l'écran dit pourquoi.
 */
export function SceneEleve({
  scene, prof, eleves, encouragements = [],
}: {
  scene: SceneOuverte; prof: string; eleves: Eleve[];
  /** Les tampons que cet élève a reçus sur cette scène ; ceux d'un camarade n'arrivent jamais ici (F07-AC80, AC82) */
  encouragements?: Categorie[];
}) {
  const routeur = useRouter();
  const dire = useMessage();
  const c = couleurDeChapitre(scene.chapitre.couleur);
  const ref = referenceScene(scene.reference);
  const [vide, setVide] = useState(scene.vide);
  const [revenu, setRevenu] = useState(false);
  const [etat, setEtat] = useState<EtatTexte>({ etat: "enregistre" });
  // Où en est la remise demandée : en attente de l'enregistrement, en échec, ou faite (F07-AC28, AC29)
  const [envoi, setEnvoi] = useState<"" | "attente" | "echec" | "fait">("");
  const [geste, setGeste] = useState<Geste | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [lue, setLue] = useState(false);
  // Le panneau de droite : les réglages de la copie s'y ouvrent, à la place de la consigne
  const [panneau, setPanneau] = useState<HTMLElement | null>(null);
  const [reglages, setReglages] = useState(false);
  // La version du texte que la page vient d'enregistrer : c'est elle que la remise présente
  const versionLue = useRef(scene.version);
  const retour = `/travail/chapitre/${scene.chapitre.id}`;
  const laProf = majuscule(prof);
  const duChapitre = scene.profil !== null;
  const mien = scene.prise?.par === "moi";
  const camarade = scene.prise?.par === "eleve" ? scene.prise.eleve : null;
  const sEcritEncore = sEcrit(scene.etat);

  // Ce que l'enregistrement vient de rendre décide de la suite (F08.2)
  useEffect(() => {
    // L'accès s'est fermé, ou l'élève n'a plus ce chapitre : la page revient à ce qu'il peut voir (F08-AC37)
    if (etat.etat === "ferme") routeur.replace("/travail");
    else if (etat.etat === "garde" && (etat.motif === "acces" || etat.motif === "supprimee")) routeur.replace("/travail?texte=garde");
    // Plus le droit d'écrire ici, et rien de neuf à garder : la page se relit en lecture
    else if (etat.etat === "refuse") routeur.refresh();
  }, [etat, routeur]);

  // « J'ai lu, j'écris » : le curseur va dans le texte (F07.3)
  useEffect(() => {
    if (lue) document.querySelector<HTMLElement>('.copie__texte[contenteditable="true"]')?.focus();
  }, [lue]);

  /** « Remettre à Mme Laurent » : la dernière saisie s'enregistre d'abord, puis la base conserve ce texte (F07-AC28). */
  const remettre = async () => {
    setEnvoi("attente");
    if (!(await avantDePartir())) return setEnvoi("echec");
    const fait = await remettreScene(scene.id, versionLue.current);
    if (!fait.ok) {
      // Rien n'est remis : un conflit se lit dans le pied, une scène qui ne s'écrit plus se relit (F07-AC29)
      setEnvoi("");
      if (fait.motif !== "conflit" && fait.motif !== "arrete") routeur.refresh();
      return;
    }
    setEnvoi("fait");
    setGeste(null);
    const avant = eleves.find((e) => e.id === fait.avant);
    if (avant) dire({ texte: `Tu t’occupes maintenant de cette scène, à la place ${de(nomPourEleves(avant, eleves))}.` });
    routeur.refresh();
    window.scrollTo(0, 0);
  };

  /** « Modifier encore mon texte » : la remise est retirée, la scène s'écrit de nouveau (F07-AC09). */
  const modifierEncore = async () => {
    setOccupe(true);
    const fait = await retirerRemise(scene.id);
    setOccupe(false);
    if (!fait.ok) dire({ texte: fait.erreur });
    else {
      setEnvoi("");
      dire({ texte: mien || !scene.prise ? "Tu peux de nouveau écrire." : "Ce texte peut de nouveau être modifié." });
    }
    routeur.refresh();
  };

  /** « M'occuper de cette scène » : l'élève la reprend à son camarade, après l'avoir lu (F06-AC42). */
  const prendre = async () => {
    setOccupe(true);
    const fait = await prendreScenes([{ scene: scene.id, vu: camarade?.id ?? null }]);
    setOccupe(false);
    if (!fait.ok) dire({ texte: fait.erreur });
    else if (fait.prises.length) setGeste({ sorte: "pris", avant: camarade });
    else dire({ texte: "Cette scène vient de changer : regarde qui s’en occupe maintenant." });
    routeur.refresh();
  };
  /** « Je ne m'en occupe plus » : le texte reste dans la scène (F06-AC64). */
  const rendre = async () => {
    setOccupe(true);
    // Ce qu'il vient d'écrire s'enregistre d'abord : son texte reste dans la scène
    if (!(await avantDePartir())) {
      setOccupe(false);
      return dire({ texte: "Ton texte n’est pas encore enregistré : réessaie dans un instant." });
    }
    const fait = await rendreScene(scene.id);
    setOccupe(false);
    if (!fait.ok) dire({ texte: fait.erreur });
    else setGeste({ sorte: "rendu" });
    routeur.refresh();
  };
  const annuler = async () => {
    setOccupe(true);
    const fait = await annulerGeste(scene.id);
    setOccupe(false);
    setGeste(null);
    if (!fait.ok) dire({ texte: fait.erreur });
    routeur.refresh();
  };

  const services: Services = {
    creerScene: (chapitreId, titre) => creerSceneDepuisChoix(chapitreId, titre, scene.projetId),
    supprimerScene: (id) => supprimerScene(id),
    relireNumeros: () => relireNumeros(scene.projetId),
    reglerVoisines: (affiche) => reglerVoisines(affiche),
  };

  // Pourquoi la scène se lit sans s'écrire, dit à la place des trois boutons
  const lecture: string | null = scene.ecriture
    ? null
    : scene.arrete
      ? "Tu ne peux pas écrire ici pour l’instant"
      : scene.prise?.par === "enseignant"
        ? `Tu peux lire, pas écrire : ${prof} s’en occupe`
        : scene.etat === "valider"
          ? `Tu ne peux plus écrire : ${prof} relit`
          : scene.etat === "valide" || scene.etat === "prete"
            ? "Tu ne peux plus écrire : c’est validé"
            : "Tu peux lire, pas écrire";

  // La remarque montrée seule, à la première ouverture d'une scène à reprendre, pour l'élève qui s'en occupe
  const remarqueSeule = scene.etat === "reprendre" && mien && !!scene.ecriture && scene.remarque && !scene.remarque.lue && !lue;

  let copie: ReactNode;
  if (scene.ecriture) {
    copie = (
      <Copie
        texte={scene.texte}
        version={scene.version}
        cible={{ ecriture: scene.ecriture }}
        livre={scene.livre}
        droits={scene.droits}
        lieu={{ projetId: scene.projetId, sceneId: scene.id, chapitreId: scene.chapitre.id }}
        pourEleve
        enseignant={prof}
        jeu={scene.jeu}
        voisines={scene.voisines}
        voisinesAffichees={scene.voisinesAffichees}
        lienDeScene={(id) => `/travail/scene/${id}`}
        panneau={panneau}
        onPanneau={setReglages}
        services={services}
        marques={scene.marques}
        libelle={`Ton texte, scène ${ref}`}
        invite="Écris ici."
        tete={<span className="copie__titre">{mien && scene.etat === "reprendre" ? `Ton texte, avec les corrections de ${prof}` : "Ton texte"}</span>}
        onEtat={setEtat}
        onVide={setVide}
        onVersion={(v) => {
          versionLue.current = v;
        }}
        apresRetour={() => setRevenu(true)}
        pied={({ etat: e, vide: sansTexte }) => {
          if (e.etat === "garde") {
            return (
              <p className="pied-alerte pied-alerte--attend" role="alert">
                <Icone nom="apart" />
                {e.motif === "scene"
                  ? `Cette scène a changé pendant que tu écrivais : tu ne peux plus y écrire. Ce que tu venais d’écrire est gardé. Appelle ${prof}.`
                  : e.motif === "arrete"
                    ? `Ton texte est gardé à part. ${laProf} doit le regarder avant que tu écrives ici.`
                    : `Quelqu’un d’autre a écrit dans cette scène en même temps que toi. Ton texte est gardé. Arrête d’écrire et appelle ${prof}.`}
              </p>
            );
          }
          // Une seule indication à la fois, à gauche ; « Remettre » à droite, où il ne bouge pas
          let dit: ReactNode;
          if (e.etat === "echec") {
            dit = (
              <p className="pied-alerte" role="alert">
                <Icone nom="alerte" />
                {envoi === "echec"
                  ? `Ton texte n’est pas remis : il n’est pas encore enregistré. Ne ferme pas cette page et appelle ${prof}.`
                  : "Ton texte n’est pas encore enregistré. Tu peux continuer, mais ne ferme pas cette page."}
              </p>
            );
          } else if (envoi === "attente") {
            dit = (
              <p className="sauv sauv--attente" role="status">
                <Icone nom="horloge" />
                Enregistrement de ta dernière phrase…
              </p>
            );
          } else if (sansTexte) {
            // Un texte vide ne se remet pas : le bouton attend la première phrase (F07-AC67)
            dit = (
              <p className="sauv sauv--attente" role="status">
                <Icone nom="crayon" />
                Écris d’abord ton texte.
              </p>
            );
          } else if (e.etat === "enregistre" && revenu) {
            dit = (
              <p className="pied-alerte pied-alerte--ok" role="status">
                <Icone nom="coche" />
                Ça y est, ton texte est enregistré.
              </p>
            );
          } else if (e.etat === "enregistre") {
            dit = (
              <p className="sauv" role="status">
                <Icone nom="coche" />
                Enregistré
              </p>
            );
          } else {
            dit = (
              <p className="sauv sauv--attente" role="status">
                Pas encore enregistré
              </p>
            );
          }
          return (
            <>
              {dit}
              <button type="button" className="btn btn--primaire btn--grand" disabled={sansTexte || envoi === "attente" || occupe} onClick={() => void remettre()}>
                Remettre à {prof}
                <Icone nom="fleche" />
              </button>
            </>
          );
        }}
      />
    );
  } else {
    const remisPar = scene.remise && !scene.remise.deMoi && scene.remise.par ? nomPourEleves(scene.remise.par, eleves) : null;
    copie = (
      <div className="copie copie--lecture">
        <div className="copie__barre">
          <span className="copie__titre">
            {camarade ? `Le texte ${de(nomPourEleves(camarade, eleves))}` : mien ? "Ton texte" : "Le texte de la scène"}
          </span>
          <span className="copie__lecture">
            <Icone nom="oeil" />
            {lecture}
          </span>
        </div>
        <TexteLu texte={scene.texte} libelle={`Texte de la scène ${ref}`} livre={scene.livre} pourEleve />
        {scene.arrete ? (
          <div className="copie__pied">
            <p className="pied-alerte pied-alerte--attend">
              <Icone nom="apart" />
              Ton texte est gardé à part. {laProf} doit le regarder avant que tu écrives ici.
            </p>
            <Link className="btn" href="/travail">
              Retour à Mon travail
            </Link>
          </div>
        ) : scene.prise?.par === "enseignant" || !duChapitre ? null : scene.etat === "valider" ? (
          <div className="copie__pied">
            <p className="copie__etat">
              <Icone nom="sablier" />
              {laProf} relit ce texte.{remisPar ? ` C’est ${remisPar} qui l’a remis.` : ""}
            </p>
            <button type="button" className="btn" disabled={occupe} onClick={() => void modifierEncore()}>
              <Icone nom="crayon" />
              Modifier encore {mien ? "mon" : "ce"} texte
            </button>
          </div>
        ) : scene.etat === "valide" || scene.etat === "prete" ? (
          <div className="copie__pied">
            <p className="copie__etat copie__etat--valide">
              <Icone nom="coche" />
              Validé par {prof}
              {scene.etat === "prete" ? ", prêt pour le livre" : ""}
            </p>
            {/* Toute demande se fait à l'oral en première livraison (F07-AC66) */}
            <p className="copie__apres">Pour changer quelque chose, demande à {prof}.</p>
          </div>
        ) : null}
      </div>
    );
  }

  // Qui s'en occupe : « Tu t'en occupes » ouvre « Je ne m'en occupe plus » tant que la scène s'écrit (F06-AC64, AC65)
  const qui =
    mien ? "Tu t’en occupes" : scene.prise?.par === "enseignant" ? `${laProf} s’en occupe` : camarade ? `${nomPourEleves(camarade, eleves)} s’en occupe` : null;
  const peutRendre = mien && duChapitre && sEcritEncore && !scene.arrete;

  return (
    <div className="sur-chapitre" style={{ "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties}>
      <nav className="fil" aria-label="Fil d’Ariane">
        <Link href={retour}>
          <Icone nom="fleche-g" />
          Retour à {scene.chapitre.titre}
        </Link>
      </nav>
      <header className={styles.sceneTete}>
        <span className="fiche__ref">{ref}</span>
        <h1>{scene.titre ?? "Scène sans titre"}</h1>
        <TamponScene etat={scene.etat} vide={vide} />
      </header>
      {qui ? (
        peutRendre ? (
          <div className={styles.sceneQui}>
            <Menu agauche libelle="Tu t’en occupes. Changer" bouton={<><b>{qui}</b><Icone nom="chevron-bas" /></>}>
              {(fermer) => (
                <>
                  <button type="button" disabled={occupe} onClick={() => { fermer(); void rendre(); }}>
                    Je ne m’en occupe plus
                  </button>
                  <p className="menu__note">Ton texte reste dans la scène.</p>
                </>
              )}
            </Menu>
          </div>
        ) : (
          <p className={styles.sceneQui}>
            {camarade ? <Gommette prenom={camarade.prenom} couleur={camarade.couleur} taille="s" /> : null}
            <b>{qui}</b>
          </p>
        )
      ) : null}

      {envoi === "fait" && scene.etat === "valider" ? (
        <div className="note note--ok" role="status">
          <Icone nom="coche" />
          <p>
            <b>C’est remis !</b> {laProf} va relire ton texte. En attendant, tu ne peux plus écrire dedans.
          </p>
        </div>
      ) : null}
      {geste?.sorte === "pris" && mien ? (
        <div className="note note--pec" role="status">
          <Icone nom="main" />
          <p>
            <b>Tu t’occupes maintenant de cette scène</b>
            {geste.avant ? `, à la place ${de(nomPourEleves(geste.avant, eleves))}` : ""}.
          </p>
          <span className="note__cmd">
            <button type="button" className="btn btn--petit" disabled={occupe} onClick={() => void annuler()}>
              Annuler
            </button>
          </span>
        </div>
      ) : geste?.sorte === "rendu" && !scene.prise ? (
        <div className="note note--pec" role="status">
          <Icone nom="main" />
          <p>
            <b>Tu ne t’occupes plus de cette scène.</b> Ton texte reste dedans.
          </p>
          <span className="note__cmd">
            <button type="button" className="btn btn--petit" disabled={occupe} onClick={() => void annuler()}>
              Annuler
            </button>
          </span>
        </div>
      ) : camarade ? (
        <div className="note note--pec">
          <Icone nom="main" />
          {/* Pendant l'arrêt, rien ne propose de prendre la scène : le bouton promettrait l'écriture (F08-AC31) */}
          {duChapitre && sEcritEncore && !scene.arrete ? (
            <>
              <p>
                {nomPourEleves(camarade, eleves)} s’occupe de cette scène. Tu peux la lire. Pour écrire dedans, parle-lui d’abord, ou à {prof}.
              </p>
              <span className="note__cmd">
                <button type="button" className="btn btn--petit" disabled={occupe} onClick={() => void prendre()}>
                  <Icone nom="main" />
                  M’occuper de cette scène
                </button>
              </span>
            </>
          ) : (
            <p>{nomPourEleves(camarade, eleves)} s’occupe de cette scène. Tu peux la lire.</p>
          )}
        </div>
      ) : scene.prise?.par === "enseignant" ? (
        <div className="note note--pec">
          <Icone nom="main" />
          <p>{laProf} s’occupe de cette scène. Tu peux la lire.</p>
        </div>
      ) : null}

      {remarqueSeule && scene.remarque ? (
        <RemarqueEnGrand
          prof={prof}
          remarque={scene.remarque}
          occupe={occupe}
          onLu={() => {
            setLue(true);
            void remarqueLue(scene.id);
          }}
        />
      ) : null}

      {/* La copie reste montée sous la remarque montrée seule : rien ne s'ouvre deux fois pour écrire */}
      <div className={styles.sceneColonnes} hidden={!!remarqueSeule}>
        <section aria-label="Texte de la scène">{copie}</section>
        {scene.consigne !== null || scene.ecriture || encouragements.length ? (
          <aside className="cote-copie">
            <div className="cote-copie__colle">
              <div ref={setPanneau} />
              <div className="cote-copie__fiches" hidden={reglages}>
                {scene.etat === "reprendre" && scene.remarque ? (
                  <FicheRemarque
                    prof={prof}
                    remarque={scene.remarque}
                    pour={mien ? { moi: true } : camarade ? { moi: false, prenom: nomPourEleves(camarade, eleves) } : null}
                    remis={scene.remise ? { par: scene.remise.deMoi || !scene.remise.par ? null : nomPourEleves(scene.remise.par, eleves), le: scene.remise.le, texte: scene.remise.texte } : null}
                    livre={scene.livre}
                  />
                ) : null}
                {scene.consigne !== null ? (
                  scene.etat === "reprendre" && scene.remarque ? (
                    // Pendant une reprise, la remarque passe devant : la consigne se replie
                    <details className="carnet-fiche carnet-fiche--pli">
                      <summary>
                        <header>
                          <h2>La consigne</h2>
                        </header>
                      </summary>
                      <div className="carnet-fiche__corps">{consigne(scene.consigne, prof)}</div>
                    </details>
                  ) : (
                    <section className="carnet-fiche" aria-labelledby="consigne-t">
                      <header>
                        <h2 id="consigne-t">La consigne</h2>
                      </header>
                      <div className="carnet-fiche__corps">{consigne(scene.consigne, prof)}</div>
                    </section>
                  )
                ) : null}
                {/* Le tampon reçu, et rien quand il n'y en a pas : ni emplacement vide, ni les trois catégories en attente */}
                {encouragements.length ? (
                  <section className="carnet-fiche carnet-fiche--encre" aria-labelledby="encouragements-t">
                    <header>
                      <h2 id="encouragements-t">
                        {majuscule(prof)} t’encourage
                      </h2>
                    </header>
                    <ul className="carnet-fiche__corps encres-recues">
                      {encouragements.map((c) => (
                        <li key={c}>
                          <TamponEncouragement categorie={c} taille="g" />
                          {NOM_CATEGORIE[c]}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {/* Après une nouvelle remise, la dernière remarque reste lisible, repliée (F07.3) */}
                {scene.etat === "valider" && scene.remarque ? (
                  <FicheRemarque prof={prof} remarque={scene.remarque} pour={null} remis={null} replie livre={scene.livre} />
                ) : null}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}

const consigne = (texte: string, prof: string): ReactNode =>
  texte.trim() ? <p className={styles.consigne}>{texte}</p> : <p className="sans-consigne">Pas de consigne écrite. Suis celle que {prof} t’a donnée.</p>;
