"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ToucheReact } from "react";
import { poser } from "@/composants/flottant";
import { useAidesIa } from "@/composants/AidesIa";
import { ChampQuiGrandit } from "@/composants/ChampQuiGrandit";
import { Icone } from "@/composants/Icone";
import { useMessage } from "@/composants/Messages";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import type { ReponseConsigne, ReponseTitres } from "@/serveur/aides-de-la-scene";
import type { ReponseIdees } from "@/serveur/idees-de-choix";
import type { ServicesImage } from "@/composants/copie/contexte";
import { demanderAuxImages, garderLaProposition } from "@/composants/imagesCreees";
import type { DemandeDImage } from "@/serveur/images-creees";
import { demandeDImage, fermerUneDemande, noterLImage, ouvrirLImage, promptDeLImage, propositionPosee, rendreUneProposition, reserverUneProposition, suivreLaDemande } from "../../../actions-images-creees";

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

/**
 * L'image d'une scène (F10.2), pour la copie : ouvrir, noter l'idée et la description, proposer la
 * description et créer l'image par `/ia/images`, copier le prompt sans IA, garder une proposition
 * comme une image importée.
 */
export function imageDeScene(projetId: string, sceneId: string, ia: boolean): ServicesImage {
  return {
    ia,
    ouvrir: () => ouvrirLImage(sceneId),
    noter: (note) => noterLImage(sceneId, note),
    proposer: (d) => demanderAuxImages({ demande: "description", scene: sceneId, ...d }),
    creer: async (d) => {
      const r = await demanderAuxImages<{ ok: true; demande: string } | { ok: false; message: string }>({ demande: "image-scene", scene: sceneId, ...d }, true);
      window.dispatchEvent(new Event("image-de-scene"));
      return r;
    },
    suivre: (id) => suivreLaDemande(id),
    prompt: (d) => promptDeLImage(sceneId, d),
    adresse: (p) => `/images/proposition/${projetId}/${p}`,
    garder: (p, demandeId) => garderReservee(projetId, demandeId, p),
    fermer: async (id) => {
      await fermerUneDemande(id);
      window.dispatchEvent(new Event("image-de-scene"));
    },
  };
}

/**
 * L'image demandée pour une scène (reprise du 18 octobre 2026) : en route, elle se suit toutes les
 * trois secondes ; prête, la page la pose d'elle-même dans le texte, sauf quand le panneau « Créer
 * une image » est ouvert, où l'adulte choisit (« quitter vaut accord »). Rend la demande en cours.
 */
export function useImageDemandee(sceneId: string, suivre: boolean): DemandeDImage | null {
  const [demande, setDemande] = useState<DemandeDImage | null>(null);
  useEffect(() => {
    if (!suivre) return;
    let vivant = true;
    let minuterie: ReturnType<typeof setTimeout> | null = null;
    // Seule la dernière lecture compte : une réponse partie avant « Garder » ne ramène pas une demande fermée
    let derniere = 0;
    const lire = () => {
      const numero = ++derniere;
      void demandeDImage("scene", sceneId)
        .then((d) => {
          if (!vivant || numero !== derniere) return;
          setDemande(d);
          if (d?.etat === "en_route") minuterie = setTimeout(lire, 3000);
        })
        .catch(() => {});
    };
    lire();
    // Quand une demande part, se pose ou se ferme, la page la relit ; l'ancienne ne vaut plus d'ici là
    const relire = () => {
      if (minuterie) clearTimeout(minuterie);
      setDemande(null);
      lire();
    };
    window.addEventListener("image-de-scene", relire);
    return () => {
      vivant = false;
      if (minuterie) clearTimeout(minuterie);
      window.removeEventListener("image-de-scene", relire);
    };
  }, [sceneId, suivre]);
  return demande;
}

/**
 * Garde une proposition d'une demande de scène : réservée d'abord, pour qu'elle ne se pose qu'une
 * fois, que l'adulte la garde dans le panneau ou que la page la pose d'office ; puis déposée comme une
 * image importée, et notée posée. Rend l'image, que la copie écrit dans le texte.
 */
async function garderReservee(projetId: string, demandeId: string, proposition: string): Promise<{ ok: true; id: string } | { ok: false; erreur: string }> {
  if (!(await reserverUneProposition(demandeId, proposition))) return { ok: false, erreur: DEJA_POSEE };
  const fait = await garderLaProposition(projetId, proposition, []);
  if (!fait.ok) {
    await rendreUneProposition(demandeId, proposition);
    return fait;
  }
  await propositionPosee(demandeId, proposition, fait.id);
  return fait;
}
const DEJA_POSEE = "Cette image est déjà posée dans la scène.";

/** Pose d'office la première image d'une demande prête, quand l'adulte a quitté le panneau. */
export async function poserLaPremiere(projetId: string, demande: DemandeDImage): Promise<{ ok: true; image: string } | { ok: false }> {
  const premiere = demande.propositions[0];
  if (!premiere) return { ok: false };
  const fait = await garderReservee(projetId, demande.id, premiere);
  return fait.ok ? { ok: true, image: fait.id } : { ok: false };
}

/**
 * « ✦ Idées de choix » (F13.3) : le panneau des idées, dans la copie, demande par cette adresse.
 * La page n'envoie que l'orientation et les libellés déjà montrés ; le serveur relit le reste.
 */
export async function demanderDesIdees(scene: string, demande: { orientation: string; dejaMontrees: string[] }): Promise<ReponseIdees> {
  try {
    const reponse = await fetch("/ia/idees-choix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scene, orientation: demande.orientation, dejaMontrees: demande.dejaMontrees }),
    });
    if (reponse.status === 401) return { ok: false, message: "Connectez-vous de nouveau." };
    return (await reponse.json()) as ReponseIdees;
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
 * Le ✦ du titre : trois titres en une demande, montrés ensemble dans une liste ouverte sous le
 * titre, pour les comparer (décidé par le porteur le 17 octobre 2026). Un clic sur un titre
 * l'utilise ; « D'autres titres » redemande ; Échap, un clic ailleurs ou « Laisser » ne
 * changent rien (F05-AC04).
 */
export function useTitreIa({
  sceneId, avantDePartir, actuel, onUtiliser, champ,
}: Commun & { actuel: string; onUtiliser: (titre: string) => void; /** Le champ du titre, sous lequel la liste s'ouvre */ champ: () => HTMLElement | null }) {
  const aides = useAidesIa();
  const dire = useMessage();
  const [titres, setTitres] = useState<string[] | null>(null);
  const [demande, setDemande] = useState(false);
  const bouton = useRef<HTMLButtonElement>(null);
  const liste = useRef<HTMLDivElement>(null);
  const ouverte = titres !== null;

  const proposer = async () => {
    if (demande) return;
    setDemande(true);
    if (!(await avantDePartir())) {
      setDemande(false);
      return dire({ texte: PAS_ENREGISTRE });
    }
    const r = await demander<ReponseTitres>("/ia/titre", sceneId);
    setDemande(false);
    if (!r.ok) return dire({ texte: r.message });
    setTitres(r.titres);
    if (r.reste) dire({ texte: r.reste });
  };

  const fermer = () => setTitres(null);
  const utiliser = (t: string) => {
    const avant = actuel;
    fermer();
    onUtiliser(t);
    dire({ texte: "Titre changé.", annuler: () => onUtiliser(avant) });
  };

  // Sous le titre, dans la fenêtre ; le premier titre prend le clavier
  useLayoutEffect(() => {
    const ancre = champ();
    if (!ouverte || !ancre || !liste.current) return;
    return poser(ancre, liste.current, { cote: "bottom-start", fixe: true });
  }, [ouverte, champ]);
  useEffect(() => {
    if (ouverte) liste.current?.querySelector<HTMLButtonElement>(".ia-titres__choix")?.focus();
  }, [ouverte, titres]);
  // Échap ou un clic ailleurs : on laisse
  useEffect(() => {
    if (!ouverte) return;
    const dehors = (e: MouseEvent) => {
      const cible = e.target as Node;
      if (!liste.current?.contains(cible) && !bouton.current?.contains(cible)) fermer();
    };
    const touche = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      fermer();
      bouton.current?.focus();
    };
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", touche);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", touche);
    };
  }, [ouverte]);

  // Flèches haut et bas entre les titres
  const parcourir = (e: ToucheReact) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const boutons = [...(liste.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
    const ici = boutons.indexOf(document.activeElement as HTMLButtonElement);
    if (ici < 0) return;
    e.preventDefault();
    boutons[(ici + (e.key === "ArrowDown" ? 1 : boutons.length - 1)) % boutons.length]?.focus();
  };

  if (!aides.proposer) return { bouton: null, proposition: null, fermer };
  const signe = (
    <button
      ref={bouton}
      type="button"
      className="btn btn--discret ia-titre"
      aria-label="Proposer des titres"
      aria-expanded={ouverte}
      title="Demander à l’IA des titres"
      disabled={demande}
      aria-busy={demande}
      onClick={() => (ouverte ? fermer() : void proposer())}
    >
      <Icone nom="ia" />
    </button>
  );
  const proposition = titres ? (
    <div ref={liste} className="menu__liste flottant ia-titres" style={{ position: "fixed" }} role="group" aria-label="Titres proposés" onKeyDown={parcourir}>
      <p className="ia-propose__tete">
        <Icone nom="ia" />
        Titres proposés
        <span>cliquez pour l’utiliser</span>
      </p>
      {titres.map((t) => (
        <button key={t} type="button" className="ia-titres__choix" onClick={() => utiliser(t)}>
          {t}
        </button>
      ))}
      <span className="ia-titres__pied">
        <button type="button" className="btn btn--petit btn--ia" disabled={demande} aria-busy={demande} onClick={() => void proposer()}>
          <Icone nom="ia" />
          D’autres titres
        </button>
        <button type="button" className="btn btn--petit btn--discret" onClick={fermer}>
          Laisser
        </button>
      </span>
    </div>
  ) : null;
  return { bouton: signe, proposition, fermer };
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
      className="btn btn--petit btn--ia ia-formuler"
      title={deClasse ? "Demander à l’IA de formuler la consigne d’après vos mots" : "Demander à l’IA une note d’intention d’après vos mots"}
      disabled={demande}
      aria-busy={demande}
      onClick={() => void formuler()}
    >
      <Icone nom="ia" />
      Formuler
    </button>
  );
  const proposition =
    propose !== null ? (
      <div ref={cadre} className="ia-propose ia-propose--consigne" role="group" aria-labelledby="ia-consigne-t">
        <p className="ia-propose__tete" id="ia-consigne-t">
          <Icone nom="ia" />
          Consigne proposée
          <span>modifiable</span>
        </p>
        <ChampQuiGrandit
          className="pchamp"
          aria-label="Consigne proposée"
          rows={3}
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
