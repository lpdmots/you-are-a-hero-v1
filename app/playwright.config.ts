import { resolve } from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { parse } from "dotenv";
import { readFileSync } from "node:fs";

// L'application d'essai reçoit expressément les valeurs de la base locale : elles priment
// sur tout fichier d'environnement, et un essai ne peut pas parler à la vraie base.
const local = parse(readFileSync(resolve(__dirname, ".env.local")));
if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(local.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
  throw new Error("Les parcours ne se jouent que contre la base locale : « npm run base:demarrer » puis « npm run env:local ».");
}

/**
 * Parcours joués dans un vrai navigateur, contre l'application compilée et la base
 * locale de Supabase (Docker). Un test par critère d'acceptation, nommé par son
 * identifiant.
 */
export default defineConfig({
  testDir: "tests/parcours",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3100",
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 768 } } }],
  webServer: {
    command: "npm run build && npx next start -p 3100",
    url: "http://localhost:3100/entree",
    reuseExistingServer: false,
    timeout: 240_000,
    env: local,
  },
});
