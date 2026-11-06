// The focus ring has to be findable on every surface a control can sit on.
//
// WCAG 1.4.11 asks 3:1 of the ring against the ground beside it. A control
// can sit on any layer, resting or hovered, and on any per-plane state
// surface (a focused row that is also selected), so the ring is measured
// against all of them in both themes. The dark primary alone measured 2.89 on
// layer-2 and 2.27 on layer-3, which is the defect this guards: a keyboard
// user lost the ring inside every dark dialog.

import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import * as sass from 'sass-embedded'
import {
  loadThemeResolvers,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const NON_TEXT = 3.0
const LEVELS = [0, 1, 2, 3] as const
const STATES = ['accent', 'selected', 'selected-hover', 'active'] as const

type Theme = 'light' | 'dark'
const resolvers = loadThemeResolvers()

/** Evaluates `color-mix(in srgb, var(A) n%, var(B))` the way a browser does. */
function evalMix(theme: Theme, name: string): string {
  const get = resolvers[theme]
  const raw = get(name)
  expect(raw, `${theme}: ${name} does not resolve`).toBeTruthy()
  const m = String(raw).match(
    /color-mix\(\s*in srgb\s*,\s*var\((--nb-[\w-]+)\)\s*([\d.]+)%\s*,\s*var\((--nb-[\w-]+)\)\s*\)/,
  )
  expect(m, `${theme}: unexpected form ${raw}`).toBeTruthy()
  const a = parseColor(get(m![1]))
  const b = parseColor(get(m![3]))
  expect(a && b).toBeTruthy()
  const w = Number(m![2]) / 100
  return `rgb(${a!.map((v, i) => v * w + b![i] * (1 - w)).join(',')})`
}

describe.each(['light', 'dark'] as Theme[])('%s focus ring', (theme) => {
  const ring = evalMix(theme, '--nb-c-focus-ring')
  const get = resolvers[theme]

  it.each(LEVELS)('clears 3:1 on layer %i, resting and hovered', (level) => {
    expect(ratio(ring, get(`--nb-c-layer-${level}`))).toBeGreaterThanOrEqual(
      NON_TEXT,
    )
    expect(
      ratio(ring, get(`--nb-c-layer-hover-${level}`)),
    ).toBeGreaterThanOrEqual(NON_TEXT)
  })

  it.each(LEVELS)('clears 3:1 on every state surface of plane %i', (level) => {
    for (const role of STATES) {
      expect(
        ratio(ring, get(`--nb-c-layer-${role}-${level}`)),
        role,
      ).toBeGreaterThanOrEqual(NON_TEXT)
    }
  })
})

describe('the two halves', () => {
  it('is the primary itself in light, so light rings look as they did', () => {
    expect(String(resolvers.light('--nb-c-focus-ring'))).toMatch(
      /var\(--nb-c-primary\)\s*100%/,
    )
  })

  it('takes the selected edge lift in dark', () => {
    expect(String(resolvers.dark('--nb-c-focus-ring'))).toMatch(
      /var\(--nb-c-primary\)\s*70%/,
    )
  })
})

describe('a named theme', () => {
  const { css } = sass.compileString(
    `@use 'theme-api' as nb;
     @include nb.app-theme('probe', $category: 'engineers');`,
    { loadPaths: [resolve(__dirname, '../src/styles')], style: 'expanded' },
  )

  it('re-emits the lifted ring in its dark scope', () => {
    // A `:root` declaration freezes to the root primary (see _accent.scss),
    // so the themed dark scope has to carry its own.
    const darkBlocks = [
      ...css.matchAll(/\.dark\[data-nb-theme='?probe'?\][^{]*\{([^}]*)\}/g),
    ]
      .map((m) => m[1])
      .join('\n')
    expect(darkBlocks).toMatch(
      /--nb-c-focus-ring:\s*color-mix\(\s*in srgb,\s*var\(--nb-c-primary\) 70%/,
    )
  })
})
