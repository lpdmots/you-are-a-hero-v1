"use client";

import { useEffect, useRef, useState } from "react";
import { MESSAGES_IA } from "@/domaine/aides-ia";
import { prendreDansLaReserve, type Rubrique } from "@/domaine/preparation";
import type { ReponsePreparation, SorteAidePreparation } from "@/serveur/preparation-ia";

/** Demande une aide de la Préparation par son adresse (F13.4) ; une panne se dit comme un refus. */
export async function demanderALaPreparation(projetId: string, etape: Rubrique, sorte: SorteAidePreparation): Promise<ReponsePreparation> {
  try {
    const r = await fetch("/ia/preparation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projet: projetId, etape, sorte }),
    });
    if (!r.ok && r.status !== 401 && r.status !== 500) return { ok: false, message: MESSAGES_IA.pasDeReponse };
    return (await r.json()) as ReponsePreparation;
  } catch {
    return { ok: false, message: MESSAGES_IA.pasDeReponse };
  }
}

/**
 * La réserve de l'IA pour une liste d'une étape (F13.4) : une demande en rend six, livrées une à
 * une à chaque clic, sans nouvel appel. `jeter` la vide dès que l'étape change (une idée notée
 * ou changée d'état, le texte retenu modifié, l'orientation modifiée), pour que la demande
 * suivante parte du contexte du moment (F13-AC14).
 */
export function useReserveIa({
  projetId, etape, sorte, deja, avantDeDemander, ajouter,
}: {
  projetId: string;
  etape: Rubrique;
  sorte: "questions" | "idees";
  /** Ce que la liste contient déjà : rien de ce qui y est n'est livré une seconde fois */
  deja: string[];
  /** Enregistre ce qui attend encore (texte retenu, orientation) : le serveur relit la base */
  avantDeDemander: () => Promise<void>;
  /** Ajoute l'élément livré à la liste, marqué comme venant de l'IA */
  ajouter: (texte: string) => Promise<{ ok: boolean; erreur?: string }>;
}) {
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [reste, setReste] = useState<string | null>(null);
  const reserve = useRef<string[]>([]);
  // Lu dans les gestes : la liste du moment, pas celle du rendu qui a créé le geste
  const liste = useRef(deja);
  useEffect(() => {
    liste.current = deja;
  });

  const livrer = async (element: string) => {
    const fait = await ajouter(element);
    if (!fait.ok) setErreur(fait.erreur ?? "Cela n’a pas pu être enregistré. Réessayez.");
  };

  /** Un clic sur ✦ : l'élément suivant de la réserve, ou une nouvelle demande quand elle est vide. */
  const prendre = async () => {
    if (attente) return;
    setErreur(null);
    const ici = prendreDansLaReserve(reserve.current, liste.current);
    if (ici.element) {
      reserve.current = ici.reste;
      return livrer(ici.element);
    }
    setAttente(true);
    await avantDeDemander();
    const r = await demanderALaPreparation(projetId, etape, sorte);
    if (!r.ok || r.sorte === "retenons") {
      setAttente(false);
      return setErreur(r.ok ? MESSAGES_IA.pasDeReponse : r.message);
    }
    setReste(r.reste);
    const recue = prendreDansLaReserve(r.elements, liste.current);
    reserve.current = recue.reste;
    if (recue.element) await livrer(recue.element);
    else setErreur(MESSAGES_IA.pasDeReponse);
    setAttente(false);
  };

  return {
    attente,
    erreur,
    reste,
    prendre,
    jeter: () => {
      reserve.current = [];
    },
  };
}
