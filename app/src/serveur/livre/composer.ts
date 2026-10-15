import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { corpsDuLivre, html, type LivreACompose } from "@/domaine/composition";
import { lancerChromium, versionDe } from "./chromium";
import { SCRIPT_DE_LA_PAGE, type OptionsDeLaPage, type RapportDeLaPage } from "./dans-la-page";
import { DOSSIER_PAGEDJS, feuilleDesPages, feuilleDesPolices, feuilleDuDocument, fichierDePolice } from "./styles";

/**
 * Composer le livre : le document HTML est servi à Chromium par une adresse fictive, que la
 * page du serveur intercepte — le livre, ses feuilles de style, ses polices, Paged.js et les
 * images, lues dans le stockage au moment où Chromium les demande. Rien n'est lu sur le réseau.
 */

const ORIGINE = "https://livre.invalid";

export type ImageLue = { octets: Buffer; type: string };

export type Composition = {
  pdf: Buffer;
  rapport: RapportDeLaPage;
  chromium: string;
  durees: { lancement: number; miseEnPage: number; impression: number; total: number };
  /** Images de pages demandées, pour les essais : rang dans le document → PNG */
  images: Record<number, Buffer>;
};

let pagedjs: Promise<string> | null = null;

export async function composer(
  livre: LivreACompose,
  o: { travail: boolean; etatDu: string; lireImage: (id: string) => Promise<ImageLue | null>; photographier?: number[] },
): Promise<Composition> {
  const t0 = performance.now();
  pagedjs ??= readFile(join(DOSSIER_PAGEDJS, "paged.js"), "utf8");
  const [script, polices] = await Promise.all([pagedjs, feuilleDesPolices()]);
  const corps = corpsDuLivre(livre, { travail: o.travail, etatDu: o.etatDu, image: (id) => `/images/${id}` });
  const document = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${html(livre.titre)}</title>
<style>${polices}</style><link rel="stylesheet" href="/document.css"><script src="/paged.js"></script></head>
<body><div id="livre"></div><template id="contenu">${corps}</template></body></html>`;

  const navigateur = await lancerChromium();
  try {
    const page = await navigateur.newPage();
    const erreurs: string[] = [];
    page.on("pageerror", (e) => erreurs.push(String(e)));
    await page.route(`${ORIGINE}/**`, async (route) => {
      const chemin = new URL(route.request().url()).pathname;
      const repondre = (body: string | Buffer, contentType: string) => route.fulfill({ status: 200, body, contentType });
      if (chemin === "/") return repondre(document, "text/html; charset=utf-8");
      if (chemin === "/document.css") return repondre(feuilleDuDocument(livre.reglages), "text/css");
      if (chemin === "/livre.css") return repondre(feuilleDesPages(livre.reglages), "text/css");
      if (chemin === "/paged.js") return repondre(script, "text/javascript");
      const police = chemin.match(/^\/polices\/([a-z]+)\/([a-z0-9-]+\.woff2)$/);
      if (police) {
        const octets = await fichierDePolice(police[1], police[2]);
        return octets ? repondre(octets, "font/woff2") : route.fulfill({ status: 404 });
      }
      const image = chemin.match(/^\/images\/([0-9a-f-]{36})$/);
      if (image && image[1] in livre.images) {
        const lue = await o.lireImage(image[1]).catch(() => null);
        return lue ? repondre(lue.octets, lue.type) : route.fulfill({ status: 404 });
      }
      return route.fulfill({ status: 404 });
    });
    const tLance = performance.now();
    await page.goto(`${ORIGINE}/`);
    const options: OptionsDeLaPage = {
      travail: o.travail, etatDu: o.etatDu, aChoix: livre.aChoix, titre: livre.titre, marges: livre.reglages.marges, basDePage: livre.reglages.basDePage,
    };
    const rapport = (await page.evaluate(`(${SCRIPT_DE_LA_PAGE})(${JSON.stringify(options)})`)) as RapportDeLaPage;
    if (erreurs.length) throw new Error(`Mise en page échouée : ${erreurs.join(" ; ")}`);
    const tMisEnPage = performance.now();
    const images: Record<number, Buffer> = {};
    for (const rang of o.photographier ?? []) {
      const feuille = page.locator(".pagedjs_page").nth(rang);
      if (await feuille.count()) images[rang] = await feuille.screenshot();
    }
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    const tFin = performance.now();
    return {
      pdf, rapport, chromium: versionDe(navigateur), images,
      durees: { lancement: Math.round(tLance - t0), miseEnPage: Math.round(tMisEnPage - tLance), impression: Math.round(tFin - tMisEnPage), total: Math.round(tFin - t0) },
    };
  } finally {
    await navigateur.close();
  }
}
