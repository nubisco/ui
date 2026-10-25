import { test, expect, type Page } from '@playwright/test'

/**
 * NbShell's main region paints the page ground, layer 0, measured.
 *
 * It carried the layer-0 context (`nb-layer-0`) and painted layer 1 anyway,
 * because `--nb-shell-main-bg` was declared at `:root` as
 * `var(--nb-c-surface)` and a custom property substitutes on the element that
 * declares it: the token froze to the root's surface. A top-level NbPanel then
 * matched the page instead of sitting on it. jsdom cannot resolve custom
 * properties, so the fix is only provable here.
 *
 * The demo is the live example under "The shell body is the page ground", in
 * the Layers tab of the theming page.
 */

const DEMO = '/theming'

async function colours(page: Page) {
  return page.locator('.shell-ground-demo').evaluate((demo) => {
    const paint = (el: Element | null) =>
      el ? getComputedStyle(el).backgroundColor : null
    // Reads a layer token as a painted colour, in the demo's own context.
    const layer = (n: number) => {
      const probe = document.createElement('div')
      probe.style.background = `var(--nb-c-layer-${n})`
      demo.appendChild(probe)
      const value = getComputedStyle(probe).backgroundColor
      probe.remove()
      return value
    }
    return {
      main: paint(demo.querySelector('.nb-shell__main')),
      panel: paint(demo.querySelector('.nb-shell__main .nb-panel')),
      topbar: paint(demo.querySelector('.nb-shell__topbar')),
      layer0: layer(0),
      layer1: layer(1),
    }
  })
}

for (const mode of ['light', 'dark'] as const) {
  test(`${mode}: main is layer 0 and a top-level panel is layer 1`, async ({
    page,
  }) => {
    await page.addInitScript((m) => {
      localStorage.setItem('nubisco.theme', m)
    }, mode)
    await page.goto(DEMO)
    // The demo lives in the Layers tab, and an unselected tab is hidden.
    await page
      .getByRole('button', { name: 'Layers', exact: true })
      .first()
      .click()
    await page.locator('.shell-ground-demo .nb-shell__main').waitFor()

    const c = await colours(page)
    expect(c.main).toBe(c.layer0)
    expect(c.panel).toBe(c.layer1)
    // The chrome keeps its depth: only the page moved.
    expect(c.topbar).toBe(c.layer1)
    expect(c.main).not.toBe(c.panel)
  })
}
