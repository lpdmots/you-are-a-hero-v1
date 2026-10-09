"use server";

/**
 * Un incident survenu à l'écran est noté dans le journal du serveur, pour pouvoir le
 * retrouver : l'écran, lui, ne montre jamais ce détail. Rien d'autre n'est gardé.
 */
export async function noterIncident(chemin: string, message: string, digest?: string): Promise<void> {
  const court = (texte: unknown, n: number): string => String(texte ?? "").replace(/\s+/g, " ").slice(0, n);
  console.error(`[incident] ${court(chemin, 120)} — ${court(message, 400)}${digest ? ` — ${court(digest, 40)}` : ""}`);
}
