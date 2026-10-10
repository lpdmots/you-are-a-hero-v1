"use client";

import { useState } from "react";
import { ChoisirImage, type ChoixImage } from "@/composants/ChoisirImage";
import { ImageRepere } from "@/composants/ImageRepere";
import { Menu } from "@/composants/Menu";
import { Panneau, PiedFermer } from "@/composants/Panneau";
import { choisirRepere, reglerProjet } from "../../actions-recit";

type ProjetRegle = {
  id: string; titre: string; deClasse: boolean; lectureOuverte: boolean;
  imageId: string | null; visuelChoisi: string | null; visuelDefaut: string | null;
};

/** Réglages du projet : son titre, son image de repérage, la lecture ouverte aux élèves (F06-AC48, F10.1). */
export function MenuProjet({ projet }: { projet: ProjetRegle }) {
  const [ouvert, setOuvert] = useState<"reglages" | "image" | null>(null);
  const [titre, setTitre] = useState(projet.titre);
  const [enregistre, setEnregistre] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const regler = async (valeurs: { titre?: string; lectureOuverte?: boolean }) => {
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
        </Panneau>
      ) : null}
      {ouvert === "image" ? (
        <ChoisirImage projetId={projet.id} actuel={projet} pour="du projet" onChoisir={choisirImage} onFermer={() => setOuvert("reglages")} />
      ) : null}
    </>
  );
}
