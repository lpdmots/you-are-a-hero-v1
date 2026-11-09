"use client";

import { useRef, type ReactNode, type RefObject, type TextareaHTMLAttributes } from "react";
import { raccorder } from "@/domaine/dictee";
import { BoutonDictee, useDictee, useDicteeActive } from "./Dictee";

/**
 * Pose le texte entendu dans un champ, au curseur ou à la place de la sélection, comme si
 * l'adulte l'avait tapé : la page reçoit son changement habituel, et Ctrl+Z (⌘Z) le retire.
 */
export function insererDansLeChamp(t: HTMLTextAreaElement, entendu: string) {
  const debut = t.selectionStart ?? t.value.length;
  const fin = t.selectionEnd ?? debut;
  let texte = raccorder(t.value.slice(0, debut), entendu, t.value.slice(fin));
  if (t.maxLength > 0) texte = texte.slice(0, Math.max(0, t.maxLength - (t.value.length - (fin - debut))));
  if (!texte) return;
  t.focus();
  t.setSelectionRange(debut, fin);
  // insertText garde l'annulation du navigateur ; à défaut, la valeur change et la page en est prévenue
  if (!document.execCommand?.("insertText", false, texte)) {
    t.setRangeText(texte, debut, fin, "end");
    t.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/**
 * Le champ et son micro, dans le coin haut du champ ; « titre » : sur la ligne du titre de la carte
 * qui contient le champ (un champ sans cadre, comme « Nous retenons »), la carte étant positionnée.
 */
function AvecDictee({ champ, cache, micro, children }: { champ: RefObject<HTMLTextAreaElement | null>; cache: boolean; micro: PlaceDuMicro; children: ReactNode }) {
  const dictee = useDictee({ inserer: (texte) => champ.current && insererDansLeChamp(champ.current, texte) });
  return (
    <span className={`dictable${micro === "titre" ? " dictable--titre" : ""}${dictee.etat === "enregistre" ? " est-enregistre" : ""}`}>
      {children}
      {cache ? null : <BoutonDictee dictee={dictee} />}
    </span>
  );
}

export type PlaceDuMicro = "champ" | "titre";

export type ProprietesDuChamp = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** false : pas de micro dans ce champ (une liste de prénoms, par exemple) */
  dictee?: boolean;
  /** « titre » : le micro sur la ligne du titre de la carte, pour un champ sans cadre */
  micro?: PlaceDuMicro;
};

/**
 * Un champ de plusieurs lignes ordinaire, avec le micro dans l'espace de l'adulte (F07.4). Ailleurs,
 * ou avec `dictee={false}`, un champ seul.
 */
export function ChampTexte({ dictee = true, micro = "champ", ...props }: ProprietesDuChamp) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <Dictable champ={ref} dictee={dictee} micro={micro} props={props}>
      <textarea ref={ref} {...props} />
    </Dictable>
  );
}

/** Ce qui entoure un champ de son micro, quand le micro a sa place ici. */
export function Dictable({
  champ, dictee, micro = "champ", props, children,
}: {
  champ: RefObject<HTMLTextAreaElement | null>;
  dictee: boolean;
  micro?: PlaceDuMicro;
  props: TextareaHTMLAttributes<HTMLTextAreaElement>;
  children: ReactNode;
}) {
  const active = useDicteeActive();
  if (!active || !dictee) return children;
  return (
    <AvecDictee champ={champ} cache={!!props.disabled || !!props.readOnly} micro={micro}>
      {children}
    </AvecDictee>
  );
}
