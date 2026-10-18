"use client";

import { useState } from "react";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { useAidesIa } from "@/composants/AidesIa";
import { ImageRepere } from "@/composants/ImageRepere";
import { Menu } from "@/composants/Menu";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { nomDuStyle, STYLE_AUTRE_MAX, STYLE_PAR_DEFAUT, STYLES, type Style } from "@/domaine/illustration";
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
      <Menu libelle={`Autres commandes du projet ${projet.titre}`} discret>
        {(fermer) => (
          <button
            type="button"
            onClick={() => {
              fermer();
              setTitre(projet.titre);
              setStyle(projet.styleImages);
              setStyleAutre(projet.styleAutre);
              setEcriture(projet.consigneEcriture);
              setEnregistre(false);
              setOuvert("reglages");
            }}
          >
            Réglages du projet
          </button>
        )}
      </Menu>
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
              <span className="reg-image__vue">
                <ImageRepere repere={projet} graine={projet.id} />
              </span>
              <button type="button" className="btn btn--petit" onClick={() => setOuvert("image")}>
                Choisir une image
              </button>
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
            <h3>
              <label htmlFor="projet-style">Style des images</label>
            </h3>
            <select
              className="pchamp"
              id="projet-style"
              value={style}
              disabled={enCours}
              onChange={(e) => {
                const v = e.target.value as Style;
                setStyle(v);
                void regler({ styleImages: v });
              }}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s === "autre" ? "Autre, à décrire" : nomDuStyle(s)}
                  {s === STYLE_PAR_DEFAUT ? " (celui de l’application)" : ""}
                </option>
              ))}
            </select>
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
            <p>Repris par toutes les images créées. Décrivez une technique, jamais le nom d’un artiste.</p>
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
        <ChoisirImage projetId={projet.id} actuel={projet} pour="du projet" onChoisir={choisirImage} onFermer={() => setOuvert("reglages")} />
      ) : null}
    </>
  );
}
