import { chromium, type Browser } from "playwright-core";

/**
 * Le Chromium qui compose le livre (ADR 0003). Chez Vercel, celui de `@sparticuz/chromium`,
 * décompressé dans l'espace temporaire au premier appel ; ailleurs, celui que Playwright a
 * installé sur la machine. L'aperçu et les PDF sortent toujours du même : la fidélité de
 * F11-AC30 se joue à l'intérieur d'un même hébergement.
 */

export const surVercel = (): boolean => Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.CHROMIUM_SERVEUR);

export async function lancerChromium(): Promise<Browser> {
  if (surVercel()) {
    const serveur = (await import("@sparticuz/chromium")).default;
    serveur.setGraphicsMode = false;
    return chromium.launch({ args: serveur.args, executablePath: await serveur.executablePath(), headless: true });
  }
  return chromium.launch({ headless: true });
}

/** La version du Chromium lancé : dite par la page de diagnostic et les mesures. */
export const versionDe = (navigateur: Browser): string => navigateur.version();
