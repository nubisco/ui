import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests.
 *
 * `test:e2e` is not part of `quality:check` (the pre-commit hook stays fast),
 * but CI runs it on Chromium in its own job ("Browser tests" in
 * .github/workflows/ci.yml), so the only real-browser accessibility checks in
 * the repository run on every push. These checks want a real browser and a
 * running documentation site, which the jsdom suite cannot give. What lives
 * here is what jsdom genuinely cannot answer: computed styles, teleported
 * overlays, and the focus behaviour of a real focus trap.
 *
 * Run with `pnpm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  // One retry in CI only, for a cold dev server's first compile.
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],

  use: {
    baseURL: 'http://localhost:5178',
    /*
     * Animations off, globally.
     *
     * This is not cosmetic. Several measurements during this work read a
     * pre-transition value and looked like real defects: `getComputedStyle`
     * returns the colour a property is animating FROM until the transition
     * settles, and a tab that is not painting never settles at all. Disabling
     * animations makes a computed value mean what it says.
     */
    launchOptions: { args: ['--force-prefers-reduced-motion'] },
    trace: 'off',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  /*
   * The suite starts its own docs server on a port the interactive one does
   * not use, so running these never fights a `docs:dev` someone already has
   * open.
   */
  webServer: {
    command: 'pnpm run docs:dev -- --port 5178 --strictPort',
    url: 'http://localhost:5178/',
    // CI always starts a fresh server; locally an open one is reused.
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
