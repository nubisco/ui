// The edge that marks a selected card or stat tile has to be findable.
//
// WCAG 1.4.11 asks 3:1 of a state indicator against what sits next to it. For
// this edge that is the card it outlines and the page around it, and a card can
// sit on any layer, so it is measured against every resting layer and every
// hover surface (a selected card is still hovered). The dark primary alone
// measured 2.89 on layer-2 and 2.27 on layer-3, which is the defect this guards.

import { describe, it, expect } from 'vitest'
import {
  loadThemeResolvers,
  parseColor,
  ratio,
} from '../scripts/lib/layerTokens.mjs'

const NON_TEXT = 3.0
const LEVELS = [0, 1, 2, 3] as const

type Theme = 'light' | 'dark'
const resolvers = loadThemeResolvers()

/** Evaluates the token's `color-mix(in srgb, A n%, B)` the way a browser does. */
function selectedEdge(theme: Theme): string {
  const get = resolvers[theme]
  const raw = get('--nb-c-selected-edge')
  expect(raw, `${theme}: --nb-c-selected-edge does not resolve`).toBeTruthy()
  const m = String(raw).match(
    /color-mix\(\s*in srgb\s*,\s*var\((--nb-[\w-]+)\)\s*([\d.]+)%\s*,\s*var\((--nb-[\w-]+)\)\s*\)/,
  )
  expect(m, `${theme}: unexpected form ${raw}`).toBeTruthy()
  const a = parseColor(get(m![1]))
  const b = parseColor(get(m![3]))
  expect(a && b).toBeTruthy()
  const w = Number(m![2]) / 100
  const c = a!.map((v, i) => v * w + b![i] * (1 - w))
  return `rgb(${c.join(',')})`
}

describe.each(['light', 'dark'] as Theme[])('%s selected edge', (theme) => {
  const edge = selectedEdge(theme)
  const get = resolvers[theme]

  it.each(LEVELS)('clears 3:1 on layer %i, resting and hovered', (level) => {
    const surface = get(`--nb-c-layer-${level}`) as string
    const hover = get(`--nb-c-layer-hover-${level}`) as string
    expect(ratio(edge, surface)).toBeGreaterThanOrEqual(NON_TEXT)
    expect(ratio(edge, hover)).toBeGreaterThanOrEqual(NON_TEXT)
  })
})

describe('light selected edge', () => {
  it('is the primary itself, so light cards look as they did', () => {
    const raw = String(resolvers.light('--nb-c-selected-edge'))
    expect(raw).toMatch(/var\(--nb-c-primary\)\s*100%/)
  })
})
