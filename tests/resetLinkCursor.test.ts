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
})
