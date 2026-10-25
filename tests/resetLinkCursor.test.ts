import { describe, it, expect } from 'vitest'
import { compileString } from 'sass-embedded'
import { resolve } from 'node:path'

// The reset's `a { all: unset }` took the browser's hand cursor off every link
// in every product. This pins the rule that gives it back, and its specificity.
describe('reset: link cursor', () => {
  const css = compileString('@use "reset"; @include reset.reset;', {
    loadPaths: [resolve(__dirname, '../src/styles')],
  }).css

  it('gives every real link the pointer cursor', () => {
    expect(css).toMatch(/a:where\(\[href\]\)\s*\{\s*cursor:\s*pointer;?\s*\}/)
  })

  it('comes after the anchor reset, so it is not unset again', () => {
    expect(css.indexOf('a:where([href])')).toBeGreaterThan(
      css.indexOf('all: unset'),
    )
  })

  it('resets anchors at zero specificity, so a component can position its own', () => {
    // NbButton gives its tap box a context with `:where(.nb-button--sm) {
    // position: relative }`. A bare `a { all: unset }` outranked it on every
    // link button and the box covered the page.
    expect(css).toMatch(/:where\(a\)\s*\{[^}]*all:\s*unset/)
    expect(css).not.toMatch(/(^|[\s,}])a\s*\{[^}]*all:\s*unset/)
  })
})
