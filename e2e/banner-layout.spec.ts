import { test, expect, type Page } from '@playwright/test'

/**
 * NbBanner with actions, measured on its live docs example ("Rebuild not
 * confirmed", two buttons in the action slot).
 *
 * The actions never shrink, so on a phone they took the whole row and left the
 * sentence a few pixels wide: one word per line, the buttons over it and the
 * page scrolling sideways. nubisco.io's language offer hit exactly that. On a
 * phone the actions now drop under the sentence, and on a desktop they stay
 * beside it.
 */

async function measure(page: Page) {
  const banner = page
    .locator('.nb-banner', { hasText: 'Rebuild not confirmed' })
    .first()
  await banner.waitFor()
  return banner.evaluate((el) => {
    const body = el.querySelector('.nb-banner__body')!.getBoundingClientRect()
    const actions = el
      .querySelector('.nb-banner__actions')!
      .getBoundingClientRect()
    const box = el.getBoundingClientRect()
    return {
      // The sentence runs to the same right edge as the actions under it.
      bodyFillsRow: body.right >= actions.right - 1,
      actionsBelow: actions.top >= body.bottom - 1,
      actionsInside: actions.right <= box.right + 1,
      pageOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    }
  })
}

test('banner: on a phone the actions drop under the sentence', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/components/banner/code')
  const m = await measure(page)
  expect(m.actionsBelow).toBe(true)
  expect(m.actionsInside).toBe(true)
  // The sentence keeps the whole row, not a sliver of it.
  expect(m.bodyFillsRow).toBe(true)
  expect(m.pageOverflow).toBe(false)
})

test('banner: on a desktop the actions stay beside the sentence', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/components/banner/code')
  const m = await measure(page)
  expect(m.actionsBelow).toBe(false)
  expect(m.actionsInside).toBe(true)
})
