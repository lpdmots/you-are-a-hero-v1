import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { Icone } from "@/composants/Icone";
import { BoutonTuto } from "@/composants/Tutos";
import {
  ADRESSE_DE_L_AUTEUR_SEUL,
  AIDES_DE_L_IA,
  CHAPEAU_DE_L_AUTEUR_SEUL,
  DESCRIPTION_DE_L_AUTEUR_SEUL,
  etoilesPourLAuteurSeul,
  GRAND_TITRE_DE_L_AUTEUR_SEUL,
  HISTOIRE_CLASSIQUE_SEUL,
  POUR_COMMENCER,
  prixPourLAuteurSeul,
  TEMPS_DE_L_AUTEUR_SEUL,
  TITRE_DE_L_AUTEUR_SEUL,
  TITRE_DE_L_IA,
  type ImageDeLAuteurSeul,
} from "@/domaine/auteur-seul";
import { ADRESSE_DU_GUIDE } from "@/domaine/pages-publiques";
import { VIDEO_IA } from "@/domaine/tutos";
import { offreActuelle } from "@/serveur/offre";
import s from "./auteur-seul.module.css";

export const metadata: Metadata = {
  // Le titre arrêté, sans le nom du site après lui, comme le guide et les ressources
  title: { absolute: TITRE_DE_L_AUTEUR_SEUL },
  description: DESCRIPTION_DE_L_AUTEUR_SEUL,
  alternates: { canonical: ADRESSE_DE_L_AUTEUR_SEUL },
  openGraph: { type: "website", title: TITRE_DE_L_AUTEUR_SEUL, description: DESCRIPTION_DE_L_AUTEUR_SEUL, url: ADRESSE_DE_L_AUTEUR_SEUL },
};

/** Une capture posée sur la table ; sur téléphone, sa version recadrée, seule téléchargée */
function Capture({ image }: { image: ImageDeLAuteurSeul }) {
  const commun = { alt: image.alt, sizes: "(max-width: 900px) 100vw, 720px" };
  const { props } = getImageProps({ ...commun, src: image.src, width: image.largeur, height: image.hauteur });
  const telephone = image.telephone ? getImageProps({ ...commun, sizes: "100vw", src: image.telephone.src, width: image.telephone.largeur, height: image.telephone.hauteur }).props : null;
  return (
    <picture className={s.capture}>
      {telephone ? <source media="(max-width: 640px)" srcSet={telephone.srcSet} sizes={telephone.sizes} width={telephone.width} height={telephone.height} /> : null}
      {/* L'image et ses tailles préparées par Next (getImageProps), le texte de remplacement compris */}
      <img {...props} alt={image.alt} loading="lazy" decoding="async" />
    </picture>
  );
}

/**
 * La page de l'auteur seul (F14, « Pages publiques pour les deux sortes de récit », cinquième part, F14-AC76) :
 * la sœur discrète des ressources, pour un public plus âgé (sans le dragon, retiré le 24 novembre 2026). Une page
 * de titre sur papier avec une gravure du livre d'exemple, trois temps du plan au livre, chacun avec sa capture posée sur la table, l'IA en feuille
 * canard pâle, une fiche « Pour commencer », puis la feuille de fin et le seul bouton plein. Limitée au livre dont
 * vous êtes le héros ; jamais mise en avant ailleurs.
 */
export default async function AuteurSeul() {
  const offre = await offreActuelle();
  return (
    <main className={s.page}>
      <header className={s.titre}>
        <div>
          <h1>{GRAND_TITRE_DE_L_AUTEUR_SEUL}</h1>
          <p className={s.chapeau}>{CHAPEAU_DE_L_AUTEUR_SEUL}</p>
          {/* Pour qui est déjà convaincu : sur téléphone, la feuille de fin est à quatre écrans (relecture du 24 novembre 2026) */}
          <p className={s.commencer}>
            <Link className="btn btn--primaire" href="/entree/inscription">
              Créer un compte
            </Link>
          </p>
        </div>
        {/* Une gravure du livre d'exemple, posée comme une épreuve : ce que deviennent les images d'un livre pour adultes */}
        <Image className={s.gravure} src={`${ADRESSE_DE_L_AUTEUR_SEUL}/pont-promenade.webp`} alt="Gravure à l’encre : le pont promenade d’un paquebot, la nuit, dans le brouillard, un pardessus abandonné sur une chaise longue" width={840} height={560} sizes="(max-width: 720px) 100vw, 320px" preload />
      </header>

      <ol className={s.temps}>
        {TEMPS_DE_L_AUTEUR_SEUL.map((t, i) => (
          <li key={t.titre} className={s.un}>
            <div className={s.texte}>
              <h2>
                <span className={s.numero} aria-hidden="true">
                  <span data-numero={i + 1} />
                </span>
                <span>{t.titre}</span>
              </h2>
              <p>{t.phrase}</p>
            </div>
            <Capture image={t.image} />
          </li>
        ))}
      </ol>

      {/* L'IA un peu en avant : une feuille canard pâle, le signe des étincelles, jamais un bouton plein */}
      <section className={s.ia} aria-labelledby="ia-t">
        <h2 id="ia-t">
          <Icone nom="ia" className={s.iaSigne} />
          {TITRE_DE_L_IA}
        </h2>
        <dl className={s.aides}>
          {AIDES_DE_L_IA.map((a) => (
            <div key={a.nom}>
              <dt>{a.nom}</dt>
              <dd>{a.phrase}</dd>
            </div>
          ))}
        </dl>
        <p className={s.etoiles}>{etoilesPourLAuteurSeul(offre)}</p>
        {VIDEO_IA.pose ? (
          // Un bloc, pas un paragraphe : le lecteur de la vidéo s'ouvre dans une boîte de dialogue à côté du lien
          <div className={s.video}>
            <BoutonTuto tuto={VIDEO_IA} forme="lien" />
          </div>
        ) : null}
      </section>

      <aside className={s.fiche} aria-labelledby="commencer-t">
        <h2 id="commencer-t">Pour commencer</h2>
        <p>{POUR_COMMENCER}</p>
        <p>{HISTOIRE_CLASSIQUE_SEUL}</p>
        <p>{prixPourLAuteurSeul(offre)}</p>
        <p className={s.classe}>
          Vous écrivez avec une classe&nbsp;? <Link href="/">L’accueil</Link> présente le projet en classe.
        </p>
      </aside>

      <footer className={s.fin} aria-labelledby="fin-t">
        <h2 id="fin-t">À vous d’écrire</h2>
        <p className={s.finSuite}>
          <Link className="btn btn--primaire btn--grand" href="/entree/inscription">
            Créer un compte
          </Link>
          <Link href={ADRESSE_DU_GUIDE}>Lire le guide</Link>
          <Link href="/bibliotheque">Feuilleter la bibliothèque</Link>
        </p>
      </footer>
    </main>
  );
}
