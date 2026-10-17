"use client";

import { useEffect, useRef, useState } from "react";
import { useAidesIa } from "@/composants/AidesIa";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import type { ReponseConsigne, ReponseTitres } from "@/serveur/aides-de-la-scene";

/**
 * Le ✦ du titre de scène (F05) et « ✦ Formuler » sous la consigne (F13.2), dans la page de
 * scène. Chacun rend une proposition qui ne change rien tant que l'adulte ne choisit pas
 * « Utiliser » ; « Laisser » la retire, le titre et la consigne restant ce qu'ils étaient
 * (F05-AC04, F13-AC07). Avant la demande, la page enregistre ce que l'adulte vient de taper :
 * le serveur relit lui-même la consigne et le texte. Rien ne s'affiche quand les aides sont
 * éteintes (F13).
 */

const PAS_ENREGISTRE = "Vos dernières modifications ne sont pas encore enregistrées : réessayez dans un instant.";

async function demander<R extends { ok: boolean }>(adresse: string, scene: string): Promise<R | { ok: false; message: string }> {
  try {
    const reponse = await fetch(adresse, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scene }) });
    if (reponse.status === 401) return { ok: false, message: "Connectez-vous de nouveau." };
    return (await reponse.json()) as R;
  } catch {
    return { ok: false, message: MESSAGES_IA.pasDeReponse };
  }
}

type Commun = {
  sceneId: string;
  /** Enregistre ce qui attend ; faux si cela n'a pas pu l'être */
  avantDePartir: () => Promise<boolean>;
};

/**
 * Le ✦ du titre : trois titres en une demande, montrés un à un sous le champ ; un nouveau clic
 * montre le suivant, puis redemande quand les trois ont été vus.
 */
export function useTitreIa({ sceneId, avantDePartir, actuel, onUtiliser }: Commun & { actuel: string; onUtiliser: (titre: string) => void }) {
  const aides = useAidesIa();
  const dire = useMessage();
  const [titres, setTitres] = useState<string[]>([]);
  const [rang, setRang] = useState(0);
  const [montre, setMontre] = useState(false);
  const [demande, setDemande] = useState(false);

  const proposer = async () => {
    if (demande) return;
    // Il reste un titre de la dernière demande : il se montre sans rien demander
    if (rang + 1 < titres.length) {
      setRang(rang + 1);
      return setMontre(true);
    }
    setDemande(true);
    if (!(await avantDePartir())) {
      setDemande(false);
      return dire({ texte: PAS_ENREGISTRE });
    }
    const r = await demander<ReponseTitres>("/ia/titre", sceneId);
    setDemande(false);
    if (!r.ok) return dire({ texte: r.message });
    setTitres(r.titres);
    setRang(0);
    setMontre(true);
    if (r.reste) dire({ texte: r.reste });
  };

  const propose = montre ? (titres[rang] ?? null) : null;
  const utiliser = () => {
    if (!propose) return;
    const avant = actuel;
    setMontre(false);
    onUtiliser(propose);
    dire({ texte: "Titre changé.", annuler: () => onUtiliser(avant) });
  };

  const fermer = () => setMontre(false);
  if (!aides.proposer) return { bouton: null, proposition: null, fermer };
  const bouton = (
    <button
      type="button"
      className="btn btn--discret ia-titre"
      aria-label={propose ? "Proposer un autre titre" : "Proposer un titre"}
      title={propose ? "Un autre titre" : "Demander à l’IA un titre"}
      disabled={demande}
      aria-busy={demande}
      onClick={() => void proposer()}
    >
      <Icone nom="ia" />
    </button>
  );
  const proposition = propose ? (
    <div className="ia-propose ia-propose--titre" role="group" aria-label="Titre proposé">
      <span className="ia-propose__tete">
        <Icone nom="ia" />
        Titre proposé
      </span>
      <span className="ia-propose__titre">{propose}</span>
      <span className="ia-propose__gestes">
        <button type="button" className="btn btn--petit" onClick={utiliser}>
          Utiliser
        </button>
        <button type="button" className="btn btn--petit btn--discret" disabled={demande} aria-busy={demande} onClick={() => void proposer()}>
          Un autre
        </button>
        <button type="button" className="btn btn--petit btn--discret" onClick={fermer}>
          Laisser
        </button>
      </span>
    </div>
  ) : null;
  return { bouton, proposition, fermer };
}

/**
 * « ✦ Formuler », sous la consigne : d'après les mots de l'adulte, la consigne sur le modèle
 * fixe en classe (« Décris : » et deux ou trois points), une note d'intention en mode personnel.
 * La proposition se retouche sur place avant « Utiliser » (F13-AC07).
 */
export function useConsigneIa({
  sceneId, avantDePartir, deClasse, actuelle, onUtiliser, onSansIndication, onDemande,
}: Commun & {
  deClasse: boolean;
  actuelle: string;
  onUtiliser: (consigne: string) => void;
  onSansIndication: () => void;
  /** Une demande part : l'autre proposition ouverte se referme */
  onDemande: () => void;
}) {
  const aides = useAidesIa();
  const dire = useMessage();
  const [propose, setPropose] = useState<string | null>(null);
  const [demande, setDemande] = useState(false);
  // La proposition arrive au bas d'une colonne qui défile : elle se montre
  const cadre = useRef<HTMLDivElement>(null);
  const arrivee = propose !== null;
  useEffect(() => {
    if (arrivee) cadre.current?.scrollIntoView({ block: "nearest" });
  }, [arrivee]);

  const formuler = async () => {
    if (demande) return;
    if (!actuelle.trim()) {
      onSansIndication();
      return dire({ texte: "Écrivez d’abord en quelques mots ce que la scène doit raconter." });
    }
    setDemande(true);
    onDemande();
    if (!(await avantDePartir())) {
      setDemande(false);
      return dire({ texte: PAS_ENREGISTRE });
    }
    const r = await demander<ReponseConsigne>("/ia/consigne", sceneId);
    setDemande(false);
    if (!r.ok) return dire({ texte: r.message });
    setPropose(r.consigne);
    if (r.reste) dire({ texte: r.reste });
  };

  const utiliser = () => {
    const texte = propose?.trim();
    if (!texte) return;
    const avant = actuelle;
    setPropose(null);
    onUtiliser(texte);
    dire({ texte: "Consigne remplacée.", annuler: () => onUtiliser(avant) });
  };

  if (!aides.proposer) return { bouton: null, proposition: null };
  const bouton = (
    <button
      type="button"
      className="btn btn--petit ia-formuler"
      title={deClasse ? "Demander à l’IA de formuler la consigne d’après vos mots" : "Demander à l’IA une note d’intention d’après vos mots"}
      disabled={demande}
      aria-busy={demande}
      onClick={() => void formuler()}
    >
      <Icone nom="ia" />
      Formuler
    </button>
  );
  const lignes = propose ? propose.split("\n").length : 0;
  const proposition =
    propose !== null ? (
      <div ref={cadre} className="ia-propose ia-propose--consigne" role="group" aria-labelledby="ia-consigne-t">
        <p className="ia-propose__tete" id="ia-consigne-t">
          <Icone nom="ia" />
          Consigne proposée
          <span>modifiable</span>
        </p>
        <textarea
          className="pchamp"
          aria-label="Consigne proposée"
          rows={Math.min(9, Math.max(3, lignes + 1))}
          maxLength={4000}
          value={propose}
          onChange={(e) => setPropose(e.target.value)}
        />
        <span className="ia-propose__gestes">
          <button type="button" className="btn btn--petit" disabled={!propose.trim()} onClick={utiliser}>
            Utiliser
          </button>
          <button type="button" className="btn btn--petit btn--discret" onClick={() => setPropose(null)}>
            Laisser
          </button>
        </span>
      </div>
    ) : null;
  return { bouton, proposition };
}
