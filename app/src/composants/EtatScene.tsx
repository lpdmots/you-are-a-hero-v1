"use client";

import { etatsProposes, ligneEtat, NOM_TAMPON, SIGNE_TAMPON, tamponDe, type Etat, type SorteDeScene } from "@/domaine/etats";
import { Icone } from "./Icone";
import { Menu } from "./Menu";
import { TamponScene } from "./TamponScene";

/**
 * L'état d'une scène, là où il se lit et se change : sur son tampon (F07.1, F11.1). La
 * liste donne chaque état que la scène peut prendre, dans l'ordre du travail, avec ce
 * qu'il change. La même commande sert dans la page de la scène et, plus tard, à côté de
 * l'aperçu du livre (F11-AC95).
 */
export function EtatScene({
  etat, vide, sorte, nom, onChoisir,
}: {
  etat: Etat;
  /** La scène n'a pas de texte : « En cours » se lit « Texte vide » (F06.5) */
  vide: boolean;
  sorte: SorteDeScene;
  /** « S016 », pour qui ne voit pas l'écran */
  nom: string;
  onChoisir: (etat: Etat) => void;
}) {
  const tampon = tamponDe(etat, vide);
  return (
    <Menu
      tampon={tampon}
      libelle={`État de ${nom} : ${NOM_TAMPON[tampon]}. Changer l’état`}
      bouton={
        <>
          <Icone nom={SIGNE_TAMPON[tampon]} />
          {NOM_TAMPON[tampon]}
          <Icone nom="chevron-bas" className="tampon__chevron" />
        </>
      }
    >
      {(fermer) => (
        <div role="group" aria-label="État de la scène">
          <p className="menu__titre">État de la scène</p>
          {etatsProposes(sorte, etat).map((e) => (
            <button
              key={e}
              type="button"
              className="etat__choix"
              aria-current={e === etat ? "true" : undefined}
              onClick={() => {
                fermer();
                onChoisir(e);
              }}
            >
              <TamponScene etat={e} vide={false} />
              <span>{ligneEtat(e, sorte, vide && e === "cours")}</span>
              {e === etat ? <Icone nom="coche" /> : <span />}
            </button>
          ))}
        </div>
      )}
    </Menu>
  );
}
