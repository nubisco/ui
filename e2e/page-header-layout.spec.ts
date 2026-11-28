import { test, expect, type Page } from '@playwright/test'

/**
 * NbPageHeader with actions in the slot, measured on its live docs example.
 *
 * Slot actions do not fold to icons, and they never shrank, so on a phone they
 * took the row and left a long title one letter wide (the CMS release page hit
 * exactly that). On a phone they now drop under the title when they do not fit
 * beside it. On a desktop they stay beside it.
 */

async function measure(page: Page) {
  const header = page
    .locator('.nb-page-header', { hasText: 'Quarterly report for the board' })
    .first()
  await header.waitFor()
  return header.evaluate((el) => {
    const title = el
      .querySelector('.nb-page-header__title')!
      .getBoundingClientRect()
    const actions = el
      .querySelector('.nb-page-header__actions')!
      .getBoundingClientRect()
    const box = el.getBoundingClientRect()
    return {
      titleWidth: title.width,
      boxWidth: box.width,
      actionsBelow: actions.top >= title.bottom - 1,
      actionsInside: actions.right <= box.right + 1,
      pageOverflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    }
  })
}

test('page header: on a phone slot actions drop under a long title', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/components/page-header/code')
  const m = await measure(page)
  expect(m.actionsBelow).toBe(true)
  expect(m.actionsInside).toBe(true)
  // The title keeps most of the header's width, not a sliver of it.
  expect(m.titleWidth).toBeGreaterThan(m.boxWidth * 0.6)
  expect(m.pageOverflow).toBe(false)
})

test('page header: on a desktop slot actions stay beside the title', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/components/page-header/code')
  const m = await measure(page)
  expect(m.actionsBelow).toBe(false)
  expect(m.actionsInside).toBe(true)
})
