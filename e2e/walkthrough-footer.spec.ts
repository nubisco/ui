import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * A middle step shows all three buttons (Skip, Back, Next). In a 320px
 * popover they did not fit beside the progress line, or even on a row of
 * their own, and Next stuck out past the popover's edge.
 */
async function middleStep(page: Page) {
  await page.goto('/components/walkthrough/usage')
  await page.getByRole('button', { name: 'Start the tour' }).click()
  const popover = page.locator('.nb-walkthrough--popover')
  await expect(popover).toBeVisible()
  await popover.getByRole('button', { name: 'Next' }).click()
  await expect(popover.getByRole('button', { name: 'Back' })).toBeVisible()
  await expect(popover.getByRole('button', { name: 'Skip' })).toBeVisible()
  return popover
}

function measure(popover: Locator) {
  return popover.evaluate((el) => {
    const inner = (node: Element) => {
      const r = node.getBoundingClientRect()
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
    }
    const style = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      left: r.left + parseFloat(style.paddingLeft),
      right: r.right - parseFloat(style.paddingRight),
      buttons: Array.from(el.querySelectorAll('.nb-button')).map(inner),
      progress: inner(el.querySelector('.nb-walkthrough--progress')!),
    }
  })
}

type TBox = Awaited<ReturnType<typeof measure>>

function expectInside(box: TBox) {
  expect(box.buttons).toHaveLength(3)
  for (const b of box.buttons) {
    expect(b.left).toBeGreaterThanOrEqual(box.left - 0.5)
    expect(b.right).toBeLessThanOrEqual(box.right + 0.5)
  }
  // The progress line never sits on top of a button.
  for (const b of box.buttons) {
    const overlaps =
      b.left < box.progress.right &&
      b.right > box.progress.left &&
      b.top < box.progress.bottom &&
      b.bottom > box.progress.top
    expect(overlaps).toBe(false)
  }
}

test('a middle step keeps its buttons inside the popover', async ({ page }) => {
  const box = await measure(await middleStep(page))
  expectInside(box)
  // On a desktop the three share one row.
  const tops = new Set(box.buttons.map((b) => Math.round(b.top)))
  expect(tops.size).toBe(1)
})

test('on a phone the buttons wrap inside the popover', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  expectInside(await measure(await middleStep(page)))
})
