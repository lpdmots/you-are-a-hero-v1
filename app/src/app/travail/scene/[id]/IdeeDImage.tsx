"use client";

import { useId, useRef, useState } from "react";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { IDEE_MAX } from "@/domaine/illustration";
import { noterMonIdee } from "../../actions";
import styles from "../../travail.module.css";

/**
 * « Mon idée d'image » (F10.2, F10-AC10, AC11) : l'élève décrit en quelques mots l'image qu'il
 * imagine pour sa scène, comme un exercice de description. Fermée au départ, elle ne gêne ni le
 * texte ni la consigne ; elle s'ouvre par son en-tête, au clavier aussi. Aucune commande d'IA :
 * l'adulte retrouve l'idée en créant l'image. Une scène qui ne s'écrit plus la montre sans champ.
 */
export function IdeeDImage({ sceneId, idee: recue, modifiable }: { sceneId: string; idee: string; modifiable: boolean }) {
  const id = useId();
  const [idee, setIdee] = useState(recue);
  const [etat, setEtat] = useState<"" | "attente" | "fait" | "erreur">("");
  const enregistree = useRef(recue);
  const enregistrer = async () => {
    const propre = idee.trim();
    if (propre === enregistree.current.trim()) return;
    setEtat("attente");
    const fait = await noterMonIdee(sceneId, propre);
    if (!fait.ok) return setEtat("erreur");
    enregistree.current = propre;
    setEtat("fait");
  };
  if (!modifiable && !recue.trim()) return null;
  return (
    <details className="carnet-fiche carnet-fiche--pli">
      <summary>
        <header>
          <Icone nom="image" />
          <h2>Mon idée d’image</h2>
          {recue.trim() ? <span className="fiche-tete__fin">écrite</span> : null}
        </header>
      </summary>
      <div className="carnet-fiche__corps">
        {modifiable ? (
          <>
            <label htmlFor={id} className={styles.ideeAide}>
              Décris l’image que tu imagines pour cette scène : le lieu, ce qu’on voit, la lumière.
            </label>
            <ChampQuiGrandit
              id={id}
              className="pchamp"
              rows={3}
              maxLength={IDEE_MAX}
              value={idee}
              placeholder="Une grotte pleine de cristaux bleus qui brillent dans le noir"
              onChange={(e) => {
                setIdee(e.target.value);
                if (etat === "fait") setEtat("");
              }}
              onBlur={() => void enregistrer()}
            />
            <p className={styles.ideeEtat} role="status">
              {etat === "attente" ? "Enregistrement…" : etat === "fait" ? "Enregistrée." : etat === "erreur" ? "Ton idée n’a pas été enregistrée. Réessaie." : ""}
            </p>
          </>
        ) : (
          <p className={styles.consigne}>{recue}</p>
        )}
      </div>
    </details>
  );
}
