/**
 * La présentation de l'aperçu (page agrandie ou double page), gardée par le navigateur pour chaque
 * présentation par défaut. Le serveur ne la connaît pas : le premier rendu, celui de l'hydratation,
 * prend la présentation par défaut, puis React passe à celle qu'on avait choisie, sans désaccord
 * entre le serveur et le navigateur.
 */

export type ModeApercu = "agrandie" | "double";
const CLE_MODE = "apercu-mode";
const abonnes = new Set<() => void>();
// Le choix de cette visite, qui tient même sans stockage du navigateur (navigation privée, stockage bloqué)
const pourLaVisite = new Map<ModeApercu, ModeApercu>();

export const abonnerAuMode = (prevenir: () => void) => {
  abonnes.add(prevenir);
  return () => void abonnes.delete(prevenir);
};

export const modeGarde = (parDefaut: ModeApercu): ModeApercu => {
  const choisi = pourLaVisite.get(parDefaut);
  if (choisi) return choisi;
  try {
    const garde = window.localStorage.getItem(`${CLE_MODE}-${parDefaut}`);
    return garde === "agrandie" || garde === "double" ? garde : parDefaut;
  } catch {
    return parDefaut;
  }
};

export const garderLeMode = (parDefaut: ModeApercu, mode: ModeApercu) => {
  pourLaVisite.set(parDefaut, mode);
  try {
    window.localStorage.setItem(`${CLE_MODE}-${parDefaut}`, mode);
  } catch {
    // le choix vaut pour cette visite seulement
  }
  for (const prevenir of abonnes) prevenir();
};
