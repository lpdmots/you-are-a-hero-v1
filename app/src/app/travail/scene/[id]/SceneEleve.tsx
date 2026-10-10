"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { TexteLu } from "@/composants/copie/Blocs";
import { Copie } from "@/composants/copie/Copie";
import type { Services } from "@/composants/copie/contexte";
import type { EtatTexte } from "@/composants/copie/useEnregistrementTexte";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { TamponScene } from "@/composants/TamponScene";
import { nomPourEleves, type Eleve } from "@/domaine/eleves";
import { couleurDeChapitre, referenceScene } from "@/domaine/recit";
import { de, majuscule } from "@/domaine/texte";
import type { SceneOuverte } from "@/serveur/recit-eleve";
import { creerSceneDepuisChoix, relireNumeros, supprimerScene } from "../../actions";
import styles from "../../travail.module.css";

/**
 * La scène d'un élève (docs/design.md, « Côté élève repris après critique » et « Conflit
 * de sauvegarde »). Le pied de la copie reste à l'écran : il dit où en est
 * l'enregistrement, et quoi faire quand il ne se fait pas (F08-AC04, AC05).
 */
export function SceneEleve({ scene, prof, eleves }: { scene: SceneOuverte; prof: string; eleves: Eleve[] }) {
  const routeur = useRouter();
  const c = couleurDeChapitre(scene.chapitre.couleur);
  const ref = referenceScene(scene.reference);
  const [vide, setVide] = useState(scene.vide);
  const [revenu, setRevenu] = useState(false);
  const [etat, setEtat] = useState<EtatTexte>({ etat: "enregistre" });
  const retour = `/travail/chapitre/${scene.chapitre.id}`;
  const laProf = majuscule(prof);

  // Ce que l'enregistrement vient de rendre décide de la suite (F08.2)
  useEffect(() => {
    // L'accès s'est fermé, ou l'élève n'a plus ce chapitre : la page revient à ce qu'il peut voir (F08-AC37)
    if (etat.etat === "ferme") routeur.replace("/travail");
    else if (etat.etat === "garde" && (etat.motif === "acces" || etat.motif === "supprimee")) routeur.replace("/travail?texte=garde");
    // Plus le droit d'écrire ici, et rien de neuf à garder : la page se relit en lecture
    else if (etat.etat === "refuse") routeur.refresh();
  }, [etat, routeur]);

  const qui =
    scene.prise?.par === "moi" ? "Tu t’en occupes" : scene.prise?.par === "enseignant" ? `${laProf} s’en occupe` : scene.prise?.par === "eleve" ? `${nomPourEleves(scene.prise.eleve, eleves)} s’en occupe` : null;

  // Pourquoi la scène se lit sans s'écrire, dit à la place des trois boutons
  const lecture: string | null = scene.ecriture
    ? null
    : scene.refus === "arrete"
      ? "Tu ne peux pas écrire ici pour l’instant"
      : scene.refus === "scene"
        ? `Tu peux lire, pas écrire : ${prof} s’en occupe`
        : "Tu peux lire, pas écrire";

  const services: Services = {
    creerScene: (chapitreId, titre) => creerSceneDepuisChoix(chapitreId, titre, scene.projetId),
    supprimerScene: (id) => supprimerScene(id),
    relireNumeros: () => relireNumeros(scene.projetId),
  };

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
        services={services}
        marques={scene.marques}
        libelle={`Ton texte, scène ${ref}`}
        invite="Écris ici."
        tete={<span className="copie__titre">Ton texte</span>}
        onEtat={setEtat}
        onVide={setVide}
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
          if (e.etat === "echec") {
            return (
              <p className="pied-alerte" role="alert">
                <Icone nom="alerte" />
                Ton texte n’est pas encore enregistré. Tu peux continuer, mais ne ferme pas cette page.
              </p>
            );
          }
          if (e.etat === "enregistre" && revenu) {
            return (
              <p className="pied-alerte pied-alerte--ok" role="status">
                <Icone nom="coche" />
                Ça y est, ton texte est enregistré.
              </p>
            );
          }
          if (e.etat === "enregistre") {
            return sansTexte ? (
              <p className="sauv sauv--attente">Ton texte s’enregistre tout seul.</p>
            ) : (
              <p className="sauv" role="status">
                <Icone nom="coche" />
                Enregistré
              </p>
            );
          }
          return (
            <p className="sauv sauv--attente" role="status">
              Pas encore enregistré
            </p>
          );
        }}
      />
    );
  } else {
    copie = (
      <div className="copie copie--lecture">
        <div className="copie__barre">
          <span className="copie__titre">
            {scene.prise?.par === "eleve" ? `Le texte ${de(nomPourEleves(scene.prise.eleve, eleves))}` : "Le texte de la scène"}
          </span>
          <span className="copie__lecture">
            <Icone nom="oeil" />
            {lecture}
          </span>
        </div>
        <TexteLu texte={scene.texte} libelle={`Texte de la scène ${ref}`} livre={scene.livre} pourEleve />
        {scene.refus === "arrete" ? (
          <div className="copie__pied">
            <p className="pied-alerte pied-alerte--attend">
              <Icone nom="apart" />
              Ton texte est gardé à part. {laProf} doit le regarder avant que tu écrives ici.
            </p>
            <Link className="btn" href="/travail">
              Retour à Mon travail
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

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
        <TamponScene vide={vide} />
      </header>
      {qui ? (
        <p className={styles.sceneQui}>
          {scene.prise?.par === "eleve" ? <Gommette prenom={scene.prise.eleve.prenom} couleur={scene.prise.eleve.couleur} taille="s" /> : null}
          <b>{qui}</b>
        </p>
      ) : null}
      {scene.prise?.par === "eleve" && scene.refus !== "arrete" ? (
        <div className="note">
          <Icone nom="main" />
          <p>
            {nomPourEleves(scene.prise.eleve, eleves)} s’occupe de cette scène. Tu peux la lire. Pour écrire dedans, parle-lui d’abord, ou à {prof}.
          </p>
        </div>
      ) : null}
      {scene.prise?.par === "enseignant" ? (
        <div className="note">
          <Icone nom="main" />
          <p>{laProf} s’occupe de cette scène. Tu peux la lire.</p>
        </div>
      ) : null}

      <div className={styles.sceneColonnes}>
        <section aria-label="Texte de la scène">{copie}</section>
        {scene.consigne !== null ? (
          <section className="carnet-fiche" aria-labelledby="consigne-t">
            <header>
              <h2 id="consigne-t">La consigne</h2>
            </header>
            <div className="carnet-fiche__corps">
              {scene.consigne.trim() ? <p className={styles.consigne}>{scene.consigne}</p> : <p className="sans-consigne">Pas de consigne écrite. Suis celle que {prof} t’a donnée.</p>}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
