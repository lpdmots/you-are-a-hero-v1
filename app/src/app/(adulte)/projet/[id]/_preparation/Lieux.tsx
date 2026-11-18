"use client";

import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useRef, useState, type RefObject } from "react";
import { Bulle } from "@/composants/Bulle";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { annonces, CONSIGNES_CLAVIER, Prise, useCapteurs } from "@/composants/Tirer";
import { LIEU_NOM_MAX, LIEU_PHRASE_MAX, type Lieu } from "@/domaine/preparation";
import { ajouterLieu, ordonnerLieux, reglerLieu, remettreLieu, supprimerLieu } from "../../actions-lieux";
import styles from "./preparation.module.css";

/**
 * Les lieux de l'étape « Univers » (F02.1, 18 novembre 2026), sous « Nous retenons » : un nom, fixé
 * comme celui d'un personnage, et une phrase. On ajoute, on modifie sur la ligne, on supprime avec
 * « Annuler » ; l'ordre se change en tirant les lignes. Ils entrent dans la fiche de l'histoire et
 * dans le contexte des aides de l'IA.
 */
export function Lieux({ projetId, lieux }: { projetId: string; lieux: Lieu[] }) {
  const dire = useMessage();
  const capteurs = useCapteurs();
  const titre = useId();
  // La liste tenue ici, pour que l'ordre tiré ne revienne pas en arrière le temps d'enregistrer ;
  // elle reprend celle du serveur dès qu'il en rend une autre
  const [recue, setRecue] = useState(lieux);
  const [liste, setListe] = useState(lieux);
  if (lieux !== recue) {
    setRecue(lieux);
    setListe(lieux);
  }
  const [edite, setEdite] = useState<string | null>(null);
  const [ajout, setAjout] = useState(false);

  const deplacer = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const de = liste.findIndex((l) => l.id === active.id);
    const vers = liste.findIndex((l) => l.id === over.id);
    if (de < 0 || vers < 0) return;
    const nouvelle = arrayMove(liste, de, vers);
    setListe(nouvelle);
    void ordonnerLieux(projetId, nouvelle.map((l) => l.id)).then((fait) => {
      if (!fait.ok) {
        setListe(liste);
        dire({ texte: fait.erreur });
      }
    });
  };

  const supprimer = async (lieu: Lieu) => {
    setEdite(null);
    setListe((l) => l.filter((x) => x.id !== lieu.id));
    const fait = await supprimerLieu(lieu.id);
    if (!fait.ok) {
      setListe(liste);
      return dire({ texte: fait.erreur });
    }
    dire({
      texte: `« ${lieu.nom} » est supprimé de la liste.`,
      annuler: () => void remettreLieu(projetId, fait.lieu).then((r) => (r.ok ? undefined : dire({ texte: r.erreur }))),
    });
  };

  const nom = (id: string | number) => liste.find((l) => l.id === id)?.nom ?? "Ce lieu";

  return (
    <section className={styles.lieux} aria-labelledby={titre}>
      <h3 id={titre}>
        <Icone nom="boussole" />
        Lieux
        {liste.length ? <span className={styles.compte}>{liste.length}</span> : null}
        <Bulle question="Où servent les lieux ?">Ils s’impriment sur la fiche de l’histoire de chaque élève, et l’IA garde les mêmes noms.</Bulle>
      </h3>
      {liste.length ? (
        <DndContext
          // Un identifiant fixe : sans lui, celui que dnd-kit compte diffère entre le serveur et le navigateur
          id="lieux"
          sensors={capteurs}
          collisionDetection={closestCenter}
          onDragEnd={deplacer}
          accessibility={{ announcements: annonces(nom), screenReaderInstructions: CONSIGNES_CLAVIER }}
        >
          <SortableContext items={liste.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className={styles.lieux__liste}>
              {liste.map((l) =>
                edite === l.id ? (
                  <EditionDuLieu
                    key={l.id}
                    lieu={l}
                    onFini={(valeurs) => {
                      setEdite(null);
                      if (valeurs.nom === l.nom && valeurs.phrase === l.phrase) return;
                      setListe((tous) => tous.map((x) => (x.id === l.id ? { ...x, ...valeurs } : x)));
                      void reglerLieu(l.id, valeurs).then((fait) => {
                        if (!fait.ok) {
                          setListe((tous) => tous.map((x) => (x.id === l.id ? l : x)));
                          dire({ texte: fait.erreur });
                        }
                      });
                    }}
                    onAnnuler={() => setEdite(null)}
                    onSupprimer={() => void supprimer(l)}
                  />
                ) : (
                  <LigneDuLieu key={l.id} lieu={l} seul={liste.length < 2} onModifier={() => setEdite(l.id)} />
                ),
              )}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}
      {ajout ? (
        <AjoutDuLieu
          onAjouter={async (n, p) => {
            const fait = await ajouterLieu(projetId, n, p);
            if (!fait.ok) return fait.erreur;
            setListe((tous) => [...tous, fait.lieu]);
            return null;
          }}
          onFermer={() => setAjout(false)}
        />
      ) : (
        <p className={styles.ouvrirAjout}>
          <button type="button" className="btn btn--petit" onClick={() => setAjout(true)}>
            <Icone nom="plus" />
            Ajouter un lieu
          </button>
        </p>
      )}
    </section>
  );
}

/** Un lieu au repos : le repère de prise, son nom dans la voix du récit, sa phrase, le crayon. */
function LigneDuLieu({ lieu, seul, onModifier }: { lieu: Lieu; seul: boolean; onModifier: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: lieu.id, disabled: seul });
  return (
    <li ref={setNodeRef} className={`${styles.lieu}${isDragging ? " est-tiree" : ""}`} style={{ transform: CSS.Translate.toString(transform), transition }}>
      {seul ? <span className={styles.lieu__sansPrise} /> : <Prise nom={lieu.nom} ref={setActivatorNodeRef} {...attributes} {...listeners} />}
      <button type="button" className={styles.lieu__corps} onClick={onModifier} aria-label={`Modifier ${lieu.nom}`}>
        <span className={`recit ${styles.lieu__nom}`}>{lieu.nom}</span>
        {lieu.phrase ? <span className={styles.lieu__phrase}>{lieu.phrase}</span> : null}
      </button>
      <button type="button" className={styles.modifier} aria-hidden="true" tabIndex={-1} title="Modifier" onClick={onModifier}>
        <Icone nom="crayon" />
      </button>
    </li>
  );
}

/** Le nom et la phrase d'un lieu, à l'ajout comme à la modification ; la phrase grandit avec son texte. */
function ChampsDuLieu({
  nom, phrase, onNom, onPhrase, libelle, exemples, champNom,
}: {
  nom: string; phrase: string; onNom: (v: string) => void; onPhrase: (v: string) => void; libelle: string;
  exemples?: { nom: string; phrase: string };
  champNom?: RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <label className={styles.champ}>
        <span>{libelle}</span>
        <input ref={champNom} className="pchamp" type="text" maxLength={LIEU_NOM_MAX} autoFocus placeholder={exemples?.nom} value={nom} onChange={(ev) => onNom(ev.target.value)} />
      </label>
      <label className={styles.champ}>
        <span>En une phrase</span>
        <ChampQuiGrandit
          className="pchamp"
          rows={1}
          maxLength={LIEU_PHRASE_MAX}
          placeholder={exemples?.phrase}
          value={phrase}
          onChange={(ev) => onPhrase(ev.target.value.replace(/\s*\n\s*/g, " "))}
        />
      </label>
    </>
  );
}

/**
 * Un lieu qu'on modifie, sur sa ligne. « OK », Entrée ou un clic ailleurs gardent, comme partout
 * dans la Préparation ; « Annuler » ou Échap rendent ce qu'il y avait. Un nom vidé n'est pas gardé.
 */
function EditionDuLieu({
  lieu, onFini, onAnnuler, onSupprimer,
}: {
  lieu: Lieu;
  onFini: (valeurs: { nom: string; phrase: string }) => void;
  onAnnuler: () => void;
  onSupprimer: () => void;
}) {
  const [nom, setNom] = useState(lieu.nom);
  const [phrase, setPhrase] = useState(lieu.phrase);
  const cadre = useRef<HTMLLIElement>(null);
  const fini = useRef(false);
  const finir = () => {
    if (fini.current) return;
    fini.current = true;
    onFini({ nom: nom.trim() || lieu.nom, phrase: phrase.trim() });
  };
  const annuler = () => {
    fini.current = true;
    onAnnuler();
  };
  return (
    <li
      ref={cadre}
      className={`${styles.lieu} ${styles.lieu_forme}`}
      onKeyDown={(ev) => {
        if (ev.key === "Escape") {
          ev.preventDefault();
          annuler();
        }
        if (ev.key === "Enter" && !ev.shiftKey && ["INPUT", "TEXTAREA"].includes((ev.target as HTMLElement).tagName)) {
          ev.preventDefault();
          finir();
        }
      }}
      onBlur={(ev) => {
        // Un clic hors de la ligne garde ce qui est écrit, comme « OK »
        if (!cadre.current?.contains(ev.relatedTarget as Node | null)) finir();
      }}
    >
      <ChampsDuLieu nom={nom} phrase={phrase} onNom={setNom} onPhrase={setPhrase} libelle="Nom du lieu" />
      <p className={styles.lieu__gestes}>
        <button type="button" className={`lien ${styles.supprimerCarte}`} onMouseDown={(ev) => ev.preventDefault()} onClick={onSupprimer}>
          <Icone nom="corbeille" />
          Supprimer
        </button>
        <span className={styles.lieu__droite}>
          <button type="button" className="lien" onMouseDown={(ev) => ev.preventDefault()} onClick={annuler}>
            Annuler
          </button>
          <button type="button" className="btn btn--petit" onClick={finir}>
            OK
          </button>
        </span>
      </p>
    </li>
  );
}

/** Le nouveau lieu, au bout de la liste, dans la même forme qu'une modification ; il reste ouvert pour le suivant. */
function AjoutDuLieu({ onAjouter, onFermer }: { onAjouter: (nom: string, phrase: string) => Promise<string | null>; onFermer: () => void }) {
  const [nom, setNom] = useState("");
  const [phrase, setPhrase] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const champNom = useRef<HTMLInputElement>(null);
  const ajouter = async () => {
    if (!nom.trim() || enCours) return;
    setEnCours(true);
    const echec = await onAjouter(nom, phrase);
    setEnCours(false);
    setErreur(echec);
    if (echec) return;
    setNom("");
    setPhrase("");
    champNom.current?.focus();
  };
  return (
    <form
      className={`${styles.lieu} ${styles.lieu_forme} ${styles.lieu_ajout}`}
      onSubmit={(ev) => {
        ev.preventDefault();
        void ajouter();
      }}
      onKeyDown={(ev) => {
        if (ev.key === "Escape") onFermer();
        if (ev.key === "Enter" && !ev.shiftKey && (ev.target as HTMLElement).tagName === "TEXTAREA") {
          ev.preventDefault();
          void ajouter();
        }
      }}
    >
      <ChampsDuLieu
        nom={nom}
        phrase={phrase}
        onNom={setNom}
        onPhrase={setPhrase}
        libelle="Nouveau lieu"
        exemples={{ nom: "Le village des pêcheurs", phrase: "Au bord du lac, là où tout commence" }}
        champNom={champNom}
      />
      <p className={styles.lieu__gestes}>
        <span />
        <span className={styles.lieu__droite}>
          <button type="button" className="lien" onClick={onFermer}>
            Fermer
          </button>
          <button type="submit" className="btn btn--petit" disabled={!nom.trim() || enCours} aria-busy={enCours || undefined}>
            <Icone nom="plus" />
            Ajouter
          </button>
        </span>
      </p>
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
    </form>
  );
}
