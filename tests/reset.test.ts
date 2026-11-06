/**
 * The reset is a baseline, never a winner.
 *
 * A product's component sheet can load before the app sheet that carries the
 * reset (a route chunk did, on a contact form), and an element reset at
 * normal specificity then beats the component's own class. Every element
 * selector in the reset therefore sits inside `:where()`, which has zero
 * specificity, so load order stops mattering.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { compileString } from 'sass-embedded'

const path = join(import.meta.dirname, '../src/styles/_reset.scss')
const css = compileString(readFileSync(path, 'utf8'), {
  url: pathToFileURL(path),
}).css.replace(/\/\*[\s\S]*?\*\//g, '')

/** Top-level selectors of the compiled reset, one per rule. */
function selectors(): string[] {
  return [...css.matchAll(/(?:^|\n)([^@{}/][^{}]*?)\s*\{/g)].map((m) =>
    m[1].replace(/\s+/g, ' ').trim(),
  )
}

// Rules that keep their natural specificity, each for a reason written in
// the stylesheet.
const KEPT = new Set(['*', '[hidden]'])

describe('reset specificity', () => {
  it('compiles to more than a handful of rules', () => {
    expect(selectors().length).toBeGreaterThan(30)
  })

  it('puts every element selector inside :where()', () => {
    const loud = selectors().filter((selector) => {
      if (KEPT.has(selector)) return false
      // A pseudo-element on its own is fine: it carries no element.
      if (selector.startsWith('::')) return false
      // Each comma-separated part must be a :where(...) group, optionally
      // followed by one pseudo-element, or `a:where([href])`.
      return selector
        .split(/,\s*(?![^(]*\))/)
        .some(
          (part) =>
            !/^:where\([^{}]*\)(::[a-z-]+)?$/.test(part.trim()) &&
            part.trim() !== 'a:where([href])',
        )
    })
    expect(loud).toEqual([])
  })

  it('keeps [hidden] winning over a component display', () => {
    expect(selectors()).toContain('[hidden]')
  })
})
