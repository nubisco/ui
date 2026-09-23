import { test, expect, type Page, type Locator } from '@playwright/test'

/**
 * The three sizes of a bottom panel, measured rather than inferred from
 * classes.
 *
 * Every defect here was invisible to the jsdom suite, because every one of
 * them is a resolved flex length. The size classes were always correct: what
 * the browser did with them was not.
 *
 * Measured on the buggy build, on the demo below, with a 120-line console:
 *
 *   size        bottom region      main row
 *   Minimize      7%                93%      (fine)
 *   Default     686%                 0px     page gone, panel overflowing
 *   Maximize     50%                50%      "maximized" stops halfway
 *
 * Two independent causes:
 *
 *  - `.nb-shell__bottom` is `flex-shrink: 0` and took its height from its
 *    content, so a long log grew the region past the body and squeezed the
 *    main row to zero. The intermediate size exists precisely so that part of
 *    the page and part of the panel are visible at once, and any console with
 *    real content in it destroyed the page instead.
 *  - `full` hid `.nb-shell__main` but not the `.nb-shell__main-row` wrapping
 *    it, so the wrapper kept its `flex: 1` and went on claiming half the body
 *    as blank space.
 *
 * Reported from an application whose log console sits in `#bottom`.
 */

const SHELL_DEMO = '/components/shell'

/** The one shell on the page that actually has a bottom region. */
function shellWithBottom(page: Page): Locator {
  return page.locator('.nb-shell__body:has(> .nb-shell__bottom)').first()
}

async function shareOf(body: Locator, selector: string): Promise<number> {
  return body.evaluate((el, sel) => {
    const total = el.getBoundingClientRect().height
    const part = el.querySelector(sel)
    if (!part) return 0
    return (part.getBoundingClientRect().height / total) * 100
  }, selector)
}

async function setSize(
  body: Locator,
  label: 'Minimize' | 'Default' | 'Maximize',
) {
  await body.locator(`.nb-shell__bottom button[aria-label="${label}"]`).click()
  // The class lands synchronously, but the flex pass that follows it is the
  // thing under test, so let the frame settle before reading a box.
  await body.page().waitForTimeout(150)
}

/** Fill the console with more lines than the panel can show. */
async function fillWithLongLog(body: Locator) {
  await body.evaluate((el) => {
    const inner = el.querySelector(
      '.nb-shell__bottom .nb-shell-panel__content > div',
    )
    if (!inner) throw new Error('demo console body not found')
    inner.innerHTML = Array.from(
      { length: 120 },
      (_, i) => `<div>&gt; line ${i}</div>`,
    ).join('')
  })
  await body.page().waitForTimeout(250)
}

test.describe('NbShell bottom panel sizing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(SHELL_DEMO)
    await expect(shellWithBottom(page)).toBeVisible()
    await shellWithBottom(page).scrollIntoViewIfNeeded()
  })

  test('collapsed shows only the header and leaves the page its space', async ({
    page,
  }) => {
    const body = shellWithBottom(page)
    await setSize(body, 'Minimize')

    expect(await shareOf(body, '.nb-shell__bottom')).toBeLessThan(20)
    await expect(body.locator('.nb-shell__main-row')).toBeVisible()
  })

  test('default takes a fixed share, not whatever its content measures', async ({
    page,
  }) => {
    const body = shellWithBottom(page)
    await setSize(body, 'Default')

    // Near the --nb-shell-bottom-height default of 33%. A content-sized region
    // lands somewhere else entirely (24% empty, 686% full), so this one
    // assertion catches the bug in both directions.
    const bottom = await shareOf(body, '.nb-shell__bottom')
    expect(bottom).toBeGreaterThan(28)
    expect(bottom).toBeLessThan(38)

    await expect(body.locator('.nb-shell__main-row')).toBeVisible()
    expect(await shareOf(body, '.nb-shell__main-row')).toBeGreaterThan(55)
  })

  test('default survives a long log: the page keeps its space', async ({
    page,
  }) => {
    const body = shellWithBottom(page)
    await setSize(body, 'Default')
    await fillWithLongLog(body)

    // The regression, exactly as reported: with a real console in it the
    // region grew to 686% of the body and the page went to 0px.
    const bottom = await shareOf(body, '.nb-shell__bottom')
    expect(bottom).toBeLessThan(38)
    expect(await shareOf(body, '.nb-shell__main-row')).toBeGreaterThan(55)
  })

  test('full fills the body rather than stopping halfway', async ({ page }) => {
    const body = shellWithBottom(page)
    await setSize(body, 'Maximize')

    // The page gives way entirely, wrapper included: hiding only the inner
    // `.nb-shell__main` left the row holding flex: 1 and capped this at 50%.
    await expect(body.locator('.nb-shell__main-row')).toBeHidden()
    expect(await shareOf(body, '.nb-shell__bottom')).toBeGreaterThan(90)
  })

  test('a maximized panel scrolls its own content instead of clipping it', async ({
    page,
  }) => {
    const body = shellWithBottom(page)
    await setSize(body, 'Maximize')
    await fillWithLongLog(body)

    const content = body.locator('.nb-shell__bottom .nb-shell-panel__content')
    await expect(content).toBeVisible()

    // A bounded box is the precondition for scrolling at all: an unbounded one
    // grows to its content and is silently clipped by the panel's overflow.
    const { clientHeight, scrollHeight } = await content.evaluate((el) => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }))
    expect(clientHeight).toBeGreaterThan(0)
    expect(scrollHeight).toBeGreaterThan(clientHeight)
  })
})
