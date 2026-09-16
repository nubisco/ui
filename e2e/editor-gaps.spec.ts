import { test, expect, type Page } from '@playwright/test'

/**
 * The gaps Acta's document editor found in 5.3.0, checked where jsdom cannot:
 * real focus crossing into a teleported submenu, a real mouse press on one of
 * its items, a popover's painted position after its entrance animation, and a
 * table of contents following a real scroll.
 */

const focusedText = (page: Page) =>
  page.evaluate(() => document.activeElement?.textContent?.trim() ?? '')

test.describe('NbSubmenu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ui/components/menu')
    const file = page.getByRole('button', { name: 'File', exact: true })
    await file.scrollIntoViewIfNeeded()
    await file.click()
    await expect(page.locator('.nb-submenu-trigger')).toBeVisible()
  })

  test('is reachable and usable from the keyboard', async ({ page }) => {
    await page.keyboard.press('ArrowDown')
    expect(await focusedText(page)).toBe('Open Recent')

    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.nb-submenu')).toBeVisible()
    expect(await focusedText(page)).toBe('project.json')

    await page.keyboard.press('ArrowDown')
    expect(await focusedText(page)).toBe('readme.md')

    await page.keyboard.press('Escape')
    await expect(page.locator('.nb-submenu')).toBeHidden()
    expect(await focusedText(page)).toBe('Open Recent')
    // Only the submenu closed.
    await expect(page.locator('.nb-menu')).toBeVisible()

    await page.keyboard.press('Enter')
    expect(await focusedText(page)).toBe('project.json')
    await page.keyboard.press('Enter')
    await expect(page.locator('.nb-menu')).toHaveCount(0)
  })

  test('selects an item with a mouse click', async ({ page }) => {
    await page.locator('.nb-submenu-trigger').hover()
    const item = page.locator('.nb-submenu .nb-menu-item', {
      hasText: 'readme.md',
    })
    await expect(item).toBeVisible()
    await item.hover()

    // The docs demo closes the menu from the item's select handler, so the
    // menu closing after mouseup (and not already on mousedown) is the proof
    // that the click reached the item.
    await page.mouse.down()
    await expect(page.locator('.nb-submenu')).toBeVisible()
    await page.mouse.up()
    await expect(page.locator('.nb-menu')).toHaveCount(0)
  })
})

test.describe('NbInfoHint', () => {
  test('centres its popover on the trigger', async ({ page }) => {
    await page.goto('/ui/components/info-hint')
    const triggers = page.locator('.nb-info-hint--trigger')
    await triggers.first().waitFor()
    const count = await triggers.count()

    for (let i = 0; i < count; i++) {
      await triggers.nth(i).scrollIntoViewIfNeeded()
      await triggers.nth(i).click()
      const popover = page.locator('.nb-info-hint--popover')
      await expect(popover).toBeVisible()
      // Let any entrance animation finish before reading the painted box.
      await page.waitForTimeout(400)

      const offset = await page.evaluate((index) => {
        const trigger = document
          .querySelectorAll('.nb-info-hint--trigger')
          [index].getBoundingClientRect()
        const el = document.querySelector('.nb-info-hint--popover')!
        const box = el.getBoundingClientRect()
        const horizontal =
          el.classList.contains('nb-info-hint--popover-top') ||
          el.classList.contains('nb-info-hint--popover-bottom')
        return horizontal
          ? box.left + box.width / 2 - (trigger.left + trigger.width / 2)
          : box.top + box.height / 2 - (trigger.top + trigger.height / 2)
      }, i)
      // Whole-pixel rounding of the placement is the only slack. It used to be
      // 2% of the popover's width: 5.44px on a 272px popover.
      expect(Math.abs(offset)).toBeLessThan(1)

      await page.keyboard.press('Escape')
      await expect(popover).toHaveCount(0)
    }
  })
})

test.describe('NbTableOfContents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ui/components/table-of-contents')
    await page.locator('.nb-toc nav').first().waitFor()
  })

  test('links are in the tab order and scroll to their section', async ({
    page,
  }) => {
    const toc = page.locator('.nb-toc').first()
    const usage = toc.getByRole('link', { name: 'Usage' })
    await usage.focus()
    await page.keyboard.press('Enter')

    await expect(usage).toHaveAttribute('aria-current', 'location')
    await expect
      .poll(() =>
        page.evaluate(() => {
          const article = document.querySelector('.toc-demo__article')!
          const heading = document.getElementById('toc-demo-usage')!
          return (
            heading.getBoundingClientRect().top -
            article.getBoundingClientRect().top
          )
        }),
      )
      .toBeLessThan(40)
    await expect(page.locator('#toc-demo-usage')).toBeFocused()

    // Tab moves on to the next link, as it would through any list of links.
    await usage.focus()
    await page.keyboard.press('Tab')
    await expect(toc.getByRole('link', { name: 'Limits' })).toBeFocused()
  })

  test('follows a real scroll', async ({ page }) => {
    const toc = page.locator('.nb-toc').first()
    await page.evaluate(() => {
      const article = document.querySelector('.toc-demo__article')!
      const heading = document.getElementById('toc-demo-configure')!
      article.scrollTop +=
        heading.getBoundingClientRect().top -
        article.getBoundingClientRect().top
    })
    await expect(toc.getByRole('link', { name: 'Configure' })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })

  test('the floating form opens, closes on a choice, and on Escape', async ({
    page,
  }) => {
    const floating = page.locator('.nb-toc--floating')
    const show = floating.getByRole('button', { name: 'Show contents' })
    await show.scrollIntoViewIfNeeded()
    await show.click()
    await expect(floating.locator('nav')).toBeVisible()
    await floating.getByRole('link', { name: 'Install' }).click()
    await expect(floating.locator('nav')).toHaveCount(0)

    await show.click()
    await floating.getByRole('link', { name: 'Overview' }).focus()
    await page.keyboard.press('Escape')
    await expect(floating.locator('nav')).toHaveCount(0)
    await expect(show).toBeFocused()
  })
})
