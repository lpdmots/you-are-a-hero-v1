import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Aucun essai n'appelle un vrai fournisseur d'IA : la réponse simulée, sans clé (étape 8)
process.env.IA_SIMULEE = "1";
delete process.env.ANTHROPIC_API_KEY;
delete process.env.OPENAI_API_KEY;

const alias = { "@": resolve(import.meta.dirname, "src"), "server-only": resolve(import.meta.dirname, "tests/vide.ts") };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: { name: "unitaires", include: ["tests/unitaires/**/*.test.ts"], environment: "node" },
      },
      {
        resolve: { alias },
        test: {
          name: "base",
          include: ["tests/base/**/*.test.ts"],
          environment: "node",
          setupFiles: ["tests/base/preparation.ts"],
          fileParallelism: false,
          testTimeout: 20000,
          hookTimeout: 30000,
        },
      },
      {
        // Le livre composé par Chromium (ADR 0003) : sans base, mais avec un navigateur
        resolve: { alias },
        test: { name: "livre", include: ["tests/livre/**/*.test.ts"], environment: "node", fileParallelism: false, testTimeout: 120000, hookTimeout: 120000 },
      },
    ],
  },
});
