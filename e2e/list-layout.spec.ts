import { test, expect, type Page } from '@playwright/test'

/**
 * Three layout behaviours jsdom cannot measure, each on its live docs example.
 *
 * - NbStructuredList: an `auto` column is one width in every row, because the
 *   list holds the tracks and every row is a subgrid of them.
 * - NbContainedListItem `wrap`: a long title takes more than one line instead
 *   of ending in an ellipsis, and a row without it keeps one line.
 * - NbPanel on a phone: actions that do not fit beside the title drop under
 *   it, and on a desktop they stay beside it.
 */

async function lefts(page: Page, selector: string) {
  return page
    .locator(selector)
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.children].map((cell) =>
          Math.round(cell.getBoundingClientRect().left),
        ),
      ),
    )
}

test('structured list: an auto column lines up across every row', async ({
  page,
}) => {
  await page.goto('/components/structured-list/code')
  const demo = '.structured-list-auto-demo .nb-structured-list__row'
  await page.locator(demo).first().waitFor()
  const rows = await lefts(page, demo)
  // The header row and three body rows.
  expect(rows).toHaveLength(4)
  for (const row of rows) expect(row).toEqual(rows[0])
})

test('contained list: wrap lets a long title take more than one line', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto('/components/contained-list/code')
  const title = page
    .locator('.nb-contained-list-item--wrap .nb-contained-list-item__title')
    .first()
  await title.waitFor()
  const { height, lineHeight, overflowing } = await title.evaluate((el) => ({
    height: el.getBoundingClientRect().height,
    lineHeight: parseFloat(getComputedStyle(el).lineHeight),
    overflowing: el.scrollWidth > el.clientWidth,
  }))
  expect(height).toBeGreaterThan(lineHeight * 1.5)
  expect(overflowing).toBe(false)

  await page.goto('/components/contained-list/usage')
  const plain = page.locator('.nb-contained-list-item__title').first()
  await plain.waitFor()
  expect(await plain.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe(
    'nowrap',
  )
})

async function actionsBelowTitle(page: Page) {
  const panel = page
    .locator('.nb-panel', { hasText: 'Dependencies that point the wrong way' })
    .first()
  await panel.waitFor()
  return panel.evaluate((el) => {
    const title = el.querySelector('.nb-panel__title')!.getBoundingClientRect()
    const actions = el
      .querySelector('.nb-panel__actions')!
      .getBoundingClientRect()
    return actions.top >= title.bottom
  })
}

test('panel: actions drop under a long title on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/components/panel/usage')
  expect(await actionsBelowTitle(page)).toBe(true)
})

test('panel: actions stay beside the title on a desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/components/panel/usage')
  expect(await actionsBelowTitle(page)).toBe(false)
})
