import { defineConfig } from '@playwright/test';

// Un seul exécutant : les tests mesurent des durées et partagent le serveur de l'essai.
export default defineConfig({
  testDir: 'tests',
  workers: 1,
  fullyParallel: false,
  timeout: 180_000,
  reporter: [['list']],
});
