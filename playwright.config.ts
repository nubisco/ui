import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests, deliberately **local-only**.
 *
 * `test:e2e` is not part of `quality:check` and is not wired into CI. These
 * checks want a real browser and a running documentation site, which is a
 * heavier thing to ask of a pipeline than the jsdom suite, and the jsdom suite
 * already guards the logic. What lives here is what jsdom genuinely cannot
 * answer: computed styles, teleported overlays, and the focus behaviour of a
 * real focus trap.
 *
 * Run with `pnpm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
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
    reuseExistingServer: true,
    timeout: 180_000,
  },
})
