"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { enEtoiles } from "@/domaine/aides-ia";
import { NOM_ONGLET, ONGLETS, TEMOIN_COLONNE, type Onglet, type Repli } from "@/domaine/projets";
import { pluriel } from "@/domaine/texte";
import { seDeconnecter } from "@/app/entree/actions";
import { monSolde } from "@/app/(adulte)/actions-compte";
import { BoutonEnvoi } from "./Attente";
import { Icone, type NomIcone } from "./Icone";
import { ImageRepere } from "./ImageRepere";
import { Logo } from "./Logo";
import { Menu } from "./Menu";
import { useProjetCourant } from "./ProjetCourant";
import styles from "./EspaceAdulte.module.css";

const SIGNE: Record<Onglet, NomIcone> = { preparation: "boussole", plan: "chapitres", suivi: "suivi", livre: "livre" };

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

type Props = {
  nomAffiche: string | null;
  courriel: string | null;
  /** Le solde d'étoiles (F14-AC07) ; null pour le compte du porteur */
  etoiles: number | null;
  /** Le compte du porteur : « Administration » dans le menu du nom (F14) */
  admin?: boolean;
  repli: Repli;
  children: ReactNode;
};

/**
 * L'espace de l'adulte (F06.5, révisé le 8 novembre 2026) : une colonne de navigation à gauche,
 * qui remplace la barre du haut et l'en-tête du projet. Le projet en cours (vignette, titre, classe),
 * ses quatre onglets, « Lire à l'essai » et « Réglages du projet » ; puis « Mes projets » et « Mes
 * classes » ; au pied, le compte et « Replier ». Sous 900 px, une barre mince et la colonne en tiroir.
 */
/**
 * Replier la colonne le temps d'un travail qui demande de la place (le bloc de scènes, F13.7),
 * sans toucher au choix gardé de l'adulte : elle revient comme elle était.
 */
const REPLI_POUR_UN_TEMPS = "colonne-adulte-pour-un-temps";
export const replierLaColonnePourUnTemps = (oui: boolean): void => {
  window.dispatchEvent(new CustomEvent<boolean>(REPLI_POUR_UN_TEMPS, { detail: oui }));
};

export function EspaceAdulte({ nomAffiche, courriel, etoiles, admin = false, repli: depart, children }: Props) {
  const { projet, actif } = useProjetCourant();
  const chemin = usePathname();
  const [repli, setRepli] = useState<Repli>(depart);
  const [tiroir, setTiroir] = useState(false);

  // Le tiroir se referme quand on change de page, et par « Échap »
  const [cheminVu, setCheminVu] = useState(chemin);
  if (chemin !== cheminVu) {
    setCheminVu(chemin);
    setTiroir(false);
  }
  useEffect(() => {
    if (!tiroir) return;
    const touche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTiroir(false);
    };
    document.addEventListener("keydown", touche);
    return () => document.removeEventListener("keydown", touche);
  }, [tiroir]);

  // Sans choix gardé, la colonne commence repliée sous 1200 px : le bouton suit ce que l'on voit
  const [etroit, setEtroit] = useState(false);
  useEffect(() => {
    const requete = window.matchMedia("(max-width: 1199px)");
    const suivre = () => setEtroit(requete.matches);
    suivre();
    requete.addEventListener("change", suivre);
    return () => requete.removeEventListener("change", suivre);
  }, []);
  const [pourUnTemps, setPourUnTemps] = useState(false);
  useEffect(() => {
    const suivre = (e: Event) => setPourUnTemps((e as CustomEvent<boolean>).detail === true);
    window.addEventListener(REPLI_POUR_UN_TEMPS, suivre);
    return () => window.removeEventListener(REPLI_POUR_UN_TEMPS, suivre);
  }, []);
  const repliee = pourUnTemps || repli === "repliee" || (repli === null && etroit);
  const basculer = () => {
    const suivant: Repli = repliee ? "ouverte" : "repliee";
    setRepli(suivant);
    try {
      document.cookie = `${TEMOIN_COLONNE}=${suivant}; path=/; max-age=${60 * 60 * 24 * 400}; samesite=lax`;
    } catch {
      // Un navigateur qui refuse les témoins garde le repli le temps de la visite
    }
  };

  const reprise = projet ? `/projet/${projet.id}/${projet.onglet}` : "/projets";
  const ici = (debut: string) => (chemin.startsWith(debut) ? "page" : undefined);
  const visible = nomAffiche?.trim() || courriel || "Mon compte";
  const enLecture = projet ? chemin.startsWith(`/projet/${projet.id}/lecture`) : false;
  const enReglages = projet ? chemin === `/projet/${projet.id}/reglages` : false;
  // Une info-bulle seulement quand le nom ne se lit pas
  const nom = (texte: string) => (repliee && !tiroir ? texte : undefined);

  return (
    <div className={styles.espace} data-repli={repli ?? undefined} data-tiroir={tiroir ? "ouvert" : undefined}>
      {/* Écran étroit : une barre mince, le titre du projet et le bouton qui ouvre la colonne (F06-AC104) */}
      <header className={`${styles.mince} hors-impression`}>
        <button type="button" className={styles.menu} aria-expanded={tiroir} aria-controls="colonne-adulte" onClick={() => setTiroir(true)}>
          <Icone nom="menu" />
          <span>Menu</span>
        </button>
        <Logo href="/projets" className={styles.logoMince} />
        {projet ? (
          <Link className={styles.titreMince} href={reprise}>
            {projet.titre}
          </Link>
        ) : null}
      </header>
      {tiroir ? <div className={styles.voile} aria-hidden="true" onClick={() => setTiroir(false)} /> : null}

      {/* Un bloc et non un « aside » : les panneaux de réglages sont les seuls compléments de la page */}
      <div id="colonne-adulte" className={`${styles.colonne} hors-impression`} data-repliee={repliee && !tiroir ? "oui" : undefined}>
        <nav className={styles.nav} aria-label="Espace adulte">
          <Logo href="/projets" className={styles.logo} />

          {projet ? (
            <section className={styles.projet} aria-label={`Projet en cours : ${projet.titre}`}>
              <Link className={styles.entete} href={reprise} aria-current={chemin === reprise ? "page" : undefined} title={nom(projet.titre)}>
                <span className={styles.vignette}>
                  <ImageRepere repere={projet.repere} graine={projet.id} />
                </span>
                <span className={styles.titre}>{projet.titre}</span>
              </Link>
              <p className={styles.classe}>
                {/* La classe s'ouvre depuis le projet (F06-AC102) */}
                {projet.classe ? (
                  <Link className="lien" href={`/classes/${projet.classe.id}`} aria-current={ici(`/classes/${projet.classe.id}`)}>
                    {projet.classe.nom}
                  </Link>
                ) : projet.deClasse ? (
                  "Sans classe"
                ) : (
                  "Projet personnel"
                )}
              </p>
              <nav aria-label="Sections du projet">
                <ul className={styles.liste}>
                  {ONGLETS.map((o) => (
                    <li key={o}>
                      <Link
                        className={styles.entree}
                        href={`/projet/${projet.id}/${o}`}
                        aria-current={actif === o && !enLecture && !enReglages ? "page" : undefined}
                        title={nom(NOM_ONGLET[o])}
                      >
                        <Icone nom={SIGNE[o]} />
                        <span className={styles.mot}>{NOM_ONGLET[o]}</span>
                        {/* Les scènes à valider, d'un coup d'œil depuis tout le projet ; rien à zéro (F06-AC100) */}
                        {o === "suivi" && projet.aValider ? (
                          <span className={styles.compte} title={`${projet.aValider} scène${pluriel(projet.aValider)} à valider`}>
                            {projet.aValider}
                            <span className="vh"> à valider</span>
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <ul className={`${styles.liste} ${styles.outils}`}>
                <li>
                  <Link
                    className={styles.entree}
                    href={`/projet/${projet.id}/lecture?de=onglet&onglet=${actif ?? projet.onglet}`}
                    aria-current={enLecture ? "page" : undefined}
                    title={nom("Lire à l’essai")}
                  >
                    <Icone nom="oeil" />
                    <span className={styles.mot}>Lire à l’essai</span>
                  </Link>
                </li>
                <li>
                  {/* Une page, comme « Mon compte » (8 novembre 2026 ; d'abord un panneau) */}
                  <Link
                    className={styles.entree}
                    href={`/projet/${projet.id}/reglages`}
                    aria-current={enReglages ? "page" : undefined}
                    title={nom("Réglages du projet")}
                  >
                    <Icone nom="reglages" />
                    <span className={styles.mot}>Réglages du projet</span>
                  </Link>
                </li>
              </ul>
            </section>
          ) : null}

          <ul className={`${styles.liste} ${styles.general}`}>
            <li>
              <Link className={styles.entree} href="/projets" aria-current={ici("/projets")} title={nom("Mes projets")}>
                <Icone nom="projets" />
                <span className={styles.mot}>Mes projets</span>
              </Link>
            </li>
            <li>
              <Link className={styles.entree} href="/classes" aria-current={ici("/classes")} title={nom("Mes classes")}>
                <Icone nom="eleves" />
                <span className={styles.mot}>Mes classes</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className={styles.pied}>
          <Menu
            className={styles.compteMenu}
            agauche
            // La colonne défile en elle-même : la liste en sort, vers le haut au pied de l'écran
            fixe
            libelle={`Votre compte : ${visible}`}
            bouton={
              <>
                <span className="gommette" style={{ "--g": "#4A5157" } as CSSProperties} aria-hidden="true">
                  {signe(visible)}
                </span>
                <span className={`${styles.mot} ${styles.nom}`}>{visible}</span>
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
          {tiroir ? (
            <button type="button" className={`${styles.entree} ${styles.replier}`} onClick={() => setTiroir(false)}>
              <Icone nom="replier" />
              <span className={styles.mot}>Fermer</span>
            </button>
          ) : (
            <button type="button" className={`${styles.entree} ${styles.replier}`} onClick={basculer} aria-expanded={!repliee} aria-controls="colonne-adulte" aria-label={repliee ? "Déplier la colonne" : "Replier la colonne"} title={nom("Déplier")}>
              <Icone nom={repliee ? "deplier" : "replier"} />
              <span className={styles.mot}>{repliee ? "Déplier" : "Replier"}</span>
            </button>
          )}
        </div>
      </div>

      <main className={styles.contenu}>{children}</main>
    </div>
  );
}
