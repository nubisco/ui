import { describe, it, expect } from 'vitest'
import { resolve, join } from 'node:path'
import * as sass from 'sass-embedded'
import tinycolor from 'tinycolor2'
import {
  TINTS,
  shadesOf,
  a11yOf,
  A11Y_ROLES,
} from '../docs/.vitepress/theme/components/theme-builder/themeModel'

/**
 * The builder's colour maths against the library's own.
 *
 * The theme builder previews a theme in JavaScript and exports SCSS that the
 * consumer's build compiles. Those are two implementations of one ramp, and a
 * preview that disagrees with the build is worse than no preview: it tells
 * you a theme is fine and ships something else. So this compiles the REAL
 * Sass through the public mixin and compares every step.
 */

const ROOT = resolve('.')

const BASES = [
  '#0f6f8c',
  '#2f6b3f',
  '#a4552b',
  '#5c35c4',
  '#6b7280',
  '#4acf7b',
  '#dc2626',
  '#f59e0b',
  '#b5122f',
  '#ffffff',
  '#000000',
]

function compilePalette(bases: string[]): string {
  const palette = bases.map((b, i) => `c${i}: ${b}`).join(', ')
  return sass.compileString(
    `@use '@nubisco/ui/styles/theme-api' as nb;\n@include nb.theme('parity', $palette: (${palette}));\n`,
    {
      loadPaths: [ROOT],
      importers: [
        {
          findFileUrl(url) {
            if (!url.startsWith('@nubisco/ui/')) return null
            return new URL(
              `file://${join(ROOT, 'src', url.slice('@nubisco/ui/'.length))}`,
            )
          },
        },
      ],
    },
  ).css
}

const css = compilePalette(BASES)

const sassValue = (index: number, tint: number, suffix = '') => {
  const match = css.match(
    new RegExp(`--nb-c-c${index}-${tint}${suffix}: ([^;]+);`),
  )
  if (!match) throw new Error(`no --nb-c-c${index}-${tint}${suffix} emitted`)
  return match[1].trim()
}

describe('the builder ramp matches the library ramp', () => {
  it('emits every declared tint for every colour', () => {
    for (let i = 0; i < BASES.length; i++) {
      for (const tint of TINTS) expect(() => sassValue(i, tint)).not.toThrow()
    }
  })

  /*
   * Within one 8-bit step, not identical strings. Sass keeps the ramp as
   * floating-point `rgb()` and the port rounds to hex, so a handful of steps
   * land a single channel apart. Measured across 11 bases and 17 steps: 183
   * of 187 are exact and the rest differ by 1/255, which no display can show.
   * The bound is asserted so a real divergence cannot hide behind it.
   */
  it('lands within one 8-bit step of the compiled value', () => {
    let worst = 0
    for (let i = 0; i < BASES.length; i++) {
      const js = shadesOf(BASES[i])
      for (const tint of TINTS) {
        const fromSass = tinycolor(sassValue(i, tint)).toRgb()
        const fromJs = tinycolor(js[tint]).toRgb()
        worst = Math.max(
          worst,
          Math.abs(fromSass.r - fromJs.r),
          Math.abs(fromSass.g - fromJs.g),
          Math.abs(fromSass.b - fromJs.b),
        )
      }
    }
    expect(worst).toBeLessThanOrEqual(1)
  })

  /*
   * The readable foreground has to agree EXACTLY: it is a choice between two
   * values, so there is no such thing as being close. This is the assertion
   * that caught the port using pure black where the library uses #101010,
   * which flipped the foreground on a mid-red from white to black.
   */
  it('chooses the same readable foreground on every step', () => {
    const disagreements: string[] = []
    for (let i = 0; i < BASES.length; i++) {
      const js = shadesOf(BASES[i])
      for (const tint of TINTS) {
        const fromSass = tinycolor(sassValue(i, tint, '-a11y')).toHexString()
        const fromJs = tinycolor(a11yOf(js[tint])).toHexString()
        if (fromSass !== fromJs) {
          disagreements.push(
            `${BASES[i]} @${tint}: sass ${fromSass}, builder ${fromJs}`,
          )
        }
      }
    }
    expect(disagreements).toEqual([])
  })
})

describe('the a11y role list', () => {
  it('matches the list the SCSS maintains', () => {
    const source = sass.compileString(
      `@use '@nubisco/ui/styles/theme-api' as nb;\n@each $r in nb.$a11y-roles { .role-#{$r} { x: 1 } }\n`,
      {
        loadPaths: [ROOT],
        importers: [
          {
            findFileUrl(url) {
              if (!url.startsWith('@nubisco/ui/')) return null
              return new URL(
                `file://${join(ROOT, 'src', url.slice('@nubisco/ui/'.length))}`,
              )
            },
          },
        ],
      },
    ).css
    const fromScss = [...source.matchAll(/\.role-([a-z-]+)/g)].map((m) => m[1])
    expect(fromScss.sort()).toEqual([...A11Y_ROLES].sort())
  })
})
