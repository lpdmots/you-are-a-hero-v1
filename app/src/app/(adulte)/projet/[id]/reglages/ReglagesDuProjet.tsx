"use client";

import { useId, useState, useTransition } from "react";
import { Agrandissable } from "@/composants/Agrandissable";
import { Bulle } from "@/composants/Bulle";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { Dialogue } from "@/composants/Dialogue";
import { useAidesIa } from "@/composants/AidesIa";
import { Icone } from "@/composants/Icone";
import { DansLaTete } from "@/composants/DansLaTete";
import { ImageRepere } from "@/composants/ImageRepere";
import { LivreGratuit } from "@/composants/OffreDuPass";
import { AGES, NOMS_DES_AGES, type AgeDesLecteurs } from "@/domaine/aides-ia";
import type { Limites, Offre } from "@/domaine/offre";
import { exempleDuStyle, nomDeFichier, nomDuStyle, STYLE_AUTRE_MAX, STYLE_PAR_DEFAUT, STYLES, type Style } from "@/domaine/illustration";
import { adresseRepereEnGrand } from "@/domaine/visuels";
import { pluriel } from "@/domaine/texte";
import { ClasseDuProjet, type ClasseOfferte } from "../[onglet]/ClasseDuProjet";
import { choisirRepere, reglerProjet } from "../../actions-recit";
import { supprimerProjet } from "../../../projets/actions";

type ProjetRegle = {
  /** « Projet de classe · Récit à choix » : les deux choix de la création, qui ne se changent pas (F01-AC15) */
  mode: string;
  id: string; titre: string; deClasse: boolean; lectureOuverte: boolean; miseEnFormeEleves: boolean;
  imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null;
  styleImages: Style; styleAutre: string; herosAbsent: boolean; consigneEcriture: string; ageDesLecteurs: AgeDesLecteurs;
};

type Reglage = {
  titre?: string; lectureOuverte?: boolean; miseEnFormeEleves?: boolean; styleImages?: Style; styleAutre?: string; herosAbsent?: boolean; consigneEcriture?: string;
  ageDesLecteurs?: AgeDesLecteurs;
};

/**
 * « Réglages du projet », en page (F06.5, 8 novembre 2026 ; d'abord un panneau) : ses deux choix de
 * départ, son titre, son image de repérage, sa classe, la lecture ouverte aux élèves et leur mise en
 * forme, l'IA, le style des images et le héros absent des images (F06-AC48, F10.1, F04.1, F10.2) ;
 * au pied, la suppression. Chaque changement s'enregistre aussitôt.
 */
export function ReglagesDuProjet({
  projet,
  classe,
  livre = null,
  avecPass = false,
}: {
  projet: ProjetRegle;
  /** La classe d'un projet de classe, qui se change ici tant qu'aucun chapitre n'est attribué (F01-AC24, F06-AC102) */
  classe: { actuelle: { id: string; nom: string; eleves: number } | null; offertes: ClasseOfferte[]; attribue: boolean } | null;
  livre?: { offre: Offre; limites: Limites } | null;
  /** Le projet a son pass : la suppression dit qu'il part avec lui (F14-AC42) */
  avecPass?: boolean;
}) {
  const id = useId();
  // Ce qui s'ouvre par-dessus la page : le choix d'une image, de la classe, la suppression
  const [ouvert, setOuvert] = useState<"image" | "supprimer" | "classe" | null>(null);
  // « Supprimer le projet » : le titre retapé, puis la suppression (F14-AC42)
  const [titreRetape, setTitreRetape] = useState("");
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const [suppressionEnCours, lancerSuppression] = useTransition();
  const [titre, setTitre] = useState(projet.titre);
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [style, setStyle] = useState<Style>(projet.styleImages);
  const [styleAutre, setStyleAutre] = useState(projet.styleAutre);
  const [ecriture, setEcriture] = useState(projet.consigneEcriture);
  const [age, setAge] = useState(projet.ageDesLecteurs);
  // Le style des images, replié sur celui choisi : la grille des neuf ne s'ouvre qu'à la demande
  const [stylesOuverts, setStylesOuverts] = useState(false);
  const { proposer } = useAidesIa();

  const regler = async (valeurs: Reglage) => {
    setErreur(null);
    setEnCours(true);
    const fait = await reglerProjet(projet.id, valeurs);
    setEnCours(false);
    if (fait.ok) setEnregistre(true);
    else setErreur(fait.erreur);
  };

  const choisirImage = async (choix: ChoixImage): Promise<string | null> => {
    if ("locale" in choix) return "Cette image n’a pas pu être importée.";
    const fait = await choisirRepere("projet", projet.id, choix);
    return fait.ok ? null : fait.erreur;
  };

  return (
    <>
      {/* L'enregistrement, à droite du titre de la page : « Enregistré » après un changement */}
      <DansLaTete>
        {enCours ? (
          <p className="enregistre enregistre--attente" role="status">
            Enregistrement…
          </p>
        ) : enregistre ? (
          <p className="enregistre" role="status">
            <Icone nom="coche" />
            Enregistré
          </p>
        ) : null}
      </DansLaTete>
      <div className="reglages-projet">
        {/* Le projet lui-même : ses deux choix de départ, son titre et son image, puis son pass quand la vente est ouverte.
            Les deux choix se lisaient sous le titre, dans l'en-tête du projet (F06.5, 8 novembre 2026) */}
        <section className="reglages-projet__feuille" aria-labelledby={`${id}-projet`}>
          <h2 id={`${id}-projet`}>Le projet</h2>
          <p className="reg-mode">{projet.mode}</p>
          <h3>
            <label htmlFor="projet-titre">Titre</label>
          </h3>
          <input
            className="pchamp"
            id="projet-titre"
            type="text"
            value={titre}
            maxLength={120}
            onChange={(e) => {
              setTitre(e.target.value);
              setEnregistre(false);
            }}
            onBlur={() => {
              if (titre.trim() && titre.trim() !== projet.titre) void regler({ titre });
            }}
          />
          {erreur ? (
            <p className="erreur" role="alert">
              {erreur}
            </p>
          ) : null}
          <h3>Image</h3>
          <div className="reg-image">
            <Agrandissable className="reg-image__vue" src={adresseRepereEnGrand(projet, projet.id)} nom={`l’image de « ${projet.titre} »`} fichier={nomDeFichier("Image de", projet.titre)}>
              <ImageRepere repere={projet} graine={projet.id} />
            </Agrandissable>
            <span className="reg-image__gestes">
              <button type="button" className="btn btn--petit" onClick={() => setOuvert("image")}>
                Choisir une image
              </button>
              {projet.imageId ? (
                <a className="lien cx-discret" href={`/images/${projet.imageId}`} download={nomDeFichier("Image de", projet.titre)}>
                  <Icone nom="telecharger" />
                  Télécharger
                </a>
              ) : null}
            </span>
          </div>
        </section>
        {/* La classe du projet, choisie ou changée tant qu'aucun chapitre n'est attribué (F01-AC24, F06-AC102) */}
        {classe ? (
          <section className="reglages-projet__feuille" aria-labelledby={`${id}-classe`}>
            <h2 id={`${id}-classe`}>Classe</h2>
            <span className="reg-classe">
              <span>
                {classe.actuelle
                  ? `${classe.actuelle.nom} · ${classe.actuelle.eleves ? `${classe.actuelle.eleves} élève${pluriel(classe.actuelle.eleves)}` : "aucun élève inscrit"}`
                  : "Sans classe"}
              </span>
              {classe.attribue ? null : (
                <button type="button" className="btn btn--petit" onClick={() => setOuvert("classe")}>
                  {classe.actuelle ? "Changer de classe" : "Choisir une classe"}
                </button>
              )}
            </span>
            {classe.attribue ? <p className="reg-note">Un chapitre est attribué : la classe ne change plus.</p> : null}
          </section>
        ) : null}
        {/* Le livre gratuit et son pass, quand « Livre payant » est allumé (F14) */}
        {livre ? <LivreGratuit projetId={projet.id} titre={projet.titre} offre={livre.offre} limites={livre.limites} /> : null}

        {/* Les élèves : ce qu'ils lisent et leur mise en forme ; l'explication dans un « i » (21 octobre 2026) */}
        {projet.deClasse ? (
          <section className="reglages-projet__feuille" aria-labelledby={`${id}-eleves`}>
            <h2 id={`${id}-eleves`}>Les élèves</h2>
            <span className="reg-ligne">
              <label className="inter">
                <input type="checkbox" role="switch" checked={projet.lectureOuverte} disabled={enCours} onChange={(e) => void regler({ lectureOuverte: e.target.checked })} />
                <span className="inter__piste" aria-hidden="true" />
                <span>Les élèves lisent toute l’histoire</span>
              </label>
              <Bulle question="Que lisent les élèves ?">
                Allumé, chaque élève lit les scènes de tous les chapitres, et n’écrit que dans les siens. Éteint, tant que le livre n’est
                pas terminé, il ne lit que les scènes de ses chapitres, pour garder la surprise.
              </Bulle>
            </span>
            <span className="reg-ligne">
              <label className="inter">
                <input type="checkbox" role="switch" checked={projet.miseEnFormeEleves} disabled={enCours} onChange={(e) => void regler({ miseEnFormeEleves: e.target.checked })} />
                <span className="inter__piste" aria-hidden="true" />
                <span>Les élèves mettent en gras, en italique, soulignent</span>
              </label>
              <Bulle question="Et si on l’éteint ?">
                Les élèves n’ont plus les trois boutons dans leurs scènes. Ce qui est déjà mis en forme le reste ; vous pouvez le retirer
                vous-même.
              </Bulle>
            </span>
          </section>
        ) : null}

        {/* Pour l'IA : le public des aides et la façon d'écrire du livre (F13-AC28, AC29) */}
        {proposer ? (
          <section className="reglages-projet__feuille" aria-labelledby={`${id}-ia`}>
            <h2 id={`${id}-ia`}>Pour l’IA</h2>
            <span className="reg-ligne">
              <span className="reg-nom" id="projet-age">
                Âge des lecteurs
              </span>
              <Bulle question="À quoi sert l’âge ?">
                L’IA écrit et corrige pour des lecteurs de cet âge.
                {projet.deClasse ? " C’est aussi l’âge des élèves qui écrivent." : ""}
              </Bulle>
            </span>
            <div className="bascule" role="group" aria-labelledby="projet-age">
              {AGES.map((a) => (
                <button
                  key={a}
                  type="button"
                  aria-pressed={age === a}
                  aria-label={NOMS_DES_AGES[a]}
                  disabled={enCours}
                  onClick={() => {
                    setAge(a);
                    void regler({ ageDesLecteurs: a });
                  }}
                >
                  {a === "adultes" ? "Adultes" : a.replace("-", "–")}
                </button>
              ))}
            </div>
            <span className="reg-ligne reg-ligne--espace">
              <label className="reg-nom" htmlFor="projet-ecriture">
                Notre façon d’écrire
              </label>
              <Bulle question="À quoi sert cette ligne ?">
                Les aides qui écrivent ou réécrivent la suivent, avant tout le reste. Par exemple : « vous, au présent, phrases courtes ».
              </Bulle>
            </span>
            <input
              className="pchamp"
              id="projet-ecriture"
              type="text"
              aria-label="Pour l’IA, notre façon d’écrire"
              maxLength={300}
              value={ecriture}
              placeholder="vous, au présent, phrases courtes"
              onChange={(e) => {
                setEcriture(e.target.value);
                setEnregistre(false);
              }}
              onBlur={() => {
                if (ecriture !== projet.consigneEcriture) void regler({ consigneEcriture: ecriture });
              }}
            />
          </section>
        ) : null}

        {/* Les images créées : le style, replié sur celui choisi, et le héros (F10.2) */}
        <section className="reglages-projet__feuille" aria-labelledby={`${id}-images`}>
          <h2 id={`${id}-images`}>Images</h2>
          <span className="reg-ligne">
            <span className="reg-nom" id="projet-style">
              Style des images
            </span>
            <Bulle question="Que règle le style ?">
              Toutes les images que l’IA crée dans ce projet le reprennent. Pour « Autre », décrivez une technique, jamais le nom d’un
              artiste.
            </Bulle>
          </span>
          {stylesOuverts ? (
            <div className="styles-images" role="radiogroup" aria-labelledby="projet-style">
              {STYLES.map((s) => (
                <label key={s} className="style-image">
                  <input
                    type="radio"
                    name="projet-style"
                    value={s}
                    checked={style === s}
                    disabled={enCours}
                    onChange={() => {
                      setStyle(s);
                      void regler({ styleImages: s });
                      // « Autre » attend sa description : la grille reste ouverte
                      if (s !== "autre") setStylesOuverts(false);
                    }}
                  />
                  <span className="style-image__exemple" aria-hidden="true">
                    {s === "autre" ? (
                      <Icone nom="crayon" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- exemples livrés avec l'application
                      <img src={exempleDuStyle(s)} alt="" loading="lazy" onError={(e) => (e.currentTarget.hidden = true)} />
                    )}
                  </span>
                  {s !== "autre" ? (
                    // Voir l'exemple en grand, sans choisir le style : un bouton dans l'étiquette ne la coche pas
                    <Agrandissable className="style-image__loupe" src={exempleDuStyle(s, true)} nom={`l’exemple du style ${nomDuStyle(s)}`}>
                      <Icone nom="loupe" />
                    </Agrandissable>
                  ) : null}
                  <span className="style-image__nom">
                    {s === "autre" ? "Autre, à décrire" : nomDuStyle(s)}
                    {s === STYLE_PAR_DEFAUT ? <span className="style-image__defaut"> · par défaut</span> : null}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="reg-image reg-style">
              <span className="reg-style__exemple" aria-hidden="true">
                {style === "autre" ? (
                  <Icone nom="crayon" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- exemples livrés avec l'application
                  <img src={exempleDuStyle(style)} alt="" loading="lazy" onError={(e) => (e.currentTarget.hidden = true)} />
                )}
              </span>
              <span className="reg-image__gestes">
                <span className="reg-style__nom">{style === "autre" ? "Autre, à décrire" : nomDuStyle(style)}</span>
                <button type="button" className="btn btn--petit" onClick={() => setStylesOuverts(true)} aria-label="Changer le style des images">
                  Changer
                </button>
              </span>
            </div>
          )}
          {style === "autre" ? (
            <textarea
              className="pchamp reg-style-autre"
              aria-label="Le style, décrit par sa technique"
              rows={2}
              maxLength={STYLE_AUTRE_MAX}
              value={styleAutre}
              placeholder="Par exemple : linogravure en deux couleurs, traits épais"
              onChange={(e) => {
                setStyleAutre(e.target.value);
                setEnregistre(false);
              }}
              onBlur={() => {
                if (styleAutre !== projet.styleAutre) void regler({ styleAutre });
              }}
            />
          ) : null}
          <span className="reg-ligne reg-ligne--espace">
            <label className="inter">
              <input type="checkbox" role="switch" checked={projet.herosAbsent} disabled={enCours} onChange={(e) => void regler({ herosAbsent: e.target.checked })} />
              <span className="inter__piste" aria-hidden="true" />
              <span>Héros absent des images</span>
            </label>
            <Bulle question="Pourquoi le laisser absent ?">
              Seules ses mains peuvent paraître : il ne change pas d’une image à l’autre, et chaque lecteur peut s’y voir. Éteint, le héros
              est dessiné d’après sa carte et son portrait, dans la Préparation.
            </Bulle>
          </span>
        </section>

        {/* À l'écart, en dernier, hors des feuilles : supprimer le projet, après confirmation (F14-AC42) */}
        <p className="reglages-projet__supprimer">
          <button
            type="button"
            className="lien lien--danger"
            onClick={() => {
              setTitreRetape("");
              setErreurSuppression(null);
              setOuvert("supprimer");
            }}
          >
            Supprimer le projet
          </button>
        </p>
      </div>
      {ouvert === "supprimer" ? (
        <Dialogue
          titre="Supprimer ce projet ?"
          onFermer={() => setOuvert(null)}
          boutons={
            <button
              type="button"
              className="btn btn--danger"
              disabled={suppressionEnCours || !titreRetape.trim()}
              aria-busy={suppressionEnCours || undefined}
              onClick={() =>
                lancerSuppression(async () => {
                  const r = await supprimerProjet(projet.id, titreRetape);
                  if (r && !r.ok) setErreurSuppression(r.erreur);
                })
              }
            >
              Supprimer le projet
            </button>
          }
        >
          <ul className="dialogue__faits">
            <li>« {projet.titre} » est effacé aussitôt, sans retour : ses scènes, ses images et ses PDF.</li>
            <li>Son lien de lecture, s’il est partagé, ne mène plus à rien.</li>
            {avecPass ? <li>Son pass du livre disparaît avec lui.</li> : null}
            {projet.deClasse ? <li>La classe et ses élèves restent, dans « Mes classes ».</li> : null}
          </ul>
          <label className="champ champ--plein">
            <span>Pour confirmer, écrivez le titre du projet</span>
            <input type="text" value={titreRetape} autoComplete="off" onChange={(e) => setTitreRetape(e.target.value)} />
          </label>
          {erreurSuppression ? (
            <p className="erreur" role="alert">
              {erreurSuppression}
            </p>
          ) : null}
        </Dialogue>
      ) : null}
      {ouvert === "classe" && classe ? (
        <ClasseDuProjet
          projetId={projet.id}
          titre={projet.titre}
          classeId={classe.actuelle?.id ?? null}
          classes={classe.offertes}
          onFermer={() => setOuvert(null)}
        />
      ) : null}
      {ouvert === "image" ? (
        <ChoisirImage projetId={projet.id} actuel={projet} pour="du projet" creer={{ sorte: "projet", id: projet.id }} onChoisir={choisirImage} onFermer={() => setOuvert(null)} />
      ) : null}
    </>
  );
}
