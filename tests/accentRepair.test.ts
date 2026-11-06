// `app-theme()` repairs a supplied accent that fails the gate, and says so.
//
// The gate is 4.5:1 on every surface of the accent's mode. An accent under it
// is moved to the nearest lightness that clears it (via `a11y-color()`), the
// build prints what it did, and the emitted ramp is anchored on the repaired
// value. One that cannot be repaired without leaving its hue still fails the
// build. A pair that already clears comes through untouched and silent.

import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import * as sass from 'sass-embedded'
import { ratio } from '../scripts/lib/layerTokens.mjs'

const LIGHT = ['#edeeef', '#f9fafb', '#e7e8e9', '#f3f4f5']
const DARK = ['#0f1011', '#1e1f20', '#2d2e2f', '#3d3e3f']

function compile(accent: string) {
  const warnings: string[] = []
  const { css } = sass.compileString(
    `@use 'theme-api' as nb;
     @include nb.app-theme('probe', $category: 'engineers', $accent: ${accent});`,
    {
      loadPaths: [resolve(__dirname, '../src/styles')],
      logger: { warn: (message: string) => warnings.push(message) },
    },
  )
  return { css, warnings }
}

const repairedValue = (warning: string) =>
  /Repaired to (#[0-9a-f]{6})/i.exec(warning)?.[1] as string

describe('a supplied accent that fails the gate', () => {
  const { warnings } = compile('(#f5c400, #ff6600)')

  it('is repaired, with a warning per half that needed it', () => {
    expect(warnings).toHaveLength(2)
    expect(warnings[0]).toMatch(/Accent #f5c400 was 1\.34:1 on light surface/)
    expect(warnings[1]).toMatch(/Accent #ff6600 was 3\.65:1 on dark surface/)
  })

  it('lands on a value that clears 4.5:1 on every surface of its mode', () => {
    const light = repairedValue(warnings[0])
    const dark = repairedValue(warnings[1])
    for (const g of LIGHT)
      expect(ratio(light, g), `${light} on ${g}`).toBeGreaterThanOrEqual(4.5)
    for (const g of DARK)
      expect(ratio(dark, g), `${dark} on ${g}`).toBeGreaterThanOrEqual(4.5)
  })
})

describe('a supplied accent that already clears', () => {
  it('passes through untouched and silent', () => {
    const { warnings } = compile('(#0b7285, #41d6e0)')
    expect(warnings).toHaveLength(0)
  })
})

describe('a hue that cannot be repaired', () => {
  it('still fails the build, with the measurements', () => {
    // Navy lightened far enough to read on a dark layer turns periwinkle:
    // 18 degrees of OKLCH hue, past the 12 the repair allows.
    expect(() => compile('(#5b48c9, #000080)')).toThrow(
      /cannot be repaired without leaving its hue/,
    )
  })
})
