// CSS-color → PixiJS numeric color, with CSS custom-property resolution.
//
// Wire and card colors arrive as CSS color strings: concrete (`#38bdf8`,
// `rgb(...)`) for resolved wires, but possibly a `var(--token)` for card
// accents or the grid. PixiJS `Color` parses concrete strings but not
// `var(...)`, so we resolve custom properties against a reference element's
// computed style first, then hand the result to `Color`. Lookups are cached
// because getComputedStyle is not free and the same tokens recur across
// thousands of wires.

import type * as PIXI from 'pixi.js'

export type TColorResolver = (
  css: string | undefined,
  fallback: number,
) => number

const VAR_RE = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/

/**
 * Build a resolver bound to a PixiJS module and a reference element (used to
 * resolve CSS custom properties). The returned function converts a CSS color
 * string to a 24-bit RGB number, returning `fallback` for empty/unparseable
 * input so a bad token never throws mid-render.
 */
export function makeColorResolver(
  Pixi: typeof PIXI,
  el: HTMLElement,
): TColorResolver {
  const cache = new Map<string, number>()

  function resolveVar(css: string): string {
    const m = css.match(VAR_RE)
    if (!m) return css
    const token = m[1]!
    const fallbackExpr = m[2]?.trim()
    const styles = getComputedStyle(el)
    const value = styles.getPropertyValue(token).trim()
    if (value) return value
    // Nested var fallback (e.g. var(--a, var(--b, #fff))): recurse.
    if (fallbackExpr) return resolveVar(fallbackExpr)
    return css
  }

  return (css, fallback) => {
    if (!css) return fallback
    const hit = cache.get(css)
    if (hit !== undefined) return hit
    let out: number
    try {
      const resolved = css.includes('var(') ? resolveVar(css) : css
      out = new Pixi.Color(resolved).toNumber()
    } catch {
      out = fallback
    }
    cache.set(css, out)
    return out
  }
}
