"use client";

import { useState } from "react";
import { Agrandissable } from "@/composants/Agrandissable";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { useAidesIa } from "@/composants/AidesIa";
import { Icone } from "@/composants/Icone";
import { SuiviDesImages } from "@/composants/ImagesALAjout";
import { ImageRepere } from "@/composants/ImageRepere";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { exempleDuStyle, nomDeFichier, nomDuStyle, STYLE_AUTRE_MAX, STYLE_PAR_DEFAUT, STYLES, type Style } from "@/domaine/illustration";
import { adresseRepereEnGrand } from "@/domaine/visuels";
import { choisirRepere, reglerProjet } from "../../actions-recit";

type ProjetRegle = {
  id: string; titre: string; deClasse: boolean; lectureOuverte: boolean; miseEnFormeEleves: boolean;
  imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null;
  styleImages: Style; styleAutre: string; herosAbsent: boolean; consigneEcriture: string;
};

type Reglage = {
  titre?: string; lectureOuverte?: boolean; miseEnFormeEleves?: boolean; styleImages?: Style; styleAutre?: string; herosAbsent?: boolean; consigneEcriture?: string;
};

/**
 * Réglages du projet : son titre, son image de repérage, la lecture ouverte aux élèves et leur
 * mise en forme, le style des images et le héros absent des images (F06-AC48, F10.1, F04.1, F10.2).
 */
export function MenuProjet({ projet }: { projet: ProjetRegle }) {
  const [ouvert, setOuvert] = useState<"reglages" | "image" | null>(null);
  const [titre, setTitre] = useState(projet.titre);
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [style, setStyle] = useState<Style>(projet.styleImages);
  const [styleAutre, setStyleAutre] = useState(projet.styleAutre);
  const [ecriture, setEcriture] = useState(projet.consigneEcriture);
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
      {/* Les images en route du projet, suivies sur chaque onglet : la page se relit à leur arrivée */}
      <SuiviDesImages projetId={projet.id} />
      {/* Un bouton nommé plutôt qu'un menu à une seule commande : les réglages du projet (style des
          images, façon d'écrire pour l'IA…) se voient sans chercher (18 octobre 2026, remarque du porteur) */}
      <button
        type="button"
        className="btn btn--petit reglages-projet"
        aria-label="Réglages du projet"
        onClick={() => {
          setTitre(projet.titre);
          setStyle(projet.styleImages);
          setStyleAutre(projet.styleAutre);
          setEcriture(projet.consigneEcriture);
          setEnregistre(false);
          setOuvert("reglages");
        }}
      >
        <Icone nom="reglages" />
        Réglages
      </button>
      {ouvert === "reglages" ? (
        <Panneau titre="Réglages du projet" sous={projet.titre} onFermer={() => setOuvert(null)} pied={<PiedFermer enregistre={enregistre} enCours={enCours} onFermer={() => setOuvert(null)} />}>
          <section>
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
          </section>
          <section>
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
          {projet.deClasse ? (
            <section>
              <h3>Lecture des élèves</h3>
              <label className="inter">
                <input type="checkbox" role="switch" checked={projet.lectureOuverte} disabled={enCours} onChange={(e) => void regler({ lectureOuverte: e.target.checked })} />
                <span className="inter__piste" aria-hidden="true" />
                <span>Les élèves lisent toute l’histoire</span>
              </label>
              <p>
                {projet.lectureOuverte
                  ? "Chaque élève lit les scènes de tous les chapitres. Il n’écrit que dans les siens."
                  : "Tant que le livre n’est pas terminé, chaque élève lit les scènes de ses chapitres seulement, pour garder la surprise."}
              </p>
            </section>
          ) : null}
          {projet.deClasse ? (
            <section>
              <h3>Mise en forme des élèves</h3>
              <label className="inter">
                <input type="checkbox" role="switch" checked={projet.miseEnFormeEleves} disabled={enCours} onChange={(e) => void regler({ miseEnFormeEleves: e.target.checked })} />
                <span className="inter__piste" aria-hidden="true" />
                <span>Les élèves mettent en gras, en italique, soulignent</span>
              </label>
              <p>
                {projet.miseEnFormeEleves
                  ? "Les élèves ont les trois boutons dans leurs scènes."
                  : "Les élèves n’ont plus les trois boutons. Ce qui est déjà mis en forme le reste ; vous pouvez le retirer vous-même."}
              </p>
            </section>
          ) : null}
          {/* Une ligne pour les aides qui écrivent : « vous, au présent » (18 octobre 2026) */}
          {proposer ? (
            <section>
              <h3>
                <label htmlFor="projet-ecriture">Pour l’IA, notre façon d’écrire</label>
              </h3>
              <input
                className="pchamp"
                id="projet-ecriture"
                type="text"
                maxLength={300}
                value={ecriture}
                placeholder="Par exemple : vous, au présent, phrases courtes"
                onChange={(e) => {
                  setEcriture(e.target.value);
                  setEnregistre(false);
                }}
                onBlur={() => {
                  if (ecriture !== projet.consigneEcriture) void regler({ consigneEcriture: ecriture });
                }}
              />
              <p>Les aides qui écrivent ou réécrivent la suivent.</p>
            </section>
          ) : null}
          <section>
            <h3 id="projet-style">Style des images</h3>
            {/* Un exemple par style, le même sujet partout : on compare les techniques d'un coup d'œil */}
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
            <p>{style === "autre" ? "Décrivez une technique, jamais le nom d’un artiste. Reprise par toutes les images créées." : "Repris par toutes les images créées."}</p>
          </section>
          <section>
            <h3>Le héros dans les images</h3>
            <label className="inter">
              <input type="checkbox" role="switch" checked={projet.herosAbsent} disabled={enCours} onChange={(e) => void regler({ herosAbsent: e.target.checked })} />
              <span className="inter__piste" aria-hidden="true" />
              <span>Héros absent des images</span>
            </label>
            <p>
              {projet.herosAbsent
                ? "Seules ses mains peuvent paraître : il ne change pas d’une image à l’autre, et chaque lecteur peut s’y voir."
                : "Le héros est dessiné d’après sa carte et son portrait, dans la Préparation."}
            </p>
          </section>
        </Panneau>
      ) : null}
      {ouvert === "image" ? (
        <ChoisirImage projetId={projet.id} actuel={projet} pour="du projet" creer={{ sorte: "projet", id: projet.id }} onChoisir={choisirImage} onFermer={() => setOuvert("reglages")} />
      ) : null}
    </>
  );
}
