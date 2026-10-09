import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

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
    ],
  },
});
