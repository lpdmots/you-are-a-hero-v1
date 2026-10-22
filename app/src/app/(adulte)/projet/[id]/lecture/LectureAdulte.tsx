"use client";

import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { LectureClient } from "@/composants/lecture/LectureClient";
import { TamponScene } from "@/composants/TamponScene";
import type { LivreLu, PassageLu } from "@/domaine/lecture";
import { referenceScene } from "@/domaine/recit";
import type { Provenance } from "./page";

/** Où « Quitter » ramène : la tâche « Tester la lecture » du Livre, ou la scène d'où l'on est parti. */
export const adresseDeQuitter = (projetId: string, p: Provenance): string =>
  p.de === "scene" ? `/projet/${projetId}/scene/${p.scene}` : p.de === "onglet" ? `/projet/${projetId}/${p.onglet}` : `/projet/${projetId}/livre?etape=chemins`;

/** Ce que l'adresse garde de la provenance, pour la retrouver au retour d'une scène. */
export const requeteDeProvenance = (p: Provenance): string =>
  p.de === "scene" ? `de=scene&scene=${p.scene}` : p.de === "onglet" ? `de=onglet&onglet=${p.onglet}` : "de=livre";

/**
 * La lecture d'essai de l'adulte (F09.1) : la lecture commune, et son bandeau — le chapitre,
 * la référence et le titre, l'état de la scène, « Hors du livre », « Ouvrir la scène ».
 */
export function LectureAdulte({
  projetId, titre, livre, depart, reprendre, provenance,
}: {
  projetId: string; titre: string; livre: LivreLu; depart: string; reprendre: boolean; provenance: Provenance;
}) {
  const bandeau = (p: PassageLu) => (
    <div className="lu-bandeau">
      <span className="lu-bandeau__chapitre">
        <span className="lu-bandeau__pastille" aria-hidden="true" />
        {p.chapitre.titre}
      </span>
      <span className="lu-bandeau__scene">
        {p.reference ? <span className="code">{referenceScene(p.reference)}</span> : null} {p.titre ?? ""}
      </span>
      {p.horsLivre ? <span className="lu-bandeau__hors">Hors du livre</span> : null}
      {p.etat ? <TamponScene etat={p.etat} vide={p.vide} /> : null}
      <Link className="lien" href={`/projet/${projetId}/scene/${p.id}?de=lecture&lecture=${encodeURIComponent(requeteDeProvenance(provenance))}`}>
        Ouvrir la scène
        <Icone nom="fleche" />
      </Link>
    </div>
  );
  return (
    <LectureClient
      livre={livre}
      depart={depart}
      pourEleve={false}
      cle={`lecture-essai:${projetId}`}
      reprendre={reprendre}
      titre="Lecture d’essai"
      sousTitre={`${titre} · texte courant des scènes, sans validation`}
      quitter={adresseDeQuitter(projetId, provenance)}
      bandeau={bandeau}
    />
  );
}
