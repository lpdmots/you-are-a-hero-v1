"use client";

import { PlateElement, useSelected, type PlateElementProps } from "platejs/react";
import type { ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import {
  estAuto, estImageLigne, estReserve, estVide, morceauxDe, renvoisDe, type Action, type Choix, type ImageBloc, type ImageLigne, type Lettres, type Liaison,
  type Note, type Paragraphe as ParagrapheDeRecit, type Renvoi, type Texte,
} from "@/domaine/copie";
import { phraseDeChoix, type FormuleRenvoi } from "@/domaine/preparation";
import { useCopie, type Livre } from "./contexte";
import { LIBELLE_EXEMPLE, nomDeDestination } from "./FicheChoix";

/**
 * Les blocs de la copie (F05.2 ; docs/design.md, « Choix dans la scène ») : paragraphe de
 * récit, phrase de choix entre deux filets, renvoi d'un seul bloc. La marge rouge reçoit ce
 * qui n'est jamais imprimé : la nature du bloc, son repère de prise, son cadenas.
 */

/** Le numéro que montre un renvoi, ou un vide visible comme tel (F05-AC17). */
function Numero({ cible, livre }: { cible: string | null; livre: Livre }) {
  const n = cible ? livre.numeros[cible] : undefined;
  return n ? (
    <span className="renvoi-copie">{n}</span>
  ) : (
    <span className="renvoi-copie renvoi-copie--vide" role="img" aria-label="numéro à venir" />
  );
}

/** Le repère de destination, hors du récit et jamais imprimé : « S018 Clairière », ou le lieu seul pour un élève (F05-AC42). */
function Destinations({ bloc, livre, pourEleve }: { bloc: Choix; livre: Livre; pourEleve: boolean }) {
  return (
    <span className="copie__dest" contentEditable={false}>
      {renvoisDe(bloc).map((r) => {
        const scene = livre.scenes.find((s) => s.id === r.cible);
        return (
          <span key={r.id}>
            {r.cible === null ? (
              <span className="copie__dest-vide">
                <Icone nom="bloque" />
                Sans destination
              </span>
            ) : (
              <>
                <Icone nom="fleche" />
                {scene ? nomDeDestination(scene, pourEleve) : `autre chapitre${livre.ailleurs[r.cible] ? ` · ${livre.ailleurs[r.cible]}` : ""}`}
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** La phrase telle qu'elle se lira : son texte, et à la place de chaque renvoi le numéro de sa destination. */
export function Phrase({ bloc, livre, formule }: { bloc: Choix; livre: Livre; formule: FormuleRenvoi }) {
  return (
    <span className="recit">
      {morceauxDe(bloc, formule).map((m, i) =>
        "texte" in m ? <span key={i}>{m.texte}</span> : "image" in m ? <Symbole key={i} image={m.image} alt={m.alt} /> : <Numero key={i} cible={m.cible} livre={livre} />,
      )}
    </span>
  );
}

/**
 * La phrase de choix qu'on est en train de créer, à la place qu'elle prendra dans le texte :
 * elle se compose pendant la saisie, dans le panneau, avec un libellé d'exemple tant que rien
 * n'est saisi. Elle n'est pas dans le texte : rien d'elle ne s'enregistre.
 */
function ChoixEnAttente({ remplace }: { remplace: boolean }) {
  const { livre, apercu } = useCopie();
  if (!apercu) return null;
  const MARQUE = "\u0001";
  const [avant, apres = ""] = phraseDeChoix(apercu.libelle || LIBELLE_EXEMPLE, MARQUE, livre.formule, apercu.construction).split(MARQUE);
  return (
    <span className={`choix-attendu${apercu.libelle ? "" : " choix-attendu--exemple"}${remplace ? " choix-attendu--remplace" : ""}`} contentEditable={false} aria-hidden="true">
      <span className="marge">
        <Icone nom="choix" />
      </span>
      <span className="recit">
        {avant}
        <span className="renvoi-copie renvoi-copie--attendu">…</span>
        {apres}
      </span>
      <span className="choix-attendu__mot">Nouveau choix</span>
    </span>
  );
}

/**
 * L'action de jeu qu'on est en train de créer, à la place qu'elle prendra : elle montre la
 * formule surlignée dans la liste, ou celle qu'on saisit. Comme la phrase de choix en attente,
 * elle n'est pas dans le texte.
 */
function ActionEnAttente({ remplace }: { remplace: boolean }) {
  const { formuleVue } = useCopie();
  return (
    <span className={`action-attendue${formuleVue ? "" : " action-attendue--vide"}${remplace ? " action-attendue--remplace" : ""}`} contentEditable={false} aria-hidden="true">
      <span className="action-attendue__mot">Nouvelle action de jeu</span>
      <span className="action-jeu__cadre">
        <Icone nom="crayon" />
        <span className="action-jeu__texte">{formuleVue || "Ce que le lecteur fait sur sa feuille d’aventure"}</span>
      </span>
    </span>
  );
}

/** Ce que portent tous les blocs : leur identité, pour s'y poser, et ce qu'on est en train de créer après eux. */
function useBloc(id: string) {
  const c = useCopie();
  const f = c.fiche;
  // Le choix, ou l'action de jeu, qu'on est en train de créer se lit à sa place, en attente
  const choix = f?.sorte === "creation" && f.apres === id ? f : null;
  const action = f?.sorte === "action" ? f : f?.sorte === "formule-nouvelle" && f.pour.sorte === "action" ? f.pour : null;
  return {
    c,
    attributs: { "data-bloc": id } as Record<string, string>,
    // Là où se poserait le bloc qu'on tire
    pose: c.tire && c.tire.avant === id ? " se-pose-avant" : "",
    attente: choix ? <ChoixEnAttente remplace={choix.remplace} /> : action?.apres === id ? <ActionEnAttente remplace={action.remplace} /> : null,
  };
}

/** L'adresse d'une image du projet : sa réduction d'écran, qui suffit à la copie. */
export const adresseImage = (image: string): string => `/images/${image}?v=1`;

/** Une image sur la ligne, à la hauteur du texte (F10). */
function Symbole({ image, alt }: { image: string; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir
  return <img className="symbole" src={adresseImage(image)} alt={alt ?? ""} draggable={false} />;
}

/** Une image en bloc et sa légende, telles qu'elles se lisent dans la copie comme dans le livre. */
function Figure({ bloc }: { bloc: ImageBloc }) {
  return (
    <span className={`figure${bloc.page ? " figure--page" : ""}`} style={{ width: `${bloc.largeur}%` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- servie par l'application, qui vérifie qui peut la voir */}
      <img src={adresseImage(bloc.image)} alt={bloc.alt ?? bloc.legende ?? ""} draggable={false} />
      {bloc.legende ? <span className="figure__legende">{bloc.legende}</span> : null}
    </span>
  );
}

export const lettresLues = (l: Lettres | ImageLigne | { text: string }, i: number): ReactNode => {
  if (estImageLigne(l)) return <Symbole key={i} image={l.image} alt={l.alt} />;
  let mots: ReactNode = l.text;
  const m = l as Lettres;
  if (m.bold) mots = <strong>{mots}</strong>;
  if (m.italic) mots = <em>{mots}</em>;
  if (m.underline) mots = <u>{mots}</u>;
  return <span key={i}>{mots}</span>;
};

/**
 * Le « + » de la marge : il ouvre un paragraphe au-dessus d'un bloc fermé. La feuille de
 * style ne le montre que là où l'on ne peut pas poser le curseur autrement — au-dessus du
 * premier bloc, ou entre deux blocs fermés (F06.1).
 */
function Plus({ bloc }: { bloc: string }) {
  const c = useCopie();
  return (
    <button
      type="button"
      className="plus-avant"
      contentEditable={false}
      title="Écrire au-dessus"
      aria-label="Écrire un paragraphe au-dessus"
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={(ev) => {
        // Le clic ne remonte pas à l'éditeur, qui reposerait sa sélection sur le bloc fermé
        ev.stopPropagation();
        c.ecrireAvant(bloc);
      }}
    >
      <Icone nom="plus" />
    </button>
  );
}

/** « Préparé par M. Dupont », ou « ton enseignant(e) » tant qu'aucun nom n'est affiché (F01-AC13). */
const preparePar = (enseignant: string | null): string => `Préparé par ${enseignant ?? "ton enseignant(e)"}`;

/**
 * Paragraphe de récit. Protégé par l'enseignant, il garde pour lui son crochet et son
 * cadenas dans la marge et reste modifiable ; pour un élève, c'est un bloc fermé, pris
 * comme un tout, autour duquel il écrit (F06-AC50, AC51).
 */
export function Paragraphe(props: PlateElementProps) {
  const bloc = props.element as unknown as ParagrapheDeRecit;
  const { c, attributs, pose, attente } = useBloc(bloc.id);
  const selectionne = useSelected();
  if (!bloc.protege) {
    return (
      <PlateElement {...props} as="p" className={pose.trim() || undefined} attributes={{ ...props.attributes, ...attributs }}>
        {props.children}
        {attente}
      </PlateElement>
    );
  }
  if (!estReserve(bloc, c.droits)) {
    return (
      <PlateElement {...props} as="p" className={`est-protege${pose}`} attributes={{ ...props.attributes, ...attributs }}>
        <span className="marge marge--crochet" contentEditable={false} title="Paragraphe protégé : les élèves écrivent autour">
          <Icone nom="cadenas" />
        </span>
        {props.children}
        {attente}
      </PlateElement>
    );
  }
  return (
    <PlateElement
      {...props}
      as="div"
      className={`bloc-prepare${selectionne ? " est-choisi" : ""}${pose}`}
     
      attributes={{ ...props.attributes, ...attributs, "data-ferme": "" } as never}
    >
      <Plus bloc={bloc.id} />
      <span className="marge" contentEditable={false}>
        <Icone nom="cadenas" />
      </span>
      <span className="bloc-prepare__texte recit" contentEditable={false}>
        {bloc.children.map(lettresLues)}
      </span>
      {props.children}
      <span className="repere-prepare" contentEditable={false}>
        {preparePar(c.enseignant)}
      </span>
      {attente}
    </PlateElement>
  );
}

/**
 * Action de jeu (F04.2) : un paragraphe encadré d'un filet fin et précédé d'un crayon, la même
 * mise en valeur que dans le livre. Qui peut l'écrire y écrit sur place ; pour les autres,
 * c'est un bloc préparé, pris comme un tout (F04-AC25).
 */
export function ActionDeJeu(props: PlateElementProps) {
  const bloc = props.element as unknown as Action;
  const { c, attributs, pose, attente } = useBloc(bloc.id);
  const selectionne = useSelected();
  const tire = c.tire?.bloc === bloc.id;
  if (estReserve(bloc, c.droits)) {
    return (
      <PlateElement
        {...props}
        as="div"
        className={`action-jeu est-prepare${selectionne ? " est-choisi" : ""}${pose}`}
       
        attributes={{ ...props.attributes, ...attributs, "data-ferme": "" } as never}
      >
        <Plus bloc={bloc.id} />
        <span className="marge" contentEditable={false}>
          <Icone nom="cadenas" />
        </span>
        <span className="action-jeu__cadre" contentEditable={false}>
          <Icone nom="crayon" />
          <span className="action-jeu__texte">{bloc.children.map(lettresLues)}</span>
        </span>
        {props.children}
        <span className="repere-prepare" contentEditable={false}>
          {bloc.protege ? preparePar(c.enseignant) : "Action de jeu préparée : tu écris autour"}
        </span>
        {attente}
      </PlateElement>
    );
  }
  const ouvert = c.fiche?.sorte === "formules" && c.fiche.bloc === bloc.id;
  return (
    <PlateElement
      {...props}
      as="div"
      className={`action-jeu${selectionne || ouvert ? " est-active" : ""}${bloc.protege ? " est-protege" : ""}${tire ? " est-tire" : ""}${pose}`}
     
      attributes={{ ...props.attributes, ...attributs }}
    >
      <span className="marge" contentEditable={false}>
        <button
          type="button"
          className="prise prise--bloc"
          title="Tirer pour déplacer"
          aria-label="Déplacer cette action de jeu"
          aria-roledescription="élément à déplacer"
          onPointerDown={(ev) => c.commencerATirer(bloc.id, ev)}
        >
          <Icone nom="prise" />
        </button>
      </span>
      <span className="action-jeu__legende" contentEditable={false}>
        Action de jeu
        {bloc.protege ? (
          <span className="action-jeu__protegee">
            <Icone nom="cadenas" />
            protégée
          </span>
        ) : null}
      </span>
      <span className="action-jeu__cadre">
        <span contentEditable={false} className="action-jeu__crayon">
          <Icone nom="crayon" />
        </span>
        <span className="action-jeu__texte">{props.children}</span>
      </span>
      {selectionne || ouvert ? (
        <span className="action-jeu__cmd" contentEditable={false}>
          <button type="button" className="btn btn--petit" aria-expanded={ouvert} onMouseDown={(ev) => ev.preventDefault()} onClick={(ev) => { ev.stopPropagation(); c.ouvrirFormules(bloc.id); }}>
            Formules…
          </button>
          <button type="button" className="btn btn--petit" onMouseDown={(ev) => ev.preventDefault()} onClick={(ev) => { ev.stopPropagation(); c.supprimerBloc(bloc.id); }}>
            <Icone nom="corbeille" />
            Supprimer
          </button>
        </span>
      ) : null}
      {attente}
    </PlateElement>
  );
}

/**
 * Image en bloc (F10) : prise comme un tout. L'adulte l'active pour la régler et la déplace
 * par son repère ; pour un élève, quel que soit son profil, c'est un bloc préparé (F10-AC28).
 */
export function ImageEnBloc(props: PlateElementProps) {
  const bloc = props.element as unknown as ImageBloc;
  const { c, attributs, pose, attente } = useBloc(bloc.id);
  const selectionne = useSelected();
  const reserve = estReserve(bloc, c.droits);
  const ouvert = c.fiche?.sorte === "image" && c.fiche.bloc === bloc.id;
  const tire = c.tire?.bloc === bloc.id;
  return (
    <PlateElement
      {...props}
      as="div"
      className={`image-bloc${selectionne ? " est-choisi" : ""}${ouvert ? " est-ouvert" : ""}${reserve ? " est-prepare" : ""}${tire ? " est-tire" : ""}${pose}`}
     
      attributes={{ ...props.attributes, ...attributs, "data-ferme": "" } as never}
    >
      <Plus bloc={bloc.id} />
      <span className="marge" contentEditable={false}>
        {reserve ? (
          <Icone nom="cadenas" />
        ) : (
          <button
            type="button"
            className="prise prise--bloc"
            title="Tirer pour déplacer"
            aria-label="Déplacer cette image"
            aria-roledescription="élément à déplacer"
            onPointerDown={(ev) => c.commencerATirer(bloc.id, ev)}
          >
            <Icone nom="prise" />
          </button>
        )}
      </span>
      <span
        className="image-bloc__corps"
        contentEditable={false}
        role={reserve ? undefined : "button"}
        aria-label={reserve ? undefined : "Régler cette image"}
        onClick={reserve ? undefined : () => c.ouvrirImage(bloc.id)}
      >
        <Figure bloc={bloc} />
        {bloc.page ? <span className="repere image-bloc__page">pleine page dans le livre</span> : null}
      </span>
      {props.children}
      {attente}
    </PlateElement>
  );
}

/** Image sur la ligne : un élément d'un seul bloc, à la hauteur du texte ; l'adulte l'active pour dire ce qu'elle montre. */
export function ImageSurLaLigne(props: PlateElementProps) {
  const c = useCopie();
  const image = props.element as unknown as ImageLigne;
  const selectionne = useSelected();
  const adulte = c.droits.role === "adulte";
  return (
    <PlateElement {...props} as="span" className={`symbole-en-ligne${selectionne ? " est-choisi" : ""}`} attributes={{ ...props.attributes, contentEditable: false }}>
      <span role={adulte ? "button" : undefined} aria-label={adulte ? `Régler l’image ${image.alt ?? "sur la ligne"}` : undefined} onClick={adulte ? () => c.ouvrirSymbole(image.id) : undefined}>
        <Symbole image={image.image} alt={image.alt} />
      </span>
      {props.children}
    </PlateElement>
  );
}

/** Note de l'enseignant : un paragraphe à part, sur papier grisé, que l'adulte seul lit (F05.2). */
export function NoteDeLEnseignant(props: PlateElementProps) {
  const bloc = props.element as unknown as Note;
  const { c, attributs, pose, attente } = useBloc(bloc.id);
  const tire = c.tire?.bloc === bloc.id;
  return (
    <PlateElement {...props} as="div" className={`note-prof${tire ? " est-tire" : ""}${pose}`} attributes={{ ...props.attributes, ...attributs }}>
      <span className="marge" contentEditable={false}>
        <button
          type="button"
          className="prise prise--bloc"
          title="Tirer pour déplacer"
          aria-label="Déplacer cette note"
          aria-roledescription="élément à déplacer"
          onPointerDown={(ev) => c.commencerATirer(bloc.id, ev)}
        >
          <Icone nom="prise" />
        </button>
      </span>
      <span className="note-prof__legende" contentEditable={false}>
        Note · pour vous seul, jamais imprimée
      </span>
      <span className="note-prof__texte">{props.children}</span>
      {attente}
    </PlateElement>
  );
}

export function PhraseDeChoix(props: PlateElementProps) {
  const bloc = props.element as unknown as Choix;
  const { c, attributs, pose, attente } = useBloc(bloc.id);
  const selectionne = useSelected();
  const reserve = estReserve(bloc, c.droits);
  const ferme = estAuto(bloc) || reserve;
  const ouvert = c.fiche?.sorte === "reglages" && c.fiche.bloc === bloc.id;
  const tire = c.tire?.bloc === bloc.id;
  return (
    <PlateElement
      {...props}
      as="div"
      className={`phrase-choix${ouvert ? " est-ouvert" : ""}${selectionne && ferme ? " est-choisi" : ""}${reserve ? " est-prepare" : ""}${tire ? " est-tire" : ""}${pose}`}
     
      attributes={{ ...props.attributes, ...attributs, ...(ferme ? { "data-ferme": "" } : {}) } as never}
    >
      {ferme ? <Plus bloc={bloc.id} /> : null}
      <span className="marge" contentEditable={false}>
        {reserve ? (
          <Icone nom="cadenas" />
        ) : (
          <button
            type="button"
            className="prise prise--bloc"
            title="Tirer pour déplacer"
            aria-label="Déplacer cette phrase de choix"
            aria-roledescription="élément à déplacer"
            onPointerDown={(ev) => c.commencerATirer(bloc.id, ev)}
          >
            <Icone nom="prise" />
          </button>
        )}
      </span>
      {ferme ? (
        <span
          className="phrase-choix__corps"
          contentEditable={false}
          role={reserve ? undefined : "button"}
          aria-label={reserve ? undefined : "Régler ce choix"}
          onClick={reserve ? undefined : () => c.ouvrir(bloc.id)}
        >
          <Phrase bloc={bloc} livre={c.livre} formule={c.livre.formule} />
          <Destinations bloc={bloc} livre={c.livre} pourEleve={c.pourEleve} />
        </span>
      ) : null}
      {ferme ? (
        props.children
      ) : (
        <span className="phrase-choix__corps phrase-choix__corps--libre">
          <span className="recit phrase-choix__texte">{props.children}</span>
          <Destinations bloc={bloc} livre={c.livre} pourEleve={c.pourEleve} />
          <button type="button" className="phrase-choix__regler" contentEditable={false} onClick={() => c.ouvrir(bloc.id)}>
            Régler ce choix
          </button>
        </span>
      )}
      {reserve ? (
        <span className="repere-prepare" contentEditable={false}>
          Choix préparé : tu écris autour
        </span>
      ) : null}
      {attente}
    </PlateElement>
  );
}

/** Un renvoi dans une phrase personnalisée : un élément d'un seul bloc, qui montre le numéro de sa destination. */
export function RenvoiEnLigne(props: PlateElementProps) {
  const { livre } = useCopie();
  const renvoi = props.element as unknown as Renvoi;
  const selectionne = useSelected();
  return (
    <PlateElement {...props} as="span" className={`renvoi-en-ligne${selectionne ? " est-choisi" : ""}`} attributes={{ ...props.attributes, contentEditable: false }}>
      <Numero cible={renvoi.cible} livre={livre} />
      {props.children}
    </PlateElement>
  );
}

/**
 * Le repère d'une liaison cachée (F05.1), hors du récit et jamais imprimé. L'adulte y lit
 * la destination et son numéro ; l'élève, le seul numéro que son énigme doit donner, sans
 * titre ni référence (F05-AC37).
 */
export function RepereDeLiaison({ liaison, livre, pourEleve }: { liaison: Liaison; livre: Livre; pourEleve: boolean }) {
  const numero = liaison.cible ? livre.numeros[liaison.cible] : undefined;
  if (pourEleve) {
    return (
      <span className="lien-cache__mots">
        <Icone nom="cle" />
        {numero ? (
          <>
            Ton énigme doit conduire au numéro <b className="lien-cache__n">{numero}</b>
          </>
        ) : (
          "Ton énigme doit conduire à un passage qui n’a pas encore de numéro."
        )}
      </span>
    );
  }
  const scene = livre.scenes.find((s) => s.id === liaison.cible);
  return (
    <span className="lien-cache__mots">
      <Icone nom="cle" />
      <b>Lien caché</b>
      {scene ? (
        <span>
          <Icone nom="fleche" />
          {nomDeDestination(scene, false)}
        </span>
      ) : (
        <span className="copie__dest-vide">{liaison.cible ? "scène supprimée" : "Sans destination"}</span>
      )}
      {numero ? (
        <span className="repere">
          {liaison.cible === livre.depart ? "n° 1 · départ du livre" : liaison.cible && livre.fixes[liaison.cible] ? `n° ${numero} fixé` : `n° ${numero}, non fixé`}
        </span>
      ) : null}
    </span>
  );
}

/**
 * Un texte en lecture : un texte gardé à part, une version précédente, la scène d'un
 * camarade. Les mêmes blocs que dans la copie, sans rien qui se modifie (F05-AC09).
 */
export function TexteLu({ texte, libelle, livre, pourEleve = false }: { texte: Texte; libelle: string; livre: Livre; pourEleve?: boolean }) {
  return (
    <div className="copie__texte copie__texte--lu" aria-label={libelle} lang="fr">
      {estVide(texte) ? (
        <p className="copie__vide">Ce texte est vide.</p>
      ) : (
        texte.map((bloc) =>
          bloc.type === "liaison" ? (
            <p key={bloc.id} className="lien-cache lien-cache--lu">
              <RepereDeLiaison liaison={bloc} livre={livre} pourEleve={pourEleve} />
            </p>
          ) : bloc.type === "action" ? (
            <div key={bloc.id} className="action-jeu">
              <span className="action-jeu__cadre">
                <Icone nom="crayon" />
                <span className="action-jeu__texte">{bloc.children.map(lettresLues)}</span>
              </span>
            </div>
          ) : bloc.type === "image" ? (
            <div key={bloc.id} className="image-bloc">
              <Figure bloc={bloc} />
            </div>
          ) : bloc.type === "note" ? (
            <div key={bloc.id} className="note-prof">
              <span className="note-prof__legende">Note · pour vous seul, jamais imprimée</span>
              <span className="note-prof__texte">{bloc.children.map(lettresLues)}</span>
            </div>
          ) : bloc.type === "choix" ? (
            <div key={bloc.id} className="phrase-choix">
              <span className="marge">
                <Icone nom="choix" />
              </span>
              <span className="phrase-choix__corps">
                <Phrase bloc={bloc} livre={livre} formule={livre.formule} />
                <Destinations bloc={bloc} livre={livre} pourEleve={pourEleve} />
              </span>
            </div>
          ) : (
            <p key={bloc.id} className={bloc.protege ? "est-protege" : undefined}>
              {bloc.protege ? (
                <span className="marge marge--crochet">
                  <Icone nom="cadenas" />
                </span>
              ) : null}
              {bloc.children.map(lettresLues)}
              {bloc.children.every((l) => "text" in l && l.text === "") ? <br /> : null}
            </p>
          ),
        )
      )}
    </div>
  );
}
