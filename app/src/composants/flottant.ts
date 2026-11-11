import { autoUpdate, computePosition, flip, offset, shift, size, type Placement, type ReferenceElement } from "@floating-ui/dom";

/**
 * Poser un menu, une liste ou une bulle près de son repère (docs/design.md, « Menus qui
 * tiennent dans la fenêtre ») : du côté voulu s'il y a la place, sinon de l'autre ; jamais
 * hors de l'écran, et sans qu'il faille faire défiler la page pour le lire. Le côté retenu à
 * l'ouverture est gardé tant que le menu reste ouvert : il ne saute pas quand son contenu
 * change. Le placement est celui de Floating UI.
 */

/** La barre du haut reste à l'écran : un menu ne s'ouvre pas dessous. */
const MARGES = { top: 66, right: 8, bottom: 8, left: 8 };

export type Repere = ReferenceElement;

export function poser(
  repere: Repere,
  menu: HTMLElement,
  {
    cote = "bottom-start", ecart = 6, fixe = false, suivre = false, dans, autres,
  }: {
    cote?: Placement; ecart?: number;
    /** Hors du cadre qui le contient : pour une liste ouverte dans un cadre qui coupe ce qui dépasse */
    fixe?: boolean;
    /** Le repère se déplace sans que rien ne défile (une carte du schéma qu'on tire) : la bulle le suit à chaque image */
    suivre?: boolean;
    /** Tenir dans ce cadre plutôt que dans la fenêtre (la bulle du « + » reste sur le schéma, sans couvrir
        l'espace de travail ni la colonne) ; facultatif, les autres menus ne changent pas */
    dans?: Element | null;
    /** Les côtés à essayer, dans l'ordre, quand le côté voulu n'a pas la place */
    autres?: Placement[];
  } = {},
): () => void {
  let retenu: Placement | null = null;
  return autoUpdate(repere, menu, () => {
    void computePosition(repere, menu, {
      placement: retenu ?? cote,
      strategy: fixe ? "fixed" : "absolute",
      middleware: [
        offset(ecart),
        ...(retenu ? [] : [flip({ padding: MARGES, ...(dans ? { boundary: dans } : {}), ...(autres ? { fallbackPlacements: autres } : {}) })]),
        shift({ padding: MARGES, ...(dans ? { boundary: dans } : {}) }),
        // Ni dessus ni dessous n'ont la place : la liste défile en elle-même, pas la page
        size({
          padding: MARGES,
          apply({ availableHeight, elements }) {
            elements.floating.style.maxHeight = `${Math.max(140, Math.floor(availableHeight))}px`;
          },
        }),
      ],
    }).then(({ x, y, placement }) => {
      retenu = placement;
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
      menu.dataset.cote = placement.split("-")[0];
    });
  }, { animationFrame: suivre });
}
