"use client";

import { PlateElement, useSelected, type PlateElementProps } from "platejs/react";
import type { ReactNode } from "react";
import { Icone } from "@/composants/Icone";
import { estAuto, estReserve, estVide, morceauxDe, renvoisDe, type Bloc, type Choix, type Lettres, type Renvoi, type Texte } from "@/domaine/copie";
import type { FormuleRenvoi } from "@/domaine/preparation";
import { useCopie, type Livre } from "./contexte";
import { nomDeDestination } from "./FicheChoix";

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
function Phrase({ bloc, livre, formule }: { bloc: Choix; livre: Livre; formule: FormuleRenvoi }) {
  return (
    <span className="recit">
      {morceauxDe(bloc, formule).map((m, i) => ("texte" in m ? <span key={i}>{m.texte}</span> : <Numero key={i} cible={m.cible} livre={livre} />))}
    </span>
  );
}

/** Ce que portent tous les blocs : leur identité, pour s'y poser, et la place gardée dessous pour une fiche. */
function useBloc(id: string) {
  const c = useCopie();
  return {
    c,
    attributs: { "data-bloc": id } as Record<string, string>,
    style: c.espace?.bloc === id ? { marginBottom: c.espace.hauteur } : undefined,
    pose: c.tire && c.tire.avant === id ? " se-pose-avant" : "",
  };
}

export function Paragraphe(props: PlateElementProps) {
  const { attributs, style, pose } = useBloc((props.element as unknown as Bloc).id);
  return <PlateElement {...props} as="p" className={pose.trim() || undefined} style={style} attributes={{ ...props.attributes, ...attributs }} />;
}

export function PhraseDeChoix(props: PlateElementProps) {
  const bloc = props.element as unknown as Choix;
  const { c, attributs, style, pose } = useBloc(bloc.id);
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
      style={style}
      attributes={{ ...props.attributes, ...attributs }}
    >
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

const lettresLues = (l: Lettres, i: number): ReactNode => {
  let mots: ReactNode = l.text;
  if (l.bold) mots = <strong>{mots}</strong>;
  if (l.italic) mots = <em>{mots}</em>;
  if (l.underline) mots = <u>{mots}</u>;
  return <span key={i}>{mots}</span>;
};

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
          bloc.type === "choix" ? (
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
            <p key={bloc.id}>
              {bloc.children.map(lettresLues)}
              {bloc.children.every((l) => l.text === "") ? <br /> : null}
            </p>
          ),
        )
      )}
    </div>
  );
}
