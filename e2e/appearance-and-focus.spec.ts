import { test, expect } from '@playwright/test'

/**
 * The two things jsdom cannot answer honestly.
 *
 * Geometry, because a radius is only real once a browser has resolved
 * `max()`, `calc()` and a custom property against a live box; and focus, because
 * a focus trap is defined by where `document.activeElement` actually lands
 * after a real Tab.
 */

test.describe('appearance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/patterns/team-management')
    await page.addStyleTag({
      content: '*,*::before,*::after{transition:none!important}',
    })
  })

  /*
   * Drive the page's own control, not the attribute.
   *
   * Setting `data-nb-appearance` by hand looks equivalent and is not:
   * `useAppearance()` owns that attribute and re-applies its own state on the
   * next reactive flush, so a directly-set value survives only until something
   * else on the page updates. Clicking the control is also the path a user
   * takes, which is what the test is meant to be about.
   */
  const set =
    (value: 'square' | 'rounded') =>
    async (page: import('@playwright/test').Page) => {
      // The example labels these 'Square' and 'Rounded'; the site header
      // uses 'Round'. Scoped to the example, so the longer label is the one.
      const label = value === 'square' ? 'Square' : 'Rounded'
      await page
        .locator('.team__demo-bar')
        .getByRole('button', { name: label, exact: true })
        .click()
      await expect
        .poll(() =>
          page.evaluate(() =>
            document.documentElement.getAttribute('data-nb-appearance'),
          ),
        )
        .toBe(value)
    }

  test('square is the default and rounded is opt-in', async ({ page }) => {
    const radius = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

    await set('square')(page)
    expect(await radius('.nb-button')).toBe('0px')
    expect(await radius('.nb-data-table')).toBe('0px')

    await set('rounded')(page)
    // A control is a capsule: the radius exceeds half the height and CSS
    // clamps it, so both ends are semicircles.
    expect(await radius('.nb-button')).toBe('9999px')
    // Containers are proportionate, not uniform.
    expect(await radius('.nb-data-table')).toBe('14px')
  })

  test('leaves intentionally circular geometry alone', async ({ page }) => {
    const avatarRadius = () =>
      page
        .locator('.team__avatar')
        .first()
        .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

    await set('square')(page)
    const square = await avatarRadius()
    await set('rounded')(page)
    const rounded = await avatarRadius()

    // An avatar is round because it is an avatar, at every appearance.
    expect(square).toBe(rounded)
    expect(square).not.toBe('0px')
  })

  test('capsules the controls that should be capsules, and no others', async ({
    page,
  }) => {
    await set('rounded')(page)
    const radius = (sel: string) =>
      page
        .locator(sel)
        .first()
        .evaluate((el) => getComputedStyle(el).borderTopLeftRadius)

    expect(await radius('.nb-button')).toBe('9999px')
    // A checkbox at capsule radius is a circle, which is a radio button.
    expect(await radius('.nb-checkbox__box')).toBe('8px')
  })

  test('is independent of colour mode', async ({ page }) => {
    await set('rounded')(page)
    await page.evaluate(() => document.documentElement.classList.add('dark'))

    expect(
      await page.evaluate(() =>
        document.documentElement.getAttribute('data-nb-appearance'),
      ),
    ).toBe('rounded')

    await page.evaluate(() => document.documentElement.classList.remove('dark'))
    expect(
      await page
        .locator('.nb-button')
        .first()
        .evaluate((el) => getComputedStyle(el).borderTopLeftRadius),
    ).toBe('9999px')
  })

  test('reaches a teleported overlay', async ({ page }) => {
    await set('rounded')(page)
    await page.locator('button[aria-label^="Edit "]').first().click()

    const dialog = page.locator('[aria-modal="true"]')
    await expect(dialog).toBeVisible()
    // The modal role takes the largest corner in the scale.
    expect(
      await dialog.evaluate((el) => getComputedStyle(el).borderTopLeftRadius),
    ).toBe('20px')
  })
})

test.describe('modal focus trap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/patterns/team-management')
    await page.addStyleTag({
      content: '*,*::before,*::after{transition:none!important}',
    })
  })

  test('takes focus, keeps it, and gives it back', async ({ page }) => {
    const trigger = page.locator('button[aria-label^="Edit "]').first()
    const label = await trigger.getAttribute('aria-label')
    await trigger.focus()

    await trigger.press('Enter')
    const dialog = page.locator('[aria-modal="true"]')
    await expect(dialog).toBeVisible()

    // Focus moved INTO the dialog, and onto the first field rather than the
    // close button, because the dialog directs it with `initial-focus`.
    expect(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        const d = document.querySelector('[aria-modal="true"]')
        return {
          inside: !!(el && d?.contains(el)),
          tag: el?.tagName,
        }
      }),
    ).toEqual({ inside: true, tag: 'INPUT' })

    // Tab cannot walk out onto the page behind the scrim.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab')
      const inside = await page.evaluate(() => {
        const el = document.activeElement
        const d = document.querySelector('[aria-modal="true"]')
        return !!(el && d?.contains(el))
      })
      expect(inside, `focus escaped on Tab ${i + 1}`).toBe(true)
    }

    // Shift+Tab is trapped too.
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab')
      expect(
        await page.evaluate(() => {
          const el = document.activeElement
          const d = document.querySelector('[aria-modal="true"]')
          return !!(el && d?.contains(el))
        }),
      ).toBe(true)
    }

    // Escape closes it and hands focus back to the control that opened it.
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expect(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      ),
    ).toBe(label)
  })

  test('lands the destructive confirmation on Cancel, never on Delete', async ({
    page,
  }) => {
    await page.locator('button[aria-label^="Remove "]').first().click()

    const dialog = page.locator('[role="alertdialog"]')
    await expect(dialog).toBeVisible()

    expect(
      await page.evaluate(() => document.activeElement?.textContent?.trim()),
    ).toBe('Cancel')
  })

  test('restores page scrolling after it closes', async ({ page }) => {
    await page.locator('button[aria-label^="Edit "]').first().click()
    await expect(page.locator('[aria-modal="true"]')).toBeVisible()
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(
      'hidden',
    )

    await page.keyboard.press('Escape')
    await expect(page.locator('[aria-modal="true"]')).toBeHidden()
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
      'hidden',
    )
  })
})

test.describe('rounded field edges', () => {
  /*
   * All four edges of a rounded field must be the same colour and width.
   *
   * This is a browser test because it is a `var()` substitution defect and
   * jsdom does not substitute custom properties at all. The bug it guards
   * against: the appearance block aliased the side colour to
   * `var(--nb-c-field-border)`, which substitutes on `<html>` where the block
   * is declared. A page that turns dark on a WRAPPER rather than on `<html>`
   * then inherited the already-resolved LIGHT colour into the sides while the
   * bottom rule, named by the component, resolved DARK. The capsule showed
   * three grey edges and one bright one.
   */
  const edges = async (page: import('@playwright/test').Page, sel: string) =>
    page
      .locator(sel)
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el)
        return {
          top: [s.borderTopColor, s.borderTopWidth].join(' '),
          right: [s.borderRightColor, s.borderRightWidth].join(' '),
          bottom: [s.borderBottomColor, s.borderBottomWidth].join(' '),
          left: [s.borderLeftColor, s.borderLeftWidth].join(' '),
        }
      })

  const allFourAgree = (e: Record<string, string>) => {
    expect(e.top).toBe(e.bottom)
    expect(e.right).toBe(e.bottom)
    expect(e.left).toBe(e.bottom)
  }

  for (const mode of ['light', 'dark'] as const) {
    test(`agree on every edge in ${mode}, with the mode set on a wrapper`, async ({
      page,
    }) => {
      await page.goto('/theme-builder')
      await page.addStyleTag({
        content: '*,*::before,*::after{transition:none!important}',
      })
      await expect(page.locator('.tb__preview')).toBeVisible()

      /*
       * The builder preview is exactly the shape that exposed the defect: it
       * carries `.dark` on its own element, not on `<html>`.
       */
      await page.evaluate((m) => {
        document.documentElement.setAttribute('data-nb-appearance', 'rounded')
        document
          .querySelector('.tb__preview')
          ?.classList.toggle('dark', m === 'dark')
      }, mode)

      const input = await edges(
        page,
        '.tb__preview .nb-text-input__field-wrapper',
      )
      expect(input.bottom).not.toContain('0px')
      allFourAgree(input)

      const select = await edges(page, '.tb__preview .nb-select__trigger')
      allFourAgree(select)

      // And the two components match each other, so a field and a select on
      // one row keep the same silhouette.
      expect(select.bottom).toBe(input.bottom)
    })
  }

  test('draws only the bottom rule in square', async ({ page }) => {
    await page.goto('/theme-builder')
    await expect(page.locator('.tb__preview')).toBeVisible()
    await page.evaluate(() =>
      document.documentElement.setAttribute('data-nb-appearance', 'square'),
    )

    const e = await edges(page, '.tb__preview .nb-text-input__field-wrapper')
    expect(e.bottom).not.toContain('0px')
    for (const side of ['top', 'right', 'left'] as const) {
      expect(e[side]).toContain('0px')
    }
  })
})
