import { test, expect } from '@playwright/test'

/**
 * Geometry jsdom cannot measure: whether a field and the button beside it
 * really share a row, and whether a fluid field's buttons leave its height
 * alone.
 */

test('a date picker in an input group lines up with its button', async ({
  page,
}) => {
  await page.goto('/components/input-group/usage')
  const group = page
    .locator('.nb-input-group')
    .filter({ has: page.locator('.nb-date-picker') })
    .first()
  await expect(group).toBeVisible()

  const [field, button] = await Promise.all([
    group.locator('.nb-date-picker__input-wrapper').evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, height: r.height }
    }),
    group.locator('.nb-input-group__row > .nb-button').evaluate((el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, height: r.height }
    }),
  ])
  expect(Math.abs(field.top - button.top)).toBeLessThan(0.5)
  expect(Math.abs(field.bottom - button.bottom)).toBeLessThan(0.5)
  // The group's own label is the only one: the picker renders none.
  await expect(group.locator('label')).toHaveCount(1)
})

test('fluid clear and reveal buttons keep the field height', async ({
  page,
}) => {
  await page.goto('/components/text-input/code')
  const fluid = page.locator('.nb-text-input--fluid')
  const plain = fluid
    .filter({ hasNot: page.locator('.nb-text-input__controls') })
    .first()
  const withControls = fluid
    .filter({ has: page.locator('.nb-text-input__reveal') })
    .first()
  await expect(withControls).toBeVisible()

  const height = (l: typeof plain) =>
    l
      .locator('.nb-text-input__field-wrapper')
      .evaluate((el) => el.getBoundingClientRect().height)
  expect(await height(withControls)).toBeCloseTo(await height(plain), 0)

  // The buttons sit at the trailing edge, centred on the input line.
  const geometry = await withControls.evaluate((root) => {
    const wrapper = root.querySelector('.nb-text-input__field-wrapper')!
    const input = root.querySelector('input')!
    const reveal = root.querySelector('.nb-text-input__reveal')!
    const w = wrapper.getBoundingClientRect()
    const i = input.getBoundingClientRect()
    const r = reveal.getBoundingClientRect()
    return {
      inputCentre: i.top + i.height / 2,
      revealCentre: r.top + r.height / 2,
      revealRight: r.right,
      wrapperRight: w.right,
      revealBottom: r.bottom,
      wrapperBottom: w.bottom,
    }
  })
  expect(Math.abs(geometry.inputCentre - geometry.revealCentre)).toBeLessThan(1)
  expect(geometry.wrapperRight - geometry.revealRight).toBeLessThan(2)
  expect(geometry.revealBottom).toBeLessThanOrEqual(geometry.wrapperBottom)
})
