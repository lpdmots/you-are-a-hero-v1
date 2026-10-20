"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type CSSProperties } from "react";
import { enregistrerNomAffiche, reglerAidesIa } from "@/app/(adulte)/actions-compte";
import type { ReglagesIa } from "@/domaine/aides-ia";
import { seDeconnecter } from "@/app/entree/actions";
import { BoutonEnvoi } from "./Attente";
import { Logo } from "./Logo";
import { Panneau, PiedFermer } from "./Panneau";
import { useProjetCourant } from "./ProjetCourant";
import { ReglagesAidesIa } from "./ReglagesAidesIa";
import styles from "./BarreAdulte.module.css";

type Props = {
  nomAffiche: string | null;
  courriel: string | null;
  reglagesIa: ReglagesIa;
  /** Le solde d'étoiles (F14-AC07) ; null pour le compte du porteur */
  etoiles: number | null;
  /** « Recharger · 5 € pour 100 ✦ », quand on peut acheter des étoiles ; sinon rien (F14-AC19) */
  recharge?: string | null;
};

const signe = (nom: string): string =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0].toLocaleUpperCase("fr"))
    .join("");

/**
 * Barre du haut de l'adulte : le nom du dernier projet ouvert, qui y ramène de
 * partout, puis « Mes projets » et « Mes classes ». Son nom ouvre « Mon compte ».
 */
export function BarreAdulte({ nomAffiche, courriel, reglagesIa, etoiles, recharge = null }: Props) {
  const projet = useProjetCourant();
  const chemin = usePathname();
  const routeur = useRouter();
  const [compte, setCompte] = useState(false);
  const [nom, setNom] = useState(nomAffiche ?? "");
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, lancer] = useTransition();
  // Montrés aussitôt, gardés ensuite : un réglage ne doit pas attendre le serveur pour changer
  const [ia, setIa] = useState(reglagesIa);
  // « Régler », sous une mention des aides (« ✦ Image créée à l'ajout ») : « Mon compte » s'ouvre sur le réglage
  useEffect(() => {
    const ouvrir = () => {
      setEnregistre(false);
      setCompte(true);
      requestAnimationFrame(() => document.getElementById("reglage-image-ajout")?.scrollIntoView({ block: "center" }));
    };
    window.addEventListener("ouvrir-mon-compte", ouvrir);
    return () => window.removeEventListener("ouvrir-mon-compte", ouvrir);
  }, []);

  const reglerIa = (changes: Partial<ReglagesIa>) => {
    setIa((r) => ({ ...r, ...changes }));
    setEnregistre(false);
    lancer(async () => {
      await reglerAidesIa(changes);
      setEnregistre(true);
      routeur.refresh();
    });
  };

  const reprise = projet ? `/projet/${projet.id}/${projet.onglet}` : "/projets";
  const ici = (debut: string) => (chemin.startsWith(debut) ? "page" : undefined);
  const visible = nomAffiche?.trim() || courriel || "Mon compte";

  const garderNom = () => {
    if (nom.trim() === (nomAffiche ?? "").trim()) return;
    lancer(async () => {
      await enregistrerNomAffiche(nom);
      setEnregistre(true);
      routeur.refresh();
    });
  };

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
        <button type="button" className={styles.identite} onClick={() => { setEnregistre(false); setCompte(true); }} aria-haspopup="dialog">
          <span className="gommette" style={{ "--g": "#4A5157" } as CSSProperties} aria-hidden="true">
            {signe(visible)}
          </span>
          <span className={styles.nom}>{visible}</span>
        </button>
      </div>

      {compte ? (
        <Panneau
          titre="Mon compte"
          sous={courriel ?? undefined}
          onFermer={() => setCompte(false)}
          pied={<PiedFermer enregistre={enregistre} enCours={enCours} onFermer={() => setCompte(false)} />}
        >
          <section>
            <h3>
              <label htmlFor="compte-nom">Nom affiché aux élèves</label>
            </h3>
            <input
              className="pchamp"
              id="compte-nom"
              type="text"
              value={nom}
              maxLength={60}
              placeholder="Mme Laurent"
              onChange={(e) => { setNom(e.target.value); setEnregistre(false); }}
              onBlur={garderNom}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              data-focus
            />
            <p>
              Les élèves lisent ce nom : « Demande à {nom.trim() || "ton enseignant(e)"}. » Sans nom, ils lisent « ton
              enseignant(e) ».
            </p>
          </section>
          <ReglagesAidesIa reglages={ia} onChanger={reglerIa} etoiles={etoiles} recharge={recharge} />
          <section>
            <form action={seDeconnecter}>
              <BoutonEnvoi className="btn">Se déconnecter</BoutonEnvoi>
            </form>
          </section>
        </Panneau>
      ) : null}
    </header>
  );
}
