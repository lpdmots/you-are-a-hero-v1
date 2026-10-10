"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Icone } from "@/composants/Icone";
import { couleurDeChapitre, referenceScene } from "@/domaine/recit";
import { pluriel } from "@/domaine/texte";
import type { ChapitreTrouve } from "@/serveur/recit-eleve";
import { chercherScenes } from "./actions";

/**
 * « Rechercher une scène », pour l'élève (F05-AC48) : le même champ que celui de l'adulte
 * dans « Parties et chapitres ». Il cherche dans ce que l'élève peut lire ; les résultats
 * se rangent sous leur chapitre, et chacun ouvre sa scène.
 */
export function RechercheEleve() {
  const [demande, setDemande] = useState("");
  const [trouves, setTrouves] = useState<{ pour: string; chapitres: ChapitreTrouve[] } | null>(null);
  const voulu = demande.trim();

  useEffect(() => {
    if (voulu.length < 2) return;
    let actif = true;
    const minuteur = setTimeout(() => {
      void chercherScenes(voulu).then((chapitres) => {
        if (actif) setTrouves({ pour: voulu, chapitres });
      });
    }, 300);
    return () => {
      actif = false;
      clearTimeout(minuteur);
    };
  }, [voulu]);

  const montres = voulu.length >= 2 && trouves?.pour === voulu ? trouves.chapitres : null;
  const nombre = montres?.reduce((n, c) => n + c.scenes.length, 0) ?? 0;
  return (
    <section aria-label="Rechercher une scène">
      <label className="recherche">
        <span className="vh">Rechercher une scène</span>
        <Icone nom="loupe" />
        <input type="search" placeholder="Rechercher une scène" value={demande} onChange={(e) => setDemande(e.target.value)} />
      </label>
      {montres ? (
        <div className="trouves" aria-live="polite">
          <p className="trouves__compte">
            {nombre === 0 ? `Aucune scène ne contient « ${voulu} ».` : `${nombre} scène${pluriel(nombre)} trouvée${pluriel(nombre)}`}{" "}
            <button type="button" className="lien" onClick={() => setDemande("")}>
              Effacer la recherche
            </button>
          </p>
          {montres.map((chapitre) => {
            const c = couleurDeChapitre(chapitre.couleur);
            return (
              <div key={chapitre.id} className="trouves__chap" style={{ "--dos": c.dos, "--bandeau": c.bandeau, "--teinte": c.teinte } as CSSProperties}>
                <h3>
                  <Link href={`/travail/chapitre/${chapitre.id}`}>{chapitre.titre}</Link>
                </h3>
                <ul>
                  {chapitre.scenes.map((s) => (
                    <li key={s.id} className="trouve">
                      <span className="fiche__ref">{referenceScene(s.reference)}</span>
                      <span className="trouve__titre">
                        {s.titre ?? <span className="sans-consigne">sans titre</span>}
                        {s.extrait ? <small className="trouve__extrait">{s.extrait}</small> : null}
                      </span>
                      <span className="trouve__ouvrir" aria-hidden="true">
                        Ouvrir
                        <Icone nom="fleche" />
                      </span>
                      <Link className="trouve__cible" href={`/travail/scene/${s.id}`} aria-label={`Ouvrir ${referenceScene(s.reference)}${s.titre ? ` — ${s.titre}` : ""}`} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
