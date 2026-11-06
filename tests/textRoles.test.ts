// The text and status roles beyond the three text tiers, measured.
//
// Placeholder, icon, error text, link (with hover and visited) and the info
// and neutral status glyphs each have a bar of their own: 4.5:1 for anything
// a person reads, 3:1 for a glyph. They are measured on every ground they can
// land on, which is every layer and its hover in both themes, and for text
// that sits in a field, every per-plane field fill.

import { describe, it, expect } from 'vitest'
import {
  loadThemeResolvers,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const AA = 4.5
const NON_TEXT = 3.0
const LEVELS = [0, 1, 2, 3] as const

type Theme = 'light' | 'dark'
type TRgb = [number, number, number]
const resolvers = loadThemeResolvers()

function rgb(value: string | null, name: string): TRgb {
  const parsed = parseColor(value)
  expect(parsed, `${name} does not resolve (${value})`).toBeTruthy()
  return parsed as TRgb
}

/** `color-mix(in srgb, a, b t)`. */
const mix = (a: TRgb, b: TRgb, t: number): TRgb =>
  a.map((c, i) => c * (1 - t) + b[i] * t) as TRgb
const css = (c: TRgb) => `rgb(${c.join(', ')})`

function lift(get: (n: string) => string | null): number {
  const v = get('--nb-c-primary-ink-lift')
  return v == null ? 0 : Number(String(v).replace('%', '')) / 100
}

describe.each(['light', 'dark'] as Theme[])('%s text roles', (theme) => {
  const get = resolvers[theme]
  const need = (name: string) => rgb(get(name), name)
  const grounds = LEVELS.flatMap((i) => [
    need(`--nb-c-layer-${i}`),
    need(`--nb-c-layer-hover-${i}`),
  ])
  const fields = LEVELS.map((i) => need(`--nb-c-layer-field-${i}`))
  const worst = (c: TRgb, on: TRgb[]) =>
    Math.min(...on.map((g) => ratio(css(c), css(g)) as number))

  it('carries placeholder text at AA on every field fill', () => {
    expect(
      worst(need('--nb-c-text-placeholder'), fields),
    ).toBeGreaterThanOrEqual(AA)
  })

  it('carries error text at AA on every layer and hover', () => {
    expect(worst(need('--nb-c-text-error'), grounds)).toBeGreaterThanOrEqual(AA)
  })

  it.each(['--nb-c-icon', '--nb-c-status-info', '--nb-c-status-neutral'])(
    '%s clears 3:1 on every layer and hover',
    (name) => {
      expect(worst(need(name), grounds)).toBeGreaterThanOrEqual(NON_TEXT)
    },
  )

  describe('links', () => {
    const toward = need('--nb-c-ink-toward')
    const link = mix(need('--nb-c-primary'), toward, lift(get))
    const hover = mix(need('--nb-c-primary-hover'), toward, lift(get))
    const visited = mix(link, need('--nb-c-text-muted'), 0.3)

    it('emits the three link states', () => {
      for (const n of [
        '--nb-c-link',
        '--nb-c-link-hover',
        '--nb-c-link-visited',
      ])
        expect(get(n), n).toMatch(/^color-mix\(/)
    })

    it('reads at AA on every layer and hover, in every state', () => {
      expect(worst(link, grounds)).toBeGreaterThanOrEqual(AA)
      expect(worst(hover, grounds)).toBeGreaterThanOrEqual(AA)
      expect(worst(visited, grounds)).toBeGreaterThanOrEqual(AA)
    })
  })
})
