// AI presence must never cost legibility.
//
// `.nb-ai-presence` washes a container with the accent. Text sits on top of
// that wash, so the wash is composited over every layer and every hover
// surface, at its strongest point, and measured there. Primary text is held
// to AAA everywhere and muted text to AAA in light, the bar the layer ramp
// itself is held to (layerContrast.test.ts). Dark muted text measures 7.01 on
// the deepest hover surface with no wash at all, so no tint can keep it at
// AAA: there it is held within half a point of AAA.
//
// It also guards the promise the treatment was agreed on: every value is
// derived from the primary and the border, never a fixed hue, and it is
// re-emitted wherever the primary can be re-pointed.

import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import * as sass from 'sass-embedded'
import {
  ROOT,
  loadThemeResolvers,
  parseColor,
  propsFrom,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const AAA = 7.0
/**
 * Dark muted text, with the wash. It cannot be AAA (see above), so it is held
 * within half a point of it, which is also comfortably over AA.
 */
const DARK_MUTED_FLOOR = 6.5
const LEVELS = [0, 1, 2, 3] as const
type Theme = 'light' | 'dark'

const css = sass.compileString(`@use 'ai';`, {
  loadPaths: [resolve(ROOT, 'src/styles')],
  style: 'compressed',
}).css

const aiProps: Record<Theme, Record<string, string>> = {
  light: propsFrom(css, /^:root,\[data-nb-theme\]$/),
  dark: propsFrom(css, /^\.dark,/),
}

const resolvers = loadThemeResolvers()

/** The accent weight of `color-mix(in srgb, var(--nb-c-primary) n%, transparent)`. */
function auraWeight(theme: Theme): number {
  const raw = aiProps[theme]['--nb-c-ai-aura']
  expect(raw, `${theme}: --nb-c-ai-aura is not emitted`).toBeTruthy()
  const m = raw.match(
    /color-mix\(\s*in srgb\s*,\s*var\(--nb-c-primary\)\s*([\d.]+)%\s*,\s*transparent\s*\)/,
  )
  expect(m, `${theme}: unexpected form ${raw}`).toBeTruthy()
  return Number(m![1]) / 100
}

/** The aura painted over a surface, the way a browser composites it. */
function over(surface: string, theme: Theme): string {
  const w = auraWeight(theme)
  const p = parseColor(resolvers[theme]('--nb-c-primary'))
  const s = parseColor(surface)
  expect(p && s).toBeTruthy()
  const c = p!.map((v, i) => v * w + s![i] * (1 - w))
  return `rgb(${c.join(',')})`
}

describe.each(['light', 'dark'] as Theme[])('%s AI presence', (theme) => {
  const get = resolvers[theme]

  it('keeps the wash between 4% and 12% of the accent', () => {
    const w = auraWeight(theme)
    expect(w).toBeGreaterThanOrEqual(0.04)
    expect(w).toBeLessThanOrEqual(0.12)
  })

  it.each(LEVELS)(
    'keeps text legible on layer %i, resting and hovered',
    (level) => {
      for (const surface of [
        get(`--nb-c-layer-${level}`) as string,
        get(`--nb-c-layer-hover-${level}`) as string,
      ]) {
        const washed = over(surface, theme)
        for (const text of ['--nb-c-text', '--nb-c-text-muted']) {
          const ink = get(text) as string
          const bar =
            theme === 'dark' && text === '--nb-c-text-muted'
              ? DARK_MUTED_FLOOR
              : AAA
          const measured = ratio(ink, washed) as number
          expect(measured, `${text} on layer ${level}`).toBeGreaterThanOrEqual(
            bar,
          )
        }
      }
    },
  )

  it('draws the edge from the accent into the border, with no literal colour', () => {
    const p = aiProps[theme]
    expect(p['--nb-c-ai-border-start']).toMatch(
      /color-mix\(\s*in srgb,\s*var\(--nb-c-primary\) 50%,\s*var\(--nb-c-border\)\s*\)/,
    )
    expect(p['--nb-c-ai-border-end']).toBe('var(--nb-c-border)')
    for (const value of Object.values(p)) {
      expect(value).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(/i)
    }
  })
})

describe('AI presence scopes', () => {
  it('re-emits the tokens in every named theme scope, both modes', () => {
    expect(css).toMatch(/:root,\[data-nb-theme\]\{--nb-c-ai-aura/)
    expect(css).toMatch(
      /\.dark,\.dark\[data-nb-theme\],\.dark \[data-nb-theme\]\{--nb-c-ai-aura/,
    )
  })

  it('re-declares them on the container, so the edge follows its layer', () => {
    expect(propsFrom(css, /^\.nb-ai-presence$/)['--nb-c-ai-border-end']).toBe(
      'var(--nb-c-border)',
    )
    expect(
      propsFrom(css, /^\.dark \.nb-ai-presence,\.dark\.nb-ai-presence$/)[
        '--nb-c-ai-aura'
      ],
    ).toMatch(/var\(--nb-c-primary\)/)
  })
})
