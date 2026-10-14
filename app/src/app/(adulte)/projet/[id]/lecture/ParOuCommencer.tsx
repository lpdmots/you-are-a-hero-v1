"use client";

import Link from "next/link";
import { useState } from "react";
import { Icone } from "@/composants/Icone";
import { chercherScenes, nomScene, referenceScene, scenesDe, type Plan } from "@/domaine/recit";
import { adresseDeQuitter, requeteDeProvenance } from "./LectureAdulte";
import type { Provenance } from "./page";

/**
 * « Par où commencer ? » (F09.1) : depuis le départ du livre, ou depuis une scène trouvée par
 * la recherche des scènes (F05), et non dans une liste.
 */
export function ParOuCommencer({
  projetId, titre, plan, aChoix, departId, provenance,
}: {
  projetId: string; titre: string; plan: Plan; aChoix: boolean; departId: string | null; provenance: Provenance;
}) {
  const [demande, setDemande] = useState("");
  const adresse = (scene: string) => `/projet/${projetId}/lecture?depart=${scene}&${requeteDeProvenance(provenance)}`;
  const depart = aChoix ? scenesDe(plan).find((s) => s.id === departId) : scenesDe(plan)[0];
  const trouvees = chercherScenes(plan, demande);
  return (
    <div className="lecture lecture--accueil">
      <header className="lecture__tete">
        <div>
          <h1>
            <Icone nom="livre" />
            Lecture d’essai
          </h1>
          <p>{titre} · texte courant des scènes, sans validation</p>
        </div>
        <p className="lecture__cmd">
          <Link className="btn btn--petit btn--discret" href={adresseDeQuitter(projetId, provenance)}>
            <Icone nom="fermer" />
            Quitter
          </Link>
        </p>
      </header>
      <section className="lecture__accueil" aria-labelledby="commencer-t">
        <h2 id="commencer-t">Par où commencer ?</h2>
        <p className="lecture__chapo">Suivez les choix comme un lecteur. La lecture ne change l’état d’aucune scène.</p>
        <div className="lecture__departs">
          <section className="carnet-fiche carnet-fiche--decision" aria-labelledby="depuis-depart">
            <header>
              <Icone nom="drapeau" />
              <h3 id="depuis-depart">{aChoix ? "Depuis le départ" : "Depuis le début"}</h3>
            </header>
            <div className="carnet-fiche__corps">
              {depart ? (
                <>
                  <p>{nomScene(depart)}</p>
                  <p>
                    <Link className="btn btn--primaire" href={adresse(depart.id)}>
                      <Icone nom="fleche" />
                      {aChoix ? "Commencer au départ" : "Commencer au début"}
                    </Link>
                  </p>
                </>
              ) : (
                <p className="tache__aide">Le livre n’a pas encore de départ.</p>
              )}
            </div>
          </section>
          <section className="carnet-fiche" aria-labelledby="depuis-scene">
            <header>
              <Icone nom="loupe" />
              <h3 id="depuis-scene">Depuis une scène</h3>
            </header>
            <div className="carnet-fiche__corps">
              <label className="vh" htmlFor="chercher-scene">
                Rechercher une scène
              </label>
              <input
                id="chercher-scene"
                className="pchamp"
                type="search"
                placeholder="Rechercher une scène"
                autoComplete="off"
                value={demande}
                onChange={(ev) => setDemande(ev.target.value)}
              />
              {demande.trim() ? (
                trouvees.length ? (
                  <ul className="lecture__trouvees">
                    {trouvees.map(({ chapitre, scenes }) => (
                      <li key={chapitre.id}>
                        <p className="lecture__trouvees-chap">{chapitre.titre}</p>
                        <ul>
                          {scenes.map((s) => (
                            <li key={s.id}>
                              <Link href={adresse(s.id)}>
                                <span className="code">{referenceScene(s.reference)}</span> {s.titre ?? ""}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="tache__aide">Aucune scène ne correspond.</p>
                )
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
