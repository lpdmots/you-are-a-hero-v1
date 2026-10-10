"use client";

import { useEffect, useState } from "react";
import { TexteLu } from "@/composants/copie/Blocs";
import type { Livre } from "@/composants/copie/contexte";
import { avantDePartir } from "@/composants/copie/sortie";
import { Panneau } from "@/composants/Panneau";
import { heureEnMots, jourEnMots } from "@/domaine/dates";
import { nomPourEleves } from "@/domaine/eleves";
import type { ElevePlan } from "@/domaine/recit";
import { de } from "@/domaine/texte";
import type { TexteDeScene, VersionPrecedente } from "@/serveur/copie";
import { lireVersions, remettreVersion } from "../../../actions-texte";

/** « Avant les modifications d'Alice, mardi 6 octobre » : la personne et le jour (F08.2). */
export function nomDeVersion(v: VersionPrecedente, eleves: readonly ElevePlan[], deClasse: boolean): string {
  if (v.sorte === "remplace") return `Texte remplacé ${jourEnMots(v.creeLe)} à ${heureEnMots(v.creeLe)}`;
  const jour = jourEnMots(v.jour);
  if (!deClasse) return `Avant les modifications du ${jour}`;
  if (v.deLAdulte) return `Avant vos modifications, ${jour}`;
  const eleve = eleves.find((e) => e.id === v.eleveId);
  return eleve ? `Avant les modifications ${de(nomPourEleves(eleve, eleves))}, ${jour}` : `Avant les modifications d’un élève, ${jour}`;
}

/**
 * « Versions précédentes » : le texte de la scène tel qu'il était avant qu'une personne le
 * modifie, une fois par personne et par jour. L'adulte seul les lit ; il peut en copier un
 * passage ou remettre le texte dans la scène, par le même échange que pour un texte gardé
 * à part (F08-AC40 à AC43).
 */
export function VersionsPrecedentes({
  sceneId, eleves, deClasse, livre, onFermer, onRemis,
}: {
  sceneId: string; eleves: ElevePlan[]; deClasse: boolean; livre: Livre; onFermer: () => void; onRemis: (scene: TexteDeScene) => void;
}) {
  const [versions, setVersions] = useState<VersionPrecedente[] | null>(null);
  const [choisie, setChoisie] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const lue = versions?.find((v) => v.id === choisie) ?? null;

  useEffect(() => {
    let actif = true;
    void lireVersions(sceneId).then((fait) => {
      if (!actif) return;
      if (!fait.ok) return setErreur(fait.erreur);
      setVersions(fait.versions);
      setChoisie(fait.versions[0]?.id ?? null);
    });
    return () => {
      actif = false;
    };
  }, [sceneId]);

  const remettre = async () => {
    if (!lue) return;
    setEnCours(true);
    setErreur(null);
    // Ce qui vient d'être tapé dans la scène s'enregistre d'abord : c'est ce texte qui sera gardé
    if (!(await avantDePartir())) {
      setEnCours(false);
      return setErreur("Vos dernières corrections ne sont pas encore enregistrées : réessayez dans un instant.");
    }
    const fait = await remettreVersion(lue.id, sceneId);
    setEnCours(false);
    if (!fait.ok) return setErreur(fait.erreur);
    onRemis(fait.scene);
  };

  return (
    <Panneau
      titre="Versions précédentes"
      sous="Le texte tel qu’il était avant d’être modifié, une fois par personne et par jour."
      onFermer={onFermer}
      pied={
        <>
          {lue ? (
            <button type="button" className="btn btn--primaire btn--grand" disabled={enCours} aria-busy={enCours || undefined} onClick={() => void remettre()}>
              Mettre ce texte dans la scène
            </button>
          ) : null}
          <button type="button" className="btn btn--grand" onClick={onFermer}>
            Fermer
          </button>
        </>
      }
    >
      {erreur ? (
        <p className="erreur" role="alert">
          {erreur}
        </p>
      ) : null}
      {versions === null && !erreur ? <p role="status">Chargement…</p> : null}
      {versions?.length === 0 ? (
        <p>Aucune version précédente pour cette scène. Il s’en garde une dès qu’un texte déjà écrit est modifié.</p>
      ) : null}
      {versions?.length ? (
        <>
          <ul className="versions" aria-label="Versions précédentes">
            {versions.map((v) => (
              <li key={v.id}>
                <button type="button" aria-pressed={v.id === choisie} onClick={() => setChoisie(v.id)}>
                  {nomDeVersion(v, eleves, deClasse)}
                </button>
              </li>
            ))}
          </ul>
          {lue ? (
            <div className="version-lue">
              <TexteLu texte={lue.texte} libelle={nomDeVersion(lue, eleves, deClasse)} livre={livre} />
            </div>
          ) : null}
        </>
      ) : null}
    </Panneau>
  );
}
