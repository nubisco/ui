import { test, expect } from '@playwright/test'

/**
 * Focus and geometry for the editor primitives, which is the part jsdom cannot
 * answer: whether a real mousedown on a toolbar button blurs the editor, where
 * a real selection's rectangle puts the toolbar, and where focus lands after a
 * host moves a held drag handle in the DOM.
 */

test.describe('NbFloatingToolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/components/floating-toolbar')
  })

  test('floats over a selection and keeps it through a button press', async ({
    page,
  }) => {
    const paragraph = page.locator('p[contenteditable]').first()
    await paragraph.waitFor()

    // Select the first word by double-clicking it, the way a user would.
    const box = (await paragraph.boundingBox())!
    await page.mouse.dblclick(box.x + 30, box.y + 22)

    const toolbar = page.getByRole('toolbar', { name: 'Text formatting' })
    await expect(toolbar).toBeVisible()

    const geometry = await page.evaluate(() => {
      const range = document.getSelection()!.getRangeAt(0)
      const selection = range.getBoundingClientRect()
      const bar = document
        .querySelector('.nb-floating-toolbar')!
        .getBoundingClientRect()
      return {
        selectionTop: selection.top,
        barBottom: bar.bottom,
        barCentre: bar.left + bar.width / 2,
        selectionCentre: selection.left + selection.width / 2,
      }
    })
    // Above the selection, centred on it (clamping aside).
    expect(geometry.barBottom).toBeLessThanOrEqual(geometry.selectionTop)
    expect(
      Math.abs(geometry.barCentre - geometry.selectionCentre),
    ).toBeLessThan(2)

    const before = await page.evaluate(() => ({
      text: document.getSelection()!.toString(),
      focused: document.activeElement?.hasAttribute('contenteditable'),
    }))
    expect(before.text.length).toBeGreaterThan(0)
    expect(before.focused).toBe(true)

    await toolbar.getByRole('button', { name: 'Bold' }).click()

    const after = await page.evaluate(() => ({
      text: document.getSelection()!.toString(),
      focused: document.activeElement?.hasAttribute('contenteditable'),
      bold: !!document.querySelector('p[contenteditable] b'),
    }))
    expect(after.focused).toBe(true)
    expect(after.text).toBe(before.text)
    expect(after.bold).toBe(true)
  })
})

test.describe('NbDragHandle', () => {
  test('keeps a held block through a keyboard reorder', async ({ page }) => {
    await page.goto('/components/drag-handle')
    const handle = page.getByRole('button', { name: 'Move Introduction' })
    await handle.focus()

    const cursor = await handle.evaluate((el) => getComputedStyle(el).cursor)
    expect(cursor).toBe('grab')

    await page.keyboard.press('Space')
    await expect(
      page.getByRole('button', { name: 'Move Introduction, picked up' }),
    ).toBeFocused()

    // The demo host reorders on every arrow key, which moves the focused node.
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')

    const held = page.getByRole('button', {
      name: 'Move Introduction, picked up',
    })
    await expect(held).toBeFocused()

    const order = await page
      .locator('.nb-drag-handle')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')))
    expect(order.slice(0, 3)).toEqual([
      'Move Setup',
      'Move Usage',
      'Move Introduction, picked up',
    ])

    await page.keyboard.press('Space')
    await expect(
      page.getByRole('button', { name: 'Move Introduction', exact: true }),
    ).toBeFocused()
  })
})
