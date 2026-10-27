"use client";

import { useState } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import type { AutreTexte } from "@/composants/copie/Copie";
import { Dialogue } from "@/composants/Dialogue";
import { Icone } from "@/composants/Icone";
import { Menu } from "@/composants/Menu";
import { useMessage } from "@/composants/Messages";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { compterMots } from "@/domaine/correction";
import { estVide } from "@/domaine/copie";
import type { ReponseEcriture } from "@/serveur/aides-de-la-scene";
import type { TexteDeScene } from "@/serveur/copie";
import { annulerLEcriture, mettreLEcriture } from "../../../actions-correction";
import { Champ } from "./Correction";
import { appelerUneAide } from "@/composants/PlusDEtoiles";

/**
 * « ✦ Écrire » (F13.6, décidé par le porteur le 17 octobre 2026) : à la place de « Corriger »
 * quand le texte de la scène est vide, l'IA écrit le récit d'après la consigne (sans elle, d'après le titre et ce qui mène ici), environ
 * 150 mots par défaut. La proposition se retouche dans la copie, puis « Mettre ce texte dans
 * la scène » ou « Laisser ». Si un élève s'occupe de la scène, l'adulte en est prévenu avant
 * la demande : en gardant le texte, la scène lui revient et l'élève ne l'écrit plus.
 */

const DEFAUT = 150;
const BORNES = { min: 30, max: 1500 };
const PAS_ENREGISTRE = "Vos dernières corrections ne sont pas encore enregistrées : réessayez dans un instant.";

type Revue = { version: number; paragraphes: string[]; mots: number; reste: string | null };
type Phase = null | { sorte: "prevenir" } | { sorte: "demande" } | { sorte: "change" } | ({ sorte: "revue" } & Revue);

export function useEcriture({
  sceneId, version, eleve, avantDePartir, enAttente, relire, onRemplace,
}: {
  sceneId: string;
  version: () => number;
  /** L'élève qui s'occupe de la scène : il ne l'écrira plus si l'adulte garde le texte */
  eleve: string | null;
  avantDePartir: () => Promise<boolean>;
  enAttente: () => boolean;
  relire: () => Promise<void>;
  onRemplace: (suite: TexteDeScene) => void;
}) {
  const aides = useAidesIa();
  const dire = useMessage();
  const [mots, setMots] = useState(DEFAUT);
  const [saisie, setSaisie] = useState(String(DEFAUT));
  const [phase, setPhase] = useState<Phase>(null);
  const [occupe, setOccupe] = useState(false);

  const ecrire = async (prevenu = false) => {
    if (phase?.sorte === "demande") return;
    if (eleve && !prevenu) return setPhase({ sorte: "prevenir" });
    setPhase({ sorte: "demande" });
    if (!(await avantDePartir())) {
      setPhase(null);
      return dire({ texte: PAS_ENREGISTRE });
    }
    const depuis = version();
    let r: ReponseEcriture;
    try {
      const reponse = await appelerUneAide("/ia/ecriture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene: sceneId, version: depuis, mots }),
      });
      r = reponse.status === 401 ? { ok: false, message: "Connectez-vous de nouveau." } : ((await reponse.json()) as ReponseEcriture);
    } catch {
      r = { ok: false, message: MESSAGES_IA.pasDeReponse };
    }
    if (!r.ok) {
      if (r.change) return setPhase({ sorte: "change" });
      setPhase(null);
      return dire({ texte: r.message });
    }
    if (version() !== depuis || enAttente()) return setPhase({ sorte: "change" });
    setPhase({ sorte: "revue", version: r.version, paragraphes: r.paragraphes, mots, reste: r.reste });
  };

  const mettre = async (revue: Revue) => {
    setOccupe(true);
    const fait = await mettreLEcriture(sceneId, revue.version, revue.paragraphes.filter((p) => p.trim()));
    setOccupe(false);
    if (!fait.ok) {
      if (fait.change) return setPhase({ sorte: "change" });
      return dire({ texte: fait.message });
    }
    setPhase(null);
    onRemplace(fait.scene);
    const apres = fait.scene.version;
    dire({
      texte: fait.eleveRetire ? "Le texte est dans la scène. Vous vous en occupez maintenant." : "Le texte est dans la scène.",
      annuler: () =>
        void (async () => {
          if (!(await avantDePartir())) return dire({ texte: "Le texte a changé entre-temps : rien n’a été annulé." });
          const defait = await annulerLEcriture(sceneId, apres, fait.avant.length ? fait.avant : [{ type: "p", id: crypto.randomUUID(), children: [{ text: "" }] }], fait.eleveRetire);
          if (!defait.ok) return dire({ texte: defait.message });
          onRemplace(defait.scene);
          dire({ texte: estVide(fait.avant) ? "La scène est de nouveau vide." : "Le texte écrit est retiré ; le reste de la scène est inchangé." });
        })(),
    });
  };

  const revue = phase?.sorte === "revue" ? phase : null;
  const demande = phase?.sorte === "demande";

  // « ✦ Écrire » et la longueur, dans la même pastille que « Corriger » ; rien quand les aides sont éteintes (F13)
  const barre = aides.proposer ? (
    <span className="corriger">
      <button
        type="button"
        className="outil outil--texte outil--ia"
        title="Demander à l’IA d’écrire la scène, d’après sa consigne s’il y en a une"
        disabled={demande}
        aria-busy={demande}
        onClick={() => void ecrire()}
      >
        <Icone nom="ia" />
        {demande ? "Écriture…" : "Écrire"}
      </button>
      <Menu
        fixe
        libelle={`Longueur : environ ${mots} mots`}
        bouton={
          <span>
            ≈ {mots} mots
            <Icone nom="chevron-bas" />
          </span>
        }
      >
        {(fermer) => (
          <label className="corriger__mots corriger__mots--seul">
            Environ
            <input
              type="number"
              inputMode="numeric"
              min={BORNES.min}
              max={BORNES.max}
              step={10}
              value={saisie}
              aria-label="Nombre de mots approximatif"
              onChange={(ev) => {
                setSaisie(ev.target.value);
                const n = Number(ev.target.value);
                if (ev.target.value.trim() && Number.isFinite(n) && n > 0) setMots(Math.min(BORNES.max, Math.max(BORNES.min, Math.round(n))));
              }}
              onKeyDown={(ev) => {
                if (ev.key === "Enter") {
                  ev.preventDefault();
                  fermer();
                }
              }}
            />
            mots
          </label>
        )}
      </Menu>
    </span>
  ) : null;

  const note =
    phase?.sorte === "change" ? (
      <div className="note note--attend" role="status">
        <Icone nom="horloge" />
        <p>Le texte a changé depuis la demande. Redemander ?</p>
        <span className="note__cmd">
          <button
            type="button"
            className="btn btn--petit btn--ia"
            onClick={() =>
              void (async () => {
                setPhase(null);
                await relire();
                void ecrire(true);
              })()
            }
          >
            <Icone nom="ia" />
            Redemander
          </button>
          <button type="button" className="lien" onClick={() => setPhase(null)}>
            Laisser
          </button>
        </span>
      </div>
    ) : null;

  const prevenir =
    phase?.sorte === "prevenir" && eleve ? (
      <Dialogue
        titre={`${eleve} s’occupe de cette scène`}
        onFermer={() => setPhase(null)}
        boutons={
          <button type="button" className="btn btn--primaire" onClick={() => void ecrire(true)}>
            <Icone nom="ia" />
            Écrire quand même
          </button>
        }
      >
        <ul className="dialogue__faits">
          <li>Si vous gardez le texte écrit par l’IA, la scène vous sera attribuée.</li>
          <li>{eleve} ne l’écrira plus.</li>
        </ul>
      </Dialogue>
    ) : null;

  let autre: AutreTexte | null = null;
  if (revue) {
    const ecrits = compterMots(revue.paragraphes.join(" "));
    autre = {
      barre: (
        <span className="copie__lecture corr-tete">
          <Icone nom="ia" />
          Texte proposé · environ {revue.mots} mots
        </span>
      ),
      corps: (
        <div className="copie__texte copie__texte--lu corr-ecrit" aria-label="Texte proposé, modifiable">
          {revue.paragraphes.map((p, i) => (
            <Champ
              key={i}
              valeur={p}
              change
              onChange={(v) => setPhase((x) => (x?.sorte === "revue" ? { ...x, paragraphes: x.paragraphes.map((q, j) => (j === i ? v : q)) } : x))}
            />
          ))}
        </div>
      ),
      pied: (
        <>
          <p className="corr-compte">
            {ecrits} mots.
            <span> La proposition se modifie sur place.{eleve ? ` En la gardant, vous vous occupez de la scène à la place de ${eleve}.` : ""}</span>
            {revue.reste ? <span className="corr-reste"> {revue.reste}</span> : null}
          </p>
          <span className="corr-cmd">
            <button type="button" className="btn" disabled={occupe} onClick={() => setPhase(null)}>
              Laisser
            </button>
            <button type="button" className="btn btn--primaire" disabled={occupe || revue.paragraphes.every((p) => !p.trim())} onClick={() => void mettre(revue)}>
              <Icone nom="coche" />
              Mettre ce texte dans la scène
            </button>
          </span>
        </>
      ),
    };
  }

  return { barre, note, autre, prevenir };
}
