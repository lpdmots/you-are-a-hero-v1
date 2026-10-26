"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { Coeur } from "@/composants/Coeur";
import { Icone } from "@/composants/Icone";
import { nomDeLAge, type LivrePublie } from "@/domaine/bibliotheque-publique";
import { Couverture } from "./Bibliotheque";
import { Signaler } from "./Signaler";
import styles from "./bibliotheque.module.css";

/**
 * Le tiroir d'un livre (F15, « Une page indexée, des livres qui ne le sont pas ») : à droite sur un
 * ordinateur, en bas sur un téléphone, la page de titre en grand, la présentation, l'âge, le type
 * et « Lire le livre », seul bouton plein, son cœur à côté. Il a l'adresse du livre, le lien donné aux familles ;
 * le fermer ramène à la liste, sa recherche gardée. `pied` reçoit les cœurs et le signalement.
 */
export function Tiroir({ livre, retour, pied }: { livre: LivrePublie; retour: string; pied?: ReactNode }) {
  const routeur = useRouter();
  const ref = useRef<HTMLElement>(null);
  const fermer = () => routeur.push(retour, { scroll: false });

  useEffect(() => {
    const avant = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("[data-focus]")?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") routeur.push(retour, { scroll: false });
    };
    document.addEventListener("keydown", touche);
    // La page dessous ne défile pas tant que le tiroir est ouvert
    const corps = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", touche);
      document.documentElement.style.overflow = corps;
      avant?.focus?.();
    };
  }, [livre.adresse, retour, routeur]);

  return (
    <>
      <div className={styles.voile} onClick={fermer} aria-hidden="true" />
      <aside ref={ref} className={styles.tiroir} role="dialog" aria-modal="true" aria-labelledby="tiroir-t">
        <Link href={retour} scroll={false} className={`btn btn--discret ${styles.fermer}`} aria-label="Fermer">
          <Icone nom="fermer" />
        </Link>
        <div className={styles.tiroirCorps}>
          <Couverture livre={livre} grand />
          <div className={styles.fiche}>
            {/* Le focus va au titre, non à la croix : on arrive par le lien pour lire, pas pour fermer */}
            <h2 id="tiroir-t" className={styles.ficheTitre} tabIndex={-1} data-focus>
              {livre.titre}
            </h2>
            {livre.sousTitre ? <p className={styles.ficheSousTitre}>{livre.sousTitre}</p> : null}
            {livre.ligne ? <p className={styles.ficheLigne}>{livre.ligne}</p> : null}
            <p className={styles.presentation}>{livre.presentation}</p>
            <dl className={styles.reperes}>
              <div>
                <dt>Lecteurs</dt>
                <dd>{nomDeLAge(livre.age)}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>
                  {livre.aChoix ? `Livre-jeu : tu choisis la suite${livre.passages ? ` (${livre.passages} passages)` : ""}` : "Récit, qui se lit dans l’ordre"}
                </dd>
              </div>
            </dl>
            <div className={styles.lire}>
              <Link className="btn btn--primaire" href={`/lire/bibliotheque/${livre.adresse}`}>
                <Icone nom="livre" />
                Lire le livre
              </Link>
              <Coeur adresse={livre.adresse} nombre={livre.coeurs} />
            </div>
            {pied}
            <Signaler adresse={livre.adresse} aChoix={livre.aChoix} />
          </div>
        </div>
      </aside>
    </>
  );
}
