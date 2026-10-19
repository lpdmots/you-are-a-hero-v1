"use client";

import { useId, useRef, useState } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { demanderAuxImages } from "@/composants/imagesCreees";
import { useMessage } from "@/composants/Messages";
import { DESCRIPTION_IMAGE_MAX, IDEE_MAX } from "@/domaine/illustration";
import { lireLaCouverture, noterLaCouverture, promptDeCouverture } from "../../actions-images-creees";

/**
 * Le prompt de l'image de face (F11.4, F10.2), dans « La couverture, chez l'imprimeur » : un
 * prompt à copier, sans image créée, la couverture imprimée demandant plus de finesse. « Ce que
 * montre la couverture », « ✦ Proposer la description » quand les aides sont proposées, puis
 * « Copier le prompt », qui marche sans IA. Replié au départ ; l'idée et la description restent
 * avec le projet.
 */
export function PromptCouverture({ projetId }: { projetId: string }) {
  const dire = useMessage();
  const { proposer: ia } = useAidesIa();
  const id = useId();
  const [lu, setLu] = useState(false);
  const [idee, setIdee] = useState("");
  const [description, setDescription] = useState("");
  // Un seul champ, comme pour l'image d'une scène : l'idée, puis la description proposée qui la remplace
  const [decrit, setDecrit] = useState(false);
  const [copie, setCopie] = useState(false);
  const [attente, setAttente] = useState<"" | "description" | "prompt">("");
  const [erreur, setErreur] = useState<string | null>(null);
  const notes = useRef({ idee: "", description: "" });

  const ouvrir = async () => {
    if (lu) return;
    const c = await lireLaCouverture(projetId);
    setLu(true);
    if (!c) return;
    setIdee(c.idee);
    setDescription(c.description);
    setDecrit(c.description.trim() !== "");
    notes.current = c;
  };
  const enregistrer = async () => {
    const note: { idee?: string; description?: string } = {};
    if (idee.trim() !== notes.current.idee.trim()) note.idee = idee;
    if (description.trim() !== notes.current.description.trim()) note.description = description;
    if (!Object.keys(note).length) return;
    const fait = await noterLaCouverture(projetId, note);
    if (fait.ok) notes.current = { idee: note.idee ?? notes.current.idee, description: note.description ?? notes.current.description };
  };
  const proposer = async () => {
    setErreur(null);
    setAttente("description");
    await enregistrer();
    const r = await demanderAuxImages<{ ok: true; description: string } | { ok: false; message: string }>({ demande: "couverture", projet: projetId });
    setAttente("");
    if (!r.ok) return setErreur(r.message);
    const avant = description;
    const avantDecrit = decrit;
    setDescription(r.description);
    setDecrit(true);
    await noterLaCouverture(projetId, { description: r.description });
    notes.current.description = r.description;
    dire({
      texte: avantDecrit ? "Description remplacée." : "Description proposée : l’idée de départ reste gardée.",
      annuler: () => {
        setDescription(avant);
        setDecrit(avantDecrit);
        notes.current.description = avant;
        void noterLaCouverture(projetId, { description: avant });
      },
    });
  };
  const copier = async () => {
    setErreur(null);
    setAttente("prompt");
    await enregistrer();
    const r = await promptDeCouverture(projetId);
    setAttente("");
    if (!r.ok) return setErreur(r.erreur);
    try {
      await navigator.clipboard.writeText(r.prompt);
      setCopie(true);
      setTimeout(() => setCopie(false), 1800);
      dire({ texte: "Prompt copié : collez-le dans votre outil d’images." });
    } catch {
      setErreur("Le prompt n’a pas pu être copié. Réessayez.");
    }
  };
  const decrite = idee.trim() !== "" || (decrit && description.trim() !== "");

  return (
    <details className="couverture__prompt" onToggle={(e) => e.currentTarget.open && void ouvrir()}>
      <summary>
        <Icone nom={ia ? "ia" : "image"} />
        Le prompt de l’image de face
      </summary>
      {lu ? (
        <div className="couverture__prompt-corps">
          <div className="ci__champ couverture__champ">
            <p className="ci__libelle">
              <label htmlFor={`${id}-ce`}>Ce que montre la couverture</label>
              {ia ? (
                <button
                  type="button"
                  className="btn btn--ia ci__ia"
                  disabled={attente !== ""}
                  aria-busy={attente === "description" || undefined}
                  onClick={() => void proposer()}
                  aria-label={decrit ? "Proposer une autre description avec l’IA" : "Proposer la description avec l’IA"}
                  title="Demander à l’IA"
                >
                  <Icone nom="ia" />
                </button>
              ) : null}
            </p>
            <span className="ci__zone">
              <ChampQuiGrandit
                id={`${id}-ce`}
                className={`pchamp${decrit ? " ci__decrit" : ""}`}
                rows={decrit ? 4 : 2}
                maxLength={decrit ? DESCRIPTION_IMAGE_MAX : IDEE_MAX}
                value={attente === "description" ? "" : decrit ? description : idee}
                readOnly={attente === "description"}
                placeholder={attente === "description" ? "" : "Un lieu, un moment, un objet"}
                onChange={(e) => (decrit ? setDescription(e.target.value) : setIdee(e.target.value))}
                onBlur={() => void enregistrer()}
              />
              {attente === "description" ? (
                <span className="ci__points" role="status" aria-label="L’IA décrit la couverture">
                  <i />
                  <i />
                  <i />
                </span>
              ) : null}
              <button
                type="button"
                className="ci__copier"
                disabled={attente !== "" || !decrite}
                onClick={() => void copier()}
                aria-label="Copier le prompt, pour l’outil de l’imprimeur"
                title={decrite ? "Copier le prompt" : "Décrivez d’abord ce que montre la couverture"}
              >
                <Icone nom={copie ? "coche" : "copier"} />
              </button>
            </span>
            {decrit && idee.trim() ? (
              <button
                type="button"
                className="lien cx-discret ci__revenir"
                onClick={() => {
                  setDecrit(false);
                  setDescription("");
                  void noterLaCouverture(projetId, { description: "" }).then(() => (notes.current.description = ""));
                }}
              >
                Revenir à l’idée de départ
              </button>
            ) : null}
            <span className="cx-aide">Au format A5, sans texte : l’imprimeur ajoute le titre.</span>
          </div>
          {erreur ? (
            <p className="erreur" role="alert">
              {erreur}
            </p>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}
