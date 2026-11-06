// The inverse family: a dark chip on a light page, a light chip on a dark one.
//
// Text on the inverse ground is held to AAA, the edge and the focus ring drawn
// on it to 3:1. The ring follows the accent, so it is measured for the default
// accent and for every category accent a product can theme itself with.

import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import * as sass from 'sass-embedded'
import {
  loadThemeResolvers,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const AAA = 7.0
const NON_TEXT = 3.0
type Theme = 'light' | 'dark'
const resolvers = loadThemeResolvers()

/** `color-mix(in srgb, A 50%, B)`, evaluated. */
function focusInverse(primary: string, theme: Theme): string {
  const p = parseColor(primary) as number[]
  const toward = theme === 'light' ? [255, 255, 255] : [16, 16, 16]
  return `rgb(${p.map((v, i) => v * 0.5 + toward[i] * 0.5).join(',')})`
}

const { css } = sass.compileString(
  `@use 'variables/categories' as c;
   @use 'sass:list';
   @each $name, $pair in c.$categories {
     .#{$name} { light: list.nth($pair, 1); dark: list.nth($pair, 2); }
   }`,
  { loadPaths: [resolve(__dirname, '../src/styles')], style: 'expanded' },
)
const categoryAccents = [
  ...css.matchAll(/\.([\w-]+) \{\s*light: (#\w+);\s*dark: (#\w+);/g),
].map((m) => ({ name: m[1], light: m[2], dark: m[3] }))

describe.each(['light', 'dark'] as Theme[])('%s inverse family', (theme) => {
  const get = resolvers[theme]
  const bg = get('--nb-c-bg-inverse') as string

  it('inverts against the page', () => {
    const page = get('--nb-c-layer-0') as string
    const lum = (c: string) => (parseColor(c) as number[])[0]
    if (theme === 'light') expect(lum(bg)).toBeLessThan(lum(page))
    else expect(lum(bg)).toBeGreaterThan(lum(page))
  })

  it('carries text-inverse at AAA', () => {
    expect(ratio(get('--nb-c-text-inverse'), bg)).toBeGreaterThanOrEqual(AAA)
  })

  it('holds border-inverse at 3:1 on the inverse ground', () => {
    expect(ratio(get('--nb-c-border-inverse'), bg)).toBeGreaterThanOrEqual(
      NON_TEXT,
    )
  })

  it('emits focus-inverse as a mix of the accent', () => {
    expect(String(get('--nb-c-focus-inverse'))).toMatch(
      /color-mix\(\s*in srgb,\s*var\(--nb-c-primary\) 50%/,
    )
  })

  it('holds focus-inverse at 3:1 for the default and every category', () => {
    expect(categoryAccents.length).toBeGreaterThanOrEqual(6)
    const accents = [
      get('--nb-c-primary') as string,
      ...categoryAccents.map((c) => c[theme]),
    ]
    for (const accent of accents) {
      expect(
        ratio(focusInverse(accent, theme), bg),
        accent,
      ).toBeGreaterThanOrEqual(NON_TEXT)
    }
  })
})
