import { defineConfig } from '@playwright/test';

// Uses the locally installed Google Chrome (no browser downloads). Firefox/Safari checks are manual
// (docs/spikes/SPIKE-001-PS1-BYOR.md owner checklist); Playwright's WebKit is not Safari.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1100, height: 800 },
    launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] },
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
