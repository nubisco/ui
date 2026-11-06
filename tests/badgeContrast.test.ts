// NbBadge's intents paint the status surface pairs, measured here.
//
// Badge text is 10px and 11px, so it is held to 4.5:1 with no large-text
// allowance. In light the surfaces are solid tints. In dark they are 16%
// washes of the status colour over whatever plane the badge sits on, which a
// static audit cannot measure (it reports null), so this composites the wash
// over each of the four layers the way a browser does and measures that.
// The primary badge is the filled accent with its `-a11y` foreground.

import { describe, it, expect } from 'vitest'
import {
  loadThemeResolvers,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const AA = 4.5
const LEVELS = [0, 1, 2, 3] as const
const INTENTS = ['neutral', 'info', 'success', 'warning', 'danger'] as const
type Theme = 'light' | 'dark'
const resolvers = loadThemeResolvers()

/** Resolves a colour, compositing `color-mix(in srgb, C n%, transparent)`. */
function ground(theme: Theme, name: string, layer: string): string {
  const raw = String(resolvers[theme](name))
  const wash = raw.match(
    /color-mix\(\s*in srgb\s*,\s*(#[0-9a-f]{3,6}|rgb\([^)]*\))\s+([\d.]+)%\s*,\s*transparent\s*\)/i,
  )
  if (!wash) return raw
  const c = parseColor(wash[1]) as number[]
  const under = parseColor(layer) as number[]
  const a = Number(wash[2]) / 100
  return `rgb(${c.map((v, i) => v * a + under[i] * (1 - a)).join(',')})`
}

describe.each(['light', 'dark'] as Theme[])('%s badge intents', (theme) => {
  const get = resolvers[theme]

  describe.each(INTENTS)('%s', (intent) => {
    it.each(LEVELS)('carries its ink at AA on layer %i', (level) => {
      const layer = get(`--nb-c-layer-${level}`) as string
      const bg = ground(theme, `--nb-c-${intent}-surface`, layer)
      const ink = get(`--nb-c-on-${intent}-surface`) as string
      expect(parseColor(bg), `${intent} surface: ${bg}`).toBeTruthy()
      expect(ratio(ink, bg)).toBeGreaterThanOrEqual(AA)
    })
  })

  it('carries the primary badge foreground at AA', () => {
    expect(
      ratio(get('--nb-c-primary-a11y'), get('--nb-c-primary')),
    ).toBeGreaterThanOrEqual(AA)
  })
})
