"use client";

import { useEffect, useId, useRef, useState } from "react";
import { elementPropre, listePropre, TITRE_ADULTE, TITRE_ELEVE, VERIFICATION } from "@/domaine/verification";
import { ChampQuiGrandit } from "../ChampQuiGrandit";
import { Icone } from "../Icone";

/**
 * La liste de vérification sous la consigne (F13.2, F07.2), dessinée d'après la fiche « Consigne »
 * du guide : une case, le libellé, une croix pour retirer, et « Ajouter un élément » dessous.
 */

type Ligne = { cle: number; texte: string };

/**
 * Chez l'adulte : chaque élément se récrit sur place ; Entrée en ajoute un dessous, Retour arrière
 * dans un élément vide le retire. Les cases ne se cochent pas ici : elles montrent ce que l'élève a
 * coché. La page reçoit la liste propre à chaque changement ; `depart` ne se relit qu'au montage
 * (une proposition retenue remonte la liste par sa clé).
 */
export function ListeAModifier({
  depart, cochees = [], qui, onChange, titre = TITRE_ADULTE, etiquette = "Élément de la liste", cases = true,
}: {
  depart: string[];
  cochees?: string[];
  /** Faux dans une proposition de l'IA : rien n'y est encore coché */
  cases?: boolean;
  /** Le prénom de l'élève, pour dire qui a coché */
  qui?: string | null;
  onChange: (liste: string[]) => void;
  titre?: string;
  etiquette?: string;
}) {
  const suivante = useRef(depart.length);
  const [lignes, setLignes] = useState<Ligne[]>(() => depart.map((texte, cle) => ({ cle, texte })));
  // L'élément où le curseur doit aller une fois la liste redessinée
  const aViser = useRef<number | null>(null);
  const prefixe = useId();
  const idDe = (cle: number) => `${prefixe}-${cle}`;

  useEffect(() => {
    if (aViser.current === null) return;
    document.getElementById(idDe(aViser.current))?.focus();
    aViser.current = null;
  });

  const changer = (suite: Ligne[]) => {
    setLignes(suite);
    onChange(listePropre(suite.map((l) => l.texte)));
  };
  const ajouter = (apres?: number) => {
    if (lignes.length >= VERIFICATION.elementsMax) return;
    const nouvelle = { cle: suivante.current++, texte: "" };
    const i = apres === undefined ? lignes.length : lignes.findIndex((l) => l.cle === apres) + 1;
    aViser.current = nouvelle.cle;
    setLignes([...lignes.slice(0, i), nouvelle, ...lignes.slice(i)]);
  };
  const retirer = (cle: number, viser = false) => {
    const i = lignes.findIndex((l) => l.cle === cle);
    if (viser && i > 0) aViser.current = lignes[i - 1].cle;
    changer(lignes.filter((l) => l.cle !== cle));
  };
  const plein = lignes.length >= VERIFICATION.elementsMax;

  return (
    <div className="verif">
      <p className="verif__titre">{titre}</p>
      {lignes.length ? (
        <ul className="verif__liste">
          {lignes.map((l) => {
            const cochee = cochees.includes(elementPropre(l.texte));
            return (
              <li key={l.cle}>
                {cases ? (
                  <span className={`verif__case${cochee ? " est-cochee" : ""}`} title={cochee ? `Coché${qui ? ` par ${qui}` : ""}` : "Pas encore coché"}>
                    {cochee ? <Icone nom="coche" /> : null}
                    <span className="vh">{cochee ? "Coché" : "Pas encore coché"}</span>
                  </span>
                ) : null}
                {/* Un élément long passe à la ligne ; Entrée en ajoute un autre, au lieu d'une ligne de plus */}
                <ChampQuiGrandit
                  id={idDe(l.cle)}
                  dictee={false}
                  rows={1}
                  className="verif__champ"
                  aria-label={etiquette}
                  value={l.texte}
                  maxLength={VERIFICATION.longueurMax}
                  placeholder="Nouvel élément"
                  onChange={(e) => changer(lignes.map((x) => (x.cle === l.cle ? { ...x, texte: e.target.value.replace(/\s*\n\s*/g, " ") } : x)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      ajouter(l.cle);
                    } else if (e.key === "Backspace" && l.texte === "") {
                      e.preventDefault();
                      retirer(l.cle, true);
                    }
                  }}
                />
                <button type="button" className="verif__retirer" aria-label={`Retirer « ${l.texte || "élément vide"} »`} title="Retirer" onClick={() => retirer(l.cle)}>
                  <Icone nom="fermer" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="verif__vide">Aucun élément pour l’instant.</p>
      )}
      {plein ? null : (
        <button type="button" className="verif__ajouter" onClick={() => ajouter()}>
          <Icone nom="plus" />
          Ajouter un élément
        </button>
      )}
    </div>
  );
}

/**
 * Chez l'élève : « J'ai pensé à : » et ses cases. `modifiable` faux (la scène ne s'écrit plus pour
 * lui), les cases se lisent sans se cocher.
 */
export function ListeACocher({
  elements, cochees, modifiable, onCocher,
}: {
  elements: string[];
  cochees: string[];
  modifiable: boolean;
  onCocher: (element: string, coche: boolean) => void;
}) {
  return (
    <fieldset className="verif verif--eleve" disabled={!modifiable}>
      <legend className="verif__titre">{TITRE_ELEVE}</legend>
      <ul className="verif__liste">
        {elements.map((e) => (
          <li key={e}>
            <label className="verif__coche">
              <input type="checkbox" checked={cochees.includes(e)} onChange={(ev) => onCocher(e, ev.target.checked)} />
              <span>{e}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
