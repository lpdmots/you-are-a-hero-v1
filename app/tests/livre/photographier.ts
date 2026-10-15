import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright-core";

/**
 * Les pages d'un PDF en images, pour les regarder pendant les essais : pdf.js les dessine dans
 * un Chromium, comme le fera l'aperçu dans le navigateur de l'adulte.
 */
export async function photographierPdf(pdf: Buffer | Uint8Array, rangs: number[], echelle = 1.5): Promise<Buffer[]> {
  const dossier = join(process.cwd(), "node_modules", "pdfjs-dist", "legacy", "build");
  const [lib, travailleur] = await Promise.all([readFile(join(dossier, "pdf.mjs"), "utf8"), readFile(join(dossier, "pdf.worker.mjs"), "utf8")]);
  const navigateur = await chromium.launch();
  try {
    const page = await navigateur.newPage();
    await page.route("https://pdf.invalid/**", (route) => {
      const chemin = new URL(route.request().url()).pathname;
      if (chemin === "/") return route.fulfill({ body: "<!doctype html><body style='margin:0;background:#888'></body>", contentType: "text/html" });
      if (chemin === "/pdf.mjs") return route.fulfill({ body: lib, contentType: "text/javascript" });
      if (chemin === "/pdf.worker.mjs") return route.fulfill({ body: travailleur, contentType: "text/javascript" });
      if (chemin === "/livre.pdf") return route.fulfill({ body: Buffer.from(pdf), contentType: "application/pdf" });
      return route.fulfill({ status: 404 });
    });
    await page.goto("https://pdf.invalid/");
    const images: Buffer[] = [];
    for (const rang of rangs) {
      // Un texte, et non une fonction : la compilation des essais réécrirait l'import
      await page.evaluate(`(async () => {
        const pdfjs = await import("/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
        const doc = await pdfjs.getDocument("/livre.pdf").promise;
        const p = await doc.getPage(${rang + 1});
        const vue = p.getViewport({ scale: ${echelle} });
        document.body.innerHTML = "";
        const toile = document.createElement("canvas");
        toile.width = vue.width;
        toile.height = vue.height;
        document.body.appendChild(toile);
        await p.render({ canvasContext: toile.getContext("2d"), viewport: vue, canvas: toile }).promise;
      })()`);
      images.push(await page.locator("canvas").screenshot());
    }
    return images;
  } finally {
    await navigateur.close();
  }
}
