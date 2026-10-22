"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { enEtoiles } from "@/domaine/aides-ia";
import { seDeconnecter } from "@/app/entree/actions";
import { monSolde } from "@/app/(adulte)/actions-compte";
import { BoutonEnvoi } from "./Attente";
import { Logo } from "./Logo";
import { Menu } from "./Menu";
import { useProjetCourant } from "./ProjetCourant";
import styles from "./BarreAdulte.module.css";

type Props = {
  nomAffiche: string | null;
  courriel: string | null;
  /** Le solde d'étoiles (F14-AC07) ; null pour le compte du porteur */
  etoiles: number | null;
  /** Le compte du porteur : « Administration » dans le menu du nom (F14) */
  admin?: boolean;
};

/**
 * Le solde dans le menu du nom : celui de la page au départ, relu à chaque ouverture du menu,
 * puisque les aides et les images créées l'usent sans recharger la page.
 */
function Solde({ depart }: { depart: number }) {
  const [solde, setSolde] = useState(depart);
  useEffect(() => {
    let actif = true;
    void monSolde().then((s) => {
      if (actif && s !== null) setSolde(s);
    });
    return () => {
      actif = false;
    };
  }, []);
  return (
    <span className={styles.solde}>
      <b>{enEtoiles(solde)}</b> pour les aides
    </span>
  );
}

const signe = (nom: string): string =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toLocaleUpperCase("fr"))
    .join("");

/**
 * Barre du haut de l'adulte : le nom du dernier projet ouvert, qui y ramène de
 * partout, puis « Mes projets » et « Mes classes ». Son nom ouvre un menu court :
 * le solde, « Mon compte » (une page, depuis le 21 octobre 2026), « Se déconnecter ».
 */
export function BarreAdulte({ nomAffiche, courriel, etoiles, admin = false }: Props) {
  const projet = useProjetCourant();
  const chemin = usePathname();

  const reprise = projet ? `/projet/${projet.id}/${projet.onglet}` : "/projets";
  const ici = (debut: string) => (chemin.startsWith(debut) ? "page" : undefined);
  const visible = nomAffiche?.trim() || courriel || "Mon compte";

  return (
    <header className={`${styles.barre} hors-impression`}>
      <Logo href={reprise} />
      <nav className={styles.nav} aria-label="Espace adulte">
        {projet ? (
          <Link className={styles.projet} href={reprise} title={projet.titre} aria-current={ici("/projet/")}>
            {projet.titre}
          </Link>
        ) : null}
        <Link href="/projets" aria-current={ici("/projets")}>
          Mes projets
        </Link>
        <Link href="/classes" aria-current={ici("/classes")}>
          Mes classes
        </Link>
      </nav>
      <div className={styles.droite}>
        <Menu
          className={styles.compte}
          libelle={`Votre compte : ${visible}`}
          bouton={
            <>
              <span className="gommette" style={{ "--g": "#4A5157" } as CSSProperties} aria-hidden="true">
                {signe(visible)}
              </span>
              <span className={styles.nom}>{visible}</span>
            </>
          }
        >
          {(fermer) => (
            <>
              <div className={styles.qui}>
                <strong>{visible}</strong>
                {courriel && courriel !== visible ? <span title={courriel}>{courriel}</span> : null}
                {/* Le solde, d'un coup d'œil ; le compte du porteur n'en a pas (F14-AC07, AC11) */}
                {etoiles !== null ? <Solde depart={etoiles} /> : null}
              </div>
              <hr />
              <Link href="/compte" onClick={fermer} aria-current={ici("/compte")}>
                Mon compte
              </Link>
              {admin ? (
                <Link href="/admin" onClick={fermer} aria-current={ici("/admin")}>
                  Administration
                </Link>
              ) : null}
              <hr />
              <form action={seDeconnecter}>
                <BoutonEnvoi>Se déconnecter</BoutonEnvoi>
              </form>
            </>
          )}
        </Menu>
      </div>
    </header>
  );
}
