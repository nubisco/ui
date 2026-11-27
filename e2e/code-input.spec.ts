import { test, expect, type Locator, type Page } from '@playwright/test'

/**
 * What jsdom cannot answer about NbCodeInput: whether the slots fit a phone,
 * whether typing and clicking in a real browser land in the right slot, and
 * whether the shake and the stagger run, and stop under reduced motion.
 */

const PAGE = '/components/code-input/usage'

/** The code input whose label reads `name`, the nth when there are several. */
function codeInput(page: Page, name: string, nth = 0): Locator {
  return page
    .locator('.nb-code-input')
    .filter({ has: page.locator('label', { hasText: name }) })
    .nth(nth)
}

/** Puts the input in a box of `width` px and measures the row inside it. */
async function fitIn(root: Locator, width: number) {
  return root.evaluate((el, w) => {
    const box = document.createElement('div')
    box.style.width = `${w}px`
    el.parentElement!.insertBefore(box, el)
    box.appendChild(el)
    const outer = box.getBoundingClientRect()
    const slots = [...el.querySelectorAll('.nb-code-input__slot')].map((s) =>
      s.getBoundingClientRect(),
    )
    const row = el.querySelector('.nb-code-input__slots')!
    return {
      overflow: Math.max(...slots.map((r) => r.right)) - outer.right,
      scrollOverflow: row.scrollWidth - row.clientWidth,
      widths: slots.map((r) => r.width),
    }
  }, width)
}

test('six slots of 44px fit 310px, and eight in two groups fit 296px', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGE)
  const six = await fitIn(codeInput(page, 'Medium'), 310)
  expect(six.overflow).toBeLessThanOrEqual(0)
  expect(six.scrollOverflow).toBe(0)
  for (const w of six.widths) expect(w).toBeCloseTo(44, 0)

  const eight = await fitIn(codeInput(page, 'Device code'), 296)
  expect(eight.widths).toHaveLength(8)
  expect(eight.overflow).toBeLessThanOrEqual(0)
  expect(eight.scrollOverflow).toBe(0)
  // Shrunk, and still wide enough to read a character in.
  for (const w of eight.widths) expect(w).toBeGreaterThanOrEqual(24)
})

test('the desktop row keeps 44px slots with 8px gaps', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(PAGE)
  const slots = codeInput(page, 'Medium').locator('.nb-code-input__slot')
  await expect(slots).toHaveCount(6)
  const rects = await slots.evaluateAll((els) =>
    els.map((e) => e.getBoundingClientRect().toJSON()),
  )
  for (const r of rects) expect(r.width).toBeCloseTo(44, 0)
  expect(rects[1].left - rects[0].right).toBeCloseTo(8, 0)
})

test('typing filters, a click picks the slot, and a key replaces it', async ({
  page,
}) => {
  await page.goto(PAGE)
  const root = codeInput(page, 'Device code')
  const input = root.locator('input')
  await input.click()
  await page.keyboard.type('ab-12 cd34')
  await expect(input).toHaveValue('AB12CD34')
  await expect(root.locator('.nb-code-input__slot').nth(7)).toHaveText('4')

  // A tap on the third slot. The input lies over the slots and takes it,
  // which is the point: the click lands at the slot's position.
  const box = (await root.locator('.nb-code-input__slot').nth(2).boundingBox())!
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await expect(root.locator('.nb-code-input__slot').nth(2)).toHaveClass(
    /nb-code-input__slot--active/,
  )
  await page.keyboard.type('z')
  await expect(input).toHaveValue('ABZ2CD34')
})

test('a paste keeps only the code', async ({ page }) => {
  await page.goto(PAGE)
  const root = codeInput(page, 'Device code')
  const input = root.locator('input')
  await input.focus()
  await page.keyboard.insertText('wxyz-9876')
  await expect(input).toHaveValue('WXYZ9876')
})

test('an error shakes, clears the value and returns focus', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(PAGE)
  const root = codeInput(page, 'Sign-in code', 3)
  await page.getByRole('button', { name: 'Show a wrong code' }).click()
  const field = root.locator('.nb-code-input__field')
  await expect(field).toHaveClass(/nb-code-input__field--shake/)
  expect(await field.evaluate((el) => getComputedStyle(el).animationName)).toBe(
    'nb-code-input-shake',
  )
  await expect(field).not.toHaveClass(/nb-code-input__field--shake/)
  await expect(root.locator('input')).toHaveValue('')
  await expect(root.locator('input')).toBeFocused()
  await expect(root.locator('input')).toHaveAttribute('aria-invalid', 'true')
  await expect(root.locator('.nb-message')).toContainText('not right')
})

test('reduced motion: no shake, no stagger, and the error still clears', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(PAGE)
  const success = codeInput(page, 'Sign-in code', 2)
  const delay = await success
    .locator('.nb-code-input__slot')
    .nth(5)
    .evaluate((el) => getComputedStyle(el).transitionDelay)
  expect(delay.split(',').every((d) => parseFloat(d) === 0)).toBe(true)

  const root = codeInput(page, 'Sign-in code', 3)
  await page.getByRole('button', { name: 'Show a wrong code' }).click()
  expect(
    await root
      .locator('.nb-code-input__field')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none')
  await expect(root.locator('input')).toHaveValue('')
  await expect(root.locator('input')).toBeFocused()
})

test('success turns the slots one after another', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto(PAGE)
  const slots = codeInput(page, 'Sign-in code', 2).locator(
    '.nb-code-input__slot',
  )
  await expect(slots).toHaveCount(6)
  const delays = await slots.evaluateAll((els) =>
    els.map((e) => parseFloat(getComputedStyle(e).transitionDelay)),
  )
  expect(delays.map((d) => Math.round(d * 1000))).toEqual([
    0, 30, 60, 90, 120, 150,
  ])
  // The border settles on the success token, resolved where the slot is.
  await expect
    .poll(() =>
      slots.nth(5).evaluate((el) => {
        const probe = document.createElement('span')
        probe.style.color = 'var(--nb-c-success)'
        el.appendChild(probe)
        const want = getComputedStyle(probe).color
        probe.remove()
        return getComputedStyle(el).borderTopColor === want
      }),
    )
    .toBe(true)
})
