// Category accent contrast guard.
//
// The four category accents in `src/styles/variables/_categories.scss` are
// hand-picked values. Nothing about them is self-evident from reading the hex,
// so an edit that looks harmless can quietly drop one below the bar, and the
// failure mode is a product shipping illegible links.
//
// The reference surfaces are the library's OWN layers, not pure white and pure
// black. That distinction is the whole point of this file: measured against
// white, the original creatives gold (#8f6b00) read 4.92 and looked fine, but
// the library never renders a pure-white surface, and on the real page
// background it read 4.23 and on layer-2 it read 4.01. Measuring against a
// surface the product cannot actually show is how a value gets signed off
// failing.
//
// Like `layerContrast.test.ts`, this compiles the real stylesheet and resolves
// the real custom properties, so it measures what ships rather than what the
// source says.

import { describe, it, expect } from 'vitest'
import { resolve } from 'node:path'
import * as sass from 'sass-embedded'
import {
  ROOT,
  loadThemeResolvers,
  parseColor,
  propsFrom,
  ratio,
  resolver,
} from '../scripts/lib/layerTokens.mjs'

/** WCAG AA for body text. An accent is text-on-surface, so this is the bar. */
const AA = 4.5

/** Every category the library ships. Adding one here is intentional work. */
const CATEGORIES = ['creatives', 'engineers', 'home', 'fun'] as const

/** The surface layers an accent can land on, per mode. */
const LEVELS = [0, 1, 2, 3] as const

/** The accent roles that are drawn as colour on a surface. */
const ROLES = ['primary', 'primary-hover', 'primary-active'] as const

/** Compiles one themed scope and returns a resolver for each half. */
function themeResolvers(scss: string, id: string) {
  const { css } = sass.compileString(`@use 'theme-api' as nb;\n${scss}`, {
    loadPaths: [resolve(ROOT, 'src/styles')],
    style: 'compressed',
  })
  const light = propsFrom(
    css,
    new RegExp(`^\\[data-nb-theme=["']?${id}["']?\\]$`),
  )
  const dark = propsFrom(
    css,
    new RegExp(`\\.dark\\s*\\[data-nb-theme=["']?${id}["']?\\]`),
  )
  return {
    light: resolver([light]),
    dark: resolver([light, dark]),
  }
}

const surfaces = (() => {
  const { light, dark } = loadThemeResolvers()
  return {
    light: LEVELS.map((i) => light(`--nb-c-layer-${i}`) as string),
    dark: LEVELS.map((i) => dark(`--nb-c-layer-${i}`) as string),
  }
})()

describe('category accents clear AA on every surface the library renders', () => {
  for (const category of CATEGORIES) {
    const { light, dark } = themeResolvers(
      `@include nb.app-theme('probe', $category: '${category}');`,
      'probe',
    )

    for (const [mode, get, grounds] of [
      ['light', light, surfaces.light],
      ['dark', dark, surfaces.dark],
    ] as const) {
      for (const role of ROLES) {
        it(`${category} ${role} (${mode})`, () => {
          const value = get(`--nb-c-${role}`)
          expect(value, `${role} resolved to nothing`).toBeTruthy()
          const colour = parseColor(value as string)
          expect(colour, `${value} did not parse`).toBeTruthy()

          for (const [i, ground] of grounds.entries()) {
            const r = ratio(value as string, ground)
            expect(
              r,
              `${category} ${role} ${value} on ${mode} layer-${i} ${ground} is ${r.toFixed(2)}:1`,
            ).toBeGreaterThanOrEqual(AA)
          }
        })
      }
    }
  }
})

describe('the accent an app supplies is held to the same bar', () => {
  // The library cannot test an accent it never sees, so this covers the shape
  // rather than a specific product's value: an override still has to clear AA,
  // and the assertion below is the one an app's own test should make.
  const { light, dark } = themeResolvers(
    `@include nb.app-theme('probe', $category: 'creatives', $accent: (#0b7285, #41d6e0));`,
    'probe',
  )

  it('an overridden accent replaces the category accent', () => {
    expect(parseColor(light('--nb-c-primary') as string)).toBeTruthy()
    // The category travels separately, so a surface grouping products by
    // audience still gets the audience colour and not the app's own.
    expect(light('--nb-c-category')).toBe('#846201')
    expect(dark('--nb-c-category')).toBe('#e8c15a')
  })

  it('an overridden accent clears AA on every surface', () => {
    for (const [get, grounds] of [
      [light, surfaces.light],
      [dark, surfaces.dark],
    ] as const) {
      for (const role of ROLES) {
        const value = get(`--nb-c-${role}`) as string
        for (const ground of grounds) {
          expect(ratio(value, ground)).toBeGreaterThanOrEqual(AA)
        }
      }
    }
  })
})

describe('the guard actually bites', () => {
  // A contrast test that cannot fail is decoration. This proves the mechanism
  // by feeding it a value that must not pass.
  it('rejects an accent that is too light for a light surface', () => {
    const { light } = themeResolvers(
      `@include nb.app-theme('probe', $category: 'fun', $accent: (#f0d0dd, #f686ae));`,
      'probe',
    )
    const value = light('--nb-c-primary') as string
    const worst = Math.min(...surfaces.light.map((g) => ratio(value, g)))
    expect(worst).toBeLessThan(AA)
  })
})
