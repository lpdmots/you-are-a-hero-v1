import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Chez Vercel, seules les routes /livre/** emportent les fichiers de Chromium et de Playwright
 * (next.config.ts) : une page qui les chargerait à l'ouverture tomberait (16 octobre 2026). On
 * suit ici les imports statiques des pages du projet : aucun ne doit mener à Chromium. Un import
 * dynamique (`await import(...)`), fait seulement pour composer, n'est pas suivi.
 */

const SRC = resolve(__dirname, "../../src");
const MOTEUR = /from\s+"(playwright-core|@sparticuz\/chromium)"/;

function resoudre(depuis: string, chemin: string): string | null {
  const base = chemin.startsWith("@/") ? resolve(SRC, chemin.slice(2)) : chemin.startsWith(".") ? resolve(dirname(depuis), chemin) : null;
  if (!base) return null;
  for (const essai of [base, `${base}.ts`, `${base}.tsx`, resolve(base, "index.ts"), resolve(base, "index.tsx")]) if (existsSync(essai) && !essai.endsWith("/")) {
    try {
      readFileSync(essai);
      return essai;
    } catch {
      // un dossier
    }
  }
  return null;
}

/** Les fichiers atteints par les imports statiques, et le chemin qui mène au moteur s'il y en a un. */
function cheminVersLeMoteur(depart: string): string[] | null {
  const vus = new Set<string>();
  const pile: string[][] = [[depart]];
  while (pile.length) {
    const chemin = pile.pop()!;
    const fichier = chemin[chemin.length - 1];
    if (vus.has(fichier)) continue;
    vus.add(fichier);
    const source = readFileSync(fichier, "utf8");
    if (MOTEUR.test(source)) return chemin;
    for (const m of source.matchAll(/^\s*import\s+(?!type\b)[^;]*?from\s+"([^"]+)"/gm)) {
      const suivant = resoudre(fichier, m[1]);
      if (suivant) pile.push([...chemin, suivant]);
    }
  }
  return null;
}

describe("Les pages du projet ne chargent pas Chromium", () => {
  for (const page of [
    "app/(adulte)/projet/[id]/[onglet]/page.tsx", "app/(adulte)/projet/[id]/scene/[scene]/page.tsx", "app/(adulte)/projet/actions-livre.ts",
    // Étape 7 : le partage, le lecteur du lien et ses images, la prévisualisation
    "app/(adulte)/projet/actions-partage.ts", "app/lire/[code]/page.tsx", "app/images/lire/[code]/[id]/route.ts", "app/previsualiser/[projet]/page.tsx",
  ]) {
    it(`${page} : aucun import statique ne mène à Playwright ni à Chromium`, () => {
      const chemin = cheminVersLeMoteur(resolve(SRC, page));
      expect(chemin?.map((f) => f.replace(`${SRC}/`, "")) ?? null).toBeNull();
    });
  }

  it("le test voit bien le moteur quand il est importé : la composition et la route de diagnostic y mènent", () => {
    expect(cheminVersLeMoteur(resolve(SRC, "serveur/livre/composer.ts"))).not.toBeNull();
    expect(cheminVersLeMoteur(resolve(SRC, "app/diagnostic/livre/route.ts"))).not.toBeNull();
  });
});
