// `prefers-contrast: more` and `data-nb-contrast="more"`.
//
// Inside the scope every layer border, and `--nb-c-border` with them, has to
// clear 3:1 against its own plane in both themes, and the subtle and
// placeholder tiers have to clear AAA on every plane. The fills do not move.

import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import * as sass from 'sass-embedded'
import { propsFrom, ratio, resolver } from '../scripts/lib/layerTokens.mjs'

const NON_TEXT = 3.0
const AAA = 7.0
const LEVELS = [0, 1, 2, 3] as const

const { css } = sass.compileString(
  `@use 'theme'; @use 'contrast';
   @include theme.base(); @include theme.light(); @include theme.dark();
   @include contrast.contrast();`,
  { loadPaths: [resolve(__dirname, '../src/styles')], style: 'compressed' },
)

const root = propsFrom(css, /^:root$/)
const dark = propsFrom(css, /(^|\s)\.dark$/)
const moreLight = propsFrom(css, /^\[data-nb-contrast=["']?more["']?\]$/)
const moreDark = propsFrom(css, /^\.dark\[data-nb-contrast=["']?more["']?\],/)

const themes = {
  light: resolver([root, moreLight]),
  dark: resolver([root, dark, moreDark]),
}

describe.each(['light', 'dark'] as const)('%s, more contrast', (theme) => {
  const get = themes[theme]

  it('declares its overrides', () => {
    const scope = theme === 'light' ? moreLight : moreDark
    expect(Object.keys(scope)).toContain('--nb-c-layer-border-0')
    expect(scope['--nb-c-border']).toBe('var(--nb-c-layer-border-1)')
  })

  it.each(LEVELS)('holds the layer-%i border at 3:1 on its plane', (level) => {
    expect(
      ratio(get(`--nb-c-layer-border-${level}`), get(`--nb-c-layer-${level}`)),
    ).toBeGreaterThanOrEqual(NON_TEXT)
  })

  it.each(LEVELS)(
    'lifts subtle and placeholder to AAA on layer %i',
    (level) => {
      const surface = get(`--nb-c-layer-${level}`)
      expect(ratio(get('--nb-c-text-subtle'), surface)).toBeGreaterThanOrEqual(
        AAA,
      )
      expect(
        ratio(get('--nb-c-text-placeholder'), surface),
      ).toBeGreaterThanOrEqual(AAA)
    },
  )

  it('leaves the fills alone', () => {
    const scope = theme === 'light' ? moreLight : moreDark
    for (const level of LEVELS)
      expect(scope[`--nb-c-layer-${level}`]).toBeUndefined()
  })
})

describe('the media query', () => {
  it('applies the same values unless the page opts out', () => {
    expect(css).toMatch(/@media\s*\(prefers-contrast:\s*more\)/)
    expect(css).toMatch(/:root:not\(\[data-nb-contrast=["']?standard["']?\]\)/)
  })
})
