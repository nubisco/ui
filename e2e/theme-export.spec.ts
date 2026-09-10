import { test, expect, type Page } from '@playwright/test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import * as sass from 'sass-embedded'

/**
 * The export round trip, end to end.
 *
 * An export button that produces a download proves nothing. This authors a
 * theme in the real builder, takes the real exported text, compiles it the way
 * a consumer's build would, applies it to a real page, and then reads
 * COMPUTED styles off real components — not the tokens it just set, which
 * would only prove the test can echo itself back.
 */

const ROOT = resolve('.')

/** Compile an exported theme the way a consuming application's build does. */
function compileTheme(scss: string): string {
  return sass.compileString(scss, {
    loadPaths: [ROOT],
    importers: [
      {
        findFileUrl(url) {
          if (!url.startsWith('@nubisco/ui/')) return null
          return new URL(
            `file://${join(ROOT, 'src', url.slice('@nubisco/ui/'.length))}`,
          )
        },
      },
    ],
  }).css
}

/**
 * Read the SCSS the builder is currently offering.
 *
 * The code lives in a tab panel, and a tab panel that is not selected is not
 * in the DOM at all, so the tab has to be opened first. Scoped to the
 * builder's own tab strip: documentation pages carry other tab groups with a
 * `Code` tab of their own.
 */
async function exportedScss(page: Page): Promise<string> {
  await page
    .locator('.tb__tabs')
    .getByRole('tab', { name: 'Code', exact: true })
    .click()
  const code = page.locator('.tb__code')
  await expect(code).toBeVisible()
  return (await code.evaluate((el) => el.textContent ?? '')).trim()
}

/** Types a new base colour for one palette entry. */
async function setBase(page: Page, colorId: string, value: string) {
  await page.fill(`#tb-palette-${colorId}`, value)
}

/**
 * The control row for one role, found the way a reader finds it: by its label.
 *
 * Anchored, because `hasText` matches substrings and "Primary" would also
 * select "Primary hover", "Primary active" and "Primary text".
 */
function roleRow(page: Page, label: string) {
  return page.locator('.tb__token').filter({
    has: page.locator('.tb__token-label', {
      hasText: new RegExp(`^${label}$`),
    }),
  })
}

/** Picks a step of the role's current palette colour, lightest first. */
async function pickStep(page: Page, label: string, index: number) {
  await roleRow(page, label).locator('.tb__strip button').nth(index).click()
}

/** What that role currently resolves to. */
async function resolved(page: Page, label: string): Promise<string> {
  return (await roleRow(page, label).locator('.tb__resolved-value').innerText())
    .trim()
    .toLowerCase()
}

test.describe('theme builder export round trip', () => {
  test('authors, exports, compiles, applies, and survives every axis', async ({
    page,
  }) => {
    /* 1. Create a named theme in the builder. */
    await page.goto('/theme-builder')
    await expect(page.locator('.tb')).toBeVisible()
    // The controls are client-rendered; wait for one rather than racing it.
    await expect(page.locator('#tb-palette-accent')).toBeAttached()

    await page.fill('input.tb__name', 'Round Trip')
    await expect(page.locator('input.tb__id')).toHaveValue('round-trip')

    /*
     * 2. Author it the way the library models a theme: set a base colour,
     * then point the roles at steps of it. The light and dark halves share
     * the palette and differ only in which step they read, which is the
     * behaviour worth proving end to end.
     */
    const ACCENT = '#b5122f'
    await setBase(page, 'accent', ACCENT)

    /*
     * Scoped to the builder's own mode switch. An unscoped
     * `getByRole('button', { name: 'Dark' })` matches the SITE's colour-mode
     * toggle in the header first, which silently leaves the edit target on
     * light and makes the second edit overwrite the first.
     */
    const editMode = (label: string) =>
      page
        .locator('.tb__mode')
        .getByRole('button', { name: label, exact: true })

    // A dark step for light, a lighter step for dark: different values from
    // one colour.
    await pickStep(page, 'Primary', 11)
    const LIGHT_PRIMARY = await resolved(page, 'Primary')

    await editMode('Dark').click()
    await pickStep(page, 'Primary', 4)
    const DARK_PRIMARY = await resolved(page, 'Primary')

    await editMode('Light').click()
    expect(LIGHT_PRIMARY).not.toBe(DARK_PRIMARY)

    /* 3. Export through the real interface. */
    const scss = await exportedScss(page)
    expect(scss).toContain("@use '@nubisco/ui/styles/theme-api' as nb")
    expect(scss).toContain("'round-trip'")
    // The palette is declared, and the roles reference steps of it rather
    // than restating colours.
    expect(scss).toContain(`accent: ${ACCENT}`)
    expect(scss).toMatch(/'primary': 'accent-\d+'/)

    // The download itself works, and names the file after the identifier.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export SCSS' }).click(),
    ])
    expect(download.suggestedFilename()).toBe('round-trip.scss')

    /* 4. Compile that exact file in a minimal consumer fixture. */
    const dir = mkdtempSync(join(tmpdir(), 'nb-e2e-'))
    let themeCss = ''
    let secondCss = ''
    try {
      const file = join(dir, 'round-trip.scss')
      writeFileSync(file, scss)
      themeCss = compileTheme(scss)

      // 11. A second theme, to prove they coexist.
      secondCss = compileTheme(
        `@use '@nubisco/ui/styles/theme-api' as nb;\n@include nb.theme('second', $palette: (accent: #123456), $light: ('primary': #123456), $dark: ('primary': #654321));\n`,
      )
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }

    expect(themeCss).toContain('[data-nb-theme=round-trip]')
    // The ramp is expanded by the mixin, with a foreground for every step.
    expect(themeCss).toMatch(/--nb-c-accent-500: /)
    expect(themeCss).toMatch(/--nb-c-accent-500-a11y: /)
    expect(themeCss).toMatch(
      /--nb-c-primary-a11y: var\(--nb-c-accent-\d+-a11y\)/,
    )

    /* 5-7. Apply it to a real page and read COMPUTED styles off components. */
    await page.goto('/patterns/team-management')
    await page.addStyleTag({ content: themeCss })
    await page.addStyleTag({ content: secondCss })
    await page.addStyleTag({
      content: '*,*::before,*::after{transition:none!important}',
    })

    const primaryButton = page
      .locator('.team__header .nb-button--primary')
      .first()
    const bg = () =>
      primaryButton.evaluate((el) => getComputedStyle(el).backgroundColor)

    const beforeTheme = await bg()

    await page.evaluate(() =>
      document.documentElement.setAttribute('data-nb-theme', 'round-trip'),
    )
    const asRgb = (hex: string) => {
      const [r, g, b] = (hex.slice(1).match(/../g) ?? []).map((h) =>
        parseInt(h, 16),
      )
      return `rgb(${r}, ${g}, ${b})`
    }
    expect(await bg()).toBe(asRgb(LIGHT_PRIMARY)) // what the builder previewed
    expect(await bg()).not.toBe(beforeTheme)

    /* 8. Both palettes, via the existing colour-mode class. */
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    expect(await bg()).toBe(asRgb(DARK_PRIMARY)) // the other step, same colour

    await page.evaluate(() => document.documentElement.classList.remove('dark'))
    expect(await bg()).toBe(asRgb(LIGHT_PRIMARY))

    /* 9. Appearance is independent: geometry moves, colour does not. */
    const radius = () =>
      primaryButton.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

    expect(await radius()).toBe('0px')
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-nb-appearance', 'rounded'),
    )
    expect(await radius()).toBe('9999px')
    expect(await bg()).toBe(asRgb(LIGHT_PRIMARY)) // unchanged by the corner switch

    await page.evaluate(() =>
      document.documentElement.setAttribute('data-nb-appearance', 'square'),
    )
    expect(await radius()).toBe('0px')

    /* 10. A teleported overlay inherits the theme. */
    await page.locator('button[aria-label^="Edit "]').first().click()
    const dialog = page.locator('[aria-modal="true"]')
    await expect(dialog).toBeVisible()

    const dialogPrimary = dialog.locator('.nb-button--primary').first()
    expect(
      await dialogPrimary.evaluate(
        (el) => getComputedStyle(el).backgroundColor,
      ),
    ).toBe(asRgb(LIGHT_PRIMARY))

    // It really is teleported: a sibling of the app root, not a descendant.
    expect(await dialog.evaluate((el) => el.closest('.team') === null)).toBe(
      true,
    )

    await page.keyboard.press('Escape')

    /* 11. The second theme is selectable, and did not clobber the first. */
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-nb-theme', 'second'),
    )
    expect(await bg()).toBe('rgb(18, 52, 86)') // #123456

    await page.evaluate(() =>
      document.documentElement.setAttribute('data-nb-theme', 'round-trip'),
    )
    expect(await bg()).toBe(asRgb(LIGHT_PRIMARY))

    /* 12. Back to the default theme, intact. */
    await page.evaluate(() =>
      document.documentElement.removeAttribute('data-nb-theme'),
    )
    expect(await bg()).toBe(beforeTheme)
  })

  test('refuses an identifier that could break out of the selector', async ({
    page,
  }) => {
    await page.goto('/theme-builder')
    await expect(page.locator('input.tb__id')).toBeVisible()
    await page.fill('input.tb__id', 'Evil Theme')

    // The export control is unavailable while the id is invalid, and the
    // preview says why rather than failing silently at compile time.
    await expect(
      page.getByRole('button', { name: 'Export SCSS' }),
    ).toBeDisabled()
  })

  test('reports contrast without blocking an imperfect export', async ({
    page,
  }) => {
    await page.goto('/theme-builder')
    await expect(page.locator('#tb-palette-accent')).toBeAttached()

    const rows = page.locator('.tb__contrast tbody tr')
    await expect(rows.first()).toBeAttached()
    expect(await rows.count()).toBeGreaterThan(0)

    // Drive body text to the lightest step of its colour, which cannot pass
    // on a light page.
    await pickStep(page, 'Primary text', 0)

    await expect(page.locator('.tb__contrast')).toContainText('Fail')
    // Still exportable: the file is the author's, and silently correcting a
    // chosen colour would make the export disagree with the preview.
    await expect(
      page.getByRole('button', { name: 'Export SCSS' }),
    ).toBeEnabled()
  })
})
