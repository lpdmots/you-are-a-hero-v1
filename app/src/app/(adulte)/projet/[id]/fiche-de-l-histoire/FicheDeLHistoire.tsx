"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icone } from "@/composants/Icone";
import {
  messageDeLongueur, paginer, type FicheDeLHistoire as Fiche, type MorceauMesure, type PersonnageDeFiche, type RubriqueDeFiche,
} from "@/domaine/fiche-histoire";
import { adresseRepere } from "@/domaine/visuels";
import styles from "./fiche.module.css";

/** Un millimètre à l'écran, en points CSS (96 points par pouce) */
const MM = 96 / 25.4;
/** La largeur de la feuille A4, en points CSS */
const LARGEUR_A4 = 210 * MM;

/** Ce que la mesure de la feuille rend : ses coupures de page et sa rubrique la plus haute. */
type Mesure = { coupures: number[]; plusLongue: string | null };

/**
 * La fiche de l'histoire (F02.1) : à l'écran, la feuille telle qu'elle s'imprimera, ses coupures de
 * page et « Imprimer » ; à l'impression, la feuille seule. La feuille garde la largeur de
 * l'impression (réduite à l'œil sur un écran étroit) : ses morceaux mesurés disent où les pages se
 * couperont, et un message prévient au-delà d'un recto verso, sans rien couper (F02-AC23).
 */
export function FicheDeLHistoire({ fiche, retour, aJourDu }: { fiche: Fiche; retour: string; aJourDu: string }) {
  const bureau = useRef<HTMLDivElement>(null);
  const feuille = useRef<HTMLElement>(null);
  const contenu = useRef<HTMLDivElement>(null);
  const [mesure, setMesure] = useState<Mesure | null>(null);
  // Sur un écran plus étroit que l'A4, la feuille est réduite pour se voir en entier
  const [echelle, setEchelle] = useState({ k: 1, hauteur: 0 });

  useEffect(() => {
    const cadre = contenu.current;
    const page = feuille.current;
    const table = bureau.current;
    if (!cadre || !page || !table) return;
    const mesurer = () => {
      // offsetTop et offsetHeight ignorent la réduction de la feuille : les millimètres restent ceux de l'impression
      const haut = (el: HTMLElement): number => {
        let y = 0;
        for (let n: HTMLElement | null = el; n && n !== cadre; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
        return y / MM;
      };
      const morceaux: MorceauMesure[] = [...cadre.querySelectorAll<HTMLElement>("[data-morceau]")].map((el) => ({
        haut: haut(el),
        bas: haut(el) + el.offsetHeight / MM,
        sorte: el.dataset.morceau as MorceauMesure["sorte"],
      }));
      const rubriques = [...cadre.querySelectorAll<HTMLElement>("[data-rubrique]")];
      const plus = rubriques.reduce<HTMLElement | null>((m, r) => (!m || r.offsetHeight > m.offsetHeight ? r : m), null);
      setMesure({ coupures: paginer(morceaux), plusLongue: plus?.dataset.rubrique ?? null });
      const k = Math.min(1, table.clientWidth / LARGEUR_A4);
      setEchelle({ k, hauteur: page.offsetHeight * k });
    };
    const suivre = new ResizeObserver(mesurer);
    suivre.observe(cadre);
    suivre.observe(table);
    // Les polices de la feuille changent sa hauteur : mesurée de nouveau une fois chargées
    void document.fonts?.ready.then(mesurer);
    return () => suivre.disconnect();
  }, []);

  const pages = mesure ? mesure.coupures.length + 1 : null;
  const message = pages === null ? null : messageDeLongueur(pages, mesure?.plusLongue);

  return (
    <div className={styles.ecran}>
      <nav className="fil hors-impression" aria-label="Fil d’Ariane">
        <Link href={retour}>
          <Icone nom="fleche-g" />
          Retour à la Préparation
        </Link>
      </nav>
      <header className="page-tete page-tete--onglet hors-impression">
        <div>
          <h1>Fiche de l’histoire</h1>
          <p className={styles.intro}>Ce que retient la Préparation, pour que chaque élève ait les mêmes noms sous les yeux. Elle se corrige dans la Préparation.</p>
        </div>
      </header>

      <div className={`${styles.barre} hors-impression`}>
        <p className={styles.pages} role="status">
          {fiche.vide ? "Rien à imprimer pour l’instant" : pages === null ? " " : pages === 1 ? "1 page" : pages === 2 ? "2 pages : imprimez en recto verso" : `${pages} pages`}
        </p>
        <button type="button" className="btn btn--primaire" disabled={Boolean(fiche.vide)} onClick={() => window.print()}>
          <Icone nom="imprimer" />
          Imprimer
        </button>
      </div>
      {message ? (
        <p className={`${styles.trop} hors-impression`} role="alert">
          <Icone nom="alerte" />
          {message}
        </p>
      ) : null}

      <div ref={bureau} className={styles.bureau} style={echelle.k < 1 ? { height: echelle.hauteur } : undefined}>
        <article
          ref={feuille}
          className={styles.feuille}
          style={echelle.k < 1 ? { transform: `scale(${echelle.k})` } : undefined}
          aria-label="Aperçu de la fiche de l’histoire"
        >
          <div ref={contenu} className={styles.contenu}>
            <header className={styles.tete} data-morceau="insecable">
              <h2 className={styles.titre}>{fiche.titre}</h2>
              {/* eslint-disable-next-line @next/next/no-img-element -- la mascotte, comme sur les feuilles à imprimer du site */}
              <img className={styles.dragon} src="/accueil/dragon-penche.webp" alt="" />
            </header>
            {fiche.vide ? (
              <p className={styles.vide} data-morceau="texte">
                {fiche.vide}
              </p>
            ) : (
              fiche.rubriques.map((r) => <Rubrique key={r.sorte} rubrique={r} />)
            )}
            <p className={styles.pied} data-morceau="insecable">
              Fiche de l’histoire · à jour du {aJourDu} · Il était une classe
            </p>
            {/* Où l'impression coupera : à l'écran seulement */}
            {mesure?.coupures.map((c, i) => (
              <p key={c} className={`${styles.coupure} hors-impression`} style={{ top: `${c}mm` }} aria-hidden="true">
                <span>page {i + 2}</span>
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}

function Rubrique({ rubrique: r }: { rubrique: RubriqueDeFiche }) {
  return (
    <section className={styles.rubrique} data-sorte={r.sorte} data-rubrique={r.titre}>
      <h3 className={styles.rubrique__titre} data-morceau="titre">
        {r.titre}
      </h3>
      {"texte" in r ? (
        <p className={styles.texte} data-morceau="texte">
          {r.texte}
        </p>
      ) : null}
      {r.sorte === "heros" ? (
        <div className={styles.heros}>
          {r.personnages.map((p) => (
            <Personnage key={p.id} p={p} grand />
          ))}
        </div>
      ) : null}
      {r.sorte === "autres" ? (
        <div className={styles.grille}>
          {r.personnages.map((p) => (
            <Personnage key={p.id} p={p} />
          ))}
        </div>
      ) : null}
      {r.sorte === "parties" ? (
        <dl className={styles.grille}>
          {r.parties.map((x) => (
            <div key={x.id} className={`${styles.element}${x.repere ? ` ${styles.element_image}` : ""}`} data-morceau="insecable">
              {x.repere ? (
                // eslint-disable-next-line @next/next/no-img-element -- l'image de repérage de la partie, sa vignette
                <img className={styles.vignettePartie} src={adresseRepere(x.repere, x.id)} alt="" />
              ) : null}
              <dt className={styles.nom}>{x.titre}</dt>
              {x.description ? <dd className={styles.phrase}>{x.description}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}
      {r.sorte === "objets" ? (
        <dl className={styles.grille}>
          {r.objets.map((o) => (
            <div key={o.id} className={`${styles.element}${o.imageId ? ` ${styles.element_image}` : ""}`} data-morceau="insecable">
              {o.imageId ? (
                // eslint-disable-next-line @next/next/no-img-element -- image de référence de l'objet, déjà réduite
                <img className={styles.vignetteObjet} src={`/images/${o.imageId}?v=1`} alt="" />
              ) : null}
              <dt className={styles.nom}>{o.nom}</dt>
              {o.description ? <dd className={styles.phrase}>{o.description}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}
      {r.sorte === "feuille" ? (
        <ul className={styles.feuilleDAventure} data-morceau="insecable">
          {r.lignes.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/** Un personnage : son portrait s'il en a un, son nom tel qu'il s'écrit, ses autres noms, sa description entière. */
function Personnage({ p, grand }: { p: PersonnageDeFiche; grand?: boolean }) {
  return (
    <div className={`${grand ? styles.unHeros : styles.element}${p.portraitId ? ` ${styles.element_image}` : ""}`} data-morceau="insecable">
      {p.portraitId ? (
        // eslint-disable-next-line @next/next/no-img-element -- le portrait de référence, image du projet
        <img className={grand ? styles.portrait : styles.vignette} src={`/images/${p.portraitId}${grand ? "" : "?v=1"}`} alt="" />
      ) : null}
      <div className={styles.identite}>
        <p className={grand ? styles.nomHeros : styles.nom}>{p.nom}</p>
        {p.autresNoms.length ? <p className={styles.aussi}>On l’appelle aussi : {p.autresNoms.join(", ")}</p> : null}
        {p.description ? <p className={grand ? styles.texte : styles.phrase}>{p.description}</p> : null}
      </div>
    </div>
  );
}
