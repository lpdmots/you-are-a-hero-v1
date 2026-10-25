import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/**
 * Captures contre le serveur local déjà lancé (port 4840, « application » de .claude/launch.json),
 * sans recompiler : « npx playwright test --config playwright.local.config.ts bibliotheque ».
 * Aucun appel d'IA n'y part : les captures ne touchent pas aux aides.
 */
export default defineConfig({
  ...base,
  testDir: "tests/captures",
  outputDir: "test-results/captures-traces",
  use: { ...base.use, baseURL: "http://localhost:4840" },
  webServer: undefined,
});
