"use client";

import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Dialogue } from "@/composants/Dialogue";
import { Gommette } from "@/composants/Gommette";
import { Icone } from "@/composants/Icone";
import { ImageRepere } from "@/composants/ImageRepere";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { annonces, CONSIGNES_CLAVIER, Prise, useCapteurs } from "@/composants/Tirer";
import { nomPourEleves, type Eleve } from "@/domaine/eleves";
import { compteScenes, couleurDeChapitre, referenceScene } from "@/domaine/recit";
import { majuscule } from "@/domaine/texte";
import type { ChapitreEleve as Chapitre, SceneEleve } from "@/serveur/recit-eleve";
import { ajouterScene, placerScene, supprimerScene, titrerScene } from "../../actions";
import styles from "../../travail.module.css";

export function ChapitreEleve({ chapitre, prof, moi, eleves }: { chapitre: Chapitre; prof: string; moi: string; eleves: Eleve[] }) {
  const dire = useMessage();
  const capteurs = useCapteurs();
  const organise = chapitre.profil === "organisation";
  const [local, setLocal] = useState<{ base: Chapitre; scenes: SceneEleve[] } | null>(null);
  const [attente, setAttente] = useState(false);
  const [renomme, setRenomme] = useState<{ id: string; titre: string } | null>(null);
  const [aSupprimer, setASupprimer] = useState<SceneEleve | null>(null);
  const scenes = local?.base === chapitre ? local.scenes : chapitre.scenes;
  const c = couleurDeChapitre(chapitre.couleur);

  const ajouter = async () => {
    setAttente(true);
    const fait = await ajouterScene(chapitre.id);
    setAttente(false);
    dire({ texte: fait.ok ? `${referenceScene(fait.reference)} est ajoutée à la fin du chapitre.` : fait.erreur });
  };
  const renommer = async () => {
    if (!renomme) return;
    const fait = await titrerScene(renomme.id, renomme.titre);
    if (!fait.ok) return dire({ texte: fait.erreur });
    setRenomme(null);
  };
  const supprimer = async (scene: SceneEleve) => {
    setAttente(true);
    const fait = await supprimerScene(scene.id);
    setAttente(false);
    setASupprimer(null);
    dire({ texte: fait.ok ? `${referenceScene(scene.reference)} est supprimée.` : fait.erreur });
  };
  const finDeplacement = ({ active, over }: DragEndEvent) => {
    const de = chapitre.scenes.findIndex((s) => s.id === active.id);
    const vers = over ? chapitre.scenes.findIndex((s) => s.id === over.id) : -1;
    if (de < 0 || vers < 0 || de === vers) return;
    const suite = arrayMove(chapitre.scenes, de, vers);
    setLocal({ base: chapitre, scenes: suite });
    const scene = chapitre.scenes[de];
    void placerScene(scene.id, vers).then((fait) => {
      if (!fait.ok) {
        setLocal(null);
        return dire({ texte: fait.erreur });
      }
      const apres = suite[vers + 1];
      dire({
        texte: apres ? `${referenceScene(scene.reference)} est placée avant ${referenceScene(apres.reference)}.` : `${referenceScene(scene.reference)} est placée à la fin du chapitre.`,
        annuler: () => void placerScene(scene.id, de),
      });
    });
  };

  const fiche = (s: SceneEleve, prise: ReactNode) => (
    <article className={`fiche${prise ? " se-tire" : ""}`}>
      <div className="fiche__tete">
        {prise}
        <span className="fiche__ref">{referenceScene(s.reference)}</span>
        <span className="tampon" data-e="vide">
          <Icone nom="vide" />
          Texte vide
        </span>
        {organise ? (
          <Menu libelle={`Autres commandes de la scène ${referenceScene(s.reference)}`} discret>
            {(fermer) => (
              <>
                <button type="button" onClick={() => { fermer(); setRenomme({ id: s.id, titre: s.titre ?? "" }); }}>
                  {s.titre ? "Changer le titre" : "Donner un titre"}
                </button>
                {/* Un élève supprime la scène qu'il a créée lui-même, pas celle de l'enseignant (F06-AC87) */}
                {s.creeParMoi ? (
                  <button type="button" onClick={() => { fermer(); setASupprimer(s); }}>
                    Supprimer
                  </button>
                ) : null}
              </>
            )}
          </Menu>
        ) : null}
      </div>
      {renomme?.id === s.id ? (
        <form
          className={styles.renommer}
          onSubmit={(e) => {
            e.preventDefault();
            void renommer();
          }}
        >
          <label className="vh" htmlFor={`titre-${s.id}`}>
            Titre de la scène
          </label>
          <input id={`titre-${s.id}`} className="pchamp" type="text" maxLength={120} autoFocus value={renomme.titre} onChange={(e) => setRenomme({ id: s.id, titre: e.target.value })} />
          <button type="submit" className="btn btn--petit btn--primaire">
            Enregistrer
          </button>
          <button type="button" className="btn btn--petit" onClick={() => setRenomme(null)}>
            Annuler
          </button>
        </form>
      ) : (
        <p className={`fiche__titre${s.titre ? "" : " fiche__titre--vide"}`}>{s.titre ?? "sans titre"}</p>
      )}
      {s.consigne ? <p className="fiche__consigne">{s.consigne}</p> : null}
    </article>
  );

  return (
    <div className="sur-chapitre" style={{ "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties}>
      <nav className="fil" aria-label="Fil d’Ariane">
        <Link href="/travail">
          <Icone nom="fleche-g" />
          Retour à Mon travail
        </Link>
      </nav>
      <header className="chap-bandeau">
        <div className="chap-bandeau__image">
          <ImageRepere repere={chapitre} graine={chapitre.id} prioritaire />
        </div>
        <div>
          <h1>{chapitre.titre}</h1>
          <p className="chap-meta">
            {chapitre.partie} · {compteScenes(chapitre.scenes.length).toLocaleLowerCase("fr")}
          </p>
          {chapitre.camarades.length ? (
            <ul className="chap-eleves" aria-label="Élèves du chapitre">
              {chapitre.camarades.map((e) => (
                <li key={e.id}>
                  <Gommette prenom={e.prenom} couleur={e.couleur} taille="s" />
                  {e.id === moi ? "Toi" : nomPourEleves(e, eleves)}
                </li>
              ))}
            </ul>
          ) : null}
          {chapitre.resume ? (
            <details className="chap-resume">
              <summary>Ce qui se passe dans ce chapitre</summary>
              <p>{chapitre.resume}</p>
            </details>
          ) : null}
        </div>
        {organise ? (
          <div className="chap-actions">
            <button type="button" className="btn btn--primaire" disabled={attente} aria-busy={attente || undefined} onClick={() => void ajouter()}>
              <Icone nom="plus" />
              Ajouter une scène
            </button>
          </div>
        ) : null}
      </header>

      {!chapitre.profil ? (
        <div className={styles.outils}>
          <p>Ce chapitre n’est pas le tien : tu peux le lire, pas l’écrire.</p>
        </div>
      ) : null}

      {scenes.length === 0 ? (
        <div className="vide-chap">
          <p>{organise ? "Ce chapitre n’a pas encore de scène. Ajoute la première." : `Ce chapitre n’a pas encore de scène. ${majuscule(prof)} va en ajouter.`}</p>
        </div>
      ) : organise && scenes.length > 1 ? (
        <DndContext
          id="chapitre-eleve"
          sensors={capteurs}
          collisionDetection={closestCenter}
          accessibility={{
            announcements: annonces((id) => {
              const s = scenes.find((x) => x.id === id);
              return s ? referenceScene(s.reference) : "la scène";
            }),
            screenReaderInstructions: CONSIGNES_CLAVIER,
          }}
          onDragEnd={finDeplacement}
        >
          <SortableContext items={scenes.map((s) => s.id)} strategy={rectSortingStrategy}>
            <ul className="fiches" style={{ marginTop: 22 }}>
              {scenes.map((s) => (
                <FicheTiree key={s.id} id={s.id} nom={referenceScene(s.reference)}>
                  {(prise) => fiche(s, prise)}
                </FicheTiree>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="fiches" style={{ marginTop: 22 }}>
          {scenes.map((s) => (
            <li key={s.id}>{fiche(s, null)}</li>
          ))}
        </ul>
      )}

      {aSupprimer ? (
        <Dialogue
          titre={`Supprimer ${referenceScene(aSupprimer.reference)} ?`}
          onFermer={() => setASupprimer(null)}
          boutons={
            <button type="button" className="btn btn--primaire" disabled={attente} aria-busy={attente || undefined} onClick={() => void supprimer(aSupprimer)}>
              Supprimer la scène
            </button>
          }
        >
          <ul className="dialogue__faits">
            <li>Tu ne pourras pas la retrouver toi-même.</li>
            <li>{majuscule(prof)} pourra la remettre.</li>
          </ul>
        </Dialogue>
      ) : null}
    </div>
  );
}

function FicheTiree({ id, nom, children }: { id: string; nom: string; children: (prise: ReactNode) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} className={isDragging ? "est-tiree" : undefined} style={{ transform: CSS.Translate.toString(transform), transition }} {...listeners}>
      {children(<Prise nom={nom} ref={setActivatorNodeRef} {...attributes} />)}
    </li>
  );
}
