import type { Metadata } from "next";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import {
  ADRESSE_DE_L_AUTEUR_SEUL,
  CHAPEAU_DE_L_AUTEUR_SEUL,
  DESCRIPTION_DE_L_AUTEUR_SEUL,
  GRAND_TITRE_DE_L_AUTEUR_SEUL,
  prixPourLAuteurSeul,
  SANS_CLASSE,
  TEMPS_DE_L_AUTEUR_SEUL,
  TITRE_DE_L_AUTEUR_SEUL,
  type ImageDeLAuteurSeul,
} from "@/domaine/auteur-seul";
import { ADRESSE_DU_GUIDE } from "@/domaine/pages-publiques";
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
 * la sœur discrète des ressources. Une page de titre sur papier où Bouquin tient son livre, trois temps du plan au
 * livre, chacun avec sa capture posée sur la table, une fiche « Sans classe », puis la feuille de fin et le seul
 * bouton plein. Limitée au livre dont vous êtes le héros ; jamais mise en avant ailleurs.
 */
export default async function AuteurSeul() {
  const offre = await offreActuelle();
  return (
    <main className={s.page}>
      <header className={s.titre}>
        <div>
          <h1>{GRAND_TITRE_DE_L_AUTEUR_SEUL}</h1>
          <p className={s.chapeau}>{CHAPEAU_DE_L_AUTEUR_SEUL}</p>
        </div>
        <Image className={s.dragon} src="/accueil/dragon-grand-livre.webp" alt="Bouquin, le dragon du site, serre contre lui un grand livre" width={500} height={620} sizes="(max-width: 720px) 84px, 190px" loading="eager" />
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

      <aside className={s.fiche} aria-labelledby="sans-classe-t">
        <h2 id="sans-classe-t">Sans classe</h2>
        <p>{SANS_CLASSE}</p>
        <p>{prixPourLAuteurSeul(offre)}</p>
        <p className={s.classe}>
          Vous écrivez avec une classe&nbsp;? <Link href="/">L’accueil</Link> présente le projet en classe.
        </p>
      </aside>

      <footer className={s.fin} aria-labelledby="fin-t">
        <div>
          <h2 id="fin-t">À vous d’écrire</h2>
          <p className={s.finSuite}>
            <Link className="btn btn--primaire btn--grand" href="/entree/inscription">
              Créer un compte
            </Link>
            <Link href={ADRESSE_DU_GUIDE}>Lire le guide</Link>
            <Link href="/bibliotheque">Feuilleter la bibliothèque</Link>
          </p>
        </div>
        {/* Le dragon s'est endormi sur son livre, comme à la fin du guide et des ressources */}
        <Image className={s.dragonEndormi} src="/accueil/dragon-endormi.webp" alt="" width={720} height={559} sizes="(max-width: 720px) 140px, 190px" />
      </footer>
    </main>
  );
}
