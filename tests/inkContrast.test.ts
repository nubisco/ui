// Semantic colours drawn as ink, and the fills they label, measured.
//
// An outlined button draws its variant colour straight onto a layer, with no
// fill behind it. In the dark theme the secondary did that at 1.21:1 to 2.15:1,
// unreadable, because the dark secondary is a mid grey picked to carry white
// text, not to be read on a dark surface. The fix lifts each colour toward
// white by `--nb-c-<variant>-ink-lift` (see `src/styles/logic/_ink.scss`), and
// this file holds the lift to its job: AA on every dark layer, and on the wash
// an outlined button paints when pressed.
//
// It also measures the filled pairs. The dark theme moves several fills to a
// lighter step, and three of them (primary hover and active, info, danger)
// had kept the white foreground chosen for the light step, at 3.01 to 3.82:1.

import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import * as sass from 'sass-embedded'
import {
  loadThemeResolvers,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const AA = 4.5
const LEVELS = [0, 1, 2, 3] as const
const VARIANTS = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'danger',
] as const
/** The washes an outlined button paints under its own ink. */
const HOVER_WASH = 0.08
const PRESSED_WASH = 0.14

const resolvers = loadThemeResolvers()

type TRgb = [number, number, number]

/** `color-mix(in srgb, a, b t)`: a straight blend of the encoded channels. */
function mix(a: TRgb, b: TRgb, t: number): TRgb {
  return a.map((c, i) => c * (1 - t) + b[i] * t) as TRgb
}

const css = (c: TRgb) => `rgb(${c.join(', ')})`

function rgb(value: string | null, name: string): TRgb {
  const parsed = parseColor(value)
  expect(parsed, `${name} does not resolve to a colour (${value})`).toBeTruthy()
  return parsed as TRgb
}

/** The lift a theme declares, as a fraction. Undeclared is 0, as in the CSS. */
function liftOf(get: (n: string) => string | null, variant: string): number {
  const value = get(`--nb-c-${variant}-ink-lift`)
  if (value == null) return 0
  const match = /^([\d.]+)%$/.exec(value)
  expect(match, `--nb-c-${variant}-ink-lift is not a percentage`).toBeTruthy()
  return Number((match as RegExpExecArray)[1]) / 100
}

describe.each(['light', 'dark'] as const)('ink in the %s theme', (theme) => {
  const get = resolvers[theme]
  const toward = rgb(get('--nb-c-ink-toward'), '--nb-c-ink-toward')
  const layers = LEVELS.map((i) =>
    rgb(get(`--nb-c-layer-${i}`), `--nb-c-layer-${i}`),
  )

  it('moves away from the surface: toward black in light, white in dark', () => {
    expect(toward).toEqual(theme === 'light' ? [0, 0, 0] : [255, 255, 255])
  })

  describe.each(VARIANTS)('%s', (variant) => {
    const base = rgb(get(`--nb-c-${variant}`), `--nb-c-${variant}`)
    const ink = mix(base, toward, liftOf(get, variant))

    it.each(LEVELS)('clears AA on layer %i', (level) => {
      expect(ratio(css(ink), css(layers[level]))).toBeGreaterThanOrEqual(AA)
    })

    it.each(LEVELS)('clears AA on its hover wash over layer %i', (level) => {
      const wash = mix(layers[level], base, HOVER_WASH)
      expect(ratio(css(ink), css(wash))).toBeGreaterThanOrEqual(AA)
    })

    it.each(LEVELS)('clears AA on its pressed wash over layer %i', (level) => {
      const wash = mix(layers[level], base, PRESSED_WASH)
      expect(ratio(css(ink), css(wash))).toBeGreaterThanOrEqual(AA)
    })
  })
})

describe('the lifts that were needed', () => {
  // The two reports this exists for: the dark secondary, and the light
  // warning and success, all of which failed as outlined labels.
  it('lifts the dark secondary', () => {
    expect(liftOf(resolvers.dark, 'secondary')).toBeGreaterThan(0)
  })

  it('darkens the light warning and success', () => {
    expect(liftOf(resolvers.light, 'warning')).toBeGreaterThan(0)
    expect(liftOf(resolvers.light, 'success')).toBeGreaterThan(0)
  })

  it('leaves light primary and secondary alone, they already clear AA', () => {
    expect(liftOf(resolvers.light, 'primary')).toBe(0)
    expect(liftOf(resolvers.light, 'secondary')).toBe(0)
  })
})

describe.each(['light', 'dark'] as const)('%s filled pairs', (theme) => {
  const get = resolvers[theme]

  describe.each(VARIANTS)('%s', (variant) => {
    it.each(['', '-hover', '-active'])(
      'fill%s carries its -a11y foreground at AA',
      (state) => {
        const fill = get(`--nb-c-${variant}${state}`)
        const text = get(`--nb-c-${variant}${state}-a11y`)
        expect(ratio(text, fill)).toBeGreaterThanOrEqual(AA)
      },
    )
  })
})

describe('a named theme with its own dark colour', () => {
  const compiled = sass.compileString(
    `@use 'theme-api' as nb;
     @include nb.theme('t', $dark: (primary: #a99dff, danger: #ff8a8a));
     @include nb.theme('u', $dark: (primary: #a99dff, primary-ink-lift: 20%));
     @include nb.app-theme('a', $category: 'engineers');
     @include nb.theme('l', $light: (warning: #8a5a00));`,
    { loadPaths: [resolve('src/styles')], style: 'expanded' },
  ).css

  const lightBlock = (id: string) => {
    const match = new RegExp(
      `(?:^|\\n)\\[data-nb-theme=["']?${id}["']?\\][^{]*\\{([^}]*)\\}`,
    ).exec(compiled)
    expect(match, `no light block for ${id}`).toBeTruthy()
    return (match as RegExpExecArray)[1]
  }

  const darkBlock = (id: string) => {
    const match = new RegExp(
      `\\.dark\\[data-nb-theme=["']?${id}["']?\\][^{]*\\{([^}]*)\\}`,
    ).exec(compiled)
    expect(match, `no dark block for ${id}`).toBeTruthy()
    return (match as RegExpExecArray)[1]
  }

  it('turns the lift off for the variants it colours, and only those', () => {
    const block = darkBlock('t')
    expect(block).toMatch(/--nb-c-primary-ink-lift:\s*0%/)
    expect(block).toMatch(/--nb-c-danger-ink-lift:\s*0%/)
    expect(block).not.toMatch(/--nb-c-secondary-ink-lift/)
  })

  it('lets the theme ask for a lift of its own', () => {
    const block = darkBlock('u')
    const declared = [...block.matchAll(/--nb-c-primary-ink-lift:\s*([^;]+);/g)]
    expect(declared.at(-1)?.[1].trim()).toBe('20%')
  })

  it('covers app-theme, whose accents already clear AA on every layer', () => {
    expect(darkBlock('a')).toMatch(/--nb-c-primary-ink-lift:\s*0%/)
    expect(lightBlock('a')).toMatch(/--nb-c-primary-ink-lift:\s*0%/)
  })

  it('turns the light lift off for a variant it colours in light', () => {
    expect(lightBlock('l')).toMatch(/--nb-c-warning-ink-lift:\s*0%/)
    expect(lightBlock('l')).not.toMatch(/--nb-c-success-ink-lift/)
  })

  it('gives a light-only colour the dark lift back in a dark document', () => {
    // The light scope applies in both modes, so without this its 0% would
    // leave the theme's light warning unlifted on a dark layer.
    expect(darkBlock('l')).toMatch(/--nb-c-warning-ink-lift:\s*6%/)
  })
})
