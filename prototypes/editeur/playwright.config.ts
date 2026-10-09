import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4830' },
  webServer: { command: 'npm run dev', url: 'http://localhost:4830', reuseExistingServer: true },
  projects: [
    {
      name: 'ordinateur',
      testIgnore: /tablette/,
      use: { ...devices['Desktop Chrome'], permissions: ['clipboard-read', 'clipboard-write'] },
    },
    // Toute la suite rejouée sous WebKit (moteur de Safari), hors presse-papiers :
    // Playwright n'y donne pas accès à la lecture du presse-papiers.
    { name: 'webkit', testIgnore: /tablette/, use: { ...devices['Desktop Safari'] } },
    // Émulation d'iPad sous WebKit : écran tactile simulé, pas de clavier virtuel.
    { name: 'tablette', testMatch: /tablette/, use: { ...devices['iPad (gen 7)'] } },
  ],
});
