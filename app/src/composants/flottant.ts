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
    cote = "bottom-start", ecart = 6, fixe = false,
  }: {
    cote?: Placement; ecart?: number;
    /** Hors du cadre qui le contient : pour une liste ouverte dans un cadre qui coupe ce qui dépasse */
    fixe?: boolean;
  } = {},
): () => void {
  let retenu: Placement | null = null;
  return autoUpdate(repere, menu, () => {
    void computePosition(repere, menu, {
      placement: retenu ?? cote,
      strategy: fixe ? "fixed" : "absolute",
      middleware: [
        offset(ecart),
        ...(retenu ? [] : [flip({ padding: MARGES })]),
        shift({ padding: MARGES }),
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
  });
}
