import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** Captures des écrans, à la demande : « npm run captures ». */
export default defineConfig({ ...base, testDir: "tests/captures", outputDir: "test-results/captures-traces" });
