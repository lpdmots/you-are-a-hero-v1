"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { enRoute } from "@/app/(adulte)/projet/actions-images-creees";
import { useAidesIa } from "./AidesIa";
import { Icone } from "./Icone";
import { demanderAuxImages } from "./imagesCreees";

/**
 * Les images en route (F10.1, reprise du 18 octobre 2026) : une image demandée pour le projet, une
 * partie ou un chapitre se crée côté serveur et se pose d'office à son arrivée, que la page reste
 * ouverte ou non. Les cartes des éléments qui l'attendent portent un petit signe ; la page suit les
 * demandes du projet et se relit quand une image arrive. L'image créée d'office à l'ajout d'une
 * partie ou d'un chapitre par l'IA passe par le même chemin.
 */

let enAttente: ReadonlySet<string> = new Set();
const abonnes = new Set<() => void>();
const remplacer = (ids: Iterable<string>) => {
  enAttente = new Set(ids);
  for (const a of abonnes) a();
};
const abonner = (a: () => void) => {
  abonnes.add(a);
  return () => abonnes.delete(a);
};
const VIDE: ReadonlySet<string> = new Set();
const lire = () => enAttente;

/** L'élément attend-il son image ? */
export const useImageEnAttente = (id: string): boolean => useSyncExternalStore(abonner, lire, () => VIDE).has(id);

/** Une image vient d'être demandée pour ces éléments : leurs cartes portent le signe tout de suite. */
export const suivreDesImages = (ids: readonly string[]) => remplacer([...enAttente, ...ids]);

const RYTHME_MS = 3000;

/**
 * Le suivi des images en route d'un projet, à poser une fois dans la page : il lit les demandes en
 * route à l'ouverture, puis toutes les trois secondes tant qu'il en reste, et relit la page quand
 * une image est arrivée.
 */
export function SuiviDesImages({ projetId }: { projetId: string }) {
  const routeur = useRouter();
  const attendues = useSyncExternalStore(abonner, lire, () => VIDE);
  const enCours = attendues.size > 0;
  useEffect(() => {
    let vivant = true;
    void enRoute(projetId).then((ids) => vivant && remplacer(ids)).catch(() => {});
    return () => {
      vivant = false;
    };
  }, [projetId]);
  useEffect(() => {
    if (!enCours) return;
    const minuterie = setInterval(() => {
      void enRoute(projetId)
        .then((ids) => {
          const arrivees = [...enAttente].some((id) => !ids.includes(id));
          remplacer(ids);
          if (arrivees) routeur.refresh();
        })
        .catch(() => {});
    }, RYTHME_MS);
    return () => clearInterval(minuterie);
  }, [enCours, projetId, routeur]);
  return null;
}

/** Lance les images d'office à l'ajout, si le réglage le veut : la réponse revient aussitôt. */
export function useImagesALAjout(): (sorte: "partie" | "chapitre", ids: string[]) => void {
  const reglages = useAidesIa();
  return (sorte, ids) => {
    if (!reglages.proposer || !reglages.imageALAjout || !ids.length) return;
    suivreDesImages(ids);
    void demanderAuxImages<{ ok: boolean }>({ demande: "a-l-ajout", sorte, ids }, true);
  };
}

/** Le petit signe d'attente sur l'image d'une carte : les étincelles qui luisent. */
export function AttenteDImage({ id }: { id: string }) {
  if (!useImageEnAttente(id)) return null;
  return (
    <span className="attente-image" role="status" title="L’IA crée son image…">
      <Icone nom="ia" />
      <span className="vh">L’IA crée son image…</span>
    </span>
  );
}

/** Ouvre « Mon compte » sur ses aides IA, depuis la mention « Régler ». */
export const ouvrirMonCompte = () => window.dispatchEvent(new CustomEvent("ouvrir-mon-compte", { detail: "aides-ia" }));

/**
 * « ✦ Image créée à l'ajout · Régler » : la mention discrète, là où l'on ajoute, quand le réglage
 * est allumé ; l'image coûte plus qu'un texte, en étoiles (F14).
 */
export function MentionImageALAjout({ className, avant }: { className?: string; /** Referme le panneau où elle se lit : « Mon compte » s'ouvre à sa place */ avant?: () => void }) {
  const reglages = useAidesIa();
  if (!reglages.proposer || !reglages.imageALAjout) return null;
  return (
    <p className={`mention-ajout${className ? ` ${className}` : ""}`}>
      <Icone nom="ia" />
      Image créée à l’ajout ·{" "}
      <button
        type="button"
        className="lien"
        onClick={() => {
          avant?.();
          ouvrirMonCompte();
        }}
      >
        Régler
      </button>
    </p>
  );
}
